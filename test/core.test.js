/**
 * Tests du cœur métier (Node >= 20, `node --test`).
 * Ces modules sont purs : aucun DOM, aucun réseau, donc testables directement.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeUrl,
  isValidUrl,
  normalizeTags,
  createLink,
  hostOf,
  isSameTarget,
  findDuplicate,
} from '../src/core/link.js';

import {
  toCsv,
  toMarkdown,
  toJson,
  parseJsonExport,
  escapeCsvField,
  exportFilename,
} from '../src/core/exporters.js';

import { encodeQr, pickScale, toMonoBitmap, toSvg } from '../src/core/qr.js';

const T0 = Date.UTC(2025, 0, 15, 10, 30);

// --------------------------------------------------------------------------
// link.js
// --------------------------------------------------------------------------

test('normalizeUrl ajoute le schéma manquant', () => {
  assert.equal(normalizeUrl('example.com/page'), 'https://example.com/page');
});

test('normalizeUrl supprime le fragment', () => {
  assert.equal(normalizeUrl('https://example.com/a#section'), 'https://example.com/a');
});

test('normalizeUrl retire les paramètres de campagne mais garde les utiles', () => {
  const out = normalizeUrl('https://example.com/p?utm_source=news&id=42&fbclid=xyz');
  assert.equal(out, 'https://example.com/p?id=42');
});

test('normalizeUrl retire le slash final de la racine', () => {
  assert.equal(normalizeUrl('https://example.com/'), 'https://example.com');
});

test('normalizeUrl refuse les schémas non web', () => {
  assert.throws(() => normalizeUrl('mailto:a@b.com'), TypeError);
  assert.throws(() => normalizeUrl('ftp://example.com'), TypeError);
});

test('normalizeUrl refuse un hôte sans point', () => {
  assert.throws(() => normalizeUrl('pasunhote'), TypeError);
  assert.equal(normalizeUrl('localhost:3000'), 'https://localhost:3000');
});

test('normalizeUrl est idempotent', () => {
  const once = normalizeUrl('HTTPS://WWW.Example.COM/a/?utm_medium=x#frag');
  assert.equal(normalizeUrl(once), once);
});

test('isValidUrl ne lève jamais', () => {
  assert.equal(isValidUrl('https://ok.com'), true);
  assert.equal(isValidUrl(''), false);
  assert.equal(isValidUrl(null), false);
});

test('hostOf retire le www', () => {
  assert.equal(hostOf('https://www.lemonde.fr/article'), 'lemonde.fr');
  assert.equal(hostOf('pas une url'), '');
});

test('normalizeTags nettoie, dédoublonne et conserve l\'ordre', () => {
  assert.deepEqual(normalizeTags(['#Projet', 'projet', ' Ma Tag ', '', 42]), ['projet', 'ma-tag']);
  assert.deepEqual(normalizeTags('pas un tableau'), []);
});

test('createLink produit un enregistrement complet', () => {
  const link = createLink(
    { url: 'example.com', title: '  Titre  ', tags: ['A'] },
    { now: T0, source: 'context-menu' },
  );
  assert.equal(link.url, 'https://example.com');
  assert.equal(link.title, 'Titre');
  assert.deepEqual(link.tags, ['a']);
  assert.equal(link.createdAt, T0);
  assert.equal(link.updatedAt, T0);
  assert.equal(link.source, 'context-menu');
  assert.match(link.id, /^[0-9a-f-]{36}$/);
});

test('createLink ramène une source inconnue à manual', () => {
  const link = createLink({ url: 'example.com', source: 'pirate' }, { now: T0 });
  assert.equal(link.source, 'manual');
});

test('isSameTarget ignore www, casse de l\'hôte et slash final', () => {
  assert.equal(isSameTarget('https://www.Example.com/a/', 'https://example.com/a'), true);
  assert.equal(isSameTarget('https://example.com/a', 'https://example.com/b'), false);
});

test('findDuplicate retrouve un lien déjà collecté', () => {
  const links = [createLink({ url: 'https://example.com/x?utm_source=a' }, { now: T0 })];
  assert.ok(findDuplicate(links, 'https://www.example.com/x'));
  assert.equal(findDuplicate(links, 'https://autre.com'), undefined);
});

// --------------------------------------------------------------------------
// exporters.js
// --------------------------------------------------------------------------

test('escapeCsvField ne cite que si nécessaire', () => {
  assert.equal(escapeCsvField('simple', ';'), 'simple');
  assert.equal(escapeCsvField('a;b', ';'), '"a;b"');
  assert.equal(escapeCsvField('a,b', ';'), 'a,b');
  assert.equal(escapeCsvField('dit "bonjour"', ';'), '"dit ""bonjour"""');
  assert.equal(escapeCsvField('ligne1\nligne2', ';'), '"ligne1\nligne2"');
});

test('toCsv produit un en-tête, un BOM et des CRLF', () => {
  const links = [createLink({ url: 'https://example.com/a', title: 'Titre' }, { now: T0 })];
  const csv = toCsv(links);
  assert.ok(csv.startsWith('\uFEFF'));
  const lines = csv.replace('\uFEFF', '').split('\r\n').filter(Boolean);
  assert.equal(lines.length, 2);
  assert.ok(lines[0].startsWith('N°;URL;Titre'));
  assert.ok(lines[1].includes('https://example.com/a'));
  assert.ok(lines[1].includes('Titre'));
});

test('toCsv gère un titre contenant le séparateur', () => {
  const links = [createLink({ url: 'https://e.com', title: 'a;b' }, { now: T0 })];
  assert.ok(toCsv(links).includes('"a;b"'));
});

test('toCsv accepte la virgule et l\'absence de BOM', () => {
  const links = [createLink({ url: 'https://e.com' }, { now: T0 })];
  const csv = toCsv(links, { delimiter: ',', bom: false });
  assert.ok(csv.startsWith('N°,URL'));
});

test('toMarkdown produit un tableau avec liens cliquables', () => {
  const links = [createLink({ url: 'https://e.com/a', title: 'Ex', tags: ['x'] }, { now: T0 })];
  const md = toMarkdown(links, { now: T0 });
  assert.ok(md.startsWith('---\n'));
  assert.ok(md.includes('# Mes liens QR'));
  assert.ok(md.includes('| N° | URL | Titre | Tags | Ajouté le |'));
  assert.ok(md.includes('[https://e.com/a](https://e.com/a)'));
  assert.ok(md.includes('`#x`'));
  assert.ok(md.includes('2025-01-15'));
});

test('toMarkdown échappe les barres verticales des titres', () => {
  const links = [createLink({ url: 'https://e.com', title: 'a|b' }, { now: T0 })];
  assert.ok(toMarkdown(links, { now: T0 }).includes('a\\|b'));
});

test('toMarkdown gère la liste vide', () => {
  const md = toMarkdown([], { now: T0 });
  assert.ok(md.includes('_Aucun lien enregistré._'));
});

test('toMarkdown en mode liste inclut le domaine et la note', () => {
  const links = [createLink({ url: 'https://e.com', note: 'à relire' }, { now: T0 })];
  const md = toMarkdown(links, { layout: 'list', frontmatter: false, now: T0 });
  assert.ok(md.includes('- [https://e.com](https://e.com)'));
  assert.ok(md.includes('à relire'));
});

test('l\'export JSON fait un aller-retour fidèle', () => {
  const links = [createLink({ url: 'https://e.com/a', title: 'T', tags: ['z'] }, { now: T0 })];
  const parsed = parseJsonExport(toJson(links, { now: T0 }));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].url, 'https://e.com/a');
  assert.deepEqual(parsed[0].tags, ['z']);
});

test('parseJsonExport rejette un JSON sans liens', () => {
  assert.throws(() => parseJsonExport('{"foo":1}'), TypeError);
});

test('exportFilename est horodaté, assaini et en heure locale', () => {
  // L'horodatage est volontairement local : l'utilisateur doit reconnaître
  // l'heure de son export. On vérifie donc la forme, pas une heure figée.
  assert.match(exportFilename('Mes liens QR', 'csv', T0), /^Mes-liens-QR-\d{8}-\d{4}\.csv$/);
  assert.ok(exportFilename('', 'md', T0).startsWith('liens-'));
  assert.ok(exportFilename('///', 'csv', T0).startsWith('liens-'));
  assert.ok(exportFilename('a/b:c*d', 'csv', T0).startsWith('a-b-c-d-'));
});

test('exportFilename suit le fuseau horaire local', () => {
  const d = new Date(T0);
  const pad = (n) => String(n).padStart(2, '0');
  const expected =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}`;
  assert.equal(exportFilename('x', 'csv', T0), `x-${expected}.csv`);
});

// --------------------------------------------------------------------------
// qr.js
// --------------------------------------------------------------------------

test('encodeQr renvoie une matrice carrée avec bordure', () => {
  const m = encodeQr('https://example.com', { ecc: 'M', border: 2 });
  assert.equal(m.data.length, m.size);
  assert.equal(m.data[0].length, m.size);
  assert.equal(m.border, 2);
  // La bordure est blanche, un finder pattern se trouve en haut à gauche du contenu.
  assert.equal(m.data[0][0], false);
});

test('encodeQr rejette une chaîne vide', () => {
  assert.throws(() => encodeQr(''), TypeError);
});

test('une URL plus longue produit une matrice plus grande', () => {
  const court = encodeQr('https://a.co', { border: 0 });
  const long = encodeQr('https://example.com/' + 'segment/'.repeat(20), { border: 0 });
  assert.ok(long.size > court.size);
});

test('pickScale reste entier et ne descend pas sous 1', () => {
  assert.equal(pickScale(100, 29), 3);
  assert.equal(pickScale(10, 29), 1);
  assert.equal(pickScale(0, 29), 1);
});

test('toMonoBitmap produit des lignes alignées sur l\'octet', () => {
  const m = encodeQr('https://example.com', { border: 2 });
  const bmp = toMonoBitmap(m, 3);
  assert.equal(bmp.width, m.size * 3);
  assert.equal(bmp.bytesPerRow, Math.ceil(bmp.width / 8));
  assert.equal(bmp.rows.length, bmp.height);
  for (const row of bmp.rows) {
    assert.ok(row instanceof Uint8Array);
    assert.equal(row.length, bmp.bytesPerRow);
  }
  // Un QR n'est jamais entièrement blanc : au moins un bit doit être à 1.
  assert.ok(bmp.rows.some((row) => row.some((b) => b !== 0)));
});

test('toMonoBitmap place le premier module noir dans le bit de poids fort', () => {
  const fake = { data: [[true]], size: 1, version: 1, border: 0 };
  const bmp = toMonoBitmap(fake, 1);
  assert.equal(bmp.rows[0][0], 0b10000000);
});

test('toSvg produit un SVG valide et non vide', () => {
  const svg = toSvg(encodeQr('https://example.com', { border: 1 }), { scale: 4 });
  assert.ok(svg.startsWith('<svg '));
  assert.ok(svg.endsWith('</svg>'));
  assert.ok(svg.includes('<path d="M'));
});
