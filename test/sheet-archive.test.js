/**
 * Archive d'une planche d'étiquettes.
 *
 * Ce que ces tests protègent, dans l'ordre d'importance :
 *
 * 1. **Le HTML exporté est celui de l'application, pas une copie.** Le module
 *    reçoit les pages déjà rendues et la feuille de style réellement appliquée ;
 *    un test refuse qu'une règle de géométrie soit réécrite ici. C'est la seule
 *    façon d'empêcher l'écart que personne ne veut lire : « l'aperçu était
 *    juste, l'export non ».
 * 2. **La page exportée s'imprime.** La feuille de style masque la racine
 *    d'impression à l'écran ; le fichier doit à la fois la montrer et
 *    l'imprimer, et déclarer la taille du papier — une planche Letter ne part
 *    pas sur du A4.
 * 3. **Le manifeste suffit à reproduire la planche**, et le CSV à retrouver
 *    quelle étiquette porte quel lien.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildSheetArchive,
  buildSheetHtml,
  sheetArchiveName,
  SHEET_ARCHIVE_FORMAT,
} from '../src/core/sheet-archive.js';
import { readStoredZip } from '../src/core/zip.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Une planche minimale, telle que l'application la rendrait. */
const PAGES_HTML = '<div class="print-page" style="width:210mm;height:297mm">'
  + '<div class="print-cell" style="left:7.25mm;top:12.9mm;width:63.5mm;height:33.9mm">'
  + '<div class="print-cell__qr"></div></div></div>';

const LAYOUT = {
  columns: 3,
  rows: 8,
  perPage: 24,
  pages: 1,
  labelWidthMm: 63.5,
  labelHeightMm: 33.9,
  marginXMm: 7.25,
  marginYMm: 12.9,
};

const CELLULES = [
  { index: 0, page: 0, column: 0, row: 0, url: 'https://exemple.fr/a', title: 'Premier' },
  { index: 1, page: 0, column: 1, row: 0, url: 'https://exemple.fr/b', title: 'Second' },
];

function archiver(extra = {}) {
  return buildSheetArchive({
    pagesHtml: PAGES_HTML,
    css: '.print-cell { position: absolute; }',
    title: 'Mes liens',
    pageWidthMm: 210,
    pageHeightMm: 297,
    layout: LAYOUT,
    qrRatio: 0.7,
    qrSideMm: 23.73,
    fontPt: 7,
    options: { title: true, url: false, border: false },
    cells: CELLULES,
    now: Date.UTC(2025, 0, 15, 11, 30),
    ...extra,
  });
}

/** Le contenu des entrées de l'archive, indexé par nom. */
function contenu(bytes) {
  const entrees = readStoredZip(bytes);
  return Object.fromEntries(
    [...entrees].map(([nom, donnees]) => [nom, new TextDecoder().decode(donnees)]),
  );
}

test("l'archive contient une page, un manifeste et la correspondance", () => {
  const { bytes } = archiver();
  const fichiers = Object.keys(contenu(bytes)).sort();
  assert.deepEqual(fichiers, ['liens.csv', 'planche.html', 'planche.json']);
});

test('la page exportée reprend le balisage rendu par l\'application', () => {
  // Au caractère près : c'est ce qui garantit que l'export et l'impression
  // montrent la même planche. Le module ne doit pas « refaire » la géométrie.
  const { bytes } = archiver();
  const html = contenu(bytes)['planche.html'];
  assert.ok(html.includes(PAGES_HTML), 'le balisage rendu a été transformé');
});

test("la page exportée reprend la feuille de style appliquée", () => {
  const { bytes } = archiver({ css: '.print-cell { position: absolute; top: 0; }' });
  const html = contenu(bytes)['planche.html'];
  assert.ok(html.includes('.print-cell { position: absolute; top: 0; }'));

  // Et rien d'écrit à la main : aucune règle de géométrie ne doit apparaître
  // dans le module. C'est ce contrôle qui empêche la seconde formule.
  const source = readFileSync(join(ROOT, 'src/core/sheet-archive.js'), 'utf8');
  assert.doesNotMatch(source, /position:\s*absolute/);
  assert.doesNotMatch(source, /\.print-cell\s*\{/);
  assert.doesNotMatch(source, /mm;\s*\}/);
});

