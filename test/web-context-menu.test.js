/**
 * Ce que le clic droit écrit, et ce que l'application en montre.
 *
 * Deux modules, deux processus, un seul stockage : le service worker enregistre,
 * l'application lit. Le défaut rapporté vivait exactement dans cet intervalle —
 * le compteur de l'icône s'incrémentait, et l'application ne montrait rien qui
 * ressemble à ce qu'on avait cliqué —, et aucun test ne regardait les deux
 * ensemble.
 *
 * Le service worker n'est pas importable sans navigateur : on exécute donc **ses
 * modules** (`captureFromClick`, le magasin, la normalisation) sur une zone en
 * mémoire, puis on démarre l'application sur la même zone. Chrome, lui, est
 * convoqué par `scripts/verify-context-menu.mjs` : ce fichier tient le contrat,
 * le script constate le rendu.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp } from './helpers/dom-shim.mjs';
import { createChromeStorageStore, createCompositeStore, withCollection } from '../src/core/store.js';
import { createCollectionStore, COLLECTIONS_KEY, ACTIVE_COLLECTION_KEY } from '../src/core/collections.js';
import { captureFromClick, MENU_IDS } from '../src/core/capture.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');
const LINKS_KEY = 'links';

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

/**
 * Zone de stockage simulée, à la forme de `chrome.storage.local`.
 * @param {object} [initial]
 */
function zone(initial = {}) {
  const data = { ...initial };
  return {
    data,
    async get(keys) {
      if (typeof keys === 'string') return { [keys]: data[keys] };
      if (Array.isArray(keys)) return Object.fromEntries(keys.map((k) => [k, data[k]]));
      return { ...data };
    },
    async set(patch) { Object.assign(data, patch); },
    async remove(keys) { for (const key of [].concat(keys)) delete data[key]; },
  };
}

/**
 * Le clic simulé : un résultat de recherche Google.
 *
 * L'adresse est celle que Chrome remplit dans `info.linkUrl` pour un résultat
 * organique — une enveloppe du moteur, avec le contexte de la recherche.
 */
const CLIC_GOOGLE = Object.freeze({
  menuItemId: MENU_IDS.link,
  linkUrl: 'https://www.google.com/url?q=https://fr.wikipedia.org/wiki/Code_QR&sa=U&ved=2ahUKEwi',
  pageUrl: 'https://www.google.com/search?q=wikipedia+qrcode',
});

const ONGLET_GOOGLE = Object.freeze({
  url: 'https://www.google.com/search?q=wikipedia+qrcode',
  title: 'wikipedia qrcode - Recherche Google',
});

/** Ce que fait `record()` du service worker, sans le badge ni le consentement. */
async function clicDroit(area, info, tab) {
  const store = createCompositeStore([
    { store: createChromeStorageStore({ area }), match: (collectionId) => collectionId !== 'private' },
  ]);
  const collections = createCollectionStore({ area });

  const capture = captureFromClick(info, tab);
  const collectionId = await collections.getActive(false);
  const resultat = await withCollection(store, collectionId).add(capture);
  return { capture, collectionId, resultat };
}

/** Démarre l'application sur la zone, comme une ouverture de la page. */
async function ouvrirApplication(area) {
  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    chrome: { runtime: { id: 'test' }, storage: { local: area } },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);
  return {
    node: (id) => registry.get(id),
    lignes: () => registry.get('list').children.length,
    compteur: () => registry.get('count').textContent,
  };
}

// ---------------------------------------------------------------------------

test('un lien ajouté par le clic droit apparaît dans l\'application', async () => {
  const area = zone();
  const { resultat } = await clicDroit(area, CLIC_GOOGLE, ONGLET_GOOGLE);
  assert.equal(resultat.duplicate, false);

  const enregistres = area.data[LINKS_KEY] ?? [];
  assert.equal(enregistres.length, 1, 'le lien est bien écrit');

  const app = await ouvrirApplication(area);
  assert.equal(app.lignes(), 1, 'et l\'application l\'affiche');
  assert.equal(app.compteur(), '1 lien');
});

test('un résultat de recherche est enregistré sous l\'adresse de la page visée', async () => {
  // Le défaut rapporté : l'application contenait bien une ligne, mais c'était
  // l'enveloppe de Google — un titre « google.com » que rien ne reliait au
  // résultat qu'on venait de cliquer.
  const area = zone();
  await clicDroit(area, CLIC_GOOGLE, ONGLET_GOOGLE);

  const [enregistre] = area.data[LINKS_KEY];
  assert.equal(enregistre.url, 'https://fr.wikipedia.org/wiki/Code_QR');
  assert.equal(enregistre.title, 'fr.wikipedia.org', 'le titre est celui de la destination');
  assert.equal(enregistre.source, 'context-menu');
});

test('la même page ajoutée par son adresse directe est un doublon', async () => {
  // Sans le dépliage, les deux adresses ne se ressemblaient pas : la même page
  // entrait deux fois dans la collection, et le QR Code en portait deux fois
  // l'enveloppe — deux fois plus longue.
  const area = zone();
  await clicDroit(area, CLIC_GOOGLE, ONGLET_GOOGLE);
  const { resultat } = await clicDroit(area, {
    menuItemId: MENU_IDS.link,
    linkUrl: 'https://fr.wikipedia.org/wiki/Code_QR',
  }, {});

  assert.equal(resultat.duplicate, true, 'la même page est reconnue');
  assert.equal((area.data[LINKS_KEY] ?? []).length, 1, 'et n\'entre pas deux fois');
});

test('l\'entrée « cette page » enregistre la page de résultats', async () => {
  // C'est la page qu'on regarde : elle s'enregistre telle quelle, et le
  // dépliage ne s'applique qu'à un lien visé.
  const area = zone();
  await clicDroit(area, {
    menuItemId: MENU_IDS.page,
    linkUrl: CLIC_GOOGLE.linkUrl,
    pageUrl: CLIC_GOOGLE.pageUrl,
  }, ONGLET_GOOGLE);

  const [enregistre] = area.data[LINKS_KEY];
  assert.equal(enregistre.url, 'https://www.google.com/search?q=wikipedia+qrcode');
  assert.equal(enregistre.title, 'wikipedia qrcode - Recherche Google');
});

test('le service worker et l\'application comptent la même collection', async () => {
  // Le compteur de l'icône et la liste doivent lire la même chose : c'est ce qui
  // rend le badge utilisable comme un signe que l'ajout a eu lieu.
  const area = zone({
    [COLLECTIONS_KEY]: {
      version: 1,
      migratedAt: 1,
      items: [
        { id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 },
        { id: 'veille', name: 'Veille', note: '', startIndex: 1, createdAt: 20 },
      ],
    },
    [ACTIVE_COLLECTION_KEY]: { normal: 'veille', private: '' },
  });

  await clicDroit(area, CLIC_GOOGLE, ONGLET_GOOGLE);
  const [enregistre] = area.data[LINKS_KEY];
  assert.equal(enregistre.collectionId, 'veille', 'la collection courante, des deux côtés');

  const app = await ouvrirApplication(area);
  assert.equal(app.node('collection-select').value, 'veille');
  assert.equal(app.lignes(), 1);
});
