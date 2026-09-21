/**
 * Tests de l'export du tableau en dossier autonome.
 *
 * Le contrat tient en deux promesses : le JSON décrit le tableau configuré, et
 * chaque ligne y trouve son image PNG, référencée et réellement présente dans
 * l'archive. Ce fichier vérifie l'une et l'autre, ainsi que la régénération
 * fidèle du QR — l'échelle reste entière, les paramètres d'encodage sont
 * conservés.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TABLE_EXPORT_FORMAT,
  TABLE_EXPORT_VERSION,
  TABLE_COLUMNS,
  DEFAULT_TABLE_EXPORT_OPTIONS,
  tableColumnKeys,
  buildTableModel,
  buildTableHtml,
  buildTableArchive,
} from '../src/core/table-export.js';
import { createLink } from '../src/core/link.js';
import { readStoredZip } from '../src/core/zip.js';

const T0 = Date.UTC(2025, 0, 15, 10, 30);

const ALL_COLUMNS = {
  index: true, qr: true, url: true, title: true, tags: true, note: true, date: true,
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Deux liens déterministes, identifiants ASCII fixes. */
function sample() {
  return [
    createLink({
      id: 'alpha',
      url: 'https://exemple.com/alpha',
      title: 'Alpha',
      tags: ['veille', 'code'],
      note: 'à relire',
      createdAt: T0,
    }),
    createLink({ id: 'beta', url: 'https://exemple.com/beta', title: 'Bêta', createdAt: T0 + 3_600_000 }),
  ];
}

