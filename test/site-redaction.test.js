/**
 * La rédaction des deux pages d'information publiques.
 *
 * Ces pages sont écrites à la main, dans deux langues, et rien ne les empêche de
 * diverger : une réserve ajoutée d'un côté seulement laisserait la page anglaise
 * promettre plus que la française. C'est le défaut que ce fichier surveille, avec
 * deux autres qui ne se voient qu'à la lecture :
 *
 * 1. **La parité.** Chaque section porte le même nombre de blocs des deux côtés.
 *    Le décompte attrape la ligne ajoutée dans une langue et oubliée dans
 *    l'autre, qui est exactement la façon dont les deux pages se mettent à
 *    raconter deux produits.
 * 2. **La typographie française.** Espace insécable avant `: ; ! ?` et à
 *    l'intérieur des guillemets « ». Le contrôle porte sur le texte **rendu**,
 *    balises retirées et entités résolues : c'est ce que le lecteur voit, et
 *    `&nbsp;` compte donc comme une espace insécable.
 * 3. **Les noms venus du produit.** Les imprimantes prises en charge et les
 *    services de raccourcissement cités sur la page sont lus dans le code, pas
 *    recopiés ici : une machine ajoutée au catalogue doit apparaître sur la
 *    page, et une page qui citerait un service absent du produit serait fausse.
 *
 * Ce qui n'est pas vérifié ici : le rendu visuel, et le bien-fondé des phrases.
 * Une page peut passer ces contrôles en disant quelque chose de faux. C'est le
 * rôle de la relecture sur le produit, pas d'un test.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SHORTENERS } from '../src/core/shorten.js';
import { PROFILES } from '../src/core/printer/profiles.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FR = readFileSync(join(ROOT, 'src', 'site', 'index.html'), 'utf8');
const EN = readFileSync(join(ROOT, 'src', 'site', 'en', 'index.html'), 'utf8');

/**
 * Le texte tel qu'il se lit, balises retirées et entités résolues.
 *
 * Les adresses et les extraits en `<code>` sont retirés avant l'analyse : une
 * URL contient des deux-points qui ne demandent aucune espace insécable, et le
 * drapeau `brave://flags/…` en est plein.
 *
 * @param {string} html
 * @returns {string}
 */
function texteLisible(html) {
  const corps = html.split('<body>')[1] ?? html;
  const sansUrl = corps.replace(/https?:\/\/[^\s"<]+/g, 'URL');
  const sansCode = sansUrl.replace(/<code>[\s\S]*?<\/code>/g, 'CODE');
  return sansCode
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, '\u00a0')
    .replace(/&amp;/g, '&')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»');
}

/** Nombre d'occurrences d'un motif dans une page. */
function compte(html, motif) {
  return html.match(motif)?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Parité des deux langues
// ---------------------------------------------------------------------------

test('les deux pages portent le même nombre de blocs, section par section', () => {
  const mesures = [
    ['sections', /<main>[\s\S]*?<\/main>/],
    ['titres de section', /<h2>/g],
    ['encarts « ce que ça fait »', /class="feature"/g],
    ['étapes', /<ol class="steps">[\s\S]*?<\/ol>/],
    ['questions', /<details>/g],
    ['limites', /<ul class="limits">[\s\S]*?<\/ul>/],
  ];

  for (const [nom, motif] of mesures) {
    const fr = nom === 'étapes' || nom === 'limites'
      ? compte(FR.match(motif)?.[0] ?? '', /<li>/g)
      : compte(FR, motif);
    const en = nom === 'étapes' || nom === 'limites'
      ? compte(EN.match(motif)?.[0] ?? '', /<li>/g)
      : compte(EN, motif);
    assert.equal(fr, en, `${nom} : ${fr} en français, ${en} en anglais`);
    assert.ok(fr > 0, `${nom} : rien de trouvé, le motif ne suit plus la page`);
  }
});

test('les deux pages nomment les mêmes sections, dans le même ordre', () => {
  const fr = [...FR.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1]);
  const en = [...EN.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1]);
  assert.equal(fr.length, en.length);
  assert.equal(fr.length, 6, `six sections attendues, ${fr.length} trouvées`);
  for (const titre of ['Fonctionnalités', 'Comment s\'en servir', 'Questions fréquentes',
    'Vie privée', 'Ce qu\'il ne fait pas', 'Genèse de l\'extension']) {
    assert.ok(fr.includes(titre), `section absente de la page française : ${titre}`);
  }
  for (const titre of ['Features', 'How to use it', 'Frequently asked questions',
    'Privacy', 'What it does not do', 'Genesis of the extension']) {
    assert.ok(en.includes(titre), `section absente de la page anglaise : ${titre}`);
  }
});

