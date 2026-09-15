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
import { dirname, join, resolve } from 'node:path';

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
 * Résout un spécificateur d'import vers un chemin de fichier.
 *
 * Seuls les chemins relatifs sont acceptés : la version actuelle n'embarque pas
 * les dépendances de `node_modules`. Une dépendance externe doit être signalée
 * clairement plutôt que produite en silence dans un fichier incomplet.
 *
 * @param {string} fromFile
 * @param {string} specifier
 * @returns {string}
 */
export function resolveSpecifier(fromFile, specifier) {
  if (!specifier.startsWith('.')) {
    throw new BundleError(
      `Import externe « ${specifier} » rencontré dans ${fromFile}.\n` +
      'Cet assembleur ne prend en charge que les chemins relatifs. ' +
      'Emballez la dépendance au préalable, ou n\'assemblez pas ce module.',
    );
  }
  const target = resolve(dirname(fromFile), specifier);
  if (!existsSync(target)) {
    throw new BundleError(`Import introuvable : ${specifier} depuis ${fromFile}`);
  }
  return target;
}

/**
 * Nettoie un module : retire ses imports et ses préfixes d'export.
 * @param {string} source
 * @returns {string}
 */
export function stripModuleSyntax(source) {
  return source
    .replace(IMPORT_PATTERN, '')
    .replace(/^export\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/gm, '')
    .trim();
}

/**
 * Assemble un point d'entrée et ses dépendances.
 *
 * @param {string} entryPath
 * @param {{ header?: string }} [options]
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
    parts.push(
      `// ${'─'.repeat(72)}\n` +
      `// ${file}\n` +
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
