# URLQRCodePrinter

Collecter des URL depuis le navigateur (clic droit ou bouton), les garder dans
une base locale, puis les imprimer en étiquettes QR — tableau, export CSV ou
Markdown, ou envoi direct à une imprimante Niimbot.

## Où en est le projet

| Étape | État |
|---|---|
| Cœur métier (liens, QR, étiquettes, stockage, exports) | fait, testé |
| Protocole Niimbot (trames, profils D110 / M2) | fait, testé |
| Transport Web Bluetooth + session d'impression D110 | fait, testé |
| Extension Brave / Chrome (clic droit, popup) | fait, testé structurellement |
| Application web autonome (liste, exports, mises en page) | fait, démarrage vérifié |
| Extension Safari — projet Xcode multiplateforme | généré, **compile pour macOS** |
| Extension Safari — exécution dans Safari | à éprouver sur ta machine |
| Impression Niimbot sur iOS (CoreBluetooth natif) | à faire |

**260 tests**, dont la validation octet à octet des trames Niimbot contre les
relevés documentés, un test qui exécute réellement le démarrage de
l'application web, et une vérification des icônes PNG par décompression.

Ce qui reste à éprouver : l'application dans un vrai navigateur (Chrome sans
interface ne démarre pas dans l'environnement de développement utilisé),
l'extension chargée dans Safari, et l'impression sur une imprimante physique.

**La cible iOS ne se compile pas dans un environnement restreint.** Xcode a
besoin d'écrire dans `~/Library/Developer/CoreSimulator` pour lancer
`IBAgent-iOS`, et clang dans un cache de modules système. Les deux échouent hors
d'un accès complet au système. Le projet généré est correct : la cible macOS,
qui n'a besoin d'aucun simulateur, compile.

Le dossier `qr-niimbot-printer/` est un prototype antérieur. **Son code
Bluetooth ne peut pas fonctionner** : les UUID sont des valeurs d'exemple et
les commandes envoyées sont du protocole ESC/POS, pas du Niimbot. Il sera
remplacé.

## Architecture

Un cœur JavaScript unique, sans dépendance au DOM hors rendu canvas, consommé
par toutes les surfaces :

```
src/core/
  link.js              modèle de lien, normalisation d'URL, dédoublonnage
  capture.js           décision de capture depuis un clic contextuel
  qr.js                encodage QR → matrice → bitmap 1 bit/pixel
  label.js             géométrie d'étiquette, découpe de texte, lisibilité
  raster.js            ImageData → bitmap monochrome pour tête thermique
  sheet.js             géométrie des planches d'impression, pagination
  store.js             IndexedDB / chrome.storage / mémoire, même interface
  exporters.js         CSV (RFC 4180), Markdown, JSON
  download.js          enregistrement de fichier et presse-papiers
  printer/
    packet.js          trames Niimbot, checksum, décodeur de flux
    profiles.js        profils d'imprimantes (largeur de tête, task, densité)
    transport.js       Web Bluetooth : filtrage, groupage, notifications
    printer.js         session d'impression, séquence et acquittements

src/extension/         extension MV3 (Brave, Chrome, Edge, Safari)
src/web/               application autonome
scripts/build.mjs      assemble dist/extension et dist/web
scripts/serve.mjs      serveur statique de développement
scripts/make-icons.mjs génère les icônes PNG (encodeur maison, sans dépendance)
scripts/package-safari.mjs  produit le projet Xcode Safari
native/safari/         projet Xcode généré (macOS + iOS)
```

Le cœur ne dépend que de `uqr` (ESM pur, sans dépendance). Aucun bundler : tout
est en modules ES natifs.

## Utilisation

```bash
npm run build
npm run serve      # puis ouvrez http://127.0.0.1:4173/
```

`localhost` est obligatoire : Web Bluetooth exige un contexte sécurisé, et le
protocole `file://` refuse de charger des modules ES.

Pour l'extension : ouvrez `brave://extensions` (ou `chrome://extensions`),
activez le mode développeur, puis « Charger l'extension non empaquetée » et
désignez `dist/extension`.

**Pour imprimer depuis Brave**, Web Bluetooth doit être activé :
`brave://flags#brave-web-bluetooth-api`. Chrome et Edge n'ont pas cette
contrainte. Safari ne l'implémente pas du tout.

