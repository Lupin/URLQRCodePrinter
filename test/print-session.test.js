/**
 * Tests de la session d'impression.
 *
 * On injecte un transport simulé qui décode les trames réellement écrites et
 * rejoue les acquittements attendus. C'est le seul moyen de vérifier l'ordre
 * exact du dialogue sans imprimante : une séquence erronée n'échoue pas
 * bruyamment sur le matériel, elle sort une étiquette blanche.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PacketStreamDecoder, CMD } from '../src/core/printer/packet.js';
import {
  prepareRows,
  bitmapFrames,
  NiimbotPrinter,
} from '../src/core/printer/printer.js';
import { checkWebBluetoothSupport } from '../src/core/printer/transport.js';
import { D110 } from '../src/core/printer/profiles.js';

// ---------------------------------------------------------------------------
// Transport simulé
// ---------------------------------------------------------------------------

/** Réponses par défaut, calquées sur un D110 (modelId 2304, tête 96 px). */
const DEFAULT_RESPONSES = {
  0xc1: [0xc2, [0x01]],
  0xa5: [0xb5, [0x03, 0x00]],
  0x40: [0x48, [0x09, 0x00]],
  0x21: [0x31, [0x02]],
  0x23: [0x33, [0x01]],
  0x01: [0x02, [0x01]],
  0x20: [0x30, [0x01]],
  0x03: [0x04, [0x01]],
  0x13: [0x14, [0x01]],
  0x15: [0x16, [0x00, 0x01]],
  0xe3: [0xe4, [0x01]],
  0xf3: [0xf4, [0x01]],
  // 0xDC [03] → 0xDE, largeur de tête sur les octets 4-5 (ici 0x0060 = 96).
  0xdc: [0xde, [0x00, 0x01, 0x00, 0x00, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00]],
};

class FakeTransport {
  /**
   * @param {{
   *   deviceName?: string,
   *   responses?: Record<number, [number, number[]]>,
   *   statusPages?: number[],
   *   silent?: number[],
   * }} [options]
   */
  constructor(options = {}) {
    this.device = { name: options.deviceName ?? 'D110-TEST', gatt: { connected: true } };
    this.responses = { ...DEFAULT_RESPONSES, ...(options.responses ?? {}) };
    this.statusPages = options.statusPages ?? [1];
    this.silent = new Set(options.silent ?? []);
    this.decoder = new PacketStreamDecoder();
    this.listeners = [];
    this.waiters = [];
    /** Commandes reçues, dans l'ordre. */
    this.commands = [];
    /** Trames écrites, aplaties. */
    this.frames = [];
    this.statusPolls = 0;
  }

  onPacket(listener) {
    this.listeners.push(listener);
    return () => {
      const i = this.listeners.indexOf(listener);
      if (i !== -1) this.listeners.splice(i, 1);
    };
  }

  expect(cmd, options = {}) {
    return new Promise((resolve, reject) => {
      const waiter = { cmd, match: options.match };
      const timer = setTimeout(() => {
        const i = this.waiters.indexOf(waiter);
        if (i !== -1) this.waiters.splice(i, 1);
        reject(new Error(`pas de réponse 0x${cmd.toString(16)}`));
      }, options.timeoutMs ?? 200);
      waiter.resolve = (packet) => {
        clearTimeout(timer);
        resolve(packet);
      };
      waiter.reject = (error) => {
        clearTimeout(timer);
        reject(error);
      };
      this.waiters.push(waiter);
    });
  }

  async write(frame) {
    this.frames.push(frame);
    for (const packet of this.decoder.push(frame)) {
      this.commands.push(packet.cmd);
      for (const listener of [...this.listeners]) listener(packet);
      this.#respond(packet);
    }
  }

  async flush() {}

  #respond(packet) {
    if (this.silent.has(packet.cmd)) return;

    let entry;
    if (packet.cmd === 0xa3) {
      const page = this.statusPages[Math.min(this.statusPolls, this.statusPages.length - 1)] ?? 1;
      this.statusPolls++;
      entry = [0xb3, [(page >> 8) & 0xff, page & 0xff, 0x00, 0x00]];
    } else {
      entry = this.responses[packet.cmd];
    }
    if (!entry) return;

    const [respCmd, data] = entry;
    const response = { cmd: respCmd, data: Uint8Array.from(data), checksumValid: true };
    for (const waiter of [...this.waiters]) {
      if (waiter.cmd !== respCmd) continue;
      const i = this.waiters.indexOf(waiter);
      if (i !== -1) this.waiters.splice(i, 1);
      waiter.resolve(response);
    }
  }

  /** Commandes reçues après un index donné. */
  since(index) {
    return this.commands.slice(index);
  }
}

