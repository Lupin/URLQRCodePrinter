# Fiche Chrome Web Store — éléments à saisir

[← Documentation](README.md)

Ce document rassemble les textes à coller dans le portail développeur, et les
points qui ne peuvent pas être traités depuis le dépôt.

Il vient après [preparation-app-store.fr.md](preparation-app-store.fr.md), qui
couvre la voie Apple. Les deux fiches doivent raconter la **même** réalité.

---

## 1. L'URL publique de la politique

Le portail exige une **adresse publique** pour la politique de confidentialité.
Elle existe depuis que le dépôt est publié :

```
https://github.com/Lupin/URLQRCodePrinter/blob/main/PRIVACY.md
```

C'est l'adresse à saisir dans le champ « Privacy policy URL ». GitHub rend le
Markdown en page web : c'est une URL publique valide, vérifiée accessible
(HTTP 200) depuis l'extérieur.

Deux variantes possibles, si vous préférez :

1. **GitHub Pages**, pour une adresse plus présentable
   (`https://lupin.github.io/URLQRCodePrinter/privacy`) — demande d'activer
   Pages sur le dépôt.
2. **Une page sur votre propre site**, si vous en avez un.

Un point à ne pas perdre de vue : cette page est désormais **la référence
publique**. Toute modification de `PRIVACY.md` doit être poussée pour que la
déclaration reste exacte — la FAQ du magasin sanctionne tout écart entre la
politique publiée, les déclarations du portail et le comportement réel.

---

## 2. Description de la fiche

### Résumé court (limite : 132 caractères)

**FR**

> Collectez des liens depuis votre navigateur et imprimez-les en étiquettes QR. Tout reste sur votre appareil.

**EN**

> Collect links from your browser and print them as QR labels. Everything stays on your device.

### Description détaillée

Le champ du portail **n'interprète pas le Markdown** : les textes ci-dessous sont
en texte brut exprès — pas de `**`, pas de `#`, pas d'astérisques de liste, qui
s'afficheraient littéralement sur la fiche. À coller tels quels.

Le point 4 de la politique *Limited Use* impose que la collecte d'activité de
navigation soit **décrite de façon prominente sur la fiche**. C'est pourquoi
l'encadré « Ce que l'extension lit » reste dans les premiers paragraphes, et non
relégué en bas de page.

> **Rejet « Yellow Argon » — spam dans les mots clés.** La version précédente de
> cette description énumérait les références de planches d'étiquettes et les
> codes de consommables (« Avery L7160, L7159, … Zweckform 3475 … »). Le magasin
> y a vu du bourrage de mots clés, à raison : une énumération de références
> commerciales n'est pas une description. **Règle qui en découle : aucun
> catalogue de références ni de codes produit dans les métadonnées de la fiche.**
> La compatibilité se dit en une phrase, sans liste. Ces catalogues restent dans
> l'application, où ils servent à quelque chose, mais pas sur la fiche.

**FR**

