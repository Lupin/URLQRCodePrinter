import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');

test('cocher un lien met à jour « Ce qu’on imprime »', () => {
  // Le défaut : le menu affichait encore « 0 lien coché » après deux cases.
  // Chaque changement de sélection doit reconstruire les options (donc le
  // compte), puis mettre à jour la portée et l'aperçu.
  const gestion = APP.match(/check\.addEventListener\('change', \(\) => \{[\s\S]*?\}\);/)?.[0] ?? '';
  assert.match(gestion, /fillLabelLinks\(\)/, 'la case de ligne ne rafraîchit pas le sélecteur');
  assert.match(gestion, /updatePrintScope\(\)/);
  assert.match(gestion, /renderPreview\(\)/);

  const tout = APP.match(/el\.selectAllBox\.addEventListener\('change', \(\) => \{[\s\S]*?\}\);/)?.[0] ?? '';
  assert.match(tout, /fillLabelLinks\(\)/);

  const vider = APP.match(/getElementById\('selection-clear'\)[\s\S]*?\}\);/)?.[0] ?? '';
  assert.match(vider, /fillLabelLinks\(\)/);
  assert.match(vider, /renderPreview\(\)/);
});