// ---------------------------------------------------------------------------
// Typographie française
// ---------------------------------------------------------------------------

test('la page française met une espace insécable avant : ; ! ?', () => {
  const texte = texteLisible(FR).replace(/\u00a0/g, '\u0000');
  const fautes = [...texte.matchAll(/(.)([:;!?])/g)]
    .filter((m) => m[1] !== '\u0000')
    .map((m) => `…${texte.slice(Math.max(0, m.index - 25), m.index + 2).trim()}…`);

  assert.deepEqual(fautes, [], `ponctuation sans espace insécable :\n  ${fautes.join('\n  ')}`);
});

test('la page française met une espace insécable dans les guillemets', () => {
  const texte = texteLisible(FR).replace(/\u00a0/g, '\u0000');
  const fautes = [...texte.matchAll(/«(.)|(.)»/g)]
    .filter((m) => (m[1] !== undefined && m[1] !== '\u0000') || (m[2] !== undefined && m[2] !== '\u0000'))
    .map((m) => m[0]);

  assert.deepEqual(fautes, [], `guillemets sans espace insécable : ${fautes.join(' ')}`);
  assert.ok(texte.includes('«'), 'aucun guillemet français trouvé : le motif ne suit plus la page');
});

// ---------------------------------------------------------------------------
// Ce que la page dit du produit
// ---------------------------------------------------------------------------

test('les deux pages nomment les imprimantes que le produit connaît', () => {
  // Le catalogue vit dans `src/core/printer/profiles.js`. Une machine ajoutée là
  // et absente des pages laisserait le lecteur croire qu'elle n'est pas prise en
  // charge.
  for (const [langue, html] of [['française', FR], ['anglaise', EN]]) {
    for (const profil of PROFILES) {
      assert.ok(
        html.includes(profil.id),
        `${profil.id} n'est pas nommée sur la page ${langue}`,
      );
    }
    // La réserve est aussi obligatoire que la liste : seul le D110 a été
    // éprouvé sur du matériel. Le catalogue annonce trois machines, et deux
    // d'entre elles n'ont jamais imprimé.
    assert.match(
      html,
      /essayée que sur une D110|only been tried on a D110/,
      `la réserve sur le matériel manque à la page ${langue}`,
    );
  }
});

test('les deux pages nomment les services de raccourcissement du produit', () => {
  for (const [langue, html] of [['française', FR], ['anglaise', EN]]) {
    for (const service of SHORTENERS) {
      assert.ok(
        html.includes(service.name),
        `${service.name} n'est pas nommé sur la page ${langue}`,
      );
    }
  }
  // Et pas un de plus : un nom cité qui n'existe plus dans le produit ferait
  // croire à un choix qui n'est pas offert.
  const connus = SHORTENERS.map((s) => s.name);
  const cites = [...new Set(connus.filter((nom) => FR.includes(nom)))];
  assert.equal(cites.length, connus.length, `services cités : ${cites.join(', ')}`);
});

test('les deux pages disent que l\'application et l\'extension ne partagent pas leurs données', () => {
  // La réserve la plus facile à perdre : la version précédente promettait au
  // visiteur « la même collection au même endroit », ce que le produit ne fait
  // pas. Un magasin et un autre ne se partagent rien ; l'export est le pont.
  assert.match(FR, /ne partagent pas leurs\s+données|ne partagent pas leurs données/);
  assert.match(EN, /do not share data/);
});

test('aucune des deux pages ne promet que tout reste sur l\'appareil', () => {
  // Le raccourcissement envoie l'adresse au service choisi. Les formules
  // absolues sont fausses, et contrediraient la déclaration du magasin.
  const absolues = [
    /tout reste sur votre appareil/i,
    /rien ne quitte votre appareil/i,
    /everything stays on your device/i,
    /nothing leaves your device/i,
  ];
  for (const [langue, html] of [['française', FR], ['anglaise', EN]]) {
    for (const motif of absolues) {
      assert.doesNotMatch(html, motif, `promesse absolue dans la page ${langue} : ${motif}`);
    }
  }
});
