/**
 * Sauvegarde complète : toutes les collections dans un seul fichier.
 *
 * L'export « Archive » décrit **une** collection. Il ne répond donc pas au geste
 * qui consiste à changer de machine — ou à se prémunir d'une perte —, parce
 * qu'il faudrait rouvrir chaque collection et télécharger autant de fichiers.
 * Ce module écrit le document qui les porte toutes, liens compris, et sait le
 * relire.
 *
 * Quatre décisions structurent le format :
 *
 * - **Un seul fichier, autoportant.** Collections et liens voyagent ensemble :
 *   les métadonnées de chaque collection — nom, note, premier numéro, rang,
 *   date — sont dans le document, et chaque lien porte la collection à laquelle
 *   il appartient. Un fichier de sauvegarde se suffit donc à lui-même, sans
 *   avoir à nommer les collections par leur position.
 * - **La collection de navigation privée n'y entre jamais.** Ses liens vivent
 *   dans `chrome.storage.session`, et le projet promet qu'aucun chemin de code
 *   n'écrit une URL privée sur le disque (`README.fr.md`). Le constructeur
 *   écarte donc explicitement cette collection et ses liens — il ne compte pas
 *   sur l'appelant pour ne pas les lui passer.
 * - **Le fichier relu est une entrée non fiable.** Toutes les valeurs passent
 *   par les constructeurs du modèle (`createCollection`, `createLink`), les
 *   tailles sont plafonnées, les identifiants dupliqués sont régénérés et un
 *   lien illisible est compté plutôt que de faire échouer le reste. Un fichier
 *   de sauvegarde peut venir d'une autre machine, d'une version différente, ou
 *   avoir été retouché à la main.
 * - **La version du format est explicite.** Une sauvegarde d'une version plus
 *   récente est refusée avec un message qui dit quoi faire, plutôt que lue de
 *   travers. Une version antérieure n'existe pas encore — l'import des archives
 *   d'une seule collection garde son propre chemin (`import.js`).
 *
 * Les fonctions sont pures : elles reçoivent les collections et les liens, et
 * rendent un objet ou une chaîne. Ni stockage ni DOM, donc testables sans
 * navigateur, comme `exporters.js` et `import.js`.
 */

import { createLink, newId } from './link.js';
import { t } from './i18n.js';
import {
  COLLECTIONS_VERSION,
  DEFAULT_COLLECTION_ID,
  PRIVATE_COLLECTION_ID,
  collectionOf,
  createCollection,
  sanitizeCollections,
} from './collections.js';
import { exportFilename } from './exporters.js';

/**
 * Marque du format, dans le fichier.
 *
 * Elle est distincte de celles des archives d'une seule collection
 * (`url-qr-code-printer/links`) : c'est elle qui décide si un fichier est une
 * sauvegarde complète ou une archive ordinaire, et l'import les traite
 * différemment.
 */
export const BACKUP_FORMAT = 'url-qr-code-printer/backup';

/**
 * Version du document écrit. À incrémenter si sa forme change.
 *
 * Le lecteur n'accepte pas une version supérieure : une sauvegarde écrite par
 * une application plus récente peut porter des champs que celle-ci ne
 * comprendrait pas, et une lecture partielle vaudrait moins qu'un refus qui dit
 * quoi faire.
 */
export const BACKUP_VERSION = 1;

/**
 * Plafonds de lecture.
 *
 * Ils ne bornent pas l'écriture — une sauvegarde doit pouvoir contenir ce que
 * l'utilisateur a réellement. Ils bornent la **relecture** d'un fichier venu
 * d'ailleurs : au-delà, le fichier ne peut pas venir d'une collection que le
 * produit aurait laissé croître, et l'accepter reviendrait à remplir le stockage
 * d'un coup. Le stockage local est lui-même plafonné à 10 Mo.
 */
export const BACKUP_MAX_LINKS = 20000;
export const BACKUP_MAX_COLLECTIONS = 500;

/** Base du nom de fichier proposé au téléchargement. */
export const BACKUP_FILENAME_BASE = 'sauvegarde-complete';

/**
 * Erreur de sauvegarde, avec un code exploitable.
 *
 * Codes : `invalid` (objet illisible), `format` (ce n'est pas une sauvegarde),
 * `version` (version absente ou trop récente), `empty` (rien à restaurer),
 * `too-many-links`, `too-many-collections`.
 *
 * Hérite de `TypeError`, comme les erreurs d'import : l'appelant qui attrape
 * déjà celles de la relecture de fichier n'a rien à changer.
 */
export class BackupError extends TypeError {
  /**
   * @param {string} message
   * @param {string} code
   */
  constructor(message, code) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
  }
}

