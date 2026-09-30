/**
 * Tests de la géométrie des planches d'impression.
 * Les cotes sont en millimètres : une dérive d'un dixième décale une planche
 * d'étiquettes autocollantes de façon visible.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PAGE_SIZES, SHEET_PRESETS, computeSheet, paginate, fitGrid, clampGrid, spacingForGrid,
  sheetCellBlocks, sheetCellLines, qrRatioBounds, qrSideMm, sheetTextMetrics, sheetTextBudget,
  autoSheetLayout,
  sheetHeaderFits, round1,
  SHEET_HEADER_MM, SHEET_CELL_MARGIN_MM, SHEET_QR_GAP_MM, SHEET_FONT_PT, MIN_MODULE_MM_PAPER,
  MIN_QR_RATIO,
} from '../src/core/sheet.js';

/**
 * Préréglage de référence. Les attentes sont dérivées de ses propres cotes
 * plutôt que codées en dur : une correction de marge ne doit pas casser les
 * tests de mise en page, seuls les tests de valeurs doivent bouger.
 */
const BASE = SHEET_PRESETS['a4-3x8'];
const COLUMN_STEP = BASE.labelWidthMm + BASE.gapXMm;
const ROW_STEP = BASE.labelHeightMm + BASE.gapYMm;

test('une planche A4 3 × 8 place 24 étiquettes', () => {
  const layout = computeSheet({ count: 24, ...BASE });
  assert.equal(layout.columns, 3);
  assert.equal(layout.rows, 8);
  assert.equal(layout.perPage, 24);
  assert.equal(layout.pages, 1);
  assert.equal(layout.cells.length, 24);
  assert.deepEqual(layout.warnings, [], 'le préréglage ne doit rien laisser perdre');
});

test('la première étiquette tombe exactement sur la marge', () => {
  const layout = computeSheet({ count: 1, ...BASE });
  assert.equal(layout.cells[0].xMm, BASE.marginXMm);
  assert.equal(layout.cells[0].yMm, BASE.marginYMm);
});

test('les colonnes avancent de la largeur plus l\'écart', () => {
  const layout = computeSheet({ count: 3, ...BASE });
  const [a, b, c] = layout.cells;
  assert.equal(a.xMm, BASE.marginXMm);
  assert.equal(b.xMm, BASE.marginXMm + COLUMN_STEP);
  assert.equal(c.xMm, BASE.marginXMm + 2 * COLUMN_STEP);
  // Toutes les cellules d'une rangée partagent la même ordonnée.
  assert.equal(a.yMm, b.yMm);
  assert.equal(b.yMm, c.yMm);
});

test('la quatrième étiquette passe à la rangée suivante', () => {
  const layout = computeSheet({ count: 4, ...BASE });
  assert.equal(layout.cells[3].column, 0);
  assert.equal(layout.cells[3].row, 1);
  assert.equal(layout.cells[3].yMm, BASE.marginYMm + ROW_STEP);
});

test('aucune étiquette ne déborde de la page', () => {
  const layout = computeSheet({ count: 24, ...BASE });
  for (const cell of layout.cells) {
    assert.ok(
      cell.xMm + layout.labelWidthMm <= layout.pageWidthMm,
      `débordement horizontal à l'étiquette ${cell.index}`,
    );
    assert.ok(
      cell.yMm + layout.labelHeightMm <= layout.pageHeightMm,
      `débordement vertical à l'étiquette ${cell.index}`,
    );
  }
});

test('au-delà de la capacité, une nouvelle page commence', () => {
  const layout = computeSheet({ count: 30, ...BASE });
  assert.equal(layout.pages, 2);
  assert.equal(layout.cells[24].page, 1);
  assert.equal(layout.cells[24].xMm, BASE.marginXMm);
  assert.equal(layout.cells[24].yMm, BASE.marginYMm);
});

test('une étiquette plus grande que la zone utile produit un avertissement', () => {
  const layout = computeSheet({
    count: 4, page: 'a4', labelWidthMm: 250, labelHeightMm: 30,
  });
  assert.equal(layout.columns, 0);
  assert.equal(layout.perPage, 0);
  assert.equal(layout.pages, 0);
  assert.equal(layout.cells.length, 0);
  assert.match(layout.warnings[0], /Aucune étiquette ne tient/);
});

test('un espace perdu à droite de la grille est signalé', () => {
  // 210 mm de large, première étiquette à 100 mm du bord : une seule colonne de
  // 60 mm tient, et 50 mm restent perdus à droite — de quoi en placer une autre.
  const layout = computeSheet({
    count: 2, pageWidthMm: 210, pageHeightMm: 297,
    labelWidthMm: 60, labelHeightMm: 60, marginXMm: 100, marginYMm: 10,
  });
  assert.equal(layout.columns, 1);
  assert.ok(layout.warnings.some((w) => /à droite de la dernière colonne/.test(w)));
});

test('les marges situent la première étiquette, elles ne sont pas symétriques', () => {
  // Cotes réelles d'une Avery L7160 : 8,6 mm à gauche, 5,1 mm à droite.
  // Un modèle à marges symétriques ne placerait que deux colonnes sur trois.
  const layout = computeSheet({ count: 21, ...SHEET_PRESETS['avery-l7160'] });
  assert.equal(layout.columns, 3);
  assert.equal(layout.rows, 7);
  assert.equal(layout.perPage, 21);

  const gridWidth = 3 * 63.5 + 2 * 2.9;
  assert.equal(layout.cells[0].xMm, 8.6);
  assert.equal(
    Math.round((layout.pageWidthMm - 8.6 - gridWidth) * 10) / 10,
    5.1,
    'la marge de droite est ce qui reste, pas 8,6 mm',
  );
  assert.deepEqual(layout.warnings, []);
});

