/**
 * Internationalisation : couverture du catalogue et comportement de la couche.
 *
 * Le catalogue anglais est indexé par le texte français employé dans le code :
 * le test vérifie qu'aucune clé utilisée dans les modules ou le balisage n'y
 * manque. Sans ce contrôle, une chaîne oubliée resterait en français en
 * silence — c'est le défaut le plus probable d'une traduction incrémentale.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EN_MESSAGES } from '../src/core/locales/en.js';
import {
  SUPPORTED_LOCALES,
  normalizeLocale,
  detectLocale,
  initI18n,
  setLocale,
  t,
  tpl,
  applyTranslations,
} from '../src/core/i18n.js';
import { buildMenuDefinitions } from '../src/core/capture.js';
import { SHORTENERS } from '../src/core/shorten.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const JS_FILES = [
  'src/web/app.js',
  'src/extension-src/popup.js',
  'src/core/capture.js',
  'src/core/import.js',
  'src/core/shorten.js',
  'src/core/link.js',
  'src/core/label.js',
  'src/core/printer/printer.js',
  'src/core/printer/transport.js',
];

const HTML_FILES = [
  'src/web/index.html',
  'src/extension-src/popup.html',
];

/** Rend un littéral échappé à sa valeur réelle. */
function unescapeKey(value) {
  return value.replace(/\\'/g, "'").replace(/\\"/g, '"');
}

