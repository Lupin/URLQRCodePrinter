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
} from './core/link.js';
import { resolveDefaultStore } from './core/store.js';
import { ELEMENT_IDS } from './element-ids.js';
import { createSettingsStore, DEFAULT_SETTINGS, COLLECTION_NAME_MAX } from './core/settings.js';
import {
  SHORTENERS,
  findShortener,
  createShortener,
  describeShortenReport,
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
  presetToGrid,
  round1,
  qrRatioBounds,
  sheetTextMetrics,
  sheetCellLines,
  SHEET_CELL_MARGIN_MM,
  SHEET_QR_GAP_MM,
  SHEET_FONT_PT,
  MIN_MODULE_MM_PAPER,
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
let transport = null;
/** @type {NiimbotPrinter|null} */
let printer = null;
let toastTimer = null;
/** Objet-URL de l'aperçu d'étiquette, à révoquer avant chaque nouveau rendu. */
let labelPreviewUrl = null;
/** Préférences retenues d'une session à l'autre (service, cible du QR). */
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
    label: 'Texte droit, sous le QR',
    mode: 'stacked',
  },
  {
    id: 'dessus',
    label: 'Texte droit, au-dessus du QR',
    mode: 'stacked',
    textFirst: true,
  },
  {
    id: 'tourne',
    label: 'Texte tourné, se lit de bas en haut',
    // Sur un rouleau étroit, un texte droit ne dispose que de la largeur de la
    // tête moins le QR — quelques caractères. Tourné, il profite de la longueur.
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
    label: 'Texte à droite du QR',
    mode: 'lateral',
    // Cette disposition n'a de sens que si le QR laisse une vraie colonne :
    // sur une tête de 12 mm, il en reste quelques pixels. On ne la propose donc
    // que sur une tête large, plutôt que de laisser choisir une option vide.
    minHeadPx: 200,
  },
]);

/**
 * Les dispositions qui ont un sens pour un profil donné.
 *
 * Proposer « texte à droite » sur une tête de 12 mm n'avait aucun sens : le QR
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
const PRINT_SCOPES = Object.freeze([
  { id: 'all', label: 'Toute la collection' },
  { id: 'selected', label: 'Seulement ceux que je coche' },
]);


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
 * Construit l'aperçu SVG d'un QR code.
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
  const scope = el.printScope.value;
  const checked = links.filter((link) => selected.has(link.id)).length;
  const count = scope === 'selected' ? checked : links.length;
  const ready = links.length > 0 && Boolean(printer);

  el.printAllLabels.disabled = !ready || (scope === 'selected' && count === 0);

  // Le libellé dit toujours le nombre de liens **et** le nombre d'exemplaires :
  // « Imprimer la collection » alors que la quantité est à 2 ferait sortir deux
  // fois plus d'étiquettes que ce que la phrase laisse croire.
  const copies = seriesCopies();
  const total = count * copies;
  el.printAllLabels.textContent = total === 0
    ? t('Aucun lien à imprimer')
    : tpl(total, 'Imprimer {count} étiquette', 'Imprimer {count} étiquettes')
      + (copies > 1 ? ` (${tpl(count, '{count} lien', '{count} liens')} × ${copies})` : '');

  // La phrase dit ce qui est retenu, et pourquoi le bouton est inerte le cas
  // échéant : « Portée » seul ne disait pas ce qui allait sortir.
  el.printAllLabels.title = '';

  if (links.length === 0) {
    el.printScopeHint.textContent = t('Aucun lien dans la collection.');
    return;
  }
  if (scope === 'selected' && checked === 0) {
    el.printScopeHint.textContent = t(
      'Aucun lien coché : cochez les liens à imprimer dans la liste, ou choisissez « Toute la collection ».',
    );
    return;
  }
  const source = scope === 'selected'
    ? tpl(checked, '{count} lien coché', '{count} liens cochés')
    : t('les {count} liens de la collection', { count: links.length });
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
function seriesCopies() {
  const typed = Math.trunc(Number(el.printCopies.value));
  if (!Number.isFinite(typed) || typed < 1) return 1;
  return Math.min(typed, 20);
}

/** Recharge la collection depuis le stockage et redessine. */
async function refresh() {
  links = await store.list();
  linkRanks = new Map(links.map((link, index) => [link.id, index + 1]));
  fillLabelLinks();
  updatePrintScope();
  // Les colonnes « Tags » et « Note » ne sont proposées que si la collection en
  // contient : une colonne vide sur toute une page n'apprend rien.
  updateTableOptions();
  const ids = new Set(links.map((link) => link.id));
  // On conserve les cases cochées qui existent encore.
  selected = new Set([...selected].filter((id) => ids.has(id)));
  renderList();
  renderPreview();
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

  item.append(check, rank, body, linkEditor(link), remove);
  return item;
}

