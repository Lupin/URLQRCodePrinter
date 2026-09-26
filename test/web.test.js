/**
 * Vérification de l'application web.
 *
 * On va au-delà de la syntaxe : le serveur est réellement démarré et interrogé,
 * car c'est le seul moyen de constater que la page et ses modules se chargent
 * et que le dossier servi reste confiné.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ELEMENT_IDS } from '../src/web/element-ids.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'src', 'web');
const DIST_WEB = join(ROOT, 'dist', 'web');

// L'application n'est complète qu'une fois le cœur partagé recopié. La
// construction est assurée par le script `pretest` de npm : la déclencher ici
// entrerait en concurrence avec les autres fichiers de test, qui s'exécutent en
// parallèle et reconstruisent la même cible.
if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

const html = readFileSync(join(WEB, 'index.html'), 'utf8');

/** Extrait les spécificateurs d'import relatifs d'un module ES. */
function relativeImports(source) {
  const specifiers = [];
  for (const pattern of [
    /(?:^|\n)\s*import\s+[^'"]*?from\s+['"](\.[^'"]+)['"]/g,
    /(?:^|\n)\s*import\s+['"](\.[^'"]+)['"]/g,
  ]) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

// ---------------------------------------------------------------------------
// Cohérence entre le HTML et le script
// ---------------------------------------------------------------------------

test('chaque identifiant attendu par app.js existe dans index.html', () => {
  const missing = ELEMENT_IDS.filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, [], `identifiants absents du HTML : ${missing.join(', ')}`);
});

test('les réglages de planche ont une valeur par défaut dans le HTML', () => {
  // Un décalage d'impression qui ne part pas de zéro décalerait toutes les
  // planches sans que personne ne l'ait demandé.
  for (const id of ['sheet-offset-x', 'sheet-offset-y']) {
    const field = new RegExp(`id="${id}"[^>]*value="0"`);
    assert.match(html, field, `${id} doit partir de 0`);
  }
});

test('le bandeau de feuille de style obsolète dit quoi faire', () => {
  // Ce bandeau n'apparaît que si le navigateur a gardé une ancienne feuille de
  // style : il doit alors nommer la cause ET le geste à faire.
  const banner = html.match(/<div id="stale-style"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(banner, 'le bandeau doit être présent dans index.html');
  assert.match(banner[1], /Feuille de style obsolète/);
  assert.match(banner[1], /brave:\/\/extensions/);
  assert.match(banner[1], /Rechargez l'extension/);
  // Masqué au départ : sans feuille obsolète, il ne doit rien afficher.
  assert.match(html, /<div id="stale-style"[^>]*hidden/);
});

test('le réglage du raccourcisseur est nommé par ce qu\'il règle', () => {
  // « Raccourcir les liens » coiffait directement la liste des services : le
  // libellé du champ semblait nommer l'action, et choisir un service ressemblait
  // à un arbitrage obligatoire. Le titre nomme l'action, le champ nomme le
  // réglage — et « Service » suffit à comprendre qu'on ne fait que choisir qui
  // raccourcit.
  assert.match(html, /class="shortener__title"[\s\S]{0,80}data-i18n="Raccourcir les liens"/);
  assert.match(html, /class="field__label" data-i18n="Service"/);
  // Le sélecteur et les boutons sont dans la rangée du réglage, pas dans le
  // titre : la structure porte la distinction que le texte annonce.
  assert.match(html, /class="shortener__row"[\s\S]*id="shortener"[\s\S]*id="shorten"/);
});

test('les colonnes du tableau ont leurs valeurs par défaut dans le HTML', () => {
  // Ce qui décrit un lien est affiché ; les champs facultatifs attendent d'être
  // remplis. Un test de démarrage ne peut pas le voir : le DOM de substitution
  // ne lit pas les attributs.
  for (const id of ['table-col-index', 'table-col-qr', 'table-col-url', 'table-col-title']) {
    assert.match(
      html,
      new RegExp(`id="${id}"[^>]*checked`),
      `${id} doit être cochée par défaut`,
    );
  }
  for (const id of ['table-col-tags', 'table-col-note']) {
    assert.equal(
      new RegExp(`id="${id}"[^>]*checked`).test(html),
      false,
      `${id} ne doit pas être cochée par défaut`,
    );
  }
});

test('la grille du tableau est active par défaut', () => {
  // Un tableau sans bordures est un choix : c'est à l'utilisateur de le faire.
  assert.match(html, /id="table-grid"[^>]*checked/, 'la grille doit être cochée par défaut');
});

test('la case maîtresse est en tête de la liste', () => {
  // Placée avant la liste, elle se lit comme son en-tête : « tout ce qui suit ».
  const box = html.indexOf('id="select-all-box"');
  const list = html.indexOf('id="list"');
  const search = html.indexOf('id="search"');
  assert.ok(box !== -1 && list !== -1, 'la case et la liste doivent exister');
  assert.ok(box < list, 'la case précède la liste');
  assert.ok(box > search, 'elle ne se confond pas avec la recherche');
  assert.equal(/>Rien</.test(html), false, 'plus de bouton « Rien »');
  assert.equal(html.includes('id="select-all"'), false, 'plus de bouton « Tout »');
});

test('index.html ne contient aucun script inline', () => {
  const inline = [...html.matchAll(/<script\b([^>]*)>/gi)].filter(
    (match) => !/\bsrc\s*=/i.test(match[1]),
  );
  assert.equal(inline.length, 0);
});

test('les ressources locales référencées par le HTML existent', () => {
  const sources = [
    ...[...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/<link[^>]*\bhref=["']([^"']+)["']/gi)].map((m) => m[1]),
  ];
  assert.ok(sources.length >= 2);
  for (const source of sources) {
    // On ignore les URL absolues (polices, CDN éventuels).
    if (/^https?:/i.test(source)) continue;
    assert.ok(existsSync(join(WEB, source)), `ressource manquante : ${source}`);
  }
});

test('app.js est syntaxiquement valide', () => {
  execFileSync(process.execPath, ['--check', join(WEB, 'app.js')], { stdio: 'pipe' });
});

test('les imports de app.js résolvent dans l\'application assemblée', () => {
  const source = readFileSync(join(DIST_WEB, 'app.js'), 'utf8');
  const specifiers = relativeImports(source);
  assert.ok(specifiers.length > 5);
  for (const specifier of specifiers) {
    assert.equal(specifier.includes('..'), false, `remontée interdite : ${specifier}`);
    assert.ok(
      existsSync(resolve(DIST_WEB, specifier)),
      `import cassé dans app.js : ${specifier}`,
    );
  }
});

test('le build de l\'application web contient le cœur et ses modules propres', () => {
  for (const file of [
    'index.html', 'style.css', 'app.js', 'element-ids.js',
    'core/link.js', 'core/store.js', 'core/qr.js', 'core/label.js',
    'core/raster.js', 'core/sheet.js', 'core/exporters.js', 'core/download.js',
    'core/printer/transport.js', 'core/printer/printer.js',
  ]) {
    assert.ok(existsSync(join(DIST_WEB, file)), `absent du build : ${file}`);
  }
});

// ---------------------------------------------------------------------------
// Serveur
// ---------------------------------------------------------------------------

let server = null;
let baseUrl = '';

before(async () => {
  const { serve } = await import('../scripts/serve.mjs');
  // Port 0 : le système en attribue un libre, ce qui évite tout conflit.
  server = await serve({ dir: DIST_WEB, port: 0 });
  baseUrl = server.url;
});

after(async () => {
  await server?.close();
});

test('le serveur sert la page de l\'application', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  const body = await response.text();
  assert.match(body, /<title>URLQRCodePrinter<\/title>/);
});

