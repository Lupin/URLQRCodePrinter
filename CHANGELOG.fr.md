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
