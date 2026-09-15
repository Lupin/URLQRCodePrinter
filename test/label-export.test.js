/**
 * Tests de l'export d'étiquettes en images.
 *
 * L'idée directrice : produire des images prêtes à imprimer, sans dépendre
 * d'une imprimante ni d'un pilote. Ces tests vérifient donc surtout les
 * dimensions physiques — une étiquette de 12 mm doit faire 96 px à 203 dpi — et
 * l'autonomie de l'archive produite.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LABEL_FORMATS,
  TEXT_MODES,
  DEFAULT_EXPORT_OPTIONS,
  findFormat,
  labelText,
  labelFileName,
  planLabel,
  planLabels,
  buildPrintSheet,
  buildLabelArchive,
  labelArchiveName,
  ptToPx,
} from '../src/core/label-export.js';
import { mmToPx } from '../src/core/label.js';
import { createLink } from '../src/core/link.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Mesure déterministe : 1 pixel par caractère. */
const measure1 = (text) => text.length * 8;

/** Relecture d'une archive ZIP non compressée. */
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
    entries.set(name, new TextDecoder().decode(zip.subarray(start, start + size)));
    offset = start + size;
  }
  return entries;
}

/**
 * Relecture d'une archive, entrée par entrée, **en octets**.
 *
 * `TextDecoder` retire le BOM qu'il décode : le texte relu ne permet donc pas
 * de vérifier sa présence, alors qu'Excel en dépend pour reconnaître l'UTF-8.
 */
function readZipBytes(zip) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const entries = new Map();
  let offset = 0;
  while (offset + 4 <= zip.length && view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(zip.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extraLength;
    entries.set(name, zip.subarray(start, start + size));
    offset = start + size;
  }
  return entries;
}

const link = (url, title = '') => createLink({ url, title }, { now: 1736937000000 });

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

test('chaque format décrit une étiquette plausible', () => {
  for (const format of LABEL_FORMATS) {
    assert.ok(format.id && format.name, format.id);
    assert.ok(format.widthMm > 5 && format.widthMm <= 210, `${format.id} : largeur`);
    assert.ok(format.heightMm === null || format.heightMm > 5, `${format.id} : hauteur`);
    assert.ok(format.dpi >= 200 && format.dpi <= 600, `${format.id} : résolution`);
  }
});

test('findFormat retombe sur le premier format connu', () => {
  assert.equal(findFormat('niimbot-d110').widthMm, 12);
  assert.equal(findFormat('inexistant').id, LABEL_FORMATS[0].id);
});

test('les conversions d\'unités sont justes', () => {
  assert.equal(mmToPx(25.4, 203), 203);
  assert.equal(mmToPx(12, 203), 96, 'la largeur utile d\'un D110');
  assert.equal(mmToPx(48, 300), 567);
  assert.equal(ptToPx(72, 300), 300);
});

// ---------------------------------------------------------------------------
// Texte et nommage
// ---------------------------------------------------------------------------

test('labelText suit le mode choisi', () => {
  const item = link('https://exemple.fr/a', 'Un titre');
  assert.deepEqual(labelText(item, 'url'), ['https://exemple.fr/a']);
  assert.deepEqual(labelText(item, 'title'), ['Un titre']);
  assert.deepEqual(labelText(item, 'title-url'), ['Un titre', 'https://exemple.fr/a']);
  assert.deepEqual(labelText(item, 'host'), ['exemple.fr']);
  assert.deepEqual(labelText(item, 'none'), []);
});

test('labelText se rabat sur l\'URL quand il n\'y a pas de titre', () => {
  assert.deepEqual(labelText(link('https://exemple.fr/a'), 'title'), ['https://exemple.fr/a']);
});

test('labelFileName est numéroté, lisible et sans accent', () => {
  assert.equal(labelFileName(link('https://a.fr', 'Café & Crème'), 0, 5), '1-cafe-creme.png');
  assert.equal(labelFileName(link('https://a.fr', ''), 0, 5), '1-a-fr.png');
  assert.equal(labelFileName(link('https://a.fr', 'X'), 9, 120), '010-x.png');
});

