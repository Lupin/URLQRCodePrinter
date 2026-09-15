/**
 * Profils d'imprimantes Niimbot.
 *
 * Deux chiffres sont critiques et contre-intuitifs :
 *
 * 1. `printheadPixels` est la largeur de la **tête**, pas celle de l'étiquette.
 *    Un D110 accepte des rouleaux de 15 mm mais sa tête ne fait que 96 px
 *    (12 mm à 203 dpi). Envoyer 120 colonnes ne provoque aucune erreur :
 *    l'imprimante rogne silencieusement à 96.
 * 2. `printTask` détermine la grammaire du dialogue d'impression. Router un
 *    D110 vers le task « v4 » (SetPageSize 13 octets) le fait refuser la page
 *    avec une erreur DataError (0xDB 06) au lieu d'imprimer.
 */

/**
 * @typedef {Object} PrinterProfile
 * @property {string} id                Identifiant lisible.
 * @property {number[]} modelIds        modelId rapportés par PrinterInfo (0x40 08).
 * @property {number} dpi               Résolution en points par pouce.
 * @property {number} printheadPixels   Largeur de la tête en pixels = largeur utile max.
 * @property {number} maxLabelWidthMm   Largeur d'étiquette maximale acceptée par le fabricant.
 * @property {number} maxPrintHeightMm  Hauteur d'impression maximale.
 * @property {{min: number, max: number, default: number}} density
 * @property {'D110'|'B1'|'V4'} printTask  Grammaire du dialogue d'impression.
 * @property {string[]} namePrefixes    Préfixes du nom BLE annoncé, pour le filtrage.
 * @property {boolean} transposed       true si la source doit être transposée avant encodage.
 */

/** Profil D110 — famille 203 dpi, tête 96 px. */
export const D110 = Object.freeze({
  id: 'D110',
  // 2304 = D110, 2305 = Hi-D110, 2320 = D110_M.
  // « D110A » n'apparaît dans aucune source : le modelId réel sera lu à la
  // connexion et journalisé, ce qui lèvera le doute sur ce modèle.
  modelIds: [2304, 2305, 2320],
  dpi: 203,
  printheadPixels: 96,
  maxLabelWidthMm: 15,
  // Le fabricant vend des rouleaux de 109 mm pour ce modèle : borner la fenêtre
  // à 100 rendait ce format inutilisable, alors qu'il existe.
  maxPrintHeightMm: 120,
  density: { min: 1, max: 3, default: 2 },
  printTask: 'D110',
  namePrefixes: ['D110', 'D11', 'D101'],
  transposed: true,
});

/** Profil M2 (M2_H) — 300 dpi, tête 576 px. Conservé pour la suite. */
export const M2 = Object.freeze({
  id: 'M2',
  modelIds: [4608],
  dpi: 300,
  printheadPixels: 576,
  maxLabelWidthMm: 50,
  maxPrintHeightMm: 240,
  density: { min: 1, max: 5, default: 3 },
  printTask: 'B1',
  namePrefixes: ['M2'],
  transposed: false,
});

/** Tous les profils connus, du plus spécifique au plus générique. */
export const PROFILES = Object.freeze([D110, M2]);

/** Profil utilisé quand le modèle n'est pas identifié. */
export const DEFAULT_PROFILE = D110;

/** Préfixes de nom BLE à proposer au sélecteur d'appareils. */
export const ALL_NAME_PREFIXES = Object.freeze([
  ...new Set(PROFILES.flatMap((profile) => profile.namePrefixes)),
]);

/**
 * Retrouve un profil par son identifiant lisible (« D110 », « M2 »).
 *
 * Sert à l'aperçu : on veut pouvoir composer une étiquette au format d'une
 * imprimante qu'on ne possède pas, ou qui n'est pas connectée.
 *
 * @param {string} id
 * @returns {PrinterProfile|undefined}
 */
export function findProfile(id) {
  return PROFILES.find((profile) => profile.id === id);
}

/**
 * Retrouve un profil à partir du modelId rapporté par l'imprimante.
 *
 * @param {number} modelId
 * @returns {PrinterProfile|undefined}
 */
export function findByModelId(modelId) {
  return PROFILES.find((profile) => profile.modelIds.includes(modelId));
}

/**
 * Devine un profil à partir du nom BLE annoncé (ex. « D110-FC06023035 »).
 * Ne sert que de repli : le modelId lu à la connexion fait foi.
 *
 * @param {string} deviceName
 * @returns {PrinterProfile|undefined}
 */
export function findByName(deviceName) {
  if (typeof deviceName !== 'string') return undefined;
  const upper = deviceName.toUpperCase();
  // On teste les préfixes du plus long au plus court pour que « B21 » ne soit
  // pas capté par « B1 ».
  const candidates = PROFILES.flatMap((profile) =>
    profile.namePrefixes.map((prefix) => ({ profile, prefix })),
  ).sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { profile, prefix } of candidates) {
    if (upper.startsWith(prefix)) return profile;
  }
  return undefined;
}

