/**
 * Prépare le projet Xcode Safari pour une soumission à l'App Store.
 *
 * Pourquoi ce module existe. `package-safari.mjs` régénère **tout** le projet
 * avec `safari-web-extension-packager --force` : chaque référence de fichier,
 * chaque phase de construction et chaque réglage écrit à la main disparaît au
 * prochain empaquetage. Un manifeste de confidentialité ajouté à la main serait
 * donc perdu en silence, et une soumission refusée pour une raison déjà résolue
 * une fois. Comme `safari-container-app.mjs`, ce module s'exécute **après** le
 * convertisseur et réapplique ce que le gabarit d'Apple ne produit pas.
 *
 * Ce qu'il apporte, et pourquoi c'est exigé par Apple :
 *
 *   - `PrivacyInfo.xcprivacy` dans les deux bundles. Apple exige un manifeste de
 *     confidentialité depuis mai 2024 ; son absence est un motif de rejet.
 *   - `MARKETING_VERSION` aligné sur la version déclarée du projet. Le gabarit
 *     d'Apple part sur 1.0, alors que le manifeste de l'extension annonce
 *     0.1.0 : deux versions divergentes pour un même livrable.
 *
 * Ce qu'il ne fait **pas**, volontairement : il ne touche ni aux entitlements
 * (déjà produits par `ENABLE_APP_SANDBOX` et
 * `ENABLE_OUTGOING_NETWORK_CONNECTIONS`), ni à l'équipe de signature, qui
 * dépend d'un compte Apple Developer Program et n'a pas à être inventée ici.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Manifeste de confidentialité.
 *
 * Les quatre rubriques sont vides parce que c'est la vérité du produit, pas par
 * facilité : aucun serveur, aucun compte, aucune mesure d'audience. Les URL
 * capturées restent dans le stockage local de Safari ; les raccourcisseurs
 * tiers ne reçoivent une adresse que sur un clic explicite, et l'éditeur n'y a
 * aucun accès. Rien n'est donc « collecté » au sens d'Apple.
 *
 * Si une mesure d'audience est ajoutée un jour, `NSPrivacyCollectedDataTypes`
 * et `NSPrivacyTracking` devront être renseignés — et la fiche App Store aussi.
 */
