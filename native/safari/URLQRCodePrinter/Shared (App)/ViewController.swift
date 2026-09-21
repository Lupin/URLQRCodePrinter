//
//  ViewController.swift
//  Shared (App)
//
//  Created by Gael Abegg Gauthey on 21/09/2026.
//

import WebKit

#if os(iOS)
import UIKit
typealias PlatformViewController = UIViewController
#elseif os(macOS)
import Cocoa
import SafariServices
typealias PlatformViewController = NSViewController
#endif

let extensionBundleIdentifier = "com.gael.urlqrcodeprinter.Extension"

class ViewController: PlatformViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

#if os(iOS)
        self.webView.scrollView.isScrollEnabled = false
#endif

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
#if os(iOS)
        webView.evaluateJavaScript("show('ios')")
#elseif os(macOS)
        webView.evaluateJavaScript("show('mac')")

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            DispatchQueue.main.async {
                guard let state = state, error == nil else {
                    // L'état est indisponible : on l'affiche comme inconnu et on
                    // laisse les instructions visibles, plutôt que de ne rien
                    // montrer du tout.
                    webView.evaluateJavaScript("show('mac')")
                    return
                }
                webView.evaluateJavaScript("show('mac', \(state.isEnabled))")
            }
        }
#endif
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
#if os(macOS)
        guard let action = message.body as? String else { return }

        if action == "quit" {
            NSApp.terminate(self)
            return
        }

        guard action == "open-preferences" else {
            return
        }

        // On n'attend pas le gestionnaire de Safari pour agir.
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
        }
#endif
    }

}
