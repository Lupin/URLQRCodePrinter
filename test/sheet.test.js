/**
 * Tests de la géométrie des planches d'impression.
 * Les cotes sont en millimètres : une dérive d'un dixième décale une planche
 * d'étiquettes autocollantes de façon visible.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PAGE_SIZES, SHEET_PRESETS, computeSheet, paginate } from '../src/core/sheet.js';

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

test('un espace horizontal perdu est signalé', () => {
  // 210 mm de large, marges de 50 mm : une seule colonne de 60 mm tient, et
  // 50 mm restent perdus — assez pour justifier un avertissement.
  const layout = computeSheet({
    count: 2, pageWidthMm: 210, pageHeightMm: 297,
    labelWidthMm: 60, labelHeightMm: 60, marginXMm: 50, marginYMm: 10,
  });
  assert.equal(layout.columns, 1);
  assert.ok(layout.warnings.some((w) => /Marge horizontale perdue/.test(w)));
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
