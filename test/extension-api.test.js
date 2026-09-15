/**
 * Tests de l'adaptateur d'API d'extension.
 *
 * Ces fonctions portent la portabilité vers Safari iOS : absence de
 * `contextMenus` et absence de `tab.url`. Les tester hors navigateur est le
 * seul moyen de vérifier ces chemins sans appareil.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveApi,
  contextMenusAvailable,
  readTabContext,
  installContextMenus,
} from '../src/extension-src/api.js';

/** API factice imitant Chrome. */
function chromeLike(overrides = {}) {
  return {
    runtime: { id: 'test' },
    tabs: { query: async () => [] },
    storage: { local: {} },
    contextMenus: {
      create: async () => {},
      removeAll: async () => {},
      onClicked: { addListener: () => {} },
    },
    scripting: { executeScript: async () => [] },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// resolveApi
// ---------------------------------------------------------------------------

test('resolveApi préfère browser à chrome', () => {
  const browser = chromeLike();
  const chrome = chromeLike();
  assert.equal(resolveApi({ browser, chrome }), browser);
});

test('resolveApi se rabat sur chrome', () => {
  const chrome = chromeLike();
  assert.equal(resolveApi({ chrome }), chrome);
});

test('resolveApi renvoie null sans aucune API', () => {
  assert.equal(resolveApi({}), null);
  assert.equal(resolveApi({ navigator: {} }), null);
});

test('resolveApi accepte un browser sans runtime en dernier recours', () => {
  const browser = { storage: {} };
  assert.equal(resolveApi({ browser }), browser);
});

// ---------------------------------------------------------------------------
// contextMenusAvailable
// ---------------------------------------------------------------------------

test('contextMenusAvailable est vrai quand l\'API est complète', () => {
  assert.equal(contextMenusAvailable(chromeLike()), true);
});

test('contextMenusAvailable est faux sur Safari iOS', () => {
  // Cas réel : WebKit n'expose pas `contextMenus` sur iOS.
  assert.equal(contextMenusAvailable(chromeLike({ contextMenus: undefined })), false);
  assert.equal(contextMenusAvailable(null), false);
});

test('contextMenusAvailable refuse une API partielle', () => {
  // `create` sans `onClicked` ne servirait à rien : le menu s'afficherait sans
  // réaction au clic.
  assert.equal(contextMenusAvailable({ contextMenus: { create: () => {} } }), false);
  assert.equal(contextMenusAvailable({ contextMenus: { onClicked: {} } }), false);
});

// ---------------------------------------------------------------------------
// readTabContext
// ---------------------------------------------------------------------------

test('readTabContext utilise tab.url quand il est fourni', async () => {
  let injected = false;
  const api = chromeLike({
    scripting: {
      executeScript: async () => {
        injected = true;
        return [];
      },
    },
  });

  const context = await readTabContext(api, { url: 'https://a.com/', title: 'Titre' });
  assert.deepEqual(context, { url: 'https://a.com/', title: 'Titre', injected: false });
  assert.equal(injected, false, 'aucune injection ne doit avoir lieu');
});

test('readTabContext injecte quand tab.url est absent', async () => {
  let received = null;
  const api = chromeLike({
    scripting: {
      executeScript: async (options) => {
        received = options;
        return [{ result: { url: 'https://injecte.com/', title: 'Depuis la page' } }];
      },
    },
  });

  const context = await readTabContext(api, { id: 7 });
  assert.equal(context.url, 'https://injecte.com/');
  assert.equal(context.title, 'Depuis la page');
  assert.equal(context.injected, true);
  assert.deepEqual(received.target, { tabId: 7 });
  assert.equal(typeof received.func, 'function');
});

test('readTabContext accepte une réponse non encapsulée dans un tableau', async () => {
  const api = chromeLike({
    scripting: {
      executeScript: async () => ({ result: { url: 'https://seul.com/', title: '' } }),
    },
  });
  assert.equal((await readTabContext(api, { id: 1 })).url, 'https://seul.com/');
});

test('readTabContext renvoie null si l\'injection échoue', async () => {
  const api = chromeLike({
    scripting: {
      executeScript: async () => {
        throw new Error('onglet non autorisé');
      },
    },
  });
  assert.equal(await readTabContext(api, { id: 1 }), null);
});

test('readTabContext renvoie null sur une page interne', async () => {
  // Une page `chrome://` ou `about:` ne peut pas être injectée.
  const api = chromeLike({
    scripting: { executeScript: async () => [{ result: { url: '', title: '' } }] },
  });
  assert.equal(await readTabContext(api, { id: 1 }), null);
});

test('readTabContext renvoie null sans identifiant d\'onglet ni scripting', async () => {
  assert.equal(await readTabContext(chromeLike(), {}), null);
  assert.equal(await readTabContext(chromeLike({ scripting: undefined }), { id: 3 }), null);
  assert.equal(await readTabContext(chromeLike(), null), null);
});

// ---------------------------------------------------------------------------
// installContextMenus
// ---------------------------------------------------------------------------

test('installContextMenus ne fait rien sans support', async () => {
  const result = await installContextMenus(null, [{ id: 'a', title: 'A' }]);
  assert.deepEqual(result, { supported: false, created: 0 });
});

test('installContextMenus crée toutes les entrées', async () => {
  const created = [];
  const api = chromeLike({
    contextMenus: {
      create: async (definition) => created.push(definition.id),
      removeAll: async () => {},
      onClicked: { addListener: () => {} },
    },
  });

  const result = await installContextMenus(api, [{ id: 'a' }, { id: 'b' }]);
  assert.deepEqual(result, { supported: true, created: 2 });
  assert.deepEqual(created, ['a', 'b']);
});

test('installContextMenus survit à un removeAll en échec', async () => {
  // Cas réel : `removeAll` échoue au tout premier lancement de l'extension.
  const created = [];
  const api = chromeLike({
    contextMenus: {
      create: async (definition) => created.push(definition.id),
      removeAll: async () => {
        throw new Error('rien à supprimer');
      },
      onClicked: { addListener: () => {} },
    },
  });

  const result = await installContextMenus(api, [{ id: 'a' }]);
  assert.equal(result.created, 1);
});

test('installContextMenus continue après un identifiant déjà pris', async () => {
  const created = [];
  const api = chromeLike({
    contextMenus: {
      create: async (definition) => {
        if (definition.id === 'a') throw new Error('identifiant déjà utilisé');
        created.push(definition.id);
      },
      removeAll: async () => {},
      onClicked: { addListener: () => {} },
    },
  });

  const result = await installContextMenus(api, [{ id: 'a' }, { id: 'b' }]);
  assert.equal(result.created, 1);
  assert.deepEqual(created, ['b']);
});
