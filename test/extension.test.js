/**
 * Vérification structurelle de l'extension.
 *
 * Ces tests ne remplacent pas un chargement réel dans le navigateur, mais ils
 * attrapent les fautes qui font échouer une extension au démarrage sans
 * message clair : fichier référencé manquant, import relatif cassé, script
 * inline refusé par la CSP de MV3, manifeste incomplet.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = join(ROOT, 'src', 'extension');
const DIST_EXT = join(ROOT, 'dist', 'extension');

// L'extension n'est complète qu'une fois le cœur partagé recopié : plusieurs
// vérifications portent donc sur l'artefact assemblé. On construit une fois,
// avant que les tests ne s'exécutent.
execFileSync(process.execPath, [join(ROOT, 'scripts', 'build.mjs'), '--only=extension'], {
  cwd: ROOT,
  stdio: 'pipe',
});

/** Lit et analyse le manifeste. */
function readManifest() {
  return JSON.parse(readFileSync(join(EXT, 'manifest.json'), 'utf8'));
}

/**
 * Extrait les spécificateurs d'import relatifs d'un module ES.
 * @param {string} source
 * @returns {string[]}
 */
function relativeImports(source) {
  const specifiers = [];
  const patterns = [
    /(?:^|\n)\s*import\s+[^'"]*?from\s+['"](\.[^'"]+)['"]/g,
    /(?:^|\n)\s*import\s+['"](\.[^'"]+)['"]/g,
    /(?:^|\n)\s*export\s+[^'"]*?from\s+['"](\.[^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

// ---------------------------------------------------------------------------
// Manifeste
// ---------------------------------------------------------------------------

test('le manifeste est un MV3 complet', () => {
  const manifest = readManifest();
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.name);
  assert.match(manifest.version, /^\d+(\.\d+)*$/);
  assert.ok(manifest.description);
});

test('les permissions déclarées sont exactement celles utilisées', () => {
  const permissions = new Set(readManifest().permissions);
  // Une permission excédentaire déclenche un avertissement à l'installation et
  // une revue App Store plus stricte. `scripting` sert au repli d'injection qui
  // lit l'URL sur Safari iOS, où `tab.url` n'est pas fourni.
  assert.deepEqual(
    [...permissions].sort(),
    ['activeTab', 'contextMenus', 'scripting', 'storage'],
  );
});

test('le manifeste ne demande aucun accès étendu aux sites', () => {
  // `activeTab` n'accorde l'accès qu'au moment de l'invocation ; une permission
  // d'hôte générale serait à la fois inutile et alarmante pour l'utilisateur.
  const manifest = readManifest();
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  for (const permission of manifest.permissions) {
    assert.equal(permission.includes('<all_urls>'), false);
    assert.equal(permission.includes('://'), false);
  }
});

test('le service worker est déclaré en module', () => {
  const background = readManifest().background;
  assert.equal(background.type, 'module', 'sans type module, les imports ES échouent');
  assert.ok(existsSync(join(EXT, background.service_worker)));
});

test('la popup déclarée existe', () => {
  const manifest = readManifest();
  assert.ok(existsSync(join(EXT, manifest.action.default_popup)));
});

test('aucun fichier référencé par le manifeste ne manque', () => {
  const manifest = readManifest();
  const referenced = [manifest.background.service_worker, manifest.action.default_popup];
  for (const icon of Object.values(manifest.icons ?? {})) referenced.push(icon);
  for (const file of referenced) {
    assert.ok(existsSync(join(EXT, file)), `fichier manquant : ${file}`);
  }
});

// ---------------------------------------------------------------------------
// Page de la popup
// ---------------------------------------------------------------------------

test('la popup ne contient aucun script inline (CSP de MV3)', () => {
  const html = readFileSync(join(EXT, 'popup.html'), 'utf8');
  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>/gi)]
    .filter((match) => !/\bsrc\s*=/i.test(match[1]));
  assert.equal(inlineScripts.length, 0, 'la CSP par défaut de MV3 refuse le script inline');
});

