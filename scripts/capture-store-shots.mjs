/**
 * Produit les captures d'écran de la fiche Chrome Web Store.
 *
 * Trois principes, appris à la dure :
 *
 *   - **le navigateur est lancé avec fenêtre**, hors écran, et piloté par CDP.
 *     `--headless --screenshot` ne rend pas la main dans cet environnement ;
 *   - **l'extension est chargée par le protocole de débogage**
 *     (`Extensions.loadUnpacked`). `--load-extension` est ignoré par les Chrome
 *     récents : le navigateur démarre normalement, sans la moindre erreur, et la
 *     capture montre une page blanche — un profil parfaitement fonctionnel et
 *     parfaitement vide ;
 *   - **les dimensions sont posées** par `Emulation.setDeviceMetricsOverride`, et
 *     non par la taille de la fenêtre : la capture fait alors exactement
 *     1280 × 800, la taille préférée du magasin.
 *
 * Le contenu vient de `store/screenshots/contenu-exemple.json`, **passé par
 * l'importateur du produit** : la capture montre donc exactement ce que le
 * fichier promet, et une modification du fichier se retrouve dans les captures
 * sans que rien ne soit recopié ici. C'est le même fichier que relit
 * `test/publication.test.js`, avec le même code — un contenu que l'importateur
 * refuserait échoue aux tests, pas au moment de la séance photo.
 *
 * L'amorçage du stockage se fait **depuis la page**, pas depuis le service
 * worker : une écriture tentée dans ce dernier restait sans effet alors que la
 * lecture fonctionnait, et la capture montrait une collection vide. L'ordre
 * importe aussi — les collections d'abord, les liens ensuite —, parce que
 * l'application lit les deux au démarrage.
 *
 * Ce que ce script **ne peut pas** produire, et qui doit le rester :
 * la fenêtre de l'extension ouverte **par-dessus une page** (`01`) et le **menu
 * contextuel** (`05`). Ouvrir la vraie fenêtre relève de l'interface du
 * navigateur, pas du contenu web ; la reconstituer serait une maquette, alors
 * que la documentation du magasin demande l'expérience réelle. Voir
 * `store/screenshots/README.md` pour la marche à suivre manuelle.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseImportFile, toImportableLinks } from '../src/core/import.js';
import {
  ACTIVE_COLLECTION_KEY,
  COLLECTION_LINKS_KEY,
  COLLECTIONS_KEY,
  COLLECTIONS_VERSION,
  DEFAULT_COLLECTION_ID,
} from '../src/core/collections.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SANDBOX = join(ROOT, '.store-shots');
const PROFILE = join(SANDBOX, 'profil');
const EXTENSION = join(ROOT, 'dist', 'extension');
const CAPTURES = join(ROOT, 'store', 'screenshots');
/**
 * Où écrire. `CAPTURES_SORTIE` permet d'essayer un cadrage **sans écraser** la
 * fiche : on écrit dans un dossier à part, on regarde, et on refait la vraie
 * série quand le cadre est arrêté.
 */
const OUT = process.env.CAPTURES_SORTIE
  ? resolve(ROOT, process.env.CAPTURES_SORTIE)
  : CAPTURES;
const EXEMPLE = join(CAPTURES, 'contenu-exemple.json');

/**
 * Les secondes collections des captures.
 *
 * Les liens restent ceux de `contenu-exemple.json` — la collection affichée les
 * porte tous. Ce fichier ajoute seulement les **autres** collections : sans
 * elles, « Supprimer » est grisé (il doit toujours en rester une), et ni le
 * sélecteur ni le panneau de confirmation ne pourraient se montrer.
 */
const EXEMPLE_FICHE = join(CAPTURES, 'contenu-fiche.json');
const PORT = 9333;

const WIDTH = 1280;
const HEIGHT = 800;

/**
 * Date de référence des liens d'exemple.
 *
 * Fixe, et non « maintenant » : deux séries de captures doivent montrer les
 * mêmes dates dans l'aperçu et les exports.
 */
const DATE_BASE = 1758400000000;

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
 * Le contenu d'exemple, tel que l'importateur du produit le comprend.
 *
 * @returns {object} La grappe à écrire dans `chrome.storage.local`.
 */
