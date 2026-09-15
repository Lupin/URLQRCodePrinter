/**
 * Export d'étiquettes en images.
 *
 * Le principe : plutôt que de parler à chaque modèle d'étiqueteuse — ce qui
 * suppose du matériel, un protocole et des pilotes — on produit un dossier
 * d'images **prêtes à imprimer**. Libre à l'utilisateur de les passer à
 * l'imprimante qu'il veut : l'application du fabricant, un traitement de texte,
 * un navigateur, ou une Niimbot via le module dédié.
 *
 * Chaque image contient le QR code et le texte choisi. Le dossier emporte aussi
 * une planche HTML imprimable, un CSV reliant chaque URL à son image, et le
 * détail des réglages — de quoi reproduire l'export à l'identique.
 *
 * Ce module ne fait que **planifier** : il calcule des dimensions en pixels et
 * prépare l'archive. Le rendu des images lui-même appartient à l'appelant, qui
 * dispose d'un canvas — c'est la seule partie qui ne peut pas vivre ici.
 */

import { encodeQr } from './qr.js';
import { wrapText, mmToPx } from './label.js';
import { sourceHost, sourceUrl, hasShortUrl } from './link.js';
import { createZip } from './zip.js';
import { exportFilename } from './exporters.js';

/**
 * Formats d'étiquettes courants.
 *
 * `heightMm: null` signifie que la hauteur découle du contenu — c'est le cas
 * des rouleaux continus, où l'on coupe après impression.
 */
export const LABEL_FORMATS = Object.freeze([
  {
    id: 'niimbot-d110',
    name: 'Niimbot D110 — 12 mm utile (203 dpi)',
    widthMm: 12,
    heightMm: null,
    dpi: 203,
  },
  {
    id: 'niimbot-m2',
    name: 'Niimbot M2 — 48 mm (300 dpi)',
    widthMm: 48,
    heightMm: null,
    dpi: 300,
  },
  {
    id: 'brother-62',
    name: 'Brother QL — 62 mm (300 dpi)',
    widthMm: 62,
    heightMm: 40,
    dpi: 300,
  },
  {
    id: 'dymo-54',
    name: 'Dymo LabelWriter — 54 mm (300 dpi)',
    widthMm: 54,
    heightMm: 32,
    dpi: 300,
  },
  {
    id: 'zebra-2in',
    name: 'Zebra 2 pouces — 54 mm (203 dpi)',
    widthMm: 54,
    heightMm: 25,
    dpi: 203,
  },
  {
    id: 'generic-50x30',
    name: 'Générique — 50 × 30 mm (300 dpi)',
    widthMm: 50,
    heightMm: 30,
    dpi: 300,
  },
  {
    id: 'generic-70x40',
    name: 'Générique — 70 × 40 mm (300 dpi)',
    widthMm: 70,
    heightMm: 40,
    dpi: 300,
  },
  {
    id: 'avery-3x8',
    name: 'Planche A4 — 3 × 8 (63,5 × 33,9 mm)',
    widthMm: 63.5,
    heightMm: 33.9,
    dpi: 300,
  },
]);

/** Contenu textuel imprimé sous le QR code. */
export const TEXT_MODES = Object.freeze({
  'title-url': 'Titre puis URL',
  url: 'URL seule',
  title: 'Titre seul',
  none: 'Aucun texte',
  host: 'Domaine seul',
});

/** Réglages par défaut de l'export. */
export const DEFAULT_EXPORT_OPTIONS = Object.freeze({
  formatId: 'niimbot-d110',
  textMode: 'url',
  marginMm: 1.5,
  qrRatio: 0.9,
  fontSizePt: 7,
  cutMarks: true,
  maxLines: 4,
});

// `mmToPx` vient de `label.js` : le redéclarer ici provoquerait une collision
// de noms au moment de l'assemblage, l'un des deux masquant l'autre.

/**
 * Convertit des points typographiques en pixels.
 * @param {number} pt
 * @param {number} dpi
 * @returns {number}
 */
export function ptToPx(pt, dpi) {
  return Math.round((pt / 72) * dpi);
}

