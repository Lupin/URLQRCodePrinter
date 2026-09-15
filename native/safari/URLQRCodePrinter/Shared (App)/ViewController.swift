//
//  ViewController.swift
//  Shared (App)
//
//  Created by Gael Abegg Gauthey on 15/09/2026.
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

        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            DispatchQueue.main.async {
                // Sur une compilation non signée, Safari refuse d'ouvrir ses
                // réglages et renvoie une erreur. Le modèle d'Apple sortait
                // alors sans rien faire : la fenêtre restait ouverte et le
                // bouton semblait mort. On explique la marche à suivre.
                if error == nil {
                    NSApp.terminate(self)
                } else {
                    let reason = (error as NSError?)?.localizedDescription ?? ""
                    self.webView.evaluateJavaScript("showFallback(\"\(reason)\")")
                }
            }
        }
#endif
    }

}
