/**
 * Assemble les livrables dans `dist/`.
 *
 * Le cœur partagé est recopié dans chaque cible plutôt que référencé depuis
 * l'extérieur : une extension chargée « non empaquetée » ne peut pas accéder
 * aux fichiers situés hors de son dossier, et un serveur web ne doit pas
 * exposer tout le dépôt.
 *
 * Aucun bundler n'est nécessaire : tout est en modules ES natifs.
 */

import { cp, mkdir, rm, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

/** Cibles connues : source applicative + fichiers communs à recopier. */
const TARGETS = {
  extension: { from: join(SRC, 'extension'), shared: [join(SRC, 'core')] },
  web: { from: join(SRC, 'web'), shared: [join(SRC, 'core')] },
};

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
