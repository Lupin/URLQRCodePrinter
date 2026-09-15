/**
 * Écriture de fichiers ZIP, sans dépendance.
 *
 * Un `.xlsx` n'est rien d'autre qu'une archive ZIP de fichiers XML. Plutôt que
 * d'embarquer une bibliothèque pour cela, on écrit l'archive nous-mêmes.
 *
 * Les entrées sont stockées **sans compression** (`method: 0`). C'est un choix
 * délibéré : les images PNG qu'on y place sont déjà compressées, et les parties
 * XML sont minuscules. Cela évite d'avoir à implémenter un compresseur, et
 * reste parfaitement conforme — Excel, Numbers et LibreOffice ouvrent sans
 * difficulté une archive non compressée.
 */

import { crc32 } from './png.js';

/**
 * Convertit une date en couple (heure, date) au format MS-DOS, tel qu'attendu
 * par l'en-tête ZIP.
 *
 * @param {Date} date
 * @returns {{ time: number, date: number }}
 */
function dosStamp(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/**
 * Encode une chaîne en octets ASCII.
 * @param {string} text
 * @returns {Uint8Array}
 */
function ascii(text) {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) {
      throw new RangeError(`nom de fichier non ASCII : ${text}`);
    }
    out[i] = code;
  }
  return out;
}

/**
 * Assemble une archive ZIP.
 *
 * @param {Array<{ name: string, data: Uint8Array|string }>} entries
 * @param {{ date?: Date }} [options]
 * @returns {Uint8Array}
 */
export function createZip(entries, options = {}) {
  const date = options.date ?? new Date();
  const stamp = dosStamp(date);

  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const name = ascii(entry.name);
    const data = typeof entry.data === 'string'
      ? new TextEncoder().encode(entry.data)
      : entry.data;
    const checksum = crc32(data);

    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); // signature d'en-tête local
    localView.setUint16(4, 20, true); // version nécessaire
    localView.setUint16(6, 0, true); // drapeaux
    localView.setUint16(8, 0, true); // méthode : stockage
    localView.setUint16(10, stamp.time, true);
    localView.setUint16(12, stamp.date, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true); // taille compressée
    localView.setUint32(22, data.length, true); // taille réelle
    localView.setUint16(26, name.length, true);
    localView.setUint16(28, 0, true); // champ supplémentaire
    local.set(name, 30);
    local.set(data, 30 + name.length);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); // signature du répertoire central
    centralView.setUint16(4, 20, true); // version de création
    centralView.setUint16(6, 20, true); // version nécessaire
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, stamp.time, true);
    centralView.setUint16(14, stamp.date, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint16(30, 0, true); // extra
    centralView.setUint16(32, 0, true); // commentaire
    centralView.setUint16(34, 0, true); // disque de départ
    centralView.setUint16(36, 0, true); // attributs internes
    centralView.setUint32(38, 0, true); // attributs externes
    centralView.setUint32(42, offset, true); // position de l'en-tête local
    central.set(name, 46);

    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); // signature de fin de répertoire
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  const total = offset + centralSize + end.length;
  const zip = new Uint8Array(total);
  let cursor = 0;
  for (const part of [...locals, ...centrals, end]) {
    zip.set(part, cursor);
    cursor += part.length;
  }
  return zip;
}

/**
 * Relit une archive ZIP dont les entrées sont stockées sans compression.
 *
 * On lit ce qu'on écrit : nos archives — dossiers d'étiquettes et classeurs —
 * sont toutes en `method: 0`. Un lecteur complet demanderait un décompresseur,
 * dont on n'a pas besoin ici ; une entrée compressée est donc signalée comme
 * telle plutôt que rendue de travers.
 *
 * La lecture se fait sur les en-têtes locaux, en parcourant l'archive : c'est
 * suffisant pour un fichier qu'on vient de produire, et cela évite de gérer le
 * répertoire central.
 *
 * @param {Uint8Array} bytes
 * @returns {Map<string, Uint8Array>} contenu indexé par nom d'entrée.
 * @throws {TypeError} si l'archive est illisible, ou contient une entrée compressée.
 */
export function readStoredZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = new Map();
  let offset = 0;

  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extraLength;

    if (method !== 0) {
      throw new TypeError(
        `Entrée compressée dans l'archive (${name}) : seules les archives ` +
        'produites par cette application sont relisables.',
      );
    }
    if (start + size > bytes.length) {
      throw new TypeError(`Archive tronquée : l'entrée « ${name} » dépasse la fin du fichier.`);
    }

    entries.set(name, bytes.subarray(start, start + size));
    offset = start + size;
  }

  if (entries.size === 0) {
    throw new TypeError(
      "Cette archive ne contient aucune entrée lisible. Attendu : un ZIP produit " +
      "par l'application (dossier d'étiquettes).",
    );
  }
  return entries;
}
