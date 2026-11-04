# Journal des versions

Toutes les modifications notables de ce projet sont consignées ici. Le format
suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le projet suit
le [versionnage sémantique](https://semver.org/lang/fr/).

**La note de version déposée sur le Chrome Web Store est lue dans ce fichier.**
`scripts/preparer-soumission.mjs` reprend l'entrée de la version empaquetée et la
met en texte brut, dans les deux langues — une version sans entrée ici part donc
sans note. Le pendant anglais est [`CHANGELOG.md`](CHANGELOG.md), et les deux
fichiers portent les mêmes versions.

Deux conventions, pour que le fichier reste lisible par une machine :

- un titre `## [version]` par version livrée, la plus récente en premier, avec la
  date de son dépôt (`## [0.2.0] - 2026-09-30`) ;
- les catégories de Keep a Changelog — `Ajouté`, `Modifié`, `Corrigé`, `Retiré`,
  `Sécurité` — et une section finale « Ce qui ne change pas », par laquelle se
  termine la note déposée sur le magasin.

La plus ancienne version ne porte pas de date : elle n'a pas été consignée à
l'époque, et elle n'est pas inventée ici.

## [Non publié]

## [0.3.1] - 2026-11-04

Cette mise à jour ne change pas ce que fait le produit : elle aligne ce qu'il
dit sur ce qu'il fait, et lui donne une marque unique. Le résumé qui accompagne le paquet — celui que le
navigateur affiche et que la fiche du magasin reprend — ne nomme plus de marque
d'imprimante, et il dit la même chose que le résumé de la fiche : aucun compte,
aucun serveur de l'éditeur. Il ne promet plus que « tout reste sur l'appareil »,
ce qui était faux dès qu'un lien est raccourci : l'adresse part alors chez le
service choisi, et la fiche le dit déjà.

### Modifié

- **Le résumé du produit est le même partout** : sur la fiche du magasin, dans la
  description du paquet, dans celle du manifeste, dans la meta description des
  deux pages du site et à l'ouverture des deux README. Une seule phrase, sans
  marque d'imprimante, et sous la limite de 132 caractères du magasin.
- La description du manifeste ne cite plus de modèle d'imprimante. La
  compatibilité se lit dans la fiche détaillée et dans le guide, où elle est
  vraie ; une description de produit qui nomme un modèle vieillit au premier
  changement de gamme.
- **La promesse absolue disparaît** — « tout reste sur votre appareil » — au
  profit de ce qui se vérifie : aucun compte, aucun serveur de l'éditeur. Le
  raccourcissement, facultatif, envoie l'adresse au service choisi, et la fiche
  le dit.

- **Nouvelle icône**, choisie parmi huit propositions : une étiquette QR Code
  sortant d'une imprimante, sur une tuile de l'orange de la marque. Une seule
  source la produit pour tous les usages — extension, application Safari et
  macOS/iOS (en bord perdu, pour que le système applique son propre masque),
  site vitrine et favicon de l'application. Le dessin occupe 96 × 96 au centre
  d'un carré de 128, avec 16 pixels transparents de chaque côté : la
  recommandation du magasin pour l'icône de la fiche est suivie. L'en-tête de
  l'application porte désormais cette icône, et non plus un tracé distinct à
  tenir d'accord.

### Ce qui ne change pas

Aucune fonctionnalité, aucun réglage, aucune permission. Rien de nouveau n'est
lu, stocké ni envoyé.

## [0.3.0] - 2026-11-03

Cette mise à jour rend l'adresse d'un lien corrigeable depuis la liste, fluidifie
la gestion des collections — le nom se valide, « Nouvelle » reprend le nom saisi,
et la suppression demande confirmation — et fait cesser deux silences : une
application qui gelait tant qu'un formulaire restait ouvert, et un refus
d'adresse qui s'affichait encodé.

### Ajouté

- **L'adresse d'un lien s'édite dans la liste**, avec le bouton **✎** de sa ligne.
  Le formulaire ouvre désormais quatre champs — lien, titre, tags, note — au lieu
  de trois, et l'adresse vient en tête : c'est elle que le QR Code encode.
  Corriger une URL ne demande plus de supprimer le lien pour le rajouter, en
  perdant son rang, ses tags et sa note. On édite une adresse pour ajouter un
  horodatage (`?t=3139`, ou `#t=1m30s`), retirer des paramètres de suivi, réparer
  une faute de frappe, ou suivre une page qui a déménagé.

### Modifié

- Une adresse **éditée** garde son fragment, alors qu'une adresse **capturée** le
  perd comme avant : `#t=1m30s` démarre la lecture d'une vidéo à 1 min 30, et
  l'effacer viderait la correction de son sens. Les paramètres de campagne
  (`utm_*`, `fbclid`, `gclid`…) restent retirés dans les deux cas : ils ne
  changent pas la destination, seulement la longueur du QR Code.
- Changer l'adresse d'un lien **retire son raccourci**, qui pointe vers
  l'ancienne chez un tiers, et le message le dit : sans cela, le QR Code imprimé
  mènerait ailleurs que ce que la ligne affiche.
- **Le nom d'une collection s'enregistre sur validation explicite**, et non plus
  à la frappe : la touche **Entrée** dans le champ, ou le bouton
  **« Enregistrer »** placé à côté — inactif tant que le nom n'a pas changé. La
  touche **Échap** abandonne la saisie en attente et rétablit le nom enregistré.
  Un nom en attente est annoncé sous le sélecteur, et changer de collection avec
  ce sélecteur l'abandonne : il n'est pas enregistré, et le message le dit.
- **« Nouvelle » reprend le nom saisi** : quand le champ porte un nom en attente,
  différent de celui de la collection affichée, la collection créée prend ce nom
  au lieu de « Nouvelle collection » — la collection affichée garde le sien. Sans
  nom en attente, la proposition automatique reste celle d'avant : « Nouvelle
  collection », « Nouvelle collection 2 »…
- **« Nouvelle » passe à côté d'« Enregistrer »**, sous le champ du nom : la
  création et la validation portent sur le même nom, et la ligne du sélecteur ne
  garde que « Supprimer ».
- **La suppression d'une collection demande confirmation dans un panneau** placé
  sous le sélecteur : il nomme la collection et annonce combien de liens seront
  perdus. « Annuler » reçoit le focus ; le double clic qui armait le bouton
  disparaît.

### Corrigé

- **Le retour de l'icône tient maintenant son terme.** Le « + » d'un ajout — et
  de même « ✎ » et « = » — était écrasé par une relecture du compteur partie
  avant lui : le signe ne restait visible qu'une seconde au lieu des 2,5 s
  annoncées, et le relevé navigateur le constatait depuis la 0.2.0.
- **L'application ne gèle plus tant qu'un éditeur de lien est ouvert.** Elle
  retenait alors sa remise à jour jusqu'à la fermeture du formulaire, pour ne pas
  emporter la saisie — et affichait pendant ce temps un nombre de liens périmé,
  « 4 liens » sous une icône qui en annonçait 7, sans rien dire. La saisie est
  maintenant relevée avant le redessin et rendue au formulaire rouvert : la liste
  suit le stockage, et rien de ce qui était écrit ne se perd.
- Le refus d'un nom d'hôte le réécrit tel qu'il a été tapé — « pas une url » et
  non « pas%20une%20url ». Le message demandait de décoder mentalement l'adresse
  au moment précis où l'on cherche pourquoi elle ne passe pas.

### Ce qui ne change pas

Rien de nouveau n'est lu, stocké ni envoyé. Aucune permission n'a été ajoutée.

## [0.2.1] - 2026-09-30

Cette mise à jour fait dire la même chose au compteur de l'icône et à la
collection : la vider met les deux à jour, quelle que soit la page d'où le bouton
est utilisé.

### Corrigé

- Vider la collection depuis l'application ne laisse plus le nombre d'avant sur
  l'icône de la barre d'outils, et la vider depuis la fenêtre de l'extension ne
  laisse plus l'application afficher des liens qui n'existent plus. L'icône,
  l'application et la fenêtre suivent le même stockage : chacune relit ce qu'elle
  affiche dès qu'une autre écrit.

### Ce qui ne change pas

Rien de nouveau n'est lu, stocké ni envoyé. Aucune permission n'a été ajoutée.

## [0.2.0] - 2026-09-30

Cette mise à jour écrit « QR Code » partout où le code est nommé : la fiche et
l'interface disent enfin la même chose.

### Ajouté

- L'import demande où ranger ce qu'il vient de relire : fusionner avec la
  collection affichée, la remplacer (nom et note compris), ou ranger les liens
  dans une collection nouvelle. Le nom et la note de collection d'une archive
  sont relus, et un nom déjà pris est suffixé plutôt que refusé.
- Une note de collection, imprimée dans l'en-tête de page à côté du nom.
- Une numérotation qui peut partir du numéro choisi.
- Neuf ordres de tri, et le rangement manuel de la collection.
- La cible du QR Code se choisit désormais lien par lien, et plus seulement
  globalement.
- Un en-tête de page sur la planche d'étiquettes, comme le tableau en avait un.
- Une taille de texte et une taille de titre, réglées séparément.
- Les dispositions en paysage, et toutes les légendes d'étiquette traduites.

### Modifié

- L'A4 3 × 4 (63,5 × 69,1 mm) devient la planche par défaut.

### Corrigé

- Le nom vidé d'une collection est enregistré vide, et la collection s'affiche et
  s'exporte sous le libellé intégré — au lieu de garder l'ancien nom en silence.
- Un clic droit sur un résultat de recherche enregistre la page visée, et non la
  redirection du moteur : la liste affiche « fr.wikipedia.org » là où elle
  affichait « google.com », et le QR Code est plus court.
- La mise en page automatique mesure le texte à la largeur de chaque grille
  candidate : elle n'annonce plus une grille « calculée pour ce contenu » qui
  coupe ensuite 45 lignes, et quand une page ne peut pas porter toutes les
  étiquettes lisiblement, elle pagine au lieu de les tasser.
- Sur une étiquette tournée, le titre n'est plus coupé à la largeur : la bande le
  redécoupe sur sa longueur, et un titre long revient sur une rangée au lieu de
  deux.
- Sur une longueur imposée, une étiquette centrée garde son texte à côté du QR
  Code au lieu de le pousser au bord bas.
- Le tableau imprimé passe sur plusieurs pages sans couper une ligne.

### Ce qui ne change pas

Rien de nouveau n'est lu, stocké ni transmis. Aucune permission n'a été ajoutée.

## [0.1.0]

Première version publiée.

### Ajouté

- La collecte d'un lien par clic droit, par le bouton de la barre d'outils ou par
  le champ d'ajout.
- Une collection locale de liens, avec recherche, tags et note.
- Les planches d'étiquettes en A4 et en Letter, du papier ordinaire aux planches
  du commerce.
- L'impression directe sur Niimbot D110, M2 et M3.
- Les exports classeur, CSV, Markdown, dossier d'images et archive.
- L'import des archives et des CSV exportés d'ici.
- Le raccourcissement d'URL, en option.

Le détail de cette version est celui que décrit la fiche publiée ; son entrée n'a
pas été écrite à l'époque, et celle-ci n'affirme rien de plus.
