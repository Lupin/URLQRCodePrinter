# Captures d'écran

Les captures déposées ici partent sur la fiche du Chrome Web Store.

> Ce fichier a d'abord existé pour qu'un dossier vide soit versionné, Git ne
> suivant pas les dossiers vides. Le dossier n'est plus vide : cinq captures y
> sont, et l'état réel est décrit plus bas plutôt que supposé.

## Ce qui est en place

Cinq captures, toutes en **1280 × 800**, toutes en RGB sans transparence — le
magasin en accepte cinq au maximum, et la documentation recommande de les
remplir :

```
01-fenetre-popup-fr.jpg              la fenêtre, ouverte sur une page
02-application-fr.png                l'application : collection, mise en forme
03-impression-niimbot-fr.png         l'onglet Niimbot : réglages, commandes, étiquette
04-mention-confidentialite-fr.png    la mention, en attente d'accord
05-collections-fr.png                la gestion des collections : nom validé,
                                     « Nouvelle », et la confirmation de suppression
```

`02`, `03`, `04` et `05` sont produites par `scripts/capture-store-shots.mjs` sur
`contenu-exemple.json` : elles montrent donc la collection d'exemple, avec ses
tags, ses notes et son nom — et non trois fois la même adresse. Elles ont été
**régénérées pour la soumission 0.3.0**, après le déplacement d'« Enregistrer »
et « Nouvelle » sous le nom de collection, la validation explicite du nom et le
panneau de confirmation de suppression : les captures montrent donc l'interface
réellement déposée.

`05` est nouvelle. Sa mise en scène est celle de la 0.3.0, et elle est réelle :
le script **tape** un nom, clique « Enregistrer » (il refuse de continuer si le
bouton est resté inactif), puis ouvre le panneau de suppression de la collection
qui vient d'être renommée. Pour que la scène soit possible, elle ajoute deux
collections à celles du contenu d'exemple — `contenu-fiche.json`, lu par le
script : sans elles, « Supprimer » serait grisé, puisqu'il doit toujours rester
une collection.

Le dossier ne contient **que les captures déclarées**. Les huit captures brutes
du 30 septembre (2870 × 1796, non déclarées) ont été déplacées hors du dossier,
dans `dist/brouillons-captures/` — `dist/` n'est pas versionné. C'est la sortie
que `test/publication.test.js` demandait : au-delà de cinq images, ou hors des
tailles admises, la fiche est refusée.

**Les cinq emplacements sont désormais remplis** : le menu contextuel, qui
occupait l'emplacement libre, n'a pas pu être capturé (le menu est natif), et
c'est la gestion des collections qui le remplace — elle montre un geste que la
fiche ne montrait pas, et qui est le sujet de la 0.3.0.

**`01` est à refaire**, et c'est la seule que rien ici ne peut produire : elle
date d'une interface antérieure — elle montre « Tout effacer », un libellé qui
n'existe plus (le bouton s'appelle « Vider la collection »), une page anglaise et
deux liens sans tags, là où `contenu-exemple.json` en porte douze. Voir « Ce que
le script ne peut pas produire », plus bas.

## Ce que le magasin exige

| | |
|---|---|
| Nombre | **au moins 1**, jusqu'à **5** — la documentation recommande le maximum |
| Dimensions | **1280 × 800** (préféré) ou **640 × 400** |
| Format | PNG ou JPEG |
| Cadrage | **coins carrés, aucun remplissage** (*full bleed*) |

Deux précisions qui évitent de refaire le travail :

- **1280 × 800 est préférable**, mais toutes les captures sont ensuite réduites à
  640 × 400 par le magasin. Une image chargée en texte devient illisible à cette
  réduction : mieux vaut des captures larges et peu denses.
- **Aucun cadre, aucune marge, aucune ombre ajoutée.** Le magasin présente les
  images telles quelles ; une capture déjà encadrée s'afficherait avec une double
  bordure.

## Ce qu'elles doivent montrer

La documentation demande des captures qui **démontrent l'expérience réelle** —
les fonctions principales, telles qu'un utilisateur les rencontre. Pas de
maquette, pas d'écran inventé.

Pour ce projet, cinq captures qui se répondent :

1. La fenêtre de l'extension, avec quelques liens déjà collectés. — **en place**
   (`01`), mais prise sur une interface antérieure : **à refaire** si un emplacement
   se libère, ce qui n'est plus le cas
2. La collection dans l'application — son nom, sa note, ses tags, ses liens — puis
   la planche qu'on en tire. — **en place** (`02` pour la collection et la mise en
   forme, `03` pour l'étiquette composée : la page entière ne tient pas dans une
   capture, voir « Comment les produire »)
3. L'onglet d'impression Niimbot, avec l'imprimante connectée ou l'aperçu. — **en place** (`03`),
   cadré sur l'étiquette composée et les deux commandes plutôt que sur les réglages
4. La page de mention de confidentialité — elle fait partie de l'expérience, et
   la montrer appuie la déclaration faite dans les champs de confidentialité. — **en place** (`04`)
