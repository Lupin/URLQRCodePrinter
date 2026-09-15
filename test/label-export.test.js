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
import { createLink, resolveTarget, resolveTargets } from '../src/core/link.js';

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

// ---------------------------------------------------------------------------
// Liens raccourcis
// ---------------------------------------------------------------------------

/** URL d'origine réaliste : longue, avec ses paramètres de campagne. */
const LONG_URL = 'https://exemple.fr/un-article-tres-long-avec-un-chemin'
  + '?utm_source=newsletter&id=42&ref=accueil';
/** Sa forme normalisée, telle qu'elle est stockée. */
const CLEAN_URL = 'https://exemple.fr/un-article-tres-long-avec-un-chemin?id=42&ref=accueil';
const SHORT_URL = 'https://tinyurl.com/2yxwpwb6';

/** Un lien raccourci, et sa forme préparée pour l'impression. */
function shortPair() {
  const raw = createLink(
    { url: LONG_URL, title: 'Un article', shortUrl: SHORT_URL, shortProvider: 'tinyurl' },
    { now: 1 },
  );
  return { raw, resolved: resolveTarget(raw, 'short') };
}

test('le nom du fichier garde le domaine du site visé', () => {
  const { raw, resolved } = shortPair();
  assert.equal(labelFileName(raw, 0, 1), '1-un-article.png');
  // Même une fois le QR basculé sur le raccourci : sinon une collection
  // raccourcie deviendrait une série de « 1-tinyurl-com.png ».
  assert.equal(labelFileName(resolved, 0, 1), '1-un-article.png');
});

test('le texte imprimé suit la cible, le domaine non', () => {
  const { resolved } = shortPair();
  assert.deepEqual(labelText(resolved, 'url'), [SHORT_URL]);
  assert.deepEqual(labelText(resolved, 'title-url'), ['Un article', SHORT_URL]);
  // Le domaine affiché reste celui du site : « tinyurl.com » sous un QR
  // n'apprendrait rien à qui lit l'étiquette.
  assert.deepEqual(labelText(resolved, 'host'), ['exemple.fr']);
});

test('le QR code encode la cible choisie', () => {
  const { raw, resolved } = shortPair();
  const options = { format: findFormat('generic-50x30'), measure: measure1 };
  const before = planLabel({ ...options, link: raw });
  const after = planLabel({ ...options, link: resolved });

  assert.equal(before.url, CLEAN_URL);
  assert.equal(after.url, SHORT_URL);
  // Un lien plus court donne une matrice plus petite, donc un QR plus lisible
  // sur une petite étiquette : c'est tout l'intérêt de la manœuvre.
  assert.ok(after.qrModules < before.qrModules, `${after.qrModules} < ${before.qrModules}`);
});

test('l\'archive consigne l\'URL d\'origine à côté du raccourci', () => {
  const { resolved } = shortPair();
  const planned = planLabels([resolved], {
    format: findFormat('generic-50x30'),
    measure: measure1,
  });
  const archive = buildLabelArchive({
    planned,
    images: new Map([['1-un-article.png', new Uint8Array([1])]]),
    now: 1,
  });

  const csv = readZip(archive).get('liens.csv');
  assert.ok(csv.includes('URL d\'origine'), 'colonne ajoutée');
  assert.ok(csv.includes(SHORT_URL), 'la cible imprimée');
  assert.ok(csv.includes(CLEAN_URL), 'l\'adresse réversible');

  const manifest = JSON.parse(readZip(archive).get('export.json'));
  assert.equal(manifest.labels[0].url, SHORT_URL);
  assert.equal(manifest.labels[0].originalUrl, CLEAN_URL);
});

test('sans raccourci, l\'archive ne change pas de forme', () => {
  const plain = [createLink({ url: 'https://a.fr', title: 'Un' }, { now: 1 })];
  const planned = planLabels(resolveTargets(plain, 'short'), {
    format: findFormat('generic-50x30'),
    measure: measure1,
  });
  const archive = buildLabelArchive({ planned, images: new Map(), now: 1 });

  const csv = readZip(archive).get('liens.csv');
  assert.equal(csv.includes('URL d\'origine'), false);
  assert.ok(csv.split('\r\n')[0].includes('N°;URL;Titre;Image'));

  const manifest = JSON.parse(readZip(archive).get('export.json'));
  assert.equal(manifest.labels[0].originalUrl, undefined);
});

