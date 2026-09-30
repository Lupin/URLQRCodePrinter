/**
 * Tests de la composition d'étiquettes.
 * On injecte une fonction de mesure déterministe (1 px par caractère) pour que
 * les résultats ne dépendent d'aucune police ni d'aucun navigateur.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  wrapText,
  computeLabelGeometry,
  mmToPx,
  pxToMm,
  checkQrLegibility,
  MAX_FONT_WIDTH_RATIO,
  wrapDate,
  fontSizeForDate,
  layoutLabelRotated,
  drawLabel,
} from '../src/core/label.js';

/** Mesure factice : chaque caractère vaut 10 px. */
const measure10 = (text) => text.length * 10;

// --------------------------------------------------------------------------
// wrapText
// --------------------------------------------------------------------------

test('wrapText découpe sur les espaces', () => {
  assert.deepEqual(wrapText(measure10, 'aaa bbb ccc', 70), ['aaa bbb', 'ccc']);
});

test('wrapText renvoie un tableau vide pour un texte vide', () => {
  assert.deepEqual(wrapText(measure10, '', 70), []);
});

test('wrapText coupe une URL longue sans espace', () => {
  const lines = wrapText(measure10, 'https://example.com/un/chemin/tres/long', 120);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(measure10(line) <= 120, `ligne trop large : ${line}`);
});

test('wrapText respecte maxLines', () => {
  const lines = wrapText(measure10, 'a'.repeat(100), 30, { maxLines: 2 });
  assert.equal(lines.length, 2);
});

test('wrapText ne perd aucun caractère significatif', () => {
  const text = 'https://example.com/actualites/2025/01/15/article';
  const lines = wrapText(measure10, text, 100);
  assert.equal(lines.join('').replace(/\s/g, ''), text.replace(/\s/g, ''));
});

test('wrapText gère le cas dégénéré maxWidth <= 0', () => {
  assert.deepEqual(wrapText(measure10, 'abc', 0), ['abc']);
});

// --------------------------------------------------------------------------
// computeLabelGeometry
// --------------------------------------------------------------------------

test('la géométrie tient dans la largeur demandée', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com/article',
    widthPx: 120,
    measure: measure10,
    fontSize: 10,
  });
  assert.equal(g.width, 120);
  assert.ok(g.qrSize <= 120);
  assert.ok(g.qrSize > 0);
});

test('le QR Code occupe un nombre entier de modules', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com',
    widthPx: 120,
    measure: measure10,
  });
  assert.equal(g.qrSize % g.qrMatrix.size, 0);
});

test('le QR Code garde toujours au moins 2 px par module', () => {
  // Régression : une URL longue faisait tomber l'échelle à 1 px/module, ce qui
  // produisait un QR Code illisible à l'impression thermique.
  const long = computeLabelGeometry({
    text: 'https://example.com/' + 'tres-long-segment/'.repeat(10),
    widthPx: 120, measure: measure10, fontSize: 10,
  });
  assert.ok(long.pxPerModule >= 2, `px/module = ${long.pxPerModule}`);
});

test('une URL courte produit un QR Code qui remplit l\'étiquette', () => {
  const g = computeLabelGeometry({
    text: 'https://a.co', widthPx: 120, measure: measure10, fontSize: 10,
  });
  assert.equal(g.fits, true);
  assert.ok(g.qrSize > 120 * 0.5, `QR Code trop petit : ${g.qrSize} px`);
});

test('une URL démesurée est signalée par fits = false', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com/' + 'x'.repeat(600),
    widthPx: 120, measure: measure10, fontSize: 10,
  });
  assert.equal(g.fits, false);
  assert.ok(g.qrSize > g.width);
});

test('la hauteur respecte le minimum et le maximum', () => {
  const g = computeLabelGeometry({
    text: 'https://a.co', widthPx: 120, measure: measure10,
    minHeightPx: 200, maxHeightPx: 300,
  });
  assert.equal(g.height, 200);

  // Une longueur plus courte que le contenu ne peut pas être respectée : on
  // rend la hauteur naturelle, seule façon de ne rien rogner, et on le signale
  // par un dépassement visible plutôt que par une coupe silencieuse.
  const capped = computeLabelGeometry({
    text: 'https://example.com/' + 'x'.repeat(200),
    widthPx: 120, measure: measure10, minHeightPx: 0, maxHeightPx: 60,
  });
  assert.equal(capped.targetHeight, 60);
  assert.ok(capped.height > 0);
  assert.equal(capped.alignment, 'top', 'sans place, la répartition se désactive');
});

test('le texte est centré sous le QR Code', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com', widthPx: 120, measure: measure10, padding: 6, fontSize: 10,
  });
  assert.equal(g.textTop, 6 + g.qrSize + 6);
  assert.ok(g.textTop + g.lines.length * g.lineHeight <= g.height);
});

