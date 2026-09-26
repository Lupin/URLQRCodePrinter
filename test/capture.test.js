/**
 * Tests de la capture depuis le navigateur.
 * Aucune API d'extension n'est requise : on ne teste que la décision.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MENU_IDS,
  buildMenuDefinitions,
  looksLikeUrl,
  captureFromClick,
  captureFromTab,
  describeCapture,
} from '../src/core/capture.js';

// ---------------------------------------------------------------------------
// looksLikeUrl
// ---------------------------------------------------------------------------

test('looksLikeUrl accepte une URL avec schéma', () => {
  assert.equal(looksLikeUrl('https://example.com/a'), true);
});

test('looksLikeUrl accepte un domaine sans schéma', () => {
  assert.equal(looksLikeUrl('example.com'), true);
});

test('looksLikeUrl refuse une phrase', () => {
  assert.equal(looksLikeUrl('voici le lien vers example.com'), false);
});

test('looksLikeUrl refuse un texte vide ou non textuel', () => {
  assert.equal(looksLikeUrl(''), false);
  assert.equal(looksLikeUrl('   '), false);
  assert.equal(looksLikeUrl(null), false);
  assert.equal(looksLikeUrl(42), false);
});

test('looksLikeUrl refuse un texte démesuré', () => {
  assert.equal(looksLikeUrl('https://example.com/' + 'x'.repeat(3000)), false);
});

test('looksLikeUrl refuse un schéma non web', () => {
  assert.equal(looksLikeUrl('mailto:a@b.com'), false);
});

// ---------------------------------------------------------------------------
// Définitions de menu
// ---------------------------------------------------------------------------

test('le menu propose page, lien et sélection', () => {
  const menus = buildMenuDefinitions();
  const ids = menus.map((m) => m.id);
  assert.ok(ids.includes(MENU_IDS.page));
  assert.ok(ids.includes(MENU_IDS.link));
  assert.ok(ids.includes(MENU_IDS.selection));
});

test('les contextes sont restrictifs', () => {
  const menus = buildMenuDefinitions();
  const byId = Object.fromEntries(menus.map((m) => [m.id, m]));
  assert.deepEqual(byId[MENU_IDS.page].contexts, ['page']);
  assert.deepEqual(byId[MENU_IDS.link].contexts, ['link']);
  assert.deepEqual(byId[MENU_IDS.selection].contexts, ['selection']);
});

test('l\'entrée de sélection est désactivée si demandé', () => {
  const menus = buildMenuDefinitions({ includeSelection: false });
  const selection = menus.find((m) => m.id === MENU_IDS.selection);
  assert.equal(selection.enabled, false);
});

test('l\'entrée « ouvrir l\'application » n\'apparaît qu\'avec une URL', () => {
  assert.equal(buildMenuDefinitions().some((m) => m.id === MENU_IDS.openApp), false);
  const avec = buildMenuDefinitions({ appUrl: 'https://exemple.test/' });
  assert.ok(avec.some((m) => m.id === MENU_IDS.openApp));
});

// ---------------------------------------------------------------------------
// captureFromClick
// ---------------------------------------------------------------------------

test('un clic sur un lien enregistre le lien, pas la page', () => {
  const capture = captureFromClick(
    { menuItemId: MENU_IDS.link, linkUrl: 'https://cible.com/a', pageUrl: 'https://hote.com/' },
    { title: 'Page hôte' },
  );
  assert.equal(capture.url, 'https://cible.com/a');
  assert.equal(capture.title, 'cible.com');
});

test('un clic sur la page enregistre la page et son titre', () => {
  const capture = captureFromClick(
    { menuItemId: MENU_IDS.page, pageUrl: 'https://example.com/article' },
    { title: 'Un article' },
  );
  assert.equal(capture.url, 'https://example.com/article');
  assert.equal(capture.title, 'Un article');
});

test('une sélection qui est une URL est enregistrée telle quelle', () => {
  const capture = captureFromClick({
    menuItemId: MENU_IDS.selection,
    selectionText: 'https://selection.com/x',
    pageUrl: 'https://hote.com/',
  });
  assert.equal(capture.url, 'https://selection.com/x');
});

test('une sélection qui n\'est pas une URL devient une note sur le lien', () => {
  const capture = captureFromClick({
    menuItemId: MENU_IDS.link,
    linkUrl: 'https://cible.com/a',
    selectionText: 'le texte du lien',
  });
  assert.equal(capture.url, 'https://cible.com/a');
  assert.equal(capture.note, 'le texte du lien');
});

test('une sélection non-URL sans lien retombe sur la page', () => {
  const capture = captureFromClick(
    { menuItemId: MENU_IDS.selection, selectionText: 'du texte quelconque', pageUrl: 'https://p.com/' },
    { title: 'T' },
  );
  assert.equal(capture.url, 'https://p.com/');
});

test('une image cliquée est enregistrée', () => {
  const capture = captureFromClick({
    menuItemId: 'autre',
    srcUrl: 'https://img.com/photo.png',
    pageUrl: 'https://hote.com/',
  });
  assert.equal(capture.url, 'https://img.com/photo.png');
});

test('captureFromClick utilise l\'URL de l\'onglet en dernier recours', () => {
  const capture = captureFromClick({ menuItemId: MENU_IDS.page }, { url: 'https://onglet.com/', title: 'Onglet' });
  assert.equal(capture.url, 'https://onglet.com/');
  assert.equal(capture.title, 'Onglet');
});

test('captureFromClick renvoie null sans rien d\'exploitable', () => {
  assert.equal(captureFromClick({}, {}), null);
  assert.equal(captureFromClick(null, null), null);
  assert.equal(captureFromClick({ pageUrl: 'about:blank' }, {}), null);
});

test('captureFromClick marque la source comme clic contextuel', () => {
  const capture = captureFromClick({ pageUrl: 'https://a.com/' }, {});
  assert.equal(capture.source, 'context-menu');
});

// ---------------------------------------------------------------------------
// captureFromTab
// ---------------------------------------------------------------------------

test('captureFromTab enregistre l\'onglet courant', () => {
  const capture = captureFromTab({ url: 'https://onglet.com/a', title: 'Titre' });
  assert.equal(capture.url, 'https://onglet.com/a');
  assert.equal(capture.title, 'Titre');
  assert.equal(capture.source, 'toolbar');
});

test('captureFromTab refuse une page interne du navigateur', () => {
  assert.equal(captureFromTab({ url: 'chrome://extensions', title: 'x' }), null);
  assert.equal(captureFromTab({ url: 'about:blank', title: 'x' }), null);
  assert.equal(captureFromTab({}), null);
});

// ---------------------------------------------------------------------------
// Le même geste, deux résultats — le cas YouTube
//
// Signalé en usage réel : « depuis l'accueil de YouTube ou d'une chaîne,
// l'ajout au clic droit ne se fait pas tout le temps ; en entrant dans la
// vidéo, il marche toujours ».
//
// Ces tests ne corrigent rien : ils fixent ce que le code fait aujourd'hui,
// pour que la cause soit constatée et non supposée. Chrome remplit
// `info.linkUrl` dès que le clic a lieu **sur un lien**, quel que soit l'item
// de menu choisi — or l'accueil et les pages de chaîne sont des grilles de
// vignettes, donc des liens. Une page de vidéo, elle, se clique dans le vide.
// Deux gestes identiques pour l'utilisateur, deux enregistrements différents.
// ---------------------------------------------------------------------------

/** Ce que Chrome fournit quand le clic tombe sur une vignette de l'accueil. */
const CLIC_SUR_VIGNETTE = {
  menuItemId: MENU_IDS.page,
  pageUrl: 'https://www.youtube.com/',
  linkUrl: 'https://www.youtube.com/watch?v=abc123&list=PL1&index=2',
};

