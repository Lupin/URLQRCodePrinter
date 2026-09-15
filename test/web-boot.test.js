/**
 * Démarrage de l'application web, exécuté réellement.
 *
 * Le DOM de substitution vit dans `test/helpers/dom-shim.mjs`, partagé avec le
 * scénario de feuille de style obsolète.
 */

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp } from './helpers/dom-shim.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');

// La construction est assurée par le script `pretest` de npm : la déclencher
// ici entrerait en concurrence avec test/web.test.js, qui reconstruit la même
// cible en parallèle.
if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

/** Erreur éventuellement levée au chargement, et registre des éléments. */
let bootError = null;
let registry = new Map();

before(async () => {
  ({ registry, bootError } = await bootApp({ distWeb: DIST_WEB }));
});

test('l\'application démarre sans lever d\'exception', () => {
  assert.equal(bootError, null, bootError ? `${bootError.message}\n${bootError.stack}` : '');
});

test('le compteur affiche zéro lien au démarrage', () => {
  assert.equal(registry.get('count').textContent, '0 lien');
});

test('les dispositions de planche sont proposées, groupées par famille', () => {
  const preset = registry.get('preset');
  assert.equal(preset.value, 'a4-3x8', 'le préréglage par défaut doit être sélectionné');

  // Les préréglages sont rangés par famille : les dispositions génériques se
  // règlent, les références Avery se choisissent sur l'emballage.
  const groups = preset.children;
  assert.ok(groups.length >= 3, `${groups.length} famille(s) attendues`);
  for (const group of groups) {
    assert.equal(group.tagName, 'OPTGROUP');
    assert.ok(group.label, 'chaque famille porte un titre');
    assert.ok(group.children.length > 0, `${group.label} ne doit pas être vide`);
    for (const option of group.children) {
      assert.equal(option.tagName, 'OPTION');
      assert.ok(option.value, 'chaque option doit porter une valeur');
      assert.ok(option.textContent, 'chaque option doit porter un libellé');
    }
  }

  const keys = groups.flatMap((group) => group.children.map((option) => option.value));
  assert.ok(keys.includes('avery-l7160'), 'la référence Avery L7160 doit être proposée');
  assert.ok(keys.includes('avery-5160'), 'la référence Avery 5160 (Letter) doit être proposée');
});

test('le format d\'étiquette Niimbot est visible sans imprimante', () => {
  const profiles = registry.get('label-profile').children;
  assert.ok(profiles.length >= 2, 'les formats D110 et M2 doivent être proposés');
  assert.equal(registry.get('label-profile').value, 'D110', 'le D110 est retenu par défaut');

  const labels = profiles.map((option) => option.textContent).join(' | ');
  assert.match(labels, /D110/);
  assert.match(labels, /M2/);
  assert.match(labels, /mm/, 'chaque format annonce sa largeur utile en millimètres');

  // Node n'a pas de Web Bluetooth : c'est exactement le cas « pas d'imprimante ».
  // L'aperçu doit malgré tout annoncer avec quel profil il compose.
  assert.match(registry.get('profile-hint').textContent, /sans imprimante connectée/);
  assert.match(registry.get('profile-hint').textContent, /D110/);
});

test('le décalage d\'impression est câblé, sans effet au départ', () => {
  // Le DOM factice ne lit pas les attributs du HTML : la valeur par défaut est
  // vérifiée dans test/web.test.js, sur le fichier réel. Ici on s'assure que le
  // champ est bien celui qu'app.js interroge — une valeur vide vaut zéro.
  for (const id of ['sheet-offset-x', 'sheet-offset-y']) {
    assert.equal(registry.get(id).value, '', `${id} n'est pas initialisé par app.js`);
  }
});

test('aucun lien : les exports et l\'effacement sont désactivés', () => {
  for (const id of ['export-csv', 'export-md', 'export-json', 'clear', 'print']) {
    assert.equal(registry.get(id).disabled, true, `${id} devrait être désactivé`);
  }
});

test('la collection vide affiche une aide', () => {
  const empty = registry.get('empty');
  assert.equal(empty.hidden, false);
  assert.match(empty.textContent, /Aucun lien/);
});

test('le mode planche est actif par défaut', () => {
  const preview = registry.get('preview');
  assert.equal(preview.children.length, 1, 'un message d\'aide doit occuper l\'aperçu');
  assert.equal(preview.children[0].tagName, 'P');
});

test('Web Bluetooth absent : la connexion est désactivée et expliquée', () => {
  // Node n'expose pas `navigator.bluetooth` : c'est exactement le cas de Safari
  // ou d'un Brave non configuré.
  const connect = registry.get('connect');
  assert.equal(connect.disabled, true);
  assert.equal(registry.get('ble-support').hidden, false);
  assert.match(registry.get('ble-support').textContent, /Safari|brave:\/\/flags/);
});

// ---------------------------------------------------------------------------
// Raccourcissement et cible du QR code
// ---------------------------------------------------------------------------

/** Les options d'un `<select>` du DOM factice, sous forme de paires. */
function options(id) {
  return registry.get(id).children.map((option) => [option.value, option.textContent]);
}

test('les services de raccourcissement sont proposés dès le démarrage', () => {
  const choices = options('shortener');
  assert.ok(choices.length >= 3, `${choices.length} service(s)`);
  for (const [value, label] of choices) {
    assert.ok(value, 'chaque service porte un identifiant');
    assert.ok(label, 'chaque service porte un nom lisible');
  }
  // Le service retenu par défaut est appliqué avant le premier rendu.
  assert.equal(registry.get('shortener').value, 'tinyurl');
});