```
URLQRCodePrinter transforme les adresses que vous croisez en étiquettes QR à coller sur vos affaires, vos dossiers, vos câbles ou vos étagères. Il en fait aussi une collection de liens que vous pouvez rechercher, classer, raccourcir, exporter et imprimer : sur une planche d'étiquettes autocollantes, sur une imprimante d'étiquettes thermique en Bluetooth, ou sous forme de dossier d'images prêt à imprimer.

Ce que l'extension lit

Quand vous cliquez sur « Ajouter cette page », sur « Ajouter ce lien », sur une image, sur un texte sélectionné, ou sur le bouton de la barre d'outils, l'extension lit l'adresse et le titre de la page que vous visez : uniquement celle-là, et uniquement à ce moment-là. Elle n'a accès ni à votre historique, ni aux onglets que vous ne visez pas, et ne lit rien en arrière-plan.

Où vont ces données

Nulle part. Les liens collectés, leurs titres, leurs tags, leurs notes et leurs dates restent dans le stockage local du navigateur. Il n'y a ni compte, ni serveur, ni mesure d'audience, ni publicité.

Le seul envoi réseau

Le raccourcissement d'un lien est la seule fonction qui envoie quoi que ce soit : l'adresse à raccourcir part alors vers le service que vous avez choisi, et rien d'autre ne l'accompagne. Si vous ne l'utilisez pas, l'extension n'émet aucune requête et fonctionne entièrement hors ligne.

Collecter un lien en un geste

- Clic droit sur un lien, une page, une image ou un texte sélectionné.
- Bouton de la barre d'outils : enregistre l'onglet courant.
- Champ d'ajout : saisie manuelle d'une adresse.
- Importation : relit une archive exportée d'ici, un dossier d'étiquettes ou un fichier CSV, même retravaillé dans un tableur. Les liens déjà présents sont ignorés, jamais dupliqués.

Les adresses sont normalisées à l'entrée : le schéma est complété si besoin, le fragment de navigation est retiré et les paramètres de campagne publicitaire sont supprimés, car ils allongent le QR code sans rien apporter sur le papier.

Retrouver et organiser

- Recherche instantanée dans toute la collection.
- Titre, tags et note libres sur chaque lien, par le bouton crayon de la ligne.
- Les tags s'affichent en pastilles : un clic filtre la collection.
- Nom de la collection, repris dans les exports et dans le nom des fichiers.
- Titres et adresses cliquables : ils ouvrent l'onglet.
- Date de collecte conservée pour chaque lien, imprimable avec ou sans l'heure.

Imprimer sur une planche d'étiquettes

- Dispositions génériques réglables au millimètre près, ou planches du commerce en A4 et en Letter, préconfigurées aux dimensions publiées par leur fabricant.
- Aperçu fidèle de la planche, en-tête de page avec le nom de la collection et la date d'impression, choix des colonnes imprimées.
- Calibration par décalage horizontal et vertical en millimètres : aucune dimension constructeur ne connaît le décalage d'entraînement de votre imprimante. La marche à suivre est écrite dans l'interface.
- Un mode tableau dense, avec grille optionnelle, orientation portrait ou paysage et marges réglables, pour relire ou archiver sur papier.

Imprimer directement sur une imprimante d'étiquettes

- Imprimantes Niimbot compatibles, avec les rouleaux réellement vendus pour chacune.
- Densité, nombre d'exemplaires, taille du texte et orientation du texte : droit, tourné dans les deux sens, ou en colonne à côté du QR code.
- Contenu de l'étiquette composable : numéro, titre, adresse, domaine, date, heure.
- Longueur d'étiquette renseignée : la composition remplit la bande au lieu de s'arrêter après le contenu.
- Impression en série de toute la collection ou de la sélection cochée, plusieurs exemplaires par lien, avec un bouton d'arrêt qui termine proprement l'étiquette en cours.
- Aperçu exact sans imprimante connectée : dimensions, nombre de modules et pixels par module sont calculés depuis le profil du modèle. Vous pouvez juger un rendu, ou savoir si une adresse tient sur une étiquette étroite, avant même d'acheter le matériel.
- Une étiquette illisible est refusée avec un message explicite, plutôt que d'imprimer un QR code qui ne se scannerait pas.

Sous Brave, l'accès Bluetooth doit être activé dans les réglages avancés du navigateur ; l'application détecte ce cas et affiche la procédure. Chrome et Edge n'ont pas cette contrainte.

Exporter vers n'importe quelle imprimante

- Dossier d'images : une image par étiquette à la résolution du format choisi, une planche prête à imprimer, la correspondance entre les adresses et les fichiers, et les réglages utilisés. Utilisable avec les rouleaux du commerce ou sur papier ordinaire.
- Tableur : un vrai classeur où chaque ligne porte son QR code en image et son adresse cliquable. Un CSV ne peut pas transporter d'image.
- Dossier de tableau : le modèle des données, les QR codes en images et la table en page web.
- CSV lisible par un tableur, Markdown en tableau ou en liste, et archive complète réimportable.

Raccourcir un lien (optionnel)

Quatre services au choix, sans clé d'API ni compte. L'adresse d'origine n'est jamais remplacée : le lien court est conservé à côté. Moins de caractères, donc moins de modules : le QR code devient plus lisible et peut être imprimé plus petit. Vous choisissez ce que le QR code encode, l'adresse d'origine ou le lien court, et ce choix vaut pour toutes les sorties.

Ce que l'extension ne fait pas

- Aucun compte, aucune inscription, aucun serveur de l'éditeur.
- Aucune mesure d'audience, aucun rapport de plantage, aucune publicité.
- Aucune donnée vendue ni transmise à des courtiers en données.
- Aucun historique de navigation lu en dehors du lien que vous visez.
- Aucun code distant : tout ce que l'extension exécute est embarqué dans le paquet. Le code est ouvert, sous licence MIT, et vérifiable.

Interface

Français et anglais, au choix dans l'application.

Prérequis

Chrome sur ordinateur ; fonctionne aussi dans Brave et Edge. L'impression Bluetooth directe exige une imprimante compatible. À défaut, l'export d'images, le classeur, les planches d'étiquettes et l'impression PDF fonctionnent avec n'importe quelle imprimante.
```