test('maxLines limite les lignes, sans amputer le texte', () => {
  // Le plafond protege l'equilibre entre le QR Code et son texte, mais il ne doit
  // pas couper : une URL tronquee est fausse, pas seulement raccourcie.
  const texte = 'https://example.com/' + 'segment/'.repeat(10);
  const g = computeLabelGeometry({
    text: texte, widthPx: 120, measure: measure10, fontSize: 10, maxLines: 2,
  });
  assert.equal(
    g.lines.join('').replace(/\s/g, ''),
    texte.replace(/\s/g, ''),
    'aucun caractere ne doit manquer',
  );
});

// --------------------------------------------------------------------------
// Conversions et lisibilité
// --------------------------------------------------------------------------

test('mmToPx et pxToMm sont cohérents à 203 dpi', () => {
  assert.equal(mmToPx(25.4, 203), 203);
  assert.equal(pxToMm(203, 203), 25.4);
  // 15 mm à 203 dpi font bien 120 px — mais la tête d'un D110 ne fait que
  // 96 px (12 mm). Confondre les deux était l'erreur du prototype d'origine ;
  // c'est pourquoi la géométrie reçoit une largeur de tête, jamais une
  // largeur d'étiquette. Voir test/profiles.test.js.
  assert.equal(mmToPx(15, 203), 120);
});

test('checkQrLegibility accepte un QR Code assez grand', () => {
  const g = computeLabelGeometry({
    text: 'https://a.co', widthPx: 120, measure: measure10, qrRatio: 0.9,
  });
  const verdict = checkQrLegibility(g);
  assert.equal(verdict.ok, true);
  assert.ok(verdict.pxPerModule >= 2);
});

test('checkQrLegibility signale une URL trop longue pour l\'étiquette', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com/' + 'x'.repeat(400),
    widthPx: 120, measure: measure10, qrRatio: 0.9,
  });
  const verdict = checkQrLegibility(g);
  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /URL trop longue/);
  assert.match(verdict.reason, /Raccourcissez/);
});

test('checkQrLegibility signale une densité insuffisante si minScale est forcé à 1', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com/' + 'x'.repeat(400),
    widthPx: 120, measure: measure10, minScale: 1, qrRatio: 1,
  });
  const verdict = checkQrLegibility(g);
  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /px par module/);
});

test('une ligne supplémentaire est réservée dans la hauteur', () => {
  // C'est ce qui empêche la date de sortir du bas de l'étiquette : la
  // géométrie doit réserver sa ligne, pas la découvrir au moment du rendu.
  const measure = (text) => text.length * 6;
  const base = { text: 'https://exemple.fr/page', widthPx: 96, dpi: 203, measure };

  const without = computeLabelGeometry(base);
  const withLine = computeLabelGeometry({ ...base, extraLines: 1 });

  assert.equal(without.extraLines, 0);
  assert.equal(withLine.extraLines, 1);
  assert.equal(withLine.height, without.height + without.lineHeight);
  // Le texte principal cède une ligne à la date au lieu de la dépasser.
  assert.equal(withLine.lines.length, without.lines.length);
});

test('les lignes réservées comptent dans le plafond de lignes', () => {
  const measure = (text) => text.length * 6;
  const long = 'https://exemple.fr/' + 'segment/'.repeat(12);

  const without = computeLabelGeometry({ text: long, widthPx: 96, dpi: 203, measure, maxLines: 4 });
  const reserved = computeLabelGeometry({
    text: long, widthPx: 96, dpi: 203, measure, maxLines: 4, extraLines: 1,
  });

  // Le texte reste entier dans les deux cas : le plafond ne l'ampute pas.
  const entier = (g) => g.lines.join('').replace(/\s/g, '');
  assert.equal(entier(without), entier(reserved), 'meme texte, avec ou sans ligne reservee');
  // Et la ligne reservee s'ajoute bien au texte principal.
  assert.equal(reserved.extraLines, 1);
});

// --------------------------------------------------------------------------
// Longueur d'étiquette et lisibilité
// --------------------------------------------------------------------------

test('sans longueur connue, la hauteur reste celle du contenu', () => {
  // Repli sur le comportement d'avant : le rouleau continu n'a pas de pas, et
  // une longueur inventée ferait pire que bien. La hauteur comprend la marge
  // basse, sans quoi le texte toucherait le bord de l'étiquette.
  const g = computeLabelGeometry({
    text: 'https://exemple.fr/article', widthPx: 96, dpi: 203, measure: measure10,
  });
  const bottom = g.textTop + (g.lines.length + g.extraLines) * g.lineHeight;
  assert.equal(g.targetHeight, 0);
  assert.equal(g.height, g.naturalHeight);
  assert.equal(g.height - bottom, g.padding, 'la marge basse est celle du haut');
});

