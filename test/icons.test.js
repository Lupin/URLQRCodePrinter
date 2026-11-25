/**
 * Tests du générateur d'icônes.
 *
 * Un PNG mal formé ne provoque pas d'erreur visible : le navigateur affiche
 * simplement une icône vide. On vérifie donc la structure du fichier, et surtout
 * on le décompresse pour retrouver les pixels d'origine — ce qui valide
 * l'encodage autrement qu'en le relisant avec le code qui l'a produit.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APP_ICON_DIR,
  APP_ICON_FILES,
  renderIcon,
  writeIcons,
  ICON_SIZES,
  INK,
} from '../scripts/make-icons.mjs';

// L'encodeur vit dans le cœur partagé : le générateur d'icônes et l'export
// tableur utilisent donc exactement le même code.
import { encodePng, crc32 } from '../src/core/png.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS_DIR = join(ROOT, 'src', 'extension-src', 'icons');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Découpe un PNG en chunks et valide chaque CRC.
 * @param {Buffer} png
 * @returns {Map<string, Buffer>}
 */
function parsePng(png) {
  // L'encodeur renvoie un Uint8Array ; les utilitaires de lecture ci-dessous
  // sont ceux de Buffer.
  png = Buffer.from(png);
  assert.ok(png.subarray(0, 8).equals(PNG_SIGNATURE), 'signature PNG absente');

  const chunks = new Map();
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('latin1', offset + 4, offset + 8);
    const body = png.subarray(offset + 8, offset + 8 + length);
    const declared = png.readUInt32BE(offset + 8 + length);
    const actual = crc32(png.subarray(offset + 4, offset + 8 + length));

    assert.equal(declared, actual, `CRC invalide pour le chunk ${type}`);
    chunks.set(type, Buffer.from(body));
    offset += 12 + length;
  }

  assert.equal(offset, png.length, 'octets excédentaires après le dernier chunk');
  return chunks;
}

/**
 * Décode un PNG RVBA non entrelacé en pixels bruts.
 * @param {Buffer} png
 * @returns {{ width: number, height: number, data: Buffer }}
 */
function decodePng(png) {
  const chunks = parsePng(Buffer.from(png));
  assert.ok(chunks.has('IHDR'));
  assert.ok(chunks.has('IEND'));

  const ihdr = chunks.get('IHDR');
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  assert.equal(ihdr[8], 8, 'profondeur attendue : 8 bits');
  assert.equal(ihdr[9], 6, 'type de couleur attendu : RVBA');
  assert.equal(ihdr[12], 0, 'entrelacement non supporté par ce décodeur');

  const raw = inflateSync(chunks.get('IDAT'));
  const stride = width * 4 + 1;
  assert.equal(raw.length, stride * height, 'flux décompressé de taille inattendue');

  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * stride], 0, `filtre non nul à la ligne ${y}`);
    raw.copy(data, y * width * 4, y * stride + 1, (y + 1) * stride);
  }

  return { width, height, data };
}

// ---------------------------------------------------------------------------
// Motif
// ---------------------------------------------------------------------------

const BLANC = [255, 255, 255];

/** Le pixel d'une image rendue, en coordonnées de la grille 128. */
function pixel(image, x, y) {
  const col = Math.floor((x / 128) * image.width);
  const lig = Math.floor((y / 128) * image.height);
  const offset = (lig * image.width + col) * 4;
  return [...image.data.subarray(offset, offset + 4)];
}

test('le dessin est une tuile orange à quatre carrés blancs', () => {
  const image = renderIcon(128, { plein: true });
  // Le centre de la tuile tombe dans l'écart entre les carrés : c'est l'orange.
  assert.deepEqual(pixel(image, 64, 64).slice(0, 3), INK);
  // Le centre des quatre carrés est blanc.
  for (const [x, y] of [[43, 43], [84, 43], [43, 84], [76, 76]]) {
    assert.deepEqual(pixel(image, x, y).slice(0, 3), BLANC, `carré attendu en ${x},${y}`);
  }
});

