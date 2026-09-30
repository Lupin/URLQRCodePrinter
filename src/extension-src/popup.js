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
 * - **Les liens de la navigation privée ne touchent pas le disque.** La fenêtre
 *   lit deux zones — `chrome.storage.local` pour les liens ordinaires,
 *   `chrome.storage.session` pour la collection privée — et c'est le magasin
 *   composé qui route chaque écriture selon la collection. Il n'existe donc
 *   aucun chemin par lequel une URL privée pourrait être écrite quelque part de
 *   durable, et la collection privée n'apparaît même pas hors d'une fenêtre
 *   privée : c'est `visibleCollections` qui en décide, une fois pour toutes.
 */

import {
  createChromeStorageStore, createCompositeStore, createMemoryStore, withCollection,
} from './core/store.js';
import {
  DEFAULT_COLLECTION_NAME,
  PRIVATE_COLLECTION_ID,
  PRIVATE_LINKS_KEY,
  collectionDisplayName,
  createCollectionStore,
  displayedDocuments,
  isPrivateCollection,
  isPrivateContext,
} from './core/collections.js';

import { captureFromTab } from './core/capture.js';
import { toCsv, toMarkdown, exportFilename } from './core/exporters.js';
import { downloadText } from './core/download.js';
import {
  hostOf, hasShortUrl, safeHref, DEFAULT_TITLE_MAX,
} from './core/link.js';
import { resolveApi, readTabContext, sessionStorageArea } from './api.js';
import { initI18n, applyTranslations, getLocale, t } from './core/i18n.js';
import { readConsent, isAccepted } from './core/privacy.js';
import { informationPageHref } from './core/site.js';

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
  caretLeft:
    'M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32' +
    'L91.31,128Z',
  caretRight:
    'M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32' +
    'l80,80A8,8,0,0,1,181.66,133.66Z',
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
 * Résout les stockages sans jamais faire échouer la fenêtre.
 *
 * Trois zones, et une composition :
 *
 * - **locale** (`chrome.storage.local`) — les liens ordinaires, ceux que
 *   l'application et le service worker lisent ;
 * - **session** (`chrome.storage.session`) — les liens de la collection de
 *   navigation privée, en mémoire, jamais sur le disque. Elle n'existe pas
 *   partout (Chrome 102 et Safari 16.4 l'ont apportée), et une zone absente
 *   fait **disparaître la collection privée** au lieu de laisser croire à une
 *   persistance qui n'aurait pas lieu ;
 * - **collections** — la liste des collections et celle qui est courante.
 *
 * Une API absente ou incomplète ne doit pas emporter toute l'interface : au
 * pire, la collection vit le temps de la fenêtre.
 *
 * @returns {{ store: object, collections: object, privateStore: object|null }}
 */
function createStores() {
  let localArea = null;
  let sessionArea = null;
  try {
    localArea = api?.storage?.local ?? null;
    sessionArea = sessionStorageArea(api);
  } catch {
    // On retombe en mémoire, pour les liens comme pour les collections.
  }

  let local = null;
  let prive = null;
  try {
    local = localArea ? createChromeStorageStore({ area: localArea }) : createMemoryStore();
    prive = sessionArea
      ? createChromeStorageStore({ area: sessionArea, key: PRIVATE_LINKS_KEY })
      : null;
  } catch {
    local = createMemoryStore();
  }

  return {
    store: prive
      ? createCompositeStore([
        { store: local, match: (id) => id !== PRIVATE_COLLECTION_ID },
        { store: prive, match: (id) => id === PRIVATE_COLLECTION_ID },
      ])
      : local,
    collections: createCollectionStore({ area: localArea }),
    privateStore: prive,
  };
}

const { store, collections, privateStore } = createStores();

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
  currentTab: document.getElementById('current-tab'),
  captureTitle: document.getElementById('link-title'),
  addCurrent: document.getElementById('add-current'),
  siteLink: document.getElementById('site-link'),
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
  collectionTitle: document.getElementById('collection-title'),
  collectionPrev: document.getElementById('collection-prev'),
  collectionNext: document.getElementById('collection-next'),
  privateNotice: document.getElementById('private-notice'),
};

/**
 * Icônes des flèches de collection.
 *
 * Posées ici, une fois : ces boutons ne sont jamais reconstruits, et une icône
 * reposée à chaque rendu ferait clignoter la barre.
 */
