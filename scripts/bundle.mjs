/**
 * Assemble les modules ES de l'extension en un fichier unique.
 *
 * Safari ne résout pas les imports de modules situés dans un sous-dossier d'une
 * extension : il répond « Unable to find "core/store.js" in the extension's
 * resources. It is an invalid path. » alors que le fichier est bel et bien dans
 * le paquet. Deux fils de discussion Apple documentent ce défaut des modules ES
 * dans les extensions Safari, et plusieurs rapports de portage de Chrome vers
 * Safari le confirment.
 *
 * Plutôt que de contourner le symptôme — aplatir l'arborescence, par exemple —
 * on supprime la cause : après assemblage, il ne reste **aucun import** dans
 * l'extension. Le résultat fonctionne à l'identique sur Chrome, Brave et
 * Safari, et l'on peut même retirer `"type": "module"` du manifeste — ce qui
 * fait disparaître au passage l'avertissement du convertisseur Apple.
 *
 * Le code n'est pas minifié : les modules sont simplement concaténés dans
 * l'ordre des dépendances, avec un en-tête par module. Une extension reste
 * ainsi lisible dans l'inspecteur.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/** Formes d'import reconnues. Aucune n'utilise d'alias ni d'espace de noms. */
const IMPORT_PATTERN = /^import\s[\s\S]*?from\s+['"]([^'"]+)['"];?/gm;

/** Déclarations de premier niveau, celles qui peuvent entrer en collision. */
const DECLARATION_PATTERN =
  /^(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;

/**
 * Erreur d'assemblage.
 */
export class BundleError extends Error {}

/**
 * Extrait les spécificateurs d'import d'un module.
 * @param {string} source
 * @returns {string[]}
 */
export function findImports(source) {
  return [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1]);
}

/**
 * Extrait les noms déclarés au premier niveau.
 * @param {string} source
 * @returns {string[]}
 */
export function findDeclarations(source) {
  return [...source.matchAll(DECLARATION_PATTERN)].map((match) => match[1]);
}

/**
 * Trouve le point d'entrée ESM d'un paquet de `node_modules`.
 *
 * On préfère `exports['.'].import`, puis `module`, puis `main` : l'ordre qui
 * donne du code ESM plutôt que CommonJS, seul embarquable tel quel.
 *
 * @param {string} packageDir
 * @param {string} subpath
 * @returns {string}
 */
function packageEntry(packageDir, subpath) {
  if (subpath) {
    const direct = join(packageDir, subpath);
    if (existsSync(direct)) return direct;
    throw new BundleError(`Sous-chemin introuvable : ${subpath} dans ${packageDir}`);
  }

  const manifestPath = join(packageDir, 'package.json');
  if (!existsSync(manifestPath)) {
    throw new BundleError(`Paquet sans package.json : ${packageDir}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const exported = manifest.exports?.['.'];
  const candidate =
    (typeof exported === 'string' ? exported : exported?.import) ??
    manifest.module ??
    manifest.main;

  if (!candidate) {
    throw new BundleError(`Point d'entrée introuvable pour ${manifest.name ?? packageDir}`);
  }

  const target = join(packageDir, candidate);
  if (!existsSync(target)) {
    throw new BundleError(`Point d'entrée déclaré mais absent : ${target}`);
  }
  return target;
}

/**
 * Résout un spécificateur d'import vers un chemin de fichier.
 *
 * Les chemins relatifs sont résolus directement. Un nom de paquet est cherché
 * dans les `node_modules` en remontant depuis le fichier importateur : la
 * dépendance est ensuite embarquée comme les autres, ce qui évite d'exiger
 * qu'elle soit ESM et sans dépendance propre.
 *
 * @param {string} fromFile
 * @param {string} specifier
 * @returns {string}
 */
export function resolveSpecifier(fromFile, specifier) {
  if (specifier.startsWith('.')) {
    const target = resolve(dirname(fromFile), specifier);
    if (!existsSync(target)) {
      throw new BundleError(`Import introuvable : ${specifier} depuis ${fromFile}`);
    }
    return target;
  }

  const parts = specifier.split('/');
  const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  const subpath = specifier.slice(name.length).replace(/^\//, '');

  let directory = dirname(resolve(fromFile));
  for (;;) {
    const candidate = join(directory, 'node_modules', name);
    if (existsSync(candidate)) return packageEntry(candidate, subpath);

    const parent = dirname(directory);
    if (parent === directory) {
      throw new BundleError(`Paquet introuvable : « ${specifier} » depuis ${fromFile}`);
    }
    directory = parent;
  }
}

/**
 * Nettoie un module : retire ses imports et ses exports.
 *
 * Trois formes sont traitées, dans cet ordre :
 *   1. les réexports (`export * from '…'`, `export { … } from '…'`), qui
 *      laisseraient un `from` orphelin ;
 *   2. les listes d'export (`export { a, b };`), que `uqr` utilise en fin de
 *      fichier ;
 *   3. le préfixe `export` devant une déclaration.
 *
 * Le motif de réexport est volontairement restreint à `*` ou à une liste entre
 * accolades. Une première version employait `[^'"]*?`, qui traverse les retours
 * à la ligne : partant d'un `export function` ordinaire, elle courait jusqu'au
 * premier `from '…'` du fichier et **supprimait tout le code intermédiaire**.
 *
 * @param {string} source
 * @returns {string}
 */
export function stripModuleSyntax(source) {
  return source
    .replace(IMPORT_PATTERN, '')
    .replace(/^export\s+(?:\*|\{[^}]*\})\s*from\s*['"][^'"]+['"];?/gm, '')
    .replace(/^export\s*\{[^}]*\}\s*;?/gm, '')
    .replace(/^export\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/gm, '')
    .trim();
}

