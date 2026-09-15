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
  'count',
  'add-form',
  'url-input',
  'add-error',
  'search',
  'select-all',
  'select-none',
  'list',
  'empty',
  'export-csv',
  'export-md',
  'export-json',
  'import',
  'import-file',
  'clear',
  'preset',
  'sheet-qr',
  'sheet-info',
  'table-qr',
  'table-note',
  'density',
  'copies',
  'show-title',
  'printer-dot',
  'printer-name',
  'connect',
  'disconnect',
  'ble-support',
  'print-label',
  'print-status',
  'preview',
  'print',
  'print-root',
  'toast',
]);

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

/** Échelle minimale : sous 2 px par module, la tête thermique fusionne les points. */
const MIN_QR_SCALE = 2;

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
 * @param {(text: string) => number} [options.measure] Mesure de texte injectée
 *   (obligatoire hors navigateur ; en navigateur, un canvas est créé au besoin).
 * @returns {LabelGeometry}
 */
function computeLabelGeometry(options) {
  const width = Math.max(1, Math.floor(options.widthPx));
  const padding = Math.max(0, Math.floor(options.padding ?? Math.round(width * 0.06)));
  const fontSize = Math.max(6, Math.floor(options.fontSize ?? Math.round(width * 0.085)));
  const lineSpacing = options.lineSpacing ?? 1.15;
  const lineHeight = Math.ceil(fontSize * lineSpacing);
  const qrRatio = Math.min(1, Math.max(0.3, options.qrRatio ?? 0.95));
  const minScale = Math.max(1, Math.floor(options.minScale ?? MIN_QR_SCALE));
  const maxLines = options.maxLines ?? 4;

  const innerWidth = Math.max(1, width - padding * 2);
  const qrTarget = Math.floor(innerWidth * qrRatio);

  const measure = options.measure ?? defaultMeasure(fontSize);
  const lines = wrapText(measure, options.text ?? '', innerWidth, { maxLines });

  // Le QR a une taille entière en modules : on arrondit au multiple inférieur.
  // On impose une échelle minimale, sans quoi une URL longue produirait un code
  // à 1 px par module, illisible à l'impression thermique. Un éventuel
  // dépassement est signalé par `fits` plutôt que corrigé en silence.
  const matrix = encodeQr(options.text ?? ' ', { ecc: options.ecc ?? 'M', border: 2 });
  const scale = Math.max(minScale, pickScale(qrTarget, matrix.size));
  const qrSize = matrix.size * scale;
  const fits = qrSize <= innerWidth;

  const textHeight = lines.length * lineHeight;
  const contentHeight = qrSize + (lines.length ? padding + textHeight : 0);
  const naturalHeight = contentHeight + padding * 2;

  const minHeight = options.minHeightPx ?? 0;
  const maxHeight = options.maxHeightPx ?? 0;
  let height = Math.max(naturalHeight, minHeight);
  if (maxHeight > 0) height = Math.min(height, maxHeight);

  return {
    width,
    height: Math.ceil(height),
    padding,
    qrSize,
    qrScale: scale,
    pxPerModule: qrSize / matrix.size,
    fits,
    qrMatrix: matrix,
    textTop: padding + qrSize + padding,
    lineHeight,
    lines,
    fontSize,
  };
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
  } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, geometry.width, geometry.height);

  const qrX = Math.floor((geometry.width - geometry.qrSize) / 2);
  drawQr(geometry.qrMatrix, ctx, { x: qrX, y: geometry.padding, scale: geometry.qrScale });

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  let y = geometry.textTop;
  ctx.font = `bold ${geometry.fontSize}px ${fontFamily}`;
  if (showTitle && title) {
    ctx.fillText(title, geometry.width / 2, y);
    y += geometry.lineHeight;
  }

  ctx.font = `${geometry.fontSize}px ${fontFamily}`;
  for (const line of geometry.lines) {
    ctx.fillText(line, geometry.width / 2, y);
    y += geometry.lineHeight;
  }

  if (showHost) {
    ctx.font = `${Math.round(geometry.fontSize * 0.9)}px ${fontFamily}`;
    ctx.fillText(hostOf(options.url ?? ''), geometry.width / 2, y);
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
 * Dispositions d'étiquettes courantes.
 *
 * Ces préréglages sont des points de départ géométriquement valides sur A4 :
 * les marges sont calculées pour centrer la grille, et chaque disposition a été
 * vérifiée comme tenant exactement le nombre de colonnes et de rangées annoncé.
 *
 * Ils ne prétendent PAS reproduire les cotes d'une référence commerciale
 * précise. Une planche autocollante réelle se règle avec les cotes fournies par
 * son fabricant : mesurez la marge en haut à gauche et l'écart entre deux
 * étiquettes, ce sont les deux seules valeurs qui déterminent l'alignement.
 */
const SHEET_PRESETS = Object.freeze({
  'a4-3x8': {
    label: 'A4 — 3 × 8 (63,5 × 33,9 mm)',
    page: 'a4',
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginXMm: 7.25,
    marginYMm: 12.9,
    gapXMm: 2.5,
    gapYMm: 0,
  },
  'a4-2x7': {
    label: 'A4 — 2 × 7 (99,1 × 38,1 mm)',
    page: 'a4',
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginXMm: 4.65,
    marginYMm: 15.15,
    gapXMm: 2.5,
    gapYMm: 0,
  },
  'a4-4x10': {
    label: 'A4 — 4 × 10 (48 × 25 mm)',
    page: 'a4',
    labelWidthMm: 48,
    labelHeightMm: 25,
    marginXMm: 6,
    marginYMm: 23.5,
    gapXMm: 2,
    gapYMm: 0,
  },
  'a4-qr-3x4': {
    label: 'A4 — 3 × 4 grandes étiquettes QR (60 × 60 mm)',
    page: 'a4',
    labelWidthMm: 60,
    labelHeightMm: 60,
    marginXMm: 10,
    marginYMm: 28.5,
    gapXMm: 5,
    gapYMm: 0,
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
 * @property {SheetCell[]} cells
 * @property {string[]} warnings
 */

/**
 * Calcule la disposition d'une planche.
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
  const count = Math.max(0, Math.trunc(options.count ?? 0));

  const usableWidth = pageWidthMm - marginXMm * 2;
  const usableHeight = pageHeightMm - marginYMm * 2;

  // Les cotes sont décimales : « 297 - 2 × 15,15 » vaut 266,69999999999993 en
  // flottant, et la division tombe alors juste sous l'entier attendu. Sans
  // tolérance, une planche prévue pour 7 rangées n'en placerait que 6.
  // L'epsilon reste très inférieur à toute imprécision d'impression.
  const EPSILON = 1e-9;
  const columns = Math.max(
    0,
    Math.floor((usableWidth + gapXMm) / (labelWidthMm + gapXMm) + EPSILON),
  );
  const rows = Math.max(
    0,
    Math.floor((usableHeight + gapYMm) / (labelHeightMm + gapYMm) + EPSILON),
  );

  const warnings = [];
  if (columns === 0 || rows === 0) {
    warnings.push(
      `Aucune étiquette ne tient sur ${round1(pageWidthMm)} × ${round1(pageHeightMm)} mm : ` +
      `une étiquette mesure ${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm ` +
      `pour une zone utile de ${round1(usableWidth)} × ${round1(usableHeight)} mm.`,
    );
  } else {
    // Signale le gaspillage : un demi-centimètre perdu suffit souvent à faire
    // tenir une colonne de plus.
    const slackX = usableWidth - (columns * labelWidthMm + (columns - 1) * gapXMm);
    if (slackX > labelWidthMm * 0.6) {
      warnings.push(
        `Marge horizontale perdue de ${round1(slackX)} mm : une colonne ` +
        'supplémentaire tiendrait peut-être en réduisant les marges.',
      );
    }
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
        xMm: round2(marginXMm + column * (labelWidthMm + gapXMm)),
        yMm: round2(marginYMm + row * (labelHeightMm + gapYMm)),
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

/** Arrondit à 0,1 mm, précision suffisante pour l'impression. */
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
  const columns = options.columns ?? COLUMNS;

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

  out.push('| N° | URL | Titre | Tags | Ajouté le |');
  out.push('| ---: | --- | --- | --- | --- |');
  links.forEach((link, index) => {
    const linkCell = `[${escapeMarkdownCell(link.url)}](${link.url})`;
    out.push(
      `| ${index + 1} | ${linkCell} | ${escapeMarkdownCell(link.title)} | ` +
        `${link.tags.map((t) => '`#' + t + '`').join(' ')} | ${formatDateIso(link.createdAt)} |`,
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
  const doc = options.document ?? globalThis.document;
  const urlApi = options.url ?? globalThis.URL;

  if (!doc || !urlApi?.createObjectURL) return false;

  const mime = options.mime ?? 'text/plain;charset=utf-8';
  const blob = new Blob([text], { type: mime });
  const objectUrl = urlApi.createObjectURL(blob);

  const anchor = doc.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  doc.body.appendChild(anchor);
  anchor.click();

  // La révocation est différée : certains navigateurs annulent le
  // téléchargement si l'URL disparaît dans la même tâche.
  const revoke = () => urlApi.revokeObjectURL(objectUrl);
  if (typeof globalThis.setTimeout === 'function') globalThis.setTimeout(revoke, 10_000);
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
  maxPrintHeightMm: 100,
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
 */

/**
 * Vérifie que Web Bluetooth est utilisable et explique pourquoi sinon.
 *
 * @param {{ bluetooth?: BluetoothLike, isSecureContext?: boolean }} [env]
 * @returns {{ ok: boolean, reason?: string, hint?: string }}
 */
function checkWebBluetoothSupport(env = {}) {
  const bluetooth = env.bluetooth ?? globalThis.navigator?.bluetooth;
  const secure = env.isSecureContext ?? globalThis.isSecureContext;

  if (!bluetooth) {
    return {
      ok: false,
      reason: 'Web Bluetooth n\'est pas disponible dans ce navigateur.',
      hint:
        'Safari (macOS et iOS) ne l\'implémente pas, et Brave le désactive par ' +
        'défaut : activez brave://flags#brave-web-bluetooth-api. Chrome et Edge ' +
        'fonctionnent sans réglage.',
    };
  }
  if (secure === false) {
    return {
      ok: false,
      reason: 'Web Bluetooth exige un contexte sécurisé (HTTPS ou localhost).',
      hint: 'Ouvrez l\'application via https:// ou http://localhost.',
    };
  }
  return { ok: true };
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
  el.exportCsv.disabled = !hasLinks;
  el.exportMd.disabled = !hasLinks;
  el.exportJson.disabled = !hasLinks;
  el.clear.disabled = !hasLinks;

  for (const link of visible) el.list.appendChild(renderLink(link));
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

  const title = document.createElement('span');
  title.className = 'link__title';
  title.textContent = link.title || hostOf(link.url) || link.url;
  title.title = link.url;

  const url = document.createElement('span');
  url.className = 'link__url';
  url.textContent = link.url;

  body.append(title, url);

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
  const items = selectedLinks().slice(0, 400);
  el.preview.textContent = '';
  el.print.disabled = items.length === 0;

  if (mode === 'single') {
    el.print.hidden = true;
    renderSingleLabel(items[0]);
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
// Impression papier
// ---------------------------------------------------------------------------

/** Prépare la racine d'impression puis ouvre la boîte de dialogue système. */
function printSelection() {
  const items = selectedLinks();
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

  const [link] = selectedLinks();
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

el.preset.addEventListener('change', renderPreview);
el.sheetQr.addEventListener('input', renderPreview);
el.tableQr.addEventListener('input', renderPreview);
el.tableNote.addEventListener('change', renderPreview);
el.showTitle.addEventListener('change', renderPreview);
el.print.addEventListener('click', printSelection);
el.connect.addEventListener('click', connectPrinter);
el.disconnect.addEventListener('click', disconnectPrinter);
el.printLabel.addEventListener('click', printOneLabel);

window.addEventListener('beforeprint', () => {
  // Le rendu papier est préparé au clic ; un Ctrl+P direct n'aurait rien à
  // imprimer. On reconstruit donc à la volée si la racine est vide.
  if (el.printRoot.childElementCount === 0 && mode !== 'single') {
    const items = selectedLinks();
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
reportBluetoothSupport();
switchMode('sheet');

if (storeKind === 'memory') {
  toast('Stockage temporaire : IndexedDB indisponible, les liens seront perdus', 'error');
}

await refresh();
