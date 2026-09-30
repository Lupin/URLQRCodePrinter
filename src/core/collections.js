/**
 * Collections : le rangement des liens, et la collection de navigation privée.
 *
 * Jusqu'ici, « la collection » était une notion implicite : tous les liens
 * collectés vivaient dans un seul ensemble, et `settings.collectionName` ne
 * servait qu'à nommer les exports. Ce module donne à cette notion une existence
 * propre — un identifiant, un nom, une note — pour que l'utilisateur puisse en
 * tenir plusieurs : une veille, un projet, des liens de famille.
 *
 * Trois choix structurent le module, et chacun répond à un défaut précis :
 *
 * - **Il reste toujours au moins une collection.** Un utilisateur qui ne crée
 *   jamais de collection doit continuer d'avoir exactement le produit d'avant,
 *   avec ses liens déjà enregistrés. `sanitizeCollections` synthétise donc la
 *   collection par défaut **quand la liste est vide**, et son nom vide veut
 *   dire « prenez le nom intégré » — « Mes liens » dans la langue de
 *   l'utilisateur, et non une chaîne figée à l'écriture dans la langue du jour.
 *   Cette distinction compte : réinjecter la collection par défaut à chaque
 *   lecture la rendrait impérissable, alors qu'elle est une collection comme
 *   une autre — c'est seulement la **dernière** qui ne se supprime pas.
 * - **Un nom vide est un état, pas un refus.** Vider le champ du nom ne
 *   renommait rien : le nom précédent restait, et l'écran ne le disait pas.
 *   `rename` accepte donc le vide, et l'affichage retombe alors sur le nom
 *   intégré — le même que la collection par défaut, traduit au moment de
 *   l'affichage. Un nom vide n'entre pas dans le contrôle des doublons : deux
 *   collections sans nom sont deux collections distinctes, et leur refuser
 *   cela interdirait de les vider l'une après l'autre.
 * - **La collection de navigation privée n'est jamais écrite.** Elle n'existe
 *   pas dans le stockage : elle est synthétisée quand — et seulement quand —
 *   le contexte est privé. Ses liens vivent dans `chrome.storage.session`
 *   (voir `store.js` et `PRIVATE_LINKS_KEY`), donc en mémoire, et disparaissent
 *   à la fermeture du navigateur. Une collection privée persistée par accident
 *   serait un fichier d'URL privées sur le disque : le module n'offre aucun
 *   chemin qui permette d'y arriver.
 * - **Les opérations impossibles lèvent, elles ne devinent pas.** Renommer ou
 *   supprimer la collection privée, supprimer la dernière collection, créer une
 *   collection sans nom ou sous un nom déjà pris : des erreurs typées, que
 *   l'interface attrape et explique. Un silence laisserait l'utilisateur devant
 *   un clic sans effet.
 *
 * Le stockage est injecté — une zone au format `chrome.storage.local`, c'est-à-
 * dire un `get(clé)` qui rend `{ [clé]: valeur }` et un `set({ [clé]: valeur })`.
 * Le module se teste donc sans navigateur, comme `settings.js` et `privacy.js`.
 * Une zone absente ou en panne ne fait jamais échouer l'appelant : on retombe
 * sur une collection par défaut en mémoire, exactement comme si l'utilisateur
 * n'en avait jamais créé.
 */

import { newId } from './link.js';
import { t } from './i18n.js';

/**
 * Longueur maximale du nom d'une collection.
 *
 * Le nom tient dans un nom de fichier et sous un en-tête imprimé : au-delà, il
 * ne tient plus nulle part. La borne vit ici, avec la notion qu'elle borne, et
 * non dans les réglages : c'est `createCollection` qui la fait respecter.
 */
export const COLLECTION_NAME_MAX = 80;

/**
 * Longueur maximale de la note de collection.
 *
 * Plus large que le nom, parce que ce n'est pas la même chose : la note est un
 * paragraphe qui explique de quoi la collection parle, le nom une étiquette.
 * Elle reste bornée — elle finit dans un fichier et sur une page.
 */
export const COLLECTION_NOTE_MAX = 600;

