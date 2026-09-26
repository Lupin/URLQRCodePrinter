/**
 * Garde-fous d'accessibilité de la fenêtre de l'extension.
 *
 * Ces règles ne sont pas des préférences : elles répondent à des critères
 * WCAG 2.2 AA, et plusieurs d'entre elles corrigent des échecs mesurés dans la
 * version précédente (contour de bouton à 1,36:1, cible de suppression de
 * 19 × 19 px, « Tout effacer » à 2,34:1 au survol en thème sombre).
 *
 * Les contrastes sont recalculés à partir des jetons réellement écrits dans
 * `popup.css` — pas recopiés dans le test. Recopier les valeurs laisserait
 * passer exactement ce qu'on veut attraper : une retouche de teinte qui fait
 * basculer un seuil sans que personne ne s'en aperçoive.
 *
 * Rappel des seuils (inclusifs) : 4,5:1 pour le texte, 3:1 pour les composants
 * non textuels et l'anneau de focus.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = join(ROOT, 'src', 'extension-src');

const css = readFileSync(join(EXT, 'popup.css'), 'utf8');
const html = readFileSync(join(EXT, 'popup.html'), 'utf8');
const script = readFileSync(join(EXT, 'popup.js'), 'utf8');

/**
 * Le CSS privé de ses commentaires.
 *
 * Plusieurs règles interdisent un motif — `--danger-soft`, `outline: none`.
 * Or le fichier *parle* de ces règles pour expliquer pourquoi elles ont été
 * écartées : sans ce nettoyage, la documentation déclencherait le test qu'elle
 * justifie.
 */
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');

// ---------------------------------------------------------------------------
// Contraste
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

/**
 * Résout les `var(--x)` en chaîne, avec un garde-fou contre les cycles.
 * @param {Record<string, string>} table
 * @param {string} nom
 * @param {Set<string>} [vus]
 * @returns {string}
 */
function resoudre(table, nom, vus = new Set()) {
  const valeur = table[nom];
  if (valeur === undefined) throw new Error(`jeton absent : --${nom}`);
  const reference = valeur.match(/^var\(--([\w-]+)\)$/);
  if (!reference) return valeur;
  if (vus.has(nom)) throw new Error(`cycle de jetons autour de --${nom}`);
  vus.add(nom);
  return resoudre(table, reference[1], vus);
}

const blocClair = css.match(/:root\s*\{([\s\S]*?)\}/)[1];
const blocSombre = css.match(
  /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}\s*\}/,
)[1];

const themes = [
  { nom: 'clair', jetons: { ...jetons(blocClair), ...{} } },
  { nom: 'sombre', jetons: { ...jetons(blocClair), ...jetons(blocSombre) } },
];

/**
 * Paires à vérifier, avec le seuil applicable.
 *
 * Le choix des paires suit l'usage réel : un jeton de texte n'est jugé que sur
 * les fonds où il est effectivement posé. Vérifier des combinaisons qui
 * n'existent pas ferait échouer le test pour de mauvaises raisons.
 */
const PAIRES = [
  ['texte principal sur le fond', 'text', 'bg', 4.5],
  ['texte principal sur une surface', 'text', 'surface', 4.5],
  ['texte principal sur une surface survolée', 'text', 'surface-2', 4.5],
  ['texte secondaire sur le fond', 'text-2', 'bg', 4.5],
  ['texte secondaire sur une surface', 'text-2', 'surface', 4.5],
  ['texte tertiaire sur le fond', 'text-3', 'bg', 4.5],
  ['texte tertiaire sur une surface', 'text-3', 'surface', 4.5],
  ['texte tertiaire sur un bouton inactif', 'text-3', 'surface-2', 4.5],
  ['libellé du bouton principal sur l\'accent', 'accent-ink', 'accent', 4.5],
  ['danger sur le fond', 'danger', 'bg', 4.5],
  ['danger sur une surface', 'danger', 'surface', 4.5],
  ['danger sur un fond de survol neutre', 'danger', 'surface-2', 4.5],
  ['libellé du bouton neutre sur l\'encre', 'ink-ink', 'ink', 4.5],
  ['anneau de focus sur le fond', 'focus', 'bg', 3],
  ['anneau de focus sur une surface', 'focus', 'surface', 3],
  ['contour de composant sur le fond', 'border-strong', 'bg', 3],
  ['contour de composant sur une surface', 'border-strong', 'surface', 3],
];

