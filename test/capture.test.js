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
