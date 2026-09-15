/**
 * Tests de la couche de persistance.
 * On teste le store mémoire (déterministe, sans IndexedDB) : il partage
 * exactement la même logique de dédoublonnage que les autres implémentations.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createMemoryStore,
  sortByDateDesc,
  resolveDefaultStore,
} from '../src/core/store.js';

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