test('le serveur sert les modules avec le bon type MIME', async () => {
  // Un type MIME incorrect empêche le navigateur de charger un module ES.
  for (const path of ['/app.js', '/core/link.js', '/core/printer/packet.js']) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 200, path);
    assert.match(
      response.headers.get('content-type'),
      /javascript/,
      `${path} : type MIME incorrect`,
    );
  }
});

test('le serveur sert la feuille de style', async () => {
  const response = await fetch(`${baseUrl}style.css`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/css/);
});

test('une ressource absente renvoie 404 avec une aide', async () => {
  const response = await fetch(`${baseUrl}inexistant.js`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /npm run build/);
});

test('le serveur refuse de sortir du dossier servi', async () => {
  // Les remontées sont encodées : `fetch` normalise les « .. » littéraux avant
  // l'envoi, ce qui masquerait le cas à tester.
  for (const attempt of [
    '/%2e%2e/package.json',
    '/%2e%2e%2f%2e%2e%2fpackage.json',
    '/core/%2e%2e%2f%2e%2e%2fpackage.json',
  ]) {
    const response = await fetch(baseUrl + attempt);
    const body = await response.text();
    assert.equal(
      body.includes('url-qr-code-printer'),
      false,
      `fuite de fichier via ${attempt} (statut ${response.status})`,
    );
  }
});

test('tout nom importé existe bien dans le module visé', () => {
  // Garde-fou né d'une erreur réelle : `parseImportFile` était appelé dans
  // app.js sans avoir été importé. Un identifiant inconnu ne se voit ni à la
  // lecture ni au chargement du module — seulement à l'exécution de la
  // fonction, donc jamais pendant les tests de démarrage.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  const problems = [];

  const patterns = [
    // import { a, b as c } from './x.js'
    /import\s*\{([^}]*)\}\s*from\s*['"](\.[^'"]+)['"]/g,
    // import Defaut from './x.js'
    /import\s+([A-Za-z_$][\w$]*)\s+from\s*['"](\.[^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    for (const match of app.matchAll(pattern)) {
      const [statement, clause, specifier] = match;
      // `app.js` est écrit pour la disposition construite (`core/` à côté de
      // lui) ; dans les sources, le cœur est un dossier voisin.
      const target = [
        resolve(WEB, specifier),
        resolve(ROOT, 'src', specifier),
      ].find((candidate) => existsSync(candidate));
      if (!target) {
        problems.push(`${specifier} est introuvable`);
        continue;
      }
      const source = readFileSync(target, 'utf8');

      // La forme nommée se reconnaît à l'accolade de l'instruction entière : le
      // groupe capturé, lui, ne contient que l'intérieur des accolades.
      const names = statement.includes('{') ? clause.split(',') : [clause];
      for (const entry of names) {
        const name = entry.trim().split(/\s+as\s+/)[0].trim();
        if (name === '') continue;
        const declared = new RegExp(
          `export\\s+(?:async\\s+)?(?:function|const|let|var|class)\\s+${name}\\b`,
        ).test(source)
          || new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(source);
        if (!declared) problems.push(`${name} n'est pas exporté par ${specifier}`);
      }
    }
  }

  assert.deepEqual(problems, []);
});

