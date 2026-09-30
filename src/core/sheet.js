/**
 * Géométrie des planches d'impression.
 *
 * Calcule où tombe chaque étiquette sur une feuille (A4 le plus souvent), en
 * millimètres. Le rendu s'appuie ensuite sur ces positions : c'est ce qui
 * permet d'imprimer sur une planche d'étiquettes autocollantes sans décalage
 * cumulatif, contrairement à une grille CSS dont les arrondis dérivent.
 */

import { wrapText } from './label.js';
import { t } from './i18n.js';

/** Dimensions des formats papier courants, en millimètres. */
export const PAGE_SIZES = Object.freeze({
  a4: { widthMm: 210, heightMm: 297, label: 'A4 (210 × 297 mm)' },
  a5: { widthMm: 148, heightMm: 210, label: 'A5 (148 × 210 mm)' },
  letter: { widthMm: 215.9, heightMm: 279.4, label: 'Letter (8,5 × 11 po)' },
});

/**
 * Familles de dispositions, dans l'ordre d'affichage.
 *
 * Le regroupement n'est pas cosmétique : une planche générique se règle à la
 * main, une planche Avery se choisit par sa référence imprimée sur l'emballage.
 * Ce ne sont pas les mêmes gestes.
 */
export const SHEET_GROUPS = Object.freeze([
  { id: 'generic', label: 'Dispositions génériques' },
  { id: 'avery-a4', label: 'Avery — A4' },
  { id: 'avery-letter', label: 'Avery — Letter (US)' },
]);

/**
 * Dispositions d'étiquettes.
 *
 * **`marginXMm` et `marginYMm` sont les distances du bord gauche et du bord
 * haut au coin de la première étiquette** — pas des marges symétriques. C'est
 * ainsi que les fabricants publient leurs cotes, et c'est la seule convention
 * qui décrive une planche réelle : sur une L7160, il y a 8,6 mm à gauche et
 * 5,1 mm à droite. Un modèle symétrique perdrait une colonne entière.
 *
 * Les dispositions génériques sont des points de départ géométriquement
 * valides, et **leur écart est le même dans les deux sens** : c'est ce qui se
 * voit sur une planche, et rien ne l'imposait — aucune référence du commerce ne
 * les définit. L'écart unique et la marge unique se déduisent alors de la page
 * et de la grille : `n` colonnes de largeur `w`, `r` rangées de hauteur `h`,
 * `g` d'écart partout et `m` de marge partout donnent
 * `2g + 2m = W - n·w` et `r·g + 2m = H - r·h` — deux équations, deux inconnues,
 * une seule solution. Elle n'existe que si la marge reste positive : pour
 * `a4-qr-3x4` (60 mm de haut, quatre rangées), elle vaut −12 mm, et l'écart y
 * est donc égal sans que les marges puissent l'être.
 *
 * Les dispositions `avery-*`, elles, gardent leurs cotes : sur une planche
 * prédécoupée, l'écart vertical vaut zéro parce que les rangées se touchent, et
 * l'égaliser décalerait les étiquettes par rapport au papier. Les dispositions `avery-*` reproduisent les cotes publiées pour ces
 * références : largeur et hauteur d'étiquette, marge haute et gauche, et pas
 * horizontal et vertical. `declaredColumns` et `declaredRows` portent le nombre
 * d'étiquettes annoncé pour cette référence, et servent aux tests, qui le
 * **confrontent à la géométrie** : un préréglage qui ne place pas le nombre
 * annoncé est un préréglage faux. Les appeler `columns`/`rows` serait un piège :
 * `computeSheet` y verrait une grille explicite à honorer telle quelle, et le
 * test deviendrait circulaire.
 *
 * Source des cotes commerciales : les fiches de gabarit publiées pour ces
 * références (voir `test/sheet.test.js`, qui vérifie que la grille calculée
 * correspond au nombre d'étiquettes par feuille annoncé). Une planche
 * autocollante reste sensible au passage papier de chaque imprimante : les
 * décalages `offsetXMm` / `offsetYMm` servent à corriger ce qui reste.
 */
/**
 * La disposition proposée d'emblée.
 *
 * **3 × 4 sur une A4**, et non 3 × 8 : huit rangées ne laissent que 33,9 mm de
 * haut, où le QR Code et deux lignes de texte se disputent la place — chaque
 * réglage en corrige un autre, et l'étiquette finit par être coupée. Quatre
 * rangées donnent 69,1 mm : le QR Code tient à sa taille lisible et le texte
 * garde ses lignes. Moins d'étiquettes par page, mais des étiquettes qui
 * s'impriment.
 */
export const DEFAULT_SHEET_PRESET = 'a4-3x4';

