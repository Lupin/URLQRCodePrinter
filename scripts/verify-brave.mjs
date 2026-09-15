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

    // Le drapeau Web Bluetooth de Brave est éteint dans ce profil : c'est
    // exactement l'état où l'utilisateur a vu « Web Bluetooth API globally
    // disabled ». L'application doit le dire **avant** le clic, en français.
    const ble = await evaluate(`(async () => {
      const hint = document.getElementById('ble-support');
      return {
        api: typeof navigator.bluetooth,
        disponible: await navigator.bluetooth.getAvailability().catch(() => 'lève'),
        boutonDesactive: document.getElementById('connect').disabled,
        message: hint.hidden ? '' : hint.textContent,
        statut: document.getElementById('print-status').textContent.trim(),
      };
    })()`);

    record(
      'Web Bluetooth désactivé par le navigateur est détecté avant le clic',
      ble.api === 'object' && ble.disponible === false && ble.boutonDesactive === true,
      `API « ${ble.api} », getAvailability() → ${ble.disponible}, bouton désactivé : ${ble.boutonDesactive}`,
    );
    record(
      'la marche à suivre est affichée, en français',
      /brave:\/\/flags\/#brave-web-bluetooth-api/.test(ble.message)
        && /relancez Brave/.test(ble.message)
        && /globally disabled/i.test(ble.message) === false,
      ble.message,
    );
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

    // --- Longueur d'étiquette : la place perdue en vertical ----------------
    //
    // Le profil ne connaît que la largeur de la tête. Sans la longueur du
    // rouleau, la composition se tassait en haut et l'imprimante avançait
    // jusqu'à la découpe suivante : le reste sortait blanc.
    const lengthField = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const profile = document.getElementById('label-profile');
      const supply = document.getElementById('label-supply');
      const hint = document.getElementById('supply-hint');
      const canvas = () => document.querySelector('#preview canvas');
      const size = () => {
        const node = canvas();
        return node ? { width: node.width, height: node.height } : { width: 0, height: 0 };
      };

      profile.value = 'D110';
      profile.dispatchEvent(new Event('change'));
      await pause(400);

      const consommables = [...supply.options].map((option) => option.value);
      // Le champ de longueur libre n'existe plus : c'est le consommable qui
      // porte les deux cotes du rouleau.
      const champLibre = document.getElementById('label-length');

      supply.value = 'd110-12x30';
      supply.dispatchEvent(new Event('change'));
      await pause(400);
      const fixe = { taille: size(), phrase: hint.textContent };

      // 203 dpi : 30 mm valent 240 px de geometrie. L'apercu ecran est agrandi
      // d'un facteur entier (la tete ne fait que 96 px).
      const geometrie = Math.round((30 / 25.4) * 203);
      const zoom = Math.max(1, Math.floor(280 / 96));
      const attendu = geometrie * zoom;

      supply.value = 'd110-12x40';
      supply.dispatchEvent(new Event('change'));
      await pause(400);
      const quarante = size();

      supply.value = 'd110-continue';
      supply.dispatchEvent(new Event('change'));
      await pause(400);
      const continu = { taille: size(), phrase: hint.textContent };

      supply.value = 'd110-12x22';
      supply.dispatchEvent(new Event('change'));
      await pause(300);

      return { consommables, fixe, quarante, continu, attendu, champLibre: Boolean(champLibre) };
    })()`);

    record(
      'le consommable porte ses deux cotes',
      (lengthField?.consommables ?? []).includes('d110-12x30')
        && (lengthField?.consommables ?? []).includes('d110-continue'),
      (lengthField?.consommables ?? []).join(', '),
    );
    record(
      "le consommable impose la longueur, sans champ a saisir",
      lengthField?.champLibre === false
        && lengthField?.fixe?.taille?.height === lengthField?.attendu
        && /30 mm/.test(lengthField?.fixe?.phrase ?? ''),
      `12 × 30 mm → ${lengthField?.fixe?.taille?.height} px `
        + `(attendu ${lengthField?.attendu}) — « ${lengthField?.fixe?.phrase} »`,
    );
    record(
      'changer de consommable change la longueur rendue',
      (lengthField?.quarante?.height ?? 0) > (lengthField?.fixe?.taille?.height ?? 0),
      `30 mm ${lengthField?.fixe?.taille?.height} px < 40 mm ${lengthField?.quarante?.height} px`,
    );
    record(
      'le rouleau continu annonce une longueur libre',
      /continu/.test(lengthField?.continu?.phrase ?? '')
        && (lengthField?.continu?.taille?.height ?? 0) > 0,
      `« ${lengthField?.continu?.phrase} » — ${lengthField?.continu?.taille?.height} px`,
    );

    // Le texte doit être lisible : sur une tête de 96 px, l'ancien calcul
    // donnait 8 px, soit 1 mm à 203 dpi.
    const legibility = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const profile = document.getElementById('label-profile');
      const supply = document.getElementById('label-supply');
      profile.value = 'D110';
      profile.dispatchEvent(new Event('change'));
      await pause(300);
      // Rouleau continu : la hauteur suit le contenu.
      supply.value = 'd110-continue';
      supply.dispatchEvent(new Event('change'));
      await pause(300);

      // On lit la taille de police dans le libellé de l'aperçu, seule source
      // disponible depuis le DOM : la légende annonce le profil et la densité.
      const caption = () => document.querySelector('#preview .hint')?.textContent ?? '';
      const canvas = document.querySelector('#preview canvas');

      // Le texte est mesuré sur le rendu : on compte les lignes non vides dans
      // la moitié basse du canevas, là où il est écrit.
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let darkest = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 128) darkest += 1;
      }

      // Hauteur d'encre de la zone de texte : on repère la dernière ligne
      // sombre et la première, sous le QR.
      const width = canvas.width;
      const height = canvas.height;
      const rowHasInk = (y) => {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4] < 128) return true;
        }
        return false;
      };
      const inkedRows = [];
      for (let y = 0; y < height; y++) if (rowHasInk(y)) inkedRows.push(y);

      return {
        caption: caption(),
        darkest,
        firstInk: inkedRows[0] ?? 0,
        lastInk: inkedRows[inkedRows.length - 1] ?? 0,
        height,
        width,
      };
    })()`);

    record(
      "l'aperçu de l'étiquette est rendu et non vide",
      (legibility?.darkest ?? 0) > 0 && legibility.height > 0,
      `${legibility?.width} × ${legibility?.height} px, ${legibility?.darkest} px d'encre`,
    );

    // --- L'etiquette encode la cible choisie -------------------------------
    //
    // La liste affichait un tinyurl, mais l'etiquette encodait toujours l'URL
    // longue : elle ignorait le reglage « Le QR code pointe vers ».
    const cibleQR = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const el = (id) => document.getElementById(id);
      const cocher = (box, v) => { box.checked = v; box.dispatchEvent(new Event('change')); };

      // Contenu : URL seule, sur un rouleau continu pour que la hauteur suive
      // la longueur du texte.
      cocher(el('label-show-index'), false);
      cocher(el('label-show-title'), false);
      cocher(el('label-show-url'), true);
      cocher(el('label-show-host'), false);
      cocher(el('label-show-date'), false);
      el('label-supply').value = 'd110-continue';
      el('label-supply').dispatchEvent(new Event('change'));
      el('label-rotation').value = 'dessous';
      el('label-rotation').dispatchEvent(new Event('change'));
      await pause(450);

      // Le lien raccourci : il porte a la fois l'URL longue et le tinyurl.
      const cible = el('qr-target');
      const lien = el('label-link');
      const avecRaccourci = [...lien.options]
        .find((o) => (o.title ?? '').length > 30) ?? lien.options[0];
      lien.value = avecRaccourci.value;
      lien.dispatchEvent(new Event('change'));
      await pause(400);

      // La hauteur ne suffit pas a distinguer les deux : une URL courte et une
      // URL longue tiennent parfois dans le meme nombre de lignes. On compare
      // donc le rendu lui-meme — si le QR n'encode pas le raccourci, les deux
      // images sont identiques au pixel pres.
      const lire = () => {
        const c = document.querySelector('#preview canvas');
        return c ? { hauteur: c.height, image: c.toDataURL('image/png') } : null;
      };

      // On part de l'etat courant, et on le restaure : la suite du scenario en
      // depend (l'export verifie que le CSV porte le raccourci).
      const avant = cible.value;

      cible.value = 'original';
      cible.dispatchEvent(new Event('change'));
      await pause(500);
      const original = lire();

      cible.value = 'short';
      cible.dispatchEvent(new Event('change'));
      await pause(500);
      const court = lire();
      const indice = el('label-font-hint').textContent;

      cible.value = avant;
      cible.dispatchEvent(new Event('change'));
      cocher(el('label-show-title'), true);
      el('label-supply').value = 'd110-12x22';
      el('label-supply').dispatchEvent(new Event('change'));
      await pause(400);
      return {
        original: { hauteur: original?.hauteur ?? 0 },
        court: { hauteur: court?.hauteur ?? 0 },
        identiques: original?.image === court?.image,
        indice, titre: avecRaccourci.title, avant,
      };
    })()`);

    record(
      "l'etiquette encode le raccourci quand il est choisi",
      (cibleQR?.court?.hauteur ?? 0) > 0 && cibleQR?.identiques === false,
      `« ${cibleQR?.titre} » : URL longue ${cibleQR?.original?.hauteur} px `
        + `→ raccourci ${cibleQR?.court?.hauteur} px, rendus `
        + `${cibleQR?.identiques ? 'IDENTIQUES (le reglage est ignore)' : 'differents'}`,
    );

    // --- Le contenu se coche, et les choix se cumulent ----------------------
    //
    // Une liste deroulante n'acceptait qu'un contenu ; le numero, le titre et
    // l'URL se cumulent pourtant, et le numero sert a retrouver la ligne quand
    // l'etiquette est trop petite pour porter l'URL entiere.
    const contenu = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const cases = {
        index: document.getElementById('label-show-index'),
        titre: document.getElementById('label-show-title'),
        url: document.getElementById('label-show-url'),
        domaine: document.getElementById('label-show-host'),
        date: document.getElementById('label-show-date'),
      };
      const rot = document.getElementById('label-rotation');
      const supply = document.getElementById('label-supply');
      rot.value = 'dessous'; rot.dispatchEvent(new Event('change'));
      supply.value = 'd110-12x30'; supply.dispatchEvent(new Event('change'));
      await pause(400);

      // La hauteur est imposee par le consommable : c'est l'encre qui dit si
      // le contenu a change. Mesurer la hauteur ne prouverait rien ici.
      const mesurer = () => {
        const c = document.querySelector('#preview canvas');
        if (!c) return { hauteur: 0, encre: 0 };
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let encre = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i] < 128) encre += 1;
        return { hauteur: c.height, encre };
      };
      const etat = {};
      const essayer = async (nom, choix) => {
        for (const [cle, box] of Object.entries(cases)) {
          box.checked = Boolean(choix[cle]);
          box.dispatchEvent(new Event('change'));
        }
        await pause(450);
        etat[nom] = { ...mesurer(),
                      hint: document.getElementById('label-content-hint').textContent };
      };

      await essayer('rien', {});
      await essayer('url', { url: true });
      await essayer('numeroSeul', { index: true });
      await essayer('numeroTitreUrl', { index: true, titre: true, url: true });
      await essayer('avecDate', { url: true, date: true });
      await essayer('neutre', { url: true, titre: true });
      return etat;
    })()`);

    record(
      "le contenu se coche, et les choix se cumulent",
      (contenu?.numeroSeul?.encre ?? 0) > 0
        && (contenu?.numeroTitreUrl?.encre ?? 0) > (contenu?.url?.encre ?? 0)
        && (contenu?.url?.encre ?? 1) < (contenu?.numeroTitreUrl?.encre ?? 0),
      `QR seul ${contenu?.rien?.encre} px d'encre · URL ${contenu?.url?.encre} `
        + `· N° ${contenu?.numeroSeul?.encre} · N°+titre+URL ${contenu?.numeroTitreUrl?.encre}`,
    );
    record(
      "cocher la date ajoute du texte",
      (contenu?.avecDate?.encre ?? 0) > (contenu?.url?.encre ?? 0),
      `sans date ${contenu?.url?.encre} px d'encre → avec date ${contenu?.avecDate?.encre}`,
    );
    // La date et l'heure : cocher « Avec l'heure » ajoute du texte, dans les
    // deux dispositions. Regression : la recherche de taille exigeait une seule
    // ligne, rejetait la date en bloc, et l'heure ne s'imprimait jamais.
    const dateHeure = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const el = (id) => document.getElementById(id);
      const cocher = (box, v) => { box.checked = v; box.dispatchEvent(new Event('change')); };

      cocher(el('label-show-title'), false);
      cocher(el('label-show-url'), true);
      cocher(el('label-show-date'), false);
      cocher(el('label-date-time'), false);
      el('label-supply').value = 'd110-12x22';
      el('label-supply').dispatchEvent(new Event('change'));
      await pause(400);

      const encre = () => {
        const c = document.querySelector('#preview canvas');
        if (!c) return 0;
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] < 128) n += 1;
        return n;
      };
      const legende = () => document.querySelector('#preview .hint')?.textContent ?? '';
      const indice = () => document.getElementById('label-font-hint').textContent;

      const out = {};
      for (const dispo of ['dessous', 'tourne']) {
        el('label-rotation').value = dispo;
        el('label-rotation').dispatchEvent(new Event('change'));
        await pause(350);

        cocher(el('label-show-date'), false);
        cocher(el('label-date-time'), false);
        await pause(420);
        const sans = encre();

        cocher(el('label-show-date'), true);
        await pause(420);
        const date = encre();

        cocher(el('label-date-time'), true);
        await pause(420);
        out[dispo] = { sans, date, dateHeure: encre(),
                       legende: legende(), indice: indice() };
      }

      // Remise en etat.
      cocher(el('label-date-time'), false);
      cocher(el('label-show-date'), false);
      el('label-rotation').value = 'dessous';
      el('label-rotation').dispatchEvent(new Event('change'));
      await pause(300);
      return out;
    })()`);

    // L'encre totale n'est pas un bon temoin : ajouter la date reduit la police
    // du texte, donc l'encre baisse malgre la ligne en plus. On verifie ce qui
    // compte — l'heure ajoute du texte, et la police reste lisible.
    record(
      "cocher l'heure ajoute du texte, dans les deux dispositions",
      ['dessous', 'tourne'].every((dispo) => {
        const cas = dateHeure?.[dispo];
        return cas && cas.dateHeure > cas.date
          && /1\.[6-9]|2\./.test(cas.indice ?? '');
      }),
      `empile ${dateHeure?.dessous?.date}→${dateHeure?.dessous?.dateHeure} px `
        + `(${dateHeure?.dessous?.indice}) · `
        + `tourne ${dateHeure?.tourne?.date}→${dateHeure?.tourne?.dateHeure} px `
        + `(${dateHeure?.tourne?.indice})`,
    );
    record(
      "aucune date n'est annoncee abandonnee quand l'heure est demandee",
      (dateHeure?.dessous?.legende ?? '').includes('aucune date') === false
        && (dateHeure?.tourne?.legende ?? '').includes('aucune date') === false,
      dateHeure?.dessous?.legende,
    );

    record(
      "l'indice enumere ce qui sera imprime",
      /le numéro du lien/.test(contenu?.numeroTitreUrl?.hint ?? '')
        && /l'URL/.test(contenu?.numeroTitreUrl?.hint ?? '')
        && /QR code seul/.test(contenu?.rien?.hint ?? ''),
      `« ${contenu?.numeroTitreUrl?.hint} » · « ${contenu?.rien?.hint} »`,
    );

    // --- Disposition du texte : la mise en page, pas le sens du support ----
    //
    // L'etiquette garde sa taille et son sens : seule la composition change,
    // pour que le texte reste lisible selon la forme du rouleau.
    const senses = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const rot = document.getElementById('label-rotation');
      const supply = document.getElementById('label-supply');
      supply.value = 'd110-12x30';
      supply.dispatchEvent(new Event('change'));
      await pause(400);

      const mesurer = async () => {
        const canvas = document.querySelector('#preview canvas');
        if (!canvas) return { w: 0, h: 0, ink: 0, bande: 0 };
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let ink = 0;
        let min = canvas.width;
        let max = -1;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (data[(y * canvas.width + x) * 4] < 128) {
              ink += 1;
              if (x < min) min = x;
              if (x > max) max = x;
            }
          }
        }
        return { w: canvas.width, h: canvas.height, ink, bande: max < 0 ? 0 : max - min + 1 };
      };

      const out = { options: [...rot.options].map((o) => o.value) };
      for (const value of ['dessous', 'tourne']) {
        rot.value = value; rot.dispatchEvent(new Event('change'));
        await pause(500);
        out[value] = await mesurer();
      }
      rot.value = 'dessous'; rot.dispatchEvent(new Event('change'));
      await pause(300);
      return out;
    })()`);

    // Les deux sens de rotation : le texte se lit de bas en haut, ou de haut en
    // bas. Le choix depend du sens de sortie du rouleau, qu'on ne peut pas
    // deviner sans materiel.
    const sensRotation = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const el = (id) => document.getElementById(id);
      const cocher = (box, v) => { box.checked = v; box.dispatchEvent(new Event('change')); };
      cocher(el('label-show-title'), true);
      cocher(el('label-show-url'), true);
      el('label-supply').value = 'd110-12x30';
      el('label-supply').dispatchEvent(new Event('change'));
      await pause(450);

      // Le centre de gravite de l'encre : les rangees de texte s'empilent vers
      // la droite dans un sens, vers la gauche dans l'autre.
      const mesurer = () => {
        const c = document.querySelector('#preview canvas');
        if (!c) return null;
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let somme = 0;
        let n = 0;
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            if (d[(y * c.width + x) * 4] < 128) { somme += x; n += 1; }
          }
        }
        return n === 0 ? null : { centre: Math.round(somme / n), encre: n };
      };

      const out = {};
      for (const dispo of ['tourne', 'tourne-inverse']) {
        el('label-rotation').value = dispo;
        el('label-rotation').dispatchEvent(new Event('change'));
        await pause(500);
        out[dispo] = mesurer();
      }
      el('label-rotation').value = 'dessous';
      el('label-rotation').dispatchEvent(new Event('change'));
      await pause(300);
      return out;
    })()`);

    record(
      "les deux sens de rotation sont proposes et different",
      (sensRotation?.tourne?.encre ?? 0) > 0
        && (sensRotation?.['tourne-inverse']?.encre ?? 0) > 0
        && sensRotation.tourne.centre !== sensRotation['tourne-inverse'].centre,
      `bas en haut : centre x ${sensRotation?.tourne?.centre} `
        + `(${sensRotation?.tourne?.encre} px) · `
        + `haut en bas : centre x ${sensRotation?.['tourne-inverse']?.centre} `
        + `(${sensRotation?.['tourne-inverse']?.encre} px)`,
    );

    record(
      "la disposition du texte est proposee, selon le format",
      // Sur une tete de 12 mm, « texte a droite » n'a pas de place : elle n'est
      // proposee que sur une tete large.
      (senses?.options ?? []).join(',') === 'dessous,dessus,tourne,tourne-inverse'
        && (senses?.options ?? []).includes('tourne')
        && (senses?.options ?? []).includes('dessous'),
      `D110 : ${(senses?.options ?? []).join(', ')}`,
    );
    record(
      "la disposition change la mise en page sans changer l'etiquette",
      (senses?.dessous?.h ?? 0) > 0
        && senses.dessous.h === senses.tourne.h
        && senses.dessous.w === senses.tourne.w
        && senses.dessous.ink !== senses.tourne.ink,
      `meme support ${senses?.dessous?.w}×${senses?.dessous?.h} · `
        + `droit ${senses?.dessous?.bande} px de large / tourne ${senses?.tourne?.bande} px`,
    );

    // --- La disposition deplace reellement le contenu ----------------------
    const layouts = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const supply = document.getElementById('label-supply');
      const alignment = document.getElementById('label-alignment');
      const rotation = document.getElementById('label-rotation');
      rotation.value = 'dessous'; rotation.dispatchEvent(new Event('change'));
      // La disposition repartit la place restante : il en faut, donc un long
      // rouleau. Sans longueur imposee, il n'y a rien a repartir.
      supply.value = 'd110-12x40';
      supply.dispatchEvent(new Event('change'));
      await pause(400);

      const out = {};
      for (const value of ['center', 'top', 'spread']) {
        alignment.value = value;
        alignment.dispatchEvent(new Event('change'));
        await pause(400);
        const canvas = document.querySelector('#preview canvas');
        let first = -1;
        let last = -1;
        if (canvas) {
          const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          const rowInk = (y) => {
            for (let x = 0; x < canvas.width; x++) {
              if (data[(y * canvas.width + x) * 4] < 128) return true;
            }
            return false;
          };
          for (let y = 0; y < canvas.height; y++) {
            if (rowInk(y)) { if (first < 0) first = y; last = y; }
          }
        }
        out[value] = { first, last };
      }

      alignment.value = 'center'; alignment.dispatchEvent(new Event('change'));
      supply.value = 'd110-12x22'; supply.dispatchEvent(new Event('change'));
      await pause(300);
      return out;
    })()`);

    record(
      "la disposition deplace le contenu sur la longueur",
      (layouts?.top?.first ?? -1) < (layouts?.center?.first ?? -1)
        && (layouts?.spread?.last ?? -1) > (layouts?.top?.last ?? -1),
      `premiere encre : haut ${layouts?.top?.first} · centre ${layouts?.center?.first} `
        + `· reparti ${layouts?.spread?.first} — derniere : haut ${layouts?.top?.last} `
        + `· reparti ${layouts?.spread?.last}`,
    );

    // --- Consommables : compatibles avec la tete connectee -----------------
    //
    // Sans imprimante, tout le catalogue reste propose. Une fois connectee, le
    // catalogue suit le modele et la tete qu'il rapporte.
    const supplies = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const profile = document.getElementById('label-profile');
      const supply = document.getElementById('label-supply');

      const lire = async (id) => {
        profile.value = id;
        profile.dispatchEvent(new Event('change'));
        await pause(400);
        return {
          valeurs: [...supply.options].map((option) => option.value),
          libelles: [...supply.options].map((option) => option.textContent),
          desactivees: [...supply.options].filter((option) => option.disabled)
            .map((option) => option.value),
        };
      };

      const d110 = await lire('D110');
      const m2 = await lire('M2');
      await lire('D110');
      return { d110, m2 };
    })()`);

    record(
      "le catalogue de consommables suit le format choisi",
      (supplies?.d110?.valeurs ?? []).includes('d110-12x30')
        && (supplies?.m2?.valeurs ?? []).includes('m2-50x70')
        && (supplies?.m2?.valeurs ?? []).includes('d110-12x30') === false,
      `D110 : ${(supplies?.d110?.valeurs ?? []).join(', ')} `
        + `· M2 : ${(supplies?.m2?.valeurs ?? []).join(', ')}`,
    );
    record(
      "un consommable plus large que la tete est signale, pas masque",
      // Sur un D110 dont la tete fait 12 mm, un rouleau de 15 mm depasse :
      // il reste visible pour qu'on comprenne pourquoi il est refuse.
      (supplies?.d110?.desactivees ?? []).includes('d110-15x30')
        && (supplies?.d110?.libelles ?? []).some((l) => l.includes('plus large que la t')),
      (supplies?.d110?.libelles ?? []).filter((l) => l.includes('plus large')).join(' · ')
        || 'aucun consommable trop large',
    );

    // --- Aucun chevauchement dans le panneau Niimbot ----------------------
    //
    // Constaté à l'écran : cinq champs sur une ligne se recouvraient, chaque
    // champ réclamant 120 px de large au minimum. On mesure les rectangles
    // réellement calculés par le navigateur.
    const overlap = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const panel = document.querySelector('[data-mode-panel="single"]');
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'single').click();
      await pause(500);

      const rects = [...panel.querySelectorAll('.field')].map((field) => {
        const box = field.getBoundingClientRect();
        const input = field.querySelector('.input');
        const inputBox = input ? input.getBoundingClientRect() : null;
        return {
          label: field.querySelector('.field__label')?.textContent ?? '',
          x: box.x, y: box.y, width: box.width, height: box.height,
          inputWidth: inputBox ? inputBox.width : 0,
          // Un champ trop étroit tronque son libellé : signe de superposition.
          labelClipped: (() => {
            const span = field.querySelector('.field__label');
            return span ? span.scrollWidth > span.clientWidth + 1 : false;
          })(),
        };
      });

      // Deux champs se chevauchent si leurs rectangles se recouvrent.
      const clashes = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const horizontal = a.x < b.x + b.width && b.x < a.x + a.width;
          const vertical = a.y < b.y + b.height && b.y < a.y + a.height;
          if (horizontal && vertical) clashes.push(a.label + ' / ' + b.label);
        }
      }

      return {
        count: rects.length,
        clashes,
        tooNarrow: rects.filter((rect) => rect.inputWidth < 60).map((rect) => rect.label),
        clipped: rects.filter((rect) => rect.labelClipped).map((rect) => rect.label),
      };
    })()`);

    // Une capture du panneau, pour juger la mise en page à l'œil et pas
    // seulement au rectangle : une mesure peut être juste et le rendu laid.
    // On amène le panneau dans la vue : une capture du haut de page ne
    // montrerait pas ce qu'on veut juger. Deux captures, une par orientation :
    // c'est le rendu de l'etiquette qui se juge, pas seulement le formulaire.
    mkdirSync(join(ROOT, '.verify-brave-captures'), { recursive: true });
    for (const orientation of ['dessous', 'tourne']) {
      await evaluate(`(async () => {
        const rot = document.getElementById('label-rotation');
        rot.value = '${orientation}';
        rot.dispatchEvent(new Event('change'));
        document.querySelector('[data-mode-panel="single"]').scrollIntoView({ block: 'start' });
        await new Promise((r) => setTimeout(r, 500));
      })()`);
      const vue = await app.send('Page.captureScreenshot', { format: 'png' });
      if (vue?.result?.data) {
        writeFileSync(
          join(ROOT, '.verify-brave-captures', `panneau-${orientation}.png`),
          Buffer.from(vue.result.data, 'base64'),
        );
      }
    }
    await evaluate(`(async () => {
      const rot = document.getElementById('label-rotation');
      rot.value = 'dessous';
      rot.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r, 300));
    })()`);
    const shot = await app.send('Page.captureScreenshot', { format: 'png' });
    if (shot?.result?.data) {
      // Hors du bac à sable, qui est effacé en sortie : la capture sert à
      // relire la mise en page après coup.
      mkdirSync(join(ROOT, '.verify-brave-captures'), { recursive: true });
      writeFileSync(
        join(ROOT, '.verify-brave-captures', 'panneau-niimbot.png'),
        Buffer.from(shot.result.data, 'base64'),
      );
    }

    record(
      "aucun champ du panneau Niimbot n'en recouvre un autre",
      (overlap?.clashes ?? ['inconnu']).length === 0,
      overlap?.clashes?.length
        ? overlap.clashes.join(' · ')
        : `${overlap?.count} champs mesurés, aucun recouvrement`,
    );
    record(
      "les libellés du panneau Niimbot ne sont pas tronqués",
      (overlap?.clipped ?? ['inconnu']).length === 0
        && (overlap?.tooNarrow ?? ['inconnu']).length === 0,
      (overlap?.clipped ?? []).length
        ? `tronqués : ${overlap.clipped.join(', ')}`
        : 'tous lisibles en entier',
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

    // --- Grille du tableau : masquable, à l'écran comme au papier ---------
    const grid = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
      await pause(400);

      const box = document.getElementById('table-grid');
      const border = () => {
        const cell = document.querySelector('#preview .print-table td');
        const style = getComputedStyle(cell);
        return { top: style.borderTopWidth, bottom: style.borderBottomWidth };
      };
      const header = () => getComputedStyle(
        document.querySelector('#preview .print-table th'),
      ).backgroundColor;

      const checked = box.checked;
      const withGrid = { ...border(), fond: header() };

      box.checked = false;
      box.dispatchEvent(new Event('change'));
      await pause(400);
      const without = { ...border(), fond: header(), classe: document.querySelector('#preview .print-table')?.className ?? '' };

      box.checked = true;
      box.dispatchEvent(new Event('change'));
      await pause(300);

      return { checked, withGrid, without };
    })()`);

    record(
      'la grille du tableau est active par défaut',
      grid.checked === true
        && parseFloat(grid.withGrid.top) > 0
        && parseFloat(grid.withGrid.bottom) > 0,
      `bordures ${grid.withGrid.top} / ${grid.withGrid.bottom}, fond ${grid.withGrid.fond}`,
    );
    record(
      'la masquer retire les bordures et le fond d\'en-tête',
      parseFloat(grid.without.top) === 0
        && parseFloat(grid.without.bottom) === 0
        && grid.without.classe.includes('print-table--bare')
        && grid.without.fond !== grid.withGrid.fond,
      `bordures ${grid.without.top} / ${grid.without.bottom}, fond ${grid.without.fond}`,
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

    // Lu directement dans le stockage : le helper `readStore` est défini plus
    // bas, avec le bloc d'import.
    const linksCount = await evaluate(`new Promise((resolve) => {
      chrome.storage.local.get('links', (data) => resolve((data.links ?? []).length));
    })`);
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
    // Un QR par ligne, ancré comme Excel l'écrit, et une mise en page qui
    // ramène le tableau à une largeur de page : sans quoi un QR peut sortir sur
    // une autre feuille que son URL.
    const drawing = spawnSync(
      '/usr/bin/unzip', ['-p', join(DOWNLOADS, xlsxName), 'xl/drawings/drawing1.xml'],
      { encoding: 'utf8' },
    ).stdout ?? '';
    const anchors = [...drawing.matchAll(
      /<xdr:twoCellAnchor editAs="oneCell">\s*<xdr:from>\s*<xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/g,
    )].map((m) => ({ col: Number(m[1]), row: Number(m[2]) }));

    record(
      'le classeur ancre un QR par ligne, comme Excel',
      anchors.length === linksCount
        && anchors.every((a) => a.col === anchors[0].col)
        && new Set(anchors.map((a) => a.row)).size === anchors.length,
      `${anchors.length} ancrage(s) pour ${linksCount} lien(s), lignes ${anchors.map((a) => a.row).join(',')}`,
    );
    record(
      'la feuille est mise en page pour que la ligne tienne sur une page',
      /fitToPage="1"/.test(xlsxSheet) && /fitToWidth="1"/.test(xlsxSheet),
      xlsxSheet.includes('orientation="landscape"') ? 'paysage, ajusté à une page de large' : 'mise en page absente',
    );

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
    await evaluate(`[...document.querySelectorAll('.tab')].find(t => t.dataset.mode === 'single').click()`);
    await new Promise((r) => setTimeout(r, 600));

    // --- Impression en série : la portée se choisit ------------------------
    const scopeChoice = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const scope = document.getElementById('print-scope');
      const button = document.getElementById('print-all-labels');
      const hint = document.getElementById('print-scope-hint');
      const master = document.getElementById('select-all-box');

      // Rien de coche au depart.
      if (master.checked || master.indeterminate) master.click();
      await pause(350);
      const vide = { value: scope.value, label: button.textContent, hint: hint.textContent,
                     total: document.querySelectorAll('#list .link').length };

      // Un seul lien coche.
      document.querySelector('#list .link__check').click();
      await pause(350);
      scope.value = 'selected'; scope.dispatchEvent(new Event('change'));
      await pause(300);
      const une = { label: button.textContent, hint: hint.textContent, disabled: button.disabled };

      // Trois liens coches : le libelle doit suivre, pas rester au singulier.
      const cases = [...document.querySelectorAll('#list .link__check')].slice(1, 3);
      for (const c of cases) c.click();
      await pause(400);
      const trois = { label: button.textContent, hint: hint.textContent, disabled: button.disabled };

      // Deux exemplaires : le total doit doubler.
      const copies = document.getElementById('print-copies');
      copies.value = '2'; copies.dispatchEvent(new Event('input'));
      await pause(300);
      const double = { label: button.textContent, hint: hint.textContent };
      copies.value = '1'; copies.dispatchEvent(new Event('input'));
      await pause(250);

      scope.value = 'all'; scope.dispatchEvent(new Event('change'));
      await pause(300);
      const tout = { label: button.textContent, hint: hint.textContent,
                     disabled: button.disabled };

      // On vide la selection : la laisser fausserait toutes les verifications
      // suivantes, qui comptent les etiquettes d'une planche.
      const master2 = document.getElementById('select-all-box');
      if (master2.checked || master2.indeterminate) master2.click();
      await pause(400);

      return {
        options: [...scope.options].map((option) => option.value),
        vide, une, trois, double, tout,
        total: document.querySelectorAll('#list .link').length,
      };
    })()`);

    record(
      "le choix des liens a imprimer est explicite",
      (scopeChoice?.options ?? []).join(',') === 'all,selected'
        && /coche/.test(scopeChoice?.options ? '' : '')
        || (scopeChoice?.options ?? []).join(',') === 'all,selected',
      (scopeChoice?.options ?? []).join(', '),
    );
    record(
      "l'apercu du bouton dit ce qui va sortir, sans ambiguite",
      // Le libelle porte toujours un nombre d'etiquettes, et il suit la
      // selection : 1 lien coche donne 1 etiquette, pas la collection entiere.
      // Forme « Imprimer <n> étiquette(s) », testée sans expression régulière
      // complexe : le nombre et le mot suffisent à lever l'ambiguïté.
      (scopeChoice?.une?.label ?? '').includes('Imprimer')
        && (scopeChoice.une.label.includes('1 étiquette')
          || scopeChoice.une.label.includes('1 étiquettes'))
        && scopeChoice.une.label !== scopeChoice.vide.label,
      `rien coche : « ${scopeChoice?.vide?.label} » · 1 coche : « ${scopeChoice?.une?.label} »`,
    );
    record(
      "le libelle suit le nombre de liens coches",
      (scopeChoice?.trois?.label ?? '').includes('3')
        && (scopeChoice?.trois?.hint ?? '').includes('3'),
      `« ${scopeChoice?.trois?.label} » — ${scopeChoice?.trois?.hint}`,
    );
    record(
      "deux exemplaires doublent le total annonce",
      (scopeChoice?.double?.label ?? '').includes('6')
        && (scopeChoice?.double?.label ?? '').includes('3')
        && (scopeChoice?.double?.hint ?? '').includes('2'),
      `« ${scopeChoice?.double?.label} » — ${scopeChoice?.double?.hint}`,
    );
    // Rien de coche + portee « toute la collection » : c'est « tout » qui part,
    // et le bouton doit l'annoncer sans ambiguite.
    record(
      "sans lien coche, le bouton annonce la collection entiere",
      (scopeChoice?.vide?.label ?? '').includes(String(scopeChoice?.vide?.total))
        || (scopeChoice?.vide?.label ?? '') === 'Aucun lien à imprimer',
      `« ${scopeChoice?.vide?.label} » (${scopeChoice?.vide?.total} liens)`,
    );
    record(
      "toute la collection annonce son nombre de liens",
      // Sans imprimante, le bouton reste inerte : c'est son libelle qui doit
      // annoncer la portee, et il porte le nombre de liens de la collection.
      (scopeChoice?.tout?.label ?? '').includes(String(scopeChoice?.vide?.total))
        && scopeChoice?.vide?.total > 1,
      `« ${scopeChoice?.tout?.label} » pour ${scopeChoice?.vide?.total} liens`,
    );


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

    // --- Ce qui sera imprimé est écrit, pas à deviner ---------------------
    const scope = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const hint = document.getElementById('selection-hint');
      const print = document.getElementById('print');

      const master = document.getElementById('select-all-box');
      const state = (hint, print) => ({
        hint: hint.textContent,
        bouton: print.textContent,
        cochee: master.checked,
        partielle: master.indeterminate,
      });

      // Rien de coché au départ : on part d'un état connu.
      if (master.checked || master.indeterminate) master.click();
      await pause(350);

      // Tout cocher d'un geste : la case maîtresse se coche elle-même.
      master.click();
      await pause(400);
      const all = state(hint, print);

      // Une seule case cochée : la maîtresse devient partielle.
      master.click();
      await pause(350);
      document.querySelector('#list .link__check').click();
      await pause(400);
      const one = state(hint, print);

      // Plus rien de coché : contre-intuitif — c'est « tout » — donc annoncé.
      master.click();
      master.click();
      await pause(400);
      const none = state(hint, print);

      return { all, one, none, total: document.querySelectorAll('#list .link').length };
    })()`);

    // La liste peut être filtrée par une recherche : on lit les nombres dans
    // les phrases elles-mêmes plutôt que dans le DOM, et on vérifie qu'ils
    // concordent avec le libellé du bouton.
    const labelCount = (text) => Number((text.match(/(\d+)/) ?? [])[1] ?? 0);
    const hintPair = (text) => {
      const found = text.match(/(\d+) lien[s]? coché[s]? sur (\d+)/);
      return found ? { done: Number(found[1]), total: Number(found[2]) } : null;
    };

    record(
      'la phrase dit la portée de l\'impression',
      // Le premier nombre de la phrase est celui du bouton : quelle que soit la
      // formulation, les deux disent la même chose.
      labelCount(scope.all.hint) === labelCount(scope.all.bouton)
        && /^Imprimer les \d+ liens$/.test(scope.all.bouton)
        && scope.one.bouton === 'Imprimer la sélection (1)'
        && hintPair(scope.one.hint)?.done === 1
        && labelCount(scope.none.hint) === labelCount(scope.none.bouton)
        // Et la case maîtresse montre l'état : cochée, partielle, vide.
        && scope.all.cochee === true && scope.all.partielle === false
        && scope.one.cochee === false && scope.one.partielle === true
        && scope.none.cochee === false && scope.none.partielle === false,
      `maîtresse : cochée=${scope.all.cochee} partielle=${scope.one.partielle} `
        + `vide=${scope.none.cochee} · « ${scope.one.bouton} » (${scope.one.hint})`,
    );
    record(
      'tout décocher annonce que l\'impression porte sur tout',
      /Aucun lien coché/.test(scope.none.hint)
        && /toute la collection \(\d+\)/.test(scope.none.hint)
        && /^Imprimer les \d+ liens$/.test(scope.none.bouton)
        && labelCount(scope.none.bouton) === scope.total,
      `« ${scope.none.hint} » → « ${scope.none.bouton} »`,
    );

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
      // Mesure **relative à la page**, pas au viewport : l'aperçu défile, et
      // une position en coordonnées écran change alors sans que la grille bouge.
      const firstCell = () => {
        const cell = document.querySelector('#preview .print-cell');
        const page = document.querySelector('#preview .print-page');
        const rect = cell.getBoundingClientRect();
        const box = page.getBoundingClientRect();
        return { x: rect.x - box.x, y: rect.y - box.y };
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
      `dx ${tweaks.dx.toFixed(1)}/attendu ${(3 * tweaks.pxPerMm).toFixed(1)} · `
        + `dy ${tweaks.dy.toFixed(1)}/attendu ${(2 * tweaks.pxPerMm).toFixed(1)} · `
        + `retour x ${tweaks.backDx.toFixed(1)} ${tweaks.backDy === undefined ? '' : `/ y ${tweaks.backDy.toFixed(1)}`}`
        + `/attendu ${(4 * tweaks.pxPerMm).toFixed(1)} · QR ${tweaks.baseQr.toFixed(1)} → ${tweaks.movedQr.toFixed(1)}`,
    );

    // --- Date imprimée sous le QR code -----------------------------------
    //
    // Chaque ligne sous le QR se paie en place disponible : la date doit
    // apparaître dans les quatre mises en forme, et faire céder le QR.
    const dated = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const caseDate = document.getElementById('sheet-date');
      const caseHeure = document.getElementById('sheet-date-time');
      const cocher = (box, value) => { box.checked = value; box.dispatchEvent(new Event('change')); };
      const slider = document.getElementById('sheet-qr');
      const hint = document.getElementById('sheet-date-hint');
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
      cocher(caseDate, false);
      cocher(caseHeure, false);
      await pause(350);
      const none = await inspectSheet();
      const hintNone = hint.textContent;

      cocher(caseDate, true);
      cocher(caseHeure, true);
      await pause(350);
      const withDate = await inspectSheet();

      // Le tableau a sa propre colonne Date : on la coche dans son onglet.
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
      await pause(300);
      cocher(document.getElementById('table-col-date'), true);
      cocher(document.getElementById('table-col-date-time'), true);
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
      const caseDate = document.getElementById('sheet-date');
      const caseHeure = document.getElementById('sheet-date-time');
      caseDate.checked = false; caseDate.dispatchEvent(new Event('change'));
      caseHeure.checked = false; caseHeure.dispatchEvent(new Event('change'));
      const format = document.getElementById('label-format');
      format.value = 'niimbot-d110';
      format.dispatchEvent(new Event('change'));
      // Vider la sélection : la case maîtresse suffit, à condition qu'elle
      // soit cochée — sinon le clic la coche et sélectionne tout.
      const master = document.getElementById('select-all-box');
      if (!master.checked) master.click();
      master.click();
      const preset = document.getElementById('preset');
      preset.value = 'a4-3x8';
      preset.dispatchEvent(new Event('change'));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'sheet').click();
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    // --- Sur des colonnes étroites, la date est écartée proprement ---------
    const narrow = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const preset = document.getElementById('preset');
      const columns = document.getElementById('sheet-columns');
      const rows = document.getElementById('sheet-rows');
      const marginX = document.getElementById('sheet-margin-x');
      const marginY = document.getElementById('sheet-margin-y');
      const gapX = document.getElementById('sheet-gap-x');
      const gapY = document.getElementById('sheet-gap-y');
      const info = document.getElementById('sheet-info');

      const caseDate = document.getElementById('sheet-date');
      const caseHeure = document.getElementById('sheet-date-time');
      caseDate.checked = true; caseDate.dispatchEvent(new Event('change'));
      caseHeure.checked = true; caseHeure.dispatchEvent(new Event('change'));
      columns.value = '12'; columns.dispatchEvent(new Event('input'));
      rows.value = '6'; rows.dispatchEvent(new Event('input'));
      marginX.value = '2'; marginX.dispatchEvent(new Event('input'));
      marginY.value = '2'; marginY.dispatchEvent(new Event('input'));
      gapX.value = '0'; gapX.dispatchEvent(new Event('input'));
      gapY.value = '0'; gapY.dispatchEvent(new Event('input'));
      await pause(500);

      const cell = document.querySelector('#preview .print-page:first-child .print-cell');
      const lines = [...(cell?.querySelectorAll('.print-cell__text span') ?? [])]
        .map((span) => span.textContent);

      const state = {
        info: info.textContent,
        lines,
        widthMm: cell ? cell.getBoundingClientRect().width : 0,
      };

      // Remise en état : la grille de la planche A4 3 × 8.
      preset.value = 'a4-3x8';
      preset.dispatchEvent(new Event('change'));
      caseDate.checked = false; caseDate.dispatchEvent(new Event('change'));
      caseHeure.checked = false; caseHeure.dispatchEvent(new Event('change'));
      await pause(300);
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
      const preset = document.getElementById('preset');
      const cols = document.getElementById('sheet-columns');
      const rows = document.getElementById('sheet-rows');
      const marginX = document.getElementById('sheet-margin-x');
      const marginY = document.getElementById('sheet-margin-y');
      const gapX = document.getElementById('sheet-gap-x');
      const gapY = document.getElementById('sheet-gap-y');
      const info = document.getElementById('sheet-info');

      // La disposition doit avoir prérempli les six champs.
      const prefilled = {
        columns: cols.value, rows: rows.value,
        marginX: marginX.value, marginY: marginY.value,
      };

      const run = async (c, r, m, g) => {
        cols.value = String(c); cols.dispatchEvent(new Event('input'));
        rows.value = String(r); rows.dispatchEvent(new Event('input'));
        marginX.value = String(m); marginX.dispatchEvent(new Event('input'));
        marginY.value = String(m); marginY.dispatchEvent(new Event('input'));
        gapX.value = String(g); gapX.dispatchEvent(new Event('input'));
        gapY.value = String(g); gapY.dispatchEvent(new Event('input'));
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

      preset.value = 'a4-3x8';
      preset.dispatchEvent(new Event('change'));
      await pause();

      return { prefilled, fourBySix, twoByThree };
    })()`);

    const wording = await evaluate(`(async () => {
      const hint = document.getElementById('sheet-fit-hint');
      const fields = ['sheet-columns', 'sheet-rows', 'sheet-margin-x', 'sheet-margin-y',
        'sheet-gap-x', 'sheet-gap-y']
        .map((id) => document.getElementById(id));
      return {
        mode: document.getElementById('sheet-fit-mode') ? 'présent' : 'absent',
        champs: fields.map((f) => (f ? f.value : 'absent')),
        libelles: fields.map((f) => (f
          ? f.closest('.field').querySelector('.field__label').textContent
          : 'absent')),
        hint: hint.textContent,
      };
    })()`);

    record(
      'une seule présentation : plus de sélecteur de mode',
      wording.mode === 'absent',
      wording.mode,
    );
    record(
      'les six valeurs de la grille sont visibles et préremplies',
      wording.champs.every((value) => value !== 'absent' && value !== '')
        && wording.libelles.every((label) => label !== 'absent'),
      wording.libelles.map((label, index) => `${label} = ${wording.champs[index]}`).join(' · '),
    );
    record(
      'la phrase annonce la taille déduite',
      /déduite de ces six valeurs/.test(wording.hint) && /par feuille/.test(wording.hint),
      wording.hint,
    );

    record(
      'changer de planche réécrit les six champs',
      fill.prefilled.columns === '3' && fill.prefilled.rows === '8'
        && Number(fill.prefilled.marginX) > 0 && Number(fill.prefilled.marginY) > 0,
      `${fill.prefilled.columns} × ${fill.prefilled.rows}, `
        + `marges ${fill.prefilled.marginX} × ${fill.prefilled.marginY} mm`,
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

    // --- Tableau : colonnes choisies, et numéro qui renvoie à la liste -----
    const table = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
      await pause(400);

      const headers = () => [...document.querySelectorAll('#preview .print-table th')]
        .map((th) => th.textContent);
      const firstRow = () => [...document.querySelectorAll('#preview .print-table tbody tr')][0];

      // La colonne Date a pu etre cochee par une verification precedente.
      const dateCol = document.getElementById('table-col-date');
      const dateTime = document.getElementById('table-col-date-time');
      if (dateCol.checked || dateTime.checked) {
        dateCol.checked = false; dateCol.dispatchEvent(new Event('change'));
        dateTime.checked = false; dateTime.dispatchEvent(new Event('change'));
        await pause(300);
      }

      const initial = {
        headers: headers(),
        tagsDisabled: document.getElementById('table-col-tags').disabled,
        noteDisabled: document.getElementById('table-col-note').disabled,
        // Le rang affiché dans la liste, pour le premier lien.
        listRanks: [...document.querySelectorAll('#list .link__index')].map((s) => s.textContent),
        firstRowNumber: firstRow()?.querySelector('td')?.textContent ?? '',
      };

      // Colonnes « Tags » et « Note » activées, puis affichées.
      const tags = document.getElementById('table-col-tags');
      const note = document.getElementById('table-col-note');
      tags.checked = true; tags.dispatchEvent(new Event('change'));
      note.checked = true; note.dispatchEvent(new Event('change'));
      await pause(400);

      const withExtras = {
        headers: headers(),
        tags: [...document.querySelectorAll('#preview .print-table tbody tr td')]
          .map((td) => td.textContent).filter((text) => text.includes('veille'))[0] ?? '',
        note: [...document.querySelectorAll('#preview .print-table tbody tr td')]
          .map((td) => td.textContent).filter((text) => text.includes('Note saisie'))[0] ?? '',
      };

      // Sans la colonne « N° », elle disparaît.
      const index = document.getElementById('table-col-index');
      index.checked = false; index.dispatchEvent(new Event('change'));
      await pause(400);
      const withoutIndex = headers();

      index.checked = true; index.dispatchEvent(new Event('change'));
      tags.checked = false; tags.dispatchEvent(new Event('change'));
      note.checked = false; note.dispatchEvent(new Event('change'));
      await pause(300);

      return { initial, withExtras, withoutIndex };
    })()`);

    record(
      'les tags et la note sont proposés quand la collection en contient',
      table.initial.tagsDisabled === false && table.initial.noteDisabled === false,
      `tags ${table.initial.tagsDisabled ? 'inertes' : 'actifs'}, `
        + `note ${table.initial.noteDisabled ? 'inertes' : 'actifs'}`,
    );
    record(
      'chaque colonne du tableau se coche séparément',
      table.initial.headers.join(' / ') === 'N° / QR / URL / Titre'
        && table.withExtras.headers.includes('Tags')
        && table.withExtras.headers.includes('Note')
        && table.withoutIndex[0] !== 'N°',
      `${table.initial.headers.join(' / ')} → ${table.withExtras.headers.join(' / ')} → `
        + `${table.withoutIndex.join(' / ')}`,
    );
    record(
      'les colonnes Tags et Note reprennent ce qui a été saisi',
      table.withExtras.tags.includes('veille travail')
        && table.withExtras.note === 'Note saisie à la main',
      `« ${table.withExtras.tags} » / « ${table.withExtras.note} »`,
    );
    record(
      'le N° du tableau est le rang affiché dans la liste',
      table.initial.listRanks.slice(0, 3).join(',') === '1,2,3'
        && table.initial.firstRowNumber === table.initial.listRanks[0],
      `liste ${table.initial.listRanks.slice(0, 3).join(',')}… `
        + `première ligne du tableau : n° ${table.initial.firstRowNumber}`,
    );

    // --- Tableau imprimé : sens de la feuille, marges et en-tête -----------
    //
    // La page était figée en A4 portrait, sans marges réglables ni titre : un
    // tableau large se faisait rogner, et une liasse imprimée ne disait pas de
    // quelle collection elle venait.
    const tablePage = await evaluate(`(async () => {
      const pause = (ms) => new Promise((r) => setTimeout(r, ms));
      const el = (id) => document.getElementById(id);
      [...document.querySelectorAll('.tab')].find((t) => t.dataset.mode === 'table').click();
      await pause(600);

      const mesurer = () => {
        const page = document.querySelector('#preview .print-page');
        if (!page) return null;
        const titre = page.querySelector('.print-page__title');
        return {
          largeurMm: parseFloat(page.style.width),
          hauteurMm: parseFloat(page.style.height),
          padding: page.style.padding,
          titre: titre ? titre.textContent : '',
          tableau: Boolean(page.querySelector('.print-table')),
        };
      };

      const portrait = mesurer();

      el('table-orientation').value = 'landscape';
      el('table-orientation').dispatchEvent(new Event('change'));
      await pause(500);
      const paysage = mesurer();

      el('table-margin-x').value = '25';
      el('table-margin-x').dispatchEvent(new Event('input'));
      el('table-margin-y').value = '5';
      el('table-margin-y').dispatchEvent(new Event('input'));
      await pause(500);
      const marges = mesurer();

      el('table-title').checked = false;
      el('table-title').dispatchEvent(new Event('change'));
      await pause(400);
      const sansTitre = mesurer();

      el('table-title').checked = true;
      el('table-title').dispatchEvent(new Event('change'));
      el('table-title-date').checked = true;
      el('table-title-date').dispatchEvent(new Event('change'));
      await pause(450);
      const avecDate = mesurer();

      // Remise en etat.
      el('table-orientation').value = 'portrait';
      el('table-orientation').dispatchEvent(new Event('change'));
      el('table-margin-x').value = '10';
      el('table-margin-x').dispatchEvent(new Event('input'));
      el('table-margin-y').value = '12';
      el('table-margin-y').dispatchEvent(new Event('input'));
      el('table-title-date').checked = false;
      el('table-title-date').dispatchEvent(new Event('change'));
      await pause(400);

      return { portrait, paysage, marges, sansTitre, avecDate,
               collection: el('collection-name').value };
    })()`);

    record(
      "le tableau s'imprime en portrait ou en paysage",
      tablePage?.portrait?.largeurMm === 210 && tablePage?.portrait?.hauteurMm === 297
        && tablePage?.paysage?.largeurMm === 297 && tablePage?.paysage?.hauteurMm === 210,
      `portrait ${tablePage?.portrait?.largeurMm}×${tablePage?.portrait?.hauteurMm} mm `
        + `· paysage ${tablePage?.paysage?.largeurMm}×${tablePage?.paysage?.hauteurMm} mm`,
    );
    record(
      "les marges du tableau sont réglables",
      tablePage?.marges?.padding === '5mm 25mm',
      `marges posées : ${tablePage?.marges?.padding}`,
    );
    record(
      "le nom de la collection s'imprime en tête",
      tablePage?.portrait?.titre === tablePage?.collection
        && tablePage?.sansTitre?.titre === ''
        && /\d{2}\/\d{2}\/\d{4}/.test(tablePage?.avecDate?.titre ?? ''),
      `« ${tablePage?.portrait?.titre} » · sans titre « ${tablePage?.sansTitre?.titre} » `
        + `· avec date « ${tablePage?.avecDate?.titre} »`,
    );
    record(
      "le tableau reste dans sa page, quel que soit le sens",
      tablePage?.portrait?.tableau === true && tablePage?.paysage?.tableau === true,
      'tableau présent dans les deux sens',
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
