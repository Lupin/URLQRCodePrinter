/**
 * Tests de l'assemblage du site public.
 *
 * Le site sert deux choses sous une même adresse : la page de présentation à la
 * racine, l'application sous `/app/`. Le défaut à craindre n'est pas l'erreur
 * bruyante mais le **lien mort** : une page d'accueil dont le bouton « Essayer »
 * ne mène nulle part se déploie sans le moindre avertissement, et personne ne
 * s'en aperçoit avant qu'un visiteur ne clique.
 *
 * Les tests portent donc surtout sur la **résolution des chemins relatifs**,
 * qui est ce qui casse en silence quand un fichier est déplacé. La page
 * anglaise est la plus exposée : elle vit dans un sous-dossier, donc tous ses
 * chemins remontent d'un cran.
 *
 * L'assemblage est lancé avec `--no-build` : reconstruire `dist/web` ici
 * entrerait en course avec `web.test.js`, qui lit le même dossier pendant que
 * `build.mjs` le supprime et le repeuple.
 */

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findImports } from '../scripts/bundle.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'dist', 'site');

before(() => {
  execFileSync(
    process.execPath,
    [join(ROOT, 'scripts', 'build-site.mjs'), '--no-build'],
    { cwd: ROOT, stdio: 'pipe' },
  );
});

/**
 * Relève les liens et ressources relatifs d'une page HTML.
 * @param {string} html
 * @returns {string[]}
 */
function relativeLinks(html) {
  const found = [];
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(https?:|mailto:|#|\/)/.test(value)) continue;
    found.push(value);
  }
  return found;
}

/**
 * Résout un lien relatif et dit s'il désigne quelque chose d'existant.
 *
 * Un lien vers un dossier (`app/`) vaut `index.html` : c'est ce que le serveur
 * statique fera, et c'est ce que le visiteur obtiendra.
 *
 * @param {string} baseDir Dossier de la page qui porte le lien.
 * @param {string} link
 * @returns {boolean}
 */
function resolves(baseDir, link) {
  const clean = link.split('?')[0].split('#')[0];
  const target = resolve(baseDir, clean);
  if (existsSync(target) && !clean.endsWith('/')) return true;
  return existsSync(join(target, 'index.html'));
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

test('la page d\'accueil est à la racine, l\'application sous /app/', () => {
  assert.ok(existsSync(join(SITE, 'index.html')), 'la racine doit porter la page d\'accueil');
  assert.ok(
    existsSync(join(SITE, 'app', 'index.html')),
    'l\'application doit être servie sous /app/',
  );
  assert.ok(existsSync(join(SITE, 'en', 'index.html')), 'la version anglaise doit exister');
});

test('l\'icône du produit est reprise de l\'extension', () => {
  // Une seule source pour le dessin : celle qu'utilisent déjà l'extension et le
  // projet Xcode.
  assert.ok(existsSync(join(SITE, 'icon-512.png')));
});

test('l\'application est complète, pas seulement sa page', () => {
  // Copier `index.html` sans son `core/` donnerait une page qui se charge puis
  // échoue à l'import : une page blanche, sans message.
  const app = join(SITE, 'app');
  assert.ok(existsSync(join(app, 'app.js')));
  assert.ok(existsSync(join(app, 'style.css')));
  assert.ok(readdirSync(join(app, 'core')).length > 0, 'le dossier core doit suivre');
});

// ---------------------------------------------------------------------------
// Résolution des liens
// ---------------------------------------------------------------------------

test('tous les liens relatifs de la page française résolvent', () => {
  const page = join(SITE, 'index.html');
  const html = readFileSync(page, 'utf8');
  const links = relativeLinks(html);

  assert.ok(links.length > 0, 'la page doit porter au moins un lien relatif');
  for (const link of links) {
    assert.ok(resolves(SITE, link), `lien mort depuis la racine : ${link}`);
  }
});

test('tous les liens relatifs de la page anglaise résolvent', () => {
  // La plus exposée : elle remonte d'un cran (`../`) pour chaque ressource.
  const page = join(SITE, 'en', 'index.html');
  const html = readFileSync(page, 'utf8');
  const links = relativeLinks(html);

  assert.ok(links.length > 0);
  for (const link of links) {
    assert.ok(resolves(join(SITE, 'en'), link), `lien mort depuis /en/ : ${link}`);
  }
});

test('les deux pages pointent l\'une vers l\'autre', () => {
  // Un sélecteur de langue qui ne mène nulle part est un cul-de-sac.
  const fr = readFileSync(join(SITE, 'index.html'), 'utf8');
  const en = readFileSync(join(SITE, 'en', 'index.html'), 'utf8');

  assert.match(fr, /href="en\/"/);
  assert.match(en, /href="\.\.\/"/);
});

// ---------------------------------------------------------------------------
// Empreintes
// ---------------------------------------------------------------------------

test('la feuille de style est empreintée dans les deux pages', () => {
  // Sans empreinte, un `style.css` gardé en cache survivrait à une refonte et
  // la page apparaîtrait à moitié mise en page. C'est arrivé sur l'application.
  for (const page of [join(SITE, 'index.html'), join(SITE, 'en', 'index.html')]) {
    const html = readFileSync(page, 'utf8');
    assert.match(html, /style\.css\?v=[0-9a-f]{12}/, `empreinte absente : ${page}`);
  }
});

test('l\'URL de confidentialité publiée est celle du dépôt', () => {
  // La FAQ sanctionne tout écart entre la politique publiée et le reste. Une
  // page d'accueil qui pointerait ailleurs serait un début de divergence.
  for (const page of [join(SITE, 'index.html'), join(SITE, 'en', 'index.html')]) {
    const html = readFileSync(page, 'utf8');
    assert.match(
      html,
      /https:\/\/github\.com\/Lupin\/URLQRCodePrinter\/blob\/main\/PRIVACY\.md/,
      `lien de confidentialité absent ou divergent : ${page}`,
    );
  }
});

// ---------------------------------------------------------------------------
// Modules livrés
// ---------------------------------------------------------------------------

/**
 * Liste récursivement les fichiers `.js` d'un dossier.
 * @param {string} dir
 * @returns {string[]}
 */
function jsFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...jsFiles(path));
    else if (entry.name.endsWith('.js')) found.push(path);
  }
  return found;
}

