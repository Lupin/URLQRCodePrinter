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
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { CONSENT_KEY, DISCLOSURE_VERSION } from '../src/core/privacy.js';
import {
  ACTIVE_COLLECTION_KEY,
  COLLECTIONS_KEY,
  DEFAULT_COLLECTION_ID,
  PRIVATE_COLLECTION_ID,
  PRIVATE_LINKS_KEY,
} from '../src/core/collections.js';
import { DEFAULT_SETTINGS } from '../src/core/settings.js';
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
      // **Deux formes de course, pas une.** Le fichier peut manquer — le
      // constructeur a supprimé le dossier et ne l'a pas encore repeuplé —, ou
      // exister à moitié : la concaténation s'écrit en une fois, et une lecture
      // qui tombe au milieu rend un fichier tronqué, donc une erreur de
      // syntaxe. Cette seconde forme a été observée (« Unexpected end of
      // input ») une fois sur plusieurs dizaines d'exécutions, sur ce même
      // fichier. Les deux sont transitoires ; la borne garde l'échec réel
      // possible, et `test/extension.test.js` vérifie par ailleurs que chaque
      // fichier livré est syntaxiquement valide.
      const transitoire = error?.code === 'ERR_MODULE_NOT_FOUND'
        || error instanceof SyntaxError
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

/**
 * Attend qu'une condition soit vraie, plutôt qu'un nombre de tours.
 *
 * `settle` dit « laissons tourner la boucle » ; il ne dit pas « le démarrage est
 * fini », et deux tests échouaient encore une fois sur quatre sous charge. Ce qui
 * est attendu ici est un **état**, et c'est lui qu'on attend.
 *
 * @param {() => boolean} check
 * @param {{ timeout?: number, interval?: number }} [options]
 * @returns {Promise<boolean>}
 */
async function waitFor(check, { timeout = 3000, interval = 10 } = {}) {
  const fin = Date.now() + timeout;
  for (;;) {
    if (check()) return true;
    if (Date.now() > fin) return false;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, interval));
  }
}

// ---------------------------------------------------------------------------
// Service worker
// ---------------------------------------------------------------------------

/**
 * Installe des API d'extension simulées sur `globalThis`.
 *
 * @param {object} [options]
 * @returns {object} La trace des appels enregistrés par les API simulées.
 */
