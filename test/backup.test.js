/**
 * La sauvegarde complète : toutes les collections dans un seul fichier.
 *
 * L'archive d'une collection ne suffit pas à changer de machine : il faudrait
 * rouvrir chaque collection et télécharger autant de fichiers. Ce module écrit
 * le document qui les porte toutes, et le relit. Ce qui est éprouvé ici :
 *
 * - l'aller-retour **fidèle** — nom, note, premier numéro, rang, date, active,
 *   et tous les champs d'un lien ;
 * - la collection de navigation privée, qui n'entre **jamais** dans le fichier ;
 * - la relecture d'une entrée non fiable : version, plafonds, URL illisible,
 *   identifiant dupliqué, doublon d'URL ;
 * - la reconnaissance du fichier par l'import, qui ne doit pas l'aplatir en une
 *   archive d'une seule collection.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BACKUP_FORMAT,
  BACKUP_MAX_COLLECTIONS,
  BACKUP_MAX_LINKS,
  BACKUP_VERSION,
  BackupError,
  backupFilename,
  buildBackup,
  isBackupDocument,
  parseBackup,
  toBackupJson,
} from '../src/core/backup.js';
import { parseImportFile } from '../src/core/import.js';

const NOW = new Date(2026, 10, 24, 13, 30).getTime();

/** Une collection telle que le magasin la rend. */
function collection(id, name, extra = {}) {
  return { id, name, note: '', startIndex: 1, createdAt: 0, ...extra };
}

/** Un lien complet, rangé dans la collection demandée. */
function lien(id, url, collectionId, extra = {}) {
  return {
    id,
    url,
    title: `Titre ${id}`,
    note: '',
    tags: [],
    createdAt: NOW - 1000,
    updatedAt: NOW - 500,
    source: 'manual',
    favicon: '',
    shortUrl: '',
    shortProvider: '',
    shortenedAt: 0,
    ...(collectionId ? { collectionId } : {}),
    ...extra,
  };
}

/** Le cas nominal : deux collections, trois liens. */
function sauvegarde(options = {}) {
  return {
    now: NOW,
    collections: [
      collection('default', ''),
      collection('veille', 'Veille', {
        note: 'mes lectures', startIndex: 101, createdAt: 20, order: 1,
      }),
    ],
    links: [
      lien('l1', 'https://exemple.fr/un', 'default'),
      lien('l2', 'https://exemple.fr/deux', 'veille', {
        tags: ['veille', 'travail'],
        note: 'à relire',
        order: 0,
        useShort: true,
        shortUrl: 'https://tinyurl.com/abc',
        shortProvider: 'tinyurl',
        shortenedAt: NOW - 2000,
      }),
      lien('l3', 'https://exemple.fr/trois', 'veille'),
    ],
    activeCollectionId: 'veille',
    ...options,
  };
}

// ---------------------------------------------------------------------------
// Le document
// ---------------------------------------------------------------------------

test('la sauvegarde porte toutes les collections et tous leurs liens', () => {
  const document = buildBackup(sauvegarde());

  assert.equal(document.format, BACKUP_FORMAT);
  assert.equal(document.version, BACKUP_VERSION);
  assert.equal(document.activeCollectionId, 'veille');
  assert.deepEqual(document.counts, { collections: 2, links: 3 });
  assert.equal(document.collections.length, 2);
  assert.equal(document.links.length, 3);
  assert.match(document.exportedAt, /^\d{4}-\d{2}-\d{2}T/);

  // Chaque lien porte la collection à laquelle il appartient : c'est ce qui
  // permet de le ranger sans nommer les collections par leur position.
  assert.equal(document.links.find((link) => link.id === 'l1').collectionId, 'default');
  assert.equal(document.links.find((link) => link.id === 'l2').collectionId, 'veille');
});

test('les métadonnées de collection survivent à l\'aller-retour', () => {
  const relu = parseBackup(JSON.parse(toBackupJson(sauvegarde())), { now: NOW });

  const veille = relu.collections.find((item) => item.id === 'veille');
  assert.ok(veille);
  assert.equal(veille.name, 'Veille');
  assert.equal(veille.note, 'mes lectures');
  assert.equal(veille.startIndex, 101, 'le premier numéro appartient à la collection');
  assert.equal(veille.createdAt, 20);
  assert.equal(veille.order, 1);

  // Un nom vide est un état de plein droit, pas une absence : il doit revenir
  // vide, et non sous le libellé « Mes liens » que l'affichage lui prête.
  assert.equal(relu.collections.find((item) => item.id === 'default').name, '');
  assert.equal(relu.activeCollectionId, 'veille');
});