/** Construit une image monochrome de test. */
function makeBitmap({ width = 96, rows }) {
  const bytesPerRow = Math.ceil(width / 8);
  const built = rows.map((pattern) => {
    const row = new Uint8Array(bytesPerRow);
    if (pattern === 'black') row.fill(0xff);
    else if (typeof pattern === 'number') row[0] = pattern;
    return row;
  });
  return { width, height: built.length, bytesPerRow, rows: built };
}

// ---------------------------------------------------------------------------
// Compactage des lignes
// ---------------------------------------------------------------------------

test('prepareRows fusionne les lignes identiques consécutives', () => {
  const bitmap = makeBitmap({ width: 8, rows: [0x00, 0xff, 0xff, 0x00] });
  const frames = prepareRows(bitmap);

  assert.equal(frames.length, 3);
  assert.deepEqual(frames[0], { row: 0, run: 1, bytes: null });
  assert.equal(frames[1].row, 1);
  assert.equal(frames[1].run, 2);
  assert.ok(frames[1].bytes);
  assert.deepEqual(frames[2], { row: 3, run: 1, bytes: null });
});

test('prepareRows marque les lignes blanches comme vides', () => {
  const bitmap = makeBitmap({ width: 16, rows: [0x00, 0x00] });
  const frames = prepareRows(bitmap);
  assert.equal(frames.length, 1);
  assert.equal(frames[0].run, 2);
  assert.equal(frames[0].bytes, null);
});

test('prepareRows borne la répétition', () => {
  const bitmap = makeBitmap({ width: 8, rows: new Array(500).fill(0xff) });
  const frames = prepareRows(bitmap, { maxRun: 200 });
  assert.deepEqual(frames.map((f) => f.run), [200, 200, 100]);
  // Les numéros de ligne avancent du nombre de lignes couvertes.
  assert.deepEqual(frames.map((f) => f.row), [0, 200, 400]);
});

test('prepareRows ne fusionne pas deux lignes différentes', () => {
  const bitmap = makeBitmap({ width: 8, rows: [0x0f, 0xf0] });
  assert.deepEqual(prepareRows(bitmap).map((f) => f.run), [1, 1]);
});

test('bitmapFrames utilise 0x84 pour le vide et 0x85 sinon', () => {
  const bitmap = makeBitmap({ width: 8, rows: [0x00, 0xff] });
  const frames = bitmapFrames(bitmap);
  assert.equal(frames.length, 2);
  assert.equal(frames[0][2], CMD.PrintEmptyRow);
  assert.equal(frames[1][2], CMD.PrintBitmapRow);
});

test('bitmapFrames porte la répétition dans la trame', () => {
  const bitmap = makeBitmap({ width: 8, rows: [0xff, 0xff, 0xff] });
  const [frame] = bitmapFrames(bitmap);
  // data = [rowHi, rowLo, c1, c2, c3, run, ...bitmap] → run à l'index 9.
  assert.equal(frame[9], 3);
});

// ---------------------------------------------------------------------------
// Détection du support Web Bluetooth
// ---------------------------------------------------------------------------

test('checkWebBluetoothSupport explique l\'absence de Web Bluetooth', () => {
  const verdict = checkWebBluetoothSupport({ bluetooth: undefined, isSecureContext: true });
  assert.equal(verdict.ok, false);
  assert.match(verdict.hint, /Safari/);
  assert.match(verdict.hint, /brave:\/\/flags/);
});

test('checkWebBluetoothSupport exige un contexte sécurisé', () => {
  const verdict = checkWebBluetoothSupport({ bluetooth: {}, isSecureContext: false });
  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /contexte sécurisé/);
});

test('checkWebBluetoothSupport accepte un navigateur compatible', () => {
  assert.deepEqual(checkWebBluetoothSupport({ bluetooth: {}, isSecureContext: true }), {
    ok: true,
  });
});

// ---------------------------------------------------------------------------
// Session d'impression
// ---------------------------------------------------------------------------

test('start identifie le modèle et retient le profil D110', async () => {
  const transport = new FakeTransport();
  const printer = new NiimbotPrinter(transport);
  const result = await printer.start();

  assert.equal(result.modelId, 2304);
  assert.equal(result.profile.id, 'D110');
  assert.equal(result.reportedHeadPixels, 96);
  assert.equal(printer.info.protocolVersion, 0x03);
});

test('start retombe sur le nom BLE si le modèle ne répond pas', async () => {
  const transport = new FakeTransport({ deviceName: 'D110-FC06023035', silent: [0x40] });
  // Délai court : on teste le repli, pas la patience de l'attente.
  const printer = new NiimbotPrinter(transport, { ackTimeoutMs: 60 });
  const result = await printer.start();
  assert.equal(result.modelId, null);
  assert.equal(result.profile.id, 'D110');
});