/** Dimensions lues dans l'en-tête IHDR du PNG. */
function pngSize(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

// ---------------------------------------------------------------------------
// Modèle
// ---------------------------------------------------------------------------

test('les clés de colonnes suivent l\'ordre du tableau imprimé', () => {
  assert.deepEqual(tableColumnKeys({ note: true, qr: true, index: true }), ['index', 'qr', 'note']);
  assert.deepEqual(tableColumnKeys({}), []);
  assert.deepEqual(
    TABLE_COLUMNS.map((column) => column.key),
    ['index', 'qr', 'url', 'title', 'date', 'tags', 'note'],
  );
});

test('le modèle respecte les colonnes choisies et le rang fourni', () => {
  const { model } = buildTableModel(sample(), {
    title: 'Veille',
    columns: { index: true, url: true, title: true },
    rankOf: (link, index) => 10 + index,
    now: T0,
  });

  assert.equal(model.format, TABLE_EXPORT_FORMAT);
  assert.equal(model.version, TABLE_EXPORT_VERSION);
  assert.equal(model.title, 'Veille');
  assert.equal(model.count, 2);
  assert.deepEqual(model.columns, ['index', 'url', 'title']);
  assert.deepEqual(model.rows[0], {
    index: 10,
    url: 'https://exemple.com/alpha',
    title: 'Alpha',
  });
  assert.deepEqual(model.rows[1], {
    index: 11,
    url: 'https://exemple.com/beta',
    title: 'Bêta',
  });
});

test('le modèle ne retient que les colonnes non vides demandées', () => {
  const { model } = buildTableModel(sample(), {
    columns: { tags: true, note: true, date: true },
    dateMode: 'datetime',
    now: T0,
  });

  assert.deepEqual(model.columns, ['date', 'tags', 'note']);
  assert.deepEqual(model.rows[0].tags, ['veille', 'code']);
  assert.equal(model.rows[0].note, 'à relire');
  assert.equal(model.rows[1].note, '');
  // L'heure est locale : on vérifie la forme, pas le fuseau de la machine.
  assert.match(model.rows[0].date, /^15\/01\/2025 \d{2}:\d{2}$/);
  assert.equal(model.dateMode, 'datetime');
});

test('le modèle conserve l\'URL d\'origine quand le QR encode un raccourci', () => {
  const link = {
    ...createLink({ id: 'court', url: 'https://exemple.com/original', createdAt: T0 }),
    url: 'https://exemple.com/court',
    originalUrl: 'https://exemple.com/original',
  };
  const { model } = buildTableModel([link], { columns: { url: true }, now: T0 });

  assert.equal(model.rows[0].url, 'https://exemple.com/court');
  assert.equal(model.rows[0].sourceUrl, 'https://exemple.com/original');

  // Une URL qui n'est pas raccourcie n'ajoute pas de champ.
  const { model: plain } = buildTableModel(sample(), { columns: { url: true }, now: T0 });
  assert.ok(!('sourceUrl' in plain.rows[0]));
});

test('chaque QR porte de quoi le régénérer, à une échelle entière bornée', () => {
  const links = sample();
  const { model, images } = buildTableModel(links, {
    columns: { qr: true },
    scale: 100,
    maxSize: 300,
    now: T0,
  });

  assert.equal(model.qr.ecc, DEFAULT_TABLE_EXPORT_OPTIONS.ecc);
  assert.equal(model.qr.border, DEFAULT_TABLE_EXPORT_OPTIONS.border);

  model.rows.forEach((row, index) => {
    assert.match(row.qr.file, /^qr\/[A-Za-z0-9_-]+\.png$/);
    assert.equal(row.qr.content, links[index].url);
    assert.equal(row.qr.ecc, 'M');
    assert.equal(row.qr.border, 2);
    assert.ok(Number.isInteger(row.qr.scale) && row.qr.scale >= 1);
    assert.ok(row.qr.sizePx <= 300);

    const image = images.get(row.qr.file);
    assert.equal(row.qr.sizePx, image.matrix.size * image.scale);
    assert.equal(row.qr.version, image.matrix.version);
  });
});

test('un lien sans identifiant produisible reçoit un nom ASCII de repli', () => {
  const { model } = buildTableModel(
    [{ id: '', url: 'https://exemple.com/x', title: '', tags: [], note: '', createdAt: T0 }],
    { columns: { qr: true }, now: T0 },
  );
  assert.equal(model.rows[0].qr.file, 'qr/lien-1.png');
});

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

test('le HTML rend les colonnes et référence les images', () => {
  const { model } = buildTableModel(sample(), { title: 'Veille & Cie', columns: ALL_COLUMNS, now: T0 });
  const html = buildTableHtml(model);

  assert.match(html, /<table>/);
  assert.match(html, /<th>N°<\/th>/);
  assert.match(html, /<th>QR<\/th>/);
  assert.match(html, /src="qr\/alpha\.png"/);
  assert.match(html, /Veille &amp; Cie/);
  assert.ok(!html.includes('Veille & Cie'), 'le titre doit être échappé');
});

test('le HTML échappe les valeurs qui viennent des liens', () => {
  const { model } = buildTableModel(
    [createLink({ id: 'x', url: 'https://exemple.com/x', title: '<b>gras</b>', createdAt: T0 })],
    { columns: { title: true } },
  );
  const html = buildTableHtml(model);
  assert.ok(html.includes('&lt;b&gt;gras&lt;/b&gt;'));
  assert.ok(!html.includes('<b>gras</b>'));
});

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

test('l\'archive contient le JSON, le HTML et chaque PNG référencé', async () => {
  const { bytes, model } = await buildTableArchive(sample(), {
    title: 'Veille',
    columns: ALL_COLUMNS,
    now: T0,
  });

  const entries = readStoredZip(bytes);
  assert.ok(entries.has('table.json'));
  assert.ok(entries.has('table.html'));

  const parsed = JSON.parse(new TextDecoder().decode(entries.get('table.json')));
  assert.equal(parsed.count, 2);

  const html = new TextDecoder().decode(entries.get('table.html'));

  for (const row of parsed.rows) {
    const png = entries.get(row.qr.file);
    assert.ok(png, `image absente : ${row.qr.file}`);
    assert.deepEqual([...png.subarray(0, 8)], PNG_SIGNATURE);
    const { width, height } = pngSize(png);
    assert.equal(width, row.qr.sizePx);
    assert.equal(height, row.qr.sizePx);
    assert.ok(html.includes(`src="${row.qr.file}"`));
  }

  // Le modèle retourné est celui écrit : même horodatage, donc même archive.
  assert.equal(parsed.exportedAt, model.exportedAt);
});

test('la progression signale chaque image, une fois', async () => {
  const steps = [];
  await buildTableArchive(sample(), {
    columns: { qr: true },
    now: T0,
    onProgress: (done, total) => steps.push([done, total]),
  });
  assert.deepEqual(steps, [[1, 2], [2, 2]]);
});

test('sans colonne QR, l\'archive ne contient aucune image', async () => {
  const { bytes, model } = await buildTableArchive(sample(), { columns: { url: true }, now: T0 });
  assert.deepEqual(model.columns, ['url']);
  assert.ok(![...readStoredZip(bytes).keys()].some((name) => name.startsWith('qr/')));
});