test('tous les champs d\'un lien sont conservés', () => {
  const relu = parseBackup(JSON.parse(toBackupJson(sauvegarde())), { now: NOW });
  const l2 = relu.links.find((link) => link.id === 'l2');

  assert.equal(l2.url, 'https://exemple.fr/deux');
  assert.equal(l2.title, 'Titre l2');
  assert.equal(l2.note, 'à relire');
  assert.deepEqual(l2.tags, ['veille', 'travail']);
  assert.equal(l2.createdAt, NOW - 1000, 'la date de collecte survit');
  assert.equal(l2.order, 0, 'le rang manuel survit');
  assert.equal(l2.useShort, true, 'le choix de raccourci survit');
  assert.equal(l2.shortUrl, 'https://tinyurl.com/abc');
  assert.equal(l2.shortProvider, 'tinyurl');
  assert.equal(l2.shortenedAt, NOW - 2000);
});

test('la sauvegarde ne contient aucune collection de navigation privée', () => {
  // Le constructeur les écarte lui-même : aucun appelant ne doit avoir à y
  // penser, sans quoi un oubli écrirait des URL privées sur le disque.
  const document = buildBackup({
    now: NOW,
    collections: [
      collection('default', ''),
      collection('private', 'Navigation privée'),
    ],
    links: [
      lien('l1', 'https://exemple.fr/un', 'default'),
      lien('p1', 'https://exemple.fr/prive', 'private'),
    ],
  });

  assert.deepEqual(document.collections.map((item) => item.id), ['default']);
  assert.deepEqual(document.links.map((link) => link.id), ['l1']);
  assert.doesNotMatch(JSON.stringify(document), /prive/, 'aucune trace du lien privé');
});

test('un lien d\'une collection absente n\'est pas perdu', () => {
  // Une suppression de collection emporte ses liens, donc le cas ne devrait pas
  // arriver. Mais une sauvegarde qui laisserait des liens sans collection ne
  // les restituerait pas : une collection sans nom les recueille.
  const document = buildBackup({
    now: NOW,
    collections: [collection('default', '')],
    links: [lien('orphan', 'https://exemple.fr/orphelin', 'disparue')],
  });

  assert.equal(document.collections.length, 2);
  assert.ok(document.collections.some((item) => item.id === 'disparue'));
  assert.equal(document.links[0].collectionId, 'disparue');
});

test('un tableau vide décrit la collection par défaut', () => {
  const document = buildBackup({ now: NOW, collections: [], links: [] });
  assert.equal(document.collections.length, 1);
  assert.equal(document.collections[0].id, 'default');
  assert.equal(document.counts.collections, 1);
  assert.equal(document.counts.links, 0);
});

// ---------------------------------------------------------------------------
// La relecture
// ---------------------------------------------------------------------------

/** Une sauvegarde minimale valide, sérialisée puis relue. */
function relire(modifie = {}) {
  const base = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date(NOW).toISOString(),
    collections: [collection('default', '')],
    links: [lien('l1', 'https://exemple.fr/un', 'default')],
    activeCollectionId: 'default',
    ...modifie,
  };
  return parseBackup(base, { now: NOW });
}

test('un fichier d\'une autre nature est refusé', () => {
  assert.throws(() => relire({ format: 'url-qr-code-printer/links' }), (error) => {
    assert.ok(error instanceof BackupError);
    assert.equal(error.code, 'format');
    return true;
  });
  assert.equal(isBackupDocument({ format: 'url-qr-code-printer/links' }), false);
  assert.equal(isBackupDocument(null), false);
  assert.equal(isBackupDocument([]), false);
});