const PRIVACY_MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>NSPrivacyTracking</key>
\t<false/>
\t<key>NSPrivacyTrackingDomains</key>
\t<array/>
\t<key>NSPrivacyCollectedDataTypes</key>
\t<array/>
\t<key>NSPrivacyAccessedAPITypes</key>
\t<array/>
</dict>
</plist>
`;

/**
 * Identifiants fixes des entrées insérées dans le pbxproj.
 *
 * Xcode n'exige que l'unicité : une valeur constante rend le module idempotent,
 * là où une valeur aléatoire dupliquerait les entrées à chaque exécution. Le
 * préfixe `FA11E0` ne peut pas entrer en collision avec les identifiants
 * générés par le convertisseur d'Apple.
 */
const ID = {
  appFileRef: 'FA11E0013061496300F8DB9C',
  extFileRef: 'FA11E0023061496300F8DB9C',
  appBuildIos: 'FA11E0033061496300F8DB9C',
  appBuildMac: 'FA11E0043061496300F8DB9C',
  extBuildIos: 'FA11E0053061496300F8DB9C',
  extBuildMac: 'FA11E0063061496300F8DB9C',
};

/** Cibles générées par le convertisseur, et le manifeste qui leur revient. */
const TARGETS = [
  { name: 'URLQRCodePrinter (iOS)', kind: 'app', platform: 'ios' },
  { name: 'URLQRCodePrinter (macOS)', kind: 'app', platform: 'mac' },
  { name: 'URLQRCodePrinter Extension (iOS)', kind: 'extension', platform: 'ios' },
  { name: 'URLQRCodePrinter Extension (macOS)', kind: 'extension', platform: 'mac' },
];

/** Libellé de build pour un type de cible et une plateforme. */
function buildFileId(kind, platform) {
  if (kind === 'app') return platform === 'ios' ? ID.appBuildIos : ID.appBuildMac;
  return platform === 'ios' ? ID.extBuildIos : ID.extBuildMac;
}

/** Échappe une chaîne pour un usage littéral dans une RegExp. */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Relève les cibles natives du projet, avec le corps de chacun de leurs blocs.
 *
 * @param {string} source
 * @returns {Array<{ id: string, body: string, name: string }>}
 */
function nativeTargets(source) {
  const pattern = /\t\t([0-9A-F]{24}) \/\* [^*]+ \*\/ = \{\n\t\t\tisa = PBXNativeTarget;([\s\S]*?)\n\t\t\};/g;
  const targets = [];

  for (const match of source.matchAll(pattern)) {
    const body = match[2];
    const name = body.match(/\n\t\t\tname = ([^;]+);/)?.[1]?.replace(/^"|"$/g, '');
    targets.push({ id: match[1], body, name });
  }

  return targets;
}

/**
 * Trouve l'identifiant de la phase « Resources » d'une cible.
 *
 * Le convertisseur attribue des identifiants aléatoires à chaque génération :
 * on ne peut donc pas les coder en dur, il faut les résoudre par le nom.
 *
 * @param {string} source
 * @param {string} targetName
 * @returns {string | null}
 */
export function resourcesPhaseOf(source, targetName) {
  const target = nativeTargets(source).find((entry) => entry.name === targetName);
  if (!target) return null;
  return target.body.match(/\t\t\t\t([0-9A-F]{24}) \/\* Resources \*\//)?.[1] ?? null;
}

/** Insère une ligne juste avant la fin d'une section `/* Begin … *​/ … }`. */
function insertBeforeSectionEnd(source, section, line) {
  const marker = `/* End ${section} section */`;
  const at = source.indexOf(marker);
  if (at === -1) return null;
  return `${source.slice(0, at)}${line}\n${source.slice(at)}`;
}

/** Insère une ligne juste après l'ouverture d'une liste `files = (` ou `children = (`. */
function insertAfterListOpen(source, sectionStartIndex, key, line) {
  const at = source.indexOf(`${key} = (\n`, sectionStartIndex);
  if (at === -1) return null;
  const insertAt = at + `${key} = (\n`.length;
  return `${source.slice(0, insertAt)}${line}\n${source.slice(insertAt)}`;
}

/**
 * Ajoute les deux manifestes de confidentialité au projet.
 *
 * @param {string} source Contenu du pbxproj.
 * @param {Array<{ target: string, phase: string, buildId: string }>} entries
 * @returns {string | null} Le pbxproj modifié, ou `null` si une ancre manque.
 */
function addPrivacyManifests(source, entries) {
  let updated = source;

  // 1. Références de fichier.
  const fileRefs = [
    `\t\t${ID.appFileRef} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };`,
    `\t\t${ID.extFileRef} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };`,
  ].join('\n');

  updated = insertBeforeSectionEnd(updated, 'PBXFileReference', fileRefs);
  if (updated === null) return null;

  // 2. Entrées de construction, une par cible.
  const buildFiles = entries
    .map(
      (entry) =>
        `\t\t${entry.buildId} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${entry.kindRef} /* PrivacyInfo.xcprivacy */; };`,
    )
    .join('\n');

  updated = insertBeforeSectionEnd(updated, 'PBXBuildFile', buildFiles);
  if (updated === null) return null;

  // 3. Rattachement aux phases « Resources » des quatre cibles.
  for (const entry of entries) {
    const anchor = `\t\t${entry.phase} /* Resources */ = {`;
    const at = updated.indexOf(anchor);
    if (at === -1) return null;

    const next = insertAfterListOpen(
      updated,
      at,
      'files',
      `\t\t\t\t${entry.buildId} /* PrivacyInfo.xcprivacy in Resources */,`,
    );
    if (next === null) return null;
    updated = next;
  }

  // 4. Rattachement aux groupes, pour que Xcode affiche les fichiers.
  for (const [groupName, fileRef] of [
    ['Shared (App)', ID.appFileRef],
    ['Shared (Extension)', ID.extFileRef],
  ]) {
    const anchor = new RegExp(
      `(\\/\\* ${escapeRegExp(groupName)} \\*\\/ = \\{\\n\\t\\t\\tisa = PBXGroup;\\n\\t\\t\\tchildren = \\(\\n)`,
    );
    const match = updated.match(anchor);
    if (!match) return null;
    const insertAt = match.index + match[1].length;
    updated = `${updated.slice(0, insertAt)}\t\t\t\t${fileRef} /* PrivacyInfo.xcprivacy */,\n${updated.slice(insertAt)}`;
  }

  return updated;
}

