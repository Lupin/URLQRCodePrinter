/**
 * Le socle de jetons est-il le même des deux côtés, et tient-il ses promesses ?
 *
 * La fenêtre de l'extension et l'application qu'elle ouvre sont deux faces du
 * même outil : l'une collecte, l'autre imprime. Elles vivent dans deux feuilles
 * distinctes — le build les livre séparément — donc rien n'empêche leurs
 * couleurs de diverger en silence. Ce test est le seul mécanisme qui l'empêche.
 *
 * Le système est **clair uniquement**, aligné sur la palette de la maison :
 *
 * - cinq neutres (`#f5f5f5`, `#ffffff`, `#0f0e12`, `#e5e5e5`, `#b2b2b2`) ;
 * - une seule teinte d'action, l'orange pur `#ff5000`, avec du texte blanc ;
 * - des états aux couleurs de la maison : rouge `#b81d13`, ambre `#fab413`,
 *   vert `#006837`, bleu de lien `#0071bb` ;
 * - **aucune surface noire** : le noir est une encre, jamais un fond de travail ;
 * - **aucun fond pastel** : une sélection se dit par un filet et une case, pas
 *   par une teinte diluée.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POPUP = readFileSync(join(ROOT, 'src', 'extension-src', 'popup.css'), 'utf8');
const PRIVACY = readFileSync(join(ROOT, 'src', 'extension-src', 'privacy.css'), 'utf8');
const BACKGROUND = readFileSync(join(ROOT, 'src', 'extension-src', 'background.js'), 'utf8');
const APP = readFileSync(join(ROOT, 'src', 'web', 'style.css'), 'utf8');
const APP_HTML = readFileSync(join(ROOT, 'src', 'web', 'index.html'), 'utf8');
const APP_JS = readFileSync(join(ROOT, 'src', 'web', 'app.js'), 'utf8');

/**
 * La feuille de l'application, sans ses commentaires et sans sa partie papier.
 */
