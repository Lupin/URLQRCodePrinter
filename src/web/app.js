/**
 * Application autonome.
 *
 * Trois responsabilités, tenues séparées :
 *   1. la collection (ajout, import, export, suppression) ;
 *   2. la mise en forme papier (planche d'étiquettes ou tableau) ;
 *   3. l'impression sur étiquette Niimbot.
 *
 * Tout ce qui peut être décidé sans navigateur vit dans `core/` et y est testé.
 * Ce fichier ne fait que du DOM et des appels système.
 */

import {
  createLink, hostOf, hasShortUrl, safeHref, resolveTarget, resolveTargets,
  sortLinks, sortByManualOrder, applyVisibleOrder, SORT_MODES,
} from './core/link.js';
import { resolveDefaultStore } from './core/store.js';
import { ELEMENT_IDS } from './element-ids.js';
import {
  createSettingsStore, DEFAULT_SETTINGS, COLLECTION_NAME_MAX, COLLECTION_NOTE_MAX,
  sanitizeSettings,
} from './core/settings.js';
import {
  SHORTENERS,
  findShortener,
  createShortener,
  describeShortenReport,
  isServiceFailure,
  suggestShortener,
} from './core/shorten.js';
import { encodeQr, toSvg } from './core/qr.js';
import { wrapText } from './core/label.js';
import {
  computeLabelGeometry,
  drawLabel,
  checkQrLegibility,
  labelContentFromChoices,
  layoutLabelLateral,
  layoutLabelRotated,
  wrapDate,
  fontSizeForDate,
  pxToMm,
  LABEL_ALIGNMENTS,
  DEFAULT_LABEL_ALIGNMENT,
} from './core/label.js';
import { imageDataToMono, validateBitmap, rotateBitmap } from './core/raster.js';
import {
  SHEET_PRESETS,
  SHEET_GROUPS,
  PAGE_SIZES,
  computeSheet,
  paginate,
  qrSideMm,
  fitGrid,
  clampGrid,
  presetToGrid,
  round1,
  qrRatioBounds,
  sheetTextMetrics,
  sheetCellLines,
  sheetCellText,
  sheetHeaderFits,
  SHEET_HEADER_MM,
  SHEET_CELL_MARGIN_MM,
  SHEET_QR_GAP_MM,
  SHEET_FONT_PT,
  MIN_MODULE_MM_PAPER,
  spacingForGrid,
} from './core/sheet.js';
import {
  PROFILES,
  DEFAULT_PROFILE,
  findProfile,
  compatibleSupplies,
  COMMON_LENGTHS_MM,
} from './core/printer/profiles.js';
import {
  toCsv,
  toMarkdown,
  toJson,
  exportFilename,
  DATE_MODES,
  formatCaptureDate,
  hasAnyNote,
  hasAnyTag,
} from './core/exporters.js';
import { downloadText, downloadBytes } from './core/download.js';
import { buildLinkSpreadsheet } from './core/spreadsheet.js';
import { parseImportFile, toImportableLinks } from './core/import.js';
import {
  labelPreviewZoom,
  LABEL_FORMATS,
  TEXT_MODES,
  findFormat,
  planLabel,
  planLabels,
  buildLabelArchive,
  labelArchiveName,
  ptToPx,
} from './core/label-export.js';
import { buildTableArchive } from './core/table-export.js';
import { buildSheetArchive, sheetArchiveName } from './core/sheet-archive.js';
import {
  buildPrinterLabelArchive, printerLabelArchiveName, printerLabelFileName,
} from './core/label-archive.js';
import {
  probeWebBluetooth,
  explainBluetoothFailure,
  requestPrinter,
  NiimbotTransport,
} from './core/printer/transport.js';
import { NiimbotPrinter } from './core/printer/printer.js';
import {
  initI18n, applyTranslations, setLocale, getLocale, t, tpl,
} from './core/i18n.js';

const PX_PER_MM = 96 / 25.4;

/** Identifiant de la feuille de style qui porte la taille de papier. */
const PRINT_PAGE_STYLE_ID = 'print-page-size';

// ---------------------------------------------------------------------------
// État
// ---------------------------------------------------------------------------

const { store, kind: storeKind } = resolveDefaultStore();

/** @type {import('./core/link.js').LinkRecord[]} */
let links = [];
/** Identifiants cochés pour l'impression. @type {Set<string>} */
let selected = new Set();
let mode = 'sheet';
/**
 * Largeur utile du rendu en cours de l'aperçu.
 *
 * Mesurée **une fois**, au début de `renderPreview`, et avant que l'aperçu ne
 * soit vidé.
 *
 * C'est ce qui corrige une boucle de rétroaction mesurée dans Chrome : vider
 * l'aperçu fait disparaître sa barre de défilement verticale, donc la largeur
 * utile augmente de quinze pixels ; l'échelle était alors calculée sur cette
 * largeur-là, le nouveau contenu rappelait la barre, et le cadre se retrouvait
 * plus large que la place réelle — 685 px dessinés pour 670 offerts, de façon
 * stable, un redimensionnement explicite n'y changeant rien. Mesurer avant de
 * vider donne la largeur que le contenu occupera réellement.
 *
 * Déclarée avec l'état du module, et non près de l'observateur qui s'en sert :
 * `renderPreview` l'écrit, et un appel plus tôt tomberait dans la zone morte de
 * la déclaration.
 */
let largeurApercuRendue = 0;

/**
 * Les services de raccourcissement qui n'ont pas répondu, pour la **session**.
 *
 * Rien n'est écrit : une panne d'aujourd'hui ne dit rien de demain, et un
 * marquage persistant finirait par écarter un service durablement bon. Le
 * marquage est levé dès qu'un raccourcissement réussit.
 */
const servicesEnEchec = new Map();

/** La largeur utile retenue pour ce rendu, ou une mesure de secours. */
function largeurUtileApercu() {
  return largeurApercuRendue > 0 ? largeurApercuRendue : previewViewportWidth();
}
let transport = null;
/** @type {NiimbotPrinter|null} */
let printer = null;
let toastTimer = null;
/** Objet-URL de l'aperçu d'étiquette, à révoquer avant chaque nouveau rendu. */
let labelPreviewUrl = null;
/** Préférences retenues d'une session à l'autre (service, cible du QR Code). */
const settings = createSettingsStore();
/** `AbortController` du lot de raccourcissement en cours, s'il y en a un. */
let shortenJob = null;
/** Options du choix de cible, gardées pour pouvoir les désactiver. */
const targetOptions = new Map();

/**
 * Rang de chaque lien dans la collection, à partir de 1.
 *
 * C'est ce numéro que porte la liste **et** le tableau imprimé : sans lui, le
 * « N° » d'une ligne de tableau ne renvoyait à rien, et on ne pouvait pas
 * retrouver de quel lien il parlait. Il suit l'ordre de la collection, donc il
 * reste le même quand la liste est filtrée ou quand on n'imprime qu'une
 * sélection.
 *
 * @type {Map<string, number>}
 */
let linkRanks = new Map();

/**
 * Le mode réorganisation est-il ouvert ?
 *
 * Il ne survit pas au rechargement, et c'est voulu : c'est un geste de
 * rangement, pas un réglage. Le laisser ouvert au retour donnerait une liste
 * couverte de poignées sans qu'on sache pourquoi.
 *
 * @type {boolean}
 */
let reorderMode = false;

/**
 * La dernière grille **demandée** dans le panneau de la planche, avant d'être
 * ramenée à ce qui tient. L'ajustement d'espacement part de là : sans elle, il
 * ne saurait plus ce que l'utilisateur voulait.
 *
 * @type {{columns: number, rows: number}|null}
 */
let derniereGrilleDemandee = null;

/**
 * La grille demandée a-t-elle été ramenée à ce qui tient ?
 *
 * C'est l'autre moitié du signal : le bouton d'ajustement se montre quand
 * quelque chose ne tient pas — la grille, ou le contenu dans les étiquettes.
 *
 * @type {boolean}
 */
let derniereGrilleEcourtee = false;

/**
 * La densité de la planche au dernier rendu : la cote de la matrice la plus
 * large, et le nombre de lignes de texte réservées. L'ajustement part de là —
 * c'est ce qui lui dit de quelle place les étiquettes ont besoin.
 *
 * @type {number|null}
 */
let derniersModules = null;

/** @type {number} */
let dernieresLignes = 0;

/**
 * La grille demandée **avant** que l'ajustement ne la change, pour pouvoir dire
 * ce qui ne tenait pas.
 *
 * @type {{columns: number, rows: number}|null}
 */
let derniereGrilleDemandeeInitiale = null;

/**
 * Orientations proposées à l'impression.
 *
 * Les têtes thermiques impriment ligne par ligne dans le sens du défilement :
 * selon le rouleau et le modèle, la même image sort à l'endroit, pivotée, ou à
 * l'envers. Le profil D110 porte un drapeau `transposed` — documenté mais jamais
 * lu jusqu'ici — et je n'ai pas de matériel pour trancher. On laisse donc le
 * choix, sans rien changer au comportement actuel par défaut.
 */
const LABEL_LAYOUTS = Object.freeze([
  {
    id: 'dessous',
    label: 'Texte droit, sous le QR Code',
    mode: 'stacked',
  },
  {
    id: 'dessus',
    label: 'Texte droit, au-dessus du QR Code',
    mode: 'stacked',
    textFirst: true,
  },
  {
    id: 'tourne',
    label: 'Texte tourné, se lit de bas en haut',
    // Sur un rouleau étroit, un texte droit ne dispose que de la largeur de la
    // tête moins le QR Code — quelques caractères. Tourné, il profite de la longueur.
    mode: 'rotated',
    sens: 'horaire',
  },
  {
    id: 'tourne-inverse',
    label: 'Texte tourné, se lit de haut en bas',
    // Même disposition, sens inverse : selon le rouleau et le sens de sortie,
    // l'un des deux se lit tête en bas. On donne le choix plutôt que de le
    // deviner, faute de matériel pour trancher.
    mode: 'rotated',
    sens: 'antihoraire',
  },
  {
    id: 'cote',
    label: 'Texte à droite du QR Code',
    mode: 'lateral',
    // Cette disposition n'a de sens que si le QR Code laisse une vraie colonne :
    // sur une tête de 12 mm, il en reste quelques pixels. On ne la propose donc
    // que sur une tête large, plutôt que de laisser choisir une option vide.
    minHeadPx: 200,
  },
]);

/**
 * Les dispositions qui ont un sens pour un profil donné.
 *
 * Proposer « texte à droite » sur une tête de 12 mm n'avait aucun sens : le QR Code
 * y occupe presque toute la largeur et la colonne de texte fait quelques
 * pixels. On écarte donc les dispositions inapplicables au lieu de les laisser
 * échouer à l'usage.
 *
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {typeof LABEL_LAYOUTS[number][]}
 */
function layoutsFor(profile) {
  const large = (profile?.printheadPixels ?? 0) >= 200;
  return LABEL_LAYOUTS.filter((entry) => large || entry.minHeadPx === undefined);
}


/**
 * Portée de l'impression en série.
 *
 * « Toute la collection » était la seule option offerte, alors que la sélection
 * cochée existait déjà pour l'impression papier : on ne pouvait pas imprimer
 * les trois étiquettes qu'on venait de cocher sans sortir les trente autres.
 */
/**
 * Les deux portées **multiples**, valeurs du sélecteur unique.
 *
 * Elles cohabitent avec un lien à la fois dans le même sélecteur : « ce qu'on
 * imprime » est une seule question, et deux listes déroulantes y répondaient.
 * Le préfixe à double souligné les distingue des identifiants de liens, qui
 * commencent tous par `id-`.
 */
const PORTEE_TOUT = '__all';
const PORTEE_COCHEE = '__selected';


/** Libellés des modes de date, dans l'ordre d'affichage. */
const DATE_MODE_LABELS = Object.freeze({
  none: 'Aucune',
  date: 'Date de collecte',
  datetime: 'Date et heure de collecte',
});

// ---------------------------------------------------------------------------
// Références DOM
// ---------------------------------------------------------------------------

// Les identifiants HTML sont en tirets, les accès en camelCase : sans cette
// conversion, `el.addForm` serait indéfini alors que `add-form` existe, et
// l'application n'échouerait qu'au premier clic.
/**
 * Convertit un identifiant HTML en clé d'accès : « add-form » → « addForm ».
 * @param {string} id
 * @returns {string}
 */
const toKey = (id) => id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

// La liste est déclarée dans un module à part pour qu'un test puisse vérifier
// que chaque identifiant existe réellement dans index.html.
const el = Object.fromEntries(
  ELEMENT_IDS.map((id) => [toKey(id), document.getElementById(id)]),
);

// Un identifiant absent ne casse pas le chargement : il produit un `null` qui
// n'échoue qu'au premier usage. On le signale donc au plus tôt.
const missing = ELEMENT_IDS.filter((id) => el[toKey(id)] == null);
if (missing.length > 0) {
  throw new Error(
    `Éléments absents de index.html : ${missing.join(', ')}. ` +
    'Le HTML et app.js ne sont pas de la même version.',
  );
}

/**
 * Vérifie que la feuille de style réellement appliquée est celle du build.
 *
 * Un navigateur peut servir un `style.css` gardé en cache alors que le HTML et
 * les scripts, eux, sont à jour. Le résultat est déroutant : les nouveaux
 * réglages apparaissent, mais la mise en page reste celle d'avant — étiquettes
 * empilées en une colonne, curseur de largeur sans effet. Plutôt que de laisser
 * chercher, l'application le détecte et le dit.
 *
 * Le contrôle lit une propriété que seule la feuille de style définit sur un
 * élément sonde : `position: absolute` sur `.print-cell`. Aucun style en ligne
 * n'intervient, donc la réponse vient bien du fichier chargé.
 *
 * @returns {boolean} `true` si la feuille attendue est appliquée.
 */
function stylesheetIsCurrent() {
  // Ces API n'existent pas dans tous les environnements d'exécution (les tests
  // de démarrage tournent sous Node, sans DOM réel) : dans ce cas on ne peut
  // rien affirmer, et on ne bloque pas.
  if (typeof getComputedStyle !== 'function' || typeof document.body?.appendChild !== 'function') {
    return true;
  }
  try {
    const probe = document.createElement('div');
    probe.className = 'print-cell';
    probe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(probe);
    const { position } = getComputedStyle(probe);
    if (typeof probe.remove === 'function') probe.remove();
    else probe.parentNode?.removeChild?.(probe);
    return position === 'absolute';
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Utilitaires d'interface
// ---------------------------------------------------------------------------

/**
 * Affiche un message transitoire.
 * @param {string} message
 * @param {'info'|'error'} [kind]
 */
function toast(message, kind = 'info') {
  el.toast.textContent = message;
  el.toast.classList.toggle('toast--error', kind === 'error');
  el.toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('toast--visible'), 2800);
}

/**
 * Construit un bouton.
 * @param {string} label
 * @param {string} className
 * @param {() => void} onClick
 * @returns {HTMLButtonElement}
 */
function button(label, className, onClick) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = label;
  node.addEventListener('click', onClick);
  return node;
}

/**
 * Construit l'aperçu SVG d'un QR Code.
 *
 * L'`innerHTML` est sûr ici : la chaîne ne contient que des nombres et des
 * couleurs choisies par le code, jamais de donnée utilisateur. L'URL est
 * encodée dans la matrice, pas recopiée dans le balisage.
 *
 * @param {string} url
 * @returns {SVGElement}
 */
function qrElement(url, { ecc = 'M', border = 1, scale = 4 } = {}) {
  return qrSvg(encodeQr(url, { ecc, border }), { scale });
}

/**
 * Rend une matrice déjà encodée.
 *
 * La planche encode chaque URL une fois : la taille de la matrice lui sert à
 * calculer les bornes du curseur, puis la même matrice est rendue. Encoder deux
 * fois le même lien doublerait le travail à chaque déplacement du curseur.
 *
 * @param {import('./core/qr.js').QrMatrix} matrix
 * @param {{ scale?: number }} [options]
 * @returns {SVGElement}
 */
function qrSvg(matrix, { scale = 4 } = {}) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = toSvg(matrix, { scale });
  return wrapper.firstElementChild;
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

/**
 * Met à jour le bouton d'impression en série : son libellé dit la portée, et il
 * reste inerte tant qu'il n'y a rien à imprimer.
 *
 * Le libellé est ce qui évite la mauvaise surprise : « Imprimer toute la
 * collection » alors que trois liens sont cochés ferait sortir trente
 * étiquettes.
 */
function updatePrintScope() {
  const { kind, items } = impressionChoisie();
  const copies = copiesCount();
  const ready = links.length > 0 && Boolean(printer);

  // Le libellé dit toujours le nombre d'étiquettes **et** le nombre
  // d'exemplaires : « Imprimer la collection » alors que la quantité est à 2
  // ferait sortir deux fois plus d'étiquettes que ce que la phrase laisse croire.
  const total = items.length * copies;
  el.printLabel.disabled = !ready || total === 0;
  // L'export ne demande **pas** d'imprimante : c'est précisément son objet.
  el.exportNiimbot.disabled = items.length === 0;
  el.printLabel.textContent = total === 0
    ? t('Aucun lien à imprimer')
    : tpl(total, 'Imprimer {count} étiquette', 'Imprimer {count} étiquettes')
      + (copies > 1 ? ` (${tpl(items.length, '{count} lien', '{count} liens')} × ${copies})` : '');

  // La phrase dit ce qui est retenu, et pourquoi le bouton est inerte le cas
  // échéant : « Ce qu'on imprime » seul ne disait pas ce qui allait sortir.
  if (links.length === 0) {
    el.printScopeHint.textContent = t('Aucun lien dans la collection.');
    return;
  }
  if (items.length === 0) {
    el.printScopeHint.textContent = t(
      'Aucun lien coché : cochez les liens à imprimer dans la liste, ou choisissez « Toute la collection ».',
    );
    return;
  }
  const source = kind === 'one'
    ? t('le lien affiché')
    : (kind === 'selected'
      ? tpl(items.length, '{count} lien coché', '{count} liens cochés', { count: items.length })
      : t('les {count} liens de la collection', { count: items.length }));
  el.printScopeHint.textContent = copies > 1
    ? tpl(copies, '{source}, {count} exemplaire de chacun.', '{source}, {count} exemplaires de chacun.', { source })
    : `${source}.`;
}

/**
 * Nombre d'exemplaires de chaque lien pour l'impression en série.
 *
 * Une valeur absente ou aberrante retombe sur 1 : mieux vaut sortir une
 * étiquette que d'en sortir zéro à cause d'un champ vidé.
 *
 * @returns {number}
 */
function copiesCount() {
  const typed = Math.trunc(Number(el.copies.value));
  if (!Number.isFinite(typed) || typed < 1) return 1;
  return Math.min(typed, 20);
}

/** Recharge la collection depuis le stockage et redessine. */
async function refresh() {
  // **Le tri est une vue**, et la vue commande tout : la liste, le rang imprimé,
  // les exports et l'impression. Un seul tableau plutôt que deux, parce que deux
  // ordres coexistant finiraient par se contredire — le CSV dans un ordre et le
  // « N° » du tableau dans l'autre. Le magasin, lui, garde l'ordre manuel : revenir
  // à « Ordre manuel » retrouve la collection telle qu'on l'avait laissée.
  links = sortLinks(await store.list(), preferences.sortMode);
  linkRanks = new Map(links.map((link, index) => [link.id, index + premierNumero()]));
  fillLabelLinks();
  updatePrintScope();
  // Les colonnes « Tags » et « Note » ne sont proposées que si la collection en
  // contient : une colonne vide sur toute une page n'apprend rien.
  updateTableOptions();
  updateHeaderNoteOptions();
  const ids = new Set(links.map((link) => link.id));
  // On conserve les cases cochées qui existent encore.
  selected = new Set([...selected].filter((id) => ids.has(id)));
  renderList();
  updateSortHint();
  renderPreview();
}

/**
 * Déplace un lien d'un cran dans l'ordre **manuel**, et l'enregistre.
 *
 * Le premier déplacement attribue un rang à tout le monde : sans cela, il n'y
 * aurait rien à échanger, puisque aucun lien n'en porte encore. Les rangs
 * partent de l'ordre actuellement affiché — qui est l'ordre manuel, puisque les
 * flèches n'existent qu'en mode manuel.
 *
 * @param {string} id
 * @param {number} delta -1 vers le haut, +1 vers le bas.
 * @returns {Promise<void>}
 */
async function moveLink(id, delta) {
  const ordre = sortByManualOrder(links);
  const index = ordre.findIndex((link) => link.id === id);
  const cible = index + delta;
  if (index === -1 || cible < 0 || cible >= ordre.length) return;

  const suite = [...ordre];
  [suite[index], suite[cible]] = [suite[cible], suite[index]];

  await store.putMany(suite.map((link, rang) => ({ ...link, order: rang })));
  await refresh();
}

/** Affiche la liste, filtrée par la recherche. */
function renderList() {
  const query = el.search.value.trim().toLowerCase();
  const visible = query
    ? links.filter((link) =>
        `${link.title} ${link.url} ${link.tags.join(' ')}`.toLowerCase().includes(query))
    : links;

  el.list.textContent = '';
  el.empty.hidden = visible.length > 0;

  // Ranger n'a de sens qu'en ordre manuel : sous un tri, un déplacement serait
  // annulé au rendu suivant. Le bouton le dit en étant inactif, et l'explication
  // est dans l'indice juste au-dessus — plutôt que deux flèches inertes sur
  // chaque ligne, qui laisseraient croire à une panne.
  const peutRanger = preferences.sortMode === 'manual' && links.length > 1;
  if (!peutRanger) reorderMode = false;
  el.reorder.disabled = !peutRanger;
  el.reorder.setAttribute('aria-pressed', reorderMode ? 'true' : 'false');
  el.reorder.textContent = reorderMode ? t('Terminer le rangement') : t('Réorganiser');
  el.list.classList.toggle('links--reorder', reorderMode);
  el.empty.textContent = links.length === 0
    ? t('Aucun lien. Ajoutez-en un ci-dessus, importez une archive, ou utilisez l\'extension navigateur.')
    : t('Aucun lien ne correspond à la recherche.');

  el.count.textContent = tpl(links.length, '{count} lien', '{count} liens');

  const hasLinks = links.length > 0;
  el.exportXlsx.disabled = !hasLinks;
  el.exportCsv.disabled = !hasLinks;
  el.exportMd.disabled = !hasLinks;
  el.exportJson.disabled = !hasLinks;
  el.clear.disabled = !hasLinks;
  el.shorten.disabled = !hasLinks;
  updateShortenStatus();
  updateTargetAvailability();
  updateSelectionHint();
  // La sélection cochée peut changer sans que la liste soit rechargée : la
  // portée de la série se recalcule donc ici, où tout passe.
  updatePrintScope();

  for (const link of visible) el.list.appendChild(renderLink(link));
}

/**
 * Rend une URL cliquable, avec un repli en texte simple.
 *
 * Le repli n'est pas décoratif : une URL illisible ne doit pas produire un lien
 * mort, et un `href` ne doit jamais recevoir autre chose qu'une URL http(s) —
 * le contenu de la liste peut venir d'un import ou d'une page web.
 *
 * @param {string} url
 * @param {string} className
 * @param {string} [label] Texte affiché, l'URL par défaut.
 * @returns {HTMLElement}
 */
