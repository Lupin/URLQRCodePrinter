# L'extension dans Safari — ce qui a été éprouvé

**Date** : septembre 2026.
**Machine** : macOS 26.5.1, Safari 26.5, `safaridriver` 26.5.
**Commande** : `npm run verify:safari` — **37/37 vérifications**, code de sortie 0.
**Périmètre** : Safari macOS. iOS n'est pas concerné par ce relevé.

Ce document dit ce qui a été **constaté** avec preuve, ce qui n'a **pas** pu
l'être et pourquoi. Il ne remplace pas `README.md` : il enregistre le résultat
d'une épreuve, pour qu'on ne le suppose pas à nouveau.

## Le fait qui commande tout le reste

`verify-brave.mjs` charge l'extension par `--load-extension` dans un profil
isolé et parle à son service worker par DevTools. **Safari n'a pas
d'équivalent**, et ce n'est pas une question de configuration :

| Ce qui manque | Constaté comment |
| --- | --- |
| Charger l'extension par WebDriver | `POST /session/{id}/extension` répond `unknown command` |
| Un profil isolé | `safaridriver` pilote le **vrai** Safari, avec le profil réel de l'utilisateur |
| Lire l'état des extensions | `~/Library/Containers/com.apple.Safari/Data/Library/Safari` est protégé ; `pluginkit -p com.apple.Safari.web-extension` répond `unauthorized discovery flag` |

La conséquence est double, et il faut la regarder en face.

1. **Le chargement de l'extension ne peut pas être automatisé.** Il dépend de
   trois réglages de Safari qui n'ont ni API ni ligne de commande documentée :
   afficher le menu Développeur, autoriser les extensions non signées, cocher
   l'extension. C'est une étape manuelle **unique**, et elle doit rester
   manuelle : la faire à la place de l'utilisateur reviendrait à changer la
   configuration de son navigateur sans le lui dire.
2. **Ce qui dépend du processus d'extension reste hors de portée d'un script** :
   menu contextuel, fenêtre de la barre d'outils, badge de l'icône, service
   worker. Ces objets vivent dans Safari, pas dans une page, et WebDriver ne les
   voit pas.

Ce qui **est** vérifiable, en revanche, est la moitié la plus utile : la page
`app.html` est une vraie page web. `npm run verify:safari` la sert en HTTP et
l'éprouve pour de bon.

## Ce qui fonctionne, avec la preuve

Relevé intégral de `npm run verify:safari` :

```
— Safari et outillage —
✓ Safari est installé et sa version est relevée — Safari 26.5
✓ safaridriver répond — Included with Safari 26.5 (21624.2.5.11.4)
✓ l'application conteneur macOS est compilée
✓ l'appex embarque bien le point d'extension Safari — NSExtensionPointIdentifier

— Le paquet de l'extension —
✓ le manifeste est en version 3 — manifest_version 3
✓ le service worker est déclaré et présent sur le disque — background.js
✓ la clé browser_specific_settings vise Safari 16.4 ou plus — strict_min_version 16.4
✓ aucun fichier du paquet ne contient de déclaration d'import ou d'export
✓ chaque script du paquet est syntaxiquement valide — 3 fichiers
✓ tous les fichiers cités par le manifeste existent — 9 fichiers

— Session Safari —
✓ une session WebDriver s'ouvre sur le Safari réel — Safari 26.5 · macOS 26.5.1
✓ SafariDriver n'expose pas d'installation d'extension par WebDriver

— L'application dans Safari —
✓ app.html se charge et son titre est celui de l'application
✓ la page est servie en français — lang="fr"
✓ le script principal s'exécute et remplit l'interface — 13 planches, 19 boutons
✓ la feuille de style est appliquée — 1 feuille(s)
✓ le bandeau « feuille de style obsolète » reste caché

— Capacités absentes de Safari —
✓ Web Bluetooth est absent de Safari
✓ l'API File System Access est absente de Safari
✓ l'onglet Niimbot annonce l'absence de Web Bluetooth au lieu de la subir
✓ le bouton de connexion à l'imprimante reste inactif

— Collecte et rendu —
✓ un lien ajouté apparaît dans la liste — 1 lien
✓ l'URL est normalisée comme dans le cœur : les paramètres de suivi partent
✓ l'aperçu de planche est réellement composé — 1 étiquette, 1 QR
✓ le QR rendu par Safari est identique à celui du cœur, module pour module
    — cœur 31 × 31, 436 modules sombres, 0 écart

— Exports —
✓ l'export CSV déclenche un enregistrement de fichier — 114 octets
✓ le fichier CSV exporté par Safari est identique à celui du cœur, octet pour octet
    — 114 octets · BOM UTF-8 présent
✓ le CSV exporté contient l'URL normalisée
✓ l'export Markdown déclenche un enregistrement de fichier — 300 octets
✓ l'export JSON est un document valide qui contient l'URL normalisée — 522 octets

— Étiquette Niimbot, images et impression —
✓ l'onglet Images compose un canevas réellement encré et un PNG valide
    — 96×198 px, 2897 pixels d'encre, signature PNG
✓ l'export d'images (ZIP) est disponible — la voie utile sans Web Bluetooth
✓ l'aperçu d'étiquette Niimbot se compose sans imprimante connectée
    — D110 — 96 × 176 px, 2 px par module
✓ le bouton d'impression est prêt et nomme sa portée — « Imprimer le lien »
✓ la taille de papier @page est posée pour l'impression — 210mm 297mm
✓ aucune erreur JavaScript ni promesse rejetée pendant le parcours
✓ aucune erreur grave dans la console de Safari

37/37 vérifications réussies.
```

Deux vérifications méritent d'être signalées parce qu'elles comparent deux
chemins **indépendants** — Safari d'un côté, le cœur exécuté par Node de
l'autre — et exigent une égalité exacte :

