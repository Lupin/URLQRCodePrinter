/**
 * Tests du protocole Niimbot.
 *
 * Les trames attendues sont celles documentées par les implémentations de
 * référence (niimbluelib, iscarelli/niimbot-web-bluetooth, wiki niim.blue) et
 * recalculées à la main. Elles servent de vérité terrain : si l'encodage dérive,
 * ces tests cassent avant qu'on envoie quoi que ce soit à une imprimante.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  checksum,
  buildPacket,
  buildConnect,
  u16be,
  PacketStreamDecoder,
  CMD,
  setDensity,
  setLabelType,
  printStart,
  printClear,
  pageStart,
  pageEnd,
  printEnd,
  printStatus,
  printerStatusData,
  printerInfo,
  heartbeat,
  setPageSize,
  printQuantity,
  printBitmapRow,
  printEmptyRow,
  parsePrintStatus,
  parsePrinterInfo,
} from '../src/core/printer/packet.js';

/** Rend un Uint8Array lisible : « 55 55 21 01 ». */
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');

/** Convertit « 55 55 21 » en tableau d'octets. */
const bytes = (text) => text.trim().split(/\s+/).map((h) => parseInt(h, 16));

// ---------------------------------------------------------------------------
// Checksum et trame de base
// ---------------------------------------------------------------------------

test('le checksum suit XOR(CMD, LEN, DATA...)', () => {
  // 0x21 ^ 0x01 ^ 0x03 = 0x23
  assert.equal(checksum(0x21, [0x03]), 0x23);
  // 0xc1 ^ 0x01 ^ 0x01 = 0xc1
  assert.equal(checksum(0xc1, [0x01]), 0xc1);
  // Sans données : XOR du seul couple (CMD, LEN).
  assert.equal(checksum(0x40, [0x08]), 0x49);
});

test('la trame de connexion porte le préfixe 0x03', () => {
  assert.equal(hex(buildConnect()), '03 55 55 c1 01 01 c1 aa aa');
});

test('la trame standard n\'a pas de préfixe', () => {
  assert.equal(hex(setDensity(3)), '55 55 21 01 03 23 aa aa');
});

test('buildPacket refuse une charge utile de plus de 255 octets', () => {
  assert.throws(() => buildPacket(0x85, new Uint8Array(256)), RangeError);
});

test('u16be encode en gros-boutiste', () => {
  assert.deepEqual(u16be(0x0240), [0x02, 0x40]);
  assert.deepEqual(u16be(400), [0x01, 0x90]);
  assert.deepEqual(u16be(0), [0, 0]);
  assert.deepEqual(u16be(70000), [0xff, 0xff]);
});

// ---------------------------------------------------------------------------
// Trames de réglage — comparées aux octets documentés
// ---------------------------------------------------------------------------

test('SetLabelType(1)', () => {
  assert.equal(hex(setLabelType(1)), '55 55 23 01 01 23 aa aa');
});

test('PrintClear', () => {
  assert.equal(hex(printClear()), '55 55 20 01 01 20 aa aa');
});

test('PageStart', () => {
  assert.equal(hex(pageStart()), '55 55 03 01 01 03 aa aa');
});

test('PageEnd', () => {
  assert.equal(hex(pageEnd()), '55 55 e3 01 01 e3 aa aa');
});

test('PrintEnd', () => {
  assert.equal(hex(printEnd()), '55 55 f3 01 01 f3 aa aa');
});

test('PrintStatus', () => {
  assert.equal(hex(printStatus()), '55 55 a3 01 01 a3 aa aa');
});

test('PrinterStatusData', () => {
  assert.equal(hex(printerStatusData()), '55 55 a5 01 01 a5 aa aa');
});

test('PrinterInfo [08]', () => {
  assert.equal(hex(printerInfo(0x08)), '55 55 40 01 08 49 aa aa');
});

test('Heartbeat Advanced2 [04]', () => {
  assert.equal(hex(heartbeat()), '55 55 dc 01 04 d9 aa aa');
});

test('PrintQuantity(1)', () => {
  assert.equal(hex(printQuantity(1)), '55 55 15 02 00 01 16 aa aa');
});

test('PrintEmptyRow ligne 0 ×4', () => {
  assert.equal(hex(printEmptyRow(0, 4)), '55 55 84 03 00 00 04 83 aa aa');
});

