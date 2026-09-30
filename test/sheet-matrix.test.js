/**
 * Matrice de tests de la mise en page des planches.
 *
 * Le défaut qui a motivé ce fichier ne se voyait dans aucun test : la géométrie
 * était juste, mais elle n'était **appliquée qu'à l'impression**. L'aperçu
 * empilait donc les étiquettes en une seule colonne, le texte d'une étiquette
 * débordait sur la suivante, et le curseur de largeur du QR Code n'avait aucun effet.
 *
 * D'où deux niveaux, complémentaires :
 *
 * 1. **ici** — la géométrie pure, sur *tous* les formats et *tous* les cas
 *    limites (0, 1, une étiquette de moins qu'une page, une pile de pages,
 *    décalages négatifs, proportions extrêmes) ;
 * 2. **dans `scripts/verify-brave.mjs`** — le rendu réellement calculé par le
 *    navigateur, mesuré au pixel : colonnes distinctes, aucune superposition,
 *    QR Code contenu dans sa boîte. C'est ce second niveau qui aurait attrapé le
 *    défaut, et c'est pourquoi il existe maintenant.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PAGE_SIZES,
  SHEET_GROUPS,
  SHEET_PRESETS,
  MIN_QR_RATIO,
  MAX_QR_RATIO,
  computeSheet,
  paginate,
  qrSideMm,
  fitGrid,
  autoSheetLayout,
  presetToGrid,
  qrRatioBounds,
  sheetTextBudget,
  sheetTextMetrics,
  sheetCellLines,
  sheetCellBlocks,
  MIN_MODULE_MM_PAPER,
  SHEET_QR_GAP_MM,
  SHEET_CELL_MARGIN_MM,
  minModuleMmThermal,
} from '../src/core/sheet.js';

const EPSILON = 1e-6;

/** Les clés de tous les préréglages, pour parcourir la matrice. */
const PRESET_KEYS = Object.keys(SHEET_PRESETS);

/** Comptes à tester : les cas limites d'une pagination. */
function countsFor(preset) {
  const perPage = preset.declaredColumns * preset.declaredRows;
  return [0, 1, 2, perPage - 1, perPage, perPage + 1, perPage * 3];
}

// ---------------------------------------------------------------------------
// Cohérence du catalogue
// ---------------------------------------------------------------------------

test('chaque préréglage est complet et rangé dans une famille connue', () => {
  const groups = new Set(SHEET_GROUPS.map((group) => group.id));
  for (const [key, preset] of Object.entries(SHEET_PRESETS)) {
    assert.ok(groups.has(preset.group), `${key} : famille inconnue « ${preset.group} »`);
    assert.ok(preset.label.length > 0, `${key} : libellé manquant`);
    assert.ok(PAGE_SIZES[preset.page], `${key} : papier inconnu « ${preset.page} »`);
    for (const field of ['labelWidthMm', 'labelHeightMm', 'marginXMm', 'marginYMm', 'gapXMm', 'gapYMm']) {
      assert.ok(Number.isFinite(preset[field]), `${key} : ${field} doit être un nombre`);
    }
    assert.ok(preset.labelWidthMm > 0 && preset.labelHeightMm > 0, `${key} : dimensions`);
    // Une étiquette plus grande que sa feuille ne peut pas être un préréglage
    // commercial : c'est une erreur de recopie.
    const page = PAGE_SIZES[preset.page];
    assert.ok(preset.labelWidthMm <= page.widthMm, `${key} : étiquette plus large que la feuille`);
    assert.ok(preset.labelHeightMm <= page.heightMm, `${key} : étiquette plus haute que la feuille`);
  }
});

test('chaque famille annoncée contient au moins un préréglage', () => {
  for (const group of SHEET_GROUPS) {
    const found = Object.values(SHEET_PRESETS).filter((preset) => preset.group === group.id);
    assert.ok(found.length > 0, `famille « ${group.label} » vide`);
  }
});

// ---------------------------------------------------------------------------
// La grille, pour tous les formats et tous les comptes
// ---------------------------------------------------------------------------

test('la grille calculée correspond au nombre d\'étiquettes annoncé', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const layout = computeSheet({ count: 1, ...preset });
    assert.equal(layout.columns, preset.declaredColumns, `${key} : colonnes`);
    assert.equal(layout.rows, preset.declaredRows, `${key} : rangées`);
    assert.equal(layout.perPage, preset.declaredColumns * preset.declaredRows, `${key} : étiquettes par page`);
    assert.deepEqual(layout.warnings, [], `${key} : aucun avertissement attendu`);
  }
});

test('aucune étiquette ne dépasse de la feuille', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const perPage = preset.declaredColumns * preset.declaredRows;
    const layout = computeSheet({ count: perPage * 2, ...preset });
    const page = PAGE_SIZES[preset.page];

    for (const cell of layout.cells) {
      assert.ok(cell.xMm >= -EPSILON, `${key} : cellule ${cell.index} à gauche de la feuille`);
      assert.ok(cell.yMm >= -EPSILON, `${key} : cellule ${cell.index} au-dessus de la feuille`);
      assert.ok(
        cell.xMm + preset.labelWidthMm <= page.widthMm + EPSILON,
        `${key} : cellule ${cell.index} dépasse à droite (${cell.xMm + preset.labelWidthMm} mm)`,
      );
      assert.ok(
        cell.yMm + preset.labelHeightMm <= page.heightMm + EPSILON,
        `${key} : cellule ${cell.index} dépasse en bas (${cell.yMm + preset.labelHeightMm} mm)`,
      );
    }
  }
});

