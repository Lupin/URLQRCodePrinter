/**
 * Tests de la préparation App Store du projet Safari.
 *
 * Le risque que ces tests couvrent n'est pas l'échec bruyant, c'est la **perte
 * silencieuse** : `package-safari.mjs` régénère le projet depuis le gabarit
 * d'Apple, qui ne produit ni manifeste de confidentialité ni version alignée.
 * Si la correction ne s'applique plus, la soumission est refusée pour un motif
 * déjà résolu — exactement ce que le module doit empêcher.
 *
 * Deux pièges sont vérifiés explicitement :
 *   - les manifestes ne doivent **pas** atterrir dans
 *     `Shared (Extension)/Resources`, que `sync-safari-resources.mjs` efface ;
 *   - le câblage doit être idempotent, sinon chaque empaquetage dupliquerait
 *     les entrées du pbxproj.
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { patchAppStoreReadiness, resourcesPhaseOf, ID } from '../scripts/safari-appstore.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Cibles telles que le convertisseur d'Apple les nomme. */
const TARGETS = [
  { name: 'URLQRCodePrinter (iOS)', id: 'CCCC00000000000000000001', res: 'EEEE00000000000000000002' },
  { name: 'URLQRCodePrinter (macOS)', id: 'CCCC00000000000000000002', res: 'EEEE00000000000000000004' },
  { name: 'URLQRCodePrinter Extension (iOS)', id: 'CCCC00000000000000000003', res: 'EEEE00000000000000000006' },
  { name: 'URLQRCodePrinter Extension (macOS)', id: 'CCCC00000000000000000004', res: 'EEEE00000000000000000008' },
];

/** Construit un pbxproj minimal mais fidèle à la structure d'Apple. */
function makePbxproj({ omitTarget = null, version = '1.0' } = {}) {
  const kept = TARGETS.filter((target) => target.name !== omitTarget);

  const targetBlocks = kept
    .map(
      (target) => `\t\t${target.id} /* ${target.name} */ = {
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = DDDD00000000000000000001 /* Build configuration list for PBXNativeTarget "${target.name}" */;
\t\t\tbuildPhases = (
\t\t\t\tFFFF00000000000000000001 /* Sources */,
\t\t\t\t${target.res} /* Resources */,
\t\t\t);
\t\t\tname = "${target.name}";
\t\t\tproductType = "com.apple.product-type.application";
\t\t};`,
    )
    .join('\n');

  const phaseBlocks = kept
    .map(
      (target) => `\t\t${target.res} /* Resources */ = {
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};`,
    )
    .join('\n');

  return `// !$*UTF8*$!
{
\tarchiveVersion = 1;
\tobjects = {

/* Begin PBXBuildFile section */
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
/* End PBXFileReference section */

/* Begin PBXGroup section */
\t\tAAAA00000000000000000001 /* root */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\tAAAA00000000000000000002 /* Shared (App) */,
\t\t\t\tAAAA00000000000000000003 /* Shared (Extension) */,
\t\t\t);
\t\t\tsourceTree = "<group>";
\t\t};
\t\tAAAA00000000000000000002 /* Shared (App) */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t);
\t\t\tpath = "Shared (App)";
\t\t\tsourceTree = "<group>";
\t\t};
\t\tAAAA00000000000000000003 /* Shared (Extension) */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t);
\t\t\tpath = "Shared (Extension)";
\t\t\tsourceTree = "<group>";
\t\t};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
${targetBlocks}
/* End PBXNativeTarget section */

/* Begin PBXResourcesBuildPhase section */
${phaseBlocks}
/* End PBXResourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
\t\tDDDD00000000000000000009 /* Debug */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
\t\t\t\tMARKETING_VERSION = ${version};
\t\t\t};
\t\t\tname = Debug;
\t\t};
/* End XCBuildConfiguration section */
\t};
\trootObject = AAAA00000000000000000001 /* Project object */;
}
`;
}

let workDir = '';
let projectLocation = '';

/** Crée l'arborescence générée par Apple, avec un pbxproj paramétrable. */
function makeProject(options = {}) {
  projectLocation = join(workDir, 'safari');
  const projectRoot = join(projectLocation, 'URLQRCodePrinter');

  mkdirSync(join(projectRoot, 'Shared (App)'), { recursive: true });
  mkdirSync(join(projectRoot, 'Shared (Extension)', 'Resources'), { recursive: true });
  mkdirSync(join(projectRoot, 'URLQRCodePrinter.xcodeproj'), { recursive: true });

  writeFileSync(
    join(projectRoot, 'URLQRCodePrinter.xcodeproj', 'project.pbxproj'),
    makePbxproj(options),
    'utf8',
  );

  return projectLocation;
}

/** Chemin du pbxproj du projet courant. */
function pbxprojPath() {
  return join(projectLocation, 'URLQRCodePrinter', 'URLQRCodePrinter.xcodeproj', 'project.pbxproj');
}

