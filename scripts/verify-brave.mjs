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
      const info = document.getElementById('sheet-info');
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

      slider.value = '30'; slider.dispatchEvent(new Event('input'));
      await pause();
      const small = qrWidth();
      const smallInfo = info.textContent;

      slider.value = '100'; slider.dispatchEvent(new Event('input'));
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
      `${Math.round(tweaks.small)} px à 30 % → ${Math.round(tweaks.big)} px à 100 %`,
    );
    record(
      'le rognage du texte est annoncé quand le QR est trop grand',
      /rogné/.test(tweaks.bigInfo ?? '') && !/rogné/.test(tweaks.smallInfo ?? ''),
      tweaks.bigInfo?.slice(-70),
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

    // --- Notes : saisissables, donc utiles au tableau ----------------------
    const noted = await evaluate(`(async () => {
      const open = document.querySelector('#list .link__note-button');
      if (!open) return { error: 'aucun bouton de note' };
      open.click();
      await new Promise((r) => setTimeout(r, 120));

      const input = document.querySelector('#list .link__note-input');
      if (!input) return { error: 'champ de note absent' };
      input.value = 'note de vérification';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 500));

      const stored = await new Promise((resolve) => {
        chrome.storage.local.get('links', (data) => resolve(
          (data.links ?? []).filter((link) => link.note === 'note de vérification').length,
        ));
      });

      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
      await new Promise((r) => setTimeout(r, 400));
      const checkbox = document.getElementById('table-note');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r, 400));

      const headers = [...document.querySelectorAll('#preview .print-table th')].map((th) => th.textContent);
      const hasNote = [...document.querySelectorAll('#preview .print-table td')]
        .some((td) => td.textContent === 'note de vérification');

      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
      return { stored, headers, hasNote };
    })()`);

    record(
      'une note peut être saisie depuis la liste',
      noted?.stored === 1,
      noted?.error ?? `${noted?.stored} note(s) enregistrée(s)`,
    );
    record(
      'le tableau affiche les notes saisies',
      Array.isArray(noted?.headers) && noted.headers.includes('Note') && noted.hasNote === true,
      (noted?.headers ?? []).join(' / '),
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