test('la longueur demandée est remplie exactement', () => {
  // C'est le défaut constaté sur une étiquette réellement imprimée : la
  // composition faisait 18 mm sur un rouleau de 30, et le reste sortait blanc.
  const g = computeLabelGeometry({
    text: 'https://exemple.fr/article', widthPx: 96, dpi: 203, measure: measure10,
    maxHeightPx: 240,
  });
  assert.equal(g.height, 240, 'la hauteur doit être celle du rouleau, pas du contenu');
  assert.ok(g.naturalHeight < g.height, 'il doit rester de la place à répartir');
  assert.ok(g.slack > 0);
});

test('le contenu ne dépasse jamais la longueur, même trop courte', () => {
  // Une longueur plus courte que le contenu ne doit pas pousser le texte sous
  // le bord. La géométrie réduit la police pour que tout entre : si elle y
  // arrive, la disposition répartie s'applique ; sinon elle se rabat sur
  // « en haut », seule façon de ne rien rogner.
  const g = computeLabelGeometry({
    text: 'https://exemple.fr/' + 'segment/'.repeat(12),
    widthPx: 96, dpi: 203, measure: measure10, maxHeightPx: 150, alignment: 'spread',
  });
  assert.ok(['top', 'spread'].includes(g.alignment), `alignement ${g.alignment}`);
  assert.ok(g.textTop + (g.lines.length + g.extraLines) * g.lineHeight <= g.height);
});

test('la disposition répartie colle le texte au bas de l\'étiquette', () => {
  const base = {
    text: 'https://exemple.fr/article', widthPx: 96, dpi: 203, measure: measure10,
    maxHeightPx: 240,
  };
  const spread = computeLabelGeometry({ ...base, alignment: 'spread' });
  const top = computeLabelGeometry({ ...base, alignment: 'top' });

  assert.equal(spread.qrTop, spread.padding, 'le QR Code reste en haut');
  assert.ok(spread.textTop > top.textTop, 'le texte descend');
  assert.equal(
    spread.height - (spread.textTop + (spread.lines.length + spread.extraLines) * spread.lineHeight),
    spread.padding,
    "le texte finit à la marge basse de l'étiquette",
  );
});

test('la disposition centrée partage la place en haut et en bas', () => {
  const g = computeLabelGeometry({
    text: 'https://exemple.fr/article', widthPx: 96, dpi: 203, measure: measure10,
    maxHeightPx: 240, alignment: 'center',
  });
  // La place libre se partage en deux : une moitié au-dessus du QR Code, le reste
  // **sous le texte**. La marge de l'étiquette, elle, reste entière des deux côtés.
  const above = g.qrTop - g.padding;
  const below = g.height - (g.textTop + (g.lines.length + g.extraLines) * g.lineHeight)
    - g.padding;
  assert.ok(above > 0, 'il reste de la place au-dessus');
  assert.ok(below >= 0, 'le texte ne passe pas sous la marge');
  assert.ok(Math.abs(above - Math.floor(g.slack / 2)) <= 1,
    `haut ${above} doit valoir la moitié de la place libre (${g.slack})`);
  // **Et l'autre moitié va sous le texte, pas entre le QR Code et lui.** Le
  // contrôle s'arrêtait à `below >= 0`, si bien que la seconde moitié pouvait se
  // loger dans l'écart QR Code → texte sans que rien ne le dise : mesuré sur une
  // 14 × 50 mm de D110, cet écart montait à 124 px (15,5 mm) au lieu de 6, et le
  // texte se retrouvait collé au bas de l'étiquette. Signalé : « l'interlignage
  // entre le QR Code et le texte est trop large, surtout en 14 × 50 ».
  assert.ok(Math.abs(below - (g.slack - Math.floor(g.slack / 2))) <= 1,
    `bas ${below} doit porter le reste de la place libre (${g.slack})`);
  assert.equal(g.qrTextGap, g.padding,
    "l'écart entre le QR Code et le texte reste la marge, jamais la place libre");
});

test('une longueur connue grossit le texte, jamais au-delà de la lisibilité', () => {
  // 8 px sur une tête de 96, soit 1 mm à 203 dpi : le texte était illisible.
  const base = {
    text: 'https://exemple.fr/article', widthPx: 96, dpi: 203,
    // Mesure volontairement étroite : on veut que ce soit la place, et non la
    // largeur des caractères, qui décide de la taille retenue.
    measure: (text) => text.length * 4,
  };
  const bare = computeLabelGeometry(base);
  assert.ok(pxToMm(bare.fontSize, 203) >= 1.5, `${bare.fontSize} px sur 96, c'est trop petit`);

  const roomy = computeLabelGeometry({ ...base, maxHeightPx: 240, alignment: 'spread' });
  assert.ok(roomy.fontSize > bare.fontSize, 'la place disponible doit profiter au texte');
  assert.ok(roomy.fontSize <= 96 * MAX_FONT_WIDTH_RATIO, 'le texte ne doit pas dominer le QR Code');
});

