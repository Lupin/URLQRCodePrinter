/**
 * Le lien vers la page d'information, dans la fenêtre et dans l'application.
 *
 * Trois choses sont vérifiées ici, et chacune attrape un défaut différent :
 *
 * 1. **Le calcul de l'adresse.** Deux langues, et deux contextes — page servie
 *    par une extension, page servie par le site. C'est une fonction pure, donc
 *    éprouvée sur toutes ses branches sans navigateur.
 * 2. **La source unique.** Les adresses du site ne sont écrites qu'une fois.
 *    Recopiées dans la fenêtre et dans l'application, elles auraient divergé en
 *    silence, et un lien faux ne casse rien : il envoie ailleurs.
 * 3. **Le câblage réel.** L'application est démarrée pour de bon, trois fois :
 *    dans son contexte d'extension (page `app.html`, adresse publiée), servie par
 *    le site (page `/app/`, adresse voisine), et à la racine d'un serveur de
 *    développement (pas de voisine). Le lien est lu sur le nœud, pas dans le
 *    source.
 *
 * Ce fichier a été perdu avec quatre autres lors d'un nettoyage de doublons
 * iCloud, puis réécrit à l'identique ; les trois points ci-dessus sont ceux de
 * la version d'origine.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { informationPageHref, siteLocale, SITE_URLS } from '../src/core/site.js';
import { bootApp } from './helpers/dom-shim.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

const SITE_JS = readFileSync(join(ROOT, 'src', 'core', 'site.js'), 'utf8');
const APP_HTML = readFileSync(join(ROOT, 'src', 'web', 'index.html'), 'utf8');
const APP_JS = readFileSync(join(ROOT, 'src', 'web', 'app.js'), 'utf8');
const APP_CSS = readFileSync(join(ROOT, 'src', 'web', 'style.css'), 'utf8');
const POPUP_JS = readFileSync(join(ROOT, 'src', 'extension-src', 'popup.js'), 'utf8');
const POPUP_HTML = readFileSync(join(ROOT, 'src', 'extension-src', 'popup.html'), 'utf8');

const FR_URL = 'https://lupin.github.io/URLQRCodePrinter/';
const EN_URL = 'https://lupin.github.io/URLQRCodePrinter/en/';

// ---------------------------------------------------------------------------
// Le calcul de l'adresse
// ---------------------------------------------------------------------------

test('l\'adresse publiée dépend de la langue, et la racine est française', () => {
  assert.equal(SITE_URLS.fr, FR_URL);
  assert.equal(SITE_URLS.en, EN_URL);
  // Une langue que le site ne publie pas vaut le français : c'est la langue
  // d'écriture du projet, et celle de la racine.
  assert.equal(siteLocale('de'), 'fr');
  assert.equal(siteLocale(undefined), 'fr');
  assert.equal(siteLocale('en'), 'en');
  assert.equal(siteLocale('fr'), 'fr');
});

test('servie par une extension, la page renvoie à l\'adresse publiée', () => {
  // La fenêtre de l'extension, et l'application qu'elle ouvre, n'ont pas de page
  // voisine : une adresse relative n'y mènerait nulle part.
  for (const protocol of ['chrome-extension:', 'safari-web-extension:', 'moz-extension:']) {
    assert.equal(
      informationPageHref('fr', { protocol, pathname: '/app.html' }),
      FR_URL,
      `${protocol} devrait renvoyer à l'adresse publiée`,
    );
    assert.equal(
      informationPageHref('en', { protocol, pathname: '/app.html' }),
      EN_URL,
      `${protocol} devrait renvoyer à l'adresse publiée anglaise`,
    );
  }
});

test('servie par le site, la page renvoie à sa voisine', () => {
  // La page d'information est alors à côté de l'application : `../` remonte de
  // `/app/` à la racine. Une adresse absolue enverrait une copie du site
  // hébergée ailleurs (un fork, un serveur local) sur le site d'origine.
  assert.equal(informationPageHref('fr', { protocol: 'https:', pathname: '/app/' }), '../');
  assert.equal(informationPageHref('en', { protocol: 'https:', pathname: '/app/' }), '../en/');
  assert.equal(
    informationPageHref('en', { protocol: 'http:', pathname: '/URLQRCodePrinter/app/index.html' }),
    '../en/',
  );
});

test('une page sans voisine se rabat sur l\'adresse publiée', () => {
  // `app.html` servi à la racine — c'est ce que fait `npm run serve --dir=` pour
  // la variante de l'extension : `../` sortirait de la racine servie.
  assert.equal(informationPageHref('fr', { protocol: 'http:', pathname: '/app.html' }), FR_URL);
  // `npm run serve` sert `dist/web` à la racine du serveur : la page est `/` ou
  // `/index.html`, et il n'y a pas de page d'information à côté.
  assert.equal(informationPageHref('fr', { protocol: 'http:', pathname: '/' }), FR_URL);
  assert.equal(informationPageHref('fr', { protocol: 'http:', pathname: '/index.html' }), FR_URL);
  // Application déployée seule dans un dossier, sans site autour d'elle : `../`
  // désignerait un dossier qui ne contient pas de page d'information.
  assert.equal(
    informationPageHref('fr', { protocol: 'https:', pathname: '/un-dossier/' }),
    FR_URL,
  );
  // Fichier ouvert localement, ou page sans `location` du tout.
  assert.equal(informationPageHref('fr', { protocol: 'file:', pathname: '/tmp/app/index.html' }), FR_URL);
  assert.equal(informationPageHref('en', {}), EN_URL);
});

// ---------------------------------------------------------------------------
// Une seule définition des adresses
// ---------------------------------------------------------------------------

test('les adresses du site ne sont écrites qu\'une fois', () => {
  // Deux copies d'une adresse finissent par diverger, et la divergence ne se
  // voit pas : le lien continue de fonctionner, vers le mauvais endroit.
  assert.equal(SITE_JS.match(/lupin\.github\.io/g)?.length, 2, 'les deux adresses, et elles seules');
  for (const [nom, source] of [['la fenêtre', POPUP_JS], ['l\'application', APP_JS]]) {
    assert.doesNotMatch(source, /lupin\.github\.io/, `adresse recopiée dans ${nom}`);
  }
  assert.doesNotMatch(POPUP_HTML, /lupin\.github\.io/);
  assert.doesNotMatch(APP_HTML, /lupin\.github\.io/, 'adresse en dur dans le balisage');
});

test('la fenêtre et l\'application tiennent le même calcul', () => {
  assert.match(POPUP_JS, /import \{ informationPageHref \} from '\.\/core\/site\.js'/);
  assert.match(APP_JS, /import \{ informationPageHref \} from '\.\/core\/site\.js'/);
  // La fenêtre est toujours servie par l'extension : sa page courante suffit, et
  // `core/site.js` en déduit l'adresse publiée.
  assert.match(POPUP_JS, /link\.href = informationPageHref\(getLocale\(\)\)/);
  // L'application, elle, est servie tantôt par l'extension, tantôt par le site :
  // c'est sa page qui tranche, donc elle est passée explicitement.
  assert.match(APP_JS, /link\.href = informationPageHref\(getLocale\(\), window\.location\)/);
});

// ---------------------------------------------------------------------------
// Le balisage et la feuille de l'application
// ---------------------------------------------------------------------------

test('l\'application affiche le lien, sous les panneaux', () => {
  assert.match(APP_HTML, /<footer class="app-footer">/, 'aucun pied de page');
  assert.match(APP_HTML, /<a id="site-link" class="app-footer__link"/, 'aucun lien vers la page d\'information');
  assert.match(APP_HTML, /id="site-link"[^>]*target="_blank"/, 'le nouvel onglet n\'est pas demandé');
  assert.match(APP_HTML, /id="site-link"[^>]*rel="noopener noreferrer"/, 'l\'onglet ouvert garderait la main');
  assert.match(APP_HTML, /id="site-link"[^>]*data-i18n="Page d'information"/, 'libellé non traduit');

  // Le pied est après la fin des panneaux : c'est un repère de bas de page, pas
  // une action de plus dans la colonne des réglages.
  const finPanneaux = APP_HTML.lastIndexOf('</main>');
  assert.ok(
    APP_HTML.indexOf('id="site-link"') > finPanneaux,
    'le lien est remonté dans les panneaux',
  );
});

test('le pied est centré, et porte la signature du projet', () => {
  const css = readFileSync(join(ROOT, 'src', 'web', 'style.css'), 'utf8');
  const pied = css.match(/\n\.app-footer\s*\{([\s\S]*?)\}/)[1];
  // **Centré** : rien ne s'aligne au-dessus de lui, et l'alignement à gauche le
  // faisait passer pour la suite du panneau.
  assert.match(pied, /text-align:\s*center/);

  // La signature : le nom, la licence, la version.
  assert.match(APP_HTML, /class="app-footer__signature"/, 'aucune signature');
  assert.match(APP_HTML, /G\. Abegg-Gauthey/);
  assert.match(APP_HTML, /MIT/, 'la licence n\'est pas nommée');
  // La version vient du paquet, injectée à la construction : recopiée à la main,
  // elle aurait fini par mentir.
  assert.match(APP_HTML, /id="footer-version">__APP_VERSION__</);
  // L'année est posée par le script — celle du jour, pas celle du fichier.
  assert.match(APP_HTML, /id="footer-year"/);
  assert.match(APP_JS, /el\.footerYear\.textContent = String\(new Date\(\)\.getFullYear\(\)\)/);

  // L'encre tertiaire est la plus claire de la charte : la mention reste
  // lisible, mais ne dispute pas la vedette au lien.
  const signature = css.match(/\n\.app-footer__signature\s*\{([\s\S]*?)\}/)[1];
  assert.match(signature, /color:\s*var\(--text-3\)/);
});

test('le lien du pied de l\'application reste à l\'encre secondaire', () => {
  // L'accent est réservé aux actions ; ce lien n'en est pas une, et il ne doit
  // pas venir s'ajouter aux porteurs déjà comptés.
  const regle = APP_CSS.match(/\.app-footer__link\s*\{([\s\S]*?)\}/)[1];
  assert.match(regle, /color:\s*var\(--text-2\)/);
  assert.doesNotMatch(regle, /var\(--accent\)/);
  // Le contour de focus est la règle commune de la maison : le lien est
  // atteignable au clavier, et son focus doit se voir.
  const focus = APP_CSS.match(/\.app-footer__link:focus-visible\s*\{([\s\S]*?)\}/)[1];
  assert.match(focus, /outline:\s*2px solid var\(--focus\)/);
});

// ---------------------------------------------------------------------------
// Le câblage, application démarrée
// ---------------------------------------------------------------------------

/** Le lien, après démarrage de l'application sur la page décrite. */
async function linkAfterBoot(location) {
  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    windowExtras: { location },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);
  const link = registry.get('site-link');
  assert.ok(link, 'aucun lien « site-link » dans le document de l\'application');
  return link;
}