test('chaque préréglage place le nombre d\'étiquettes annoncé', () => {
  // Les cotes commerciales sont publiées avec un nombre d'étiquettes par
  // feuille. Ce test confronte la géométrie à cette promesse : une marge ou un
  // pas mal recopié se traduit ici par une rangée manquante.
  for (const [key, preset] of Object.entries(SHEET_PRESETS)) {
    const layout = computeSheet({ count: 1, ...preset });
    assert.equal(layout.columns, preset.declaredColumns, `${key} : colonnes`);
    assert.equal(layout.rows, preset.declaredRows, `${key} : rangées`);
    assert.deepEqual(layout.warnings, [], `${key} : aucun avertissement attendu`);
  }
});

test('les dispositions génériques ont le même écart dans les deux sens', () => {
  // Rien ne l'imposait : aucune référence du commerce ne les définit. Un écart
  // horizontal de 2,5 mm pour zéro vertical donnait des rangées collées et des
  // colonnes espacées — visible sur une planche, et pénible à découper sur du
  // papier ordinaire.
  //
  // Les dispositions `avery-*` sont **exclues** : leurs cotes sont celles du
  // papier, où l'écart vertical vaut zéro parce que les rangées se touchent.
  // L'égaliser décalerait les étiquettes par rapport à la planche prédécoupée.
  const generiques = Object.entries(SHEET_PRESETS).filter(([, p]) => p.group === 'generic');
  assert.ok(generiques.length >= 4, 'les dispositions génériques ont disparu');
  for (const [key, preset] of generiques) {
    assert.equal(preset.gapXMm, preset.gapYMm, `${key} : écart horizontal et vertical`);
  }
  // Et quand la géométrie le permet, la marge aussi est la même partout :
  // deux équations, deux inconnues, une seule solution.
  for (const key of ['a4-3x8', 'a4-2x7', 'a4-4x10']) {
    const preset = SHEET_PRESETS[key];
    assert.equal(preset.marginXMm, preset.marginYMm, `${key} : marge`);
    assert.ok(preset.marginYMm > 0, `${key} : une marge positive`);
  }
});

test("l'ajustement d'espacement garde la grille demandée", () => {
  // L'inverse du calcul de la planche : on garde les colonnes et les rangées,
  // et l'on cherche l'écart et la marge qui les font tenir. C'est ce qui évite
  // de trancher dans la grille quand un espacement change.
  const page = PAGE_SIZES.a4;
  for (const [columns, rows, labelWidthMm, labelHeightMm] of [
    [3, 8, 63.5, 33.9],
    [2, 7, 99.1, 38.1],
    [4, 10, 48, 25],
  ]) {
    const plan = spacingForGrid({
      pageWidthMm: page.widthMm, pageHeightMm: page.heightMm,
      columns, rows, labelWidthMm, labelHeightMm,
    });
    assert.equal(plan.ok, true, `${columns}×${rows} : ajustable`);
    assert.equal(plan.gapXMm, plan.gapYMm, `${columns}×${rows} : écart égal`);
    assert.equal(plan.marginXMm, plan.marginYMm, `${columns}×${rows} : marge égale`);
    assert.ok(plan.gapXMm >= 0 && plan.marginXMm >= 0, `${columns}×${rows} : valeurs positives`);

    // La preuve : la grille tient **exactement** sur la page, aux deux cotes.
    const largeur = columns * labelWidthMm + (columns - 1) * plan.gapXMm + 2 * plan.marginXMm;
    const hauteur = rows * labelHeightMm + (rows - 1) * plan.gapYMm + 2 * plan.marginYMm;
    // Cinquante millièmes de millimètre : l'écart est arrondi au centième, et
    // aucun papier ni aucune imprimante ne distingue ce qui reste. Ce que le
    // test défend, c'est que la grille **tienne** — pas qu'elle soit exacte au
    // micron.
    assert.ok(Math.abs(largeur - page.widthMm) < 0.05, `${columns}×${rows} : largeur ${largeur}`);
    assert.ok(Math.abs(hauteur - page.heightMm) < 0.05, `${columns}×${rows} : hauteur ${hauteur}`);
  }
});

test("l'ajustement reproduit les dispositions génériques", () => {
  // Les mêmes chiffres, par deux chemins : les dispositions ont été calculées à
  // la main, et l'ajustement les retrouve. Une divergence signalerait une
  // formule fausse d'un côté ou de l'autre.
  const page = PAGE_SIZES.a4;
  for (const key of ['a4-3x8', 'a4-2x7']) {
    const preset = SHEET_PRESETS[key];
    const plan = spacingForGrid({
      pageWidthMm: page.widthMm, pageHeightMm: page.heightMm,
      columns: preset.declaredColumns, rows: preset.declaredRows,
      labelWidthMm: preset.labelWidthMm, labelHeightMm: preset.labelHeightMm,
    });
    assert.ok(Math.abs(plan.gapXMm - preset.gapXMm) < 0.02, `${key} : écart`);
    assert.ok(Math.abs(plan.marginXMm - preset.marginXMm) < 0.02, `${key} : marge`);
  }
});

test("l'ajustement refuse ce qu'aucun espacement ne peut faire tenir", () => {
  // Dix rangées de 33,9 mm font 339 mm : aucune marge négative ne les fera
  // tenir sur 297 mm. Le dire vaut mieux que de proposer l'impossible.
  const plan = spacingForGrid({
    pageWidthMm: PAGE_SIZES.a4.widthMm, pageHeightMm: PAGE_SIZES.a4.heightMm,
    columns: 3, rows: 10, labelWidthMm: 63.5, labelHeightMm: 33.9,
  });
  assert.equal(plan.ok, false);
  assert.equal(plan.reason, 'etiquettes');
});

test('le décalage d\'impression déplace la grille sans la déformer', () => {
  const base = computeSheet({ count: 24, ...BASE });
  const shifted = computeSheet({ count: 24, ...BASE, offsetXMm: 1.5, offsetYMm: -0.5 });

  assert.equal(shifted.columns, base.columns, 'la forme de la grille ne change pas');
  assert.equal(shifted.rows, base.rows);
  assert.equal(shifted.offsetXMm, 1.5);
  assert.equal(shifted.cells[0].xMm, base.cells[0].xMm + 1.5);
  assert.equal(shifted.cells[0].yMm, base.cells[0].yMm - 0.5);
  // Le décalage se cumule à chaque cellule, il ne se perd pas en route.
  assert.equal(shifted.cells[5].xMm, base.cells[5].xMm + 1.5);
});

