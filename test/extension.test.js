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
const EXT = join(ROOT, 'src', 'extension-src');
const DIST_EXT = join(ROOT, 'dist', 'extension');

// L'extension n'est complète qu'une fois le cœur partagé recopié : plusieurs
// vérifications portent donc sur l'artefact assemblé. On construit les deux
// variantes une fois, avant que les tests ne s'exécutent.
execFileSync(
  process.execPath,
  [join(ROOT, 'scripts', 'build.mjs'), '--only=extension,extension-safari'],
  { cwd: ROOT, stdio: 'pipe' },
);

/**
 * Lit le gabarit de manifeste.
 *
 * Le dossier source n'en contient pas : il est produit à la construction, ce
 * qui empêche de charger `src/extension` en croyant charger l'extension.
 */
function readManifest() {
  return JSON.parse(readFileSync(join(EXT, 'manifest.template.json'), 'utf8'));
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

test('l\'extension assemblée ne contient plus un seul import', () => {
  // Safari ne résout pas les imports situés dans un sous-dossier d'une
  // extension : il répond « invalid path » alors que les fichiers sont bien
  // dans le paquet. Les points d'entrée sont donc assemblés en fichiers
  // uniques, et le dossier `core/` disparaît de l'artefact.
  for (const file of ['background.js', 'popup.js']) {
    const source = readFileSync(join(DIST_EXT, file), 'utf8');
    const specifiers = relativeImports(source);

    assert.deepEqual(specifiers, [], `${file} contient encore des imports`);

    const residual = source
      .split('\n')
      .map((line, index) => ({ line, index: index + 1 }))
      .filter(({ line }) => /^\s*(import|export)\s/.test(line));
    assert.deepEqual(
      residual.map((entry) => `${file}:${entry.index}`),
      [],
      'syntaxe de module résiduelle',
    );
  }
});

test('le dossier core/ ne subsiste pas dans l\'artefact', () => {
  // Rien ne l'importe plus : le laisser induirait en erreur et alourdirait le
  // paquet de l'extension.
  assert.equal(existsSync(join(DIST_EXT, 'core')), false);
  assert.equal(existsSync(join(DIST_EXT, 'api.js')), false);
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

test('aucune page d\'extension n\'utilise d\'await de premier niveau', () => {
  // Régression observée sur Safari : avec un `await` de premier niveau, la
  // fenêtre n'exécutait **aucun** script et restait figée sur « Chargement… »,
  // boutons grisés — le HTML statique, sans le moindre message d'erreur.
  // L'attente doit vivre dans une fonction dont l'échec est rattrapé.
  for (const file of ['popup.js', 'background.js']) {
    const source = readFileSync(join(EXT, file), 'utf8');
    const topLevelAwait = source
      .split('\n')
      .map((line, index) => ({ line, index: index + 1 }))
      .filter(({ line }) => /^await\s/.test(line));

    assert.deepEqual(
      topLevelAwait.map((entry) => `${file}:${entry.index}`),
      [],
      'await de premier niveau détecté',
    );
  }
});

test('la fenêtre rattrape ses erreurs de démarrage', () => {
  // Sans ce filet, une exception au chargement laisse la fenêtre muette.
  const source = readFileSync(join(EXT, 'popup.js'), 'utf8');
  assert.match(source, /function reportStartupFailure/);
  assert.match(source, /try\s*\{[\s\S]*await loadActiveTab\(\)[\s\S]*catch\s*\(error\)/);
  assert.match(source, /^main\(\);$/m);
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

  // Tout doit tenir dans le dossier de l'extension : un chargement « non
  // empaqueté » ne peut rien lire en dehors.
  assert.ok(existsSync(join(dist, 'background.js')));
  assert.ok(existsSync(join(dist, 'popup.html')));
  assert.ok(existsSync(join(dist, 'popup.css')));
  assert.ok(existsSync(join(dist, 'popup.js')));

  // Les icônes doivent voyager avec l'extension : sans elles, le navigateur
  // affiche un carré gris et le convertisseur Safari refuse l'empaquetage.
  for (const path of Object.values(manifest.icons)) {
    assert.ok(existsSync(join(dist, path)), `icône absente du build : ${path}`);
  }
});

test('le service worker n\'est plus déclaré comme module', () => {
  // Le point d'entrée est assemblé en un fichier sans imports : le charger
  // comme module n'apporte rien, et `background.type` est justement la clé que
  // le convertisseur Apple signale comme non prise en charge.
  for (const name of ['extension', 'extension-safari']) {
    const manifest = JSON.parse(
      readFileSync(join(ROOT, 'dist', name, 'manifest.json'), 'utf8'),
    );
    assert.equal(manifest.background.type, undefined);
    assert.equal(manifest.background.service_worker, 'background.js');
  }
});

test('le build n\'inclut aucun fichier de développement', () => {
  const dist = join(ROOT, 'dist', 'extension');
  for (const unwanted of ['node_modules', 'package.json', '.DS_Store']) {
    assert.equal(existsSync(join(dist, unwanted)), false, `${unwanted} ne doit pas être livré`);
  }
});

test('la variante Chromium ne contient aucune clé propre à Safari', () => {
  // `browser_specific_settings` est inconnue de Chrome et de Brave. Ils
  // l'affichent comme un avertissement de manifeste, en surlignant le fichier
  // avec ses numéros de ligne — de quoi croire à une erreur bloquante alors
  // que l'extension fonctionne. On la retire donc à la construction.
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'dist', 'extension', 'manifest.json'), 'utf8'),
  );
  assert.equal(manifest.browser_specific_settings, undefined);
  assert.equal(manifest.manifest_version, 3);
});

test('la variante Safari conserve la version minimale requise', () => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'dist', 'extension-safari', 'manifest.json'), 'utf8'),
  );
  // Sans elle, le convertisseur d'Apple cible iOS 15, où `background.type`
  // n'est pas reconnu et le service worker ne se charge pas.
  assert.equal(manifest.browser_specific_settings?.safari?.strict_min_version, '16.4');
});

