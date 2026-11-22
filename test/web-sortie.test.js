import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');

test('l’impression annonce d’abord ce qui va sortir', () => {
  assert.match(HTML, /id="print-confirm"[^>]*hidden/);
  assert.match(HTML, /id="print-confirm-text"/);
  for (const id of ['print-confirm-cancel', 'print-confirm-go']) {
    assert.match(HTML, new RegExp(`id="${id}"`), `bouton absent : ${id}`);
  }
  // Le résumé compte les pages du rendu réel, pas une estimation.
  assert.match(APP, /function pagesImprimees\(/);
  assert.match(APP, /buildTablePages\(items, \{ preview: true \}\)\.length/);
  assert.match(APP, /buildSheetPages\(items\)\.length/);
  // Deux accords indépendants : 10 liens peuvent tenir sur 1 page.
  assert.match(APP, /tpl\(items\.length, 'Imprimer \{count\} lien', 'Imprimer \{count\} liens'/);
  assert.match(APP, /tpl\(pages, 'sur \{count\} page', 'sur \{count\} pages'/);
});

test('l’impression se termine par un accusé, sans mentir sur le papier', () => {
  // `afterprint` se déclenche aussi à l'annulation : le message dit « terminée
  // ou annulée », il ne prétend pas que la feuille est sortie.
  assert.match(APP, /toast\(t\('Impression terminée ou annulée\.'\)\)/);
  // Échap et « Annuler » referment sans imprimer, et rendent le focus.
  assert.match(APP, /function annulerImpression\(/);
  assert.match(APP, /if \(panneau && !panneau\.hidden\)/);
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
  assert.match(APP, /Export arrêté : \{faites\} étiquette\(s\) sur \{total\}\./);
  assert.match(APP, /\{count\} étiquettes exportées — \{filename\}/);
});
