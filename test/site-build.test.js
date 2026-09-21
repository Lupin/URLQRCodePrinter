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