function linkAnchor(url, className, label = url) {
  const href = safeHref(url);
  const node = document.createElement(href === '' ? 'span' : 'a');
  node.className = className;
  node.textContent = label;
  node.title = url;
  if (href !== '') {
    node.href = href;
    node.target = '_blank';
    // `noopener` : la page ouverte ne doit pas pouvoir manipuler cet onglet.
    node.rel = 'noopener noreferrer';
    node.classList.add('link--clickable');
  }
  return node;
}

/**
 * Éditeur des champs de saisie d'un lien : titre, tags, note.
 *
 * Ces trois champs partent dans les exports — colonnes « Titre », « Tags » et
 * « Note » du CSV, du Markdown et du classeur. Tant qu'ils n'étaient pas
 * saisissables, les exports transportaient des colonnes qu'aucune interface ne
 * pouvait remplir : le titre restait vide sur un lien ajouté à la main, et les
 * tags ne pouvaient venir que d'un import. Un export n'a de sens que s'il est
 * raccord avec ce qu'on peut saisir.
 *
 * L'édition reste repliée derrière un bouton : la ligne doit rester lisible
 * quand on ne modifie rien.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @returns {HTMLElement}
 */
function linkEditor(link) {
  const wrap = document.createElement('div');
  wrap.className = 'link__editor';

  const open = button('✎', 'link__edit', () => {
    let settled = false;

    const form = document.createElement('div');
    form.className = 'link__editor-form';

    const fields = [
      { key: 'title', label: t('Titre'), value: link.title, placeholder: t('Titre de la page') },
      { key: 'tags', label: t('Tags'), value: link.tags.join(', '), placeholder: t('veille, travail') },
      { key: 'note', label: t('Note'), value: link.note, placeholder: t('Note libre') },
    ];

    const inputs = new Map();
    for (const field of fields) {
      const line = document.createElement('label');
      line.className = 'link__editor-field';

      const caption = document.createElement('span');
      caption.className = 'link__editor-label';
      caption.textContent = field.label;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'input input--compact';
      input.value = field.value ?? '';
      input.placeholder = field.placeholder;
      input.setAttribute('aria-label', t('{label} pour {url}', { label: field.label, url: link.url }));

      line.append(caption, input);
      form.appendChild(line);
      inputs.set(field.key, input);
    }

    const hint = document.createElement('p');
    hint.className = 'hint hint--tight';
    hint.textContent = t('Entrée pour enregistrer, Échap pour annuler. Tags séparés par des virgules.');
    form.appendChild(hint);

    // Les deux commandes du formulaire, visibles.
    //
    // Elles ne l'étaient pas : le formulaire ne se fermait qu'avec Entrée ou
    // Échap, et seule une phrase d'aide le disait. Un utilisateur qui ne lit pas
    // la phrase — c'est-à-dire presque tous — n'avait aucun moyen de voir
    // comment terminer. Les raccourcis restent : ils sont plus rapides, et
    // maintenant annoncés à côté de boutons qui font la même chose.
    const actions = document.createElement('div');
    actions.className = 'link__editor-actions';
    actions.append(
      button(t('Annuler'), 'btn btn--ghost', () => finish(false)),
      button(t('Enregistrer'), 'btn btn--primary', () => finish(true)),
    );
    form.appendChild(actions);

    const finish = async (save) => {
      if (settled) return;
      settled = true;

      if (save) {
        // `createLink` normalise : les tags sont dédoublonnés et mis en forme,
        // le titre comme la note sont bornés.
        const updated = createLink({
          ...link,
          title: inputs.get('title').value,
          note: inputs.get('note').value,
          tags: inputs.get('tags').value.split(','),
        });
        const changed = updated.title !== link.title
          || updated.note !== link.note
          || updated.tags.join(',') !== link.tags.join(',');
        if (changed) {
          await store.put({ ...link, title: updated.title, note: updated.note, tags: updated.tags });
          await refresh();
          toast(t('Lien mis à jour'));
          return;
        }
      }
      await refresh();
    };

    for (const input of inputs.values()) {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finish(true);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
        }
      });
    }

    wrap.textContent = '';
    wrap.appendChild(form);
    inputs.get('title')?.focus();
  });
  open.setAttribute('aria-label', t('Modifier titre, tags et note de {title}', { title: link.title || link.url }));
  open.title = t('Modifier le titre, les tags et la note');

  wrap.appendChild(open);
  return wrap;
}

/**
 * Construit une ligne de la collection.
 * @param {import('./core/link.js').LinkRecord} link
 * @returns {HTMLLIElement}
 */
function renderLink(link) {
  const item = document.createElement('li');
  item.className = 'link';
  // L'identifiant sur la ligne, et non seulement dans la fermeture : c'est ce
  // qui permet de relire l'ordre obtenu par un geste, à la fin du glissement.
  item.dataset.id = link.id;

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'link__check';
  check.checked = selected.has(link.id);
  check.setAttribute('aria-label', t('Sélectionner {title}', { title: link.title || link.url }));
  check.addEventListener('change', () => {
    if (check.checked) selected.add(link.id);
    else selected.delete(link.id);
    // La phrase et le libellé du bouton disent ce qui sera imprimé : ils
    // doivent suivre chaque case cochée, sans quoi ils mentent. `updatePrintScope`
    // manquait ici : cocher trois liens laissait le bouton annoncer « 1 étiquette ».
    updateSelectionHint();
    updatePrintScope();
    renderPreview();
  });

  const body = document.createElement('div');
  body.className = 'link__body';

  // Le titre et l'URL ouvrent la page dans un nouvel onglet : on doit pouvoir
  // vérifier un lien collecté sans quitter la collection.
  const title = linkAnchor(link.url, 'link__title', link.title || hostOf(link.url) || link.url);
  const url = linkAnchor(link.url, 'link__url');

  body.append(title, url);

  if (hasShortUrl(link)) {
    const short = document.createElement('div');
    short.className = 'link__short';
    const mark = document.createElement('span');
    mark.className = 'link__short-mark';
    mark.textContent = '↳';
    mark.setAttribute('aria-hidden', 'true');
    const provider = document.createElement('span');
    provider.className = 'link__short-provider';
    provider.textContent = findShortener(link.shortProvider)?.name ?? link.shortProvider ?? '';
    short.append(mark, linkAnchor(link.shortUrl, 'link__short-url'), provider);
    body.appendChild(short);
  }

  // La note est visible sans ouvrir l'éditeur : c'est souvent la seule chose
  // qu'on veut relire.
  if (link.note) {
    const note = document.createElement('div');
    note.className = 'link__note';
    note.textContent = link.note;
    note.title = link.note;
    body.appendChild(note);
  }

  if (link.tags.length) {
    const tags = document.createElement('div');
    tags.className = 'link__tags';
    for (const tag of link.tags) {
      // Cliquer une puce filtre la collection sur ce tag : c'est le seul
      // intérêt de classer, et cela évite d'avoir à le retaper.
      //
      // Le « # » est une syntaxe de saisie, pas une identité : `normalizeTags`
      // l'accepte puis le retire, si bien que le tag est déjà stocké sans lui.
      // La puce n'a donc pas à le réafficher — son fond dit assez qu'il s'agit
      // d'un tag. Le nom accessible, lui, explicite l'action : un bouton nommé
      // « musique » n'apprend rien à un lecteur d'écran.
      const chip = button(tag, 'tag', () => {
        el.search.value = tag;
        renderList();
      });
      const action = t('Filtrer sur le tag « {tag} »', { tag });
      chip.title = action;
      chip.setAttribute('aria-label', action);
      tags.appendChild(chip);
    }
    body.appendChild(tags);
  }

  // La cible du QR Code de **ce lien**, quand elle peut différer du réglage
  // global : un raccourci existe, et l'on peut vouloir encoder l'un ou l'autre.
  // Sans raccourci, il n'y a rien à choisir — et proposer un choix vide serait
  // une commande sans effet.
  let cible = null;
  if (hasShortUrl(link)) {
    cible = document.createElement('label');
    cible.className = 'link__target';
    const case_ = document.createElement('input');
    case_.type = 'checkbox';
    // `undefined` suit le réglage global, et la case doit le montrer tel quel.
    case_.checked = typeof link.useShort === 'boolean'
      ? link.useShort
      : preferences.targetMode === 'short';
    const libelle = t('Encoder le lien raccourci');
    case_.setAttribute('aria-label', t('{label} pour {title}', {
      label: libelle, title: link.title || link.url,
    }));
    case_.addEventListener('change', async () => {
      await store.put({ ...link, useShort: case_.checked });
      await refresh();
    });
    const texte = document.createElement('span');
    texte.className = 'link__target-label';
    texte.textContent = libelle;
    cible.append(case_, texte);
    // Un clic sur le libellé ne doit pas ouvrir l'éditeur de la ligne : le
    // contrôle est autonome.
    cible.addEventListener('click', (event) => event.stopPropagation());
  }

  const remove = button('×', 'link__remove', async () => {
    await store.remove(link.id);
    selected.delete(link.id);
    await refresh();
    toast(t('Lien supprimé'));
  });
  remove.setAttribute('aria-label', t('Supprimer {title}', { title: link.title || link.url }));

  const rank = document.createElement('span');
  rank.className = 'link__index';
  rank.textContent = String(linkRanks.get(link.id) ?? '');
  rank.title = t('Rang dans la collection, celui du tableau imprimé');

  // Les flèches n'existent qu'en **ordre manuel**. On ne réordonne pas une liste
  // triée : le déplacement serait annulé au rendu suivant, et l'utilisateur
  // croirait à une panne. Le libellé du tri le dit, plutôt que de laisser des
  // boutons inertes.
  if (cible) body.appendChild(cible);

  // Le rangement n'existe qu'en **mode** réorganisation, et il se pose à gauche
  // de la ligne. Deux flèches permanentes sur chaque ligne encombraient la liste
  // pour une action qu'on fait une fois, puis qu'on quitte.
  if (reorderMode) {
    item.append(moveControls(link), check, rank, body, remove, linkEditor(link));
    return item;
  }

  // L'éditeur vient **après** la croix : il se replie sur sa propre ligne, et
  // la croix reste ainsi sur celle du titre, où on la cherche.
  item.append(check, rank, body, remove, linkEditor(link));
  return item;
}

/**
 * Le bloc de rangement d'une ligne : une poignée, et les deux flèches.
 *
 * Les flèches ne sont pas un doublon du geste, elles en sont **l'alternative** :
 * le critère 2.5.7 (AA) exige qu'une action faisable par glissement le soit
 * aussi sans glisser. La poignée, elle, ne dit rien à l'assistance vocale — on
 * ne peut pas glisser à la voix — et elle reste donc décorative, sans être
 * focalisable : un bouton caché aux lecteurs d'écran mais atteignable au clavier
 * serait un piège.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @returns {HTMLDivElement}
 */
function moveControls(link) {
  const bloc = document.createElement('div');
  bloc.className = 'link__rank';

  const grip = document.createElement('span');
  grip.className = 'link__grip';
  grip.setAttribute('aria-hidden', 'true');
  grip.textContent = '⠿';

  // La **position** dans la liste, et non le numéro affiché : depuis que la
  // numérotation peut commencer à 101, comparer le numéro à l'effectif
  // désactiverait les flèches au mauvais moment.
  const position = links.findIndex((candidat) => candidat.id === link.id) + 1;
  const nom = link.title || link.url;
  const up = button('▲', 'link__move', () => moveLink(link.id, -1));
  up.setAttribute('aria-label', t('Déplacer {title} vers le haut', { title: nom }));
  up.title = t('Monter');
  up.disabled = position <= 1;

  const down = button('▼', 'link__move', () => moveLink(link.id, 1));
  down.setAttribute('aria-label', t('Déplacer {title} vers le bas', { title: nom }));
  down.title = t('Descendre');
  down.disabled = position <= 0 || position >= links.length;

  bloc.append(grip, up, down);
  wireDrag(grip);
  return bloc;
}

/**
 * Fait suivre la ligne au doigt qui tient la poignée.
 *
 * Les événements de pointeur plutôt que l'API de glisser-déposer du navigateur :
 * celle-ci impose une image fantôme, ignore le tactile sur beaucoup de
 * systèmes, et ne dit rien de la position réelle. Ici, la ligne **se déplace
 * dans le document** pendant le geste, et l'ordre du document à la fin est
 * l'ordre obtenu — sans état intermédiaire à tenir à jour.
 *
 * @param {HTMLElement} grip
 */
function wireDrag(grip) {
  grip.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const ligne = grip.closest('.link');
    if (!ligne || !el.list.contains(ligne)) return;
    // Sans cela, le navigateur commence une sélection de texte et le geste
    // n'atteint jamais la ligne suivante.
    event.preventDefault();

    // **La capture se prend sur la liste, jamais sur la poignée.**
    //
    // Ranger une ligne, c'est la retirer du document pour la réinsérer plus
    // loin : ses descendants sont donc détachés, et le navigateur relâche
    // aussitôt la capture que porterait l'un d'eux. Le relâchement du doigt
    // n'arrivait alors nulle part, la ligne restait marquée comme saisie, et
    // rien n'était écrit — constaté au compteur d'événements du relevé Chrome
    // (relache à 0, perdu à 1), puis corrigé ici.
    el.list.setPointerCapture(event.pointerId);
    ligne.classList.add('link--dragging');

    let saisi = false;

    const suivre = (suite) => {
      saisi = true;
      const autres = [...el.list.querySelectorAll('.link')].filter((n) => n !== ligne);
      for (const autre of autres) {
        const boite = autre.getBoundingClientRect();
        if (suite.clientY < boite.top + boite.height / 2) {
          if (autre.previousElementSibling !== ligne) el.list.insertBefore(ligne, autre);
          return;
        }
      }
      if (el.list.lastElementChild !== ligne) el.list.appendChild(ligne);
    };

    const lacher = async () => {
      el.list.removeEventListener('pointermove', suivre);
      el.list.removeEventListener('pointerup', lacher);
      el.list.removeEventListener('pointercancel', lacher);
      ligne.classList.remove('link--dragging');
      // Un appui sans mouvement n'est pas un rangement : on ne réécrit pas la
      // collection pour rien.
      if (saisi) await applyOrder([...el.list.querySelectorAll('.link')].map((n) => n.dataset.id));
    };

    el.list.addEventListener('pointermove', suivre);
    el.list.addEventListener('pointerup', lacher);
    el.list.addEventListener('pointercancel', lacher);
  });
}

/**
 * Enregistre l'ordre des identifiants affichés, tel qu'il vient du document.
 * @param {string[]} ids
 * @returns {Promise<void>}
 */
async function applyOrder(ids) {
  const suite = applyVisibleOrder(links, ids);
  await store.putMany(suite.map((link, rang) => ({ ...link, order: rang })));
  await refresh();
}

/**
 * Explique la sélection courante, et surtout ce qu'elle implique.
 *
 * La règle « aucune case cochée = toute la collection » est la moins devinable
 * de l'application : sans elle, « Tout décocher » ressemble à « n'imprimer
 * rien » alors que c'est « tout imprimer ». On l'écrit donc en toutes lettres,
 * et le bouton d'impression rappelle la portée.
 */
/**
 * Explique ce que le tri fait, et ce qu'il empêche.
 *
 * Deux choses ne se devinent pas : le tri **renumérote** le tableau imprimé — le
 * « N° » sert à retrouver la ligne dans la liste qu'on a sous les yeux — et il
 * fait disparaître les flèches de déplacement, parce qu'on ne réordonne pas une
 * liste triée.
 */
function updateSortHint() {
  if (!el.sortHint) return;
  if (preferences.sortMode !== 'manual') {
    el.sortHint.textContent = t(
      "Le tri range la liste et renumérote le tableau imprimé. Le rangement n'existe qu'en ordre manuel : on ne réordonne pas une liste triée.",
    );
    return;
  }
  if (links.length < 2) {
    el.sortHint.textContent = '';
    return;
  }
  el.sortHint.textContent = reorderMode
    ? t('Faites glisser une ligne par sa poignée, ou servez-vous des flèches. Échap referme le rangement.')
    : t("Le rangement déplace un lien dans la collection, et le tableau imprimé suit cet ordre. Un tri le renumérote.");
}

/** Ouvre ou referme le mode réorganisation, et dit ce qu'il en est. */
function setReorderMode(ouvert) {
  const possible = preferences.sortMode === 'manual' && links.length > 1;
  reorderMode = Boolean(ouvert) && possible;
  renderList();
  updateSortHint();
}

/**
 * Propose les tris, en un seul groupe : ils répondent tous à la même question.
 */
function fillSortModes() {
  for (const mode of SORT_MODES) {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = t(mode.label);
    el.sortMode.appendChild(option);
  }
  el.sortMode.value = preferences.sortMode;
}

function updateSelectionHint() {
  // La case maîtresse reflète l'état de la liste : cochée si tout l'est,
  // indéterminée si une partie seulement. C'est ce qui remplace avantageusement
  // deux boutons : l'état se lit au lieu de se deviner.
  const all = links.length > 0 && selected.size >= links.length;
  el.selectAllBox.checked = all;
  el.selectAllBox.indeterminate = !all && selected.size > 0;
  el.selectAllBox.disabled = links.length === 0;

  if (links.length === 0) {
    el.selectionHint.textContent = '';
    return;
  }
  if (all) {
    el.selectionHint.textContent = t('Les {count} liens sont cochés.', { count: links.length });
    return;
  }
  el.selectionHint.textContent = selected.size === 0
    ? t("Aucun lien coché : l'impression portera sur toute la collection ({count}).", { count: links.length })
    : `${tpl(selected.size, '{count} lien coché', '{count} liens cochés')} `
      + t('sur {count}.', { count: links.length });
}

/**
 * Libellé du bouton d'impression, portée comprise.
 *
 * @param {number} count
 * @returns {string}
 */
function printLabel(count) {
  if (count === 0) return t('Imprimer');

  // Cocher tous les liens revient à imprimer la collection : le dire ainsi est
  // plus clair que « la sélection (33) ».
  const whole = selected.size === 0 || selected.size >= links.length;
  if (whole) return count === 1 ? t('Imprimer le lien') : t('Imprimer les {count} liens', { count });

  return t('Imprimer la sélection ({count})', { count });
}

/**
 * Libellé du bouton d'export d'images, portée comprise.
 *
 * Même règle que le bouton d'impression : cocher tous les liens vaut la
 * collection entière, et le nombre annonce exactement ce qui sortira de
 * l'archive. « Exporter les images » sans nombre laissait deviner la portée
 * alors que la sélection, elle, pouvait n'être que partielle.
 *
 * @param {number} count
 * @returns {string}
 */
function exportImagesLabel(count) {
  if (count === 0) return t('Exporter les images (ZIP)');

  const whole = selected.size === 0 || selected.size >= links.length;
  if (whole) {
    return count === 1
      ? t("Exporter l'image (ZIP)")
      : t('Exporter les {count} images (ZIP)', { count });
  }

  return t('Exporter la sélection ({count})', { count });
}

/** L'ensemble des liens actuellement sélectionnés, dans l'ordre d'affichage. */
/**
 * Le numéro du premier lien de la collection.
 *
 * Il est **réglé**, et non déduit : on numérote une série d'objets, et une
 * série continue après qu'on a vidé la collection du lot précédent. Le déduire
 * des liens présents remettrait la numérotation à 1 au moment précis où l'on
 * veut la continuer.
 *
 * @returns {number}
 */
function premierNumero() {
  return preferences.startIndex;
}

function selectedLinks() {
  const picked = links.filter((link) => selected.has(link.id));
  // Sans sélection explicite, tout est imprimé : c'est l'intention la plus
  // probable quand on clique « Imprimer ».
  return picked.length > 0 ? picked : links;
}

/**
 * Nom de la collection, tel qu'il part dans les exports.
 *
 * Un champ vidé retombe sur la valeur par défaut : un export sans titre n'aurait
 * pas de sens, et personne n'a à ressaisir « Mes liens » pour l'obtenir.
 *
 * @returns {string}
 */
function collectionName() {
  const typed = el.collectionName.value.trim();
  return typed === '' ? t(DEFAULT_SETTINGS.collectionName) : typed.slice(0, COLLECTION_NAME_MAX);
}

/**
 * La note de collection, telle qu'elle sera exportée et imprimée.
 *
 * Vide est un état normal : contrairement au nom, il n'y a pas de texte par
 * défaut à lui substituer.
 */
function collectionNote() {
  return (el.collectionNote?.value ?? '').trim().slice(0, COLLECTION_NOTE_MAX);
}

/** Reporte le nom de collection sur le titre de la page. */
function applyCollectionName() {
  document.title = `${collectionName()} — URLQRCodePrinter`;
}

/**
 * Les liens à imprimer, préparés pour la cible choisie.
 *
 * C'est le seul endroit où l'on décide si le QR Code encode l'URL collectée ou
 * son raccourci. Tout ce qui produit une image, une planche ou une étiquette
 * passe par ici, et rien d'autre : la liste affichée à l'écran, elle, garde
 * toujours l'URL d'origine.
 *
 * @returns {import('./core/link.js').LinkRecord[]}
 */
function printableLinks() {
  return resolveTargets(selectedLinks(), el.qrTarget.value);
}

/** Ajoute un lien saisi à la main. */
async function addFromInput() {
  const raw = el.urlInput.value.trim();
  el.addError.hidden = true;

  if (raw === '') {
    el.addError.textContent = t('Saisissez une URL.');
    el.addError.hidden = false;
    return;
  }

  try {
    createLink({ url: raw });
  } catch (error) {
    el.addError.textContent = error.message;
    el.addError.hidden = false;
    return;
  }

  const { link, duplicate } = await store.add({ url: raw, source: 'manual' });
  el.urlInput.value = '';
  selected.add(link.id);
  await refresh();
  toast(duplicate ? t('Ce lien est déjà dans la collection') : t('Lien ajouté'));
}

/**
 * Exporte la collection.
 * @param {'csv'|'md'|'json'} format
 */
function exportAs(format) {
  if (links.length === 0) return;

  const name = collectionName();
  const note = collectionNote();
  const specs = {
    // Le CSV n'a que des lignes de liens : la note décrit la collection, elle
    // n'a pas de ligne où se mettre. Elle va dans les sorties qui portent un
    // en-tête — Markdown et archive.
    csv: { text: toCsv(links), ext: 'csv', mime: 'text/csv;charset=utf-8' },
    // Le titre du Markdown est le nom de la collection : ce que l'utilisateur a
    // nommé, et non un libellé choisi par le programme.
    md: {
      text: toMarkdown(links, { title: name, note }),
      ext: 'md',
      mime: 'text/markdown;charset=utf-8',
    },
    json: { text: toJson(links, { title: name, note }), ext: 'json', mime: 'application/json' },
  };
  const spec = specs[format];
  const filename = exportFilename(name, spec.ext);

  const ok = downloadText(filename, spec.text, { mime: spec.mime });
  toast(ok ? t('{filename} enregistré', { filename }) : t('Téléchargement impossible'), ok ? 'info' : 'error');
}

/**
 * Importe une archive JSON.
 * @param {File} file
 */