test('count à 0 reste cohérent', () => {
  const layout = computeSheet({ count: 0, ...BASE });
  assert.equal(layout.cells.length, 0);
  assert.equal(layout.pages, 0);
  assert.equal(layout.perPage, 24);
});

test('computeSheet refuse des dimensions absurdes', () => {
  assert.throws(() => computeSheet({ count: 1, labelWidthMm: 0, labelHeightMm: 10 }), TypeError);
  assert.throws(() => computeSheet({ count: 1, labelWidthMm: 10, labelHeightMm: -3 }), TypeError);
  assert.throws(() => computeSheet({ count: 1, labelWidthMm: NaN, labelHeightMm: 10 }), TypeError);
});

test('les formats papier déclarés sont plausibles', () => {
  assert.equal(PAGE_SIZES.a4.widthMm, 210);
  assert.equal(PAGE_SIZES.a4.heightMm, 297);
  assert.ok(PAGE_SIZES.letter.widthMm > 210 && PAGE_SIZES.letter.heightMm < 297);
});

test('chaque préréglage tient exactement la grille annoncée', () => {
  // Régression : un préréglage « 3 × 8 » dont les cotes ne tenaient que
  // 2 colonnes, et dont les 8 rangées dépassaient la hauteur du A4.
  const attendus = {
    'a4-3x8': [3, 8],
    'a4-2x7': [2, 7],
    'a4-4x10': [4, 10],
    'a4-qr-3x4': [3, 4],
  };

  for (const [name, [columns, rows]] of Object.entries(attendus)) {
    const preset = SHEET_PRESETS[name];
    assert.ok(preset, `préréglage absent : ${name}`);
    const layout = computeSheet({ count: 1, ...preset });
    assert.equal(layout.columns, columns, `${name} : colonnes`);
    assert.equal(layout.rows, rows, `${name} : rangées`);
    assert.deepEqual(layout.warnings, [], `${name} : ${layout.warnings.join(' / ')}`);
  }
});

test('aucun préréglage ne déborde de sa page', () => {
  for (const [name, preset] of Object.entries(SHEET_PRESETS)) {
    // On remplit exactement une page : la capacité se lit sur un premier calcul.
    const capacity = computeSheet({ count: 1, ...preset }).perPage;
    const layout = computeSheet({ count: capacity, ...preset });
    const last = layout.cells[layout.cells.length - 1];
    assert.ok(
      last.xMm + layout.labelWidthMm <= layout.pageWidthMm,
      `${name} déborde horizontalement`,
    );
    assert.ok(
      last.yMm + layout.labelHeightMm <= layout.pageHeightMm,
      `${name} déborde verticalement`,
    );
  }
});

// ---------------------------------------------------------------------------
// paginate
// ---------------------------------------------------------------------------

test('paginate répartit les éléments par page', () => {
  const items = Array.from({ length: 30 }, (_, i) => `lien-${i + 1}`);
  const layout = computeSheet({ count: items.length, ...BASE });
  const pages = paginate(items, layout);

  assert.equal(pages.length, 2);
  assert.equal(pages[0].items.length, 24);
  assert.equal(pages[1].items.length, 6);
  assert.equal(pages[0].items[0].item, 'lien-1');
  assert.equal(pages[1].items[0].item, 'lien-25');
});

test('paginate conserve la position de chaque élément', () => {
  const items = ['a', 'b', 'c'];
  const layout = computeSheet({ count: 3, ...BASE });
  const [page] = paginate(items, layout);
  assert.deepEqual(page.items.map((e) => e.cell.column), [0, 1, 2]);
  assert.deepEqual(page.items.map((e) => e.item), ['a', 'b', 'c']);
});

test('paginate renvoie un tableau vide si la planche est inexploitable', () => {
  const layout = computeSheet({ count: 2, labelWidthMm: 500, labelHeightMm: 500 });
  assert.deepEqual(paginate(['a', 'b'], layout), []);
});

test('paginate ignore les éléments au-delà des cellules calculées', () => {
  const layout = computeSheet({ count: 2, ...BASE });
  const pages = paginate(['a', 'b', 'c', 'd'], layout);
  const total = pages.reduce((sum, page) => sum + page.items.length, 0);
  assert.equal(total, 2);
});

// ---------------------------------------------------------------------------
// clampGrid
//
// Le défaut qu'elle corrige : une grille demandée impossible était refusée, et
// l'interface gardait alors la disposition **précédente**. Les champs disaient
// une chose, l'aperçu une autre, et le papier une troisième. « On se retrouve
// bloqué dans des configurations impossibles, et ça ne correspond pas en aperçu
// avec ce qu'on obtient à l'impression. »
// ---------------------------------------------------------------------------

const GRILLE = (colonnes, rangees, extra = {}) => ({
  pageWidthMm: PAGE_SIZES.a4.widthMm,
  pageHeightMm: PAGE_SIZES.a4.heightMm,
  columns: colonnes,
  rows: rangees,
  marginXMm: BASE.marginXMm,
  marginYMm: BASE.marginYMm,
  gapXMm: BASE.gapXMm,
  gapYMm: BASE.gapYMm,
  ...extra,
});

test('clampGrid laisse intacte une grille qui tient', () => {
  const resultat = clampGrid(GRILLE(3, 8));
  assert.equal(resultat.columns, 3);
  assert.equal(resultat.rows, 8);
  assert.equal(resultat.clamped, false);
  assert.equal(resultat.reason, '');
});