export const SHEET_PRESETS = Object.freeze({
  // --- Dispositions génériques ---------------------------------------------
  'a4-3x4': {
    label: 'A4 — 3 × 4 (63,5 × 69,1 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 4,
    labelWidthMm: 63.5,
    labelHeightMm: 69.06,
    marginXMm: 8.5,
    marginYMm: 8.5,
    gapXMm: 1.25,
    gapYMm: 1.25,
  },
  'a4-3x8': {
    label: 'A4 — 3 × 8 (63,5 × 33,9 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginXMm: 8.5,
    marginYMm: 8.5,
    gapXMm: 1.25,
    gapYMm: 1.25,
  },
  'a4-2x7': {
    label: 'A4 — 2 × 7 (99,1 × 38,1 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginXMm: 4.05,
    marginYMm: 4.05,
    gapXMm: 3.7,
    gapYMm: 3.7,
  },
  'a4-4x10': {
    label: 'A4 — 4 × 10 (48 × 25 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 4,
    declaredRows: 10,
    labelWidthMm: 48,
    labelHeightMm: 25,
    marginXMm: 1.75,
    marginYMm: 1.75,
    gapXMm: 4.8,
    gapYMm: 4.8,
  },
  'a4-qr-3x4': {
    label: 'A4 — 3 × 4 grandes étiquettes QR Code (60 × 60 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 4,
    labelWidthMm: 60,
    labelHeightMm: 60,
    marginXMm: 10,
    marginYMm: 21,
    gapXMm: 5,
    gapYMm: 5,
  },

  // --- Avery A4 -------------------------------------------------------------
  // Le pas horizontal vaut 66,4 mm pour 63,5 mm d'étiquette : 2,9 mm d'écart.
  'avery-l7160': {
    label: 'Avery L7160 — 3 × 7 (63,5 × 38,1 mm)',
    group: 'avery-a4',
    reference: 'L7160',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 7,
    labelWidthMm: 63.5,
    labelHeightMm: 38.1,
    marginXMm: 8.6,
    marginYMm: 15.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7159': {
    label: 'Avery L7159 — 3 × 8 (63,5 × 33,9 mm)',
    group: 'avery-a4',
    reference: 'L7159',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginXMm: 8.6,
    marginYMm: 13.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7162': {
    label: 'Avery L7162 — 2 × 8 (99,1 × 33,9 mm)',
    group: 'avery-a4',
    reference: 'L7162',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 8,
    labelWidthMm: 99.1,
    labelHeightMm: 33.9,
    marginXMm: 6.1,
    marginYMm: 13,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'avery-l7163': {
    label: 'Avery L7163 — 2 × 7 (99,1 × 38,1 mm)',
    group: 'avery-a4',
    reference: 'L7163',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginXMm: 6.1,
    marginYMm: 15.1,
    gapXMm: 2.9,
    gapYMm: 0,
  },
  'zweckform-3475': {
    label: 'Avery Zweckform 3475 — 3 × 8 (70 × 36 mm)',
    group: 'avery-a4',
    reference: '3475',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    // 3 × 70 mm = 210 mm : cette planche occupe toute la largeur, sans marge
    // horizontale ni écart entre colonnes.
    labelWidthMm: 70,
    labelHeightMm: 36,
    marginXMm: 0,
    marginYMm: 4.5,
    gapXMm: 0,
    gapYMm: 0,
  },

  // --- Avery Letter (US) ----------------------------------------------------
  // Références historiques 5160 / 5162 / 5163, vendues aussi sous 8160 / 8162 /
  // 8163 : mêmes cotes, seule la découpe diffère.
  'avery-5160': {
    label: 'Avery 5160 / 8160 — 3 × 10 (66,7 × 25,4 mm)',
    group: 'avery-letter',
    reference: '5160',
    page: 'letter',
    declaredColumns: 3,
    declaredRows: 10,
    labelWidthMm: 66.7,
    labelHeightMm: 25.4,
    marginXMm: 4.8,
    marginYMm: 12.7,
    gapXMm: 3.1,
    gapYMm: 0,
  },
  'avery-5162': {
    label: 'Avery 5162 / 8162 — 2 × 7 (101,6 × 33,9 mm)',
    group: 'avery-letter',
    reference: '5162',
    page: 'letter',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 101.6,
    labelHeightMm: 33.9,
    marginXMm: 4,
    marginYMm: 21.2,
    gapXMm: 4.8,
    gapYMm: 0,
  },
  'avery-5163': {
    label: 'Avery 5163 / 8163 — 2 × 5 (101,6 × 50,8 mm)',
    group: 'avery-letter',
    reference: '5163',
    page: 'letter',
    declaredColumns: 2,
    declaredRows: 5,
    labelWidthMm: 101.6,
    labelHeightMm: 50.8,
    marginXMm: 4,
    marginYMm: 12.7,
    gapXMm: 4.8,
    gapYMm: 0,
  },
  'avery-6871': {
    label: 'Avery 6871 — 3 × 6 (60,3 × 31,8 mm)',
    group: 'avery-letter',
    reference: '6871',
    page: 'letter',
    declaredColumns: 3,
    declaredRows: 6,
    // Ici le pas vertical (38,1 mm) dépasse la hauteur d'étiquette : la planche
    // laisse 6,3 mm entre deux rangées.
    labelWidthMm: 60.3,
    labelHeightMm: 31.8,
    marginXMm: 9.5,
    marginYMm: 27.6,
    gapXMm: 8,
    gapYMm: 6.3,
  },
});

/**
 * @typedef {Object} SheetCell
 * @property {number} index  Index global de l'étiquette (0-based).
 * @property {number} page   Numéro de page (0-based).
 * @property {number} column Colonne dans la page (0-based).
 * @property {number} row    Rangée dans la page (0-based).
 * @property {number} xMm    Abscisse du coin supérieur gauche.
 * @property {number} yMm    Ordonnée du coin supérieur gauche.
 */

/**
 * @typedef {Object} SheetLayout
 * @property {number} pageWidthMm
 * @property {number} pageHeightMm
 * @property {number} labelWidthMm
 * @property {number} labelHeightMm
 * @property {number} marginXMm  Marge à gauche de la grille, en millimètres.
 * @property {number} marginYMm  Marge au-dessus de la grille.
 * @property {number} columns
 * @property {number} rows
 * @property {number} perPage
 * @property {number} pages
 * @property {number} count
 * @property {number} capacity
 * @property {number} offsetXMm  Décalage appliqué à toute la grille.
 * @property {number} offsetYMm
 * @property {SheetCell[]} cells
 * @property {string[]} warnings
 */

/**
 * Hauteur de la bande d'en-tête d'une planche, en millimètres.
 *
 * 12 pt de titre — environ 4,2 mm — plus 4 mm de respiration au-dessous : les
 * valeurs qu'emploie déjà la page du tableau (`.print-page__title` et
 * `.print-page__spacer`). Exportée pour que le contrôle de place et le dessin
 * partent du même nombre. Une seconde valeur écrite dans la feuille de style
 * finirait par diverger, et l'en-tête mordrait sur la première rangée
 * d'étiquettes sans que rien ne le signale.
 */
export const SHEET_HEADER_MM = 9;

/**
 * L'en-tête de page tient-il dans la marge du haut ?
 *
 * L'en-tête vit **dans la marge du haut**, comme celui du tableau : les
 * étiquettes ne bougent pas. C'est une contrainte de cette planche-ci, où les
 * cellules sont positionnées en absolu — les déplacer pour faire de la place
 * changerait toutes les cotes calculées, donc la taille des étiquettes, en
 * fonction d'une case à cocher.
 *
 * Une marge plus courte que la bande ferait recouvrir la première rangée. C'est
 * pire qu'une absence, et c'est refusé avec ses chiffres, comme partout ailleurs
 * dans ce produit.
 *
 * @param {{ marginYMm?: number }} options
 * @returns {{ fits: boolean, needed: number, reason: string }}
 */
export function sheetHeaderFits(options = {}) {
  const marge = nonNegative(options.marginYMm ?? 0);
  if (marge >= SHEET_HEADER_MM) {
    return { fits: true, needed: SHEET_HEADER_MM, reason: '' };
  }
  return {
    fits: false,
    needed: SHEET_HEADER_MM,
    reason: t(
      "L'en-tête a besoin de {need} mm de marge en haut, et la marge actuelle est de {margin} mm. "
      + "Augmentez la marge, ou décochez l'en-tête.",
      { need: SHEET_HEADER_MM, margin: round1(marge) },
    ),
  };
}

/**
 * Ce qui s'imprime sous le QR Code d'une planche.
 *
 * Quatre états, dont deux n'étaient pas atteignables auparavant : le titre
 * s'imprimait **toujours** quand il existait, et il n'y avait aucun moyen
 * d'obtenir l'URL seule, ni aucune ligne de texte.
 *
 * | titre | URL | résultat |
 * |---|---|---|
 * | coché | décoché | le titre ; l'URL prend sa place s'il n'y en a pas |
 * | coché | coché | « titre URL » |
 * | décoché | coché | l'URL seule |
 * | décoché | décoché | rien : le QR Code occupe toute l'étiquette |
 *
 * Le repli sur l'URL quand le titre est demandé mais absent n'est pas un détail :
 * une étiquette sans aucun texte ne dit plus ce qu'elle désigne, et c'est le
 * comportement d'origine — on le conserve.
 *
 * Pure, et appelée aux **deux** endroits qui doivent s'accorder : le calcul du
 * nombre de lignes réservées et le rendu de la cellule. Deux expressions
 * séparées auraient réservé un nombre de lignes qui ne correspondait pas au
 * texte réellement écrit, et le QR Code aurait rogné le texte ou laissé un vide.
 *
 * @param {{ title?: string, url?: string }} link
 * @param {{ title?: boolean, url?: boolean }} [options] `title` est vrai par
 *   défaut : c'est l'ancien comportement, et l'absence d'option ne doit pas
 *   changer ce qui s'imprime.
 * @returns {string}
 */
export function sheetCellBlocks(link, options = {}) {
  const veutTitre = options.title !== false;
  const veutUrl = options.url === true;
  const titre = typeof link?.title === 'string' ? link.title.trim() : '';
  const url = typeof link?.url === 'string' ? link.url : '';

  /** @type {Array<{ kind: 'title'|'url'|'index'|'date', text: string }>} */
  const blocs = [];
  // **Le titre est un bloc, l'URL en est un autre.** Ils étaient concaténés en
  // une seule chaîne, puis repliés ensemble : l'URL commençait donc au bout de
  // la dernière ligne du titre, les deux se partageaient des lignes, et c'était
  // le **titre** qui se faisait couper — la partie lisible par un humain, alors
  // que l'adresse, elle, est faite pour être scannée. Deux blocs, chacun replié
  // pour lui-même, et le budget de lignes donné au titre d'abord.
  if (veutTitre && titre !== '') blocs.push({ kind: 'title', text: titre });
  // L'URL s'écrit quand elle est demandée — et **aussi** quand le titre est vide
  // et qu'il n'y a donc rien d'autre : une étiquette sans aucun texte ne dirait
  // plus ce qu'elle désigne. C'est le comportement d'origine, conservé.
  if (url !== '' && (veutUrl || (veutTitre && titre === ''))) {
    blocs.push({ kind: 'url', text: url });
  }
  return blocs;
}

/**
 * Calcule la disposition d'une planche.
 *
 * `marginXMm` et `marginYMm` situent le coin de la **première** étiquette par
 * rapport aux bords gauche et haut. La place restante à droite et en bas est ce
 * qu'elle est : c'est ainsi que se décrit une planche réelle.
 *
 * `offsetXMm` et `offsetYMm` déplacent toute la grille sans changer sa forme.
 * Ils servent à rattraper le décalage d'entraînement d'une imprimante donnée —
 * le seul écart qu'aucune cote de fabricant ne peut prévoir.
 *
 * `adviseDenser` (vrai par défaut) émet un avertissement quand une bande
 * inutilisée à droite laisse penser qu'une colonne de plus tiendrait. Utile
 * quand on ajuste une disposition à la main ; à couper quand la grille a été
 * **calculée pour remplir la feuille** : l'espace restant est alors la marge
 * demandée, pas une place perdue, et l'avertissement serait du bruit.
 *
 * `columns` et `rows` rendent la grille **explicite** au lieu de la déduire des
 * cotes. C'est le cas de « remplir la feuille », où l'utilisateur choisit le
 * nombre de colonnes et de rangées et où la taille des étiquettes en découle :
 * déduire ensuite le nombre de colonnes de la taille qu'on vient de calculer
 * donnait un résultat absurde — 31 rangées pour une demande de 30, parce que la
 * zone utile va du coin de la première étiquette au bord de la feuille. Une
 * grille explicite est honorée, et signalée si elle ne tient pas.
 *
 * @param {{
 *   count: number,
 *   page?: keyof typeof PAGE_SIZES,
 *   pageWidthMm?: number,
 *   pageHeightMm?: number,
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   offsetXMm?: number,
 *   offsetYMm?: number,
 *   adviseDenser?: boolean,
 *   columns?: number,
 *   rows?: number,
 * }} options
 * @returns {SheetLayout}
 * @throws {TypeError} si les dimensions sont inutilisables.
 */
export function computeSheet(options) {
  const preset = options.page ? PAGE_SIZES[options.page] : undefined;
  const pageWidthMm = options.pageWidthMm ?? preset?.widthMm ?? PAGE_SIZES.a4.widthMm;
  const pageHeightMm = options.pageHeightMm ?? preset?.heightMm ?? PAGE_SIZES.a4.heightMm;

  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const marginXMm = nonNegative(options.marginXMm ?? 10);
  const marginYMm = nonNegative(options.marginYMm ?? 10);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const offsetXMm = Number.isFinite(options.offsetXMm) ? options.offsetXMm : 0;
  const offsetYMm = Number.isFinite(options.offsetYMm) ? options.offsetYMm : 0;
  // Un compte non fini produirait `pages: NaN` et un « NaN page » à l'écran :
  // on le ramène à zéro plutôt que de laisser la valeur se propager.
  const requested = Number.isFinite(options.count) ? options.count : 0;
  const count = Math.max(0, Math.trunc(requested));

  // La zone utile part du coin de la première étiquette jusqu'au bord de la
  // feuille : la marge de droite et du bas n'est pas imposée.
  const usableWidth = pageWidthMm - marginXMm;
  const usableHeight = pageHeightMm - marginYMm;

  // Les cotes sont décimales : « 297 - 2 × 15,15 » vaut 266,69999999999993 en
  // flottant, et la division tombe alors juste sous l'entier attendu. Sans
  // tolérance, une planche prévue pour 7 rangées n'en placerait que 6.
  // L'epsilon reste très inférieur à toute imprécision d'impression.
  const EPSILON = 1e-9;
  const fittingColumns = Math.max(
    0,
    Math.floor((usableWidth + gapXMm) / (labelWidthMm + gapXMm) + EPSILON),
  );
  const fittingRows = Math.max(
    0,
    Math.floor((usableHeight + gapYMm) / (labelHeightMm + gapYMm) + EPSILON),
  );

  // Une grille explicite est une consigne, pas une suggestion : on la respecte
  // telle quelle, quitte à prévenir si elle déborde.
  const askedColumns = Number.isFinite(options.columns)
    ? Math.max(0, Math.trunc(options.columns))
    : null;
  const askedRows = Number.isFinite(options.rows)
    ? Math.max(0, Math.trunc(options.rows))
    : null;
  const columns = askedColumns ?? fittingColumns;
  const rows = askedRows ?? fittingRows;
  const explicit = askedColumns !== null || askedRows !== null;

  const warnings = [];
  if (columns > fittingColumns || rows > fittingRows) {
    warnings.push(
      `La grille demandée (${columns} × ${rows}) ne tient pas : ` +
      `${fittingColumns} × ${fittingRows} au maximum pour des étiquettes de ` +
      `${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm.`,
    );
  }
  if (columns === 0 || rows === 0) {
    warnings.push(
      `Aucune étiquette ne tient sur ${round1(pageWidthMm)} × ${round1(pageHeightMm)} mm : ` +
      `une étiquette mesure ${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm ` +
      `pour une zone utile de ${round1(usableWidth)} × ${round1(usableHeight)} mm.`,
    );
  } else if (!explicit && options.adviseDenser !== false) {
    // Signale le gaspillage : un demi-centimètre perdu suffit souvent à faire
    // tenir une colonne de plus.
    const slackX = usableWidth - (columns * labelWidthMm + (columns - 1) * gapXMm);
    if (slackX > labelWidthMm * 0.6) {
      warnings.push(
        `Il reste ${round1(slackX)} mm à droite de la dernière colonne : une ` +
        'colonne supplémentaire tiendrait peut-être en réduisant la marge gauche.',
      );
    }
  } else if (explicit && options.adviseDenser === true
    && (fittingColumns > columns || fittingRows > rows)) {
    warnings.push(
      `${fittingColumns} × ${fittingRows} étiquettes tiendraient sur cette ` +
      'feuille : augmentez le nombre de colonnes ou de rangées pour la remplir.',
    );
  }

  const perPage = columns * rows;
  const pages = perPage > 0 ? Math.ceil(count / perPage) : 0;
  const cells = [];

  // Aucune étiquette ne peut être placée si la grille est vide : sans cette
  // garde, `index % 0` produirait des cellules à des positions NaN.
  if (perPage > 0) {
    for (let index = 0; index < count; index++) {
      const slot = index % perPage;
      const column = slot % columns;
      const row = Math.floor(slot / columns);
      cells.push({
        index,
        page: Math.floor(index / perPage),
        column,
        row,
        xMm: round2(marginXMm + offsetXMm + column * (labelWidthMm + gapXMm)),
        yMm: round2(marginYMm + offsetYMm + row * (labelHeightMm + gapYMm)),
      });
    }
  }

  return {
    pageWidthMm,
    pageHeightMm,
    labelWidthMm,
    labelHeightMm,
    // Les marges sont rendues avec le reste.
    //
    // Elles manquaient, et leur absence ne se voyait pas : les positions des
    // cellules les contiennent déjà. Mais un appelant qui veut savoir où
    // **commence** la grille — l'en-tête de page, par exemple — n'avait aucun
    // moyen de les retrouver, sinon en défaisant le calcul de la première
    // cellule. La première version de l'en-tête lisait `layout.marginYMm`, qui
    // valait `undefined`, donc zéro, et refusait de se dessiner en annonçant une
    // marge de 0 mm alors que l'étiquette était à 15.
    marginXMm,
    marginYMm,
    columns,
    rows,
    perPage,
    pages,
    count,
    capacity: perPage * Math.max(1, pages),
    offsetXMm,
    offsetYMm,
    cells,
    warnings,
  };
}

/**
 * Répartit des éléments sur plusieurs pages.
 *
 * @template T
 * @param {T[]} items
 * @param {SheetLayout} layout
 * @returns {Array<{ page: number, items: Array<{ item: T, cell: SheetCell }> }>}
 */
export function paginate(items, layout) {
  if (layout.perPage <= 0) return [];

  const pages = [];
  items.forEach((item, index) => {
    const cell = layout.cells[index];
    if (!cell) return;
    if (!pages[cell.page]) pages[cell.page] = { page: cell.page, items: [] };
    pages[cell.page].items.push({ item, cell });
  });

  return pages.filter(Boolean);
}

/**
 * Arrondit à 0,1 mm, précision suffisante pour l'impression.
 *
 * Exporté : l'interface affiche les cotes avec la même précision que le calcul,
 * et une seconde définition finirait par diverger — le concatenateur du build
 * refuse d'ailleurs deux déclarations de même nom.
 *
 * @param {number} value
 * @returns {number}
 */
export function round1(value) {
  return Math.round(value * 10) / 10;
}

/** Arrondit à 0,01 mm. */
function round2(value) {
  return Math.round(value * 100) / 100;
}

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} doit être un nombre strictement positif`);
  }
  return value;
}

function nonNegative(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// ---------------------------------------------------------------------------
// Contenu d'une étiquette de planche
// ---------------------------------------------------------------------------

/**
 * Garde-fou du curseur : le QR Code ne disparaît jamais.
 *
 * Ce n'est **pas** le plancher du QR Code. Le vrai plancher est ce que
 * l'imprimante peut rendre lisible — les modules de l'adresse fois
 * `MIN_MODULE_MM_PAPER` —, et il se calcule pour chaque lien : `qrRatioBounds`
 * le pose comme minimum du curseur.
 *
 * Il valait 30 % du petit côté de l'étiquette, ce qui n'a rien à voir avec la
 * lisibilité : sur une A4 3 × 8 et une adresse courte (21 modules, 8,4 mm
 * lisibles), il interdisait de descendre sous 10,2 mm, et le texte perdait une
 * ligne de place **pour rien** — un titre était coupé alors que le QR Code
 * aurait pu céder un millimètre et demi. Une proportion choisie à l'œil ne doit
 * pas limiter ce qu'on peut imprimer.
 */
export const MIN_QR_RATIO = 0.05;
/** Proportion maximale : au-delà, le QR Code chasse le texte hors de l'étiquette. */
export const MAX_QR_RATIO = 1;
/** Écart entre le QR Code et le texte, identique à celui de la feuille de style. */
export const SHEET_QR_GAP_MM = 1.5;
/** Marge intérieure d'une étiquette de planche, pour ne pas toucher les bords. */
export const SHEET_CELL_MARGIN_MM = 0.5;

/** Taille de police du texte des étiquettes de planche, en points. */
export const SHEET_FONT_PT = 7;
/** Interligne, en multiple de la taille de police. */
export const SHEET_LINE_SPACING = 1.15;

/**
 * Taille minimale d'un module de QR Code **sur papier**, en millimètres.
 *
 * C'est la contrainte qui manquait : un module plus petit n'est plus résolu
 * proprement par une imprimante laser ou jet d'encre, et un téléphone a du mal
 * à faire la mise au point dessus. 0,4 mm correspond à la recommandation
 * courante pour un QR Code imprimé lu à bout portant.
 */
export const MIN_MODULE_MM_PAPER = 0.4;

/**
 * Taille minimale d'un module sur une **tête thermique**, en millimètres.
 *
 * Une tête Niimbot fusionne les points sous 2 pixels par module. La contrainte
 * dépend donc de la résolution, contrairement à celle du papier.
 *
 * @param {number} dpi
 * @returns {number} millimètres par module
 */
export function minModuleMmThermal(dpi) {
  const resolution = Number.isFinite(dpi) && dpi > 0 ? dpi : 203;
  return (2 / resolution) * 25.4;
}

/**
 * Hauteur d'une ligne de texte d'étiquette, en millimètres.
 *
 * Dérivée de la taille de police plutôt que codée en dur : la feuille de style
 * et le calcul de mise en page doivent partir du même chiffre, sinon le texte
 * calculé ne tient plus dans la place réservée.
 *
 * @param {{ fontSizePt?: number, lineSpacing?: number }} [options]
 * @returns {{ fontSizePt: number, fontSizePx: number, lineHeightMm: number }}
 */
export function sheetTextMetrics(options = {}) {
  const fontSizePt = Number.isFinite(options.fontSizePt)
    ? options.fontSizePt
    : SHEET_FONT_PT;
  const lineSpacing = Number.isFinite(options.lineSpacing)
    ? options.lineSpacing
    : SHEET_LINE_SPACING;
  const fontSizePx = (fontSizePt * 96) / 72;
  return {
    fontSizePt,
    fontSizePx,
    lineHeightMm: (fontSizePx * lineSpacing * 25.4) / 96,
  };
}

/**
 * Bornes de la proportion du QR Code dans une étiquette de planche.
 *
 * Le calcul est fait **avant** le rendu, pour que le curseur ne puisse pas
 * demander un QR Code impossible à imprimer :
 *
 * - **borne basse** : un module doit rester lisible une fois imprimé, donc le QR Code
 *   ne peut pas descendre sous `qrModules × minModuleMm`. Sur une planche papier
 *   la contrainte est physique (0,4 mm) ; sur une tête thermique elle vient de
 *   la résolution (2 px par module).
 * - **borne haute** : le QR Code est carré, il doit tenir dans la largeur **et**
 *   laisser au moins une ligne de texte sous lui.
 *
 * Quand les deux bornes se croisent, aucune valeur ne convient : l'URL est trop
 * longue pour ce format, et c'est `reason` qui le dit.
 *
 * @param {{
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   qrModules: number,
 *   textLines?: number,
 *   marginMm?: number,
 *   gapMm?: number,
 *   fontSizePt?: number,
 *   minModuleMm?: number,
 *   minRatio?: number,
 *   maxRatio?: number,
 * }} options
 * @returns {{
 *   min: number, max: number,
 *   minSideMm: number, maxSideMm: number,
 *   minModuleMm: number,
 *   moduleMmAtMax: number,
 *   textLinesAtMin: number,
 *   fits: boolean,
 *   reason: string,
 * }}
 */
export function qrRatioBounds(options) {
  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const qrModules = Math.max(1, Math.trunc(options.qrModules ?? 21));
  const textLines = Math.max(0, Math.trunc(options.textLines ?? 1));
  const marginMm = nonNegative(options.marginMm ?? 0);
  const gapMm = Number.isFinite(options.gapMm) ? options.gapMm : SHEET_QR_GAP_MM;
  const floorRatio = Number.isFinite(options.minRatio) ? options.minRatio : MIN_QR_RATIO;
  const ceilingRatio = Number.isFinite(options.maxRatio) ? options.maxRatio : MAX_QR_RATIO;
  const minModuleMm = Number.isFinite(options.minModuleMm) && options.minModuleMm > 0
    ? options.minModuleMm
    : MIN_MODULE_MM_PAPER;
  const { lineHeightMm } = sheetTextMetrics({ fontSizePt: options.fontSizePt });

  const short = Math.min(labelWidthMm, labelHeightMm);
  const innerWidth = labelWidthMm - marginMm * 2;
  const innerHeight = labelHeightMm - marginMm * 2;

  const textHeight = textLines > 0 ? gapMm + textLines * lineHeightMm : 0;
  // Le QR Code est carré : la hauteur disponible est la contrainte la plus serrée
  // sur une étiquette large et basse, la largeur sur une étiquette étroite.
  const rawMaxSide = Math.min(innerWidth, innerHeight - textHeight);
  const minSideMm = qrModules * minModuleMm;

  const clampRatio = (value) => Math.round(
    Math.min(ceilingRatio, Math.max(floorRatio, value / short)) * 1000,
  ) / 1000;

  const min = clampRatio(minSideMm);
  const max = clampRatio(Math.max(0, rawMaxSide));
  const fits = rawMaxSide > 0 && minSideMm <= rawMaxSide + 1e-9;

  // **Le minimum réellement atteignable**, et non le minimum lisible : le
  // curseur ne descend pas sous `MIN_QR_RATIO`, si bien qu'une étiquette large
  // et basse peut voir son QR Code plus grand que ses modules ne l'exigent. Le
  // nombre de lignes annoncé se calcule donc sur le côté que le curseur laisse
  // vraiment atteindre.
  //
  // Ce n'est pas un détail d'arrondi : mesuré sur une A4 3 × 8 et 21 modules,
  // le calcul d'origine promettait **huit** lignes et le rendu n'en laissait que
  // **sept** — un titre était coupé alors que l'application venait d'annoncer
  // qu'il tenait.
  const minSideEffective = Math.max(minSideMm, min * short);

  // Combien de lignes de texte tiennent encore si le QR Code est au minimum ?
  const textLinesAtMin = lineHeightMm > 0
    ? Math.max(0, Math.floor((innerHeight - minSideEffective - gapMm) / lineHeightMm))
    : 0;

  let reason = '';
  if (rawMaxSide <= 0) {
    reason =
      `Une étiquette de ${round1(labelWidthMm)} × ${round1(labelHeightMm)} mm ne ` +
      'laisse aucune place à un QR Code et à une ligne de texte.';
  } else if (!fits) {
    reason =
      `URL trop longue pour cette étiquette : ${qrModules} modules à ` +
      `${round2(minModuleMm)} mm minimum demandent ${round1(minSideMm)} mm, alors que ` +
      `${round1(rawMaxSide)} mm restent disponibles. Raccourcissez l'URL, ou prenez ` +
      'une étiquette plus grande.';
  }

  return {
    min,
    max,
    minSideMm: round2(minSideMm),
    maxSideMm: round2(Math.max(0, rawMaxSide)),
    minModuleMm: round2(minModuleMm),
    moduleMmAtMax: round2(Math.max(0, rawMaxSide) / qrModules),
    textLinesAtMin,
    fits,
    reason,
  };
}