/**
 * Applique la préparation App Store au projet généré.
 *
 * @param {string} projectLocation Racine du projet Xcode généré.
 * @param {{ version?: string }} [options] Version à inscrire dans les cibles.
 * @returns {Promise<{ patched: string[], missing: string[] }>}
 */
export async function patchAppStoreReadiness(projectLocation, { version } = {}) {
  const projectRoot = join(projectLocation, 'URLQRCodePrinter');
  const pbxprojPath = join(projectRoot, 'URLQRCodePrinter.xcodeproj', 'project.pbxproj');

  const patched = [];
  const missing = [];

  // Les manifestes vont **hors** de `Shared (Extension)/Resources` : ce dossier
  // est un miroir de `dist/extension-safari`, et `sync-safari-resources.mjs` y
  // supprime tout ce qui n'existe pas dans la source. Un manifeste placé là
  // serait effacé au premier `npm run sync:safari`.
  for (const [relative, label] of [
    [join('Shared (App)'), 'Shared (App)/PrivacyInfo.xcprivacy'],
    [join('Shared (Extension)'), 'Shared (Extension)/PrivacyInfo.xcprivacy'],
  ]) {
    const dir = join(projectRoot, relative);
    if (!existsSync(dir)) {
      missing.push(label);
      continue;
    }
    await writeFile(join(dir, 'PrivacyInfo.xcprivacy'), PRIVACY_MANIFEST, 'utf8');
    patched.push(label);
  }

  if (!existsSync(pbxprojPath)) {
    missing.push('project.pbxproj');
    return { patched, missing };
  }

  let source = await readFile(pbxprojPath, 'utf8');
  const before = source;

  // Idempotence : les identifiants étant constants, leur présence signifie que
  // le câblage a déjà été fait. On ne le refait pas, sinon chaque exécution
  // ajouterait des entrées en double.
  const alreadyWired = source.includes(ID.appFileRef);

  if (!alreadyWired) {
    const entries = [];
    for (const target of TARGETS) {
      const phase = resourcesPhaseOf(source, target.name);
      if (!phase) {
        missing.push(`phase Resources de « ${target.name} »`);
        continue;
      }
      entries.push({
        phase,
        buildId: buildFileId(target.kind, target.platform),
        kindRef: target.kind === 'app' ? ID.appFileRef : ID.extFileRef,
      });
    }

    if (entries.length === TARGETS.length) {
      const wired = addPrivacyManifests(source, entries);
      if (wired === null) {
        missing.push('ancres du pbxproj (structure inattendue)');
      } else {
        source = wired;
        patched.push('project.pbxproj (manifestes de confidentialité)');
      }
    }
  }

  if (version) {
    const beforeVersion = source;
    const pattern = /MARKETING_VERSION = [0-9.]+;/g;
    const versions = new Set([...source.matchAll(pattern)].map((m) => m[0]));
    if (versions.size === 0) {
      missing.push('MARKETING_VERSION');
    } else {
      source = source.replace(pattern, `MARKETING_VERSION = ${version};`);
      if (source !== beforeVersion) patched.push(`project.pbxproj (version ${version})`);
    }
  }

  if (source !== before) await writeFile(pbxprojPath, source, 'utf8');

  return { patched, missing };
}

export { PRIVACY_MANIFEST, ID, TARGETS };
