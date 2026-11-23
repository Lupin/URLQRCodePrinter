import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');

test('les cases d’aperçu sont isolées du contenu et de l’imprimante', () => {
  // Signalé : « problème d'espace avant aperçu à la taille réelle » en Niimbot.
  // La case était collée au texte au-dessus et au bloc imprimante en dessous.
  assert.equal((HTML.match(/field--preview/g) ?? []).length, 2, 'deux cases d’aperçu attendues');
  assert.match(HTML, /class="field field--inline field--preview"[^>]*>\s*<input id="label-real-size"/);
  assert.match(HTML, /class="field field--inline field--preview"[^>]*>\s*<input id="export-real-size"/);
  const regle = CSS.match(/\.field--preview \{([\s\S]*?)\}/)[1];
  assert.match(regle, /margin:\s*var\(--space-2\) 0/);
  assert.match(regle, /padding:\s*var\(--space-2\) 0/);
  assert.match(regle, /border-top:/);
  assert.match(regle, /border-bottom:/);
});