/**
 * Découpe le texte d'une étiquette et le limite aux lignes disponibles.
 *
 * Les lignes sont renvoyées explicitement plutôt que laissées au retour à la
 * ligne du navigateur : c'est ce qui garantit que le texte occupe exactement la
 * hauteur réservée par le calcul. Un texte trop long est coupé, avec des points
 * de suspension — une troncature visible vaut mieux qu'un débordement masqué.
 *
 * @param {string} text
 * @param {{
 *   measure: (text: string) => number,
 *   innerWidthPx: number,
 *   maxLines: number,
 * }} options
 * @returns {string[]}
 */
export function sheetCellLines(text, options) {
  const { measure, innerWidthPx } = options;
  const maxLines = Math.max(0, Math.trunc(options.maxLines ?? 1));
  if (maxLines === 0 || !text) return [];
  if (typeof measure !== 'function') throw new TypeError('measure est requis');

  const all = wrapText(measure, text, innerWidthPx);
  if (all.length <= maxLines) return all;

  const kept = all.slice(0, maxLines);
  const last = kept[kept.length - 1];
  let trimmed = last;
  // On retire des caractères jusqu'à ce que les points de suspension tiennent.
  while (trimmed.length > 1 && measure(`${trimmed}…`) > innerWidthPx) {
    trimmed = trimmed.slice(0, -1);
  }
  kept[kept.length - 1] = `${trimmed.trimEnd()}…`;
  return kept;
}

