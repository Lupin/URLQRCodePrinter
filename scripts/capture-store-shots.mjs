/**
 * Produit les captures d'écran de la fiche Chrome Web Store.
 *
 * Le navigateur est lancé **avec fenêtre**, hors écran, et piloté par CDP —
 * exactement comme `verify-brave.mjs`. Deux raisons, apprises à la dure :
 *
 *   - `--headless --screenshot` ne rend pas la main dans cet environnement ;
 *   - le bac à sable interne de Brave y échoue à s'initialiser, d'où
 *     `--no-sandbox`. Le contenu rendu est local et nous appartient.
 *
 * Le profil vit dans `.store-shots/`, effacé au démarrage : jamais celui de
 * l'utilisateur.
 *
 * Les dimensions sont posées par `Emulation.setDeviceMetricsOverride`, et non
 * par la taille de la fenêtre : la capture fait alors exactement 1280 × 800.
 *
 * L'amorçage du stockage se fait **depuis la page**, pas depuis le service
 * worker : une écriture tentée dans ce dernier restait sans effet alors que la
 * lecture fonctionnait, et la capture montrait une collection vide.
 *
 * Ce que ce script **ne peut pas** produire : une capture de la fenêtre de
 * l'extension ouverte **par-dessus une page**. Ouvrir la vraie fenêtre relève de
 * l'interface du navigateur, pas du contenu web ; la reconstituer serait une
 * maquette, alors que la documentation du magasin demande l'expérience réelle.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRAVE = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const SANDBOX = join(ROOT, '.store-shots');
const PROFILE = join(SANDBOX, 'profil');
const EXTENSION = join(ROOT, 'dist', 'extension');
const OUT = join(ROOT, 'store', 'screenshots');
const PORT = 9333;

const WIDTH = 1280;
const HEIGHT = 800;

/** Attend qu'une condition soit vraie, ou abandonne. */
async function waitFor(check, { timeout = 30000, interval = 250, label = 'condition' } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Délai dépassé en attendant : ${label}`);
}

/** Ouvre une session DevTools. */
async function connect(url) {
  const ws = new WebSocket(url);
  let next = 1;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  await new Promise((r) => ws.addEventListener('open', r));

  const send = (method, params) =>
    new Promise((res) => {
      const id = next++;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });

  return { send };
}

/** Décrit la réponse d'une évaluation, succès comme échec. */
function describe(response) {
  const value = response?.result?.result?.value;
  if (value !== undefined) return String(value);
  const error = response?.result?.exceptionDetails?.exception?.description;
  return error ? `exception — ${error.split('\n')[0]}` : 'sans réponse';
}

/**
 * Exemples de liens.
 *
 * Une liste vide donnerait une capture sans intérêt : la fiche doit montrer
 * l'outil peuplé. Les adresses sont réelles et l'usage est cohérent avec le
 * produit — collecter des liens pour les étiqueter.
 */
const SAMPLE_LINKS = [
  ['ech-1', 'https://fr.wikipedia.org/wiki/Code_QR', 'Code QR — Wikipédia'],
  ['ech-2', 'https://developer.mozilla.org/fr/docs/Web/API/Web_Bluetooth_API', 'Web Bluetooth API — MDN'],
  ['ech-3', 'https://github.com/Lupin/URLQRCodePrinter', 'URLQRCodePrinter — dépôt GitHub'],
  ['ech-4', 'https://www.niimbot.com/', 'Niimbot — imprimantes d etiquettes'],
].map(([id, url, title], index) => {
  // Forme **complète**, telle que `createLink` la produit. Des enregistrements
  // partiels suffisent à faire afficher le compteur, mais pas à faire rendre la
  // liste : le rendu s'interrompt en route sur un champ absent, et la capture
  // montre une collection vide sans que rien ne le signale.
  const at = 1758400000000 + index * 3600000;
  return {
    id,
    url,
    title,
    note: '',
    tags: [],
    createdAt: at,
    updatedAt: at,
    source: 'context-menu',
    favicon: '',
    shortUrl: '',
    shortProvider: '',
    shortenedAt: 0,
  };
});

/** Amorce le stockage, depuis la page — c'est là que l'application écrit. */
const SEED = `chrome.storage.local.set({ links: ${JSON.stringify(SAMPLE_LINKS)}, locale: 'fr' })
  .then(() => 'écrit, ${SAMPLE_LINKS.length} liens et la langue fr')
  .catch((e) => 'ÉCHEC : ' + (e && e.message ? e.message : String(e)))`;

/**
 * Enregistre une capture d'une page de l'extension.
 *
 * @param {{ port: number, id: string, file: string, name: string,
 *           before?: string, seed?: boolean }} shot
 */
async function capture({ port, id, file, name, before, seed }) {
  const target = await fetch(
    `http://127.0.0.1:${port}/json/new?chrome-extension://${id}/${file}`,
    { method: 'PUT' },
  ).then((r) => r.json());

  const page = await connect(target.webSocketDebuggerUrl);
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 1000));

  if (seed) {
    const written = await page.send('Runtime.evaluate', {
      expression: SEED, awaitPromise: true, returnByValue: true,
    });
    console.log(`  amorçage : ${describe(written)}`);
    await page.send('Page.reload', {});
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (before) {
    const applied = await page.send('Runtime.evaluate', {
      expression: before, awaitPromise: true, returnByValue: true,
    });
    console.log(`  mise en scène : ${describe(applied)}`);
    await new Promise((r) => setTimeout(r, 700));
  }

  // Ce que le DOM contient réellement. Une capture peut montrer une liste vide
  // alors que le compteur annonce des liens : sans cette mesure, on accuserait
  // la mise en page au lieu du chargement.
  const dom = await page.send('Runtime.evaluate', {
    expression: `(() => {
      const liste = document.getElementById('list');
      return JSON.stringify({
        enfants: liste ? liste.children.length : -1,
        hauteur: liste ? Math.round(liste.getBoundingClientRect().height) : -1,
        premier: liste?.firstElementChild?.textContent?.trim().slice(0, 48) ?? null,
        compteur: document.getElementById('count')?.textContent ?? null,
      });
    })()`,
    returnByValue: true,
  });
  console.log(`  rendu : ${describe(dom)}`);

  const shot = await page.send('Page.captureScreenshot', { format: 'png' });
  if (!shot?.result?.data) throw new Error(`Capture vide pour ${name}`);

  writeFileSync(join(OUT, name), Buffer.from(shot.result.data, 'base64'));
  console.log(`  ✓ ${name}  ${WIDTH}×${HEIGHT}`);
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
}

