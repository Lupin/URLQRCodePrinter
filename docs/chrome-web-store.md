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

Le point 4 de la politique *Limited Use* impose que la collecte d'activité de
navigation soit **décrite de façon prominente sur la fiche**. C'est pourquoi
l'encadré ci-dessous doit rester dans les premiers paragraphes, et non relégué en
bas de page.

**FR**

> URLQRCodePrinter transforme les adresses que vous croisez en étiquettes QR à
> coller sur vos affaires, vos dossiers ou vos câbles.
>
> **Ce que l'extension lit.** Quand vous cliquez sur « Ajouter cette page »,
> « Ajouter ce lien » ou sur le bouton de la barre d'outils, l'extension lit
> l'adresse et le titre de la page concernée — **uniquement celle sur laquelle
> vous agissez, uniquement à ce moment-là**. Elle n'a accès ni à votre
> historique, ni aux onglets que vous ne visez pas, et ne lit rien en
> arrière-plan.
>
> **Où vont ces données.** Nulle part. Les liens collectés restent sur votre
> appareil, dans le stockage local du navigateur. Il n'y a ni compte, ni serveur,
> ni mesure d'audience.
>
> **Le seul envoi réseau.** Si vous demandez le raccourcissement d'un lien,
> celui-ci est transmis au service que vous avez choisi (TinyURL, is.gd, v.gd ou
> spoo.me). Seule l'adresse est envoyée. Sans cette action, l'extension n'émet
> aucune requête.
>
> **Ce que vous pouvez en faire**
>
> - Collecter un lien au clic droit, depuis la fenêtre, ou en sélectionnant du texte.
> - Retrouver, rechercher et organiser vos liens.
> - Générer la planche d'étiquettes et l'imprimer en PDF.
> - Exporter en CSV, Markdown ou JSON.
> - Imprimer directement sur une imprimante Niimbot D110 ou M2 en Bluetooth.
> - Raccourcir un lien pour obtenir un QR plus court, donc plus rapide à scanner.
>
> **Vie privée.** Aucune donnée ne quitte votre appareil en dehors du
> raccourcissement que vous déclenchez vous-même. Le code est ouvert (licence
> MIT) et vérifiable : `https://github.com/Lupin/URLQRCodePrinter`
>
> **Ce qu'il vous faut.** Chrome sur ordinateur. L'impression Bluetooth directe
> exige une imprimante Niimbot compatible ; à défaut, l'export d'images et
> l'impression PDF fonctionnent avec n'importe quelle imprimante.

**EN**

> URLQRCodePrinter turns the addresses you come across into QR labels you can
> stick on your belongings, folders or cables.
>
> **What the extension reads.** When you click "Add this page", "Add this link",
> or the toolbar button, the extension reads the address and title of that page
> — **only the one you act on, and only at that moment**. It has no access to
> your history or to tabs you did not target, and reads nothing in the
> background.
>
> **Where that data goes.** Nowhere. Collected links stay on your device, in the
> browser's local storage. There is no account, no server, and no analytics.
>
> **The only network request.** If you ask for a link to be shortened, that link
> is sent to the service you chose (TinyURL, is.gd, v.gd or spoo.me). Only the
> address is sent. Without that action, the extension makes no request at all.
>
> **What you can do with it**
>
> - Collect a link by right-click, from the popup, or from a text selection.
> - Find, search and organise your links.
> - Generate the label sheet and print it to PDF.
> - Export to CSV, Markdown or JSON.
> - Print directly to a Niimbot D110 or M2 over Bluetooth.
> - Shorten a link so the QR code is smaller and scans faster.
>
> **Privacy.** No data leaves your device other than the shortening you trigger
> yourself. The code is open (MIT licence) and auditable.
>
> **Requirements.** Chrome on desktop. Direct Bluetooth printing needs a
> compatible Niimbot printer; otherwise image export and PDF printing work with
> any printer.

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
