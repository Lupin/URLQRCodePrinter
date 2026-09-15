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

import { createChromeStorageStore, createMemoryStore } from './core/store.js';
import { captureFromTab } from './core/capture.js';
import { toCsv, toMarkdown, exportFilename } from './core/exporters.js';
import { downloadText } from './core/download.js';
import { hostOf } from './core/link.js';
import { resolveApi, readTabContext } from './api.js';

const api = resolveApi();

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
    timer = setTimeout(() => reject(new Error(`${label} : aucune réponse après ${ms} ms`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

const el = {
  count: document.getElementById('count'),
  currentTab: document.getElementById('current-tab'),
  addCurrent: document.getElementById('add-current'),
  list: document.getElementById('list'),
  empty: document.getElementById('empty'),
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
    context = await withTimeout(readTabContext(api, tab), 3000, 'lecture de l\'onglet');
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
  el.openApp.disabled = !hasLinks;
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
 * Affiche une erreur de démarrage dans la fenêtre.
 *
 * Sans cela, une exception au chargement laisse le HTML statique tel quel :
 * « Chargement… » indéfiniment, sans le moindre indice. C'est exactement le
 * symptôme observé sur Safari avant que ce message existe.
 *
 * @param {unknown} error
 */
function reportStartupFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  const detected = api ? (api === globalThis.browser ? 'browser' : 'chrome') : 'aucune';

  el.currentTab.textContent = 'Démarrage impossible';
  el.currentTab.title = message;
  el.addCurrent.disabled = true;

  el.empty.hidden = false;
  el.empty.textContent = `${message} — API détectée : ${detected}`;

  el.count.textContent = '!';
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
    await loadActiveTab();
    await render();
  } catch (error) {
    reportStartupFailure(error);
  }
}

main();
