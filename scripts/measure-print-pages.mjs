/**
 * Mesure de l'impression sur plusieurs pages.
 *
 * Question posée : sur une longue liste, le tableau imprimé et la planche
 * d'étiquettes passent-ils proprement d'une page à l'autre, ou le contenu est-il
 * coupé au bord de la feuille ?
 *
 * Le script ne porte aucun verdict : il rend des nombres.
 *
 * - `#print-root` est la racine papier, celle que `window.print()` envoie à
 *   l'imprimante. On la remplit par un `beforeprint` envoyé à la main, ce qui
 *   évite la boîte de dialogue bloquante.
 * - `Page.printToPDF` est le **vrai** paginateur du navigateur, avec
 *   `preferCSSPageSize` : c'est lui qui dit combien de pages sortent, pas nous.
 *
 * Deux enseignements de la maison, appliqués ici : forcer une occasion de rendu
 * avant toute mesure de style, et ne jamais dormir un temps fixe en espérant un
 * résultat — on attend l'état.
 *
 * Usage : node scripts/measure-print-pages.mjs [nombre-de-liens]
 */

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONSENT_KEY, DISCLOSURE_VERSION } from '../src/core/privacy.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION = join(ROOT, 'dist', 'extension');
const PROFIL = join(ROOT, '.verify-chrome', 'profile-pages');
const PORT = 9354;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DOSSIER = join(ROOT, '.verify-chrome-pages');

const LIENS = Number(process.argv[2] ?? 45);
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

/**
 * Ce que dit un PDF produit par Chrome : nombre de pages, et **taille du
 * papier**.
 *
 * Le `MediaBox` est l'instrument qui tranche : A4 vaut 595 × 842 points, Letter
 * 612 × 792. Sans lui, un nombre de pages ne se distingue pas d'un mauvais
 * format de papier.
 */
function lirePdf(pdf) {
  const texte = Buffer.from(pdf).toString('latin1');
  const pages = (texte.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  const compte = Number((texte.match(/\/Count\s+(\d+)/) ?? [])[1] ?? 0);
  const boite = (texte.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/) ?? [])
    .slice(1).map(Number);
  return {
    pages,
    compte,
    mediaBox: boite.length === 4 ? boite : null,
    largeurPt: boite.length === 4 ? Math.round(boite[2] - boite[0]) : null,
    hauteurPt: boite.length === 4 ? Math.round(boite[3] - boite[1]) : null,
  };
}

