/**
 * Le compteur de l'icône et « Vider la collection », éprouvés ensemble.
 *
 * Deux scénarios, parce que deux pages portent le bouton, et que chacune doit
 * voir ce que l'autre a fait :
 *
 * 1. « Vider » depuis l'application (app.html), la page affichée — c'est le cas
 *    rapporté : le compteur de l'icône gardait le nombre d'avant, un « 3 » qui
 *    survivait à une collection vide ;
 * 2. « Vider » depuis la fenêtre de l'extension (popup.html), l'application
 *    restant ouverte dans un onglet — la page, elle, gardait ses liens.
 *
 * Les deux pages et le service worker partagent les mêmes documents sans se
 * parler. Ce que le script vérifie est donc une **concordance** : après l'un ou
 * l'autre vidage, l'icône ne doit plus rien annoncer et l'application ne doit
 * plus rien afficher.
 *
 * Il rend son verdict, et nomme ce qui manque. Ce qu'il ne fait pas : il ne
 * déclenche aucun clic droit — aucune API ne choisit une entrée du menu natif —,
 * donc le retour transitoire (« + », « = », « ✎ ») n'est pas éprouvé ici. C'est
 * `test/extension-bundle.test.js` qui tient ce contrat, et
 * `scripts/verify-chrome.mjs` qui le mesure.
 *
 * Usage : npm run build && node scripts/verify-app-badge.mjs
 */

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION = join(ROOT, 'dist', 'extension');
const PROFILE = join(ROOT, '.verify-chrome', 'profile-app-badge');
// Un port à part : les autres relevés peuvent tourner en même temps.
const PORT = 9361;
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
  return {
    call,
    async evaluate(expression) {
      const response = await call('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (response.exceptionDetails) {
        throw new Error(response.exceptionDetails.exception?.description ?? 'erreur');
      }
      return response.result?.value;
    },
  };
}

