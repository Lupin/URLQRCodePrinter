/**
 * Fenêtre de l'extension.
 *
 * Trois précautions structurantes :
 *
 * - **Aucun `innerHTML` avec des données de page.** Les titres proviennent de
 *   sites tiers ; les injecter comme HTML dans une page d'extension, qui
 *   dispose de privilèges, ouvrirait une faille. Tout passe par `textContent`
 *   et `createElement`.
 * - **L'URL de l'onglet peut être absente.** `activeTab` n'est accordé qu'à
 *   l'invocation de l'extension, et Safari ne le garantit pas de la même
 *   façon. L'absence est traitée comme un cas normal, pas comme une erreur.
 * - **Le focus doit survivre à ce qu'il désigne.** Une suppression reconstruit
 *   la liste : sans précaution, le bouton focalisé disparaît et le focus
 *   retombe sur le document, en haut de la fenêtre. La ligne suivante reprend
 *   donc le focus — c'est `focusAfterRemoval`, et c'est la seule partie de ce
 *   fichier qui n'est pas évidente à la lecture.
 */

import { createChromeStorageStore, createMemoryStore } from './core/store.js';
import { captureFromTab } from './core/capture.js';
import { toCsv, toMarkdown, exportFilename } from './core/exporters.js';
import { downloadText } from './core/download.js';
import { hostOf, hasShortUrl, safeHref } from './core/link.js';
import { resolveApi, readTabContext } from './api.js';
import { initI18n, applyTranslations, setLocale, getLocale, t, tpl } from './core/i18n.js';
import { readConsent, isAccepted } from './core/privacy.js';

const api = resolveApi();

/**
 * Icônes d'interface.
 *
 * Phosphor Icons, graisse `regular`, licence MIT. Les tracés sont recopiés du
 * paquet `@phosphor-icons/core` plutôt que tirés d'une dépendance : le projet
 * n'a qu'une dépendance d'exécution (`uqr`), et une icône ne justifie pas d'en
 * ajouter une seconde — le tracé utilisé ici tient en 200 octets.
 *
 * Deux propriétés ont décidé du choix, et elles comptent surtout en petit :
 *
 * - **Le tracé est rempli, pas tracé.** Phosphor dessine sur une grille de
 *   256 × 256 avec des contours pleins ; Lucide, Feather et Heroicons dessinent
 *   un trait de 1,5 à 2 px sur une grille de 24. Rendue à 16 px, cette grille
 *   de 24 donne un trait de 1 px antialiasé sur deux rangées de pixels : le
 *   dessin s'empâte. Un contour plein garde sa forme.
 * - **`fill="currentColor"`.** L'icône prend la couleur du bouton, donc le
 *   passage au rouge au survol ne demande aucune règle supplémentaire.
 *
 * Source : https://github.com/phosphor-icons/core — MIT.
 */
const ICON_PATHS = {
  remove:
    'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32' +
    'L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32' +
    'L139.31,128Z',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Construit une icône décorative.
 *
 * `aria-hidden` : le nom accessible est porté par le bouton, jamais par le
 * dessin. Sans cela, un lecteur d'écran annoncerait le bouton deux fois — une
 * fois par son icône, une fois par son libellé.
 *
 * @param {keyof typeof ICON_PATHS} name
 * @returns {SVGElement}
 */
function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 256 256');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icon');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICON_PATHS[name]);
  svg.appendChild(path);

  return svg;
}

/**
 * Résout le stockage sans jamais faire échouer la fenêtre.
 *
 * Une API absente ou incomplète ne doit pas emporter toute l'interface : au
 * pire, la collection vit le temps de la fenêtre.
 */
function createStore() {
  try {
    const area = api?.storage?.local;
    if (area) return createChromeStorageStore({ area });
  } catch {
    // On retombe en mémoire.
  }
  return createMemoryStore();
}

const store = createStore();

