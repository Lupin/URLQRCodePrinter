/**
 * Persistance des liens.
 *
 * Un « store » expose toujours la même interface, ce qui permet de réutiliser
 * l'application web, l'extension et (plus tard) un pont natif sans changer le
 * reste du code :
 *
 *   list(): Promise<LinkRecord[]>
 *   get(id): Promise<LinkRecord|undefined>
 *   add(record, options?): Promise<{ link, duplicate, updated }>
 *   put(record): Promise<LinkRecord>
 *   putMany(records): Promise<number>
 *   remove(id): Promise<void>
 *   clear(): Promise<void>
 *
 * L'implémentation par défaut utilise IndexedDB, disponible à la fois dans une
 * page web et dans un service worker d'extension MV3.
 *
 * ## Les collections
 *
 * Depuis que les liens se rangent en collections, trois ajouts s'ajoutent à
 * cette interface, sans la remplacer :
 *
 * - **`add` accepte un `collectionId`.** Il borne alors la recherche de doublon
 *   à cette collection — la même adresse peut donc figurer dans deux
 *   collections, ce qui est le sens même du rangement — et il estampille
 *   l'enregistrement. Sans cet argument, le comportement d'origine est conservé
 *   à l'identique : un `add` sans collection se dédoublonne sur tout le store.
 * - **`withCollection(store, id)`** rend une façade aux mêmes méthodes, bornée
 *   à une collection : lectures filtrées, écritures estampillées, et un
 *   `clear()` qui ne vide que la sienne. C'est ce que manipulent la fenêtre,
 *   le service worker et l'application, qui n'ont jamais à connaître les autres
 *   collections.
 * - **`createCompositeStore`** réunit deux zones de stockage — les liens
 *   ordinaires dans `chrome.storage.local`, ceux de la navigation privée dans
 *   `chrome.storage.session` — et route chaque écriture vers celle qui possède
 *   la collection visée. Une collection privée ne peut donc pas se retrouver
 *   sur le disque par inadvertance : sa zone ne l'écrit nulle part.
 */

import {
  createLink, findDuplicate, mergeDuplicate, newId, sortByManualOrder,
} from './link.js';
import { COLLECTION_LINKS_KEY, DEFAULT_COLLECTION_ID, collectionOf } from './collections.js';

const DB_NAME = 'url-qr-code-printer';
const DB_VERSION = 1;
const STORE = 'links';

/**
 * @typedef {Object} LinkStore
 * @property {() => Promise<import('./link.js').LinkRecord[]>} list
 * @property {(id: string) => Promise<import('./link.js').LinkRecord|undefined>} get
 * @property {(record: Partial<import('./link.js').LinkRecord> & {url: string}, options?: {collectionId?: string, allowDuplicate?: boolean, now?: number, source?: string}) => Promise<{link: import('./link.js').LinkRecord, duplicate: boolean, updated: boolean}>} add
 * @property {(record: import('./link.js').LinkRecord) => Promise<import('./link.js').LinkRecord>} put
 * @property {(records: import('./link.js').LinkRecord[]) => Promise<number>} putMany
 * @property {(id: string) => Promise<void>} remove
 * @property {() => Promise<void>} clear
 */

/**
 * Collection visée par un `add`.
 *
 * L'argument explicite l'emporte sur le champ porté par l'enregistrement :
 * c'est l'appelant qui sait dans quelle collection il collecte, alors que le
 * champ vient d'un objet qui peut avoir traversé un import. Sans l'un ni
 * l'autre, c'est la collection par défaut — le cas des liens anciens, qu'on ne
 * réécrit pas.
 *
 * @param {{ collectionId?: unknown }} record
 * @param {{ collectionId?: unknown }} [addOptions]
 * @returns {string}
 */
function targetCollection(record, addOptions = {}) {
  const explicite = typeof addOptions.collectionId === 'string' ? addOptions.collectionId.trim() : '';
  return explicite !== '' ? explicite : collectionOf(record);
}

/**
 * Tranche le cas du lien déjà présent, et l'enregistre si le titre a changé.
 *
 * La décision elle-même vit dans le cœur (`mergeDuplicate`) : les trois
 * implémentations la partagent, et ne diffèrent que par leur façon d'écrire.
 * L'écriture passe par le `put` du magasin plutôt que dans son dos — chaque
 * implémentation range ses enregistrements à sa manière, et `put` pose aussi
 * `updatedAt`, ce qui est exactement ce qu'on veut dire : le lien a changé.
 *
 * @param {{ put: (record: object) => Promise<object> }} store
 * @param {import('./link.js').LinkRecord} existing
 * @param {{ title?: unknown }} record
 * @returns {Promise<{ link: import('./link.js').LinkRecord, duplicate: true, updated: boolean }>}
 */
