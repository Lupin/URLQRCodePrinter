# Contenu des captures et campagne de lancement

Ce document sert deux fois : il dit **quoi montrer** dans les captures de la fiche,
et il porte les textes de la campagne, prêts à coller. Il suit le plan de
[`screenshots/README.md`](screenshots/README.md) — les cinq emplacements, dont un
seul reste libre (le menu contextuel).

Deux règles valent pour tout ce qui suit :

- **aucune promesse non vérifiée** : les affirmations employées sont celles que la
  fiche déclare déjà (voir `../docs/chrome-web-store.md`) ;
- **le contenu des captures ne contient aucune donnée personnelle** : les liens de
  `contenu-exemple.json` sont publics et vérifiables.

---

## 1. Le contenu à charger pour les captures

`store/screenshots/contenu-exemple.json` s'importe par le bouton **« Importer »**
de l'application — c'est le format de l'archive du même nom, et le fichier a été
**relu par l'importateur du produit** : 12 liens, aucun refusé. Onze autres liens
valent mieux que trois : la liste doit montrer de la variété (sites de fabricants,
presse, encyclopédie, boutique, vidéo), et non douze fois le même domaine.

Trois points vérifiés en septembre 2026, et à revérifier avant chaque séance :

- **les adresses répondent.** Plusieurs ne répondaient plus — la page Wikipédia
  « Niimbot » est un 404, un tableau `docs.google.com` inventé, une vidéo
  `watch?v=range-cables` qui n'existe pas, une page « garantie légale » déplacée.
  Elles ont été remplacées par des pages **relevées une à une** (réponse 200) :
  c'est le minimum qu'on doive à une capture que n'importe qui peut cliquer.
- **c'est bien la forme de l'archive** : le nom et la note de collection vivent
  dans un objet `collection`, à côté de `links`. Une chaîne à cette place passe
  inaperçue à l'import, et la capture montre alors une collection sans nom ;
  `test/publication.test.js` le refuse désormais.
- **le fichier porte le nom et la note** affichés dans les captures :
  « Notices et garanties », et la note qui s'imprime dans l'en-tête de la planche.

Ce que le contenu cherche à montrer :

| Ce qu'on voit | Pourquoi |
|---|---|
| Un titre court, un domaine différent par ligne | les titres se replient au-delà de ~45 caractères, et la fenêtre ne fait que **380 px** de large |
| Deux pastilles de tags sur quelques lignes **de l'application** | les tags sont une fonction, et une capture qui n'en montre pas ne la vend pas. La fenêtre de l'extension, elle, n'affiche pas les tags : ils ne se montrent que dans l'application et dans le tableau imprimé |
| Une note remplie sur un lien | la note de collection s'imprime dans l'en-tête ; une note de lien est une fonction de plus |
| « Rode DS3 — fiche produit », « Garantie légale de conformité » | ce sont des objets et des papiers **qu'on étiquette vraiment** — le produit devient évident |
| Un mélange maison **et** audio | le magasin s'adresse au grand public, et la campagne s'appuie sur du matériel réel |

**À éviter** : les adresses privées (intranet, documents partagés nominatifs), les
marques mises en avant comme un partenariat, les titres qui commencent par
« https:// », et les collections de plus de quinze lignes — la capture devient un
mur de texte illisible à 640 × 400.

### Ce que chaque capture doit cadrer

| Capture | Contenu à charger | Ce qu'il faut y voir |
|---|---|---|
| `01-fenetre-popup-fr` | la collection d'exemple, page courante ouverte sur un article **français** | le nom de la collection entre ses flèches, le compteur, **4 à 5 lignes** (titre et adresse), le champ de titre pré-rempli, les deux boutons. **À refaire** : la capture en place date d'une interface antérieure, et montre « Tout effacer », un libellé qui n'existe plus |
| `02-application-fr` | la collection d'exemple | la collection dans l'application : son nom, sa note, ses **tags**, ses liens, et le panneau de mise en forme — le haut de la page. L'aperçu de la planche est plus bas : il ne tient pas dans la même image |
| `03-impression-niimbot-fr` | la même collection | l'onglet Niimbot **cadré sur ce qu'il produit** : l'étiquette composée à la taille réelle, le titre et l'adresse lisibles, et les deux commandes — les réglages au-dessus suffisent à situer l'onglet |
| `05-menu-contextuel-fr` *(le libre)* | une page de produit ou de documentation | le clic droit ouvert, les **trois** entrées d'ajout visibles, la page derrière reconnaissable |