async function importArchive(file) {
  const label = el.import.textContent;
  el.import.disabled = true;
  el.import.textContent = t('Lecture…');

  try {
    // Un ZIP se lit en octets, un texte en texte : le manifeste du dossier
    // d'étiquettes est à l'intérieur de l'archive, pas à côté.
    const isZip = /\.zip$/i.test(file.name) || file.type === 'application/zip';
    const parsed = parseImportFile(isZip
      ? { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name }
      : { text: await file.text(), name: file.name });

    // Un enregistrement illisible n'arrête pas l'import : il est compté.
    const { links: candidates, rejected } = toImportableLinks(parsed.records);
    if (candidates.length === 0) {
      toast(t('Aucun lien exploitable dans {file}', { file: file.name }), 'error');
      return;
    }

    let added = 0;
    let duplicates = 0;
    for (const candidate of candidates) {
      const { duplicate } = await store.add(candidate, { allowDuplicate: false });
      if (duplicate) duplicates++;
      else added++;
    }

    await refresh();
    toast(importReport({ added, duplicates, rejected }));
  } catch (error) {
    toast(t('Import impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.import.textContent = label;
    el.import.disabled = false;
  }
}

/**
 * Résume un import en une phrase.
 *
 * Distinguer « déjà présent » de « illisible » évite de croire à un échec là où
 * l'import a simplement reconnu ce qu'il avait déjà.
 *
 * @param {{ added: number, duplicates: number, rejected: number }} report
 * @returns {string}
 */
function importReport({ added, duplicates, rejected }) {
  const parts = [tpl(added, '{count} lien importé', '{count} liens importés')];
  if (duplicates > 0) parts.push(tpl(duplicates, '{count} déjà présent', '{count} déjà présents'));
  if (rejected > 0) parts.push(tpl(rejected, '{count} illisible', '{count} illisibles'));
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Raccourcissement d'URL
// ---------------------------------------------------------------------------

/**
 * Remplit la liste des services de raccourcissement.
 *
 * Le libellé de chaque option dit ce que le service change pour un usage
 * ordinaire — quelqu'un qui veut seulement un lien plus court n'a pas à
 * arbitrer entre quatre marques. TinyURL est proposé d'emblée et marqué
 * « recommandé » ; la note technique reste en infobulle.
 *
 * L'URL complète est transmise au service choisi : c'est une décision qui
 * appartient à l'utilisateur, donc rien n'est coché ni déclenché d'avance.
 */
function fillShorteners() {
  el.shortener.textContent = '';
  for (const shortener of SHORTENERS) {
    const option = document.createElement('option');
    option.value = shortener.id;
    const echec = servicesEnEchec.get(shortener.id);
    // Un service qui vient de ne pas répondre le dit, là où on le choisit.
    // L'option reste **sélectionnable** : une panne passagère ne doit pas
    // interdire de réessayer, et c'est le seul moyen de savoir si elle dure.
    option.textContent = echec
      ? t('{label} — n\'a pas répondu', { label: t(shortener.label) })
      : t(shortener.label);
    option.title = echec ? `${shortener.note} — ${echec.message}` : shortener.note;
    el.shortener.appendChild(option);
  }
}

/** Le service actuellement retenu. */
function currentShortener() {
  return findShortener(el.shortener.value) ?? SHORTENERS[0];
}

/** Rappelle ce que fait le bouton, et sur quels liens il portera. */
function updateShortenStatus(message = '') {
  const shortened = links.filter(hasShortUrl);
  el.shortenClear.hidden = shortened.length === 0;

  /**
   * La phrase de base : le message fourni, ou ce que le bouton fera.
   *
   * @returns {string}
   */
  const base = () => {
    if (message !== '') return message;
    if (links.length === 0) return '';
    const scope = selected.size > 0
      ? tpl(selected.size, '{count} lien coché', '{count} liens cochés')
      : t('toute la collection');
    const done = shortened.length > 0
      ? tpl(shortened.length, ' — {count} raccourci en place', ' — {count} raccourcis en place')
      : '';
    return t(
      "{label} · {scope}{done}. L'URL complète est transmise au service.",
      { label: t(currentShortener().label), scope, done },
    );
  };

  // Le service choisi a déjà échoué dans cette session : on le dit, et on
  // propose un autre — sans changer à sa place. Changer de service en silence
  // enverrait l'adresse à un tiers que l'utilisateur n'a pas choisi.
  //
  // Cette phrase s'ajoute **au message éventuel**, et ne le remplace pas : le
  // bilan du lot vient d'être écrit, et l'effacer priverait l'utilisateur de ce
  // qui vient de se passer.
  const echec = servicesEnEchec.get(currentShortener().id);
  if (echec) {
    const autre = suggestShortener(currentShortener().id, servicesEnEchec.keys());
    const phrase = autre
      ? t('{label} n\'a pas répondu à l\'instant : {message} Essayez {autre}.', {
        label: t(currentShortener().label), message: echec.message, autre: t(autre.label),
      })
      : t('{label} n\'a pas répondu à l\'instant : {message} Aucun autre service n\'est proposé.', {
        label: t(currentShortener().label), message: echec.message,
      });
    const avant = base();
    el.shortenStatus.textContent = avant === '' ? phrase : `${avant} ${phrase}`;
    return;
  }

  el.shortenStatus.textContent = base();
}

/**
 * Raccourcit les liens cochés — ou toute la collection si rien n'est coché.
 *
 * Rien n'est automatique : chaque clic est une action explicite, et le lot est
 * annulable. Les échecs sont consignés lien par lien plutôt que de faire
 * échouer l'ensemble.
 */
async function shortenSelection() {
  if (shortenJob) {
    // Un second clic annule le lot en cours.
    shortenJob.abort();
    return;
  }
  if (links.length === 0) return;

  const targets = selectedLinks().filter((link) => !hasShortUrl(link));
  if (targets.length === 0) {
    updateShortenStatus(t('Tous les liens visés sont déjà raccourcis.'));
    return;
  }

  const shortener = createShortener({ provider: el.shortener.value });
  const controller = new AbortController();
  shortenJob = controller;
  const serviceId = shortener.provider.id;

  el.shorten.disabled = false;
  el.shorten.textContent = t('Annuler');
  toast(t('Raccourcissement via {name}…', { name: shortener.provider.name }));

  try {
    const report = await shortener.shortenMany(targets, {
      signal: controller.signal,
      onProgress: (done, total) => {
        updateShortenStatus(t('{name} · {done}/{total}…', { name: shortener.provider.name, done, total }));
      },
    });

    // Chaque succès est écrit séparément : un lien raccourci ne doit jamais
    // pouvoir en écraser un autre, ni faire perdre l'URL d'origine.
    const now = Date.now();
    for (const item of report.ok) {
      const link = links.find((candidate) => candidate.id === item.id);
      if (!link) continue;
      await store.put({
        ...link,
        shortUrl: item.shortUrl,
        shortProvider: shortener.provider.id,
        shortenedAt: now,
      });
    }

    await refresh();

    // Ce qui accuse le **service** est retenu ; ce qui accuse le lien ne l'est
    // pas. « Ce lien est déjà court » n'apprend rien sur la santé du service, et
    // le marquer ferait écarter un service qui fonctionne.
    const fautes = report.failed.filter((item) => isServiceFailure(item.code));
    if (fautes.length > 0) {
      servicesEnEchec.set(serviceId, { message: fautes[0].message, at: Date.now() });
    } else if (report.ok.length > 0) {
      // Il a répondu : le marquage d'une panne précédente est levé.
      servicesEnEchec.delete(serviceId);
    }

    const summary = describeShortenReport(report);
    toast(summary, report.failed.length > 0 ? 'error' : 'info');
    fillShorteners();
    el.shortener.value = serviceId;
    updateShortenStatus(summary);
  } catch (error) {
    // Le lot entier a échoué : c'est le service, par construction.
    servicesEnEchec.set(serviceId, { message: error.message ?? t('raison inconnue'), at: Date.now() });
    fillShorteners();
    el.shortener.value = serviceId;
    toast(t('Raccourcissement impossible : {message}', { message: error.message }), 'error');
    updateShortenStatus();
  } finally {
    shortenJob = null;
    el.shorten.textContent = t('Raccourcir');
    el.shorten.disabled = links.length === 0;
    updateTargetAvailability();
  }
}

/**
 * Remplit le choix de la cible du QR Code.
 *
 * Deux possibilités seulement, et l'URL d'origine reste la valeur par défaut :
 * un lien raccourci dépend d'un tiers, ce n'est pas un choix à faire par
 * inadvertance.
 */
/** Remplit le choix de la date imprimée sous le QR Code. */
/** Rien à remplir : la date se coche, elle ne se choisit plus dans une liste. */
function fillDateModes() {}

/** Le mode de date retenu, et le texte à imprimer pour un lien. */
function dateMode() {
  // La date se coche dans chaque onglet : un réglage global pour quatre mises
  // en forme obligeait à le changer en passant de l'une à l'autre.
  //
  // Cocher « Avec l'heure » suffit : elle implique la date. Sans cela, cocher
  // la seule heure ne produisait rien du tout, sans que rien ne l'explique.
  if (el.sheetDateTime.checked) return 'datetime';
  if (el.sheetDate.checked) return 'date';
  return 'none';
}

/**
 * Le mode de date de l'export d'images, d'après ses propres cases.
 *
 * Avant, cet onglet retombait sur le réglage de la planche : une date cochée
 * pour la planche s'imprimait aussi dans les images, sans qu'on l'ait demandée.
 */
function exportDateMode() {
  if (el.exportDateTime.checked) return 'datetime';
  if (el.exportDate.checked) return 'date';
  return 'none';
}

/** Le mode de date du tableau imprimé, d'après ses propres cases. */
function tableDateMode() {
  // Même règle que la planche : « Avec l'heure » implique la date.
  if (el.tableColDateTime.checked) return 'datetime';
  if (el.tableColDate.checked) return 'date';
  return 'none';
}

/**
 * Explique ce que coûte la date demandée.
 *
 * Chaque ligne sous le QR Code se paie en place disponible : le dire évite de
 * croire que la date est gratuite.
 */
function updateDateHint() {
  const mode = dateMode();
  const parties = [];
  if (mode === 'none') {
    parties.push(t('Aucune date imprimée.'));
  } else {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const echantillon = mode === 'date'
      ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
      : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    parties.push(t('Date de collecte sur sa propre ligne — {sample}.', { sample: echantillon }));
  }
  if (el.sheetDateIndex.checked) parties.push(t('Le numéro du lien s\'imprime au-dessus du titre.'));
  parties.push(t('Chaque ligne de plus réduit la place du QR Code.'));
  el.sheetDateHint.textContent = parties.join(' ');
}

function fillTargets() {
  const choices = [
    { value: 'original', label: t("L'URL collectée") },
    { value: 'short', label: t('Le lien raccourci') },
  ];
  el.qrTarget.textContent = '';
  targetOptions.clear();
  for (const choice of choices) {
    const option = document.createElement('option');
    option.value = choice.value;
    option.textContent = choice.label;
    targetOptions.set(choice.value, option);
    el.qrTarget.appendChild(option);
  }
}

/**
 * Active ou non le choix « lien raccourci », et explique la conséquence.
 *
 * Raccourcir envoie l'URL complète à un tiers, et l'étiquette imprimée dépend
 * ensuite de la survie de ce tiers : le dire à l'endroit où l'on fait le choix
 * vaut mieux qu'une note de bas de page.
 */
function updateTargetAvailability() {
  const shortened = links.filter(hasShortUrl).length;
  const shortOption = targetOptions.get('short');
  if (shortOption) shortOption.disabled = shortened === 0;

  if (shortened === 0 && el.qrTarget.value === 'short') {
    el.qrTarget.value = 'original';
    settings.save({ targetMode: 'original' });
  }

  el.targetHint.textContent = shortened === 0
    ? t("Le QR Code encode l'URL collectée.")
    : tpl(
      shortened,
      '{count} lien raccourci : un QR Code plus court se scanne plus vite et tient sur une plus petite étiquette.',
      '{count} liens raccourcis : un QR Code plus court se scanne plus vite et tient sur une plus petite étiquette.',
    ) + ' ' + t("Ce choix vaut pour toute la collection ; chaque lien peut dire le contraire dans la liste.");
}

/** Retire les raccourcis : les URL d'origine n'ont jamais bougé. */
async function clearShortUrls() {
  const shortened = links.filter(hasShortUrl);
  if (shortened.length === 0) return;

  for (const link of shortened) {
    await store.put({ ...link, shortUrl: '', shortProvider: '', shortenedAt: 0 });
  }
  await refresh();
  toast(tpl(shortened.length, '{count} raccourci retiré', '{count} raccourcis retirés'));
}

// ---------------------------------------------------------------------------
// Aperçu papier
// ---------------------------------------------------------------------------

/** Configuration de la planche à partir du formulaire. */
/**
 * Écrit un nombre décimal à la française.
 *
 * Les cotes écrites à la main dans les libellés utilisent la virgule
 * (« 63,5 × 33,9 mm ») ; les valeurs calculées sortaient en anglais
 * (« 63.5 × 33.9 »). Deux écritures pour la même grandeur dans la même phrase,
 * c'est le genre de détail qui fait douter du reste.
 *
 * @param {number} value
 * @param {number} [digits]
 * @returns {string}
 */
function decimal(value, digits = 1) {
  if (!Number.isFinite(value)) return '—';
  const fixed = value.toFixed(digits).replace('.', ',');
  // « 29,0 mm » et « 0,40 mm » se lisent mal : on retire les zéros de fin,
  // sans jamais toucher aux entiers (« 260 » reste « 260 »).
  return fixed.includes(',') ? fixed.replace(/,?0+$/, '') : fixed;
}

/** Contraint un entier de formulaire entre deux bornes. */
/**
 * Borne de saisie des deux champs de grille.
 *
 * Elle n'existe que pour écarter un nombre non numérique ou délirant avant le
 * calcul : ce qui **tient** réellement est décidé par `clampGrid`, et c'est sa
 * réponse qui est réécrite dans le champ. Un plafond figé dans le balisage — 12
 * colonnes, 30 rangées — écrêtait la valeur avant que le calcul ne la voie, ce
 * qui produisait exactement le défaut signalé : le champ disait 40, l'aperçu en
 * dessinait 12, et rien ne le disait.
 */
const GRILLE_MAX_SAISIE = 999;

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

/**
 * Configuration de la planche.
 *
 * **Une seule présentation** : on choisit la grille (colonnes, rangées), les
 * marges et les écarts ; la taille des étiquettes en découle. Le choix de
 * planche ne fait que préremplir ces six valeurs.
 *
 * L'écran précédent proposait deux modes — « Cotes de la référence » et
 * « Colonnes et rangées » — et le premier **masquait les champs** : rien
 * n'indiquait alors comment la planche était remplie, ce qui le rendait
 * incompréhensible.
 *
 * Le décalage, lui, ne change jamais la grille : il ne fait que la déplacer,
 * pour rattraper l'entraînement d'une imprimante ou la marge asymétrique d'une
 * planche du commerce.
 *
 * @returns {object & { problem?: string }}
 */
function sheetConfig() {
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS['a4-3x8'];
  const page = PAGE_SIZES[preset.page];

  const config = {
    ...preset,
    qrSizeRatio: Number(el.sheetQr.value) / 100,
    offsetXMm: Number(el.sheetOffsetX.value) || 0,
    offsetYMm: Number(el.sheetOffsetY.value) || 0,
  };

  const demande = {
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    columns: clampInt(el.sheetColumns.value, 1, GRILLE_MAX_SAISIE, preset.declaredColumns),
    rows: clampInt(el.sheetRows.value, 1, GRILLE_MAX_SAISIE, preset.declaredRows),
    marginXMm: Math.max(0, Number(el.sheetMarginX.value) || 0),
    marginYMm: Math.max(0, Number(el.sheetMarginY.value) || 0),
    gapXMm: Math.max(0, Number(el.sheetGapX.value) || 0),
    gapYMm: Math.max(0, Number(el.sheetGapY.value) || 0),
  };

  // **La grille demandée est ramenée à ce qui tient**, au lieu d'être refusée en
  // gardant la disposition précédente. C'était le défaut : les champs disaient
  // une chose, l'aperçu une autre, le papier une troisième, et rien ne disait
  // laquelle. Le champ est réécrit à la sortie du champ de saisie, si bien que
  // les trois finissent par montrer la même grille.
  const garde = clampGrid(demande);
  if (garde.columns === 0 || garde.rows === 0) {
    return { ...config, problem: garde.reason, gridFix: garde };
  }

  const grid = fitGrid({
    ...demande,
    columns: garde.columns,
    rows: garde.rows,
  });

  if (!grid.ok) {
    // Filet, et non chemin courant : `clampGrid` rend une grille que `fitGrid`
    // accepte, et un test le vérifie sur un balayage de marges et d'écarts. On
    // préfère ce filet à une planche sans cotes, si la garantie venait à céder.
    return { ...config, problem: grid.reason, gridFix: garde };
  }

  return {
    ...config,
    columns: grid.columns,
    rows: grid.rows,
    labelWidthMm: grid.labelWidthMm,
    labelHeightMm: grid.labelHeightMm,
    marginXMm: grid.marginXMm,
    marginYMm: grid.marginYMm,
    gapXMm: demande.gapXMm,
    gapYMm: demande.gapYMm,
    gridFix: garde,
  };
}

/**
 * Ramène les deux champs de grille à ce qui tient, et l'explique sur place.
 *
 * Appelée à la **sortie** du champ, jamais à la frappe : réécrire un nombre
 * pendant qu'on le tape empêcherait d'entrer « 12 » sans passer par « 1 ». Une
 * fois la saisie finie, la valeur retenue remplace celle qui ne tenait pas, et
 * l'écran, l'aperçu et le papier ne montrent plus qu'une seule grille — c'est
 * exactement le défaut à corriger.
 *
 * Quand il ne reste aucune place, les champs ne sont pas touchés : mettre « 0 »
 * dans un champ qui accepte 1 au minimum serait une valeur impossible à
 * corriger à la main.
 */
function recadrerGrille() {
  if (!el.sheetGridHint) return;

  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS['a4-3x8'];
  const page = PAGE_SIZES[preset.page];
  const commun = demandeSansGrille(preset, page);

  // La grille **demandée**, retenue avant d'être ramenée à ce qui tient : c'est
  // elle que l'ajustement d'espacement doit faire tenir.
  const demande = {
    columns: clampInt(el.sheetColumns.value, 1, GRILLE_MAX_SAISIE, preset.declaredColumns),
    rows: clampInt(el.sheetRows.value, 1, GRILLE_MAX_SAISIE, preset.declaredRows),
  };
  derniereGrilleDemandee = demande;
  derniereGrilleDemandeeInitiale = demande;

  const garde = clampGrid({ ...commun, ...demande });

  // La borne haute des champs suit la feuille : le poussoir du champ et la
  // validation native du navigateur disent alors la même chose que le calcul,
  // au lieu de plafonner à 12 et 30 sur une A4 qui en accepte 26 et 56.
  const plafond = clampGrid({
    ...commun, columns: GRILLE_MAX_SAISIE, rows: GRILLE_MAX_SAISIE,
  });
  if (plafond.columns > 0) el.sheetColumns.max = String(plafond.columns);
  if (plafond.rows > 0) el.sheetRows.max = String(plafond.rows);

  derniereGrilleEcourtee = garde.clamped;

  if (!garde.clamped) {
    el.sheetGridHint.textContent = '';
    return;
  }

  if (garde.columns > 0 && garde.rows > 0) {
    el.sheetColumns.value = String(garde.columns);
    el.sheetRows.value = String(garde.rows);
  }
  el.sheetGridHint.textContent = garde.reason;
  // **Ranger plutôt que trancher.** Le bouton se montre au rendu, qui seul sait
  // si le contenu tient dans les étiquettes ; ici, on se contente de dire que la
  // grille a été ramenée.
}

/**
 * Range la planche pour que ce qu'on imprime tienne dans les étiquettes.
 *
 * Le plan vient de `planAjustement`, exactement comme le bouton qui l'annonce :
 * une seule décision, deux usages. Ce qui est fait est ensuite **dit**, chiffres
 * en main — un ajustement silencieux se confondrait avec une correction de
 * l'utilisateur, et personne ne saurait pourquoi les champs ont bougé.
 */
function ajusterEspacement() {
  const modules = derniersModules;
  const lignes = dernieresLignes;
  if (modules === null) return;

  const demandeInitiale = derniereGrilleDemandeeInitiale
    ?? derniereGrilleDemandee
    ?? { columns: 0, rows: 0 };
  const plan = planAjustement(modules, lignes);
  if (!plan) return;

  const poser = (champ, valeur) => {
    champ.value = String(valeur);
    champ.dispatchEvent(new Event('input', { bubbles: true }));
    champ.dispatchEvent(new Event('change', { bubbles: true }));
  };
  if (plan.kind === 'espacement') {
    poser(el.sheetGapX, plan.gapXMm);
    poser(el.sheetGapY, plan.gapYMm);
    poser(el.sheetMarginX, plan.marginXMm);
    poser(el.sheetMarginY, plan.marginYMm);
  }
  // La grille demandée revient : elle avait été ramenée à ce qui tenait, et
  // c'est justement ce qu'on veut défaire. Le plan qui descend la grille donne
  // ses propres colonnes et rangées.
  poser(el.sheetColumns, plan.columns);
  poser(el.sheetRows, plan.rows);

  derniereGrilleDemandee = { columns: plan.columns, rows: plan.rows };
  recadrerGrille();
  renderPreview();
  el.sheetGridHint.textContent = plan.kind === 'espacement'
    ? t('Écart {gap} mm et marge {margin} mm : les {columns} × {rows} tiennent sur la feuille.', {
      gap: decimal(plan.gapXMm),
      margin: decimal(plan.marginXMm),
      columns: plan.columns,
      rows: plan.rows,
    })
    : t('Les {asked} ne peuvent pas tenir sur une page : {columns} × {rows} à la place.', {
      asked: tpl(Math.max(demandeInitiale.columns, plan.columns),
        '{count} colonne', '{count} colonnes'),
      columns: plan.columns,
      rows: plan.rows,
    });
  el.sheetFit.hidden = true;
}

/**
 * Les réglages de la grille, hors colonnes et rangées.
 *
 * Extrait pour que la borne haute et le recadrage partent des mêmes chiffres :
 * deux lectures séparées finiraient par diverger, et la borne haute ne
 * correspondrait plus à ce que le recadrage autorise.
 *
 * @param {object} preset
 * @param {{ widthMm: number, heightMm: number }} page
 */
function demandeSansGrille(preset, page) {
  return {
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    marginXMm: Math.max(0, Number(el.sheetMarginX.value) || 0),
    marginYMm: Math.max(0, Number(el.sheetMarginY.value) || 0),
    gapXMm: Math.max(0, Number(el.sheetGapX.value) || 0),
    gapYMm: Math.max(0, Number(el.sheetGapY.value) || 0),
  };
}

/**
 * Recopie une disposition dans les six champs.
 *
 * La conversion vit dans `core/sheet.js` : c'est elle que les tests confrontent
 * aux cotes publiées, et une seconde formule ici finirait par en diverger.
 */
function prefillGridFields() {
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS['a4-3x8'];
  const grid = presetToGrid(preset, PAGE_SIZES[preset.page]);

  el.sheetColumns.value = String(grid.columns);
  el.sheetRows.value = String(grid.rows);
  el.sheetMarginX.value = String(grid.marginXMm);
  el.sheetMarginY.value = String(grid.marginYMm);
  el.sheetGapX.value = String(grid.gapXMm);
  el.sheetGapY.value = String(grid.gapYMm);

  // La taille du texte suit la hauteur de l'étiquette : 7 pt convenait à une
  // petite étiquette, pas à une A4 où la place restait inutilisée — le texte
  // sortait minuscule sous un QR Code qui occupait tout. Le champ reste modifiable.
  el.sheetFont.value = String(defaultSheetFontPt(preset, grid));
}

/**
 * Taille de texte par défaut pour une disposition, en points.
 *
 * Proportionnelle à la hauteur de l'étiquette : une étiquette deux fois plus
 * haute porte un texte deux fois plus grand. Bornée pour rester lisible et
 * laisser de la place au QR Code.
 *
 * @param {object} preset
 * @param {{ rows: number, marginYMm: number, gapYMm: number }} grid
 * @returns {number}
 */
function defaultSheetFontPt(preset, grid) {
  const page = PAGE_SIZES[preset.page];
  const rows = Math.max(1, grid.rows);
  const usable = page.heightMm - grid.marginYMm * 2 - grid.gapYMm * (rows - 1);
  const hauteur = usable / rows;
  const brut = hauteur * 0.28;
  const borne = Math.min(14, Math.max(7, brut));
  // Arrondi au demi-point : le pas du champ.
  return Math.round(borne * 2) / 2;
}

/**
 * Explique ce que les réglages produisent, chiffres en main.
 *
 * La phrase porte les dimensions obtenues, la grille, et le décalage s'il est
 * actif : un petit décalage ne se voit pas dans l'aperçu, et c'est exactement le
 * genre d'écart qu'on ne s'explique pas.
 *
 * @param {{ layout: object, offsetXMm: number, offsetYMm: number }} state
 */
function updateFitHint(state) {
  const { layout, offsetXMm, offsetYMm } = state;
  const size = `${decimal(layout.labelWidthMm)} × ${decimal(layout.labelHeightMm)} mm`;

  const parts = [
    t('Taille des étiquettes déduite de ces six valeurs : {size}, {columns} × {rows} par feuille.', {
      size,
      columns: layout.columns,
      rows: layout.rows,
    }),
  ];

  if (offsetXMm !== 0 || offsetYMm !== 0) {
    const moves = [];
    if (offsetXMm !== 0) {
      moves.push(t('{mm} mm vers la {direction}', {
        mm: decimal(Math.abs(offsetXMm)),
        direction: offsetXMm > 0 ? t('droite') : t('gauche'),
      }));
    }
    if (offsetYMm !== 0) {
      moves.push(t('{mm} mm vers le {direction}', {
        mm: decimal(Math.abs(offsetYMm)),
        direction: offsetYMm > 0 ? t('bas') : t('haut'),
      }));
    }
    parts.push(t('Décalage appliqué : {moves}.', { moves: moves.join(t(' et ')) }));
  }

  el.sheetFitHint.textContent = parts.join(' ');
}

/**
 * Taille du texte d'une étiquette de planche, en points.
 *
 * Elle était figée à 7 pt : sur une A4, la place disponible restait inutilisée
 * et le texte sortait minuscule. Une valeur hors bornes retombe sur le défaut
 * plutôt que de casser la mise en page.
 *
 * @returns {number}
 */
function sheetFontPt() {
  const typed = Number(el.sheetFont.value);
  if (!Number.isFinite(typed) || typed <= 0) return SHEET_FONT_PT;
  return Math.min(20, Math.max(4, typed));
}

/**
 * Construit les pages imprimables d'une planche.
 *
 * Les positions viennent de `computeSheet` en millimètres : la même structure
 * sert à l'écran (mise à l'échelle) et au papier (taille réelle).
 *
 * @param {import('./core/link.js').LinkRecord[]} items
 * @returns {HTMLElement[]}
 */
/**
 * Les réglages et le placement d'une planche, sans construire le DOM.
 *
 * Extrait pour que l'export retrouve **exactement** la disposition de l'aperçu.
 * Le CSV et le manifeste ont besoin du rang de chaque étiquette, et un élément
 * rendu ne le porte plus : le recalculer ailleurs aurait produit une seconde
 * formule, qui aurait fini par diverger de la première.
 *
 * @param {import('./core/link.js').LinkRecord[]} items
 */
function planchePlacement(items) {
  const config = sheetConfig();
  // Une grille issue de « remplir la feuille » occupe exactement la place
  // demandée : lui suggérer de resserrer les marges pour gagner une colonne
  // serait contredire le réglage de l'utilisateur.
  // La grille est toujours une consigne : on ne suggère pas de la densifier.
  const layout = computeSheet({ count: items.length, ...config, adviseDenser: false });
  return { config, layout, pages: paginate(items, layout) };
}

/**
 * Les feuilles de style réellement appliquées, mises bout à bout.
 *
 * C'est la feuille du document, et non une copie écrite pour l'export : la
 * géométrie d'une planche vit entièrement en CSS — positions absolues en
 * millimètres, centrage en boîte flexible — et la recopier aurait garanti qu'un
 * jour les deux divergent. Le fichier exporté ne peut pas être plus juste que
 * l'aperçu s'il ne partage pas ses règles.
 *
 * @returns {string}
 */
function feuillesAppliquees() {
  const morceaux = [];
  for (const feuille of document.styleSheets) {
    try {
      for (const regle of feuille.cssRules) morceaux.push(regle.cssText);
    } catch {
      // Feuille d'une autre origine, ou protégée : illisible. Les nôtres ne le
      // sont pas, et ce sont les seules qui portent sur ces pages.
    }
  }
  return morceaux.join('\n');
}

function buildSheetPages(items) {
  const { config, layout, pages } = planchePlacement(items);
  const metrics = sheetTextMetrics({ fontSizePt: sheetFontPt() });

  // Chaque URL est encodée une seule fois : sa taille de matrice sert au calcul
  // des bornes, puis la même matrice est rendue dans la cellule.
  const encoded = pages.map((page) => page.items.map(({ item, cell }) => ({
    item,
    cell,
    matrix: encodeQr(item.url, { ecc: 'M', border: 1 }),
  })));

  // Le curseur doit être valable pour toute la planche : on prend donc la
  // matrice la plus grande, c'est-à-dire l'URL la plus dense à imprimer. On
  // retient aussi laquelle, pour pouvoir la nommer si rien ne convient.
  const densest = encoded
    .flat()
    .reduce(
      (worst, entry) => (entry.matrix.size > worst.matrix.size ? entry : worst),
      { matrix: { size: 21 }, item: null },
    );
  const modules = densest.matrix.size;

  // Bornes calculées avant le rendu : en dessous, un module imprimé n'est plus
  // lisible ; au-dessus, le QR Code chasse le texte hors de l'étiquette.
  // La date occupe une ligne à part entière : elle doit être comptée dans la
  // place que le QR Code doit laisser, sinon le curseur autoriserait un réglage qui
  // la rogne.
  const wantsDate = dateMode() !== 'none';
  // Lues **avant** d'être utilisées : `const` lue plus haut lève une
  // `ReferenceError`, et `buildSheetPages` s'arrêtait là — la planche restait
  // vierge, sans message.
  const veutIndex = el.sheetDateIndex.checked;
  // Le numéro et la date occupent chacun une ligne à part entière, en plus du
  // texte principal. Ils doivent être comptés dans la place que le QR Code laisse,
  // sinon le curseur autoriserait un réglage qui les rogne.
  const indexLignes = veutIndex ? 1 : 0;
  const dateLignes = wantsDate ? 1 : 0;
  const lignesHorsTexte = indexLignes + dateLignes;

  /**
   * Bornes du QR Code pour un nombre de lignes de texte donné.
   *
   * Les bornes dépendent de la place que le texte réclame : c'est ce qui permet
   * de **réserver deux lignes** plutôt que de tronquer le titre. Une seule
   * ligne réservée donnait, dès 8 pt, « https://www.youtube.com/watch?v=jYI8-… ».
   */
  const bornesPourLignes = (lignesTexte) => qrRatioBounds({
    labelWidthMm: layout.labelWidthMm,
    labelHeightMm: layout.labelHeightMm,
    qrModules: modules,
    textLines: lignesTexte + lignesHorsTexte,
    marginMm: SHEET_CELL_MARGIN_MM,
    gapMm: SHEET_QR_GAP_MM,
    minModuleMm: MIN_MODULE_MM_PAPER,
    // La hauteur de ligne dépend de la taille du texte : une police plus grande
    // laisse moins de place au QR Code, et la borne haute doit en tenir compte.
    fontSizePt: sheetFontPt(),
  });

  /**
   * Ce qui s'imprime sous le QR Code.
   *
   * La décision vit dans `core/sheet.js`, où elle est testable sans navigateur.
   * Elle est appelée **deux fois** — pour compter les lignes réservées et pour
   * écrire le texte — et c'est la même fonction aux deux endroits : deux
   * expressions séparées auraient réservé un nombre de lignes qui ne
   * correspondait pas au texte réellement écrit.
   */
  const choixTexte = { title: el.sheetTitle.checked, url: el.sheetUrl.checked };
  const texteSousLeQr = (item) => sheetCellText(item, choixTexte);

  // Combien de lignes le texte le plus long réclame-t-il à cette taille ?
  const mesurePlanche = cachedTextMeasure(metrics.fontSizePx);
  const largeurInterieurePx =
    ((layout.labelWidthMm - SHEET_CELL_MARGIN_MM * 2) * 96) / 25.4;
  // Le compte part de **zéro**, et non de un : quand aucune ligne de texte n'est
  // demandée — ni titre, ni URL — réserver une ligne rétrécissait le QR Code
  // pour du vide. C'est précisément ce que l'utilisateur vient chercher en
  // décochant les deux cases.
  const lignesNecessaires = encoded.flat().reduce((plus, entree) => {
    const texte = texteSousLeQr(entree.item);
    return Math.max(plus, sheetCellLines(texte, {
      measure: mesurePlanche,
      innerWidthPx: largeurInterieurePx,
      maxLines: 99,
    }).length);
  }, 0);

  // Ce que le format peut réellement offrir : c'est `textLinesAtMin` qui le dit,
  // puisque le QR Code ne descend pas sous la taille où ses modules restent lisibles.
  // Au-delà, on tronque — mais seulement au-delà.
  const sondeLignes = bornesPourLignes(1);
  const lignesOffertes = Math.max(1, sondeLignes.textLinesAtMin - lignesHorsTexte);

  const bounds = bornesPourLignes(Math.min(lignesNecessaires, lignesOffertes));

  // Le curseur est borné par ce que l'impression permet réellement.
  applyQrSliderBounds(bounds);

  const ratio = Number(el.sheetQr.value) / 100;
  const side = qrSideMm(layout.labelWidthMm, layout.labelHeightMm, ratio);

  // Marge intérieure, écart et hauteur de ligne sont posés en ligne pour que le
  // rendu obéisse exactement au calcul — ici comme à l'impression.
  const innerWidthMm = layout.labelWidthMm - SHEET_CELL_MARGIN_MM * 2;
  const textSpaceMm = layout.labelHeightMm - SHEET_CELL_MARGIN_MM * 2
    - side - SHEET_QR_GAP_MM;
  // La tolérance n'est pas cosmétique : la borne du QR Code est arrondie au millième
  // par `qrRatioBounds`, et cet arrondi se propage jusqu'ici. Sans elle, une
  // place calculée pour deux lignes n'en donnait qu'une — 12,978 mm pour
  // 6,493 mm d'interligne vaut 1,9989, que `floor` ramenait à 1. Le texte était
  // alors tronqué pour un millième de millimètre.
  const maxLines = Math.max(1, Math.floor(textSpaceMm / metrics.lineHeightMm + 1e-3));
  const measure = cachedTextMeasure(metrics.fontSizePx);
  const innerWidthPx = (innerWidthMm * 96) / 25.4;
  /** Liens dont la date n'a pas pu être imprimée, faute de largeur. */
  const omittedDates = new Set();

  // Une planche Letter ne doit pas partir sur du A4 : la taille du papier est
  // posée ici, une fois pour toutes les sorties (aperçu, impression, Ctrl+P).
  applyPrintPageSize(layout.pageWidthMm, layout.pageHeightMm);

  updateFitHint({
    layout,
    offsetXMm: Number(el.sheetOffsetX.value) || 0,
    offsetYMm: Number(el.sheetOffsetY.value) || 0,
  });

  // L'en-tête de page vit dans la marge du haut : on vérifie qu'il y tient
  // avant de le dessiner. Le message est posé sous la case qui le demande, et
  // non à l'autre bout du panneau, comme pour la grille.
  const veutEnTete = el.sheetHeader.checked;
  const placeEnTete = sheetHeaderFits({ marginYMm: layout.marginYMm });
  if (el.sheetHeaderHint) {
    el.sheetHeaderHint.textContent = veutEnTete && !placeEnTete.fits ? placeEnTete.reason : '';
  }

  const warnings = [...layout.warnings];
  if (!bounds.fits) {
    // Nommer le lien fautif évite de chercher lequel, sur une planche de trente
    // étiquettes, demande trop de place.
    const culprit = densest.item
      ? t(' Le lien le plus dense est « {title} ».', { title: densest.item.title || densest.item.url })
      : '';
    warnings.push(bounds.reason + culprit);
  }
  if (config.problem) warnings.unshift(config.problem);

  updateQrInfo({ bounds, side, modules, ratio, maxLines, metrics, densest });

  // « Ranger plutôt que trancher » : le bouton n'apparaît que si quelque chose
  // ne tient pas — QR Code compris — et qu'un arrangement existe. Proposer
  // l'impossible, ou proposer quand tout va bien, serait du bruit.
  const lignesRetenues = Math.min(lignesNecessaires, lignesOffertes) + lignesHorsTexte;
  derniersModules = modules;
  dernieresLignes = lignesRetenues;
  const plan = bounds.fits && !derniereGrilleEcourtee
    ? null
    : planAjustement(modules, lignesRetenues);
  el.sheetFit.hidden = plan === null;

  // Les pages sont construites **avant** de composer le message : c'est la
  // construction qui découvre les dates écartées faute de largeur. Composer le
  // message plus tôt — ce qui était le cas — rendait cet avertissement
  // impossible à afficher.
  const built = pages.map((page) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'print-page';
    pageEl.style.width = `${layout.pageWidthMm}mm`;
    pageEl.style.height = `${layout.pageHeightMm}mm`;

    if (veutEnTete && placeEnTete.fits) {
      const entete = document.createElement('div');
      entete.className = 'print-page__header';
      entete.style.left = `${layout.marginXMm}mm`;
      entete.style.right = `${layout.marginXMm}mm`;
      entete.style.height = `${SHEET_HEADER_MM}mm`;

      const titre = document.createElement('h1');
      titre.className = 'print-page__title';
      titre.textContent = collectionName();
      if (el.sheetHeaderDate.checked) {
        const quand = document.createElement('span');
        quand.className = 'print-page__date';
        quand.textContent = formatCaptureDate(Date.now(), 'datetime');
        titre.appendChild(quand);
      }
      entete.appendChild(titre);
      // La note vient sous le nom : elle décrit la collection, c'est donc sa
      // place. Elle ne s'imprime que si elle existe **et** qu'on la demande :
      // elle était imposée dès qu'elle existait, ce qui mettait un texte écrit
      // pour soi sur chaque page d'une planche affichée.
      const note = collectionNote();
      if (note !== '' && el.sheetHeaderNote.checked) {
        const sous = document.createElement('p');
        sous.className = 'print-page__note';
        sous.textContent = note;
        entete.appendChild(sous);
      }
      pageEl.appendChild(entete);
    }

    for (const { item, cell, matrix } of encoded[page.page]) {
      const cellEl = document.createElement('div');
      cellEl.className = el.sheetBorder.checked
        ? 'print-cell print-cell--bordered'
        : 'print-cell';
      cellEl.style.left = `${cell.xMm}mm`;
      cellEl.style.top = `${cell.yMm}mm`;
      cellEl.style.width = `${layout.labelWidthMm}mm`;
      cellEl.style.height = `${layout.labelHeightMm}mm`;
      cellEl.style.padding = `${SHEET_CELL_MARGIN_MM}mm`;
      cellEl.style.gap = `${SHEET_QR_GAP_MM}mm`;

      const qrBox = document.createElement('div');
      qrBox.className = 'print-cell__qr';
      qrBox.style.width = `${side}mm`;
      qrBox.appendChild(qrSvg(matrix));

      cellEl.appendChild(qrBox);

      // Les lignes sont découpées et bornées ici : le texte occupe donc
      // exactement la hauteur réservée, au lieu de déborder en silence.
      // Une date se coupe mal : sur une ligne trop étroite, on ne l'imprime pas
      // plutôt que d'en perdre le millésime.
      const wanted = formatCaptureDate(item.createdAt, dateMode());
      const dateText = wanted !== '' && measure(wanted) <= innerWidthPx ? wanted : '';
      const dropped = wanted !== '' && dateText === '';

      const lines = sheetCellLines(texteSousLeQr(item), {
        measure,
        innerWidthPx,
        // Le numéro et la date prennent leur ligne : le texte principal se
        // contente de ce qui reste.
        maxLines: Math.max(1, maxLines - lignesHorsTexte),
      });
      // Le numéro occupe sa ligne, comme la date : il sert à retrouver le lien
      // dans la collection, donc à l'écran comme sur le papier.
      const rang = veutIndex ? linkRanks.get(item.id) : null;
      if (rang) lines.unshift(String(rang));
      if (dateText) lines.push(dateText);
      if (dropped) omittedDates.add(item.id);

      if (lines.length > 0) {
        const text = document.createElement('div');
        text.className = 'print-cell__text';
        // Taille et interligne viennent du même calcul que la découpe : c'est ce
        // qui garantit que la hauteur réelle est celle qui a été réservée.
        text.style.fontSize = `${metrics.fontSizePt}pt`;
        text.style.lineHeight = `${metrics.lineHeightMm}mm`;
        for (const line of lines) {
          const span = document.createElement('span');
          span.textContent = line;
          if (dateText && line === dateText) span.className = 'print-cell__date';
          text.appendChild(span);
        }
        cellEl.appendChild(text);
      }

      pageEl.appendChild(cellEl);
    }

    return pageEl;
  });

  if (omittedDates.size > 0) {
    warnings.push(tpl(
      omittedDates.size,
      'Date non imprimée sur {count} étiquette : elle ne tient pas sur une ligne à cette largeur.',
      'Date non imprimée sur {count} étiquettes : elle ne tient pas sur une ligne à cette largeur.',
    ));
  }

  el.sheetInfo.textContent = layout.perPage > 0
    ? t('{columns} × {rows} = {perPage} de {size} mm, {pages}', {
      columns: layout.columns,
      rows: layout.rows,
      perPage: tpl(layout.perPage, '{count} étiquette par page', '{count} étiquettes par page'),
      size: `${decimal(layout.labelWidthMm)} × ${decimal(layout.labelHeightMm)}`,
      pages: tpl(layout.pages, '{count} page', '{count} pages'),
    }) + (warnings.length ? ` — ${warnings.join(' ')}` : '')
    : layout.warnings.join(' ');

  return built;
}

/**
 * Applique au curseur les bornes calculées pour la planche courante.
 *
 * C'est le détrompeur demandé : le curseur ne peut plus demander un QR Code qui ne
 * serait pas imprimable. La valeur courante est ramenée dans l'intervalle si
 * elle en sortait — par exemple après un changement de disposition.
 *
 * @param {{ min: number, max: number }} bounds
 */
function applyQrSliderBounds(bounds) {
  const min = Math.round(bounds.min * 100);
  const max = Math.max(min, Math.round(bounds.max * 100));

  if (el.sheetQr.min !== String(min)) el.sheetQr.min = String(min);
  if (el.sheetQr.max !== String(max)) el.sheetQr.max = String(max);

  const current = Number(el.sheetQr.value);
  if (current < min) el.sheetQr.value = String(min);
  else if (current > max) el.sheetQr.value = String(max);
}

/**
 * Décrit la taille du QR Code retenue et ce qu'elle implique.
 *
 * @param {{ bounds: object, side: number, modules: number, ratio: number, maxLines: number, metrics: object }} state
 */
/**
 * La plus petite étiquette qui contienne ce qu'on imprime dessus.
 *
 * Le QR Code impose sa taille — ses modules fois le minimum lisible — et le
 * texte qu'on a demandé sous lui impose la sienne. C'est ce que l'ajustement
 * cherche à retrouver quand un espacement a trop rétréci les étiquettes.
 *
 * @param {number} modules - Cote de la matrice la plus dense de la planche.
 * @param {number} lignes - Lignes de texte sous le QR Code.
 * @returns {{ widthMm: number, heightMm: number, qrMm: number }}
 */
function tailleNecessaire(modules, lignes) {
  const { lineHeightMm } = sheetTextMetrics({ fontSizePt: sheetFontPt() });
  const qrMm = modules * MIN_MODULE_MM_PAPER;
  const texteMm = lignes > 0 ? SHEET_QR_GAP_MM + lignes * lineHeightMm : 0;
  return {
    widthMm: qrMm + SHEET_CELL_MARGIN_MM * 2,
    heightMm: qrMm + SHEET_CELL_MARGIN_MM * 2 + texteMm,
    qrMm,
  };
}

/**
 * Ce que l'ajustement ferait, ou `null` s'il n'y a rien à faire.
 *
 * Deux réponses, dans cet ordre :
 *
 * 1. **Garder la grille demandée** en resserrant l'écart et la marge — le même
 *    des deux côtés. C'est la réponse préférée : on ne change pas le nombre
 *    d'étiquettes par page.
 * 2. Si même sans espacement les étiquettes sont trop petites pour le contenu,
 *    **descendre la grille** jusqu'à ce que les étiquettes suffisent, et
 *    répartir l'espace restant également.
 *
 * @param {number} modules
 * @param {number} lignes
 * @returns {{
 *   kind: 'espacement'|'grille', columns: number, rows: number,
 *   gapXMm: number, gapYMm: number, marginXMm: number, marginYMm: number,
 * }|null}
 */
function planAjustement(modules, lignes) {
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS['a4-3x8'];
  const page = PAGE_SIZES[preset.page];
  const demande = derniereGrilleDemandee
    ?? { columns: preset.declaredColumns, rows: preset.declaredRows };
  const besoin = tailleNecessaire(modules, lignes);

  // 1. **L'espacement ramené à celui de la disposition**, en gardant la grille
  //    demandée : c'est la réponse préférée, parce qu'elle ne change pas le
  //    nombre d'étiquettes par page. Elle n'existe que si l'étiquette de la
  //    disposition — celle que l'utilisateur a sur son bureau — tient dans la
  //    grille demandée ; au-delà, aucune marge ne la fera tenir.
  const espace = spacingForGrid({
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    columns: demande.columns,
    rows: demande.rows,
    labelWidthMm: preset.labelWidthMm,
    labelHeightMm: preset.labelHeightMm,
  });
  if (espace.ok && espace.gapXMm <= (Number(el.sheetGapX.value) || 0) + 1e-9) {
    return {
      kind: 'espacement',
      columns: demande.columns,
      rows: demande.rows,
      gapXMm: espace.gapXMm, gapYMm: espace.gapYMm,
      marginXMm: espace.marginXMm, marginYMm: espace.marginYMm,
    };
  }

  // La grille demandée ne peut pas tenir, même sans espacement : on cherche la
  // plus grande qui contienne des étiquettes assez grandes. **L'espacement, lui,
  // ne bouge pas** : ce sont les étiquettes qui doivent grandir, et c'est en
  // retirant des colonnes ou des rangées qu'elles grandissent. Répartir en plus
  // l'espace libéré dans l'écart aurait redonné de petites étiquettes avec de
  // grandes marges — le contraire de ce qu'on cherche.
  const garde = clampGrid({
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    columns: demande.columns,
    rows: demande.rows,
    marginXMm: Number(el.sheetMarginX.value) || 0,
    marginYMm: Number(el.sheetMarginY.value) || 0,
    gapXMm: Number(el.sheetGapX.value) || 0,
    gapYMm: Number(el.sheetGapY.value) || 0,
    minLabelMm: Math.max(besoin.widthMm, besoin.heightMm),
  });
  if (garde.columns < 1 || garde.rows < 1) return null;
  if (garde.columns === demande.columns && garde.rows === demande.rows) return null;

  // L'espacement reste celui de l'utilisateur : le plan ne porte que la grille.
  return {
    kind: 'grille',
    columns: garde.columns,
    rows: garde.rows,
    gapXMm: null, gapYMm: null, marginXMm: null, marginYMm: null,
  };
}

function updateQrInfo(state) {
  const { bounds, side, modules, maxLines } = state;
  const moduleMm = side / modules;
  const marker = bounds.fits ? 'info' : 'error';

  if (marker === 'error') {
    el.sheetQrInfo.textContent = bounds.reason;
    el.sheetQrInfo.style.color = 'var(--danger)';
    return;
  }

  const range = t('{min} à {max} %', {
    min: Math.round(bounds.min * 100),
    max: Math.round(bounds.max * 100),
  });
  el.sheetQrInfo.textContent = t(
    'QR Code de {side} mm ({module} mm par module, minimum {minimum} mm) — réglable de {range} — {lines} de texte.',
    {
      side: decimal(side),
      module: decimal(moduleMm, 2),
      minimum: decimal(bounds.minModuleMm, 2),
      range,
      lines: tpl(maxLines, '{count} ligne', '{count} lignes'),
    },
  );
  el.sheetQrInfo.style.color = moduleMm < bounds.minModuleMm ? 'var(--danger)' : '';
}

/**
 * Les réglages de page du tableau imprimé.
 *
 * Le sens de la feuille et ses marges étaient fixes : un tableau large se
 * faisait rogner, et rien ne permettait de le rattraper.
 *
 * @returns {{ widthMm: number, heightMm: number, marginXMm: number, marginYMm: number, orientation: string }}
 */
function tablePageConfig() {
  const base = PAGE_SIZES.a4;
  const paysage = el.tableOrientation.value === 'landscape';
  const marginXMm = Math.max(0, Math.min(40, Number(el.tableMarginX.value) || 0));
  const marginYMm = Math.max(0, Math.min(40, Number(el.tableMarginY.value) || 0));

  return {
    orientation: paysage ? 'landscape' : 'portrait',
    // En paysage, la feuille est tournée : les deux cotes s'échangent.
    widthMm: paysage ? base.heightMm : base.widthMm,
    heightMm: paysage ? base.widthMm : base.heightMm,
    marginXMm,
    marginYMm,
  };
}

/**
 * Enveloppe le tableau dans sa page : marges, et titre de collection.
 *
 * @param {HTMLElement} table
 * @param {{ preview?: boolean }} [options]
 * @returns {HTMLElement}
 */
function buildTablePage(table, options = {}) {
  const config = tablePageConfig();
  const page = document.createElement('div');
  page.className = options.preview ? 'print-page print-page--screen' : 'print-page';
  page.style.width = `${config.widthMm}mm`;
  page.style.height = `${config.heightMm}mm`;
  page.style.padding = `${config.marginYMm}mm ${config.marginXMm}mm`;
  page.style.boxSizing = 'border-box';

  // Le nom de la collection en tête : sur une liasse imprimée, c'est ce qui
  // permet de retrouver de quoi il s'agit.
  if (el.tableTitle.checked) {
    const title = document.createElement('h1');
    title.className = 'print-page__title';
    title.textContent = collectionName();
    if (el.tableTitleDate.checked) {
      const quand = document.createElement('span');
      quand.className = 'print-page__date';
      quand.textContent = formatCaptureDate(Date.now(), 'datetime');
      title.appendChild(quand);
    }
    page.appendChild(title);
    // La note suit le nom, comme sur la planche : deux sorties qui décrivent la
    // même collection ne doivent pas en dire des choses différentes — y compris
    // pour la case qui l'autorise.
    const note = collectionNote();
    if (note !== '' && el.tableTitleNote.checked) {
      const sous = document.createElement('p');
      sous.className = 'print-page__note';
      sous.textContent = note;
      page.appendChild(sous);
    }
    // Le titre occupe une bande : le tableau se place dessous, sans le recouvrir.
    const spacer = document.createElement('div');
    spacer.className = 'print-page__spacer';
    page.appendChild(spacer);
  }

  page.appendChild(table);
  return page;
}

/**
 * Construit le tableau imprimable.
 * @param {import('./core/link.js').LinkRecord[]} items
 * @returns {HTMLElement}
 */
function buildTable(items) {
  const size = Number(el.tableQr.value);
  const columns = tableColumns();
  const withDate = columns.date;

  const table = document.createElement('table');
  table.className = 'print-table';
  if (!el.tableGrid.checked) table.classList.add('print-table--bare');

  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headers = [
    ...(columns.index ? ['N°'] : []),
    ...(columns.qr ? ['QR Code'] : []),
    ...(columns.url ? ['URL'] : []),
    ...(columns.title ? ['Titre'] : []),
    ...(withDate ? ['Date'] : []),
    ...(columns.tags ? ['Tags'] : []),
    ...(columns.note ? ['Note'] : []),
  ];
  for (const label of headers) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  }
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement('tbody');
  items.forEach((link) => {
    const row = document.createElement('tr');

    if (columns.index) {
      const num = document.createElement('td');
      // Le rang dans la collection, pas le rang dans le tableau : c'est ce qui
      // permet de retrouver le lien dans la liste.
      num.textContent = String(linkRanks.get(link.id) ?? '');
      row.appendChild(num);
    }

    if (columns.qr) {
      const qrCell = document.createElement('td');
      qrCell.className = 'print-table__qr';
      const svg = qrElement(link.url, { border: 1 });
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));
      qrCell.appendChild(svg);
      row.appendChild(qrCell);
    }

    if (columns.url) {
      const urlCell = document.createElement('td');
      urlCell.textContent = link.url;
      row.appendChild(urlCell);
    }

    if (columns.title) {
      const titleCell = document.createElement('td');
      titleCell.textContent = link.title;
      row.appendChild(titleCell);
    }

    if (withDate) {
      const dateCell = document.createElement('td');
      dateCell.textContent = formatCaptureDate(link.createdAt, tableDateMode());
      row.appendChild(dateCell);
    }

    if (columns.tags) {
      const tagsCell = document.createElement('td');
      tagsCell.textContent = link.tags.join(' ');
      row.appendChild(tagsCell);
    }

    if (columns.note) {
      const noteCell = document.createElement('td');
      noteCell.textContent = link.note;
      row.appendChild(noteCell);
    }

    body.appendChild(row);
  });

  table.appendChild(body);
  return table;
}

