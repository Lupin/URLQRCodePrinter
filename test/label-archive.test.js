/**
 * Archive des étiquettes composées pour une imprimante Niimbot.
 *
 * Ce que ces tests protègent :
 *
 * 1. **Le dossier contient les images composées, telles quelles.** Le module
 *    reçoit des PNG déjà rendus par le chemin de l'impression ; il ne les
 *    retouche pas. Une seconde composition aurait fini par différer de ce qui
 *    sort de l'imprimante.
 * 2. **Le manifeste porte tous les réglages de l'onglet**, sans quoi le dossier
 *    décrirait des étiquettes qu'on ne saurait pas recomposer.
 * 3. **Les noms de fichiers se lisent dans l'ordre** et survivent aux accents.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPrinterLabelArchive,
  printerLabelArchiveName,
  printerLabelFileName,
  LABEL_ARCHIVE_FORMAT,
} from '../src/core/label-archive.js';
import { readStoredZip } from '../src/core/zip.js';

/** Un PNG minimal mais valide : en-tête + IHDR, de quoi lire les dimensions. */
function fauxPng(width, height) {
  const octets = new Uint8Array(33);
  octets.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const vue = new DataView(octets.buffer);
  vue.setUint32(16, width);
  vue.setUint32(20, height);
  return octets;
}

/** Les dimensions inscrites dans l'en-tête IHDR d'un PNG. */
function dimensionsPng(octets) {
  const vue = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  return { width: vue.getUint32(16), height: vue.getUint32(20) };
}

const ETIQUETTES = [
  {
    fileName: '01-premier.png',
    png: fauxPng(96, 176),
    widthMm: 12,
    heightMm: 22,
    widthPx: 96,
    heightPx: 176,
    pxPerModule: 2,
    url: 'https://exemple.fr/a',
    title: 'Premier',
  },
  {
    fileName: '02-second.png',
    png: fauxPng(96, 176),
    widthMm: 12,
    heightMm: 22,
    widthPx: 96,
    heightPx: 176,
    pxPerModule: 2,
    url: 'https://exemple.fr/b',
    title: 'Second',
  },
];

function archiver(extra = {}) {
  return buildPrinterLabelArchive({
    labels: ETIQUETTES,
    title: 'Mes liens',
    settings: { profile: 'D110', supply: 'd110-12x22', density: 2, rotation: 'dessous' },
    now: Date.UTC(2025, 0, 15, 11, 30),
    ...extra,
  });
}

function contenu(bytes) {
  return Object.fromEntries(
    [...readStoredZip(bytes)].map(([nom, donnees]) => [nom, new TextDecoder().decode(donnees)]),
  );
}

test("l'archive contient les images, le manifeste et la correspondance", () => {
  const { bytes } = archiver();
  const fichiers = [...readStoredZip(bytes).keys()];
  assert.ok(fichiers.includes('etiquettes/01-premier.png'));
  assert.ok(fichiers.includes('etiquettes/02-second.png'));
  assert.ok(fichiers.includes('etiquettes.json'));
  assert.ok(fichiers.includes('liens.csv'));
  assert.equal(fichiers.length, 4);
});

test('les images sont déposées telles quelles, sans être retouchées', () => {
  // Le module reçoit des PNG rendus par le chemin de l'impression. Les
  // retoucher ici ferait diverger le dossier de ce qui sort de la machine.
  const { bytes } = archiver();
  const entrees = readStoredZip(bytes);
  const deposee = entrees.get('etiquettes/01-premier.png');

  assert.deepEqual([...deposee], [...ETIQUETTES[0].png]);
  assert.deepEqual(dimensionsPng(deposee), { width: 96, height: 176 });
});

test('le manifeste porte tous les réglages de l\'onglet', () => {
  const { manifest } = archiver();
  assert.equal(manifest.format, LABEL_ARCHIVE_FORMAT);
  assert.equal(manifest.version, 1);
  assert.deepEqual(manifest.settings, {
    profile: 'D110', supply: 'd110-12x22', density: 2, rotation: 'dessous',
  });
  assert.equal(manifest.count, 2);
  assert.equal(manifest.exportedAt, new Date(Date.UTC(2025, 0, 15, 11, 30)).toISOString());
});

test('le manifeste décrit chaque étiquette, dimensions comprises', () => {
  const { manifest } = archiver();
  const premiere = manifest.labels[0];
  assert.equal(premiere.file, 'etiquettes/01-premier.png');
  assert.equal(premiere.url, 'https://exemple.fr/a');
  assert.equal(premiere.widthMm, 12);
  assert.equal(premiere.heightMm, 22);
  assert.equal(premiere.widthPx, 96);
  assert.equal(premiere.heightPx, 176);
  assert.equal(premiere.pxPerModule, 2);
});

test('une étiquette sans nombre de pixels par module ne l\'invente pas', () => {
  const { manifest } = archiver({
    labels: [{ ...ETIQUETTES[0], pxPerModule: undefined }],
  });
  assert.ok(!('pxPerModule' in manifest.labels[0]));
});

test('le CSV relie chaque lien à son image', () => {
  const { bytes } = archiver();
  const lignes = contenu(bytes)['liens.csv'].replace(/^\uFEFF/, '').trim().split('\r\n');

  assert.equal(lignes[0], 'N°;URL;Titre;Largeur (mm);Hauteur (mm);Image');
  assert.equal(lignes[1], '1;https://exemple.fr/a;Premier;12;22;etiquettes/01-premier.png');
  assert.equal(lignes[2], '2;https://exemple.fr/b;Second;12;22;etiquettes/02-second.png');
});

test('un titre à séparateur ne casse pas le CSV', () => {
  const { bytes } = archiver({
    labels: [{ ...ETIQUETTES[0], title: 'Un; deux' }],
  });
  assert.ok(contenu(bytes)['liens.csv'].includes('"Un; deux"'));
});

test("le nom d'une étiquette se lit dans l'ordre et survit aux accents", () => {
  assert.equal(printerLabelFileName(1, 'Un article'), '01-un-article.png');
  assert.equal(printerLabelFileName(12, 'Été à Nîmes', 2), '12-ete-a-nimes.png');
  // Les caractères qui n'ont rien à faire dans un nom de fichier disparaissent.
  assert.equal(printerLabelFileName(3, 'a/b:c*d?e'), '03-a-b-c-d-e.png');
  // Un titre vide ne laisse pas un nom qui commence par un tiret.
  assert.equal(printerLabelFileName(4, ''), '04-etiquette.png');
  assert.equal(printerLabelFileName(5, '   '), '05-etiquette.png');
});

test('le nom de fichier est borné', () => {
  // Un titre de page peut faire trois cents caractères : le nom de fichier, non.
  const nom = printerLabelFileName(1, 'x'.repeat(300));
  assert.ok(nom.length <= 60, `${nom.length} caractères`);
  assert.ok(nom.endsWith('.png'));
});

test("le nom de l'archive distingue ce dossier de celui de l'autre onglet", () => {
  // L'onglet « Étiquette (divers) » produit « etiquettes-… » : sans ce mot, les
  // deux dossiers seraient indiscernables dans un téléchargement.
  const nom = printerLabelArchiveName(Date.UTC(2025, 0, 15, 11, 30), 'Mes liens');
  assert.match(nom, /^Mes-liens-niimbot-\d{8}-\d{4}\.zip$/);
});
