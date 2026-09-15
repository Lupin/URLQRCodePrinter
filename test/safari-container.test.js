/**
 * Tests de la correction de la fenêtre de l'application conteneur.
 *
 * Le modèle fourni par Apple contient deux impasses silencieuses. On vérifie
 * que la correction s'applique, et surtout qu'elle **signale** son échec si
 * Apple change son modèle : une correction qui ne s'applique plus en silence
 * serait pire que pas de correction du tout, puisque le bouton paraîtrait de
 * nouveau simplement mort.
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { patchContainerApp } from '../scripts/safari-container-app.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Extrait du modèle d'Apple, recopié tel quel. */
const APPLE_VIEW_CONTROLLER = `import WebKit

#if os(iOS)
import UIKit
#elseif os(macOS)
import Cocoa
import SafariServices
#endif

let extensionBundleIdentifier = "com.example.Extension"

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
#if os(macOS)
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                if #available(macOS 13, *) {
                    webView.evaluateJavaScript("show('mac', \\(state.isEnabled), true)")
                } else {
                    webView.evaluateJavaScript("show('mac', \\(state.isEnabled), false)")
                }
            }
        }
#endif
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
#if os(macOS)
        if (message.body as! String != "open-preferences") {
            return
        }

        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            guard error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                NSApp.terminate(self)
            }
        }
#endif
    }
}
`;

let workDir = '';

/** Construit un projet factice reproduisant l'arborescence générée par Apple. */
function makeProject({ viewController = APPLE_VIEW_CONTROLLER } = {}) {
  const appDir = join(workDir, 'URLQRCodePrinter', 'Shared (App)');
  mkdirSync(join(appDir, 'Resources', 'Base.lproj'), { recursive: true });
  writeFileSync(join(appDir, 'Resources', 'Base.lproj', 'Main.html'), '<html></html>');
  writeFileSync(join(appDir, 'Resources', 'Script.js'), '// apple');
  writeFileSync(join(appDir, 'ViewController.swift'), viewController);
  return workDir;
}