test('l\'interface annonce ce que l\'import accepte', () => {
  // L'import était la fonction la moins compréhensible : le bouton ne disait
  // ni ce qu'il attendait, ni ce qu'il faisait des doublons.
  const hint = html.match(/Importer relit[\s\S]*?<\/p>/);
  assert.ok(hint, 'l\'aide de l\'import doit être présente');
  assert.match(hint[0], /Archive/);
  assert.match(hint[0], /\.zip/);
  assert.match(hint[0], /CSV/i);
  assert.match(hint[0], /ignorés/, 'le sort des doublons doit être dit');
});

test('le sélecteur de fichier accepte les formats relisibles', () => {
  const input = html.match(/<input id="import-file"[^>]*>/);
  assert.ok(input, 'le champ de fichier doit exister');
  for (const accept of ['.json', '.csv', '.zip']) {
    assert.ok(input[0].includes(accept), `le champ doit accepter ${accept}`);
  }
});

test("la planche peut imprimer l'URL sous le QR Code", () => {
  // Elle n'imprimait que le titre, et retombait sur l'URL uniquement quand il
  // n'y en avait pas : aucune option ne permettait de l'ajouter.
  const html = readFileSync(join(ROOT, 'src', 'web', 'index.html'), 'utf8');
  const ids = readFileSync(join(ROOT, 'src', 'web', 'element-ids.js'), 'utf8');
  const app = readFileSync(join(ROOT, 'src', 'web', 'app.js'), 'utf8');

  const champ = html.match(/<input id="sheet-url"[^>]*>/);
  assert.ok(champ, "aucune case « URL » dans « Sous chaque QR Code »");
  assert.match(champ[0], /type="checkbox"/);
  assert.ok(ids.includes("'sheet-url'"), "l'identifiant n'est pas déclaré");

  // Et elle doit être branchée : une case qui ne change rien est pire qu'une
  // case absente.
  assert.match(app, /el\.sheetUrl\.checked/, 'la case n\'est pas lue');
  assert.match(app, /texteSousLeQr\(/, 'le texte imprimé ne suit pas le choix');
});

test("les écarts de la planche sont nommés d'après les étiquettes, pas les lignes", () => {
  // « Écart entre rangées » se lisait comme un interligne : sur une planche,
  // ce sont les étiquettes qu'il espace. Le mot « rangée » a disparu des deux
  // libellés, pour qu'aucun des deux ne prête à confusion.
  const html = readFileSync(join(ROOT, 'src', 'web', 'index.html'), 'utf8');
  // Le libellé apparaît deux fois dès qu'il est marqué pour la traduction :
  // une fois dans `data-i18n`, une fois dans le contenu. On dédoublonne.
  const libellés = [...new Set(
    [...html.matchAll(/Écart entre ([^<(]+)\(mm\)/g)].map((m) => m[1].trim()),
  )];

  assert.equal(libellés.length, 2, `attendu deux écarts, trouvé : ${libellés.join(' / ')}`);
  for (const libellé of libellés) {
    assert.match(libellé, /étiquettes/, `« ${libellé} » ne nomme pas les étiquettes`);
    assert.doesNotMatch(libellé, /rangée|ligne/i, `« ${libellé} » prête à confusion`);
  }
  // L'axe reste explicite : deux « écart entre étiquettes » sans direction
  // seraient indiscernables.
  assert.match(libellés[0], /horizontal/);
  assert.match(libellés[1], /vertical/);
});

test("l'aperçu se recale sur la largeur disponible", () => {
  // L'échelle d'une page était calculée avec un minimum fixe de 280 px : dès
  // que le panneau de prévisualisation était plus étroit que lui, la planche
  // débordait horizontalement. Elle suit désormais la largeur utile du panneau,
  // et se recalcule quand la fenêtre change de taille.
  const app = readFileSync(join(ROOT, 'src', 'web', 'app.js'), 'utf8');
  assert.match(app, /function previewViewportWidth\(/);
  assert.doesNotMatch(app, /Math\.max\(280,\s*el\.preview\.clientWidth/);
  assert.match(app, /addEventListener\('resize'/);
});

// ---------------------------------------------------------------------------
// L'éditeur de lien
// ---------------------------------------------------------------------------

test("l'éditeur de lien offre de quoi le refermer", () => {
  // Il ne se fermait qu'avec Entrée ou Échap, et seule une phrase d'aide le
  // disait. Un utilisateur qui ne lit pas la phrase n'avait aucun moyen de voir
  // comment terminer — et la souris seule ne suffisait pas.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /link__editor-actions/);
  assert.match(app, /button\(t\('Annuler'\)/, 'aucun bouton d\'annulation');
  assert.match(app, /button\(t\('Enregistrer'\)/, 'aucun bouton d\'enregistrement');
  // Les deux commandes appellent la même sortie que le clavier : une seconde
  // logique de fermeture finirait par diverger de la première.
  assert.match(app, /finish\(false\)/);
  assert.match(app, /finish\(true\)/);
});

test("le formulaire de l'éditeur empile ses commandes sans les étirer", () => {
  const css = readFileSync(join(WEB, 'style.css'), 'utf8');
  const regle = css.match(/\.link__editor-actions\s*\{([\s\S]*?)\}/);
  assert.ok(regle, 'aucune règle pour les commandes de l\'éditeur');
  assert.match(regle[1], /display:\s*flex/);
  assert.match(regle[1], /justify-content:\s*flex-end/);
  const boutons = css.match(/\.link__editor-actions \.btn\s*\{([\s\S]*?)\}/);
  assert.ok(boutons, 'les boutons ne sont pas protégés de l\'étirement');
  assert.match(boutons[1], /flex:\s*none/);
});

// ---------------------------------------------------------------------------
// Options de la planche : le titre, et la bordure de découpe
// ---------------------------------------------------------------------------

test('le titre de la planche est optionnel, et coché par défaut', () => {
  // Il s'imprimait toujours quand il existait : ni l'URL seule, ni l'absence de
  // texte n'étaient atteignables. Coché par défaut, l'ancien comportement est
  // conservé pour qui ne touche à rien.
  const champ = html.match(/<input id="sheet-title"[^>]*>/);
  assert.ok(champ, 'aucune case pour le titre');
  assert.match(champ[0], /checked/, 'le titre doit rester imprimé par défaut');
  assert.match(champ[0], /type="checkbox"/);
});

test('la composition du texte vient du cœur, pas d\'une expression locale', () => {
  // Deux expressions séparées — une pour compter les lignes réservées, une pour
  // écrire le texte — finiraient par diverger, et le QR Code rognerait le texte
  // ou laisserait un vide.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /sheetCellText\(item, choixTexte\)/);
  assert.match(app, /const choixTexte = \{ title: el\.sheetTitle\.checked, url: el\.sheetUrl\.checked \}/);
});

test('aucune ligne de texte ne réserve une ligne pour du vide', () => {
  // Le compte partait de 1 : décocher le titre **et** l'URL laissait quand même
  // une ligne réservée, et le QR Code restait petit pour rien.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  const bloc = app.match(/const lignesNecessaires = [\s\S]*?\}, (\d)\);/);
  assert.ok(bloc, 'calcul du nombre de lignes introuvable');
  assert.equal(bloc[1], '0', 'le compte doit partir de zéro');
});

test('la bordure de découpe existe, décochée par défaut', () => {
  const champ = html.match(/<input id="sheet-border"[^>]*>/);
  assert.ok(champ, 'aucune case pour la bordure');
  assert.doesNotMatch(champ[0], /checked/, 'une bordure ne s\'imprime pas sans qu\'on la demande');
});

test('la bordure suit le motif du tableau imprimé', () => {
  // Un trait de 1 px disparaît à l'impression — c'est écrit dans la feuille de
  // style, et le tableau utilise déjà 0,2 mm. Deux épaisseurs pour le même trait
  // se verraient côte à côte.
  const css = readFileSync(join(WEB, 'style.css'), 'utf8');
  const regle = css.match(/\.print-cell--bordered\s*\{([\s\S]*?)\}/);
  assert.ok(regle, 'aucune règle de bordure');
  assert.match(regle[1], /border:\s*0\.2mm solid #000/);
  const tableau = css.match(/\.print-table th,\s*\.print-table td\s*\{([\s\S]*?)\}/);
  assert.match(tableau[1], /0\.2mm solid #000/);
});

test('la case de bordure agit sur le rendu, pas seulement sur le formulaire', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /el\.sheetBorder\.checked[\s\S]{0,80}print-cell--bordered/);
});

// ---------------------------------------------------------------------------
// Le rangement de la collection
//
// C'est un **mode**, et non deux flèches posées sur chaque ligne : elles
// encombraient la liste en permanence pour une action qu'on fait une fois. Le
// geste est le chemin naturel ; les flèches restent l'alternative exigée par le
// critère 2.5.7 pour qui ne peut pas glisser.
// ---------------------------------------------------------------------------

test('la collection offre un bouton de rangement, inactif par défaut', () => {
  const bouton = html.match(/<button id="reorder"[^>]*>/);
  assert.ok(bouton, 'aucun bouton de rangement');
  assert.match(bouton[0], /aria-pressed="false"/, 'l\'état doit être annoncé, pas seulement dessiné');
  assert.doesNotMatch(bouton[0], /disabled/, 'la liste part en ordre manuel : le rangement est possible');
});

test('les flèches n\'existent qu\'en mode rangement, et à gauche de la ligne', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  // Le seul appel qui ajoute le bloc de rangement est gardé par le mode.
  assert.match(app, /if \(reorderMode\) \{\s*\n\s*item\.append\(moveControls\(link\), check, rank/);
  assert.doesNotMatch(app, /item\.append\(check, rank, body, linkEditor\(link\), remove, moveControls/);
});

test('le rangement se quitte au clavier', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /event\.key !== 'Escape'/, 'Échap doit refermer le mode');
  assert.match(app, /el\.reorder\.focus\(\)/, 'le focus doit revenir au bouton, pas se perdre');
});

test('le glissement suit le pointeur, et relit l\'ordre du document', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /pointerdown/, 'le geste se prend au pointeur');
  assert.match(app, /setPointerCapture/, 'sans capture, la ligne est lâchée au premier pixel');
  assert.match(app, /pointermove/);
  // L'ordre écrit est celui du document : un état intermédiaire à tenir à jour
  // finirait par diverger de ce que l'utilisateur voit.
  assert.match(app, /applyOrder\(\[\.\.\.el\.list\.querySelectorAll\('\.link'\)\]\.map\(\(n\) => n\.dataset\.id\)\)/);
});

test('les flèches restent, comme alternative au geste', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /bloc\.append\(grip, up, down\)/, 'le geste ne peut pas être le seul chemin');
  // La poignée ne se présente pas à l'assistance : on ne glisse pas à la voix,
  // et un bouton focalisable caché aux lecteurs d'écran serait un piège.
  assert.match(app, /grip\.setAttribute\('aria-hidden', 'true'\)/);
});

test('ranger est impossible sous un tri, et le bouton le dit', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /const peutRanger = preferences\.sortMode === 'manual' && links\.length > 1/);
  assert.match(app, /el\.reorder\.disabled = !peutRanger/);
});

test('aucun champ ne s\'étire dans une colonne', () => {
  // `flex: 1 1 160px` sur `.field` était pensé pour une **rangée** : dans une
  // colonne, la base devenait une hauteur, chaque champ montait à 160 px et
  // laissait ~105 px de vide sous son libellé. Trois champs concernés, 315 px
  // perdus, et une note de collection repoussée vers le bas sans raison.
  const css = readFileSync(join(WEB, 'style.css'), 'utf8');
  const base = css.match(/\n\.field\s*\{([\s\S]*?)\}/)[1];
  assert.doesNotMatch(base, /flex:/, 'la base d\'un champ ne vaut que dans une rangée');
  assert.match(css, /\.fields > \.field\s*\{[^}]*flex:\s*1 1 160px/);
});

test('les commandes de rangement atteignent la cible de 24 px', () => {
  // Deux flèches serrées à 2 px : l'exception d'espacement du critère 2.5.8 ne
  // s'applique pas, leurs cercles de 24 px se recoupant. C'est donc la taille
  // du contrôle qui doit tenir le seuil, et elle le tient.
  const css = readFileSync(join(WEB, 'style.css'), 'utf8');
  for (const selecteur of ['.link__move', '.link__grip']) {
    const regle = css.match(new RegExp(`\\${selecteur}\\s*\\{([\\s\\S]*?)\\}`));
    assert.ok(regle, `aucune règle pour ${selecteur}`);
    assert.match(regle[1], /width:\s*24px/, `${selecteur} : largeur`);
    assert.match(regle[1], /height:\s*24px/, `${selecteur} : hauteur`);
  }
  const bloc = css.match(/\.link__rank\s*\{([\s\S]*?)\}/)[1];
  assert.match(bloc, /gap:\s*2px/, 'les deux flèches forment un objet, pas deux commandes séparées');
});

// ---------------------------------------------------------------------------
// En-tête de page de la planche
// ---------------------------------------------------------------------------

test('la planche offre l\'en-tête de page, comme le tableau', () => {
  const entete = html.match(/<input id="sheet-header"[^>]*>/);
  assert.ok(entete, 'aucune case pour l\'en-tête');
  assert.doesNotMatch(entete[0], /checked/, 'un en-tête ne s\'imprime pas sans qu\'on le demande');
  assert.ok(html.match(/<input id="sheet-header-date"[^>]*>/), 'aucune case pour la date');
  assert.ok(html.match(/id="sheet-header-hint"/), 'aucun endroit pour expliquer un refus');
});

test("l'en-tête de la planche reprend les classes du tableau", () => {
  // Mêmes classes, donc même apparence : deux mises en forme pour le même
  // titre finiraient par diverger, et c'est la planche qui paraîtrait
  // négligée — c'est la sortie que le tableau ne partage pas.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /print-page__header/);
  assert.match(app, /className = 'print-page__title'/);
  assert.match(app, /className = 'print-page__date'/);
  // Et le même calcul de date que le tableau.
  assert.match(app, /formatCaptureDate\(Date\.now\(\), 'datetime'\)/);
});

test("l'en-tête offre la note de collection, sur la planche comme au tableau", () => {
  // Elle s'imprimait dès qu'elle existait : un texte écrit pour soi se
  // retrouvait sur chaque page, sans moyen de l'enlever. Cochée par défaut,
  // pour que rien ne change pour qui ne touche à rien.
  for (const id of ['sheet-header-note', 'table-title-note']) {
    const case_ = html.match(new RegExp(`<input id="${id}"[^>]*>`));
    assert.ok(case_, `aucune case « note » pour ${id}`);
    assert.match(case_[0], /checked/, 'la note s\'imprimait déjà : le défaut ne doit pas changer');
    assert.doesNotMatch(case_[0], /disabled/, 'la disponibilité se règle au rendu, pas dans le balisage');
  }

  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  // Les deux en-têtes suivent la même règle, et lisent la même note.
  assert.match(app, /note !== '' && el\.sheetHeaderNote\.checked/);
  assert.match(app, /note !== '' && el\.tableTitleNote\.checked/);
  // La case redessine l'aperçu, et son état suit la note à la frappe.
  assert.match(app, /el\.sheetHeader, el\.sheetHeaderDate, el\.sheetHeaderNote,/);
  assert.match(app, /el\.tableTitle, el\.tableTitleDate, el\.tableTitleNote/);
});

test('la case « note » est inerte tant qu\'il n\'y a pas de note, et le dit', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /function updateHeaderNoteOptions\(\)/);
  assert.match(app, /const disponible = collectionNote\(\) !== ''/);
  assert.match(app, /box\.disabled = !disponible/);
  // L'état de la case n'est **pas** effacé : le choix doit survivre à une note
  // vidée puis réécrite.
  assert.doesNotMatch(app, /box\.disabled = !disponible;\s*\n\s*box\.checked = false/);
});

