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
 */
const BADGE_COUNT = '#1a1a1a';
const BADGE_ADDED = '#1c7c4a';
const BADGE_DUPLICATE = '#1a1a1a';
const BADGE_ERROR = '#b3122b';
/** Texte du badge : les quatre fonds sont sombres, le texte est donc clair. */
const BADGE_TEXT = '#ffffff';

const store = createChromeStorageStore({ area: api?.storage?.local });

/**
 * Impose la couleur du texte du badge, si l'API existe.
 *
 * `setBadgeTextColor` n'existe que depuis Chrome 110 et Safari l'ignore. L'appel
 * est isolé pour qu'une absence n'interrompe pas la pose du texte : sans cette
 * précaution, un `await` qui échoue laisserait le badge **vide** au lieu de le
 * laisser au navigateur le soin de choisir une couleur lisible.
 *
 * @returns {Promise<void>}
 */
async function applyBadgeTextColor() {
  try {
    await api.action.setBadgeTextColor?.({ color: BADGE_TEXT });
  } catch {
    // Le navigateur choisira lui-même une couleur de texte.
  }
}

/** Met à jour le badge avec le nombre de liens, ou le vide. */
async function refreshBadge() {
  try {
    const links = await store.list();
    await api.action.setBadgeBackgroundColor({ color: BADGE_COUNT });
    await applyBadgeTextColor();
    await api.action.setBadgeText({ text: links.length ? String(links.length) : '' });
  } catch {
    // L'API badge peut être absente ou refusée : ce n'est pas bloquant.
  }
}

/** Affiche brièvement un retour sur l'icône. */
async function flashBadge(text, color) {
  try {
    await api.action.setBadgeBackgroundColor({ color });
    await applyBadgeTextColor();
    await api.action.setBadgeText({ text });
    setTimeout(refreshBadge, 1500);
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
  await installContextMenus(api, buildMenuDefinitions());
}

/**
 * Enregistre une capture et signale le résultat sur l'icône.
 * @param {object|null} capture
 */
async function record(capture) {
  if (!capture) {
    await flashBadge('!', BADGE_ERROR);
    return;
  }
  try {
    const { duplicate } = await store.add(capture);
    await flashBadge(duplicate ? '=' : '+', duplicate ? BADGE_DUPLICATE : BADGE_ADDED);
  } catch {
    await flashBadge('!', BADGE_ERROR);
  }
}

api?.runtime?.onInstalled?.addListener(() => {
  installMenus();
  refreshBadge();
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