/**
 * Bornes du premier numéro d'une collection.
 *
 * Le numéro s'imprime sur l'étiquette, sous le QR Code : au-delà de quatre
 * chiffres, la ligne ne tient plus sur une étiquette étroite et se ferait
 * rogner. Zéro est permis — une série peut commencer à zéro — et le défaut
 * reste 1, qui est ce que faisait la numérotation avant que ce réglage existe.
 *
 * **Chaque collection a le sien.** Numéroter une série d'objets est un geste
 * qui appartient à la collection qu'on range : reprendre la suite d'un lot
 * terminé ici n'a rien à voir avec ce qui se numérote ailleurs, et un réglage
 * commun obligeait à le re-régler à chaque bascule.
 */
export const START_INDEX_MIN = 0;
export const START_INDEX_MAX = 9999;

/** Premier numéro d'une collection qui n'en a jamais réglé un. */
export const DEFAULT_START_INDEX = 1;

/**
 * Nom de la collection de qui n'en a jamais nommé aucune.
 *
 * Une chaîne, jamais écrite dans le stockage : le nom vide d'une collection
 * veut dire « prenez celui-ci », et il est traduit au moment de l'affichage.
 * L'écrire figerait la langue du jour dans le document.
 *
 * Elle vaut pour **toutes** les collections, et pas seulement pour celle par
 * défaut : vider le nom d'une collection rangée à côté laisse une collection
 * sans nom, que la liste et les exports présentent sous ce libellé. Un nom
 * d'emprunt plutôt qu'une option vide, où personne ne saurait ce qu'elle
 * contient.
 */
export const DEFAULT_COLLECTION_NAME = 'Mes liens';

/**
 * Clé de stockage du document des collections.
 *
 * Préfixée, comme les autres clés du projet, pour ne pas entrer en collision
 * avec un autre outil qui partagerait `chrome.storage.local`.
 */
export const COLLECTIONS_KEY = 'url-qr-code-printer/collections';

/** Clé de la collection courante, mémorisée séparément du document. */
export const ACTIVE_COLLECTION_KEY = 'url-qr-code-printer/active-collection';

/** Version du document écrit. À incrémenter si sa forme change. */
export const COLLECTIONS_VERSION = 1;

/** Identifiant de la collection par défaut : celle de qui n'en crée aucune. */
export const DEFAULT_COLLECTION_ID = 'default';

/**
 * Identifiant de la collection de navigation privée.
 *
 * Réservé : un document stocké qui le porterait est écarté à la lecture, pour
 * qu'une valeur écrite à la main ou par une version antérieure ne puisse pas
 * faire croire à une collection privée persistée.
 */
export const PRIVATE_COLLECTION_ID = 'private';

/** Clé des liens dans le stockage local — la collection courante, hors privé. */
export const COLLECTION_LINKS_KEY = 'links';

/**
 * Clé des liens de la collection privée, dans `chrome.storage.session`.
 *
 * Volontairement distincte de `COLLECTION_LINKS_KEY` : les deux zones sont
 * différentes, et une clé identique dans deux zones rendrait une fuite de
 * l'une vers l'autre indétectable à la lecture du code.
 */
export const PRIVATE_LINKS_KEY = 'links/private';

/**
 * Les documents dont un changement déplace ce qui est affiché.
 *
 * Trois contextes partagent ces documents sans se parler — la fenêtre de
 * l'extension, l'application, et le service worker qui peint le compteur de
 * l'icône —, et chacun doit savoir lesquels surveiller. La liste vit donc **ici**,
 * avec les clés qu'elle nomme : un contexte qui en oublierait un garderait un
 * affichage périmé, et rien ne le lui dirait avant un rechargement.
 *
 * Deux réponses, parce que les liens de la collection privée vivent dans
 * `storage.session` : une zone, un jeu de clés.
 *
 * @param {string} area
 * @returns {string[]}
 */
export function displayedDocuments(area) {
  if (area === 'local') return [COLLECTION_LINKS_KEY, COLLECTIONS_KEY, ACTIVE_COLLECTION_KEY];
  if (area === 'session') return [PRIVATE_LINKS_KEY];
  return [];
}

