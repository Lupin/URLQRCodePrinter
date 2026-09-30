/**
 * Les collections : le rangement des liens, et ses règles.
 *
 * Réécrit après une perte accidentelle du fichier d'origine (nettoyage de
 * doublons iCloud ayant emporté des fichiers non commités). Les règles couvertes
 * sont celles du module, telles que son en-tête les énonce :
 *
 * - **il reste toujours une collection** — la collection par défaut n'est
 *   synthétisée que si la liste est vide, sinon elle serait impérissable ;
 * - **la collection privée n'est jamais écrite** — elle est synthétisée en
 *   contexte privé, et aucune opération ne l'accepte pour cible ;
 * - **les opérations impossibles lèvent**, avec un code exploitable, au lieu de
 *   deviner ce que l'utilisateur voulait.
 *
 * Le module ne touche ni DOM ni `chrome.*` : la zone de stockage est injectée, et
 * le substitut employé ici a la forme exacte de `chrome.storage.local` — un
 * `get(clé)` qui rend `{ [clé]: valeur }`, un `set(patch)`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTIVE_COLLECTION_KEY,
  COLLECTION_NAME_MAX,
  COLLECTION_NOTE_MAX,
  COLLECTIONS_KEY,
  COLLECTIONS_VERSION,
  CollectionError,
  DEFAULT_COLLECTION_ID,
  DEFAULT_COLLECTION_NAME,
  DEFAULT_START_INDEX,
  PRIVATE_COLLECTION_ID,
  START_INDEX_MAX,
  START_INDEX_MIN,
  cleanStartIndex,
  collectionDisplayName,
  collectionOf,
  createCollection,
  createCollectionStore,
  freeCollectionName,
  isPrivateCollection,
  isPrivateContext,
  privateCollection,
  sanitizeActive,
  sanitizeCollections,
  visibleCollections,
} from '../src/core/collections.js';

/**
 * Zone de stockage simulée, à la forme de `chrome.storage.local`.
 *
 * @param {object} [initial]
 * @returns {{ data: object, get: Function, set: Function, writes: number }}
 */
function zone(initial = {}) {
  const data = { ...initial };
  const area = {
    data,
    writes: 0,
    async get(key) {
      return { [key]: data[key] };
    },
    async set(patch) {
      area.writes += 1;
      Object.assign(data, patch);
    },
  };
  return area;
}

/** Zone qui refuse tout : quota atteint, ou mode privé restrictif. */
function zoneEnPanne() {
  return {
    async get() {
      throw new Error('stockage indisponible');
    },
    async set() {
      throw new Error('stockage indisponible');
    },
  };
}

/** Identifiant : le module en fabrique, on ne les devine pas. */
const idDe = (collection) => collection.id;

/** La collection par défaut, telle qu'un document vide la rend. */
function defaut() {
  return { id: DEFAULT_COLLECTION_ID, name: '', note: '', startIndex: DEFAULT_START_INDEX, createdAt: 0 };
}

// ---------------------------------------------------------------------------
// Le contexte privé, et la collection d'un lien
// ---------------------------------------------------------------------------

test('le contexte privé se lit sur l\'onglet, puis sur l\'API', () => {
  // L'onglet d'abord — c'est **cette** page qui est privée — et l'API en
  // complément : le service worker n'a pas d'onglet à interroger.
  assert.equal(isPrivateContext({ tabIncognito: true }), true);
  assert.equal(isPrivateContext({ inIncognitoContext: true }), true);
  assert.equal(isPrivateContext({ inIncognitoContext: 'yes' }), true, 'toute valeur truthy compte');
  assert.equal(isPrivateContext({ tabIncognito: false, inIncognitoContext: false }), false);
  assert.equal(isPrivateContext({}), false);
  assert.equal(isPrivateContext(), false);
});

test('un lien sans collection appartient à la collection par défaut', () => {
  // Les liens enregistrés avant que ce module existe n'ont pas de
  // `collectionId` : ils ne sont pas perdus, et ils ne sont pas réécrits.
  assert.equal(collectionOf({}), DEFAULT_COLLECTION_ID);
  assert.equal(collectionOf({ collectionId: '' }), DEFAULT_COLLECTION_ID);
  assert.equal(collectionOf({ collectionId: '   ' }), DEFAULT_COLLECTION_ID);
  assert.equal(collectionOf({ collectionId: 42 }), DEFAULT_COLLECTION_ID);
  assert.equal(collectionOf(), DEFAULT_COLLECTION_ID);
  // Un identifiant écrit avec des espaces est nettoyé, pas rejeté.
  assert.equal(collectionOf({ collectionId: ' veille ' }), 'veille');
});