function installChrome(options = {}) {
  // **Locale à cet appel, et non partagée entre les scénarios.** La suite charge
  // plusieurs service workers, un par scénario, et ceux des scénarios précédents
  // continuent de vivre dans le même processus avec leurs délais en attente. Une
  // trace commune faisait écrire le retour transitoire retardé d'un service
  // worker dans la trace du scénario en cours : un test lisait alors le badge
  // posé par un autre, et passait même l'écoute du stockage désactivée.
  const trace = {
    menusCreated: [],
    badge: [],
    tabsCreated: [],
    stored: options.stored ?? {},
    // Zone de session : c'est là que vivent les liens de la collection de
    // navigation privée. Un objet distinct, comme dans le navigateur — un test
    // qui les verrait dans `local` signalerait exactement la fuite à éviter.
    session: options.session ?? {},
    onClicked: null,
    onInstalled: null,
    onMessage: null,
    // Écouteurs de `storage.onChanged`, et non un seul : le service worker en
    // branche un pour le menu contextuel et un pour le compteur de l'icône.
    onChanged: [],
    // Compteur d'appels réseau. Aucun chemin de collecte ne doit en déclencher :
    // le raccourcissement reste une action explicite de l'utilisateur, et les
    // scénarios ci-dessous ne le demandent jamais.
    fetchCalls: 0,
  };

  // Toute requête sortante est comptée **et** refusée : le test ne doit pas
  // dépendre d'un tiers, et un appel oublié se voit immédiatement.
  globalThis.fetch = async () => {
    trace.fetchCalls += 1;
    throw new Error('réseau interdit pendant les tests');
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
      // Les écritures des **autres** pages — la fenêtre, l'application — ne sont
      // pas simulées par `set` : c'est le test qui décide quand elles ont lieu,
      // en appelant les écouteurs relevés ici (voir `ecrireAilleurs`).
      onChanged: { addListener: (fn) => trace.onChanged.push(fn) },
      local: {
        get: async (key) => ({ [key]: trace.stored[key] ?? [] }),
        set: async (patch) => Object.assign(trace.stored, patch),
      },
      // `chrome.storage.session` : présente depuis Chrome 102 et Safari 16.4.
      // Les scénarios qui éprouvent son absence la retirent après coup.
      session: {
        get: async (key) => ({ [key]: trace.session[key] ?? [] }),
        set: async (patch) => Object.assign(trace.session, patch),
      },
    },
    extension: {
      inIncognitoContext: Boolean(options.incognito),
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
      // `incognito` est ce que lit la fenêtre pour savoir si elle sert une
      // fenêtre privée : c'est la source disponible depuis Safari 14.
      query: async () => [{
        url: 'https://exemple.fr/page',
        title: 'Un titre',
        incognito: Boolean(options.incognito),
      }],
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
    // Le focus est une vraie action de la fenêtre — reprise après suppression,
    // et ouverture du champ de collection. Le double de test l'accepte sans le
    // simuler : ce qui compte est que le code puisse l'appeler.
    focus() {},
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
  // On attend l'**état**, et non un délai : sous charge, un nombre fixe de tours
  // laissait le démarrage inachevé, et le test échouait sans que rien ne soit
  // cassé.
  await waitFor(() => dom.element('consent-notice')?.hidden === true);

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
  // Même règle : c'est l'état qu'on attend, pas un délai.
  await waitFor(() => {
    const texte = dom.element('current-tab')?.textContent ?? '';
    return texte !== '' && texte !== 'Chargement…';
  });

  const currentTab = dom.element('current-tab');
  assert.ok(currentTab, 'la fenêtre doit avoir affiché quelque chose');
  assert.notEqual(
    currentTab.textContent,
    'Chargement…',
    'la fenêtre ne doit jamais rester figée sur « Chargement… »',
  );
});

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

/** Un document de collections, tel que l'écrit le cœur. */
function collectionsDocument(items) {
  return {
    version: 1,
    migratedAt: 1,
    items: items.map((item, rang) => ({
      id: item.id,
      name: item.name ?? '',
      note: item.note ?? '',
      createdAt: item.createdAt ?? rang + 1,
    })),
  };
}

/** Un lien minimal, rangé dans une collection. */
function storedLink(id, url, collectionId, createdAt = 1) {
  return {
    id,
    url,
    title: '',
    note: '',
    tags: [],
    createdAt,
    updatedAt: createdAt,
    source: 'manual',
    favicon: '',
    shortUrl: '',
    shortProvider: '',
    shortenedAt: 0,
    collectionId,
  };
}

test('la fenêtre affiche la collection courante, et les flèches en changent', async () => {
  // Deux collections : « Veille » (courante) et « Projet ». Le nom affiché est
  // celui de la collection, pas un libellé générique — c'est lui qui dit ce que
  // la liste contient.
  const state = installChrome({
    stored: {
      ...acceptedConsent(),
      locale: 'fr',
      [COLLECTIONS_KEY]: collectionsDocument([
        { id: DEFAULT_COLLECTION_ID, name: '' },
        { id: 'veille', name: 'Veille' },
        { id: 'projet', name: 'Projet', createdAt: 5 },
      ]),
      [ACTIVE_COLLECTION_KEY]: { normal: 'veille', private: '' },
      links: [
        storedLink('a', 'https://veille.fr/', 'veille'),
        storedLink('b', 'https://projet.fr/', 'projet'),
      ],
    },
  });

  await loadFresh('popup.js');
  await settle();
  await settle();

  assert.equal(dom.element('collection-title').textContent, 'Veille');
  assert.equal(dom.element('count').textContent, '1', 'le compteur suit la collection affichée');
  assert.equal(dom.element('collection-prev').disabled, false);
  assert.equal(dom.element('collection-next').disabled, false);

  // La flèche suivante passe à « Projet », et la liste suit.
  await dom.fire('collection-next', 'click');
  await settle();
  await settle();

  assert.equal(dom.element('collection-title').textContent, 'Projet');
  assert.equal(dom.element('count').textContent, '1');
  assert.equal(state.stored[ACTIVE_COLLECTION_KEY].normal, 'projet', 'le choix est mémorisé');
  const lignes = dom.element('list').children.map((item) => item.dataset.id);
  assert.deepEqual(lignes, ['b'], 'la liste affiche les liens de la collection courante');

  // Le parcours boucle : depuis « Projet », la flèche précédente revient à
  // « Veille », l'utilisateur n'a pas à connaître le sens de rotation.
  await dom.fire('collection-prev', 'click');
  await settle();
  await settle();
  assert.equal(dom.element('collection-title').textContent, 'Veille');

  assert.equal(state.fetchCalls, 0, 'aucun appel réseau');
});