/**
 * Erreur d'opération sur une collection, avec un code exploitable.
 *
 * Codes : `empty-name` (création sans nom), `duplicate-name` (nom déjà pris),
 * `reserved` (collection privée, jamais renommable ni supprimable), `last`
 * (dernière collection : il en faut toujours une), `unknown` (identifiant
 * inconnu).
 */
export class CollectionError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   * @param {{ id?: string }} [details]
   */
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'CollectionError';
    this.code = code;
    this.id = details.id ?? '';
  }
}

/**
 * Le contexte est-il privé ?
 *
 * Deux sources, dans cet ordre : l'onglet visé, puis l'API d'extension.
 *
 * L'onglet d'abord, parce qu'il est le plus précis — c'est **cette** page qui
 * est privée — et le plus largement disponible : `tabs.Tab.incognito` existe
 * depuis Chrome 16 et **Safari 14**, alors que
 * `extension.inIncognitoContext` n'arrive sur Safari qu'en version 18. Le
 * service worker, lui, n'a pas d'onglet à interroger : il passe le contexte
 * qu'il connaît du clic, et l'API comble le reste quand elle existe.
 *
 * @param {{ tabIncognito?: unknown, inIncognitoContext?: unknown }} [sources]
 * @returns {boolean}
 */
export function isPrivateContext(sources = {}) {
  return Boolean(sources.tabIncognito) || Boolean(sources.inIncognitoContext);
}

/**
 * Collection d'un enregistrement.
 *
 * L'absence n'est pas une anomalie : tous les liens enregistrés avant que ce
 * module existe n'ont pas de `collectionId`, et ils appartiennent à la
 * collection par défaut. On ne les réécrit pas — une migration qui toucherait
 * chaque enregistrement pour un champ que l'utilisateur n'a pas demandé serait
 * exactement ce que `sortByManualOrder` évite déjà pour les rangs.
 *
 * @param {Partial<import('./link.js').LinkRecord>} [link]
 * @returns {string}
 */
export function collectionOf(link) {
  const id = link?.collectionId;
  return typeof id === 'string' && id.trim() !== '' ? id.trim() : DEFAULT_COLLECTION_ID;
}

/** La collection est-elle celle de la navigation privée ? */
export function isPrivateCollection(collection) {
  const id = typeof collection === 'string' ? collection : collection?.id;
  return id === PRIVATE_COLLECTION_ID;
}

/**
 * Borne et nettoie un nom de collection.
 *
 * Le repli sur une chaîne vide n'est pas un refus : c'est le appelant qui
 * décide si un nom vide est acceptable — il l'est pour la collection par
 * défaut, qui porte alors le nom intégré, et ne l'est pas pour une collection
 * créée à la main.
 *
 * @param {unknown} value
 * @returns {string}
 */
function cleanName(value) {
  return typeof value === 'string' ? value.trim().slice(0, COLLECTION_NAME_MAX) : '';
}

/**
 * Clé de comparaison des noms : sans casse ni accents.
 *
 * Deux collections nommées « Veille » et « veille » seraient indiscernables
 * dans la fenêtre : la comparaison les tient pour le même nom, sans imposer à
 * l'utilisateur une casse précise.
 *
 * @param {string} value
 * @returns {string}
 */
