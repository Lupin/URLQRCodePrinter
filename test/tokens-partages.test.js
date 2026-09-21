/**
 * Le socle de jetons est-il le même des deux côtés ?
 *
 * La fenêtre de l'extension et l'application qu'elle ouvre sont deux faces du
 * même outil : l'une collecte, l'autre imprime. Elles vivent dans deux feuilles
 * distinctes — le build les livre séparément — donc rien n'empêche leurs
 * couleurs de diverger en silence. Ce test est le seul mécanisme qui l'empêche.
 *
 * Il vérifie deux choses :
 *
 * 1. **L'identité des jetons partagés.** Les mêmes noms, les mêmes valeurs,
 *    dans les deux thèmes.
 * 2. **Les contrastes de l'application**, recalculés depuis ses propres jetons.
 *    Elle a ses paires propres : la fenêtre n'a pas de voyant d'état ni de
 *    numéro d'ordre.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POPUP = readFileSync(join(ROOT, 'src', 'extension-src', 'popup.css'), 'utf8');
const BACKGROUND = readFileSync(join(ROOT, 'src', 'extension-src', 'background.js'), 'utf8');
const APP = readFileSync(join(ROOT, 'src', 'web', 'style.css'), 'utf8');
const APP_HTML = readFileSync(join(ROOT, 'src', 'web', 'index.html'), 'utf8');
const APP_JS = readFileSync(join(ROOT, 'src', 'web', 'app.js'), 'utf8');

/**
 * La feuille de l'application, sans ses commentaires et sans son bloc
 * d'impression.
 *
 * Les règles d'écran se lisent là : le papier a ses propres couleurs, écrites
 * en dur à dessein (noir et gris, jamais la charte), et les mélanger aux règles
 * d'écran ferait échouer les assertions pour de mauvaises raisons.
 */
