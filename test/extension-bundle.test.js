/**
 * Tests d'exécution des fichiers assemblés.
 *
 * L'extension est concaténée en deux fichiers uniques pour contourner un défaut
 * de Safari. Cette transformation pourrait casser l'ordre d'initialisation ou
 * masquer une déclaration : ces tests exécutent donc réellement les fichiers
 * produits, avec des API de navigateur simulées, et vérifient leur comportement.
 *
 * Ce n'est pas un test de navigateur : le rendu et le CSS ne sont pas couverts.
 */

import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { CONSENT_KEY, DISCLOSURE_VERSION } from '../src/core/privacy.js';
// Le texte attendu se demande à la table de traduction, et non écrit en clair :
// sous Node, l'interface s'affiche en anglais, et une chaîne française en dur ne
// dirait rien du message réellement montré.
import { initI18n, t } from '../src/core/i18n.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'extension-safari');

/**
 * Stockage d'un utilisateur ayant accepté la mention.
 *
 * La version vient de `src/core/privacy.js` et n'est pas recopiée : un test qui
 * figerait « 1 » en dur continuerait de passer après une incrémentation, en
 * testant un consentement que le code ne reconnaît plus.
 */
function acceptedConsent() {
  return { [CONSENT_KEY]: { version: DISCLOSURE_VERSION, decision: 'accepted', at: 1 } };
}

/** Compteur d'imports : chaque chargement doit repartir d'un état neuf. */
let loadCount = 0;

/**
 * Charge un fichier assemblé comme module, en repartant d'un cache vierge.
 *
 * Le cache d'`import()` est indexé par URL : sans paramètre distinct, le second
 * chargement renverrait le premier sans réexécuter le fichier.
 *
 * **Le fichier peut manquer pendant un instant.** `test/extension.test.js`
 * relance `scripts/build.mjs` en parallèle des autres fichiers — le lanceur de
 * tests exécute les fichiers en concurrence — et ce script commence par
 * supprimer son dossier de sortie avant de le repeupler. Un chargement qui tombe
 * dans cet intervalle échoue sur un module absent, en accusant le paquet alors
 * que la construction était simplement en cours. Mesuré : une fois sur cinq ou
 * six.
 *
 * On réessaie donc, avec une attente courte et un nombre d'essais borné. Si le
 * fichier ne revient pas, l'échec est réel et le test doit échouer : c'est ce
 * que garantit la borne.
 *
 * @param {string} file
 * @returns {Promise<void>}
 */
async function loadFresh(file) {
  const ESSAIS = 40;
  for (let essai = 1; essai <= ESSAIS; essai++) {
    loadCount += 1;
    try {
      await import(`${pathToFileURL(join(DIST, file)).href}?load=${loadCount}`);
      return;
    } catch (error) {
      const transitoire = error?.code === 'ERR_MODULE_NOT_FOUND'
        || /Cannot find module/.test(error?.message ?? '');
      if (!transitoire || essai === ESSAIS) throw error;
      await settle();
    }
  }
}

/** Laisse s'écouler les chaînes asynchrones en attente.
 *
 * Un délai nul ne suffit pas : un clic déclenche lecture du stockage, écriture,
 * puis rafraîchissement du badge et rendu — plusieurs tours de boucle. Un délai
 * court mais réel évite un test qui échoue selon l'ordonnancement.
 */
/**
 * Laisse tourner la boucle d'événements jusqu'à ce que le démarrage soit fini.
 *
 * C'était **un seul** délai de 5 ms : la suite entière tourne en parallèle, et
 * sous charge la fenêtre n'avait pas fini de démarrer — deux tests sans rapport
 * avec le changement en cours échouaient alors, une fois sur trois. Cinq tours
 * de un milliseconde laissent autant de fois la main aux chaînes de promesses
 * en attente, pour la même durée totale.
 */
const settle = async (turns = 5) => {
  for (let i = 0; i < turns; i += 1) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1));
  }
};

// ---------------------------------------------------------------------------
// Service worker
// ---------------------------------------------------------------------------

/** Trace d'appels enregistrée par les API simulées. */
let trace;