function nameKey(value) {
  return cleanName(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Construit une collection normale validée.
 *
 * Le premier numéro est **borné, pas refusé** : une valeur hors bornes est
 * ramenée dans l'intervalle — un utilisateur qui tape 100000 veut une série
 * longue, pas une erreur — et un nombre à virgule est tronqué, puisqu'on
 * numérote des objets et non des mesures.
 *
 * @param {{ id?: unknown, name?: unknown, note?: unknown, startIndex?: unknown, createdAt?: unknown }} [input]
 * @param {{ now?: number }} [options]
 * @returns {{ id: string, name: string, note: string, startIndex: number, createdAt: number }}
 */
export function createCollection(input = {}, options = {}) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const id = typeof input.id === 'string' && input.id.trim() !== '' && input.id !== PRIVATE_COLLECTION_ID
    ? input.id.trim()
    : newId();

  return {
    id,
    name: cleanName(input.name),
    note: typeof input.note === 'string' ? input.note.trim().slice(0, COLLECTION_NOTE_MAX) : '',
    startIndex: cleanStartIndex(input.startIndex),
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : now,
  };
}

/**
 * Ramène un premier numéro dans ses bornes.
 *
 * Une valeur illisible rend le défaut — un enregistrement écrit avant que ce
 * champ existe n'a pas de numéro, et sa série commence à 1. Une chaîne vide
 * compte comme une absence, et non comme un zéro : le champ est un
 * `<input type="number">`, et le vider pour le retaper ne doit pas faire passer
 * la numérotation par zéro.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function cleanStartIndex(value) {
  // **Une chaîne vide n'est pas zéro.** `Number('')` vaut 0, et prendre ce zéro
  // pour une valeur ferait sauter la numérotation à 0 dès qu'on vide le champ
  // pour le retaper — puis à la valeur suivante. Une absence rend le défaut :
  // c'est ce que veut dire un enregistrement écrit avant que ce champ existe.
  if (value === '' || value === null || value === undefined) return DEFAULT_START_INDEX;
  const brut = Number(value);
  if (!Number.isFinite(brut)) return DEFAULT_START_INDEX;
  return Math.min(START_INDEX_MAX, Math.max(START_INDEX_MIN, Math.trunc(brut)));
}

/**
 * La collection de navigation privée, telle qu'elle s'affiche.
 *
 * Elle n'est jamais stockée : son nom est traduit à l'affichage, comme le nom
 * intégré de la collection par défaut. Deux propriétés la distinguent d'une
 * collection ordinaire, et l'interface s'y fie : `private` pour l'annoncer, et
 * un identifiant réservé qui la met hors de portée du renommage et de la
 * suppression.
 *
 * @param {(message: string) => string} [translate]
 * @returns {{ id: string, name: string, note: string, createdAt: number, private: true }}
 */
export function privateCollection(translate = t) {
  return {
    id: PRIVATE_COLLECTION_ID,
    name: translate('Navigation privée'),
    note: '',
    startIndex: DEFAULT_START_INDEX,
    createdAt: 0,
    private: true,
  };
}

/**
 * Range les collections : la collection par défaut d'abord, puis par date.
 *
 * L'ordre est stable et volontairement pauvre — pas de rang manuel à
 * entretenir pour un objet qu'on crée rarement, et une place fixe pour la
 * collection par défaut, qui est celle où atterrissent les liens de qui n'a
 * rien créé.
 *
 * @param {Array<object>} items
 * @returns {Array<object>}
 */
function orderCollections(items) {
  return [...items].sort((a, b) => {
    if (a.id === DEFAULT_COLLECTION_ID) return -1;
    if (b.id === DEFAULT_COLLECTION_ID) return 1;
    return a.createdAt - b.createdAt;
  });
}

/**
 * Lit le tableau d'items d'un document stocké, quelle que soit sa forme.
 *
 * Deux formes sont acceptées : le document `{ version, items }` écrit par ce
 * module, et un tableau nu — la tolérance coûte trois lignes et évite qu'une
 * valeur écrite à la main rende toutes les collections invisibles.
 *
 * @param {unknown} value
 * @returns {unknown[]}
 */
function storedItems(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray(value.items)) return value.items;
  return [];
}

/**
 * Assainit un document de collections, en garantissant qu'il en reste une.
 *
 * Une entrée illisible est écartée plutôt que refusée : une collection
 * corrompue ne doit pas emporter les autres. Les entrées de la collection
 * privée sont ignorées — elle est synthétisée, jamais stockée.
 *
 * @param {unknown} value
 * @returns {{ version: number, migratedAt: number, items: Array<{ id: string, name: string, note: string, startIndex: number, createdAt: number }> }}
 */
