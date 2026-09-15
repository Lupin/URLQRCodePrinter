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
export const SOURCES = ['context-menu', 'toolbar', 'manual', 'import', 'share'];

const DEFAULT_TITLE_MAX = 300;

/**
 * Génère un identifiant unique. `crypto.randomUUID` existe dans tous les
 * environnements visés (navigateurs modernes, service worker MV3, Node >= 19).
 * @returns {string}
 */
export function newId() {
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
export function normalizeUrl(input) {
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
export function isValidUrl(input) {
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
export function hostOf(url) {
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
export function normalizeTags(tags) {
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
export function createLink(input, options = {}) {
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
export function isSameTarget(a, b) {
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
export function findDuplicate(links, url) {
  let target;
  try {
    target = normalizeUrl(url);
  } catch {
    return undefined;
  }
  return links.find((link) => isSameTarget(link.url, target));
}
