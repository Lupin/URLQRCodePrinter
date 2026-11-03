/**
 * Le nom de la collection : validation, et création nommée.
 *
 * Deux défauts rapportés, et un seul sujet : le nom d'une collection était
 * écrit à la frappe, sans validation, si bien qu'une pause suffisait à renommer
 * — et qu'un nom à moitié tapé partait dans le stockage. Et pour créer une
 * collection nommée, il fallait passer par « Nouvelle collection », puis la
 * renommer.
 *
 * Le scénario démarre l'application dans son contexte d'extension, avec une zone
 * de stockage simulée, et déclenche les gestes réels : frappe, Entrée, Échap,
 * bouton « Enregistrer », bouton « Nouvelle », changement de collection. C'est ce
 * qui permet de constater le point qui compte — **ce qui est écrit, et quand** —
 * plutôt que la forme du code.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp, fire } from './helpers/dom-shim.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');
const COLLECTIONS_KEY = 'url-qr-code-printer/collections';
const ACTIVE_COLLECTION_KEY = 'url-qr-code-printer/active-collection';
const SETTINGS_KEY = 'url-qr-code-printer/settings';
const LINKS_KEY = 'links';
const PRIVATE_LINKS_KEY = 'links/private';

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Attend qu'un état soit vrai, plutôt qu'un délai fixe.
 *
 * L'application regroupe ses relectures (150 ms après le dernier événement), et
 * la suite tourne en parallèle : un délai juste suffisant à vide devient trop
 * court sous charge.
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
 * `set` déclenche `onChanged`, dans la page qui écrit comme dans les autres :
 * c'est ce qui permet d'éprouver la relecture venue d'ailleurs, et son effet sur
 * une saisie en cours.
 *
 * @param {object} [initial]
 */
