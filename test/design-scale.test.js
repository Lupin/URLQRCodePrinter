/**
 * Les échelles du système, et leur tenue.
 *
 * Le système est un catalogue : peu de pas, très espacés, et rien d'inventé
 * entre deux. Une taille de texte hors échelle, un écart en pixels choisi au
 * hasard, un contrôle qui ne partage pas la hauteur commune — chacun suffit à
 * faire retomber la page du côté « formulaire générique ».
 *
 * Les valeurs de l'échelle :
 *
 * - texte : 11 / 13 / 19 / 24 / 40 px, cinq pas, pas six ;
 * - graisses : 400 (texte), 500 (libellés et commandes), 600 (titres) ;
 * - espace : 2 / 4 / 8 / 15 / 22 / 33 / 66 px ;
 * - contrôles : 28 / 36 / 44 px.
 *
 * Le papier a ses propres unités (millimètres, points) : il est exclu.
 */

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

test('les échelles d’espacement, de type, de graisse et de contrôle sont déclarées', () => {
  for (const jeton of ['--space-05', '--space-1', '--space-15', '--space-2', '--space-3',
    '--space-4', '--space-5', '--space-6', '--type-2xs', '--type-sm', '--type-lg',
    '--type-xl', '--type-2xl', '--weight-texte', '--weight-ui', '--weight-titre',
    '--control-sm', '--control', '--control-lg']) {
    assert.match(CSS, new RegExp(`${jeton}\\s*:`), `jeton absent : ${jeton}`);
  }
});

test('les pas de l’échelle sont ceux de la maison', () => {
  const table = {};
  for (const [, nom, valeur] of CSS.matchAll(/--(space-[\w]+|type-[\w]+|weight-[\w]+|control[\w-]*)\s*:\s*([^;]+);/g)) {
    table[nom] = valeur.trim();
  }

  // Texte : cinq pas, pas six.
  assert.equal(table['type-2xs'], '11px');
  assert.equal(table['type-sm'], '13px');
  assert.equal(table['type-lg'], '19px');
  assert.equal(table['type-xl'], '24px');
  assert.equal(table['type-2xl'], '40px');

  // Trois graisses, trois rôles.
  assert.equal(table['weight-texte'], '400');
  assert.equal(table['weight-ui'], '500');
  assert.equal(table['weight-titre'], '600');

  // Espace : 15 px comme écart universel, 66 px comme respiration de section.
  assert.equal(table['space-2'], '15px');
  assert.equal(table['space-3'], '22px');
  assert.equal(table['space-4'], '33px');
  assert.equal(table['space-5'], '66px');
});

test('les trois hauteurs de contrôle sont tenues par les jetons', () => {
  const bouton = CSS.match(/^\.btn \{([\s\S]*?)\}/m)[1];
  assert.match(bouton, /min-height:\s*var\(--control\)/);
  const petit = CSS.match(/^\.btn--small \{([\s\S]*?)\}/m)[1];
  assert.match(petit, /min-height:\s*var\(--control-sm\)/);
  const pied = CSS.match(/^\.inspector__foot \.btn \{([\s\S]*?)\}/m)[1];
  assert.match(pied, /min-height:\s*var\(--control-lg\)/);
});

test('l’onglet actif porte l’orange de l’action, sans ombre', () => {
  const actif = CSS.match(/^\.tab--active \{([\s\S]*?)\}/m)[1];
  assert.match(actif, /border-bottom-color:\s*var\(--action\)/);
  assert.match(actif, /color:\s*var\(--text\)/);
  assert.match(actif, /font-weight:\s*var\(--weight-titre\)/);
  assert.doesNotMatch(actif, /box-shadow/, 'un état ne dépend pas d’une ombre');
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
  // Le focus du curseur est un trait, pas le cadre d'un champ.
  const focus = CSS.match(/^\.input\[type="range"\]:focus,[\s\S]*?\}/m);
  assert.ok(focus, 'focus du curseur non neutralisé');
  assert.match(focus[0], /outline:\s*2px solid var\(--focus\)/);
});
