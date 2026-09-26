/**
 * Tests de la géométrie des planches d'impression.
 * Les cotes sont en millimètres : une dérive d'un dixième décale une planche
 * d'étiquettes autocollantes de façon visible.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PAGE_SIZES, SHEET_PRESETS, computeSheet, paginate, fitGrid, clampGrid,
  sheetCellText, qrRatioBounds, sheetHeaderFits, SHEET_HEADER_MM,
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
  assert.equal(sheetCellText(LIEN, { title: true, url: false }), 'Un article');
  // Sans titre, l'URL reste : une étiquette sans aucun texte ne dirait plus ce
  // qu'elle désigne.
  assert.equal(sheetCellText({ url: 'https://x.fr' }, { title: true, url: false }), 'https://x.fr');
});

test('sous le QR Code : titre et URL se cumulent', () => {
  assert.equal(sheetCellText(LIEN, { title: true, url: true }), 'Un article https://exemple.fr/a');
  // Un titre vide ne doit pas laisser une espace en tête.
  assert.equal(sheetCellText({ url: 'https://x.fr' }, { title: true, url: true }), 'https://x.fr');
});

test('sous le QR Code : l\'URL seule est enfin atteignable', () => {
  assert.equal(sheetCellText(LIEN, { title: false, url: true }), 'https://exemple.fr/a');
});

test('sous le QR Code : rien du tout est enfin atteignable', () => {
  assert.equal(sheetCellText(LIEN, { title: false, url: false }), '');
});

test('sans option, le titre s\'imprime : l\'ancien comportement est le défaut', () => {
  // Un appel qui oublie les options ne doit pas changer ce qui sort sur le
  // papier. C'est la garantie la plus importante de cette fonction.
  assert.equal(sheetCellText(LIEN), 'Un article');
  assert.equal(sheetCellText(LIEN, {}), 'Un article');
  assert.equal(sheetCellText(LIEN, { title: undefined }), 'Un article');
});

test('sous le QR Code : un titre fait d\'espaces compte comme absent', () => {
  assert.equal(sheetCellText({ title: '   ', url: 'https://x.fr' }, { title: true }), 'https://x.fr');
  assert.equal(sheetCellText({ title: '   ', url: 'https://x.fr' }, { title: false, url: true }),
    'https://x.fr');
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
