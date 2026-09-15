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

// Le manifeste est produit à la construction : le dossier source n'en contient
// pas, et ne peut donc pas être chargé par erreur. On le vérifie, car un
// manifeste présent dans les sources signalerait une régression.
if (existsSync(join(ROOT, 'src', 'extension', 'manifest.json'))) {
  console.error(
    '✗ src/extension contient un manifest.json : ce dossier n\'est pas\n' +
    '  l\'extension construite, il ne doit pas pouvoir être chargé.',
  );
  process.exit(1);
}

// On révèle le dossier dans le Finder — ce qui le sélectionne — et on copie son
// chemin : la boîte de dialogue « Charger l'extension non empaquetée » accepte
// un chemin collé, ce qui évite de se tromper de dossier.
spawnSync('open', ['-R', DIST], { stdio: 'inherit' });
spawnSync('pbcopy', { input: DIST, stdio: ['pipe', 'inherit', 'inherit'] });

console.log(`
──────────────────────────────────────────────────────────────────────
Le dossier de l'extension est sélectionné dans le Finder, et son chemin
complet est dans le presse-papiers :

    ${DIST.replace(ROOT + '/', '')}

Pour l'installer — une seule fois :

  1. Ouvrez la page des extensions du navigateur
        Brave  : brave://extensions
        Chrome : chrome://extensions
        Edge   : edge://extensions

  2. Activez « Mode développeur » (en haut à droite)

  3. Cliquez « Charger l'extension non empaquetée », puis dans la boîte de
     dialogue faites ⌘⇧G et collez le chemin (⌘V) — il est déjà copié.
     Ou glissez simplement le dossier sélectionné sur la page.

⚠  Chargez « dist/extension », jamais « src/extension ».
   Le dossier source ne contient pas le manifeste : il est produit à la
   construction, avec le cœur recopié et les fichiers assemblés.

L'icône apparaît alors dans la barre d'outils.

Pour imprimer depuis Brave, Web Bluetooth doit être activé :
    brave://flags#brave-web-bluetooth-api
Chrome et Edge n'ont pas cette contrainte.

Une installation en un clic supposerait une publication sur le Chrome Web
Store : c'est la seule voie qu'acceptent ces navigateurs pour une extension
tierce.
──────────────────────────────────────────────────────────────────────
`);