/**
 * Ce document est-il une sauvegarde complète ?
 *
 * Le test est volontairement pauvre : il ne regarde que la marque. C'est
 * `parseBackup` qui valide le reste, et une valeur qui porte la marque mais pas
 * la forme voulue doit être refusée avec son propre message plutôt que traitée
 * comme une archive ordinaire.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBackupDocument(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && value.format === BACKUP_FORMAT;
}

/**
 * Copie un lien pour la sauvegarde, estampillé de sa collection.
 *
 * Le lien passe par `createLink` : c'est le constructeur du modèle, et il
 * normalise l'URL, les tags et les champs facultatifs. On lui rend ensuite sa
 * date de modification d'origine — une sauvegarde conserve ce qui existait, et
 * `createLink` estampille l'instant de l'appel. Le rang et le choix de raccourci
 * sont facultatifs, et leur absence reste une absence.
 *
 * @param {import('./link.js').LinkRecord} link
 * @param {string} collectionId
 * @param {number} now
 * @returns {object}
 */
function backupLink(link, collectionId, now) {
  const copie = createLink(link, { now });
  return {
    ...copie,
    updatedAt: Number.isFinite(link.updatedAt) ? link.updatedAt : copie.updatedAt,
    collectionId,
  };
}

/**
 * Construit le document de sauvegarde.
 *
 * Les collections sont assainies par `sanitizeCollections` — qui garantit qu'il
 * en reste au moins une et écarte la collection privée — puis les liens sont
 * rangés sous leur collection. Un lien qui désigne une collection absente du
 * document n'est pas perdu : une collection sans nom est ajoutée pour lui. Ce
 * cas ne devrait pas arriver avec des données saines (une suppression de
 * collection emporte ses liens), mais une sauvegarde qui laisserait des liens
 * sans collection ne restituerait rien pour eux.
 *
 * @param {{
 *   collections?: Array<object>,
 *   links?: Array<object>,
 *   activeCollectionId?: string,
 *   now?: number,
 * }} [input]
 * @returns {{
 *   format: string, version: number, exportedAt: string, app: string,
 *   activeCollectionId: string,
 *   counts: { collections: number, links: number },
 *   collections: Array<object>, links: Array<object>,
 * }}
 */
export function buildBackup(input = {}) {
  const now = Number.isFinite(input.now) ? input.now : Date.now();
  const document = sanitizeCollections({
    version: COLLECTIONS_VERSION,
    items: Array.isArray(input.collections) ? input.collections : [],
  });

  const items = document.items.map((collection) => ({ ...collection }));
  const connues = new Set(items.map((collection) => collection.id));

  const links = [];
  for (const link of Array.isArray(input.links) ? input.links : []) {
    if (!link || typeof link !== 'object') continue;
    const collectionId = collectionOf(link);
    // La collection privée n'est jamais écrite : ni elle, ni ses liens. Le test
    // est ici, dans le constructeur, pour qu'aucun appelant ne puisse l'oublier.
    if (collectionId === PRIVATE_COLLECTION_ID) continue;
    if (!connues.has(collectionId)) {
      connues.add(collectionId);
      items.push(createCollection({ id: collectionId, createdAt: now }));
    }
    links.push(backupLink(link, collectionId, now));
  }

  const activeCollectionId = connues.has(input.activeCollectionId)
    ? input.activeCollectionId
    : items[0].id;

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date(now).toISOString(),
    app: 'url-qr-code-printer',
    activeCollectionId,
    counts: { collections: items.length, links: links.length },
    collections: items,
    links,
  };
}

/**
 * Sérialise une sauvegarde en JSON indenté.
 *
 * Le fichier est écrit pour être relu, et pour être lisible à la main si
 * quelqu'un veut vérifier ce qu'il contient avant de le confier à une autre
 * machine : deux espaces par niveau, comme l'archive d'une collection.
 *
 * @param {Parameters<typeof buildBackup>[0]} [input]
 * @returns {string}
 */
export function toBackupJson(input = {}) {
  return JSON.stringify(buildBackup(input), null, 2);
}