/** Point d'entrée. */
async function main() {
  rmSync(SANDBOX, { recursive: true, force: true });
  mkdirSync(PROFILE, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  const browser = spawn(BRAVE, [
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-crash-reporter',
    `--user-data-dir=${PROFILE}`,
    `--disable-extensions-except=${EXTENSION}`,
    `--load-extension=${EXTENSION}`,
    `--remote-debugging-port=${PORT}`,
    '--window-size=240,240',
    '--window-position=-3000,-3000',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    // L'identifiant de l'extension se lit dans l'URL de son service worker.
    const worker = await waitFor(async () => {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`)
        .then((r) => r.json()).catch(() => null);
      return list?.find((t) => (t.url || '').includes('/background.js')) ?? null;
    }, { label: 'le service worker de l\'extension' });

    const id = new URL(worker.url).hostname;
    console.log(`Extension ${id}\n`);

    await capture({
      port: PORT, id, file: 'app.html', name: '02-application-fr.png', seed: true,
    });
    await capture({
      port: PORT, id, file: 'app.html', name: '03-impression-niimbot-fr.png',
      before: `(async () => {
        const onglet = [...document.querySelectorAll('button')]
          .find((b) => b.textContent.includes('Niimbot'));
        if (onglet) onglet.click();
        await new Promise((r) => setTimeout(r, 400));
        window.scrollTo(0, 0);
        return onglet ? 'onglet Niimbot ouvert' : 'onglet Niimbot introuvable';
      })()`,
    });
    await capture({
      port: PORT, id, file: 'privacy.html', name: '04-mention-confidentialite-fr.png',
    });

    console.log(`\n✓ captures écrites dans ${OUT.slice(ROOT.length + 1)}`);
  } finally {
    try {
      browser.kill('SIGKILL');
    } catch {
      // Déjà arrêté.
    }
    rmSync(SANDBOX, { recursive: true, force: true });
  }
}

await main();
