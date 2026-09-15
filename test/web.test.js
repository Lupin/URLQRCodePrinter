/**
 * Vérification de l'application web.
 *
 * On va au-delà de la syntaxe : le serveur est réellement démarré et interrogé,
 * car c'est le seul moyen de constater que la page et ses modules se chargent
 * et que le dossier servi reste confiné.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ELEMENT_IDS } from '../src/web/element-ids.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'src', 'web');
const DIST_WEB = join(ROOT, 'dist', 'web');

// L'application n'est complète qu'une fois le cœur partagé recopié. La
// construction est assurée par le script `pretest` de npm : la déclencher ici
// entrerait en concurrence avec les autres fichiers de test, qui s'exécutent en
// parallèle et reconstruisent la même cible.
if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

const html = readFileSync(join(WEB, 'index.html'), 'utf8');

/** Extrait les spécificateurs d'import relatifs d'un module ES. */
function relativeImports(source) {
  const specifiers = [];
  for (const pattern of [
    /(?:^|\n)\s*import\s+[^'"]*?from\s+['"](\.[^'"]+)['"]/g,
    /(?:^|\n)\s*import\s+['"](\.[^'"]+)['"]/g,
  ]) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

// ---------------------------------------------------------------------------
// Cohérence entre le HTML et le script
// ---------------------------------------------------------------------------

test('chaque identifiant attendu par app.js existe dans index.html', () => {
  const missing = ELEMENT_IDS.filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, [], `identifiants absents du HTML : ${missing.join(', ')}`);
});

test('index.html ne contient aucun script inline', () => {
  const inline = [...html.matchAll(/<script\b([^>]*)>/gi)].filter(
    (match) => !/\bsrc\s*=/i.test(match[1]),
  );
  assert.equal(inline.length, 0);
});

test('les ressources locales référencées par le HTML existent', () => {
  const sources = [
    ...[...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/<link[^>]*\bhref=["']([^"']+)["']/gi)].map((m) => m[1]),
  ];
  assert.ok(sources.length >= 2);
  for (const source of sources) {
    // On ignore les URL absolues (polices, CDN éventuels).
    if (/^https?:/i.test(source)) continue;
    assert.ok(existsSync(join(WEB, source)), `ressource manquante : ${source}`);
  }
});

test('app.js est syntaxiquement valide', () => {
  execFileSync(process.execPath, ['--check', join(WEB, 'app.js')], { stdio: 'pipe' });
});

test('les imports de app.js résolvent dans l\'application assemblée', () => {
  const source = readFileSync(join(DIST_WEB, 'app.js'), 'utf8');
  const specifiers = relativeImports(source);
  assert.ok(specifiers.length > 5);
  for (const specifier of specifiers) {
    assert.equal(specifier.includes('..'), false, `remontée interdite : ${specifier}`);
    assert.ok(
      existsSync(resolve(DIST_WEB, specifier)),
      `import cassé dans app.js : ${specifier}`,
    );
  }
});

test('le build de l\'application web contient le cœur et ses modules propres', () => {
  for (const file of [
    'index.html', 'style.css', 'app.js', 'element-ids.js',
    'core/link.js', 'core/store.js', 'core/qr.js', 'core/label.js',
    'core/raster.js', 'core/sheet.js', 'core/exporters.js', 'core/download.js',
    'core/printer/transport.js', 'core/printer/printer.js',
  ]) {
    assert.ok(existsSync(join(DIST_WEB, file)), `absent du build : ${file}`);
  }
});

// ---------------------------------------------------------------------------
// Serveur
// ---------------------------------------------------------------------------

let server = null;
let baseUrl = '';

before(async () => {
  const { serve } = await import('../scripts/serve.mjs');
  // Port 0 : le système en attribue un libre, ce qui évite tout conflit.
  server = await serve({ dir: DIST_WEB, port: 0 });
  baseUrl = server.url;
});

after(async () => {
  await server?.close();
});

test('le serveur sert la page de l\'application', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  const body = await response.text();
  assert.match(body, /<title>URLQRCodePrinter<\/title>/);
});

test('le serveur sert les modules avec le bon type MIME', async () => {
  // Un type MIME incorrect empêche le navigateur de charger un module ES.
  for (const path of ['/app.js', '/core/link.js', '/core/printer/packet.js']) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 200, path);
    assert.match(
      response.headers.get('content-type'),
      /javascript/,
      `${path} : type MIME incorrect`,
    );
  }
});

test('le serveur sert la feuille de style', async () => {
  const response = await fetch(`${baseUrl}style.css`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/css/);
});

test('une ressource absente renvoie 404 avec une aide', async () => {
  const response = await fetch(`${baseUrl}inexistant.js`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /npm run build/);
});

test('le serveur refuse de sortir du dossier servi', async () => {
  // Les remontées sont encodées : `fetch` normalise les « .. » littéraux avant
  // l'envoi, ce qui masquerait le cas à tester.
  for (const attempt of [
    '/%2e%2e/package.json',
    '/%2e%2e%2f%2e%2e%2fpackage.json',
    '/core/%2e%2e%2f%2e%2e%2fpackage.json',
  ]) {
    const response = await fetch(baseUrl + attempt);
    const body = await response.text();
    assert.equal(
      body.includes('url-qr-code-printer'),
      false,
      `fuite de fichier via ${attempt} (statut ${response.status})`,
    );
  }
});
