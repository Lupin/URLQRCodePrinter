# Note d'étude — étiqueteuses Brother en Bluetooth : ce qu'un navigateur peut atteindre

Étude demandée avant d'ouvrir un onglet « Brother ». **Aucun onglet n'a été
ouvert** : cette note dit ce qui est atteignable, ce qui ne l'est pas, et à quel
prix. Périmètre arrêté : **les modèles Bluetooth uniquement**.

Date de relevé : **26 septembre 2026**. Le socle web (Web Bluetooth, Web Serial)
a été vérifié sur les textes de spécification ; les fiches constructeur ont été
ouvertes une à une (voir §0). Les faits déduits sont marqués **« déduit »**.

---

## La réponse, en trois lignes

1. **Web Bluetooth ne fait que du GATT.** Confirmé sur la spécification
   elle-même : le document ne contient **aucune** occurrence de « RFCOMM » ni de
   « serial port ». Une imprimante qui n'expose **que** le profil SPP n'expose
   aucun serveur GATT : elle est hors de portée, quelle que soit la bonne volonté
   du navigateur.
2. **Mais la phrase « aucune API web ne fait de port série Bluetooth » est
   fausse depuis Chrome 117.** La **Web Serial API** parle RFCOMM/SPP sur les
   appareils Bluetooth classiques **déjà appairés au niveau du système**. C'est
   une correction de la prémisse de départ, et elle change la conclusion : il
   existe un chemin navigateur vers les QL-820NWB, PT-P300BT, PT-P710BT et
   consorts — ce n'est simplement pas Web Bluetooth.
3. **Un seul modèle Brother est prouvé exploitable en Web Bluetooth** : le
   **PT-N25BT**, qui est BLE et expose un service GATT propriétaire
   rétro-ingénieré. Partout ailleurs, c'est du Bluetooth classique, ou du « GATT »
   déclaré sans qu'aucune source ne dise ce qu'il contient.

---

## 0. Sources et méthode

