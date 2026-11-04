/**
 * Capture les fenêtres de l'extension, en français et en anglais.
 *
 * La fenêtre est une page de 380 px de large, chargée ici dans un onglet (c'est
 * le même document, avec sa largeur imposée). Deux différences avec les captures
 * de l'application :
 *
 *   - on la **ramène à ses 380 × 560 px réels** — la fenêtre de la barre
 *     d'outils ne s'ouvre jamais plus large — puis on place cette image, agrandie
 *     ×1,5 et centrée, sur le fond de la page : le magasin ne réduit qu'une
 *     capture centrée, et un document de 380 px dans une image de 1280 en
 *     laisserait les trois quarts vides ;
 *   - on **verrouille le défilement** au-dessus de la liste, comme la vraie
 *     fenêtre (`max-height` 560 px), pour que le cadre montré soit exactement
 *     celui qu'elle a.
 *
 * Aucune retouche de fichier : tout se fait dans le navigateur, à partir du
 * cliché CDP.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseImportFile, toImportableLinks } from '../src/core/import.js';
import {
  ACTIVE_COLLECTION_KEY, COLLECTION_LINKS_KEY, COLLECTIONS_KEY, COLLECTIONS_VERSION,
  DEFAULT_COLLECTION_ID,
} from '../src/core/collections.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SANDBOX = join(ROOT, '.fenetre-shots');
const PROFILE = join(SANDBOX, 'profil');
const EXTENSION = join(ROOT, 'dist', 'extension');
const CAPTURES = join(ROOT, 'store', 'screenshots');
const OUT = process.env.CAPTURES_SORTIE ? resolve(ROOT, process.env.CAPTURES_SORTIE) : CAPTURES;
const PORT = 9334;
const WIDTH = 1280;
const HEIGHT = 800;
const CADRE = { largeur: 380, hauteur: 560 };
const FACTEUR = 1.5;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Retire les doublons de conflit qu'iCloud fabrique dans le dossier.
 *
 * Le dossier des captures est synchronisé, et une écriture pendant la
 * synchronisation y laisse des « nom 2.png » : le magasin n'en veut pas, et
 * `test/publication.test.js` échoue sur une capture non déclarée. Les motifs
 * sont ceux du dépôt — « X 2.ext », « ._X », « .DS_Store » — et rien d'autre
 * n'est touché.
 *
 * @returns {string[]} Les noms retirés.
 */
function retirerDoublons(dossier) {
  const retires = [];
  for (const nom of readdirSync(dossier)) {
    if (!/ \d+\.(png|jpe?g)$/i.test(nom) && !/^\._/.test(nom) && nom !== '.DS_Store') continue;
    try {
      rmSync(join(dossier, nom), { force: true });
      retires.push(nom);
    } catch {
      // Un fichier déjà parti n'est pas une erreur.
    }
  }
  if (retires.length > 0) console.log(`  doublons retirés : ${retires.join(', ')}`);
  return retires;
}


async function connect(url) {
  const ws = new WebSocket(url);
  let next = 1;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      pending.get(message.id)(message.result);
      pending.delete(message.id);
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

const evalIn = (page) => async (expression) => {
  const reponse = await page.send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true,
  });
  if (reponse?.exceptionDetails) {
    throw new Error(`${reponse.exceptionDetails.exception?.description ?? 'erreur'}\n— dans : ${String(expression).replace(/\s+/g, ' ').slice(0, 200)}`);
  }
  return reponse?.result?.value;
};

function contenu(langue) {
  // Le contenu suit la langue de la capture : la fenêtre anglaise montre des
  // collections, des titres et des tags anglais, comme l'interface.
  const nom = langue === 'en' ? 'contenu-exemple-en.json' : 'contenu-exemple.json';
  const texte = readFileSync(join(CAPTURES, nom), 'utf8');
  const { records, collection } = parseImportFile({ name: nom, text: texte });
  const { links } = toImportableLinks(records, { now: 1758400000000 });
  const stockes = links.map((lien, rang) => ({ ...lien, collectionId: DEFAULT_COLLECTION_ID, order: rang }));
  return {
    [COLLECTION_LINKS_KEY]: stockes,
    [COLLECTIONS_KEY]: {
      version: COLLECTIONS_VERSION,
      migratedAt: 1758400000000,
      items: [{
        id: DEFAULT_COLLECTION_ID,
        name: collection.name ?? '',
        note: collection.note ?? '',
        startIndex: 1,
        createdAt: 1758400000000,
      }],
    },
    [ACTIVE_COLLECTION_KEY]: { normal: DEFAULT_COLLECTION_ID, private: '' },
    locale: langue,
  };
}

