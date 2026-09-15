/**
 * Composition d'une étiquette : un QR code et une URL lisible.
 *
 * Ce module ne dépend d'aucune imprimante : il décrit une géométrie en pixels
 * pour une largeur de tête et une résolution données. Les profils concrets
 * (D110, M2) vivent dans `printer/profiles.js`, ce qui permet de tester la mise
 * en page sans matériel.
 */

import { encodeQr, drawQr, pickScale } from './qr.js';
import { hostOf } from './link.js';

/**
 * @typedef {Object} LabelGeometry
 * @property {number} width       Largeur totale en pixels.
 * @property {number} height      Hauteur totale en pixels.
 * @property {number} padding     Marge intérieure en pixels.
 * @property {number} qrSize      Côté du QR en pixels (multiple de l'échelle).
 * @property {number} textTop     Ordonnée du premier texte.
 * @property {number} lineHeight  Hauteur de ligne de texte.
 * @property {string[]} lines     Lignes de texte déjà découpées.
 * @property {number} fontSize    Taille de police en pixels.
 * @property {number} qrScale     Pixels par module du QR.
 * @property {number} pxPerModule Pixels par module.
 * @property {boolean} fits       false si le QR ne tient pas dans la largeur utile.
 * @property {import('./qr.js').QrMatrix} qrMatrix Matrice encodée.
 */

/**
 * Contenu textuel d'une étiquette Niimbot, selon le mode choisi.
 *
 * Le même vocabulaire que l'export d'images (`TEXT_MODES`), pour qu'on n'ait
 * qu'une chose à apprendre : QR seul, QR + titre, QR + URL, etc. La date, elle,
 * suit le réglage global « Date sous le QR code » et s'ajoute en dernier.
 *
 * Le titre et la date occupent chacun **une ligne réservée** : `extraLines`
 * prévient la géométrie, sans quoi la dernière ligne serait rognée.
 *
 * @param {{ url: string, title?: string }} link
 * @param {string} mode `none`, `title`, `url`, `title-url` ou `host`.
 * @param {string} [dateText] Ligne de date à imprimer sous le texte, ou chaîne vide.
 * @returns {{ text: string, showTitle: boolean, extraLines: number, extraText: string[] }}
 */
export function labelContent(link, mode, dateText = '') {
  // Un titre absent ne doit pas réserver une ligne vide.
  const title = typeof link.title === 'string' ? link.title : '';
  const wantsTitle = (mode === 'title' || mode === 'title-url') && title !== '';

  let text = '';
  if (mode === 'url' || mode === 'title-url') text = link.url;
  else if (mode === 'host') text = hostOf(link.url);
  else if (mode === 'title' && !wantsTitle) text = link.url; // titre vide : l'URL

  const extraText = dateText === '' ? [] : [dateText];

  return {
    text,
    showTitle: wantsTitle,
    extraLines: (wantsTitle ? 1 : 0) + extraText.length,
    extraText,
  };
}

/** Échelle minimale : sous 2 px par module, la tête thermique fusionne les points. */
export const MIN_QR_SCALE = 2;

/**
 * Découpe un texte en lignes tenant dans une largeur donnée.
 *
 * Le découpage se fait sur les espaces, mais aussi après « / », « - » et « . »
 * car les URL n'ont souvent pas d'espace avant la fin du domaine. Un mot plus
 * long que la largeur disponible est coupé caractère par caractère plutôt que
 * de déborder.
 *
 * @param {(text: string) => number} measure Largeur d'un texte, en pixels.
 * @param {string} text
 * @param {number} maxWidth
 * @param {{ maxLines?: number }} [options]
 * @returns {string[]}
 */
