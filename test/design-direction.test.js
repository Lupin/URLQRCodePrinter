import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const WEB = readFileSync(new URL('src/web/style.css', ROOT), 'utf8');
const POPUP = readFileSync(new URL('src/extension-src/popup.css', ROOT), 'utf8');
const SITE = readFileSync(new URL('src/site/style.css', ROOT), 'utf8');

test('les trois surfaces partagent la même direction : angles vifs et un pas de mouvement', () => {
  for (const [nom, css] of [['web', WEB], ['fenêtre', POPUP], ['site', SITE]]) {
    assert.match(css, /--radius:\s*0/, `${nom} : rayon non nul`);
    assert.match(css, /--motion:\s*\d+ms/, `${nom} : pas de jeton de mouvement`);
  }
});

test('le site n’invente ni ombre ni rayon hors direction', () => {
  assert.doesNotMatch(SITE, /box-shadow/, 'le site porte une ombre qui n’est pas dans le système');
  const rayons = [...SITE.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim());
  assert.deepEqual(rayons.filter((valeur) => valeur !== 'var(--radius)'), [], 'rayon hors jeton sur le site');
});

test('le mouvement est réduit sur les trois surfaces', () => {
  for (const [nom, css] of [['web', WEB], ['fenêtre', POPUP], ['site', SITE]]) {
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, `${nom} : pas de réduction de mouvement`);
  }
});