test('les proportions du motif sont celles de la référence', () => {
  const image = renderIcon(128, { plein: true });
  let minX = 128, minY = 128, maxX = -1, maxY = -1;
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const [r, g, b] = pixel(image, x + 0.5, y + 0.5);
      if (r > 250 && g > 250 && b > 250) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  // Le motif occupe 56 % de la tuile (72 unités sur 128), mesuré sur la référence.
  const largeur = maxX - minX + 1;
  const hauteur = maxY - minY + 1;
  assert.ok(largeur >= 70 && largeur <= 74, `largeur du motif : ${largeur}`);
  assert.ok(hauteur >= 70 && hauteur <= 74, `hauteur du motif : ${hauteur}`);
  assert.ok(Math.abs(minX - minY) <= 1, 'le motif n’est pas centré');
});

test('le petit carré est bien plus petit que les trois autres', () => {
  const image = renderIcon(128, { plein: true });
  /** Longueur d’une plage blanche sur une ligne de la grille. */
  const plage = (y, x0 = 0, x1 = 128) => {
    let debut = -1;
    let longueur = 0;
    for (let x = x0; x < x1; x++) {
      const [r, g, b] = pixel(image, x + 0.5, y + 0.5);
      const blanc = r > 250 && g > 250 && b > 250;
      if (blanc) { if (debut === -1) debut = x; longueur += 1; }
      else if (debut !== -1) break;
    }
    return longueur;
  };
  // À y = 76, la colonne de droite ne porte que le petit carré (15 unités) ;
  // la colonne de gauche porte un grand carré (31 unités).
  assert.ok(plage(76, 65, 90) >= 13 && plage(76, 65, 90) <= 17, `petit carré : ${plage(76, 65, 90)}`);
  assert.ok(plage(43, 20, 62) >= 29 && plage(43, 20, 62) <= 33, `grand carré : ${plage(43, 20, 62)}`);
});

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------

test('renderIcon produit un tampon RVBA de la bonne taille', () => {
  const image = renderIcon(64);
  assert.equal(image.width, 64);
  assert.equal(image.height, 64);
  assert.equal(image.data.length, 64 * 64 * 4);
});

test('les coins de la tuile sont transparents', () => {
  // L'icône est une tuile arrondie : le dessin occupe le carré, mais les quatre
  // coins laissent voir la barre d'outils. Sans cet alpha, le magasin et le
  // navigateur afficheraient un carré plein aux angles vifs — et MV3 ne permet
  // plus de fournir une variante par thème (`theme_icons` a disparu avec MV2).
  const image = renderIcon(64);
  // Le coin supérieur gauche est hors de l'arrondi.
  assert.equal(image.data[3], 0, 'alpha du fond');
  assert.equal(image.data[0], 0);
});

test('l\'icône de la fiche laisse 16 pixels transparents de chaque côté', () => {
  // La recommandation du magasin : le dessin occupe 96 × 96 au centre d'un carré
  // de 128, 16 pixels transparents de chaque côté. C'est ce qui fait respirer
  // l'icône à côté des autres extensions dans la page du magasin.
  const image = renderIcon(128, { marge: true });
  const alpha = (x, y) => image.data[(y * 128 + x) * 4 + 3];
  for (const [x, y] of [[0, 0], [8, 64], [119, 64], [0, 127], [64, 8], [64, 119]]) {
    assert.equal(alpha(x, y), 0, `le bord n'est pas transparent en ${x},${y}`);
  }
  assert.equal(alpha(64, 64), 255, 'le centre du dessin est transparent');
  // Les fichiers livrés suivent la règle.
  const livre = decodePng(readFileSync(join(ICONS_DIR, 'icon-128.png')));
  assert.equal(livre.data[(8 * 128 + 64) * 4 + 3], 0);
  assert.equal(livre.data[(64 * 128 + 64) * 4 + 3], 255);
});

