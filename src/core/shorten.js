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

import { normalizeUrl, isValidUrl, isSameTarget } from './link.js';

/** Délai au-delà duquel une requête est abandonnée. */
export const SHORTENER_TIMEOUT_MS = 12000;

/**
 * Erreur de raccourcissement, avec un code exploitable par l'interface.
 *
 * Codes : `unsupported` (pas de `fetch`), `unknown` (service inconnu),
 * `invalid` (URL d'entrée refusée ou réponse illisible), `network`, `timeout`,
 * `aborted`, `http` (statut hors 2xx), `service` (le service a répondu une
 * erreur en clair), `unchanged` (le service a renvoyé l'URL d'origine).
 */
export class ShortenError extends Error {
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
export const SHORTENERS = Object.freeze([
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
export const DEFAULT_SHORTENER = 'tinyurl';

/**
 * Retrouve un service par son identifiant.
 * @param {string} id
 * @returns {typeof SHORTENERS[number]|undefined}
 */
export function findShortener(id) {
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
export function parseShortResponse(text, status, shortener, originalUrl) {
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
export async function shortenUrl(url, options = {}) {
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
export function createShortener(options = {}) {
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
export function describeShortenReport(report) {
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