// ---------------------------------------------------------------------------
// PrintStart — les variantes ne sont pas interchangeables
// ---------------------------------------------------------------------------

test('PrintStart D110 tient sur un seul octet', () => {
  const packet = printStart('D110');
  assert.equal(hex(packet), '55 55 01 01 01 01 aa aa');
  assert.equal(packet[3], 1);
});

test('PrintStart B1 déclare le nombre de pages sur 7 octets', () => {
  assert.equal(hex(printStart('B1')), '55 55 01 07 00 01 00 00 00 00 00 07 aa aa');
});

test('PrintStart B1 reflète le nombre de pages', () => {
  const packet = printStart('B1', { pages: 3 });
  assert.equal(packet[4], 0x00);
  assert.equal(packet[5], 0x03);
});

test('PrintStart V4 fait 9 octets et porte la vitesse', () => {
  const packet = printStart('V4', { speed: 1 });
  assert.equal(packet[3], 9);
  assert.equal(hex(packet), '55 55 01 09 00 01 00 00 00 00 00 01 00 08 aa aa');
});

// ---------------------------------------------------------------------------
// SetPageSize — la largeur est celle de la tête
// ---------------------------------------------------------------------------

test('SetPageSize D110 sur 4 octets (400 lignes × 96 colonnes)', () => {
  assert.equal(
    hex(setPageSize('D110', { rows: 400, cols: 96 })),
    '55 55 13 04 01 90 00 60 e6 aa aa',
  );
});

test('SetPageSize B1 sur 6 octets et porte les copies', () => {
  assert.equal(
    hex(setPageSize('B1', { rows: 354, cols: 576, copies: 1 })),
    '55 55 13 06 01 62 02 40 00 01 35 aa aa',
  );
});

test('SetPageSize V4 sur 13 octets', () => {
  assert.equal(
    hex(setPageSize('V4', { rows: 354, cols: 576, copies: 1 })),
    '55 55 13 0d 01 62 02 40 00 01 00 00 00 00 00 00 00 3e aa aa',
  );
});

// ---------------------------------------------------------------------------
// Ligne bitmap
// ---------------------------------------------------------------------------

