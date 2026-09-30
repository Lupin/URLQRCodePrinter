/**
 * Capture d'écran de travail du choix d'import.
 *
 * Même rôle que `shot-app.mjs` — **regarder** une interface avant de la juger —
 * pour un écran qui ne s'ouvre qu'après un import. Le panneau de choix nomme les
 * collections et annonce ce que le fichier porte : rien de tout cela ne se lit
 * dans une feuille de style, et le substitut de DOM des tests ne peint rien.
 *
 * Le script ouvre l'application **construite** dans un vrai Chrome et lui donne
 * une API d'extension en mémoire : c'est ce qui fait exister plusieurs
 * collections, donc un choix à proposer. L'import lui-même passe par le vrai
 * champ de fichier — `DataTransfer` est ce qui permet de poser des fichiers sans
 * boîte de dialogue —, si bien que tout le chemin est parcouru : lecture du
 * fichier, panneau, libellés, et le nom vidé qui suit.
 *
 * Ce qu'il ne fait pas : il n'ouvre pas la page de l'extension, et ne clique
 * aucun des trois choix — cela écrirait dans le stockage, et les tests s'en
 * chargent (`test/web-import.test.js`, exécuté pour de bon).
 *
 * Usage : node scripts/shot-import.mjs
 */

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { serve } from './serve.mjs';
import { toJson } from '../src/core/exporters.js';
import { createLink } from '../src/core/link.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE = join(ROOT, '.verify-chrome', 'profile-import');
const CAPTURES = join(ROOT, '.verify-chrome-captures');
const PORT = 9355;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Attend qu'une condition soit vraie, ou abandonne en la nommant. */
async function waitFor(check, { timeout = 20000, interval = 200, label = 'condition' } = {}) {
  const limite = Date.now() + timeout;
  while (Date.now() < limite) {
    const valeur = await check().catch(() => null);
    if (valeur) return valeur;
    await pause(interval);
  }
  throw new Error(`délai dépassé en attendant : ${label}`);
}

/** Session DevTools réduite à ce dont ce script a besoin. */
async function connect(url) {
  const socket = new WebSocket(url);
  let suite = 0;
  const enAttente = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const pending = enAttente.get(message.id);
    if (!pending) return;
    enAttente.delete(message.id);
    if (message.error) pending.reject(new Error(message.error.message));
    else pending.resolve(message.result ?? {});
  });
  await new Promise((ok, ko) => {
    socket.addEventListener('open', ok);
    socket.addEventListener('error', ko);
  });
  const call = (method, params = {}) => new Promise((ok, ko) => {
    suite += 1;
    enAttente.set(suite, { resolve: ok, reject: ko });
    socket.send(JSON.stringify({ id: suite, method, params }));
  });
  return { socket, call };
}

/**
 * L'API d'extension en mémoire, posée **avant** le premier script de la page.
 *
 * L'application décide au démarrage si elle a des collections : sans
 * `runtime.id`, elle n'en a qu'une, et le choix de rangement n'a plus qu'une
 * issue possible. Le substitut est donc posé avant `app.js`, et non après.
 */
const STUB = `
(() => {
  const zone = (initial) => {
    const data = { ...initial };
    return {
      async get(keys) {
        if (typeof keys === 'string') return { [keys]: data[keys] };
        if (Array.isArray(keys)) return Object.fromEntries(keys.map((k) => [k, data[k]]));
        return { ...data };
      },
      async set(patch) { Object.assign(data, patch); },
      async remove(keys) { for (const key of [].concat(keys)) delete data[key]; },
    };
  };

  window.chrome = {
    runtime: { id: 'capture', getURL: (chemin) => chemin, lastError: null },
    storage: {
      local: zone({
        'url-qr-code-printer/collections': {
          version: 1,
          migratedAt: 1,
          items: [
            { id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 },
            { id: 'veille', name: 'Veille', note: 'mes lectures', startIndex: 1, createdAt: 20 },
          ],
        },
        'url-qr-code-printer/active-collection': { normal: 'default', private: '' },
        links: [],
      }),
      session: zone({}),
    },
    tabs: { create() {}, query() {} },
  };
})();
`;

