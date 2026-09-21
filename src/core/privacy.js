/**
 * Consentement à la mention de confidentialité.
 *
 * La FAQ du Chrome Web Store est explicite (questions 10 et 13) : la mention
 * doit être présentée **dans l'interface du produit**, et l'utilisateur doit
 * accomplir une action claire pour l'accepter *avant* toute collecte. Une
 * description soignée sur la fiche du magasin ne satisfait pas cette exigence.
 *
 * D'où ce module : il porte l'état du consentement, et c'est lui qui décide si
 * une collecte peut avoir lieu. Les chemins de collecte — clic droit et fenêtre
 * — l'interrogent avant d'enregistrer quoi que ce soit.
 *
 * `DISCLOSURE_VERSION` existe pour pouvoir **redemander** le consentement si le
 * texte change de nature. Sans elle, un consentement donné pour une version
 * antérieure vaudrait pour une version qui dit autre chose.
 *
 * Le stockage est injecté, comme pour les réglages : le module se teste sans
 * navigateur. L'interface attendue est celle de `chrome.storage.local` — un
 * `get(clé)` qui rend `{ [clé]: valeur }`, et un `set({ [clé]: valeur })`.
 * C'est le seul stockage auquel le service worker a accès.
 */

/** Clé de stockage, préfixée pour ne pas entrer en collision avec un autre outil. */
export const CONSENT_KEY = 'url-qr-code-printer/privacy-consent';

/**
 * Version du texte de mention affiché.
 *
 * À incrémenter dès que la mention dit autre chose. Un consentement enregistré
 * pour une version antérieure ne vaut alors plus rien, et la mention est
 * présentée de nouveau.
 */
export const DISCLOSURE_VERSION = 1;

/** Décisions possibles. Le refus est un état de plein droit, pas une absence. */
export const CONSENT_DECISIONS = Object.freeze(['accepted', 'declined']);

/**
 * Valide un enregistrement de consentement lu du stockage.
 *
 * Un enregistrement illisible ou d'une version périmée vaut `null` — c'est-à-dire
 * « pas de consentement ». Le défaut penche du côté sûr : on redemande, on ne
 * suppose jamais l'accord.
 *
 * @param {unknown} value
 * @returns {{ version: number, decision: 'accepted'|'declined', at: number } | null}
 */
export function sanitizeConsent(value) {
  if (!value || typeof value !== 'object') return null;

  const version = Number.isInteger(value.version) ? value.version : null;
  if (version === null || version < 1) return null;

  if (!CONSENT_DECISIONS.includes(value.decision)) return null;

  const at = Number.isFinite(value.at) ? value.at : 0;
  return { version, decision: value.decision, at };
}

/**
 * Le consentement autorise-t-il la collecte ?
 *
 * Il faut une acceptation **à la version courante**. Un refus, une absence, ou
 * une acceptation d'une version antérieure rendent tous `false`.
 *
 * @param {{ version: number, decision: string } | null} record
 * @returns {boolean}
 */
export function isAccepted(record) {
  return Boolean(record) && record.decision === 'accepted' && record.version === DISCLOSURE_VERSION;
}

/**
 * Faut-il présenter la mention avant de collecter ?
 * @param {{ version: number, decision: string } | null} record
 * @returns {boolean}
 */
export function needsDisclosure(record) {
  return !isAccepted(record);
}

/**
 * Lit le consentement enregistré.
 *
 * Une lecture qui échoue vaut « pas de consentement » : c'est le seul défaut
 * acceptable, puisqu'il empêche la collecte au lieu de la permettre.
 *
 * @param {{ get: (key: string) => Promise<object> }} area
 * @returns {Promise<{ version: number, decision: 'accepted'|'declined', at: number } | null>}
 */
export async function readConsent(area) {
  if (!area || typeof area.get !== 'function') return null;

  try {
    const data = await area.get(CONSENT_KEY);
    return sanitizeConsent(data?.[CONSENT_KEY]);
  } catch {
    return null;
  }
}

/**
 * Enregistre une décision.
 *
 * @param {{ set: (items: object) => Promise<void> }} area
 * @param {'accepted'|'declined'} decision
 * @param {{ now?: number, version?: number }} [options]
 * @returns {Promise<{ version: number, decision: 'accepted'|'declined', at: number }>}
 * @throws {TypeError} si la décision n'est pas reconnue.
 */
export async function writeConsent(area, decision, options = {}) {
  if (!CONSENT_DECISIONS.includes(decision)) {
    throw new TypeError(`Décision de consentement inconnue : ${decision}`);
  }

  const record = {
    version: Number.isInteger(options.version) ? options.version : DISCLOSURE_VERSION,
    decision,
    at: Number.isFinite(options.now) ? options.now : Date.now(),
  };

  await area.set({ [CONSENT_KEY]: record });
  return record;
}
