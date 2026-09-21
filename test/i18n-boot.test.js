/**
 * Démarrage de l'application en anglais.
 *
 * Le harnais fixe un navigateur anglophone : l'interface doit sortir en anglais
 * dès le premier rendu. C'est le contrôle de bout en bout qui manquerait à un
 * simple test de catalogue — il vérifie que la traduction est réellement
 * appliquée par le code, et pas seulement présente dans les tables.
 */

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp } from './helpers/dom-shim.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');

if (!existsSync(DIST_WEB)) {
  throw new Error(DIST_WEB + ' est absent : lancez « npm run build » avant les tests.');
}

let registry = new Map();
let bootError = null;

before(async () => {
  ({ registry, bootError } = await bootApp({ distWeb: DIST_WEB, language: 'en-US' }));
});

test('l\'application démarre en anglais sans lever d\'exception', () => {
  assert.equal(bootError, null, bootError ? bootError.message : '');
});

test('le compteur et l\'aide sont en anglais', () => {
  assert.equal(registry.get('count').textContent, '0 links');
  assert.match(registry.get('empty').textContent, /No links/);
});

test('les commandes principales sont traduites', () => {
  assert.equal(registry.get('print').textContent, 'Print');
  const targets = registry.get('qr-target').children.map((option) => option.textContent);
  assert.deepEqual(targets, ['The collected URL', 'The shortened link']);
  assert.match(registry.get('profile-hint').textContent, /without a connected printer/);
});