test('le QR vise l\'URL collectée, et le raccourci reste hors de portée', () => {
  assert.deepEqual(
    options('qr-target'),
    [['original', "L'URL collectée"], ['short', 'Le lien raccourci']],
  );
  assert.equal(registry.get('qr-target').value, 'original');

  // Sans aucun raccourci en place, le choix n'est pas proposé : rien ne doit
  // pouvoir être imprimé avec un lien que l'utilisateur n'a pas vérifié.
  const shortOption = registry.get('qr-target').children.find((o) => o.value === 'short');
  assert.equal(shortOption.disabled, true);
  assert.match(registry.get('target-hint').textContent, /URL collectée/);
});

test('aucun raccourcissement n\'est déclenché de lui-même', () => {
  // Le stockage est vide et le bouton est inactif : ouvrir l'application ne
  // contacte aucun service tiers.
  assert.equal(registry.get('shorten').disabled, true);
  assert.equal(registry.get('shorten-clear').hidden, true);
  assert.equal(registry.get('shorten-status').textContent, '');
});

test('la planche se règle par une seule présentation, sans mode', () => {
  // Il n'y a plus de sélecteur de mode : ni « Cotes de la référence », ni
  // « Colonnes et rangées ». La grille, les marges et les écarts sont toujours
  // visibles, et la taille en découle. Le mode « cotes de la référence »
  // masquait les champs — d'où l'incompréhension.
  assert.equal(registry.has('sheet-fit-mode'), false, 'aucun sélecteur de mode ne doit subsister');
  assert.equal(registry.get('sheet-fit-mode'), undefined);

  for (const id of [
    'sheet-columns', 'sheet-rows',
    'sheet-margin-x', 'sheet-margin-y',
    'sheet-gap-x', 'sheet-gap-y',
  ]) {
    const field = registry.get(id);
    assert.ok(field, `${id} doit exister`);
    assert.notEqual(field.value, '', `${id} doit être prérempli au démarrage`);
  }
});

test('la phrase annonce la taille déduite, dès le démarrage', () => {
  // Elle doit être là **avant** le premier lien : c'est au moment où l'on règle
  // la planche qu'on a besoin de la comprendre.
  const hint = registry.get('sheet-fit-hint').textContent;
  assert.match(hint, /déduite de ces six valeurs/, `phrase : « ${hint} »`);
  assert.match(hint, /par feuille/);
  assert.match(hint, /\d+,\d+ × \d+,\d+ mm/, `cotes à la française : « ${hint} »`);
  assert.equal(/Décalage appliqué/.test(hint), false, 'aucun décalage au départ');
});

test('les colonnes du tableau sont choisies une par une', () => {
  const boxes = {
    index: 'table-col-index', qr: 'table-col-qr', url: 'table-col-url',
    title: 'table-col-title', tags: 'table-col-tags', note: 'table-col-note',
  };
  for (const id of Object.values(boxes)) {
    assert.ok(registry.get(id), `${id} doit exister`);
  }

  // Les valeurs par défaut vivent dans le HTML — le DOM de substitution ne lit
  // pas les attributs `checked`. Elles sont vérifiées dans test/web.test.js,
  // sur le fichier réel ; ici on contrôle le câblage.
  assert.equal(registry.get('table-col-tags').checked, false, 'aucun tag : case décochée');
  assert.equal(registry.get('table-col-note').checked, false, 'aucune note : case décochée');
});

test('tags et note ne sont proposés que si la collection en contient', () => {
  // Règle demandée : ne pas proposer une colonne qu'aucun lien ne peut remplir.
  // Au démarrage la collection est vide : les deux cases sont inertes.
  assert.equal(registry.get('table-col-tags').disabled, true);
  assert.equal(registry.get('table-col-note').disabled, true);

  const hint = registry.get('table-hint').textContent;
  assert.match(hint, /bouton ✎/, `la phrase doit dire comment les activer : « ${hint} »`);
});

test('la grille du tableau peut être masquée', () => {
  // Le DOM de substitution ne lit pas les attributs : la valeur par défaut est
  // vérifiée dans test/web.test.js. Ici, on s'assure que l'interrupteur existe
  // et qu'il est branché (une case absente ferait échouer le démarrage).
  assert.ok(registry.get('table-grid'), 'la case « Grille et bordures » doit exister');
  assert.equal(registry.get('table-grid').checked, false, 'le DOM de substitution part décoché');
});

test('une case maîtresse commande la sélection', () => {
  // Deux boutons « Tout » et « Rien » disaient la même chose en deux objets, et
  // aboutissaient au même résultat à l'impression — une sélection vide valant
  // « tout ». Une seule case, qui montre son état, dit la même chose mieux.
  assert.ok(registry.get('select-all-box'), 'la case maîtresse doit exister');
  assert.equal(registry.has('select-all'), false, 'plus de bouton « tout cocher »');
  assert.equal(registry.has('select-none'), false, 'plus de bouton « tout décocher »');

  // Collection vide au démarrage : la case est inerte, et rien à annoncer.
  assert.equal(registry.get('select-all-box').disabled, true);
  assert.equal(registry.get('select-all-box').checked, false);
  assert.equal(registry.get('select-all-box').indeterminate, false);
  assert.equal(registry.get('selection-hint').textContent, '');
  assert.equal(registry.get('print').textContent, 'Imprimer');
});