Deux détails de cadrage : **1280 × 800** exactement, **sans cadre ni ombre** — le
magasin présente l'image telle quelle, et une capture déjà encadrée s'affiche avec
une double bordure. `sips -z 800 1280` prend la hauteur **puis** la largeur.

---

## 2. LinkedIn — le récit, une fois

**Image** : la photo des étiquettes collées sur le matériel (celle de vos câbles et
lecteurs). C'est la preuve ; une capture d'écran se discute, une étiquette collée
non.

```
Mes câbles audio avaient tous la même tête. Une fois rangés, impossible de savoir
lequel va où sans les suivre à la main.

J'ai écrit une extension de navigateur pour ça. Elle collecte un lien — clic droit
sur une page, sur un lien, sur une image, sur un texte sélectionné — et l'imprime
en étiquette QR Code :

— sur une planche d'étiquettes A4, avec les dispositions du commerce déjà
  réglées ou les vôtres, au millimètre ;
— directement sur une imprimante d'étiquettes Niimbot, en Bluetooth ;
— ou en dossier d'images, si vous préférez imprimer ailleurs.

Ce qu'elle ne fait pas compte autant : aucun compte, aucun serveur, aucune mesure
d'audience, aucune publicité. Les liens restent dans le navigateur. Le
raccourcissement d'adresse est la seule fonction qui sort sur le réseau, et
seulement quand on le demande. Le code est ouvert, sous licence MIT.

Chrome, Brave et Edge. Les retours m'intéressent, surtout les usages auxquels je
n'ai pas pensé.

[la fiche]
```

**Après le premier commentaire**, la variante courte si vous préférez :

```
Une extension qui transforme un lien en étiquette QR Code imprimable : planche
A4, imprimante d'étiquettes Niimbot en Bluetooth, ou dossier d'images à imprimer
ailleurs. Sans compte, sans serveur, sans mesure d'audience — tout reste sur
l'appareil, et le code est ouvert.

Chrome, Brave, Edge. [la fiche]
```

---

## 3. Instagram — le carrousel

Cinq images, dans cet ordre : une photo, deux captures, une photo, puis l'adresse.
Les légendes entre crochets sont à écrire **sur** l'image (ou à laisser vides si
vous préférez le noir et blanc des captures seules).

| # | Image | Texte sur l'image |
|---|---|---|
| 1 | la photo des étiquettes collées sur le matériel | « Mes câbles, enfin identifiables » |
| 2 | la fenêtre de l'extension, collection chargée | « Clic droit → le lien rejoint la collection » |
| 3 | l'aperçu d'une planche d'étiquettes | « Il ne reste qu'à imprimer » |
| 4 | une étiquette qui sort de l'imprimante (ou l'onglet Niimbot) | « Ou directement sur l'imprimante » |
| 5 | le QR Code de la fiche du magasin, si vous en avez un | « Chrome, Brave, Edge » |

**Légende :**

```
Des étiquettes QR Code pour tout ce qui traîne : câbles, boîtes, dossiers,
chargeurs. On collecte un lien dans le navigateur, on imprime, on colle — et trois
ans plus tard le QR Code dit encore de quoi il s'agit.

Tout reste sur l'appareil : ni compte, ni serveur, ni mesure d'audience.

Fiche : [lien en bio ou lien direct]
```

**Mots-clés** (à doser, cinq suffisent) : `#rangement` `#etiquettes` `#qrcode`
`#organisation` `#makers`

**Textes alternatifs** — ils ne servent pas qu'à l'accessibilité : c'est ainsi
qu'une image qui parle de câbles est trouvée. Un par image :