/**
 * Borne une attente dans le temps.
 *
 * Les API d'extension ne promettent pas de rejeter : sur Safari, certaines
 * restent simplement en suspens. Sans borne, la fenêtre resterait figée sur
 * « Chargement… » sans le moindre indice sur ce qui bloque.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(t('{label} : aucune réponse après {ms} ms', { label, ms }))), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

const el = {
  countLabel: document.getElementById('count-label'),
  count: document.getElementById('count'),
  countUnit: document.getElementById('count-unit'),
  currentTab: document.getElementById('current-tab'),
  addCurrent: document.getElementById('add-current'),
  list: document.getElementById('list'),
  empty: document.getElementById('empty'),
  startupError: document.getElementById('startup-error'),
  consentNotice: document.getElementById('consent-notice'),
  openPrivacy: document.getElementById('open-privacy'),
  openApp: document.getElementById('open-app'),
  exportCsv: document.getElementById('export-csv'),
  exportMd: document.getElementById('export-md'),
  clear: document.getElementById('clear'),
  toast: document.getElementById('toast'),
};

/** @type {{ url?: string, title?: string }} */
let activeTab = {};
let toastTimer = null;

/**
 * Affiche un message transitoire.
 * @param {string} message
 */
function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('toast--visible'), 2200);
}

/**
 * Lit l'onglet actif.
 *
 * `tabs.query` renseigne `url` sur Chrome et Safari macOS, mais pas toujours
 * sur Safari iOS : `readTabContext` retombe alors sur une injection dans la
 * page, qui fonctionne avec la seule permission `activeTab`.
 *
 * @returns {Promise<void>}
 */
async function loadActiveTab() {
  let tab = null;
  try {
    const found = await withTimeout(
      api.tabs.query({ active: true, currentWindow: true }),
      3000,
      'tabs.query',
    );
    tab = found?.[0] ?? null;
  } catch {
    // Interrogation refusée ou restée sans réponse : on continue sans onglet,
    // la fenêtre reste utilisable.
    tab = null;
  }

  let context = null;
  try {
    context = await withTimeout(readTabContext(api, tab), 3000, t("lecture de l'onglet"));
  } catch {
    context = null;
  }

  activeTab = context ? { url: context.url, title: context.title } : {};

  const capture = captureFromTab(activeTab);
  if (capture) {
    el.currentTab.textContent = capture.title || capture.url;
    el.currentTab.title = capture.url;
    el.addCurrent.disabled = false;
  } else {
    el.currentTab.textContent = t('Cette page ne peut pas être enregistrée.');
    el.currentTab.title = '';
    el.addCurrent.disabled = true;
  }
}

/**
 * Reconstruit la liste affichée.
 * @returns {Promise<void>}
 */
async function render() {
  const links = await store.list();

  // Le nombre et son unité vivent dans deux nœuds : la région live reste
  // lisible (« 3 liens »), et `#count` seul porte le chiffre.
  el.count.textContent = String(links.length);
  el.countUnit.textContent = tpl(links.length, 'lien', 'liens');
  el.list.textContent = '';

  const hasLinks = links.length > 0;
  el.empty.hidden = hasLinks;
  el.openApp.disabled = !hasLinks;
  el.exportCsv.disabled = !hasLinks;
  el.exportMd.disabled = !hasLinks;
  el.clear.disabled = !hasLinks;

  for (const link of links) {
    el.list.appendChild(renderItem(link));
  }
}

/**
 * Rend un lien externe, avec un repli en texte simple.
 *
 * Un titre de page vient d'un site tiers : il finit dans le DOM d'une page
 * d'extension, qui dispose de privilèges. Le texte passe donc par
 * `textContent`, et l'attribut `href` ne reçoit jamais qu'une URL http(s).
 *
 * L'ouverture dans un nouvel onglet est annoncée : sans cela, le changement de
 * contexte est une surprise pour un utilisateur de lecteur d'écran.
 *
 * @param {string} url
 * @param {string} className
 * @param {string} [label]
 * @returns {HTMLElement}
 */
function externalLink(url, className, label = url) {
  const href = safeHref(url);
  const node = document.createElement(href === '' ? 'span' : 'a');
  node.className = className;
  node.textContent = label;
  node.title = url;
  if (href !== '') {
    node.href = href;
    // `_blank` + `noopener` : l'onglet ouvert ne doit pas pouvoir manipuler la
    // fenêtre de l'extension.
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    const hint = document.createElement('span');
    hint.className = 'sr-only';
    hint.textContent = t(' (ouvre un nouvel onglet)');
    node.appendChild(hint);
  }
  return node;
}

/**
 * Construit une ligne de la liste.
 *
 * Une seule action de navigation par ligne : le titre est le lien, l'adresse
 * redevient du texte. Deux liens vers la même destination faisaient deux
 * arrêts de tabulation et deux annonces pour une seule action. L'adresse
 * raccourcie, elle, reste un lien — c'est une destination différente.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @returns {HTMLLIElement}
 */
