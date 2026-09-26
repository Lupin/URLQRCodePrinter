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
| Clic droit, entrée « Ajouter cette page à URLQRCodePrinter » | la page où vous avez cliqué, même si le clic est tombé sur un lien |
| Clic droit, entrée « Ajouter ce lien à URLQRCodePrinter » | le lien visé |
| Clic droit sur un texte sélectionné, entrée « Ajouter « … » » | la sélection si c'est une URL, sinon la page, la sélection devenant une note |
| Bouton de la barre d'outils | enregistre l'onglet courant, avec son titre modifiable avant l'ajout |
| Champ « Ajouter » | saisie manuelle |
| Bouton « Importer » | relit une archive JSON exportée précédemment |

Chaque entrée fait exactement ce qu'elle annonce. La version précédente donnait
la priorité au lien visé quel que soit le choix : sur l'accueil de YouTube ou
d'une chaîne — des grilles de vignettes — « Ajouter cette page » enregistrait la
vidéo, et la page demandée n'arrivait jamais.

**Nommer la collection, et la décrire.** Le champ **« Nom de la collection »**
(sous le titre du panneau) donne son titre à l'export Markdown, à la planche HTML
de l'archive d'images, et son nom aux fichiers exportés —
`Veille-du-vendredi-20260915-1741.md` plutôt que `liens-qr-….md`.

Le champ **« Note de la collection (facultative) »**, juste en dessous, décrit
l'ensemble — à quoi il sert, d'où il vient. Ce n'est pas la note d'un lien : elle
appartient à la collection, et se retrouve donc là où la collection est nommée :

| Sortie | Où la note apparaît |
|---|---|
| Markdown | en citation sous le titre, et dans l'en-tête du fichier |
| Archive JSON | dans un objet `collection`, à côté du nom |
| Planche d'étiquettes, en-tête de page | sous le nom, en second, si la case est cochée |
| Tableau, en-tête de page | sous le nom, en second, si la case est cochée |
| Dossier de la planche (ZIP) | clé `note` du manifeste |

Le **CSV** ne la porte pas : il n'est fait que de lignes de liens, et y glisser la
note la répéterait sur chacune. Ce n'est pas un oubli — la note décrit l'ensemble,
elle n'a pas de ligne où se mettre.

**Titre, tags et note.** Le bouton **✎** de chaque ligne ouvre les trois champs
qui partent dans les exports :

- **Titre** — le titre de la page est repris automatiquement à la capture, mais
  un lien ajouté à la main n'en a pas : c'est ici qu'on le donne ;
- **Tags** — séparés par des virgules, dédoublonnés et mis en forme
  automatiquement (`veille, travail, veille` → `veille` et `travail`). Les puces
  affichées sous la ligne filtrent la collection d'un clic ;
- **Note** — texte libre, visible sous la ligne et repris dans le tableau
  imprimé si vous cochez « Afficher les notes ».

**Enregistrer** et **Annuler** referment le formulaire, et les raccourcis
restent : Entrée enregistre, Échap annule. Ces trois champs apparaissent dans le
CSV, le Markdown et le classeur — et seulement s'ils ont du contenu, pour ne pas
ajouter de colonnes vides. Les tags ne s'impriment pas sur les étiquettes : ils
classent la collection.

Les URL sont normalisées à l'entrée : `https://` ajouté si absent, fragment
retiré, paramètres de campagne (`utm_*`, `fbclid`, `gclid`…) supprimés — ils
allongent le QR Code sans rien apporter au papier. Un doublon n'est pas ajouté deux
fois ; l'application vous le dit au lieu de rester silencieuse.

**Dater les étiquettes.** Le sélecteur « Date sous le QR Code » imprime la date
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
- les colonnes **Domaine**, **N°**, **Image** et **QR Code** sont ignorées : elles
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

Le bloc « Raccourcir les liens » se trouve sous la barre de recherche. Le champ
« Service » ne sert qu'à choisir **qui** raccourcit : pour obtenir un lien plus
court, le bouton « Raccourcir » suffit, sans rien régler.

1. Laissez le service sur **TinyURL — recommandé**, le choix proposé d'emblée.
   Les autres disent en clair ce qu'ils changent — *is.gd — sans statistiques*,
   *v.gd — avertissement avant redirection*, *spoo.me — statistiques de clics*.
   Aucun ne demande de clé d'API ; on peut en changer plus tard, le prochain
   raccourcissement repartira du service retenu.
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
moins de modules, donc un QR Code plus lisible et imprimable plus petit.

