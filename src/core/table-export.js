/**
 * Export du tableau en dossier autonome : un modèle JSON, ses QR codes PNG et
 * une page HTML prête à l'emploi.
 *
 * Le tableau de l'onglet « Tableau » n'avait aucune sortie réutilisable : ses
 * colonnes et ses QR codes ne quittaient le navigateur que par l'impression.
 * Ici, on produit un dossier qu'on ouvre, qu'on sert ou qu'on donne à lire à
 * une application. Chaque ligne porte son image PNG — utilisable telle quelle
 * dans une page, un traitement de texte ou un CMS, sans exiger du consommateur
 * qu'il sache rendre un SVG.
 *
 * Le PNG est rendu à une échelle **entière** : les modules tombent sur des
 * pixels nets, si bien qu'une vectorisation ultérieure retrouve le motif sans
 * lisser les bords. Le modèle conserve l'URL encodée, la correction d'erreur et
 * la bordure, de sorte qu'une régénération produise exactement le même code.
 *
 * Ce module est pur : il reçoit des LinkRecord et assemble l'archive. Le rendu
 * passe par l'encodeur PNG maison, qui n'utilise que des API présentes dans
 * Node comme dans le navigateur.
 */

import { encodeQr } from './qr.js';
import { encodePng } from './png.js';
import { createZip } from './zip.js';
import { formatCaptureDate, formatDateTime } from './exporters.js';

/** Identifiant du format, tel qu'il part dans le JSON. */
export const TABLE_EXPORT_FORMAT = 'url-qr-code-printer/table';

/** Version du format, à incrémenter en cas de rupture. */
export const TABLE_EXPORT_VERSION = 1;

/** Dossier des images dans l'archive. */
export const QR_DIRECTORY = 'qr';

/**
 * Colonnes du tableau, dans l'ordre d'impression de `buildTable`.
 *
 * La clé sert d'identifiant dans le JSON ; le libellé n'est employé que par le
 * rendu HTML, en français, comme les autres exports texte de l'application.
 */
export const TABLE_COLUMNS = Object.freeze([
  { key: 'index', label: 'N°' },
  { key: 'qr', label: 'QR' },
  { key: 'url', label: 'URL' },
  { key: 'title', label: 'Titre' },
  { key: 'date', label: 'Date' },
  { key: 'tags', label: 'Tags' },
  { key: 'note', label: 'Note' },
]);

/**
 * Réglages d'encodage et de taille des images QR.
 *
 * `maxSize` borne la largeur : une URL longue ne doit pas produire une image
 * démesurée. L'échelle demandée est un plafond ; elle est réduite, jamais
 * multipliée, pour rester un entier sous la borne.
 */
export const DEFAULT_TABLE_EXPORT_OPTIONS = Object.freeze({
  ecc: 'M',
  border: 2,
  scale: 10,
  maxSize: 720,
});

/**
 * Clés des colonnes retenues, dans l'ordre du tableau imprimé.
 *
 * @param {{ index?: boolean, qr?: boolean, url?: boolean, title?: boolean, date?: boolean, tags?: boolean, note?: boolean }} [columns]
 * @returns {string[]}
 */
export function tableColumnKeys(columns = {}) {
  return TABLE_COLUMNS.filter((column) => columns[column.key]).map((column) => column.key);
}

/**
 * Échelle entière qui tient dans la largeur maximale.
 *
 * @param {number} moduleCount
 * @param {number} requested
 * @param {number} maxSize
 * @returns {number}
 */
function fitScale(moduleCount, requested, maxSize) {
  const wanted = Math.max(1, Math.floor(Number(requested) || 1));
  const room = Math.max(1, Math.floor(maxSize / moduleCount));
  return Math.min(wanted, room);
}

/**
 * Nom d'entrée du PNG, garanti ASCII : l'écriture ZIP refuse le reste.
 *
 * @param {import('./link.js').LinkRecord} link
 * @param {number} index
 * @returns {string}
 */
