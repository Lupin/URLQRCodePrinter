import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');

test('les états vides sont dessinés, avec leur action', () => {
  assert.match(HTML, /id="empty-state" class="empty-state"/);
  assert.match(HTML, /id="empty-art-vide"/);
  assert.match(HTML, /id="empty-art-recherche"[^>]*hidden/);
  assert.match(HTML, /id="empty-add"/);
  assert.match(HTML, /id="empty-import"/);
  assert.match(HTML, /id="empty-search-clear"/);
  // Le bon dessin pour le bon état.
  assert.match(APP, /artVide\.hidden = !aucunLien/);
  assert.match(APP, /artRecherche\.hidden = aucunLien/);
  assert.match(APP, /etatVide\.hidden = visible\.length > 0/);
  // La liste vide ne pousse pas l'état vide au bas du volet.
  assert.match(APP, /el\.list\.hidden = visible\.length === 0/);
  // Même facture que les icônes.
  const art = CSS.match(/\.empty-state__art svg \{([\s\S]*?)\}/)[1];
  assert.match(art, /stroke: var\(--text-3\)/);
  assert.match(art, /stroke-width: 1\.5/);
  assert.match(art, /stroke-linecap: square/);
});
