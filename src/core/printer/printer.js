/**
 * Session d'impression Niimbot (D110 en priorité).
 *
 * Enchaîne le dialogue documenté, en vérifiant chaque acquittement. Le principe
 * directeur : ne jamais supposer qu'une commande a été acceptée. L'imprimante
 * rogne ou ignore en silence ; seule la lecture des réponses révèle l'échec.
 *
 * Deux pièges structurels sont explicitement gérés :
 *
 * - Le D110 refuse un `SetPageSize` au format des firmwares v4 (13 octets) en
 *   répondant une erreur DataError (0xDB 06) **au lieu d'imprimer**. On ne
 *   route donc jamais un D110 vers le task « V4 ».
 * - L'imprimante rogne les colonnes au-delà de la largeur de tête (96 px pour
 *   un D110) sans renvoyer d'erreur. C'est à l'appelant de fournir une image à
 *   la bonne largeur ; `prepareRows` le vérifie et le signale.
 */

import {
  CMD,
  CMD_IN,
  PRINT_ERRORS,
  LABEL_TYPES,
  buildPacket,
  buildConnect,
  setDensity,
  setLabelType,
  printStart,
  printClear,
  pageStart,
  setPageSize,
  printQuantity,
  printBitmapRow,
  printEmptyRow,
  pageEnd,
  printEnd,
  printStatus,
  printerStatusData,
  printerInfo,
  parsePrintStatus,
  parsePrinterInfo,
  parseRfidInfo,
  rfidInfo,
} from './packet.js';
import { DEFAULT_PROFILE, findByModelId, findByName, withReportedHead } from './profiles.js';

/** Délai de réponse par défaut pour une commande de réglage. */
export const DEFAULT_ACK_TIMEOUT_MS = 3000;

/** Délai d'attente de la fin d'impression : la tête chauffe, c'est lent. */
export const DEFAULT_PRINT_TIMEOUT_MS = 60000;

/** Intervalle entre deux interrogations de statut. */
export const POLL_INTERVAL_MS = 300;

/** Répétition maximale d'une ligne dans une trame, valeur pratique constatée. */
export const MAX_ROW_RUN = 200;

/**
 * @typedef {Object} MonoBitmap
 * @property {number} width   Largeur en pixels, multiple de 8.
 * @property {number} height  Hauteur en pixels.
 * @property {Uint8Array[]} rows Une entrée par ligne de pixels.
 */

/**
 * Compacte les lignes identiques consécutives en trames à répétition.
 *
 * Une ligne entièrement blanche devient une trame « ligne vide » (0x84), qui
 * ne transporte aucun octet de pixels : c'est ce qui allège les marges et
 * divise le trafic Bluetooth par trois à cinq sur une étiquette réelle.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ maxRun?: number }} [options]
 * @returns {Array<{ row: number, run: number, bytes: Uint8Array|null }>}
 */
export function prepareRows(bitmap, options = {}) {
  const maxRun = Math.max(1, Math.min(255, options.maxRun ?? MAX_ROW_RUN));
  const { rows } = bitmap;
  const frames = [];

  const isBlank = (bytes) => {
    for (let i = 0; i < bytes.length; i++) if (bytes[i] !== 0) return false;
    return true;
  };
  const same = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  let index = 0;
  while (index < rows.length) {
    let run = 1;
    while (
      run < maxRun &&
      index + run < rows.length &&
      same(rows[index], rows[index + run])
    ) {
      run++;
    }
    frames.push({
      row: index,
      run,
      bytes: isBlank(rows[index]) ? null : rows[index],
    });
    index += run;
  }

  return frames;
}

/**
 * Construit les trames binaires correspondant à une image.
 *
 * @param {MonoBitmap} bitmap
 * @param {{ maxRun?: number }} [options]
 * @returns {Uint8Array[]}
 */
export function bitmapFrames(bitmap, options = {}) {
  return prepareRows(bitmap, options).map((entry) =>
    entry.bytes ? printBitmapRow(entry.row, entry.bytes, { run: entry.run })
      : printEmptyRow(entry.row, entry.run),
  );
}

/**
 * Session d'impression pilotant un transport déjà connecté.
 */