/**
 * Installe des API d'extension simulées sur `globalThis`.
 * @param {object} [options]
 */
function installChrome(options = {}) {
  trace = {
    menusCreated: [],
    badge: [],
    tabsCreated: [],
    stored: options.stored ?? {},
    onClicked: null,
    onInstalled: null,
    onMessage: null,
  };

  globalThis.chrome = {
    runtime: {
      id: 'test-extension',
      getURL: (path) => `chrome-extension://test/${path}`,
      onInstalled: { addListener: (fn) => { trace.onInstalled = fn; } },
      onStartup: { addListener: () => {} },
      onMessage: { addListener: (fn) => { trace.onMessage = fn; } },
      lastError: undefined,
    },
    storage: {
      local: {
        get: async (key) => ({ [key]: trace.stored[key] ?? [] }),
        set: async (patch) => Object.assign(trace.stored, patch),
      },
    },
    contextMenus: {
      create: (definition) => trace.menusCreated.push(definition),
      removeAll: async () => {},
      onClicked: { addListener: (fn) => { trace.onClicked = fn; } },
    },
    action: {
      setBadgeText: async (value) => trace.badge.push(value.text),
      setBadgeBackgroundColor: async () => {},
    },
    tabs: {
      query: async () => [{ url: 'https://exemple.fr/page', title: 'Un titre' }],
      // L'URL est conservée : c'est ainsi qu'on vérifie que la mention s'ouvre
      // là où la collecte a été refusée.
      create: ({ url } = {}) => trace.tabsCreated.push(url),
    },
    scripting: {
      executeScript: async () => [{ result: { url: 'https://exemple.fr/page', title: 'Un titre' } }],
    },
  };

  return trace;
}

test('le service worker assemblé s\'exécute et enregistre ses menus', async () => {
  const state = installChrome();
  await loadFresh('background.js');

  assert.equal(typeof state.onInstalled, 'function', 'le menu doit être préparé à l\'installation');

  state.onInstalled();
  await settle();

  const ids = state.menusCreated.map((menu) => menu.id);
  assert.ok(ids.includes('urq-add-page'), `menus créés : ${ids.join(', ')}`);
  assert.ok(ids.includes('urq-add-link'));
});

test('un clic contextuel enregistre bien le lien', async () => {
  const state = installChrome({ stored: acceptedConsent() });
  await loadFresh('background.js');

  assert.equal(typeof state.onClicked, 'function', 'le clic contextuel doit être branché');

  await state.onClicked({
    menuItemId: 'urq-add-link',
    linkUrl: 'https://cible.fr/article',
    pageUrl: 'https://hote.fr/',
  });
  await settle();

  const stored = state.stored.links ?? [];
  assert.equal(stored.length, 1, 'un lien doit avoir été enregistré');
  assert.equal(stored[0].url, 'https://cible.fr/article');

  // L'icône reçoit un retour immédiat, puis le compteur est rafraîchi.
  // On se contente du retour immédiat : attendre le rafraîchissement
  // rallongerait le test d'une seconde et demie sans rien vérifier de plus.
  assert.ok(
    state.badge.includes('+'),
    `retour attendu sur l'icône, observés : ${JSON.stringify(state.badge)}`,
  );
});

test('un titre changé est adopté, et l\'icône le dit', async () => {
  // Recollecter une page déjà enregistrée était un refus sec. Le cas courant
  // n'est pourtant pas un doublon, c'est une correction : la page a changé de
  // titre. On l'adopte, et l'icône annonce ce qui s'est passé — un ajout, une
  // correction et un doublon ne se ressemblent pas.
  const state = installChrome({ stored: acceptedConsent() });
  await loadFresh('background.js');

  // L'onglet est le second argument : c'est le navigateur qui le fournit, et
  // c'est de lui que vient le titre.
  const onglet = (titre) => ({ url: 'https://exemple.fr/page', title: titre });
  const clic = (titre) => state.onClicked(
    { menuItemId: 'urq-add-page', pageUrl: 'https://exemple.fr/page' },
    onglet(titre),
  );

  await clic('Un titre');
  await settle();
  assert.equal((state.stored.links ?? []).length, 1);
  assert.equal(state.stored.links[0].title, 'Un titre');

  await clic('Un titre corrigé');
  await settle();

  const stored = state.stored.links ?? [];
  assert.equal(stored.length, 1, 'une correction ne crée pas un second lien');
  assert.equal(stored[0].title, 'Un titre corrigé', 'le titre corrigé doit être adopté');
  assert.ok(
    state.badge.includes('✎'),
    `retour attendu sur l'icône, observés : ${JSON.stringify(state.badge)}`,
  );

  // Recollecter la même chose, sans rien changer : c'est un doublon, et l'icône
  // le dit autrement.
  state.badge.length = 0;
  await clic('Un titre corrigé');
  await settle();
  assert.ok(
    state.badge.includes('='),
    `retour attendu sur l'icône, observés : ${JSON.stringify(state.badge)}`,
  );
});