test('sur une grille de vignettes, « ajouter cette page » enregistre la vignette', () => {
  const capture = captureFromClick(CLIC_SUR_VIGNETTE, { title: 'YouTube' });
  // Le titre de la page est écarté au profit du domaine : c'est la règle du
  // module pour un lien, et elle est raisonnable. Ce qui ne l'est pas, c'est
  // que l'utilisateur ait demandé la page.
  assert.equal(capture.url, 'https://www.youtube.com/watch?v=abc123&list=PL1&index=2');
  assert.equal(capture.title, 'youtube.com');
  assert.notEqual(capture.url, 'https://www.youtube.com/');
});

test('sur une page de vidéo, le même item enregistre bien la page et son titre', () => {
  const capture = captureFromClick(
    { menuItemId: MENU_IDS.page, pageUrl: 'https://www.youtube.com/watch?v=abc123' },
    { title: 'Ma vidéo - YouTube' },
  );
  assert.equal(capture.url, 'https://www.youtube.com/watch?v=abc123');
  assert.equal(capture.title, 'Ma vidéo - YouTube');
});

test('les deux gestes ne produisent pas la même entrée', () => {
  const vignette = captureFromClick(CLIC_SUR_VIGNETTE, { title: 'YouTube' });
  const page = captureFromClick(
    { menuItemId: MENU_IDS.page, pageUrl: 'https://www.youtube.com/watch?v=abc123' },
    { title: 'Ma vidéo - YouTube' },
  );
  // Même vidéo, deux entrées : l'une porte le titre, l'autre le domaine, et
  // leurs URL diffèrent par les paramètres de playlist.
  assert.equal(vignette.url === page.url, false);
  assert.equal(vignette.title === page.title, false);
});