export class NiimbotPrinter {
  /**
   * @param {import('./transport.js').NiimbotTransport} transport
   * @param {{ profile?: object, ackTimeoutMs?: number, printTimeoutMs?: number }} [options]
   */
  constructor(transport, options = {}) {
    this.transport = transport;
    this.ackTimeoutMs = options.ackTimeoutMs ?? DEFAULT_ACK_TIMEOUT_MS;
    this.printTimeoutMs = options.printTimeoutMs ?? DEFAULT_PRINT_TIMEOUT_MS;

    /** Profil deviné depuis le nom BLE, remplacé après lecture du modelId. */
    this.profile = options.profile ?? null;
    this.deviceName = transport.device?.name ?? '';

    /** @type {{ modelId: number|null, protocolVersion: number|null, error: number|null }} */
    this.info = { modelId: null, protocolVersion: null, error: null };

    this.offPacket = null;
  }

  /**
   * Établit la session : connexion, lecture de l'identité, choix du profil.
   *
   * @returns {Promise<{ profile: object, modelId: number|null, reportedHeadPixels: number|null }>}
   */
  async start() {
    // Horodatage des erreurs : l'imprimante peut signaler un refus à tout moment.
    this.offPacket = this.transport.onPacket((packet) => {
      if (packet.cmd === CMD_IN.PrintError) {
        this.info.error = packet.data[0] ?? null;
      }
    });

    await this.ack(buildConnect(), CMD_IN.Connect);

    // PrinterStatusData porte la version de protocole ; PrinterInfo, le modèle.
    const status = await this.ack(printerStatusData(), CMD_IN.PrinterStatusData);
    this.info.protocolVersion = status.data[0] ?? null;

    let modelId = null;
    try {
      const info = await this.ack(printerInfo(0x08), CMD_IN.PrinterInfo);
      modelId = parsePrinterInfo(info.data).modelId;
      this.info.modelId = modelId;
    } catch {
      // Certains firmwares ne répondent pas à cette interrogation : ce n'est
      // pas bloquant, on retombe sur le nom annoncé.
    }

    let profile =
      (modelId !== null ? findByModelId(modelId) : undefined) ??
      this.profile ??
      findByName(this.deviceName) ??
      DEFAULT_PROFILE;

    const head = await this.#readHeadWidth();
    if (head !== null) profile = withReportedHead(profile, head);

    this.profile = profile;
    return { profile, modelId, reportedHeadPixels: head };
  }

  /**
   * Imprime une image.
   *
   * @param {MonoBitmap} bitmap Largeur = largeur de tête, multiple de 8.
   * @param {{
   *   density?: number,
   *   copies?: number,
   *   labelType?: number,
   *   onProgress?: (progress: { page: number, copies: number }) => void,
   * }} [options]
   * @returns {Promise<{ pages: number, rows: number, frames: number }>}
   */
  async print(bitmap, options = {}) {
    const profile = this.profile ?? DEFAULT_PROFILE;
    const copies = Math.max(1, Math.trunc(options.copies ?? 1));
    const density = Math.max(
      profile.density.min,
      Math.min(profile.density.max, Math.trunc(options.density ?? profile.density.default)),
    );
    const labelType = options.labelType ?? LABEL_TYPES.WithGaps;

    if (bitmap.width > profile.printheadPixels) {
      throw new RangeError(
        `Image de ${bitmap.width} px alors que la tête du ${profile.id} fait ` +
        `${profile.printheadPixels} px : l'imprimante rognerait ${bitmap.width - profile.printheadPixels} px ` +
        'sans le signaler.',
      );
    }
    if (bitmap.height > profile.maxPrintHeightMm * (profile.dpi / 25.4)) {
      throw new RangeError(
        `Image de ${bitmap.height} px, au-delà de la hauteur maximale du ${profile.id}.`,
      );
    }

    const task = profile.printTask;

    await this.ack(setDensity(density), CMD_IN.SetDensity);
    await this.ack(setLabelType(labelType), CMD_IN.SetLabelType);

    // Le D110 n'accepte qu'un seul octet ici et ne peut donc pas déclarer de
    // job multi-pages ; les autres modèles reçoivent la variante adaptée.
    await this.ack(printStart(task, { pages: copies }), CMD_IN.PrintStart);

    if (task === 'D110') {
      await this.ack(printClear(), CMD_IN.PrintClear);
    }

    await this.ack(pageStart(), CMD_IN.PageStart);
    await this.ack(
      setPageSize(task, {
        rows: bitmap.height,
        cols: profile.printheadPixels,
        copies,
      }),
      CMD_IN.SetPageSize,
    );
    await this.ack(printQuantity(copies), CMD_IN.PrintQuantity);

    const frames = bitmapFrames(bitmap);
    for (const frame of frames) {
      await this.transport.write(frame);
    }
    await this.transport.flush();

    await this.ack(pageEnd(), CMD_IN.PageEnd, { timeoutMs: this.printTimeoutMs });
    await this.#waitForCompletion(copies, options.onProgress);
    await this.ack(printEnd(), CMD_IN.PrintEnd, { timeoutMs: this.printTimeoutMs });

    if (this.info.error !== null) {
      const label = PRINT_ERRORS[this.info.error] ?? `code 0x${this.info.error.toString(16)}`;
      throw new Error(`L'imprimante a signalé une erreur : ${label}`);
    }

    return { pages: copies, rows: bitmap.height, frames: frames.length };
  }