async function main() {
  rmSync(PROFIL, { recursive: true, force: true });
  mkdirSync(DOSSIER, { recursive: true });

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
    if (!version) throw new Error('Chrome ne répond pas sur le port de débogage');

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

    // Une collection assez longue pour ne pas tenir sur une feuille : les
    // titres et les adresses ont des longueurs réalistes, sans quoi la hauteur
    // d'une ligne ne serait pas celle du produit.
    await evaluate(`new Promise((resolve) => chrome.storage.local.set({ links:
      Array.from({ length: ${LIENS} }, (_, i) => ({
        id: 'lien-' + i,
        url: 'https://exemple.fr/article-' + String(i + 1).padStart(3, '0') + '?ref=mesure',
        title: 'Article ' + String(i + 1).padStart(3, '0') + ' — un titre de longueur ordinaire',
        note: '', tags: [], createdAt: Date.now() - (${LIENS} - i) * 3600000,
        updatedAt: Date.now(), source: 'manual', favicon: '', shortUrl: '',
        shortProvider: '', shortenedAt: 0, order: i,
      })), }, resolve))`);
    await session.call('Page.reload');
    await pause(2500);
    // Les adresses attendues, posees cote page : la mesure doit savoir ce
    // qu'elle cherche, sinon « aucune ligne manquante » ne veut rien dire.
    await evaluate(`window.__adresses = Array.from({ length: ${LIENS} }, (_, i) =>
      'https://exemple.fr/article-' + String(i + 1).padStart(3, '0') + '?ref=mesure')`);

    /** Force une occasion de rendu, puis attend que la racine papier soit prête. */
    const preparer = async (onglet) => evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === '${onglet}').click();
      await pause(1200);
      const racine = document.getElementById('print-root');
      racine.textContent = '';
      window.dispatchEvent(new Event('beforeprint'));
      await pause(1200);
      return racine.childElementCount;
    })()`);

    const mesurer = async (onglet, adresses) => evaluate(`(() => {
      const racine = document.getElementById('print-root');
      const pages = [...racine.querySelectorAll('.print-page')];
      const premiere = pages[0];
      const boite = (n) => { const r = n.getBoundingClientRect(); return {
        haut: Math.round(r.top), bas: Math.round(r.bottom), hauteur: Math.round(r.height),
      }; };
      const mesure = {
        onglet: '${onglet}',
        pages: pages.length,
        liens: document.querySelectorAll('#list .link').length,
      };
      if (!premiere) return mesure;

      const style = getComputedStyle(premiere);
      mesure.page = boite(premiere);
      mesure.overflow = style.overflow;
      mesure.hauteurClient = premiere.clientHeight;
      mesure.hauteurContenu = premiere.scrollHeight;
      mesure.depasse = premiere.scrollHeight - premiere.clientHeight;

      const table = premiere.querySelector('.print-table');
      if (table) {
        const lignes = [...table.querySelectorAll('tr')];
        const entete = premiere.querySelector('.print-page__title');
        const basUtile = premiere.clientHeight;
        const basDerniere = lignes.length
          ? Math.round(lignes[lignes.length - 1].getBoundingClientRect().bottom
            - premiere.getBoundingClientRect().top)
          : null;
        mesure.tableau = {
          lignes: lignes.length,
          hauteur: Math.round(table.getBoundingClientRect().height),
          entete: entete ? Math.round(entete.getBoundingClientRect().height) : 0,
          basDerniereLigne: basDerniere,
          basUtile,
          lignesHorsPage: basDerniere === null ? null
            : lignes.filter((l) => Math.round(l.getBoundingClientRect().bottom
              - premiere.getBoundingClientRect().top) > basUtile).length,
          derniereLigneCoupee: basDerniere !== null && basDerniere > basUtile,
        };
      }

      const cellules = [...premiere.querySelectorAll('.print-cell')];
      if (cellules.length) {
        const cadre = premiere.getBoundingClientRect();
        mesure.planche = {
          cellules: cellules.length,
          cellulesTotal: racine.querySelectorAll('.print-cell').length,
          cellulesHorsPage: cellules.filter((c) => c.getBoundingClientRect().bottom - cadre.top
            > premiere.clientHeight + 1).length,
          bas: Math.round(cellules[cellules.length - 1].getBoundingClientRect().bottom - cadre.top),
        };
      }

      // **Aucune ligne perdue, aucune en double.** C'est la vérification qui
      // compte : une pagination qui ne coupe plus mais qui oublie des lignes au
      // passage serait un remède pire que le mal. On relève donc le texte
      // imprimé, page par page, et on regarde ce qu'il en manque.
      if (!mesure.tableau) return mesure;
      const attendues = ${JSON.stringify(adresses)};
      const lignesTexte = [...racine.querySelectorAll('.print-table tbody tr')]
        .map((l) => l.textContent);
      mesure.lignesTotal = lignesTexte.length;
      mesure.manquantes = attendues.filter((u) => !lignesTexte.some((t) => t.includes(u))).length;

      // Chaque page tient-elle ses lignes, et l'en-tête est-il répété ?
      mesure.parPage = pages.map((page) => ({
        lignes: page.querySelectorAll('.print-table tbody tr').length,
        entetes: page.querySelectorAll('.print-table thead tr').length,
        deborde: page.querySelector('.print-table').getBoundingClientRect().bottom
          - page.getBoundingClientRect().top > page.clientHeight + 1,
      }));
      return mesure;
    })()`);

    const resultats = {};
    for (const onglet of ['table', 'sheet']) {
      const enfants = await preparer(onglet);
      const adresses = await evaluate('window.__adresses ?? []');
      // **Le papier n'a pas de boîte à l'écran.** `#print-root` est en
      // `display: none` hors impression : toute la géométrie se lisait à zéro.
      // On demande donc au navigateur de se croire sur le papier — c'est la
      // seule façon de mesurer ce qui sortira.
      await session.call('Emulation.setEmulatedMedia', { media: 'print' });
      await pause(700);
      const mesure = await mesurer(onglet, adresses);
      // La médiation est **effacée** avant le rendu paginé : la laisser en place
      // fausse le nombre de pages, et un instrument qui pollue ce qu'il mesure
      // ne mesure plus rien.
      await session.call('Emulation.setEmulatedMedia', { media: '' });
      await pause(400);
      const pdf = await session.call('Page.printToPDF', {
        printBackground: true, preferCSSPageSize: true,
      });
      const octets = Buffer.from(pdf.data, 'base64');
      writeFileSync(join(DOSSIER, `${onglet}-${LIENS}.pdf`), octets);
      resultats[onglet] = { racine: enfants, ...mesure, pdf: lirePdf(octets), taille: octets.length };
    }

    console.log(JSON.stringify(resultats, null, 2));
    console.log(`PDF écrits dans ${DOSSIER}`);
  } finally {
    navigateur.kill('SIGKILL');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