/** Les colonnes retenues pour le tableau imprimé. */
function tableColumns() {
  return {
    index: el.tableColIndex.checked,
    qr: el.tableColQr.checked,
    url: el.tableColUrl.checked,
    title: el.tableColTitle.checked,
    tags: el.tableColTags.checked,
    note: el.tableColNote.checked,
    // La date est une colonne comme les autres : elle se coche ici, et non dans
    // un réglage global qui valait pour les quatre mises en forme à la fois.
    // L'heure implique la date : la colonne apparaît dès que l'une des deux
    // cases est cochée, sinon cocher « Avec l'heure » seule ne montrerait rien.
    date: el.tableColDate.checked || el.tableColDateTime.checked,
  };
}

/** Vrai si au moins une colonne est demandée, date comprise. */
function hasAnyTableColumn() {
  return Object.values(tableColumns()).some(Boolean);
}

/**
 * Autorise ou non les colonnes « Tags » et « Note ».
 *
 * Une colonne qu'aucun lien ne peut remplir est proposée mais **inerte** : la
 * masquer laisserait croire que la fonction n'existe pas, et l'activer
 * produirait une colonne vide sur toute la page.
 */
function updateTableOptions() {
  const options = [
    { box: el.tableColTags, available: hasAnyTag(links), what: t('tag') },
    { box: el.tableColNote, available: hasAnyNote(links), what: t('note') },
  ];

  for (const { box, available, what } of options) {
    box.disabled = !available;
    if (!available) box.checked = false;
    const label = box.parentNode;
    if (label) {
      label.title = available
        ? t('Imprimer la colonne « {what} »', { what })
        : t("Aucun lien n'a de {what} : ajoutez-en un avec le bouton ✎ de la liste.", { what });
    }
  }

  el.tableHint.textContent = hasAnyNote(links) || hasAnyTag(links)
    ? t('Les tags et la note saisis dans la liste (bouton ✎) peuvent être imprimés ici.')
    : t('Ajoutez un tag ou une note depuis la liste (bouton ✎) pour pouvoir les imprimer.');
}