// ---------------------------------------------------------------------------
// Verrou de consentement — service worker
// ---------------------------------------------------------------------------

test('sans consentement, le clic droit n\'enregistre rien et ouvre la mention', async () => {
  // Le clic droit est un chemin de collecte à part entière. Sans ce verrou, la
  // mention serait une formalité que personne n'ouvrirait jamais, puisque rien
  // n'oblige à passer par la fenêtre.
  const state = installChrome();
  await loadFresh('background.js');

  await state.onClicked({
    menuItemId: 'urq-add-link',
    linkUrl: 'https://cible.fr/article',
    pageUrl: 'https://hote.fr/',
  });
  await settle();

  assert.deepEqual(state.stored.links ?? [], [], 'aucun lien ne doit être enregistré');
  assert.ok(
    state.tabsCreated.some((url) => url.endsWith('privacy.html')),
    `la mention doit s'ouvrir, onglets ouverts : ${JSON.stringify(state.tabsCreated)}`,
  );
});

test('un consentement d\'une version antérieure ne vaut plus', async () => {
  // Sans cette règle, un accord donné pour un texte qui dit autre chose
  // continuerait de faire foi après que la mention a changé de nature.
  const state = installChrome({
    stored: { [CONSENT_KEY]: { version: DISCLOSURE_VERSION - 1, decision: 'accepted', at: 1 } },
  });
  await loadFresh('background.js');

  await state.onClicked({
    menuItemId: 'urq-add-link',
    linkUrl: 'https://cible.fr/article',
    pageUrl: 'https://hote.fr/',
  });
  await settle();

  assert.deepEqual(state.stored.links ?? [], []);
  assert.ok(state.tabsCreated.some((url) => url.endsWith('privacy.html')));
});

test('un refus explicite ne collecte rien et ne rouvre pas la mention', async () => {
  // Le refus est une décision, pas une absence : rouvrir un onglet à chaque
  // tentative serait du harcèlement.
  const state = installChrome({
    stored: { [CONSENT_KEY]: { version: DISCLOSURE_VERSION, decision: 'declined', at: 1 } },
  });
  await loadFresh('background.js');

  await state.onClicked({
    menuItemId: 'urq-add-link',
    linkUrl: 'https://cible.fr/article',
    pageUrl: 'https://hote.fr/',
  });
  await settle();

  assert.deepEqual(state.stored.links ?? [], [], 'un refus ne doit rien collecter');
  assert.deepEqual(state.tabsCreated, [], 'la mention ne doit pas se rouvrir');
});

test('un clic sans rien d\'exploitable ne stocke rien', async () => {
  const state = installChrome();
  await loadFresh('background.js');

  await state.onClicked({ menuItemId: 'urq-add-link', pageUrl: 'about:blank' });
  await settle();

  assert.deepEqual(state.stored.links ?? [], []);
});

// ---------------------------------------------------------------------------
// Fenêtre de l'extension
// ---------------------------------------------------------------------------

