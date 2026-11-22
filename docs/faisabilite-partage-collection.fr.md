# Note d'étude — partager une collection, et en déplacer une

Étude demandée avant d'ouvrir le chantier. **Aucun fichier de code n'a été
modifié** : cette note dit ce qui est déjà là, ce qui manque, ce que coûterait
chaque voie, et ce qu'il faut trancher avant d'écrire la première ligne.

Date de relevé : **22 novembre 2026**, sur l'état du dépôt au commit `666e758`
(version 0.3.2). Périmètre : l'extension Chrome / Brave / Edge, l'application
Safari (macOS et iOS) et l'application web autonome — les trois partagent le
même cœur (`src/core/`).

---

## La réponse en trois lignes

1. **Partager par fichier est le prolongement de ce qui existe déjà.** Le bouton
   « Archive » exporte tout le modèle des liens ; l'import sait déjà le relire et
   propose trois rangements. Ce qui manque n'est pas la fonction, c'est
   l'**identité de la collection** (identifiant, premier numéro, date), une
   action nommée « Partager », et des garanties sur les identifiants et les
   rangs. Un MVP solide tient en **5,5 à 9 jours**.
2. **Partager par réseau est exclu** par quatre promesses verrouillées (aucun
   compte, aucun serveur, un seul envoi réseau, traitement entièrement local).
   L'alternative sans serveur — un lien dont la charge voyage dans le fragment
   d'URL, vers l'application hébergée sous `/app/` — est possible pour de
   petites collections, mais c'est un second chantier, et il reste à vérifier
   par cible.
3. **« Déplacer » a trois sens, et un seul est un petit chantier.** Déplacer des
   *liens* d'une collection à l'autre existe déjà (`docs/guide.fr.md:353-376`) ;
   réordonner les *collections* n'existe pas et coûte environ une journée ;
   transférer une collection d'une machine à l'autre, c'est **exporter puis
   supprimer** — deux gestes, sans accusé de réception possible, qu'il ne faut
   pas vendre comme un déplacement atomique.

---

## 0. Sources et méthode

| Source | Ce qu'on en tire | Poids |
|---|---|---|
| `src/core/collections.js`, `store.js`, `link.js`, `import.js`, `exporters.js`, `download.js`, `zip.js` | Le modèle, les formats, les chemins d'écriture | **Autorité** : c'est le code livré |
| `src/web/app.js`, `src/web/index.html`, `src/web/element-ids.js`, `src/extension-src/popup.*`, `background.js` | Les surfaces et leurs contraintes physiques | **Autorité** pour l'ergonomie réelle |
| `README.fr.md`, `docs/guide.fr.md`, `PRIVACY.md`, `store/listing.json`, `docs/chrome-web-store.md`, `docs/preparation-app-store.fr.md` | Les promesses publiées, donc les limites de conception | **Autorité** pour ce qui est promis |
| `docs/note-capacites-capture-url-safari-brave.md`, `docs/safari-extension-verification.md` | Ce qui est vérifié — et ce qui ne l'est pas — sur Safari et Brave | Autorité interne, avec les réserves qu'elle porte |
| `test/*.test.js` (1 183 tests, dont 1 079 en JavaScript) | Ce qui est verrouillé, donc ce qu'une évolution doit tenir | **Autorité** sur les invariants |

**Ce qui n'a pas été vérifié dans cette session** : le comportement réel de
`<a download>` et de `navigator.clipboard` dans une page d'extension Safari
(noté « non vérifié » dans `docs/note-capacites-capture-url-safari-brave.md`,
§5.7), le partage de fichiers par `navigator.share`, la disponibilité de
`CompressionStream` sur Safari 16.4, et le comportement de téléchargement sur
iOS. Ces points sont marqués « à vérifier » partout où ils décident d'une voie.

---

## 1. État des lieux

### 1.1 Le modèle, en une page

- **Une collection** est un enregistrement `{ id, name, note, startIndex,
  createdAt }` (`src/core/collections.js:271-284`). Toutes les collections
  vivent dans un seul document, sous la clé
  `url-qr-code-printer/collections` (`:110`), et la collection courante sous
  `url-qr-code-printer/active-collection` (`:113`). Le document est **assaini**
  à chaque lecture (`:377-409`) : une entrée illisible est écartée, les champs
  inconnus sont **perdus**.
- **Un lien** est un enregistrement complet (`src/core/link.js:16-35`) : `id`,
  `url`, `title`, `note`, `tags`, `createdAt`, `updatedAt`, `source` (dont la
  valeur `share`, déjà reconnue mais jamais produite, `:43`), `favicon`,
  `order` (rang manuel facultatif), `useShort`, `shortUrl`, `shortProvider`,
  `shortenedAt`, `collectionId` (facultatif).
- **Le stockage** : dans l'extension, `chrome.storage.local` sous la clé
  `links` (`src/core/store.js:308-369`) ; ailleurs, IndexedDB (`:141-242`) ; à
  défaut, la mémoire. Les liens de la collection privée vivent dans
  `chrome.storage.session`, et le magasin composite route les écritures selon la
  collection (`:485-538`).
- **La visibilité** : la collection privée est synthétisée, jamais écrite ; elle
  n'apparaît qu'en contexte privé et en dernier (`collections.js:443-447`). Elle
  n'est ni renommable ni supprimable (`:639-648`, `:761-799`).
- **L'ordre des collections est figé** : la collection par défaut en tête, puis
  la date de création — le commentaire dit explicitement « pas de rang manuel à
  entretenir » (`collections.js:335-337`, tri `:343-349`).

### 1.2 Ce que le produit sait déjà faire

