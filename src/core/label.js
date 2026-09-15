/**
 * Composition d'une étiquette : un QR code et une URL lisible.
 *
 * Ce module ne dépend d'aucune imprimante : il décrit une géométrie en pixels
 * pour une largeur de tête et une résolution données. Les profils concrets
 * (D110, M2) vivent dans `printer/profiles.js`, ce qui permet de tester la mise
 * en page sans matériel.
 */

import { encodeQr, drawQr, pickScale } from './qr.js';
import { hostOf } from './link.js';

/**
 * @typedef {Object} LabelGeometry
 * @property {number} width       Largeur totale en pixels.
 * @property {number} height      Hauteur totale en pixels.
 * @property {number} padding     Marge intérieure en pixels.
 * @property {number} qrSize      Côté du QR en pixels (multiple de l'échelle).
 * @property {number} textTop     Ordonnée du premier texte.
 * @property {number} lineHeight  Hauteur de ligne de texte.
 * @property {string[]} lines     Lignes de texte déjà découpées.
 * @property {number} fontSize    Taille de police en pixels.
 * @property {number} qrScale     Pixels par module du QR.
 * @property {number} pxPerModule Pixels par module.
 * @property {boolean} fits       false si le QR ne tient pas dans la largeur utile.
 * @property {import('./qr.js').QrMatrix} qrMatrix Matrice encodée.
 */

/**
 * Contenu textuel d'une étiquette Niimbot, selon le mode choisi.
 *
 * Le même vocabulaire que l'export d'images (`TEXT_MODES`), pour qu'on n'ait
 * qu'une chose à apprendre : QR seul, QR + titre, QR + URL, etc. La date, elle,
 * suit le réglage global « Date sous le QR code » et s'ajoute en dernier.
 *
 * Le titre et la date occupent chacun **une ligne réservée** : `extraLines`
 * prévient la géométrie, sans quoi la dernière ligne serait rognée.
 *
 * @param {{ url: string, title?: string }} link
 * @param {string} mode `none`, `title`, `url`, `title-url` ou `host`.
 * @param {string[]} [dateLines] Lignes de date à imprimer sous le texte, déjà
 *   découpées à la largeur utile. Un tableau vide n'imprime rien.
 * @returns {{ text: string, showTitle: boolean, extraLines: number, extraText: string[] }}
 */
export function labelContent(link, mode, dateLines = []) {
  // Un titre absent ne doit pas réserver une ligne vide.
  const title = typeof link.title === 'string' ? link.title : '';
  const wantsTitle = (mode === 'title' || mode === 'title-url') && title !== '';

  let text = '';
  if (mode === 'url' || mode === 'title-url') text = link.url;
  else if (mode === 'host') text = hostOf(link.url);
  else if (mode === 'title' && !wantsTitle) text = link.url; // titre vide : l'URL

  // La date arrive déjà découpée : « 15/09/2026 21:28 » demande 114 px là où un
  // D110 n'en offre que 84, et `drawLabel` écrit ses lignes telles quelles.
  const extraText = Array.isArray(dateLines) ? dateLines.filter(Boolean) : [];

  return {
    text,
    showTitle: wantsTitle,
    extraLines: (wantsTitle ? 1 : 0) + extraText.length,
    extraText,
  };
}

/**
 * Prépare la date à imprimer sous le QR, en la découpant si elle ne tient pas.
 *
 * `drawLabel` écrit chaque ligne supplémentaire telle quelle, sans la découper :
 * une date trop large déborderait. On lui fournit donc des lignes déjà prêtes.
 * La date est rendue **entière** ou pas du tout.
 *
 * @param {(text: string) => number} measure Mesure du texte, à la taille de police retenue.
 * @param {string} dateText Date déjà mise en forme.
 * @param {number} maxWidth Largeur utile, en pixels.
 * @param {number} maxLines Nombre de lignes que la date peut occuper.
 * @returns {string[]} Lignes de la date, ou un tableau vide si elle ne tient pas.
 */
export function wrapDate(measure, dateText, maxWidth, maxLines) {
  if (dateText === '' || maxLines <= 0) return [];

  // Une date ne se coupe pas n'importe où : « 15/09/ » puis « 2026 » se lit mal
  // et fait hésiter. Le seul point de coupure acceptable est l'espace entre la
  // date et l'heure, qui donne deux morceaux entiers et lisibles.
  const parts = dateText.trim().split(/\s+/);
  if (parts.length > 1) {
    const [jour, heure] = [parts[0], parts.slice(1).join(' ')];
    if (measure(jour) <= maxWidth && measure(heure) <= maxWidth) return [jour, heure];
  }

  // Sinon la date reste d'un seul tenant, ou n'est pas imprimée du tout.
  return measure(dateText) <= maxWidth ? [dateText] : [];
}

/**
 * Plus grande taille de police à laquelle la date tient sur une ligne entière.
 *
 * La date est écrite d'un bloc : si la police retenue la fait déborder, elle
 * était jusqu'ici coupée en plein milieu (« 15/09/ » puis « 2026 »). On préfère
 * réduire la police du texte — l'étiquette entière reste cohérente — plutôt que
 * d'amputer la date. Renvoie `0` si même le plancher de lisibilité ne suffit
 * pas, auquel cas la date est abandonnée et l'interface le dit.
 *
 * @param {(size: number) => ((text: string) => number)} measureFactory
 * @param {string} dateText
 * @param {number} maxWidth
 * @param {number} floor Taille minimale acceptable, en pixels.
 * @returns {number} Taille retenue, ou 0.
 */