/** Élément DOM simulé, avec les gestionnaires d'événements. */
function createElement(tagName = 'div') {
  const classes = new Set();
  const listeners = new Map();
  let text = '';

  const node = {
    tagName: String(tagName).toUpperCase(),
    children: [],
    style: {},
    dataset: {},
    attributes: {},
    value: '',
    checked: false,
    hidden: false,
    disabled: false,
    files: null,
    title: '',
    parentNode: null,
    get firstElementChild() { return this.children[0] ?? null; },
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    get textContent() { return text; },
    set textContent(value) {
      text = value == null ? '' : String(value);
      node.children.length = 0;
    },
    appendChild(child) {
      node.children.push(child);
      if (child && typeof child === 'object') child.parentNode = node;
      return child;
    },
    append(...items) { for (const item of items) node.appendChild(item); },
    removeChild(child) {
      const index = node.children.indexOf(child);
      if (index !== -1) node.children.splice(index, 1);
      return child;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener() {},
    setAttribute(name, value) { node.attributes[name] = String(value); },
    getAttribute: (name) => node.attributes[name] ?? null,
    querySelectorAll: () => [],
    // Le vrai DOM sait chercher un descendant : la fenêtre s'en sert pour ne pas
    // poser deux fois l'avertissement de nouvel onglet sur le lien du pied.
    querySelector: () => null,
    click: () => fire(node, 'click'),
    select() {},
  };

  // La table d'écouteurs est exposée pour que le test puisse déclencher un
  // événement. Sans cela, il faudrait la reconstruire ailleurs — et elle
  // resterait vide, ce qui a fait échouer un test alors que le code marchait.
  node.__listeners = listeners;

  return { node, fire: (type) => fire(node, type) };
}

/** Déclenche les gestionnaires d'un type d'événement. */
function fire(node, type) {
  const listeners = node.__listeners?.get(type) ?? [];
  for (const listener of listeners) listener({ preventDefault() {} });
}

/**
 * Installe un DOM simulé.
 *
 * Le registre est conservé : les tests doivent retrouver **les mêmes** nœuds
 * que ceux créés par le script au chargement. En reconstruire un après coup
 * donnerait des éléments vides, et le test validerait un DOM que l'application
 * n'a jamais touché.
 */
function installDom() {
  const registry = new Map();

  /** Crée un nœud. Sa table d'écouteurs est posée par `createElement`. */
  const makeNode = (tag) => createElement(tag).node;

  /** Retourne le nœud d'un identifiant, en le créant au besoin. */
  const nodeFor = (id) => {
    if (!registry.has(id)) registry.set(id, makeNode('div'));
    return registry.get(id);
  };

  globalThis.document = {
    getElementById: nodeFor,
    createElement: makeNode,
    // Les icônes sont construites dans l'espace de noms SVG : `createElement`
    // produirait un élément HTML inerte, sans `viewBox` ni rendu. Le double de
    // test doit donc exposer la même API que le navigateur.
    createElementNS: (_namespace, tag) => makeNode(tag),
    querySelectorAll: () => [],
    addEventListener() {},
    body: makeNode('body'),
  };
  // `close` est utilisé par les deux boutons qui ouvrent un onglet — la mention
  // comme l'application : la fenêtre se ferme après avoir délégué.
  globalThis.window = { addEventListener() {}, removeEventListener() {}, close() {} };

  return {
    element: (id) => registry.get(id),
    /**
     * Déclenche un événement et **attend** ses gestionnaires.
     *
     * Les gestionnaires de l'application sont asynchrones : ne pas les attendre
     * rendrait le test dépendant de l'ordonnancement, ce qui l'a fait échouer
     * alors que le code était correct.
     */
    fire: async (id, type) => {
      const node = registry.get(id);
      if (!node) return;
      for (const listener of node.__listeners?.get(type) ?? []) {
        await listener({ preventDefault() {} });
      }
    },
  };
}

/** Accès au DOM installé pour le test courant. */
let dom;

beforeEach(() => {
  dom = installDom();
});

test('la fenêtre assemblée s\'affiche et propose l\'onglet courant', async () => {
  installChrome();
  await loadFresh('popup.js');
  await settle();
  await settle();

  const currentTab = dom.element('current-tab');

  assert.ok(currentTab, 'l\'onglet courant doit être renseigné');
  assert.equal(
    currentTab.textContent,
    'Un titre',
    'le titre de l\'onglet doit s\'afficher, pas « Chargement… »',
  );
  assert.equal(dom.element('add-current').disabled, false);
  assert.equal(dom.element('count').textContent, '0');
});

test('l\'ajout de l\'onglet courant écrit dans le stockage', async () => {
  const state = installChrome({ stored: acceptedConsent() });
  await loadFresh('popup.js');
  await settle();
  await settle();

  await dom.fire('add-current', 'click');
  await settle();

  const stored = state.stored.links ?? [];
  assert.equal(stored.length, 1, 'le lien doit être enregistré');
  assert.equal(stored[0].url, 'https://exemple.fr/page');
  assert.equal(dom.element('count').textContent, '1', 'le compteur doit suivre');
});

test('un titre corrigé dans la fenêtre met le lien à jour', async () => {
  // C'est le geste signalé : on ajoute une page déjà là, après avoir changé son
  // titre dans la fenêtre. Répondre « déjà enregistré » obligeait à supprimer le
  // lien pour le rajouter.
  //
  // La langue est **fixée** : le message est traduit, et sous Node elle dépend
  // de celle du système. Un test qui lit le texte affiché doit savoir dans
  // quelle langue il le lit.
  const langue = globalThis.navigator?.language;
  Object.defineProperty(globalThis, 'navigator', {
    value: { language: 'fr-FR', languages: ['fr-FR'] }, configurable: true,
  });
  try {
    const state = installChrome({ stored: acceptedConsent() });
    await loadFresh('popup.js');
    await settle();
    await settle();

    await dom.fire('add-current', 'click');
    await settle();
    assert.equal((state.stored.links ?? []).length, 1);

    dom.element('link-title').value = 'Le titre que je préfère';
    await dom.fire('add-current', 'click');
    await settle();

    const stored = state.stored.links ?? [];
    assert.equal(stored.length, 1, 'corriger un titre ne crée pas un second lien');
    assert.equal(stored[0].title, 'Le titre que je préfère');
    assert.equal(
      dom.element('toast').textContent,
      t('Lien mis à jour'),
      'le message doit dire ce qui s\'est passé, et non « Déjà enregistré »',
    );
  } finally {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: langue ?? 'en-US', languages: [langue ?? 'en-US'] },
      configurable: true,
    });
  }
});

