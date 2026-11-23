/**
 * Une seule commande pour préparer une mise à jour du Chrome Web Store.
 *
 *   npm run store
 *
 * Elle reconstruit le paquet, **refait toutes les captures d'écran** (application,
 * fenêtre, promotion, et les visuels du site), assemble `dist/store/` avec
 * uniquement les fichiers à déposer, puis régénère les images et la page HTML
 * publiée (GitHub Pages).
 *
 * Le dossier produit est jetable : on le vide à chaque exécution. La source de
 * vérité reste `store/listing.json`, `store/screenshots/` et `src/site/`.
 *
 * Prérequis : macOS (Chrome, `sips`, `zip`), et une session graphique — les
 * captures passent par CDP, pas par `--headless`.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist', 'store');
const SITE_IMAGES = join(ROOT, 'src', 'site', 'images');
const SITE_SHOTS = join(ROOT, 'dist', '.site-shots');
const VERSION_FILE = join(ROOT, 'store', 'screenshots', 'VERSION');
const ARCHIVES = join(ROOT, 'docs', 'archive', 'store-versions');

const LISTING = JSON.parse(readFileSync(join(ROOT, 'store', 'listing.json'), 'utf8'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9680;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

function run(label, args) {
  process.stdout.write(`\n▸ ${label}\n`);
  execFileSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
}

/** Un script de capture peut échouer sur un profil Chrome encore tenu : on retente une fois. */
function runCapture(label, args) {
  try {
    run(label, args);
  } catch {
    process.stdout.write(`  ↻ ${label} : nouvelle tentative après nettoyage du profil\n`);
    run(label, args);
  }
}

function versionActuelle() {
  return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
}

/**
 * Archive la série de captures de la version précédente avant de l'écraser.
 *
 * Sans cela, une nouvelle version remplaçait les images sur disque et la fiche
 * publiée devenait impossible à reconstituer. La version lue est celle du
 * marqueur `store/screenshots/VERSION` ; une série déjà archivée n'est pas
 * recopiée.
 */
function archiverVersionPrecedente() {
  let ancienne = null;
  try { ancienne = readFileSync(VERSION_FILE, 'utf8').trim(); } catch { return; }
  const actuelle = versionActuelle();
  if (!ancienne || ancienne === actuelle) return;
  const destination = join(ARCHIVES, ancienne);
  if (existsSync(destination)) return;
  mkdirSync(join(destination, 'screenshots'), { recursive: true });
  mkdirSync(join(destination, 'promo'), { recursive: true });
  for (const nom of readdirSync(join(ROOT, 'store', 'screenshots'))) {
    if (!/\.png$/i.test(nom)) continue;
    copyFileSync(join(ROOT, 'store', 'screenshots', nom), join(destination, 'screenshots', nom));
  }
  for (const nom of ['promo-440x280.jpg', 'marquee-1400x560.jpg']) {
    copyFileSync(join(ROOT, 'store', 'promo', nom), join(destination, 'promo', nom));
  }
  writeFileSync(join(destination, 'README.md'), `# Fiche Chrome Web Store — ${ancienne}\n\nArchive automatique de la série ${ancienne}, remplacée par ${actuelle}.\n`, 'utf8');
  process.stdout.write(`  série ${ancienne} archivée dans docs/archive/store-versions/\n`);
}

/** Retire les doublons de synchronisation iCloud dans un dossier de visuels. */
function retirerDoublons(dossier) {
  if (!existsSync(dossier)) return;
  for (const nom of readdirSync(dossier)) {
    if (!/ \d+\.(png|jpe?g)$/i.test(nom) && !/^\._/.test(nom) && nom !== '.DS_Store') continue;
    rmSync(join(dossier, nom), { force: true });
    process.stdout.write(`  doublon retiré : ${nom}\n`);
  }
}

function sips(args) {
  execFileSync('sips', args, { cwd: ROOT, stdio: 'ignore' });
}

/** Version du manifeste, sans dézipper l'archive. */
function version() {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'dist', 'extension', 'manifest.json'), 'utf8'));
  return manifest.version;
}

