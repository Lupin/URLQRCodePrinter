/**
 * Relecture des archives exportées.
 *
 * L'import existait, mais il n'acceptait qu'une seule des trois formes que
 * l'application sait produire : l'archive JSON du bouton « Archive ». Ni le CSV,
 * ni le `export.json` du dossier d'étiquettes — ni, donc, le ZIP lui-même —
 * n'étaient relisibles. C'était le principal malentendu autour de l'import :
 * exporter puis réimporter ce qu'on venait d'exporter ne marchait pas.
 *
 * Ce module accepte les trois, en s'appuyant sur ce qu'on écrit :
 *
 * | Fichier | Ce qu'on en tire |
 * |---|---|
 * | archive JSON (« Archive ») | tout le modèle : titre, tags, note, raccourci |
 * | dossier d'étiquettes `.zip` | les liens de son `export.json` |
 * | `export.json` seul | les mêmes |
 * | CSV exporté | URL, titre, tags, note, date — la colonne « Domaine » est ignorée |
 *
 * Toutes les fonctions sont pures : aucune lecture disque, aucun DOM. C'est ce
 * qui les rend testables, et c'est aussi ce qui impose à l'appelant de fournir
 * le contenu du fichier.
 */

import { readStoredZip } from './zip.js';
import { createLink } from './link.js';

/** Formes d'archive reconnues. */
export const IMPORT_KINDS = Object.freeze(['links', 'labels', 'csv']);

/**
 * Erreur d'import, avec un message qui dit ce qui était attendu.
 * @param {string} detail
 * @returns {TypeError}
 */
function unrecognised(detail) {
  return new TypeError(
    `${detail} Formats acceptés : l'archive JSON du bouton « Archive », le ` +
    'dossier d\'étiquettes (.zip) ou son export.json, ou un CSV exporté d\'ici.',
  );
}

/**
 * Lit l'archive JSON complète, produite par `toJson`.
 *
 * @param {string} text
 * @returns {{ kind: string, records: object[] }}
 */
function fromJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw unrecognised(`Fichier illisible : ${error.message}.`);
  }

  if (Array.isArray(parsed)) return { kind: 'links', records: parsed };

  // Archive de liens : le cas nominal.
  if (Array.isArray(parsed?.links)) return { kind: 'links', records: parsed.links };

  // Manifeste du dossier d'étiquettes : `labels[].url` porte la destination
  // imprimée, et `originalUrl` l'adresse d'origine quand elle a été raccourcie.
  if (Array.isArray(parsed?.labels)) {
    return {
      kind: 'labels',
      records: parsed.labels
        .filter((label) => label && typeof label.url === 'string')
        .map((label) => {
          const shortened = typeof label.originalUrl === 'string' && label.originalUrl !== '';
          return {
            url: shortened ? label.originalUrl : label.url,
            title: typeof label.title === 'string' ? label.title : '',
            shortUrl: shortened ? label.url : '',
            shortProvider: shortened ? 'import' : '',
          };
        }),
    };
  }

  throw unrecognised(
    'Archive JSON sans liste de liens'
    + (parsed?.format ? ` (format « ${parsed.format} »)` : '')
    + '.',
  );
}

/**
 * Découpe un CSV en lignes de champs, en respectant les guillemets.
 *
 * Reprend les conventions de l'export : guillemets doublés à l'intérieur d'un
 * champ, séparateur `;` ou `,`, fin de ligne `CRLF` ou `LF`.
 *
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsvRows(text) {
  const body = text.replace(/^\uFEFF/, '');
  const firstLine = body.slice(0, body.indexOf('\n') === -1 ? body.length : body.indexOf('\n'));
  // Le séparateur se déduit de l'en-tête : les deux sont produits par l'export.
  const delimiter = (firstLine.match(/;/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length
    ? ';'
    : ',';

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < body.length; index++) {
    const char = body[index];

    if (quoted) {
      if (char === '"') {
        if (body[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Relit une date d'export (`JJ/MM/AAAA` ou `JJ/MM/AAAA HH:MM`).
 *
 * La date est locale, comme à l'export : la relire en UTC la décalerait d'un
 * jour selon le fuseau.
 *
 * @param {string} value
 * @returns {number} epoch ms, ou 0 si la date n'est pas reconnue.
 */
export function parseExportedDate(value) {
  const match = String(value ?? '').trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?$/);
  if (!match) return 0;
  const [, day, month, year, hour, minute] = match;
  const date = new Date(
    Number(year), Number(month) - 1, Number(day),
    Number(hour ?? 0), Number(minute ?? 0),
  );
  if (!Number.isFinite(date.getTime())) return 0;

  // `new Date(2026, 12, 32)` ne refuse rien : il reporte au 1er février 2027.
  // On vérifie donc que la date construite est bien celle qui était écrite,
  // sans quoi une date impossible entrerait dans la collection sous une autre.
  if (date.getFullYear() !== Number(year)
    || date.getMonth() !== Number(month) - 1
    || date.getDate() !== Number(day)
    || date.getHours() !== Number(hour ?? 0)
    || date.getMinutes() !== Number(minute ?? 0)) {
    return 0;
  }
  return date.getTime();
}

