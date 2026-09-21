/**
 * Assemble le site public : page d'accueil et application.
 *
 * Le site sert deux choses sous une même adresse :
 *
 *   /            la page de présentation, en français ;
 *   /en/         la même, en anglais ;
 *   /app/        l'application elle-même, telle que `build.mjs --only=web` la
 *                produit, servie à part et non fusionnée.
 *
 * Pourquoi une copie sous `app/` plutôt qu'un renommage de `dist/web` : ce
 * dossier est lu par `test/web.test.js`, par `web-boot.test.js` et par
 * `scripts/serve.mjs`. Le déplacer pour les besoins du site casserait trois
 * choses qui n'ont rien à voir avec lui. Le site est un assemblage, pas un
 * déplacement.
 *
 * L'application est un site statique dont **tous** les imports sont relatifs
 * (`./core/...`) : elle fonctionne donc sous un sous-chemin, sans réécriture.
 * C'est ce qui rend cette organisation possible.
 */

import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stampAssetVersions } from './build.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'src', 'site');
const ICONS = join(ROOT, 'src', 'extension-src', 'icons');
const APP = join(ROOT, 'dist', 'web');
const OUT = join(ROOT, 'dist', 'site');

/**
 * Icône du produit, reprise telle quelle.
 *
 * Elle vient de `src/extension-src/icons`, la source unique déjà utilisée par
 * l'extension et le projet Xcode. En produire une seconde pour le site
 * introduirait deux dessins à tenir d'accord.
 */
const ICON = 'icon-512.png';

/** Pages du site, et les ressources dont chacune dépend. */
const PAGES = [
  { path: join(OUT, 'index.html'), assets: ['style.css'] },
  { path: join(OUT, 'en', 'index.html'), assets: ['style.css'] },
];

/** Copie une entrée, en remplaçant la destination. */
async function copy(source, destination) {
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
}

/**
 * Point d'entrée.
 *
 * `--no-build` réutilise `dist/web` déjà construit au lieu de le refaire. Ce
 * n'est pas qu'une commodité : `web.test.js` et `web-boot.test.js` lisent ce
 * dossier, et `build.mjs` commence par le supprimer avant de le repeupler. Le
 * test du site ne peut donc pas le reconstruire sans courir en parallèle des
 * autres — la course qui a déjà rendu un test intermittent dans ce dépôt.
 */
async function main() {
  const skipBuild = process.argv.includes('--no-build');

  if (skipBuild) {
    console.log('→ Application web réutilisée (--no-build)…');
  } else {
    console.log('→ Assemblage de l\'application web…');
    execFileSync(
      process.execPath,
      [join(ROOT, 'scripts', 'build.mjs'), '--only=web'],
      { cwd: ROOT, stdio: 'inherit' },
    );
  }

  if (!existsSync(join(APP, 'index.html'))) {
    throw new Error(`L'application n'a pas été produite : ${APP}`);
  }
  if (!existsSync(join(SOURCE, 'index.html'))) {
    throw new Error(`La page d'accueil est absente : ${SOURCE}`);
  }

  console.log('\n→ Assemblage du site…');
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // Les pages d'abord : `en/` existe avant que les fichiers du sous-dossier y
  // soient déposés.
  for (const entry of await readdir(SOURCE, { withFileTypes: true })) {
    await copy(join(SOURCE, entry.name), join(OUT, entry.name));
  }

  await copy(APP, join(OUT, 'app'));
  console.log('  application servie sous /app/');

  const icon = join(ICONS, ICON);
  if (existsSync(icon)) {
    await copy(icon, join(OUT, ICON));
    console.log(`  ${ICON} reprise de l'extension`);
  } else {
    console.log(`  ⚠ ${ICON} introuvable : la page s'affichera sans icône`);
  }

  // Après la copie : l'empreinte doit porter sur le contenu réellement servi.
  // Sans elle, un `style.css` gardé en cache survivrait à une refonte, et la
  // page apparaîtrait à moitié mise en page.
  for (const page of PAGES) {
    if (!existsSync(page.path)) continue;
    const stamped = await stampAssetVersions(page.path, OUT, page.assets);
    const label = page.path.slice(OUT.length + 1);
    if (stamped.length > 0) console.log(`  ${label} — ${stamped.join(', ')}`);
  }

  const files = await readdir(OUT);
  console.log(`\n✓ ${OUT.slice(ROOT.length + 1)}  (${files.length} entrées)`);
  console.log('  / → page d\'accueil · /en/ → anglais · /app/ → application');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}
