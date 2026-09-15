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

test('le QR occupe un nombre entier de modules', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com',
    widthPx: 120,
    measure: measure10,
  });
  assert.equal(g.qrSize % g.qrMatrix.size, 0);
});

test('le QR garde toujours au moins 2 px par module', () => {
  // Régression : une URL longue faisait tomber l'échelle à 1 px/module, ce qui
  // produisait un QR illisible à l'impression thermique.
  const long = computeLabelGeometry({
    text: 'https://example.com/' + 'tres-long-segment/'.repeat(10),
    widthPx: 120, measure: measure10, fontSize: 10,
  });
  assert.ok(long.pxPerModule >= 2, `px/module = ${long.pxPerModule}`);
});

test('une URL courte produit un QR qui remplit l\'étiquette', () => {
  const g = computeLabelGeometry({
    text: 'https://a.co', widthPx: 120, measure: measure10, fontSize: 10,
  });
  assert.equal(g.fits, true);
  assert.ok(g.qrSize > 120 * 0.5, `QR trop petit : ${g.qrSize} px`);
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

  const capped = computeLabelGeometry({
    text: 'https://example.com/' + 'x'.repeat(200),
    widthPx: 120, measure: measure10, minHeightPx: 0, maxHeightPx: 60,
  });
  assert.ok(capped.height <= 60);
});

test('le texte est centré sous le QR', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com', widthPx: 120, measure: measure10, padding: 6, fontSize: 10,
  });
  assert.equal(g.textTop, 6 + g.qrSize + 6);
  assert.ok(g.textTop + g.lines.length * g.lineHeight <= g.height);
});

test('maxLines limite le nombre de lignes de texte', () => {
  const g = computeLabelGeometry({
    text: 'https://example.com/' + 'segment/'.repeat(10),
    widthPx: 120, measure: measure10, fontSize: 10, maxLines: 2,
  });
  assert.ok(g.lines.length <= 2);
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

test('checkQrLegibility accepte un QR assez grand', () => {
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

  assert.equal(without.lines.length, 4);
  assert.equal(reserved.lines.length, 3, 'le total ne doit pas dépasser le plafond');
});
