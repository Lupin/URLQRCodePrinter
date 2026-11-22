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

test('la numérotation des pages est une option, appliquée au papier et à l’aperçu', () => {
  assert.match(HTML, /id="sheet-page-numbers" type="checkbox" checked/);
  assert.match(APP, /function numeroterPages\(/);
  // Une seule page n'a pas besoin d'être numérotée.
  assert.match(APP, /if \(!actif \|\| pages\.length < 2\) return pages/);
  // Le numéro vit hors grille : position absolue dans la marge.
  assert.match(CSS, /^\.print-page__number \{[\s\S]*?position:\s*absolute/m);
  // Il est posé à l'impression comme à l'aperçu.
  assert.match(APP, /for \(const page of numeroterPages\(buildSheetPages\(items\)\)\) el\.printRoot/);
  assert.match(APP, /const pages = numeroterPages\(buildSheetPages\(items\)\)/);
  assert.match(APP, /el\.sheetPageNumbers\?\.addEventListener\('change', renderPreview\)/);
});

test('l’écart ne rétrécit plus l’étiquette : c’est la grille qui cède', () => {
  // En mode manuel, les cotes viennent de la disposition et restent stables.
  assert.match(APP, /if \(!autoActif\) \{/);
  assert.match(APP, /labelWidthMm: coteW,/);
  assert.match(APP, /const maxColonnes = Math\.max\(1, capacite\(usableW, coteW, demande\.gapXMm\)\)/);
  assert.match(APP, /reduced: columns !== garde\.columns \|\| rows !== garde\.rows/);
  // La grille réduite est centrée, sinon le vide tombe d'un seul côté.
  assert.match(APP, /Math\.max\(demande\.marginXMm, \(page\.widthMm - contenuW\) \/ 2\)/);
  // Les champs suivent la grille réduite : ils disent ce qui s'imprime.
  assert.match(APP, /if \(el\.sheetColumns && document\.activeElement !== el\.sheetColumns\)/);
  // Et l'indice dit la taille, puis pourquoi la grille a cédé.
  assert.match(APP, /Taille des étiquettes : \{size\}, \{columns\} × \{rows\} par feuille\./);
  assert.match(APP, /a ramené la grille à \{columns\} × \{rows\} : la taille des étiquettes est conservée\./);
});