test('sans consentement, la fenêtre n\'enregistre rien et ouvre la mention', async () => {
  // Second chemin de collecte. Les deux doivent être verrouillés : en oublier
  // un suffirait à contourner la mention.
  const state = installChrome();
  await loadFresh('popup.js');
  await settle();
  await settle();

  await dom.fire('add-current', 'click');
  await settle();

  assert.deepEqual(state.stored.links ?? [], [], 'aucun lien ne doit être enregistré');
  assert.ok(
    state.tabsCreated.some((url) => url.endsWith('privacy.html')),
    `la mention doit s'ouvrir, onglets ouverts : ${JSON.stringify(state.tabsCreated)}`,
  );
});

test('l\'encart de confidentialité est visible tant que rien n\'est accepté', async () => {
  // Le verrou doit être **expliqué** : sans cet encart, « Ajouter cette page »
  // ouvrirait un onglet sans raison apparente.
  installChrome();
  await loadFresh('popup.js');
  await settle();
  await settle();

  assert.equal(dom.element('consent-notice').hidden, false);
});

test('l\'encart disparaît une fois la mention acceptée', async () => {
  installChrome({ stored: acceptedConsent() });
  await loadFresh('popup.js');
  await settle();
  await settle();

  assert.equal(dom.element('consent-notice').hidden, true);
});

test('la fenêtre affiche une erreur plutôt que de rester muette', async () => {
  // On casse volontairement l'API : la fenêtre doit le dire, pas rester sur
  // « Chargement… » comme le faisait la version fautive.
  installChrome();
  globalThis.chrome.tabs.query = async () => {
    throw new Error('onglet inaccessible');
  };

  await loadFresh('popup.js');
  await settle();
  await settle();

  const currentTab = dom.element('current-tab');
  assert.ok(currentTab, 'la fenêtre doit avoir affiché quelque chose');
  assert.notEqual(
    currentTab.textContent,
    'Chargement…',
    'la fenêtre ne doit jamais rester figée sur « Chargement… »',
  );
});