/**
 * Relit une sauvegarde, et la rend normalisée.
 *
 * Ce qui est accepté, et ce qui est écarté :
 *
 * - la marque et la version d'abord ; une version plus récente est refusée ;
 * - les collections passent par `sanitizeCollections`, qui applique les bornes
 *   de nom et de note et garantit qu'il en reste une ;
 * - chaque lien passe par `createLink` ; un lien que le modèle refuse — une URL
 *   qui n'en est pas une, par exemple — est compté dans `rejected` et n'arrête
 *   pas le reste ;
 * - un identifiant déjà vu est régénéré : deux liens qui prétendraient au même
 *   identifiant ne peuvent pas coexister dans un magasin indexé par identifiant ;
 * - une URL en double **dans une même collection** est ignorée et comptée,
 *   puisque le produit n'admet pas deux fois la même adresse au même endroit ;
 * - un lien dont la collection n'existe pas — ou qui vise la collection privée,
 *   qu'un fichier retouché pourrait nommer — est rattaché à la première
 *   collection du document.
 *
 * `now` sert aux liens qui ne portent pas de date : c'est l'instant de la
 * relecture, comme pour l'import d'une archive. Il est injectable pour que les
 * tests n'aient pas à dépendre de l'horloge.
 *
 * @param {unknown} value
 * @param {{ now?: number }} [options]
 * @returns {{
 *   format: string, version: number, exportedAt: string,
 *   collections: Array<object>, links: Array<object>,
 *   activeCollectionId: string, rejected: number, duplicates: number,
 * }}
 * @throws {BackupError}
 */
export function parseBackup(value, options = {}) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BackupError(t('Fichier de sauvegarde illisible.'), 'invalid');
  }
  if (!isBackupDocument(value)) {
    throw new BackupError(t('Ce fichier n\'est pas une sauvegarde complète.'), 'format');
  }

  const version = Number(value.version);
  if (!Number.isInteger(version) || version < 1) {
    throw new BackupError(t('Sauvegarde sans numéro de version lisible.'), 'version');
  }
  if (version > BACKUP_VERSION) {
    throw new BackupError(t(
      'Sauvegarde d\'une version plus récente ({version}) : mettez l\'application à jour.',
      { version },
    ), 'version');
  }

  const rawCollections = Array.isArray(value.collections) ? value.collections : [];
  const rawLinks = Array.isArray(value.links) ? value.links : [];
  if (rawCollections.length === 0 && rawLinks.length === 0) {
    throw new BackupError(t('Cette sauvegarde ne contient aucune collection ni aucun lien.'), 'empty');
  }
  if (rawCollections.length > BACKUP_MAX_COLLECTIONS) {
    throw new BackupError(t(
      'Cette sauvegarde porte {count} collections, au-delà du plafond de {max}.',
      { count: rawCollections.length, max: BACKUP_MAX_COLLECTIONS },
    ), 'too-many-collections');
  }
  if (rawLinks.length > BACKUP_MAX_LINKS) {
    throw new BackupError(t(
      'Cette sauvegarde porte {count} liens, au-delà du plafond de {max}.',
      { count: rawLinks.length, max: BACKUP_MAX_LINKS },
    ), 'too-many-links');
  }

  const document = sanitizeCollections({ version: COLLECTIONS_VERSION, items: rawCollections });
  const collections = document.items.map((collection) => ({ ...collection }));
  const connues = new Set(collections.map((collection) => collection.id));
  const repli = connues.has(DEFAULT_COLLECTION_ID) ? DEFAULT_COLLECTION_ID : collections[0].id;

  const ids = new Set();
  const urls = new Set();
  const links = [];
  let rejected = 0;
  let duplicates = 0;

  for (const raw of rawLinks) {
    let link;
    try {
      link = createLink(raw, { now });
    } catch {
      rejected += 1;
      continue;
    }

    const demandee = collectionOf(link);
    const collectionId = demandee === PRIVATE_COLLECTION_ID || !connues.has(demandee)
      ? repli
      : demandee;

    // Un identifiant dupliqué écraserait un enregistrement dans un magasin
    // indexé par identifiant, ou en laisserait deux dans un tableau : on en
    // donne un neuf au second, sans toucher au premier.
    if (ids.has(link.id)) link = { ...link, id: newId() };
    ids.add(link.id);

    const cle = `${collectionId}\n${link.url}`;
    if (urls.has(cle)) {
      duplicates += 1;
      continue;
    }
    urls.add(cle);
    links.push({ ...link, collectionId });
  }

  const activeCollectionId = typeof value.activeCollectionId === 'string'
    && connues.has(value.activeCollectionId)
    ? value.activeCollectionId
    : collections[0].id;

  return {
    format: BACKUP_FORMAT,
    version,
    exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : '',
    collections,
    links,
    activeCollectionId,
    rejected,
    duplicates,
  };
}

/**
 * Nom de fichier d'une sauvegarde, horodaté.
 *
 * Même convention que les autres exports (`exportFilename`) : un nom sans
 * caractère interdit pour un système de fichiers, et la date de l'export pour ne
 * pas écraser la sauvegarde de la veille.
 *
 * @param {number} [now]
 * @returns {string}
 */
export function backupFilename(now = Date.now()) {
  return exportFilename(BACKUP_FILENAME_BASE, 'json', now);
}
