/**
 * Client WebDriver minimal pour SafariDriver.
 *
 * Aucune dépendance : l'API REST est parlée directement. Quatre faits ont
 * façonné ce fichier, tous constatés à l'exécution sur Safari 26.5 :
 *
 * 1. **Une seule session Safari à la fois.** Une session abandonnée laisse
 *    Safari « apparié » et toute création suivante échoue avec
 *    `The Safari instance is already paired with another WebDriver session`.
 *    Redémarrer `safaridriver` est le seul moyen fiable de repartir propre :
 *    `DELETE /session` n'est pas honoré.
 * 2. **`POST /session/{id}/extension` n'existe pas** : SafariDriver répond
 *    `unknown command`. Le chargement de l'extension ne peut donc pas être
 *    automatisé par WebDriver.
 * 3. **SafariDriver pilote le vrai Safari**, avec le profil réel de
 *    l'utilisateur — contrairement à Brave et son `--user-data-dir` isolé. Il
 *    n'y a pas d'équivalent Safari ; le script ne doit donc rien changer aux
 *    réglages et fermer ses fenêtres.
 * 4. **`execute/sync` refuse une promesse** : c'est `execute/async` qui attend,
 *    et il faut lui rendre la main explicitement (`arguments[last]`).
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const SAFARIDRIVER = '/System/Cryptexes/App/usr/bin/safaridriver';
const PORT_DEFAUT = 4444;

/** Attend qu'une condition soit vraie, ou abandonne. */
export async function waitFor(check, { timeout = 20000, interval = 250, label = 'condition' } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, interval));
  }
  throw new Error(`Délai dépassé en attendant : ${label}`);
}

/**
 * Arrête un pilote résiduel.
 *
 * `SIGKILL` est volontaire : `safaridriver` n'a pas de nettoyage à faire, et
 * un arrêt doux laisserait Safari apparié à une session fantôme.
 */
export function arreterPilote() {
  spawnSync('pkill', ['-f', 'safaridriver'], { stdio: 'ignore' });
}

/**
 * Démarre `safaridriver` et rend de quoi l'arrêter.
 *
 * @param {{ port?: number, diagnose?: boolean }} [options]
 * @returns {Promise<{ port: number, arreter: () => void }>}
 */
