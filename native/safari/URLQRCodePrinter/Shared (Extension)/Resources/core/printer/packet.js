/**
 * Protocole Niimbot — encodage et décodage des trames.
 *
 * Trame standard :
 *
 *   0x55 0x55 │ CMD │ LEN │ DATA[0..LEN-1] │ XOR │ 0xAA 0xAA
 *
 * Le checksum est le XOR de CMD, LEN et de **tous** les octets de DATA.
 * L'en-tête et le pied de trame n'y participent pas.
 *
 * Le flux reçu n'est pas aligné sur les trames : plusieurs trames peuvent
 * arriver collées dans une notification, et une trame peut être coupée entre
 * deux notifications. `PacketStreamDecoder` tamponne et resynchronise sur
 * l'en-tête — c'est le point que ratent la plupart des implémentations maison.
 *
 * Références : MultiMote/niimbluelib (`src/packets/packet.ts`),
 * iscarelli/niimbot-web-bluetooth (driver validé sur D110 et M2-H),
 * printers.niim.blue/interfacing/proto/.
 */

export const HEAD = Object.freeze([0x55, 0x55]);
export const TAIL = Object.freeze([0xaa, 0xaa]);

/** Préfixe ajouté uniquement à la commande Connect. */
export const CONNECT_PREFIX = 0x03;

/** Codes de commande (client → imprimante). */
export const CMD = Object.freeze({
  Connect: 0xc1,
  PrintStart: 0x01,
  PageStart: 0x03,
  PageEnd: 0xe3,
  PrintEnd: 0xf3,
  PrintClear: 0x20,
  SetDensity: 0x21,
  SetLabelType: 0x23,
  SetPageSize: 0x13,
  PrintQuantity: 0x15,
  PrintBitmapRow: 0x85,
  PrintEmptyRow: 0x84,
  PrinterCheckLine: 0x86,
  PrintStatus: 0xa3,
  PrinterStatusData: 0xa5,
  PrinterInfo: 0x40,
  Heartbeat: 0xdc,
});

/** Codes de notification (imprimante → client). */
export const CMD_IN = Object.freeze({
  Connect: 0xc2,
  PrintStart: 0x02,
  PageStart: 0x04,
  PageEnd: 0xe4,
  PrintEnd: 0xf4,
  PrintClear: 0x30,
  SetDensity: 0x31,
  SetLabelType: 0x33,
  SetPageSize: 0x14,
  PrintQuantity: 0x16,
  PrinterCheckLine: 0xd3,
  PrintStatus: 0xb3,
  PrinterStatusData: 0xb5,
  PrinterInfo: 0x48,
  Heartbeat: 0xd9,
  PrintError: 0xdb,
  NotSupported: 0x00,
});

/** Codes d'erreur transportés par la notification 0xDB. */
export const PRINT_ERRORS = Object.freeze({
  0x01: 'Capot ouvert',
  0x02: 'Plus de papier',
  0x03: 'Batterie faible',
  0x05: 'Annulé par l\'utilisateur',
  0x06: 'Erreur de données (format de page refusé)',
  0x07: 'Surchauffe',
  0x09: 'Imprimante occupée',
  0x0d: 'Ruban absent',
  0x0f: 'Ruban usagé',
  0x10: 'Papier incorrect',
  0x16: 'Exception de communication',
  0x17: 'Déconnexion',
  0x34: 'Délai de réception dépassé',
});

/** Types d'étiquette acceptés par SetLabelType (0x23). */
export const LABEL_TYPES = Object.freeze({
  WithGaps: 1,
  BlackMark: 2,
  Continuous: 3,
  Perforated: 4,
  Transparent: 5,
  PvcTag: 6,
  BlackMarkGap: 10,
  HeatShrinkTube: 11,
});

/**
 * Calcule le checksum d'une trame.
 *
 * @param {number} cmd
 * @param {ArrayLike<number>} data
 * @returns {number}
 */
export function checksum(cmd, data) {
  let cks = cmd ^ (data.length & 0xff);
  for (let i = 0; i < data.length; i++) cks ^= data[i];
  return cks & 0xff;
}

/**
 * Construit une trame complète.
 *
 * @param {number} cmd
 * @param {ArrayLike<number>} [data]
 * @param {{ prefix?: boolean }} [options] `prefix: true` ajoute l'octet 0x03
 *   réservé à la commande Connect.
 * @returns {Uint8Array}
 */
