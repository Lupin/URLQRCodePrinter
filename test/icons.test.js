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
  buildMatrix,
  renderIcon,
  encodePng,
  crc32,
  writeIcons,
  ICON_SIZES,
  MODULE_COUNT,
} from '../scripts/make-icons.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS_DIR = join(ROOT, 'src', 'extension', 'icons');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Découpe un PNG en chunks et valide chaque CRC.
 * @param {Buffer} png
 * @returns {Map<string, Buffer>}
 */
function parsePng(png) {
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
  const chunks = parsePng(png);
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

test('la matrice fait 21 × 21 modules', () => {
  const grid = buildMatrix();
  assert.equal(grid.length, MODULE_COUNT);
  assert.equal(grid[0].length, MODULE_COUNT);
  assert.ok(grid.every((row) => row.every((cell) => typeof cell === 'boolean')));
});

test('les trois repères d\'orientation sont dessinés', () => {
  const grid = buildMatrix();
  for (const [ox, oy] of [[0, 0], [MODULE_COUNT - 7, 0], [0, MODULE_COUNT - 7]]) {
    // Anneau extérieur plein.
    assert.equal(grid[oy][ox], true, `coin ${ox},${oy}`);
    assert.equal(grid[oy + 6][ox + 6], true);
    // Intérieur blanc entre l'anneau et le cœur.
    assert.equal(grid[oy + 1][ox + 1], false);
    // Cœur central plein.
    assert.equal(grid[oy + 3][ox + 3], true);
  }
});

test('la matrice est déterministe', () => {
  assert.deepEqual(buildMatrix(), buildMatrix());
});

test('la matrice contient des modules noirs et des modules blancs', () => {
  const flat = buildMatrix().flat();
  assert.ok(flat.some(Boolean), 'aucun module encre');
  assert.ok(flat.some((cell) => !cell), 'aucun module blanc');
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

test('le fond de l\'icône est opaque et blanc', () => {
  const image = renderIcon(64);
  // Le coin supérieur gauche est dans la marge blanche.
  assert.equal(image.data[0], 0xff);
  assert.equal(image.data[3], 0xff, 'alpha du fond');
});

test('l\'icône contient des pixels encrés', () => {
  const image = renderIcon(64);
  let inked = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    if (image.data[i] !== 0xff && image.data[i + 3] === 0xff) inked++;
  }
  assert.ok(inked > 100, `trop peu de pixels encrés : ${inked}`);
});

test('le rendu est déterministe', () => {
  assert.deepEqual(renderIcon(32).data, renderIcon(32).data);
});

// ---------------------------------------------------------------------------
// Encodage PNG
// ---------------------------------------------------------------------------

test('encodePng produit un PNG structurellement valide', () => {
  const png = encodePng(renderIcon(16));
  const chunks = parsePng(png);
  assert.deepEqual([...chunks.keys()], ['IHDR', 'IDAT', 'IEND']);
});

test('les dimensions déclarées correspondent au rendu', () => {
  const png = encodePng(renderIcon(48));
  const ihdr = parsePng(png).get('IHDR');
  assert.equal(ihdr.readUInt32BE(0), 48);
  assert.equal(ihdr.readUInt32BE(4), 48);
});

test('la décompression restitue exactement les pixels d\'origine', () => {
  // Vérification la plus forte : on ne relit pas l'encodeur avec lui-même, on
  // décompresse le flux avec zlib et on compare pixel à pixel.
  for (const size of [16, 64, 256]) {
    const source = renderIcon(size);
    const decoded = decodePng(encodePng(source));
    assert.equal(decoded.width, source.width);
    assert.equal(decoded.height, source.height);
    assert.ok(decoded.data.equals(source.data), `pixels altérés à ${size} px`);
  }
});

test('encodePng refuse des données incohérentes', () => {
  assert.throws(
    () => encodePng({ width: 8, height: 8, data: Buffer.alloc(10) }),
    TypeError,
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

test('les icônes déclarées dans le manifeste existent et sont valides', () => {
  // Le manifeste vit sous forme de gabarit dans les sources : il est
  // spécialisé par navigateur à la construction.
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'src', 'extension', 'manifest.template.json'), 'utf8'),
  );

  const declared = { ...manifest.icons, ...(manifest.action?.default_icon ?? {}) };
  assert.ok(Object.keys(declared).length >= 4, 'trop peu d\'icônes déclarées');

  for (const [size, path] of Object.entries(declared)) {
    const file = join(ROOT, 'src', 'extension', path);
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
    readFileSync(join(ROOT, 'src', 'extension', 'manifest.template.json'), 'utf8'),
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
