/**
 * Génération des icônes du produit.
 *
 * Une seule source pour toutes les tailles, et pour les deux usages :
 *
 *  - l'**icône d'extension** (16 à 1024 px) : une tuile arrondie orange sur fond
 *    transparent. C'est celle de la barre d'outils, de la page des extensions et
 *    de la fiche du magasin ;
 *  - l'**icône d'application** (Safari, macOS, iOS) : le même dessin en **bord
 *    perdu**, sans coins arrondis ni transparence. Le système applique lui-même
 *    son masque (squircle sur macOS et iOS), et une tuile déjà arrondie y
 *    apparaîtrait avec des coins vides.
 *
 * Le dessin est celui retenu après les propositions : une étiquette crème avec
 * son QR Code sortant d'une imprimante, sur une tuile orange. Il est ici en
 * **formes**, pas en pixels : chaque taille est rendue par suréchantillonnage
 * 4 × 4, donc anti-crénelée, et le QR Code se simplifie quand ses modules
 * deviendraient plus fins qu'un pixel.
 *
 * Aucune dépendance graphique : l'encodeur PNG est celui du cœur partagé
 * (`src/core/png.js`), donc les icônes se régénèrent partout où le projet se
 * construit — y compris sans Chrome.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// L'encodeur PNG est partagé avec l'application : un seul codec, donc un seul
// endroit à corriger, et une seule implémentation à éprouver.
import { encodePng } from '../src/core/png.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Côté de la matrice : un QR Code de version 1 fait 21 modules. */
export const MODULE_COUNT = 21;

/**
 * La couleur de la tuile : l'accent de l'interface, `#c2410c`.
 *
 * C'est la marque elle-même — la tuile est la surface la plus visible du
 * produit, et c'est elle qui doit rester identifiable d'un magasin à l'autre.
 *
 * Ce qu'elle coûte, mesuré sur les fonds réels des barres d'outils :
 *
 * | Fond | Contraste |
 * |---|---|
 * | barre claire `#ffffff` | 5,18:1 |
 * | barre claire grise `#f1f3f4` | 4,65:1 |
 * | barre sombre `#202124` | 3,11:1 |
 * | barre sombre `#292a2d` | 2,77:1 |
 *
 * Le seuil de 3:1 de WCAG 1.4.11 régit les composants **du contenu web** : il ne
 * s'applique pas à une icône peinte par le navigateur dans sa propre barre. La
 * valeur basse n'est donc pas une non-conformité, c'est un arbitrage assumé —
 * l'icône reste visible sur une barre sombre, simplement moins franche que sur
 * une barre claire.
 */
export const INK = [194, 65, 12];

/** Le papier : l'étiquette et le corps de l'imprimante. */
const PAPIER = [247, 243, 236];
/** L'encre du QR Code : le graphite de l'interface. */
const ENCRE = [22, 22, 22];
/** Le voyant, d'un cran plus sombre : l'orange vif se perdrait sur le papier. */
const VOYANT = [143, 47, 8];

/**
 * Le dessin, sur une grille de 128 unités.
 *
 * Tout est exprimé dans cette grille, puis mis à l'échelle : les proportions ne
 * dépendent donc pas de la taille rendue, et une seule retouche vaut pour tous
 * les formats.
 */
const FORME = {
  tuile: { x: 0, y: 0, w: 128, h: 128, r: 28 },
  etiquette: { x: 34, y: 14, w: 60, h: 64, r: 7 },
  // Le QR Code s'arrête au bord supérieur du corps : le corps le recouvre, et un
  // repère coupé par le papier se verrait à toutes les tailles.
  qr: { x: 40, y: 18, cote: 48 },
  corps: { x: 8, y: 66, w: 112, h: 44, r: 12 },
  fente: { x: 20, y: 76, w: 88, h: 12, r: 6 },
  voyant: { cx: 102, cy: 99, r: 4.5 },
};

// ---------------------------------------------------------------------------
// Le motif
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
 * Motif QR Code suggéré, pour les tailles où la matrice réelle ne peut pas exister.
 *
 * Trois repères d'orientation aux angles, et quelques modules épars. C'est la
 * structure que l'œil identifie comme un QR Code — un aplat disait seulement
 * « il y a quelque chose ici ».
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} taille Côté du carré, en unités de logo.
 * @returns {number[][]} rectangles `[x0, y0, x1, y1]`
 */
