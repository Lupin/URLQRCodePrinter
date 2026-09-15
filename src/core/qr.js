/**
 * Encodage QR code.
 *
 * On s'appuie sur `uqr` (ESM pur, sans dépendance) qui renvoie une matrice
 * booléenne. C'est exactement la représentation dont a besoin le pipeline
 * d'impression thermique : on évite ainsi tout aller-retour par une image
 * bitmap intermédiaire, qui dégraderait la netteté du QR à l'impression.
 */

import { encode } from 'uqr';

import { encodePng } from './png.js';

/** Niveaux de correction d'erreur acceptés par `uqr`. */
export const ECC_LEVELS = ['L', 'M', 'Q', 'H'];

/**
 * @typedef {Object} QrMatrix
 * @property {boolean[][]} data   `data[y][x] === true` pour un module noir.
 * @property {number}      size   Nombre de modules par côté, bordure comprise.
 * @property {number}      version Version QR (1-40).
 * @property {number}      border Taille de la bordure (en modules).
 */

/**
 * Encode une chaîne en matrice QR.
 *
 * @param {string} text
 * @param {{ ecc?: 'L'|'M'|'Q'|'H', border?: number, minVersion?: number }} [options]
 * @returns {QrMatrix}
 */
export function encodeQr(text, options = {}) {
  if (typeof text !== 'string' || text === '') {
    throw new TypeError('encodeQr exige une chaîne non vide');
  }
  const ecc = ECC_LEVELS.includes(options.ecc) ? options.ecc : 'M';
  const border = Number.isInteger(options.border) ? options.border : 2;

  const result = encode(text, {
    ecc,
    border,
    minVersion: options.minVersion ?? 1,
  });

  return {
    data: result.data,
    size: result.size,
    version: result.version,
    border,
  };
}

/**
 * Nombre de pixels par module nécessaire pour qu'un QR reste lisible à une
 * densité d'impression donnée. En dessous de 3 px/module, la tête thermique
 * (203 dpi) fusionne les modules et le code devient illisible.
 *
 * @param {number} targetPx Largeur disponible en pixels.
 * @param {number} moduleCount Nombre de modules du QR, bordure comprise.
 * @returns {number} Échelle entière >= 1.
 */
export function pickScale(targetPx, moduleCount) {
  if (!Number.isFinite(targetPx) || !Number.isFinite(moduleCount) || moduleCount <= 0) return 1;
  return Math.max(1, Math.floor(targetPx / moduleCount));
}

/**
 * Rend la matrice dans un contexte 2D de canvas, à l'échelle demandée.
 *
 * L'arrondi de `size * scale` est important : sans lui, les modules ne tombent
 * pas sur des pixels entiers et le QR est flou.
 *
 * @param {QrMatrix} matrix
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x?: number, y?: number, scale?: number, dark?: string, light?: string|null }} [options]
 * @returns {{ width: number, height: number }}
 */
export function drawQr(matrix, ctx, options = {}) {
  const scale = Math.max(1, Math.floor(options.scale ?? 1));
  const x0 = options.x ?? 0;
  const y0 = options.y ?? 0;
  const dark = options.dark ?? '#000000';
  const light = options.light ?? null;
  const side = matrix.size * scale;

  if (light) {
    ctx.fillStyle = light;
    ctx.fillRect(x0, y0, side, side);
  }

  ctx.fillStyle = dark;
  for (let y = 0; y < matrix.size; y++) {
    const row = matrix.data[y];
    let runStart = -1;
    // On fusionne les modules noirs contigus en un seul rectangle : beaucoup
    // moins d'appels de dessin, donc un rendu nettement plus rapide sur les
    // planches de plusieurs dizaines d'étiquettes.
    for (let x = 0; x <= matrix.size; x++) {
      const isDark = x < matrix.size && row[x];
      if (isDark && runStart === -1) {
        runStart = x;
      } else if (!isDark && runStart !== -1) {
        ctx.fillRect(x0 + runStart * scale, y0 + y * scale, (x - runStart) * scale, scale);
        runStart = -1;
      }
    }
  }

  return { width: side, height: side };
}

