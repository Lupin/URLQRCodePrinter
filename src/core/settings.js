/**
 * Réglages persistants de l'application.
 *
 * Deux préférences seulement, mais deux préférences qu'on ne veut pas rechoisir
 * à chaque ouverture : le service de raccourcissement retenu et ce que le QR Code
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

import { TARGET_MODES, isSortMode } from './link.js';
import {
  COLLECTION_NAME_MAX, COLLECTION_NOTE_MAX, DEFAULT_COLLECTION_NAME,
  DEFAULT_START_INDEX, START_INDEX_MAX, START_INDEX_MIN,
} from './collections.js';
import { DATE_MODES } from './exporters.js';
import { DEFAULT_SHORTENER, findShortener } from './shorten.js';

/** Clé de stockage, préfixée pour ne pas entrer en collision avec un autre outil. */
export const SETTINGS_KEY = 'url-qr-code-printer/settings';

/** Valeurs par défaut : aucun raccourcissement, le QR Code encode l'URL collectée. */
export const DEFAULT_SETTINGS = Object.freeze({
  shortener: DEFAULT_SHORTENER,
  targetMode: 'original',
  collectionName: DEFAULT_COLLECTION_NAME,
  // Vide par défaut : une collection n'a pas toujours quelque chose à dire, et
  // une note inventée serait pire qu'une absence.
  collectionNote: '',
  dateMode: 'none',
  // L'ordre manuel par défaut : une collection qu'on n'a pas réordonnée suit la
  // date, et un tri choisi par le programme serait une décision qu'on n'a pas
  // prise.
  sortMode: 'manual',
  // Le premier numéro, **hérité** : chaque collection porte désormais le sien.
  // Cette valeur est celle de la page web autonome — qui n'a qu'une collection,
  // celle des réglages — et celle dont la reprise seeds la collection par
  // défaut d'une installation existante. Les bornes, elles, appartiennent au
  // module des collections : c'est lui qui les fait respecter.
  startIndex: DEFAULT_START_INDEX,
});

/**
 * Valide un objet de réglages, en retombant sur les valeurs par défaut.
 *
 * Une préférence inconnue ou d'un type inattendu est ignorée plutôt que
 * refusée : un réglage corrompu ne doit pas bloquer l'application.
 *
 * `options.shortener` remplace le service proposé d'emblée quand rien n'a été
 * choisi. Ce n'est pas un détail : T.LY, désormais le défaut, ne répond que
 * depuis une origine d'extension — l'application web autonome doit donc
 * présélectionner un service qui fonctionne depuis une page ordinaire. Le
 * cinquième paramètre reste optionnel, et sans lui le comportement d'avant est
 * conservé à l'identique.
 *
 * @param {unknown} value
 * @param {{ shortener?: string }} [options]
 * @returns {{ shortener: string, targetMode: 'original'|'short',
 *   collectionName: string, collectionNote: string, dateMode: string,
 *   sortMode: string, startIndex: number }}
 */
export function sanitizeSettings(value, options = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const defaut = typeof options.shortener === 'string' && findShortener(options.shortener)
    ? options.shortener
    : DEFAULT_SETTINGS.shortener;
  const shortener = typeof source.shortener === 'string' && findShortener(source.shortener)
    ? source.shortener
    : defaut;
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

  // Une note vide est un état normal, contrairement au nom : on ne retombe pas
  // sur un texte par défaut, on garde le vide.
  const rawNote = typeof source.collectionNote === 'string' ? source.collectionNote.trim() : '';
  const collectionNote = rawNote.slice(0, COLLECTION_NOTE_MAX);

  // Un tri inconnu retombe sur l'ordre manuel : mieux vaut une liste dans son
  // ordre naturel qu'un tri que personne n'a demandé.
  const sortMode = isSortMode(source.sortMode) ? source.sortMode : DEFAULT_SETTINGS.sortMode;

  // Le premier numéro est **borné**, pas refusé : une valeur hors bornes est
  // ramenée dans l'intervalle plutôt que de faire retomber toute la collection
  // au numéro 1. Un nombre à virgule est tronqué — on numérote des objets, pas
  // des mesures.
  const brut = Number(source.startIndex);
  const startIndex = Number.isFinite(brut)
    ? Math.min(START_INDEX_MAX, Math.max(START_INDEX_MIN, Math.trunc(brut)))
    : DEFAULT_SETTINGS.startIndex;

  return { shortener, targetMode, collectionName, collectionNote, dateMode, sortMode, startIndex };
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
export function createSettingsStore(options = {}) {
  const detected = options.storage ? { ...options.storage, persistent: true } : detectStorage();
  const storage = detected;
  // Le service proposé d'emblée, quand l'appelant en connaît un meilleur que le
  // défaut du catalogue : c'est ainsi que l'application web autonome évite de
  // présélectionner T.LY, qui ne répond pas depuis une origine ordinaire.
  const defaults = options.defaultShortener
    ? sanitizeSettings(null, { shortener: options.defaultShortener })
    : { ...DEFAULT_SETTINGS };

  /** @type {{ shortener: string, targetMode: 'original'|'short', collectionName: string, dateMode: string }} */
  let current = { ...defaults };
  let loaded = false;

  function load() {
    if (loaded) return { ...current };
    loaded = true;
    try {
      const raw = storage.getItem(SETTINGS_KEY);
      if (typeof raw === 'string' && raw !== '') {
        current = sanitizeSettings(JSON.parse(raw), { shortener: defaults.shortener });
      }
    } catch {
      // Réglage illisible : on garde les valeurs par défaut.
      current = { ...defaults };
    }
    return { ...current };
  }

  function save(patch) {
    current = sanitizeSettings({ ...load(), ...patch }, { shortener: defaults.shortener });
    try {
      storage.setItem(SETTINGS_KEY, JSON.stringify(current));
    } catch {
      // Quota, mode privé : le réglage vaut pour la session en cours.
    }
    return { ...current };
  }

  function reset() {
    current = { ...defaults };
    try {
      storage.setItem(SETTINGS_KEY, JSON.stringify(current));
    } catch {
      // Sans effet si l'écriture est impossible.
    }
    return { ...current };
  }

  return { load, save, reset, persistent: Boolean(storage.persistent) };
}