export function fontSizeForDate(measureFactory, dateText, maxWidth, floor) {
  for (let size = 40; size >= floor; size--) {
    if (measureFactory(size)(dateText) <= maxWidth) return size;
  }
  return 0;
}

/**
 * Plancher de police, en pixels, pour une largeur de tête donnée.
 *
 * `MIN_FONT_MM` est la cible, mais une tête plus étroite que la police minimale
 * ne pourrait rien imprimer : on ne descend jamais sous la moitié de cette
 * cible, quelle que soit la largeur.
 *
 * @param {number} width Largeur de tête en pixels.
 * @param {number} dpi
 * @returns {number}
 */
function pxToMmFloor(width, dpi) {
  return Math.min(mmToPx(MIN_FONT_MM, dpi), Math.max(6, Math.floor(width * 0.09)));
}

/**
 * Compose le contenu d'une étiquette à partir de choix indépendants.
 *
 * Remplace l'ancien mode unique — « QR + titre », « QR + URL »… — par des cases
 * qui se cumulent : le titre, l'URL, le domaine, le numéro et la date ne
 * s'excluent pas. Le numéro sert à retrouver la ligne de la liste quand
 * l'étiquette est trop petite pour porter l'URL entière.
 *
 * @param {{ url: string, title?: string }} link
 * @param {{
 *   index?: number|null,
 *   title?: boolean,
 *   url?: boolean,
 *   host?: boolean,
 *   indexVisible?: boolean,
 *   dateLines?: string[],
 * }} options
 * @returns {{ text: string, showTitle: boolean, extraLines: number, extraText: string[] }}
 */
export function labelContentFromChoices(link, options = {}) {
  const title = typeof link.title === 'string' ? link.title.trim() : '';
  // Le titre n'est repris que s'il existe : cocher « Titre » sur un lien sans
  // titre ne doit pas laisser une ligne vide sous le QR.
  const showTitle = options.title === true && title !== '';

  const parts = [];
  // Le numéro vient en tête : c'est ce qu'on cherche des yeux sur une petite
  // étiquette, avant même le titre.
  if (options.indexVisible === true && Number.isFinite(options.index)) {
    parts.push(`N° ${options.index}`);
  }
  if (showTitle) parts.push(title);
  if (options.url === true) parts.push(link.url);
  if (options.host === true) parts.push(hostOf(link.url));

  // Le titre est rendu en gras par `drawLabel`, donc à part du texte courant :
  // le mêler aux autres segments lui ferait perdre sa mise en forme.
  const text = parts.filter((part) => part !== '' && part !== title).join(' ');
  const extraText = Array.isArray(options.dateLines) ? options.dateLines.filter(Boolean) : [];

  // Le titre est découpé comme le reste du texte. Il était réservé sur **une**
  // ligne puis écrit sans découpe : un titre long débordait de l'étiquette, ou
  // se faisait couper au bord. `options.titleLines` porte les lignes déjà
  // découpées ; `titleLines` vaut 1 par défaut, pour ne rien changer aux
  // appelants qui n'en fournissent pas.
  const titleLines = Array.isArray(options.titleLines) && options.titleLines.length > 0
    ? options.titleLines
    : (showTitle ? [title] : []);

  return {
    text,
    showTitle,
    titleLines,
    extraLines: titleLines.length + extraText.length,
    extraText,
  };
}

/** Échelle minimale : sous 2 px par module, la tête thermique fusionne les points. */
export const MIN_QR_SCALE = 2;

/**
 * Hauteur de texte minimale, en millimètres.
 *
 * À 203 dpi, `width * 0.085` donnait 8 px sur une tête de 96 px — soit 1 mm de
 * haut. Les chiffres montaient à 3 px : illisible à l'œil nu, et c'est le
 * défaut que ce plancher corrige. 1,6 mm est le minimum qu'on lise sans effort
 * sur une étiquette thermique.
 */
export const MIN_FONT_MM = 1.6;

/**
 * Part de la hauteur que le texte peut occuper au maximum.
 *
 * Le reste va au QR : une étiquette où le texte mange les deux tiers de la
 * longueur ne se scanne plus. Sans ce plafond, une URL longue sur une longueur
 * de rouleau confortable ferait exactement cela.
 */
export const LABEL_TEXT_HEIGHT_RATIO = 0.45;

/**
 * Disposition verticale de l'étiquette.
 *
 * `top` garde la composition resserrée en haut, telle qu'elle était avant que
 * la longueur du rouleau soit connue : c'est le repli quand aucune longueur
 * n'est renseignée.
 */
export const LABEL_ALIGNMENTS = Object.freeze([
  { id: 'center', label: 'Centré' },
  { id: 'top', label: 'En haut' },
  { id: 'spread', label: 'Réparti (QR en haut, texte en bas)' },
]);

/** Disposition retenue par défaut. */
export const DEFAULT_LABEL_ALIGNMENT = 'center';