test('la date ne déborde pas quand une longueur est imposée', () => {
  // `drawLabel` écrit la date sur une seule ligne, sans la découper : la
  // géométrie doit lui laisser la place, sinon elle sort de l'étiquette.
  const g = computeLabelGeometry({
    text: 'https://exemple.fr/article', widthPx: 96, dpi: 203, measure: measure10,
    maxHeightPx: 240, extraLines: 1, alignment: 'spread',
  });
  const bottom = g.textTop + (g.lines.length + g.extraLines) * g.lineHeight;
  assert.ok(bottom <= g.height, `bas ${bottom} > hauteur ${g.height}`);
});

test('une police trop grosse est reduite, et le texte tient', () => {
  // Deux garanties, dans cet ordre : le contenu tient dans la longueur du
  // rouleau — c'est une contrainte physique — et la police baisse pour y
  // arriver. Une mesure proportionnelle a la taille, comme un vrai canvas :
  // une mesure fixe rendrait le test incoherent.
  const long = 'https://www.youtube.com/watch?v=9iL4t8ABGmI&list=PLabc';
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const g = computeLabelGeometry({
    text: long, qrText: long, widthPx: 96, dpi: 203,
    maxHeightPx: 176, measureFactory, fontSize: 40,
  });

  assert.ok(g.fontSize < 40, `la police devait baisser, elle vaut ${g.fontSize}`);
  assert.ok(g.naturalHeight <= 176, `hauteur ${g.naturalHeight} > 176`);
  // Et elle ne descend pas sous le plancher de lisibilite.
  assert.ok(g.fontSize >= 6, `police ${g.fontSize} px, illisible`);
});

test('une URL courte sort entiere, meme reduite', () => {
  // Le cas courant : le texte doit etre complet, pas coupe au milieu.
  const url = 'https://exemple.fr/article';
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const g = computeLabelGeometry({
    text: url, qrText: url, widthPx: 96, dpi: 203,
    maxHeightPx: 176, measureFactory,
  });
  assert.equal(
    g.lines.join('').replace(/\s/g, ''),
    url.replace(/\s/g, ''),
    `texte ampute : ${JSON.stringify(g.lines)}`,
  );
  assert.ok(g.naturalHeight <= 176);
});

test('la police ne descend jamais sous la lisibilite, meme sur une cible courte', () => {
  const long = 'https://exemple.fr/' + 'segment/'.repeat(12);
  const mesure = (texte) => texte.length * 13 * 0.55;
  const g = computeLabelGeometry({
    text: long, qrText: long, widthPx: 96, dpi: 203,
    maxHeightPx: 60, measure: mesure,
  });
  assert.ok(g.fontSize >= 6, `police ${g.fontSize} px, illisible`);
});

// --------------------------------------------------------------------------
// Date et heure
// --------------------------------------------------------------------------
//
// Regression : cocher « Avec l'heure » ne donnait aucune date. La recherche de
// taille exigeait que « 15/09/2026 21:07 » tienne sur une seule ligne, alors
// que le decoupage sait la couper en deux — la date etait donc rejetee en bloc.

test('la date et l heure tiennent en se coupant sur deux lignes', () => {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const largeur = 84;
  const plancher = 13;

  const seule = fontSizeForDate(measureFactory, '15/09/2026', largeur, plancher);
  const avecHeure = fontSizeForDate(measureFactory, '15/09/2026 21:07', largeur, plancher);

  assert.ok(seule >= plancher, `date seule : ${seule} px`);
  assert.ok(avecHeure >= plancher, `date et heure : ${avecHeure} px`);

  // Et le decoupage produit bien deux lignes entieres, pas une date amputee.
  assert.deepEqual(
    wrapDate(measureFactory(avecHeure), '15/09/2026 21:07', largeur, 2),
    ['15/09/2026', '21:07'],
  );
});

test('une date qui ne tient sur aucune ligne est abandonnee', () => {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  // 12 px de large : meme « 21:07 » n'y entre pas.
  assert.equal(fontSizeForDate(measureFactory, '15/09/2026 21:07', 12, 13), 0);
});

// --------------------------------------------------------------------------
// Sens de rotation du texte tourne
// --------------------------------------------------------------------------

test('la geometrie transporte le sens de rotation demande', () => {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const base = {
    text: 'https://exemple.fr/article', qrText: 'https://exemple.fr/article',
    widthPx: 96, dpi: 203, maxHeightPx: 240, measureFactory,
  };
  const g0 = computeLabelGeometry(base);

  const horaire = layoutLabelRotated(g0, {
    measure: measureFactory(13), measureFactory, text: base.text, sens: 'horaire',
  });
  const antihoraire = layoutLabelRotated(g0, {
    measure: measureFactory(13), measureFactory, text: base.text, sens: 'antihoraire',
  });

  assert.equal(horaire.textSens, 'horaire');
  assert.equal(antihoraire.textSens, 'antihoraire');
  // Un sens inconnu retombe sur le sens ordinaire plutot que de rien dessiner.
  const inconnu = layoutLabelRotated(g0, {
    measure: measureFactory(13), measureFactory, text: base.text, sens: 'de-travers',
  });
  assert.equal(inconnu.textSens, 'horaire');
});

