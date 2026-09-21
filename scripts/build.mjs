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
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bundle, findImports, findResidualModuleSyntax, resolveSpecifier } from './bundle.mjs';

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
    // L'application est embarquée dans l'extension : c'est ce qui lui donne
    // accès au même stockage que la fenêtre, donc aux liens collectés.
    webApp: true,
  },
  'extension-safari': {
    from: join(SRC, 'extension-src'),
    shared: [join(SRC, 'core')],
    manifest: 'safari',
    webApp: true,
  },
  // L'application web reste en modules ES natifs : elle n'est pas assemblée,
  // mais ses dépendances de paquet doivent être recopiées. Voir
  // `vendorExternalModules`.
  web: { from: join(SRC, 'web'), shared: [join(SRC, 'core')], externals: true },
};

/** Fichiers de l'application web recopiés dans l'extension. */
const WEB_APP_FILES = ['app.js', 'element-ids.js', 'style.css'];

/** Nom de la page de l'application dans l'extension. */
const WEB_APP_PAGE = 'app.html';

/** Clés comprises par Safari mais inconnues de Chromium. */
const SAFARI_ONLY_KEYS = ['browser_specific_settings'];

/**
 * Points d'entrée de l'extension, assemblés en fichiers uniques.
 *
 * `privacy.js` en fait partie : c'est une page à part entière, et elle importe
 * le cœur. Sans assemblage, Safari ne résoudrait pas ses imports — le défaut
 * qui a motivé tout ce mécanisme.
 */
const EXTENSION_ENTRIES = ['background.js', 'popup.js', 'privacy.js', 'app.js'];

/** Dossiers et fichiers devenus inutiles une fois l'extension assemblée. */
const EXTENSION_DEBRIS = ['core', 'api.js', 'element-ids.js'];

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
 * Recopie l'application web dans l'extension.
 *
 * Sans cela, les liens collectés par l'extension seraient invisibles : la
 * fenêtre écrit dans `chrome.storage.local`, alors que l'application servie sur
 * `localhost` utilise IndexedDB. Embarquée comme page de l'extension, elle
 * détecte `chrome.storage` et partage donc la même collection — c'est
 * `resolveDefaultStore` qui fait ce choix.
 *
 * @param {string} outDir
 * @returns {Promise<boolean>}
 */
async function copyWebApp(outDir) {
  const source = join(SRC, 'web');
  const index = join(source, 'index.html');

  if (!existsSync(index)) return false;

  await cp(index, join(outDir, WEB_APP_PAGE));
  for (const file of WEB_APP_FILES) {
    if (existsSync(join(source, file))) await cp(join(source, file), join(outDir, file));
  }
  return true;
}

/**
 * Ajoute une empreinte du contenu à l'URL des ressources d'une page.
 *
 * Sans cela, un navigateur peut servir un `style.css` gardé en cache alors que
 * le HTML et les scripts sont à jour. Le symptôme est déroutant : les nouveaux
 * réglages apparaissent, mais la mise en page reste celle du build précédent.
 * C'est arrivé — la planche s'affichait en une seule colonne, curseur de largeur
 * du QR sans effet, alors que le correctif était bien sur le disque.
 *
 * Une empreinte change l'URL dès que le fichier change : le navigateur n'a plus
 * rien à réutiliser. `app.js` est haché **après** l'assemblage, pour que
 * l'empreinte suive le contenu réellement livré.
 *
 * @param {string} pagePath  Chemin de la page HTML à réécrire.
 * @param {string} outDir    Dossier où lire les ressources.
 * @param {string[]} assets  Noms de fichiers référencés par la page.
 * @returns {Promise<string[]>} Les ressources effectivement versionnées.
 */