/**
 * Côté du QR Code d'une étiquette de planche, en millimètres.
 *
 * Le QR Code est carré : il se règle donc sur le **petit** côté de l'étiquette. Sans
 * cette borne, une étiquette basse (33,9 mm de haut pour 63,5 mm de large)
 * produirait un QR Code plus haut que son support. La proportion est bornée pour
 * qu'aucune valeur d'interface ne puisse dépasser l'étiquette.
 *
 * @param {number} labelWidthMm
 * @param {number} labelHeightMm
 * @param {number} ratio  Proportion du petit côté, entre 0,3 et 1.
 * @returns {number}
 * @throws {TypeError} si une dimension n'est pas un nombre positif.
 */
/**
 * Ce qu'une étiquette de planche offre **réellement** à son texte.
 *
 * C'est la formule du budget, et elle n'existait qu'en deux exemplaires : l'un
 * dans le rendu, l'autre dans la mise en page automatique. Les deux ne disaient
 * pas la même chose — le rendu dessine le QR Code à la proportion du curseur, la
 * mise en page le supposait à son minimum lisible — et l'écart se payait en
 * texte coupé : mesuré sur 49 liens en A4 3 × 4, la mise en page promettait 8
 * lignes là où le rendu n'en laissait que 7, et **45 étiquettes** sortaient
 * tronquées, sous une grille annoncée comme « calculée pour ce contenu ».
 *
 * Une seule formule, donc, et deux appelants : le rendu y lit le nombre de
 * lignes qu'il peut écrire, la mise en page y lit celles qu'une étiquette
 * candidate offrirait.
 *
 * @param {{
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   qrRatio?: number,
 *   fontSizePt?: number,
 *   linesHorsTexte?: number,
 *   marginMm?: number,
 *   gapMm?: number,
 * }} options
 * @returns {{
 *   sideMm: number, lineHeightMm: number, textSpaceMm: number,
 *   maxLines: number, textLines: number,
 * }}
 */
