/**
 * Tests de l'archive déposée sur le Chrome Web Store.
 *
 * Le défaut visé ne se manifeste pas à la construction : il se manifeste au
 * refus du magasin, avec un message qui ne dit pas d'où il vient. Le Finder, en
 * particulier, enveloppe le dossier — l'archive contient alors
 * `extension/manifest.json` au lieu de `manifest.json` à la racine.
 *
 * Deux choix de méthode méritent d'être signalés :
 *
 *   - l'archive est **relue** avec `readStoredZip`, le lecteur déjà présent dans
 *     `src/core/zip.js`, plutôt qu'avec un `unzip` de la machine : le test ne
 *     dépend d'aucun outil externe, et il vérifie ce que le magasin lira ;
 *   - un cas passe par un paquet **réellement construit** (`dist/extension`),
 *     parce qu'un fixture peut réussir là où le vrai paquet échoue.
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildChromeZip,
  verifyChromeZip,
  manifestReferences,
} from '../scripts/package-chrome.mjs';
import { createZip, readStoredZip } from '../src/core/zip.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Manifeste minimal mais réaliste, calqué sur celui du projet. */
const MANIFEST = {
  manifest_version: 3,
  default_locale: 'fr',
  name: '__MSG_name__',
  version: '0.1.0',
  description: '__MSG_description__',
  permissions: ['contextMenus', 'storage', 'activeTab', 'scripting'],
  background: { service_worker: 'background.js' },
  action: {
    default_popup: 'popup.html',
    default_icon: { 16: 'icons/icon-16.png', 128: 'icons/icon-128.png' },
  },
  icons: { 16: 'icons/icon-16.png', 128: 'icons/icon-128.png' },
};

let workDir = '';