Ensuite, le sélecteur **« Le QR Code pointe vers »** (colonne de droite, groupe
« Ce qu'on imprime ») décide ce qui part à l'impression : l'URL collectée, ou le
raccourci. Il vaut pour toutes les sorties imprimées — planche, tableau, images
**et étiquette Niimbot**, dont le QR Code comme le texte suivent ce choix.

Ce réglage est un défaut pour toute la collection, et un lien peut le
contredire : dès qu'un lien a un raccourci, sa ligne affiche une case
**« Encoder le lien raccourci »**, qui tranche pour ce lien seul. La planche se
met en page au moment de l'impression, le choix y est donc respecté sans toucher
aux autres lignes — une étiquette peut porter le raccourci pendant que les
autres gardent l'URL d'origine. Décocher la case rend le lien au réglage de la
collection ; rien n'est jamais écrit dans l'URL enregistrée.

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

> **L'aperçu est à l'échelle de la fenêtre**, pas à 100 % — sauf quand la place
> le permet : il atteint alors la taille réelle, et ne la dépasse jamais. C'est la
> *disposition* qu'il faut y vérifier. Pour juger du rendu réel, imprimez sur
> papier ordinaire — ou regardez l'onglet « Images à
> imprimer », qui affiche une étiquette en grand.

**Choisir les colonnes du tableau.** Dans l'onglet « Tableau », le groupe
**Tableau imprimé** permet de cocher une à une les colonnes : N°, QR Code, URL, Titre,
Tags, Note, Date. La date a sa propre case, avec ou sans l'heure : chaque onglet
a la sienne, un réglage unique obligerait à le changer en passant de l'un à
l'autre.

Deux d'entre elles ne sont proposées que si elles ont du contenu : une colonne
« Tags » ou « Note » vide sur toute une page n'apprend rien. Elles s'activent
depuis la liste, avec le bouton **✎** de chaque ligne.

**Masquer la grille.** La case **« Grille et bordures »** retire les traits et le
fond gris de l'en-tête : le tableau se lit alors comme une liste, et s'allège à
l'impression. Les lignes gardent un peu plus d'air, seul repère qui reste pour
suivre une ligne des yeux.

**Choisir le nombre de colonnes, ou remplir la feuille.** Le sélecteur
**Régler la taille du texte de la planche.** Le champ **Taille du texte (pt)**
donne la hauteur de la police imprimée sous chaque QR Code. Il est prérempli d'après
la hauteur de l'étiquette — 7 pt sur une étiquette de 25 mm, 9,5 pt sur une A4
3 × 8, 14 pt sur une 60 mm — car 7 pt partout laissait la place d'une A4
inutilisée, sous un QR Code qui occupait tout. Changer de disposition le réécrit,
comme les six valeurs de la grille.

Montez-le à la main si vous voulez plus grand : la borne haute du curseur
**Largeur du QR Code** descend d'elle-même pour laisser la place au texte, et rien
n'est tronqué. La ligne sous le curseur dit combien de lignes de texte la
disposition retenue permet encore.

**Une grille impossible ne bloque plus.** Si vous demandez plus d'étiquettes que
la feuille n'en accepte, les deux champs sont ramenés à ce qui tient dès que vous
les quittez, et la phrase sous les champs dit ce qui a été réduit et pourquoi :
« 60 rangées ne tiennent pas : 54 au maximum sur cette feuille. » Les champs,
l'aperçu et le papier montrent alors la même grille — c'était le défaut
précédent : le champ gardait le nombre tapé, l'aperçu gardait la disposition
d'avant, et rien ne disait laquelle serait imprimée. La borne haute des deux
champs suit d'ailleurs celles de la feuille choisie : une A4 accepte 26 colonnes
à la taille minimale d'étiquette, alors que le champ s'arrêtait à 12.

**Ce qui s'imprime sous le QR Code, case par case.** Le groupe **« Sous chaque
QR Code »** commande le texte de chaque étiquette de la planche :

| Titre | URL | Ce qui s'imprime |
|---|---|---|
| coché | décoché | le titre ; l'URL prend sa place s'il n'y en a pas |
| coché | coché | « titre URL » |
| décoché | coché | l'URL seule |
| décoché | décoché | rien : le QR Code occupe toute l'étiquette |

Le titre était auparavant imprimé **dès qu'il existait** : ni l'URL seule, ni
l'absence de texte n'étaient atteignables. Décocher les deux laisse d'ailleurs
plus de place au QR Code — la borne haute du curseur **Largeur du QR Code** monte
d'environ 81 % à 97 % sur une étiquette de 63,5 mm.

**Tracer une bordure de découpe.** La case du groupe **Découpe** encadre chaque
étiquette d'un trait de 0,2 mm — le même que celui du tableau imprimé. Utile sur
du papier ordinaire, pour découper droit ; sur une planche autocollante
prédécoupée, la bordure s'imprime à l'intérieur de chaque étiquette.

**Un en-tête de page.** Le groupe **En-tête de page** imprime le nom de la
collection, la date d'impression et la note de collection — chacune sur sa case —
en haut de chaque page : le même en-tête que celui du tableau. La note est cochée
d'**avance**, parce qu'elle s'imprimait déjà sans qu'on puisse l'enlever ; la
décocher la retire de toutes les pages. Tant qu'il n'y a pas de note, sa case est
inerte et l'infobulle renvoie au champ du panneau de gauche. Il se place **dans la marge du haut**, sans
déplacer les étiquettes : leurs positions sont calculées, et une case à cocher ne
doit pas changer leur taille. Il lui faut donc **9 mm de marge en haut** ; en
dessous, il n'est pas dessiné et la phrase sous la case dit exactement ce qui
manque : « L'en-tête a besoin de 9 mm de marge en haut, et la marge actuelle est
de 3 mm. »

**Une seule présentation, six valeurs.** Le sélecteur **Disposition** ne fait
que *préremplir* les six champs qui suivent ; vous pouvez ensuite les ajuster
librement, et la taille des étiquettes est recalculée :

**Réordonner, ou trier.** Deux choses différentes, au même endroit.

Le bouton **« Réorganiser »**, au-dessus de la liste, ouvre le rangement. Chaque
ligne montre alors, **à sa gauche**, une poignée et deux flèches **▲ ▼** : on
saisit la poignée pour faire glisser la ligne où l'on veut, ou l'on clique les
flèches — utile au clavier, et nécessaire pour qui ne peut pas glisser. Le rang
affiché à gauche du titre — celui du tableau imprimé — suit, et l'ordre est
mémorisé : on le retrouve à la réouverture. **Échap** referme le rangement, comme
un second clic sur le bouton.

Ces commandes n'existent **qu'en mode rangement, et qu'en ordre manuel** : au
repos, la liste ne porte que ses liens. Sous un tri, le bouton est inactif et
l'indice au-dessus de la liste dit pourquoi.

Le sélecteur **« Trier »**, à côté de la recherche, propose neuf tris : l'ordre
manuel, le titre, le domaine et le tag — chacun ascendant ou descendant — et la
date dans les deux sens. Un lien sans tag se range **après** ceux qui en ont un,
et non en tête comme le ferait une chaîne vide.

> **Le tri est une vue, et il renumérote.** Rien n'est écrit : revenir à « Ordre
> manuel » retrouve la collection telle qu'on l'avait laissée. Mais le tri change
> l'ordre affiché, donc le **« N° » du tableau imprimé** le suit — ce numéro sert
> à retrouver la ligne dans la liste qu'on a sous les yeux, et un numéro qui
> désignerait une autre ligne ne servirait à rien. Le rangement disparaît
> pendant un tri : un déplacement y serait annulé au rendu suivant, et
> l'utilisateur croirait à une panne.

Les tris de texte ignorent la casse, les accents et le rang des nombres :
« article 2 » précède « article 10 ». Et deux liens de même clé — même titre, même
domaine, même tag — gardent leur ordre manuel entre eux, sans quoi ils
changeraient de place à chaque rendu.

**Sélectionner ce qu'on imprime.** Le groupe **Sélection** (« Tout cocher » /
« Tout décocher ») agit sur les cases à gauche de chaque ligne, pas sur la
recherche. La phrase sous les boutons dit toujours ce qui partira à l'impression,
et le bouton lui-même l'annonce : « Imprimer les 31 liens » ou
« Imprimer la sélection (3) ».

