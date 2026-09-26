/**
 * Modèle de données : un « lien » collecté.
 *
 * Ce module est volontairement pur (aucun accès DOM, réseau ou stockage) afin
 * d'être réutilisé tel quel par l'application web autonome, l'extension
 * navigateur et, plus tard, une couche native.
 */

import { t } from './i18n.js';

/**
 * @typedef {Object} LinkRecord
 * @property {string}   id        Identifiant stable (UUID v4).
 * @property {string}   url       URL absolue normalisée — c'est elle qui est encodée dans le QR Code.
 * @property {string}   title     Titre lisible de la page (peut être vide).
 * @property {string}   note      Note libre de l'utilisateur.
 * @property {string[]} tags      Étiquettes de classement, sans « # », dédoublonnées.
 * @property {number}   createdAt Date de collecte (epoch ms).
 * @property {number}   updatedAt Dernière modification (epoch ms).
 * @property {string}   source    Origine : 'context-menu' | 'toolbar' | 'manual' | 'import' | 'share'.
 * @property {string}   favicon   URL du favicon, ou chaîne vide.
 * @property {number}   [order]   Position voulue dans la collection, ou absente.
 *   Absente tant que l'utilisateur n'a rien réordonné : la collection suit alors
 *   la date, comme avant. Un rang explicite est un entier croissant ; les liens
 *   qui en portent un passent devant ceux qui n'en ont pas.
 * @property {boolean}  [useShort] Ce que le QR Code de **ce lien** doit encoder.
 *   `true` le lien raccourci, `false` l'URL collectée, absent : le réglage
 *   global décide. L'absence n'est pas `false` — elle veut dire « je n'ai rien
 *   décidé pour celui-ci », et c'est ce qui permet à un réglage global de
 *   continuer de valoir pour les liens qu'on n'a pas touchés.
 * @property {string}   shortUrl  Lien raccourci, ou chaîne vide. N'écrase jamais `url` :
 *   le lien d'origine reste la source de vérité, un service tiers pouvant fermer.
 * @property {string}   shortProvider Identifiant du service qui a produit `shortUrl`.
 * @property {number}   shortenedAt Date du raccourcissement (epoch ms), 0 si jamais raccourci.
 */

/** Origines reconnues. Toute autre valeur est ramenée à 'manual'. */
export const SOURCES = ['context-menu', 'toolbar', 'manual', 'import', 'share'];

/**
 * Longueur maximale d'un titre conservé.
 *
 * Exporté : le champ de saisie du titre, dans la fenêtre de l'extension, doit
 * porter la même borne. Une seconde valeur écrite dans le HTML finirait par
 * diverger, et la saisie se ferait couper sans que rien ne l'annonce.
 */
export const DEFAULT_TITLE_MAX = 300;

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
 *   dans un QR Code imprimé (le fragment n'est jamais envoyé au serveur, et un
 *   `#` allonge inutilement la matrice) ;
 * - supprime un éventuel slash final redondant sur la racine.
 *
 * @param {string} input
 * @returns {string} URL normalisée.
 * @throws {TypeError} si l'entrée ne peut pas être analysée comme une URL http(s).
 */