function renderItem(link) {
  const item = document.createElement('li');
  item.className = 'item';
  item.dataset.id = link.id;

  const body = document.createElement('div');
  body.className = 'item__body';

  const title = externalLink(link.url, 'item__title', link.title || hostOf(link.url) || link.url);

  const url = document.createElement('span');
  url.className = 'item__url';
  url.textContent = link.url;
  url.title = link.url;

  body.append(title, url);

  if (hasShortUrl(link)) {
    const short = document.createElement('div');
    short.className = 'item__short';
    const mark = document.createElement('span');
    mark.className = 'item__short-mark';
    mark.textContent = '↳';
    mark.setAttribute('aria-hidden', 'true');
    short.append(mark, externalLink(link.shortUrl, 'item__short-url'));
    body.appendChild(short);
  }

  const remove = document.createElement('button');
  remove.className = 'item__remove';
  remove.type = 'button';
  remove.append(icon('remove'));
  remove.title = t('Supprimer');
  remove.setAttribute('aria-label', t('Supprimer « {title} »', { title: link.title || link.url }));
  remove.addEventListener('click', () => removeLink(link.id));

  item.append(body, remove);
  return item;
}

/**
 * Supprime une ligne et remet le focus là où l'utilisateur l'attendait.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
async function removeLink(id) {
  const items = [...el.list.children];
  const index = items.findIndex((node) => node.dataset?.id === id);

  await store.remove(id);
  await notifyBadge();
  await render();

  focusAfterRemoval(index);
  toast(t('Lien supprimé'));
}

/**
 * Repose le focus après une suppression.
 *
 * Le bouton qui portait le focus n'existe plus : sans cette reprise, le focus
 * repart à `<body>` et l'utilisateur au clavier doit retraverser toute la
 * fenêtre. On vise la ligne qui a pris la place de la ligne supprimée, sinon
 * la dernière, sinon la liste elle-même — qui est nommée par son titre, donc
 * annoncée correctement.
 *
 * @param {number} index  Position de la ligne supprimée, ou -1 si inconnue.
 */
function focusAfterRemoval(index) {
  const remaining = el.list.querySelectorAll('.item__remove');
  if (remaining.length === 0) {
    el.list.tabIndex = -1;
    el.list.focus();
    return;
  }
  const target = remaining[Math.min(Math.max(index, 0), remaining.length - 1)];
  target.focus();
}

/** Demande au service worker de rafraîchir le compteur de l'icône. */
async function notifyBadge() {
  try {
    await api.runtime.sendMessage({ type: 'refresh-badge' });
  } catch {
    // Le service worker peut être endormi ; le badge se remettra à jour seul.
  }
}

/**
 * Enregistre l'onglet courant.
 * @returns {Promise<void>}
 */
async function addCurrentTab() {
  // Verrou de consentement, second chemin.
  //
  // Le clic droit est verrouillé dans `background.js` ; celui-ci l'est ici. Les
  // deux sont nécessaires : ce sont deux chemins d'enregistrement distincts, et
  // en oublier un ferait de la mention une formalité contournable.
  const consent = await readConsent(api?.storage?.local);
  if (!isAccepted(consent)) {
    // Même règle que dans le service worker : la mention n'est rouverte que si
    // l'utilisateur ne s'est jamais prononcé. Après un refus, on explique au
    // lieu de rouvrir un onglet à chaque clic.
    if (consent === null) openPrivacyNotice();
    else toast(t('Refus enregistré : acceptez la mention pour enregistrer un lien.'));
    return;
  }

  const capture = captureFromTab(activeTab);
  if (!capture) {
    toast(t('Rien à enregistrer sur cette page'));
    return;
  }

  const { duplicate } = await store.add(capture);
  await notifyBadge();
  await render();
  toast(duplicate ? t('Déjà enregistré') : t('Page ajoutée'));
}

/**
 * Exporte la liste.
 * @param {'csv'|'md'} format
 * @returns {Promise<void>}
 */
