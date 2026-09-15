/**
 * Prépare l'installation de l'extension dans un navigateur Chromium.
 *
 * Chrome, Brave et Edge n'ont aucun mécanisme d'installation locale en un clic :
 * un fichier `.crx` téléchargé hors du Chrome Web Store est refusé, et le
 * magasin exige une publication. La seule voie locale est « Charger
 * l'extension non empaquetée », qui demande de désigner un dossier.
 *
 * Ce script ne peut donc pas tout faire. Il assemble l'extension et l'ouvre
 * dans le Finder, de sorte qu'il ne reste qu'à la glisser sur la page des
 * extensions.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'extension');

// L'extension doit être assemblée : le cœur partagé y est recopié, et sans lui
// le service worker échouerait au chargement.
const build = spawnSync(process.execPath, [join(ROOT, 'scripts', 'build.mjs'), '--only=extension'], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (build.status !== 0) process.exit(build.status ?? 1);

if (!existsSync(join(DIST, 'manifest.json'))) {
  console.error(`✗ Extension introuvable : ${DIST}`);
  process.exit(1);
}

// Ouvre le dossier dans le Finder, à côté de la page des extensions.
spawnSync('open', [DIST], { stdio: 'inherit' });

console.log(`
──────────────────────────────────────────────────────────────────────
Le dossier de l'extension vient de s'ouvrir dans le Finder :

    ${DIST.replace(ROOT + '/', '')}

Pour l'installer — une seule fois :

  1. Ouvrez la page des extensions du navigateur
        Brave  : brave://extensions
        Chrome : chrome://extensions
        Edge   : edge://extensions

  2. Activez « Mode développeur » (en haut à droite)

  3. Glissez le dossier « extension » depuis le Finder sur cette page,
     ou cliquez « Charger l'extension non empaquetée » et choisissez-le.

L'icône apparaît alors dans la barre d'outils.

Pour imprimer depuis Brave, Web Bluetooth doit être activé :
    brave://flags#brave-web-bluetooth-api
Chrome et Edge n'ont pas cette contrainte.

Une installation en un clic supposerait une publication sur le Chrome Web
Store : c'est la seule voie qu'acceptent ces navigateurs pour une extension
tierce.
──────────────────────────────────────────────────────────────────────
`);
