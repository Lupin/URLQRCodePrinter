/**
 * Tests de l'export tableur et de ses briques.
 *
 * Un `.xlsx` est une archive ZIP de XML. Une archive mal formée ne produit pas
 * d'erreur au moment de l'écriture : Excel refuse simplement de l'ouvrir. On
 * valide donc la structure, et l'on confie la vérification finale à `unzip`,
 * un outil indépendant de notre code.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { encodePng, crc32, rgbaFromMatrix } from '../src/core/png.js';
import { createZip } from '../src/core/zip.js';
import { buildXlsx, columnLetter } from '../src/core/xlsx.js';
import {
  buildLinkSpreadsheet,
  SPREADSHEET_HEADERS,
  QR_COLUMN_INDEX,
  spreadsheetLayout,
} from '../src/core/spreadsheet.js';
import { qrPng, encodeQr } from '../src/core/qr.js';
import { createLink, resolveTargets } from '../src/core/link.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Lit les entrées d'une archive ZIP non compressée. */
function readZip(zip) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const entries = new Map();

  let offset = 0;
  while (offset + 4 <= zip.length && view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(zip.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extraLength;

    entries.set(name, {
      data: zip.subarray(start, start + size),
      declaredCrc: view.getUint32(offset + 14, true),
    });
    offset = start + size;
  }

  return entries;
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

test('encodePng produit un PNG conforme', async () => {
  const png = await encodePng(rgbaFromMatrix([[true, false], [false, true]]));
  assert.deepEqual(
    Array.from(png.subarray(0, 8)),
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  // Largeur et hauteur figurent dans l'en-tête IHDR, juste après la signature.
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  assert.equal(view.getUint32(16), 2);
  assert.equal(view.getUint32(20), 2);
});

test('encodePng refuse des dimensions incohérentes', async () => {
  await assert.rejects(() => encodePng({ width: 4, height: 4, data: new Uint8Array(8) }), RangeError);
  await assert.rejects(() => encodePng({ width: 0, height: 4, data: new Uint8Array(0) }), RangeError);
});

test('le contenu du PNG se décompresse en pixels exacts', async () => {
  const source = rgbaFromMatrix([[true]], { dark: [10, 20, 30], light: [200, 210, 220] });
  const png = await encodePng(source);

  // Le bloc IDAT commence après signature (8) + IHDR (25) + en-tête de bloc (8).
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const idatLength = view.getUint32(33);
  const raw = inflateSync(png.subarray(41, 41 + idatLength));

  assert.equal(raw[0], 0, 'octet de filtre');
  assert.deepEqual(Array.from(raw.subarray(1, 5)), [10, 20, 30, 255]);
});

test('crc32 correspond aux vecteurs de référence', () => {
  assert.equal(crc32(new Uint8Array(0)), 0x00000000);
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

// ---------------------------------------------------------------------------
// ZIP
// ---------------------------------------------------------------------------

test('createZip produit une archive lisible', () => {
  const zip = createZip([
    { name: 'a.txt', data: 'bonjour' },
    { name: 'd/b.bin', data: new Uint8Array([1, 2, 3]) },
  ]);

  const entries = readZip(zip);
  assert.deepEqual([...entries.keys()], ['a.txt', 'd/b.bin']);
  assert.equal(new TextDecoder().decode(entries.get('a.txt').data), 'bonjour');
  assert.deepEqual(Array.from(entries.get('d/b.bin').data), [1, 2, 3]);
});

test('createZip calcule les CRC de chaque entrée', () => {
  const zip = createZip([{ name: 'x', data: 'abc' }]);
  const entry = readZip(zip).get('x');
  assert.equal(entry.declaredCrc, crc32(new TextEncoder().encode('abc')));
});

test('createZip termine par un répertoire central', () => {
  const zip = createZip([{ name: 'x', data: 'a' }]);
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  // La signature de fin de répertoire doit être la dernière structure.
  let found = false;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      assert.equal(view.getUint16(i + 10, true), 1, 'nombre d\'entrées');
      found = true;
      break;
    }
  }
  assert.ok(found, 'fin de répertoire absente');
});

test('createZip refuse un nom non ASCII', () => {
  assert.throws(() => createZip([{ name: 'café.txt', data: 'x' }]), RangeError);
});

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

test('columnLetter suit la numérotation Excel', () => {
  assert.equal(columnLetter(0), 'A');
  assert.equal(columnLetter(25), 'Z');
  assert.equal(columnLetter(26), 'AA');
  assert.equal(columnLetter(51), 'AZ');
  assert.equal(columnLetter(52), 'BA');
});

test('buildXlsx produit les parties attendues', async () => {
  const xlsx = await buildXlsx({
    headers: ['A', 'B'],
    rows: [['x', 'y']],
    images: [{ row: 1, column: 1, data: new Uint8Array([1]), widthPx: 10, heightPx: 10 }],
  });

  const names = [...readZip(xlsx).keys()];
  for (const expected of [
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/styles.xml',
    'xl/worksheets/sheet1.xml',
    'xl/worksheets/_rels/sheet1.xml.rels',
    'xl/drawings/drawing1.xml',
    'xl/drawings/_rels/drawing1.xml.rels',
    'xl/media/image1.png',
  ]) {
    assert.ok(names.includes(expected), `${expected} absent : ${names.join(', ')}`);
  }
});

test('sans image, aucune partie de dessin n\'est produite', async () => {
  const xlsx = await buildXlsx({ headers: ['A'], rows: [['x']] });
  const names = [...readZip(xlsx).keys()];
  assert.equal(names.some((name) => name.includes('drawing')), false);
  assert.equal(names.some((name) => name.includes('media')), false);
});

test('le texte est échappé pour le XML', async () => {
  const xlsx = await buildXlsx({ headers: ['Titre'], rows: [['a & b <c> "d"']] });
  const sheet = new TextDecoder().decode(readZip(xlsx).get('xl/worksheets/sheet1.xml').data);
  assert.ok(sheet.includes('a &amp; b &lt;c&gt; &quot;d&quot;'));
});

test('les caractères de contrôle sont retirés du XML', async () => {
  const xlsx = await buildXlsx({ headers: ['T'], rows: [['a\u0000b\u0007c']] });
  const sheet = new TextDecoder().decode(readZip(xlsx).get('xl/worksheets/sheet1.xml').data);
  assert.ok(sheet.includes('abc'), sheet.slice(0, 300));
});

// ---------------------------------------------------------------------------
// Export complet
// ---------------------------------------------------------------------------

test('l\'export tableur intègre un QR par lien', async () => {
  const links = [
    createLink({ url: 'https://exemple.fr/a', title: 'Un' }, { now: 1736937000000 }),
    createLink({ url: 'https://exemple.fr/b', title: 'Deux' }, { now: 1736930000000 }),
  ];

  const xlsx = await buildLinkSpreadsheet(links, { now: 1736937000000 });
  const entries = readZip(xlsx);

  assert.ok(entries.has('xl/media/image1.png'));
  assert.ok(entries.has('xl/media/image2.png'));

  for (const name of ['xl/media/image1.png', 'xl/media/image2.png']) {
    const png = entries.get(name).data;
    assert.deepEqual(Array.from(png.subarray(0, 4)), [0x89, 0x50, 0x4e, 0x47]);
  }

  const sheet = new TextDecoder().decode(entries.get('xl/worksheets/sheet1.xml').data);
  assert.ok(sheet.includes('exemple.fr/a'));
  assert.ok(sheet.includes('<drawing r:id="rId1"/>'));
  assert.equal(sheet.match(/<row /g).length, links.length + 1, 'en-tête + liens');

  const drawing = new TextDecoder().decode(entries.get('xl/drawings/drawing1.xml').data);
  assert.equal(drawing.match(/<xdr:twoCellAnchor/g).length, links.length);
});

test('l\'en-tête déclare une colonne pour les QR', () => {
  assert.ok(SPREADSHEET_HEADERS.includes('QR code'));
  assert.ok(QR_COLUMN_INDEX > 0);
});

test('l\'export survit à un lien au titre contenant des chevrons', async () => {
  const links = [createLink({ url: 'https://a.fr', title: '<script>' }, { now: 1 })];
  const xlsx = await buildLinkSpreadsheet(links, { now: 1 });
  const sheet = new TextDecoder().decode(readZip(xlsx).get('xl/worksheets/sheet1.xml').data);
  assert.ok(sheet.includes('&lt;script&gt;'));
  assert.equal(sheet.includes('<script>'), false);
});

test('un export vide reste un classeur valide', async () => {
  const xlsx = await buildLinkSpreadsheet([], { now: 1 });
  const names = [...readZip(xlsx).keys()];
  assert.ok(names.includes('xl/worksheets/sheet1.xml'));
  assert.equal(names.some((name) => name.includes('media')), false);
});

test('unzip, outil indépendant, accepte l\'archive produite', async () => {
  // Vérification externe : c'est `unzip` qui juge, pas notre propre lecture.
  const dir = mkdtempSync(join(ROOT, 'test', '.tmp-xlsx-'));
  try {
    const links = [createLink({ url: 'https://exemple.fr/article', title: 'Un' }, { now: 1 })];
    const file = join(dir, 'liens.xlsx');
    writeFileSync(file, await buildLinkSpreadsheet(links, { now: 1 }));

    if (!existsSync('/usr/bin/unzip')) return; // environnement sans unzip

    const output = execFileSync('/usr/bin/unzip', ['-t', file], { encoding: 'utf8' });
    assert.match(output, /No errors detected/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// qrPng
// ---------------------------------------------------------------------------

test('qrPng produit un PNG carré à l\'échelle demandée', async () => {
  const matrix = encodeQr('https://exemple.fr', { border: 2 });
  const png = await qrPng('https://exemple.fr', { scale: 4, border: 2 });

  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);

  assert.equal(width, height);
  assert.equal(width % matrix.size, 0, 'un nombre entier de pixels par module');
});

test('qrPng borne la taille pour une URL longue', async () => {
  const long = 'https://exemple.fr/' + 'x'.repeat(400);
  const png = await qrPng(long, { scale: 8, maxSize: 128 });
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  assert.ok(view.getUint32(16) <= 128 + 64, `largeur ${view.getUint32(16)}`);
});

test('le classeur suit la cible choisie et conserve l\'URL d\'origine', async () => {
  const links = [
    createLink(
      { url: 'https://exemple.fr/article', title: 'Un', shortUrl: 'https://tinyurl.com/abc' },
      { now: 1 },
    ),
    createLink({ url: 'https://autre.fr/page', title: 'Deux' }, { now: 1 }),
  ];
  const xlsx = await buildLinkSpreadsheet(resolveTargets(links, 'short'), { now: 1 });
  const entries = readZip(xlsx);
  const sheet = new TextDecoder().decode(entries.get('xl/worksheets/sheet1.xml').data);

  // La cellule « URL » contient exactement ce qu'encode le QR de la même ligne.
  assert.ok(sheet.includes('>https://tinyurl.com/abc<'));
  // Le domaine reste celui du site visé, jamais celui du raccourcisseur.
  assert.ok(sheet.includes('>exemple.fr<'));
  assert.equal(sheet.includes('>tinyurl.com<'), false);
  // Une colonne « URL d\'origine » apparaît en fin de tableau.
  assert.ok(sheet.includes('URL d\'origine'));
  // Et l'URL d'origine n\'est pas perdue pour le premier lien.
  assert.ok(sheet.includes('https://exemple.fr/article'));
});

test('le classeur reste inchangé sans lien raccourci', async () => {
  const links = [createLink({ url: 'https://a.fr', title: 'Un' }, { now: 1 })];
  const xlsx = await buildLinkSpreadsheet(links, { now: 1 });
  const sheet = new TextDecoder().decode(readZip(xlsx).get('xl/worksheets/sheet1.xml').data);
  assert.equal(sheet.includes('URL d\'origine'), false);
  assert.ok(SPREADSHEET_HEADERS.every((header) => sheet.includes(header.replace('&', '&amp;'))));
});

test('le classeur n\'ajoute la note que si elle sert, sans décaler les images', async () => {
  const withoutNote = [createLink({ url: 'https://a.fr', title: 'Un' }, { now: 1 })];
  assert.deepEqual(spreadsheetLayout(withoutNote).headers, SPREADSHEET_HEADERS);
  assert.equal(spreadsheetLayout(withoutNote).qrColumn, QR_COLUMN_INDEX);

  const withNote = [
    createLink({ url: 'https://a.fr', title: 'Un', note: 'à relire' }, { now: 1 }),
    createLink({ url: 'https://b.fr', title: 'Deux' }, { now: 1 }),
  ];
  const layout = spreadsheetLayout(withNote);
  assert.ok(layout.headers.includes('Note'));
  assert.equal(layout.noteColumn, 5);
  // L'image doit rester ancrée sur la colonne du QR, qui s'est décalée.
  assert.equal(layout.qrColumn, layout.headers.indexOf('QR code'));
  assert.equal(layout.qrColumn, QR_COLUMN_INDEX + 1);

  const xlsx = await buildLinkSpreadsheet(withNote, { now: 1 });
  const entries = readZip(xlsx);
  const sheet = new TextDecoder().decode(entries.get('xl/worksheets/sheet1.xml').data);
  assert.ok(sheet.includes('>Note<'), 'en-tête de la note');
  assert.ok(sheet.includes('à relire'));
  // Les ancres d'image vivent dans le dessin, pas dans la feuille.
  assert.equal(sheet.includes('CellAnchor'), false);

  const drawing = new TextDecoder().decode(entries.get('xl/drawings/drawing1.xml').data);
  assert.equal(drawing.match(/<xdr:twoCellAnchor/g).length, withNote.length);
  // La colonne de départ de chaque ancre, en base 0 : « Note » occupe la 5e, le
  // QR la 7e. Chaque image porte un `from` et un `to` : on ne lit que les `from`.
  const columns = [...drawing.matchAll(/<xdr:from><xdr:col>(\d+)<\/xdr:col>/g)]
    .map((m) => Number(m[1]));
  assert.deepEqual(
    columns,
    Array(withNote.length).fill(layout.qrColumn),
    'QR ancré sur la bonne colonne',
  );
});

test('chaque QR est ancré à sa propre ligne, comme Excel l\'écrit', async () => {
  // Défaut d'origine : un `oneCellAnchor`, licite mais qu'Excel n'écrit jamais,
  // et que les visionneuses d'Apple empilaient au coin de la feuille. On écrit
  // désormais la forme d'Excel : `twoCellAnchor editAs="oneCell"`, marqueurs
  // `from` ET `to`, une image liée à une seule cellule.
  const links = Array.from({ length: 4 }, (_, index) => createLink(
    { url: `https://exemple.fr/page-${index}`, title: `Titre ${index}` }, { now: 1 },
  ));

  const spreadsheet = await buildLinkSpreadsheet(links, { now: 1 });
  const drawing = new TextDecoder().decode(readZip(spreadsheet).get('xl/drawings/drawing1.xml').data);

  assert.equal(drawing.match(/<xdr:twoCellAnchor editAs="oneCell">/g).length, links.length);
  assert.equal(drawing.includes('oneCellAnchor>'), false, 'plus aucun ancrage à une cellule');

  const froms = [...drawing.matchAll(
    /<xdr:from><xdr:col>(\d+)<\/xdr:col>.*?<xdr:row>(\d+)<\/xdr:row>/g,
  )].map((m) => ({ col: Number(m[1]), row: Number(m[2]) }));
  const tos = [...drawing.matchAll(
    /<xdr:to><xdr:col>(\d+)<\/xdr:col>.*?<xdr:row>(\d+)<\/xdr:row>/g,
  )].map((m) => ({ col: Number(m[1]), row: Number(m[2]) }));

  assert.equal(froms.length, links.length, 'un marqueur `from` par image');
  assert.equal(tos.length, links.length, 'un marqueur `to` par image');

  // Une ligne par image, toutes différentes, dans la colonne des QR.
  assert.deepEqual(froms.map((f) => f.row), [1, 2, 3, 4]);
  assert.deepEqual(froms.map((f) => f.col), Array(links.length).fill(QR_COLUMN_INDEX));
  // `to` est la cellule suivante : l'image est liée à cette cellule-là.
  for (const [index, from] of froms.entries()) {
    assert.equal(tos[index].row, from.row + 1, `image ${index} : hauteur d\'une cellule`);
    assert.equal(tos[index].col, from.col + 1, `image ${index} : largeur d\'une cellule`);
  }
});

test('l\'image du QR tient dans sa cellule, et la ligne dans une page', async () => {
  // Trois mesures qui doivent rester cohérentes : la largeur de la colonne, la
  // hauteur de la ligne, et la mise en page. Une image plus large que sa
  // colonne déborde ; une ligne trop haute fait sortir le tableau de la page.
  const links = [createLink({ url: 'https://exemple.fr/page', title: 'Titre' }, { now: 1 })];
  const spreadsheet = await buildLinkSpreadsheet(links, { now: 1 });
  const entries = readZip(spreadsheet);
  const sheet = new TextDecoder().decode(entries.get('xl/worksheets/sheet1.xml').data);
  const drawing = new TextDecoder().decode(entries.get('xl/drawings/drawing1.xml').data);

  // L'image est de 96 px ; la colonne du QR doit être au moins aussi large.
  const ext = drawing.match(/<xdr:ext cx="(\d+)" cy="(\d+)"/) ?? drawing.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
  const imagePx = Number(ext[1]) / 9525;
  assert.equal(imagePx, 96, 'la taille de l\'image est connue');

  const columns = [...sheet.matchAll(/<col min="(\d+)"[^>]*width="([\d.]+)"/g)]
    .map((m) => ({ index: Number(m[1]) - 1, width: Number(m[2]) }));
  const qrColumn = columns.find((c) => c.index === QR_COLUMN_INDEX);
  // Excel : largeur en caractères ; une unité vaut environ 7 px.
  assert.ok(
    qrColumn.width * 7 + 5 >= imagePx,
    `colonne de ${qrColumn.width} unités (≈ ${Math.round(qrColumn.width * 7 + 5)} px) `
      + `pour une image de ${imagePx} px`,
  );

  // La ligne qui porte le QR est assez haute pour lui (1 px = 0,75 point).
  const height = Number(sheet.match(/<row r="2" ht="(\d+)"/)?.[1] ?? 0);
  assert.ok(height >= imagePx * 0.75, `ligne de ${height} pt pour une image de ${imagePx} px`);

  // Et la mise en page ramène le tableau à une largeur de page : sans cela, un
  // QR peut sortir sur une autre feuille que son URL.
  assert.match(sheet, /<pageSetUpPr fitToPage="1"\/>/);
  assert.match(sheet, /fitToWidth="1"/);
  assert.match(sheet, /orientation="landscape"/);
  // `pageSetup` doit précéder `drawing` : l'ordre du schéma OOXML est imposé.
  assert.ok(
    sheet.indexOf('<pageSetup') < sheet.indexOf('<drawing'),
    'pageSetup doit précéder drawing',
  );
});
