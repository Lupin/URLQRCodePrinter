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
 */

import { createChromeStorageStore } from './core/store.js';
import {
  MENU_IDS,
  buildMenuDefinitions,
  captureFromClick,
} from './core/capture.js';

const store = createChromeStorageStore();

/** Couleur du badge : vert ardoise pour un ajout, ambre pour un doublon. */
const BADGE_ADDED = '#21808d';
const BADGE_DUPLICATE = '#a84b2f';

/**
 * Installe le menu contextuel.
 *
 * `removeAll` d'abord : sans cela, un rechargement de l'extension empile des
 * entrées en double, car `create` lève une erreur sur un identifiant existant.
 */
async function installMenus() {
  await chrome.contextMenus.removeAll();
  for (const definition of buildMenuDefinitions()) {
    chrome.contextMenus.create(definition, () => {
      // `lastError` est renseigné en cas de doublon ; on l'ignore sciemment.
      void chrome.runtime.lastError;
    });
  }
}

/** Met à jour le badge avec le nombre de liens, ou le vide. */
async function refreshBadge() {
  try {
    const links = await store.list();
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_ADDED });
    await chrome.action.setBadgeText({ text: links.length ? String(links.length) : '' });
  } catch {
    // L'API badge peut être absente ou refusée : ce n'est pas bloquant.
  }
}

/** Affiche brièvement un retour sur l'icône. */
async function flashBadge(text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color });
    await chrome.action.setBadgeText({ text });
    setTimeout(refreshBadge, 1500);
  } catch {
    // Idem : le badge est un confort, pas une fonction.
  }
}

chrome.runtime.onInstalled.addListener(() => {
  installMenus();
  refreshBadge();
});

chrome.runtime.onStartup.addListener(() => {
  installMenus();
  refreshBadge();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === MENU_IDS.openApp) {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    return;
  }

  const capture = captureFromClick(info, tab);
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
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'refresh-badge') {
    refreshBadge().then(() => sendResponse({ ok: true }));
    return true; // réponse asynchrone
  }
  return false;
});
