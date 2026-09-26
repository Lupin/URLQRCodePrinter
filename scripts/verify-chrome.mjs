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
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

    const sansAnneau = parcours.filter((p) => p.anneau === '');
    record(
      'chaque arrêt de tabulation porte un anneau de focus visible',
      sansAnneau.length === 0,
      sansAnneau.length
        ? `sans anneau : ${sansAnneau.map((p) => p.id || p.classe).join(', ')}`
        : `${parcours.length} arrêt(s) tous cerclés`,
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
          debordement: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          largeurVisible: document.documentElement.clientWidth,
          largeurDocument: document.documentElement.scrollWidth,
          coupables: [...document.querySelectorAll('body *')]
            .map((n) => ({ n, box: n.getBoundingClientRect() }))
            .filter(({ box }) => box.right > document.documentElement.clientWidth + 1 || box.left < -1)
            .slice(0, 5)
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
      nombre('sheet-margin-y', '12.9');
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

    const apercuPlanche = await evalApp(`(() => {
      const surface = document.getElementById('preview');
      const cadre = surface.querySelector('.preview__frame');
      const page = cadre?.firstElementChild;
      const box = (n) => { const b = n.getBoundingClientRect(); return { l: Math.round(b.width), h: Math.round(b.height) }; };
      return {
        largeurOfferte: surface.clientWidth - 28,
        cadre: cadre ? box(cadre) : null,
        page: page ? box(page) : null,
        transformation: page ? page.style.transform : '',
        hauteurApercu: Math.round(surface.getBoundingClientRect().height),
      };
    })()`);

    const ratioPlanche = apercuPlanche?.cadre && apercuPlanche?.largeurOfferte
      ? Number((apercuPlanche.cadre.l / apercuPlanche.largeurOfferte).toFixed(2))
      : null;
    record(
      'la planche à l\'écran occupe la place offerte',
      ratioPlanche !== null && ratioPlanche >= 0.9,
      `${apercuPlanche?.cadre?.l} px dessinés sur ${apercuPlanche?.largeurOfferte} px offerts `
        + `→ ${Math.round((ratioPlanche ?? 0) * 100)} %, transformation ${apercuPlanche?.transformation}`,
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
    const apercuEtiquette = await evalApp(`(() => {
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
        profil: document.getElementById('label-profile').value,
        consommable: texte,
        largeurMm,
        // 96 px CSS par pouce : la correspondance admise entre le CSS et le
        // monde physique, faute de connaître le matériel d'affichage.
        largeurPhysiquePx: largeurMm ? Math.round((largeurMm / 25.4) * 96) : null,
        surfaceOfferte: document.getElementById('preview').clientWidth - 28,
      };
    })()`);

    const agrandissement = apercuEtiquette?.largeurPhysiquePx
      ? Number((apercuEtiquette.largeurAffichee / apercuEtiquette.largeurPhysiquePx).toFixed(1))
      : null;
    record(
      'l\'étiquette est rendue sans imprimante connectée',
      apercuEtiquette?.absent !== true && (apercuEtiquette?.largeurAffichee ?? 0) > 0,
      apercuEtiquette?.absent ? 'aucun canevas' : `${apercuEtiquette?.profil}, ${apercuEtiquette?.consommable}`,
    );
    record(
      'l\'aperçu d\'étiquette respecte l\'échelle du rouleau',
      agrandissement !== null && agrandissement <= 2,
      agrandissement === null
        ? 'largeur du rouleau illisible'
        : `« ${apercuEtiquette.consommable} » → ${apercuEtiquette.largeurAffichee} px à l'écran `
          + `pour ${apercuEtiquette.largeurPhysiquePx} px réels, soit ${agrandissement}× `
          + `(${apercuEtiquette.imageRendering}, aperçu large de ${apercuEtiquette.surfaceOfferte} px)`,
    );

    // --- Les deux sélecteurs qui se ressemblent --------------------------
    //
    // « Lien à imprimer » et « Quels liens » répondent à la même question, à
    // deux endroits du même onglet, comme les deux compteurs d'exemplaires.
    const doublons = await evalApp(`(() => {
      const libelle = (id) => {
        const node = document.getElementById(id);
        if (!node) return null;
        const champ = node.closest('.field');
        return {
          libelle: champ?.querySelector('.field__label')?.textContent?.trim() ?? '',
          valeurParDefaut: node.value,
          options: node.options ? node.options.length : null,
          y: Math.round(node.getBoundingClientRect().y),
        };
      };
      return {
        lien: libelle('label-link'),
        portee: libelle('print-scope'),
        exemplairesEtiquette: libelle('copies'),
        exemplairesSerie: libelle('print-copies'),
      };
    })()`);

    record(
      'deux sélecteurs répondent à « quel lien »',
      Boolean(doublons?.lien && doublons?.portee),
      `« ${doublons?.lien?.libelle} » et « ${doublons?.portee?.libelle} » `
        + `(${doublons?.lien?.options} / ${doublons?.portee?.options} options)`,
    );
    record(
      'deux champs répondent à « combien d\'exemplaires »',
      Boolean(doublons?.exemplairesEtiquette && doublons?.exemplairesSerie),
      `« ${doublons?.exemplairesEtiquette?.libelle} » et « ${doublons?.exemplairesSerie?.libelle} »`,
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

        // Un ajout neuf, puis le **même** lien deux fois : c'est ainsi qu'un
        // doublon se produit. Chaque lecture suit immédiatement la réponse, car
        // le retour transitoire est remplacé par le compteur au bout de 1,5 s.
        const neuf = 'https://exemple.fr/sonde-' + Date.now();
        const premier = await ajouter(neuf, 'Sonde');
        await pause(3000);
        const doublon = await ajouter(neuf, 'Sonde');
        await pause(3000);
        const repos = await lire();
        return { premier, doublon, repos };
      })()`);

      const perm = await evalWorker(
        'new Promise((resolve) => chrome.permissions.getAll(resolve))',
      );

      if (badges?.__erreur) {
        record('le badge est interrogeable', false, badges.__erreur);
      } else {
        record('un ajout affiche « + » sur le badge', badges?.premier?.texte === '+',
          `« ${badges?.premier?.texte} » sur ${badges?.premier?.couleur}`);
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
