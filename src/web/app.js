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

import { createLink, hostOf, hasShortUrl, safeHref, resolveTargets } from './core/link.js';
import { resolveDefaultStore } from './core/store.js';
import { ELEMENT_IDS } from './element-ids.js';
import { createSettingsStore } from './core/settings.js';
import {
  SHORTENERS,
  findShortener,
  createShortener,
  describeShortenReport,
} from './core/shorten.js';
import { encodeQr, toSvg } from './core/qr.js';
import { computeLabelGeometry, drawLabel, checkQrLegibility } from './core/label.js';
import { imageDataToMono, validateBitmap } from './core/raster.js';
import { SHEET_PRESETS, PAGE_SIZES, computeSheet, paginate } from './core/sheet.js';
import { toCsv, toMarkdown, toJson, parseJsonExport, exportFilename } from './core/exporters.js';
import { downloadText, downloadBytes } from './core/download.js';
import { buildLinkSpreadsheet } from './core/spreadsheet.js';
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
import {
  checkWebBluetoothSupport,
  requestPrinter,
  NiimbotTransport,
} from './core/printer/transport.js';
import { NiimbotPrinter } from './core/printer/printer.js';

const PX_PER_MM = 96 / 25.4;

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
  const svg = toSvg(encodeQr(url, { ecc, border }), { scale });
  const wrapper = document.createElement('div');
  wrapper.innerHTML = svg;
  return wrapper.firstElementChild;
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

/** Recharge la collection depuis le stockage et redessine. */
async function refresh() {
  links = await store.list();
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
    ? 'Aucun lien. Ajoutez-en un ci-dessus, importez une archive, ou utilisez l\'extension navigateur.'
    : 'Aucun lien ne correspond à la recherche.';

  el.count.textContent = `${links.length} lien${links.length > 1 ? 's' : ''}`;

  const hasLinks = links.length > 0;
  el.exportXlsx.disabled = !hasLinks;
  el.exportCsv.disabled = !hasLinks;
  el.exportMd.disabled = !hasLinks;
  el.exportJson.disabled = !hasLinks;
  el.clear.disabled = !hasLinks;
  el.shorten.disabled = !hasLinks;
  updateShortenStatus();
  updateTargetAvailability();

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
  check.setAttribute('aria-label', `Sélectionner ${link.title || link.url}`);
  check.addEventListener('change', () => {
    if (check.checked) selected.add(link.id);
    else selected.delete(link.id);
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

  if (link.tags.length) {
    const tags = document.createElement('div');
    tags.className = 'link__tags';
    for (const tag of link.tags) {
      const chip = document.createElement('span');
      chip.className = 'tag';
      chip.textContent = `#${tag}`;
      tags.appendChild(chip);
    }
    body.appendChild(tags);
  }

  const remove = button('×', 'link__remove', async () => {
    await store.remove(link.id);
    selected.delete(link.id);
    await refresh();
    toast('Lien supprimé');
  });
  remove.setAttribute('aria-label', `Supprimer ${link.title || link.url}`);

  item.append(check, body, remove);
  return item;
}

/** L'ensemble des liens actuellement sélectionnés, dans l'ordre d'affichage. */
function selectedLinks() {
  const picked = links.filter((link) => selected.has(link.id));
  // Sans sélection explicite, tout est imprimé : c'est l'intention la plus
  // probable quand on clique « Imprimer ».
  return picked.length > 0 ? picked : links;
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
    el.addError.textContent = 'Saisissez une URL.';
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
  toast(duplicate ? 'Ce lien est déjà dans la collection' : 'Lien ajouté');
}

/**
 * Exporte la collection.
 * @param {'csv'|'md'|'json'} format
 */
function exportAs(format) {
  if (links.length === 0) return;

  const specs = {
    csv: { text: toCsv(links), ext: 'csv', mime: 'text/csv;charset=utf-8' },
    md: { text: toMarkdown(links), ext: 'md', mime: 'text/markdown;charset=utf-8' },
    json: { text: toJson(links), ext: 'json', mime: 'application/json' },
  };
  const spec = specs[format];
  const filename = exportFilename('liens-qr', spec.ext);

  const ok = downloadText(filename, spec.text, { mime: spec.mime });
  toast(ok ? `${filename} enregistré` : 'Téléchargement impossible', ok ? 'info' : 'error');
}

/**
 * Importe une archive JSON.
 * @param {File} file
 */
async function importArchive(file) {
  try {
    const records = parseJsonExport(await file.text());
    let added = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        const { duplicate } = await store.add(
          { ...record, source: 'import' },
          { allowDuplicate: false },
        );
        if (duplicate) skipped++;
        else added++;
      } catch {
        skipped++;
      }
    }

    await refresh();
    toast(`${added} lien${added > 1 ? 's' : ''} importé${added > 1 ? 's' : ''}` +
      (skipped ? `, ${skipped} ignoré${skipped > 1 ? 's' : ''}` : ''));
  } catch (error) {
    toast(`Import impossible : ${error.message}`, 'error');
  }
}