test('les deux sens occupent la meme bande', () => {
  // Seul le sens change : la place occupee est identique, sinon l'un des deux
  // deborderait de l'etiquette.
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const base = {
    text: 'https://exemple.fr/article', qrText: 'https://exemple.fr/article',
    widthPx: 96, dpi: 203, maxHeightPx: 240, measureFactory,
  };
  const g0 = computeLabelGeometry(base);
  const options = { measure: measureFactory(13), measureFactory, text: base.text };

  const a = layoutLabelRotated(g0, { ...options, sens: 'horaire' });
  const b = layoutLabelRotated(g0, { ...options, sens: 'antihoraire' });

  assert.equal(a.textTop, b.textTop);
  assert.equal(a.textLeft, b.textLeft);
  assert.equal(a.rotatedTextThickness, b.rotatedTextThickness);
  assert.deepEqual(a.lines, b.lines);
});

// ---------------------------------------------------------------------------
// Le titre dans la bande tournée
//
// Signalé : « en fonction de la taille du supply on est coupé, alors qu'on a de
// la place pour afficher du texte — surtout avec le texte tourné ». Mesuré sur un
// 12 × 75 mm : deux rangées de 72 px occupées dans une bande de 490 px, et la
// moitié du titre perdue. Les lignes du titre venaient de la disposition empilée,
// où elles sont découpées à la **largeur** de l'étiquette ; dans la bande
// tournée, chaque rangée court sur sa **longueur**.
// ---------------------------------------------------------------------------

test('la bande tournée redécoupe le titre à sa longueur, pas à la largeur', () => {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const base = {
    text: 'https://exemple.fr/article', qrText: 'https://exemple.fr/article',
    widthPx: 96, dpi: 203, maxHeightPx: 597, measureFactory,
  };
  const g0 = computeLabelGeometry(base);
  const titre = 'DOUBLE GLASS Office partition By DVO — cloison vitree sur mesure';
  const largeurEtiquette = g0.width - g0.padding * 2;

  // Ce que la disposition empilée aurait fourni : deux rangées étroites.
  const lignesEmpilees = wrapText(measureFactory(g0.fontSize), titre, largeurEtiquette, { maxLines: 2 });
  const bande = layoutLabelRotated(g0, {
    measure: measureFactory(13),
    measureFactory,
    text: base.text,
    titleLines: lignesEmpilees,
    title: titre,
  });

  assert.equal(lignesEmpilees.length, 2, 'le titre doit d\'abord être coupé par la largeur');
  // L'invariant est la **longueur admise par rangée** : chaque rangée du titre
  // tient dans la bande, et au moins une dépasse la largeur de l'étiquette —
  // c'est exactement ce que la découpe à la largeur rendait impossible.
  const mesure = measureFactory(bande.fontSize);
  assert.ok(
    bande.titleLines.every((ligne) => mesure(ligne) <= bande.textWidth + 1),
    `rangées plus longues que la bande : ${bande.titleLines.map((l) => mesure(l)).join(', ')}`,
  );
  assert.ok(
    bande.titleLines.some((ligne) => mesure(ligne) > largeurEtiquette),
    'au moins une rangée doit dépasser la largeur de l\'étiquette',
  );
  assert.notDeepEqual(bande.titleLines, lignesEmpilees);
});

test('sans le titre en clair, les lignes fournies sont conservées', () => {
  // Les appelants qui ne passent que des lignes ne changent pas de
  // comportement : c'est ce qui protège la disposition latérale et les autres.
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const base = {
    text: 'https://exemple.fr/article', qrText: 'https://exemple.fr/article',
    widthPx: 96, dpi: 203, maxHeightPx: 597, measureFactory,
  };
  const g0 = computeLabelGeometry(base);
  const lignes = ['Un titre', 'sur deux lignes'];
  const bande = layoutLabelRotated(g0, {
    measure: measureFactory(13), measureFactory, text: base.text, titleLines: lignes,
  });
  assert.deepEqual(bande.titleLines, lignes);
});

test('un texte trop long pour la bande est signalé, pas coupé en silence', () => {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const long = 'https://exemple.fr/un/chemin/vraiment/tres/long/pour/une/petite/etiquette/qui/ne/peut/pas/tout/garder';
  const base = {
    text: long, qrText: long,
    widthPx: 96, dpi: 203, maxHeightPx: 176, measureFactory,
  };
  const g0 = computeLabelGeometry(base);
  const bande = layoutLabelRotated(g0, {
    measure: measureFactory(13), measureFactory, text: long,
  });

  // Le texte ne tient pas : la géométrie le dit, et l'écran le répète.
  assert.equal(bande.textCut, true);
  const joint = bande.lines.join('').replace(/\s/g, '');
  assert.notEqual(joint, long.replace(/\s/g, ''), 'une partie du texte est bien perdue');

  // À l'inverse, ce qui tient ne crie pas.
  const court = 'https://a.fr';
  const g1 = computeLabelGeometry({ ...base, text: court, qrText: court });
  const tenu = layoutLabelRotated(g1, { measure: measureFactory(13), measureFactory, text: court });
  assert.equal(tenu.textCut, false);
});

