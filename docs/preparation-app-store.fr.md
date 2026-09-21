# Préparer une soumission App Store

[← Documentation](README.md)

Ce document décrit ce qu'exige une soumission à l'App Store, ce qui est **déjà**
en place dans ce dépôt, ce qui reste à faire, et ce qui est transposable aux
autres applications Swift du même auteur.

Il ne remplace pas la documentation d'Apple : il note ce qui a été **vérifié
ici**, et surtout ce qui ne l'a pas été.

---

## 1. Ce qui ne se négocie pas

| Exigence | Pourquoi | Où cela se règle |
|---|---|---|
| **App Sandbox** | Obligatoire pour le Mac App Store, sans exception | Réglage de build `ENABLE_APP_SANDBOX` |
| **Manifeste de confidentialité** (`PrivacyInfo.xcprivacy`) | Exigé depuis mai 2024 ; son absence est un motif de rejet | `Shared (App)/` et `Shared (Extension)/` |
| **Compte Apple Developer Program** | 99 $/an ; conditionne la signature, TestFlight et la distribution | developer.apple.com |
| **App ID enregistré** | Le bundle ID doit exister dans le portail avant le premier envoi | Certificates, Identifiers & Profiles |
| **Équipe de signature** (`DEVELOPMENT_TEAM`) | Sans elle, aucune archive distribuable ne peut être produite | Réglages de build de la cible |
| **Icône 1024 × 1024** | Obligatoire pour la fiche App Store | `Shared (App)/Assets.xcassets/AppIcon` |
| **Une app conteneuse qui a une fonction propre** | Règle 4.4.2 : *« should include some functionality, such as help screens and settings interfaces »* | `Shared (App)/ViewController.swift` |

Le point le plus souvent raté est le deuxième : un manifeste de confidentialité
manquant ne se voit pas en local, la compilation passe, et le refus arrive après
l'envoi.

---

## 2. État du projet Safari de ce dépôt

### Déjà conforme

- **Cibles de déploiement** : iOS 16.4, macOS 13.3. Ce ne sont pas les valeurs
  du gabarit d'Apple (iOS 15.0 / macOS 10.14) : elles sont alignées sur
  `strict_min_version: 16.4` du manifeste, parce que `background.type: "module"`
  n'est reconnu qu'à partir de Safari 16.4.
- **App Sandbox** : active sur l'app **et** sur l'extension. Les entitlements ne
  sont pas des fichiers du dépôt — Xcode les **génère** à partir de
  `ENABLE_APP_SANDBOX = YES` et `ENABLE_OUTGOING_NETWORK_CONNECTIONS = YES`. Le
  fichier réellement appliqué est un `.xcent` produit dans les produits
  intermédiaires ; c'est lui qu'il faut lire pour savoir ce qui est signé.
- **Accès réseau** : `com.apple.security.network.client` est présent sur l'app.
  L'extension, elle, porte le sandbox **sans** l'accès réseau — ce qui est
  cohérent, son `SafariWebExtensionHandler` ne fait aucun appel réseau. Les
  requêtes vers les raccourcisseurs (`tinyurl`, `is.gd`, `v.gd`, `spoo.me`) sont
  émises depuis `app.html`, donc par le processus de Safari, pas par l'appex.
- **Manifestes de confidentialité** : présents dans les deux bundles, vérifiés
  présents après compilation dans `URLQRCodePrinter.app` et dans
  `URLQRCodePrinter Extension.appex`.
- **Version** : `MARKETING_VERSION = 0.1.0` sur les quatre cibles, alignée sur
  `package.json` et sur la version du manifeste de l'extension.
- **Icônes** : macOS de 16 à 512 en `@1x`/`@2x`, plus l'universel 1024 pour iOS,
  avec les variantes *dark* et *tinted* (iOS 18+). Complet.
- **App conteneuse** : ce n'est pas le gabarit brut d'Apple. `ViewController.swift`
  interroge l'état réel de l'extension, et le bouton « Ouvrir Safari » déclenche
  un repli **avant** d'appeler Safari, parce que le gestionnaire d'Apple peut ne
  jamais répondre sur une compilation non signée. C'est ce qui satisfait la
  règle 4.4.2.

### Le contenu des manifestes, et pourquoi il est vide

```xml
<key>NSPrivacyTracking</key>          <false/>
<key>NSPrivacyTrackingDomains</key>   <array/>
<key>NSPrivacyCollectedDataTypes</key><array/>
<key>NSPrivacyAccessedAPITypes</key>  <array/>
```

Ces rubriques sont vides parce que c'est la vérité du produit, pas par
facilité : aucun serveur, aucun compte, aucune mesure d'audience. Les URL
capturées restent dans le stockage local de Safari. Un raccourcisseur tiers ne
reçoit une adresse que sur un clic explicite, et l'éditeur n'y a aucun accès —
rien n'est donc « collecté » au sens d'Apple.

**Si une mesure d'audience est ajoutée un jour**, ces deux clés devront être
renseignées, et la fiche App Store avec elles. C'est le seul endroit du projet
où un ajout de code impose une modification de la déclaration publique.

### Ce qui reste, et qui ne peut pas être fait d'ici

| À faire | Pourquoi c'est bloqué |
|---|---|
| S'inscrire à l'Apple Developer Program | Décision et paiement de l'auteur ; 24 à 48 h |
| Renseigner `DEVELOPMENT_TEAM` | Exige l'identifiant d'équipe, qui n'existe qu'après l'inscription |
| Enregistrer les App ID | `com.gael.urlqrcodeprinter` et `com.gael.urlqrcodeprinter.Extension` — un identifiant enregistré ne se recycle pas, à figer maintenant |
| Captures d'écran et fiche App Store | Exigent le portail et une build signée |
| Trancher la version 0.1.0 | Une première version publique en 0.x est acceptée, mais annonce un statut pré-release |