test("l'en-tête de la planche vit dans la marge, hors du flux", () => {
  // Les cellules de la planche sont positionnées en absolu aux cotes calculées :
  // un en-tête dans le flux les déplacerait, et la taille des étiquettes
  // dépendrait alors d'une case à cocher.
  const css = readFileSync(join(WEB, 'style.css'), 'utf8');
  const regle = css.match(/\.print-page__header\s*\{([\s\S]*?)\}/);
  assert.ok(regle, 'aucune règle pour l\'en-tête de planche');
  assert.match(regle[1], /position:\s*absolute/);
  assert.match(regle[1], /top:\s*0/);
});

test("l'en-tête n'est dessiné que s'il tient dans la marge", () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /sheetHeaderFits\(\{ marginYMm: layout\.marginYMm \}\)/);
  assert.match(app, /veutEnTete && placeEnTete\.fits/);
  assert.match(app, /el\.sheetHeaderHint\.textContent = veutEnTete && !placeEnTete\.fits/);
});

// ---------------------------------------------------------------------------
// Hiérarchie du panneau de la planche
//
// Les réglages se suivaient à plat — largeur du QR Code, cases de contenu,
// grille, marges, bordure, en-tête — sans que rien ne distingue ce qui décrit la
// **feuille** de ce qui décrit **l'étiquette**. Ces tests tiennent la
// séparation : déplacer un champ d'un groupe à l'autre les fait échouer.
// ---------------------------------------------------------------------------