export function sheetTextBudget(options) {
  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const marginMm = nonNegative(options.marginMm ?? SHEET_CELL_MARGIN_MM);
  const gapMm = Number.isFinite(options.gapMm) ? options.gapMm : SHEET_QR_GAP_MM;
  const linesHorsTexte = Math.max(0, Math.trunc(options.linesHorsTexte ?? 0));

  const sideMm = qrSideMm(labelWidthMm, labelHeightMm, options.qrRatio);
  const { lineHeightMm } = sheetTextMetrics({ fontSizePt: options.fontSizePt });
  const textSpaceMm = labelHeightMm - marginMm * 2 - sideMm - gapMm;
  // La tolérance n'est pas cosmétique : la borne du QR Code est arrondie au
  // millième par `qrRatioBounds`, et cet arrondi se propage jusqu'ici. Sans elle,
  // une place calculée pour deux lignes n'en donnait qu'une — 12,978 mm pour
  // 6,493 mm d'interligne vaut 1,9989, que `floor` ramenait à 1.
  const maxLines = textSpaceMm <= 0 || !Number.isFinite(lineHeightMm)
    ? 0
    : Math.floor(textSpaceMm / lineHeightMm + 1e-3);

  return {
    sideMm,
    lineHeightMm,
    textSpaceMm,
    maxLines,
    // Le rendu écrit **toujours** une ligne, même quand le QR Code a tout pris :
    // c'est ce qui fait qu'une étiquette trop petite se voit à sa coupe, et non
    // à son silence. Le budget dit la même chose que lui.
    textLines: Math.max(1, maxLines - linesHorsTexte),
  };
}

export function qrSideMm(labelWidthMm, labelHeightMm, ratio) {
  const base = Math.min(
    positive(labelWidthMm, 'labelWidthMm'),
    positive(labelHeightMm, 'labelHeightMm'),
  );
  const wanted = Number.isFinite(ratio) ? ratio : MAX_QR_RATIO;
  const clamped = Math.min(MAX_QR_RATIO, Math.max(MIN_QR_RATIO, wanted));
  return round2(base * clamped);
}

// ---------------------------------------------------------------------------
// Remplir la feuille : colonnes, rangées et marge globale
// ---------------------------------------------------------------------------

/**
 * Calcule la taille d'étiquette qui remplit une feuille pour une grille donnée.
 *
 * C'est l'inverse de `computeSheet` : au lieu de partir des cotes d'une
 * étiquette, on part du nombre de colonnes et de rangées voulu, et l'étiquette
 * prend la place restante.
 *
 * Les marges sont **par axe** (`marginXMm`, `marginYMm`) et non globales : une
 * planche du commerce a presque toujours une marge haute différente de sa marge
 * gauche, et c'est la seule façon de reproduire exactement ses cotes. Une marge
 * globale s'obtient en passant la même valeur aux deux.
 *
 * Les marges rendues peuvent différer de quelques centièmes de millimètre de
 * celles demandées : la taille d'étiquette est arrondie au centième, et l'écart
 * restant est réparti également de chaque côté. Sans cela, une étiquette
 * arrondie vers le bas ferait perdre une colonne entière à `computeSheet` —
 * c'est exactement le piège que ce calcul évite.
 *
 * @param {{
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   columns: number,
 *   rows: number,
 *   marginMm?: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   minLabelMm?: number,
 * }} options
 * @returns {{
 *   ok: boolean,
 *   reason: string,
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   marginXMm: number,
 *   marginYMm: number,
 *   columns: number,
 *   rows: number,
 * }}
 */
/**
 * La disposition qui remplit une page, pour un contenu donné.
 *
 * C'est la réponse au tâtonnement : au lieu de choisir une grille puis de
 * constater qu'elle ne convient pas — étiquettes trop petites pour le texte, ou
 * place perdue en bas de page —, on part de ce que le contenu **exige** et l'on
 * en déduit la page entière.
 *
 * Le raisonnement tient en trois temps :
 *
 * 1. **La grille qui porte le contenu sur une page** : le moins de cases vides
 *    possible — une case vide est une étiquette qui n'existe pas —, la forme du
 *    contenu à égalité, puis la plus grande étiquette.
 * 2. **À défaut, la plus dense qui porte son texte**, et la planche pagine. Le
 *    défaut mesuré le 29 septembre 2026 : sur une A4 3 × 4, 49 liens donnaient
 *    `10 × 5 = 50` étiquettes de **18,2 × 55 mm**, dont **45 sortaient coupées**.
 *    Aucune grille ne portait 49 étiquettes à une largeur qui porte leur texte ;
 *    le calcul, lui, tassait quand même, et annonçait une grille « calculée pour
 *    ce contenu » qui ne l'était pas.
 * 3. **Des étiquettes qui occupent la place restante.** Une fois la grille
 *    fixée, le reste de la page est réparti entre les étiquettes plutôt que
 *    laissé en bande perdue à droite et en bas : elles grandissent, et le code
 *    avec elles.
 *
 * La contrainte de contenu s'exprime par `tient`, **évaluée sur les cotes de
 * chaque grille candidate** : c'est la seule façon de ne pas promettre une
 * largeur dont on n'a pas mesuré le texte. `minLabelWidthMm` et
 * `minLabelHeightMm` restent le plancher dur — un QR Code dont les modules
 * descendent sous la taille lisible ne se lit plus, quelle que soit la place du
 * texte.
 *
 * Les marges demandées sont respectées — mais si une seule étiquette n'y tient
 * pas, elles sont ramenées à zéro avant de renoncer : rogner une marge est
 * toujours préférable à ne rien pouvoir imprimer.
 *
 * @param {{
 *   pageWidthMm: number, pageHeightMm: number,
 *   minLabelWidthMm: number, minLabelHeightMm: number,
 *   marginXMm?: number, marginYMm?: number,
 *   gapXMm?: number, gapYMm?: number,
 *   count?: number,
 *   tient?: (labelWidthMm: number, labelHeightMm: number) => boolean,
 * }} options
 * @returns {{
 *   columns: number, rows: number,
 *   labelWidthMm: number, labelHeightMm: number,
 *   marginXMm: number, marginYMm: number, gapXMm: number, gapYMm: number,
 *   perPage: number, coversCount: boolean, pages: number,
 * }}
 */