test('clampGrid ramène une grille trop grande à ce qui tient', () => {
  // 40 × 60 dépasse les deux axes : c'est le cas où l'utilisateur tape un nombre
  // « pour voir », et où l'aperçu d'avant gardait la grille précédente.
  const resultat = clampGrid(GRILLE(40, 60));
  assert.equal(resultat.clamped, true);
  assert.ok(resultat.columns < 40 && resultat.columns >= 1);
  assert.ok(resultat.rows < 60 && resultat.rows >= 1);
  // La raison nomme la demande **et** ce qui reste : « ça ne tient pas » sans
  // chiffre oblige à chercher soi-même lequel des deux champs réduit.
  assert.match(resultat.reason, /40 colonnes/);
  assert.match(resultat.reason, /60 rangées/);
  assert.match(resultat.reason, new RegExp(`\\b${resultat.columns}\\b`));
});

test('clampGrid ne réduit que l\'axe qui déborde', () => {
  // 12 colonnes tiennent sur une A4 — 26 au maximum à 5 mm par étiquette — mais
  // 60 rangées, non : 56 au plus. Réduire les deux serait une correction
  // aveugle, et ferait perdre des colonnes à quelqu'un qui n'avait rien demandé
  // d'impossible en largeur.
  const resultat = clampGrid(GRILLE(12, 60));
  assert.equal(resultat.clamped, true);
  assert.equal(resultat.columns, 12, 'les colonnes tenaient : elles ne bougent pas');
  assert.ok(resultat.rows < 60);
  assert.match(resultat.reason, /60 rangées/);
  assert.doesNotMatch(resultat.reason, /12 colonnes/);
});

test('clampGrid ne rend jamais plus que la demande', () => {
  for (const [colonnes, rangees] of [[1, 1], [2, 9], [4, 4], [3, 20], [10, 2]]) {
    const resultat = clampGrid(GRILLE(colonnes, rangees));
    assert.ok(resultat.columns <= colonnes, `${colonnes} → ${resultat.columns}`);
    assert.ok(resultat.rows <= rangees, `${rangees} → ${resultat.rows}`);
  }
});

test('ce que clampGrid rend est toujours accepté par fitGrid', () => {
  // C'est l'invariant qui compte : une grille recadrée doit produire une
  // planche imprimable, sinon le recadrage ne fait que déplacer le blocage. On
  // balaie les marges et les écarts, y compris les cas extrêmes.
  const marges = [0, 7.25, 15, 40];
  const ecarts = [0, 2.5, 6, 10];
  const pages = [PAGE_SIZES.a4, PAGE_SIZES.letter];
  let essayees = 0;

  for (const page of pages) {
    for (const marge of marges) {
      for (const ecart of ecarts) {
        for (const [colonnes, rangees] of [[12, 30], [5, 12], [1, 1]]) {
          const demande = {
            pageWidthMm: page.widthMm,
            pageHeightMm: page.heightMm,
            columns: colonnes,
            rows: rangees,
            marginXMm: marge,
            marginYMm: marge,
            gapXMm: ecart,
            gapYMm: ecart,
          };
          const garde = clampGrid(demande);
          if (garde.columns === 0 || garde.rows === 0) continue;

          // C'est bien la grille **recadrée** qu'on soumet : soumettre la
          // demande d'origine ne prouverait rien, sinon que fitGrid refuse —
          // ce qu'on sait déjà.
          const grille = fitGrid({ ...demande, columns: garde.columns, rows: garde.rows });
          assert.ok(
            grille.ok,
            `refusée : ${garde.columns} × ${garde.rows} sur `
              + `${page.widthMm} × ${page.heightMm} mm, marge ${marge}, écart ${ecart} — ${grille.reason}`,
          );
          essayees += 1;
        }
      }
    }
  }
  assert.ok(essayees > 60, `trop peu de cas éprouvés : ${essayees}`);
});

test('clampGrid dit franchement quand il ne reste aucune place', () => {
  // Des marges qui mangent la page : ce n'est plus une question de nombre, et
  // proposer « 1 colonne » serait faux — elle ne tiendrait pas davantage.
  const resultat = clampGrid(GRILLE(3, 8, { marginXMm: 150, marginYMm: 150 }));
  assert.equal(resultat.columns, 0);
  assert.equal(resultat.rows, 0);
  assert.equal(resultat.clamped, true);
  assert.match(resultat.reason, /marges/i);
});

// ---------------------------------------------------------------------------
// Ce qui s'imprime sous le QR Code
//
// Le titre s'imprimait **toujours** quand il existait : il n'y avait aucun moyen
// d'obtenir l'URL seule, ni de n'avoir aucune ligne de texte. Deux des quatre
// états ci-dessous étaient donc inatteignables.
// ---------------------------------------------------------------------------

const LIEN = { title: 'Un article', url: 'https://exemple.fr/a' };

test('sous le QR Code : le titre seul, et l\'URL prend sa place s\'il manque', () => {
  assert.deepEqual(sheetCellBlocks(LIEN, { title: true, url: false }), [{ kind: 'title', text: 'Un article' }]);
  // Sans titre, l'URL reste : une étiquette sans aucun texte ne dirait plus ce
  // qu'elle désigne.
  assert.deepEqual(
    sheetCellBlocks({ url: 'https://x.fr' }, { title: true, url: false }),
    [{ kind: 'url', text: 'https://x.fr' }],
  );
});

test('sous le QR Code : le titre et l\'URL sont deux blocs, jamais une ligne', () => {
  // Ils étaient concaténés en une seule chaîne, puis repliés ensemble : l'URL
  // commençait au bout de la dernière ligne du titre, et c'était le **titre** qui
  // se faisait couper. Deux blocs, chacun replié pour lui-même.
  assert.deepEqual(
    sheetCellBlocks(LIEN, { title: true, url: true }),
    [
      { kind: 'title', text: 'Un article' },
      { kind: 'url', text: 'https://exemple.fr/a' },
    ],
  );
  // Un titre vide ne laisse pas de bloc vide, et l'URL reste seule.
  assert.deepEqual(
    sheetCellBlocks({ url: 'https://x.fr' }, { title: true, url: true }),
    [{ kind: 'url', text: 'https://x.fr' }],
  );
});

