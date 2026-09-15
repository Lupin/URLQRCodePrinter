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
    addEventListener() {},
    removeEventListener() {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    querySelectorAll: () => [],
    click() {},
    select() {},
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
 * Installe le DOM de substitution et exécute l'application construite.
 *
 * @param {{
 *   distWeb: string,
 *   computedStyle?: (element: object) => object,
 *   windowExtras?: object,
 * }} options
 * @returns {Promise<{ registry: Map<string, object>, bootError: Error|null }>}
 */
export async function bootApp(options) {
  const { distWeb, computedStyle, windowExtras = {} } = options;

  globalThis.document = documentStub;
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    print() {},
    location: { href: 'http://localhost:4173/' },
    ...windowExtras,
  };
  if (computedStyle) globalThis.getComputedStyle = computedStyle;

  let bootError = null;
  try {
    // Import réel du module assemblé : tous ses imports sont résolus et le
    // chemin de démarrage s'exécute jusqu'au bout.
    await import(join(distWeb, 'app.js'));
  } catch (error) {
    bootError = error;
  }

  return { registry, bootError };
}

export { documentStub, createElement, registry };
