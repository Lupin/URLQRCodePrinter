# Guide d'utilisation

Ce guide décrit l'application telle qu'elle est aujourd'hui : collecter des URL
depuis le navigateur, les mettre en page, puis les imprimer — sur une étiqueteuse
Niimbot, sur une planche d'étiquettes autocollantes, ou sur n'importe quelle
imprimante via un dossier d'images.

> Une version antérieure de ce document décrivait un prototype à une seule URL,
> avec des rouleaux de 15 mm et une densité de 1 à 5. Elle ne correspond plus au
> code : la tête du D110 fait 12 mm utiles (96 px à 203 dpi) et sa densité va de
> 1 à 3.

## Vue d'ensemble

Deux surfaces, un seul cœur :

- **l'extension Brave / Chrome / Edge** — collecte un lien au clic droit ou
  depuis la barre d'outils ;
- **l'application** (page de l'extension, ou `npm run serve` sur
  `http://127.0.0.1:4173/`) — relit la collection, met en page, imprime et
  exporte.

Les liens restent sur votre machine : le stockage est local (IndexedDB ou
`chrome.storage.local`). La seule sortie réseau est le raccourcissement d'URL,
et il n'a lieu que si vous cliquez dessus.

## Collecter des liens

| Moyen | Où |
|---|---|
| Clic droit sur un lien ou une page | « Enregistrer ce lien en QR » |
| Bouton de la barre d'outils | enregistre l'onglet courant |
| Champ « Ajouter » | saisie manuelle |
| Bouton « Importer » | relit une archive JSON exportée précédemment |

**Nommer la collection.** Le champ « Nom de la collection » (sous le titre du
panneau) donne son titre à l'export Markdown, à la planche HTML de l'archive
d'images, et son nom aux fichiers exportés — `Veille-du-vendredi-20260915-1741.md`
plutôt que `liens-qr-….md`.

**Titre, tags et note.** Le bouton **✎** de chaque ligne ouvre les trois champs
qui partent dans les exports :

- **Titre** — le titre de la page est repris automatiquement à la capture, mais
  un lien ajouté à la main n'en a pas : c'est ici qu'on le donne ;
- **Tags** — séparés par des virgules, dédoublonnés et mis en forme
  automatiquement (`veille, travail, veille` → `veille` et `travail`). Les puces
  affichées sous la ligne filtrent la collection d'un clic ;
- **Note** — texte libre, visible sous la ligne et repris dans le tableau
  imprimé si vous cochez « Afficher les notes ».

Entrée enregistre, Échap annule. Ces trois champs apparaissent dans le CSV, le
Markdown et le classeur — et seulement s'ils ont du contenu, pour ne pas ajouter
de colonnes vides. Les tags ne s'impriment pas sur les étiquettes : ils classent
la collection.

Les URL sont normalisées à l'entrée : `https://` ajouté si absent, fragment
retiré, paramètres de campagne (`utm_*`, `fbclid`, `gclid`…) supprimés — ils
allongent le QR sans rien apporter au papier. Un doublon n'est pas ajouté deux
fois ; l'application vous le dit au lieu de rester silencieuse.

**Dater les étiquettes.** Le sélecteur « Date sous le QR code » imprime la date
de collecte du lien — `Aucune` par défaut, `Date de collecte` (`15/09/2026`) ou
`Date et heure de collecte` (`15/09/2026 18:01`). Utile pour dater une capture
dans un cahier de laboratoire ou un journal d'essais. Le choix s'applique à la
planche, au tableau (colonne « Date »), à l'étiquette Niimbot et à l'archive
d'images.

Une date n'est jamais imprimée partiellement : si elle ne tient pas — colonne
trop étroite, ou plus de deux lignes nécessaires à cette taille de texte — elle
est omise et l'aperçu le signale. Réduire la taille du texte, ou choisir une
étiquette plus large, la fait tenir.

**Ouvrir un lien collecté.** Le titre et l'URL de chaque ligne sont des
hyperliens : ils s'ouvrent dans un nouvel onglet, depuis l'application comme
depuis la fenêtre de l'extension.

## Importer une collection

Le bouton **« Importer »** relit ce que l'application exporte. Il est dans
l'application (page de l'extension ou `localhost`), pas dans la fenêtre de la
barre d'outils.