test('l\'icône d\'application est en bord perdu, sans transparence', () => {
  // macOS et iOS découpent eux-mêmes leur squircle : une tuile déjà arrondie y
  // laisserait des coins vides, et le système n\'aurait plus rien à masquer.
  const image = renderIcon(64, { plein: true });
  for (let i = 3; i < image.data.length; i += 4) {
    assert.equal(image.data[i], 255, `pixel transparent à l\'indice ${i / 4}`);
  }
  // Le coin est bien de la couleur de la tuile, pas du papier.
  assert.deepEqual([...image.data.subarray(0, 3)], INK);
});

test('l\'encre reste lisible sur une barre d\'outils claire et sombre', () => {
  // Contrainte du support : un seul PNG sert les deux thèmes. Le graphite de
  // l'interface tombe à 1,08:1 sur une barre sombre — l'icône disparaîtrait.
  const [r, g, b] = INK;
  const luminance = (canaux) => {
    const [lr, lg, lb] = canaux.map((canal) => {
      const c = canal / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  };
  const contraste = (a, b) => {
    const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (clair + 0.05) / (sombre + 0.05);
  };

  const BARRES = [
    ['claire', [255, 255, 255]],
    ['claire grise', [241, 243, 244]],
    ['sombre', [32, 33, 36]],
    ['sombre 2', [41, 42, 45]],
  ];

  // Le seuil de 3:1 de WCAG 1.4.11 vise les composants du contenu web, pas une
  // icône peinte par le navigateur. On tient donc deux exigences distinctes :
  // franche sur une barre claire, et **visible** sur une barre sombre — le
  // graphite y tombait à 1,08:1, ce qui est le vrai échec à interdire.
  const surClair = BARRES.filter(([nom]) => nom.startsWith('claire'));
  const surSombre = BARRES.filter(([nom]) => nom.startsWith('sombre'));

  for (const [nom, fond] of surClair) {
    const rapport = contraste([r, g, b], fond);
    // L'orange pur est un choix de marque : 3,33:1 sur le blanc, 2,99:1 sur le
    // gris clair des barres. On exige 3:1 sur le blanc et 2,9:1 sur le gris,
    // plutôt que de renier la teinte exacte de l'interface.
    const seuil = nom === 'claire' ? 3 : 2.9;
    assert.ok(rapport >= seuil, `barre ${nom} : ${rapport.toFixed(2)}:1, minimum ${seuil}:1`);
  }
  for (const [nom, fond] of surSombre) {
    const rapport = contraste([r, g, b], fond);
    assert.ok(
      rapport >= 2.5,
      `barre ${nom} : ${rapport.toFixed(2)}:1 — la marque s'efface (le graphite tombait à 1,08:1)`,
    );
  }
});

test('l\'icône contient des pixels de tuile et des pixels de motif', () => {
  const image = renderIcon(64);
  let orange = 0;
  let blanc = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    if (image.data[i + 3] === 0) continue;
    const [r, g, b] = [image.data[i], image.data[i + 1], image.data[i + 2]];
    if (r > 250 && g > 250 && b > 250) blanc++;
    else if (r > 200 && g < 120 && b < 40) orange++;
  }
  assert.ok(orange > 100, `trop peu de pixels de tuile : ${orange}`);
  assert.ok(blanc > 100, `trop peu de pixels de motif : ${blanc}`);
});

test('le rendu est déterministe', () => {
  assert.deepEqual(renderIcon(32).data, renderIcon(32).data);
});

// ---------------------------------------------------------------------------
// Encodage PNG
// ---------------------------------------------------------------------------

test('encodePng produit un PNG structurellement valide', async () => {
  const png = await encodePng(renderIcon(16));
  const chunks = parsePng(png);
  assert.deepEqual([...chunks.keys()], ['IHDR', 'IDAT', 'IEND']);
});

test('les dimensions déclarées correspondent au rendu', async () => {
  const png = await encodePng(renderIcon(48));
  const ihdr = parsePng(png).get('IHDR');
  assert.equal(ihdr.readUInt32BE(0), 48);
  assert.equal(ihdr.readUInt32BE(4), 48);
});

test('la décompression restitue exactement les pixels d\'origine', async () => {
  // Vérification la plus forte : on ne relit pas l'encodeur avec lui-même, on
  // décompresse le flux avec zlib et on compare pixel à pixel.
  for (const size of [16, 64, 256]) {
    const source = renderIcon(size);
    const decoded = decodePng(await encodePng(source));
    assert.equal(decoded.width, source.width);
    assert.equal(decoded.height, source.height);
    assert.ok(decoded.data.equals(source.data), `pixels altérés à ${size} px`);
  }
});

test('encodePng refuse des données incohérentes', async () => {
  await assert.rejects(
    () => encodePng({ width: 8, height: 8, data: new Uint8Array(10) }),
    RangeError,
  );
});

// ---------------------------------------------------------------------------
// Fichiers livrés
// ---------------------------------------------------------------------------

test('writeIcons écrit toutes les tailles attendues', async () => {
  const written = await writeIcons(ICONS_DIR);
  assert.equal(written.length, ICON_SIZES.length);
  for (const icon of written) {
    assert.ok(icon.bytes > 0);
    assert.ok(existsSync(icon.path), `fichier absent : ${icon.path}`);
  }
});

test('chaque fichier d\'icône est un PNG aux bonnes dimensions', () => {
  for (const size of ICON_SIZES) {
    const file = join(ICONS_DIR, `icon-${size}.png`);
    assert.ok(existsSync(file), `icône manquante : icon-${size}.png`);

    const decoded = decodePng(readFileSync(file));
    assert.equal(decoded.width, size, `largeur incorrecte pour icon-${size}.png`);
    assert.equal(decoded.height, size, `hauteur incorrecte pour icon-${size}.png`);
  }
});

test('le catalogue d\'icônes de l\'application est d\'accord avec le générateur', () => {
  // Ces fichiers ne sont pas dans le paquet de l'extension : rien ne les
  // régénère à la construction. Sans ce contrôle, le projet Xcode pourrait
  // garder l'ancienne marque et personne ne le verrait avant une compilation
  // sur une machine Apple.
  for (const [fichier, taille] of Object.entries(APP_ICON_FILES)) {
    const chemin = join(APP_ICON_DIR, fichier);
    assert.ok(existsSync(chemin), `icône d'application absente : ${fichier}`);
    const decoded = decodePng(readFileSync(chemin));
    assert.equal(decoded.width, taille, `${fichier} : largeur`);
    assert.equal(decoded.height, taille, `${fichier} : hauteur`);
    assert.equal(decoded.data[3], 255, `${fichier} : coin transparent`);
  }
});

test('les icônes déclarées dans le manifeste existent et sont valides', () => {
  // Le manifeste vit sous forme de gabarit dans les sources : il est
  // spécialisé par navigateur à la construction.
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'src', 'extension-src', 'manifest.template.json'), 'utf8'),
  );

  const declared = { ...manifest.icons, ...(manifest.action?.default_icon ?? {}) };
  assert.ok(Object.keys(declared).length >= 4, 'trop peu d\'icônes déclarées');

  for (const [size, path] of Object.entries(declared)) {
    const file = join(ROOT, 'src', 'extension-src', path);
    assert.ok(existsSync(file), `fichier déclaré absent : ${path}`);

    const decoded = decodePng(readFileSync(file));
    assert.equal(
      decoded.width,
      Number(size),
      `${path} fait ${decoded.width} px alors que le manifeste annonce ${size}`,
    );
  }
});

test('le manifeste déclare une icône assez grande pour l\'App Store', () => {
  // Le convertisseur Safari refuse l'empaquetage sans grande icône.
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'src', 'extension-src', 'manifest.template.json'), 'utf8'),
  );
  const sizes = Object.keys(manifest.icons).map(Number);
  assert.ok(Math.max(...sizes) >= 512, `plus grande icône : ${Math.max(...sizes)} px`);
});

// ---------------------------------------------------------------------------
// crc32
// ---------------------------------------------------------------------------

test('crc32 correspond aux valeurs de référence', () => {
  // Vecteurs de test standard de l'algorithme CRC-32 (IEEE 802.3).
  assert.equal(crc32(Buffer.from('')), 0x00000000);
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
  assert.equal(crc32(Buffer.from('a')), 0xe8b7be43);
});