  /** Libère les observateurs. */
  dispose() {
    this.offPacket?.();
    this.offPacket = null;
  }

  /**
   * Envoie une trame et attend son acquittement.
   *
   * @param {Uint8Array} frame
   * @param {number} expectedCmd
   * @param {{ timeoutMs?: number }} [options]
   * @returns {Promise<any>}
   */
  async ack(frame, expectedCmd, options = {}) {
    const waiting = this.transport.expect(expectedCmd, {
      timeoutMs: options.timeoutMs ?? this.ackTimeoutMs,
    });
    // L'attente est armée avant l'envoi : une réponse très rapide ne doit pas
    // être manquée.
    await this.transport.write(frame);
    await this.transport.flush();
    return waiting;
  }

  /**
   * Interroge le statut jusqu'à ce que le nombre de pages imprimées soit atteint.
   * @param {number} copies
   * @param {(progress: { page: number, copies: number }) => void} [onProgress]
   */
  async #waitForCompletion(copies, onProgress) {
    const deadline = Date.now() + this.printTimeoutMs;

    while (Date.now() < deadline) {
      const response = await this.ack(printStatus(), CMD_IN.PrintStatus, {
        timeoutMs: this.ackTimeoutMs,
      });
      const status = parsePrintStatus(response.data);
      onProgress?.({ page: status.page, copies });

      if (status.page >= copies) return;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(
      `L'impression n'a pas confirmé son achèvement après ${this.printTimeoutMs} ms. ` +
      'L\'étiquette est peut-être incomplète.',
    );
  }

  /**
   * Tente de lire la largeur de tête réellement rapportée par l'imprimante.
   *
   * La sonde est `Heartbeat 0xDC [03]`, à laquelle l'imprimante répond `0xDE`
   * avec la largeur sur les octets 4-5. C'est la mesure la plus fiable — elle
   * vient du matériel — mais elle n'a été observée que sur M2_H, et beaucoup de
   * firmwares ne répondent simplement pas. Le délai est donc court et l'échec
   * silencieux, pour ne pas ralentir la connexion d'un D110 qui l'ignore.
   *
   * La largeur rapportée est celle de la **tête**, pas de l'étiquette.
   *
   * @returns {Promise<number|null>}
   */
  async readSupply() {
    try {
      const response = await this.ack(rfidInfo(), CMD_IN.RfidInfo, { timeoutMs: 900 });
      return parseRfidInfo(response.data);
    } catch {
      // Pas de lecteur RFID, ou firmware qui ne répond pas : c'est le cas de la
      // plupart des modèles. Le choix manuel de la longueur prend le relais.
      return null;
    }
  }

  async #readHeadWidth() {
    /** Réponse à la sonde de largeur de tête. Absent de CMD_IN car propre à ce dialogue. */
    const CMD_IN_HEARTBEAT_INFO = 0xde;
    try {
      const frame = buildPacket(CMD.Heartbeat, [0x03]);
      const response = await this.ack(frame, CMD_IN_HEARTBEAT_INFO, { timeoutMs: 600 });
      if (response.data.length >= 6) {
        const width = (response.data[4] << 8) | response.data[5];
        if (width > 0) return width;
      }
    } catch {
      // Firmware qui ignore la sonde : ce n'est pas une erreur.
    }
    return null;
  }
}