for (const { nom, jetons: table } of themes) {
  test(`thème ${nom} : toutes les paires de couleurs tiennent leur seuil`, () => {
    const échecs = [];

    for (const [libellé, fond, dessus, seuil] of PAIRES) {
      const avant = resoudre(table, fond);
      const arrière = resoudre(table, dessus);
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

test('l\'accent garde une marge et ne tient pas le seuil de justesse', () => {
  // Le badge de la version précédente affichait exactement 4,50:1 : il passait,
  // mais la moindre retouche de teinte le faisait basculer. On exige donc une
  // marge réelle sur le libellé du bouton principal.
  for (const { nom, jetons: table } of themes) {
    const rapport = contraste(
      resoudre(table, 'accent-ink'),
      resoudre(table, 'accent'),
    );
    assert.ok(
      rapport >= 5,
      `thème ${nom} : marge insuffisante sur l'accent (${rapport.toFixed(2)}:1, attendu ≥ 5:1)`,
    );
  }
});

test('aucun fond teinté de danger ne revient dans la palette', () => {
  // Un fond rouge très clair vire au rose : une troisième teinte chaude coincée
  // entre l'orange de l'accent et le rouge de destruction. Trois teintes
  // voisines ne s'ordonnent plus à l'œil. Le danger est donc porté par la
  // bordure, l'icône et le libellé, sur un fond neutre — motif Carbon.
  assert.doesNotMatch(cssCode, /--danger-soft/, 'un jeton de fond teinté subsiste');

  for (const { nom, jetons: table } of themes) {
    assert.equal(table['danger-soft'], undefined, `thème ${nom} : fond teinté présent`);
  }

  // Tout fond posé sous du texte rouge doit être un neutre de la rampe. Le
  // `--surface` de la région d'alerte et le `--surface-2` des survols en font
  // partie ; un jeton teinté, non.
  const fondsDanger = [
    ...cssCode.matchAll(/background:\s*var\((--[\w-]+)\);[\s\S]{0,60}?(?<![\w-])color:\s*var\(--danger\)/g),
  ].map((match) => match[1]);
  assert.ok(fondsDanger.length >= 2, `fonds du danger introuvables : ${fondsDanger.join(', ')}`);
  for (const jeton of fondsDanger) {
    assert.ok(
      ['--surface', '--surface-2', '--bg'].includes(jeton),
      `fond non neutre sous du texte rouge : ${jeton}`,
    );
  }
});

// ---------------------------------------------------------------------------
// Cibles et focus
// ---------------------------------------------------------------------------

test('le bouton de suppression atteint la cible minimale de 24 px', () => {
  // 2.5.8 Target Size (Minimum) : 24 × 24 px. La version précédente mesurait
  // environ 19 × 19 px (glyphe de 15 px plus 4 px de rembourrage vertical).
  const regle = css.match(/\.item__remove\s*\{([\s\S]*?)\}/)[1];
  const largeur = Number(regle.match(/width:\s*(\d+)px/)?.[1]);
  const hauteur = Number(regle.match(/height:\s*(\d+)px/)?.[1]);

  assert.ok(largeur >= 24, `largeur trop faible : ${largeur}px`);
  assert.ok(hauteur >= 24, `hauteur trop faible : ${hauteur}px`);
});

test('les boutons gardent une hauteur minimale confortable', () => {
  const regle = css.match(/\.btn\s*\{([\s\S]*?)\}/)[1];
  const hauteur = Number(regle.match(/min-height:\s*(\d+)px/)?.[1]);
  assert.ok(hauteur >= 24, `min-height trop faible : ${hauteur}px`);
});

test("l'anneau de focus n'est jamais supprimé", () => {
  // Retirer le contour sans le remplacer cumule trois échecs : 1.4.11, 2.4.7
  // et 2.4.13. On vérifie donc qu'un anneau est bien déclaré, et qu'aucune
  // règle ne le supprime.
  assert.match(css, /outline:\s*2px solid var\(--focus\)/, 'anneau de focus absent');
  assert.doesNotMatch(cssCode, /outline:\s*(none|0)\b/, 'un anneau a été supprimé');
});

test('les éléments de la liste rentrent leur anneau pour ne pas être rognés', () => {
  // La liste défile : un anneau extérieur est coupé sur la première et la
  // dernière ligne.
  assert.match(
    css,
    /\.item__remove:focus-visible,[\s\S]*?outline-offset:\s*-2px/,
    "l'anneau des lignes de la liste doit être rentré",
  );
});

// ---------------------------------------------------------------------------
// États et préférences système
// ---------------------------------------------------------------------------

test('la désactivation ne repose plus sur une opacité', () => {
  // `opacity: .45` rendait les libellés inactifs illisibles. L'état doit venir
  // de jetons qui restent lisibles.
  const regles = [...css.matchAll(/:disabled[^{]*\{([\s\S]*?)\}/g)].map((m) => m[1]);
  assert.ok(regles.length > 0, 'aucune règle :disabled trouvée');
  for (const regle of regles) {
    assert.doesNotMatch(regle, /opacity/, `opacité sur un état désactivé : ${regle.trim()}`);
  }
});

test('le mouvement réduit est respecté', () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('le mode contraste forcé est pris en charge', () => {
  // En contraste forcé, les bordures colorées disparaissent : sans ce bloc, les
  // limites de composants s'évanouissent.
  assert.match(css, /@media\s*\(forced-colors:\s*active\)/);
  assert.match(css, /CanvasText|Highlight/);
});

test('un contraste renforcé est proposé', () => {
  assert.match(css, /@media\s*\(prefers-contrast:\s*more\)/);
});

test('la typographie est en rem, pas en pixels', () => {
  // 1.4.4 Redimensionnement du texte : une échelle en `px` ignore le réglage
  // « taille de police » du navigateur.
  for (const [, valeur] of css.matchAll(/--type-[\w-]+:\s*([^;]+);/g)) {
    assert.match(valeur.trim(), /rem$/, `taille de police en unité fixe : ${valeur}`);
  }
});

// ---------------------------------------------------------------------------
// Structure de la page
// ---------------------------------------------------------------------------

test('la fenêtre expose un seul repère principal et un seul pied', () => {
  // La version précédente empilait deux `<footer>` — donc deux repères
  // `contentinfo` — et n'avait aucun `<main>`.
  const compter = (balise) => (html.match(new RegExp(`<${balise}\\b`, 'g')) ?? []).length;
  assert.equal(compter('main'), 1, 'il faut exactement un <main>');
  assert.equal(compter('footer'), 1, 'il faut exactement un <footer>');
  assert.equal(compter('header'), 1, 'il faut exactement un <header>');
});

test('le compteur annonce un nombre et son unité', () => {
  assert.match(html, /id="count"[^>]*>0</, 'le chiffre doit être seul dans #count');
  assert.match(html, /id="count-unit"/, "l'unité doit accompagner le nombre");
  assert.match(html, /role="status"[^>]*aria-live="polite"/, 'le compteur doit être une région live');
  assert.match(html, /aria-atomic="true"/, "l'annonce doit être atomique");
});

test("l'échec de démarrage a sa propre région d'alerte", () => {
  assert.match(html, /id="startup-error"[^>]*role="alert"/);
  assert.match(script, /el\.startupError\.hidden = false/);
});

test('chaque titre de section est relié à sa liste', () => {
  assert.match(html, /id="collection-title"/);
  assert.match(html, /<ul id="list"[^>]*aria-labelledby="collection-title"/);
});

test('les boutons de la fenêtre déclarent leur type', () => {
  // Sans `type="button"`, un bouton placé dans un formulaire le soumettrait.
  const boutons = [...html.matchAll(/<button\b([^>]*)>/g)];
  assert.ok(boutons.length > 0);
  for (const [, attributs] of boutons) {
    assert.match(attributs, /type="button"/, `bouton sans type : <button${attributs}>`);
  }
});

// ---------------------------------------------------------------------------
// Comportement
// ---------------------------------------------------------------------------

test('une seule action de navigation par ligne', () => {
  // L'adresse n'est plus un second lien vers la même destination : deux liens
  // identiques font deux arrêts de tabulation pour une seule action.
  assert.match(script, /url\.className = 'item__url'/, "l'adresse doit être un simple texte");
  assert.doesNotMatch(script, /externalLink\(link\.url, 'item__url'\)/);
});

test("l'ouverture dans un nouvel onglet est annoncée", () => {
  assert.match(script, /\(ouvre un nouvel onglet\)/);
});

test('le focus est reposé après une suppression', () => {
  // Sans cela, le bouton focalisé disparaît et le focus repart sur <body>.
  assert.match(script, /function focusAfterRemoval/);
  assert.match(script, /focusAfterRemoval\(index\)/);
  assert.match(script, /\.focus\(\)/, 'aucune reprise de focus');
});

test('le bouton de suppression ne dépend plus d\'un glyphe texte', () => {
  // `✕` n'a ni la même chasse ni le même centrage selon la plateforme : la
  // cible changeait de taille d'un système à l'autre. Le dessin est désormais
  // un tracé vectoriel, de géométrie identique partout.
  assert.doesNotMatch(script, /remove\.textContent/);
  assert.match(script, /remove\.append\(icon\('remove'\)\)/);
});

test('les icônes sont décoratives et le nom reste sur le bouton', () => {
  // Un dessin annoncé en plus de son bouton ferait bégayer le lecteur d'écran :
  // le tracé est `aria-hidden`, le nom accessible vient du bouton.
  assert.match(script, /svg\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(script, /remove\.setAttribute\('aria-label'/);
  assert.match(css, /\.icon\s*\{[\s\S]*?width:\s*16px/);
});

test('aucune donnée de page ne passe par innerHTML', () => {
  // Les titres viennent de sites tiers : les injecter comme HTML dans une page
  // privilégiée ouvrirait une faille. On retire d'abord les commentaires — le
  // fichier *parle* de la règle, il ne doit pas pour autant la déclencher.
  const code = script
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  assert.doesNotMatch(code, /innerHTML/);
  assert.doesNotMatch(code, /insertAdjacentHTML/);
  assert.doesNotMatch(code, /outerHTML/);
});

test("la fenêtre porte l'accent même quand son action principale est désactivée", () => {
  // L'accent n'était porté que par « Ajouter cette page ». Sur une page non
  // capturable — `brave://extensions`, un nouvel onglet — le bouton est
  // désactivé, donc gris, et la fenêtre entière paraissait sans couleur. On
  // exige donc un second porteur, toujours affiché : le compteur.
  const compteur = cssCode.match(/\.count\s*\{([\s\S]*?)\}/)[1];
  assert.match(compteur, /background:\s*var\(--accent\)/, 'le compteur ne porte pas l\'accent');
  assert.match(compteur, /color:\s*var\(--accent-ink\)/);

  // Et l'action principale le porte aussi : c'est le couple que décrit
  // `craft/color.md` — une puce et une action principale, pas l'une ou l'autre.
  const action = cssCode.match(/\.btn--primary\s*\{([\s\S]*?)\}/)[1];
  assert.match(action, /background:\s*var\(--accent\)/);
});

test("l'accent n'est pas porté par plus de deux éléments visibles", () => {
  // `craft/color.md` : « au plus 2 usages visibles de --accent par écran ».
  // Le plafond compte autant que le plancher : c'est la surutilisation de
  // l'accent qui rend une interface illisible.
  const porteurs = [...cssCode.matchAll(/background:\s*var\(--accent\)/g)].length;
  assert.ok(porteurs <= 2, `trop de porteurs de l'accent : ${porteurs}`);
});

// ---------------------------------------------------------------------------
// Le titre, et le lien vers la page d'information
// ---------------------------------------------------------------------------

test('le titre est modifiable avant l\'enregistrement', () => {
  // Sans champ, le titre partait tel quel dans la collection et il fallait
  // rouvrir l'application pour le corriger. Le champ est le seul endroit où
  // l'utilisateur peut nommer ce qu'il collecte au moment où il le collecte.
  assert.match(html, /<input id="link-title"/, 'aucun champ de titre');
  assert.match(script, /captureTitle: document\.getElementById\('link-title'\)/);
  // Le titre enregistré vient du champ, pas de l'onglet.
  assert.match(script, /const saisi = el\.captureTitle \? el\.captureTitle\.value : activeTab\.title/);
  assert.match(script, /captureFromTab\(\{ url: activeTab\.url, title: saisi \}\)/);
});

test('le champ du titre n\'est actif que si la page est capturable', () => {
  // Un champ ouvert sur une page non enregistrable inviterait à saisir un titre
  // qui ne partirait nulle part.
  const bloc = script.slice(script.indexOf('async function loadActiveTab'));
  assert.match(bloc, /el\.captureTitle\.disabled = false/);
  assert.match(bloc, /el\.captureTitle\.disabled = true/);
});

test('la borne du champ vient de la constante qui borne les titres', () => {
  // Deux valeurs écrites séparément finiraient par diverger, et la saisie se
  // ferait couper sans que rien ne l'annonce.
  const lien = readFileSync(join(ROOT, 'src', 'core', 'link.js'), 'utf8');
  const borne = Number(lien.match(/export const DEFAULT_TITLE_MAX = (\d+)/)[1]);
  assert.match(script, /el\.captureTitle\.maxLength = DEFAULT_TITLE_MAX/);
  assert.match(html, new RegExp(`id="link-title"[^>]*maxlength="${borne}"`));
});

test('le titre saisi reste annoncé par une étiquette, même invisible', () => {
  // L'étiquette est visuellement masquée — le contexte de la fenêtre dit déjà de
  // quoi il s'agit — mais elle existe : sans elle, le champ serait annoncé
  // « champ de saisie » et rien de plus.
  const debut = html.lastIndexOf('<label', html.indexOf('id="link-title"'));
  const bloc = html.slice(debut, html.indexOf('id="link-title"'));
  assert.match(bloc, /data-i18n="Titre du lien"/, 'aucune étiquette pour le champ');
  assert.match(bloc, /class="sr-only"/, 'étiquette non masquée : elle doublerait ce qui est déjà écrit');
});

test('le lien vers la page d\'information suit la langue de l\'interface', () => {
  // La page française vit à la racine du site, l'anglaise sous /en/. Une adresse
  // écrite en dur enverrait la moitié des utilisateurs sur la mauvaise page.
  assert.match(html, /<a id="site-link"/, 'aucun lien vers le site');
  assert.match(script, /https:\/\/lupin\.github\.io\/URLQRCodePrinter\//);
  assert.match(script, /https:\/\/lupin\.github\.io\/URLQRCodePrinter\/en\//);
  assert.match(script, /link\.href = SITE_URLS\[getLocale\(\)\]/);
  // Posée par le script : c'est la seule façon de tenir compte de la langue.
  assert.doesNotMatch(html, /href="https:\/\/lupin\.github\.io/, 'adresse en dur dans le balisage');
});

test('le lien du pied ouvre un nouvel onglet, et le dit', () => {
  assert.match(html, /id="site-link"[^>]*target="_blank"/);
  assert.match(html, /id="site-link"[^>]*rel="noopener noreferrer"/);
  assert.match(script, /\(ouvre un nouvel onglet\)/);
});

test('le lien du pied n\'ajoute pas un troisième porteur de l\'accent', () => {
  // Le plafond de deux usages visibles est déjà atteint par le compteur et
  // l'action principale. Un lien n'est pas une action : il ne prend pas
  // l'accent, et le test précédent compte les porteurs.
  const regle = cssCode.match(/\.site-link\s*\{([\s\S]*?)\}/)[1];
  assert.doesNotMatch(regle, /var\(--accent\)/);
  assert.match(regle, /color:\s*var\(--text-2\)/);
});

test('aucun identifiant n\'est porté par deux éléments du balisage', () => {
  // Un identifiant en double ne casse rien visiblement, et casse tout
  // silencieusement : `getElementById` rend le premier trouvé, et un
  // `aria-labelledby` peut désigner le mauvais nœud. Le cas s'est produit en
  // ajoutant le champ du titre, qui a d'abord repris l'identifiant du titre de
  // section — `el.captureTitle` désignait alors un `<h2>`, et rien ne le disait.
  const identifiants = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const vus = new Set();
  const doubles = identifiants.filter((id) => (vus.has(id) ? true : (vus.add(id), false)));
  assert.deepEqual(doubles, [], `identifiants en double : ${doubles.join(', ')}`);
});

test('chaque identifiant lu par le script existe dans le balisage', () => {
  // Le contrôle inverse : un `getElementById` sur un identifiant absent rend
  // `null`, et le défaut n'apparaît qu'à l'usage, sur le chemin concerné.
  const lus = [...script.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  const presents = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const manquants = [...new Set(lus)].filter((id) => !presents.has(id));
  assert.deepEqual(manquants, [], `identifiants absents du balisage : ${manquants.join(', ')}`);
});
