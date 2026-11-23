import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const FONTS = join(ROOT, 'src', 'fonts');
const CSS = {
  web: readFileSync(join(ROOT, 'src/web/style.css'), 'utf8'),
  fenetre: readFileSync(join(ROOT, 'src/extension-src/popup.css'), 'utf8'),
  site: readFileSync(join(ROOT, 'src/site/style.css'), 'utf8'),
  confidentialite: readFileSync(join(ROOT, 'src/extension-src/privacy.css'), 'utf8'),
};

test('les polices sont embarquées, sous licence, et légères', () => {
  const fichiers = readdirSync(FONTS);
  for (const nom of ['ibm-plex-sans-400', 'ibm-plex-sans-500', 'ibm-plex-sans-600',
    'ibm-plex-mono-400', 'ibm-plex-mono-500']) {
    assert.ok(fichiers.includes(`${nom}.woff2`), `police absente : ${nom}`);
  }
  assert.ok(fichiers.includes('OFL.txt'), 'licence OFL absente');
  const total = fichiers.reduce((poids, nom) => poids + statSync(join(FONTS, nom)).size, 0);
  assert.ok(total <= 200 * 1024, `jeu de polices trop lourd : ${Math.round(total / 1024)} Ko`);
});

test('chaque surface déclare les cinq faces en local, sans requête distante', () => {
  for (const [nom, css] of Object.entries(CSS)) {
    assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic/, `${nom} charge une police distante`);
    assert.equal((css.match(/@font-face/g) ?? []).length, 5, `${nom} : faces incomplètes`);
    for (const fichier of ['ibm-plex-sans-400', 'ibm-plex-sans-500', 'ibm-plex-sans-600',
      'ibm-plex-mono-400', 'ibm-plex-mono-500']) {
      assert.match(css, new RegExp(`url\\("fonts/${fichier}\\.woff2"\\)`), `${nom} : ${fichier} non liée`);
    }
  }
});

test('la typographie est Plex, et les données passent en mono', () => {
  assert.match(CSS.web, /--font:\s*"IBM Plex Sans"/);
  assert.match(CSS.web, /--mono:\s*"IBM Plex Mono"/);
  assert.match(CSS.web, /--type-base:\s*15px/);
  assert.match(CSS.web, /\.link__url,[\s\S]*?\.link__index,[\s\S]*?font-family:\s*var\(--mono\)/);
  assert.match(CSS.fenetre, /--font-ui:\s*"IBM Plex Sans"/);
  assert.match(CSS.fenetre, /--font-mono:\s*"IBM Plex Mono"/);
  assert.match(CSS.site, /font:\s*17px\/1\.65 "IBM Plex Sans"/);
  assert.match(CSS.confidentialite, /font:\s*16px\/1\.6 "IBM Plex Sans"/);
});

test('le wordmark est toujours illustré : marque + nom', () => {
  const app = readFileSync(join(ROOT, 'src/web/index.html'), 'utf8');
  assert.match(app, /class="marque"[^>]*src="icons\/icon-32\.png"/);
  assert.match(app, /class="topbar__title">URLQRCodePrinter</);
  const fenetre = readFileSync(join(ROOT, 'src/extension-src/popup.html'), 'utf8');
  assert.match(fenetre, /class="app-header__logo"[^>]*src="icons\/icon-32\.png"/);
  const site = readFileSync(join(ROOT, 'src/site/index.html'), 'utf8');
  assert.match(site, /class="hero__mark"[^>]*src="icon-512\.png"/);
  assert.match(site, /<h1 class="hero__title">URLQRCodePrinter<\/h1>/);
});

test('les livrables contiennent les polices, la licence et les références locales', async () => {
  // Les tests tournent en parallèle avec des constructions qui réécrivent
  // `dist/` : on laisse à la copie le temps d'apparaître au lieu de dépendre
  // d'un ordonnancement fortuit.
  const attendre = async (chemin) => {
    for (let i = 0; i < 40; i += 1) {
      if (existsSync(chemin)) return true;
      await new Promise((suite) => setTimeout(suite, 50));
    }
    return false;
  };
  const livrables = [
    ['dist/web', 'style.css'],
    ['dist/extension', 'popup.css'],
    ['dist/site', 'style.css'],
  ];
  for (const [dossier, css] of livrables) {
    const racine = join(ROOT, dossier);
    assert.ok(await attendre(join(racine, 'fonts', 'ibm-plex-sans-400.woff2')), `${dossier} : police absente`);
    assert.ok(await attendre(join(racine, 'fonts', 'OFL.txt')), `${dossier} : licence absente`);
    assert.match(readFileSync(join(racine, css), 'utf8'), /url\("fonts\/ibm-plex-sans-400\.woff2"\)/);
  }
});
