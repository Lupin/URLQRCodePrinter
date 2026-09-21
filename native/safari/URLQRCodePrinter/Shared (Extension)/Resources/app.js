// app.js — fichier assemblé par scripts/build.mjs.
// Ne pas modifier ici : éditez les modules de src/ et reconstruisez.

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/link.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Modèle de données : un « lien » collecté.
 *
 * Ce module est volontairement pur (aucun accès DOM, réseau ou stockage) afin
 * d'être réutilisé tel quel par l'application web autonome, l'extension
 * navigateur et, plus tard, une couche native.
 */

/**
 * @typedef {Object} LinkRecord
 * @property {string}   id        Identifiant stable (UUID v4).
 * @property {string}   url       URL absolue normalisée — c'est elle qui est encodée dans le QR.
 * @property {string}   title     Titre lisible de la page (peut être vide).
 * @property {string}   note      Note libre de l'utilisateur.
 * @property {string[]} tags      Étiquettes de classement, sans « # », dédoublonnées.
 * @property {number}   createdAt Date de collecte (epoch ms).
 * @property {number}   updatedAt Dernière modification (epoch ms).
 * @property {string}   source    Origine : 'context-menu' | 'toolbar' | 'manual' | 'import' | 'share'.
 * @property {string}   favicon   URL du favicon, ou chaîne vide.
 * @property {string}   shortUrl  Lien raccourci, ou chaîne vide. N'écrase jamais `url` :
 *   le lien d'origine reste la source de vérité, un service tiers pouvant fermer.
 * @property {string}   shortProvider Identifiant du service qui a produit `shortUrl`.
 * @property {number}   shortenedAt Date du raccourcissement (epoch ms), 0 si jamais raccourci.
 */

/** Origines reconnues. Toute autre valeur est ramenée à 'manual'. */
const SOURCES = ['context-menu', 'toolbar', 'manual', 'import', 'share'];

const DEFAULT_TITLE_MAX = 300;

/**
 * Génère un identifiant unique. `crypto.randomUUID` existe dans tous les
 * environnements visés (navigateurs modernes, service worker MV3, Node >= 19).
 * @returns {string}
 */
function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Repli : ne devrait jamais servir sur les plateformes ciblées.
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/**
 * Normalise une URL saisie ou capturée.
 *
 * - ajoute `https://` si le schéma est absent ;
 * - retire les identifiants de session et le fragment, qui n'ont pas leur place
 *   dans un QR code imprimé (le fragment n'est jamais envoyé au serveur, et un
 *   `#` allonge inutilement la matrice) ;
 * - supprime un éventuel slash final redondant sur la racine.
 *
 * @param {string} input
 * @returns {string} URL normalisée.
 * @throws {TypeError} si l'entrée ne peut pas être analysée comme une URL http(s).
 */
function normalizeUrl(input) {
  if (typeof input !== 'string') throw new TypeError('URL attendue sous forme de chaîne');
  let raw = input.trim();
  if (raw === '') throw new TypeError('URL vide');

  // Un schéma explicite non http(s) (mailto:, tel:, ftp:) est rejeté : ces
  // chaînes ne sont pas des liens web et fausseraient le rendu des colonnes.
  // Exception : « hote:3000 » ressemble à un schéma mais désigne un hôte suivi
  // d'un port ; on le traite comme une URL sans schéma plutôt que de le refuser.
  const isHostPort = /^[^\s/?#@]+:\d+(?:[/?#]|$)/.test(raw);
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:/i.test(raw) && !isHostPort) {
    throw new TypeError('Seuls les schémas http et https sont pris en charge');
  }
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new TypeError('URL invalide : ' + input);
  }
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
    throw new TypeError('Nom d\'hôte invalide : ' + parsed.hostname);
  }

  parsed.hash = '';

  // Paramètres de campagne : ils polluent le QR et le rendent plus dense.
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref_src$)/i.test(key)) {
      parsed.searchParams.delete(key);
    }
  }

  let out = parsed.toString();
  if (parsed.pathname === '/' && !parsed.search) out = out.replace(/\/$/, '');
  return out;
}

/**
 * Indique si une chaîne est une URL http(s) exploitable.
 * @param {string} input
 * @returns {boolean}
 */
function isValidUrl(input) {
  try {
    normalizeUrl(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Attribut `href` sûr pour une URL, ou chaîne vide si elle est inexploitable.
 *
 * La liste des liens est une porte de sortie vers l'extérieur, et son contenu
 * peut venir d'un import ou d'une page web : un `href` ne doit donc jamais
 * recevoir autre chose qu'une URL http(s), jamais un `javascript:` ni un `data:`.
 * Les appelants affichent du texte simple quand cette fonction renvoie `''`.
 *
 * @param {unknown} url
 * @returns {string}
 */
function safeHref(url) {
  if (typeof url !== 'string' || url.trim() === '') return '';
  try {
    return normalizeUrl(url);
  } catch {
    return '';
  }
}

/**
 * Domaine affichable d'une URL (sans « www. »).
 * @param {string} url
 * @returns {string}
 */
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

/**
 * Nettoie et dédoublonne une liste de tags.
 * @param {unknown} tags
 * @returns {string[]}
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const out = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const clean = tag.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase();
    if (clean === '' || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

/**
 * Valide un lien raccourci.
 *
 * Une valeur illisible est ignorée au lieu de faire échouer la construction :
 * un raccourci abîmé ne doit pas empêcher d'importer un enregistrement dont
 * l'URL d'origine, elle, est intacte.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeShortUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return '';
  try {
    return normalizeUrl(value);
  } catch {
    return '';
  }
}

/**
 * Construit un LinkRecord complet et validé à partir d'une saisie partielle.
 *
 * @param {Partial<LinkRecord> & { url: string }} input
 * @param {{ now?: number, source?: string }} [options]
 * @returns {LinkRecord}
 */
function createLink(input, options = {}) {
  if (!input || typeof input.url !== 'string') {
    throw new TypeError('createLink exige au minimum { url }');
  }
  const now = options.now ?? Date.now();
  const title = typeof input.title === 'string'
    ? input.title.trim().slice(0, DEFAULT_TITLE_MAX)
    : '';

  return {
    id: typeof input.id === 'string' && input.id !== '' ? input.id : newId(),
    url: normalizeUrl(input.url),
    title,
    note: typeof input.note === 'string' ? input.note.trim() : '',
    tags: normalizeTags(input.tags),
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : now,
    updatedAt: now,
    source: SOURCES.includes(options.source) ? options.source
      : SOURCES.includes(input.source) ? input.source
      : 'manual',
    favicon: typeof input.favicon === 'string' ? input.favicon : '',
    shortUrl: normalizeShortUrl(input.shortUrl),
    shortProvider: typeof input.shortProvider === 'string' ? input.shortProvider : '',
    shortenedAt: Number.isFinite(input.shortenedAt) && input.shortenedAt > 0
      ? input.shortenedAt
      : 0,
  };
}

/**
 * Indique si deux liens désignent la même ressource.
 * La comparaison ignore le « www. », le slash final et la casse de l'hôte.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isSameTarget(a, b) {
  const key = (value) => {
    try {
      const u = new URL(normalizeUrl(value));
      const path = u.pathname.replace(/\/$/, '');
      return (u.hostname.replace(/^www\./i, '') + path + u.search).toLowerCase();
    } catch {
      return String(value).trim().toLowerCase();
    }
  };
  return key(a) === key(b);
}

/**
 * Trouve un lien existant pointant vers la même ressource.
 * @param {LinkRecord[]} links
 * @param {string} url
 * @returns {LinkRecord|undefined}
 */
function findDuplicate(links, url) {
  let target;
  try {
    target = normalizeUrl(url);
  } catch {
    return undefined;
  }
  return links.find((link) => isSameTarget(link.url, target));
}

/**
 * Indique si un enregistrement possède un lien raccourci exploitable.
 * @param {Partial<LinkRecord>} [link]
 * @returns {boolean}
 */
function hasShortUrl(link) {
  return typeof link?.shortUrl === 'string' && link.shortUrl !== '';
}

/**
 * URL d'origine d'un enregistrement, même après passage par `resolveTarget`.
 *
 * C'est elle qui identifie le lien : le domaine affiché, le nom des fichiers
 * d'étiquettes et la colonne « Domaine » des exports doivent la refléter, sans
 * quoi une collection raccourcie deviendrait une liste de « tinyurl.com ».
 *
 * @param {Partial<LinkRecord>} [link]
 * @returns {string}
 */
function sourceUrl(link) {
  if (!link) return '';
  return typeof link.originalUrl === 'string' && link.originalUrl !== ''
    ? link.originalUrl
    : link.url ?? '';
}

/**
 * Domaine d'origine d'un enregistrement (sans « www. »).
 * @param {Partial<LinkRecord>} [link]
 * @returns {string}
 */
function sourceHost(link) {
  return hostOf(sourceUrl(link));
}

/**
 * Destinations possibles du QR code.
 * - `original` : l'URL collectée (comportement par défaut) ;
 * - `short` : le lien raccourci quand il existe, l'URL d'origine sinon.
 */
const TARGET_MODES = Object.freeze(['original', 'short']);

/**
 * Prépare un enregistrement pour l'affichage ou l'impression.
 *
 * Renvoie toujours une copie portant :
 * - `url` : la destination retenue, celle que le QR code encode ;
 * - `originalUrl` : l'URL collectée, jamais perdue ;
 * - `shortUrl` : le lien raccourci, ou une chaîne vide.
 *
 * L'enregistrement stocké n'est pas modifié : on ne remplace jamais `url` en
 * base, un service de raccourcissement pouvant disparaître du jour au
 * lendemain.
 *
 * @param {LinkRecord} link
 * @param {'original'|'short'} [mode]
 * @returns {LinkRecord & { originalUrl: string }}
 */
function resolveTarget(link, mode = 'original') {
  const originalUrl = link.url;
  const shortUrl = hasShortUrl(link) ? link.shortUrl : '';
  const useShort = mode === 'short' && shortUrl !== '' && shortUrl !== originalUrl;

  return {
    ...link,
    url: useShort ? shortUrl : originalUrl,
    originalUrl,
    shortUrl,
  };
}

/**
 * Applique `resolveTarget` à une collection.
 * @param {LinkRecord[]} links
 * @param {'original'|'short'} [mode]
 * @returns {Array<LinkRecord & { originalUrl: string }>}
 */
function resolveTargets(links, mode = 'original') {
  return links.map((link) => resolveTarget(link, mode));
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/store.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Persistance des liens.
 *
 * Un « store » expose toujours la même interface, ce qui permet de réutiliser
 * l'application web, l'extension et (plus tard) un pont natif sans changer le
 * reste du code :
 *
 *   list(): Promise<LinkRecord[]>
 *   get(id): Promise<LinkRecord|undefined>
 *   add(record): Promise<{ link, duplicate }>
 *   put(record): Promise<LinkRecord>
 *   putMany(records): Promise<number>
 *   remove(id): Promise<void>
 *   clear(): Promise<void>
 *
 * L'implémentation par défaut utilise IndexedDB, disponible à la fois dans une
 * page web et dans un service worker d'extension MV3.
 */



const DB_NAME = 'url-qr-code-printer';
const DB_VERSION = 1;
const STORE = 'links';

/**
 * @typedef {Object} LinkStore
 * @property {() => Promise<import('./link.js').LinkRecord[]>} list
 * @property {(id: string) => Promise<import('./link.js').LinkRecord|undefined>} get
 * @property {(record: Partial<import('./link.js').LinkRecord> & {url: string}, options?: object) => Promise<{link: import('./link.js').LinkRecord, duplicate: boolean}>} add
 * @property {(record: import('./link.js').LinkRecord) => Promise<import('./link.js').LinkRecord>} put
 * @property {(records: import('./link.js').LinkRecord[]) => Promise<number>} putMany
 * @property {(id: string) => Promise<void>} remove
 * @property {() => Promise<void>} clear
 */

/**
 * Trie les liens du plus récent au plus ancien.
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {import('./link.js').LinkRecord[]}
 */
function sortByDateDesc(links) {
  return [...links].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Enveloppe une promesse IndexedDB en promesse native.
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Ouvre (et migre si besoin) la base IndexedDB.
 * @param {string} [dbName]
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase(dbName = DB_NAME) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('createdAt', 'createdAt');
        os.createIndex('url', 'url', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store persistant adossé à IndexedDB.
 *
 * @param {{ dbName?: string, indexedDB?: IDBFactory }} [options]
 * @returns {LinkStore}
 */
function createIndexedDbStore(options = {}) {
  const factory = options.indexedDB ?? globalThis.indexedDB;
  if (!factory) throw new Error('IndexedDB indisponible dans cet environnement');

  let dbPromise = null;
  const getDb = () => (dbPromise ??= openDatabase(options.dbName ?? DB_NAME));

  /**
   * Exécute une transaction et attend sa complétion.
   * @param {IDBTransactionMode} mode
   * @param {(store: IDBObjectStore) => any} fn
   */
  async function withStore(mode, fn) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const os = tx.objectStore(STORE);
      let result;
      try {
        result = fn(os);
      } catch (error) {
        reject(error);
        return;
      }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  return {
    async list() {
      const db = await getDb();
      const tx = db.transaction(STORE, 'readonly');
      const all = await promisifyRequest(tx.objectStore(STORE).getAll());
      return sortByDateDesc(all);
    },

    async get(id) {
      const db = await getDb();
      const tx = db.transaction(STORE, 'readonly');
      return promisifyRequest(tx.objectStore(STORE).get(id));
    },

    async add(record, addOptions = {}) {
      const existing = await this.list();
      const duplicate = addOptions.allowDuplicate ? undefined : findDuplicate(existing, record.url);
      if (duplicate) return { link: duplicate, duplicate: true };

      const link = createLink(record, addOptions);
      await withStore('readwrite', (os) => os.put(link));
      return { link, duplicate: false };
    },

    async put(record) {
      const link = { ...record, updatedAt: Date.now() };
      await withStore('readwrite', (os) => os.put(link));
      return link;
    },

    async putMany(records) {
      await withStore('readwrite', (os) => {
        for (const record of records) os.put(record);
      });
      return records.length;
    },

    async remove(id) {
      await withStore('readwrite', (os) => os.delete(id));
    },

    async clear() {
      await withStore('readwrite', (os) => os.clear());
    },
  };
}

/**
 * Store volatil, utilisé par les tests et comme repli si IndexedDB est
 * indisponible (navigation privée restrictive, contexte non documenté).
 *
 * @param {import('./link.js').LinkRecord[]} [initial]
 * @returns {LinkStore}
 */
function createMemoryStore(initial = []) {
  /** @type {Map<string, import('./link.js').LinkRecord>} */
  const map = new Map(initial.map((link) => [link.id, link]));

  return {
    async list() {
      return sortByDateDesc([...map.values()]);
    },
    async get(id) {
      return map.get(id);
    },
    async add(record, addOptions = {}) {
      const duplicate = addOptions.allowDuplicate
        ? undefined
        : findDuplicate([...map.values()], record.url);
      if (duplicate) return { link: duplicate, duplicate: true };
      const link = createLink(record, addOptions);
      map.set(link.id, link);
      return { link, duplicate: false };
    },
    async put(record) {
      const link = { ...record, updatedAt: Date.now() };
      map.set(link.id, link);
      return link;
    },
    async putMany(records) {
      for (const record of records) map.set(record.id ?? newId(), record);
      return records.length;
    },
    async remove(id) {
      map.delete(id);
    },
    async clear() {
      map.clear();
    },
  };
}

/**
 * Store adossé à `chrome.storage.local` (extension uniquement).
 *
 * Utile quand on veut que les données soient visibles depuis le service worker
 * et la page d'options sans ouvrir IndexedDB. Le quota par défaut est de 10 Mo
 * (ou illimité avec la permission `unlimitedStorage`).
 *
 * @param {{ area?: chrome.storage.StorageArea }} [options]
 * @returns {LinkStore}
 */
function createChromeStorageStore(options = {}) {
  const area = options.area ?? (globalThis.chrome?.storage?.local);
  if (!area) throw new Error('chrome.storage.local indisponible');

  const KEY = 'links';

  async function readAll() {
    const data = await area.get(KEY);
    const value = data?.[KEY];
    return Array.isArray(value) ? value : [];
  }

  async function writeAll(links) {
    await area.set({ [KEY]: links });
  }

  return {
    async list() {
      return sortByDateDesc(await readAll());
    },
    async get(id) {
      return (await readAll()).find((link) => link.id === id);
    },
    async add(record, addOptions = {}) {
      const all = await readAll();
      const duplicate = addOptions.allowDuplicate ? undefined : findDuplicate(all, record.url);
      if (duplicate) return { link: duplicate, duplicate: true };
      const link = createLink(record, addOptions);
      all.push(link);
      await writeAll(all);
      return { link, duplicate: false };
    },
    async put(record) {
      const all = await readAll();
      const link = { ...record, updatedAt: Date.now() };
      const index = all.findIndex((item) => item.id === link.id);
      if (index === -1) all.push(link);
      else all[index] = link;
      await writeAll(all);
      return link;
    },
    async putMany(records) {
      const all = await readAll();
      const byId = new Map(all.map((item) => [item.id, item]));
      for (const record of records) byId.set(record.id, record);
      await writeAll([...byId.values()]);
      return records.length;
    },
    async remove(id) {
      await writeAll((await readAll()).filter((link) => link.id !== id));
    },
    async clear() {
      await writeAll([]);
    },
  };
}

/**
 * Choisit le meilleur store disponible pour l'environnement courant.
 *
 * Dans une extension on privilégie `chrome.storage.local`, dont le contenu est
 * partagé entre le service worker et les pages ; ailleurs on utilise IndexedDB,
 * avec un repli en mémoire pour ne jamais laisser l'application inutilisable.
 *
 * @param {{ prefer?: 'auto'|'indexeddb'|'chrome'|'memory' }} [options]
 * @returns {{ store: LinkStore, kind: 'indexeddb'|'chrome'|'memory' }}
 */
function resolveDefaultStore(options = {}) {
  const prefer = options.prefer ?? 'auto';
  const hasChrome = Boolean(globalThis.chrome?.storage?.local);
  const hasIdb = Boolean(globalThis.indexedDB);

  if (prefer === 'chrome' && hasChrome) {
    return { store: createChromeStorageStore(), kind: 'chrome' };
  }
  if (prefer === 'indexeddb' && hasIdb) {
    return { store: createIndexedDbStore(), kind: 'indexeddb' };
  }
  if (prefer === 'memory') {
    return { store: createMemoryStore(), kind: 'memory' };
  }

  if (hasChrome) return { store: createChromeStorageStore(), kind: 'chrome' };
  if (hasIdb) return { store: createIndexedDbStore(), kind: 'indexeddb' };
  return { store: createMemoryStore(), kind: 'memory' };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/element-ids.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Identifiants des éléments que `app.js` attend dans `index.html`.
 *
 * Cette liste vit dans son propre module pour être vérifiable : un test
 * confronte chaque identifiant au HTML réel, ce qui attrape la faute la plus
 * banale d'une application web — un `id` renommé d'un côté seulement, qui ne
 * produit qu'une erreur `null` à l'exécution.
 */

const ELEMENT_IDS = Object.freeze([
  'stale-style',
  'count',
  'collection-name',
  'add-form',
  'url-input',
  'add-error',
  'search',
  'select-all-box',
  'selection-hint',
  'shortener',
  'shorten',
  'shorten-clear',
  'shorten-status',
  'qr-target',
  'target-hint',
  'list',
  'empty',
  'export-xlsx',
  'export-csv',
  'export-md',
  'export-json',
  'import',
  'import-file',
  'clear',
  'preset',
  'sheet-qr',
  'sheet-font',
  'sheet-qr-info',
  'sheet-url',
  'sheet-date',
  'sheet-date-time',
  'sheet-date-index',
  'sheet-date-hint',
  'sheet-fit-hint',
  'sheet-columns',
  'sheet-rows',
  'sheet-margin-x',
  'sheet-margin-y',
  'sheet-gap-x',
  'sheet-gap-y',
  'sheet-offset-x',
  'sheet-offset-y',
  'sheet-info',
  'table-qr',
  'table-orientation',
  'table-margin-x',
  'table-margin-y',
  'table-title',
  'table-title-date',
  'table-col-index',
  'table-col-qr',
  'table-col-url',
  'table-col-title',
  'table-col-tags',
  'table-col-note',
  'table-col-date',
  'table-col-date-time',
  'table-grid',
  'table-hint',
  'label-profile',
  'profile-hint',
  'supply-hint',
  'density',
  'copies',
  'label-rotation',
  'label-link',
  'label-show-index',
  'label-show-title',
  'label-show-url',
  'label-show-host',
  'label-show-date',
  'label-date-time',
  'label-content-hint',
  'label-supply',
  'label-alignment',
  'label-font-size',
  'label-font-hint',
  'print-scope',
  'print-scope-hint',
  'print-copies',
  'label-format',
  'label-text',
  'label-margin',
  'label-font',
  'label-cut',
  'export-date',
  'export-date-time',
  'export-labels',
  'printer-dot',
  'printer-name',
  'connect',
  'disconnect',
  'ble-support',
  'print-label',
  'print-all-labels',
  'print-status',
  'preview',
  'print',
  'print-root',
  'toast',
]);

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/exporters.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Exports texte : CSV, Markdown et JSON.
 *
 * Fonctions pures : elles reçoivent un tableau de LinkRecord et renvoient une
 * chaîne. L'écriture disque est laissée à l'appelant (téléchargement, API
 * File System Access, ou pont natif), ce qui rend ces fonctions testables
 * hors navigateur.
 */



/**
 * Modes d'affichage de la date sous un QR code.
 *
 * `none` par défaut : un QR code doit rester lisible, et chaque ligne de texte
 * supplémentaire réduit la place disponible. Le mode `datetime` sert aux cas où
 * l'heure compte — recherche, essais, prototypes — où l'on doit pouvoir dater
 * une capture à la minute près.
 */
const DATE_MODES = Object.freeze(['none', 'date', 'datetime']);

/**
 * Formate la date de collecte d'un lien, sans l'heure.
 * @param {number} epochMs
 * @returns {string} `JJ/MM/AAAA`, ou chaîne vide si la date est inutilisable.
 */
function formatDate(epochMs) {
  if (!Number.isFinite(epochMs)) return '';
  const d = new Date(epochMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Texte de date à imprimer sous un QR code, selon le mode retenu.
 *
 * Une date illisible ne doit pas produire une ligne vide dans une étiquette :
 * on renvoie une chaîne vide, que les appelants n'impriment pas.
 *
 * @param {number} epochMs
 * @param {string} [mode] `none`, `date` ou `datetime`.
 * @returns {string}
 */
function formatCaptureDate(epochMs, mode = 'none') {
  if (mode === 'date') return formatDate(epochMs);
  if (mode === 'datetime') return formatDateTime(epochMs);
  return '';
}

/**
 * Colonnes de l'export tabulaire, dans l'ordre d'affichage.
 * `get` extrait la valeur brute ; `header` est le libellé de la colonne.
 */
const COLUMNS = [
  { key: 'index', header: 'N°', get: (_link, i) => String(i + 1) },
  { key: 'url', header: 'URL', get: (link) => link.url },
  { key: 'title', header: 'Titre', get: (link) => link.title },
  { key: 'host', header: 'Domaine', get: (link) => hostOf(link.url) },
  { key: 'tags', header: 'Tags', get: (link) => link.tags.join(' ') },
  { key: 'note', header: 'Note', get: (link) => link.note },
  { key: 'createdAt', header: 'Ajouté le', get: (link) => formatDateTime(link.createdAt) },
];

/**
 * Colonne ajoutée en fin de tableau quand au moins un lien est raccourci.
 *
 * L'export texte reste ainsi un export de **données** : il conserve l'URL
 * d'origine en colonne principale — c'est elle qui identifie le lien dans le
 * temps — et consigne le raccourci à côté, sans jamais l'y substituer. Le choix
 * « le QR encode le raccourci » ne concerne que les sorties imprimées.
 */
const SHORT_COLUMN = {
  key: 'shortUrl',
  header: 'URL courte',
  get: (link) => (hasShortUrl(link) ? link.shortUrl : ''),
};

/**
 * Indique si au moins un lien porte une note.
 *
 * Règle du projet : une colonne facultative — note, tags, URL courte — ne
 * s'affiche que si elle a quelque chose à montrer. Un tableau dont une colonne
 * reste vide sur toute sa hauteur ne fait qu'occuper la place.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {boolean}
 */
function hasAnyNote(links) {
  return links.some((link) => typeof link.note === 'string' && link.note !== '');
}

/**
 * Indique si au moins un lien porte un tag.
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {boolean}
 */
function hasAnyTag(links) {
  return links.some((link) => Array.isArray(link.tags) && link.tags.length > 0);
}

/**
 * Colonnes à écrire pour une collection : la colonne « URL courte » n'apparaît
 * que si elle a quelque chose à contenir.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {typeof COLUMNS} [base]
 * @returns {typeof COLUMNS}
 */
function columnsFor(links, base = COLUMNS) {
  return links.some(hasShortUrl) ? [...base, SHORT_COLUMN] : base;
}

/**
 * Formate une date en `JJ/MM/AAAA HH:MM` (heure locale).
 * @param {number} epochMs
 * @returns {string}
 */
function formatDateTime(epochMs) {
  if (!Number.isFinite(epochMs)) return '';
  const d = new Date(epochMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Formate une date en `AAAA-MM-JJ` (tri lexicographique correct).
 * @param {number} epochMs
 * @returns {string}
 */
function formatDateIso(epochMs) {
  if (!Number.isFinite(epochMs)) return '';
  return new Date(epochMs).toISOString().slice(0, 10);
}

/**
 * Échappe un champ CSV selon la RFC 4180.
 * Le champ est entouré de guillemets s'il contient le séparateur, un guillemet,
 * un retour à la ligne, ou une espace de début/fin.
 *
 * @param {unknown} value
 * @param {string} delimiter
 * @returns {string}
 */
function escapeCsvField(value, delimiter = ';') {
  const text = value == null ? '' : String(value);
  const mustQuote =
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r') ||
    text !== text.trim();
  if (!mustQuote) return text;
  return '"' + text.replace(/"/g, '""') + '"';
}

/**
 * Sérialise les liens en CSV.
 *
 * Le séparateur par défaut est le point-virgule : c'est ce qu'attendent Excel
 * et Numbers en configuration française. `delimiter: ','` produit un CSV
 * strictement conforme à la RFC 4180.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{ delimiter?: string, bom?: boolean, columns?: typeof COLUMNS }} [options]
 * @returns {string}
 */
function toCsv(links, options = {}) {
  const delimiter = options.delimiter === ',' ? ',' : ';';
  const columns = options.columns ?? columnsFor(links);

  const lines = [columns.map((c) => escapeCsvField(c.header, delimiter)).join(delimiter)];
  links.forEach((link, index) => {
    lines.push(
      columns.map((c) => escapeCsvField(c.get(link, index), delimiter)).join(delimiter),
    );
  });

  const body = lines.join('\r\n') + '\r\n';
  // Le BOM aide Excel à détecter l'UTF-8 ; il gêne certains scripts.
  return options.bom === false ? body : '\uFEFF' + body;
}

/**
 * Échappe le contenu d'une cellule de tableau Markdown.
 * @param {unknown} value
 * @returns {string}
 */
function escapeMarkdownCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

/**
 * Sérialise les liens en Markdown lisible par un humain.
 *
 * Deux présentations :
 * - `'table'` (défaut) : un tableau, pratique à relire sur GitHub/Obsidian ;
 * - `'list'` : une liste à puces, plus adaptée aux longues notes.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{
 *   title?: string,
 *   layout?: 'table' | 'list',
 *   frontmatter?: boolean,
 *   includeQr?: boolean,
 *   now?: number,
 * }} [options]
 * @returns {string}
 */
function toMarkdown(links, options = {}) {
  const {
    title = 'Mes liens QR',
    layout = 'table',
    frontmatter = true,
    includeQr = false,
    now = Date.now(),
  } = options;

  const out = [];

  if (frontmatter) {
    out.push('---');
    out.push(`title: ${JSON.stringify(title)}`);
    out.push(`count: ${links.length}`);
    out.push(`generated: ${new Date(now).toISOString()}`);
    out.push('---');
    out.push('');
  }

  out.push(`# ${title}`);
  out.push('');
  out.push(`_${links.length} lien${links.length > 1 ? 's' : ''} — exporté le ${formatDateTime(now)}_`);
  out.push('');

  if (links.length === 0) {
    out.push('_Aucun lien enregistré._');
    return out.join('\n') + '\n';
  }

  if (layout === 'list') {
    for (const link of links) {
      const label = link.title || link.url;
      out.push(`- [${escapeMarkdownCell(label)}](${link.url})`);
      const meta = [];
      if (link.tags.length) meta.push(link.tags.map((t) => '`#' + t + '`').join(' '));
      if (link.note) meta.push(escapeMarkdownCell(link.note));
      meta.push(`_ajouté le ${formatDateIso(link.createdAt)}_`);
      out.push('  ' + meta.join(' — '));
      if (includeQr) {
        // Chemin relatif : l'image est produite à côté du fichier .md.
        out.push(`  ![](qr/${link.id}.png)`);
      }
      out.push('');
    }
    return out.join('\n');
  }

  // La colonne « Note » n'apparaît que si elle a du contenu : un tableau
  // Markdown se lit mal quand une colonne reste vide, et la note est le seul
  // champ dont la longueur n'est pas bornée.
  const withNote = hasAnyNote(links);

  out.push(withNote
    ? '| N° | URL | Titre | Tags | Note | Ajouté le |'
    : '| N° | URL | Titre | Tags | Ajouté le |');
  out.push(withNote
    ? '| ---: | --- | --- | --- | --- | --- |'
    : '| ---: | --- | --- | --- | --- |');

  links.forEach((link, index) => {
    const linkCell = `[${escapeMarkdownCell(link.url)}](${link.url})`;
    const noteCell = withNote ? `${escapeMarkdownCell(link.note)} | ` : '';
    out.push(
      `| ${index + 1} | ${linkCell} | ${escapeMarkdownCell(link.title)} | ` +
        `${link.tags.map((t) => '`#' + t + '`').join(' ')} | ${noteCell}` +
        `${formatDateIso(link.createdAt)} |`,
    );
  });
  out.push('');

  if (includeQr) {
    out.push('## Planches de QR codes');
    out.push('');
    out.push('Les images correspondantes sont dans le dossier `qr/`.');
    out.push('');
  }

  return out.join('\n');
}

/**
 * Sérialise les liens en JSON indenté (format d'archive et d'import).
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{ now?: number, app?: string }} [options]
 * @returns {string}
 */
function toJson(links, options = {}) {
  return JSON.stringify(
    {
      format: 'url-qr-code-printer/links',
      version: 1,
      exportedAt: new Date(options.now ?? Date.now()).toISOString(),
      app: options.app ?? 'url-qr-code-printer',
      count: links.length,
      links,
    },
    null,
    2,
  );
}

/**
 * Relit une archive JSON produite par `toJson`, en tolérant un tableau nu.
 * @param {string} text
 * @returns {unknown[]} enregistrements bruts, à passer à `createLink`.
 */
function parseJsonExport(text) {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.links)) return parsed.links;
  throw new TypeError('Archive JSON non reconnue : clé « links » absente');
}

/**
 * Construit un nom de fichier horodaté et sûr.
 * @param {string} base
 * @param {string} extension
 * @param {number} [now]
 * @returns {string}
 */
function exportFilename(base, extension, now = Date.now()) {
  const d = new Date(now);
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`;
  const safe = base.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'liens';
  return `${safe}-${stamp}.${extension}`;
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/shorten.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Raccourcissement d'URL — fonctionnalité optionnelle.
 *
 * Deux raisons de raccourcir un lien avant de l'imprimer :
 *   - un QR code plus court est moins dense, donc plus facile à scanner et
 *     imprimable plus petit (c'est décisif sur une étiquette de 12 mm) ;
 *   - l'URL tient sur une seule ligne sous le QR code.
 *
 * Deux raisons de s'en méfier, qu'il ne faut pas cacher à l'utilisateur :
 *   - le lien imprimé dépend d'un service tiers : s'il ferme, l'étiquette est
 *     morte. L'URL d'origine reste donc **toujours** conservée dans le modèle,
 *     et le raccourcissement n'écrase jamais `url` ;
 *   - raccourcir transmet l'URL complète à ce tiers. C'est pour cela que la
 *     fonction est désactivée par défaut.
 *
 * Ce module est pur : le réseau est injecté via `options.fetch`, ce qui permet
 * de le tester sans sortir de la machine. Aucun service n'est appelé au
 * chargement de la page — uniquement sur action explicite.
 */



/** Délai au-delà duquel une requête est abandonnée. */
const SHORTENER_TIMEOUT_MS = 12000;

/**
 * Erreur de raccourcissement, avec un code exploitable par l'interface.
 *
 * Codes : `unsupported` (pas de `fetch`), `unknown` (service inconnu),
 * `invalid` (URL d'entrée refusée ou réponse illisible), `network`, `timeout`,
 * `aborted`, `http` (statut hors 2xx), `service` (le service a répondu une
 * erreur en clair), `unchanged` (le service a renvoyé l'URL d'origine).
 */
class ShortenError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   * @param {{ provider?: string, status?: number, cause?: unknown }} [details]
   */
  constructor(message, code, details = {}) {
    super(message, details.cause ? { cause: details.cause } : undefined);
    this.name = 'ShortenError';
    this.code = code;
    this.provider = details.provider ?? '';
    this.status = details.status ?? 0;
  }
}

/**
 * Extrait le premier lien d'une réponse texte.
 * @param {string} text
 * @returns {string}
 */
function firstUrl(text) {
  const match = String(text).match(/https?:\/\/[^\s"'<>\\]+/i);
  return match ? match[0] : '';
}

/** Clés JSON susceptibles de porter le lien court, par ordre de priorité. */
const SHORT_KEYS = ['short_url', 'shortUrl', 'shortURL', 'short', 'result_url', 'resultUrl', 'url', 'link'];

/**
 * Cherche un lien court dans une réponse JSON, à plat ou imbriquée.
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {string}
 */
function urlFromJson(value, depth = 0) {
  if (depth > 3 || value == null || typeof value !== 'object') return '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = urlFromJson(item, depth + 1);
      if (found) return found;
    }
    return '';
  }
  for (const key of SHORT_KEYS) {
    const candidate = value[key];
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate.trim())) {
      return candidate.trim();
    }
  }
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') {
      const found = urlFromJson(nested, depth + 1);
      if (found) return found;
    }
  }
  return '';
}

/**
 * Tronque un corps de réponse pour l'afficher dans un message d'erreur.
 * @param {string} text
 * @returns {string}
 */
function excerpt(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim().slice(0, 120);
  return clean === '' ? '(vide)' : clean;
}

/**
 * Catalogue des services proposés.
 *
 * Tous fonctionnent sans clé d'API et sans autorisation d'hôte supplémentaire :
 * leur réponse porte un en-tête CORS permissif, ce qui évite d'élargir les
 * permissions de l'extension — un point important pour un outil qui lit les URL
 * de tous vos onglets.
 *
 * `spacingMs` est le délai minimal entre deux requêtes : il respecte les limites
 * documentées par les services bénévoles (`is.gd` et `v.gd` refusent au-delà de
 * cinq créations par tranche de dix secondes).
 */
const SHORTENERS = Object.freeze([
  {
    id: 'tinyurl',
    name: 'TinyURL',
    site: 'https://tinyurl.com',
    note: 'Sans clé d\'API, HTTPS, liens durables. Service commercial.',
    spacingMs: 500,
    upgradeToHttps: false,
    /**
     * @param {string} url
     * @returns {{ url: string, init: RequestInit }}
     */
    build(url) {
      const query = new URLSearchParams({ url });
      return { url: `https://tinyurl.com/api-create.php?${query}`, init: { method: 'GET' } };
    },
  },
  {
    id: 'isgd',
    name: 'is.gd',
    site: 'https://is.gd',
    note: 'Sans clé ni statistiques. Service bénévole, régulièrement indisponible.',
    spacingMs: 2200,
    upgradeToHttps: false,
    build(url) {
      const query = new URLSearchParams({ format: 'simple', url });
      return { url: `https://is.gd/create.php?${query}`, init: { method: 'GET' } };
    },
  },
  {
    id: 'vgd',
    name: 'v.gd',
    site: 'https://v.gd',
    note: 'Même infrastructure que is.gd, mais les liens affichent un avertissement avant redirection.',
    spacingMs: 2200,
    upgradeToHttps: false,
    build(url) {
      const query = new URLSearchParams({ format: 'simple', url });
      return { url: `https://v.gd/create.php?${query}`, init: { method: 'GET' } };
    },
  },
  {
    id: 'spoome',
    name: 'spoo.me',
    site: 'https://spoo.me',
    note: 'Sans clé, statistiques de clics. Répond en HTTP : le lien est ramené en HTTPS.',
    spacingMs: 700,
    upgradeToHttps: true,
    build(url) {
      const body = new URLSearchParams({ url }).toString();
      return {
        url: 'https://spoo.me/',
        init: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body,
        },
      };
    },
  },
]);

/** Service utilisé par défaut : le plus fiable des quatre à ce jour. */
const DEFAULT_SHORTENER = 'tinyurl';

/**
 * Retrouve un service par son identifiant.
 * @param {string} id
 * @returns {typeof SHORTENERS[number]|undefined}
 */
function findShortener(id) {
  return SHORTENERS.find((shortener) => shortener.id === id);
}

/**
 * Analyse la réponse d'un service et en extrait le lien court.
 *
 * Les services bénévoles signalent leurs pannes par un texte en clair
 * (« Error, database insert failed ») accompagné d'un statut 200 : se fier au
 * statut seul laisserait passer ce texte pour une URL. D'où la validation
 * systématique du résultat.
 *
 * @param {string} text
 * @param {number} status
 * @param {typeof SHORTENERS[number]} shortener
 * @param {string} originalUrl
 * @returns {string} lien court validé
 * @throws {ShortenError}
 */
function parseShortResponse(text, status, shortener, originalUrl) {
  const fail = (message, code) =>
    new ShortenError(message, code, { provider: shortener.id, status });

  if (status < 200 || status >= 300) {
    throw fail(`${shortener.name} a répondu ${status} (${excerpt(text)})`, 'http');
  }

  const body = String(text ?? '').trim();
  if (body === '') throw fail(`${shortener.name} a renvoyé une réponse vide`, 'invalid');

  let candidate = '';
  if (body.startsWith('{') || body.startsWith('[')) {
    try {
      candidate = urlFromJson(JSON.parse(body));
    } catch {
      // Corps annoncé JSON mais illisible : on retombe sur la recherche texte.
      candidate = '';
    }
  }
  if (candidate === '') candidate = firstUrl(body);

  if (candidate === '') {
    throw fail(`${shortener.name} a répondu « ${excerpt(body)} » au lieu d'un lien`, 'service');
  }

  let short;
  try {
    short = normalizeUrl(candidate);
  } catch (error) {
    throw fail(`${shortener.name} a renvoyé un lien inexploitable : ${excerpt(candidate)}`, 'invalid');
  }

  if (shortener.upgradeToHttps && short.startsWith('http://')) {
    short = 'https://' + short.slice('http://'.length);
  }

  if (isSameTarget(short, originalUrl)) {
    throw fail(`${shortener.name} n'a pas raccourci ce lien (déjà court)`, 'unchanged');
  }

  return short;
}

/**
 * Raccourcit une URL auprès d'un service.
 *
 * @param {string} url
 * @param {{
 *   provider?: string|typeof SHORTENERS[number],
 *   fetch?: typeof fetch,
 *   timeoutMs?: number,
 *   signal?: AbortSignal,
 * }} [options]
 * @returns {Promise<string>} lien court
 * @throws {ShortenError}
 */
async function shortenUrl(url, options = {}) {
  const {
    provider = DEFAULT_SHORTENER,
    fetch: fetchImpl = globalThis.fetch,
    timeoutMs = SHORTENER_TIMEOUT_MS,
    signal,
  } = options;

  const shortener = typeof provider === 'string' ? findShortener(provider) : provider;
  if (!shortener) {
    throw new ShortenError(`Service de raccourcissement inconnu : ${provider}`, 'unknown');
  }
  if (typeof fetchImpl !== 'function') {
    throw new ShortenError('Raccourcissement indisponible : fetch absent', 'unsupported', {
      provider: shortener.id,
    });
  }

  let target;
  try {
    target = normalizeUrl(url);
  } catch (error) {
    throw new ShortenError(`Lien à raccourcir invalide : ${url}`, 'invalid', {
      provider: shortener.id,
      cause: error,
    });
  }

  const { url: endpoint, init } = shortener.build(target);

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, Math.max(0, timeoutMs));

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new ShortenError('Raccourcissement annulé', 'aborted', { provider: shortener.id });
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const response = await fetchImpl(endpoint, {
      ...init,
      signal: controller.signal,
      // `omit` : aucun cookie n'est envoyé au service tiers, et la réponse CORS
      // reste lisible même quand le service renvoie `allow-credentials: true`.
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'follow',
    });
    const text = await response.text();
    return parseShortResponse(text, response.status, shortener, target);
  } catch (error) {
    if (error instanceof ShortenError) throw error;
    if (error?.name === 'AbortError') {
      throw timedOut
        ? new ShortenError(`${shortener.name} n'a pas répondu en ${Math.round(timeoutMs / 1000)} s`, 'timeout', { provider: shortener.id, cause: error })
        : new ShortenError('Raccourcissement annulé', 'aborted', { provider: shortener.id, cause: error });
    }
    throw new ShortenError(
      `Impossible de joindre ${shortener.name} : ${error?.message ?? error}`,
      'network',
      { provider: shortener.id, cause: error },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

/**
 * Attend un délai, en s'interrompant si le lot est annulé.
 * @param {number} ms
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
function sleep(ms, signal) {
  if (!(ms > 0)) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', done);
      resolve();
    }
    signal?.addEventListener?.('abort', done, { once: true });
  });
}

/**
 * Crée un raccourcisseur : un service retenu, un cache, un rythme.
 *
 * Le cache évite de recréer un lien déjà obtenu (les services ne facturent pas
 * mais limitent le débit, et un même lien raccourci deux fois donnerait deux
 * adresses différentes pour la même destination).
 *
 * @param {{
 *   provider?: string,
 *   fetch?: typeof fetch,
 *   timeoutMs?: number,
 *   spacingMs?: number,
 *   cache?: Map<string, string>,
 *   maxCache?: number,
 * }} [options]
 * @returns {{
 *   provider: typeof SHORTENERS[number],
 *   spacingMs: number,
 *   shorten: (url: string) => Promise<string>,
 *   shortenMany: (records: Array<{id: string, url: string, shortUrl?: string}>, options?: object) => Promise<{ok: object[], failed: object[], skipped: object[]}>,
 *   clearCache: () => void,
 * }}
 */
function createShortener(options = {}) {
  const shortener = typeof options.provider === 'string'
    ? findShortener(options.provider)
    : options.provider;
  if (!shortener) {
    throw new ShortenError(`Service de raccourcissement inconnu : ${options.provider}`, 'unknown');
  }

  const fetchImpl = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? SHORTENER_TIMEOUT_MS;
  const spacingMs = options.spacingMs ?? shortener.spacingMs ?? 800;
  const cache = options.cache ?? new Map();
  const maxCache = options.maxCache ?? 500;

  /**
   * @param {string} url
   * @param {{ signal?: AbortSignal, force?: boolean }} [callOptions]
   * @returns {Promise<string>}
   */
  async function shorten(url, callOptions = {}) {
    const target = normalizeUrl(url);
    if (!callOptions.force && cache.has(target)) return cache.get(target);

    const short = await shortenUrl(target, {
      provider: shortener,
      fetch: fetchImpl,
      timeoutMs,
      signal: callOptions.signal,
    });

    if (cache.size >= maxCache) cache.clear();
    cache.set(target, short);
    return short;
  }

  /**
   * Raccourcit une série de liens, dans l'ordre et à débit maîtrisé.
   *
   * Ne lève jamais : un échec isolé n'interrompt pas le lot, il est consigné
   * dans `failed` pour que l'appelant puisse le montrer sans perdre le travail
   * déjà fait.
   *
   * @param {Array<{id: string, url: string, shortUrl?: string}>} records
   * @param {{
   *   onProgress?: (done: number, total: number, record: object) => void,
   *   signal?: AbortSignal,
   *   force?: boolean,
   * }} [batchOptions]
   * @returns {Promise<{ ok: Array<{id: string, url: string, shortUrl: string}>, failed: Array<{id: string, url: string, message: string, code: string}>, skipped: Array<{id: string, url: string, reason: string}> }>}
   */
  async function shortenMany(records, batchOptions = {}) {
    const { onProgress, signal, force = false } = batchOptions;
    const ok = [];
    const failed = [];
    const skipped = [];
    const total = records.length;
    let done = 0;
    let sent = 0;

    for (const record of records) {
      if (signal?.aborted) break;

      // Une URL illisible n'est pas un échec du service : elle est écartée
      // avant tout appel réseau, et comptée à part.
      if (!record || !isValidUrl(record.url)) {
        skipped.push({
          id: record?.id ?? '',
          url: typeof record?.url === 'string' ? record.url : '',
          reason: 'invalid',
        });
        done += 1;
        onProgress?.(done, total, record);
        continue;
      }

      if (!force && typeof record.shortUrl === 'string' && record.shortUrl !== '') {
        skipped.push({ id: record.id, url: record.url, reason: 'already' });
        done += 1;
        onProgress?.(done, total, record);
        continue;
      }

      // Rythme : on n'attend qu'entre deux requêtes réellement émises.
      if (sent > 0) await sleep(spacingMs, signal);
      if (signal?.aborted) break;
      sent += 1;

      try {
        const shortUrl = await shorten(record.url, { signal, force });
        ok.push({ id: record.id, url: record.url, shortUrl });
      } catch (error) {
        failed.push({
          id: record.id,
          url: record.url,
          message: error?.message ?? String(error),
          code: error?.code ?? 'unknown',
        });
      }

      done += 1;
      onProgress?.(done, total, record);
    }

    return { ok, failed, skipped };
  }

  return {
    provider: shortener,
    spacingMs,
    shorten,
    shortenMany,
    clearCache: () => cache.clear(),
  };
}

/**
 * Résume un lot en une phrase lisible pour l'utilisateur.
 * @param {{ ok: object[], failed: object[], skipped: object[] }} report
 * @returns {string}
 */
function describeShortenReport(report) {
  const parts = [];
  const okCount = report.ok?.length ?? 0;
  const failed = report.failed ?? [];
  const skipped = report.skipped?.filter((item) => item.reason === 'already').length ?? 0;

  parts.push(`${okCount} lien${okCount > 1 ? 's' : ''} raccourci${okCount > 1 ? 's' : ''}`);
  if (skipped > 0) parts.push(`${skipped} déjà fait${skipped > 1 ? 's' : ''}`);
  if (failed.length > 0) parts.push(`${failed.length} échec${failed.length > 1 ? 's' : ''}`);

  const first = failed[0];
  return first ? `${parts.join(', ')} — ${first.message}` : parts.join(', ');
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/settings.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Réglages persistants de l'application.
 *
 * Deux préférences seulement, mais deux préférences qu'on ne veut pas rechoisir
 * à chaque ouverture : le service de raccourcissement retenu et ce que le QR
 * code doit encoder. Elles sont enregistrées dans `localStorage` — disponible
 * aussi bien dans l'onglet de l'application que dans la page embarquée de
 * l'extension — et **jamais** dans le stockage des liens : un réglage n'est pas
 * une donnée de collection, et une archive exportée n'a pas à l'emporter.
 *
 * Le stockage est injectable pour être testable sans navigateur. Toute lecture
 * ou écriture est protégée : `localStorage` peut lever (navigation privée,
 * contexte cloisonné), et une préférence perdue ne doit pas empêcher l'app de
 * démarrer.
 */





/** Clé de stockage, préfixée pour ne pas entrer en collision avec un autre outil. */
const SETTINGS_KEY = 'url-qr-code-printer/settings';

/** Longueur maximale du nom de collection : au-delà, il ne tient plus nulle part. */
const COLLECTION_NAME_MAX = 80;

/** Valeurs par défaut : aucun raccourcissement, le QR encode l'URL collectée. */
const DEFAULT_SETTINGS = Object.freeze({
  shortener: DEFAULT_SHORTENER,
  targetMode: 'original',
  collectionName: 'Mes liens',
  dateMode: 'none',
});

/**
 * Valide un objet de réglages, en retombant sur les valeurs par défaut.
 *
 * Une préférence inconnue ou d'un type inattendu est ignorée plutôt que
 * refusée : un réglage corrompu ne doit pas bloquer l'application.
 *
 * @param {unknown} value
 * @returns {{ shortener: string, targetMode: 'original'|'short', collectionName: string, dateMode: string }}
 */
function sanitizeSettings(value) {
  const source = value && typeof value === 'object' ? value : {};
  const shortener = typeof source.shortener === 'string' && findShortener(source.shortener)
    ? source.shortener
    : DEFAULT_SETTINGS.shortener;
  const targetMode = TARGET_MODES.includes(source.targetMode)
    ? source.targetMode
    : DEFAULT_SETTINGS.targetMode;

  // Un nom vide retombe sur le défaut : un export sans titre n'aurait aucun
  // intérêt, et l'utilisateur n'a pas à saisir « Mes liens » pour l'obtenir.
  const rawName = typeof source.collectionName === 'string' ? source.collectionName.trim() : '';
  const collectionName = rawName === ''
    ? DEFAULT_SETTINGS.collectionName
    : rawName.slice(0, COLLECTION_NAME_MAX);

  const dateMode = DATE_MODES.includes(source.dateMode)
    ? source.dateMode
    : DEFAULT_SETTINGS.dateMode;

  return { shortener, targetMode, collectionName, dateMode };
}

/**
 * Stockage en mémoire, utilisé quand `localStorage` est indisponible.
 * @returns {{ getItem: (key: string) => string|null, setItem: (key: string, value: string) => void }}
 */
function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
  };
}

/**
 * Détecte `localStorage`, ou bascule en mémoire.
 *
 * Le simple fait de *lire* `globalThis.localStorage` peut lever selon le
 * contexte : la détection est donc elle-même protégée.
 *
 * @returns {{ getItem: Function, setItem: Function, persistent: boolean }}
 */
function detectStorage() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return { ...createMemoryStorage(), persistent: false };
    // Écriture d'essai : certains navigateurs exposent l'objet mais refusent
    // l'écriture (mode privé, quota à zéro).
    const probe = SETTINGS_KEY + '/probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return { getItem: (k) => storage.getItem(k), setItem: (k, v) => storage.setItem(k, v), persistent: true };
  } catch {
    return { ...createMemoryStorage(), persistent: false };
  }
}

/**
 * Crée l'accès aux réglages.
 *
 * @param {{ storage?: { getItem: Function, setItem: Function } }} [options]
 * @returns {{
 *   load: () => { shortener: string, targetMode: 'original'|'short' },
 *   save: (patch: object) => { shortener: string, targetMode: 'original'|'short' },
 *   reset: () => object,
 *   persistent: boolean,
 * }}
 */
function createSettingsStore(options = {}) {
  const detected = options.storage ? { ...options.storage, persistent: true } : detectStorage();
  const storage = detected;

  /** @type {{ shortener: string, targetMode: 'original'|'short', collectionName: string, dateMode: string }} */
  let current = { ...DEFAULT_SETTINGS };
  let loaded = false;

  function load() {
    if (loaded) return { ...current };
    loaded = true;
    try {
      const raw = storage.getItem(SETTINGS_KEY);
      if (typeof raw === 'string' && raw !== '') {
        current = sanitizeSettings(JSON.parse(raw));
      }
    } catch {
      // Réglage illisible : on garde les valeurs par défaut.
      current = { ...DEFAULT_SETTINGS };
    }
    return { ...current };
  }

  function save(patch) {
    current = sanitizeSettings({ ...load(), ...patch });
    try {
      storage.setItem(SETTINGS_KEY, JSON.stringify(current));
    } catch {
      // Quota, mode privé : le réglage vaut pour la session en cours.
    }
    return { ...current };
  }

  function reset() {
    current = { ...DEFAULT_SETTINGS };
    try {
      storage.setItem(SETTINGS_KEY, JSON.stringify(current));
    } catch {
      // Sans effet si l'écriture est impossible.
    }
    return { ...current };
  }

  return { load, save, reset, persistent: Boolean(storage.persistent) };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/node_modules/uqr/dist/index.mjs
// ────────────────────────────────────────────────────────────────────────

var QrCodeDataType = /* @__PURE__ */ ((QrCodeDataType2) => {
  QrCodeDataType2[QrCodeDataType2["Border"] = -1] = "Border";
  QrCodeDataType2[QrCodeDataType2["Data"] = 0] = "Data";
  QrCodeDataType2[QrCodeDataType2["Function"] = 1] = "Function";
  QrCodeDataType2[QrCodeDataType2["Position"] = 2] = "Position";
  QrCodeDataType2[QrCodeDataType2["Timing"] = 3] = "Timing";
  QrCodeDataType2[QrCodeDataType2["Alignment"] = 4] = "Alignment";
  return QrCodeDataType2;
})(QrCodeDataType || {});

const LOW = [0, 1];
const MEDIUM = [1, 0];
const QUARTILE = [2, 3];
const HIGH = [3, 2];
const EccMap = {
  L: LOW,
  M: MEDIUM,
  Q: QUARTILE,
  H: HIGH
};
const NUMERIC_REGEX = /^\d*$/;
const ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+./:-]*$/;
const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const MIN_VERSION = 1;
const MAX_VERSION = 40;
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;
const ECC_CODEWORDS_PER_BLOCK = [
  // Version: (note that index 0 is for padding, and is set to an illegal value)
  // 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  // Low
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  // Medium
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  // Quartile
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  // High
];
const NUM_ERROR_CORRECTION_BLOCKS = [
  // Version: (note that index 0 is for padding, and is set to an illegal value)
  // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  // Low
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  // Medium
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  // Quartile
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  // High
];
class QrCode {
  /* -- Constructor (low level) and fields -- */
  // Creates a new QR Code with the given version number,
  // error correction level, data codeword bytes, and mask number.
  // This is a low-level API that most users should not use directly.
  // A mid-level API is the encodeSegments() function.
  constructor(version, ecc, dataCodewords, msk) {
    this.version = version;
    this.ecc = ecc;
    if (version < MIN_VERSION || version > MAX_VERSION)
      throw new RangeError("Version value out of range");
    if (msk < -1 || msk > 7)
      throw new RangeError("Mask value out of range");
    this.size = version * 4 + 17;
    const row = Array.from({ length: this.size }).fill(false);
    for (let i = 0; i < this.size; i++) {
      this.modules.push(row.slice());
      this.types.push(row.map(() => 0));
    }
    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);
    if (msk === -1) {
      let minPenalty = 1e9;
      for (let i = 0; i < 8; i++) {
        this.applyMask(i);
        this.drawFormatBits(i);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          msk = i;
          minPenalty = penalty;
        }
        this.applyMask(i);
      }
    }
    this.mask = msk;
    this.applyMask(msk);
    this.drawFormatBits(msk);
  }
  /* -- Fields -- */
  // The width and height of this QR Code, measured in modules, between
  // 21 and 177 (inclusive). This is equal to version * 4 + 17.
  size;
  // The index of the mask pattern used in this QR Code, which is between 0 and 7 (inclusive).
  // Even if a QR Code is created with automatic masking requested (mask = -1),
  // the resulting object still has a mask value between 0 and 7.
  mask;
  // The modules of this QR Code (false = light, true = dark).
  // Immutable after constructor finishes. Accessed through getModule().
  modules = [];
  types = [];
  /* -- Accessor methods -- */
  // Returns the color of the module (pixel) at the given coordinates, which is false
  // for light or true for dark. The top left corner has the coordinates (x=0, y=0).
  // If the given coordinates are out of bounds, then false (light) is returned.
  getModule(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size && this.modules[y][x];
  }
  /* -- Private helper methods for constructor: Drawing function modules -- */
  // Reads this object's version field, and draws and marks all function modules.
  drawFunctionPatterns() {
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0, QrCodeDataType.Timing);
      this.setFunctionModule(i, 6, i % 2 === 0, QrCodeDataType.Timing);
    }
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);
    const alignPatPos = this.getAlignmentPatternPositions();
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if (!(i === 0 && j === 0 || i === 0 && j === numAlign - 1 || i === numAlign - 1 && j === 0))
          this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  }
  // Draws two copies of the format bits (with its own error correction code)
  // based on the given mask and this object's error correction level field.
  drawFormatBits(mask) {
    const data = this.ecc[1] << 3 | mask;
    let rem = data;
    for (let i = 0; i < 10; i++)
      rem = rem << 1 ^ (rem >>> 9) * 1335;
    const bits = (data << 10 | rem) ^ 21522;
    for (let i = 0; i <= 5; i++)
      this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++)
      this.setFunctionModule(14 - i, 8, getBit(bits, i));
    for (let i = 0; i < 8; i++)
      this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++)
      this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    this.setFunctionModule(8, this.size - 8, true);
  }
  // Draws two copies of the version bits (with its own error correction code),
  // based on this object's version field, iff 7 <= version <= 40.
  drawVersion() {
    if (this.version < 7)
      return;
    let rem = this.version;
    for (let i = 0; i < 12; i++)
      rem = rem << 1 ^ (rem >>> 11) * 7973;
    const bits = this.version << 12 | rem;
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + i % 3;
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }
  // Draws a 9*9 finder pattern including the border separator,
  // with the center module at (x, y). Modules can be out of bounds.
  drawFinderPattern(x, y) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size)
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4, QrCodeDataType.Position);
      }
    }
  }
  // Draws a 5*5 alignment pattern, with the center module
  // at (x, y). All modules must be in bounds.
  drawAlignmentPattern(x, y) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(
          x + dx,
          y + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
          QrCodeDataType.Alignment
        );
      }
    }
  }
  // Sets the color of a module and marks it as a function module.
  // Only used by the constructor. Coordinates must be in bounds.
  setFunctionModule(x, y, isDark, type = QrCodeDataType.Function) {
    this.modules[y][x] = isDark;
    this.types[y][x] = type;
  }
  /* -- Private helper methods for constructor: Codewords and masking -- */
  // Returns a new byte string representing the given data with the appropriate error correction
  // codewords appended to it, based on this object's version and error correction level.
  addEccAndInterleave(data) {
    const ver = this.version;
    const ecl = this.ecc;
    if (data.length !== getNumDataCodewords(ver, ecl))
      throw new RangeError("Invalid argument");
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver];
    const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - rawCodewords % numBlocks;
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);
    const blocks = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks)
        dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const result = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks)
          result.push(block[i]);
      });
    }
    return result;
  }
  // Draws the given sequence of 8-bit codewords (data and error correction) onto the entire
  // data area of this QR Code. Function modules need to be marked off before this is called.
  drawCodewords(data) {
    if (data.length !== Math.floor(getNumRawDataModules(this.version) / 8))
      throw new RangeError("Invalid argument");
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6)
        right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = (right + 1 & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.types[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }
  // XORs the codeword modules in this QR Code with the given mask pattern.
  // The function modules must be marked and the codeword bits must be drawn
  // before masking. Due to the arithmetic of XOR, calling applyMask() with
  // the same mask value a second time will undo the mask. A final well-formed
  // QR Code needs exactly one (not zero, two, etc.) mask applied.
  applyMask(mask) {
    if (mask < 0 || mask > 7)
      throw new RangeError("Mask value out of range");
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = x * y % 2 + x * y % 3 === 0;
            break;
          case 6:
            invert = (x * y % 2 + x * y % 3) % 2 === 0;
            break;
          case 7:
            invert = ((x + y) % 2 + x * y % 3) % 2 === 0;
            break;
          default:
            throw new Error("Unreachable");
        }
        if (!this.types[y][x] && invert)
          this.modules[y][x] = !this.modules[y][x];
      }
    }
  }
  // Calculates and returns the penalty score based on state of this QR Code's current modules.
  // This is used by the automatic mask choice algorithm to find the mask pattern that yields the lowest score.
  getPenaltyScore() {
    let result = 0;
    for (let y = 0; y < this.size; y++) {
      let runColor = false;
      let runX = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x] === runColor) {
          runX++;
          if (runX === 5)
            result += PENALTY_N1;
          else if (runX > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y][x];
          runX = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
    }
    for (let x = 0; x < this.size; x++) {
      let runColor = false;
      let runY = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < this.size; y++) {
        if (this.modules[y][x] === runColor) {
          runY++;
          if (runY === 5)
            result += PENALTY_N1;
          else if (runY > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y][x];
          runY = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
    }
    for (let y = 0; y < this.size - 1; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        const color = this.modules[y][x];
        if (color === this.modules[y][x + 1] && color === this.modules[y + 1][x] && color === this.modules[y + 1][x + 1]) {
          result += PENALTY_N2;
        }
      }
    }
    let dark = 0;
    for (const row of this.modules)
      dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
    const total = this.size * this.size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;
    return result;
  }
  /* -- Private helper functions -- */
  // Returns an ascending list of positions of alignment patterns for this version number.
  // Each position is in the range [0,177), and are used on both the x and y axes.
  // This could be implemented as lookup table of 40 variable-length lists of integers.
  getAlignmentPatternPositions() {
    if (this.version === 1) {
      return [];
    } else {
      const numAlign = Math.floor(this.version / 7) + 2;
      const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
      const result = [6];
      for (let pos = this.size - 7; result.length < numAlign; pos -= step)
        result.splice(1, 0, pos);
      return result;
    }
  }
  // Can only be called immediately after a light run is added, and
  // returns either 0, 1, or 2. A helper function for getPenaltyScore().
  finderPenaltyCountPatterns(runHistory) {
    const n = runHistory[1];
    const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
  }
  // Must be called at the end of a line (row or column) of modules. A helper function for getPenaltyScore().
  finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }
  // Pushes the given value to the front and drops the last value. A helper function for getPenaltyScore().
  finderPenaltyAddHistory(currentRunLength, runHistory) {
    if (runHistory[0] === 0)
      currentRunLength += this.size;
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }
}
function appendBits(val, len, bb) {
  if (len < 0 || len > 31 || val >>> len !== 0)
    throw new RangeError("Value out of range");
  for (let i = len - 1; i >= 0; i--)
    bb.push(val >>> i & 1);
}
function getBit(x, i) {
  return (x >>> i & 1) !== 0;
}
class QrSegment {
  // Creates a new QR Code segment with the given attributes and data.
  // The character count (numChars) must agree with the mode and the bit buffer length,
  // but the constraint isn't checked. The given bit buffer is cloned and stored.
  constructor(mode, numChars, bitData) {
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData;
    if (numChars < 0)
      throw new RangeError("Invalid argument");
    this.bitData = bitData.slice();
  }
  /* -- Methods -- */
  // Returns a new copy of the data bits of this segment.
  getData() {
    return this.bitData.slice();
  }
}
const MODE_NUMERIC = [1, 10, 12, 14];
const MODE_ALPHANUMERIC = [2, 9, 11, 13];
const MODE_BYTE = [4, 8, 16, 16];
function numCharCountBits(mode, ver) {
  return mode[Math.floor((ver + 7) / 17) + 1];
}
function makeBytes(data) {
  const bb = [];
  for (const b of data)
    appendBits(b, 8, bb);
  return new QrSegment(MODE_BYTE, data.length, bb);
}
function makeNumeric(digits) {
  if (!isNumeric(digits))
    throw new RangeError("String contains non-numeric characters");
  const bb = [];
  for (let i = 0; i < digits.length; ) {
    const n = Math.min(digits.length - i, 3);
    appendBits(Number.parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
    i += n;
  }
  return new QrSegment(MODE_NUMERIC, digits.length, bb);
}
function makeAlphanumeric(text) {
  if (!isAlphanumeric(text))
    throw new RangeError("String contains unencodable characters in alphanumeric mode");
  const bb = [];
  let i;
  for (i = 0; i + 2 <= text.length; i += 2) {
    let temp = ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
    temp += ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
    appendBits(temp, 11, bb);
  }
  if (i < text.length)
    appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
  return new QrSegment(MODE_ALPHANUMERIC, text.length, bb);
}
function makeSegments(text) {
  if (text === "")
    return [];
  else if (isNumeric(text))
    return [makeNumeric(text)];
  else if (isAlphanumeric(text))
    return [makeAlphanumeric(text)];
  else
    return [makeBytes(toUtf8ByteArray(text))];
}
function isNumeric(text) {
  return NUMERIC_REGEX.test(text);
}
function isAlphanumeric(text) {
  return ALPHANUMERIC_REGEX.test(text);
}
function getTotalBits(segs, version) {
  let result = 0;
  for (const seg of segs) {
    const ccbits = numCharCountBits(seg.mode, version);
    if (seg.numChars >= 1 << ccbits)
      return Number.POSITIVE_INFINITY;
    result += 4 + ccbits + seg.bitData.length;
  }
  return result;
}
function toUtf8ByteArray(str) {
  str = encodeURI(str);
  const result = [];
  for (let i = 0; i < str.length; i++) {
    if (str.charAt(i) !== "%") {
      result.push(str.charCodeAt(i));
    } else {
      result.push(Number.parseInt(str.substring(i + 1, i + 3), 16));
      i += 2;
    }
  }
  return result;
}
function getNumRawDataModules(ver) {
  if (ver < MIN_VERSION || ver > MAX_VERSION)
    throw new RangeError("Version number out of range");
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7)
      result -= 36;
  }
  return result;
}
function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
}
function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255)
    throw new RangeError("Degree out of range");
  const result = [];
  for (let i = 0; i < degree - 1; i++)
    result.push(0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length)
        result[j] ^= result[j + 1];
    }
    root = reedSolomonMultiply(root, 2);
  }
  return result;
}
function reedSolomonComputeRemainder(data, divisor) {
  const result = divisor.map((_) => 0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => result[i] ^= reedSolomonMultiply(coef, factor));
  }
  return result;
}
function reedSolomonMultiply(x, y) {
  if (x >>> 8 !== 0 || y >>> 8 !== 0)
    throw new RangeError("Byte out of range");
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = z << 1 ^ (z >>> 7) * 285;
    z ^= (y >>> i & 1) * x;
  }
  return z;
}
function encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true) {
  if (!(MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= MAX_VERSION) || mask < -1 || mask > 7) {
    throw new RangeError("Invalid value");
  }
  let version;
  let dataUsedBits;
  for (version = minVersion; ; version++) {
    const dataCapacityBits2 = getNumDataCodewords(version, ecl) * 8;
    const usedBits = getTotalBits(segs, version);
    if (usedBits <= dataCapacityBits2) {
      dataUsedBits = usedBits;
      break;
    }
    if (version >= maxVersion)
      throw new RangeError("Data too long");
  }
  for (const newEcl of [MEDIUM, QUARTILE, HIGH]) {
    if (boostEcl && dataUsedBits <= getNumDataCodewords(version, newEcl) * 8)
      ecl = newEcl;
  }
  const bb = [];
  for (const seg of segs) {
    appendBits(seg.mode[0], 4, bb);
    appendBits(seg.numChars, numCharCountBits(seg.mode, version), bb);
    for (const b of seg.getData())
      bb.push(b);
  }
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - bb.length % 8) % 8, bb);
  for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= 236 ^ 17)
    appendBits(padByte, 8, bb);
  const dataCodewords = Array.from({ length: Math.ceil(bb.length / 8) }, () => 0);
  bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << 7 - (i & 7));
  return new QrCode(version, ecl, dataCodewords, mask);
}