/** Dimensions d'un PNG, lues dans son en-tête IHDR. */
function pngSize(chemin) {
  const b = readFileSync(chemin);
  if (b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`pas un PNG : ${chemin}`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function attendre(nom, dimensions = null) {
  if (!existsSync(nom)) throw new Error(`fichier attendu absent : ${nom}`);
  if (dimensions) {
    const { width, height } = pngSize(nom);
    if (width !== dimensions[0] || height !== dimensions[1]) {
      throw new Error(`${nom} : ${width}×${height}, attendu ${dimensions[0]}×${dimensions[1]}`);
    }
  }
  return nom;
}

/* ------------------------------------------------------------------ */
/* Captures du site (GitHub Pages) — faites ici, pas dans store/       */
/* ------------------------------------------------------------------ */

async function connect(url) {
  const sock = new WebSocket(url);
  let n = 0;
  const attente = new Map();
  sock.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    const slot = attente.get(msg.id);
    if (!slot) return;
    attente.delete(msg.id);
    if (msg.error) slot.reject(new Error(msg.error.message));
    else slot.resolve(msg.result ?? {});
  });
  await new Promise((ok, ko) => { sock.addEventListener('open', ok); sock.addEventListener('error', ko); });
  return {
    call: (method, params = {}) => new Promise((ok, ko) => {
      n += 1;
      attente.set(n, { resolve: ok, reject: ko });
      sock.send(JSON.stringify({ id: n, method, params }));
    }),
  };
}

async function captureSite() {
  const profil = join(ROOT, 'dist', '.site-profil');
  rmSync(profil, { recursive: true, force: true });
  rmSync(SITE_SHOTS, { recursive: true, force: true });
  mkdirSync(profil, { recursive: true });
  mkdirSync(SITE_SHOTS, { recursive: true });

  const navigateur = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', `--user-data-dir=${profil}`,
    `--remote-debugging-port=${PORT}`, '--window-size=1500,1000',
    '--window-position=-3000,-3000', 'about:blank',
  ], { stdio: 'ignore' });

  try {
    let versionJson = null;
    for (let i = 0; i < 100 && !versionJson; i += 1) {
      versionJson = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null);
      if (!versionJson) await pause(250);
    }
    if (!versionJson) throw new Error('Chrome ne répond pas sur le port de débogage');

    const ctl = await connect(versionJson.webSocketDebuggerUrl);
    const { id } = await ctl.call('Extensions.loadUnpacked', { path: join(ROOT, 'dist', 'extension') });
    const page = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`chrome-extension://${id}/app.html`)}`, { method: 'PUT' }).then((r) => r.json());
    const s = await connect(page.webSocketDebuggerUrl);
    await s.call('Runtime.enable');
    await s.call('Page.enable');
    await s.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

    const evalPage = async (expression) => {
      const r = await s.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'évaluation refusée');
      return r.result?.value;
    };

    const liens = [
      { url: 'https://fr.wikipedia.org/wiki/Caf%C3%A9', title: 'Café — Wikipédia', tags: ['lecture'], note: 'À relire' },
      { url: 'https://developer.mozilla.org/fr/docs/Web/CSS', title: 'CSS — MDN', tags: ['doc'], note: '' },
      { url: 'https://www.radiofrance.fr/franceculture', title: 'France Culture', tags: ['radio'], note: '' },
      { url: 'https://www.lemonde.fr/', title: 'Le Monde', tags: ['lecture'], note: '' },
      { url: 'https://github.com/Lupin/URLQRCodePrinter', title: 'URLQRCodePrinter', tags: ['code'], note: '' },
    ].map((lien, i) => ({ id: `site-${i}`, ...lien, createdAt: Date.now() - i * 86400000 }));

    // Les clés de consentement viennent du produit : pas de recopie.
    const { CONSENT_KEY, DISCLOSURE_VERSION } = await import('../src/core/privacy.js');
    const amorce = { links: liens, [CONSENT_KEY]: { version: DISCLOSURE_VERSION, decision: 'accepted', at: Date.now() } };
    await evalPage(`new Promise((resolve) => chrome.storage.local.set(${JSON.stringify(amorce)}, resolve))`);
    await s.call('Page.reload');
    await pause(2400);
    await evalPage(`(() => { const st = document.createElement('style'); st.textContent = '*{transition:none !important;animation:none !important}'; document.head.appendChild(st); return true; })()`);

    const etats = [
      ['planche', "document.querySelector('.tab[data-mode=\"sheet\"]').click()"],
      ['tableau', "document.querySelector('.tab[data-mode=\"table\"]').click()"],
      ['etiquette', "document.querySelector('.tab[data-mode=\"single\"]').click(); document.querySelector('#list .link__check').click()"],
      ['divers', "document.querySelector('.tab[data-mode=\"images\"]').click()"],
      ['selection', "document.querySelector('.tab[data-mode=\"sheet\"]').click(); document.getElementById('select-all-box').click()"],
    ];

    for (const [nom, action] of etats) {
      await evalPage(`(async () => { const p = (ms) => new Promise((r) => setTimeout(r, ms)); ${action}; await p(900); return true; })()`);
      const shot = await s.call('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(SITE_SHOTS, `${nom}.png`), Buffer.from(shot.data, 'base64'));
      process.stdout.write(`  capture ${nom}\n`);
    }
  } finally {
    navigateur.kill('SIGKILL');
    await pause(300);
  }

  // 1280×800 -> 1100×688, même cadrage que les images du site.
  for (const nom of ['planche', 'tableau', 'etiquette', 'divers', 'selection']) {
    const source = join(SITE_SHOTS, `${nom}.png`);
    const sortie = join(SITE_IMAGES, `${nom}.jpg`);
    sips(['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '-z', '688', '1100', source, '--out', sortie]);
    process.stdout.write(`  site images/${nom}.jpg\n`);
  }
  rmSync(profil, { recursive: true, force: true });
  rmSync(SITE_SHOTS, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ */
/* Assemblage                                                          */
/* ------------------------------------------------------------------ */

const CAPTURES = [
  '01-fenetre-popup', '02-application', '03-impression-niimbot',
  '04-tableau', '05-collections',
];

function deposerCaptures() {
  for (const langue of ['fr', 'en']) {
    const dossier = join(OUT, langue);
    mkdirSync(dossier, { recursive: true });
    for (const base of CAPTURES) {
      const source = join(ROOT, 'store', 'screenshots', `${base}-${langue}.png`);
      attendre(source, [1280, 800]);
      copyFileSync(source, join(dossier, `${base}-${langue}.png`));
    }
  }
}

function ficheMarkdown(langue) {
  const l = LISTING;
  return `# Fiche Chrome Web Store — ${langue.toUpperCase()}

