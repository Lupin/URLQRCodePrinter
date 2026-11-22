import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');

test('le volet de détail existe, fermé, avec son retour', () => {
  assert.match(HTML, /id="detail-panel"[^>]*hidden/);
  for (const id of ['detail-back', 'detail-title', 'detail-body']) {
    assert.match(HTML, new RegExp(`id="${id}"`), `élément absent : ${id}`);
  }
  // Le volet est le dernier enfant du volet de collection : sa présence ne
  // réordonne rien dans la liste.
  const rail = HTML.slice(HTML.indexOf('class="panel rail"'), HTML.indexOf('class="stage"'));
  assert.ok(rail.indexOf('id="detail-panel"') > rail.indexOf('id="import-menu"'));
});

test('le volet remplace la collection au lieu de la pousser', () => {
  // Toute la collection est retirée du flux quand le détail est ouvert.
  assert.match(CSS, /\.rail--detail > \*:not\(\.detail\)\s*\{\s*display:\s*none/);
  const detail = CSS.match(/^\.detail \{([\s\S]*?)\}/m)[1];
  assert.match(detail, /overflow:\s*auto/);
  // Et le formulaire y est monté, pas dans la ligne.
  assert.match(APP, /hote\.appendChild\(form\)/);
  assert.match(APP, /function afficherDetail\(/);
  assert.match(APP, /function fermerDetail\(/);
});

test('quitter l’édition referme le volet et rend le focus au crayon', () => {
  assert.match(APP, /detailRetour = retour/);
  assert.match(APP, /if \(retour && retour\.isConnected\) retour\.focus\(\)/);
  // Les trois sorties (Annuler, Enregistrer, retour) passent par le même point.
  const fin = APP.slice(APP.indexOf('const finish = async (save)'), APP.indexOf("inputs.get('url').addEventListener('input'"));
  assert.match(fin, /fermerDetail\(\)/);
  assert.match(APP, /getElementById\('detail-back'\)\?\.addEventListener\('click', \(\) => fermerDetail\(\)\)/);
});

test('l’import annonce sa nature, se ferme avec Échap et rend le focus', () => {
  assert.match(HTML, /id="import-menu"[^>]*role="dialog"/);
  assert.match(HTML, /aria-describedby="import-menu-hint"/);
  // Remplacer est le geste destructeur : il porte la variante danger.
  assert.match(HTML, /id="import-replace" class="btn btn--ghost btn--danger"/);
  // Échap referme, et le focus revient au bouton d'import.
  assert.match(APP, /if \(event\.key !== 'Escape'\) return;/);
  assert.match(APP, /if \(etaitOuvert && el\.import\.isConnected\) el\.import\.focus\(\)/);
});