test('labelFileName ne produit jamais de nom vide', () => {
  const name = labelFileName(link('https://a.fr', '---'), 0, 1);
  assert.match(name, /^1-[a-z0-9-]*lien?[a-z0-9-]*\.png$|^1-a-fr\.png$/);
});

// ---------------------------------------------------------------------------
// Planification
// ---------------------------------------------------------------------------

test('une étiquette D110 fait 96 px de large à 203 dpi', () => {
  const plan = planLabel({
    link: link('https://a.fr'),
    format: findFormat('niimbot-d110'),
    measure: measure1,
  });
  assert.equal(plan.widthPx, 96);
  assert.ok(plan.heightPx > plan.widthPx, 'un rouleau continu s\'allonge');
});

test('un format à hauteur fixe la respecte', () => {
  const plan = planLabel({
    link: link('https://a.fr'),
    format: findFormat('generic-50x30'),
    measure: measure1,
  });
  assert.equal(plan.widthPx, mmToPx(50, 300));
  assert.equal(plan.heightPx, mmToPx(30, 300));
});

test('le QR fait toujours un nombre entier de modules', () => {
  for (const id of ['niimbot-d110', 'brother-62', 'generic-50x30']) {
    const plan = planLabel({ link: link('https://a.fr/x'), format: findFormat(id), measure: measure1 });
    assert.equal(plan.qrSizePx % plan.qrModules, 0, `${id} : ${plan.qrSizePx} / ${plan.qrModules}`);
    assert.ok(plan.qrScale >= 2, `${id} : ${plan.qrScale} px par module`);
  }
});

test('une URL longue est signalée plutôt que rognée', () => {
  const plan = planLabel({
    link: link('https://exemple.fr/' + 'x'.repeat(500)),
    format: findFormat('niimbot-d110'),
    measure: measure1,
  });
  assert.equal(plan.fits, false);
});

test('le mode sans texte produit une étiquette plus courte', () => {
  const format = findFormat('niimbot-d110');
  const avec = planLabel({ link: link('https://a.fr/article'), format, measure: measure1, textMode: 'url' });
  const sans = planLabel({ link: link('https://a.fr/article'), format, measure: measure1, textMode: 'none' });
  assert.ok(sans.heightPx < avec.heightPx);
  assert.deepEqual(sans.lines, []);
});

test('la marge est respectée de chaque côté', () => {
  const plan = planLabel({
    link: link('https://a.fr'),
    format: findFormat('generic-50x30'),
    measure: measure1,
    marginMm: 3,
  });
  assert.equal(plan.marginPx, mmToPx(3, 300));
  assert.ok(plan.qrSizePx <= plan.widthPx - plan.marginPx * 2);
});

test('planLabels numérote et nomme chaque étiquette', () => {
  const links = [link('https://a.fr', 'Un'), link('https://b.fr', 'Deux')];
  const planned = planLabels(links, { format: findFormat('generic-50x30'), measure: measure1 });

  assert.equal(planned.length, 2);
  assert.deepEqual(planned.map((entry) => entry.fileName), ['1-un.png', '2-deux.png']);
  assert.equal(planned[0].link.url, links[0].url);
});

// ---------------------------------------------------------------------------
// Planche imprimable
// ---------------------------------------------------------------------------

test('la planche référence les images en relatif', () => {
  const planned = planLabels([link('https://a.fr', 'Un')], {
    format: findFormat('generic-50x30'),
    measure: measure1,
  });
  const html = buildPrintSheet(planned);

  assert.match(html, /src="etiquettes\/1-un\.png"/);
  assert.match(html, /@media print/);
  assert.match(html, /<!DOCTYPE html>/);
});

test('la planche échappe le texte des liens', () => {
  const planned = planLabels([link('https://a.fr/?a=1&b=2', '<script>')], {
    format: findFormat('generic-50x30'),
    measure: measure1,
    textMode: 'title-url',
  });
  const html = buildPrintSheet(planned);

  assert.equal(html.includes('<script>'), false);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&amp;'));
});

