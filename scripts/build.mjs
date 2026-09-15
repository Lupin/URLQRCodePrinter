/**
 * Assemble les livrables dans `dist/`.
 *
 * Le cœur partagé est recopié dans chaque cible plutôt que référencé depuis
 * l'extérieur : une extension chargée « non empaquetée » ne peut pas accéder
 * aux fichiers situés hors de son dossier, et un serveur web ne doit pas
 * exposer tout le dépôt.
 *
 * L'application web reste en modules ES natifs. L'extension, elle, est
 * **assemblée en fichiers uniques** : Safari ne résout pas les imports situés
 * dans un sous-dossier d'une extension, et répond « invalid path » alors que
 * les fichiers sont bien dans le paquet. Voir `scripts/bundle.mjs`.
 */

import { cp, mkdir, rm, stat, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bundle, findResidualModuleSyntax } from './bundle.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

/**
 * Cibles connues : source applicative + fichiers communs à recopier.
 *
 * Deux variantes de l'extension sont produites, et ce n'est pas un luxe :
 * `browser_specific_settings` est une clé Firefox/Safari que Chrome et Brave
 * ne reconnaissent pas. Elle déclenche un avertissement de manifeste dans la
 * page des extensions, surligné avec le contenu du fichier — de quoi croire à
 * une erreur bloquante alors que l'extension fonctionne. On la retire donc de
 * la variante Chromium et on la conserve pour Safari, qui en a besoin.
 */
const TARGETS = {
  extension: {
    from: join(SRC, 'extension-src'),
    shared: [join(SRC, 'core')],
    manifest: 'chromium',
  },
  'extension-safari': {
    from: join(SRC, 'extension-src'),
    shared: [join(SRC, 'core')],
    manifest: 'safari',
  },
  web: { from: join(SRC, 'web'), shared: [join(SRC, 'core')] },
};

/** Clés comprises par Safari mais inconnues de Chromium. */
const SAFARI_ONLY_KEYS = ['browser_specific_settings'];

/** Points d'entrée de l'extension, assemblés en fichiers uniques. */
const EXTENSION_ENTRIES = ['background.js', 'popup.js'];

/** Dossiers et fichiers devenus inutiles une fois l'extension assemblée. */
const EXTENSION_DEBRIS = ['core', 'api.js'];

/**
 * Produit le manifeste de la cible à partir du gabarit.
 *
 * Le dossier source ne contient volontairement **pas** de `manifest.json` :
 * un dossier qui ressemble à une extension mais n'en est pas une invite à
 * charger le mauvais. `src/extension` importe `./core/…`, recopié seulement à
 * la construction, et son service worker ne peut donc pas démarrer. Sans
 * manifeste, le navigateur répond « fichier de manifeste absent » — message
 * clair, là où un manifeste valide produirait une erreur d'import obscure.
 *
 * @param {string} outDir
 * @param {'chromium'|'safari'|undefined} variant
 * @returns {Promise<string[]>} clés retirées
 */
async function materialiseManifest(outDir, variant) {
  const templatePath = join(outDir, 'manifest.template.json');
  if (!existsSync(templatePath)) return [];

  const manifest = JSON.parse(await readFile(templatePath, 'utf8'));
  const removed = [];

  // Le service worker et la fenêtre sont assemblés en fichiers uniques, sans
  // imports : ils n'ont plus besoin d'être chargés comme modules. Cela supprime
  // au passage l'avertissement du convertisseur Apple sur `background.type`.
  if (manifest.background?.type) {
    delete manifest.background.type;
    removed.push('background.type');
  }

  if (variant === 'chromium') {
    for (const key of SAFARI_ONLY_KEYS) {
      if (key in manifest) {
        delete manifest[key];
        removed.push(key);
      }
    }
  }

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  await rm(templatePath, { force: true });

  return removed;
}

