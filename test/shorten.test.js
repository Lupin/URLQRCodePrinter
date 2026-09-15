/**
 * Tests du raccourcissement d'URL.
 *
 * Aucun test ne sort sur le réseau : `fetch` est injecté. Les réponses codées
 * en dur reproduisent ce que les services renvoient réellement, y compris leurs
 * bizarreries — c'est ce qui rend ces tests utiles :
 *   - `is.gd` et `v.gd` signalent une panne par un texte en clair **avec un
 *     statut 200** (« Error, database insert failed ») ;
 *   - `TinyURL` répond `400` avec le corps « Error » sur une entrée refusée ;
 *   - `spoo.me` répond en JSON, et en `http://` alors que le lien fonctionne
 *     aussi en `https://`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SHORTENERS,
  DEFAULT_SHORTENER,
  ShortenError,
  findShortener,
  parseShortResponse,
  shortenUrl,
  createShortener,
  describeShortenReport,
} from '../src/core/shorten.js';

import { normalizeUrl } from '../src/core/link.js';

/** Réponse factice minimale, suffisante pour le code testé. */
function response(body, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => body,
  };
}

/** `fetch` qui renvoie toujours la même réponse, en gardant trace des appels. */
function stubFetch(body, status = 200) {
  const calls = [];
  const impl = async (url, init = {}) => {
    calls.push({ url, init });
    return response(typeof body === 'function' ? body(url, init) : body, status);
  };
  impl.calls = calls;
  return impl;
}

/** `fetch` qui honore l'annulation, comme le vrai. */
function hangingFetch() {
  return (url, init = {}) => new Promise((_resolve, reject) => {
    const fail = () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    if (init.signal?.aborted) fail();
    else init.signal?.addEventListener('abort', fail, { once: true });
  });
}

const TINY = findShortener('tinyurl');
const ISGD = findShortener('isgd');
const SPOOME = findShortener('spoome');

// --------------------------------------------------------------------------
// Catalogue
// --------------------------------------------------------------------------