const APP_CODE_BEFORE_PRINT = APP.replace(/\/\*[\s\S]*?\*\//g, '').split('@media print')[0];

/** Les règles d'écran seules : la planche d'étiquettes commence à `.print-root`. */
const APP_ECRAN = APP_CODE_BEFORE_PRINT.split('.print-root')[0];

// ---------------------------------------------------------------------------
// Lecture des jetons
// ---------------------------------------------------------------------------

function linearise(canal) {
  const c = canal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

function contraste(a, b) {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}

function jetons(source) {
  const table = {};
  for (const [, nom, valeur] of source.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    table[nom] = valeur.trim();
  }
  return table;
}

function resoudre(table, nom, vus = new Set()) {
  const valeur = table[nom];
  if (valeur === undefined) throw new Error(`jeton absent : --${nom}`);
  const reference = valeur.match(/^var\(--([\w-]+)\)$/);
  if (!reference) return valeur;
  if (vus.has(nom)) throw new Error(`cycle de jetons autour de --${nom}`);
  vus.add(nom);
  return resoudre(table, reference[1], vus);
}

const app = jetons(APP.match(/:root\s*\{([\s\S]*?)\}/)[1]);
const popup = jetons(POPUP.match(/:root\s*\{([\s\S]*?)\}/)[1]);

// ---------------------------------------------------------------------------
// Identité des jetons partagés
// ---------------------------------------------------------------------------

/**
 * Jetons que les deux feuilles doivent déclarer à l'identique.
 *
 * Les noms de typographie diffèrent (`--font` / `--font-ui`, tailles en px / en
 * rem) : ce sont deux surfaces de lecture, pas deux produits.
 */
const PARTAGES = [
  'canvas-mist',
  'pure-white',
  'ink-black',
  'carbon',
  'steel-gray',
  'graphite',
  'bg',
  'surface-1',
  'surface',
  'surface-2',
  'desk',
  'text',
  'text-2',
  'text-3',
  'action',
  'action-hover',
  'action-ink',
  'link',
  'link-hover',
  'danger',
  'warn',
  'warn-ink',
  'ok',
  'accent',
  'accent-ink',
  'accent-hover',
  'ink',
  'ink-ink',
  'ink-hover',
  'border-line',
  'border-strong',
  'border-control',
  'focus',
  'focus-fill',
  'radius',
  'motion',
];

test('les jetons partagés sont identiques dans les deux feuilles', () => {
  const écarts = [];
  for (const nom of PARTAGES) {
    const fenêtre = popup[nom];
    const application = app[nom];
    if (fenêtre === undefined) écarts.push(`absent de popup.css : --${nom}`);
    else if (application === undefined) écarts.push(`absent de web/style.css : --${nom}`);
    else if (fenêtre !== application) {
      écarts.push(`--${nom} : fenêtre « ${fenêtre} » ≠ application « ${application} »`);
    }
  }
  assert.deepEqual(écarts, [], `jetons divergents :\n${écarts.join('\n')}`);
});

test('la palette est exactement celle de la maison', () => {
  assert.equal(app['canvas-mist'], '#f5f5f5');
  assert.equal(app['pure-white'], '#ffffff');
  assert.equal(app['ink-black'], '#0f0e12');
  assert.equal(app['carbon'], '#0f0e12');
  assert.equal(app['steel-gray'], '#e5e5e5');
  assert.equal(app['graphite'], '#b2b2b2');

  // L'action est l'orange pur de la maison, et son encre est blanche.
  assert.equal(app['action'], '#ff5000');
  assert.equal(app['action-ink'], '#ffffff');

  // Les états reprennent les teintes de la maison, pas des teintes inventées.
  assert.equal(app['danger'], '#b81d13');
  assert.equal(app['warn'], '#fab413');
  assert.equal(app['ok'], '#006837');
  assert.equal(app['link'], '#0071bb');

  // Les rôles pointent sur la palette.
  assert.equal(resoudre(app, 'bg').toLowerCase(), '#f5f5f5');
  assert.equal(resoudre(app, 'surface').toLowerCase(), '#ffffff');
  assert.equal(resoudre(app, 'text').toLowerCase(), '#0f0e12');
  assert.equal(resoudre(app, 'border-line').toLowerCase(), '#e5e5e5');
});

test('aucune surface noire, aucun fond pastel', () => {
  // Le noir est une encre : la scène est grise, le pied de page est blanc.
  const surface = APP.match(/^\.stage__surface \{([\s\S]*?)\}/m)[1];
  assert.match(surface, /background:\s*var\(--steel-gray\)/, 'la scène n’est pas grise');

  const pied = APP.match(/^\.app-footer \{([\s\S]*?)\}/m)[1];
  assert.doesNotMatch(pied, /background:\s*var\(--carbon\)/, 'le pied de page est redevenu noir');
  assert.match(pied, /background:\s*var\(--surface\)/, 'le pied de page doit être clair');

  // Les grands plans de l'application sont clairs : canvas, volets, pied.
  assert.match(APP.match(/^body \{([\s\S]*?)\}/m)[1], /background:\s*var\(--bg\)/);
  assert.match(APP.match(/^\.panel \{([\s\S]*?)\}/m)[1], /background:\s*var\(--surface-1\)/);
  // Le carbone n'est plus une surface : aucun `background` ne le prend.
  assert.doesNotMatch(APP_ECRAN, /background(?:-color)?:\s*var\(--carbon\)/);

  // Aucun jeton de fond teinté, ni de teinte diluée pour les sélections.
  for (const [nom, table, source] of [['application', app, APP], ['fenêtre', popup, POPUP]]) {
    assert.equal(table['action-soft'], undefined, `${nom} : fond pastel d'action`);
    assert.equal(table['danger-soft'], undefined, `${nom} : fond pastel de danger`);
    assert.doesNotMatch(source, /--action-soft|--danger-soft/, `${nom} : un fond pastel subsiste`);
  }
});

test('le thème sombre est retiré, pas seulement masqué', () => {
  for (const [nom, source] of [['application', APP], ['fenêtre', POPUP], ['confidentialité', PRIVACY]]) {
    assert.doesNotMatch(source, /prefers-color-scheme:\s*dark/, `${nom} : un thème sombre subsiste`);
    assert.doesNotMatch(source, /color-scheme:\s*dark/i, `${nom} : color-scheme sombre`);
  }
});

// ---------------------------------------------------------------------------
// Contrastes
// ---------------------------------------------------------------------------

const PAIRES = [
  ['texte principal sur le fond', 'text', 'bg', 4.5],
  ['texte principal sur une surface', 'text', 'surface', 4.5],
  ['texte secondaire sur le fond', 'text-2', 'bg', 4.5],
  ['texte secondaire sur une surface', 'text-2', 'surface', 4.5],
  ['texte tertiaire sur le fond', 'text-3', 'bg', 4.5],
  ['texte tertiaire sur une surface', 'text-3', 'surface', 4.5],
  ['texte tertiaire sur un tableau désactivé', 'text-3', 'surface-2', 3],
  ['libellé du bouton principal sur l\'orange', 'action-ink', 'action', 3],
  ['libellé du compteur sur l\'encre', 'ink-ink', 'ink', 4.5],
  ['danger sur le fond', 'danger', 'bg', 4.5],
  ['danger sur une surface', 'danger', 'surface', 4.5],
  ['danger sur un fond de survol neutre', 'danger', 'surface-2', 4.5],
  ['anneau de focus sur le fond', 'focus', 'bg', 3],
  ['anneau de focus sur une surface', 'focus', 'surface', 3],
  ['contour de composant sur le fond', 'border-strong', 'bg', 3],
  ['limite de champ sur une surface', 'border-control', 'surface', 3],
  ['texte principal sur le fond d\'un champ actif', 'text', 'focus-fill', 4.5],
  ['texte secondaire sur le fond d\'un champ actif', 'text-2', 'focus-fill', 4.5],
  ['texte de l\'avertissement sur l\'ambre', 'warn-ink', 'warn', 4.5],
  ['voyant « connecté » sur le fond', 'ok', 'bg', 3],
  ['lien sur une surface', 'link', 'surface', 4.5],
];

test('application : toutes les paires tiennent leur seuil', () => {
  const échecs = [];
  for (const [libellé, dessus, dessous, seuil] of PAIRES) {
    const avant = resoudre(app, dessus);
    const arrière = resoudre(app, dessous);
    const rapport = contraste(avant, arrière);
    if (rapport < seuil) {
      échecs.push(
        `${libellé} : ${rapport.toFixed(2)}:1 (minimum ${seuil}) — ${avant} sur ${arrière}`,
      );
    }
  }
  assert.deepEqual(échecs, [], `contrastes insuffisants :\n${échecs.join('\n')}`);
});

test('le bouton principal garde son texte blanc sur l’orange pur', () => {
  // Choix de marque assumé : l'orange #ff5000 est le signal de la maison, et le
  // texte y est blanc. Le contraste vaut 3,3:1 — le seuil des composants et du
  // grand texte, pas celui du texte courant. C'est une décision de direction,
  // pas un oubli : elle est vérifiée ici pour qu'aucune retouche ne la défasse.
  const rapport = contraste(resoudre(app, 'action-ink'), resoudre(app, 'action'));
  assert.ok(rapport >= 3, `texte blanc sur l'orange : ${rapport.toFixed(2)}:1`);
  assert.match(APP_ECRAN, /--action-ink:\s*#ffffff/);
});

// ---------------------------------------------------------------------------
// Discipline de palette
// ---------------------------------------------------------------------------

test('aucune couleur de la charte n\'est écrite en dur hors impression', () => {
  const teintes = [...APP_ECRAN.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase());
  const autorisées = new Set(
    [...APP_ECRAN.matchAll(/^\s*--[\w-]+:\s*(#[0-9a-fA-F]{6})/gm)].map((m) => m[1].toLowerCase()),
  );
  const cachées = [...new Set(teintes)].filter((t) => !autorisées.has(t));
  assert.deepEqual(cachées, [], `couleurs écrites hors des jetons : ${cachées.join(', ')}`);
});

test('un seul fond coloré : l’action, et jamais sous du texte noir', () => {
  // Toute surface colorée reprend le blanc. Une surface orange avec du texte
  // noir est exactement ce que la maison ne fait pas.
  const fonds = [...APP_ECRAN.matchAll(/background:\s*var\(--(action|accent)\);[\s\S]{0,80}?color:\s*var\(--([\w-]+)\)/g)];
  for (const [, fond, encre] of fonds) {
    assert.match(encre, /action-ink|canvas-mist|pure-white/, `texte ${encre} sur ${fond}`);
  }
});

test('la désactivation ne repose pas sur une opacité', () => {
  const code = APP.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(code, /opacity:\s*0?\.\d+\s*;\s*\n?\s*cursor:\s*(default|not-allowed)/,
    'un état désactivé repose encore sur une opacité');
  assert.match(code, /\.btn:disabled\s*\{[\s\S]*?color:\s*var\(--text-3\)/);
});

test('le survol d\'un bouton secondaire ne reprend jamais une couleur d\'état', () => {
  const règle = APP.match(/\.btn--fill:not\(:disabled\):hover\s*\{([\s\S]*?)\}/);
  assert.ok(règle, 'aucune règle de survol rempli');
  assert.doesNotMatch(règle[1], /var\(--(action|accent|danger|warn|ok)\)/, 'le survol prend une couleur d’état');
});

// ---------------------------------------------------------------------------
// La pastille de la barre d'outils
// ---------------------------------------------------------------------------

function badgeTokens() {
  const table = {};
  for (const [, nom, fond, texte] of BACKGROUND.matchAll(
    /const (BADGE_[A-Z]+) = \{ fond: '(#[0-9a-f]{6})', texte: '(#[0-9a-f]{6})' \}/g,
  )) {
    table[nom] = { fond, texte };
  }
  return table;
}

test('la pastille ne garde aucune trace de l\'ancienne palette', () => {
  const badge = badgeTokens();
  for (const [nom, valeur] of Object.entries(badge)) {
    for (const ancienne of ['#21808d', '#1a1a1a', '#1c7c4a', '#f4f4f4', '#161616', '#b3122b',
      '#c2410c', '#ff5000']) {
      assert.notEqual(valeur.fond.toLowerCase(), ancienne, `${nom} est resté sur l'ancienne palette`);
    }
  }
});

test('la pastille de comptage est à l\'encre de la palette', () => {
  const badge = badgeTokens();
  assert.equal(badge.BADGE_COUNT.fond.toLowerCase(), resoudre(popup, 'ink').toLowerCase());
});

test('le texte du badge tient son seuil sur tous les fonds', () => {
  const badge = badgeTokens();
  for (const nom of ['BADGE_COUNT', 'BADGE_ADDED', 'BADGE_DUPLICATE', 'BADGE_UPDATED', 'BADGE_ERROR']) {
    const etat = badge[nom];
    assert.ok(etat, `${nom} absent`);
    const rapport = contraste(etat.texte, etat.fond);
    assert.ok(rapport >= 4.5, `${nom} : ${rapport.toFixed(2)}:1 sur ${etat.fond}, minimum 4,5:1`);
  }
});

test('les retours du badge reprennent les teintes du système', () => {
  const badge = badgeTokens();
  assert.equal(badge.BADGE_ADDED.fond, app['ok']);
  assert.equal(badge.BADGE_UPDATED.fond, app['ok']);
  assert.equal(badge.BADGE_DUPLICATE.fond, resoudre(popup, 'surface'));
  assert.equal(badge.BADGE_ERROR.fond.toLowerCase(), popup['danger'].toLowerCase());
});

test('un doublon se distingue du compteur au repos', () => {
  const badge = badgeTokens();
  assert.notEqual(badge.BADGE_DUPLICATE.fond, badge.BADGE_COUNT.fond);
  assert.notEqual(badge.BADGE_DUPLICATE.texte, badge.BADGE_COUNT.texte);
});

test('la pastille est reprise au démarrage du service worker', () => {
  const appels = [...BACKGROUND.matchAll(/^refreshBadge\(\);/gm)].length;
  assert.ok(appels >= 1, 'aucune reprise du badge au chargement du service worker');
});

// ---------------------------------------------------------------------------
// Détails de la liste et de la marque
// ---------------------------------------------------------------------------

test("les puces de tag sont plates et sans « # »", () => {
  assert.match(APP_JS, /button\(tag, 'tag'/, 'la puce ne porte plus le tag nu');
  assert.doesNotMatch(APP_JS, /`#\$\{tag\}`/, 'la puce réaffiche le « # »');
  const puce = APP_CODE_BEFORE_PRINT.match(/^\.tag \{([\s\S]*?)\}/m)[1];
  assert.match(puce, /border:\s*0/, "la bordure du navigateur n'est pas annulée");
  assert.match(puce, /font-family:\s*inherit/, "la police du navigateur n'est pas annulée");
});

test("la marque de l'en-tête est l'icône du produit, et elle reste carrée", () => {
  const marque = APP_HTML.match(/<img class="marque"[^>]*>/);
  assert.ok(marque, "aucune marque dans l'en-tête");
  assert.match(marque[0], /aria-hidden="true"/);
  assert.match(marque[0], /src="icons\/icon-32\.png"/);

  const regle = APP_CODE_BEFORE_PRINT.match(/\.marque\s*\{([\s\S]*?)\}/);
  assert.ok(regle, 'aucune règle .marque');
  assert.match(regle[1], /width:/, 'la marque ne tient pas sa place');
  assert.match(regle[1], /height:/, 'la marque ne tient pas sa place');
  const rayon = regle[1].match(/border-radius:\s*([^;]+);/);
  if (rayon) assert.match(rayon[1].trim(), /^(0|var\(--radius\))$/, 'rayon hors système sur la marque');

  assert.ok(
    APP_HTML.indexOf('class="marque"') < APP_HTML.indexOf('class="topbar__title"'),
    'la marque est passée après le titre',
  );
});