/**
 * Compare deux scores, critère par critère, dans l'ordre.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function compareScores(a, b) {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

export function autoSheetLayout(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const minWidth = positive(options.minLabelWidthMm, 'minLabelWidthMm');
  const minHeight = positive(options.minLabelHeightMm, 'minLabelHeightMm');
  let marginXMm = nonNegative(options.marginXMm ?? 0);
  let marginYMm = nonNegative(options.marginYMm ?? 0);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);

  // Combien d'étiquettes la planche doit porter. C'est ce qui décide de la
  // **taille** de la grille : sans ce nombre, la mise en page automatique
  // cherchait la grille la plus dense possible et proposait 11 × 7 = 77
  // étiquettes pour cinq liens — des timbres, et une page à moitié vide.
  const count = Number.isFinite(options.count) && options.count > 0
    ? Math.floor(options.count)
    : 0;

  const grille = (margeX, margeY) => {
    const utileX = pageWidthMm - margeX * 2;
    const utileY = pageHeightMm - margeY * 2;
    return {
      columns: Math.max(1, Math.floor((utileX + gapXMm) / (minWidth + gapXMm))),
      rows: Math.max(1, Math.floor((utileY + gapYMm) / (minHeight + gapYMm))),
      utileX,
      utileY,
    };
  };

  let { columns, rows, utileX, utileY } = grille(marginXMm, marginYMm);

  // Une étiquette ne tient pas dans la zone utile telle qu'elle est demandée :
  // on rend les marges avant de renoncer.
  if (columns < 1 || rows < 1
    || utileX < minWidth - 1e-9 || utileY < minHeight - 1e-9) {
    marginXMm = 0;
    marginYMm = 0;
    ({ columns, rows, utileX, utileY } = grille(0, 0));
  }

  /**
   * Les grilles candidates, jugées **sur leurs propres cotes**.
   *
   * C'est là que se joue le défaut du 29 septembre 2026 : le besoin de texte était
   * mesuré à une largeur — celle de la disposition, puis celle de la première
   * grille trouvée — et la grille retenue en avait une autre, plus étroite, où le
   * texte réclamait plus de lignes. La contrainte est donc évaluée ici, pour
   * chaque candidate, sur la largeur et la hauteur qu'elle aurait réellement.
   *
   * Trois idées, dans cet ordre :
   *
   * 1. **La grille doit contenir les étiquettes, et pas davantage.** C'est le
   *    critère premier : une case vide est une étiquette qui n'existe pas, et
   *    une grille trop dense fait des timbres. « 11 colonnes pour cinq liens »
   *    était précisément le défaut.
   * 2. **Une lame n'est pas une étiquette.** À remplissage égal, on écarte les
   *    grilles dont l'étiquette s'éloigne trop de la forme du **contenu** — le
   *    rapport de la plus petite étiquette qui porte le QR Code et son texte.
   *    Cinq liens sur une A4 donnent ainsi 2 × 3 (96 × 92 mm, presque carré)
   *    plutôt que 5 × 1 (38 × 280 mm) : les deux tiennent le contenu, un seul se
   *    regarde. Le facteur 2 est un choix : à 3, cinq liens donnaient 1 × 5 —
   *    une bande de 193 × 55 mm, exacte mais étirée — plutôt que 2 × 3
   *    (96 × 92 mm), qui laisse une case vide et se regarde mieux. Une case
   *    vide est du papier, pas une étiquette ratée.
   * 3. À remplissage et forme acceptables, la plus grande étiquette gagne.
   *
   * Sans nombre d'étiquettes — un appelant qui ne le connaît pas —, on garde le
   * comportement d'origine : remplir la page.
   */
  const FORME_TOLEREE = 2;
  const cible = minWidth / minHeight;
  const tient = typeof options.tient === 'function' ? options.tient : null;

  /** Les cotes d'une étiquette pour une grille donnée : la place restante est
   *  partagée, donc les étiquettes occupent la page jusqu'à ses bords. */
  const cotesDe = (colonnes, lignes) => ({
    labelWidthMm: (utileX - (colonnes - 1) * gapXMm) / colonnes,
    labelHeightMm: (utileY - (lignes - 1) * gapYMm) / lignes,
  });

  /**
   * Une grille candidate, ou `null` si elle ne peut pas porter le contenu.
   *
   * @param {number} colonnes
   * @param {number} lignes
   */
  const candidat = (colonnes, lignes) => {
    const { labelWidthMm: largeur, labelHeightMm: hauteur } = cotesDe(colonnes, lignes);
    // Le plancher dur : un module plus petit que `minLabel*Mm` ne se lit plus.
    if (largeur < minWidth - 1e-9 || hauteur < minHeight - 1e-9) return null;
    // Puis la contrainte du contenu, sur **ces** cotes-là.
    if (tient && !tient(largeur, hauteur)) return null;
    const forme = (largeur / hauteur) / cible;
    const cases = colonnes * lignes;
    return {
      colonnes,
      lignes,
      labelWidthMm: largeur,
      labelHeightMm: hauteur,
      cases,
      vide: cases - count,
      aire: largeur * hauteur,
      // 0 quand l'étiquette garde la forme du contenu.
      lame: forme < 1 / FORME_TOLEREE || forme > FORME_TOLEREE ? 1 : 0,
    };
  };

  let coversCount = true;

  if (count > 0) {
    const candidates = [];
    for (let colonnes = 1; colonnes <= columns; colonnes += 1) {
      for (let lignes = 1; lignes <= rows; lignes += 1) {
        const grilleCandidate = candidat(colonnes, lignes);
        if (grilleCandidate) candidates.push(grilleCandidate);
      }
    }

    // 1. Celles qui portent le contenu **sur une page**. La forme du contenu
    //    passe avant la case perdue : c'est le sens de « on tolère la case qui
    //    rend la grille équilibrée, jamais deux » — cinq liens font 2 × 3
    //    (96 × 92 mm, une case vide) plutôt que 1 × 5 (193 × 55 mm, exacte mais
    //    étirée). Faute de grille bien formée, la plus économe en cases gagne :
    //    mieux vaut une lame qu'un refus.
    const tiennentLeCompte = candidates.filter((c) => c.cases >= count);
    const parEconomie = (a, b) => a.vide - b.vide || b.aire - a.aire;
    const surUnePage = tiennentLeCompte.filter((c) => c.lame === 0).sort(parEconomie)[0]
      ?? tiennentLeCompte.sort(parEconomie)[0];

    // 2. Aucune ne le porte. On ne tasse pas pour autant : la plus dense des
    //    grilles qui portent **leur texte** est retenue, et la planche pagine.
    //    Une grille annoncée « calculée pour ce contenu » doit l'être ; mieux
    //    vaut deux pages lisibles qu'une page de 45 étiquettes tronquées.
    const dense = candidates
      .sort((a, b) => b.cases - a.cases || b.aire - a.aire)[0];

    const choisie = surUnePage ?? dense;
    if (choisie) {
      columns = choisie.colonnes;
      rows = choisie.lignes;
      coversCount = choisie.cases >= count;
    } else if (tient) {
      // Aucune grille ne porte son texte : la disposition demandée est trop
      // serrée pour ce contenu. On garde la grille du plancher — l'appelant a de
      // quoi le dire —, et le compte n'est pas tenu.
      coversCount = columns * rows >= count;
    }
  }

  // Ce qui reste après la grille se répartit entre les étiquettes : la page est
  // occupée jusqu'à ses bords.
  const labelWidthMm = Math.max(minWidth, (utileX - (columns - 1) * gapXMm) / columns);
  const labelHeightMm = Math.max(minHeight, (utileY - (rows - 1) * gapYMm) / rows);

  // Les cotes sont **arrondies vers le bas** : arrondir au plus proche suffisait
  // à faire dépasser la grille de quelques millièmes de millimètre, et la page
  // ne contenait plus tout à fait ses étiquettes.
  const plancher2 = (valeur) => Math.floor(valeur * 100) / 100;

  return {
    columns,
    rows,
    labelWidthMm: plancher2(labelWidthMm),
    labelHeightMm: plancher2(labelHeightMm),
    marginXMm: round2(marginXMm),
    marginYMm: round2(marginYMm),
    gapXMm: round2(gapXMm),
    gapYMm: round2(gapYMm),
    perPage: columns * rows,
    // Ce que la grille retenue signifie pour le contenu : tient-il sur une page,
    // ou la planche en demandera-t-elle plusieurs ? Le calcul le sait, et
    // l'appelant n'a pas à le refaire — le refaire autrement serait le défaut
    // d'origine, une seconde formule pour la même chose.
    coversCount,
    pages: count === 0 ? 0 : Math.ceil(count / (columns * rows)),
  };
}

