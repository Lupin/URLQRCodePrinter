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
import { LABEL_ALIGNMENTS } from '../src/core/label.js';
import { LABEL_FORMATS } from '../src/core/label-export.js';
import { PROFILES, compatibleSupplies } from '../src/core/printer/profiles.js';
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
  // Les phrases de `explain` — le message montré quand un service refuse une
  // origine, comme T.LY hors extension — relèvent du même angle mort.
  for (const shortener of SHORTENERS) {
    if (shortener.label) keys.add(shortener.label);
    // La note technique est affichée en infobulle de l'option, et dans l'aide
    // sous le sélecteur — donc lue par l'utilisateur.
    if (shortener.note) keys.add(shortener.note);
    for (const phrase of Object.values(shortener.explain ?? {})) keys.add(phrase);
  }

  // **Même angle mort pour toutes les autres listes.** Un libellé déclaré dans un
  // tableau, puis donné à `t()` par variable — `t(entree.label)` — échappe à
  // l'expression régulière ci-dessus, qui ne voit que les chaînes littérales.
  // C'est ainsi que « Paysage » s'affichait en français dans l'interface
  // anglaise, avec les cinq dispositions de texte et douze consommables : rien
  // ne les reliait à une clé de traduction. On relève donc les libellés à la
  // source, module par module — en écartant ceux qui n'ont pas besoin de l'être.
  const libelles = [
    ...LABEL_ALIGNMENTS.map((entree) => entree.label),
    ...LABEL_FORMATS.map((format) => format.name),
    ...PROFILES.flatMap((profil) => compatibleSupplies(profil)
      .flatMap((consommable) => [consommable.label, consommable.reason])),
    ...libellesDeAppJs(),
  ];
  for (const libelle of libelles) {
    if (libelle && demandeTraduction(libelle)) keys.add(libelle);
  }
  return [...keys];
}

/**
 * Vocabulaire neutre : marques, modèles et unités, écrits pareil dans les deux
 * langues.
 */
const NEUTRE = /\b(niimbot|brother|dymo|labelwriter|zebra|ql|dk|d110|m2|m3|a4|letter|mm|dpi)\b/gi;

/**
 * Un libellé a-t-il besoin d'une traduction ?
 *
 * Les cotes et les noms de modèles s'écrivent pareil des deux côtés : exiger une
 * entrée pour « 12 × 22 mm » ou « Brother QL — 62 mm (300 dpi) » remplirait le
 * catalogue de traductions sans effet — et un contrôle qui réclame pour rien
 * finit par être ignoré. On retire donc les nombres, les unités et les marques,
 * puis on regarde s'il reste un **mot** : c'est lui qui demanderait à être
 * traduit. Sur le catalogue actuel, le partage tombe juste — 47 libellés à
 * traduire, 35 neutres.
 *
 * @param {string} texte
 * @returns {boolean}
 */
function demandeTraduction(texte) {
  const reste = String(texte)
    .replace(NEUTRE, ' ')
    .replace(/[\d.,×°()\-–—:;/]/g, ' ')
    .trim();
  return /[a-zà-ÿ]/i.test(reste);
}

/**
 * Les libellés déclarés dans `app.js`, qui n'est pas importable sans DOM.
 *
 * Ils se relèvent dans la source, entre deux ancres. Le compte est vérifié par
 * le test qui suit : un tableau déplacé rendrait ce relevé **vide**, et un
 * contrôle vide ne contrôle rien.
 *
 * @returns {string[]}
 */
function libellesDeAppJs() {
  const app = readFileSync(join(ROOT, 'src/web/app.js'), 'utf8');
  const bloc = app.slice(app.indexOf('const LABEL_LAYOUTS'), app.indexOf('function layoutsFor'));
  const dispositions = [...bloc.matchAll(/label: '((?:[^'\\]|\\.)*)'/g)]
    .map((match) => unescapeKey(match[1]));
  const orientations = [...app.matchAll(/\['(?:portrait|landscape)', '((?:[^'\\]|\\.)*)'\]/g)]
    .map((match) => unescapeKey(match[1]));
  return [...dispositions, ...orientations];
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

test('le relevé des libellés atteint bien les listes données à t() par variable', () => {
  // Un contrôle vide ne contrôle rien : si un tableau de libellés change de nom
  // ou de forme, le relevé rendrait une liste vide et le test précédent
  // passerait en silence — exactement le défaut qu'il est là pour attraper.
  const libelles = libellesDeAppJs();
  assert.equal(libelles.length, 7, `libellés relevés dans app.js : ${libelles.join(' | ')}`);
  assert.ok(libelles.includes('Paysage'), 'le sens de la feuille');
  assert.ok(libelles.includes('Texte droit, sous le QR Code'), 'les dispositions de texte');
});

test('aucune clé n\'est déclarée deux fois dans le catalogue anglais', () => {
  // Un doublon ne casse rien à l'exécution — la dernière déclaration gagne —
  // mais la première devient un leurre : on la corrige, rien ne change. C'est
  // arrivé deux fois pendant la traduction, dont une avec deux textes anglais
  // différents pour la même étiquette. On compte donc les déclarations du
  // fichier, pas les clés de l'objet, qui ne peuvent plus les distinguer.
  const source = readFileSync(join(ROOT, 'src/core/locales/en.js'), 'utf8');
  const declared = [...source.matchAll(/^ {2}("(?:[^"\\]|\\.)*"):/gm)].map((m) => m[1]);
  const seen = new Set();
  const duplicates = [];
  for (const key of declared) {
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  assert.deepEqual(duplicates, [], 'clé déclarée deux fois : ' + duplicates.join(' | '));
  assert.equal(declared.length, Object.keys(EN_MESSAGES).length);
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

test("l'application porte le choix de langue, et la fenêtre le suit", () => {
  // Le réglage vit dans l'application, et **à un seul endroit** : un second
  // sélecteur dans une fenêtre de 380 px l'encombrait pour un choix qu'on ne
  // fait qu'une fois. La fenêtre, elle, lit la langue mémorisée — dans
  // `chrome.storage.local`, que le service worker relit aussi pour ses menus.
  const application = readFileSync(join(ROOT, 'src/web/index.html'), 'utf8');
  assert.match(application, /id="locale"/, "l'application doit offrir le sélecteur");
  assert.match(
    readFileSync(join(ROOT, 'src/web/app.js'), 'utf8'),
    /setLocale\(/,
    'le changement de langue n\'est pas branché dans l\'application',
  );

  const fenetre = readFileSync(join(ROOT, 'src/extension-src/popup.html'), 'utf8');
  assert.doesNotMatch(fenetre, /id="locale"/, 'la fenêtre ne doit plus offrir le sélecteur');
  const scriptFenetre = readFileSync(join(ROOT, 'src/extension-src/popup.js'), 'utf8');
  assert.doesNotMatch(scriptFenetre, /setLocale\(/, 'la fenêtre règle encore la langue');
  // Elle la **suit** : la page d'information dépend de la langue affichée.
  assert.match(scriptFenetre, /getLocale\(\)/);
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