test('démarrée dans l\'extension, l\'application renvoie à l\'adresse publiée', async () => {
  const link = await linkAfterBoot({
    href: 'chrome-extension://abcdefghijkl/app.html',
    protocol: 'chrome-extension:',
    pathname: '/app.html',
  });

  assert.equal(link.href, FR_URL);
  // L'ouverture dans un nouvel onglet est annoncée : sans ce texte, un lecteur
  // d'écran ne signale pas le changement de contexte.
  assert.ok(
    link.children.some((enfant) => enfant.className === 'sr-only'),
    'le nouvel onglet n\'est pas annoncé',
  );
  assert.ok(
    link.children.some((enfant) => enfant.textContent.includes('nouvel onglet')),
    'l\'annonce ne dit pas ce qui va se passer',
  );
});

test('servie par le site, l\'application renvoie à la page voisine', async () => {
  const link = await linkAfterBoot({
    href: 'https://exemple.test/URLQRCodePrinter/app/',
    protocol: 'https:',
    pathname: '/URLQRCodePrinter/app/',
  });

  assert.equal(link.href, '../');
});

test('servie à la racine d\'un serveur, elle renvoie à l\'adresse publiée', async () => {
  const link = await linkAfterBoot({
    href: 'http://127.0.0.1:4173/',
    protocol: 'http:',
    pathname: '/',
  });

  assert.equal(link.href, FR_URL);
});