export async function stampAssetVersions(pagePath, outDir, assets) {
  let html = await readFile(pagePath, 'utf8');
  const stamped = [];

  for (const asset of assets) {
    const path = join(outDir, asset);
    if (!existsSync(path)) continue;
    const bytes = await readFile(path);
    const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    // Le remplacement ne vise que la référence exacte, guillemet compris.
    const before = html;
    html = html.replaceAll(`${asset}\"`, `${asset}?v=${digest}\"`);
    if (html !== before) stamped.push(`${asset}?v=${digest}`);
  }

  await writeFile(pagePath, html, 'utf8');
  return stamped;
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
      root: ROOT,
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

/**
 * Liste récursivement les fichiers `.js` d'un dossier.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function jsFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await jsFiles(path));
    else if (entry.name.endsWith('.js')) found.push(path);
  }
  return found;
}

/**
 * Recopie dans la cible les dépendances que le navigateur ne sait pas résoudre.
 *
 * Le cœur est recopié tel quel dans l'application web, qui reste en modules ES
 * natifs. Or `src/core/qr.js` importe `uqr`, un **nom de paquet** : Node le
 * résout depuis `node_modules`, un navigateur non. Il répond alors, au
 * chargement du module :
 *
 *     Failed to resolve module specifier "uqr". Relative references must start
 *     with either "/", "./", or "../".
 *
 * Et l'échec est trompeur à l'écran : le HTML est statique, donc la page
 * s'affiche entièrement — titre, formulaire, onglets — pendant qu'aucun script
 * ne tourne. Tout paraît normal, et *rien* ne répond : c'est le symptôme
 * constaté sur `lupin.github.io/URLQRCodePrinter/app/`, où « Ajouter » restait
 * sans effet.
 *
 * Le défaut a échappé aux deux vérifications existantes, qui l'évitaient chacune
 * à sa manière : les tests Node chargent `dist/web` depuis le dépôt, où
 * `node_modules` est à portée, et `verify:brave` ouvre la page **de
 * l'extension**, assemblée en fichiers uniques. Aucune ne voyait l'import de
 * paquet resté dans le livrable web.
 *
 * On recopie donc le fichier du paquet dans `vendor/` et on réécrit l'import en
 * chemin relatif : c'est ce qui permet de garder des modules natifs sans
 * imposer une carte d'imports dans la page. Le contrôle final refuse de livrer
 * s'il reste un spécificateur que le navigateur ne saurait pas résoudre.
 *
 * @param {string} outDir
 * @returns {Promise<string[]>} les réécritures faites, pour les signaler
 */
async function vendorExternalModules(outDir) {
  const vendored = new Map();
  const rewritten = [];

  for (const file of await jsFiles(outDir)) {
    let source = await readFile(file, 'utf8');
    const bare = findImports(source).filter(
      (specifier) => !specifier.startsWith('.') && !specifier.startsWith('/'),
    );
    if (bare.length === 0) continue;

    for (const specifier of bare) {
      // Le paquet est résolu depuis le fichier importateur : c'est la règle de
      // Node, donc exactement la dépendance que les tests exercent.
      if (!vendored.has(specifier)) {
        const resolved = resolveSpecifier(file, specifier);
        const name = specifier.replace(/^@/, '').replace(/\//g, '__');
        const target = join(outDir, 'vendor', `${name}.js`);
        await mkdir(dirname(target), { recursive: true });
        await cp(resolved, target);
        vendored.set(specifier, target);
      }

      let rel = relative(dirname(file), vendored.get(specifier)).split(sep).join('/');
      if (!rel.startsWith('.')) rel = `./${rel}`;

      const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      source = source.replace(new RegExp(`(['"])${escaped}\\1`, 'g'), `$1${rel}$1`);
      rewritten.push(`${specifier} → ${rel}`);
    }

    await writeFile(file, source, 'utf8');
  }

  // Garde-fou : un spécificateur nu resté dans le livrable casse la page
  // entière, en silence. Mieux vaut faire échouer la construction.
  for (const file of await jsFiles(outDir)) {
    const source = await readFile(file, 'utf8');
    for (const specifier of findImports(source)) {
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
        throw new Error(
          `${relative(outDir, file)} importe « ${specifier} », que le navigateur ` +
          'ne saura pas résoudre : la page s\'afficherait sans jamais s\'exécuter.',
        );
      }
    }
  }

  return [...new Set(rewritten)];
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

  const parasites = await stripSystemFiles(outDir);
  if (parasites.length > 0) {
    console.log(`  ${name} : ${parasites.length} fichier(s) parasite(s) retiré(s)`);
  }

  const removed = await materialiseManifest(outDir, target.manifest);
  if (removed.length > 0) {
    console.log(`  ${name} : clés retirées du manifeste (${removed.join(', ')})`);
  }

  if (target.webApp) {
    const copied = await copyWebApp(outDir);
    if (copied) console.log(`  ${name} : application embarquée dans ${WEB_APP_PAGE}`);
  }

  if (target.manifest) {
    const bundled = await bundleExtension(outDir);
    console.log(
      `  ${name} : ${bundled.entries.join(' et ')} assemblés ` +
      `(${bundled.modules} modules, plus aucun import)`,
    );
  }

  // Les cibles non assemblées gardent leurs modules natifs : leurs dépendances
  // de paquet doivent donc voyager avec elles, en chemins relatifs.
  if (target.externals) {
    for (const line of await vendorExternalModules(outDir)) {
      console.log(`  ${name} : dépendance embarquée — ${line}`);
    }
  }

  // Après l'assemblage : l'empreinte doit porter sur le contenu livré.
  //
  // **Les deux pages doivent être versionnées**, pas seulement celle de
  // l'application. La fenêtre a le même problème et il est plus visible
  // qu'ailleurs : recharger l'extension ne change pas l'URL de `popup.css`, donc
  // le navigateur peut continuer à servir l'ancienne feuille. Le symptôme est
  // déroutant — on recharge, on rouvre, et rien n'a bougé alors que le disque
  // est à jour. C'est exactement ce qui a fait croire que les couleurs de la
  // fenêtre n'avaient pas été appliquées.
  const pages = target.webApp
    ? [
        { path: join(outDir, WEB_APP_PAGE), assets: ['style.css', 'app.js'], label: 'application' },
        { path: join(outDir, 'popup.html'), assets: ['popup.css', 'popup.js'], label: 'fenêtre' },
        { path: join(outDir, 'privacy.html'), assets: ['privacy.css', 'privacy.js'], label: 'confidentialité' },
      ]
    : [{ path: join(outDir, 'index.html'), assets: ['style.css', 'app.js'], label: 'application' }];

  for (const { path, assets, label } of pages) {
    if (!existsSync(path)) continue;
    const stamped = await stampAssetVersions(path, outDir, assets);
    if (stamped.length > 0) console.log(`  ${name} : ${label} — ${stamped.join(', ')}`);
  }

  return { name, outDir, files: await countFiles(outDir) };
}

/**
 * Retire du livrable ce qui n'a pas été produit par la construction.
 *
 * Deux familles, et la seconde est celle qui coûte cher :
 *
 * 1. **Les fichiers du système.** macOS sème des `.DS_Store` dans les dossiers
 *    parcourus par le Finder.
 * 2. **Les doublons « 2 ».** Copier un dossier dans un dossier qui le contient
 *    déjà en crée une copie suffixée ` 2`. Sur une extension, c'est fatal :
 *    Chrome refuse de charger un dossier dont un nom commence par `_` s'il n'est
 *    pas exactement `_locales` — un `_locales 2` rend l'extension **entièrement**
 *    inchargeable, avec un message qui ne dit pas d'où vient le dossier.
 *
 * @param {string} dir
 * @returns {Promise<string[]>} noms retirés, pour les signaler
 */
export async function stripSystemFiles(dir) {
  const removed = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      removed.push(...await stripSystemFiles(path));
      continue;
    }

    const doublon = / 2(\.[^.]+)?$/.test(entry.name);
    if (entry.name === '.DS_Store' || entry.name === 'Thumbs.db' || doublon) {
      await rm(path, { force: true });
      removed.push(join(dir.slice(dir.lastIndexOf('dist')), entry.name));
      continue;
    }
  }

  // Un dossier doublonné se retire en entier : le parcourir d'abord ne
  // laisserait que ses fichiers, et le dossier vide suffirait à bloquer Chrome.
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!/ 2$/.test(entry.name)) continue;
    const path = join(dir, entry.name);
    await rm(path, { recursive: true, force: true });
    removed.push(join(dir.slice(dir.lastIndexOf('dist')), entry.name));
  }

  return removed;
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
    // Nommée `relPath` et non `relative` : `relative` est la fonction de
    // `node:path`, désormais importée par ce module.
    const relPath = result.outDir.slice(ROOT.length + 1);
    console.log(`✓ ${result.name.padEnd(10)} ${relPath}  (${result.files} fichiers)`);
  }
}

// Exécution directe uniquement : le module reste importable par les tests.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}

export { buildTarget, TARGETS, exists };
