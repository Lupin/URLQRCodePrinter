/**
 * Tests du versionnement des ressources construites.
 *
 * Un navigateur peut servir un `style.css` gardé en cache alors que le HTML et
 * les scripts sont à jour. Le résultat est trompeur : les nouveaux réglages
 * apparaissent, mais la mise en page reste celle du build précédent. C'est
 * arrivé — une planche s'affichait en une seule colonne, curseur de largeur du
 * QR sans effet, alors que le correctif était bien sur le disque.
 *
 * La parade est une empreinte du contenu dans l'URL. Ces tests vérifient que
 * l'empreinte est bien présente **et qu'elle correspond au fichier livré** : une
 * empreinte figée ou recopiée ne servirait à rien.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Pages construites, avec le dossier où lire leurs ressources. */
/**
 * Pages construites, avec le dossier où lire leurs ressources et les fichiers
 * qui doivent y être versionnés.
 *
 * La fenêtre de l'extension est dans la liste, et pas seulement la page de
 * l'application : elle a exactement le même problème de cache, et il est même
 * plus visible — recharger l'extension ne change pas l'URL de `popup.css`. Cette
 * page a été oubliée ici, si bien que le garde-fou existait sans couvrir le cas
 * qui allait se produire : les couleurs de la fenêtre semblaient ne pas avoir
 * été appliquées alors que le disque était à jour.
 */
const PAGES = [
  { label: 'extension/app', page: join(ROOT, 'dist', 'extension', 'app.html'), assets: ['style.css', 'app.js'] },
  { label: 'extension/fenêtre', page: join(ROOT, 'dist', 'extension', 'popup.html'), assets: ['popup.css', 'popup.js'] },
  {
    label: 'extension-safari/app',
    page: join(ROOT, 'dist', 'extension-safari', 'app.html'),
    assets: ['style.css', 'app.js'],
  },
  {
    label: 'extension-safari/fenêtre',
    page: join(ROOT, 'dist', 'extension-safari', 'popup.html'),
    assets: ['popup.css', 'popup.js'],
  },
  { label: 'web', page: join(ROOT, 'dist', 'web', 'index.html'), assets: ['style.css', 'app.js'] },
];

/** Empreinte attendue pour un fichier livré. */
function digestOf(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12);
}

/** Toutes les références `fichier?v=empreinte` d'une page. */
function stampedReferences(html) {
  return [...html.matchAll(/([\w.-]+\.(?:css|js))\?v=([0-9a-f]{12})/g)]
    .map((match) => ({ file: match[1], digest: match[2] }));
}

for (const { label, page, assets } of PAGES) {
  const dir = dirname(page);

  test(`${label} : l'empreinte des ressources correspond au contenu livré`, () => {
    if (!existsSync(page)) {
      assert.fail(`${page} est absent : lancez « npm run build » avant les tests.`);
    }
    const html = readFileSync(page, 'utf8');
    const refs = stampedReferences(html);

    for (const file of assets) {
      const found = refs.find((ref) => ref.file === file);
      assert.ok(found, `${label} : ${file} n'est pas versionné`);
      assert.equal(
        found.digest,
        digestOf(join(dir, file)),
        `${label} : l'empreinte de ${file} ne correspond pas au fichier livré`,
      );
    }
  });

  test(`${label} : aucune ressource n'est référencée sans empreinte`, () => {
    const html = readFileSync(page, 'utf8');
    // Une référence nue serait reservie depuis le cache : c'est précisément ce
    // qu'on veut empêcher.
    const bare = [...html.matchAll(/(?:href|src)="([\w.-]+\.(?:css|js))"/g)]
      .map((match) => match[1]);
    assert.deepEqual(bare, [], `${label} : références sans empreinte`);
  });
}

test('deux constructions différentes produisent des empreintes différentes', () => {
  // L'extension est assemblée en fichiers uniques, l'application web reste en
  // modules : les deux `app.js` diffèrent, donc leurs empreintes aussi.
  const extension = readFileSync(join(ROOT, 'dist', 'extension', 'app.html'), 'utf8');
  const web = readFileSync(join(ROOT, 'dist', 'web', 'index.html'), 'utf8');
  const digest = (html) => stampedReferences(html).find((ref) => ref.file === 'app.js').digest;
  assert.notEqual(digest(extension), digest(web));
});

test('l\'empreinte change dès que la feuille de style change', () => {
  // Vérification du mécanisme lui-même : deux contenus différents donnent deux
  // empreintes différentes. C'est ce qui garantit qu'un correctif de style
  // produit une nouvelle URL, donc un nouveau téléchargement.
  const one = createHash('sha256').update('a { color: red }').digest('hex').slice(0, 12);
  const two = createHash('sha256').update('a { color: blue }').digest('hex').slice(0, 12);
  assert.notEqual(one, two);
});

// ---------------------------------------------------------------------------
// Ce qui empêche Chrome de charger l'extension
// ---------------------------------------------------------------------------

test("aucun livrable ne contient de nom réservé ni de doublon de copie", () => {
  // Chrome refuse de charger un dossier dont un nom commence par `_` s'il n'est
  // pas exactement `_locales`. Un `_locales 2` — créé en copiant un dossier dans
  // un dossier qui le contenait déjà — rend l'extension **entièrement**
  // inchargeable, avec un message qui ne dit pas d'où vient le dossier.
  for (const nom of ['extension', 'extension-safari']) {
    const racine = join(ROOT, 'dist', nom);
    const coupables = [];

    const parcourir = (dir, prefixe = '') => {
      for (const entree of readdirSync(dir, { withFileTypes: true })) {
        const chemin = `${prefixe}${entree.name}`;
        if (/ 2(\.[^.]+)?$/.test(entree.name)) {
          coupables.push(`${nom}/${chemin} — doublon de copie`);
        }
        if (entree.name.startsWith('_') && entree.name !== '_locales') {
          coupables.push(`${nom}/${chemin} — nom réservé, Chrome refusera le dossier`);
        }
        if (entree.isDirectory()) parcourir(join(dir, entree.name), `${chemin}/`);
      }
    };
    parcourir(racine);

    assert.deepEqual(coupables, [], `l'extension ne se chargera pas :\n${coupables.join('\n')}`);
  }
});
