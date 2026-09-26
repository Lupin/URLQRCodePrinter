/**
 * Archive des étiquettes composées pour une imprimante Niimbot.
 *
 * Elle existe parce que l'onglet Niimbot ne savait produire **que** par
 * l'imprimante : sans matériel connecté, ses réglages — profil, consommable,
 * densité, orientation, taille du texte, contenu — ne servaient à rien. L'onglet
 * « Étiquette (divers) » exportait bien un dossier d'images, mais avec **ses**
 * réglages : format d'étiquette en millimètres et mode de texte, qui ne sont pas
 * ceux de la composition Niimbot. On ne pouvait donc pas obtenir l'image de ce
 * qu'on venait de composer.
 *
 * Ce module reçoit les images **déjà rendues**, par le même chemin que
 * l'impression et l'aperçu : `composeLabel` puis `drawLabel`, à la résolution de
 * la tête. Ce que le dossier contient est donc ce qui serait sorti — et non une
 * seconde composition qui lui ressemble.
 *
 * Les images sont accompagnées du manifeste qui les décrit et du CSV qui les
 * relie aux liens, comme les autres dossiers du projet.
 */

import { createZip } from './zip.js';
import { exportFilename, toCsvTable } from './exporters.js';

/** Identifiant du format, écrit dans le manifeste. Stable : il est persisté. */
export const LABEL_ARCHIVE_FORMAT = 'url-qr-code-printer/printer-labels';

/**
 * Nom de fichier de l'archive.
 *
 * Le nom de la collection est conservé — c'est ce qui permet de retrouver
 * l'archive dans un dossier de téléchargements — et « niimbot » la distingue du
 * dossier d'images de l'autre onglet, qui porte le nom seul.
 *
 * @param {number} [now]
 * @param {string} [base]
 * @returns {string}
 */
export function printerLabelArchiveName(now = Date.now(), base = 'etiquettes') {
  return exportFilename(`${base} niimbot`, 'zip', now || Date.now());
}

/**
 * Assemble l'archive.
 *
 * @param {{
 *   labels: Array<{ fileName: string, png: Uint8Array, widthMm: number,
 *     heightMm: number, widthPx: number, heightPx: number, pxPerModule?: number,
 *     url: string, title?: string }>,
 *   settings: object,
 *   title?: string,
 *   now?: number,
 * }} options
 * @returns {{ bytes: Uint8Array, manifest: object }}
 */
export function buildPrinterLabelArchive(options) {
  const now = options.now ?? Date.now();
  const labels = options.labels ?? [];

  const entrees = labels.map((label) => ({
    name: `etiquettes/${label.fileName}`,
    data: label.png,
  }));

  const csv = toCsvTable(
    ['N°', 'URL', 'Titre', 'Largeur (mm)', 'Hauteur (mm)', 'Image'],
    labels.map((label, index) => [
      index + 1,
      label.url,
      label.title ?? '',
      label.widthMm,
      label.heightMm,
      `etiquettes/${label.fileName}`,
    ]),
  );

  const manifest = {
    format: LABEL_ARCHIVE_FORMAT,
    version: 1,
    exportedAt: new Date(now).toISOString(),
    title: options.title ?? '',
    // Tous les réglages de l'onglet Niimbot : sans eux, le dossier décrirait des
    // étiquettes qu'on ne saurait pas recomposer.
    settings: options.settings ?? {},
    count: labels.length,
    labels: labels.map((label) => ({
      file: `etiquettes/${label.fileName}`,
      url: label.url,
      title: label.title ?? '',
      widthMm: label.widthMm,
      heightMm: label.heightMm,
      widthPx: label.widthPx,
      heightPx: label.heightPx,
      ...(label.pxPerModule === undefined ? {} : { pxPerModule: label.pxPerModule }),
    })),
  };

  entrees.push({ name: 'liens.csv', data: csv });
  entrees.push({ name: 'etiquettes.json', data: `${JSON.stringify(manifest, null, 2)}\n` });

  return { bytes: createZip(entrees, { date: new Date(now) }), manifest };
}

/**
 * Nom de fichier d'une étiquette dans l'archive.
 *
 * Le rang vient en tête pour que le dossier se lise dans l'ordre de la
 * collection, et le titre est réduit à ce qui passe dans un nom de fichier.
 *
 * @param {number} index Rang, à partir de 1.
 * @param {string} label Titre du lien, ou son URL.
 * @param {number} [largeur] Largeur du numéro, pour l'alignement.
 * @returns {string}
 */
export function printerLabelFileName(index, label, largeur = 2) {
  const rang = String(index).padStart(largeur, '0');
  const base = String(label ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .toLowerCase();
  return base === '' ? `${rang}-etiquette.png` : `${rang}-${base}.png`;
}
