/**
 * Tests de la conversion image → bitmap monochrome.
 * Un décalage de bits ici produit une étiquette illisible, pas une erreur.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { imageDataToMono, validateBitmap, cropBitmap } from '../src/core/raster.js';

/**
 * Construit un ImageData de test.
 * @param {number} width
 * @param {number} height
 * @param {(x: number, y: number) => [number, number, number, number]} paint
 */
function makeImage(width, height, paint) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = paint(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = a;
    }
  }
  return { data, width, height };
}

test('un pixel noir devient un bit à 1, poids fort en premier', () => {
  const image = makeImage(8, 1, (x) => (x === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
  const bitmap = imageDataToMono(image);
  assert.equal(bitmap.rows[0][0], 0b10000000);
});

test('le dernier pixel d\'un octet occupe le bit de poids faible', () => {
  const image = makeImage(8, 1, (x) => (x === 7 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
  assert.equal(imageDataToMono(image).rows[0][0], 0b00000001);
});

test('une ligne entièrement noire donne 0xFF', () => {
  const image = makeImage(8, 1, () => [0, 0, 0, 255]);
  assert.equal(imageDataToMono(image).rows[0][0], 0xff);
});

test('une ligne blanche donne 0x00', () => {
  const image = makeImage(8, 1, () => [255, 255, 255, 255]);
  assert.equal(imageDataToMono(image).rows[0][0], 0x00);
});

test('la largeur est complétée à l\'octet avec des bits à zéro', () => {
  // 12 px → 2 octets par ligne, les 4 derniers bits du second octet restent nuls.
  const image = makeImage(12, 1, () => [0, 0, 0, 255]);
  const bitmap = imageDataToMono(image);
  assert.equal(bitmap.bytesPerRow, 2);
  assert.equal(bitmap.rows[0][0], 0xff);
  assert.equal(bitmap.rows[0][1], 0b11110000);
});

test('la luminance est pondérée, pas une moyenne', () => {
  // Vert pur : luminance 0,587 × 255 ≈ 150 → au-dessus du seuil de 128.
  const vert = makeImage(8, 1, () => [0, 255, 0, 255]);
  assert.equal(imageDataToMono(vert).rows[0][0], 0x00);

  // Bleu pur : luminance 0,114 × 255 ≈ 29 → sous le seuil, donc noir.
  const bleu = makeImage(8, 1, () => [0, 0, 255, 255]);
  assert.equal(imageDataToMono(bleu).rows[0][0], 0xff);
});

test('un pixel transparent est traité comme blanc', () => {
  // Sans cette règle, une étiquette composée sur canvas transparent sortirait
  // entièrement noire.
  const image = makeImage(8, 1, () => [0, 0, 0, 0]);
  assert.equal(imageDataToMono(image).rows[0][0], 0x00);
});

test('le seuil est réglable', () => {
  const gris = makeImage(8, 1, () => [130, 130, 130, 255]);
  assert.equal(imageDataToMono(gris).rows[0][0], 0x00, 'clair au seuil de 128');
  assert.equal(imageDataToMono(gris, { threshold: 200 }).rows[0][0], 0xff, 'noir au seuil de 200');
});

test('invert échange noir et blanc', () => {
  const image = makeImage(8, 1, (x) => (x === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
  assert.equal(imageDataToMono(image, { invert: true }).rows[0][0], 0b01111111);
});

test('la hauteur produit autant de lignes', () => {
  const image = makeImage(8, 5, () => [0, 0, 0, 255]);
  const bitmap = imageDataToMono(image);
  assert.equal(bitmap.height, 5);
  assert.equal(bitmap.rows.length, 5);
});

test('imageDataToMono refuse des données incohérentes', () => {
  assert.throws(() => imageDataToMono(null), TypeError);
  assert.throws(() => imageDataToMono({ data: new Uint8ClampedArray(4), width: 8, height: 8 }), TypeError);
  assert.throws(() => imageDataToMono({ width: 8, height: 8 }), TypeError);
});

// ---------------------------------------------------------------------------
// validateBitmap
// ---------------------------------------------------------------------------

test('validateBitmap accepte une image à la largeur de tête', () => {
  const image = makeImage(96, 10, () => [0, 0, 0, 255]);
  const verdict = validateBitmap(imageDataToMono(image), { printheadPixels: 96 });
  assert.deepEqual(verdict, { ok: true, reasons: [] });
});

test('validateBitmap refuse une image trop large et explique le rognage', () => {
  const image = makeImage(120, 10, () => [0, 0, 0, 255]);
  const verdict = validateBitmap(imageDataToMono(image), { printheadPixels: 96 });
  assert.equal(verdict.ok, false);
  assert.match(verdict.reasons[0], /rogné/);
});

test('validateBitmap refuse une hauteur excessive', () => {
  const image = makeImage(96, 900, () => [0, 0, 0, 255]);
  const verdict = validateBitmap(imageDataToMono(image), {
    printheadPixels: 96,
    maxHeightPx: 800,
  });
  assert.equal(verdict.ok, false);
  assert.match(verdict.reasons.join(' '), /hauteur/);
});

// ---------------------------------------------------------------------------
// cropBitmap
// ---------------------------------------------------------------------------

test('cropBitmap rogne par la droite en conservant les bits de gauche', () => {
  // 16 px dont seuls les 8 premiers sont noirs.
  const image = makeImage(16, 1, (x) => (x < 8 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
  const cropped = cropBitmap(imageDataToMono(image), 8);
  assert.equal(cropped.width, 8);
  assert.equal(cropped.bytesPerRow, 1);
  assert.equal(cropped.rows[0][0], 0xff);
});

test('cropBitmap conserve un motif au-delà de l\'octet rogné', () => {
  // Pixel 11 noir : il tombe dans le second octet, qui doit survivre au rognage
  // à 12 px.
  const image = makeImage(16, 1, (x) => (x === 11 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
  const cropped = cropBitmap(imageDataToMono(image), 12);
  assert.equal(cropped.bytesPerRow, 2);
  assert.equal(cropped.rows[0][0], 0x00);
  assert.equal(cropped.rows[0][1], 0b00010000);
});

test('cropBitmap renvoie le bitmap tel quel si rien à rogner', () => {
  const image = makeImage(8, 2, () => [0, 0, 0, 255]);
  const bitmap = imageDataToMono(image);
  assert.equal(cropBitmap(bitmap, 96), bitmap);
});

test('cropBitmap préserve la hauteur', () => {
  const image = makeImage(32, 7, () => [0, 0, 0, 255]);
  assert.equal(cropBitmap(imageDataToMono(image), 16).height, 7);
});
