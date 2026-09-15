/**
 * Géométrie des planches d'impression.
 *
 * Calcule où tombe chaque étiquette sur une feuille (A4 le plus souvent), en
 * millimètres. Le rendu s'appuie ensuite sur ces positions : c'est ce qui
 * permet d'imprimer sur une planche d'étiquettes autocollantes sans décalage
 * cumulatif, contrairement à une grille CSS dont les arrondis dérivent.
 */

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
 * valides. Les dispositions `avery-*` reproduisent les cotes publiées pour ces
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
export const SHEET_PRESETS = Object.freeze({
  // --- Dispositions génériques ---------------------------------------------
  'a4-3x8': {
    label: 'A4 — 3 × 8 (63,5 × 33,9 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginXMm: 7.25,
    marginYMm: 12.9,
    gapXMm: 2.5,
    gapYMm: 0,
  },
  'a4-2x7': {
    label: 'A4 — 2 × 7 (99,1 × 38,1 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 2,
    declaredRows: 7,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginXMm: 4.65,
    marginYMm: 15.15,
    gapXMm: 2.5,
    gapYMm: 0,
  },
  'a4-4x10': {
    label: 'A4 — 4 × 10 (48 × 25 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 4,
    declaredRows: 10,
    labelWidthMm: 48,
    labelHeightMm: 25,
    marginXMm: 6,
    marginYMm: 23.5,
    gapXMm: 2,
    gapYMm: 0,
  },
  'a4-qr-3x4': {
    label: 'A4 — 3 × 4 grandes étiquettes QR (60 × 60 mm)',
    group: 'generic',
    page: 'a4',
    declaredColumns: 3,
    declaredRows: 4,
    labelWidthMm: 60,
    labelHeightMm: 60,
    marginXMm: 10,
    marginYMm: 28.5,
    gapXMm: 5,
    gapYMm: 0,
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

/** Proportion minimale du QR par rapport au petit côté de l'étiquette. */
export const MIN_QR_RATIO = 0.3;
/** Proportion maximale : au-delà, le QR chasse le texte hors de l'étiquette. */
export const MAX_QR_RATIO = 1;
/** Hauteur d'une ligne de texte à 7 pt avec une interligne de 1,15. */
export const SHEET_TEXT_LINE_MM = 2.84;
/** Écart entre le QR et le texte, identique à celui de la feuille de style. */
export const SHEET_QR_GAP_MM = 1.5;

/**
 * Côté du QR code d'une étiquette de planche, en millimètres.
 *
 * Le QR est carré : il se règle donc sur le **petit** côté de l'étiquette. Sans
 * cette borne, une étiquette basse (33,9 mm de haut pour 63,5 mm de large)
 * produirait un QR plus haut que son support. La proportion est bornée pour
 * qu'aucune valeur d'interface ne puisse dépasser l'étiquette.
 *
 * @param {number} labelWidthMm
 * @param {number} labelHeightMm
 * @param {number} ratio  Proportion du petit côté, entre 0,3 et 1.
 * @returns {number}
 * @throws {TypeError} si une dimension n'est pas un nombre positif.
 */
export function qrSideMm(labelWidthMm, labelHeightMm, ratio) {
  const base = Math.min(
    positive(labelWidthMm, 'labelWidthMm'),
    positive(labelHeightMm, 'labelHeightMm'),
  );
  const wanted = Number.isFinite(ratio) ? ratio : MAX_QR_RATIO;
  const clamped = Math.min(MAX_QR_RATIO, Math.max(MIN_QR_RATIO, wanted));
  return round2(base * clamped);
}

/**
 * Vérifie que le QR et au moins une ligne de texte tiennent dans l'étiquette.
 *
 * C'est la garantie contre le défaut le plus visible d'une planche : du texte
 * rogné en silence parce que le QR a été agrandi au-delà du raisonnable.
 *
 * @param {{
 *   labelWidthMm: number,
 *   labelHeightMm: number,
 *   qrSideMm: number,
 *   textLines?: number,
 *   lineHeightMm?: number,
 *   gapMm?: number,
 * }} options
 * @returns {{ ok: boolean, neededMm: number, availableMm: number, reason: string }}
 */
export function cellContentFits(options) {
  const labelWidthMm = positive(options.labelWidthMm, 'labelWidthMm');
  const labelHeightMm = positive(options.labelHeightMm, 'labelHeightMm');
  const side = positive(options.qrSideMm, 'qrSideMm');
  const lines = Number.isFinite(options.textLines) ? Math.max(0, options.textLines) : 1;
  const lineHeightMm = Number.isFinite(options.lineHeightMm)
    ? options.lineHeightMm
    : SHEET_TEXT_LINE_MM;
  const gapMm = Number.isFinite(options.gapMm) ? options.gapMm : SHEET_QR_GAP_MM;

  const neededMm = side + (lines > 0 ? gapMm + lines * lineHeightMm : 0);
  const tooWide = side > labelWidthMm + 1e-9;
  const tooTall = neededMm > labelHeightMm + 1e-9;

  let reason = '';
  if (tooWide) {
    reason =
      `Le QR fait ${round2(side)} mm de large pour une étiquette de ` +
      `${round2(labelWidthMm)} mm.`;
  } else if (tooTall) {
    reason =
      `Le QR (${round2(side)} mm) et ${lines} ligne${lines > 1 ? 's' : ''} de texte ` +
      `demandent ${round2(neededMm)} mm pour ${round2(labelHeightMm)} mm de haut : ` +
      'le texte sera rogné. Réduisez la largeur du QR.';
  }

  return {
    ok: !tooWide && !tooTall,
    neededMm: round2(neededMm),
    availableMm: round2(labelHeightMm),
    reason,
  };
}

// ---------------------------------------------------------------------------
// Remplir la feuille : colonnes, rangées et marge globale
// ---------------------------------------------------------------------------

/**
 * Calcule la taille d'étiquette qui remplit une feuille pour une grille donnée.
 *
 * C'est l'inverse de `computeSheet` : au lieu de partir des cotes d'une
 * étiquette, on part du nombre de colonnes et de rangées voulu, et l'étiquette
 * prend la place restante. Utile quand on ne cherche pas une référence
 * commerciale précise, mais qu'on veut simplement « 4 colonnes sur cette
 * feuille, avec 4 mm de marge ».
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
export function fitGrid(options) {
  const pageWidthMm = positive(options.pageWidthMm, 'pageWidthMm');
  const pageHeightMm = positive(options.pageHeightMm, 'pageHeightMm');
  const columns = Math.max(1, Math.trunc(options.columns ?? 1));
  const rows = Math.max(1, Math.trunc(options.rows ?? 1));
  const marginMm = nonNegative(options.marginMm ?? 0);
  const gapXMm = nonNegative(options.gapXMm ?? 0);
  const gapYMm = nonNegative(options.gapYMm ?? 0);
  const minLabelMm = Number.isFinite(options.minLabelMm) ? options.minLabelMm : 5;

  const usableWidth = pageWidthMm - marginMm * 2;
  const usableHeight = pageHeightMm - marginMm * 2;

  const rawWidth = (usableWidth - (columns - 1) * gapXMm) / columns;
  const rawHeight = (usableHeight - (rows - 1) * gapYMm) / rows;

  const refuse = (reason) => ({
    ok: false,
    reason,
    labelWidthMm: 0,
    labelHeightMm: 0,
    marginXMm: marginMm,
    marginYMm: marginMm,
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
    marginXMm: floor2(marginMm + slackX / 2),
    marginYMm: floor2(marginMm + slackY / 2),
    columns,
    rows,
  };
}