**EN**

```
URLQRCodePrinter turns the addresses you come across into QR labels you can stick on your belongings, folders, cables or shelves. It also keeps them as a collection of links you can search, tag, shorten, export and print: on a sheet of self-adhesive labels, on a thermal label printer over Bluetooth, or as a folder of print-ready images.

What the extension reads

When you click "Add this page", "Add this link", an image or a piece of selected text, or the toolbar button, the extension reads the address and title of the page you act on: only that one, and only at that moment. It has no access to your history or to tabs you did not target, and it reads nothing in the background.

Where that data goes

Nowhere. Collected links, their titles, tags, notes and dates stay in the browser's local storage. There is no account, no server, no analytics and no advertising.

The only network request

Shortening a link is the only feature that sends anything: the address to be shortened then goes to the service you chose, and nothing else accompanies it. If you do not use it, the extension makes no request at all and works fully offline.

Collect a link in one gesture

- Right-click a link, a page, an image or selected text.
- Toolbar button: saves the current tab.
- Add field: type an address by hand.
- Import: reads back an archive exported from here, a label folder or a CSV file, even one edited in a spreadsheet. Links already present are skipped, never duplicated.

Addresses are normalised on entry: the scheme is completed when missing, the navigation fragment is removed and advertising campaign parameters are stripped, since they lengthen the QR code without adding anything on paper.

Find and organise

- Instant search across the whole collection.
- A free title, tags and a note on every link, through the pencil button on the row.
- Tags appear as chips: one click filters the collection.
- A collection name, reused in the exports and in the file names.
- Titles and addresses are clickable and open in a tab.
- A collection date on every link, printable with or without the time.

Print on a sheet of labels

- Generic layouts adjustable to the millimetre, or commercial A4 and Letter sheets preconfigured to the dimensions published by their manufacturer.
- Faithful sheet preview, page header with the collection name and the print date, and a choice of printed columns.
- Calibration by horizontal and vertical offset in millimetres: no manufacturer's dimension knows your printer's feed offset. The procedure is written in the interface.
- A dense table mode, with an optional grid, portrait or landscape orientation and adjustable margins, for reviewing or archiving on paper.

Print directly on a label printer

- Compatible Niimbot printers, with the rolls actually sold for each of them.
- Density, copies, text size and text orientation: upright, rotated either way, or a column beside the QR code.
- Composable label content: number, title, address, host, date, time.
- A label length field: the composition fills the band instead of stopping after the content.
- Batch printing of the whole collection or the checked selection, several copies per link, with a stop button that ends cleanly after the current label.
- Exact preview with no printer connected: dimensions, module count and pixels per module are computed from the model's profile. You can judge a rendering, or find out whether an address fits on a narrow label, before buying the hardware.
- An illegible label is refused with an explicit message, rather than printing a QR code that will not scan.

In Brave, Bluetooth access has to be enabled in the browser's advanced settings; the app detects this case and shows the procedure. Chrome and Edge have no such constraint.

Export to any printer

- Image folder: one image per label at the resolution of the chosen format, a ready-to-print sheet, the mapping between addresses and files, and the settings used. Works with commercial rolls or plain paper.
- Spreadsheet: a real workbook where each row carries its QR code as an image and its clickable address. A CSV cannot carry an image.
- Table folder: the data model, the QR codes as images and the table as a web page.
- Spreadsheet-readable CSV, Markdown as a table or a list, and a complete archive that can be imported back.

Shorten a link (optional)

Four services to choose from, with no API key and no account. The original address is never replaced: the short link is kept alongside it. Fewer characters means fewer modules, so the QR code is more legible and can be printed smaller. You choose what the QR code encodes, the original address or the short link, and that choice applies to every output.

What the extension does not do

- No account, no sign-up, no server operated by the publisher.
- No analytics, no crash reporting, no advertising.
- No data sold or transferred to data brokers.
- No browsing history read beyond the link you act on.
- No remote code: everything the extension executes ships inside the package. The code is open source (MIT licence) and auditable.

Language

French and English, selectable in the app.

Requirements

Chrome on desktop; also works in Brave and Edge. Direct Bluetooth printing needs a compatible printer. Otherwise, image export, the workbook, label sheets and PDF printing work with any printer.
```

