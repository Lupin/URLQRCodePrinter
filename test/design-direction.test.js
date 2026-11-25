/**
 * La direction est-elle la même partout ?
 *
 * Trois surfaces vivent dans le dépôt : l'application, la fenêtre de
 * l'extension, le site public. Elles n'ont pas la même fonction, mais elles
 * portent la même main. Ce test tient les traits qui ne se négocient pas :
 *
 * - **angles vifs** : un seul rayon, zéro ;
 * - **aucune grande surface noire** : le noir est une encre (texte, filets,
 *   petit badge), jamais un fond de travail ;
 * - **une seule ombre, pour le papier** : la feuille est un objet posé, et rien
 *   d'autre ne flotte ;
 * - **une voix typographique** : 400 pour le texte, 500 pour les libellés,
 *   600 pour les titres — jamais au-delà ;
 * - **mouvement** : un pas de temps tokenisé, et sa réduction quand le système
 *   la demande.
 *
 * Le site public est encore sur l'ancienne direction : il est jugé avec ses
 * propres règles. Le bac à sable du nouveau site vit hors du dépôt.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const WEB = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const POPUP = readFileSync(new URL('src/extension-src/popup.css', ROOT), 'utf8');
const PRIVACY = readFileSync(new URL('src/extension-src/privacy.css', ROOT), 'utf8');
const SITE = readFileSync(new URL('src/site/style.css', ROOT), 'utf8');

/** Les règles d'écran de l'application : la planche papier est exclue. */
const WEB_ECRAN = WEB.replace(/\/\*[\s\S]*?\*\//g, '').split('.print-root')[0];

/** Les feuilles passées au nouveau système. */
const SURFACES = [
  ['application', WEB],
  ['fenêtre', POPUP],
  ['confidentialité', PRIVACY],
];

test('les trois surfaces partagent la même direction : angles vifs et un pas de mouvement', () => {
  for (const [nom, css] of [['web', WEB], ['fenêtre', POPUP], ['site', SITE]]) {
    assert.match(css, /--radius:\s*0/, `${nom} : rayon non nul`);
    assert.match(css, /--motion:\s*\d+ms/, `${nom} : pas de jeton de mouvement`);
  }
});

test('aucun rayon hors du jeton sur l’application, la fenêtre et la confidentialité', () => {
  for (const [nom, css] of SURFACES) {
    const code = nom === 'application' ? WEB_ECRAN : css.replace(/\/\*[\s\S]*?\*\//g, '');
    const rayons = [...code.matchAll(/border-radius:\s*([^;]+);/g)]
      .map((m) => m[1].trim())
      .filter((valeur) => valeur !== '0' && valeur !== 'var(--radius)');
    assert.deepEqual(rayons, [], `${nom} : rayon hors système (${rayons.join(', ')})`);
  }
});

test('le site n’invente ni ombre ni rayon hors direction', () => {
  assert.doesNotMatch(SITE, /box-shadow/, 'le site porte une ombre qui n’est pas dans le système');
  const rayons = [...SITE.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim());
  assert.deepEqual(rayons.filter((valeur) => valeur !== 'var(--radius)'), [], 'rayon hors jeton sur le site');
});

test('une seule ombre, et seulement sous la feuille posée', () => {
  const ombres = [...WEB_ECRAN.matchAll(/box-shadow:\s*([^;]+);/g)]
    .map((m) => m[1].trim())
    .filter((valeur) => valeur !== 'none' && !/^inset/.test(valeur));
  assert.deepEqual(ombres, ['var(--shadow-sheet)'], `ombre hors système : ${ombres.join(' | ')}`);

  for (const [nom, css] of [['fenêtre', POPUP], ['confidentialité', PRIVACY]]) {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const ombresPopup = [...code.matchAll(/box-shadow:\s*([^;]+);/g)]
      .map((m) => m[1].trim())
      .filter((valeur) => valeur !== 'none');
    assert.deepEqual(ombresPopup, [], `${nom} : ombre hors système`);
  }
});

test('aucun dégradé : le système est plat', () => {
  for (const [nom, css] of SURFACES) {
    const code = nom === 'application' ? WEB_ECRAN : css.replace(/\/\*[\s\S]*?\*\//g, '');
    const dégradés = [...code.matchAll(/((?:linear|radial|conic)-gradient\([^;]*)/g)].map((m) => m[1]);
    assert.deepEqual(dégradés, [], `${nom} : dégradé hors système`);
  }
});

test('l’interface ne dépasse jamais la graisse 600', () => {
  const permises = new Set(['400', '500', '600', 'inherit', 'normal',
    'var(--weight-texte)', 'var(--weight-ui)', 'var(--weight-titre)']);
  for (const [nom, css] of SURFACES) {
    const code = nom === 'application' ? WEB_ECRAN : css.replace(/\/\*[\s\S]*?\*\//g, '');
    const graisses = [...code.matchAll(/font-weight:\s*([^;]+);/g)]
      .map((m) => m[1].trim())
      .filter((valeur) => !permises.has(valeur));
    assert.deepEqual(graisses, [], `${nom} : graisse hors système (${graisses.join(', ')})`);
  }
});

test('le gras synthétique est interdit : trois graisses réelles suffisent', () => {
  for (const [nom, css] of SURFACES) {
    assert.match(css, /font-synthesis:\s*none/, `${nom} : le navigateur peut fabriquer du gras`);
  }
});

test('le mouvement est réduit sur les trois surfaces', () => {
  for (const [nom, css] of [['web', WEB], ['fenêtre', POPUP], ['site', SITE]]) {
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, `${nom} : pas de réduction de mouvement`);
  }
});

test('le thème suit la lumière du studio, pas le réglage du système', () => {
  // La référence est « light » : un catalogue sous lumière. Aucune surface du
  // nouveau système ne doit réagir à `prefers-color-scheme`.
  for (const [nom, css] of SURFACES) {
    assert.doesNotMatch(css, /prefers-color-scheme/, `${nom} : réagit encore au thème du système`);
  }
});