/**
 * Assemble les points d'entrée de l'extension et supprime les modules sources.
 *
 * Safari ne résout pas les imports situés dans un sous-dossier d'une extension,
 * alors que les fichiers y sont bel et bien présents. Plutôt que d'aplatir
 * l'arborescence pour contourner le symptôme, on supprime la cause : après cet
 * appel, l'extension ne contient plus un seul `import`.
 *
 * @param {string} outDir
 * @returns {Promise<{ entries: string[], modules: number }>}
 */
async function bundleExtension(outDir) {
  const entries = [];
  const seen = new Set();

  for (const entry of EXTENSION_ENTRIES) {
    const path = join(outDir, entry);
    if (!existsSync(path)) continue;

    const { code, modules } = bundle(path, {
      header:
        `// ${entry} — fichier assemblé par scripts/build.mjs.\n` +
        '// Ne pas modifier ici : éditez les modules de src/ et reconstruisez.',
    });

    const residual = findResidualModuleSyntax(code);
    if (residual.length > 0) {
      throw new Error(`${entry} : syntaxe de module résiduelle — ${residual.join(' ; ')}`);
    }

    await writeFile(path, code, 'utf8');
    entries.push(entry);
    for (const module of modules) seen.add(module);
  }

  for (const debris of EXTENSION_DEBRIS) {
    await rm(join(outDir, debris), { recursive: true, force: true });
  }

  return { entries, modules: seen.size };
}

/** Vérifie l'existence d'un chemin. */
async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Construit une cible.
 * @param {string} name
 * @returns {Promise<{ name: string, outDir: string, files: number }>}
 */
async function buildTarget(name) {
  const target = TARGETS[name];
  if (!target) throw new Error(`Cible inconnue : ${name}`);

  if (!(await exists(target.from))) {
    throw new Error(
      `Source absente pour « ${name} » : ${target.from}\n` +
      'Créez le dossier ou utilisez --only pour ne construire qu\'une cible.',
    );
  }

  const outDir = join(DIST, name);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await cp(target.from, outDir, { recursive: true });

  for (const sharedDir of target.shared) {
    const sharedName = sharedDir.split('/').pop();
    await cp(sharedDir, join(outDir, sharedName), { recursive: true });
  }

  const removed = await materialiseManifest(outDir, target.manifest);
  if (removed.length > 0) {
    console.log(`  ${name} : clés retirées du manifeste (${removed.join(', ')})`);
  }

  if (target.manifest) {
    const bundled = await bundleExtension(outDir);
    console.log(
      `  ${name} : ${bundled.entries.join(' et ')} assemblés ` +
      `(${bundled.modules} modules, plus aucun import)`,
    );
  }

  return { name, outDir, files: await countFiles(outDir) };
}

/**
 * Compte récursivement les fichiers d'un dossier.
 * @param {string} dir
 * @returns {Promise<number>}
 */
async function countFiles(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) total += await countFiles(join(dir, entry.name));
    else total += 1;
  }
  return total;
}

/** Point d'entrée. */
async function main() {
  const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
  const requested = onlyArg ? onlyArg.slice('--only='.length).split(',') : Object.keys(TARGETS);

  for (const name of requested) {
    if (!TARGETS[name]) {
      console.error(`Cible inconnue : ${name}. Connues : ${Object.keys(TARGETS).join(', ')}`);
      process.exitCode = 1;
      return;
    }
  }

  const results = [];
  for (const name of requested) {
    try {
      results.push(await buildTarget(name));
    } catch (error) {
      console.error(`✗ ${name} : ${error.message}`);
      process.exitCode = 1;
    }
  }

  for (const result of results) {
    const relative = result.outDir.slice(ROOT.length + 1);
    console.log(`✓ ${result.name.padEnd(10)} ${relative}  (${result.files} fichiers)`);
  }
}

// Exécution directe uniquement : le module reste importable par les tests.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}

export { buildTarget, TARGETS, exists };