export function buildPacket(cmd, data = [], options = {}) {
  const payload = Uint8Array.from(data);
  const length = payload.length;
  if (length > 0xff) {
    throw new RangeError(`Charge utile trop longue : ${length} octets (maximum 255)`);
  }

  const prefixLength = options.prefix ? 1 : 0;
  const packet = new Uint8Array(prefixLength + 2 + 1 + 1 + length + 1 + 2);
  let i = 0;

  if (options.prefix) packet[i++] = CONNECT_PREFIX;
  packet[i++] = HEAD[0];
  packet[i++] = HEAD[1];
  packet[i++] = cmd & 0xff;
  packet[i++] = length;
  packet.set(payload, i);
  i += length;
  packet[i++] = checksum(cmd, payload);
  packet[i++] = TAIL[0];
  packet[i] = TAIL[1];

  return packet;
}

/**
 * Construit la trame de connexion (seule trame préfixée).
 * @returns {Uint8Array} `03 55 55 c1 01 01 c1 aa aa`
 */
export function buildConnect() {
  return buildPacket(CMD.Connect, [0x01], { prefix: true });
}

/**
 * Encode un entier non signé sur 16 bits, gros-boutiste.
 * @param {number} value
 * @returns {[number, number]}
 */
export function u16be(value) {
  const v = Math.max(0, Math.min(0xffff, Math.trunc(value)));
  return [(v >> 8) & 0xff, v & 0xff];
}

/**
 * @typedef {Object} Packet
 * @property {number} cmd
 * @property {Uint8Array} data
 * @property {number} checksum
 * @property {boolean} checksumValid
 */

/**
 * Décodeur incrémental : absorbe des fragments d'octets et restitue les trames
 * complètes qu'il reconnaît.
 *
 * Les octets parasites sont ignorés jusqu'à retrouver un en-tête `55 55` suivi
 * d'une trame cohérente (longueur et pied valides). Un checksum invalide ne
 * fait pas perdre le flux : on repart de l'octet suivant.
 */
export class PacketStreamDecoder {
  constructor() {
    /** @type {number[]} */
    this.buffer = [];
    /** Nombre de trames rejetées, exposé pour le diagnostic. */
    this.rejected = 0;
  }

  /** Vide le tampon (à appeler à la reconnexion). */
  reset() {
    this.buffer.length = 0;
  }

  /**
   * Absorbe des octets.
   * @param {ArrayLike<number>} chunk
   * @returns {Packet[]} trames complètes reconnues
   */
  push(chunk) {
    for (let i = 0; i < chunk.length; i++) this.buffer.push(chunk[i]);

    const packets = [];

    for (;;) {
      const start = this.#findHead(0);
      if (start === -1) {
        // Aucun en-tête : on ne conserve que le dernier octet, susceptible
        // d'être le premier 0x55 d'un en-tête coupé entre deux notifications.
        if (this.buffer.length > 1) {
          this.rejected += this.buffer.length - 1;
          this.buffer.splice(0, this.buffer.length - 1);
        }
        break;
      }
      if (start > 0) {
        this.rejected += start;
        this.buffer.splice(0, start);
      }

      const attempt = this.#parseAt(0);

      if (attempt.status === 'ok') {
        packets.push(attempt.packet);
        this.buffer.splice(0, attempt.total);
        continue;
      }

      if (attempt.status === 'invalid') {
        // Trame incohérente : on saute l'en-tête et on cherche le suivant.
        this.rejected++;
        this.buffer.splice(0, 2);
        continue;
      }

      // La trame est incomplète. Avant d'attendre la suite, il faut écarter le
      // cas d'un 0x55 parasite : si une trame complète et valide commence plus
      // loin, c'est que l'en-tête repéré n'en était pas un. Sans ce contrôle,
      // un seul octet 0x55 isolé bloquerait le décodeur indéfiniment.
      const alternative = this.#findNextCompleteFrame(1);
      if (alternative !== -1) {
        this.rejected += alternative;
        this.buffer.splice(0, alternative);
        continue;
      }
      break;
    }

    return packets;
  }

  /**
   * Tente d'analyser la trame qui commence à `index`.
   *
   * @param {number} index
   * @returns {{status: 'ok', packet: Packet, total: number}
   *   | {status: 'incomplete'}
   *   | {status: 'invalid'}}
   */
  #parseAt(index) {
    // En-tête (2) + cmd (1) + len (1)
    if (this.buffer.length < index + 4) return { status: 'incomplete' };