/**
 * Relit un CSV produit par l'export.
 *
 * Les colonnes sont repérées par leur en-tête, pas par leur position : un
 * tableur qui réordonne les colonnes reste importable, et les colonnes
 * facultatives (« Note », « URL courte ») sont prises quand elles sont là.
 *
 * @param {string} text
 * @returns {{ kind: string, records: object[] }}
 */
function fromCsv(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ''));
  if (rows.length < 2) {
    throw unrecognised('CSV sans ligne de données.');
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const column = (...names) => {
    for (const name of names) {
      const index = headers.indexOf(name);
      if (index !== -1) return index;
    }
    return -1;
  };

  const urlColumn = column('url', 'adresse', 'lien');
  if (urlColumn === -1) {
    throw unrecognised(`CSV sans colonne « URL » (colonnes trouvées : ${rows[0].join(', ')}).`);
  }

  const titleColumn = column('titre', 'title');
  const tagColumn = column('tags', 'étiquettes', 'etiquettes');
  const noteColumn = column('note', 'notes');
  const dateColumn = column('ajouté le', 'ajoute le', 'date');
  const shortColumn = column('url courte');

  const records = [];
  for (const row of rows.slice(1)) {
    const url = (row[urlColumn] ?? '').trim();
    if (url === '') continue;

    const record = { url };
    if (titleColumn !== -1) record.title = (row[titleColumn] ?? '').trim();
    if (noteColumn !== -1) record.note = (row[noteColumn] ?? '').trim();
    if (tagColumn !== -1) {
      // L'export sépare les tags par des espaces ; on accepte aussi les
      // virgules et les « # », par symétrie avec la saisie.
      record.tags = (row[tagColumn] ?? '')
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#+/, ''))
        .filter((tag) => tag !== '');
    }
    if (shortColumn !== -1) record.shortUrl = (row[shortColumn] ?? '').trim();

    const createdAt = dateColumn === -1 ? 0 : parseExportedDate(row[dateColumn]);
    if (createdAt > 0) record.createdAt = createdAt;

    records.push(record);
  }

  if (records.length === 0) throw unrecognised('CSV sans URL exploitable.');
  return { kind: 'csv', records };
}

/**
 * Prépare les enregistrements à partir d'un fichier importé.
 *
 * @param {{ text?: string, bytes?: Uint8Array, name?: string }} file
 * @returns {{ kind: string, records: object[], notes: string[] }}
 * @throws {TypeError} si le fichier n'est pas une archive reconnue.
 */
export function parseImportFile(file) {
  const name = String(file?.name ?? '').toLowerCase();
  const notes = [];

  if (file?.bytes) {
    // Un ZIP : on cherche le manifeste, qui porte le titre et l'URL d'origine.
    let entries;
    try {
      entries = readStoredZip(file.bytes);
    } catch (error) {
      throw unrecognised(error.message);
    }

    const manifest = entries.get('export.json');
    if (!manifest) {
      throw unrecognised(
        `Archive ZIP sans « export.json » (entrées : ${[...entries.keys()].join(', ')}).`,
      );
    }
    const parsed = fromJson(new TextDecoder().decode(manifest));
    notes.push(`${entries.size} fichier(s) dans l'archive, manifeste « export.json » lu.`);
    return { ...parsed, notes };
  }

  const text = String(file?.text ?? '');
  const trimmed = text.replace(/^\uFEFF/, '').trimStart();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { ...fromJson(text), notes };
  }
  if (name.endsWith('.csv') || trimmed.includes(';') || trimmed.includes(',')) {
    return { ...fromCsv(text), notes };
  }

  throw unrecognised(
    name ? `« ${name} » n'est pas un format reconnu.` : "Ce fichier n'est pas un format reconnu.",
  );
}

/**
 * Convertit des enregistrements bruts en liens valides, en écartant les autres.
 *
 * Un enregistrement refusé ne doit pas faire échouer tout l'import : il est
 * compté et signalé, comme les doublons.
 *
 * @param {object[]} records
 * @param {{ now?: number }} [options]
 * @returns {{ links: object[], rejected: number }}
 */
export function toImportableLinks(records, options = {}) {
  const links = [];
  let rejected = 0;

  for (const record of records) {
    try {
      links.push(createLink({ ...record, source: 'import' }, options));
    } catch {
      rejected += 1;
    }
  }
  return { links, rejected };
}