/**
 * Retrouve un format par son identifiant.
 * @param {string} id
 * @returns {typeof LABEL_FORMATS[number]}
 */
export function findFormat(id) {
  return LABEL_FORMATS.find((format) => format.id === id) ?? LABEL_FORMATS[0];
}

/**
 * Compose les lignes de texte d'une étiquette.
 *
 * @param {import('./link.js').LinkRecord} link
 * @param {string} textMode
 * @returns {string[]}
 */
export function labelText(link, textMode) {
  switch (textMode) {
    case 'title-url': {
      const lines = [];
      if (link.title) lines.push(link.title);
      lines.push(link.url);
      return lines;
    }
    case 'title':
      return link.title ? [link.title] : [link.url];
    case 'host':
      // Le domaine imprimé est toujours celui du site visé, jamais celui du
      // raccourcisseur : « tinyurl.com » sous un QR n'apprendrait rien.
      return [sourceHost(link)];
    case 'none':
      return [];
    case 'url':
    default:
      return [link.url];
  }
}

/**
 * Produit un nom de fichier court, unique et lisible.
 *
 * @param {import('./link.js').LinkRecord} link
 * @param {number} index
 * @param {number} total
 * @returns {string}
 */
export function labelFileName(link, index, total) {
  const padding = String(total).length;
  const number = String(index + 1).padStart(padding, '0');

  const slug = (link.title || sourceHost(link) || 'lien')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${number}-${slug || 'lien'}.png`;
}

/**
 * Planifie une étiquette : dimensions en pixels et lignes de texte.
 *
 * @param {object} options
 * @param {import('./link.js').LinkRecord} options.link
 * @param {typeof LABEL_FORMATS[number]} options.format
 * @param {(text: string) => number} options.measure Mesure de texte, fournie
 *   par l'appelant — lui seul connaît la police réellement utilisée.
 * @param {string} [options.textMode]
 * @param {number} [options.marginMm]
 * @param {number} [options.qrRatio]
 * @param {number} [options.fontSizePt]
 * @param {number} [options.maxLines]
 * @returns {{
 *   widthPx: number, heightPx: number, marginPx: number, qrSizePx: number,
 *   qrScale: number, qrModules: number, fontSizePx: number, lineHeightPx: number,
 *   lines: string[], textTopPx: number, fits: boolean, url: string,
 * }}
 */
export function planLabel(options) {
  const { link, format, measure } = options;
  const textMode = options.textMode ?? DEFAULT_EXPORT_OPTIONS.textMode;
  const marginMm = options.marginMm ?? DEFAULT_EXPORT_OPTIONS.marginMm;
  const qrRatio = options.qrRatio ?? DEFAULT_EXPORT_OPTIONS.qrRatio;
  const fontSizePt = options.fontSizePt ?? DEFAULT_EXPORT_OPTIONS.fontSizePt;
  const maxLines = options.maxLines ?? DEFAULT_EXPORT_OPTIONS.maxLines;

  const widthPx = mmToPx(format.widthMm, format.dpi);
  const marginPx = Math.max(0, mmToPx(marginMm, format.dpi));
  const fontSizePx = Math.max(6, ptToPx(fontSizePt, format.dpi));
  const lineHeightPx = Math.ceil(fontSizePx * 1.2);
  const innerWidth = Math.max(1, widthPx - marginPx * 2);

  const matrix = encodeQr(link.url, { ecc: 'M', border: 2 });
  const lines = wrapText(measure, labelText(link, textMode).join(' '), innerWidth, { maxLines });
  const textHeight = lines.length * lineHeightPx;

  // Hauteur fixe (planche) ou déduite du contenu (rouleau continu).
  const fixedHeight = format.heightMm ? mmToPx(format.heightMm, format.dpi) : 0;
  const gap = lines.length > 0 ? marginPx : 0;

  let qrSizePx;
  if (fixedHeight > 0) {
    const available = fixedHeight - marginPx * 2 - gap - textHeight;
    const side = Math.max(16, Math.min(innerWidth, available));
    // Un QR fait un nombre entier de modules : on arrondit vers le bas.
    qrSizePx = Math.max(matrix.size * 2, Math.floor(side / matrix.size) * matrix.size);
  } else {
    qrSizePx = Math.max(matrix.size * 2, Math.floor((innerWidth * qrRatio) / matrix.size) * matrix.size);
  }

  const qrScale = qrSizePx / matrix.size;
  const heightPx = fixedHeight > 0
    ? fixedHeight
    : marginPx * 2 + qrSizePx + gap + textHeight;

  return {
    widthPx,
    heightPx,
    marginPx,
    qrSizePx,
    qrScale,
    qrModules: matrix.size,
    fontSizePx,
    lineHeightPx,
    lines,
    textTopPx: marginPx + qrSizePx + gap,
    // `false` signale que le QR ne tient pas dans la largeur utile : l'appelant
    // peut alors prévenir plutôt que de rogner en silence.
    fits: qrSizePx <= innerWidth,
    url: link.url,
  };
}

/**
 * Planifie toutes les étiquettes d'une collection.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {Omit<Parameters<typeof planLabel>[0], 'link'>} options
 * @returns {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: ReturnType<typeof planLabel> }>}
 */
export function planLabels(links, options) {
  return links.map((link, index) => ({
    link,
    fileName: labelFileName(link, index, links.length),
    plan: planLabel({ ...options, link }),
  }));
}

/**
 * Construit la planche HTML imprimable.
 *
 * C'est le chemin le plus court vers le papier : on ouvre le fichier dans un
 * navigateur, on imprime. Les images sont référencées en relatif, à côté du
 * fichier — l'archive entière est donc autonome.
 *
 * @param {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: object }>} planned
 * @param {{ title?: string, cutMarks?: boolean, format?: object }} [options]
 * @returns {string}
 */
export function buildPrintSheet(planned, options = {}) {
  const title = options.title ?? 'Mes liens';
  const cutMarks = options.cutMarks ?? DEFAULT_EXPORT_OPTIONS.cutMarks;
  const format = options.format ?? findFormat(DEFAULT_EXPORT_OPTIONS.formatId);

  const cells = planned
    .map(({ link, fileName, plan }) => {
      const text = plan.lines
        .map((line) => `<span>${escapeHtml(line)}</span>`)
        .join('');
      return `      <figure class="label${cutMarks ? ' label--cut' : ''}" style="--w:${format.widthMm}mm">
        <img src="etiquettes/${encodeURIComponent(fileName)}" alt="${escapeHtml(link.url)}" width="${plan.qrSizePx}" height="${plan.qrSizePx}">
        <figcaption>${text}</figcaption>
      </figure>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} — étiquettes</title>