async function capturer({ port, id, langue, nom }) {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?chrome-extension://${id}/popup.html`, { method: 'PUT' })
    .then((r) => r.json());
  const page = await connect(target.webSocketDebuggerUrl);
  const evaluate = evalIn(page);

  /** Attend que le document soit chargé et ses liens rendus. */
  const attendre = async () => {
    for (let essai = 0; essai < 80; essai += 1) {
      const pret = await evaluate("document.readyState === 'complete' && !!document.getElementById('list')")
        .catch(() => false);
      if (pret) return true;
      await pause(200);
    }
    return false;
  };

  // Écrit, rechargé, **puis écrit de nouveau** : le premier rechargement adopte
  // la langue du profil (celle du navigateur), le second celle qu'on vient
  // d'écrire. `Page.reload` peut aussi être fait avant que le document initial
  // ne soit prêt — d'où la réécriture juste avant le chargement qui compte.
  await attendre();
  await evaluate(`chrome.storage.local.set(${JSON.stringify(contenu(langue))}).then(() => 'écrit')`);
  await page.send('Page.reload', { ignoreCache: true });
  await attendre();
  const amorcage = await evaluate(`chrome.storage.local.set({ locale: ${JSON.stringify(langue)} }).then(() => 'langue ' + ${JSON.stringify(langue)})`);
  await page.send('Page.reload', { ignoreCache: true });
  await pause(400);
  const pret = await attendre();
  console.log(`  amorçage : ${amorcage}, document prêt : ${pret}`);

  // La page doit être **au moins aussi large que la fenêtre**, plus 200 px : une
  // page plus étroite que son contenu le fait déborder, et le cliché montrerait
  // une fenêtre tronquée par la droite.
  let largeurPage = Number(await evaluate('document.documentElement.clientWidth'));
  if (!(largeurPage >= CADRE.largeur + 200)) {
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: CADRE.largeur * 2, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
    });
    await pause(800);
    largeurPage = Number(await evaluate('document.documentElement.clientWidth'));
  }
  console.log(`  largeur de page : ${largeurPage} px`);
  if (largeurPage < CADRE.largeur) {
    throw new Error(`la page (${largeurPage} px) est plus étroite que la fenêtre (${CADRE.largeur} px)`);
  }

  // Le défilement de la page est verrouillé : le cadre de 560 px est celui de la
  // fenêtre, et la liste défile dedans comme dans la vraie fenêtre.
  const etat = await evaluate(`(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.maxHeight = '${CADRE.hauteur}px';
    document.body.style.height = '${CADRE.hauteur}px';
    return JSON.stringify({
      lang: document.documentElement.lang,
      largeur: document.documentElement.clientWidth,
      liens: document.querySelectorAll('#list .item').length,
      compteur: document.getElementById('count')?.textContent,
      collection: document.getElementById('collection-title')?.textContent,
    });
  })()`);
  console.log(`  état : ${etat}`);
  await pause(500);

  // **Le cliché de la fenêtre, à sa largeur réelle.** `setDeviceMetricsOverride`
  // change la largeur logique, et non la fenêtre du navigateur : un cliché de la
  // page entière prendrait 900 px de fond à droite de la fenêtre de 380 px.
  // `clip` cadre donc sur la fenêtre.
  const brut = await page.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: CADRE.largeur, height: CADRE.hauteur, scale: 2 },
    captureBeyondViewport: true,
  });
  if (!brut?.data) throw new Error(`capture vide : ${nom}`);
  console.log(`  cliché : ${CADRE.largeur} × ${CADRE.hauteur} px, facteur 2`);

  // **Pose réelle, sur le canevas de l'onglet.** La page ne peut pas être
  // réutilisée pour la pose : `Page.reload` conserve l'état mis en scène, et la
  // page rechargée réaffiche la fenêtre au lieu de l'image posée. On ouvre donc
  // une page ordinaire de la même origine, on y dessine — cliché de la fenêtre
  // agrandi ×1,5, centré, sur le fond de la page — et c'est **cette** page qui
  // est clichée. Rien n'est retouché après le navigateur.
  const poseur = await fetch(
    `http://127.0.0.1:${port}/json/new?chrome-extension://${id}/popup.html`,
    { method: 'PUT' },
  ).then((r) => r.json());
  const posePage = await connect(poseur.webSocketDebuggerUrl);
  const evalPose = evalIn(posePage);
  for (let essai = 0; essai < 40; essai += 1) {
    const ok = await evalPose("document.readyState === 'complete'").catch(() => false);
    if (ok) break;
    await pause(200);
  }
  await posePage.send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
  });
  await pause(400);
  const pose = await evalPose(`(async () => {
    const image = new Image();
    await new Promise((r) => { image.onload = r; image.onerror = r; image.src = 'data:image/png;base64,${brut.data}'; });
    if (!image.width) return 'image illisible';
    const largeur = Math.round(image.width / 2 * ${FACTEUR});
    const hauteur = Math.round(image.height / 2 * ${FACTEUR});
    document.body.style.cssText = 'margin:0 !important;width:' + ${WIDTH} + 'px !important;'
      + 'height:' + ${HEIGHT} + 'px !important;display:grid !important;place-items:center !important;'
      + 'max-height:none !important;overflow:hidden !important;background:#f4f2ef !important;';
    document.body.textContent = '';
    document.documentElement.style.overflow = 'hidden';
    const cadre = document.createElement('div');
    cadre.style.cssText = 'width:' + largeur + 'px;height:' + hauteur + 'px;overflow:hidden;'
      + 'box-shadow:0 18px 50px rgba(0,0,0,.22);border-radius:10px;background:#fff;';
    const img = document.createElement('img');
    img.src = image.src;
    img.style.cssText = 'width:' + largeur + 'px;height:' + hauteur + 'px;display:block;';
    cadre.appendChild(img);
    document.body.appendChild(cadre);
    return 'fenêtre ' + largeur + ' × ' + hauteur + ' px';
  })()`);
  const mesure = await evalPose(`(() => JSON.stringify({
    page: document.documentElement.clientWidth + 'x' + document.documentElement.clientHeight,
    langue: document.documentElement.lang,
  }))()`);
  console.log(`  pose : ${pose} · ${mesure}`);
  await pause(500);

  const final = await posePage.send('Page.captureScreenshot', { format: 'png' });
  if (!final?.data) throw new Error(`capture finale vide : ${nom}`);
  mkdirSync(OUT, { recursive: true });
  retirerDoublons(OUT);
  writeFileSync(join(OUT, nom), Buffer.from(final.data, 'base64'));
  console.log(`  ✓ ${nom}`);
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  await fetch(`http://127.0.0.1:${port}/json/close/${poseur.id}`);
}

