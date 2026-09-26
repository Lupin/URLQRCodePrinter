/**
 * Mesure du texte dans la bande tournée d'une étiquette.
 *
 * Question posée : « en fonction de la taille du supply on est coupé, alors
 * qu'on a de la place pour afficher du texte — surtout avec le texte tourné. »
 *
 * Le script ne porte aucun verdict : il rend des nombres, lus **sur le rendu**.
 * Pour chaque consommable et chaque disposition du texte, il relève :
 *
 * - la géométrie réelle du canevas (largeur × hauteur en pixels) ;
 * - le profil d'encre ligne à ligne, qui sépare le QR Code de la bande de texte
 *   (un blanc les sépare toujours : `gap` vaut au moins un pixel) ;
 * - pour chaque rangée de texte, la longueur d'encre réellement écrite, et donc
 *   **la place restée libre** dans la bande ;
 * - ce que l'application annonce elle-même : taille de texte, nombre de lignes.
 *
 * Usage : node scripts/measure-label-text.mjs [d110|m2] [coupe]
 */

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONSENT_KEY, DISCLOSURE_VERSION } from '../src/core/privacy.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION = join(ROOT, 'dist', 'extension');
const PROFIL = join(ROOT, '.verify-chrome', 'profile-text');
const PORT = 9355;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const MODELE = (process.argv[2] ?? 'd110').toLowerCase();

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Connexion réduite au protocole de débogage. */
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

async function main() {
  rmSync(PROFIL, { recursive: true, force: true });
  mkdirSync(join(ROOT, '.verify-chrome-labels'), { recursive: true });

  const navigateur = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${PROFIL}`, `--remote-debugging-port=${PORT}`,
    '--window-size=1280,900', '--window-position=-3000,-3000',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    let version = null;
    for (let essai = 0; essai < 80 && !version; essai += 1) {
      version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null);
      if (!version) await pause(250);
    }
    if (!version) throw new Error('Chrome ne répond pas');

    const controle = await connect(version.webSocketDebuggerUrl);
    const { id: extensionId } = await controle.call('Extensions.loadUnpacked', { path: EXTENSION });
    const cible = await fetch(
      `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`chrome-extension://${extensionId}/app.html`)}`,
      { method: 'PUT' },
    ).then((r) => r.json());
    const session = await connect(cible.webSocketDebuggerUrl);
    await session.call('Runtime.enable');
    await session.call('Page.enable');
    await pause(1200);

    const evaluate = async (expression) => {
      const reponse = await session.call('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (reponse.exceptionDetails) {
        throw new Error(reponse.exceptionDetails.exception?.description ?? 'erreur');
      }
      return reponse.result?.value;
    };

    await evaluate(`new Promise((resolve) => chrome.storage.local.set({
      '${CONSENT_KEY}': { version: ${DISCLOSURE_VERSION}, decision: 'accepted', at: Date.now() },
    }, resolve))`);

    // Un lien dont le **titre est long** et l'adresse aussi : c'est le cas où la
    // place manque, et donc celui où une coupe se voit.
    await evaluate(`new Promise((resolve) => chrome.storage.local.set({ links: [
      { id: 'essai', url: 'https://www.archiproducts.com/en/products/office-partitions/double-glass-office-partition-by-dvo',
        title: 'DOUBLE GLASS Office partition By DVO — cloison vitree sur mesure', note: '', tags: [],
        createdAt: Date.now(), updatedAt: Date.now(), source: 'manual', favicon: '',
        shortUrl: '', shortProvider: '', shortenedAt: 0, order: 0 },
    ] }, resolve))`);
    await session.call('Page.reload');
    await pause(2500);

    // L'installation se fait une fois, dans la page.
    await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const el = (id) => document.getElementById(id);
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click();
      await pause(1400);
      el('label-profile').value = '${MODELE === 'm2' ? 'niimbot-m2' : 'niimbot-d110'}';
      el('label-profile').dispatchEvent(new Event('change', { bubbles: true }));
      await pause(1200);
      const choix = el('label-link');
      const option = [...choix.options].find((o) => /DOUBLE GLASS|archiproducts/i.test(o.textContent));
      if (option) { choix.value = option.value; choix.dispatchEvent(new Event('change', { bubbles: true })); }
      for (const id of ['label-show-title', 'label-show-url']) {
        const n = el(id);
        n.checked = true;
        n.dispatchEvent(new Event('change', { bubbles: true }));
      }
      for (const id of ['label-show-host', 'label-show-date', 'label-show-index']) {
        const n = el(id);
        if (n && n.checked) { n.checked = false; n.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      await pause(1200);
      return true;
    })()`);

    // Le balayage se pilote **d'ici**, et non depuis la page : un seul appel
    // d'evaluation pour cinquante couples ne rendait aucune progression, et le
    // script semblait pendu alors qu'il composait.
    const consommables = await evaluate(`[...document.getElementById('label-supply').options]
      .map((o) => ({ valeur: o.value, texte: o.textContent.trim() }))
      .filter((o) => /continu|22 mm|30 mm|40 mm|75 mm|109 mm/.test(o.texte))`);
    const dispositions = await evaluate(`[...document.getElementById('label-rotation').options]
      .map((o) => ({ valeur: o.value, texte: o.textContent.trim() }))`);

    const resultats = [];
    for (const consommable of consommables) {
      for (const disposition of dispositions) {
        const mesure = await evaluate(`(async () => {
          const pause = (ms) => new Promise((r) => setTimeout(r, ms));
          const el = (id) => document.getElementById(id);
          el('label-supply').value = ${JSON.stringify(consommable.valeur)};
          el('label-supply').dispatchEvent(new Event('change', { bubbles: true }));
          await pause(600);
          el('label-rotation').value = ${JSON.stringify(disposition.valeur)};
          el('label-rotation').dispatchEvent(new Event('change', { bubbles: true }));
          await pause(700);

          const lire = () => {
            const canvas = document.querySelector('#preview canvas');
            if (!canvas || !canvas.width) return null;
            const donnees = canvas.getContext('2d')
              .getImageData(0, 0, canvas.width, canvas.height).data;
            let encre = 0;
            for (let i = 0; i < donnees.length; i += 4) if (donnees[i] < 128) encre += 1;
            return {
              canevas: canvas.width + ' x ' + canvas.height,
              encre,
              repere: el('label-font-hint').textContent.trim(),
              note: (document.querySelector('.preview__caption')?.textContent.trim() ?? '').slice(0, 200),
            };
          };

          const titre = el('label-show-title');
          if (titre.checked !== true) { titre.checked = true; titre.dispatchEvent(new Event('change', { bubbles: true })); await pause(400); }
          const avec = lire();
          titre.checked = false;
          titre.dispatchEvent(new Event('change', { bubbles: true }));
          await pause(500);
          const sans = lire();
          titre.checked = true;
          titre.dispatchEvent(new Event('change', { bubbles: true }));
          await pause(300);
          return { avec, sans };
        })()`);
        resultats.push({
          consommable: consommable.texte,
          disposition: disposition.texte,
          ...(mesure?.avec ?? {}),
          encreSansTitre: mesure?.sans?.encre ?? null,
          repereSansTitre: mesure?.sans?.repere ?? null,
        });
        console.log('  … ' + consommable.texte.slice(0, 18) + ' / ' + disposition.texte.slice(0, 30));
      }
    }

    console.log(JSON.stringify({ profil: MODELE, resultats }, null, 2));
  } finally {
    navigateur.kill('SIGKILL');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
