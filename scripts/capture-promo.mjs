/**
 * Produit les deux images promotionnelles de la fiche Chrome Web Store.
 *
 *   store/promo/promo-440x280.jpg      la petite image, obligatoire
 *   store/promo/marquee-1400x560.jpg   l'image « en haut de la page »
 *
 * Les deux sont **sans texte**, à une exception près : le nom du produit, qui
 * n'est pas une langue. C'est la recommandation de la documentation du magasin —
 * ces visuels ne sont pas déclinés par langue, contrairement aux captures — et
 * c'est ce qui leur permet de servir la fiche française comme la fiche
 * internationale.
 *
 * Le rendu passe par Chrome : le HTML compose la scène, `Page.captureScreenshot`
 * la prend à deux fois la taille, puis `sips` la ramène à la dimension exacte et
 * l'encode en JPEG. Le JPEG est un 24 bits sans canal alpha par construction,
 * ce que le magasin exige ; un PNG sorti de Chrome porterait, lui, un alpha.
 *
 * Les QR Codes sont **réels** : encodés par le produit, ils mènent au site et à
 * la fiche du magasin. Une image promotionnelle qui montre un QR Code illisible
 * serait un aveu.
 */

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { encodeQr, toSvg } from '../src/core/qr.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SANDBOX = join(ROOT, '.promo-shots');
const SORTIE = join(ROOT, 'store', 'promo');
const PORT = 9336;

const SITE = 'https://lupin.github.io/URLQRCodePrinter/';
const FICHE = 'https://chromewebstore.google.com/detail/urlqrcodeprinter/fmfbpjekpbopeijaobdffbhhnfgjjbmi';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Un QR Code réel, en SVG, aux couleurs de la scène. */
function qrSvg(url, { dark = '#14100d', light = '#f7f3ec', margin = 2 } = {}) {
  return toSvg(encodeQr(url, { ecc: 'M' }), { scale: 3, dark, light, margin });
}

const ICONE = `data:image/png;base64,${readFileSync(
  join(ROOT, 'src', 'extension-src', 'icons', 'icon-128.png'),
).toString('base64')}`;

/** Le fond commun : charbon chaud, halo orange, trame de points. */
const FOND = `
  .stage {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background:
      radial-gradient(120% 90% at 88% 8%, rgba(226, 96, 15, .38), transparent 62%),
      radial-gradient(90% 120% at 4% 100%, rgba(178, 60, 13, .30), transparent 60%),
      linear-gradient(135deg, #17110d 0%, #241811 55%, #332015 100%);
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  }
  .stage::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 246, 235, .10) 1.1px, transparent 1.4px);
    background-size: 16px 16px;
  }
  .stage > * { position: absolute; }
  *, *::before, *::after { box-sizing: border-box; }

  .win {
    background: #f7f3ec;
    border-radius: 14px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, .45);
    overflow: hidden;
  }
  .win__bar {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 12px 14px;
    background: #efe7da;
    border-bottom: 1px solid #ddd1bf;
  }
  .win__bar i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #c9bcaa;
  }
  .win__bar i:first-child { background: #e2600f; }
  .win__addr {
    flex: 1;
    height: 14px;
    margin-left: 8px;
    border-radius: 7px;
    background: #e3d8c8;
  }
  .win__rows { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .row { display: flex; align-items: center; gap: 10px; }
  .row__ico {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: #e2600f;
    flex: none;
  }
  .row__text { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .row__text b { display: block; height: 9px; border-radius: 5px; background: #cdbfab; }
  .row__text u { display: block; height: 7px; border-radius: 4px; background: #e2d7c7; }

  .label {
    background: #f7f3ec;
    border-radius: 12px;
    box-shadow: 0 20px 44px rgba(0, 0, 0, .42);
    padding: 12px 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .label svg { display: block; width: 100%; height: auto; }
  .label__bars { display: flex; flex-direction: column; gap: 5px; padding: 0 2px 2px; }
  .label__bars b { height: 7px; border-radius: 4px; background: #d6c9b6; }
  .label__bars u { height: 6px; border-radius: 3px; background: #e6dccd; }
  .label--orange { background: #e2600f; }
  .label--orange .label__bars b { background: rgba(255, 246, 235, .55); }
  .label--orange .label__bars u { background: rgba(255, 246, 235, .34); }

  .flow { position: absolute; }

  .marque { display: flex; align-items: center; gap: 16px; }
  .marque img { width: 100%; height: 100%; display: block; }
  .marque__nom {
    color: #f7f3ec;
    font-weight: 700;
    letter-spacing: -.02em;
    white-space: nowrap;
  }
`;

