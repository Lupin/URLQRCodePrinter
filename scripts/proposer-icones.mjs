/**
 * Propose des icônes pour la fiche du magasin.
 *
 * Huit dessins, rendus à la dimension exacte que le magasin demande — 128 × 128,
 * avec canal alpha — et une planche de contrôle qui les montre à 256, à 128 et à
 * 32 px sur le gris clair de la fiche.
 *
 * Deux raisons de passer par Chrome plutôt que de peindre des pixels :
 *   - les dessins sont des **formes** (SVG), donc nets à toute taille, et le
 *     rendu à 512 puis la réduction à 128 donnent un anticrénelage meilleur que
 *     de l'anti-aliasing calculé à la main ;
 *   - le fond est **transparent** (override CDP à alpha 0), ce que le magasin
 *     exige pour l'icône et ce qu'un JPEG ne saurait pas porter.
 *
 * Le dossier de sortie est volontairement hors du dépôt (`dist/brouillons-*`) :
 * ce sont des propositions, pas la marque. Une fois le dessin retenu, il rejoint
 * `scripts/make-icons.mjs`, qui reste la source des icônes expédiées.
 */

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SORTIE = join(ROOT, 'dist', 'brouillons-icones');
const BAC = join(SORTIE, '.bac');
const PORT = 9337;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Couleurs de la marque, et deux tons de papier pour les volumes.
const ORANGE = '#c2410c';
const ORANGE_SOMBRE = '#8f2f08';
const CREME = '#f7f3ec';
const CREME_OMBRE = '#e2d6c4';
const CHARBON = '#161616';

let graine = 0x2f6e2b1;
/** Un générateur déterministe : deux exécutions donnent le même motif. */
function alea() {
  graine = (graine * 1664525 + 1013904223) >>> 0;
  return graine / 0x100000000;
}

/**
 * Le motif QR : trois carrés de repérage, les motifs de synchronisation, puis
 * des modules tirés au sort — mais toujours les mêmes. C'est le même parti pris
 * que `scripts/make-icons.mjs`, en vectoriel.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} taille
 * @param {{ encre?: string, papier?: string, carte?: boolean }} [options]
 */
function qr(x, y, taille, options = {}) {
  const encre = options.encre ?? CHARBON;
  const papier = options.papier ?? CREME;
  const m = 21;
  const u = taille / m;
  const morceaux = [];
  if (options.carte !== false) {
    morceaux.push(`<rect x="${x}" y="${y}" width="${taille}" height="${taille}" rx="${taille * 0.08}" fill="${papier}"/>`);
  }
  const reperes = [[0, 0], [14, 0], [0, 14]];
  for (const [cx, cy] of reperes) {
    morceaux.push(
      `<rect x="${x + cx * u}" y="${y + cy * u}" width="${7 * u}" height="${7 * u}" fill="${encre}"/>`,
      `<rect x="${x + (cx + 1) * u}" y="${y + (cy + 1) * u}" width="${5 * u}" height="${5 * u}" fill="${papier}"/>`,
      `<rect x="${x + (cx + 2) * u}" y="${y + (cy + 2) * u}" width="${3 * u}" height="${3 * u}" fill="${encre}"/>`,
    );
  }
  // Synchronisation : la ligne et la colonne 6, alternées.
  for (let i = 8; i < 14; i += 1) {
    if (i % 2 === 0) {
      morceaux.push(`<rect x="${x + i * u}" y="${y + 6 * u}" width="${u}" height="${u}" fill="${encre}"/>`);
      morceaux.push(`<rect x="${x + 6 * u}" y="${y + i * u}" width="${u}" height="${u}" fill="${encre}"/>`);
    }
  }
  // Modules de données, hors des zones réservées.
  for (let ligne = 0; ligne < m; ligne += 1) {
    for (let colonne = 0; colonne < m; colonne += 1) {
      const dansRepere =
        (colonne < 8 && ligne < 8) ||
        (colonne > 12 && ligne < 8) ||
        (colonne < 8 && ligne > 12);
      if (dansRepere || colonne === 6 || ligne === 6) continue;
      if (alea() < 0.32) {
        morceaux.push(
          `<rect x="${x + colonne * u}" y="${y + ligne * u}" width="${u}" height="${u}" fill="${encre}"/>`,
        );
      }
    }
  }
  return morceaux.join('');
}

