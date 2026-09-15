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

const api = resolveApi();

/** Couleur du badge : vert ardoise pour un ajout, ambre pour un doublon. */
const BADGE_ADDED = '#21808d';
const BADGE_DUPLICATE = '#a84b2f';

const store = createChromeStorageStore({ area: api?.storage?.local });

/** Met à jour le badge avec le nombre de liens, ou le vide. */
async function refreshBadge() {
  try {
    const links = await store.list();
    await api.action.setBadgeBackgroundColor({ color: BADGE_ADDED });
    await api.action.setBadgeText({ text: links.length ? String(links.length) : '' });
  } catch {
    // L'API badge peut être absente ou refusée : ce n'est pas bloquant.
  }
}

/** Affiche brièvement un retour sur l'icône. */
async function flashBadge(text, color) {
  try {
    await api.action.setBadgeBackgroundColor({ color });
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
  await installContextMenus(api, buildMenuDefinitions());
}

/**
 * Enregistre une capture et signale le résultat sur l'icône.
 * @param {object|null} capture
 */
async function record(capture) {
  if (!capture) {
    await flashBadge('!', BADGE_DUPLICATE);
    return;
  }
  try {
    const { duplicate } = await store.add(capture);
    await flashBadge(duplicate ? '=' : '+', duplicate ? BADGE_DUPLICATE : BADGE_ADDED);
  } catch {
    await flashBadge('!', BADGE_DUPLICATE);
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