- **Nom** : ${l.item.name}
- **Version publiée actuelle** : ${l.item.publishedVersion}
- **URL** : ${l.item.url}
- **Politique de confidentialité** : ${l.privacyPolicyUrl}

## Résumé

${l.summary[langue]}

## Description

${l.description[langue]}
`;
}

function checklist(version) {
  return `# Dépôt Chrome Web Store — ${version}

Ce dossier est **jetable** : il est régénéré par \`npm run store\`. Ne le modifie pas à la main.

## Ce qui se dépose, et où

| Champ du portail | Fichier | Dimension / remarque |
|---|---|---|
| Archive de l'extension | \`url-qrcode-printer-chrome.zip\` | manifeste à la racine |
| Captures FR (5 emplacements) | \`fr/01…05\` | 1280 × 800, PNG |
| Captures EN (5 emplacements) | \`en/01…05\` | 1280 × 800, PNG |
| Petite image promotionnelle | \`promo-440x280.jpg\` | 440 × 280, JPEG sans alpha |
| Image en haut de page | \`marquee-1400x560.jpg\` | 1 400 × 560, JPEG sans alpha |
| Icône de la fiche | \`icone-128.png\` | 128 × 128 |
| Résumé + description FR | \`listing-fr.md\` | copier les sections |
| Résumé + description EN | \`listing-en.md\` | copier les sections |
| Note de version | \`a-coller-mise-a-jour.md\` | texte brut, à coller |

## Avant de déposer

1. Vérifier que la version du manifeste est celle attendue : \`version.json\`.
2. Vérifier la politique de confidentialité : ${LISTING.privacyPolicyUrl}
3. Déposer l'archive, puis les cinq captures de la langue concernée.
4. Contrôler que les textes FR et EN ne se sont pas échangés.
5. Après publication, mettre à jour \`publishedVersion\` dans \`store/listing.json\`.

## Ce qui a été refait automatiquement

- le paquet (build + zip) ;
- les 10 captures du magasin (application, fenêtre, impression, confidentialité, collections), FR et EN ;
- les deux visuels promotionnels ;
- les 5 images du site GitHub Pages, et le site reconstruit dans \`dist/site/\` ;
- la fiche de saisie et les textes ci-dessus.

Sources : \`store/listing.json\`, \`store/screenshots/\`, \`src/site/\`. Les captures ne sont jamais éditées à la main.
`;
}

