import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');

test('l’impression annonce ce qui va sortir, sans second bouton', () => {
  // Le double « Imprimer » (celui du pied, puis celui de la confirmation) a été
  // supprimé : un résumé permanent dit ce qui sort, et le clic imprime.
  assert.match(HTML, /id="print-summary"[^>]*aria-live="polite"/);
  assert.doesNotMatch(HTML, /id="print-confirm"/);
  assert.match(APP, /el\.print\.addEventListener\('click', printSelection\)/);
  // Le résumé compte les pages du rendu réel.
  assert.match(APP, /function pagesImprimees\(/);
  assert.match(APP, /buildTablePages\(items, \{ preview: true \}\)\.length/);
  assert.match(APP, /buildSheetPages\(items\)\.length/);
  assert.match(APP, /function majResumeImpression\(/);
  assert.match(APP, /tpl\(pages, '\{count\} page', '\{count\} pages'\)/);
});

test('l’impression se termine par un accusé, sans mentir sur le papier', () => {
  // `afterprint` se déclenche aussi à l'annulation : le message dit « terminée
  // ou annulée », il ne prétend pas que la feuille est sortie.
  assert.match(APP, /toast\(t\('Impression terminée ou annulée\.'\)\)/);
});

test('la numérotation est disponible pour la planche et le tableau', () => {
  assert.match(HTML, /id="table-page-numbers" type="checkbox" checked/);
  assert.match(APP, /numeroterPages\(\s*buildTablePages\(items, \{ preview: true \}\),/);
  assert.match(APP, /numeroterPages\(buildTablePages\(items\), el\.tablePageNumbers/);
  assert.match(APP, /el\.tablePageNumbers\?\.addEventListener\('change', renderPreview\)/);
});

test('un refus de longueur propose son remède', () => {
  assert.match(APP, /Encoder l'adresse courte/);
  assert.match(APP, /Changer d'étiquette/);
  assert.match(APP, /preview__actions/);
  // Le remède agit : il bascule la cible puis redessine.
  assert.match(APP, /el\.qrTarget\.value = 'short'/);
  assert.match(APP, /dispatchEvent\(new Event\('change'\)\)/);
});

test('un export long se suit, s’arrête et rend un bilan', () => {
  assert.match(HTML, /id="export-stop"[^>]*hidden/);
  assert.match(APP, /let arret = false;/);
  assert.match(APP, /if \(arret\) break;/);
  assert.match(APP, /Arrêter \(\{index\}\/\{total\}\)/);
  // Accords réels : une étiquette / des étiquettes, jamais « (s) ».
  assert.match(APP, /'Export arrêté : \{count\} étiquette sur \{total\}\.'/);
  assert.match(APP, /'Export arrêté : \{count\} étiquettes sur \{total\}\.'/);
  assert.match(APP, /\{count\} étiquettes exportées — \{filename\}/);
});

test('l’étiquette est cotée, et la taille réelle est disponible', () => {
  // Deux cotes en millimètres autour de l'aperçu, dans le format français.
  assert.match(APP, /className = 'label-cote'/);
  assert.match(APP, /label-cote__w/);
  assert.match(APP, /label-cote__h/);
  assert.match(APP, /coteLargeur\.textContent = t\('\{width\} mm', \{ width: decimal\(largeurMm\) \}\)/);
  // La bascule de taille réelle existait déjà : elle s'applique à l'aperçu seul.
  assert.match(HTML, /id="label-real-size" type="checkbox"/);
  assert.match(APP, /realSize: el\.labelRealSize\.checked/);
  // Le facteur d'agrandissement reste écrit dans la légende.
  assert.match(APP, /Aperçu à \{multiple\} × la taille réelle/);
});

test('l’avertissement de planche propose ses gestes', () => {
  assert.match(HTML, /id="sheet-advice"[^>]*hidden/);
  assert.match(APP, /function majConseilsPlanche\(/);
  assert.match(APP, /el\.sheetAuto\.checked = true/);
  assert.match(APP, /el\.sheetFit\.click\(\)/);
  assert.match(APP, /Ajuster la grille/);
});

test('un export d’archive répond avant de travailler', () => {
  // L'écho est peint avant le travail : une frame passe avant la construction.
  assert.match(APP, /const lancerExport = \(message, travail\) => \{/);
  assert.match(APP, /requestAnimationFrame\(\(\) => setTimeout\(travail, 0\)\)/);
  assert.match(APP, /Préparation de la planche…/);
  assert.match(APP, /Préparation du tableau…/);
});

test('la légende du mode Images donne des millimètres, pas des tirets', () => {
  // `decimal()` recevait une chaîne `toFixed()` : la légende affichait
  // « (— × — mm) ». Les dimensions sont désormais passées en nombres.
  assert.match(APP, /const largeurMm = options\.format\.widthMm;/);
  assert.match(APP, /const hauteurMm = pxToMm\(plan\.heightPx, options\.format\.dpi\);/);
  assert.doesNotMatch(APP, /options\.format\.widthMm\.toFixed\(1\)/);
  // Et le cadre n'est ajouté qu'une fois.
  const zone = APP.slice(APP.indexOf('function renderImagePreview'), APP.indexOf('async function exportLabelImages'));
  assert.equal((zone.match(/el\.preview\.appendChild\(frame\)/g) ?? []).length, 1);
});