/**
 * La case « Avec la note de collection » n'a de sens que s'il y a une note.
 *
 * Même traitement que les colonnes « tag » et « note » du tableau : la case
 * reste visible — elle apprend que la note peut s'imprimer — mais elle est
 * inerte, et l'infobulle dit pourquoi. Son état, lui, n'est pas touché : le
 * décocher d'office effacerait un choix que l'utilisateur veut retrouver dès
 * qu'il aura écrit sa note.
 */
function updateHeaderNoteOptions() {
  const disponible = collectionNote() !== '';
  for (const box of [el.sheetHeaderNote, el.tableTitleNote]) {
    box.disabled = !disponible;
    const label = box.parentNode;
    if (label) {
      label.title = disponible
        ? t('Imprimer la note de collection sous le nom')
        : t("Écrivez d'abord la note de collection, dans le panneau de gauche.");
    }
  }
}

/** Redessine l'aperçu selon le mode actif. */
function renderPreview() {
  // La largeur utile de ce rendu, retenue pour que l'observateur de taille plus
  // bas sache si elle a changé.
  largeurApercuRendue = previewViewportWidth();

  const items = printableLinks().slice(0, 400);
  el.preview.textContent = '';
  el.print.disabled = items.length === 0;
  el.print.textContent = printLabel(items.length);
  // L'export du tableau suit la même portée que l'impression : la sélection et
  // les colonnes cochées. Sans colonne, il n'y a rien à exporter. Il ne se
  // montre que dans l'onglet Tableau, à côté d'« Imprimer ».
  el.exportTable.hidden = mode !== 'table';
  el.exportTable.disabled = items.length === 0 || !hasAnyTableColumn();
  // La planche a sa propre sortie, pour la même raison que le tableau : elle a
  // ses propres réglages, et c'est là qu'ils vivent.
  el.exportSheet.hidden = mode !== 'sheet';
  el.exportSheet.disabled = items.length === 0;
  // Niimbot et Étiquette (divers) ont leur propre bouton dans le panneau : la
  // rangée commune disparaît, sans laisser un blanc entre le mode et l'aperçu.
  el.panelActions.hidden = mode === 'single' || mode === 'images';

  if (mode === 'single') {
    el.print.hidden = true;
    // Le lien choisi dans l'onglet, pas le premier de la collection.
    renderSingleLabel(chosenLabelLink());
    return;
  }

  if (mode === 'images') {
    // L'export d'images ne passe pas par la boîte d'impression : il produit des
    // fichiers, utilisables avec n'importe quelle étiqueteuse.
    el.print.hidden = true;
    el.exportLabels.disabled = items.length === 0;
    // Le libellé dit la portée et le nombre, comme le bouton d'impression :
    // « Exporter les images » laissait croire à toute la collection.
    el.exportLabels.textContent = exportImagesLabel(items.length);
    renderImagePreview(items[0]);
    return;
  }

  el.print.hidden = false;

  if (items.length === 0) {
    // La phrase doit être là **avant** le premier lien : c'est au moment où l'on
    // règle la planche qu'on a besoin de la comprendre. La taille ne dépend pas
    // du nombre de liens, elle est donc exacte.
    updateFitHint({
      layout: computeSheet({ count: 1, ...sheetConfig(), adviseDenser: false }),
      offsetXMm: Number(el.sheetOffsetX.value) || 0,
      offsetYMm: Number(el.sheetOffsetY.value) || 0,
    });

    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = t('Ajoutez des liens pour voir un aperçu.');
    el.preview.appendChild(note);
    return;
  }

  if (mode === 'table') {
    if (!hasAnyTableColumn()) {
      // Un tableau sans aucune colonne n'a pas de sens : on le dit plutôt que
      // d'afficher un cadre vide.
      const note = document.createElement('p');
      note.className = 'hint';
      note.textContent = t('Aucune colonne sélectionnée : cochez au moins une colonne.');
      el.preview.appendChild(note);
      return;
    }
    el.preview.appendChild(scaleForScreen(buildTablePage(buildTable(items), { preview: true })));
    return;
  }

  // Planche : on affiche les deux premières pages, à l'échelle.
  for (const page of buildSheetPages(items).slice(0, 2)) {
    el.preview.appendChild(scaleForScreen(page));
  }
}

/**
 * Largeur utile de l'aperçu, en pixels.
 *
 * `clientWidth` inclut le rembourrage de `.preview` : on le retire pour obtenir
 * la place réellement offerte à une page. Un minimum fixe de 280 px faisait
 * déborder la page dès que le panneau était plus étroit que lui — fenêtre
 * rétrécie ou téléphone. Si la mesure est indisponible (DOM de substitution),
 * on retombe sur une valeur raisonnable.
 *
 * @returns {number}
 */
function previewViewportWidth() {
  const node = el.preview;
  const raw = Number(node?.clientWidth);
  if (!Number.isFinite(raw) || raw <= 0) return 320;

  let padX = 28;
  if (typeof getComputedStyle === 'function') {
    try {
      const styles = getComputedStyle(node);
      padX = (Number.parseFloat(styles.paddingLeft) || 0)
        + (Number.parseFloat(styles.paddingRight) || 0);
    } catch {
      // On garde le rembourrage par défaut.
    }
  }
  return Math.max(120, raw - padX);
}

/**
 * Met une page en millimètres à l'échelle de l'aperçu.
 * @param {HTMLElement} page
 * @returns {HTMLElement}
 */
function scaleForScreen(page) {
  const widthMm = Number.parseFloat(page.style.width);
  const heightMm = Number.parseFloat(page.style.height);
  const available = largeurUtileApercu();
  const tailleReelle = widthMm * PX_PER_MM;
  // **La place disponible fait l'échelle**, et le plafond est la taille réelle.
  //
  // Un plafond de 0,6 était appliqué ici : une A4 n'occupait donc jamais plus de
  // 476 px, quel que soit l'espace offert — 74 % du panneau sur un écran de
  // 1280 px, et moins encore au-delà. Sur un aperçu de tableau, dont le texte
  // fait 8 pt, cela donnait une page qu'on ne pouvait pas lire : c'était le
  // grief.
  //
  // La borne haute reste 1 : l'aperçu ne grossit pas la page au-delà de sa
  // taille physique. Au-delà, il n'apprend plus rien et fait croire à un
  // document plus grand qu'il n'est.
  const scale = Math.min(1, available / tailleReelle);

  const frame = document.createElement('div');
  frame.className = 'preview__frame';
  frame.style.width = `${widthMm * PX_PER_MM * scale}px`;
  frame.style.height = `${heightMm * PX_PER_MM * scale}px`;
  frame.style.overflow = 'hidden';

  // La page est mise à l'échelle **telle quelle**, sans être déballée : c'est
  // le même élément et les mêmes règles qu'à l'impression. La déballer, comme
  // on le faisait, perdait le positionnement des cellules et l'aperçu ne
  // montrait plus du tout la planche qui allait sortir.
  page.classList.add('print-page--screen');
  page.style.transform = `scale(${scale})`;
  page.style.transformOrigin = 'top left';

  frame.appendChild(page);
  return frame;
}

/**
 * Pose la taille de papier utilisée à l'impression.
 *
 * `@page` n'accepte pas de style en ligne : il faut une feuille de style. Sans
 * cela, une planche Letter serait posée sur du A4, donc réduite et décalée —
 * et aucune cote d'étiquette ne pourrait la rattraper.
 *
 * @param {number} widthMm
 * @param {number} heightMm
 */
function applyPrintPageSize(widthMm, heightMm) {
  let style = document.getElementById(PRINT_PAGE_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = PRINT_PAGE_STYLE_ID;
    (document.head ?? document.body).appendChild(style);
  }
  style.textContent = `@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`;
}

/**
 * Ce qui ferait disparaître un refus de longueur, dit à l'endroit du refus.
 *
 * Le refus est mesuré, pas deviné : le QR Code encode l'URL, et sa largeur est
 * celle de l'étiquette, moins les marges. Décocher les options de texte ne
 * change donc **rien** à sa largeur — ce que rien ne disait, et qu'on cherchait
 * pourtant de ce côté. Ce qui marche, en revanche :
 *
 * - un **raccourci** : c'est le remède direct, et l'application le propose déjà
 *   pour ce lien. On le vérifie en composant l'étiquette avec, au lieu de
 *   l'affirmer ;
 * - une **étiquette plus large** — seul recours quand l'URL n'a pas de raccourci
 *   et que la largeur est la contrainte ;
 * - **moins de texte**, mais uniquement quand c'est la hauteur qui manque. Le
 *   dire dans l'autre cas enverrait décocher des cases pour rien.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {object} profile
 * @param {object} geometry
 * @returns {string}
 */
function conseilPourPanneau(link, profile, geometry) {
  if (hasShortUrl(link)) {
    const essai = composeLabel({ ...link, useShort: true }, profile);
    if (essai.verdict.ok) {
      return t(' Ce lien a un raccourci : encodez-le à sa place, avec « Encoder le lien raccourci ».');
    }
  }
  // Le QR Code est plus large que l'étiquette : le texte n'y est pour rien.
  if (geometry.qrSize > geometry.width) {
    return t(
      " Le texte imprimé n'y change rien : c'est la largeur du QR Code qui dépasse celle de l'étiquette.",
    );
  }
  return t(
    ' La place manque en hauteur : décochez du texte sous le QR Code, ou prenez une étiquette plus longue.',
  );
}

/** Aperçu de l'étiquette destinée à l'imprimante Niimbot. */
function renderSingleLabel(link) {
  if (labelPreviewUrl) {
    URL.revokeObjectURL(labelPreviewUrl);
    labelPreviewUrl = null;
  }

  if (!link) {
    // Rien à imprimer : on le dit, sans verdict rouge. Un verdict de longueur
    // n'a de sens que pour une étiquette qui va sortir.
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = t(
      'Rien à imprimer : cochez au moins un lien dans la liste, ou choisissez « Toute la collection ».',
    );
    el.preview.appendChild(note);
    return;
  }

  // Le profil vient de l'imprimante quand il y en a une, sinon du format
  // choisi : on doit pouvoir juger un rendu avant d'acheter le matériel.
  const profile = previewProfile();
  const { geometry, content, verdict, dateOmitted, dateTropPetite, lateralRefused } =
    composeLabel(link, profile);
  // L'URL réellement encodée : le raccourci quand c'est lui qui est choisi.
  const cible = resolveTarget(link, el.qrTarget.value);

  const frame = document.createElement('div');
  frame.className = 'preview__page';
  frame.style.padding = '10px';

  // On compose à la taille réelle, puis on met à l'échelle pour l'écran : un
  // rendu agrandi par le navigateur interpolerait le QR Code et le rendrait flou.
  const source = document.createElement('canvas');
  source.width = geometry.width;
  source.height = geometry.height;

  const sourceCtx = source.getContext('2d');
  sourceCtx.imageSmoothingEnabled = false;
  drawLabel(sourceCtx, geometry, {
    titleLines: content.titleLines,
    showTitle: content.showTitle,
    url: cible.url,
    extraText: content.extraText,
  });

  // L'orientation est un réglage d'impression, mais rien ne la montrerait sans
  // imprimante connectée : on l'applique aussi à l'aperçu, avec exactement la
  // même fonction que l'envoi. L'aperçu montre donc ce qui sortira.
  const { turns } = labelRotation();
  const rotated = turns === 0 ? null : rotateCanvas(source, turns);
  const shown = rotated ?? source;

  const canvas = document.createElement('canvas');
  // L'échelle de l'aperçu est calculée dans le cœur, où elle est testable : elle
  // dépend de la tête, de la résolution et de la place disponible, et elle est
  // désormais bornée par un **multiple de la taille réelle** plutôt que par un
  // facteur de rendu. Plafonner à « 4 » donnait 8,5 × sur une tête de 203 ppp et
  // 2,2 × sur une tête de 300 ppp, sans que rien ne relie le chiffre au résultat.
  const available = Math.max(1, largeurUtileApercu() - 20);
  const echelle = labelPreviewZoom({
    widthPx: shown.width,
    dpi: profile.dpi,
    availablePx: available,
    realSize: el.labelRealSize.checked,
  });
  const zoom = echelle.zoom;
  const displayWidth = Math.max(1, Math.round(shown.width * zoom));
  const displayHeight = Math.max(1, Math.round(shown.height * zoom));
  canvas.width = displayWidth;
  canvas.height = displayHeight;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.imageRendering = zoom < 1 ? 'auto' : 'pixelated';

  const ctx = canvas.getContext('2d');
  // À la réduction, un lissage garde le QR Code lisible ; à l'agrandissement, le plus
  // proche voisin conserve les modules nets.
  ctx.imageSmoothingEnabled = zoom < 1;
  ctx.drawImage(shown, 0, 0, displayWidth, displayHeight);

  frame.appendChild(canvas);

  const caption = document.createElement('p');
  caption.className = 'hint';
  // `composeLabel` sait si la date a été écartée : on le dit, plutôt que de
  // laisser croire que l'option n'a pas d'effet.
  const dateNote = dateTropPetite
    ? t(' — date non imprimée : elle exigerait un texte trop petit pour être lu.')
    : (dateOmitted ? composeDateNote() : '');
  // La taille réellement retenue peut différer de celle demandée : la géométrie
  // réduit plutôt que de tronquer. On le dit, sinon le réglage semble sans effet.
  const tailleObtenue = pxToMm(geometry.fontSize, profile.dpi).toFixed(1);
  el.labelFontHint.textContent = t('Texte de {size} mm de haut, {lines} de texte.', {
    size: tailleObtenue,
    lines: tpl(geometry.lines.length + (content.titleLines?.length ?? 0), '{count} ligne', '{count} lignes'),
  });
  const orientationNote = lateralRefused
    ? t(' — texte empilé : le QR Code laisse trop peu de largeur pour une colonne de texte.')
    : (turns === 0 ? '' : t(' — orientation : {label}', { label: t(labelRotation().label) }));
  // L'échelle est **dite**. C'est le défaut d'origine : l'aperçu agrandissait
  // huit fois et demi sans l'annoncer, et rien ne permettait de s'en apercevoir.
  const largeurMm = pxToMm(geometry.width, profile.dpi).toFixed(1);
  const hauteurMm = pxToMm(geometry.height, profile.dpi).toFixed(1);
  const echelleNote = echelle.multiple > 1.05
    ? t(' — aperçu à {multiple} × la taille réelle ({width} × {height} mm).', {
      multiple: echelle.multiple.toFixed(1),
      width: largeurMm,
      height: hauteurMm,
    })
    : t(' — aperçu à la taille réelle ({width} × {height} mm).', {
      width: largeurMm,
      height: hauteurMm,
    });

  // Un verdict porte toujours sur **une** étiquette : quand la portée en couvre
  // plusieurs, on nomme celle qui est en cause. Sans le nom, le message
  // ressemblerait à un jugement sur toute l'impression.
  //
  // Et il dit **ce qui le ferait disparaître**. Le refus est juste — le QR Code
  // encode l'URL, et c'est sa largeur qui décide — mais rien ne l'expliquait, si
  // bien qu'on cherchait le coupable du côté des options de texte, qui n'y
  // peuvent rien : les décocher ne change pas la taille du QR Code.
  const conseil = verdict.ok ? '' : conseilPourPanneau(link, profile, geometry);
  const nommer = impressionChoisie().kind !== 'one';
  caption.textContent = (verdict.ok
    ? t('{profile} — {width} × {height} px, {px} px par module', {
      profile: profile.id,
      width: geometry.width,
      height: geometry.height,
      px: decimal(verdict.pxPerModule),
    })
    : (nommer
      ? t('{profile} — « {title} » : {reason}', {
        profile: profile.id,
        title: link.title || hostOf(link.url) || link.url,
        reason: t(verdict.reason),
      })
      : t('{profile} — {reason}', { profile: profile.id, reason: t(verdict.reason) })))
    + conseil
    + orientationNote + dateNote + echelleNote;
  if (!verdict.ok) caption.style.color = 'var(--danger)';
  frame.appendChild(caption);

  el.preview.appendChild(frame);
  updateProfileHint();
}

