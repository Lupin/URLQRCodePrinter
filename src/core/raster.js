/**
 * Conversion d'une image en bitmap monochrome pour tête thermique.
 *
 * Les têtes Niimbot attendent un flux de lignes, 1 bit par pixel, poids fort
 * en premier, 1 = noir, chaque ligne complétée à l'octet. Ce module fait cette
 * conversion depuis un `ImageData` de canvas, ce qui permet d'imprimer une
 * étiquette composée (QR + texte) et pas seulement un QR nu.
 *
 * La fonction est pure : elle ne dépend que de son entrée, donc testable hors
 * navigateur.
 */

/**
 * @typedef {Object} MonoBitmap
 * @property {number} width       Largeur en pixels.
 * @property {number} height      Hauteur en pixels.
 * @property {number} bytesPerRow Octets par ligne, largeur complétée à l'octet.
 * @property {Uint8Array[]} rows  Une entrée par ligne.
 */

/**
 * Convertit des données RGBA en bitmap monochrome.
 *
 * @param {{ data: Uint8ClampedArray|Uint8Array, width: number, height: number }} imageData
 * @param {{
 *   threshold?: number,
 *   invert?: boolean,
 *   paddingByte?: number,
 * }} [options]
 *   `threshold` : luminance (0-255) en dessous de laquelle un pixel est noir.
 *   `invert` : à activer si la source est claire sur fond sombre.
 * @returns {MonoBitmap}
 * @throws {TypeError} si les dimensions sont incohérentes avec les données.
 */
export function imageDataToMono(imageData, options = {}) {
  if (!imageData || typeof imageData.width !== 'number' || typeof imageData.height !== 'number') {
    throw new TypeError('imageData doit exposer width et height');
  }
  const { data } = imageData;
  const { width, height } = imageData;

  if (!data || data.length < width * height * 4) {
    throw new TypeError(
      `données insuffisantes : ${data?.length ?? 0} octets pour ${width} × ${height} pixels RGBA`,
    );
  }

  const threshold = Number.isFinite(options.threshold) ? options.threshold : 128;
  const invert = Boolean(options.invert);
  const paddingByte = options.paddingByte ?? 0;
  const bytesPerRow = Math.ceil(width / 8);
  const rows = [];

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow);
    if (paddingByte !== 0 && width % 8 !== 0) row.fill(paddingByte);

    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];

      // Un pixel transparent est traité comme blanc : sinon une étiquette
      // composée sur canvas transparent sortirait entièrement noire.
      let dark;
      if (alpha === 0) {
        dark = false;
      } else {
        const luminance =
          0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
        dark = luminance < threshold;
      }
      if (invert) dark = !dark;
      if (dark) row[x >> 3] |= 0x80 >> (x & 7);
    }

    rows.push(row);
  }

  return { width, height, bytesPerRow, rows };
}

/**
 * Vérifie qu'un bitmap respecte les contraintes d'une tête d'impression.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ printheadPixels: number, maxHeightPx?: number }} profile
 * @returns {{ ok: boolean, reasons: string[] }}
 */
export function validateBitmap(bitmap, profile) {
  const reasons = [];

  if (bitmap.width > profile.printheadPixels) {
    reasons.push(
      `largeur ${bitmap.width} px supérieure à la tête (${profile.printheadPixels} px) : ` +
      'le surplus serait rogné sans erreur',
    );
  }
  if (bitmap.bytesPerRow !== Math.ceil(bitmap.width / 8)) {
    reasons.push(
      `bytesPerRow incohérent : ${bitmap.bytesPerRow} au lieu de ${Math.ceil(bitmap.width / 8)}`,
    );
  }
  if (bitmap.rows.length !== bitmap.height) {
    reasons.push(`${bitmap.rows.length} lignes fournies pour une hauteur de ${bitmap.height}`);
  }
  for (const row of bitmap.rows) {
    if (row.length !== bitmap.bytesPerRow) {
      reasons.push('au moins une ligne n\'a pas la longueur annoncée');
      break;
    }
  }
  if (profile.maxHeightPx && bitmap.height > profile.maxHeightPx) {
    reasons.push(
      `hauteur ${bitmap.height} px supérieure au maximum du profil (${profile.maxHeightPx} px)`,
    );
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * Réduit un bitmap à la largeur de tête en le rognant par la droite.
 *
 * Utile quand la source est légèrement trop large : mieux vaut rogner
 * explicitement et le signaler que laisser l'imprimante le faire en silence.
 *
 * @param {MonoBitmap} bitmap
 * @param {number} maxWidth
 * @returns {MonoBitmap}
 */
export function cropBitmap(bitmap, maxWidth) {
  if (bitmap.width <= maxWidth) return bitmap;

  const width = Math.max(1, Math.trunc(maxWidth));
  const bytesPerRow = Math.ceil(width / 8);
  const rows = bitmap.rows.map((row) => {
    const cropped = new Uint8Array(bytesPerRow);
    for (let x = 0; x < width; x++) {
      if (row[x >> 3] & (0x80 >> (x & 7))) cropped[x >> 3] |= 0x80 >> (x & 7);
    }
    return cropped;
  });

  return { width, height: bitmap.height, bytesPerRow, rows };
}