/**
 * Assemble un point d'entrée et ses dépendances.
 *
 * L'en-tête de chaque module porte son chemin. Ce chemin est rendu **relatif à
 * `options.root`** quand il est fourni : un fichier publié ne doit pas contenir
 * le chemin absolu de la machine qui l'a assemblé.
 *
 * @param {string} entryPath
 * @param {{ header?: string, root?: string }} [options]
 * @returns {{ code: string, modules: string[], declarations: Map<string, string> }}
 */
export function bundle(entryPath, options = {}) {
  /** @type {Map<string, string>} chemin résolu → source */
  const sources = new Map();
  /** @type {string[]} chemins dans l'ordre d'émission */
  const order = [];

  /** Parcours en profondeur : une dépendance est émise avant son dépendant. */
  const visit = (file) => {
    if (sources.has(file)) return;
    const source = readFileSync(file, 'utf8');
    sources.set(file, source);
    for (const specifier of findImports(source)) {
      visit(resolveSpecifier(file, specifier));
    }
    order.push(file);
  };

  visit(entryPath);

  // Deux déclarations de même nom dans un même fichier se masqueraient
  // silencieusement. On refuse d'assembler plutôt que de produire un fichier
  // dont le comportement diffère de celui des sources.
  const declarations = new Map();
  const collisions = [];

  for (const file of order) {
    for (const name of findDeclarations(sources.get(file))) {
      if (declarations.has(name)) {
        collisions.push(`${name} (${declarations.get(name)} et ${file})`);
      } else {
        declarations.set(name, file);
      }
    }
  }

  if (collisions.length > 0) {
    throw new BundleError(
      'Déclarations de premier niveau en collision :\n  ' +
      collisions.join('\n  ') +
      '\nRenommez l\'une des deux, ou rendez la dépendance explicite.',
    );
  }

  const parts = [options.header ?? ''];
  for (const file of order) {
    const label = options.root ? relative(options.root, file) : file;
    parts.push(
      `// ${'─'.repeat(72)}\n` +
      `// ${label}\n` +
      `// ${'─'.repeat(72)}\n\n` +
      stripModuleSyntax(sources.get(file)),
    );
  }

  return { code: parts.filter(Boolean).join('\n\n') + '\n', modules: order, declarations };
}

/**
 * Vérifie qu'un code assemblé ne contient plus aucune syntaxe de module.
 * @param {string} code
 * @returns {string[]} les lignes fautives, vides si tout va bien
 */
export function findResidualModuleSyntax(code) {
  const problems = [];
  code.split('\n').forEach((line, index) => {
    if (/^\s*import\s/.test(line)) problems.push(`ligne ${index + 1} : ${line.trim()}`);
    if (/^\s*export\s/.test(line)) problems.push(`ligne ${index + 1} : ${line.trim()}`);
  });
  return problems;
}