test('la fenêtre ne crée pas de collection, et n\'en offre pas le moyen', async () => {
  // Créer une collection demande un nom, une note, et la place de les relire :
  // c'est le travail de l'application. La fenêtre collecte et parcourt, elle ne
  // range pas — un champ de saisie et deux boutons de plus dans 380 px
  // occupaient la place du seul titre qui informe.
  const html = readFileSync(join(ROOT, 'src', 'extension-src', 'popup.html'), 'utf8');
  const script = readFileSync(join(ROOT, 'src', 'extension-src', 'popup.js'), 'utf8');

  assert.doesNotMatch(html, /collection-add|collection-new/, 'une commande de création subsiste');
  assert.doesNotMatch(script, /collections\.create\(/, 'la fenêtre crée encore une collection');

  // L'en-tête porte l'icône et le nom de la collection, pas celui du produit.
  assert.match(html, /class="app-header__logo"[^>]*icons\/icon-32\.png/, "l'icône manque à l'en-tête");
  assert.doesNotMatch(html, /app-header__title|URLQRCodePrinter<\/h1>/, 'le nom du produit est écrit dans la fenêtre');
  assert.match(html, /id="collection-title"/, 'le nom de la collection doit rester le titre');
});

test('une seule collection : les flèches sont présentes mais inactives', async () => {
  installChrome({ stored: { ...acceptedConsent(), locale: 'fr' } });
  await loadFresh('popup.js');
  await settle();
  await settle();

  assert.equal(dom.element('collection-title').textContent, t(DEFAULT_SETTINGS.collectionName));
  assert.equal(dom.element('collection-prev').disabled, true);
  assert.equal(dom.element('collection-next').disabled, true);
});

test('la fenêtre suit un stockage écrit ailleurs', async () => {
  // La fenêtre peut rester ouverte : l'entrée « Ouvrir URLQRCodePrinter » du menu
  // contextuel ouvre **cette page** dans un onglet. Vider la collection depuis
  // une autre page la laissait alors afficher des liens qui n'existaient plus.
  const state = installChrome({
    stored: {
      ...acceptedConsent(),
      locale: 'fr',
      [ACTIVE_COLLECTION_KEY]: { normal: DEFAULT_COLLECTION_ID, private: '' },
      links: [
        storedLink('a', 'https://un.fr/', DEFAULT_COLLECTION_ID),
        storedLink('b', 'https://deux.fr/', DEFAULT_COLLECTION_ID),
      ],
    },
  });
  await loadFresh('popup.js');
  // L'état attendu, et non un nombre de tours : sous charge, le démarrage de la
  // fenêtre peut n'être pas terminé — observé une fois sur plusieurs dizaines
  // d'exécutions, cette fenêtre-là n'avait pas encore peint son compteur.
  assert.ok(
    await waitFor(() => dom.element('count')?.textContent === '2'),
    `les deux liens doivent être affichés, observé « ${dom.element('count')?.textContent} »`,
  );

  // Ce qu'une autre page fait : elle écrit le document, et l'événement part.
  state.stored.links = [];
  ecrireAilleurs(state, { links: { newValue: [] } });
  assert.ok(
    await waitFor(() => dom.element('count').textContent === '0'),
    `compteur attendu à zéro, observé : ${dom.element('count').textContent}`,
  );

  assert.equal(dom.element('list').children.length, 0, 'la liste suit');
  assert.equal(dom.element('clear').disabled, true, 'le bouton n\'a plus rien à vider');
  assert.equal(state.fetchCalls, 0, 'aucun appel réseau');
});

test('vider la collection ne vide que celle qui est affichée', async () => {
  const state = installChrome({
    stored: {
      ...acceptedConsent(),
      locale: 'fr',
      [COLLECTIONS_KEY]: collectionsDocument([
        { id: DEFAULT_COLLECTION_ID, name: '' },
        { id: 'veille', name: 'Veille' },
      ]),
      [ACTIVE_COLLECTION_KEY]: { normal: 'veille', private: '' },
      links: [
        storedLink('a', 'https://veille.fr/', 'veille'),
        storedLink('b', 'https://defaut.fr/', DEFAULT_COLLECTION_ID),
      ],
    },
  });

  await loadFresh('popup.js');
  await settle();
  await settle();

  await dom.fire('clear', 'click');
  await settle();
  await settle();

  const restants = (state.stored.links ?? []).map((link) => link.id);
  assert.deepEqual(restants, ['b'], 'la collection par défaut est intacte');
  assert.equal(dom.element('count').textContent, '0');
});

test('hors contexte privé, la collection privée n\'existe pas', async () => {
  // Elle n'est ni listée, ni atteignable par les flèches : c'est la règle qui
  // fait qu'une collection privée ne se montre pas en navigation ordinaire.
  const state = installChrome({
    stored: {
      ...acceptedConsent(),
      locale: 'fr',
      [COLLECTIONS_KEY]: collectionsDocument([
        { id: DEFAULT_COLLECTION_ID, name: '' },
        { id: 'veille', name: 'Veille' },
      ]),
      [ACTIVE_COLLECTION_KEY]: { normal: 'veille', private: PRIVATE_COLLECTION_ID },
      links: [storedLink('v', 'https://veille.fr/', 'veille')],
    },
    session: { [PRIVATE_LINKS_KEY]: [storedLink('p', 'https://prive.fr/', PRIVATE_COLLECTION_ID)] },
  });

  await loadFresh('popup.js');
  await settle();
  await settle();

  assert.equal(dom.element('collection-title').textContent, 'Veille');
  assert.equal(dom.element('private-notice').hidden, true, 'aucun avis privé hors fenêtre privée');

  // Deux tours de flèches ne font jamais apparaître la collection privée.
  for (const bouton of ['collection-next', 'collection-next', 'collection-prev', 'collection-prev']) {
    await dom.fire(bouton, 'click');
    await settle();
    await settle();
    assert.notEqual(dom.element('collection-title').textContent, t('Navigation privée'));
  }
  assert.equal(dom.element('count').textContent, '1', 'le lien privé n\'est jamais compté ici');
});

test('en fenêtre privée, la collection privée est affichée et expliquée', async () => {
  const state = installChrome({
    incognito: true,
    stored: {
      ...acceptedConsent(),
      locale: 'fr',
      [COLLECTIONS_KEY]: collectionsDocument([{ id: DEFAULT_COLLECTION_ID, name: '' }]),
      links: [storedLink('a', 'https://public.fr/', DEFAULT_COLLECTION_ID)],
    },
    session: { [PRIVATE_LINKS_KEY]: [storedLink('p', 'https://prive.fr/', PRIVATE_COLLECTION_ID)] },
  });

  await loadFresh('popup.js');
  await settle();
  await settle();

  // Sans choix mémorisé, une fenêtre privée ouvre la collection privée : c'est
  // la raison d'être de la navigation privée.
  assert.equal(dom.element('collection-title').textContent, t('Navigation privée'));
  assert.equal(dom.element('count').textContent, '1', 'le lien privé est là');
  assert.equal(dom.element('private-notice').hidden, false, 'l\'avis doit expliquer la disparition');
  assert.match(dom.element('private-notice').textContent, /fermeture du navigateur/);
  assert.equal(state.fetchCalls, 0, 'aucun appel réseau');
});

test('sans stockage de session, la collection privée n\'est pas proposée', async () => {
  // Chrome antérieur à 102, Safari antérieur à 16.4 : plutôt que d'écrire des
  // URL privées sur le disque, la collection privée disparaît.
  const state = installChrome({
    incognito: true,
    stored: {
      ...acceptedConsent(),
      locale: 'fr',
      [COLLECTIONS_KEY]: collectionsDocument([{ id: DEFAULT_COLLECTION_ID, name: '' }]),
      links: [storedLink('a', 'https://public.fr/', DEFAULT_COLLECTION_ID)],
    },
  });
  // La zone existe dans le faux `chrome` : on la retire pour éprouver son
  // absence, comme sur un navigateur qui ne l'a pas.
  delete globalThis.chrome.storage.session;

  await loadFresh('popup.js');
  await settle();
  await settle();

  assert.equal(dom.element('collection-title').textContent, t(DEFAULT_SETTINGS.collectionName));
  assert.equal(dom.element('count').textContent, '1');
  // L'avis reste : la fenêtre est privée, et les liens vont sur l'appareil.
  assert.equal(dom.element('private-notice').hidden, false);
  assert.match(dom.element('private-notice').textContent, /conservée sur votre appareil/);
});

test('un clic droit depuis une fenêtre privée écrit dans la session, pas sur le disque', async () => {
  const state = installChrome({ stored: acceptedConsent() });
  await loadFresh('background.js');

  await state.onClicked(
    { menuItemId: 'urq-add-link', linkUrl: 'https://prive.fr/article', pageUrl: 'https://prive.fr/' },
    { incognito: true, url: 'https://prive.fr/', title: 'Privé' },
  );
  await settle();

  assert.deepEqual(state.stored.links ?? [], [], 'rien ne doit être écrit sur le disque');
  const enSession = state.session[PRIVATE_LINKS_KEY] ?? [];
  assert.equal(enSession.length, 1, 'le lien privé vit en mémoire de session');
  assert.equal(enSession[0].url, 'https://prive.fr/article');
  assert.equal(enSession[0].collectionId, PRIVATE_COLLECTION_ID);
  assert.equal(state.fetchCalls, 0, 'aucun appel réseau');
});

test('un clic droit ordinaire écrit dans la collection courante', async () => {
  const state = installChrome({
    stored: {
      ...acceptedConsent(),
      locale: 'fr',
      [COLLECTIONS_KEY]: collectionsDocument([
        { id: DEFAULT_COLLECTION_ID, name: '' },
        { id: 'veille', name: 'Veille' },
      ]),
      [ACTIVE_COLLECTION_KEY]: { normal: 'veille', private: '' },
    },
  });
  await loadFresh('background.js');

  await state.onClicked(
    { menuItemId: 'urq-add-link', linkUrl: 'https://cible.fr/article', pageUrl: 'https://hote.fr/' },
    { incognito: false, url: 'https://hote.fr/', title: 'Hôte' },
  );
  await settle();

  const links = state.stored.links ?? [];
  assert.equal(links.length, 1);
  assert.equal(links[0].collectionId, 'veille', 'la collection courante est respectée');
  assert.deepEqual(state.session[PRIVATE_LINKS_KEY] ?? [], []);
});

test('le badge compte la collection courante', async () => {
  const state = installChrome({
    stored: {
      ...acceptedConsent(),
      locale: 'fr',
      [COLLECTIONS_KEY]: collectionsDocument([
        { id: DEFAULT_COLLECTION_ID, name: '' },
        { id: 'veille', name: 'Veille' },
      ]),
      [ACTIVE_COLLECTION_KEY]: { normal: 'veille', private: '' },
      links: [
        storedLink('a', 'https://veille.fr/', 'veille'),
        storedLink('b', 'https://veille2.fr/', 'veille'),
        storedLink('c', 'https://defaut.fr/', DEFAULT_COLLECTION_ID),
      ],
    },
  });

  await loadFresh('background.js');

  assert.equal(typeof state.onMessage, 'function');
  await new Promise((resolve) => {
    state.onMessage({ type: 'refresh-badge', isPrivate: false }, null, resolve);
  });
  await settle();

  // Deux liens dans la collection courante, un dans l'autre : le badge annonce
  // ce qui est affiché, pas la base entière.
  assert.equal(state.badge.at(-1), '2');
  assert.equal(state.fetchCalls, 0, 'aucun appel réseau');
});

// ---------------------------------------------------------------------------
// Le compteur suit le stockage
// ---------------------------------------------------------------------------

/**
 * Une écriture venue d'une autre page de l'extension.
 *
 * L'application et la fenêtre écrivent dans les mêmes documents que le service
 * worker, sans jamais lui parler : c'est `storage.onChanged` qui les lui fait
 * connaître. Le substitut ne déclenche rien de lui-même — un test qui éprouve
 * une écriture extérieure doit dire **quand** elle a lieu.
 *
 * @param {object} state
 * @param {object} changes
 * @param {string} [area]
 */
function ecrireAilleurs(state, changes, area = 'local') {
  for (const listener of state.onChanged) listener(changes, area);
}

test("l'icône suit un stockage écrit ailleurs", async () => {
  // Le défaut rapporté : « Vider la collection » depuis l'application laissait
  // sur l'icône le nombre d'avant. L'application ne parle pas au service worker,
  // et rien ne rafraîchissait le badge — un « 3 » survivait à une collection
  // vide, jusqu'au prochain événement venu d'ailleurs.
  const state = installChrome({ stored: { ...acceptedConsent() } });
  await loadFresh('background.js');
  await settle();
  state.badge.length = 0;

  // Trois liens arrivés par l'application : le compteur les annonce.
  state.stored.links = [
    storedLink('a', 'https://un.fr/', DEFAULT_COLLECTION_ID),
    storedLink('b', 'https://deux.fr/', DEFAULT_COLLECTION_ID),
    storedLink('c', 'https://trois.fr/', DEFAULT_COLLECTION_ID),
  ];
  ecrireAilleurs(state, { links: { newValue: state.stored.links } });
  assert.ok(
    await waitFor(() => state.badge.at(-1) === '3'),
    `compteur attendu, observés : ${JSON.stringify(state.badge)}`,
  );

  // Puis la collection est vidée, toujours depuis l'application : l'icône ne
  // doit plus rien annoncer du tout.
  state.stored.links = [];
  ecrireAilleurs(state, { links: { newValue: [] } });
  assert.ok(
    await waitFor(() => state.badge.at(-1) === ''),
    `badge vide attendu, observés : ${JSON.stringify(state.badge)}`,
  );
  assert.equal(state.fetchCalls, 0, 'aucun appel réseau');
});

test("un retour transitoire n'est pas effacé par sa propre écriture", async () => {
  // Le signe d'un clic droit (« + ») est posé **après** l'écriture du lien. Dans
  // le navigateur, cette écriture déclenche l'écouteur du stockage : sans
  // échéance, le compteur remplacerait le signe dans le même souffle, et le clic
  // droit n'aurait plus aucun retour visible.
  const state = installChrome({ stored: acceptedConsent() });
  await loadFresh('background.js');

  await state.onClicked({
    menuItemId: 'urq-add-link',
    linkUrl: 'https://cible.fr/article',
    pageUrl: 'https://hote.fr/',
  });
  await settle();
  assert.equal(state.badge.at(-1), '+', `signe attendu, observés : ${JSON.stringify(state.badge)}`);

  ecrireAilleurs(state, { links: { newValue: state.stored.links } });
  await settle();
  assert.equal(
    state.badge.at(-1),
    '+',
    `le signe doit rester jusqu'à son échéance, observés : ${JSON.stringify(state.badge)}`,
  );
});
