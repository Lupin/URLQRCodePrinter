/**
 * Tests du découpage en pages.
 *
 * Le calcul est pur : il reçoit des hauteurs, il rend des tranches. Ce qu'on
 * vérifie ici, ce sont les trois règles qui décident du rendu papier — l'ordre,
 * la ligne trop haute, et la mesure absente.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { paginateByHeight, countPages } from '../src/core/pagination.js';

test('les lignes sont réparties dans l\'ordre, sans en perdre', () => {
  // Cinq lignes de 30 dans une page utile de 100 : trois par page.
  const tranches = paginateByHeight([30, 30, 30, 30, 30], 100);
  assert.deepEqual(tranches, [{ start: 0, end: 3 }, { start: 3, end: 5 }]);

  // Et la somme des tranches couvre bien toutes les lignes, une fois chacune.
  const indices = tranches.flatMap(({ start, end }) => (
    Array.from({ length: end - start }, (_, i) => start + i)
  ));
  assert.deepEqual(indices, [0, 1, 2, 3, 4]);
});

test('une ligne plus haute qu\'une page occupe sa page, seule', () => {
  // Elle n'est ni coupée ni retirée : c'est la règle qui protège la donnée.
  const tranches = paginateByHeight([20, 500, 20], 100);
  assert.deepEqual(tranches, [{ start: 0, end: 1 }, { start: 1, end: 2 }, { start: 2, end: 3 }]);
});

test('des hauteurs inégales sont cumulées, pas comptées', () => {
  // 40 + 40 = 80 : la troisième ligne de 30 porterait à 110, au-delà des 100.
  // Elle part donc sur la page suivante, avec la quatrième (30 + 40 = 70).
  const tranches = paginateByHeight([40, 40, 30, 40], 100);
  assert.deepEqual(tranches, [{ start: 0, end: 2 }, { start: 2, end: 4 }]);
});

test('une mesure absente rend une seule page', () => {
  // Un rendu qui n'a pas eu lieu donne des hauteurs nulles : fabriquer une page
  // par ligne serait pire que de laisser le navigateur se débrouiller.
  assert.deepEqual(paginateByHeight([0, 0, 0, 0], 100), [{ start: 0, end: 4 }]);
  assert.deepEqual(paginateByHeight([], 100), [{ start: 0, end: 0 }]);
  assert.deepEqual(paginateByHeight([30, 30], 0), [{ start: 0, end: 2 }]);
  assert.deepEqual(paginateByHeight([30, 30], Number.NaN), [{ start: 0, end: 2 }]);
});

test('une hauteur non finie ne fait pas disparaître la ligne', () => {
  // `NaN` et l'infini viennent d'une mesure ratée : la ligne compte pour zéro
  // plutôt que d'emporter la page avec elle.
  assert.deepEqual(paginateByHeight([Number.NaN, 30, Infinity], 100), [{ start: 0, end: 3 }]);
});

test('le nombre de pages suit la répartition', () => {
  assert.equal(countPages([30, 30, 30, 30, 30], 100), 2);
  assert.equal(countPages([30], 100), 1);
  assert.equal(countPages([], 100), 1);
});

test('un tableau réel tient sur le nombre de pages attendu', () => {
  // Le cas mesuré dans Chrome : 45 lignes de 54 px pour 1 084 px utiles, la
  // bande de titre déduite. Trois pages, et non une.
  const lignes = Array.from({ length: 45 }, () => 54);
  const tranches = paginateByHeight(lignes, 1084);
  assert.equal(tranches.length, 3);
  assert.deepEqual(tranches[0], { start: 0, end: 20 });
  assert.equal(tranches.at(-1).end, 45);
});