/**
 * Ajuste un profil avec la largeur de tête réellement rapportée par
 * l'imprimante (Heartbeat 0xDC [03] → 0xDE, octets 4-5).
 *
 * C'est la valeur la plus fiable : elle vient du matériel. On ne l'accepte que
 * si elle est plausible, pour ne pas écraser un profil correct avec une
 * lecture erronée.
 *
 * @param {PrinterProfile} profile
 * @param {number} reportedPixels
 * @returns {PrinterProfile}
 */
export function withReportedHead(profile, reportedPixels) {
  if (!Number.isFinite(reportedPixels) || reportedPixels < 8 || reportedPixels > 4096) {
    return profile;
  }
  // Tolérance : on n'écarte pas une valeur proche de celle du profil, car
  // certains firmwares rapportent une marge (M2_H : 567 rapportés pour 576).
  return { ...profile, printheadPixels: Math.trunc(reportedPixels) };
}

/**
 * Consommables courants, par modèle.
 *
 * `widthMm` est la largeur de l'étiquette ; `lengthMm` est la longueur du
 * rouleau, celle que le profil ne connaissait pas. Sans elle, l'application
 * composait une étiquette de la hauteur de son contenu — 18 mm sur une photo
 * d'étiquette réellement imprimée — et l'imprimante avançait ensuite jusqu'à la
 * découpe suivante : le reste du rouleau sortait blanc.
 *
 * Une longueur `null` décrit un rouleau continu sans pas connu : la hauteur
 * reste alors déduite du contenu, seul comportement possible.
 *
 * Aucune de ces cotes n'est vérifiable sans le matériel : elles viennent des
 * catalogues du fabricant. `compatibleSupplies` écarte celles que la tête
 * connectée ne peut pas imprimer, ce qui est la seule garantie dont on dispose.
 */
export const SUPPLIES = Object.freeze({
  // Catalogue relevé chez le fabricant, collection « label for D11/D110 » :
  // c'est la source qui fait foi, pas une supposition. Les rouleaux de 25 mm de
  // large y figurent mais sont écartés par `compatibleSupplies` — la tête de
  // 12 mm ne peut pas les atteindre.
  D110: Object.freeze([
    { id: 'd110-12x22', label: '12 × 22 mm', widthMm: 12, lengthMm: 22 },
    { id: 'd110-12x30', label: '12 × 30 mm', widthMm: 12, lengthMm: 30 },
    { id: 'd110-12x40', label: '12 × 40 mm', widthMm: 12, lengthMm: 40 },
    { id: 'd110-12x75', label: '12 × 75 mm', widthMm: 12, lengthMm: 75 },
    { id: 'd110-12x109', label: '12 × 109 mm', widthMm: 12, lengthMm: 109 },
    { id: 'd110-14x25', label: '14 × 25 mm', widthMm: 14, lengthMm: 25 },
    { id: 'd110-14x28', label: '14 × 28 mm', widthMm: 14, lengthMm: 28 },
    { id: 'd110-14x30', label: '14 × 30 mm', widthMm: 14, lengthMm: 30 },
    { id: 'd110-14x40', label: '14 × 40 mm', widthMm: 14, lengthMm: 40 },
    { id: 'd110-14x50', label: '14 × 50 mm', widthMm: 14, lengthMm: 50 },
    { id: 'd110-15x30', label: '15 × 30 mm', widthMm: 15, lengthMm: 30 },
    { id: 'd110-15x50', label: '15 × 50 mm', widthMm: 15, lengthMm: 50 },
    { id: 'd110-25x60', label: '25 × 60 mm', widthMm: 25, lengthMm: 60 },
    { id: 'd110-25x76', label: '25 × 76 mm', widthMm: 25, lengthMm: 76 },
    { id: 'd110-continue', label: 'Rouleau continu 12 mm (longueur libre)', widthMm: 12, lengthMm: null },
  ]),
  // Collection « label tape for M2/M3 ». Le 40 × 30 que je supposais n'existe
  // pas : c'est un 40 × 20. Les ronds sont notés comme tels, leur cote étant
  // celle du disque.
  M2: Object.freeze([
    { id: 'm2-25x9.5', label: '25 × 9,5 mm', widthMm: 25, lengthMm: 9.5 },
    { id: 'm2-36.5x9.5', label: '36,5 × 9,5 mm', widthMm: 36.5, lengthMm: 9.5 },
    { id: 'm2-40x20', label: '40 × 20 mm', widthMm: 40, lengthMm: 20 },
    { id: 'm2-40x40', label: '40 × 40 mm', widthMm: 40, lengthMm: 40 },
    { id: 'm2-50x30', label: '50 × 30 mm', widthMm: 50, lengthMm: 30 },
    { id: 'm2-50x50', label: '50 × 50 mm', widthMm: 50, lengthMm: 50 },
    { id: 'm2-50x70', label: '50 × 70 mm', widthMm: 50, lengthMm: 70 },
    { id: 'm2-50x80', label: '50 × 80 mm', widthMm: 50, lengthMm: 80 },
    { id: 'm2-30x70', label: '30 × 70 mm (bijouterie)', widthMm: 30, lengthMm: 70 },
    { id: 'm2-25x78', label: '25 × 78 mm (câble)', widthMm: 25, lengthMm: 78 },
    { id: 'm2-35.25x50', label: '35,25 × 50 mm (auto-pelliculé)', widthMm: 35.25, lengthMm: 50 },
    { id: 'm2-20x20-rond', label: '20 × 20 mm (rond)', widthMm: 20, lengthMm: 20 },
    { id: 'm2-24x13-rond', label: '24 × 13 mm (rond)', widthMm: 24, lengthMm: 13 },
    { id: 'm2-28x14-rond', label: '28 × 14 mm (rond)', widthMm: 28, lengthMm: 14 },
    { id: 'm2-28x15-rond', label: '28 × 15 mm (rond)', widthMm: 28, lengthMm: 15 },
    { id: 'm2-31x31-rond', label: '31 × 31 mm (rond)', widthMm: 31, lengthMm: 31 },
    { id: 'm2-34x17-rond', label: '34 × 17 mm (rond)', widthMm: 34, lengthMm: 17 },
    { id: 'm2-50x50-rond', label: '50 × 50 mm (rond)', widthMm: 50, lengthMm: 50 },
    { id: 'm2-continue', label: 'Rouleau continu 48 mm (longueur libre)', widthMm: 48, lengthMm: null },
  ]),
});

