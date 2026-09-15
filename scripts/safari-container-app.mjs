/**
 * Corrige la fenêtre de l'application conteneur générée par Apple.
 *
 * Le modèle fourni par Apple contient deux impasses silencieuses, toutes deux
 * déclenchées par une compilation non signée — c'est-à-dire exactement notre
 * cas, puisqu'une extension Safari exige des droits que la signature ad-hoc ne
 * sait pas produire :
 *
 *   SFSafariApplication.showPreferencesForExtension(...) { error in
 *       guard error == nil else {
 *           // Insert code to inform the user that something went wrong.
 *           return            // ← ne fait rien du tout
 *       }
 *       NSApp.terminate(self)
 *   }
 *
 * Résultat : le bouton « Quit and Open Safari Extensions Preferences… » semble
 * mort, l'application ne se ferme pas et l'utilisateur n'a aucun moyen de
 * savoir pourquoi. Le même schéma rend l'affichage de l'état muet.
 *
 * Ce module remplace la page, son script et les deux méthodes fautives par des
 * versions qui ne peuvent pas échouer en silence. Il s'exécute après le
 * convertisseur d'Apple, dont la sortie est régénérée à chaque empaquetage.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Page de la fenêtre. On conserve les classes attendues par Style.css d'Apple. */
const MAIN_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <link rel="stylesheet" href="../Style.css">
    <script src="../Script.js" defer></script>
</head>
<body>
    <img src="../Icon.png" width="128" height="128" alt="URLQRCodePrinter">
    <p class="platform-ios">Activez l'extension URLQRCodePrinter dans Réglages → Safari → Extensions.</p>
    <p class="platform-mac state-unknown">Activez l'extension URLQRCodePrinter dans les réglages de Safari.</p>
    <p class="platform-mac state-on">L'extension URLQRCodePrinter est active.</p>
    <p class="platform-mac state-off">L'extension URLQRCodePrinter est désactivée.</p>
    <p id="instructions">
        Safari → Réglages → Extensions → cocher « URLQRCodePrinter ».<br>
        Si elle n'apparaît pas : Safari → Réglages → Avancé → « Afficher le menu
        Développeur », puis Développeur → « Autoriser les extensions non signées ».
    </p>
    <div class="actions">
        <button class="platform-mac open-preferences">Ouvrir les réglages de Safari</button>
        <button class="platform-mac quit">Quitter</button>
    </div>
</body>
</html>
`;

/** Script de la page : ne laisse jamais un clic sans effet. */
const SCRIPT_JS = `// Fenêtre de l'application conteneur.
//
// Deux impasses du modèle d'Apple sont évitées ici : un bouton dont l'action
// échoue sans rien dire, et un état d'extension qui reste indéterminé. Dans les
// deux cas, l'utilisateur reçoit une explication plutôt qu'un silence.

function post(name) {
    webkit.messageHandlers.controller.postMessage(name);
}

function show(platform, enabled) {
    document.body.classList.add('platform-' + platform);

    if (typeof enabled === 'boolean') {
        document.body.classList.toggle('state-on', enabled);
        document.body.classList.toggle('state-off', !enabled);
        document.getElementById('instructions').hidden = enabled;
    } else {
        document.body.classList.remove('state-on');
        document.body.classList.remove('state-off');
    }
}

// Appelée quand Safari refuse d'ouvrir ses réglages — ce qui arrive sur une
// compilation non signée. Sans cela, le bouton paraîtrait simplement mort.
function showFallback(reason) {
    const instructions = document.getElementById('instructions');
    instructions.hidden = false;
    instructions.textContent =
        "Safari n'a pas pu ouvrir ses réglages automatiquement"
        + (reason ? ' (' + reason + ')' : '')
        + ". Ouvrez-les à la main : Safari → Réglages → Extensions.";
}

document.querySelector('button.open-preferences')
    .addEventListener('click', () => post('open-preferences'));
document.querySelector('button.quit')
    .addEventListener('click', () => post('quit'));
