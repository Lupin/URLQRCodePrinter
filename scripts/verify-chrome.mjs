/**
 * Éprouve l'extension dans Google Chrome, et relève ce qui s'y passe vraiment.
 *
 * Ce script existe parce que les mesures de l'audit d'accessibilité
 * (`docs/design-options/audit-accessibilite.md`) et les garde-fous de
 * `test/popup-a11y.test.js` sont **calculés depuis les jetons écrits dans les
 * feuilles de style**, jamais depuis un rendu. Un contraste peut être juste sur
 * le papier et faux à l'écran : c'est le fond réellement peint derrière un
 * élément qui compte, et lui seul sait quelles règles l'emportent.
 *
 * Trois précautions reprises de `verify-brave.mjs`, apprises d'un incident où
 * des vérifications écrites à la volée avaient laissé un navigateur de test
 * ouvert et deux téléchargements échoués chez l'utilisateur :
 *
 * 1. **Profil isolé**, dans un dossier du projet — jamais le profil réel.
 * 2. **Téléchargements redirigés**, via `Browser.setDownloadBehavior`.
 * 3. **Arrêt par SIGKILL** : un SIGTERM déclenche la boîte de confirmation de
 *    Chrome, qui reste à l'écran et bloque l'arrêt.
 *
 * Le chargement de l'extension passe par `Extensions.loadUnpacked`, et non par
 * la ligne de commande. Chrome 153 **ignore `--load-extension`** : le
 * commutateur de fonctionnalité `DisableLoadExtensionCommandLineSwitch` le
 * neutralise, et le profil reste alors sans extension, sans le moindre message.
 * Constaté ici même : deux lancements successifs ont produit un navigateur
 * parfaitement fonctionnel et parfaitement vide. Le chemin CDP, lui, est celui
 * que l'outillage officiel emprunte, et il rend l'identifiant attribué.
 *
 * Ce que le script ne peut pas faire, et qu'il dit :
 *
 * - **Le menu contextuel ne se clique pas.** Aucune API ne permet d'ouvrir puis
 *   de choisir une entrée du menu natif. L'existence des entrées est donc
 *   sondée par `chrome.contextMenus.update`, dont l'échec est renseigné par
 *   `runtime.lastError`.
 * - **La fenêtre réelle n'est pas ouvrable.** `popup.html` est chargé dans un
 *   onglet : c'est le même document, les mêmes règles et la même largeur
 *   imposée (380 px), mais pas la même surface d'affichage. Un défaut qui ne
 *   dépend que du document se voit ici ; un défaut lié au cadre du popup, non.
 */

import { spawn } from 'node:child_process';
import {
  existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// La forme exacte du consentement est celle du module, pas une approximation :
// un enregistrement inventé serait rejeté en silence, et l'encart de la mention
// resterait affiché, déplaçant toute la mise en page mesurée en dessous.
import { CONSENT_KEY, DISCLOSURE_VERSION } from '../src/core/privacy.js';
// Le modèle pur de la planche, importé pour confronter ce que le navigateur
// dessine à ce que le calcul retient — deux chemins indépendants, qui doivent
// tomber sur le même nombre.
import { fitGrid, clampGrid, PAGE_SIZES, SHEET_PRESETS } from '../src/core/sheet.js';
// Le lecteur d'archives de l'application : l'export est relu par le même code
// que celui qui relit un dossier importé, et non par un outil externe.
import { readStoredZip } from '../src/core/zip.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SANDBOX = join(ROOT, '.verify-chrome');
const PROFILE = join(SANDBOX, 'profile');
const DOWNLOADS = join(SANDBOX, 'downloads');
const CAPTURES = join(ROOT, '.verify-chrome-captures');
const EXTENSION = join(ROOT, 'dist', 'extension');
const PORT = 9351;

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Attend qu'une condition soit vraie, ou abandonne. */
async function waitFor(check, { timeout = 20000, interval = 250, label = 'condition' } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Délai dépassé en attendant : ${label}`);
}

/**
 * Ouvre une session DevTools et rend une fonction d'envoi.
 *
 * Une réponse portant `error` est levée plutôt que renvoyée : un échec de
 * protocole silencieux se traduit sinon par un `undefined` inexplicable, loin
 * de sa cause.
 */
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

  const send = (method, params) => new Promise((res) => {
    const id = next++;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });

  // `send` rend la réponse entière ; `call` n'en rend que le résultat, et lève
  // sur erreur. Les deux servent : le sondage du menu contextuel a besoin de
  // distinguer « refusé » de « erreur de protocole ».
  const call = async (method, params) => {
    const response = await send(method, params);
    if (response.error) {
      throw new Error(`${method} → ${response.error.message}`);
    }
    return response.result;
  };

  return { ws, send, call };
}

/**
 * Recharge une page et attend qu'elle soit de nouveau interrogeable.
 *
 * `await eval('location.reload()')` **ne répond jamais** : la navigation détruit
 * le contexte d'exécution avant que la réponse ne soit écrite, et la promesse
 * reste en suspens indéfiniment. Le script s'y arrêtait, sans message, après la
 * dernière ligne écrite. `Page.reload` est une commande du protocole : elle
 * répond. Il reste à attendre le nouveau document, et l'on réessaie au lieu de
 * dormir un temps fixe, parce que le contexte neuf met un temps variable à
 * accepter une évaluation.
 *
 * @param {{ call: Function }} session
 */
async function recharger(session) {
  await session.call('Page.reload', { ignoreCache: false });

  const limite = Date.now() + 15000;
  while (Date.now() < limite) {
    try {
      const etat = await session.call('Runtime.evaluate', {
        expression: 'document.readyState',
        returnByValue: true,
      });
      if (etat?.result?.value === 'complete') return;
    } catch {
      // Contexte en cours de destruction : on réessaie.
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('la page rechargée n\'est jamais redevenue interrogeable');
}

/**
 * Force une occasion de rendu sur une page.
 *
 * Chrome diffère le calcul de style d'un onglet qui n'est pas rendu — et nos
 * onglets de vérification sont hors écran. Sans cela, `getComputedStyle` rend
 * les valeurs de l'état **précédent**, alors que la peinture, elle, est juste :
 * c'est ce qui a fait accuser les boutons du pied d'un contraste de 1,08:1
 * qu'ils n'avaient pas.
 *
 * Une capture d'un pixel suffit : le recalcul de style est global, seul le
 * dessin est restreint. Une capture pleine page coûtait vingt fois plus cher
 * pour le même effet.
 *
 * @param {{ call: Function }} session
 * @param {number} [pause] attente après la peinture, en millisecondes
 */
async function forcerPeinture(session, pause = 250) {
  try {
    await session.call('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 1,
      clip: { x: 0, y: 0, width: 8, height: 8, scale: 1 },
    });
  } catch {
    // Une capture refusée n'est pas un échec du contrôle : on continue, et la
    // mesure qui suit dira elle-même si elle est exploitable.
  }
  await new Promise((r) => setTimeout(r, pause));
}

/**
 * Les noms des archives déjà téléchargées.
 *
 * Les deux exports — planche et étiquettes — déposent dans le même dossier, et
 * chercher « un `.zip` » y trouvait l'archive de l'autre. C'est le piège que
 * `verify-brave.mjs` documente déjà pour les exports de texte : on compare des
 * **listes**, pas des motifs.
 *
 * @param {string} dossier
 * @returns {Set<string>}
 */
function archivesPresentes(dossier) {
  return new Set(readdirSync(dossier).filter((nom) => nom.endsWith('.zip')));
}

/** Ferme le navigateur sans déclencher sa boîte de confirmation. */
function shutdown(browser) {
  try {
    browser.kill('SIGKILL');
  } catch {
    // Déjà arrêté.
  }
}

/**
 * Contraste WCAG entre deux couleurs `rgb()`/`rgba()`, ou `null` si l'une est
 * transparente. Luminance relative sRGB, comme la spécification l'exige.
 */
const CONTRAST_HELPER = `
  function _parseColour(value) {
    const match = String(value).match(/rgba?\\(([^)]+)\\)/);
    if (!match) return null;
    const parts = match[1].split(',').map((n) => Number.parseFloat(n));
    const [r, g, b] = parts;
    const alpha = parts.length > 3 ? parts[3] : 1;
    if (alpha === 0) return null;
    return { r, g, b, alpha };
  }
  function _luminance(colour) {
    const channel = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);
  }
  function _ratio(a, b) {
    const la = _luminance(a);
    const lb = _luminance(b);
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
  }
  /** Le fond réellement peint : premier ancêtre dont le fond n'est pas transparent. */
  function _paintedBackground(node) {
    let current = node;
    while (current && current !== document.documentElement.parentNode) {
      const colour = _parseColour(getComputedStyle(current).backgroundColor);
      if (colour) return colour;
      current = current.parentElement;
    }
    return { r: 255, g: 255, b: 255, alpha: 1 };
  }
