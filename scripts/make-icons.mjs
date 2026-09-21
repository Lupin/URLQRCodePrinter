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

/**
 * Encre du motif : l'accent de l'interface, `#c2410c`.
 *
 * La couleur est **choisie**, pas subie : c'est celle de la charte, et une
 * marque qui ne serait pas de la couleur de la marque ne serait pas une marque.
 *
 * Ce qu'elle coûte, mesuré sur les fonds réels des barres d'outils :
 *
 * | Fond | Contraste |
 * |---|---|
 * | barre claire `#ffffff` | 5,18:1 |
 * | barre claire grise `#f1f3f4` | 4,65:1 |
 * | barre sombre `#202124` | 3,11:1 |
 * | barre sombre `#292a2d` | **2,77:1** |
 *
 * Le seuil de 3:1 de WCAG 1.4.11 régit les composants **du contenu web** : il ne
 * s'applique pas à une icône peinte par le navigateur dans sa propre barre. La
 * valeur basse n'est donc pas une non-conformité, c'est un arbitrage assumé —
 * l'icône reste visible sur une barre sombre, simplement moins franche que sur
 * une barre claire. Le graphite, lui, y tombait à 1,08:1 : il disparaissait.
 */
export const INK = [194, 65, 12];

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
/**
 * Motif QR suggéré, pour les tailles où la matrice réelle ne peut pas exister.
 *
 * Trois repères d'orientation aux angles, et quelques modules épars. C'est la
 * structure que l'œil identifie comme un QR code — un aplat disait seulement
 * « il y a quelque chose ici ». À 32 px, cinq modules de côté tiennent dans
 * dix pixels : assez pour se lire.
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} taille Côté du carré, en unités de logo.
 * @returns {number[][]} rectangles `[x0, y0, x1, y1]`
 */
export function qrSuggestion(x0, y0, taille) {
  const m = taille / 21;
  // Quatre modules de côté, et non cinq : à cinq, le repère venait toucher le
  // trait de la feuille et se confondait avec lui.
  const c = 4 * m;
  const rects = [
    [x0, y0],
    [x0 + taille - c, y0],
    [x0, y0 + taille - c],
  ].map(([x, y]) => [x, y, x + c, y + c]);

  // Modules épars, à un module et demi : à un seul, ils disparaissaient sous
  // deux pixels. Sans eux, trois carrés pourraient passer pour autre chose.
  for (const [col, lig] of [[7, 7], [9, 12], [12, 7], [14, 14], [11, 17], [7, 14], [17, 9]]) {
    const x = x0 + col * m;
    const y = y0 + lig * m;
    rects.push([x, y, x + 1.5 * m, y + 1.5 * m]);
  }

  return rects;
}

export function renderIcon(size) {
  const side = Math.max(1, Math.trunc(size));
  // Tampon laissé à zéro : fond **transparent**.
  const data = Buffer.alloc(side * side * 4);

  // Le dessin vit sur une grille de 64 × 64, comme `docs/logo/logo-2-trait.svg`.
  const unite = 64 / side;
  // 4,5 unités sur 64, et non les 2,5 du dessin de la page : une icône n'est
  // pas un logo. À 2,5, le trait vaut 0,6 pixel à 16 px — l'icône s'efface. Quatre
  // épaisseurs ont été comparées de 16 à 128 px : 3,5 reste timide, 5,5 engorge
  // la feuille et mange le QR, 4,5 est le cran où la silhouette s'impose sans
  // que le motif perde sa place. Le plancher `unite` garantit par ailleurs un
  // pixel de trait aux très petites tailles.
  const trait = Math.max(4.5, unite);
  const d = trait / 2;
  const rects = [
    // Feuille : trois côtés, arrêtés au bord supérieur du corps.
    [18 - d, 2, 18 + d, 30 - d],
    [18 - d, 2 - d, 46 + d, 2 + d],
    [46 - d, 2, 46 + d, 30 - d],
    // Corps de l'imprimante : contour complet.
    [8 - d, 30 - d, 56 + d, 30 + d],
    [8 - d, 52 - d, 56 + d, 52 + d],
    [8 - d, 30 - d, 8 + d, 52 + d],
    [56 - d, 30 - d, 56 + d, 52 + d],
    // Fente de sortie, et voyant.
    [17, 36 - d, 47, 36 + d],
    [47, 44, 51, 48],
  ];

  // Le QR n'est lisible qu'à partir d'une certaine taille : à 16 px, ses
  // 21 modules tiennent dans 5 pixels. En dessous du seuil, il devient un aplat
  // — la marque reste reconnaissable, le détail disparaît.
  const seuilModules = 96;
  const modulesLisibles = side >= seuilModules;
  const [qx, qy, qs] = [21.5, 5.5, 1.05];
  const cote = MODULE_COUNT * qs;
  const grid = modulesLisibles ? buildMatrix() : null;
  // Inscrit dans la feuille, avec de l'air : le carré du motif ne doit pas
  // venir buter contre son trait.
  const suggere = modulesLisibles ? null : qrSuggestion(24, 8, 16);

  for (let py = 0; py < side; py++) {
    for (let px = 0; px < side; px++) {
      const x = (px + 0.5) * unite;
      const y = (py + 0.5) * unite;

      let encre = false;
      for (const [x0, y0, x1, y1] of rects) {
        if (x >= x0 && x < x1 && y >= y0 && y < y1) { encre = true; break; }
      }

      if (!encre && suggere) {
        for (const [x0, y0, x1, y1] of suggere) {
          if (x >= x0 && x < x1 && y >= y0 && y < y1) { encre = true; break; }
        }
      }

      if (!encre && grid) {
        const dedans = x >= qx && x < qx + cote && y >= qy && y < qy + cote;
        if (dedans) {
          const col = Math.floor((x - qx) / qs);
          const lig = Math.floor((y - qy) / qs);
          encre = grid[lig]?.[col] === true;
        }
      }

      if (!encre) continue;
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
