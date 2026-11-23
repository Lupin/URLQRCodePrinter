import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const SCRIPT = readFileSync(new URL('scripts/store.mjs', ROOT), 'utf8');
const PKG = JSON.parse(readFileSync(new URL('package.json', ROOT), 'utf8'));

test('une seule commande produit le dossier de dépôt', () => {
  assert.equal(PKG.scripts.store, 'node scripts/store.mjs');
  assert.match(SCRIPT, /const OUT = join\(ROOT, 'dist', 'store'\)/);
  // Le dossier est refait de zéro : aucun fichier périmé ne survit.
  assert.match(SCRIPT, /rmSync\(OUT, \{ recursive: true, force: true \}\)/);
  // Les captures sont refaites, pas recopiées d'une exécution précédente.
  assert.match(SCRIPT, /capture-store-shots\.mjs/);
  assert.match(SCRIPT, /capture-popup-shots\.mjs/);
  assert.match(SCRIPT, /capture-promo\.mjs/);
  // La page GitHub Pages est régénérée avec les nouvelles images.
  assert.match(SCRIPT, /captureSite/);
  assert.match(SCRIPT, /build-site\.mjs/);
  assert.match(SCRIPT, /src', 'site', 'images'/);
});

test('le dossier de dépôt ne contient que les fichiers attendus', () => {
  // Les cinq captures, dans les deux langues, plus les visuels et les textes.
  for (const base of [
    '01-fenetre-popup', '02-application', '03-impression-niimbot',
    '04-mention-confidentialite', '05-collections',
  ]) {
    assert.ok(SCRIPT.includes(base), `capture absente du script : ${base}`);
  }
  for (const fichier of [
    'promo-440x280.jpg', 'marquee-1400x560.jpg', 'icone-128.png',
    'url-qrcode-printer-chrome.zip', 'listing-fr.md', 'listing-en.md',
    'a-coller-mise-a-jour.md', 'CHECKLIST.md', 'version.json',
  ]) {
    assert.ok(SCRIPT.includes(fichier), `absent du script : ${fichier}`);
  }
  assert.match(SCRIPT, /for \(const langue of \['fr', 'en'\]\)/);
});