/** Longueurs de rouleau les plus courantes, proposées comme suggestions. */
export const COMMON_LENGTHS_MM = Object.freeze([22, 30, 40, 50, 70]);

/**
 * Les consommables d'un profil, chacun accompagné de sa compatibilité.
 *
 * Deux contraintes, toutes deux matérielles :
 * 1. une étiquette plus large que la tête y perdrait une bande, silencieusement ;
 * 2. une étiquette plus longue que `maxPrintHeightMm` dépasse la fenêtre
 *    d'impression du modèle.
 *
 * Le catalogue reste **visible** quand il est incompatible : on signale plutôt
 * que de faire disparaître, sans quoi l'utilisateur croirait à une option
 * manquante alors qu'il a choisi le mauvais rouleau.
 *
 * @param {PrinterProfile} profile
 * @returns {Array<{ id: string, label: string, widthMm: number, lengthMm: number|null, compatible: boolean, reason: string }>}
 */
export function compatibleSupplies(profile) {
  const list = SUPPLIES[profile.id] ?? [];
  const headMm = (profile.printheadPixels / profile.dpi) * 25.4;
  // Une étiquette plus large que la tête reste **imprimable** : le contenu fait
  // la largeur de la tête, et le reste de l'étiquette demeure blanc. L'interdire
  // rendait inutilisables les rouleaux 14 et 15 mm d'un D110, qui sont courants.
  // On les signale donc sans les écarter. Au-delà de cette marge, en revanche,
  // la tête ne peut pas atteindre le bord : le consommable est écarté.
  const atteignableMm = headMm + 4;

  return list.map((supply) => {
    if (supply.widthMm > atteignableMm) {
      return { ...supply, compatible: false, reason: 'trop large pour cette tête' };
    }
    if (supply.lengthMm !== null && supply.lengthMm > profile.maxPrintHeightMm) {
      return { ...supply, compatible: false, reason: 'plus longue que la fenêtre d\'impression' };
    }
    if (supply.widthMm > headMm + 0.5) {
      return { ...supply, compatible: true, reason: 'marge non imprimée sur les côtés' };
    }
    return { ...supply, compatible: true, reason: '' };
  });
}

/**
 * Convertit une largeur d'étiquette en millimètres vers la largeur de tête à
 * utiliser, en signalant l'écart éventuel.
 *
 * @param {PrinterProfile} profile
 * @param {number} labelWidthMm
 * @returns {{ cols: number, clippedMm: number, labelWidthMm: number }}
 */
export function planPageWidth(profile, labelWidthMm) {
  const printableMm = (profile.printheadPixels / profile.dpi) * 25.4;
  return {
    cols: profile.printheadPixels,
    labelWidthMm,
    clippedMm: Math.max(0, labelWidthMm - printableMm),
  };
}