    const len = this.buffer[index + 3];
    const total = 4 + len + 1 + 2;
    if (this.buffer.length < index + total) return { status: 'incomplete' };

    const cmd = this.buffer[index + 2];
    const data = Uint8Array.from(this.buffer.slice(index + 4, index + 4 + len));
    const cks = this.buffer[index + 4 + len];
    const tailOk =
      this.buffer[index + 5 + len] === TAIL[0] && this.buffer[index + 6 + len] === TAIL[1];

    if (cks !== checksum(cmd, data) || !tailOk) return { status: 'invalid' };
    return { status: 'ok', packet: { cmd, data, checksum: cks, checksumValid: true }, total };
  }

  /**
   * Cherche, à partir de `from`, l'index d'une trame complète ET valide.
   * Une trame incomplète ne compte pas : on ne peut pas encore la confirmer.
   *
   * @param {number} from
   * @returns {number} index, ou -1
   */
  #findNextCompleteFrame(from) {
    for (let i = from; i + 1 < this.buffer.length; i++) {
      if (this.buffer[i] !== HEAD[0] || this.buffer[i + 1] !== HEAD[1]) continue;
      if (this.#parseAt(i).status === 'ok') return i;
    }
    return -1;
  }

  /**
   * Cherche la prochaine occurrence de `55 55`.
   * @param {number} from
   * @returns {number} index, ou -1
   */
  #findHead(from) {
    for (let i = from; i + 1 < this.buffer.length; i++) {
      if (this.buffer[i] === HEAD[0] && this.buffer[i + 1] === HEAD[1]) return i;
    }
    return -1;
  }
}

// ---------------------------------------------------------------------------
// Constructeurs de trames de haut niveau
// ---------------------------------------------------------------------------

/** @param {number} density @returns {Uint8Array} */
export const setDensity = (density) => buildPacket(CMD.SetDensity, [density & 0xff]);

/** @param {number} type @returns {Uint8Array} */
export const setLabelType = (type) => buildPacket(CMD.SetLabelType, [type & 0xff]);

/**
 * PrintStart. Le D110 attend **un seul octet** ; les modèles B1/M2 en attendent
 * sept, et les firmwares v4 neuf. Ne pas confondre : le D110 refuse un format
 * trop long avec une erreur DataError (0xDB 06).
 *
 * @param {'D110'|'B1'|'V4'} variant
 * @param {{ pages?: number, pageColor?: number, speed?: number }} [options]
 * @returns {Uint8Array}
 */
export function printStart(variant, options = {}) {
  const pages = options.pages ?? 1;
  const pageColor = options.pageColor ?? 0;

  if (variant === 'B1') {
    const [hi, lo] = u16be(pages);
    return buildPacket(CMD.PrintStart, [hi, lo, 0, 0, 0, 0, pageColor]);
  }
  if (variant === 'V4') {
    const [hi, lo] = u16be(pages);
    const speed = options.speed ?? 1;
    return buildPacket(CMD.PrintStart, [hi, lo, 0, 0, 0, 0, pageColor, speed, 0]);
  }
  return buildPacket(CMD.PrintStart, [0x01]);
}

/** @returns {Uint8Array} */
export const printClear = () => buildPacket(CMD.PrintClear, [0x01]);

/** @returns {Uint8Array} */
export const pageStart = () => buildPacket(CMD.PageStart, [0x01]);

/** @returns {Uint8Array} */
export const pageEnd = () => buildPacket(CMD.PageEnd, [0x01]);

/** @returns {Uint8Array} */
export const printEnd = () => buildPacket(CMD.PrintEnd, [0x01]);

/** @returns {Uint8Array} */
export const printStatus = () => buildPacket(CMD.PrintStatus, [0x01]);

/** @returns {Uint8Array} */
export const printerStatusData = () => buildPacket(CMD.PrinterStatusData, [0x01]);

/** @returns {Uint8Array} */
export const printerInfo = (sub = 0x08) => buildPacket(CMD.PrinterInfo, [sub]);

/** @returns {Uint8Array} */
export const heartbeat = () => buildPacket(CMD.Heartbeat, [0x04]);