| Fichier fourni | D'où il vient | Ce qui est relu |
|---|---|---|
| `liens-….json` | bouton **Archive** | tout : URL, titre, tags, note, date de collecte, raccourci |
| `etiquettes-….zip` | bouton **Exporter les images (ZIP)** | les liens du manifeste contenu dans l'archive |
| `export.json` | extrait à la main d'une archive | les mêmes |
| `….csv` | bouton **CSV**, éventuellement retouché dans un tableur | URL, titre, tags, note, date |

**L'import ajoute à la collection courante ; il ne la remplace pas.** Pour
repartir d'une collection vide, cliquez « Tout effacer » d'abord.

Ce qui se passe ensuite :

- un lien **déjà présent** (même URL) est ignoré : le message dit
  « 0 lien importé, 1 déjà présent ». Réimporter deux fois la même archive ne
  crée donc pas de doublon, et ce n'est pas une erreur ;
- une ligne **illisible** est comptée à part (« 2 illisibles ») et n'interrompt
  pas le reste de l'import ;
- la **date de collecte** est conservée quand le fichier la porte — un CSV
  exporté puis réimporté garde donc ses dates ;
- les colonnes **Domaine**, **N°**, **Image** et **QR code** sont ignorées : elles
  se recalculent ;
- dans un CSV, les colonnes sont retrouvées **par leur nom**, pas par leur
  position : réordonner les colonnes dans un tableur ne casse rien, et les
  colonnes facultatives (Note, URL courte) sont prises quand elles existent ;
- le **nom de collection** n'est pas repris d'une archive : il reste celui de la
  session en cours.

Un fichier d'un autre type est refusé avec la liste des formats attendus, par
exemple : « Import impossible : « notes.txt » n'est pas un format reconnu.
Formats acceptés : l'archive JSON du bouton « Archive », le dossier d'étiquettes
(.zip) ou son export.json, ou un CSV exporté d'ici. »

## Raccourcir, en option

Le bloc « Raccourcir » se trouve sous la barre de recherche.

1. Choisissez le service : **TinyURL** (défaut), is.gd, v.gd ou spoo.me. Aucun ne
   demande de clé d'API.
2. Cochez les liens voulus — sans rien cocher, le bouton porte sur toute la
   collection.
3. Cliquez « Raccourcir ». Un second clic annule le lot en cours.
4. « Retirer » efface tous les raccourcis.

Ce qui se passe, et ce qui ne se passe pas :

- **l'URL d'origine n'est jamais remplacée** ; le raccourci est enregistré à
  côté, avec le nom du service et la date ;
- **l'URL complète est transmise au service choisi** — c'est le prix du
  raccourcissement, et l'interface le rappelle ;
- **le lien imprimé dépend ensuite de ce service.** Pour une étiquette qui doit
  vivre des années, gardez l'URL d'origine.

L'intérêt est concret sur une petite étiquette : moins de caractères donnent
moins de modules, donc un QR plus lisible et imprimable plus petit.

Ensuite, le sélecteur **« Le QR code pointe vers »** (colonne de droite) décide
ce qui part à l'impression : l'URL collectée, ou le raccourci. Il vaut pour
toutes les sorties imprimées.

## Mettre en page

Quatre onglets, quatre usages.

### Planche d'étiquettes

Pour les planches autocollantes A4 et Letter. Deux familles de dispositions :

- **génériques** — des grilles géométriquement valides, à régler vous-même ;
- **références commerciales** — les cotes publiées pour ces produits :

| Référence | Grille | Étiquette | Papier |
|---|---|---|---|
| Avery L7160 | 3 × 7 = 21 | 63,5 × 38,1 mm | A4 |
| Avery L7159 | 3 × 8 = 24 | 63,5 × 33,9 mm | A4 |
| Avery L7162 | 2 × 8 = 16 | 99,1 × 33,9 mm | A4 |
| Avery L7163 | 2 × 7 = 14 | 99,1 × 38,1 mm | A4 |
| Avery Zweckform 3475 | 3 × 8 = 24 | 70 × 36 mm | A4 |
| Avery 5160 / 8160 | 3 × 10 = 30 | 66,7 × 25,4 mm | Letter |
| Avery 5162 / 8162 | 2 × 7 = 14 | 101,6 × 33,9 mm | Letter |
| Avery 5163 / 8163 | 2 × 5 = 10 | 101,6 × 50,8 mm | Letter |
| Avery 6871 | 3 × 6 = 18 | 60,3 × 31,8 mm | Letter |