<style>
  body { margin: 0; padding: 8mm; font-family: -apple-system, system-ui, sans-serif; background: #f4f4f2; }
  h1 { font-size: 12pt; margin: 0 0 6mm; }
  .sheet { display: flex; flex-wrap: wrap; gap: 3mm; }
  .label { width: var(--w); margin: 0; background: #fff; padding: 1.5mm; box-sizing: border-box;
           display: flex; flex-direction: column; align-items: center; gap: 1mm; break-inside: avoid; }
  .label--cut { outline: 0.2mm dashed #999; }
  .label img { display: block; max-width: 100%; height: auto; image-rendering: pixelated; }
  figcaption { font-size: 6pt; line-height: 1.2; text-align: center; word-break: break-all; }
  figcaption span { display: block; }
  @media print {
    body { background: #fff; padding: 0; }
    h1 { display: none; }
    .sheet { gap: 0; }
    .label--cut { outline-color: #ddd; }
  }
</style>
</head>
<body>
<h1>${escapeHtml(title)} — ${planned.length} étiquette${planned.length > 1 ? 's' : ''}</h1>
<div class="sheet">
${cells}
</div>
</body>
</html>
`;
}

/**
 * Échappe un texte pour le HTML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Assemble l'archive de l'export.
 *
 * @param {object} options
 * @param {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: object }>} options.planned
 * @param {Map<string, Uint8Array>} options.images PNG indexés par nom de fichier.
 * @param {object} [options.settings] Réglages retenus, consignés dans l'archive.
 * @param {number} [options.now]
 * @returns {Uint8Array}
 */
export function buildLabelArchive(options) {
  const { planned, images } = options;
  const now = options.now ?? Date.now();
  const format = options.settings?.format ?? findFormat(DEFAULT_EXPORT_OPTIONS.formatId);

  const entries = [];

  for (const { fileName } of planned) {
    const png = images.get(fileName);
    if (png) entries.push({ name: `etiquettes/${fileName}`, data: png });
  }

  // Un CSV qui relie chaque URL à son image : c'est ce qui permet de retrouver
  // l'étiquette d'un lien sans ouvrir les images une à une.
  //
  // Quand au moins un lien est raccourci, une colonne « URL d'origine » apparaît
  // en fin de tableau : l'archive doit toujours permettre de retrouver la vraie
  // adresse, même si le service de raccourcissement disparaît.
  const withShort = planned.some(
    ({ link }) => hasShortUrl(link) && sourceUrl(link) !== link.url,
  );
  const csvRows = planned.map(({ link, fileName }, index) => [
    index + 1,
    link.url,
    ...(withShort ? [sourceUrl(link) === link.url ? '' : sourceUrl(link)] : []),
    link.title,
    `etiquettes/${fileName}`,
  ]);
  const header = withShort
    ? ['N°', 'URL', 'URL d\'origine', 'Titre', 'Image']
    : ['N°', 'URL', 'Titre', 'Image'];
  const csv = '\uFEFF' + [header, ...csvRows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(';'))
    .join('\r\n') + '\r\n';
  entries.push({ name: 'liens.csv', data: csv });

  entries.push({
    name: 'planche.html',
    data: buildPrintSheet(planned, {
      title: options.settings?.title ?? 'Mes liens',
      cutMarks: options.settings?.cutMarks,
      format,
    }),
  });

  entries.push({
    name: 'export.json',
    data: JSON.stringify(
      {
        format: 'url-qr-code-printer/labels',
        version: 1,
        exportedAt: new Date(now).toISOString(),
        settings: {
          labelFormat: format.id,
          labelName: format.name,
          widthMm: format.widthMm,
          heightMm: format.heightMm,
          dpi: format.dpi,
          textMode: options.settings?.textMode ?? DEFAULT_EXPORT_OPTIONS.textMode,
          marginMm: options.settings?.marginMm ?? DEFAULT_EXPORT_OPTIONS.marginMm,
          fontSizePt: options.settings?.fontSizePt ?? DEFAULT_EXPORT_OPTIONS.fontSizePt,
          cutMarks: options.settings?.cutMarks ?? DEFAULT_EXPORT_OPTIONS.cutMarks,
        },
        count: planned.length,
        labels: planned.map(({ link, fileName, plan }) => ({
          file: `etiquettes/${fileName}`,
          url: link.url,
          // Consignée seulement quand elle diffère : le manifeste reste compact,
          // et une étiquette raccourcie reste réversible.
          ...(sourceUrl(link) !== link.url ? { originalUrl: sourceUrl(link) } : {}),
          title: link.title,
          widthPx: plan.widthPx,
          heightPx: plan.heightPx,
        })),
      },
      null,
      2,
    ),
  });

  return createZip(entries, { date: new Date(now) });
}

/**
 * Échappe un champ CSV — même règle que l'export texte.
 * @param {unknown} value
 * @returns {string}
 */
function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  return /[;"\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

/**
 * Nom de fichier de l'archive d'étiquettes.
 *
 * @param {number} [now]
 * @param {string} [base] Nom de la collection, pour retrouver l'archive dans un
 *   dossier de téléchargements. Le défaut reste `etiquettes-qr`.
 * @returns {string}
 */
export function labelArchiveName(now = Date.now(), base = 'etiquettes-qr') {
  return exportFilename(base, 'zip', now || Date.now());
}
