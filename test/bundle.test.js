/**
 * Tests de l'assembleur de modules.
 *
 * C'est lui qui permet à l'extension de n'avoir aucun `import`, condition pour
 * que Safari résolve ses ressources. Une transformation qui échoue en silence
 * produirait un fichier qui se charge mais ne fonctionne pas : ces tests
 * vérifient donc autant les refus que les succès.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BundleError,
  bundle,
  findDeclarations,
  findImports,
  findResidualModuleSyntax,
  resolveSpecifier,
  stripModuleSyntax,
} from '../scripts/bundle.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'extension');

/**
 * Arborescence de sources reconstituée.
 *
 * `src/web/app.js` importe `./core/…`, que la construction recopie à côté de
 * lui. Pour assembler le vrai graphe, on reconstitue donc cette disposition
 * dans un dossier temporaire, plutôt que d'assembler `dist/extension/app.js`
 * qui est **déjà** le résultat — un second passage ne trouverait plus aucun
 * import et le test validerait un graphe vide.
 */
let sourceTree = '';
let ENTRY = '';

before(() => {
  sourceTree = mkdtempSync(join(ROOT, 'test', '.tmp-bundle-'));
  cpSync(join(ROOT, 'src', 'core'), join(sourceTree, 'core'), { recursive: true });
  for (const file of ['app.js', 'element-ids.js']) {
    cpSync(join(ROOT, 'src', 'web', file), join(sourceTree, file));
  }
  ENTRY = join(sourceTree, 'app.js');
});

after(() => {
  if (sourceTree) rmSync(sourceTree, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Dépouillement de la syntaxe de module
// ---------------------------------------------------------------------------

test('les imports sont retirés, y compris sur plusieurs lignes', () => {
  const source = [
    "import { a, b } from './x.js';",
    'import {',
    '  c,',
    '  d,',
    "} from './y.js';",
    'const value = 1;',
  ].join('\n');

  const stripped = stripModuleSyntax(source);
  assert.equal(stripped.includes('import'), false);
  assert.equal(stripped.includes('value'), true);
});

test('les trois formes d\'export sont retirées', () => {
  const source = [
    'export function f() {}',
    'export async function g() {}',
    'export class C {}',
    'export const x = 1;',
    "export * from './z.js';",
    'export { a, b };',
  ].join('\n');

  const stripped = stripModuleSyntax(source);
  assert.equal(/^\s*export\s/m.test(stripped), false, `reste : ${stripped}`);
  // Le contenu, lui, doit survivre.
  for (const name of ['function f', 'class C', 'const x']) {
    assert.ok(stripped.includes(name), `perdu : ${name}`);
  }
});

test('un réexport ne laisse pas de « from » orphelin', () => {
  const stripped = stripModuleSyntax("export { a } from './x.js';\nconst y = 1;");
  assert.equal(/from\s*['"]/.test(stripped), false, `reste : ${stripped}`);
});

test('findImports et findDeclarations lisent ce qu\'il faut', () => {
  const source = "import { a } from './a.js';\nexport const b = 1;\nconst c = 2;";
  assert.deepEqual(findImports(source), ['./a.js']);
  assert.deepEqual(findDeclarations(source).sort(), ['b', 'c']);
});

// ---------------------------------------------------------------------------
// Résolution
// ---------------------------------------------------------------------------

test('un chemin relatif est résolu depuis le fichier importateur', () => {
  // Un fichier réellement présent : la résolution vérifie l'existence, ce qui
  // permet de signaler un import cassé plutôt que de produire un fichier
  // incomplet.
  const from = join(ROOT, 'dist', 'extension', 'app.js');
  assert.equal(
    resolveSpecifier(from, './icons/icon-16.png'),
    join(ROOT, 'dist', 'extension', 'icons', 'icon-16.png'),
  );
});

test('un import relatif manquant est signalé', () => {
  const from = join(ROOT, 'dist', 'extension', 'background.js');
  assert.throws(() => resolveSpecifier(from, './inexistant.js'), BundleError);
});

test('un paquet de node_modules est résolu', () => {
  // `uqr` est la seule dépendance du projet : elle est embarquée comme les
  // autres modules, ce qui évite d'exiger d'elle qu'elle soit sans dépendance.
  const from = join(ROOT, 'dist', 'extension', 'app.js');
  const entry = resolveSpecifier(from, 'uqr');
  assert.ok(existsSync(entry), `introuvable : ${entry}`);
  assert.match(readFileSync(entry, 'utf8').slice(0, 200), /encode|QrCode/);
});

test('un paquet inconnu est signalé', () => {
  const from = join(ROOT, 'dist', 'extension', 'app.js');
  assert.throws(() => resolveSpecifier(from, 'paquet-qui-nexiste-pas'), BundleError);
});

// ---------------------------------------------------------------------------
// Assemblage
// ---------------------------------------------------------------------------

test('le service worker assemblé ne contient plus de syntaxe de module', () => {
  const { code } = bundle(join(DIST, 'background.js'));
  assert.deepEqual(findResidualModuleSyntax(code), []);
});

test('l\'application embarquée assemble uqr et les modules d\'impression', () => {
  // On assemble depuis les **sources**, pas depuis `dist/extension/app.js` qui
  // est déjà le résultat : un second passage ne trouverait plus aucun import et
  // le test validerait un graphe vide.
  const { code, modules, declarations } = bundle(ENTRY);

  assert.deepEqual(findResidualModuleSyntax(code), []);

  // Les modules attendus doivent avoir été tirés dans le graphe. On compare la
  // fin du chemin : « core/printer/printer.js » est plus profond d'un niveau
  // que « core/qr.js ».
  for (const expected of [
    'core/qr.js',
    'core/label.js',
    'core/raster.js',
    'core/sheet.js',
    'core/printer/packet.js',
    'core/printer/transport.js',
    'core/printer/printer.js',
    'uqr/dist/index.mjs',
  ]) {
    assert.ok(
      modules.some((module) => module.endsWith(expected)),
      `${expected} absent du graphe :\n  ${modules.join('\n  ')}`,
    );
  }
  assert.ok(declarations.has('encode'), 'la fonction d\'encodage de uqr doit être présente');
  assert.ok(declarations.size > 100, `trop peu de déclarations : ${declarations.size}`);
});

test('aucune déclaration de premier niveau n\'entre en collision', () => {
  // Deux modules déclarant le même nom se masqueraient silencieusement : le
  // fichier produit ne se comporterait pas comme les sources.
  const { declarations } = bundle(ENTRY);
  const names = [...declarations.keys()];
  assert.equal(new Set(names).size, names.length, 'les noms doivent être uniques');
});

test('l\'application assemblée reste lisible', () => {
  // Le code n'est pas minifié : chaque module garde son en-tête, ce qui permet
  // de déboguer l'extension dans l'inspecteur.
  const { code } = bundle(ENTRY);
  assert.match(code, /^\/\/ ─/m);
  assert.ok(code.split('\n').length > 1000, 'le fichier semble tronqué');
});
