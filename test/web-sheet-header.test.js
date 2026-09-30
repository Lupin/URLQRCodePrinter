/**
 * Cocher « En-tête de page » doit faire la place, et se voir.
 *
 * Le défaut signalé : « en mode planche d'étiquettes, si on clique sur les
 * options dans « En-tête de page » rien ne s'affiche dans la preview, ni même
 * dans la preview de l'imprimante ». La cause n'était pas le rendu, mais la
 * **marge** : l'en-tête vit dans la marge du haut, qui doit mesurer 9 mm, et la
 * disposition par défaut en donne 8,53. Le refus s'écrivait sous la case, à
 * l'encre des aides — donc on cochait sans rien voir changer.
 *
 * La case fait maintenant la place elle-même : la marge est portée à ce que
 * l'en-tête demande, et le rendu suit. Le scénario exécute l'application pour de
 * vrai, dans son contexte d'extension.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp, fire } from './helpers/dom-shim.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

/** Zone de stockage simulée, à la forme de `chrome.storage.local`. */
function zone(initial = {}) {
  const data = { ...initial };
  return {
    data,
    async get(key) {
      return { [key]: data[key] };
    },
    async set(patch) {
      Object.assign(data, patch);
    },
  };
}

/** Démarre l'application avec deux liens, en contexte d'extension. */
async function demarrer() {
  const area = zone({
    'url-qr-code-printer/collections': {
      version: 1,
      migratedAt: 1,
      items: [{ id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 }],
    },
    'url-qr-code-printer/active-collection': { normal: 'default', private: '' },
    links: [
      { id: '1', url: 'https://exemple.fr/un', title: 'Un article', note: '', tags: [], collectionId: 'default', createdAt: 10, updatedAt: 10, source: 'manual', favicon: '', shortUrl: '' },
      { id: '2', url: 'https://exemple.fr/deux', title: 'Un second article', note: '', tags: [], collectionId: 'default', createdAt: 11, updatedAt: 11, source: 'manual', favicon: '', shortUrl: '' },
    ],
  });

  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    chrome: { runtime: { id: 'test' }, storage: { local: area } },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);
  return { registry, node: (id) => registry.get(id) };
}

/** Pose une valeur et prévient l'application, comme une saisie réelle. */
async function saisir(node, valeur) {
  node.value = valeur;
  await fire(node, 'input');
  await fire(node, 'change');
}

// ---------------------------------------------------------------------------

test("cocher l'en-tête de page porte la marge haute à ce qu'il demande", async () => {
  const app = await demarrer();

  // La disposition par défaut : 8,5 mm de marge haute, sous les 9 mm exigés.
  await saisir(app.node('sheet-margin-y'), '8.5');
  assert.equal(app.node('sheet-header').checked, false);

  app.node('sheet-header').checked = true;
  await fire(app.node('sheet-header'), 'change');

  assert.equal(app.node('sheet-margin-y').value, '9', 'la marge doit être portée à 9 mm');
  assert.equal(
    (app.node('sheet-header-hint').textContent ?? '').trim(),
    '',
    'le refus ne doit plus être annoncé : il n\'y a plus de refus',
  );
});

test('une marge redescendue trop bas annonce le refus, à l\'alerte', async () => {
  // Le refus existe toujours — l'en-tête ne peut pas tenir dans 3 mm —, mais il
  // se dit maintenant en rouge, avec la valeur à atteindre : c'est ce qui
  // manquait quand la case semblait ne rien faire.
  const app = await demarrer();
  app.node('sheet-header').checked = true;
  await fire(app.node('sheet-header'), 'change');
  assert.equal(app.node('sheet-margin-y').value, '9');

  await saisir(app.node('sheet-margin-y'), '3');

  const message = (app.node('sheet-header-hint').textContent ?? '').trim();
  assert.match(message, /9/, 'le message doit nommer la marge à atteindre');
  assert.match(message, /marge/i);
  assert.equal(app.node('sheet-header-hint').style.color, 'var(--danger)');
  assert.notEqual(app.node('sheet-header-hint').hidden, true, 'le message doit être visible');
});
