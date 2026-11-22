import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const HTML = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');

test('la barre de scène porte le zoom, fermé par défaut', () => {
  assert.match(HTML, /id="stage-zoom"[^>]*hidden/);
  for (const id of ['zoom-in', 'zoom-out', 'zoom-fit', 'zoom-value']) {
    assert.match(HTML, new RegExp(`id="${id}"`), `contrôle absent : ${id}`);
  }
  assert.match(HTML, /id="zoom-value"[^>]*aria-live="polite"/);
});

test('le zoom a des niveaux bornés et un état d’ajustement', () => {
  assert.match(APP, /const NIVEAUX_ZOOM = \[0\.5, 0\.67, 0\.8, 1, 1\.25, 1\.5, 2\]/);
  assert.match(APP, /let zoomApercu = 1;/);
  assert.match(APP, /function changerZoom\(/);
  // 1 = ajusté : à ce niveau, l'aperçu ne dépasse pas la taille physique.
  assert.match(APP, /const scale = Math\.min\(zoomApercu, available \/ tailleReelle\)/);
  // Le zoom n'agit pas par transformation CSS : la largeur offerte est multipliée.
  assert.match(APP, /const available = largeurUtileApercu\(\) \* zoomApercu/);
});

test('la légende dit les pages, le papier et l’échelle absolue', () => {
  assert.match(APP, /tpl\(pages\.length, '\{count\} page', '\{count\} pages'\)/);
  assert.match(APP, /PAGE_SIZES\[config\.page\]/);
  assert.match(APP, /Aperçu à \{percent\} % de la taille réelle\./);
  assert.match(APP, /function echelleAffichee\(/);
});

test('la feuille est un objet posé : bord, ombre, et la scène défile', () => {
  const cadre = CSS.match(/^\.preview__frame \{([\s\S]*?)\}/m)[1];
  assert.match(cadre, /border:\s*1px solid var\(--border-strong\)/);
  assert.match(cadre, /box-shadow:\s*var\(--shadow-sheet\)/);
  const surface = CSS.match(/^\.stage__surface \{([\s\S]*?)\}/m)[1];
  assert.match(surface, /overflow:\s*auto/);
});

test('le zoom est montré seulement là où il y a des pages', () => {
  assert.match(APP, /box\.hidden = !\(mode === 'sheet' \|\| mode === 'table'\)/);
  assert.match(APP, /rendreZoom\(\);/);
});