| Source | Nature | Poids |
|---|---|---|
| [Spécification Web Bluetooth](https://bluetooth.spec.whatwg.org/) (WHATWG, Community Group) | Texte normatif, relevé ici sur ses passages décisifs : abstract, introduction, et recherche exhaustive des occurrences | **Autorité** pour ce que l'API peut faire |
| [Serial over Bluetooth on the web](https://developer.chrome.com/blog/serial-over-bluetooth) (Chrome for Developers) | Annonce officielle de la fonctionnalité, Chrome 117 | **Autorité** pour la Web Serial sur RFCOMM |
| [MDN — Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) | Documentation de référence | Confirmation |
| [support.brother.com — fiches « Specifications »](https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lpql820nwbeuk) | Fiches produit officielles, **ouvertes une à une** | **Autorité** pour le profil radio par modèle |
| [download.brother.com](https://download.brother.com/welcome/docp100278/cv_ql800_eng_raster_101.pdf) — manuels développeur | Documents officiels de protocole | **Autorité** pour le langage d'impression |
| [johnboiles/ble-label-printers](https://github.com/johnboiles/ble-label-printers) | Projet de rétro-ingénierie, **non officiel**, source lue ici | Meilleure source disponible pour le seul cas BLE |

**Ce qui a été vérifié directement dans cette session** : la spécification Web
Bluetooth (abstract, énumération, occurrences de « RFCOMM »), l'article Chrome sur
la Web Serial, les fiches « Specifications » citées au §2, la fiche produit du
PT-N25BT, l'existence des dix manuels Brother cités au §3 (URL en HTTP 200,
en-tête `%PDF-`), et les UUID du service GATT du PT-N25BT dans le code source du
projet cité.

**Ce qui n'a pas été vérifié** : le contenu des manuels Brother (§3) — aucun
outil d'extraction PDF n'est installé sur cette machine, et les PDF sont
construits en flux compressés. Leur **existence et leur objet** sont constatés,
pas leur texte. Aucune imprimante Brother n'a été approchée : tout ce qui suit
sur le comportement radio réel vient de documents, jamais d'un relevé.

---

## 1. Le socle web : ce qui est atteignable, et par quelle API

### 1.1 Web Bluetooth : GATT seulement, mais pas « BLE seulement »

L'abstract de la spécification est sans ambiguïté :

> « This document describes an API to discover and communicate with devices over
> the Bluetooth 4 wireless standard using the **Generic Attribute Profile
> (GATT)**. »

Les occurrences sont plus parlantes que l'abstract : **0** occurrence de
`RFCOMM`, **0** de `serial port` dans tout le document. Le SPP n'y est pas interdit
— il n'y est pas.

**Nuance à ne pas perdre**, parce qu'elle change la formulation correcte : la
spécification autorise le GATT **sur BR/EDR** (« Despite being designed to support
BLE transport, the GATT protocol can also run over BR/EDR transport. The first
version of this specification allows web pages […] to connect to GATT Servers
over either a BR/EDR or LE connection. »). La bonne phrase n'est donc pas « Web
Bluetooth ne voit que le BLE » mais :

> **Web Bluetooth ouvre une connexion GATT. Un appareil qui n'expose pas de
> serveur GATT — c'est le cas d'une imprimante SPP seule — reste hors de portée,
> même en Bluetooth classique.**

La découverte d'appareil, elle, repose sur les services annoncés : un appareil
qui n'annonce aucun service GATT ne peut pas être proposé dans le sélecteur.
Aucune API ne permet de lister les appareils Bluetooth classiques voisins.

### 1.2 Web Serial : le SPP est atteignable, et c'est nouveau

L'article officiel de Chrome :

> « Starting in **Chrome 117** on desktop, web developers can now reliably
> communicate with **paired Bluetooth Classic devices through RFCOMM services**
> using the Web Serial API. »

Trois détails qui décident de la faisabilité :

- Chrome **énumère les appareils Bluetooth appairés** qui exposent le Serial Port
  Profile normalisé (`00001101-0000-1000-8000-00805f9b34fb`), et sait parler à un
  port série **même quand le système n'a pas créé de nœud de périphérique** ;
- `navigator.serial.requestPort({ allowedBluetoothServiceClassIds: [...] })`
  ouvre les services RFCOMM **non normalisés** — ceux dont l'UUID n'est pas dans
  la plage Bluetooth SIG. Tous les UUID de base SIG sont refusés **sauf** le SPP ;
- `port.getInfo().bluetoothServiceClassId` dit, après coup, par quel service on
  est passé.

**Ce que la Web Serial ne fait pas** : elle ne **appaire** pas. L'appairage est
fait par le système d'exploitation, avant. C'est une différence d'expérience
utilisateur complète par rapport aux Niimbot, où la boîte de dialogue du navigateur
suffit — et c'est précisément ce que la consigne appelait « aucune extension
Chrome ne peut l'appairer » : c'est vrai de l'appairage, faux de l'accès.

Deux conséquences pratiques, **déduites** de ces textes et à éprouver sur
matériel :

- la portée est **limitée au bureau** (Chrome 117 visait le bureau ; le suivi
  Android est une autre fonctionnalité, en développement) ;
- une machine où l'imprimante n'est pas appairée ne verra rien, et il faudra le
  dire dans l'interface plutôt que d'afficher un sélecteur vide.

### 1.3 Les deux autres voies, écartées

- **WebUSB** ne concerne pas le Bluetooth : c'est de l'USB. Elle ne sert ici que
  pour une imprimante **branchée en filaire**, ce qui sort du périmètre arrêté.
- **Web Bluetooth et Web Serial dans une extension MV3** ne sont **documentées
  nulle part** : la seule page officielle du sujet porte sur WebUSB
  ([WebUSB in Chrome extensions](https://developer.chrome.com/docs/extensions/how-to/web-platform/webusb)),
  et les pages équivalentes pour le Bluetooth et le Serial renvoient 404. Il y a
  donc là une inconnue de plateforme à lever **avant** d'écrire la moindre ligne
  — voir §5.

---

## 2. Le parc Brother Bluetooth, modèle par modèle

Les libellés entre guillemets sont ceux des fiches constructeur, relevés tels
quels — c'est le **fait**. Les deux dernières colonnes sont des **conclusions**
tirées de ces faits et du §1 : elles disent ce qu'un navigateur peut faire, pas ce
que le fabricant annonce. « — » signifie que la fiche ne le dit pas.

### 2.1 Bluetooth classique / SPP : hors de portée de Web Bluetooth

| Modèle | Ce que dit la fiche officielle | Web Bluetooth | Web Serial |
|---|---|---|---|
| **QL-820NWB / 820NWBc** | « Bluetooth Classic — Supported profiles: **SPP, OPP, BIP, HCRP** » ([fiche](https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lpql820nwbeuk)) | **non** | oui, si appairé |
| **QL-1110NWB** | « Bluetooth **Version 2.1 + EDR** — Supported profiles: SPP, OPP, BIP, HCRP » ([fiche](https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lpql1110nwbeuk)) | **non** | oui, si appairé |
| **TD-2120N** (interface Bluetooth en option) | « Bluetooth **Ver.2.0+EDR (Class 2)** — Bluetooth-compatible profiles: **SPP**, OPP, BIP » ([fiche](https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lptd2120neuk)) | **non** | oui, si appairé |
| **RJ-3150** | « Bluetooth **Ver. 2.1 +EDR (Classe 1)** » — aucun profil listé ([fiche](https://support.brother.com/g/b/spec.aspx?c=it&lang=it&prod=rj3150euk)) | **non** (aucun GATT annoncé) | oui, si appairé |
| **PT-P300BT**, **PT-P710BT**, **PT-P750W**, **PT-P910BT**, **PT-P950NW**, **PT-E550W**, **RJ-2030/2050/2150/3050/3230B/3250WB** | Bluetooth annoncé, **profil non listé** sur les fiches consultées | **non** (déduit : Classic) | à éprouver |
| **PT-P710BT** | Brochure officielle : « USB, **Bluetooth (MFi Certified)** » ([PDF](https://www.brother.com.my/-/media/ap2/malaysia/brochure/pt-p710bt-brochure.pdf?rev=ff702d6f51454c609ad5dd422d285dee)) | **non** | à éprouver |

Sur les PT-*, la déduction « classique, pas BLE » repose sur la certification
**MFi** : iAP2 est un protocole Apple qui passe par RFCOMM sur Bluetooth
classique. C'est une **déduction** — aucune fiche consultée ne l'écrit — mais elle
est cohérente avec la rétro-ingénierie publique du PT-P300BT, où le sniffer
Wireshark conclut que « all of the communication used bluetooth's serial port
profile (SPP) » et expose l'imprimante en `/dev/rfcomm0`.

**Conséquence directe :** pour cette famille — celle que possèdent la plupart des
gens, et la seule dont les consommables sont largement distribués —, la voie
navigateur existe, mais ce n'est **pas** Web Bluetooth.

### 2.2 « GATT » déclaré, service non documenté : à ne pas promettre

| Modèle | Ce que dit la fiche officielle |
|---|---|
| **TD-4550DNWB / 4550DNWB(FC)** | « Bluetooth **Ver.4.2 / BLE MFi** — SPP, OPP, HCRP (**Bluetooth Classic**), **GATT (Bluetooth Low Energy)** » ([fiche](https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lptd4550dnwbeuk)) |
| **TD-4650TNWB / TD-4750TNWB** | « Bluetooth **Dual-Mode** — **SPP (Bluetooth Classic)**, **GATT (Bluetooth Low Energy)** » ([fiche](https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lptd4650tnwbeuk)) |
| TD-2125NWB / 2135NWB, RJ-2055WB / 3055WB, RJ-4230B / 4250WB, RJ-3230B / 3250WB | Dual-mode annoncé, profils variables selon la fiche |

Ces modèles déclarent du GATT, ce qui les rend **théoriquement** éligibles à Web
Bluetooth. Mais **aucune source ne dit ce que ce GATT contient** — ni UUID de
service, ni caractéristique d'écriture, ni service d'impression. Brother ne
documente rien de tel, et les manuels de protocole décrivent du **raster sur flux
série**, pas des écritures GATT.

**Déduction** : ce GATT sert très probablement à MFi/iAP2 — l'appairage et
l'identification des accessoires Apple — et non à recevoir des travaux
d'impression. Brother publie d'ailleurs une
[« MFi Compatible List »](https://download.brother.com/welcome/docp100422/td4550dnwb_mfi_compatible_list.pdf)
pour le TD-4550DNWB, et les fiches écrivent « BLE **MFi** ». C'est une déduction
appuyée, pas un fait établi : elle se tranche avec une imprimante et un relevé
`nRF Connect` (§5).

Pour les autres modèles dual-mode, il faut ajouter un piège de configuration : le
TD-4550DNWB a un réglage **« Bluetooth Mode »** qui vaut *Classic* **ou** *Low
Energy Only*. En mode LE seul, le SPP disparaît — donc **Web Serial aussi**.

### 2.3 Le seul cas BLE prouvé : Brother PT-N25BT

La fiche produit de Brother elle-même décrit le PT-N25BT comme un « personal
connected label maker […] with its QWERTY keyboard, **Bluetooth LE** »
([brother.ca](https://www.brother.ca/en/p/PTN25BT), relevé le 26 septembre 2026) :
c'est du BLE, sans SPP. Et un projet de rétro-ingénierie
([johnboiles/ble-label-printers](https://github.com/johnboiles/ble-label-printers),
**non officiel**) obtient des impressions réelles avec ce service :

> La fiche européenne du même modèle énonce la même chose — « Schnittstellen:
> Bluetooth (energiesparend) » — mais `brother.eu` a répondu **403** à cette
> machine : la citation n'a pas pu être relue, et c'est la fiche canadienne,
> ouverte, qui porte l'affirmation ci-dessus.

| Rôle | UUID |
|---|---|
| Service | `A76EB9E0-F3AC-4990-84CF-3A94D2426B2B` |
| Lecture | `A76EB9E1-F3AC-4990-84CF-3A94D2426B2B` |
| Écriture (avec réponse) | `A76EB9E2-F3AC-4990-84CF-3A94D2426B2B` |
| Écriture sans réponse + notification | `A76EB9E3-F3AC-4990-84CF-3A94D2426B2B` |
| Notification | `A76EB9E4-F3AC-4990-84CF-3A94D2426B2B` |

C'est un service **propriétaire de 128 bits** — pas le Nordic UART Service. Le
projet est un outil Swift/CoreBluetooth pour macOS : les UUID sont donc
vérifiés **côté CoreBluetooth**, pas côté navigateur. Le fait qu'un service GATT
existe et serve à imprimer est établi ; le fait qu'un navigateur puisse s'y
connecter dans les mêmes conditions est **une déduction raisonnable, non
mesurée**.

**Ce que ce cas ne couvre pas** : c'est une étiqueteuse personnelle vendue
principalement en Amérique du Nord, à cassette, sans rapport avec les
consommables des QL. Un onglet qui ne fonctionnerait que sur elle serait un onglet
pour un seul modèle, sur des UUID que le fabricant n'a jamais publiés.

### 2.4 Sans Bluetooth du tout

Vérifié sur les fiches : **QL-800** et **QL-810W** ne listent aucun Bluetooth
(leur fiche n'a pas de rubrique Bluetooth), **TD-4420DN** non plus. Un modèle sans
Bluetooth n'a ni Web Bluetooth ni Web Serial : il ne reste que l'USB (WebUSB) ou
le réseau — hors périmètre.

---

## 3. Le protocole d'impression

Toutes les imprimantes de cette étude se pilotent par un **langage de commandes de
haut niveau**, documenté par Brother dans des « Software Developer's Manual ».
Les documents existent et sont publics — URL vérifiées (HTTP 200, PDF) — mais
**leur contenu n'a pas été ouvert ici** :

| Document | Familles | URL |
|---|---|---|
| Raster Command Reference | QL-800 / 810W / 820NWB | [cv_ql800_eng_raster_101.pdf](https://download.brother.com/welcome/docp100278/cv_ql800_eng_raster_101.pdf) |
| ESC/P Command Reference | QL-810W / 820NWB | [cv_ql820_eng_escp_101.pdf](https://download.brother.com/welcome/docp100306/cv_ql820_eng_escp_101.pdf) |
| Raster Command Reference | PT-P900 / P900W / P950NW / P910BT | [cv_ptp900_eng_raster_102.pdf](https://download.brother.com/welcome/docp100407/cv_ptp900_eng_raster_102.pdf) |
| Raster Command Reference | RJ-2xxx / 3xxx / 4xxx | [cv_rj200030004000a_eng_raster_106.pdf](https://download.brother.com/welcome/docp100056/cv_rj200030004000a_eng_raster_106.pdf) |
| ESC/P Command Reference | RJ-2xxx / 3xxx et TD (2xxx, 4xxx, 23xx) | [cv_rj_td_eng_escp_305.pdf](https://download.brother.com/welcome/docp100392/cv_rj_td_eng_escp_305.pdf) |
| P-touch Template Command Reference | mêmes familles | [cv_rj_td_eng_ptemp_308.pdf](https://download.brother.com/welcome/docp100393/cv_rj_td_eng_ptemp_308.pdf) |
| Raster Command Reference | TD-4xxx | [cv_td4000d_eng_raster_103.pdf](https://download.brother.com/welcome/docp100429/cv_td4000d_eng_raster_103.pdf) |
| EPL Emulation Guide | TD-4T | [cv_td4t_eng_epl_700.pdf](https://download.brother.com/welcome/docp100479/cv_td4t_eng_epl_700.pdf) |
| ZPL II Emulation Guide (japonais) | TD-4T | [cv_td4t_jpn_zpl_800.pdf](https://download.brother.com/welcome/docp100478/cv_td4t_jpn_zpl_800.pdf) |
| User's Guide (réglage « Bluetooth Mode ») | TD-4550DNWB | [td-4550dnwb_use_ug.pdf](https://download.brother.com/welcome/docp100439/td-4550dnwb_use_ug.pdf) |

Ce que cette liste établit, et qui suffit à décider :

- **il y a un protocole à implémenter**, et il est documenté — c'est la bonne
  nouvelle, et le contraire d'une boîte noire ;
- ce protocole est conçu pour un **flux** : les ordinogrammes « Buffered printing
  […] for USB/Bluetooth connection » des manuels raster supposent un canal
  série. Le P-touch Template demande même d'attendre 500 ms après l'ouverture du
  port et de ne pas le refermer avant la fin de l'impression — des contraintes
  qui sentent le port SPP, pas la caractéristique GATT ;
- le jeu de manuels publié pour ces familles — raster, ESC/P, P-touch Template,
  EPL, ZPL II — **ne comprend aucun manuel ESC/POS**. Rien du code d'impression
  existant n'est donc réutilisable tel quel, au-delà de la composition en
  bitmap.

---

## 4. Ce qu'un onglet Brother coûterait, et pourquoi il n'est pas ouvert

La consigne de vérification est explicite : un onglet qui ne peut pas imprimer est
exactement l'écart entre la fiche publiée et le comportement réel que la posture
« Chrome Web Store » interdit. Aujourd'hui :

- en **Web Bluetooth**, il existe **un** modèle démontrable (PT-N25BT), sur des
  UUID non officiels — et un onglet qui n'imprime rien sur un QL-820NWB serait un
  onglet cassé pour presque tout le monde ;
- en **Web Serial**, le chemin est réel pour toute la famille classique, mais il
  change trois choses de fond : une **nouvelle permission** dans le manifeste, un
  **appairage système préalable** (que la boîte de dialogue du navigateur ne fait
  pas), et une **seconde implémentation de transport** à côté de celle des
  Niimbot. Ce n'est plus un onglet, c'est une seconde moitié de produit.

Si le chemin est ouvert un jour, il devra reprendre **toutes** les conventions de
l'onglet Niimbot, sans exception :

- un aperçu qui prend la place offerte, une échelle **annoncée** et bornée à
  **quatre fois la taille réelle**, et la case **« Aperçu à la taille réelle »**
  sur le **même état partagé** ;
- une **légende en une information par ligne**, **hors** du cadre d'aperçu ;
- des **cases de contenu unifiées** — les mêmes mots que partout ailleurs ;
- des tests unitaires, un relevé Chrome, et **l'appairage éprouvé sur une vraie
  imprimante** avant d'annoncer quoi que ce soit.

---

## 5. Ce qui reste incertain, et comment le trancher

1. **Chrome fait-il réellement de la découverte BR/EDR ?** La spécification
   l'autorise ; l'état d'implémentation publié par le groupe de travail ne liste
   que des fonctions « GATT Communication API », sans mention BR/EDR. **Ce point
   peut tout changer** : s'il s'avérait que Chrome connecte un serveur GATT sur
   BR/EDR, un appareil dual-mode deviendrait atteignable. *Pour trancher* : un
   appareil appairé et `requestDevice({ acceptAllDevices: true })`, ou lecture de
   `content/browser/bluetooth/`. **C'est l'expérience à faire en premier.**

2. **Que contient le GATT des TD-4550DNWB, TD-4650TNWB, RJ-3230B, RJ-4250WB ?**
   Aucune source ne le dit. *Pour trancher* : une imprimante, `nRF Connect` en
   mode « Low Energy Only », comparaison avec le service du PT-N25BT, puis un
   travail raster minimal.

3. **Le GATT des TD/RJ sert-il à MFi/iAP2 plutôt qu'à l'impression ?** Déduction
   appuyée, non confirmée. *Pour trancher* : le relevé ci-dessus, et une question
   au [Brother Developer Center](https://www.brother.com/product/dev/).

4. **Le PT-N25BT tient-il vraiment en Web Bluetooth ?** Le service existe et
   imprime côté CoreBluetooth. Reste à vérifier que les écritures fragmentées, la
   négociation de MTU et les notifications suffisent pour un travail complet — un
   flux SPP et un enchaînement de caractéristiques GATT ne se comportent pas
   pareil. *Pour trancher* : une imprimante et une page d'essai.

5. **La Web Serial fonctionne-t-elle dans une extension MV3 ?** Non documenté :
   les pages officielles équivalentes à celle de WebUSB renvoient 404. *Pour
   trancher* : `navigator.serial.requestPort()` appelé depuis la page de
   l'extension, depuis le service worker et depuis un document hors écran, en
   calquant le motif documenté pour WebUSB.

6. **Quel est le profil radio réel des PT-*BT récents** (PT-P710BT, PT-P910BT,
   PT-P920BT, PT-E560BT…) ? Les brochures disent « Bluetooth » ou « MFi » sans
   nommer le profil, et « Bluetooth 5.0 » désigne souvent du **classique** avec un
   numéro de version, pas du BLE. *Pour trancher* : une fiche produit détaillée
   par modèle, ou un relevé `nRF Connect` — un appareil BLE s'y annonce, un
   appareil SPP ne s'y voit pas du tout.

7. **Le mode « Low Energy Only » du TD-4550DNWB supprime-t-il aussi le port série
   système ?** Si oui, il casse Web Serial en même temps que Classic. *Pour
   trancher* : basculer le réglage et regarder si le port Bluetooth subsiste.

8. **Personne, à notre connaissance, n'a jamais imprimé sur une Brother depuis un
   navigateur en Web Bluetooth.** Recherche infructueuse au 26 septembre 2026 :
   l'écosystème Web Bluetooth d'étiqueteuses existe (Niimbot, Phomemo, Marklife,
   ESC/POS) mais aucun projet « Brother + Web Bluetooth » n'a été trouvé. Les
   projets Brother connus restent soit en WebUSB, soit côté serveur
   (`brother_ql`, `brother_ql_web`), soit en série système `/dev/rfcomm0`. Une
   absence de résultat n'est pas une preuve d'impossibilité — c'est un signal, et
   il va dans le même sens que tout le reste.

---

## Récapitulatif des URLs

**Socle web**
- https://bluetooth.spec.whatwg.org/ — spécification Web Bluetooth (abstract, GATT sur BR/EDR, absence de RFCOMM)
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- https://developer.chrome.com/blog/serial-over-bluetooth — Web Serial sur RFCOMM/SPP, Chrome 117
- https://developer.chrome.com/docs/extensions/how-to/web-platform/webusb — la seule page « extension MV3 » du sujet
- https://chromestatus.com/feature/5264933985976320 — Web Bluetooth

**Fiches constructeur Brother**
- QL-820NWB : https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lpql820nwbeuk
- QL-1110NWB : https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lpql1110nwbeuk
- TD-2120N : https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lptd2120neuk
- TD-4550DNWB : https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lptd4550dnwbeuk
- TD-4650TNWB : https://support.brother.com/g/b/spec.aspx?c=eu_ot+&lang=en+&prod=lptd4650tnwbeuk
- RJ-3150 : https://support.brother.com/g/b/spec.aspx?c=it&lang=it&prod=rj3150euk
- PT-N25BT (« Bluetooth LE ») : https://www.brother.ca/en/p/PTN25BT
- Brochure PT-P710BT : https://www.brother.com.my/-/media/ap2/malaysia/brochure/pt-p710bt-brochure.pdf

**Manuels de protocole** — voir le tableau du §3.

**Rétro-ingénierie**
- https://github.com/johnboiles/ble-label-printers — PT-N25BT, service GATT propriétaire