function contenuExemple() {
  const texte = readFileSync(EXEMPLE, 'utf8');
  const { kind, records, collection } = parseImportFile({
    name: 'contenu-exemple.json',
    text: texte,
  });
  if (kind !== 'links') {
    throw new Error(`contenu-exemple.json reconnu comme « ${kind} », et non comme une archive de liens`);
  }

  const { links, rejected } = toImportableLinks(records, { now: DATE_BASE });
  if (rejected > 0) throw new Error(`${rejected} lien(s) refusé(s) par l'importateur`);

  // Le rang est explicite : c'est lui qui donne l'ordre affiché, et l'ordre
  // manuel est celui que l'application montre par défaut.
  const stockes = links.map((lien, rang) => ({
    ...lien,
    collectionId: DEFAULT_COLLECTION_ID,
    order: rang,
  }));

  return {
    [COLLECTION_LINKS_KEY]: stockes,
    [COLLECTIONS_KEY]: {
      version: COLLECTIONS_VERSION,
      migratedAt: DATE_BASE,
      items: [{
        id: DEFAULT_COLLECTION_ID,
        name: collection.name ?? '',
        note: collection.note ?? '',
        startIndex: 1,
        createdAt: DATE_BASE,
      }],
    },
    [ACTIVE_COLLECTION_KEY]: { normal: DEFAULT_COLLECTION_ID, private: '' },
    locale: 'fr',
  };
}

/**
 * Les collections que la fiche montre en plus de celle du contenu d'exemple.
 *
 * Deux seulement, et nommées par l'usage plutôt que par un numéro : le sélecteur
 * doit montrer qu'on range ses liens, et « Mes liens » doit rester la collection
 * des liens d'exemple. Le fichier est relu à part, pour que son nom et sa note
 * restent modifiables sans toucher au script — comme `contenu-exemple.json`.
 *
 * @returns {Array<{ id: string, name: string, note: string, startIndex: number, createdAt: number }>}
 */
function collectionsSupplementaires() {
  const fichier = JSON.parse(readFileSync(EXEMPLE_FICHE, 'utf8'));
  const autres = Array.isArray(fichier?.collections) ? fichier.collections : [];
  return autres
    .filter((entree) => typeof entree?.id === 'string' && entree.id !== DEFAULT_COLLECTION_ID)
    .map((entree, rang) => ({
      id: entree.id,
      name: typeof entree.name === 'string' ? entree.name : '',
      note: typeof entree.note === 'string' ? entree.note : '',
      startIndex: 1,
      createdAt: DATE_BASE + rang + 1,
    }));
}

/** Écrit la grappe depuis la page — c'est là que l'application écrit. */
function seedExpression(grappe) {
  return `chrome.storage.local.set(${JSON.stringify(grappe)})
    .then(() => 'écrit, ' + Object.keys(${JSON.stringify(grappe)}).length + ' documents')
    .catch((e) => 'ÉCHEC : ' + (e && e.message ? e.message : String(e)))`;
}

/**
 * La bascule de langue, exécutée **dans** la page avant de la recharger.
 *
 * L'interface mémorise sa langue dans `chrome.storage.local`, sous la clé
 * `locale` : c'est le même stockage dans les deux surfaces (application et
 * mention), et `app.html` y écrit dès qu'on change la langue par le sélecteur.
 * On l'y écrit donc directement — c'est ce que ferait ce sélecteur — puis on
 * recharge, puisque la langue se relit au démarrage.
 *
 * `chrome.i18n` seul ne suffirait pas : il ne choisit que les chaînes du
 * manifeste, alors que l'interface entière est rendue par l'application.
 *
 * @param {'fr'|'en'} langue
 * @returns {string} L'expression à évaluer dans la page.
 */
function langueExpression(langue) {
  return `chrome.storage.local.set({ locale: ${JSON.stringify(langue)} })
    .then(() => 'langue : ' + ${JSON.stringify(langue)})
    .catch((e) => 'ÉCHEC langue : ' + (e && e.message ? e.message : String(e)))`;
}

/**
 * Enregistre une capture d'une page de l'extension.
 *
 * @param {{ port: number, id: string, file: string, name: string,
 *           before?: (langue: 'fr'|'en') => string, seed?: boolean,
 *           extraCollections?: boolean, langue?: 'fr'|'en' }} shot
 */
