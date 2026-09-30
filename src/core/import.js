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
 * Le **nom et la note de la collection** sont relevés quand le fichier les
 * porte : l'archive JSON les met dans `collection`, le manifeste du dossier
 * d'étiquettes dans `title`. Un CSV n'en porte aucun — ses colonnes décrivent
 * des liens, pas l'ensemble — et rend donc une collection sans nom. C'est à
 * l'appelant de décider ce qu'il en fait : les reprendre pour remplacer la
 * collection affichée, nommer une collection nouvelle, ou les ignorer.
 *
 * Toutes les fonctions sont pures : aucune lecture disque, aucun DOM. C'est ce
 * qui les rend testables, et c'est aussi ce qui impose à l'appelant de fournir
 * le contenu du fichier.
 */

import { readStoredZip } from './zip.js';
import { createLink } from './link.js';
import { t } from './i18n.js';
import { COLLECTION_NAME_MAX, COLLECTION_NOTE_MAX } from './collections.js';

/** Formes d'archive reconnues. */
export const IMPORT_KINDS = Object.freeze(['links', 'labels', 'csv']);

/** Aucune collection décrite par le fichier : ni nom, ni note. */
const SANS_COLLECTION = Object.freeze({ name: '', note: '' });

/**
 * Nom et note de collection portés par un fichier relu.
 *
 * Deux emplacements, parce que l'application écrit les deux : l'archive de liens
 * range les métadonnées dans `collection`, le manifeste des étiquettes les met à
 * plat dans `title`. Un fichier écrit à la main qui porterait les deux est lu
 * dans l'ordre ci-dessous — la forme la plus explicite d'abord.
 *
 * Les valeurs sont nettoyées et bornées ici, comme elles le seraient à la
 * saisie : ce qui entre par un fichier ne doit pas pouvoir dépasser ce qu'un
 * champ accepte.
 *
 * @param {any} parsed
 * @returns {{ name: string, note: string }}
 */
function collectionFrom(parsed) {
  const source = parsed?.collection && typeof parsed.collection === 'object'
    ? parsed.collection
    : {};
  const nom = typeof source.name === 'string'
    ? source.name
    : (typeof parsed?.title === 'string' ? parsed.title : '');
  const note = typeof source.note === 'string' ? source.note : '';
  return {
    name: nom.trim().slice(0, COLLECTION_NAME_MAX),
    note: note.trim().slice(0, COLLECTION_NOTE_MAX),
  };
}

/**
 * Erreur d'import, avec un message qui dit ce qui était attendu.
 * @param {string} detail
 * @returns {TypeError}
 */
function unrecognised(detail) {
  return new TypeError(t(
    "{detail} Formats acceptés : l'archive JSON du bouton « Archive », le dossier d'étiquettes (.zip) ou son export.json, ou un CSV exporté d'ici.",
    { detail },
  ));
}

/**
 * Lit l'archive JSON complète, produite par `toJson`.
 *
 * @param {string} text
 * @returns {{ kind: string, records: object[], collection: { name: string, note: string } }}
 */
function fromJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw unrecognised(t('Fichier illisible : {message}.', { message: error.message }));
  }

  if (Array.isArray(parsed)) return { kind: 'links', records: parsed, collection: SANS_COLLECTION };

  // Archive de liens : le cas nominal.
  if (Array.isArray(parsed?.links)) {
    return { kind: 'links', records: parsed.links, collection: collectionFrom(parsed) };
  }

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
      // Le manifeste ne décrit pas une collection, mais les liens qu'il porte
      // en viennent : son `title` est celui de la collection au moment de
      // l'export, et c'est ce qui permet de la retrouver par son nom.
      collection: collectionFrom(parsed),
    };
  }

  const detail = parsed?.format
    ? t('Archive JSON sans liste de liens (format « {format} »)', { format: parsed.format })
    : t('Archive JSON sans liste de liens');
  throw unrecognised(detail + '.');
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
 * @returns {{ kind: string, records: object[], collection: { name: string, note: string } }}
 */
function fromCsv(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ''));
  if (rows.length < 2) {
    throw unrecognised(t('CSV sans ligne de données.'));
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
    throw unrecognised(t('CSV sans colonne « URL » (colonnes trouvées : {columns}).', {
      columns: rows[0].join(', '),
    }));
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
  // Un CSV ne décrit que des liens : ses colonnes ne portent ni nom ni note de
  // collection, et en inventer un serait pire que de n'en proposer aucun.
  return { kind: 'csv', records, collection: SANS_COLLECTION };
}

/**
 * Prépare les enregistrements à partir d'un fichier importé.
 *
 * `collection` dit ce que le fichier raconte de la collection dont il vient —
 * son nom, sa note. Vide quand il n'en dit rien, ce qui est le cas de tout CSV :
 * c'est à l'appelant d'en tenir compte, et non à cette fonction de décider ce
 * qu'on fait de la collection affichée.
 *
 * @param {{ text?: string, bytes?: Uint8Array, name?: string }} file
 * @returns {{ kind: string, records: object[], notes: string[],
 *   collection: { name: string, note: string } }}
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