test('deux étiquettes d\'une même page ne se chevauchent jamais', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const perPage = preset.declaredColumns * preset.declaredRows;
    const layout = computeSheet({ count: perPage, ...preset });

    for (let a = 0; a < layout.cells.length; a++) {
      for (let b = a + 1; b < layout.cells.length; b++) {
        const one = layout.cells[a];
        const two = layout.cells[b];
        if (one.page !== two.page) continue;

        const overlapX =
          one.xMm < two.xMm + preset.labelWidthMm - EPSILON &&
          two.xMm < one.xMm + preset.labelWidthMm - EPSILON;
        const overlapY =
          one.yMm < two.yMm + preset.labelHeightMm - EPSILON &&
          two.yMm < one.yMm + preset.labelHeightMm - EPSILON;

        assert.equal(
          overlapX && overlapY,
          false,
          `${key} : les cellules ${one.index} et ${two.index} se chevauchent`,
        );
      }
    }
  }
});

test('la grille est régulière : pas de dérive cumulée', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const stepX = preset.labelWidthMm + preset.gapXMm;
    const stepY = preset.labelHeightMm + preset.gapYMm;
    const layout = computeSheet({ count: preset.declaredColumns * preset.declaredRows, ...preset });

    for (const cell of layout.cells) {
      const expectedX = preset.marginXMm + cell.column * stepX;
      const expectedY = preset.marginYMm + cell.row * stepY;
      assert.ok(
        Math.abs(cell.xMm - expectedX) < 0.01,
        `${key} : cellule ${cell.index} en x = ${cell.xMm} au lieu de ${expectedX}`,
      );
      assert.ok(
        Math.abs(cell.yMm - expectedY) < 0.01,
        `${key} : cellule ${cell.index} en y = ${cell.yMm} au lieu de ${expectedY}`,
      );
    }
  }
});

test('le nombre de pages suit la capacité de la feuille', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const perPage = preset.declaredColumns * preset.declaredRows;

    for (const count of countsFor(preset)) {
      const sheet = computeSheet({ count, ...preset });
      assert.equal(sheet.cells.length, count, `${key} / ${count} : cellules`);
      assert.equal(
        sheet.pages,
        perPage > 0 ? Math.ceil(count / perPage) : 0,
        `${key} / ${count} : pages`,
      );
      if (count > 0) {
        assert.equal(sheet.cells[count - 1].page, Math.floor((count - 1) / perPage));
      }
      // Chaque cellule tombe sur une page qui existe.
      for (const cell of sheet.cells) {
        assert.ok(cell.page >= 0 && cell.page < sheet.pages, `${key} / ${count} : page hors bornes`);
      }
    }
  }
});

test('la pagination conserve l\'ordre et couvre tous les éléments', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const perPage = preset.declaredColumns * preset.declaredRows;
    const count = perPage * 2 + 3;
    const items = Array.from({ length: count }, (_, index) => `lien-${index}`);
    const sheet = computeSheet({ count, ...preset });
    const pages = paginate(items, sheet);

    assert.equal(pages.length, sheet.pages, `${key} : nombre de pages`);
    const flattened = pages.flatMap((page) => page.items.map((entry) => entry.item));
    assert.deepEqual(flattened, items, `${key} : l'ordre doit être conservé`);
    for (const page of pages) {
      for (const entry of page.items) {
        assert.equal(entry.cell.page, page.page, `${key} : cellule sur la mauvaise page`);
      }
      if (perPage > 0) assert.ok(page.items.length <= perPage, `${key} : page trop remplie`);
    }
  }
});

// ---------------------------------------------------------------------------
// Décalage d'impression
// ---------------------------------------------------------------------------

test('le décalage déplace la grille sans changer sa forme', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const perPage = preset.declaredColumns * preset.declaredRows;
    const base = computeSheet({ count: perPage, ...preset });
    const shifted = computeSheet({ count: perPage, ...preset, offsetXMm: 2, offsetYMm: -1.5 });

    assert.equal(shifted.columns, base.columns, `${key} : colonnes`);
    assert.equal(shifted.rows, base.rows, `${key} : rangées`);
    for (const [index, cell] of shifted.cells.entries()) {
      assert.ok(Math.abs(cell.xMm - (base.cells[index].xMm + 2)) < 0.01, `${key} : décalage x`);
      assert.ok(Math.abs(cell.yMm - (base.cells[index].yMm - 1.5)) < 0.01, `${key} : décalage y`);
    }
  }
});

test('un décalage nul ne change strictement rien', () => {
  const preset = SHEET_PRESETS['avery-l7160'];
  const without = computeSheet({ count: 21, ...preset });
  const withZero = computeSheet({ count: 21, ...preset, offsetXMm: 0, offsetYMm: 0 });
  assert.deepEqual(withZero.cells, without.cells);
});

// ---------------------------------------------------------------------------
// Taille du QR Code dans l'étiquette
// ---------------------------------------------------------------------------

