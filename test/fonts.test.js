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

/**
 * Les faces de l'interface : Inter en 400, 500 et 600, le mono pour les données.
 *
 * Trois graisses, trois rôles : 400 porte le texte courant, 500 les libellés et
 * les commandes, 600 les titres. Le mono n'est pas une seconde voix décorative,
 * c'est le registre des données — une URL se lit caractère par caractère.
 */
const FACES_INTERFACE = [
  ['inter-latin-400', 'Inter', 400],
  ['inter-latin-500', 'Inter', 500],
  ['inter-latin-600', 'Inter', 600],
  ['ibm-plex-mono-400', 'IBM Plex Mono', 400],
];

/**
 * Le papier garde IBM Plex : une étiquette imprimée à 8 pt en graisse 400
 * disparaîtrait si on la passait en Inter sans mesure. L'écran change de
 * système, le produit physique non.
 */
const FACES_PAPIER = [
  ['ibm-plex-sans-400', 'IBM Plex Sans', 400],
  ['ibm-plex-sans-500', 'IBM Plex Sans', 500],
  ['ibm-plex-sans-600', 'IBM Plex Sans', 600],
];

/** Le site public reste, pour l'instant, sur l'ancienne direction. */
const FACES_SITE = [...FACES_PAPIER, ['ibm-plex-mono-400', 'IBM Plex Mono', 400], ['ibm-plex-mono-500', 'IBM Plex Mono', 500]];

function facesDeclarees(css) {
  return [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map(([, corps]) => ({
    famille: corps.match(/font-family:\s*"([^"]+)"/)?.[1],
    graisse: Number(corps.match(/font-weight:\s*(\d+)/)?.[1]),
    url: corps.match(/url\("([^"]+)"\)/)?.[1],
  }));
}

test('les polices sont embarquées, sous licence, et légères', () => {
  const fichiers = readdirSync(FONTS);
  for (const nom of [...FACES_INTERFACE, ...FACES_PAPIER].map(([fichier]) => fichier)) {
    assert.ok(fichiers.includes(`${nom}.woff2`), `police absente : ${nom}`);
  }
  assert.ok(fichiers.includes('OFL.txt'), 'licence OFL d’IBM Plex absente');
  assert.ok(fichiers.includes('OFL-Inter.txt'), 'licence OFL d’Inter absente');
  const total = fichiers.reduce((poids, nom) => poids + statSync(join(FONTS, nom)).size, 0);
  assert.ok(total <= 260 * 1024, `jeu de polices trop lourd : ${Math.round(total / 1024)} Ko`);
});

test('chaque surface déclare les faces attendues, sans requête distante', () => {
  const attendus = {
    web: [...FACES_INTERFACE, ...FACES_PAPIER],
    fenetre: FACES_INTERFACE,
    confidentialite: FACES_INTERFACE,
    site: FACES_SITE,
  };

  for (const [nom, css] of Object.entries(CSS)) {
    assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic/, `${nom} charge une police distante`);
    const faces = facesDeclarees(css);
    assert.equal(faces.length, attendus[nom].length, `${nom} : nombre de faces inattendu`);
    for (const [fichier, famille, graisse] of attendus[nom]) {
      assert.ok(
        faces.some((face) => face.famille === famille && face.graisse === graisse
          && face.url === `fonts/${fichier}.woff2`),
        `${nom} : ${famille} ${graisse} (${fichier}) non déclarée`,
      );
    }
  }
});

test('l’interface est en Inter, les données en mono, le papier en Plex', () => {
  // Application : une seule voix, trois graisses.
  assert.match(CSS.web, /--font:\s*"Inter"/);
  assert.match(CSS.web, /--mono:\s*"IBM Plex Mono"/);
  assert.match(CSS.web, /--type-sm:\s*13px/);
  // Le conteneur papier ne suit pas la nouvelle voix : il garde Plex.
  assert.match(CSS.web, /--font-papier:\s*"IBM Plex Sans"/);
  assert.match(CSS.web, /\.print-root[^{]*\{[^}]*font-family:\s*var\(--font-papier\)/);

  // Fenêtre de l'extension : Inter aussi, en rem.
  assert.match(CSS.fenetre, /--font-ui:\s*"Inter"/);
  assert.match(CSS.fenetre, /--font-mono:\s*"IBM Plex Mono"/);

  // Page de confidentialité.
  assert.match(CSS.confidentialite, /--font:\s*"Inter"/);
  assert.doesNotMatch(CSS.confidentialite, /"IBM Plex Sans"/);

  // Le site public, inchangé tant que le bac à sable n'est pas promu.
  assert.match(CSS.site, /font:\s*17px\/1\.65 "IBM Plex Sans"/);
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
    // L'application et la fenêtre embarquent Inter ; le papier garde Plex.
    ['dist/web', 'style.css', 'inter-latin-400', 'OFL-Inter.txt'],
    ['dist/extension', 'popup.css', 'inter-latin-400', 'OFL-Inter.txt'],
    // Le site public n'est pas encore passé au nouveau système.
    ['dist/site', 'style.css', 'ibm-plex-sans-400', 'OFL.txt'],
  ];

  for (const [dossier, css, police, licence] of livrables) {
    const racine = join(ROOT, dossier);
    assert.ok(await attendre(join(racine, 'fonts', `${police}.woff2`)), `${dossier} : police absente`);
    assert.ok(await attendre(join(racine, 'fonts', licence)), `${dossier} : licence absente`);
    // La feuille est réécrite par les constructions qui tournent en parallèle :
    // on attend qu'elle soit là avant de la relire.
    assert.ok(await attendre(join(racine, css)), `${dossier} : ${css} absent`);
    assert.match(
      readFileSync(join(racine, css), 'utf8'),
      new RegExp(`url\\("fonts/${police}\\.woff2"\\)`),
    );
  }
});
