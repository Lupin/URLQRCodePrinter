/**
 * Lecture d'une `const` avant sa déclaration.
 *
 * En JavaScript, une `const` lue avant sa ligne ne vaut pas `undefined` : elle
 * lève une `ReferenceError`. La faute est silencieuse à la lecture — les deux
 * lignes sont correctes prises séparément — et elle ne se voit qu'à
 * l'exécution, sur un écran vide.
 *
 * C'est arrivé : `indexLignes` lisait `veutIndex` quarante lignes avant sa
 * déclaration, et `buildSheetPages` s'arrêtait là. La planche d'étiquettes
 * restait vierge, sans message. Aucun test ne l'a vu, parce que le seul test
 * qui exécute cette fonction part d'une collection vide et sort avant de
 * l'atteindre.
 *
 * Ce fichier ferme la classe entière : il lit le source, suit la profondeur des
 * accolades, et signale toute `const` lue dans la **même portée** avant sa
 * déclaration.
 *
 * Ce qui n'est **pas** signalé, volontairement :
 *
 * - une lecture depuis une portée plus profonde. `const f = () => X;` avant
 *   `const X = 1;` est légal dès lors que `f` est appelée après — c'est le
 *   schéma normal d'une fermeture, et le signaler noierait le vrai défaut.
 * - une lecture depuis une portée plus haute. Elle ne peut pas viser la même
 *   liaison.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Retire commentaires et littéraux de chaîne.
 *
 * Sans cela, une accolade dans un commentaire faussait la profondeur, et un nom
 * cité dans une phrase passait pour une lecture.
 *
 * @param {string} source
 * @returns {string}
 */