function encode(data, options) {
  const {
    ecc = "L",
    boostEcc = false,
    minVersion = 1,
    maxVersion = 40,
    maskPattern = -1,
    border = 1
  } = options || {};
  const segment = typeof data === "string" ? makeSegments(data) : Array.isArray(data) ? [makeBytes(data)] : void 0;
  if (!segment)
    throw new Error(`uqr only supports encoding string and binary data, but got: ${typeof data}`);
  const qr = encodeSegments(
    segment,
    EccMap[ecc],
    minVersion,
    maxVersion,
    maskPattern,
    boostEcc
  );
  const result = addBorder({
    version: qr.version,
    maskPattern: qr.mask,
    size: qr.size,
    data: qr.modules,
    types: qr.types
  }, border);
  if (options?.invert)
    result.data = result.data.map((row) => row.map((mod) => !mod));
  options?.onEncoded?.(result);
  return result;
}
function addBorder(input, border = 1) {
  if (!border)
    return input;
  const { size } = input;
  const newSize = size + border * 2;
  input.size = newSize;
  input.data.forEach((row) => {
    for (let i = 0; i < border; i++) {
      row.unshift(false);
      row.push(false);
    }
  });
  for (let i = 0; i < border; i++) {
    input.data.unshift(Array.from({ length: newSize }, (_) => false));
    input.data.push(Array.from({ length: newSize }, (_) => false));
  }
  const b = QrCodeDataType.Border;
  input.types.forEach((row) => {
    for (let i = 0; i < border; i++) {
      row.unshift(b);
      row.push(b);
    }
  });
  for (let i = 0; i < border; i++) {
    input.types.unshift(Array.from({ length: newSize }, (_) => b));
    input.types.push(Array.from({ length: newSize }, (_) => b));
  }
  return input;
}
function getDataAt(data, x, y, defaults = false) {
  if (x < 0 || y < 0 || x >= data.length || y >= data.length)
    return defaults;
  return data[y][x];
}

function renderUnicode(data, options = {}) {
  const {
    whiteChar = "\u2588",
    blackChar = "\u2591"
  } = options;
  const result = encode(data, options);
  return result.data.map((row) => {
    return row.map((mod) => mod ? blackChar : whiteChar).join("");
  }).join("\n");
}
function renderANSI(data, options = {}) {
  return renderUnicode(data, {
    ...options,
    blackChar: "\x1B[40m\u3000\x1B[0m",
    whiteChar: "\x1B[47m\u3000\x1B[0m"
  });
}
function renderUnicodeCompact(data, options = {}) {
  const palette = {
    WHITE_ALL: "\u2588",
    WHITE_BLACK: "\u2580",
    BLACK_WHITE: "\u2584",
    BLACK_ALL: " "
  };
  const result = encode(data, options);
  const WHITE = false;
  const BLACK = true;
  const at = (x, y) => getDataAt(result.data, x, y, true);
  const lines = [];
  let line = "";
  for (let row = 0; row < result.size; row += 2) {
    for (let col = 0; col < result.size; col++) {
      if (at(col, row) === WHITE && at(col, row + 1) === WHITE)
        line += palette.WHITE_ALL;
      else if (at(col, row) === WHITE && at(col, row + 1) === BLACK)
        line += palette.WHITE_BLACK;
      else if (at(col, row) === BLACK && at(col, row + 1) === WHITE)
        line += palette.BLACK_WHITE;
      else
        line += palette.BLACK_ALL;
    }
    lines.push(line);
    line = "";
  }
  return lines.join("\n");
}

function escapeAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderSVG(data, options = {}) {
  const result = encode(data, options);
  const {
    pixelSize = 10,
    whiteColor = "white",
    blackColor = "black"
  } = options;
  const height = result.size * pixelSize;
  const width = result.size * pixelSize;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
  const paths = [];
  for (let row = 0; row < result.size; row++) {
    for (let col = 0; col < result.size; col++) {
      const x = col * pixelSize;
      const y = row * pixelSize;
      if (result.data[row][col])
        paths.push(`M${x},${y}h${pixelSize}v${pixelSize}h-${pixelSize}z`);
    }
  }
  svg += `<rect fill="${escapeAttr(whiteColor)}" width="${width}" height="${height}"/>`;
  svg += `<path fill="${escapeAttr(blackColor)}" d="${paths.join("")}"/>`;
  svg += "</svg>";
  return svg;
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/png.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Encodage PNG minimal, sans dépendance.
 *
 * Un PNG est une suite de blocs : signature, `IHDR` (dimensions et format),
 * `IDAT` (les pixels, compressés en zlib), `IEND`. Chaque bloc porte son CRC32.
 *
 * On n'encode qu'un seul format — RVBA 8 bits, non entrelacé — ce qui suffit
 * pour des QR codes et des icônes, et évite d'embarquer une bibliothèque
 * graphique. Le même encodeur sert aux icônes de l'extension et aux images
 * intégrées dans l'export tableur.
 *
 * La compression passe par `CompressionStream('deflate')`, qui produit
 * exactement le flux zlib attendu par `IDAT` et existe aussi bien dans les
 * navigateurs que dans Node. `node:zlib` n'est donc pas nécessaire : il
 * n'existe pas dans une page web.
 */

/** Table de contrôle CRC32, calculée une fois. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * Calcule le CRC32 d'un tampon, tel qu'attendu par les blocs PNG.
 * @param {Uint8Array} bytes
 * @returns {number}
 */
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Compresse un tampon en flux zlib.
 *
 * `CompressionStream('deflate')` produit un flux zlib — en-tête et somme de
 * contrôle Adler-32 comprises — soit exactement ce qu'attend le bloc `IDAT`.
 * Le mode `'deflate-raw'` ne conviendrait pas.
 *
 * @param {Uint8Array} bytes
 * @returns {Promise<Uint8Array>}
 */
async function deflate(bytes) {
  if (typeof CompressionStream !== 'function') {
    throw new Error(
      'CompressionStream est indisponible : impossible de produire un PNG. ' +
      'Cet environnement est trop ancien.',
    );
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Assemble un bloc PNG : longueur, type, données, CRC.
 * @param {string} type
 * @param {Uint8Array} body
 * @returns {Uint8Array}
 */
function chunk(type, body) {
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, body.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(body, 8);
  view.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)));
  return out;
}