async function mergeOrKeep(store, existing, record) {
  const { link, updated } = mergeDuplicate(existing, record);
  if (!updated) return { link, duplicate: true, updated: false };
  return { link: await store.put(link), duplicate: true, updated: true };
}

/**
 * Trie les liens du plus récent au plus ancien.
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {import('./link.js').LinkRecord[]}
 */
export function sortByDateDesc(links) {
  return [...links].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * L'ordre de lecture d'une collection : le rang explicite s'il existe, la date
 * sinon.
 *
 * C'est `sortByManualOrder` qui décide, et le magasin s'y tient : les trois
 * implémentations — IndexedDB, `chrome.storage`, mémoire — rendent donc la même
 * liste, et la fenêtre de l'extension comme le service worker voient le même
 * ordre que l'application.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {import('./link.js').LinkRecord[]}
 */
export function sortForDisplay(links) {
  return sortByManualOrder(links);
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
export function openDatabase(dbName = DB_NAME) {
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
export function createIndexedDbStore(options = {}) {
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
      return sortForDisplay(all);
    },

    async get(id) {
      const db = await getDb();
      const tx = db.transaction(STORE, 'readonly');
      return promisifyRequest(tx.objectStore(STORE).get(id));
    },

    async add(record, addOptions = {}) {
      const collectionId = targetCollection(record, addOptions);
      const existing = await this.list();
      const dansLaCollection = existing.filter((link) => collectionOf(link) === collectionId);
      const duplicate = addOptions.allowDuplicate
        ? undefined
        : findDuplicate(dansLaCollection, record.url);
      if (duplicate) return mergeOrKeep(this, duplicate, record);

      const link = createLink({ ...record, collectionId }, addOptions);
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
export function createMemoryStore(initial = []) {
  /** @type {Map<string, import('./link.js').LinkRecord>} */
  const map = new Map(initial.map((link) => [link.id, link]));

  return {
    async list() {
      return sortForDisplay([...map.values()]);
    },
    async get(id) {
      return map.get(id);
    },
    async add(record, addOptions = {}) {
      const collectionId = targetCollection(record, addOptions);
      const dansLaCollection = [...map.values()]
        .filter((link) => collectionOf(link) === collectionId);
      const duplicate = addOptions.allowDuplicate
        ? undefined
        : findDuplicate(dansLaCollection, record.url);
      if (duplicate) return mergeOrKeep(this, duplicate, record);
      const link = createLink({ ...record, collectionId }, addOptions);
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
 * Store adossé à une zone de `chrome.storage` (extension uniquement).
 *
 * Utile quand on veut que les données soient visibles depuis le service worker
 * et la page d'options sans ouvrir IndexedDB. Le quota par défaut est de 10 Mo
 * (ou illimité avec la permission `unlimitedStorage`).
 *
 * **La clé est un paramètre**, et ce n'est pas un détail de confort : la
 * collection de navigation privée vit dans `chrome.storage.session` sous
 * `links/private`. Deux zones distinctes, donc, et deux clés distinctes — une
 * clé unique employée dans deux zones rendrait une fuite de l'une vers l'autre
 * indétectable à la lecture du code.
 *
 * @param {{ area?: any, key?: string }} [options]
 * @returns {LinkStore}
 */
export function createChromeStorageStore(options = {}) {
  const area = options.area ?? (globalThis.chrome?.storage?.local);
  if (!area) throw new Error('chrome.storage.local indisponible');

  const KEY = typeof options.key === 'string' && options.key !== ''
    ? options.key
    : COLLECTION_LINKS_KEY;

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
      return sortForDisplay(await readAll());
    },
    async get(id) {
      return (await readAll()).find((link) => link.id === id);
    },
    async add(record, addOptions = {}) {
      const collectionId = targetCollection(record, addOptions);
      const all = await readAll();
      const dansLaCollection = all.filter((link) => collectionOf(link) === collectionId);
      const duplicate = addOptions.allowDuplicate
        ? undefined
        : findDuplicate(dansLaCollection, record.url);
      if (duplicate) return mergeOrKeep(this, duplicate, record);
      const link = createLink({ ...record, collectionId }, addOptions);
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
export function resolveDefaultStore(options = {}) {
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

/**
 * Borne un store à une collection.
 *
 * C'est la seule interface dont ont besoin la fenêtre, le service worker et
 * l'application : elles affichent **une** collection, y écrivent, et n'ont
 * jamais à connaître les autres. Le filtrage vit donc ici, une fois, plutôt
 * qu'à chaque appel — c'est ce qui garantit qu'aucune liste ne mélange deux
 * collections par oubli.
 *
 * Trois comportements méritent d'être notés :
 *
 * - **`add` dédoublonne dans la collection.** La même adresse peut figurer dans
 *   deux collections : c'est le sens du rangement, et un dédoublonnage global
 *   l'interdirait.
 * - **`clear` ne vide que la collection.** « Vider la collection » dans la
 *   fenêtre ne doit pas emporter les autres, qui ne sont même pas à l'écran.
 * - **`remove` est sans effet sur un lien d'une autre collection.** Un
 *   identifiant périmé ne doit pas permettre de supprimer ailleurs.
 *
 * @param {LinkStore} store
 * @param {string} collectionId
 * @returns {LinkStore}
 */
export function withCollection(store, collectionId) {
  const cible = typeof collectionId === 'string' && collectionId.trim() !== ''
    ? collectionId.trim()
    : DEFAULT_COLLECTION_ID;

  return {
    async list() {
      return (await store.list()).filter((link) => collectionOf(link) === cible);
    },

    async get(id) {
      const link = await store.get(id);
      return link && collectionOf(link) === cible ? link : undefined;
    },

    async add(record, addOptions = {}) {
      return store.add({ ...record, collectionId: cible }, { ...addOptions, collectionId: cible });
    },

    async put(record) {
      return store.put({ ...record, collectionId: cible });
    },

    async putMany(records) {
      return store.putMany(records.map((record) => ({ ...record, collectionId: cible })));
    },

    async remove(id) {
      const link = await store.get(id);
      if (!link || collectionOf(link) !== cible) return;
      await store.remove(id);
    },

    async clear() {
      // Une suppression par lien, et non un `clear` du store : c'est la seule
      // façon d'épargner les autres collections avec les trois implémentations,
      // dont aucune ne sait filtrer ses suppressions.
      const liens = await this.list();
      for (const link of liens) await store.remove(link.id);
    },
  };
}

/**
 * Réunit plusieurs zones de stockage en un seul store.
 *
 * Les liens ordinaires vivent dans `chrome.storage.local`, ceux de la
 * navigation privée dans `chrome.storage.session`. La fenêtre et l'application
 * doivent pouvoir lire les deux — la collection courante peut être l'une ou
 * l'autre — mais **écrire chacune dans sa zone** : c'est `match` qui décide, à
 * partir de l'identifiant de collection de l'enregistrement. Sans ce routage,
 * une collection privée finirait sur le disque, ce que tout le reste du projet
 * cherche à empêcher.
 *
 * La première zone qui reconnaît la collection gagne. Une écriture dont aucune
 * zone ne veut est ignorée plutôt que dirigée au hasard : mieux vaut un lien
 * manquant qu'un lien privé écrit au mauvais endroit.
 *
 * @param {Array<{ store: LinkStore, match?: (collectionId: string) => boolean }>} zones
 * @returns {LinkStore}
 */
export function createCompositeStore(zones = []) {
  const connues = zones.filter((zone) => zone?.store);

  /**
   * @param {string} collectionId
   * @returns {{ store: LinkStore }|undefined}
   */
  const zonePour = (collectionId) => connues.find((zone) => {
    try {
      return zone.match ? zone.match(collectionId) : true;
    } catch {
      return false;
    }
  });

  return {
    async list() {
      const listes = await Promise.all(connues.map((zone) => zone.store.list()));
      return sortForDisplay(listes.flat());
    },

    async get(id) {
      for (const zone of connues) {
        const link = await zone.store.get(id);
        if (link) return link;
      }
      return undefined;
    },

    async add(record, addOptions = {}) {
      const zone = zonePour(targetCollection(record, addOptions));
      if (!zone) return { link: undefined, duplicate: false };
      return zone.store.add(record, addOptions);
    },

    async put(record) {
      const zone = zonePour(collectionOf(record));
      if (!zone) return record;
      const ecrit = await zone.store.put(record);

      // Un `put` qui change la collection d'un enregistrement est un
      // **déplacement** : la copie restée dans une autre zone doit partir.
      // Sans cela, déplacer un lien de la collection privée vers une collection
      // ordinaire le laisserait en mémoire de session sous son ancien
      // identifiant — invisible en navigation normale, et perdu à la fermeture
      // du navigateur —, et le chemin inverse laisserait une copie sur le
      // disque, ce que tout le reste du projet cherche à empêcher.
      for (const autre of connues) {
        if (autre === zone) continue;
        const reste = await autre.store.get(record.id);
        if (reste) await autre.store.remove(record.id);
      }
      return ecrit;
    },

    async putMany(records) {
      let ecrits = 0;
      for (const record of records) {
        const zone = zonePour(collectionOf(record));
        if (!zone) continue;
        ecrits += await zone.store.putMany([record]);
      }
      return ecrits;
    },

    async remove(id) {
      for (const zone of connues) {
        const link = await zone.store.get(id);
        if (link) {
          await zone.store.remove(id);
          return;
        }
      }
    },

    async clear() {
      for (const zone of connues) await zone.store.clear();
    },
  };
}
