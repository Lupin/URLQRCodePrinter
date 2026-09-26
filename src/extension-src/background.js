/**
 * Service worker de l'extension.
 *
 * Rôle volontairement mince : enregistrer le menu contextuel, enregistrer les
 * captures, et tenir le compteur affiché sur l'icône. La logique de décision
 * vit dans `core/capture.js`, testée hors navigateur.
 *
 * Un service worker MV3 est arrêté dès qu'il devient inactif : aucun état ne
 * doit vivre dans une variable de module. Le store relit donc `storage.local`
 * à chaque opération.
 *
 * Le module ne suppose ni l'espace de noms `chrome`, ni la présence du menu
 * contextuel : Safari expose `browser` et **ne fournit pas `contextMenus` sur
 * iOS**. Sans ces précautions, l'extension échouerait au chargement sur iPhone.
 */

import { createChromeStorageStore } from './core/store.js';
import {
  MENU_IDS,
  buildMenuDefinitions,
  captureFromClick,
} from './core/capture.js';
import { resolveApi, contextMenusAvailable, installContextMenus } from './api.js';
import { initI18n } from './core/i18n.js';
import { readConsent, isAccepted } from './core/privacy.js';

const api = resolveApi();

/**
 * Couleurs du badge.
 *
 * Le badge est peint par le service worker, **pas** par la feuille de style :
 * c'est le troisième endroit où vivait la charte, et le seul qui ait gardé le
 * teal d'origine après la refonte. Il ne se voit nulle part dans le code de
 * l'interface — seulement dans la barre d'outils.
 *
 * Le compteur est à l'encre, comme celui de la fenêtre, et surtout **pas à
 * l'accent** : l'icône de la barre d'outils est déjà orange, un badge orange s'y
 * fondrait au lieu de s'en détacher.
 *
 * Un doublon **inverse** le badge au lieu de prendre une teinte de plus. La
 * version précédente lui donnait l'encre du compteur, c'est-à-dire exactement la
 * couleur de l'état habituel : « déjà présent » et « rien ne s'est passé »
 * étaient indiscernables, et un lien déjà collecté passait pour un ajout raté.
 * Éclaircir le gris n'aurait fait qu'amoindrir le contraste sur une icône
 * orange ; l'inversion, elle, se voit. Le glyphe reste distinct dans les quatre
 * cas, si bien que la couleur n'est jamais la seule information (1.4.1).
 */
const BADGE_COUNT = { fond: '#1a1a1a', texte: '#ffffff' };
const BADGE_ADDED = { fond: '#1c7c4a', texte: '#ffffff' };
const BADGE_DUPLICATE = { fond: '#f4f4f4', texte: '#161616' };
// Un titre adopté **change** la collection, comme un ajout : mêmes teintes que
// l'ajout, et c'est le signe qui les sépare. Le fond clair reste réservé à ce
// qui ne change rien.
const BADGE_UPDATED = { fond: '#1c7c4a', texte: '#ffffff' };
const BADGE_ERROR = { fond: '#b3122b', texte: '#ffffff' };

const store = createChromeStorageStore({ area: api?.storage?.local });

/**
 * Impose la couleur du texte du badge, si l'API existe.
 *
 * `setBadgeTextColor` n'existe que depuis Chrome 110 et Safari l'ignore. L'appel
 * est isolé pour qu'une absence n'interrompe pas la pose du texte : sans cette
 * précaution, un `await` qui échoue laisserait le badge **vide** au lieu de le
 * laisser au navigateur le soin de choisir une couleur lisible.
 *
 * @param {string} couleur
 * @returns {Promise<void>}
 */
async function applyBadgeTextColor(couleur) {
  try {
    await api.action.setBadgeTextColor?.({ color: couleur });
  } catch {
    // Le navigateur choisira lui-même une couleur de texte.
  }
}

/** Met à jour le badge avec le nombre de liens, ou le vide. */
async function refreshBadge() {
  try {
    const links = await store.list();
    await api.action.setBadgeBackgroundColor({ color: BADGE_COUNT.fond });
    await applyBadgeTextColor(BADGE_COUNT.texte);
    await api.action.setBadgeText({ text: links.length ? String(links.length) : '' });
  } catch {
    // L'API badge peut être absente ou refusée : ce n'est pas bloquant.
  }
}

/**
 * Affiche brièvement un retour sur l'icône.
 *
 * @param {string} text
 * @param {{ fond: string, texte: string }} badge
 */
async function flashBadge(text, badge) {
  try {
    await api.action.setBadgeBackgroundColor({ color: badge.fond });
    await applyBadgeTextColor(badge.texte);
    await api.action.setBadgeText({ text });
    // Le retour dure 2,5 s : un clic droit se fait en regardant la page, pas la
    // barre d'outils, et 1,5 s s'écoulaient souvent avant que l'œil n'y arrive.
    setTimeout(refreshBadge, 2500);
  } catch {
    // Idem : le badge est un confort, pas une fonction.
  }
}

/**
 * Installe le menu contextuel.
 *
 * `installContextMenus` absorbe l'absence de l'API : sur Safari iOS, cette
 * fonction ne fait rien et l'extension reste pleinement utilisable depuis la
 * fenêtre de la barre d'outils.
 *
 * @returns {Promise<void>}
 */
