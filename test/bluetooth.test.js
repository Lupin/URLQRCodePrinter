/**
 * Tests de la disponibilité de Web Bluetooth.
 *
 * Le cas qui a motivé ces tests : Brave **expose** `navigator.bluetooth` mais
 * refuse toute utilisation quand son drapeau est éteint. Le contrôle qui se
 * contentait de regarder si l'objet existe concluait « tout va bien », le bouton
 * « Connecter » restait actif, et l'échec n'arrivait qu'après le clic — avec un
 * message anglais : « Web Bluetooth API globally disabled ».
 *
 * Ces situations sont reproduites ici avec un objet `bluetooth` factice ; la
 * même vérification est faite dans Brave, où le drapeau est réellement éteint.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkWebBluetoothSupport,
  probeWebBluetooth,
  explainBluetoothFailure,
  BRAVE_BLUETOOTH_HINT,
} from '../src/core/printer/transport.js';

test('sans API du tout, on nomme le navigateur fautif', () => {
  const support = checkWebBluetoothSupport({ bluetooth: null });
  assert.equal(support.ok, false);
  assert.match(support.reason, /pas disponible/);
  assert.match(support.hint, /Safari/);
  assert.match(support.hint, /brave:\/\/flags\/#brave-web-bluetooth-api/);
});

test('un contexte non sécurisé est distingué du reste', () => {
  const support = checkWebBluetoothSupport({ bluetooth: {}, isSecureContext: false });
  assert.equal(support.ok, false);
  assert.match(support.reason, /contexte sécurisé/);
  assert.match(support.hint, /localhost/);
});

test('l\'API présente mais désactivée est signalée', () => {
  // C'est le cas Brave : l'objet existe, le navigateur refuse.
  const support = checkWebBluetoothSupport({ bluetooth: {}, available: false });
  assert.equal(support.ok, false);
  assert.match(support.reason, /désactivé/);
  assert.match(support.hint, /brave:\/\/flags\/#brave-web-bluetooth-api/);
  assert.match(support.hint, /relancez Brave/, 'le drapeau n\'est lu qu\'au démarrage');
});

test('tout est en ordre quand le navigateur le dit', () => {
  assert.equal(checkWebBluetoothSupport({ bluetooth: {}, available: true }).ok, true);
  // Sans `available` fourni, on ne peut rien affirmer : le contrôle de base
  // laisse passer, c'est `probeWebBluetooth` qui interroge le navigateur.
  assert.equal(checkWebBluetoothSupport({ bluetooth: {} }).ok, true);
});

test('probeWebBluetooth interroge le navigateur pour de bon', async () => {
  const disabled = await probeWebBluetooth({ bluetooth: { getAvailability: async () => false } });
  assert.equal(disabled.ok, false);
  assert.match(disabled.hint, /brave-web-bluetooth-api/);

  const enabled = await probeWebBluetooth({ bluetooth: { getAvailability: async () => true } });
  assert.equal(enabled.ok, true);

  // Un navigateur qui refuse de répondre est traité comme un refus.
  const hostile = await probeWebBluetooth({
    bluetooth: { getAvailability: async () => { throw new Error('non'); } },
  });
  assert.equal(hostile.ok, false);
  assert.match(hostile.reason, /désactivé/);

  // Sans `getAvailability` (API ancienne), on ne bloque pas.
  assert.equal((await probeWebBluetooth({ bluetooth: {} })).ok, true);
  // Sans API, l'absence est signalée sans même interroger quoi que ce soit.
  assert.equal((await probeWebBluetooth({ bluetooth: null })).ok, false);
});

test('l\'échec « globally disabled » est traduit en marche à suivre', () => {
  const said = explainBluetoothFailure(new Error('Web Bluetooth API globally disabled.'));
  assert.match(said, /désactivé/);
  assert.match(said, /brave:\/\/flags\/#brave-web-bluetooth-api/);
  assert.equal(/globally disabled/i.test(said), false, 'le message anglais ne doit pas ressortir');
});

test('les autres échecs sont expliqués sans être confondus', () => {
  // L'utilisateur a fermé le sélecteur, ou aucun appareil n'a répondu.
  assert.match(
    explainBluetoothFailure(Object.assign(new Error('User cancelled'), { name: 'NotFoundError' })),
    /Aucun appareil choisi/,
  );
  assert.match(explainBluetoothFailure(new Error('permission denied')), /autoris/i);
  // Un échec inconnu garde son message d'origine, faute de mieux.
  assert.match(explainBluetoothFailure(new Error('GATT introuvable')), /GATT introuvable/);
});

test('la marche à suivre est une seule phrase, réutilisée partout', () => {
  assert.match(BRAVE_BLUETOOTH_HINT, /^Brave désactive Web Bluetooth par défaut\./);
  assert.match(BRAVE_BLUETOOTH_HINT, /Enabled/);
  assert.match(BRAVE_BLUETOOTH_HINT, /relancez Brave/);
});