export function qrSuggestion(x0, y0, taille) {
  const m = taille / 21;
  const c = 4 * m;
  const rects = [
    [x0, y0],
    [x0 + taille - c, y0],
    [x0, y0 + taille - c],
  ].map(([x, y]) => [x, y, x + c, y + c]);

  for (const [col, lig] of [[7, 7], [9, 12], [12, 7], [14, 14], [11, 17], [7, 14], [17, 9]]) {
    const x = x0 + col * m;
    const y = y0 + lig * m;
    rects.push([x, y, x + 1.5 * m, y + 1.5 * m]);
  }

  return rects;
}

/**
 * Le QR Code à dessiner selon la taille, et la finesse de sa grille.
 *
 * À 21 modules de côté, un module vaut moins d'un pixel en dessous de 128 px :
 * il devient du bruit. On descend donc à une grille de 7 modules (repères de
 * 2 × 2), puis à 3 (repères d'un module) — à 16 px, cinq pixels de QR Code ne
 * peuvent pas porter davantage, et trois carrés en L restent reconnaissables.
 *
 * @param {number} taille
 * @returns {{ n: number, sombre: (colonne: number, ligne: number) => boolean }}
 */
function grilleQr(taille) {
  if (taille >= 128) {
    const matrice = buildMatrix();
    return { n: MODULE_COUNT, sombre: (colonne, ligne) => matrice[ligne]?.[colonne] === true };
  }
  if (taille >= 40) {
    const reperes = new Set();
    for (const [ox, oy] of [[0, 0], [5, 0], [0, 5]]) {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) reperes.add(`${ox + x},${oy + y}`);
      }
    }
    for (const [x, y] of [[3, 0], [4, 2], [3, 3], [4, 4], [1, 3], [3, 5], [5, 3], [6, 4], [2, 6]]) {
      reperes.add(`${x},${y}`);
    }
    return { n: 7, sombre: (colonne, ligne) => reperes.has(`${colonne},${ligne}`) };
  }
  const reperes = new Set(['0,0', '2,0', '0,2', '1,1']);
  return { n: 3, sombre: (colonne, ligne) => reperes.has(`${colonne},${ligne}`) };
}

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------

/** Test d'appartenance à un rectangle arrondi, en unités. */
function dansRectangle(x, y, forme) {
  const { x: gx, y: gy, w, h, r } = forme;
  if (x < gx || x > gx + w || y < gy || y > gy + h) return false;
  const rayon = Math.min(r, w / 2, h / 2);
  // Les quatre coins : on ramène le point dans le quadrant du centre de l'arc.
  const cx = Math.min(Math.max(x, gx + rayon), gx + w - rayon);
  const cy = Math.min(Math.max(y, gy + rayon), gy + h - rayon);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= rayon * rayon;
}

/** Test d'appartenance à un disque, en unités. */
function dansDisque(x, y, forme) {
  const dx = x - forme.cx;
  const dy = y - forme.cy;
  return dx * dx + dy * dy <= forme.r * forme.r;
}

/**
 * La couleur du dessin à un point, ou `null` si le point est transparent.
 *
 * @param {number} x
 * @param {number} y
 * @param {{ plein?: boolean, grille: object }} options
 * @returns {number[] | null}
 */
function couleurAuPoint(x, y, options) {
  const tuile = options.plein ? { ...FORME.tuile, r: 0 } : FORME.tuile;
  if (!dansRectangle(x, y, tuile)) return null;
  let couleur = INK;

  if (dansRectangle(x, y, FORME.etiquette)) {
    couleur = PAPIER;
    const { qr } = FORME;
    if (x >= qr.x && x < qr.x + qr.cote && y >= qr.y && y < qr.y + qr.cote) {
      const colonne = Math.floor(((x - qr.x) / qr.cote) * options.grille.n);
      const ligne = Math.floor(((y - qr.y) / qr.cote) * options.grille.n);
      couleur = options.grille.sombre(colonne, ligne) ? ENCRE : PAPIER;
    }
  }

  if (dansRectangle(x, y, FORME.corps)) couleur = PAPIER;
  if (dansRectangle(x, y, FORME.fente)) couleur = ENCRE;
  if (dansDisque(x, y, FORME.voyant)) couleur = VOYANT;
  return couleur;
}

