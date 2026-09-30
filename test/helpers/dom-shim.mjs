/**
 * DOM minimal partagé par les tests qui exécutent réellement `app.js`.
 *
 * Chrome sans interface ne démarre pas dans cet environnement, ce qui
 * interdirait toute vérification dynamique. On exécute donc l'application
 * construite sous Node avec ce DOM de substitution : le chemin de démarrage
 * complet est parcouru pour de vrai — imports, résolution du stockage,
 * construction de l'interface — et une exception y serait attrapée.
 *
 * Ce que ces tests ne couvrent pas : le rendu, la mise en page CSS et les API
 * navigateur. Ils vérifient le câblage, pas l'apparence. La mise en page réelle
 * est mesurée dans `scripts/verify-brave.mjs`.
 *
 * Le module est partagé pour que plusieurs scénarios de démarrage puissent
 * exister — notamment celui d'une feuille de style restée en cache, qui doit
 * être détecté.
 */

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---------------------------------------------------------------------------
// DOM minimal
// ---------------------------------------------------------------------------

/** Contexte 2D factice : suffisant pour composer une étiquette. */
function createContext2D() {
  return {
    fillStyle: '#000',
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    imageSmoothingEnabled: true,
    fillRect() {},
    fillText() {},
    drawImage() {},
    measureText: (text) => ({ width: text.length * 6 }),
    getImageData: (_x, _y, width, height) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4).fill(255),
    }),
  };
}

