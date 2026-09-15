/**
 * Tests des réglages persistants.
 *
 * Ce qui compte ici : un réglage corrompu, inconnu ou refusé par le stockage ne
 * doit jamais empêcher l'application de démarrer, et ne doit jamais faire
 * disparaître une collection.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  sanitizeSettings,
  createSettingsStore,
} from '../src/core/settings.js';

/** Stockage factice, avec compteur d'écritures. */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    writes: 0,
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      this.writes += 1;
      map.set(key, String(value));
    },
  };
}

test('les valeurs par défaut ne raccourcissent rien', () => {
  assert.equal(DEFAULT_SETTINGS.targetMode, 'original');
  assert.ok(DEFAULT_SETTINGS.shortener.length > 0);
});

test('sanitizeSettings écarte une préférence inconnue', () => {
  assert.deepEqual(sanitizeSettings(undefined), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings('texte'), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings({ shortener: 'bitly' }), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings({ targetMode: 'raccourci' }), DEFAULT_SETTINGS);
  assert.deepEqual(
    sanitizeSettings({ shortener: 'isgd', targetMode: 'short' }),
    { shortener: 'isgd', targetMode: 'short' },
  );
});

test('les réglages survivent à un redémarrage', () => {
  const storage = fakeStorage();
  const first = createSettingsStore({ storage });
  first.save({ shortener: 'isgd', targetMode: 'short' });

  const second = createSettingsStore({ storage });
  assert.deepEqual(second.load(), { shortener: 'isgd', targetMode: 'short' });
});

test('une écriture partielle ne réinitialise pas le reste', () => {
  const store = createSettingsStore({ storage: fakeStorage() });
  store.save({ shortener: 'spoome' });
  store.save({ targetMode: 'short' });
  assert.deepEqual(store.load(), { shortener: 'spoome', targetMode: 'short' });
});

test('reset revient aux valeurs par défaut', () => {
  const store = createSettingsStore({ storage: fakeStorage() });
  store.save({ shortener: 'vgd', targetMode: 'short' });
  assert.deepEqual(store.reset(), DEFAULT_SETTINGS);
  assert.deepEqual(store.load(), DEFAULT_SETTINGS);
});

test('un contenu illisible retombe sur les valeurs par défaut', () => {
  const storage = fakeStorage({ [SETTINGS_KEY]: '{ceci n\'est pas du JSON' });
  const store = createSettingsStore({ storage });
  assert.deepEqual(store.load(), DEFAULT_SETTINGS);
});

test('un réglage hors catalogue est ignoré à la relecture', () => {
  const storage = fakeStorage({
    [SETTINGS_KEY]: JSON.stringify({ shortener: 'service-disparu', targetMode: 'short' }),
  });
  assert.deepEqual(createSettingsStore({ storage }).load(), {
    shortener: DEFAULT_SETTINGS.shortener,
    targetMode: 'short',
  });
});

test('un stockage qui refuse d\'écrire ne fait pas échouer l\'enregistrement', () => {
  const hostile = {
    getItem() {
      throw new Error('accès refusé');
    },
    setItem() {
      throw new Error('quota dépassé');
    },
  };
  const store = createSettingsStore({ storage: hostile });
  assert.deepEqual(store.load(), DEFAULT_SETTINGS);
  // L'enregistrement reste effectif pour la session en cours.
  assert.deepEqual(store.save({ targetMode: 'short' }), {
    shortener: DEFAULT_SETTINGS.shortener,
    targetMode: 'short',
  });
});

test('sans stockage injecté, le repli mémoire reste cohérent', () => {
  // `globalThis.localStorage` est absent sous Node : la détection doit basculer
  // en mémoire sans lever, et les réglages doivent rester lisibles.
  const store = createSettingsStore();
  assert.equal(typeof store.load, 'function');
  store.save({ targetMode: 'short' });
  assert.equal(store.load().targetMode, 'short');
});
