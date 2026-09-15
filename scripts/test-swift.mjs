/**
 * Lance les tests du socle natif NiimbotKit.
 *
 * Deux options sont nécessaires et ni l'une ni l'autre n'est évidente :
 *
 * - `--disable-sandbox` : SwiftPM relance `sandbox-exec` pour compiler le
 *   manifeste. Dans un environnement déjà confiné, ce sandbox imbriqué échoue
 *   avec « sandbox_apply: Operation not permitted ».
 * - `--scratch-path` : les caches par défaut de SwiftPM vivent dans
 *   `~/Library/org.swift.swiftpm` et `~/Library/Caches`. Les rapatrier dans le
 *   paquet évite des avertissements et rend la construction reproductible.
 *
 * `DEVELOPER_DIR` est renseigné par défaut : `xcode-select` peut pointer sur
 * les Command Line Tools, qui ne fournissent pas SwiftPM.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_DIR = join(ROOT, 'native', 'niimbot-kit');

const args = [
  'test',
  '--disable-sandbox',
  '--scratch-path', join(PACKAGE_DIR, '.build'),
  ...process.argv.slice(2),
];

const result = spawnSync('swift', args, {
  cwd: PACKAGE_DIR,
  stdio: 'inherit',
  env: {
    ...process.env,
    DEVELOPER_DIR: process.env.DEVELOPER_DIR ?? '/Applications/Xcode.app/Contents/Developer',
  },
});

if (result.error) {
  console.error(`Swift est introuvable : ${result.error.message}`);
  console.error('Installez Xcode, ou renseignez DEVELOPER_DIR.');
  process.exit(1);
}

process.exit(result.status ?? 1);