/** Une tuile : le fond arrondi de l'icône, à bord perdu. */
const tuile = (fond) => `<rect width="128" height="128" rx="28" fill="${fond}"/>`;
/** Une ombre portée courte, pour donner du relief sans salir. */
const ombre = (x, y, w, h, r = 14, opacite = 0.28) =>
  `<rect x="${x}" y="${y + 4}" width="${w}" height="${h}" rx="${r}" fill="rgba(0,0,0,${opacite})"/>`;

/** Les huit dessins. */
const DESSINS = [
  {
    titre: 'Étiquette autocollante',
    svg: `${tuile(ORANGE)}
      ${ombre(20, 16, 88, 88, 16, 0.30)}
      <rect x="22" y="18" width="84" height="84" rx="16" fill="${CREME}"/>
      <circle cx="22" cy="60" r="5.5" fill="${ORANGE}"/>
      <circle cx="106" cy="60" r="5.5" fill="${ORANGE}"/>
      ${qr(34, 30, 60)}`,
  },
  {
    titre: 'Étiquette à trou',
    svg: `${tuile(CREME)}
      ${ombre(18, 20, 96, 88, 18, 0.16)}
      <g transform="rotate(-6 64 64)">
        <path d="M46 28 H100 Q110 28 110 38 V90 Q110 100 100 100 H46 L20 66 Q16 64 20 62 Z" fill="${ORANGE}"/>
        <circle cx="38" cy="64" r="6" fill="${CREME}"/>
        ${qr(58, 40, 44)}
      </g>`,
  },
  {
    titre: 'Imprimante et étiquette',
    svg: `${tuile(CHARBON)}
      <rect x="34" y="14" width="60" height="64" rx="7" fill="${CREME}"/>
      ${qr(40, 20, 48)}
      ${ombre(8, 62, 112, 44, 12, 0.45)}
      <rect x="8" y="66" width="112" height="44" rx="12" fill="${CREME}"/>
      <rect x="20" y="76" width="88" height="12" rx="6" fill="${CHARBON}"/>
      <circle cx="102" cy="99" r="4.5" fill="${ORANGE}"/>`,
  },
  {
    titre: 'Rouleau d\'étiquettes',
    svg: `${tuile(ORANGE)}
      <rect x="78" y="52" width="50" height="24" rx="5" fill="${CREME}"/>
      <rect x="90" y="58" width="4" height="12" fill="${CHARBON}"/>
      <rect x="98" y="58" width="3" height="12" fill="${CHARBON}"/>
      <rect x="105" y="58" width="5" height="12" fill="${CHARBON}"/>
      <circle cx="54" cy="64" r="34" fill="${CREME}"/>
      ${qr(33, 43, 42, { carte: false })}`,
  },
  {
    titre: 'Lien en bulle',
    svg: `${tuile(CREME)}
      ${ombre(10, 12, 108, 74, 22, 0.16)}
      <rect x="12" y="14" width="104" height="72" rx="22" fill="${ORANGE}"/>
      <path d="M34 84 L34 112 L62 84 Z" fill="${ORANGE}"/>
      ${qr(34, 26, 60)}`,
  },
  {
    titre: 'Page cornée',
    svg: `${tuile(CHARBON)}
      ${ombre(24, 6, 80, 112, 10, 0.42)}
      <path d="M28 10 H78 L100 32 V118 H28 Z" fill="${CREME}"/>
      <path d="M78 10 V32 H100 Z" fill="${CREME_OMBRE}"/>
      ${qr(38, 40, 52, { carte: false })}
      <rect x="38" y="100" width="50" height="7" rx="3.5" fill="${ORANGE}"/>`,
  },
  {
    titre: 'Planche d\'étiquettes',
    svg: `${tuile(ORANGE)}
      ${ombre(12, 12, 104, 104, 14, 0.30)}
      <rect x="14" y="14" width="100" height="100" rx="12" fill="${CREME}"/>
      <line x1="64" y1="16" x2="64" y2="112" stroke="${ORANGE}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".55"/>
      <line x1="16" y1="64" x2="112" y2="64" stroke="${ORANGE}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".55"/>
      ${qr(19, 19, 40)}
      ${qr(69, 19, 40)}
      ${qr(19, 69, 40)}
      ${qr(69, 69, 40)}`,
  },
  {
    titre: 'Deux signets',
    svg: `${tuile(CHARBON)}
      <path d="M58 16 H98 V112 L78 96 L58 112 Z" fill="${ORANGE}"/>
      <path d="M34 6 H76 V104 L55 88 L34 104 Z" fill="${CREME}"/>
      ${qr(42, 16, 30, { carte: false })}
      <rect x="42" y="56" width="34" height="6" rx="3" fill="${CREME_OMBRE}"/>
      <rect x="42" y="68" width="22" height="6" rx="3" fill="${CREME_OMBRE}"/>`,
  },
];

