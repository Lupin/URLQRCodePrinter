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
  maxPrintHeightMm: 100,
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