/**
 * Encode une image RVBA en PNG.
 *
 * @param {{ width: number, height: number, data: Uint8Array }} image
 *   `data` contient 4 octets par pixel, ligne par ligne.
 * @returns {Promise<Uint8Array>}
 * @throws {RangeError} si les dimensions sont absurdes ou les données incohérentes.
 */
async function encodePng(image) {
  const { width, height } = image;
  const data = image.data;

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(`dimensions invalides : ${width} × ${height}`);
  }
  if (data.length !== width * height * 4) {
    throw new RangeError(
      `données incohérentes : ${data.length} octets pour ${width} × ${height} pixels RVBA`,
    );
  }

  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8; // 8 bits par composante
  ihdr[9] = 6; // type de couleur : RVBA
  ihdr[10] = 0; // compression : deflate
  ihdr[11] = 0; // filtrage : standard
  ihdr[12] = 0; // entrelacement : aucun

  // Chaque ligne est précédée d'un octet de filtre, ici « aucun ».
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  const idat = await deflate(raw);
  const parts = [signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))];

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}

/**
 * Construit un tampon RVBA à partir d'une matrice monochrome.
 *
 * @param {boolean[][]} pixels `pixels[y][x] === true` pour un pixel noir.
 * @param {{ dark?: [number, number, number], light?: [number, number, number] }} [options]
 * @returns {{ width: number, height: number, data: Uint8Array }}
 */
function rgbaFromMatrix(pixels, options = {}) {
  const height = pixels.length;
  const width = height > 0 ? pixels[0].length : 0;
  const dark = options.dark ?? [0, 0, 0];
  const light = options.light ?? [255, 255, 255];

  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = pixels[y][x] ? dark : light;
      const offset = (y * width + x) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 0xff;
    }
  }
  return { width, height, data };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/qr.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Encodage QR code.
 *
 * On s'appuie sur `uqr` (ESM pur, sans dépendance) qui renvoie une matrice
 * booléenne. C'est exactement la représentation dont a besoin le pipeline
 * d'impression thermique : on évite ainsi tout aller-retour par une image
 * bitmap intermédiaire, qui dégraderait la netteté du QR à l'impression.
 */





/** Niveaux de correction d'erreur acceptés par `uqr`. */
const ECC_LEVELS = ['L', 'M', 'Q', 'H'];

/**
 * @typedef {Object} QrMatrix
 * @property {boolean[][]} data   `data[y][x] === true` pour un module noir.
 * @property {number}      size   Nombre de modules par côté, bordure comprise.
 * @property {number}      version Version QR (1-40).
 * @property {number}      border Taille de la bordure (en modules).
 */

/**
 * Encode une chaîne en matrice QR.
 *
 * @param {string} text
 * @param {{ ecc?: 'L'|'M'|'Q'|'H', border?: number, minVersion?: number }} [options]
 * @returns {QrMatrix}
 */
function encodeQr(text, options = {}) {
  if (typeof text !== 'string' || text === '') {
    throw new TypeError('encodeQr exige une chaîne non vide');
  }
  const ecc = ECC_LEVELS.includes(options.ecc) ? options.ecc : 'M';
  const border = Number.isInteger(options.border) ? options.border : 2;

  const result = encode(text, {
    ecc,
    border,
    minVersion: options.minVersion ?? 1,
  });

  return {
    data: result.data,
    size: result.size,
    version: result.version,
    border,
  };
}

/**
 * Nombre de pixels par module nécessaire pour qu'un QR reste lisible à une
 * densité d'impression donnée. En dessous de 3 px/module, la tête thermique
 * (203 dpi) fusionne les modules et le code devient illisible.
 *
 * @param {number} targetPx Largeur disponible en pixels.
 * @param {number} moduleCount Nombre de modules du QR, bordure comprise.
 * @returns {number} Échelle entière >= 1.
 */
function pickScale(targetPx, moduleCount) {
  if (!Number.isFinite(targetPx) || !Number.isFinite(moduleCount) || moduleCount <= 0) return 1;
  return Math.max(1, Math.floor(targetPx / moduleCount));
}

/**
 * Rend la matrice dans un contexte 2D de canvas, à l'échelle demandée.
 *
 * L'arrondi de `size * scale` est important : sans lui, les modules ne tombent
 * pas sur des pixels entiers et le QR est flou.
 *
 * @param {QrMatrix} matrix
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x?: number, y?: number, scale?: number, dark?: string, light?: string|null }} [options]
 * @returns {{ width: number, height: number }}
 */
function drawQr(matrix, ctx, options = {}) {
  const scale = Math.max(1, Math.floor(options.scale ?? 1));
  const x0 = options.x ?? 0;
  const y0 = options.y ?? 0;
  const dark = options.dark ?? '#000000';
  const light = options.light ?? null;
  const side = matrix.size * scale;

  if (light) {
    ctx.fillStyle = light;
    ctx.fillRect(x0, y0, side, side);
  }

  ctx.fillStyle = dark;
  for (let y = 0; y < matrix.size; y++) {
    const row = matrix.data[y];
    let runStart = -1;
    // On fusionne les modules noirs contigus en un seul rectangle : beaucoup
    // moins d'appels de dessin, donc un rendu nettement plus rapide sur les
    // planches de plusieurs dizaines d'étiquettes.
    for (let x = 0; x <= matrix.size; x++) {
      const isDark = x < matrix.size && row[x];
      if (isDark && runStart === -1) {
        runStart = x;
      } else if (!isDark && runStart !== -1) {
        ctx.fillRect(x0 + runStart * scale, y0 + y * scale, (x - runStart) * scale, scale);
        runStart = -1;
      }
    }
  }

  return { width: side, height: side };
}

/**
 * Rend la matrice en chaîne SVG (aperçu vectoriel, impression papier).
 *
 * @param {QrMatrix} matrix
 * @param {{ scale?: number, dark?: string, light?: string, margin?: number }} [options]
 * @returns {string}
 */
function toSvg(matrix, options = {}) {
  const scale = Math.max(1, Math.floor(options.scale ?? 1));
  const dark = options.dark ?? '#000000';
  const light = options.light ?? '#ffffff';
  const margin = options.margin ?? 0;
  const side = matrix.size * scale + margin * 2;

  const parts = [];
  for (let y = 0; y < matrix.size; y++) {
    const row = matrix.data[y];
    for (let x = 0; x < matrix.size; x++) {
      if (!row[x]) continue;
      parts.push(
        `M${margin + x * scale} ${margin + y * scale}h${scale}v${scale}h-${scale}z`,
      );
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" ` +
    `viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges">` +
    `<rect width="${side}" height="${side}" fill="${light}"/>` +
    `<path d="${parts.join('')}" fill="${dark}"/>` +
    '</svg>'
  );
}

/**
 * Encode une matrice QR en flux noir & blanc 1 bit par pixel.
 *
 * C'est le format d'image natif des têtes thermiques : un bit à 1 = point
 * chauffé = pixel noir. Les lignes sont rembourrées à l'octet.
 *
 * @param {QrMatrix} matrix
 * @param {number} scale Pixels par module.
 * @param {{ quietZone?: boolean }} [options] Si false, la bordure déjà incluse
 *   dans la matrice est conservée telle quelle (cas de l'impression d'étiquette
 *   où l'on maîtrise la marge par ailleurs).
 * @returns {{ width: number, height: number, bytesPerRow: number, rows: Uint8Array[] }}
 */
function toMonoBitmap(matrix, scale, options = {}) {
  const s = Math.max(1, Math.floor(scale));
  const size = matrix.size;
  const width = size * s;
  const height = size * s;
  const bytesPerRow = Math.ceil(width / 8);
  const rows = [];

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow);
    const srcRow = matrix.data[Math.floor(y / s)];
    for (let x = 0; x < width; x++) {
      if (!srcRow[Math.floor(x / s)]) continue;
      row[x >> 3] |= 0x80 >> (x & 7);
    }
    rows.push(row);
  }

  return { width, height, bytesPerRow, rows };
}

/**
 * Rend un QR code en image PNG.
 *
 * C'est le format attendu par un tableur : un CSV ne peut pas transporter
 * d'image, un `.xlsx` si. Le rendu se fait par plus proche voisin — un
 * redimensionnement lissé rendrait le code illisible.
 *
 * @param {string} text
 * @param {{
 *   ecc?: 'L'|'M'|'Q'|'H',
 *   border?: number,
 *   scale?: number,
 *   dark?: [number, number, number],
 *   light?: [number, number, number],
 *   maxSize?: number,
 * }} [options]
 * @returns {Promise<Uint8Array>}
 */
async function qrPng(text, options = {}) {
  const matrix = encodeQr(text, {
    ecc: options.ecc ?? 'M',
    border: options.border ?? 2,
  });

  // L'échelle est entière, et bornée pour qu'une URL longue ne produise pas une
  // image démesurée dans le classeur.
  const requested = Math.max(1, Math.floor(options.scale ?? 8));
  const maxSize = options.maxSize ?? 512;
  const scale = Math.max(1, Math.min(requested, Math.floor(maxSize / matrix.size)));

  const size = matrix.size * scale;
  const dark = options.dark ?? [0, 0, 0];
  const light = options.light ?? [255, 255, 255];
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const sourceRow = matrix.data[Math.floor(y / scale)];
    for (let x = 0; x < size; x++) {
      const color = sourceRow[Math.floor(x / scale)] ? dark : light;
      const offset = (y * size + x) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 0xff;
    }
  }

  return encodePng({ width: size, height: size, data });
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/label.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Composition d'une étiquette : un QR code et une URL lisible.
 *
 * Ce module ne dépend d'aucune imprimante : il décrit une géométrie en pixels
 * pour une largeur de tête et une résolution données. Les profils concrets
 * (D110, M2) vivent dans `printer/profiles.js`, ce qui permet de tester la mise
 * en page sans matériel.
 */




/**
 * @typedef {Object} LabelGeometry
 * @property {number} width       Largeur totale en pixels.
 * @property {number} height      Hauteur totale en pixels.
 * @property {number} padding     Marge intérieure en pixels.
 * @property {number} qrSize      Côté du QR en pixels (multiple de l'échelle).
 * @property {number} textTop     Ordonnée du premier texte.
 * @property {number} lineHeight  Hauteur de ligne de texte.
 * @property {string[]} lines     Lignes de texte déjà découpées.
 * @property {number} fontSize    Taille de police en pixels.
 * @property {number} qrScale     Pixels par module du QR.
 * @property {number} pxPerModule Pixels par module.
 * @property {boolean} fits       false si le QR ne tient pas dans la largeur utile.
 * @property {import('./qr.js').QrMatrix} qrMatrix Matrice encodée.
 */

/**
 * Contenu textuel d'une étiquette Niimbot, selon le mode choisi.
 *
 * Le même vocabulaire que l'export d'images (`TEXT_MODES`), pour qu'on n'ait
 * qu'une chose à apprendre : QR seul, QR + titre, QR + URL, etc. La date, elle,
 * suit le réglage global « Date sous le QR code » et s'ajoute en dernier.
 *
 * Le titre et la date occupent chacun **une ligne réservée** : `extraLines`
 * prévient la géométrie, sans quoi la dernière ligne serait rognée.
 *
 * @param {{ url: string, title?: string }} link
 * @param {string} mode `none`, `title`, `url`, `title-url` ou `host`.
 * @param {string[]} [dateLines] Lignes de date à imprimer sous le texte, déjà
 *   découpées à la largeur utile. Un tableau vide n'imprime rien.
 * @returns {{ text: string, showTitle: boolean, extraLines: number, extraText: string[] }}
 */
function labelContent(link, mode, dateLines = []) {
  // Un titre absent ne doit pas réserver une ligne vide.
  const title = typeof link.title === 'string' ? link.title : '';
  const wantsTitle = (mode === 'title' || mode === 'title-url') && title !== '';

  let text = '';
  if (mode === 'url' || mode === 'title-url') text = link.url;
  else if (mode === 'host') text = hostOf(link.url);
  else if (mode === 'title' && !wantsTitle) text = link.url; // titre vide : l'URL

  // La date arrive déjà découpée : « 15/09/2026 21:28 » demande 114 px là où un
  // D110 n'en offre que 84, et `drawLabel` écrit ses lignes telles quelles.
  const extraText = Array.isArray(dateLines) ? dateLines.filter(Boolean) : [];

  return {
    text,
    showTitle: wantsTitle,
    extraLines: (wantsTitle ? 1 : 0) + extraText.length,
    extraText,
  };
}

/**
 * Prépare la date à imprimer sous le QR, en la découpant si elle ne tient pas.
 *
 * `drawLabel` écrit chaque ligne supplémentaire telle quelle, sans la découper :
 * une date trop large déborderait. On lui fournit donc des lignes déjà prêtes.
 * La date est rendue **entière** ou pas du tout.
 *
 * @param {(text: string) => number} measure Mesure du texte, à la taille de police retenue.
 * @param {string} dateText Date déjà mise en forme.
 * @param {number} maxWidth Largeur utile, en pixels.
 * @param {number} maxLines Nombre de lignes que la date peut occuper.
 * @returns {string[]} Lignes de la date, ou un tableau vide si elle ne tient pas.
 */
function wrapDate(measure, dateText, maxWidth, maxLines, options = {}) {
  if (dateText === '' || maxLines <= 0) return [];
  // Mode strict : on ne coupe qu'à l'endroit qui se lit bien — l'espace entre la
  // date et l'heure. C'est ce que veut la recherche de taille de police, qui
  // préfère réduire la police plutôt que de couper au milieu.
  const strict = options.strict !== false;

  // Une ligne entière d'abord : couper « 15/09/2026 10:30 » en deux alors qu'il
  // tient d'un seul tenant gaspille une ligne et allonge l'étiquette pour rien.
  if (measure(dateText) <= maxWidth) return [dateText];

  // Sinon, la date ne se coupe pas n'importe où : « 15/09/ » puis « 2026 » se
  // lit mal et fait hésiter. Le seul point de coupure acceptable est l'espace
  // entre la date et l'heure, qui donne deux morceaux entiers et lisibles.
  const parts = dateText.trim().split(/\s+/);
  if (parts.length > 1) {
    const [jour, heure] = [parts[0], parts.slice(1).join(' ')];
    if (measure(jour) <= maxWidth && measure(heure) <= maxWidth) return [jour, heure];
  }

  if (strict) return [];

  // Repli : on découpe au plus près, quitte à couper dans la date. C'est ce que
  // fait un rendu à police imposée — un export où l'utilisateur a réglé la
  // taille. Mieux vaut une date coupée proprement qu'aucune date, et rien n'est
  // perdu : le découpage est vérifié avant d'être retenu.
  const lignes = wrapText(measure, dateText, maxWidth, { maxLines });
  const entier = lignes.join('').replace(/\s/g, '') === dateText.replace(/\s/g, '');
  return entier ? lignes : [];
}

/**
 * Plus grande taille de police à laquelle la date tient sur une ligne entière.
 *
 * La date est écrite d'un bloc : si la police retenue la fait déborder, elle
 * était jusqu'ici coupée en plein milieu (« 15/09/ » puis « 2026 »). On préfère
 * réduire la police du texte — l'étiquette entière reste cohérente — plutôt que
 * d'amputer la date. Renvoie `0` si même le plancher de lisibilité ne suffit
 * pas, auquel cas la date est abandonnée et l'interface le dit.
 *
 * @param {(size: number) => ((text: string) => number)} measureFactory
 * @param {string} dateText
 * @param {number} maxWidth
 * @param {number} floor Taille minimale acceptable, en pixels.
 * @returns {number} Taille retenue, ou 0.
 */
function fontSizeForDate(measureFactory, dateText, maxWidth, floor, maxLines = 2) {
  // On juge sur le découpage réel, pas sur la ligne entière. Exiger que
  // « 15/09/2026 21:07 » tienne d'un seul tenant rejetait la date en bloc,
  // alors que `wrapDate` la coupe proprement en « 15/09/2026 » et « 21:07 » :
  // cocher « Avec l'heure » ne donnait donc aucune date du tout.
  for (let size = 40; size >= floor; size--) {
    const lignes = wrapDate(measureFactory(size), dateText, maxWidth, maxLines);
    if (lignes.length > 0) return size;
  }
  return 0;
}

/**
 * Plancher de police, en pixels, pour une largeur de tête donnée.
 *
 * `MIN_FONT_MM` est la cible, mais une tête plus étroite que la police minimale
 * ne pourrait rien imprimer : on ne descend jamais sous la moitié de cette
 * cible, quelle que soit la largeur.
 *
 * @param {number} width Largeur de tête en pixels.
 * @param {number} dpi
 * @returns {number}
 */
function pxToMmFloor(width, dpi) {
  // C'est la lisibilité qui fixe le plancher, pas la largeur. Prendre le
  // minimum des deux faisait toujours gagner la valeur dérivée de la largeur
  // (8 px sur une tête de 96, soit 1 mm) : le texte descendait sous le seuil
  // de lisibilité dès qu'on cochait titre et URL. Une police plus étroite que
  // la tête se découpe en lignes ; elle n'a pas besoin d'être rapetissée.
  return Math.max(6, mmToPx(MIN_FONT_MM, dpi));
}

/**
 * Compose le contenu d'une étiquette à partir de choix indépendants.
 *
 * Remplace l'ancien mode unique — « QR + titre », « QR + URL »… — par des cases
 * qui se cumulent : le titre, l'URL, le domaine, le numéro et la date ne
 * s'excluent pas. Le numéro sert à retrouver la ligne de la liste quand
 * l'étiquette est trop petite pour porter l'URL entière.
 *
 * @param {{ url: string, title?: string }} link
 * @param {{
 *   index?: number|null,
 *   title?: boolean,
 *   url?: boolean,
 *   host?: boolean,
 *   indexVisible?: boolean,
 *   dateLines?: string[],
 * }} options
 * @returns {{ text: string, showTitle: boolean, extraLines: number, extraText: string[] }}
 */
function labelContentFromChoices(link, options = {}) {
  const title = typeof link.title === 'string' ? link.title.trim() : '';
  // Le titre n'est repris que s'il existe : cocher « Titre » sur un lien sans
  // titre ne doit pas laisser une ligne vide sous le QR.
  const showTitle = options.title === true && title !== '';

  const parts = [];
  // Le numéro vient en tête : c'est ce qu'on cherche des yeux sur une petite
  // étiquette, avant même le titre.
  if (options.indexVisible === true && Number.isFinite(options.index)) {
    parts.push(`N° ${options.index}`);
  }
  if (showTitle) parts.push(title);
  if (options.url === true) parts.push(link.url);
  if (options.host === true) parts.push(hostOf(link.url));

  // Le titre est rendu en gras par `drawLabel`, donc à part du texte courant :
  // le mêler aux autres segments lui ferait perdre sa mise en forme.
  const text = parts.filter((part) => part !== '' && part !== title).join(' ');
  const extraText = Array.isArray(options.dateLines) ? options.dateLines.filter(Boolean) : [];

  // Le titre est découpé comme le reste du texte. Il était réservé sur **une**
  // ligne puis écrit sans découpe : un titre long débordait de l'étiquette, ou
  // se faisait couper au bord. `options.titleLines` porte les lignes déjà
  // découpées ; `titleLines` vaut 1 par défaut, pour ne rien changer aux
  // appelants qui n'en fournissent pas.
  const titleLines = Array.isArray(options.titleLines) && options.titleLines.length > 0
    ? options.titleLines
    : (showTitle ? [title] : []);

  return {
    text,
    showTitle,
    titleLines,
    extraLines: titleLines.length + extraText.length,
    extraText,
  };
}

/** Échelle minimale : sous 2 px par module, la tête thermique fusionne les points. */
const MIN_QR_SCALE = 2;

/**
 * Hauteur de texte minimale, en millimètres.
 *
 * À 203 dpi, `width * 0.085` donnait 8 px sur une tête de 96 px — soit 1 mm de
 * haut. Les chiffres montaient à 3 px : illisible à l'œil nu, et c'est le
 * défaut que ce plancher corrige. 1,6 mm est le minimum qu'on lise sans effort
 * sur une étiquette thermique.
 */
const MIN_FONT_MM = 1.6;

/**
 * Part de la hauteur que le texte peut occuper au maximum.
 *
 * Le reste va au QR : une étiquette où le texte mange les deux tiers de la
 * longueur ne se scanne plus. Sans ce plafond, une URL longue sur une longueur
 * de rouleau confortable ferait exactement cela.
 */
const LABEL_TEXT_HEIGHT_RATIO = 0.45;

/**
 * Disposition verticale de l'étiquette.
 *
 * `top` garde la composition resserrée en haut, telle qu'elle était avant que
 * la longueur du rouleau soit connue : c'est le repli quand aucune longueur
 * n'est renseignée.
 */
const LABEL_ALIGNMENTS = Object.freeze([
  { id: 'center', label: 'Centré' },
  { id: 'top', label: 'En haut' },
  { id: 'spread', label: 'Réparti (QR en haut, texte en bas)' },
]);

/** Disposition retenue par défaut. */
const DEFAULT_LABEL_ALIGNMENT = 'center';

/**
 * Taille de police maximale, en part de la largeur de la tête.
 *
 * Une longueur de rouleau confortable donne envie de grossir le texte jusqu'à
 * remplir la place. Au-delà de ce plafond, le texte devient plus gros que le QR
 * qu'il accompagne : l'étiquette perd son équilibre et le QR, seul élément
 * utile, passe au second plan. Le reste de la place va aux marges.
 */
const MAX_FONT_WIDTH_RATIO = 0.18;

/**
 * Largeur minimale d'une colonne de texte, en pixels.
 *
 * En dessous, la disposition latérale n'a plus de sens : une URL dense occupe
 * tant de modules qu'il ne reste que quelques pixels, soit deux ou trois
 * caractères par ligne. Mieux vaut empiler, et le dire, que produire un texte
 * illisible.
 */
const MIN_LATERAL_TEXT_PX = 18;

/**
 * Découpe un texte en lignes tenant dans une largeur donnée.
 *
 * Le découpage se fait sur les espaces, mais aussi après « / », « - » et « . »
 * car les URL n'ont souvent pas d'espace avant la fin du domaine. Un mot plus
 * long que la largeur disponible est coupé caractère par caractère plutôt que
 * de déborder.
 *
 * @param {(text: string) => number} measure Largeur d'un texte, en pixels.
 * @param {string} text
 * @param {number} maxWidth
 * @param {{ maxLines?: number }} [options]
 * @returns {string[]}
 */