### Objectif unique (*single purpose*)

Le portail demande de résumer la fonction de l'extension en une phrase. Celle-ci
doit correspondre exactement à ce que la description annonce :

> Collect links the user chooses from the browser and turn them into printable QR
> labels, stored and processed entirely on the user's device.

---

## 3. La mention dans l'interface — le point que la fiche ne couvre pas

**C'est le manque le plus sérieux du projet aujourd'hui.** La FAQ officielle est
sans ambiguïté ([Updated Privacy Policy & Secure Handling Requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq),
questions 10 et 13) :

> The prominent disclosure and consent must occur within the Product's user
> interface. **Disclosures in the Chrome Web Store description or inline
> installation page do not satisfy this requirement.**

Et la politique *Limited Use* (point 4) exige que la collecte d'activité de
navigation soit décrite *« prominently in the Product's Chrome Web Store page
**and in the Product's user interface** »*.

Autrement dit, une fiche parfaite ne suffit pas : **l'extension doit elle-même
dire ce qu'elle lit, et l'utilisateur doit accomplir une action explicite pour
l'accepter** avant que la collecte ne commence.

### État actuel : rien

### Implémenté

Une page `privacy.html` s'ouvre à la première installation et présente la
mention : ce qui est lu, ce qui ne l'est pas, où vont les liens, et le seul
transfert à un tiers. Deux boutons — **J'accepte**, **Je refuse** — enregistrent
une décision dans `chrome.storage.local`.

| Élément | Où |
|---|---|
| Page de mention | `src/extension-src/privacy.html` |
| Logique de consentement | `src/core/privacy.js` |
| Décision (accepter / refuser) | `src/extension-src/privacy.js` |
| Ouverture à l'installation | `background.js`, `onInstalled` avec `reason === 'install'` |
| Verrou de collecte (clic droit) | `record()` dans `background.js` |
| Verrou de collecte (fenêtre) | `addCurrentTab()` dans `popup.js` |
| Rappel visuel | encart `#consent-notice` dans `popup.html` |

Quatre choix méritent d'être connus, parce qu'ils sont délibérés :

1. **Le verrou est dans `record()`, pas chez les appelants.** C'est le point de
   passage unique de toute collecte du service worker — clic droit, message, ou
   appel ajouté plus tard. Le placer chez les appelants ferait dépendre la
   garantie de leur discipline, et un chemin oublié collecterait sans accord.
2. **La fenêtre a son propre verrou.** C'est un second chemin d'enregistrement :
   n'en verrouiller qu'un suffirait à contourner la mention.
3. **Un refus n'est pas une absence.** Après un refus explicite, la mention ne se
   rouvre plus toute seule — elle n'est reproposée que si l'utilisateur ne s'est
   jamais prononcé. Rouvrir un onglet à chaque tentative serait du harcèlement.
4. **`DISCLOSURE_VERSION` invalide les accords périmés.** Le jour où la mention
   dit autre chose, il faut incrémenter cette constante : les consentements
   antérieurs cessent alors de valoir, et la page est présentée de nouveau.

### Ce qu'il reste à vérifier à la main

Le déclenchement réel de `onInstalled` et l'ouverture de l'onglet ne sont pas
couverts par les tests : ils vivent dans le navigateur. À éprouver une fois avec
`npm run open:extension` — installer, vérifier que la page s'ouvre, refuser,
constater qu'aucun lien n'est enregistré, puis accepter et constater l'inverse.

Le point 4 de la FAQ « Minimum Permission » demande par ailleurs que la liste des
permissions et leurs raisons figurent *« in your Chrome Web Store listing or in
an "about page" in your extension »*. La section 5 ci-dessous couvre la fiche ;
un renvoi depuis l'interface serait plus solide.

### Pourquoi ce n'est pas cosmétique

La FAQ est explicite sur la sanction en cas d'écart entre la politique publiée,
les déclarations du portail et le comportement réel :

