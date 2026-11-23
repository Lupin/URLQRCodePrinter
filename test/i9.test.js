import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');

test('les cases de sélection sont visibles sans mode spécial', () => {
  // Le bouton « Sélectionner » a été retiré : les cases étaient déjà là, il
  // ajoutait une commande pour révéler une évidence.
  assert.doesNotMatch(HTML, /id="list-select"/);
  assert.doesNotMatch(APP, /links--choisir/);
  assert.match(CSS, /\.link__check \{[\s\S]*?opacity: 1/);
});

test('la phrase de portée dit ce qui va sortir, sans télégramme', () => {
  assert.match(APP, /Vous imprimez le lien affiché\./);
  assert.match(APP, /Vous imprimez \{count\} lien coché\./);
  assert.match(APP, /Chacun en \{count\} exemplaires?\./);
  assert.doesNotMatch(APP, /\? t\('le lien affiché'\)/);
});
