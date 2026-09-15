/**
 * Tests des profils d'imprimantes.
 *
 * Ces tests verrouillent les deux constats qui invalidaient le prototype
 * d'origine : la tête du D110 fait 96 px (12 mm) et non 120 px (15 mm), et le
 * dialogue d'impression n'est pas le même selon le modèle.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  D110,
  M2,
  PROFILES,
  DEFAULT_PROFILE,
  ALL_NAME_PREFIXES,
  findByModelId,
  findByName,
  withReportedHead,
  planPageWidth,
} from '../src/core/printer/profiles.js';
import { mmToPx } from '../src/core/label.js';

test('le profil D110 déclare une tête de 96 px, pas 120', () => {
  assert.equal(D110.printheadPixels, 96);
  assert.equal(D110.dpi, 203);
  // 96 px à 203 dpi = 12 mm. C'est la largeur réellement imprimable.
  assert.equal(Math.round((D110.printheadPixels / D110.dpi) * 25.4), 12);
});

test('une étiquette de 15 mm est bien rognée à 12 mm sur un D110', () => {
  const plan = planPageWidth(D110, 15);
  assert.equal(plan.cols, 96);
  assert.ok(plan.clippedMm > 2.9 && plan.clippedMm < 3.1, `rogné de ${plan.clippedMm} mm`);
});

test('un D110 avec une étiquette de 12 mm ne rogne rien', () => {
  assert.equal(planPageWidth(D110, 12).clippedMm, 0);
});

test('la conversion 15 mm à 203 dpi vaut bien 120 px — mais ce n\'est pas la tête', () => {
  // Le calcul est juste ; c'est son usage qui était faux dans le prototype.
  assert.equal(mmToPx(15, 203), 120);
  assert.notEqual(mmToPx(15, 203), D110.printheadPixels);
});

test('le profil M2 déclare 576 px à 300 dpi', () => {
  assert.equal(M2.printheadPixels, 576);
  assert.equal(M2.dpi, 300);
  assert.equal(M2.printTask, 'B1');
});

test('findByModelId retrouve le D110', () => {
  assert.equal(findByModelId(2304)?.id, 'D110');
  assert.equal(findByModelId(2320)?.id, 'D110');
  assert.equal(findByModelId(4608)?.id, 'M2');
  assert.equal(findByModelId(9999), undefined);
});

test('findByName reconnaît les noms BLE réels', () => {
  assert.equal(findByName('D110-FC06023035')?.id, 'D110');
  assert.equal(findByName('M2_H-H107060027')?.id, 'M2');
  assert.equal(findByName('inconnu'), undefined);
  assert.equal(findByName(undefined), undefined);
});

test('findByName préfère le préfixe le plus long', () => {
  // « B21 » ne doit pas être capté par « B1 » : on vérifie la mécanique sur les
  // préfixes réellement déclarés, sans dépendre d'un modèle non supporté.
  assert.equal(findByName('D110_M-abc')?.id, 'D110');
  assert.equal(findByName('M2_H-xyz')?.id, 'M2');
});

test('withReportedHead accepte une largeur plausible', () => {
  const patched = withReportedHead(D110, 120);
  assert.equal(patched.printheadPixels, 120);
  assert.equal(patched.id, 'D110', 'le reste du profil est conservé');
});

test('withReportedHead ignore une valeur aberrante', () => {
  assert.equal(withReportedHead(D110, 0).printheadPixels, 96);
  assert.equal(withReportedHead(D110, -5).printheadPixels, 96);
  assert.equal(withReportedHead(D110, 99999).printheadPixels, 96);
  assert.equal(withReportedHead(D110, NaN).printheadPixels, 96);
});

test('withReportedHead ne mute pas le profil d\'origine', () => {
  withReportedHead(D110, 120);
  assert.equal(D110.printheadPixels, 96);
});

test('les profils sont figés et cohérents', () => {
  assert.ok(Object.isFrozen(D110));
  for (const profile of PROFILES) {
    assert.ok(profile.printheadPixels > 0, profile.id);
    assert.ok(profile.dpi > 0, profile.id);
    assert.ok(['D110', 'B1', 'V4'].includes(profile.printTask), profile.id);
    assert.ok(profile.density.min < profile.density.max, profile.id);
    assert.ok(profile.namePrefixes.length > 0, profile.id);
  }
});

test('le profil par défaut est le D110', () => {
  assert.equal(DEFAULT_PROFILE, D110);
});

test('les préfixes de nom sont dédoublonnés', () => {
  assert.equal(ALL_NAME_PREFIXES.length, new Set(ALL_NAME_PREFIXES).size);
  assert.ok(ALL_NAME_PREFIXES.includes('D110'));
});