export function wrapText(measure, text, maxWidth, options = {}) {
  const maxLines = options.maxLines ?? Infinity;
  if (!text) return [];
  if (maxWidth <= 0) return [text];

  const lines = [];
  let current = '';

  /** Découpe un « mot » trop long en morceaux qui tiennent seuls. */
  const splitLongWord = (word) => {
    const chunks = [];
    let chunk = '';
    for (const char of word) {
      if (measure(chunk + char) > maxWidth && chunk !== '') {
        chunks.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  };

  // On conserve les séparateurs en les rattachant au fragment précédent.
  const tokens = text.split(/(?<=[\s/\-.])/).filter((token) => token !== '');

  for (const token of tokens) {
    const candidate = current + token;
    const trimmed = candidate.replace(/\s+$/, '');

    if (measure(trimmed) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current.trim() !== '') {
      lines.push(current.trim());
      if (lines.length >= maxLines) return lines;
      current = '';
    }
    const word = token.trim();
    if (word === '') continue;

    if (measure(word) <= maxWidth) {
      current = word + (/[\s]$/.test(token) ? ' ' : '');
    } else {
      const chunks = splitLongWord(word);
      for (let i = 0; i < chunks.length - 1; i++) {
        lines.push(chunks[i]);
        if (lines.length >= maxLines) return lines;
      }
      current = chunks[chunks.length - 1] ?? '';
    }
  }

  if (current.trim() !== '' && lines.length < maxLines) lines.push(current.trim());
  return lines;
}

/**
 * Calcule la géométrie d'une étiquette.
 *
 * La hauteur n'est jamais fixée à l'avance : elle découle du nombre de lignes
 * de texte nécessaires. Cela évite de rogner une URL longue ou, à l'inverse,
 * de gaspiller une étiquette sur une URL courte.
 *
 * @param {object} options
 * @param {string} options.text           Texte à imprimer sous le QR (généralement l'URL).
 * @param {number} options.widthPx        Largeur utile de la tête, en pixels.
 * @param {number} [options.dpi]          Résolution, pour les conversions mm <-> px.
 * @param {number} [options.fontSize]     Taille de police en pixels.
 * @param {number} [options.padding]      Marge intérieure en pixels.
 * @param {number} [options.qrRatio]      Part maximale de la largeur utile occupée par le QR (0-1).
 * @param {number} [options.minScale]     Pixels par module minimum (défaut : MIN_QR_SCALE).
 * @param {number} [options.lineSpacing]  Interligne, en multiple de la police.
 * @param {number} [options.maxLines]     Nombre maximal de lignes de texte.
 * @param {number} [options.maxHeightPx]  Hauteur maximale imposée (0 = illimitée).
 * @param {number} [options.minHeightPx]  Hauteur minimale de l'étiquette.
 * @param {number} [options.extraLines]   Lignes de texte supplémentaires à
 *   réserver sous celles du texte principal — la date, quand elle est demandée.
 *   Les ignorer rognerait la dernière ligne en silence.
 * @param {(text: string) => number} [options.measure] Mesure de texte injectée
 *   (obligatoire hors navigateur ; en navigateur, un canvas est créé au besoin).
 * @returns {LabelGeometry}
 */
export function computeLabelGeometry(options) {
  const width = Math.max(1, Math.floor(options.widthPx));
  const padding = Math.max(0, Math.floor(options.padding ?? Math.round(width * 0.06)));
  const fontSize = Math.max(6, Math.floor(options.fontSize ?? Math.round(width * 0.085)));
  const lineSpacing = options.lineSpacing ?? 1.15;
  const lineHeight = Math.ceil(fontSize * lineSpacing);
  const qrRatio = Math.min(1, Math.max(0.3, options.qrRatio ?? 0.95));
  const minScale = Math.max(1, Math.floor(options.minScale ?? MIN_QR_SCALE));
  const maxLines = options.maxLines ?? 4;

  const innerWidth = Math.max(1, width - padding * 2);
  const qrTarget = Math.floor(innerWidth * qrRatio);

  const extraLines = Math.max(0, Math.trunc(options.extraLines ?? 0));
  const measure = options.measure ?? defaultMeasure(fontSize);
  const lines = wrapText(measure, options.text ?? '', innerWidth, {
    maxLines: Math.max(0, maxLines - extraLines),
  });

  // Le QR a une taille entière en modules : on arrondit au multiple inférieur.
  // On impose une échelle minimale, sans quoi une URL longue produirait un code
  // à 1 px par module, illisible à l'impression thermique. Un éventuel
  // dépassement est signalé par `fits` plutôt que corrigé en silence.
  const matrix = encodeQr(options.text ?? ' ', { ecc: options.ecc ?? 'M', border: 2 });
  const scale = Math.max(minScale, pickScale(qrTarget, matrix.size));
  const qrSize = matrix.size * scale;
  const fits = qrSize <= innerWidth;

  const textHeight = (lines.length + extraLines) * lineHeight;
  const contentHeight = qrSize + (lines.length + extraLines > 0 ? padding + textHeight : 0);
  const naturalHeight = contentHeight + padding * 2;

  const minHeight = options.minHeightPx ?? 0;
  const maxHeight = options.maxHeightPx ?? 0;
  let height = Math.max(naturalHeight, minHeight);
  if (maxHeight > 0) height = Math.min(height, maxHeight);

  return {
    width,
    height: Math.ceil(height),
    padding,
    qrSize,
    qrScale: scale,
    pxPerModule: qrSize / matrix.size,
    fits,
    qrMatrix: matrix,
    textTop: padding + qrSize + padding,
    lineHeight,
    lines,
    extraLines,
    fontSize,
  };
}

/**
 * Mesure par défaut. En navigateur on crée un canvas hors écran ; ailleurs on
 * approxime, ce qui suffit à découper des URL en police monospace.
 *
 * @param {number} fontSize
 * @returns {(text: string) => number}
 */
function defaultMeasure(fontSize) {
  const canvasFactory = globalThis.document?.createElement?.bind(globalThis.document);
  if (canvasFactory) {
    const canvas = canvasFactory('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontSize}px -apple-system, system-ui, sans-serif`;
      return (text) => ctx.measureText(text).width;
    }
  }
  // Approximation : ratio moyen constaté pour une police sans-serif.
  return (text) => text.length * fontSize * 0.55;
}

/**
 * Dessine une étiquette complète (QR + texte) dans un contexte 2D.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {LabelGeometry} geometry
 * @param {{
 *   fontFamily?: string,
 *   showTitle?: boolean,
 *   title?: string,
 *   showHost?: boolean,
 * }} [options]
 * @returns {LabelGeometry}
 */
export function drawLabel(ctx, geometry, options = {}) {
  const {
    fontFamily = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif',
    showTitle = false,
    title = '',
    showHost = false,
    // Lignes à imprimer sous le texte principal — la date, le plus souvent.
    // Leur place a été réservée par `extraLines` dans la géométrie.
    extraText = [],
  } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, geometry.width, geometry.height);

  const qrX = Math.floor((geometry.width - geometry.qrSize) / 2);
  drawQr(geometry.qrMatrix, ctx, { x: qrX, y: geometry.padding, scale: geometry.qrScale });

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  let y = geometry.textTop;
  ctx.font = `bold ${geometry.fontSize}px ${fontFamily}`;
  if (showTitle && title) {
    ctx.fillText(title, geometry.width / 2, y);
    y += geometry.lineHeight;
  }

  ctx.font = `${geometry.fontSize}px ${fontFamily}`;
  for (const line of geometry.lines) {
    ctx.fillText(line, geometry.width / 2, y);
    y += geometry.lineHeight;
  }

  if (showHost) {
    ctx.font = `${Math.round(geometry.fontSize * 0.9)}px ${fontFamily}`;
    ctx.fillText(hostOf(options.url ?? ''), geometry.width / 2, y);
    y += geometry.lineHeight;
  }

  // Les lignes supplémentaires viennent en dernier : la date se lit comme une
  // mention, sous l'information principale.
  for (const line of extraText) {
    if (!line) continue;
    ctx.fillText(line, geometry.width / 2, y);
    y += geometry.lineHeight;
  }

  return geometry;
}

/**
 * Convertit une longueur en millimètres vers des pixels.
 * @param {number} mm
 * @param {number} dpi
 * @returns {number}
 */
export function mmToPx(mm, dpi) {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Convertit des pixels vers des millimètres.
 * @param {number} px
 * @param {number} dpi
 * @returns {number}
 */
export function pxToMm(px, dpi) {
  return (px / dpi) * 25.4;
}

/**
 * Vérifie qu'un QR code restera imprimable et lisible.
 *
 * Deux causes d'échec, dans cet ordre :
 * 1. le QR déborde de la largeur utile — l'URL est trop longue pour cette
 *    étiquette, aucune mise à l'échelle ne peut le sauver ;
 * 2. la densité est insuffisante (moins de 2 px par module), cas que
 *    `computeLabelGeometry` évite normalement via `minScale`, mais qui peut
 *    survenir si l'appelant a forcé `minScale: 1`.
 *
 * @param {LabelGeometry} geometry
 * @param {{ minPxPerModule?: number }} [options]
 * @returns {{ ok: boolean, pxPerModule: number, reason?: string }}
 */
export function checkQrLegibility(geometry, options = {}) {
  const minPx = options.minPxPerModule ?? MIN_QR_SCALE;
  const pxPerModule = geometry.qrSize / geometry.qrMatrix.size;

  if (geometry.fits === false) {
    return {
      ok: false,
      pxPerModule,
      reason:
        `URL trop longue : le QR fait ${geometry.qrSize} px pour ${geometry.width} px ` +
        'de large. Raccourcissez l\'URL ou utilisez une étiquette plus large.',
    };
  }
  if (pxPerModule < minPx) {
    return {
      ok: false,
      pxPerModule,
      reason:
        `QR trop dense : ${pxPerModule.toFixed(2)} px par module (minimum ${minPx}). ` +
        'Raccourcissez l\'URL ou augmentez la largeur de l\'étiquette.',
    };
  }
  return { ok: true, pxPerModule };
}
