/**
 * Matrice de tests de la mise en page des planches.
 *
 * Le défaut qui a motivé ce fichier ne se voyait dans aucun test : la géométrie
 * était juste, mais elle n'était **appliquée qu'à l'impression**. L'aperçu
 * empilait donc les étiquettes en une seule colonne, le texte d'une étiquette
 * débordait sur la suivante, et le curseur de largeur du QR n'avait aucun effet.
 *
 * D'où deux niveaux, complémentaires :
 *
 * 1. **ici** — la géométrie pure, sur *tous* les formats et *tous* les cas
 *    limites (0, 1, une étiquette de moins qu'une page, une pile de pages,
 *    décalages négatifs, proportions extrêmes) ;
 * 2. **dans `scripts/verify-brave.mjs`** — le rendu réellement calculé par le
 *    navigateur, mesuré au pixel : colonnes distinctes, aucune superposition,
 *    QR contenu dans sa boîte. C'est ce second niveau qui aurait attrapé le
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
  cellContentFits,
} from '../src/core/sheet.js';

const EPSILON = 1e-6;

/** Les clés de tous les préréglages, pour parcourir la matrice. */
const PRESET_KEYS = Object.keys(SHEET_PRESETS);

/** Comptes à tester : les cas limites d'une pagination. */
function countsFor(preset) {
  const perPage = preset.columns * preset.rows;
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
    assert.equal(layout.columns, preset.columns, `${key} : colonnes`);
    assert.equal(layout.rows, preset.rows, `${key} : rangées`);
    assert.equal(layout.perPage, preset.columns * preset.rows, `${key} : étiquettes par page`);
    assert.deepEqual(layout.warnings, [], `${key} : aucun avertissement attendu`);
  }
});

test('aucune étiquette ne dépasse de la feuille', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    const perPage = preset.columns * preset.rows;
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
    const perPage = preset.columns * preset.rows;
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
    const layout = computeSheet({ count: preset.columns * preset.rows, ...preset });

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
    const perPage = preset.columns * preset.rows;

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
    const perPage = preset.columns * preset.rows;
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
    const perPage = preset.columns * preset.rows;
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
// Taille du QR dans l'étiquette
// ---------------------------------------------------------------------------

test('le côté du QR se règle sur le petit côté de l\'étiquette', () => {
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

test('le côté du QR ne peut jamais dépasser l\'étiquette', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];
    // Proportions absurdes : l'interface est bornée, mais le calcul doit tenir
    // même si un appelant lui passe n'importe quoi.
    for (const ratio of [-5, 0, 0.01, 3, 100, NaN, Infinity]) {
      const side = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, ratio);
      assert.ok(side >= 0, `${key} / ${ratio} : côté négatif`);
      assert.ok(
        side <= Math.min(preset.labelWidthMm, preset.labelHeightMm) + EPSILON,
        `${key} / ${ratio} : QR de ${side} mm plus grand que l'étiquette`,
      );
    }
  }
});

test('le côté du QR croît avec la proportion, sans saut', () => {
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
// Contenu de l'étiquette : QR + texte
// ---------------------------------------------------------------------------

test('le rognage du texte est détecté avant l\'impression', () => {
  for (const key of PRESET_KEYS) {
    const preset = SHEET_PRESETS[key];

    // Au maximum, le QR occupe tout le petit côté : il ne reste aucune place
    // pour une ligne de texte, et le conteneur rognerait en silence.
    const maxSide = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, MAX_QR_RATIO);
    const tight = cellContentFits({
      labelWidthMm: preset.labelWidthMm,
      labelHeightMm: preset.labelHeightMm,
      qrSideMm: maxSide,
    });
    assert.equal(tight.ok, false, `${key} : le rognage à 100 % doit être signalé`);
    assert.match(tight.reason, /rogné|large/, `${key} : le message doit expliquer`);
    assert.ok(tight.neededMm > tight.availableMm, `${key} : la place demandée doit dépasser`);

    // À 50 %, le QR et une ligne de texte tiennent toujours.
    const halfSide = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, 0.5);
    const roomy = cellContentFits({
      labelWidthMm: preset.labelWidthMm,
      labelHeightMm: preset.labelHeightMm,
      qrSideMm: halfSide,
    });
    assert.equal(roomy.ok, true, `${key} : à 50 %, le contenu doit tenir (${roomy.reason})`);
    assert.equal(roomy.reason, '');
  }
});

test('le texte peut être omis sans fausser le verdict', () => {
  const preset = SHEET_PRESETS['avery-l7159'];
  const side = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, MAX_QR_RATIO);
  // QR seul : il tient, puisqu'il fait exactement le petit côté.
  const alone = cellContentFits({
    labelWidthMm: preset.labelWidthMm,
    labelHeightMm: preset.labelHeightMm,
    qrSideMm: side,
    textLines: 0,
  });
  assert.equal(alone.ok, true, alone.reason);

  // Une seule ligne suffit à ne plus tenir.
  const withLine = cellContentFits({
    labelWidthMm: preset.labelWidthMm,
    labelHeightMm: preset.labelHeightMm,
    qrSideMm: side,
    textLines: 1,
  });
  assert.equal(withLine.ok, false);
});

test('une étiquette large accepte plusieurs lignes de texte', () => {
  const preset = SHEET_PRESETS['avery-5163'];
  const side = qrSideMm(preset.labelWidthMm, preset.labelHeightMm, 0.5);
  const many = cellContentFits({
    labelWidthMm: preset.labelWidthMm,
    labelHeightMm: preset.labelHeightMm,
    qrSideMm: side,
    textLines: 5,
  });
  assert.equal(many.ok, true, many.reason);
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