async function capture({
  port, id, file, name, before, seed, extraCollections = false, langue = 'fr',
}) {
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

  if (langue === 'en') {
    // La langue d'abord : elle survit au rechargement, et l'amorçage qui suit ne
    // la réécrit pas — la grappe ne porte `locale` que pour la série française.
    console.log(`  langue : ${describe(await page.send('Runtime.evaluate', {
      expression: langueExpression('en'), awaitPromise: true, returnByValue: true,
    }))}`);
  }

  if (seed) {
    const grappe = contenuExemple();
    if (langue === 'en') grappe.locale = 'en';
    const autres = extraCollections ? collectionsSupplementaires() : [];
    if (autres.length > 0) {
      // Les liens restent ceux de la collection affichée ; les autres
      // collections ne servent qu'au sélecteur et à « Supprimer ».
      grappe[COLLECTIONS_KEY] = {
        ...grappe[COLLECTIONS_KEY],
        items: [...grappe[COLLECTIONS_KEY].items, ...autres],
      };
    }
    console.log(`  collections : ${grappe[COLLECTIONS_KEY].items
      .map((item) => item.name || '(sans nom)').join(', ')}`);
    const written = await page.send('Runtime.evaluate', {
      expression: seedExpression(grappe),
      awaitPromise: true, returnByValue: true,
    });
    console.log(`  amorçage : ${describe(written)}`);
    await page.send('Page.reload', {});
    await new Promise((r) => setTimeout(r, 1500));
    // La langue réellement rendue, et non celle qu'on a demandée : une clé
    // oubliée s'afficherait en français au milieu d'une page anglaise, et la
    // capture partirait telle quelle sur la fiche.
    console.log(`  interface : ${describe(await page.send('Runtime.evaluate', {
      expression: `'lang=' + document.documentElement.lang
        + ' · ' + [...document.querySelectorAll('[data-i18n]')].slice(0, 3)
            .map((n) => n.textContent.trim()).join(' | ')`,
      returnByValue: true,
    }))}`);
  }

  if (before) {
    const applied = await page.send('Runtime.evaluate', {
      expression: typeof before === 'function' ? before(langue) : before,
      awaitPromise: true, returnByValue: true,
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
        titreCollection: document.getElementById('collection-name')?.value ?? null,
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

/**
 * Les captures que le script sait produire, dans l'ordre de la fiche.
 *
 * Chacune porte sa mise en scène : ce qui est montré n'est pas laissé au hasard
 * du défilement, et une capture cadrée montre la fonction que la campagne lui
 * confie.
 */
/**
 * Le défilement du cadrage de l'onglet Niimbot, en pixels.
 *
 * L'application est une page de 1600 à 2200 px de haut, et une capture en fait
 * 800 : chaque image choisit donc sa tranche. Celle-ci montre le réglage de
 * l'étiquette, les deux commandes d'impression et l'**aperçu à la taille
 * réelle** — ce que l'onglet produit, et non seulement ses réglages.
 */
const DEFILEMENT_NIIMBOT = 620;

/** Le suffixe de nom d'une série : la langue que la page affiche. */
const SUFFIXE = { fr: 'fr', en: 'en' };

const SHOTS = [
  {
    file: 'app.html',
    name: '02-application-fr.png',
    seed: true,
    // Deux collections de plus que celle des liens d'exemple, pour que le
    // sélecteur montre un rangement réel.
    extraCollections: true,
    // Le haut de l'application : la collection avec ses tags et sa note, son nom,
    // et le panneau de mise en forme. C'est ce que voit quelqu'un qui ouvre
    // l'application — la fenêtre de l'extension, elle, ne montre que la liste.
    before: `(async () => {
      document.getElementById('search').value = '';
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
      return 'haut de page : ' + window.scrollY;
    })()`,
  },
  {
    file: 'app.html',
    name: '03-impression-niimbot-fr.png',
    seed: true,
    // L'onglet Niimbot, cadré sur ce qu'il produit plutôt que sur ses réglages :
    // deux captures du même panneau se répéteraient, et c'est l'étiquette qui se
    // vend.
    before: `(async () => {
      const onglet = [...document.querySelectorAll('button')]
        .find((b) => b.textContent.includes('Niimbot'));
      if (onglet) onglet.click();
      await new Promise((r) => setTimeout(r, 600));
      window.scrollTo(0, ${DEFILEMENT_NIIMBOT});
      await new Promise((r) => setTimeout(r, 300));
      return onglet ? 'onglet Niimbot, défilement ' + window.scrollY : 'onglet Niimbot introuvable';
    })()`,
  },
  {
    file: 'app.html',
    name: '05-collections-fr.png',
    seed: true,
    // Les trois gestes de la gestion des collections, sur une seule image : le
    // sélecteur et sa suppression, le nom sur la ligne duquel siègent
    // « Enregistrer » et « Nouvelle », et le panneau de confirmation ouvert — qui
    // nomme la collection et compte les liens qu'elle emporte. La série montre
    // donc ce que la 0.3.0 apporte, et non seulement la collection déjà connue.
    // Deux collections de plus que celle des liens, pour que le sélecteur ait un
    // rangement à montrer et que « Supprimer » soit offert.
    extraCollections: true,
    before: (langue) => {
      // Le texte du nom en attente suit la langue de la capture : « Nom en
      // attente : … » en français, « Pending name: … » en anglais.
      const enAttente = langue === 'en'
        ? 'Pending name: “Save” applies it to the displayed collection; “New” creates a collection with that name.'
        : "Nom en attente : \u00ab Enregistrer \u00bb l'applique à la collection affichée ; \u00ab Nouvelle \u00bb crée une collection de ce nom.";
      return `(async () => {
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 200));
        // Le nom se valide : on montre la saisie en attente, le bouton actif,
        // l'aide qui annonce les deux issues, et « Nouvelle » qui reprendra ce nom.
        const champ = document.getElementById('collection-name');
        const enregistre = champ.value;
        champ.value = enregistre + ' 2026';
        champ.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 400));
        const aide = document.getElementById('collection-hint');
        const texteAttendu = ${JSON.stringify(enAttente)};
        if (!aide || aide.hidden || aide.textContent.trim() !== texteAttendu) {
          return 'aide inattendue : « ' + (aide ? aide.textContent.trim() : 'absente') + ' »';
        }
        const bouton = document.getElementById('collection-name-save');
        if (bouton.disabled) return 'bouton « Save/Enregistrer » INACTIF';
        bouton.click();
        await new Promise((r) => setTimeout(r, 600));
        // Puis la suppression : question ouverte, et rien d'effacé tant qu'on
        // n'a pas confirmé.
        document.getElementById('collection-delete').click();
        await new Promise((r) => setTimeout(r, 300));
        const panneau = document.getElementById('collection-delete-confirm');
        return (panneau && !panneau.hidden ? 'confirmation ouverte' : 'confirmation FERMÉE')
          + ' · nom enregistré « ' + document.getElementById('collection-name').value + ' »'
          + ' · « ' + (document.getElementById('collection-delete-confirm-text')?.textContent ?? '').trim() + ' »';
      })()`;
    },
  },
  {
    file: 'privacy.html',
    name: '04-mention-confidentialite-fr.png',
  },
];

/** Effacer le bac à sable, même si Chrome vient à peine de le libérer. */
const effacerBac = () => rmSync(SANDBOX, {
  recursive: true,
  force: true,
  // Le profil Chrome est encore tenu par des fichiers de verrou une fraction de
  // seconde après le SIGKILL : sans ces reprises, le nettoyage échouait en
  // ENOTEMPTY et le script sortait en erreur alors que les captures étaient
  // écrites.
  maxRetries: 10,
  retryDelay: 100,
});

/** Point d'entrée. */
async function main() {
  effacerBac();
  mkdirSync(PROFILE, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  const browser = spawn(CHROME, [
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-crash-reporter',
    '--disable-dev-shm-usage',
    `--user-data-dir=${PROFILE}`,
    `--remote-debugging-port=${PORT}`,
    '--window-size=240,240',
    '--window-position=-3000,-3000',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    let version = null;
    for (let essai = 0; essai < 80 && !version; essai += 1) {
      version = await fetch(`http://127.0.0.1:${PORT}/json/version`)
        .then((r) => r.json()).catch(() => null);
      if (!version) await new Promise((r) => setTimeout(r, 250));
    }
    if (!version) throw new Error('Chrome ne répond pas sur le port de débogage');

    // `send` rend le message entier — `{ id, result }` —, et l'identifiant de
    // l'extension voyage donc dans `result`, sous le même nom que l'identifiant
    // de la requête CDP. Les confondre donne un « chrome-extension://1/… », et
    // chaque page s'ouvre alors sur une erreur de navigation.
    const control = await connect(version.webSocketDebuggerUrl);
    const chargement = await control.send('Extensions.loadUnpacked', { path: EXTENSION });
    const id = chargement?.result?.id;
    if (!id) {
      throw new Error(`chargement de l'extension impossible : ${JSON.stringify(chargement)}`);
    }
    console.log(`Extension ${id}\n`);

    // Deux séries : la française, et la même en anglais. Le magasin accepte des
    // captures par langue, et une fiche anglaise servie avec des captures
    // françaises se lit mal — d'où la série anglaise, produite à l'identique.
    for (const langue of ['fr', 'en']) {
      for (const shot of SHOTS) {
        if (shot.langue && shot.langue !== langue) continue;
        const nom = shot.name.replace(/-fr\.png$/, `-${SUFFIXE[langue]}.png`);
        console.log(nom);
        await capture({ port: PORT, id, ...shot, name: nom, langue });
      }
    }

    console.log(`\n✓ captures écrites dans ${OUT.slice(ROOT.length + 1)}`);
  } finally {
    try {
      browser.kill('SIGKILL');
    } catch {
      // Déjà arrêté.
    }
    effacerBac();
  }
}

await main();