/**
 * Rend la matrice en chaîne SVG (aperçu vectoriel, impression papier).
 *
 * @param {QrMatrix} matrix
 * @param {{ scale?: number, dark?: string, light?: string, margin?: number }} [options]
 * @returns {string}
 */
export function toSvg(matrix, options = {}) {
  const scale = Math.max(1, Math.floor(options.scale ?? 1));
  const dark = options.dark ?? '#000000';
  const light = options.light ?? '#ffffff';
  const margin = options.margin ?? 0;
  const side = matrix.size * scale + margin * 2;

  const parts = [];
  for (let y = 0; y < matrix.size; y++) {
    const row = matrix.data[y];
    for (let x = 0; x < matrix.size; x++) {
      if (!row[x]) continue;
      parts.push(
        `M${margin + x * scale} ${margin + y * scale}h${scale}v${scale}h-${scale}z`,
      );
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" ` +
    `viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges">` +
    `<rect width="${side}" height="${side}" fill="${light}"/>` +
    `<path d="${parts.join('')}" fill="${dark}"/>` +
    '</svg>'
  );
}

/**
 * Encode une matrice QR en flux noir & blanc 1 bit par pixel.
 *
 * C'est le format d'image natif des têtes thermiques : un bit à 1 = point
 * chauffé = pixel noir. Les lignes sont rembourrées à l'octet.
 *
 * @param {QrMatrix} matrix
 * @param {number} scale Pixels par module.
 * @param {{ quietZone?: boolean }} [options] Si false, la bordure déjà incluse
 *   dans la matrice est conservée telle quelle (cas de l'impression d'étiquette
 *   où l'on maîtrise la marge par ailleurs).
 * @returns {{ width: number, height: number, bytesPerRow: number, rows: Uint8Array[] }}
 */
export function toMonoBitmap(matrix, scale, options = {}) {
  const s = Math.max(1, Math.floor(scale));
  const size = matrix.size;
  const width = size * s;
  const height = size * s;
  const bytesPerRow = Math.ceil(width / 8);
  const rows = [];

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow);
    const srcRow = matrix.data[Math.floor(y / s)];
    for (let x = 0; x < width; x++) {
      if (!srcRow[Math.floor(x / s)]) continue;
      row[x >> 3] |= 0x80 >> (x & 7);
    }
    rows.push(row);
  }

  return { width, height, bytesPerRow, rows };
}

/**
 * Rend un QR code en image PNG.
 *
 * C'est le format attendu par un tableur : un CSV ne peut pas transporter
 * d'image, un `.xlsx` si. Le rendu se fait par plus proche voisin — un
 * redimensionnement lissé rendrait le code illisible.
 *
 * @param {string} text
 * @param {{
 *   ecc?: 'L'|'M'|'Q'|'H',
 *   border?: number,
 *   scale?: number,
 *   dark?: [number, number, number],
 *   light?: [number, number, number],
 *   maxSize?: number,
 * }} [options]
 * @returns {Promise<Uint8Array>}
 */
export async function qrPng(text, options = {}) {
  const matrix = encodeQr(text, {
    ecc: options.ecc ?? 'M',
    border: options.border ?? 2,
  });

  // L'échelle est entière, et bornée pour qu'une URL longue ne produise pas une
  // image démesurée dans le classeur.
  const requested = Math.max(1, Math.floor(options.scale ?? 8));
  const maxSize = options.maxSize ?? 512;
  const scale = Math.max(1, Math.min(requested, Math.floor(maxSize / matrix.size)));

  const size = matrix.size * scale;
  const dark = options.dark ?? [0, 0, 0];
  const light = options.light ?? [255, 255, 255];
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const sourceRow = matrix.data[Math.floor(y / scale)];
    for (let x = 0; x < size; x++) {
      const color = sourceRow[Math.floor(x / scale)] ? dark : light;
      const offset = (y * size + x) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 0xff;
    }
  }

  return encodePng({ width: size, height: size, data });
}
