/**
 * Mesure de la mise en page automatique, chiffres en main.
 *
 * Question posée : sur un format où l'étiquette est presque carrée — l'A4 3 × 4,
 * 63,5 × 69,1 mm —, la mise en page automatique propose une grille dont le texte
 * ne tient pas. Mesuré par le relevé : 49 liens → **10 × 5 = 50** étiquettes de
 * **18,2 × 55 mm**, et **45 lignes coupées**.
 *
 * Le script ne porte aucun verdict : il rend des nombres. Il importe le **même
 * module** que l'application (`core/sheet.js`, servi en HTTP pour que le
 * navigateur accepte un module ES) et mesure le texte par un canevas réglé sur la
 * **même police** que le produit — c'est la mesure du produit, pas une
 * approximation.
 *
 * Ce qu'il rend :
 *
 * 1. **La courbe du besoin** — combien de lignes de texte le contenu réclame à
 *    chaque largeur d'étiquette ;
 * 2. **Ce que le calcul actuel choisit**, reproduit à l'identique : les deux
 *    passes de `appliquerMiseEnPageAutomatique` — la seconde recalcule le besoin
 *    à la largeur que la première a retenue ;
 * 3. **Ce que le rendu en ferait** — les lignes que la place offre réellement
 *    dans l'étiquette choisie, et le nombre d'étiquettes dont le texte serait
 *    coupé. C'est la confrontation des deux qui dit d'où vient le défaut.
 *
 * Usage : node scripts/measure-auto-layout.mjs [liens] [preset] [pt|tous]
 */

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { serve } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');
const PROFIL = join(ROOT, '.verify-chrome', 'profile-auto');
const PORT_CDP = 9355;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const LIENS = Number(process.argv[2] ?? 49);
const PRESET = process.argv[3] ?? 'a4-3x4';
const ARG_PT = process.argv[4] ?? '14';
const POLICES = ARG_PT === 'tous' ? [4, 7, 9.5, 14] : [Number(ARG_PT)];
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Connexion réduite au protocole de débogage. */
async function connect(url) {
  const socket = new WebSocket(url);
  let suite = 0;
  const enAttente = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const pending = enAttente.get(message.id);
    if (!pending) return;
    enAttente.delete(message.id);
    if (message.error) pending.reject(new Error(message.error.message));
    else pending.resolve(message.result ?? {});
  });
  await new Promise((ok, ko) => {
    socket.addEventListener('open', ok);
    socket.addEventListener('error', ko);
  });
  const call = (method, params = {}) => new Promise((ok, ko) => {
    suite += 1;
    enAttente.set(suite, { resolve: ok, reject: ko });
    socket.send(JSON.stringify({ id: suite, method, params }));
  });
  return { socket, call };
}