test('la collection privée se reconnaît à son identifiant réservé', () => {
  assert.equal(isPrivateCollection(PRIVATE_COLLECTION_ID), true);
  assert.equal(isPrivateCollection({ id: PRIVATE_COLLECTION_ID }), true);
  assert.equal(isPrivateCollection(DEFAULT_COLLECTION_ID), false);
  assert.equal(isPrivateCollection({}), false);
  assert.equal(isPrivateCollection(), false);
});

// ---------------------------------------------------------------------------
// La fabrication d'une collection
// ---------------------------------------------------------------------------

test('une collection créée reçoit un identifiant, et ses champs sont bornés', () => {
  const creee = createCollection({ name: '  Veille  ', note: 'x'.repeat(COLLECTION_NOTE_MAX + 50) }, { now: 1000 });
  assert.equal(creee.name, 'Veille', 'le nom est nettoyé');
  assert.equal(creee.note.length, COLLECTION_NOTE_MAX, 'la note est bornée');
  assert.equal(creee.createdAt, 1000);
  assert.equal(creee.startIndex, DEFAULT_START_INDEX);
  assert.ok(creee.id.length > 0);

  // Un nom trop long est tronqué, pas refusé : c'est une contrainte de format,
  // pas une erreur d'utilisateur.
  assert.equal(createCollection({ name: 'n'.repeat(COLLECTION_NAME_MAX + 20) }).name.length, COLLECTION_NAME_MAX);
});

test('l\'identifiant réservé n\'est jamais attribué à une collection ordinaire', () => {
  // Sinon une collection ordinaire prendrait la place de la collection privée,
  // qui n'est, elle, jamais stockée.
  const creee = createCollection({ id: PRIVATE_COLLECTION_ID, name: 'Veille' });
  assert.notEqual(creee.id, PRIVATE_COLLECTION_ID);
  assert.equal(createCollection({ id: '  ' }).id.length > 0, true, 'un identifiant vide en reçoit un');
  assert.equal(createCollection({ id: ' ma-veille ' }).id, 'ma-veille', 'un identifiant fourni est conservé');
});

test('le premier numéro est borné, jamais refusé', () => {
  // Un utilisateur qui tape 100000 veut une série longue, pas une erreur ; et un
  // champ vidé pour être retapé ne doit pas faire passer la numérotation par
  // zéro — c'est le piège de `Number('')`, qui vaut 0.
  assert.equal(cleanStartIndex(''), DEFAULT_START_INDEX);
  assert.equal(cleanStartIndex(null), DEFAULT_START_INDEX);
  assert.equal(cleanStartIndex(undefined), DEFAULT_START_INDEX);
  assert.equal(cleanStartIndex('abc'), DEFAULT_START_INDEX);
  assert.equal(cleanStartIndex(NaN), DEFAULT_START_INDEX);
  assert.equal(cleanStartIndex(0), START_INDEX_MIN);
  assert.equal(cleanStartIndex('-5'), START_INDEX_MIN);
  assert.equal(cleanStartIndex(100000), START_INDEX_MAX);
  assert.equal(cleanStartIndex(3.7), 3, 'on numérote des objets, pas des mesures');
  assert.equal(cleanStartIndex('12'), 12);
});

test('la collection privée est synthétisée, jamais écrite', () => {
  const privee = privateCollection((m) => m);
  assert.equal(privee.id, PRIVATE_COLLECTION_ID);
  assert.equal(privee.private, true, 'l\'interface s\'y fie pour l\'annoncer');
  assert.equal(privee.name, 'Navigation privée');
  assert.equal(privee.startIndex, DEFAULT_START_INDEX);
  // Son nom passe par le traducteur : c'est un libellé, pas une donnée.
  assert.equal(privateCollection(() => 'Private browsing').name, 'Private browsing');
});

// ---------------------------------------------------------------------------
// Ce qui se lit dans le stockage
// ---------------------------------------------------------------------------

