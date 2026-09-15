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

test('les réglages de planche ont une valeur par défaut dans le HTML', () => {
  // Un décalage d'impression qui ne part pas de zéro décalerait toutes les
  // planches sans que personne ne l'ait demandé.
  for (const id of ['sheet-offset-x', 'sheet-offset-y']) {
    const field = new RegExp(`id="${id}"[^>]*value="0"`);
    assert.match(html, field, `${id} doit partir de 0`);
  }
});

test('le bandeau de feuille de style obsolète dit quoi faire', () => {
  // Ce bandeau n'apparaît que si le navigateur a gardé une ancienne feuille de
  // style : il doit alors nommer la cause ET le geste à faire.
  const banner = html.match(/<div id="stale-style"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(banner, 'le bandeau doit être présent dans index.html');
  assert.match(banner[1], /Feuille de style obsolète/);
  assert.match(banner[1], /brave:\/\/extensions/);
  assert.match(banner[1], /Rechargez l'extension/);
  // Masqué au départ : sans feuille obsolète, il ne doit rien afficher.
  assert.match(html, /<div id="stale-style"[^>]*hidden/);
});

test('les colonnes du tableau ont leurs valeurs par défaut dans le HTML', () => {
  // Ce qui décrit un lien est affiché ; les champs facultatifs attendent d'être
  // remplis. Un test de démarrage ne peut pas le voir : le DOM de substitution
  // ne lit pas les attributs.
  for (const id of ['table-col-index', 'table-col-qr', 'table-col-url', 'table-col-title']) {
    assert.match(
      html,
      new RegExp(`id="${id}"[^>]*checked`),
      `${id} doit être cochée par défaut`,
    );
  }
  for (const id of ['table-col-tags', 'table-col-note']) {
    assert.equal(
      new RegExp(`id="${id}"[^>]*checked`).test(html),
      false,
      `${id} ne doit pas être cochée par défaut`,
    );
  }
});

test('la grille du tableau est active par défaut', () => {
  // Un tableau sans bordures est un choix : c'est à l'utilisateur de le faire.
  assert.match(html, /id="table-grid"[^>]*checked/, 'la grille doit être cochée par défaut');
});

test('la case maîtresse est en tête de la liste', () => {
  // Placée avant la liste, elle se lit comme son en-tête : « tout ce qui suit ».
  const box = html.indexOf('id="select-all-box"');
  const list = html.indexOf('id="list"');
  const search = html.indexOf('id="search"');
  assert.ok(box !== -1 && list !== -1, 'la case et la liste doivent exister');
  assert.ok(box < list, 'la case précède la liste');
  assert.ok(box > search, 'elle ne se confond pas avec la recherche');
  assert.equal(/>Rien</.test(html), false, 'plus de bouton « Rien »');
  assert.equal(html.includes('id="select-all"'), false, 'plus de bouton « Tout »');
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

test('tout nom importé existe bien dans le module visé', () => {
  // Garde-fou né d'une erreur réelle : `parseImportFile` était appelé dans
  // app.js sans avoir été importé. Un identifiant inconnu ne se voit ni à la
  // lecture ni au chargement du module — seulement à l'exécution de la
  // fonction, donc jamais pendant les tests de démarrage.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  const problems = [];

  const patterns = [
    // import { a, b as c } from './x.js'
    /import\s*\{([^}]*)\}\s*from\s*['"](\.[^'"]+)['"]/g,
    // import Defaut from './x.js'
    /import\s+([A-Za-z_$][\w$]*)\s+from\s*['"](\.[^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    for (const match of app.matchAll(pattern)) {
      const [statement, clause, specifier] = match;
      // `app.js` est écrit pour la disposition construite (`core/` à côté de
      // lui) ; dans les sources, le cœur est un dossier voisin.
      const target = [
        resolve(WEB, specifier),
        resolve(ROOT, 'src', specifier),
      ].find((candidate) => existsSync(candidate));
      if (!target) {
        problems.push(`${specifier} est introuvable`);
        continue;
      }
      const source = readFileSync(target, 'utf8');

      // La forme nommée se reconnaît à l'accolade de l'instruction entière : le
      // groupe capturé, lui, ne contient que l'intérieur des accolades.
      const names = statement.includes('{') ? clause.split(',') : [clause];
      for (const entry of names) {
        const name = entry.trim().split(/\s+as\s+/)[0].trim();
        if (name === '') continue;
        const declared = new RegExp(
          `export\\s+(?:async\\s+)?(?:function|const|let|var|class)\\s+${name}\\b`,
        ).test(source)
          || new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(source);
        if (!declared) problems.push(`${name} n'est pas exporté par ${specifier}`);
      }
    }
  }

  assert.deepEqual(problems, []);
});

test('l\'interface annonce ce que l\'import accepte', () => {
  // L'import était la fonction la moins compréhensible : le bouton ne disait
  // ni ce qu'il attendait, ni ce qu'il faisait des doublons.
  const hint = html.match(/Importer relit[\s\S]*?<\/p>/);
  assert.ok(hint, 'l\'aide de l\'import doit être présente');
  assert.match(hint[0], /Archive/);
  assert.match(hint[0], /\.zip/);
  assert.match(hint[0], /CSV/i);
  assert.match(hint[0], /ignorés/, 'le sort des doublons doit être dit');
});

test('le sélecteur de fichier accepte les formats relisibles', () => {
  const input = html.match(/<input id="import-file"[^>]*>/);
  assert.ok(input, 'le champ de fichier doit exister');
  for (const accept of ['.json', '.csv', '.zip']) {
    assert.ok(input[0].includes(accept), `le champ doit accepter ${accept}`);
  }
});
