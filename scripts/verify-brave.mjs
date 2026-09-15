/**
 * Vérifie l'extension de bout en bout dans Brave.
 *
 * Ce script existe parce que mes premières vérifications, écrites à la volée,
 * ont laissé des traces chez l'utilisateur : un navigateur de test encore
 * lancé, et deux téléchargements échoués dans sa page « Téléchargements ».
 *
 * Trois précautions, toutes apprises de cet incident :
 *
 * 1. **Profil isolé**, dans un dossier du projet — jamais le profil réel.
 * 2. **Téléchargements redirigés** vers un dossier du projet, via
 *    `Browser.setDownloadBehavior`. Sans cela, chaque export de test atterrit
 *    dans les Téléchargements de l'utilisateur.
 * 3. **Arrêt par SIGKILL.** Un SIGTERM déclenche la confirmation de fermeture
 *    de Brave — « Downloads are in progress, quit anyway? » — qui reste
 *    affichée à l'écran et bloque l'arrêt.
 *
 * Le navigateur est lancé hors écran et tout est supprimé à la fin.
 */

import { spawnSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE = join(ROOT, '.verify-brave', 'profile');
const DOWNLOADS = join(ROOT, '.verify-brave', 'downloads');
const SANDBOX = join(ROOT, '.verify-brave');
const PORT = 9350;

const BRAVE = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';

/** Attend qu'une condition soit vraie, ou abandonne. */
async function waitFor(check, { timeout = 20000, interval = 250, label = 'condition' } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Délai dépassé en attendant : ${label}`);
}

/** Ouvre une session DevTools et rend une fonction d'évaluation. */
async function connect(url) {
  const ws = new WebSocket(url);
  let next = 1;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  await new Promise((r) => ws.addEventListener('open', r));

  const send = (method, params) =>
    new Promise((res) => {
      const id = next++;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });

  return { ws, send };
}

/** Ferme le navigateur sans déclencher sa boîte de confirmation. */
function shutdown(browser) {
  try {
    browser.kill('SIGKILL');
  } catch {
    // Déjà arrêté.
  }
}

async function main() {
  if (!existsSync(BRAVE)) {
    console.error('Brave est introuvable : rien à vérifier.');
    process.exit(1);
  }

  rmSync(SANDBOX, { recursive: true, force: true });
  mkdirSync(PROFILE, { recursive: true });
  mkdirSync(DOWNLOADS, { recursive: true });

  // Hors écran, pour ne pas surgir devant l'utilisateur.
  const browser = spawn(BRAVE, [
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${PROFILE}`,
    `--disable-extensions-except=${join(ROOT, 'dist', 'extension')}`,
    `--load-extension=${join(ROOT, 'dist', 'extension')}`,
    `--remote-debugging-port=${PORT}`,
    '--window-size=200,200',
    '--window-position=-3000,-3000',
    'about:blank',
  ], { stdio: 'ignore', detached: false });

  const results = [];
  const record = (label, ok, detail = '') => {
    results.push({ label, ok, detail });
    console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  };

  try {
    // 1. Le service worker démarre.
    const targets = await waitFor(async () => {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).catch(() => null);
      return list?.find((t) => (t.url || '').includes('/background.js')) ? list : null;
    }, { label: 'service worker' });

    const worker = targets.find((t) => (t.url || '').includes('/background.js'));
    const id = worker.url.split('/')[2];
    record('le service worker démarre', true, id);

    // 2. Les téléchargements sont redirigés AVANT toute action.
    const version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json());
    const control = await connect(version.webSocketDebuggerUrl);
    await control.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: DOWNLOADS,
      eventsEnabled: true,
    });

    // 3. Collecte, puis export des étiquettes.
    const page = await fetch(`http://127.0.0.1:${PORT}/json/new?chrome-extension://${id}/app.html`, { method: 'PUT' }).then((r) => r.json());
    await new Promise((r) => setTimeout(r, 1500));
    const app = await connect(page.webSocketDebuggerUrl);
    const evaluate = async (expression) => {
      const response = await app.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (response.result?.exceptionDetails) {
        throw new Error(response.result.exceptionDetails.exception?.description ?? 'erreur');
      }
      return response.result?.result?.value;
    };

    // Une URL de contrôle volontairement longue et paramétrée : elle doit
    // arriver normalisée, et le raccourci doit pouvoir la remplacer sans
    // jamais l'effacer.
    const SOURCE_URL = 'https://exemple.fr/article?utm_source=verification&id=42';
    const CLEAN_URL = 'https://exemple.fr/article?id=42';

    await evaluate(`chrome.runtime.sendMessage({ type: 'record-capture', capture: {
      url: '${SOURCE_URL}', title: 'Un article'
    } })`);
    await new Promise((r) => setTimeout(r, 800));
    await evaluate('location.reload()');
    await new Promise((r) => setTimeout(r, 2000));

    /** Attend qu'une expression évaluée dans la page devienne vraie. */
    const waitForEval = (expression, label, timeout = 25000) =>
      waitFor(async () => {
        try {
          const value = await evaluate(expression);
          return value ? value : null;
        } catch {
          return null;
        }
      }, { label, timeout });

    // Après `location.reload()`, les premières évaluations peuvent tomber dans
    // l'ancien contexte d'exécution, en cours de destruction, et renvoyer une
    // page vide : on attend donc que la liste soit réellement reconstruite
    // plutôt que de se fier à un délai fixe.
    const rows = await waitForEval(
      "document.querySelectorAll('#list .link').length || ''",
      'la liste se recharge après rechargement de la page',
    );
    record('le lien collecté apparaît', rows === 1, `${rows} ligne(s)`);
    record('un QR code est rendu', await evaluate("document.querySelectorAll('#preview svg').length") >= 1);

    // --- Les URL de la liste sont cliquables -------------------------------
    const anchor = await evaluate(`(() => {
      const node = document.querySelector('#list .link__url');
      if (!node) return null;
      return {
        tag: node.tagName,
        href: node.getAttribute('href'),
        target: node.getAttribute('target'),
        rel: node.getAttribute('rel'),
        text: node.textContent,
        title: node.getAttribute('title'),
      };
    })()`);
    record(
      'l\'URL de la liste est un lien cliquable',
      anchor?.tag === 'A' && anchor.href === CLEAN_URL && anchor.target === '_blank'
        && (anchor.rel || '').includes('noopener'),
      anchor ? `<${anchor.tag}> ${anchor.href}` : 'aucun nœud trouvé',
    );
    const titleLink = await evaluate(`(() => {
      const node = document.querySelector('#list .link__title');
      return node ? node.tagName + '|' + node.getAttribute('href') : null;
    })()`);
    record('le titre de la liste ouvre la même page', titleLink === `A|${CLEAN_URL}`, String(titleLink));

    // --- Le raccourcisseur est proposé, jamais imposé ----------------------
    const providers = await evaluate(
      "[...document.querySelectorAll('#shortener option')].map(o => o.value)",
    );
    record(
      'les services de raccourcissement sont proposés',
      Array.isArray(providers) && providers.includes('tinyurl') && providers.length >= 3,
      (providers ?? []).join(', '),
    );
    record(
      'le QR vise l\'URL collectée par défaut',
      await evaluate("document.getElementById('qr-target').value") === 'original',
    );
    record(
      'la cible « lien raccourci » est inactive sans raccourci',
      await evaluate(
        "[...document.querySelectorAll('#qr-target option')].find(o => o.value === 'short').disabled",
      ) === true,
    );

    // --- Raccourcissement réel, auprès du service --------------------------
    await evaluate("document.getElementById('shortener').value = 'tinyurl'");
    await evaluate("document.getElementById('shorten').click()");

    const badge = await waitForEval(
      "document.querySelector('#list .link__short-url')?.textContent || ''",
      'lien raccourci obtenu',
    );
    record('le raccourcissement aboutit', /^https:\/\/tinyurl\.com\//.test(badge), badge);

    const stored = await evaluate(`new Promise((resolve) => {
      chrome.storage.local.get('links', (data) => resolve(data.links?.[0] ?? null));
    })`);
    record(
      'l\'URL d\'origine est conservée intacte',
      stored?.url === CLEAN_URL && stored?.shortUrl === badge && stored?.shortProvider === 'tinyurl',
      `url=${stored?.url} short=${stored?.shortUrl}`,
    );
    record(
      'le raccourci est visible dans la liste',
      await evaluate("document.querySelectorAll('#list .link__short').length") === 1,
    );

    // --- La cible choisie pilote réellement la sortie imprimée -------------
    await evaluate(`(() => {
      const select = document.getElementById('qr-target');
      select.value = 'short';
      select.dispatchEvent(new Event('change'));
    })()`);
    await new Promise((r) => setTimeout(r, 500));
    record(
      'la cible « lien raccourci » devient active',
      await evaluate("document.getElementById('qr-target').value") === 'short',
    );

    // --- Export des données : le raccourci est consigné, pas substitué -----
    await evaluate("document.getElementById('export-csv').click()");
    const csvName = await waitFor(
      () => readdirSync(DOWNLOADS).find((name) => name.endsWith('.csv')),
      { label: 'CSV téléchargé' },
    );
    const csv = readFileSync(join(DOWNLOADS, csvName), 'utf8');
    record(
      'le CSV garde l\'URL d\'origine et ajoute le raccourci',
      csv.includes(CLEAN_URL) && csv.includes(badge) && csv.includes('URL courte'),
    );

    // --- Export des images : la cible choisie est bien celle encodée -------
    await evaluate(`[...document.querySelectorAll('.tab')].find(t => t.dataset.mode === 'images').click()`);
    await new Promise((r) => setTimeout(r, 800));
    record('le bouton d\'export est actif', (await evaluate("!document.getElementById('export-labels').disabled")) === true);

    await evaluate(`document.getElementById('export-labels').click()`);

    // 4. Le fichier doit réellement arriver sur le disque.
    const archive = await waitFor(
      () => readdirSync(DOWNLOADS).find((name) => name.endsWith('.zip')),
      { label: 'archive téléchargée', timeout: 20000 },
    );

    const path = join(DOWNLOADS, archive);
    const bytes = readFileSync(path);
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;

    record('l\'archive est téléchargée', isZip, `${archive}, ${statSync(path).size} octets`);
    record('aucun téléchargement partiel', readdirSync(DOWNLOADS).every((n) => !n.endsWith('.crdownload')));

    // 5. L'archive contient bien les étiquettes.
    const report = spawnSync('/usr/bin/unzip', ['-t', path], { encoding: 'utf8' });
    record('l\'archive est valide', /No errors detected/.test(report.stdout ?? ''));

    const listing = spawnSync('/usr/bin/unzip', ['-l', path], { encoding: 'utf8' }).stdout ?? '';
    record('les images d\'étiquettes sont présentes', /etiquettes\/.*\.png/.test(listing));
    record('la planche imprimable est présente', listing.includes('planche.html'));
    record('le CSV de correspondance est présent', listing.includes('liens.csv'));

    // Le fichier d'étiquettes doit encoder le lien court ET conserver le long.
    const labelCsv = spawnSync(
      '/usr/bin/unzip', ['-p', path, 'liens.csv'], { encoding: 'utf8' },
    ).stdout ?? '';
    record(
      'l\'étiquette encode le lien court, l\'archive garde le long',
      labelCsv.includes(badge) && labelCsv.includes(CLEAN_URL),
      labelCsv.split('\n')[1]?.trim().slice(0, 90) ?? '',
    );

    // --- La fenêtre de l'extension offre les mêmes liens cliquables --------
    // Elle suit un autre chemin de code que l'application : même collection,
    // autre rendu, autre bundle.
    const popupTarget = await fetch(
      `http://127.0.0.1:${PORT}/json/new?chrome-extension://${id}/popup.html`,
      { method: 'PUT' },
    ).then((r) => r.json());
    await new Promise((r) => setTimeout(r, 1500));
    const popup = await connect(popupTarget.webSocketDebuggerUrl);
    const popupEval = async (expression) => {
      const response = await popup.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      return response.result?.result?.value;
    };

    const popupAnchor = await popupEval(`(() => {
      const node = document.querySelector('#list .item__url');
      return node ? [node.tagName, node.getAttribute('href'), node.getAttribute('target')].join('|') : null;
    })()`);
    record(
      "la fenêtre de l'extension rend aussi des liens cliquables",
      popupAnchor === `A|${CLEAN_URL}|_blank`,
      String(popupAnchor),
    );
    record(
      'la fenêtre affiche le raccourci',
      (await popupEval("document.querySelectorAll('#list .item__short').length")) === 1,
    );
    popup.ws.close();

    app.ws.close();
    control.ws.close();
  } catch (error) {
    record('vérification interrompue', false, error.message);
  } finally {
    shutdown(browser);
    await new Promise((r) => setTimeout(r, 800));
    rmSync(SANDBOX, { recursive: true, force: true });
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`\n${results.length - failed.length}/${results.length} vérifications réussies.`);
  process.exit(failed.length === 0 ? 0 : 1);
}

await main();
