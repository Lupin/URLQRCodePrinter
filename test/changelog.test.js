/**
 * Le journal des versions, et la note qui en sort.
 *
 * Le fichier sert deux lecteurs à la fois : quelqu'un qui veut savoir ce qui a
 * changé, et `scripts/preparer-soumission.mjs`, qui en tire la note « What's
 * new » déposée sur le Chrome Web Store. Le second ne pardonne pas l'à-peu-près :
 * une version sans entrée part **sans note**, et un balisage oublié se retrouve
 * tel quel dans un champ en texte brut.
 *
 * Ce fichier tient donc les deux bouts : la forme du journal (mêmes versions des
 * deux côtés, entrées non vides, catégories de Keep a Changelog), et la mise à
 * plat qui alimente la feuille de soumission.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { noteDeVersion } from '../scripts/preparer-soumission.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EN = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
const FR = readFileSync(join(ROOT, 'CHANGELOG.fr.md'), 'utf8');
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'src', 'extension-src', 'manifest.template.json'), 'utf8'),
);

/**
 * Les versions annoncées par un journal, dans l'ordre du fichier.
 *
 * La section de travail en cours porte un nom dans chaque langue : on la ramène
 * à un jeton commun, sans quoi les deux journaux sembleraient diverger.
 */
function versions(source) {
  return [...source.matchAll(/^## \[([^\]]+)\]/gm)]
    .map((trouve) => (trouve[1] === 'Non publié' ? 'Unreleased' : trouve[1]));
}

/** Les catégories de Keep a Changelog, dans les deux langues. */
const CATEGORIES = ['Added', 'Changed', 'Fixed', 'Removed', 'Security',
  'Ajouté', 'Modifié', 'Corrigé', 'Retiré', 'Sécurité'];

// ---------------------------------------------------------------------------

test('les deux journaux annoncent les mêmes versions, dans le même ordre', () => {
  // Un décalage entre les deux langues laisserait une version documentée d'un
  // seul côté : la note anglaise ou la française manquerait au dépôt.
  assert.deepEqual(versions(FR), versions(EN));
  assert.ok(versions(EN).length >= 2, 'au moins la version publiée et la suivante');
});

test('la version empaquetée a son entrée, des deux côtés', () => {
  const version = MANIFEST.version;
  for (const [langue, source] of [['anglais', EN], ['français', FR]]) {
    assert.ok(
      versions(source).includes(version),
      `aucune entrée ${version} dans le journal ${langue}`,
    );
  }
});

test('chaque version est datée, sauf la première', () => {
  // La date est celle du dépôt. La plus ancienne n'a pas été consignée à
  // l'époque : elle reste sans date plutôt que d'en inventer une.
  const lignes = [...EN.matchAll(/^## \[([^\]]+)\](.*)$/gm)];
  for (const [, version, reste] of lignes) {
    if (version === 'Unreleased' || version === 'Non publié') continue;
    const derniere = lignes.at(-1)[1];
    if (version === derniere) {
      assert.equal(reste.trim(), '', `${version} : la première version ne porte pas de date inventée`);
      continue;
    }
    assert.match(reste, /^\s*-\s*\d{4}-\d{2}-\d{2}\s*$/, `${version} doit porter une date AAAA-MM-JJ`);
  }
});

test('chaque entrée est catégorisée, et non vide', () => {
  for (const [langue, source] of [['anglais', EN], ['français', FR]]) {
    for (const version of versions(source)) {
      if (version === 'Unreleased' || version === 'Non publié') continue;
      const note = noteDeVersion(source, version, { espaceInsensible: langue === 'français' });
      assert.ok(note && note.length > 200, `entrée ${version} (${langue}) trop courte : ${note?.length}`);
      assert.match(note, /\n[A-Za-zÀ-ÿ]+ ?:/, `entrée ${version} (${langue}) sans catégorie`);
    }
  }
});

test('les catégories employées sont celles de Keep a Changelog', () => {
  // Le journal est lu par une machine : une catégorie inventée passerait dans le
  // champ brut sans que personne ne s'en aperçoive.
  for (const [langue, source] of [['anglais', EN], ['français', FR]]) {
    for (const [, titre] of source.matchAll(/^### (.+)$/gm)) {
      const connu = CATEGORIES.includes(titre.trim())
        || /^(What does not change|Ce qui ne change pas)$/.test(titre.trim());
      assert.ok(connu, `catégorie inconnue dans le journal ${langue} : « ${titre} »`);
    }
  }
});

test('la note rendue est du texte brut', () => {
  // Le champ « What's new » du portail n'interprète rien : un `**` ou un titre
  // Markdown y apparaîtrait tel quel.
  for (const [source, options] of [
    [EN, {}],
    [FR, { espaceInsensible: true }],
  ]) {
    const note = noteDeVersion(source, MANIFEST.version, options);
    for (const motif of [/\*\*/, /^#/m, /\]\(/, /`/]) {
      assert.doesNotMatch(note, motif, `balisage restant : ${motif}`);
    }
    // Les puces et la ponctuation française survivent à la mise à plat.
    assert.match(note, /^- /m, 'les puces sont conservées');
  }
  // La ponctuation française et les accents se lisent sur une entrée qui porte
  // une catégorie « Ajouté ». Celle de la version empaquetée n'en a pas
  // forcément : une version de correction ne corrige rien d'autre, et lui en
  // faire porter une pour satisfaire ce contrôle écrirait une note fausse.
  const AVEC_AJOUT = '0.2.0';
  assert.match(noteDeVersion(FR, AVEC_AJOUT, { espaceInsensible: true }), /^Ajouté :$/m);
  assert.match(noteDeVersion(EN, AVEC_AJOUT), /^Added:$/m);
});

test('une version sans entrée rend `null`, plutôt qu\'une note vide', () => {
  // L'appelant écrit alors ce qui manque ; une note vide déposée sans le dire
  // serait le pire des deux.
  assert.equal(noteDeVersion(EN, '9.9.9'), null);
  assert.equal(noteDeVersion(EN, ''), null);
  assert.equal(noteDeVersion(null, '0.2.0'), null);
  // Le point du numéro n'est pas un joker : « 0x2x0 » ne doit rien trouver.
  assert.equal(noteDeVersion(EN, '0.2'), null);
});

test('l\'entrée d\'une version s\'arrête à la suivante', () => {
  // Le journal est ordonné du plus récent au plus ancien : une entrée qui
  // déborderait sur la suivante déposerait deux versions dans une note.
  const note = noteDeVersion(EN, MANIFEST.version);
  const suivante = versions(EN)[versions(EN).indexOf(MANIFEST.version) + 1];
  assert.doesNotMatch(note, new RegExp(`\\[${suivante.replace(/\./g, '\\.')}\\]`));
});