### Safari

```bash
npm run package:safari        # assemble, génère les icônes, convertit, aligne
```

Le projet apparaît dans `native/safari/`. Ouvrez-le dans Xcode et lancez le
schéma **URLQRCodePrinter (macOS)**.

Le script fait aussi une chose non évidente : il **relève les cibles de
déploiement** du projet généré. Le convertisseur d'Apple produit des cibles
iOS 15.0 / macOS 10.14, alors que le manifeste déclare
`browser_specific_settings.safari.strict_min_version: "16.4"`. Or
`background.type: "module"` — dont dépend notre service worker — n'est reconnu
par Safari que depuis la 16.4 ([MDN BCD](https://github.com/mdn/browser-compat-data)).
Avec une cible plus basse, l'avertissement du convertisseur devient un vrai
risque de panne au chargement.

Safari n'expose pas `chrome` mais `browser`, et **ne fournit pas `contextMenus`
sur iOS**. L'extension détecte les deux : le menu contextuel n'est branché que
s'il existe, et l'URL de l'onglet est lue par injection quand `tab.url` manque.

## Deux chiffres à ne pas confondre

- **La largeur de tête n'est pas la largeur d'étiquette.** Un D110 accepte des
  rouleaux de 15 mm mais sa tête ne fait que **96 px = 12 mm** à 203 dpi. Envoyer
  120 colonnes ne provoque aucune erreur : l'imprimante rogne en silence.
- **Le dialogue d'impression dépend du modèle.** Un D110 attend un `SetPageSize`
  de 4 octets ; le format « v4 » (13 octets) le fait répondre une erreur
  `DataError` au lieu d'imprimer.

## Développement

```bash
npm install
npm test
```

`npm test` construit d'abord `dist/` (script `pretest`), car plusieurs tests
portent sur l'artefact assemblé. Lancer `node --test` directement sans avoir
construit échoue avec un message explicite.

### Environnement

- **Cache npm local.** Le `.npmrc` rapatrie le cache dans le projet
  (`.npm-cache/`). Si votre environnement exporte déjà `npm_config_cache`, il a
  la priorité sur le `.npmrc` — neutralisez-le :
  `env -u npm_config_cache npm install`.
- **Xcode.** `xcode-select` pointe sur les Command Line Tools. Les outils
  Xcode restent utilisables sans `sudo` en préfixant les commandes :
  `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun …`

## Documents de référence

- `note-protocole-niimbot-ble.md` — protocole BLE Niimbot : UUID, format de
  trame, séquences d'impression, contraintes Web Bluetooth et CoreBluetooth,
  et les points restant à vérifier sur matériel.
- `docs/note-capacites-capture-url-safari-brave.md` — matrice de capacités des
  extensions navigateur sur Safari macOS, Safari iOS et Brave.

## Incertitudes assumées

Ces points ne peuvent pas être tranchés sans matériel ni appareil :

- **Orientation de la matrice.** Le profil D110 porte `transposed: true`, fondé
  sur la convention des implémentations de référence. Si la première étiquette
  sort pivotée de 90°, c'est ce booléen qu'il faut basculer.
- **Groupage des écritures Bluetooth.** Les groupes de 240 octets ont été validés
  sur B1 et M2-H, jamais sur D110. La limite est réglable.
- **« D110A » n'existe dans aucune source** — ni le wiki Niimbot, ni l'API
  constructeur, ni les bibliothèques. Le `modelId` réel est lu à la connexion et
  journalisé.
- **`contextMenus` sur Safari iOS.** MDN l'annonce non supporté, le code source
  de WebKit suggère le contraire. L'extension ne dépend plus de la réponse : le
  menu n'est branché que s'il existe, et tout reste accessible depuis la fenêtre
  de la barre d'outils. La question n'est donc plus bloquante, seulement
  informative.
- **Compilation iOS.** `IBAgent-iOS` doit écrire dans
  `~/Library/Developer/CoreSimulator` et clang dans un cache de modules système.
  Les deux échouent hors d'un accès complet. À relancer sur une machine sans
  restriction : `xcodebuild -scheme "URLQRCodePrinter (iOS)"`.
