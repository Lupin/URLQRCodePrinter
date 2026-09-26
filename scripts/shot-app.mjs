/**
 * Capture d'écran de travail de l'application embarquée.
 *
 * Sert à **regarder** ce que l'interface donne avant de la juger : les écarts
 * verticaux d'un panneau ne se lisent pas dans une feuille de style, ils se
 * voient. Le script ne remplace pas `verify-chrome.mjs`, qui porte les
 * vérifications ; il produit des images pour l'œil.
 *
 * Usage : node scripts/shot-app.mjs [largeur] [dossier]
 */

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONSENT_KEY, DISCLOSURE_VERSION } from '../src/core/privacy.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION = join(ROOT, 'dist', 'extension');
const PROFILE = join(ROOT, '.verify-chrome', 'profile-shot');
const PORT = 9353;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const LARGEUR = Number(process.argv[2] ?? 1280);
const DOSSIER = resolve(process.argv[3] ?? join(ROOT, '.verify-chrome-captures'));
const HAUTEUR = 900;

/** Connexion au protocole de débogage, réduite à ce dont ce script a besoin. */
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

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  rmSync(PROFILE, { recursive: true, force: true });
  mkdirSync(DOSSIER, { recursive: true });

  const browser = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`,
    `--window-size=${LARGEUR},${HAUTEUR}`, '--window-position=-3000,-3000',
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
    const { id: extensionId } = await control.call('Extensions.loadUnpacked', { path: EXTENSION });

    const cible = await fetch(
      `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`chrome-extension://${extensionId}/app.html`)}`,
      { method: 'PUT' },
    ).then((r) => r.json());
    const session = await connect(cible.webSocketDebuggerUrl);
    await session.call('Runtime.enable');
    await session.call('Page.enable');
    await session.call('Emulation.setDeviceMetricsOverride', {
      width: LARGEUR, height: HAUTEUR, deviceScaleFactor: 2, mobile: false,
    });
    await pause(1200);

    const evaluate = async (expression) => {
      const response = await session.call('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (response.exceptionDetails) {
        throw new Error(response.exceptionDetails.exception?.description ?? 'erreur');
      }
      return response.result?.value;
    };

    await evaluate(`new Promise((resolve) => chrome.storage.local.set({
      '${CONSENT_KEY}': { version: ${DISCLOSURE_VERSION}, decision: 'accepted', at: Date.now() },
    }, resolve))`);

    // Une collection réaliste : c'est la densité de la liste qui décide de la
    // place que le panneau laisse au reste.
    await evaluate(`new Promise((resolve) => chrome.storage.local.set({ links: [
      { id: 'a', url: 'https://exemple.fr/un-article-assez-long-pour-compter', title: 'Un article de fond sur la question', tags: ['lecture'], createdAt: Date.now() - 90000000 },
      { id: 'b', url: 'https://exemple.fr/article-deux', title: 'Un second article', tags: [], createdAt: Date.now() - 80000000 },
      { id: 'c', url: 'https://exemple.fr/trois', title: 'Le troisième, avec un titre qui dépasse', tags: ['maison'], createdAt: Date.now() - 70000000 },
      { id: 'd', url: 'https://exemple.fr/quatre', title: 'Quatrième', tags: [], createdAt: Date.now() - 60000000 }
    ] }, resolve))`);

    await session.call('Page.reload');
    await pause(2500);

    const nom = join(DOSSIER, `app-${LARGEUR}.png`);
    const capture = await session.call('Page.captureScreenshot', { format: 'png' });
    writeFileSync(nom, Buffer.from(capture.data, 'base64'));

    // Les écarts verticaux, mesurés plutôt qu'estimés : ce que l'œil trouve
    // « trop bas » a une valeur en pixels, et une valeur se discute.
    const ecarts = await evaluate(`(() => {
      const panneau = document.querySelector('section[aria-labelledby="collection-title"]');
      const enfants = [...panneau.children].filter((n) => n.tagName !== 'H2');
      const boites = enfants.map((n) => {
        const r = n.getBoundingClientRect();
        return {
          quoi: n.id || n.className || n.tagName,
          haut: Math.round(r.top),
          bas: Math.round(r.bottom),
        };
      });
      const trous = [];
      for (let i = 1; i < boites.length; i += 1) {
        trous.push({ entre: boites[i - 1].quoi + ' → ' + boites[i].quoi,
                     vide: boites[i].haut - boites[i - 1].bas });
      }
      return { boites, trous, hauteurPanneau: Math.round(panneau.getBoundingClientRect().height) };
    })()`);

    console.log(nom);
    console.log(JSON.stringify(ecarts, null, 2));

    // Le mode rangement, ouvert : c'est la disposition des commandes qu'on veut
    // voir, et elle ne se juge pas sur une capture au repos.
    await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      document.getElementById('reorder')?.click();
      await pause(600);
      return true;
    })()`);
    const nomRange = join(DOSSIER, `app-${LARGEUR}-rangement.png`);
    const captureRange = await session.call('Page.captureScreenshot', { format: 'png' });
    writeFileSync(nomRange, Buffer.from(captureRange.data, 'base64'));
    console.log(nomRange);

    const ligne = await evaluate(`(() => {
      const premier = document.querySelector('#list .link');
      return {
        enfants: [...(premier?.children ?? [])].map((n) => n.className),
        commandes: document.querySelectorAll('#list .link__move').length,
        poignees: document.querySelectorAll('#list .link__grip').length,
        libelle: document.getElementById('reorder')?.textContent.trim(),
      };
    })()`);
    console.log(JSON.stringify(ligne, null, 2));

    await evaluate(`(() => { document.getElementById('reorder')?.click(); return true; })()`);

    // La hauteur des champs : `.field` porte un `flex-basis` de 160 px, pensé
    // pour une **rangée** — dans une colonne, cette base devient une hauteur, et
    // chaque champ s'étire en laissant un vide sous son libellé.
    const champs = await evaluate(`(() => {
      const mesure = (racine, selecteur) => [...document.querySelectorAll(selecteur)].map((champ) => {
        const r = champ.getBoundingClientRect();
        const dernier = champ.lastElementChild?.getBoundingClientRect();
        return {
          conteneur: racine,
          quoi: champ.querySelector('.field__label')?.textContent.trim().slice(0, 34)
            ?? champ.textContent.trim().slice(0, 34),
          hauteur: Math.round(r.height),
          videSousLeContenu: dernier ? Math.round(r.bottom - dernier.bottom) : null,
        };
      });
      return [
        ...mesure('panneau collection', 'section[aria-labelledby="collection-title"] > .field'),
        ...mesure('panneau mise en forme', 'section[aria-labelledby="layout-title"] > .field'),
        ...mesure('rangée .fields', '.fields > .field'),
        ...mesure('rangée raccourcis', '.shortener__row > .field'),
        ...mesure('mode', '.mode > .field'),
      ];
    })()`);
    console.log(JSON.stringify(champs, null, 2));

    // L'en-tête imprimé : c'est là que la note de collection atterrit, et c'est
    // la distance entre le nom et la note qui se juge à l'œil.
    const enTete = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const nombre = (id, valeur) => {
        const n = document.getElementById(id);
        n.value = valeur;
        n.dispatchEvent(new Event('input', { bubbles: true }));
        n.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const poser = (id, valeur) => {
        const n = document.getElementById(id);
        n.checked = valeur;
        n.dispatchEvent(new Event('change', { bubbles: true }));
      };
      nombre('collection-note', 'Pour le rangement du garage, à relire avant l\\u2019hiver.');
      nombre('sheet-margin-y', '15');
      poser('sheet-header', true);
      await pause(1200);
      const page = document.querySelector('#preview .print-page');
      const titre = document.querySelector('#preview .print-page__title');
      const note = document.querySelector('#preview .print-page__note');
      if (!page || !titre || !note) return null;
      const boite = (n) => n.getBoundingClientRect();
      return {
        page: boite(page).top,
        titre: boite(titre),
        note: boite(note),
        cellules: [...document.querySelectorAll('#preview .print-cell')]
          .slice(0, 2).map((c) => boite(c).top),
        tailleTitre: getComputedStyle(titre).fontSize,
        tailleNote: getComputedStyle(note).fontSize,
      };
    })()`);
    console.log(JSON.stringify(enTete, null, 2));

    const zone = await evaluate(`(() => {
      const page = document.querySelector('#preview .print-page');
      if (!page) return null;
      const r = page.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
    })()`);
    if (zone) {
      const nomEnTete = join(DOSSIER, `en-tete-${LARGEUR}.png`);
      const image = await session.call('Page.captureScreenshot', {
        format: 'png',
        clip: { ...zone, scale: 2 },
      });
      writeFileSync(nomEnTete, Buffer.from(image.data, 'base64'));
      console.log(nomEnTete);
    }
  } finally {
    browser.kill('SIGKILL');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
