import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');

test('le mode rangement branche le glissement avant sa bifurcation', () => {
  // Le défaut signalé : en mode rangement, `renderLink` retournait **avant**
  // d'attacher le geste. Les flèches marchaient, la poignée ne faisait rien.
  const appel = APP.indexOf('wireDrag(item);');
  const branche = APP.indexOf('if (reorderMode) {');
  assert.ok(appel > 0 && branche > 0, 'appel ou branche introuvable');
  assert.ok(appel < branche, 'le glissement doit être branché avant la bifurcation');
});

test('le mode rangement se voit et ne montre que ses commandes', () => {
  assert.match(CSS, /\.links--reorder \{\s*\n[\s\S]*?border: 1px solid var\(--border-strong\)/);
  assert.match(CSS, /\.links--reorder \.link__check-hit,\s*\n\.links--reorder \.link__remove,\s*\n\.links--reorder \.link__editor \{ display: none; \}/);
  assert.match(CSS, /\.list-head--mode \.list-head__box/);
  // Les commandes du mode sont des cibles visibles, pas des glyphes.
  assert.match(CSS, /\.links--reorder \.link__move \{[\s\S]*?width: 28px/);
  assert.match(CSS, /\.links--reorder \.link__grip \{[\s\S]*?border: 1px solid var\(--border-strong\)/);
});

test('la bannière de mode dit le geste et la sortie', () => {
  assert.match(APP, /Rangement en cours : faites glisser une ligne, ou utilisez les flèches\. Échap pour terminer\./);
  assert.match(APP, /el\.sortHint\.classList\.toggle\('hint--mode', reorderMode\)/);
});