/** La petite image : 440 × 280. */
function pageCarte() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FOND}
    html, body { margin: 0; width: 440px; height: 280px; }
    .marque { left: 18px; top: 14px; }
    .marque__cadre { width: 42px; height: 42px; }
    .marque__nom { font-size: 14px; opacity: .92; }
    .win { left: 10px; top: 80px; width: 172px; transform: rotate(-4deg); }
    .win .win__rows { padding: 11px; gap: 10px; }
    .flow { left: 184px; top: 146px; }
    .label--face { left: 244px; top: 26px; width: 186px; transform: rotate(4deg); }
    .label--face svg { width: 158px; margin: 0 auto; }
    .bande {
      left: 0; bottom: 0; width: 100%; height: 7px;
      background: linear-gradient(90deg, transparent, #e2600f 22%, #e2600f 58%, transparent 92%);
      opacity: .9;
    }
  </style></head><body><div class="stage">
    <div class="marque">
      <div class="marque__cadre"><img src="${ICONE}" alt=""></div>
      <div class="marque__nom">URLQRCodePrinter</div>
    </div>
    <div class="win">
      <div class="win__bar"><i></i><i></i><i></i><div class="win__addr"></div></div>
      <div class="win__rows">
        <div class="row"><div class="row__ico"></div><div class="row__text"><b style="width:78%"></b><u style="width:56%"></u></div></div>
        <div class="row"><div class="row__ico"></div><div class="row__text"><b style="width:64%"></b><u style="width:72%"></u></div></div>
        <div class="row"><div class="row__ico"></div><div class="row__text"><b style="width:84%"></b><u style="width:48%"></u></div></div>
      </div>
    </div>
    <svg class="flow" width="54" height="34" viewBox="0 0 54 34" fill="none">
      <path d="M2 17h16" stroke="#e2600f" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 9"/>
      <path d="M24 6l14 11-14 11" stroke="#e2600f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M36 6l14 11-14 11" stroke="#e2600f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>
    </svg>
    <div class="label label--face">
      ${qrSvg(SITE)}
      <div class="label__bars"><b style="width:82%"></b><u style="width:58%"></u></div>
    </div>
    <div class="bande"></div>
  </div></body></html>`;
}

/** L'image « en haut de la page » : 1400 × 560. */
function pageMarquee() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FOND}
    html, body { margin: 0; width: 1400px; height: 560px; }
    .marque { left: 56px; top: 40px; }
    .marque__cadre { width: 60px; height: 60px; }
    .marque__nom { font-size: 29px; }
    .win { left: 56px; top: 196px; width: 424px; transform: rotate(-2deg); }
    .win .win__bar { padding: 16px 18px; gap: 10px; }
    .win .win__bar i { width: 12px; height: 12px; }
    .win .win__addr { height: 18px; border-radius: 9px; }
    .win .win__rows { padding: 20px; gap: 15px; }
    .win .row__ico { width: 36px; height: 36px; border-radius: 9px; }
    .win .row__text { gap: 8px; }
    .win .row__text b { height: 12px; }
    .win .row__text u { height: 9px; }
    .flow { left: 508px; top: 320px; }
    .label--face { left: 706px; top: 92px; width: 288px; transform: rotate(4deg); }
    .label--face svg { width: 252px; margin: 0 auto; }
    .label--face2 { left: 1012px; top: 40px; width: 218px; transform: rotate(-6deg); padding: 13px; }
    .label--face2 svg { width: 192px; margin: 0 auto; }
    .label--orange { left: 1132px; top: 300px; width: 184px; transform: rotate(7deg); padding: 12px; }
    .label--orange svg { width: 160px; margin: 0 auto; }
    .label--orange .label__bars b { height: 8px; }
    .bande {
      left: 0; bottom: 0; width: 100%; height: 10px;
      background: linear-gradient(90deg, transparent, #e2600f 18%, #e2600f 55%, transparent 90%);
      opacity: .9;
    }
  </style></head><body><div class="stage">
    <div class="marque">
      <div class="marque__cadre"><img src="${ICONE}" alt=""></div>
      <div class="marque__nom">URLQRCodePrinter</div>
    </div>
    <div class="win">
      <div class="win__bar"><i></i><i></i><i></i><div class="win__addr"></div></div>
      <div class="win__rows">
        <div class="row"><div class="row__ico"></div><div class="row__text"><b style="width:76%"></b><u style="width:54%"></u></div></div>
        <div class="row"><div class="row__ico"></div><div class="row__text"><b style="width:62%"></b><u style="width:70%"></u></div></div>
        <div class="row"><div class="row__ico"></div><div class="row__text"><b style="width:86%"></b><u style="width:46%"></u></div></div>
        <div class="row"><div class="row__ico"></div><div class="row__text"><b style="width:70%"></b><u style="width:62%"></u></div></div>
        <div class="row"><div class="row__ico"></div><div class="row__text"><b style="width:80%"></b><u style="width:52%"></u></div></div>
      </div>
    </div>
    <svg class="flow" width="150" height="80" viewBox="0 0 150 80" fill="none">
      <path d="M4 40h74" stroke="#e2600f" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 18"/>
      <path d="M86 16l26 24-26 24" stroke="#e2600f" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M112 16l26 24-26 24" stroke="#e2600f" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>
    </svg>
    <div class="label label--face">
      ${qrSvg(SITE)}
      <div class="label__bars"><b style="width:78%"></b><u style="width:54%"></u></div>
    </div>
    <div class="label label--face2">
      ${qrSvg(FICHE)}
      <div class="label__bars"><b style="width:70%"></b><u style="width:46%"></u></div>
    </div>
    <div class="label label--orange">
      ${qrSvg(FICHE, { dark: '#14100d', light: '#f7f3ec' })}
      <div class="label__bars"><b style="width:66%"></b><u style="width:42%"></u></div>
    </div>
    <div class="bande"></div>
  </div></body></html>`;
}

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