> **L'aperçu est à l'échelle de la fenêtre**, pas à 100 % : le texte y paraît
> donc petit. C'est la *disposition* qu'il faut y vérifier. Pour juger du rendu
> réel, imprimez sur papier ordinaire — ou regardez l'onglet « Images à
> imprimer », qui affiche une étiquette en grand.

**Choisir les colonnes du tableau.** Dans l'onglet « Tableau », le groupe
**Tableau imprimé** permet de cocher une à une les colonnes : N°, QR, URL, Titre,
Tags, Note. La date suit le réglage global « Date sous le QR code ».

Deux d'entre elles ne sont proposées que si elles ont du contenu : une colonne
« Tags » ou « Note » vide sur toute une page n'apprend rien. Elles s'activent
depuis la liste, avec le bouton **✎** de chaque ligne.

**Masquer la grille.** La case **« Grille et bordures »** retire les traits et le
fond gris de l'en-tête : le tableau se lit alors comme une liste, et s'allège à
l'impression. Les lignes gardent un peu plus d'air, seul repère qui reste pour
suivre une ligne des yeux.

**Choisir le nombre de colonnes, ou remplir la feuille.** Le sélecteur
**Une seule présentation, six valeurs.** Le sélecteur **Disposition** ne fait
que *préremplir* les six champs qui suivent ; vous pouvez ensuite les ajuster
librement, et la taille des étiquettes est recalculée :

**Sélectionner ce qu'on imprime.** Le groupe **Sélection** (« Tout cocher » /
« Tout décocher ») agit sur les cases à gauche de chaque ligne, pas sur la
recherche. La phrase sous les boutons dit toujours ce qui partira à l'impression,
et le bouton lui-même l'annonce : « Imprimer les 31 liens » ou
« Imprimer la sélection (3) ».

> **Aucun lien coché signifie « toute la collection ».** C'est la règle la moins
> devinable de l'application : « Tout décocher » n'imprime pas *rien*, il imprime
> *tout*. Elle est écrite sous les boutons pour cette raison.

| Champ | Ce qu'il fait |
|---|---|
| **Colonnes** / **Rangées** | la grille voulue sur la feuille |
| **Marge gauche et droite** | la marge de chaque côté de la grille |
| **Marge haut et bas** | la marge au-dessus et au-dessous |
| **Écart entre colonnes** / **Écart entre rangées** | la bande blanche entre deux étiquettes |
| **Décalage horizontal / vertical** | déplace toute la grille, sans la modifier |

La phrase sous ces champs annonce le résultat, avec vos chiffres : « Taille des
étiquettes déduite de ces six valeurs : 63,5 × 33,9 mm, 3 × 8 par feuille. », et
ajoute « Décalage appliqué : 1,5 mm vers la droite et 3,5 mm vers le bas. » si
vous avez saisi un décalage — c'est ce qui explique une grille qui ne tombe pas
où vous l'attendiez.

Pour une **planche du commerce**, choisissez sa référence : les six champs
reprennent alors ses cotes publiées, et la taille obtenue est exacte au centième
de millimètre. La marge du fabricant n'est pas toujours symétrique — 8,6 mm à
gauche et 5,1 mm à droite sur une L7160 — et une grille à marge symétrique ne peut
pas reproduire les deux : le **pas** reste exact, donc les colonnes tombent bien
en face de leurs cases, mais l'ensemble peut être décalé de quelques dixièmes de
millimètre. Corrigez-le avec **Décalage horizontal**, jamais avec la marge.

**Calibrer avant d'imprimer sur une planche.** Aucune cote de fabricant ne
prévoit le décalage d'entraînement de votre imprimante. La marche à suivre :

1. imprimez sur **papier ordinaire**, à l'échelle **100 %** (jamais « ajuster à
   la page » : c'est la cause n° 1 des planches décalées) ;
2. superposez la feuille obtenue à votre planche d'étiquettes, en la tenant
   devant une fenêtre ;
