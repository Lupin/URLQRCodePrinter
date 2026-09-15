# Matrice de capacités — extension navigateur qui capture l'URL de l'onglet courant

**Périmètre** : capture de l'URL de l'onglet courant via (a) clic droit / menu contextuel et (b) bouton de barre d'outils, avec stockage local.
**Cibles** : Safari macOS (17 / 18 / 26), Safari iOS-iPadOS (17 / 18 / 26), Brave (Chromium/MV3) macOS.
**Date de recherche** : mars 2026. Safari courant = 26.x ; Safari 27 est en Technology Preview.

## Conventions de fiabilité

| Marque | Signification |
| --- | --- |
| `[DOC]` | Documenté par l'éditeur (Apple, Chrome Developers), MDN, ou caniuse |
| `[SRC]` | Vérifié dans le code source de la plateforme (WebKit, brave-browser) |
| `[TERRAIN]` | Rapporté par la communauté / fil d'issue, non confirmé par la doc |
| `non vérifié` | Aucune source trouvée — **ne pas présumer** |

Sources de compatibilité : Apple renvoie explicitement les développeurs vers la table de compatibilité MDN — *« To evaluate compatibility for JavaScript extension APIs in your Safari web extension, see Mozilla's compatibility table »* ([Assessing your Safari web extension's browser compatibility](https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility)). MDN Browser Compat Data (BCD) est donc la référence de compatibilité **cautionnée par Apple** pour Safari.

> ⚠️ **Limite méthodologique importante sur BCD** : pour de nombreuses entrées, `safari_ios` vaut `"mirror"`, ce qui signifie « même version que `safari` », une **extrapolation de MDN** et non une vérification sur iOS. Les lignes concernées sont signalées ci-dessous.

---

## 1. Tableau matriciel

### 1.1 API d'extension