test('sous le QR Code : l\'URL seule est enfin atteignable', () => {
  assert.deepEqual(
    sheetCellBlocks(LIEN, { title: false, url: true }),
    [{ kind: 'url', text: 'https://exemple.fr/a' }],
  );
});

test('sous le QR Code : rien du tout est enfin atteignable', () => {
  assert.deepEqual(sheetCellBlocks(LIEN, { title: false, url: false }), []);
});

test('sans option, le titre s\'imprime : l\'ancien comportement est le défaut', () => {
  // Un appel qui oublie les options ne doit pas changer ce qui sort sur le
  // papier. C'est la garantie la plus importante de cette fonction.
  const attendu = [{ kind: 'title', text: 'Un article' }];
  assert.deepEqual(sheetCellBlocks(LIEN), attendu);
  assert.deepEqual(sheetCellBlocks(LIEN, {}), attendu);
  assert.deepEqual(sheetCellBlocks(LIEN, { title: undefined }), attendu);
});

test('sous le QR Code : un titre fait d\'espaces compte comme absent', () => {
  assert.deepEqual(
    sheetCellBlocks({ title: '   ', url: 'https://x.fr' }, { title: true }),
    [{ kind: 'url', text: 'https://x.fr' }],
  );
  assert.deepEqual(
    sheetCellBlocks({ title: '   ', url: 'https://x.fr' }, { title: false, url: true }),
    [{ kind: 'url', text: 'https://x.fr' }],
  );
});

test('aucune ligne de texte laisse toute la hauteur au QR Code', () => {
  // C'est l'intérêt de décocher les deux cases : le QR Code peut grandir.
  const commun = {
    labelWidthMm: 63.5, labelHeightMm: 33.9, qrModules: 45,
    marginMm: 1.6, gapMm: 1, minModuleMm: 0.3, fontSizePt: 7,
  };
  const sansTexte = qrRatioBounds({ ...commun, textLines: 0 });
  const uneLigne = qrRatioBounds({ ...commun, textLines: 1 });

  assert.ok(sansTexte.fits && uneLigne.fits);
  assert.ok(
    sansTexte.maxSideMm > uneLigne.maxSideMm,
    `sans texte ${sansTexte.maxSideMm} mm, une ligne ${uneLigne.maxSideMm} mm : `
      + 'la hauteur rendue ne doit pas être perdue',
  );
});

// ---------------------------------------------------------------------------
// En-tête de page
//
// Il vit dans la marge du haut : les étiquettes ne bougent pas, parce que leurs
// positions sont calculées et qu'une case à cocher ne doit pas changer la taille
// des étiquettes. Une marge trop courte le ferait donc recouvrir la première
// rangée — pire qu'une absence, et refusé avec ses chiffres.
// ---------------------------------------------------------------------------

test('l\'en-tête tient dès que la marge atteint sa hauteur', () => {
  assert.equal(sheetHeaderFits({ marginYMm: SHEET_HEADER_MM }).fits, true);
  assert.equal(sheetHeaderFits({ marginYMm: 12.9 }).fits, true);
  assert.equal(sheetHeaderFits({ marginYMm: SHEET_HEADER_MM }).reason, '');
});

test("l'en-tête refuse une marge trop courte, en nommant les deux chiffres", () => {
  const refus = sheetHeaderFits({ marginYMm: 5 });
  assert.equal(refus.fits, false);
  assert.equal(refus.needed, SHEET_HEADER_MM);
  // « Ça ne tient pas » sans les nombres oblige à chercher lequel des deux
  // réglages corriger.
  assert.match(refus.reason, new RegExp(`${SHEET_HEADER_MM} mm`));
  assert.match(refus.reason, /5 mm/);
});

test("l'en-tête refuse aussi une marge absente ou négative", () => {
  assert.equal(sheetHeaderFits({}).fits, false);
  assert.equal(sheetHeaderFits({ marginYMm: 0 }).fits, false);
  assert.equal(sheetHeaderFits({ marginYMm: -4 }).fits, false);
});

test("la hauteur d'en-tête couvre le titre et la bande du tableau", () => {
  // Elle est confrontée aux valeurs écrites dans la feuille de style : un titre
  // de 12 pt et une bande de 4 mm. Sans ce contrôle, agrandir la police un jour
  // ferait mordre l'en-tête sur la première rangée sans que rien ne le dise.
  const titreMm = (12 * 25.4) / 72;
  const bandeMm = 4;
  assert.ok(
    SHEET_HEADER_MM >= titreMm + bandeMm,
    `${SHEET_HEADER_MM} mm ne couvrent pas ${(titreMm + bandeMm).toFixed(2)} mm`,
  );
});

test('la disposition rend les marges, et non seulement les cellules', () => {
  // Elles manquaient. Leur absence ne se voyait pas — les positions des cellules
  // les contiennent — mais un appelant qui veut savoir où **commence** la grille
  // n'avait aucun moyen de les retrouver. L'en-tête de page s'y est trompé : il
  // lisait `undefined`, donc zéro, et refusait de se dessiner en annonçant une
  // marge de 0 mm alors que la première étiquette était à 15.
  const layout = computeSheet({ count: 3, ...BASE });
  assert.equal(typeof layout.marginXMm, 'number');
  assert.equal(typeof layout.marginYMm, 'number');
  // Et elles doivent être celles qui ont servi : la première cellule est posée
  // exactement dessus.
  const premiere = layout.cells[0];
  // Les positions sont arrondies au centième : on compare à cette précision.
  assert.ok(Math.abs(premiere.xMm - (layout.marginXMm + layout.offsetXMm)) < 0.005);
  assert.ok(Math.abs(premiere.yMm - (layout.marginYMm + layout.offsetYMm)) < 0.005);
});

test('la marge rendue tient compte du recentrage de la grille', () => {
  // `fitGrid` répartit l'espace restant en marge : la valeur rendue n'est donc
  // pas celle demandée, et c'est bien celle-là qui situe la grille.
  const layout = computeSheet({ count: 1, ...BASE });
  assert.ok(layout.marginYMm >= BASE.marginYMm, `${layout.marginYMm} < ${BASE.marginYMm}`);
});

