/**
 * Génère le projet Xcode Safari à partir de l'extension.
 *
 * Trois étapes, toutes reproductibles :
 *   1. assembler `dist/extension` et ses icônes ;
 *   2. appeler `safari-web-extension-packager` ;
 *   3. relever les cibles de déploiement du projet généré.
 *
 * L'étape 3 est nécessaire et non évidente. Le convertisseur d'Apple génère des
 * cibles iOS 15.0 / macOS 10.14, alors que notre manifeste déclare
 * `strict_min_version: 16.4`. Or `background.type: "module"` — dont dépend
 * notre service worker — n'est supporté par Safari que depuis la 16.4. Avec une
 * cible plus basse, l'avertissement du convertisseur devient un vrai risque de
 * panne au chargement.
 */

import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeIcons } from './make-icons.mjs';
import { patchContainerApp } from './safari-container-app.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Variante Safari, et non la variante Chromium : celle-ci a vu sa clé
// `browser_specific_settings` retirée, or le convertisseur d'Apple s'en sert
// pour fixer la version minimale requise.
const DIST_EXTENSION = join(ROOT, 'dist', 'extension-safari');

/** Version minimale de Safari déclarée dans le manifeste. */
const SAFARI_MIN = '16.4';

/**
 * Équivalents système de Safari 16.4 : macOS 13.3 « Ventura », iOS 16.4.
 * En dessous, `background.type` n'est pas reconnu.
 */
const DEPLOYMENT = {
  IPHONEOS_DEPLOYMENT_TARGET: '16.4',
  MACOSX_DEPLOYMENT_TARGET: '13.3',
};

const PROJECT_LOCATION = join(ROOT, 'native', 'safari');
const PROJECT_DIR = join(PROJECT_LOCATION, 'URLQRCodePrinter', 'URLQRCodePrinter.xcodeproj');
const PROJECT_FILE = join(PROJECT_DIR, 'project.pbxproj');

/**
 * Aligne les cibles de déploiement du projet sur la version minimale de Safari.
 *
 * @param {string} pbxprojPath
 * @returns {Promise<Array<{ setting: string, from: string, to: string }>>}
 */
export async function alignDeploymentTargets(pbxprojPath) {
  const source = await readFile(pbxprojPath, 'utf8');
  const changes = [];
  let updated = source;

  for (const [setting, target] of Object.entries(DEPLOYMENT)) {
    const pattern = new RegExp(`${setting} = ([0-9.]+);`, 'g');
    const found = new Set([...updated.matchAll(pattern)].map((match) => match[1]));
    if (found.size === 0) continue;

    updated = updated.replace(pattern, `${setting} = ${target};`);
    for (const from of found) {
      if (from !== target) changes.push({ setting, from, to: target });
    }
  }

  if (updated !== source) await writeFile(pbxprojPath, updated, 'utf8');
  return changes;
}

/** Point d'entrée. */
async function main() {
  console.log('→ Assemblage de l\'extension (variante Safari)…');
  execFileSync(
    process.execPath,
    [join(ROOT, 'scripts', 'build.mjs'), '--only=extension-safari'],
    { cwd: ROOT, stdio: 'inherit' },
  );

  if (!existsSync(DIST_EXTENSION)) {
    throw new Error('dist/extension-safari est absent après la construction.');
  }

  console.log('→ Génération des icônes…');
  const icons = await writeIcons(join(DIST_EXTENSION, 'icons'));
  console.log(`  ${icons.length} icônes écrites`);

  console.log('→ Conversion en projet Xcode…');
  const args = [
    'safari-web-extension-packager',
    DIST_EXTENSION,
    '--project-location', PROJECT_LOCATION,
    '--app-name', 'URLQRCodePrinter',
    '--bundle-identifier', 'com.gael.urlqrcodeprinter',
    '--swift',
    '--copy-resources',
    '--no-open',
    '--no-prompt',
    '--force',
  ];

  // `xcrun` a besoin de DEVELOPER_DIR lorsque `xcode-select` pointe sur les
  // Command Line Tools.
  execFileSync('xcrun', args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      DEVELOPER_DIR: process.env.DEVELOPER_DIR
        ?? '/Applications/Xcode.app/Contents/Developer',
    },
  });

  if (!existsSync(PROJECT_FILE)) {
    throw new Error(`Le projet n'a pas été généré : ${PROJECT_FILE}`);
  }

  console.log(`→ Alignement des cibles de déploiement sur Safari ${SAFARI_MIN}…`);
  const changes = await alignDeploymentTargets(PROJECT_FILE);
  if (changes.length === 0) {
    console.log('  déjà conformes');
  } else {
    for (const change of changes) {
      console.log(`  ${change.setting} : ${change.from} → ${change.to}`);
    }
  }

  console.log('→ Correction de la fenêtre de l\'application conteneur…');
  const container = await patchContainerApp(PROJECT_LOCATION);
  for (const file of container.patched) console.log(`  corrigé : ${file}`);
  for (const problem of container.missing) {
    // Le modèle d'Apple a changé : on le signale sans interrompre, la
    // compilation reste possible.
    console.log(`  ⚠ non appliqué — ${problem}`);
  }

  console.log('\nProjet prêt :');
  console.log(`  ${PROJECT_DIR}`);
  console.log('\nPour compiler (macOS) :');
  console.log(
    '  DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \\\n' +
    '  xcodebuild -project "' + PROJECT_DIR + '" \\\n' +
    '    -scheme "URLQRCodePrinter (macOS)" -destination "platform=macOS" \\\n' +
    '    -derivedDataPath native/safari/build/dd CODE_SIGNING_ALLOWED=NO build',
  );
  console.log('\nLa cible iOS ne se compile pas dans un environnement restreint :');
  console.log('IBAgent-iOS a besoin d\'écrire dans ~/Library/Developer/CoreSimulator.');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}

export { DEPLOYMENT, SAFARI_MIN };