/**
 * Explique la sélection courante, et surtout ce qu'elle implique.
 *
 * La règle « aucune case cochée = toute la collection » est la moins devinable
 * de l'application : sans elle, « Tout décocher » ressemble à « n'imprimer
 * rien » alors que c'est « tout imprimer ». On l'écrit donc en toutes lettres,
 * et le bouton d'impression rappelle la portée.
 */
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

/** Reporte le nom de collection sur le titre de la page. */
function applyCollectionName() {
  document.title = `${collectionName()} — URLQRCodePrinter`;
}

/**
 * Les liens à imprimer, préparés pour la cible choisie.
 *
 * C'est le seul endroit où l'on décide si le QR code encode l'URL collectée ou
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
  const specs = {
    csv: { text: toCsv(links), ext: 'csv', mime: 'text/csv;charset=utf-8' },
    // Le titre du Markdown est le nom de la collection : ce que l'utilisateur a
    // nommé, et non un libellé choisi par le programme.
    md: {
      text: toMarkdown(links, { title: name }),
      ext: 'md',
      mime: 'text/markdown;charset=utf-8',
    },
    json: { text: toJson(links), ext: 'json', mime: 'application/json' },
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
    option.textContent = t(shortener.label);
    option.title = shortener.note;
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

  if (message !== '') {
    el.shortenStatus.textContent = message;
    return;
  }
  if (links.length === 0) {
    el.shortenStatus.textContent = '';
    return;
  }

  const scope = selected.size > 0
    ? tpl(selected.size, '{count} lien coché', '{count} liens cochés')
    : t('toute la collection');
  const done = shortened.length > 0
    ? tpl(shortened.length, ' — {count} raccourci en place', ' — {count} raccourcis en place')
    : '';
  el.shortenStatus.textContent = t(
    "{label} · {scope}{done}. L'URL complète est transmise au service.",
    { label: t(currentShortener().label), scope, done },
  );
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
    const summary = describeShortenReport(report);
    toast(summary, report.failed.length > 0 ? 'error' : 'info');
    updateShortenStatus(summary);
  } catch (error) {
    toast(t('Raccourcissement impossible : {message}', { message: error.message }), 'error');
    updateShortenStatus(error.message);
  } finally {
    shortenJob = null;
    el.shorten.textContent = t('Raccourcir');
    el.shorten.disabled = links.length === 0;
    updateTargetAvailability();
  }
}

/**
 * Remplit le choix de la cible du QR code.
 *
 * Deux possibilités seulement, et l'URL d'origine reste la valeur par défaut :
 * un lien raccourci dépend d'un tiers, ce n'est pas un choix à faire par
 * inadvertance.
 */
/** Remplit le choix de la date imprimée sous le QR code. */
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
 * Chaque ligne sous le QR se paie en place disponible : le dire évite de
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
  parties.push(t('Chaque ligne de plus réduit la place du QR code.'));
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
    ? t("Le QR code encode l'URL collectée.")
    : tpl(
      shortened,
      '{count} lien raccourci : un QR plus court se scanne plus vite et tient sur une plus petite étiquette.',
      '{count} liens raccourcis : un QR plus court se scanne plus vite et tient sur une plus petite étiquette.',
    );
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

  const columns = clampInt(el.sheetColumns.value, 1, 12, preset.declaredColumns);
  const rows = clampInt(el.sheetRows.value, 1, 30, preset.declaredRows);
  const marginXMm = Math.max(0, Number(el.sheetMarginX.value) || 0);
  const marginYMm = Math.max(0, Number(el.sheetMarginY.value) || 0);
  const gapXMm = Math.max(0, Number(el.sheetGapX.value) || 0);
  const gapYMm = Math.max(0, Number(el.sheetGapY.value) || 0);

  const grid = fitGrid({
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    columns,
    rows,
    marginXMm,
    marginYMm,
    gapXMm,
    gapYMm,
  });

  if (!grid.ok) {
    // On garde la disposition précédente plutôt que de produire une planche
    // impossible : le message dit quoi corriger.
    return { ...config, problem: grid.reason };
  }

  return {
    ...config,
    columns: grid.columns,
    rows: grid.rows,
    labelWidthMm: grid.labelWidthMm,
    labelHeightMm: grid.labelHeightMm,
    marginXMm: grid.marginXMm,
    marginYMm: grid.marginYMm,
    gapXMm,
    gapYMm,
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
  // sortait minuscule sous un QR qui occupait tout. Le champ reste modifiable.
  el.sheetFont.value = String(defaultSheetFontPt(preset, grid));
}

