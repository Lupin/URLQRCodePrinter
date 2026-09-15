/**
 * Tests de la relecture des archives.
 *
 * Le défaut qui a motivé ce fichier : l'import n'acceptait qu'une seule des
 * formes que l'application sait produire — l'archive JSON. Le CSV exporté, le
 * dossier d'étiquettes `.zip` et son `export.json` étaient refusés. Autrement
 * dit, on ne pouvait pas réimporter ce qu'on venait d'exporter, ce qui rendait
 * la fonction incompréhensible.
 *
 * Chaque forme produite par l'application est donc testée en aller-retour.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseImportFile,
  parseCsvRows,
  parseExportedDate,
  toImportableLinks,
} from '../src/core/import.js';
import { toJson, toCsv, formatCaptureDate } from '../src/core/exporters.js';
import { createZip } from '../src/core/zip.js';
import { createLink } from '../src/core/link.js';

const STAMP = new Date(2026, 8, 15, 10, 30).getTime();

/** Un lien complet, avec tous les champs que l'interface sait saisir. */
function fullLink() {
  return createLink({
    id: 'lien-1',
    url: 'https://exemple.fr/article?utm_source=newsletter&id=42',
    title: 'Un article',
    tags: ['veille', 'travail'],
    note: 'à relire',
    createdAt: STAMP,
    shortUrl: 'https://tinyurl.com/2yxwpwb6',
    shortProvider: 'tinyurl',
  }, { now: STAMP });
}

// ---------------------------------------------------------------------------
// Archive JSON
// ---------------------------------------------------------------------------

test('l\'archive JSON se relit à l\'identique', () => {
  const link = fullLink();
  const { kind, records } = parseImportFile({ name: 'liens.json', text: toJson([link]) });
  assert.equal(kind, 'links');

  const { links, rejected } = toImportableLinks(records, { now: STAMP });
  assert.equal(rejected, 0);
  assert.equal(links.length, 1);

  const [restored] = links;
  assert.equal(restored.url, link.url);
  assert.equal(restored.title, link.title);
  assert.equal(restored.note, link.note);
  assert.deepEqual(restored.tags, ['veille', 'travail']);
  assert.equal(restored.createdAt, STAMP, 'la date de collecte doit survivre');
  assert.equal(restored.shortUrl, link.shortUrl);
  assert.equal(restored.shortProvider, 'tinyurl');
  assert.equal(restored.id, 'lien-1', 'l\'identifiant est conservé');
  assert.equal(restored.source, 'import');
});

test('un tableau nu reste accepté', () => {
  const { kind, records } = parseImportFile({ name: 'a.json', text: JSON.stringify([fullLink()]) });
  assert.equal(kind, 'links');
  assert.equal(records.length, 1);
});

test('une archive sans liens est refusée avec un message utile', () => {
  assert.throws(
    () => parseImportFile({ name: 'x.json', text: JSON.stringify({ format: 'autre', items: [] }) }),
    (error) => {
      assert.ok(error instanceof TypeError);
      assert.match(error.message, /autre/, 'le format fautif est nommé');
      assert.match(error.message, /Formats acceptés/, 'les formats attendus sont listés');
      return true;
    },
  );
  assert.throws(() => parseImportFile({ name: 'x.json', text: '{tronqué' }), /illisible/);
});

// ---------------------------------------------------------------------------
// Dossier d'étiquettes
// ---------------------------------------------------------------------------

/** Construit un dossier d'étiquettes minimal, comme l'export. */
function labelArchive(entries) {
  return createZip(
    [
      { name: 'export.json', data: JSON.stringify(entries) },
      { name: 'planche.html', data: '<html></html>' },
      { name: 'liens.csv', data: 'N°;URL;Titre;Image\r\n' },
    ],
    { date: new Date(STAMP) },
  );
}

test('le dossier d\'étiquettes se relit depuis son ZIP', () => {
  // Le cas qui ne marchait pas : on exporte le ZIP, on le réimporte.
  const bytes = labelArchive({
    format: 'url-qr-code-printer/labels',
    version: 1,
    count: 1,
    labels: [{
      file: 'etiquettes/1-un-article.png',
      url: 'https://tinyurl.com/2yxwpwb6',
      originalUrl: 'https://exemple.fr/article?id=42',
      title: 'Un article',
    }],
  });

  const { kind, records, notes } = parseImportFile({ name: 'etiquettes-qr.zip', bytes });
  assert.equal(kind, 'labels');
  assert.match(notes.join(' '), /export\.json/);

  const { links } = toImportableLinks(records, { now: STAMP });
  assert.equal(links.length, 1);
  // L'URL d'origine est préférée à la cible imprimée, qui reste comme raccourci.
  assert.equal(links[0].url, 'https://exemple.fr/article?id=42');
  assert.equal(links[0].shortUrl, 'https://tinyurl.com/2yxwpwb6');
  assert.equal(links[0].title, 'Un article');
});

test('l\'export.json seul se relit comme le ZIP', () => {
  const text = JSON.stringify({
    format: 'url-qr-code-printer/labels',
    labels: [{ url: 'https://exemple.fr/a', title: 'Titre' }],
  });
  const { kind, records } = parseImportFile({ name: 'export.json', text });
  assert.equal(kind, 'labels');
  assert.equal(records[0].url, 'https://exemple.fr/a');
  assert.equal(records[0].shortUrl, '', 'sans URL d\'origine, pas de raccourci inventé');
});

