/**
 * La fiche du Chrome Web Store dit-elle la vérité sur ce qui est publié ?
 *
 * La fiche vit à deux endroits : `store/listing.json`, qui est la source du
 * dépôt — les textes, les justifications de permission, la déclaration d'usage
 * des données — et `docs/chrome-web-store.md`, qui en est la copie lisible. Rien
 * n'oblige les deux à rester d'accord, ni les justifications à couvrir les
 * permissions réellement demandées par le manifeste : une permission ajoutée
 * sans justification passe l'examen du magasin en mentant par omission, et le
 * refus arrive des semaines plus tard, sans rapport apparent avec la
 * fonctionnalité ajoutée.
 *
 * Réécrit après une perte accidentelle du fichier d'origine (nettoyage de
 * doublons iCloud ayant emporté des fichiers non commités). Les règles couvertes
 * sont celles que la fiche doit tenir : les limites du magasin, la parité avec
 * le manifeste, et les captures — dimensions mesurées sur les fichiers, pas
 * lues dans la documentation.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseImportFile, toImportableLinks } from '../src/core/import.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LISTING = JSON.parse(readFileSync(join(ROOT, 'store', 'listing.json'), 'utf8'));
const DOC = readFileSync(join(ROOT, 'docs', 'chrome-web-store.md'), 'utf8');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'dist', 'extension', 'manifest.json'), 'utf8'));
const MESSAGES_EN = JSON.parse(
  readFileSync(join(ROOT, 'src', 'extension-src', '_locales', 'en', 'messages.json'), 'utf8'),
);
const MESSAGES_FR = JSON.parse(
  readFileSync(join(ROOT, 'src', 'extension-src', '_locales', 'fr', 'messages.json'), 'utf8'),
);
const CAPTURES = join(ROOT, 'store', 'screenshots');

/**
 * Les limites de la fiche, telles que le magasin les impose.
 *
 * Elles sont recopiées ici volontairement : c'est le seul endroit du dépôt où
 * elles sont vérifiables, et les écrire une fois vaut mieux que les découvrir au
 * moment du refus.
 */
const LIMITES = { nom: 45, resume: 132, description: 16000 };

/**
 * Dimensions d'une image, lues dans ses octets.
 *
 * PNG : le bloc IHDR, à l'offset 16. JPEG : on parcourt les marqueurs jusqu'au
 * SOF, qui porte la hauteur et la largeur. La documentation du magasin annonce
 * les tailles attendues ; les lire dans le fichier évite de croire un README.
 *
 * @param {Buffer} octets
 * @returns {{ largeur: number, hauteur: number } | null}
 */
