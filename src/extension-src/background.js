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

import { createChromeStorageStore, createCompositeStore, withCollection } from './core/store.js';
import {
  DEFAULT_COLLECTION_ID,
  PRIVATE_COLLECTION_ID,
  PRIVATE_LINKS_KEY,
  createCollectionStore,
  displayedDocuments,
} from './core/collections.js';
import {
  MENU_IDS,
  buildMenuDefinitions,
  captureFromClick,
} from './core/capture.js';
import {
  resolveApi, contextMenusAvailable, installContextMenus, sessionStorageArea,
} from './api.js';
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

/**
 * Durée d'un retour transitoire sur l'icône, en millisecondes.
 *
 * Le retour dure 2,5 s : un clic droit se fait en regardant la page, pas la
 * barre d'outils, et 1,5 s s'écoulaient souvent avant que l'œil n'y arrive.
 */
const FLASH_MS = 2500;

/**
 * Jusqu'à quand un retour transitoire occupe l'icône.
 *
 * La collecte écrit dans le stockage **avant** de poser son signe, et cette
 * écriture réveille l'écouteur de `storage.onChanged` ci-dessous : sans cette
 * échéance, le compteur remplacerait le « + » dans le même souffle, et le clic
 * droit n'aurait plus aucun retour visible.
 */
let flashUntil = 0;

/**
 * Les deux zones de liens, et la composition qui les réunit.
 *
 * Les liens ordinaires vivent dans `chrome.storage.local`. Ceux de la
 * collection de navigation privée vivent dans `chrome.storage.session` : en
 * mémoire, pour la durée du navigateur. C'est le routage par identifiant de
 * collection qui garantit qu'une URL privée ne peut pas être écrite sur le
 * disque — il n'existe aucun chemin qui l'y conduise.
 *
 * Sans `storage.session` (Chrome antérieur à 102, Safari antérieur à 16.4), la
 * collection privée n'existe pas : `privateStore` vaut `null` et une capture
 * faite depuis une fenêtre privée rejoint la collection courante ordinaire,
 * plutôt que d'inventer une persistance qui n'aurait pas lieu.
 */
const localStore = createChromeStorageStore({ area: api?.storage?.local });
const privateStore = (() => {
  const area = sessionStorageArea(api);
  if (!area) return null;
  try {
    return createChromeStorageStore({ area, key: PRIVATE_LINKS_KEY });
  } catch {
    return null;
  }
})();

const store = createCompositeStore([
  { store: localStore, match: (collectionId) => collectionId !== PRIVATE_COLLECTION_ID },
  ...(privateStore
    ? [{ store: privateStore, match: (collectionId) => collectionId === PRIVATE_COLLECTION_ID }]
    : []),
]);

/** La liste des collections, et celle qui est courante. */
const collections = createCollectionStore({ area: api?.storage?.local });

/**
 * La collection de navigation privée est-elle utilisable dans ce contexte ?
 * @param {boolean} isPrivate
 * @returns {boolean}
 */
function privateCollectionUsable(isPrivate) {
  return Boolean(isPrivate) && privateStore !== null;
}

/**
 * La collection courante d'un contexte, ou la collection par défaut.
 *
 * Ne lève jamais : une lecture impossible retombe sur la collection par défaut,
 * qui existe toujours — c'est la seule qui ne peut pas manquer.
 *
 * @param {boolean} isPrivate
 * @returns {Promise<string>}
 */
async function activeCollection(isPrivate) {
  try {
    return await collections.getActive(privateCollectionUsable(isPrivate));
  } catch {
    return DEFAULT_COLLECTION_ID;
  }
}

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

/**
 * Met à jour le badge avec le nombre de liens de la collection courante.
 *
 * Le badge compte **ce qui est affiché** dans la fenêtre, et non la base
 * entière : un compteur qui annoncerait douze liens quand la collection en
 * contient deux ne dirait rien d'utile. Le contexte est celui de l'appelant —
 * une fenêtre privée a sa propre collection courante.
 *
 * @param {{ isPrivate?: boolean }} [options]
 */