test('la page exportée s\'imprime : taille du papier, écran et papier', () => {
  const html = buildSheetHtml({
    pagesHtml: PAGES_HTML, css: '', title: 'Mes liens',
    pageWidthMm: 210, pageHeightMm: 297,
  });

  // La taille du papier vient de la page, pas d'un réglage d'imprimante.
  assert.match(html, /@page\s*\{\s*size:\s*210mm 297mm;\s*margin:\s*0;\s*\}/);
  // La racine d'impression est masquée à l'écran par la feuille de
  // l'application : ici, elle **est** la page, et doit se voir.
  assert.match(html, /\.print-root\s*\{[^}]*display:\s*block\s*!important/);
  assert.match(html, /@media print\s*\{/);
  // Le titre de l'onglet nomme la collection : sur une liasse imprimée, c'est
  // ce qui permet de retrouver de quoi il s'agit.
  assert.match(html, /<title>Mes liens — planche d'étiquettes<\/title>/);
});

test('le manifeste suffit à reproduire la planche', () => {
  const { manifest } = archiver();
  assert.equal(manifest.format, SHEET_ARCHIVE_FORMAT);
  assert.equal(manifest.version, 1);
  assert.deepEqual(manifest.page, { widthMm: 210, heightMm: 297 });
  assert.deepEqual(manifest.grid, { columns: 3, rows: 8, perPage: 24, pages: 1 });
  assert.deepEqual(manifest.label, { widthMm: 63.5, heightMm: 33.9 });
  assert.deepEqual(manifest.margins, { xMm: 7.25, yMm: 12.9 });
  assert.equal(manifest.fontPt, 7);
  assert.deepEqual(manifest.qr, { ratio: 0.7, sideMm: 23.73 });
  // Les cases cochées : sans elles, le manifeste décrirait une planche qu'on ne
  // saurait pas reproduire.
  assert.deepEqual(manifest.options, { title: true, url: false, border: false });
  assert.equal(manifest.exportedAt, new Date(Date.UTC(2025, 0, 15, 11, 30)).toISOString());
});

test('le CSV relie chaque lien à sa place sur la planche', () => {
  // C'est ce qui permet de retrouver l'étiquette d'un lien sans compter les
  // cases à la main.
  const { bytes } = archiver();
  const csv = contenu(bytes)['liens.csv'];
  const lignes = csv.replace(/^\uFEFF/, '').trim().split('\r\n');

  assert.equal(lignes[0], 'N°;Page;Colonne;Rangée;URL;Titre');
  assert.equal(lignes[1], '1;1;1;1;https://exemple.fr/a;Premier');
  // La deuxième étiquette est en colonne 2 : c'est la position, pas le rang de
  // la collection, qui dit où elle se trouve.
  assert.equal(lignes[2], '2;1;2;1;https://exemple.fr/b;Second');
});

test('un titre contenant le séparateur ne casse pas le CSV', () => {
  const { bytes } = archiver({
    cells: [{ index: 0, page: 0, column: 0, row: 0, url: 'https://e.fr/a', title: 'Un; deux' }],
  });
  const csv = contenu(bytes)['liens.csv'];
  assert.ok(csv.includes('"Un; deux"'), 'le champ doit être mis entre guillemets');
});

test('le manifeste porte le rang de chaque étiquette', () => {
  const { manifest } = archiver();
  assert.equal(manifest.count, 2);
  assert.deepEqual(manifest.cells[1], {
    index: 1, page: 0, column: 1, row: 0,
    url: 'https://exemple.fr/b', title: 'Second',
  });
});

test("le nom de l'archive porte la collection et se distingue du tableau", () => {
  // Le dossier du tableau porte le nom seul : sans ce mot, les deux archives
  // seraient indiscernables dans un dossier de téléchargements.
  const nom = sheetArchiveName(Date.UTC(2025, 0, 15, 11, 30), 'Mes liens');
  assert.match(nom, /^Mes-liens-planche-\d{8}-\d{4}\.zip$/);
});

test('le manifeste porte la note de collection quand il y en a une', () => {
  // Sans elle, le dossier ne dit pas de quoi il parle — et c'est précisément ce
  // qu'une note de collection sert à dire.
  const { manifest } = archiver({ note: 'Pour le rangement du garage.' });
  assert.equal(manifest.note, 'Pour le rangement du garage.');
});

test("une note absente n'ajoute pas de clé vide au manifeste", () => {
  const { manifest } = archiver();
  assert.ok(!('note' in manifest), 'une clé vide a été ajoutée');
});