- le CSV exporté par Safari est **identique octet pour octet** à celui que
  `core/exporters.js` produit, BOM UTF-8 compris ;
- le QR dessiné dans la page est **identique module pour module** à celui que
  `core/qr.js` encode : 31 × 31, 436 modules sombres, zéro écart.

## Ce qui ne fonctionne pas, et pourquoi

### Web Bluetooth : impossible, pas seulement absent

`typeof navigator.bluetooth` vaut `undefined` dans Safari 26.5. WebKit ne
l'implémente sur aucune version, et iOS impose WebKit à tous les navigateurs :
il n'y a donc pas de contournement par un autre navigateur sur iPhone ou iPad.

L'onglet « Étiquette Niimbot » reste **inactif et expliqué** : le bouton de
connexion est désactivé, et le message affiché dit « Web Bluetooth n'est pas
disponible dans ce navigateur. Safari (macOS et iOS) ne l'implémente pas. »
C'est le comportement voulu — un bouton mort aurait échoué après le clic, en
anglais.

### L'API File System Access : absente

`showSaveFilePicker`, `showOpenFilePicker` et `showDirectoryPicker` sont tous
`undefined`. L'export ne peut donc pas passer par un sélecteur de fichier — et
`browser.downloads` n'existe pas non plus dans Safari. C'est l'ancre `<a
download>`, déjà utilisée par `core/download.js`, qui enregistre les fichiers.
Les trois exports mesurés prouvent que ce chemin fonctionne.

### L'impression directe sur Niimbot : impossible

Conséquence directe de l'absence de Web Bluetooth. Sur Safari, la voie utile est
l'**export d'images en ZIP**, qui produit des PNG à imprimer par n'importe quel
moyen. C'est aussi la seule voie sur iPhone et iPad.

## Ce qui reste à faire une fois, à la main

Dans cet ordre :

```bash
npm run install:safari        # 1. compile et lance l'application conteneur
```

Puis, dans Safari :

2. **Réglages → Avancé → « Afficher le menu Développeur »**
3. **menu Développeur → « Autoriser les extensions non signées »** — nécessaire
   pour une compilation locale, sans certificat Apple Developer
4. **Réglages → Extensions → cocher « URLQRCodePrinter »**

### Le réglage d'automatisation, à part

Pour que `npm run verify:safari` fonctionne, Safari doit accepter WebDriver :
**menu Développeur → « Autoriser l'automatisation à distance »**. Sans lui, la
création de session échoue et le script le dit avec la marche à suivre, plutôt
que d'échouer sur un message anglais.

Ce réglage peut être posé par :

```bash
sudo safaridriver --enable
```

qui demande le mot de passe administrateur — un script ne peut donc pas le faire
seul. Une fois posé, il persiste : `verify:safari` n'a plus besoin d'y revenir.

### Un piège d'état, à connaître

Une interruption brutale d'un script WebDriver — `SIGKILL`, ou un délai qui tue
le processus — laisse **Safari apparié à une session morte**. Toute session
suivante échoue alors sur :

```
The Safari instance is already paired with another WebDriver session.
```

Ni le redémarrage de `safaridriver` ni `DELETE /session` ne libèrent cet
appariement : il faut **quitter Safari et le relancer**. `verify:safari` atténue
le problème — il ferme sa session sur `SIGINT` et `SIGTERM`, et retente la
création quelques fois — mais un `SIGKILL` ne se rattrape pas.

## Ce qui n'a pas pu être vérifié, et qui doit être dit comme tel

| Point | Pourquoi |
| --- | --- |
| Le chargement de l'extension par Safari | Aucune commande d'installation dans SafariDriver ; l'état des extensions n'est pas lisible depuis un script |
| Le menu contextuel « Enregistrer cette page / ce lien » | Vit dans le processus d'extension, invisible depuis une page |
| La fenêtre de la barre d'outils, et le badge de l'icône | Même raison |
| Le service worker, et « Ajouter cette page » | Même raison |
| Le quota réel de `storage.local` | Non documenté par Apple ; mesurable seulement avec l'extension chargée |
| `contextMenus` sur Safari iOS | Contradiction de sources (BCD dit non, le code WebKit ne l'exclut pas) ; exige un appareil iOS réel |

Ces points ne sont **pas** des défauts constatés : ce sont des points non
éprouvés. La différence compte.

## Deux défauts corrigés en écrivant ce relevé

Ils étaient dans le script de vérification, pas dans l'application — et ils
illustrent la règle « un test qui passe ne prouve rien s'il mesure la mauvaise
chose » :

- **Le port du serveur de test.** Le port 4190 est dans la liste des ports
  qu'un navigateur refuse par conception. Le serveur écoutait, la page ne
  s'ouvrait pas, et le diagnostic accusait l'application. `verify:safari` écarte
  désormais ces ports.
- **Le comptage des fermetures SVG.** `match(…).join('').length` comptait 14
  caractères pour deux balises `</rect>` et `</path>` — un simple `>` — alors que
  l'écart réel était de 12 octets. La comparaison se fait maintenant sur la
  **matrice**, pas sur la sérialisation textuelle, qui diffère légitimement
  entre un DOM et une chaîne.

## Comment relancer l'épreuve

```bash
npm run build
npm run verify:safari
```

Le script démarre `safaridriver`, sert `dist/extension-safari` sur un port sûr,
ouvre une session sur le Safari réel, éprouve la page, ferme tout, et affiche à
la fin ce qu'il n'a **pas** pu vérifier. Il ne touche à aucun réglage de Safari
et n'écrit aucun fichier chez l'utilisateur : les exports sont interceptés avant
l'enregistrement.
