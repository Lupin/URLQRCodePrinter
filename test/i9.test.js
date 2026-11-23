import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');

test('la sélection s’affiche sur demande, sans dépendre du survol', () => {
  assert.match(HTML, /id="list-select"[^>]*aria-pressed="false"/);
  assert.match(APP, /el\.list\.classList\.toggle\('links--choisir'\)/);
  assert.match(APP, /Terminer la sélection/);
  assert.match(CSS, /\.links--choisir \.link__check,/);
  assert.match(CSS, /\.link--selection \.link__check \{ opacity: 1; \}/);
});

test('la phrase de portée dit ce qui va sortir, sans télégramme', () => {
  assert.match(APP, /Vous imprimez le lien affiché\./);
  assert.match(APP, /Vous imprimez \{count\} lien coché\./);
  assert.match(APP, /Chacun en \{count\} exemplaires?\./);
  assert.doesNotMatch(APP, /\? t\('le lien affiché'\)/);
});