/** Élément DOM factice, avec juste ce qu'utilise app.js. */
function createElement(tagName) {
  const classes = new Set();
  // Les écouteurs sont conservés : un test doit pouvoir déclencher un geste —
  // cocher une case, cliquer une commande — et constater ce qu'il produit. Le
  // substitut ne fait rien de plus : il ne simule ni propagation ni délégation.
  const listeners = new Map();
  const node = {
    tagName: String(tagName).toUpperCase(),
    children: [],
    style: {},
    dataset: {},
    attributes: {},
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    hidden: false,
    disabled: false,
    files: null,
    clientWidth: 900,
    parentNode: null,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    get className() {
      return [...classes].join(' ');
    },
    set className(value) {
      classes.clear();
      for (const name of String(value).split(/\s+/)) if (name) classes.add(name);
    },
    get firstElementChild() {
      return this.children[0] ?? null;
    },
    get firstChild() {
      return this.children[0] ?? null;
    },
    appendChild(child) {
      this.children.push(child);
      if (child && typeof child === 'object') child.parentNode = this;
      return child;
    },
    append(...items) {
      for (const item of items) this.appendChild(item);
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index !== -1) this.children.splice(index, 1);
      return child;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener() {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    querySelectorAll: () => [],
    // Le vrai DOM sait chercher un descendant : la fenêtre s'en sert pour ne pas
    // ajouter deux fois l'avertissement de nouvel onglet au lien du pied. Un
    // substitut qui l'omettrait ferait échouer le démarrage au lieu de tester
    // ce qu'on veut tester.
    querySelector: () => null,
    click() {},
    select() {},
    // Le focus est une vraie action de l'application — reprise après une
    // suppression, entrée dans un panneau. Le substitut l'accepte sans le
    // simuler : ce qui compte est que le code puisse l'appeler.
    focus() {},
    getContext: () => createContext2D(),
    getBoundingClientRect: () => ({ width: 900, height: 600, top: 0, left: 0 }),
  };

  // Fidélité indispensable : dans un vrai DOM, affecter `textContent` ou
  // `innerHTML` supprime les enfants existants. Sans cela, un aperçu reconstruit
  // plusieurs fois accumulerait ses versions successives et le test mentirait.
  let text = '';
  Object.defineProperty(node, 'textContent', {
    get: () => text,
    set: (value) => {
      text = value == null ? '' : String(value);
      node.children.length = 0;
    },
    configurable: true,
  });

  // Exposés sous le nom qu'utilise déjà `test/extension-bundle.test.js`, pour
  // que les deux substituts se lisent de la même façon.
  node.__listeners = listeners;

  Object.defineProperty(node, 'innerHTML', {
    get: () => text,
    set: (value) => {
      text = value == null ? '' : String(value);
      node.children.length = 0;
      // Le balisage est approximé par un unique enfant : c'est suffisant pour
      // que `firstElementChild` ne renvoie pas `null` là où le vrai DOM
      // renverrait l'élément racine du fragment.
      if (text !== '') node.appendChild(createElement('div'));
    },
    configurable: true,
  });

  return node;
}

/** Registre d'éléments : `getElementById` doit renvoyer le même nœud. */
const registry = new Map();

const documentStub = {
  getElementById(id) {
    if (!registry.has(id)) registry.set(id, createElement('div'));
    return registry.get(id);
  },
  createElement,
  querySelectorAll: () => [],
  addEventListener() {},
  body: createElement('body'),
  execCommand: () => false,
};

/**
 * Déclenche les gestionnaires d'un type d'événement sur un nœud.
 *
 * Rend ce que le dernier gestionnaire a rendu : les gestionnaires de
 * l'application sont souvent asynchrones, et un test qui ne les attendrait pas
 * dépendrait de l'ordonnancement.
 *
 * @param {object} node
 * @param {string} type
 * @param {object} [event] Propriétés supplémentaires (par exemple `key`).
 * @returns {Promise<unknown>}
 */
export async function fire(node, type, event = {}) {
  let resultat;
  for (const listener of node?.__listeners?.get(type) ?? []) {
    resultat = await listener({ preventDefault() {}, ...event });
  }
  return resultat;
}

/** Compteur d'exécutions : chaque démarrage doit repartir d'un état neuf. */
let bootCount = 0;

/**
 * Installe le DOM de substitution et exécute l'application construite.
 *
 * @param {{
 *   distWeb: string,
 *   computedStyle?: (element: object) => object,
 *   windowExtras?: object,
 *   language?: string,
 *   chrome?: object|null,
 * }} options
 * @returns {Promise<{ registry: Map<string, object>, bootError: Error|null }>}
 */
export async function bootApp(options) {
  const {
    distWeb, computedStyle, windowExtras = {}, language = 'fr-FR', chrome = null,
  } = options;

  // L'application se comporte différemment dans une extension : les collections
  // viennent alors de `chrome.storage.local`, et la page autonome n'en a
  // qu'une. Un scénario qui éprouve les collections doit donc fournir l'API.
  if (chrome) globalThis.chrome = chrome;

  // Le registre repart vierge : un second démarrage dans le même processus doit
  // retrouver des nœuds neufs, et non ceux du premier — qui porteraient encore
  // les écouteurs de l'exécution précédente, et répondraient deux fois aux
  // mêmes gestes.
  registry.clear();

  globalThis.document = documentStub;
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    print() {},
    // L'application web est servie par le site, sous `/app/` : c'est ce que
    // décrit cette page. `protocol` et `pathname` comptent — le lien vers la
    // page d'information se calcule à partir d'eux (`core/site.js`), et un
    // scénario peut les remplacer par ceux d'une page d'extension.
    location: { href: 'http://localhost:4173/app/', protocol: 'http:', pathname: '/app/' },
    ...windowExtras,
  };
  if (computedStyle) globalThis.getComputedStyle = computedStyle;

  // La langue de l'interface suit celle du navigateur, et l'application lit
  // `navigator.language` au démarrage. Sans navigateur fixé, la suite
  // dépendrait de la locale du système et rendrait l'interface en anglais.
  Object.defineProperty(globalThis, 'navigator', {
    value: { language, languages: [language] },
    configurable: true,
    writable: true,
  });

  let bootError = null;
  try {
    // Import réel du module assemblé : tous ses imports sont résolus et le
    // chemin de démarrage s'exécute jusqu'au bout. Le cache d'`import()` est
    // indexé par URL : sans paramètre distinct, un second démarrage rendrait le
    // premier module sans le réexécuter.
    bootCount += 1;
    await import(`${pathToFileURL(join(distWeb, 'app.js')).href}?boot=${bootCount}`);
  } catch (error) {
    bootError = error;
  }

  return { registry, bootError };
}

export { documentStub, createElement, registry };