test('un document vide rend la collection par défaut, et elle seule', () => {
  const vide = sanitizeCollections(null);
  assert.equal(vide.version, COLLECTIONS_VERSION);
  assert.equal(vide.migratedAt, 0);
  assert.deepEqual(vide.items, [defaut()]);
  // Un tableau nu est accepté : une valeur écrite à la main ne doit pas rendre
  // toutes les collections invisibles.
  assert.deepEqual(sanitizeCollections([]).items, [defaut()]);
  assert.deepEqual(sanitizeCollections({ items: [] }).items, [defaut()]);
});

test('la collection par défaut n\'est pas réinjectée quand une autre existe', () => {
  // Sinon la supprimer serait sans effet : elle reviendrait à la lecture
  // suivante, alors que c'est un rangement légitime.
  const sansDefaut = sanitizeCollections({ items: [createCollection({ id: 'veille', name: 'Veille' })] });
  assert.deepEqual(sansDefaut.items.map(idDe), ['veille']);
});

test('une entrée illisible est écartée, et n\'emporte pas les autres', () => {
  const document = sanitizeCollections({
    items: [
      null,
      'texte',
      { id: '' },
      { id: '   ' },
      { id: PRIVATE_COLLECTION_ID, name: 'Navigation privée' },
      { id: 'veille', name: 'Veille' },
      { id: 'veille', name: 'Veille (copie)' },
      42,
    ],
  });
  assert.deepEqual(document.items.map(idDe), ['veille']);
  assert.equal(document.items[0].name, 'Veille', 'la première entrée gagne');
});

test('la collection par défaut se place en tête, puis l\'ordre de création', () => {
  const document = sanitizeCollections({
    items: [
      { id: 'c', createdAt: 300 },
      { id: 'a', createdAt: 100 },
      { id: DEFAULT_COLLECTION_ID, createdAt: 999 },
      { id: 'b', createdAt: 200 },
    ],
  });
  assert.deepEqual(document.items.map(idDe), [DEFAULT_COLLECTION_ID, 'a', 'b', 'c']);
  // `migratedAt` est une donnée du document, pas une collection : elle survit.
  assert.equal(sanitizeCollections({ migratedAt: 1234 }).migratedAt, 1234);
});

test('la collection courante se mémorise par contexte', () => {
  // Deux champs, un par contexte : confondre la collection d'une fenêtre
  // ordinaire et celle d'une fenêtre privée ferait basculer l'utilisateur d'une
  // collection à l'autre selon la fenêtre qu'il ouvre.
  assert.deepEqual(sanitizeActive(null), { normal: '', private: '' });
  assert.deepEqual(sanitizeActive({ normal: ' veille ', private: 42 }), { normal: 'veille', private: '' });
  assert.deepEqual(sanitizeActive('veille'), { normal: '', private: '' });
});

test('la collection privée n\'est visible qu\'en contexte privé, et en dernier', () => {
  const items = [createCollection({ id: 'veille', name: 'Veille', createdAt: 5 })];
  assert.deepEqual(visibleCollections(items).map(idDe), ['veille']);
  assert.deepEqual(
    visibleCollections(items, { isPrivate: true }).map(idDe),
    ['veille', PRIVATE_COLLECTION_ID],
  );
  // C'est la seule fonction qui décide de cette visibilité : les appelants ne
  // filtrent pas eux-mêmes, sinon la règle vivrait à trois endroits.
  assert.equal(visibleCollections(items, { isPrivate: true }).at(-1).private, true);
});

test('un nom vide affiche le nom intégré, traduit', () => {
  assert.equal(collectionDisplayName({ name: '' }, (m) => m), DEFAULT_COLLECTION_NAME);
  assert.equal(collectionDisplayName({ name: '  ' }, (m) => m), DEFAULT_COLLECTION_NAME);
  assert.equal(collectionDisplayName({}, (m) => m), DEFAULT_COLLECTION_NAME);
  assert.equal(collectionDisplayName(undefined, (m) => m), DEFAULT_COLLECTION_NAME);
  assert.equal(collectionDisplayName({ name: 'Veille' }, (m) => m), 'Veille');
  // Traduit au moment de l'affichage, jamais écrit dans le stockage.
  assert.equal(collectionDisplayName({ name: '' }, () => 'My links'), 'My links');
});