3. si le texte est trop haut ou trop à gauche, corrigez avec **Décalage
   horizontal** et **Décalage vertical** (en mm, valeurs négatives acceptées).

Les décalages déplacent la grille sans la modifier. Une fois réglés, ils valent
pour toutes les planches.

### Tableau

Un tableau dense — QR code, titre, domaine, notes — pour relire ou archiver sur
papier.

### Étiquette Niimbot

Pour l'impression directe sur une D110 ou une M2. Voir la section suivante.

### Images à imprimer

Un dossier d'images prêtes à imprimer, **sans aucune imprimante**. Voir
« Exporter sans Niimbot ».

## Imprimer sur une Niimbot

### Le format se prévisualise sans imprimante

Le sélecteur **Format d'étiquette** propose :

- **Niimbot D110** — 12 mm utiles, 203 dpi ;
- **Niimbot M2** — 48 mm utiles, 300 dpi (576 px de tête).

L'aperçu est composé **même sans imprimante connectée** : dimensions, nombre de
modules et lisibilité sont exacts. C'est ce qui permet de juger un rendu, ou de
vérifier qu'une URL tient, avant d'acheter le matériel.

Sous l'aperçu, une légende indique le profil utilisé et le nombre de pixels par
module. Deux pixels par module est le minimum : en dessous, une tête thermique
fusionne les points.

Une fois une imprimante connectée, l'aperçu se cale sur son profil réel, et
l'impression utilise **toujours** le profil du matériel — jamais celui de
l'aperçu. Vous pouvez donc explorer le format M2 tout en étant branché sur une
D110 sans risque d'imprimer à la mauvaise largeur.

### Connecter

1. **Brave bloque Web Bluetooth par défaut.** C'est la cause n° 1 des échecs, et
   l'application la signale maintenant d'elle-même : si le bouton « Connecter »
   est grisé avec un message, voici la marche à suivre.
   1. Ouvrez `brave://flags/#brave-web-bluetooth-api`
   2. Mettez **Web Bluetooth API** sur **Enabled**
   3. **Relancez Brave** — le drapeau n'est lu qu'au démarrage, un simple
      rechargement de page ne suffit pas
   4. Rouvrez l'application : le bouton « Connecter » redevient actif

   Chrome et Edge n'ont pas cette contrainte. Safari ne l'implémente pas du tout.
2. Allumez l'imprimante et mettez-la en appairage.
3. Onglet « Étiquette Niimbot » → **Connecter** → choisissez l'appareil.
4. Le modèle est lu à la connexion, et la largeur de tête réellement rapportée
   corrige le profil si elle en diffère.

### Imprimer

- **Densité** : 1 à 3 sur D110, 1 à 5 sur M2. 2 est un bon point de départ ; une
  impression pâle se corrige en montant d'un cran.
- **Copies** : 1 à 20.
- **Inclure le titre** : ajoute le titre de la page au-dessus de l'URL. La ligne
  est réservée dans la hauteur, rien n'est rogné.

L'impression refuse un bitmap plus large que la tête plutôt que de le laisser
rogner en silence.

## Exporter sans Niimbot

### Dossier d'images (onglet « Images à imprimer »)

Le chemin le plus court vers n'importe quelle étiqueteuse. Choisissez :

- **Format d'étiquette** — Niimbot D110 / M2, Brother QL 62 mm, Dymo LabelWriter
  54 mm, Zebra 2 pouces, génériques 50 × 30 et 70 × 40 mm, planche A4 3 × 8 ;
- **Texte imprimé** — titre + URL, URL seule, titre seul, domaine seul, ou rien ;
- **Marge**, **taille du texte**, **traits de coupe**.

Le curseur **Largeur du QR** n'est pas libre : ses bornes sont calculées pour la
disposition choisie. En dessous, un module imprimé ne serait plus lisible (0,4 mm
sur papier, 2 pixels sur une tête thermique) ; au-dessus, le QR chasserait le
texte hors de l'étiquette. La ligne sous le curseur indique la taille obtenue, la
taille réelle d'un module, l'intervalle permis et le nombre de lignes de texte
disponibles. Si une URL est trop dense pour le format — un lien long sur une
étiquette de 12 mm — le message nomme le lien fautif : raccourcissez-le, ou prenez
une étiquette plus grande.

L'aperçu se met à jour à chaque changement. « Exporter les images (ZIP) »
produit une archive autonome :

