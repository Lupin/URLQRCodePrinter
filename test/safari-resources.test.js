/**
 * Les ressources de l'appex Safari sont-elles le miroir exact de la construction ?
 *
 * `native/safari/…/Resources` est versionné parce que le projet Xcode le
 * référence : sans lui, un dépôt fraîchement cloné ne compile pas. Mais ce
 * dossier n'est qu'une **copie** de `dist/extension-safari`, produite par
 * `npm run sync:safari`. Rien n'oblige les deux à rester d'accord, et une
 * divergence ne se voit pas : l'extension Safari embarquerait un `app.js`
 * antérieur à la source, ou un fichier que plus personne ne produit.
 *
 * Réécrit après une perte accidentelle du fichier d'origine (nettoyage de
 * doublons iCloud ayant emporté des fichiers non commités). Le contrôle des
 * doublons macOS n'est pas décoratif : dans ce dépôt, iCloud en fabrique
 * réellement — « app 2.js », « style 2.css » — et ils se retrouvaient dans le
 * paquet dès que le dossier source en contenait.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'dist', 'extension-safari');
const TARGET = join(
  ROOT, 'native', 'safari', 'URLQRCodePrinter', 'Shared (Extension)', 'Resources',
);

if (!existsSync(SOURCE)) {
  throw new Error(`${SOURCE} est absent : lancez « npm run build » avant les tests.`);
}

/**
 * Les chemins de tous les fichiers d'un dossier, relatifs à lui.
 *
 * @param {string} dossier
 * @returns {string[]}
 */
function fichiers(dossier) {
  const trouves = [];
  const parcourir = (courant) => {
    for (const entree of readdirSync(courant, { withFileTypes: true })) {
      const chemin = join(courant, entree.name);
      if (entree.isDirectory()) parcourir(chemin);
      else trouves.push(relative(dossier, chemin));
    }
  };
  parcourir(dossier);
  return trouves.sort();
}

/**
 * Noms qu'un système de fichiers, ou un archivage, laisse derrière lui.
 *
 * `X 2.js` est la copie de conflit d'iCloud, `._X` la copie de ressource d'une
 * archive macOS, `.DS_Store` la mémoire d'affichage d'un dossier.
 */
const NOMS_PARASITES = [
  { motif: / \d+(\.[^./]+)?$/, quoi: 'copie de conflit (« app 2.js »)' },
  { motif: /^\._/, quoi: 'copie de ressource d\'archive (._fichier)' },
  { motif: /^\.DS_Store$/, quoi: 'mémoire d\'affichage de dossier' },
];

// ---------------------------------------------------------------------------

test('le miroir contient exactement les fichiers de la construction', () => {
  assert.ok(existsSync(TARGET), `ressources absentes : lancez « npm run sync:safari »`);
  const attendus = fichiers(SOURCE);
  const presents = fichiers(TARGET);

  const manquants = attendus.filter((nom) => !presents.includes(nom));
  const enTrop = presents.filter((nom) => !attendus.includes(nom));

  assert.deepEqual(
    manquants,
    [],
    `à copier : lancez « npm run sync:safari » — ${manquants.join(', ')}`,
  );
  // Une entrée en trop est aussi grave : Xcode embarquerait un fichier que la
  // construction ne produit pas — un doublon iCloud, ou un fichier renommé à la
  // main, qui survivrait à toutes les constructions suivantes.
  assert.deepEqual(
    enTrop,
    [],
    `à retirer de native/safari : ${enTrop.join(', ')} — lancez « npm run sync:safari »`,
  );
});

test('chaque fichier du miroir est identique, octet pour octet', async () => {
  assert.ok(existsSync(TARGET), `ressources absentes : lancez « npm run sync:safari »`);
  const divergents = [];
  for (const nom of fichiers(SOURCE)) {
    const cible = join(TARGET, nom);
    if (!existsSync(cible)) continue;
    const source = readFileSync(join(SOURCE, nom));
    let copie = readFileSync(cible);
    // **Un fichier de zéro octet n'est pas encore écrit.** iCloud crée le fichier
    // puis le remplit : une lecture qui tombe entre les deux voit 0 octet là où
    // la source en a des milliers, et le contrôle accuserait la copie d'une
    // divergence qui n'existe pas. On relit une fois, brièvement, plutôt que
    // d'échouer sur une course.
    if (copie.length === 0 && source.length > 0) {
      await new Promise((r) => setTimeout(r, 150));
      copie = readFileSync(cible);
    }
    if (!source.equals(copie)) divergents.push(nom);
  }
  assert.deepEqual(
    divergents,
    [],
    `le paquet Safari ne dit pas la même chose que la source : ${divergents.join(', ')}`,
  );
});

test('aucun nom parasite dans les ressources', () => {
  assert.ok(existsSync(TARGET), `ressources absentes : lancez « npm run sync:safari »`);
  const parasites = [];
  for (const nom of fichiers(TARGET)) {
    for (const { motif, quoi } of NOMS_PARASITES) {
      const base = nom.split('/').pop();
      if (motif.test(base)) parasites.push(`${nom} (${quoi})`);
    }
  }
  assert.deepEqual(
    parasites,
    [],
    `ces fichiers entreraient dans le paquet Safari : ${parasites.join(', ')}`,
  );
});

test('la source elle-même est propre, sinon la copie propage le défaut', () => {
  // Le défaut vu en vrai : iCloud fabrique « app 2.js » **dans dist/**, et
  // `sync:safari` copie le dossier tel quel. La construction repart de zéro
  // (`rm -rf dist`), donc la source redevient propre — ce contrôle dit quand ce
  // n'est plus le cas, avant que le paquet ne soit signé.
  const parasites = readdirSync(SOURCE).filter(
    (nom) => NOMS_PARASITES.some(({ motif }) => motif.test(nom)),
  );
  assert.deepEqual(
    parasites,
    [],
    `dist/extension-safari contient ${parasites.join(', ')} : relancez « npm run build »`,
  );
});

test('le manifeste du miroir est bien la variante Safari', () => {
  const manifeste = JSON.parse(readFileSync(join(TARGET, 'manifest.json'), 'utf8'));
  // `browser_specific_settings` est retirée de la variante Chromium : sa
  // présence est ce qui distingue les deux constructions. C'est aussi une copie
  // du manifeste, donc celle que le convertisseur d'Apple lira.
  assert.ok(manifeste.browser_specific_settings, 'le manifeste Safari a perdu ses réglages propres');
  assert.ok(Number(manifeste.manifest_version) >= 3);
  // La variante de l'extension ne doit pas embarquer le service worker en
  // module : le convertisseur d'Apple refuse `background.type`.
  assert.equal(manifeste.background?.type, undefined);
});

test('les ressources embarquées sont des fichiers, jamais des liens', () => {
  // Un lien symbolique dans le dossier versionné ferait échouer la signature du
  // paquet, ou embarquerait un fichier absent de la copie.
  const liens = [];
  for (const nom of fichiers(TARGET)) {
    if (statSync(join(TARGET, nom)).isSymbolicLink()) liens.push(nom);
  }
  assert.deepEqual(liens, [], `liens symboliques dans les ressources : ${liens.join(', ')}`);
});