test('un nom libre se dérive du nom souhaité, jamais deux fois le même', () => {
  // Le nom vient d'un fichier importé ou d'un bouton qui propose : le refus
  // d'un doublon obligerait à en inventer un autre à la main.
  const veille = { id: 'veille', name: 'Veille' };
  assert.equal(freeCollectionName('Projet', [veille]), 'Projet');
  assert.equal(freeCollectionName('Veille', [veille]), 'Veille 2');
  // Le candidat garde la casse et les accents demandés : c'est le **contrôle**
  // du doublon qui les ignore, pas le nom rendu.
  assert.equal(freeCollectionName('  veille  ', [veille]), 'veille 2');
  assert.equal(freeCollectionName('VEILLÉ', [veille]), 'VEILLÉ 2');
  assert.equal(
    freeCollectionName('Veille', [veille, { name: 'VEILLE 2' }, { name: 'veille 3' }]),
    'Veille 4',
  );

  // Un nom vide n'est pas un nom : c'est le libellé intégré qui est proposé —
  // traduit, puisque c'est un libellé d'interface.
  assert.equal(freeCollectionName('', [veille], () => 'My links'), 'My links');
  assert.equal(freeCollectionName(null, [], (m) => m), DEFAULT_COLLECTION_NAME);

  // Un nom à la longueur maximale ne peut pas s'allonger : le rang est alors
  // pris **sur** le nom, sans quoi la recherche ne trouverait jamais de place.
  const long = 'n'.repeat(COLLECTION_NAME_MAX);
  const candidat = freeCollectionName(long, [{ name: long }]);
  assert.notEqual(candidat, long, 'le candidat doit différer du nom déjà pris');
  assert.equal(candidat.length, COLLECTION_NAME_MAX);
  assert.equal(candidat.endsWith(' 2'), true);
});

// ---------------------------------------------------------------------------
// Le magasin, adossé à une zone de stockage
// ---------------------------------------------------------------------------

test('sans zone de stockage, le magasin vit sur la collection par défaut', async () => {
  const magasin = createCollectionStore();
  assert.equal(magasin.available, false);
  assert.deepEqual((await magasin.list()).map(idDe), [DEFAULT_COLLECTION_ID]);
  assert.equal(await magasin.ensureDefault(), false, 'rien à retrouver à la prochaine ouverture');
  assert.equal(await magasin.needsMigration(), true);
  // Rien n'a pu être écrit : la migration reste à faire, et le prochain
  // démarrage la retentera. C'est  qui fait foi — le retour de
  //  ne dit que « il y avait quelque chose à marquer ».
  await magasin.markMigrated();
  assert.equal(await magasin.needsMigration(), true);
});

test('ensureDefault matérialise la collection une fois, pas à chaque lecture', async () => {
  const area = zone();
  const magasin = createCollectionStore({ area });

  assert.equal(await magasin.ensureDefault(), true, 'la première ouverture écrit');
  assert.equal(await magasin.ensureDefault(), false, 'la suivante n\'a plus rien à faire');
  assert.equal(area.writes, 1, 'une écriture par installation, et non par ouverture');
  assert.deepEqual(Object.keys(area.data), [COLLECTIONS_KEY]);
  assert.deepEqual(magasin ? (await magasin.list()).map(idDe) : [], [DEFAULT_COLLECTION_ID]);
});

test('une panne de stockage ne lève pas : elle laisse la collection par défaut', async () => {
  const magasin = createCollectionStore({ area: zoneEnPanne() });
  assert.equal(magasin.available, true, 'la zone existe, elle échoue');
  assert.deepEqual((await magasin.list()).map(idDe), [DEFAULT_COLLECTION_ID]);
  assert.equal(await magasin.ensureDefault(), false);
  assert.equal(await magasin.getActive(), DEFAULT_COLLECTION_ID);
  // Seules les opérations **impossibles** lèvent — pas les pannes.
  await assert.rejects(() => magasin.rename('inconnue', 'Veille'), (error) => error.code === 'unknown');
});