function wrapText(measure, text, maxWidth, options = {}) {
  const maxLines = options.maxLines ?? Infinity;
  if (!text) return [];
  if (maxWidth <= 0) return [text];

  const lines = [];
  let current = '';

  /** Découpe un « mot » trop long en morceaux qui tiennent seuls. */
  const splitLongWord = (word) => {
    const chunks = [];
    let chunk = '';
    for (const char of word) {
      if (measure(chunk + char) > maxWidth && chunk !== '') {
        chunks.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  };

  // On conserve les séparateurs en les rattachant au fragment précédent.
  const tokens = text.split(/(?<=[\s/\-.])/).filter((token) => token !== '');

  for (const token of tokens) {
    const candidate = current + token;
    const trimmed = candidate.replace(/\s+$/, '');

    if (measure(trimmed) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current.trim() !== '') {
      lines.push(current.trim());
      if (lines.length >= maxLines) return lines;
      current = '';
    }
    const word = token.trim();
    if (word === '') continue;

    if (measure(word) <= maxWidth) {
      current = word + (/[\s]$/.test(token) ? ' ' : '');
    } else {
      const chunks = splitLongWord(word);
      for (let i = 0; i < chunks.length - 1; i++) {
        lines.push(chunks[i]);
        if (lines.length >= maxLines) return lines;
      }
      current = chunks[chunks.length - 1] ?? '';
    }
  }

  if (current.trim() !== '' && lines.length < maxLines) lines.push(current.trim());
  return lines;
}

/**
 * Calcule la géométrie d'une étiquette.
 *
 * La hauteur n'est jamais fixée à l'avance : elle découle du nombre de lignes
 * de texte nécessaires. Cela évite de rogner une URL longue ou, à l'inverse,
 * de gaspiller une étiquette sur une URL courte.
 *
 * @param {object} options
 * @param {string} options.text           Texte à imprimer sous le QR (généralement l'URL).
 * @param {string} [options.qrText]       Contenu réellement encodé dans le QR.
 *   Distinct de `text` : les deux ne coïncident que par hasard. Un QR code
 *   peut n'avoir aucun texte sous lui (mode « QR seul »), et un titre imprimé
 *   n'est pas ce qu'on encode. Les confondre faisait lever l'encodage dès que
 *   le texte était vide — « QR code seul » et « QR + titre » ne rendaient rien.
 * @param {number} options.widthPx        Largeur utile de la tête, en pixels.
 * @param {number} [options.dpi]          Résolution, pour les conversions mm <-> px.
 * @param {number} [options.fontSize]     Taille de police en pixels.
 * @param {number} [options.padding]      Marge intérieure en pixels.
 * @param {number} [options.qrRatio]      Part maximale de la largeur utile occupée par le QR (0-1).
 * @param {number} [options.minScale]     Pixels par module minimum (défaut : MIN_QR_SCALE).
 * @param {number} [options.lineSpacing]  Interligne, en multiple de la police.
 * @param {number} [options.maxLines]     Nombre maximal de lignes de texte.
 * @param {number} [options.maxHeightPx]  Hauteur maximale imposée (0 = illimitée).
 * @param {number} [options.minHeightPx]  Hauteur minimale de l'étiquette.
 * @param {string} [options.alignment]    `center`, `top` ou `spread` : où placer
 *   le contenu quand une longueur est imposée et qu'il y a de la place en trop.
 * @param {number} [options.extraLines]   Lignes de texte supplémentaires à
 *   réserver sous celles du texte principal — la date, quand elle est demandée.
 *   Les ignorer rognerait la dernière ligne en silence.
 * @param {(text: string) => number} [options.measure] Mesure de texte injectée
 *   (obligatoire hors navigateur ; en navigateur, un canvas est créé au besoin).
 * @returns {LabelGeometry}
 */
function computeLabelGeometry(options) {
  const width = Math.max(1, Math.floor(options.widthPx));
  const dpi = options.dpi ?? 203;
  const padding = Math.max(0, Math.floor(options.padding ?? Math.round(width * 0.06)));
  const fontSize = Math.max(6, Math.floor(options.fontSize ?? mmToPx(MIN_FONT_MM, dpi)));
  const lineSpacing = options.lineSpacing ?? 1.15;
  const alignment = options.alignment ?? DEFAULT_LABEL_ALIGNMENT;

  const innerWidth = Math.max(1, width - padding * 2);
  const qrRatio = Math.min(1, Math.max(0.3, options.qrRatio ?? 0.95));
  const minScale = Math.max(1, Math.floor(options.minScale ?? MIN_QR_SCALE));
  const maxLines = options.maxLines ?? 4;

  const extraLines = Math.max(0, Math.trunc(options.extraLines ?? 0));
  const requestedAlign = LABEL_ALIGNMENTS.some((entry) => entry.id === alignment)
    ? alignment
    : DEFAULT_LABEL_ALIGNMENT;

  const minHeight = Math.max(0, Math.floor(options.minHeightPx ?? 0));
  const maxHeight = Math.max(0, Math.floor(options.maxHeightPx ?? 0));

  // La longueur du rouleau est une contrainte, pas un plancher : composer plus
  // court ne raccourcit pas l'étiquette, l'imprimante avance jusqu'à la découpe
  // suivante et le reste sort blanc. On remplit donc exactement la place.
  let target = minHeight;
  if (maxHeight > 0) target = target > 0 ? Math.min(target, maxHeight) : maxHeight;

  // Le QR a une taille entière en modules : on arrondit au multiple inférieur.
  // Ce qui est encodé n'est pas ce qui est imprimé : `qrText` prime, et à
  // défaut on retombe sur le texte affiché, comportement d'origine.
  const qrText = options.qrText ?? options.text ?? '';
  const matrix = encodeQr(qrText === '' ? ' ' : qrText, { ecc: options.ecc ?? 'M', border: 2 });
  // La mesure doit suivre la taille de police essayée : une mesure fixe servait
  // à découper pour toutes les tailles candidates, si bien que le texte découpé
  // pour 13 px était tracé à 17 px et débordait de l'étiquette. `measureFactory`
  // reçoit la taille et rend la mesure correspondante ; `measure` reste accepté
  // pour les appelants qui n'ont qu'une taille (tests, exports).
  const measureFactory = options.measureFactory
    ?? (options.measure ? () => options.measure : (size) => defaultMeasure(size));
  const measure = options.measure ?? measureFactory(fontSize);

  /** Découpe le texte pour une taille de police, dans les limites de la cible. */
  const layoutText = (size) => {
    const height = Math.ceil(size * lineSpacing);
    const mesure = measureFactory(size);
    // Le texte ne peut pas manger toute la longueur : au-delà, le QR n'a plus
    // de place et la disposition répartie le pousserait hors de l'étiquette.
    const cap = target > 0
      ? Math.max(extraLines, Math.floor((target * LABEL_TEXT_HEIGHT_RATIO) / height))
      : maxLines;
    // Le plafond de lignes protège l'équilibre entre le QR et son texte, mais il
    // ne doit pas amputer le texte : une URL coupée après « com/ » est fausse,
    // pas seulement tronquée. On compte donc les lignes qu'il faut réellement,
    // et on ne retient le plafond que s'il suffit. S'il ne suffit pas, la police
    // sera réduite par `tryFont`, qui juge sur la hauteur obtenue.
    const complet = wrapText(mesure, options.text ?? '', innerWidth, { maxLines: Infinity });
    // Ce que la longueur du rouleau peut réellement contenir : le QR, l'écart,
    // la marge, et le reste pour le texte. C'est cette borne qui empêche le
    // texte entier de dépasser l'étiquette — sans elle, garder le texte complet
    // faisait sortir 292 px sur une cible de 176.
    const placeTexte = target > 0
      ? target - padding * 2 - qrSize - (extraLines > 0 || true ? padding : 0)
      : Infinity;
    const lignesPossibles = Number.isFinite(placeTexte)
      ? Math.max(1, Math.floor(placeTexte / height))
      : Infinity;

    const plafond = Math.min(maxLines, cap, lignesPossibles);
    const suffisant = plafond >= complet.length;
    // Le plafond cède pour ne pas amputer le texte, mais jamais au-delà de ce
    // que la hauteur permet : la réduction de police fait le reste.
    const limite = suffisant ? plafond : Math.min(Math.max(plafond, complet.length), lignesPossibles);
    const limits = [Math.max(1, limite)];
    if (target > 0 && extraLines > 0) {
      // La date s'écrit sur une seule ligne, sans découpage : un interligne qui
      // la ferait dépasser ne doit pas être retenu.
      limits.push(Math.floor((target - padding) / height));
    }
    const lignes = wrapText(mesure, options.text ?? '', innerWidth, {
      maxLines: Math.max(0, Math.min(...limits)),
    });
    return {
      lines: lignes,
      lineHeight: height,
      // Le texte est-il entier ? Le plafond de lignes peut céder avant la fin
      // du texte quand la place manque, et `tryFont` refuse alors cette taille :
      // une URL coupée après « com/ » est fausse, pas seulement tronquée.
      complete: lignes.length >= complet.length,
    };
  };

  // Le texte dispose de la place que le QR lui laisse. L'ordre des candidats
  // décide de tout :
  //
  // 1. **La taille demandée passe en premier.** C'est un réglage de
  //    l'utilisateur, pas une suggestion. Elle était essayée en second, après
  //    un candidat « remplir la longueur » qui, borné par le plafond de largeur,
  //    tenait toujours — si bien que le réglage « Taille du texte » n'avait
  //    aucun effet : de 2 à 7 mm, la même police sortait. Un réglage sans effet
  //    est pire que pas de réglage.
  // 2. À défaut, remplir la longueur du rouleau.
  // 3. À défaut, la lisibilité minimale.
  //
  // Le nombre de lignes n'est pas décidé ici : il découle de la taille retenue
  // et de la place réellement disponible, un peu plus bas (`lignesPossibles`).
  const requested = Math.floor(options.fontSize ?? 0);
  const candidates = [];
  if (requested > 0) candidates.push({ size: requested, explicit: true });
  if (target > 0) candidates.push({ size: Math.floor((target * 0.22) / lineSpacing), explicit: false });
  candidates.push({ size: fontSize, explicit: false });

  const textTarget = Math.floor(innerWidth * qrRatio);
  const scale = Math.max(minScale, pickScale(textTarget, matrix.size));
  const qrSize = matrix.size * scale;
  const fits = qrSize <= innerWidth;

  // Le texte ne monte pas plus haut que cette part de la largeur de la tête :
  // au-delà il dominerait le QR au lieu de l'accompagner. C'est une règle
  // d'**équilibre**, et elle ne vaut que pour le choix automatique — voir
  // `tryFont`.
  const fontCeiling = Math.max(6, Math.floor(width * MAX_FONT_WIDTH_RATIO));

  /**
   * Essaie une taille de police et dit si elle tient.
   *
   * « Tenir » veut dire deux choses, et les deux comptent : le contenu garde la
   * marge basse de l'étiquette, et le QR conserve sa place au-dessus. Ne
   * vérifier que la première laissait passer une taille qui chassait le QR ou
   * qui collait le texte au bord.
   *
   * @param {number} size
   * @param {boolean} [explicit] Taille demandée par l'utilisateur : elle échappe
   *   au plafond d'équilibre. Le plafond existe pour empêcher le **choix
   *   automatique** de laisser le texte dominer le QR ; il n'a pas à annuler un
   *   réglage explicite, sans quoi le réglage n'a aucun effet — c'était le cas,
   *   et de 2 à 7 mm la même police sortait. La place réellement disponible
   *   reste vérifiée juste en dessous, et c'est elle qui borne.
   */
  const tryFont = (size, explicit = false) => {
    const borné = explicit ? Math.min(size, innerWidth) : Math.min(size, fontCeiling);
    const usable = Math.max(6, borné);
    const attempt = layoutText(usable);
    const textHeight = (attempt.lines.length + extraLines) * attempt.lineHeight;
    // Hauteur complète : marge haute, QR, écart, texte, **et marge basse**.
    // C'est la plus petite hauteur d'étiquette qui contienne le tout. Oublier
    // la marge basse donnait une étiquette dont le texte touchait le bord, et
    // une disposition répartie qui n'avait plus rien à répartir.
    const natural = qrSize + (attempt.lines.length + extraLines > 0 ? padding + textHeight : 0)
      + padding * 2;
    return {
      fontSize: usable,
      lines: attempt.lines,
      lineHeight: attempt.lineHeight,
      textHeight,
      naturalHeight: natural,
      // Deux conditions, et la seconde est la plus importante : la taille doit
      // tenir **et** le texte doit être entier. Une taille qui coupe le texte
      // n'est pas une taille qui tient.
      ok: (target === 0 ? true : natural <= target) && attempt.complete,
    };
  };

  let placed = null;
  let fallback = null;
  for (const candidat of candidates) {
    const attempt = tryFont(candidat.size, candidat.explicit);
    if (attempt.ok) {
      placed = attempt;
      break;
    }
    // Aucune taille ne tient : on garde la plus petite essayée, c'est-à-dire la
    // dernière, plutôt que d'abandonner le texte ou de le laisser déborder.
    fallback = attempt;
  }

  // Aucune taille essayée ne tient ? Le texte déborde parce qu'il est trop
  // gros, pas parce qu'il est trop long : on réduit alors la police jusqu'à ce
  // qu'il entre, sans descendre sous le plancher de lisibilité. Sans cette
  // recherche, `maxLines` tronquait l'URL en silence — l'étiquette sortait
  // amputée, ce qui est pire qu'un texte petit.
  if (placed === null) {
    const floor = Math.max(6, Math.floor(pxToMmFloor(width, dpi)));
    for (let size = (fallback?.fontSize ?? floor) - 1; size >= floor; size--) {
      const attempt = tryFont(size);
      if (attempt.ok) {
        placed = attempt;
        break;
      }
      fallback = attempt;
    }
  }

  placed = placed ?? fallback;

  const { lines, lineHeight } = placed;
  const textHeight = placed.textHeight;
  const contentLines = lines.length + extraLines;

  // Plus petite hauteur d'étiquette qui contienne le contenu et ses deux
  // marges. C'est elle qui décide si la longueur demandée suffit.
  const naturalHeight = placed.naturalHeight;
  // Une longueur plus courte que le contenu ne peut pas être remplie : on rend
  // la hauteur naturelle, la plus petite qui contienne tout avec ses marges.
  // La borner à la longueur annoncée ferait déborder le contenu sous le bord.
  const height = target > 0 && naturalHeight <= target ? target : naturalHeight;

  // `spread` et `center` n'ont de sens que si le contenu tient : sans cette
  // garde, une longueur trop courte placerait le texte **sous** le bord.
  const effectiveAlign = target > 0 && naturalHeight <= target ? requestedAlign : 'top';
  const slack = height - naturalHeight;

  let qrTop;
  let spreadGap = padding;
  if (effectiveAlign === 'spread') {
    qrTop = padding;
    // Le texte finit à `height - padding`. `naturalHeight` comprend déjà cette
    // marge basse : l'écart cherché est donc `slack`, et non `slack + padding`.
    spreadGap = padding + slack;
  } else if (effectiveAlign === 'center') {
    // La place restante se partage en deux : une moitié au-dessus du QR, une
    // sous le texte. Chaque moitié s'ajoute à la marge, qui reste intacte.
    const centered = Math.floor(slack / 2);
    qrTop = padding + centered;
    spreadGap = padding + (slack - centered);
  } else {
    qrTop = padding;
  }

  // Le texte peut se placer au-dessus du QR : on remonte alors le QR de la
  // hauteur du texte, pour que les deux ne se chevauchent pas. Sans ce
  // décalage, « texte au-dessus » dessinait le texte par-dessus le code.
  const blockHeight = qrSize + (contentLines > 0 ? spreadGap + textHeight : 0);
  const top = options.textFirst === true
    ? padding + (contentLines > 0 ? textHeight + spreadGap : 0)
    : qrTop;
  const textAtTop = options.textFirst === true
    ? padding
    : qrTop + qrSize + spreadGap;

  return {
    width,
    height,
    padding,
    qrSize,
    qrScale: scale,
    pxPerModule: qrSize / matrix.size,
    fits,
    qrMatrix: matrix,
    qrTop: Math.round(top),
    qrLeft: Math.floor((width - qrSize) / 2),
    qrTextGap: spreadGap,
    textTop: Math.round(textAtTop),
    blockHeight,
    lineHeight,
    lines,
    extraLines,
    fontSize: placed.fontSize,
    targetHeight: target,
    naturalHeight,
    slack,
    alignment: effectiveAlign,
  };
}

/**
 * Dispose le QR et le texte côte à côte, sur la largeur de la tête.
 *
 * L'orientation « horizontale » ne tourne rien : elle change l'axe de
 * composition. Le QR garde sa taille, le texte se découpe sur la largeur qui
 * reste et se cale à droite du code. C'est ce qui permet de garder le texte
 * lisible et paramétrable quelle que soit l'orientation du support.
 *
 * @param {LabelGeometry} geometry Géométrie verticale déjà calculée.
 * @param {{
 *   measure: (text: string) => number,
 *   maxLines?: number,
 *   gap?: number,
 * }} options
 * @returns {LabelGeometry}
 */
function layoutLabelLateral(geometry, options) {
  const gap = Math.max(1, Math.floor(options.gap ?? geometry.padding));
  const maxLines = Math.max(1, Math.trunc(options.maxLines ?? 4));

  // Le QR ne descend jamais sous son échelle minimale : un code illisible ne
  // sert à rien, et c'est le texte qui cède, pas le code. Sa taille plancher
  // est donc celle qui décide s'il reste une colonne utilisable pour le texte.
  const minQr = geometry.qrMatrix.size * MIN_QR_SCALE;
  const usable = geometry.width - geometry.padding * 2 - gap;
  const textWidth = usable - minQr;

  // Sous ce seuil, il n'y a pas de colonne de texte : une URL dense occupe tant
  // de modules qu'il ne reste que quelques pixels. Plutôt que d'écrire trois
  // caractères par ligne, on refuse la disposition latérale et on le signale —
  // c'est à l'appelant de retomber sur l'empilement.
  if (textWidth < MIN_LATERAL_TEXT_PX) {
    return { ...geometry, lateral: false, lateralRefused: true, lateralTextWidth: textWidth };
  }

  // Le texte a la place qu'il lui faut ; le QR prend le reste, jusqu'à être
  // aussi grand que possible sans jamais empiéter sur cette colonne.
  const qrMax = Math.max(minQr, usable - MIN_LATERAL_TEXT_PX);
  let qrSize = geometry.qrSize;
  let qrScale = geometry.qrScale;
  if (qrSize > qrMax) {
    qrScale = Math.max(MIN_QR_SCALE, Math.floor(qrMax / geometry.qrMatrix.size));
    qrSize = geometry.qrMatrix.size * qrScale;
  }

  const textLeft = geometry.padding + qrSize + gap;
  const realTextWidth = Math.max(1, geometry.width - geometry.padding - textLeft);

  const lines = wrapText(options.measure, options.text ?? '', realTextWidth, { maxLines });
  const lineHeight = geometry.lineHeight;
  const textHeight = (lines.length + geometry.extraLines) * lineHeight;

  // Le contenu occupe la hauteur qu'il faut, jamais plus que l'étiquette.
  const contentHeight = Math.max(qrSize, textHeight);
  const height = Math.max(
    geometry.height,
    contentHeight + geometry.padding * 2,
  );

  return {
    ...geometry,
    height,
    qrSize,
    qrScale,
    pxPerModule: qrSize / geometry.qrMatrix.size,
    qrTop: Math.floor((height - qrSize) / 2),
    qrLeft: geometry.padding,
    textLeft,
    textWidth: realTextWidth,
    textAlign: 'left',
    textTop: Math.floor((height - textHeight) / 2),
    lines,
    lateral: true,
  };
}

/**
 * Dispose le QR en haut et son texte tourné d'un quart de tour en dessous.
 *
 * C'est la disposition qui rend le texte lisible sur un rouleau étroit : droit,
 * il ne dispose que de la largeur de la tête moins le QR — 18 px sur 12 mm, soit
 * trois caractères par ligne. Tourné, il profite de toute la hauteur restante.
 *
 * @param {LabelGeometry} geometry Géométrie empilée déjà calculée.
 * @param {{
 *   measure: (text: string) => number,
 *   text?: string,
 *   maxLines?: number,
 *   gap?: number,
 * }} options
 * @returns {LabelGeometry}
 */
function layoutLabelRotated(geometry, options) {
  const gap = Math.max(1, Math.floor(options.gap ?? geometry.padding));
  const padding = geometry.padding;
  const lineHeight = geometry.lineHeight;

  // Les lignes du titre font partie de la bande : les oublier laissait le titre
  // sans place réservée, et il ne s'imprimait pas du tout en mode tourné.
  const titleLines = Array.isArray(options.titleLines) ? options.titleLines.filter(Boolean) : [];

  // Le nombre de lignes n'est pas un réglage : c'est la largeur de la bande qui
  // le décide, et le texte est découpé à nouveau ici. Réutiliser les lignes de
  // la disposition empilée les bornait à quatre — l'URL était coupée après
  // « com/ » et sa fin perdue, pas seulement tronquée à l'affichage.
  const maxLines = Math.max(
    1,
    Math.trunc(options.maxLines ?? Math.floor((geometry.width - padding * 2) / lineHeight)),
  );

  // La bande de texte commence sous le QR. Sa longueur ne peut pas dépasser ce
  // qui reste jusqu'à la marge basse : c'est cette borne qui l'empêche de
  // remonter sur le code — le texte monte depuis le bas de sa bande.
  // Le texte monte depuis le bas de sa bande : sa longueur est donc bornée par
  // la hauteur qui reste sous le QR, marge basse déduite.
  const afterQr = padding + geometry.qrSize + gap;
  const fixed = geometry.targetHeight > 0;
  // La bande part du bas du QR et s'arrête à la marge basse. Le texte monte
  // depuis son extrémité basse : si la bande descendait jusque dans la marge,
  // le texte s'y écrivait et touchait le bord de l'étiquette.
  const bottom = Math.max(afterQr, geometry.targetHeight - padding);
  const available = fixed
    ? Math.max(geometry.width, bottom - afterQr)
    // Sans longueur imposée, on part de la longueur du contenu : l'étiquette
    // s'ajuste au texte au lieu de réserver une bande vide.
    : Math.max(geometry.width, Math.ceil(options.measure(options.text ?? '')));

  // Le texte doit tenir dans la bande **en largeur comme en longueur** : ses
  // lignes s'empilent sur la largeur de l'étiquette, et chacune court sur la
  // longueur disponible. Une URL dense demandait sept lignes là où quatre
  // tenaient : sa fin était perdue. On réduit donc la police jusqu'à ce que
  // tout entre, sans descendre sous le plancher de lisibilité.
  const bandWidth = Math.max(1, geometry.width - padding * 2);
  const floor = Math.max(6, Math.floor(width_floor(geometry, options)));
  // La boucle doit toujours s'exécuter au moins une fois : si la police de la
  // composition empilée est déjà sous le plancher, `placed` restait nul et le
  // rendu levait « Cannot read properties of null ». On part donc du plus grand
  // des deux.
  const depart = Math.max(floor, Math.floor(geometry.fontSize));
  let chosen = null;
  let last = null;
  for (let size = depart; size >= floor; size--) {
    const mesure = options.measureFactory ? options.measureFactory(size) : options.measure;
    const height = Math.ceil(size * (options.lineSpacing ?? 1.15));
    // Les lignes du titre et de la date sont réservées d'abord : le corps du
    // texte prend ce qui reste. Sans cette réservation, le corps occupait toute
    // la bande et la date — écrite en dernier — débordait et se faisait rogner.
    const rangees = Math.max(1, Math.floor(bandWidth / height));
    const reservees = titleLines.length + geometry.extraLines;
    const essai = wrapText(mesure, options.text ?? '', available, {
      maxLines: Math.max(1, rangees - reservees),
    });
    // L'épaisseur compte les lignes du titre et de la date, pas seulement le
    // corps : ce sont elles qui décident si la bande déborde.
    const epaisseur = (essai.length + titleLines.length + geometry.extraLines) * height;
    const complet = essai.join('').replace(/\s/g, '') === (options.text ?? '').replace(/\s/g, '');
    last = { lines: essai, lineHeight: height, fontSize: size, thickness: epaisseur };
    if (epaisseur <= bandWidth && (complet || options.text === '')) {
      chosen = last;
      break;
    }
  }
  // Aucune taille ne contient tout le texte : on garde la plus petite essayée,
  // qui en montre le plus, plutôt que d'abandonner. Et si rien n'a pu être
  // essayé, on compose au plancher plutôt que de lever.
  const placed = chosen ?? last ?? {
    lines: wrapText(
      options.measureFactory ? options.measureFactory(floor) : options.measure,
      options.text ?? '',
      available,
      { maxLines: 1 },
    ),
    lineHeight: Math.ceil(floor * (options.lineSpacing ?? 1.15)),
    fontSize: floor,
    thickness: Math.ceil(floor * (options.lineSpacing ?? 1.15)),
  };
  const lines = placed.lines;
  const thickness = placed.thickness;

  // Le texte est dessiné depuis le **bas** de sa bande, en remontant : c'est
  // donc `textTop + textWidth` qui doit tomber sur la marge basse. Placer la
  // bande juste après le QR la faisait descendre dans la marge.
  const bandTop = fixed
    ? geometry.targetHeight - padding - available
    : afterQr;

  return {
    ...geometry,
    height: fixed ? geometry.targetHeight : afterQr + available + padding * 2,
    qrLeft: Math.floor((geometry.width - geometry.qrSize) / 2),
    qrTop: padding,
    textRotated: true,
    // Le sens de rotation : « horaire » se lit de bas en haut, « antihoraire »
    // de haut en bas. Les deux ancrages diffèrent, d'où ce transport.
    textSens: options.sens === 'antihoraire' ? 'antihoraire' : 'horaire',
    textTop: bandTop,
    // La bande tournée fait `thickness` de large : on la centre.
    textLeft: Math.max(0, Math.floor((geometry.width - thickness) / 2)),
    textWidth: available,
    lines,
    // Les lignes du titre voyagent avec la géométrie : `drawLabel` les écrit
    // dans le même repère tourné que le corps du texte.
    titleLines,
    // La police retenue peut être plus petite que celle de la composition
    // empilée : c'est elle qui est dessinée.
    fontSize: placed.fontSize,
    lineHeight: placed.lineHeight,
    rotatedTextLength: available,
    rotatedTextThickness: thickness,
  };
}

/**
 * Plancher de police pour la disposition tournée.
 *
 * C'est la lisibilité qui le fixe, pas la largeur : `width * 0.07` laissait
 * descendre à 6 px sur une tête de 96 px, soit 0,75 mm — une trame grise. Le
 * texte doit rester lisible même s'il faut alors renoncer à une partie du
 * contenu, et l'aperçu le dit.
 */
function width_floor(geometry, options) {
  const cible = options.minFont ?? 0;
  if (cible > 0) return cible;
  return Math.max(6, Math.round((MIN_FONT_MM / 25.4) * (options.dpi ?? 203)));
}

/**
 * Mesure par défaut. En navigateur on crée un canvas hors écran ; ailleurs on
 * approxime, ce qui suffit à découper des URL en police monospace.
 *
 * @param {number} fontSize
 * @returns {(text: string) => number}
 */
function defaultMeasure(fontSize) {
  const canvasFactory = globalThis.document?.createElement?.bind(globalThis.document);
  if (canvasFactory) {
    const canvas = canvasFactory('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontSize}px -apple-system, system-ui, sans-serif`;
      return (text) => ctx.measureText(text).width;
    }
  }
  // Approximation : ratio moyen constaté pour une police sans-serif.
  return (text) => text.length * fontSize * 0.55;
}

/**
 * Dessine une étiquette complète (QR + texte) dans un contexte 2D.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {LabelGeometry} geometry
 * @param {{
 *   fontFamily?: string,
 *   showTitle?: boolean,
 *   title?: string,
 *   showHost?: boolean,
 * }} [options]
 * @returns {LabelGeometry}
 */
function drawLabel(ctx, geometry, options = {}) {
  const {
    fontFamily = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif',
    showTitle = false,
    title = '',
    showHost = false,
    // Lignes à imprimer sous le texte principal — la date, le plus souvent.
    // Leur place a été réservée par `extraLines` dans la géométrie.
    extraText = [],
  } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, geometry.width, geometry.height);

  // `qrLeft` et `qrTop` viennent de la géométrie : le QR ne part plus du coin
  // supérieur gauche, il se place dans la disposition retenue.
  const qrX = geometry.qrLeft ?? Math.floor((geometry.width - geometry.qrSize) / 2);
  drawQr(geometry.qrMatrix, ctx, { x: qrX, y: geometry.qrTop, scale: geometry.qrScale });

  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  // En disposition latérale, le texte se cale à gauche dans la colonne qui lui
  // reste ; sinon il reste centré sous le QR.
  const lateral = geometry.lateral === true;
  const textX = lateral ? geometry.textLeft : geometry.width / 2;
  const maxWidth = lateral ? geometry.textWidth : undefined;

  // Texte tourné d'un quart de tour, dans sa bande sous le QR.
  //
  // Le repère : on se place au coin **bas-gauche** de la bande, puis on tourne
  // de -90°. Un point écrit vers +x part alors vers le haut, et les lignes
  // s'empilent vers la droite. Se tromper d'angle envoie le texte hors de
  // l'étiquette ; se tromper d'ancrage le fait remonter sur le QR.
  if (geometry.textRotated === true) {
    const blockLeft = geometry.textLeft ?? geometry.padding;
    const thickness = geometry.rotatedTextThickness ?? geometry.lineHeight;

    ctx.save();
    if (geometry.textSens === 'antihoraire') {
      // Sens inverse : on part du **haut** de la bande, et le texte descend.
      // Après une rotation de +90°, (x, y) devient (-y, x) : les rangées
      // s'empilent vers la gauche, d'où l'ancrage au bord droit du bloc.
      ctx.translate(blockLeft + thickness, geometry.textTop);
      ctx.rotate(Math.PI / 2);
    } else {
      // Sens ordinaire : on part du **bas** de la bande, et le texte monte.
      // Après une rotation de -90°, (x, y) devient (y, -x) : les rangées
      // s'empilent vers la droite, et le texte va vers le haut.
      ctx.translate(blockLeft, geometry.textTop + geometry.textWidth);
      ctx.rotate(-Math.PI / 2);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Chaque ligne occupe sa propre rangée : dans le repère tourné, `x` avance
    // le long de la bande et `y` empile les lignes. Les écrire bout à bout sur
    // un même `x` cumulait leurs longueurs et faisait dépasser le texte, qui
    // remontait alors par-dessus le QR.
    let rangee = 0;
    const ecrire = (contenu, gras) => {
      if (!contenu) return;
      ctx.font = `${gras ? 'bold ' : ''}${geometry.fontSize}px ${fontFamily}`;
      ctx.fillText(contenu, 0, rangee * geometry.lineHeight, geometry.textWidth);
      rangee += 1;
    };

    // Le titre peut occuper plusieurs lignes : ce sont celles-ci qu'il faut
    // écrire. Utiliser `title` (la chaîne entière) faisait disparaître le titre
    // dès qu'il était découpé — le mode tourné n'imprimait alors plus rien.
    for (const ligne of geometry.titleLines ?? (showTitle && title ? [title] : [])) {
      ecrire(ligne, true);
    }
    for (const contenu of geometry.lines) ecrire(contenu, false);
    for (const contenu of extraText) ecrire(contenu, false);

    ctx.restore();
    return geometry;
  }

  ctx.textAlign = lateral ? 'left' : 'center';

  let y = geometry.textTop;
  ctx.font = `bold ${geometry.fontSize}px ${fontFamily}`;
  // Le titre peut occuper plusieurs lignes : il est découpé par l'appelant, qui
  // seul connaît la largeur utile. `titleLines` prime sur `title`.
  const titreLignes = Array.isArray(options.titleLines) && options.titleLines.length > 0
    ? options.titleLines
    : (showTitle && title ? [title] : []);
  for (const ligne of titreLignes) {
    ctx.fillText(ligne, textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  ctx.font = `${geometry.fontSize}px ${fontFamily}`;
  for (const line of geometry.lines) {
    ctx.fillText(line, textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  if (showHost) {
    ctx.font = `${Math.round(geometry.fontSize * 0.9)}px ${fontFamily}`;
    ctx.fillText(hostOf(options.url ?? ''), textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  // Les lignes supplémentaires viennent en dernier : la date se lit comme une
  // mention, sous l'information principale.
  for (const line of extraText) {
    if (!line) continue;
    ctx.fillText(line, textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  return geometry;
}

/**
 * Convertit une longueur en millimètres vers des pixels.
 * @param {number} mm
 * @param {number} dpi
 * @returns {number}
 */
function mmToPx(mm, dpi) {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Convertit des pixels vers des millimètres.
 * @param {number} px
 * @param {number} dpi
 * @returns {number}
 */
function pxToMm(px, dpi) {
  return (px / dpi) * 25.4;
}

/**
 * Vérifie qu'un QR code restera imprimable et lisible.
 *
 * Deux causes d'échec, dans cet ordre :
 * 1. le QR déborde de la largeur utile — l'URL est trop longue pour cette
 *    étiquette, aucune mise à l'échelle ne peut le sauver ;
 * 2. la densité est insuffisante (moins de 2 px par module), cas que
 *    `computeLabelGeometry` évite normalement via `minScale`, mais qui peut
 *    survenir si l'appelant a forcé `minScale: 1`.
 *
 * @param {LabelGeometry} geometry
 * @param {{ minPxPerModule?: number }} [options]
 * @returns {{ ok: boolean, pxPerModule: number, reason?: string }}
 */
function checkQrLegibility(geometry, options = {}) {
  const minPx = options.minPxPerModule ?? MIN_QR_SCALE;
  const pxPerModule = geometry.qrSize / geometry.qrMatrix.size;

  if (geometry.fits === false) {
    return {
      ok: false,
      pxPerModule,
      reason:
        `URL trop longue : le QR fait ${geometry.qrSize} px pour ${geometry.width} px ` +
        'de large. Raccourcissez l\'URL ou utilisez une étiquette plus large.',
    };
  }
  if (pxPerModule < minPx) {
    return {
      ok: false,
      pxPerModule,
      reason:
        `QR trop dense : ${pxPerModule.toFixed(2)} px par module (minimum ${minPx}). ` +
        'Raccourcissez l\'URL ou augmentez la largeur de l\'étiquette.',
    };
  }
  return { ok: true, pxPerModule };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/raster.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Conversion d'une image en bitmap monochrome pour tête thermique.
 *
 * Les têtes Niimbot attendent un flux de lignes, 1 bit par pixel, poids fort
 * en premier, 1 = noir, chaque ligne complétée à l'octet. Ce module fait cette
 * conversion depuis un `ImageData` de canvas, ce qui permet d'imprimer une
 * étiquette composée (QR + texte) et pas seulement un QR nu.
 *
 * La fonction est pure : elle ne dépend que de son entrée, donc testable hors
 * navigateur.
 */

/**
 * @typedef {Object} MonoBitmap
 * @property {number} width       Largeur en pixels.
 * @property {number} height      Hauteur en pixels.
 * @property {number} bytesPerRow Octets par ligne, largeur complétée à l'octet.
 * @property {Uint8Array[]} rows  Une entrée par ligne.
 */

/**
 * Convertit des données RGBA en bitmap monochrome.
 *
 * @param {{ data: Uint8ClampedArray|Uint8Array, width: number, height: number }} imageData
 * @param {{
 *   threshold?: number,
 *   invert?: boolean,
 *   paddingByte?: number,
 * }} [options]
 *   `threshold` : luminance (0-255) en dessous de laquelle un pixel est noir.
 *   `invert` : à activer si la source est claire sur fond sombre.
 * @returns {MonoBitmap}
 * @throws {TypeError} si les dimensions sont incohérentes avec les données.
 */
function imageDataToMono(imageData, options = {}) {
  if (!imageData || typeof imageData.width !== 'number' || typeof imageData.height !== 'number') {
    throw new TypeError('imageData doit exposer width et height');
  }
  const { data } = imageData;
  const { width, height } = imageData;

  if (!data || data.length < width * height * 4) {
    throw new TypeError(
      `données insuffisantes : ${data?.length ?? 0} octets pour ${width} × ${height} pixels RGBA`,
    );
  }

  const threshold = Number.isFinite(options.threshold) ? options.threshold : 128;
  const invert = Boolean(options.invert);
  const paddingByte = options.paddingByte ?? 0;
  const bytesPerRow = Math.ceil(width / 8);
  const rows = [];

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow);
    if (paddingByte !== 0 && width % 8 !== 0) row.fill(paddingByte);

    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];

      // Un pixel transparent est traité comme blanc : sinon une étiquette
      // composée sur canvas transparent sortirait entièrement noire.
      let dark;
      if (alpha === 0) {
        dark = false;
      } else {
        const luminance =
          0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
        dark = luminance < threshold;
      }
      if (invert) dark = !dark;
      if (dark) row[x >> 3] |= 0x80 >> (x & 7);
    }

    rows.push(row);
  }

  return { width, height, bytesPerRow, rows };
}

/**
 * Vérifie qu'un bitmap respecte les contraintes d'une tête d'impression.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ printheadPixels: number, maxHeightPx?: number }} profile
 * @returns {{ ok: boolean, reasons: string[] }}
 */
function validateBitmap(bitmap, profile) {
  const reasons = [];

  if (bitmap.width > profile.printheadPixels) {
    reasons.push(
      `largeur ${bitmap.width} px supérieure à la tête (${profile.printheadPixels} px) : ` +
      'le surplus serait rogné sans erreur',
    );
  }
  if (bitmap.bytesPerRow !== Math.ceil(bitmap.width / 8)) {
    reasons.push(
      `bytesPerRow incohérent : ${bitmap.bytesPerRow} au lieu de ${Math.ceil(bitmap.width / 8)}`,
    );
  }
  if (bitmap.rows.length !== bitmap.height) {
    reasons.push(`${bitmap.rows.length} lignes fournies pour une hauteur de ${bitmap.height}`);
  }
  for (const row of bitmap.rows) {
    if (row.length !== bitmap.bytesPerRow) {
      reasons.push('au moins une ligne n\'a pas la longueur annoncée');
      break;
    }
  }
  if (profile.maxHeightPx && bitmap.height > profile.maxHeightPx) {
    reasons.push(
      `hauteur ${bitmap.height} px supérieure au maximum du profil (${profile.maxHeightPx} px)`,
    );
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * Réduit un bitmap à la largeur de tête en le rognant par la droite.
 *
 * Utile quand la source est légèrement trop large : mieux vaut rogner
 * explicitement et le signaler que laisser l'imprimante le faire en silence.
 *
 * @param {MonoBitmap} bitmap
 * @param {number} maxWidth
 * @returns {MonoBitmap}
 */
function cropBitmap(bitmap, maxWidth) {
  if (bitmap.width <= maxWidth) return bitmap;

  const width = Math.max(1, Math.trunc(maxWidth));
  const bytesPerRow = Math.ceil(width / 8);
  const rows = bitmap.rows.map((row) => {
    const cropped = new Uint8Array(bytesPerRow);
    for (let x = 0; x < width; x++) {
      if (row[x >> 3] & (0x80 >> (x & 7))) cropped[x >> 3] |= 0x80 >> (x & 7);
    }
    return cropped;
  });

  return { width, height: bitmap.height, bytesPerRow, rows };
}

/**
 * Fait pivoter un bitmap monochrome d'un quart de tour.
 *
 * Sert à rattraper une étiquette qui sort dans le mauvais sens. Les têtes
 * thermiques impriment ligne par ligne dans le sens du défilement : selon le
 * rouleau et le modèle, la même image peut sortir à l'endroit, pivotée, ou à
 * l'envers. Plutôt que de le deviner une fois pour toutes, on laisse le choix —
 * et le profil garde sa valeur par défaut.
 *
 * La rotation est un quart de tour dans le sens des aiguilles d'une montre :
 * `turns = 1` met la première colonne en première ligne.
 *
 * @param {import('./raster.js').MonoBitmap} bitmap
 * @param {number} turns Nombre de quarts de tour (0 à 3, ou négatif).
 * @returns {import('./raster.js').MonoBitmap} nouveau bitmap ; l'entrée n'est pas modifiée.
 * @throws {TypeError} si le bitmap est inexploitable.
 */
function rotateBitmap(bitmap, turns = 0) {
  if (!bitmap || !Number.isFinite(bitmap.width) || !Number.isFinite(bitmap.height)) {
    throw new TypeError('rotateBitmap exige un bitmap avec width et height');
  }
  if (!Array.isArray(bitmap.rows) || bitmap.rows.length !== bitmap.height) {
    throw new TypeError('rotateBitmap : lignes incohérentes avec la hauteur');
  }

  // Un tour complet ne change rien : on évite une copie inutile.
  const quarter = ((Math.trunc(turns) % 4) + 4) % 4;
  if (quarter === 0) {
    return {
      width: bitmap.width,
      height: bitmap.height,
      bytesPerRow: bitmap.bytesPerRow,
      rows: bitmap.rows.map((row) => Uint8Array.from(row)),
    };
  }

  const swapped = quarter === 1 || quarter === 3;
  const width = swapped ? bitmap.height : bitmap.width;
  const height = swapped ? bitmap.width : bitmap.height;
  const bytesPerRow = Math.ceil(width / 8);
  const rows = [];

  /** Lit un bit du bitmap d'origine : 1 = noir. */
  const bitAt = (x, y) => (bitmap.rows[y][x >> 3] & (0x80 >> (x & 7))) !== 0;

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow);
    for (let x = 0; x < width; x++) {
      // Correspondance inverse : d'où vient ce pixel dans l'image d'origine.
      let sourceX;
      let sourceY;
      if (quarter === 1) {
        sourceX = y;
        sourceY = bitmap.height - 1 - x;
      } else if (quarter === 2) {
        sourceX = bitmap.width - 1 - x;
        sourceY = bitmap.height - 1 - y;
      } else {
        sourceX = bitmap.width - 1 - y;
        sourceY = x;
      }

      if (sourceX >= 0 && sourceX < bitmap.width && sourceY >= 0 && sourceY < bitmap.height
        && bitAt(sourceX, sourceY)) {
        row[x >> 3] |= 0x80 >> (x & 7);
      }
    }
    rows.push(row);
  }

  return { width, height, bytesPerRow, rows };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/sheet.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Géométrie des planches d'impression.
 *
 * Calcule où tombe chaque étiquette sur une feuille (A4 le plus souvent), en
 * millimètres. Le rendu s'appuie ensuite sur ces positions : c'est ce qui
 * permet d'imprimer sur une planche d'étiquettes autocollantes sans décalage
 * cumulatif, contrairement à une grille CSS dont les arrondis dérivent.
 */



/** Dimensions des formats papier courants, en millimètres. */
const PAGE_SIZES = Object.freeze({
  a4: { widthMm: 210, heightMm: 297, label: 'A4 (210 × 297 mm)' },
  a5: { widthMm: 148, heightMm: 210, label: 'A5 (148 × 210 mm)' },
  letter: { widthMm: 215.9, heightMm: 279.4, label: 'Letter (8,5 × 11 po)' },
});

/**
 * Familles de dispositions, dans l'ordre d'affichage.
 *
 * Le regroupement n'est pas cosmétique : une planche générique se règle à la
 * main, une planche Avery se choisit par sa référence imprimée sur l'emballage.
 * Ce ne sont pas les mêmes gestes.
 */
const SHEET_GROUPS = Object.freeze([
  { id: 'generic', label: 'Dispositions génériques' },
  { id: 'avery-a4', label: 'Avery — A4' },
  { id: 'avery-letter', label: 'Avery — Letter (US)' },
]);

/**
 * Dispositions d'étiquettes.
 *
 * **`marginXMm` et `marginYMm` sont les distances du bord gauche et du bord
 * haut au coin de la première étiquette** — pas des marges symétriques. C'est
 * ainsi que les fabricants publient leurs cotes, et c'est la seule convention
 * qui décrive une planche réelle : sur une L7160, il y a 8,6 mm à gauche et
 * 5,1 mm à droite. Un modèle symétrique perdrait une colonne entière.
 *
 * Les dispositions génériques sont des points de départ géométriquement
 * valides. Les dispositions `avery-*` reproduisent les cotes publiées pour ces
 * références : largeur et hauteur d'étiquette, marge haute et gauche, et pas
 * horizontal et vertical. `declaredColumns` et `declaredRows` portent le nombre
 * d'étiquettes annoncé pour cette référence, et servent aux tests, qui le
 * **confrontent à la géométrie** : un préréglage qui ne place pas le nombre
 * annoncé est un préréglage faux. Les appeler `columns`/`rows` serait un piège :
 * `computeSheet` y verrait une grille explicite à honorer telle quelle, et le
 * test deviendrait circulaire.
 *
 * Source des cotes commerciales : les fiches de gabarit publiées pour ces
 * références (voir `test/sheet.test.js`, qui vérifie que la grille calculée
 * correspond au nombre d'étiquettes par feuille annoncé). Une planche
 * autocollante reste sensible au passage papier de chaque imprimante : les
 * décalages `offsetXMm` / `offsetYMm` servent à corriger ce qui reste.
 */
const SHEET_PRESETS = Object.freeze({
  // --- Dispositions génériques ---------------------------------------------
  'a4-3x8': {
    label: 'A4 — 3 × 8 (63,5 × 33,9 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginXMm: 7.25,
    marginYMm: 12.9,
    gapXMm: 2.5,
    gapYMm: 0,
  },
  'a4-2x7': {
    label: 'A4 — 2 × 7 (99,1 × 38,1 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginXMm: 4.65,
    marginYMm: 15.15,
    gapXMm: 2.5,
    gapYMm: 0,
  },
  'a4-4x10': {
    label: 'A4 — 4 × 10 (48 × 25 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 4,
    declaredRows: 10,
    labelWidthMm: 48,
    labelHeightMm: 25,
    marginXMm: 6,
    marginYMm: 23.5,
    gapXMm: 2,
    gapYMm: 0,
  },
  'a4-qr-3x4': {
    label: 'A4 — 3 × 4 grandes étiquettes QR (60 × 60 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 4,
    labelWidthMm: 60,
    labelHeightMm: 60,
    marginXMm: 10,
    marginYMm: 28.5,
    gapXMm: 5,
    gapYMm: 0,
  },

  // --- Avery A4 -------------------------------------------------------------
  // Le pas horizontal vaut 66,4 mm pour 63,5 mm d'étiquette : 2,9 mm d'écart.
  'avery-l7160': {
    label: 'Avery L7160 — 3 × 7 (63,5 × 38,1 mm)',
    group: 'avery-a4',
    reference: 'L7160',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 7,
    labelWidthMm: 63.5,
    labelHeightMm: 38.1,
    marginXMm: 8.6,
    marginYMm: 15.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7159': {
    label: 'Avery L7159 — 3 × 8 (63,5 × 33,9 mm)',
    group: 'avery-a4',
    reference: 'L7159',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginXMm: 8.6,
    marginYMm: 13.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7162': {
    label: 'Avery L7162 — 2 × 8 (99,1 × 33,9 mm)',
    group: 'avery-a4',
    reference: 'L7162',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 8,
    labelWidthMm: 99.1,
    labelHeightMm: 33.9,
    marginXMm: 6.1,
    marginYMm: 13,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7163': {
    label: 'Avery L7163 — 2 × 7 (99,1 × 38,1 mm)',
    group: 'avery-a4',
    reference: 'L7163',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginXMm: 6.1,
    marginYMm: 15.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'zweckform-3475': {
    label: 'Avery Zweckform 3475 — 3 × 8 (70 × 36 mm)',
    group: 'avery-a4',
    reference: '3475',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    // 3 × 70 mm = 210 mm : cette planche occupe toute la largeur, sans marge
    // horizontale ni écart entre colonnes.
    labelWidthMm: 70,
    labelHeightMm: 36,
    marginXMm: 0,
    marginYMm: 4.5,
    gapXMm: 0,
    gapYMm: 0,
  },

  // --- Avery Letter (US) ----------------------------------------------------
  // Références historiques 5160 / 5162 / 5163, vendues aussi sous 8160 / 8162 /
  // 8163 : mêmes cotes, seule la découpe diffère.
  'avery-5160': {
    label: 'Avery 5160 / 8160 — 3 × 10 (66,7 × 25,4 mm)',
    group: 'avery-letter',
    reference: '5160',
    page: 'letter',
    declaredColumns: 3,
    declaredRows: 10,
    labelWidthMm: 66.7,
    labelHeightMm: 25.4,
    marginXMm: 4.8,
    marginYMm: 12.7,
    gapXMm: 3.1,
    gapYMm: 0,
  },
  'avery-5162': {
    label: 'Avery 5162 / 8162 — 2 × 7 (101,6 × 33,9 mm)',
    group: 'avery-letter',
    reference: '5162',
    page: 'letter',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 101.6,
    labelHeightMm: 33.9,
    marginXMm: 4,
    marginYMm: 21.2,
    gapXMm: 4.8,
    gapYMm: 0,
  },
  'avery-5163': {
    label: 'Avery 5163 / 8163 — 2 × 5 (101,6 × 50,8 mm)',
    group: 'avery-letter',
    reference: '5163',
    page: 'letter',
    declaredColumns: 2,
    declaredRows: 5,
    labelWidthMm: 101.6,
    labelHeightMm: 50.8,
    marginXMm: 4,
    marginYMm: 12.7,
    gapXMm: 4.8,
    gapYMm: 0,
  },
  'avery-6871': {
    label: 'Avery 6871 — 3 × 6 (60,3 × 31,8 mm)',
    group: 'avery-letter',
    reference: '6871',
    page: 'letter',
    declaredColumns: 3,
    declaredRows: 6,
    // Ici le pas vertical (38,1 mm) dépasse la hauteur d'étiquette : la planche
    // laisse 6,3 mm entre deux rangées.
    labelWidthMm: 60.3,
    labelHeightMm: 31.8,
    marginXMm: 9.5,
    marginYMm: 27.6,
    gapXMm: 8,
    gapYMm: 6.3,
  },
});

/**
 * @typedef {Object} SheetCell
 * @property {number} index  Index global de l'étiquette (0-based).
 * @property {number} page   Numéro de page (0-based).
 * @property {number} column Colonne dans la page (0-based).
 * @property {number} row    Rangée dans la page (0-based).
 * @property {number} xMm    Abscisse du coin supérieur gauche.
 * @property {number} yMm    Ordonnée du coin supérieur gauche.
 */

/**
 * @typedef {Object} SheetLayout
 * @property {number} pageWidthMm
 * @property {number} pageHeightMm
 * @property {number} labelWidthMm
 * @property {number} labelHeightMm
 * @property {number} columns
 * @property {number} rows
 * @property {number} perPage
 * @property {number} pages
 * @property {number} count
 * @property {number} capacity
 * @property {number} offsetXMm  Décalage appliqué à toute la grille.
 * @property {number} offsetYMm
 * @property {SheetCell[]} cells
 * @property {string[]} warnings
 */

/**
 * Calcule la disposition d'une planche.
 *
 * `marginXMm` et `marginYMm` situent le coin de la **première** étiquette par
 * rapport aux bords gauche et haut. La place restante à droite et en bas est ce
 * qu'elle est : c'est ainsi que se décrit une planche réelle.
 *
 * `offsetXMm` et `offsetYMm` déplacent toute la grille sans changer sa forme.
 * Ils servent à rattraper le décalage d'entraînement d'une imprimante donnée —
 * le seul écart qu'aucune cote de fabricant ne peut prévoir.
 *
 * `adviseDenser` (vrai par défaut) émet un avertissement quand une bande
 * inutilisée à droite laisse penser qu'une colonne de plus tiendrait. Utile
 * quand on ajuste une disposition à la main ; à couper quand la grille a été
 * **calculée pour remplir la feuille** : l'espace restant est alors la marge
 * demandée, pas une place perdue, et l'avertissement serait du bruit.
 *
 * `columns` et `rows` rendent la grille **explicite** au lieu de la déduire des
 * cotes. C'est le cas de « remplir la feuille », où l'utilisateur choisit le
 * nombre de colonnes et de rangées et où la taille des étiquettes en découle :
 * déduire ensuite le nombre de colonnes de la taille qu'on vient de calculer
 * donnait un résultat absurde — 31 rangées pour une demande de 30, parce que la
 * zone utile va du coin de la première étiquette au bord de la feuille. Une
 * grille explicite est honorée, et signalée si elle ne tient pas.
 *
 * @param {{
 *   count: number,
 *   page?: keyof typeof PAGE_SIZES,
 *   pageWidthMm?: number,
 *   pageHeightMm?: number,
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   offsetXMm?: number,
 *   offsetYMm?: number,
 *   adviseDenser?: boolean,
 *   columns?: number,
 *   rows?: number,
 * }} options
 * @returns {SheetLayout}
 * @throws {TypeError} si les dimensions sont inutilisables.
 */
function computeSheet(options) {
  const preset = options.page ? PAGE_SIZES[options.page] : undefined;
  const pageWidthMm = options.pageWidthMm ?? preset?.widthMm ?? PAGE_SIZES.a4.widthMm;
  const pageHeightMm = options.pageHeightMm ?? preset?.heightMm ?? PAGE_SIZES.a4.heightMm;

  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const marginXMm = nonNegative(options.marginXMm ?? 10);
  const marginYMm = nonNegative(options.marginYMm ?? 10);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const offsetXMm = Number.isFinite(options.offsetXMm) ? options.offsetXMm : 0;
  const offsetYMm = Number.isFinite(options.offsetYMm) ? options.offsetYMm : 0;
  // Un compte non fini produirait `pages: NaN` et un « NaN page » à l'écran :
  // on le ramène à zéro plutôt que de laisser la valeur se propager.
  const requested = Number.isFinite(options.count) ? options.count : 0;
  const count = Math.max(0, Math.trunc(requested));

  // La zone utile part du coin de la première étiquette jusqu'au bord de la
  // feuille : la marge de droite et du bas n'est pas imposée.
  const usableWidth = pageWidthMm - marginXMm;
  const usableHeight = pageHeightMm - marginYMm;

  // Les cotes sont décimales : « 297 - 2 × 15,15 » vaut 266,69999999999993 en
  // flottant, et la division tombe alors juste sous l'entier attendu. Sans
  // tolérance, une planche prévue pour 7 rangées n'en placerait que 6.
  // L'epsilon reste très inférieur à toute imprécision d'impression.
  const EPSILON = 1e-9;
  const fittingColumns = Math.max(
    0,
    Math.floor((usableWidth + gapXMm) / (labelWidthMm + gapXMm) + EPSILON),
  );
  const fittingRows = Math.max(
    0,
    Math.floor((usableHeight + gapYMm) / (labelHeightMm + gapYMm) + EPSILON),
  );

  // Une grille explicite est une consigne, pas une suggestion : on la respecte
  // telle quelle, quitte à prévenir si elle déborde.
  const askedColumns = Number.isFinite(options.columns)
    ? Math.max(0, Math.trunc(options.columns))
    : null;
  const askedRows = Number.isFinite(options.rows)
    ? Math.max(0, Math.trunc(options.rows))
    : null;
  const columns = askedColumns ?? fittingColumns;
  const rows = askedRows ?? fittingRows;
  const explicit = askedColumns !== null || askedRows !== null;

  const warnings = [];
  if (columns > fittingColumns || rows > fittingRows) {
    warnings.push(
      `La grille demandée (${columns} × ${rows}) ne tient pas : ` +
      `${fittingColumns} × ${fittingRows} au maximum pour des étiquettes de ` +
      `${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm.`,
    );
  }
  if (columns === 0 || rows === 0) {
    warnings.push(
      `Aucune étiquette ne tient sur ${round1(pageWidthMm)} × ${round1(pageHeightMm)} mm : ` +
      `une étiquette mesure ${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm ` +
      `pour une zone utile de ${round1(usableWidth)} × ${round1(usableHeight)} mm.`,
    );
  } else if (!explicit && options.adviseDenser !== false) {
    // Signale le gaspillage : un demi-centimètre perdu suffit souvent à faire
    // tenir une colonne de plus.
    const slackX = usableWidth - (columns * labelWidthMm + (columns - 1) * gapXMm);
    if (slackX > labelWidthMm * 0.6) {
      warnings.push(
        `Il reste ${round1(slackX)} mm à droite de la dernière colonne : une ` +
        'colonne supplémentaire tiendrait peut-être en réduisant la marge gauche.',
      );
    }
  } else if (explicit && options.adviseDenser === true
    && (fittingColumns > columns || fittingRows > rows)) {
    warnings.push(
      `${fittingColumns} × ${fittingRows} étiquettes tiendraient sur cette ` +
      'feuille : augmentez le nombre de colonnes ou de rangées pour la remplir.',
    );
  }

  const perPage = columns * rows;
  const pages = perPage > 0 ? Math.ceil(count / perPage) : 0;
  const cells = [];

  // Aucune étiquette ne peut être placée si la grille est vide : sans cette
  // garde, `index % 0` produirait des cellules à des positions NaN.
  if (perPage > 0) {
    for (let index = 0; index < count; index++) {
      const slot = index % perPage;
      const column = slot % columns;
      const row = Math.floor(slot / columns);
      cells.push({
        index,
        page: Math.floor(index / perPage),
        column,
        row,
        xMm: round2(marginXMm + offsetXMm + column * (labelWidthMm + gapXMm)),
        yMm: round2(marginYMm + offsetYMm + row * (labelHeightMm + gapYMm)),
      });
    }
  }

  return {
    pageWidthMm,
    pageHeightMm,
    labelWidthMm,
    labelHeightMm,
    columns,
    rows,
    perPage,
    pages,
    count,
    capacity: perPage * Math.max(1, pages),
    offsetXMm,
    offsetYMm,
    cells,
    warnings,
  };
}

/**
 * Répartit des éléments sur plusieurs pages.
 *
 * @template T
 * @param {T[]} items
 * @param {SheetLayout} layout
 * @returns {Array<{ page: number, items: Array<{ item: T, cell: SheetCell }> }>}
 */
function paginate(items, layout) {
  if (layout.perPage <= 0) return [];

  const pages = [];
  items.forEach((item, index) => {
    const cell = layout.cells[index];
    if (!cell) return;
    if (!pages[cell.page]) pages[cell.page] = { page: cell.page, items: [] };
    pages[cell.page].items.push({ item, cell });
  });

  return pages.filter(Boolean);
}

/**
 * Arrondit à 0,1 mm, précision suffisante pour l'impression.
 *
 * Exporté : l'interface affiche les cotes avec la même précision que le calcul,
 * et une seconde définition finirait par diverger — le concatenateur du build
 * refuse d'ailleurs deux déclarations de même nom.
 *
 * @param {number} value
 * @returns {number}
 */
function round1(value) {
  return Math.round(value * 10) / 10;
}

/** Arrondit à 0,01 mm. */
function round2(value) {
  return Math.round(value * 100) / 100;
}

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} doit être un nombre strictement positif`);
  }
  return value;
}

function nonNegative(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// ---------------------------------------------------------------------------
// Contenu d'une étiquette de planche
// ---------------------------------------------------------------------------

/** Proportion minimale du QR par rapport au petit côté de l'étiquette. */
const MIN_QR_RATIO = 0.3;
/** Proportion maximale : au-delà, le QR chasse le texte hors de l'étiquette. */
const MAX_QR_RATIO = 1;
/** Écart entre le QR et le texte, identique à celui de la feuille de style. */
const SHEET_QR_GAP_MM = 1.5;
/** Marge intérieure d'une étiquette de planche, pour ne pas toucher les bords. */
const SHEET_CELL_MARGIN_MM = 0.5;

/** Taille de police du texte des étiquettes de planche, en points. */
const SHEET_FONT_PT = 7;
/** Interligne, en multiple de la taille de police. */
const SHEET_LINE_SPACING = 1.15;

/**
 * Taille minimale d'un module de QR **sur papier**, en millimètres.
 *
 * C'est la contrainte qui manquait : un module plus petit n'est plus résolu
 * proprement par une imprimante laser ou jet d'encre, et un téléphone a du mal
 * à faire la mise au point dessus. 0,4 mm correspond à la recommandation
 * courante pour un QR code imprimé lu à bout portant.
 */
const MIN_MODULE_MM_PAPER = 0.4;

/**
 * Taille minimale d'un module sur une **tête thermique**, en millimètres.
 *
 * Une tête Niimbot fusionne les points sous 2 pixels par module. La contrainte
 * dépend donc de la résolution, contrairement à celle du papier.
 *
 * @param {number} dpi
 * @returns {number} millimètres par module
 */
function minModuleMmThermal(dpi) {
  const resolution = Number.isFinite(dpi) && dpi > 0 ? dpi : 203;
  return (2 / resolution) * 25.4;
}

/**
 * Hauteur d'une ligne de texte d'étiquette, en millimètres.
 *
 * Dérivée de la taille de police plutôt que codée en dur : la feuille de style
 * et le calcul de mise en page doivent partir du même chiffre, sinon le texte
 * calculé ne tient plus dans la place réservée.
 *
 * @param {{ fontSizePt?: number, lineSpacing?: number }} [options]
 * @returns {{ fontSizePt: number, fontSizePx: number, lineHeightMm: number }}
 */
function sheetTextMetrics(options = {}) {
  const fontSizePt = Number.isFinite(options.fontSizePt)
    ? options.fontSizePt
    : SHEET_FONT_PT;
  const lineSpacing = Number.isFinite(options.lineSpacing)
    ? options.lineSpacing
    : SHEET_LINE_SPACING;
  const fontSizePx = (fontSizePt * 96) / 72;
  return {
    fontSizePt,
    fontSizePx,
    lineHeightMm: (fontSizePx * lineSpacing * 25.4) / 96,
  };
}

/**
 * Bornes de la proportion du QR dans une étiquette de planche.
 *
 * Le calcul est fait **avant** le rendu, pour que le curseur ne puisse pas
 * demander un QR impossible à imprimer :
 *
 * - **borne basse** : un module doit rester lisible une fois imprimé, donc le QR
 *   ne peut pas descendre sous `qrModules × minModuleMm`. Sur une planche papier
 *   la contrainte est physique (0,4 mm) ; sur une tête thermique elle vient de
 *   la résolution (2 px par module).
 * - **borne haute** : le QR est carré, il doit tenir dans la largeur **et**
 *   laisser au moins une ligne de texte sous lui.
 *
 * Quand les deux bornes se croisent, aucune valeur ne convient : l'URL est trop
 * longue pour ce format, et c'est `reason` qui le dit.
 *
 * @param {{
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   qrModules: number,
 *   textLines?: number,
 *   marginMm?: number,
 *   gapMm?: number,
 *   fontSizePt?: number,
 *   minModuleMm?: number,
 *   minRatio?: number,
 *   maxRatio?: number,
 * }} options
 * @returns {{
 *   min: number, max: number,
 *   minSideMm: number, maxSideMm: number,
 *   minModuleMm: number,
 *   moduleMmAtMax: number,
 *   textLinesAtMin: number,
 *   fits: boolean,
 *   reason: string,
 * }}
 */
function qrRatioBounds(options) {
  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const qrModules = Math.max(1, Math.trunc(options.qrModules ?? 21));
  const textLines = Math.max(0, Math.trunc(options.textLines ?? 1));
  const marginMm = nonNegative(options.marginMm ?? 0);
  const gapMm = Number.isFinite(options.gapMm) ? options.gapMm : SHEET_QR_GAP_MM;
  const floorRatio = Number.isFinite(options.minRatio) ? options.minRatio : MIN_QR_RATIO;
  const ceilingRatio = Number.isFinite(options.maxRatio) ? options.maxRatio : MAX_QR_RATIO;
  const minModuleMm = Number.isFinite(options.minModuleMm) && options.minModuleMm > 0
    ? options.minModuleMm
    : MIN_MODULE_MM_PAPER;
  const { lineHeightMm } = sheetTextMetrics({ fontSizePt: options.fontSizePt });

  const short = Math.min(labelWidthMm, labelHeightMm);
  const innerWidth = labelWidthMm - marginMm * 2;
  const innerHeight = labelHeightMm - marginMm * 2;

  const textHeight = textLines > 0 ? gapMm + textLines * lineHeightMm : 0;
  // Le QR est carré : la hauteur disponible est la contrainte la plus serrée
  // sur une étiquette large et basse, la largeur sur une étiquette étroite.
  const rawMaxSide = Math.min(innerWidth, innerHeight - textHeight);
  const minSideMm = qrModules * minModuleMm;

  const clampRatio = (value) => Math.round(
    Math.min(ceilingRatio, Math.max(floorRatio, value / short)) * 1000,
  ) / 1000;

  const min = clampRatio(minSideMm);
  const max = clampRatio(Math.max(0, rawMaxSide));
  const fits = rawMaxSide > 0 && minSideMm <= rawMaxSide + 1e-9;

  // Combien de lignes de texte tiennent encore si le QR est au minimum lisible ?
  const textLinesAtMin = lineHeightMm > 0
    ? Math.max(0, Math.floor((innerHeight - minSideMm - gapMm) / lineHeightMm))
    : 0;

  let reason = '';
  if (rawMaxSide <= 0) {
    reason =
      `Une étiquette de ${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm ne ` +
      'laisse aucune place à un QR code et à une ligne de texte.';
  } else if (!fits) {
    reason =
      `URL trop longue pour cette étiquette : ${qrModules} modules à ` +
      `${round2(minModuleMm)} mm minimum demandent ${round1(minSideMm)} mm, alors que ` +
      `${round1(rawMaxSide)} mm restent disponibles. Raccourcissez l'URL, ou prenez ` +
      'une étiquette plus grande.';
  }

  return {
    min,
    max,
    minSideMm: round2(minSideMm),
    maxSideMm: round2(Math.max(0, rawMaxSide)),
    minModuleMm: round2(minModuleMm),
    moduleMmAtMax: round2(Math.max(0, rawMaxSide) / qrModules),
    textLinesAtMin,
    fits,
    reason,
  };
}

/**
 * Découpe le texte d'une étiquette et le limite aux lignes disponibles.
 *
 * Les lignes sont renvoyées explicitement plutôt que laissées au retour à la
 * ligne du navigateur : c'est ce qui garantit que le texte occupe exactement la
 * hauteur réservée par le calcul. Un texte trop long est coupé, avec des points
 * de suspension — une troncature visible vaut mieux qu'un débordement masqué.
 *
 * @param {string} text
 * @param {{
 *   measure: (text: string) => number,
 *   innerWidthPx: number,
 *   maxLines: number,
 * }} options
 * @returns {string[]}
 */
function sheetCellLines(text, options) {
  const { measure, innerWidthPx } = options;
  const maxLines = Math.max(0, Math.trunc(options.maxLines ?? 1));
  if (maxLines === 0 || !text) return [];
  if (typeof measure !== 'function') throw new TypeError('measure est requis');

  const all = wrapText(measure, text, innerWidthPx);
  if (all.length <= maxLines) return all;

  const kept = all.slice(0, maxLines);
  const last = kept[kept.length - 1];
  let trimmed = last;
  // On retire des caractères jusqu'à ce que les points de suspension tiennent.
  while (trimmed.length > 1 && measure(`${trimmed}…`) > innerWidthPx) {
    trimmed = trimmed.slice(0, -1);
  }
  kept[kept.length - 1] = `${trimmed.trimEnd()}…`;
  return kept;
}

/**
 * Côté du QR code d'une étiquette de planche, en millimètres.
 *
 * Le QR est carré : il se règle donc sur le **petit** côté de l'étiquette. Sans
 * cette borne, une étiquette basse (33,9 mm de haut pour 63,5 mm de large)
 * produirait un QR plus haut que son support. La proportion est bornée pour
 * qu'aucune valeur d'interface ne puisse dépasser l'étiquette.
 *
 * @param {number} labelWidthMm
 * @param {number} labelHeightMm
 * @param {number} ratio  Proportion du petit côté, entre 0,3 et 1.
 * @returns {number}
 * @throws {TypeError} si une dimension n'est pas un nombre positif.
 */
function qrSideMm(labelWidthMm, labelHeightMm, ratio) {
  const base = Math.min(
    positive(labelWidthMm, 'labelWidthMm'),
    positive(labelHeightMm, 'labelHeightMm'),
  );
  const wanted = Number.isFinite(ratio) ? ratio : MAX_QR_RATIO;
  const clamped = Math.min(MAX_QR_RATIO, Math.max(MIN_QR_RATIO, wanted));
  return round2(base * clamped);
}

// ---------------------------------------------------------------------------
// Remplir la feuille : colonnes, rangées et marge globale
// ---------------------------------------------------------------------------

/**
 * Calcule la taille d'étiquette qui remplit une feuille pour une grille donnée.
 *
 * C'est l'inverse de `computeSheet` : au lieu de partir des cotes d'une
 * étiquette, on part du nombre de colonnes et de rangées voulu, et l'étiquette
 * prend la place restante.
 *
 * Les marges sont **par axe** (`marginXMm`, `marginYMm`) et non globales : une
 * planche du commerce a presque toujours une marge haute différente de sa marge
 * gauche, et c'est la seule façon de reproduire exactement ses cotes. Une marge
 * globale s'obtient en passant la même valeur aux deux.
 *
 * Les marges rendues peuvent différer de quelques centièmes de millimètre de
 * celles demandées : la taille d'étiquette est arrondie au centième, et l'écart
 * restant est réparti également de chaque côté. Sans cela, une étiquette
 * arrondie vers le bas ferait perdre une colonne entière à `computeSheet` —
 * c'est exactement le piège que ce calcul évite.
 *
 * @param {{
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   columns: number,
 *   rows: number,
 *   marginMm?: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   minLabelMm?: number,
 * }} options
 * @returns {{
 *   ok: boolean,
 *   reason: string,
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   marginXMm: number,
 *   marginYMm: number,
 *   columns: number,
 *   rows: number,
 * }}
 */
function fitGrid(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const columns = Math.max(1, Math.trunc(options.columns ?? 1));
  const rows = Math.max(1, Math.trunc(options.rows ?? 1));
  // `marginMm` reste accepté : c'est la marge globale, appliquée aux deux axes.
  const marginXMm = nonNegative(options.marginXMm ?? options.marginMm ?? 0);
  const marginYMm = nonNegative(options.marginYMm ?? options.marginMm ?? 0);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const minLabelMm = Number.isFinite(options.minLabelMm) ? options.minLabelMm : 5;

  const usableWidth = pageWidthMm - marginXMm * 2;
  const usableHeight = pageHeightMm - marginYMm * 2;

  const rawWidth = (usableWidth - (columns - 1) * gapXMm) / columns;
  const rawHeight = (usableHeight - (rows - 1) * gapYMm) / rows;

  const refuse = (reason) => ({
    ok: false,
    reason,
    labelWidthMm: 0,
    labelHeightMm: 0,
    marginXMm,
    marginYMm,
    columns,
    rows,
  });

  if (rawWidth < minLabelMm || rawHeight < minLabelMm) {
    const tooMany = rawWidth < minLabelMm ? `${columns} colonnes` : `${rows} rangées`;
    const tightest = rawWidth < minLabelMm ? round1(rawWidth) : round1(rawHeight);
    return refuse(
      `${tooMany} sur cette feuille ne laisse que ${tightest} mm par étiquette ` +
      `(minimum ${minLabelMm} mm). Réduisez le nombre, l'écart, ou la marge.`,
    );
  }

  // Arrondi vers le bas : l'étiquette ne peut pas être plus grande que la place
  // disponible. Le reste est réparti en marge, ce qui recentre la grille.
  const labelWidthMm = Math.floor(rawWidth * 100) / 100;
  const labelHeightMm = Math.floor(rawHeight * 100) / 100;

  const slackX = usableWidth - (columns * labelWidthMm + (columns - 1) * gapXMm);
  const slackY = usableHeight - (rows * labelHeightMm + (rows - 1) * gapYMm);

  // Arrondi vers le bas, là aussi : arrondir la marge au centième supérieur
  // suffirait à faire dépasser la grille du bord de la feuille de quelques
  // microns — de quoi invalider la garantie « rien ne sort de la page ».
  const floor2 = (value) => Math.floor(value * 100) / 100;

  return {
    ok: true,
    reason: '',
    labelWidthMm,
    labelHeightMm,
    marginXMm: floor2(marginXMm + slackX / 2),
    marginYMm: floor2(marginYMm + slackY / 2),
    columns,
    rows,
  };
}

/**
 * Traduit les cotes publiées d'une planche en réglages de grille.
 *
 * Une planche du commerce a une marge gauche et une marge haute différentes, et
 * sa marge de droite n'est pas toujours égale à celle de gauche. La grille, elle,
 * se règle par une marge symétrique sur chaque axe : on prend donc, pour chaque
 * axe, ce qui reste une fois les étiquettes et leurs écarts retirés, réparti
 * également des deux côtés.
 *
 * Conséquence, et elle compte : la taille d'étiquette et le **pas** sont exacts,
 * donc les colonnes tombent bien en face de leurs cases ; seule la position
 * d'ensemble peut être décalée de quelques dixièmes de millimètre par rapport à
 * la planche du fabricant. C'est un décalage constant, que les champs de
 * décalage rattrapent — contrairement à une erreur de pas, qui s'accumulerait.
 *
 * @param {{ declaredColumns: number, declaredRows: number, labelWidthMm: number,
 *   labelHeightMm: number, gapXMm: number, gapYMm: number }} preset
 * @param {{ widthMm: number, heightMm: number }} page
 * @returns {{ columns: number, rows: number, marginXMm: number, marginYMm: number,
 *   gapXMm: number, gapYMm: number }}
 */
function presetToGrid(preset, page) {
  const middle = (total, count, size, gap) => (total - count * size - (count - 1) * gap) / 2;
  return {
    columns: preset.declaredColumns,
    rows: preset.declaredRows,
    marginXMm: Math.round(middle(
      page.widthMm, preset.declaredColumns, preset.labelWidthMm, preset.gapXMm,
    ) * 100) / 100,
    marginYMm: Math.round(middle(
      page.heightMm, preset.declaredRows, preset.labelHeightMm, preset.gapYMm,
    ) * 100) / 100,
    gapXMm: preset.gapXMm,
    gapYMm: preset.gapYMm,
  };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/printer/profiles.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Profils d'imprimantes Niimbot.
 *
 * Deux chiffres sont critiques et contre-intuitifs :
 *
 * 1. `printheadPixels` est la largeur de la **tête**, pas celle de l'étiquette.
 *    Un D110 accepte des rouleaux de 15 mm mais sa tête ne fait que 96 px
 *    (12 mm à 203 dpi). Envoyer 120 colonnes ne provoque aucune erreur :
 *    l'imprimante rogne silencieusement à 96.
 * 2. `printTask` détermine la grammaire du dialogue d'impression. Router un
 *    D110 vers le task « v4 » (SetPageSize 13 octets) le fait refuser la page
 *    avec une erreur DataError (0xDB 06) au lieu d'imprimer.
 */

/**
 * @typedef {Object} PrinterProfile
 * @property {string} id                Identifiant lisible.
 * @property {number[]} modelIds        modelId rapportés par PrinterInfo (0x40 08).
 * @property {number} dpi               Résolution en points par pouce.
 * @property {number} printheadPixels   Largeur de la tête en pixels = largeur utile max.
 * @property {number} maxLabelWidthMm   Largeur d'étiquette maximale acceptée par le fabricant.
 * @property {number} maxPrintHeightMm  Hauteur d'impression maximale.
 * @property {{min: number, max: number, default: number}} density
 * @property {'D110'|'B1'|'V4'} printTask  Grammaire du dialogue d'impression.
 * @property {string[]} namePrefixes    Préfixes du nom BLE annoncé, pour le filtrage.
 * @property {boolean} transposed       true si la source doit être transposée avant encodage.
 */

/** Profil D110 — famille 203 dpi, tête 96 px. */
const D110 = Object.freeze({
  id: 'D110',
  // 2304 = D110, 2305 = Hi-D110, 2320 = D110_M.
  // « D110A » n'apparaît dans aucune source : le modelId réel sera lu à la
  // connexion et journalisé, ce qui lèvera le doute sur ce modèle.
  modelIds: [2304, 2305, 2320],
  dpi: 203,
  printheadPixels: 96,
  maxLabelWidthMm: 15,
  // Le fabricant vend des rouleaux de 109 mm pour ce modèle : borner la fenêtre
  // à 100 rendait ce format inutilisable, alors qu'il existe.
  maxPrintHeightMm: 120,
  density: { min: 1, max: 3, default: 2 },
  printTask: 'D110',
  namePrefixes: ['D110', 'D11', 'D101'],
  transposed: true,
});

/** Profil M2 (M2_H) — 300 dpi, tête 576 px. Conservé pour la suite. */
const M2 = Object.freeze({
  id: 'M2',
  modelIds: [4608],
  dpi: 300,
  printheadPixels: 576,
  maxLabelWidthMm: 50,
  maxPrintHeightMm: 240,
  density: { min: 1, max: 5, default: 3 },
  printTask: 'B1',
  namePrefixes: ['M2'],
  transposed: false,
});

/** Tous les profils connus, du plus spécifique au plus générique. */
const PROFILES = Object.freeze([D110, M2]);

/** Profil utilisé quand le modèle n'est pas identifié. */
const DEFAULT_PROFILE = D110;

/** Préfixes de nom BLE à proposer au sélecteur d'appareils. */
const ALL_NAME_PREFIXES = Object.freeze([
  ...new Set(PROFILES.flatMap((profile) => profile.namePrefixes)),
]);

/**
 * Retrouve un profil par son identifiant lisible (« D110 », « M2 »).
 *
 * Sert à l'aperçu : on veut pouvoir composer une étiquette au format d'une
 * imprimante qu'on ne possède pas, ou qui n'est pas connectée.
 *
 * @param {string} id
 * @returns {PrinterProfile|undefined}
 */
function findProfile(id) {
  return PROFILES.find((profile) => profile.id === id);
}

/**
 * Retrouve un profil à partir du modelId rapporté par l'imprimante.
 *
 * @param {number} modelId
 * @returns {PrinterProfile|undefined}
 */
function findByModelId(modelId) {
  return PROFILES.find((profile) => profile.modelIds.includes(modelId));
}

/**
 * Devine un profil à partir du nom BLE annoncé (ex. « D110-FC06023035 »).
 * Ne sert que de repli : le modelId lu à la connexion fait foi.
 *
 * @param {string} deviceName
 * @returns {PrinterProfile|undefined}
 */
function findByName(deviceName) {
  if (typeof deviceName !== 'string') return undefined;
  const upper = deviceName.toUpperCase();
  // On teste les préfixes du plus long au plus court pour que « B21 » ne soit
  // pas capté par « B1 ».
  const candidates = PROFILES.flatMap((profile) =>
    profile.namePrefixes.map((prefix) => ({ profile, prefix })),
  ).sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { profile, prefix } of candidates) {
    if (upper.startsWith(prefix)) return profile;
  }
  return undefined;
}

/**
 * Ajuste un profil avec la largeur de tête réellement rapportée par
 * l'imprimante (Heartbeat 0xDC [03] → 0xDE, octets 4-5).
 *
 * C'est la valeur la plus fiable : elle vient du matériel. On ne l'accepte que
 * si elle est plausible, pour ne pas écraser un profil correct avec une
 * lecture erronée.
 *
 * @param {PrinterProfile} profile
 * @param {number} reportedPixels
 * @returns {PrinterProfile}
 */
function withReportedHead(profile, reportedPixels) {
  if (!Number.isFinite(reportedPixels) || reportedPixels < 8 || reportedPixels > 4096) {
    return profile;
  }
  // Tolérance : on n'écarte pas une valeur proche de celle du profil, car
  // certains firmwares rapportent une marge (M2_H : 567 rapportés pour 576).
  return { ...profile, printheadPixels: Math.trunc(reportedPixels) };
}

/**
 * Consommables courants, par modèle.
 *
 * `widthMm` est la largeur de l'étiquette ; `lengthMm` est la longueur du
 * rouleau, celle que le profil ne connaissait pas. Sans elle, l'application
 * composait une étiquette de la hauteur de son contenu — 18 mm sur une photo
 * d'étiquette réellement imprimée — et l'imprimante avançait ensuite jusqu'à la
 * découpe suivante : le reste du rouleau sortait blanc.
 *
 * Une longueur `null` décrit un rouleau continu sans pas connu : la hauteur
 * reste alors déduite du contenu, seul comportement possible.
 *
 * Aucune de ces cotes n'est vérifiable sans le matériel : elles viennent des
 * catalogues du fabricant. `compatibleSupplies` écarte celles que la tête
 * connectée ne peut pas imprimer, ce qui est la seule garantie dont on dispose.
 */
const SUPPLIES = Object.freeze({
  // Catalogue relevé chez le fabricant, collection « label for D11/D110 » :
  // c'est la source qui fait foi, pas une supposition. Les rouleaux de 25 mm de
  // large y figurent mais sont écartés par `compatibleSupplies` — la tête de
  // 12 mm ne peut pas les atteindre.
  D110: Object.freeze([
    { id: 'd110-12x22', label: '12 × 22 mm', widthMm: 12, lengthMm: 22 },
    { id: 'd110-12x30', label: '12 × 30 mm', widthMm: 12, lengthMm: 30 },
    { id: 'd110-12x40', label: '12 × 40 mm', widthMm: 12, lengthMm: 40 },
    { id: 'd110-12x75', label: '12 × 75 mm', widthMm: 12, lengthMm: 75 },
    { id: 'd110-12x109', label: '12 × 109 mm', widthMm: 12, lengthMm: 109 },
    { id: 'd110-14x25', label: '14 × 25 mm', widthMm: 14, lengthMm: 25 },
    { id: 'd110-14x28', label: '14 × 28 mm', widthMm: 14, lengthMm: 28 },
    { id: 'd110-14x30', label: '14 × 30 mm', widthMm: 14, lengthMm: 30 },
    { id: 'd110-14x40', label: '14 × 40 mm', widthMm: 14, lengthMm: 40 },
    { id: 'd110-14x50', label: '14 × 50 mm', widthMm: 14, lengthMm: 50 },
    { id: 'd110-15x30', label: '15 × 30 mm', widthMm: 15, lengthMm: 30 },
    { id: 'd110-15x50', label: '15 × 50 mm', widthMm: 15, lengthMm: 50 },
    { id: 'd110-25x60', label: '25 × 60 mm', widthMm: 25, lengthMm: 60 },
    { id: 'd110-25x76', label: '25 × 76 mm', widthMm: 25, lengthMm: 76 },
    { id: 'd110-continue', label: 'Rouleau continu 12 mm (longueur libre)', widthMm: 12, lengthMm: null },
  ]),
  // Collection « label tape for M2/M3 ». Le 40 × 30 que je supposais n'existe
  // pas : c'est un 40 × 20. Les ronds sont notés comme tels, leur cote étant
  // celle du disque.
  M2: Object.freeze([
    { id: 'm2-25x9.5', label: '25 × 9,5 mm', widthMm: 25, lengthMm: 9.5 },
    { id: 'm2-36.5x9.5', label: '36,5 × 9,5 mm', widthMm: 36.5, lengthMm: 9.5 },
    { id: 'm2-40x20', label: '40 × 20 mm', widthMm: 40, lengthMm: 20 },
    { id: 'm2-40x40', label: '40 × 40 mm', widthMm: 40, lengthMm: 40 },
    { id: 'm2-50x30', label: '50 × 30 mm', widthMm: 50, lengthMm: 30 },
    { id: 'm2-50x50', label: '50 × 50 mm', widthMm: 50, lengthMm: 50 },
    { id: 'm2-50x70', label: '50 × 70 mm', widthMm: 50, lengthMm: 70 },
    { id: 'm2-50x80', label: '50 × 80 mm', widthMm: 50, lengthMm: 80 },
    { id: 'm2-30x70', label: '30 × 70 mm (bijouterie)', widthMm: 30, lengthMm: 70 },
    { id: 'm2-25x78', label: '25 × 78 mm (câble)', widthMm: 25, lengthMm: 78 },
    { id: 'm2-35.25x50', label: '35,25 × 50 mm (auto-pelliculé)', widthMm: 35.25, lengthMm: 50 },
    { id: 'm2-20x20-rond', label: '20 × 20 mm (rond)', widthMm: 20, lengthMm: 20 },
    { id: 'm2-24x13-rond', label: '24 × 13 mm (rond)', widthMm: 24, lengthMm: 13 },
    { id: 'm2-28x14-rond', label: '28 × 14 mm (rond)', widthMm: 28, lengthMm: 14 },
    { id: 'm2-28x15-rond', label: '28 × 15 mm (rond)', widthMm: 28, lengthMm: 15 },
    { id: 'm2-31x31-rond', label: '31 × 31 mm (rond)', widthMm: 31, lengthMm: 31 },
    { id: 'm2-34x17-rond', label: '34 × 17 mm (rond)', widthMm: 34, lengthMm: 17 },
    { id: 'm2-50x50-rond', label: '50 × 50 mm (rond)', widthMm: 50, lengthMm: 50 },
    { id: 'm2-continue', label: 'Rouleau continu 48 mm (longueur libre)', widthMm: 48, lengthMm: null },
  ]),
});

/** Longueurs de rouleau les plus courantes, proposées comme suggestions. */
const COMMON_LENGTHS_MM = Object.freeze([22, 30, 40, 50, 70]);

/**
 * Les consommables d'un profil, chacun accompagné de sa compatibilité.
 *
 * Deux contraintes, toutes deux matérielles :
 * 1. une étiquette plus large que la tête y perdrait une bande, silencieusement ;
 * 2. une étiquette plus longue que `maxPrintHeightMm` dépasse la fenêtre
 *    d'impression du modèle.
 *
 * Le catalogue reste **visible** quand il est incompatible : on signale plutôt
 * que de faire disparaître, sans quoi l'utilisateur croirait à une option
 * manquante alors qu'il a choisi le mauvais rouleau.
 *
 * @param {PrinterProfile} profile
 * @returns {Array<{ id: string, label: string, widthMm: number, lengthMm: number|null, compatible: boolean, reason: string }>}
 */
function compatibleSupplies(profile) {
  const list = SUPPLIES[profile.id] ?? [];
  const headMm = (profile.printheadPixels / profile.dpi) * 25.4;
  // Une étiquette plus large que la tête reste **imprimable** : le contenu fait
  // la largeur de la tête, et le reste de l'étiquette demeure blanc. L'interdire
  // rendait inutilisables les rouleaux 14 et 15 mm d'un D110, qui sont courants.
  // On les signale donc sans les écarter. Au-delà de cette marge, en revanche,
  // la tête ne peut pas atteindre le bord : le consommable est écarté.
  const atteignableMm = headMm + 4;

  return list.map((supply) => {
    if (supply.widthMm > atteignableMm) {
      return { ...supply, compatible: false, reason: 'trop large pour cette tête' };
    }
    if (supply.lengthMm !== null && supply.lengthMm > profile.maxPrintHeightMm) {
      return { ...supply, compatible: false, reason: 'plus longue que la fenêtre d\'impression' };
    }
    if (supply.widthMm > headMm + 0.5) {
      return { ...supply, compatible: true, reason: 'marge non imprimée sur les côtés' };
    }
    return { ...supply, compatible: true, reason: '' };
  });
}

/**
 * Convertit une largeur d'étiquette en millimètres vers la largeur de tête à
 * utiliser, en signalant l'écart éventuel.
 *
 * @param {PrinterProfile} profile
 * @param {number} labelWidthMm
 * @returns {{ cols: number, clippedMm: number, labelWidthMm: number }}
 */
function planPageWidth(profile, labelWidthMm) {
  const printableMm = (profile.printheadPixels / profile.dpi) * 25.4;
  return {
    cols: profile.printheadPixels,
    labelWidthMm,
    clippedMm: Math.max(0, labelWidthMm - printableMm),
  };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/download.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Enregistrement d'un fichier côté navigateur.
 *
 * On n'utilise ni `chrome.downloads` (absent de Safari) ni l'API File System
 * Access (`showSaveFilePicker`, absente de Safari et désactivée par défaut dans
 * Brave). L'ancre avec attribut `download` fonctionne dans tous les contextes
 * visés : page web, popup d'extension, page d'options.
 *
 * Un objet-URL est créé puis révoqué : sans révocation, le blob reste en
 * mémoire jusqu'au rechargement de la page.
 */

/**
 * Déclenche le téléchargement d'un contenu texte.
 *
 * @param {string} filename
 * @param {string} text
 * @param {{ mime?: string, document?: Document, url?: typeof URL }} [options]
 *   `document` et `url` sont injectables pour les tests.
 * @returns {boolean} true si le téléchargement a pu être déclenché.
 */
function downloadText(filename, text, options = {}) {
  return downloadBlob(filename, new Blob([text], { type: options.mime ?? 'text/plain;charset=utf-8' }), options);
}

/**
 * Déclenche le téléchargement d'un contenu binaire.
 *
 * Utilisé pour les classeurs `.xlsx`, qui ne sont pas du texte.
 *
 * @param {string} filename
 * @param {Uint8Array} bytes
 * @param {{ mime?: string, document?: Document, url?: typeof URL }} [options]
 * @returns {boolean}
 */
function downloadBytes(filename, bytes, options = {}) {
  const type = options.mime ?? 'application/octet-stream';
  // On copie dans un tableau neuf : un `Uint8Array` peut être une vue sur un
  // tampon plus grand, que le Blob embarquerait en entier.
  return downloadBlob(filename, new Blob([bytes.slice().buffer], { type }), options);
}

/**
 * Déclenche le téléchargement d'un Blob.
 *
 * @param {string} filename
 * @param {Blob} blob
 * @param {{ document?: Document, url?: typeof URL }} [options]
 * @returns {boolean}
 */
function downloadBlob(filename, blob, options = {}) {
  const doc = options.document ?? globalThis.document;
  const urlApi = options.url ?? globalThis.URL;

  if (!doc || !urlApi?.createObjectURL) return false;

  const objectUrl = urlApi.createObjectURL(blob);

  const anchor = doc.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  doc.body.appendChild(anchor);
  anchor.click();

  // La révocation est différée largement : un navigateur lit le blob de façon
  // asynchrone, et révoquer trop tôt peut le laisser croire à un téléchargement
  // en cours — Brave affichait alors « Downloads are in progress » alors que
  // rien ne se téléchargeait plus. Une minute est sans risque : le blob est de
  // toute façon libéré à la fermeture de la page.
  const revoke = () => urlApi.revokeObjectURL(objectUrl);
  if (typeof globalThis.setTimeout === 'function') globalThis.setTimeout(revoke, 60_000);
  else revoke();

  if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
  return true;
}

/**
 * Copie un texte dans le presse-papiers, avec repli sur une zone de texte.
 *
 * `navigator.clipboard` n'est pas disponible partout (et exige un contexte
 * sécurisé) ; le repli `execCommand` reste la seule option dans certains
 * contextes d'extension Safari.
 *
 * @param {string} text
 * @param {{ navigator?: Navigator, document?: Document }} [options]
 * @returns {Promise<boolean>}
 */
async function copyText(text, options = {}) {
  const nav = options.navigator ?? globalThis.navigator;
  const doc = options.document ?? globalThis.document;

  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Refus de permission ou contexte non sécurisé : on tente le repli.
  }

  if (!doc?.createElement) return false;

  try {
    const area = doc.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    doc.body.appendChild(area);
    area.select();
    const ok = doc.execCommand?.('copy') ?? false;
    doc.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/zip.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Écriture de fichiers ZIP, sans dépendance.
 *
 * Un `.xlsx` n'est rien d'autre qu'une archive ZIP de fichiers XML. Plutôt que
 * d'embarquer une bibliothèque pour cela, on écrit l'archive nous-mêmes.
 *
 * Les entrées sont stockées **sans compression** (`method: 0`). C'est un choix
 * délibéré : les images PNG qu'on y place sont déjà compressées, et les parties
 * XML sont minuscules. Cela évite d'avoir à implémenter un compresseur, et
 * reste parfaitement conforme — Excel, Numbers et LibreOffice ouvrent sans
 * difficulté une archive non compressée.
 */



/**
 * Convertit une date en couple (heure, date) au format MS-DOS, tel qu'attendu
 * par l'en-tête ZIP.
 *
 * @param {Date} date
 * @returns {{ time: number, date: number }}
 */
function dosStamp(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/**
 * Encode une chaîne en octets ASCII.
 * @param {string} text
 * @returns {Uint8Array}
 */
function ascii(text) {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) {
      throw new RangeError(`nom de fichier non ASCII : ${text}`);
    }
    out[i] = code;
  }
  return out;
}

/**
 * Assemble une archive ZIP.
 *
 * @param {Array<{ name: string, data: Uint8Array|string }>} entries
 * @param {{ date?: Date }} [options]
 * @returns {Uint8Array}
 */
function createZip(entries, options = {}) {
  const date = options.date ?? new Date();
  const stamp = dosStamp(date);

  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const name = ascii(entry.name);
    const data = typeof entry.data === 'string'
      ? new TextEncoder().encode(entry.data)
      : entry.data;
    const checksum = crc32(data);

    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); // signature d'en-tête local
    localView.setUint16(4, 20, true); // version nécessaire
    localView.setUint16(6, 0, true); // drapeaux
    localView.setUint16(8, 0, true); // méthode : stockage
    localView.setUint16(10, stamp.time, true);
    localView.setUint16(12, stamp.date, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true); // taille compressée
    localView.setUint32(22, data.length, true); // taille réelle
    localView.setUint16(26, name.length, true);
    localView.setUint16(28, 0, true); // champ supplémentaire
    local.set(name, 30);
    local.set(data, 30 + name.length);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); // signature du répertoire central
    centralView.setUint16(4, 20, true); // version de création
    centralView.setUint16(6, 20, true); // version nécessaire
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, stamp.time, true);
    centralView.setUint16(14, stamp.date, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint16(30, 0, true); // extra
    centralView.setUint16(32, 0, true); // commentaire
    centralView.setUint16(34, 0, true); // disque de départ
    centralView.setUint16(36, 0, true); // attributs internes
    centralView.setUint32(38, 0, true); // attributs externes
    centralView.setUint32(42, offset, true); // position de l'en-tête local
    central.set(name, 46);

    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); // signature de fin de répertoire
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  const total = offset + centralSize + end.length;
  const zip = new Uint8Array(total);
  let cursor = 0;
  for (const part of [...locals, ...centrals, end]) {
    zip.set(part, cursor);
    cursor += part.length;
  }
  return zip;
}

/**
 * Relit une archive ZIP dont les entrées sont stockées sans compression.
 *
 * On lit ce qu'on écrit : nos archives — dossiers d'étiquettes et classeurs —
 * sont toutes en `method: 0`. Un lecteur complet demanderait un décompresseur,
 * dont on n'a pas besoin ici ; une entrée compressée est donc signalée comme
 * telle plutôt que rendue de travers.
 *
 * La lecture se fait sur les en-têtes locaux, en parcourant l'archive : c'est
 * suffisant pour un fichier qu'on vient de produire, et cela évite de gérer le
 * répertoire central.
 *
 * @param {Uint8Array} bytes
 * @returns {Map<string, Uint8Array>} contenu indexé par nom d'entrée.
 * @throws {TypeError} si l'archive est illisible, ou contient une entrée compressée.
 */
function readStoredZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = new Map();
  let offset = 0;

  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extraLength;

    if (method !== 0) {
      throw new TypeError(
        `Entrée compressée dans l'archive (${name}) : seules les archives ` +
        'produites par cette application sont relisables.',
      );
    }
    if (start + size > bytes.length) {
      throw new TypeError(`Archive tronquée : l'entrée « ${name} » dépasse la fin du fichier.`);
    }

    entries.set(name, bytes.subarray(start, start + size));
    offset = start + size;
  }

  if (entries.size === 0) {
    throw new TypeError(
      "Cette archive ne contient aucune entrée lisible. Attendu : un ZIP produit " +
      "par l'application (dossier d'étiquettes).",
    );
  }
  return entries;
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/xlsx.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Écriture de classeurs `.xlsx`, sans dépendance.
 *
 * Un `.xlsx` est une archive ZIP de fichiers XML. On l'écrit directement plutôt
 * que d'embarquer une bibliothèque : le besoin est modeste — un tableau, des
 * images ancrées dans une colonne — et cela évite d'alourdir l'extension, qui
 * embarque déjà ce code.
 *
 * Un CSV ne peut pas contenir d'image : c'est la raison d'être de ce module.
 * Les QR codes sont intégrés comme parties `xl/media/*.png`, référencées par le
 * dessin de la feuille.
 */



/** Un pixel à 96 dpi, exprimé en EMU — l'unité des dessins Office. */
const EMU_PER_PIXEL = 9525;

/**
 * Échappe un texte pour le XML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Les caractères de contrôle sont interdits en XML 1.0 : Excel refuse
    // d'ouvrir un classeur qui en contient.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

/**
 * Convertit un index de colonne (0-based) en lettre Excel : 0 → A, 26 → AA.
 * @param {number} index
 * @returns {string}
 */
function columnLetter(index) {
  let n = index;
  let letters = '';
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letters;
}

/** Déclaration des types de parties. */
const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

/** Styles : le seul dont on a besoin est un gras pour la ligne d'en-tête. */
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/**
 * Construit une feuille de calcul.
 *
 * @param {Array<Array<string|number>>} rows
 * @param {number[]} widths Largeurs de colonnes, en caractères.
 * @param {Map<number, number>} rowHeights Hauteurs de lignes imposées, en points.
 * @returns {string}
 */
function buildSheet(rows, widths, rowHeights) {
  const cols = widths.length > 0
    ? `<cols>${widths
        .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';

  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const reference = `${columnLetter(columnIndex)}${rowIndex + 1}`;
          if (typeof value === 'number' && Number.isFinite(value)) {
            return `<c r="${reference}"><v>${value}</v></c>`;
          }
          const style = rowIndex === 0 ? ' s="1"' : '';
          return `<c r="${reference}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
        })
        .join('');

      const height = rowHeights.get(rowIndex);
      const attributes = height ? ` ht="${height}" customHeight="1"` : '';
      return `<row r="${rowIndex + 1}"${attributes}>${cells}</row>`;
    })
    .join('');

  const drawing = rowHeights.size > 0 ? '<drawing r:id="rId1"/>' : '';

  // `fitToWidth` : à l'impression, le tableau est ramené à une largeur de page.
  // Sans cela, les colonnes se répartissent sur plusieurs feuilles et un QR code
  // peut sortir sur une autre page que son URL — donc plus « un QR par ligne ».
  // `pageSetup` doit précéder `drawing` : l'ordre des éléments d'une feuille est
  // imposé par le schéma OOXML, et un ordre fautif fait ignorer la mise en page.
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
${cols}<sheetData>${body}</sheetData>
<pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
${drawing}</worksheet>`;
}

/**
 * Construit le dessin : une image ancrée par QR code.
 *
 * L'ancrage est un **`twoCellAnchor` avec `editAs="oneCell"`**, marqueurs `from`
 * **et** `to` : c'est exactement ce qu'Excel écrit quand on insère une image
 * dans une cellule, et donc la forme que tous les lecteurs savent replacer.
 * La version précédente émettait un `oneCellAnchor` — licite, lu correctement
 * par les analyseurs, mais qu'Excel n'écrit jamais : les visionneuses d'Apple
 * empilaient les images au coin de la feuille au lieu de les placer dans leurs
 * lignes.
 *
 * `editAs="oneCell"` signifie « l'image suit sa cellule sans se redimensionner
 * avec elle » : le QR garde sa taille exacte, et ne peut pas être étiré.
 *
 * @param {Array<{ row: number, column: number, widthPx: number, heightPx: number }>} images
 * @returns {string}
 */
function buildDrawing(images) {
  const anchors = images
    .map((image, index) => {
      const cx = image.widthPx * EMU_PER_PIXEL;
      const cy = image.heightPx * EMU_PER_PIXEL;
      // Le marqueur `to` désigne la cellule suivante : l'image est liée à une
      // seule cellule, celle de son QR.
      const to = `<xdr:to><xdr:col>${image.column + 1}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${image.row + 1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>`;
      return `<xdr:twoCellAnchor editAs="oneCell">
<xdr:from><xdr:col>${image.column}</xdr:col><xdr:colOff>${EMU_PER_PIXEL}</xdr:colOff><xdr:row>${image.row}</xdr:row><xdr:rowOff>${EMU_PER_PIXEL}</xdr:rowOff></xdr:from>
${to}
<xdr:pic>
<xdr:nvPicPr><xdr:cNvPr id="${index + 2}" name="QR ${index + 1}" descr="QR code du lien"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>
<xdr:blipFill><a:blip r:embed="rId${index + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
</xdr:pic>
<xdr:clientData/>
</xdr:twoCellAnchor>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${anchors}</xdr:wsDr>`;
}

/**
 * Assemble un classeur `.xlsx`.
 *
 * @param {{
 *   sheetName?: string,
 *   headers: string[],
 *   rows: Array<Array<string|number>>,
 *   images?: Array<{ row: number, column: number, data: Uint8Array, widthPx: number, heightPx: number }>,
 *   widths?: number[],
 *   date?: Date,
 * }} options
 *   `rows` contient les données **sans** la ligne d'en-tête ; `images[].row` est
 *   l'index 0-based dans la feuille, en-tête compris.
 * @returns {Promise<Uint8Array>}
 */
async function buildXlsx(options) {
  const sheetName = options.sheetName ?? 'Liens';
  const headers = options.headers ?? [];
  const rows = options.rows ?? [];
  const images = options.images ?? [];

  const allRows = [headers, ...rows];
  const widths = options.widths
    ?? headers.map((header, index) => {
      const longest = Math.max(
        String(header).length,
        ...rows.map((row) => String(row[index] ?? '').length),
      );
      // Excel exprime les largeurs en caractères ; on borne pour rester lisible.
      return Math.min(60, Math.max(8, longest + 2));
    });

  // Une ligne portant un QR doit être assez haute pour l'afficher.
  const rowHeights = new Map();
  for (const image of images) {
    const points = Math.ceil(image.heightPx * 0.75) + 4;
    rowHeights.set(image.row, Math.max(rowHeights.get(image.row) ?? 0, points));
  }

  const entries = [
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: ROOT_RELS },
    {
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'xl/styles.xml', data: STYLES },
    { name: 'xl/worksheets/sheet1.xml', data: buildSheet(allRows, widths, rowHeights) },
  ];

  if (images.length > 0) {
    entries.push({
      name: 'xl/worksheets/_rels/sheet1.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`,
    });

    entries.push({ name: 'xl/drawings/drawing1.xml', data: buildDrawing(images) });

    entries.push({
      name: 'xl/drawings/_rels/drawing1.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${images
  .map(
    (_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${index + 1}.png"/>`,
  )
  .join('')}
</Relationships>`,
    });

    images.forEach((image, index) => {
      entries.push({ name: `xl/media/image${index + 1}.png`, data: image.data });
    });
  }

  return createZip(entries, { date: options.date });
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/spreadsheet.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Export tableur, avec les QR codes intégrés.
 *
 * Un CSV ne peut pas transporter d'image : c'est la raison d'être de cet
 * export, qui produit un vrai classeur `.xlsx` où chaque ligne porte son QR.
 *
 * La construction du classeur vit dans `core/xlsx.js` ; ce module ne fait que
 * décider de sa mise en forme — quelles colonnes, quelle taille d'image, quels
 * en-têtes.
 */







/**
 * Taille d'image visée, en pixels, avant réduction au besoin.
 *
 * 96 px : à 96 dpi cela fait exactement un pouce (25,4 mm), soit un QR d'environ
 * 21 mm de côté une fois posé — imprimable, scannable, et assez petit pour que
 * dix lignes tiennent sur une page. Une image plus grande obligeait à des lignes
 * de 100 points, et le tableau ne tenait plus sur une page en largeur.
 */
const QR_TARGET_PX = 96;

/** En-têtes du classeur, dans l'ordre des colonnes, sans la note. */
const SPREADSHEET_HEADERS = ['N°', 'URL', 'Titre', 'Domaine', 'Tags', 'Ajouté le', 'QR code'];

/**
 * Largeur de la colonne des QR codes, en unités Excel (caractères).
 *
 * 19 unités ≈ 138 px, pour une image de 96 px : elle tient dans sa cellule avec
 * de la marge, sans déborder sur la colonne suivante.
 */
const QR_WIDTH_UNITS = 19;

/** Index de la colonne qui reçoit les images, dans la forme de référence. */
const QR_COLUMN_INDEX = SPREADSHEET_HEADERS.indexOf('QR code');

/**
 * Colonnes réellement écrites, et index de celle qui porte les images.
 *
 * La colonne « Note » n'est ajoutée que si au moins un lien en a une : un
 * classeur ne doit pas transporter une colonne vide sur toute sa hauteur. Elle
 * se place **avant** la colonne des QR codes, dont l'index est donc recalculé —
 * une image ancrée sur la mauvaise colonne serait invisible.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {{ headers: string[], qrColumn: number, noteColumn: number }}
 */
function spreadsheetLayout(links) {
  const withNote = hasAnyNote(links);
  const headers = [
    'N°', 'URL', 'Titre', 'Domaine', 'Tags',
    ...(withNote ? ['Note'] : []),
    'Ajouté le', 'QR code',
  ];
  return {
    headers,
    qrColumn: headers.indexOf('QR code'),
    noteColumn: withNote ? headers.indexOf('Note') : -1,
  };
}

/**
 * Construit le classeur des liens, avec leurs QR codes.
 *
 * Le classeur reçoit les liens **déjà résolus** par `resolveTargets` : l'URL de
 * la colonne « URL » est donc exactement celle qu'encode l'image QR de la même
 * ligne, ce qui est tout l'intérêt d'un tableur imprimé. L'URL d'origine, quand
 * elle diffère, apparaît dans une colonne ajoutée en fin de tableau.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {{ now?: number, onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<Uint8Array>}
 */
async function buildLinkSpreadsheet(links, options = {}) {
  const now = options.now ?? Date.now();

  const withOriginal = links.some((link) => sourceUrl(link) !== link.url);
  const layout = spreadsheetLayout(links);
  const headers = withOriginal
    ? [...layout.headers, 'URL d\'origine']
    : layout.headers;

  const rows = links.map((link, index) => [
    index + 1,
    link.url,
    link.title,
    sourceHost(link),
    // Tags sans « # » : dans un tableur, le dièse n'apporte rien et gêne le
    // filtrage. C'est la même forme que la colonne « Tags » du CSV.
    link.tags.join(' '),
    ...(layout.noteColumn >= 0 ? [link.note] : []),
    formatDateTime(link.createdAt),
    // La cellule sous l'image reste vide : le QR est ancré par-dessus.
    '',
    ...(withOriginal ? [sourceUrl(link) === link.url ? '' : sourceUrl(link)] : []),
  ]);

  const images = [];
  for (const [index, link] of links.entries()) {
    const png = await qrPng(link.url, { scale: 8, maxSize: QR_TARGET_PX, border: 2 });
    // `row` compte la ligne d'en-tête : les données commencent à la ligne 1.
    images.push({
      row: index + 1,
      column: layout.qrColumn,
      data: png,
      widthPx: QR_TARGET_PX,
      heightPx: QR_TARGET_PX,
    });
    options.onProgress?.(index + 1, links.length);
  }

  // Largeurs alignées sur les colonnes réellement écrites. La colonne du QR
  // fait au moins la largeur de l'image (19 unités ≈ 138 px) : une image plus
  // large que sa cellule déborde sur la voisine, et un lecteur qui rogne à la
  // cellule en couperait un morceau.
  const baseWidths = [5, 55, 32, 20, 18, ...(layout.noteColumn >= 0 ? [40] : []), 17, QR_WIDTH_UNITS];
  const widths = withOriginal ? [...baseWidths, 55] : baseWidths;

  return buildXlsx({
    sheetName: 'Liens',
    headers,
    rows,
    images,
    widths,
    date: new Date(now),
  });
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/import.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Relecture des archives exportées.
 *
 * L'import existait, mais il n'acceptait qu'une seule des trois formes que
 * l'application sait produire : l'archive JSON du bouton « Archive ». Ni le CSV,
 * ni le `export.json` du dossier d'étiquettes — ni, donc, le ZIP lui-même —
 * n'étaient relisibles. C'était le principal malentendu autour de l'import :
 * exporter puis réimporter ce qu'on venait d'exporter ne marchait pas.
 *
 * Ce module accepte les trois, en s'appuyant sur ce qu'on écrit :
 *
 * | Fichier | Ce qu'on en tire |
 * |---|---|
 * | archive JSON (« Archive ») | tout le modèle : titre, tags, note, raccourci |
 * | dossier d'étiquettes `.zip` | les liens de son `export.json` |
 * | `export.json` seul | les mêmes |
 * | CSV exporté | URL, titre, tags, note, date — la colonne « Domaine » est ignorée |
 *
 * Toutes les fonctions sont pures : aucune lecture disque, aucun DOM. C'est ce
 * qui les rend testables, et c'est aussi ce qui impose à l'appelant de fournir
 * le contenu du fichier.
 */




/** Formes d'archive reconnues. */
const IMPORT_KINDS = Object.freeze(['links', 'labels', 'csv']);

/**
 * Erreur d'import, avec un message qui dit ce qui était attendu.
 * @param {string} detail
 * @returns {TypeError}
 */
function unrecognised(detail) {
  return new TypeError(
    `${detail} Formats acceptés : l'archive JSON du bouton « Archive », le ` +
    'dossier d\'étiquettes (.zip) ou son export.json, ou un CSV exporté d\'ici.',
  );
}

/**
 * Lit l'archive JSON complète, produite par `toJson`.
 *
 * @param {string} text
 * @returns {{ kind: string, records: object[] }}
 */
function fromJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw unrecognised(`Fichier illisible : ${error.message}.`);
  }

  if (Array.isArray(parsed)) return { kind: 'links', records: parsed };

  // Archive de liens : le cas nominal.
  if (Array.isArray(parsed?.links)) return { kind: 'links', records: parsed.links };

  // Manifeste du dossier d'étiquettes : `labels[].url` porte la destination
  // imprimée, et `originalUrl` l'adresse d'origine quand elle a été raccourcie.
  if (Array.isArray(parsed?.labels)) {
    return {
      kind: 'labels',
      records: parsed.labels
        .filter((label) => label && typeof label.url === 'string')
        .map((label) => {
          const shortened = typeof label.originalUrl === 'string' && label.originalUrl !== '';
          return {
            url: shortened ? label.originalUrl : label.url,
            title: typeof label.title === 'string' ? label.title : '',
            shortUrl: shortened ? label.url : '',
            shortProvider: shortened ? 'import' : '',
          };
        }),
    };
  }

  throw unrecognised(
    'Archive JSON sans liste de liens'
    + (parsed?.format ? ` (format « ${parsed.format} »)` : '')
    + '.',
  );
}