test('start utilise le profil par défaut sur un appareil inconnu', async () => {
  const transport = new FakeTransport({ deviceName: 'Truc', silent: [0x40, 0xdc] });
  const printer = new NiimbotPrinter(transport, { ackTimeoutMs: 60 });
  const result = await printer.start();
  assert.equal(result.profile, D110);
  assert.equal(result.reportedHeadPixels, null);
});

test('print envoie la séquence D110 dans l\'ordre documenté', async () => {
  const transport = new FakeTransport();
  const printer = new NiimbotPrinter(transport);
  await printer.start();

  const marker = transport.commands.length;
  const bitmap = makeBitmap({ width: 96, rows: [0x00, 0xff, 0xff, 0x00] });
  await printer.print(bitmap, { density: 2, copies: 1 });

  const sent = transport.since(marker);
  assert.deepEqual(sent, [
    0x21, // SetDensity
    0x23, // SetLabelType
    0x01, // PrintStart
    0x20, // PrintClear
    0x03, // PageStart
    0x13, // SetPageSize
    0x15, // PrintQuantity
    0x84, // ligne vide
    0x85, // ligne pleine ×2
    0x84, // ligne vide
    0xe3, // PageEnd
    0xa3, // PrintStatus
    0xf3, // PrintEnd
  ]);
});

test('print refuse une image plus large que la tête', async () => {
  const transport = new FakeTransport();
  const printer = new NiimbotPrinter(transport);
  await printer.start();

  const trop = makeBitmap({ width: 120, rows: [0xff] });
  await assert.rejects(() => printer.print(trop), /rogn/i);
});

test('print refuse une image plus haute que le maximum du modèle', async () => {
  const transport = new FakeTransport();
  const printer = new NiimbotPrinter(transport);
  await printer.start();

  // 100 mm à 203 dpi ≈ 799 px ; on dépasse franchement.
  const bitmap = { width: 96, height: 5000, bytesPerRow: 12, rows: [] };
  await assert.rejects(() => printer.print(bitmap), RangeError);
});

test('print borne la densité aux valeurs du profil', async () => {
  const transport = new FakeTransport();
  const printer = new NiimbotPrinter(transport);
  await printer.start();

  const marker = transport.commands.length;
  await printer.print(makeBitmap({ width: 96, rows: [0xff] }), { density: 99 });

  const densityFrame = transport.frames.find(
    (f, i) => transport.since(marker).length && f[2] === CMD.SetDensity,
  );
  // Le D110 accepte 1 à 3 ; 99 doit être ramené à 3.
  assert.equal(densityFrame[4], 3);
});

test('print remonte une erreur signalée par l\'imprimante', async () => {
  const transport = new FakeTransport();
  const printer = new NiimbotPrinter(transport);
  await printer.start();

  // Capot ouvert juste après le début d'impression.
  const originalWrite = transport.write.bind(transport);
  transport.write = async (frame) => {
    await originalWrite(frame);
    if (frame[2] === CMD.PrintStart) {
      const error = { cmd: 0xdb, data: Uint8Array.from([0x01]), checksumValid: true };
      for (const listener of transport.listeners) listener(error);
    }
  };

  await assert.rejects(
    () => printer.print(makeBitmap({ width: 96, rows: [0xff] })),
    /Capot ouvert/,
  );
});

test('print attend la confirmation de chaque copie', async () => {
  const transport = new FakeTransport({ statusPages: [1, 2] });
  const printer = new NiimbotPrinter(transport);
  await printer.start();

  const progress = [];
  await printer.print(makeBitmap({ width: 96, rows: [0xff] }), {
    copies: 2,
    onProgress: (p) => progress.push(p.page),
  });

  assert.deepEqual(progress, [1, 2]);
  assert.equal(transport.statusPolls, 2);
});

test('ack échoue proprement quand l\'imprimante ne répond pas', async () => {
  // On rend l'imprimante muette sur SetDensity (0x21) : l'acquittement attendu
  // est SetDensityResponse (0x31), et c'est donc ce code qui doit apparaître
  // dans le message d'erreur.
  const transport = new FakeTransport({ silent: [0x21] });
  const printer = new NiimbotPrinter(transport, { ackTimeoutMs: 120 });
  await printer.start();

  await assert.rejects(
    () => printer.print(makeBitmap({ width: 96, rows: [0xff] })),
    /0x31/,
  );
});

test('dispose retire l\'observateur d\'erreurs', async () => {
  const transport = new FakeTransport();
  const printer = new NiimbotPrinter(transport);
  await printer.start();
  assert.equal(transport.listeners.length, 1);
  printer.dispose();
  assert.equal(transport.listeners.length, 0);
});