/** Le contenu d'un groupe de la planche, d'après sa légende. */
function groupePlanche(légende) {
  const marqueur = `<legend data-i18n="${légende}">`;
  const debut = html.indexOf(marqueur);
  assert.ok(debut !== -1, `groupe « ${légende} » introuvable`);
  // Le groupe se termine au fieldset suivant : un autre groupe, ou la fin du
  // panneau. On découpe donc sur la balise ouvrante, jamais sur un texte.
  const suite = html.indexOf('<fieldset class="sheet-group">', debut + marqueur.length);
  const finPanneau = html.indexOf('<!-- Tableau -->', debut);
  return html.slice(debut, suite === -1 ? finPanneau : Math.min(suite, finPanneau));
}

test('le panneau de la planche range la page dans un groupe, et l\'étiquette dans un autre', () => {
  const page = groupePlanche('La page');
  const etiquette = groupePlanche("L'étiquette");

  // Ce qui décide de la **feuille**.
  for (const id of [
    'preset', 'sheet-columns', 'sheet-rows',
    'sheet-margin-x', 'sheet-margin-y', 'sheet-gap-x', 'sheet-gap-y',
    'sheet-offset-x', 'sheet-offset-y', 'sheet-header', 'sheet-header-date',
  ]) {
    assert.ok(page.includes(`id="${id}"`), `${id} n'est pas dans le groupe de la page`);
  }

  // Ce qui décide de **l'étiquette**.
  for (const id of [
    'sheet-qr', 'sheet-font',
    'sheet-title', 'sheet-url', 'sheet-date', 'sheet-date-time', 'sheet-date-index',
    'sheet-border',
  ]) {
    assert.ok(etiquette.includes(`id="${id}"`), `${id} n'est pas dans le groupe de l'étiquette`);
  }
});