test('la popup référence ses ressources et elles existent', () => {
  const html = readFileSync(join(EXT, 'popup.html'), 'utf8');
  const sources = [
    ...[...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/<link[^>]*\bhref=["']([^"']+)["']/gi)].map((m) => m[1]),
  ];
  assert.ok(sources.length >= 2);
  for (const source of sources) {
    assert.ok(existsSync(join(EXT, source)), `ressource manquante : ${source}`);
  }
});

test('chaque identifiant utilisé par popup.js existe dans le HTML', () => {
  const html = readFileSync(join(EXT, 'popup.html'), 'utf8');
  const script = readFileSync(join(EXT, 'popup.js'), 'utf8');
  const ids = [...script.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    assert.ok(html.includes(`id="${id}"`), `identifiant absent du HTML : ${id}`);
  }
});

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

test('les imports relatifs résolvent dans l\'extension assemblée', () => {
  // Les sources de `src/extension/` importent « ./core/… », qui n'existe
  // qu'après copie du cœur partagé : c'est l'artefact assemblé qui doit être
  // résoluble, pas l'arbre source.
  for (const file of ['background.js', 'popup.js']) {
    const source = readFileSync(join(DIST_EXT, file), 'utf8');
    const specifiers = relativeImports(source);
    assert.ok(specifiers.length > 0, `${file} ne devrait pas être sans import`);
    for (const specifier of specifiers) {
      const target = resolve(dirname(join(DIST_EXT, file)), specifier);
      assert.ok(existsSync(target), `import cassé dans ${file} : ${specifier}`);
    }
  }
});

test('tous les imports visent le cœur partagé ou un module local', () => {
  // `./core/…` est recopié à la construction ; `./api.js` vit dans le dossier
  // de l'extension lui-même.
  const LOCAL_MODULES = ['./api.js'];

  for (const file of ['background.js', 'popup.js']) {
    const source = readFileSync(join(EXT, file), 'utf8');
    for (const specifier of relativeImports(source)) {
      // Un import remontant (« ../ ») sortirait du dossier de l'extension, que
      // le navigateur ne peut pas lire une fois l'extension chargée.
      assert.equal(specifier.includes('..'), false, `remontée interdite : ${specifier}`);

      const isShared = specifier.startsWith('./core/');
      const isLocal = LOCAL_MODULES.includes(specifier);
      assert.ok(isShared || isLocal, `chemin inattendu : ${specifier}`);

      if (isLocal) {
        assert.ok(existsSync(join(EXT, specifier)), `module local manquant : ${specifier}`);
      }
    }
  }
});

test('chaque fichier de l\'extension est syntaxiquement valide', () => {
  for (const file of ['background.js', 'popup.js', 'api.js']) {
    // `node --check` respecte le champ "type": "module" du package.json et
    // analyse donc ces fichiers comme des modules ES.
    execFileSync(process.execPath, ['--check', join(EXT, file)], { stdio: 'pipe' });
  }
});

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

test('la construction produit une extension autonome', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build.mjs'), '--only=extension'], {
    cwd: ROOT,
    stdio: 'pipe',
  });

  const dist = join(ROOT, 'dist', 'extension');
  const manifest = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);

  // Le cœur doit être présent DANS le dossier de l'extension : un chargement
  // « non empaqueté » ne peut pas lire hors de ce dossier.
  for (const module of ['store.js', 'capture.js', 'exporters.js', 'download.js']) {
    assert.ok(existsSync(join(dist, 'core', module)), `core/${module} absent du build`);
  }
  assert.ok(existsSync(join(dist, 'background.js')));
  assert.ok(existsSync(join(dist, 'popup.html')));
  assert.ok(existsSync(join(dist, 'popup.css')));
  assert.ok(existsSync(join(dist, 'api.js')));

  // Les icônes doivent voyager avec l'extension : sans elles, le navigateur
  // affiche un carré gris et le convertisseur Safari refuse l'empaquetage.
  for (const path of Object.values(manifest.icons)) {
    assert.ok(existsSync(join(dist, path)), `icône absente du build : ${path}`);
  }
});

test('le build n\'inclut aucun fichier de développement', () => {
  const dist = join(ROOT, 'dist', 'extension');
  for (const unwanted of ['node_modules', 'package.json', '.DS_Store']) {
    assert.equal(existsSync(join(dist, unwanted)), false, `${unwanted} ne doit pas être livré`);
  }
});
