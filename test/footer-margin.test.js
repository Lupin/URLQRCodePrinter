import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const APP = readFileSync(new URL('src/web/app.js', ROOT), 'utf8');
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const CORE = readFileSync(new URL('src/core/sheet.js', ROOT), 'utf8');

test('une bande de pied de page est réservée en impression', () => {
  // Signalé : numéro collé au bord, aucune marge en bas, pire en tableau.
  assert.match(APP, /const PAGE_FOOTER_MM = 12;/);
  // Planche : la bande sort de la hauteur utilisable.
  assert.match(APP, /const usableH = page\.heightMm - 2 \* demande\.marginYMm - bande/);
  // Tableau : la bande s'ajoute au rembourrage bas et à la hauteur mesurée.
  assert.match(APP, /const bandePied = el\.tablePageNumbers\?\.checked \? PAGE_FOOTER_MM : 0;/);
  assert.match(APP, /config\.marginXMm\}mm \$\{config\.marginYMm \+ bandePied\}mm/);
  assert.match(APP, /- \(config\.marginYMm \+ bandePied\) \* PX_PER_MM/);
  // Mise en page automatique : même bande dans fitGrid.
  assert.match(APP, /footerMm: el\.sheetPageNumbers\?\.checked \? PAGE_FOOTER_MM : 0/);
  assert.match(CORE, /const footerMm = nonNegative\(options\.footerMm \?\? 0\)/);
  assert.match(CORE, /pageHeightMm - marginYMm \* 2 - footerMm/);
});

test('le numéro reste dans la zone imprimable', () => {
  // 3 mm du bord tombaient dans la marge non imprimable de nombreuses
  // imprimantes ; 8 mm laissent le texte entier et 4 mm de respiration.
  assert.match(CSS, /bottom: 8mm;/);
});