// ---------------------------------------------------------------------------
// La place réservée au texte est-elle celle qui sera dessinée ?
// ---------------------------------------------------------------------------

/**
 * L'invariant que la planche doit tenir, et que le rendu vérifie cellule par
 * cellule : **au minimum du curseur, la place laissée au texte est au moins
 * celle qui lui a été réservée.**
 *
 * C'est ce que le défaut rapporté mettait en cause : sur une A4 3 × 8, le QR
 * Code au minimum et un titre coupé. Le minimum du curseur est le réglage le
 * plus favorable au texte — le QR Code y est le plus petit que l'impression
 * autorise. Si le texte n'y tient pas, c'est que le format ne peut pas le
 * porter, et l'application doit le dire (elle le fait désormais) ; mais si la
 * place réservée n'est pas rendue, c'est un défaut de calcul, et rien ne le
 * signalerait.
 *
 * Le calcul est celui de `app.js`, reproduit ici : c'est le seul moyen de
 * l'éprouver sans navigateur — et c'est précisément le genre d'écart d'un
 * millième qui avait déjà tronqué un texte pour rien.
 */
test('au minimum du curseur, la planche rend au texte la place qu\'elle lui a réservée', () => {
  const fontSizePt = SHEET_FONT_PT;
  const metrics = sheetTextMetrics({ fontSizePt });
  const marginMm = SHEET_CELL_MARGIN_MM;
  const gapMm = SHEET_QR_GAP_MM;

  /** Mesure factice mais **cohérente** : seule la géométrie est en cause ici. */
  const measure = (texte) => [...texte].length * metrics.fontSizePx * 0.5;

  for (const id of ['a4-3x8', 'a4-2x7', 'a4-4x10', 'a4-3x4-grandes']) {
    const preset = SHEET_PRESETS[id];
    if (!preset) continue;

    for (const modules of [21, 33, 45, 57]) {
      const bornes1 = qrRatioBounds({
        labelWidthMm: preset.labelWidthMm,
        labelHeightMm: preset.labelHeightMm,
        qrModules: modules,
        textLines: 1,
        marginMm,
        gapMm,
        minModuleMm: MIN_MODULE_MM_PAPER,
        fontSizePt,
      });
      if (!bornes1.fits) continue;

      const offertes = Math.max(1, bornes1.textLinesAtMin);
      for (let voulues = 1; voulues <= offertes + 2; voulues += 1) {
        const reservees = Math.min(voulues, offertes);
        const bornes = qrRatioBounds({
          labelWidthMm: preset.labelWidthMm,
          labelHeightMm: preset.labelHeightMm,
          qrModules: modules,
          textLines: reservees,
          marginMm,
          gapMm,
          minModuleMm: MIN_MODULE_MM_PAPER,
          fontSizePt,
        });

        // Le curseur reste cohérent : un minimum au-dessus du maximum donnerait
        // un réglage impossible à placer.
        assert.ok(bornes.min <= bornes.max + 1e-9, `${id} · ${modules} modules : bornes incohérentes`);

        // Et au minimum, la place rendue au texte couvre ce qui a été réservé.
        const side = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, bornes.min);
        const espaceTexte = preset.labelHeightMm - marginMm * 2 - side - gapMm;
        const lignesRendues = Math.max(1, Math.floor(espaceTexte / metrics.lineHeightMm + 1e-3));
        assert.ok(
          lignesRendues >= reservees,
          `${id} · ${modules} modules · ${reservees} ligne(s) réservée(s), `
            + `${lignesRendues} rendue(s) (place ${round1(espaceTexte)} mm, `
            + `interligne ${round1(metrics.lineHeightMm)} mm)`,
        );

        // Ce que la cellule écrit vraiment : le texte entier dès qu'il tient
        // dans les lignes rendues, et coupé au-delà — jamais autre chose.
        const texte = 'Titre '.repeat(8).trim();
        const lignes = sheetCellLines(texte, {
          measure,
          innerWidthPx: (preset.labelWidthMm - marginMm * 2) * (96 / 25.4),
          maxLines: lignesRendues,
        });
        const complet = sheetCellLines(texte, {
          measure,
          innerWidthPx: (preset.labelWidthMm - marginMm * 2) * (96 / 25.4),
          maxLines: 99,
        });
        assert.equal(
          lignes.length > lignesRendues,
          false,
          'la coupe ne rend jamais plus de lignes que la place',
        );
        if (complet.length <= lignesRendues) {
          assert.deepEqual(lignes, complet, 'un texte qui tient ne doit pas être coupé');
        }
      }
    }
  }
});

test('le nombre de lignes annoncé est celui que le curseur laisse atteindre', () => {
  // Le défaut, mesuré : sur une A4 3 × 8 et 21 modules, `textLinesAtMin` comptait
  // les lignes laissées par le minimum **lisible** du QR Code (0,4 mm par
  // module), alors que le curseur s'arrête à 30 % de la hauteur d'étiquette.
  // L'application promettait donc huit lignes et le rendu n'en donnait que sept :
  // un titre était coupé alors qu'elle venait d'annoncer qu'il tenait.
  const preset = SHEET_PRESETS['a4-3x8'];
  const bornes = qrRatioBounds({
    labelWidthMm: preset.labelWidthMm,
    labelHeightMm: preset.labelHeightMm,
    qrModules: 21,
    textLines: 1,
    marginMm: SHEET_CELL_MARGIN_MM,
    gapMm: SHEET_QR_GAP_MM,
    minModuleMm: MIN_MODULE_MM_PAPER,
    fontSizePt: SHEET_FONT_PT,
  });

  const metrics = sheetTextMetrics({ fontSizePt: SHEET_FONT_PT });
  const side = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, bornes.min);
  const espace = preset.labelHeightMm - SHEET_CELL_MARGIN_MM * 2 - side - SHEET_QR_GAP_MM;
  const rendues = Math.floor(espace / metrics.lineHeightMm + 1e-3);

  assert.ok(
    bornes.textLinesAtMin <= rendues,
    `${bornes.textLinesAtMin} ligne(s) annoncée(s), ${rendues} rendue(s) au minimum `
      + `(${Math.round(bornes.min * 100)} %)`,
  );

  // Et le minimum annoncé ne descend jamais sous le plancher du curseur.
  assert.ok(bornes.min >= MIN_QR_RATIO - 1e-9);
});