test('créer une collection refuse un nom vide ou déjà pris', async () => {
  const magasin = createCollectionStore({ area: zone(), now: () => 1000 });
  await magasin.create('Veille');

  await assert.rejects(
    () => magasin.create('   '),
    (error) => error instanceof CollectionError && error.code === 'empty-name',
  );
  // Le contrôle du doublon ignore la casse et les accents : deux collections
  // « Veille » et « veille » seraient indiscernables dans la fenêtre.
  await assert.rejects(
    () => magasin.create('veille'),
    (error) => error.code === 'duplicate-name',
  );
  await assert.rejects(
    () => magasin.create('VEILLÉ'),
    (error) => error.code === 'duplicate-name',
  );

  const creee = await magasin.create('Projet');
  assert.equal(creee.name, 'Projet');
  assert.equal(creee.createdAt, 1000);
  const veille = (await magasin.list()).find((item) => item.name === 'Veille');
  assert.deepEqual((await magasin.list()).map(idDe), [DEFAULT_COLLECTION_ID, veille.id, creee.id]);
});

test('renommer ne touche qu\'une collection, et garde son rang', async () => {
  const area = zone();
  const magasin = createCollectionStore({ area, now: () => 1000 });
  const veille = await magasin.create('Veille');
  await magasin.setStartIndex(veille.id, 40);

  const renommee = await magasin.rename(veille.id, '  Veille tech  ');
  assert.equal(renommee.name, 'Veille tech');
  assert.equal(renommee.id, veille.id);
  assert.equal(renommee.startIndex, 40, 'renommer ne réinitialise pas la numérotation');

  // Le doublon se juge **hors** de la collection renommée : se renommer
  // elle-même n'est pas un conflit.
  assert.equal((await magasin.rename(veille.id, 'Veille tech')).name, 'Veille tech');

  await magasin.create('Projet');
  await assert.rejects(
    () => magasin.rename(veille.id, 'projet'),
    (error) => error.code === 'duplicate-name',
  );
  await assert.rejects(
    () => magasin.rename('inconnue', 'Autre'),
    (error) => error.code === 'unknown',
  );
});

test('vider le nom d\'une collection l\'enregistre vide, et l\'affiche au nom intégré', async () => {
  // Le défaut d'origine : un champ vidé n'écrivait rien, l'ancien nom restait
  // dans le magasin, et rien à l'écran ne le disait. Un nom vide est désormais
  // un nom comme un autre — il est écrit, et l'affichage retombe sur le libellé
  // intégré.
  const area = zone();
  const magasin = createCollectionStore({ area, now: () => 1000 });
  const veille = await magasin.create('Veille');

  const videe = await magasin.rename(veille.id, '   ');
  assert.equal(videe.name, '');
  assert.equal(videe.id, veille.id, 'la collection vidée est la même');
  assert.equal(
    collectionDisplayName((await magasin.list()).find((item) => item.id === veille.id), (m) => m),
    DEFAULT_COLLECTION_NAME,
  );

  // Deux collections sans nom ne se disputent rien : refuser le vide parce
  // qu'une autre n'a pas de nom interdirait de vider la seconde.
  const autre = await magasin.create('Projet');
  assert.equal((await magasin.rename(autre.id, '')).name, '');
  assert.equal((await magasin.list()).length, 3);

  // Le nom vide n'est pas un doublon non plus à la création d'une autre : le
  // contrôle des noms ne porte que sur ce qui est nommé.
  assert.equal((await magasin.create('Veille')).name, 'Veille');
});

test('la collection privée n\'est ni renommable, ni supprimable, ni modifiable', async () => {
  const magasin = createCollectionStore({ area: zone() });
  for (const operation of [
    () => magasin.rename(PRIVATE_COLLECTION_ID, 'Autre'),
    () => magasin.setNote(PRIVATE_COLLECTION_ID, 'note'),
    () => magasin.setStartIndex(PRIVATE_COLLECTION_ID, 3),
    () => magasin.remove(PRIVATE_COLLECTION_ID),
  ]) {
    await assert.rejects(operation, (error) => error.code === 'reserved');
  }
});

test('la note est bornée, et le premier numéro aussi', async () => {
  const magasin = createCollectionStore({ area: zone(), now: () => 1 });
  const veille = await magasin.create('Veille');

  const notee = await magasin.setNote(veille.id, `  ${'n'.repeat(COLLECTION_NOTE_MAX + 30)}  `);
  assert.equal(notee.note.length, COLLECTION_NOTE_MAX);
  assert.equal((await magasin.setNote(veille.id, 42)).note, '', 'une note non textuelle est vide');

  assert.equal((await magasin.setStartIndex(veille.id, '')).startIndex, DEFAULT_START_INDEX);
  assert.equal((await magasin.setStartIndex(veille.id, 100000)).startIndex, START_INDEX_MAX);
  assert.equal((await magasin.setStartIndex(veille.id, -9)).startIndex, START_INDEX_MIN);
});