async function main() {
  rmSync(PROFILE, { recursive: true, force: true });
  mkdirSync(PROFILE, { recursive: true });
  mkdirSync(CAPTURES, { recursive: true });

  const { url, close } = await serve({ port: 0 });

  const browser = spawn(CHROME, [
    // `--no-sandbox` : le bac à sable du système refuse à Chrome le sien
    // (« sandbox initialization failed »), et aucun moteur de rendu ne démarre
    // sans lui. Même drapeau que `shot-app.mjs`.
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-crash-reporter', '--disable-dev-shm-usage',
    `--crash-dumps-dir=${join(ROOT, '.verify-chrome', 'crash')}`,
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`,
    '--window-size=1400,1200', '--window-position=-3000,-3000',
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

    const control = await connect(version.webSocketDebuggerUrl);
    const { targetId } = await control.call('Target.createTarget', { url: 'about:blank' });
    const cible = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json())
      .then((liste) => liste.find((entree) => entree.id === targetId));

    const session = await connect(cible.webSocketDebuggerUrl);
    await session.call('Page.enable');
    await session.call('Runtime.enable');
    await session.call('Page.addScriptToEvaluateOnNewDocument', { source: STUB });
    await session.call('Page.navigate', { url });

    const evaluate = async (expression) => {
      const response = await session.call('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (response.exceptionDetails) {
        throw new Error(response.exceptionDetails.exception?.description ?? 'erreur');
      }
      return response.result?.value;
    };

    await waitFor(
      () => evaluate('document.readyState === "complete"'),
      { label: 'le chargement de la page' },
    );

    // Un nom de collection long, mis à dessein : c'est la longueur des libellés
    // qui décide si les trois issues tiennent dans le panneau.
    await evaluate(`(() => {
      const champ = document.getElementById('collection-name');
      champ.value = 'Veille sur les longues lectures du week-end';
      champ.dispatchEvent(new Event('input', { bubbles: true }));
      champ.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    await pause(400);

    // Un vrai import, par le vrai champ de fichier.
    const archive = toJson(
      [
        createLink({ url: 'https://exemple.fr/premier', title: 'Premier article' }, { now: 1 }),
        createLink({ url: 'https://exemple.fr/second', title: 'Second article' }, { now: 2 }),
        createLink({ url: 'https://exemple.fr/troisieme', title: 'Troisième article' }, { now: 3 }),
      ],
      { title: 'Veille tech', note: 'à relire' },
    );

    await evaluate(`(() => {
      const champ = document.getElementById('import-file');
      const transfert = new DataTransfer();
      transfert.items.add(new File(
        [${JSON.stringify(archive)}],
        'liens-qr-20260930-1830.json',
        { type: 'application/json' },
      ));
      champ.files = transfert.files;
      champ.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);

    await waitFor(
      () => evaluate('!document.getElementById("import-menu").hidden'),
      { label: 'l\'ouverture du panneau de choix' },
    );

    // Ce que l'écran dit, relevé tel quel : c'est ce qu'un utilisateur lit. Le
    // débordement est mesuré plutôt qu'estimé — un libellé long qui sortirait du
    // panneau ne se verrait pas autrement.
    const releve = await evaluate(`JSON.stringify({
      titre: document.getElementById('import-menu-title').textContent,
      aide: document.getElementById('import-menu-hint').textContent,
      fusionner: document.getElementById('import-merge').textContent,
      remplacer: document.getElementById('import-replace').textContent,
      nouvelle: document.getElementById('import-add').textContent,
      annuler: document.getElementById('import-cancel').textContent,
      debordement: (() => {
        const panneau = document.getElementById('import-menu');
        const boite = panneau.getBoundingClientRect();
        return [...panneau.querySelectorAll('button')]
          .filter((b) => {
            const r = b.getBoundingClientRect();
            return r.right > boite.right + 1 || r.left < boite.left - 1;
          })
          .map((b) => b.textContent);
      })(),
    }, null, 2)`);
    console.log(releve);

    let capture = await session.call('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    const fichier = join(CAPTURES, 'panneau-import.png');
    writeFileSync(fichier, Buffer.from(capture.data, 'base64'));

    // Le nom vidé, tel que l'écran le dit : le champ vide, la liste au libellé
    // intégré, et l'aide qui explique ce que ce vide veut dire. C'est le défaut
    // que ce panneau accompagne, et il se voit mieux qu'il ne se raconte.
    await evaluate(`(() => {
      document.getElementById('import-cancel').click();
      const champ = document.getElementById('collection-name');
      champ.value = '';
      champ.dispatchEvent(new Event('input', { bubbles: true }));
      champ.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    await pause(500);

    console.log(await evaluate(`JSON.stringify({
      champ: document.getElementById('collection-name').value,
      liste: [...document.getElementById('collection-select').options].map((o) => o.textContent),
      aide: document.getElementById('collection-hint').textContent,
      titre: document.title,
    }, null, 2)`));

    capture = await session.call('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    const fichierVide = join(CAPTURES, 'panneau-import-nom-vide.png');
    writeFileSync(fichierVide, Buffer.from(capture.data, 'base64'));

    console.log(`\ncaptures : ${fichier}\n           ${fichierVide}`);
  } finally {
    browser.kill('SIGKILL');
    await close();
  }
}

await main();