test('le côté du QR Code se règle sur le petit côté de l\'étiquette', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const shortest = Math.min(preset.labelWidthMm, preset.labelHeightMm);
    for (const ratio of [MIN_QR_RATIO, 0.5, 0.7, 0.85, MAX_QR_RATIO]) {
      const side = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, ratio);
      assert.ok(
        Math.abs(side - shortest * ratio) < 0.01,
        `${key} / ${ratio} : ${side} mm pour un petit côté de ${shortest} mm`,
      );
    }
  }
});

test('le côté du QR Code ne peut jamais dépasser l\'étiquette', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    // Proportions absurdes : l'interface est bornée, mais le calcul doit tenir
    // même si un appelant lui passe n'importe quoi.
    for (const ratio of [-5, 0, 0.01, 3, 100, NaN, Infinity]) {
      const side = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, ratio);
      assert.ok(side >= 0, `${key} / ${ratio} : côté négatif`);
      assert.ok(
        side <= Math.min(preset.labelWidthMm, preset.labelHeightMm) + EPSILON,
        `${key} / ${ratio} : QR Code de ${side} mm plus grand que l'étiquette`,
      );
    }
  }
});

test('le côté du QR Code croît avec la proportion, sans saut', () => {
  const preset = SHEET_PRESETS['avery-l7160'];
  let previous = 0;
  for (let ratio = MIN_QR_RATIO; ratio <= MAX_QR_RATIO + EPSILON; ratio += 0.05) {
    const side = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, ratio);
    assert.ok(side >= previous - EPSILON, `proportion ${ratio} : le côté diminue`);
    previous = side;
  }
});

test('le calcul refuse une étiquette de dimension nulle', () => {
  assert.throws(() => qrSideMm(0, 30, 0.7), TypeError);
  assert.throws(() => qrSideMm(60, -1, 0.7), TypeError);
  assert.throws(() => qrSideMm(NaN, 30, 0.7), TypeError);
});

// ---------------------------------------------------------------------------
// Contenu de l'étiquette : QR Code + texte
// ---------------------------------------------------------------------------

test('le rognage du texte est empêché, pas seulement signalé', () => {
  for (const [key, preset] of Object.entries(SHEET_PRESETS)) {
    const short = Math.min(preset.labelWidthMm, preset.labelHeightMm);

    // Sans contrainte de lisibilité, la borne haute est celle qui laisse une
    // ligne de texte : le QR Code ne peut donc jamais manger tout le petit côté.
    const roomy = qrRatioBounds({
      labelWidthMm: preset.labelWidthMm,
      labelHeightMm: preset.labelHeightMm,
      qrModules: 25,
      textLines: 1,
      minModuleMm: 0.01,
    });
    assert.equal(roomy.fits, true, `${key} : un QR Code de 25 modules doit tenir`);
    // **Les deux dimensions, et non le petit côté.** L'assertion portait sur le
    // petit côté, ce qui vaut pour une étiquette plus large que haute ; une
    // étiquette haute — le nouveau 3 × 4, 63,5 × 69,1 mm — porte un QR Code
    // aussi large qu'elle, et le texte vit **sous** lui. Ce qui compte est donc :
    // le QR Code tient dans la largeur, et la ligne de texte tient dans ce qui
    // reste en hauteur.
    assert.ok(
      roomy.maxSideMm <= Math.min(preset.labelWidthMm, preset.labelHeightMm) + 1e-9,
      `${key} : la borne haute (${roomy.maxSideMm} mm) dépasse le petit côté`,
    );
    assert.ok(
      roomy.maxSideMm + SHEET_QR_GAP_MM + sheetTextMetrics().lineHeightMm
        <= preset.labelHeightMm + 1e-9,
      `${key} : la borne haute (${roomy.maxSideMm} mm) ne laisse pas la place du texte`,
    );
    // Le rapport se mesure sur le **petit côté** : une étiquette haute peut donc
    // légitimement porter un QR Code qui occupe 100 % de sa largeur, le texte
    // vivant dessous. Ce qui ne doit pas arriver, c'est de dépasser le côté.
    assert.ok(roomy.max <= MAX_QR_RATIO, `${key} : la borne haute dépasse 100 %`);

    // Et la place laissée doit suffire à une ligne, par construction.
    const metrics = sheetTextMetrics();
    assert.ok(
      roomy.maxSideMm + SHEET_QR_GAP_MM + metrics.lineHeightMm <= preset.labelHeightMm + 1e-9,
      `${key} : QR Code + une ligne doit tenir dans le petit côté`,
    );
  }
});

test('la borne basse protège la lisibilité à l\'impression', () => {
  const preset = SHEET_PRESETS['avery-l7160'];
  const short = Math.min(preset.labelWidthMm, preset.labelHeightMm);

  // Une matrice plus dense demande une borne basse plus haute : c'est le
  // détriment que l'utilisateur doit connaître avant d'imprimer.
  let previous = 0;
  for (const modules of [21, 25, 33, 41, 49, 57]) {
    const bounds = qrRatioBounds({
      labelWidthMm: preset.labelWidthMm,
      labelHeightMm: preset.labelHeightMm,
      qrModules: modules,
      textLines: 1,
    });
    assert.ok(bounds.min >= previous - 1e-9, `${modules} modules : la borne baisse`);
    previous = bounds.min;
    assert.ok(bounds.minSideMm >= modules * MIN_MODULE_MM_PAPER - 1e-9);
    if (bounds.fits) {
      assert.ok(bounds.min <= bounds.max, `${modules} modules : intervalle vide`);
      assert.ok(bounds.minSideMm <= short, `${modules} modules : borne basse hors étiquette`);
    }
  }
});