/**
 * SetPageSize.
 *
 * `cols` est la largeur de la **tête**, pas celle de l'étiquette : 96 pour un
 * D110 (12 mm), même avec une étiquette de 15 mm. L'imprimante rogne au-delà
 * sans renvoyer d'erreur.
 *
 * @param {'D110'|'B1'|'V4'} variant
 * @param {{ rows: number, cols: number, copies?: number }} options
 * @returns {Uint8Array}
 */
export function setPageSize(variant, options) {
  const [rowsHi, rowsLo] = u16be(options.rows);
  const [colsHi, colsLo] = u16be(options.cols);

  if (variant === 'B1') {
    const [copiesHi, copiesLo] = u16be(options.copies ?? 1);
    return buildPacket(CMD.SetPageSize, [rowsHi, rowsLo, colsHi, colsLo, copiesHi, copiesLo]);
  }
  if (variant === 'V4') {
    const [copiesHi, copiesLo] = u16be(options.copies ?? 1);
    return buildPacket(CMD.SetPageSize, [
      rowsHi, rowsLo, colsHi, colsLo, copiesHi, copiesLo,
      0, 0, 0, 0, 0, 0, 0,
    ]);
  }
  return buildPacket(CMD.SetPageSize, [rowsHi, rowsLo, colsHi, colsLo]);
}

/** @param {number} quantity @returns {Uint8Array} */
export const printQuantity = (quantity) => {
  const [hi, lo] = u16be(quantity);
  return buildPacket(CMD.PrintQuantity, [hi, lo]);
};

/**
 * Trame de ligne bitmap.
 *
 * @param {number} row Numéro de ligne (u16 BE).
 * @param {Uint8Array} bitmap `stride = ceil(cols/8)` octets, MSB d'abord, 1 = noir.
 * @param {{ run?: number, counts?: [number,number,number] }} [options]
 *   `run` est le nombre de répétitions de cette ligne (1 = une seule ligne).
 *   `counts` est le triplet de comptage de pixels noirs ; la valeur `00 00 00`
 *   est acceptée par tous les modèles connus et c'est ce qu'on envoie par défaut.
 * @returns {Uint8Array}
 */
export function printBitmapRow(row, bitmap, options = {}) {
  const [rowHi, rowLo] = u16be(row);
  const counts = options.counts ?? [0, 0, 0];
  const run = Math.max(1, Math.min(255, options.run ?? 1));

  const data = new Uint8Array(2 + 3 + 1 + bitmap.length);
  data[0] = rowHi;
  data[1] = rowLo;
  data[2] = counts[0] & 0xff;
  data[3] = counts[1] & 0xff;
  data[4] = counts[2] & 0xff;
  data[5] = run;
  data.set(bitmap, 6);

  return buildPacket(CMD.PrintBitmapRow, data);
}

/**
 * Trame de ligne vide — n'embarque aucun octet de pixels, ce qui allège
 * fortement les marges blanches d'une étiquette.
 *
 * @param {number} row
 * @param {number} [run]
 * @returns {Uint8Array}
 */
export function printEmptyRow(row, run = 1) {
  const [rowHi, rowLo] = u16be(row);
  return buildPacket(CMD.PrintEmptyRow, [rowHi, rowLo, Math.max(1, Math.min(255, run))]);
}

/**
 * Interprète une notification de statut d'impression (0xB3).
 *
 * On parse par longueur et non par offset fixe : la taille du payload varie
 * selon les modèles (10 octets sur M2-H, 11 sur B1 Pro).
 *
 * @param {Uint8Array} data
 * @returns {{ page: number, printProgress: number, feedProgress: number, error: number }}
 */
export function parsePrintStatus(data) {
  const page = data.length >= 2 ? (data[0] << 8) | data[1] : 0;
  return {
    page,
    printProgress: data.length >= 3 ? data[2] : 0,
    feedProgress: data.length >= 4 ? data[3] : 0,
    // Le champ d'erreur n'est présent que sur les payloads de 10 octets.
    error: data.length >= 10 ? data[9] : 0,
  };
}

/**
 * Interprète la réponse d'identité (0x48), qui porte le modelId.
 *
 * Certains firmwares renvoient un octet unique, d'autres deux. Un octet seul
 * vaut `octet << 8` (convention niimbluelib).
 *
 * @param {Uint8Array} data
 * @returns {{ modelId: number }}
 */
export function parsePrinterInfo(data) {
  if (data.length >= 2) return { modelId: (data[0] << 8) | data[1] };
  if (data.length === 1) return { modelId: data[0] << 8 };
  return { modelId: 0 };
}