function sansBruit(source) {
  // Chaque remplacement **conserve les retours à la ligne** : sans cela, un
  // commentaire de bloc ou un gabarit multiligne décalait toute la suite, et
  // les numéros de ligne signalés ne désignaient plus rien.
  const espaces = (texte) => texte.replace(/[^\n]/g, ' ');
  return source
    .replace(/\/\*[\s\S]*?\*\//g, espaces)
    .replace(/`(?:[^`\\]|\\.)*`/g, espaces)
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}

/**
 * Relève les lectures d'une `const` faites avant sa déclaration, dans la même
 * portée.
 *
 * @param {string} source
 * @returns {string[]} descriptions lisibles, une par défaut
 */
export function lecturesAvantDeclaration(source) {
  const lignes = sansBruit(source).split('\n');
  const defauts = [];

  // `enCours` : par portée (profondeur d'accolade), les `const` déclarées.
  // Une portée est identifiée par son numéro de ligne d'ouverture, ce qui la
  // distingue de toute autre portée de même profondeur.
  /** @type {Map<number, Map<string, number>>} */
  const parPortee = new Map();
  /** @type {{ nom: string, ligne: number, profondeur: number, portee: number }[]} */
  const declarations = [];
  /** @type {{ nom: string, ligne: number, profondeur: number, portee: number }[]} */
  const lectures = [];

  const pile = [{ ouverture: 0 }];
  let profondeur = 0;

  for (let index = 0; index < lignes.length; index++) {
    const ligne = lignes[index];
    const numero = index + 1;
    const portee = pile[pile.length - 1].ouverture;

    // Déclarations de la ligne, avant de compter ses accolades.
    for (const [, nom] of ligne.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/g)) {
      declarations.push({ nom, ligne: numero, profondeur, portee });
      if (!parPortee.has(portee)) parPortee.set(portee, new Map());
      parPortee.get(portee).set(nom, numero);
    }

    // Lectures : tout identifiant, hors mot-clé et hors nom déclaré.
    // `(?!\s*:)` écarte les clés d'objet — `{ x: qrX, y: qrTop }` n'est pas
    // une lecture de `y`. On perd une lecture dans un ternaire, ce qui est un
    // faux négatif : mieux vaut manquer un cas que crier au loup.
    for (const [, nom] of ligne.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)(?!\s*:)/g)) {
      lectures.push({ nom, ligne: numero, profondeur, portee });
    }

    for (const caractere of ligne) {
      if (caractere === '{') {
        profondeur += 1;
        pile.push({ ouverture: numero });
      } else if (caractere === '}') {
        profondeur -= 1;
        if (pile.length > 1) pile.pop();
      }
    }
  }

  for (const lecture of lectures) {
    const table = parPortee.get(lecture.portee);
    if (!table || !table.has(lecture.nom)) continue;
    const declaration = table.get(lecture.nom);
    if (lecture.ligne >= declaration) continue;
    // Une lecture plus profonde que sa déclaration est une fermeture : légale.
    const ou = declarations.find((d) => d.nom === lecture.nom && d.ligne === declaration);
    if (ou && lecture.profondeur > ou.profondeur) continue;
    // Une fermeture peut lire une constante déclarée plus bas : elle ne
    // s'exécute qu'après. On reconnaît sa ligne à `=>` ou `function`.
    if (/=>|\bfunction\b/.test(lignes[lecture.ligne - 1])) continue;
    defauts.push(
      `ligne ${lecture.ligne} : « ${lecture.nom} » est lu avant sa déclaration ligne ${declaration}`,
    );
  }

  return [...new Set(defauts)];
}

// ---------------------------------------------------------------------------
// Le balayage
// ---------------------------------------------------------------------------

const FICHIERS = [
  join(ROOT, 'src', 'web', 'app.js'),
  join(ROOT, 'src', 'extension-src', 'popup.js'),
  join(ROOT, 'src', 'extension-src', 'background.js'),
  join(ROOT, 'src', 'core', 'sheet.js'),
  join(ROOT, 'src', 'core', 'label.js'),
];

for (const fichier of FICHIERS) {
  const nom = fichier.slice(ROOT.length + 1);

  test(`${nom} : aucune const lue avant sa déclaration`, () => {
    const defauts = lecturesAvantDeclaration(readFileSync(fichier, 'utf8'));
    assert.deepEqual(defauts, [], `lectures avant déclaration :\n${defauts.join('\n')}`);
  });
}

// ---------------------------------------------------------------------------
// Le détecteur doit détecter
// ---------------------------------------------------------------------------

test('le détecteur attrape la régression qui a laissé la planche vierge', () => {
  // Le code exact qui est parti en production : la lecture quarante lignes
  // au-dessus de la déclaration.
  const coupe = `
function buildSheetPages(items) {
  const indexLignes = veutIndex ? 1 : 0;
  const bornes = (lignes) => lignes + indexLignes;
  const veutIndex = el.sheetDateIndex.checked;
  return bornes(1);
}
`;
  const defauts = lecturesAvantDeclaration(coupe);
  assert.equal(defauts.length, 1, `attendu 1 défaut, obtenu : ${JSON.stringify(defauts)}`);
  assert.match(defauts[0], /veutIndex/);
});

test('le détecteur laisse passer une fermeture, qui est légale', () => {
  // `f` est définie avant `X`, mais appelée après : c'est le schéma normal.
  const legal = `
function exemple() {
  const f = () => X + 1;
  const X = 2;
  return f();
}
`;
  assert.deepEqual(lecturesAvantDeclaration(legal), []);
});

test('le détecteur ne se laisse pas tromper par un commentaire', () => {
  const avecCommentaire = `
function exemple() {
  // veutIndex sera lu plus bas, quand il existera.
  const indexLignes = veutIndex ? 1 : 0;
  const veutIndex = true;
  return indexLignes;
}
`;
  const defauts = lecturesAvantDeclaration(avecCommentaire);
  assert.equal(defauts.length, 1, 'le commentaire ne doit ni masquer ni créer un défaut');
  assert.match(defauts[0], /veutIndex/);
});