5. La gestion des collections : le sélecteur, le nom saisi puis enregistré, et le
   panneau de confirmation qui nomme la collection et compte les liens perdus. —
   **en place** (`05`, nouvelle). C'était le sujet de la 0.3.0, et elle remplace le
   menu contextuel prévu au plan : celui-ci est natif, donc impossible à capturer
   depuis le contenu web, et l'emplacement était le cinquième et dernier.

## Le contenu à charger avant de capturer

`contenu-exemple.json`, dans ce dossier, s'importe par le bouton **« Importer »**
de l'application : douze liens, douze domaines, des tags et une note. Il existe
pour que les captures soient **reproductibles** — la même collection d'une séance
à l'autre — et pour que la liste montre ce que le produit sait faire plutôt que
trois fois la même adresse.

Il est relu par l'importateur du produit dans `test/publication.test.js` : un
fichier que l'application refuserait, ou dont les titres se replieraient sur deux
lignes dans la fenêtre de 380 px, fait échouer la suite. Le détail de ce qu'il
cherche à montrer, capture par capture, est dans [`../campagne.md`](../campagne.md).

## Comment les produire

```bash
npm run build
node scripts/capture-store-shots.mjs
```

Le script charge `dist/extension` dans Chrome par le protocole de débogage
(`Extensions.loadUnpacked` : `--load-extension` est ignoré par les Chrome
récents, qui démarrent alors sans rien dire et sans l'extension), pose les
dimensions par `Emulation.setDeviceMetricsOverride` — la capture fait donc
exactement 1280 × 800, et non la taille de la fenêtre —, écrit le contenu
d'exemple **en passant par l'importateur du produit**, puis cadre chaque image
avant de la prendre.

Pour essayer un cadrage **sans écraser la fiche** :

```bash
CAPTURES_SORTIE=.store-shots/essais node scripts/capture-store-shots.mjs
```

L'application est une page de 1600 à 2200 px de haut, et une capture en fait 800 :
**chaque image choisit sa tranche**. `02` prend le haut — la collection, son nom,
sa note, ses tags, et le panneau de mise en forme. `03` descend jusqu'à
l'étiquette composée à la taille réelle, qui est ce que l'onglet produit. Une
seule image ne peut pas montrer les deux : la page entière ne tient pas.

## Ce que le script ne peut pas produire

Deux captures de la fiche demandent un geste qui n'est pas du contenu web :

- **`01`, la fenêtre de l'extension ouverte par-dessus une page.** La fenêtre de
  la barre d'outils relève de l'interface du navigateur : aucun script ne l'ouvre,
  et la reconstituer serait une maquette — ce que la documentation du magasin
  refuse. Il faut ouvrir la page voulue, cliquer l'icône, puis capturer l'écran
  (menu ⌘⇧4 sur macOS) et ramener l'image à 1280 × 800, voir « Un piège à
  connaître ». Sur cette machine, `screencapture` ne rend que le fond d'écran :
  l'autorisation « Enregistrement de l'écran » n'est pas accordée au terminal, et
  le contrôle l'a montré — une fenêtre peinte en bleu vif ne laissait aucun pixel
  bleu dans l'image.
- **`05`, le menu contextuel.** Le menu est natif : il se capture à la main, de
  la même façon, page ouverte derrière et clic droit au-dessus.

## Comment elles sont nommées

Le préfixe donne l'ordre d'affichage, le suffixe la langue :

```
01-fenetre-popup-fr.jpg              la fenêtre, ouverte sur une page
02-application-fr.png                l'application : collection, mise en forme, aperçu
03-impression-niimbot-fr.png         l'onglet d'impression sur l'imprimante
04-mention-confidentialite-fr.png    la mention, en attente d'accord
05-collections-fr.png                la gestion des collections et la confirmation
```

Les cinq sont en **1280 × 800**. Le préfixe est l'ordre d'affichage sur la fiche :
`05` vient donc en dernier, et non à une place libre au milieu.

`02` à `05` sont produites par `scripts/capture-store-shots.mjs`, qui les prend
depuis l'extension réelle chargée dans Chrome : elles sont donc reproductibles.
`01` vient d'une capture d'écran manuelle, faute de pouvoir ouvrir la fenêtre de
l'extension depuis le contenu web.

Le magasin permet des captures **par langue**. Le manifeste déclare `fr` par
défaut, avec `en` : si vous visez les deux, suffixez `-en` pour la seconde
série. Sans elle, la fiche anglaise affichera les captures françaises.

## Un piège à connaître

Le magasin **réduit à 640 × 400**. Une capture prise sur un écran Retina fera
2560 × 1600 : ce n'est pas la bonne taille. Il faut la ramener à 1280 × 800
avant de la déposer, sinon le recadrage du magasin ne correspondra pas à ce que
vous avez cadré.

```bash
sips -z 800 1280 capture-brute.png --out 01-fenetre-fr.png
```

`-z` prend la **hauteur puis la largeur**, dans cet ordre — l'inverse de ce qu'on
écrit naturellement.
