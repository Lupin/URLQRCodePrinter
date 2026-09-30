/**
 * Le lien vers la page d'information, dans la fenêtre comme dans l'application.
 *
 * Les deux faces du produit renvoient au même endroit : la page publique qui
 * explique ce que fait l'outil, ce qu'il enregistre et comment il le fait. Ce
 * lien existait dans la fenêtre de l'extension, pas dans l'application — or
 * c'est l'application qui sert de documentation à qui l'ouvre en grand. Les
 * adresses vivent donc ici, une seule fois, plutôt que recopiées de chaque
 * côté : deux copies d'une adresse finissent par diverger, et une adresse
 * fausse ne casse rien visiblement — elle envoie simplement au mauvais endroit.
 *
 * L'adresse dépend de **deux** choses, et c'est ce qui interdit un `href` écrit
 * en dur dans le HTML :
 *
 * - **La langue de l'interface.** La page française vit à la racine du site,
 *   l'anglaise sous `/en/`. Un utilisateur qui a réglé l'outil en français n'a
 *   rien à faire sur la page anglaise.
 * - **Le contexte d'exécution.** Servie par une extension, ou seule à la racine
 *   d'un serveur, l'application n'a aucune page voisine : seule l'adresse
 *   publiée existe. Servie par le site lui-même sous `app/`, la page
 *   d'information est sa **voisine** — et c'est alors l'adresse relative qu'il
 *   faut, sans quoi une copie du site hébergée ailleurs (un fork, un serveur
 *   local) enverrait ses visiteurs sur le site d'origine, ou nulle part si la
 *   machine est hors ligne.
 *
 * Le module ne connaît ni DOM ni stockage : il décide d'une adresse à partir de
 * la langue et de deux champs de `location`, ce qui le rend vérifiable sans
 * navigateur. Les appelants lui passent la page courante ; par défaut, la page
 * réelle.
 */

/**
 * Adresses publiques de la page d'information, par langue.
 *
 * La page française est à la racine du site, l'anglaise sous `/en/`. Ces deux
 * adresses sont aussi le repli de tout contexte qui n'a pas de page voisine.
 */
export const SITE_URLS = Object.freeze({
  fr: 'https://lupin.github.io/URLQRCodePrinter/',
  en: 'https://lupin.github.io/URLQRCodePrinter/en/',
});

/**
 * Le dossier sous lequel le site publie l'application.
 *
 * C'est la disposition de `scripts/build-site.mjs` : l'application est copiée
 * dans `app/`, à côté de la page d'information française (`index.html`) et de
 * l'anglaise (`en/index.html`). Quand la page courante est celle-là, et
 * seulement celle-là, la page d'information est sa **voisine** : `../` la
 * désigne.
 *
 * Les autres dispositions n'ont pas de voisine, et reçoivent donc l'adresse
 * publiée : `dist/web` servi à la racine par `npm run serve` (`/`, `/index.html`),
 * la page de l'extension (`/app.html`, à la racine du paquet), et une application
 * déployée seule dans un dossier sans site autour d'elle (`/un-dossier/`). Une
 * adresse relative y désignerait un dossier qui ne contient pas de page
 * d'information — c'est pourquoi la règle est aussi étroite.
 */
const SITE_APP_DIRECTORY = /\/app\/(?:index\.html?)?$/i;

/**
 * La langue demandée, ramenée à celles que le site publie.
 *
 * Une langue inconnue vaut le français : c'est la langue d'écriture du projet,
 * et celle de la racine du site.
 *
 * @param {string} [locale]
 * @returns {'fr'|'en'}
 */
export function siteLocale(locale) {
  return locale === 'en' ? 'en' : 'fr';
}

/**
 * L'adresse de la page d'information, pour une langue et une page données.
 *
 * @param {string} [locale] Langue de l'interface.
 * @param {{protocol?: string, pathname?: string}} [page] Page courante.
 * @returns {string} Adresse absolue, ou relative à la page courante.
 */
export function informationPageHref(locale, page = globalThis.location ?? {}) {
  const lang = siteLocale(locale);
  const protocol = page?.protocol ?? '';
  const pathname = page?.pathname ?? '';

  // Hors http(s), il n'y a pas de site du tout : une extension
  // (`chrome-extension:`, `safari-web-extension:`, `moz-extension:`) est le cas
  // courant, un fichier ouvert localement l'autre.
  const servedBySite = protocol === 'http:' || protocol === 'https:';
  if (!servedBySite || !SITE_APP_DIRECTORY.test(pathname)) return SITE_URLS[lang];

  // Servie par le site : `../` remonte de `/app/` à la racine française,
  // `../en/` à l'anglaise. Une page ouverte sous `/app/index.html` remonte aussi
  // à la racine — `../` y désigne le dossier parent, pas la page.
  return lang === 'en' ? '../en/' : '../';
}