/**
 * Découpe un CSV en lignes de champs, en respectant les guillemets.
 *
 * Reprend les conventions de l'export : guillemets doublés à l'intérieur d'un
 * champ, séparateur `;` ou `,`, fin de ligne `CRLF` ou `LF`.
 *
 * @param {string} text
 * @returns {string[][]}
 */
function parseCsvRows(text) {
  const body = text.replace(/^\uFEFF/, '');
  const firstLine = body.slice(0, body.indexOf('\n') === -1 ? body.length : body.indexOf('\n'));
  // Le séparateur se déduit de l'en-tête : les deux sont produits par l'export.
  const delimiter = (firstLine.match(/;/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length
    ? ';'
    : ',';

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < body.length; index++) {
    const char = body[index];

    if (quoted) {
      if (char === '"') {
        if (body[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Relit une date d'export (`JJ/MM/AAAA` ou `JJ/MM/AAAA HH:MM`).
 *
 * La date est locale, comme à l'export : la relire en UTC la décalerait d'un
 * jour selon le fuseau.
 *
 * @param {string} value
 * @returns {number} epoch ms, ou 0 si la date n'est pas reconnue.
 */
function parseExportedDate(value) {
  const match = String(value ?? '').trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?$/);
  if (!match) return 0;
  const [, day, month, year, hour, minute] = match;
  const date = new Date(
    Number(year), Number(month) - 1, Number(day),
    Number(hour ?? 0), Number(minute ?? 0),
  );
  if (!Number.isFinite(date.getTime())) return 0;

  // `new Date(2026, 12, 32)` ne refuse rien : il reporte au 1er février 2027.
  // On vérifie donc que la date construite est bien celle qui était écrite,
  // sans quoi une date impossible entrerait dans la collection sous une autre.
  if (date.getFullYear() !== Number(year)
    || date.getMonth() !== Number(month) - 1
    || date.getDate() !== Number(day)
    || date.getHours() !== Number(hour ?? 0)
    || date.getMinutes() !== Number(minute ?? 0)) {
    return 0;
  }
  return date.getTime();
}

/**
 * Relit un CSV produit par l'export.
 *
 * Les colonnes sont repérées par leur en-tête, pas par leur position : un
 * tableur qui réordonne les colonnes reste importable, et les colonnes
 * facultatives (« Note », « URL courte ») sont prises quand elles sont là.
 *
 * @param {string} text
 * @returns {{ kind: string, records: object[] }}
 */
function fromCsv(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ''));
  if (rows.length < 2) {
    throw unrecognised('CSV sans ligne de données.');
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const column = (...names) => {
    for (const name of names) {
      const index = headers.indexOf(name);
      if (index !== -1) return index;
    }
    return -1;
  };

  const urlColumn = column('url', 'adresse', 'lien');
  if (urlColumn === -1) {
    throw unrecognised(`CSV sans colonne « URL » (colonnes trouvées : ${rows[0].join(', ')}).`);
  }

  const titleColumn = column('titre', 'title');
  const tagColumn = column('tags', 'étiquettes', 'etiquettes');
  const noteColumn = column('note', 'notes');
  const dateColumn = column('ajouté le', 'ajoute le', 'date');
  const shortColumn = column('url courte');

  const records = [];
  for (const row of rows.slice(1)) {
    const url = (row[urlColumn] ?? '').trim();
    if (url === '') continue;

    const record = { url };
    if (titleColumn !== -1) record.title = (row[titleColumn] ?? '').trim();
    if (noteColumn !== -1) record.note = (row[noteColumn] ?? '').trim();
    if (tagColumn !== -1) {
      // L'export sépare les tags par des espaces ; on accepte aussi les
      // virgules et les « # », par symétrie avec la saisie.
      record.tags = (row[tagColumn] ?? '')
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#+/, ''))
        .filter((tag) => tag !== '');
    }
    if (shortColumn !== -1) record.shortUrl = (row[shortColumn] ?? '').trim();

    const createdAt = dateColumn === -1 ? 0 : parseExportedDate(row[dateColumn]);
    if (createdAt > 0) record.createdAt = createdAt;

    records.push(record);
  }

  if (records.length === 0) throw unrecognised('CSV sans URL exploitable.');
  return { kind: 'csv', records };
}

/**
 * Prépare les enregistrements à partir d'un fichier importé.
 *
 * @param {{ text?: string, bytes?: Uint8Array, name?: string }} file
 * @returns {{ kind: string, records: object[], notes: string[] }}
 * @throws {TypeError} si le fichier n'est pas une archive reconnue.
 */
function parseImportFile(file) {
  const name = String(file?.name ?? '').toLowerCase();
  const notes = [];

  if (file?.bytes) {
    // Un ZIP : on cherche le manifeste, qui porte le titre et l'URL d'origine.
    let entries;
    try {
      entries = readStoredZip(file.bytes);
    } catch (error) {
      throw unrecognised(error.message);
    }

    const manifest = entries.get('export.json');
    if (!manifest) {
      throw unrecognised(
        `Archive ZIP sans « export.json » (entrées : ${[...entries.keys()].join(', ')}).`,
      );
    }
    const parsed = fromJson(new TextDecoder().decode(manifest));
    notes.push(`${entries.size} fichier(s) dans l'archive, manifeste « export.json » lu.`);
    return { ...parsed, notes };
  }

  const text = String(file?.text ?? '');
  const trimmed = text.replace(/^\uFEFF/, '').trimStart();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { ...fromJson(text), notes };
  }
  if (name.endsWith('.csv') || trimmed.includes(';') || trimmed.includes(',')) {
    return { ...fromCsv(text), notes };
  }

  throw unrecognised(
    name ? `« ${name} » n'est pas un format reconnu.` : "Ce fichier n'est pas un format reconnu.",
  );
}

/**
 * Convertit des enregistrements bruts en liens valides, en écartant les autres.
 *
 * Un enregistrement refusé ne doit pas faire échouer tout l'import : il est
 * compté et signalé, comme les doublons.
 *
 * @param {object[]} records
 * @param {{ now?: number }} [options]
 * @returns {{ links: object[], rejected: number }}
 */
function toImportableLinks(records, options = {}) {
  const links = [];
  let rejected = 0;

  for (const record of records) {
    try {
      links.push(createLink({ ...record, source: 'import' }, options));
    } catch {
      rejected += 1;
    }
  }
  return { links, rejected };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/label-export.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Export d'étiquettes en images.
 *
 * Le principe : plutôt que de parler à chaque modèle d'étiqueteuse — ce qui
 * suppose du matériel, un protocole et des pilotes — on produit un dossier
 * d'images **prêtes à imprimer**. Libre à l'utilisateur de les passer à
 * l'imprimante qu'il veut : l'application du fabricant, un traitement de texte,
 * un navigateur, ou une Niimbot via le module dédié.
 *
 * Chaque image contient le QR code et le texte choisi. Le dossier emporte aussi
 * une planche HTML imprimable, un CSV reliant chaque URL à son image, et le
 * détail des réglages — de quoi reproduire l'export à l'identique.
 *
 * Ce module ne fait que **planifier** : il calcule des dimensions en pixels et
 * prépare l'archive. Le rendu des images lui-même appartient à l'appelant, qui
 * dispose d'un canvas — c'est la seule partie qui ne peut pas vivre ici.
 */







/**
 * Formats d'étiquettes courants.
 *
 * `heightMm: null` signifie que la hauteur découle du contenu — c'est le cas
 * des rouleaux continus, où l'on coupe après impression.
 */
const LABEL_FORMATS = Object.freeze([
  {
    id: 'niimbot-d110',
    name: 'Niimbot D110 — 12 mm utile (203 dpi)',
    widthMm: 12,
    heightMm: null,
    dpi: 203,
  },
  {
    id: 'niimbot-m2',
    name: 'Niimbot M2 — 48 mm (300 dpi)',
    widthMm: 48,
    heightMm: null,
    dpi: 300,
  },
  {
    id: 'brother-62',
    name: 'Brother QL — 62 mm (300 dpi)',
    widthMm: 62,
    heightMm: 40,
    dpi: 300,
  },
  {
    id: 'dymo-54',
    name: 'Dymo LabelWriter — 54 mm (300 dpi)',
    widthMm: 54,
    heightMm: 32,
    dpi: 300,
  },
  {
    id: 'zebra-2in',
    name: 'Zebra 2 pouces — 54 mm (203 dpi)',
    widthMm: 54,
    heightMm: 25,
    dpi: 203,
  },
  {
    id: 'generic-50x30',
    name: 'Générique — 50 × 30 mm (300 dpi)',
    widthMm: 50,
    heightMm: 30,
    dpi: 300,
  },
  {
    id: 'generic-70x40',
    name: 'Générique — 70 × 40 mm (300 dpi)',
    widthMm: 70,
    heightMm: 40,
    dpi: 300,
  },
  {
    id: 'avery-3x8',
    name: 'Planche A4 — 3 × 8 (63,5 × 33,9 mm)',
    widthMm: 63.5,
    heightMm: 33.9,
    dpi: 300,
  },
]);

/**
 * Nombre de lignes qu'une date peut occuper sous le QR code.
 *
 * Au-delà, elle est abandonnée plutôt qu'imprimée partiellement : sur une
 * étiquette de 12 mm, « 15/09/2026 18:01 » demande trois lignes et viderait le
 * texte de son sens. Réduire la taille de police est la façon de la faire tenir.
 */
const DATE_MAX_LINES = 3;

/** Contenu textuel imprimé sous le QR code. */
const TEXT_MODES = Object.freeze({
  'title-url': 'Titre puis URL',
  url: 'URL seule',
  title: 'Titre seul',
  none: 'Aucun texte',
  host: 'Domaine seul',
});

/** Réglages par défaut de l'export. */
const DEFAULT_EXPORT_OPTIONS = Object.freeze({
  formatId: 'niimbot-d110',
  textMode: 'url',
  // Aucune date par défaut : chaque ligne de texte prend la place du QR, et une
  // étiquette de 12 mm n'en a pas de reste.
  dateMode: 'none',
  marginMm: 1.5,
  qrRatio: 0.9,
  fontSizePt: 7,
  cutMarks: true,
  maxLines: 4,
});

// `mmToPx` vient de `label.js` : le redéclarer ici provoquerait une collision
// de noms au moment de l'assemblage, l'un des deux masquant l'autre.

/**
 * Convertit des points typographiques en pixels.
 * @param {number} pt
 * @param {number} dpi
 * @returns {number}
 */
function ptToPx(pt, dpi) {
  return Math.round((pt / 72) * dpi);
}

/**
 * Retrouve un format par son identifiant.
 * @param {string} id
 * @returns {typeof LABEL_FORMATS[number]}
 */
function findFormat(id) {
  return LABEL_FORMATS.find((format) => format.id === id) ?? LABEL_FORMATS[0];
}

/**
 * Compose les lignes de texte d'une étiquette.
 *
 * @param {import('./link.js').LinkRecord} link
 * @param {string} textMode
 * @returns {string[]}
 */
function labelText(link, textMode) {
  switch (textMode) {
    case 'title-url': {
      const lines = [];
      if (link.title) lines.push(link.title);
      lines.push(link.url);
      return lines;
    }
    case 'title':
      return link.title ? [link.title] : [link.url];
    case 'host':
      // Le domaine imprimé est toujours celui du site visé, jamais celui du
      // raccourcisseur : « tinyurl.com » sous un QR n'apprendrait rien.
      return [sourceHost(link)];
    case 'none':
      return [];
    case 'url':
    default:
      return [link.url];
  }
}

/**
 * Produit un nom de fichier court, unique et lisible.
 *
 * @param {import('./link.js').LinkRecord} link
 * @param {number} index
 * @param {number} total
 * @returns {string}
 */
function labelFileName(link, index, total) {
  const padding = String(total).length;
  const number = String(index + 1).padStart(padding, '0');

  const slug = (link.title || sourceHost(link) || 'lien')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${number}-${slug || 'lien'}.png`;
}

/**
 * Planifie une étiquette : dimensions en pixels et lignes de texte.
 *
 * @param {object} options
 * @param {import('./link.js').LinkRecord} options.link
 * @param {typeof LABEL_FORMATS[number]} options.format
 * @param {(text: string) => number} options.measure Mesure de texte, fournie
 *   par l'appelant — lui seul connaît la police réellement utilisée.
 * @param {string} [options.textMode]
 * @param {number} [options.marginMm]
 * @param {number} [options.qrRatio]
 * @param {number} [options.fontSizePt]
 * @param {number} [options.maxLines]
 * @returns {{
 *   widthPx: number, heightPx: number, marginPx: number, qrSizePx: number,
 *   qrScale: number, qrModules: number, fontSizePx: number, lineHeightPx: number,
 *   lines: string[], textTopPx: number, fits: boolean, url: string,
 * }}
 */
function planLabel(options) {
  const { link, format, measure } = options;
  const textMode = options.textMode ?? DEFAULT_EXPORT_OPTIONS.textMode;
  const dateMode = options.dateMode ?? DEFAULT_EXPORT_OPTIONS.dateMode;
  const marginMm = options.marginMm ?? DEFAULT_EXPORT_OPTIONS.marginMm;
  const qrRatio = options.qrRatio ?? DEFAULT_EXPORT_OPTIONS.qrRatio;
  const fontSizePt = options.fontSizePt ?? DEFAULT_EXPORT_OPTIONS.fontSizePt;
  const maxLines = options.maxLines ?? DEFAULT_EXPORT_OPTIONS.maxLines;

  const widthPx = mmToPx(format.widthMm, format.dpi);
  const marginPx = Math.max(0, mmToPx(marginMm, format.dpi));
  const fontSizePx = Math.max(6, ptToPx(fontSizePt, format.dpi));
  const lineHeightPx = Math.ceil(fontSizePx * 1.2);
  const innerWidth = Math.max(1, widthPx - marginPx * 2);

  const matrix = encodeQr(link.url, { ecc: 'M', border: 2 });

  // La date est un segment à part : elle ne se mélange pas à l'URL, sinon elle
  // se retrouverait collée au bout d'une ligne coupée.
  const dateText = formatCaptureDate(link.createdAt, dateMode);

  // **Une date ne se coupe pas.** Sur une étiquette de 12 mm, « 15/09/2026
  // 18:01 » occupe plusieurs lignes ; laisser le plafond de lignes l'amputer
  // donnerait « 15/09/ » — une date fausse, ce qui est pire que pas de date.
  // On réserve donc ses lignes avant celles du texte principal, et on
  // l'abandonne entièrement si elle ne tient pas.
  // `wrapDate` découpe la date **entière** ou la refuse : « 15/09/ » puis
  // « 2026 » se lit mal. Il coupe au seul endroit acceptable, l'espace entre la
  // date et l'heure, ce qui permet à « 16/09/2026 00:28 » de tenir en deux ou
  // trois lignes au lieu d'être abandonné en bloc.
  // Ici la taille de police est imposée par l'utilisateur : on ne peut pas la
  // réduire pour faire tenir la date, comme le fait l'étiquette Niimbot. On
  // accepte donc un découpage plus franc, du moment que la date reste entière.
  const dateLines = dateText
    ? wrapDate(measure, dateText, innerWidth, DATE_MAX_LINES, { strict: false })
    : [];
  const dateOmitted = dateText !== '' && dateLines.length === 0;

  const body = labelText(link, textMode).join(' ');
  // Le texte principal garde son propre plafond : la date s'ajoute à lui au
  // lieu de lui prendre ses lignes. Elle les lui prenait, et l'URL se trouvait
  // tronquée à deux lignes dès qu'on demandait la date.
  const bodyLines = body
    ? wrapText(measure, body, innerWidth, { maxLines })
    : [];

  const lines = [...bodyLines, ...dateLines];
  const textHeight = lines.length * lineHeightPx;

  // Hauteur fixe (planche) ou déduite du contenu (rouleau continu).
  const fixedHeight = format.heightMm ? mmToPx(format.heightMm, format.dpi) : 0;
  const gap = lines.length > 0 ? marginPx : 0;

  let qrSizePx;
  if (fixedHeight > 0) {
    const available = fixedHeight - marginPx * 2 - gap - textHeight;
    const side = Math.max(16, Math.min(innerWidth, available));
    // Un QR fait un nombre entier de modules : on arrondit vers le bas.
    qrSizePx = Math.max(matrix.size * 2, Math.floor(side / matrix.size) * matrix.size);
  } else {
    qrSizePx = Math.max(matrix.size * 2, Math.floor((innerWidth * qrRatio) / matrix.size) * matrix.size);
  }

  const qrScale = qrSizePx / matrix.size;
  const heightPx = fixedHeight > 0
    ? fixedHeight
    : marginPx * 2 + qrSizePx + gap + textHeight;

  return {
    widthPx,
    heightPx,
    marginPx,
    qrSizePx,
    qrScale,
    qrModules: matrix.size,
    fontSizePx,
    lineHeightPx,
    lines,
    textTopPx: marginPx + qrSizePx + gap,
    // `false` signale que le QR ne tient pas dans la largeur utile : l'appelant
    // peut alors prévenir plutôt que de rogner en silence.
    fits: qrSizePx <= innerWidth,
    url: link.url,
    dateOmitted,
  };
}

/**
 * Planifie toutes les étiquettes d'une collection.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {Omit<Parameters<typeof planLabel>[0], 'link'>} options
 * @returns {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: ReturnType<typeof planLabel> }>}
 */
function planLabels(links, options) {
  return links.map((link, index) => ({
    link,
    fileName: labelFileName(link, index, links.length),
    plan: planLabel({ ...options, link }),
  }));
}

/**
 * Construit la planche HTML imprimable.
 *
 * C'est le chemin le plus court vers le papier : on ouvre le fichier dans un
 * navigateur, on imprime. Les images sont référencées en relatif, à côté du
 * fichier — l'archive entière est donc autonome.
 *
 * @param {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: object }>} planned
 * @param {{ title?: string, cutMarks?: boolean, format?: object }} [options]
 * @returns {string}
 */
function buildPrintSheet(planned, options = {}) {
  const title = options.title ?? 'Mes liens';
  const cutMarks = options.cutMarks ?? DEFAULT_EXPORT_OPTIONS.cutMarks;
  const format = options.format ?? findFormat(DEFAULT_EXPORT_OPTIONS.formatId);

  const cells = planned
    .map(({ link, fileName, plan }) => {
      const text = plan.lines
        .map((line) => `<span>${escapeHtml(line)}</span>`)
        .join('');
      return `      <figure class="label${cutMarks ? ' label--cut' : ''}" style="--w:${format.widthMm}mm">
        <img src="etiquettes/${encodeURIComponent(fileName)}" alt="${escapeHtml(link.url)}" width="${plan.qrSizePx}" height="${plan.qrSizePx}">
        <figcaption>${text}</figcaption>
      </figure>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} — étiquettes</title>
<style>
  body { margin: 0; padding: 8mm; font-family: -apple-system, system-ui, sans-serif; background: #f4f4f2; }
  h1 { font-size: 12pt; margin: 0 0 6mm; }
  .sheet { display: flex; flex-wrap: wrap; gap: 3mm; }
  .label { width: var(--w); margin: 0; background: #fff; padding: 1.5mm; box-sizing: border-box;
           display: flex; flex-direction: column; align-items: center; gap: 1mm; break-inside: avoid; }
  .label--cut { outline: 0.2mm dashed #999; }
  .label img { display: block; max-width: 100%; height: auto; image-rendering: pixelated; }
  figcaption { font-size: 6pt; line-height: 1.2; text-align: center; word-break: break-all; }
  figcaption span { display: block; }
  @media print {
    body { background: #fff; padding: 0; }
    h1 { display: none; }
    .sheet { gap: 0; }
    .label--cut { outline-color: #ddd; }
  }
</style>
</head>
<body>
<h1>${escapeHtml(title)} — ${planned.length} étiquette${planned.length > 1 ? 's' : ''}</h1>
<div class="sheet">
${cells}
</div>
</body>
</html>
`;
}

/**
 * Échappe un texte pour le HTML.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Assemble l'archive de l'export.
 *
 * @param {object} options
 * @param {Array<{ link: import('./link.js').LinkRecord, fileName: string, plan: object }>} options.planned
 * @param {Map<string, Uint8Array>} options.images PNG indexés par nom de fichier.
 * @param {object} [options.settings] Réglages retenus, consignés dans l'archive.
 * @param {number} [options.now]
 * @returns {Uint8Array}
 */
function buildLabelArchive(options) {
  const { planned, images } = options;
  const now = options.now ?? Date.now();
  const format = options.settings?.format ?? findFormat(DEFAULT_EXPORT_OPTIONS.formatId);

  const entries = [];

  for (const { fileName } of planned) {
    const png = images.get(fileName);
    if (png) entries.push({ name: `etiquettes/${fileName}`, data: png });
  }

  // Un CSV qui relie chaque URL à son image : c'est ce qui permet de retrouver
  // l'étiquette d'un lien sans ouvrir les images une à une.
  //
  // Quand au moins un lien est raccourci, une colonne « URL d'origine » apparaît
  // en fin de tableau : l'archive doit toujours permettre de retrouver la vraie
  // adresse, même si le service de raccourcissement disparaît.
  const withShort = planned.some(
    ({ link }) => hasShortUrl(link) && sourceUrl(link) !== link.url,
  );
  const csvRows = planned.map(({ link, fileName }, index) => [
    index + 1,
    link.url,
    ...(withShort ? [sourceUrl(link) === link.url ? '' : sourceUrl(link)] : []),
    link.title,
    `etiquettes/${fileName}`,
  ]);
  const header = withShort
    ? ['N°', 'URL', 'URL d\'origine', 'Titre', 'Image']
    : ['N°', 'URL', 'Titre', 'Image'];
  const csv = '\uFEFF' + [header, ...csvRows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(';'))
    .join('\r\n') + '\r\n';
  entries.push({ name: 'liens.csv', data: csv });

  entries.push({
    name: 'planche.html',
    data: buildPrintSheet(planned, {
      title: options.settings?.title ?? 'Mes liens',
      cutMarks: options.settings?.cutMarks,
      format,
    }),
  });

  entries.push({
    name: 'export.json',
    data: JSON.stringify(
      {
        format: 'url-qr-code-printer/labels',
        version: 1,
        exportedAt: new Date(now).toISOString(),
        settings: {
          labelFormat: format.id,
          labelName: format.name,
          widthMm: format.widthMm,
          heightMm: format.heightMm,
          dpi: format.dpi,
          textMode: options.settings?.textMode ?? DEFAULT_EXPORT_OPTIONS.textMode,
          dateMode: options.settings?.dateMode ?? DEFAULT_EXPORT_OPTIONS.dateMode,
          marginMm: options.settings?.marginMm ?? DEFAULT_EXPORT_OPTIONS.marginMm,
          fontSizePt: options.settings?.fontSizePt ?? DEFAULT_EXPORT_OPTIONS.fontSizePt,
          cutMarks: options.settings?.cutMarks ?? DEFAULT_EXPORT_OPTIONS.cutMarks,
        },
        count: planned.length,
        // Signale tout de suite les dates abandonnées : un réglage demandé et
        // non appliqué doit se voir, pas se deviner sur l'image.
        datesOmitted: planned.filter(({ plan }) => plan.dateOmitted).length,
        labels: planned.map(({ link, fileName, plan }) => ({
          file: `etiquettes/${fileName}`,
          url: link.url,
          // Consignée seulement quand elle diffère : le manifeste reste compact,
          // et une étiquette raccourcie reste réversible.
          ...(sourceUrl(link) !== link.url ? { originalUrl: sourceUrl(link) } : {}),
          title: link.title,
          widthPx: plan.widthPx,
          heightPx: plan.heightPx,
        })),
      },
      null,
      2,
    ),
  });

  return createZip(entries, { date: new Date(now) });
}

/**
 * Échappe un champ CSV — même règle que l'export texte.
 * @param {unknown} value
 * @returns {string}
 */
function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  return /[;"\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

/**
 * Nom de fichier de l'archive d'étiquettes.
 *
 * @param {number} [now]
 * @param {string} [base] Nom de la collection, pour retrouver l'archive dans un
 *   dossier de téléchargements. Le défaut reste `etiquettes-qr`.
 * @returns {string}
 */
function labelArchiveName(now = Date.now(), base = 'etiquettes-qr') {
  return exportFilename(base, 'zip', now || Date.now());
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/printer/packet.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Protocole Niimbot — encodage et décodage des trames.
 *
 * Trame standard :
 *
 *   0x55 0x55 │ CMD │ LEN │ DATA[0..LEN-1] │ XOR │ 0xAA 0xAA
 *
 * Le checksum est le XOR de CMD, LEN et de **tous** les octets de DATA.
 * L'en-tête et le pied de trame n'y participent pas.
 *
 * Le flux reçu n'est pas aligné sur les trames : plusieurs trames peuvent
 * arriver collées dans une notification, et une trame peut être coupée entre
 * deux notifications. `PacketStreamDecoder` tamponne et resynchronise sur
 * l'en-tête — c'est le point que ratent la plupart des implémentations maison.
 *
 * Références : MultiMote/niimbluelib (`src/packets/packet.ts`),
 * iscarelli/niimbot-web-bluetooth (driver validé sur D110 et M2-H),
 * printers.niim.blue/interfacing/proto/.
 */

const HEAD = Object.freeze([0x55, 0x55]);
const TAIL = Object.freeze([0xaa, 0xaa]);

/** Préfixe ajouté uniquement à la commande Connect. */
const CONNECT_PREFIX = 0x03;

/** Codes de commande (client → imprimante). */
const CMD = Object.freeze({
  Connect: 0xc1,
  PrintStart: 0x01,
  PageStart: 0x03,
  PageEnd: 0xe3,
  PrintEnd: 0xf3,
  PrintClear: 0x20,
  SetDensity: 0x21,
  SetLabelType: 0x23,
  SetPageSize: 0x13,
  PrintQuantity: 0x15,
  PrintBitmapRow: 0x85,
  PrintEmptyRow: 0x84,
  PrinterCheckLine: 0x86,
  PrintStatus: 0xa3,
  PrinterStatusData: 0xa5,
  PrinterInfo: 0x40,
  Heartbeat: 0xdc,
  // Lecture du consommable (0x1A) : la commande existe, mais le lecteur RFID
  // n'équipe pas tous les modèles et sa réponse n'a jamais pu être confrontée à
  // du matériel. Une lecture approximative affichait « rouleau continu » sur un
  // rouleau qui ne l'était pas : on ne l'utilise donc pas, et le consommable se
  // choisit dans la liste.
  RfidInfo: 0x1a,
});

/** Codes de notification (imprimante → client). */
const CMD_IN = Object.freeze({
  Connect: 0xc2,
  PrintStart: 0x02,
  PageStart: 0x04,
  PageEnd: 0xe4,
  PrintEnd: 0xf4,
  PrintClear: 0x30,
  SetDensity: 0x31,
  SetLabelType: 0x33,
  SetPageSize: 0x14,
  PrintQuantity: 0x16,
  PrinterCheckLine: 0xd3,
  PrintStatus: 0xb3,
  PrinterStatusData: 0xb5,
  PrinterInfo: 0x48,
  Heartbeat: 0xd9,
  PrintError: 0xdb,
  NotSupported: 0x00,
});

/** Codes d'erreur transportés par la notification 0xDB. */
const PRINT_ERRORS = Object.freeze({
  0x01: 'Capot ouvert',
  0x02: 'Plus de papier',
  0x03: 'Batterie faible',
  0x05: 'Annulé par l\'utilisateur',
  0x06: 'Erreur de données (format de page refusé)',
  0x07: 'Surchauffe',
  0x09: 'Imprimante occupée',
  0x0d: 'Ruban absent',
  0x0f: 'Ruban usagé',
  0x10: 'Papier incorrect',
  0x16: 'Exception de communication',
  0x17: 'Déconnexion',
  0x34: 'Délai de réception dépassé',
});

/** Types d'étiquette acceptés par SetLabelType (0x23). */
const LABEL_TYPES = Object.freeze({
  WithGaps: 1,
  BlackMark: 2,
  Continuous: 3,
  Perforated: 4,
  Transparent: 5,
  PvcTag: 6,
  BlackMarkGap: 10,
  HeatShrinkTube: 11,
});

/**
 * Calcule le checksum d'une trame.
 *
 * @param {number} cmd
 * @param {ArrayLike<number>} data
 * @returns {number}
 */
function checksum(cmd, data) {
  let cks = cmd ^ (data.length & 0xff);
  for (let i = 0; i < data.length; i++) cks ^= data[i];
  return cks & 0xff;
}

/**
 * Construit une trame complète.
 *
 * @param {number} cmd
 * @param {ArrayLike<number>} [data]
 * @param {{ prefix?: boolean }} [options] `prefix: true` ajoute l'octet 0x03
 *   réservé à la commande Connect.
 * @returns {Uint8Array}
 */
function buildPacket(cmd, data = [], options = {}) {
  const payload = Uint8Array.from(data);
  const length = payload.length;
  if (length > 0xff) {
    throw new RangeError(`Charge utile trop longue : ${length} octets (maximum 255)`);
  }

  const prefixLength = options.prefix ? 1 : 0;
  const packet = new Uint8Array(prefixLength + 2 + 1 + 1 + length + 1 + 2);
  let i = 0;

  if (options.prefix) packet[i++] = CONNECT_PREFIX;
  packet[i++] = HEAD[0];
  packet[i++] = HEAD[1];
  packet[i++] = cmd & 0xff;
  packet[i++] = length;
  packet.set(payload, i);
  i += length;
  packet[i++] = checksum(cmd, payload);
  packet[i++] = TAIL[0];
  packet[i] = TAIL[1];

  return packet;
}

/**
 * Construit la trame de connexion (seule trame préfixée).
 * @returns {Uint8Array} `03 55 55 c1 01 01 c1 aa aa`
 */
function buildConnect() {
  return buildPacket(CMD.Connect, [0x01], { prefix: true });
}

/**
 * Encode un entier non signé sur 16 bits, gros-boutiste.
 * @param {number} value
 * @returns {[number, number]}
 */
function u16be(value) {
  const v = Math.max(0, Math.min(0xffff, Math.trunc(value)));
  return [(v >> 8) & 0xff, v & 0xff];
}

/**
 * @typedef {Object} Packet
 * @property {number} cmd
 * @property {Uint8Array} data
 * @property {number} checksum
 * @property {boolean} checksumValid
 */

/**
 * Décodeur incrémental : absorbe des fragments d'octets et restitue les trames
 * complètes qu'il reconnaît.
 *
 * Les octets parasites sont ignorés jusqu'à retrouver un en-tête `55 55` suivi
 * d'une trame cohérente (longueur et pied valides). Un checksum invalide ne
 * fait pas perdre le flux : on repart de l'octet suivant.
 */
class PacketStreamDecoder {
  constructor() {
    /** @type {number[]} */
    this.buffer = [];
    /** Nombre de trames rejetées, exposé pour le diagnostic. */
    this.rejected = 0;
  }

  /** Vide le tampon (à appeler à la reconnexion). */
  reset() {
    this.buffer.length = 0;
  }

  /**
   * Absorbe des octets.
   * @param {ArrayLike<number>} chunk
   * @returns {Packet[]} trames complètes reconnues
   */
  push(chunk) {
    for (let i = 0; i < chunk.length; i++) this.buffer.push(chunk[i]);

    const packets = [];

    for (;;) {
      const start = this.#findHead(0);
      if (start === -1) {
        // Aucun en-tête : on ne conserve que le dernier octet, susceptible
        // d'être le premier 0x55 d'un en-tête coupé entre deux notifications.
        if (this.buffer.length > 1) {
          this.rejected += this.buffer.length - 1;
          this.buffer.splice(0, this.buffer.length - 1);
        }
        break;
      }
      if (start > 0) {
        this.rejected += start;
        this.buffer.splice(0, start);
      }

      const attempt = this.#parseAt(0);

      if (attempt.status === 'ok') {
        packets.push(attempt.packet);
        this.buffer.splice(0, attempt.total);
        continue;
      }

      if (attempt.status === 'invalid') {
        // Trame incohérente : on saute l'en-tête et on cherche le suivant.
        this.rejected++;
        this.buffer.splice(0, 2);
        continue;
      }

      // La trame est incomplète. Avant d'attendre la suite, il faut écarter le
      // cas d'un 0x55 parasite : si une trame complète et valide commence plus
      // loin, c'est que l'en-tête repéré n'en était pas un. Sans ce contrôle,
      // un seul octet 0x55 isolé bloquerait le décodeur indéfiniment.
      const alternative = this.#findNextCompleteFrame(1);
      if (alternative !== -1) {
        this.rejected += alternative;
        this.buffer.splice(0, alternative);
        continue;
      }
      break;
    }

    return packets;
  }

  /**
   * Tente d'analyser la trame qui commence à `index`.
   *
   * @param {number} index
   * @returns {{status: 'ok', packet: Packet, total: number}
   *   | {status: 'incomplete'}
   *   | {status: 'invalid'}}
   */
  #parseAt(index) {
    // En-tête (2) + cmd (1) + len (1)
    if (this.buffer.length < index + 4) return { status: 'incomplete' };

    const len = this.buffer[index + 3];
    const total = 4 + len + 1 + 2;
    if (this.buffer.length < index + total) return { status: 'incomplete' };

    const cmd = this.buffer[index + 2];
    const data = Uint8Array.from(this.buffer.slice(index + 4, index + 4 + len));
    const cks = this.buffer[index + 4 + len];
    const tailOk =
      this.buffer[index + 5 + len] === TAIL[0] && this.buffer[index + 6 + len] === TAIL[1];

    if (cks !== checksum(cmd, data) || !tailOk) return { status: 'invalid' };
    return { status: 'ok', packet: { cmd, data, checksum: cks, checksumValid: true }, total };
  }

  /**
   * Cherche, à partir de `from`, l'index d'une trame complète ET valide.
   * Une trame incomplète ne compte pas : on ne peut pas encore la confirmer.
   *
   * @param {number} from
   * @returns {number} index, ou -1
   */
  #findNextCompleteFrame(from) {
    for (let i = from; i + 1 < this.buffer.length; i++) {
      if (this.buffer[i] !== HEAD[0] || this.buffer[i + 1] !== HEAD[1]) continue;
      if (this.#parseAt(i).status === 'ok') return i;
    }
    return -1;
  }

  /**
   * Cherche la prochaine occurrence de `55 55`.
   * @param {number} from
   * @returns {number} index, ou -1
   */
  #findHead(from) {
    for (let i = from; i + 1 < this.buffer.length; i++) {
      if (this.buffer[i] === HEAD[0] && this.buffer[i + 1] === HEAD[1]) return i;
    }
    return -1;
  }
}

// ---------------------------------------------------------------------------
// Constructeurs de trames de haut niveau
// ---------------------------------------------------------------------------

/** @param {number} density @returns {Uint8Array} */
const setDensity = (density) => buildPacket(CMD.SetDensity, [density & 0xff]);

/** @param {number} type @returns {Uint8Array} */
const setLabelType = (type) => buildPacket(CMD.SetLabelType, [type & 0xff]);

/**
 * PrintStart. Le D110 attend **un seul octet** ; les modèles B1/M2 en attendent
 * sept, et les firmwares v4 neuf. Ne pas confondre : le D110 refuse un format
 * trop long avec une erreur DataError (0xDB 06).
 *
 * @param {'D110'|'B1'|'V4'} variant
 * @param {{ pages?: number, pageColor?: number, speed?: number }} [options]
 * @returns {Uint8Array}
 */
function printStart(variant, options = {}) {
  const pages = options.pages ?? 1;
  const pageColor = options.pageColor ?? 0;

  if (variant === 'B1') {
    const [hi, lo] = u16be(pages);
    return buildPacket(CMD.PrintStart, [hi, lo, 0, 0, 0, 0, pageColor]);
  }
  if (variant === 'V4') {
    const [hi, lo] = u16be(pages);
    const speed = options.speed ?? 1;
    return buildPacket(CMD.PrintStart, [hi, lo, 0, 0, 0, 0, pageColor, speed, 0]);
  }
  return buildPacket(CMD.PrintStart, [0x01]);
}

/** @returns {Uint8Array} */
const printClear = () => buildPacket(CMD.PrintClear, [0x01]);

/** @returns {Uint8Array} */
const pageStart = () => buildPacket(CMD.PageStart, [0x01]);

/** @returns {Uint8Array} */
const pageEnd = () => buildPacket(CMD.PageEnd, [0x01]);

/** @returns {Uint8Array} */
const printEnd = () => buildPacket(CMD.PrintEnd, [0x01]);

/** @returns {Uint8Array} */
const printStatus = () => buildPacket(CMD.PrintStatus, [0x01]);

/** @returns {Uint8Array} */
const printerStatusData = () => buildPacket(CMD.PrinterStatusData, [0x01]);

/** @returns {Uint8Array} */
const printerInfo = (sub = 0x08) => buildPacket(CMD.PrinterInfo, [sub]);

/** @returns {Uint8Array} */
const heartbeat = () => buildPacket(CMD.Heartbeat, [0x04]);

/**
 * SetPageSize.
 *
 * `cols` est la largeur de la **tête**, pas celle de l'étiquette : 96 pour un
 * D110 (12 mm), même avec une étiquette de 15 mm. L'imprimante rogne au-delà
 * sans renvoyer d'erreur.
 *
 * @param {'D110'|'B1'|'V4'} variant
 * @param {{ rows: number, cols: number, copies?: number }} options
 * @returns {Uint8Array}
 */
function setPageSize(variant, options) {
  const [rowsHi, rowsLo] = u16be(options.rows);
  const [colsHi, colsLo] = u16be(options.cols);

  if (variant === 'B1') {
    const [copiesHi, copiesLo] = u16be(options.copies ?? 1);
    return buildPacket(CMD.SetPageSize, [rowsHi, rowsLo, colsHi, colsLo, copiesHi, copiesLo]);
  }
  if (variant === 'V4') {
    const [copiesHi, copiesLo] = u16be(options.copies ?? 1);
    return buildPacket(CMD.SetPageSize, [
      rowsHi, rowsLo, colsHi, colsLo, copiesHi, copiesLo,
      0, 0, 0, 0, 0, 0, 0,
    ]);
  }
  return buildPacket(CMD.SetPageSize, [rowsHi, rowsLo, colsHi, colsLo]);
}

/** @param {number} quantity @returns {Uint8Array} */
const printQuantity = (quantity) => {
  const [hi, lo] = u16be(quantity);
  return buildPacket(CMD.PrintQuantity, [hi, lo]);
};

/**
 * Trame de ligne bitmap.
 *
 * @param {number} row Numéro de ligne (u16 BE).
 * @param {Uint8Array} bitmap `stride = ceil(cols/8)` octets, MSB d'abord, 1 = noir.
 * @param {{ run?: number, counts?: [number,number,number] }} [options]
 *   `run` est le nombre de répétitions de cette ligne (1 = une seule ligne).
 *   `counts` est le triplet de comptage de pixels noirs ; la valeur `00 00 00`
 *   est acceptée par tous les modèles connus et c'est ce qu'on envoie par défaut.
 * @returns {Uint8Array}
 */
function printBitmapRow(row, bitmap, options = {}) {
  const [rowHi, rowLo] = u16be(row);
  const counts = options.counts ?? [0, 0, 0];
  const run = Math.max(1, Math.min(255, options.run ?? 1));

  const data = new Uint8Array(2 + 3 + 1 + bitmap.length);
  data[0] = rowHi;
  data[1] = rowLo;
  data[2] = counts[0] & 0xff;
  data[3] = counts[1] & 0xff;
  data[4] = counts[2] & 0xff;
  data[5] = run;
  data.set(bitmap, 6);

  return buildPacket(CMD.PrintBitmapRow, data);
}

/**
 * Trame de ligne vide — n'embarque aucun octet de pixels, ce qui allège
 * fortement les marges blanches d'une étiquette.
 *
 * @param {number} row
 * @param {number} [run]
 * @returns {Uint8Array}
 */
function printEmptyRow(row, run = 1) {
  const [rowHi, rowLo] = u16be(row);
  return buildPacket(CMD.PrintEmptyRow, [rowHi, rowLo, Math.max(1, Math.min(255, run))]);
}

/**
 * Interprète une notification de statut d'impression (0xB3).
 *
 * On parse par longueur et non par offset fixe : la taille du payload varie
 * selon les modèles (10 octets sur M2-H, 11 sur B1 Pro).
 *
 * @param {Uint8Array} data
 * @returns {{ page: number, printProgress: number, feedProgress: number, error: number }}
 */
function parsePrintStatus(data) {
  const page = data.length >= 2 ? (data[0] << 8) | data[1] : 0;
  return {
    page,
    printProgress: data.length >= 3 ? data[2] : 0,
    feedProgress: data.length >= 4 ? data[3] : 0,
    // Le champ d'erreur n'est présent que sur les payloads de 10 octets.
    error: data.length >= 10 ? data[9] : 0,
  };
}

/**
 * Interprète la réponse d'identité (0x48), qui porte le modelId.
 *
 * Certains firmwares renvoient un octet unique, d'autres deux. Un octet seul
 * vaut `octet << 8` (convention niimbluelib).
 *
 * @param {Uint8Array} data
 * @returns {{ modelId: number }}
 */
function parsePrinterInfo(data) {
  if (data.length >= 2) return { modelId: (data[0] << 8) | data[1] };
  if (data.length === 1) return { modelId: data[0] << 8 };
  return { modelId: 0 };
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/printer/transport.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Transport Bluetooth LE vers une imprimante Niimbot.
 *
 * Ce module ne connaît pas le protocole : il achemine des octets. Trois points
 * sont critiques et résultent de mesures de la communauté sur matériel réel.
 *
 * 1. **Le filtrage par `services` ne trouve rien.** Les imprimantes Niimbot
 *    n'annoncent pas leur UUID de service dans leur paquet d'advertising ; il
 *    n'est visible qu'après connexion GATT. Un `filters: [{ services: [...] }]`
 *    ouvre donc un sélecteur vide. On filtre par préfixe de nom et on déclare
 *    le service en `optionalServices`.
 *
 * 2. **L'écriture en rafale produit des étiquettes blanches ou tronquées.**
 *    La caractéristique n'expose que l'écriture sans réponse, qui n'est ni
 *    ordonnée ni fiable : le tampon de la pile Bluetooth déborde en silence.
 *    Le bon levier n'est pas de ralentir, mais d'écrire moins souvent — le
 *    protocole est un flux de trames, plusieurs trames peuvent tenir dans une
 *    seule écriture. D'où le groupage, avec un intervalle minimal de sécurité.
 *
 * 3. **Les notifications arrivent en flux d'octets**, pas en trames : plusieurs
 *    trames peuvent être collées, et une trame peut être coupée en deux. Le
 *    `PacketStreamDecoder` s'en charge, mais il faut le brancher correctement.
 */




/** Service exposé par la quasi-totalité des imprimantes Niimbot. */
const SERVICE_UUID = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';

/**
 * Caractéristique principale. Elle porte à la fois les notifications et les
 * écritures sans réponse. Le code ne s'y fie pas aveuglément : si elle est
 * absente, on découvre la bonne par ses propriétés.
 */
const CHARACTERISTIC_UUID = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';

/**
 * Taille maximale d'un groupe d'écriture.
 *
 * La spec Web Bluetooth n'expose aucune API de MTU (la proposition `getMTU()`
 * n'est pas livrée). Des groupes de 240 octets ont été validés sur B1 et M2-H,
 * ce qui suppose un MTU ≥ 247. On reste en dessous et on rend la valeur
 * réglable, car rien ne garantit le même MTU sur un D110.
 */
const DEFAULT_MAX_BUNDLE_BYTES = 240;

/**
 * Intervalle minimal entre deux écritures. Sur macOS et iOS, le Bluetooth
 * passe par CoreBluetooth, dont le tampon sature plus vite : la rafale y est
 * systématiquement perdante.
 */
const DEFAULT_PACE_MS = 10;

/**
 * @typedef {Object} BluetoothLike
 * @property {(options: object) => Promise<any>} requestDevice
 * @property {() => Promise<boolean>} [getAvailability]
 */

/**
 * Marche à suivre quand Brave bloque Web Bluetooth.
 *
 * Le nom du drapeau est celui des sources de Brave
 * (`browser/about_flags.cc`), et il faut **relancer** le navigateur : le
 * drapeau n'est lu qu'au démarrage. C'est la cause la plus fréquente, et de
 * loin — l'API existe, donc rien ne signale le problème avant le clic.
 */
const BRAVE_BLUETOOTH_HINT =
  'Brave désactive Web Bluetooth par défaut. Ouvrez brave://flags/#brave-web-bluetooth-api, '
  + 'mettez « Web Bluetooth API » sur Enabled, puis relancez Brave. '
  + 'Chrome et Edge fonctionnent sans réglage.';

/**
 * Vérifie que Web Bluetooth est utilisable et explique pourquoi sinon.
 *
 * `navigator.bluetooth` peut exister **et** être inutilisable : Brave expose
 * l'objet mais refuse toute utilisation quand son drapeau est éteint, et
 * `requestDevice` échoue alors sur « Web Bluetooth API globally disabled » —
 * en anglais, après le clic. `getAvailability()` répond `false` dans ce cas sans
 * rien demander à l'utilisateur : c'est ce qui permet de prévenir avant.
 *
 * @param {{
 *   bluetooth?: BluetoothLike,
 *   isSecureContext?: boolean,
 *   available?: boolean,
 * }} [env]
 * @returns {{ ok: boolean, reason?: string, hint?: string }}
 */
function checkWebBluetoothSupport(env = {}) {
  const bluetooth = env.bluetooth ?? globalThis.navigator?.bluetooth;
  const secure = env.isSecureContext ?? globalThis.isSecureContext;

  if (!bluetooth) {
    return {
      ok: false,
      reason: 'Web Bluetooth n\'est pas disponible dans ce navigateur.',
      hint: `Safari (macOS et iOS) ne l'implémente pas. ${BRAVE_BLUETOOTH_HINT}`,
    };
  }
  if (secure === false) {
    return {
      ok: false,
      reason: 'Web Bluetooth exige un contexte sécurisé (HTTPS ou localhost).',
      hint: 'Ouvrez l\'application via https:// ou http://localhost.',
    };
  }
  // `available === false` : le navigateur a répondu que non.
  if (env.available === false) {
    return {
      ok: false,
      reason:
        'Web Bluetooth est désactivé dans ce navigateur — ou le Bluetooth de ' +
        'cet ordinateur est éteint.',
      hint: BRAVE_BLUETOOTH_HINT,
    };
  }
  return { ok: true };
}

/**
 * Interroge le navigateur sur la disponibilité réelle de Web Bluetooth.
 *
 * Ne lève jamais : un navigateur qui refuse de répondre est traité comme un
 * navigateur qui dit non.
 *
 * @param {{ bluetooth?: BluetoothLike }} [env]
 * @returns {Promise<{ ok: boolean, reason?: string, hint?: string }>}
 */
async function probeWebBluetooth(env = {}) {
  const bluetooth = env.bluetooth ?? globalThis.navigator?.bluetooth;
  const basic = checkWebBluetoothSupport(env);
  if (!basic.ok) return basic;

  if (typeof bluetooth.getAvailability !== 'function') return basic;

  try {
    const available = await bluetooth.getAvailability();
    return checkWebBluetoothSupport({ ...env, available: Boolean(available) });
  } catch {
    return checkWebBluetoothSupport({ ...env, available: false });
  }
}

/**
 * Traduit l'échec d'une demande d'appareil en message exploitable.
 *
 * Le navigateur répond en anglais, et « NotFoundError : Web Bluetooth API
 * globally disabled » ne dit pas quoi faire. On reconnaît les cas connus pour
 * renvoyer la marche à suivre.
 *
 * @param {unknown} error
 * @returns {string}
 */
function explainBluetoothFailure(error) {
  const message = String(error?.message ?? error ?? '');
  if (/globally disabled/i.test(message)) {
    return `Web Bluetooth est désactivé dans ce navigateur. ${BRAVE_BLUETOOTH_HINT}`;
  }
  if (/user denied|user cancel|chooser/i.test(message) || error?.name === 'NotFoundError') {
    return 'Aucun appareil choisi. Réveillez l\'imprimante, puis relancez la connexion.';
  }
  if (/permission|not allowed|SecurityError/i.test(message)) {
    return 'Le navigateur a refusé l\'accès au Bluetooth : autorisez-le pour cette page, puis réessayez.';
  }
  return `Connexion impossible : ${message}`;
}

/**
 * Ouvre le sélecteur d'appareils et renvoie l'imprimante choisie.
 *
 * @param {{
 *   bluetooth?: BluetoothLike,
 *   namePrefixes?: string[],
 *   serviceUuid?: string,
 * }} [options]
 * @returns {Promise<any>} le BluetoothDevice retenu
 */
async function requestPrinter(options = {}) {
  const bluetooth = options.bluetooth ?? globalThis.navigator?.bluetooth;
  if (!bluetooth) {
    throw new Error(checkWebBluetoothSupport({ bluetooth }).reason);
  }

  const namePrefixes = options.namePrefixes ?? ALL_NAME_PREFIXES;
  const serviceUuid = options.serviceUuid ?? SERVICE_UUID;

  return bluetooth.requestDevice({
    // Filtrage par nom : le service n'est pas annoncé, un filtre par service
    // ne remonterait aucun appareil.
    filters: namePrefixes.map((namePrefix) => ({ namePrefix })),
    optionalServices: [serviceUuid],
    // Repli : si le firmware annonce un nom inattendu, l'utilisateur peut
    // toujours choisir l'appareil dans la liste complète.
    acceptAllDevices: false,
  });
}

/**
 * Sélectionne la caractéristique d'échange.
 *
 * On tente l'UUID documenté, puis on retombe sur une découverte par
 * propriétés : c'est ce que font niimbluelib, NiimPrintX et LibreNiim, et cela
 * couvre les variantes de firmware.
 *
 * @param {any} server
 * @param {string} serviceUuid
 * @returns {Promise<{ service: any, characteristic: any, discovered: boolean }>}
 */
async function resolveCharacteristic(server, serviceUuid) {
  const service = await server.getPrimaryService(serviceUuid);

  try {
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
    return { service, characteristic, discovered: false };
  } catch {
    // L'UUID connu n'existe pas sur ce firmware : on cherche par propriétés.
  }

  const characteristics = await service.getCharacteristics();
  const match = characteristics.find(
    (c) => c.properties?.notify && c.properties?.writeWithoutResponse,
  );
  if (match) return { service, characteristic: match, discovered: true };

  // Dernier recours : une caractéristique qui écrit, même avec réponse.
  const writable = characteristics.find(
    (c) => c.properties?.writeWithoutResponse || c.properties?.write,
  );
  if (writable) return { service, characteristic: writable, discovered: true };

  throw new Error(
    'Aucune caractéristique utilisable trouvée sur le service Niimbot. ' +
    'L\'appareil choisi n\'est probablement pas une imprimante compatible.',
  );
}

/**
 * Transport vers une imprimante connectée.
 *
 * Émet des trames complètes, les groupe en écritures, et redistribue les
 * notifications décodées. Ne gère ni le protocole ni la séquence d'impression.
 */
class NiimbotTransport {
  /**
   * @param {any} device BluetoothDevice déjà autorisé
   * @param {{
   *   serviceUuid?: string,
   *   characteristicUuid?: string,
   *   maxBundleBytes?: number,
   *   paceMs?: number,
   *   heartbeatMs?: number,
   * }} [options]
   */
  constructor(device, options = {}) {
    this.device = device;
    this.serviceUuid = options.serviceUuid ?? SERVICE_UUID;
    this.maxBundleBytes = options.maxBundleBytes ?? DEFAULT_MAX_BUNDLE_BYTES;
    this.paceMs = options.paceMs ?? DEFAULT_PACE_MS;
    this.heartbeatMs = options.heartbeatMs ?? 0;

    this.characteristic = null;
    this.decoder = new PacketStreamDecoder();
    /** @type {Array<(packet: any) => void>} */
    this.listeners = [];
    /** @type {Array<{ cmd: number, resolve: Function, reject: Function, timer: any }>} */
    this.waiters = [];
    this.connected = false;

    /** Tampon d'écriture en cours de constitution. */
    this.pending = [];
    this.pendingBytes = 0;
    this.lastWriteAt = 0;

    this.notificationHandler = (event) => this.#onNotification(event);
    this.disconnectHandler = () => this.#onDisconnected();
    this.heartbeatTimer = null;
  }

  /**
   * Se connecte au serveur GATT et prépare les notifications.
   * @returns {Promise<{ discoveredCharacteristic: boolean }>}
   */
  async connect() {
    if (this.connected) return { discoveredCharacteristic: false };

    const server = await this.device.gatt.connect();
    const { characteristic, discovered } = await resolveCharacteristic(server, this.serviceUuid);
    this.characteristic = characteristic;

    this.device.addEventListener('gattserverdisconnected', this.disconnectHandler);

    // Les notifications doivent être actives avant tout envoi, sinon aucune
    // réponse n'arrive et les attentes expirent.
    if (characteristic.properties?.notify) {
      characteristic.addEventListener('characteristicvaluechanged', this.notificationHandler);
      await characteristic.startNotifications();
    }

    this.connected = true;

    if (this.heartbeatMs > 0) {
      this.heartbeatTimer = setInterval(() => {
        this.write(this.heartbeatBuilder?.() ?? new Uint8Array(0)).catch(() => {});
      }, this.heartbeatMs);
    }

    return { discoveredCharacteristic: discovered };
  }

  /** Indique si le lien est actif. */
  get isConnected() {
    return this.connected && Boolean(this.device?.gatt?.connected);
  }

  /**
   * Enregistre un observateur de trames reçues.
   * @param {(packet: any) => void} listener
   * @returns {() => void} fonction de désinscription
   */
  onPacket(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Écrit une trame, en la groupant avec les suivantes tant que la limite
   * d'octets n'est pas atteinte.
   *
   * @param {Uint8Array} frame
   */
  async write(frame) {
    if (!this.characteristic) throw new Error('Transport non connecté');
    if (frame.length === 0) return;

    // Une trame plus grosse que la limite partirait en une écriture refusée :
    // on la fractionne, au prix d'une trame potentiellement coupée.
    if (frame.length > this.maxBundleBytes) {
      await this.flush();
      for (let i = 0; i < frame.length; i += this.maxBundleBytes) {
        await this.#writeChunk(frame.slice(i, i + this.maxBundleBytes));
      }
      return;
    }

    if (this.pendingBytes + frame.length > this.maxBundleBytes) await this.flush();

    this.pending.push(frame);
    this.pendingBytes += frame.length;
  }

  /** Vide le groupe courant vers la caractéristique. */
  async flush() {
    if (this.pending.length === 0) return;

    const total = this.pendingBytes;
    const bundle = new Uint8Array(total);
    let offset = 0;
    for (const frame of this.pending) {
      bundle.set(frame, offset);
      offset += frame.length;
    }
    this.pending = [];
    this.pendingBytes = 0;

    await this.#writeChunk(bundle);
  }

  /**
   * Écriture effective, avec l'intervalle minimal entre deux envois.
   * @param {Uint8Array} bytes
   */
  async #writeChunk(bytes) {
    const silence = this.paceMs - (Date.now() - this.lastWriteAt);
    if (silence > 0) await new Promise((resolve) => setTimeout(resolve, silence));

    // L'écriture sans réponse est la seule disponible pour la performance ;
    // elle n'est ni ordonnée ni fiable, d'où le rythme imposé ci-dessus.
    if (this.characteristic.properties?.writeWithoutResponse) {
      await this.characteristic.writeValueWithoutResponse(bytes);
    } else {
      await this.characteristic.writeValue(bytes);
    }
    this.lastWriteAt = Date.now();
  }

  /**
   * Attend une trame de réponse précise.
   *
   * @param {number} cmd Code attendu (réponse, pas commande).
   * @param {{ timeoutMs?: number, match?: (packet: any) => boolean }} [options]
   * @returns {Promise<any>}
   */
  expect(cmd, options = {}) {
    const timeoutMs = options.timeoutMs ?? 1000;
    return new Promise((resolve, reject) => {
      const waiter = {
        cmd,
        match: options.match,
        resolve: (packet) => {
          clearTimeout(waiter.timer);
          resolve(packet);
        },
        reject: (error) => {
          clearTimeout(waiter.timer);
          reject(error);
        },
        timer: setTimeout(() => {
          const index = this.waiters.indexOf(waiter);
          if (index !== -1) this.waiters.splice(index, 1);
          reject(
            new Error(
              `Aucune réponse 0x${cmd.toString(16)} de l'imprimante après ${timeoutMs} ms. ` +
              'Vérifiez que l\'appareil est allumé et à portée.',
            ),
          );
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  /** Coupe la liaison et libère les ressources. */
  async disconnect() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(new Error('Connexion fermée'));
    }
    this.decoder.reset();
    this.pending = [];
    this.pendingBytes = 0;

    try {
      this.device?.removeEventListener?.('gattserverdisconnected', this.disconnectHandler);
      if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    } finally {
      this.connected = false;
      this.characteristic = null;
    }
  }

  /**
   * Répartit les octets reçus vers le décodeur puis vers les observateurs.
   * @param {any} event
   */
  #onNotification(event) {
    const value = event.target.value;
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);

    let packets;
    try {
      packets = this.decoder.push(bytes);
    } catch {
      return;
    }

    for (const packet of packets) {
      for (const listener of [...this.listeners]) {
        try {
          listener(packet);
        } catch {
          // Un observateur fautif ne doit pas interrompre la lecture du flux.
        }
      }
      this.#settleWaiters(packet);
    }
  }

  /**
   * Réveille les attentes satisfaites par une trame.
   * @param {any} packet
   */
  #settleWaiters(packet) {
    for (const waiter of [...this.waiters]) {
      if (packet.cmd !== waiter.cmd) continue;
      if (waiter.match && !waiter.match(packet)) continue;
      const index = this.waiters.indexOf(waiter);
      if (index !== -1) this.waiters.splice(index, 1);
      waiter.resolve(packet);
    }
  }

  /** L'imprimante s'éteint en veille : la coupure doit être signalée, pas subie. */
  #onDisconnected() {
    this.connected = false;
    this.characteristic = null;
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(new Error('Imprimante déconnectée'));
    }
  }
}

/**
 * Ouvre le sélecteur puis établit la connexion en une seule étape.
 *
 * @param {{ namePrefixes?: string[], transportOptions?: object, bluetooth?: BluetoothLike }} [options]
 * @returns {Promise<NiimbotTransport>}
 */
async function connectToPrinter(options = {}) {
  const device = await requestPrinter(options);
  const transport = new NiimbotTransport(device, options.transportOptions);
  await transport.connect();
  return transport;
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/core/printer/printer.js
// ────────────────────────────────────────────────────────────────────────

/**
 * Session d'impression Niimbot (D110 en priorité).
 *
 * Enchaîne le dialogue documenté, en vérifiant chaque acquittement. Le principe
 * directeur : ne jamais supposer qu'une commande a été acceptée. L'imprimante
 * rogne ou ignore en silence ; seule la lecture des réponses révèle l'échec.
 *
 * Deux pièges structurels sont explicitement gérés :
 *
 * - Le D110 refuse un `SetPageSize` au format des firmwares v4 (13 octets) en
 *   répondant une erreur DataError (0xDB 06) **au lieu d'imprimer**. On ne
 *   route donc jamais un D110 vers le task « V4 ».
 * - L'imprimante rogne les colonnes au-delà de la largeur de tête (96 px pour
 *   un D110) sans renvoyer d'erreur. C'est à l'appelant de fournir une image à
 *   la bonne largeur ; `prepareRows` le vérifie et le signale.
 */




/** Délai de réponse par défaut pour une commande de réglage. */
const DEFAULT_ACK_TIMEOUT_MS = 3000;

/** Délai d'attente de la fin d'impression : la tête chauffe, c'est lent. */
const DEFAULT_PRINT_TIMEOUT_MS = 60000;

/** Intervalle entre deux interrogations de statut. */
const POLL_INTERVAL_MS = 300;

/** Répétition maximale d'une ligne dans une trame, valeur pratique constatée. */
const MAX_ROW_RUN = 200;

/**
 * @typedef {Object} MonoBitmap
 * @property {number} width   Largeur en pixels, multiple de 8.
 * @property {number} height  Hauteur en pixels.
 * @property {Uint8Array[]} rows Une entrée par ligne de pixels.
 */

/**
 * Compacte les lignes identiques consécutives en trames à répétition.
 *
 * Une ligne entièrement blanche devient une trame « ligne vide » (0x84), qui
 * ne transporte aucun octet de pixels : c'est ce qui allège les marges et
 * divise le trafic Bluetooth par trois à cinq sur une étiquette réelle.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ maxRun?: number }} [options]
 * @returns {Array<{ row: number, run: number, bytes: Uint8Array|null }>}
 */
function prepareRows(bitmap, options = {}) {
  const maxRun = Math.max(1, Math.min(255, options.maxRun ?? MAX_ROW_RUN));
  const { rows } = bitmap;
  const frames = [];

  const isBlank = (bytes) => {
    for (let i = 0; i < bytes.length; i++) if (bytes[i] !== 0) return false;
    return true;
  };
  const same = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  let index = 0;
  while (index < rows.length) {
    let run = 1;
    while (
      run < maxRun &&
      index + run < rows.length &&
      same(rows[index], rows[index + run])
    ) {
      run++;
    }
    frames.push({
      row: index,
      run,
      bytes: isBlank(rows[index]) ? null : rows[index],
    });
    index += run;
  }

  return frames;
}

/**
 * Construit les trames binaires correspondant à une image.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ maxRun?: number }} [options]
 * @returns {Uint8Array[]}
 */
function bitmapFrames(bitmap, options = {}) {
  return prepareRows(bitmap, options).map((entry) =>
    entry.bytes ? printBitmapRow(entry.row, entry.bytes, { run: entry.run })
      : printEmptyRow(entry.row, entry.run),
  );
}

/**
 * Session d'impression pilotant un transport déjà connecté.
 */
class NiimbotPrinter {
  /**
   * @param {import('./transport.js').NiimbotTransport} transport
   * @param {{ profile?: object, ackTimeoutMs?: number, printTimeoutMs?: number }} [options]
   */
  constructor(transport, options = {}) {
    this.transport = transport;
    this.ackTimeoutMs = options.ackTimeoutMs ?? DEFAULT_ACK_TIMEOUT_MS;
    this.printTimeoutMs = options.printTimeoutMs ?? DEFAULT_PRINT_TIMEOUT_MS;

    /** Profil deviné depuis le nom BLE, remplacé après lecture du modelId. */
    this.profile = options.profile ?? null;
    this.deviceName = transport.device?.name ?? '';

    /** @type {{ modelId: number|null, protocolVersion: number|null, error: number|null }} */
    this.info = { modelId: null, protocolVersion: null, error: null };

    this.offPacket = null;
  }

  /**
   * Établit la session : connexion, lecture de l'identité, choix du profil.
   *
   * @returns {Promise<{ profile: object, modelId: number|null, reportedHeadPixels: number|null }>}
   */
  async start() {
    // Horodatage des erreurs : l'imprimante peut signaler un refus à tout moment.
    this.offPacket = this.transport.onPacket((packet) => {
      if (packet.cmd === CMD_IN.PrintError) {
        this.info.error = packet.data[0] ?? null;
      }
    });

    await this.ack(buildConnect(), CMD_IN.Connect);

    // PrinterStatusData porte la version de protocole ; PrinterInfo, le modèle.
    const status = await this.ack(printerStatusData(), CMD_IN.PrinterStatusData);
    this.info.protocolVersion = status.data[0] ?? null;

    let modelId = null;
    try {
      const info = await this.ack(printerInfo(0x08), CMD_IN.PrinterInfo);
      modelId = parsePrinterInfo(info.data).modelId;
      this.info.modelId = modelId;
    } catch {
      // Certains firmwares ne répondent pas à cette interrogation : ce n'est
      // pas bloquant, on retombe sur le nom annoncé.
    }

    let profile =
      (modelId !== null ? findByModelId(modelId) : undefined) ??
      this.profile ??
      findByName(this.deviceName) ??
      DEFAULT_PROFILE;

    const head = await this.#readHeadWidth();
    if (head !== null) profile = withReportedHead(profile, head);

    this.profile = profile;
    return { profile, modelId, reportedHeadPixels: head };
  }

  /**
   * Imprime une image.
   *
   * @param {MonoBitmap} bitmap Largeur = largeur de tête, multiple de 8.
   * @param {{
   *   density?: number,
   *   copies?: number,
   *   labelType?: number,
   *   onProgress?: (progress: { page: number, copies: number }) => void,
   * }} [options]
   * @returns {Promise<{ pages: number, rows: number, frames: number }>}
   */
  async print(bitmap, options = {}) {
    const profile = this.profile ?? DEFAULT_PROFILE;
    const copies = Math.max(1, Math.trunc(options.copies ?? 1));
    const density = Math.max(
      profile.density.min,
      Math.min(profile.density.max, Math.trunc(options.density ?? profile.density.default)),
    );
    const labelType = options.labelType ?? LABEL_TYPES.WithGaps;

    if (bitmap.width > profile.printheadPixels) {
      throw new RangeError(
        `Image de ${bitmap.width} px alors que la tête du ${profile.id} fait ` +
        `${profile.printheadPixels} px : l'imprimante rognerait ${bitmap.width - profile.printheadPixels} px ` +
        'sans le signaler.',
      );
    }
    if (bitmap.height > profile.maxPrintHeightMm * (profile.dpi / 25.4)) {
      throw new RangeError(
        `Image de ${bitmap.height} px, au-delà de la hauteur maximale du ${profile.id}.`,
      );
    }

    const task = profile.printTask;

    await this.ack(setDensity(density), CMD_IN.SetDensity);
    await this.ack(setLabelType(labelType), CMD_IN.SetLabelType);

    // Le D110 n'accepte qu'un seul octet ici et ne peut donc pas déclarer de
    // job multi-pages ; les autres modèles reçoivent la variante adaptée.
    await this.ack(printStart(task, { pages: copies }), CMD_IN.PrintStart);

    if (task === 'D110') {
      await this.ack(printClear(), CMD_IN.PrintClear);
    }

    await this.ack(pageStart(), CMD_IN.PageStart);
    await this.ack(
      setPageSize(task, {
        rows: bitmap.height,
        cols: profile.printheadPixels,
        copies,
      }),
      CMD_IN.SetPageSize,
    );
    await this.ack(printQuantity(copies), CMD_IN.PrintQuantity);

    const frames = bitmapFrames(bitmap);
    for (const frame of frames) {
      await this.transport.write(frame);
    }
    await this.transport.flush();

    await this.ack(pageEnd(), CMD_IN.PageEnd, { timeoutMs: this.printTimeoutMs });
    await this.#waitForCompletion(copies, options.onProgress);
    await this.ack(printEnd(), CMD_IN.PrintEnd, { timeoutMs: this.printTimeoutMs });

    if (this.info.error !== null) {
      const label = PRINT_ERRORS[this.info.error] ?? `code 0x${this.info.error.toString(16)}`;
      throw new Error(`L'imprimante a signalé une erreur : ${label}`);
    }

    return { pages: copies, rows: bitmap.height, frames: frames.length };
  }

  /** Libère les observateurs. */
  dispose() {
    this.offPacket?.();
    this.offPacket = null;
  }

  /**
   * Envoie une trame et attend son acquittement.
   *
   * @param {Uint8Array} frame
   * @param {number} expectedCmd
   * @param {{ timeoutMs?: number }} [options]
   * @returns {Promise<any>}
   */
  async ack(frame, expectedCmd, options = {}) {
    const waiting = this.transport.expect(expectedCmd, {
      timeoutMs: options.timeoutMs ?? this.ackTimeoutMs,
    });
    // L'attente est armée avant l'envoi : une réponse très rapide ne doit pas
    // être manquée.
    await this.transport.write(frame);
    await this.transport.flush();
    return waiting;
  }

  /**
   * Interroge le statut jusqu'à ce que le nombre de pages imprimées soit atteint.
   * @param {number} copies
   * @param {(progress: { page: number, copies: number }) => void} [onProgress]
   */
  async #waitForCompletion(copies, onProgress) {
    const deadline = Date.now() + this.printTimeoutMs;

    while (Date.now() < deadline) {
      const response = await this.ack(printStatus(), CMD_IN.PrintStatus, {
        timeoutMs: this.ackTimeoutMs,
      });
      const status = parsePrintStatus(response.data);
      onProgress?.({ page: status.page, copies });

      if (status.page >= copies) return;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(
      `L'impression n'a pas confirmé son achèvement après ${this.printTimeoutMs} ms. ` +
      'L\'étiquette est peut-être incomplète.',
    );
  }

  /**
   * Tente de lire la largeur de tête réellement rapportée par l'imprimante.
   *
   * La sonde est `Heartbeat 0xDC [03]`, à laquelle l'imprimante répond `0xDE`
   * avec la largeur sur les octets 4-5. C'est la mesure la plus fiable — elle
   * vient du matériel — mais elle n'a été observée que sur M2_H, et beaucoup de
   * firmwares ne répondent simplement pas. Le délai est donc court et l'échec
   * silencieux, pour ne pas ralentir la connexion d'un D110 qui l'ignore.
   *
   * La largeur rapportée est celle de la **tête**, pas de l'étiquette.
   *
   * @returns {Promise<number|null>}
   */
  async #readHeadWidth() {
    /** Réponse à la sonde de largeur de tête. Absent de CMD_IN car propre à ce dialogue. */
    const CMD_IN_HEARTBEAT_INFO = 0xde;
    try {
      const frame = buildPacket(CMD.Heartbeat, [0x03]);
      const response = await this.ack(frame, CMD_IN_HEARTBEAT_INFO, { timeoutMs: 600 });
      if (response.data.length >= 6) {
        const width = (response.data[4] << 8) | response.data[5];
        if (width > 0) return width;
      }
    } catch {
      // Firmware qui ignore la sonde : ce n'est pas une erreur.
    }
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────
// /Users/gael/Documents/GitHub/URLQRCodePrinter/dist/extension-safari/app.js
// ────────────────────────────────────────────────────────────────────────

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
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

  el.printAllLabels.textContent = total === 0
    ? 'Aucun lien à imprimer'
    : `Imprimer ${pluriel(total, 'étiquette')}`
      + (copies > 1 ? ` (${pluriel(count, 'lien')} × ${copies})` : '');

  // La phrase dit ce qui est retenu, et pourquoi le bouton est inerte le cas
  // échéant : « Portée » seul ne disait pas ce qui allait sortir.
  el.printAllLabels.title = '';

  if (links.length === 0) {
    el.printScopeHint.textContent = 'Aucun lien dans la collection.';
    return;
  }
  if (scope === 'selected' && checked === 0) {
    el.printScopeHint.textContent =
      'Aucun lien coché : cochez les liens à imprimer dans la liste, '
      + 'ou choisissez « Toute la collection ».';
    return;
  }
  const source = scope === 'selected'
    ? `${pluriel(checked, 'lien coché')}`
    : `les ${links.length} liens de la collection`;
  el.printScopeHint.textContent = copies > 1
    ? `${source}, ${pluriel(copies, 'exemplaire')} de chacun.`
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
      { key: 'title', label: 'Titre', value: link.title, placeholder: 'Titre de la page' },
      { key: 'tags', label: 'Tags', value: link.tags.join(', '), placeholder: 'veille, travail' },
      { key: 'note', label: 'Note', value: link.note, placeholder: 'Note libre' },
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
      input.setAttribute('aria-label', `${field.label} pour ${link.url}`);

      line.append(caption, input);
      form.appendChild(line);
      inputs.set(field.key, input);
    }

    const hint = document.createElement('p');
    hint.className = 'hint hint--tight';
    hint.textContent = 'Entrée pour enregistrer, Échap pour annuler. Tags séparés par des virgules.';
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
          toast('Lien mis à jour');
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
  open.setAttribute('aria-label', `Modifier titre, tags et note de ${link.title || link.url}`);
  open.title = 'Modifier le titre, les tags et la note';

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
  check.setAttribute('aria-label', `Sélectionner ${link.title || link.url}`);
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
      const action = `Filtrer sur le tag « ${tag} »`;
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
    toast('Lien supprimé');
  });
  remove.setAttribute('aria-label', `Supprimer ${link.title || link.url}`);

  const rank = document.createElement('span');
  rank.className = 'link__index';
  rank.textContent = String(linkRanks.get(link.id) ?? '');
  rank.title = 'Rang dans la collection, celui du tableau imprimé';

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
    el.selectionHint.textContent = `Les ${links.length} liens sont cochés.`;
    return;
  }
  el.selectionHint.textContent = selected.size === 0
    ? `Aucun lien coché : l'impression portera sur toute la collection (${links.length}).`
    : `${selected.size} lien${selected.size > 1 ? 's' : ''} coché${selected.size > 1 ? 's' : ''} `
      + `sur ${links.length}.`;
}

/**
 * Libellé du bouton d'impression, portée comprise.
 *
 * @param {number} count
 * @returns {string}
 */
function printLabel(count) {
  if (count === 0) return 'Imprimer';

  // Cocher tous les liens revient à imprimer la collection : le dire ainsi est
  // plus clair que « la sélection (33) ».
  const whole = selected.size === 0 || selected.size >= links.length;
  if (whole) return count === 1 ? 'Imprimer le lien' : `Imprimer les ${count} liens`;

  return `Imprimer la sélection (${count})`;
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
  return typed === '' ? DEFAULT_SETTINGS.collectionName : typed.slice(0, COLLECTION_NAME_MAX);
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
  toast(ok ? `${filename} enregistré` : 'Téléchargement impossible', ok ? 'info' : 'error');
}

/**
 * Importe une archive JSON.
 * @param {File} file
 */
async function importArchive(file) {
  const label = el.import.textContent;
  el.import.disabled = true;
  el.import.textContent = 'Lecture…';

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
      toast(`Aucun lien exploitable dans ${file.name}`, 'error');
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
    toast(`Import impossible : ${error.message}`, 'error');
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
  const plural = (count, noun) => `${count} ${noun}${count > 1 ? 's' : ''}`;
  const parts = [`${plural(added, 'lien')} importé${added > 1 ? 's' : ''}`];
  if (duplicates > 0) parts.push(`${duplicates} déjà présent${duplicates > 1 ? 's' : ''}`);
  if (rejected > 0) parts.push(plural(rejected, 'illisible'));
  return parts.join(', ');
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
    parties.push('Aucune date imprimée.');
  } else {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const echantillon = mode === 'date'
      ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
      : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    parties.push(`Date de collecte sur sa propre ligne — ${echantillon}.`);
  }
  if (el.sheetDateIndex.checked) parties.push('Le numéro du lien s\'imprime au-dessus du titre.');
  parties.push('Chaque ligne de plus réduit la place du QR code.');
  el.sheetDateHint.textContent = parties.join(' ');
}

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
    `Taille des étiquettes déduite de ces six valeurs : ${size}, `
    + `${layout.columns} × ${layout.rows} par feuille.`,
  ];

  if (offsetXMm !== 0 || offsetYMm !== 0) {
    const moves = [];
    if (offsetXMm !== 0) {
      moves.push(`${decimal(Math.abs(offsetXMm))} mm vers la ${offsetXMm > 0 ? 'droite' : 'gauche'}`);
    }
    if (offsetYMm !== 0) {
      moves.push(`${decimal(Math.abs(offsetYMm))} mm vers le ${offsetYMm > 0 ? 'bas' : 'haut'}`);
    }
    parts.push(`Décalage appliqué : ${moves.join(' et ')}.`);
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
      ? ` Le lien le plus dense est « ${densest.item.title || densest.item.url} ».`
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
    warnings.push(
      `Date non imprimée sur ${omittedDates.size} étiquette`
      + `${omittedDates.size > 1 ? 's' : ''} : elle ne tient pas sur une ligne à `
      + 'cette largeur.',
    );
  }

  el.sheetInfo.textContent = layout.perPage > 0
    ? `${layout.columns} × ${layout.rows} = ${layout.perPage} étiquettes par page ` +
      `de ${decimal(layout.labelWidthMm)} × ${decimal(layout.labelHeightMm)} mm, ` +
      `${layout.pages} page${layout.pages > 1 ? 's' : ''}` +
      (warnings.length ? ` — ${warnings.join(' ')}` : '')
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

  const range = `${Math.round(bounds.min * 100)} à ${Math.round(bounds.max * 100)} %`;
  el.sheetQrInfo.textContent =
    `QR de ${decimal(side)} mm (${decimal(moduleMm, 2)} mm par module, `
    + `minimum ${decimal(bounds.minModuleMm, 2)} mm) — ` +
    `réglable de ${range} — ${maxLines} ligne${maxLines > 1 ? 's' : ''} de texte.`;
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
    { box: el.tableColTags, available: hasAnyTag(links), what: 'tag' },
    { box: el.tableColNote, available: hasAnyNote(links), what: 'note' },
  ];

  for (const { box, available, what } of options) {
    box.disabled = !available;
    if (!available) box.checked = false;
    const label = box.parentNode;
    if (label) {
      label.title = available
        ? `Imprimer la colonne « ${what} »`
        : `Aucun lien n'a de ${what} : ajoutez-en un avec le bouton ✎ de la liste.`;
    }
  }

  el.tableHint.textContent = hasAnyNote(links) || hasAnyTag(links)
    ? 'Les tags et la note saisis dans la liste (bouton ✎) peuvent être imprimés ici.'
    : 'Ajoutez un tag ou une note depuis la liste (bouton ✎) pour pouvoir les imprimer.';
}

