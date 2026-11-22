import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, ROOT), 'utf8');

test('le CSS du site ne réclame aucun jeton qu’il ne déclare pas', () => {
  const css = lire('src/site/style.css');

  // Ce que la feuille emploie…
  const utilises = new Set(
    [...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]),
  );
  // …et ce qu'elle définit (dans :root, clair ou sombre).
  const declares = new Set(
    [...css.matchAll(/(?:^|[;{\s])(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  );

  const manquants = [...utilises].filter((nom) => !declares.has(nom));
  assert.deepEqual(manquants, [], `jetons non déclarés : ${manquants.join(', ')}`);
});

test('les surfaces qui animent respectent prefers-reduced-motion', () => {
  for (const chemin of ['src/web/style.css', 'src/site/style.css', 'src/extension-src/popup.css']) {
    assert.match(
      lire(chemin),
      /@media \(prefers-reduced-motion: reduce\)/,
      `mouvement réduit absent de ${chemin}`,
    );
  }
});