/** Extrait toutes les clés de traduction employées par les sources. */
function collectKeys() {
  const keys = new Set();
  const tRe = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
  const tplRe = /\btpl\(\s*[^,]+,\s*(['"])((?:\\.|(?!\1)[^\\])*)\1\s*,\s*(['"])((?:\\.|(?!\3)[^\\])*)\3/g;

  for (const relative of JS_FILES) {
    const source = readFileSync(join(ROOT, relative), 'utf8');
    for (const match of source.matchAll(tRe)) keys.add(unescapeKey(match[2]));
    for (const match of source.matchAll(tplRe)) {
      keys.add(unescapeKey(match[2]));
      keys.add(unescapeKey(match[4]));
    }
  }
  for (const relative of HTML_FILES) {
    const html = readFileSync(join(ROOT, relative), 'utf8');
    const re = /data-i18n(?:-placeholder|-title|-aria-label)?="([^"]*)"/g;
    for (const match of html.matchAll(re)) keys.add(match[1]);
  }
  // Les libellés de la liste déroulante vivent dans le catalogue des services,
  // pas dans un appel `t()` littéral : sans ce relevé, une traduction manquante
  // ne se verrait qu'à l'affichage, en anglais, sous la forme du texte français.
  for (const shortener of SHORTENERS) {
    if (shortener.label) keys.add(shortener.label);
  }
  return [...keys];
}

/** Espace de stockage en mémoire pour setLocale / initI18n. */
function createArea() {
  const store = {};
  return {
    store,
    async get(key) {
      return { [key]: store[key] };
    },
    async set(values) {
      Object.assign(store, values);
    },
  };
}

test('les langues prises en charge sont le français et l\'anglais', () => {
  assert.deepEqual([...SUPPORTED_LOCALES], ['fr', 'en']);
});

test('un code de langue est ramené à une langue gérée', () => {
  assert.equal(normalizeLocale('EN_us'), 'en');
  assert.equal(normalizeLocale('fr-CA'), 'fr');
  assert.equal(normalizeLocale('es'), null);
  assert.equal(normalizeLocale(42), null);
});

test('la langue du navigateur est respectée, avec le français par défaut', () => {
  assert.equal(detectLocale({ language: 'en-GB' }), 'en');
  assert.equal(detectLocale({ language: 'de-DE' }), 'fr');
  assert.equal(detectLocale({ languages: ['de', 'en'], language: 'de' }), 'en');
  assert.equal(detectLocale({ language: 'es-ES' }), 'fr');
  assert.equal(detectLocale({}), 'fr');
});

test('aucune clé du catalogue anglais ne manque', () => {
  const missing = collectKeys().filter((key) => !(key in EN_MESSAGES));
  assert.deepEqual(missing, [], 'traduction manquante : ' + missing.join(' | '));
});

test('une traduction absente retombe sur le français', async () => {
  await initI18n({ locale: 'en' });
  assert.equal(t('Clé qui n\'existe pas du tout'), 'Clé qui n\'existe pas du tout');
});

test('la traduction et l\'interpolation répondent', async () => {
  await initI18n({ locale: 'en' });
  assert.equal(t('Imprimer'), 'Print');
  assert.equal(t('Imprimer les {count} liens', { count: 4 }), 'Print the 4 links');
  await initI18n({ locale: 'fr' });
  assert.equal(t('Imprimer'), 'Imprimer');
});

test('le pluriel suit la règle de chaque langue', async () => {
  await initI18n({ locale: 'en' });
  assert.equal(tpl(1, '{count} lien', '{count} liens'), '1 link');
  assert.equal(tpl(3, '{count} lien', '{count} liens'), '3 links');
  assert.equal(tpl(0, '{count} lien', '{count} liens'), '0 links');

  await initI18n({ locale: 'fr' });
  assert.equal(tpl(0, '{count} lien', '{count} liens'), '0 lien');
  assert.equal(tpl(1, '{count} lien', '{count} liens'), '1 lien');
  assert.equal(tpl(3, '{count} lien', '{count} liens'), '3 liens');
});

test('la langue est mémorisée puis relue', async () => {
  const area = createArea();
  await setLocale('en', { area });
  assert.equal(area.store.locale, 'en');

  await initI18n({ area, navigator: { language: 'fr-FR' } });
  assert.equal(t('Imprimer'), 'Print');

  await initI18n({ area, locale: 'fr' });
  assert.equal(t('Imprimer'), 'Imprimer');
  await initI18n({ locale: 'fr' });
});

test('les éléments balisés reçoivent la traduction', async () => {
  await initI18n({ locale: 'en' });
  const node = {
    textContent: '',
    getAttribute: () => 'Imprimer',
  };
  const root = {
    querySelectorAll: (selector) => (selector === '[data-i18n]' ? [node] : []),
    documentElement: null,
  };
  applyTranslations(root);
  assert.equal(node.textContent, 'Print');
  await initI18n({ locale: 'fr' });
});

test('le manifeste et les deux catalogues de langue sont complets', () => {
  const fr = JSON.parse(
    readFileSync(join(ROOT, 'src/extension-src/_locales/fr/messages.json'), 'utf8'),
  );
  const en = JSON.parse(
    readFileSync(join(ROOT, 'src/extension-src/_locales/en/messages.json'), 'utf8'),
  );
  assert.deepEqual(Object.keys(fr).sort(), Object.keys(en).sort());
  for (const key of Object.keys(fr)) {
    assert.ok(fr[key].message, 'fr : ' + key + ' sans message');
    assert.ok(en[key].message, 'en : ' + key + ' sans message');
  }

  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'src/extension-src/manifest.template.json'), 'utf8'),
  );
  assert.equal(manifest.default_locale, 'fr');
  assert.match(manifest.name, /^__MSG_/);
  assert.match(manifest.description, /^__MSG_/);
  assert.match(manifest.action.default_title, /^__MSG_/);
});

test('les deux interfaces offrent le sélecteur de langue', () => {
  for (const relative of HTML_FILES) {
    const html = readFileSync(join(ROOT, relative), 'utf8');
    assert.match(html, /id="locale"/, relative + ' : sélecteur absent');
  }
  for (const relative of ['src/extension-src/popup.js', 'src/web/app.js']) {
    const source = readFileSync(join(ROOT, relative), 'utf8');
    assert.match(source, /setLocale\(/, relative + ' : changement non branché');
  }
});

test('les menus contextuels suivent la langue', async () => {
  await initI18n({ locale: 'en' });
  const english = buildMenuDefinitions();
  assert.equal(english[0].title, 'Add this page to URLQRCodePrinter');
  assert.equal(english[1].title, 'Add this link to URLQRCodePrinter');
  assert.equal(english[2].title, 'Add “%s” to URLQRCodePrinter');

  await initI18n({ locale: 'fr' });
  assert.equal(buildMenuDefinitions()[0].title, 'Ajouter cette page à URLQRCodePrinter');
});