> **Aucun lien coché signifie « toute la collection ».** C'est la règle la moins
> devinable de l'application : « Tout décocher » n'imprime pas *rien*, il imprime
> *tout*. Elle est écrite sous les boutons pour cette raison.

Les réglages sont rangés en **deux groupes**, et l'ordre suit le calcul : la
taille des étiquettes découle de la grille et des marges, donc **La page** vient
d'abord, et **L'étiquette** ensuite.

**Groupe « La page »** — ce qui décide de la feuille : la disposition, la
grille, les marges, les écarts, les décalages, et l'en-tête de page.

**Groupe « L'étiquette »** — ce qui décide d'une étiquette : la largeur du QR
Code, la taille du texte, ce qui s'imprime sous lui, et la bordure de découpe.

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

**Exporter la planche en dossier.** Le bouton **« Exporter la planche (ZIP) »**,
à côté d'« Imprimer », produit trois fichiers :

| Fichier | Ce qu'il contient |
|---|---|
| `planche.html` | la planche elle-même, autonome et imprimable — ouvrez-la, imprimez-la, ou gardez-la |
| `planche.json` | les réglages qui l'ont produite : grille, cotes des étiquettes, marges, options cochées, et la place de chaque lien |
| `liens.csv` | la correspondance entre chaque lien et son étiquette : page, colonne, rangée |