`;

/** Remplacements dans ViewController.swift, avec vérification. */
const SWIFT_REPLACEMENTS = [
  {
    // Le bouton : sur erreur, on explique au lieu de ne rien faire.
    from: `        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            guard error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                NSApp.terminate(self)
            }
        }`,
    to: `        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            DispatchQueue.main.async {
                // Sur une compilation non signée, Safari refuse d'ouvrir ses
                // réglages et renvoie une erreur. Le modèle d'Apple sortait
                // alors sans rien faire : la fenêtre restait ouverte et le
                // bouton semblait mort. On explique la marche à suivre.
                if error == nil {
                    NSApp.terminate(self)
                } else {
                    let reason = (error as NSError?)?.localizedDescription ?? ""
                    self.webView.evaluateJavaScript("showFallback(\\"\\(reason)\\")")
                }
            }
        }`,
  },
  {
    // L'état de l'extension : un échec ne doit pas laisser la fenêtre muette.
    from: `            guard let state = state, error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                if #available(macOS 13, *) {
                    webView.evaluateJavaScript("show('mac', \\(state.isEnabled), true)")
                } else {
                    webView.evaluateJavaScript("show('mac', \\(state.isEnabled), false)")
                }
            }`,
    to: `            DispatchQueue.main.async {
                guard let state = state, error == nil else {
                    // L'état est indisponible : on l'affiche comme inconnu et on
                    // laisse les instructions visibles, plutôt que de ne rien
                    // montrer du tout.
                    webView.evaluateJavaScript("show('mac')")
                    return
                }
                webView.evaluateJavaScript("show('mac', \\(state.isEnabled))")
            }`,
  },
  {
    // Une action « quitter » explicite, pour ne jamais rester bloqué.
    from: `        if (message.body as! String != "open-preferences") {
            return
        }`,
    to: `        guard let action = message.body as? String else { return }

        if action == "quit" {
            NSApp.terminate(self)
            return
        }

        guard action == "open-preferences" else {
            return
        }`,
  },
];

/**
 * Applique la correction au projet généré.
 *
 * @param {string} projectLocation Racine du projet Xcode généré.
 * @returns {Promise<{ patched: string[], missing: string[] }>}
 */
export async function patchContainerApp(projectLocation) {
  const appDir = join(projectLocation, 'URLQRCodePrinter', 'Shared (App)');
  const patched = [];
  const missing = [];

  const resourcesDir = join(appDir, 'Resources', 'Base.lproj');
  const scriptDir = join(appDir, 'Resources');

  if (existsSync(resourcesDir)) {
    await writeFile(join(resourcesDir, 'Main.html'), MAIN_HTML, 'utf8');
    patched.push('Main.html');
  } else {
    missing.push('Main.html');
  }

  if (existsSync(scriptDir)) {
    await writeFile(join(scriptDir, 'Script.js'), SCRIPT_JS, 'utf8');
    patched.push('Script.js');
  } else {
    missing.push('Script.js');
  }

  const controllerPath = join(appDir, 'ViewController.swift');
  if (!existsSync(controllerPath)) {
    missing.push('ViewController.swift');
    return { patched, missing };
  }

  let source = await readFile(controllerPath, 'utf8');
  const applied = [];

  for (const { from, to } of SWIFT_REPLACEMENTS) {
    if (!source.includes(from)) {
      // Le modèle d'Apple a changé : mieux vaut le signaler que de laisser
      // croire que la correction a été appliquée.
      missing.push(`motif Swift introuvable : ${from.split('\n')[0].trim().slice(0, 60)}…`);
      continue;
    }
    source = source.replace(from, to);
    applied.push(from.split('\n')[0].trim().slice(0, 40));
  }

  if (applied.length > 0) {
    await writeFile(controllerPath, source, 'utf8');
    patched.push(`ViewController.swift (${applied.length} remplacement(s))`);
  }

  return { patched, missing };
}
