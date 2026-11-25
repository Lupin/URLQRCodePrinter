/**
 * Génération des icônes du produit.
 *
 * Un seul dessin, deux usages :
 *
 *  - l'**icône d'extension** (16 à 1024 px) : une tuile arrondie orange, quatre
 *    carrés blancs qui évoquent un QR Code — tuile posée au centre d'un carré
 *    de 128, 16 px transparents de chaque côté (la marge conseillée par le
 *    magasin) ;
 *  - l'**icône d'application** (Safari, macOS, iOS) : le même dessin en **bord
 *    perdu**, sans coins arrondis ni transparence. Le système applique lui-même
 *    son masque (squircle sur macOS et iOS), et une tuile déjà arrondie y
 *    apparaîtrait avec des coins vides.
 *
 * Le dessin est celui retenu après les propositions : l'orange **pur** de la
 * maison (`#ff5000`), quatre carrés blancs dont les proportions — motif à 56 %
 * de la tuile, carrés de 24 %, écart de 8 % — sont mesurées sur la référence.
 * Il est ici en **formes**, pas en pixels : chaque taille est rendue par
 * suréchantillonnage 4 × 4, donc anti-crénelée, et le petit carré garde une
 * trace à 16 px au lieu de disparaître.
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

/**
 * La couleur de la tuile : l'orange pur de la maison, `#ff5000`.
 *
 * C'est la marque elle-même — la tuile est la surface la plus visible du
 * produit, et c'est elle qui doit rester identifiable d'un magasin à l'autre.
 *
 * Ce qu'elle coûte, mesuré sur les fonds réels des barres d'outils :
 *
 * | Fond | Contraste |
 * |---|---|
 * | barre claire `#ffffff` | 3,33:1 |
 * | barre claire grise `#f1f3f4` | 2,99:1 |
 * | barre sombre `#202124` | 4,60:1 |
 * | barre sombre `#292a2d` | 4,10:1 |
 *
 * L'orange pur est un choix de marque assumé : le seuil de 3:1 de WCAG 1.4.11
 * régit les composants du contenu web, pas une icône peinte par le navigateur
 * dans sa propre barre, et l'icône reste franche sur la barre blanche comme sur
 * les barres sombres. Le gris clair des barres est le seul fond où elle passe
 * juste sous le seuil — c'est le prix de la teinte exacte de l'interface.
 */
export const INK = [255, 80, 0];

/** Le papier du motif : les quatre carrés blancs. */
const PAPIER = [255, 255, 255];

/**
 * Le dessin, sur une grille de 128 unités.
 *
 * Tout est exprimé dans cette grille puis mis à l'échelle : les proportions ne
 * dépendent donc pas de la taille rendue, et une seule retouche vaut pour tous
 * les formats. Le motif occupe 72 unités de côté (56 % de la tuile), soit un
 * carré de repère de 31 unités, un écart de 10 et un petit carré de 15 — les
 * proportions mesurées sur la référence.
 */
const FORME = {
  tuile: { x: 0, y: 0, w: 128, h: 128, r: 28 },
  carres: [
    { x: 28, y: 28, w: 31, h: 31 },
    { x: 69, y: 28, w: 31, h: 31 },
    { x: 28, y: 69, w: 31, h: 31 },
    { x: 69, y: 69, w: 15, h: 15 },
  ],
};

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------

/**
 * Le cadre du dessin, selon que l'on suit ou non la marge du magasin.
 *
 * Le magasin suggère que l'icône occupe **96 × 96** au centre d'un carré de
 * 128, les 16 pixels de chaque côté restant transparents : c'est un conseil
 * d'harmonie entre extensions dans la page du magasin, pas une exigence. La
 * variante `marge` l'applique en réduisant le dessin d'un quart et en le
 * centrant — les proportions, elles, ne changent pas.
 *
 * @param {boolean} marge
 * @returns {{ x: number, y: number, echelle: number }}
 */
function cadreDe(marge) {
  if (!marge) return { x: 0, y: 0, echelle: 1 };
  const echelle = 96 / 128;
  const retrait = (128 - 96) / 2;
  return { x: retrait, y: retrait, echelle };
}

/** Applique le cadre à un rectangle (arrondi ou non). */
function placerRectangle(forme, cadre) {
  return {
    x: cadre.x + forme.x * cadre.echelle,
    y: cadre.y + forme.y * cadre.echelle,
    w: forme.w * cadre.echelle,
    h: forme.h * cadre.echelle,
    r: (forme.r ?? 0) * cadre.echelle,
  };
}

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

/**
 * La couleur du dessin à un point, ou `null` si le point est transparent.
 *
 * @param {number} x
 * @param {number} y
 * @param {{ plein: boolean, formes: object }} options
 * @returns {number[] | null}
 */
function couleurAuPoint(x, y, options) {
  const { formes } = options;
  // En bord perdu, la tuile couvre tout le carré : aucune transparence.
  const tuile = options.plein ? { ...formes.tuile, r: 0 } : formes.tuile;
  if (!dansRectangle(x, y, tuile)) return null;

  for (const carre of formes.carres) {
    if (dansRectangle(x, y, carre)) return PAPIER;
  }
  return INK;
}

/**
 * Rend l'icône dans un tampon RGBA.
 *
 * Chaque pixel est échantillonné 4 × 4 : le contour de la tuile, ses arrondis et
 * les bords des carrés sont donc anti-crénelés, et le petit carré garde une
 * trace grise à 16 px plutôt que de disparaître d'un coup.
 *
 * @param {number} size Côté en pixels.
 * @param {{ plein?: boolean, marge?: boolean }} [options] `plein` : bord perdu,
 *   pour l'icône d'application — le système applique son propre masque.
 *   `marge` : dessin réduit à 96 unités sur 128, la recommandation du magasin
 *   pour l'icône de la fiche.
 * @returns {{ width: number, height: number, data: Buffer }}
 */
export function renderIcon(size, options = {}) {
  const side = Math.max(1, Math.trunc(size));
  // Tampon laissé à zéro : fond **transparent**.
  const data = Buffer.alloc(side * side * 4);
  const quatre = 4;
  const cadre = cadreDe(options.marge === true && options.plein !== true);
  const formes = {
    tuile: placerRectangle(FORME.tuile, cadre),
    carres: FORME.carres.map((carre) => placerRectangle(carre, cadre)),
  };

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
          const couleur = couleurAuPoint(x, y, { plein: options.plein === true, formes });
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
    // La marge du magasin : le dessin occupe 96 unités sur 128, 16 de chaque
    // côté restent transparents. C'est la recommandation de la documentation
    // pour l'icône de la fiche, appliquée à toute la série pour que l'icône de
    // la page des extensions et celle du magasin ne diffèrent pas.
    const png = await encodePng(renderIcon(size, { marge: true }));
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
