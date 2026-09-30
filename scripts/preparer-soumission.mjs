/**
 * Assemble la feuille de saisie de la mise à jour, prête à coller.
 *
 * Le portail du Chrome Web Store se remplit champ par champ, dans le navigateur,
 * pendant que le dépôt est ailleurs. Recopier les textes à la main est le meilleur
 * moyen de faire diverger une fiche et un paquet — c'est exactement ce que
 * `test/publication.test.js` surveille. Cette feuille est donc **engendrée** :
 *
 * - les textes de la fiche viennent de `store/listing.json`, seule source ;
 * - la note de version vient du **journal des versions** (`CHANGELOG.md` et
 *   `CHANGELOG.fr.md`), et de nulle part ailleurs : une version sans entrée part
 *   sans note, et la feuille le dit ;
 * - les chemins d'images sont vérifiés, et une image absente est signalée ;
 * - la version et la taille du paquet sont lues dans l'archive elle-même.
 *
 * Rien n'est inventé : un champ que le dépôt ne porte pas s'écrit « à saisir à la
 * main », et une image manquante s'écrit « absente ».
 *
 * Usage : node scripts/preparer-soumission.mjs
 */

import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LISTING = join(ROOT, 'store', 'listing.json');
const CHANGELOG = join(ROOT, 'CHANGELOG.md');
const CHANGELOG_FR = join(ROOT, 'CHANGELOG.fr.md');
const ARCHIVE = join(ROOT, 'dist', 'url-qrcode-printer-chrome.zip');
const SORTIE = join(ROOT, 'dist', 'a-coller-mise-a-jour.md');

/** Les visuels du magasin, et où ils vivent. */
const VISUELS = [
  { champ: 'Captures d’écran (4 sur 5 emplacements)', chemins: [
    'store/screenshots/01-fenetre-popup-fr.jpg',
    'store/screenshots/02-application-fr.png',
    'store/screenshots/03-impression-niimbot-fr.png',
    'store/screenshots/04-mention-confidentialite-fr.png',
  ] },
  { champ: 'Petite image promotionnelle (440 × 280)', chemins: ['store/promo/promo-440x280.jpg'] },
  { champ: 'Icône de la fiche (128 × 128)', chemins: ['src/extension-src/icons/icon-128.png'] },
];

/** Version portée par l'archive : elle est lue dans le manifeste, sans le dézipper. */
function versionDuPaquet() {
  if (!existsSync(ARCHIVE)) return null;
  // Le manifeste est stocké sans compression : on le retrouve par son contenu.
  const brut = readFileSync(ARCHIVE).toString('latin1');
  const index = brut.indexOf('"version"');
  if (index === -1) return null;
  const trouve = brut.slice(index).match(/"version"\s*:\s*"([^"]+)"/);
  return trouve ? trouve[1] : null;
}

/**
 * L'entrée d'une version dans un journal des versions, en texte brut.
 *
 * Le champ « What's new » du portail est en **texte brut** : ni titres, ni
 * étoiles, ni liens. Le journal, lui, est du Markdown — c'est un document qu'on
 * lit dans le dépôt. La mise à plat vit donc ici, une fois : les titres de
 * section deviennent une ligne à deux-points, les puces restent des tirets, et
 * l'emphase comme les liens perdent leur balisage.
 *
 * Rend `null` quand la version n'a pas d'entrée : l'appelant écrit alors ce qui
 * manque, plutôt que de déposer une note vide sans le dire.
 *
 * @param {string} source Contenu du journal des versions.
 * @param {string} version La version cherchée, telle que le manifeste la porte.
 * @param {{ espaceInsensible?: boolean }} [options] `true` pour le français, où
 *   les deux-points se détachent par une espace.
 * @returns {string|null}
 */
