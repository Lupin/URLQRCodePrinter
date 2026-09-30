/**
 * Tests de la couche de persistance.
 * On teste le store mémoire (déterministe, sans IndexedDB) : il partage
 * exactement la même logique de dédoublonnage que les autres implémentations.
 *
 * Les collections ajoutent deux questions, traitées en fin de fichier : le
 * dédoublonnage est-il bien **par collection**, et une zone de stockage en
 * composition sait-elle router chaque écriture vers celle qui possède la
 * collection visée ? La seconde est la garantie qui empêche un lien de
 * navigation privée d'atterrir sur le disque.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createMemoryStore,
  createCompositeStore,
  sortByDateDesc,
  resolveDefaultStore,
  withCollection,
} from '../src/core/store.js';

import { PRIVATE_COLLECTION_ID, collectionOf } from '../src/core/collections.js';

const T0 = Date.UTC(2025, 0, 15, 10, 0);

test('un store neuf est vide', async () => {
  const store = createMemoryStore();
  assert.deepEqual(await store.list(), []);
});

test('add crée un lien complet et le persiste', async () => {
  const store = createMemoryStore();
  const { link, duplicate } = await store.add({ url: 'example.com', title: 'Ex' }, { now: T0 });

  assert.equal(duplicate, false);
  assert.equal(link.url, 'https://example.com');
  assert.equal((await store.list()).length, 1);
});

test('add refuse un doublon et renvoie l\'existant', async () => {
  const store = createMemoryStore();
  const first = await store.add({ url: 'https://example.com/a' }, { now: T0 });
  const second = await store.add({ url: 'https://www.example.com/a/' }, { now: T0 + 1000 });

  assert.equal(second.duplicate, true);
  assert.equal(second.link.id, first.link.id);
  assert.equal((await store.list()).length, 1);
});

test('add adopte un titre différent, au lieu de refuser le doublon', async () => {
  // Le cas courant d'une recollecte n'est pas un doublon, c'est une correction :
  // la page a changé de titre, ou on en a saisi un meilleur avant d'enregistrer.
  const store = createMemoryStore();
  const first = await store.add(
    { url: 'https://example.com/a', title: 'Ancien titre' },
    { now: T0 },
  );
  await store.put({ ...first.link, tags: ['veille'], order: 3 });

  const second = await store.add(
    { url: 'https://www.example.com/a/', title: 'Titre corrigé' },
    { now: T0 + 5000 },
  );

  assert.equal(second.duplicate, true);
  assert.equal(second.updated, true);
  assert.equal(second.link.id, first.link.id, 'le même lien, pas un second');
  assert.equal(second.link.title, 'Titre corrigé');
  // Ce qui n'était pas transmis ne bouge pas : une correction de titre ne doit
  // pas effacer un tag ni changer le rang.
  assert.deepEqual(second.link.tags, ['veille']);
  assert.equal(second.link.order, 3);
  assert.equal(second.link.createdAt, first.link.createdAt, 'la date de collecte est conservée');
  // La modification passe par le `put` du magasin, qui pose l'horloge réelle —
  // comme partout ailleurs. On vérifie donc qu'elle a bougé, pas sa valeur.
  assert.ok(second.link.updatedAt > first.link.updatedAt, 'la date de modification suit');

  const tous = await store.list();
  assert.equal(tous.length, 1);
  assert.equal(tous[0].title, 'Titre corrigé', 'la correction doit être persistée');
});

test('un titre identique, ou vide, ne réécrit rien', async () => {
  const store = createMemoryStore();
  const first = await store.add({ url: 'https://example.com/a', title: 'Le mien' }, { now: T0 });

  const identique = await store.add(
    { url: 'https://example.com/a', title: 'Le mien' },
    { now: T0 + 1000 },
  );
  assert.equal(identique.duplicate, true);
  assert.equal(identique.updated, false);
  assert.equal(identique.link.updatedAt, first.link.updatedAt, 'rien n\'a été écrit');

  // Un titre vide ne remplace pas un titre choisi : une absence n'est pas une
  // correction.
  const vide = await store.add({ url: 'https://example.com/a', title: '   ' }, { now: T0 + 2000 });
  assert.equal(vide.updated, false);
  assert.equal((await store.list())[0].title, 'Le mien');
});

test('add avec allowDuplicate force l\'insertion', async () => {
  const store = createMemoryStore();
  await store.add({ url: 'https://example.com/a' }, { now: T0 });
  await store.add({ url: 'https://example.com/a' }, { now: T0, allowDuplicate: true });
  assert.equal((await store.list()).length, 2);
});

test('list trie du plus récent au plus ancien', async () => {
  const store = createMemoryStore();
  await store.add({ url: 'https://a.com' }, { now: T0 });
  await store.add({ url: 'https://b.com' }, { now: T0 + 5000 });
  await store.add({ url: 'https://c.com' }, { now: T0 + 1000 });

  assert.deepEqual(
    (await store.list()).map((l) => l.url),
    ['https://b.com', 'https://c.com', 'https://a.com'],
  );
});

test('get retrouve par identifiant', async () => {
  const store = createMemoryStore();
  const { link } = await store.add({ url: 'https://a.com' }, { now: T0 });
  assert.equal((await store.get(link.id)).url, 'https://a.com');
  assert.equal(await store.get('inexistant'), undefined);
});

test('put met à jour updatedAt mais conserve createdAt', async () => {
  const store = createMemoryStore();
  const { link } = await store.add({ url: 'https://a.com' }, { now: T0 });
  const updated = await store.put({ ...link, title: 'Nouveau', note: 'x' });

  assert.equal(updated.title, 'Nouveau');
  assert.equal(updated.createdAt, T0);
  assert.ok(updated.updatedAt >= T0);
  assert.equal((await store.list())[0].title, 'Nouveau');
});

test('remove et clear', async () => {
  const store = createMemoryStore();
  const a = await store.add({ url: 'https://a.com' }, { now: T0 });
  await store.add({ url: 'https://b.com' }, { now: T0 });

  await store.remove(a.link.id);
  assert.equal((await store.list()).length, 1);

  await store.clear();
  assert.deepEqual(await store.list(), []);
});

test('putMany fusionne par identifiant', async () => {
  const store = createMemoryStore();
  const { link } = await store.add({ url: 'https://a.com', title: 'avant' }, { now: T0 });

  await store.putMany([
    { ...link, title: 'après' },
    { id: 'nouveau', url: 'https://z.com', title: '', note: '', tags: [], createdAt: T0, updatedAt: T0, source: 'import', favicon: '' },
  ]);

  const all = await store.list();
  assert.equal(all.length, 2);
  assert.equal(all.find((l) => l.id === link.id).title, 'après');
});

test('sortByDateDesc ne mute pas le tableau source', () => {
  const input = [
    { id: 'a', createdAt: 1 },
    { id: 'b', createdAt: 2 },
  ];
  const sorted = sortByDateDesc(input);
  assert.deepEqual(sorted.map((l) => l.id), ['b', 'a']);
  assert.deepEqual(input.map((l) => l.id), ['a', 'b']);
});

test('resolveDefaultStore retombe en mémoire sans IndexedDB ni chrome', () => {
  const { store, kind } = resolveDefaultStore({ prefer: 'memory' });
  assert.equal(kind, 'memory');
  assert.equal(typeof store.list, 'function');
});

test('toutes les implémentations exposent la même interface', () => {
  const methods = ['list', 'get', 'add', 'put', 'putMany', 'remove', 'clear'];
  const store = createMemoryStore();
  for (const method of methods) {
    assert.equal(typeof store[method], 'function', `méthode manquante : ${method}`);
  }
});

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

test('un add sans collection estampille la collection par défaut', async () => {
  // Les liens collectés sans consigne de rangement appartiennent à la
  // collection par défaut, celle qui existait déjà avant les collections.
  const store = createMemoryStore();
  const { link } = await store.add({ url: 'https://a.com' }, { now: T0 });
  assert.equal(link.collectionId, 'default');
  assert.equal(collectionOf(link), 'default');
});

test('un add sans collection vise la collection par défaut, et s\'y dédoublonne', async () => {
  // Le dédoublonnage est **toujours** borné à une collection : c'est la seule
  // règle qui tienne dans un produit où ranger veut dire pouvoir répéter une
  // adresse ailleurs. Sans collection demandée, la portée est donc la
  // collection par défaut — celle des liens collectés avant les collections.
  const store = createMemoryStore();
  await store.add({ url: 'https://a.com', collectionId: 'veille' }, { now: T0 });

  const nouveau = await store.add({ url: 'https://a.com' }, { now: T0 });
  assert.equal(nouveau.duplicate, false, 'la collection par défaut est distincte de « veille »');
  assert.equal(nouveau.link.collectionId, 'default');

  // Le suivant, lui, est bien un doublon de la collection par défaut.
  const doublon = await store.add({ url: 'https://www.a.com/' }, { now: T0 + 1000 });
  assert.equal(doublon.duplicate, true);
  assert.equal(doublon.link.id, nouveau.link.id);
});

test('la même adresse peut vivre dans deux collections', async () => {
  // C'est le sens du rangement : un même article peut être dans « Veille » et
  // dans « Projet ». Un dédoublonnage global l'interdirait.
  const store = createMemoryStore();
  const veille = withCollection(store, 'veille');
  const projet = withCollection(store, 'projet');

  const premier = await veille.add({ url: 'https://a.com' }, { now: T0 });
  const second = await projet.add({ url: 'https://a.com' }, { now: T0 });

  assert.equal(premier.duplicate, false);
  assert.equal(second.duplicate, false);
  assert.notEqual(premier.link.id, second.link.id);
  assert.equal((await store.list()).length, 2);
  assert.equal((await veille.list()).length, 1);
  assert.equal((await projet.list()).length, 1);
});

test('dans une collection, le doublon est toujours refusé', async () => {
  const store = createMemoryStore();
  const veille = withCollection(store, 'veille');
  const premier = await veille.add({ url: 'https://a.com' }, { now: T0 });
  const second = await veille.add({ url: 'https://www.a.com/' }, { now: T0 + 1000 });

  assert.equal(second.duplicate, true);
  assert.equal(second.link.id, premier.link.id);
  assert.equal((await veille.list()).length, 1);
});

test('une collection ne voit que ses liens, et ne supprime que les siens', async () => {
  const store = createMemoryStore();
  const veille = withCollection(store, 'veille');
  const projet = withCollection(store, 'projet');

  const article = await veille.add({ url: 'https://a.com', title: 'Article' }, { now: T0 });
  await projet.add({ url: 'https://b.com' }, { now: T0 });

  assert.deepEqual((await veille.list()).map((l) => l.url), ['https://a.com']);
  assert.deepEqual((await projet.list()).map((l) => l.url), ['https://b.com']);

  // Un identifiant qui appartient à une autre collection ne se supprime pas
  // depuis celle-ci : une ligne périmée ne doit pas emporter le voisin.
  await projet.remove(article.link.id);
  assert.equal((await veille.list()).length, 1);
  assert.equal(await projet.get(article.link.id), undefined);
  assert.equal((await veille.get(article.link.id)).id, article.link.id);
});

test('vider une collection laisse les autres intactes', async () => {
  const store = createMemoryStore();
  const veille = withCollection(store, 'veille');
  const projet = withCollection(store, 'projet');

  await veille.add({ url: 'https://a.com' }, { now: T0 });
  await veille.add({ url: 'https://b.com' }, { now: T0 });
  await projet.add({ url: 'https://c.com' }, { now: T0 });

  await veille.clear();

  assert.deepEqual(await veille.list(), []);
  assert.deepEqual((await projet.list()).map((l) => l.url), ['https://c.com']);
  assert.equal((await store.list()).length, 1);
});

test('les écritures d\'une collection portent son identifiant', async () => {
  const store = createMemoryStore();
  const veille = withCollection(store, 'veille');

  const { link } = await veille.add({ url: 'https://a.com' }, { now: T0 });
  const modifie = await veille.put({ ...link, title: 'Corrigé' });
  assert.equal(modifie.collectionId, 'veille');

  await veille.putMany([{ ...link, title: 'Importé' }]);
  const [relu] = await veille.list();
  assert.equal(relu.collectionId, 'veille');
  assert.equal(relu.title, 'Importé');
});

test('une collection sans identifiant retombe sur la collection par défaut', async () => {
  const store = createMemoryStore();
  const defaut = withCollection(store, '');
  await defaut.add({ url: 'https://a.com' }, { now: T0 });
  assert.equal((await store.list())[0].collectionId, 'default');
});

test('un store composé lit les deux zones et route les écritures', async () => {
  // Les liens ordinaires dans le stockage local, ceux de la navigation privée
  // dans la session : c'est le routage qui empêche une URL privée d'être
  // écrite sur le disque.
  const local = createMemoryStore();
  const session = createMemoryStore();
  const compose = createCompositeStore([
    { store: local, match: (id) => id !== PRIVATE_COLLECTION_ID },
    { store: session, match: (id) => id === PRIVATE_COLLECTION_ID },
  ]);

  await withCollection(compose, 'veille').add({ url: 'https://a.com' }, { now: T0 });
  await withCollection(compose, PRIVATE_COLLECTION_ID).add({ url: 'https://prive.com' }, { now: T0 });

  assert.deepEqual((await local.list()).map((l) => l.url), ['https://a.com']);
  assert.deepEqual((await session.list()).map((l) => l.url), ['https://prive.com']);
  assert.equal((await compose.list()).length, 2);

  const prive = (await compose.list()).find((l) => l.url === 'https://prive.com');
  await compose.put({ ...prive, title: 'Privé' });
  assert.deepEqual((await session.list()).map((l) => l.title), ['Privé']);
  assert.equal((await local.list())[0].title, '');

  await compose.remove(prive.id);
  assert.deepEqual(await session.list(), []);
  assert.equal((await local.list()).length, 1);
});

test('une écriture dont aucune zone ne veut est ignorée', async () => {
  // Mieux vaut un lien manquant qu'un lien privé écrit au mauvais endroit.
  const local = createMemoryStore();
  const compose = createCompositeStore([{ store: local, match: (id) => id !== PRIVATE_COLLECTION_ID }]);

  const { link } = await compose.add({ url: 'https://prive.com', collectionId: PRIVATE_COLLECTION_ID });
  assert.equal(link, undefined);
  assert.deepEqual(await local.list(), []);
});

test('un store composé sans zone reste utilisable', async () => {
  const compose = createCompositeStore();
  assert.deepEqual(await compose.list(), []);
  assert.equal(await compose.get('x'), undefined);
});

test('déplacer un lien d\'une zone à l\'autre n\'en laisse pas de copie', async () => {
  // Les liens ordinaires vivent sur le disque, ceux de la navigation privée en
  // mémoire de session. Déplacer de l'un à l'autre doit écrire d'un côté **et**
  // retirer de l'autre : sinon la même adresse vivrait deux fois, dont une copie
  // privée invisible en navigation normale — ou une copie sur le disque que
  // personne n'attendait.
  const local = createMemoryStore();
  const session = createMemoryStore();
  const compose = createCompositeStore([
    { store: local, match: (id) => id !== PRIVATE_COLLECTION_ID },
    { store: session, match: (id) => id === PRIVATE_COLLECTION_ID },
  ]);

  const prive = withCollection(compose, PRIVATE_COLLECTION_ID);
  await prive.add({ url: 'https://prive.fr/a', title: 'Privé' }, { now: T0 });
  const [enMemoire] = await session.list();
  assert.equal(enMemoire.collectionId, PRIVATE_COLLECTION_ID);

  // Vers une collection ordinaire : l'enregistrement garde son identifiant, et
  // quitte la session.
  const ordinaire = withCollection(compose, 'veille');
  await ordinaire.put(enMemoire);

  assert.deepEqual(await session.list(), [], 'la copie en mémoire doit partir');
  const [surDisque] = await local.list();
  assert.equal(surDisque.id, enMemoire.id, 'c\'est le même enregistrement, déplacé');
  assert.equal(surDisque.collectionId, 'veille');
  assert.equal(surDisque.title, 'Privé', 'rien d\'autre ne change');

  // Et le chemin inverse : du disque vers la mémoire de session.
  const [relu] = await ordinaire.list();
  await withCollection(compose, PRIVATE_COLLECTION_ID).put(relu);
  assert.deepEqual(await local.list(), [], 'la copie sur le disque doit partir');
  assert.equal((await session.list()).length, 1);
  assert.equal((await compose.list()).length, 1, 'un seul enregistrement, dans une seule zone');
});