export function sanitizeCollections(value) {
  const seen = new Set();
  const items = [];

  for (const entry of storedItems(value)) {
    if (!entry || typeof entry !== 'object') continue;
    const id = typeof entry.id === 'string' ? entry.id.trim() : '';
    if (id === '' || id === PRIVATE_COLLECTION_ID || seen.has(id)) continue;
    seen.add(id);
    items.push(createCollection({ ...entry, id }));
  }

  // La collection par défaut n'est injectée que si la liste est **vide** : elle
  // est celle des liens enregistrés avant les collections, et il faut bien
  // qu'elle existe pour eux. La réinjecter dès qu'elle manque la rendrait
  // impérissable — la supprimer serait sans effet, puisqu'elle reviendrait à la
  // lecture suivante.
  if (items.length === 0) {
    items.unshift({
      id: DEFAULT_COLLECTION_ID,
      name: '',
      note: '',
      startIndex: DEFAULT_START_INDEX,
      createdAt: 0,
    });
  }

  const migratedAt = value && typeof value === 'object' && Number.isFinite(value.migratedAt)
    ? value.migratedAt
    : 0;

  return { version: COLLECTIONS_VERSION, migratedAt, items: orderCollections(items) };
}

/**
 * Assainit la collection courante mémorisée.
 *
 * Deux champs, un par contexte : la collection courante d'une fenêtre normale
 * et celle d'une fenêtre privée n'ont aucune raison d'être la même, et les
 * confondre ferait basculer l'utilisateur d'une collection à l'autre selon la
 * fenêtre qu'il vient d'ouvrir. Une chaîne vide veut dire « pas encore
 * décidée » ; c'est `getActive` qui tranche, en retombant sur la première
 * collection visible.
 *
 * @param {unknown} value
 * @returns {{ normal: string, private: string }}
 */
export function sanitizeActive(value) {
  const source = value && typeof value === 'object' ? value : {};
  const champ = (candidat) => (typeof candidat === 'string' ? candidat.trim() : '');
  return { normal: champ(source.normal), private: champ(source.private) };
}

/**
 * Les collections visibles dans un contexte donné.
 *
 * La collection privée n'est ajoutée qu'en contexte privé, et en dernier : elle
 * n'existe nulle part ailleurs, et aucune interface ne doit pouvoir la proposer
 * en navigation ordinaire. C'est la seule fonction qui décide de cette
 * visibilité — les appelants ne la filtrent pas eux-mêmes, sans quoi la règle
 * vivrait à trois endroits et finirait par diverger.
 *
 * @param {Array<object>} items Collections assainies.
 * @param {{ isPrivate?: boolean, translate?: (message: string) => string }} [options]
 * @returns {Array<object>}
 */
export function visibleCollections(items, options = {}) {
  const liste = orderCollections(Array.isArray(items) ? items : []);
  if (!options.isPrivate) return liste;
  return [...liste, privateCollection(options.translate)];
}

/**
 * Nom affichable d'une collection.
 *
 * Un nom vide n'est pas une absence de nom : c'est une collection qu'on n'a pas
 * nommée — celle par défaut, que personne n'a renommée, ou une autre dont on a
 * vidé le champ. Elle porte donc le nom intégré du produit, traduit au moment de
 * l'affichage, jamais écrit.
 *
 * @param {{ name?: unknown } | undefined} collection
 * @param {(message: string) => string} [translate]
 * @returns {string}
 */
export function collectionDisplayName(collection, translate = t) {
  const nom = typeof collection?.name === 'string' ? collection.name.trim() : '';
  return nom === '' ? translate(DEFAULT_COLLECTION_NAME) : nom;
}