/** Redessine l'aperçu selon le mode actif. */
function renderPreview() {
  const items = printableLinks().slice(0, 400);
  el.preview.textContent = '';
  el.print.disabled = items.length === 0;
  el.print.textContent = printLabel(items.length);

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
    note.textContent = 'Ajoutez des liens pour voir un aperçu.';
    el.preview.appendChild(note);
    return;
  }

  if (mode === 'table') {
    if (!hasAnyTableColumn()) {
      // Un tableau sans aucune colonne n'a pas de sens : on le dit plutôt que
      // d'afficher un cadre vide.
      const note = document.createElement('p');
      note.className = 'hint';
      note.textContent = 'Aucune colonne sélectionnée : cochez au moins une colonne.';
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
 * Met une page en millimètres à l'échelle de l'aperçu.
 * @param {HTMLElement} page
 * @returns {HTMLElement}
 */
function scaleForScreen(page) {
  const widthMm = Number.parseFloat(page.style.width);
  const heightMm = Number.parseFloat(page.style.height);
  const available = Math.max(280, el.preview.clientWidth - 40);
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
    note.textContent = 'Sélectionnez un lien pour voir l\'étiquette.';
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
  // Le rendu écran est agrandi : la tête ne fait que 96 px de large.
  const zoom = Math.max(1, Math.floor(280 / shown.width));
  canvas.width = shown.width * zoom;
  canvas.height = shown.height * zoom;
  canvas.style.width = `${shown.width * zoom}px`;
  canvas.style.imageRendering = 'pixelated';

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(shown, 0, 0, canvas.width, canvas.height);

  frame.appendChild(canvas);

  const caption = document.createElement('p');
  caption.className = 'hint';
  // `composeLabel` sait si la date a été écartée : on le dit, plutôt que de
  // laisser croire que l'option n'a pas d'effet.
  const dateNote = dateTropPetite
    ? ' — date non imprimée : elle exigerait un texte trop petit pour être lu.'
    : (dateOmitted ? composeDateNote() : '');
  // La taille réellement retenue peut différer de celle demandée : la géométrie
  // réduit plutôt que de tronquer. On le dit, sinon le réglage semble sans effet.
  const tailleObtenue = pxToMm(geometry.fontSize, profile.dpi).toFixed(1);
  el.labelFontHint.textContent =
    `Texte de ${tailleObtenue} mm de haut, `
    + `${geometry.lines.length + (content.titleLines?.length ?? 0)} ligne(s) de texte.`;
  const orientationNote = lateralRefused
    ? ' — texte empilé : le QR laisse trop peu de largeur pour une colonne de texte.'
    : (turns === 0 ? '' : ` — orientation : ${labelRotation().label}`);
  caption.textContent = (verdict.ok
    ? `${profile.id} — ${geometry.width} × ${geometry.height} px, `
      + `${decimal(verdict.pxPerModule)} px par module`
    : `${profile.id} — ${verdict.reason}`) + orientationNote + dateNote;
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
 * @returns {{ format: object, textMode: string, marginMm: number, fontSizePt: number, cutMarks: boolean }}
 */
function readLabelOptions() {
  return {
    format: findFormat(el.labelFormat.value),
    textMode: el.labelText.value,
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
  caption.textContent = (plan.fits
    ? `${options.format.widthMm} mm × ${plan.heightPx} px — ${plan.widthPx} × ${plan.heightPx} px à ${options.format.dpi} dpi`
    : `URL trop longue pour ce format : le QR fait ${plan.qrSizePx} px pour ${plan.widthPx} px de large.`)
    + (plan.dateOmitted
      ? ' — date non imprimée : elle ne tient pas sur ce format, réduisez la taille du texte.'
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
  const label = el.exportLabels.textContent;
  el.exportLabels.disabled = true;

  try {
    const planned = planLabels(items, {
      format: options.format,
      textMode: options.textMode,
      dateMode: options.dateMode,
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
    el.printStatus.textContent = 'Impression directe indisponible — voir le message ci-dessus.';
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
      el.printStatus.textContent = `Impression ${page}/${copies}…`;
    },
  });

  return { ...result, width: geometry.width, height: geometry.height };
}

/** Imprime l'étiquette du lien choisi. */
async function printOneLabel() {
  if (!printer) {
    toast('Aucune imprimante connectée', 'error');
    return;
  }

  const link = chosenLabelLink();
  if (!link) {
    toast('Aucun lien dans la collection', 'error');
    return;
  }

  el.printLabel.disabled = true;
  el.printStatus.textContent = 'Composition de l\'étiquette…';

  try {
    el.printStatus.textContent = 'Envoi en cours…';
    const result = await sendLabel(link);
    el.printStatus.textContent =
      `Étiquette imprimée : ${result.rows} lignes, ${result.frames} trames.`;
  } catch (error) {
    el.printStatus.textContent = '';
    toast(error.message ?? 'Impression impossible', 'error');
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
    toast('Aucune imprimante connectée', 'error');
    return;
  }
  if (links.length === 0) {
    toast('Aucun lien dans la collection', 'error');
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
    toast('Aucun lien coché : cochez les étiquettes à imprimer, ou choisissez « toute la collection »', 'error');
    return;
  }

  const copies = seriesCopies();
  el.printLabel.disabled = true;
  el.printAllLabels.disabled = true;
  // Le bouton devient l'arrêt de la série : trente étiquettes lancées par
  // erreur ne doivent pas obliger à couper l'imprimante.
  el.printAllLabels.textContent = 'Arrêter la série';
  seriesRunning = true;

  let printed = 0;
  const failures = [];

  try {
    for (const [index, link] of items.entries()) {
      if (!seriesRunning) break;
      el.printStatus.textContent =
        `Étiquette ${index + 1}/${items.length} — ${link.title || link.url}`;
      try {
        // La quantité est un réglage de la série : sans elle, impossible de
        // sortir deux exemplaires de chaque étiquette d'un seul geste.
        await sendLabel(link, { copies });
        printed += copies;
      } catch (error) {
        failures.push(error.message ?? 'impression impossible');
      }
    }

    // Le compte porte sur les étiquettes réellement sorties, pas sur les liens
    // parcourus : avec deux exemplaires, dix liens font vingt étiquettes.
    const parts = [`${printed} étiquette${printed > 1 ? 's' : ''} imprimée${printed > 1 ? 's' : ''}`];
    if (!seriesRunning) parts.push('série arrêtée');
    if (failures.length > 0) parts.push(`${failures.length} en échec — ${failures[0]}`);
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
    optgroup.label = group.label;
    for (const [key, preset] of entries) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = preset.label;
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
    option.textContent = `Niimbot ${profile.id} — ${printableMm} mm utiles, ${profile.dpi} dpi`;
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
      ? 'longueur libre'
      : `${supply.lengthMm} mm`;
    // La raison est affichée dès qu'il y en a une, compatible ou non : un
    // rouleau plus large que la tête imprime avec une marge, et l'utilisateur
    // doit le savoir sans que l'option soit écartée.
    option.textContent = `${supply.label} — ${length}`
      + (supply.reason === '' ? '' : ` (${supply.reason})`);
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
    ? 'Rouleau continu : la longueur suit le contenu.'
    : `Longueur imposée par le rouleau : ${longueur} mm.`;
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
    option.textContent = disposition.label;
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
    option.textContent = alignment.label;
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
  return ' — aucune date : elle ne tient pas sur une ligne à cette taille de texte.';
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
    option.textContent = label;
    el.tableOrientation.appendChild(option);
  }
  el.tableOrientation.value = 'portrait';

  for (const scope of PRINT_SCOPES) {
    const option = document.createElement('option');
    option.value = scope.id;
    option.textContent = scope.label;
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
  if (el.labelShowIndex.checked) choisis.push('le numéro du lien');
  if (el.labelShowTitle.checked) choisis.push('le titre');
  if (el.labelShowUrl.checked) choisis.push('l\'URL');
  if (el.labelShowHost.checked) choisis.push('le domaine');
  if (el.labelShowDate.checked) {
    choisis.push(el.labelDateTime.checked ? 'la date et l\'heure' : 'la date de collecte');
  }

  if (choisis.length === 0) {
    el.labelContentHint.textContent = 'Le QR code seul, sans texte sous lui.';
    return;
  }
  el.labelContentHint.textContent =
    `Sous le QR : ${choisis.join(', ')}. Le texte est découpé à la largeur de la tête.`;
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
    el.profileHint.textContent =
      `Aperçu composé avec le ${profile.id} (${printableMm} mm utiles, ${profile.dpi} dpi), `
      + 'sans imprimante connectée : les dimensions et le nombre de modules sont exacts.';
    return;
  }
  const connected = printer.profile;
  el.profileHint.textContent = connected.id === profile.id
    ? `Imprimante connectée : ${connected.id}. Aperçu et impression identiques.`
    : `Imprimante connectée : ${connected.id}. L'aperçu montre le ${profile.id} choisi ; `
      + `« Imprimer » se fera au format du ${connected.id}.`;
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
    toast('Aucun lien coché : l\'impression portera sur toute la collection');
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
  el.exportXlsx.textContent = 'Génération…';

  try {
    const bytes = await buildLinkSpreadsheet(resolveTargets(links, el.qrTarget.value), {
      onProgress: (done, total) => {
        el.exportXlsx.textContent = `QR ${done}/${total}…`;
      },
    });
    const filename = exportFilename(collectionName(), 'xlsx');
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
for (const box of [el.sheetDate, el.sheetDateTime, el.sheetDateIndex]) {
  box.addEventListener('change', () => {
    updateDateHint();
    renderPreview();
  });
}
for (const box of [el.exportDate, el.exportDateTime]) {
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
    el.printStatus.textContent = 'Arrêt demandé : la série s\'arrête après l\'étiquette en cours.';
    return;
  }
  // `printAllLabels` attrape ses propres erreurs ; on protège malgré tout
  // l'appel, sans quoi un rejet deviendrait une promesse non traitée.
  printAllLabels().catch((error) => {
    toast(error.message ?? 'Impression impossible', 'error');
  });
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

// --- Démarrage ---

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
el.collectionName.value = preferences.collectionName;
applyCollectionName();
updateDateHint();

reportBluetoothSupport();
switchMode('sheet');
updateProfileHint();

// Un bandeau plutôt qu'un message transitoire : celui-ci serait recouvert par
// le message suivant, et un diagnostic qu'on ne lit pas ne sert à rien.
if (!stylesheetIsCurrent()) el.staleStyle.hidden = false;

if (storeKind === 'memory') {
  toast('Stockage temporaire : IndexedDB indisponible, les liens seront perdus', 'error');
}

await refresh();