test('la page vient avant l\'étiquette, dans l\'ordre du calcul', () => {
  // La taille des étiquettes découle de la grille et des marges : présenter
  // d'abord ce qui se règle en second obligerait à revenir en arrière.
  assert.ok(
    html.indexOf('data-i18n="La page"') < html.indexOf('data-i18n="L\'étiquette"'),
    'le groupe de l\'étiquette précède celui de la page',
  );
});

test('chaque message d\'aide reste dans le groupe qui le concerne', () => {
  // C'est la leçon des lots précédents : un refus expliqué à l'autre bout du
  // panneau ne sert à rien.
  const page = groupePlanche('La page');
  const etiquette = groupePlanche("L'étiquette");
  for (const id of ['sheet-grid-hint', 'sheet-fit-hint', 'sheet-header-hint']) {
    assert.ok(page.includes(`id="${id}"`), `${id} a quitté le groupe de la page`);
  }
  for (const id of ['sheet-qr-info', 'sheet-date-hint']) {
    assert.ok(etiquette.includes(`id="${id}"`), `${id} a quitté le groupe de l'étiquette`);
  }
});

test('les deux groupes se voient sans être lus', () => {
  const css = readFileSync(join(WEB, 'style.css'), 'utf8');
  const regle = css.match(/\.sheet-group\s*\{([\s\S]*?)\}/);
  assert.ok(regle, 'aucune règle pour les groupes de la planche');
  assert.match(regle[1], /border:\s*1px solid var\(--border-line\)/);
  assert.match(regle[1], /flex-direction:\s*column/);
  assert.ok(css.match(/\.sheet-group\s*>\s*legend\s*\{/), 'aucune légende pour les groupes');
});

// ---------------------------------------------------------------------------
// Un couple unique dans l'onglet Niimbot
//
// Il y en avait deux : « Lien à imprimer » et « Copies » d'un côté, « Quels
// liens » et « Exemplaires de chacun » de l'autre, plus deux boutons. Quatre
// champs répondaient à deux questions, et rien ne disait lesquels allaient avec
// quel bouton.
// ---------------------------------------------------------------------------

test("l'onglet Niimbot n'a plus qu'un sélecteur, un compteur et un bouton", () => {
  const panneau = html.slice(
    html.indexOf('data-mode-panel="single"'),
    html.indexOf('data-mode-panel="images"'),
  );

  // Ce qui doit exister.
  assert.match(panneau, /<select id="label-link"/);
  assert.match(panneau, /<input id="copies"/);
  assert.match(panneau, /<button id="print-label"/);

  // Ce qui ne doit plus : les doublons de la série.
  for (const disparu of ['print-scope', 'print-copies', 'print-all-labels']) {
    assert.doesNotMatch(panneau, new RegExp(`id="${disparu}"`), `${disparu} est encore là`);
  }
});

test('le couple est sur une même ligne, et le libellé dit ce qu\'il fait', () => {
  // C'était la demande : « mettre sur la même ligne le dropdown Lien à imprimer
  // et dropdown imprimer en série et exemplaires de chacun ».
  const panneau = html.slice(
    html.indexOf('data-mode-panel="single"'),
    html.indexOf('data-mode-panel="images"'),
  );
  const ligne = panneau.match(/<div class="fields">\s*<label class="field">\s*<span class="field__label" data-i18n="Ce qu'on imprime"[\s\S]*?<\/div>/);
  assert.ok(ligne, 'les deux champs ne sont pas sur la même ligne');
  assert.match(ligne[0], /id="label-link"/);
  assert.match(ligne[0], /id="copies"/);
  assert.match(ligne[0], /data-i18n="Exemplaires"/);
});

test('le sélecteur range un lien à la fois et les portées multiples', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  // Deux groupes dans une seule liste : la séparation se voit, et une seule
  // réponse est attendue.
  assert.match(app, /document\.createElement\('optgroup'\)/);
  assert.match(app, /un\.label = t\('Un seul lien'\)/);
  assert.match(app, /plusieurs\.label = t\('Plusieurs'\)/);
});