test("l'ajout répété depuis l'accueil donne des URL différentes selon le lien visé", () => {
  // Chaque vignette de l'accueil mène à une vidéo différente : ajouter « la
  // page d'accueil » deux fois de suite depuis deux vignettes produit donc deux
  // entrées, sans que rien ne signale que la page d'accueil n'a jamais été
  // enregistrée.
  const une = captureFromClick({ ...CLIC_SUR_VIGNETTE, linkUrl: 'https://www.youtube.com/watch?v=aaa' }, {});
  const deux = captureFromClick({ ...CLIC_SUR_VIGNETTE, linkUrl: 'https://www.youtube.com/watch?v=bbb' }, {});
  assert.notEqual(une.url, deux.url);
});

test("l'accueil de YouTube se normalise sans barre oblique finale", () => {
  // Conséquence : réessayer d'ajouter l'accueil est un doublon, donc silencieux.
  const capture = captureFromClick(
    { menuItemId: MENU_IDS.page, pageUrl: 'https://www.youtube.com/' },
    { title: 'YouTube' },
  );
  assert.equal(capture.url, 'https://www.youtube.com/');
});

// ---------------------------------------------------------------------------
// Le menu réellement installé
//
// `background.js` appelle `buildMenuDefinitions()` **sans argument**. Les tests
// ci-dessus couvrent la fonction, jamais ce point d'appel : une entrée
// désactivée et une entrée absente passaient donc inaperçues.
// ---------------------------------------------------------------------------

test("l'appel de production désactive l'entrée de sélection", () => {
  const menus = buildMenuDefinitions();
  const selection = menus.find((m) => m.id === MENU_IDS.selection);
  assert.equal(selection.enabled, false);
});

test("l'appel de production ne crée ni séparateur ni entrée « ouvrir »", () => {
  const ids = buildMenuDefinitions().map((m) => m.id);
  assert.equal(ids.includes(MENU_IDS.openApp), false);
  assert.equal(ids.includes(MENU_IDS.separator), false);
});

// ---------------------------------------------------------------------------
// describeCapture
// ---------------------------------------------------------------------------

test('describeCapture préfère le titre au domaine', () => {
  assert.equal(describeCapture({ url: 'https://a.com/x', title: 'Un titre' }), 'Un titre');
  assert.equal(describeCapture({ url: 'https://a.com/x', title: '' }), 'a.com');
});

test('describeCapture tronque les libellés longs', () => {
  const result = describeCapture({ url: 'https://a.com/', title: 'x'.repeat(200) }, 20);
  assert.equal(result.length, 20);
  assert.ok(result.endsWith('…'));
});
