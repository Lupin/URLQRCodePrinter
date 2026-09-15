/**
 * Détection d'une feuille de style obsolète.
 *
 * C'est le scénario qui a coûté le plus de temps à diagnostiquer : le navigateur
 * servait un `style.css` gardé en cache alors que le HTML et les scripts étaient
 * à jour. Les nouveaux réglages apparaissaient, mais la planche s'affichait en
 * une seule colonne et le curseur de largeur du QR restait sans effet — puisque
 * la règle qui contraint le SVG à la largeur de sa boîte manquait.
 *
 * Le versionnement des ressources rend ce cas improbable, mais pas impossible :
 * un onglet resté ouvert, un service worker, une extension rechargée à moitié.
 * L'application doit donc le **dire**, au lieu de laisser chercher.
 *
 * Le contrôle se fait sur une propriété que seule la feuille de style définit :
 * `position: absolute` sur `.print-cell`. On simule ici les deux réponses.
 */

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp } from './helpers/dom-shim.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

/**
 * Enregistre les classes des éléments sondés, pour vérifier ce qui a été
 * interrogé — et non seulement ce qui a été affiché.
 * @type {string[]}
 */
const probed = [];

let bootError = null;
let registry = new Map();

before(async () => {
  ({ registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    // Feuille obsolète : la règle partagée n'est pas appliquée, donc la
    // propriété retombe sur la valeur initiale de `position`.
    computedStyle: (element) => {
      probed.push(element.className);
      return { position: 'static' };
    },
  }));
});

test('l\'application démarre malgré une feuille de style obsolète', () => {
  assert.equal(bootError, null, bootError ? `${bootError.message}\n${bootError.stack}` : '');
});

test('une feuille de style obsolète rend le bandeau visible', () => {
  // Le texte du bandeau est dans index.html : le DOM de substitution ne lit pas
  // le balisage, on vérifie donc ici le câblage. Le contenu du message est
  // contrôlé dans test/web.test.js, sur le fichier réel.
  const banner = registry.get('stale-style');
  assert.ok(banner, 'le bandeau doit exister dans index.html');
  assert.equal(banner.hidden, false, 'le bandeau doit être visible');
});

test('le bandeau survit aux messages suivants du démarrage', () => {
  // Un diagnostic qu'un message transitoire recouvre ne sert à rien : c'est
  // exactement ce qui se passait avec un simple bandeau de bas de page, où le
  // message « stockage temporaire » effaçait l'avertissement.
  assert.equal(registry.get('stale-style').hidden, false);
  assert.notEqual(registry.get('toast').textContent, '', 'un autre message est bien passé');
});

test('le contrôle interroge bien un élément de la feuille partagée', () => {
  // Sans cela, le test pourrait passer parce que la sonde n'a jamais été posée.
  assert.ok(probed.includes('print-cell'), `classes sondées : ${probed.join(', ')}`);
});
