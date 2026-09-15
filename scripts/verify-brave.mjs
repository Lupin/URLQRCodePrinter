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
import {
  existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Les fichiers d'import sont fabriqués avec les écrivains de l'application :
// ce qu'on teste est donc exactement ce qu'elle produit, pas une approximation.
import { toJson, toCsv } from '../src/core/exporters.js';
import { createZip } from '../src/core/zip.js';

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
        // Nommer l'extrait fautif : « erreur » sans localisation ne se diagnostique pas.
        const said = response.result.exceptionDetails.exception?.description ?? 'erreur';
        const where = String(expression).replace(/\s+/g, ' ').slice(0, 140);
        throw new Error(`${said} — dans : ${where}`);
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

    /**
     * Attend l'arrivée d'un fichier téléchargé, puis le renvoie.
     *
     * Les exports texte et le classeur sont déclenchés depuis la page : leur
     * nom dépend du nom de collection, d'où cette attente plutôt qu'une lecture
     * directe du dossier.
     *
     * @param {'md'|'csv-export'|'xlsx'|'zip'} kind
     * @returns {Promise<string>} nom du fichier
     */
    /** Horodatage de chaque fichier du dossier de téléchargements. */
    const snapshot = () => new Map(
      readdirSync(DOWNLOADS).map((name) => {
        try {
          return [name, statSync(join(DOWNLOADS, name)).mtimeMs];
        } catch {
          return [name, 0];
        }
      }),
    );

    const waitForFile = async (kind) => {
      const before = snapshot();
      const button = {
        md: 'export-md',
        'csv-export': 'export-csv',
        xlsx: 'export-xlsx',
        zip: 'export-labels',
      }[kind];
      // Le fichier apparaît sur le disque avant que l'application ait terminé :
      // un clic immédiat tombe sur un bouton encore désactivé et ne fait rien.
      await waitFor(
        () => evaluate(`!document.getElementById('${button}').disabled`).catch(() => false),
        { label: `bouton ${button} réactivé`, timeout: 30000 },
      );
      await evaluate(`document.getElementById('${button}').click()`);
      const extension = kind === 'csv-export' ? '.csv' : `.${kind}`;
      try {
        return await waitFor(
          // On compare les horodatages, pas les noms : deux exports lancés dans
          // la même minute produisent le même nom de fichier, et le second
          // écrase le premier — un fichier « nouveau » n'apparaîtrait jamais.
          () => readdirSync(DOWNLOADS).find((name) => {
            // `x.zip.crdownload` contient `.zip` : lire un téléchargement en
            // cours donnait un fichier tronqué, donc des échecs intermittents.
            if (name.endsWith('.crdownload')) return false;
            if (!name.includes(extension)) return false;
            const seen = before.get(name);
            if (seen === undefined) return true;
            try {
              return statSync(join(DOWNLOADS, name)).mtimeMs > seen;
            } catch {
              return false;
            }
          }),
          { label: `téléchargement ${kind}`, timeout: 60000 },
        );
      } catch (error) {
        // Un délai dépassé sans inventaire ne se diagnostique pas.
        throw new Error(
          `${error.message} — dossier : ${readdirSync(DOWNLOADS).join(', ') || 'vide'}`,
        );
      }
    };

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

    // --- Planches : les cotes commerciales sont proposées -------------------
    const sheetGroups = await evaluate(`(() => {
      const select = document.getElementById('preset');
      return [...select.querySelectorAll('optgroup')].map((group) => ({
        label: group.label,
        values: [...group.children].map((option) => option.value),
      }));
    })()`);
    const allPresets = (sheetGroups ?? []).flatMap((group) => group.values);
    record(
      'les planches sont groupées par famille',
      Array.isArray(sheetGroups) && sheetGroups.length >= 3,
      (sheetGroups ?? []).map((g) => g.label).join(' | '),
    );
    record(
      'les références Avery sont proposées',
      ['avery-l7160', 'avery-l7159', 'avery-5160', 'zweckform-3475'].every((key) =>
        allPresets.includes(key)),
      `${allPresets.length} dispositions`,
    );

    // Chaque référence doit produire la grille annoncée sur son emballage,
    // mesurée ici sur la page réellement affichée.
    const grids = await evaluate(`(async () => {
      const select = document.getElementById('preset');
      const info = document.getElementById('sheet-info');
      const out = {};
      for (const key of ['avery-l7160', 'avery-l7159', 'avery-5160', 'avery-5162']) {
        select.value = key;
        select.dispatchEvent(new Event('change'));
        await new Promise((r) => setTimeout(r, 60));
        out[key] = info.textContent.trim();
      }
      select.value = 'a4-3x8';
      select.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r, 60));
      return out;
    })()`);
    record(
      'la planche L7160 place 21 étiquettes (3 × 7)',
      /3 × 7 = 21/.test(grids?.['avery-l7160'] ?? ''),
      grids?.['avery-l7160'],
    );
    record(
      'la planche L7159 place 24 étiquettes (3 × 8)',
      /3 × 8 = 24/.test(grids?.['avery-l7159'] ?? ''),
      grids?.['avery-l7159'],
    );
    record(
      'la planche 5160 place 30 étiquettes (3 × 10)',
      /3 × 10 = 30/.test(grids?.['avery-5160'] ?? ''),
      grids?.['avery-5160'],
    );
    record(
      'la planche 5162 place 14 étiquettes (2 × 7)',
      /2 × 7 = 14/.test(grids?.['avery-5162'] ?? ''),
      grids?.['avery-5162'],
    );

    // --- Étiquette Niimbot : aperçu sans imprimante ------------------------
    await evaluate(`[...document.querySelectorAll('.tab')].find(t => t.dataset.mode === 'single').click()`);
    await new Promise((r) => setTimeout(r, 600));

    const noPrinter = await evaluate(`(() => {
      const canvas = document.querySelector('#preview canvas');
      return {
        hasCanvas: Boolean(canvas),
        width: canvas ? canvas.width : 0,
        height: canvas ? canvas.height : 0,
        dot: document.getElementById('printer-dot').className,
        hint: document.getElementById('profile-hint').textContent,
        caption: document.querySelector('#preview .hint')?.textContent ?? '',
        profiles: [...document.getElementById('label-profile').options].map((o) => o.value),
      };
    })()`);
    record('aucune imprimante n\'est connectée', String(noPrinter?.dot).includes('dot--off'));
    record(
      "l'aperçu d'étiquette est rendu sans imprimante",
      noPrinter?.hasCanvas === true && noPrinter.width > 0 && noPrinter.height > 0,
      noPrinter ? `${noPrinter.width} × ${noPrinter.height} px` : 'aucun canvas',
    );
    record(
      "l'aperçu annonce le profil utilisé, hors ligne",
      /sans imprimante connectée/.test(noPrinter?.hint ?? '')
        && /D110/.test(noPrinter?.caption ?? ''),
      noPrinter?.caption,
    );

    // Le format M2 doit pouvoir être prévisualisé aussi, sans le posséder.
    const m2 = await evaluate(`(async () => {
      const select = document.getElementById('label-profile');
      select.value = 'M2';
      select.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r, 300));
      const canvas = document.querySelector('#preview canvas');
      return {
        width: canvas ? canvas.width : 0,
        caption: document.querySelector('#preview .hint')?.textContent ?? '',
      };
    })()`);
    record(
      'un second format se prévisualise aussi',
      (noPrinter?.profiles ?? []).includes('M2') && m2.width > noPrinter.width,
      `D110 ${noPrinter?.width} px → M2 ${m2.width} px`,
    );

    // L'impression, elle, reste impossible sans matériel.
    record(
      'impression impossible sans imprimante',
      await evaluate("document.getElementById('print-label').disabled") === true,
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
      () => readdirSync(DOWNLOADS).find(
        (name) => name.endsWith('.zip') && !name.endsWith('.crdownload'),
      ),
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
    await new Promise((r) => setTimeout(r, 800));
    const popup = await connect(popupTarget.webSocketDebuggerUrl);
    const popupEval = async (expression) => {
      const response = await popup.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      return response.result?.result?.value;
    };

    // La fenêtre lit le stockage puis dessine la collection : avec trente
    // étiquettes, un délai fixe suffisait la plupart du temps — et échouait
    // parfois. On attend donc que la liste existe vraiment.
    await waitFor(
      async () => {
        try {
          return (await popupEval("document.querySelectorAll('#list .item').length || ''")) !== '';
        } catch {
          return false;
        }
      },
      { label: 'la fenêtre affiche sa liste', timeout: 20000 },
    );

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

    // --- La page ne doit pas travailler sur une feuille de style périmée ---
    const freshness = await evaluate(`(() => ({
      bannerShown: !document.getElementById('stale-style').hidden,
      stylesheet: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.getAttribute('href')),
      scripts: [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')),
      cellPosition: (() => {
        const probe = document.createElement('div');
        probe.className = 'print-cell';
        document.body.appendChild(probe);
        const position = getComputedStyle(probe).position;
        probe.remove();
        return position;
      })(),
    }))()`);
    record(
      'aucun bandeau de feuille de style obsolète',
      freshness.bannerShown === false,
      `position calculée : ${freshness.cellPosition}`,
    );
    record(
      'les ressources sont versionnées par leur contenu',
      (freshness.stylesheet ?? []).every((href) => /\?v=[0-9a-f]{12}$/.test(href ?? ''))
        && (freshness.scripts ?? []).every((src) => /\?v=[0-9a-f]{12}$/.test(src ?? '')),
      [...freshness.stylesheet, ...freshness.scripts].join(', '),
    );

    // --- Nommer la collection, et remplir les champs exportés -------------
    //
    // Ces champs partent dans les exports : ils doivent être saisissables, et
    // ce qu'on saisit doit se retrouver tel quel dans les fichiers produits.
    const named = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));

      const nameField = document.getElementById('collection-name');
      nameField.value = 'Veille du vendredi';
      nameField.dispatchEvent(new Event('input'));
      await pause(200);

      // Édition du premier lien : titre, tags, note.
      document.querySelector('#list .link__edit').click();
      await pause(150);

      const inputs = [...document.querySelectorAll('#list .link__editor-form input')];
      if (inputs.length !== 3) return { error: inputs.length + ' champ(s) au lieu de 3' };
      const [title, tags, note] = inputs;
      title.value = 'Titre saisi à la main';
      tags.value = 'veille,  travail , veille';
      note.value = 'Note saisie à la main';
      title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await pause(500);

      const stored = await new Promise((resolve) => {
        chrome.storage.local.get('links', (data) => resolve(data.links?.[0] ?? null));
      });

      const chip = document.querySelector('#list .tag');
      const chipLabel = chip ? chip.textContent : '';
      if (chip) { chip.click(); await pause(200); }
      const filtered = document.querySelectorAll('#list .link').length;
      document.getElementById('search').value = '';
      document.getElementById('search').dispatchEvent(new Event('input'));
      await pause(200);

      return {
        title: stored?.title,
        tags: stored?.tags,
        note: stored?.note,
        chipLabel,
        filtered,
        documentTitle: document.title,
      };
    })()`);

    record(
      'le titre, les tags et la note sont saisissables',
      named?.title === 'Titre saisi à la main'
        && named?.note === 'Note saisie à la main'
        && Array.isArray(named?.tags),
      named?.error ?? `titre « ${named?.title} », note « ${named?.note} »`,
    );
    record(
      'les tags sont normalisés (dédoublonnés, sans espaces)',
      JSON.stringify(named?.tags) === JSON.stringify(['veille', 'travail']),
      JSON.stringify(named?.tags),
    );
    record(
      'une puce de tag filtre la collection',
      named?.chipLabel === '#veille' && named?.filtered === 1,
      `${named?.chipLabel} → ${named?.filtered} lien(s)`,
    );
    record(
      'le nom de la collection devient le titre de la page',
      named?.documentTitle === 'Veille du vendredi — URLQRCodePrinter',
      named?.documentTitle,
    );

    // --- Ce qui est saisi doit ressortir dans les exports ------------------
    const mdName = await waitForFile('md');
    const markdown = readFileSync(join(DOWNLOADS, mdName), 'utf8');
    record(
      'le Markdown porte le nom de la collection comme titre',
      markdown.includes('# Veille du vendredi')
        && /^title: "Veille du vendredi"$/m.test(markdown),
      mdName,
    );
    record(
      'le Markdown reprend le titre, les tags et la note saisis',
      markdown.includes('Titre saisi à la main')
        && markdown.includes('#veille')
        && markdown.includes('Note saisie à la main'),
      markdown.split('\n').find((line) => line.includes('Titre saisi')) ?? '',
    );
    record(
      'le fichier Markdown porte le nom de la collection',
      mdName.startsWith('Veille-du-vendredi-'),
      mdName,
    );

    const namedCsv = await waitForFile('csv-export');
    const csvExport = readFileSync(join(DOWNLOADS, namedCsv), 'utf8');
    record(
      'le CSV reprend les mêmes champs',
      csvExport.includes('Titre saisi à la main')
        && csvExport.includes('veille travail')
        && csvExport.includes('Note saisie à la main'),
    );

    const xlsxName = await waitForFile('xlsx');
    const xlsxSheet = spawnSync(
      '/usr/bin/unzip', ['-p', join(DOWNLOADS, xlsxName), 'xl/worksheets/sheet1.xml'],
      { encoding: 'utf8' },
    ).stdout ?? '';
    // Le détail de ce qui manque est reporté : « échec » sans dire quoi est un
    // diagnostic inutilisable.
    const wanted = {
      titre: 'Titre saisi à la main',
      tags: 'veille travail',
      note: 'Note saisie à la main',
    };
    const missing = Object.entries(wanted)
      .filter(([, text]) => !xlsxSheet.includes(text))
      .map(([field]) => field);
    record(
      'le classeur reprend les mêmes champs',
      missing.length === 0,
      missing.length === 0
        ? xlsxName
        : `${xlsxName} — manquant : ${missing.join(', ')} (colonnes : ${
          (xlsxSheet.match(/<t[^>]*>([^<]*)<\/t>/g) ?? []).slice(0, 9).join(' ')}`,
    );

    // --- Matrice de mise en page, mesurée sur le rendu réel ----------------
    //
    // C'est ce bloc qui manquait quand la planche s'affichait en une seule
    // colonne : la géométrie était juste, mais appliquée uniquement à
    // l'impression. On mesure donc ici le DOM tel que le navigateur le calcule.
    await evaluate(`(async () => {
      for (let i = 0; i < 30; i++) {
        await chrome.runtime.sendMessage({ type: 'record-capture', capture: {
          url: 'https://exemple.fr/page-' + i, title: 'Page ' + i } });
      }
    })()`);
    await evaluate('location.reload()');
    await waitForEval("document.querySelectorAll('#list .link').length >= 30 || ''", 'la collection de 30 liens');
    await evaluate(`[...document.querySelectorAll('.tab')].find(t => t.dataset.mode === 'sheet').click()`);
    await new Promise((r) => setTimeout(r, 600));

    /**
     * Mesure la première page de la planche pour un préréglage donné.
     * @param {string} preset
     */
    const measureSheet = (preset) => evaluate(`(async () => {
      const select = document.getElementById('preset');
      select.value = ${JSON.stringify(preset)};
      select.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r, 250));

      const page = document.querySelector('#preview .print-page');
      if (!page) return { error: 'aucune page rendue' };

      const pageRect = page.getBoundingClientRect();
      const pageStyle = getComputedStyle(page);
      const cells = [...page.querySelectorAll('.print-cell')].map((cell) => {
        const rect = cell.getBoundingClientRect();
        const box = cell.querySelector('.print-cell__qr');
        const svg = cell.querySelector('svg');
        const text = cell.querySelector('.print-cell__text');
        return {
          x: rect.x, y: rect.y, w: rect.width, h: rect.height,
          position: getComputedStyle(cell).position,
          overflow: getComputedStyle(cell).overflow,
          boxW: box ? box.getBoundingClientRect().width : 0,
          svgW: svg ? svg.getBoundingClientRect().width : 0,
          textOverflow: text ? text.scrollHeight > text.clientHeight + 1 : false,
          textClipped: cell.scrollHeight > cell.clientHeight + 1,
        };
      });

      const paper = document.getElementById('print-page-size');
      return {
        count: cells.length,
        info: document.getElementById('sheet-info').textContent.trim(),
        page: { x: pageRect.x, y: pageRect.y, w: pageRect.width, h: pageRect.height },
        pagePosition: pageStyle.position,
        pageOverflow: pageStyle.overflow,
        paper: paper ? paper.textContent : '',
        cells,
      };
    })()`);

    /** Vérifie une page mesurée contre le préréglage attendu. */
    const checkSheet = (preset, expected) => {
      const label = `${preset} (${expected.columns} × ${expected.rows})`;
      const sheet = measured[preset];
      if (!sheet || sheet.error) {
        record(`planche ${label}`, false, sheet?.error ?? 'non mesurée');
        return;
      }

      const xs = new Set(sheet.cells.map((c) => Math.round(c.x)));
      const ys = new Set(sheet.cells.map((c) => Math.round(c.y)));
      const expectedCount = Math.min(30, expected.columns * expected.rows);

      const problems = [];
      if (sheet.cells.length !== expectedCount) {
        problems.push(`${sheet.cells.length} étiquettes au lieu de ${expectedCount}`);
      }
      if (xs.size !== expected.columns) problems.push(`${xs.size} colonnes au lieu de ${expected.columns}`);
      if (ys.size !== Math.min(expected.rows, Math.ceil(expectedCount / expected.columns))) {
        problems.push(`${ys.size} rangées inattendues`);
      }
      if (sheet.cells.some((c) => c.position !== 'absolute')) problems.push('cellule non positionnée');
      if (sheet.cells.some((c) => c.overflow !== 'hidden')) problems.push('débordement non masqué');
      if (sheet.cells.some((c) => Math.abs(c.svgW - c.boxW) > 1.5)) {
        problems.push('QR plus large que sa boîte');
      }
      if (sheet.cells.some((c) => c.textClipped || c.textOverflow)) problems.push('texte rogné');
      if (sheet.cells.some((c) => c.x < sheet.page.x - 1 || c.y < sheet.page.y - 1)) {
        problems.push('étiquette hors de la page');
      }
      if (sheet.cells.some((c) =>
        c.x + c.w > sheet.page.x + sheet.page.w + 1.5 || c.y + c.h > sheet.page.y + sheet.page.h + 1.5)) {
        problems.push('étiquette débordant de la page');
      }

      // Aucune superposition : c'est le défaut vu à l'écran.
      const overlaps = [];
      for (let a = 0; a < sheet.cells.length; a++) {
        for (let b = a + 1; b < sheet.cells.length; b++) {
          const one = sheet.cells[a];
          const two = sheet.cells[b];
          if (one.x < two.x + two.w - 1 && two.x < one.x + one.w - 1
            && one.y < two.y + two.h - 1 && two.y < one.y + one.h - 1) {
            overlaps.push(`${a}/${b}`);
          }
        }
      }
      if (overlaps.length > 0) problems.push(`${overlaps.length} chevauchement(s)`);

      // La taille d'une étiquette doit correspondre à ses millimètres.
      const scale = sheet.page.w / expected.pageWidthMm;
      const first = sheet.cells[0];
      if (Math.abs(first.w - expected.labelWidthMm * scale) > 2) {
        problems.push(`largeur ${Math.round(first.w)} px pour ${expected.labelWidthMm} mm`);
      }
      if (Math.abs(first.h - expected.labelHeightMm * scale) > 2) {
        problems.push(`hauteur ${Math.round(first.h)} px pour ${expected.labelHeightMm} mm`);
      }
      if (!sheet.paper.includes(`${expected.pageWidthMm}mm ${expected.pageHeightMm}mm`)) {
        problems.push(`papier « ${sheet.paper} »`);
      }

      record(
        `planche ${label}`,
        problems.length === 0,
        problems.length === 0
          ? `${xs.size} colonnes × ${ys.size} rangées, ${sheet.cells.length} étiquettes, `
            + `${Math.round(first.w)} × ${Math.round(first.h)} px`
          : problems.join(' ; '),
      );
    };

    const SHEET_CASES = {
      'a4-3x8': { columns: 3, rows: 8, labelWidthMm: 63.5, labelHeightMm: 33.9, pageWidthMm: 210, pageHeightMm: 297 },
      'avery-l7160': { columns: 3, rows: 7, labelWidthMm: 63.5, labelHeightMm: 38.1, pageWidthMm: 210, pageHeightMm: 297 },
      'avery-l7162': { columns: 2, rows: 8, labelWidthMm: 99.1, labelHeightMm: 33.9, pageWidthMm: 210, pageHeightMm: 297 },
      'zweckform-3475': { columns: 3, rows: 8, labelWidthMm: 70, labelHeightMm: 36, pageWidthMm: 210, pageHeightMm: 297 },
      'avery-5160': { columns: 3, rows: 10, labelWidthMm: 66.7, labelHeightMm: 25.4, pageWidthMm: 215.9, pageHeightMm: 279.4 },
      'avery-5163': { columns: 2, rows: 5, labelWidthMm: 101.6, labelHeightMm: 50.8, pageWidthMm: 215.9, pageHeightMm: 279.4 },
      'a4-qr-3x4': { columns: 3, rows: 4, labelWidthMm: 60, labelHeightMm: 60, pageWidthMm: 210, pageHeightMm: 297 },
    };

    const measured = {};
    for (const preset of Object.keys(SHEET_CASES)) measured[preset] = await measureSheet(preset);
    for (const [preset, expected] of Object.entries(SHEET_CASES)) checkSheet(preset, expected);

    // --- Sensibilité aux réglages -----------------------------------------
    const tweaks = await evaluate(`(async () => {
      const preset = document.getElementById('preset');
      const slider = document.getElementById('sheet-qr');
      const offsetX = document.getElementById('sheet-offset-x');
      const offsetY = document.getElementById('sheet-offset-y');
      const info = document.getElementById('sheet-qr-info');
      const pause = () => new Promise((r) => setTimeout(r, 220));

      const qrWidth = () => {
        const svg = document.querySelector('#preview .print-cell svg');
        return svg ? svg.getBoundingClientRect().width : 0;
      };
      const firstCell = () => {
        const cell = document.querySelector('#preview .print-cell');
        const rect = cell.getBoundingClientRect();
        return { x: rect.x, y: rect.y };
      };

      preset.value = 'avery-l7160';
      preset.dispatchEvent(new Event('change'));
      offsetX.value = '0'; offsetX.dispatchEvent(new Event('input'));
      offsetY.value = '0'; offsetY.dispatchEvent(new Event('input'));
      await pause();

      // Les bornes du curseur sont calculées : on les interroge plutôt que de
      // supposer 30 et 100 %.
      slider.value = slider.min; slider.dispatchEvent(new Event('input'));
      await pause();
      const small = qrWidth();
      const smallInfo = info.textContent;

      slider.value = slider.max; slider.dispatchEvent(new Event('input'));
      await pause();
      const big = qrWidth();
      const bigInfo = info.textContent;

      slider.value = '70'; slider.dispatchEvent(new Event('input'));
      await pause();
      const base = firstCell();
      const baseQr = qrWidth();

      offsetX.value = '3'; offsetX.dispatchEvent(new Event('input'));
      offsetY.value = '2'; offsetY.dispatchEvent(new Event('input'));
      await pause();
      const moved = firstCell();
      const movedQr = qrWidth();

      offsetX.value = '-4'; offsetX.dispatchEvent(new Event('input'));
      offsetY.value = '-3'; offsetY.dispatchEvent(new Event('input'));
      await pause();
      const back = firstCell();

      offsetX.value = '0'; offsetX.dispatchEvent(new Event('input'));
      offsetY.value = '0'; offsetY.dispatchEvent(new Event('input'));
      slider.value = '70'; slider.dispatchEvent(new Event('input'));
      preset.value = 'a4-3x8'; preset.dispatchEvent(new Event('change'));
      await pause();

      // L'échelle de l'aperçu dépend de la largeur du panneau : on la déduit
      // de l'étiquette elle-même (63,5 mm pour la L7160) plutôt que de la
      // supposer. Un aperçu « ajusté au panneau » ne vaut jamais exactement le
      // plafond de 60 %.
      const cellW = document.querySelector('#preview .print-cell').getBoundingClientRect().width;
      const pxPerMm = cellW / 63.5;
      return {
        small, big, smallInfo, bigInfo, baseQr, movedQr, pxPerMm,
        dx: moved.x - base.x, dy: moved.y - base.y,
        backDx: base.x - back.x, backDy: base.y - back.y,
      };
    })()`);

    record(
      'le curseur de largeur du QR agit sur le rendu',
      tweaks.big > tweaks.small * 2,
      `${Math.round(tweaks.small)} px au minimum → ${Math.round(tweaks.big)} px au maximum`,
    );
    // Le rognage était auparavant *signalé* au-delà de la place disponible.
    // Le curseur étant désormais borné, cette situation n'est plus atteignable :
    // le contrôle vérifie donc que la demande extrême ne rogne rien.
    record(
      'le maximum du curseur ne provoque aucun rognage',
      !/rogné/.test(tweaks.bigInfo ?? '') && /mm par module/.test(tweaks.bigInfo ?? ''),
      tweaks.bigInfo?.slice(-90),
    );
    record(
      'le décalage déplace la grille, sans la déformer',
      // Aller : +3 mm et +2 mm. Retour : −4 mm et −3 mm, donc 4 mm et 3 mm
      // d'écart par rapport à la position d'origine.
      Math.abs(tweaks.dx - 3 * tweaks.pxPerMm) < 1.5
        && Math.abs(tweaks.dy - 2 * tweaks.pxPerMm) < 1.5
        && Math.abs(tweaks.backDx - 4 * tweaks.pxPerMm) < 1.5
        && Math.abs(tweaks.backDy - 3 * tweaks.pxPerMm) < 1.5
        && Math.abs(tweaks.movedQr - tweaks.baseQr) < 1.5,
      `+3 mm → ${tweaks.dx.toFixed(1)} px, −4 mm → ${tweaks.backDx.toFixed(1)} px `
        + `(attendu ${(4 * tweaks.pxPerMm).toFixed(1)} px à ${tweaks.pxPerMm.toFixed(2)} px/mm)`,
    );

    // --- Date imprimée sous le QR code -----------------------------------
    //
    // Chaque ligne sous le QR se paie en place disponible : la date doit
    // apparaître dans les quatre mises en forme, et faire céder le QR.
    const dated = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const select = document.getElementById('date-mode');
      const slider = document.getElementById('sheet-qr');
      const hint = document.getElementById('date-hint');
      const preset = document.getElementById('preset');

      // La même planche, sans puis avec la date.
      const inspectSheet = async () => {
        const cell = document.querySelector('#preview .print-page:first-child .print-cell');
        const spans = [...(cell?.querySelectorAll('.print-cell__text span') ?? [])];
        return {
          side: cell ? cell.querySelector('.print-cell__qr').getBoundingClientRect().width : 0,
          lines: spans.map((s) => s.textContent),
          hasDateClass: spans.some((s) => s.classList.contains('print-cell__date')),
          overflow: cell ? cell.scrollHeight > cell.clientHeight + 1 : null,
          max: Number(slider.max),
        };
      };

      preset.value = 'avery-l7160';
      preset.dispatchEvent(new Event('change'));
      select.value = 'none';
      select.dispatchEvent(new Event('change'));
      await pause(350);
      const none = await inspectSheet();
      const hintNone = hint.textContent;

      select.value = 'datetime';
      select.dispatchEvent(new Event('change'));
      await pause(350);
      const withDate = await inspectSheet();

      // Le tableau : une colonne « Date » doit apparaître.
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
      await pause(400);
      const tableHeaders = [...document.querySelectorAll('#preview .print-table th')]
        .map((th) => th.textContent);
      // Forme « JJ/MM/AAAA HH:MM » testée sans expression régulière : dans un
      // littéral de gabarit, « \d » deviendrait « d » et casserait la syntaxe
      // envoyée à la page.
      const looksLikeDateTime = (text) => typeof text === 'string'
        && text.length === 16 && text[2] === '/' && text[5] === '/'
        && text[10] === ' ' && text[13] === ':';
      const tableDates = [...document.querySelectorAll('#preview .print-table td')]
        .map((td) => td.textContent)
        .filter(looksLikeDateTime);

      // L'étiquette Niimbot : l'aperçu doit être plus haut d'une ligne.
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click();
      await pause(500);
      const single = (() => {
        const canvas = document.querySelector('#preview canvas');
        return canvas ? canvas.height : 0;
      })();

      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
      await pause(300);

      // L'export d'images est déclenché après coup, pour attendre un fichier
      // réellement nouveau dans le dossier de téléchargements. Le mode de date
      // doit donc rester actif jusqu'à cet export : on ne le remet à zéro
      // qu'une fois l'archive vérifiée, plus bas.
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'images').click();
      await pause(300);

      return { none, withDate, hintNone, tableHeaders, tableDates, single };
    })()`);

    record(
      'la date se glisse sous le QR, sur sa propre ligne',
      dated.withDate.lines.length === dated.none.lines.length + 1
        && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(dated.withDate.lines.at(-1) ?? '')
        && dated.withDate.hasDateClass === true,
      dated.withDate.lines.join(' | '),
    );
    record(
      'la date fait céder le QR au lieu de le rogner',
      dated.withDate.max < dated.none.max && dated.withDate.overflow === false,
      `borne haute du curseur ${dated.none.max} % → ${dated.withDate.max} % `
        + '(la date prend une ligne, le QR doit en laisser deux)',
    );
    record(
      'sans date, rien n\'est imprimé',
      dated.none.lines.length >= 1 && /Aucune date/.test(dated.hintNone),
      dated.none.lines.join(' | '),
    );
    record(
      'le tableau imprimé gagne une colonne de date',
      dated.tableHeaders.includes('Date') && dated.tableDates.length >= 1,
      `${dated.tableHeaders.join(' / ')} — ${dated.tableDates[0] ?? 'aucune date'}`,
    );
    record(
      'l\'étiquette Niimbot réserve la ligne de date',
      dated.single > 0,
      `aperçu de ${dated.single} px de haut`,
    );

    // La planche est d'abord produite au format par défaut (12 mm), où la date
    // ne tient pas : elle doit alors être **absente**, jamais amputée.
    const datedZip = await waitForFile('zip');
    const readEntry = (zip, entry) =>
      spawnSync('/usr/bin/unzip', ['-p', join(DOWNLOADS, zip), entry], { encoding: 'utf8' }).stdout ?? '';

    const narrowSheet = readEntry(datedZip, 'planche.html');
    const narrowManifest = JSON.parse(readEntry(datedZip, 'export.json'));
    const narrowCaptions = narrowSheet.match(/<figcaption>[\s\S]*?<\/figcaption>/g) ?? [];
    /** Une date partielle : « 15/09/ » ou « 15/09/2026 » sans l'heure demandée. */
    const partialDate = /\d{2}\/\d{2}\/?\s*(<|$)/.test(
      narrowCaptions.map((c) => c.replace(/<[^>]+>/g, '')).join(' '),
    );

    record(
      'sur une étiquette de 12 mm, la date est abandonnée plutôt qu\'amputée',
      narrowManifest.datesOmitted >= 1 && partialDate === false,
      `${datedZip} — ${narrowManifest.datesOmitted} date(s) abandonnée(s), `
        + `mode « ${narrowManifest.settings.dateMode} »`,
    );

    // Puis sur une étiquette large, où elle doit apparaître complète. On ne
    // coche qu'un lien : une étiquette de 70 × 40 mm à 300 dpi fait 827 × 472
    // pixels, et en rendre trente prendrait des minutes pour rien.
    await evaluate(`(async () => {
      const format = document.getElementById('label-format');
      format.value = 'generic-70x40';
      format.dispatchEvent(new Event('change'));
      document.querySelector('#list .link__check').click();
      await new Promise((r) => setTimeout(r, 500));
    })()`);
    const wideZip = await waitForFile('zip');
    const wideSheet = readEntry(wideZip, 'planche.html');
    const wideCaptions = (wideSheet.match(/<figcaption>[\s\S]*?<\/figcaption>/g) ?? [])
      .map((c) => c.replace(/<[^>]+>/g, ' '))
      .join(' ');
    const completeDate = (wideCaptions.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/) ?? [''])[0];

    record(
      'sur une étiquette large, la date est imprimée complète',
      completeDate !== '',
      `${wideZip} — « ${completeDate} »`,
    );

    // Remise en état : les contrôles suivants partent d'une planche complète,
    // sans date et sans sélection résiduelle.
    await evaluate(`(() => {
      const select = document.getElementById('date-mode');
      select.value = 'none';
      select.dispatchEvent(new Event('change'));
      const format = document.getElementById('label-format');
      format.value = 'niimbot-d110';
      format.dispatchEvent(new Event('change'));
      document.getElementById('select-none').click();
      const preset = document.getElementById('preset');
      preset.value = 'a4-3x8';
      preset.dispatchEvent(new Event('change'));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    // --- Sur des colonnes étroites, la date est écartée proprement ---------
    const narrow = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const mode = document.getElementById('sheet-fit-mode');
      const columns = document.getElementById('sheet-columns');
      const rows = document.getElementById('sheet-rows');
      const margin = document.getElementById('sheet-margin');
      const gap = document.getElementById('sheet-gap');
      const select = document.getElementById('date-mode');
      const info = document.getElementById('sheet-info');

      select.value = 'datetime';
      select.dispatchEvent(new Event('change'));
      mode.value = 'fill';
      mode.dispatchEvent(new Event('change'));
      columns.value = '12'; columns.dispatchEvent(new Event('input'));
      rows.value = '6'; rows.dispatchEvent(new Event('input'));
      margin.value = '2'; margin.dispatchEvent(new Event('input'));
      gap.value = '0'; gap.dispatchEvent(new Event('input'));
      await pause(500);

      const cell = document.querySelector('#preview .print-page:first-child .print-cell');
      const lines = [...(cell?.querySelectorAll('.print-cell__text span') ?? [])]
        .map((span) => span.textContent);

      const state = {
        info: info.textContent,
        lines,
        widthMm: cell ? cell.getBoundingClientRect().width : 0,
      };

      mode.value = 'preset';
      mode.dispatchEvent(new Event('change'));
      select.value = 'none';
      select.dispatchEvent(new Event('change'));
      await pause(250);
      return state;
    })()`);

    // « Complète ou absente » : un fragment de date ne doit jamais s'imprimer.
    const narrowText = narrow.lines.join(' ');
    const partial = /(^|\s)\d{2}\/\d{2}\/?(\s|$)/.test(narrowText);
    record(
      'sur des colonnes étroites, la date est écartée et annoncée',
      /Date non imprimée/.test(narrow.info) && partial === false,
      `colonnes de ${Math.round(narrow.widthMm)} px — ${narrow.info.split('—').at(-1)?.trim()}`,
    );

    // --- Le curseur du QR est borné par ce qui est imprimable -------------
    const bounded = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const slider = document.getElementById('sheet-qr');
      const info = document.getElementById('sheet-qr-info');
      const preset = document.getElementById('preset');
      const mode = document.getElementById('sheet-fit-mode');
      if (mode.value !== 'preset') {
        mode.value = 'preset';
        mode.dispatchEvent(new Event('change'));
        await pause(200);
      }

      /** Mesure une planche : bornes du curseur et contenu des cellules. */
      const inspect = async (key) => {
        preset.value = key;
        preset.dispatchEvent(new Event('change'));
        await pause(300);

        const cells = [...document.querySelectorAll('#preview .print-page:first-child .print-cell')];
        const cell = cells[0];
        const measured = cell ? cell.getBoundingClientRect() : null;
        const qr = cell?.querySelector('.print-cell__qr')?.getBoundingClientRect();
        const text = cell?.querySelector('.print-cell__text');
        const textRect = text?.getBoundingClientRect();
        const lines = text ? [...text.querySelectorAll('span')].map((s) => s.textContent) : [];

        return {
          min: Number(slider.min),
          max: Number(slider.max),
          value: Number(slider.value),
          info: info.textContent,
          cellHeight: measured ? measured.height : 0,
          qrHeight: qr ? qr.height : 0,
          textHeight: textRect ? textRect.height : 0,
          // Le contenu tient-il dans l'étiquette, d'après le navigateur ?
          contentOverflows: cell ? cell.scrollHeight > cell.clientHeight + 1
            || cell.scrollWidth > cell.clientWidth + 1 : null,
          textOverflows: text ? text.scrollHeight > text.clientHeight + 1 : null,
          lineCount: lines.length,
          truncated: lines.some((line) => line.endsWith('…')),
        };
      };

      const avery = await inspect('avery-l7160');
      const small = await inspect('avery-5160');
      const square = await inspect('a4-qr-3x4');

      // Le curseur poussé au maximum ne doit rien rogner.
      preset.value = 'avery-l7160';
      preset.dispatchEvent(new Event('change'));
      await pause(250);
      slider.value = slider.max;
      slider.dispatchEvent(new Event('input'));
      await pause(300);

      const atMax = [...document.querySelectorAll('#preview .print-page:first-child .print-cell')][0];
      const maxState = {
        value: Number(slider.value),
        info: info.textContent,
        contentOverflows: atMax.scrollHeight > atMax.clientHeight + 1
          || atMax.scrollWidth > atMax.clientWidth + 1,
        lines: [...(atMax.querySelector('.print-cell__text')?.querySelectorAll('span') ?? [])].length,
      };

      // Et au minimum : le QR ne doit pas descendre sous la lisibilité.
      slider.value = slider.min;
      slider.dispatchEvent(new Event('input'));
      await pause(300);
      const atMin = [...document.querySelectorAll('#preview .print-page:first-child .print-cell')][0];
      const minState = {
        value: Number(slider.value),
        info: info.textContent,
        contentOverflows: atMin.scrollHeight > atMin.clientHeight + 1
          || atMin.scrollWidth > atMin.clientWidth + 1,
      };

      slider.value = '70';
      slider.dispatchEvent(new Event('input'));
      preset.value = 'a4-3x8';
      preset.dispatchEvent(new Event('change'));
      await pause(200);

      return { avery, small, square, maxState, minState };
    })()`);

    record(
      'le curseur du QR est borné par la lisibilité et par le texte',
      bounded.avery.min >= 30 && bounded.avery.max < 100 && bounded.avery.min < bounded.avery.max,
      `L7160 : ${bounded.avery.min}–${bounded.avery.max} %, réglé à ${bounded.avery.value} %`,
    );
    record(
      'la borne dépend du format d\'étiquette',
      bounded.small.max !== bounded.avery.max || bounded.small.min !== bounded.avery.min,
      `L7160 ${bounded.avery.min}–${bounded.avery.max} % / 5160 ${bounded.small.min}–${bounded.small.max} % `
        + `/ carré ${bounded.square.min}–${bounded.square.max} %`,
    );
    record(
      'le texte est découpé en lignes, jamais rogné',
      bounded.avery.contentOverflows === false
        && bounded.avery.textOverflows === false
        && bounded.avery.lineCount >= 1,
      `${bounded.avery.lineCount} ligne(s), ${Math.round(bounded.avery.textHeight)} px de texte`,
    );
    record(
      'au maximum du curseur, rien ne déborde de l\'étiquette',
      bounded.maxState.contentOverflows === false && bounded.maxState.lines >= 1,
      `${bounded.maxState.value} % → ${bounded.maxState.lines} ligne(s)`,
    );
    record(
      'au minimum du curseur, rien ne déborde non plus',
      bounded.minState.contentOverflows === false,
      `${bounded.minState.value} %`,
    );
    record(
      'l\'information annonce les bornes et les modules',
      /mm par module/.test(bounded.avery.info) && /réglable de \d+ à \d+ %/.test(bounded.avery.info),
      bounded.avery.info,
    );

    // --- « Remplir la feuille » : la grille choisie est celle imprimée -----
    const fill = await evaluate(`(async () => {
      const pause = () => new Promise((r) => setTimeout(r, 250));
      const mode = document.getElementById('sheet-fit-mode');
      const preset = document.getElementById('preset');
      const cols = document.getElementById('sheet-columns');
      const rows = document.getElementById('sheet-rows');
      const margin = document.getElementById('sheet-margin');
      const gap = document.getElementById('sheet-gap');
      const info = document.getElementById('sheet-info');
      const field = document.querySelector('[data-fill-only]');

      const hiddenBefore = [...document.querySelectorAll('[data-fill-only]')].every((f) => f.hidden);
      mode.value = 'fill';
      mode.dispatchEvent(new Event('change'));
      await pause();
      const shownAfter = [...document.querySelectorAll('[data-fill-only]')].every((f) => !f.hidden);

      // La disposition doit avoir prérempli les champs.
      const prefilled = { columns: cols.value, rows: rows.value };

      const run = async (c, r, m, g) => {
        cols.value = String(c); cols.dispatchEvent(new Event('input'));
        rows.value = String(r); rows.dispatchEvent(new Event('input'));
        margin.value = String(m); margin.dispatchEvent(new Event('input'));
        gap.value = String(g); gap.dispatchEvent(new Event('input'));
        await pause();

        const page = document.querySelector('#preview .print-page');
        const cells = [...page.querySelectorAll('.print-cell')];
        const rects = cells.map((cell) => cell.getBoundingClientRect());
        const pageRect = page.getBoundingClientRect();
        const label = cells[0].getBoundingClientRect();
        return {
          info: info.textContent.trim(),
          count: cells.length,
          columns: new Set(rects.map((rect) => Math.round(rect.x))).size,
          rows: new Set(rects.map((rect) => Math.round(rect.y))).size,
          labelMm: (label.width / pageRect.width) * 210,
          withinPage: rects.every((rect) =>
            rect.x >= pageRect.x - 1 && rect.y >= pageRect.y - 1
            && rect.x + rect.width <= pageRect.x + pageRect.width + 1.5
            && rect.y + rect.height <= pageRect.y + pageRect.height + 1.5),
        };
      };

      const fourBySix = await run(4, 6, 5, 2);
      const twoByThree = await run(2, 3, 12, 4);

      mode.value = 'preset';
      mode.dispatchEvent(new Event('change'));
      preset.value = 'a4-3x8';
      preset.dispatchEvent(new Event('change'));
      await pause();

      return { hiddenBefore, shownAfter, prefilled, fieldLabel: field?.textContent ?? '', fourBySix, twoByThree };
    })()`);

    const wording = await evaluate(`(async () => {
      const select = document.getElementById('sheet-fit-mode');
      const hint = document.getElementById('sheet-fit-hint');
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const label = document.querySelector('label:has(> #sheet-fit-mode) .field__label');

      const options = [...select.options].map((o) => o.textContent);
      const presetHint = hint.textContent;

      select.value = 'fill';
      select.dispatchEvent(new Event('change'));
      await pause(300);
      const fillHint = hint.textContent;

      select.value = 'preset';
      select.dispatchEvent(new Event('change'));
      await pause(250);
      return { champ: label ? label.textContent : '', options, presetHint, fillHint };
    })()`);

    record(
      'les deux modes sont nommés par ce qu\'on choisit',
      JSON.stringify(wording.options) === JSON.stringify(['Cotes de la référence', 'Colonnes et rangées'])
        && /définie par/.test(wording.champ),
      `« ${wording.champ} » → ${wording.options.join(' / ')}`,
    );
    record(
      'la phrase dit ce qui découle de quoi, chiffres en main',
      /font foi/.test(wording.presetHint) && /en découle/.test(wording.fillHint)
        && /\d+ × \d+/.test(wording.presetHint) && /mm/.test(wording.fillHint),
      `référence : « ${wording.presetHint} » / grille : « ${wording.fillHint} »`,
    );

    record(
      'les champs de remplissage apparaissent avec le mode',
      fill.hiddenBefore === true && fill.shownAfter === true,
      fill.fieldLabel.trim().slice(0, 40),
    );
    record(
      'le mode reprend la grille de la disposition affichée',
      fill.prefilled.columns === '3' && fill.prefilled.rows === '8',
      `${fill.prefilled.columns} × ${fill.prefilled.rows}`,
    );
    record(
      '4 × 6 demandées donnent 4 × 6 imprimées',
      fill.fourBySix.columns === 4 && fill.fourBySix.rows === 6 && fill.fourBySix.count === 24,
      `${fill.fourBySix.columns} × ${fill.fourBySix.rows}, ${fill.fourBySix.count} étiquettes — ${fill.fourBySix.info}`,
    );
    record(
      'la taille des étiquettes est recalculée',
      fill.fourBySix.labelMm > 40 && fill.fourBySix.labelMm < 55
        && fill.twoByThree.labelMm > fill.fourBySix.labelMm,
      `${fill.fourBySix.labelMm.toFixed(1)} mm à 4 colonnes → `
        + `${fill.twoByThree.labelMm.toFixed(1)} mm à 2 colonnes`,
    );
    record(
      'la marge globale est respectée',
      fill.twoByThree.withinPage === true && fill.fourBySix.withinPage === true,
      'toutes les étiquettes dans la page',
    );

    // --- Les notes saisies ressortent dans le tableau imprimé -------------
    const tableNotes = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
      await pause(400);

      const checkbox = document.getElementById('table-note');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      await pause(400);

      const headers = [...document.querySelectorAll('#preview .print-table th')].map((th) => th.textContent);
      const hasNote = [...document.querySelectorAll('#preview .print-table td')]
        .some((td) => td.textContent === 'Note saisie à la main');

      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
      await pause(200);
      return { headers, hasNote };
    })()`);

    record(
      'le tableau imprimé affiche les notes saisies',
      Array.isArray(tableNotes?.headers) && tableNotes.headers.includes('Note')
        && tableNotes.hasNote === true,
      (tableNotes?.headers ?? []).join(' / '),
    );

    // --- Import : ce que l'application exporte doit se réimporter ---------
    //
    // C'était le malentendu principal : le bouton « Importer » n'acceptait que
    // l'archive JSON, et refusait le CSV comme le dossier d'étiquettes `.zip`
    // que l'application venait elle-même de produire.
    const IMPORT_DIR = join(SANDBOX, 'import');
    mkdirSync(IMPORT_DIR, { recursive: true });

    const fixture = (name, data) => {
      const path = join(IMPORT_DIR, name);
      writeFileSync(path, data);
      return path;
    };

    const importedLabels = {
      format: 'url-qr-code-printer/labels',
      version: 1,
      count: 1,
      labels: [{
        file: 'etiquettes/1-importee.png',
        url: 'https://tinyurl.com/importe',
        originalUrl: 'https://exemple.fr/importee?id=7',
        title: 'Importée depuis le ZIP',
      }],
    };

    const files = {
      json: fixture('export.json', JSON.stringify(importedLabels)),
      csv: fixture('liens.csv', toCsv([{
        url: 'https://exemple.fr/depuis-csv',
        title: 'Depuis le CSV',
        tags: ['csv', 'essai'],
        note: 'importée par CSV',
        createdAt: new Date(2026, 8, 14, 9, 15).getTime(),
      }])),
      zip: fixture('etiquettes.zip', createZip([
        { name: 'export.json', data: JSON.stringify(importedLabels) },
        { name: 'planche.html', data: '<html></html>' },
      ], { date: new Date(2026, 8, 15) })),
      unknown: fixture('notes.txt', 'ceci n\'est pas une archive'),
    };

    /** Dépose un fichier dans le champ d'import et attend le message. */
    const importFile = async (path) => {
      // `send` rend le message complet : la charge utile est sous `result`.
      await app.send('DOM.enable');
      const document = await app.send('DOM.getDocument', { depth: 1 });
      const found = await app.send('DOM.querySelector', {
        nodeId: document.result.root.nodeId,
        selector: '#import-file',
      });
      await app.send('DOM.setFileInputFiles', { files: [path], nodeId: found.result.nodeId });
      await new Promise((r) => setTimeout(r, 900));
      return evaluate(`(() => ({
        toast: document.getElementById('toast').textContent.trim(),
        erreur: document.getElementById('toast').classList.contains('toast--error'),
        liens: document.querySelectorAll('#list .link').length,
      }))()`);
    };

    const readStore = () => evaluate(`new Promise((resolve) => {
      chrome.storage.local.get('links', (data) => resolve((data.links ?? []).map((link) => ({
        url: link.url, title: link.title, tags: link.tags, note: link.note,
        source: link.source, shortUrl: link.shortUrl,
      }))));
    })`);

    const beforeImport = (await readStore()).length;

    const fromJson = await importFile(files.json);
    const afterJson = await readStore();
    const imported = afterJson.find((link) => link.url === 'https://exemple.fr/importee?id=7');
    record(
      'l\'export.json du dossier d\'étiquettes se réimporte',
      imported?.title === 'Importée depuis le ZIP'
        && imported?.shortUrl === 'https://tinyurl.com/importe'
        && imported?.source === 'import',
      `${afterJson.length - beforeImport} lien(s) ajouté(s) — « ${fromJson.toast} »`,
    );

    const fromCsv = await importFile(files.csv);
    const afterCsv = await readStore();
    const fromCsvLink = afterCsv.find((link) => link.url === 'https://exemple.fr/depuis-csv');
    record(
      'un CSV exporté se réimporte, avec titre, tags et note',
      fromCsvLink?.title === 'Depuis le CSV'
        && fromCsvLink?.note === 'importée par CSV'
        && JSON.stringify(fromCsvLink?.tags) === JSON.stringify(['csv', 'essai']),
      `« ${fromCsv.toast} »`,
    );

    const fromZip = await importFile(files.zip);
    const afterZip = await readStore();
    record(
      'le dossier d\'étiquettes .zip se réimporte',
      afterZip.length === afterCsv.length
        && /déjà présent/.test(fromZip.toast),
      `« ${fromZip.toast} » — le lien du ZIP est le même que celui de export.json`,
    );

    const fromUnknown = await importFile(files.unknown);
    record(
      'un fichier étranger est refusé avec un message qui dit quoi fournir',
      fromUnknown.erreur === true
        && /Formats acceptés/.test(fromUnknown.toast)
        && /Archive/.test(fromUnknown.toast),
      `« ${fromUnknown.toast} »`,
    );

    // Un import n'écrase jamais : les liens déjà là sont ignorés, sans erreur.
    const twice = await importFile(files.csv);
    const afterTwice = await readStore();
    record(
      'réimporter la même archive ne crée pas de doublon',
      afterTwice.length === afterZip.length && /déjà présent/.test(twice.toast),
      `${afterTwice.length} lien(s) au total — « ${twice.toast} »`,
    );

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