function zone(initial = {}) {
  const data = { ...initial };
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
    async remove(key) {
      delete data[key];
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
 * Démarre l'application en contexte d'extension, sur deux collections.
 *
 * @param {{ links?: Array<object>, collections?: Array<object>, active?: string,
 *   prive?: boolean }} [options]
 */
async function demarrer(options = {}) {
  // La collection de navigation privée n'est proposée que dans une fenêtre
  // privée, et ses liens vivent dans `storage.session` : le scénario privé doit
  // donc fournir la seconde zone et le marqueur de contexte.
  const session = options.prive ? zone({ [PRIVATE_LINKS_KEY]: [] }) : null;
  const area = zone({
    [COLLECTIONS_KEY]: {
      version: 1,
      migratedAt: 1,
      items: options.collections ?? [
        { id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 },
        { id: 'veille', name: 'Veille', note: 'mes lectures', startIndex: 1, createdAt: 20 },
      ],
    },
    [ACTIVE_COLLECTION_KEY]: {
      normal: options.active ?? 'default',
      private: options.prive ? 'private' : '',
    },
    [LINKS_KEY]: options.links ?? [],
  });

  const storage = session ? { local: area, session } : { local: area };
  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    chrome: {
      runtime: { id: 'test' },
      storage: { ...storage, onChanged: { addListener: (fn) => area.ecouteurs.push(fn) } },
      ...(options.prive ? { extension: { inIncognitoContext: true } } : {}),
    },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);

  return {
    area,
    session,
    liens: () => area.data[LINKS_KEY],
    collections: () => (area.data[COLLECTIONS_KEY]?.items ?? []),
    collection: (id) => (area.data[COLLECTIONS_KEY]?.items ?? []).find((item) => item.id === id),
    node: (id) => registry.get(id),
    /** Le nom d'une option du sélecteur, telle qu'elle s'affiche. */
    options: () => registry.get('collection-select').children.map((option) => option.textContent),
    /** Tape un nom dans le champ, comme une frappe réelle. */
    async taper(nom) {
      const champ = registry.get('collection-name');
      champ.value = nom;
      await fire(champ, 'input');
      return champ;
    },
  };
}

// ---------------------------------------------------------------------------
// La frappe n'écrit plus rien
// ---------------------------------------------------------------------------

test('un nom tapé n\'est pas enregistré avant validation', async () => {
  const app = await demarrer({ active: 'veille' });
  const champ = app.node('collection-name');
  assert.equal(champ.value, 'Veille', 'le champ montre le nom enregistré');

  await app.taper('Veille tech');

  // Le défaut rapporté vivait ici : la frappe écrivait, et une pause dans la
  // saisie suffisait à renommer la collection.
  assert.equal(app.collection('veille').name, 'Veille', 'le stockage n\'a pas bougé');
  assert.deepEqual(app.options(), ['Mes liens', 'Veille'], 'la liste n\'a pas bougé');
  assert.equal(champ.value, 'Veille tech', 'la saisie reste dans le champ');

  // Une saisie attend : le bouton s'active, et l'aide dit les deux issues.
  assert.equal(app.node('collection-name-save').disabled, false);
  assert.match(app.node('collection-hint').textContent, /Nom en attente/);
  assert.match(app.node('collection-hint').textContent, /« Nouvelle » crée une collection de ce nom/);

  // L'infobulle de « Nouvelle » annonce ce que le bouton fera du nom saisi.
  assert.equal(
    app.node('collection-add').title,
    'Créer une collection nommée « Veille tech »',
  );
});

test('le bouton « Enregistrer » écrit le nom, et la liste suit', async () => {
  const app = await demarrer({ active: 'veille' });
  await app.taper('Veille tech');

  await fire(app.node('collection-name-save'), 'click');

  assert.equal(app.collection('veille').name, 'Veille tech', 'le nom est écrit');
  assert.equal(app.collection('veille').note, 'mes lectures', 'la note ne bouge pas');
  assert.deepEqual(app.options(), ['Mes liens', 'Veille tech'], 'la liste suit');
  assert.equal(app.node('collection-name-save').disabled, true, 'plus rien n\'attend');
  assert.equal(app.node('collection-hint').hidden, true, 'l\'aide d\'attente disparaît');
  assert.match(app.node('toast').textContent, /Nom de la collection enregistré/);
});

test('Entrée valide, Échap abandonne', async () => {
  const app = await demarrer({ active: 'veille' });
  const champ = await app.taper('Veille 2');

  await fire(champ, 'keydown', { key: 'Enter' });
  assert.equal(app.collection('veille').name, 'Veille 2', 'Entrée enregistre');

  await app.taper('Brouillon');
  await fire(champ, 'keydown', { key: 'Escape' });

  assert.equal(champ.value, 'Veille 2', 'Échap rétablit le nom enregistré');
  assert.equal(app.collection('veille').name, 'Veille 2', 'et n\'écrit rien');
  assert.equal(app.node('collection-name-save').disabled, true);
});

test('un nom vide s\'enregistre comme vide, une fois validé', async () => {
  const app = await demarrer({ active: 'veille' });
  const champ = await app.taper('   ');

  // Toujours rien d'écrit tant que le nom n'est pas validé.
  assert.equal(app.collection('veille').name, 'Veille');
  await fire(champ, 'keydown', { key: 'Enter' });

  assert.equal(app.collection('veille').name, '', 'le vide est écrit');
  assert.deepEqual(app.options(), ['Mes liens', 'Mes liens']);
  assert.match(app.node('collection-hint').textContent, /Mes liens/);
});

test('un nom déjà pris est refusé, et la saisie reste à corriger', async () => {
  const app = await demarrer({ active: 'default' });
  const champ = await app.taper('Veille');

  await fire(champ, 'keydown', { key: 'Enter' });

  assert.equal(app.collection('default').name, '', 'rien n\'est écrit');
  assert.match(app.node('toast').textContent, /Une collection porte déjà ce nom/);
  assert.equal(champ.value, 'Veille', 'la saisie refusée reste dans le champ');
  assert.equal(app.node('collection-name-save').disabled, false, 'elle attend toujours');
});

// ---------------------------------------------------------------------------
// « Nouvelle » reprend le nom saisi
// ---------------------------------------------------------------------------

test('« Nouvelle » crée la collection portant le nom saisi', async () => {
  const app = await demarrer();
  await app.taper('Cartons 2026');

  await fire(app.node('collection-add'), 'click');

  const creee = app.collections().find((item) => item.name === 'Cartons 2026');
  assert.ok(creee, 'la collection est créée avec le nom saisi');
  assert.equal(app.collection('default').name, '', 'la collection affichée garde son nom');
  assert.equal(app.node('collection-select').value, creee.id, 'et la nouvelle est affichée');
  assert.equal(app.node('collection-name').value, 'Cartons 2026');
  assert.equal(app.node('collection-name-save').disabled, true, 'rien n\'attend plus');
  assert.equal(app.area.data[ACTIVE_COLLECTION_KEY].normal, creee.id);
});

test('« Nouvelle » sans nom saisi propose « Nouvelle collection », puis « 2 »', async () => {
  const app = await demarrer();

  await fire(app.node('collection-add'), 'click');
  await fire(app.node('collection-add'), 'click');

  assert.deepEqual(
    app.collections().map((item) => item.name),
    ['', 'Veille', 'Nouvelle collection', 'Nouvelle collection 2'],
  );
});

test('« Nouvelle » refuse un nom déjà pris, sans créer de collection', async () => {
  const app = await demarrer();
  const champ = await app.taper('Veille');

  await fire(app.node('collection-add'), 'click');

  assert.equal(app.collections().length, 2, 'aucune collection créée');
  assert.match(app.node('toast').textContent, /Une collection porte déjà ce nom/);
  assert.equal(champ.value, 'Veille', 'la saisie reste à corriger');
  assert.equal(app.node('collection-select').value, 'default');
});

// ---------------------------------------------------------------------------
// Ce qui arrive au nom en attente quand on s'en va
// ---------------------------------------------------------------------------

test('changer de collection abandonne un nom en attente, et le dit', async () => {
  const app = await demarrer({ active: 'veille' });
  const champ = await app.taper('Brouillon');

  const select = app.node('collection-select');
  select.value = 'default';
  await fire(select, 'change');

  assert.equal(app.collection('veille').name, 'Veille', 'le nom n\'a pas été emporté');
  assert.equal(champ.value, '', 'le champ montre la collection qui s\'affiche');
  assert.match(app.node('toast').textContent, /Nom en attente abandonné/);
  assert.equal(app.node('collection-name-save').disabled, true);
});

test('une relecture venue du stockage ne vole pas le nom en cours de saisie', async () => {
  const app = await demarrer({ active: 'veille' });
  const champ = await app.taper('Brouillon');

  // Une autre surface — la fenêtre de l'extension, un second onglet — ajoute un
  // lien : l'application relit le stockage et redessine.
  await app.area.set({ links: [lien('l1', 'https://exemple.fr/nouveau', 'veille')] });
  assert.ok(
    await until(() => app.node('list').children.length === 1),
    'la relecture n\'a pas eu lieu',
  );

  // Le redessin ne doit pas emporter ce qu'on est en train de taper.
  assert.equal(champ.value, 'Brouillon', 'la saisie survit au redessin');
  assert.equal(app.node('collection-name-save').disabled, false);
  assert.equal(app.collection('veille').name, 'Veille', 'et rien n\'a été écrit');
});

test('un renommage venu d\'ailleurs remplace le champ, sans passer pour une saisie', async () => {
  const app = await demarrer({ active: 'veille' });
  const champ = app.node('collection-name');
  assert.equal(champ.value, 'Veille');

  // Un second onglet de l'application renomme la collection affichée. Le champ
  // n'a pas été touché ici : il n'y a donc rien en attente, et le nouveau nom
  // doit s'afficher — sinon un Entrée écraserait le renommage de l'autre onglet.
  const doc = structuredClone(app.area.data[COLLECTIONS_KEY]);
  doc.items.find((item) => item.id === 'veille').name = 'Veille tech';
  await app.area.set({ [COLLECTIONS_KEY]: doc });

  assert.ok(
    await until(() => app.options().includes('Veille tech')),
    'la relecture n\'a pas eu lieu',
  );
  assert.equal(champ.value, 'Veille tech', 'le champ suit le nom venu d\'ailleurs');
  assert.equal(app.node('collection-name-save').disabled, true, 'et rien n\'attend');
  assert.equal(app.node('collection-hint').hidden, true, 'pas d\'aide d\'attente');
  assert.equal(globalThis.document.title, 'Veille tech — URLQRCodePrinter');
});

test('une saisie en cours survit à un renommage venu d\'ailleurs', async () => {
  const app = await demarrer({ active: 'veille' });
  const champ = await app.taper('Brouillon');

  const doc = structuredClone(app.area.data[COLLECTIONS_KEY]);
  doc.items.find((item) => item.id === 'veille').name = 'Veille tech';
  await app.area.set({ [COLLECTIONS_KEY]: doc });
  assert.ok(
    await until(() => app.options().includes('Veille tech')),
    'la relecture n\'a pas eu lieu',
  );

  // Ce que l'utilisateur tape n'est pas effacé par une écriture extérieure : il
  // peut encore valider son nom, ou l'abandonner.
  assert.equal(champ.value, 'Brouillon', 'la saisie est conservée');
  assert.equal(app.node('collection-name-save').disabled, false);
});

test('un champ vidé n\'annonce pas que « Nouvelle » reprendra un nom', async () => {
  // Vider le champ, c'est enregistrer un nom vide : « Nouvelle » ne prendra pas
  // ce vide, il retombera sur « Nouvelle collection ». L'aide ne doit pas
  // promettre le contraire.
  const app = await demarrer({ active: 'veille' });
  await app.taper('   ');

  assert.match(app.node('collection-hint').textContent, /Nom en attente/);
  assert.doesNotMatch(app.node('collection-hint').textContent, /« Nouvelle »/);
  assert.equal(app.node('collection-add').title, '');
});

test('en navigation privée, le nom n\'est pas modifiable', async () => {
  // La collection privée est synthétisée, jamais écrite : son nom ne peut pas
  // être enregistré. Le champ est donc désactivé, au lieu de laisser activer
  // une commande que le cœur refuserait.
  const app = await demarrer({ prive: true });
  assert.equal(app.node('collection-select').value, 'private');
  assert.equal(app.node('collection-name').disabled, true);
  assert.equal(app.node('collection-name-save').disabled, true);
  assert.equal(app.node('collection-delete').disabled, true, 'la collection privée ne se supprime pas');
  assert.match(app.node('collection-hint').textContent, /Navigation privée/);
});

// ---------------------------------------------------------------------------
// Supprimer une collection
// ---------------------------------------------------------------------------

/** Deux liens rangés dans la collection « Veille ». */
const liensDeVeille = [
  lien('v1', 'https://exemple.fr/un', 'veille'),
  lien('v2', 'https://exemple.fr/deux', 'veille'),
];

test('« Supprimer » demande confirmation, et n\'efface rien au premier clic', async () => {
  const app = await demarrer({ active: 'veille', links: liensDeVeille });
  const question = app.node('collection-delete-confirm');
  assert.equal(question.hidden, true, 'aucune question au repos');

  await fire(app.node('collection-delete'), 'click');

  assert.equal(question.hidden, false, 'la question est posée');
  const texte = app.node('collection-delete-confirm-text').textContent;
  assert.match(texte, /Supprimer la collection « Veille » \?/);
  assert.match(texte, /2 liens seront perdus/);
  assert.equal(app.node('collection-delete').getAttribute('aria-expanded'), 'true');

  // Rien n'est effacé tant qu'on n'a pas confirmé : la question n'est pas un
  // geste, et la collection est toujours là.
  assert.ok(app.collection('veille'), 'la collection est toujours là');
  assert.equal(app.area.data[LINKS_KEY].length, 2, 'les liens sont toujours là');
});

test('« Annuler » referme la question sans rien supprimer', async () => {
  const app = await demarrer({ active: 'veille', links: liensDeVeille });
  await fire(app.node('collection-delete'), 'click');

  await fire(app.node('collection-delete-cancel'), 'click');

  assert.equal(app.node('collection-delete-confirm').hidden, true, 'la question est refermée');
  assert.equal(app.node('collection-delete').getAttribute('aria-expanded'), 'false');
  assert.ok(app.collection('veille'), 'la collection est intacte');
  assert.equal(app.area.data[LINKS_KEY].length, 2, 'les liens aussi');
});

test('confirmer supprime la collection et ses liens', async () => {
  const app = await demarrer({ active: 'veille', links: liensDeVeille });
  await fire(app.node('collection-delete'), 'click');

  await fire(app.node('collection-delete-confirm-yes'), 'click');

  assert.equal(app.collections().some((item) => item.id === 'veille'), false, 'la collection est partie');
  assert.equal(app.area.data[LINKS_KEY].length, 0, 'ses liens sont partis avec elle');
  assert.equal(app.node('collection-delete-confirm').hidden, true, 'la question se referme');
  assert.equal(app.node('collection-select').value, 'default', 'une autre collection s\'affiche');
  assert.match(app.node('toast').textContent, /Collection supprimée/);
});

test('la dernière collection ne se supprime pas, et n\'ouvre pas de question', async () => {
  const app = await demarrer({
    collections: [{ id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 }],
  });
  assert.equal(app.node('collection-delete').disabled, true, 'la commande est refusée');

  // Un clic ne doit rien ouvrir : la règle est tenue des deux côtés.
  await fire(app.node('collection-delete'), 'click');
  assert.equal(app.node('collection-delete-confirm').hidden, true);
  assert.equal(app.collection('default') !== undefined, true);
});

// ---------------------------------------------------------------------------
// La page web autonome
// ---------------------------------------------------------------------------

test('hors extension, le nom s\'enregistre aussi sur validation', async () => {
  // La page autonome n'a qu'une collection, adossée aux réglages d'avant : le
  // même geste y vaut, sans bouton « Nouvelle ».
  delete globalThis.chrome;
  const donnees = new Map();
  globalThis.localStorage = {
    getItem: (cle) => (donnees.has(cle) ? donnees.get(cle) : null),
    setItem: (cle, valeur) => donnees.set(cle, String(valeur)),
    removeItem: (cle) => donnees.delete(cle),
  };

  const { registry, bootError } = await bootApp({ distWeb: DIST_WEB });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);
  assert.equal(registry.get('collection-picker').hidden, true, 'pas de sélecteur hors extension');

  const champ = registry.get('collection-name');
  champ.value = 'Mon classeur';
  await fire(champ, 'input');

  assert.equal(donnees.has(SETTINGS_KEY), false, 'la frappe n\'écrit pas les réglages');
  assert.equal(registry.get('collection-name-save').disabled, false);

  await fire(champ, 'keydown', { key: 'Enter' });

  const reglages = JSON.parse(donnees.get(SETTINGS_KEY));
  assert.equal(reglages.collectionName, 'Mon classeur', 'Entrée écrit le réglage');
  assert.equal(registry.get('collection-name-save').disabled, true);
  assert.equal(globalThis.document.title, 'Mon classeur — URLQRCodePrinter', 'le titre suit');
});