test('une URL trop dense pour l\'étiquette est refusée avec une explication', () => {
  // Tête thermique D110 : 12 mm utiles, 2 px par module à 203 dpi.
  const bounds = qrRatioBounds({
    labelWidthMm: 12,
    labelHeightMm: 25,
    qrModules: 57,
    textLines: 1,
    minModuleMm: minModuleMmThermal(203),
  });
  assert.equal(bounds.fits, false);
  assert.match(bounds.reason, /trop longue/);
  assert.match(bounds.reason, /Raccourcissez l'URL/);
  // Le calcul ne propose pas de cote : il n'y en a pas de valable.
  assert.ok(bounds.minSideMm > bounds.maxSideMm);

  // La même URL courte passe : c'est bien la densité qui décide.
  const ok = qrRatioBounds({
    labelWidthMm: 12,
    labelHeightMm: 25,
    qrModules: 25,
    textLines: 1,
    minModuleMm: minModuleMmThermal(203),
  });
  assert.equal(ok.fits, true, ok.reason);
});

test('le type d\'impression change la contrainte de lisibilité', () => {
  // 33 modules sur une étiquette de 12 mm : impossible sur papier (0,4 mm par
  // module), possible sur une tête thermique (2 px à 203 dpi = 0,25 mm).
  const common = { labelWidthMm: 12, labelHeightMm: 25, qrModules: 33, textLines: 1 };

  const paper = qrRatioBounds({ ...common, minModuleMm: MIN_MODULE_MM_PAPER });
  const thermal = qrRatioBounds({ ...common, minModuleMm: minModuleMmThermal(203) });

  assert.equal(paper.fits, false, 'sur papier, 33 modules ne tiennent pas en 12 mm');
  assert.equal(thermal.fits, true, thermal.reason);
  assert.ok(
    thermal.min < paper.min,
    `la tête thermique autorise un QR Code plus petit (${thermal.min} < ${paper.min})`,
  );
});

test('la découpe du texte tient dans la place réservée', () => {
  // Mesure factice : chaque caractère fait 1 px, la largeur utile 10 px.
  const measure = (text) => text.length;
  const lines = sheetCellLines('un texte beaucoup trop long pour deux lignes', {
    measure,
    innerWidthPx: 10,
    maxLines: 2,
  });

  assert.equal(lines.length, 2);
  assert.ok(lines[1].endsWith('…'), `dernière ligne : « ${lines[1]} »`);
  for (const line of lines) {
    assert.ok(measure(line) <= 10, `ligne trop large : « ${line} » (${measure(line)} px)`);
  }
});

test('la découpe laisse le texte court intact', () => {
  const measure = (text) => text.length;
  const lines = sheetCellLines('court', { measure, innerWidthPx: 10, maxLines: 3 });
  assert.deepEqual(lines, ['court']);
  assert.equal(sheetCellLines('', { measure, innerWidthPx: 10, maxLines: 3 }).length, 0);
  assert.equal(sheetCellLines('texte', { measure, innerWidthPx: 10, maxLines: 0 }).length, 0);
});

// ---------------------------------------------------------------------------
// Cas dégénérés
// ---------------------------------------------------------------------------

test('une étiquette plus grande que la feuille est refusée proprement', () => {
  const layout = computeSheet({
    count: 4, page: 'a4', labelWidthMm: 250, labelHeightMm: 30, marginXMm: 0, marginYMm: 0,
  });
  assert.equal(layout.columns, 0);
  assert.equal(layout.perPage, 0);
  assert.equal(layout.pages, 0);
  assert.deepEqual(layout.cells, []);
  assert.equal(layout.warnings.length, 1);
  assert.deepEqual(paginate(['a', 'b'], layout), []);
});

test('un compte nul ou négatif ne produit aucune cellule', () => {
  for (const count of [0, -3, 0.4, NaN]) {
    const layout = computeSheet({ count, ...SHEET_PRESETS['a4-3x8'] });
    assert.equal(layout.cells.length, 0, `count = ${count}`);
    assert.equal(layout.pages, 0, `count = ${count}`);
  }
});

test('une dimension d\'étiquette invalide lève une erreur explicite', () => {
  assert.throws(() => computeSheet({ count: 1, labelWidthMm: 0, labelHeightMm: 30 }), TypeError);
  assert.throws(() => computeSheet({ count: 1, labelWidthMm: 60, labelHeightMm: -1 }), TypeError);
});

test('une marge négative est ramenée à zéro', () => {
  const layout = computeSheet({
    count: 1, ...SHEET_PRESETS['a4-3x8'], marginXMm: -5, marginYMm: -5,
  });
  assert.equal(layout.cells[0].xMm, 0);
  assert.equal(layout.cells[0].yMm, 0);
});

// ---------------------------------------------------------------------------
// Remplir la feuille : colonnes, rangées, marge globale
// ---------------------------------------------------------------------------

/** Toutes les feuilles connues, pour ne pas tester que le A4. */
const PAGES = Object.entries(PAGE_SIZES);

test('la grille demandée est exactement celle qui sera imprimée', () => {
  // Propriété la plus importante de `fitGrid` : ce qu'on demande est ce qu'on
  // obtient. Une étiquette arrondie vers le bas ferait perdre une colonne, et
  // l'utilisateur ne comprendrait pas pourquoi.
  const cases = [
    [1, 1], [2, 1], [1, 4], [2, 5], [3, 7], [3, 8], [4, 10], [4, 12], [5, 6],
    [6, 13], [8, 16], [3, 30], [12, 1], [1, 30],
  ];
  const margins = [0, 2, 4, 5, 7, 8.6, 10, 15];
  const gaps = [0, 0.5, 1, 2.9, 5];

  let checked = 0;
  for (const [pageName, page] of PAGES) {
    for (const [columns, rows] of cases) {
      for (const marginMm of margins) {
        for (const gapMm of gaps) {
          const grid = fitGrid({
            pageWidthMm: page.widthMm,
            pageHeightMm: page.heightMm,
            columns,
            rows,
            marginMm,
            gapXMm: gapMm,
            gapYMm: gapMm,
          });
          if (!grid.ok) continue;

          const sheet = computeSheet({
            count: columns * rows,
            labelWidthMm: grid.labelWidthMm,
            labelHeightMm: grid.labelHeightMm,
            marginXMm: grid.marginXMm,
            marginYMm: grid.marginYMm,
            gapXMm: gapMm,
            gapYMm: gapMm,
            pageWidthMm: page.widthMm,
            pageHeightMm: page.heightMm,
            // Exactement ce que fait l'application en mode « remplir la
            // feuille » : la grille choisie est passée explicitement.
            columns,
            rows,
            adviseDenser: false,
          });

          assert.equal(
            sheet.columns,
            columns,
            `${pageName} ${columns}×${rows}, marge ${marginMm}, écart ${gapMm} : colonnes`,
          );
          assert.equal(
            sheet.rows,
            rows,
            `${pageName} ${columns}×${rows}, marge ${marginMm}, écart ${gapMm} : rangées`,
          );
          assert.equal(sheet.perPage, columns * rows);
          assert.deepEqual(sheet.warnings, []);
          checked += 1;
        }
      }
    }
  }
  assert.ok(checked > 400, `seulement ${checked} combinaisons vérifiées`);
});

test('les étiquettes calculées tiennent dans la marge demandée', () => {
  for (const [pageName, page] of PAGES) {
    const grid = fitGrid({
      pageWidthMm: page.widthMm,
      pageHeightMm: page.heightMm,
      columns: 3,
      rows: 8,
      marginMm: 6,
      gapXMm: 2,
      gapYMm: 2,
    });
    assert.equal(grid.ok, true, pageName);

    // La marge effective peut s'écarter de quelques centièmes — l'arrondi de
    // l'étiquette est réparti des deux côtés — mais jamais d'un dixième.
    assert.ok(Math.abs(grid.marginXMm - 6) <= 0.05, `${pageName} : marge x ${grid.marginXMm}`);
    assert.ok(Math.abs(grid.marginYMm - 6) <= 0.05, `${pageName} : marge y ${grid.marginYMm}`);

    const used =
      grid.marginXMm * 2 + grid.columns * grid.labelWidthMm + (grid.columns - 1) * 2;
    assert.ok(used <= page.widthMm + 1e-6, `${pageName} : ${used} mm utilisés sur ${page.widthMm}`);
  }
});

test('la taille d\'étiquette diminue quand on demande plus de colonnes', () => {
  const page = PAGE_SIZES.a4;
  let previous = Infinity;
  for (const columns of [1, 2, 3, 4, 5, 6, 8]) {
    const grid = fitGrid({
      pageWidthMm: page.widthMm, pageHeightMm: page.heightMm,
      columns, rows: 1, marginMm: 5, gapXMm: 0, gapYMm: 0,
    });
    assert.equal(grid.ok, true, `${columns} colonnes`);
    assert.ok(grid.labelWidthMm < previous, `${columns} colonnes : ${grid.labelWidthMm} mm`);
    previous = grid.labelWidthMm;
  }
});

test('une demande impossible est refusée avec une explication', () => {
  const page = PAGE_SIZES.a4;
  // 12 colonnes avec 40 mm de marge et 8 mm d'écart : il ne reste que
  // (210 − 80 − 88) / 12 = 3,5 mm par étiquette, sous le minimum imprimable.
  const grid = fitGrid({
    pageWidthMm: page.widthMm,
    pageHeightMm: page.heightMm,
    columns: 12,
    rows: 2,
    marginMm: 40,
    gapXMm: 8,
    gapYMm: 8,
  });
  assert.equal(grid.ok, false);
  assert.match(grid.reason, /minimum|colonnes|rangées/);
  assert.equal(grid.labelWidthMm, 0, 'aucune cote crédible ne doit être proposée');
  // La grille demandée reste lisible dans le refus, pour pouvoir l'expliquer.
  assert.equal(grid.columns, 12);
});

test('une marge trop grande est refusée sans produire de cote négative', () => {
  const page = PAGE_SIZES.a4;
  for (const marginMm of [105, 120, 200]) {
    const grid = fitGrid({
      pageWidthMm: page.widthMm, pageHeightMm: page.heightMm,
      columns: 1, rows: 1, marginMm,
    });
    assert.equal(grid.ok, false, `marge ${marginMm} mm`);
    assert.ok(grid.labelWidthMm >= 0, `marge ${marginMm} mm : cote négative`);
    assert.ok(grid.reason.length > 0);
  }
});

test('fitGrid exige des dimensions de feuille valides', () => {
  assert.throws(() => fitGrid({ pageWidthMm: 0, pageHeightMm: 297, columns: 1, rows: 1 }), TypeError);
  assert.throws(() => fitGrid({ pageWidthMm: 210, pageHeightMm: -1, columns: 1, rows: 1 }), TypeError);
});

test('un nombre de colonnes absurde est ramené à une valeur exploitable', () => {
  const page = PAGE_SIZES.a4;
  for (const columns of [0, -3, 0.4]) {
    const grid = fitGrid({
      pageWidthMm: page.widthMm, pageHeightMm: page.heightMm,
      columns, rows: 1, marginMm: 5,
    });
    assert.equal(grid.columns, 1, `colonnes = ${columns}`);
    assert.equal(grid.ok, true);
  }
});

test('la suggestion de densité se coupe quand la marge est un choix', () => {
  // 60 mm d'étiquette posés à 100 mm du bord : la moitié droite de la feuille
  // reste vide, ce qui vaut la peine d'être dit.
  const base = {
    count: 1,
    pageWidthMm: 210,
    pageHeightMm: 297,
    labelWidthMm: 60,
    labelHeightMm: 60,
    marginXMm: 100,
    marginYMm: 10,
  };

  assert.equal(computeSheet(base).warnings.length, 1);
  assert.deepEqual(computeSheet({ ...base, adviseDenser: false }).warnings, []);
});

test('une grille explicite est honorée telle quelle', () => {
  // Demander 30 rangées et en obtenir 31 serait incompréhensible : la grille
  // choisie est une consigne. C'est le cas de « remplir la feuille ».
  const asked = computeSheet({
    count: 90,
    pageWidthMm: 210, pageHeightMm: 297,
    labelWidthMm: 63.33, labelHeightMm: 9.23,
    marginXMm: 10, marginYMm: 10,
    columns: 3, rows: 30,
  });
  assert.equal(asked.columns, 3);
  assert.equal(asked.rows, 30);
  assert.equal(asked.perPage, 90);
  assert.deepEqual(asked.warnings, [], 'la grille tient, rien à signaler');

  // Sans grille explicite, le calcul reprend ses droits et descend au nombre
  // d'étiquettes que la zone utile accepte réellement.
  const derived = computeSheet({
    count: 90,
    pageWidthMm: 210, pageHeightMm: 297,
    labelWidthMm: 63.33, labelHeightMm: 9.23,
    marginXMm: 10, marginYMm: 10,
  });
  assert.equal(derived.columns, 3);
  assert.ok(derived.rows >= 30, `rangées déduites : ${derived.rows}`);
});

test('une grille explicite trop grande est signalée', () => {
  const layout = computeSheet({
    count: 12,
    pageWidthMm: 210, pageHeightMm: 297,
    labelWidthMm: 60, labelHeightMm: 20,
    marginXMm: 10, marginYMm: 10,
    columns: 5, rows: 2,
  });
  assert.equal(layout.columns, 5, 'la demande est conservée');
  assert.equal(layout.warnings.length, 1);
  assert.match(layout.warnings[0], /ne tient pas/);
  assert.match(layout.warnings[0], /3 × 14 au maximum/);
});

test('une grille déclarée fausse est démasquée par la géométrie', () => {
  // Garde-fou contre un test circulaire : si les préréglages portaient des
  // champs nommés `columns`/`rows`, `computeSheet` les prendrait pour une
  // grille explicite à honorer, et le test « la grille calculée correspond au
  // nombre annoncé » deviendrait vrai par construction. On vérifie ici que la
  // géométrie garde le dernier mot.
  const lying = { ...SHEET_PRESETS['avery-l7160'], declaredColumns: 2, declaredRows: 5 };
  const layout = computeSheet({ count: 1, ...lying });
  assert.equal(layout.columns, 3, 'les cotes de la L7160 placent trois colonnes');
  assert.equal(layout.rows, 7);
  assert.notEqual(
    `${layout.columns}x${layout.rows}`,
    `${lying.declaredColumns}x${lying.declaredRows}`,
    'une déclaration fausse ne doit pas être recopiée',
  );
});

test('les six champs reproduisent exactement chaque planche du catalogue', () => {
  // C'est la propriété qui compte depuis qu'il n'y a plus qu'une présentation :
  // choisir une planche du commerce doit redonner ses cotes publiées — la même
  // taille d'étiquette et le même pas, donc les colonnes en face de leurs cases.
  for (const [key, preset] of Object.entries(SHEET_PRESETS)) {
    const page = PAGE_SIZES[preset.page];
    const grid = presetToGrid(preset, page);

    assert.equal(grid.columns, preset.declaredColumns, `${key} : colonnes`);
    assert.equal(grid.rows, preset.declaredRows, `${key} : rangées`);
    assert.ok(grid.marginXMm >= 0 && grid.marginYMm >= 0, `${key} : marges négatives`);

    const fitted = fitGrid({
      pageWidthMm: page.widthMm,
      pageHeightMm: page.heightMm,
      columns: grid.columns,
      rows: grid.rows,
      marginXMm: grid.marginXMm,
      marginYMm: grid.marginYMm,
      gapXMm: grid.gapXMm,
      gapYMm: grid.gapYMm,
    });
    assert.equal(fitted.ok, true, `${key} : ${fitted.reason}`);

    // La taille est exacte au centième : c'est elle qui fixe le pas.
    assert.ok(
      Math.abs(fitted.labelWidthMm - preset.labelWidthMm) <= 0.02,
      `${key} : largeur ${fitted.labelWidthMm} au lieu de ${preset.labelWidthMm}`,
    );
    assert.ok(
      Math.abs(fitted.labelHeightMm - preset.labelHeightMm) <= 0.02,
      `${key} : hauteur ${fitted.labelHeightMm} au lieu de ${preset.labelHeightMm}`,
    );

    // Et la grille calculée est bien celle demandée.
    const sheet = computeSheet({
      count: 1,
      labelWidthMm: fitted.labelWidthMm,
      labelHeightMm: fitted.labelHeightMm,
      marginXMm: fitted.marginXMm,
      marginYMm: fitted.marginYMm,
      gapXMm: grid.gapXMm,
      gapYMm: grid.gapYMm,
      pageWidthMm: page.widthMm,
      pageHeightMm: page.heightMm,
      columns: grid.columns,
      rows: grid.rows,
      adviseDenser: false,
    });
    assert.equal(sheet.columns, preset.declaredColumns, `${key} : grille`);
    assert.equal(sheet.rows, preset.declaredRows, `${key} : grille`);
    assert.deepEqual(sheet.warnings, [], `${key} : aucun avertissement attendu`);
  }
});

test('une planche du commerce garde son pas, même si sa marge est recentrée', () => {
  // La L7160 a 8,6 mm à gauche et 5,1 mm à droite : une marge symétrique ne peut
  // pas reproduire les deux. Ce qui doit être exact, c'est le **pas** — sans quoi
  // l'erreur s'accumulerait d'une colonne à l'autre.
  const preset = SHEET_PRESETS['avery-l7160'];
  const grid = presetToGrid(preset, PAGE_SIZES[preset.page]);
  const fitted = fitGrid({
    pageWidthMm: PAGE_SIZES.a4.widthMm,
    pageHeightMm: PAGE_SIZES.a4.heightMm,
    columns: grid.columns,
    rows: grid.rows,
    marginXMm: grid.marginXMm,
    marginYMm: grid.marginYMm,
    gapXMm: grid.gapXMm,
    gapYMm: grid.gapYMm,
  });

  const referencePitch = preset.labelWidthMm + preset.gapXMm;
  const ourPitch = fitted.labelWidthMm + grid.gapXMm;
  assert.ok(
    Math.abs(ourPitch - referencePitch) < 0.02,
    `pas de ${ourPitch} mm au lieu de ${referencePitch} mm`,
  );

  // Le recentrage reste une constante, que le décalage peut rattraper.
  const shift = grid.marginXMm - preset.marginXMm;
  assert.ok(Math.abs(shift) < 3, `recentrage de ${shift} mm : à rattraper au décalage`);
});

// ---------------------------------------------------------------------------

test('la mise en page automatique dimensionne la grille au contenu', () => {
  // Le défaut signalé : « il est par exemple absurde de proposer 11 colonnes
  // quand on a que 5 liens ». La grille cherchait la plus dense possible, sans
  // regarder combien d'étiquettes il y avait à placer : cinq liens donnaient
  // 11 × 7 = 77 cases, des timbres sur une page à moitié vide.
  //
  // Ce que le calcul garantit maintenant, sur une A4 avec des marges de 8,5 mm
  // et des écarts de 1,25 mm :
  const base = {
    pageWidthMm: 210,
    pageHeightMm: 297,
    minLabelWidthMm: 25,
    minLabelHeightMm: 20,
    marginXMm: 8.5,
    marginYMm: 8.5,
    gapXMm: 1.25,
    gapYMm: 1.25,
  };

  for (const count of [1, 2, 3, 4, 5, 6, 8, 10, 12, 20, 30, 49, 77]) {
    const plan = autoSheetLayout({ ...base, count });
    assert.ok(plan.perPage >= count, `${count} étiquettes doivent tenir (${plan.perPage})`);
    // Une case vide est du papier, pas une étiquette : on tolère la case qui
    // rend la grille équilibrée, jamais deux.
    assert.ok(
      plan.perPage - count <= 1,
      `${count} étiquettes : ${plan.perPage} cases, soit ${plan.perPage - count} vide(s)`,
    );
    // Et l'étiquette ne s'éloigne pas démesurément de la forme de son contenu —
    // cinq liens ne font pas une bande de 193 × 55 mm.
    const forme = (plan.labelWidthMm / plan.labelHeightMm) / (25 / 20);
    assert.ok(
      forme >= 1 / 2 - 1e-9 && forme <= 2 + 1e-9,
      `${count} étiquettes : forme ${forme.toFixed(2)} × celle du contenu`,
    );
  }

  // Les cas qui ont motivé la correction, nommés.
  assert.deepEqual(
    (({ columns, rows }) => [columns, rows])(autoSheetLayout({ ...base, count: 5 })),
    [2, 3],
    'cinq liens : 2 × 3, et non 11 × 7',
  );
  assert.deepEqual(
    (({ columns, rows }) => [columns, rows])(autoSheetLayout({ ...base, count: 49 })),
    [7, 7],
    'quarante-neuf liens : 7 × 7, exactement',
  );

  // Sans nombre d'étiquettes, le calcul garde son ancien comportement : il
  // remplit la page. C'est ce que fait un appelant qui ne connaît pas son
  // contenu — et le changer aurait été une surprise.
  const sans = autoSheetLayout(base);
  assert.ok(sans.perPage > 11 * 7 - 11, `sans count, la page reste remplie (${sans.perPage})`);
});

test('la mise en page automatique mesure le besoin sur les cotes de chaque grille', () => {
  // **Le défaut mesuré le 29 septembre 2026.** Sur l'A4 3 × 4 mise par défaut,
  // 49 liens donnaient `10 × 5 = 50` étiquettes de 18,2 × 55 mm, dont **45
  // sortaient coupées** — sous une grille annoncée « calculée pour ce contenu ».
  // La cause : le besoin de texte était mesuré à la largeur de la première grille
  // trouvée (26,4 mm), et la grille retenue en avait une autre (18,2 mm), où le
  // texte réclamait plus de lignes.
  //
  // Ce que le scénario reproduit : un texte qui se replie d'autant plus qu'on
  // rétrécit l'étiquette, et une place que le QR Code prend au texte. Le modèle de
  // mesure est déterministe — 9,2 px par caractère à 14 pt —, la propriété
  // éprouvée, elle, ne l'est pas : **la grille retenue porte son texte**, et
  // quand aucune ne le peut, la planche pagine au lieu de tasser.
  const fontPt = 14;
  const modules = 35;
  const mesure = (texte) => texte.length * 9.2;
  const contenu = Array.from({ length: 49 }, (_, i) => sheetCellBlocks({
    title: `Article ${String(i + 1).padStart(3, '0')} — un titre de longueur ordinaire`,
    url: `https://exemple.fr/article-${String(i + 1).padStart(3, '0')}?ref=releve`,
  }, { title: true, url: false }));

  const lignesPour = (largeurMm) => contenu.reduce((plus, blocs) => Math.max(
    plus,
    blocs.reduce((somme, bloc) => somme + sheetCellLines(bloc.text, {
      measure: mesure,
      innerWidthPx: ((largeurMm - SHEET_CELL_MARGIN_MM * 2) * 96) / 25.4,
      maxLines: 99,
    }).length, 0),
  ), 1);

  const budget = (largeurMm, hauteurMm) => sheetTextBudget({
    labelWidthMm: largeurMm,
    labelHeightMm: hauteurMm,
    qrRatio: 0.7,
    fontSizePt: fontPt,
    marginMm: SHEET_CELL_MARGIN_MM,
    gapMm: SHEET_QR_GAP_MM,
  });

  const tient = (largeurMm, hauteurMm) => budget(largeurMm, hauteurMm).textLines >= lignesPour(largeurMm);

  const plan = autoSheetLayout({
    pageWidthMm: 210,
    pageHeightMm: 297,
    marginXMm: 8.5,
    marginYMm: 8.5,
    gapXMm: 1.25,
    gapYMm: 1.25,
    minLabelWidthMm: modules * MIN_MODULE_MM_PAPER + SHEET_CELL_MARGIN_MM * 2,
    minLabelHeightMm: modules * MIN_MODULE_MM_PAPER + SHEET_CELL_MARGIN_MM * 2
      + SHEET_QR_GAP_MM + sheetTextMetrics({ fontSizePt: fontPt }).lineHeightMm,
    count: contenu.length,
    tient,
  });

  // 1. La grille retenue **porte son texte** : c'est la propriété qui manquait.
  assert.ok(
    tient(plan.labelWidthMm, plan.labelHeightMm),
    `${plan.columns} × ${plan.rows} (${plan.labelWidthMm} × ${plan.labelHeightMm} mm) : `
      + `${lignesPour(plan.labelWidthMm)} lignes pour ${budget(plan.labelWidthMm, plan.labelHeightMm).textLines} offertes`,
  );

  // 2. Aucun texte n'est coupé à ces cotes-là — le contrôle du relevé, ici, sans
  //    navigateur.
  const place = budget(plan.labelWidthMm, plan.labelHeightMm);
  const largeurPx = ((plan.labelWidthMm - SHEET_CELL_MARGIN_MM * 2) * 96) / 25.4;
  const coupes = contenu.filter((blocs) => blocs.some((bloc) => sheetCellLines(bloc.text, {
    measure: mesure, innerWidthPx: largeurPx, maxLines: 99,
  }).length > place.textLines));
  assert.equal(coupes.length, 0, `${coupes.length} étiquette(s) coupée(s)`);

  // 3. La grille absurde d'alors ne passe plus le contrôle : 18,2 × 55 mm laisse
  //    7 lignes là où le texte en réclame 9. C'est ce qui la rendait absurde.
  assert.ok(!tient(18.17, 55), 'la grille 10 × 5 de 18,2 × 55 mm doit être refusée');

  // 4. Le contenu ne tient pas sur une page : le calcul le dit, et la planche
  //    pagine — deux pages lisibles plutôt qu'une page tronquée.
  assert.equal(plan.coversCount, false);
  assert.equal(plan.pages, Math.ceil(contenu.length / plan.perPage));
  assert.ok(plan.pages > 1, `la planche doit paginer (${plan.pages} page(s))`);

  // 5. Elle reste plus dense que l'A4 3 × 8 qu'elle remplace, dont une page
  //    portait 24 étiquettes : le calcul ne se paie pas d'une planche à moitié
  //    vide.
  assert.ok(plan.perPage > 24, `${plan.perPage} étiquettes par page`);
});