test('le catalogue expose des services complets et sans clé d\'API', () => {
  assert.ok(SHORTENERS.length >= 3);
  assert.ok(findShortener(DEFAULT_SHORTENER), 'le service par défaut existe');

  for (const shortener of SHORTENERS) {
    assert.equal(typeof shortener.id, 'string');
    assert.ok(shortener.name.length > 0, `${shortener.id} a un nom`);
    assert.ok(shortener.note.length > 0, `${shortener.id} documente ses limites`);
    assert.ok(shortener.spacingMs > 0, `${shortener.id} déclare un rythme`);
    const built = shortener.build('https://exemple.fr/a b&c');
    assert.match(built.url, /^https:\/\//, `${shortener.id} interroge un endpoint HTTPS`);
    assert.ok(built.init.method === 'GET' || built.init.method === 'POST');
    // Une URL contenant « & » et une espace ne doit pas casser la requête :
    // la valeur doit revenir intacte après décodage des paramètres.
    if (built.init.method === 'GET') {
      const query = new URL(built.url).searchParams;
      assert.equal(query.get('url'), 'https://exemple.fr/a b&c');
    } else {
      assert.equal(
        new URLSearchParams(built.init.body).get('url'),
        'https://exemple.fr/a b&c',
      );
    }
  }
});

test('findShortener renvoie undefined sur un identifiant inconnu', () => {
  assert.equal(findShortener('bitly'), undefined);
});

// --------------------------------------------------------------------------
// Analyse des réponses
// --------------------------------------------------------------------------

test('parseShortResponse lit une réponse texte', () => {
  assert.equal(
    parseShortResponse('https://tinyurl.com/27pg2hdr', 200, TINY, 'https://exemple.fr/x'),
    'https://tinyurl.com/27pg2hdr',
  );
});

test('parseShortResponse lit une réponse JSON et passe le lien en HTTPS', () => {
  const body = JSON.stringify({
    short_url: 'http://spoo.me/wH9LfN',
    domain: 'spoo.me',
    original_url: 'https://exemple.fr/chemin',
  });
  // L'URL d'origine figure aussi dans le JSON : c'est bien le lien court qui
  // doit être retenu, pas la première URL trouvée au hasard.
  assert.equal(
    parseShortResponse(body, 200, SPOOME, 'https://exemple.fr/chemin'),
    'https://spoo.me/wH9LfN',
  );
});

test('parseShortResponse refuse une erreur en clair servie avec un statut 200', () => {
  assert.throws(
    () => parseShortResponse('Error, database insert failed', 200, ISGD, 'https://exemple.fr/x'),
    (error) => {
      assert.ok(error instanceof ShortenError);
      assert.equal(error.code, 'service');
      assert.equal(error.provider, 'isgd');
      assert.match(error.message, /is\.gd/);
      assert.match(error.message, /database insert failed/);
      return true;
    },
  );
});

test('parseShortResponse refuse un statut hors 2xx', () => {
  assert.throws(
    () => parseShortResponse('Error', 400, TINY, 'https://exemple.fr/x'),
    (error) => {
      assert.equal(error.code, 'http');
      assert.equal(error.status, 400);
      return true;
    },
  );
});

test('parseShortResponse refuse une réponse vide ou illisible', () => {
  assert.throws(() => parseShortResponse('', 200, TINY, 'https://exemple.fr/x'),
    (error) => error.code === 'invalid');
  assert.throws(() => parseShortResponse('   ', 200, TINY, 'https://exemple.fr/x'),
    (error) => error.code === 'invalid');
  // JSON annoncé mais tronqué : on retombe sur la recherche de texte, qui échoue.
  assert.throws(() => parseShortResponse('{"short_url":', 200, SPOOME, 'https://exemple.fr/x'),
    (error) => error.code === 'service');
});

test('parseShortResponse refuse un lien renvoyé inchangé', () => {
  assert.throws(
    () => parseShortResponse('https://exemple.fr/deja-court', 200, TINY, 'https://exemple.fr/deja-court'),
    (error) => {
      assert.equal(error.code, 'unchanged');
      return true;
    },
  );
});

test('parseShortResponse refuse un schéma non http', () => {
  assert.throws(
    () => parseShortResponse('javascript:alert(1)', 200, TINY, 'https://exemple.fr/x'),
    (error) => error.code === 'service',
  );
});

// --------------------------------------------------------------------------
// shortenUrl
// --------------------------------------------------------------------------

test('shortenUrl interroge le service avec l\'URL encodée', async () => {
  const impl = stubFetch('https://tinyurl.com/abc');
  const short = await shortenUrl('https://exemple.fr/a b?x=1&y=2#frag', { fetch: impl });

  assert.equal(short, 'https://tinyurl.com/abc');
  assert.equal(impl.calls.length, 1);
  const [call] = impl.calls;
  assert.ok(call.url.startsWith('https://tinyurl.com/api-create.php?'));
  const sent = new URL(call.url).searchParams.get('url');
  // Ce que reçoit le service est exactement la forme normalisée : le fragment
  // est retiré (il n'est jamais envoyé à un serveur) et rien n'est encodé deux fois.
  assert.equal(sent, normalizeUrl('https://exemple.fr/a b?x=1&y=2#frag'));
  assert.ok(sent.endsWith('?x=1&y=2'), sent);
  assert.equal(call.init.credentials, 'omit', 'aucun cookie transmis au tiers');
  assert.equal(call.init.method, 'GET');
});

test('shortenUrl poste un formulaire pour spoo.me', async () => {
  const impl = stubFetch(JSON.stringify({ short_url: 'https://spoo.me/xyz' }));
  await shortenUrl('https://exemple.fr/page', { provider: 'spoome', fetch: impl });

  const [call] = impl.calls;
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(call.init.body, 'url=https%3A%2F%2Fexemple.fr%2Fpage');
});

test('shortenUrl refuse une URL d\'entrée invalide sans appeler le réseau', async () => {
  const impl = stubFetch('https://tinyurl.com/abc');
  await assert.rejects(
    () => shortenUrl('javascript:alert(1)', { fetch: impl }),
    (error) => error.code === 'invalid',
  );
  assert.equal(impl.calls.length, 0);
});

test('shortenUrl refuse un service inconnu', async () => {
  await assert.rejects(
    () => shortenUrl('https://exemple.fr/x', { provider: 'bitly', fetch: stubFetch('x') }),
    (error) => error.code === 'unknown',
  );
});

test('shortenUrl signale l\'absence de fetch', async () => {
  await assert.rejects(
    () => shortenUrl('https://exemple.fr/x', { fetch: null }),
    (error) => error.code === 'unsupported',
  );
});

test('shortenUrl transforme une panne réseau en erreur explicite', async () => {
  const impl = async () => {
    throw new TypeError('Failed to fetch');
  };
  await assert.rejects(
    () => shortenUrl('https://exemple.fr/x', { fetch: impl }),
    (error) => {
      assert.equal(error.code, 'network');
      assert.match(error.message, /TinyURL/);
      return true;
    },
  );
});

test('shortenUrl abandonne au-delà du délai imparti', async () => {
  await assert.rejects(
    () => shortenUrl('https://exemple.fr/x', { fetch: hangingFetch(), timeoutMs: 20 }),
    (error) => {
      assert.equal(error.code, 'timeout');
      assert.match(error.message, /20 ms|n'a pas répondu/);
      return true;
    },
  );
});

test('shortenUrl respecte une annulation externe', async () => {
  const controller = new AbortController();
  const promise = shortenUrl('https://exemple.fr/x', {
    fetch: hangingFetch(),
    signal: controller.signal,
    timeoutMs: 5000,
  });
  controller.abort();

  await assert.rejects(promise, (error) => error.code === 'aborted');
});

test('shortenUrl refuse d\'emblée un signal déjà annulé', async () => {
  const impl = stubFetch('https://tinyurl.com/abc');
  await assert.rejects(
    () => shortenUrl('https://exemple.fr/x', { fetch: impl, signal: AbortSignal.abort() }),
    (error) => error.code === 'aborted',
  );
  assert.equal(impl.calls.length, 0);
});

// --------------------------------------------------------------------------
// createShortener
// --------------------------------------------------------------------------

test('le cache évite de raccourcir deux fois la même URL', async () => {
  const impl = stubFetch('https://tinyurl.com/cache');
  const shortener = createShortener({ provider: 'tinyurl', fetch: impl });

  assert.equal(await shortener.shorten('https://exemple.fr/page'), 'https://tinyurl.com/cache');
  assert.equal(await shortener.shorten('https://exemple.fr/page'), 'https://tinyurl.com/cache');
  assert.equal(impl.calls.length, 1, 'un seul appel réseau');

  // `force` court-circuite le cache : utile après un changement de service.
  await shortener.shorten('https://exemple.fr/page', { force: true });
  assert.equal(impl.calls.length, 2);

  shortener.clearCache();
  await shortener.shorten('https://exemple.fr/page');
  assert.equal(impl.calls.length, 3);
});

test('le cache reste borné', async () => {
  const impl = stubFetch('https://tinyurl.com/x');
  const shortener = createShortener({ provider: 'tinyurl', fetch: impl, maxCache: 2 });
  for (const page of ['a', 'b', 'c']) {
    await shortener.shorten(`https://exemple.fr/${page}`);
  }
  // La borne atteinte vide le cache : la première URL est redemandée.
  await shortener.shorten('https://exemple.fr/a');
  assert.equal(impl.calls.length, 4);
});

test('shortenMany consigne succès, échecs et liens déjà raccourcis', async () => {
  let call = 0;
  const impl = async () => {
    call += 1;
    // Le deuxième lien échoue : le lot ne doit pas s'interrompre pour autant.
    if (call === 2) return response('Error, database insert failed', 200);
    return response(`https://tinyurl.com/l${call}`);
  };
  const shortener = createShortener({ provider: 'tinyurl', fetch: impl, spacingMs: 0 });

  const records = [
    { id: 'a', url: 'https://exemple.fr/1' },
    { id: 'b', url: 'https://exemple.fr/2' },
    { id: 'c', url: 'https://exemple.fr/3' },
    { id: 'd', url: 'https://exemple.fr/4', shortUrl: 'https://tinyurl.com/deja' },
    { id: 'e', url: 'pas une url' },
  ];

  const progress = [];
  const report = await shortener.shortenMany(records, {
    onProgress: (done, total) => progress.push(`${done}/${total}`),
  });

  assert.deepEqual(report.ok.map((item) => item.id), ['a', 'c']);
  assert.deepEqual(report.ok.map((item) => item.shortUrl), [
    'https://tinyurl.com/l1',
    'https://tinyurl.com/l3',
  ]);
  assert.deepEqual(report.failed.map((item) => item.id), ['b']);
  assert.equal(report.failed[0].code, 'service');
  assert.deepEqual(report.skipped.map((item) => item.id), ['d', 'e']);
  assert.deepEqual(report.skipped.map((item) => item.reason), ['already', 'invalid']);
  assert.equal(progress.length, 5, 'la progression couvre tous les enregistrements');
});

test('shortenMany respecte le rythme du service', async () => {
  const impl = stubFetch('https://tinyurl.com/x');
  const shortener = createShortener({ provider: 'tinyurl', fetch: impl, spacingMs: 25 });

  const started = Date.now();
  const report = await shortener.shortenMany([
    { id: 'a', url: 'https://exemple.fr/1' },
    { id: 'b', url: 'https://exemple.fr/2' },
    { id: 'c', url: 'https://exemple.fr/3' },
  ]);
  const elapsed = Date.now() - started;

  assert.equal(report.ok.length, 3);
  // Deux attentes entre trois requêtes : `setTimeout` ne se déclenche jamais
  // en avance, la borne basse est donc fiable.
  assert.ok(elapsed >= 50, `rythme respecté (${elapsed} ms)`);
});

test('shortenMany s\'arrête proprement sur annulation', async () => {
  const impl = stubFetch('https://tinyurl.com/x');
  const shortener = createShortener({ provider: 'tinyurl', fetch: impl, spacingMs: 0 });
  const controller = new AbortController();

  const report = await shortener.shortenMany(
    [
      { id: 'a', url: 'https://exemple.fr/1' },
      { id: 'b', url: 'https://exemple.fr/2' },
      { id: 'c', url: 'https://exemple.fr/3' },
    ],
    {
      signal: controller.signal,
      onProgress: (done) => {
        if (done === 1) controller.abort();
      },
    },
  );

  // Le travail déjà accompli est conservé, le reste est simplement non traité.
  assert.equal(report.ok.length, 1);
  assert.equal(report.failed.length, 0);
  assert.equal(impl.calls.length, 1);
});

test('createShortener refuse un service inconnu', () => {
  assert.throws(() => createShortener({ provider: 'bitly' }), (error) => error.code === 'unknown');
});

test('createShortener retient le rythme déclaré par le service', () => {
  assert.equal(createShortener({ provider: 'isgd' }).spacingMs, findShortener('isgd').spacingMs);
  assert.equal(createShortener({ provider: 'isgd', spacingMs: 10 }).spacingMs, 10);
});

test('describeShortenReport résume le lot en une phrase', () => {
  assert.equal(
    describeShortenReport({ ok: [{}, {}], failed: [], skipped: [] }),
    '2 liens raccourcis',
  );
  assert.equal(
    describeShortenReport({ ok: [{}], failed: [], skipped: [{ reason: 'already' }] }),
    '1 lien raccourci, 1 déjà fait',
  );
  assert.equal(
    describeShortenReport({ ok: [], failed: [{ message: 'panne' }], skipped: [] }),
    '0 lien raccourci, 1 échec — panne',
  );
});
