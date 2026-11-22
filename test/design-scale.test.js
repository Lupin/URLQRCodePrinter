import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const CSS = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');

/** Le CSS des écrans, sans le bloc d'impression (où les points sont physiques). */
function cssEcran() {
  const debut = CSS.indexOf('@media print');
  return debut === -1 ? CSS : CSS.slice(0, debut);
}

test('l’écran n’utilise pas plus de cinq tailles de texte, toutes tokenisées', () => {
  const brut = cssEcran();
  const tailles = [...brut.matchAll(/font-size:\s*([^;]+);/g)]
    .map((m) => m[1].trim())
    .filter((v) => v !== 'inherit' && v !== '1em');
  const distinctes = new Set(tailles);
  assert.ok(
    distinctes.size <= 5,
    `trop de tailles d'écran (${distinctes.size}) : ${[...distinctes].join(', ')}`,
  );
  for (const valeur of distinctes) {
    assert.match(valeur, /var\(--type-/, `taille hors échelle : ${valeur}`);
  }
});

test('les échelles d’espacement, de type et de contrôle sont déclarées', () => {
  for (const jeton of ['--space-05', '--space-1', '--space-15', '--space-2', '--space-3',
    '--space-4', '--space-5', '--space-6', '--type-2xs', '--type-xs', '--type-sm',
    '--type-base', '--type-lg', '--type-xl', '--control-sm', '--control', '--control-lg']) {
    assert.match(CSS, new RegExp(`${jeton}\\s*:`), `jeton absent : ${jeton}`);
  }
});

test('les trois hauteurs de contrôle sont tenues par les jetons', () => {
  const bouton = CSS.match(/^\.btn \{([\s\S]*?)\}/m)[1];
  assert.match(bouton, /min-height:\s*var\(--control\)/);
  const petit = CSS.match(/^\.btn--small \{([\s\S]*?)\}/m)[1];
  assert.match(petit, /min-height:\s*var\(--control-sm\)/);
  const pied = CSS.match(/^\.inspector__foot \.btn \{([\s\S]*?)\}/m)[1];
  assert.match(pied, /min-height:\s*var\(--control-lg\)/);
});

test('l’onglet actif porte un indicateur de 2 px à contraste suffisant', () => {
  const actif = CSS.match(/^\.tab--active \{([\s\S]*?)\}/m)[1];
  assert.match(actif, /border-bottom-color:\s*var\(--ink\)/);
  assert.match(actif, /color:\s*var\(--ink\)/);
  assert.doesNotMatch(actif, /box-shadow/, 'un état ne dépend pas d’une ombre');
});

test('une seule ombre dans le système', () => {
  const ombres = [...cssEcran().matchAll(/box-shadow:\s*([^;]+);/g)]
    .map((m) => m[1].trim())
    .filter((v) => v !== 'none' && !/^inset/.test(v));
  for (const ombre of ombres) {
    assert.equal(ombre, 'var(--shadow-sheet)', `ombre hors système : ${ombre}`);
  }
});

test('les gaps suivent l’échelle (les millimètres du papier exceptés)', () => {
  const hors = [...cssEcran().matchAll(/gap:\s*([^;]+);/g)]
    .map((m) => m[1].trim())
    .filter((v) => /\d+(\.\d+)?px/.test(v));
  assert.deepEqual(hors, [], 'gaps en pixels : ' + hors.join(' | '));
});

test('les paddings suivent l’échelle (clamp et millimètres exceptés)', () => {
  const hors = [...cssEcran().matchAll(/padding:\s*([^;]+);/g)]
    .map((m) => m[1].trim())
    .filter((v) => /\d+(\.\d+)?px/.test(v) && !/clamp\(/.test(v));
  assert.deepEqual(hors, [], 'paddings en pixels : ' + hors.join(' | '));
});

test('les variantes de bouton employées existent toutes dans la feuille', () => {
  const html = readFileSync(new URL('src/web/index.html', ROOT), 'utf8');
  const utilisees = new Set([...html.matchAll(/btn--[a-z-]+/g)].map((m) => m[0]));
  const permises = new Set([
    'btn--primary', 'btn--ghost', 'btn--outline', 'btn--danger',
    'btn--fill', 'btn--small', 'btn--wide', 'btn--arrow',
  ]);
  for (const classe of utilisees) {
    assert.ok(permises.has(classe), `variante hors table : ${classe}`);
    assert.match(CSS, new RegExp(`\\.${classe}\\b`), `règle absente : ${classe}`);
  }
});

test('les contrôles natifs sont habillés comme le reste du système', () => {
  assert.match(CSS, /input\[type="checkbox"\][^{]*\{[^}]*appearance:\s*none/);
  assert.match(CSS, /input\[type="range"\][^{]*\{[^}]*appearance:\s*none/);
  assert.match(CSS, /::-webkit-slider-thumb/);
  assert.match(CSS, /scrollbar-width:\s*thin/);
});

test('le curseur ne reprend pas le cadre des champs texte', () => {
  const regle = CSS.match(/^\.input\[type="range"\] \{([\s\S]*?)\}/m);
  assert.ok(regle, 'aucune remise à zéro du curseur');
  assert.match(regle[1], /border:\s*0/);
  const focus = CSS.match(/^\.input\[type="range"\]:focus,[\s\S]*?\}/m);
  assert.ok(focus, 'focus du curseur non neutralisé');
  assert.match(focus[0], /box-shadow:\s*none/);
});