// ---------------------------------------------------------------------------
// Composition d'étiquette
// ---------------------------------------------------------------------------

/**
 * Compose l'étiquette d'un lien pour un profil d'imprimante.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {{ geometry: object, verdict: object }}
 */
function composeLabel(link, profile) {
  // Le QR Code encode la cible choisie — l'URL collectée ou son raccourci. Sans
  // cette résolution, l'étiquette ignorait le réglage : la liste affichait un
  // tinyurl que le QR Code n'encodait pas et que le texte n'imprimait pas non plus.
  const target = resolveTarget(link, el.qrTarget.value);

  // Avec l'heure quand la place le permet : sur une étiquette étroite, la date
  // seule tient là où « date et heure » devrait céder une ligne.
  // La date seule par défaut : c'est ce qui tient sur une tête de 12 mm.
  const wanted = formatCaptureDate(link.createdAt, el.labelDateTime.checked ? 'datetime' : 'date');
  const lengthPx = labelLengthPx(profile);
  const alignment = el.labelAlignment.value || DEFAULT_LABEL_ALIGNMENT;
  // La taille de police demandée, en pixels pour ce profil. Zéro laisse la
  // géométrie choisir : c'est le repli quand le champ est vidé.
  const tailleMm = Number(el.labelFontSize.value);
  const fontSize = Number.isFinite(tailleMm) && tailleMm > 0
    ? Math.max(6, Math.round((tailleMm / 25.4) * profile.dpi))
    : undefined;

  // `drawLabel` écrit la date sur une seule ligne, sans la découper : on vérifie
  // d'abord qu'elle tient, à la taille de police que la géométrie va retenir.
  // Un premier calcul sans ligne réservée donne cette taille.
  // Le QR Code encode toujours l'URL du lien ; le texte imprimé, lui, suit le mode
  // choisi. Le mode « QR Code seul » n'a donc aucun texte à mesurer, d'où la sonde
  // sur l'URL : c'est la matrice la plus large qui décide de l'échelle.
  const probe = computeLabelGeometry({
    text: target.url,
    qrText: target.url,
    widthPx: profile.printheadPixels,
    dpi: profile.dpi,
    ecc: 'M',
    maxHeightPx: lengthPx,
    alignment,
    fontSize,
    // La géométrie découpe le texte à la taille qu'elle retient : la fabrique de
    // mesure reçoit donc cette taille. Une mesure figée servait à découper pour
    // toutes les tailles essayées, et le texte débordait de l'étiquette.
    measureFactory: cachedTextMeasure,
  });

  // La date est découpée à la largeur utile, à la taille de police de la sonde.
  // Une date complète sur deux lignes vaut mieux qu'aucune date : c'est ce qui
  // rendait le réglage inopérant sur une tête de 12 mm.
  // La date est une option de l'étiquette, pas un réglage global : elle se
  // coche ici, avec sa précision. La faire dépendre du réglage « Date sous le
  // QR Code » des planches rendait la case sans effet tant qu'on n'y touchait
  // pas, ce qui se lisait comme un défaut.
  // « Avec l'heure » implique la date, comme dans les autres onglets.
  const wantsDate = el.labelShowDate.checked || el.labelDateTime.checked;
  const largeurDate = probe.width - probe.padding * 2;

  // La date est écrite d'un bloc ou pas du tout : à la taille de police par
  // défaut, elle ne tenait pas sur une tête de 12 mm et disparaissait sans
  // explication. On réduit donc la police du texte juste assez pour qu'elle
  // entre — la date est une information courte, mieux vaut un texte un peu
  // plus petit que pas de date du tout.
  const plancherDate = Math.max(
    MIN_FONT_PX,
    Math.round((MIN_TEXT_MM / 25.4) * profile.dpi),
  );
  const tailleDate = wantsDate && wanted !== ''
    ? fontSizeForDate(cachedTextMeasure, wanted, largeurDate, plancherDate, DATE_LINES_MAX)
    : 0;
  const dateLines = tailleDate > 0
    ? wrapDate(cachedTextMeasure(tailleDate), wanted, largeurDate, DATE_LINES_MAX)
    : [];
  // Une date qui exige une police sous le plancher de lisibilité n'est pas
  // imprimée : « 15/09/2026 21:07 » demandait 1,1 mm sur une tête de 12 mm.
  // Mieux vaut pas de date qu'une date illisible, et on le dit.
  const dateTropPetite = wantsDate && wanted !== '' && tailleDate === 0;

  // Le titre se découpe à la largeur utile, comme l'URL : réservé sur une seule
  // ligne puis écrit sans découpe, un titre long débordait de l'étiquette.
  const largeurUtile = probe.width - probe.padding * 2;
  const titreVoulu = el.labelShowTitle.checked
    && typeof link.title === 'string' && link.title.trim() !== ''
    ? link.title.trim()
    : '';
  const titleLines = titreVoulu === ''
    ? []
    : wrapText(cachedTextMeasure(probe.fontSize), titreVoulu, largeurUtile, { maxLines: 2 });

  // Le contenu se compose de choix indépendants, qui se cumulent.
  const content = labelContentFromChoices(target, {
    index: linkRanks.get(link.id) ?? null,
    indexVisible: el.labelShowIndex.checked,
    title: el.labelShowTitle.checked,
    titleLines,
    url: el.labelShowUrl.checked,
    host: el.labelShowHost.checked,
    dateLines,
  });

  let geometry = computeLabelGeometry({
    text: content.text,
    qrText: target.url,
    widthPx: profile.printheadPixels,
    dpi: profile.dpi,
    ecc: 'M',
    extraLines: content.extraLines,
    maxHeightPx: lengthPx,
    alignment,
    // La date impose sa taille : elle est écrite d'un bloc, sans découpage.
    fontSize: tailleDate > 0 && fontSize !== undefined
      ? Math.min(fontSize, tailleDate)
      : (tailleDate > 0 ? tailleDate : fontSize),
    measureFactory: cachedTextMeasure,
    // « Texte au-dessus » se décide à la composition : le texte précède le QR Code.
    textFirst: labelLayout().textFirst === true,
  });

  // La disposition suit l'orientation choisie. Le texte n'est jamais tourné
  // avec l'image : il est soit droit, soit tourné sur lui-même — deux façons
  // d'obtenir un texte lisible selon la forme du support.
  let lateralRefused = false;
  const disposition = labelLayout();

  if (disposition.mode === 'lateral') {
    const lateral = layoutLabelLateral(geometry, {
      measure: cachedTextMeasure(geometry.fontSize),
      text: content.text,
      maxLines: 4,
      gap: geometry.padding,
    });
    // Une URL dense occupe tant de modules qu'il ne reste pas de colonne pour
    // le texte : l'empilement reprend alors la main, et on le dit.
    lateralRefused = lateral.lateral !== true;
    geometry = lateralRefused ? geometry : lateral;
  } else if (disposition.mode === 'rotated') {
    geometry = layoutLabelRotated(geometry, {
      measure: cachedTextMeasure(geometry.fontSize),
      measureFactory: cachedTextMeasure,
      // Le plancher de lisibilité se convertit en pixels avec la résolution.
      dpi: profile.dpi,
      // Le sens de rotation est une donnée de la disposition, pas du rendu :
      // la géométrie le transporte jusqu'au dessin.
      sens: disposition.sens,
      text: content.text,
      // Le titre fait partie de la bande : sans lui, il n'était pas réservé et
      // ne s'imprimait pas du tout dans cette disposition.
      titleLines: content.titleLines,
      gap: geometry.padding,
    });
  }

  return {
    geometry,
    content,
    verdict: checkQrLegibility(geometry),
    dateLines,
    dateOmitted: wantsDate && wanted !== '' && dateLines.length === 0,
    dateTropPetite,
    lateralRefused,
  };
}

/**
 * Longueur d'étiquette en pixels, telle que saisie dans le panneau Niimbot.
 *
 * Zéro signifie « longueur libre » : le rouleau continu n'a pas de pas, et une
 * longueur inventée ferait pire que bien. La valeur est bornée par la fenêtre
 * d'impression du profil, faute de quoi l'imprimante s'arrêterait avant la fin.
 *
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {number}
 */
function labelLengthPx(profile) {
  // C'est le consommable qui porte la longueur : c'est le rouleau qui est
  // chargé, pas une valeur saisie à côté — et un rouleau 12 × 30 impose 30 mm.
  // Le rouleau continu, lui, n'a pas de pas connu : zéro laisse la composition
  // s'ajuster au contenu, seule chose possible sans deviner.
  const supply = chosenSupply();
  const mm = supply?.lengthMm ?? null;

  if (!Number.isFinite(mm) || mm <= 0) return 0;
  return Math.round((Math.min(mm, profile.maxPrintHeightMm) / 25.4) * profile.dpi);
}

/**
 * Rend l'étiquette d'un lien en bitmap monochrome.
 * @param {import('./core/link.js').LinkRecord} link
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {{ bitmap: object, verdict: object }}
 */
function labelToBitmap(link, profile) {
  const { geometry, content, verdict } = composeLabel(link, profile);

  const canvas = document.createElement('canvas');
  canvas.width = geometry.width;
  canvas.height = geometry.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  drawLabel(ctx, geometry, {
    titleLines: content.titleLines,
    showTitle: content.showTitle,
    url: link.url,
    extraText: content.extraText,
  });

  const imageData = ctx.getImageData(0, 0, geometry.width, geometry.height);
  const bitmap = imageDataToMono(imageData, { threshold: 128 });

  // L'orientation choisie s'applique au moment de l'envoi, pas à la
  // composition : l'aperçu montre l'étiquette telle qu'elle est dessinée.
  const { turns } = labelRotation();
  return { bitmap: turns === 0 ? bitmap : rotateBitmap(bitmap, turns), verdict, geometry };
}

// ---------------------------------------------------------------------------
// Export d'images d'étiquettes
// ---------------------------------------------------------------------------

/**
 * Construit une fonction de mesure du texte, adossée à un canvas.
 *
 * On ne peut pas planifier sans connaître la largeur réelle des caractères :
 * une approximation ferait déborder les URL longues. Le canvas hors écran est
 * créé une fois, puis réutilisé pour toutes les étiquettes.
 *
 * @param {number} fontSizePx
 * @returns {(text: string) => number}
 */
function createTextMeasure(fontSizePx) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontFamily = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif';
  ctx.font = `${fontSizePx}px ${fontFamily}`;
  return (text) => ctx.measureText(text).width;
}

/** Mesures de texte réutilisées d'un rendu à l'autre, par taille de police. */
const textMeasureCache = new Map();

/**
 * Mesure de texte pour une taille de police donnée, mémoïsée.
 *
 * `buildSheetPages` est rappelé à chaque déplacement du curseur : recréer un
 * canvas à chaque fois serait du gaspillage pur.
 *
 * @param {number} fontSizePx
 * @returns {(text: string) => number}
 */
function cachedTextMeasure(fontSizePx) {
  const key = String(fontSizePx);
  if (!textMeasureCache.has(key)) textMeasureCache.set(key, createTextMeasure(fontSizePx));
  return textMeasureCache.get(key);
}

/**
 * Lit les préférences de mise en page du formulaire.
 * @returns {{ format: object, textMode: string, showTitle: boolean, dateMode: string, marginMm: number, fontSizePt: number, cutMarks: boolean }}
 */
function readLabelOptions() {
  return {
    format: findFormat(el.labelFormat.value),
    textMode: el.labelText.value,
    showTitle: el.exportTitle.checked,
    dateMode: exportDateMode(),
    marginMm: Math.max(0, Number(el.labelMargin.value) || 0),
    fontSizePt: Math.max(4, Number(el.labelFont.value) || 7),
    cutMarks: el.labelCut.checked,
  };
}

/**
 * Dessine une étiquette dans un contexte 2D.
 *
 * Le rendu se fait par plus proche voisin : un QR Code lissé devient illisible.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} plan
 * @param {string} url
 * @param {{ cutMarks?: boolean }} [options]
 */