test('une seule fonction résout ce qui sera imprimé', () => {
  // La série et l'étiquette unique passent par le même chemin : deux
  // résolutions séparées auraient fini par répondre différemment à la même
  // question.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /function impressionChoisie\(\)/);
  assert.match(app, /function chosenLabelLink\(\) \{\s*return impressionChoisie\(\)\.items\[0\]/);
  // Un seul gestionnaire de bouton.
  assert.match(app, /el\.printLabel\.addEventListener\('click'/);
  assert.doesNotMatch(app, /addEventListener\('click', printOneLabel\)/);
  assert.doesNotMatch(app, /addEventListener\('click', printAllLabels\)/);
});

test('le bouton unique porte le libellé de ce qui sortira', () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /el\.printLabel\.textContent = total === 0/);
  assert.match(app, /'Imprimer \{count\} étiquette', 'Imprimer \{count\} étiquettes'/);
  // Et il devient l'arrêt pendant une série : il n'y a plus deux boutons dont
  // l'un devient l'autre.
  assert.match(app, /el\.printLabel\.textContent = t\('Arrêter'\)/);
});

// ---------------------------------------------------------------------------
// L'aperçu, et la mise en page qui le porte
//
// Trois défauts mesurés dans Chrome, corrigés ensemble parce qu'ils se
// mesuraient au même endroit : l'aperçu n'occupait que 74 % de la place offerte,
// les libellés d'onglets passaient à la ligne entre 900 et 1100 px de fenêtre, et
// la page débordait horizontalement sous 448 px.
// ---------------------------------------------------------------------------