async function exportAs(format) {
  const links = await store.list();
  if (links.length === 0) return;

  const isCsv = format === 'csv';
  const text = isCsv ? toCsv(links) : toMarkdown(links);
  const filename = exportFilename('liens-qr', isCsv ? 'csv' : 'md');

  const ok = downloadText(filename, text, {
    mime: isCsv ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8',
  });
  toast(ok ? t('{filename} enregistré', { filename }) : t('Téléchargement impossible'));
}

el.addCurrent.addEventListener('click', addCurrentTab);
el.exportCsv.addEventListener('click', () => exportAs('csv'));
el.exportMd.addEventListener('click', () => exportAs('md'));
el.clear.addEventListener('click', async () => {
  await store.clear();
  await notifyBadge();
  await render();
  toast(t('Liste vidée'));
});

/**
 * Ouvre l'application dans un onglet.
 *
 * C'est là que se trouvent les QR codes, les mises en page et l'impression.
 * L'application est embarquée dans l'extension, donc elle lit **le même
 * stockage** que cette fenêtre : les liens collectés y sont déjà.
 */
function openApp() {
  const url = api.runtime.getURL('app.html');
  // `tabs.create` est préférable à `window.open`, qui serait bloqué comme
  // fenêtre surgissante depuis une page d'extension.
  api.tabs.create({ url });
  window.close();
}

el.openApp.addEventListener('click', openApp);

/**
 * Ouvre la mention de confidentialité dans un onglet.
 *
 * Elle vit dans une page à part, et non dans la fenêtre : la fenêtre est une
 * colonne étroite, alors que la mention doit être lisible — c'est une exigence
 * du magasin, pas un confort. La même page sert à l'installation et au
 * verrouillage.
 */
function openPrivacyNotice() {
  api.tabs.create({ url: api.runtime.getURL('privacy.html') });
  window.close();
}

el.openPrivacy?.addEventListener('click', openPrivacyNotice);

/**
 * Affiche une erreur de démarrage dans la fenêtre.
 *
 * Sans cela, une exception au chargement laisse le HTML statique tel quel :
 * « Chargement… » indéfiniment, sans le moindre indice. C'est exactement le
 * symptôme observé sur Safari avant que ce message existe.
 *
 * Le détail va dans une région `role="alert"` : un message d'erreur écrit dans
 * un paragraphe ordinaire n'est annoncé à personne.
 *
 * @param {unknown} error
 */
function reportStartupFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  const detected = api ? (api === globalThis.browser ? 'browser' : 'chrome') : 'aucune';

  el.currentTab.textContent = t('Démarrage impossible');
  el.currentTab.title = message;
  el.addCurrent.disabled = true;

  el.startupError.textContent = t('{message} — API détectée : {api}', {
    message,
    api: detected,
  });
  el.startupError.hidden = false;

  el.countLabel.textContent = t('Erreur :');
  el.count.textContent = '!';
  el.countUnit.textContent = '';
}

/**
 * Démarre la fenêtre.
 *
 * On évite volontairement l'`await` de premier niveau : une exception y
 * laisserait une page à moitié initialisée, sans message. Ici, tout échec est
 * rattrapé et affiché.
 */
/**
 * Branche le sélecteur de langue.
 *
 * Le changement mémorise la langue puis recharge la fenêtre : toute
 * l'interface est ainsi rendue dans la bonne langue, sans avoir à repasser
 * sur chaque nœud.
 */
function wireLocaleSwitcher() {
  const select = document.getElementById('locale');
  if (!select) return;
  select.value = getLocale();
  select.addEventListener('change', async () => {
    if (select.value === getLocale()) return;
    await setLocale(select.value);
    location.reload();
  });
}

/**
 * Rappelle la mention tant qu'elle n'a pas été acceptée.
 *
 * Le bouton reste actif et cliquable, mais un bouton qui ouvrirait la mention
 * sans que rien ne l'annonce serait déroutant : cet encart dit pourquoi
 * l'enregistrement n'a pas encore lieu, et donne le moyen de débloquer.
 *
 * @returns {Promise<boolean>} `true` si la collecte est autorisée.
 */
async function syncConsentNotice() {
  const accepted = isAccepted(await readConsent(api?.storage?.local));
  if (el.consentNotice) el.consentNotice.hidden = accepted;
  return accepted;
}

async function main() {
  try {
    await initI18n();
    applyTranslations(document);
    wireLocaleSwitcher();
    await syncConsentNotice();
    await loadActiveTab();
    await render();
  } catch (error) {
    reportStartupFailure(error);
  }
}

main();