test('le curseur du QR Code descend jusqu\'au minimum lisible, et pas plus haut', () => {
  // Le plancher du curseur était fixé à 30 % du petit côté : une proportion
  // choisie à l'œil, sans rapport avec ce qui s'imprime. Sur une A4 3 × 8 et une
  // adresse courte (21 modules), il interdisait de descendre sous 10,2 mm alors
  // que 8,4 mm suffisaient — le texte perdait une ligne de place pour rien, et un
  // titre était coupé. C'est le défaut rapporté : « pourquoi ne peut-on pas
  // réduire le QR Code, alors que c'est lui le coupable ? »
  const preset = SHEET_PRESETS['a4-3x8'];
  const metrics = sheetTextMetrics({ fontSizePt: SHEET_FONT_PT });
  const short = Math.min(preset.labelWidthMm, preset.labelHeightMm);

  for (const modules of [21, 33, 45, 57]) {
    const bornes = qrRatioBounds({
      labelWidthMm: preset.labelWidthMm,
      labelHeightMm: preset.labelHeightMm,
      qrModules: modules,
      textLines: 1,
      marginMm: SHEET_CELL_MARGIN_MM,
      gapMm: SHEET_QR_GAP_MM,
      minModuleMm: MIN_MODULE_MM_PAPER,
      fontSizePt: SHEET_FONT_PT,
    });

    const lisible = modules * MIN_MODULE_MM_PAPER;
    const cote = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, bornes.min);

    // Le minimum du curseur **est** le minimum lisible : ni au-dessus (ce qui
    // vole de la place au texte), ni au-dessous (ce qui donnerait un code que
    // l'imprimante ne rend pas).
    assert.ok(
      Math.abs(cote - lisible) < 0.02,
      `${modules} modules : minimum du curseur à ${round1(cote)} mm, `
        + `minimum lisible à ${round1(lisible)} mm`,
    );

    // Et ce que le curseur laisse atteindre est bien ce qui est annoncé.
    const espace = preset.labelHeightMm - SHEET_CELL_MARGIN_MM * 2 - cote - SHEET_QR_GAP_MM;
    assert.equal(
      bornes.textLinesAtMin,
      Math.floor(espace / metrics.lineHeightMm + 1e-3),
      `${modules} modules : lignes annoncées contre lignes laissées`,
    );
    assert.ok(bornes.min * short >= MIN_QR_RATIO * short - 1e-9);
  }
});