/**
 * Taille de police maximale, en part de la largeur de la tête.
 *
 * Une longueur de rouleau confortable donne envie de grossir le texte jusqu'à
 * remplir la place. Au-delà de ce plafond, le texte devient plus gros que le QR
 * qu'il accompagne : l'étiquette perd son équilibre et le QR, seul élément
 * utile, passe au second plan. Le reste de la place va aux marges.
 */
export const MAX_FONT_WIDTH_RATIO = 0.18;

/**
 * Largeur minimale d'une colonne de texte, en pixels.
 *
 * En dessous, la disposition latérale n'a plus de sens : une URL dense occupe
 * tant de modules qu'il ne reste que quelques pixels, soit deux ou trois
 * caractères par ligne. Mieux vaut empiler, et le dire, que produire un texte
 * illisible.
 */
export const MIN_LATERAL_TEXT_PX = 18;

/**
 * Découpe un texte en lignes tenant dans une largeur donnée.
 *
 * Le découpage se fait sur les espaces, mais aussi après « / », « - » et « . »
 * car les URL n'ont souvent pas d'espace avant la fin du domaine. Un mot plus
 * long que la largeur disponible est coupé caractère par caractère plutôt que
 * de déborder.
 *
 * @param {(text: string) => number} measure Largeur d'un texte, en pixels.
 * @param {string} text
 * @param {number} maxWidth
 * @param {{ maxLines?: number }} [options]
 * @returns {string[]}
 */