test('les deux variantes sont complètes et autonomes', () => {
  for (const name of ['extension', 'extension-safari']) {
    const dir = join(ROOT, 'dist', name);
    for (const file of [
      'manifest.json',
      'background.js',
      'popup.js',
      'popup.html',
      'popup.css',
      // L'application est embarquée : c'est elle qui affiche les QR codes, et
      // elle partage le stockage de l'extension.
      'app.html',
      'app.js',
      'style.css',
    ]) {
      assert.ok(existsSync(join(dir, file)), `${name} : ${file} manquant`);
    }

    // L'assemblage a bien eu lieu : plus aucun module, et le gabarit de
    // manifeste ne doit pas être livré.
    for (const leftover of ['core', 'api.js', 'element-ids.js', 'manifest.template.json']) {
      assert.equal(existsSync(join(dir, leftover)), false, `${name} : ${leftover} subsiste`);
    }

    // Aucun fichier livré ne doit contenir de syntaxe de module.
    for (const file of ['background.js', 'popup.js', 'app.js']) {
      const source = readFileSync(join(dir, file), 'utf8');
      const residual = source
        .split('\n')
        .map((line, index) => ({ line, index: index + 1 }))
        .filter(({ line }) => /^\s*(import|export)\s/.test(line));
      assert.deepEqual(
        residual.map((entry) => `${name}/${file}:${entry.index}`),
        [],
        'syntaxe de module résiduelle',
      );
    }
  }
});

test('la fenêtre propose d\'ouvrir l\'application, où sont les QR codes', () => {
  for (const dir of [EXT, join(ROOT, 'dist', 'extension')]) {
    const html = readFileSync(join(dir, 'popup.html'), 'utf8');
    const script = readFileSync(join(dir, 'popup.js'), 'utf8');

    assert.match(html, /id="open-app"/, `${dir} : bouton absent`);
    assert.match(script, /getURL\('app\.html'\)/, `${dir} : ouverture non branchée`);
  }
});

test('le dossier source n\'est pas chargeable comme extension', () => {
  // Il importe `./core/…`, recopié seulement à la construction : son service
  // worker ne peut pas démarrer. Sans manifeste, le navigateur répond
  // « manifeste absent » — message clair — au lieu d'une erreur d'import
  // obscure. C'est ce qui a fait croire à une extension cassée alors que le
  // mauvais dossier était chargé.
  assert.equal(existsSync(join(EXT, 'manifest.json')), false);
  assert.ok(existsSync(join(EXT, 'manifest.template.json')));
  assert.equal(existsSync(join(EXT, 'core')), false);
});
