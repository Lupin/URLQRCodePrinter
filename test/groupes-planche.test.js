import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');

test('les groupes de la planche se souviennent de leur état', () => {
  assert.match(APP, /const GROUPES_PLANCHE_KEY = 'groupes\.planche'/);
  assert.match(APP, /localStorage\.setItem\(GROUPES_PLANCHE_KEY/);
  assert.match(APP, /localStorage\.getItem\(GROUPES_PLANCHE_KEY/);
  // Le stockage peut être refusé : pas de plantage, les groupes restent utilisables.
  assert.match(APP, /catch \{\s*\/\/ Stockage refusé/);
  assert.match(APP, /addEventListener\('toggle', memoriserGroupesPlanche\)/);
});

test('au premier chargement, les groupes sont fermés', () => {
  // L'état par défaut est fermé partout, y compris sous 1024 px.
  assert.match(APP, /memoire && typeof memoire\[nom\] === 'boolean' \? memoire\[nom\] : false/);
  assert.doesNotMatch(HTML, /<details class="sheet-group" open>/);
});
