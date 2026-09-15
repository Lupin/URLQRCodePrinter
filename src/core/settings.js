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

import { TARGET_MODES } from './link.js';
import { DATE_MODES } from './exporters.js';
import { DEFAULT_SHORTENER, findShortener } from './shorten.js';

/** Clé de stockage, préfixée pour ne pas entrer en collision avec un autre outil. */
export const SETTINGS_KEY = 'url-qr-code-printer/settings';

/** Longueur maximale du nom de collection : au-delà, il ne tient plus nulle part. */
export const COLLECTION_NAME_MAX = 80;

/** Valeurs par défaut : aucun raccourcissement, le QR encode l'URL collectée. */
export const DEFAULT_SETTINGS = Object.freeze({
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
export function sanitizeSettings(value) {
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
export function createSettingsStore(options = {}) {
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
