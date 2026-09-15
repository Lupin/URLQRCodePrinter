/**
 * Fenêtre de l'extension.
 *
 * Deux précautions structurantes :
 *
 * - **Aucun `innerHTML` avec des données de page.** Les titres proviennent de
 *   sites tiers ; les injecter comme HTML dans une page d'extension, qui
 *   dispose de privilèges, ouvrirait une faille. Tout passe par `textContent`
 *   et `createElement`.
 * - **L'URL de l'onglet peut être absente.** `activeTab` n'est accordé qu'à
 *   l'invocation de l'extension, et Safari ne le garantit pas de la même
 *   façon. L'absence est traitée comme un cas normal, pas comme une erreur.
 */

import { createChromeStorageStore } from './core/store.js';
import { captureFromTab } from './core/capture.js';
import { toCsv, toMarkdown, exportFilename } from './core/exporters.js';
import { downloadText } from './core/download.js';
import { hostOf } from './core/link.js';
import { resolveApi, readTabContext } from './api.js';

const api = resolveApi();
const store = createChromeStorageStore({ area: api?.storage?.local });

const el = {
  count: document.getElementById('count'),
  currentTab: document.getElementById('current-tab'),
  addCurrent: document.getElementById('add-current'),
  list: document.getElementById('list'),
  empty: document.getElementById('empty'),
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
    const [found] = await api.tabs.query({ active: true, currentWindow: true });
    tab = found ?? null;
  } catch {
    tab = null;
  }

  const context = await readTabContext(api, tab);
  activeTab = context ? { url: context.url, title: context.title } : {};

  const capture = captureFromTab(activeTab);
  if (capture) {
    el.currentTab.textContent = capture.title || capture.url;
    el.currentTab.title = capture.url;
    el.addCurrent.disabled = false;
  } else {
    el.currentTab.textContent = 'Cette page ne peut pas être enregistrée.';
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

  el.count.textContent = String(links.length);
  el.list.textContent = '';

  const hasLinks = links.length > 0;
  el.empty.hidden = hasLinks;
  el.exportCsv.disabled = !hasLinks;
  el.exportMd.disabled = !hasLinks;
  el.clear.disabled = !hasLinks;

  for (const link of links) {
    el.list.appendChild(renderItem(link));
  }
}

/**
 * Construit une ligne de la liste.
 * @param {import('./core/link.js').LinkRecord} link
 * @returns {HTMLLIElement}
 */
function renderItem(link) {
  const item = document.createElement('li');
  item.className = 'item';

  const body = document.createElement('div');
  body.className = 'item__body';

  const title = document.createElement('span');
  title.className = 'item__title';
  title.textContent = link.title || hostOf(link.url) || link.url;
  title.title = link.url;

  const url = document.createElement('span');
  url.className = 'item__url';
  url.textContent = link.url;

  body.append(title, url);

  const remove = document.createElement('button');
  remove.className = 'item__remove';
  remove.type = 'button';
  remove.textContent = '×';
  remove.setAttribute('aria-label', `Supprimer ${link.title || link.url}`);
  remove.addEventListener('click', async () => {
    await store.remove(link.id);
    await notifyBadge();
    await render();
    toast('Lien supprimé');
  });

  item.append(body, remove);
  return item;
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
  const capture = captureFromTab(activeTab);
  if (!capture) {
    toast('Rien à enregistrer sur cette page');
    return;
  }

  const { duplicate } = await store.add(capture);
  await notifyBadge();
  await render();
  toast(duplicate ? 'Déjà enregistré' : 'Page ajoutée');
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
  toast(ok ? `${filename} enregistré` : 'Téléchargement impossible');
}

el.addCurrent.addEventListener('click', addCurrentTab);
el.exportCsv.addEventListener('click', () => exportAs('csv'));
el.exportMd.addEventListener('click', () => exportAs('md'));
el.clear.addEventListener('click', async () => {
  await store.clear();
  await notifyBadge();
  await render();
  toast('Liste vidée');
});

await loadActiveTab();
await render();