export async function demarrerPilote(options = {}) {
  if (!existsSync(SAFARIDRIVER)) {
    throw new Error(`safaridriver est introuvable : ${SAFARIDRIVER}`);
  }

  const port = options.port ?? PORT_DEFAUT;
  arreterPilote();
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 1200));

  const args = ['-p', String(port)];
  if (options.diagnose) args.push('--diagnose');

  const child = spawn(SAFARIDRIVER, args, { stdio: 'ignore', detached: false });

  await waitFor(
    async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/status`);
        const body = await response.json();
        return body?.value?.ready === true;
      } catch {
        return false;
      }
    },
    { label: 'démarrage de safaridriver', timeout: 20000 },
  );

  return {
    port,
    arreter() {
      try {
        child.kill('SIGKILL');
      } catch {
        // Déjà arrêté.
      }
    },
  };
}

/**
 * Ouvre une session Safari.
 *
 * @param {{ port?: number, capabilities?: object }} [options]
 * @returns {Promise<object>} le client
 */
export async function ouvrirSession(options = {}) {
  const base = `http://127.0.0.1:${options.port ?? PORT_DEFAUT}`;

  const creer = async () => {
    const response = await fetch(`${base}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capabilities: {
          alwaysMatch: { browserName: 'Safari', ...(options.capabilities ?? {}) },
        },
      }),
    });
    return response.json();
  };

  let created = await creer();

  // Un script interrompu laisse Safari apparié à une session morte, et toute
  // création suivante échoue — constaté après un arrêt par SIGTERM. On reprend
  // quelques fois avant de conclure : c'est un état résiduel, pas un défaut du
  // navigateur, et Safari libère l'appariement de lui-même.
  for (let essai = 0; essai < 4 && !created.value?.sessionId; essai++) {
    if (!/already paired/i.test(created.value?.message ?? '')) break;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 2000));
    created = await creer();
  }

  const sessionId = created.value?.sessionId;

  if (!sessionId) {
    const message = created.value?.message ?? JSON.stringify(created.value);
    // Le seul échec qui demande une action de l'utilisateur mérite d'être nommé
    // avec sa marche à suivre : le reste est un vrai défaut.
    if (/remote automation/i.test(message)) {
      throw new Error(
        'Safari refuse l\'automatisation : activez « Allow remote automation » '
        + 'dans le menu Développeur de Safari (Safari → Réglages → Avancé → '
        + '« Afficher le menu Développeur », puis Développeur → « Autoriser '
        + 'l\'automatisation à distance »).',
      );
    }
    if (/already paired/i.test(message)) {
      throw new Error(
        'Safari reste apparié à une session WebDriver précédente. Fermez les '
        + 'fenêtres d\'automatisation restées ouvertes, ou relancez Safari, '
        + 'puis réessayez.',
      );
    }
    throw new Error(`Session Safari impossible : ${message}`);
  }

  const command = async (method, path, body) => {
    const answer = await fetch(`${base}/session/${sessionId}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return answer.json();
  };

  const api = {
    sessionId,
    capabilities: created.value.capabilities ?? {},

    /** Déroule une réponse de commande et lève sur erreur WebDriver. */
    unwrap(reply, label) {
      const value = reply?.value;
      if (value && typeof value === 'object' && value.error) {
        throw new Error(`${label} : ${value.error} ${value.message ?? ''}`.trim());
      }
      return value;
    },

    send: command,

    /** Navigue puis rend la main. */
    async aller(url) {
      api.unwrap(await command('POST', '/url', { url }), `navigation vers ${url}`);
      return api;
    },

    url: async () => api.unwrap(await command('GET', '/url'), 'lecture de l\'URL'),

    titre: async () => api.unwrap(await command('GET', '/title'), 'lecture du titre'),

    /**
     * Évalue une expression dans la page.
     *
     * Le corps est enveloppé dans `return (…)` : les appels passent donc une
     * simple expression, jamais une fonction complète.
     *
     * @param {string} expression
     * @returns {Promise<any>}
     */
    async evaluer(expression) {
      const reply = await command('POST', '/execute/sync', {
        script: `return (${expression});`,
        args: [],
      });
      return api.unwrap(reply, 'exécution dans la page');
    },

    /**
     * Évalue une promesse de page et attend sa valeur.
     *
     * @param {string} expression
     * @returns {Promise<any>}
     */
    async evaluerAsync(expression) {
      const reply = await command('POST', '/execute/async', {
        script: `const done = arguments[arguments.length - 1];
          Promise.resolve(${expression}).then(
            (v) => done({ ok: true, value: v === undefined ? null : v }),
            (e) => done({ ok: false, erreur: String(e && e.message ? e.message : e) })
          );`,
        args: [],
      });
      const value = api.unwrap(reply, 'exécution asynchrone dans la page');
      if (value?.ok === false) throw new Error(value.erreur);
      return value?.value ?? null;
    },

    /** Exécute un script pour ses effets, sans valeur de retour. */
    async executer(script) {
      return api.unwrap(
        await command('POST', '/execute/sync', { script, args: [] }),
        'exécution de script',
      );
    },

    /**
     * Installe un piège à erreurs qui survit d'une évaluation à l'autre.
     *
     * `window` est le seul état partagé entre deux `execute` : une variable
     * locale ne survivrait pas au prochain appel.
     */
    async installerCollecteErreurs() {
      await api.executer(`
        if (!window.__safariVerif) {
          window.__safariVerif = { erreurs: [], promesses: [] };
          window.addEventListener('error', (e) => {
            window.__safariVerif.erreurs.push(String(e.message || e.type));
          });
          window.addEventListener('unhandledrejection', (e) => {
            window.__safariVerif.promesses.push(
              String(e.reason && e.reason.message ? e.reason.message : e.reason)
            );
          });
        }
        return true;
      `);
    },

    /** Rend les erreurs et rejets non traités recueillis. */
    erreurs: async () => api.evaluer(
      'window.__safariVerif ?? { erreurs: [], promesses: [] }',
    ),

    /** Rend les entrées du journal navigateur, si disponibles. */
    async journal() {
      try {
        const reply = await command('POST', '/log', { type: 'browser' });
        return Array.isArray(reply.value) ? reply.value : [];
      } catch {
        return [];
      }
    },

    async fermer() {
      await fetch(`${base}/session/${sessionId}`, { method: 'DELETE' }).catch(() => null);
    },
  };

  return api;
}
