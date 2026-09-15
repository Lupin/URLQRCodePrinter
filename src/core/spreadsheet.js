/**
 * Export tableur, avec les QR codes intégrés.
 *
 * Un CSV ne peut pas transporter d'image : c'est la raison d'être de cet
 * export, qui produit un vrai classeur `.xlsx` où chaque ligne porte son QR.
 *
 * La construction du classeur vit dans `core/xlsx.js` ; ce module ne fait que
 * décider de sa mise en forme — quelles colonnes, quelle taille d'image, quels
 * en-têtes.
 */

import { sourceHost, sourceUrl } from './link.js';
import { hasAnyNote } from './exporters.js';
import { qrPng } from './qr.js';
import { buildXlsx } from './xlsx.js';
import { formatDateTime } from './exporters.js';

/**
 * Taille d'image visée, en pixels, avant réduction au besoin.
 *
 * 96 px : à 96 dpi cela fait exactement un pouce (25,4 mm), soit un QR d'environ
 * 21 mm de côté une fois posé — imprimable, scannable, et assez petit pour que
 * dix lignes tiennent sur une page. Une image plus grande obligeait à des lignes
 * de 100 points, et le tableau ne tenait plus sur une page en largeur.
 */
const QR_TARGET_PX = 96;

/** En-têtes du classeur, dans l'ordre des colonnes, sans la note. */
export const SPREADSHEET_HEADERS = ['N°', 'URL', 'Titre', 'Domaine', 'Tags', 'Ajouté le', 'QR code'];

/**
 * Largeur de la colonne des QR codes, en unités Excel (caractères).
 *
 * 19 unités ≈ 138 px, pour une image de 96 px : elle tient dans sa cellule avec
 * de la marge, sans déborder sur la colonne suivante.
 */
export const QR_WIDTH_UNITS = 19;

/** Index de la colonne qui reçoit les images, dans la forme de référence. */
export const QR_COLUMN_INDEX = SPREADSHEET_HEADERS.indexOf('QR code');

/**
 * Colonnes réellement écrites, et index de celle qui porte les images.
 *
 * La colonne « Note » n'est ajoutée que si au moins un lien en a une : un
 * classeur ne doit pas transporter une colonne vide sur toute sa hauteur. Elle
 * se place **avant** la colonne des QR codes, dont l'index est donc recalculé —
 * une image ancrée sur la mauvaise colonne serait invisible.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {{ headers: string[], qrColumn: number, noteColumn: number }}
 */
export function spreadsheetLayout(links) {
  const withNote = hasAnyNote(links);
  const headers = [
    'N°', 'URL', 'Titre', 'Domaine', 'Tags',
    ...(withNote ? ['Note'] : []),
    'Ajouté le', 'QR code',
  ];
  return {
    headers,
    qrColumn: headers.indexOf('QR code'),
    noteColumn: withNote ? headers.indexOf('Note') : -1,
  };
}

/**
 * Construit le classeur des liens, avec leurs QR codes.
 *
 * Le classeur reçoit les liens **déjà résolus** par `resolveTargets` : l'URL de
 * la colonne « URL » est donc exactement celle qu'encode l'image QR de la même
 * ligne, ce qui est tout l'intérêt d'un tableur imprimé. L'URL d'origine, quand
 * elle diffère, apparaît dans une colonne ajoutée en fin de tableau.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{ now?: number, onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<Uint8Array>}
 */
export async function buildLinkSpreadsheet(links, options = {}) {
  const now = options.now ?? Date.now();

  const withOriginal = links.some((link) => sourceUrl(link) !== link.url);
  const layout = spreadsheetLayout(links);
  const headers = withOriginal
    ? [...layout.headers, 'URL d\'origine']
    : layout.headers;

  const rows = links.map((link, index) => [
    index + 1,
    link.url,
    link.title,
    sourceHost(link),
    // Tags sans « # » : dans un tableur, le dièse n'apporte rien et gêne le
    // filtrage. C'est la même forme que la colonne « Tags » du CSV.
    link.tags.join(' '),
    ...(layout.noteColumn >= 0 ? [link.note] : []),
    formatDateTime(link.createdAt),
    // La cellule sous l'image reste vide : le QR est ancré par-dessus.
    '',
    ...(withOriginal ? [sourceUrl(link) === link.url ? '' : sourceUrl(link)] : []),
  ]);

  const images = [];
  for (const [index, link] of links.entries()) {
    const png = await qrPng(link.url, { scale: 8, maxSize: QR_TARGET_PX, border: 2 });
    // `row` compte la ligne d'en-tête : les données commencent à la ligne 1.
    images.push({
      row: index + 1,
      column: layout.qrColumn,
      data: png,
      widthPx: QR_TARGET_PX,
      heightPx: QR_TARGET_PX,
    });
    options.onProgress?.(index + 1, links.length);
  }

  // Largeurs alignées sur les colonnes réellement écrites. La colonne du QR
  // fait au moins la largeur de l'image (19 unités ≈ 138 px) : une image plus
  // large que sa cellule déborde sur la voisine, et un lecteur qui rogne à la
  // cellule en couperait un morceau.
  const baseWidths = [5, 55, 32, 20, 18, ...(layout.noteColumn >= 0 ? [40] : []), 17, QR_WIDTH_UNITS];
  const widths = withOriginal ? [...baseWidths, 55] : baseWidths;

  return buildXlsx({
    sheetName: 'Liens',
    headers,
    rows,
    images,
    widths,
    date: new Date(now),
  });
}
