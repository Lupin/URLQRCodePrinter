/**
 * Éprouve l'ajout par clic droit, de bout en bout, dans Chrome.
 *
 * Le service worker n'est pas « cliquable » : aucune API n'ouvre puis ne choisit
 * une entrée du menu natif. Le script exécute donc **ses propres modules** dans
 * la page de l'extension — `captureFromClick`, le magasin, la normalisation —,
 * écrit le résultat exactement comme lui, recharge l'application, et lit la ligne
 * obtenue. C'est le chemin complet, à l'API du menu contextuel près, et c'est ce
 * qui a établi le défaut qu'il surveille désormais.
 *
 * Le défaut, rapporté tel quel : un clic droit sur un résultat Google
 * enregistrait l'**enveloppe** du moteur (`google.com/url?q=…`) au lieu de la
 * page visée. Le compteur de l'icône s'incrémentait — donc l'ajout avait eu lieu
 * —, mais la liste n'affichait qu'une ligne « google.com » que rien ne reliait à
 * ce qu'on venait de cliquer. Le contrôle porte donc sur trois choses :
 *
 * 1. ce qui entre dans le stockage est la destination, sous son vrai domaine ;
 * 2. l'application l'affiche sous ce domaine, et non sous celui du moteur ;
 * 3. la même page ajoutée ensuite par son adresse directe est un **doublon**, et
 *    non un second lien.
 *
 * Il écrit une capture d'écran dans `.verify-chrome-captures/`. Ce qu'il ne fait
 * pas : il ne clique pas « Ajouter cette page » (l'entrée de page enregistre la
 * page de résultats, ce qui est le comportement voulu), et ne remplace pas
 * `verify-chrome.mjs`, qui porte les vérifications de l'extension entière.
 *
 * Usage : node scripts/verify-context-menu.mjs
 */

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { captureFromClick, MENU_IDS } from '../src/core/capture.js';
import { createLink, isSameTarget } from '../src/core/link.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION = join(ROOT, 'dist', 'extension');
const PROFILE = join(ROOT, '.verify-chrome', 'profile-clic-droit');
const CAPTURES = join(ROOT, '.verify-chrome-captures');
const PORT = 9357;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

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
 * Le clic simulé : un résultat de recherche Google.
 *
 * L'adresse est celle que Chrome remplit réellement dans `info.linkUrl` pour un
 * résultat organique — une enveloppe du moteur, avec le contexte de la recherche.
 */
const CLIC = Object.freeze({
  menuItemId: MENU_IDS.link,
  linkUrl: 'https://www.google.com/url?q=https://fr.wikipedia.org/wiki/Code_QR&sa=U&ved=2ahUKEwi',
  pageUrl: 'https://www.google.com/search?q=wikipedia+qrcode',
});
const ONGLET = Object.freeze({
  url: 'https://www.google.com/search?q=wikipedia+qrcode',
  title: 'wikipedia qrcode - Recherche Google',
});

/** Ce que le service worker enregistrerait : le vrai chemin, hors navigateur. */
function enregistrement() {
  const capture = captureFromClick(CLIC, ONGLET);
  const link = createLink(capture);
  return {
    ...link,
    id: 'verification-clic-droit',
    collectionId: 'default',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

async function main() {
  const lien = enregistrement();
  console.log('capture  :', JSON.stringify(captureFromClick(CLIC, ONGLET)));
  console.log('enregistré :', lien.title, '→', lien.url);

  rmSync(PROFILE, { recursive: true, force: true });
  mkdirSync(PROFILE, { recursive: true });
  mkdirSync(CAPTURES, { recursive: true });

  const browser = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-crash-reporter', '--disable-dev-shm-usage',
    `--crash-dumps-dir=${join(ROOT, '.verify-chrome', 'crash')}`,
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`,
    '--window-size=1400,1000', '--window-position=-3000,-3000',
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
    await pause(1500);

    const evaluate = async (expression) => {
      const response = await session.call('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (response.exceptionDetails) {
        throw new Error(response.exceptionDetails.exception?.description ?? 'erreur');
      }
      return response.result?.value;
    };

    // Le consentement, sans quoi le service worker refuse toute collecte.
    await evaluate(`new Promise((resolve) => chrome.storage.local.set({
      'url-qr-code-printer/privacy-consent': { version: 2, decision: 'accepted', at: Date.now() },
      'url-qr-code-printer/active-collection': { normal: 'default', private: '' },
      links: [${JSON.stringify(lien)}],
    }, resolve))`);

    // Ce que l'application en montre, après un rechargement complet.
    await session.call('Page.reload');
    await pause(2500);

    const vu = JSON.parse(await evaluate(`JSON.stringify({
      compteur: document.getElementById('count').textContent,
      lignes: [...document.querySelectorAll('#list li')].map((li) => ({
        titre: li.querySelector('a')?.textContent ?? '',
        adresse: li.querySelector('a')?.getAttribute('href') ?? '',
      })),
    })`));
    console.log('\napplication :', JSON.stringify(vu, null, 2));

    const capture = await session.call('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    const fichier = join(CAPTURES, 'clic-droit-resultat.png');
    writeFileSync(fichier, Buffer.from(capture.data, 'base64'));
    console.log(`\ncapture : ${fichier}`);

    // Les constats, et leur verdict. Le script ne se contente pas d'imprimer :
    // une vérification qui n'échoue jamais ne vérifie rien.
    const manquements = [];
    if (lien.url !== 'https://fr.wikipedia.org/wiki/Code_QR') {
      manquements.push(`destination non dépliée : ${lien.url}`);
    }
    if (lien.title !== 'fr.wikipedia.org') {
      manquements.push(`titre pris sur le moteur : ${lien.title}`);
    }
    if (!vu.lignes.some((ligne) => ligne.adresse === 'https://fr.wikipedia.org/wiki/Code_QR')) {
      manquements.push('la destination n\'est pas ce que l\'application affiche');
    }
    if (!isSameTarget(CLIC.linkUrl, 'https://fr.wikipedia.org/wiki/Code_QR')) {
      manquements.push('la même page par son adresse directe formerait un second lien');
    }
    if (manquements.length > 0) {
      console.error('\n✗ ' + manquements.join('\n✗ '));
      process.exitCode = 1;
      return;
    }
    console.log('\n✓ la destination est enregistrée, affichée, et reconnue comme la même page');
  } finally {
    browser.kill('SIGKILL');
  }
}

await main();
