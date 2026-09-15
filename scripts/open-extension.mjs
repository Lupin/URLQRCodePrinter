/**
 * Prépare l'installation de l'extension dans un navigateur Chromium.
 *
 * Chrome, Brave et Edge n'ont aucun mécanisme d'installation locale en un clic :
 * un fichier `.crx` téléchargé hors du Chrome Web Store est refusé, et le
 * magasin exige une publication. La seule voie locale est « Charger
 * l'extension non empaquetée », qui demande de désigner un dossier.
 *
 * Ce script réduit donc les gestes au minimum : il assemble l'extension, la
 * sélectionne dans le Finder, copie son chemin, et ouvre la page des extensions
 * du navigateur. Il ne reste qu'à coller le chemin dans la boîte de dialogue.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Safari 26 sait charger une extension **depuis un dossier**, via
 * « Add Temporary Extension… » dans ses réglages. C'est la voie la plus simple :
 * aucune application à compiler, aucune signature, aucun certificat.
 */
const FOR_SAFARI = process.argv.includes('--safari');

const DIST = join(ROOT, 'dist', FOR_SAFARI ? 'extension-safari' : 'extension');

/** Navigateurs reconnus, dans l'ordre de préférence. */
const BROWSERS = [
  { name: 'Brave', app: 'Brave Browser', page: 'brave://extensions' },
  { name: 'Chrome', app: 'Google Chrome', page: 'chrome://extensions' },
  { name: 'Edge', app: 'Microsoft Edge', page: 'edge://extensions' },
];

/** Ouvre la page des extensions du premier navigateur installé. */
function openExtensionsPage() {
  for (const browser of BROWSERS) {
    if (!existsSync(`/Applications/${browser.app}.app`)) continue;
    const opened = spawnSync('open', ['-a', browser.app, browser.page], { stdio: 'ignore' });
    if (opened.status === 0) return browser;
  }
  return null;
}

/** Active Safari, sans dépendre d'une API qui peut échouer. */
function activateSafari() {
  return spawnSync('open', ['-a', 'Safari'], { stdio: 'ignore' }).status === 0;
}

// L'extension doit être assemblée : le cœur partagé y est recopié, et sans lui
// le service worker échouerait au chargement.
const build = spawnSync(
  process.execPath,
  [join(ROOT, 'scripts', 'build.mjs'), `--only=${FOR_SAFARI ? 'extension-safari' : 'extension'}`],
  {
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
if (existsSync(join(ROOT, 'src', 'extension-src', 'manifest.json'))) {
  console.error(
    '✗ src/extension contient un manifest.json : ce dossier n\'est pas\n' +
    '  l\'extension construite, il ne doit pas pouvoir être chargé.',
  );
  process.exit(1);
}

// On révèle le dossier dans le Finder — ce qui le sélectionne — et on copie son
// chemin : les boîtes de dialogue des navigateurs acceptent un chemin collé, ce
// qui évite de se tromper de dossier.
spawnSync('open', ['-R', DIST], { stdio: 'inherit' });
spawnSync('pbcopy', { input: DIST, stdio: ['pipe', 'inherit', 'inherit'] });

const rule = '─'.repeat(70);

if (FOR_SAFARI) {
  const activated = activateSafari();

  console.log(`
${rule}
Dossier de l'extension, sélectionné dans le Finder et copié :

    ${DIST}

${activated ? 'Safari vient d\'être activé.' : 'Ouvrez Safari.'}

Safari 26 sait charger une extension depuis un dossier, sans application
à compiler ni signature :

  1. Réglages → onglet « Développeur »
     (si l'onglet n'apparaît pas : Réglages → Avancé → « Afficher le menu
     Développeur »)

  2. Cliquez « Add Temporary Extension… »
     — ou, en français, « Ajouter une extension temporaire… »

  3. macOS demande votre mot de passe ou votre empreinte : c'est normal,
     il autorise explicitement une extension non signée.

  4. Dans la boîte de dialogue :  ⌘⇧G, ⌘V, Entrée
     (le chemin est déjà dans le presse-papiers)

L'icône apparaît aussitôt dans la barre d'outils de Safari.

⚠  Une extension temporaire est déchargée à la fermeture de Safari. C'est la
   voie de développement ; pour un usage permanent, il faut un compte Apple
   Developer et une application signée distribuée par l'App Store.

⚠  Le bon dossier est « dist/extension-safari ». Aucun autre dossier du dépôt
   ne contient de manifeste : il est produit à la construction.
${rule}
`);
  process.exit(0);
}

const browser = openExtensionsPage();

console.log(`
${rule}
Dossier de l'extension, sélectionné dans le Finder et copié :

    ${DIST}

${browser
    ? `La page ${browser.page} vient de s'ouvrir dans ${browser.name}.`
    : 'Ouvrez la page des extensions de votre navigateur.'}

Pour l'installer — une seule fois :

  1. Activez « Mode développeur » (en haut à droite de la page)

  2. Cliquez « Charger l'extension non empaquetée »

  3. Dans la boîte de dialogue :  ⌘⇧G, puis ⌘V, puis Entrée
     (le chemin est déjà dans le presse-papiers)

⚠  Si une boîte « Failed to load extension » propose « Retry », cliquez
   « Cancel » : elle rejoue l'ancien chemin. Supprimez aussi l'ancienne
   entrée avec « Remove » avant de recharger.

⚠  Le bon dossier est « dist/extension ». Aucun autre dossier du dépôt ne
   contient de manifeste : il est produit à la construction.

L'icône apparaît alors dans la barre d'outils.

Pour imprimer depuis Brave, Web Bluetooth doit être activé :
    brave://flags#brave-web-bluetooth-api
Chrome et Edge n'ont pas cette contrainte, Safari ne l'implémente pas.

Une installation en un clic supposerait une publication sur le Chrome Web
Store : c'est la seule voie qu'acceptent ces navigateurs pour une extension
tierce.
${rule}
`);