el.collectionPrev.append(icon('caretLeft'));
el.collectionNext.append(icon('caretRight'));

/** @type {{ url?: string, title?: string }} */
let activeTab = {};
let toastTimer = null;

/**
 * La fenêtre s'ouvre-t-elle dans un contexte privé ?
 *
 * Deux sources : l'onglet visé (`tabs.Tab.incognito`, Safari 14 minimum) et
 * l'API d'extension (`extension.inIncognitoContext`, Safari 18 seulement). La
 * première est renseignée par `loadActiveTab`, la seconde est lue ici.
 */
let privateMode = false;

/** La collection affichée, et celles qui sont visibles dans ce contexte. */
let activeCollectionId = '';
/** @type {Array<{id: string, name: string, note: string, private?: boolean}>} */
let visibleList = [];

/**
 * La collection de navigation privée est-elle réellement utilisable ?
 *
 * Être dans une fenêtre privée ne suffit pas : sans `chrome.storage.session`,
 * la collection privée n'existe pas, et les liens doivent alors rejoindre une
 * collection ordinaire — ce que l'avis affiché explique.
 */
function privateCollectionAvailable() {
  return privateMode && privateStore !== null;
}

/** Le magasin borné à la collection affichée. */
function currentStore() {
  return withCollection(store, activeCollectionId);
}

/** La collection affichée, ou `undefined` tant que rien n'est chargé. */
function currentCollection() {
  return visibleList.find((collection) => collection.id === activeCollectionId);
}

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
  // L'onglet est la source la plus fiable — et la seule disponible sur les
  // Safari antérieurs à la version 18, où l'API d'extension n'existe pas.
  privateMode = isPrivateContext({
    tabIncognito: tab?.incognito,
    inIncognitoContext: api?.extension?.inIncognitoContext,
  });

  const capture = captureFromTab(activeTab);
  if (capture) {
    el.currentTab.textContent = capture.title || capture.url;
    el.currentTab.title = capture.url;
    el.addCurrent.disabled = false;
    // Le titre proposé est celui de la page, tel quel. C'est un point de départ
    // à corriger, pas une valeur à subir : il est pré-rempli et modifiable.
    if (el.captureTitle) {
      el.captureTitle.value = capture.title;
      el.captureTitle.disabled = false;
    }
  } else {
    el.currentTab.textContent = t('Cette page ne peut pas être enregistrée.');
    el.currentTab.title = '';
    el.addCurrent.disabled = true;
    // Champ et bouton disent la même chose : rien à saisir s'il n'y a rien à
    // enregistrer.
    if (el.captureTitle) {
      el.captureTitle.value = '';
      el.captureTitle.disabled = true;
    }
  }
}

/**
 * Reconstruit la barre de collection, l'avis privé, puis la liste affichée.
 *
 * L'ordre compte : la collection courante se résout **avant** de lire les
 * liens, sans quoi la liste afficherait un instant les liens d'une autre
 * collection — celle qui était courante avant que l'utilisateur ne change de
 * fenêtre ou ne renomme quelque chose.
 *
 * @returns {Promise<void>}
 */