async function main() {
  mkdirSync(PROFILE, { recursive: true });
  const browser = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-crash-reporter', '--disable-dev-shm-usage',
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`,
    '--window-size=240,240', '--window-position=-3000,-3000', 'about:blank',
  ], { stdio: 'ignore' });

  try {
    let version = null;
    for (let essai = 0; essai < 80 && !version; essai += 1) {
      version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null);
      if (!version) await pause(250);
    }
    if (!version) throw new Error('Chrome ne répond pas sur le port de débogage');
    const control = await connect(version.webSocketDebuggerUrl);
    const chargement = await control.send('Extensions.loadUnpacked', { path: EXTENSION });
    const id = chargement?.id;
    if (!id) throw new Error(`chargement impossible : ${JSON.stringify(chargement)}`);
    console.log(`Extension ${id}\n`);

    for (const langue of ['fr', 'en']) {
      const nom = `01-fenetre-popup-${langue}.png`;
      console.log(nom);
      await capturer({ port: PORT, id, langue, nom });
    }
    console.log(`\n✓ fenêtres écrites dans ${OUT.slice(ROOT.length + 1)}`);
  } finally {
    try { browser.kill('SIGKILL'); } catch { /* déjà arrêté */ }
    rmSync(SANDBOX, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
}

await main();
