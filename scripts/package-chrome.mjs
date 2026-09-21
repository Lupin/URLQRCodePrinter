/**
 * Produit l'archive à déposer sur le Chrome Web Store.
 *
 * Pourquoi un script plutôt qu'un clic droit → « Compresser » dans le Finder.
 * Le Finder enveloppe le dossier : l'archive contient `extension/manifest.json`
 * au lieu de `manifest.json` **à la racine**. Le magasin refuse alors le paquet
 * avec un message qui ne dit pas pourquoi. C'est l'erreur de première soumission
 * la plus courante, et elle ne se voit qu'au refus.
 *
 * L'archive est écrite par `src/core/zip.js` — déjà présent pour les exports de
 * l'application, et sans compression, ce que le magasin accepte. Aucun outil
 * externe n'est donc requis, et le test peut **relire** ce qui a été produit
 * avec `readStoredZip`, plutôt que de faire confiance à un `unzip` de la machine.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createZip, readStoredZip } from '../src/core/zip.js';
import { stripSystemFiles } from './build.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'dist', 'extension');

/**
 * Nom fixe, sans numéro de version.
 *
 * La version qui fait foi est celle du manifeste : c'est elle que le magasin
 * lit. Un nom stable évite d'accumuler des archives périmées dans `dist/` et
 * simplifie tout envoi scripté.
 */
const ARCHIVE = join(ROOT, 'dist', 'url-qrcode-printer-chrome.zip');

/**
 * Décide si une entrée est un débris à ne jamais empaqueter.
 *
 * Deux familles. Les fichiers du système, que macOS sème en parcourant un
 * dossier au Finder. Et les doublons ` 2`, dont un `_locales 2` rend
 * l'extension **entièrement** inchargeable dans Chrome — le message d'erreur ne
 * dit alors pas d'où vient le dossier.
 *
 * La politique est écrite ici une seule fois : elle sert à exclure ces entrées
 * de l'archive, et à les signaler si elles y sont malgré tout.
 *
 * @param {string} name Nom relatif, séparateurs `/`.
 * @returns {string | null} La raison, ou `null` si l'entrée est légitime.
 */
function junkReason(name) {
  if (/\.DS_Store$/.test(name)) return '.DS_Store';
  if (/Thumbs\.db$/.test(name)) return 'Thumbs.db';
  if (/(^|\/)__MACOSX(\/|$)/.test(name)) return '__MACOSX';
  if (name.split('/').some((segment) => / 2$/.test(segment))) return 'doublon macOS « 2 »';
  return null;
}

/**
 * Liste récursivement les fichiers d'un dossier, en noms relatifs POSIX.
 *
 * Le séparateur est normalisé : une archive ZIP exige `/`, y compris si elle a
 * été produite sous Windows.
 *
 * @param {string} dir
 * @param {string} [base] Racine dont les noms sont rendus relatifs.
 * @returns {Promise<Array<{ absolute: string, name: string }>>}
 */
async function collectFiles(dir, base = dir) {
  const found = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);

    if (entry.isDirectory()) {
      found.push(...await collectFiles(absolute, base));
      continue;
    }
    // Les liens symboliques sont ignorés : le magasin n'attend que des fichiers.
    if (!entry.isFile()) continue;

    // Relatif à la **racine**, pas au dossier courant : sinon un fichier niché
    // perdrait son arborescence et deux fichiers homonymes se recouvriraient.
    const name = relative(base, absolute).split(sep).join('/');

    // L'archive ne doit pas dépendre de l'état du dossier d'entrée : un
    // `.DS_Store` apparu après la construction ne doit pas partir dans le
    // paquet. L'exclusion est donc faite ici, et non laissée à l'appelant.
    if (junkReason(name) !== null) continue;

    found.push({ absolute, name });
  }

  return found;
}

/**
 * Releve les chemins que le manifeste référence.
 *
 * Le magasin refuse une extension dont le manifeste annonce un fichier absent :
 * `service_worker`, `default_popup`, une icône, ou le `messages.json` de la
 * locale par défaut. Autant le constater ici plutôt qu'après l'envoi.
 *
 * @param {object} manifest
 * @returns {Set<string>}
 */
