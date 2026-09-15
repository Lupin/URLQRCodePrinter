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

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// L'encodeur PNG est partagé avec l'application : un seul codec, donc un seul
// endroit à corriger, et une seule implémentation à éprouver.
import { encodePng } from '../src/core/png.js';

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
    const png = await encodePng(renderIcon(size));
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