async function installMenus() {
  // La langue doit être connue avant de construire les libellés du menu :
  // le service worker lit `storage.local`, contrairement à `localStorage`.
  await initI18n();
  // L'entrée de sélection est **activée**. Elle était créée désactivée, faute
  // d'argument à `buildMenuDefinitions()` : l'utilisateur voyait une entrée
  // grisée, et la justification de permission publiée sur le Chrome Web Store
  // annonçait pourtant trois entrées fonctionnelles, dont « Add the selected
  // text ». L'écart entre la fiche et le comportement est exactement ce qu'un
  // examinateur du magasin recherche.
  //
  // L'argument `appUrl` reste absent : il ne sert qu'à créer le séparateur et
  // l'entrée « Ouvrir URLQRCodePrinter », que la fiche ne décrit pas. En créer
  // une de plus rouvrirait le même écart dans l'autre sens.
  await installContextMenus(api, buildMenuDefinitions({ includeSelection: true }));
}

/**
 * Enregistre une capture et signale le résultat sur l'icône.
 *
 * Le contrôle du consentement est **ici**, et non chez les appelants. C'est le
 * seul point par lequel passe toute collecte du service worker — clic droit,
 * message venu d'une page, ou appel ajouté plus tard. Le placer chez les
 * appelants ferait dépendre la garantie de leur discipline : un chemin oublié
 * collecterait sans que personne ne l'ait accepté.
 *
 * @param {object|null} capture
 * @returns {Promise<{ recorded: boolean, reason?: 'consent'|'empty' }>}
 */
async function record(capture) {
  if (!capture) {
    await flashBadge('!', BADGE_ERROR);
    return { recorded: false, reason: 'empty' };
  }

  const consent = await readConsent(api?.storage?.local);
  if (!isAccepted(consent)) {
    // La mention n'est rouverte que si l'utilisateur ne s'est **jamais**
    // prononcé. Après un refus explicite, rouvrir un onglet à chaque tentative
    // serait du harcèlement : le refus est une décision, pas une absence.
    if (consent === null) {
      // Le badge est posé **dans les deux cas**. Il ne l'était pas à la première
      // installation : l'onglet de la mention s'ouvrait, et rien n'expliquait
      // sur l'icône pourquoi le clic droit n'avait rien enregistré. Un refus
      // explicite donnait un « ! » là où une installation neuve ne donnait rien
      // du tout — l'utilisateur le moins au fait était le moins renseigné.
      openPrivacyNotice();
    }
    await flashBadge('!', BADGE_ERROR);
    return { recorded: false, reason: 'consent' };
  }

  try {
    const { duplicate, updated } = await store.add(capture);
    // Trois retours distincts, du plus informatif au plus plat : le titre a été
    // adopté, le lien était déjà là, ou il vient d'arriver.
    if (updated) await flashBadge('✎', BADGE_UPDATED);
    else if (duplicate) await flashBadge('=', BADGE_DUPLICATE);
    else await flashBadge('+', BADGE_ADDED);
    return { recorded: true };
  } catch {
    await flashBadge('!', BADGE_ERROR);
    return { recorded: false };
  }
}

/**
 * Ouvre la mention de confidentialité.
 *
 * Elle doit être présentée **dans l'interface du produit**, avant toute
 * collecte : une description soignée sur la fiche du magasin ne la remplace pas
 * (FAQ Chrome Web Store, question 10). C'est aussi ce que fait ce service worker
 * lorsque le clic droit est utilisé sans consentement.
 */
function openPrivacyNotice() {
  api?.tabs?.create?.({ url: api.runtime.getURL('privacy.html') });
}

api?.runtime?.onInstalled?.addListener((details) => {
  installMenus();
  refreshBadge();

  // Seulement à la première installation. Rouvrir un onglet à chaque mise à
  // jour serait une intrusion, alors que le consentement est déjà enregistré.
  if (details?.reason === 'install') openPrivacyNotice();
});

api?.runtime?.onStartup?.addListener(() => {
  installMenus();
  refreshBadge();
});

// Reprise du badge au démarrage du service worker.
//
// `onInstalled` et `onStartup` ne couvrent pas le rechargement d'une extension
// non empaquetée, et `onStartup` ne se déclenche qu'au démarrage du navigateur.
// Le badge gardait donc la couleur de l'exécution précédente — c'est ainsi
// qu'une pastille teal a survécu à la refonte de la palette alors que le code
// livré ne contenait plus un seul teal.
//
// Le worker se réveille à chaque événement : le badge se réconcilie avec le
// stockage à ce moment-là. L'appel est volontairement non attendu : un `await`
// de premier niveau empêcherait l'enregistrement des écouteurs qui suivent, et
// la fenêtre resterait muette — panne déjà observée sur Safari.
refreshBadge();

// Le menu contextuel n'est branché que s'il existe réellement.
if (contextMenusAvailable(api)) {
  api.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === MENU_IDS.openApp) {
      api.tabs.create({ url: api.runtime.getURL('popup.html') });
      return;
    }

    // Le consentement est contrôlé par `record` lui-même : le clic droit serait
    // sinon un chemin de collecte contournant la mention, que personne
    // n'ouvrirait jamais depuis la fenêtre.
    await record(captureFromClick(info, tab));
  });
}

// Un changement de langue depuis la fenêtre ou l'application reconstruit le
// menu : sans cela, les libellés resteraient ceux de la langue précédente
// jusqu'au prochain démarrage du navigateur.
api?.storage?.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes?.locale) installMenus();
});

api?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'refresh-badge') {
    refreshBadge().then(() => sendResponse({ ok: true }));
    return true; // réponse asynchrone
  }
  if (message?.type === 'record-capture') {
    record(message.capture).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