test('une sauvegarde d\'une version plus récente est refusée, avec le mode d\'emploi', () => {
  assert.throws(() => relire({ version: BACKUP_VERSION + 1 }), (error) => {
    assert.equal(error.code, 'version');
    assert.match(error.message, /mettez l'application à jour/);
    return true;
  });
  assert.throws(() => relire({ version: undefined }), (error) => {
    assert.equal(error.code, 'version');
    return true;
  });
});

test('une sauvegarde vide est refusée', () => {
  assert.throws(
    () => parseBackup({
      format: BACKUP_FORMAT, version: 1, collections: [], links: [],
    }, { now: NOW }),
    (error) => {
      assert.equal(error.code, 'empty');
      return true;
    },
  );
});

test('les plafonds de relecture protègent le stockage', () => {
  // Une entrée de collection illisible est écartée ; ce qui compte ici est la
  // borne, avant tout traitement.
  assert.throws(
    () => parseBackup({
      format: BACKUP_FORMAT,
      version: 1,
      collections: Array.from({ length: BACKUP_MAX_COLLECTIONS + 1 }, (_, index) => (
        collection(`c${index}`, `C${index}`)
      )),
      links: [],
    }, { now: NOW }),
    (error) => {
      assert.equal(error.code, 'too-many-collections');
      return true;
    },
  );

  assert.throws(
    () => parseBackup({
      format: BACKUP_FORMAT,
      version: 1,
      collections: [collection('default', '')],
      links: Array.from({ length: BACKUP_MAX_LINKS + 1 }, (_, index) => (
        lien(`l${index}`, `https://exemple.fr/${index}`, 'default')
      )),
    }, { now: NOW }),
    (error) => {
      assert.equal(error.code, 'too-many-links');
      return true;
    },
  );
});

test('un lien illisible est compté, sans faire échouer le reste', () => {
  const relu = relire({
    links: [
      lien('l1', 'https://exemple.fr/un', 'default'),
      { id: 'mauvais', url: 'javascript:alert(1)', collectionId: 'default' },
    ],
  });

  assert.deepEqual(relu.links.map((link) => link.id), ['l1']);
  assert.equal(relu.rejected, 1);
});

test('un identifiant dupliqué est régénéré, jamais écrit deux fois', () => {
  // Deux enregistrements de même identifiant ne peuvent pas coexister dans un
  // magasin indexé par identifiant : le second écraserait le premier.
  const relu = relire({
    links: [
      lien('pareil', 'https://exemple.fr/un', 'default'),
      lien('pareil', 'https://exemple.fr/deux', 'default'),
    ],
  });

  assert.equal(relu.links.length, 2);
  const ids = new Set(relu.links.map((link) => link.id));
  assert.equal(ids.size, 2);
  assert.ok(ids.has('pareil'), 'le premier garde son identifiant');
});

test('une URL en double dans la même collection est ignorée et comptée', () => {
  const relu = relire({
    links: [
      lien('l1', 'https://exemple.fr/un', 'default'),
      lien('l2', 'https://exemple.fr/un', 'default'),
    ],
  });

  assert.deepEqual(relu.links.map((link) => link.id), ['l1']);
  assert.equal(relu.duplicates, 1);
});

test('un lien d\'une collection privée est rattaché à une collection ordinaire', () => {
  // Un fichier retouché à la main pourrait nommer la collection privée. Elle
  // n'est jamais créée à la relecture : ses liens rejoignent la première.
  const relu = relire({
    links: [lien('p1', 'https://exemple.fr/prive', 'private')],
  });

  assert.equal(relu.collections.some((item) => item.id === 'private'), false);
  assert.equal(relu.links[0].collectionId, 'default');
});

test('une collection courante inconnue retombe sur la première', () => {
  const relu = relire({ activeCollectionId: 'disparue' });
  assert.equal(relu.activeCollectionId, 'default');
});

test('un fichier de sauvegarde est reconnu par l\'import, sans être aplati', () => {
  const text = toBackupJson(sauvegarde());
  const parsed = parseImportFile({ name: 'sauvegarde.json', text }, { now: NOW });

  assert.equal(parsed.kind, 'backup');
  assert.equal(parsed.backup.collections.length, 2);
  assert.equal(parsed.backup.links.length, 3);
  // `records` reste vide : c'est l'application qui décide du rangement, et
  // l'aplatir ici en une liste de liens perdrait les collections.
  assert.deepEqual(parsed.records, []);
});

// ---------------------------------------------------------------------------
// Le nom de fichier
// ---------------------------------------------------------------------------

test('le nom de fichier est horodaté et sans caractère interdit', () => {
  const nom = backupFilename(NOW);
  assert.match(nom, /^sauvegarde-complete-\d{8}-\d{4}\.json$/);
  // Deux exports à une minute d'écart ne s'écrasent pas.
  assert.notEqual(nom, backupFilename(NOW + 60_000));
});