/**
 * Rend l'icône dans un tampon RGBA.
 *
 * Chaque pixel est échantillonné 4 × 4 : le contour de la tuile, les arrondis et
 * les modules du QR Code sont donc anti-crénelés, et un module plus fin qu'un pixel
 * laisse une trace grise plutôt que de disparaître d'un coup.
 *
 * @param {number} size Côté en pixels.
 * @param {{ plein?: boolean }} [options] `plein` : bord perdu, pour l'icône
 *   d'application — le système applique son propre masque.
 * @returns {{ width: number, height: number, data: Buffer }}
 */
export function renderIcon(size, options = {}) {
  const side = Math.max(1, Math.trunc(size));
  // Tampon laissé à zéro : fond **transparent**.
  const data = Buffer.alloc(side * side * 4);
  const quatre = 4;
  const grille = grilleQr(side);

  for (let py = 0; py < side; py++) {
    for (let px = 0; px < side; px++) {
      let sommeR = 0;
      let sommeV = 0;
      let sommeB = 0;
      let sommeA = 0;

      for (let sy = 0; sy < quatre; sy++) {
        for (let sx = 0; sx < quatre; sx++) {
          const x = ((px + (sx + 0.5) / quatre) / side) * 128;
          const y = ((py + (sy + 0.5) / quatre) / side) * 128;
          const couleur = couleurAuPoint(x, y, { plein: options.plein === true, grille });
          if (!couleur) continue;
          sommeR += couleur[0];
          sommeV += couleur[1];
          sommeB += couleur[2];
          sommeA += 1;
        }
      }

      if (sommeA === 0) continue;
      const offset = (py * side + px) * 4;
      data[offset] = Math.round(sommeR / sommeA);
      data[offset + 1] = Math.round(sommeV / sommeA);
      data[offset + 2] = Math.round(sommeB / sommeA);
      data[offset + 3] = Math.round((sommeA / (quatre * quatre)) * 255);
    }
  }

  return { width: side, height: side, data };
}

/** Tailles produites pour l'extension, en pixels. */
export const ICON_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

/**
 * Les fichiers de l'icône d'application, et leur côté en pixels.
 *
 * Les noms sont ceux que Xcode a posés dans `Contents.json` : le générateur
 * écrit les fichiers, pas le catalogue, qui reste la propriété du projet Xcode.
 */
export const APP_ICON_FILES = {
  'universal-icon-1024@1x.png': 1024,
  'mac-icon-16@1x.png': 16,
  'mac-icon-16@2x.png': 32,
  'mac-icon-32@1x.png': 32,
  'mac-icon-32@2x.png': 64,
  'mac-icon-128@1x.png': 128,
  'mac-icon-128@2x.png': 256,
  'mac-icon-256@1x.png': 256,
  'mac-icon-256@2x.png': 512,
  'mac-icon-512@1x.png': 512,
  'mac-icon-512@2x.png': 1024,
};

/**
 * Écrit toutes les icônes d'extension dans un dossier.
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

/**
 * Écrit l'icône d'application (Safari, macOS, iOS) dans son catalogue Xcode.
 *
 * Le dessin est le même, en bord perdu : le système découpe le squircle, et une
 * tuile déjà arrondie laisserait des coins transparents dans le masque.
 *
 * @param {string} outDir
 * @returns {Promise<Array<{ fichier: string, size: number, bytes: number }>>}
 */
export async function writeAppIcons(outDir) {
  await mkdir(outDir, { recursive: true });
  const written = [];

  for (const [fichier, size] of Object.entries(APP_ICON_FILES)) {
    const png = await encodePng(renderIcon(size, { plein: true }));
    await writeFile(join(outDir, fichier), png);
    written.push({ fichier, size, bytes: png.length });
  }

  return written;
}

/** Le catalogue d'icônes du projet Safari. */
export const APP_ICON_DIR = join(
  ROOT, 'native', 'safari', 'URLQRCodePrinter', 'Shared (App)', 'Assets.xcassets',
  'AppIcon.appiconset',
);

// Exécution directe.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const extensionDir = join(ROOT, 'src', 'extension-src', 'icons');
  const written = await writeIcons(extensionDir);
  for (const icon of written) {
    console.log(`✓ icon-${icon.size}.png  ${icon.bytes} octets`);
  }

  if (existsSync(APP_ICON_DIR)) {
    const app = await writeAppIcons(APP_ICON_DIR);
    console.log(`\n✓ ${app.length} icônes d'application dans ${APP_ICON_DIR.slice(ROOT.length + 1)}`);
  }
}