// ---------------------------------------------------------------------------
// Raccourcissement d'URL
// ---------------------------------------------------------------------------

/**
 * Remplit la liste des services de raccourcissement.
 *
 * L'URL complète est transmise au service choisi : c'est une décision qui
 * appartient à l'utilisateur, donc rien n'est coché ni déclenché d'avance.
 */
function fillShorteners() {
  el.shortener.textContent = '';
  for (const shortener of SHORTENERS) {
    const option = document.createElement('option');
    option.value = shortener.id;
    option.textContent = shortener.name;
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
    ? `${selected.size} lien${selected.size > 1 ? 's' : ''} coché${selected.size > 1 ? 's' : ''}`
    : 'toute la collection';
  const done = shortened.length > 0
    ? ` — ${shortened.length} raccourci${shortened.length > 1 ? 's' : ''} en place`
    : '';
  el.shortenStatus.textContent =
    `${currentShortener().name} · ${scope}${done}. L'URL complète est transmise au service.`;
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
    updateShortenStatus('Tous les liens visés sont déjà raccourcis.');
    return;
  }

  const shortener = createShortener({ provider: el.shortener.value });
  const controller = new AbortController();
  shortenJob = controller;

  el.shorten.disabled = false;
  el.shorten.textContent = 'Annuler';
  toast(`Raccourcissement via ${shortener.provider.name}…`);

  try {
    const report = await shortener.shortenMany(targets, {
      signal: controller.signal,
      onProgress: (done, total) => {
        updateShortenStatus(`${shortener.provider.name} · ${done}/${total}…`);
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
    toast(`Raccourcissement impossible : ${error.message}`, 'error');
    updateShortenStatus(error.message);
  } finally {
    shortenJob = null;
    el.shorten.textContent = 'Raccourcir';
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
function fillTargets() {
  const choices = [
    { value: 'original', label: "L'URL collectée" },
    { value: 'short', label: 'Le lien raccourci' },
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
    ? "Le QR code encode l'URL collectée."
    : `${shortened} lien${shortened > 1 ? 's' : ''} raccourci${shortened > 1 ? 's' : ''} : `
      + 'un QR plus court se scanne plus vite et tient sur une plus petite étiquette.';
}

/** Retire les raccourcis : les URL d'origine n'ont jamais bougé. */
async function clearShortUrls() {
  const shortened = links.filter(hasShortUrl);
  if (shortened.length === 0) return;

  for (const link of shortened) {
    await store.put({ ...link, shortUrl: '', shortProvider: '', shortenedAt: 0 });
  }
  await refresh();
  toast(`${shortened.length} raccourci${shortened.length > 1 ? 's' : ''} retiré${shortened.length > 1 ? 's' : ''}`);
}

// ---------------------------------------------------------------------------
// Aperçu papier
// ---------------------------------------------------------------------------

/** Configuration de la planche à partir du formulaire. */
function sheetConfig() {
  const preset = SHEET_PRESETS[el.preset.value] ?? SHEET_PRESETS['a4-3x8'];
  return {
    ...preset,
    qrSizeRatio: Number(el.sheetQr.value) / 100,
  };
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
  const layout = computeSheet({ count: items.length, ...config });
  const pages = paginate(items, layout);

  el.sheetInfo.textContent = layout.perPage > 0
    ? `${layout.columns} × ${layout.rows} = ${layout.perPage} étiquettes par page, ` +
      `${layout.pages} page${layout.pages > 1 ? 's' : ''}` +
      (layout.warnings.length ? ` — ${layout.warnings.join(' ')}` : '')
    : layout.warnings.join(' ');

  return pages.map((page) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'print-page';
    pageEl.style.width = `${layout.pageWidthMm}mm`;
    pageEl.style.height = `${layout.pageHeightMm}mm`;

    for (const { item, cell } of page.items) {
      const cellEl = document.createElement('div');
      cellEl.className = 'print-cell';
      cellEl.style.left = `${cell.xMm}mm`;
      cellEl.style.top = `${cell.yMm}mm`;
      cellEl.style.width = `${layout.labelWidthMm}mm`;
      cellEl.style.height = `${layout.labelHeightMm}mm`;

      const qrBox = document.createElement('div');
      qrBox.className = 'print-cell__qr';
      const side = Math.min(layout.labelWidthMm, layout.labelHeightMm) * config.qrSizeRatio;
      qrBox.style.width = `${side}mm`;
      qrBox.appendChild(qrElement(item.url));

      const text = document.createElement('div');
      text.className = 'print-cell__text';
      text.textContent = item.title || item.url;

      cellEl.append(qrBox, text);
      pageEl.appendChild(cellEl);
    }

    return pageEl;
  });
}

/**
 * Construit le tableau imprimable.
 * @param {import('./core/link.js').LinkRecord[]} items
 * @returns {HTMLElement}
 */
function buildTable(items) {
  const size = Number(el.tableQr.value);
  const withNote = el.tableNote.checked;

  const table = document.createElement('table');
  table.className = 'print-table';

  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['N°', 'QR', 'URL', 'Titre', ...(withNote ? ['Note'] : [])]) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  }
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement('tbody');
  items.forEach((link, index) => {
    const row = document.createElement('tr');

    const num = document.createElement('td');
    num.textContent = String(index + 1);

    const qrCell = document.createElement('td');
    qrCell.className = 'print-table__qr';
    const svg = qrElement(link.url, { border: 1 });
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    qrCell.appendChild(svg);

    const urlCell = document.createElement('td');
    urlCell.textContent = link.url;

    const titleCell = document.createElement('td');
    titleCell.textContent = link.title;

    row.append(num, qrCell, urlCell, titleCell);

    if (withNote) {
      const noteCell = document.createElement('td');
      noteCell.textContent = link.note;
      row.appendChild(noteCell);
    }

    body.appendChild(row);
  });

  table.appendChild(body);
  return table;
}

/** Redessine l'aperçu selon le mode actif. */
function renderPreview() {
  const items = printableLinks().slice(0, 400);
  el.preview.textContent = '';
  el.print.disabled = items.length === 0;

  if (mode === 'single') {
    el.print.hidden = true;
    renderSingleLabel(items[0]);
    return;
  }

  if (mode === 'images') {
    // L'export d'images ne passe pas par la boîte d'impression : il produit des
    // fichiers, utilisables avec n'importe quelle étiqueteuse.
    el.print.hidden = true;
    el.exportLabels.disabled = items.length === 0;
    renderImagePreview(items[0]);
    return;
  }

  el.print.hidden = false;

  if (items.length === 0) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Ajoutez des liens pour voir un aperçu.';
    el.preview.appendChild(note);
    return;
  }

  if (mode === 'table') {
    const scaler = document.createElement('div');
    scaler.className = 'preview__page';
    scaler.appendChild(buildTable(items));
    el.preview.appendChild(scaler);
    return;
  }

  // Planche : on affiche les deux premières pages, à l'échelle.
  for (const page of buildSheetPages(items).slice(0, 2)) {
    el.preview.appendChild(scaleForScreen(page));
  }
}

/**
 * Met une page en millimètres à l'échelle de l'aperçu.
 * @param {HTMLElement} page
 * @returns {HTMLElement}
 */
function scaleForScreen(page) {
  const widthMm = Number.parseFloat(page.style.width);
  const heightMm = Number.parseFloat(page.style.height);
  const available = Math.max(280, el.preview.clientWidth - 40);
  const scale = Math.min(0.6, available / (widthMm * PX_PER_MM));

  const wrapper = document.createElement('div');
  wrapper.style.width = `${widthMm * PX_PER_MM * scale}px`;
  wrapper.style.height = `${heightMm * PX_PER_MM * scale}px`;

  const inner = document.createElement('div');
  inner.className = 'preview__page';
  inner.style.width = `${widthMm}mm`;
  inner.style.height = `${heightMm}mm`;
  inner.style.transform = `scale(${scale})`;
  inner.style.transformOrigin = 'top left';
  inner.style.padding = '0';

  while (page.firstChild) inner.appendChild(page.firstChild);
  wrapper.appendChild(inner);
  return wrapper;
}

/** Aperçu de l'étiquette destinée à l'imprimante Niimbot. */
function renderSingleLabel(link) {
  if (labelPreviewUrl) {
    URL.revokeObjectURL(labelPreviewUrl);
    labelPreviewUrl = null;
  }

  if (!link || !printer?.profile) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = printer?.profile
      ? 'Sélectionnez un lien pour voir l\'étiquette.'
      : 'Connectez une imprimante pour composer l\'étiquette.';
    el.preview.appendChild(note);
    return;
  }

  const { geometry, verdict } = composeLabel(link, printer.profile);

  const frame = document.createElement('div');
  frame.className = 'preview__page';
  frame.style.padding = '10px';

  const canvas = document.createElement('canvas');
  // Le rendu écran est agrandi : la tête ne fait que 96 px de large.
  const zoom = Math.max(1, Math.floor(280 / geometry.width));
  canvas.width = geometry.width * zoom;
  canvas.height = geometry.height * zoom;
  canvas.style.width = `${geometry.width * zoom}px`;
  canvas.style.imageRendering = 'pixelated';

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawLabel(ctx, geometry, {
    title: link.title,
    showTitle: el.showTitle.checked,
    url: link.url,
  });

  frame.appendChild(canvas);

  const caption = document.createElement('p');
  caption.className = 'hint';
  caption.textContent = verdict.ok
    ? `${geometry.width} × ${geometry.height} px — ${verdict.pxPerModule.toFixed(1)} px par module`
    : verdict.reason;
  if (!verdict.ok) caption.style.color = 'var(--danger)';
  frame.appendChild(caption);

  el.preview.appendChild(frame);
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
  const geometry = computeLabelGeometry({
    text: link.url,
    widthPx: profile.printheadPixels,
    dpi: profile.dpi,
    ecc: 'M',
  });
  return { geometry, verdict: checkQrLegibility(geometry) };
}

/**
 * Rend l'étiquette d'un lien en bitmap monochrome.
 * @param {import('./core/link.js').LinkRecord} link
 * @param {import('./core/printer/profiles.js').PrinterProfile} profile
 * @returns {{ bitmap: object, verdict: object }}
 */
function labelToBitmap(link, profile) {
  const { geometry, verdict } = composeLabel(link, profile);

  const canvas = document.createElement('canvas');
  canvas.width = geometry.width;
  canvas.height = geometry.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  drawLabel(ctx, geometry, {
    title: link.title,
    showTitle: el.showTitle.checked,
    url: link.url,
  });

  const imageData = ctx.getImageData(0, 0, geometry.width, geometry.height);
  return { bitmap: imageDataToMono(imageData, { threshold: 128 }), verdict, geometry };
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

/**
 * Lit les préférences de mise en page du formulaire.
 * @returns {{ format: object, textMode: string, marginMm: number, fontSizePt: number, cutMarks: boolean }}
 */
function readLabelOptions() {
  return {
    format: findFormat(el.labelFormat.value),
    textMode: el.labelText.value,
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
  if (!blob) throw new Error('Le navigateur n\'a pas pu encoder l\'image.');
  return { png: new Uint8Array(await blob.arrayBuffer()), plan };
}

/** Aperçu de la première étiquette sélectionnée. */
function renderImagePreview(link) {
  if (!link) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Ajoutez des liens pour voir un aperçu.';
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
    marginMm: options.marginMm,
    fontSizePt: options.fontSizePt,
  });

  const canvas = document.createElement('canvas');
  canvas.width = plan.widthPx;
  canvas.height = plan.heightPx;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawLabelCanvas(ctx, plan, link.url, { cutMarks: options.cutMarks });

  // La largeur réelle va de 12 mm à 70 mm : on met à l'échelle pour l'écran,
  // en gardant des proportions exactes.
  const scale = Math.min(6, Math.max(1, Math.floor(260 / plan.widthPx)));

  const frame = document.createElement('div');
  frame.className = 'preview__page';
  frame.style.padding = '10px';

  const shown = canvas;
  shown.style.width = `${plan.widthPx * scale}px`;
  shown.style.height = `${plan.heightPx * scale}px`;
  shown.style.imageRendering = 'pixelated';
  frame.appendChild(shown);

  const caption = document.createElement('p');
  caption.className = 'hint';
  caption.textContent = plan.fits
    ? `${options.format.widthMm} mm × ${plan.heightPx} px — ${plan.widthPx} × ${plan.heightPx} px à ${options.format.dpi} dpi`
    : `URL trop longue pour ce format : le QR fait ${plan.qrSizePx} px pour ${plan.widthPx} px de large.`;
  if (!plan.fits) caption.style.color = 'var(--danger)';
  frame.appendChild(caption);

  el.preview.appendChild(frame);
}

/** Exporte le dossier d'images prêt à imprimer. */
async function exportLabelImages() {
  const items = printableLinks();
  if (items.length === 0) return;

  const options = readLabelOptions();
  const label = el.exportLabels.textContent;
  el.exportLabels.disabled = true;

  try {
    const planned = planLabels(items, {
      format: options.format,
      textMode: options.textMode,
      marginMm: options.marginMm,
      fontSizePt: options.fontSizePt,
      measure: createTextMeasure(
        Math.max(6, ptToPx(options.fontSizePt, options.format.dpi)),
      ),
    });

    const images = new Map();
    for (const [index, entry] of planned.entries()) {
      el.exportLabels.textContent = `Étiquette ${index + 1}/${planned.length}…`;
      const { png } = await renderLabelPng(entry.link, options);
      images.set(entry.fileName, png);
    }

    el.exportLabels.textContent = 'Assemblage…';
    const archive = buildLabelArchive({
      planned,
      images,
      settings: { ...options, title: 'Mes liens' },
    });

    const filename = labelArchiveName();
    const ok = downloadBytes(filename, archive, { mime: 'application/zip' });
    toast(
      ok
        ? `${planned.length} étiquette${planned.length > 1 ? 's' : ''} — ${filename} enregistré`
        : 'Téléchargement impossible',
      ok ? 'info' : 'error',
    );
  } catch (error) {
    toast(`Export impossible : ${error.message}`, 'error');
  } finally {
    el.exportLabels.textContent = label;
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
    toast('Aucun lien à imprimer', 'error');
    return;
  }

  el.printRoot.textContent = '';

  if (mode === 'table') {
    const page = document.createElement('div');
    page.className = 'print-page';
    page.style.position = 'static';
    page.appendChild(buildTable(items));
    el.printRoot.appendChild(page);
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
function reportBluetoothSupport() {
  const support = checkWebBluetoothSupport();
  el.connect.disabled = !support.ok;

  if (!support.ok) {
    el.bleSupport.hidden = false;
    el.bleSupport.textContent = `${support.reason} ${support.hint}`;
  } else {
    el.bleSupport.hidden = true;
  }
}

/** Ouvre le sélecteur puis établit la session d'impression. */
async function connectPrinter() {
  el.connect.disabled = true;
  el.printStatus.textContent = 'Recherche de l\'imprimante…';

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
      modelId !== null ? `modèle ${modelId}` : 'modèle non rapporté',
      `${profile.printheadPixels} px de tête`,
    ];
    if (reportedHeadPixels !== null) details.push(`largeur mesurée ${reportedHeadPixels} px`);
    el.printStatus.textContent = `Connecté : ${details.join(', ')}.`;

    device.addEventListener('gattserverdisconnected', handlePrinterLost);
    renderPreview();
  } catch (error) {
    el.printStatus.textContent = '';
    toast(error.message ?? 'Connexion impossible', 'error');
    resetPrinter();
  } finally {
    el.connect.disabled = false;
  }
}

/** L'imprimante s'éteint en veille : on remet l'interface en cohérence. */
function handlePrinterLost() {
  toast('Imprimante déconnectée', 'error');
  resetPrinter();
  renderPreview();
}

/** Réinitialise l'état d'impression. */
function resetPrinter() {
  transport = null;
  printer = null;
  el.printerDot.className = 'dot dot--off';
  el.printerName.textContent = 'Aucune imprimante connectée';
  el.connect.hidden = false;
  el.disconnect.hidden = true;
  el.printLabel.disabled = true;
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
async function printOneLabel() {
  if (!printer) {
    toast('Aucune imprimante connectée', 'error');
    return;
  }

  const [link] = printableLinks();
  if (!link) {
    toast('Aucun lien sélectionné', 'error');
    return;
  }

  el.printLabel.disabled = true;
  el.printStatus.textContent = 'Composition de l\'étiquette…';

  try {
    const { bitmap, verdict, geometry } = labelToBitmap(link, printer.profile);
    const validation = validateBitmap(bitmap, printer.profile);
    if (!validation.ok) {
      throw new Error(validation.reasons.join(' ; '));
    }
    if (!verdict.ok) {
      // On avertit sans bloquer : l'utilisateur reste maître de son impression.
      toast(verdict.reason, 'error');
    }

    el.printStatus.textContent =
      `Envoi de ${geometry.width} × ${geometry.height} px…`;

    const copies = Number(el.copies.value) || 1;
    const density = Number(el.density.value) || printer.profile.density.default;

    const result = await printer.print(bitmap, {
      density,
      copies,
      onProgress: ({ page }) => {
        el.printStatus.textContent = `Impression ${page}/${copies}…`;
      },
    });

    el.printStatus.textContent =
      `Étiquette imprimée : ${result.rows} lignes, ${result.frames} trames.`;
  } catch (error) {
    el.printStatus.textContent = '';
    toast(error.message ?? 'Impression impossible', 'error');
  } finally {
    el.printLabel.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Câblage
// ---------------------------------------------------------------------------

function fillPresets() {
  for (const [key, preset] of Object.entries(SHEET_PRESETS)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = preset.label;
    el.preset.appendChild(option);
  }
  el.preset.value = 'a4-3x8';
}

/** Remplit les listes de formats et de modes de texte. */
function fillLabelForm() {
  for (const format of LABEL_FORMATS) {
    const option = document.createElement('option');
    option.value = format.id;
    option.textContent = format.name;
    el.labelFormat.appendChild(option);
  }
  el.labelFormat.value = 'niimbot-d110';

  for (const [id, label] of Object.entries(TEXT_MODES)) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = label;
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

el.selectAll.addEventListener('click', () => {
  selected = new Set(links.map((link) => link.id));
  renderList();
  renderPreview();
});

el.selectNone.addEventListener('click', () => {
  // Une sélection vide signifie « tout » à l'impression ; on le dit clairement.
  selected = new Set();
  renderList();
  renderPreview();
  toast('Sélection vidée : l\'impression portera sur toute la collection');
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
  el.exportXlsx.textContent = 'Génération…';

  try {
    const bytes = await buildLinkSpreadsheet(resolveTargets(links, el.qrTarget.value), {
      onProgress: (done, total) => {
        el.exportXlsx.textContent = `QR ${done}/${total}…`;
      },
    });
    const filename = exportFilename('liens-qr', 'xlsx');
    const ok = downloadBytes(filename, bytes, {
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    toast(ok ? `${filename} enregistré` : 'Téléchargement impossible', ok ? 'info' : 'error');
  } catch (error) {
    toast(`Export impossible : ${error.message}`, 'error');
  } finally {
    el.exportXlsx.textContent = label;
    el.exportXlsx.disabled = links.length === 0;
  }
}

el.exportXlsx.addEventListener('click', exportSpreadsheet);
el.exportCsv.addEventListener('click', () => exportAs('csv'));
el.exportMd.addEventListener('click', () => exportAs('md'));
el.exportJson.addEventListener('click', () => exportAs('json'));

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
  toast('Collection vidée');
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
el.qrTarget.addEventListener('change', () => {
  settings.save({ targetMode: el.qrTarget.value });
  updateTargetAvailability();
  renderPreview();
});

el.preset.addEventListener('change', renderPreview);
el.sheetQr.addEventListener('input', renderPreview);
el.tableQr.addEventListener('input', renderPreview);
el.tableNote.addEventListener('change', renderPreview);
el.showTitle.addEventListener('change', renderPreview);
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

window.addEventListener('beforeprint', () => {
  // Le rendu papier est préparé au clic ; un Ctrl+P direct n'aurait rien à
  // imprimer. On reconstruit donc à la volée si la racine est vide.
  if (el.printRoot.childElementCount === 0 && mode !== 'single') {
    const items = printableLinks();
    if (mode === 'table') {
      const page = document.createElement('div');
      page.className = 'print-page';
      page.style.position = 'static';
      page.appendChild(buildTable(items));
      el.printRoot.appendChild(page);
    } else {
      for (const page of buildSheetPages(items)) el.printRoot.appendChild(page);
    }
  }
});

// --- Démarrage ---

fillPresets();
fillLabelForm();
fillShorteners();
fillTargets();

// Préférences retenues : avant le premier rendu, pour éviter un aller-retour
// visuel entre la valeur par défaut et celle de l'utilisateur.
const preferences = settings.load();
el.shortener.value = preferences.shortener;
el.qrTarget.value = preferences.targetMode;

reportBluetoothSupport();
switchMode('sheet');

if (storeKind === 'memory') {
  toast('Stockage temporaire : IndexedDB indisponible, les liens seront perdus', 'error');
}

await refresh();