test('la date demandée prend sa propre ligne', () => {
  const measure = (text) => text.length * 6;
  const stamp = new Date(2026, 8, 15, 10, 30).getTime();
  const item = createLink(
    { url: 'https://exemple.fr/article', title: 'Un article', createdAt: stamp },
    { now: stamp },
  );
  const base = { link: item, format: findFormat('generic-70x40'), measure };

  const withoutDate = planLabel({ ...base, textMode: 'url' });
  const withDate = planLabel({ ...base, textMode: 'url', dateMode: 'date' });
  const withTime = planLabel({ ...base, textMode: 'url', dateMode: 'datetime' });

  assert.deepEqual(withoutDate.lines, ['https://exemple.fr/article']);
  assert.deepEqual(withDate.lines, ['https://exemple.fr/article', '15/09/2026']);
  assert.deepEqual(withTime.lines, ['https://exemple.fr/article', '15/09/2026 10:30']);

  // La date se paie en place : le QR rétrécit plutôt que de la chasser.
  assert.ok(withDate.qrSizePx < withoutDate.qrSizePx, 'le QR doit céder de la place');
  assert.equal(withDate.heightPx, withoutDate.heightPx, 'hauteur fixe : rien ne débordé');

  // Le paramètre de date est consigné dans le manifeste, pour reproduire.
  const planned = planLabels([item], { ...base, textMode: 'url', dateMode: 'datetime' });
  const archive = buildLabelArchive({
    planned,
    images: new Map(),
    settings: { dateMode: 'datetime', format: findFormat('generic-70x40') },
    now: 1,
  });
  const manifest = JSON.parse(readZip(archive).get('export.json'));
  assert.equal(manifest.settings.dateMode, 'datetime');
});

test('sans date demandée, rien ne change dans les étiquettes', () => {
  const measure = (text) => text.length * 6;
  const item = createLink({ url: 'https://exemple.fr/a', title: 'Un' }, { now: 1 });
  const base = { link: item, format: findFormat('generic-70x40'), measure };

  const implicit = planLabel(base);
  const explicit = planLabel({ ...base, dateMode: 'none' });
  assert.deepEqual(explicit.lines, implicit.lines);
  assert.equal(explicit.heightPx, implicit.heightPx);
  assert.equal(explicit.qrSizePx, implicit.qrSizePx);
});

test('une date trop longue est abandonnée, jamais tronquée', () => {
  // Défaut trouvé en vérifiant dans le navigateur : sur une étiquette de 12 mm,
  // la date était amputée à « 15/09/ » — le millésime perdu. Une date fausse est
  // pire que pas de date.
  const narrow = (text) => text.length * 11;
  const stamp = new Date(2026, 8, 15, 18, 1).getTime();
  const item = createLink(
    { url: 'https://exemple.fr/article', title: 'Un article', createdAt: stamp },
    { now: stamp },
  );

  const plan = planLabel({
    link: item,
    format: findFormat('niimbot-d110'),
    measure: narrow,
    textMode: 'url',
    dateMode: 'datetime',
  });

  assert.equal(plan.dateOmitted, true, 'trois lignes de date : elle doit céder');
  assert.equal(
    plan.lines.some((line) => /^\d{2}\/\d{2}\/?$/.test(line)),
    false,
    `aucun fragment de date ne doit rester : ${JSON.stringify(plan.lines)}`,
  );

  // La date seule tient en deux lignes : elle est conservée et complète.
  const partial = planLabel({
    link: item,
    format: findFormat('niimbot-d110'),
    measure: narrow,
    textMode: 'url',
    dateMode: 'date',
  });
  assert.equal(partial.dateOmitted, false);
  // Les lignes peuvent être coupées par le retour à la ligne ; ce qui compte est
  // que la date s'y retrouve entière.
  assert.ok(
    partial.lines.join('').includes('15/09/2026'),
    `date incomplète : ${JSON.stringify(partial.lines)}`,
  );

  // Sur une étiquette large, aucun compromis à faire.
  const wide = planLabel({
    link: item,
    format: findFormat('generic-70x40'),
    measure: (text) => text.length * 6,
    textMode: 'url',
    dateMode: 'datetime',
  });
  assert.equal(wide.dateOmitted, false);
  assert.equal(wide.lines.at(-1), '15/09/2026 18:01');

  // Et l'archive dit combien de dates ont été abandonnées.
  const archive = buildLabelArchive({
    planned: [{ link: item, fileName: '1-un.png', plan }],
    images: new Map(),
    settings: { format: findFormat('niimbot-d110'), dateMode: 'datetime' },
    now: 1,
  });
  const manifest = JSON.parse(readZip(archive).get('export.json'));
  assert.equal(manifest.datesOmitted, 1);
});