async function main() {
  if (process.env.STORE_SITE_ONLY === '1') {
    process.stdout.write('▸ Captures du site uniquement\n');
    await captureSite();
    run('Reconstruction du site avec les nouvelles images', ['scripts/build-site.mjs', '--no-build']);
    return;
  }

  archiverVersionPrecedente();
  run('Construction de l’extension et du site', ['scripts/build.mjs']);
  run('Synchronisation du miroir Safari', ['scripts/sync-safari-resources.mjs']);
  run('Paquet Chrome (zip)', ['scripts/package-chrome.mjs']);
  runCapture('Captures du magasin (application, confidentialité, collections)', ['scripts/capture-store-shots.mjs']);
  runCapture('Captures de la fenêtre de l’extension', ['scripts/capture-popup-shots.mjs']);
  runCapture('Visuels promotionnels', ['scripts/capture-promo.mjs']);
  process.stdout.write('\n▸ Captures du site (GitHub Pages)\n');
  await captureSite();
  run('Reconstruction du site avec les nouvelles images', ['scripts/build-site.mjs', '--no-build']);
  // Les scripts de capture peuvent laisser passer un doublon iCloud dans les
  // visuels du site ou de la promotion : on nettoie avant d'assembler.
  retirerDoublons(SITE_IMAGES);
  retirerDoublons(join(ROOT, 'store', 'promo'));
  writeFileSync(VERSION_FILE, `${versionActuelle()}\n`, 'utf8');
  run('Feuille de saisie de la mise à jour', ['scripts/preparer-soumission.mjs']);

  process.stdout.write('\n▸ Assemblage de dist/store/\n');
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  deposerCaptures();
  copyFileSync(join(ROOT, 'store', 'promo', 'promo-440x280.jpg'), join(OUT, 'promo-440x280.jpg'));
  copyFileSync(join(ROOT, 'store', 'promo', 'marquee-1400x560.jpg'), join(OUT, 'marquee-1400x560.jpg'));
  copyFileSync(join(ROOT, 'dist', 'extension', 'icons', 'icon-128.png'), join(OUT, 'icone-128.png'));
  copyFileSync(join(ROOT, 'dist', 'url-qrcode-printer-chrome.zip'), join(OUT, 'url-qrcode-printer-chrome.zip'));
  copyFileSync(join(ROOT, 'dist', 'a-coller-mise-a-jour.md'), join(OUT, 'a-coller-mise-a-jour.md'));

  // Un seul dossier, et **uniquement** les fichiers à déposer : tout ce qui
  // n'est pas dans cette liste (doublons Finder « 2 », restes d'une exécution
  // interrompue) est retiré après l'assemblage.
  const attendus = new Set([
    ...['fr', 'en'].flatMap((langue) => CAPTURES.map((base) => join(langue, `${base}-${langue}.png`))),
    'promo-440x280.jpg', 'marquee-1400x560.jpg', 'icone-128.png',
    'url-qrcode-printer-chrome.zip', 'a-coller-mise-a-jour.md',
    'listing-fr.md', 'listing-en.md', 'CHECKLIST.md', 'version.json',
  ]);
  const retirerIntrus = (dossier, prefixe = '') => {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const rel = join(prefixe, entree.name);
      if (entree.isDirectory()) { retirerIntrus(join(dossier, entree.name), rel); continue; }
      if (!attendus.has(rel)) {
        rmSync(join(dossier, entree.name), { force: true });
        process.stdout.write(`  retiré (hors dépôt) : ${rel}\n`);
      }
    }
  };
  retirerIntrus(OUT);

  const v = version();
  writeFileSync(join(OUT, 'listing-fr.md'), ficheMarkdown('fr'), 'utf8');
  writeFileSync(join(OUT, 'listing-en.md'), ficheMarkdown('en'), 'utf8');
  writeFileSync(join(OUT, 'CHECKLIST.md'), checklist(v), 'utf8');
  const fichiers = [];
  const parcourir = (dossier, prefixe = '') => {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const rel = join(prefixe, entree.name);
      if (entree.isDirectory()) parcourir(join(dossier, entree.name), rel);
      else fichiers.push(rel);
    }
  };
  parcourir(OUT);
  writeFileSync(join(OUT, 'version.json'), JSON.stringify({
    version: v,
    prepareLe: new Date().toISOString(),
    fichiers: fichiers.sort(),
  }, null, 2) + '\n', 'utf8');

  process.stdout.write(`\n✓ ${OUT} prêt — ${fichiers.length} fichiers, version ${v}\n`);
  process.stdout.write('  Tout est dans ce seul dossier :\n');
  process.stdout.write('  - url-qrcode-printer-chrome.zip\n');
  process.stdout.write('  - fr/ et en/ (cinq captures 1280 × 800 chacune)\n');
  process.stdout.write('  - promo-440x280.jpg, marquee-1400x560.jpg, icone-128.png\n');
  process.stdout.write('  - listing-fr.md, listing-en.md, a-coller-mise-a-jour.md\n');
  process.stdout.write('  - CHECKLIST.md, version.json\n');
  process.stdout.write('  Ouvrir : npm run store:open\n');
}

main().catch((erreur) => {
  console.error(`\n✗ ${erreur.message}`);
  process.exit(1);
});