La page exportée **est** celle de l'aperçu : ce n'est pas une seconde mise en
page qui lui ressemble, mais le même document avec la même feuille de style. Ce
que vous imprimez depuis le fichier est donc, au pixel près, ce que vous aviez
sous les yeux.

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

Un tableau dense — QR Code, titre, domaine, notes — pour relire ou archiver sur
papier.

- **Taille du QR Code** — un curseur, du plus discret au plus lisible.
- **Orientation de la page** — portrait ou paysage. Un tableau à nombreuses
  colonnes gagne à être couché : les colonnes respirent au lieu d'être serrées.
- **Marges** — haut et bas, gauche et droite, en millimètres. Elles étaient
  fixes : un tableau large se faisait rogner sans recours.
- **En-tête de page** — le nom de la collection s'imprime en tête, avec la date
  d'impression et la note de la collection si vous les demandez. Sur une liasse,
  c'est ce qui dit de quelle collection elle vient.
- **Colonnes** — N°, QR Code, URL, Titre, Tags, Note, Date. Les tags et la note ne
  sont proposés que si la collection en contient.
- **Exporter le tableau (ZIP)** — un dossier autonome : `table.json` (le
  modèle), `qr/*.png` (les QR Codes en images prêtes à l'emploi) et `table.html`
  (le tableau affichable tel quel). La sélection et les colonnes cochées
  s'appliquent, comme à l'impression.

### Étiquette Niimbot

Pour l'impression directe sur une D110, une M2 ou une M3. Voir la section suivante.

### Étiquette (divers)

Un dossier d'images prêtes à imprimer, **sans aucune imprimante**. Voir
« Exporter sans Niimbot ».

## Imprimer sur une Niimbot

### Le format se prévisualise sans imprimante

Le sélecteur **Format d'étiquette** propose :

- **Niimbot D110** — 12 mm utiles, 203 dpi ;
- **Niimbot M2** — 48 mm utiles, 300 dpi (576 px de tête) ;
- **Niimbot M3** — 72 mm utiles, 300 dpi (851 px de tête).

L'aperçu est composé **même sans imprimante connectée** : dimensions, nombre de
modules et lisibilité sont exacts. C'est ce qui permet de juger un rendu, ou de
vérifier qu'une URL tient, avant d'acheter le matériel.

Sous l'aperçu, une légende indique le profil utilisé, le nombre de pixels par
module, **et l'échelle de l'aperçu**. Deux pixels par module est le minimum : en
dessous, une tête thermique fusionne les points.

**L'échelle est annoncée parce qu'elle est un agrandissement.** Une étiquette de
12 mm mesure 45 px sur un écran, et un QR Code y est injugeable : l'aperçu
agrandit donc, jusqu'à **quatre fois la taille réelle**. Un facteur de rendu ne
veut rien dire pour qui lit — quatre fois un rendu de 203 ppp, c'est huit fois et
demi la taille réelle — d'où un multiple calculé puis écrit dans la légende :
« aperçu à 4,0 × la taille réelle (12,0 × 24,6 mm) ».

La case **« Aperçu à la taille réelle »** montre l'étiquette à sa dimension
physique, pour juger de la place qu'elle prendra vraiment. Elle ne change rien à
ce qui sort : c'est un réglage d'aperçu, et il a pour cette raison sa propre
ligne, à part des réglages qui s'impriment.

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

### Choisir son consommable

Le champ **Consommable** propose les formats vendus pour le modèle choisi —
relevés chez le fabricant, pas devinés :

- **D110** (tête 12 mm) — 12 × 22, 12 × 30, 12 × 40, 12 × 75, 12 × 109,
  14 × 25, 14 × 28, 14 × 30, 14 × 40, 14 × 50, 15 × 30, 15 × 50 mm, et le
  rouleau continu ;
- **M2** (tête 48,8 mm) — 25 × 9,5, 36,5 × 9,5, 40 × 20, 40 × 40, 50 × 30,
  50 × 50, 50 × 70, 50 × 80, 30 × 70, 25 × 78, 35,25 × 50 mm, plusieurs ronds
  (20 × 20, 24 × 13, 28 × 14, 28 × 15, 31 × 31, 34 × 17, 50 × 50) et le rouleau
  continu ;
- **M3** (tête 72 mm) — 40 × 20, 50 × 30, 70 × 50, 60 × 100 mm, et le rouleau
  continu 72 mm.

Un rouleau **plus large que la tête** reste sélectionnable : le contenu fait la
largeur de la tête et le reste de l'étiquette demeure blanc. L'application le
signale par « marge non imprimée sur les côtés ». Seuls les rouleaux que la tête
ne peut pas atteindre — les 25 mm sur un D110 — sont écartés.

### Longueur du rouleau

Le profil ne connaît que la **largeur de tête**. Sans la longueur du rouleau, la
composition s'arrête à la fin de son contenu — une URL courte donne une étiquette
de 18 mm — et l'imprimante avance ensuite jusqu'à la découpe suivante : tout ce
qui reste du rouleau sort blanc.

Renseignez **Longueur d'étiquette (mm)** pour que la composition remplisse la
place : le texte grossit (jamais au-delà de la lisibilité) et le contenu se
répartit. Le champ propose les longueurs courantes du modèle choisi, et reste
libre — le catalogue du fabricant n'est pas la réalité de tous les rouleaux. Le
bouton **Libre** revient au rouleau continu, où la hauteur découle du contenu.

**Disposition** décide où va la place restante : *Centré*, *En haut*, ou
*Réparti* (le QR Code en haut, le texte en bas).

### Imprimer

- **Densité** : 1 à 3 sur D110, 1 à 5 sur M2. 2 est un bon point de départ ; une
  impression pâle se corrige en montant d'un cran.
- **Copies** : 1 à 20, pour l'impression d'une seule étiquette.
- **Contenu de l'étiquette** : des cases qui se cumulent — numéro du lien,
  titre, URL, domaine, date de collecte, et l'heure avec la date. Le QR Code encode
  toujours l'URL ; le texte affiché suit ces choix. Le numéro sert à retrouver
  la ligne de la liste quand l'étiquette est trop petite pour porter l'URL.
- **Date et heure** : sur une tête de 12 mm, « 15/09/2026 21:07 » se coupe
  proprement sur deux lignes ; la taille du texte est réduite juste assez pour
  qu'elle entre, jamais sous 1,6 mm — en dessous, elle ne serait plus lisible.
- **Disposition du texte** : *Texte droit, sous le QR Code*, *Texte droit, au-dessus
  du QR Code*, *Texte tourné, se lit de bas en haut*, *Texte tourné, se lit de haut en
  bas*, et *Texte à droite du QR Code* — cette dernière n'apparaît que sur une tête
  assez large pour laisser une vraie colonne. Les deux sens de rotation du texte
  tourné sont équivalents : le texte est centré dans sa bande dans les deux cas.
- **Disposition** : voir plus haut.

L'impression refuse un bitmap plus large que la tête plutôt que de le laisser
rogner en silence.

### Imprimer : un couple, un bouton

**Un seul sélecteur dit ce qu'on imprime**, et **un seul champ dit combien de
fois** — les deux sur la même ligne, suivis d'**un seul bouton**. Il y avait
auparavant deux listes déroulantes et deux compteurs : « Lien à imprimer » et
« Copies » d'un côté, « Quels liens » et « Exemplaires de chacun » de l'autre,
plus deux boutons. Quatre champs répondaient à deux questions, et rien ne disait
lesquels allaient avec quel bouton.

Le sélecteur **« Ce qu'on imprime »** range ses réponses en deux groupes :

- **Un seul lien** — l'un de ceux de la collection, par son numéro et son titre.
  L'aperçu montre celui-là.
- **Plusieurs** — *Toute la collection*, ou *Seulement ceux que je coche* dans la
  liste. L'aperçu montre le premier des étiquettes qui sortiront.

Le champ **Exemplaires** va de 1 à 20, et vaut dans les deux cas : dix liens à
deux exemplaires font vingt étiquettes, et un seul lien à trois exemplaires en
fait trois. C'est ce qui manquait — on ne pouvait pas demander plusieurs
exemplaires d'une étiquette choisie.

Le bouton dit toujours ce qu'il fera : « Imprimer 1 étiquette »,
« Imprimer 20 étiquettes (10 liens × 2) ». Pendant une série il devient
**Arrêter** : une série lancée par erreur s'interrompt après l'étiquette en
cours, sans couper l'imprimante. Une étiquette qui échoue n'interrompt pas la
série ; le bilan final dit combien sont sorties et pourquoi les autres ont raté.

> **Aucun lien coché.** L'option correspondante est alors grisée dans le
> sélecteur, et la phrase sous le bouton dit quoi faire, plutôt que de laisser un
> bouton inerte sans explication.

## Exporter sans Niimbot

### Dossier des étiquettes composées (onglet « Étiquette Niimbot »)

Le bouton **« Exporter ces étiquettes (ZIP) »**, sous « Imprimer », dépose les
étiquettes **composées pour l'imprimante** — sans qu'aucune imprimante soit
connectée. C'est le même chemin que l'impression et l'aperçu : `composeLabel`
puis `drawLabel`, à la résolution de la tête, avec l'orientation appliquée. Le
dossier contient donc ce qui serait sorti, et non une seconde composition qui
lui ressemble.

| Fichier | Ce qu'il contient |
|---|---|
| `etiquettes/NN-titre.png` | une image par étiquette, à la résolution de la tête (96 px de large sur un D110 à 203 ppp) |
| `etiquettes.json` | les réglages de l'onglet : profil, consommable, densité, orientation, disposition, taille du texte, contenu coché |
| `liens.csv` | la correspondance entre chaque lien et son image, avec les cotes en millimètres |

Le sélecteur **« Ce qu'on imprime »** décide de la portée : le lien affiché, toute
la collection, ou la sélection cochée. Le champ **Exemplaires** ne s'y applique
pas — un dossier de dix étiquettes identiques n'apprendrait rien.

> **Pourquoi ce dossier en plus de celui de l'onglet « Étiquette (divers) » ?**
> Les deux ne composent pas de la même façon. « Étiquette (divers) » raisonne en
> **format** — une largeur et une hauteur en millimètres, un mode de texte — et
> sert à n'importe quelle étiqueteuse, y compris du papier ordinaire. L'onglet
> Niimbot raisonne en **tête d'impression** : un profil de machine, un rouleau du
> catalogue, une densité, une orientation. C'est cette composition-là que ce
> bouton exporte, et elle n'était atteignable qu'avec le matériel branché.

### Dossier d'images (onglet « Étiquette (divers) »)

Le chemin le plus court vers n'importe quelle étiqueteuse. Choisissez :

- **Format d'étiquette** — Niimbot D110 / M2 / M3 ; Brother QL DK-11201,
  DK-11202, DK-11208, DK-11209, DK-11218, DK-11219, DK-22205, DK-22210 ;
  Dymo LabelWriter 54 × 32 et 54 × 101 mm ; Zebra 2 et 4 × 6 pouces ; génériques
  50 × 30 et 70 × 40 mm ; planche A4 3 × 8 ;
- **Texte imprimé** — titre + URL, URL seule, titre seul, domaine seul, ou rien ;
- **Marge**, **taille du texte**, **traits de coupe** ;
- **Sous le QR Code** — le titre, puis la date de collecte, avec l'heure si vous la
  demandez. La case « Titre » ajoute le titre même quand « Texte imprimé » ne le
  porte pas, et sans le doubler s'il y figure déjà. Ces cases sont propres à cet
  onglet : une date cochée pour la planche ne s'imprime pas ici, et
  réciproquement.

Le curseur **Largeur du QR Code** n'est pas libre : ses bornes sont calculées pour la
disposition choisie. En dessous, un module imprimé ne serait plus lisible (0,4 mm
sur papier, 2 pixels sur une tête thermique) ; au-dessus, le QR Code chasserait le
texte hors de l'étiquette. La ligne sous le curseur indique la taille obtenue, la
taille réelle d'un module, l'intervalle permis et le nombre de lignes de texte
disponibles. Si une URL est trop dense pour le format — un lien long sur une
étiquette de 12 mm — le message nomme le lien fautif : raccourcissez-le, ou prenez
une étiquette plus grande.

L'aperçu se met à jour à chaque changement. Le bouton d'export dit la portée et
le nombre — « Exporter les 12 images (ZIP) », ou « Exporter la sélection (3) »
quand seuls quelques liens sont cochés — puis produit une archive autonome :

```
etiquettes/1-un-article.png     un PNG par lien, à la résolution du format
liens.csv                       la correspondance URL ↔ image
planche.html                    à ouvrir dans un navigateur, puis Imprimer
export.json                     les réglages retenus, et l'URL d'origine
```

Ouvrez `planche.html` et imprimez : c'est le chemin le plus direct vers le
papier, sans pilote ni application de fabricant.

### Tableur `.xlsx` avec les QR Codes intégrés

Le bouton **« Tableur + QR Code »** produit un vrai classeur où chaque ligne porte son
QR Code **et** son URL cliquable. Un CSV ne peut pas transporter d'image : c'est
tout l'intérêt de cet export.

Quand un lien est raccourci, le classeur suit la cible imprimée et ajoute l'URL
d'origine en fin de tableau.

### Dossier du tableau (ZIP)

Le bouton **« Exporter le tableau (ZIP) »** se trouve juste avant l'aperçu,
visible dans le seul onglet Tableau, à côté d'« Imprimer ». Il produit un dossier
autonome qui reflète la sélection et les colonnes cochées :

| Fichier | Contenu |
|---|---|
| `table.json` | le modèle : colonnes, lignes, et pour chaque QR Code l'URL encodée, la correction d'erreur et la bordure |
| `qr/<id>.png` | le QR Code de chaque ligne, à une échelle entière — vectorisable sans perte |
| `table.html` | le tableau rendu, à ouvrir dans un navigateur |

C'est le seul export qui suit la mise en forme du tableau : les exports de la
collection (CSV, Markdown, Archive) portent les données, pas la mise en page. Le
PNG est volontairement préféré au SVG : il s'ouvre partout, de la page web au
traitement de texte, sans exiger que le destinataire sache rendre du vecteur.

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

**Le QR Code est illisible.** La ligne sous le curseur donne les millimètres par
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
`transposed` fondé sur la convention des implémentations de référence ; il n'a pas
été relevé explicitement lors de l'essai sur une D110 réelle. Signalez-le : c'est
ce booléen qu'il faut basculer.

## Limites assumées

- **L'impression Niimbot a été validée sur une Niimbot D110 réelle.** Une
  étiquette complète est sortie, et l'imprimante s'identifie correctement à la
  connexion. Le rendu reste sensible à la densité et à la taille de texte
  choisies. Les autres modèles du catalogue (M2, M3) n'ont pas été éprouvés sur
  matériel.
- **Safari** n'implémente pas Web Bluetooth. L'extension Safari fonctionne pour
  la collecte, pas pour l'impression directe : utilisez le dossier d'images.
- **Avery et Niimbot sont des marques de leurs propriétaires respectifs.** Les
  cotes reproduites sont celles publiées pour ces références ; ce projet n'est ni
  affilié ni approuvé par ces fabricants.
- **Le raccourcissement dépend d'un tiers.** TinyURL, is.gd, v.gd et spoo.me sont
  des services externes : s'ils ferment, un lien déjà imprimé cesse de
  fonctionner. L'URL d'origine reste toujours dans votre collection et dans vos
  exports.
