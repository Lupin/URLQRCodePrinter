/**
 * Démarrage de l'application web, exécuté réellement.
 *
 * Chrome sans interface ne démarre pas dans cet environnement, ce qui
 * interdirait toute vérification dynamique. On exécute donc `app.js` sous Node
 * avec un DOM minimal : le chemin de démarrage complet est parcouru pour de
 * vrai — imports, résolution du stockage, construction de l'interface — et une
 * exception y serait attrapée.
 *
 * Ce que ce test ne couvre pas : le rendu, la mise en page CSS et les API
 * navigateur. Il vérifie le câblage, pas l'apparence.
 */

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');

// La construction est assurée par le script `pretest` de npm : la déclencher
// ici entrerait en concurrence avec test/web.test.js, qui reconstruit la même
// cible en parallèle.
if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

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

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

/** Erreur éventuellement levée au chargement de l'application. */
let bootError = null;

before(async () => {
  globalThis.document = documentStub;
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    print() {},
    location: { href: 'http://localhost:4173/' },
  };

  try {
    // Import réel du module assemblé : tous ses imports sont résolus et le
    // chemin de démarrage s'exécute jusqu'au bout.
    await import(join(DIST_WEB, 'app.js'));
  } catch (error) {
    bootError = error;
  }
});

test('l\'application démarre sans lever d\'exception', () => {
  assert.equal(bootError, null, bootError ? `${bootError.message}\n${bootError.stack}` : '');
});

test('le compteur affiche zéro lien au démarrage', () => {
  assert.equal(registry.get('count').textContent, '0 lien');
});

test('les dispositions de planche sont proposées, groupées par famille', () => {
  const preset = registry.get('preset');
  assert.equal(preset.value, 'a4-3x8', 'le préréglage par défaut doit être sélectionné');

  // Les préréglages sont rangés par famille : les dispositions génériques se
  // règlent, les références Avery se choisissent sur l'emballage.
  const groups = preset.children;
  assert.ok(groups.length >= 3, `${groups.length} famille(s) attendues`);
  for (const group of groups) {
    assert.equal(group.tagName, 'OPTGROUP');
    assert.ok(group.label, 'chaque famille porte un titre');
    assert.ok(group.children.length > 0, `${group.label} ne doit pas être vide`);
    for (const option of group.children) {
      assert.equal(option.tagName, 'OPTION');
      assert.ok(option.value, 'chaque option doit porter une valeur');
      assert.ok(option.textContent, 'chaque option doit porter un libellé');
    }
  }

  const keys = groups.flatMap((group) => group.children.map((option) => option.value));
  assert.ok(keys.includes('avery-l7160'), 'la référence Avery L7160 doit être proposée');
  assert.ok(keys.includes('avery-5160'), 'la référence Avery 5160 (Letter) doit être proposée');
});

test('le format d\'étiquette Niimbot est visible sans imprimante', () => {
  const profiles = registry.get('label-profile').children;
  assert.ok(profiles.length >= 2, 'les formats D110 et M2 doivent être proposés');
  assert.equal(registry.get('label-profile').value, 'D110', 'le D110 est retenu par défaut');

  const labels = profiles.map((option) => option.textContent).join(' | ');
  assert.match(labels, /D110/);
  assert.match(labels, /M2/);
  assert.match(labels, /mm/, 'chaque format annonce sa largeur utile en millimètres');

  // Node n'a pas de Web Bluetooth : c'est exactement le cas « pas d'imprimante ».
  // L'aperçu doit malgré tout annoncer avec quel profil il compose.
  assert.match(registry.get('profile-hint').textContent, /sans imprimante connectée/);
  assert.match(registry.get('profile-hint').textContent, /D110/);
});

test('le décalage d\'impression est câblé, sans effet au départ', () => {
  // Le DOM factice ne lit pas les attributs du HTML : la valeur par défaut est
  // vérifiée dans test/web.test.js, sur le fichier réel. Ici on s'assure que le
  // champ est bien celui qu'app.js interroge — une valeur vide vaut zéro.
  for (const id of ['sheet-offset-x', 'sheet-offset-y']) {
    assert.equal(registry.get(id).value, '', `${id} n'est pas initialisé par app.js`);
  }
});

test('aucun lien : les exports et l\'effacement sont désactivés', () => {
  for (const id of ['export-csv', 'export-md', 'export-json', 'clear', 'print']) {
    assert.equal(registry.get(id).disabled, true, `${id} devrait être désactivé`);
  }
});

test('la collection vide affiche une aide', () => {
  const empty = registry.get('empty');
  assert.equal(empty.hidden, false);
  assert.match(empty.textContent, /Aucun lien/);
});

test('le mode planche est actif par défaut', () => {
  const preview = registry.get('preview');
  assert.equal(preview.children.length, 1, 'un message d\'aide doit occuper l\'aperçu');
  assert.equal(preview.children[0].tagName, 'P');
});

test('Web Bluetooth absent : la connexion est désactivée et expliquée', () => {
  // Node n'expose pas `navigator.bluetooth` : c'est exactement le cas de Safari
  // ou d'un Brave non configuré.
  const connect = registry.get('connect');
  assert.equal(connect.disabled, true);
  assert.equal(registry.get('ble-support').hidden, false);
  assert.match(registry.get('ble-support').textContent, /Safari|brave:\/\/flags/);
});

// ---------------------------------------------------------------------------
// Raccourcissement et cible du QR code
// ---------------------------------------------------------------------------

/** Les options d'un `<select>` du DOM factice, sous forme de paires. */
function options(id) {
  return registry.get(id).children.map((option) => [option.value, option.textContent]);
}

test('les services de raccourcissement sont proposés dès le démarrage', () => {
  const choices = options('shortener');
  assert.ok(choices.length >= 3, `${choices.length} service(s)`);
  for (const [value, label] of choices) {
    assert.ok(value, 'chaque service porte un identifiant');
    assert.ok(label, 'chaque service porte un nom lisible');
  }
  // Le service retenu par défaut est appliqué avant le premier rendu.
  assert.equal(registry.get('shortener').value, 'tinyurl');
});

test('le QR vise l\'URL collectée, et le raccourci reste hors de portée', () => {
  assert.deepEqual(
    options('qr-target'),
    [['original', "L'URL collectée"], ['short', 'Le lien raccourci']],
  );
  assert.equal(registry.get('qr-target').value, 'original');

  // Sans aucun raccourci en place, le choix n'est pas proposé : rien ne doit
  // pouvoir être imprimé avec un lien que l'utilisateur n'a pas vérifié.
  const shortOption = registry.get('qr-target').children.find((o) => o.value === 'short');
  assert.equal(shortOption.disabled, true);
  assert.match(registry.get('target-hint').textContent, /URL collectée/);
});

test('aucun raccourcissement n\'est déclenché de lui-même', () => {
  // Le stockage est vide et le bouton est inactif : ouvrir l'application ne
  // contacte aucun service tiers.
  assert.equal(registry.get('shorten').disabled, true);
  assert.equal(registry.get('shorten-clear').hidden, true);
  assert.equal(registry.get('shorten-status').textContent, '');
});
