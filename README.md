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
| Extension Brave / Chrome (clic droit, popup) | à faire |
| Application web autonome (liste, exports, mises en page) | à faire |
| Extension Safari macOS + iOS | à faire (Xcode disponible) |
| Impression Niimbot sur iOS (CoreBluetooth natif) | à faire (Xcode disponible) |

Le dossier `qr-niimbot-printer/` est un prototype antérieur. **Son code
Bluetooth ne peut pas fonctionner** : les UUID sont des valeurs d'exemple et
les commandes envoyées sont du protocole ESC/POS, pas du Niimbot. Il sera
remplacé ; seule sa mise en forme CSS reste une référence.

## Architecture

Un cœur JavaScript unique, sans dépendance au DOM hors rendu canvas, consommé
par toutes les surfaces :

```
src/core/
  link.js              modèle de lien, normalisation d'URL, dédoublonnage
  qr.js                encodage QR → matrice → bitmap 1 bit/pixel
  label.js             géométrie d'étiquette, découpe de texte, lisibilité
  store.js             IndexedDB / chrome.storage / mémoire, même interface
  exporters.js         CSV (RFC 4180), Markdown, JSON
  printer/
    packet.js          trames Niimbot, checksum, décodeur de flux
    profiles.js        profils d'imprimantes (largeur de tête, task, densité)
    transport.js       Web Bluetooth : filtrage, groupage, notifications
    printer.js         session d'impression, séquence et acquittements
```

Le cœur ne dépend que de `uqr` (ESM pur, sans dépendance). Aucun bundler.

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
  de WebKit suggère le contraire. Testable sur le simulateur iOS.