export function wrapText(measure, text, maxWidth, options = {}) {
  const maxLines = options.maxLines ?? Infinity;
  if (!text) return [];
  if (maxWidth <= 0) return [text];

  const lines = [];
  let current = '';

  /** Découpe un « mot » trop long en morceaux qui tiennent seuls. */
  const splitLongWord = (word) => {
    const chunks = [];
    let chunk = '';
    for (const char of word) {
      if (measure(chunk + char) > maxWidth && chunk !== '') {
        chunks.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  };

  // On conserve les séparateurs en les rattachant au fragment précédent.
  const tokens = text.split(/(?<=[\s/\-.])/).filter((token) => token !== '');

  for (const token of tokens) {
    const candidate = current + token;
    const trimmed = candidate.replace(/\s+$/, '');

    if (measure(trimmed) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current.trim() !== '') {
      lines.push(current.trim());
      if (lines.length >= maxLines) return lines;
      current = '';
    }
    const word = token.trim();
    if (word === '') continue;

    if (measure(word) <= maxWidth) {
      current = word + (/[\s]$/.test(token) ? ' ' : '');
    } else {
      const chunks = splitLongWord(word);
      for (let i = 0; i < chunks.length - 1; i++) {
        lines.push(chunks[i]);
        if (lines.length >= maxLines) return lines;
      }
      current = chunks[chunks.length - 1] ?? '';
    }
  }

  if (current.trim() !== '' && lines.length < maxLines) lines.push(current.trim());
  return lines;
}

/**
 * Calcule la géométrie d'une étiquette.
 *
 * La hauteur n'est jamais fixée à l'avance : elle découle du nombre de lignes
 * de texte nécessaires. Cela évite de rogner une URL longue ou, à l'inverse,
 * de gaspiller une étiquette sur une URL courte.
 *
 * @param {object} options
 * @param {string} options.text           Texte à imprimer sous le QR (généralement l'URL).
 * @param {string} [options.qrText]       Contenu réellement encodé dans le QR.
 *   Distinct de `text` : les deux ne coïncident que par hasard. Un QR code
 *   peut n'avoir aucun texte sous lui (mode « QR seul »), et un titre imprimé
 *   n'est pas ce qu'on encode. Les confondre faisait lever l'encodage dès que
 *   le texte était vide — « QR code seul » et « QR + titre » ne rendaient rien.
 * @param {number} options.widthPx        Largeur utile de la tête, en pixels.
 * @param {number} [options.dpi]          Résolution, pour les conversions mm <-> px.
 * @param {number} [options.fontSize]     Taille de police en pixels.
 * @param {number} [options.padding]      Marge intérieure en pixels.
 * @param {number} [options.qrRatio]      Part maximale de la largeur utile occupée par le QR (0-1).
 * @param {number} [options.minScale]     Pixels par module minimum (défaut : MIN_QR_SCALE).
 * @param {number} [options.lineSpacing]  Interligne, en multiple de la police.
 * @param {number} [options.maxLines]     Nombre maximal de lignes de texte.
 * @param {number} [options.maxHeightPx]  Hauteur maximale imposée (0 = illimitée).
 * @param {number} [options.minHeightPx]  Hauteur minimale de l'étiquette.
 * @param {string} [options.alignment]    `center`, `top` ou `spread` : où placer
 *   le contenu quand une longueur est imposée et qu'il y a de la place en trop.
 * @param {number} [options.extraLines]   Lignes de texte supplémentaires à
 *   réserver sous celles du texte principal — la date, quand elle est demandée.
 *   Les ignorer rognerait la dernière ligne en silence.
 * @param {(text: string) => number} [options.measure] Mesure de texte injectée
 *   (obligatoire hors navigateur ; en navigateur, un canvas est créé au besoin).
 * @returns {LabelGeometry}
 */
export function computeLabelGeometry(options) {
  const width = Math.max(1, Math.floor(options.widthPx));
  const dpi = options.dpi ?? 203;
  const padding = Math.max(0, Math.floor(options.padding ?? Math.round(width * 0.06)));
  const fontSize = Math.max(6, Math.floor(options.fontSize ?? mmToPx(MIN_FONT_MM, dpi)));
  const lineSpacing = options.lineSpacing ?? 1.15;
  const alignment = options.alignment ?? DEFAULT_LABEL_ALIGNMENT;

  const innerWidth = Math.max(1, width - padding * 2);
  const qrRatio = Math.min(1, Math.max(0.3, options.qrRatio ?? 0.95));
  const minScale = Math.max(1, Math.floor(options.minScale ?? MIN_QR_SCALE));
  const maxLines = options.maxLines ?? 4;

  const extraLines = Math.max(0, Math.trunc(options.extraLines ?? 0));
  const requestedAlign = LABEL_ALIGNMENTS.some((entry) => entry.id === alignment)
    ? alignment
    : DEFAULT_LABEL_ALIGNMENT;

  const minHeight = Math.max(0, Math.floor(options.minHeightPx ?? 0));
  const maxHeight = Math.max(0, Math.floor(options.maxHeightPx ?? 0));

  // La longueur du rouleau est une contrainte, pas un plancher : composer plus
  // court ne raccourcit pas l'étiquette, l'imprimante avance jusqu'à la découpe
  // suivante et le reste sort blanc. On remplit donc exactement la place.
  let target = minHeight;
  if (maxHeight > 0) target = target > 0 ? Math.min(target, maxHeight) : maxHeight;

  // Le QR a une taille entière en modules : on arrondit au multiple inférieur.
  // Ce qui est encodé n'est pas ce qui est imprimé : `qrText` prime, et à
  // défaut on retombe sur le texte affiché, comportement d'origine.
  const qrText = options.qrText ?? options.text ?? '';
  const matrix = encodeQr(qrText === '' ? ' ' : qrText, { ecc: options.ecc ?? 'M', border: 2 });
  // La mesure doit suivre la taille de police essayée : une mesure fixe servait
  // à découper pour toutes les tailles candidates, si bien que le texte découpé
  // pour 13 px était tracé à 17 px et débordait de l'étiquette. `measureFactory`
  // reçoit la taille et rend la mesure correspondante ; `measure` reste accepté
  // pour les appelants qui n'ont qu'une taille (tests, exports).
  const measureFactory = options.measureFactory
    ?? (options.measure ? () => options.measure : (size) => defaultMeasure(size));
  const measure = options.measure ?? measureFactory(fontSize);

  /** Découpe le texte pour une taille de police, dans les limites de la cible. */
  const layoutText = (size) => {
    const height = Math.ceil(size * lineSpacing);
    const mesure = measureFactory(size);
    // Le texte ne peut pas manger toute la longueur : au-delà, le QR n'a plus
    // de place et la disposition répartie le pousserait hors de l'étiquette.
    const cap = target > 0
      ? Math.max(extraLines, Math.floor((target * LABEL_TEXT_HEIGHT_RATIO) / height))
      : maxLines;
    // Le plafond de lignes protège l'équilibre entre le QR et son texte, mais il
    // ne doit pas amputer le texte : une URL coupée après « com/ » est fausse,
    // pas seulement tronquée. On compte donc les lignes qu'il faut réellement,
    // et on ne retient le plafond que s'il suffit. S'il ne suffit pas, la police
    // sera réduite par `tryFont`, qui juge sur la hauteur obtenue.
    const complet = wrapText(mesure, options.text ?? '', innerWidth, { maxLines: Infinity });
    // Ce que la longueur du rouleau peut réellement contenir : le QR, l'écart,
    // la marge, et le reste pour le texte. C'est cette borne qui empêche le
    // texte entier de dépasser l'étiquette — sans elle, garder le texte complet
    // faisait sortir 292 px sur une cible de 176.
    const placeTexte = target > 0
      ? target - padding * 2 - qrSize - (extraLines > 0 || true ? padding : 0)
      : Infinity;
    const lignesPossibles = Number.isFinite(placeTexte)
      ? Math.max(1, Math.floor(placeTexte / height))
      : Infinity;

    const plafond = Math.min(maxLines, cap, lignesPossibles);
    const suffisant = plafond >= complet.length;
    // Le plafond cède pour ne pas amputer le texte, mais jamais au-delà de ce
    // que la hauteur permet : la réduction de police fait le reste.
    const limite = suffisant ? plafond : Math.min(Math.max(plafond, complet.length), lignesPossibles);
    const limits = [Math.max(1, limite)];
    if (target > 0 && extraLines > 0) {
      // La date s'écrit sur une seule ligne, sans découpage : un interligne qui
      // la ferait dépasser ne doit pas être retenu.
      limits.push(Math.floor((target - padding) / height));
    }
    return {
      lines: wrapText(mesure, options.text ?? '', innerWidth, {
        maxLines: Math.max(0, Math.min(...limits)),
      }),
      lineHeight: height,
    };
  };

  // Le texte dispose de la place que le QR lui laisse ; on retient donc la
  // police la plus grande qui tienne, en essayant d'abord de remplir la
  // longueur, puis la taille demandée, puis la lisibilité minimale.
  const requested = Math.floor(options.fontSize ?? 0);
  const candidates = [];
  if (target > 0) candidates.push(Math.floor((target * 0.22) / lineSpacing));
  if (requested > 0) candidates.push(requested);
  candidates.push(fontSize);

  const textTarget = Math.floor(innerWidth * qrRatio);
  const scale = Math.max(minScale, pickScale(textTarget, matrix.size));
  const qrSize = matrix.size * scale;
  const fits = qrSize <= innerWidth;

  // Le texte ne monte pas plus haut que cette part de la largeur de la tête :
  // au-delà il dominerait le QR au lieu de l'accompagner.
  const fontCeiling = Math.max(6, Math.floor(width * MAX_FONT_WIDTH_RATIO));

  /**
   * Essaie une taille de police et dit si elle tient.
   *
   * « Tenir » veut dire deux choses, et les deux comptent : le contenu garde la
   * marge basse de l'étiquette, et le QR conserve sa place au-dessus. Ne
   * vérifier que la première laissait passer une taille qui chassait le QR ou
   * qui collait le texte au bord.
   */
  const tryFont = (size) => {
    const usable = Math.max(6, Math.min(size, fontCeiling));
    const attempt = layoutText(usable);
    const textHeight = (attempt.lines.length + extraLines) * attempt.lineHeight;
    // Hauteur complète : marge haute, QR, écart, texte, **et marge basse**.
    // C'est la plus petite hauteur d'étiquette qui contienne le tout. Oublier
    // la marge basse donnait une étiquette dont le texte touchait le bord, et
    // une disposition répartie qui n'avait plus rien à répartir.
    const natural = qrSize + (attempt.lines.length + extraLines > 0 ? padding + textHeight : 0)
      + padding * 2;
    return {
      fontSize: usable,
      lines: attempt.lines,
      lineHeight: attempt.lineHeight,
      textHeight,
      naturalHeight: natural,
      ok: target === 0 ? true : natural <= target,
    };
  };

  let placed = null;
  let fallback = null;
  for (const size of candidates) {
    const attempt = tryFont(size);
    if (attempt.ok) {
      placed = attempt;
      break;
    }
    // Aucune taille ne tient : on garde la plus petite essayée, c'est-à-dire la
    // dernière, plutôt que d'abandonner le texte ou de le laisser déborder.
    fallback = attempt;
  }

  // Aucune taille essayée ne tient ? Le texte déborde parce qu'il est trop
  // gros, pas parce qu'il est trop long : on réduit alors la police jusqu'à ce
  // qu'il entre, sans descendre sous le plancher de lisibilité. Sans cette
  // recherche, `maxLines` tronquait l'URL en silence — l'étiquette sortait
  // amputée, ce qui est pire qu'un texte petit.
  if (placed === null) {
    const floor = Math.max(6, Math.floor(pxToMmFloor(width, dpi)));
    for (let size = (fallback?.fontSize ?? floor) - 1; size >= floor; size--) {
      const attempt = tryFont(size);
      if (attempt.ok) {
        placed = attempt;
        break;
      }
      fallback = attempt;
    }
  }

  placed = placed ?? fallback;

  const { lines, lineHeight } = placed;
  const textHeight = placed.textHeight;
  const contentLines = lines.length + extraLines;

  // Plus petite hauteur d'étiquette qui contienne le contenu et ses deux
  // marges. C'est elle qui décide si la longueur demandée suffit.
  const naturalHeight = placed.naturalHeight;
  // Une longueur plus courte que le contenu ne peut pas être remplie : on rend
  // la hauteur naturelle, la plus petite qui contienne tout avec ses marges.
  // La borner à la longueur annoncée ferait déborder le contenu sous le bord.
  const height = target > 0 && naturalHeight <= target ? target : naturalHeight;

  // `spread` et `center` n'ont de sens que si le contenu tient : sans cette
  // garde, une longueur trop courte placerait le texte **sous** le bord.
  const effectiveAlign = target > 0 && naturalHeight <= target ? requestedAlign : 'top';
  const slack = height - naturalHeight;

  let qrTop;
  let spreadGap = padding;
  if (effectiveAlign === 'spread') {
    qrTop = padding;
    // Le texte finit à `height - padding`. `naturalHeight` comprend déjà cette
    // marge basse : l'écart cherché est donc `slack`, et non `slack + padding`.
    spreadGap = padding + slack;
  } else if (effectiveAlign === 'center') {
    // La place restante se partage en deux : une moitié au-dessus du QR, une
    // sous le texte. Chaque moitié s'ajoute à la marge, qui reste intacte.
    const centered = Math.floor(slack / 2);
    qrTop = padding + centered;
    spreadGap = padding + (slack - centered);
  } else {
    qrTop = padding;
  }

  // Le texte peut se placer au-dessus du QR : on remonte alors le QR de la
  // hauteur du texte, pour que les deux ne se chevauchent pas. Sans ce
  // décalage, « texte au-dessus » dessinait le texte par-dessus le code.
  const blockHeight = qrSize + (contentLines > 0 ? spreadGap + textHeight : 0);
  const top = options.textFirst === true
    ? padding + (contentLines > 0 ? textHeight + spreadGap : 0)
    : qrTop;
  const textAtTop = options.textFirst === true
    ? padding
    : qrTop + qrSize + spreadGap;

  return {
    width,
    height,
    padding,
    qrSize,
    qrScale: scale,
    pxPerModule: qrSize / matrix.size,
    fits,
    qrMatrix: matrix,
    qrTop: Math.round(top),
    qrLeft: Math.floor((width - qrSize) / 2),
    qrTextGap: spreadGap,
    textTop: Math.round(textAtTop),
    blockHeight,
    lineHeight,
    lines,
    extraLines,
    fontSize: placed.fontSize,
    targetHeight: target,
    naturalHeight,
    slack,
    alignment: effectiveAlign,
  };
}

/**
 * Dispose le QR et le texte côte à côte, sur la largeur de la tête.
 *
 * L'orientation « horizontale » ne tourne rien : elle change l'axe de
 * composition. Le QR garde sa taille, le texte se découpe sur la largeur qui
 * reste et se cale à droite du code. C'est ce qui permet de garder le texte
 * lisible et paramétrable quelle que soit l'orientation du support.
 *
 * @param {LabelGeometry} geometry Géométrie verticale déjà calculée.
 * @param {{
 *   measure: (text: string) => number,
 *   maxLines?: number,
 *   gap?: number,
 * }} options
 * @returns {LabelGeometry}
 */
export function layoutLabelLateral(geometry, options) {
  const gap = Math.max(1, Math.floor(options.gap ?? geometry.padding));
  const maxLines = Math.max(1, Math.trunc(options.maxLines ?? 4));

  // Le QR ne descend jamais sous son échelle minimale : un code illisible ne
  // sert à rien, et c'est le texte qui cède, pas le code. Sa taille plancher
  // est donc celle qui décide s'il reste une colonne utilisable pour le texte.
  const minQr = geometry.qrMatrix.size * MIN_QR_SCALE;
  const usable = geometry.width - geometry.padding * 2 - gap;
  const textWidth = usable - minQr;

  // Sous ce seuil, il n'y a pas de colonne de texte : une URL dense occupe tant
  // de modules qu'il ne reste que quelques pixels. Plutôt que d'écrire trois
  // caractères par ligne, on refuse la disposition latérale et on le signale —
  // c'est à l'appelant de retomber sur l'empilement.
  if (textWidth < MIN_LATERAL_TEXT_PX) {
    return { ...geometry, lateral: false, lateralRefused: true, lateralTextWidth: textWidth };
  }

  // Le texte a la place qu'il lui faut ; le QR prend le reste, jusqu'à être
  // aussi grand que possible sans jamais empiéter sur cette colonne.
  const qrMax = Math.max(minQr, usable - MIN_LATERAL_TEXT_PX);
  let qrSize = geometry.qrSize;
  let qrScale = geometry.qrScale;
  if (qrSize > qrMax) {
    qrScale = Math.max(MIN_QR_SCALE, Math.floor(qrMax / geometry.qrMatrix.size));
    qrSize = geometry.qrMatrix.size * qrScale;
  }

  const textLeft = geometry.padding + qrSize + gap;
  const realTextWidth = Math.max(1, geometry.width - geometry.padding - textLeft);

  const lines = wrapText(options.measure, options.text ?? '', realTextWidth, { maxLines });
  const lineHeight = geometry.lineHeight;
  const textHeight = (lines.length + geometry.extraLines) * lineHeight;

  // Le contenu occupe la hauteur qu'il faut, jamais plus que l'étiquette.
  const contentHeight = Math.max(qrSize, textHeight);
  const height = Math.max(
    geometry.height,
    contentHeight + geometry.padding * 2,
  );

  return {
    ...geometry,
    height,
    qrSize,
    qrScale,
    pxPerModule: qrSize / geometry.qrMatrix.size,
    qrTop: Math.floor((height - qrSize) / 2),
    qrLeft: geometry.padding,
    textLeft,
    textWidth: realTextWidth,
    textAlign: 'left',
    textTop: Math.floor((height - textHeight) / 2),
    lines,
    lateral: true,
  };
}

/**
 * Dispose le QR en haut et son texte tourné d'un quart de tour en dessous.
 *
 * C'est la disposition qui rend le texte lisible sur un rouleau étroit : droit,
 * il ne dispose que de la largeur de la tête moins le QR — 18 px sur 12 mm, soit
 * trois caractères par ligne. Tourné, il profite de toute la hauteur restante.
 *
 * @param {LabelGeometry} geometry Géométrie empilée déjà calculée.
 * @param {{
 *   measure: (text: string) => number,
 *   text?: string,
 *   maxLines?: number,
 *   gap?: number,
 * }} options
 * @returns {LabelGeometry}
 */
export function layoutLabelRotated(geometry, options) {
  const gap = Math.max(1, Math.floor(options.gap ?? geometry.padding));
  const padding = geometry.padding;
  const lineHeight = geometry.lineHeight;

  // Le nombre de lignes n'est pas un réglage : c'est la largeur de la bande qui
  // le décide, et le texte est découpé à nouveau ici. Réutiliser les lignes de
  // la disposition empilée les bornait à quatre — l'URL était coupée après
  // « com/ » et sa fin perdue, pas seulement tronquée à l'affichage.
  const maxLines = Math.max(
    1,
    Math.trunc(options.maxLines ?? Math.floor((geometry.width - padding * 2) / lineHeight)),
  );

  // La bande de texte commence sous le QR. Sa longueur ne peut pas dépasser ce
  // qui reste jusqu'à la marge basse : c'est cette borne qui l'empêche de
  // remonter sur le code — le texte monte depuis le bas de sa bande.
  // Le texte monte depuis le bas de sa bande : sa longueur est donc bornée par
  // la hauteur qui reste sous le QR, marge basse déduite.
  const afterQr = padding + geometry.qrSize + gap;
  const fixed = geometry.targetHeight > 0;
  const available = fixed
    ? Math.max(geometry.width, geometry.targetHeight - afterQr - padding)
    // Sans longueur imposée, on part de la longueur du contenu : l'étiquette
    // s'ajuste au texte au lieu de réserver une bande vide.
    : Math.max(geometry.width, Math.ceil(options.measure(options.text ?? '')));

  // Le texte doit tenir dans la bande **en largeur comme en longueur** : ses
  // lignes s'empilent sur la largeur de l'étiquette, et chacune court sur la
  // longueur disponible. Une URL dense demandait sept lignes là où quatre
  // tenaient : sa fin était perdue. On réduit donc la police jusqu'à ce que
  // tout entre, sans descendre sous le plancher de lisibilité.
  const bandWidth = Math.max(1, geometry.width - padding * 2);
  const floor = Math.max(6, Math.floor(width_floor(geometry, options)));
  let chosen = null;
  let last = null;
  for (let size = geometry.fontSize; size >= floor; size--) {
    const mesure = options.measureFactory ? options.measureFactory(size) : options.measure;
    const height = Math.ceil(size * (options.lineSpacing ?? 1.15));
    const essai = wrapText(mesure, options.text ?? '', available, {
      maxLines: Math.max(1, Math.floor(bandWidth / height)),
    });
    const epaisseur = (essai.length + geometry.extraLines) * height;
    const complet = essai.join('').replace(/\s/g, '') === (options.text ?? '').replace(/\s/g, '');
    last = { lines: essai, lineHeight: height, fontSize: size, thickness: epaisseur };
    if (epaisseur <= bandWidth && (complet || options.text === '')) {
      chosen = last;
      break;
    }
  }
  // Aucune taille ne contient tout le texte : on garde la plus petite essayée,
  // qui en montre le plus, plutôt que d'abandonner.
  const placed = chosen ?? last;
  const lines = placed.lines;
  const thickness = placed.thickness;

  return {
    ...geometry,
    height: fixed ? geometry.targetHeight : afterQr + available + padding,
    qrLeft: Math.floor((geometry.width - geometry.qrSize) / 2),
    qrTop: padding,
    textRotated: true,
    textTop: afterQr,
    // La bande tournée fait `thickness` de large : on la centre.
    textLeft: Math.max(0, Math.floor((geometry.width - thickness) / 2)),
    textWidth: available,
    lines,
    // La police retenue peut être plus petite que celle de la composition
    // empilée : c'est elle qui est dessinée.
    fontSize: placed.fontSize,
    lineHeight: placed.lineHeight,
    rotatedTextLength: available,
    rotatedTextThickness: thickness,
  };
}

/** Plancher de police pour la disposition tournée. */
function width_floor(geometry, options) {
  const cible = options.minFont ?? 0;
  if (cible > 0) return cible;
  // Un dixième de la largeur reste lisible ; en dessous, le texte n'est plus
  // qu'une trame grise.
  return Math.max(6, Math.floor(geometry.width * 0.07));
}

/**
 * Mesure par défaut. En navigateur on crée un canvas hors écran ; ailleurs on
 * approxime, ce qui suffit à découper des URL en police monospace.
 *
 * @param {number} fontSize
 * @returns {(text: string) => number}
 */
function defaultMeasure(fontSize) {
  const canvasFactory = globalThis.document?.createElement?.bind(globalThis.document);
  if (canvasFactory) {
    const canvas = canvasFactory('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontSize}px -apple-system, system-ui, sans-serif`;
      return (text) => ctx.measureText(text).width;
    }
  }
  // Approximation : ratio moyen constaté pour une police sans-serif.
  return (text) => text.length * fontSize * 0.55;
}

/**
 * Dessine une étiquette complète (QR + texte) dans un contexte 2D.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {LabelGeometry} geometry
 * @param {{
 *   fontFamily?: string,
 *   showTitle?: boolean,
 *   title?: string,
 *   showHost?: boolean,
 * }} [options]
 * @returns {LabelGeometry}
 */
export function drawLabel(ctx, geometry, options = {}) {
  const {
    fontFamily = '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif',
    showTitle = false,
    title = '',
    showHost = false,
    // Lignes à imprimer sous le texte principal — la date, le plus souvent.
    // Leur place a été réservée par `extraLines` dans la géométrie.
    extraText = [],
  } = options;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, geometry.width, geometry.height);

  // `qrLeft` et `qrTop` viennent de la géométrie : le QR ne part plus du coin
  // supérieur gauche, il se place dans la disposition retenue.
  const qrX = geometry.qrLeft ?? Math.floor((geometry.width - geometry.qrSize) / 2);
  drawQr(geometry.qrMatrix, ctx, { x: qrX, y: geometry.qrTop, scale: geometry.qrScale });

  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  // En disposition latérale, le texte se cale à gauche dans la colonne qui lui
  // reste ; sinon il reste centré sous le QR.
  const lateral = geometry.lateral === true;
  const textX = lateral ? geometry.textLeft : geometry.width / 2;
  const maxWidth = lateral ? geometry.textWidth : undefined;

  // Texte tourné d'un quart de tour, dans sa bande sous le QR.
  //
  // Le repère : on se place au coin **bas-gauche** de la bande, puis on tourne
  // de -90°. Un point écrit vers +x part alors vers le haut, et les lignes
  // s'empilent vers la droite. Se tromper d'angle envoie le texte hors de
  // l'étiquette ; se tromper d'ancrage le fait remonter sur le QR.
  if (geometry.textRotated === true) {
    const blockBottom = geometry.textTop + geometry.textWidth;
    const blockLeft = geometry.textLeft ?? geometry.padding;

    ctx.save();
    ctx.translate(blockLeft, blockBottom);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Chaque ligne occupe sa propre rangée : dans le repère tourné, `x` avance
    // le long de la bande et `y` empile les lignes. Les écrire bout à bout sur
    // un même `x` cumulait leurs longueurs et faisait dépasser le texte, qui
    // remontait alors par-dessus le QR.
    let rangee = 0;
    const ecrire = (contenu, gras) => {
      if (!contenu) return;
      ctx.font = `${gras ? 'bold ' : ''}${geometry.fontSize}px ${fontFamily}`;
      ctx.fillText(contenu, 0, rangee * geometry.lineHeight, geometry.textWidth);
      rangee += 1;
    };

    if (showTitle && title) ecrire(title, true);
    for (const contenu of geometry.lines) ecrire(contenu, false);
    for (const contenu of extraText) ecrire(contenu, false);

    ctx.restore();
    return geometry;
  }

  ctx.textAlign = lateral ? 'left' : 'center';

  let y = geometry.textTop;
  ctx.font = `bold ${geometry.fontSize}px ${fontFamily}`;
  // Le titre peut occuper plusieurs lignes : il est découpé par l'appelant, qui
  // seul connaît la largeur utile. `titleLines` prime sur `title`.
  const titreLignes = Array.isArray(options.titleLines) && options.titleLines.length > 0
    ? options.titleLines
    : (showTitle && title ? [title] : []);
  for (const ligne of titreLignes) {
    ctx.fillText(ligne, textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  ctx.font = `${geometry.fontSize}px ${fontFamily}`;
  for (const line of geometry.lines) {
    ctx.fillText(line, textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  if (showHost) {
    ctx.font = `${Math.round(geometry.fontSize * 0.9)}px ${fontFamily}`;
    ctx.fillText(hostOf(options.url ?? ''), textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  // Les lignes supplémentaires viennent en dernier : la date se lit comme une
  // mention, sous l'information principale.
  for (const line of extraText) {
    if (!line) continue;
    ctx.fillText(line, textX, y, maxWidth);
    y += geometry.lineHeight;
  }

  return geometry;
}

/**
 * Convertit une longueur en millimètres vers des pixels.
 * @param {number} mm
 * @param {number} dpi
 * @returns {number}
 */
export function mmToPx(mm, dpi) {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Convertit des pixels vers des millimètres.
 * @param {number} px
 * @param {number} dpi
 * @returns {number}
 */
export function pxToMm(px, dpi) {
  return (px / dpi) * 25.4;
}

/**
 * Vérifie qu'un QR code restera imprimable et lisible.
 *
 * Deux causes d'échec, dans cet ordre :
 * 1. le QR déborde de la largeur utile — l'URL est trop longue pour cette
 *    étiquette, aucune mise à l'échelle ne peut le sauver ;
 * 2. la densité est insuffisante (moins de 2 px par module), cas que
 *    `computeLabelGeometry` évite normalement via `minScale`, mais qui peut
 *    survenir si l'appelant a forcé `minScale: 1`.
 *
 * @param {LabelGeometry} geometry
 * @param {{ minPxPerModule?: number }} [options]
 * @returns {{ ok: boolean, pxPerModule: number, reason?: string }}
 */
export function checkQrLegibility(geometry, options = {}) {
  const minPx = options.minPxPerModule ?? MIN_QR_SCALE;
  const pxPerModule = geometry.qrSize / geometry.qrMatrix.size;

  if (geometry.fits === false) {
    return {
      ok: false,
      pxPerModule,
      reason:
        `URL trop longue : le QR fait ${geometry.qrSize} px pour ${geometry.width} px ` +
        'de large. Raccourcissez l\'URL ou utilisez une étiquette plus large.',
    };
  }
  if (pxPerModule < minPx) {
    return {
      ok: false,
      pxPerModule,
      reason:
        `QR trop dense : ${pxPerModule.toFixed(2)} px par module (minimum ${minPx}). ` +
        'Raccourcissez l\'URL ou augmentez la largeur de l\'étiquette.',
    };
  }
  return { ok: true, pxPerModule };
}
