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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'extension-safari');

/** Compteur d'imports : chaque chargement doit repartir d'un état neuf. */
let loadCount = 0;

/**
 * Charge un fichier assemblé comme module, en repartant d'un cache vierge.
 *
 * Le cache d'`import()` est indexé par URL : sans paramètre distinct, le second
 * chargement renverrait le premier sans réexécuter le fichier.
 *
 * @param {string} file
 * @returns {Promise<void>}
 */
async function loadFresh(file) {
  loadCount += 1;
  await import(`${pathToFileURL(join(DIST, file)).href}?load=${loadCount}`);
}

/** Laisse s'écouler les chaînes asynchrones en attente.
 *
 * Un délai nul ne suffit pas : un clic déclenche lecture du stockage, écriture,
 * puis rafraîchissement du badge et rendu — plusieurs tours de boucle. Un délai
 * court mais réel évite un test qui échoue selon l'ordonnancement.
 */
const settle = () => new Promise((resolvePromise) => setTimeout(resolvePromise, 5));

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
      create: () => {},
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
  const state = installChrome();
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
  globalThis.window = { addEventListener() {}, removeEventListener() {} };

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
  const state = installChrome();
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