async function refreshBadge(options = {}) {
  try {
    const collectionId = await activeCollection(Boolean(options.isPrivate));
    const links = await withCollection(store, collectionId).list();
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
    // L'échéance est posée **après** le signe : c'est ce qui garantit qu'aucun
    // rafraîchissement ne le remplace avant son terme.
    flashUntil = Date.now() + FLASH_MS;
    setTimeout(refreshBadge, FLASH_MS);
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
 * Le rangement dans une collection est ici pour la même raison. Le contexte est
 * celui de l'onglet visé : une capture faite depuis une fenêtre privée rejoint
 * la collection privée, et une capture faite ailleurs ne peut pas l'atteindre.
 * C'est ce qui rend la sauvegarde spontanée — l'utilisateur n'a rien à choisir,
 * la collection courante est déjà la bonne — sans qu'une URL privée puisse
 * atterrir sur le disque.
 *
 * @param {object|null} capture
 * @param {{ isPrivate?: boolean }} [options]
 * @returns {Promise<{ recorded: boolean, reason?: 'consent'|'empty' }>}
 */
async function record(capture, options = {}) {
  if (!capture) {
    await flashBadge('!', BADGE_ERROR);
    return { recorded: false, reason: 'empty' };
  }

  const consent = await readConsent(api?.storage?.local);
  if (!isAccepted(consent)) {
    // La mention est rouverte dans deux cas, et deux seulement : l'utilisateur
    // ne s'est **jamais** prononcé, ou son accord portait sur un texte qui a
    // changé depuis — il doit alors lire celui qui s'applique. Après un refus
    // explicite, rouvrir un onglet à chaque tentative serait du harcèlement : le
    // refus est une décision, pas une absence.
    if (consent === null || consent.decision === 'accepted') {
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
    const collectionId = await activeCollection(Boolean(options.isPrivate));
    const { duplicate, updated } = await withCollection(store, collectionId).add(capture);
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
  // La collection par défaut est matérialisée à l'installation : c'est elle qui
  // reçoit les liens de qui n'en crée jamais d'autre.
  collections.ensureDefault().catch(() => {});
  refreshBadge();

  // Seulement à la première installation. Rouvrir un onglet à chaque mise à
  // jour serait une intrusion, alors que le consentement est déjà enregistré.
  if (details?.reason === 'install') openPrivacyNotice();
});

api?.runtime?.onStartup?.addListener(() => {
  installMenus();
  collections.ensureDefault().catch(() => {});
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
    //
    // `tab.incognito` dit de quelle fenêtre vient le clic : c'est la seule
    // source fiable ici, le service worker n'ayant pas d'onglet à lui.
    await record(captureFromClick(info, tab), { isPrivate: Boolean(tab?.incognito) });
  });
}

// Un changement de langue depuis la fenêtre ou l'application reconstruit le
// menu : sans cela, les libellés resteraient ceux de la langue précédente
// jusqu'au prochain démarrage du navigateur.
api?.storage?.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes?.locale) installMenus();
});

// Le compteur suit le stockage, quel que soit celui qui l'écrit.
//
// L'application écrit dans les mêmes documents que la fenêtre — vider la
// collection, supprimer un lien, importer une archive — et elle ne parle pas au
// service worker, qui n'a aucune raison d'être connu d'elle. Le compteur gardait
// donc le nombre d'avant : un « 3 » qui survivait à une collection vidée, posé
// sur l'icône jusqu'au prochain événement. Le badge se réconcilie désormais **à
// la source**, plutôt que de demander à chaque page d'y penser — la même règle
// que le consentement, qui vit dans `record()` et non chez ses appelants.
api?.storage?.onChanged?.addListener((changes, area) => {
  // Les liens de la collection privée vivent dans `storage.session`, et le
  // compteur d'une fenêtre privée est posé par la fenêtre elle-même : elle seule
  // sait dans quelle fenêtre elle s'affiche. Un rafraîchissement déclenché d'ici
  // annoncerait à cette fenêtre le compte de la collection ordinaire.
  if (area !== 'local') return;
  if (!displayedDocuments('local').some((cle) => cle in changes)) return;
  // Un retour transitoire est à l'écran : c'est lui que l'œil doit voir, et
  // l'échéance posée par `flashBadge` repose le compteur juste après.
  if (Date.now() < flashUntil) return;
  // Volontairement non attendu : l'écouteur n'a rien à rendre à personne, et
  // `refreshBadge` ne lève jamais.
  refreshBadge();
});

api?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'refresh-badge') {
    // Le contexte vient de la page qui demande : elle seule sait dans quelle
    // fenêtre elle s'affiche.
    refreshBadge({ isPrivate: Boolean(message.isPrivate) }).then(() => sendResponse({ ok: true }));
    return true; // réponse asynchrone
  }
  if (message?.type === 'record-capture') {
    record(message.capture, { isPrivate: Boolean(message.isPrivate) })
      .then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