test('les traits de coupe sont optionnels', () => {
  const planned = planLabels([link('https://a.fr')], {
    format: findFormat('generic-50x30'),
    measure: measure1,
  });
  // La feuille de style contient toujours la règle : on vérifie la classe
  // réellement posée sur les étiquettes.
  assert.ok(buildPrintSheet(planned, { cutMarks: true }).includes('class="label label--cut"'));
  assert.ok(buildPrintSheet(planned, { cutMarks: false }).includes('class="label"'));
  assert.equal(
    buildPrintSheet(planned, { cutMarks: false }).includes('class="label label--cut"'),
    false,
  );
});

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

test('l\'archive contient images, CSV, planche et réglages', () => {
  const links = [link('https://a.fr', 'Un'), link('https://b.fr', 'Deux')];
  const planned = planLabels(links, { format: findFormat('generic-50x30'), measure: measure1 });

  const images = new Map(planned.map((entry) => [entry.fileName, new Uint8Array([1, 2, 3])]));
  const archive = buildLabelArchive({
    planned,
    images,
    settings: { format: findFormat('generic-50x30'), title: 'Test' },
    now: 1736937000000,
  });

  const entries = readZip(archive);
  const names = [...entries.keys()];

  assert.ok(names.includes('etiquettes/1-un.png'), names.join(', '));
  assert.ok(names.includes('etiquettes/2-deux.png'));
  assert.ok(names.includes('liens.csv'));
  assert.ok(names.includes('planche.html'));
  assert.ok(names.includes('export.json'));
});

test('le CSV relie chaque URL à son image', () => {
  const planned = planLabels([link('https://a.fr', 'Un')], {
    format: findFormat('generic-50x30'),
    measure: measure1,
  });
  const archive = buildLabelArchive({
    planned,
    images: new Map([['1-un.png', new Uint8Array([1])]]),
    now: 1,
  });

  const csv = readZip(archive).get('liens.csv');
  assert.ok(csv.includes('https://a.fr'));
  assert.ok(csv.includes('etiquettes/1-un.png'));

  // Le BOM doit être present dans les octets : Excel s'en sert pour reconnaître
  // l'UTF-8. `TextDecoder` le retire au décodage, d'où cette vérification brute.
  const bytes = readZipBytes(archive).get('liens.csv');
  assert.deepEqual(Array.from(bytes.subarray(0, 3)), [0xef, 0xbb, 0xbf], 'BOM UTF-8');
});

test('le manifeste consigne les réglages retenus', () => {
  const planned = planLabels([link('https://a.fr', 'Un')], {
    format: findFormat('dymo-54'),
    measure: measure1,
    textMode: 'title-url',
    marginMm: 2,
  });
  const archive = buildLabelArchive({
    planned,
    images: new Map(),
    settings: { format: findFormat('dymo-54'), textMode: 'title-url', marginMm: 2 },
    now: 1,
  });

  const manifest = JSON.parse(readZip(archive).get('export.json'));
  assert.equal(manifest.settings.labelFormat, 'dymo-54');
  assert.equal(manifest.settings.widthMm, 54);
  assert.equal(manifest.settings.textMode, 'title-url');
  assert.equal(manifest.settings.marginMm, 2);
  assert.equal(manifest.count, 1);
  assert.equal(manifest.labels[0].file, 'etiquettes/1-un.png');
});

test('une image manquante n\'empêche pas l\'archive', () => {
  const planned = planLabels([link('https://a.fr')], {
    format: findFormat('generic-50x30'),
    measure: measure1,
  });
  const archive = buildLabelArchive({ planned, images: new Map(), now: 1 });
  const names = [...readZip(archive).keys()];

  assert.equal(names.some((name) => name.startsWith('etiquettes/')), false);
  assert.ok(names.includes('liens.csv'));
});

test('le nom de l\'archive est horodaté', () => {
  assert.match(labelArchiveName(1736937000000), /^etiquettes-qr-\d{8}-\d{4}\.zip$/);
});

test('les modes de texte sont tous décrits', () => {
  for (const [id, label] of Object.entries(TEXT_MODES)) {
    assert.ok(label.length > 0, id);
  }
  assert.ok(TEXT_MODES[DEFAULT_EXPORT_OPTIONS.textMode]);
});