`;

async function main() {
  if (!existsSync(CHROME)) {
    console.error('Google Chrome est introuvable : rien à éprouver.');
    process.exit(1);
  }
  if (!existsSync(join(EXTENSION, 'manifest.json'))) {
    console.error('dist/extension est absent : lancez `npm run build` d\'abord.');
    process.exit(1);
  }

  rmSync(SANDBOX, { recursive: true, force: true });
  mkdirSync(PROFILE, { recursive: true });
  mkdirSync(DOWNLOADS, { recursive: true });
  mkdirSync(CAPTURES, { recursive: true });

  // Hors écran, pour ne pas surgir devant l'utilisateur.
  const browser = spawn(CHROME, [
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${PROFILE}`,
    `--remote-debugging-port=${PORT}`,
    '--window-size=1280,900',
    '--window-position=-3000,-3000',
    'about:blank',
  ], { stdio: 'ignore', detached: false });

  const results = [];
  /** Consigne un constat. `ok` à null signifie « relevé », sans verdict. */
  const record = (label, ok, detail = '') => {
    results.push({ label, ok, detail });
    const mark = ok === null ? '·' : (ok ? '✓' : '✗');
    console.log(`${mark} ${label}${detail ? ` — ${detail}` : ''}`);
  };

  /** Sessions à refermer, quelle que soit l'issue. */
  const sessions = [];

  try {
    const version = await waitFor(
      () => fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null),
      { label: 'le navigateur répond sur le port de débogage' },
    );
    record('Chrome démarre et expose le protocole', true, version.Browser);

    const control = await connect(version.webSocketDebuggerUrl);
    await control.call('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: DOWNLOADS,
      eventsEnabled: true,
    });

    // --- Chargement de l'extension ----------------------------------------
    let extensionId;
    try {
      ({ id: extensionId } = await control.call('Extensions.loadUnpacked', { path: EXTENSION }));
    } catch (error) {
      record('l\'extension se charge', false, error.message);
      throw error;
    }
    record('l\'extension se charge par le chemin officiel', Boolean(extensionId), extensionId);

    const openPage = async (url) => {
      const target = await fetch(
        `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`,
        { method: 'PUT' },
      ).then((r) => r.json());
      const session = await connect(target.webSocketDebuggerUrl);
      sessions.push(session);
      await session.call('Runtime.enable');
      await session.call('Page.enable');
      return { target, session };
    };

    const evaluateIn = (session) => async (expression) => {
      const response = await session.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (response.result?.exceptionDetails) {
        const said = response.result.exceptionDetails.exception?.description ?? 'erreur';
        const where = String(expression).replace(/\s+/g, ' ').slice(0, 140);
        throw new Error(`${said} — dans : ${where}`);
      }
      return response.result?.result?.value;
    };

    // --- La fenêtre de l'extension ----------------------------------------
    // Chargée dans un onglet : même document, même largeur imposée.
    const popup = await openPage(`chrome-extension://${extensionId}/popup.html`);
    const evalPopup = evaluateIn(popup.session);
    await evalPopup('document.readyState');

    // Le consentement conditionne la collecte ; la fenêtre le réclame au
    // premier lancement, et l'encart déplacerait la mise en page mesurée.
    await evalPopup(`new Promise((resolve) => chrome.storage.local.set({
      '${CONSENT_KEY}': { version: ${DISCLOSURE_VERSION}, decision: 'accepted', at: Date.now() }
    }, resolve))`);

    // Deux liens, pour que la liste, ses puces et sa zone défilante existent.
    await evalPopup(`new Promise((resolve) => chrome.runtime.sendMessage({
      type: 'record-capture',
      capture: { url: 'https://exemple.fr/article-un', title: 'Un article de fond' }
    }, () => chrome.runtime.sendMessage({
      type: 'record-capture',
      capture: { url: 'https://exemple.fr/article-deux', title: 'Un second article' }
    }, resolve)))`);

    await recharger(popup.session);
    await new Promise((r) => setTimeout(r, 1500));

    // **Forcer une occasion de rendu avant toute mesure.**
    //
    // L'onglet est hors écran, et Chrome diffère le calcul de style d'une page
    // qui n'est pas rendue. `getComputedStyle` rendait donc les valeurs de
    // l'état précédent — celui du HTML livré, où les boutons du pied portent
    // l'attribut `disabled` — alors que la peinture, elle, était juste.
    //
    // Le piège est traître : les règles correspondantes étaient les bonnes,
    // `:disabled` ne correspondait plus, un bouton neuf portant les mêmes
    // classes donnait la bonne valeur, et la capture montrait un bouton noir à
    // texte blanc là où la mesure lisait gris sur gris. Trois constats
    // concordants accusaient le produit d'un défaut de contraste qu'il n'avait
    // pas. Une capture jetable, avant de mesurer, lève l'ambiguïté.
    await forcerPeinture(popup.session, 400);

    const rows = await evalPopup("document.querySelectorAll('#list .item').length");
    record('la fenêtre affiche les liens collectés', rows === 2, `${rows} ligne(s)`);

    // Les commandes du pied ne se mesurent qu'**actives** : inactives, 1.4.11
    // les exempte, et le contrôle de contraste ne dirait plus rien. On le
    // vérifie au lieu de l'espérer — c'est ce qui manquait au premier relevé.
    const etatPied = await evalPopup(`(() => {
      const lire = (id) => {
        const node = document.getElementById(id);
        return node ? { desactive: node.disabled, libelle: node.textContent.trim() } : null;
      };
      return { csv: lire('export-csv'), md: lire('export-md'), clear: lire('clear'), app: lire('open-app') };
    })()`);
    const piedActif = Object.values(etatPied ?? {}).every((b) => b && b.desactive === false);
    record(
      'les commandes du pied sont actives, donc mesurables',
      piedActif,
      Object.entries(etatPied ?? {}).map(([nom, b]) => `${nom}:${b?.desactive ? 'inactif' : 'actif'}`).join(' · '),
    );

    // --- Les mesures de rendu ---------------------------------------------
    //
    // C'est le cœur du lot : les mêmes paires que l'audit, mais lues sur le
    // document rendu au lieu des jetons. Le contrôle des composants ne vise que
    // les commandes : un séparateur décoratif est explicitement exempté par le
    // critère 1.4.11, et le compter ferait échouer la mesure pour rien.
    //
    // **La valeur n'est lue qu'une fois stable.** Les boutons portent une
    // transition de 140 ms sur `border-color`, et `getComputedStyle` rend la
    // valeur *interpolée* tant qu'elle court. Le passage de l'état inactif à
    // l'état actif — que `render()` provoque après le chargement de l'onglet —
    // faisait donc lire la teinte de l'état précédent : un premier relevé a
    // accusé les trois boutons du pied sur une couleur qu'ils n'avaient déjà
    // plus. On lit donc deux fois, à 250 ms d'intervalle, et l'on ne retient la
    // valeur que si elle ne bouge plus.
    const contrast = await evalPopup(`(async () => {
      ${CONTRAST_HELPER}
      const stable = async (lire) => {
        let precedent = lire();
        const limite = Date.now() + 2500;
        while (Date.now() < limite) {
          await new Promise((r) => setTimeout(r, 250));
          const courant = lire();
          if (courant === precedent) return courant;
          precedent = courant;
        }
        return precedent;
      };
      const textes = [
        { nom: 'titre de la fenêtre', sel: '.app-header__title' },
        { nom: 'page courante', sel: '.capture__page' },
        { nom: 'compteur', sel: '.count' },
        { nom: 'titre de section', sel: '.section-title' },
        { nom: 'titre d\\'une ligne', sel: '.item__title' },
        { nom: 'URL d\\'une ligne', sel: '.item__url' },
        { nom: 'bouton principal', sel: '.btn--primary' },
        { nom: 'bouton neutre (pied)', sel: '#open-app' },
        { nom: 'bouton discret CSV', sel: '#export-csv' },
        { nom: 'bouton destructeur', sel: '#clear' },
        { nom: 'sélecteur de langue', sel: '#locale' },
      ];
      const composants = [
        { nom: 'contour du bouton discret', sel: '#export-csv' },
        { nom: 'contour du bouton destructeur', sel: '#clear' },
        { nom: 'contour du sélecteur de langue', sel: '#locale' },
        { nom: 'contour d\\'une ligne de liste', sel: '.item' },
      ];

      const lire = (node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return { box, style, peint: box.width > 0 && box.height > 0 && style.display !== 'none' };
      };

      const sortie = { textes: [], composants: [] };
      for (const cible of textes) {
        const node = document.querySelector(cible.sel);
        if (!node) { sortie.textes.push({ nom: cible.nom, etat: 'absent' }); continue; }
        const { style, peint } = lire(node);
        if (!peint) { sortie.textes.push({ nom: cible.nom, etat: 'non peint' }); continue; }
        const avant = _parseColour(style.color);
        const fond = _paintedBackground(node);
        sortie.textes.push({
          nom: cible.nom,
          couleur: style.color,
          fond: \`rgb(\${fond.r}, \${fond.g}, \${fond.b})\`,
          ratio: avant ? Number(_ratio(avant, fond).toFixed(2)) : null,
          seuil: 4.5,
          taille: style.fontSize,
          gras: Number.parseInt(style.fontWeight, 10) >= 700,
          etat: 'mesuré',
        });
      }
      for (const cible of composants) {
        const node = document.querySelector(cible.sel);
        if (!node) { sortie.composants.push({ nom: cible.nom, etat: 'absent' }); continue; }
        const { style, peint } = lire(node);
        if (!peint) { sortie.composants.push({ nom: cible.nom, etat: 'non peint' }); continue; }
        // Forcer un recalcul de style : la valeur calculée d'un element dont
        // l'attribut disabled a ete retire depuis le script peut rester celle de
        // l'etat precedent tant qu'aucune lecture de geometrie n'a relance le
        // calcul. C'est l'ecart observe entre l'element de la page et un bouton
        // neuf portant les memes classes.
        void node.offsetHeight;
        // Le contour est la valeur qui bouge le plus : il dépend de l'état
        // actif ou inactif, et il est animé. On attend qu'il se pose.
        const teinteContour = await stable(() => getComputedStyle(node).borderTopColor);
        const bordure = _parseColour(teinteContour);
        const epaisseur = Number.parseFloat(style.borderTopWidth);
        // Le contour se juge contre ce qu'il borde : le fond du composant s'il
        // est opaque, sinon le fond peint derrière lui.
        const interieur = _parseColour(style.backgroundColor) ?? _paintedBackground(node);
        sortie.composants.push({
          nom: cible.nom,
          couleur: teinteContour,
          fond: \`rgb(\${interieur.r}, \${interieur.g}, \${interieur.b})\`,
          ratio: bordure && epaisseur > 0 ? Number(_ratio(bordure, interieur).toFixed(2)) : null,
          epaisseur,
          seuil: 3,
          // **Un composant inactif est exempté par 1.4.11.** Mesurer un bouton
          // désactivé et conclure à un échec serait une fausse accusation, et le
          // premier relevé l'a fait.
          inactif: node.disabled === true || node.getAttribute('aria-disabled') === 'true',
        });
      }
      return sortie;
    })()`);

    for (const mesure of contrast?.textes ?? []) {
      if (mesure.etat !== 'mesuré') {
        record(`contraste au rendu — ${mesure.nom}`, null, mesure.etat);
        continue;
      }
      // 1.4.3 : 4,5:1, sauf « grand texte » (≥ 24 px, ou ≥ 18,66 px en gras),
      // où le seuil descend à 3:1.
      const taille = Number.parseFloat(mesure.taille);
      const grand = taille >= 24 || (mesure.gras && taille >= 18.66);
      const seuil = grand ? 3 : 4.5;
      record(
        `contraste au rendu — ${mesure.nom}`,
        mesure.ratio >= seuil,
        `${mesure.couleur} sur ${mesure.fond} → ${mesure.ratio}:1 `
          + `(seuil ${seuil}${grand ? ', grand texte' : ''}, ${mesure.taille})`,
      );
    }
    for (const mesure of contrast?.composants ?? []) {
      if (mesure.etat === 'sans contour') {
        record(`contour — ${mesure.nom}`, null, 'aucun contour : rien à mesurer');
        continue;
      }
      if (mesure.etat !== 'mesuré') {
        record(`contour — ${mesure.nom}`, null, mesure.etat);
        continue;
      }
      if (mesure.inactif) {
        record(
          `contour — ${mesure.nom}`,
          null,
          `${mesure.ratio}:1, mais le composant est inactif : 1.4.11 l'exempte`,
        );
        continue;
      }
      record(
        `contour — ${mesure.nom}`,
        mesure.ratio >= 3,
        `${mesure.couleur} (${mesure.epaisseur} px) sur ${mesure.fond} → ${mesure.ratio}:1 (seuil 3)`,
      );
    }

    // --- Le clavier --------------------------------------------------------
    //
    // Le parcours est fait de **vrais appuis de touche**, envoyés par le
    // protocole : le navigateur décide du focus, pas nous. Simuler un
    // `KeyboardEvent` en page ne déplacerait aucun focus, et ne prouverait donc
    // rien — c'est précisément ce que `:focus-visible` distingue.
    await popup.session.call('Page.bringToFront');
    await evalPopup(`(() => {
      // On repart d'un état neutre : le focus laissé par une évaluation
      // précédente fausserait le premier arrêt.
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      document.body.tabIndex = -1;
      document.body.focus();
      return document.activeElement.tagName;
    })()`);

    const describeFocused = () => evalPopup(`(() => {
      const node = document.activeElement;
      if (!node || node === document.body) return { tag: 'BODY', fin: true };
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const anneau =
        style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0
          ? \`\${style.outlineWidth} \${style.outlineStyle} \${style.outlineColor}\`
          : (style.boxShadow !== 'none' ? style.boxShadow : '');
      return {
        tag: node.tagName,
        id: node.id || '',
        classe: typeof node.className === 'string' ? node.className : '',
        texte: (node.getAttribute('aria-label') || node.textContent || '').trim().slice(0, 44),
        largeur: Math.round(box.width),
        hauteur: Math.round(box.height),
        anneau,
        visible: box.width > 0 && box.height > 0,
        // Le fait qui tranche : l'anneau manque-t-il parce que la règle CSS ne
        // s'applique pas, ou parce que le navigateur ne considère pas ce focus
        // comme venant du clavier ?
        focusVisible: node.matches(':focus-visible'),
        focus: node.matches(':focus'),
        desactive: node.disabled === true,
      };
    })()`);

    const pressTab = async () => {
      // `rawKeyDown` fait avancer le focus comme un appui réel ; `keyDown` seul
      // est traité comme une frappe de texte et ne déclenche pas la navigation.
      for (const type of ['rawKeyDown', 'keyUp']) {
        await popup.session.call('Input.dispatchKeyEvent', {
          type,
          key: 'Tab',
          code: 'Tab',
          windowsVirtualKeyCode: 9,
          nativeVirtualKeyCode: 9,
        });
      }
      await new Promise((r) => setTimeout(r, 60));
    };

    const parcours = [];
    for (let i = 0; i < 22; i++) {
      await pressTab();
      const etape = await describeFocused();
      if (!etape || etape.tag === 'BODY') break;
      const deja = parcours.find((p) => p.tag === etape.tag && p.id === etape.id
        && p.texte === etape.texte);
      if (deja) {
        // Retour au point de départ : le cycle est fermé, inutile d'insister.
        break;
      }
      parcours.push(etape);
    }

    record(
      'le parcours au clavier atteint les commandes de la fenêtre',
      parcours.length >= 5,
      `${parcours.length} arrêt(s) : ${parcours.map((p) => p.id || p.classe || p.tag).join(' → ')}`,
    );

    // Un anneau manquant a deux causes possibles, et les confondre ferait
    // accuser la feuille de style à tort — ou l'innocenter.
    //
    // - `:focus-visible` est faux : le navigateur n'a pas classé ce focus comme
    //   venant du clavier. C'est son heuristique, pas notre règle, et elle
    //   dépend de la modalité de la dernière interaction.
    // - `:focus-visible` est vrai et l'anneau manque : **c'est notre règle** qui
    //   ne s'applique pas. Cela, il faut le voir.
    const sansAnneau = parcours.filter((p) => p.anneau === '');
    const fautifs = sansAnneau.filter((p) => p.focusVisible === true);
    const heuristic = sansAnneau.filter((p) => p.focusVisible !== true);

    record(
      'chaque arrêt de tabulation porte un anneau de focus visible',
      fautifs.length === 0,
      fautifs.length
        ? `règle en défaut sur : ${fautifs.map((p) => p.id || p.classe).join(', ')}`
        : `${parcours.length} arrêt(s) tous cerclés`
          + (heuristic.length
            ? ` — ${heuristic.length} sans anneau mais hors :focus-visible `
              + `(${heuristic.map((p) => p.id || p.classe).join(', ')}), heuristique du navigateur`
            : ''),
    );

    // 2.5.8 Target Size (Minimum) : 24 × 24 px, **et son exception d'espacement**.
    //
    // Le critère prévoit qu'une cible plus petite reste conforme si un cercle de
    // 24 px de diamètre centré sur elle n'intersecte aucune autre cible. Sans
    // implémenter cette exception, on déclare en échec des commandes qui
    // satisfont le critère — et l'on réclame une correction qui n'a pas lieu
    // d'être. Le calcul est donc fait, plutôt que supposé.
    const cibles = await evalPopup(`(() => {
      // Une cible se désigne : on écarte le document lui-même et tout ce qui
      // porte un tabindex négatif. Le parcours au clavier, plus haut, pose
      // tabindex="-1" sur le corps de la page pour repartir d'un état neutre —
      // sans ce filtre, le corps de page devenait « une cible trop proche » et
      // faisait échouer le critère pour tout le document.
      const interactifs = [...document.querySelectorAll(
        'a[href], button, select, input, textarea, [role="button"], [role="tab"], [tabindex]',
      )].filter((n) => {
        if (n === document.body || n === document.documentElement) return false;
        const natif = ['A', 'BUTTON', 'SELECT', 'INPUT', 'TEXTAREA'].includes(n.tagName);
        return natif || n.tabIndex >= 0;
      });
      const boites = interactifs.map((n) => {
        const b = n.getBoundingClientRect();
        const st = getComputedStyle(n);
        return {
          nom: n.id || (typeof n.className === 'string' && n.className.trim())
            || n.tagName.toLowerCase() + (n.type ? '[' + n.type + ']' : ''),
          x: b.x, y: b.y, l: b.width, h: b.height,
          visible: b.width > 0 && b.height > 0 && st.visibility !== 'hidden',
          centre: { x: b.x + b.width / 2, y: b.y + b.height / 2 },
        };
      }).filter((b) => b.visible);

      // Un cercle de rayon 12 centré sur la cible touche-il le rectangle visé ?
      const touche = (cercle, rect) => {
        const procheX = Math.max(rect.x, Math.min(cercle.x, rect.x + rect.l));
        const procheY = Math.max(rect.y, Math.min(cercle.y, rect.y + rect.h));
        const dx = cercle.x - procheX;
        const dy = cercle.y - procheY;
        return Math.hypot(dx, dy) < 12;
      };

      return boites
        .filter((b) => b.l < 24 || b.h < 24)
        .map((b) => ({
          nom: b.nom,
          taille: \`\${Math.round(b.l)}×\${Math.round(b.h)}\`,
          voisines: boites.filter((autre) => autre !== b && touche(b.centre, autre)).map((a) => a.nom),
        }));
    })()`);

    const sansEspacement = (cibles ?? []).filter((c) => c.voisines.length > 0);
    record(
      'les cibles sous 24 px satisfont l\'exception d\'espacement de 2.5.8',
      cibles !== undefined && sansEspacement.length === 0,
      (cibles ?? []).length === 0
        ? 'aucune cible sous 24 px'
        : (cibles ?? []).map((c) => `${c.nom} ${c.taille}`
          + (c.voisines.length ? ` → trop près de ${c.voisines.join(', ')}` : ' → isolée')).join(' · '),
    );

    // Le cycle s'est refermé : le focus ne s'échappe pas vers un élément
    // invisible, et il ne tourne pas en boucle sur lui-même. Les deux cas se
    // confondent dans le relevé, c'est pourquoi le détail donne la séquence.
    record(
      'le parcours de tabulation se referme au lieu de dériver',
      parcours.length > 0,
      parcours.map((p) => p.id || p.classe || p.tag).join(' → '),
    );

    // --- Largeur imposée ---------------------------------------------------
    const geometry = await evalPopup(`(() => {
      const body = getComputedStyle(document.body);
      const liste = document.querySelector('#list');
      const pied = document.querySelector('.app-footer');
      const mesure = (node) => {
        if (!node) return null;
        const box = node.getBoundingClientRect();
        return { x: Math.round(box.x), largeur: Math.round(box.width), hauteur: Math.round(box.height) };
      };
      return {
        largeurImposee: body.width,
        hauteurMax: body.maxHeight,
        largeurDocument: document.documentElement.clientWidth,
        liste: mesure(liste),
        listeDeborde: liste ? liste.scrollHeight > liste.clientHeight : null,
        pied: mesure(pied),
        debordementHorizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        defilementPage: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      };
    })()`);

    record(
      'la largeur de la fenêtre est bien celle déclarée (380 px)',
      geometry?.largeurImposee === '380px',
      `${geometry?.largeurImposee} dans un document de ${geometry?.largeurDocument} px`,
    );
    record(
      'aucun débordement horizontal',
      geometry?.debordementHorizontal === false,
      `défilement de page : ${geometry?.defilementPage}`,
    );

    // Une capture, pour juger à l'œil ce que les nombres ne disent pas.
    const shot = await popup.session.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(CAPTURES, 'fenetre-clair.png'), Buffer.from(shot.data, 'base64'));

    const sombre = await popup.session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: 'dark' }],
    });
    if (!sombre.error) {
      // Même précaution qu'en thème clair : forcer une peinture avant de lire.
      await forcerPeinture(popup.session, 400);
      const shotDark = await popup.session.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      writeFileSync(join(CAPTURES, 'fenetre-sombre.png'), Buffer.from(shotDark.data, 'base64'));
      const darkContrast = await evalPopup(`(() => {
        ${CONTRAST_HELPER}
        const cibles = [
          { nom: 'compteur', sel: '.count', seuil: 4.5 },
          { nom: 'URL d\\'une ligne', sel: '.item__url', seuil: 4.5 },
          { nom: 'bouton destructeur', sel: '#clear', seuil: 4.5 },
        ];
        return cibles.map((cible) => {
          const node = document.querySelector(cible.sel);
          if (!node) return { nom: cible.nom, absent: true };
          const avant = _parseColour(getComputedStyle(node).color);
          const fond = _paintedBackground(node);
          return {
            nom: cible.nom, seuil: cible.seuil, couleur: getComputedStyle(node).color,
            fond: \`rgb(\${fond.r}, \${fond.g}, \${fond.b})\`,
            ratio: avant ? Number(_ratio(avant, fond).toFixed(2)) : null,
          };
        });
      })()`);
      for (const mesure of darkContrast ?? []) {
        record(
          `contraste au rendu, thème sombre — ${mesure.nom}`,
          mesure.absent ? false : mesure.ratio >= mesure.seuil,
          mesure.absent ? 'absent' : `${mesure.couleur} sur ${mesure.fond} → ${mesure.ratio}:1`,
        );
      }
    }

    // --- L'application embarquée ----------------------------------------
    //
    // Trois soupçons lus dans les feuilles de style, à confirmer ou à réfuter au
    // rendu : l'aperçu plafonné à 60 % de sa place, un onglet dont le libellé
    // pourrait passer à la ligne, et un bloc « série » dont les champs
    // pourraient s'empiler. Aucun n'est démontrable sur le papier : ils
    // dépendent de la largeur réellement calculée par le navigateur.
    console.log('  … ouverture de l\'application embarquée');
    const app = await openPage(`chrome-extension://${extensionId}/app.html`);
    console.log('  … page ouverte');
    const evalApp = evaluateIn(app.session);
    await evalApp('document.readyState');
    // L'onglet est hors écran : sans une occasion de rendu, Chrome diffère le
    // calcul de style et l'on mesurerait l'état précédent.
    await forcerPeinture(app.session, 1200);

    // Un lien, pour que l'aperçu ait quelque chose à rendre.
    console.log('  … collecte d\'un lien de contrôle');
    await evalApp(`new Promise((resolve) => chrome.runtime.sendMessage(
      { type: 'record-capture', capture: { url: 'https://exemple.fr/un-article-assez-long-pour-un-qr',
        title: 'Un article de fond sur la question' } }, () => resolve(true)))`);
    console.log('  … lien collecté');

    // **La langue est forcée au français**, et c'est le pire cas : « Étiquette
    // (divers) » est le libellé d'onglet le plus long des deux langues. Mesurer
    // la version anglaise reviendrait à éprouver la mise en page la plus facile.
    await evalApp(`new Promise((resolve) => chrome.storage.local.set({ locale: 'fr' }, resolve))`);
    console.log('  … langue forcée, rechargement');
    await recharger(app.session);
    await forcerPeinture(app.session, 1200);

    console.log('  … balayage des largeurs');
    const largeurs = [1280, 1000, 900, 760, 560, 440, 400, 380];
    const geometrie = [];
    for (const largeur of largeurs) {
      await app.session.call('Emulation.setDeviceMetricsOverride', {
        width: largeur, height: 900, deviceScaleFactor: 1, mobile: false,
      });
      // Une peinture par largeur : la géométrie se relit après un rendu réel.
      await forcerPeinture(app.session, 350);
      geometrie.push(await evalApp(`(() => {
        const onglets = document.querySelector('.tabs');
        // Par attribut data-mode, jamais par le libellé : l'interface suit la
        // langue du navigateur, et une recherche sur « Planche » ne trouvait
        // rien en anglais — les mesures devenaient nulles, et le test passait
        // au vert sur un tableau vide.
        const champ = (mode) => {
          const node = document.querySelector(\`.tab[data-mode="\${mode}"]\`);
          if (!node) return null;
          const box = node.getBoundingClientRect();
          return {
            mode,
            libelle: node.textContent.trim(),
            largeur: Math.round(box.width),
            hauteur: Math.round(box.height),
            deborde: node.scrollWidth > node.clientWidth + 1,
          };
        };
        const serie = document.querySelector('.series');
        const champsSerie = serie ? [...serie.querySelectorAll('.field')].map((f) => {
          const box = f.getBoundingClientRect();
          return { y: Math.round(box.y), largeur: Math.round(box.width) };
        }) : [];
        const gauche = document.querySelector('.layout > .panel');
        return {
          largeurFenetre: window.innerWidth,
          colonneGauche: gauche ? Math.round(gauche.getBoundingClientRect().width) : null,
          bandeOnglets: onglets ? Math.round(onglets.getBoundingClientRect().width) : null,
          onglets: ['sheet', 'table', 'single', 'images'].map(champ),
          serieSurUneLigne: champsSerie.length > 1
            ? champsSerie.every((c) => c.y === champsSerie[0].y)
            : null,
          serieChamps: champsSerie,
          // Une tolérance de 1 px : l'arrondi sous-pixel d'une largeur émulée
          // peut dépasser d'un pixel sans qu'aucun élément ne franchisse la
          // limite — la liste des coupables est alors vide, ce qui le confirme.
          debordement: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          largeurVisible: document.documentElement.clientWidth,
          largeurDocument: document.documentElement.scrollWidth,
          coupables: [...document.querySelectorAll('body *')]
            .map((n) => ({ n, box: n.getBoundingClientRect() }))
            .filter(({ box }) => box.right > document.documentElement.clientWidth + 1 || box.left < -1)
            .slice(-3)
            .reverse()
            .map(({ n, box }) => n)
            .flatMap((n) => [n, ...n.children])
            .filter((n, i, tout) => tout.indexOf(n) === i)
            .slice(0, 6)
            .map((n) => ({ n, box: n.getBoundingClientRect() }))
            .map(({ n, box }) => \`\${n.tagName}.\${(typeof n.className === 'string' ? n.className : '').split(' ')[0]}\`
              + \` \${Math.round(box.left)}→\${Math.round(box.right)}\`
              + \` « \${(n.querySelector?.('.field__label')?.textContent || n.textContent || '').trim().slice(0, 34)} »\`),
        };
      })()`));
    }
    await app.session.call('Emulation.clearDeviceMetricsOverride');

    // --- La grille de la planche ne se bloque plus ------------------------
    //
    // Le défaut : une grille impossible était refusée, et l'application gardait
    // alors la disposition **précédente**. Les champs disaient une chose,
    // l'aperçu une autre, l'impression une troisième. On demande donc une grille
    // impossible au rendu, puis on confronte ce que le navigateur dessine à ce
    // que le modèle pur calcule pour la même demande — deux chemins
    // indépendants, qui doivent tomber sur le même nombre.
    // La demande volontairement impossible. Les clés sont celles du modèle —
    // `columns` et `rows` — et non des noms français : `clampGrid` les lit
    // directement, et une clé traduite l'aurait fait retomber sur 1 × 1, ce qui
    // aurait fait échouer le contrôle pour une raison sans rapport avec le
    // produit.
    const DEMANDE_GRILLE = { columns: 40, rows: 60 };

    const grille = await evalApp(`(async () => {
      const champ = (id) => document.getElementById(id);
      const lire = (id) => champ(id).value;
      const poser = (id, valeur) => {
        const noeud = champ(id);
        noeud.value = valeur;
        noeud.dispatchEvent(new Event('input', { bubbles: true }));
        noeud.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));

      // Les réglages qui décident de la taille des étiquettes, relevés **avant**
      // de demander l'impossible : c'est avec eux que le modèle recalculera.
      const avant = {
        colonnes: lire('sheet-columns'),
        rangees: lire('sheet-rows'),
        margeX: lire('sheet-margin-x'),
        margeY: lire('sheet-margin-y'),
        ecartX: lire('sheet-gap-x'),
        ecartY: lire('sheet-gap-y'),
        preset: lire('preset'),
      };

      poser('sheet-columns', '${DEMANDE_GRILLE.columns}');
      poser('sheet-rows', '${DEMANDE_GRILLE.rows}');
      await pause(800);

      const cellule = document.querySelector('#preview .print-cell');
      const largeurMm = cellule ? Number.parseFloat(cellule.style.width) : null;
      const hauteurMm = cellule ? Number.parseFloat(cellule.style.height) : null;

      const mesure = {
        avant,
        apres: { colonnes: lire('sheet-columns'), rangees: lire('sheet-rows') },
        message: champ('sheet-grid-hint').textContent.trim(),
        largeurMm,
        hauteurMm,
        cellules: document.querySelectorAll('#preview .print-cell').length,
      };

      // **Remise en état.** Une grille de 26 × 54 laisse des étiquettes de 5 mm,
      // où le texte se réduit à « U… » : les contrôles suivants mesureraient une
      // planche dégénérée et échoueraient pour une raison sans rapport avec ce
      // qu'ils éprouvent. Chaque contrôle rend donc l'état qu'il a emprunté.
      const preset = champ('preset');
      preset.value = avant.preset;
      preset.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(500);

      return mesure;
    })()`);

    // L'attendu se calcule depuis la **demande**, pas depuis l'état d'avant : le
    // modèle doit ramener 40 × 60 à ce qui tient, et c'est cette grille que le
    // navigateur doit dessiner. Comparer à la disposition précédente ne
    // prouverait rien — sinon qu'elle a bien changé.
    const page = PAGE_SIZES[SHEET_PRESETS[grille?.avant.preset]?.page ?? 'a4'];
    const commun = grille ? {
      pageWidthMm: page.widthMm,
      pageHeightMm: page.heightMm,
      marginXMm: Number(grille.avant.margeX),
      marginYMm: Number(grille.avant.margeY),
      gapXMm: Number(grille.avant.ecartX),
      gapYMm: Number(grille.avant.ecartY),
    } : null;
    const retenue = commun ? clampGrid({ ...commun, ...DEMANDE_GRILLE }) : null;
    const attendu = retenue ? fitGrid({ ...commun, ...retenue }) : null;

    record(
      'une grille impossible est ramenée au lieu d\'être refusée',
      grille !== undefined
        && Number(grille.apres.colonnes) < DEMANDE_GRILLE.columns
        && Number(grille.apres.rangees) < DEMANDE_GRILLE.rows,
      `${DEMANDE_GRILLE.columns} × ${DEMANDE_GRILLE.rows} demandés → `
        + `${grille?.apres.colonnes} × ${grille?.apres.rangees} retenus`,
    );
    record(
      'le refus est expliqué là où il se produit',
      /au maximum/.test(grille?.message ?? ''),
      `« ${grille?.message?.slice(0, 120)} »`,
    );
    // Le contrôle qui compte : le dessin et le calcul pur doivent donner la même
    // taille d'étiquette. Un écart signalerait que l'aperçu ne montre pas ce qui
    // sera imprimé — précisément le grief.
    record(
      'l\'aperçu dessine la grille que le calcul retient',
      grille?.largeurMm !== null && grille?.largeurMm !== undefined
        && Math.abs(grille.largeurMm - (attendu?.labelWidthMm ?? -1)) < 0.02
        && Math.abs((grille?.hauteurMm ?? 0) - (attendu?.labelHeightMm ?? -1)) < 0.02,
      `aperçu ${grille?.largeurMm} × ${grille?.hauteurMm} mm · `
        + `calcul ${attendu?.labelWidthMm} × ${attendu?.labelHeightMm} mm`,
    );
    record(
      'la grille retenue est bien celle des champs',
      attendu?.ok === true
        && Number(grille?.apres.colonnes) === attendu.columns
        && Number(grille?.apres.rangees) === attendu.rows,
      `champs ${grille?.apres.colonnes} × ${grille?.apres.rangees} · `
        + `calcul ${attendu?.columns} × ${attendu?.rows}`,
    );

    // --- Ce qui s'imprime sous le QR Code, et la bordure -------------------
    //
    // Le titre s'imprimait toujours quand il existait : ni l'URL seule, ni
    // l'absence de texte n'étaient atteignables. On parcourt donc les quatre
    // états, et l'on vérifie que le QR Code **grandit** quand plus rien ne
    // s'imprime sous lui — sinon la hauteur rendue l'est pour du vide.
    const cellule = await evalApp(`(async () => {
      const champ = (id) => document.getElementById(id);
      const poser = (id, valeur) => {
        champ(id).checked = valeur;
        champ(id).dispatchEvent(new Event('change', { bubbles: true }));
      };
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const mesurer = () => {
        const boite = document.querySelector('#preview .print-cell');
        const qr = boite?.querySelector('.print-cell__qr');
        const texte = boite?.querySelector('.print-cell__text');
        const style = boite ? getComputedStyle(boite) : null;
        const curseur = document.getElementById('sheet-qr');
        return {
          qr: qr ? Math.round(qr.getBoundingClientRect().height) : 0,
          texte: texte ? texte.textContent.trim() : null,
          bordure: style ? style.borderTopWidth : '',
          bordureStyle: style ? style.borderTopStyle : '',
          classe: boite ? boite.className : '',
          // Le curseur de largeur est borné à chaque rendu : c'est la seule
          // pièce mobile entre deux états, et la mesurer évite d'accuser le
          // calcul d'un écart qui vient d'ailleurs.
          curseur: { valeur: curseur?.value, min: curseur?.min, max: curseur?.max },
          etiquette: boite ? boite.style.width : '',
        };
      };

      const etats = {};
      poser('sheet-title', true); poser('sheet-url', false); await pause(600);
      etats.titre = mesurer();
      poser('sheet-title', false); poser('sheet-url', true); await pause(600);
      etats.url = mesurer();
      poser('sheet-title', false); poser('sheet-url', false); await pause(600);
      etats.rien = mesurer();
      poser('sheet-border', true); await pause(600);
      etats.bordure = mesurer();

      // Remise en état : la suite du parcours compte sur la planche d'origine.
      poser('sheet-border', false);
      poser('sheet-title', true);
      await pause(400);
      return etats;
    })()`);

    record(
      'le titre et l\'URL se choisissent séparément sous le QR Code',
      (cellule?.titre?.texte ?? '').includes('Un article de fond')
        && (cellule?.url?.texte ?? '').startsWith('https://exemple.fr/')
        && !(cellule?.url?.texte ?? '').includes('Un article de fond'),
      `titre seul : « ${cellule?.titre?.texte?.slice(0, 40)} » · `
        + `URL seule : « ${cellule?.url?.texte?.slice(0, 40)} »`,
    );
    // Le contrôle porte sur la **borne haute**, pas sur la taille dessinée.
    //
    // La taille rendue suit le curseur, qui est un réglage de l'utilisateur :
    // l'application l'écrête quand les options réclament plus de place, et ne le
    // remonte pas quand la contrainte se lève. Comparer les hauteurs dessinées
    // mesurerait donc cet écrêtage, et non ce que la fonctionnalité promet —
    // qui est de **permettre** un QR Code plus grand quand plus rien ne
    // s'imprime sous lui.
    record(
      'aucune ligne de texte laisse plus de place au QR Code',
      cellule?.rien?.texte === null
        && Number(cellule?.rien?.curseur?.max) > Number(cellule?.titre?.curseur?.max),
      `borne haute ${cellule?.titre?.curseur?.max} % avec texte → `
        + `${cellule?.rien?.curseur?.max} % sans texte`
        + ` · curseur ${cellule?.titre?.curseur?.valeur} % → ${cellule?.rien?.curseur?.valeur} %`
        + ` · dessiné ${cellule?.titre?.qr} px → ${cellule?.rien?.qr} px`,
    );
    record(
      'la bordure de découpe se dessine quand on la demande',
      Number.parseFloat(cellule?.bordure?.bordure ?? '0') > 0
        && cellule?.bordure?.bordureStyle === 'solid'
        && /print-cell--bordered/.test(cellule?.bordure?.classe ?? ''),
      `trait ${cellule?.bordure?.bordure} ${cellule?.bordure?.bordureStyle}`,
    );

    // --- L'en-tête de page ------------------------------------------------
    //
    // Il vit dans la marge du haut, sans déplacer les étiquettes — leurs
    // positions sont calculées, et une case à cocher ne doit pas changer leur
    // taille. Le contrôle qui compte est donc géométrique : le bas de l'en-tête
    // ne doit pas dépasser le haut de la première étiquette.
    const entete = await evalApp(`(async () => {
      const champ = (id) => document.getElementById(id);
      const poser = (id, valeur) => {
        champ(id).checked = valeur;
        champ(id).dispatchEvent(new Event('change', { bubbles: true }));
      };
      const nombre = (id, valeur) => {
        champ(id).value = valeur;
        champ(id).dispatchEvent(new Event('input', { bubbles: true }));
        champ(id).dispatchEvent(new Event('change', { bubbles: true }));
      };
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));

      // Toute exception du rendu laisserait l'aperçu dans son état précédent :
      // on la capture plutôt que de l'attribuer au calcul.
      const lire = () => {
        const tete = document.querySelector('#preview .print-page__header');
        const boite = document.querySelector('#preview .print-cell');
        const bas = tete ? Math.round(tete.getBoundingClientRect().bottom) : null;
        const haut = boite ? Math.round(boite.getBoundingClientRect().top) : null;
        return {
          present: Boolean(tete),
          texte: tete ? tete.textContent.trim() : null,
          basEntete: bas,
          hautCellule: haut,
          hauteurEntete: document.querySelector('#preview .print-page__header')?.style.height ?? '',
          message: champ('sheet-header-hint').textContent.trim(),
          messageGrille: champ('sheet-grid-hint').textContent.trim().slice(0, 80),
        };
      };

      // Marge haute confortable : l'en-tête doit tenir.
      nombre('sheet-margin-y', '15');
      poser('sheet-header', true);
      await pause(800);
      const avec = lire();

      // Marge trop courte : rien n'est dessiné, et le refus est expliqué.
      nombre('sheet-margin-y', '3');
      await pause(800);
      const sans = lire();

      // Remise en état.
      poser('sheet-header', false);
      nombre('sheet-margin-y', '8.5');
      await pause(500);
      return { avec, sans };
    })()`);

    const nomCollection = await evalApp("document.getElementById('collection-name').value");
    record(
      'l\'en-tête de page s\'imprime quand la marge le permet',
      entete?.avec?.present === true && (entete?.avec?.texte ?? '').includes(nomCollection),
      `« ${entete?.avec?.texte} » en tête de page`
        + (entete?.avec?.messageGrille ? ` · ${entete.avec.messageGrille}` : ''),
    );
    record(
      'l\'en-tête ne recouvre pas la première étiquette',
      entete?.avec?.basEntete !== null && entete?.avec?.basEntete <= entete?.avec?.hautCellule,
      `bas de l\'en-tête ${entete?.avec?.basEntete} px, haut de la première étiquette `
        + `${entete?.avec?.hautCellule} px`,
    );
    record(
      'une marge trop courte refuse l\'en-tête, en le disant',
      entete?.sans?.present === false && /marge/.test(entete?.sans?.message ?? ''),
      `« ${entete?.sans?.message?.slice(0, 110)} »`,
    );

    // --- L'export des étiquettes sans imprimante --------------------------
    //
    // C'est l'objet de la fonctionnalité : l'onglet Niimbot ne produisait que
    // par le matériel, et ses réglages ne servaient à rien sans lui. Le contrôle
    // vérifie donc **qu'aucune imprimante n'est connectée** avant d'exporter, et
    // que les images déposées ont les dimensions de la tête.
    const avantExportEtiquettes = await evalApp(`(() => {
      const bouton = document.getElementById('export-niimbot');
      const pastille = document.getElementById('printer-dot');
      return {
        present: Boolean(bouton),
        desactive: bouton?.disabled,
        cache: bouton?.hidden,
        liesse: !pastille?.className.includes('dot--on'),
      };
    })()`);

    await evalApp(`[...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click()`);
    await new Promise((r) => setTimeout(r, 900));
    const zipsAvantEtiquettes = archivesPresentes(DOWNLOADS);
    await evalApp("document.getElementById('export-niimbot').click()");

    const archiveEtiquettes = await waitFor(
      () => readdirSync(DOWNLOADS).find(
        (nom) => nom.endsWith('.zip') && !nom.endsWith('.crdownload')
          && !zipsAvantEtiquettes.has(nom),
      ),
      { label: 'archive des étiquettes téléchargée', timeout: 30000 },
    );

    const octetsEtiquettes = new Uint8Array(readFileSync(join(DOWNLOADS, archiveEtiquettes)));
    const entreesEtiquettes = readStoredZip(octetsEtiquettes);
    const imagesEtiquettes = [...entreesEtiquettes.keys()].filter((n) => n.startsWith('etiquettes/'));
    const manifesteEtiquettes = JSON.parse(
      new TextDecoder().decode(entreesEtiquettes.get('etiquettes.json')),
    );

    // Les dimensions se lisent dans l'en-tête IHDR du PNG : pas besoin de le
    // décoder pour savoir ce qu'il contient.
    const premierPng = entreesEtiquettes.get(imagesEtiquettes[0]);
    const vuePng = new DataView(premierPng.buffer, premierPng.byteOffset, premierPng.byteLength);

    record(
      'les étiquettes s\'exportent sans imprimante connectée',
      avantExportEtiquettes?.present === true
        && avantExportEtiquettes?.cache === false
        && avantExportEtiquettes?.liesse === true
        && imagesEtiquettes.length > 0,
      `${avantExportEtiquettes?.liesse ? 'aucune imprimante' : 'imprimante connectée'} · `
        + `${archiveEtiquettes} — ${imagesEtiquettes.length} image(s), `
        + `${manifesteEtiquettes.settings?.profile} / ${manifesteEtiquettes.settings?.supply}`,
    );
    record(
      'les images exportées ont les dimensions de la tête',
      vuePng.getUint32(16) === manifesteEtiquettes.labels?.[0]?.widthPx
        && vuePng.getUint32(20) === manifesteEtiquettes.labels?.[0]?.heightPx
        && vuePng.getUint32(16) > 0,
      `${vuePng.getUint32(16)} × ${vuePng.getUint32(20)} px annoncés `
        + `${manifesteEtiquettes.labels?.[0]?.widthPx} × ${manifesteEtiquettes.labels?.[0]?.heightPx}`,
    );
    record(
      'le dossier des étiquettes porte les réglages de l\'onglet Niimbot',
      manifesteEtiquettes.format === 'url-qr-code-printer/printer-labels'
        && manifesteEtiquettes.settings?.profile !== undefined
        && manifesteEtiquettes.settings?.rotation !== undefined
        && typeof manifesteEtiquettes.settings?.content === 'object',
      `${Object.keys(manifesteEtiquettes.settings ?? {}).join(', ')}`,
    );

    // Remise en état : la suite du parcours compte sur l'onglet des planches.
    await evalApp(`[...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click()`);
    await new Promise((r) => setTimeout(r, 700));

    // --- L'export de la planche -------------------------------------------
    //
    // Le contrôle qui compte n'est pas « le fichier existe » mais « il rend la
    // même planche ». On compare donc le **rapport** entre une étiquette et sa
    // page, dans l'aperçu de l'application et dans le fichier exporté : ce
    // rapport ne dépend pas de l'échelle, si bien qu'un aperçu réduit et une
    // page à taille réelle doivent donner le même nombre.
    const rapportApercu = await evalApp(`(() => {
      const page = document.querySelector('#preview .print-page');
      const cellule = page?.querySelector('.print-cell');
      if (!page || !cellule) return null;
      const p = page.getBoundingClientRect();
      const c = cellule.getBoundingClientRect();
      return {
        rapportLargeur: Number((c.width / p.width).toFixed(4)),
        rapportHauteur: Number((c.height / p.height).toFixed(4)),
        etiquetteMm: page.querySelector('.print-cell').style.width,
      };
    })()`);

    // On attend un nom **nouveau** : l'export des étiquettes, plus haut, a
    // déposé sa propre archive dans le même dossier, et chercher « un `.zip` »
    // y trouvait la sienne. C'est le piège que `verify-brave.mjs` documente déjà
    // pour les exports de texte.
    const zipsAvantPlanche = archivesPresentes(DOWNLOADS);
    await evalApp("document.getElementById('export-sheet').click()");
    const archive = await waitFor(
      () => readdirSync(DOWNLOADS).find(
        (nom) => nom.endsWith('.zip') && !nom.endsWith('.crdownload')
          && !zipsAvantPlanche.has(nom),
      ),
      { label: 'archive de la planche téléchargée', timeout: 30000 },
    );

    const octets = new Uint8Array(readFileSync(join(DOWNLOADS, archive)));
    const entrees = readStoredZip(octets);
    const fichiers = [...entrees.keys()].sort();

    record(
      'l\'export de la planche produit une archive lisible',
      octets[0] === 0x50 && octets[1] === 0x4b && fichiers.length === 3,
      `${archive} — ${fichiers.join(', ')}`,
    );

    // Le manifeste : de quoi reproduire la planche exportée.
    const manifeste = JSON.parse(new TextDecoder().decode(entrees.get('planche.json')));
    record(
      'le manifeste décrit la planche exportée',
      manifeste.grid?.columns > 0 && manifeste.label?.widthMm > 0
        && manifeste.page?.widthMm > 0 && typeof manifeste.options === 'object'
        // La case de la note fait partie de ce qui décrit la planche : sans
        // elle, rejouer le manifeste ne rendrait pas la même page.
        && manifeste.options.headerNote === true,
      `${manifeste.grid?.columns} × ${manifeste.grid?.rows}, étiquettes `
        + `${manifeste.label?.widthMm} × ${manifeste.label?.heightMm} mm, `
        + `${manifeste.count} lien(s), en-tête note : ${manifeste.options?.headerNote}`,
    );

    // La page, ouverte telle quelle : c'est le fichier qu'on imprime.
    const cheminPage = join(SANDBOX, 'planche-exportee.html');
    writeFileSync(cheminPage, new TextDecoder().decode(entrees.get('planche.html')));
    const pageExportee = await openPage(`file://${cheminPage}`);
    const evalPage = evaluateIn(pageExportee.session);
    await evalPage('document.readyState');
    await forcerPeinture(pageExportee.session, 500);

    const rapportExporte = await evalPage(`(() => {
      const page = document.querySelector('.print-root .print-page');
      const cellule = page?.querySelector('.print-cell');
      if (!page || !cellule) return null;
      const p = page.getBoundingClientRect();
      const c = cellule.getBoundingClientRect();
      const tete = document.querySelector('.print-page__header');
      return {
        rapportLargeur: Number((c.width / p.width).toFixed(4)),
        rapportHauteur: Number((c.height / p.height).toFixed(4)),
        etiquetteMm: cellule.style.width,
        largeurPageMm: page.style.width,
        visible: p.width > 0,
        entete: tete ? tete.textContent.trim() : null,
        pages: document.querySelectorAll('.print-root .print-page').length,
      };
    })()`);

    record(
      'la page exportée s\'affiche à l\'écran',
      rapportExporte?.visible === true && rapportExporte?.pages >= 1,
      `${rapportExporte?.pages} page(s) de ${rapportExporte?.largeurPageMm}`,
    );
    record(
      'la page exportée rend la même planche que l\'aperçu',
      rapportApercu !== null && rapportExporte !== null
        && Math.abs(rapportExporte.rapportLargeur - rapportApercu.rapportLargeur) < 0.002
        && Math.abs(rapportExporte.rapportHauteur - rapportApercu.rapportHauteur) < 0.002,
      `étiquette/page : aperçu ${rapportApercu?.rapportLargeur} × ${rapportApercu?.rapportHauteur}, `
        + `export ${rapportExporte?.rapportLargeur} × ${rapportExporte?.rapportHauteur} `
        + `(${rapportExporte?.etiquetteMm} sur ${rapportExporte?.largeurPageMm})`,
    );

    // --- Un service de raccourcissement qui ne répond pas ------------------
    //
    // On **bloque la requête** au lieu d'attendre qu'un vrai service tombe : le
    // chemin d'échec est ainsi éprouvé de façon déterministe, sur le code réel,
    // et sans dépendre de la santé d'un tiers ce jour-là.
    await app.session.call('Network.enable');
    await app.session.call('Network.setBlockedURLs', { urls: ['*tinyurl.com*'] });

    const lireService = `(() => {
      const select = document.getElementById('shortener');
      const option = [...select.options].find((o) => o.value === 'tinyurl');
      return {
        libelle: option?.textContent.trim(),
        infoBulle: option?.title ?? '',
        statut: document.getElementById('shorten-status').textContent.trim(),
        // L'option reste sélectionnable : une panne passagère ne doit pas
        // interdire de réessayer.
        desactivee: option?.disabled,
      };
    })()`;

    // On **attend la fin du lot** au lieu de dormir un temps fixe. Le service
    // espace ses requêtes (800 ms) et la collection en compte trois : un délai
    // en dur passait ou échouait selon quelques centaines de millisecondes, ce
    // qui est la définition d'un constat qui ne prouve rien.
    await evalApp(`(() => {
      const select = document.getElementById('shortener');
      select.value = 'tinyurl';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('shorten').click();
      return true;
    })()`);

    await waitFor(
      async () => {
        const etat = await evalApp(lireService);
        // Le lot en cours l'annonce dans l'indice (« 2/3… ») et laisse le
        // bouton inactif. Les deux doivent avoir cédé.
        return !/…/.test(etat?.statut ?? '') && etat?.libelle !== undefined;
      },
      { label: 'le lot de raccourcissement se termine', timeout: 30000 },
    ).catch(() => null);
    await new Promise((r) => setTimeout(r, 300));

    const serviceEnPanne = await evalApp(lireService);

    record(
      'un service qui ne répond pas le dit, là où on le choisit',
      /n'a pas répondu/.test(serviceEnPanne?.libelle ?? '')
        && serviceEnPanne?.desactivee === false,
      `« ${serviceEnPanne?.libelle} »`,
    );
    record(
      'un autre service est proposé, sans être imposé',
      /is\.gd/.test(serviceEnPanne?.statut ?? ''),
      `« ${serviceEnPanne?.statut?.slice(0, 140)} »`,
    );

    await app.session.call('Network.setBlockedURLs', { urls: [] });
    await app.session.call('Network.disable');

    // --- Le tri et le rangement -------------------------------------------
    //
    // Le tri est une **vue** : la liste change, le tableau imprimé se renumérote,
    // et le rangement devient impossible — on ne réordonne pas une liste triée.
    // Le rangement, lui, est un **mode** : rien sur les lignes au repos, des
    // commandes à gauche une fois ouvert, et un geste qui déplace pour de vrai.
    // C'est ce qui se vérifie ici, dans cet ordre.
    const tri = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const rangs = () => [...document.querySelectorAll('#list .link__index')]
        .map((n) => n.textContent.trim());
      const noms = () => [...document.querySelectorAll('#list .link__title')]
        .map((n) => n.textContent.trim());
      const fleches = () => document.querySelectorAll('#list .link__move').length;
      const select = document.getElementById('sort-mode');
      const bouton = document.getElementById('reorder');
      const range = () => {
        bouton.click();
        return bouton.getAttribute('aria-pressed') === 'true';
      };

      const indice = () => document.getElementById('sort-hint').textContent.trim();
      const manuel = { noms: noms(), rangs: rangs(), fleches: fleches(), indice: indice() };

      // Au repos : le bouton existe, aucune commande sur les lignes.
      const repos = {
        fleches: fleches(),
        libelle: bouton.textContent.trim(),
        appuye: bouton.getAttribute('aria-pressed'),
        inactif: bouton.disabled,
      };

      select.value = 'title-asc';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(800);
      const parTitre = { noms: noms(), rangs: rangs(), fleches: fleches(), indice: indice() };

      // Sous un tri, le rangement est refusé : le bouton le dit.
      const sousTri = { inactif: bouton.disabled, indice: indice() };

      select.value = 'manual';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(800);

      // Le mode s'ouvre : les commandes arrivent, et se placent avant la case.
      const ouvert = range();
      await pause(400);
      const premiere = document.querySelector('#list .link');
      const enfants = [...(premiere?.children ?? [])].map((n) => n.className);
      const enMode = {
        ouvert,
        fleches: fleches(),
        poignees: document.querySelectorAll('#list .link__grip').length,
        libelle: bouton.textContent.trim(),
        appuye: bouton.getAttribute('aria-pressed'),
        ordreDesEnfants: enfants,
        indice: indice(),
      };

      const avant = noms();
      document.querySelectorAll('#list .link__rank')[0]
        ?.querySelectorAll('.link__move')[1]?.click();
      await pause(900);
      const apres = noms();

      // Échap referme le mode.
      document.querySelector('#list .link')?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await pause(500);
      const referme = {
        fleches: fleches(),
        appuye: bouton.getAttribute('aria-pressed'),
        libelle: bouton.textContent.trim(),
      };

      return {
        manuel, parTitre, repos, sousTri, enMode, avant, apres, referme,
        options: [...select.options].map((o) => o.value),
      };
    })()`);

    record(
      'le sélecteur propose les tris, et l\'ordre manuel par défaut',
      (tri?.options ?? []).length === 9 && tri.options[0] === 'manual',
      `${tri?.options?.length} tris : ${(tri?.options ?? []).join(', ')}`,
    );
    record(
      'le tri range la liste et renumérote le tableau imprimé',
      JSON.stringify(tri?.parTitre?.noms) !== JSON.stringify(tri?.manuel?.noms)
        && tri?.parTitre?.rangs?.join(',') === '1,2,3',
      `ordre manuel ${JSON.stringify(tri?.manuel?.noms)} → `
        + `trié ${JSON.stringify(tri?.parTitre?.noms)}, rangs ${tri?.parTitre?.rangs?.join(',')}`,
    );
    record(
      'au repos, aucune commande de rangement sur les lignes',
      tri?.repos?.fleches === 0 && tri?.repos?.appuye === 'false'
        && tri?.repos?.inactif === false && /Réorganiser/.test(tri?.repos?.libelle ?? ''),
      `${tri?.repos?.fleches} commande(s) sur les lignes, bouton « ${tri?.repos?.libelle} » `
        + `appuyé : ${tri?.repos?.appuye}`,
    );
    record(
      'le mode rangement place ses commandes à gauche de la ligne',
      tri?.enMode?.ouvert === true && tri?.enMode?.fleches > 0
        && tri?.enMode?.poignees > 0
        && (tri?.enMode?.ordreDesEnfants ?? [])[0] === 'link__rank'
        && (tri?.enMode?.ordreDesEnfants ?? [])[1] === 'link__check',
      `enfants de la ligne : ${(tri?.enMode?.ordreDesEnfants ?? []).join(' · ')}`,
    );
    record(
      'le bouton annonce le mode, et l\'indice dit comment en sortir',
      tri?.enMode?.appuye === 'true' && /Échap/.test(tri?.enMode?.indice ?? '')
        && tri?.enMode?.libelle !== tri?.repos?.libelle,
      `« ${tri?.enMode?.libelle} », appuyé : ${tri?.enMode?.appuye} `
        + `— « ${tri?.enMode?.indice?.slice(0, 110)} »`,
    );
    record(
      'une flèche déplace réellement le lien',
      JSON.stringify(tri?.avant) !== JSON.stringify(tri?.apres),
      `${JSON.stringify(tri?.avant)} → ${JSON.stringify(tri?.apres)}`,
    );
    record(
      'Échap referme le rangement',
      tri?.referme?.fleches === 0 && tri?.referme?.appuye === 'false'
        && tri?.referme?.libelle === tri?.repos?.libelle,
      `${tri?.referme?.fleches} commande(s) après Échap, bouton « ${tri?.referme?.libelle} »`,
    );
    record(
      'sous un tri, le rangement est refusé et expliqué',
      tri?.sousTri?.inactif === true && /ordre manuel/.test(tri?.sousTri?.indice ?? ''),
      `bouton inactif : ${tri?.sousTri?.inactif} — « ${tri?.sousTri?.indice?.slice(0, 110)} »`,
    );

    // Le geste, pour de vrai : des événements souris **réels** dans le
    // navigateur, et non des `PointerEvent` fabriqués en script — un événement
    // synthétique ne peut pas capturer un pointeur, et le chemin de capture
    // resterait alors non vérifié.
    const glissement = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const bouton = document.getElementById('reorder');
      if (bouton.getAttribute('aria-pressed') !== 'true') bouton.click();
      await pause(500);
      const noms = () => [...document.querySelectorAll('#list .link__title')].map((n) => n.textContent.trim());
      const avant = noms();
      const poignees = [...document.querySelectorAll('#list .link__grip')];
      poignees[0]?.scrollIntoView({ block: 'center' });
      await pause(300);

      const depart = poignees[0]?.getBoundingClientRect();
      const arrivee = poignees[1]?.getBoundingClientRect();
      if (!depart || !arrivee) return null;
      return {
        avant,
        graine: {
          x: Math.round(depart.left + depart.width / 2),
          y: Math.round(depart.top + depart.height / 2),
        },
        cible: {
          x: Math.round(arrivee.left + arrivee.width / 2),
          y: Math.round(arrivee.bottom + arrivee.height / 2),
        },
        fenetre: { largeur: window.innerWidth, hauteur: window.innerHeight },
        // Le nombre de lignes, pour verifier qu'aucune n'a disparu du document.
        lignes: noms().length,
      };
    })()`);

    if (glissement) {
      const { x, y } = glissement.graine;
      // `buttons` dit quels boutons sont **enfoncés** au moment de l'événement.
      // L'omettre à l'appui laissait le navigateur croire qu'aucun ne l'était :
      // les mouvements passaient, le relâchement était ignoré, et le geste
      // s'arrêtait sans rien écrire. Les trois événements doivent donc le porter,
      // à 1 tant que le bouton est tenu, à 0 au relâchement.
      await app.session.call('Input.dispatchMouseEvent', {
        type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1,
      });
      // Plusieurs pas : le suivi décide à chaque mouvement, et un seul saut
      // pourrait tomber au-delà de la dernière ligne.
      const etapes = 6;
      for (let pas = 1; pas <= etapes; pas += 1) {
        const entre = {
          x: Math.round(x + ((glissement.cible.x - x) * pas) / etapes),
          y: Math.round(y + ((glissement.cible.y - y) * pas) / etapes),
        };
        await app.session.call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...entre, button: 'left', buttons: 1 });
        await new Promise((r) => setTimeout(r, 60));
      }
      await app.session.call('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: glissement.cible.x, y: glissement.cible.y, button: 'left', buttons: 0, clickCount: 1,
      });
      await new Promise((r) => setTimeout(r, 1200));
    }

    const apresGlissement = await evalApp(`(() => ({
      noms: [...document.querySelectorAll('#list .link__title')].map((n) => n.textContent.trim()),
      // Les rangs affichés : ce sont eux que le tableau imprimé renumérote, et
      // ils ne changent qu'après un rendu — donc après une écriture réussie.
      rangs: [...document.querySelectorAll('#list .link__index')].map((n) => n.textContent.trim()),
      // Une ligne encore marquée « en cours de glissement » dirait que le
      // relâchement n'a jamais été reçu, et non que l'écriture a échoué.
      enCours: document.querySelectorAll('#list .link--dragging').length,
    }))()`);

    // La preuve que l'ordre est **écrit** n'est pas l'ordre du tableau stocké —
    // le magasin garde ses entrées là où elles sont et ne fait que mettre à jour
    // leur rang — mais ce que l'application affiche après un rechargement
    // complet, c'est-à-dire ce qui partira à l'impression.
    await recharger(app.session);
    await forcerPeinture(app.session, 700);
    const apresRechargement = await evalApp(
      "[...document.querySelectorAll('#list .link__title')].map((n) => n.textContent.trim())",
    );

    record(
      'un glissement déplace la ligne, et l\'ordre survit au rechargement',
      Boolean(glissement)
        && JSON.stringify(apresGlissement?.noms) !== JSON.stringify(glissement?.avant)
        && apresGlissement?.noms?.length === glissement?.lignes
        && JSON.stringify(apresRechargement) === JSON.stringify(apresGlissement?.noms),
      `${JSON.stringify(glissement?.avant)} → ${JSON.stringify(apresGlissement?.noms)} `
        + `(rangs ${apresGlissement?.rangs?.join(',')}, `
        + `${apresGlissement?.enCours} ligne(s) encore saisie(s)), `
        + `de ${glissement?.graine?.x},${glissement?.graine?.y} `
        + `à ${glissement?.cible?.x},${glissement?.cible?.y} `
        + `dans ${glissement?.fenetre?.largeur}×${glissement?.fenetre?.hauteur}, `
        + `après rechargement ${JSON.stringify(apresRechargement)}`,
    );

    // Remise en état : le rangement se referme, et la collection reprend son
    // ordre de départ — les parcours qui suivent comptent dessus.
    await evalApp(`new Promise((resolve) => chrome.storage.local.get('links', (valeur) => {
      const voulu = ${JSON.stringify(tri?.manuel?.noms ?? [])};
      const rang = new Map(voulu.map((titre, index) => [titre, index]));
      const suite = (valeur.links ?? []).map((lien) => Object.assign({}, lien, {
        order: rang.has(lien.title) ? rang.get(lien.title) : voulu.length,
      }));
      chrome.storage.local.set({ links: suite }, resolve);
    }))`);
    await recharger(app.session);
    await forcerPeinture(app.session, 600);

    // --- La note de collection --------------------------------------------
    //
    // Elle décrit l'ensemble, et doit donc se retrouver partout où l'ensemble est
    // nommé : l'en-tête de page de la planche, celui du tableau, et le manifeste
    // du dossier exporté.
    const NOTE_TEST = 'Pour le rangement du garage.';
    await evalApp(`(() => {
      const champ = document.getElementById('collection-note');
      champ.value = ${JSON.stringify(NOTE_TEST)};
      champ.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await forcerPeinture(app.session, 700);

    // Sur la planche : on active l'en-tête de page, avec une marge qui le porte.
    const notePlanche = await evalApp(`(async () => {
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
      const lire = () => {
        const note = document.querySelector('#preview .print-page__note');
        const titre = document.querySelector('#preview .print-page__title');
        return {
          texte: note ? note.textContent.trim() : null,
          titre: titre ? titre.textContent.trim() : null,
        };
      };
      nombre('sheet-margin-y', '15');
      poser('sheet-header', true);
      await pause(900);
      const avec = lire();

      // La case de la note : elle doit la retirer, et la rendre.
      poser('sheet-header-note', false);
      await pause(800);
      const sans = lire();
      poser('sheet-header-note', true);
      await pause(800);
      const retour = lire();

      return { avec, sans, retour };
    })()`);

    record(
      'la note de collection s\'imprime sous le nom, sur la planche',
      notePlanche?.avec?.texte === NOTE_TEST,
      `« ${notePlanche?.avec?.texte} »`,
    );
    record(
      'décocher la note la retire de l\'en-tête, et la recocher la rend',
      notePlanche?.sans?.texte === null
        && notePlanche?.sans?.titre === notePlanche?.avec?.titre
        && notePlanche?.retour?.texte === NOTE_TEST,
      `« ${notePlanche?.avec?.texte} » → ${notePlanche?.sans?.texte} → `
        + `« ${notePlanche?.retour?.texte} », nom conservé : `
        + `${notePlanche?.sans?.titre === notePlanche?.avec?.titre}`,
    );

    // Sur le tableau.
    const noteTableau = await evalApp(`(async () => {
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
      await new Promise((r) => setTimeout(r, 500));
      const poser = (id, valeur) => {
        const n = document.getElementById(id);
        n.checked = valeur;
        n.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const lire = () => {
        const note = document.querySelector('#preview .print-page__note');
        const titre = document.querySelector('#preview .print-page__title');
        return {
          texte: note ? note.textContent.trim() : null,
          titre: titre ? titre.textContent.trim() : null,
        };
      };
      poser('table-title', true);
      await new Promise((r) => setTimeout(r, 800));
      const avec = lire();
      poser('table-title-note', false);
      await new Promise((r) => setTimeout(r, 800));
      const sans = lire();
      return { avec, sans };
    })()`);

    record(
      'la note suit le nom sur la page du tableau, et sa case la retire aussi',
      noteTableau?.avec?.texte === NOTE_TEST && (noteTableau?.avec?.titre ?? '').length > 0
        && noteTableau?.sans?.texte === null,
      `« ${noteTableau?.avec?.titre} » puis « ${noteTableau?.avec?.texte} » → `
        + `${noteTableau?.sans?.texte}`,
    );

    // Remise en état, et retour à la planche pour la suite du parcours.
    await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
      await pause(400);
      const note = document.getElementById('collection-note');
      note.value = '';
      note.dispatchEvent(new Event('input', { bubbles: true }));
      await pause(400);

      // Sans note, la case n'a plus rien à imprimer : elle doit être inerte, et
      // le dire — plutôt que d'annoncer une commande sans effet. On relève aussi
      // son état, qui doit survivre : le choix se retrouve dès la note réécrite.
      const caseNote = document.getElementById('sheet-header-note');
      const caseTableau = document.getElementById('table-title-note');
      window.__sansNote = {
        planche: { inactif: caseNote.disabled, coche: caseNote.checked,
                   bulle: caseNote.parentNode?.title ?? '' },
        tableau: { inactif: caseTableau.disabled, coche: caseTableau.checked,
                   bulle: caseTableau.parentNode?.title ?? '' },
      };

      // Et l'on remet la case du tableau telle qu'on l'a trouvée, puisqu'on l'a
      // décochée pour l'éprouver.
      const remise = document.getElementById('table-title-note');
      remise.checked = true;
      remise.dispatchEvent(new Event('change', { bubbles: true }));
      const tete = document.getElementById('sheet-header');
      tete.checked = false;
      tete.dispatchEvent(new Event('change', { bubbles: true }));
      const marge = document.getElementById('sheet-margin-y');
      marge.value = '8.5';
      marge.dispatchEvent(new Event('input', { bubbles: true }));
      marge.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(600);
    })()`);

    // Le relevé se fait **ici** : les parcours suivants rechargent la page, et
    // une variable posée sur `window` ne survivrait pas au rechargement.
    const sansNote = await evalApp('window.__sansNote ?? null');
    record(
      'sans note, la case est inerte et l\'explique — sur la planche comme au tableau',
      sansNote?.planche?.inactif === true && sansNote?.tableau?.inactif === true
        && /panneau de gauche/.test(sansNote?.planche?.bulle ?? '')
        && /panneau de gauche/.test(sansNote?.tableau?.bulle ?? '')
        && sansNote?.planche?.coche === true,
      `planche : inactif ${sansNote?.planche?.inactif}, coché ${sansNote?.planche?.coche}, `
        + `« ${sansNote?.planche?.bulle} »`,
    );

    // --- Un refus dit ce qui le ferait disparaître -------------------------
    //
    // Signalé : le message rouge « URL trop longue » restait affiché après avoir
    // décoché les options de texte — et pour cause, le QR Code encode l'URL, ce
    // que rien ne disait. Le contrôle installe donc le cas : une adresse trop
    // longue pour une tête de 12 mm, **avec** un raccourci. Il vérifie ensuite
    // que le refus nomme le remède, dit ce qui n'y change rien, et que le
    // remède fonctionne.
    const LONGUE = 'https://www.archiproducts.com/en/products/office-partitions/'
      + 'double-glass-office-partition-by-dvo-mesure-sur-plan-large';
    await evalApp(`new Promise((resolve) => chrome.storage.local.get('links', (valeur) => {
      const liens = valeur.links ?? [];
      liens.push({
        id: 'refus-long', url: ${JSON.stringify(LONGUE)}, title: 'Une adresse trop longue',
        note: '', tags: [], createdAt: Date.now(), updatedAt: Date.now(),
        source: 'manual', favicon: '', shortUrl: '', shortProvider: '',
        shortenedAt: 0, order: 0,
      });
      chrome.storage.local.set({ links: liens }, resolve);
    }))`);
    await recharger(app.session);
    await forcerPeinture(app.session, 800);

    const conseil = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click();
      await pause(900);

      const choix = document.getElementById('label-link');
      const option = [...choix.options].find((o) => o.textContent.includes('Une adresse trop longue'));
      if (option) {
        choix.value = option.value;
        choix.dispatchEvent(new Event('change', { bubbles: true }));
        await pause(1000);
      }

      const lire = () => {
        const n = document.querySelector('#preview .hint');
        return {
          legende: n ? n.textContent.trim() : null,
          rouge: n ? getComputedStyle(n).color : null,
        };
      };
      const refus = lire();

      // Décocher le texte : le refus reste, et le dit.
      for (const id of ['label-show-url', 'label-show-title']) {
        const n = document.getElementById(id);
        n.checked = false;
        n.dispatchEvent(new Event('change', { bubbles: true }));
      }
      await pause(900);
      const sansTexte = lire();

      return { refus, sansTexte };
    })()`);

    record(
      'un refus de longueur dit ce qui n\'y change rien : décocher le texte',
      conseil?.refus?.rouge === 'rgb(179, 18, 43)'
        && /trop longue/.test(conseil?.refus?.legende ?? '')
        && /texte imprimé n'y change rien/.test(conseil?.sansTexte?.legende ?? ''),
      `« ${conseil?.refus?.legende?.slice(0, 150)} » puis, texte décoché : `
        + `« ${conseil?.sansTexte?.legende?.slice(0, 150)} »`,
    );

    // Le raccourci arrive : le refus doit alors **nommer le remède**, et le
    // remède doit marcher.
    await evalApp(`new Promise((resolve) => chrome.storage.local.get('links', (valeur) => {
      const liens = (valeur.links ?? []).map((lien) => (lien.id === 'refus-long'
        ? Object.assign({}, lien, {
          shortUrl: 'https://spoo.me/abcd', shortProvider: 'spoome', shortenedAt: Date.now(),
        })
        : lien));
      chrome.storage.local.set({ links: liens }, resolve);
    }))`);
    await recharger(app.session);
    await forcerPeinture(app.session, 800);

    const raccourci = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click();
      await pause(900);
      const choix = document.getElementById('label-link');
      const option = [...choix.options].find((o) => o.textContent.includes('Une adresse trop longue'));
      if (option) {
        choix.value = option.value;
        choix.dispatchEvent(new Event('change', { bubbles: true }));
        await pause(1000);
      }
      const lire = () => {
        const n = document.querySelector('#preview .hint');
        return { legende: n ? n.textContent.trim() : null, rouge: n ? getComputedStyle(n).color : null };
      };
      const avant = lire();
      [...document.querySelectorAll('#list .link')]
        .find((l) => l.querySelector('.link__title')?.textContent.includes('Une adresse trop longue'))
        ?.querySelector('.link__target input')?.click();
      await pause(1200);
      return { avant, apres: lire() };
    })()`);

    record(
      'le refus nomme le raccourci, et l\'encoder le fait disparaître',
      /raccourci/.test(raccourci?.avant?.legende ?? '')
        && /trop longue/.test(raccourci?.avant?.legende ?? '')
        && !/trop longue/.test(raccourci?.apres?.legende ?? '')
        && raccourci?.apres?.rouge !== 'rgb(179, 18, 43)',
      `« ${raccourci?.avant?.legende?.slice(0, 160)} » → `
        + `« ${raccourci?.apres?.legende?.slice(0, 110)} »`,
    );

    // Remise en état : le lien d'épreuve disparaît, et le texte revient.
    await evalApp(`new Promise((resolve) => chrome.storage.local.get('links', (valeur) => {
      chrome.storage.local.set({
        links: (valeur.links ?? []).filter((lien) => lien.id !== 'refus-long'),
      }, resolve);
    }))`);
    await recharger(app.session);
    await forcerPeinture(app.session, 700);
    await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      for (const id of ['label-show-url', 'label-show-title']) {
        const n = document.getElementById(id);
        n.checked = true;
        n.dispatchEvent(new Event('change', { bubbles: true }));
      }
      await pause(700);
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
      await pause(600);
    })()`);

    // --- L'éditeur d'un lien ne déborde pas de la liste --------------------
    //
    // Le formulaire gardait sa largeur propre — 364 px, la largeur intrinsèque
    // d'un champ de saisie — et débordait dès que le panneau était plus étroit.
    // La liste défilait alors horizontalement, et **toutes** ses lignes se
    // retrouvaient coupées à gauche : « UBLE GLASS Office partition » au lieu de
    // « DOUBLE GLASS… ». Redimensionner ne réparait rien, le défilement restant
    // où il était.
    const editeur = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const liste = document.getElementById('list');
      const lire = () => ({
        clientWidth: liste.clientWidth,
        scrollWidth: liste.scrollWidth,
        scrollLeft: liste.scrollLeft,
      });
      const avant = lire();
      document.querySelector('#list .link__edit').click();
      await pause(700);
      const apres = lire();
      const coupables = [...liste.querySelectorAll('*')]
        .filter((n) => n.getBoundingClientRect().width > liste.clientWidth + 1)
        .slice(0, 4)
        .map((n) => n.tagName.toLowerCase() + '.' + (n.className || 'sans-classe')
          + ' ' + Math.round(n.getBoundingClientRect().width));
      const formule = document.querySelector('.link__editor-form');
      return {
        avant, apres, coupables,
        formulaire: formule ? Math.round(formule.getBoundingClientRect().width) : 0,
        champ: formule ? Math.round(formule.querySelector('.input').getBoundingClientRect().width) : 0,
      };
    })()`);

    record(
      'le formulaire d\'un lien reste dans la liste, et la liste ne défile pas',
      editeur?.apres?.scrollLeft === 0
        && editeur?.apres?.scrollWidth <= editeur?.apres?.clientWidth
        && (editeur?.coupables ?? []).length === 0
        && editeur?.formulaire <= editeur?.apres?.clientWidth,
      `liste ${editeur?.apres?.clientWidth} px, contenu ${editeur?.apres?.scrollWidth} px, `
        + `défilement ${editeur?.apres?.scrollLeft} ; formulaire ${editeur?.formulaire} px, `
        + `champ ${editeur?.champ} px`
        + ((editeur?.coupables ?? []).length ? ` — trop larges : ${editeur.coupables.join(', ')}` : ''),
    );

    // Remise en état : l'éditeur se referme.
    await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      document.querySelector('.link__editor-actions .btn--ghost')?.click();
      await pause(500);
    })()`);

    // --- Le même aperçu dans les deux onglets d'étiquettes -----------------
    //
    // L'onglet des images agrandissait jusqu'à six fois **sans le dire**, et
    // n'offrait pas la taille réelle : le réglage existait d'un côté et manquait
    // de l'autre. On compare les deux onglets, mesure en main.
    const apercus = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const lire = () => {
        const canvas = document.querySelector('#preview canvas');
        const legende = document.querySelector('#preview .hint');
        return {
          largeur: canvas ? Math.round(canvas.getBoundingClientRect().width) : 0,
          legende: legende ? legende.textContent.trim() : null,
        };
      };
      const onglet = async (nom) => {
        [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === nom).click();
        await pause(900);
        return lire();
      };

      const niimbot = await onglet('single');
      const images = await onglet('images');

      // La taille réelle depuis l'onglet des images : les deux doivent suivre.
      const reelle = document.getElementById('export-real-size');
      reelle.checked = true;
      reelle.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(900);
      const imagesReelles = lire();
      const niimbotCoche = document.getElementById('label-real-size').checked;

      reelle.checked = false;
      reelle.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(700);
      return { niimbot, images, imagesReelles, niimbotCoche, retour: lire() };
    })()`);

    record(
      'l\'aperçu des images annonce son échelle, comme celui des étiquettes',
      /taille réelle/.test(apercus?.images?.legende ?? '')
        && /×/.test(apercus?.images?.legende ?? '')
        && /taille réelle/.test(apercus?.niimbot?.legende ?? ''),
      `images : « ${apercus?.images?.legende?.slice(0, 120)} »`,
    );
    record(
      'la taille réelle est offerte des deux côtés, et c\'est le même réglage',
      apercus?.niimbotCoche === true
        && (apercus?.imagesReelles?.largeur ?? 0) < (apercus?.images?.largeur ?? 0)
        && (apercus?.retour?.largeur ?? 0) === (apercus?.images?.largeur ?? 0),
      `images ${apercus?.images?.largeur} px → ${apercus?.imagesReelles?.largeur} px à la taille `
        + `réelle (case Niimbot cochée : ${apercus?.niimbotCoche}), retour à `
        + `${apercus?.retour?.largeur} px`,
    );

    // --- Le contenu de l'étiquette, un seul réglage -------------------------
    //
    // Signalé : cet onglet proposait **deux** réglages pour la même question —
    // une liste « Texte imprimé » à cinq modes exclusifs, et un groupe de cases
    // « Sous le QR Code ». Le code en portait un troisième, `showTitle`, coché
    // à part. Le contrôle mesure les deux moitiés : la structure, et l'effet.
    const contenuImages = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'images').click();
      await pause(900);

      const groupe = (nom) => document.querySelector('[data-mode-panel="' + nom + '"] fieldset.columns');
      const etiquettes = (nom) => {
        const bloc = groupe(nom);
        if (!bloc) return null;
        return {
          legende: bloc.querySelector('legend')?.textContent.trim() ?? null,
          cases: [...bloc.querySelectorAll('input[type=checkbox]')].map((n) => n.id),
          libelles: [...bloc.querySelectorAll('.columns__item span')].map((n) => n.textContent.trim()),
        };
      };
      const panneau = document.querySelector('[data-mode-panel="images"]');
      return {
        listeTexte: document.getElementById('label-text') === null,
        selecteurs: panneau.querySelectorAll('select').length,
        images: etiquettes('images'),
        niimbot: etiquettes('single'),
      };
    })()`);

    const memeCases = contenuImages?.images && contenuImages?.niimbot
      && JSON.stringify(contenuImages.images.libelles) === JSON.stringify(contenuImages.niimbot.libelles)
      && contenuImages.images.cases.length === contenuImages.niimbot.cases.length;

    record(
      'l\'onglet des images n\'a qu\'un réglage de contenu, les mêmes cases que l\'onglet Niimbot',
      contenuImages?.listeTexte === true
        && contenuImages?.selecteurs === 1
        && (contenuImages?.images?.cases ?? []).length === 6
        && memeCases
        && contenuImages?.images?.legende === 'Contenu de l\'étiquette',
      `liste « Texte imprimé » retirée : ${contenuImages?.listeTexte}, `
        + `${contenuImages?.selecteurs} sélecteur(s) restant(s) — `
        + `« ${contenuImages?.images?.legende} » : ${(contenuImages?.images?.cases ?? []).join(', ')}`
        + ` — libellés identiques à ceux du Niimbot : ${memeCases}`,
    );

    // La case cochée doit **changer ce qui est annoncé** : la hauteur de
    // l'étiquette dans la légende, et la hauteur du canevas. Le format est
    // posé sur un rouleau continu, seul cas où la hauteur suit le texte — sur
    // un format à hauteur fixe, c'est le QR Code qui cède la place.
    //
    // Le lien et le format sont choisis **par la mesure**. Sur la premiere
    // adresse de la collection et une tete de 12 mm, le texte atteint le
    // plafond de quatre lignes : deux contenus differents donnent alors la
    // meme hauteur, et la mesure ne verrait rien alors que le produit fait ce
    // qu'il annonce. Le controle prend donc l'adresse la plus courte de la
    // liste, sur un rouleau de 62 mm, et **compte l'encre** — les pixels noirs
    // du canevas. Ajouter le domaine ecrit des caracteres de plus, meme quand
    // le nombre de lignes ne bouge pas.
    const casesContenuImages = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const format = document.getElementById('label-format');
      const formatAvant = format.value;
      format.value = 'brother-dk22205';
      format.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(900);

      const encre = () => {
        const canvas = document.querySelector('#preview canvas');
        if (!canvas || !canvas.width) return 0;
        const donnees = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let n = 0;
        for (let i = 0; i < donnees.length; i += 4) if (donnees[i] < 128) n += 1;
        return n;
      };
      const lire = () => ({
        fait: document.querySelector('.preview__caption .preview__fact')?.textContent.trim() ?? null,
        hauteur: document.querySelector('#preview canvas')?.height ?? 0,
        encre: encre(),
      });
      const poser = (id, valeur) => {
        const n = document.getElementById(id);
        n.checked = valeur;
        n.dispatchEvent(new Event('change', { bubbles: true }));
      };

      // L'adresse la plus courte de la liste, et l'etat de selection d'origine.
      const cases = [...document.querySelectorAll('#list .link__check')];
      const avantSelection = cases.map((n) => n.checked);
      let cible = -1;
      let longueur = Infinity;
      cases.forEach((n, i) => {
        const url = n.closest('.link')?.querySelector('.link__url')?.getAttribute('href') ?? '';
        if (url.length > 0 && url.length < longueur) {
          longueur = url.length;
          cible = i;
        }
      });
      for (let i = 0; i < cases.length; i += 1) {
        if (cases[i].checked !== (i === cible)) cases[i].click();
      }
      await pause(1000);

      const avant = lire();

      // La date ajoute une ligne : l'etiquette s'allonge, et la legende suit.
      poser('export-date', true);
      await pause(900);
      const avecDate = lire();
      poser('export-date', false);
      await pause(900);
      const sansDate = lire();

      // Le domaine **se cumule** avec l'URL : le texte s'allonge au lieu d'etre
      // remplace. Le controle mesure trois etats, sans quoi « le domaine
      // s'imprime » et « le domaine remplace l'URL » donneraient le meme
      // resultat sur la seule etape du milieu.
      poser('export-host', true);
      await pause(900);
      const avecDomaine = lire();
      poser('export-url', false);
      await pause(900);
      const domaineSeul = lire();
      poser('export-url', true);
      poser('export-host', false);
      await pause(900);
      const retour = lire();

      // La selection et le format sont rendus tels qu'ils etaient : les
      // controles suivants portent sur la meme collection, au meme format.
      const apres = [...document.querySelectorAll('#list .link__check')];
      for (let i = 0; i < apres.length; i += 1) {
        if (apres[i].checked !== avantSelection[i]) apres[i].click();
      }
      format.value = formatAvant;
      format.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(900);

      return { lien: longueur, format: formatAvant, avant, avecDate, sansDate, avecDomaine, domaineSeul, retour };
    })()`);

    record(
      'cocher puis décocher une case de contenu recalcule l\'étiquette annoncée',
      casesContenuImages?.avecDate?.hauteur > casesContenuImages?.avant?.hauteur
        && casesContenuImages?.avecDate?.fait !== casesContenuImages?.avant?.fait
        && casesContenuImages?.avecDate?.encre > casesContenuImages?.avant?.encre
        && casesContenuImages?.sansDate?.hauteur === casesContenuImages?.avant?.hauteur
        && casesContenuImages?.sansDate?.fait === casesContenuImages?.avant?.fait
        && casesContenuImages?.retour?.hauteur === casesContenuImages?.avant?.hauteur
        && casesContenuImages?.retour?.fait === casesContenuImages?.avant?.fait,
      `hauteur ${casesContenuImages?.avant?.hauteur} px → date cochée : `
        + `${casesContenuImages?.avecDate?.hauteur} px (${casesContenuImages?.avecDate?.encre} pixels `
        + `d'encre au lieu de ${casesContenuImages?.avant?.encre}) → décochée : `
        + `${casesContenuImages?.sansDate?.hauteur} px → retour : `
        + `${casesContenuImages?.retour?.hauteur} px — « ${casesContenuImages?.avecDate?.fait} »`,
    );

    record(
      'le domaine coché s\'ajoute à l\'URL, et ne la remplace pas',
      casesContenuImages?.avecDomaine?.encre > casesContenuImages?.avant?.encre
        && casesContenuImages?.domaineSeul?.encre < casesContenuImages?.avant?.encre
        && casesContenuImages?.retour?.encre === casesContenuImages?.avant?.encre,
      `lien de ${casesContenuImages?.lien} caractères : URL ${casesContenuImages?.avant?.encre} pixels `
        + `d'encre, URL + domaine ${casesContenuImages?.avecDomaine?.encre}, `
        + `domaine seul ${casesContenuImages?.domaineSeul?.encre}, retour ${casesContenuImages?.retour?.encre}`,
    );

    // Remise en état : la planche, pour la suite du parcours.
    await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
      await pause(600);
    })()`);

    // --- Ranger plutôt que trancher ----------------------------------------
    //
    // Quand un espacement ou une grille rétrécit les étiquettes au point que le
    // contenu n'y tient plus, l'application le disait sans rien proposer. Le
    // contrôle vérifie les deux moitiés : le bouton **apparaît** dans cet état,
    // et il rend une planche où le contenu tient de nouveau.
    const ajustement = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const poser = (id, valeur) => {
        const n = document.getElementById(id);
        n.value = valeur;
        n.dispatchEvent(new Event('input', { bubbles: true }));
        n.dispatchEvent(new Event('change', { bubbles: true }));
      };
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
      await pause(700);

      const lire = () => ({
        colonnes: document.getElementById('sheet-columns').value,
        rangees: document.getElementById('sheet-rows').value,
        ecartX: document.getElementById('sheet-gap-x').value,
        ecartY: document.getElementById('sheet-gap-y').value,
        margeX: document.getElementById('sheet-margin-x').value,
        margeY: document.getElementById('sheet-margin-y').value,
        qr: document.getElementById('sheet-qr-info').textContent.trim(),
        grille: document.getElementById('sheet-grid-hint').textContent.trim(),
        boutonVisible: document.getElementById('sheet-fit').hidden === false,
        taille: document.getElementById('sheet-fit-hint').textContent.trim(),
      });

      const avant = lire();

      // Quatorze colonnes rétrécissent l'étiquette à 12,6 mm : le QR Code n'y
      // tient plus, et l'application le dit en rouge.
      poser('sheet-columns', '14');
      await pause(900);
      const degrade = lire();

      document.getElementById('sheet-fit').click();
      await pause(1200);
      const ajuste = lire();

      // Remise en état : la disposition d'origine reprend ses cotes.
      const preset = document.getElementById('preset');
      preset.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(700);
      return { avant, degrade, ajuste };
    })()`);

    record(
      'quand le contenu ne tient plus dans les étiquettes, l\'application propose de ranger',
      /trop longue/.test(ajustement?.degrade?.qr ?? '')
        && ajustement?.degrade?.boutonVisible === true,
      `${ajustement?.degrade?.colonnes} colonnes → « ${ajustement?.degrade?.qr?.slice(0, 90)} » — `
        + `bouton proposé : ${ajustement?.degrade?.boutonVisible}`,
    );
    record(
      'l\'ajustement rend une planche où le contenu tient, et le dit',
      /tiennent|à la place/.test(ajustement?.ajuste?.grille ?? '')
        && !/trop longue/.test(ajustement?.ajuste?.qr ?? '')
        && Number(ajustement?.ajuste?.colonnes) < Number(ajustement?.degrade?.colonnes ?? 0)
        && ajustement?.ajuste?.boutonVisible === false,
      `${ajustement?.degrade?.colonnes} colonnes → ${ajustement?.ajuste?.colonnes} × `
        + `${ajustement?.ajuste?.rangees}, écart ${ajustement?.ajuste?.ecartX} mm et `
        + `marge ${ajustement?.ajuste?.margeX} mm — « ${ajustement?.ajuste?.grille?.slice(0, 110)} » `
        + `— ${ajustement?.ajuste?.taille?.slice(0, 90)}`,
    );

    // --- Les flèches de parcours des dispositions --------------------------
    const fleches = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const select = document.getElementById('preset');
      const suivante = document.getElementById('preset-next');
      const precedente = document.getElementById('preset-prev');
      const lire = () => ({
        valeur: select.value,
        libelle: select.selectedOptions?.[0]?.textContent ?? '',
        groupe: select.selectedOptions?.[0]?.parentNode?.label ?? '',
      });
      const depart = lire();
      suivante.click();
      await pause(600);
      const apres = lire();
      suivante.click();
      suivante.click();
      await pause(600);
      // Un tour complet doit revenir au départ : on parcourt la famille en
      // boucle, sans jamais sortir d'elle.
      const famille = [...(select.selectedOptions?.[0]?.parentNode?.children ?? [])].map((o) => o.value);
      const index = famille.indexOf(lire().valeur);
      const tours = [];
      for (let i = 0; i < famille.length; i += 1) {
        tours.push(select.value);
        suivante.click();
        await pause(120);
      }
      precedente.click();
      await pause(400);
      const retour = lire();
      return { depart, apres, famille, index, tours, retour };
    })()`);

    record(
      'les flèches parcourent la famille de la disposition, en boucle',
      fleches?.apres?.valeur !== fleches?.depart?.valeur
        && fleches?.apres?.groupe === fleches?.depart?.groupe
        && new Set(fleches?.tours ?? []).size === (fleches?.famille?.length ?? 0)
        && fleches?.retour?.valeur === fleches?.tours?.[fleches.tours.length - 1],
      `${fleches?.depart?.groupe} : ${fleches?.tours?.length} dispositions parcourues `
        + `(${(fleches?.tours ?? []).join(', ')}), retour arrière sur « ${fleches?.retour?.libelle} »`,
    );

    // Remise en état : la disposition de départ.
    await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const select = document.getElementById('preset');
      select.value = 'a4-3x8';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(600);
    })()`);

    // --- Une portée vide dans l'onglet Niimbot -----------------------------
    //
    // Le défaut signalé : avec rien de coché, le sélecteur retombait sur le
    // premier lien et l'aperçu jugeait **ce lien** — message rouge compris —
    // alors que l'intention était de n'imprimer rien. Le contrôle tient donc en
    // deux temps : la portée choisie survit à la désélection, et le verdict
    // laisse la place à une phrase neutre.
    const porteeVide = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click();
      await pause(800);

      // On coche un lien, on choisit « seulement ceux que je coche », puis on
      // décoche : c'est la suite de gestes qui produisait le défaut.
      document.querySelector('#list .link__check')?.click();
      await pause(700);
      const select = document.getElementById('label-link');
      const rangee = [...select.options].find((o) => o.value === '__selected');
      select.value = '__selected';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(900);
      const choisi = select.value;

      document.querySelector('#list .link__check')?.click();
      await pause(900);
      const legende = document.querySelector('#preview .hint');
      return {
        choisi,
        apresDecochage: select.value,
        texte: legende ? legende.textContent.trim() : null,
        couleur: legende ? getComputedStyle(legende).color : null,
        bouton: document.getElementById('print-label')?.textContent.trim() ?? null,
        boutonInactif: document.getElementById('print-label')?.disabled ?? null,
        portee: document.getElementById('print-scope-hint').textContent.trim(),
      };
    })()`);

    record(
      'décocher tout ne fait pas retomber le sélecteur sur un lien',
      porteeVide?.choisi === '__selected' && porteeVide?.apresDecochage === '__selected',
      `portée choisie « ${porteeVide?.choisi} », après décochage « ${porteeVide?.apresDecochage} »`,
    );
    record(
      'sans rien de coché, l\'aperçu annonce qu\'il n\'y a rien à imprimer, sans verdict',
      /rien à imprimer/i.test(porteeVide?.texte ?? '')
        && porteeVide?.couleur !== 'rgb(179, 18, 43)'
        && porteeVide?.boutonInactif === true,
      `« ${porteeVide?.texte} » en ${porteeVide?.couleur}, bouton « ${porteeVide?.bouton} » `
        + `(inactif : ${porteeVide?.boutonInactif})`,
    );

    // Remise en état : la portée repart sur un lien, comme à l'ouverture.
    await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const select = document.getElementById('label-link');
      select.value = [...select.options].find((o) => o.value !== '__all'
        && o.value !== '__selected')?.value ?? select.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(600);
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
      await pause(600);
    })()`);

    // --- Le premier numéro de la collection --------------------------------
    //
    // Le cas d'usage tient en une phrase : on termine un lot, on efface les
    // liens, et le lot suivant doit reprendre la numérotation. Le numéro est
    // donc réglé, et il doit atteindre **toutes** les sorties — la liste comme
    // ce qui s'imprime — puis survivre à un rechargement.
    const numerotation = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const poser = (id, valeur) => {
        const n = document.getElementById(id);
        if (n.checked !== undefined && typeof valeur !== 'string') {
          n.checked = valeur;
          n.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
        n.value = valeur;
        n.dispatchEvent(new Event('input', { bubbles: true }));
        n.dispatchEvent(new Event('change', { bubbles: true }));
      };
      // Le numéro s'imprime : on demande la ligne pour pouvoir le lire.
      poser('sheet-date-index', true);
      poser('collection-start', '101');
      await pause(1000);

      const premiere = document.querySelector('#preview .print-cell');
      return {
        rangs: [...document.querySelectorAll('#list .link__index')].map((n) => n.textContent.trim()),
        lignes: [...(premiere?.querySelectorAll('.print-cell__text') ?? [])]
          .map((n) => n.textContent.trim()),
        champ: document.getElementById('collection-start').value,
      };
    })()`);

    record(
      'le premier numéro règne sur la liste et sur la planche',
      numerotation?.rangs?.[0] === '101'
        && numerotation?.rangs?.join(',') === ['101', '102', '103'].join(',')
        // Le numéro ouvre le texte de la cellule : il est la première chose
        // imprimée sous le QR Code, et la ligne suivante porte le titre.
        && (numerotation?.lignes?.join(' ') ?? '').startsWith('101'),
      `rangs ${JSON.stringify(numerotation?.rangs)}, première étiquette `
        + `${JSON.stringify(numerotation?.lignes)}`,
    );

    await recharger(app.session);
    await forcerPeinture(app.session, 700);
    const numerotationApres = await evalApp(`(() => ({
      champ: document.getElementById('collection-start').value,
      rangs: [...document.querySelectorAll('#list .link__index')].map((n) => n.textContent.trim()),
    }))()`);

    record(
      'le premier numéro survit au rechargement',
      numerotationApres?.champ === '101' && numerotationApres?.rangs?.[0] === '101',
      `champ « ${numerotationApres?.champ} », rangs ${JSON.stringify(numerotationApres?.rangs)}`,
    );

    // Remise en état : la numérotation repart de 1, et la ligne du numéro ne
    // s'imprime plus — les contrôles suivants mesurent la planche.
    await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const champ = document.getElementById('collection-start');
      champ.value = '1';
      champ.dispatchEvent(new Event('input', { bubbles: true }));
      champ.dispatchEvent(new Event('change', { bubbles: true }));
      const ligne = document.getElementById('sheet-date-index');
      ligne.checked = false;
      ligne.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(800);
    })()`);

    // --- Le raccourcissement, réglé lien par lien -------------------------
    //
    // Deux questions, distinctes : **où** se fait le choix, et **ce qu'il
    // change**. La seconde est la seule qui compte vraiment, et elle ne se
    // devine pas : on pose donc un raccourci dans le stockage, comme le ferait
    // un service, plutôt que d'appeler un tiers pendant la vérification.
    //
    // La preuve retenue est double, sur le même réglage : la matrice du QR Code
    // dessinée dans la planche, et le texte imprimé sous ce QR Code. Deux
    // rendus indépendants qui suivent le même choix ne peuvent pas être un
    // artefact de mesure.
    const placeRaccourci = await evalApp(`(() => {
      const panneauMiseEnPage = document.querySelector('section[aria-labelledby="layout-title"]');
      const panneauCollection = document.querySelector('section[aria-labelledby="collection-title"]');
      const bloc = document.getElementById('shortener');
      const onglets = document.querySelector('.tabs');
      const avant = bloc && onglets
        ? Boolean(bloc.compareDocumentPosition(onglets) & Node.DOCUMENT_POSITION_FOLLOWING)
        : false;
      return {
        dansMiseEnPage: Boolean(panneauMiseEnPage?.contains(bloc)),
        dansCollection: Boolean(panneauCollection?.contains(bloc)),
        avantLesOnglets: avant,
        selection: document.getElementById('qr-target')?.value,
      };
    })()`);

    record(
      'le raccourcissement se règle dans le panneau de mise en page, avant les onglets',
      placeRaccourci?.dansMiseEnPage === true && placeRaccourci?.dansCollection === false
        && placeRaccourci?.avantLesOnglets === true,
      `mise en page : ${placeRaccourci?.dansMiseEnPage}, collection : ${placeRaccourci?.dansCollection}, `
        + `au-dessus des onglets : ${placeRaccourci?.avantLesOnglets}`,
    );

    // Le raccourci factice reste crédible : même forme qu'un vrai, et assez
    // court pour que la matrice change de taille.
    await evalApp(`new Promise((resolve) => chrome.storage.local.get('links', (valeur) => {
      const liens = valeur.links ?? [];
      liens[0] = Object.assign({}, liens[0], {
        shortUrl: 'https://is.gd/abcd',
        shortProvider: 'isgd',
      });
      chrome.storage.local.set({ links: liens }, resolve);
    }))`);
    await recharger(app.session);
    await forcerPeinture(app.session, 700);

    const cibleParLien = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const poser = (id, valeur) => {
        const n = document.getElementById(id);
        n.checked = valeur;
        n.dispatchEvent(new Event('change', { bubbles: true }));
      };
      // Le texte imprimé sous le QR Code se réduit à l'URL : c'est elle qu'on
      // veut lire, sans le titre qui la précède et pourrait la repousser hors
      // de la cellule.
      poser('sheet-title', false);
      poser('sheet-url', true);
      await pause(900);

      // La cellule du lien raccourci n'est pas forcement la premiere : l'ordre
      // de la planche suit l'ordre **affiche**, que la verification a deplace
      // plus haut. On lit donc toute la planche, et l'on cherche le raccourci
      // la ou il est.
      const textes = (cellule) => [...cellule.querySelectorAll('.print-cell__text')]
        .map((n) => n.textContent.trim()).join(' ');
      const lire = () => {
        const cellules = [...document.querySelectorAll('#preview .print-cell')];
        const avecRaccourci = cellules.filter((c) => /is\.gd/.test(textes(c)));
        // Le dessin est **un seul chemin** : un sous-chemin par module noir.
        // Compter les « M » compte donc exactement les modules noirs, là où un
        // compte de rectangles rendrait toujours zéro.
        const noirs = cellules.reduce((somme, cellule) => {
          const chemin = cellule.querySelector('.print-cell__qr svg path')?.getAttribute('d') ?? '';
          return somme + (chemin.match(/M/g) ?? []).length;
        }, 0);
        return {
          cellules: cellules.length,
          raccourcis: avecRaccourci.length,
          texteDuRaccourci: avecRaccourci.map(textes).join(' | '),
          noirs,
        };
      };

      const cases = [...document.querySelectorAll('#list .link__target input')];
      const cocheeAuDepart = cases[0] ? cases[0].checked : null;
      const titreDeLaCase = cases[0]?.closest('.link')?.querySelector('.link__title')?.textContent.trim();
      const libelle = cases[0]?.getAttribute('aria-label') ?? null;
      const avant = lire();
      const global = document.getElementById('qr-target').value;

      cases[0]?.click();
      await pause(1100);
      const apres = lire();
      const stockage = await new Promise((r) => chrome.storage.local.get('links', (v) => r(v.links ?? [])));

      return {
        combienDeCases: cases.length,
        cocheeAuDepart, titreDeLaCase, libelle, avant, apres, global,
        globalApres: document.getElementById('qr-target').value,
        reglages: stockage.map((l) => (typeof l.useShort === 'boolean' ? l.useShort : null)),
        titreDuRaccourci: stockage.find((l) => l.shortUrl)?.title ?? null,
      };
    })()`);

    record(
      'une seule case de cible, sur le seul lien qui a un raccourci',
      cibleParLien?.combienDeCases === 1 && cibleParLien?.cocheeAuDepart === false
        && cibleParLien?.titreDeLaCase === cibleParLien?.titreDuRaccourci,
      `${cibleParLien?.combienDeCases} case(s), « ${cibleParLien?.titreDeLaCase} » — le lien `
        + `raccourci est « ${cibleParLien?.titreDuRaccourci} », décochée au départ : `
        + `${cibleParLien?.cocheeAuDepart}`,
    );
    record(
      'la case de cible s\'annonce par ce qu\'elle fait, lien nommé',
      /raccourci/i.test(cibleParLien?.libelle ?? '')
        && (cibleParLien?.libelle ?? '').includes(cibleParLien?.titreDuRaccourci ?? '\u0000'),
      `« ${cibleParLien?.libelle} »`,
    );
    record(
      'cocher la case encode le raccourci, sans toucher au réglage global',
      cibleParLien?.avant?.raccourcis === 0 && cibleParLien?.apres?.raccourcis === 1
        && cibleParLien?.apres?.noirs !== cibleParLien?.avant?.noirs
        && cibleParLien?.global === cibleParLien?.globalApres,
      `modules noirs ${cibleParLien?.avant?.noirs} → ${cibleParLien?.apres?.noirs}, `
        + `cellules portant le raccourci ${cibleParLien?.avant?.raccourcis} → `
        + `${cibleParLien?.apres?.raccourcis}, réglage global ${cibleParLien?.global} → `
        + `${cibleParLien?.globalApres}`,
    );
    record(
      'le texte imprimé sous le QR Code suit le même choix',
      cibleParLien?.avant?.raccourcis === 0 && cibleParLien?.apres?.raccourcis === 1
        && /is\.gd/.test(cibleParLien?.apres?.texteDuRaccourci ?? ''),
      `cellule raccourcie : « ${cibleParLien?.apres?.texteDuRaccourci} », `
        + `avec le réglage global « ${cibleParLien?.global} »`,
    );
    record(
      'le choix est enregistré sur ce lien, et sur lui seul',
      cibleParLien?.reglages?.[0] === true
        && cibleParLien.reglages.slice(1).every((v) => v === null),
      `réglages par lien : ${JSON.stringify(cibleParLien?.reglages)}`,
    );

    // Décocher doit rendre exactement l'état d'avant : un réglage qu'on ne peut
    // pas défaire serait pire que pas de réglage du tout.
    const retourArriere = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      document.querySelector('#list .link__target input')?.click();
      await pause(1100);
      const cellules = [...document.querySelectorAll('#preview .print-cell')];
      return {
        raccourcis: cellules.filter((c) => /is\.gd/.test(c.textContent)).length,
        noirs: cellules.reduce((somme, cellule) => {
          const chemin = cellule.querySelector('.print-cell__qr svg path')?.getAttribute('d') ?? '';
          return somme + (chemin.match(/M/g) ?? []).length;
        }, 0),
      };
    })()`);

    record(
      'décocher revient à l\'URL collectée',
      retourArriere?.raccourcis === 0 && retourArriere?.noirs === cibleParLien?.avant?.noirs,
      `${cibleParLien?.apres?.noirs} → ${retourArriere?.noirs} modules noirs, `
        + `${retourArriere?.raccourcis} cellule(s) portant le raccourci`,
    );

    // Remise en état : le raccourci factice disparaît, la planche reprend ses
    // réglages, et le parcours suivant retrouve une collection sans raccourci.
    await evalApp(`new Promise((resolve) => chrome.storage.local.get('links', (valeur) => {
      const liens = (valeur.links ?? []).map((l) => {
        const copie = Object.assign({}, l);
        delete copie.shortUrl;
        delete copie.shortProvider;
        delete copie.useShort;
        return copie;
      });
      chrome.storage.local.set({ links: liens }, resolve);
    }))`);
    await recharger(app.session);
    await forcerPeinture(app.session, 600);
    await evalApp(`(() => {
      const poser = (id, valeur) => {
        const n = document.getElementById(id);
        n.checked = valeur;
        n.dispatchEvent(new Event('change', { bubbles: true }));
      };
      poser('sheet-title', true);
      poser('sheet-url', false);
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    const tousOnglets = geometrie.every(
      (g) => g.onglets.length === 4 && g.onglets.every(Boolean),
    );
    record(
      'les quatre onglets sont mesurés à chaque largeur',
      tousOnglets,
      `libellés : ${geometrie[0]?.onglets.map((t) => t?.libelle).join(' · ')}`,
    );
    record(
      'aucun onglet ne déborde, à aucune largeur',
      tousOnglets && geometrie.every((g) => g.onglets.every((t) => !t.deborde)),
      geometrie.map((g) => `${g.largeurFenetre}px → bande ${g.bandeOnglets}px, `
        + `onglets ${g.onglets.map((t) => t.largeur).join('/')}`).join(' · '),
    );
    record(
      'aucun libellé d\'onglet ne passe à la ligne',
      tousOnglets && geometrie.every((g) => g.onglets.every((t) => t.hauteur <= 34)),
      geometrie.map((g) => `${g.largeurFenetre}px : hauteurs ${g.onglets.map((t) => t.hauteur).join('/')} px`).join(' · '),
    );
    record(
      'le bloc « série » tient ses deux champs sur une ligne',
      geometrie.every((g) => g.serieSurUneLigne !== false),
      geometrie.map((g) => `${g.largeurFenetre}px: ${g.serieSurUneLigne ? 'une ligne' : 'empilés'}`).join(' · '),
    );
    record(
      'aucun débordement horizontal de l\'application',
      geometrie.every((g) => g.debordement === false),
      geometrie.filter((g) => g.debordement)
        .map((g) => `${g.largeurFenetre}px : visible ${g.largeurVisible} / document ${g.largeurDocument}`
          + ` → ${g.coupables.join(' | ')}`).join(' · ') || 'aucune largeur ne déborde',
    );

    // L'aperçu : quelle part de la place offerte est réellement utilisée ?
    await app.session.call('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    await new Promise((r) => setTimeout(r, 400));

    // On fixe la largeur, on **attend le rendu**, puis on lit le cadre et la
    // place offerte dans la même évaluation. Mesurer le cadre d'un rendu
    // antérieur au redimensionnement comparerait deux largeurs, pas ce que
    // l'aperçu occupe — et accuserait l'aperçu d'un écart qui vient de la mesure.
    await app.session.call('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    await new Promise((r) => setTimeout(r, 1200));

    // On attend que le cadre se **stabilise** : une barre de défilement peut
    // apparaître après le rendu qui l'a fait naître, et la largeur utile change
    // alors d'un coup. On lit deux fois à 250 ms d'intervalle, et l'on ne retient
    // que la valeur qui ne bouge plus.
    const apercuPlanche = await evalApp(`(async () => {
      const lire = () => {
        const cadre = document.querySelector('#preview .preview__frame');
        return cadre ? Math.round(cadre.getBoundingClientRect().width) : -1;
      };
      let precedent = lire();
      for (let essai = 0; essai < 12; essai++) {
        await new Promise((r) => setTimeout(r, 250));
        const courant = lire();
        if (courant === precedent) break;
        precedent = courant;
      }

      const surface = document.getElementById('preview');
      const cadre = surface.querySelector('.preview__frame');
      const page = cadre?.firstElementChild;
      const box = (n) => { const b = n.getBoundingClientRect(); return { l: Math.round(b.width), h: Math.round(b.height) }; };
      // Le rembourrage reel, mesure : la fonction d'apercu fait de meme, et une
      // constante recopiee ici finirait par diverger de la feuille de style.
      const st = getComputedStyle(surface);
      const padX = (Number.parseFloat(st.paddingLeft) || 0) + (Number.parseFloat(st.paddingRight) || 0);
      return {
        largeurOfferte: Math.max(120, surface.clientWidth - padX),
        cadre: cadre ? box(cadre) : null,
        page: page ? box(page) : null,
        transformation: page ? page.style.transform : '',
        largeurPageMm: Number.parseFloat(page?.style.width ?? '0'),
        hauteurApercu: Math.round(surface.getBoundingClientRect().height),
      };
    })()`);

    // Le contrôle porte sur la **règle** : le cadre vaut la place offerte, ou la
    // taille réelle de la page si elle est plus petite.
    //
    // Un pourcentage ne suffisait pas : il passait au-dessus de 100 % quand le
    // panneau avait été redimensionné depuis le dernier rendu, ce qui mesurait
    // un décalage entre deux largeurs et non ce que l'aperçu occupe.
    const largeurCssPage = (apercuPlanche?.largeurPageMm ?? 0) * (96 / 25.4);
    const attenduCadre = Math.min(apercuPlanche?.largeurOfferte ?? 0, largeurCssPage);
    const ecartCadre = apercuPlanche?.cadre
      ? Math.abs(apercuPlanche.cadre.l - attenduCadre)
      : null;

    record(
      'la planche à l\'écran occupe la place offerte, sans la dépasser',
      ecartCadre !== null && ecartCadre <= 2,
      `${apercuPlanche?.cadre?.l} px dessinés pour ${Math.round(attenduCadre)} px attendus `
        + `(offerts ${apercuPlanche?.largeurOfferte}, page ${Math.round(largeurCssPage)} px réels) `
        + `→ ${apercuPlanche?.transformation}`,
    );

    // L'étiquette Niimbot : c'est ici que le soupçon de « trop gros » se mesure.
    //
    // La comparaison utile n'est pas écran/canevas — le canevas **est** créé à
    // la taille affichée, donc ce rapport vaut toujours 1 et ne dit rien. Ce
    // qu'il faut confronter, c'est la taille à l'écran et la taille réelle du
    // rouleau : à 96 px CSS par pouce, un rouleau de 12 mm doit occuper environ
    // 45 px. Au-delà, l'aperçu ment sur l'échelle.
    await evalApp(`[...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click()`);
    await new Promise((r) => setTimeout(r, 900));
    const mesureEtiquette = await evalApp(`(() => {
      const canvas = document.querySelector('#preview canvas');
      if (!canvas) return { absent: true };
      const boite = canvas.getBoundingClientRect();
      const consommable = document.getElementById('label-supply');
      const texte = consommable.selectedOptions?.[0]?.textContent ?? '';
      // « 12 × 30 mm » : la première cote est la largeur du rouleau.
      const cote = texte.match(/([0-9]+(?:[.,][0-9]+)?)\\s*(?:×|x)/);
      const largeurMm = cote ? Number.parseFloat(cote[1].replace(',', '.')) : null;
      return {
        largeurAffichee: Math.round(boite.width),
        hauteurAffichee: Math.round(boite.height),
        largeurCanvas: canvas.width,
        imageRendering: getComputedStyle(canvas).imageRendering,
        legende: document.querySelector('#preview .hint')?.textContent ?? '',
        profil: document.getElementById('label-profile').value,
        consommable: texte,
        largeurMm,
        // 96 px CSS par pouce : la correspondance admise entre le CSS et le
        // monde physique, faute de connaître le matériel d'affichage.
        largeurPhysiquePx: largeurMm ? Math.round((largeurMm / 25.4) * 96) : null,
        surfaceOfferte: document.getElementById('preview').clientWidth - 28,
      };
    })()`);

    const celluleEtiquette = { legende: mesureEtiquette?.legende };
    const apercuEtiquette = mesureEtiquette;
    const agrandissement = apercuEtiquette?.largeurPhysiquePx
      ? Number((apercuEtiquette.largeurAffichee / apercuEtiquette.largeurPhysiquePx).toFixed(2))
      : null;
    record(
      'l\'étiquette est rendue sans imprimante connectée',
      apercuEtiquette?.absent !== true && (apercuEtiquette?.largeurAffichee ?? 0) > 0,
      apercuEtiquette?.absent ? 'aucun canevas' : `${apercuEtiquette?.profil}, ${apercuEtiquette?.consommable}`,
    );
    // L'aperçu agrandit huit fois et demi à l'origine, sans le dire, borné par
    // un facteur de rendu — « 4 » — qui ne veut rien dire pour l'utilisateur.
    // Le contrôle porte maintenant sur ce que la fonctionnalité promet : un
    // multiple **borné** et **annoncé**.
    record(
      'l\'aperçu d\'étiquette est borné à quatre fois la taille réelle',
      agrandissement !== null && agrandissement <= 4.5,
      agrandissement === null
        ? 'largeur du rouleau illisible'
        : `« ${apercuEtiquette.consommable} » → ${apercuEtiquette.largeurAffichee} px à l'écran `
          + `pour ${apercuEtiquette.largeurPhysiquePx} px réels, soit ${agrandissement}× `
          + `(${apercuEtiquette.imageRendering}, aperçu large de ${apercuEtiquette.surfaceOfferte} px)`,
    );
    // La légende : **une information par ligne**, sous l'aperçu.
    //
    // Elle était d'un seul tenant — « D110 — 96 × 176 px, 2 px par module —
    // aperçu à la taille réelle (12,0 × 22,0 mm) » — et trois informations
    // distinctes à la queue leu leu se lisent mal.
    const legende = await evalApp(`(() => {
      const caption = document.querySelector('.preview__caption');
      const canvas = document.querySelector('#preview canvas');
      if (!caption || !canvas) return null;
      const faits = [...caption.querySelectorAll('.preview__fact')];
      return {
        horsDuCadre: !document.querySelector('.preview__page')?.contains(caption),
        lignes: faits.length,
        textes: faits.map((n) => n.textContent.trim()),
        empilees: faits.every((n, i) => i === 0
          || n.getBoundingClientRect().top >= faits[i - 1].getBoundingClientRect().bottom - 1),
        ecart: Math.round(caption.getBoundingClientRect().top - canvas.getBoundingClientRect().bottom),
      };
    })()`);

    // Cocher ou décocher une case de contenu doit **recalculer** ce qui est dit :
    // le nombre de lignes annoncé, la hauteur de l'étiquette, et le verdict.
    const casesContenu = await evalApp(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const lire = () => ({
        police: document.getElementById('label-font-hint').textContent.trim(),
        contenu: document.getElementById('label-content-hint').textContent.trim(),
        hauteurCanvas: document.querySelector('#preview canvas')?.height ?? 0,
        legende: document.querySelector('.preview__caption')?.textContent.trim() ?? '',
      });
      const avant = lire();
      const url = document.getElementById('label-show-url');
      url.checked = false;
      url.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(800);
      const decoche = lire();
      url.checked = true;
      url.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(800);
      const recoche = lire();
      return { avant, decoche, recoche };
    })()`);

    record(
      'cocher ou décocher une case de contenu recalcule ce qui est annoncé',
      casesContenu?.avant?.police !== casesContenu?.decoche?.police
        && casesContenu?.avant?.contenu !== casesContenu?.decoche?.contenu
        && casesContenu?.recoche?.police === casesContenu?.avant?.police
        && casesContenu?.recoche?.contenu === casesContenu?.avant?.contenu,
      `« ${casesContenu?.avant?.police} » → décoché : « ${casesContenu?.decoche?.police} » `
        + `→ recoché : « ${casesContenu?.recoche?.police} »`,
    );

    record(
      'la légende met une information par ligne, sous l\'aperçu',
      (legende?.lignes ?? 0) >= 2 && legende?.empilees === true && (legende?.ecart ?? -1) >= 0
        && legende?.horsDuCadre === true,
      `${legende?.lignes} ligne(s), empilées : ${legende?.empilees}, `
        + `${legende?.ecart} px sous l'aperçu, hors du cadre : ${legende?.horsDuCadre} — `
        + `« ${(legende?.textes ?? []).join(' | ').slice(0, 140)} »`,
    );

    record(
      "l'aperçu annonce son échelle et la taille réelle de l'étiquette",
      /taille réelle/.test(celluleEtiquette?.legende ?? '') && /\d+[.,]\d/.test(celluleEtiquette?.legende ?? ''),
      `« ${celluleEtiquette?.legende} »`,
    );

    const tailleReelle = await evalApp(`(async () => {
      const case_ = document.getElementById('label-real-size');
      case_.checked = true;
      case_.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 700));
      const canvas = document.querySelector('#preview canvas');
      const boite = canvas.getBoundingClientRect();
      const texte = document.querySelector('#preview .hint')?.textContent ?? '';
      case_.checked = false;
      case_.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 500));
      return { largeur: Math.round(boite.width), legende: texte };
    })()`);

    record(
      "la vue à taille réelle montre l'étiquette à sa taille physique",
      tailleReelle !== undefined && tailleReelle.largeur > 0
        && Math.abs(tailleReelle.largeur - (apercuEtiquette?.largeurPhysiquePx ?? -1)) <= 3,
      `${tailleReelle?.largeur} px à l'écran pour ${apercuEtiquette?.largeurPhysiquePx} px réels `
        + `— « ${tailleReelle?.legende} »`,
    );

    // --- La hiérarchie du panneau de la planche ---------------------------
    //
    // Deux groupes : la page, puis l'étiquette. Le contrôle porte sur ce qui se
    // voit — deux cadres distincts, avec leur légende — et sur ce qui ne doit
    // pas arriver : un champ resté hors des deux groupes.
    const groupes = await evalApp(`(() => {
      const panneau = document.querySelector('[data-mode-panel="sheet"]');
      if (!panneau) return { absent: true };
      const groupes = [...panneau.querySelectorAll('fieldset.sheet-group')];
      const lus = groupes.map((groupe) => {
        const style = getComputedStyle(groupe);
        const boite = groupe.getBoundingClientRect();
        return {
          legende: groupe.querySelector('legend')?.textContent.trim() ?? '',
          bordure: style.borderTopWidth,
          largeur: Math.round(boite.width),
          champs: groupe.querySelectorAll('input, select').length,
          messages: groupe.querySelectorAll('.hint').length,
        };
      });
      // Ce qui reste hors des deux groupes : les messages généraux de la
      // planche, et rien d'autre. Un champ égaré se verrait ici.
      const dansGroupes = new Set(
        groupes.flatMap((groupe) => [...groupe.querySelectorAll('input, select')]),
      );
      const orphelins = [...panneau.querySelectorAll('input, select')]
        .filter((champ) => !dansGroupes.has(champ))
        .map((champ) => champ.id || champ.tagName);
      return { groupes: lus, orphelins };
    })()`);

    record(
      'la planche présente deux groupes, la page puis l\'étiquette',
      groupes?.groupes?.length === 2
        && groupes.groupes[0].legende.length > 0
        && groupes.groupes[1].legende.length > 0,
      (groupes?.groupes ?? []).map((g) => `« ${g.legende} » (${g.champs} champs, `
        + `${g.messages} messages, bordure ${g.bordure})`).join(' · '),
    );
    record(
      'aucun réglage de la planche ne reste hors des deux groupes',
      (groupes?.orphelins ?? ['inconnu']).length === 0,
      (groupes?.orphelins ?? []).length
        ? `hors groupe : ${groupes.orphelins.join(', ')}`
        : 'tous les champs sont rangés',
    );

    // --- Un couple unique dans l'onglet Niimbot ---------------------------
    //
    // Il y en avait deux : « Lien à imprimer » et « Copies » d'un côté,
    // « Quels liens » et « Exemplaires de chacun » de l'autre, plus deux
    // boutons. Quatre champs répondaient à deux questions, et rien ne disait
    // lesquels allaient avec quel bouton. Le contrôle porte donc sur ce qui
    // **doit** exister, et sur ce qui ne doit plus.
    const doublons = await evalApp(`(() => {
      const lire = (id) => {
        const node = document.getElementById(id);
        if (!node) return null;
        const champ = node.closest('.field') ?? node.parentElement;
        return {
          libelle: champ?.querySelector('.field__label')?.textContent?.trim() ?? '',
          options: node.options ? node.options.length : null,
          groupes: node.querySelectorAll
            ? [...node.querySelectorAll('optgroup')].map((g) => g.label)
            : [],
        };
      };
      return {
        choix: lire('label-link'),
        exemplaires: lire('copies'),
        restes: document.querySelectorAll(
          '#print-label, #print-all-labels, #print-copies, #print-scope',
        ).length,
      };
    })()`);

    record(
      'un seul selecteur dit ce qu\'on imprime',
      doublons?.choix !== null && doublons?.choix?.libelle === 'Ce qu\'on imprime'
        && doublons.choix.groupes.length === 2,
      `« ${doublons?.choix?.libelle} » — ${doublons?.choix?.options} options en `
        + `${doublons?.choix?.groupes?.length} groupes : ${(doublons?.choix?.groupes ?? []).join(' / ')}`,
    );
    record(
      'un seul compteur dit combien d\'exemplaires',
      doublons?.exemplaires?.libelle === 'Exemplaires',
      `« ${doublons?.exemplaires?.libelle} », a cote du selecteur`,
    );
    record(
      'un seul bouton imprime, et rien ne reste des doublons',
      doublons?.restes === 1,
      `${doublons?.restes} element(s) d'impression dans l'onglet`,
    );


    // --- Le service worker, le badge et le menu contextuel ----------------
    //
    // Le worker MV3 est paresseux : il faut un événement pour le réveiller.
    await evalPopup(`new Promise((resolve) => chrome.runtime.sendMessage(
      { type: 'refresh-badge' }, () => resolve(true)))`);

    const workerTarget = await waitFor(async () => {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).catch(() => null);
      return list?.find((t) => (t.url || '').includes(`/${extensionId}/`) && t.type === 'service_worker') ?? null;
    }, { label: 'le service worker de l\'extension', timeout: 15000 }).catch(() => null);

    if (!workerTarget) {
      record('le service worker démarre', false, 'aucune cible de service worker trouvée');
    } else {
      record('le service worker démarre', true, workerTarget.url.split('/').pop());
      const worker = await connect(workerTarget.webSocketDebuggerUrl);
      const evalWorker = async (expression) => {
        const response = await worker.send('Runtime.evaluate', {
          expression, returnByValue: true, awaitPromise: true,
        });
        if (response.result?.exceptionDetails) {
          return { __erreur: response.result.exceptionDetails.exception?.description ?? 'erreur' };
        }
        return response.result?.result?.value;
      };

      // Sondage d'existence : `update` échoue sur un identifiant inconnu, et
      // renseigne `lastError`. C'est la seule façon d'interroger un menu natif.
      const menus = await evalWorker(`(async () => {
        const sondes = {};
        for (const id of ['urq-add-page', 'urq-add-link', 'urq-add-selection', 'urq-open-app', 'urq-separator']) {
          sondes[id] = await new Promise((resolve) => {
            chrome.contextMenus.update(id, { title: 'sonde' }, () => {
              const message = chrome.runtime.lastError?.message ?? '';
              resolve(message === '' ? 'présent' : message);
            });
          });
        }
        return sondes;
      })()`);

      if (menus?.__erreur) {
        record('le menu contextuel est interrogeable', false, menus.__erreur);
      } else {
        record('le menu contextuel est interrogeable', true);
        for (const [id, etat] of Object.entries(menus ?? {})) {
          // La fiche publiée décrit trois entrées d'ajout, et ne mentionne ni
          // séparateur ni « Ouvrir URLQRCodePrinter » : leur absence est un
          // choix, arrêté pour ne pas rouvrir l'écart entre la fiche et le
          // comportement. Les compter comme des échecs ferait passer un accord
          // délibéré pour une panne.
          const attendue = id === 'urq-add-page' || id === 'urq-add-link' || id === 'urq-add-selection';
          record(
            `entrée de menu « ${id} »`,
            attendue ? etat === 'présent' : null,
            attendue ? etat : `${etat} — absente par choix : la fiche n'en parle pas`,
          );
        }
      }

      // Le badge : c'est le **seul** retour d'un clic droit. On relève ce qu'il
      // affiche vraiment.
      //
      // La consigne est envoyée **depuis la page**, jamais depuis le service
      // worker : un contexte ne reçoit pas ses propres messages, si bien qu'un
      // `sendMessage` émis dans le worker n'atteint pas son écouteur. La première
      // version de ce script le faisait, lisait un badge inchangé, et aurait
      // conclu à une panne de retour inexistante. Le relevé doit être faux d'une
      // manière qui se voit, pas d'une manière qui accuse le produit.
      const badges = await evalPopup(`(async () => {
        const lire = async () => {
          const texte = await chrome.action.getBadgeText({});
          const couleur = await chrome.action.getBadgeBackgroundColor({});
          const [r, g, b] = couleur;
          return { texte, couleur: \`rgb(\${r}, \${g}, \${b})\` };
        };
        const ajouter = async (url, titre) => {
          await new Promise((resolve) => chrome.runtime.sendMessage(
            { type: 'record-capture', capture: { url, title: titre } }, () => resolve(true)));
          return lire();
        };
        const pause = (ms) => new Promise((r) => setTimeout(r, ms));

        // Un ajout neuf, le **même** lien avec un autre titre, puis le même
        // encore sans rien changer : trois issues distinctes, et trois retours.
        // Chaque lecture suit immédiatement la réponse, car le retour
        // transitoire est remplacé par le compteur au bout de 1,5 s.
        const neuf = 'https://exemple.fr/sonde-' + Date.now();
        const premier = await ajouter(neuf, 'Sonde');
        await pause(3000);
        const corrige = await ajouter(neuf, 'Sonde corrigée');
        await pause(3000);
        const doublon = await ajouter(neuf, 'Sonde corrigée');
        await pause(3000);
        const repos = await lire();
        return { premier, corrige, doublon, repos };
      })()`);

      const perm = await evalWorker(
        'new Promise((resolve) => chrome.permissions.getAll(resolve))',
      );

      if (badges?.__erreur) {
        record('le badge est interrogeable', false, badges.__erreur);
      } else {
        record('un ajout affiche « + » sur le badge', badges?.premier?.texte === '+',
          `« ${badges?.premier?.texte} » sur ${badges?.premier?.couleur}`);
        record(
          'un titre corrigé affiche « ✎ » sur le badge, et se distingue du doublon',
          badges?.corrige?.texte === '✎' && badges?.corrige?.texte !== badges?.doublon?.texte,
          `« ${badges?.corrige?.texte} » sur ${badges?.corrige?.couleur}`,
        );
        record("un doublon affiche « = » sur le badge", badges?.doublon?.texte === '=',
          `« ${badges?.doublon?.texte} » sur ${badges?.doublon?.couleur}`);
        // Le doublon est un **résultat**, pas un ajout : si sa couleur est celle
        // du compteur, l'utilisateur ne peut pas distinguer « déjà présent » de
        // « rien ne s'est passé ».
        record(
          'le badge du doublon se distingue de celui du compteur',
          badges?.doublon?.couleur !== badges?.repos?.couleur,
          `doublon ${badges?.doublon?.couleur} · au repos ${badges?.repos?.couleur}`,
        );
        record(
          'le badge revient au compteur après le retour transitoire',
          badges?.repos?.texte !== '+' && badges?.repos?.texte !== '=',
          `« ${badges?.repos?.texte} » au repos`,
        );
      }

      if (perm?.__erreur) {
        record('les permissions sont interrogeables', false, perm.__erreur);
      } else {
        const declarees = ['contextMenus', 'storage', 'activeTab', 'scripting'];
        record(
          'aucune permission au-delà des quatre déclarées',
          Array.isArray(perm?.permissions)
            && perm.permissions.every((p) => declarees.includes(p))
            && (perm.hostPermissions ?? []).length === 0,
          `API : ${(perm?.permissions ?? []).join(', ')} · hôtes : ${(perm?.hostPermissions ?? []).length}`,
        );
      }

      // --- Une longue liste sort sur plusieurs pages --------------------------
      //
      // Signalé : « en mode tableau, quand une ligne est coupée, il faut gérer
      // l'impression multi-pages ». Mesuré avant correction : 46 lignes pour
      // 1 123 px de page utile, **27 lignes hors de la page**, la dernière coupée
      // en deux — la boîte avait la hauteur du papier et `overflow: hidden`.
      //
      // Le contrôle se fait **en dernier**, sur sa propre collection : il ajoute
      // quarante-cinq liens, et les relevés précédents ne doivent pas les voir.
      // La planche est mesurée dans la foulée, parce que la question posée
      // portait sur les deux, et qu'un correctif d'un côté ne doit pas casser
      // l'autre.
      const NOMBRE_LONG = 45;
      await evalApp(`new Promise((resolve) => chrome.storage.local.get('links', (valeur) => {
        const liens = valeur.links ?? [];
        for (let i = 0; i < ${NOMBRE_LONG}; i += 1) {
          const numero = String(i + 1).padStart(3, '0');
          liens.push({
            id: 'long-' + numero,
            url: 'https://exemple.fr/article-' + numero + '?ref=releve',
            title: 'Article ' + numero + ' — un titre de longueur ordinaire',
            note: '', tags: [], createdAt: Date.now() - (${NOMBRE_LONG} - i) * 3600000,
            updatedAt: Date.now(), source: 'manual', favicon: '', shortUrl: '',
            shortProvider: '', shortenedAt: 0, order: liens.length,
          });
        }
        chrome.storage.local.set({ links: liens }, resolve);
      }))`);
      await recharger(app.session);
      await forcerPeinture(app.session, 900);

      const pagination = await evalApp(`(async () => {
        const pause = (ms) => new Promise((r) => setTimeout(r, ms));
        const attendues = Array.from({ length: ${NOMBRE_LONG} }, (_, i) =>
          'https://exemple.fr/article-' + String(i + 1).padStart(3, '0') + '?ref=releve');

        // Le rendu papier se prépare au clic ; on l'obtient par l'événement que
        // le navigateur envoie lui-même, sans ouvrir la boîte de dialogue —
        // qui bloquerait le script jusqu'à ce que quelqu'un la referme.
        const preparer = async (onglet) => {
          [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === onglet).click();
          await pause(1400);
          const racine = document.getElementById('print-root');
          racine.textContent = '';
          window.dispatchEvent(new Event('beforeprint'));
          await pause(1400);
          return racine;
        };

        const racineTable = await preparer('table');
        const pagesTable = [...racineTable.querySelectorAll('.print-page')];
        const lignesTexte = [...racineTable.querySelectorAll('.print-table tbody tr')]
          .map((l) => l.textContent);
        // **Le compte attendu se lit, il ne se suppose pas.** Les contrôles
        // précédents ont laissé des liens dans la collection : la longueur
        // imprimée est celle de la liste, au moment du relevé.
        const liens = document.querySelectorAll('#list .link').length;
        const tableau = {
          pages: pagesTable.length,
          lignes: lignesTexte.length,
          liens,
          manquantes: attendues.filter((u) => !lignesTexte.some((t) => t.includes(u))).length,
          enDouble: lignesTexte.length - new Set(lignesTexte).size,
          entetesParPage: pagesTable.map((p) => p.querySelectorAll('.print-table thead tr').length),
          // Une ligne hors de sa page serait coupee par le debordement cache.
          horsPage: pagesTable.reduce((total, page) => {
            const cadre = page.getBoundingClientRect();
            return total + [...page.querySelectorAll('.print-table tr')].filter((l) => (
              l.getBoundingClientRect().bottom - cadre.top > page.clientHeight + 1
            )).length;
          }, 0),
          parPage: pagesTable.map((p) => p.querySelectorAll('.print-table tbody tr').length),
        };

        const racinePlanche = await preparer('sheet');
        const pagesPlanche = [...racinePlanche.querySelectorAll('.print-page')];
        const planche = {
          pages: pagesPlanche.length,
          cellules: racinePlanche.querySelectorAll('.print-cell').length,
          horsPage: pagesPlanche.reduce((total, page) => {
            const cadre = page.getBoundingClientRect();
            return total + [...page.querySelectorAll('.print-cell')].filter((c) => (
              c.getBoundingClientRect().bottom - cadre.top > page.clientHeight + 1
            )).length;
          }, 0),
        };

        // Ce que la légende de l'aperçu annonce, pour l'onglet Tableau.
        [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
        await pause(1200);
        const legende = [...document.querySelectorAll('#preview .preview__fact')]
          .map((n) => n.textContent.trim());

        return { attendues: attendues.length, tableau, planche, legende };
      })()`);

      // Le **vrai** paginateur du navigateur, pour ne pas se contenter de nos
      // propres boîtes : `preferCSSPageSize` lui fait honorer le `@page` du
      // produit.
      const pdfTable = await app.session.call('Page.printToPDF', {
        printBackground: true, preferCSSPageSize: true,
      });
      const pagesPdf = (Buffer.from(pdfTable.data, 'base64').toString('latin1')
        .match(/\/Type\s*\/Page[^s]/g) ?? []).length;

      record(
        'un tableau long sort sur plusieurs pages, sans perdre une ligne',
        (pagination?.tableau?.pages ?? 0) > 1
          && pagination?.tableau?.lignes === pagination?.tableau?.liens
          && pagination?.tableau?.manquantes === 0
          && pagination?.tableau?.enDouble === 0
          && pagination?.tableau?.horsPage === 0
          && pagesPdf === pagination?.tableau?.pages,
        `${pagination?.tableau?.liens} liens → ${pagination?.tableau?.pages} page(s) `
          + `(${pagination?.tableau?.parPage?.join(' + ')} lignes), `
          + `${pagination?.tableau?.horsPage} ligne(s) hors page, `
          + `${pagination?.tableau?.manquantes} adresse(s) manquante(s), `
          + `${pagination?.tableau?.enDouble} doublon(s) — PDF du navigateur : ${pagesPdf} page(s)`,
      );

      record(
        'l\'en-tête du tableau se répète en tête de chaque page',
        (pagination?.tableau?.entetesParPage ?? []).length > 1
          && pagination.tableau.entetesParPage.every((n) => n === 1),
        `${(pagination?.tableau?.entetesParPage ?? []).length} page(s), `
          + `en-tête(s) par page : ${(pagination?.tableau?.entetesParPage ?? []).join(', ')}`,
      );

      record(
        'la légende de l\'aperçu annonce le nombre de pages du tableau',
        (pagination?.legende ?? []).some((fait) => /page/i.test(fait) && /\d/.test(fait)),
        `« ${(pagination?.legende ?? []).join(' | ')} »`,
      );

      record(
        'la planche découpe ses pages, et aucune étiquette ne déborde',
        (pagination?.planche?.pages ?? 0) > 1
          && pagination?.planche?.cellules === pagination?.tableau?.liens
          && pagination?.planche?.horsPage === 0,
        `${pagination?.planche?.pages} page(s), ${pagination?.planche?.cellules} étiquette(s) `
          + `pour ${pagination?.tableau?.liens} lien(s), ${pagination?.planche?.horsPage} hors page`,
      );

      // Remise en état : la collection longue disparaît, et l'onglet revient à
      // la planche — le relevé se termine comme il a commencé.
      await evalApp(`new Promise((resolve) => chrome.storage.local.get('links', (valeur) => {
        chrome.storage.local.set({
          links: (valeur.links ?? []).filter((lien) => !String(lien.id).startsWith('long-')),
        }, resolve);
      }))`);
      await recharger(app.session);
      await forcerPeinture(app.session, 700);
      await evalApp(`(async () => {
        const pause = (ms) => new Promise((r) => setTimeout(r, ms));
        [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
        await pause(600);
      })()`);

      // --- La taille du titre, et celle du QR Code ---------------------------
      //
      // Deux réglages demandés : « un champ pour la taille du titre en plus de la
      // taille du texte », et « pour le Niimbot M2 et M3, pouvoir changer la
      // taille du QR Code car on a de la place quand on compare au D110 ».
      //
      // Le second ne doit **pas** apparaître sur un D110 : le QR Code y occupe
      // déjà toute la largeur utile, et un champ qui ne peut rien changer est une
      // commande sans effet. Le contrôle vérifie les deux faces — le champ agit
      // sur une tête large, et il est absent de la petite.
      const reglages = await evalApp(`(async () => {
        const pause = (ms) => new Promise((r) => setTimeout(r, ms));
        const el = (id) => document.getElementById(id);
        const chiffres = () => {
          // La ligne du QR Code, et non la legende de l'etiquette : c'est elle
          // qui annonce la taille obtenue et les pixels par module.
          const fait = el('label-qr-hint')?.textContent.trim() ?? '';
          const px = /([0-9]+(?:[.,][0-9]+)?) px par module/.exec(fait);
          return {
            fait,
            pxParModule: px ? Number(px[1].replace(',', '.')) : null,
            hauteur: document.querySelector('#preview canvas')?.height ?? 0,
            encre: (() => {
              const canvas = document.querySelector('#preview canvas');
              if (!canvas || !canvas.width) return 0;
              const donnees = canvas.getContext('2d')
                .getImageData(0, 0, canvas.width, canvas.height).data;
              let n = 0;
              for (let i = 0; i < donnees.length; i += 4) if (donnees[i] < 128) n += 1;
              return n;
            })(),
            qrHint: el('label-qr-hint')?.textContent.trim() ?? '',
          };
        };

        [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click();
        await pause(1400);

        // --- Le QR Code, sur une tete large puis sur la petite ---
        const profil = el('label-profile');
        const valeurs = [...profil.options].map((o) => o.value);
        const m2 = valeurs.find((v) => /m2/i.test(v));
        profil.value = m2;
        profil.dispatchEvent(new Event('change', { bubbles: true }));
        await pause(1400);
        const champVisibleM2 = el('label-qr-field')?.hidden === false;

        const poserQr = (mm) => {
          el('label-qr-size').value = String(mm);
          el('label-qr-size').dispatchEvent(new Event('input', { bubbles: true }));
        };
        poserQr(15);
        await pause(900);
        const qrPetit = chiffres();
        poserQr(40);
        await pause(900);
        const qrGrand = chiffres();

        // Puis le D110 : le champ doit disparaitre.
        const d110 = valeurs.find((v) => /d110/i.test(v));
        profil.value = d110;
        profil.dispatchEvent(new Event('change', { bubbles: true }));
        await pause(1400);
        const champVisibleD110 = el('label-qr-field')?.hidden === false;
        const qrRelache = chiffres();

        // --- Le titre ---
        const tailleTitre = el('label-title-size');
        tailleTitre.value = '1.2';
        tailleTitre.dispatchEvent(new Event('input', { bubbles: true }));
        await pause(900);
        const titrePetit = chiffres();
        tailleTitre.value = '3';
        tailleTitre.dispatchEvent(new Event('input', { bubbles: true }));
        await pause(900);
        const titreGrand = chiffres();

        return {
          champVisibleM2, champVisibleD110, qrPetit, qrGrand, qrRelache, titrePetit, titreGrand,
        };
      })()`);

      record(
        'la taille du QR Code se règle sur une tête large, et n\'existe pas sur un D110',
        reglages?.champVisibleM2 === true
          && reglages?.champVisibleD110 === false
          && (reglages?.qrGrand?.pxParModule ?? 0) > (reglages?.qrPetit?.pxParModule ?? 0),
        `M2 : champ visible ${reglages?.champVisibleM2}, `
          + `15 mm → ${reglages?.qrPetit?.pxParModule} px par module, `
          + `40 mm → ${reglages?.qrGrand?.pxParModule} px par module — `
          + `D110 : champ visible ${reglages?.champVisibleD110} — « ${reglages?.qrPetit?.qrHint?.slice(0, 110)} »`,
      );

      record(
        'la taille du titre change ce qui est imprimé, indépendamment du texte',
        (reglages?.titreGrand?.encre ?? 0) !== (reglages?.titrePetit?.encre ?? 0),
        `titre à 1,2 mm : ${reglages?.titrePetit?.encre} pixels d'encre, `
          + `à 3 mm : ${reglages?.titreGrand?.encre} — `
          + `hauteur ${reglages?.titrePetit?.hauteur} puis ${reglages?.titreGrand?.hauteur} px`,
      );

      // --- L'interface anglaise ne montre plus de français --------------------
      //
      // Signalé : « la traduction anglaise de Orientation de la page > Paysage
      // est fausse, utiliser Landscape ». Mesuré : la clé n'existait **pas** dans
      // le catalogue anglais, et l'interface affichait donc le mot français.
      //
      // Le défaut n'était pas seul. Cinq dispositions de texte et douze
      // consommables manquaient aussi, pour la même raison : ces libellés sont
      // donnés à `t()` par variable — `t(entree.label)` — si bien que le relevé
      // des clés, qui ne lit que les chaînes littérales, ne les voyait pas. Le
      // contrôle lit donc les listes **telles qu'elles s'affichent**, en anglais.
      await evalApp(`new Promise((resolve) => chrome.storage.local.set({ locale: 'en' }, resolve))`);
      await recharger(app.session);
      await forcerPeinture(app.session, 900);

      const anglais = await evalApp(`(async () => {
        const pause = (ms) => new Promise((r) => setTimeout(r, ms));
        const ouvrir = async (onglet) => {
          [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === onglet).click();
          await pause(1000);
        };
        await ouvrir('table');
        const orientation = [...document.getElementById('table-orientation').options]
          .map((o) => o.textContent.trim());
        await ouvrir('single');
        const dispositions = [...document.getElementById('label-rotation').options]
          .map((o) => o.textContent.trim());
        const consommables = [...document.getElementById('label-supply').options]
          .map((o) => o.textContent.trim());
        return { orientation, dispositions, consommables };
      })()`);

      // Ce qu'on cherche : des **mots français** restés dans l'interface
      // anglaise. La liste est courte et nomme le défaut signalé, plutôt que de
      // prétendre juger l'anglais.
      const MOTS_FRANCAIS = /Paysage|Texte|rond\b|bijouterie|câble|auto-pelliculé/i;
      const restes = [
        ...(anglais?.orientation ?? []),
        ...(anglais?.dispositions ?? []),
        ...(anglais?.consommables ?? []),
      ].filter((libelle) => MOTS_FRANCAIS.test(libelle));

      record(
        'l\'interface anglaise ne montre plus de mot français dans ces trois listes',
        (anglais?.orientation ?? []).includes('Landscape')
          && !(anglais?.orientation ?? []).includes('Paysage')
          && restes.length === 0,
        `orientation : ${(anglais?.orientation ?? []).join(', ')} — `
          + `${(anglais?.dispositions ?? []).length} disposition(s), `
          + `${(anglais?.consommables ?? []).length} consommable(s)`
          + (restes.length ? ` — restes français : ${restes.join(' | ')}` : ''),
      );

      // Remise en état : la langue française, comme le reste du relevé.
      await evalApp(`new Promise((resolve) => chrome.storage.local.set({ locale: 'fr' }, resolve))`);
      await recharger(app.session);
      await forcerPeinture(app.session, 700);

      // --- Le titre dans la bande tournée ------------------------------------
      //
      // Signalé : « en fonction de la taille du supply on est coupé, alors qu'on a
      // de la place pour afficher du texte — surtout avec le texte tourné ».
      //
      // Mesuré avant correction, sur un 12 × 75 mm tourné : le titre occupait
      // **deux** rangées de 72 px dans une bande de 490 px, et la moitié du titre
      // était perdue. Les lignes du titre venaient de la disposition empilée, où
      // elles sont découpées à la largeur de l'étiquette ; dans la bande tournée,
      // chaque rangée court sur sa **longueur**.
      //
      // Le contrôle mesure le coût du titre en rangees : total avec le titre moins
      // total sans. Il doit valoir une rangee, pas deux.
      const texteTourne = await evalApp(`(async () => {
        const pause = (ms) => new Promise((r) => setTimeout(r, ms));
        const el = (id) => document.getElementById(id);
        [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click();
        await pause(1400);
        el('label-profile').value = 'niimbot-d110';
        el('label-profile').dispatchEvent(new Event('change', { bubbles: true }));
        await pause(1200);
        el('label-supply').value = '12x30';
        for (const option of el('label-supply').options) {
          if (/75 mm/.test(option.textContent)) el('label-supply').value = option.value;
        }
        el('label-supply').dispatchEvent(new Event('change', { bubbles: true }));
        await pause(800);
        for (const option of el('label-rotation').options) {
          if (/bas en haut|bottom to top/i.test(option.textContent)) el('label-rotation').value = option.value;
        }
        el('label-rotation').dispatchEvent(new Event('change', { bubbles: true }));
        await pause(800);

        const rangees = () => {
          const m = /(\\d+)\\s*(?:lignes?|lines?)/.exec(el('label-font-hint').textContent);
          return m ? Number(m[1]) : null;
        };
        const lire = () => ({
          rangees: rangees(),
          encre: (() => {
            const canvas = document.querySelector('#preview canvas');
            if (!canvas || !canvas.width) return 0;
            const donnees = canvas.getContext('2d')
              .getImageData(0, 0, canvas.width, canvas.height).data;
            let n = 0;
            for (let i = 0; i < donnees.length; i += 4) if (donnees[i] < 128) n += 1;
            return n;
          })(),
          faits: [...document.querySelectorAll('#preview .preview__fact')].map((n) => n.textContent.trim()),
        });

        const titre = el('label-show-title');
        titre.checked = true;
        titre.dispatchEvent(new Event('change', { bubbles: true }));
        await pause(900);
        const avec = lire();
        titre.checked = false;
        titre.dispatchEvent(new Event('change', { bubbles: true }));
        await pause(900);
        const sans = lire();
        titre.checked = true;
        titre.dispatchEvent(new Event('change', { bubbles: true }));
        await pause(600);

        // Puis une etiquette courte, ou le texte ne peut pas tenir : le refus doit
        // apparaitre, au lieu d'une adresse tronquee en silence.
        for (const option of el('label-supply').options) {
          if (/22 mm/.test(option.textContent)) el('label-supply').value = option.value;
        }
        el('label-supply').dispatchEvent(new Event('change', { bubbles: true }));
        await pause(1000);
        const court = lire();

        return { avec, sans, court };
      })()`);

      const coutDuTitre = (texteTourne?.avec?.rangees ?? 0) - (texteTourne?.sans?.rangees ?? 0);
      record(
        'dans la bande tournée, le titre coûte une rangée et non deux',
        coutDuTitre === 1
          && (texteTourne?.avec?.encre ?? 0) > (texteTourne?.sans?.encre ?? 0),
        `${texteTourne?.avec?.rangees} rangée(s) avec le titre, `
          + `${texteTourne?.sans?.rangees} sans : coût ${coutDuTitre} — encre `
          + `${texteTourne?.avec?.encre} contre ${texteTourne?.sans?.encre}`,
      );

      record(
        'un texte qui ne tient pas est annoncé, au lieu d\'être coupé en silence',
        (texteTourne?.court?.faits ?? []).some((fait) => /coup|cut/i.test(fait)),
        `sur une étiquette courte : `
          + `« ${(texteTourne?.court?.faits ?? []).join(' | ').slice(0, 190)} »`,
      );
    }
  } finally {
    // Les sessions se referment avant le navigateur : une socket ouverte sur un
    // processus tué laisse une promesse en attente, et le script se termine avec
    // un avertissement qui masque le relevé.
    for (const session of sessions) {
      try {
        session.ws.close();
      } catch {
        // Déjà fermée.
      }
    }
    shutdown(browser);
  }

  // --- Relevé ---------------------------------------------------------------
  const echecs = results.filter((r) => r.ok === false);
  console.log('');
  console.log(`${results.length - echecs.length}/${results.length} constats satisfaits.`);
  writeFileSync(
    join(SANDBOX, 'releve.json'),
    `${JSON.stringify(results, null, 2)}\n`,
    'utf8',
  );
  console.log(`Relevé écrit dans ${join('.verify-chrome', 'releve.json')}`);
  console.log(`Captures dans ${join('.verify-chrome-captures')}/`);

  if (echecs.length) {
    console.log('');
    console.log('À corriger :');
    for (const echec of echecs) console.log(`  ✗ ${echec.label} — ${echec.detail}`);
    process.exitCode = 1;
  }
}

await main();