function dimensions(octets) {
  if (octets.length > 24 && octets.toString('latin1', 1, 4) === 'PNG') {
    return { largeur: octets.readUInt32BE(16), hauteur: octets.readUInt32BE(20) };
  }
  if (octets.length > 4 && octets[0] === 0xff && octets[1] === 0xd8) {
    let i = 2;
    while (i < octets.length - 9) {
      if (octets[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marqueur = octets[i + 1];
      const longueur = octets.readUInt16BE(i + 2);
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 : les marqueurs qui
      // portent la taille. SOF4, SOF8 et SOF12 sont réservés.
      if (marqueur >= 0xc0 && marqueur <= 0xcf
        && ![0xc4, 0xc8, 0xcc].includes(marqueur)) {
        return { hauteur: octets.readUInt16BE(i + 5), largeur: octets.readUInt16BE(i + 7) };
      }
      i += 2 + longueur;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Les textes et leurs limites
// ---------------------------------------------------------------------------

test('les textes de la fiche tiennent dans les limites du magasin', () => {
  const { name, url } = LISTING.item;
  assert.ok(name.length > 0 && name.length <= LIMITES.nom, `nom : ${name.length} caractères`);
  assert.match(url, /^https:\/\/chromewebstore\.google\.com\/detail\//);
  assert.match(LISTING.item.itemId, /^[a-p]{32}$/, 'un identifiant d\'extension a 32 lettres');

  for (const langue of ['fr', 'en']) {
    const resume = LISTING.summary[langue] ?? '';
    const description = LISTING.description[langue] ?? '';
    assert.ok(resume.trim() !== '', `résumé ${langue} vide`);
    assert.ok(
      resume.length <= LIMITES.resume,
      `résumé ${langue} : ${resume.length} caractères (maximum ${LIMITES.resume})`,
    );
    assert.ok(
      description.length <= LIMITES.description,
      `description ${langue} : ${description.length} caractères (maximum ${LIMITES.description})`,
    );
  }
});

test('le nom de la fiche est celui que l\'extension porte', () => {
  // Le manifeste passe par `__MSG_name__` : le nom publié est celui des
  // catalogues de langue, pas une chaîne écrite dans le manifeste.
  assert.equal(MANIFEST.name, '__MSG_name__');
  assert.equal(MESSAGES_EN.name.message, LISTING.item.name);
  assert.equal(MESSAGES_FR.name.message, LISTING.item.name);
  // La description du manifeste n'est **pas** le résumé de la fiche : c'est le
  // texte que le navigateur affiche dans la page des extensions. Elle obéit à la
  // même borne de 132 caractères, et c'est ce que ce contrôle vérifie.
  for (const messages of [MESSAGES_EN, MESSAGES_FR]) {
    const description = messages.description?.message ?? '';
    assert.ok(description.trim() !== '', 'description absente d\'un catalogue');
    assert.ok(
      description.length <= LIMITES.resume,
      `description du manifeste : ${description.length} caractères`,
    );
  }
});

test('la version publiée ne devance pas celle du paquet', () => {
  const nombre = (v) => v.split('.').map(Number);
  const [maj, min, corr] = nombre(MANIFEST.version);
  const [pmaj, pmin, pcorr] = nombre(LISTING.item.publishedVersion);
  assert.ok(
    [maj, min, corr].some((n) => Number.isFinite(n)),
    `version du manifeste illisible : ${MANIFEST.version}`,
  );
  const comparaison = (maj - pmaj) || (min - pmin) || (corr - pcorr);
  assert.ok(
    comparaison >= 0,
    `la fiche annonce ${LISTING.item.publishedVersion}, le paquet porte ${MANIFEST.version}`,
  );
});

// ---------------------------------------------------------------------------
// La parité avec le manifeste
// ---------------------------------------------------------------------------

test('chaque permission demandée est justifiée, et pas une de plus', () => {
  const demandees = MANIFEST.permissions ?? [];
  const justifiees = Object.keys(LISTING.permissionJustifications ?? {});

  // Une permission sans justification passe l'examen en mentant par omission ;
  // une justification sans permission est une phrase qui ne décrit plus rien.
  assert.deepEqual(
    demandees.filter((p) => !justifiees.includes(p)).sort(),
    [],
    'permissions demandées sans justification',
  );
  assert.deepEqual(
    justifiees.filter((p) => !demandees.includes(p)).sort(),
    [],
    'justifications pour des permissions qui ne sont plus demandées',
  );

  for (const [permission, texte] of Object.entries(LISTING.permissionJustifications)) {
    assert.ok(texte.trim().length > 40, `justification trop courte pour ${permission}`);
  }
});

test('le manifeste ne demande aucun hôte, et la fiche n\'en déclare aucun', () => {
  // L'extension n'a pas de permission d'hôte : c'est ce qui lui permet de
  // fonctionner sans lire les pages. Une `host_permissions` ajoutée devrait
  // apparaître dans la fiche, et ce contrôle le dirait.
  assert.deepEqual(MANIFEST.host_permissions ?? [], []);
  assert.ok(!/host_permissions/.test(DOC), 'la fiche parle d\'hôtes que le manifeste ne demande pas');
});

test('l\'usage des données est déclaré, et cohérent avec ce que fait l\'extension', () => {
  const { collected, certifications } = LISTING.dataUsage ?? {};
  assert.ok(collected, 'aucune déclaration d\'usage des données');
  // L'extension enregistre des URL et des titres de pages : c'est de l\'historique
  // de navigation et du contenu de site, et la fiche doit le dire plutôt que de
  // tout déclarer absent.
  assert.equal(collected.webHistory, true);
  assert.equal(collected.websiteContent, true);
  for (const champ of ['personallyIdentifiable', 'health', 'financialAndPayment',
    'authentication', 'personalCommunications', 'location', 'userActivity']) {
    assert.equal(collected[champ], false, `${champ} déclaré alors que rien ne le justifie`);
  }
  for (const engagement of ['noSaleOrUnapprovedTransfer', 'noUnrelatedUse']) {
    assert.equal(certifications?.[engagement], true, `engagement manquant : ${engagement}`);
  }
});

test('la fiche déclare qu\'aucun code distant n\'est employé', () => {
  // Le magasin refuse le code distant, et demande une justification quand
  // `uses` vaut faux : les deux champs doivent être présents.
  assert.equal(LISTING.remoteCode?.uses, false);
  assert.ok((LISTING.remoteCode?.justification ?? '').trim().length > 40);
});

test('la politique de confidentialité est un fichier du dépôt', () => {
  const nom = LISTING.privacyPolicyUrl.split('/').pop();
  assert.equal(nom, 'PRIVACY.md');
  assert.ok(existsSync(join(ROOT, nom)), `${nom} est absent du dépôt`);
  // Le lien de la fiche est aussi celui des pages du site : deux adresses
  // divergentes enverraient l'utilisateur sur une page qui n'existe pas.
  for (const page of ['index.html', join('en', 'index.html')]) {
    const html = readFileSync(join(ROOT, 'src', 'site', page), 'utf8');
    assert.ok(
      html.includes(LISTING.privacyPolicyUrl),
      `src/site/${page} ne renvoie pas à la politique de confidentialité de la fiche`,
    );
  }
});

// ---------------------------------------------------------------------------
// La copie lisible
// ---------------------------------------------------------------------------

test('la copie lisible porte les mêmes informations que la source', () => {
  for (const extrait of [
    LISTING.item.name,
    LISTING.item.itemId,
    LISTING.item.publishedVersion,
    LISTING.summary.fr,
    LISTING.summary.en,
  ]) {
    assert.ok(DOC.includes(extrait), `docs/chrome-web-store.md ne reprend pas : ${extrait.slice(0, 60)}…`);
  }
  assert.ok(DOC.includes(LISTING.privacyPolicyUrl));
});

// ---------------------------------------------------------------------------
// Les captures d'écran
// ---------------------------------------------------------------------------

test('les captures annoncées existent, et aucune n\'est en trop', () => {
  const surDisque = readdirSync(CAPTURES)
    .filter((nom) => /\.(png|jpe?g)$/i.test(nom))
    .sort();
  // Le magasin en accepte cinq au maximum : au-delà, la fiche est refusée.
  assert.ok(surDisque.length >= 1 && surDisque.length <= 5, `${surDisque.length} capture(s)`);

  const readme = readFileSync(join(CAPTURES, 'README.md'), 'utf8');
  for (const nom of surDisque) {
    assert.ok(readme.includes(nom), `${nom} n'est pas décrite dans store/screenshots/README.md`);
  }
  for (const [, nom] of readme.matchAll(/^(\d\d-[^\s]+\.(?:png|jpe?g))$/gim)) {
    assert.ok(surDisque.includes(nom), `${nom} est décrite mais absente du dossier`);
  }
});

test('chaque capture a une taille acceptée par le magasin', () => {
  // 1280 × 800 (préféré) ou 640 × 400 : les deux seules tailles admises. Elles
  // sont mesurées dans les octets du fichier — un README peut se tromper, un
  // en-tête PNG non.
  const acceptees = ['1280x800', '640x400'];
  const mesures = [];
  for (const nom of readdirSync(CAPTURES).filter((n) => /\.(png|jpe?g)$/i.test(n))) {
    const octets = readFileSync(join(CAPTURES, nom));
    const taille = dimensions(octets);
    assert.ok(taille, `dimensions illisibles pour ${nom}`);
    const cle = `${taille.largeur}x${taille.hauteur}`;
    mesures.push(`${nom} ${cle}`);
    assert.ok(acceptees.includes(cle), `${nom} : ${cle} n'est pas une taille acceptée`);
  }
  assert.ok(mesures.length > 0, 'aucune capture mesurée');
});

test('le contenu d\'exemple des captures est importable, et se lit à 640 × 400', () => {
  // `store/screenshots/contenu-exemple.json` est chargé par le bouton
  // « Importer » avant chaque série de captures : c'est ce qui les rend
  // reproductibles. Un fichier que l'importateur refuse ne se verrait qu'au
  // moment de la séance photo — d'où ce contrôle, qui le relit avec le code du
  // produit plutôt qu'avec un `JSON.parse`.
  const chemin = join(ROOT, 'store', 'screenshots', 'contenu-exemple.json');
  assert.ok(existsSync(chemin), 'le contenu d\'exemple a disparu');
  const texte = readFileSync(chemin, 'utf8');

  const { kind, records, collection } = parseImportFile({
    name: 'contenu-exemple.json', text: texte,
  });
  assert.equal(kind, 'links', 'le format reconnu doit être celui de l\'archive du produit');

  // Le nom et la note de collection sont **lus** par l'importateur : ils vivent
  // dans un objet `collection`. Une chaîne à cette place passe inaperçue —
  // l'importateur ne retient rien, la capture montre une collection sans nom, et
  // rien ne le signale avant la séance photo.
  assert.ok(
    (collection?.name ?? '').trim().length > 0,
    'le contenu d\'exemple ne donne pas de nom à la collection',
  );

  const { links, rejected } = toImportableLinks(records, { now: 1_750_000_000_000 });
  assert.equal(rejected, 0, `${rejected} lien(s) refusé(s) par l'importateur`);
  assert.ok(links.length >= 10, `une capture montre une collection : ${links.length} lien(s), c'est peu`);

  // Ce que la fenêtre de 380 px impose : un titre qui se replie sur deux lignes
  // rend la capture illisible une fois réduite par le magasin.
  const trop = links.filter((lien) => (lien.title ?? '').length > 45);
  assert.equal(trop.length, 0,
    `titre(s) trop long(s) pour la colonne étroite : ${trop.map((l) => l.title).join(', ')}`);

  // Un domaine unique répété douze fois ne montre rien : la variété est le but.
  const domaines = new Set(links.map((lien) => new URL(lien.url).hostname));
  assert.ok(domaines.size >= links.length - 2,
    `${links.length} liens pour ${domaines.size} domaine(s) : la collection doit être variée`);

  // Les tags sont une fonction : une capture qui n'en montre aucun ne la vend pas.
  const tags = new Set(links.flatMap((lien) => lien.tags ?? []));
  assert.ok(tags.size >= 4, `${tags.size} tag(s) distinct(s) : la liste n'en montrerait presque aucun`);
});
