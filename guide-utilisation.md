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

**Ouvrir un lien collecté.** Le titre et l'URL de chaque ligne sont des
hyperliens : ils s'ouvrent dans un nouvel onglet, depuis l'application comme
depuis la fenêtre de l'extension.

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

**Choisir le nombre de colonnes, ou remplir la feuille.** Le sélecteur
« Réglage » propose deux approches :

- **Cotes de la disposition** — les cotes publiées de la référence choisie font
  foi. C'est le mode à utiliser sur une planche commerciale.
- **Remplir la feuille** — vous choisissez **colonnes**, **rangées**, une
  **marge globale** (appliquée aux quatre bords) et un **écart** entre
  étiquettes ; la taille des étiquettes est recalculée pour occuper exactement
  la place restante. La ligne d'information sous les réglages affiche la taille
  obtenue : `4 × 6 = 24 étiquettes par page de 48,5 × 46,2 mm`.

Passer en mode « remplir » reprend la grille de la disposition affichée : on
ajuste un point de départ, on ne repart pas de zéro. Si la demande est
impossible — trop de colonnes pour la marge choisie — la disposition précédente
est conservée et le message dit quoi corriger.

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

1. **Brave** : activez Web Bluetooth dans `brave://flags#brave-web-bluetooth-api`,
   puis redémarrez le navigateur. Chrome et Edge n'ont pas cette contrainte.
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

**Le QR est illisible.** La légende sous l'aperçu donne les pixels par module.
Sous 2, raccourcissez l'URL (le raccourcisseur est fait pour ça), réduisez le
texte imprimé, ou prenez une étiquette plus large.

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