export function fitGrid(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const columns = Math.max(1, Math.trunc(options.columns ?? 1));
  const rows = Math.max(1, Math.trunc(options.rows ?? 1));
  // `marginMm` reste accepté : c'est la marge globale, appliquée aux deux axes.
  const marginXMm = nonNegative(options.marginXMm ?? options.marginMm ?? 0);
  const marginYMm = nonNegative(options.marginYMm ?? options.marginMm ?? 0);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const minLabelMm = Number.isFinite(options.minLabelMm) ? options.minLabelMm : 5;

  const usableWidth = pageWidthMm - marginXMm * 2;
  const usableHeight = pageHeightMm - marginYMm * 2;

  const rawWidth = (usableWidth - (columns - 1) * gapXMm) / columns;
  const rawHeight = (usableHeight - (rows - 1) * gapYMm) / rows;

  const refuse = (reason) => ({
    ok: false,
    reason,
    labelWidthMm: 0,
    labelHeightMm: 0,
    marginXMm,
    marginYMm,
    columns,
    rows,
  });

  if (rawWidth < minLabelMm || rawHeight < minLabelMm) {
    const tooMany = rawWidth < minLabelMm ? `${columns} colonnes` : `${rows} rangées`;
    const tightest = rawWidth < minLabelMm ? round1(rawWidth) : round1(rawHeight);
    return refuse(
      `${tooMany} sur cette feuille ne laisse que ${tightest} mm par étiquette ` +
      `(minimum ${minLabelMm} mm). Réduisez le nombre, l'écart, ou la marge.`,
    );
  }

  // Arrondi vers le bas : l'étiquette ne peut pas être plus grande que la place
  // disponible. Le reste est réparti en marge, ce qui recentre la grille.
  const labelWidthMm = Math.floor(rawWidth * 100) / 100;
  const labelHeightMm = Math.floor(rawHeight * 100) / 100;

  const slackX = usableWidth - (columns * labelWidthMm + (columns - 1) * gapXMm);
  const slackY = usableHeight - (rows * labelHeightMm + (rows - 1) * gapYMm);

  // Arrondi vers le bas, là aussi : arrondir la marge au centième supérieur
  // suffirait à faire dépasser la grille du bord de la feuille de quelques
  // microns — de quoi invalider la garantie « rien ne sort de la page ».
  const floor2 = (value) => Math.floor(value * 100) / 100;

  return {
    ok: true,
    reason: '',
    labelWidthMm,
    labelHeightMm,
    marginXMm: floor2(marginXMm + slackX / 2),
    marginYMm: floor2(marginYMm + slackY / 2),
    columns,
    rows,
  };
}

/**
 * Ramène une grille demandée à la plus grande qui tienne réellement.
 *
 * Le défaut qu'elle corrige : `fitGrid` **refuse** une grille impossible, et
 * l'interface se contentait alors de garder la disposition précédente. Les
 * champs affichaient donc une valeur, l'aperçu en montrait une autre, et
 * l'impression une troisième — sans que rien ne dise laquelle. L'utilisateur
 * concluait, à juste titre, qu'il était bloqué dans une configuration dont il ne
 * voyait pas le résultat.
 *
 * Ici, la demande est ramenée à ce qui tient, et la raison est rendue avec.
 * L'appelant peut alors écrire la valeur retenue dans son champ : l'écran,
 * l'aperçu et le papier ne montrent plus qu'une seule grille.
 *
 * Le calcul est celui de `computeSheet` — la même formule, avec la taille
 * minimale d'étiquette à la place de la taille réelle. C'est ce qui garantit que
 * la grille rendue est acceptée par `fitGrid` : une seconde formule, écrite
 * ailleurs, finirait par diverger d'un centième et rendrait une grille refusée.
 *
 * @param {{
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   columns: number,
 *   rows: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   minLabelMm?: number,
 * }} options
 * @returns {{ columns: number, rows: number, clamped: boolean, reason: string }}
 *   `clamped` dit si la valeur rendue diffère de la demande ; `reason` est vide
 *   dans ce cas, et l'explique sinon.
 */
/**
 * L'écart et la marge qui font tenir une grille demandée sur une page.
 *
 * C'est le calcul **inverse** de celui des dispositions : au lieu de déduire la
 * taille des étiquettes de la grille et des espacements, on garde la taille
 * d'étiquette et la grille, et l'on cherche les espacements qui les font tenir.
 *
 * La réponse préférée est **symétrique** — le même écart dans les deux sens et
 * la même marge partout. `n` colonnes de largeur `w`, `r` rangées de hauteur
 * `h`, un écart `g` et une marge `m` donnent deux équations :
 *
 *     n·w + (n-1)·g + 2m = W        r·h + (r-1)·g + 2m = H
 *
 * Deux équations, deux inconnues : une seule solution, qui n'existe que si
 * `g ≥ 0` et `m ≥ 0`. Quand la marge tomberait sous zéro — les étiquettes sont
 * plus hautes que larges, et la grille carrée —, on garde l'écart égal et
 * l'on partage ce qui reste : c'est le seul moyen de ne pas trancher dans la
 * grille demandée.
 *
 * Si même sans écart ni marge les étiquettes ne tiennent pas, aucun
 * arrangement ne peut les faire tenir : la réponse le dit.
 *
 * @param {{
 *   pageWidthMm: number, pageHeightMm: number,
 *   columns: number, rows: number,
 *   labelWidthMm: number, labelHeightMm: number,
 *   gapXMm?: number,
 * }} options
 * @returns {{
 *   ok: boolean,
 *   reason?: 'etiquettes',
 *   gapXMm?: number, gapYMm?: number, marginXMm?: number, marginYMm?: number,
 *   symetrique?: boolean,
 * }}
 */