// ---------------------------------------------------------------------------
// Ce qui est réellement dessiné dans la disposition tournée
// ---------------------------------------------------------------------------

/**
 * Contexte 2D qui ne peint pas : il retient la matrice courante et la boîte de
 * chaque `fillText`. Seul moyen de vérifier la position réellement calculée
 * sans navigateur — la géométrie, elle, ne dit pas où le texte est écrit.
 */
function contexteInstrumente() {
  let etat = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const pile = [];
  const boites = [];
  const multiplier = (m, n) => ({
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  });
  const appliquer = (x, y) => ({
    x: etat.a * x + etat.c * y + etat.e,
    y: etat.b * x + etat.d * y + etat.f,
  });
  const taillePolice = () => {
    const trouve = /(\d+(?:\.\d+)?)px/.exec(ctx.font ?? '');
    return trouve ? Number(trouve[1]) : 0;
  };
  const ctx = {
    fillStyle: '',
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    imageSmoothingEnabled: false,
    save() { pile.push({ ...etat }); },
    restore() { etat = pile.pop() ?? { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; },
    translate(tx, ty) { etat = multiplier(etat, { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty }); },
    rotate(angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      etat = multiplier(etat, { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
    },
    setTransform(a, b, c, d, e, f) { etat = { a, b, c, d, e, f }; },
    fillRect() {},
    drawImage() {},
    measureText: (texte) => ({ width: texte.length * taillePolice() * 0.55 }),
    getImageData: () => ({ width: 1, height: 1, data: new Uint8ClampedArray(4) }),
    fillText(texte, x, y, maxWidth) {
      const taille = taillePolice();
      const mesure = texte.length * taille * 0.55;
      const largeur = maxWidth === undefined ? mesure : Math.min(mesure, maxWidth);
      const coins = [appliquer(x, y), appliquer(x + largeur, y), appliquer(x, y + taille), appliquer(x + largeur, y + taille)];
      boites.push({
        texte,
        x0: Math.min(...coins.map((p) => p.x)),
        x1: Math.max(...coins.map((p) => p.x)),
        y0: Math.min(...coins.map((p) => p.y)),
        y1: Math.max(...coins.map((p) => p.y)),
      });
    },
  };
  return { ctx, boites };
}

/** Boîte englobante de tout le texte écrit. */
function enveloppe(boites) {
  return {
    x0: Math.min(...boites.map((b) => b.x0)),
    x1: Math.max(...boites.map((b) => b.x1)),
    y0: Math.min(...boites.map((b) => b.y0)),
    y1: Math.max(...boites.map((b) => b.y1)),
  };
}

/** Compose une étiquette tournée et relève ce qui est réellement dessiné. */
function dessineEtMesure(sens, { titre = [], date = [] } = {}) {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const url = 'https://exemple.fr/un-article-assez-long-pour-tester';
  const extraLines = (titre.length > 0 ? 1 : 0) + date.length;
  const g0 = computeLabelGeometry({
    text: url,
    qrText: url,
    widthPx: 96,
    dpi: 203,
    extraLines,
    maxHeightPx: 240,
    measureFactory,
  });
  const geometry = layoutLabelRotated(g0, {
    measure: measureFactory(13),
    measureFactory,
    text: url,
    sens,
    titleLines: titre,
  });
  const { ctx, boites } = contexteInstrumente();
  drawLabel(ctx, geometry, {
    titleLines: titre,
    showTitle: titre.length > 0,
    url,
    extraText: date,
  });
  return { geometry, boites, boite: enveloppe(boites) };
}

test('les deux sens écrivent le texte exactement au même endroit', () => {
  // Le défaut constaté à l'impression : un sens rognait le texte, l'autre non.
  // Les deux doivent produire la même boîte, au pixel près. La comparaison est
  // numérique et non `deepEqual` : les deux ancrages sont calculés par des
  // additions différentes, donc égaux à la virgule flottante près.
  const options = { titre: ['Mes liens'], date: ['15/09/2026 21:07'] };
  const horaire = dessineEtMesure('horaire', options);
  const antihoraire = dessineEtMesure('antihoraire', options);

  for (const bord of ['x0', 'x1', 'y0', 'y1']) {
    assert.ok(
      Math.abs(horaire.boite[bord] - antihoraire.boite[bord]) < 1e-9,
      `${bord} : ${horaire.boite[bord]} contre ${antihoraire.boite[bord]}`,
    );
  }
});

test('le texte tourné est centré dans sa bande, dans les deux sens', () => {
  for (const sens of ['horaire', 'antihoraire']) {
    for (const options of [{}, { titre: ['Mes liens'] }, { date: ['15/09/2026 21:07'] }]) {
      const { geometry, boite, boites } = dessineEtMesure(sens, options);
      const libelle = `${sens} ${JSON.stringify(options)}`;

      // Centré sur l'épaisseur de la bande…
      const centreBande = geometry.textLeft + geometry.rotatedTextThickness / 2;
      const centreTexte = (boite.x0 + boite.x1) / 2;
      assert.ok(
        Math.abs(centreTexte - centreBande) <= 1,
        `${libelle} : centre ${centreTexte} contre ${centreBande}`,
      );

      // …et à l'intérieur du canevas : rien n'est rogné.
      assert.ok(boite.x0 >= 0, `${libelle} : déborde à gauche (${boite.x0})`);
      assert.ok(boite.x1 <= geometry.width, `${libelle} : déborde à droite (${boite.x1})`);
      assert.ok(boite.y0 >= 0, `${libelle} : déborde en haut (${boite.y0})`);
      assert.ok(boite.y1 <= geometry.height, `${libelle} : déborde en bas (${boite.y1})`);
      assert.ok(boites.length > 0);
    }
  }
});

test('l\'épaisseur réservée compte chaque rangée une seule fois', () => {
  // Le titre était compté deux fois — une fois par `titleLines`, une fois par
  // `extraLines` — ce qui réservait une rangée de trop et décalait le bloc.
  const titre = ['Mes liens'];
  const date = ['15/09/2026 21:07'];
  const { geometry } = dessineEtMesure('horaire', { titre, date });
  const rangees = titre.length + geometry.lines.length + date.length;

  assert.equal(geometry.rotatedTextThickness, rangees * geometry.lineHeight);
});

// ---------------------------------------------------------------------------
// La taille de texte demandée
// ---------------------------------------------------------------------------

/** Mesure proportionnelle à la taille, comme un vrai canvas. */
const mesureProportionnelle = (size) => (texte) => texte.length * size * 0.52;

test('la taille demandée est honorée quand le format le permet', () => {
  // Le réglage « Taille du texte » était essayé après un candidat « remplir la
  // longueur » qui, borné par le plafond de largeur, tenait toujours : de 2 à
  // 7 mm la même police sortait, et le réglage n'avait aucun effet.
  // Rouleau de 75 mm : la place ne manque pas, la demande doit donc passer
  // telle quelle. Sur 30 mm, 32 px ne rentrent pas physiquement — c'est l'objet
  // du test suivant, qui vérifie qu'on redescend au lieu d'amputer.
  const url = 'https://exemple.fr/note';
  for (const demandee of [12, 16, 24, 32]) {
    const g = computeLabelGeometry({
      text: url, widthPx: 96, dpi: 203, maxHeightPx: 600,
      fontSize: demandee, measureFactory: mesureProportionnelle,
    });
    assert.equal(g.fontSize, demandee, `taille demandée ${demandee}, obtenue ${g.fontSize}`);
  }
});

test('grossir le texte ajoute des lignes quand la longueur du rouleau le permet', () => {
  // C'est la demande : « autoriser l'affichage sur deux lignes si le format
  // d'impression le permet ». Sur un rouleau long, la même URL passe de une à
  // plusieurs lignes à mesure que la police monte.
  const url = 'https://www.youtube.com/watch?v=jYI8-1dall';
  const lignesPour = (hauteur, taille) => computeLabelGeometry({
    text: url, widthPx: 96, dpi: 203, maxHeightPx: hauteur,
    fontSize: taille, measureFactory: mesureProportionnelle,
  }).lines.length;

  const court = lignesPour(240, 24);
  const long = lignesPour(600, 24);
  assert.ok(long > court, `rouleau long ${long} lignes, court ${court} : le format devrait compter`);

  // Et sur une longueur donnée, grossir la police ajoute bien des lignes.
  assert.ok(lignesPour(600, 32) > lignesPour(600, 16), 'grossir la police devrait ajouter des lignes');
});

test('aucune taille demandée n\'ampute le texte', () => {
  // Une URL coupée après « com/ » est fausse, pas seulement tronquée. C'est la
  // garantie qui rend le réglage utilisable : si la taille demandée ne permet
  // pas d'écrire le texte entier, la géométrie redescend au lieu de couper.
  const url = 'https://www.youtube.com/watch?v=jYI8-1dall';
  for (const hauteur of [176, 240, 600]) {
    for (const demandee of [6, 12, 16, 24, 32, 48, 64]) {
      const g = computeLabelGeometry({
        text: url, widthPx: 96, dpi: 203, maxHeightPx: hauteur,
        fontSize: demandee, measureFactory: mesureProportionnelle,
      });
      assert.equal(
        g.lines.join(''),
        url,
        `amputé à ${demandee} px sur ${hauteur} px : « ${g.lines.join('|')} »`,
      );
    }
  }
});

test('une taille demandée échappe au plafond d\'équilibre, le choix automatique non', () => {
  // Le plafond existe pour que le texte ne domine pas le QR Code quand la géométrie
  // choisit seule. Il ne doit pas annuler un réglage explicite.
  const url = 'https://exemple.fr/note';
  const mesure = mesureProportionnelle;

  const auto = computeLabelGeometry({
    text: url, widthPx: 96, dpi: 203, maxHeightPx: 600, measureFactory: mesure,
  });
  assert.ok(
    auto.fontSize <= 96 * MAX_FONT_WIDTH_RATIO,
    `choix automatique ${auto.fontSize} px, au-dessus du plafond`,
  );

  const demande = computeLabelGeometry({
    text: url, widthPx: 96, dpi: 203, maxHeightPx: 600, fontSize: 32, measureFactory: mesure,
  });
  assert.equal(demande.fontSize, 32, 'la demande explicite doit passer le plafond');
});

// ---------------------------------------------------------------------------
// Taille du titre, et taille demandée du QR Code
//
// Deux réglages demandés : « un champ pour la taille du titre en plus de la
// taille du texte », et « pour le Niimbot M2 et M3, pouvoir changer la taille du
// QR Code car on a de la place quand on compare au D110 ».
// ---------------------------------------------------------------------------

test('la taille du titre est indépendante de celle du texte', () => {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const base = {
    text: 'https://exemple.fr/a', qrText: 'https://exemple.fr/a',
    widthPx: 384, dpi: 300, maxHeightPx: 600, measureFactory,
    extraLines: 1, titleRows: 1, fontSize: 12,
  };

  const meme = computeLabelGeometry(base);
  const grand = computeLabelGeometry({ ...base, titleFontSize: 30 });

  // Le titre occupe une rangée dans les deux cas : c'est sa **hauteur** qui
  // change, et donc celle du bloc entier.
  assert.equal(meme.titleRows, 1);
  assert.ok(grand.titleLineHeight > meme.titleLineHeight);
  // `naturalHeight` est la hauteur d'étiquette que le bloc réclame : c'est elle
  // qui dit que la hauteur du titre compte dans la composition.
  assert.ok(
    grand.naturalHeight > meme.naturalHeight,
    `bloc ${grand.naturalHeight} px contre ${meme.naturalHeight} px`,
  );
  // La géométrie transporte la taille retenue : sans elle, le dessin remettrait
  // le titre à la taille du corps et le réglage n'aurait aucun effet.
  assert.equal(grand.titleFontSize, 30);
});

test('sans taille de titre demandée, rien ne change', () => {
  // C'est ce qui protège les appelants existants : le défaut vaut la taille du
  // texte, au pixel près.
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const base = {
    text: 'https://exemple.fr/a', qrText: 'https://exemple.fr/a',
    widthPx: 96, dpi: 203, maxHeightPx: 240, measureFactory, extraLines: 1, titleRows: 1,
  };
  const implicite = computeLabelGeometry(base);
  const explicite = computeLabelGeometry({ ...base, titleFontSize: base.fontSize });
  assert.equal(implicite.naturalHeight, explicite.naturalHeight);
  assert.equal(implicite.titleLineHeight, explicite.lineHeight);
});

test('une taille de QR Code demandée est honorée, à un module près', () => {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const base = {
    text: '', qrText: 'https://exemple.fr/a',
    widthPx: 567, dpi: 300, maxHeightPx: 800, measureFactory,
  };

  const auto = computeLabelGeometry(base);
  // Sur une tête large, le choix automatique prend presque toute la largeur.
  assert.ok(auto.qrSize > 400, `choix automatique : ${auto.qrSize} px`);

  const petit = computeLabelGeometry({ ...base, qrTargetPx: 300 });
  assert.ok(Math.abs(petit.qrSize - 300) <= petit.qrMatrix.size);
  // Le côté reste un nombre entier de modules : un QR Code arrondi au pixel ne
  // se lirait pas.
  assert.equal(petit.qrSize % petit.qrMatrix.size, 0);
  assert.ok(petit.qrSize < auto.qrSize);
});

test('la taille du QR Code est bornée par la lisibilité et par la largeur', () => {
  const measureFactory = (size) => (texte) => texte.length * size * 0.55;
  const base = {
    text: '', qrText: 'https://exemple.fr/a',
    widthPx: 96, dpi: 203, maxHeightPx: 240, measureFactory,
  };
  const modules = computeLabelGeometry(base).qrMatrix.size;

  // Trop petit : on remonte au plancher de lisibilité, 2 px par module. Un QR
  // Code illisible n'est pas un réglage, c'est une panne.
  const minuscule = computeLabelGeometry({ ...base, qrTargetPx: 4 });
  assert.equal(minuscule.qrSize, modules * 2);
  assert.equal(minuscule.qrSize / modules, 2);

  // Trop grand : on redescend à ce que la largeur utile accepte.
  const enorme = computeLabelGeometry({ ...base, qrTargetPx: 5000 });
  assert.ok(enorme.qrSize <= enorme.width - enorme.padding * 2);
  assert.equal(enorme.fits, true);
});
