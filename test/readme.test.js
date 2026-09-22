/**
 * Les deux README racontent-ils la même chose ?
 *
 * Le dépôt tient sa documentation en deux langues, et rien n'empêche une
 * section de n'exister que d'un côté : le lecteur anglophone aurait alors un
 * outil sans auteur, ou un décompte de tests périmé dans une seule langue. Ces
 * quelques vérifications sont le seul mécanisme qui l'empêche.
 *
 * Le décompte mérite son contrôle arithmétique : un total qui ne correspond plus
 * à la somme de ses parties est faux, et c'est exactement ainsi qu'un « 723
 * tests » a survécu à plusieurs centaines de tests ajoutés.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EN = readFileSync(join(ROOT, 'README.md'), 'utf8');
const FR = readFileSync(join(ROOT, 'README.fr.md'), 'utf8');

/** Extrait un nombre, ou échoue en nommant ce qui manque. */
function nombre(texte, motif) {
  const found = texte.match(motif);
  assert.ok(found, `décompte introuvable : ${motif}`);
  // Le motif peut porter une alternance de langues : le nombre est alors dans
  // l'un ou l'autre groupe.
  const valeur = found.slice(1).find((groupe) => groupe !== undefined);
  return Number(valeur);
}

test('les deux README racontent l\'origine du projet', () => {
  assert.match(EN, /^## Why this exists$/m, 'section d\'origine absente de README.md');
  assert.match(FR, /^## Pourquoi ce projet$/m, 'section d\'origine absente de README.fr.md');

  for (const [langue, texte] of [['anglais', EN], ['français', FR]]) {
    // Le détail concret est ce qui distingue un récit d'un argumentaire.
    assert.match(texte, /Niimbot/, `détail concret absent du README ${langue}`);
    assert.match(texte, /- Gaël A\.G\. -/, `signature absente du README ${langue}`);
  }
});

test('le récit précède l\'état du projet, dans les deux langues', () => {
  // L'origine est une accroche, pas une annexe : elle se lit avant les tableaux
  // d'avancement, sinon elle ne sert qu'à qui a déjà tout lu.
  assert.ok(
    EN.indexOf('## Why this exists') < EN.indexOf('## Where the project stands'),
    'le récit doit précéder l\'état du projet dans README.md',
  );
  assert.ok(
    FR.indexOf('## Pourquoi ce projet') < FR.indexOf('## Où en est le projet'),
    'le récit doit précéder l\'état du projet dans README.fr.md',
  );
});

test('les deux README annoncent les mêmes décomptes de tests', () => {
  const totalEn = nombre(EN, /\*\*(\d+) tests, all green\*\*/);
  const totalFr = nombre(FR, /\*\*(\d+) tests, tous verts\*\*/);
  assert.equal(totalEn, totalFr, 'totaux différents entre les deux README');

  const jsEn = nombre(EN, /(\d+) in JavaScript/);
  const jsFr = nombre(FR, /(\d+) en JavaScript/);
  assert.equal(jsEn, jsFr, 'décomptes JavaScript différents');

  const swiftEn = nombre(EN, /(\d+) in Swift/);
  const swiftFr = nombre(FR, /(\d+) en Swift/);
  assert.equal(swiftEn, swiftFr, 'décomptes Swift différents');

  // Le total doit être la somme de ses parties : un total figé ne veut rien dire.
  assert.equal(
    totalEn,
    jsEn + swiftEn,
    `le total annoncé (${totalEn}) ne correspond pas à ${jsEn} + ${swiftEn}`,
  );
});

test('la commande de test annonce les mêmes chiffres que la phrase', () => {
  // Deux endroits par README disent le nombre de tests. S'ils divergent, l'un
  // des deux est faux, et rien ne dit lequel.
  for (const [langue, texte] of [['anglais', EN], ['français', FR]]) {
    const found = texte.match(
      /npm run test:all\s+# (\d+) (?:tests )?JavaScript(?: tests)? \+ (\d+) (?:tests )?Swift(?: tests)?/,
    );
    assert.ok(found, `commande de test absente ou mal formée dans le README ${langue}`);

    const js = nombre(texte, /(\d+) in JavaScript|(\d+) en JavaScript/);
    const swift = nombre(texte, /(\d+) in Swift|(\d+) en Swift/);
    assert.equal(Number(found[1]), js, `JavaScript : ${found[1]} ici, ${js} plus haut (${langue})`);
    assert.equal(Number(found[2]), swift, `Swift : ${found[2]} ici, ${swift} plus haut (${langue})`);
  }
});
