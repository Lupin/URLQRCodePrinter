/**
 * Archive d'une planche d'étiquettes.
 *
 * Le mode tableau savait produire un dossier — `table.html`, `table.json` et
 * ses QR Codes en images. La planche, non : elle ne s'imprimait que par la
 * fenêtre. Ce module comble ce manque, et il le fait d'une manière qui mérite
 * d'être dite.
 *
 * **Le HTML de la planche n'est pas reconstruit ici.** Il est repris tel quel de
 * ce que l'application a rendu pour l'aperçu et pour l'impression — le même
 * document, les mêmes règles, la même feuille de style. Reconstruire une
 * géométrie en millimètres dans un second endroit aurait produit une seconde
 * formule, et le fichier exporté aurait fini par ne plus ressembler à ce qui
 * sort de l'imprimante. C'est le reproche qu'on ne veut pas lire : « l'aperçu
 * était juste, l'export non ».
 *
 * Ce que ce module ajoute, et qui n'existe nulle part ailleurs : la page
 * autonome. La feuille de style de l'application masque la racine d'impression à
 * l'écran — elle n'est faite que pour le papier. Dans le fichier exporté, cette
 * racine **est** la page : on veut pouvoir la regarder avant d'imprimer, et
 * l'imprimer telle quelle ensuite.
 */

import { createZip } from './zip.js';
import { exportFilename, escapeCsvField } from './exporters.js';

/** Identifiant du format, écrit dans le manifeste. Stable : il est persisté. */
export const SHEET_ARCHIVE_FORMAT = 'url-qr-code-printer/sheet';

/**
 * Nom de fichier de l'archive d'une planche.
 *
 * Le nom de la collection est conservé : c'est ce qui permet de retrouver
 * l'archive dans un dossier de téléchargements. « planche » le distingue du
 * dossier du tableau, qui porte, lui, le nom seul.
 *
 * @param {number} [now]
 * @param {string} [base] Nom de la collection.
 * @returns {string}
 */
export function sheetArchiveName(now = Date.now(), base = 'etiquettes') {
  return exportFilename(`${base} planche`, 'zip', now || Date.now());
}

/** Le séparateur des CSV produits : le point-virgule, qu'attend un tableur
 * français. Le BOM en tête aide Excel à reconnaître l'UTF-8 ; l'échappement
 * vient de `exporters.js`, où il est déjà éprouvé — une seconde copie locale
 * aurait été refusée par le build, qui détecte les déclarations en collision. */
const DELIMITEUR_CSV = ';';

/**
 * Échappe un texte destiné à du balisage.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeSheetHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Assemble la page autonome.
 *
 * @param {{
 *   pagesHtml: string,
 *   css: string,
 *   title?: string,
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 * }} options
 * @returns {string}
 */
export function buildSheetHtml(options) {
  const titre = escapeSheetHtml(options.title || 'Ma collection');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre} — planche d'étiquettes</title>
<style>
  /* La taille du papier, comme à l'impression : une planche Letter ne doit pas
     partir sur du A4. */
  @page { size: ${options.pageWidthMm}mm ${options.pageHeightMm}mm; margin: 0; }
</style>
<style>
${options.css ?? ''}
</style>
<style>
  /* La feuille de style de l'application masque la racine d'impression à
     l'écran. Ici elle **est** la page : on veut la voir avant d'imprimer. */
  body { margin: 0; }
  .print-root { display: block !important; padding: 6mm; background: #f4f4f2; }
  .print-page { margin: 0 auto 6mm; box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15); }
  .print-root > .print-page:last-child { margin-bottom: 0; }
  @media print {
    .print-root { padding: 0; background: #fff; }
    .print-page { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="print-root">
${options.pagesHtml}
</div>
</body>
</html>
`;
}

/**
 * Construit l'archive d'une planche.
 *
 * Trois fichiers, comme le dossier du tableau : la page à imprimer, le
 * manifeste qui dit comment elle a été obtenue, et la correspondance entre les
 * liens et les étiquettes.
 *
 * @param {{
 *   pagesHtml: string,
 *   css: string,
 *   title?: string,
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   layout: { columns: number, rows: number, perPage: number, pages: number,
 *     labelWidthMm: number, labelHeightMm: number, marginXMm: number,
 *     marginYMm: number },
 *   qrRatio: number,
 *   qrSideMm: number,
 *   fontPt: number,
 *   options?: object,
 *   cells: Array<{ index: number, page: number, column: number, row: number,
 *     url: string, title?: string }>,
 *   now?: number,
 * }} options
 * @returns {{ bytes: Uint8Array, manifest: object }}
 */
export function buildSheetArchive(options) {
  const now = options.now ?? Date.now();
  const cells = options.cells ?? [];
  const layout = options.layout;

  const html = buildSheetHtml({
    pagesHtml: options.pagesHtml,
    css: options.css,
    title: options.title,
    pageWidthMm: options.pageWidthMm,
    pageHeightMm: options.pageHeightMm,
  });

  const entetes = ['N°', 'Page', 'Colonne', 'Rangée', 'URL', 'Titre'];
  const lignes = cells.map((cell) => [
    cell.index + 1,
    cell.page + 1,
    cell.column + 1,
    cell.row + 1,
    cell.url,
    cell.title ?? '',
  ]);
  const csv = '\uFEFF' + [entetes, ...lignes]
    .map((ligne) => ligne.map((cellule) => escapeCsvField(cellule, DELIMITEUR_CSV)).join(DELIMITEUR_CSV))
    .join('\r\n') + '\r\n';

  const manifest = {
    format: SHEET_ARCHIVE_FORMAT,
    version: 1,
    exportedAt: new Date(now).toISOString(),
    title: options.title ?? '',
    page: { widthMm: options.pageWidthMm, heightMm: options.pageHeightMm },
    grid: {
      columns: layout.columns,
      rows: layout.rows,
      perPage: layout.perPage,
      pages: layout.pages,
    },
    label: { widthMm: layout.labelWidthMm, heightMm: layout.labelHeightMm },
    margins: { xMm: layout.marginXMm, yMm: layout.marginYMm },
    qr: { ratio: options.qrRatio, sideMm: options.qrSideMm },
    fontPt: options.fontPt,
    // Les cases cochées au moment de l'export : sans elles, le manifeste
    // décrirait une planche qu'on ne saurait pas reproduire.
    options: options.options ?? {},
    count: cells.length,
    cells,
  };

  const bytes = createZip([
    { name: 'planche.html', data: html },
    { name: 'liens.csv', data: csv },
    { name: 'planche.json', data: `${JSON.stringify(manifest, null, 2)}\n` },
  ], { date: new Date(now) });

  return { bytes, manifest };
}