async function main() {
  rmSync(PROFIL, { recursive: true, force: true });
  mkdirSync(PROFIL, { recursive: true });

  const serveur = await serve({ dir: DIST_WEB, port: 0 });
  const navigateur = spawn(CHROME, [
    '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${PROFIL}`, `--remote-debugging-port=${PORT_CDP}`,
    '--window-size=1280,900', '--window-position=-3000,-3000',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    let version = null;
    for (let essai = 0; essai < 80 && !version; essai += 1) {
      version = await fetch(`http://127.0.0.1:${PORT_CDP}/json/version`)
        .then((r) => r.json()).catch(() => null);
      if (!version) await pause(250);
    }
    if (!version) throw new Error('Chrome ne répond pas sur le port de débogage');

    const cible = await fetch(
      `http://127.0.0.1:${PORT_CDP}/json/new?${encodeURIComponent(serveur.url)}`,
      { method: 'PUT' },
    ).then((r) => r.json());
    const session = await connect(cible.webSocketDebuggerUrl);
    await session.call('Runtime.enable');
    await pause(1200);

    const evaluate = async (expression) => {
      const reponse = await session.call('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (reponse.exceptionDetails) {
        throw new Error(reponse.exceptionDetails.exception?.description ?? 'erreur');
      }
      return reponse.result?.value;
    };

    const mesure = await evaluate(`(async () => {
      const sheet = await import('/core/sheet.js');
      const qr = await import('/core/qr.js');

      // **La même police que le produit**, et la même fabrique de mesure :
      // \`createTextMeasure\` d'app.js. Une autre police donnerait d'autres
      // nombres, et la mesure ne porterait plus sur le produit.
      const canevas = document.createElement('canvas');
      const ctx = canevas.getContext('2d');
      const famille = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif';

      // Le contenu du relevé : quarante-cinq adresses à \`?ref=releve\`, plus les
      // liens courts que les contrôles précédents ont laissés dans la collection.
      // Aucune adresse ne dépasse 46 caractères — la plus longue que le relevé
      // ait semée est « un-article-assez-long-pour-un-qr ».
      const liens = [];
      for (let i = 0; i < 45; i += 1) {
        const numero = String(i + 1).padStart(3, '0');
        liens.push({
          url: 'https://exemple.fr/article-' + numero + '?ref=releve',
          title: 'Article ' + numero + ' — un titre de longueur ordinaire',
        });
      }
      liens.push({
        url: 'https://exemple.fr/un-article-assez-long-pour-un-qr',
        title: 'Un article de fond sur la question',
      });
      liens.push({ url: 'https://exemple.fr/article-un', title: 'Un article de fond' });
      liens.push({ url: 'https://exemple.fr/article-deux', title: 'Un second article' });
      liens.push({ url: 'https://exemple.fr/article-trois', title: 'Un troisième article' });
      const contenu = liens.slice(0, ${LIENS});

      const modules = contenu.reduce(
        (plus, l) => Math.max(plus, qr.encodeQr(l.url, { ecc: 'M', border: 1 }).size),
        21,
      );
      const parModules = {};
      for (const l of contenu) {
        const taille = qr.encodeQr(l.url, { ecc: 'M', border: 1 }).size;
        parModules[taille] = (parModules[taille] ?? 0) + 1;
      }

      const preset = sheet.SHEET_PRESETS['${PRESET}'];
      const page = sheet.PAGE_SIZES[preset.page];
      const count = contenu.length;
      const ratio = 0.7;
      const cote = modules * sheet.MIN_MODULE_MM_PAPER;

      const scenarios = [];
      for (const fontPt of ${JSON.stringify(POLICES)}) {
        const metrics = sheet.sheetTextMetrics({ fontSizePt: fontPt });
        ctx.font = metrics.fontSizePx + 'px ' + famille;
        const mesure = (texte) => ctx.measureText(texte).width;

        for (const garde of [{ titre: true, url: true }, { titre: true, url: false }]) {
          const blocsParLien = contenu.map((l) => sheet.sheetCellBlocks(l, {
            title: garde.titre, url: garde.url,
          }));
          const base = {
            pageWidthMm: page.widthMm,
            pageHeightMm: page.heightMm,
            marginXMm: preset.marginXMm,
            marginYMm: preset.marginYMm,
            gapXMm: preset.gapXMm,
            gapYMm: preset.gapYMm,
          };

          /** Les lignes réclamées par le contenu le plus long, à cette largeur. */
          const lignesPour = (largeurMm) => {
            const dedans = Math.max(1, largeurMm - sheet.SHEET_CELL_MARGIN_MM * 2);
            const largeurPx = (dedans * 96) / 25.4;
            return blocsParLien.reduce((plus, blocs) => {
              const total = blocs.reduce((somme, bloc) => somme + sheet.sheetCellLines(bloc.text, {
                measure: mesure, innerWidthPx: largeurPx, maxLines: 99,
              }).length, 0);
              return Math.max(plus, total);
            }, 1);
          };

          /** Ce que le calcul actuel demande : QR Code au minimum lisible. */
          const besoinPour = (largeurMm) => ({
            widthMm: cote + sheet.SHEET_CELL_MARGIN_MM * 2,
            heightMm: cote + sheet.SHEET_CELL_MARGIN_MM * 2
              + sheet.SHEET_QR_GAP_MM + lignesPour(largeurMm) * metrics.lineHeightMm,
          });

          const premier = sheet.autoSheetLayout({
            count, ...base,
            minLabelWidthMm: besoinPour(preset.labelWidthMm).widthMm,
            minLabelHeightMm: besoinPour(preset.labelWidthMm).heightMm,
          });
          const second = sheet.autoSheetLayout({
            count, ...base,
            minLabelWidthMm: besoinPour(premier.labelWidthMm).widthMm,
            minLabelHeightMm: besoinPour(premier.labelWidthMm).heightMm,
          });

          /** Les lignes que la place offre, tel que le rendu les compte. */
          const offre = (largeurMm, hauteurMm) => {
            const coteQr = sheet.qrSideMm(largeurMm, hauteurMm, ratio);
            const espace = hauteurMm - sheet.SHEET_CELL_MARGIN_MM * 2 - coteQr - sheet.SHEET_QR_GAP_MM;
            return {
              coteQr,
              espace,
              maxLines: Math.max(0, Math.floor(espace / metrics.lineHeightMm + 1e-3)),
            };
          };

          const place = offre(second.labelWidthMm, second.labelHeightMm);

          // Combien d'étiquettes le rendu couperait-il ? Le budget est celui du
          // texte, compté comme le rendu le compte.
          const coupees = blocsParLien.filter((blocs) => {
            const dedans = Math.max(1, second.labelWidthMm - sheet.SHEET_CELL_MARGIN_MM * 2);
            const largeurPx = (dedans * 96) / 25.4;
            let reste = place.maxLines;
            for (const bloc of blocs) {
              if (reste <= 0) return true;
              const dessinees = sheet.sheetCellLines(bloc.text, {
                measure: mesure, innerWidthPx: largeurPx, maxLines: reste,
              });
              if (dessinees.length >= reste
                && sheet.sheetCellLines(bloc.text, {
                  measure: mesure, innerWidthPx: largeurPx, maxLines: 99,
                }).length > dessinees.length) return true;
              reste -= dessinees.length;
            }
            return false;
          }).length;

          scenarios.push({
            fontPt,
            garde: garde.url ? 'titre + URL' : 'titre seul',
            premier: { g: premier.columns + 'x' + premier.rows, w: premier.labelWidthMm, h: premier.labelHeightMm },
            second: { g: second.columns + 'x' + second.rows, w: second.labelWidthMm, h: second.labelHeightMm },
            lignesAuChoisi: lignesPour(second.labelWidthMm),
            lignesOffertes: place.maxLines,
            qrMm: Math.round(place.coteQr * 10) / 10,
            coupees,
          });
        }
      }

      // La courbe du besoin, à la première police demandée.
      const fontPt0 = ${JSON.stringify(POLICES)}[0];
      const metrics0 = sheet.sheetTextMetrics({ fontSizePt: fontPt0 });
      ctx.font = metrics0.fontSizePx + 'px ' + famille;
      const mesure0 = (texte) => ctx.measureText(texte).width;
      const blocs0 = contenu.map((l) => sheet.sheetCellBlocks(l, { title: true, url: true }));
      const courbe = [];
      for (let w = 8; w <= 70; w += 2) {
        const largeurPx = ((w - sheet.SHEET_CELL_MARGIN_MM * 2) * 96) / 25.4;
        const lignes = blocs0.reduce((plus, blocs) => Math.max(plus, blocs.reduce((somme, bloc) => (
          somme + sheet.sheetCellLines(bloc.text, {
            measure: mesure0, innerWidthPx: largeurPx, maxLines: 99,
          }).length
        ), 0)), 1);
        courbe.push({ largeur: w, lignes });
      }

      return {
        preset: '${PRESET}',
        count,
        modules,
        parModules,
        metric: { fontSizePx: metrics0.fontSizePx, lineHeightMm: metrics0.lineHeightMm },
        scenarios,
        courbe,
      };
    })()`);

    console.log(JSON.stringify({
      preset: mesure.preset,
      count: mesure.count,
      modules: mesure.modules,
      parModules: mesure.parModules,
      metric: mesure.metric,
      courbe: mesure.courbe,
    }, null, 2));
    console.log('\nScénarios — ce que le calcul choisit, et ce que le rendu en ferait :');
    for (const s of mesure.scenarios) {
      console.log(`  ${String(s.fontPt).padStart(4)} pt · ${s.garde.padEnd(11)} → `
        + `${s.premier.g} puis ${s.second.g} (${s.second.w} × ${s.second.h} mm) · `
        + `lignes ${s.lignesAuChoisi} pour ${s.lignesOffertes} offertes · `
        + `QR ${s.qrMm} mm · ${s.coupees} coupée(s)`);
    }
  } finally {
    navigateur.kill('SIGKILL');
    await serveur.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