test('l\'application publiée n\'importe aucun module par son nom de paquet', () => {
  // La page publiée s'affichait un jour entièrement — titre, formulaire,
  // onglets — sans qu'aucun bouton ne réponde. Le navigateur refusait le module
  // d'entrée sur « Failed to resolve module specifier "uqr" » : le cœur importe
  // `uqr` par son nom de paquet, que Node résout depuis `node_modules` et qu'un
  // navigateur refuse. Comme le HTML est statique, la panne était invisible :
  // la page restait présentable, et rien ne fonctionnait.
  //
  // Aucune vérification existante ne pouvait l'attraper : les tests Node
  // chargent `dist/web` depuis le dépôt, où `node_modules` est à portée, et
  // `verify:brave` ouvre la page **de l'extension**, assemblée en fichiers
  // uniques. Ce contrôle-ci porte sur le livrable réellement publié.
  const problems = [];
  for (const file of jsFiles(join(SITE, 'app'))) {
    for (const specifier of findImports(readFileSync(file, 'utf8'))) {
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
        problems.push(`${file.slice(SITE.length + 1)} importe « ${specifier} »`);
      }
    }
  }
  assert.deepEqual(
    problems,
    [],
    `le navigateur ne résoudra pas ces imports :\n${problems.join('\n')}`,
  );
});

test('chaque import relatif de l\'application résout vers un fichier livré', () => {
  // L'autre moitié du même défaut : un import réécrit vers `vendor/uqr.js` qui
  // ne serait pas copié donnerait exactement la même page morte.
  const missing = [];
  for (const file of jsFiles(join(SITE, 'app'))) {
    for (const specifier of findImports(readFileSync(file, 'utf8'))) {
      if (!specifier.startsWith('.')) continue;
      const target = resolve(dirname(file), specifier.split('?')[0]);
      if (!existsSync(target)) missing.push(`${file.slice(SITE.length + 1)} → ${specifier}`);
    }
  }
  assert.deepEqual(missing, [], `imports morts :\n${missing.join('\n')}`);
});

test('la dépendance externe du cœur est livrée et reste un module ES', () => {
  const vendor = join(SITE, 'app', 'vendor', 'uqr.js');
  assert.ok(existsSync(vendor), 'le module `uqr` doit être livré dans `app/vendor/`');
  assert.match(
    readFileSync(vendor, 'utf8'),
    /export\s*\{/,
    'le module embarqué doit rester importable comme module ES',
  );
});

test('le lien vers l\'autre langue est en tête de page', () => {
  // Il vivait au pied de page. Sur une page de cette longueur, un visiteur qui
  // ne lit pas la langue devait la parcourir entièrement pour en sortir — le
  // seul cas où ce lien sert vraiment, c'est celui où on ne comprend rien.
  const pages = [
    { file: join(SITE, 'index.html'), href: 'en/', label: 'française' },
    { file: join(SITE, 'en', 'index.html'), href: '../', label: 'anglaise' },
  ];

  for (const { file, href, label } of pages) {
    const html = readFileSync(file, 'utf8');
    const langIndex = html.indexOf(`href="${href}"`);
    const heroIndex = html.indexOf('<header');

    assert.notEqual(langIndex, -1, `lien de langue absent de la page ${label}`);
    assert.ok(
      langIndex < heroIndex,
      `le lien de langue doit précéder l'en-tête, dans la page ${label}`,
    );

    const footer = html.slice(html.indexOf('<footer'));
    assert.ok(
      !footer.includes(`href="${href}"`),
      `le lien de langue est resté au pied de la page ${label}`,
    );
  }
});
