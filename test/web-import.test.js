/**
 * Importer, et décider où ranger ce qu'on vient de relire — exécuté pour de vrai.
 *
 * L'import ajoutait à la collection affichée, toujours, et sans le dire. Il
 * demande désormais : fusionner, remplacer — nom et note compris — ou ranger à
 * part dans une collection nouvelle. Le contrôle statique dirait que les trois
 * commandes existent ; il ne dirait pas ce qu'elles **font** : qu'un
 * remplacement vide vraiment la collection avant d'y mettre le fichier, qu'il
 * reprend le nom et la note du fichier, qu'une collection neuve ne touche pas à
 * la précédente, et qu'annuler n'écrit rien.
 *
 * Le scénario démarre donc l'application **dans son contexte d'extension** : les
 * collections y vivent dans `chrome.storage.local`, alors que la page web
 * autonome n'en a qu'une. Le substitut de stockage est en mémoire, à la forme de
 * l'API réelle — un `get(clé)` qui rend `{ [clé]: valeur }`, un `set(patch)`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bootApp, fire } from './helpers/dom-shim.mjs';
import { toJson, toCsv } from '../src/core/exporters.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_WEB = join(ROOT, 'dist', 'web');
const HTML = readFileSync(join(ROOT, 'src', 'web', 'index.html'), 'utf8');

if (!existsSync(DIST_WEB)) {
  throw new Error(`${DIST_WEB} est absent : lancez « npm run build » avant les tests.`);
}

/**
 * Laisse finir les écritures lancées par un gestionnaire qui ne rend rien.
 *
 * Le champ du nom enregistre à la sortie du champ sans rendre sa promesse —
 * l'application n'a rien à en faire. Un test, lui, doit attendre : quelques tours
 * de boucle suffisent, la chaîne n'étant faite que de micro-tâches.
 *
 * @param {number} [tours]
 */