> Any discrepancies between the developer dashboard disclosures, your privacy
> policy, and the behavior of your item would be a violation […] This can result
> in the suspension of all the items owned by the publisher, deactivation of the
> existing user-base, and ban of the entire publisher entity (including related
> accounts).

C'est **tout le compte éditeur** qui est engagé, pas seulement cette extension —
ce qui rejoint le caractère au niveau du compte du choix trader/non-trader.

---

## 4. Justification des permissions

Chaque permission déclarée doit être justifiée. Texte à adapter si le portail
attend une formulation plus courte.

| Permission | Justification à coller |
|---|---|
| `contextMenus` | To let the user add the current page, a link, or selected text to their collection directly from the right-click menu. |
| `storage` | To keep the user's collected links and preferences on their own device. Nothing is synchronised or transmitted. |
| `activeTab` | To read the address of the current tab when the user explicitly clicks the toolbar button, and only then. The extension does not run in the background and has no access to browsing history. |
| `scripting` | To read the title of the page being added, so the resulting label is recognisable. Injected only into the active tab, on the user's action. |

---

## 5. Champs de confidentialité

Ce que l'extension traite réellement, tel que vérifié dans le code :

| Question du portail | Réponse |
|---|---|
| Collecte-t-elle des données ? | Oui, mais **localement** : les liens que l'utilisateur ajoute. |
| Ces données sont-elles transmises à l'éditeur ? | **Non.** Aucun serveur, aucun compte. |
| Données vendues à des tiers ? | **Non.** |
| Utilisées pour la publicité ? | **Non.** |
| Mesure d'audience ou télémétrie ? | **Non.** |
| Script distant ? | **Non** : tout le code est embarqué. |
| Historique de navigation ? | **Non** — seulement l'adresse de l'onglet actif, à la demande. |

La FAQ (question 3) ferme la porte à l'argument « tout est local, donc rien à
déclarer » :

> Extensions are required to disclose how they handle user data, even when data
> is processed or stored locally on a user's device and is not transmitted to
> external servers or third parties.

**Le raccourcissement doit être déclaré.** Envoyer une adresse à TinyURL, is.gd,
v.gd ou spoo.me est un transfert à un tiers. Il est justifié — c'est la fonction
demandée par l'utilisateur, et elle est nécessaire au résultat — mais il serait
faux de cocher « aucune donnée transmise ». La politique *Limited Use* autorise
ce transfert au titre du point 5.2.1 : *« If necessary to providing or improving
your single purpose »*.

---

## 6. Ce qui reste à produire

| Élément | État |
|---|---|
| Archive déposable | **Fait** — `npm run package:chrome` → `dist/url-qrcode-printer-chrome.zip` |
| Politique de confidentialité | **Publiée** — `PRIVACY.md`, accessible à l'URL de la section 1 |
| Description et résumé | **Rédigés** ci-dessus |
| Justifications de permissions | **Rédigées** ci-dessus |
| Choix trader / non-trader | **Traité** |
| Mention et consentement dans l'interface | **Fait** — voir section 3 ; reste à éprouver à la main dans le navigateur |
| Captures d'écran | **À produire** — déposer dans `store/screenshots/`, voir son README |
| **Petite image promotionnelle 440×280** | **À produire — obligatoire.** Sans elle, la fiche est reléguée derrière les autres |
| Icône de la fiche | Déjà conforme : `src/extension-src/icons/icon-128.png` (128×128, avec alpha, vérifié) |
| Image « marquee » 1400×560 | Facultative — nécessaire seulement pour être mis en avant |
| Catégorie et langue | À choisir : la locale par défaut du manifeste est `fr` |
| Instructions de test pour la revue | À rédiger si l'extension exige une action particulière |

Les dimensions des visuels sont récapitulées dans [`store/README.md`](../store/README.md),
avec la source officielle.

---

## 7. Sources

- [Limited Use](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
- [Updated Privacy Policy & Secure Handling Requirements (FAQ)](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Trader/Non-Trader developer identification and verification](https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure)
- [Trader FAQ](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq)
- [Chrome Web Store payments deprecation](https://developer.chrome.com/docs/webstore/cws-payments-deprecation)
- [Supplying images](https://developer.chrome.com/docs/webstore/images)
- [Fill out the privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