beforeEach(() => {
  rmSync(join(ROOT, 'test', '.tmp-safari'), { recursive: true, force: true });
  workDir = mkdtempSync(join(ROOT, 'test', '.tmp-safari-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

test('la correction remplace la page, le script et le contrôleur', async () => {
  const project = makeProject();
  const result = await patchContainerApp(project);

  assert.deepEqual(result.missing, []);
  assert.equal(result.patched.length, 3);

  const appDir = join(project, 'URLQRCodePrinter', 'Shared (App)');
  assert.notEqual(readFileSync(join(appDir, 'Resources', 'Script.js'), 'utf8'), '// apple');
  assert.ok(existsSync(join(appDir, 'Resources', 'Base.lproj', 'Main.html')));
});

test('le contrôleur ne peut plus échouer en silence sur le bouton', async () => {
  const project = makeProject();
  await patchContainerApp(project);

  const swift = readFileSync(
    join(project, 'URLQRCodePrinter', 'Shared (App)', 'ViewController.swift'),
    'utf8',
  );

  // Le motif fautif d'Apple : sortir sans rien faire quand Safari refuse.
  assert.equal(
    swift.includes('// Insert code to inform the user that something went wrong.'),
    false,
    'le commentaire du modèle d\'Apple ne doit plus subsister',
  );
  assert.match(swift, /showFallback/);
  assert.match(swift, /if error == nil \{/);

  // Le point décisif : l'action ne doit pas dépendre du gestionnaire de Safari,
  // qui peut ne jamais être appelé sur une compilation non signée. Le repli est
  // donc déclenché immédiatement, et Safari activé sans l'attendre.
  const fallbackIndex = swift.indexOf('showFallback');
  const handlerIndex = swift.indexOf('SFSafariApplication.showPreferencesForExtension');
  assert.ok(fallbackIndex !== -1 && handlerIndex !== -1);
  assert.ok(
    fallbackIndex < handlerIndex,
    'le repli doit être déclenché avant l\'appel à Safari, pas depuis son gestionnaire',
  );
  assert.match(swift, /NSWorkspace\.shared\.openApplication/);
});

test('l\'état de l\'extension est affiché même quand il est indisponible', async () => {
  const project = makeProject();
  await patchContainerApp(project);

  const swift = readFileSync(
    join(project, 'URLQRCodePrinter', 'Shared (App)', 'ViewController.swift'),
    'utf8',
  );

  // Le modèle initial sortait de la closure sans rien évaluer : la fenêtre
  // restait alors figée sur « state-unknown », sans explication. Désormais,
  // l'échec affiche un état inconnu et laisse les instructions visibles.
  assert.match(swift, /webView\.evaluateJavaScript\("show\('mac'\)"\)/);

  // Le corps du `guard` doit évaluer quelque chose avant de sortir.
  const guardIndex = swift.indexOf('guard let state = state, error == nil else {');
  assert.notEqual(guardIndex, -1, 'le garde-fou doit subsister');
  const guardBody = swift.slice(guardIndex, guardIndex + 320);
  assert.match(
    guardBody,
    /evaluateJavaScript/,
    'le garde-fou doit afficher quelque chose, pas sortir en silence',
  );

  // La double variante selon la version de macOS n'a plus lieu d'être : le
  // script adapte lui-même le texte.
  assert.equal(swift.includes('#available(macOS 13'), false);
});

test('une action « quitter » est branchée', async () => {
  const project = makeProject();
  await patchContainerApp(project);

  const appDir = join(project, 'URLQRCodePrinter', 'Shared (App)');
  const script = readFileSync(join(appDir, 'Resources', 'Script.js'), 'utf8');
  const html = readFileSync(join(appDir, 'Resources', 'Base.lproj', 'Main.html'), 'utf8');

  assert.match(script, /post\('quit'\)/);
  assert.match(html, /class="platform-mac quit"/);
});

test('le script et la page continuent de fonctionner ensemble', async () => {
  const project = makeProject();
  await patchContainerApp(project);

  const appDir = join(project, 'URLQRCodePrinter', 'Shared (App)');
  const script = readFileSync(join(appDir, 'Resources', 'Script.js'), 'utf8');
  const html = readFileSync(join(appDir, 'Resources', 'Base.lproj', 'Main.html'), 'utf8');

  // Les identifiants et classes manipulés par le script doivent exister.
  for (const id of [...script.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1])) {
    assert.ok(html.includes(`id="${id}"`), `identifiant absent du HTML : ${id}`);
  }
  for (const cls of ['open-preferences', 'quit', 'state-on', 'state-off', 'state-unknown']) {
    assert.ok(html.includes(cls), `classe absente du HTML : ${cls}`);
  }
});

test('un modèle d\'Apple modifié est signalé, pas ignoré', async () => {
  // Si Apple change son gabarit, la correction ne s'applique plus. Le silence
  // serait grave : le bouton paraîtrait de nouveau mort sans explication.
  const project = makeProject({
    viewController: 'import WebKit\n\nclass ViewController {}\n',
  });

  const result = await patchContainerApp(project);
  assert.ok(result.missing.length >= 1, 'l\'absence de motif doit être signalée');
  assert.ok(result.missing.some((entry) => entry.includes('motif Swift introuvable')));
});

test('les gabarits Apple restent compatibles avec Style.css', async () => {
  // On réutilise la feuille de style générée : les classes qu'elle cible
  // doivent être conservées.
  const project = makeProject();
  await patchContainerApp(project);

  const html = readFileSync(
    join(project, 'URLQRCodePrinter', 'Shared (App)', 'Resources', 'Base.lproj', 'Main.html'),
    'utf8',
  );

  assert.match(html, /\.\.\/Style\.css/);
  assert.match(html, /\.\.\/Icon\.png/);
  assert.match(html, /class="platform-ios"/);
  assert.match(html, /class="platform-mac state-on"/);
});