async function laisserFinir(tours = 5) {
  for (let index = 0; index < tours; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const COLLECTIONS_KEY = 'url-qr-code-printer/collections';
const ACTIVE_COLLECTION_KEY = 'url-qr-code-printer/active-collection';
const LINKS_KEY = 'links';
const PRIVATE_LINKS_KEY = 'links/private';

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
 * Démarre l'application sur deux collections, et rend de quoi lire l'état.
 *
 * `prive` ouvre la session de navigation privée : elle n'existe que dans une
 * fenêtre privée, et c'est ce qui fait apparaître la troisième collection.
 *
 * @param {{ links?: Array<object>, collections?: Array<object>, active?: string,
 *   privateLinks?: Array<object>, prive?: boolean }} [options]
 */
async function demarrer(options = {}) {
  const collections = options.collections ?? [
    { id: 'default', name: '', note: '', startIndex: 1, createdAt: 0 },
    { id: 'veille', name: 'Veille', note: 'mes lectures', startIndex: 1, createdAt: 20 },
  ];
  const area = zone({
    [COLLECTIONS_KEY]: { version: 1, migratedAt: 1, items: collections },
    [ACTIVE_COLLECTION_KEY]: {
      normal: options.active ?? 'default',
      private: options.prive ? 'private' : '',
    },
    [LINKS_KEY]: options.links ?? [lien('l1', 'https://exemple.fr/un', 'default')],
  });
  const session = options.prive
    ? zone({ [PRIVATE_LINKS_KEY]: options.privateLinks ?? [] })
    : null;

  const { registry, bootError } = await bootApp({
    distWeb: DIST_WEB,
    // L'API d'extension est ce qui distingue une page d'extension d'une page
    // web : sans elle, l'application n'a qu'une collection, celle des réglages.
    chrome: {
      runtime: { id: 'test' },
      storage: session ? { local: area, session } : { local: area },
      ...(options.prive ? { extension: { inIncognitoContext: true } } : {}),
    },
  });
  assert.equal(bootError, null, `démarrage en échec : ${bootError?.message}`);

  return {
    area,
    session,
    node: (id) => registry.get(id),
    liens: () => area.data[LINKS_KEY] ?? [],
    liensPrives: () => session?.data[PRIVATE_LINKS_KEY] ?? [],
    dansLaCollection: (id) => (area.data[LINKS_KEY] ?? []).filter((l) => l.collectionId === id),
    collections: () => area.data[COLLECTIONS_KEY].items,
    collection: (id) => area.data[COLLECTIONS_KEY].items.find((item) => item.id === id),
    /** Présente un fichier au champ d'import, et attend la lecture. */
    async importer(name, text) {
      const champ = registry.get('import-file');
      champ.files = [fichier(name, text)];
      await fire(champ, 'change');
    },
  };
}

/** Une archive de deux liens, telle que le bouton « Archive » l'écrit. */
function archive(options = {}) {
  return toJson(
    [
      lien('i1', 'https://exemple.fr/importe-un', 'default'),
      lien('i2', 'https://exemple.fr/importe-deux', 'default'),
    ],
    options,
  );
}

// ---------------------------------------------------------------------------

test('l\'import demande où ranger ce qu\'il vient de lire', async () => {
  const app = await demarrer();
  // Le substitut de DOM ne lit pas les attributs : l'état « fermé au repos » se
  // vérifie donc dans le balisage, et l'ouverture juste après, à l'exécution.
  assert.match(HTML, /id="import-menu"[^>]*hidden/, 'le panneau part fermé');

  await app.importer('liens-qr.json', archive({ title: 'Veille tech', note: 'à relire' }));

  assert.equal(app.node('import-menu').hidden, false);
  // Ce qui a été lu est annoncé avant tout choix : le nombre de liens, et le
  // nom de collection que le fichier porte.
  assert.match(app.node('import-menu-title').textContent, /2 liens lus dans liens-qr\.json/);
  assert.match(app.node('import-menu-hint').textContent, /Veille tech/);

  // Les trois issues nomment les collections concernées.
  assert.equal(app.node('import-merge').textContent, 'Fusionner avec « Mes liens »');
  assert.equal(app.node('import-replace').textContent, 'Remplacer « Mes liens »');
  assert.equal(app.node('import-add').textContent, 'Nouvelle collection « Veille tech »');

  // **Rien n'est écrit avant le choix** : un import qui écrirait d'abord
  // demanderait ensuite de défaire ce qu'il vient de faire.
  assert.deepEqual(app.liens().map((l) => l.id), ['l1']);
  assert.equal(app.node('import-add').hidden, false);
});

test('fusionner ajoute à la collection affichée, dont le nom ne bouge pas', async () => {
  const app = await demarrer({ active: 'veille' });
  await app.importer('liens-qr.json', archive({ title: 'Veille tech', note: 'à relire' }));
  await fire(app.node('import-merge'), 'click');

  const veille = app.dansLaCollection('veille');
  assert.deepEqual(veille.map((l) => l.id).sort(), ['i1', 'i2'], 'les liens lus sont arrivés');
  // Le nom et la note de la collection affichée sont ceux de l'utilisateur :
  // c'est ce qui distingue « fusionner » de « remplacer ».
  assert.equal(app.collection('veille').name, 'Veille');
  assert.equal(app.collection('veille').note, 'mes lectures');
  assert.equal(app.collections().length, 2, 'aucune collection n\'a été créée');
  assert.equal(app.node('import-menu').hidden, true, 'le panneau se referme après le choix');
  assert.match(app.node('toast').textContent, /2 liens importés/);
});

test('remplacer vide la collection affichée, et reprend nom et note du fichier', async () => {
  // La collection affichée n'est pas vide, et c'est le point : un remplacement
  // qui laisserait ce qu'elle portait ne remplacerait rien.
  const app = await demarrer({
    active: 'veille',
    links: [
      lien('l1', 'https://exemple.fr/un', 'default'),
      lien('v1', 'https://exemple.fr/avant', 'veille'),
    ],
  });
  await app.importer('liens-qr.json', archive({ title: 'Veille tech', note: 'à relire' }));
  await fire(app.node('import-replace'), 'click');

  const veille = app.dansLaCollection('veille');
  assert.deepEqual(veille.map((l) => l.id).sort(), ['i1', 'i2'], 'seul le contenu du fichier reste');
  assert.equal(app.collection('veille').name, 'Veille tech', 'le nom du fichier remplace le sien');
  assert.equal(app.collection('veille').note, 'à relire', 'et sa note aussi');

  // Ce qui a été remplacé a bel et bien disparu — et **seulement** dans la
  // collection affichée : les autres ne sont pas concernées.
  assert.equal(app.liens().some((l) => l.id === 'v1'), false);
  assert.equal(app.dansLaCollection('default').length, 1, 'les autres collections sont intactes');

  // Le champ du nom suit ce qui vient d'être écrit, sans rechargement.
  assert.equal(app.node('collection-name').value, 'Veille tech');
});

test('remplacer par un fichier sans nom de collection vide le nom et la note', async () => {
  // Un CSV ne décrit que des liens. « Remplacer » écrase nom et note par ceux
  // du fichier : quand il n'en porte aucun, la collection reste donc sans nom,
  // et l'affiche sous le libellé intégré.
  const app = await demarrer({ active: 'veille' });
  const links = [lien('i1', 'https://exemple.fr/importe', 'veille')];
  await app.importer('liens.csv', toCsv(links));
  await fire(app.node('import-replace'), 'click');

  assert.equal(app.collection('veille').name, '');
  assert.equal(app.collection('veille').note, '');
  assert.equal(app.node('collection-name').value, '', 'le champ reflète le nom enregistré');
  // Le libellé intégré prend le relais dans la liste, et l'aide le dit.
  const options = app.node('collection-select').children.map((o) => o.textContent);
  assert.deepEqual(options, ['Mes liens', 'Mes liens']);
  assert.match(app.node('collection-hint').textContent, /Mes liens/);
});

test('une collection neuve reçoit le nom du fichier, et la précédente reste intacte', async () => {
  const app = await demarrer({ active: 'veille' });
  await app.importer('liens-qr.json', archive({ title: 'Veille tech', note: 'à relire' }));
  await fire(app.node('import-add'), 'click');

  const creee = app.collections().find((item) => item.name === 'Veille tech');
  assert.ok(creee, 'la collection du fichier a été créée');
  assert.equal(creee.note, 'à relire');
  assert.deepEqual(app.dansLaCollection(creee.id).map((l) => l.id).sort(), ['i1', 'i2']);
  // La collection affichée n'a pas été touchée : ni ses liens, ni son nom.
  assert.equal(app.dansLaCollection('veille').length, 0);
  assert.equal(app.collection('veille').name, 'Veille');
  assert.equal(app.collection('veille').note, 'mes lectures');

  // Et l'application bascule sur la collection qui vient de recevoir l'import :
  // c'est celle qu'on vient de créer, donc celle qu'on regarde.
  assert.equal(app.area.data[ACTIVE_COLLECTION_KEY].normal, creee.id);
  assert.equal(app.node('collection-select').value, creee.id);
});

test('un nom déjà pris est suffixé, jamais refusé', async () => {
  const app = await demarrer();
  // « Veille » existe : la collection de l'import ne peut pas la prendre, mais
  // refuser l'import pour un nom pris serait absurde.
  await app.importer('liens-qr.json', archive({ title: 'Veille' }));
  assert.equal(app.node('import-add').textContent, 'Nouvelle collection « Veille 2 »');

  await fire(app.node('import-add'), 'click');
  assert.ok(app.collections().some((item) => item.name === 'Veille 2'));
});

test('annuler ne range rien, et ne crée rien', async () => {
  const app = await demarrer();
  await app.importer('liens-qr.json', archive({ title: 'Veille tech' }));
  await fire(app.node('import-cancel'), 'click');

  assert.equal(app.node('import-menu').hidden, true);
  assert.deepEqual(app.liens().map((l) => l.id), ['l1'], 'aucun lien ajouté');
  assert.equal(app.collections().length, 2, 'aucune collection créée');

  // Un second choix, sans nouvel import, ne fait rien : l'attente a été vidée
  // avec le panneau, et un clic resté armé ne doit pas écrire dans le vide.
  await fire(app.node('import-merge'), 'click');
  assert.deepEqual(app.liens().map((l) => l.id), ['l1']);
});

test('changer de collection retire la question, qui nommait l\'autre', async () => {
  // Les trois issues portent le nom de la collection affichée. Basculer pendant
  // que le panneau est ouvert rendrait ces libellés faux : « Fusionner avec
  // « Veille » » écrirait dans une autre.
  const app = await demarrer();
  await app.importer('liens-qr.json', archive({ title: 'Veille tech' }));
  assert.equal(app.node('import-menu').hidden, false);

  const select = app.node('collection-select');
  select.value = 'veille';
  await fire(select, 'change');

  assert.equal(app.node('import-menu').hidden, true, 'la question est retirée');
  // Et le clic resté armé n'écrit nulle part : l'import est à refaire.
  await fire(app.node('import-merge'), 'click');
  assert.deepEqual(app.liens().map((l) => l.id), ['l1']);
});

test('en navigation privée, remplacer ne touche ni au nom ni à la note', async () => {
  // La collection privée est **synthétisée**, jamais écrite : elle n'a pas de
  // nom à reprendre, et le panneau le dit avant le clic. Ses liens, eux, sont
  // bel et bien remplacés — dans la session, pas sur le disque.
  const app = await demarrer({
    prive: true,
    privateLinks: [lien('p1', 'https://exemple.fr/prive-avant', 'private')],
  });
  await app.importer('liens-qr.json', archive({ title: 'Veille tech', note: 'à relire' }));

  assert.match(app.node('import-menu-hint').textContent, /nom et sa note ne sont pas modifiables/);

  await fire(app.node('import-replace'), 'click');

  assert.deepEqual(app.liensPrives().map((l) => l.id).sort(), ['i1', 'i2'], 'les liens privés sont remplacés');
  assert.equal(app.liens().some((l) => l.id === 'i1'), false, 'rien n\'est écrit sur le disque');
  // Le document des collections n'a pas été touché : la collection privée n'y
  // figure pas, et « Remplacer » n'a donc rien à y renommer.
  assert.deepEqual(app.collections().map((item) => item.name), ['', 'Veille']);
  assert.equal(app.node('collection-select').value, 'private');
});

test('vider le champ du nom enregistre un nom vide', async () => {
  // Le défaut d'origine : le champ vidé n'écrivait rien, le nom d'avant restait
  // dans le stockage, et la liste continuait de l'afficher.
  const app = await demarrer({ active: 'veille' });
  const champ = app.node('collection-name');
  assert.equal(champ.value, 'Veille', 'le champ montre le nom enregistré');

  champ.value = '   ';
  await fire(champ, 'change');
  await laisserFinir();

  assert.equal(app.collection('veille').name, '', 'le vide est écrit');
  assert.equal(app.collection('veille').note, 'mes lectures', 'la note, elle, ne bouge pas');
  const options = app.node('collection-select').children.map((o) => o.textContent);
  assert.deepEqual(options, ['Mes liens', 'Mes liens'], 'la liste affiche le libellé intégré');
});