### Le risque non vérifié

Le manifeste ne déclare **aucune** `host_permissions`. `popup.js` ouvre
`app.html` (`api.runtime.getURL('app.html')`), et c'est cette page qui interroge
les raccourcisseurs. `verify:brave` éprouve bien ce chemin **dans la page
d'extension** (`chrome-extension://<id>/app.html`) et il fonctionne sous
Chromium — les services renvoient donc des en-têtes CORS permissifs. Safari est
plus strict sur ce point et **cela n'a pas été vérifié**. À lever avec
`npm run verify:safari` avant de construire la fiche.

---

## 3. Le piège de la régénération

`npm run package:safari` appelle le convertisseur d'Apple avec `--force` : il
**régénère tout le projet Xcode**. Toute retouche faite à la main dans
`project.pbxproj` — référence de fichier, phase de construction, réglage — est
donc perdue au prochain empaquetage, sans avertissement.

Le dépôt traite déjà ce problème par des modules de correction appliqués *après*
le convertisseur (`alignDeploymentTargets`, `patchContainerApp`).
`scripts/safari-appstore.mjs` suit le même motif et réapplique :

- l'écriture des deux `PrivacyInfo.xcprivacy` ;
- leur rattachement aux quatre cibles et aux bons groupes ;
- l'alignement de `MARKETING_VERSION` sur la version de `package.json`.

Deux propriétés sont testées explicitement (`test/safari-appstore.test.js`) :

- **l'idempotence** — une seconde exécution ne doit rien changer, sinon les
  entrées du pbxproj se dupliqueraient à chaque empaquetage ;
- **le hors-miroir** — les manifestes ne doivent jamais être écrits dans
  `Shared (Extension)/Resources`, que `sync-safari-resources.mjs` vide de tout
  ce que `dist/extension-safari` ne contient pas. Un manifeste placé là serait
  effacé au premier `npm run sync:safari`.

En cas d'échec, le module **signale** ce qu'il n'a pas pu appliquer au lieu de
le taire : si Apple renomme ses cibles, le manifeste manquerait sinon dans un
bundle sans que personne ne s'en aperçoive.

---

## 4. Compiler et vérifier sans compte Apple

`xcode-select` peut pointer sur les Command Line Tools, qui ne fournissent pas
`xcodebuild`. Il faut donc `DEVELOPER_DIR` — c'est ce que fait déjà
`test-swift.mjs`.

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
xcodebuild -project native/safari/URLQRCodePrinter/URLQRCodePrinter.xcodeproj \
  -scheme "URLQRCodePrinter (macOS)" -configuration Debug \
  -derivedDataPath .xcode-build CODE_SIGNING_ALLOWED=NO build
```

Puis vérifier ce qui est réellement embarqué :

```bash
plutil -p ".xcode-build/Build/Products/Debug/URLQRCodePrinter.app/Contents/Resources/PrivacyInfo.xcprivacy"
```

**Deux remarques issues de la vérification de ce dépôt.**

1. `CODE_SIGNING_ALLOWED=NO` évite un faux échec. Dans un environnement
   d'exécution confiné, `codesign` peut refuser les produits avec
   *« resource fork, Finder information, or similar detritus not allowed »* :
   des attributs étendus (`com.apple.provenance`, `com.apple.FinderInfo`) sont
   ajoutés aux fichiers **par l'environnement**, et non par le projet. Le même
   bundle, nettoyé par `xattr -cr`, se signe sans difficulté — ce n'est pas un
   défaut du code.

2. La cible iOS ne se compile pas dans un environnement restreint :
   `IBAgent-iOS` a besoin d'écrire dans `~/Library/Developer/CoreSimulator`.

---

## 5. Transposer aux autres applications Swift

Ce qui est spécifique à ce dépôt, ce sont les noms de cibles et le convertisseur
Safari. Le reste est le même rituel pour chaque app native :

1. **Sandbox** — `ENABLE_APP_SANDBOX = YES` sur toutes les cibles. Pour le Mac
   App Store, c'est éliminatoire.
2. **Manifeste de confidentialité** — un par bundle, app **et** extensions.
   Renseigner les quatre rubriques, mêmes vides si le produit ne collecte rien.
3. **Version** — une seule source, propagée aux cibles. Deux versions
   divergentes pour un même livrable sont un motif de confusion en revue.
4. **App ID** — enregistrer avant le premier envoi ; un identifiant ne se
   recycle pas.
5. **Équipe de signature** — `DEVELOPMENT_TEAM` renseigné sur chaque cible, y
   compris les extensions.
6. **Icône 1024** et, pour iOS, les variantes *dark* et *tinted*.
7. **Rien d'inutile** — la règle 4.4.2 demande de ne pas réclamer plus d'accès
   aux sites que nécessaire. Le même principe vaut pour les entitlements : un
   entitlement non justifié se remarque en revue.

Le motif du point 2 mérite d'être repris tel quel : un module de correction
appliqué après la génération, **idempotent**, qui signale ce qu'il n'a pas pu
faire. C'est ce qui distingue une préparation qui tient dans le temps d'une
retouche manuelle qui disparaît au premier outil relancé.

---

## 6. Sources

- [Distributing your Safari web extension](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), § 4.4 et 4.4.2
- [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
- [Packaging a web extension for Safari](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)
- Voir aussi : [note-capacites-capture-url-safari-brave.md](note-capacites-capture-url-safari-brave.md) et [safari-extension-verification.md](safari-extension-verification.md)