test('le titre et l\'URL ne partagent jamais une ligne', () => {
  // Le défaut rapporté : « titre + URL sur la même ligne ne cohabitent pas bien,
  // ça coupe ». Les deux étaient concaténés puis repliés ensemble, si bien que
  // l'URL commençait au bout de la dernière ligne du titre — et que le **titre**
  // se faisait couper, alors que c'est la partie lisible par un humain.
  //
  // Le dessin suit l'ordre des blocs : le titre d'abord, l'URL ensuite, chacun
  // replié pour lui-même. Ce test vérifie la règle sous-jacente : les lignes d'un
  // bloc ne contiennent jamais le texte de l'autre.
  const mesure = (texte) => [...texte].length * 4;
  const innerWidthPx = 120;

  const blocs = sheetCellBlocks(
    { title: 'DOUBLE GLASS Office partition By DVO', url: 'https://www.archiproducts.com/en/products/dvo' },
    { title: true, url: true },
  );
  const dessinees = blocs.flatMap((bloc) => sheetCellLines(bloc.text, {
    measure: mesure, innerWidthPx, maxLines: 99,
  }).map((ligne) => ({ ligne, kind: bloc.kind })));

  for (const { ligne, kind } of dessinees) {
    if (kind === 'title') {
      assert.doesNotMatch(ligne, /https?:\/\//, `une ligne de titre porte une adresse : « ${ligne} »`);
    } else {
      assert.doesNotMatch(ligne, /DOUBLE GLASS/, `une ligne d'URL porte le titre : « ${ligne} »`);
    }
  }

  // Et l'URL commence bien après la dernière ligne du titre.
  const dernierTitre = dessinees.findLastIndex((l) => l.kind === 'title');
  const premierUrl = dessinees.findIndex((l) => l.kind === 'url');
  assert.equal(premierUrl, dernierTitre + 1, 'l\'URL ne suit pas immédiatement le titre');
});

// ---------------------------------------------------------------------------
// Mise en page automatique
// ---------------------------------------------------------------------------

test('la mise en page automatique maximse le nombre d\'étiquettes par page', () => {
  // Le tâtonnement, remplacé par un calcul : on part de ce que le contenu exige
  // — la taille d'étiquette minimale qui porte le QR Code et son texte — et l'on
  // en déduit la page entière.
  const page = PAGE_SIZES.a4;
  const besoin = { widthMm: 40, heightMm: 30 };
  const commun = {
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    minLabelWidthMm: besoin.widthMm,
    minLabelHeightMm: besoin.heightMm,
    marginXMm: 8,
    marginYMm: 8,
    gapXMm: 2,
    gapYMm: 2,
  };

  const plan = autoSheetLayout(commun);

  // Ce qu'il propose tient sur la page…
  const encombrementX = plan.columns * plan.labelWidthMm + (plan.columns - 1) * plan.gapXMm;
  const encombrementY = plan.rows * plan.labelHeightMm + (plan.rows - 1) * plan.gapYMm;
  assert.ok(encombrementX <= page.widthMm - plan.marginXMm * 2 + 1e-6, 'la grille déborde en largeur');
  assert.ok(encombrementY <= page.heightMm - plan.marginYMm * 2 + 1e-6, 'la grille déborde en hauteur');

  // …et chaque étiquette peut porter le contenu.
  assert.ok(plan.labelWidthMm >= besoin.widthMm - 1e-9);
  assert.ok(plan.labelHeightMm >= besoin.heightMm - 1e-9);

  // Une colonne ou une rangée de plus ne tiendrait pas : le compte est maximal.
  const largeurSuivante = (plan.columns + 1) * besoin.widthMm + plan.columns * plan.gapXMm;
  assert.ok(
    largeurSuivante > page.widthMm - plan.marginXMm * 2 + 1e-6,
    `${plan.columns + 1} colonnes tiendraient : le compte n'est pas maximal`,
  );
  const hauteurSuivante = (plan.rows + 1) * besoin.heightMm + plan.rows * plan.gapYMm;
  assert.ok(
    hauteurSuivante > page.heightMm - plan.marginYMm * 2 + 1e-6,
    `${plan.rows + 1} rangées tiendraient : le compte n'est pas maximal`,
  );

  // Et la place restante est **donnée aux étiquettes**, pas laissée en bande
  // perdue : c'est ce qui distingue une page remplie d'une page trouée.
  const resteX = page.widthMm - plan.marginXMm * 2 - encombrementX;
  assert.ok(resteX < plan.labelWidthMm + plan.gapXMm, `bande perdue de ${round1(resteX)} mm à droite`);
});

test('la mise en page automatique rogne les marges avant de renoncer', () => {
  // Une étiquette plus large que la zone utile : les marges demandées cèdent
  // d'abord, parce qu'une marge n'est qu'un confort de découpe.
  const plan = autoSheetLayout({
    pageWidthMm: 210,
    pageHeightMm: 297,
    minLabelWidthMm: 200,
    minLabelHeightMm: 250,
    marginXMm: 20,
    marginYMm: 20,
    gapXMm: 0,
    gapYMm: 0,
  });

  assert.equal(plan.marginXMm, 0);
  assert.equal(plan.marginYMm, 0);
  assert.ok(plan.labelWidthMm >= 200 - 1e-9);
  assert.ok(plan.perPage >= 1);
});

test('la mise en page automatique suit la taille du contenu', () => {
  // Plus le contenu est gros — un QR Code dense, un texte long —, plus les
  // étiquettes doivent être grandes, et moins il en tient par page. C'est la
  // propriété qui rend le mode utile : elle est monotone.
  const page = PAGE_SIZES.a4;
  const pour = (largeur, hauteur) => autoSheetLayout({
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    minLabelWidthMm: largeur,
    minLabelHeightMm: hauteur,
    marginXMm: 8,
    marginYMm: 8,
    gapXMm: 2,
    gapYMm: 2,
  });

  const petit = pour(25, 20);
  const moyen = pour(40, 30);
  const grand = pour(60, 50);

  assert.ok(petit.perPage > moyen.perPage, 'un contenu plus gros doit tenir moins souvent');
  assert.ok(moyen.perPage > grand.perPage, 'un contenu plus gros doit tenir moins souvent');
  assert.ok(petit.labelWidthMm >= 25 && grand.labelWidthMm >= 60);
});

// ---------------------------------------------------------------------------

test('le budget de texte d\'une étiquette est une seule formule, partagée', () => {
  // Elle vivait en deux exemplaires — l'un dans le rendu, l'autre dans la mise en
  // page automatique — et les deux ne disaient pas la même chose : le rendu
  // dessine le QR Code à la proportion du curseur, la mise en page le supposait à
  // son minimum lisible. Mesuré sur 49 liens en A4 3 × 4 : 8 lignes promises, 7
  // offertes, **45 étiquettes coupées**. Ce test fixe la formule et ses trois
  // propriétés.
  const etiquette = { labelWidthMm: 63.5, labelHeightMm: 69.06, fontSizePt: 14 };
  const { lineHeightMm } = sheetTextMetrics({ fontSizePt: etiquette.fontSizePt });

  const budget = sheetTextBudget({ ...etiquette, qrRatio: 0.7 });
  assert.equal(budget.sideMm, qrSideMm(etiquette.labelWidthMm, etiquette.labelHeightMm, 0.7));
  // La place laissée au texte est exactement la hauteur, moins les marges, le QR
  // Code et l'écart : rien de plus, rien de moins.
  assert.ok(Math.abs(
    budget.textSpaceMm
      - (etiquette.labelHeightMm - SHEET_CELL_MARGIN_MM * 2 - budget.sideMm - SHEET_QR_GAP_MM),
  ) < 1e-9);
  assert.equal(budget.maxLines, Math.floor(budget.textSpaceMm / lineHeightMm + 1e-3));
  // Les lignes sont bien des lignes : elles tiennent dans la place disponible.
  assert.ok(
    budget.sideMm + SHEET_QR_GAP_MM + SHEET_CELL_MARGIN_MM * 2
      + budget.maxLines * lineHeightMm <= etiquette.labelHeightMm + 1e-9,
    'les lignes comptées doivent tenir dans l\'étiquette',
  );

  // Un QR Code plus grand laisse moins de lignes : c'est l'arbitrage du produit,
  // et la mise en page automatique doit lire le même que le rendu.
  const petit = sheetTextBudget({ ...etiquette, qrRatio: 0.4 });
  const grand = sheetTextBudget({ ...etiquette, qrRatio: 0.9 });
  assert.ok(petit.textLines > grand.textLines);

  // Les lignes hors texte — le numéro, la date — se déduisent du budget, sans
  // jamais le vider : le rendu écrit toujours une ligne.
  const avecDate = sheetTextBudget({ ...etiquette, qrRatio: 0.7, linesHorsTexte: 2 });
  assert.equal(avecDate.textLines, Math.max(1, budget.maxLines - 2));
  const sature = sheetTextBudget({ labelWidthMm: 20, labelHeightMm: 12, qrRatio: 1, linesHorsTexte: 5 });
  assert.equal(sature.textLines, 1);
});

