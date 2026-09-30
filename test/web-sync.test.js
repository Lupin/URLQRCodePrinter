/**
 * La page suit le stockage écrit ailleurs, exécuté pour de vrai.
 *
 * L'application partage ses documents avec la fenêtre de l'extension et avec le
 * menu contextuel : aucun des trois ne prévient les autres. Vider la collection
 * depuis la fenêtre laissait donc l'application afficher ses liens — et son
 * bouton « Vider » actif — jusqu'au rechargement de l'onglet.
 *
 * Le scénario démarre l'application dans son contexte d'extension, avec une zone
 * de stockage simulée qui **déclenche** `onChanged` à chaque écriture, comme le
 * vrai navigateur. C'est ce qui permet de vérifier les deux moitiés de la règle :
 * la page suit les écritures des autres, et elle ne se redessine pas pour les
 * siennes.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp } from './helpers/dom-shim.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

const COLLECTIONS_KEY = 'url-qr-code-printer/collections';
const ACTIVE_COLLECTION_KEY = 'url-qr-code-printer/active-collection';
const LINKS_KEY = 'links';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Attend qu'un état soit vrai, plutôt qu'un délai fixe.
 *
 * L'application regroupe ses relectures (150 ms après le dernier événement), et
 * la suite tourne en parallèle : un délai juste suffisant à vide devient trop
 * court sous charge, et le test échoue alors pour une raison qui n'a rien à voir
 * avec ce qu'il vérifie.
 *
 * @param {() => boolean} check
 * @param {number} [timeout]
 * @returns {Promise<boolean>}
 */
async function until(check, timeout = 3000) {
  const fin = Date.now() + timeout;
  for (;;) {
    if (check()) return true;
    if (Date.now() > fin) return false;
    await pause(20);
  }
}

/**
 * Zone de stockage simulée, à la forme de `chrome.storage.local`.
 *
 * `set` déclenche `onChanged`, **dans la page qui écrit comme dans les autres** :
 * c'est le comportement du navigateur, et c'est lui qui rend le garde-fou de
 * l'application observable — une écriture de la page ne doit pas la redessiner.
 *
 * @param {object} [initial]
 */
function zone(initial = {}) {
  const data = { ...initial };
  /** Les écouteurs de `storage.onChanged`, que le test déclenche par `set`. */
  const ecouteurs = [];
  return {
    data,
    ecouteurs,
    async get(key) {
      return { [key]: data[key] };
    },
    async set(patch) {
      const changes = {};
      for (const [cle, valeur] of Object.entries(patch)) {
        changes[cle] = { oldValue: data[cle], newValue: valeur };
      }
      Object.assign(data, patch);
      for (const listener of ecouteurs) listener(changes, 'local');
    },
  };
}

/** Un lien minimal, rangé dans la collection demandée. */
function lien(id, url, collectionId, extra = {}) {
  return {
    id,
    url,
    title: `Titre ${id}`,
    note: '',
    tags: [],
    collectionId,
    createdAt: 10,
    updatedAt: 10,
    source: 'manual',
    favicon: '',
    shortUrl: '',
    ...extra,
  };
}

/**
 * Démarre l'application sur deux collections, et rend de quoi lire l'état.
 *
 * @param {{ links?: Array<object>, active?: string }} [options]
 */
async function demarrer(options = {}) {
  const area = zone({
    [COLLECTIONS_KEY]: {
      version: 1,
      migratedAt: 1,
      items: [
        { id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 },
        { id: 'veille', name: 'Veille', note: '', startIndex: 1, createdAt: 20 },
      ],
    },
    [ACTIVE_COLLECTION_KEY]: { normal: options.active ?? 'default', private: '' },
    [LINKS_KEY]: options.links ?? [
      lien('l1', 'https://exemple.fr/un', 'default', { order: 0 }),
      lien('l2', 'https://exemple.fr/deux', 'default', { order: 1 }),
      lien('l3', 'https://exemple.fr/veille', 'veille', { order: 0 }),
    ],
  });

  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    // `runtime.id` est ce qui distingue une page d'extension d'une page web :
    // sans lui, la page n'a qu'une collection et n'écoute aucun stockage.
    // `storage.onChanged` est branché sur la zone : c'est par lui que l'écoute
    // de l'application arrive, et non par `local` lui-même.
    chrome: {
      runtime: { id: 'test' },
      storage: { local: area, onChanged: { addListener: (fn) => area.ecouteurs.push(fn) } },
    },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);

  return {
    area,
    node: (id) => registry.get(id),
    texte: (id) => registry.get(id).textContent,
    lignes: () => registry.get('list').children.length,
  };
}

// ---------------------------------------------------------------------------

test('vider la collection depuis la fenêtre met l\'application à jour', async () => {
  const app = await demarrer();
  assert.equal(app.texte('count'), '2 liens', 'la collection courante est affichée');
  assert.equal(app.lignes(), 2);

  // La fenêtre de l'extension vide la collection : elle écrit le document des
  // liens, et l'événement repart dans toutes les pages de l'extension.
  await app.area.set({ [LINKS_KEY]: [] });
  assert.ok(
    await until(() => app.texte('count') === '0 lien'),
    `compteur attendu à zéro, observé « ${app.texte('count')} »`,
  );

  assert.equal(app.texte('count'), '0 lien');
  assert.equal(app.lignes(), 0, 'la liste affichée suit');
  assert.equal(app.node('clear').disabled, true, 'il n\'y a plus rien à vider');
});

test('une écriture de la page ne la redessine pas pour rien', async () => {
  const app = await demarrer();

  // Témoin : une reconstruction de la liste réécrirait le compteur. C'est ce que
  // produirait une remise à jour qui ne compare pas ce qu'elle relit.
  app.node('count').textContent = 'témoin';
  await app.area.set({ [LINKS_KEY]: app.area.data[LINKS_KEY] });
  // Ici, un délai **fixe** : ce qui est vérifié est une absence. Attendre serait
  // absurde — il n'y a rien à attendre —, et la marge est celle du regroupement,
  // prise large.
  await pause(500);

  assert.equal(app.node('count').textContent, 'témoin');
  assert.equal(app.lignes(), 2);
});

test('changer de collection ailleurs change celle qui est affichée', async () => {
  const app = await demarrer();
  assert.equal(app.node('collection-select').value, 'default');

  // La fenêtre parcourt les collections : elle réinscrit la collection courante,
  // et la page doit montrer la même — sinon les deux désignent des liens
  // différents sous le même nom.
  await app.area.set({ [ACTIVE_COLLECTION_KEY]: { normal: 'veille', private: '' } });
  assert.ok(
    await until(() => app.node('collection-select').value === 'veille'),
    `collection courante attendue « veille », observée « ${app.node('collection-select').value} »`,
  );

  assert.equal(app.node('collection-select').value, 'veille');
  assert.equal(app.texte('count'), '1 lien', 'le compte suit la collection affichée');
  assert.equal(app.node('collection-name').value, 'Veille');
});