test('un ZIP étranger est refusé, sans être confondu avec un JSON', () => {
  assert.throws(
    () => parseImportFile({ name: 'photos.zip', bytes: new Uint8Array([0x50, 0x4b, 9, 9]) }),
    /Aucune|aucune entrée lisible/,
  );
  // ZIP valide mais sans manifeste : on nomme ce qu'il contient.
  const other = createZip([{ name: 'notes.txt', data: 'rien' }], { date: new Date(STAMP) });
  assert.throws(() => parseImportFile({ name: 'autre.zip', bytes: other }), /export\.json/);
});

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

test('le CSV exporté se relit, colonnes reconnues par leur en-tête', () => {
  const link = fullLink();
  const { kind, records } = parseImportFile({ name: 'liens.csv', text: toCsv([link]) });
  assert.equal(kind, 'csv');

  const { links, rejected } = toImportableLinks(records, { now: STAMP });
  assert.equal(rejected, 0);
  const [restored] = links;
  assert.equal(restored.url, link.url);
  assert.equal(restored.title, 'Un titre' === link.title ? link.title : link.title);
  assert.deepEqual(restored.tags, ['veille', 'travail']);
  assert.equal(restored.note, 'à relire');
  assert.equal(restored.createdAt, STAMP, 'la colonne « Ajouté le » est relue');
});

test('un CSV réordonné reste importable', () => {
  const csv = '\uFEFFTitre;Note;URL;Tags\r\nUn;à voir;https://exemple.fr/x;veille travail\r\n';
  const { records } = parseImportFile({ name: 'x.csv', text: csv });
  assert.deepEqual(records, [{
    url: 'https://exemple.fr/x',
    title: 'Un',
    note: 'à voir',
    tags: ['veille', 'travail'],
  }]);
});

test('un CSV à virgules et sans BOM est reconnu', () => {
  const text = toCsv([fullLink()], { delimiter: ',', bom: false });
  const { kind, records } = parseImportFile({ name: 'x.csv', text });
  assert.equal(kind, 'csv');
  assert.equal(records.length, 1);
  assert.equal(records[0].url, 'https://exemple.fr/article?id=42');
});

test('les guillemets et séparateurs d\'un champ sont respectés', () => {
  const rows = parseCsvRows('A;B\r\n"un;deux";"il a dit ""oui"""\r\n');
  assert.deepEqual(rows, [['A', 'B'], ['un;deux', 'il a dit "oui"']]);

  const csv = 'N°;URL;Titre;Note\r\n1;https://e.fr/x;"Titre; avec point-virgule";"ligne1\nligne2"\r\n';
  const { records } = parseImportFile({ name: 'x.csv', text: csv });
  assert.equal(records[0].title, 'Titre; avec point-virgule');
  assert.equal(records[0].note, 'ligne1\nligne2');
});

test('un CSV sans colonne URL est refusé en nommant ses colonnes', () => {
  assert.throws(
    () => parseImportFile({ name: 'x.csv', text: 'Nom;Ville\r\nA;B\r\n' }),
    (error) => {
      assert.match(error.message, /colonne « URL »/);
      assert.match(error.message, /Nom, Ville/, 'les colonnes trouvées sont citées');
      return true;
    },
  );
});

test('les dates d\'export sont relues en heure locale', () => {
  assert.equal(parseExportedDate('15/09/2026 10:30'), STAMP);
  assert.equal(parseExportedDate('15/09/2026'), new Date(2026, 8, 15).getTime());
  assert.equal(parseExportedDate(''), 0);
  assert.equal(parseExportedDate('hier'), 0);
  assert.equal(parseExportedDate('32/13/2026'), 0, 'une date impossible ne doit pas passer');
  // Cohérence avec l'écriture : ce qu'on écrit doit se relire.
  assert.equal(parseExportedDate(formatCaptureDate(STAMP, 'datetime')), STAMP);
});

// ---------------------------------------------------------------------------
// Cas limites
// ---------------------------------------------------------------------------

test('les enregistrements illisibles sont comptés, pas fatals', () => {
  const { links, rejected } = toImportableLinks([
    { url: 'https://exemple.fr/ok' },
    { url: 'javascript:alert(1)' },
    { url: '' },
    {},
    { url: 'https://exemple.fr/ok2', title: 'Deux' },
  ], { now: STAMP });

  assert.equal(links.length, 2);
  assert.equal(rejected, 3);
  assert.deepEqual(links.map((link) => link.url), ['https://exemple.fr/ok', 'https://exemple.fr/ok2']);
});

test('un fichier d\'un autre type est refusé clairement', () => {
  assert.throws(
    () => parseImportFile({ name: 'notes.txt', text: 'bonjour' }),
    /pas un format reconnu/,
  );
  assert.throws(() => parseImportFile({ name: 'vide.json', text: '' }), /reconnu|illisible/);
});

test('un CSV vide de données est refusé', () => {
  assert.throws(
    () => parseImportFile({ name: 'x.csv', text: 'N°;URL;Titre\r\n' }),
    /sans ligne de données/,
  );
});