/** Un lien minimal, rangé dans la collection par défaut. */
function lien(i) {
  return {
    id: 'lien-' + i,
    url: 'https://exemple.fr/page-' + i,
    title: 'Page ' + i,
    tags: [],
    note: '',
    collectionId: 'default',
    order: i,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Ce qu'une page affiche d'elle-même.
 *
 * Le badge se lit depuis la page — `chrome.action` y est disponible —, ce qui
 * évite d'aller chercher la cible du service worker, qui dort la plupart du
 * temps et ne se réveille que sur un événement.
 */
const ETAT = `(async () => {
  const badge = await chrome.action.getBadgeText({});
  return JSON.stringify({
    badge,
    compteur: document.getElementById('count')?.textContent ?? '',
    lignes: document.querySelectorAll('#list li').length,
    viderGrise: document.getElementById('clear')?.disabled,
  });
})()`;

async function main() {
  rmSync(PROFILE, { recursive: true, force: true });
  mkdirSync(PROFILE, { recursive: true });

  const browser = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-crash-reporter', '--disable-dev-shm-usage',
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`,
    '--window-size=1400,1000', '--window-position=-3000,-3000',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    let version = null;
    for (let essai = 0; essai < 80 && !version; essai += 1) {
      version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null);
      if (!version) await pause(250);
    }
    if (!version) throw new Error('Chrome ne répond pas sur le port de débogage');

    // `--load-extension` est ignoré par les Chrome récents : le chargement passe
    // par le protocole de débogage, comme dans `verify-chrome.mjs`.
    const control = await connect(version.webSocketDebuggerUrl);
    const { id: extensionId } = await control.call('Extensions.loadUnpacked', { path: EXTENSION });
    console.log('extension :', extensionId);

    const ouvrir = async (fichier) => {
      const cible = await fetch(
        `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`chrome-extension://${extensionId}/${fichier}`)}`,
        { method: 'PUT' },
      ).then((r) => r.json());
      const session = await connect(cible.webSocketDebuggerUrl);
      await session.call('Runtime.enable');
      await session.call('Page.enable');
      return session;
    };

    const app = await ouvrir('app.html');
    const fenetre = await ouvrir('popup.html');
    await pause(2000);

    const relever = async () => ({
      app: JSON.parse(await app.evaluate(ETAT)),
      fenetre: JSON.parse(await fenetre.evaluate(ETAT)),
    });

    const montrer = (titre, etat) => {
      console.log(`\n${titre}`);
      console.log('  application :', JSON.stringify(etat.app));
      console.log('  fenêtre     :', JSON.stringify(etat.fenetre));
    };

    /** Trois liens dans la collection courante, et le compteur peint. */
    const semer = async () => {
      await app.evaluate(`new Promise((resolve) => chrome.storage.local.set({
        'url-qr-code-printer/privacy-consent': { version: 2, decision: 'accepted', at: Date.now() },
        'url-qr-code-printer/active-collection': { normal: 'default', private: '' },
        links: [${[1, 2, 3].map(lien).map((l) => JSON.stringify(l)).join(', ')}],
      }, resolve))`);
      await app.call('Page.reload');
      await fenetre.call('Page.reload');
      await pause(2500);
      // Le compteur est peint par le service worker, et une écriture directe dans
      // le stockage ne le réveille pas forcément tout de suite : on lui demande le
      // rafraîchissement que la fenêtre demande après une collecte, pour que le
      // point de départ porte bien « 3 ».
      await fenetre.evaluate(
        "new Promise((resolve) => chrome.runtime.sendMessage({ type: 'refresh-badge' }, () => resolve(true)))",
      );
      await pause(1000);
    };

    // --- 1. « Vider » depuis l'application ------------------------------
    await semer();
    const avant1 = await relever();
    montrer('1. avant', avant1);

    await app.evaluate("document.getElementById('clear').click()");
    await pause(3000);
    const apres1 = await relever();
    montrer("1. après « Vider » dans l'application", apres1);

    // --- 2. « Vider » depuis la fenêtre de l'extension ------------------
    await semer();
    const avant2 = await relever();
    montrer('2. avant', avant2);

    await fenetre.evaluate("document.getElementById('clear').click()");
    await pause(3000);
    const apres2 = await relever();
    montrer('2. après « Vider » dans la fenêtre', apres2);

    // --- Le verdict -----------------------------------------------------
    //
    // Un relevé qui n'échoue jamais ne vérifie rien : les deux défauts d'origine
    // sont nommés, et non seulement imprimés.
    const manquements = [];
    if (avant1.app.badge !== '3' || avant1.app.compteur !== '3 liens') {
      manquements.push(`le point de départ n'est pas celui attendu : ${JSON.stringify(avant1.app)}`);
    }
    if (apres1.app.badge !== '') {
      manquements.push(`l'icône annonce encore « ${apres1.app.badge} » après un vidage depuis l'application`);
    }
    if (apres1.app.compteur !== '0 lien' || apres1.app.lignes !== 0) {
      manquements.push("l'application n'a pas vidé ce qu'elle affiche");
    }
    if (avant2.app.badge !== '3') {
      manquements.push(`le second point de départ n'est pas celui attendu : « ${avant2.app.badge} »`);
    }
    if (apres2.app.badge !== '') {
      manquements.push(`l'icône annonce encore « ${apres2.app.badge} » après un vidage depuis la fenêtre`);
    }
    if (apres2.app.compteur !== '0 lien' || apres2.app.lignes !== 0) {
      manquements.push(`l'application ouverte affiche encore ${apres2.app.lignes} lien(s) vidés ailleurs`);
    }
    if (apres2.fenetre.compteur !== '0' || apres2.fenetre.lignes !== 0) {
      manquements.push("la fenêtre n'a pas vidé ce qu'elle affiche");
    }

    if (manquements.length > 0) {
      console.error('\n✗ ' + manquements.join('\n✗ '));
      process.exitCode = 1;
      return;
    }
    console.log('\n✓ l\'icône, l\'application et la fenêtre disent la même chose après un vidage');
  } finally {
    // SIGKILL : un SIGTERM ouvre la boîte de confirmation de Chrome, qui reste à
    // l'écran et empêche l'arrêt.
    browser.kill('SIGKILL');
  }
}

await main();
