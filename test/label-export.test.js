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
  DEFAULT_EXPORT_OPTIONS,
  findFormat,
  labelSegments,
  labelFileName,
  planLabel,
  planLabels,
  buildPrintSheet,
  buildLabelArchive,
  labelArchiveName,
  ptToPx,
  labelPreviewZoom,
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

test('les formats Brother DK et Niimbot M3 sont proposés', () => {
  const ids = LABEL_FORMATS.map((format) => format.id);
  for (const id of [
    'niimbot-m3',
    'brother-dk11201',
    'brother-dk11202',
    'brother-dk11208',
    'brother-dk11209',
    'brother-dk11218',
    'brother-dk11219',
    'brother-dk22205',
    'brother-dk22210',
  ]) {
    assert.ok(ids.includes(id), id);
  }
  assert.equal(findFormat('niimbot-m3').widthMm, 72);
  assert.equal(findFormat('brother-dk11202').widthMm, 62);
  assert.equal(findFormat('brother-dk22205').heightMm, null, 'un rouleau continu n\'a pas de hauteur');
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

// Le contenu de l'étiquette se coche, case par case : le numéro, le titre,
// l'URL et le domaine se cumulent. Une liste à cinq modes exclusifs répondait à
// la même question que les cases, et une case « Titre » s'y ajoutait par-dessus
// — trois réglages pour une intention.

test('les cases de contenu se cumulent, dans l\'ordre où on les lit', () => {
  const item = link('https://exemple.fr/a', 'Un titre');

  assert.deepEqual(labelSegments(item, { showUrl: true }), ['https://exemple.fr/a']);
  assert.deepEqual(labelSegments(item, { showTitle: true }), ['Un titre']);
  assert.deepEqual(
    labelSegments(item, { showUrl: true, showTitle: true }),
    ['Un titre', 'https://exemple.fr/a'],
  );
  // L'URL et le domaine ensemble : aucune case n'en éteint une autre, comme
  // dans l'onglet Niimbot, où ces deux cases se cumulent déjà.
  assert.deepEqual(
    labelSegments(item, { showUrl: true, showHost: true }),
    ['https://exemple.fr/a', 'exemple.fr'],
  );
  assert.deepEqual(labelSegments(item, {}), [], 'aucune case cochée, aucun texte');
});

test('le numéro coché imprime le rang du lien, en tête', () => {
  const item = link('https://exemple.fr/a', 'Un titre');

  assert.deepEqual(
    labelSegments(item, { index: 7, showIndex: true, showTitle: true, showUrl: true }),
    ['N° 7', 'Un titre', 'https://exemple.fr/a'],
  );
});

test('une case sans matière n\'ajoute aucune ligne vide', () => {
  // Un lien sans titre, ou un rang inconnu : la case reste cochée, mais elle
  // n'imprime rien plutôt qu'une ligne vide qui pousserait le QR Code.
  const sansTitre = link('https://exemple.fr/a');
  assert.deepEqual(
    labelSegments(sansTitre, { showTitle: true, showUrl: true }),
    ['https://exemple.fr/a'],
  );
  assert.deepEqual(
    labelSegments(sansTitre, { showIndex: true, index: null, showUrl: true }),
    ['https://exemple.fr/a'],
  );
});

test('le domaine imprimé est celui du site visé, jamais du raccourcisseur', () => {
  const item = createLink(
    { url: 'https://exemple.fr/article', shortUrl: 'https://tinyurl.com/abc', shortProvider: 'tinyurl' },
    { now: 1 },
  );
  const resolved = resolveTarget(item, 'short');
  assert.deepEqual(labelSegments(resolved, { showHost: true }), ['exemple.fr']);
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

test('le QR Code fait toujours un nombre entier de modules', () => {
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

test('sans aucune case cochée, l\'étiquette est plus courte', () => {
  const format = findFormat('niimbot-d110');
  const avec = planLabel({ link: link('https://a.fr/article'), format, measure: measure1, showUrl: true });
  const sans = planLabel({ link: link('https://a.fr/article'), format, measure: measure1, showUrl: false });
  assert.ok(sans.heightPx < avec.heightPx);
  assert.deepEqual(sans.lines, []);
});

test('cocher « Titre » ajoute le titre sous le QR Code', () => {
  const format = findFormat('generic-50x30');
  const item = link('https://exemple.fr/a', 'Un titre');

  const sans = planLabel({ link: item, format, measure: measure1, showUrl: true });
  const avec = planLabel({
    link: item,
    format,
    measure: measure1,
    showUrl: true,
    showTitle: true,
  });

  assert.deepEqual(sans.lines, ['https://exemple.fr/a']);
  // Les segments cochés sont découpés **ensemble**, en un seul bloc : c'est ce
  // que faisait « Titre puis URL », et deux découpages séparés laisseraient
  // chacun la moitié d'une ligne vide. Le titre et l'URL tiennent ici sur une
  // ligne, et c'est la largeur qui en décide.
  assert.deepEqual(avec.lines, ['Un titre https://exemple.fr/a']);
  assert.deepEqual(labelSegments(item, { showTitle: true, showUrl: true }), [
    'Un titre',
    'https://exemple.fr/a',
  ]);
});

test('le titre coché une fois ne s\'imprime qu\'une fois', () => {
  // Il n'y a plus qu'une source pour le titre : la case. Deux réglages le
  // portaient auparavant — le mode de texte et la case — et le doublon était
  // évité par une comparaison de chaînes.
  const plan = planLabel({
    link: link('https://exemple.fr/a', 'Un titre'),
    format: findFormat('generic-50x30'),
    measure: measure1,
    showTitle: true,
  });
  assert.equal(plan.lines.join(' ').split('Un titre').length - 1, 1);
});

test('la case « Titre » sans titre n\'ajoute aucune ligne vide', () => {
  const plan = planLabel({
    link: link('https://exemple.fr/a'),
    format: findFormat('generic-50x30'),
    measure: measure1,
    showUrl: true,
    showTitle: true,
  });
  assert.deepEqual(plan.lines, ['https://exemple.fr/a']);
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
    showTitle: true,
    showUrl: true,
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
    showTitle: true,
    showUrl: true,
    marginMm: 2,
  });
  const archive = buildLabelArchive({
    planned,
    images: new Map(),
    settings: {
      format: findFormat('dymo-54'), showTitle: true, showUrl: true, marginMm: 2,
    },
    now: 1,
  });

  const manifest = JSON.parse(readZip(archive).get('export.json'));
  assert.equal(manifest.settings.labelFormat, 'dymo-54');
  assert.equal(manifest.settings.widthMm, 54);
  assert.equal(manifest.settings.showTitle, true);
  assert.equal(manifest.settings.showUrl, true);
  // Le contenu se consigne case par case : `textMode` et le `showTitle`
  // d'appoint qui le complétait ont disparu du manifeste comme du reste.
  assert.equal(manifest.settings.textMode, undefined);
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

test('le défaut coche l\'URL seule, et rien d\'autre', () => {
  // C'est ce que l'onglet imprimait déjà avant l'unification : changer le défaut
  // aurait réécrit le contenu de toute image exportée sans qu'on ait rien
  // demandé.
  assert.equal(DEFAULT_EXPORT_OPTIONS.showUrl, true);
  for (const cle of ['showIndex', 'showTitle', 'showHost']) {
    assert.equal(DEFAULT_EXPORT_OPTIONS[cle], false, cle);
  }
  // Et aucun mode de texte n'a survécu à côté des cases.
  assert.equal(DEFAULT_EXPORT_OPTIONS.textMode, undefined);
});

test('planLabels lit le rang dans la collection, pas dans la sélection', () => {
  const links = [link('https://a.fr', 'Un'), link('https://b.fr', 'Deux')];
  const base = { format: findFormat('generic-50x30'), measure: measure1, showIndex: true };

  // Sans `rankOf`, la place dans la sélection imprimée : 1, 2. Le numéro reste
  // en tête du texte imprimé, avant l'URL.
  const simple = planLabels(links, base);
  assert.deepEqual(simple.map((entry) => entry.plan.lines.join(' ')), [
    'N° 1 https://a.fr',
    'N° 2 https://b.fr',
  ]);

  // Avec lui, le rang de la collection — ici une série reprise à 101.
  const numerote = planLabels(links, {
    ...base,
    rankOf: (item, index) => (item === links[0] ? 101 : index + 1),
  });
  assert.deepEqual(numerote.map((entry) => entry.plan.lines.join(' ')), [
    'N° 101 https://a.fr',
    'N° 2 https://b.fr',
  ]);
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
  // Même une fois le QR Code basculé sur le raccourci : sinon une collection
  // raccourcie deviendrait une série de « 1-tinyurl-com.png ».
  assert.equal(labelFileName(resolved, 0, 1), '1-un-article.png');
});

test('le texte imprimé suit la cible, le domaine non', () => {
  const { resolved } = shortPair();
  assert.deepEqual(labelSegments(resolved, { showUrl: true }), [SHORT_URL]);
  assert.deepEqual(
    labelSegments(resolved, { showTitle: true, showUrl: true }),
    ['Un article', SHORT_URL],
  );
  // Le domaine affiché reste celui du site : « tinyurl.com » sous un QR Code
  // n'apprendrait rien à qui lit l'étiquette.
  assert.deepEqual(labelSegments(resolved, { showHost: true }), ['exemple.fr']);
});

test('le QR Code encode la cible choisie', () => {
  const { raw, resolved } = shortPair();
  const options = { format: findFormat('generic-50x30'), measure: measure1 };
  const before = planLabel({ ...options, link: raw });
  const after = planLabel({ ...options, link: resolved });

  assert.equal(before.url, CLEAN_URL);
  assert.equal(after.url, SHORT_URL);
  // Un lien plus court donne une matrice plus petite, donc un QR Code plus lisible
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

  const withoutDate = planLabel({ ...base, showUrl: true });
  const withDate = planLabel({ ...base, showUrl: true, dateMode: 'date' });
  const withTime = planLabel({ ...base, showUrl: true, dateMode: 'datetime' });

  assert.deepEqual(withoutDate.lines, ['https://exemple.fr/article']);
  assert.deepEqual(withDate.lines, ['https://exemple.fr/article', '15/09/2026']);
  assert.deepEqual(withTime.lines, ['https://exemple.fr/article', '15/09/2026 10:30']);

  // La date se paie en place : le QR Code rétrécit plutôt que de la chasser.
  assert.ok(withDate.qrSizePx < withoutDate.qrSizePx, 'le QR Code doit céder de la place');
  assert.equal(withDate.heightPx, withoutDate.heightPx, 'hauteur fixe : rien ne débordé');

  // Le paramètre de date est consigné dans le manifeste, pour reproduire.
  const planned = planLabels([item], { ...base, showUrl: true, dateMode: 'datetime' });
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

test('une date trop longue est découpée, jamais tronquée', () => {
  // Sur une étiquette de 12 mm, la date n'a pas la place de tenir sur une ligne.
  // Elle était alors abandonnée en bloc ; elle est désormais découpée au plus
  // près, du moment qu'elle reste **entière** : une date fausse est pire que
  // pas de date, mais une date coupée proprement vaut mieux que rien.
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
    showUrl: true,
    dateMode: 'datetime',
  });

  assert.equal(plan.dateOmitted, false, 'la date doit être conservée');
  // Ce qui compte : rien n'est perdu. « 15/09/ » suivi de « 2026 » se lit mal
  // mais reste exact, et c'est le seul découpage possible à cette largeur.
  const texte = plan.lines.join(' ').replace(/\s+/g, ' ');
  assert.ok(texte.includes('15/09/ 2026'), `date incomplète : ${JSON.stringify(plan.lines)}`);
  assert.ok(texte.includes('18:01'), `heure absente : ${JSON.stringify(plan.lines)}`);
  // Et le texte principal n'a pas perdu ses lignes au profit de la date.
  assert.ok(plan.lines.some((l) => l.includes('https')), 'URL absente');

  // Sur une étiquette large, aucun compromis : la date tient sur une ligne.
  const wide = planLabel({
    link: item,
    format: findFormat('generic-70x40'),
    measure: (text) => text.length * 6,
    showUrl: true,
    dateMode: 'datetime',
  });
  assert.equal(wide.dateOmitted, false);
  assert.equal(wide.lines.at(-1), '15/09/2026 18:01');

  // Une largeur où même un fragment ne tient pas : là, la date est abandonnée,
  // et le manifeste le compte.
  const etroit = planLabel({
    link: item,
    format: findFormat('niimbot-d110'),
    measure: (text) => text.length * 30,
    showUrl: true,
    dateMode: 'datetime',
  });
  assert.equal(etroit.dateOmitted, true, 'aucun découpage entier possible');

  const archive = buildLabelArchive({
    planned: [{ link: item, fileName: '1-un.png', plan: etroit }],
    images: new Map(),
    settings: { format: findFormat('niimbot-d110'), dateMode: 'datetime' },
    now: 1,
  });
  const manifest = JSON.parse(readZip(archive).get('export.json'));
  assert.equal(manifest.datesOmitted, 1);
});

// ---------------------------------------------------------------------------
// Échelle de l'aperçu
//
// Le défaut : l'aperçu agrandissait huit fois et demi sans le dire, borné par un
// facteur de rendu — « 4 » — qui ne veut rien dire pour l'utilisateur. Quatre
// fois un rendu de 203 ppp, c'est huit fois et demi la taille réelle ; quatre
// fois un rendu de 300 ppp, c'en est deux et deux dixièmes.
// ---------------------------------------------------------------------------

test("l'aperçu d'une étiquette est borné par un multiple de la taille réelle", () => {
  // Tête de 12 mm à 203 ppp, panneau large : la borne doit mordre, et donner
  // exactement le multiple annoncé.
  const grand = labelPreviewZoom({ widthPx: 96, dpi: 203, availablePx: 600 });
  assert.equal(grand.multiple.toFixed(2), '4.00');

  // Tête large : c'est la place disponible qui commande, et le multiple suit.
  const moyen = labelPreviewZoom({ widthPx: 851, dpi: 300, availablePx: 600 });
  assert.ok(moyen.multiple < 4 && moyen.multiple > 1);
  assert.equal(Math.round(851 * moyen.zoom), 600, "la largeur disponible n'est pas utilisée");
});

test("l'aperçu à la taille réelle montre l'étiquette à sa taille physique", () => {
  // 12 mm à l'écran, à la correspondance admise de 96 px CSS par pouce : 45 px.
  const reel = labelPreviewZoom({ widthPx: 96, dpi: 203, availablePx: 600, realSize: true });
  assert.equal(reel.multiple, 1);
  assert.equal(Math.round(96 * reel.zoom), 45);

  // Et cela ne dépend pas de la résolution de la tête : la taille physique est
  // la même, seul le nombre de pixels de rendu change.
  const autreTete = labelPreviewZoom({ widthPx: 142, dpi: 300, availablePx: 600, realSize: true });
  assert.equal(autreTete.multiple, 1);
  assert.equal(Math.round(142 * autreTete.zoom), 45);
});

test("l'aperçu ne dépasse jamais la place offerte", () => {
  for (const availablePx of [80, 200, 600, 1200]) {
    for (const widthPx of [96, 300, 851]) {
      const { zoom } = labelPreviewZoom({ widthPx, dpi: 203, availablePx });
      assert.ok(
        Math.round(widthPx * zoom) <= availablePx + 1,
        `${widthPx} px dans ${availablePx} px → ${Math.round(widthPx * zoom)} px`,
      );
    }
  }
});

test("l'échelle reste exploitable même quand la place manque", () => {
  // Un panneau très étroit : l'étiquette doit rétrécir, pas disparaître.
  const etroit = labelPreviewZoom({ widthPx: 851, dpi: 300, availablePx: 120 });
  assert.ok(etroit.zoom > 0 && etroit.multiple > 0);
  assert.equal(Math.round(851 * etroit.zoom), 120);
});

test("une résolution manquante ne fait pas disparaître l'aperçu", () => {
  // Un profil incomplet ne doit pas produire un `NaN` jusque dans la largeur du
  // canevas : c'est le genre de valeur qui laisse une zone vide sans message.
  const defaut = labelPreviewZoom({ widthPx: 96, dpi: 0, availablePx: 600 });
  assert.ok(Number.isFinite(defaut.zoom) && defaut.zoom > 0);
  assert.ok(Number.isFinite(defaut.multiple));
});