/**
 * Taille de texte par défaut pour une disposition, en points.
 *
 * Proportionnelle à la hauteur de l'étiquette : une étiquette deux fois plus
 * haute porte un texte deux fois plus grand. Bornée pour rester lisible et
 * laisser de la place au QR.
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
function buildSheetPages(items) {
  const config = sheetConfig();
  // Une grille issue de « remplir la feuille » occupe exactement la place
  // demandée : lui suggérer de resserrer les marges pour gagner une colonne
  // serait contredire le réglage de l'utilisateur.
  // La grille est toujours une consigne : on ne suggère pas de la densifier.
  const layout = computeSheet({ count: items.length, ...config, adviseDenser: false });
  const pages = paginate(items, layout);
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
  // lisible ; au-dessus, le QR chasse le texte hors de l'étiquette.
  // La date occupe une ligne à part entière : elle doit être comptée dans la
  // place que le QR doit laisser, sinon le curseur autoriserait un réglage qui
  // la rogne.
  const wantsDate = dateMode() !== 'none';
  // Lues **avant** d'être utilisées : `const` lue plus haut lève une
  // `ReferenceError`, et `buildSheetPages` s'arrêtait là — la planche restait
  // vierge, sans message.
  const veutIndex = el.sheetDateIndex.checked;
  // Le numéro et la date occupent chacun une ligne à part entière, en plus du
  // texte principal. Ils doivent être comptés dans la place que le QR laisse,
  // sinon le curseur autoriserait un réglage qui les rogne.
  const indexLignes = veutIndex ? 1 : 0;
  const dateLignes = wantsDate ? 1 : 0;
  const lignesHorsTexte = indexLignes + dateLignes;

  /**
   * Bornes du QR pour un nombre de lignes de texte donné.
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
    // laisse moins de place au QR, et la borne haute doit en tenir compte.
    fontSizePt: sheetFontPt(),
  });

  /**
   * Ce qui s'imprime sous le QR.
   *
   * Un titre absent laissait déjà la place à l'URL ; l'option l'ajoute au
   * titre. La même fonction sert au calcul des lignes réservées et au rendu :
   * deux expressions séparées auraient réservé un nombre de lignes qui ne
   * correspondait pas au texte réellement écrit.
   */
  const montreUrl = el.sheetUrl.checked;
  const texteSousLeQr = (item) => {
    const titre = typeof item.title === 'string' ? item.title.trim() : '';
    if (!montreUrl) return titre || item.url;
    return titre === '' ? item.url : `${titre} ${item.url}`;
  };

  // Combien de lignes le texte le plus long réclame-t-il à cette taille ?
  const mesurePlanche = cachedTextMeasure(metrics.fontSizePx);
  const largeurInterieurePx =
    ((layout.labelWidthMm - SHEET_CELL_MARGIN_MM * 2) * 96) / 25.4;
  const lignesNecessaires = encoded.flat().reduce((plus, entree) => {
    const texte = texteSousLeQr(entree.item);
    return Math.max(plus, sheetCellLines(texte, {
      measure: mesurePlanche,
      innerWidthPx: largeurInterieurePx,
      maxLines: 99,
    }).length);
  }, 1);

  // Ce que le format peut réellement offrir : c'est `textLinesAtMin` qui le dit,
  // puisque le QR ne descend pas sous la taille où ses modules restent lisibles.
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
  // La tolérance n'est pas cosmétique : la borne du QR est arrondie au millième
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

  // Les pages sont construites **avant** de composer le message : c'est la
  // construction qui découvre les dates écartées faute de largeur. Composer le
  // message plus tôt — ce qui était le cas — rendait cet avertissement
  // impossible à afficher.
  const built = pages.map((page) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'print-page';
    pageEl.style.width = `${layout.pageWidthMm}mm`;
    pageEl.style.height = `${layout.pageHeightMm}mm`;

    for (const { item, cell, matrix } of encoded[page.page]) {
      const cellEl = document.createElement('div');
      cellEl.className = 'print-cell';
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
 * C'est le détrompeur demandé : le curseur ne peut plus demander un QR qui ne
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
 * Décrit la taille du QR retenue et ce qu'elle implique.
 *
 * @param {{ bounds: object, side: number, modules: number, ratio: number, maxLines: number, metrics: object }} state
 */
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
    'QR de {side} mm ({module} mm par module, minimum {minimum} mm) — réglable de {range} — {lines} de texte.',
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
    ...(columns.qr ? ['QR'] : []),
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

/** Redessine l'aperçu selon le mode actif. */
function renderPreview() {
  const items = printableLinks().slice(0, 400);
  el.preview.textContent = '';
  el.print.disabled = items.length === 0;
  el.print.textContent = printLabel(items.length);
  // L'export du tableau suit la même portée que l'impression : la sélection et
  // les colonnes cochées. Sans colonne, il n'y a rien à exporter. Il ne se
  // montre que dans l'onglet Tableau, à côté d'« Imprimer ».
  el.exportTable.hidden = mode !== 'table';
  el.exportTable.disabled = items.length === 0 || !hasAnyTableColumn();
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
  const available = previewViewportWidth();
  const scale = Math.min(0.6, available / (widthMm * PX_PER_MM));

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

/** Aperçu de l'étiquette destinée à l'imprimante Niimbot. */
function renderSingleLabel(link) {
  if (labelPreviewUrl) {
    URL.revokeObjectURL(labelPreviewUrl);
    labelPreviewUrl = null;
  }

  if (!link) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = t('Sélectionnez un lien pour voir l\'étiquette.');
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
  // rendu agrandi par le navigateur interpolerait le QR et le rendrait flou.
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
  // Le rendu écran suit la place disponible : agrandi quand la tête est étroite
  // (96 px sur un D110), réduit quand elle est large (851 px sur un M3) — un
  // zoom minimal de 1 faisait déborder ce dernier du panneau.
  const available = Math.max(1, previewViewportWidth() - 20);
  const zoom = Math.min(4, available / shown.width);
  const displayWidth = Math.max(1, Math.round(shown.width * zoom));
  const displayHeight = Math.max(1, Math.round(shown.height * zoom));
  canvas.width = displayWidth;
  canvas.height = displayHeight;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.imageRendering = zoom < 1 ? 'auto' : 'pixelated';

  const ctx = canvas.getContext('2d');
  // À la réduction, un lissage garde le QR lisible ; à l'agrandissement, le plus
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
    ? t(' — texte empilé : le QR laisse trop peu de largeur pour une colonne de texte.')
    : (turns === 0 ? '' : t(' — orientation : {label}', { label: t(labelRotation().label) }));
  caption.textContent = (verdict.ok
    ? t('{profile} — {width} × {height} px, {px} px par module', {
      profile: profile.id,
      width: geometry.width,
      height: geometry.height,
      px: decimal(verdict.pxPerModule),
    })
    : t('{profile} — {reason}', { profile: profile.id, reason: t(verdict.reason) })) + orientationNote + dateNote;
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
  // Le QR encode la cible choisie — l'URL collectée ou son raccourci. Sans
  // cette résolution, l'étiquette ignorait le réglage : la liste affichait un
  // tinyurl que le QR n'encodait pas et que le texte n'imprimait pas non plus.
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
  // Le QR encode toujours l'URL du lien ; le texte imprimé, lui, suit le mode
  // choisi. Le mode « QR seul » n'a donc aucun texte à mesurer, d'où la sonde
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
  // QR code » des planches rendait la case sans effet tant qu'on n'y touchait
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
    // « Texte au-dessus » se décide à la composition : le texte précède le QR.
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
 * Le rendu se fait par plus proche voisin : un QR lissé devient illisible.
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

  // QR code, centré horizontalement.
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

  // La largeur réelle va de 12 mm à 104 mm : on met à l'échelle pour l'écran,
  // en gardant des proportions exactes et sans jamais dépasser la place
  // disponible — un minimum de 1 faisait déborder les formats larges.
  const available = Math.max(1, previewViewportWidth() - 20);
  const scale = Math.min(6, available / plan.widthPx);

  const frame = document.createElement('div');
  frame.className = 'preview__page';
  frame.style.padding = '10px';

  const shown = canvas;
  shown.style.width = `${Math.round(plan.widthPx * scale)}px`;
  shown.style.height = `${Math.round(plan.heightPx * scale)}px`;
  shown.style.imageRendering = scale < 1 ? 'auto' : 'pixelated';
  frame.appendChild(shown);

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
    : t('URL trop longue pour ce format : le QR fait {size} px pour {width} px de large.', {
      size: plan.qrSizePx,
      width: plan.widthPx,
    }))
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
 * Extrait de `printOneLabel` pour que l'impression en série s'en serve aussi :
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
async function printOneLabel() {
  if (!printer) {
    toast(t('Aucune imprimante connectée'), 'error');
    return;
  }

  const link = chosenLabelLink();
  if (!link) {
    toast(t('Aucun lien dans la collection'), 'error');
    return;
  }

  el.printLabel.disabled = true;
  el.printStatus.textContent = t('Composition de l\'étiquette…');

  try {
    el.printStatus.textContent = t('Envoi en cours…');
    const result = await sendLabel(link);
    el.printStatus.textContent = t('Étiquette imprimée : {rows} lignes, {frames} trames.', {
      rows: result.rows,
      frames: result.frames,
    });
  } catch (error) {
    el.printStatus.textContent = '';
    toast(error.message ?? t('Impression impossible'), 'error');
  } finally {
    el.printLabel.disabled = false;
  }
}

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

/** Nombre de lignes qu'une date peut occuper sous le QR, une fois découpée. */
const DATE_LINES_MAX = 2;

/** Vrai pendant une série : le bouton sert alors à l'interrompre. */
let seriesRunning = false;

async function printAllLabels() {
  if (!printer) {
    toast(t('Aucune imprimante connectée'), 'error');
    return;
  }
  if (links.length === 0) {
    toast(t('Aucun lien dans la collection'), 'error');
    return;
  }

  // La sélection vide vaut « tout » ailleurs dans l'application ; ici, la
  // portée est un choix explicite. Une sélection vide avec « la sélection
  // cochée » ne doit donc rien imprimer, et le dire, plutôt que de sortir
  // trente étiquettes que personne n'a demandées.
  const scope = el.printScope.value;
  const items = scope === 'selected'
    ? links.filter((link) => selected.has(link.id))
    : links;

  if (items.length === 0) {
    toast(t('Aucun lien coché : cochez les étiquettes à imprimer, ou choisissez « toute la collection »'), 'error');
    return;
  }

  const copies = seriesCopies();
  el.printLabel.disabled = true;
  el.printAllLabels.disabled = true;
  // Le bouton devient l'arrêt de la série : trente étiquettes lancées par
  // erreur ne doivent pas obliger à couper l'imprimante.
  el.printAllLabels.textContent = t('Arrêter la série');
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
        // La quantité est un réglage de la série : sans elle, impossible de
        // sortir deux exemplaires de chaque étiquette d'un seul geste.
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
    el.printLabel.disabled = false;
    el.printAllLabels.disabled = false;
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

  for (const scope of PRINT_SCOPES) {
    const option = document.createElement('option');
    option.value = scope.id;
    option.textContent = t(scope.label);
    el.printScope.appendChild(option);
  }
  el.printScope.value = 'all';
}

/** Vocabulaire de l'étiquette, plus explicite que celui de l'export. */
const LABEL_CONTENT_LABELS = Object.freeze({
  none: 'QR code seul',
  title: 'QR code + titre',
  url: 'QR code + URL',
  'title-url': 'QR code + titre + URL',
  host: 'QR code + domaine',
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

  for (const link of links) {
    const option = document.createElement('option');
    option.value = link.id;
    // Le rang est celui affiché dans la liste et le tableau : on s'y retrouve.
    option.textContent = `${linkRanks.get(link.id) ?? '?'}. `
      + (link.title || hostOf(link.url) || link.url);
    option.title = link.url;
    el.labelLink.appendChild(option);
  }

  if (links.some((link) => link.id === previous)) el.labelLink.value = previous;
  el.labelLink.disabled = links.length === 0;
  updateLabelContentHint();
}

/** Explique ce qui sera imprimé sous le QR, d'après les cases cochées. */
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
    el.labelContentHint.textContent = t('Le QR code seul, sans texte sous lui.');
    return;
  }
  el.labelContentHint.textContent = t(
    'Sous le QR : {list}. Le texte est découpé à la largeur de la tête.',
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
 * La disposition retenue : comment le QR et son texte s'organisent.
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

/** Le lien choisi pour l'impression d'une étiquette. */
function chosenLabelLink() {
  if (links.length === 0) return undefined;
  return links.find((link) => link.id === el.labelLink.value) ?? links[0];
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

el.collectionName.addEventListener('input', () => {
  applyCollectionName();
  // Enregistré à la volée : le nom se retape rarement, mais le perdre serait
  // agaçant, et ce champ n'appartient à aucun formulaire.
  settings.save({ collectionName: collectionName() });
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
 * Exporte un classeur `.xlsx` avec les QR codes intégrés.
 *
 * Un CSV ne peut pas transporter d'image : c'est tout l'intérêt de cet export.
 * La génération des QR prend un instant par lien, d'où le retour sur le bouton.
 */
async function exportSpreadsheet() {
  if (links.length === 0) return;

  const label = el.exportXlsx.textContent;
  el.exportXlsx.disabled = true;
  el.exportXlsx.textContent = t('Génération…');

  try {
    const bytes = await buildLinkSpreadsheet(resolveTargets(links, el.qrTarget.value), {
      onProgress: (done, total) => {
        el.exportXlsx.textContent = t('QR {done}/{total}…', { done, total });
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
 * tableau, avec ses QR codes prêts à l'emploi.
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
      rankOf: (link, index) => linkRanks.get(link.id) ?? index + 1,
      onProgress: (done, total) => {
        el.exportTable.textContent = t('QR {done}/{total}…', { done, total });
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

el.exportXlsx.addEventListener('click', exportSpreadsheet);
el.exportCsv.addEventListener('click', () => exportAs('csv'));
el.exportMd.addEventListener('click', () => exportAs('md'));
el.exportJson.addEventListener('click', () => exportAs('json'));
el.exportTable.addEventListener('click', exportTableArchive);

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

el.preset.addEventListener('change', () => {
  prefillGridFields();
  renderPreview();
});
for (const field of [
  el.sheetColumns, el.sheetRows,
  el.sheetMarginX, el.sheetMarginY,
  el.sheetGapX, el.sheetGapY,
]) {
  field.addEventListener('input', renderPreview);
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
el.labelFontSize.addEventListener('input', renderPreview);
// Les réglages de page du tableau se répercutent sur l'aperçu.
for (const node of [
  el.tableOrientation, el.tableMarginX, el.tableMarginY,
]) {
  node.addEventListener('input', renderPreview);
  node.addEventListener('change', renderPreview);
}
for (const box of [el.tableTitle, el.tableTitleDate]) {
  box.addEventListener('change', renderPreview);
}
el.printScope.addEventListener('change', updatePrintScope);
el.printCopies.addEventListener('input', updatePrintScope);
el.labelLink.addEventListener('change', renderPreview);
el.labelFormat.addEventListener('change', renderPreview);
el.labelText.addEventListener('change', renderPreview);
el.labelMargin.addEventListener('input', renderPreview);
el.labelFont.addEventListener('input', renderPreview);
el.labelCut.addEventListener('change', renderPreview);
el.exportLabels.addEventListener('click', exportLabelImages);
el.print.addEventListener('click', printSelection);
el.connect.addEventListener('click', connectPrinter);
el.disconnect.addEventListener('click', disconnectPrinter);
el.printLabel.addEventListener('click', printOneLabel);
el.printAllLabels.addEventListener('click', () => {
  // Pendant une série, le même bouton arrête : on ne peut pas en lancer une
  // seconde par-dessus la première.
  if (seriesRunning) {
    seriesRunning = false;
    el.printStatus.textContent = t('Arrêt demandé : la série s\'arrête après l\'étiquette en cours.');
    return;
  }
  // `printAllLabels` attrape ses propres erreurs ; on protège malgré tout
  // l'appel, sans quoi un rejet deviendrait une promesse non traitée.
  printAllLabels().catch((error) => {
    toast(error.message ?? t('Impression impossible'), 'error');
  });
});

// L'échelle des pages est calculée en pixels au moment du rendu : sans ce
// rappel, une planche composée pour une grande fenêtre débordait après
// réduction, et gardait une petite échelle après agrandissement. Le délai
// regroupe les événements d'un redimensionnement continu.
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
const preferences = settings.load();
el.shortener.value = preferences.shortener;
el.qrTarget.value = preferences.targetMode;
// Le nom par défaut suit la langue ; un nom saisi par l'utilisateur, non.
el.collectionName.value = preferences.collectionName === DEFAULT_SETTINGS.collectionName
  ? t(DEFAULT_SETTINGS.collectionName)
  : preferences.collectionName;
applyCollectionName();
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
