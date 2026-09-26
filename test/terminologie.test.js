/**
 * Terminologie : « QR Code », jamais « QR » seul.
 *
 * Le produit employait les deux formes, et souvent la mauvaise : « Largeur du
 * QR », « Sous le QR », « Tableur + QR », un en-tête de colonne « QR », et un
 * nom d'image « QR 3 » dans le classeur. Un sigle seul ne dit pas de quoi il
 * parle à qui découvre l'extension, et l'utilisateur qui lit « Taille du QR »
 * doit deviner que c'est la taille du code, pas celle de l'étiquette.
 *
 * Deux formes restent légitimes, et le test les distingue :
 *
 * - **`QR-Code`**, avec un trait d'union : c'est la forme que prend le titre
 *   dans un nom de fichier exporté (« Mes-liens-QR-Code-20250115-1130.csv »).
 *   Le tiret vient du titre, pas de la terminologie.
 * - Le **nom du produit**, `URLQRCodePrinter`, qui n'est pas concerné : la
 *   casse interne fait qu'il ne correspond pas au motif.
 *
 * Le contrôle porte sur les fichiers entiers, commentaires compris : la
 * vocabulaire d'un projet se lit aussi dans ses commentaires, et une exception
 * « sauf dans les commentaires » est exactement le genre de faille par laquelle
 * l'ancienne forme revient.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * « QR » qui ne désigne pas le code.
 *
 * Suivi d'un espace ou d'un tiret, puis de « Code » ou « Codes », il est
 * correct. `QR_COLUMN_INDEX` ou `.print-cell__qr` ne correspondent pas : le
 * caractère qui suit n'est ni une espace ni un tiret.
 */
const SIGLE_SEUL = /\bQR\b(?![\s-]+Codes?\b)/;

/** Tous les fichiers d'une arborescence, sans descendre dans les exclues. */
function fichiers(dossier, extensions) {
  const trouves = [];
  const parcourir = (chemin) => {
    for (const nom of readdirSync(chemin)) {
      const complet = join(chemin, nom);
      if (statSync(complet).isDirectory()) {
        if (nom === 'archive' || nom === 'node_modules') continue;
        parcourir(complet);
      } else if (extensions.some((e) => nom.endsWith(e))) {
        trouves.push(complet);
      }
    }
  };
  parcourir(join(ROOT, dossier));
  return trouves;
}

/** Les surfaces dont le texte est lu par un utilisateur, ou par un examinateur. */
const SURFACES = [
  ...fichiers('src/core', ['.js']),
  ...fichiers('src/web', ['.js', '.html', '.css']),
  ...fichiers('src/extension-src', ['.js', '.html', '.css', '.json']),
  ...fichiers('src/site', ['.html', '.css']),
  join(ROOT, 'store', 'listing.json'),
  join(ROOT, 'docs', 'chrome-web-store.md'),
  join(ROOT, 'docs', 'guide.md'),
  join(ROOT, 'docs', 'guide.fr.md'),
  join(ROOT, 'README.md'),
  join(ROOT, 'README.fr.md'),
  join(ROOT, 'CONTRIBUTING.md'),
];

test('aucun texte ne dit « QR » là où il parle du QR Code', () => {
  const manquements = [];
  for (const fichier of SURFACES) {
    const lignes = readFileSync(fichier, 'utf8').split('\n');
    lignes.forEach((ligne, index) => {
      if (SIGLE_SEUL.test(ligne)) {
        manquements.push(`${fichier.slice(ROOT.length + 1)}:${index + 1} — ${ligne.trim().slice(0, 90)}`);
      }
    });
  }
  assert.deepEqual(manquements, [], `sigle seul employé :\n  ${manquements.join('\n  ')}`);
});

test('la fiche du magasin emploie la même terminologie que le produit', () => {
  // C'est la surface qu'un examinateur lit avant d'installer. Une fiche qui dit
  // « QR » quand la fenêtre dit « QR Code » est un écart visible, du même genre
  // que celui qui a valu un rejet pour bourrage de mots clés.
  const fiche = JSON.parse(readFileSync(join(ROOT, 'store', 'listing.json'), 'utf8'));
  assert.doesNotMatch(fiche.summary.fr, SIGLE_SEUL);
  assert.doesNotMatch(fiche.summary.en, SIGLE_SEUL);
  assert.doesNotMatch(fiche.description.fr, SIGLE_SEUL);
  assert.doesNotMatch(fiche.description.en, SIGLE_SEUL);
  assert.doesNotMatch(fiche.singlePurpose, SIGLE_SEUL);
});

test('le manifeste annonce le produit avec la même terminologie', () => {
  // Cette description est celle que le magasin affiche : elle doit dire la même
  // chose que la fiche et que l'interface.
  for (const langue of ['fr', 'en']) {
    const chemin = join(ROOT, 'src', 'extension-src', '_locales', langue, 'messages.json');
    const messages = JSON.parse(readFileSync(chemin, 'utf8'));
    for (const [cle, entree] of Object.entries(messages)) {
      assert.doesNotMatch(entree.message, SIGLE_SEUL, `${langue} / ${cle} : « ${entree.message} »`);
    }
  }
});

test('les fichiers produits nomment le QR Code en entier', () => {
  // Ces chaînes sortent du produit : en-tête de colonne d'un CSV, d'un classeur
  // ou d'une page HTML, nom d'image dans un .xlsx, libellé de disposition. Une
  // fois le fichier exporté, plus rien ne permet de corriger le vocabulaire.
  const spreadsheet = readFileSync(join(ROOT, 'src/core/spreadsheet.js'), 'utf8');
  assert.match(spreadsheet, /export const SPREADSHEET_HEADERS = \[[^\]]*'QR Code'\]/);

  const table = readFileSync(join(ROOT, 'src/core/table-export.js'), 'utf8');
  assert.match(table, /\{ key: 'qr', label: 'QR Code' \}/);

  const xlsx = readFileSync(join(ROOT, 'src/core/xlsx.js'), 'utf8');
  assert.match(xlsx, /name="QR Code \$\{index \+ 1\}"/);
  assert.match(xlsx, /descr="QR Code du lien"/);

  const sheet = readFileSync(join(ROOT, 'src/core/sheet.js'), 'utf8');
  assert.doesNotMatch(sheet, SIGLE_SEUL);
});

test('les dispositions et les messages d\'étiquette nomment le QR Code en entier', () => {
  const label = readFileSync(join(ROOT, 'src/core/label.js'), 'utf8');
  assert.match(label, /label: 'Réparti \(QR Code en haut, texte en bas\)'/);

  // Les messages d'erreur d'impression sont lus au moment où l'étiquette ne
  // sort pas : c'est le pire moment pour un sigle ambigu.
  assert.match(label, /"QR Code trop dense/);
  assert.match(label, /"URL trop longue : le QR Code fait \{size\} px/);

  const app = readFileSync(join(ROOT, 'src/web/app.js'), 'utf8');
  assert.match(app, /'QR Code de \{side\} mm/);
  assert.match(app, /'Le QR Code seul, sans texte sous lui\.'/);
});
