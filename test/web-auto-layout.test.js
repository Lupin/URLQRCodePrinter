/**
 * Décocher « Mise en page automatique » doit se voir.
 *
 * Le défaut signalé : « quand on décoche une option de layout il faut faire un
 * refresh de la preview, sinon on a l'impression que c'est un bug d'affichage que
 * rien ne change ». Le rendu était bien relancé ; ce qui ne changeait pas, c'est
 * ce qu'il lisait — le calcul avait réécrit les six cotes de la planche, et
 * décocher les laissait en place. La planche restait identique au millimètre
 * près, ce qui ressemble exactement à un aperçu qui ne se rafraîchit pas.
 *
 * Le scénario exécute l'application pour de vrai, avec un stockage en mémoire à
 * la forme de `chrome.storage.local` : il coche la case, constate que les champs
 * sont calculés puis inactifs, décoche, et exige que les cotes de l'utilisateur
 * soient revenues.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp, fire } from './helpers/dom-shim.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

const CHAMPS = ['sheet-columns', 'sheet-rows', 'sheet-margin-x', 'sheet-margin-y', 'sheet-gap-x', 'sheet-gap-y'];

/** Les six cotes telles que les champs les portent. */
const grille = (registry) => Object.fromEntries(
  CHAMPS.map((id) => [id, registry.get(id)?.value]),
);

/** Les cotes proposées par l'utilisateur, qu'aucun calcul ne doit garder. */
const MANUELLE = {
  'sheet-columns': '2',
  'sheet-rows': '3',
  'sheet-margin-x': '5.5',
  'sheet-margin-y': '6.5',
  'sheet-gap-x': '0.25',
  'sheet-gap-y': '0.75',
};

/** Zone de stockage simulée, à la forme de `chrome.storage.local`. */
function zone(initial = {}) {
  const data = { ...initial };
  return {
    data,
    async get(key) {
      return { [key]: data[key] };
    },
    async set(patch) {
      Object.assign(data, patch);
    },
  };
}

/** Un lien minimal, avec un titre qui se replie. */
function lien(id, titre) {
  return {
    id,
    url: `https://exemple.fr/article-${id}`,
    title: titre,
    note: '',
    tags: [],
    collectionId: 'default',
    createdAt: 10 + Number(id),
    updatedAt: 10 + Number(id),
    source: 'manual',
    favicon: '',
    shortUrl: '',
  };
}

/** Démarre l'application, champs réglés à la main. */
async function demarrer() {
  const area = zone({
    'url-qr-code-printer/collections': {
      version: 1,
      migratedAt: 1,
      items: [{ id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 }],
    },
    'url-qr-code-printer/active-collection': { normal: 'default', private: '' },
    links: [
      lien('1', 'Court'),
      lien('2', 'Un titre de longueur moyenne, qui se replie'),
      lien('3', 'Un titre franchement plus long que les autres, écrit pour occuper plusieurs lignes entières'),
    ],
  });

  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    chrome: { runtime: { id: 'test' }, storage: { local: area } },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);

  // Les cotes de l'utilisateur : c'est ce que la case automatique va écraser.
  for (const [id, valeur] of Object.entries(MANUELLE)) registry.get(id).value = valeur;

  return { registry, area, node: (id) => registry.get(id) };
}

// ---------------------------------------------------------------------------

test('cocher la mise en page automatique calcule les cotes, et les rend inactives', async () => {
  const app = await demarrer();
  const box = app.node('sheet-auto');
  box.checked = true;
  await fire(box, 'change');

  const apres = grille(app.registry);
  // Les champs portent la grille **annoncée** par l'application, et non celle de
  // l'utilisateur : c'est le message sous la case qui dit laquelle, et le
  // comparer aux champs évite d'écrire ici une grille que le calcul peut
  // légitimement changer.
  const annonce = app.node('sheet-auto-hint').textContent;
  const [, colonnes, rangees] = annonce.match(/(\d+)\s*×\s*(\d+)/) ?? [];
  assert.ok(colonnes, `la grille calculée doit être annoncée : « ${annonce} »`);
  assert.equal(apres['sheet-columns'], colonnes, 'les colonnes doivent être celles du calcul');
  assert.equal(apres['sheet-rows'], rangees, 'les rangées doivent être celles du calcul');
  // Et les champs ne sont plus modifiables : ils ne sont plus des réglages.
  assert.equal(
    CHAMPS.every((id) => app.node(id).disabled === true),
    true,
    'les six champs doivent être inactifs',
  );
});

test('décocher rend les cotes de l\'utilisateur, et un aperçu qui change vraiment', async () => {
  const app = await demarrer();
  const box = app.node('sheet-auto');

  box.checked = true;
  await fire(box, 'change');
  const calculee = grille(app.registry);

  box.checked = false;
  await fire(box, 'change');
  const rendue = grille(app.registry);

  // **Le cœur du défaut** : sans cette remise en état, `rendue` valait `calculee`
  // — la planche ne bougeait pas, et l'aperçu passait pour cassé.
  assert.deepEqual(rendue, MANUELLE, 'les cotes de l\'utilisateur doivent revenir');
  assert.notDeepEqual(rendue, calculee, 'décocher doit changer ce que la planche lit');
  assert.equal(
    CHAMPS.every((id) => app.node(id).disabled === false),
    true,
    'les six champs redeviennent réglables',
  );
});

test('recocher puis décocher deux fois de suite rend encore les cotes de l\'utilisateur', async () => {
  // La mémoire est posée au premier cochage et **consommée** au décochage : un
  // second aller-retour ne doit pas rendre une grille calculée.
  const app = await demarrer();
  const box = app.node('sheet-auto');

  for (const tour of [1, 2]) {
    box.checked = true;
    await fire(box, 'change');
    box.checked = false;
    await fire(box, 'change');
    assert.deepEqual(grille(app.registry), MANUELLE, `tour ${tour} : les cotes doivent revenir`);
  }
});