/** Écrit un paquet d'extension minimal sur le disque. */
function makeExtension({ manifest = MANIFEST, files = true } = {}) {
  const dir = join(workDir, 'extension');
  mkdirSync(join(dir, 'icons'), { recursive: true });
  mkdirSync(join(dir, '_locales', 'fr'), { recursive: true });

  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  if (files) {
    writeFileSync(join(dir, 'background.js'), '// service worker');
    writeFileSync(join(dir, 'popup.html'), '<!DOCTYPE html>');
    writeFileSync(join(dir, 'icons', 'icon-16.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    writeFileSync(join(dir, 'icons', 'icon-128.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    writeFileSync(join(dir, '_locales', 'fr', 'messages.json'), '{}');
  }

  return dir;
}

beforeEach(() => {
  workDir = mkdtempSync(join(ROOT, 'test', '.tmp-chrome-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Références du manifeste
// ---------------------------------------------------------------------------

test('les fichiers annoncés par le manifeste sont relevés', () => {
  const refs = manifestReferences(MANIFEST);

  for (const expected of [
    'background.js',
    'popup.html',
    'icons/icon-16.png',
    'icons/icon-128.png',
    '_locales/fr/messages.json',
  ]) {
    assert.ok(refs.has(expected), `référence manquante : ${expected}`);
  }
});

test('une icône déclarée en chaîne simple est relevée', () => {
  // `action.default_icon` accepte une chaîne aussi bien qu'un objet : les deux
  // formes doivent être contrôlées, sinon la vérification troue en silence.
  const refs = manifestReferences({
    action: { default_icon: 'icons/unique.png' },
    icons: { 48: 'icons/icon-48.png' },
  });

  assert.ok(refs.has('icons/unique.png'));
  assert.ok(refs.has('icons/icon-48.png'));
});

// ---------------------------------------------------------------------------
// La racine de l'archive
// ---------------------------------------------------------------------------

test('le manifeste est à la racine de l\'archive, sans dossier enveloppe', async () => {
  const sourceDir = makeExtension();
  const outputPath = join(workDir, 'paquet.zip');

  const result = await buildChromeZip({ sourceDir, outputPath });
  assert.equal(result.version, '0.1.0');

  const entries = readStoredZip(new Uint8Array(readFileSync(outputPath)));
  assert.ok(entries.has('manifest.json'), 'manifest.json doit être à la racine');
  assert.equal(
    [...entries.keys()].some((name) => name.endsWith('/manifest.json')),
    false,
    'aucune archive ne doit envelopper le manifeste dans un dossier',
  );

  // Les sous-dossiers doivent conserver leur arborescence, en `/`.
  assert.ok(entries.has('icons/icon-16.png'));
  assert.ok(entries.has('_locales/fr/messages.json'));
});

test('un manifeste absent est signalé par un message qui dit quoi faire', async () => {
  mkdirSync(join(workDir, 'vide'), { recursive: true });

  await assert.rejects(
    buildChromeZip({ sourceDir: join(workDir, 'vide'), outputPath: join(workDir, 'x.zip') }),
    /npm run build:extension/,
  );
});

// ---------------------------------------------------------------------------
// La vérification
// ---------------------------------------------------------------------------

test('une archive conforme ne signale aucun problème', async () => {
  const sourceDir = makeExtension();
  const outputPath = join(workDir, 'paquet.zip');
  await buildChromeZip({ sourceDir, outputPath });

  const problems = await verifyChromeZip(new Uint8Array(readFileSync(outputPath)));
  assert.deepEqual(problems, []);
});

test('un manifeste enveloppé dans un dossier est refusé', async () => {
  // C'est exactement ce que produit « Compresser » du Finder.
  const zip = createZip([
    { name: 'extension/manifest.json', data: JSON.stringify(MANIFEST) },
    { name: 'extension/background.js', data: '//' },
  ]);

  const problems = await verifyChromeZip(zip);
  assert.ok(
    problems.some((problem) => problem.includes('racine')),
    'l\'absence de manifeste à la racine doit être signalée',
  );
});

test('un fichier annoncé mais absent est signalé', async () => {
  const sourceDir = makeExtension({ files: false });
  const outputPath = join(workDir, 'paquet.zip');
  await buildChromeZip({ sourceDir, outputPath });

  const problems = await verifyChromeZip(new Uint8Array(readFileSync(outputPath)));
  assert.ok(problems.some((problem) => problem.includes('background.js')));
  assert.ok(problems.some((problem) => problem.includes('_locales/fr/messages.json')));
});

test('les débris du système sont signalés dans une archive', async () => {
  // La détection est éprouvée sur une archive fabriquée à la main : la
  // construction, elle, exclut déjà ces entrées, donc elle ne peut pas servir
  // à prouver que la vérification les repère.
  const zip = createZip([
    { name: 'manifest.json', data: JSON.stringify(MANIFEST) },
    { name: '.DS_Store', data: 'junk' },
  ]);

  const problems = await verifyChromeZip(zip);
  assert.ok(problems.some((problem) => problem.includes('.DS_Store')));
});

test('un doublon macOS est signalé dans une archive', async () => {
  // Un `_locales 2` rend l'extension entièrement inchargeable dans Chrome.
  const zip = createZip([
    { name: 'manifest.json', data: JSON.stringify(MANIFEST) },
    { name: '_locales 2/fr/messages.json', data: '{}' },
  ]);

  const problems = await verifyChromeZip(zip);
  assert.ok(problems.some((problem) => problem.includes('_locales 2')));
});

test('les débris présents sur le disque ne partent pas dans l\'archive', async () => {
  // La garantie doit tenir sans que l'appelant ait nettoyé : macOS sème des
  // `.DS_Store` dans un dossier parcouru au Finder, donc **après** la
  // construction. C'est précisément le cas qui avait sali le paquet réel.
  const sourceDir = makeExtension();
  writeFileSync(join(sourceDir, '.DS_Store'), 'junk');
  mkdirSync(join(sourceDir, '_locales 2'), { recursive: true });
  writeFileSync(join(sourceDir, '_locales 2', 'messages.json'), '{}');

  const outputPath = join(workDir, 'paquet.zip');
  const result = await buildChromeZip({ sourceDir, outputPath });

  assert.equal(
    result.entries.some((name) => name.includes('.DS_Store')),
    false,
    'un .DS_Store ne doit jamais entrer dans l\'archive',
  );
  assert.equal(
    result.entries.some((name) => name.split('/').some((s) => / 2$/.test(s))),
    false,
    'un doublon « 2 » ne doit jamais entrer dans l\'archive',
  );

  const problems = await verifyChromeZip(new Uint8Array(readFileSync(outputPath)));
  assert.deepEqual(problems, []);
});

// ---------------------------------------------------------------------------
// Le manifeste réel du projet
// ---------------------------------------------------------------------------

test('le manifeste du projet n\'annonce aucun fichier absent', async () => {
  // Ce contrôle porte volontairement sur la **source**, pas sur `dist/extension`.
  //
  // `test/extension.test.js` relance `scripts/build.mjs` en parallèle des autres
  // fichiers de test, et `build.mjs` commence par supprimer son dossier de
  // sortie avant de le repeupler. Un test qui lit `dist/extension` course donc
  // avec cette reconstruction : il passait cinq fois sur six et échouait la
  // sixième, en accusant le paquet alors que la construction était en cours.
  //
  // Le manifeste source porte les mêmes chemins que le manifeste construit —
  // c'est `manifest.template.json` qui les fournit. Le contrôler ici couvre le
  // même risque sans dépendre d'un dossier que d'autres tests reconstruisent.
  const srcDir = join(ROOT, 'src', 'extension-src');
  const manifest = JSON.parse(readFileSync(join(srcDir, 'manifest.template.json'), 'utf8'));

  for (const ref of manifestReferences(manifest)) {
    assert.ok(
      existsSync(join(srcDir, ref)),
      `fichier annoncé par le manifeste mais absent de la source : ${ref}`,
    );
  }
});