/**
 * Peint une page, la prend à deux fois sa taille, puis la ramène à sa dimension
 * exacte en JPEG — 24 bits, sans alpha, comme le magasin l'exige.
 */
async function capturer({ port, id, nom, largeur, hauteur, html }) {
  const fichier = join(SANDBOX, `${nom}.html`);
  writeFileSync(fichier, html, 'utf8');

  const target = await fetch(
    `http://127.0.0.1:${port}/json/new?file://${encodeURIComponent(fichier)}`,
    { method: 'PUT' },
  ).then((r) => r.json());
  const page = await connect(target.webSocketDebuggerUrl);
  await page.send('Runtime.enable');
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: largeur, height: hauteur, deviceScaleFactor: 2, mobile: false,
  });

  // Les QR Codes sont des SVG : on attend qu'ils soient tous posés.
  for (let essai = 0; essai < 60; essai += 1) {
    const pret = await page.send('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && document.querySelectorAll('svg').length >= 2",
      returnByValue: true,
    });
    if (pret?.result?.result?.value) break;
    await pause(100);
  }
  await pause(300);

  const shot = await page.send('Page.captureScreenshot', { format: 'png' });
  if (!shot?.result?.data) throw new Error(`capture vide : ${nom}`);
  const brut = join(SANDBOX, `${nom}-brut.png`);
  writeFileSync(brut, Buffer.from(shot.result.data, 'base64'));
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);

  // `sips` ramène à la dimension exacte et encode en JPEG (24 bits, sans alpha).
  const sortie = join(SORTIE, `${nom}.jpg`);
  const sips = spawnSync('sips', [
    '-z', String(hauteur), String(largeur),
    '-s', 'format', 'jpeg',
    '-s', 'formatOptions', '92',
    brut, '--out', sortie,
  ], { encoding: 'utf8' });
  if (sips.status !== 0) {
    throw new Error(`sips a échoué : ${sips.stderr || sips.stdout}`);
  }

  const mesures = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', sortie], {
    encoding: 'utf8',
  }).stdout;
  console.log(`  ${nom}.jpg — ${mesures.trim().split('\n').slice(1).map((l) => l.trim()).join(', ')}`);
}

/**
 * Supprime le bac à sable, en réessayant : Chrome relâche son profil après le
 * SIGKILL, et un `rm` immédiat tombe sur un dossier encore peuplé.
 *
 * @param {string} chemin
 */
function supprimerBac(chemin) {
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

async function main() {
  supprimerBac(SANDBOX);
  mkdirSync(SANDBOX, { recursive: true });
  mkdirSync(SORTIE, { recursive: true });

  const browser = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-crash-reporter', '--disable-dev-shm-usage',
    `--user-data-dir=${join(SANDBOX, 'profil')}`,
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

    console.log('Petite image promotionnelle (440 × 280)');
    await capturer({
      port: PORT, nom: 'promo-440x280', largeur: 440, hauteur: 280, html: pageCarte(),
    });
    console.log('Image « en haut de la page » (1400 × 560)');
    await capturer({
      port: PORT, nom: 'marquee-1400x560', largeur: 1400, hauteur: 560, html: pageMarquee(),
    });
    console.log(`\n✓ images promotionnelles écrites dans ${SORTIE.slice(ROOT.length + 1)}`);
  } finally {
    try { browser.kill('SIGKILL'); } catch { /* déjà arrêté */ }
    supprimerBac(SANDBOX);
  }
}

await main();