const CADRE = (contenu) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; background: transparent; }
  svg { display: block; }
</style></head><body>
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 128 128">${contenu}</svg>
</body></html>`;

async function connect(url) {
  const ws = new WebSocket(url);
  let next = 1;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const settle = pending.get(message.id);
    if (settle) {
      pending.delete(message.id);
      settle(message);
    }
  });
  await new Promise((r) => ws.addEventListener('open', r));
  return {
    send: (method, params) => new Promise((res) => {
      const id = next++;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    }),
  };
}

function supprimerAvecReprise(chemin) {
  for (let essai = 0; essai < 10; essai += 1) {
    try {
      rmSync(chemin, { recursive: true, force: true });
      return;
    } catch (erreur) {
      if (essai === 9) throw erreur;
      spawnSync('sleep', ['0.2']);
    }
  }
}

/** Rend une page en PNG transparent, à la dimension demandée. */
async function capturer({ port, nom, html, largeur, hauteur, dossier }) {
  const fichier = join(BAC, `${nom}.html`);
  writeFileSync(fichier, html, 'utf8');
  const target = await fetch(
    `http://127.0.0.1:${port}/json/new?file://${encodeURIComponent(fichier)}`,
    { method: 'PUT' },
  ).then((r) => r.json());
  const page = await connect(target.webSocketDebuggerUrl);
  await page.send('Runtime.enable');
  await page.send('Page.enable');
  await page.send('Emulation.setDefaultBackgroundColorOverride', {
    color: { r: 0, g: 0, b: 0, a: 0 },
  });
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: largeur, height: hauteur, deviceScaleFactor: 1, mobile: false,
  });
  await pause(250);
  const shot = await page.send('Page.captureScreenshot', { format: 'png' });
  if (!shot?.result?.data) throw new Error(`capture vide : ${nom}`);
  const sortie = join(dossier, `${nom}.png`);
  writeFileSync(sortie, Buffer.from(shot.result.data, 'base64'));
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  return sortie;
}