const APP_CODE_BEFORE_PRINT = APP.replace(/\/\*[\s\S]*?\*\//g, '').split('@media print')[0];

// ---------------------------------------------------------------------------
// Lecture des jetons
// ---------------------------------------------------------------------------

/** Convertit un canal sRGB en luminance linéaire (WCAG 2.x). */
function linearise(canal) {
  const c = canal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminance relative d'une couleur `#rrggbb`. */
function luminance(hex) {
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** Rapport de contraste entre deux couleurs opaques. */
function contraste(a, b) {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}

/**
 * Extrait les déclarations de jetons d'un bloc `:root`.
 * @param {string} source
 * @returns {Record<string, string>}
 */
function jetons(source) {
  const table = {};
  for (const [, nom, valeur] of source.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    table[nom] = valeur.trim();
  }
  return table;
}

/** Thème clair et thème sombre d'une feuille de style. */
function themes(source) {
  const blocClair = source.match(/:root\s*\{([\s\S]*?)\}/)[1];
  const blocSombre = source.match(
    /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}\s*\}/,
  )[1];
  // Le second bloc hérite du premier : une surcharge ne redéclare que ce qui
  // change, exactement comme le navigateur l'applique.
  return {
    clair: jetons(blocClair),
    sombre: { ...jetons(blocClair), ...jetons(blocSombre) },
  };
}

const themesPopup = themes(POPUP);
const themesApp = themes(APP);

// ---------------------------------------------------------------------------
// Identité des jetons partagés
// ---------------------------------------------------------------------------

/**
 * Jetons que les deux feuilles doivent déclarer à l'identique.
 *
 * `--ok` n'en fait pas partie : c'est un vert de disponibilité, propre à
 * l'application, qui n'a aucun sens dans une fenêtre de 380 px.
 */
const PARTAGES = [
  'bg',
  'surface',
  'surface-2',
  'text',
  'text-2',
  'text-3',
  'accent',
  'accent-ink',
  'accent-hover',
  'ink',
  'ink-ink',
  'ink-hover',
  'danger',
  'border-line',
  'border-strong',
];

for (const theme of ['clair', 'sombre']) {
  test(`thème ${theme} : les jetons partagés sont identiques dans les deux feuilles`, () => {
    const écarts = [];
    for (const nom of PARTAGES) {
      const fenêtre = themesPopup[theme][nom];
      const application = themesApp[theme][nom];
      if (fenêtre === undefined) écarts.push(`absent de popup.css : --${nom}`);
      else if (application === undefined) écarts.push(`absent de web/style.css : --${nom}`);
      else if (fenêtre !== application) {
        écarts.push(`--${nom} : fenêtre « ${fenêtre} » ≠ application « ${application} »`);
      }
    }
    assert.deepEqual(écarts, [], `jetons divergents :\n${écarts.join('\n')}`);
  });
}

test('l\'anneau de focus suit l\'accent des deux côtés', () => {
  for (const source of [POPUP, APP]) {
    const table = jetons(source.match(/:root\s*\{([\s\S]*?)\}/)[1]);
    assert.equal(table.focus, 'var(--accent)');
  }
});

// ---------------------------------------------------------------------------
// Contrastes propres à l'application
// ---------------------------------------------------------------------------

const PAIRES = [
  ['texte principal sur le fond', 'text', 'bg', 4.5],
  ['texte principal sur une surface', 'text', 'surface', 4.5],
  ['texte secondaire sur le fond', 'text-2', 'bg', 4.5],
  ['texte secondaire sur une surface', 'text-2', 'surface', 4.5],
  ['texte tertiaire sur le fond', 'text-3', 'bg', 4.5],
  ['texte tertiaire sur une surface', 'text-3', 'surface', 4.5],
  ['texte tertiaire sur un tableau désactivé', 'text-3', 'surface-2', 4.5],
  ['libellé du bouton principal sur l\'accent', 'accent-ink', 'accent', 4.5],
  ['libellé du compteur sur l\'encre', 'ink-ink', 'ink', 4.5],
  ['danger sur le fond', 'danger', 'bg', 4.5],
  ['danger sur une surface', 'danger', 'surface', 4.5],
  ['danger sur un fond de survol neutre', 'danger', 'surface-2', 4.5],
  ['anneau de focus sur le fond', 'focus', 'bg', 3],
  ['anneau de focus sur une surface', 'focus', 'surface', 3],
  ['contour de composant sur le fond', 'border-strong', 'bg', 3],
  ['contour de composant sur une surface', 'border-strong', 'surface', 3],
  ['voyant « connecté » sur le fond', 'ok', 'bg', 3],
  ['voyant « en cours » sur le fond', 'accent', 'bg', 3],
];

for (const theme of ['clair', 'sombre']) {
  test(`application, thème ${theme} : toutes les paires tiennent leur seuil`, () => {
    const table = themesApp[theme];
    const échecs = [];

    for (const [libellé, dessus, dessous, seuil] of PAIRES) {
      const avant = table[dessus];
      const arrière = table[dessous];
      assert.ok(avant, `jeton absent : --${dessus}`);
      assert.ok(arrière, `jeton absent : --${dessous}`);
      const rapport = contraste(avant, arrière);
      if (rapport < seuil) {
        échecs.push(
          `${libellé} : ${rapport.toFixed(2)}:1 (minimum ${seuil}) — ${avant} sur ${arrière}`,
        );
      }
    }

    assert.deepEqual(échecs, [], `contrastes insuffisants :\n${échecs.join('\n')}`);
  });
}

// ---------------------------------------------------------------------------
// Garde-fous de palette et d'état
// ---------------------------------------------------------------------------

test('aucun fond teinté de danger dans l\'application non plus', () => {
  const code = APP.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(code, /--danger-soft/, 'un jeton de fond teinté subsiste');

  for (const theme of ['clair', 'sombre']) {
    assert.equal(themesApp[theme]['danger-soft'], undefined);
  }

  const fondsDanger = [
    ...code.matchAll(/background:\s*var\((--[\w-]+)\);[\s\S]{0,60}?(?<![\w-])color:\s*var\(--danger\)/g),
  ].map((match) => match[1]);
  for (const jeton of fondsDanger) {
    assert.ok(
      ['--surface', '--surface-2', '--bg'].includes(jeton),
      `fond non neutre sous du texte rouge : ${jeton}`,
    );
  }
});

test('la désactivation ne repose plus sur une opacité', () => {
  const code = APP.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(code, /opacity:\s*0?\.\d+\s*;\s*\n?\s*cursor:\s*(default|not-allowed)/,
    'un état désactivé repose encore sur une opacité');
  assert.match(code, /\.btn:disabled\s*\{[\s\S]*?color:\s*var\(--text-3\)/);
});

test('aucune couleur de la charte n\'est écrite en dur hors impression', () => {
  const code = APP.replace(/\/\*[\s\S]*?\*\//g, '');
  const avantImpression = code.split('@media print')[0];
  // Les ombres neutres sont légitimes ; ce sont les teintes de charte qui ne
  // doivent pas se cacher dans une règle.
  const teintes = [...avantImpression.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase());
  const autorisées = new Set(
    [...avantImpression.matchAll(/^\s*--[\w-]+:\s*(#[0-9a-fA-F]{6})/gm)].map((m) => m[1].toLowerCase()),
  );
  const cachées = [...new Set(teintes)].filter((t) => !autorisées.has(t));
  assert.deepEqual(cachées, [], `couleurs écrites hors des jetons : ${cachées.join(', ')}`);
});

// ---------------------------------------------------------------------------
// La pastille de la barre d'outils
// ---------------------------------------------------------------------------

/**
 * Couleurs du badge, lues dans le service worker.
 *
 * La pastille est peinte par `chrome.action`, pas par le CSS : c'est le
 * troisième endroit où vivait la charte, et le seul qui ait gardé le teal après
 * la refonte des deux feuilles. Il ne se voit que dans la barre d'outils, donc
 * aucun test de rendu ne l'aurait attrapé.
 * @returns {Record<string, string>}
 */
function badgeTokens() {
  const table = {};
  for (const [, nom, valeur] of BACKGROUND.matchAll(/const (BADGE_[A-Z]+) = '(#[0-9a-f]{6})'/g)) {
    table[nom] = valeur;
  }
  return table;
}

test('la pastille est reprise au démarrage du service worker', () => {
  // `onInstalled` et `onStartup` ne couvrent pas le rechargement d'une
  // extension non empaquetée : sans cet appel, le badge garde la couleur de
  // l'exécution précédente. C'est ainsi qu'une pastille teal a survécu à la
  // refonte alors que le code livré n'en contenait plus une trace.
  const appels = [...BACKGROUND.matchAll(/^refreshBadge\(\);/gm)].length;
  assert.ok(appels >= 1, 'aucune reprise du badge au chargement du service worker');
});

test("la pastille ne garde aucune trace du teal d'origine", () => {
  const badge = badgeTokens();
  for (const [nom, valeur] of Object.entries(badge)) {
    assert.notEqual(valeur.toLowerCase(), '#21808d', `${nom} est resté au teal`);
  }
});

test("le compteur de la barre d'outils vient de la palette, pas d'une teinte inventée", () => {
  // Le badge est à l'encre et non à l'accent, contrairement au compteur de la
  // fenêtre : il est peint **sur** l'icône, qui est déjà orange. Un badge orange
  // s'y fondrait au lieu de s'en détacher. Ce qu'on vérifie ici, c'est qu'il
  // appartient bien au socle commun et n'a pas été choisi dans son coin.
  const badge = badgeTokens();
  assert.equal(badge.BADGE_COUNT, themesPopup.clair['ink'].toLowerCase());
});

test('le texte du badge tient son seuil sur les quatre fonds', () => {
  const badge = badgeTokens();
  assert.ok(badge.BADGE_TEXT, 'couleur de texte absente');
  for (const nom of ['BADGE_COUNT', 'BADGE_ADDED', 'BADGE_DUPLICATE', 'BADGE_ERROR']) {
    assert.ok(badge[nom], `${nom} absent`);
    const rapport = contraste(badge.BADGE_TEXT, badge[nom]);
    assert.ok(rapport >= 4.5, `${nom} : ${rapport.toFixed(2)}:1 sur ${badge[nom]}, minimum 4,5:1`);
  }
});

test('les trois retours du badge reprennent les teintes du système', () => {
  const badge = badgeTokens();
  // Un ajout réussi reprend le vert de disponibilité de l'application ; un
  // doublon n'est pas une erreur, il reste neutre ; un échec prend le rouge.
  assert.equal(badge.BADGE_ADDED, themesApp.clair['ok'].toLowerCase());
  assert.equal(badge.BADGE_DUPLICATE, themesPopup.clair['ink'].toLowerCase());
  assert.equal(badge.BADGE_ERROR, themesPopup.clair['danger'].toLowerCase());
});

// ---------------------------------------------------------------------------
// Survol des boutons d'export
// ---------------------------------------------------------------------------

test("les boutons d'export se remplissent à l'accent au survol", () => {
  const règle = APP.match(/\.btn--fill:not\(:disabled\):hover\s*\{([\s\S]*?)\}/);
  assert.ok(règle, 'aucune règle de survol rempli');

  assert.match(règle[1], /background:\s*var\(--accent\)/, 'le fond ne prend pas l\'accent');
  assert.match(règle[1], /border-color:\s*var\(--accent\)/);
  // Le libellé doit venir du jeton, pas d'un blanc écrit en dur : le blanc ne
  // tient que 1,69:1 sur l'orange éclairci du thème sombre.
  assert.match(règle[1], /color:\s*var\(--accent-ink\)/, 'le libellé ignore le jeton d\'encre');
  assert.doesNotMatch(règle[1], /color:\s*#fff/i, 'blanc en dur sur un fond qui change de thème');

  for (const id of ['export-xlsx', 'export-csv', 'export-md', 'export-json', 'import', 'clear']) {
    const balise = APP_HTML.match(new RegExp(`<button id="${id}"[^>]*>`));
    assert.ok(balise, `${id} introuvable`);
    assert.match(balise[0], /btn--fill/, `${id} ne porte pas le modificateur de survol`);
  }
});

test("le survol rempli ne touche que le pied de panneau", () => {
  // On compte les attributs `class`, pas les occurrences de la chaîne : le
  // commentaire qui documente le modificateur le nomme, et un simple
  // `matchAll` sur le texte le comptait comme un porteur.
  // Quatre exports de collection + le dossier du tableau + « Importer… » +
  // « Tout effacer ». Le modificateur ne doit pas s'être répandu sur les onglets
  // ni sur l'éditeur.
  const porteurs = [...APP_HTML.matchAll(/class="[^"]*\bbtn--fill\b[^"]*"/g)].length;
  assert.equal(porteurs, 7, `le modificateur touche ${porteurs} boutons au lieu de 7`);
});

test("l'avertissement de « Tout effacer » est visible au repos", () => {
  // Il était posé sur le survol, qui est désormais occupé par l'aplat d'accent.
  // Le signaler plus tôt est nécessaire : le bouton vide la collection sans
  // confirmation ni retour arrière.
  assert.match(APP_JS, /el\.clear\.addEventListener/, 'le bouton a changé de nom');

  const danger = APP_CODE_BEFORE_PRINT.match(/\n\.btn--danger\s*\{([\s\S]*?)\}/);
  assert.ok(danger, 'aucune règle .btn--danger au repos');
  assert.match(danger[1], /border-color:\s*var\(--danger\)/);
  assert.match(danger[1], /color:\s*var\(--danger\)/);

  // Et il ne reste rien au survol, sinon le rouge l'emporterait sur l'aplat.
  assert.doesNotMatch(
    APP_CODE_BEFORE_PRINT,
    /\.btn--danger:not\(:disabled\):hover/,
    'une règle de survol du danger subsiste et masquerait le fond orange',
  );
});

// ---------------------------------------------------------------------------
// Mise en page du pied de panneau
// ---------------------------------------------------------------------------

test("le pied de panneau empile ses deux groupes et les aligne à gauche", () => {
  // Trois corrections successives demandées sur cette zone, aucune n'était
  // tenue par un test. Elles le sont maintenant.
  const pied = APP_CODE_BEFORE_PRINT.match(/\.panel__footer\s*\{([\s\S]*?)\}/);
  assert.ok(pied, 'règle .panel__footer absente');
  assert.match(pied[1], /flex-direction:\s*column/, 'les groupes ne sont pas empilés');
  const ecart = Number(pied[1].match(/gap:\s*(\d+)px/)?.[1] ?? 0);
  assert.ok(ecart >= 10, `espace insuffisant entre les deux groupes : ${ecart}px`);

  // Le groupe de droite ne doit plus être repoussé : c'est ce décalage qui
  // cassait l'alignement.
  const fin = APP_CODE_BEFORE_PRINT.match(/\.actions--end\s*\{([\s\S]*?)\}/);
  assert.ok(fin, 'règle .actions--end absente');
  assert.doesNotMatch(fin[1], /margin-left:\s*auto/, 'le groupe est encore repoussé à droite');

  // Le libellé occupe sa propre ligne et il est en gras.
  const libelle = APP_CODE_BEFORE_PRINT.match(/\.actions__label\s*\{([\s\S]*?)\}/);
  assert.match(libelle[1], /flex:\s*0 0 100%/, "le libellé ne tient pas sa propre ligne");
  assert.match(libelle[1], /font-weight:\s*700/, "le libellé n'est pas en gras");
});

test("les puces de tag sont plates et sans « # »", () => {
  // Le « # » est une syntaxe de saisie : `normalizeTags` l'accepte puis le
  // retire, si bien que le tag est déjà stocké sans lui. Le réafficher était un
  // reste — et un bouton sans bordure n'avait plus besoin de ce repère.
  assert.match(APP_JS, /button\(tag, 'tag'/, 'la puce ne porte plus le tag nu');
  assert.doesNotMatch(APP_JS, /`#\$\{tag\}`/, 'la puce réaffiche le « # »');

  // Le bouton gardait la bordure `outset` du navigateur, qu'aucune règle ne
  // déclarait : c'est elle qui dessinait le contour autour de chaque tag.
  const puce = APP_CODE_BEFORE_PRINT.match(/\.tag\s*\{([\s\S]*?)\}/)[1];
  assert.match(puce, /border:\s*0/, "la bordure du navigateur n'est pas annulée");
  assert.match(puce, /font-family:\s*inherit/, "la police du navigateur n'est pas annulée");
});

// ---------------------------------------------------------------------------
// La marque de l'en-tête
// ---------------------------------------------------------------------------

test("la marque de l'en-tête suit le thème au lieu d'être figée en noir", () => {
  const svg = APP_HTML.match(/<svg class="marque"[\s\S]*?<\/svg>/);
  assert.ok(svg, "aucune marque dans l'en-tête");

  // Décorative : le <h1> qui suit porte déjà le nom. Un texte de remplacement
  // ferait annoncer « URLQRCodePrinter » deux fois.
  assert.match(svg[0], /aria-hidden="true"/, 'la marque est exposée aux lecteurs d\'écran');

  // Aucune couleur en dur. Un noir figé rendrait la marque invisible en thème
  // sombre, et une inversion photographique transformerait la feuille en aplat
  // noir au lieu de lui donner la couleur du fond.
  assert.doesNotMatch(svg[0], /#[0-9a-fA-F]{3,6}/, 'couleur figée dans la marque');
  assert.match(svg[0], /stroke="currentColor"/, "le tracé n'hérite pas de la couleur");

  const marque = APP_CODE_BEFORE_PRINT.match(/\.marque\s*\{([\s\S]*?)\}/);
  assert.ok(marque, 'aucune règle .marque');
  // L'accent, et non l'encre : la marque porte la couleur du produit. Ce qui
  // compte pour ce test est qu'elle vienne d'un **jeton** — une couleur
  // écrite en dur ne suivrait pas le thème.
  assert.match(marque[1], /color:\s*var\(--accent\)/, "la marque ne prend pas l'accent");
  assert.match(
    APP_CODE_BEFORE_PRINT,
    /\.marque__papier\s*\{\s*fill:\s*var\(--bg\)/,
    'le papier ne prend pas la couleur du fond',
  );

  // La marque précède le titre dans l'ordre du document : c'est ce qui la place
  // à gauche, et un lecteur d'écran lit le nom juste après le dessin.
  assert.ok(
    APP_HTML.indexOf('class="marque"') < APP_HTML.indexOf('class="topbar__title"'),
    'la marque est passée après le titre',
  );
});