export function normalizeUrl(input) {
  if (typeof input !== 'string') throw new TypeError(t('URL attendue sous forme de chaîne'));
  let raw = input.trim();
  if (raw === '') throw new TypeError(t('URL vide'));

  // Un schéma explicite non http(s) (mailto:, tel:, ftp:) est rejeté : ces
  // chaînes ne sont pas des liens web et fausseraient le rendu des colonnes.
  // Exception : « hote:3000 » ressemble à un schéma mais désigne un hôte suivi
  // d'un port ; on le traite comme une URL sans schéma plutôt que de le refuser.
  const isHostPort = /^[^\s/?#@]+:\d+(?:[/?#]|$)/.test(raw);
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:/i.test(raw) && !isHostPort) {
    throw new TypeError(t('Seuls les schémas http et https sont pris en charge'));
  }
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new TypeError(t('URL invalide : {input}', { input }));
  }
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
    throw new TypeError(t("Nom d'hôte invalide : {host}", { host: parsed.hostname }));
  }

  parsed.hash = '';

  // Paramètres de campagne : ils polluent le QR Code et le rendent plus dense.
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
export function safeHref(url) {
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
export function createLink(input, options = {}) {
  if (!input || typeof input.url !== 'string') {
    throw new TypeError(t('createLink exige au minimum { url }'));
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
    // Conservé tel quel, et **absent** s'il n'a jamais été posé : `undefined`
    // n'est pas `0`, et un rang nul compterait comme un rang explicite.
    ...(Number.isFinite(input.order) ? { order: input.order } : {}),
    // Même règle : un booléen explicite est conservé, une absence le reste.
    ...(typeof input.useShort === 'boolean' ? { useShort: input.useShort } : {}),
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
 * L'ordre manuel d'une collection.
 *
 * Deux groupes, dans cet ordre : les liens qui portent un rang explicite, par
 * rang croissant, puis ceux qui n'en portent pas, par date décroissante. Le
 * second groupe n'existe que tant que personne n'a réordonné — c'est-à-dire
 * exactement l'ancien comportement, conservé pour qui ne touche à rien.
 *
 * Un tri à deux étages plutôt qu'une migration : attribuer un rang à tous les
 * liens au premier chargement aurait réécrit la collection entière pour un
 * réglage que l'utilisateur n'a pas demandé.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @returns {import('./link.js').LinkRecord[]}
 */
export function sortByManualOrder(links) {
  const avec = [];
  const sans = [];
  for (const link of links) {
    if (Number.isFinite(link.order)) avec.push(link);
    else sans.push(link);
  }
  avec.sort((a, b) => a.order - b.order);
  sans.sort((a, b) => b.createdAt - a.createdAt);
  return [...avec, ...sans];
}

/**
 * Replace dans l'ordre manuel les seuls liens dont on donne la suite.
 *
 * Une recherche peut filtrer la liste : les lignes déplacées à l'écran ne sont
 * alors qu'une partie de la collection. Elles reprennent donc les **places**
 * qu'elles occupaient, dans l'ordre où on les a mises, et les liens invisibles
 * gardent la leur — sans quoi ranger deux lignes filtrées bouleverserait toute
 * la collection.
 *
 * @param {LinkRecord[]} links
 * @param {string[]} orderedIds - Les identifiants dans leur nouvel ordre.
 * @returns {LinkRecord[]} La collection entière, dans son nouvel ordre manuel.
 */
export function applyVisibleOrder(links, orderedIds) {
  const ordre = sortByManualOrder(links);
  const places = [];
  for (let index = 0; index < ordre.length; index += 1) {
    if (orderedIds.includes(ordre[index].id)) places.push(index);
  }

  const suite = [...ordre];
  orderedIds.forEach((id, rang) => {
    const lien = ordre.find((candidat) => candidat.id === id);
    if (lien && places[rang] !== undefined) suite[places[rang]] = lien;
  });
  return suite;
}

/**
 * Comparaison de texte pour les tris : insensible à la casse et aux accents, et
 * numérique sur les chiffres, pour que « article 2 » précède « article 10 ».
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
const compareTexte = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base', numeric: true });

/**
 * Les tris proposés. `manual` est le seul qui ne dépend pas du contenu.
 *
 * Chaque tri range selon une clé, et **départage par l'ordre manuel** : sans
 * cela, deux liens de même titre changeraient de place à chaque rendu, et la
 * liste paraîtrait instable sans raison.
 */
export const SORT_MODES = Object.freeze([
  { id: 'manual', label: 'Ordre manuel' },
  { id: 'title-asc', label: 'Titre, A → Z' },
  { id: 'title-desc', label: 'Titre, Z → A' },
  { id: 'domain-asc', label: 'Domaine, A → Z' },
  { id: 'domain-desc', label: 'Domaine, Z → A' },
  { id: 'tag-asc', label: 'Tag, A → Z' },
  { id: 'tag-desc', label: 'Tag, Z → A' },
  { id: 'date-desc', label: 'Date, du plus récent' },
  { id: 'date-asc', label: 'Date, du plus ancien' },
]);

/** L'identifiant de tri est-il connu ? */
export function isSortMode(value) {
  return SORT_MODES.some((mode) => mode.id === value);
}

/**
 * Range une collection selon le tri demandé.
 *
 * Le tri est une **vue** : rien n'est écrit, et revenir à « Ordre manuel »
 * retrouve la collection telle qu'elle était. C'est ce qui permet d'essayer un
 * tri sans le subir.
 *
 * @param {import('./link.js').LinkRecord[]} links
 * @param {string} [mode]
 * @returns {import('./link.js').LinkRecord[]}
 */
export function sortLinks(links, mode = 'manual') {
  const base = sortByManualOrder(links);
  if (mode === 'manual' || !isSortMode(mode)) return base;

  const rang = new Map(base.map((link, index) => [link.id, index]));
  const cle = (link) => {
    switch (mode) {
      case 'title-asc':
      case 'title-desc':
        return (link.title || link.url || '').trim();
      case 'domain-asc':
      case 'domain-desc':
        return hostOf(link.url);
      case 'tag-asc':
      case 'tag-desc':
        // Un lien sans tag n'a pas de clé : il se range à part, et non en tête
        // comme le ferait une chaîne vide comparée avant les autres.
        return link.tags.length > 0 ? link.tags[0] : '\uffff';
      default:
        return '';
    }
  };

  // Les tris de texte portent leur sens dans leur suffixe ; la date est traitée
  // à part, parce qu'elle ne se compare pas comme du texte.
  const signe = mode.endsWith('-desc') ? -1 : 1;

  return [...base].sort((a, b) => {
    if (mode === 'date-asc' || mode === 'date-desc') {
      const ecart = mode === 'date-asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      return ecart !== 0 ? ecart : rang.get(a.id) - rang.get(b.id);
    }
    const ecart = compareTexte(cle(a), cle(b));
    if (ecart !== 0) return signe * ecart;
    return rang.get(a.id) - rang.get(b.id);
  });
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

/**
 * Décide de ce qu'on fait d'un lien **déjà présent**.
 *
 * Recollecter une page déjà enregistrée était un refus sec : « déjà
 * enregistré ». Or le cas courant n'est pas un doublon mais une **correction** —
 * la page a changé de titre, ou on en a saisi un meilleur dans la fenêtre avant
 * d'enregistrer — et se voir refuser sa correction oblige à supprimer le lien
 * pour le rajouter. Le titre différent est donc adopté.
 *
 * Ce qui n'est **pas** touché : la date de collecte, le rang, les tags, la note,
 * le raccourci. Seul le titre change, parce que c'est la seule chose que
 * l'appelant apporte ; écraser une note ou un tag par leur absence serait une
 * perte silencieuse.
 *
 * Un titre vide, ou identique, ne change rien : on ne remplace pas un titre
 * choisi par une absence, et un enregistrement identique ne mérite pas une
 * écriture.
 *
 * @param {LinkRecord} existing
 * @param {{ title?: unknown }} record
 * @returns {{ link: LinkRecord, updated: boolean }}
 */
export function mergeDuplicate(existing, record) {
  const titre = typeof record?.title === 'string'
    ? record.title.trim().slice(0, DEFAULT_TITLE_MAX)
    : '';

  if (titre === '' || titre === existing.title) return { link: existing, updated: false };
  return { link: { ...existing, title: titre }, updated: true };
}

/**
 * Indique si un enregistrement possède un lien raccourci exploitable.
 * @param {Partial<LinkRecord>} [link]
 * @returns {boolean}
 */
export function hasShortUrl(link) {
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
export function sourceUrl(link) {
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
export function sourceHost(link) {
  return hostOf(sourceUrl(link));
}

/**
 * Destinations possibles du QR Code.
 * - `original` : l'URL collectée (comportement par défaut) ;
 * - `short` : le lien raccourci quand il existe, l'URL d'origine sinon.
 */
export const TARGET_MODES = Object.freeze(['original', 'short']);

/**
 * Prépare un enregistrement pour l'affichage ou l'impression.
 *
 * Renvoie toujours une copie portant :
 * - `url` : la destination retenue, celle que le QR Code encode ;
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
export function resolveTarget(link, mode = 'original') {
  const originalUrl = link.url;
  const shortUrl = hasShortUrl(link) ? link.shortUrl : '';
  // Le choix du lien prime sur le réglage global ; sans choix, le global
  // s'applique. `undefined` et `false` ne veulent donc pas dire la même chose.
  const veutLeRaccourci = typeof link.useShort === 'boolean'
    ? link.useShort
    : mode === 'short';
  const useShort = veutLeRaccourci && shortUrl !== '' && shortUrl !== originalUrl;

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
export function resolveTargets(links, mode = 'original') {
  return links.map((link) => resolveTarget(link, mode));
}
