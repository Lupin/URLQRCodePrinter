/**
 * Génération des icônes de l'extension.
 *
 * Le projet Safari refuse de s'empaqueter sans icônes dans le manifeste, et
 * une icône grise par défaut nuirait à l'extension dans la barre d'outils. On
 * fabrique donc les PNG nous-mêmes : aucune dépendance graphique n'est
 * installée, et un encodeur PNG tient en quelques dizaines de lignes.
 *
 * Le motif reproduit un QR code — trois carrés de repérage, les motifs de
 * synchronisation, puis des modules pseudo-aléatoires **déterministes**, pour
 * que deux exécutions produisent exactement le même fichier.
 */

import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Côté de la matrice : un QR de version 1 fait 21 modules. */
export const MODULE_COUNT = 21;

/** Bleu-vert de la charte, en composantes RVB. */
export const INK = [33, 128, 141];

// ---------------------------------------------------------------------------
// Motif
// ---------------------------------------------------------------------------

/**
 * Construit la matrice de modules du motif.
 *
 * @returns {boolean[][]} `true` pour un module encre.
 */
export function buildMatrix() {
  const grid = Array.from({ length: MODULE_COUNT }, () => new Array(MODULE_COUNT).fill(false));

  // Zones réservées : repères d'orientation, leurs séparateurs, et les motifs
  // de synchronisation. On n'y écrit pas de données.
  const reserved = (x, y) => {
    if (x === 6 || y === 6) return true;
    return (x < 8 && y < 8) || (x > MODULE_COUNT - 9 && y < 8) || (x < 8 && y > MODULE_COUNT - 9);
  };

  // Trois repères d'orientation : anneau de 7 × 7 avec un cœur de 3 × 3.
  for (const [ox, oy] of [[0, 0], [MODULE_COUNT - 7, 0], [0, MODULE_COUNT - 7]]) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const ring = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = ring || core;
      }
    }
  }

  // Motifs de synchronisation : une alternance qui traverse la matrice.
  for (let i = 8; i < MODULE_COUNT - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Données : générateur congruentiel linéaire, donc reproductible.
  let state = 0x2f6e2b1;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  for (let y = 0; y < MODULE_COUNT; y++) {
    for (let x = 0; x < MODULE_COUNT; x++) {
      if (reserved(x, y)) continue;
      grid[y][x] = next() > 0.45;
    }
  }

  return grid;
}

/**
 * Rend le motif dans un tampon RGBA.
 *
 * La mise à l'échelle se fait par plus proche voisin : sur un petit format,
 * certains modules disparaissent, ce qui est le comportement attendu d'une
 * icône réduite.
 *
 * @param {number} size Côté en pixels.
 * @returns {{ width: number, height: number, data: Buffer }}
 */
export function renderIcon(size) {
  const side = Math.max(1, Math.trunc(size));
  const data = Buffer.alloc(side * side * 4);

  // Fond blanc opaque.
  data.fill(0xff);

  const quiet = Math.max(1, Math.round(side * 0.08));
  const inner = side - quiet * 2;
  const grid = buildMatrix();

  for (let py = 0; py < side; py++) {
    for (let px = 0; px < side; px++) {
      const gx = Math.floor(((px - quiet) / inner) * MODULE_COUNT);
      const gy = Math.floor(((py - quiet) / inner) * MODULE_COUNT);
      const inside = gx >= 0 && gy >= 0 && gx < MODULE_COUNT && gy < MODULE_COUNT;
      if (!inside || !grid[gy][gx]) continue;

      const offset = (py * side + px) * 4;
      data[offset] = INK[0];
      data[offset + 1] = INK[1];
      data[offset + 2] = INK[2];
      data[offset + 3] = 0xff;
    }
  }

  return { width: side, height: side, data };
}

// ---------------------------------------------------------------------------
// Encodage PNG
// ---------------------------------------------------------------------------

/** Table de contrôle CRC32, calculée une fois. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * Calcule le CRC32 d'un tampon, tel qu'attendu par les chunks PNG.
 * @param {Buffer} buffer
 * @returns {number}
 */
export function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Assemble un chunk PNG (longueur, type, données, CRC).
 * @param {string} type
 * @param {Buffer} body
 * @returns {Buffer}
 */
function chunk(type, body) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'latin1'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([length, typed, crc]);
}

/**
 * Encode un tampon RGBA en PNG.
 *
 * @param {{ width: number, height: number, data: Buffer }} image
 * @returns {Buffer}
 */
export function encodePng(image) {
  const { width, height, data } = image;
  if (data.length !== width * height * 4) {
    throw new TypeError(
      `données incohérentes : ${data.length} octets pour ${width} × ${height} pixels RGBA`,
    );
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur : 8 bits par composante
  ihdr[9] = 6; // type de couleur : RVBA
  ihdr[10] = 0; // compression : deflate
  ihdr[11] = 0; // filtrage : standard
  ihdr[12] = 0; // entrelacement : aucun

  // Chaque ligne est précédée d'un octet de filtre, ici « aucun ».
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Tailles produites, en pixels. */
export const ICON_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

/**
 * Écrit toutes les icônes dans un dossier.
 *
 * @param {string} outDir
 * @returns {Promise<Array<{ size: number, path: string, bytes: number }>>}
 */
export async function writeIcons(outDir) {
  await mkdir(outDir, { recursive: true });
  const written = [];

  for (const size of ICON_SIZES) {
    const png = encodePng(renderIcon(size));
    const path = join(outDir, `icon-${size}.png`);
    await writeFile(path, png);
    written.push({ size, path, bytes: png.length });
  }

  return written;
}

// Exécution directe.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const outDir = join(ROOT, 'src', 'extension-src', 'icons');
  const written = await writeIcons(outDir);
  for (const icon of written) {
    console.log(`✓ icon-${icon.size}.png  ${icon.bytes} octets`);
  }
}
