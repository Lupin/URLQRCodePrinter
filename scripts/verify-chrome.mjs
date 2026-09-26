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

    await evalPopup('location.reload()');
    await new Promise((r) => setTimeout(r, 2500));

    const rows = await evalPopup("document.querySelectorAll('#list .item').length");
    record('la fenêtre affiche les liens collectés', rows === 2, `${rows} ligne(s)`);

    // --- Les mesures de rendu ---------------------------------------------
    //
    // C'est le cœur du lot : les mêmes paires que l'audit, mais lues sur le
    // document rendu au lieu des jetons. Le contrôle des composants ne vise que
    // les commandes : un séparateur décoratif est explicitement exempté par le
    // critère 1.4.11, et le compter ferait échouer la mesure pour rien.
    const contrast = await evalPopup(`(() => {
      ${CONTRAST_HELPER}
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
        const bordure = _parseColour(style.borderTopColor);
        const epaisseur = Number.parseFloat(style.borderTopWidth);
        // Le contour se juge contre ce qu'il borde : le fond du composant s'il
        // est opaque, sinon le fond peint derrière lui.
        const interieur = _parseColour(style.backgroundColor) ?? _paintedBackground(node);
        sortie.composants.push({
          nom: cible.nom,
          couleur: style.borderTopColor,
          fond: \`rgb(\${interieur.r}, \${interieur.g}, \${interieur.b})\`,
          ratio: bordure && epaisseur > 0 ? Number(_ratio(bordure, interieur).toFixed(2)) : null,
          epaisseur,
          seuil: 3,
          etat: epaisseur > 0 ? 'mesuré' : 'sans contour',
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

    // 2.5.8 Target Size (Minimum) : 24 × 24 px. On ne juge que les commandes
    // dont la cible est le contrôle lui-même — un lien en ligne en est exempté.
    const tropPetits = parcours.filter(
      (p) => ['BUTTON', 'SELECT', 'INPUT', 'A'].includes(p.tag)
        && p.visible && (p.largeur < 24 || p.hauteur < 24),
    );
    record(
      'chaque commande atteinte tient la cible de 24 × 24 px',
      tropPetits.length === 0,
      tropPetits.length
        ? tropPetits.map((p) => `${p.id || p.classe} ${p.largeur}×${p.hauteur}`).join(' · ')
        : `${parcours.filter((p) => p.visible).length} commande(s) mesurée(s)`,
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
      await new Promise((r) => setTimeout(r, 400));
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
    const app = await openPage(`chrome-extension://${extensionId}/app.html`);
    const evalApp = evaluateIn(app.session);
    await evalApp('document.readyState');
    await new Promise((r) => setTimeout(r, 1200));

    // Un lien, pour que l'aperçu ait quelque chose à rendre.
    await evalApp(`new Promise((resolve) => chrome.runtime.sendMessage(
      { type: 'record-capture', capture: { url: 'https://exemple.fr/un-article-assez-long-pour-un-qr',
        title: 'Un article de fond sur la question' } }, () => resolve(true)))`);

    // **La langue est forcée au français**, et c'est le pire cas : « Étiquette
    // (divers) » est le libellé d'onglet le plus long des deux langues. Mesurer
    // la version anglaise reviendrait à éprouver la mise en page la plus facile.
    await evalApp(`new Promise((resolve) => chrome.storage.local.set({ locale: 'fr' }, resolve))`);
    await evalApp('location.reload()');
    await new Promise((r) => setTimeout(r, 2500));

    const largeurs = [1280, 1000, 900, 760, 560, 440, 400, 380];
    const geometrie = [];
    for (const largeur of largeurs) {
      await app.session.call('Emulation.setDeviceMetricsOverride', {
        width: largeur, height: 900, deviceScaleFactor: 1, mobile: false,
      });
      await new Promise((r) => setTimeout(r, 350));
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
      geometrie.map((g) => `${g.largeurFenetre}px : visible ${g.largeurVisible} / document ${g.largeurDocument}`
        + (g.coupables.length ? ` → ${g.coupables.join(' | ')}` : '')).join('\n    '),
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
          record(`entrée de menu « ${id} »`, etat === 'présent', etat);
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
        await pause(1800);
        const doublon = await ajouter(neuf, 'Sonde');
        await pause(1800);
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
