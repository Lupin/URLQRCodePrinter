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
    <p class="platform-mac state-unknown">Extension pas encore autorisée par Safari.</p>
    <p class="platform-mac state-on">L'extension URLQRCodePrinter est active.</p>
    <p class="platform-mac state-off">L'extension URLQRCodePrinter est désactivée.</p>

    <p id="instructions">
        Une compilation locale n'est pas signée par un certificat Apple : Safari
        l'ignore tant que vous ne l'autorisez pas explicitement.
        <br><br>
        <strong>1.</strong> Dans Safari : Réglages → Avancé, cochez
        « Afficher le menu Développeur ».<br>
        <strong>2.</strong> Dans le menu <em>Développeur</em> :
        « Autoriser les extensions non signées ».<br>
        <strong>3.</strong> Puis Réglages → Extensions, cochez
        « URLQRCodePrinter ».
        <br><br>
        Cette fenêtre ne sert qu'à enregistrer l'extension : vous pouvez la
        fermer dès maintenant.
    </p>

    <div class="actions">
        <button class="platform-mac open-preferences">Ouvrir Safari</button>
        <button class="platform-mac quit">Fermer</button>
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

// Appelée quand on tente d'ouvrir les réglages de Safari.
//
// Sur une compilation non signée, Safari refuse — et peut même ne jamais
// rappeler son gestionnaire, ni en succès ni en erreur. On se contente donc de
// rendre la marche à suivre visible, sans écraser le texte détaillé de la page :
// c'est lui qui porte l'information utile.
function showFallback(reason) {
    const instructions = document.getElementById('instructions');
    if (instructions) instructions.hidden = false;
    if (reason) console.warn('Ouverture des réglages refusée :', reason);
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
    to: `        // On n'attend pas le gestionnaire de Safari pour agir.
        //
        // Sur une compilation non signée, il peut **ne jamais être appelé** :
        // ni succès, ni erreur. Le bouton paraissait alors totalement mort,
        // sans même le message d'explication prévu pour l'échec.
        //
        // On affiche donc la marche à suivre immédiatement, et on active Safari
        // — deux opérations qui, elles, aboutissent toujours.
        self.webView.evaluateJavaScript("showFallback()")

        if let safari = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.Safari") {
            NSWorkspace.shared.openApplication(
                at: safari,
                configuration: NSWorkspace.OpenConfiguration(),
                completionHandler: nil
            )
        }

        // Tentative d'ouverture directe des réglages : si elle aboutit, tant
        // mieux, on quitte. Sinon il ne se passe rien de plus — c'est déjà fait.
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            if error == nil {
                DispatchQueue.main.async { NSApp.terminate(self) }
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
