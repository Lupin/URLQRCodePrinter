/**
 * Recopie `dist/extension-safari` dans les ressources de l'appex Safari.
 *
 * Le dossier `native/safari/…/Resources` est versionné parce que le projet Xcode
 * le référence : sans lui, un dépôt fraîchement cloné ne compile pas. Mais ce
 * dossier n'est qu'une **copie** de `dist/extension-safari` — c'est exactement ce
 * que fait `--copy-resources` du convertisseur d'Apple.
 *
 * Deux chemins pour le mettre à jour :
 *   - `npm run package:safari`, qui régénère tout le projet Xcode (Xcode requis) ;
 *   - `npm run sync:safari`, qui ne fait que la copie (aucun outil Apple requis).
 *
 * Sans cette copie, le projet Xcode compile un `app.js` antérieur à `src/` :
 * l'application embarquée diverge silencieusement de la source.
 */

import { cp, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'dist', 'extension-safari');
const TARGET = join(
  ROOT,
  'native',
  'safari',
  'URLQRCodePrinter',
  'Shared (Extension)',
  'Resources',
);

/**
 * Retire les copies de synchronisation iCloud (« app 2.js », « icon 3.png »).
 *
 * Elles apparaissent dans le dossier Documents pendant que les captures ou le
 * build écrivent, et le miroir les refusait à juste titre. On les enlève des
 * deux côtés avant de comparer et de copier.
 */
async function retirerDoublons(dossier) {
  if (!existsSync(dossier)) return;
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      await retirerDoublons(chemin);
      continue;
    }
    if (!/ \d+\.[A-Za-z0-9]+$/.test(entree.name)) continue;
    await rm(chemin, { force: true });
    console.log(`  doublon retiré : ${chemin.slice(ROOT.length + 1)}`);
  }
}

/** Point d'entrée. */
async function main() {
  if (!existsSync(SOURCE)) {
    throw new Error(
      `dist/extension-safari est absent. Lancez d'abord :\n` +
        '  npm run build',
    );
  }

  await retirerDoublons(SOURCE);
  await retirerDoublons(TARGET);
  const entries = await readdir(SOURCE);

  // Les ressources doivent refléter la source **exactement**. Une copie macOS
  // (« app 2.js »), un fichier renommé à la main ou une entrée retirée de la
  // construction survivraient sinon en silence, et Xcode embarquerait un
  // fichier que plus personne ne produit.
  const supprimes = [];
  for (const present of await readdir(TARGET)) {
    if (entries.includes(present)) continue;
    await rm(join(TARGET, present), { recursive: true, force: true });
    supprimes.push(present);
  }

  for (const entry of entries) {
    // On remplace l'entrée entière : un fichier supprimé de la source ne doit
    // pas survivre dans les ressources.
    await rm(join(TARGET, entry), { recursive: true, force: true });
    await cp(join(SOURCE, entry), join(TARGET, entry), { recursive: true });
  }

  for (const nom of supprimes) console.log(`  supprimé : ${nom} (absent de la source)`);
  console.log(`✓ ${entries.length} entrées copiées vers ${TARGET.slice(ROOT.length + 1)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}
