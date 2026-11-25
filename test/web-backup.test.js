/**
 * La sauvegarde complète, exécutée pour de vrai.
 *
 * L'archive d'une collection ne permet pas de changer de machine sans rouvrir
 * chaque collection. C'est donc un fichier qui les porte toutes — et l'import
 * doit le reconnaître sans l'aplatir. Ce scénario démarre l'application dans son
 * contexte d'extension, avec deux zones de stockage simulées, déclenche les
 * gestes réels — exporter, importer, ajouter, remplacer, annuler — et regarde
 * **ce qui est écrit** :
 *
 * - l'export contient toutes les collections ordinaires et tous leurs liens,
 *   et jamais la collection de navigation privée ;
 * - l'ajout garde les collections en place et suffixe les noms déjà pris ;
 * - le remplacement demande confirmation, annonce ce qui sera perdu, et
 *   n'écrit rien tant qu'on n'a pas dit oui ;
 * - annuler ne laisse aucune trace.
 *
 * Un second scénario tourne sur la page web autonome, qui n'a qu'une collection :
 * l'ajout y fusionne les liens, et le remplacement y remplace nom, note et
 * premier numéro.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp, fire } from './helpers/dom-shim.mjs';
import { toBackupJson } from '../src/core/backup.js';
import { DEFAULT_COLLECTION_ID } from '../src/core/collections.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');
const HTML = readFileSync(join(ROOT, 'src', 'web', 'index.html'), 'utf8');

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

const COLLECTIONS_KEY = 'url-qr-code-printer/collections';
const ACTIVE_COLLECTION_KEY = 'url-qr-code-printer/active-collection';
const LINKS_KEY = 'links';
const PRIVATE_LINKS_KEY = 'links/private';

const STAMP = new Date(2026, 10, 24, 13, 30).getTime();

/** Attend qu'un état soit vrai, plutôt qu'un délai fixe. */
async function until(check, timeout = 3000) {
  const fin = Date.now() + timeout;
  for (;;) {
    if (check()) return true;
    if (Date.now() > fin) return false;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/**
 * Zone de stockage simulée, à la forme de `chrome.storage.local`.
 *
 * @param {object} [initial]
 * @returns {{ data: object, get: Function, set: Function }}
 */
function zone(initial = {}) {
  const data = { ...initial };
  return {
    data,
    async get(key) {
      return { [key]: data[key] };
    },
    async set(patch) {
      Object.assign(data, patch);
    },
  };
}

/** Un lien minimal, rangé dans la collection demandée. */
function lien(id, url, collectionId, extra = {}) {
  return {
    id,
    url,
    title: `Titre ${id}`,
    note: '',
    tags: [],
    collectionId,
    createdAt: 10,
    updatedAt: 10,
    source: 'manual',
    favicon: '',
    shortUrl: '',
    ...extra,
  };
}

/** Un fichier tel que le champ de fichier le rend : un nom, et de quoi le lire. */
function fichier(name, text) {
  return { name, type: '', text: async () => text };
}

/**
 * Démarre l'application dans son contexte d'extension.
 *
 * @param {{ links?: Array<object>, collections?: Array<object>, active?: string,
 *   privateLinks?: Array<object>, prive?: boolean }} [options]
 */
async function demarrer(options = {}) {
  const collections = options.collections ?? [
    { id: DEFAULT_COLLECTION_ID, name: '', note: '', startIndex: 1, createdAt: 0 },
    { id: 'veille', name: 'Veille', note: 'mes lectures', startIndex: 1, createdAt: 20 },
  ];
  const area = zone({
    [COLLECTIONS_KEY]: { version: 2, migratedAt: 1, items: collections },
    [ACTIVE_COLLECTION_KEY]: {
      normal: options.active ?? DEFAULT_COLLECTION_ID,
      private: options.prive ? 'private' : '',
    },
    [LINKS_KEY]: options.links ?? [lien('l1', 'https://exemple.fr/un', DEFAULT_COLLECTION_ID)],
  });
  // Une zone de session peut exister sans que la page soit en navigation
  // privée : c'est ce qui permet de vérifier que l'export l'ignore, tout en
  // laissant l'export disponible.
  const session = options.prive || options.privateLinks
    ? zone({ [PRIVATE_LINKS_KEY]: options.privateLinks ?? [] })
    : null;

  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    chrome: {
      runtime: { id: 'test' },
      storage: session ? { local: area, session } : { local: area },
      ...(options.prive ? { extension: { inIncognitoContext: true } } : {}),
    },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);

  const app = {
    area,
    session,
    node: (id) => registry.get(id),
    liens: () => area.data[LINKS_KEY] ?? [],
    liensPrives: () => session?.data[PRIVATE_LINKS_KEY] ?? [],
    collections: () => area.data[COLLECTIONS_KEY].items,
    collection: (id) => area.data[COLLECTIONS_KEY].items.find((item) => item.id === id),
    liensDans: (id) => (area.data[LINKS_KEY] ?? []).filter((link) => link.collectionId === id),
    /** Présente un fichier au champ d'import, et attend la lecture. */
    async importer(name, text) {
      const champ = registry.get('import-file');
      champ.files = [fichier(name, text)];
      await fire(champ, 'change');
    },
    /** Clique, puis attend que la question de restauration soit ouverte. */
    async importerSauvegarde(name, text) {
      await app.importer(name, text);
      // Le substitut de DOM ne lit pas l'attribut `hidden` du HTML : un panneau
      // jamais ouvert et un panneau ouvert ont donc le même état. C'est son
      // titre, posé à l'ouverture, qui dit qu'il est là.
      await until(() => registry.get('backup-menu-title').textContent !== '');
    },
  };
  // Les libellés de la restauration nomment la collection affichée : le
  // démarrage doit avoir rempli la liste des collections avant le premier geste.
  await until(() => app.node('collection-select').children.length > 0);
  return app;
}

/** Une sauvegarde de deux collections, écrite par le cœur. */
function sauvegarde(options = {}) {
  return toBackupJson({
    now: STAMP,
    collections: [
      {
        id: 'sauvee-a',
        name: 'Veille',
        note: 'depuis la sauvegarde',
        startIndex: 101,
        createdAt: 20,
      },
      {
        id: 'sauvee-b',
        name: '',
        note: '',
        startIndex: 5,
        createdAt: 30,
      },
    ],
    links: [
      lien('sa1', 'https://exemple.fr/sauve-un', 'sauvee-a', {
        title: 'Sauvegardé un',
        note: 'note du fichier',
        order: 0,
      }),
      lien('sb1', 'https://exemple.fr/sauve-deux', 'sauvee-b'),
    ],
    activeCollectionId: 'sauvee-a',
    ...options,
  });
}

// ---------------------------------------------------------------------------
// L'export
// ---------------------------------------------------------------------------

test('la sauvegarde contient toutes les collections ordinaires, et jamais la privée', async () => {
  const app = await demarrer({
    links: [
      lien('l1', 'https://exemple.fr/un', DEFAULT_COLLECTION_ID),
      lien('v1', 'https://exemple.fr/veille', 'veille'),
    ],
    privateLinks: [lien('p1', 'https://exemple.fr/prive', 'private')],
  });

  // L'export est capturé à la source : le substitut de DOM ne télécharge rien.
  const captures = [];
  const vraiCreate = URL.createObjectURL;
  const vraiRevoke = URL.revokeObjectURL;
  const vraiSetTimeout = globalThis.setTimeout;
  URL.createObjectURL = (blob) => {
    captures.push(blob);
    return 'blob:test';
  };
  URL.revokeObjectURL = () => {};
  // Le téléchargement programme la révocation de l'objet-URL à une minute : un
  // test ne doit pas laisser ce minuteur derrière lui.
  globalThis.setTimeout = (fn, delay, ...rest) => (delay >= 60_000
    ? 0
    : vraiSetTimeout(fn, delay, ...rest));

  try {
    await fire(app.node('export-backup'), 'click');
  } finally {
    URL.createObjectURL = vraiCreate;
    URL.revokeObjectURL = vraiRevoke;
    globalThis.setTimeout = vraiSetTimeout;
  }

  assert.equal(captures.length, 1, 'un fichier a été produit');
  const document = JSON.parse(await captures[0].text());

  assert.equal(document.format, 'url-qr-code-printer/backup');
  assert.equal(document.version, 1);
  assert.deepEqual(document.collections.map((item) => item.name), ['', 'Veille']);
  assert.equal(document.collections[1].note, 'mes lectures');
  assert.deepEqual(
    document.links.map((link) => link.url).sort(),
    ['https://exemple.fr/un', 'https://exemple.fr/veille'],
    'les liens des collections ordinaires sont là',
  );
  assert.doesNotMatch(JSON.stringify(document), /prive/, 'aucune URL de session dans le fichier');
  assert.match(app.node('toast').textContent, /sauvegarde-complete-.*\.json enregistré/);
});

test('en navigation privée, la sauvegarde complète est refusée et expliquée', async () => {
  const app = await demarrer({ prive: true });

  await until(() => app.node('export-backup').disabled === true);
  assert.equal(app.node('export-backup').disabled, true, 'la commande est inactive');
  assert.match(app.node('export-backup').title, /Navigation privée/);

  // Et le geste est refusé même déclenché directement : la garde est dans le
  // gestionnaire, pas seulement dans l'état du bouton.
  const captures = [];
  const vraiCreate = URL.createObjectURL;
  const vraiRevoke = URL.revokeObjectURL;
  URL.createObjectURL = (blob) => {
    captures.push(blob);
    return 'blob:test';
  };
  URL.revokeObjectURL = () => {};
  try {
    await fire(app.node('export-backup'), 'click');
  } finally {
    URL.createObjectURL = vraiCreate;
    URL.revokeObjectURL = vraiRevoke;
  }
  assert.equal(captures.length, 0);
  assert.match(app.node('toast').textContent, /Navigation privée/);
});

// ---------------------------------------------------------------------------
// L'import d'une sauvegarde
// ---------------------------------------------------------------------------

test('un fichier de sauvegarde ouvre son propre choix, pas celui d\'une archive', async () => {
  const app = await demarrer();
  assert.match(HTML, /id="backup-menu"[^>]*hidden/, 'le panneau part fermé');

  await app.importerSauvegarde('sauvegarde.json', sauvegarde());

  // Le panneau de l'import d'une collection n'est pas ouvert : aplatir la
  // sauvegarde en une seule collection serait une perte silencieuse. Son titre
  // reste vide — c'est lui qui est posé à l'ouverture.
  assert.equal(app.node('import-menu-title').textContent, '', 'la question de l\'archive reste fermée');
  assert.notEqual(app.node('backup-menu-title').textContent, '');
  assert.match(app.node('backup-menu-title').textContent, /2 collections dans sauvegarde\.json/);
  assert.match(app.node('backup-menu-hint').textContent, /2 liens/);
  assert.match(app.node('backup-menu-hint').textContent, /Rien n'est écrit avant votre choix/);
  assert.equal(app.node('backup-add').textContent, 'Ajouter les 2 collections du fichier');

  // Rien n'est écrit avant le choix.
  assert.deepEqual(app.liens().map((link) => link.id), ['l1']);
  assert.equal(app.collections().length, 2);
});

test('ajouter crée des copies, suffixe les noms pris et laisse l\'existant intact', async () => {
  const app = await demarrer();
  await app.importerSauvegarde('sauvegarde.json', sauvegarde());
  await fire(app.node('backup-add'), 'click');

  const noms = app.collections().map((item) => item.name);
  assert.equal(noms.length, 4, 'les deux collections existantes, et les deux restaurées');
  assert.deepEqual(noms.slice(2).sort(), ['', 'Veille 2'], 'un nom pris est suffixé, jamais refusé');

  const veille2 = app.collections().find((item) => item.name === 'Veille 2');
  assert.equal(veille2.note, 'depuis la sauvegarde');
  assert.equal(veille2.startIndex, 101, 'le premier numéro suit la collection');
  assert.equal(veille2.createdAt, 20, 'la date de création est restaurée');

  const vide = app.collections().filter((item) => item.name === '');
  assert.equal(vide.length, 2, 'le nom vide du fichier reste vide');
  assert.equal(vide[1].startIndex, 5);

  // Les liens du fichier sont rangés dans les copies, avec leur note et leur rang.
  const sauves = app.liens().filter((link) => link.id.startsWith('s'));
  assert.equal(sauves.length, 2);
  const sa1 = sauves.find((link) => link.id === 'sa1');
  assert.equal(sa1.collectionId, veille2.id);
  assert.equal(sa1.note, 'note du fichier');
  assert.equal(sa1.order, 0);
  assert.equal(sauves.find((link) => link.id === 'sb1').collectionId, vide[1].id);

  // L'existant n'a pas bougé : ni son lien, ni les noms, ni les notes.
  assert.deepEqual(app.liensDans(DEFAULT_COLLECTION_ID).map((link) => link.id), ['l1']);
  assert.equal(app.collection('veille').note, 'mes lectures');
  assert.match(app.node('toast').textContent, /2 collections restaurées, 2 liens restaurés/);

  // Un ordre explicite est enregistré : les existantes d'abord, les restaurées
  // ensuite, dans l'ordre du fichier.
  assert.deepEqual(
    app.collections().map((item) => item.order),
    [0, 1, 2, 3],
  );
});

test('remplacer demande confirmation, annonce les deux côtés, et annuler ne touche rien', async () => {
  const app = await demarrer();
  await app.importerSauvegarde('sauvegarde.json', sauvegarde());

  await fire(app.node('backup-replace'), 'click');
  await until(() => app.node('backup-confirm-text').textContent !== '');

  assert.equal(app.node('backup-menu').hidden, true, 'le choix laisse la place à la question');
  const texte = app.node('backup-confirm-text').textContent;
  assert.match(texte, /2 collections, 1 lien/, 'ce qui va être perdu est nommé');
  assert.match(texte, /2 collections, 2 liens/, 'ce qui va être restauré aussi');

  // Annuler rend le choix, sans avoir rien écrit.
  await fire(app.node('backup-confirm-cancel'), 'click');
  assert.equal(app.node('backup-confirm').hidden, true);
  assert.equal(app.node('backup-menu').hidden, false, 'le choix est rendu');
  assert.equal(app.collections().length, 2);
  assert.deepEqual(app.liens().map((link) => link.id), ['l1']);
});

test('remplacer restaure exactement les collections du fichier, et rien d\'autre', async () => {
  const app = await demarrer({
    links: [
      lien('l1', 'https://exemple.fr/un', DEFAULT_COLLECTION_ID),
      lien('v1', 'https://exemple.fr/veille', 'veille'),
    ],
  });
  await app.importerSauvegarde('sauvegarde.json', sauvegarde());

  await fire(app.node('backup-replace'), 'click');
  await until(() => app.node('backup-confirm-text').textContent !== '');
  await fire(app.node('backup-confirm-yes'), 'click');

  const collections = app.collections();
  assert.equal(collections.length, 2, 'les anciennes collections ont disparu');
  assert.deepEqual(collections.map((item) => item.name), ['Veille', '']);
  assert.equal(collections[0].note, 'depuis la sauvegarde');
  assert.equal(collections[0].startIndex, 101);

  // Les liens sont ceux du fichier, réestampillés vers les nouvelles
  // collections : aucun identifiant du fichier n'est réutilisé pour elles.
  assert.equal(app.liens().length, 2);
  assert.deepEqual(app.liens().map((link) => link.id).sort(), ['sa1', 'sb1']);
  assert.equal(app.liens().find((link) => link.id === 'sa1').collectionId, collections[0].id);
  assert.equal(app.liens().find((link) => link.id === 'sb1').collectionId, collections[1].id);
  assert.equal(app.collection('veille'), undefined, 'l\'ancienne collection a bien disparu');

  // La collection courante est celle que le fichier désignait, remappée.
  assert.equal(app.area.data[ACTIVE_COLLECTION_KEY].normal, collections[0].id);
  assert.equal(app.node('collection-select').value, collections[0].id);
  assert.match(app.node('toast').textContent, /2 collections restaurées, 2 liens restaurés/);
});

test('annuler le choix d\'une sauvegarde n\'écrit rien', async () => {
  const app = await demarrer();
  await app.importerSauvegarde('sauvegarde.json', sauvegarde());
  await fire(app.node('backup-cancel'), 'click');

  assert.equal(app.node('backup-menu').hidden, true);
  assert.equal(app.collections().length, 2);
  assert.deepEqual(app.liens().map((link) => link.id), ['l1']);

  // Un clic resté armé ne doit pas écrire dans le vide : l'attente est vidée
  // avec le panneau.
  await fire(app.node('backup-add'), 'click');
  assert.equal(app.collections().length, 2);
});

test('en navigation privée, une sauvegarde est refusée avec sa raison', async () => {
  const app = await demarrer({ prive: true });
  await app.importer('sauvegarde.json', sauvegarde());

  assert.equal(app.node('backup-menu-title').textContent, '', 'aucune question de rangement');
  assert.match(app.node('toast').textContent, /Navigation privée/);
  assert.deepEqual(app.collections().map((item) => item.name), ['', 'Veille']);
});

// ---------------------------------------------------------------------------
// La page web autonome, qui n'a qu'une collection
// ---------------------------------------------------------------------------

test('sur la page autonome, ajouter fusionne les liens dans la collection unique', async () => {
  // Le substitut de DOM garde `globalThis.chrome` d'un démarrage à l'autre :
  // sans le retirer, cette page « autonome » aurait l'API d'extension de la
  // première et ne serait plus autonome du tout.
  delete globalThis.chrome;
  const { registry, bootError } = await bootApp({ distWeb: DIST_WEB });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);
  const node = (id) => registry.get(id);

  const champ = node('import-file');
  champ.files = [fichier('sauvegarde.json', sauvegarde())];
  await fire(champ, 'change');
  await until(() => node('backup-menu-title').textContent !== '');

  // Les deux issues sont adaptées : il n'y a pas de collection à créer à côté.
  assert.equal(node('backup-add').textContent, 'Fusionner les 2 collections dans « Mes liens »');
  assert.equal(node('backup-replace').textContent, 'Remplacer « Mes liens »');
  assert.match(node('backup-menu-hint').textContent, /réunies dans « Mes liens »/);

  await fire(node('backup-add'), 'click');
  await until(() => node('count').textContent === '2 liens');
  assert.equal(node('count').textContent, '2 liens', 'les deux liens de la sauvegarde sont là');
  assert.match(node('toast').textContent, /2 liens restaurés/);

  // Pas de doublon : réimporter la même sauvegarde n'ajoute rien.
  champ.files = [fichier('sauvegarde.json', sauvegarde())];
  await fire(champ, 'change');
  await until(() => node('backup-menu').hidden === false);
  await fire(node('backup-add'), 'click');
  await until(() => /déjà présents/.test(node('toast').textContent));
  assert.match(node('toast').textContent, /0 lien restauré, 2 déjà présents/);
});

test('sur la page autonome, remplacer reprend nom, note et premier numéro', async () => {
  delete globalThis.chrome;
  const { registry, bootError } = await bootApp({ distWeb: DIST_WEB });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);
  const node = (id) => registry.get(id);

  const champ = node('import-file');
  champ.files = [fichier('sauvegarde.json', sauvegarde())];
  await fire(champ, 'change');
  await until(() => node('backup-menu-title').textContent !== '');
  await fire(node('backup-replace'), 'click');
  await until(() => node('backup-confirm-text').textContent !== '');
  await fire(node('backup-confirm-yes'), 'click');

  await until(() => node('count').textContent === '2 liens');
  assert.equal(node('count').textContent, '2 liens');
  assert.equal(node('collection-name').value, 'Veille', 'le nom vient de la sauvegarde');
  assert.equal(node('collection-note').value, 'depuis la sauvegarde');
  assert.equal(node('collection-start').value, '101');
});