1. « Trois étiquettes blanches collées sur du matériel audio, chacune portant un
   titre, une adresse et un QR Code. »
2. « La fenêtre de l'extension, ouverte sur une page : une collection de liens
   avec leurs tags, et un champ de titre pré-rempli. »
3. « Aperçu d'une planche d'étiquettes A4 : douze cases avec titre, adresse et QR
   Code, plus un en-tête de page. »
4. « Une étiquette imprimée sortant d'une imprimante thermique de bureau. »
5. « Le QR Code de la fiche du magasin, encadré, sur fond clair. »

---

## 4. X — le fil technique

Quatre messages. Le premier porte l'image des étiquettes ; le deuxième, la capture
de la fenêtre ; le troisième n'a pas d'image (c'est un chiffre, il se suffit) ; le
quatrième porte le lien.

```
1/4  Mes câbles audio se ressemblaient tous. J'ai écrit une extension de
     navigateur pour les étiqueter : un lien collecté → une étiquette QR Code
     imprimable. Chrome, Brave, Edge. Code ouvert (MIT).

     [photo des étiquettes collées]
```

```
2/4  Trois façons d'imprimer :
     — planche d'étiquettes A4 (dispositions du commerce, ou les vôtres, au
       millimètre) ;
     — imprimante d'étiquettes Niimbot, en Web Bluetooth ;
     — dossier d'images, à imprimer où vous voulez.

     [capture de la fenêtre]
```

```
3/4  Sur le paquet : 4 permissions, aucun accès aux sites déclaré, aucun serveur.
     La seule requête réseau est le raccourcissement d'adresse, et seulement sur
     un clic. 1,3 Mo, tout embarqué — pas de code distant.
```

```
4/4  Le détail des fonctions, et l'installation :
     [la fiche]
```

**Variante anglaise du premier message**, si vous voulez toucher au-delà du
francophone :

```
1/4  My audio cables all looked alike. So I wrote a browser extension that turns
     a link into a printable QR label — A4 label sheets, a Niimbot label printer
     over Bluetooth, or a folder of images. No account, no server, no analytics.
     Open source, MIT. Chrome, Brave, Edge.
```

---

## 5. Ordre et rythme

| Jour | Où | Quoi |
|---|---|---|
| **J0** | LinkedIn (+ X le même jour) | le récit et la photo des étiquettes — c'est là que se trouve votre réseau |
| **J2** | X | le fil technique, si vous ne l'avez pas déjà publié à J0 |
| **J3 ou J4** | Instagram | le carrousel — il vit plus longtemps, et il n'a pas besoin d'actualité |
| **J+10** | LinkedIn | un court retour d'usage : ce qui a servi, ce qui manque. C'est ce qui relance sans répéter |

Un seul conseil de méthode : **répondez à chaque commentaire par un fait**. Le
produit a des chiffres (12 étiquettes par page en 3 × 4, 167 constats de
vérification, 4 permissions) — c'est plus convaincant qu'un adjectif, et cela
ressemble à ce que le dépôt fait déjà.

---

## 6. Les phrases à ne pas écrire

Elles sont plausibles, et fausses ou invérifiables — c'est exactement ce que la
fiche reprochait au mot « PDF » :

| À éviter | À la place |
|---|---|
| « exporte en PDF » | « la fenêtre d'impression du navigateur prend le relais : imprimante ou fichier » |
| « aucune requête réseau, jamais » | « la seule requête réseau est le raccourcissement, quand vous le demandez » |
| « fonctionne sur tous les navigateurs » | « Chrome, Brave, Edge » (Safari est préparé dans le dépôt, pas publié) |
| « se lit avec n'importe quel téléphone » | « un QR Code lisible : les modules descendent jusqu'au minimum imprimable » |
| « vos données sont chiffrées » | « vos liens ne quittent pas le navigateur : il n'y a rien à chiffrer en transit » |

Et deux vérifications avant de publier : que le lien de la fiche fonctionne, et que
la version annoncée est bien celle qui est **en ligne** — une campagne qui envoie
vers une version en attente de validation déçoit exactement ceux qui cliquent.
