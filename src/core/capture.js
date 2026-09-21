/**
 * Capture d'un lien depuis une interaction navigateur.
 *
 * Ce module ne touche à aucune API d'extension : il transforme les
 * informations qu'un navigateur fournit lors d'un clic contextuel en une
 * entrée exploitable par `createLink`. Cela permet de le tester hors
 * navigateur, et de le partager entre l'extension Brave/Chrome et l'extension
 * Safari, dont les objets `info` diffèrent légèrement.
 */

import { isValidUrl, hostOf } from './link.js';
import { t } from './i18n.js';

/** Identifiants des entrées de menu contextuel. Stables : ils sont persistés. */
export const MENU_IDS = Object.freeze({
  page: 'urq-add-page',
  link: 'urq-add-link',
  selection: 'urq-add-selection',
  separator: 'urq-separator',
  openApp: 'urq-open-app',
});

/**
 * Définition des entrées de menu contextuel.
 *
 * `contexts` est volontairement restreint : déclarer une entrée « link » dans
 * le contexte d'une page sans lien la rendrait invisible sans explication.
 *
 * @param {{ includeSelection?: boolean, appUrl?: string }} [options]
 * @returns {Array<object>} définitions prêtes pour `contextMenus.create`
 */
export function buildMenuDefinitions(options = {}) {
  const menus = [
    {
      id: MENU_IDS.page,
      title: t('Ajouter cette page à URLQRCodePrinter'),
      contexts: ['page'],
    },
    {
      id: MENU_IDS.link,
      title: t('Ajouter ce lien à URLQRCodePrinter'),
      contexts: ['link'],
    },
    {
      id: MENU_IDS.selection,
      title: t('Ajouter « %s » à URLQRCodePrinter'),
      contexts: ['selection'],
      enabled: Boolean(options.includeSelection),
    },
  ];

  if (options.appUrl) {
    menus.push(
      { id: MENU_IDS.separator, type: 'separator', contexts: ['page', 'link', 'selection'] },
      {
        id: MENU_IDS.openApp,
        title: t('Ouvrir URLQRCodePrinter'),
        contexts: ['page', 'link', 'selection'],
      },
    );
  }

  return menus;
}

/**
 * Décide si un texte sélectionné peut raisonnablement être une URL.
 *
 * On reste permissif : « example.com » sans schéma est accepté, car c'est un
 * usage courant. En revanche une phrase contenant un point ne doit pas passer.
 *
 * @param {unknown} text
 * @returns {boolean}
 */
export function looksLikeUrl(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed === '' || trimmed.length > 2048) return false;
  // Un texte contenant une espace n'est pas une URL, sauf s'il s'agit d'une
  // phrase dont on pourrait extraire un lien — cas qu'on ne devine pas.
  if (/\s/.test(trimmed)) return false;
  return isValidUrl(trimmed);
}

/**
 * Construit l'entrée de lien correspondant à un clic contextuel.
 *
 * Priorité au lien explicitement visé : dans un clic sur un lien, `pageUrl`
 * désigne la page qui le contient, ce qui n'est presque jamais ce que
 * l'utilisateur veut enregistrer.
 *
 * @param {{
 *   menuItemId?: string,
 *   linkUrl?: string,
 *   pageUrl?: string,
 *   selectionText?: string,
 *   srcUrl?: string,
 * }} info
 * @param {{ title?: string, url?: string }} [tab]
 * @returns {{ url: string, title: string, source: string, note: string }|null}
 *   `null` si rien d'exploitable n'a été fourni.
 */
export function captureFromClick(info, tab) {
  if (!info || typeof info !== 'object') return null;

  const selection = typeof info.selectionText === 'string' ? info.selectionText.trim() : '';

  // 1. Sélection explicite : elle prime, l'utilisateur a désigné ce qu'il veut.
  if (info.menuItemId === MENU_IDS.selection || (selection !== '' && looksLikeUrl(selection))) {
    if (looksLikeUrl(selection)) {
      return { url: selection, title: '', source: 'context-menu', note: '' };
    }
  }

  // 2. Lien cliqué.
  if (typeof info.linkUrl === 'string' && info.linkUrl !== '' && isValidUrl(info.linkUrl)) {
    return {
      url: info.linkUrl,
      // Le texte du lien n'est pas exposé par l'API ; le domaine est la
      // meilleure description disponible sans requête réseau.
      title: selection || hostOf(info.linkUrl),
      source: 'context-menu',
      note: selection && !looksLikeUrl(selection) ? selection : '',
    };
  }

  // 3. Image cliquée : le plus souvent ce que l'utilisateur vise.
  if (typeof info.srcUrl === 'string' && info.srcUrl !== '' && isValidUrl(info.srcUrl)) {
    return { url: info.srcUrl, title: '', source: 'context-menu', note: '' };
  }

  // 4. Page courante, en dernier recours.
  const pageUrl = typeof info.pageUrl === 'string' && info.pageUrl !== ''
    ? info.pageUrl
    : tab?.url;
  if (typeof pageUrl === 'string' && pageUrl !== '' && isValidUrl(pageUrl)) {
    return {
      url: pageUrl,
      title: typeof tab?.title === 'string' ? tab.title : '',
      source: 'context-menu',
      note: '',
    };
  }

  return null;
}

/**
 * Construit l'entrée de lien pour « ajouter l'onglet courant » (bouton de la
 * barre d'outils). Distinct du clic contextuel : ici la page est la cible.
 *
 * @param {{ url?: string, title?: string }} tab
 * @param {{ source?: string }} [options]
 * @returns {{ url: string, title: string, source: string }|null}
 */
export function captureFromTab(tab, options = {}) {
  if (!tab || typeof tab.url !== 'string' || !isValidUrl(tab.url)) return null;
  return {
    url: tab.url,
    title: typeof tab.title === 'string' ? tab.title : '',
    source: options.source ?? 'toolbar',
  };
}

/**
 * Résume une capture pour l'afficher à l'utilisateur.
 * @param {{ url: string, title?: string }} link
 * @param {number} [maxLength]
 * @returns {string}
 */
export function describeCapture(link, maxLength = 60) {
  const label = link.title?.trim() || hostOf(link.url) || link.url;
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength - 1) + '…';
}