test("l'aperçu prend la place offerte, sans dépasser la taille réelle", () => {
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  // Le plafond de 0,6 faisait qu'une A4 n'occupait jamais plus de 476 px.
  assert.doesNotMatch(app, /Math\.min\(0\.6,/);
  assert.match(app, /const scale = Math\.min\(1, available \/ tailleReelle\)/);
  // Et les trois rendus qui mettent à l'échelle partagent la même mesure.
  const usages = [...app.matchAll(/largeurUtileApercu\(\)/g)].length;
  assert.ok(usages >= 3, `seulement ${usages} usage(s) de la largeur utile`);
});

test("la largeur utile est mesurée avant que l'aperçu ne soit vidé", () => {
  // C'est une boucle de rétroaction, mesurée dans Chrome : vider l'aperçu fait
  // disparaître sa barre de défilement, donc la largeur augmente de quinze
  // pixels ; l'échelle était calculée sur cette largeur-là, le contenu rappelait
  // la barre, et le cadre restait plus large que la place — 685 px dessinés pour
  // 670 offerts, de façon stable, un redimensionnement n'y changeant rien.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  const mesure = app.indexOf('largeurApercuRendue = previewViewportWidth();');
  const vidage = app.indexOf("el.preview.textContent = '';");
  assert.ok(mesure !== -1, 'la largeur utile n\'est pas mesurée');
  assert.ok(vidage !== -1, 'l\'aperçu n\'est pas vidé');
  assert.ok(mesure < vidage, 'la largeur est mesurée après le vidage : la barre de défilement manque');
  // Et elle n'est mesurée qu'une fois par rendu.
  assert.equal(
    [...app.matchAll(/largeurApercuRendue = previewViewportWidth\(\)/g)].length, 1,
    'la largeur est remesurée en cours de rendu',
  );
});

test("l'aperçu se recale quand sa propre largeur change", () => {
  // Une barre de défilement qui apparaît retire une quinzaine de pixels sans
  // provoquer d'événement `resize` sur la fenêtre.
  const app = readFileSync(join(WEB, 'app.js'), 'utf8');
  assert.match(app, /new ResizeObserver\(/);
  assert.match(app, /observateur\.observe\(el\.preview\)/);
  // Et l'observateur ne se rappelle pas lui-même : il ne redessine que si la
  // largeur a réellement changé.
  assert.match(app, /Math\.abs\(previewViewportWidth\(\) - largeurApercuRendue\) < 1/);
});

test('la bande d\'onglets se replie, et non ses libellés', () => {
  // Quatre onglets à un quart de 400 px : « Étiquette (divers) » passait à deux
  // lignes à l'intérieur de sa case, 43 px de haut au lieu de 29.
  const css = readFileSync(join(WEB, 'style.css'), 'utf8');
  const bande = css.match(/\.tabs\s*\{([\s\S]*?)\}/)[1];
  assert.match(bande, /flex-wrap:\s*wrap/);
  const onglet = css.match(/\.tab\s*\{([\s\S]*?)\}/)[1];
  assert.match(onglet, /flex:\s*1 1 auto/);
  assert.match(onglet, /white-space:\s*nowrap/);
});

test('les colonnes de la mise en page peuvent rétrécir', () => {
  // `1fr` vaut `minmax(auto, 1fr)` : son minimum est le contenu minimal, et la
  // page débordait de 83 px sous 448 px de fenêtre.
  const css = readFileSync(join(WEB, 'style.css'), 'utf8');
  const mobile = css.match(/@media \(max-width: 900px\)\s*\{([\s\S]*?)\n\}/)[1];
  assert.match(mobile, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.doesNotMatch(mobile, /grid-template-columns:\s*1fr;/);

  // Et les boîtes flexibles qui portent le contenu portent aussi leur minimum.
  for (const selecteur of ['\\.panel\\s*\\{', '\\.sheet-group\\s*\\{']) {
    const regle = css.match(new RegExp(`${selecteur}([\\s\\S]*?)\\}`))[1];
    assert.match(regle, /min-width:\s*0/, `${selecteur} n'a pas de minimum à zéro`);
  }
});