test('PrintBitmapRow reproduit la trame documentée (48 noirs puis 48 blancs)', () => {
  const bitmap = Uint8Array.from([
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const packet = printBitmapRow(0, bitmap, { counts: [0x00, 0x30, 0x00] });
  assert.equal(
    hex(packet),
    '55 55 85 12 00 00 00 30 00 01 ff ff ff ff ff ff 00 00 00 00 00 00 a6 aa aa',
  );
});

test('PrintBitmapRow calcule la longueur à partir du bitmap', () => {
  const packet = printBitmapRow(0, new Uint8Array(12));
  // 2 (ligne) + 3 (compteurs) + 1 (répétition) + 12 (bitmap) = 18
  assert.equal(packet[3], 18);
});

test('PrintBitmapRow borne la répétition à 255', () => {
  const packet = printBitmapRow(0, new Uint8Array(12), { run: 9999 });
  assert.equal(packet[9], 255);
});

// ---------------------------------------------------------------------------
// Décodeur de flux
// ---------------------------------------------------------------------------

test('le décodeur restitue une trame entière', () => {
  const decoder = new PacketStreamDecoder();
  const packets = decoder.push(new Uint8Array(bytes('55 55 31 01 02 32 aa aa')));
  assert.equal(packets.length, 1);
  assert.equal(packets[0].cmd, 0x31);
  assert.deepEqual(Array.from(packets[0].data), [0x02]);
  assert.equal(packets[0].checksumValid, true);
});

test('le décodeur recolle une trame fragmentée entre deux notifications', () => {
  const decoder = new PacketStreamDecoder();
  // Trame de statut 0xB3 construite par l'encodeur, donc au checksum correct.
  // 2 (en-tête) + 1 (cmd) + 1 (len) + 3 (données) + 1 (cks) + 2 (pied) = 10
  const full = buildPacket(0xb3, [0x00, 0x02, 0x40]);
  assert.equal(full.length, 10);

  assert.deepEqual(decoder.push(full.slice(0, 3)), []);
  assert.deepEqual(decoder.push(full.slice(3, 7)), []);
  const packets = decoder.push(full.slice(7));
  assert.equal(packets.length, 1);
  assert.equal(packets[0].cmd, 0xb3);
  assert.deepEqual(Array.from(packets[0].data), [0x00, 0x02, 0x40]);
});

test('le décodeur sépare plusieurs trames collées dans une notification', () => {
  const decoder = new PacketStreamDecoder();
  const a = setDensity(3);
  const b = pageStart();
  const glued = new Uint8Array([...a, ...b]);

  const packets = decoder.push(glued);
  assert.equal(packets.length, 2);
  assert.equal(packets[0].cmd, CMD.SetDensity);
  assert.equal(packets[1].cmd, CMD.PageStart);
});

test('le décodeur ignore les octets parasites avant l\'en-tête', () => {
  const decoder = new PacketStreamDecoder();
  const noise = [0x12, 0x34, 0x55, 0x00];
  const packets = decoder.push(new Uint8Array([...noise, ...pageEnd()]));
  assert.equal(packets.length, 1);
  assert.equal(packets[0].cmd, CMD.PageEnd);
  assert.ok(decoder.rejected > 0);
});

test('le décodeur resynchronise après une trame au checksum invalide', () => {
  const decoder = new PacketStreamDecoder();
  const corrupted = new Uint8Array(bytes('55 55 21 01 03 ff aa aa')); // checksum faux
  const packets = decoder.push(new Uint8Array([...corrupted, ...printEnd()]));

  assert.equal(packets.length, 1);
  assert.equal(packets[0].cmd, CMD.PrintEnd);
});

test('le décodeur attend la suite si la trame est incomplète', () => {
  const decoder = new PacketStreamDecoder();
  const full = setPageSize('D110', { rows: 400, cols: 96 });
  assert.deepEqual(decoder.push(full.slice(0, full.length - 1)), []);
  const packets = decoder.push(full.slice(full.length - 1));
  assert.equal(packets.length, 1);
});

test('le décodeur gère un octet 0x55 isolé sans perdre le flux suivant', () => {
  // Régression : le 0x55 parasite formait un faux en-tête, la trame paraissait
  // incomplète et le décodeur attendait indéfiniment au lieu de resynchroniser.
  const decoder = new PacketStreamDecoder();
  assert.deepEqual(decoder.push([0x55]), []);
  const packets = decoder.push(pageStart());
  assert.equal(packets.length, 1);
  assert.equal(packets[0].cmd, CMD.PageStart);
});

test('reset vide le tampon', () => {
  const decoder = new PacketStreamDecoder();
  decoder.push([0x55, 0x55, 0x21]); // trame partielle, volontairement abandonnée
  decoder.reset();
  const packets = decoder.push(pageStart());
  assert.equal(packets.length, 1);
  assert.equal(packets[0].cmd, CMD.PageStart);
});

// ---------------------------------------------------------------------------
// Interprétation des notifications
// ---------------------------------------------------------------------------

test('parsePrintStatus lit la page et les progressions', () => {
  const status = parsePrintStatus(Uint8Array.from([0x00, 0x02, 0x40, 0x01]));
  assert.equal(status.page, 2);
  assert.equal(status.printProgress, 0x40);
  assert.equal(status.feedProgress, 0x01);
  assert.equal(status.error, 0);
});

test('parsePrintStatus tolère un payload court (modèle M2-H)', () => {
  const status = parsePrintStatus(Uint8Array.from([0x00, 0x01]));
  assert.equal(status.page, 1);
  assert.equal(status.printProgress, 0);
});

test('parsePrintStatus lit l\'erreur sur un payload de 10 octets', () => {
  const data = Uint8Array.from([0, 1, 0, 0, 0, 0, 0, 0, 0, 0x07]);
  assert.equal(parsePrintStatus(data).error, 0x07);
});

test('parsePrinterInfo comprend un modelId sur deux octets', () => {
  assert.equal(parsePrinterInfo(Uint8Array.from([0x09, 0x00])).modelId, 2304);
});

test('parsePrinterInfo comprend un modelId sur un octet', () => {
  assert.equal(parsePrinterInfo(Uint8Array.from([0x09])).modelId, 0x0900);
});