```
etiquettes/1-un-article.png     un PNG par lien, à la résolution du format
liens.csv                       la correspondance URL ↔ image
planche.html                    à ouvrir dans un navigateur, puis Imprimer
export.json                     les réglages retenus, et l'URL d'origine
```

Ouvrez `planche.html` et imprimez : c'est le chemin le plus direct vers le
papier, sans pilote ni application de fabricant.

### Tableur `.xlsx` avec les QR codes intégrés

Le bouton **« Tableur + QR »** produit un vrai classeur où chaque ligne porte son
QR code **et** son URL cliquable. Un CSV ne peut pas transporter d'image : c'est
tout l'intérêt de cet export.

Quand un lien est raccourci, le classeur suit la cible imprimée et ajoute l'URL
d'origine en fin de tableau.

### CSV, Markdown, archive JSON

- **CSV** (`;`, BOM UTF-8, conforme RFC 4180) — l'URL d'origine en colonne
  principale, le raccourci dans une colonne « URL courte » s'il existe ;
- **Markdown** — tableau ou liste à puces, avec titres cliquables ;
- **Archive JSON** — tout le modèle, réimportable via « Importer ».

## Dépannage

**Un bandeau rouge parle de feuille de style obsolète.** Le navigateur a gardé
l'ancien `style.css` : l'aperçu ne reflète alors pas ce qui sera imprimé.
Rechargez l'extension (↻ dans `brave://extensions`) puis rouvrez la page. Le
bandeau n'apparaît que dans ce cas précis.

**La planche est décalée.** Vérifiez d'abord que l'impression est à 100 %
(« taille réelle »), puis réglez les décalages horizontaux et verticaux. Un
décalage qui augmente de rangée en rangée signale un mauvais pas, pas une
mauvaise marge : choisissez la référence exacte plutôt que de compenser.

**Le QR est illisible.** La ligne sous le curseur donne les millimètres par
module et le minimum du support. Si l'URL est trop dense pour l'étiquette, le
curseur ne peut pas la rendre imprimable : raccourcissez l'URL (le raccourcisseur
est fait pour ça), réduisez le texte imprimé, ou prenez une étiquette plus large.
Rappel : 0,4 mm par module sur papier, 2 pixels par module sur une tête thermique.

**« Web Bluetooth API globally disabled ».** Le drapeau de Brave est éteint.
Ouvrez `brave://flags/#brave-web-bluetooth-api`, activez **Web Bluetooth API**,
puis **relancez Brave** (un rechargement de page ne suffit pas). L'application
détecte ce cas au démarrage et affiche la marche à suivre sans qu'on ait à
cliquer.

**L'imprimante n'apparaît pas.** Sur Brave, le drapeau Web Bluetooth est la
première chose à vérifier. Éloignez l'imprimante des autres appareils Bluetooth,
et réveillez-la avant de cliquer « Connecter ».

**L'impression est pâle.** Montez la densité d'un cran. La tête thermique peut
aussi être encrassée : nettoyez-la avec un coton-tige imbibé d'alcool isopropylique,
imprimante éteinte.

**Une étiquette sort pivotée de 90°.** Le profil D110 porte un booléen
`transposed` fondé sur la convention des implémentations de référence, jamais
vérifié sur du matériel réel. Signalez-le : c'est ce booléen qu'il faut basculer.

## Limites assumées

- **L'impression Niimbot n'a pas été validée sur du matériel physique.** Le
  protocole est implémenté d'après la spécification et vérifié octet à octet en
  test, mais aucune étiquette n'est sortie d'une vraie D110.
- **Safari** n'implémente pas Web Bluetooth. L'extension Safari fonctionne pour
  la collecte, pas pour l'impression directe : utilisez le dossier d'images.
- **Avery et Niimbot sont des marques de leurs propriétaires respectifs.** Les
  cotes reproduites sont celles publiées pour ces références ; ce projet n'est ni
  affilié ni approuvé par ces fabricants.
- **Le raccourcissement dépend d'un tiers.** TinyURL, is.gd, v.gd et spoo.me sont
  des services externes : s'ils ferment, un lien déjà imprimé cesse de
  fonctionner. L'URL d'origine reste toujours dans votre collection et dans vos
  exports.