/**
 * Un nom de collection **libre**, dérivé de celui qu'on voudrait.
 *
 * Créer une collection refuse un nom déjà pris — c'est la bonne règle pour un
 * geste où l'utilisateur a tapé le nom lui-même. Mais ici le nom vient d'ailleurs
 * — un import qui apporte le sien, ou un bouton qui propose le premier nom venu —
 * et un refus obligerait à en inventer un autre à la main. On rend donc le nom
 * demandé s'il est libre, et « Veille 2 », « Veille 3 »… sinon.
 *
 * Le rang est un nombre, écrit pareil dans les deux langues : aucun libellé à
 * traduire. Le suffixe est **réservé avant** la troncature, sans quoi un nom
 * déjà à la longueur maximale rendrait toujours le même candidat — et la
 * recherche ne s'arrêterait jamais.
 *
 * @param {unknown} desired Nom souhaité ; vide, le nom intégré est proposé.
 * @param {Array<object>} [items] Collections déjà présentes.
 * @param {(message: string) => string} [translate]
 * @returns {string}
 */
export function freeCollectionName(desired, items = [], translate = t) {
  const voulu = cleanName(desired);
  const base = voulu === '' ? cleanName(translate(DEFAULT_COLLECTION_NAME)) : voulu;
  const pris = new Set((Array.isArray(items) ? items : []).map((item) => nameKey(item?.name)));
  if (!pris.has(nameKey(base))) return base;

  // La boucle se termine toujours : `pris` est fini, et chaque rang produit une
  // chaîne différente de la précédente.
  for (let rang = 2; ; rang += 1) {
    const marque = ` ${rang}`;
    const candidat = cleanName(
      base.slice(0, Math.max(1, COLLECTION_NAME_MAX - marque.length)) + marque,
    );
    if (!pris.has(nameKey(candidat))) return candidat;
  }
}

/**
 * Accès aux collections, adossé à une zone de stockage d'extension.
 *
 * Toutes les méthodes sont asynchrones et ne lèvent jamais pour une panne de
 * stockage : au pire, elles travaillent sur la collection par défaut en
 * mémoire. Seules les opérations **impossibles** lèvent — création sans nom,
 * nom déjà pris, collection réservée, identifiant inconnu — et c'est alors une
 * `CollectionError`, que l'interface attrape pour l'expliquer.
 *
 * @param {{ area?: any, now?: () => number }} [options]
 * @returns {{
 *   available: boolean,
 *   list: () => Promise<Array<object>>,
 *   visible: (options?: { isPrivate?: boolean }) => Promise<Array<object>>,
 *   ensureDefault: () => Promise<boolean>,
 *   create: (name: string) => Promise<object>,
 *   rename: (id: string, name: string) => Promise<object>,
 *   setNote: (id: string, note: string) => Promise<object>,
 *   setStartIndex: (id: string, value: unknown) => Promise<object>,
 *   remove: (id: string) => Promise<boolean>,
 *   getActive: (isPrivate?: boolean) => Promise<string>,
 *   setActive: (id: string, isPrivate?: boolean) => Promise<string>,
 *   needsMigration: () => Promise<boolean>,
 *   markMigrated: () => Promise<boolean>,
 * }}
 */