export function spacingForGrid(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const columns = Math.max(1, Math.trunc(options.columns ?? 1));
  const rows = Math.max(1, Math.trunc(options.rows ?? 1));
  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');

  const arrondi = (valeur) => Math.round(valeur * 100) / 100;
  const libreLargeur = pageWidthMm - columns * labelWidthMm;
  const libreHauteur = pageHeightMm - rows * labelHeightMm;

  // Les étiquettes elles-mêmes ne tiennent pas : aucun espacement n'y changera
  // rien, et le dire vaut mieux que de rendre des valeurs négatives.
  if (libreLargeur < -0.01 || libreHauteur < -0.01) return { ok: false, reason: 'etiquettes' };

  const ecartsLargeur = columns - 1;
  const ecartsHauteur = rows - 1;

  // Cas particulier : une seule étiquette dans les deux sens — il n'y a pas
  // d'écart à trouver, seulement une marge.
  if (ecartsLargeur === 0 && ecartsHauteur === 0) {
    const marge = Math.max(0, Math.min(libreLargeur, libreHauteur) / 2);
    return {
      ok: true, gapXMm: 0, gapYMm: 0, marginXMm: arrondi(marge), marginYMm: arrondi(marge),
      symetrique: true,
    };
  }

  if (ecartsLargeur === ecartsHauteur) {
    // Même nombre d'écarts des deux côtés : la solution symétrique n'existe que
    // si la place libre est la même dans les deux sens.
    if (Math.abs(libreLargeur - libreHauteur) <= 0.01) {
      const marge = Math.max(0, Math.min(libreLargeur, libreHauteur)
        / Math.max(1, 2 * (ecartsLargeur + 1)));
      return {
        ok: true,
        gapXMm: arrondi(Math.max(0, Number(options.gapXMm) || 0)),
        gapYMm: arrondi(Math.max(0, Number(options.gapXMm) || 0)),
        marginXMm: arrondi(marge), marginYMm: arrondi(marge), symetrique: true,
      };
    }
    return partager(libreLargeur, libreHauteur, ecartsLargeur, ecartsHauteur, arrondi);
  }

  const ecart = (libreHauteur - libreLargeur) / (ecartsHauteur - ecartsLargeur);
  const marge = (libreLargeur - ecartsLargeur * ecart) / 2;
  if (ecart >= -0.01 && marge >= -0.01) {
    return {
      ok: true,
      gapXMm: arrondi(Math.max(0, ecart)), gapYMm: arrondi(Math.max(0, ecart)),
      marginXMm: arrondi(Math.max(0, marge)), marginYMm: arrondi(Math.max(0, marge)),
      symetrique: true,
    };
  }
  return partager(libreLargeur, libreHauteur, ecartsLargeur, ecartsHauteur, arrondi);
}

/**
 * L'écart égal le plus grand qui laisse une marge positive, et les marges qui
 * restent. Utilisé quand la solution symétrique n'existe pas.
 * @returns {{ ok: boolean, gapXMm: number, gapYMm: number, marginXMm: number, marginYMm: number, symetrique: boolean }}
 */
function partager(libreLargeur, libreHauteur, ecartsLargeur, ecartsHauteur, arrondi) {
  const parLargeur = ecartsLargeur > 0 ? libreLargeur / ecartsLargeur : Infinity;
  const parHauteur = ecartsHauteur > 0 ? libreHauteur / ecartsHauteur : Infinity;
  const ecart = Math.max(0, Math.min(parLargeur, parHauteur));
  const margeX = ecartsLargeur > 0 ? (libreLargeur - ecartsLargeur * ecart) / 2 : libreLargeur / 2;
  const margeY = ecartsHauteur > 0 ? (libreHauteur - ecartsHauteur * ecart) / 2 : libreHauteur / 2;
  return {
    ok: true,
    gapXMm: arrondi(ecart), gapYMm: arrondi(ecart),
    marginXMm: arrondi(Math.max(0, margeX)), marginYMm: arrondi(Math.max(0, margeY)),
    symetrique: Math.abs(margeX - margeY) <= 0.01,
  };
}

/**
 * La plus grande grille qui tient sur la page, à la taille minimale d'étiquette.
 *
 * Le calcul est celui de `computeSheet` — la même formule, avec la taille
 * minimale d'étiquette à la place de la taille réelle. C'est ce qui garantit que
 * la grille rendue est acceptée par `fitGrid` : une seconde formule, écrite
 * ailleurs, finirait par diverger d'un centième et rendrait une grille refusée.
 *
 * @param {{
 *   pageWidthMm: number,
 *   pageHeightMm: number,
 *   columns: number,
 *   rows: number,
 *   marginXMm?: number,
 *   marginYMm?: number,
 *   gapXMm?: number,
 *   gapYMm?: number,
 *   minLabelMm?: number,
 * }} options
 * @returns {{ columns: number, rows: number, clamped: boolean, reason: string }}
 *   `clamped` dit si la valeur rendue diffère de la demande ; `reason` est vide
 *   dans ce cas, et l'explique sinon.
 */
export function clampGrid(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const columns = Math.max(1, Math.trunc(options.columns ?? 1));
  const rows = Math.max(1, Math.trunc(options.rows ?? 1));
  const marginXMm = nonNegative(options.marginXMm ?? 0);
  const marginYMm = nonNegative(options.marginYMm ?? 0);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const minLabelMm = Number.isFinite(options.minLabelMm) ? options.minLabelMm : 5;

  const usableWidth = pageWidthMm - marginXMm * 2;
  const usableHeight = pageHeightMm - marginYMm * 2;

  // Même tolérance que `computeSheet` : les cotes décimales tombent parfois
  // juste sous l'entier attendu, et l'epsilon reste très inférieur à toute
  // imprécision d'impression.
  const EPSILON = 1e-9;
  const pas = (usable, gap) => (gap === 0
    ? Math.floor(usable / minLabelMm + EPSILON)
    : Math.floor((usable + gap) / (minLabelMm + gap) + EPSILON));

  const maxColumns = Math.max(0, pas(usableWidth, gapXMm));
  const maxRows = Math.max(0, pas(usableHeight, gapYMm));

  const keptColumns = Math.min(columns, maxColumns);
  const keptRows = Math.min(rows, maxRows);
  const reduit = keptColumns !== columns || keptRows !== rows;

  if (!reduit) {
    return { columns: keptColumns, rows: keptRows, clamped: false, reason: '' };
  }

  // Aucune place du tout : ce n'est plus une question de nombre, et proposer
  // « 1 colonne » serait faux — elle ne tiendrait pas davantage. On le dit
  // franchement, et l'appelant n'a rien à dessiner.
  if (keptColumns === 0 || keptRows === 0) {
    return {
      columns: 0,
      rows: 0,
      clamped: true,
      reason: t('Les marges ne laissent aucune place à une étiquette sur cette feuille.'),
    };
  }

  // Deux phrases indépendantes plutôt qu'une seule à trous : chacune se traduit
  // pour elle-même, et l'ordre des mots reste celui de la langue cible.
  const raisons = [];
  if (columns > maxColumns) {
    raisons.push(t('{asked} colonnes ne tiennent pas : {kept} au maximum sur cette feuille.', {
      asked: columns, kept: keptColumns,
    }));
  }
  if (rows > maxRows) {
    raisons.push(t('{asked} rangées ne tiennent pas : {kept} au maximum sur cette feuille.', {
      asked: rows, kept: keptRows,
    }));
  }

  return {
    columns: keptColumns,
    rows: keptRows,
    clamped: true,
    reason: `${raisons.join(' ')} ${t("Réduisez l'écart ou la marge pour en placer davantage.")}`,
  };
}

/**
 * Traduit les cotes publiées d'une planche en réglages de grille.
 *
 * Une planche du commerce a une marge gauche et une marge haute différentes, et
 * sa marge de droite n'est pas toujours égale à celle de gauche. La grille, elle,
 * se règle par une marge symétrique sur chaque axe : on prend donc, pour chaque
 * axe, ce qui reste une fois les étiquettes et leurs écarts retirés, réparti
 * également des deux côtés.
 *
 * Conséquence, et elle compte : la taille d'étiquette et le **pas** sont exacts,
 * donc les colonnes tombent bien en face de leurs cases ; seule la position
 * d'ensemble peut être décalée de quelques dixièmes de millimètre par rapport à
 * la planche du fabricant. C'est un décalage constant, que les champs de
 * décalage rattrapent — contrairement à une erreur de pas, qui s'accumulerait.
 *
 * @param {{ declaredColumns: number, declaredRows: number, labelWidthMm: number,
 *   labelHeightMm: number, gapXMm: number, gapYMm: number }} preset
 * @param {{ widthMm: number, heightMm: number }} page
 * @returns {{ columns: number, rows: number, marginXMm: number, marginYMm: number,
 *   gapXMm: number, gapYMm: number }}
 */
export function presetToGrid(preset, page) {
  const middle = (total, count, size, gap) => (total - count * size - (count - 1) * gap) / 2;
  return {
    columns: preset.declaredColumns,
    rows: preset.declaredRows,
    marginXMm: Math.round(middle(
      page.widthMm, preset.declaredColumns, preset.labelWidthMm, preset.gapXMm,
    ) * 100) / 100,
    marginYMm: Math.round(middle(
      page.heightMm, preset.declaredRows, preset.labelHeightMm, preset.gapYMm,
    ) * 100) / 100,
    gapXMm: preset.gapXMm,
    gapYMm: preset.gapYMm,
  };
}