| Capacité | Safari macOS | Safari iOS | Brave macOS | Source / note |
| --- | --- | --- | --- | --- |
| **`contextMenus` / `menus` (clic droit)** | ✅ Safari 14+ | ❌ **Non supporté** | ✅ Chromium | BCD `menus` : `safari: 14` (`alternative_name: contextMenus`), **`safari_ios: false`**. Chrome : `chrome.contextMenus`, permission `contextMenus` |
| Déclaration de permission | ✅ `"permissions": ["contextMenus"]` **ou** `["menus"]` | — | ✅ `"permissions": ["contextMenus"]` (seul nom accepté) | `[SRC]` WebKit `WebExtension::supportedPermissions()` contient **les deux** : `WebExtensionPermission::contextMenus()` → `"contextMenus"` et `menus()` → `"menus"`. MDN : `contextMenus` est un alias valide. **Recommandation cross-browser : `"contextMenus"`** |
| `contexts` (page, link, selection, image, tab, action…) | ✅ Safari 14+ | ❌ | ✅ | BCD `menus.ContextType` safari 14 / ios false ; [Chrome ContextType](https://developer.chrome.com/docs/extensions/reference/api/contextMenus) |
| `documentUrlPatterns` | ✅ | ❌ | ✅ | `[SRC]` WebKit commit [7a3236b](https://github.com/WebKit/WebKit/commit/7a3236ba274c5374337531088e431b1ce8728a77) : `WebExtensionMenuItem::matches` applique `documentPatterns()` (y compris pour les contextes `action` et `tab`) |
| `targetUrlPatterns` (href des `<a>`, src des `<img>`) | ✅ | ❌ | ✅ | `[SRC]` même fichier : `matchesPattern(targetPatterns(), contextParameters.linkURL)` sur le contexte Link |
| `menus.onClicked` : `pageUrl` | ✅ (frame principale seulement) | ❌ | ✅ | `[SRC]` WebKit `WebExtensionAPIMenusCocoa.mm` : `pageURL` n'est renseigné que `if (isMainFrame(...))`, sinon `frameUrl` |
| `menus.onClicked` : `linkUrl` | ✅ | ❌ | ✅ | `[SRC]` WebKit : `info[linkURLKey] = contextParameters.linkURL…` |
| `menus.onClicked` : `selectionText` | ✅ | ❌ | ✅ | `[SRC]` WebKit : `info[selectionTextKey] = contextParameters.selectionString…` |
| `menus.onClicked` : `srcUrl`, `mediaType`, `editable`, `frameId` | ✅ | ❌ | ✅ | `[SRC]` WebKit `WebExtensionAPIMenusCocoa.mm` |
| `menus.getTargetElement`, `overrideContext`, `refresh`, `onShown`, `onHidden` | ❌ | ❌ | ✅ (Chromium partiel) | BCD : `safari: false` pour chacun. `onShown`/`onHidden` sont Firefox-only |
| `menus.create` : héritage de `contexts` du parent | ⚠️ Pas d'héritage | — | ⚠️ Pas d'héritage | Note BCD Chrome **et** Safari : *« Items that don't specify `contexts` do not inherit contexts from their parents »* |
| **`action` (bouton barre d'outils, MV3)** | ✅ Safari 15.4+ | ✅ iOS 15.4+ (`mirror`) | ✅ Chrome 88+ | BCD `manifest/action` : safari 15.4 « Manifest V3 or later », `safari_ios: mirror` |
| `browser_action` / `page_action` (MV2) | ✅ Safari 14+ | ✅ iOS 15+ | ✅ | BCD `manifest/browser_action` : safari 14 (MV2 uniquement), safari_ios 15 |
| Popup attaché à l'action | ✅ | ✅ | ✅ | `[DOC]` [WWDC26 s.216](https://developer.apple.com/videos/play/wwdc2026/216/) : « the extension's action button… Safari will display a popup with the UI that you've defined » |
| `action.onClicked` | ✅ 15.4+ | ⚠️ (`mirror`, non vérifié sur iOS) | ✅ | BCD |
| `action.openPopup` | ✅ Safari 16+ | ⚠️ (`mirror`) | ✅ Chrome 118/127 | BCD |
| `action.setTitle` | ✅ 15.4+ | ⚠️ **API présente mais titre invisible dans l'UI** | ✅ | Note BCD explicite pour `safari_ios` |
| `action.setBadgeBackgroundColor` | ⚠️ API présente, **sans effet** | ⚠️ idem | ✅ | Note BCD Safari |
| `action.getUserSettings` / `setBadgeTextColor` / `UserSettingsChange` | ❌ | ❌ | ✅ | BCD `safari: false` |
| **`storage.local`** | ✅ Safari 14+ | ✅ iOS 15+ | ✅ Chrome 19+ | BCD. Quota Safari : **non vérifié** (voir §5) |
| **`storage.sync`** | ⚠️ Présent mais **ne synchronise pas** — se comporte comme `local` | ⚠️ idem | ✅ | BCD `storage.sync` `safari: {partial_implementation: true, notes: ["Safari does not sync items saved in the `sync` storage area…"]}`. Bug Safari 15/15.1 : les items `sync` étaient écrits dans `local` |
| `storage.session` | ✅ Safari 16.4+ | ⚠️ (`mirror`) | ✅ Chrome 102+ | BCD |
| `storage.managed` | ❌ | ❌ | ✅ Chrome 33+ | BCD `safari: false` |
| `unlimitedStorage` (permission) | ✅ acceptée | ✅ acceptée (effet réel **non vérifié**) | ✅ | `[SRC]` WebKit `supportedPermissions()`. Effet sur le quota : voir §5 |
| **`tabs`** (`query`, `get`, `onUpdated`…) | ✅ Safari 14+ | ✅ iOS 15+ | ✅ Chrome 4+ | BCD `tabs` : safari 14, safari_ios 15 |
| `tabs.captureVisibleTab` | ✅ (permission `<all_urls>` requise, défaut `jpeg`) | ✅ idem | ✅ | Note BCD Safari |
| `tabs.executeScript` / `insertCSS` / `removeCSS` | ⚠️ **MV2 uniquement** | ⚠️ MV2 uniquement | ⚠️ MV2 uniquement | BCD : *« Available for use in Manifest V2 only »* |
| `tabs.getCurrent` | ⚠️ Retourne aussi l'onglet actif des pages popup/background | ⚠️ idem | ✅ | Note BCD Safari |
| `tabs.create` / `update` / `remove` / `reload`, `onActivated`, `onCreated`, `onRemoved`, `onUpdated`, `sendMessage` | ✅ | ✅ | ✅ | BCD |
| `tabs.move`, `highlight`, `group`, `hide`, `show`, `discard`, `print`, `saveAsPDF`, `setZoomSettings` | ❌ | ❌ | Partiel | BCD `safari: false` |
| **`scripting` (MV3)** | ✅ Safari 15.4+ (MV2 *ou* MV3) | ✅ iOS 15.4+ (`mirror`) | ✅ Chrome 88+ (MV3) | BCD |
| `scripting.registerContentScripts` & co. | ✅ Safari 16.4+ | ⚠️ (`mirror`) | ✅ Chrome 96+ | BCD |
| Content scripts déclarés (`content_scripts` + `matches`) | ✅ | ✅ | ✅ | `[DOC]` Apple, [Managing Safari web extension permissions](https://developer.apple.com/documentation/safariservices/managing-safari-web-extension-permissions) |
| **`activeTab`** | ✅ | ✅ | ✅ | `[DOC]` Apple recommande `activeTab` pour minimiser les demandes d'accès ; `[DOC]` Tech Talk 110148 : sur Mac, accordé via barre d'outils, raccourci clavier **ou menu contextuel** |
| `runtime.sendMessage` / `onMessage` / `tabs.sendMessage` | ✅ Safari 14+ | ✅ iOS 15+ | ✅ | BCD |
| **Background `persistent: false`** | ✅ | ✅ **obligatoire** | ✅ (préféré) | `[DOC]` Apple : *« In iOS, you must make your background page nonpersistent »*. Le packager avertit : *« iOS extensions require nonpersistent background pages »* |
| Background `"persistent": true` | ✅ | ❌ **Erreur de chargement** | ✅ | `[DOC]`/`[TERRAIN]` WWDC21 s.10104 : dans Réglages iOS, message « Extensions on iOS must have a non-persistent background page » |
| Background `service_worker` (MV3) | ✅ Safari 15.4+ | ✅ iOS 15.4+ | ✅ | `[DOC]` Apple ; `[DOC]` WWDC26 s.216 : « Safari supports both » (page de fond et service worker) |
| Exécution en arrière-plan continue | ⚠️ Non : page non persistante déchargée | ❌ Idem, plus agressif | ✅ Service worker MV3 (avec limites Chromium) | `[DOC]` Apple : *« Safari unloads your nonpersistent background page when the user isn't directly interacting with the extension »* |
| **`commands` (manifest)** | ⚠️ 14–25 partiel ; ✅ **complet à partir de Safari 26** | ⚠️ iOS 15+ mais **raccourci non modifiable** | ✅ Chrome 25+ | BCD `manifest/commands` ; `[DOC]` [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) : *« Web Extension commands are now shown in the menubar on macOS and iPadOS. On macOS, users can customize the keyboard shortcut »* |
| `declarativeNetRequest` | ✅ | ✅ | ✅ | `[DOC]` WWDC26 s.216 (démo complète) ; `[SRC]` WebKit `supportedPermissions()` |
| `browser.downloads` | ❌ | ❌ | ✅ | BCD `downloads` : `safari: false` |
| `browser.clipboard` | ❌ | ❌ | ✅ | BCD : `safari: false` |
| `browser.notifications` | ❌ | ❌ | ✅ | BCD : `safari: false` |
| MV3 | ✅ Safari 15.4+ | ✅ iOS 15.4+ | ✅ | `[DOC]` Apple compat : *« Safari 15.4 and later supports manifest versions 2 and 3 »* ; `[DOC]` Brave : *« MV3 extensions will work in Brave just as they do in Chrome »* |

### 1.2 Communication avec une app native

| Capacité | Safari macOS | Safari iOS | Brave macOS | Source / note |
| --- | --- | --- | --- | --- |
| **JS → app native** (`browser.runtime.sendNativeMessage`) | ✅ Safari 14+, via `SafariWebExtensionHandler` | ✅ iOS 15+ | ✅ Chrome 29+ (hôte Native Messaging externe) | BCD `runtime.sendNativeMessage` safari 14 / safari_ios 15 renvoyant vers la doc Apple. `[DOC]` Apple : *« From a script running in the browser or Mac web app, use `browser.runtime.sendNativeMessage` »* |
| **App native → JS** (`SFSafariApplication.dispatchMessage` + port `connectNative`) | ✅ macOS uniquement | ❌ **Impossible** | s.o. | `[DOC]` Apple, [Messaging between the app and JavaScript](https://developer.apple.com/documentation/safariservices/messaging-between-the-app-and-javascript-in-a-safari-web-extension) : *« You can't send messages from a containing iOS app to your web extension's JavaScript scripts »* |
| `runtime.connectNative` : sémantique | ⚠️ **Différente de Chrome** : `application.id` est **ignoré**, le message va à l'app extension conteneuse | ⚠️ idem | ✅ Hôte NM déclaré dans un manifeste JSON natif | `[DOC]` Apple : *« Safari ignores the `application.id` parameter and only sends the message to the containing app's native app extension »* |
| Contenu d'un message natif | ✅ clé `SFExtensionMessageKey` ; `SFExtensionProfileKey` (UUID de profil) depuis Safari 17 | ✅ `SFExtensionMessageKey` | ✅ | `[DOC]` Apple |
| Content script → app native | ❌ | ❌ | ✅ | `[DOC]` Apple : *« Content scripts that are injected into web content cannot send messages to the native app extension »* |
| Permission requise | `"nativeMessaging"` | `"nativeMessaging"` | `"nativeMessaging"` | `[DOC]` Apple |
| **App Groups** (conteneur partagé app ↔ app extension) | ✅ | ✅ | s.o. | `[DOC]` Apple : *« You can store data in a shared space that both the macOS or iOS app and the native app extension can access and update, by enabling app groups »* |
| Alternative native : **Safari App Extension** (`SFSafariExtensionHandler`, Swift/ObjC) | ✅ macOS / Mac Catalyst uniquement | ❌ **N'existe pas sur iOS** | s.o. | `[DOC]` Apple [Safari app extensions](https://developer.apple.com/documentation/safariservices/safari-app-extensions) : distribué avec une app Mac ou Mac Catalyst |
| XPC | `non vérifié` comme mécanisme officiel documenté pour les extensions Safari | ❌ (XPC indisponible sur iOS) | s.o. | Aucune source Apple trouvée qui documente XPC pour la communication extension ↔ app |
| URL schemes (`CFBundleURLTypes`) | `non vérifié` | `non vérifié` | s.o. | Aucune source Apple trouvée pour ce chemin depuis une extension web Safari |

### 1.3 Empaquetage et distribution

| Capacité | Safari macOS | Safari iOS | Brave macOS | Source / note |
| --- | --- | --- | --- | --- |
| Projet Xcode (app conteneuse + cible « Safari Web Extension ») | ✅ | ✅ | s.o. | `[DOC]` Apple [Packaging a web extension for Safari](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari) |
| Conversion depuis une extension Chrome/Firefox | ✅ `xcrun safari-web-extension-packager /chemin` (ancien nom : `safari-web-extension-converter`) | ✅ même commande | s.o. | `[DOC]` Apple. Options : `--copy-resources`, `--rebuild-project`. Par défaut le projet **référence** les fichiers d'origine (pas de copie) |
| Ajouter iOS à un projet macOS existant | ✅ `xcrun safari-web-extension-packager --rebuild-project /chemin/monExt.xcodeproj` | ✅ | s.o. | `[DOC]` Apple ; `[DOC]` WWDC21 s.10104 |
| Avertissements de compatibilité | ✅ le packager liste les clés de manifeste non supportées | ✅ | s.o. | `[DOC]` Apple |
| Test sans Xcode (macOS) | ✅ Réglages Safari → Développeur → « Add Temporary Extension… » (expire en 24 h) | ❌ | s.o. | `[DOC]` Apple [Running your Safari web extension](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension) |
| Test sur appareil iOS | — | ⚠️ Nécessite l'Apple Developer Program pour un vrai appareil ; simulateur libre | s.o. | `[DOC]` Apple |
| **Packager web dans App Store Connect** (Xcode Cloud) | ✅ | ✅ | s.o. | `[DOC]` [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) : *« The new web-based Safari Web Extension Packager… available in App Store Connect and uses Xcode Cloud »* — **empaquetage sans Mac** |
| TestFlight (bêta) | ✅ | ✅ | s.o. | `[DOC]` Apple [Distributing your Safari web extension](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension) ; `[DOC]` WWDC26 s.216 |
| Signature / notarisation hors Mac App Store | ✅ Developer ID + notarisation | s.o. (iOS = App Store uniquement) | s.o. | `[DOC]` Apple |
| Synchronisation de l'extension entre appareils | ✅ Safari 16+ | ✅ Safari 16+ | s.o. | `[DOC]` Apple [Syncing Safari web extensions](https://developer.apple.com/documentation/safariservices/syncing-safari-web-extensions-across-devices-and-platforms). Même bundle ID → automatique ; sinon clés `SFSafariCorrespondingIOSAppBundleIdentifier` / `...MacOSAppBundleIdentifier` |
| Chrome Web Store | s.o. | s.o. | ✅ | `[DOC]` Brave : *« any extension found in the Chrome Web Store will also work in Brave »* |

### 1.4 API du Web (hors WebExtensions) utiles

| Capacité | Safari macOS | Safari iOS | Brave macOS | Source / note |
| --- | --- | --- | --- | --- |
| **Web Bluetooth** (`navigator.bluetooth`) | ❌ **Non supporté** | ❌ **Non supporté** | ⚠️ **Désactivé par défaut** — activable via `brave://flags#brave-web-bluetooth-api` | caniuse : Safari ❌ 3.1→26.6, 27, 27.1→TP : « Not supported » ; BCD `api/Bluetooth` : `safari: false`, `impl_url: https://webkit.org/b/101034`. Brave : `[SRC]` brave-browser [#31605](https://github.com/brave/brave-browser/issues/31605) (flag ajouté, vérifié sur Brave 1.59.100 / Chromium 117 / macOS 14 arm64), [#34941](https://github.com/brave/brave-browser/issues/34941) **toujours ouvert**, commentaire mai 2025 : *« It is a feature that has a major effect on user privacy, so it is disabled. But you can enable it in `brave://flags` »* |
| Web Bluetooth — Chrome macOS | s.o. | s.o. | ✅ (Chrome) | caniuse : Chrome ✅ 56→155. BCD : `partial_implementation: true`, macOS uniquement de 56 à 70, puis 70+ (Linux non activé par défaut) |
| **File System Access API** (`showSaveFilePicker`, `showOpenFilePicker`, `showDirectoryPicker`) | ❌ | ❌ | ⚠️ **Désactivé par défaut** — activable via `brave://flags/#file-system-access-api` | BCD `Window.showSaveFilePicker` : `chrome: 86`, **`safari: false`**. Brave : [#11407](https://github.com/brave/brave-browser/issues/11407) « Remove support for native file system API » (fermé 2021-01-28) ; [#44411](https://github.com/brave/brave-browser/issues/44411) fermé « completed » 2025-03-14 avec la réponse : *« `brave://flags/#file-system-access-api` — Brave has allowed it for a while »* |
| File System WritableStream API | ⚠️ Safari 26+ (écriture, **pas** de sélecteur de fichier) | ⚠️ idem | ✅ | `[DOC]` WebKit blog Safari 26.0 : *« support for the File System WritableStream API, enabling direct writing to files within the user's file system »* — n'ouvre pas l'accès au sélecteur |
| `navigator.clipboard` | `non vérifié` dans une page d'extension Safari | `non vérifié` | ✅ | Aucune source spécifique trouvée sur le comportement en page d'extension Safari |
| `<a download>` dans une page d'extension | `non vérifié` | `non vérifié` | ✅ | Repli plausible mais non sourcé |

### 1.5 Quotas de stockage

| Capacité | Safari macOS | Safari iOS | Brave macOS | Source / note |
| --- | --- | --- | --- | --- |
| `storage.local` | ✅ (quota **non vérifié**) | ✅ (quota **non vérifié**) | ✅ **10 Mo** (5 Mo jusqu'à Chrome 113), extensible via `"unlimitedStorage"` | `[DOC]` [chrome.storage](https://developer.chrome.com/docs/extensions/reference/api/storage) |
| `storage.sync` | ⚠️ ne synchronise pas | ⚠️ ne synchronise pas | ✅ ~**100 Ko** au total, **8 Ko par item** | `[DOC]` Chrome ; note BCD Safari |
| `storage.session` | ✅ 16.4+ | ✅ (`mirror`) | ✅ **10 Mo** (1 Mo jusqu'à Chrome 111) | `[DOC]` Chrome ; BCD |
| `unlimitedStorage` | ✅ permission acceptée | ✅ permission acceptée | ✅ | `[SRC]` WebKit `supportedPermissions()` |

---

## 2. Ce qui est impossible — et pourquoi

### 2.1 Safari iOS : pas de menu contextuel de page (clic droit)

**Impossible.** MDN BCD documente `menus` / `contextMenus` avec **`safari_ios: false`** pour l'API et pour *chacune* de ses méthodes (`create`, `remove`, `update`, `onClicked`…). Aucun navigateur iOS n'expose de menu contextuel de page programmable : iOS n'a pas de « clic droit », et le menu contextuel natif de Safari iOS n'est pas exposé aux extensions.

> **Nuance à tester (voir §5.1)** : le code source WebKit de la branche `main` ne restreint **pas** l'API menus à macOS — `WebKit::WebExtensionAction::platformMenuItems()` construit un `UIMenu` sur iOS, et `WKWebExtensionAction.menuItems` est déclaré sous `#if TARGET_OS_IPHONE` en `NSArray<UIMenuElement *>`. Il est donc possible que des items `contexts: ["action"]` apparaissent dans la feuille d'actions de l'extension sur iOS. **Ce n'est pas documenté et contredit BCD → à vérifier sur appareil avant de bâtir dessus.**

**Conséquence de conception** : sur iOS, le clic droit ne peut pas être l'un des deux points d'entrée demandés. Le point d'entrée « bouton de barre d'outils » (popup via `browser.action`) reste seul disponible.

### 2.2 Safari iOS : pas d'exécution en arrière-plan réelle

**Impossible.** Apple impose une page de fond **non persistante** : *« In iOS, you must make your background page nonpersistent »*, et Safari la décharge dès que l'utilisateur n'interagit plus avec l'extension. Un `"persistent": true` empêche purement et simplement le chargement (message d'erreur dans Réglages iOS). Pas de minuteur fiable, pas de traitement différé, pas de service worker gardé en vie : pour tout travail différé il faut `browser.alarms` (Apple : *« Use the `Alarms` API instead of `setTimeout` »*).

### 2.3 Safari iOS : pas de message app native → JavaScript

**Impossible, limitation documentée.** *« You can't send messages from a containing iOS app to your web extension's JavaScript scripts. »* Le canal iOS est **unidirectionnel** : JS → app extension. L'app conteneuse iOS ne peut donc pas pousser un événement vers l'extension ; elle ne peut que répondre, ou écrire dans un conteneur App Group que l'extension relira à sa prochaine exécution.

### 2.4 Safari : pas de Native Messaging « à la Chrome »

**Impossible.** Safari ne lit pas de manifeste d'hôte Native Messaging et n'exécute pas de binaire auxiliaire : il **ignore l'argument `application.id`** et achemine tout vers le `SafariWebExtensionHandler` de l'**app conteneuse**. Conséquence : pas de démon externe, pas de canal persistant géré par le navigateur, et le cycle de vie est celui d'un `NSExtension` (démarrage à la demande, `beginRequest(with:)` par message).

### 2.5 Safari (macOS et iOS) : pas de Web Bluetooth

**Impossible.** WebKit n'implémente pas Web Bluetooth — `navigator.bluetooth` est absent sur **toutes** les versions de Safari et Safari iOS, y compris 26.6 et 27 (caniuse : « Not supported » ; BCD : `safari: false`, `impl_url: https://webkit.org/b/101034`). Sur iOS, WebKit est imposé à tous les navigateurs, y compris Brave iOS : un employé Brave l'a confirmé explicitement — *« due to Apple's platform restrictions… As far as I know, there are no browsers on iOS that implement WebBluetooth »*.

**Seule échappatoire** : une extension Safari iOS qui *polyfille* `navigator.bluetooth` en JavaScript au-dessus de CoreBluetooth via son app native (projet [iOSWebBLE](https://github.com/wklm/ioswebble-sdk), mentionné par caniuse comme support *userland*, pas WebKit). Cela suppose de livrer sa propre app native iOS et de réimplémenter le pont — coût élevé, **non vérifié** par mes sources au-delà de la mention caniuse.

### 2.6 Brave macOS : Web Bluetooth et File System Access désactivés par défaut

**Contournable, mais pas transparent.** Brave a retiré WebBluetooth du moteur (brave-core PR #114) et le File System Access API ([#11407](https://github.com/brave/brave-browser/issues/11407)), et les a remis derrière des flags **désactivés par défaut** :

- `brave://flags#brave-web-bluetooth-api`
- `brave://flags/#file-system-access-api`

Un utilisateur final ne peut pas être supposé activer un flag. Toute conception qui dépend de l'une de ces deux API **ne peut pas reposer sur Brave par défaut**.

### 2.7 Divers impossibles / absents sur Safari

- `browser.downloads`, `browser.clipboard`, `browser.notifications` : ❌ sur Safari macOS **et** iOS (BCD `safari: false`). L'export de fichier doit donc passer par une page d'extension, le presse-papiers web, ou l'app native.
- `browser.storage.sync` ne synchronise pas dans Safari : il se comporte comme `storage.local`. Ne pas concevoir de synchronisation inter-appareils via `storage.sync` sur Safari (utiliser la synchronisation d'extension au niveau Safari 16+, ou le conteneur iCloud/App Group côté app).
- `tabs.executeScript` / `insertCSS` : MV2 uniquement — sur Safari, `scripting` (15.4+) fonctionne en MV2 **ou** MV3, mais `tabs.executeScript` non.
- Safari App Extension (l'API native `SFSafariExtensionHandler`) : **macOS seulement** — elle ne peut pas servir de repli sur iOS.
- Pas de clic droit sur iOS ⇒ le trio demandé (« clic droit + bouton barre d'outils ») **n'est pas réalisable à l'identique sur iOS**.

---

## 3. Architecture de communication recommandée

### 3.1 Modèle en trois parties (identique à la documentation Apple)

Apple décrit une extension web Safari comme **trois composants** dans des bacs à sable séparés : l'**app** (UI), le **code JavaScript** dans le navigateur, et l'**app extension native** qui sert de médiateur. Les échanges passent par les API de messagerie ; les **App Groups** fournissent l'espace de données partagé entre l'app et l'app extension.

```
┌──────────────────────────┐        ┌───────────────────────────────┐
│  App macOS / iOS         │◄──────►│  SafariWebExtensionHandler    │
│  (UI, Bluetooth, fichiers)│ App    │  beginRequest(with:)          │
└──────────────────────────┘ Group  └───────────────┬───────────────┘
                                                    │ SFExtensionMessageKey
                                       ┌────────────▼───────────────┐
                                       │  JS extension (background,  │
                                       │  popup, content scripts)    │
                                       └────────────────────────────┘
```

### 3.2 macOS — canal recommandé

1. **Permissions manifeste** : `"nativeMessaging"`, `"storage"`, `"contextMenus"`, `"activeTab"` (ou `host_permissions` si nécessaire), plus des `optional_permissions`/`optional_host_permissions` pour limiter la portée. Apple : *« Prioritize using `activeTab`, host permissions, and `optional_permissions`; only use `<all_urls>` if there is no other option. »*
2. **Capture de l'URL** : `contextMenus.create({ id, title, contexts: ["page", "link", "selection"] })` + `contextMenus.onClicked` → `info.pageUrl` (page) ou `info.linkUrl` (lien). Ajouter le popup `browser.action` comme second point d'entrée, qui lit l'onglet actif.
3. **Persistance locale** : `storage.local` (10 Mo côté Chromium, quota Safari non documenté). Pour un volume important ou un besoin d'index, `IndexedDB` depuis une page d'extension, ou le conteneur App Group côté natif.
4. **JS → app native** : `browser.runtime.sendNativeMessage("application.id", {...})` (l'`application.id` est ignoré, tout va au `SafariWebExtensionHandler`). Implémenter `beginRequest(with:)`, lire `userInfo[SFExtensionMessageKey]`, renvoyer un `NSExtensionItem` avec `SFExtensionMessageKey`.
5. **App native → JS** (macOS uniquement) : `browser.runtime.connectNative(...)` pour ouvrir un port, puis `SFSafariApplication.dispatchMessage(withName:toExtensionWithIdentifier:userInfo:)` côté app, et `port.onMessage.addListener(...)` côté JS. C'est le seul moyen officiel de *pousser* un événement vers l'extension.
6. **Données partagées** : App Group (`group.…`) avec le même identifiant dans les entitlements de l'app et de l'app extension — c'est ce qui permet à un traitement natif (Bluetooth, impression, export fichier) de déposer un résultat que la partie JS relira.

### 3.3 iOS — ce qui reste possible

- **Point d'entrée unique : le popup de l'action.** L'utilisateur ouvre le menu de page (bouton **Aa** / « More »), y trouve l'extension, la touche ; Safari peut afficher une demande de permission par site (« Allow for One Day », « Always Allow », « Deny »), puis présente le popup. Le popup lit l'onglet actif et enregistre l'URL.
- **Motif recommandé par Apple** (Tech Talk 110148) : depuis le popup, faire `browser.tabs.query({ active: true, currentWindow: true })` pour obtenir l'onglet, puis **envoyer un message au content script** de cet onglet (`browser.tabs.sendMessage(tabId, …)`) pour qu'il lise la page (dans la démo : les balises Open Graph). C'est le chemin qui fonctionne sur iOS **et** macOS, et il évite de dépendre de la disponibilité de `tab.url`.
- **Alternative équivalente** : `activeTab` + lecture de `tab.url` dans le popup (accordé par le geste de l'utilisateur). À valider sur appareil — voir §5.3.
- **Unidirectionnel** : `sendNativeMessage` (JS → app extension) fonctionne ; **aucun** `dispatchMessage` (app → JS) n'existe sur iOS. L'app iOS ne peut donc pas notifier l'extension. Concevoir l'échange en **tirer**, pas en pousser.
- **Partage de données** : App Group. L'app extension iOS peut y écrire ; l'app iOS peut la lire.
- **Repli hors extension web** : pour une entrée par **feuille de partage**, il faut une **Share Extension native** (et non une Safari Web Extension), activée par `NSExtensionActivationSupportsWebURLWithMaxCount` / `NSExtensionActivationSupportsWebPageWithMaxCount` — clés documentées par Apple sous [NSExtensionActivationRule](https://developer.apple.com/documentation/BundleResources/Information-Property-List/NSExtension/NSExtensionAttributes/NSExtensionActivationRule) (*« The semantic data types that a Share or Action extension supports »*). C'est la voie iOS native pour « attraper l'URL courante » ; elle est **indépendante** de l'extension web et donc à maintenir en double.

### 3.4 Brave / Chromium macOS

- `chrome.contextMenus` + `"permissions": ["contextMenus"]` : `info.pageUrl` / `info.linkUrl` / `info.selectionText` / `info.srcUrl` / `info.frameId`.
- En MV3 (service worker), **ne pas** utiliser la propriété `onclick` de `create()` : enregistrer `contextMenus.onClicked`. Enregistrer les items dans `runtime.onInstalled`.
- `chrome.action` + popup ; `chrome.storage.local` (10 Mo, `unlimitedStorage` si besoin) ; `chrome.scripting.executeScript` pour MV3.
- Deux API de la liste sont **inutilisables par défaut sur Brave** : Web Bluetooth et File System Access (flags). Si le besoin est réel, prévoir Chrome/Edge comme cible de repli, ou une app native.

### 3.5 Code partagé macOS ↔ iOS

- **Un seul dossier `Resources/`** (manifest, JS, HTML, CSS) référencé par les deux cibles d'extension (iOS et macOS). Dans le projet créé par le packager, le groupe « Shared extension » contient ce dossier.
- `xcrun safari-web-extension-packager --rebuild-project monExt.xcodeproj` ajoute la cible iOS à un projet macOS existant ; Xcode 13+ génère par défaut un projet **multiplateforme** (WWDC21 s.10104).
- **Détection de fonctionnalités obligatoire** — Apple : *« iOS doesn't support some APIs. To prevent throwing exceptions, check for the existence of APIs in iOS before using them. »* Encapsuler les appels `contextMenus.*` derrière un test `if (browser.contextMenus) { … }`.
- Déclarer les versions dans le manifeste : `"browser_specific_settings": { "safari": { "strict_min_version": "16.4" } }`. Apple précise : *« In iOS, the iOS version and Safari version numbers are the same. »*
- `commands` : utilisables sur les deux, mais pas de personnalisation du raccourci sur iOS ; l'affichage dans la barre de menus arrive avec Safari 26 sur **iPadOS** (iPhone non mentionné).
- Les pages d'extension (popup, page d'options, nouvelle page d'onglet) doivent être **responsives**, utiliser les **pointer events** et `:root { color-scheme: light dark; }` (recommandations Apple pour iOS).

### 3.6 Contraintes App Store / TestFlight (iOS et macOS)

- L'extension est livrée **dans une app conteneuse** ; c'est l'app qui est signée, revue et distribuée.
- **Apple Developer Program obligatoire** pour tester sur un appareil réel et pour distribuer ; les simulateurs iOS suffisent pour le développement.
- **TestFlight** pour la bêta ; **App Store Connect** propose depuis Safari 26 un *Safari Web Extension Packager* web (Xcode Cloud) qui produit un bundle app + extension signé pour macOS, iOS, iPadOS et visionOS — **sans Mac** (WWDC26 s.216 le montre de bout en bout).
- **Règles de revue** ([App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), §4.4 et §4.4.2) :
  - l'app doit être conforme à la documentation Safari web extensions et *« should include some functionality, such as help screens and settings interfaces where possible »* ;
  - *« the extensions may not include marketing, advertising, or in-app purchases »* ;
  - *« Safari extensions must run on the current version of Safari on the relevant Apple operating system »* ;
  - *« They may not interfere with System or Safari UI elements »* ;
  - *« Safari extensions should not claim access to more websites than strictly necessary to function »* ;
  - annoncer clairement dans la fiche App Store quelles extensions l'app fournit.
- Points pratiques (Tech Talk 110148) : posséder tout le code et les assets ; **désactiver** tout code de paiement/don web pour la revue ; définir une catégorie d'app ; icône personnalisée ; URL de support ; la description et les mots-clés (limite ~100 caractères).

---

## 4. Version par version (repères)

| Version | Apports pertinents pour la capture d'URL | Source |
| --- | --- | --- |
| **Safari 14 / macOS Big Sur (2020)** | Premières Safari Web Extensions sur macOS : `contextMenus`/`menus`, `storage`, `tabs`, `runtime`, `browser_action` (MV2), page de fond | BCD ; [WWDC20 s.10665](https://developer.apple.com/videos/play/wwdc2020/10665/) |
| **Safari 15 / iOS 15 (2021)** | Safari Web Extensions sur **iOS/iPadOS 15** : `tabs`, `storage`, `browser_action` MV2, page de fond non persistante obligatoire | BCD ; [WWDC21 s.10104](https://developer.apple.com/videos/play/wwdc2021/10104/) |
| **Safari / iOS 15.4 (2022)** | **MV3** (`action`, `scripting`), `storage`… — `action` sur iOS à partir de 15.4 (`browser_action` MV2 depuis 15.0) | BCD ; doc Apple compat |
| **Safari / iOS 16 (2022)** | `action.openPopup` ; synchronisation des extensions entre appareils | BCD ; doc Apple syncing |
| **Safari / iOS 16.4 (2023)** | `storage.session` ; `scripting.registerContentScripts`/`get`/`update`/`unregister` ; `tabs.toggleReaderMode` | BCD |
| **Safari / iOS 17 (2023)** | Profils : `SFExtensionProfileKey` dans les messages natifs ; permissions par site valables sur tous les profils | Doc Apple messaging / permissions |
| **Safari / iOS 18 (2024)** | `storage.get` accepte une clé vide | BCD |
| **Safari / iOS 26 (2025)** | `commands` complets et affichés dans la barre de menus (macOS + **iPadOS**), raccourci personnalisable sur macOS ; chargement d'extensions dans **SafariDriver** (tests Selenium) ; **Safari Web Extension Packager web** dans App Store Connect ; `dom.openOrClosedShadowRoot()` | [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) |
| **Safari 26.2** | Migration depuis une Safari app extension : migre aussi les permissions web et le réglage navigation privée | Doc Apple |
| **Safari 27 (TP/bêta)** | `runtime.getDocumentId` | BCD |
| **Chrome MV3** | `action` 88+, `scripting` 88+, `storage.local` 10 Mo depuis Chrome 114, `storage.session` 102+, File System Access 86+, Web Bluetooth 56+ (macOS) | Chrome Developers ; BCD ; caniuse |
| **Brave** | Flag Web Bluetooth vérifié sur Brave 1.59.100 / Chromium 117 / macOS 14 ; toujours désactivé par défaut (issue #34941 ouverte, commentaire mai 2025) | brave-browser #31605, #34941 |

---

## 5. Incertitudes à vérifier

### 5.1 🔴 Prioritaire — `contextMenus` sur Safari iOS : contradiction de sources

- **BCD (cautionné par Apple) dit `safari_ios: false`.**
- **Le code source WebKit `main` ne restreint pas l'API à macOS** : `WebKit::WebExtensionAction::platformMenuItems()` n'a pas de garde de plateforme et `WKWebExtensionAction.h` déclare, sous `#if TARGET_OS_IPHONE`, `@property (nonatomic, readonly, copy) NSArray<UIMenuElement *> *menuItems;` avec la note *« The app is responsible for displaying these menu items, typically in a context menu or a long-press menu on the action in action sheets or toolbars. »*
- **Question à trancher** : Safari iOS affiche-t-il dans la feuille d'actions de l'extension les items créés avec `contexts: ["action"]` ? Si oui, on obtient un **troisième** point d'entrée sur iOS (un item de menu « Enregistrer l'URL ») sans jamais avoir de clic droit de page.
- **Test** : sur un iPhone réel (iOS 18 et iOS 26), charger une extension qui fait `browser.menus.create({ id: 'x', title: 'Save', contexts: ['action'] })` et observer la feuille d'actions. ⚠️ Ne pas concevoir sur cette base avant le test.

### 5.2 🟠 Quota réel de `storage.local` dans Safari

Aucune source trouvée. Ni Apple ni MDN ne documentent de quota pour Safari ; BCD ne porte aucune note. Deux fils de forum Apple non accessibles (protection anti-robot) suggèrent des comportements inattendus d'`unlimitedStorage` sur iOS 18 :
`developer.apple.com/forums/thread/759554` et `/thread/737239`.
**À mesurer empiriquement** (écriture jusqu'à échec) sur Safari macOS 26 et iOS 26.

### 5.3 🟠 `tab.url` dans le popup sur Safari iOS

Après `browser.tabs.query({ active: true, currentWindow: true })`, `tab.url` est-il renseigné sur iOS sans permission d'hôte préalable, avec seulement `activeTab` ? Aucune source ne le confirme. Le motif **officiellement démontré par Apple** (Tech Talk 110148) n'utilise pas `tab.url` : il envoie un message au content script pour lire la page. **Vérifier sur appareil** ; si `tab.url` n'est pas disponible, le message au content script (qui peut faire `location.href`) reste le chemin sûr.

### 5.4 🟠 Fiabilité de `safari_ios: "mirror"` dans BCD

De nombreuses lignes iOS de ce tableau (`action`, `scripting`, `storage.session`, `action.openPopup`, `scripting.registerContentScripts`) proviennent d'un `mirror` MDN, c'est-à-dire d'une **extrapolation** depuis macOS, pas d'un test. À valider une par une sur les versions iOS ciblées si l'une d'elles est structurante.

### 5.5 🟠 XPC et URL schemes comme canaux alternatifs macOS

Ni l'un ni l'autre n'est documenté par Apple comme mécanisme de communication **extension web Safari ↔ app native**. La documentation officielle ne décrit que `sendNativeMessage` / `connectNative` / `SFSafariApplication.dispatchMessage` + App Groups. XPC est un IPC macOS général et pourrait servir entre l'app et un helper, mais **rien ne prouve** qu'une app extension Safari puisse ouvrir une `NSXPCConnection` vers son app conteneuse (les app extensions ont des restrictions de sandbox). **Non vérifié** — ne pas planifier dessus.

### 5.6 🟡 Effet du flag Brave `#brave-web-bluetooth-api` sur les versions 2026

La preuve de QA date de Brave 1.59 (septembre 2023, macOS 14). Le flag existe toujours (issue #34941 ouverte, commentaire mai 2025) mais je n'ai **pas** de vérification sur une version Brave de 2026. À revérifier sur la version courante (`brave://flags`, recherche « bluetooth »).

### 5.7 🟡 Comportement de `navigator.clipboard` et `<a download>` dans une page d'extension Safari

Non vérifié. Ces deux mécanismes sont les seuls replis d'export côté Safari (`browser.downloads` et File System Access étant indisponibles), il faut donc les tester avant de s'y appuyer.

### 5.8 🟡 Polyfill Web Bluetooth sur iOS

Le projet [iOSWebBLE](https://github.com/wklm/ioswebble-sdk) est cité par caniuse comme extension Safari polyfillant `navigator.bluetooth` au-dessus de CoreBluetooth. Statut réel, pérennité, conformité App Store et performances : **non vérifiés**. Piste exploratoire uniquement.

---

## 6. Conclusion opérationnelle

| Objectif | Safari macOS | Safari iOS | Brave macOS |
| --- | --- | --- | --- |
| Clic droit → enregistrer l'URL | ✅ `contextMenus` + `pageUrl`/`linkUrl` | ❌ (sauf si §5.1 se confirme pour `contexts: ["action"]`) | ✅ `chrome.contextMenus` |
| Bouton barre d'outils → popup → enregistrer l'URL | ✅ `action` + popup | ✅ `action` + popup (via menu Aa / More) | ✅ `chrome.action` |
| Stockage local | ✅ `storage.local` (quota non documenté) | ✅ `storage.local` (quota non documenté) | ✅ `storage.local` 10 Mo |
| App native macOS pilotée par l'extension | ✅ `sendNativeMessage` + `SafariWebExtensionHandler` | ✅ JS → native seulement | s.o. |
| App native → extension | ✅ `connectNative` + `dispatchMessage` | ❌ impossible | s.o. |
| Web Bluetooth | ❌ | ❌ | ⚠️ flag, off par défaut |
| Export fichier direct | ❌ (ni `downloads` ni FS Access) | ❌ | ⚠️ FS Access derrière flag |

**Le seul socle réellement commun aux trois cibles** est : `browser.action` + popup → `storage.local`, avec lecture de l'URL via le content script de l'onglet actif. Le clic droit est un bonus macOS + Brave, à conditionner par `if (browser.contextMenus)`.

---

## Sources

**Apple**
- [Safari web extensions](https://developer.apple.com/documentation/safariservices/safari-web-extensions) · [Assessing your Safari web extension's browser compatibility](https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility) · [Optimizing your web extension for Safari](https://developer.apple.com/documentation/safariservices/optimizing-your-web-extension-for-safari)
- [Messaging between the app and JavaScript in a Safari web extension](https://developer.apple.com/documentation/safariservices/messaging-between-the-app-and-javascript-in-a-safari-web-extension) · [Managing Safari web extension permissions](https://developer.apple.com/documentation/safariservices/managing-safari-web-extension-permissions)
- [Packaging a web extension for Safari](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari) · [Distributing your Safari web extension](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension) · [Running your Safari web extension](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension) · [Syncing Safari web extensions across devices and platforms](https://developer.apple.com/documentation/safariservices/syncing-safari-web-extensions-across-devices-and-platforms) · [Safari app extensions](https://developer.apple.com/documentation/safariservices/safari-app-extensions)
- [NSExtensionActivationRule](https://developer.apple.com/documentation/BundleResources/Information-Property-List/NSExtension/NSExtensionAttributes/NSExtensionActivationRule) · [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- WWDC : [Meet Safari Web Extensions (2020/10665)](https://developer.apple.com/videos/play/wwdc2020/10665/) · [Meet Safari Web Extensions on iOS (2021/10104)](https://developer.apple.com/videos/play/wwdc2021/10104/) · [Build and deploy Safari Extensions for iOS (Tech Talk 110148)](https://developer.apple.com/videos/play/tech-talks/110148/) · [Create web extensions for Safari (WWDC26/216)](https://developer.apple.com/videos/play/wwdc2026/216/)

**MDN / caniuse**
- [menus](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus) · [browser-compat-data](https://github.com/mdn/browser-compat-data) (`webextensions/api/{menus,storage,action,tabs,scripting,runtime,downloads,clipboard,notifications}.json`, `api/Bluetooth.json`, `api/Window.json`)
- [caniuse — Web Bluetooth](https://caniuse.com/web-bluetooth)
- [Chrome Developers — chrome.contextMenus](https://developer.chrome.com/docs/extensions/reference/api/contextMenus) · [chrome.storage](https://developer.chrome.com/docs/extensions/reference/api/storage)

**WebKit / Brave**
- [WebKit source — WebExtension.cpp `supportedPermissions()`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/Extensions/WebExtension.cpp) · [WebExtensionAPIMenusCocoa.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/WebProcess/Extensions/API/Cocoa/WebExtensionAPIMenusCocoa.mm) · [WKWebExtensionAction.h](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/API/Cocoa/WKWebExtensionAction.h) · [commit 7a3236b (documentUrlPatterns)](https://github.com/WebKit/WebKit/commit/7a3236ba274c5374337531088e431b1ce8728a77)
- [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- brave-browser : [#31605 (flag WebBluetooth)](https://github.com/brave/brave-browser/issues/31605) · [#34941 (Enable Web Bluetooth, ouvert)](https://github.com/brave/brave-browser/issues/34941) · [#11407 (File System API retiré)](https://github.com/brave/brave-browser/issues/11407) · [#44411 (flag File System Access)](https://github.com/brave/brave-browser/issues/44411) · [Brave — Can I use extensions in Brave?](https://brave.com/learn/using-chrome-extensions-in-brave/)
- [iOSWebBLE (polyfill Web Bluetooth iOS)](https://github.com/wklm/ioswebble-sdk)