async function main() {
  supprimerAvecReprise(SORTIE);
  mkdirSync(SORTIE, { recursive: true });
  mkdirSync(BAC, { recursive: true });

  const browser = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-crash-reporter', '--disable-dev-shm-usage',
    `--user-data-dir=${join(BAC, 'profil')}`,
    `--remote-debugging-port=${PORT}`,
    '--window-size=240,240', '--window-position=-3000,-3000',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    let version = null;
    for (let essai = 0; essai < 80 && !version; essai += 1) {
      version = await fetch(`http://127.0.0.1:${PORT}/json/version`)
        .then((r) => r.json()).catch(() => null);
      if (!version) await pause(250);
    }
    if (!version) throw new Error('Chrome ne répond pas sur le port de débogage');

    const grands = [];
    for (const [index, dessin] of DESSINS.entries()) {
      const nom = `proposition-${index + 1}`;
      const grand = await capturer({
        port: PORT, nom, html: CADRE(dessin.svg),
        largeur: 512, hauteur: 512, dossier: SORTIE,
      });
      const sips = spawnSync('sips', ['-z', '128', '128', grand, '--out', join(SORTIE, `${nom}-128.png`)], {
        encoding: 'utf8',
      });
      if (sips.status !== 0) throw new Error(`sips a échoué : ${sips.stderr}`);
      grands.push({ nom, grand, titre: dessin.titre });
      console.log(`  ${nom} — ${dessin.titre}`);
    }

    // La planche : 8 icônes à 256 px, puis la même série à 32 px, sur le gris
    // clair du magasin.
    const cartes = grands.map(({ nom }) => {
      const donnees = readFileSync(join(SORTIE, `${nom}.png`)).toString('base64');
      return `<figure><img src="data:image/png;base64,${donnees}" width="224" height="224" alt=""><figcaption>${nom.replace('proposition-', '')} — ${DESSINS[Number(nom.replace('proposition-', '')) - 1].titre}</figcaption></figure>`;
    }).join('');
    const sombres = grands.map(({ nom }) => {
      const donnees = readFileSync(join(SORTIE, `${nom}-128.png`)).toString('base64');
      return `<img src="data:image/png;base64,${donnees}" width="56" height="56" alt="">`;
    }).join('');
    const petits = grands.map(({ nom }) => {
      const donnees = readFileSync(join(SORTIE, `${nom}-128.png`))
        .toString('base64');
      return `<img src="data:image/png;base64,${donnees}" width="32" height="32" alt="">`;
    }).join('');
    const planche = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      html, body { margin: 0; background: #e9e7e3; }
      body { font-family: -apple-system, "Helvetica Neue", sans-serif; color: #2c2a27; }
      h1 { font-size: 30px; margin: 28px 0 4px 40px; font-weight: 700; letter-spacing: -.02em; }
      p.sous { margin: 0 0 22px 40px; font-size: 15px; color: #6b665f; }
      .grille { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 10px; margin: 0 26px; }
      figure { margin: 0; text-align: center; background: #fff; border-radius: 18px; padding: 14px 8px 12px;
               box-shadow: 0 2px 8px rgba(0,0,0,.07); }
      figure img { display: block; margin: 0 auto; }
      figcaption { font-size: 13px; margin-top: 8px; color: #4a4640; }
      .petits { display: flex; gap: 26px; align-items: center; margin: 26px 40px 8px; }
      .petits span { font-size: 13px; color: #6b665f; }
      .petits img { image-rendering: auto; }
      .sombres { display: flex; gap: 18px; align-items: center; margin: 18px 26px 8px;
                 background: #202124; border-radius: 16px; padding: 12px 20px; }
      .sombres span { font-size: 13px; color: #b8b4ae; margin-right: 6px; }
      footer { margin: 6px 40px 30px; font-size: 13px; color: #6b665f; }
    </style></head><body>
      <h1>Huit propositions d'icône</h1>
      <p class="sous">128 × 128, canal alpha — montrées ici à 224 px sur le gris clair du magasin.</p>
      <div class="grille">${cartes}</div>
      <div class="petits"><span>à 32 px :</span>${petits}</div>
      <div class="sombres"><span>sur fond sombre, à 56 px :</span>${sombres}</div>
      <footer>Le gris clair est celui de la fiche ; la tuile arrondie porte la marque, le fond reste transparent.</footer>
    </body></html>`;
    const fichierPlanche = join(BAC, 'planche.html');
    writeFileSync(fichierPlanche, planche, 'utf8');
    const cible = await fetch(
      `http://127.0.0.1:${PORT}/json/new?file://${encodeURIComponent(fichierPlanche)}`,
      { method: 'PUT' },
    ).then((r) => r.json());
    const page = await connect(cible.webSocketDebuggerUrl);
    await page.send('Runtime.enable');
    await page.send('Page.enable');
    await page.send('Emulation.setDefaultBackgroundColorOverride', {
      color: { r: 233, g: 231, b: 227, a: 1 },
    });
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1240, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    await pause(500);
    const plancheShot = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(SORTIE, 'planche.png'), Buffer.from(plancheShot.result.data, 'base64'));
    console.log(`\n✓ huit propositions et la planche dans ${SORTIE.slice(ROOT.length + 1)}`);
  } finally {
    try { browser.kill('SIGKILL'); } catch { /* déjà arrêté */ }
    supprimerAvecReprise(BAC);
  }
}

await main();