export function createCollectionStore(options = {}) {
  const area = options.area ?? null;
  const now = typeof options.now === 'function' ? options.now : () => Date.now();
  const available = Boolean(area && typeof area.get === 'function' && typeof area.set === 'function');

  /**
   * Lit la valeur brute, en avalant une panne de stockage.
   * @returns {Promise<unknown>}
   */
  async function readRaw() {
    if (!available) return null;
    try {
      const data = await area.get(COLLECTIONS_KEY);
      return data?.[COLLECTIONS_KEY] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Lit le document, et dit s'il portait déjà la collection par défaut.
   *
   * La distinction sert à `ensureDefault` : écrire à chaque lecture ferait une
   * écriture par ouverture de la fenêtre, pour un document qui n'a pas changé.
   *
   * @returns {Promise<{ document: object, stored: boolean }>}
   */
  async function load() {
    const raw = await readRaw();
    // « Déjà en place » veut dire : au moins une collection est écrite. C'est
    // cette condition qui décide si `ensureDefault` a quelque chose à
    // matérialiser — et non la présence de la collection par défaut, qui peut
    // avoir été supprimée comme une autre.
    const stored = sanitizeCollections(raw).items.length > 0
      && storedItems(raw).some(
        (entry) => entry && typeof entry === 'object' && typeof entry.id === 'string',
      );
    return { document: sanitizeCollections(raw), stored };
  }

  /**
   * Écrit le document. Rend `false` quand le stockage refuse (quota, mode
   * privé restrictif) : l'appelant le sait sans qu'une exception remonte.
   *
   * @param {object} document
   * @returns {Promise<boolean>}
   */
  async function write(document) {
    if (!available) return false;
    try {
      await area.set({ [COLLECTIONS_KEY]: document });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Écrit le document modifié par `change`.
   * @param {(document: object) => object} change
   * @returns {Promise<object>} Le document écrit.
   */
  async function update(change) {
    const { document } = await load();
    const next = sanitizeCollections(change(document));
    await write(next);
    return next;
  }

  /**
   * Refuse un nom vide, à la **création** d'une collection.
   *
   * Une collection qu'on crée sans nom n'aurait rien pour la distinguer des
   * autres dans la liste, et le bouton qui la crée propose donc toujours un nom.
   * Le renommage, lui, accepte le vide : vider le champ est un geste, et il doit
   * produire une collection sans nom plutôt que de laisser l'ancien en place,
   * sans que rien ne le dise.
   *
   * Le nom déjà pris se contrôle séparément, dans `nameTaken` : cette
   * comparaison a besoin de la liste des collections, que l'appelant a de toute
   * façon déjà chargée.
   *
   * @param {unknown} name
   * @returns {string} Le nom nettoyé.
   */
  function requireName(name) {
    const clean = cleanName(name);
    if (clean === '') {
      throw new CollectionError(t('Une collection doit porter un nom'), 'empty-name');
    }
    return clean;
  }

  /**
   * Le nom est-il déjà porté par une autre collection ?
   * @param {Array<object>} items
   * @param {string} name
   * @param {string} [exceptId]
   * @returns {boolean}
   */
  function nameTaken(items, name, exceptId = '') {
    const cle = nameKey(name);
    return items.some((item) => item.id !== exceptId && nameKey(item.name) === cle && cle !== '');
  }

  /**
   * Retrouve une collection normale, ou lève.
   * @param {Array<object>} items
   * @param {string} id
   * @returns {object}
   */
  function requireNormal(items, id) {
    if (id === PRIVATE_COLLECTION_ID) {
      throw new CollectionError(t('La collection de navigation privée n\'est pas modifiable'), 'reserved', { id });
    }
    const found = items.find((item) => item.id === id);
    if (!found) {
      throw new CollectionError(t('Collection inconnue : {id}', { id }), 'unknown', { id });
    }
    return found;
  }

  /** Lit la collection courante mémorisée, brute puis assainie. */
  async function readActive() {
    if (!available) return sanitizeActive(null);
    try {
      const data = await area.get(ACTIVE_COLLECTION_KEY);
      return sanitizeActive(data?.[ACTIVE_COLLECTION_KEY]);
    } catch {
      return sanitizeActive(null);
    }
  }

  /**
   * Mémorise la collection courante d'un contexte.
   * @param {{ normal: string, private: string }} value
   * @returns {Promise<boolean>}
   */
  async function writeActive(value) {
    if (!available) return false;
    try {
      await area.set({ [ACTIVE_COLLECTION_KEY]: value });
      return true;
    } catch {
      return false;
    }
  }

  return {
    available,

    async list() {
      return (await load()).document.items;
    },

    async visible(visibleOptions = {}) {
      const { document } = await load();
      return visibleCollections(document.items, visibleOptions);
    },

    async ensureDefault() {
      const { document, stored } = await load();
      if (stored) return false;
      // Rend `false` quand rien n'a pu être écrit : sans zone de stockage, il
      // n'y a pas de collection à retrouver à la prochaine ouverture, et le
      // dire vaut mieux que de prétendre avoir installé quelque chose.
      return write(document);
    },

    async create(name) {
      const clean = requireName(name);
      const { document } = await load();
      if (nameTaken(document.items, clean)) {
        throw new CollectionError(t('Une collection porte déjà ce nom'), 'duplicate-name');
      }
      const collection = createCollection({ name: clean, createdAt: now() });
      await update((current) => ({ ...current, items: [...current.items, collection] }));
      return collection;
    },

    async rename(id, name) {
      // **Un nom vide est accepté.** C'est la seule façon de vider le nom d'une
      // collection : refuser le vide laissait l'ancien nom en place, et l'écran
      // affichait un champ vide sous une collection qui portait toujours son
      // nom d'avant. La collection s'affiche alors sous le nom intégré, et elle
      // n'entre pas dans le contrôle des doublons — deux collections sans nom
      // restent deux collections.
      const clean = cleanName(name);
      let renamed = null;
      await update((document) => {
        const target = requireNormal(document.items, id);
        if (clean !== '' && nameTaken(document.items, clean, id)) {
          throw new CollectionError(t('Une collection porte déjà ce nom'), 'duplicate-name', { id });
        }
        renamed = { ...target, name: clean };
        return {
          ...document,
          items: document.items.map((item) => (item.id === id ? renamed : item)),
        };
      });
      return renamed;
    },

    async setNote(id, note) {
      let updated = null;
      await update((document) => {
        const target = requireNormal(document.items, id);
        updated = {
          ...target,
          note: typeof note === 'string' ? note.trim().slice(0, COLLECTION_NOTE_MAX) : '',
        };
        return {
          ...document,
          items: document.items.map((item) => (item.id === id ? updated : item)),
        };
      });
      return updated;
    },

    async setStartIndex(id, value) {
      const startIndex = cleanStartIndex(value);
      let updated = null;
      await update((document) => {
        const target = requireNormal(document.items, id);
        updated = { ...target, startIndex };
        return {
          ...document,
          items: document.items.map((item) => (item.id === id ? updated : item)),
        };
      });
      return updated;
    },

    async remove(id) {
      if (id === PRIVATE_COLLECTION_ID) {
        throw new CollectionError(
          t('La collection de navigation privée n\'est pas modifiable'),
          'reserved',
          { id },
        );
      }

      // **Toutes les collections se suppriment, sauf la dernière.** La
      // collection par défaut n'a rien de particulier : elle est celle de qui
      // n'en crée jamais, et la supprimer quand une autre existe est un
      // rangement légitime. Ce qui ne peut pas arriver, c'est qu'il n'en reste
      // aucune : la fenêtre et l'application n'auraient plus où enregistrer.
      const { document } = await load();
      if (!document.items.some((item) => item.id === id)) return false;
      if (document.items.length <= 1) {
        throw new CollectionError(
          t('Il doit rester au moins une collection'),
          'last',
          { id },
        );
      }

      const before = document.items.length;
      await update((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== id),
      }));

      // La collection courante ne doit pas désigner une collection disparue :
      // sans cela, la fenêtre suivante s'ouvrirait sur un repli silencieux.
      const actives = await readActive();
      if (actives.normal === id || actives.private === id) {
        await writeActive({
          normal: actives.normal === id ? '' : actives.normal,
          private: actives.private === id ? '' : actives.private,
        });
      }
      return before !== (await load()).document.items.length;
    },

    async getActive(isPrivate = false) {
      const { document } = await load();
      const actives = await readActive();
      const items = visibleCollections(document.items, { isPrivate });
      const voulu = isPrivate ? actives.private : actives.normal;
      if (items.some((item) => item.id === voulu)) return voulu;
      // À défaut de choix valide, une fenêtre privée ouvre la collection
      // privée : c'est la raison d'être de la navigation privée, et l'inverse
      // enverrait les premiers liens privés sur le disque sans que personne ne
      // l'ait demandé.
      return isPrivate ? PRIVATE_COLLECTION_ID : items[0].id;
    },

    async setActive(id, isPrivate = false) {
      const actives = await readActive();
      const next = isPrivate ? { ...actives, private: id } : { ...actives, normal: id };
      await writeActive(next);
      return id;
    },

    async needsMigration() {
      return (await load()).document.migratedAt === 0;
    },

    async markMigrated() {
      const { document } = await load();
      if (document.migratedAt !== 0) return false;
      await write({ ...document, migratedAt: now() });
      return true;
    },
  };
}
