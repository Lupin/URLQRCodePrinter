/**
 * Déplacer des liens d'une collection à l'autre, exécuté pour de vrai.
 *
 * Le contrôle statique dit que le code appelle `put` et non `add` ; il ne dit pas
 * que le lien change de collection, qu'il ne laisse pas de copie derrière lui, ni
 * que la commande disparaît une fois la sélection vidée. Ces trois choses-là ne se
 * constatent qu'en exécutant l'application.
 *
 * Le scénario démarre donc l'application **dans son contexte d'extension** : les
 * collections y vivent dans `chrome.storage.local`, alors que la page web
 * autonome n'en a qu'une. Le substitut de stockage est en mémoire, à la forme de
 * l'API réelle — un `get(clé)` qui rend `{ [clé]: valeur }`, un `set(patch)`.
 *
 * Réécrit après une perte accidentelle du fichier d'origine (nettoyage de
 * doublons iCloud ayant emporté des fichiers non commités).
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

const COLLECTIONS_KEY = 'url-qr-code-printer/collections';
const ACTIVE_COLLECTION_KEY = 'url-qr-code-printer/active-collection';
const LINKS_KEY = 'links';

/**
 * Zone de stockage simulée, à la forme de `chrome.storage.local`.
 *
 * @param {object} [initial]
 * @returns {{ data: object, get: Function, set: Function }}
 */
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
 * Démarre l'application sur une collection de deux liens, et rend de quoi lire
 * l'état.
 *
 * @param {{ links?: Array<object>, collections?: Array<object>, active?: string }} [options]
 */
async function demarrer(options = {}) {
  const collections = options.collections ?? [
    { id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 },
    { id: 'veille', name: 'Veille', note: '', startIndex: 1, createdAt: 20 },
  ];
  const area = zone({
    [COLLECTIONS_KEY]: { version: 1, migratedAt: 1, items: collections },
    [ACTIVE_COLLECTION_KEY]: { normal: options.active ?? 'default', private: '' },
    [LINKS_KEY]: options.links ?? [
      lien('l1', 'https://exemple.fr/un', 'default', { order: 3 }),
      lien('l2', 'https://exemple.fr/deux', 'default'),
    ],
  });

  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    //  est ce qui distingue une page d'extension d'une page web : sans
    // lui, l'application n'a qu'une collection, celle des réglages.
    chrome: { runtime: { id: 'test' }, storage: { local: area } },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);

  return {
    area,
    liens: () => area.data[LINKS_KEY],
    dansLaCollection: (id) => (area.data[LINKS_KEY] ?? []).filter((l) => l.collectionId === id),
    node: (id) => registry.get(id),
    /** Coche toute la liste : c'est la sélection qui fait vivre la commande. */
    async toutCocher() {
      const boite = registry.get('select-all-box');
      boite.checked = true;
      await fire(boite, 'change');
    },
  };
}

// ---------------------------------------------------------------------------

test('la commande de déplacement n\'existe qu\'avec une sélection', async () => {
  const app = await demarrer();

  // Sans sélection, il n'y a rien à déplacer : la commande est masquée.
  assert.equal(app.node('move-group').hidden, true);
  assert.equal(app.node('move-menu').hidden, true, 'le panneau reste fermé');

  await app.toutCocher();
  assert.equal(app.node('move-group').hidden, false, 'la sélection fait apparaître la commande');

  // Décocher la fait disparaître : c'est le même état qui la fait vivre et
  // mourir, donc rien à synchroniser.
  const boite = app.node('select-all-box');
  boite.checked = false;
  await fire(boite, 'change');
  assert.equal(app.node('move-group').hidden, true);
});

test('le panneau propose les autres collections, jamais la collection affichée', async () => {
  const app = await demarrer();
  await app.toutCocher();

  await fire(app.node('move-to'), 'click');
  assert.equal(app.node('move-menu').hidden, false);
  assert.equal(app.node('move-to').getAttribute('aria-expanded'), 'true');

  const choix = app.node('move-menu').children.map((bouton) => bouton.textContent);
  // « Déplacer » vers l'endroit où l'on est ne déplacerait rien : la collection
  // affichée est exclue.
  assert.deepEqual(choix, ['Veille']);
});

test('déplacer change la collection du lien, sans laisser de copie', async () => {
  const app = await demarrer();
  await app.toutCocher();
  await fire(app.node('move-to'), 'click');
  await fire(app.node('move-menu').children[0], 'click');

  const restants = app.dansLaCollection('default');
  const deplaces = app.dansLaCollection('veille');

  assert.deepEqual(restants, [], 'la collection quittée est vide');
  assert.equal(deplaces.length, 2, 'les deux liens cochés ont suivi');
  // Un déplacement n'est pas une copie : l'identifiant et la date de collecte
  // sont conservés, seul le rangement change.
  assert.deepEqual(deplaces.map((l) => l.id).sort(), ['l1', 'l2']);
  assert.equal(deplaces.every((l) => l.createdAt === 10), true, 'la date de collecte ne bouge pas');
  assert.equal(app.liens().length, 2, 'aucun enregistrement en double');

  // Le rang appartient au rangement qu'on quitte : l'emporter ferait s'intercaler
  // le lien à une place que personne n'a choisie dans la collection d'arrivée.
  const premier = deplaces.find((l) => l.id === 'l1');
  assert.equal(premier.order, undefined, 'le rang ne suit pas le lien');
});

test('après le déplacement, la commande disparaît avec la sélection', async () => {
  const app = await demarrer();
  await app.toutCocher();
  await fire(app.node('move-to'), 'click');
  await fire(app.node('move-menu').children[0], 'click');

  // Les liens ont quitté la collection affichée : `refresh` les retire de la
  // sélection, ce qui fait disparaître la commande d'elle-même.
  assert.equal(app.node('move-group').hidden, true);
  assert.equal(app.node('move-menu').hidden, true);
  assert.equal(app.node('move-to').getAttribute('aria-expanded'), 'false');
});

test('une adresse déjà présente fusionne au lieu de se dupliquer', async () => {
  // Dans une collection, un doublon reste un doublon : la copie disparaît, et le
  // titre en place est corrigé si celui qu'on apporte est différent.
  const app = await demarrer({
    links: [
      lien('l1', 'https://exemple.fr/un', 'default', { title: 'Titre d\'origine' }),
      lien('l3', 'https://exemple.fr/un', 'veille', { title: 'Titre arrivé avant' }),
    ],
  });
  await app.toutCocher();
  await fire(app.node('move-to'), 'click');
  await fire(app.node('move-menu').children[0], 'click');

  const veille = app.dansLaCollection('veille');
  assert.equal(veille.length, 1, 'une seule copie de l\'adresse dans la collection d\'arrivée');
  assert.equal(veille[0].id, 'l3', 'l\'enregistrement en place est conservé');
  assert.deepEqual(app.dansLaCollection('default'), [], 'rien ne reste derrière');
  // Le titre apporté **corrige** celui en place : un lien déplacé arrive avec
  // celui qu'on vient de lire, et la collection d'arrivée ne garde pas un titre
  // périmé. C'est la règle de , et elle vaut ici comme ailleurs.
  assert.equal(veille[0].title, 'Titre d\'origine');
});

test('sans autre collection, la commande ne se montre pas', async () => {
  // Une commande qui n'ouvrirait qu'un panneau vide serait un piège.
  const app = await demarrer({ collections: [{ id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 }] });
  await app.toutCocher();
  assert.equal(app.node('move-group').hidden, true);
});
