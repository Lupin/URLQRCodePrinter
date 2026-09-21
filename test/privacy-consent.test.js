/**
 * Tests du consentement à la mention de confidentialité.
 *
 * L'enjeu n'est pas cosmétique : le Chrome Web Store interdit toute collecte
 * d'activité de navigation avant que l'utilisateur n'ait explicitement accepté
 * la mention, et la sanction porte sur **tout le compte éditeur**. Cette logique
 * décide donc si une collecte a lieu.
 *
 * Le défaut à craindre n'est pas l'erreur bruyante mais le **consentement
 * supposé** : une lecture qui échoue, une version périmée, une décision
 * inconnue — chacun doit retomber sur « pas d'accord ». Les tests visent donc
 * surtout les cas dégradés.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONSENT_KEY,
  DISCLOSURE_VERSION,
  CONSENT_DECISIONS,
  sanitizeConsent,
  isAccepted,
  needsDisclosure,
  readConsent,
  writeConsent,
} from '../src/core/privacy.js';

/** Zone de stockage simulée, à la forme de `chrome.storage.local`. */
function fakeArea(initial = {}) {
  const data = { ...initial };
  return {
    data,
    async get(key) {
      return { [key]: data[key] };
    },
    async set(patch) {
      Object.assign(data, patch);
    },
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test('une valeur illisible ne vaut pas un consentement', () => {
  for (const value of [null, undefined, 42, 'accepted', [], true]) {
    assert.equal(sanitizeConsent(value), null, `valeur inattendue acceptée : ${String(value)}`);
  }
});

test('une décision inconnue est refusée', () => {
  assert.equal(sanitizeConsent({ version: DISCLOSURE_VERSION, decision: 'peut-être', at: 1 }), null);
});

test('une version absente ou invalide est refusée', () => {
  for (const version of [undefined, null, 0, -1, 1.5, '1']) {
    assert.equal(
      sanitizeConsent({ version, decision: 'accepted', at: 1 }),
      null,
      `version inattendue acceptée : ${String(version)}`,
    );
  }
});

test('un enregistrement valide est conservé', () => {
  const record = sanitizeConsent({ version: 3, decision: 'declined', at: 1234 });
  assert.deepEqual(record, { version: 3, decision: 'declined', at: 1234 });
});

test('une date illisible retombe sur zéro plutôt que d\'invalider l\'accord', () => {
  // La date est informative : elle ne doit pas faire perdre un consentement.
  const record = sanitizeConsent({ version: 1, decision: 'accepted', at: 'hier' });
  assert.equal(record.at, 0);
});

// ---------------------------------------------------------------------------
// Décision
// ---------------------------------------------------------------------------

test('seule une acceptation à la version courante autorise la collecte', () => {
  assert.equal(isAccepted({ version: DISCLOSURE_VERSION, decision: 'accepted', at: 1 }), true);

  assert.equal(isAccepted(null), false, 'aucune décision');
  assert.equal(
    isAccepted({ version: DISCLOSURE_VERSION, decision: 'declined', at: 1 }),
    false,
    'un refus n\'autorise rien',
  );
  assert.equal(
    isAccepted({ version: DISCLOSURE_VERSION - 1, decision: 'accepted', at: 1 }),
    false,
    'une version antérieure ne vaut plus',
  );
});

test('la mention est due dès que l\'accord n\'est pas valide', () => {
  assert.equal(needsDisclosure(null), true);
  assert.equal(needsDisclosure({ version: DISCLOSURE_VERSION, decision: 'declined', at: 1 }), true);
  assert.equal(needsDisclosure({ version: DISCLOSURE_VERSION, decision: 'accepted', at: 1 }), false);
});

test('la version courante fait partie des décisions reconnues', () => {
  // Garde-fou : la constante doit rester un entier positif, sinon tous les
  // consentements enregistrés deviendraient invalides d'un coup.
  assert.ok(Number.isInteger(DISCLOSURE_VERSION) && DISCLOSURE_VERSION >= 1);
  assert.deepEqual([...CONSENT_DECISIONS], ['accepted', 'declined']);
});

// ---------------------------------------------------------------------------
// Lecture et écriture
// ---------------------------------------------------------------------------

test('une zone vide vaut « pas de consentement »', async () => {
  assert.equal(await readConsent(fakeArea()), null);
});

test('une lecture qui échoue vaut « pas de consentement »', async () => {
  // Le seul défaut acceptable : il empêche la collecte au lieu de la permettre.
  const broken = {
    async get() {
      throw new Error('stockage indisponible');
    },
  };
  assert.equal(await readConsent(broken), null);
});

test('une zone absente vaut « pas de consentement »', async () => {
  assert.equal(await readConsent(undefined), null);
  assert.equal(await readConsent({}), null);
});

test('l\'écriture puis la lecture rendent la même décision', async () => {
  const area = fakeArea();
  const written = await writeConsent(area, 'accepted', { now: 42 });

  assert.deepEqual(written, { version: DISCLOSURE_VERSION, decision: 'accepted', at: 42 });
  assert.deepEqual(await readConsent(area), written);
  assert.equal(isAccepted(await readConsent(area)), true);
});

test('le refus est enregistré comme une décision, pas comme une absence', async () => {
  // La distinction compte : c'est elle qui évite de rouvrir la mention à chaque
  // tentative après un refus.
  const area = fakeArea();
  await writeConsent(area, 'declined', { now: 7 });

  const record = await readConsent(area);
  assert.equal(record.decision, 'declined');
  assert.equal(isAccepted(record), false);
  assert.notEqual(record, null);
});

test('une décision inconnue est refusée à l\'écriture', async () => {
  const area = fakeArea();
  await assert.rejects(writeConsent(area, 'oui'), TypeError);
  assert.deepEqual(area.data, {}, 'rien ne doit avoir été écrit');
});

test('la clé de stockage est celle attendue', async () => {
  // Elle est persistée : la changer ferait perdre le consentement de tous les
  // utilisateurs déjà installés, qui devraient se prononcer de nouveau.
  const area = fakeArea();
  await writeConsent(area, 'accepted', { now: 1 });
  assert.ok(Object.hasOwn(area.data, CONSENT_KEY), `clé absente : ${CONSENT_KEY}`);
});