function qrFileName(link, index) {
  const stem = String(link.id ?? '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${QR_DIRECTORY}/${stem || `lien-${index + 1}`}.png`;
}

/**
 * Construit le modèle du tableau et les matrices QR prêtes à rendre.
 *
 * Le modèle est sérialisable tel quel ; les matrices restent en mémoire, car
 * un tableau de booléens n'a pas sa place dans un JSON destiné à un lecteur
 * humain. `buildTableArchive` les transforme en PNG et les référence.
 *
 * @param {import('./link.js').LinkRecord[]} links Liens déjà résolus par `resolveTargets`.
 * @param {{
 *   title?: string,
 *   columns?: object,
 *   dateMode?: 'none'|'date'|'datetime',
 *   rankOf?: (link: import('./link.js').LinkRecord, index: number) => number,
 *   ecc?: 'L'|'M'|'Q'|'H',
 *   border?: number,
 *   scale?: number,
 *   maxSize?: number,
 *   now?: number,
 * }} [options]
 * @returns {{ model: object, images: Map<string, { matrix: import('./qr.js').QrMatrix, scale: number }> }}
 */
export function buildTableModel(links, options = {}) {
  const columns = options.columns ?? {};
  const ecc = options.ecc ?? DEFAULT_TABLE_EXPORT_OPTIONS.ecc;
  const border = Number.isInteger(options.border) ? options.border : DEFAULT_TABLE_EXPORT_OPTIONS.border;
  const requestedScale = options.scale ?? DEFAULT_TABLE_EXPORT_OPTIONS.scale;
  const maxSize = options.maxSize ?? DEFAULT_TABLE_EXPORT_OPTIONS.maxSize;
  const dateMode = options.dateMode ?? 'date';
  const now = options.now ?? Date.now();
  const rankOf = options.rankOf ?? ((_link, index) => index + 1);

  /** @type {Map<string, { matrix: import('./qr.js').QrMatrix, scale: number }>} */
  const images = new Map();
  const selected = tableColumnKeys(columns);

  const rows = links.map((link, index) => {
    /** @type {Record<string, unknown>} */
    const row = {};

    if (columns.index) row.index = rankOf(link, index);
    if (columns.url) row.url = link.url;
    if (columns.title) row.title = link.title ?? '';
    if (columns.date) row.date = formatCaptureDate(link.createdAt, dateMode);
    if (columns.tags) row.tags = Array.isArray(link.tags) ? [...link.tags] : [];
    if (columns.note) row.note = link.note ?? '';

    // Quand le QR encode un raccourci, l'adresse collectée reste consignée :
    // aucune sortie ne doit perdre une URL. Elle n'est pas une colonne — le
    // tableau ne l'affiche pas — mais le modèle la conserve.
    const original = typeof link.originalUrl === 'string' ? link.originalUrl : '';
    if (original && original !== link.url) row.sourceUrl = original;

    if (columns.qr) {
      const file = qrFileName(link, index);
      const matrix = encodeQr(link.url, { ecc, border });
      const scale = fitScale(matrix.size, requestedScale, maxSize);
      row.qr = {
        file,
        content: link.url,
        ecc,
        border,
        version: matrix.version,
        scale,
        sizePx: matrix.size * scale,
      };
      images.set(file, { matrix, scale });
    }

    return row;
  });

  return {
    model: {
      format: TABLE_EXPORT_FORMAT,
      version: TABLE_EXPORT_VERSION,
      exportedAt: new Date(now).toISOString(),
      title: options.title ?? 'Mes liens',
      count: links.length,
      columns: selected,
      dateMode,
      qr: { ecc, border, scale: requestedScale, maxSize },
      rows,
    },
    images,
  };
}

/**
 * Échappe un texte pour le HTML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeTableHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Construit la page HTML du tableau, images en chemins relatifs.
 *
 * C'est le chemin le plus court vers un résultat visible : on ouvre le fichier
 * dans un navigateur, et le tableau est là, sans écrire une ligne de code. Le
 * fichier reste lisible à côté de ses images, comme la planche d'étiquettes.
 *
 * @param {object} model Modèle produit par `buildTableModel`.
 * @returns {string}
 */
export function buildTableHtml(model) {
  const columns = TABLE_COLUMNS.filter((column) => model.columns.includes(column.key));

  const head = columns.map((column) => `<th>${escapeTableHtml(column.label)}</th>`).join('');

  const rows = model.rows.map((row) => {
    const cells = columns.map((column) => {
      if (column.key === 'qr') {
        const qr = row.qr ?? {};
        return `<td class="qr"><img src="${escapeTableHtml(qr.file)}" alt="${escapeTableHtml(qr.content)}" width="${qr.sizePx}" height="${qr.sizePx}"></td>`;
      }
      if (column.key === 'tags') {
        return `<td>${escapeTableHtml((row.tags ?? []).join(' '))}</td>`;
      }
      return `<td>${escapeTableHtml(String(row[column.key] ?? ''))}</td>`;
    }).join('');
    return `      <tr>${cells}</tr>`;
  }).join('\n');

  const exported = formatDateTime(Date.parse(model.exportedAt));

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeTableHtml(model.title)} — tableau</title>
<style>
  body { margin: 0; padding: 8mm; font-family: -apple-system, system-ui, sans-serif; background: #f4f4f2; color: #111; }
  h1 { font-size: 14pt; margin: 0 0 2mm; }
  p.meta { margin: 0 0 6mm; color: #555; font-size: 9pt; }
  table { border-collapse: collapse; background: #fff; width: 100%; }
  th, td { border: 0.2mm solid #bbb; padding: 1.5mm 2mm; text-align: left; vertical-align: middle; font-size: 9pt; }
  th { background: #eee; }
  td.qr { width: 0; }
  td.qr img { display: block; image-rendering: pixelated; }
  @media print {
    body { background: #fff; padding: 0; }
    p.meta { display: none; }
  }
</style>
</head>
<body>
<h1>${escapeTableHtml(model.title)}</h1>
<p class="meta">${model.count} lien${model.count > 1 ? 's' : ''} — exporté le ${escapeTableHtml(exported)}</p>
<table>
  <thead>
    <tr>${head}</tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
</body>
</html>
`;
}

/**
 * Rend une matrice QR en image RVBA agrandie d'un facteur entier.
 *
 * @param {import('./qr.js').QrMatrix} matrix
 * @param {number} scale
 * @returns {{ width: number, height: number, data: Uint8Array }}
 */
function rgbaFromQr(matrix, scale) {
  const size = matrix.size * scale;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const source = matrix.data[Math.floor(y / scale)];
    for (let x = 0; x < size; x++) {
      const dark = source[Math.floor(x / scale)];
      const offset = (y * size + x) * 4;
      const value = dark ? 0 : 255;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 0xff;
    }
  }

  return { width: size, height: size, data };
}

/**
 * Assemble le dossier du tableau : `table.json`, `table.html` et `qr/*.png`.
 *
 * Le JSON est le contrat — il décrit les colonnes, les lignes et, pour chaque
 * QR, de quoi le régénérer à l'identique. Les images sont là pour l'usage
 * direct, et le HTML pour n'avoir rien à coder.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {Parameters<typeof buildTableModel>[1] & { onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<{ bytes: Uint8Array, model: object }>}
 */
export async function buildTableArchive(links, options = {}) {
  const { model, images } = buildTableModel(links, options);
  const entries = [];

  let done = 0;
  for (const row of model.rows) {
    if (!row.qr) continue;
    const image = images.get(row.qr.file);
    const png = await encodePng(rgbaFromQr(image.matrix, image.scale));
    entries.push({ name: row.qr.file, data: png });
    options.onProgress?.(++done, images.size);
  }

  entries.push({ name: 'table.json', data: JSON.stringify(model, null, 2) + '\n' });
  entries.push({ name: 'table.html', data: buildTableHtml(model) });

  const bytes = createZip(entries, { date: new Date(model.exportedAt) });
  return { bytes, model };
}