export function manifestReferences(manifest) {
  const refs = new Set();
  const add = (value) => {
    if (typeof value === 'string' && value !== '') refs.add(value);
  };
  const addIcons = (icons) => {
    if (typeof icons === 'string') return add(icons);
    for (const value of Object.values(icons ?? {})) add(value);
  };

  add(manifest.background?.service_worker);
  add(manifest.background?.page);
  add(manifest.action?.default_popup);
  add(manifest.options_ui?.page);
  add(manifest.options_page);
  addIcons(manifest.icons);
  addIcons(manifest.action?.default_icon);

  if (manifest.default_locale) {
    refs.add(`_locales/${manifest.default_locale}/messages.json`);
  }

  return refs;
}

/**
 * Écrit l'archive à partir d'un dossier déjà construit.
 *
 * @param {{ sourceDir: string, outputPath: string }} options
 * @returns {Promise<{ outputPath: string, version: string, entries: string[], bytes: number }>}
 */
export async function buildChromeZip({ sourceDir, outputPath }) {
  const manifestPath = join(sourceDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(
      `manifest.json est absent de ${sourceDir}.\n` +
      'Lancez d\'abord : npm run build:extension',
    );
  }

  // Le manifeste doit être lu avant de zipper : c'est lui qui porte la version,
  // et c'est lui qui servira à vérifier que rien ne manque.
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  const files = await collectFiles(sourceDir);
  const entries = [];
  for (const file of files) {
    entries.push({ name: file.name, data: new Uint8Array(await readFile(file.absolute)) });
  }

  const zip = createZip(entries);
  await writeFile(outputPath, zip);

  return {
    outputPath,
    version: manifest.version,
    entries: entries.map((entry) => entry.name).sort(),
    bytes: zip.length,
  };
}

/**
 * Contrôle l'archive produite en la relisant.
 *
 * Trois défauts sont recherchés, tous refusés par le magasin : un manifeste qui
 * n'est pas à la racine, un fichier annoncé mais absent, et un débris système.
 *
 * @param {Uint8Array} bytes
 * @returns {Promise<string[]>} problèmes constatés, vide si tout va bien
 */
export async function verifyChromeZip(bytes) {
  const problems = [];
  const entries = readStoredZip(bytes);
  const names = [...entries.keys()];

  if (!names.includes('manifest.json')) {
    problems.push(
      'manifest.json n\'est pas à la racine de l\'archive — le magasin refusera le paquet.',
    );
    return problems;
  }

  const manifest = JSON.parse(new TextDecoder().decode(entries.get('manifest.json')));
  const present = new Set(names);

  for (const ref of manifestReferences(manifest)) {
    if (!present.has(ref)) problems.push(`fichier annoncé par le manifeste mais absent : ${ref}`);
  }

  for (const name of names) {
    const reason = junkReason(name);
    if (reason !== null) problems.push(`${reason} dans l'archive : ${name}`);
  }

  return problems;
}

/** Point d'entrée. */
async function main() {
  console.log('→ Assemblage de l\'extension (variante Chromium)…');
  execFileSync(
    process.execPath,
    [join(ROOT, 'scripts', 'build.mjs'), '--only=extension'],
    { cwd: ROOT, stdio: 'inherit' },
  );

  // La construction nettoie déjà ses propres débris, mais macOS en sème après
  // coup — un `.DS_Store` créé en parcourant le dossier au Finder se retrouve
  // sinon dans l'archive. On repasse donc juste avant de zipper.
  const cleaned = await stripSystemFiles(SOURCE);
  if (cleaned.length > 0) {
    console.log(`  débris retirés avant empaquetage : ${cleaned.length}`);
  }

  console.log('\n→ Écriture de l\'archive…');
  const result = await buildChromeZip({ sourceDir: SOURCE, outputPath: ARCHIVE });

  const problems = await verifyChromeZip(await readFile(ARCHIVE));
  for (const problem of problems) console.log(`  ⚠ ${problem}`);

  console.log(`\n✓ ${relative(ROOT, result.outputPath)}`);
  console.log(`  ${result.entries.length} fichiers · ${(result.bytes / 1024).toFixed(0)} Kio · version ${result.version}`);

  if (problems.length > 0) {
    console.error('\n✗ Archive non conforme : ne la déposez pas en l\'état.');
    process.exitCode = 1;
    return;
  }

  console.log('\nÀ déposer sur https://chrome.google.com/webstore/devconsole');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}
