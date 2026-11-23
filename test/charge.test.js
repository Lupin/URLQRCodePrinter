import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');

test('les réglages secondaires d’un mode sont derrière un dépliant', () => {
  assert.equal((HTML.match(/class="advanced mode__advanced"/g) ?? []).length, 3, 'un dépliant par mode');
  for (const titre of ['Réglages du tableau', 'Réglages de l’étiquette', 'Réglages des images']) {
    assert.ok(HTML.includes(`data-i18n="${titre}"`), `dépliant absent : ${titre}`);
  }
  // Les formats restent visibles : on ne cache pas ce qui décide de la sortie.
  assert.match(HTML, /id="label-profile"[\s\S]*?mode__advanced-body/);
  assert.match(HTML, /id="label-format"[\s\S]*?mode__advanced-body/);
});

test('les cases de ligne ne sont visibles qu’au survol ou au focus', () => {
  assert.match(CSS, /\.link__check \{[\s\S]*?opacity: 0/);
  assert.match(CSS, /\.link:hover \.link__check[\s\S]*?opacity: 1/);
  assert.match(CSS, /@media \(hover: none\)[\s\S]*?\.link__check \{ opacity: 1; \}/);
});
