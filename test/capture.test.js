/**
 * Tests de la capture depuis le navigateur.
 * Aucune API d'extension n'est requise : on ne teste que la décision.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createLink } from '../src/core/link.js';
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

test('un résultat de recherche est titré par sa destination, pas par le moteur', () => {
  // Le cas rapporté : clic droit sur un résultat Google, l'adresse du lien est
  // une enveloppe du moteur. Titrer « google.com » un lien qui mène à Wikipédia
  // ne dit rien de ce qu'on vient d'enregistrer — et la liste ne contient alors
  // aucune ligne qui ressemble à ce qu'on a cliqué.
  const capture = captureFromClick(
    {
      menuItemId: MENU_IDS.link,
      linkUrl: 'https://www.google.com/url?q=https://fr.wikipedia.org/wiki/Code_QR&sa=U&ved=2ahUKEwi',
      pageUrl: 'https://www.google.com/search?q=wikipedia+qrcode',
    },
    { url: 'https://www.google.com/search?q=wikipedia+qrcode', title: 'wikipedia qrcode - Recherche Google' },
  );
  assert.equal(capture.title, 'fr.wikipedia.org');
  // L'adresse est conservée telle que le navigateur la donne : c'est
  // `createLink` qui la déplie, au même endroit que le reste de la
  // normalisation, et une seule fois pour tous les chemins d'entrée.
  assert.match(capture.url, /^https:\/\/www\.google\.com\/url\?q=/);
  assert.equal(createLink({ url: capture.url }).url, 'https://fr.wikipedia.org/wiki/Code_QR');
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
// La cause est dans la façon dont Chrome remplit `info` : `linkUrl` est
// renseigné **dès que le clic tombe sur un lien, quel que soit l'item ensuite
// choisi**. L'accueil et les pages de chaîne sont des grilles de vignettes,
// donc des liens ; une page de vidéo se clique dans le vide. L'ancienne version
// donnait la priorité au lien visé, si bien que « Ajouter cette page »
// enregistrait la vidéo et jamais la page — d'où l'impression que l'ajout
// n'avait pas eu lieu.
//
// Ces tests fixent la règle qui remplace l'heuristique : **l'item choisi
// commande**.
// ---------------------------------------------------------------------------

/** Ce que Chrome fournit quand le clic tombe sur une vignette de l'accueil. */
const CLIC_SUR_VIGNETTE = {
  menuItemId: MENU_IDS.page,
  pageUrl: 'https://www.youtube.com/',
  linkUrl: 'https://www.youtube.com/watch?v=abc123&list=PL1&index=2',
};

test('« Ajouter cette page » enregistre la page, même cliqué sur une vignette', () => {
  const capture = captureFromClick(CLIC_SUR_VIGNETTE, { title: 'YouTube' });
  assert.equal(capture.url, 'https://www.youtube.com/');
  assert.equal(capture.title, 'YouTube');
});

test('« Ajouter ce lien » enregistre bien la vignette visée', () => {
  const capture = captureFromClick({ ...CLIC_SUR_VIGNETTE, menuItemId: MENU_IDS.link }, {
    title: 'YouTube',
  });
  assert.equal(capture.url, 'https://www.youtube.com/watch?v=abc123&list=PL1&index=2');
  assert.equal(capture.title, 'youtube.com');
});

test('les deux items donnent deux entrées distinctes, et non la même', () => {
  const page = captureFromClick(CLIC_SUR_VIGNETTE, { title: 'YouTube' });
  const lien = captureFromClick({ ...CLIC_SUR_VIGNETTE, menuItemId: MENU_IDS.link }, {
    title: 'YouTube',
  });
  assert.notEqual(page.url, lien.url);
  assert.equal(page.title, 'YouTube');
  assert.equal(lien.title, 'youtube.com');
});

test('« Ajouter cette page » refuse une page interne du navigateur', () => {
  // La page n'est pas enregistrable : mieux vaut ne rien faire que d'enregistrer
  // la vidéo visée à sa place, ce que faisait la version précédente.
  assert.equal(captureFromClick({
    menuItemId: MENU_IDS.page,
    pageUrl: 'chrome://extensions',
    linkUrl: 'https://exemple.fr/une-video',
  }, { title: 'Extensions' }), null);
});

test("« Ajouter ce lien » retombe sur la page si le lien est inexploitable", () => {
  const capture = captureFromClick({
    menuItemId: MENU_IDS.link,
    pageUrl: 'https://exemple.fr/page',
    linkUrl: 'javascript:void(0)',
  }, { title: 'Une page' });
  assert.equal(capture.url, 'https://exemple.fr/page');
  assert.equal(capture.title, 'Une page');
});

test("un item inconnu garde l'heuristique du plus précis au plus général", () => {
  // Safari, ou un item ajouté plus tard : le lien visé reste prioritaire.
  const capture = captureFromClick({
    menuItemId: 'un-item-inconnu',
    pageUrl: 'https://exemple.fr/page',
    linkUrl: 'https://exemple.fr/cible',
  }, { title: 'Une page' });
  assert.equal(capture.url, 'https://exemple.fr/cible');
});

test("l'accueil de YouTube se normalise sans barre oblique finale", () => {
  // Deux ajouts successifs de l'accueil sont donc un doublon, et l'accueil ne
  // s'enregistre qu'une fois.
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
  // La fiche publiée sur le Chrome Web Store décrit trois entrées d'ajout, et
  // ne mentionne ni séparateur ni « Ouvrir URLQRCodePrinter ». En créer une de
  // plus rouvrirait l'écart entre la fiche et le comportement, dans l'autre
  // sens : on s'en tient donc aux trois entrées annoncées.
  const ids = buildMenuDefinitions().map((m) => m.id);
  assert.equal(ids.includes(MENU_IDS.openApp), false);
  assert.equal(ids.includes(MENU_IDS.separator), false);
});

test("l'installation active l'entrée de sélection", () => {
  // `installMenus` l'appelait sans argument, si bien que l'entrée naissait
  // `enabled: false` : l'utilisateur voyait une ligne grisée, alors que la
  // justification de permission publiée annonce une entrée « Add the selected
  // text » parfaitement fonctionnelle.
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const worker = readFileSync(join(ROOT, 'src', 'extension-src', 'background.js'), 'utf8');
  assert.match(worker, /buildMenuDefinitions\(\{ includeSelection: true \}\)/);
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
