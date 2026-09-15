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
| Socle natif Swift (protocole, session, CoreBluetooth) | fait, testé |
| Application iOS qui utilise ce socle | à faire |

**496 tests** — 394 en JavaScript, **tous verts**, et 102 en Swift, dont 2 en
échec (voir « Incertitudes assumées ») — dont :

- la validation **octet à octet** des trames Niimbot contre les relevés
  documentés, **dans les deux langages** : deux implémentations indépendantes
  qui se confirment mutuellement ;
- l'exécution réelle du démarrage de l'application web ;
- la vérification des icônes PNG par décompression ;
- le raccourcissement d'URL, réseau simulé : les pannes réelles des services
  (texte d'erreur renvoyé avec un statut 200, réponse JSON, lien refusé) sont
  reproduites pour être traitées, pas devinées.

**L'application est vérifiée dans un vrai navigateur** : `npm run verify:brave`
lance Brave sur un profil isolé, collecte un lien, le raccourcit, exporte le CSV
et l'archive d'étiquettes, puis contrôle les fichiers réellement écrits sur le
disque (signature ZIP, `unzip -t`, contenu du CSV). 23 vérifications, dont le
rendu des liens cliquables dans l'application *et* dans la fenêtre de
l'extension.

Ce qui reste à éprouver : l'extension chargée dans Safari, et l'impression sur
une imprimante physique.

**La cible iOS du projet Xcode ne se compile pas dans un environnement
restreint.** Xcode a besoin d'écrire dans `~/Library/Developer/CoreSimulator`
pour lancer `IBAgent-iOS`, et clang dans un cache de modules système. Les deux
échouent hors d'un accès complet. Le projet généré est correct : la cible macOS,
qui n'a besoin d'aucun simulateur, compile. Le socle Swift, lui, se compile et
se teste sans réserve (`npm run test:swift`).

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
scripts/test-swift.mjs lance les tests du socle natif
native/safari/         projet Xcode généré (macOS + iOS)
native/niimbot-kit/    socle Swift : protocole, session, CoreBluetooth
```

Le cœur ne dépend que de `uqr` (ESM pur, sans dépendance). Aucun bundler : tout
est en modules ES natifs.

### Pourquoi un second socle en Swift

Aucun navigateur iOS n'expose Web Bluetooth — Apple impose WebKit, qui ne
l'implémente pas. Imprimer depuis un iPhone passe donc forcément par
CoreBluetooth, donc par du code natif. `native/niimbot-kit/` est ce socle : le
même protocole, la même séquence d'impression, les mêmes vecteurs de test que
l'implémentation JavaScript. Il est indépendant de toute interface, donc
réutilisable aussi bien par une app iOS que par un compagnon macOS.

## Utilisation

```bash
npm run build
npm run serve      # puis ouvrez http://127.0.0.1:4173/
```

`localhost` est obligatoire : Web Bluetooth exige un contexte sécurisé, et le
protocole `file://` refuse de charger des modules ES.

Pour l'extension dans Brave, Chrome ou Edge :

```bash
npm run open:extension        # assemble et ouvre le dossier dans le Finder
```

Puis `brave://extensions` (ou `chrome://extensions`) → **Mode développeur** →
glissez le dossier `extension` depuis le Finder, ou cliquez « Charger
l'extension non empaquetée » et désignez `dist/extension`.

**Pour imprimer depuis Brave**, Web Bluetooth doit être activé :
`brave://flags#brave-web-bluetooth-api`. Chrome et Edge n'ont pas cette
contrainte. Safari ne l'implémente pas du tout.

> Aucun de ces navigateurs n'accepte d'installation locale en un clic : un
> fichier `.crx` téléchargé hors du Chrome Web Store est refusé. Seule une
> publication sur le magasin donnerait ce confort.

### Safari

```bash
npm run install:safari        # génère, compile l'app macOS et la lance
```

C'est la voie la plus directe : une extension Safari **est** une application
macOS, et l'exécuter est le seul moyen de l'enregistrer. Le script enchaîne
tout, puis affiche les deux réglages qui restent à faire une fois.

Pour aller pas à pas :

```bash
npm run package:safari        # assemble, génère les icônes, convertit, aligne
```

Le projet apparaît dans `native/safari/`. Ouvrez-le dans Xcode et lancez le
schéma **URLQRCodePrinter (macOS)**.

Le script fait aussi deux choses non évidentes.

**Il relève les cibles de déploiement** du projet généré : le convertisseur
d'Apple produit des cibles iOS 15.0 / macOS 10.14, alors que notre manifeste
déclare `strict_min_version: "16.4"`.

**Il corrige la fenêtre de l'application conteneur.** Le modèle d'Apple contient
deux impasses silencieuses : quand Safari refuse d'ouvrir ses réglages — ce qui
arrive sur une compilation non signée — le bouton « Quit and Open Safari
Extensions Preferences… » sort de sa closure **sans rien faire**. Ni réglages,
ni fermeture, ni message. `scripts/safari-container-app.mjs` remplace ces
méthodes par des versions qui expliquent la marche à suivre, et ajoute un
bouton « Quitter » pour ne jamais rester bloqué.

## L'extension est assemblée en fichiers uniques

`npm run build` produit deux points d'entrée sans **aucun** `import` :

```
dist/extension/
  background.js    ← service worker assemblé
  popup.js         ← fenêtre assemblée
  popup.html  popup.css  manifest.json  icons/
```

Ce n'est pas une optimisation, c'est une nécessité. **Safari ne résout pas les
imports de modules situés dans un sous-dossier d'une extension** : il répond

```
Unable to find "core/store.js" in the extension's resources. It is an invalid path.
```

alors que le fichier est bel et bien dans le paquet — vérifié. Deux fils de
discussion Apple documentent ce défaut des modules ES dans les extensions
Safari, et plusieurs rapports de portage depuis Chrome le confirment.

Plutôt que d'aplatir l'arborescence pour contourner le symptôme, on supprime la
cause : `scripts/bundle.mjs` concatène les modules dans l'ordre des dépendances.
Le résultat fonctionne à l'identique sur Chrome, Brave et Safari, et l'on peut
retirer `"type": "module"` du manifeste — ce qui fait disparaître au passage
l'avertissement du convertisseur Apple.

L'assembleur **refuse de produire** si deux modules déclarent le même nom au
premier niveau : une collision se masquerait silencieusement, et le fichier
produit ne se comporterait pas comme les sources. Il n'est pas minifié, chaque
module garde son en-tête, et l'extension reste donc lisible dans l'inspecteur.

## Deux variantes du manifeste

`npm run build` produit deux dossiers :

| Dossier | Pour | Particularité |
|---|---|---|
| `dist/extension` | Brave, Chrome, Edge | sans `browser_specific_settings` |
| `dist/extension-safari` | Safari | conserve cette clé, dont le convertisseur d'Apple a besoin |

`browser_specific_settings` est une clé Firefox/Safari **inconnue de Chrome et
de Brave**. Ceux-ci l'affichent comme un avertissement de manifeste, en
surlignant le fichier avec ses numéros de ligne — de quoi croire à une erreur
bloquante alors que l'extension fonctionne. La construction la retire donc de
la variante Chromium.

**Chargez toujours un dossier de `dist/`, jamais `src/extension`.** Le dossier
source ne contient pas `core/`, qui n'y est recopié qu'à la construction : le
service worker échouerait au chargement.

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

## Raccourcir les URL, et ouvrir les liens collectés

Deux fonctions qui se répondent, autour de la même question : quelle adresse
finit sur l'étiquette ?

**Ouvrir un lien depuis la liste.** Le titre et l'URL de chaque ligne de la
collection sont des hyperliens (`target="_blank"`, `rel="noopener noreferrer"`),
dans l'application comme dans la fenêtre de l'extension. On peut donc vérifier
un lien collecté sans le rechercher à la main. L'attribut `href` ne reçoit jamais
qu'une URL http(s) : le contenu de la liste peut venir d'un import ou d'une page
web, et un `javascript:` n'a rien à y faire.

**Raccourcir, en option.** Le bouton « Raccourcir » transmet les liens visés —
la sélection, ou toute la collection si rien n'est coché — à un service tiers,
et enregistre le résultat à côté de l'URL d'origine.

| Service | Clé d'API | Remarque |
|---|---|---|
| TinyURL | aucune | défaut ; HTTPS, liens durables |
| is.gd | aucune | service bénévole, régulièrement indisponible |
| v.gd | aucune | même infrastructure que is.gd, avec page d'avertissement |
| spoo.me | aucune | statistiques de clics ; répond en HTTP, ramené en HTTPS |

Aucun de ces services n'exige d'autorisation d'hôte supplémentaire : leur réponse
porte un en-tête CORS permissif. C'est délibéré — un outil qui lit les URL de
tous vos onglets ne devrait pas demander plus de permissions que nécessaire.

Trois garde-fous, parce qu'un lien imprimé engage dans la durée :

1. **Rien n'est automatique.** Aucun service n'est contacté au chargement, ni à
   la collecte : uniquement sur un clic, et le lot est annulable.
2. **L'URL d'origine n'est jamais remplacée.** Le raccourci vit dans son propre
   champ ; l'URL collectée reste la source de vérité, et un bouton « Retirer »
   efface tous les raccourcis d'un coup.
3. **Le choix se fait au moment de l'impression.** Le sélecteur « Le QR code
   pointe vers » vaut pour toutes les sorties imprimées — aperçu, planche,
   tableau, étiquettes, ZIP d'images, impression Niimbot. Les exports de
   *données* (CSV, JSON) conservent l'URL d'origine et ajoutent le raccourci dans
   une colonne « URL courte » ; le classeur `.xlsx` suit la cible imprimée et
   ajoute l'URL d'origine. Aucune sortie ne perd une adresse.

Raccourcir a un intérêt concret sur une étiquette de 12 mm : moins de caractères
donnent une matrice plus petite, donc un QR plus lisible et imprimable plus
petit. La contrepartie est réelle et affichée dans l'interface : un lien
raccourci dépend de la survie du service. Pour un usage durable, gardez la cible
« URL collectée ».

## Développement

```bash
npm install
npm test           # cœur JavaScript et surfaces web
npm run test:swift # socle natif NiimbotKit
npm run test:all   # les deux

npm run verify:brave  # parcours complet dans Brave, sur un profil isolé
```

`verify:brave` exige Brave et un accès réseau (le raccourcissement interroge
TinyURL). Il travaille dans `.verify-brave/`, redirige les téléchargements pour
ne jamais toucher à vos Téléchargements, tourne hors écran et supprime tout en
sortant.

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
- `guide-utilisation.md` — le parcours complet, de la collecte à l'impression.

## Incertitudes assumées

### Deux tests Swift en échec

`LabelComposerTests` — le composeur d'étiquettes natif, utilisé par le socle
Swift et non par l'application web :

- `testTopRowsContainTheQrCode` : les premières lignes du rendu CoreGraphics ne
  contiennent pas d'encre, alors que le QR code devrait y commencer ;
- `testShowTitleChangesTheRenderedLabel` : activer le titre ne change pas la
  hauteur du rendu.

Ce sont de vrais défauts de rendu, pas des tests à ajuster. Ils n'ont aucun
effet sur le chemin Brave / web, qui compose ses étiquettes en JavaScript.

### Ce qui ne peut pas être vérifié ici

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