export function noteDeVersion(source, version, options = {}) {
  if (typeof source !== 'string' || typeof version !== 'string' || version === '') return null;

  // Le titre de la version, puis tout ce qui suit jusqu'au titre suivant : le
  // journal est ordonné du plus récent au plus ancien, et les sections ne
  // s'imbriquent pas.
  const debut = source.search(new RegExp(`^## \\[${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'm'));
  if (debut === -1) return null;
  const apres = source.slice(debut);
  const ligneSuivante = apres.indexOf('\n## ', 1);
  const corps = ligneSuivante === -1 ? apres : apres.slice(0, ligneSuivante);

  const separateur = options.espaceInsensible ? ' :' : ':';
  const lignes = [];
  for (const brute of corps.split('\n').slice(1)) {
    const ligne = brute.trimEnd();

    // Un titre de section : la catégorie de Keep a Changelog, en clair.
    const titre = ligne.match(/^#{3,}\s+(.*)$/);
    if (titre) {
      lignes.push('', `${titre[1].trim()}${separateur}`);
      continue;
    }

    lignes.push(ligne
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1'));
  }

  // Les lignes vides se suivent au début (le titre en laisse une) et se
  // multiplient entre les sections : on les ramène à une seule.
  return lignes.join('\n').replace(/\n{3,}/g, '\n\n').trim() || null;
}

/**
 * Engendre la feuille.
 *
 * Le corps est dans une fonction, et non au niveau du module : `noteDeVersion`
 * doit pouvoir être importée par les tests sans que l'écriture du fichier ne se
 * déclenche au passage.
 */
function main() {
  const listing = JSON.parse(readFileSync(LISTING, 'utf8'));
  const journal = readFileSync(CHANGELOG, 'utf8');
  const journalFr = readFileSync(CHANGELOG_FR, 'utf8');
  const version = versionDuPaquet();
  const octets = existsSync(ARCHIVE) ? statSync(ARCHIVE).size : 0;
  // La note suit la version du **paquet** : c'est celle que le magasin lira.
  const note = noteDeVersion(journal, version);
  const noteFr = noteDeVersion(journalFr, version, { espaceInsensible: true });

  const lignes = [];
  const titre = (niveau, texte) => lignes.push(`${'#'.repeat(niveau)} ${texte}`, '');
  const champ = (nom, valeur) => {
    lignes.push(`### ${nom}`, '', '```text', String(valeur ?? '—').trim(), '```', '');
  };

  lignes.push(
    `<!-- Feuille engendrée par scripts/preparer-soumission.mjs — ne pas éditer à la main.`,
    `     Sources : store/listing.json, CHANGELOG*.md, dist/*.zip. -->`,
    '',
  );
  titre(1, `Mise à jour ${version ?? '?'} — de quoi remplir la console`);

  titre(2, 'L’élément');
  lignes.push(
    `- Identifiant : \`${listing.item.itemId}\``,
    `- Console : <${'https://chrome.google.com/webstore/devconsole'}>`,
    `- Fiche publique : <${listing.item.url}>`,
    `- Version publiée : **${listing.item.publishedVersion}** · version du paquet : **${version ?? 'absente'}**`,
    `- Politique de confidentialité : <${listing.privacyPolicyUrl}>`,
    '',
  );

  titre(2, 'Le paquet à déposer');
  lignes.push(
    `- Fichier : \`dist/url-qrcode-printer-chrome.zip\``
      + (octets ? ` — ${Math.round(octets / 1024)} Kio` : ' — **absent : lancez `npm run package:chrome`**'),
    `- Onglet **Package** → *Upload new package* : on **remplace** le paquet, on ne crée pas de second élément.`,
    '',
  );

  titre(2, 'Les champs de la fiche');
  champ('Nom', listing.item.name);
  champ('Résumé court (limite 132 caractères) — français', listing.summary.fr);
  champ('Résumé court — anglais', listing.summary.en);
  champ('Description détaillée — français', listing.description.fr);
  champ('Description détaillée — anglais', listing.description.en);
  champ('Objectif unique (*single purpose*)', listing.singlePurpose);

  titre(3, 'Justification des permissions');
  for (const [nom, texte] of Object.entries(listing.permissionJustifications)) {
    champ(nom, texte);
  }

  titre(3, 'Code distant');
  lignes.push(
    `- L’extension emploie-t-elle du code distant ? **${listing.remoteCode.uses ? 'oui' : 'non'}**`,
    '',
  );
  champ('Justification', listing.remoteCode.justification);

  titre(3, 'Usage des données (cases à cocher)');
  const donnees = listing.dataUsage?.collected ?? {};
  lignes.push(
    '| Catégorie | Cochée |',
    '|---|---|',
    ...Object.entries(donnees).map(([nom, valeur]) => `| ${nom} | ${valeur ? '**oui**' : 'non'} |`),
    '',
  );
  if (listing.dataUsage?.certifications) {
    lignes.push('Certifications :', '');
    for (const [nom, valeur] of Object.entries(listing.dataUsage.certifications)) {
      lignes.push(`- ${nom} : ${valeur ? 'oui' : 'non'}`);
    }
    lignes.push('');
  }

  titre(2, 'Les visuels à déposer');
  lignes.push('| Champ de la console | Fichier | État |', '|---|---|---|');
  for (const { champ: nom, chemins } of VISUELS) {
    for (const chemin of chemins) {
      const present = existsSync(join(ROOT, chemin));
      lignes.push(`| ${nom} | \`${chemin}\` | ${present ? 'présent' : '**absent**'} |`);
    }
  }
  lignes.push('');

  titre(2, 'La note de version (« What’s new »)');
  lignes.push(
    'Elle est **lue dans le journal des versions** (`CHANGELOG.md` et',
    '`CHANGELOG.fr.md`), mise à plat : le champ du portail est en texte brut, et il',
    'ne se décline pas par langue. La version anglaise est celle que lit la majorité',
    'des visiteurs.',
    '',
  );
  if (note === null || noteFr === null) {
    const manquantes = [note === null ? 'CHANGELOG.md' : null, noteFr === null ? 'CHANGELOG.fr.md' : null]
      .filter(Boolean).join(' et ');
    lignes.push(
      `> **Aucune entrée pour la version ${version ?? '?'}** dans ${manquantes}.`,
      '> Ajoutez-la avant de déposer : une version sans entrée part sans note.',
      '',
    );
  }
  champ('Anglais', note ?? 'à écrire : entrée absente du journal des versions');
  champ('Français', noteFr ?? 'à écrire : entrée absente du journal des versions');

  titre(2, 'Après l’acceptation');
  lignes.push(
    `- Reporter la version acceptée dans \`item.publishedVersion\` de \`store/listing.json\``
      + ` (aujourd’hui \`${listing.item.publishedVersion}\`) : c’est le seul endroit où le`
      + ' guet du dépôt devient aveugle s’il est oublié.',
    '',
  );

  writeFileSync(SORTIE, `${lignes.join('\n').trimEnd()}\n`, 'utf8');

  console.log(`✓ ${SORTIE.replace(`${ROOT}/`, '')}`);
  console.log(`  version ${version ?? '?'} · ${listing.item.publishedVersion} publiée · `
    + `${octets ? `${Math.round(octets / 1024)} Kio` : 'archive absente'}`);
  const manquants = VISUELS.flatMap(({ chemins }) => chemins)
    .filter((chemin) => !existsSync(join(ROOT, chemin)));
  console.log(manquants.length === 0
    ? '  tous les visuels sont présents'
    : `  visuels absents : ${manquants.join(', ')}`);
  if (note === null || noteFr === null) {
    console.log(`  note de version ${version ?? '?'} : **entrée absente du journal des versions**`);
  } else {
    console.log(`  note de version ${version ?? '?'} : lue dans le journal des versions`);
  }
}

// Exécution directe : importer ce module pour sa fonction ne doit rien écrire.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