| Geste | Existe | Où |
|---|---|---|
| Exporter la collection en CSV, Markdown, JSON | Oui | `app.js:2328-2352` ; fenêtre : `popup.js:629-644` (CSV/MD seulement) |
| Exporter des dossiers prêts à imprimer (images, tableau, planche, Niimbot), avec manifeste | Oui | `label-export.js:596-660`, `sheet-archive.js`, `table-export.js` |
| Importer une archive JSON, un ZIP, un `export.json` ou un CSV | Oui | `import.js:308-345`, `app.js:2379-2411` |
| Choisir le rangement de l'import : fusionner / remplacer / nouvelle collection | Oui | `app.js:2425-2468`, `:2514-2568` |
| Déplacer des liens cochés vers une autre collection | Oui | `app.js:1472-1524` ; `guide.fr.md:353-376` |
| Renommer, noter, numéroter, supprimer une collection | Oui | `app.js:2020-2109` ; `collections.js:697-801` |
| **Partager une collection** (action nommée, fichier ou lien dédié) | **Non** | — |
| **Réordonner les collections** | **Non** | ordre dérivé, `collections.js:343-349` |
| **Transférer une collection** (la déplacer vers une autre machine) | **Non** | deux gestes manuels possibles : exporter, puis supprimer |
| Synchronisation entre appareils | **Non, et jamais** | `README.fr.md:188-189` ; `storage.sync` n'est pas écrit |

### 1.3 Les briques déjà là, et ce qui manque pour « partager »

Le bouton « Archive » écrit déjà (`exporters.js:332-351`) :

```json
{
  "format": "url-qr-code-printer/links",
  "version": 1,
  "exportedAt": "…",
  "app": "url-qr-code-printer",
  "collection": { "name": "Veille", "note": "…" },
  "count": 42,
  "links": [ { "id": "…", "url": "…", "title": "…", "tags": [], "order": 3, … } ]
}
```

C'est **presque** un format de partage : l'archive porte tous les champs des
liens, y compris l'identifiant, le rang, la date de collecte et le raccourci, et
l'import la relit et propose déjà une « nouvelle collection ». Trois choses
manquent, et une quatrième est un défaut du socle actuel :

1. **L'identité de la collection** : `collection.id`, `startIndex` et
   `createdAt` ne sont pas exportés. La collection recréée ne peut donc pas être
   reconnue comme « la même » ; son premier numéro retombe à 1 ; sa date de
   création est celle de l'import.
2. **Une action nommée et un fichier nommé** : rien dans l'interface ne dit
   « partager » ; le fichier s'appelle `liens…json` et non
   `collection-nom-date.json`.
3. **Une politique d'identifiants et de rangs** : voir §1.4 — ce n'est pas un
   détail cosmétique, l'import actuel peut écraser un lien ou mélanger deux
   rangements.
4. **La collection privée** : l'export part de la collection affichée
   (`app.js:2328-2335`), et **rien n'interdit d'exporter la collection privée**,
   alors que le projet promet qu'aucun chemin de code n'écrit une URL privée sur
   le disque (`README.fr.md:232-240`). Un partage doit fermer cette porte, et
   l'occasion est bonne de la fermer aussi pour l'export existant.

### 1.4 Quatre défauts du socle d'import à corriger avant de partager

Ces défauts existent déjà pour l'import d'une archive ; un partage les rend
visibles à grande échelle. Ils sont cités avec leur preuve, parce que chacun
change le plan de travail.

| Défaut | Preuve | Effet sur un partage |
|---|---|---|
| **Les identifiants sont conservés à l'import** | `import.js:357-369` → `createLink` garde `input.id` (`link.js:395-433`) | Importer deux fois la même collection dans deux collections distinctes : en IndexedDB, le second `put` **écrase** le premier (même clé) et le lien disparaît de la première collection (`store.js:207-219`) ; en `chrome.storage`, le tableau peut contenir **deux fois le même id** (`:333-345`) et les lectures deviennent ambiguës |
| **Les rangs manuels sont conservés** | `createLink` garde `order` (`link.js:414-416`) | En mode « fusionner », les rangs du fichier s'intercalent dans un rangement existant, avec des collisions de rang (`sortByManualOrder`, `:450-460`) |
| **L'import écrit lien par lien et avale les erreurs** | boucle `app.js:2558-2568`, `.catch(() => {})` aux câblages `:6882-6884` | Une grosse collection peut s'importer **à moitié**, sans message ; en `chrome.storage`, chaque `add` réécrit tout le tableau (`store.js:333-345`), d'où un coût quadratique |
| **La collection privée est exportable** | `app.js:2328-2335` (aucun garde), alors que `README.fr.md:232-240` promet l'inverse | Un partage depuis une fenêtre privée écrirait des URL de session sur le disque |

---

## 2. Les canaux de partage possibles

Le destinataire peut être **soi-même sur une autre machine**, ou **un tiers**.
Ce n'est pas la même contrainte : le premier a l'application, le second peut ne
pas l'avoir ; et sur iOS, le fichier n'arrive pas forcément là où on l'attend.

| Canal | Ce que reçoit le destinataire | Prérequis | Coût | Verdict |
|---|---|---|---|---|
| **A1. Fichier de collection `.json`** | Une collection complète, réimportable | Avoir l'application (ou une version ≥ 0.3) | Faible : le format et la réception existent à 80 % | **Voie principale** |
| **A2. Dossier imprimable `.zip`** | Des étiquettes prêtes à imprimer, sans l'application | Aucun (un navigateur ou une imprimante) | Nul : les exports existent | **Voie du tiers sans l'application** |
| **A3. Lien vers l'application hébergée** (`/app/#…`) | La collection, ouverte dans le navigateur, sans installation | Application déployée (documentée, `docs/site-public.fr.md`) ; `CompressionStream` ; URL assez courte | Moyen à élevé : encodage, limite de taille, écran de confirmation | **Option pour petites collections**, à vérifier |
| **A4. Feuille de partage du système** (`navigator.share`) | Le fichier ou le lien, remis à l'application choisie | API disponible ; **le type MIME du fichier doit être accepté** | Faible une fois A1 fait | Surcouche, pas une voie |
| **A5. Presse-papiers** | Un texte JSON à coller ailleurs | `navigator.clipboard` ; geste utilisateur | Faible : `copyText` existe déjà et n'est utilisé nulle part (`download.js:92-121`) | **Repli** pour petites collections |
| **A6. QR Code multi-parties** | Rien d'exploitable | — | Élevé | **À écarter** : densité, scans multiples, aucun gain |
| **A7. Serveur, compte, synchronisation** | Une synchronisation réelle | Nouveau service, nouveau consentement, nouvelle fiche | Très élevé | **À écarter** : casse L1-L4 (§5) |
| **A8. WebRTC pair à pair** | Un transfert direct | Signalisation (donc un serveur, même minimal) | Très élevé | **À écarter** : pas de serveur, et complexité sans bénéfice |
| **A9. Extension de partage native iOS/macOS** | Une entrée dans la feuille de partage du système | Cible Xcode, revue App Store, application iOS encore « à faire » (`README.fr.md:52`) | Élevé | **Hors MVP** |