beforeEach(() => {
  workDir = mkdtempSync(join(ROOT, 'test', '.tmp-appstore-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

test('les deux manifestes de confidentialité sont écrits', async () => {
  const project = makeProject();
  const result = await patchAppStoreReadiness(project, { version: '0.1.0' });

  assert.deepEqual(result.missing, []);

  for (const relative of ['Shared (App)', 'Shared (Extension)']) {
    const path = join(project, 'URLQRCodePrinter', relative, 'PrivacyInfo.xcprivacy');
    assert.ok(existsSync(path), `manifeste absent : ${relative}`);
    const content = readFileSync(path, 'utf8');
    assert.match(content, /NSPrivacyTracking/);
    assert.match(content, /NSPrivacyCollectedDataTypes/);
  }
});

test('les manifestes restent hors du dossier miroir de sync:safari', async () => {
  // `sync-safari-resources.mjs` supprime tout ce que `dist/extension-safari` ne
  // contient pas. Un manifeste placé dans ce dossier disparaîtrait au premier
  // `npm run sync:safari`, sans le moindre avertissement.
  const project = makeProject();
  await patchAppStoreReadiness(project, { version: '0.1.0' });

  const mirrored = join(
    project,
    'URLQRCodePrinter',
    'Shared (Extension)',
    'Resources',
    'PrivacyInfo.xcprivacy',
  );
  assert.equal(existsSync(mirrored), false, 'le manifeste ne doit pas être dans le miroir');
});

test('les quatre cibles reçoivent leur manifeste', async () => {
  const project = makeProject();
  await patchAppStoreReadiness(project, { version: '0.1.0' });

  const source = readFileSync(pbxprojPath(), 'utf8');

  for (const target of TARGETS) {
    const phase = resourcesPhaseOf(source, target.name);
    assert.equal(phase, target.res, `phase Resources introuvable pour ${target.name}`);

    // La phase doit contenir une entrée de construction, quel qu'en soit l'id.
    const block = source.slice(source.indexOf(`\t\t${target.res} /* Resources */ = {`));
    const body = block.slice(0, block.indexOf('\n\t\t};'));
    assert.match(
      body,
      /PrivacyInfo\.xcprivacy in Resources/,
      `manifeste non rattaché à ${target.name}`,
    );
  }

  // L'app et l'extension doivent pointer sur des références distinctes.
  assert.match(source, new RegExp(`${ID.appFileRef} /\\* PrivacyInfo\\.xcprivacy \\*/`));
  assert.match(source, new RegExp(`${ID.extFileRef} /\\* PrivacyInfo\\.xcprivacy \\*/`));
});

test('le câblage est idempotent', async () => {
  const project = makeProject();
  await patchAppStoreReadiness(project, { version: '0.1.0' });
  const first = readFileSync(pbxprojPath(), 'utf8');

  await patchAppStoreReadiness(project, { version: '0.1.0' });
  const second = readFileSync(pbxprojPath(), 'utf8');

  assert.equal(second, first, 'une seconde exécution ne doit rien changer');

  // Chaque identifiant apparaît exactement deux fois : sa déclaration, puis son
  // rattachement (liste `files` d'une phase, ou `children` d'un groupe). Toute
  // exécution supplémentaire porterait ce compte à 4.
  for (const id of Object.values(ID)) {
    const occurrences = [...second.matchAll(new RegExp(`\\t\\t${id} /\\*`, 'g'))];
    assert.equal(occurrences.length, 2, `entrée dupliquée ou manquante pour ${id}`);
  }
});

test('une cible absente est signalée, pas ignorée', async () => {
  // Le gabarit d'Apple a changé de nom : il faut le dire, sinon le manifeste
  // manquerait dans un bundle sans que personne ne s'en aperçoive.
  const project = makeProject({ omitTarget: 'URLQRCodePrinter Extension (macOS)' });
  const result = await patchAppStoreReadiness(project, { version: '0.1.0' });

  assert.ok(
    result.missing.some((entry) => entry.includes('URLQRCodePrinter Extension (macOS)')),
    'la cible manquante doit être signalée',
  );

  // Le câblage partiel ne doit pas être écrit à moitié.
  const source = readFileSync(pbxprojPath(), 'utf8');
  assert.equal(source.includes(ID.appFileRef), false);
});

test('la version des cibles est alignée sur celle du projet', async () => {
  const project = makeProject({ version: '1.0' });
  await patchAppStoreReadiness(project, { version: '0.1.0' });

  const source = readFileSync(pbxprojPath(), 'utf8');
  assert.match(source, /MARKETING_VERSION = 0\.1\.0;/);
  assert.equal(source.includes('MARKETING_VERSION = 1.0;'), false);
});

test('sans version demandée, la version existante est laissée intacte', async () => {
  const project = makeProject({ version: '1.0' });
  await patchAppStoreReadiness(project);

  const source = readFileSync(pbxprojPath(), 'utf8');
  assert.match(source, /MARKETING_VERSION = 1\.0;/);
});