function drawLabelCanvas(ctx, plan, url, options = {}) {
  const fontFamily = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, plan.widthPx, plan.heightPx);

  // QR Code, centré horizontalement.
  const matrix = encodeQr(url, { ecc: 'M', border: 2 });
  const x0 = Math.floor((plan.widthPx - plan.qrSizePx) / 2);
  ctx.fillStyle = '#000000';
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.data[y][x]) continue;
      ctx.fillRect(
        x0 + x * plan.qrScale,
        plan.marginPx + y * plan.qrScale,
        plan.qrScale,
        plan.qrScale,
      );
    }
  }

  // Textes, centrés.
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${plan.fontSizePx}px ${fontFamily}`;
  plan.lines.forEach((line, index) => {
    ctx.fillText(
      line,
      plan.widthPx / 2,
      plan.textTopPx + index * plan.lineHeightPx,
      plan.widthPx - plan.marginPx * 2,
    );
  });

  if (options.cutMarks) {
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = Math.max(1, Math.round(plan.widthPx / 200));
    ctx.strokeRect(0.5, 0.5, plan.widthPx - 1, plan.heightPx - 1);
  }
}

/**
 * Rend une étiquette en PNG.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {object} options
 * @returns {Promise<{ png: Uint8Array, plan: object }>}
 */
async function renderLabelPng(link, options) {
  const fontSizePx = Math.max(6, ptToPx(options.fontSizePt, options.format.dpi));
  const plan = planLabel({
    link,
    format: options.format,
    measure: createTextMeasure(fontSizePx),
    textMode: options.textMode,
    showTitle: options.showTitle,
    // Sans cette ligne, la date choisie dans l'interface était silencieusement
    // ignorée : les réglages consignés la mentionnaient, mais ni l'aperçu ni
    // les images ne la portaient.
    dateMode: options.dateMode,
    marginMm: options.marginMm,
    fontSizePt: options.fontSizePt,
  });

  const canvas = document.createElement('canvas');
  canvas.width = plan.widthPx;
  canvas.height = plan.heightPx;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawLabelCanvas(ctx, plan, link.url, { cutMarks: options.cutMarks });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error(t('Le navigateur n\'a pas pu encoder l\'image.'));
  return { png: new Uint8Array(await blob.arrayBuffer()), plan };
}

/** Aperçu de la première étiquette sélectionnée. */
function renderImagePreview(link) {
  if (!link) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = t('Ajoutez des liens pour voir un aperçu.');
    el.preview.appendChild(note);
    return;
  }

  const options = readLabelOptions();
  const fontSizePx = Math.max(6, ptToPx(options.fontSizePt, options.format.dpi));
  const plan = planLabel({
    link,
    format: options.format,
    measure: createTextMeasure(fontSizePx),
    textMode: options.textMode,
    showTitle: options.showTitle,
    // Sans cette ligne, la date choisie dans l'interface était silencieusement
    // ignorée : les réglages consignés la mentionnaient, mais ni l'aperçu ni
    // les images ne la portaient.
    dateMode: options.dateMode,
    marginMm: options.marginMm,
    fontSizePt: options.fontSizePt,
  });

  const canvas = document.createElement('canvas');
  canvas.width = plan.widthPx;
  canvas.height = plan.heightPx;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawLabelCanvas(ctx, plan, link.url, { cutMarks: options.cutMarks });

  // La même échelle que l'onglet Niimbot, calculée au même endroit : bornée par
  // un **multiple de la taille réelle** et annoncée. Un plafond de « 6 » donnait
  // six fois la taille réelle sans le dire — le défaut même qu'on avait corrigé
  // d'un côté et laissé de l'autre.
  const available = Math.max(1, largeurUtileApercu() - 20);
  const echelle = labelPreviewZoom({
    widthPx: plan.widthPx,
    dpi: options.format.dpi,
    availablePx: available,
    realSize: el.exportRealSize.checked,
  });
  const scale = echelle.zoom;

  const frame = document.createElement('div');
  frame.className = 'preview__page';
  frame.style.padding = '10px';

  const shown = canvas;
  shown.style.width = `${Math.round(plan.widthPx * scale)}px`;
  shown.style.height = `${Math.round(plan.heightPx * scale)}px`;
  shown.style.imageRendering = scale < 1 ? 'auto' : 'pixelated';
  frame.appendChild(shown);

  const largeurMm = options.format.widthMm.toFixed(1);
  const hauteurMm = pxToMm(plan.heightPx, options.format.dpi).toFixed(1);
  const echelleNote = echelle.multiple > 1.05
    ? t(' — aperçu à {multiple} × la taille réelle ({width} × {height} mm).', {
      multiple: echelle.multiple.toFixed(1),
      width: largeurMm,
      height: hauteurMm,
    })
    : t(' — aperçu à la taille réelle ({width} × {height} mm).', {
      width: largeurMm,
      height: hauteurMm,
    });

  const caption = document.createElement('p');
  caption.className = 'hint';
  caption.textContent = (plan.fits
    ? t('{width} mm × {height} px — {widthPx} × {heightPx} px à {dpi} dpi', {
      width: options.format.widthMm,
      height: plan.heightPx,
      widthPx: plan.widthPx,
      heightPx: plan.heightPx,
      dpi: options.format.dpi,
    })
    : t('URL trop longue pour ce format : le QR Code fait {size} px pour {width} px de large.', {
      size: plan.qrSizePx,
      width: plan.widthPx,
    })) + echelleNote
    + (plan.dateOmitted
      ? t(' — date non imprimée : elle ne tient pas sur ce format, réduisez la taille du texte.')
      : '');
  if (!plan.fits) caption.style.color = 'var(--danger)';
  frame.appendChild(caption);

  el.preview.appendChild(frame);
}

/** Exporte le dossier d'images prêt à imprimer. */
async function exportLabelImages() {
  const items = printableLinks();
  if (items.length === 0) return;

  const options = readLabelOptions();
  el.exportLabels.disabled = true;

  try {
    const planned = planLabels(items, {
      format: options.format,
      textMode: options.textMode,
      showTitle: options.showTitle,
      dateMode: options.dateMode,
      marginMm: options.marginMm,
      fontSizePt: options.fontSizePt,
      measure: createTextMeasure(
        Math.max(6, ptToPx(options.fontSizePt, options.format.dpi)),
      ),
    });

    const images = new Map();
    for (const [index, entry] of planned.entries()) {
      el.exportLabels.textContent = t('Étiquette {index}/{total}…', {
        index: index + 1,
        total: planned.length,
      });
      const { png } = await renderLabelPng(entry.link, options);
      images.set(entry.fileName, png);
    }

    el.exportLabels.textContent = t('Assemblage…');
    const name = collectionName();
    const archive = buildLabelArchive({
      planned,
      images,
      settings: { ...options, title: name },
    });

    const filename = labelArchiveName(Date.now(), name);
    const ok = downloadBytes(filename, archive, { mime: 'application/zip' });
    toast(
      ok
        ? tpl(
          planned.length,
          '{count} étiquette — {filename} enregistré',
          '{count} étiquettes — {filename} enregistré',
          { filename },
        )
        : t('Téléchargement impossible'),
      ok ? 'info' : 'error',
    );
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    // Le libellé de repos est recalculé, et non restauré : la portée et le
    // nombre restent ceux de la collection au moment où l'on regarde.
    el.exportLabels.textContent = exportImagesLabel(items.length);
    el.exportLabels.disabled = items.length === 0;
  }
}

// ---------------------------------------------------------------------------
// Impression papier
// ---------------------------------------------------------------------------

/** Prépare la racine d'impression puis ouvre la boîte de dialogue système. */
function printSelection() {
  const items = printableLinks();
  if (items.length === 0) {
    toast(t('Aucun lien à imprimer'), 'error');
    return;
  }

  el.printRoot.textContent = '';

  if (mode === 'table') {
    // Le tableau s'imprime sur A4 : il n'a pas de cotes d'étiquette à honorer,
    // seulement un sens de feuille et des marges à fixer.
    const config = tablePageConfig();
    applyPrintPageSize(config.widthMm, config.heightMm);
    el.printRoot.appendChild(buildTablePage(buildTable(items)));
  } else {
    for (const page of buildSheetPages(items)) el.printRoot.appendChild(page);
  }

  // La boîte de dialogue est bloquante : on nettoie au retour pour ne pas
  // laisser une arborescence lourde dans le document.
  const cleanup = () => {
    el.printRoot.textContent = '';
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  window.print();
}

// ---------------------------------------------------------------------------
// Impression Niimbot
// ---------------------------------------------------------------------------

/** Vérifie le support Bluetooth et affiche l'explication si absent. */
async function reportBluetoothSupport() {
  // `checkWebBluetoothSupport` seul ne suffisait pas : Brave expose
  // `navigator.bluetooth` tout en refusant de s'en servir quand son drapeau est
  // éteint. Le bouton semblait donc prêt, et l'échec n'arrivait qu'après le
  // clic, en anglais. `probeWebBluetooth` interroge le navigateur pour de bon.
  const support = await probeWebBluetooth();
  el.connect.disabled = !support.ok;

  el.bleSupport.hidden = support.ok;
  if (!support.ok) {
    el.bleSupport.textContent = `${support.reason} ${support.hint}`;
    // Une note manuscrite vaut mieux qu'un texte gris : c'est la cause
    // n° 1 des échecs de connexion, et elle se règle en deux minutes.
    el.printStatus.textContent = t('Impression directe indisponible — voir le message ci-dessus.');
  }
}

/** Ouvre le sélecteur puis établit la session d'impression. */
async function connectPrinter() {
  el.connect.disabled = true;
  el.printStatus.textContent = t('Recherche de l\'imprimante…');

  try {
    const device = await requestPrinter();
    transport = new NiimbotTransport(device);
    await transport.connect();

    printer = new NiimbotPrinter(transport);
    const { profile, modelId, reportedHeadPixels } = await printer.start();

    el.printerDot.className = 'dot dot--on';
    el.printerName.textContent = `${profile.id}${device.name ? ` — ${device.name}` : ''}`;
    el.connect.hidden = true;
    el.disconnect.hidden = false;
    el.printLabel.disabled = false;

    const details = [
      modelId !== null ? t('modèle {id}', { id: modelId }) : t('modèle non rapporté'),
      t('{count} px de tête', { count: profile.printheadPixels }),
    ];
    if (reportedHeadPixels !== null) details.push(t('largeur mesurée {count} px', { count: reportedHeadPixels }));
    el.printStatus.textContent = t('Connecté : {details}.', { details: details.join(', ') });

    // L'aperçu se cale sur le matériel présent : ce qu'on voit est ce qu'on
    // imprimera. Le sélecteur reste modifiable pour explorer un autre format.
    if (findProfile(profile.id)) el.labelProfile.value = profile.id;

    // Le catalogue suit le matériel réellement connecté : la tête rapportée par
    // la heartbeat fait foi, et proposer un rouleau qu'elle ne peut pas
    // imprimer n'aurait aucun sens.
    fillSupplies();

    device.addEventListener('gattserverdisconnected', handlePrinterLost);
    renderPreview();
  } catch (error) {
    el.printStatus.textContent = '';
    toast(explainBluetoothFailure(error), 'error');
    resetPrinter();
  } finally {
    el.connect.disabled = false;
  }
}

/** L'imprimante s'éteint en veille : on remet l'interface en cohérence. */
function handlePrinterLost() {
  toast(t('Imprimante déconnectée'), 'error');
  resetPrinter();
  renderPreview();
}

/** Réinitialise l'état d'impression. */
function resetPrinter() {
  transport = null;
  printer = null;
  el.printerDot.className = 'dot dot--off';
  el.printerName.textContent = t('Aucune imprimante connectée');
  el.connect.hidden = false;
  el.disconnect.hidden = true;
  el.printLabel.disabled = true;
  // Sans matériel, le catalogue revient à celui du format choisi : les
  // longueurs proposées ne doivent pas rester celles de l'imprimante partie.
  fillSupplies();
}

/** Coupe la liaison. */
async function disconnectPrinter() {
  try {
    await transport?.disconnect();
  } catch {
    // Une coupure déjà effective n'est pas une erreur.
  }
  resetPrinter();
  el.printStatus.textContent = '';
  renderPreview();
}

/** Imprime l'étiquette du premier lien sélectionné. */
/**
 * Compose et envoie une étiquette à l'imprimante connectée.
 *
 * Extrait pour que l'impression d'une étiquette et celle d'une série suivent le
 * même chemin :
 * une seule séquence d'envoi, donc une seule à corriger si le dialogue avec
 * l'imprimante change.
 *
 * @param {import('./core/link.js').LinkRecord} link
 * @param {{ copies?: number }} [options]
 * @returns {Promise<{ rows: number, frames: number, width: number, height: number }>}
 */
async function sendLabel(link, options = {}) {
  const { bitmap, verdict, geometry } = labelToBitmap(link, printer.profile);
  const validation = validateBitmap(bitmap, printer.profile);
  if (!validation.ok) {
    throw new Error(validation.reasons.join(' ; '));
  }
  if (!verdict.ok) {
    // On avertit sans bloquer : l'utilisateur reste maître de son impression.
    toast(verdict.reason, 'error');
  }

  const copies = options.copies ?? (Number(el.copies.value) || 1);
  const density = Number(el.density.value) || printer.profile.density.default;

  const result = await printer.print(bitmap, {
    density,
    copies,
    onProgress: ({ page }) => {
      el.printStatus.textContent = t('Impression {page}/{copies}…', { page, copies });
    },
  });

  return { ...result, width: geometry.width, height: geometry.height };
}

/** Imprime l'étiquette du lien choisi. */
/**
 * Imprime toute la collection, une étiquette après l'autre.
 *
 * Une étiquette qui échoue n'interrompt pas la série : elle est comptée, et le
 * bilan final dit combien sont sorties. Sur trente étiquettes, s'arrêter à la
 * troisième parce que la quatrième a raté serait pénible.
 */
/** Hauteur de texte minimale, en millimètres : c'est la lisibilité. */
const MIN_TEXT_MM = 1.6;

/** Plancher de lisibilité du texte, en pixels : 1,6 mm à 203 dpi. */
const MIN_FONT_PX = 6;

/** Nombre de lignes qu'une date peut occuper sous le QR Code, une fois découpée. */
const DATE_LINES_MAX = 2;

/** Vrai pendant une série : le bouton sert alors à l'interrompre. */
let seriesRunning = false;

async function printLabels() {
  if (!printer) {
    toast(t('Aucune imprimante connectée'), 'error');
    return;
  }

  const { kind, items } = impressionChoisie();
  if (items.length === 0) {
    toast(kind === 'one'
      ? t('Aucun lien dans la collection')
      : t('Aucun lien coché : cochez les étiquettes à imprimer, ou choisissez « toute la collection »'), 'error');
    return;
  }

  const copies = copiesCount();
  el.printLabel.disabled = true;

  // Une seule étiquette ne mérite pas la mécanique d'une série : pas de
  // compteur de progression, pas de bouton d'arrêt, et un bilan qui parle
  // d'étiquettes plutôt que de liens parcourus.
  if (kind === 'one' && copies === 1) {
    el.printStatus.textContent = t('Envoi en cours…');
    try {
      const result = await sendLabel(items[0]);
      el.printStatus.textContent = t('Étiquette imprimée : {rows} lignes, {frames} trames.', {
        rows: result.rows,
        frames: result.frames,
      });
    } catch (error) {
      el.printStatus.textContent = '';
      toast(error.message ?? t('Impression impossible'), 'error');
    } finally {
      updatePrintScope();
    }
    return;
  }

  // Le bouton devient l'arrêt de la série : trente étiquettes lancées par erreur
  // ne doivent pas obliger à couper l'imprimante.
  el.printLabel.textContent = t('Arrêter');
  seriesRunning = true;

  let printed = 0;
  const failures = [];

  try {
    for (const [index, link] of items.entries()) {
      if (!seriesRunning) break;
      el.printStatus.textContent = t('Étiquette {index}/{total} — {title}', {
        index: index + 1,
        total: items.length,
        title: link.title || link.url,
      });
      try {
        await sendLabel(link, { copies });
        printed += copies;
      } catch (error) {
        failures.push(error.message ?? t('impression impossible'));
      }
    }

    // Le compte porte sur les étiquettes réellement sorties, pas sur les liens
    // parcourus : avec deux exemplaires, dix liens font vingt étiquettes.
    const parts = [tpl(printed, '{count} étiquette imprimée', '{count} étiquettes imprimées')];
    if (!seriesRunning) parts.push(t('série arrêtée'));
    if (failures.length > 0) parts.push(t('{count} en échec — {message}', { count: failures.length, message: failures[0] }));
    el.printStatus.textContent = parts.join(', ') + '.';
    toast(parts.join(', '), failures.length > 0 ? 'error' : 'info');
  } finally {
    seriesRunning = false;
    // Le libellé revient à la portée courante : le remettre à la main pourrait
    // annoncer autre chose que ce que le clic suivant fera.
    updatePrintScope();
  }
}

// ---------------------------------------------------------------------------
// Câblage
// ---------------------------------------------------------------------------

function fillPresets() {
  // Regroupés par famille : une planche générique se règle, une planche Avery
  // se choisit par la référence imprimée sur l'emballage.
  for (const group of SHEET_GROUPS) {
    const entries = Object.entries(SHEET_PRESETS).filter(([, p]) => p.group === group.id);
    if (entries.length === 0) continue;

    const optgroup = document.createElement('optgroup');
    optgroup.label = t(group.label);
    for (const [key, preset] of entries) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = t(preset.label);
      optgroup.appendChild(option);
    }
    el.preset.appendChild(optgroup);
  }
  el.preset.value = 'a4-3x8';

  // Les six champs partent des cotes de la première disposition ; en changer
  // les réécrit.
  prefillGridFields();
}

/**
 * Remplit le choix du format d'étiquette Niimbot.
 *
 * Ce choix pilote l'aperçu, pas l'impression : celle-ci utilise toujours le
 * profil du matériel réellement connecté, pour qu'un aperçu ne puisse jamais
 * faire imprimer à la mauvaise largeur.
 */
function fillProfiles() {
  for (const profile of PROFILES) {
    const option = document.createElement('option');
    option.value = profile.id;
    const printableMm = Math.round((profile.printheadPixels / profile.dpi) * 25.4);
    option.textContent = t('Niimbot {id} — {mm} mm utiles, {dpi} dpi', {
      id: profile.id,
      mm: printableMm,
      dpi: profile.dpi,
    });
    el.labelProfile.appendChild(option);
  }
  el.labelProfile.value = DEFAULT_PROFILE.id;
  fillSupplyChoices();
}

/**
 * Le profil dont on remplit les consommables : celui du matériel réellement
 * connecté quand il y en a un, sinon celui choisi pour l'aperçu.
 *
 * Avant connexion, tout le catalogue reste proposé, et c'est le profil choisi
 * qui juge la compatibilité : on veut pouvoir préparer un format avant d'avoir
 * l'imprimante sous la main.
 */
function supplyProfile() {
  return printer?.profile ?? findProfile(el.labelProfile.value) ?? DEFAULT_PROFILE;
}

/**
 * Propose les consommables du profil retenu.
 *
 * Chaque consommable porte ses deux cotes. La longueur n'est donc plus une
 * question posée à côté du format : elle vient du rouleau choisi. Le rouleau
 * continu, lui, n'a pas de pas connu — c'est le seul cas où la longueur reste
 * à saisir.
 */
function fillSupplies() {
  const supplies = compatibleSupplies(supplyProfile());
  const previous = el.labelSupply.value;

  el.labelSupply.textContent = '';
  for (const supply of supplies) {
    const option = document.createElement('option');
    option.value = supply.id;
    const length = supply.lengthMm === null
      ? t('longueur libre')
      : `${supply.lengthMm} mm`;
    // La raison est affichée dès qu'il y en a une, compatible ou non : un
    // rouleau plus large que la tête imprime avec une marge, et l'utilisateur
    // doit le savoir sans que l'option soit écartée.
    option.textContent = `${t(supply.label)} — ${length}`
      + (supply.reason === '' ? '' : ` (${t(supply.reason)})`);
    // Un consommable que la tête ne peut pas atteindre reste visible, mais ne
    // peut pas être choisi : le faire disparaître ferait croire à une option
    // manquante.
    option.disabled = !supply.compatible;
    el.labelSupply.appendChild(option);
  }

  // Le choix précédent est conservé s'il existe encore et reste compatible.
  const keep = supplies.find((supply) => supply.id === previous && supply.compatible)
    ?? supplies.find((supply) => supply.compatible)
    ?? supplies[0];
  if (keep) el.labelSupply.value = keep.id;

  updateSupplyLength();
}

/** Le consommable retenu, ou `undefined` si le catalogue est vide. */
function chosenSupply() {
  return compatibleSupplies(supplyProfile())
    .find((supply) => supply.id === el.labelSupply.value);
}

/**
 * Affiche ou masque la longueur libre, selon le consommable choisi.
 *
 * Un rouleau à longueur fixe impose la sienne : le champ disparaît, et la
 * longueur vient du catalogue. Un rouleau continu laisse la place libre.
 */
/** Rappelle ce que le consommable impose, sans rien demander à l'utilisateur. */
function updateSupplyLength() {
  const supply = chosenSupply();
  const longueur = supply?.lengthMm ?? null;
  el.supplyHint.textContent = longueur === null
    ? t('Rouleau continu : la longueur suit le contenu.')
    : t('Longueur imposée par le rouleau : {mm} mm.', { mm: longueur });
}

/** Propose les dispositions applicables au format retenu. */
function fillLayouts() {
  const profil = previewProfile();
  const disponibles = layoutsFor(profil);
  const precedent = el.labelRotation.value;

  el.labelRotation.textContent = '';
  for (const disposition of disponibles) {
    const option = document.createElement('option');
    option.value = disposition.id;
    option.textContent = t(disposition.label);
    el.labelRotation.appendChild(option);
  }

  // On garde le choix précédent s'il reste applicable.
  el.labelRotation.value = disponibles.some((entry) => entry.id === precedent)
    ? precedent
    : 'dessous';
}

/** Remplit la disposition verticale, puis les longueurs suggérées. */
function fillSupplyChoices() {
  el.labelAlignment.textContent = '';
  for (const alignment of LABEL_ALIGNMENTS) {
    const option = document.createElement('option');
    option.value = alignment.id;
    option.textContent = t(alignment.label);
    el.labelAlignment.appendChild(option);
  }
  el.labelAlignment.value = DEFAULT_LABEL_ALIGNMENT;
  fillSupplies();
}

/**
 * Rappelle qu'une date a été écartée faute de place.
 *
 * Sans ce message, l'option semblerait sans effet : l'utilisateur croirait à un
 * défaut plutôt qu'à une contrainte de largeur, alors que réduire la taille du
 * texte suffit à la faire tenir.
 *
 * @returns {string} phrase à ajouter à la légende, ou chaîne vide.
 */
function composeDateNote() {
  if (dateMode() === 'none') return '';
  return t(' — aucune date : elle ne tient pas sur une ligne à cette taille de texte.');
}

/**
 * Remplit les choix propres à l'étiquette Niimbot.
 *
 * Le contenu réutilise le vocabulaire de l'export d'images : une seule chose à
 * apprendre pour les deux onglets.
 */
function fillLabelChoices() {
  fillLayouts();

  // Le contenu se coche, il ne se choisit plus dans une liste : titre, URL et
  // numéro se cumulent, une liste déroulante n'en acceptait qu'un.

  // Sens de la feuille pour le tableau imprimé.
  for (const [id, label] of [['portrait', 'Portrait'], ['landscape', 'Paysage']]) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = t(label);
    el.tableOrientation.appendChild(option);
  }
  el.tableOrientation.value = 'portrait';

}

/** Vocabulaire de l'étiquette, plus explicite que celui de l'export. */
const LABEL_CONTENT_LABELS = Object.freeze({
  none: 'QR Code seul',
  title: 'QR Code + titre',
  url: 'QR Code + URL',
  'title-url': 'QR Code + titre + URL',
  host: 'QR Code + domaine',
});

/**
 * Remplit la liste des liens imprimables.
 *
 * Sans elle, l'onglet imprimait toujours le premier lien de la collection : on
 * ne pouvait pas choisir ce qu'on imprimait.
 */
function fillLabelLinks() {
  const previous = el.labelLink.value;
  el.labelLink.textContent = '';

  // Deux groupes dans **une** liste : un lien à la fois, ou plusieurs. Le
  // séparateur visuel suffit à faire comprendre qu'une seule réponse est
  // attendue, là où deux listes déroulantes laissaient croire à deux réglages.
  const un = document.createElement('optgroup');
  un.label = t('Un seul lien');
  for (const link of links) {
    const option = document.createElement('option');
    option.value = link.id;
    // Le rang est celui affiché dans la liste et le tableau : on s'y retrouve.
    option.textContent = `${linkRanks.get(link.id) ?? '?'}. `
      + (link.title || hostOf(link.url) || link.url);
    option.title = link.url;
    un.appendChild(option);
  }
  el.labelLink.appendChild(un);

  const plusieurs = document.createElement('optgroup');
  plusieurs.label = t('Plusieurs');
  const coches = links.filter((link) => selected.has(link.id)).length;
  for (const [valeur, libelle] of [
    [PORTEE_TOUT, tpl(links.length, 'Toute la collection ({count} lien)',
      'Toute la collection ({count} liens)', { count: links.length })],
    [PORTEE_COCHEE, tpl(coches, 'Seulement ceux que je coche ({count} lien coché)',
      'Seulement ceux que je coche ({count} liens cochés)', { count: coches })],
  ]) {
    const option = document.createElement('option');
    option.value = valeur;
    option.textContent = libelle;
    plusieurs.appendChild(option);
  }
  el.labelLink.appendChild(plusieurs);

  // La portée « seulement ceux que je coche » **reste choisie même sans rien de
  // coché**. Elle était désactivée dans ce cas, et le sélecteur retombait
  // silencieusement sur le premier lien : l'aperçu se mettait alors à juger un
  // lien que personne n'avait choisi, message rouge compris, alors que
  // l'intention — « rien de coché » — était de n'imprimer rien. Le panneau dit
  // maintenant ce qui se passe : rien ne sortira, et pourquoi.
  const encoreValable = links.some((link) => link.id === previous)
    || previous === PORTEE_TOUT
    || previous === PORTEE_COCHEE;
  if (encoreValable) el.labelLink.value = previous;
  el.labelLink.disabled = links.length === 0;
  updateLabelContentHint();
}

/** Explique ce qui sera imprimé sous le QR Code, d'après les cases cochées. */
function updateLabelContentHint() {
  const choisis = [];
  if (el.labelShowIndex.checked) choisis.push(t('le numéro du lien'));
  if (el.labelShowTitle.checked) choisis.push(t('le titre'));
  if (el.labelShowUrl.checked) choisis.push(t('l\'URL'));
  if (el.labelShowHost.checked) choisis.push(t('le domaine'));
  if (el.labelShowDate.checked) {
    choisis.push(el.labelDateTime.checked ? t('la date et l\'heure') : t('la date de collecte'));
  }

  if (choisis.length === 0) {
    el.labelContentHint.textContent = t('Le QR Code seul, sans texte sous lui.');
    return;
  }
  el.labelContentHint.textContent = t(
    'Sous le QR Code : {list}. Le texte est découpé à la largeur de la tête.',
    { list: choisis.join(', ') },
  );
}

/**
 * Tourne un canevas d'un nombre de quarts de tour.
 *
 * L'aperçu et l'impression doivent tourner de la même façon : deux implémentations
 * divergeraient, et l'aperçu ne montrerait plus ce qui sort.
 *
 * @param {HTMLCanvasElement} source
 * @param {number} turns Quarts de tour dans le sens horaire.
 * @returns {HTMLCanvasElement}
 */
function rotateCanvas(source, turns) {
  const quarters = ((turns % 4) + 4) % 4;
  const swap = quarters % 2 === 1;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? source.height : source.width;
  canvas.height = swap ? source.width : source.height;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((quarters * Math.PI) / 2);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

/**
 * La disposition retenue : comment le QR Code et son texte s'organisent.
 *
 * Ce n'est **pas** une orientation du support : l'étiquette garde sa taille et
 * son sens. Seule la composition change, pour que le texte reste lisible selon
 * la forme du rouleau.
 *
 * @returns {typeof LABEL_LAYOUTS[number]}
 */
function labelLayout() {
  return LABEL_LAYOUTS.find((entry) => entry.id === el.labelRotation.value)
    ?? LABEL_LAYOUTS[0];
}

/** Aucune rotation d'image : le support garde son sens, seule la mise en page
 * change. On ne tourne donc jamais le bitmap avant envoi. */
function labelTurns() {
  return 0;
}

/** L'orientation retenue à l'impression, pour la rotation du bitmap. */
function labelRotation() {
  return { turns: labelTurns(), label: labelLayout().label };
}

/**
 * Ce que le sélecteur unique désigne, et les liens que cela représente.
 *
 * Une seule question — « ce qu'on imprime » — pour trois réponses possibles :
 * un lien, toute la collection, ou la sélection cochée. La série et
 * l'impression d'une étiquette passent donc par le même chemin, ce qui était
 * l'objet du regroupement : un couple de champs et un bouton.
 *
 * @returns {{ kind: 'one'|'all'|'selected', items: import('./core/link.js').LinkRecord[] }}
 */
function impressionChoisie() {
  if (links.length === 0) return { kind: 'one', items: [] };
  const choix = el.labelLink.value;
  if (choix === PORTEE_TOUT) return { kind: 'all', items: [...links] };
  if (choix === PORTEE_COCHEE) {
    return { kind: 'selected', items: links.filter((link) => selected.has(link.id)) };
  }
  const link = links.find((entree) => entree.id === choix) ?? links[0];
  return { kind: 'one', items: link ? [link] : [] };
}

/** Le lien montré dans l'aperçu : le premier de ce qui sera imprimé. */
function chosenLabelLink() {
  return impressionChoisie().items[0];
}

/** Le profil retenu pour l'aperçu : celui du matériel, ou celui choisi. */
function previewProfile() {
  // Le format choisi fait foi, même quand une imprimante est connectée :
  // vouloir regarder un autre format est légitime, et ignorer le choix donnait
  // l'impression que la liste ne servait à rien. Sans choix, on prend le
  // matériel présent, puis le format par défaut.
  return findProfile(el.labelProfile.value) ?? printer?.profile ?? DEFAULT_PROFILE;
}

/** Explique avec quel profil l'aperçu est composé, et ce qui sera imprimé. */
function updateProfileHint() {
  const profile = previewProfile();
  const selected = findProfile(el.labelProfile.value) ?? DEFAULT_PROFILE;
  const printableMm = ((profile.printheadPixels / profile.dpi) * 25.4).toFixed(1);

  if (!printer) {
    el.profileHint.textContent = t(
      'Aperçu composé avec le {profile} ({mm} mm utiles, {dpi} dpi), sans imprimante connectée : les dimensions et le nombre de modules sont exacts.',
      { profile: profile.id, mm: printableMm, dpi: profile.dpi },
    );
    return;
  }
  const connected = printer.profile;
  el.profileHint.textContent = connected.id === profile.id
    ? t('Imprimante connectée : {id}. Aperçu et impression identiques.', { id: connected.id })
    : t(
      "Imprimante connectée : {id}. L'aperçu montre le {profile} choisi ; « Imprimer » se fera au format du {connected}.",
      { id: connected.id, profile: profile.id, connected: connected.id },
    );
}

/** Remplit les listes de formats et de modes de texte. */
function fillLabelForm() {
  for (const format of LABEL_FORMATS) {
    const option = document.createElement('option');
    option.value = format.id;
    option.textContent = t(format.name);
    el.labelFormat.appendChild(option);
  }
  el.labelFormat.value = 'niimbot-d110';

  for (const [id, label] of Object.entries(TEXT_MODES)) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = t(label);
    el.labelText.appendChild(option);
  }
  el.labelText.value = 'url';
}

function switchMode(next) {
  mode = next;
  for (const tab of document.querySelectorAll('.tab')) {
    const active = tab.dataset.mode === next;
    tab.classList.toggle('tab--active', active);
    tab.setAttribute('aria-selected', String(active));
  }
  for (const panel of document.querySelectorAll('[data-mode-panel]')) {
    panel.hidden = panel.dataset.modePanel !== next;
  }
  renderPreview();
}

el.addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addFromInput();
});

el.search.addEventListener('input', renderList);

el.sortMode.addEventListener('change', async () => {
  preferences = settings.save({ sortMode: el.sortMode.value });
  await refresh();
  updateSortHint();
});

// Le rangement s'ouvre, se referme, et se quitte au clavier. Échap est le
// pendant de ce qui se fait à la souris : sans lui, on ne sortirait du mode
// qu'en visant le bouton.
el.reorder.addEventListener('click', () => {
  setReorderMode(!reorderMode);
  el.reorder.focus();
});

el.list.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !reorderMode) return;
  setReorderMode(false);
  el.reorder.focus();
});

// Le premier numéro : appliqué à la frappe quand il est exploitable, et remis
// en forme au changement. Un champ vidé ou hors bornes n'est pas une valeur —
// la collection garde alors le dernier numéro valide, plutôt que de sauter à 1
// au milieu d'une saisie.
function appliquerPremierNumero(redessiner) {
  const brut = Number(el.collectionStart.value);
  if (!Number.isFinite(brut)) return false;
  const voulu = sanitizeSettings({ startIndex: brut }).startIndex;
  if (voulu === preferences.startIndex) return false;
  preferences = settings.save({ startIndex: voulu });
  if (redessiner) {
    // Le numéro est une **vue**, comme le tri : il ne touche ni la collection ni
    // l'ordre enregistré. On redessine donc la liste et l'aperçu sans relire le
    // magasin.
    linkRanks = new Map(links.map((link, index) => [link.id, index + premierNumero()]));
    renderList();
    renderPreview();
  }
  return true;
}

el.collectionStart.addEventListener('input', () => {
  appliquerPremierNumero(Boolean(el.collectionStart.value.trim()));
});

// Au changement — sortie du champ, flèches du compteur — on réécrit la valeur
// retenue : le champ ne doit pas afficher un nombre que la collection n'utilise
// pas.
el.collectionStart.addEventListener('change', () => {
  appliquerPremierNumero(true);
  el.collectionStart.value = String(preferences.startIndex);
});

el.collectionName.addEventListener('input', () => {
  applyCollectionName();
  // Enregistré à la volée : le nom se retape rarement, mais le perdre serait
  // agaçant, et ce champ n'appartient à aucun formulaire.
  settings.save({ collectionName: collectionName() });
});

// La note suit la même règle, à la frappe : c'est un paragraphe, pas une
// commande, et rien n'oblige à valider. Elle est réenregistrée telle quelle —
// bornée à la longueur admise — et redessine l'aperçu, puisque les en-têtes
// imprimés la portent.
el.collectionNote.addEventListener('input', () => {
  settings.save({ collectionNote: collectionNote() });
  // La note décide de l'état de la case qui l'imprime : elle doit suivre à la
  // frappe, et pas seulement au prochain rendu de la liste.
  updateHeaderNoteOptions();
  renderPreview();
});

el.selectAllBox.addEventListener('change', () => {
  // Une case indéterminée devient cochée au clic : la cocher sélectionne tout,
  // la décocher vide la sélection. Dans les deux cas l'état de la case dit
  // exactement ce qui vient de se passer.
  selected = el.selectAllBox.checked
    ? new Set(links.map((link) => link.id))
    : new Set();

  renderList();
  renderPreview();

  if (selected.size === 0) {
    // Une sélection vide signifie « tout » à l'impression : c'est la règle la
    // moins devinable, on la rappelle au moment où elle s'applique.
    toast(t('Aucun lien coché : l\'impression portera sur toute la collection'));
  }
});

/**
 * Exporte un classeur `.xlsx` avec les QR Codes intégrés.
 *
 * Un CSV ne peut pas transporter d'image : c'est tout l'intérêt de cet export.
 * La génération des QR Codes prend un instant par lien, d'où le retour sur le bouton.
 */
async function exportSpreadsheet() {
  if (links.length === 0) return;

  const label = el.exportXlsx.textContent;
  el.exportXlsx.disabled = true;
  el.exportXlsx.textContent = t('Génération…');

  try {
    const bytes = await buildLinkSpreadsheet(resolveTargets(links, el.qrTarget.value), {
      onProgress: (done, total) => {
        el.exportXlsx.textContent = t('QR Code {done}/{total}…', { done, total });
      },
    });
    const filename = exportFilename(collectionName(), 'xlsx');
    const ok = downloadBytes(filename, bytes, {
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    toast(ok ? t('{filename} enregistré', { filename }) : t('Téléchargement impossible'), ok ? 'info' : 'error');
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.exportXlsx.textContent = label;
    el.exportXlsx.disabled = links.length === 0;
  }
}

/**
 * Exporte le tableau configuré : un dossier autonome JSON + PNG + HTML.
 *
 * Contrairement aux exports de la collection, celui-ci suit la sélection et
 * les colonnes cochées dans l'onglet, comme l'impression : c'est le même
 * tableau, avec ses QR Codes prêts à l'emploi.
 */
async function exportTableArchive() {
  const items = printableLinks();
  if (items.length === 0) return;

  const label = el.exportTable.textContent;
  el.exportTable.disabled = true;
  el.exportTable.textContent = t('Génération…');

  try {
    const { bytes } = await buildTableArchive(items, {
      title: collectionName(),
      columns: tableColumns(),
      dateMode: tableDateMode(),
      // Le rang de la collection, celui que porte le tableau imprimé.
      rankOf: (link, index) => linkRanks.get(link.id) ?? index + premierNumero(),
      onProgress: (done, total) => {
        el.exportTable.textContent = t('QR Code {done}/{total}…', { done, total });
      },
    });
    const filename = exportFilename(collectionName(), 'zip');
    const ok = downloadBytes(filename, bytes, { mime: 'application/zip' });
    toast(ok ? t('{filename} enregistré', { filename }) : t('Téléchargement impossible'), ok ? 'info' : 'error');
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.exportTable.textContent = label;
    el.exportTable.disabled = items.length === 0 || !hasAnyTableColumn();
  }
}

/**
 * Exporte les étiquettes composées pour l'imprimante, sans imprimante.
 *
 * L'onglet Niimbot ne savait produire que par le matériel : sans lui, ses
 * réglages ne servaient à rien. La composition est **la même** que pour
 * l'impression et pour l'aperçu — `composeLabel` puis `drawLabel`, à la
 * résolution de la tête, avec l'orientation appliquée — si bien que le dossier
 * contient ce qui serait sorti, et non une seconde composition qui lui ressemble.
 */
async function exportPrinterLabels() {
  const { items } = impressionChoisie();
  if (items.length === 0) {
    toast(t('Aucun lien à imprimer'), 'error');
    return;
  }

  const libelle = el.exportNiimbot.textContent;
  el.exportNiimbot.disabled = true;

  try {
    const profile = previewProfile();
    const { turns } = labelRotation();
    const largeur = String(items.length).length;
    const labels = [];

    for (const [index, link] of items.entries()) {
      el.exportNiimbot.textContent = t('Étiquette {index}/{total}…', {
        index: index + 1,
        total: items.length,
      });

      const { geometry, content, verdict } = composeLabel(link, profile);

      const source = document.createElement('canvas');
      source.width = geometry.width;
      source.height = geometry.height;
      const ctx = source.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      drawLabel(ctx, geometry, {
        titleLines: content.titleLines,
        showTitle: content.showTitle,
        url: resolveTarget(link, el.qrTarget.value).url,
        extraText: content.extraText,
      });

      // L'orientation est appliquée à l'envoi, comme à l'impression : l'image
      // exportée doit montrer la même chose que ce qui sort.
      const tourne = turns === 0 ? source : rotateCanvas(source, turns);
      const blob = await new Promise((resolve) => tourne.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error(t("Le navigateur n'a pas pu encoder l'image."));

      labels.push({
        fileName: printerLabelFileName(index + 1, link.title || hostOf(link.url) || link.url, largeur),
        png: new Uint8Array(await blob.arrayBuffer()),
        widthMm: Number(pxToMm(geometry.width, profile.dpi).toFixed(1)),
        heightMm: Number(pxToMm(geometry.height, profile.dpi).toFixed(1)),
        widthPx: geometry.width,
        heightPx: geometry.height,
        pxPerModule: verdict.pxPerModule,
        url: link.url,
        title: link.title ?? '',
      });
    }

    el.exportNiimbot.textContent = t('Assemblage…');
    const { bytes } = buildPrinterLabelArchive({
      labels,
      title: collectionName(),
      // Tous les réglages de l'onglet : sans eux, le dossier décrirait des
      // étiquettes qu'on ne saurait pas recomposer.
      settings: {
        profile: profile.id,
        supply: el.labelSupply.value,
        supplyName: el.labelSupply.selectedOptions?.[0]?.textContent ?? '',
        density: Number(el.density.value) || profile.density.default,
        rotation: el.labelRotation.value,
        alignment: el.labelAlignment.value,
        fontSizeMm: Number(el.labelFontSize.value),
        position: el.labelLink.value,
        content: {
          index: el.labelShowIndex.checked,
          title: el.labelShowTitle.checked,
          url: el.labelShowUrl.checked,
          host: el.labelShowHost.checked,
          date: el.labelShowDate.checked,
          time: el.labelDateTime.checked,
        },
      },
    });

    const filename = printerLabelArchiveName(Date.now(), collectionName());
    const ok = downloadBytes(filename, bytes, { mime: 'application/zip' });
    toast(ok
      ? tpl(labels.length, '{count} étiquette — {filename} enregistré',
        '{count} étiquettes — {filename} enregistré', { filename })
      : t('Téléchargement impossible'), ok ? 'info' : 'error');
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.exportNiimbot.textContent = libelle;
    updatePrintScope();
  }
}

/**
 * Exporte la planche en dossier autonome.
 *
 * Le HTML n'est pas reconstruit : il est repris tel quel des pages rendues pour
 * l'aperçu et pour l'impression. Ce que le fichier contient est donc, au pixel
 * près, ce qui serait sorti de l'imprimante — et non une seconde mise en page
 * qui lui ressemble.
 */
async function exportSheetArchive() {
  const items = printableLinks();
  if (items.length === 0) return;

  const libelle = el.exportSheet.textContent;
  el.exportSheet.disabled = true;
  el.exportSheet.textContent = t('Génération…');

  try {
    // Deux objets distincts, et les confondre a coûté une erreur : les pages
    // **rendues** portent le HTML, le **placement** porte le rang de chaque
    // étiquette. Un élément du DOM n'a pas de `items`.
    const pages = buildSheetPages(items);
    const { layout, pages: placement } = planchePlacement(items);

    const cells = placement.flatMap((page) => page.items.map(({ item, cell }) => ({
      index: cell.index,
      page: cell.page,
      column: cell.column,
      row: cell.row,
      url: item.url,
      title: item.title ?? '',
    })));

    const ratio = Number(el.sheetQr.value) / 100;
    const { bytes } = buildSheetArchive({
      pagesHtml: pages.map((page) => page.outerHTML).join('\n'),
      css: feuillesAppliquees(),
      title: collectionName(),
      note: collectionNote(),
      pageWidthMm: layout.pageWidthMm,
      pageHeightMm: layout.pageHeightMm,
      layout,
      qrRatio: ratio,
      qrSideMm: qrSideMm(layout.labelWidthMm, layout.labelHeightMm, ratio),
      fontPt: sheetFontPt(),
      options: {
        title: el.sheetTitle.checked,
        url: el.sheetUrl.checked,
        date: dateMode(),
        index: el.sheetDateIndex.checked,
        header: el.sheetHeader.checked,
        headerDate: el.sheetHeaderDate.checked,
        headerNote: el.sheetHeaderNote.checked,
        border: el.sheetBorder.checked,
      },
      cells,
    });

    const filename = sheetArchiveName(Date.now(), collectionName());
    const ok = downloadBytes(filename, bytes, { mime: 'application/zip' });
    toast(ok
      ? t('Planche exportée : {filename}', { filename })
      : t('Téléchargement impossible'), ok ? 'info' : 'error');
  } catch (error) {
    toast(t('Export impossible : {message}', { message: error.message }), 'error');
  } finally {
    el.exportSheet.textContent = libelle;
    el.exportSheet.disabled = printableLinks().length === 0;
  }
}

el.exportXlsx.addEventListener('click', exportSpreadsheet);
el.exportCsv.addEventListener('click', () => exportAs('csv'));
el.exportMd.addEventListener('click', () => exportAs('md'));
el.exportJson.addEventListener('click', () => exportAs('json'));
el.exportTable.addEventListener('click', exportTableArchive);
el.exportSheet.addEventListener('click', exportSheetArchive);

el.import.addEventListener('click', () => el.importFile.click());
el.importFile.addEventListener('change', async () => {
  const [file] = el.importFile.files ?? [];
  if (file) await importArchive(file);
  el.importFile.value = '';
});

el.clear.addEventListener('click', async () => {
  await store.clear();
  selected = new Set();
  await refresh();
  toast(t('Collection vidée'));
});

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => switchMode(tab.dataset.mode));
}

el.shortener.addEventListener('change', () => {
  settings.save({ shortener: el.shortener.value });
  updateShortenStatus();
});
el.shorten.addEventListener('click', shortenSelection);
el.shortenClear.addEventListener('click', clearShortUrls);
for (const box of [el.sheetDate, el.sheetDateTime, el.sheetDateIndex]) {
  box.addEventListener('change', () => {
    updateDateHint();
    renderPreview();
  });
}
for (const box of [el.exportTitle, el.exportDate, el.exportDateTime]) {
  box.addEventListener('change', renderPreview);
}
for (const box of [el.tableColDate, el.tableColDateTime]) {
  box.addEventListener('change', renderPreview);
}
el.qrTarget.addEventListener('change', () => {
  settings.save({ targetMode: el.qrTarget.value });
  updateTargetAvailability();
  renderPreview();
});

/**
 * Parcourt les dispositions de la **famille** courante.
 *
 * On essaie les références d'un même fabricant l'une après l'autre — c'est le
 * geste réel quand on hésite entre deux pochettes — sans traverser les autres
 * familles ni ouvrir la liste. Le sélecteur reste, pour qui sait ce qu'il
 * cherche.
 *
 * @param {number} pas +1 pour la suivante, −1 pour la précédente.
 */
function parcourirDispositions(pas) {
  const courante = el.preset.value;
  const groupe = SHEET_PRESETS[courante]?.group;
  const famille = Object.keys(SHEET_PRESETS).filter((cle) => SHEET_PRESETS[cle].group === groupe);
  if (famille.length < 2) return;

  const index = famille.indexOf(courante);
  const suivant = famille[(index + pas + famille.length) % famille.length];
  el.preset.value = suivant;
  el.preset.dispatchEvent(new Event('change', { bubbles: true }));
}

el.presetPrev.addEventListener('click', () => parcourirDispositions(-1));
el.presetNext.addEventListener('click', () => parcourirDispositions(1));
el.sheetFit.addEventListener('click', ajusterEspacement);

el.preset.addEventListener('change', () => {
  prefillGridFields();
  // Un changement de planche efface le message : la grille vient d'être
  // remplacée par celle du fabricant, il n'y a plus rien à recadrer.
  if (el.sheetGridHint) el.sheetGridHint.textContent = '';
  renderPreview();
});
// Les six réglages dont dépend la **taille** des étiquettes. Aux `input`, on
// redessine seulement ; au `change` — c'est-à-dire à la sortie du champ — on
// recadre. Réécrire un nombre pendant la frappe empêcherait d'entrer « 12 »
// sans passer par « 1 ».
for (const field of [
  el.sheetColumns, el.sheetRows,
  el.sheetMarginX, el.sheetMarginY,
  el.sheetGapX, el.sheetGapY,
]) {
  field.addEventListener('input', renderPreview);
  field.addEventListener('change', () => {
    recadrerGrille();
    renderPreview();
  });
}
for (const box of [
  el.sheetTitle, el.sheetUrl, el.sheetBorder,
  el.sheetHeader, el.sheetHeaderDate, el.sheetHeaderNote,
]) {
  box.addEventListener('change', renderPreview);
}
el.sheetQr.addEventListener('input', renderPreview);
el.sheetFont.addEventListener('input', renderPreview);
el.sheetOffsetX.addEventListener('input', renderPreview);
el.sheetOffsetY.addEventListener('input', renderPreview);
el.labelProfile.addEventListener('change', () => {
  // Changer de format change le catalogue : chaque modèle a ses rouleaux, et
  // un consommable qui n'existe plus doit disparaître. Les dispositions
  // applicables en dépendent aussi.
  fillSupplies();
  fillLayouts();
  updateProfileHint();
  renderPreview();
});

el.labelSupply.addEventListener('change', () => {
  // Le consommable décide de la longueur : on réaffiche le champ libre si, et
  // seulement si, le rouleau choisi n'impose pas la sienne.
  updateSupplyLength();
  renderPreview();
});
el.tableQr.addEventListener('input', renderPreview);
for (const box of [
  el.tableColIndex, el.tableColQr, el.tableColUrl,
  el.tableColTitle, el.tableColTags, el.tableColNote,
  el.tableGrid,
]) {
  box.addEventListener('change', renderPreview);
}
el.labelRotation.addEventListener('change', renderPreview);
for (const box of [
  el.labelShowIndex, el.labelShowTitle, el.labelShowUrl,
  el.labelShowHost, el.labelShowDate, el.labelDateTime,
]) {
  box.addEventListener('change', () => {
    updateLabelContentHint();
    renderPreview();
  });
}
el.labelAlignment.addEventListener('change', renderPreview);
// Réglage d'aperçu : il ne change rien à l'impression, mais il change ce qu'on
// regarde.
/**
 * Les deux cases « Aperçu à la taille réelle » — celle de l'onglet Niimbot et
 * celle des images — portent le **même** état : c'est le même aperçu, vu depuis
 * deux onglets, et deux états séparés finiraient par se contredire.
 *
 * @param {boolean} valeur
 */
function setRealSizePreview(valeur) {
  el.labelRealSize.checked = valeur;
  el.exportRealSize.checked = valeur;
  renderPreview();
}

el.labelRealSize.addEventListener('change', () => setRealSizePreview(el.labelRealSize.checked));
el.exportRealSize.addEventListener('change', () => setRealSizePreview(el.exportRealSize.checked));
el.labelFontSize.addEventListener('input', renderPreview);
// Les réglages de page du tableau se répercutent sur l'aperçu.
for (const node of [
  el.tableOrientation, el.tableMarginX, el.tableMarginY,
]) {
  node.addEventListener('input', renderPreview);
  node.addEventListener('change', renderPreview);
}
for (const box of [el.tableTitle, el.tableTitleDate, el.tableTitleNote]) {
  box.addEventListener('change', renderPreview);
}

el.labelLink.addEventListener('change', () => {
  // Le sélecteur unique décide à la fois de ce que montre l'aperçu et de ce qui
  // sortira : les deux se rafraîchissent ensemble.
  updatePrintScope();
  renderPreview();
});
el.copies.addEventListener('input', updatePrintScope);
el.labelFormat.addEventListener('change', renderPreview);
el.labelText.addEventListener('change', renderPreview);
el.labelMargin.addEventListener('input', renderPreview);
el.labelFont.addEventListener('input', renderPreview);
el.labelCut.addEventListener('change', renderPreview);
el.exportLabels.addEventListener('click', exportLabelImages);
el.print.addEventListener('click', printSelection);
el.connect.addEventListener('click', connectPrinter);
el.disconnect.addEventListener('click', disconnectPrinter);
el.exportNiimbot.addEventListener('click', () => {
  exportPrinterLabels().catch((error) => {
    toast(error.message ?? t('Export impossible'), 'error');
  });
});
el.printLabel.addEventListener('click', () => {
  // Pendant une série, le même bouton arrête : on ne peut pas en lancer une
  // seconde par-dessus la première. C'était l'objet du regroupement — il n'y a
  // plus deux boutons dont l'un devient l'autre.
  if (seriesRunning) {
    seriesRunning = false;
    el.printStatus.textContent = t('Arrêt demandé : la série s\'arrête après l\'étiquette en cours.');
    return;
  }
  // `printLabels` attrape ses propres erreurs ; on protège malgré tout l'appel,
  // sans quoi un rejet deviendrait une promesse non traitée.
  printLabels().catch((error) => {
    toast(error.message ?? t('Impression impossible'), 'error');
  });
});

// L'échelle des pages est calculée en pixels au moment du rendu : sans ce
// rappel, une planche composée pour une grande fenêtre débordait après
// réduction, et gardait une petite échelle après agrandissement. Le délai
// regroupe les événements d'un redimensionnement continu.
/**
 * Observe la taille de l'aperçu, et non seulement celle de la fenêtre.
 *
 * Une barre de défilement qui apparaît retire une quinzaine de pixels à la
 * largeur utile **sans** provoquer d'événement `resize` sur la fenêtre : le
 * cadre gardait alors l'échelle du rendu précédent et dépassait la place
 * offerte de la largeur du défilement. Mesuré : 685 px dessinés pour 670 px
 * offerts.
 *
 * On ne redessine que si la largeur a réellement changé : `renderPreview`
 * remplace le contenu de l'aperçu, et un observateur naïf se rappellerait
 * lui-même.
 */
if (typeof ResizeObserver === 'function' && el.preview) {
  const observateur = new ResizeObserver(() => {
    if (Math.abs(previewViewportWidth() - largeurApercuRendue) < 1) return;
    clearTimeout(previewResizeTimer);
    previewResizeTimer = setTimeout(() => renderPreview(), 150);
  });
  observateur.observe(el.preview);
}

let previewResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(previewResizeTimer);
  previewResizeTimer = setTimeout(() => renderPreview(), 150);
});

window.addEventListener('beforeprint', () => {
  // Le rendu papier est préparé au clic ; un Ctrl+P direct n'aurait rien à
  // imprimer. On reconstruit donc à la volée si la racine est vide.
  if (el.printRoot.childElementCount === 0 && mode !== 'single') {
    const items = printableLinks();
    if (mode === 'table') {
      const config = tablePageConfig();
      applyPrintPageSize(config.widthMm, config.heightMm);
      el.printRoot.appendChild(buildTablePage(buildTable(items)));
    } else {
      for (const page of buildSheetPages(items)) el.printRoot.appendChild(page);
    }
  }
});

/**
 * Branche le sélecteur de langue de la barre supérieure.
 *
 * Le changement mémorise la langue puis recharge la page : tout est ainsi
 * rendu dans la bonne langue, y compris les libellés construits par le code.
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

// --- Démarrage ---

// La langue doit être connue avant de construire les listes : leurs libellés
// passent par `t()`.
await initI18n();
applyTranslations(document);
wireLocaleSwitcher();

fillPresets();
fillLabelForm();
fillProfiles();
fillShorteners();
fillTargets();
fillDateModes();
fillLabelChoices();

// Préférences retenues : avant le premier rendu, pour éviter un aller-retour
// visuel entre la valeur par défaut et celle de l'utilisateur.
/**
 * Les préférences courantes, relues après chaque écriture.
 *
 * `let` et non `const` : le tri change **en cours de session**, et tout ce qui
 * dépend de lui — l'ordre de la liste, la présence des flèches, la phrase sous le
 * sélecteur — doit le voir changer. Les autres réglages ne sont lus qu'au
 * chargement ou au moment de leur usage, d'où un seul objet réaffecté plutôt
 * qu'une relecture du stockage à chaque ligne.
 */
let preferences = settings.load();
el.shortener.value = preferences.shortener;
el.qrTarget.value = preferences.targetMode;
// Le nom par défaut suit la langue ; un nom saisi par l'utilisateur, non.
el.collectionName.value = preferences.collectionName === DEFAULT_SETTINGS.collectionName
  ? t(DEFAULT_SETTINGS.collectionName)
  : preferences.collectionName;
// Une note vide reste vide : elle n'a pas de valeur par défaut à traduire.
el.collectionNote.value = preferences.collectionNote;
el.collectionStart.value = String(preferences.startIndex);
applyCollectionName();
fillSortModes();
updateDateHint();

reportBluetoothSupport();
switchMode('sheet');
updateProfileHint();

// Un bandeau plutôt qu'un message transitoire : celui-ci serait recouvert par
// le message suivant, et un diagnostic qu'on ne lit pas ne sert à rien.
if (!stylesheetIsCurrent()) el.staleStyle.hidden = false;

if (storeKind === 'memory') {
  toast(t('Stockage temporaire : IndexedDB indisponible, les liens seront perdus'), 'error');
}

await refresh();