### 2.1 Pourquoi le fichier, et pas le réseau

Le produit a un pont entre surfaces qui existe et qui est documenté : l'export
(`README.fr.md:242-245`, `src/site/index.html:271-274`). Un partage par fichier
prolonge ce pont ; un partage par réseau le remplace et contredit la phrase qui
fonde la fiche du magasin : le traitement est « stored and processed entirely on
the user's device » (`store/listing.json`, `singlePurpose`). Ce n'est pas une
préférence esthétique : la mention dans l'interface, la déclaration d'usage des
données et le manifeste de confidentialité Apple en dépendent (§5).

### 2.2 Le cas du tiers qui n'a pas l'application

C'est le cas que l'on oublie. Pour lui, un `.json` ne sert à rien. En revanche,
le produit sait déjà produire un dossier d'images avec planche HTML et CSV
(`label-export.js`), un tableau imprimable, un classeur `.xlsx` et une planche
d'étiquettes. Un menu « Partager » peut donc proposer deux sorties :

- **« Pour rouvrir dans URLQRCodePrinter »** → A1, fichier de collection ;
- **« Pour imprimer sans l'application »** → A2, l'un des dossiers existants
  (ou un PDF, mais il n'y a pas de génération de PDF dans le projet : la page
  HTML et l'impression du navigateur en tiennent lieu).

C'est la réponse honnête à « partager vers un tiers » : un fichier autoportant
plutôt qu'une promesse de synchronisation.

### 2.3 Le lien vers l'application hébergée — la seule voie « zéro installation »

L'application web est publiée sous `/app/` (`docs/site-public.fr.md`), et ses
imports sont relatifs : elle fonctionne sous n'importe quel sous-chemin. On peut
donc imaginer un lien de la forme :

```
https://<site>/app/#collection=<charge encodée>
```

La charge (le JSON de la collection, compressé puis encodé en base64url) voyage
dans le **fragment** : par construction, un fragment n'est pas envoyé au serveur
qui sert la page. Le destinataire ouvre le lien, l'application détecte la charge,
annonce ce qu'elle contient et **demande confirmation** avant d'écrire. C'est
sans serveur, sans compte, et sans nouvelle permission.

Trois limites, à mesurer avant de promettre :

- **La longueur de l'URL.** Une URL de quelques kilo-octets passe dans un
  navigateur, mais se fait tronquer par des messageries ; il faut fixer un
  plafond (par exemple 8 Ko d'URL, soit quelques dizaines de liens) et basculer
  sur le fichier au-delà.
- **La compression.** `CompressionStream` n'est pas vérifiée ici sur Safari 16.4 ;
  à défaut, une variante non compressée réduit encore le plafond.
- **Le déploiement.** Le site est construit et documenté, mais son état en ligne
  n'a pas été vérifié dans cette session.

À noter : l'application hébergée stocke dans IndexedDB, l'extension dans
`chrome.storage.local` ; les deux ne partagent rien (`docs/site-public.fr.md`,
« Ce que le site ne résout pas »). Un lien reçu dans l'application hébergée ne
rejoint donc pas l'extension toute seule — le destinataire devra réexporter ou
réimporter. C'est acceptable pour un tiers, pas pour soi-même sur une deuxième
machine, où le fichier est plus direct.

### 2.4 La feuille de partage du système : utile, mais pas pour un fichier maison

`navigator.share` existe sur une partie des cibles seulement, et MDN le classe
« Limited availability ». Surtout, MDN liste les types de fichiers
« habituellement partageables » et **ni `.json` ni `.zip` n'y figurent** : un
partage de fichier de collection peut être refusé (`TypeError`) selon la
plateforme. Conclusion : le bouton « Partager » peut, **si l'API est là et si
`navigator.canShare` accepte**, confier le fichier au système ; dans tous les
autres cas, il télécharge le fichier. On ne promet jamais la feuille de partage.

---

## 3. Le format de partage proposé

### 3.1 Principe

Un **seul fichier JSON**, autoportant, versionné, lisible à la main, et
**rétrocompatible avec l'import existant**. La clé `links` et la clé
`collection` restent en place : une version antérieure de l'application (≥ 0.3)
sait déjà lire le fichier et propose « Nouvelle collection » — elle ignorera
seulement les champs ajoutés. C'est ce qui rend le partage utilisable avant même
que tout le monde ait mis à jour.

Nom de fichier proposé : `collection-<nom>-<AAAAMMJJ-HHMM>.json`, produit par
`exportFilename` (`exporters.js:372-380`), donc sans caractère interdit et avec
le nom de la collection conservé.

### 3.2 Contenu

```json
{
  "format": "url-qr-code-printer/collection",
  "version": 2,
  "exportedAt": "2026-11-22T18:00:00.000Z",
  "app": { "name": "url-qr-code-printer", "version": "0.4.0" },
  "collection": {
    "id": "…",                    // facultatif : identité de la collection d'origine
    "name": "Veille",
    "note": "…",
    "startIndex": 101,
    "createdAt": 1760000000000
  },
  "count": 42,
  "links": [
    {
      "id": "…", "url": "https://…", "title": "…", "note": "",
      "tags": ["…"], "createdAt": 1760000000000,
      "order": 0, "useShort": false, "shortUrl": "", "shortProvider": "",
      "shortenedAt": 0
    }
  ]
}
```

Règles :

- **On garde** `createdAt`, `order`, `useShort`, `shortUrl`, `shortProvider`,
  `shortenedAt`, `tags`, `note`, `title`. C'est ce qui fait qu'une collection
  partagée se réimporte « comme elle était ».
- **On retire** `collectionId` (la destination le pose) et `updatedAt` (l'import
  le réécrit de toute façon, `import.js:357-369` + `createLink`) ; `favicon`, qui
  n'est qu'une adresse, peut être conservé ou retiré — il est inoffensif.
- **On ajoute** `collection.id`, `collection.startIndex`, `collection.createdAt`.
  L'identifiant n'est **jamais** une autorité : l'import le traite comme une
  indication (§3.4).
- **Pas de charge binaire** dans le JSON : les QR Codes ne sont pas stockés par
  le produit (ils sont recalculés à l'impression, `README.fr.md:191-196`). Un
  partage avec images est le dossier imprimable (A2), pas un second format.

### 3.3 Compatibilité et version

Le numéro de version du fichier monte à 2. L'import actuel ne teste pas la
version : il reconnaît un objet qui porte `links` (`import.js:89-131`). Un
fichier v2 sera donc lu par les anciennes versions **comme un fichier v1**, sans
les métadonnées de collection. C'est intentionnel : le partage doit fonctionner
entre une machine à jour et une machine qui ne l'est pas. La version servira plus
tard à refuser proprement une évolution incompatible.

### 3.4 À la réception : ce que l'import doit faire

Le mode existant « Nouvelle collection » (`app.js:2514-2568`) est le bon point de
départ, mais il faut le rendre **fidèle** :

1. **Créer la collection** avec le nom du fichier, suffixé s'il est déjà pris
   (`freeCollectionName`, `collections.js:485-500`), la note, le `startIndex` et
   la `createdAt` du fichier (si la date est plausible).
2. **Identifiants des liens** : conserver l'identifiant du fichier **s'il est
   libre** ; sinon en générer un nouveau. Sans cette règle, un second import
   écrase un enregistrement existant (IndexedDB) ou crée des doublons d'id
   (`store.js:207-219`, `:333-345`).
3. **Rangs** : en mode fidèle, les conserver ; en mode « fusionner » ou
   « remplacer », les retirer, comme le fait déjà le déplacement de liens
   (`app.js:1492` : « le rang ne suit pas »). C'est la même règle, et elle évite
   les collisions de rang.
4. **Doublons d'URL** : un doublon reste ignoré et compté, comme aujourd'hui.
5. **Écriture en une seule passe** : construire la liste validée, puis un
   `putMany` (une écriture) plutôt qu'une boucle de `add` ; en cas d'échec,
   supprimer la collection créée pour ne pas laisser une collection à moitié
   remplie. Le message distingue « importés », « déjà présents », « illisibles »
   (`importReport`, `app.js:2579-2587`).
6. **La collection privée n'est jamais une source ni une destination de
   partage** ; si elle est affichée, l'action est désactivée et l'infobulle dit
   pourquoi.

### 3.5 Limites et sécurité

Un fichier partagé est **une entrée non fiable**. Ce qui protège déjà :
`normalizeUrl` refuse tout schéma autre que http(s) et exige un hôte valide
(`link.js:251-292`) ; les titres, notes et noms sont bornés à l'entrée
(`link.js:400-403`, `collections.js:238-240`, `:280`) ; `readStoredZip` ne lit
que des archives non compressées et vérifie les bornes (`zip.js:142-182`) ; le
rendu passe par `textContent` et des `href` validés. Ce qui manque : des
**plafonds** explicites (taille de fichier, nombre de liens) et un message clair
quand ils sont dépassés. Proposition : 10 Mo de fichier, 20 000 liens, refus
explicite au-delà — le stockage local est lui-même plafonné à 10 Mo
(`README.fr.md:191-196`), donc un fichier plus gros ne pourrait de toute façon
pas être importé.

La somme de contrôle n'est pas nécessaire (le fichier n'est pas un format
d'archivage à garantie d'intégrité) ; `crc32` existe déjà (`png.js`) si l'on veut
plus tard signaler une corruption, mais cela n'apporte rien à la sécurité.

---

## 4. « Déplacer une collection » : quatre lectures, dont une existe déjà

La demande ne dit pas laquelle. Trois lectures sont possibles — réordonner,
transférer, fusionner — et une opération voisine existe déjà, le déplacement des
liens. Les coûts sont très différents, et il faut choisir (ou nommer séparément
dans l'interface).

> **Décision retenue (22 novembre 2026).** « Déplacer » veut dire **réordonner**
> (B1), et rien d'autre. Le transfert (B3) et la fusion (B4) sont hors périmètre
> de la 0.4.0 ; le déplacement de liens (B2) reste ce qu'il est. Le chantier est
> suivi par le milestone GitHub « 0.4.0 — Réordonner les collections » (issues
> #2 à #4).

| Lecture | Sens | État | Coût | Verdict |
|---|---|---|---|---|
| **B1. Réordonner** | Changer l'ordre des collections dans la liste et dans les flèches de la fenêtre | Inexistant ; ordre dérivé (`collections.js:343-349`) | ~1 à 1,5 j | **À faire**, c'est le sens le plus probable de « déplacer une collection » |
| **B2. Déplacer des liens** | Ranger des liens d'une collection dans une autre | **Existe déjà** (`app.js:1472-1524`) | 0 | Ne rien refaire ; le rappeler dans l'interface |
| **B3. Transférer** | Déplacer la collection elle-même vers une autre machine | Inexistant ; se fait en deux gestes manuels | 0,5 à 1 j après le partage | **Option**, après le partage, avec des mots justes |
| **B4. Fusionner** | Verser une collection entière dans une autre, puis la supprimer | Inexistant ; la boucle de `moveSelection` est réutilisable | ~1 j | Option rare ; à ne pas confondre avec B3 |

### 4.1 B1 — réordonner les collections

C'est un petit chantier, mais il touche au document de collections et à un test
qui fige l'ordre actuel (`test/collections.test.js:218`). La conception ci-dessous
a été retenue telle quelle et mise en œuvre pour la 0.4.0 ; l'état du dépôt décrit
au §1 est celui d'avant l'implémentation.

- **Données** : ajouter `order` à l'enregistrement de collection, et le faire
  survivre à l'assainissement. Attention : `createCollection` ne recopie
  aujourd'hui que cinq champs (`collections.js:271-284`) — un champ ajouté sans
  le modifier serait **perdu à chaque lecture**.
- **Version du document** : passer `COLLECTIONS_VERSION` de 1 à 2
  (`collections.js:116`) ; la lecture d'un document v1 reste possible (champ
  absent = ordre par défaut). Pas de migration de masse : on n'écrit des rangs
  qu'au premier réordonnancement, comme `applyOrder` le fait pour les liens
  (`app.js:1297-1301`).
- **Tri** : rang explicite s'il existe, sinon le comportement actuel (défaut en
  tête, puis `createdAt`) ; la collection privée reste dernière
  (`collections.js:443-447`).
- **Synchronisation** : les flèches de la fenêtre parcourent la même liste
  (`popup.js:385-397`, `:427-438`) ; elles suivent donc le nouvel ordre sans
  travail. Le sélecteur de l'application aussi (`app.js:1825-1853`).
- **Interface** : un mode « Réorganiser » sous le sélecteur, avec deux flèches
  par collection (aucun besoin de glisser-déposer). Le motif existe déjà pour
  les liens (`app.js:1201-1228`) et l'accessibilité clavier est plus simple avec
  des boutons.
- **Tests** : ordre après réordonnancement, persistance, collection privée
  toujours dernière, création d'une collection qui arrive en fin de liste,
  suppression qui ne casse pas les rangs.

### 4.2 B3 — transférer une collection : pourquoi ce n'est pas « déplacer »

Un vrai déplacement suppose que la collection ait **quitté** la machine source
**après** son arrivée sur la cible. Sans serveur, l'application ne peut pas
savoir que l'import a réussi ailleurs. Deux gestes sont donc nécessaires :
exporter ici, importer là-bas, puis supprimer ici. La suppression existe déjà et
demande confirmation en nommant la collection et le nombre de liens
(`app.js:1866-1897`, `:2066-2109`).

Trois façons de le présenter, par ordre de prudence :

1. **Ne pas ajouter de bouton « Déplacer »** : documenter « exporter, importer
   sur l'autre machine, puis supprimer » (le plus sûr, zéro code).
2. **Un panneau « Déplacer vers une autre machine… »** qui enchaîne : export du
   fichier, puis une confirmation distincte avec la phrase « Ce fichier est votre
   seule copie ; vérifiez qu'il est bien importé sur l'autre machine avant de
   supprimer. » et le nom du fichier exporté.
3. **Une case à cocher** « J'ai importé cette collection sur l'autre appareil »
   qui conditionne le bouton de suppression. C'est explicite, mais cela ne
   prouve rien : c'est une promesse de l'utilisateur, pas un accusé de réception.

Recommandation : commencer par (1) et (2) ; ne jamais présenter la suppression
comme automatique ou vérifiée.

### 4.3 B4 — fusionner une collection dans une autre

La boucle de `moveSelection` (`app.js:1472-1524`) fait exactement le travail
attendu : elle fusionne un doublon d'URL, retire le rang, et supprime la copie.
Il faut l'étendre à **toute** la collection source, puis supprimer la collection
source. Deux décisions à prendre : la note et le `startIndex` de la destination
ne bougent pas (recommandé), et le nom de la source disparaît. Rare ; à ne pas
mélanger avec B3 dans l'interface.

---

## 5. Contraintes produit, vie privée et magasins

### 5.1 Les promesses qui ferment la porte au réseau

Quatre engagements sont **verrouillés** : ils sont dans la politique de
confidentialité, la fiche du magasin, le README et le site, et deux d'entre eux
sont contrôlés par des tests.

| Engagement | Où |
|---|---|
| Aucun compte, aucun serveur de l'éditeur | `PRIVACY.md:16`, `:76` ; `README.fr.md:13-18` ; `store/listing.json` (`summary`, `singlePurpose`) ; `src/site/index.html` |
| Un seul envoi réseau : le raccourcissement, facultatif ; sinon aucune requête | `PRIVACY.md:41-46`, `:69-70` ; `store/listing.json` (`description`, « Le seul envoi réseau ») |
| Traitement « stored and processed entirely on the user's device » | `store/listing.json`, `singlePurpose` |
| Aucune permission d'hôte ; `storage.sync` jamais écrit | `manifest.template.json:7-12` ; `PRIVACY.md:89-90` ; `README.fr.md:188-189` ; vérifié par `test/publication.test.js:224-267` |

Conséquence : **le partage par fichier ne change rien à ces engagements** — un
fichier téléchargé ne quitte pas l'appareil par l'application elle-même, c'est
l'utilisateur qui le transmet ensuite. Le partage par réseau, lui, exigerait de
réécrire la politique (EN et FR), la mention dans le produit avec
`DISCLOSURE_VERSION` 2 → 3 (`src/core/privacy.js:26-38`), la fiche du magasin et
son objectif unique, la déclaration d'usage des données, et de réexaminer le
manifeste de confidentialité Apple — qui est vide précisément parce que rien
n'est collecté (`docs/preparation-app-store.fr.md:63-80`). C'est un chantier
politique, pas une fonctionnalité.

### 5.2 La collection privée doit être exclue, explicitement

`README.fr.md:232-240` promet qu'aucun chemin de code n'écrit une URL privée sur
le disque. Or l'export actuel ne vérifie rien (`app.js:2328-2335`), et la fenêtre
exporte aussi CSV/MD sans garde (`popup.js:629-644`). Un partage ajouterait une
seconde porte du même type.

Décision à prendre, et à écrire :

- **le plus simple et le plus sûr** : désactiver « Partager » quand la collection
  affichée est la collection privée, avec une infobulle qui l'explique — et faire
  de même pour « Archive » et pour les exports de la fenêtre, puisqu'ils écrivent
  aussi des URL de session sur le disque ;
- **ou** demander une confirmation qui dit exactement ce qui va se passer
  (« ces liens ne sont conservés que jusqu'à la fermeture du navigateur ;
  exporter les fait sortir de la mémoire »), et l'accepter comme un geste
  explicite.

La première option est cohérente avec la phrase du README ; la seconde la
contredit. Recommandation : la première, et profiter du chantier pour aligner
l'export existant.

### 5.3 Fiche du magasin, permissions, App Store

- **Aucune nouvelle permission** n'est nécessaire : le téléchargement passe par
  une ancre (`src/core/download.js:1-11`), le presse-papiers par
  `navigator.clipboard` (déjà implémenté, `download.js:92-121`), et
  `navigator.share` ne demande pas de permission de manifeste. **Ne pas ajouter
  `downloads`** : elle est absente de Safari, et la fiche devrait justifier une
  permission de plus (`test/publication.test.js:224-232`).
- **La fiche ne change que si la description change.** Aujourd'hui elle parle de
  l'import (`store/listing.json`, « Importation : relit une archive exportée
  d'ici… »). Ajouter « partager » à la description est possible, mais ce n'est
  pas obligatoire ; en revanche, le résumé, la description et la fiche doivent
  rester **mot pour mot identiques** entre `store/listing.json` et
  `docs/chrome-web-store.md` (test `publication.test.js`).
- **App Store** : rien ne change tant que le partage reste un téléchargement dans
  l'application web embarquée. Une feuille de partage native ou une Share
  Extension serait un autre chantier, avec revue.

### 5.4 Ce qu'il faudra mettre à jour, selon la voie retenue

| Voie | Documentation et textes |
|---|---|
| A1 + B1 (fichier et réordonnancement) | `README.fr.md` et `README.md` (§ collections, § import) ; `docs/guide.fr.md` et `docs/guide.md` (§ import, § plusieurs collections) ; `CHANGELOG.md` et `CHANGELOG.fr.md` (entrée + section finale, forme tenue par `test/changelog.test.js`) ; `src/core/locales/en.js` (un littéral par clé) ; `_locales` si de nouveaux libellés de manifeste ; décomptes de tests dans les deux README (`test/readme.test.js`) |
| A3 (lien) | En plus : `docs/site-public.fr.md` (le lien et sa limite de taille), et vérification du déploiement |
| A7 (réseau) | En plus : `PRIVACY.md` EN/FR, `src/extension-src/privacy.html`, `DISCLOSURE_VERSION`, `store/listing.json` + `docs/chrome-web-store.md`, `docs/preparation-app-store.fr.md`, tests de publication et de consentement |

---

## 6. Où l'interface l'accueille

### 6.1 L'application — la bonne surface

C'est là que vivent déjà le nom, la note, le premier numéro, le sélecteur, la
suppression et l'import (`index.html:52-140`, `:205-246`). Trois points
d'insertion, du plus naturel au plus coûteux :

1. **La rangée d'export** (`index.html:205-227`) : elle a quatre boutons
   (Tableur, CSV, Markdown, Archive) et son style est calibré pour quatre
   (`style.css:598-602`, « les quatre tiennent »). Renommer « Archive » en
   « Archive / Partager », ou ajouter un cinquième bouton, demande de vérifier le
   retour à la ligne et les tests de présence. Un **panneau** calqué sur
   `import-menu` (`index.html:230-246`, comportement `app.js:2425-2494`) est plus
   propre : il porte le choix « fichier de collection » / « dossier imprimable » /
   « copier », et il explique la différence.
2. **Sous le sélecteur de collection** : les commandes d'identité (nom, note,
   numéro) sont là ; « Partager » y est chez lui, à côté de « Supprimer ».
3. **Un mode « Réorganiser »** pour B1, sous le sélecteur, à la manière du mode
   de réorganisation des liens (`app.js:1337-1347`).

Deux contraintes statiques à ne pas oublier : tout `id` lu par `app.js` doit
figurer dans `src/web/element-ids.js` (sinon l'application refuse de démarrer,
`app.js:466-478`), et tout panneau doit être gouverné par une règle CSS
`[hidden]` (test `test/web.test.js`).

### 6.2 La fenêtre de l'extension — probablement pas

La fenêtre fait 380 px, son pied est plein (CSV, Markdown, Vider ;
`popup.html:140-147`), et elle **ne contient aucun dialogue** : elle ne fait que
parcourir les collections et exporter en CSV/MD (`popup.js:629-644`). Le guide
dit explicitement que créer, renommer et supprimer se font dans l'application
(`docs/guide.fr.md:304-353`), pour la place et la relecture.

Deux options raisonnables, par coût croissant :

- **ne rien ajouter** : « Partager » vit dans l'application, et la fenêtre garde
  son rôle — c'est la recommandation ;
- **un bouton-icône** dans la barre de collection, qui ouvre l'application sur la
  section de partage (`app.html#partager`, ou une simple ouverture d'onglet). Le
  premier dialogue de la fenêtre serait un précédent coûteux en tests
  d'accessibilité (`test/popup-a11y.test.js`) ; une ouverture d'onglet ne l'est
  pas.

### 6.3 Accessibilité, i18n, tonalité

- **A11y** : reprendre les motifs existants — la confirmation de suppression
  (`app.js:1879-1912`) pour toute action destructive, le panneau d'import pour un
  choix nommé, le `toast` comme région vivante (`app.js:525-538`), et les boutons
  avec `aria-expanded` / `aria-controls` pour les panneaux.
- **i18n** : toute chaîne passe par `t()` avec un **littéral** ; le catalogue
  anglais doit contenir la clé, sinon `test/i18n.test.js:189` échoue. Le
  catalogue compte 541 clés ; une fonctionnalité comme celle-ci ajoute de l'ordre
  de 20 à 30 libellés, et les deux langues.
- **Terminologie** : « QR Code » s'écrit ainsi (`test/terminologie.test.js`) ;
  « collection » est déjà le mot du produit, ne pas introduire « dossier » ou
  « liste ».

---

## 7. Coût et plan

Estimations en jours de travail **avec** les tests et la documentation, sur la
base des chantiers comparables du dépôt (l'import à trois issues et sa reprise
dans l'interface valaient à eux seuls plusieurs jours de rédaction et de tests).

| Lot | Contenu | Dépend de | Estime |
|---|---|---|---|
| **F1. Format** | Sérialiseur et lecteur du format de collection (nouveau module pur + tests unitaires, rétrocompatibilité) | — | 0,5 à 1 j |
| **F2. Réception fidèle** | Métadonnées de collection, politique d'id et de rang, écriture en une passe, plafonds, nouveaux tests d'import | F1 | 1 à 1,5 j |
| **F3. Partage dans l'application** | Panneau « Partager », fichier de collection, renvoi éventuel vers les dossiers imprimables, états et messages, i18n, a11y, tests d'interface | F1, F2 | 1 à 1,5 j |
| **F4. Réordonnancement** | Champ `order`, version du document, tri, méthode de magasin, mode de réorganisation, tests, mise à jour du test d'ordre existant | — | 1 à 1,5 j |
| **F5. Fenêtre** (option) | Entrée « Partager » qui ouvre l'application, ou export JSON dans la fenêtre | F3 | 0 à 0,5 j |
| **F6. Lien et presse-papiers** (option) | Encodage/décodage de fragment, écran de confirmation, plafond de taille, presse-papiers, vérification de `CompressionStream` | F1, F2, déploiement | 1 à 2 j |
| **F7. « Déplacer »** (option) | Panneau d'export puis confirmation de suppression, phrases de sécurité | F3 | 0,5 à 1 j |
| **F8. Documents et publication** | README ×2, guide ×2, CHANGELOG ×2, fiche si nécessaire, décomptes, mentions de confidentialité si la voie réseau est choisie | F1-F4 | 1 à 1,5 j |
| **F9. Éprouver** | `verify:chrome`, `verify:brave`, `verify:safari`, et à la main : téléchargement/clipboard dans une page d'extension Safari, import sur une seconde machine, comportement iOS | tout | 1 à 2 j |

**MVP recommandé (F1, F2, F3, F4, F8, F9)** : **5,5 à 9 jours**.
**Version complète avec F5 et F7** : **6 à 10,5 jours**. En ajoutant le lien à
fragment (F6), compter **1 à 2 jours de plus** : c'est un chantier à part, à
n'ouvrir qu'après mesure.

Ces estimations supposent que la version passe en **0.4.0** (fonctionnalité
nouvelle, donc mineure), que les deux journaux sont renseignés, et que la suite
de tests (1 183 tests) reste verte — le dépôt exige `npm run build` avant
`npm test`, et les tests lisent `dist/`.

---

## 8. Risques et cas limites

| Risque | Pourquoi il arrive | Réponse prévue |
|---|---|---|
| **Collision d'identifiants** | Les fichiers portent les `id` des liens ; deux imports successifs les réutilisent | Regénérer un id déjà présent ailleurs ; ne jamais faire confiance à l'id du fichier |
| **Collision de rangs** | Le fichier porte `order` ; la destination peut déjà être rangée | Rangs conservés seulement en mode fidèle, retirés en fusion/remplacement |
| **Import partiel silencieux** | Boucle d'`add` avec `.catch(() => {})` | Écriture en une passe, bilan explicite, suppression de la collection créée en cas d'échec |
| **Collection privée exportée** | Aucun garde aujourd'hui | Désactiver partage et export en contexte privé (ou confirmation explicite, à trancher) |
| **Quota de 10 Mo** | `chrome.storage.local` sans `unlimitedStorage` | Plafonds à l'import et message clair ; un fichier de 20 000 liens peut déjà dépasser le quota |
| **« Déplacement » non vérifiable** | Aucun serveur, donc aucun accusé de réception | Deux gestes distincts, confirmation nommée, fichier conservé dans les téléchargements |
| **Format qui évolue** | Deux versions de l'application en circulation | Version de fichier, lecture tolérante, refus explicite seulement si incompatible |
| **Fichier hostile** | Un partage est une entrée non fiable | Validation d'URL existante, plafonds, pas d'évaluation, pas d'injection HTML |
| **Cibles non vérifiées** | Safari/iOS : téléchargement et presse-papiers dans une page d'extension non mesurés | Éprouver avant de promettre ; repli systématique sur le téléchargement |
| **Fiche de magasin incohérente** | Tests de parité `listing.json` / `docs/chrome-web-store.md` | Mettre à jour les deux ensemble, ou ne pas toucher à la fiche |
| **Traductions** | Test qui exige chaque littéral dans `en.js` | Écrire les libellés en français d'abord, puis les traduire dans le même lot |

---

## 9. Ce qui reste à trancher, et comment

1. **Quel « déplacer » ?** Réordonner (B1), transférer (B3), fusionner (B4) —
   ou les trois, nommées différemment dans l'interface. C'est la première
   décision, et elle commande le plan.
2. **La collection privée** : l'exclure du partage *et* de l'export existant
   (cohérent avec le README), ou autoriser avec une confirmation explicite
   (contredit la phrase actuelle). Décision de produit, pas de technique.
3. **Faut-il conserver l'identité d'une collection d'un appareil à l'autre ?**
   La conserver permet, plus tard, de reconnaître « la même » collection et de
   proposer une mise à jour plutôt qu'une copie — mais ouvre la porte à des
   copies divergentes qu'aucune synchronisation ne réconciliera. Pour le MVP :
   identité indicative, copie assumée.
4. **Le lien vers l'application hébergée** : le plafond de taille, et le fait que
   l'application hébergée ne partage pas son stockage avec l'extension. À mesurer
   (`CompressionStream` sur Safari 16.4, longueur pratique d'URL) avant de
   promettre.
5. **La fenêtre de l'extension** doit-elle héberger « Partager » ? Recommandation :
   non, elle garde son rôle ; l'application est la surface des collections.
6. **Les plafonds** : 10 Mo / 20 000 liens sont des propositions, à confronter au
   quota réel mesuré sur Chrome et au ressenti d'un import long.

---

## 10. Recommandation

1. **Faire d'abord le partage par fichier** (F1, F2, F3) : c'est le besoin
   « autre machine ou tiers » couvert avec le moins de risque, sans permission
   nouvelle, sans réseau, et en réutilisant l'import à trois issues que les
   utilisateurs connaissent déjà.
2. **Faire le réordonnancement ensuite** (F4) : petit, attendu, et sans impact
   sur les promesses. C'est probablement le sens de « déplacer une collection »
   le moins coûteux.
3. **Fermer la porte de la collection privée** dans le même lot : partage et
   export doivent refuser ou avertir, sinon la phrase du README devient fausse.
4. **Corriger les quatre défauts du socle d'import** (§1.4) : ils ne sont pas
   causés par le partage, mais le partage les rendrait visibles à grande échelle.
5. **Ne pas faire** : serveur, compte, synchronisation, WebRTC, QR multi-parties,
   permission `downloads`, extension de partage native. Chacun casse une
   promesse, ajoute une permission, ou demande une revue de magasin pour un
   bénéfice inférieur au fichier.
6. **N'ouvrir le lien à fragment (F6) qu'après mesure**, et le présenter comme un
   confort pour petites collections, jamais comme le mode principal.
7. **Écrire « exporter » et « supprimer », pas « déplacer »**, tant qu'aucun
   accusé de réception n'existe. Un utilisateur qui lit « déplacer » croira que
   la collection est partie ; elle sera peut-être encore là, ou perdue.

---

## Récapitulatif des références internes

**Modèle et stockage**
`src/core/collections.js:110-116` (clés, version), `:216-219` (collection d'un
lien), `:271-284` (champs d'une collection), `:335-349` (ordre dérivé),
`:377-409` (assainissement), `:443-447` (visibilité), `:485-500` (nom libre),
`:639-648` (collection réservée), `:761-821` (suppression, collection courante) ·
`src/core/store.js:141-242` (IndexedDB), `:308-369` (`chrome.storage`),
`:424-465` (magasin borné), `:485-538` (magasin composite) ·
`src/core/link.js:16-43` (enregistrement, origines), `:251-292` (URL),
`:395-433` (`createLink`), `:450-460` (ordre manuel).

**Formats et fichiers**
`src/core/exporters.js:332-351` (`toJson`) · `src/core/import.js:57-69`
(métadonnées de collection), `:89-131` (archive JSON), `:308-345`
(`parseImportFile`), `:357-369` (`toImportableLinks`) ·
`src/core/download.js:1-11` (ancre), `:92-121` (`copyText`) ·
`src/core/zip.js:142-182` (lecture ZIP non compressé) ·
`src/core/label-export.js:596-660` (manifeste d'un dossier imprimable).

**Application**
`src/web/app.js:1201-1228` (commandes de rang), `:1297-1301` (`applyOrder`),
`:1472-1524` (déplacement de liens), `:1604-1700` (nom, note, source),
`:1825-1853` (sélecteur), `:1866-1912` (confirmation de suppression),
`:2020-2109` (création, suppression), `:2173-2200` (relecture),
`:2250-2282` (synchronisation entre pages), `:2328-2352` (exports),
`:2379-2411` (lecture d'un import), `:2425-2468` (choix du rangement),
`:2514-2587` (application de l'import, bilan) ·
`src/web/index.html:52-140` (collection), `:205-246` (export, import) ·
`src/web/element-ids.js` · `src/extension-src/popup.html:140-147` (exports de la
fenêtre) · `src/extension-src/popup.js:385-438` (barre et parcours), `:629-644`
(`exportAs`), `:780-785` (relecture du stockage).

**Promesses et publication**
`README.fr.md:172-199` (stockage, plafond), `:188-189` (pas de synchronisation),
`:201-290` (collections), `:578-634` (import) · `PRIVACY.md:16`, `:31-46`,
`:69-77`, `:133-152` · `store/listing.json` (`summary`, `singlePurpose`,
`dataUsage`) · `docs/chrome-web-store.md` (mêmes champs) ·
`docs/preparation-app-store.fr.md:63-80` (manifeste vide) ·
`src/core/privacy.js:26-85` (mention versionnée) ·
`docs/note-capacites-capture-url-safari-brave.md` (§1.4, §1.5, §2.7, §5.7) ·
`docs/site-public.fr.md` (application sous `/app/`, deux stockages séparés).

**Tests à tenir**
`test/collections.test.js:218` (ordre figé) · `test/web-collections.test.js` ·
`test/web-import.test.js` · `test/import.test.js:46-166` ·
`test/web-move.test.js` (non-régression du déplacement de liens) ·
`test/web.test.js` (`ELEMENT_IDS`, règle `[hidden]`) ·
`test/popup-a11y.test.js` · `test/i18n.test.js:189,260` ·
`test/publication.test.js:167-267` · `test/changelog.test.js` ·
`test/readme.test.js` (décomptes) · `test/declarations.test.js`.
