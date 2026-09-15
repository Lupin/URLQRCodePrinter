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
import { buildLinkSpreadsheet, SPREADSHEET_HEADERS, QR_COLUMN_INDEX } from '../src/core/spreadsheet.js';
import { qrPng, encodeQr } from '../src/core/qr.js';
import { createLink } from '../src/core/link.js';

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
  assert.equal(drawing.match(/<xdr:oneCellAnchor>/g).length, links.length);
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