async function render() {
  const prive = privateCollectionAvailable();
  visibleList = await collections.visible({ isPrivate: prive });

  if (!visibleList.some((collection) => collection.id === activeCollectionId)) {
    // La collection mémorisée a disparu, ou n'existe pas dans ce contexte : la
    // collection privée n'est visible qu'en fenêtre privée, par exemple.
    activeCollectionId = await collections.getActive(prive);
  }

  renderCollectionBar();
  renderPrivateNotice();

  const links = await currentStore().list();

  // Le nombre et son signe vivent dans deux nœuds : la région live reste
  // lisible (« Liens enregistrés : 3 »), et `#count` seul porte le chiffre. Le
  // signe est écrit une fois dans le HTML — U+1F517 n'a pas de traduction, et
  // une unité posée ici aurait divergé de celle du document livré.
  el.count.textContent = String(links.length);
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
 * Peint le nom de la collection et l'état des flèches.
 *
 * Les flèches sont désactivées — et non masquées — quand il n'y a qu'une seule
 * collection : leur place reste occupée, la barre ne se réorganise pas quand on
 * en crée une seconde, et rien ne disparaît sans explication.
 */
function renderCollectionBar() {
  const courante = currentCollection();
  el.collectionTitle.textContent = courante
    ? collectionDisplayName(courante)
    : t(DEFAULT_COLLECTION_NAME);

  // Les flèches restent en place, désactivées quand il n'y a rien à parcourir :
  // la barre ne se réorganise pas à la création d'une seconde collection, et
  // rien ne disparaît sans explication.
  const plusieurs = visibleList.length > 1;
  el.collectionPrev.disabled = !plusieurs;
  el.collectionNext.disabled = !plusieurs;
}

/**
 * Affiche, ou retire, l'avis de navigation privée.
 *
 * C'est le seul endroit où l'utilisateur apprend ce que devient un lien
 * enregistré depuis une fenêtre privée. Deux textes, parce que deux situations
 * différentes : la collection privée, qui s'efface à la fermeture du
 * navigateur, et une collection ordinaire, qui reste sur l'appareil.
 */
function renderPrivateNotice() {
  let texte = '';
  if (privateMode) {
    texte = isPrivateCollection(currentCollection())
      ? t("Fenêtre privée : cette collection n'est conservée que jusqu'à la fermeture du navigateur.")
      : t('Fenêtre privée : les liens enregistrés rejoignent une collection conservée sur votre appareil.');
  }
  el.privateNotice.textContent = texte;
  el.privateNotice.hidden = texte === '';
}

/**
 * Passe à la collection suivante ou précédente.
 *
 * Le parcours boucle : avec deux collections, les deux flèches restent utiles,
 * et l'utilisateur n'a pas à savoir dans quel sens il est en train de tourner.
 *
 * @param {number} pas -1 ou 1.
 * @returns {Promise<void>}
 */
async function switchCollection(pas) {
  if (visibleList.length < 2) return;
  const rang = visibleList.findIndex((collection) => collection.id === activeCollectionId);
  const cible = visibleList[((rang < 0 ? 0 : rang) + pas + visibleList.length) % visibleList.length];

  activeCollectionId = cible.id;
  await collections.setActive(cible.id, privateCollectionAvailable());
  await notifyBadge();
  await render();
  // Le nom est annoncé par la région live de `#collection-title` : pas de
  // message transitoire, qui doublerait l'annonce et masquerait la liste.
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

  await currentStore().remove(id);
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

/**
 * Demande au service worker de rafraîchir le compteur de l'icône.
 *
 * Le contexte est transmis : le compteur suit la collection courante, et celle
 * d'une fenêtre privée n'est pas celle d'une fenêtre ordinaire.
 */
async function notifyBadge() {
  try {
    await api.runtime.sendMessage({
      type: 'refresh-badge',
      isPrivate: privateCollectionAvailable(),
    });
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
    // Même règle que dans le service worker, et les trois cas se distinguent :
    // jamais prononcé, accord porté sur un texte antérieur, refus explicite.
    // Les confondre ferait dire « refus enregistré » à quelqu'un qui a accepté
    // — et qui doit seulement relire la mention, qui a changé.
    if (consent === null) openPrivacyNotice();
    else if (consent.decision === 'accepted') {
      toast(t('La mention a changé : relisez-la pour continuer à enregistrer.'));
    } else toast(t('Refus enregistré : acceptez la mention pour enregistrer un lien.'));
    return;
  }

  // Le titre vient du champ, l'adresse de l'onglet : c'est l'utilisateur qui a
  // le dernier mot sur le titre, et lui seul sait comment il retrouvera ce lien.
  const saisi = el.captureTitle ? el.captureTitle.value : activeTab.title;
  const capture = captureFromTab({ url: activeTab.url, title: saisi });
  if (!capture) {
    toast(t('Rien à enregistrer sur cette page'));
    return;
  }

  // Un titre différent de celui déjà enregistré est **adopté**, et on le dit :
  // refuser la correction obligeait à supprimer le lien pour le rajouter.
  const { duplicate, updated } = await currentStore().add(capture);
  await notifyBadge();
  await render();
  if (updated) toast(t('Lien mis à jour'));
  else toast(duplicate ? t('Déjà enregistré') : t('Page ajoutée'));
}

/**
 * Exporte la liste.
 * @param {'csv'|'md'} format
 * @returns {Promise<void>}
 */
async function exportAs(format) {
  // Ce qui sort est ce qui est affiché : exporter toute la base alors que la
  // fenêtre montre une collection surprendrait, et personne ne s'en apercevrait
  // avant d'ouvrir le fichier.
  const links = await currentStore().list();
  if (links.length === 0) return;

  const isCsv = format === 'csv';
  const text = isCsv ? toCsv(links) : toMarkdown(links);
  const filename = exportFilename(collectionDisplayName(currentCollection()), isCsv ? 'csv' : 'md');

  const ok = downloadText(filename, text, {
    mime: isCsv ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8',
  });
  toast(ok ? t('{filename} enregistré', { filename }) : t('Téléchargement impossible'));
}

el.addCurrent.addEventListener('click', addCurrentTab);
el.exportCsv.addEventListener('click', () => exportAs('csv'));
el.exportMd.addEventListener('click', () => exportAs('md'));
el.clear.addEventListener('click', async () => {
  // Seule la collection affichée est vidée : les autres ne sont même pas à
  // l'écran, et « Vider » ne doit pas les emporter.
  await currentStore().clear();
  await notifyBadge();
  await render();
  toast(t('Collection vidée'));
});

// Le parcours des collections, et lui seul : la fenêtre ne crée rien. Créer une
// collection demande un nom, une note, et la place de les relire — c'est le
// travail de l'application, où le sélecteur et ses commandes vivent.
el.collectionPrev.addEventListener('click', () => switchCollection(-1));
el.collectionNext.addEventListener('click', () => switchCollection(1));

/**
 * Ouvre l'application dans un onglet.
 *
 * C'est là que se trouvent les QR Codes, les mises en page et l'impression.
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
}

/**
 * Pose l'adresse de la page d'information, et annonce le nouvel onglet.
 *
 * Le `href` est écrit ici plutôt que dans le HTML : il dépend de la langue, et
 * une adresse écrite en dur enverrait la moitié des utilisateurs sur la
 * mauvaise page. Le calcul vit dans `core/site.js`, partagé avec l'application,
 * qui affiche le même lien. Le texte, lui, reste dans le HTML, où
 * `applyTranslations` le traduit avec le reste.
 */
function wireSiteLink() {
  const link = el.siteLink;
  if (!link) return;

  // La fenêtre est toujours servie par l'extension : le calcul, laissé à la page
  // courante, rend donc l'adresse publiée, dans la langue de l'interface.
  link.href = informationPageHref(getLocale());

  // Le changement de contexte est annoncé : sans cela, un utilisateur de lecteur
  // d'écran ne sait pas qu'un onglet va s'ouvrir.
  if (!link.querySelector('.sr-only')) {
    const hint = document.createElement('span');
    hint.className = 'sr-only';
    hint.textContent = t(' (ouvre un nouvel onglet)');
    link.appendChild(hint);
  }
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

/**
 * La fenêtre suit le stockage, comme l'application.
 *
 * Elle sait déjà relire ce qu'elle affiche — c'est `render` —, et c'est ce qu'il
 * faut quand une autre page a écrit. Le cas n'est pas théorique : l'entrée
 * « Ouvrir URLQRCodePrinter » du menu contextuel ouvre **cette page** dans un
 * onglet, et elle peut alors rester ouverte pendant qu'une autre page vide la
 * collection.
 *
 * Ses propres écritures déclenchent le même événement : `render` ne fait que
 * relire et redessiner, sans jamais écrire, donc la boucle s'arrête là.
 */
function followStorage() {
  api?.storage?.onChanged?.addListener((changes, area) => {
    if (!displayedDocuments(area).some((cle) => cle in changes)) return;
    render().catch(() => {});
  });
}

/**
 * Démarre la fenêtre.
 *
 * On évite volontairement l'`await` de premier niveau : une exception y
 * laisserait une page à moitié initialisée, sans message. Ici, tout échec est
 * rattrapé et affiché.
 */
async function main() {
  try {
    await initI18n();
    applyTranslations(document);
    wireSiteLink();

    // La borne du champ vient de la constante qui borne déjà les titres
    // enregistrés. Recopiée dans le HTML, elle aurait fini par diverger, et la
    // saisie se serait fait couper sans que rien ne l'annonce.
    if (el.captureTitle) el.captureTitle.maxLength = DEFAULT_TITLE_MAX;

    // La collection par défaut est matérialisée ici, une fois, plutôt que
    // devinée à chaque lecture : c'est elle qui reçoit les liens de qui n'a
    // jamais créé de collection.
    await collections.ensureDefault();
    await syncConsentNotice();
    await loadActiveTab();
    await render();
    followStorage();
  } catch (error) {
    reportStartupFailure(error);
  }
}

main();
