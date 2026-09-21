# URLQRCodePrinter

**Français** · [English](README.md) · [Guide d'utilisation](docs/guide.fr.md)

Collecter des URL depuis le navigateur (clic droit ou bouton), les garder dans
une base locale, puis les imprimer en étiquettes QR — tableau, export CSV ou
Markdown, ou envoi direct à une imprimante Niimbot.

## Où en est le projet

| Étape | État |
|---|---|
| Cœur métier (liens, QR, étiquettes, stockage, exports) | fait, testé |
| Protocole Niimbot (trames, profils D110 / M2 / M3) | fait, testé |
| Transport Web Bluetooth + session d'impression D110 / M2 / M3 | fait, testé |
| Extension Brave / Chrome (clic droit, popup, liens cliquables) | fait, vérifié dans Brave |
| Application web autonome (liste, exports, mises en page) | fait, vérifié dans Brave |
| Raccourcissement d'URL en option (TinyURL, is.gd, v.gd, spoo.me) | fait, vérifié dans Brave |
| Planches Avery A4 et Letter, calibrage d'impression | fait, géométrie confrontée aux cotes publiées |
| Aperçu d'étiquette Niimbot sans imprimante connectée | fait, vérifié dans Brave |
| Extension Safari — projet Xcode multiplateforme | généré, **compile pour macOS** |
| Extension Safari — page `app.html` éprouvée dans Safari | fait, `npm run verify:safari` (37 vérifications) |
| Extension Safari — chargement de l'extension par Safari | réglage manuel unique, voir « Safari » |
| Socle natif Swift (protocole, session, CoreBluetooth) | fait, testé |
| Application iOS qui utilise ce socle | à faire |

**720 tests, tous verts** — 616 en JavaScript et 104 en Swift — dont :

- la validation **octet à octet** des trames Niimbot contre les relevés
  documentés, **dans les deux langages** : deux implémentations indépendantes
  qui se confirment mutuellement ;
- l'exécution réelle du démarrage de l'application web ;
- la vérification des icônes PNG par décompression ;
- le raccourcissement d'URL, réseau simulé : les pannes réelles des services
  (texte d'erreur renvoyé avec un statut 200, réponse JSON, lien refusé) sont
  reproduites pour être traitées, pas devinées ;
- une **matrice de mise en page** sur les treize dispositions d'étiquettes et
  leurs cas limites — aucune superposition, aucune étiquette hors feuille, pas
  de dérive cumulée — doublée d'une mesure du rendu réel dans Brave ;
- le **calcul inverse** « remplir la feuille » : la grille demandée est
  exactement celle qui sort, sur plus de 400 combinaisons de colonnes, rangées,
  marges et écarts, pour le A4 comme pour le Letter ;
- les **bornes du QR** par type d'impression : la taille du curseur est calculée
  avant le rendu, et la découpe du texte qui en découle est vérifiée ligne à
  ligne.

**L'application est vérifiée dans un vrai navigateur** : `npm run verify:brave`
lance Brave sur un profil isolé, collecte un lien, le raccourcit, exporte le CSV
et l'archive d'étiquettes, puis contrôle les fichiers réellement écrits sur le
disque (signature ZIP, `unzip -t`, contenu du CSV). 131 vérifications, dont le
rendu des liens cliquables dans l'application *et* dans la fenêtre de
l'extension, la grille réellement calculée pour quatre références Avery, et
l'aperçu d'étiquette composé sans aucune imprimante connectée.

**La page de l'extension est vérifiée dans Safari** : `npm run verify:safari`
pilote le Safari réel par WebDriver, charge `app.html`, et compare ses sorties au
cœur exécuté hors navigateur. 37 vérifications — le CSV exporté par Safari est
**identique octet pour octet** à celui du cœur, et le QR dessiné est **identique
module pour module** (31 × 31, 436 modules, zéro écart). Le relevé complet, ce
qui n'a pas pu être vérifié et pourquoi : `docs/safari-extension-verification.md`.

Ce qui reste à éprouver : le chargement de l'extension par Safari lui-même
(étape manuelle, voir ci-dessous), et l'impression sur une imprimante physique.

**La cible iOS du projet Xcode ne se compile pas dans un environnement
restreint.** Xcode a besoin d'écrire dans `~/Library/Developer/CoreSimulator`
pour lancer `IBAgent-iOS`, et clang dans un cache de modules système. Les deux
échouent hors d'un accès complet. Le projet généré est correct : la cible macOS,
qui n'a besoin d'aucun simulateur, compile. Le socle Swift, lui, se compile et
se teste sans réserve (`npm run test:swift`).

Le dossier `docs/archive/qr-niimbot-printer/` est un prototype antérieur, conservé
comme trace du design. **Son code Bluetooth ne peut pas fonctionner** : les UUID
sont des valeurs d'exemple et les commandes envoyées sont du protocole ESC/POS,
pas du Niimbot. Il est remplacé par `src/` et `native/niimbot-kit/`.

## Architecture

Un cœur JavaScript unique, sans dépendance au DOM hors rendu canvas, consommé
par toutes les surfaces :

```
src/core/
  link.js              modèle de lien, normalisation, cible du QR, href sûr
  capture.js           décision de capture depuis un clic contextuel
  qr.js                encodage QR → matrice → bitmap 1 bit/pixel, PNG
  label.js             géométrie d'étiquette, découpe de texte, lisibilité
  raster.js            ImageData → bitmap monochrome pour tête thermique
  sheet.js             planches d'impression : cotes, pagination, calibrage
  store.js             IndexedDB / chrome.storage / mémoire, même interface
  exporters.js         CSV (RFC 4180), Markdown, JSON
  spreadsheet.js       classeur .xlsx avec les QR codes intégrés
  label-export.js      formats d'étiquettes, planche HTML, archive ZIP
  table-export.js      dossier du tableau : modèle JSON, QR PNG, page HTML
  shorten.js           raccourcissement d'URL : services, pannes, rythme
  settings.js          préférences retenues (service, cible du QR)
  i18n.js              messages d'interface fr → en, résolution de la langue
  locales/en.js        table des traductions anglaises
  png.js               encodeur PNG (CompressionStream), CRC et déflate
  zip.js               écriture ZIP sans compression
  xlsx.js              écriture OOXML, images ancrées aux cellules
  download.js          enregistrement de fichier et presse-papiers
  printer/
    packet.js          trames Niimbot, checksum, décodeur de flux
    profiles.js        profils d'imprimantes (largeur de tête, task, densité)
    transport.js       Web Bluetooth : filtrage, groupage, notifications
    printer.js         session d'impression, séquence et acquittements

src/extension-src/     extension MV3 (Brave, Chrome, Edge, Safari)
src/web/               application autonome
scripts/build.mjs      assemble dist/extension et dist/web
scripts/serve.mjs      serveur statique de développement
scripts/make-icons.mjs génère les icônes PNG (encodeur maison, sans dépendance)
scripts/verify-brave.mjs  parcours complet dans Brave, sur un profil isolé
scripts/verify-safari.mjs parcours de la page d'extension dans le Safari réel
scripts/webdriver-safari.mjs  client WebDriver minimal, sans dépendance
scripts/package-safari.mjs  produit le projet Xcode Safari
scripts/test-swift.mjs lance les tests du socle natif
native/safari/         projet Xcode généré (macOS + iOS)
native/niimbot-kit/    socle Swift : protocole, session, CoreBluetooth
```

`src/extension-src/` ne contient **pas** de `manifest.json` : le manifeste est un
gabarit (`manifest.template.json`) que la construction décline en deux variantes.
Ce dossier n'est donc pas chargeable tel quel par un navigateur, ce qui évite la
confusion avec `dist/extension`.

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
npm run verify:safari         # éprouve la page de l'extension dans Safari
```

C'est la voie la plus directe : une extension Safari **est** une application
macOS, et l'exécuter est le seul moyen de l'enregistrer. Le script enchaîne
tout, puis affiche les deux réglages qui restent à faire une fois.

**Ce qui reste à faire une fois, à la main, dans Safari**, dans cet ordre :

1. Réglages → **Avancé** → « Afficher le menu Développeur » ;
2. menu **Développeur** → « Autoriser les extensions non signées » ;
3. Réglages → **Extensions** → cocher « URLQRCodePrinter ».

Ces réglages ne peuvent pas être automatisés, et Safari macOS est le seul
navigateur du projet dans ce cas : `safaridriver` **ne connaît pas** de commande
d'installation d'extension, et l'état des extensions n'est pas lisible depuis un
script. Le relevé complet, avec ce qui a été constaté et ce qui ne peut pas
l'être, est dans `docs/safari-extension-verification.md`.

> `verify:safari` a par ailleurs besoin que Safari accepte WebDriver :
> menu Développeur → « Autoriser l'automatisation à distance », ou
> `sudo safaridriver --enable` — qui demande le mot de passe administrateur,
> donc une fois, à la main.

Pour aller pas à pas :

```bash
npm run package:safari        # assemble, génère les icônes, convertit, aligne
npm run sync:safari           # recopie seulement les ressources de l'appex
```

Le projet apparaît dans `native/safari/`. Ouvrez-le dans Xcode et lancez le
schéma **URLQRCodePrinter (macOS)**.

`native/safari/…/Resources/` est versionné parce que le projet Xcode le
référence, mais ce n'est qu'une **copie** de `dist/extension-safari` : la même
que produit `--copy-resources` du convertisseur d'Apple. `npm run package:safari`
la refait en régénérant tout le projet ; `npm run sync:safari` ne fait que la
copie, sans Xcode. Sans l'une des deux, Xcode compile un `app.js` antérieur à
`src/`.

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

## Ce qui est imprimable est calculé avant, pas signalé après

Un QR code a deux limites physiques, et elles dépendent du **type d'impression** :

| Support | Contrainte | Sur une D110 (203 dpi) | Sur papier |
|---|---|---|---|
| Tête thermique | 2 px par module, sinon la tête fusionne les points | 0,25 mm par module | — |
| Papier (laser, jet d'encre) | 0,4 mm par module, sinon le module n'est plus résolu et l'appareil photo ne fait pas la mise au point | — | 0,4 mm |

`qrRatioBounds` (dans `core/sheet.js`) croise ces contraintes avec la géométrie
de l'étiquette pour produire l'intervalle **autorisé** de la largeur du QR :

- **borne basse** : `qrModules × minModuleMm` — un QR plus petit serait illisible
  une fois imprimé, et la densité de la matrice dépend de la longueur de l'URL :
  sur une L7160, une URL courte laisse régler de 30 à 86 %, une URL de 49 modules
  impose au moins 58 % ;
- **borne haute** : le QR est carré, il doit tenir dans la largeur **et** laisser
  au moins une ligne de texte sous lui.

**Une seule présentation, six valeurs.** Colonnes, rangées, marge
gauche/droite, marge haut/bas, écart entre colonnes, écart entre rangées : la
taille des étiquettes en découle, et une phrase sous les champs l'annonce avec
les dimensions réelles — et rappelle le décalage quand il est actif.

Il y a eu deux modes avant celui-ci, et les deux étaient incompréhensibles pour
une raison différente. « Cotes de la disposition » / « Remplir la feuille »
n'indiquait pas laquelle des deux grandeurs commandait l'autre. Puis « Cotes de
la référence » **masquait les champs** : rien ne disait comment la planche était
remplie. Les champs sont maintenant toujours visibles, et changer de planche
réécrit leurs six valeurs (`presetToGrid`).

Cette conversion mérite d'être comprise : une planche du commerce a une marge
gauche différente de sa marge droite, ce qu'une grille à marge symétrique ne peut
pas reproduire. `presetToGrid` répartit donc également ce qui reste, de sorte que
la **taille d'étiquette et le pas soient exacts** — les colonnes tombent en face
de leurs cases — au prix d'un décalage constant de quelques dixièmes de
millimètre, que les champs de décalage rattrapent. Une erreur de pas, elle,
s'accumulerait d'une colonne à l'autre. Le test de propriété le vérifie pour les
treize dispositions du catalogue.

Le curseur reçoit ces bornes : **il ne peut plus demander un QR impossible**, au
lieu d'afficher un avertissement une fois le réglage fautif choisi. Quand les deux
bornes se croisent — 57 modules sur une tête de 12 mm demandent 14,3 mm — le
message le dit, nomme le lien le plus dense, et propose la seule vraie sortie :
raccourcir l'URL, ce que fait le raccourcisseur.

Le texte suit la même logique : il est découpé en lignes par le script
(`sheetCellLines`), borné au nombre de lignes qui tiennent réellement, et tronqué
avec des points de suspension s'il est trop long. Taille de police et interligne
sont posées en ligne à partir du même calcul que la découpe, donc la hauteur
occupée est exactement la hauteur réservée — un test dans Brave compare les deux.
Auparavant, le texte était laissé au retour à la ligne du navigateur et pouvait
déborder de l'étiquette sans que rien ne le signale.

## Ce qui sera imprimé est écrit, pas à deviner

Deux boutons « Tout » et « Rien » étaient collés au champ de recherche, et ils
cochent en réalité les liens à imprimer. Pire : **les deux aboutissaient au même
résultat**, puisqu'une sélection vide vaut « toute la collection » pour
l'impression. De quoi ne rien comprendre, à juste titre.

Trois corrections :

1. **les deux groupes sont séparés** — la recherche d'un côté, puis un groupe
   intitulé « Sélection » avec « Tout cocher » et « Tout décocher » ;
2. **la portée est écrite sous les boutons** : « Aucun lien coché : l'impression
   portera sur toute la collection (31). » ou « 3 liens cochés sur 31. » ;
3. **le bouton d'impression annonce ce qu'il imprime** : « Imprimer les 31 liens »
   ou « Imprimer la sélection (3) ». La règle la moins devinable de l'application
   — pas de sélection = tout — devient visible sans cliquer.

Le libellé suit chaque case cochée, pas seulement les boutons de groupe : la
vérification dans Brave a justement montré qu'il restait figé sur un état
antérieur quand on cochait une ligne à la main.

## Le classeur : un QR par ligne

Deux défauts réels dans l'export `.xlsx`, trouvés en examinant un fichier
réellement produit :

**L'ancrage n'était pas celui d'Excel.** J'émettais un `oneCellAnchor` — licite,
et lu correctement par deux analyseurs indépendants (le mien et `openpyxl`) — mais
qu'Excel n'écrit jamais. Excel écrit `twoCellAnchor` avec `editAs="oneCell"` et
les marqueurs `from` **et** `to` pour chaque image insérée. On écrit désormais
cette forme-là, avec `to` sur la cellule suivante : l'image est liée à une seule
cellule, celle de son QR.

**Le tableau ne tenait pas sur une page en largeur.** Sept colonnes font environ
309 mm pour du A4 portrait (210 mm) : à l'impression, Excel répartissait les
colonnes sur plusieurs feuilles, et un QR code pouvait sortir sur une autre page
que son URL — exactement « pas un QR par ligne ». La feuille porte maintenant
`fitToPage` + `fitToWidth="1"` et l'orientation paysage, ce qui ramène le tableau
à une largeur de page.

**Et l'image tient dans sa cellule** : QR de 96 px (25,4 mm, un pouce) au lieu de
128, colonne de 19 unités (≈ 138 px), ligne de 76 points. Une image plus large
que sa colonne déborde sur la voisine, et une ligne de 100 points faisait sortir
le tableau de la page.

> Ce qui n'a **pas** pu être vérifié ici : le rendu visuel du classeur. Quick Look
> empile les images flottantes au coin de la feuille quel que soit le balisage —
> je l'ai constaté en changeant la forme de l'ancrage (rendu identique) et en
> comparant avec un classeur produit par `openpyxl` (aucune image affichée). Excel,
> lui, ouvre le fichier et voit bien les dix images, mais son API de script refuse
> les propriétés de géométrie. Les tests vérifient donc ce qui est mesurable :
> un ancrage par ligne, `editAs="oneCell"`, marqueurs consécutifs, largeur de
> colonne et hauteur de ligne suffisantes, mise en page ajustée.

## Brave et Web Bluetooth : détecter, pas espérer

Brave expose `navigator.bluetooth` **et** refuse de s'en servir quand son
drapeau est éteint. Un contrôle qui se contente de regarder si l'objet existe
conclut donc « tout va bien » : le bouton « Connecter » reste actif, et l'échec
n'arrive qu'après le clic, en anglais — `NotFoundError: Web Bluetooth API
globally disabled.` C'est exactement ce qui se passait.

`navigator.bluetooth.getAvailability()` répond `false` dans ce cas, sans rien
demander à l'utilisateur. `probeWebBluetooth` (dans `core/printer/transport.js`)
l'interroge donc au démarrage : le bouton est désactivé, et la marche à suivre
s'affiche **avant** le clic, en français. La réponse `false` couvre deux causes
qu'il ne faut pas confondre dans le message : le drapeau de Brave éteint, et le
Bluetooth de la machine éteint.

| Situation | Ce que dit l'application |
|---|---|
| `navigator.bluetooth` absent | « Web Bluetooth n'est pas disponible dans ce navigateur » + Safari n'en a pas |
| API présente, `getAvailability()` faux | « désactivé dans ce navigateur — ou le Bluetooth de cet ordinateur est éteint » + marche à suivre |
| Contexte non sécurisé | « exige un contexte sécurisé » + passer par https ou localhost |
| Échec après le clic | le message anglais est traduit (`explainBluetoothFailure`) |

La marche à suivre est écrite une seule fois (`BRAVE_BLUETOOTH_HINT`), et le nom
du drapeau vient des sources de Brave (`browser/about_flags.cc`) :
`brave-web-bluetooth-api`, à activer puis à **relancer** le navigateur.

## L'import relit tout ce que l'export produit

L'import n'acceptait qu'**une seule** des formes que l'application sait écrire :
l'archive JSON du bouton « Archive ». Le CSV exporté, le dossier d'étiquettes
`.zip` et le `export.json` qu'il contient étaient refusés. Autrement dit, on ne
pouvait pas réimporter ce qu'on venait d'exporter — ce qui rendait la fonction
incompréhensible, et c'était le principal malentendu.

`core/import.js` accepte maintenant les trois formes, en s'appuyant sur ce qu'on
écrit :

| Fichier fourni | Ce qui est relu |
|---|---|
| `liens-qr-….json` (bouton « Archive ») | tout le modèle : URL, titre, tags, note, date de collecte, raccourci, identifiant |
| `etiquettes-qr-….zip` (dossier d'étiquettes) | les liens de son `export.json` — l'URL d'origine est préférée à la cible imprimée, qui reste comme raccourci |
| `export.json` extrait à la main | les mêmes |
| `….csv` (bouton « CSV ») | URL, titre, tags, note, date — colonnes repérées par leur en-tête, donc un tableur qui les réordonne reste importable |

Le ZIP est relu par `readStoredZip` : nos archives sont écrites sans compression
(`method: 0`), donc un lecteur d'en-têtes locaux suffit, et une entrée compressée
est signalée plutôt que rendue de travers.

Trois règles, décidées pour que l'import ne fasse jamais de dégât :

1. **il ajoute, il ne remplace pas** — la collection courante est conservée ;
2. **un doublon est ignoré**, pas fusionné : réimporter deux fois la même archive
   ne crée rien, et le message distingue « déjà présent » de « illisible » plutôt
   que d'annoncer un échec ;
3. **une ligne illisible ne fait pas échouer le reste** : elle est comptée.

Un garde-fou de test accompagne cela : `test/web.test.js` vérifie que **chaque nom
importé par `app.js` est bien exporté par le module visé**. Il est né d'une erreur
réelle — `parseImportFile` appelé sans avoir été importé — qu'aucun test de
démarrage ne pouvait voir, puisque le corps de la fonction n'est jamais exécuté
au chargement.

## Dater une étiquette : une option, jamais un fragment

La date de collecte peut être imprimée sous le QR code — `Aucune`, `Date de
collecte`, `Date et heure de collecte`. Aucune par défaut : chaque ligne sous le
QR se paie en place disponible, et une étiquette de 12 mm n'en a pas de reste.
Le choix vaut pour les quatre mises en forme : planche, tableau (une colonne
« Date »), étiquette Niimbot, et archive d'images.

**Une date est complète ou absente.** C'est la règle, et elle vient d'un défaut
constaté en vérifiant : sur une étiquette de 12 mm, le plafond de lignes amputait
la date à « 15/09/ » — le millésime perdu, donc une date **fausse**, ce qui est
pire que pas de date. Désormais :

- les lignes de la date sont réservées **avant** celles du texte principal, et
  jamais coupées par le plafond ;
- au-delà de deux lignes (`DATE_MAX_LINES`), la date est abandonnée entièrement
  plutôt qu'imprimée en partie ;
- sur la planche, où la date tient sur une seule ligne, elle est écartée si la
  colonne est trop étroite, et le message le dit ;
- sur l'étiquette Niimbot, `drawLabel` ne découpe pas cette ligne : elle n'est
  demandée à la géométrie (`extraLines`) que si elle tient, ce qui évite un
  dépassement horizontal ;
- l'archive consigne `datesOmitted`, et les aperçus affichent la raison — sans
  quoi l'option semblerait sans effet.

Le calcul des bornes du QR compte la date comme une ligne de plus : activer la
date fait baisser la borne haute du curseur (86 % → 79 % sur une L7160), parce
que le QR doit laisser la place de deux lignes au lieu d'une.

## Un export ne doit rien contenir d'insaisissable

Règle du projet, née de deux remarques justes : le Markdown portait un titre
choisi par le programme (« Mes liens QR »), et une colonne « Tags » qu'aucune
interface ne permettait de remplir. Un export qui transporte des colonnes vides,
ou un titre qui n'est pas celui de l'utilisateur, est un export faux.

Ce qui a été mis en cohérence :

| Champ | Saisie | Sorties |
|---|---|---|
| URL | champ « Ajouter », extension | toutes |
| Titre | éditeur de la ligne (✎) | CSV, Markdown, classeur, dossier du tableau, nom des fichiers d'étiquettes |
| Tags | éditeur de la ligne (✎), virgules | CSV, Markdown, classeur, dossier du tableau |
| Note | éditeur de la ligne (✎) | CSV, Markdown, classeur, tableau imprimé, dossier du tableau |
| Nom de collection | champ « Nom de la collection » | titre du Markdown, titre de la planche HTML, nom des fichiers exportés, titre du tableau HTML |

Deux choix méritent d'être connus :

**Les colonnes facultatives n'apparaissent que si elles servent.** « Note » (dans
le Markdown et le classeur), « URL courte » (CSV) et « URL d'origine » (dans les
exports d'une collection raccourcie) ne sont ajoutées que si au moins un lien a
la valeur correspondante. Sans cela, un tableau à sept colonnes dont une vide sur
toute la hauteur, et les tests existants auraient dû changer à chaque ajout.

**Dans le classeur, la note se place avant la colonne des QR codes**, dont
l'index est donc recalculé (`spreadsheetLayout`) : une image ancrée sur la
mauvaise colonne serait tout simplement invisible. Les tags y sont écrits sans
« # », comme dans le CSV : dans un tableur, le dièse gêne le filtrage.

Les tags ne s'impriment pas sur les étiquettes : ils classent la collection, et
les étiquettes portent le QR et le texte choisi. Ils ressortent en revanche dans
tous les exports de données.

## Planches d'étiquettes

Les dispositions sont rangées en deux familles : des **grilles génériques**, à
régler soi-même, et des **références commerciales** dont les cotes sont
reproduites telles que les fabricants les publient — Avery L7160, L7159, L7162,
L7163, Zweckform 3475 sur A4, et 5160 / 5162 / 5163 / 6871 sur Letter.

Deux points de conception méritent d'être connus avant de toucher à ce code.

**Les marges situent le coin de la première étiquette**, elles ne sont pas
symétriques. Sur une L7160 il y a 8,6 mm à gauche et 5,1 mm à droite ; un modèle
à marges symétriques ne placerait que deux colonnes sur trois. `marginXMm` et
`marginYMm` sont donc des décalages depuis le bord gauche et le bord haut, et la
marge de droite est ce qui reste.

**La géométrie de la planche vit hors de `@media print`.** L'aperçu à l'écran et
la feuille imprimée partagent les mêmes règles, donc la même mise en page. Ça
n'a pas toujours été le cas : tant que `.print-cell` n'était positionné que dans
le bloc d'impression, l'aperçu empilait les étiquettes en une seule colonne, le
texte d'une étiquette débordait sur sa voisine, et le curseur de largeur du QR
n'avait aucun effet — le SVG gardait sa taille intrinsèque dans une boîte que
personne ne contraignait. La leçon est dans les tests : `test/sheet-matrix.test.js`
couvre la géométrie pure sur tous les formats, et `npm run verify:brave` mesure
le DOM réellement calculé par le navigateur (colonnes distinctes, aucune
superposition, QR contenu dans sa boîte, effet du curseur). Un test de géométrie
seul n'aurait jamais vu ce défaut.

**Le nombre de colonnes peut devenir une consigne.** Par défaut, la géométrie
déduit la grille des cotes ; c'est ce qu'il faut pour une planche commerciale.
En mode « remplir la feuille », l'utilisateur choisit au contraire colonnes,
rangées, marge globale et écart, et la taille des étiquettes en découle
(`fitGrid`). Ces deux sens de calcul ne peuvent pas cohabiter sur les mêmes
noms : les préréglages portent donc `declaredColumns` / `declaredRows`, que
`computeSheet` **ne lit pas**. Les nommer `columns` / `rows` aurait été un piège
— `computeSheet` y aurait vu une grille explicite à honorer, et le test qui
confronte la géométrie au nombre d'étiquettes annoncé serait devenu circulaire.
`test/sheet-matrix.test.js` vérifie explicitement que ce piège reste désamorcé.

**Les ressources construites portent une empreinte de leur contenu.** Sans elle,
un navigateur peut servir un `style.css` du build précédent alors que le HTML et
les scripts sont à jour : les nouveaux réglages apparaissent, mais la mise en
page reste l'ancienne. C'est arrivé, et le diagnostic a été long — la planche
s'affichait en une seule colonne, curseur de largeur du QR sans effet, alors que
le correctif était bien sur le disque. Deux parades : l'URL porte une empreinte
(`style.css?v=…`), et l'application **détecte** une feuille de style périmée en
lisant une propriété que seule la feuille définit, puis l'annonce dans un bandeau
persistant — `test/web-stale-css.test.js` couvre les deux branches.

**Calibrer reste nécessaire.** Aucune cote de fabricant ne prévoit l'entraînement
d'une imprimante donnée : les champs « Décalage horizontal / vertical » déplacent
toute la grille, sans la modifier. Et la taille du papier est posée
dynamiquement (`@page`), sans quoi une planche Letter partirait sur du A4, donc
réduite et décalée.

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

Le champ « Service » ne demande pas d'arbitrer entre quatre marques : son
libellé dit ce que chaque service change pour un usage ordinaire, et
**TinyURL — recommandé** est proposé d'emblée. Qui veut seulement un lien plus
court clique « Raccourcir » sans toucher au réglage.

| Service | Libellé affiché | Clé d'API | Remarque |
|---|---|---|---|
| TinyURL | TinyURL — recommandé | aucune | défaut ; HTTPS, liens durables |
| is.gd | is.gd — sans statistiques | aucune | service bénévole, régulièrement indisponible |
| v.gd | v.gd — avertissement avant redirection | aucune | même infrastructure que is.gd, avec page d'avertissement |
| spoo.me | spoo.me — statistiques de clics | aucune | répond en HTTP, ramené en HTTPS |

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
   tableau, étiquettes, ZIP d'images, dossier du tableau, impression Niimbot. Les
   exports de *données* (CSV, JSON) conservent l'URL d'origine et ajoutent le
   raccourci dans une colonne « URL courte » ; le classeur `.xlsx` suit la cible
   imprimée et ajoute l'URL d'origine, et le modèle du tableau garde l'adresse
   collectée dans `sourceUrl`. Aucune sortie ne perd une adresse.

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
npm run verify:safari # parcours de la page d'extension dans le Safari réel
```

`verify:brave` exige Brave et un accès réseau (le raccourcissement interroge
TinyURL). Il travaille dans `.verify-brave/`, redirige les téléchargements pour
ne jamais toucher à vos Téléchargements, tourne hors écran et supprime tout en
sortant.

`verify:safari` exige Safari et `safaridriver`. Il n'existe pas de profil isolé
pour Safari : le script pilote le Safari réel, c'est pourquoi il ne modifie
aucun réglage, intercepte les exports au lieu de les enregistrer, et ferme ses
fenêtres en sortant. Il dit à la fin ce qu'il n'a **pas** pu vérifier.

`npm test` construit d'abord `dist/` (script `pretest`), car plusieurs tests
portent sur l'artefact assemblé. Lancer `node --test` directement sans avoir
construit échoue avec un message explicite.

### Environnement

- **Cache npm local.** Certains environnements contraints ne peuvent pas écrire
  dans `~/.npm`. Un `.npmrc` local — non suivi par git — peut alors rapatrier le
  cache dans le projet (`.npm-cache/`). Si votre environnement exporte déjà
  `npm_config_cache`, il a la priorité sur le `.npmrc` — neutralisez-le :
  `env -u npm_config_cache npm install`.
- **Xcode.** `xcode-select` pointe sur les Command Line Tools. Les outils
  Xcode restent utilisables sans `sudo` en préfixant les commandes :
  `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun …`

## Documents de référence

- [docs/guide.fr.md](docs/guide.fr.md) — le parcours complet, de la collecte à
  l'impression : raccourcissement, planches Avery et leur calibrage, aperçu
  Niimbot hors ligne, exports sans imprimante, dépannage.
- [docs/protocole-niimbot-ble.fr.md](docs/protocole-niimbot-ble.fr.md) —
  protocole BLE Niimbot : UUID, format de trame, séquences d'impression,
  contraintes Web Bluetooth et CoreBluetooth, et les points restant à vérifier
  sur matériel.
- [docs/note-capacites-capture-url-safari-brave.md](docs/note-capacites-capture-url-safari-brave.md)
  — matrice de capacités des extensions navigateur sur Safari macOS, Safari iOS
  et Brave.
- [docs/safari-extension-verification.md](docs/safari-extension-verification.md)
  — ce qui a été vérifié dans le Safari réel, et ce qui ne peut pas l'être.
- [docs/README.md](docs/README.md) — index de toute la documentation.

## Incertitudes assumées

### Un défaut corrigé dans le composeur natif

Deux tests de `LabelComposerTests` échouaient, et l'analyse a montré qu'ils ne
relevaient pas de la même cause :

- **Un vrai défaut, corrigé.** Activer le titre ne changeait pas la hauteur du
  rendu : le titre était dessiné *par-dessus* la première ligne d'URL, et la
  dernière ligne d'URL sortait du bas de l'image — rognée en silence. La
  géométrie réserve désormais la ligne du titre (`reservedLines`), et le plafond
  de lignes porte sur le total, titre compris.
- **Un test faux.** `testTopRowsContainTheQrCode` cherchait de l'encre dans les
  dix premières lignes. C'était impossible par construction : les deux modules
  de blanc qui entourent le QR — sa zone de silence, sans laquelle aucun lecteur
  n'accroche — occupent exactement cette bande. Le test vérifie maintenant la
  position du premier pixel encré, `marge + 2 × échelle`, ce qui est plus précis
  que ce qu'il vérifiait avant.

Ce composeur sert le socle Swift, pas le chemin Brave / web, qui compose ses
étiquettes en JavaScript.

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

## Licence

MIT — voir [LICENSE](LICENSE). Le projet est utilisable, modifiable et
redistribuable, y compris commercialement, à condition de conserver la mention
de copyright.

## Contribuer

Le code, les commentaires, les messages d'erreur et les commits sont en
français ; la documentation existe en français et en anglais. Avant d'ouvrir une
pull request :

```bash
npm install
npm run test:all   # 616 tests JavaScript + 104 tests Swift
```

Les conventions du dépôt — cœur sans DOM ni réseau implicite, zéro dépendance,
commentaires qui expliquent *pourquoi* — sont détaillées dans
[CONTRIBUTING.md](CONTRIBUTING.md).

