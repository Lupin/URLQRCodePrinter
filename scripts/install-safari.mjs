/**
 * Installe l'extension dans Safari (macOS).
 *
 * Safari n'a pas de « charger l'extension non empaquetée » comme Chrome : une
 * extension Safari **est** une application macOS qui embarque l'extension. La
 * seule façon d'enregistrer l'extension est donc d'exécuter l'application une
 * fois — Safari la découvre alors dans ses réglages.
 *
 * Ce script enchaîne les trois étapes : générer le projet Xcode, compiler
 * l'application macOS, puis la lancer.
 *
 * Une installation en un seul clic supposerait une application signée avec un
 * certificat Apple Developer et notariée, ou distribuée via l'App Store. Pour
 * un usage local, c'est cette voie qu'il faut suivre.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = join(
  ROOT, 'native', 'safari', 'URLQRCodePrinter', 'URLQRCodePrinter.xcodeproj'
);
const DERIVED = join(ROOT, 'native', 'safari', 'build', 'dd');
const APP = join(DERIVED, 'Build', 'Products', 'Debug', 'URLQRCodePrinter.app');

const DEVELOPER_DIR =
  process.env.DEVELOPER_DIR ?? '/Applications/Xcode.app/Contents/Developer';

/** Exécute une commande et interrompt le script en cas d'échec. */
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, DEVELOPER_DIR },
    ...options,
  });
  if (result.error) {
    console.error(`\n✗ ${command} est introuvable : ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\n✗ ${command} a échoué (code ${result.status}).`);
    process.exit(result.status ?? 1);
  }
}

const skipBuild = process.argv.includes('--no-build');

if (!skipBuild) {
  console.log('→ Génération du projet Xcode…\n');
  run(process.execPath, [join(ROOT, 'scripts', 'package-safari.mjs')]);

  console.log('\n→ Compilation de l\'application macOS (une à deux minutes)…\n');
  run('xcodebuild', [
    '-project', PROJECT,
    '-scheme', 'URLQRCodePrinter (macOS)',
    '-destination', 'platform=macOS',
    '-derivedDataPath', DERIVED,
    // Signature désactivée, et non pas ad-hoc.
    //
    // Une extension Safari réclame des droits que la signature ad-hoc ne sait
    // pas produire : `CodeSign` échoue. Sans signature, Xcode produit un
    // binaire signé par l'éditeur de liens, que macOS accepte de lancer et que
    // Safari enregistre — c'est la configuration qui fonctionne, à condition
    // d'autoriser les extensions non signées dans le menu Développeur.
    'CODE_SIGNING_ALLOWED=NO',
    'CODE_SIGNING_REQUIRED=NO',
    'CODE_SIGN_IDENTITY=',
    'build',
  ]);
}

if (!existsSync(APP)) {
  console.error(`\n✗ Application introuvable : ${APP}`);
  process.exit(1);
}

console.log('\n→ Lancement de l\'application, qui enregistre l\'extension…\n');
run('open', [APP]);

console.log(`
──────────────────────────────────────────────────────────────────────
L'application vient d'être lancée. Elle n'a pas d'interface : son seul
rôle est d'enregistrer l'extension auprès de Safari.

Il reste deux réglages à faire une fois :

1. Autoriser les extensions non signées (nécessaire pour une compilation
   locale — sans certificat Apple Developer) :
      Safari → Réglages → Avancé → « Afficher le menu Développeur »
      puis  Développeur → « Autoriser les extensions non signées »

2. Activer l'extension :
      Safari → Réglages → Extensions → cocher « URLQRCodePrinter »

L'icône apparaît ensuite dans la barre d'outils de Safari.

Pour installer sur iPhone ou iPad, il faut un compte Apple Developer :
le simulateur fonctionne sans, pas un appareil réel.
──────────────────────────────────────────────────────────────────────
`);