test('toutes les collections se suppriment, sauf la dernière', async () => {
  const area = zone();
  const magasin = createCollectionStore({ area, now: () => 1000 });
  // Sur un magasin neuf, la collection par défaut existe déjà : elle est
  // synthétisée à la lecture, et elle est seule — elle ne peut donc pas partir.
  await assert.rejects(
    () => magasin.remove(DEFAULT_COLLECTION_ID),
    (error) => error.code === 'last',
  );

  const veille = await magasin.create('Veille');
  // La collection par défaut n'a rien de particulier : la supprimer quand une
  // autre existe est un rangement légitime.
  assert.equal(await magasin.remove(DEFAULT_COLLECTION_ID), true);
  assert.deepEqual((await magasin.list()).map(idDe), [veille.id]);

  // La dernière, elle, ne peut pas partir : la fenêtre n'aurait plus où
  // enregistrer.
  await assert.rejects(
    () => magasin.remove(veille.id),
    (error) => error.code === 'last',
  );
  assert.equal(await magasin.remove('inconnue'), false, 'un identifiant inconnu rend false');

  const projet = await magasin.create('Projet');
  assert.equal(await magasin.remove(veille.id), true);
  assert.deepEqual((await magasin.list()).map(idDe), [projet.id]);
});

test('supprimer la collection courante libère le pointeur', async () => {
  const area = zone();
  const magasin = createCollectionStore({ area, now: () => 1000 });
  const veille = await magasin.create('Veille');
  const projet = await magasin.create('Projet');

  await magasin.setActive(veille.id);
  assert.equal(await magasin.getActive(), veille.id);

  await magasin.remove(veille.id);
  // Sans cela, la fenêtre suivante s'ouvrirait sur un repli silencieux.
  assert.deepEqual(area.data[ACTIVE_COLLECTION_KEY], { normal: '', private: '' });
  assert.equal(await magasin.getActive(), DEFAULT_COLLECTION_ID, 'à défaut, la première collection visible');
  assert.equal((await magasin.getActive()) === projet.id, false, 'la première visible est la collection par défaut');
});

test('la collection courante se choisit par contexte', async () => {
  const area = zone();
  const magasin = createCollectionStore({ area, now: () => 1000 });
  const veille = await magasin.create('Veille');

  await magasin.setActive(veille.id);
  await magasin.setActive(DEFAULT_COLLECTION_ID, true);
  assert.equal(await magasin.getActive(), veille.id);
  // En contexte privé, 'default' est une collection visible comme une autre :
  // c'est elle qui est choisie, et non la collection privée — celle-ci n'est le
  // repli que faute de choix valide (cas éprouvé juste après).
  assert.equal(await magasin.getActive(true), DEFAULT_COLLECTION_ID);

  // Un identifiant mémorisé qui n'existe plus ne fait pas échouer la lecture :
  // on retombe sur une collection visible.
  await magasin.setActive('disparue');
  assert.equal(await magasin.getActive(), DEFAULT_COLLECTION_ID);
});

test('une fenêtre privée ouvre la collection privée, faute de choix', async () => {
  // L'inverse enverrait les premiers liens privés sur le disque sans que
  // personne ne l'ait demandé.
  const magasin = createCollectionStore({ area: zone() });
  assert.equal(await magasin.getActive(true), PRIVATE_COLLECTION_ID);
});

test('la migration se marque une fois, et se retient', async () => {
  const area = zone();
  const magasin = createCollectionStore({ area, now: () => 777 });
  assert.equal(await magasin.needsMigration(), true, 'un document sans `migratedAt` attend sa migration');
  assert.equal(await magasin.markMigrated(), true);
  assert.equal(await magasin.needsMigration(), false);
  assert.equal(await magasin.markMigrated(), false, 'la seconde fois, il n\'y a plus rien à faire');
  assert.equal(area.data[COLLECTIONS_KEY].migratedAt, 777);
});
