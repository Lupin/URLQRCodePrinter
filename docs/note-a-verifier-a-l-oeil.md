# Ce qui reste à vérifier à l'œil

Note ouverte le 29 septembre 2026, à la fin d'une session où le service de vision
n'a **jamais** répondu : limite de débit d'abord (`HTTP 429`, *rate limit
reached*), puis épuisement du quota du jour — « Daily free limit of 20 requests
reached ». Les cinq captures envoyées pendant la session n'ont donc pas été vues.

**Un point est clos depuis** : les champs de saisie (§1). Les autres restent
ouverts.

Ce qui suit n'est pas une liste de choses non faites : tout a été mesuré, dans le
navigateur, sur le document réel. C'est la liste de ce qu'**une mesure ne peut pas
trancher** — une impression, un équilibre, une question de goût — et qui a été
décidé à l'aveugle, sur des chiffres. Chaque point dit ce qui a été fait, ce qui a
été mesuré, et ce qu'il reste à regarder.

## 1. Les champs de saisie — clos le 29 septembre 2026

**Réglé, et confirmé par l'utilisateur** : « tu peux oublier l'histoire du double
filet, ça a été réglé, on a les input fields qui sont maintenant avec un fond
coloré ». Ne pas rouvrir ce point.

Ce qui avait été fait, sans avoir vu les captures : cadres des contenants
retirés, fond du champ rendu transparent au repos, et le focus qui **teint le
fond** (`--focus-fill`) au lieu de dessiner un contour — ni le nôtre, ni celui du
navigateur. Des deux côtés, application et fenêtre.

Ce qui reste vrai, et qui n'a pas à être retouché sans raison : le champ porte un
seul filet, `1px rgb(141, 141, 141)`, à 3,02:1 sur la surface du panneau — c'est
le seuil de WCAG 1.4.11 pour la limite d'un composant, et c'est pourquoi le filet
ne peut pas être éclairci (`--border-line` ne donne que 1,1:1 sur ce fond).

## 2. L'alignement de la planche, et l'équilibre de la mise en page automatique

**Signalé** : « la mise en page automatique doit aligner les QR Codes,
actuellement c'est un peu chaotique l'alignement des URLs », puis « ça calcule mal
l'espace disponible, ça calcule mal les espacements, l'équilibre. Il est par
exemple absurde de proposer 11 colonnes quand on a que 5 liens ».

**Fait** : contenu des cases aligné en haut (il était centré verticalement, donc
le QR Code montait ou descendait selon le nombre de lignes du titre) ; hauteurs de
blocs communes par page (titre et URL) ; la grille automatique dimensionnée au
**nombre d'étiquettes** (5 liens → 2 × 3, et non 11 × 7).

**Mesuré** : écart vertical des QR Codes **0 px** sur 49 étiquettes et 5 rangées,
écart de taille 0 px, écart des URL 0 px ; grilles 1 → 1 × 1, 3 → 1 × 3, 5 → 2 × 3,
12 → 3 × 4, 49 → 7 × 7, 77 → 7 × 11.

**À regarder, et à trancher** :

- l'alignement se voit-il, à l'œil, sur une page de 49 étiquettes ?
- **5 liens → 2 × 3** (96 × 92 mm, une case vide) ou **1 × 5** (193 × 55 mm, aucune
  case vide) ? J'ai choisi l'équilibre par une tolérance de forme de 2 ; c'est une
  constante, et c'est une affaire de goût.
- « ça calcule mal les espacements » : je n'ai **pas** touché aux écarts ni aux
  marges — ils restent ceux de l'utilisateur, et les étiquettes prennent ce qui
  reste. Si l'attente était que les écarts grandissent avec les étiquettes, ou que
  les marges se rééquilibrent, c'est à faire, et il faut le dire.

## 3. Le pied de page : centrage et signature

**Signalé** : « le lien page d'information doit être centré dans la page dans le
footer, et ajouter aussi mon nom G. Abegg-Gauthey, l'année et le type de licence
de l'application ainsi que la version ».

**Fait** : pied centré, signature `© 2026 G. Abegg-Gauthey · MIT · version 0.2.0`,
année posée par le script, version injectée à la construction depuis
`package.json`.

**Mesuré** : centre du lien 632 px, centre du pied 633 px ; aucun débordement de
1280 à 380 px ; signature lue « © 2026 G. Abegg-Gauthey · MIT · version 0.2.0 ».

**À regarder** : la respiration entre le lien et la signature, et la teinte de la
mention (`--text-3`) — c'est un jugement, pas une mesure.

## 4. L'aide du raccourcissement, en texte fluide

**Signalé** : remplacer la fiche technique par des phrases (« Si vous voulez un
lien plus court… »).

**Fait** : trois phrases et le lien de parrainage ; deux corrections de plume
signalées à l'utilisateur (verbe manquant, « raccourcissement »).

**Mesuré** : texte lu intégralement dans l'application ; le parrainage apparaît
avec T.LY et disparaît avec un autre service.

**À regarder** : le rythme visuel du paragraphe — quatre phrases d'affilée dans un
panneau étroit, est-ce trop long ? La question n'a pas été posée.

## 5. L'en-tête de page

**Signalé** : « en mode planche d'étiquettes, si on clique sur les options dans
« En-tête de page » rien ne s'affiche dans la preview, ni même dans la preview de
l'imprimante ».

**Fait** : cocher la case porte la marge haute à 9 mm — c'était la cause, la
disposition par défaut n'en donnait que 8,53 ; le refus restant est passé à
l'alerte et nomme la valeur à atteindre.

**Mesuré** : en-tête présent 0 → 1 dans l'aperçu **et** dans la racine
d'impression ; bas de l'en-tête 1575 px, haut de la première étiquette 1594 px
(il ne la recouvre pas).

**À regarder** : l'allure de l'en-tête lui-même — la place du nom de collection,
celle de la note, et l'air laissé sous lui.

## 6. Le format 3 × 4 par défaut : deux régressions mesurées — **clos le 30 septembre 2026**

Ce point n'était pas une affaire de vision : c'était du travail inachevé, mesuré.
Les deux régressions sont traitées, et l'une des deux n'était pas où on la
croyait.

**Demandé** : « ajoute un format 3 colonnes × 4 rangées pour la planche
d'étiquettes et mets-la par défaut, car le 3 × 8 est plein de compromis
impossibles ».

**Fait** : le format existe (`a4-3x4`, A4, 63,5 × 69,1 mm, marges 8,5 mm, écarts
1,25 mm), il est en tête des dispositions génériques, et `DEFAULT_SHEET_PRESET` le
désigne — les sept replis de `app.js` et le préremplissage du sélecteur passent
par cette constante. Guides et tests mis à jour ; le test des bornes de QR Code a
été corrigé au passage (il supposait une étiquette plus large que haute, ce que
3 × 4 n'est pas).

**1. La mise en page automatique — corrigée.** Pour 49 liens, elle proposait
`10 × 5 = 50` étiquettes de **18,2 × 55 mm** dont **45 sortaient coupées**, sous
une grille annoncée « calculée pour ce contenu ». La cause n'était pas le repli
seul mais une **largeur** : le besoin de texte était mesuré en deux passes, à la
largeur de la disposition (63,5 mm) puis à celle de la première grille (26,4 mm),
alors que la grille retenue en avait une troisième (18,2 mm) où le même titre
réclame 8 lignes au lieu de 4 — la grille en offrait 7. S'y ajoutait une seconde
formule du même budget : le rendu dessine le QR Code à la proportion du curseur, la
mise en page le supposait à son minimum lisible.

Corrigé : le budget de texte vit dans **une seule fonction** (`sheetTextBudget`),
et la contrainte de contenu est une **fonction des cotes candidates**
(`autoSheetLayout({ tient })`). Quand aucune grille ne porte 49 étiquettes à une
largeur qui porte leur texte, le calcul **ne tasse plus** : il retient la plus
dense qui reste entière, et la planche pagine. Mesuré par le relevé :

| | Avant | Après |
|---|---|---|
| Grille | 10 × 5 = 50 | **11 × 4 = 44** |
| Étiquette | 18,2 × 55 mm | 16,4 × 69,1 mm |
| Lignes coupées | 45 | **0** |
| Pages | 1 (tassée) | **2** (44 puis 5), et l'écran le dit |

**2. Le tableau imprimé — le produit n'était pas en cause.** Le contrôle annonçait
3 pages construites et **5 pages PDF**, et le soupçon portait sur la taille de
texte héritée de la hauteur d'étiquette. Mesure faite sur un profil neuf
(`node scripts/measure-print-pages.mjs 49`) : le tableau construit 3 pages **et le
PDF en sort 3**. Les cinq pages mesurées étaient celles de la **planche**, restées
dans la racine d'impression — le relevé préparait le tableau, puis la planche, et
imprimait ensuite, et `beforeprint` ne rebâtissait rien puisque la racine n'était
pas vide. Deux corrections : le contrôle prépare ce qu'il mesure, et le produit
rebâtit la racine quand le mode a changé — un Ctrl+P après un changement d'onglet
imprimait les pages de l'autre mode.

**Ce qui reste ouvert de ce point** : le coup d'œil sur la nouvelle disposition par
défaut — 12 étiquettes par page au lieu de 24 à l'ouverture —, qui relève du §2 et
du jugement, pas de la mesure.

## 7. L'ajout au clic droit — éprouvé le 30 septembre 2026, deux points restent ouverts

Signalé le 29 septembre 2026 : « sur la page d'information, sur l'utilisation, on
a deux façons d'utiliser l'extension — soit avec le clic droit, soit via le bouton
de l'extension dans la barre du navigateur, qui ouvre une popup — car l'ajout au
clic droit peut jouer des tours. Il faudra bien faire des tests plus poussés plus
tard, quand la vision sera revenue. »

La page d'information présente les deux chemins, à égalité. Le fond de la
remarque — **le clic droit mérite des épreuves qu'il n'a pas encore eues** — est
traité, sans vision, par le relevé : les trois entrées passent par
`captureFromClick` puis par `record`, et le relevé les appelle **dans le service
worker**, avec les `info` que Chrome fournit réellement. Cinq contrôles en sont
nés, et ils passent :

- **trois entrées, trois cibles** : page, lien visé, texte sélectionné — plus
  l'image, où « Ajouter cette page » doit donner la page et non l'image (le bug
  YouTube, rejoué) ;
- **les trois chemins enregistrent vraiment** : 4 → 7 liens, badge `+` pour
  chacun, et le titre suit la provenance — celui de la page, le domaine pour un
  lien, rien pour une sélection ;
- **page déjà collectée** : la collection ne bouge pas (7 liens avant et après),
  et le badge passe à `=` — le doublon se distingue d'un ajout ;
- **page interdite** (`chrome://`) : capture refusée (`null`), badge `!` ;
- **le relevé se rend propre** : les liens ajoutés sont retirés, et un contrôle
  l'atteste — sans quoi la planche de 49 liens mesurée ensuite ne serait plus
  celle qu'elle annonce.

**Ce qui reste ouvert, et pourquoi** :

1. **Le menu natif ne se clique pas.** Aucune API n'ouvre un menu contextuel ni
   n'en choisit une entrée : ce qui est éprouvé est ce que le produit **fait** de
   ce que le navigateur lui donne, pas le clic lui-même. Un essai à la main reste
   nécessaire — il demande de voir le menu s'afficher sur une image, sur un lien
   et sur un texte sélectionné.
2. **Le pré-remplissage du titre, dans la fenêtre**, n'est pas éprouvable
   automatiquement : il repose sur `activeTab`, que Chrome n'accorde qu'au clic
   sur l'icône de la barre d'outils. Mesuré : sans ce geste, `chrome.tabs.query`
   rend un onglet **sans URL ni titre**, et la fenêtre prend la branche « cette
   page ne peut pas être enregistrée ». Ce qui est mesuré, c'est la cohérence du
   champ et du bouton — un champ qui accepterait une saisie que le bouton
   refuserait serait un piège.
3. **La navigation privée** : Chrome n'ouvre pas de fenêtre privée avec
   l'extension chargée en mode automatisé. La collection privée n'existe donc pas
   dans le profil du relevé, et une capture marquée privée y retombe sur la
   collection courante — le chemin public seul est exercé.

## 8. Le manuel et la FAQ : à faire attester par quelqu'un qui teste

Signalé le 29 septembre 2026 : « l'info sur l'impression sur une page normale — je
pense qu'il est inutile de parler de PDF si on n'est pas certain, et en plus on a
plein d'autres formats possibles, notamment en images. Bref, il faudra faire une
passe avec un rédacteur qui teste et atteste des dires du manuel et de la FAQ. »

**Corrigé tout de suite** : les deux pages ne parlent plus de PDF. Elles disent
que la fenêtre d'impression du navigateur prend le relais — vous y choisissez
votre imprimante, ou un fichier — et elles nomment les exports réels : étiquettes
en images (ZIP), planche ou tableau en ZIP, tableur avec les QR Codes, CSV,
Markdown, archive JSON. Le lecteur qui veut imprimer ailleurs sait donc quoi
faire, sans qu'on lui promette un format que l'application ne produit pas
elle-même.

**Ce qui reste à faire** : une passe de rédaction **qui teste et atteste**. Une
première passe a été faite le 30 septembre 2026, et son résultat est écrit dans
`docs/verification-chrome.md` (« La passe de rédaction : ce qui est attesté, ce
qui ne l'est pas ») : une table des affirmations contrôlées avec la mesure qui les
soutient, puis la liste de ce qui reste **non attesté** — l'impression sur Safari
et Brave, l'impression sur papier, l'élégance. Deux points de la liste se sont
révélés vides ou hors de portée de l'instrument :

- **les limites annoncées** : ni le guide, ni le README, ni la page n'annoncent de
  longueur maximale — il n'y avait donc rien à attester ;
- **le comportement réseau** : le relevé **ne peut pas** le compter (une page
  d'extension ne publie aucune entrée de ressource : mesuré, `0`), et le contrôle
  écrit pour cela a été retiré plutôt que de conclure sur du vide. Ce qui soutient
  l'affirmation est ailleurs : un seul point d'appel réseau dans tout le produit
  (`core/shorten.js`, atteint sur un clic), et **aucune permission d'hôte**
  déclarée — mesuré par le relevé.
- **l'adresse d'origine jamais remplacée** : attesté — `shortUrl` est un champ à
  côté de `url`, et l'étiquette ne prend le raccourci que si on le demande.

Le point de méthode compte autant que le contenu : ce qui n'a pas été testé doit
être écrit comme tel, ou retiré. C'est exactement ce que la remarque reprochait au
PDF — une phrase plausible, jamais éprouvée.

## 9. Ce qui reste incertain même après ces mesures

- **Les points visuels (§2 à §5) n'ont pas pu être tranchés le 30 septembre 2026** :
  le service de vision a de nouveau refusé de répondre (limite de débit, puis
  HTTP 502). Les images existent, et le regard reste à faire — c'est le seul point
  de la note qui n'a pas avancé.
- **La fenêtre de l'extension** n'a pas de champ encadré par un contenant, d'après
  la mesure — mais la mesure porte sur la structure, pas sur l'impression visuelle.
- Le reste du relevé navigateur — **167/167** le 30 septembre 2026 — porte sur des
  positions et des contrastes ; il ne dit rien de l'élégance.

## 10. Ouvert le 30 septembre 2026 : le QR Code sur une tête de D110

Signalé : « sur la Niimbot, même sur le D110, on pourrait éventuellement faire un
QR Code plus large, notamment pour les consommables de 14 mm de large. Aussi
attention à la marge du QR Code : dans mon cas d'étiquette 14 × 50, il était trop
près du bord et un peu trop petit. »

Mesuré hors navigateur, sur la tête du D110 (96 px à 203 dpi = 12,01 mm), avec la
règle actuelle — 95 % de la largeur intérieure, échelle entière :

| URL encodée | modules | QR Code | px/module | zone de silence |
|---|---|---|---|---|
| courte (29 modules) | 29 | **58 px** — 7,26 mm | 2 | 11,5 modules |
| ordinaire (33) | 33 | 66 px — 8,26 mm | 2 | 9,5 |
| longue (37) | 37 | 74 px — 9,26 mm | 2 | 7,5 |
| très longue (41) | 41 | 82 px — 10,26 mm | 2 | 5,5 |

**Les deux remarques se lisent dans la même colonne.** Le QR Code est à **2 px par
module** dans les quatre cas, alors que la tête peut porter **3 px par module** dès
que l'adresse est courte : à 29 modules, 87 px tiennent dans les 96 px, soit
**+50 % de côté** (7,26 → 10,89 mm). C'est la largeur que la règle actuelle laisse
perdre, parce qu'elle part de 95 % de la largeur intérieure (84 px) et que
l'échelle entière retombe alors à 2. La zone de silence se réduit à mesure que
l'adresse s'allonge (11,5 → 5,5 modules) : elle reste au-dessus des 4 modules de la
norme, mais c'est la marge **extérieure** qui décide, et elle n'est choisie nulle
part pour elle-même.

**Trois suites possibles, à trancher** — c'est une affaire de goût et de risque :

1. **Un QR Code plus large** : lui donner la tête entière moins un module de marge
   par côté — +50 % sur les adresses courtes, zone de silence ramenée de 11,5 à
   3,5 modules (au-dessus de la norme dans le total, mais 1,5 module de marge
   extérieure) ;
2. **la priorité à la zone de silence** : garder le dimensionnement actuel ;
3. **le champ « Taille du QR Code » offert sur le D110**, comme sur le M2 et le M3 :
   le réglage existe, il agit, et il est aujourd'hui masqué là où il peut le plus.

Sur la marge (« trop près du bord »), il faut savoir de quel bord il s'agit : la
marge par défaut d'une étiquette vaut **6 % de la largeur** (6 px = 0,75 mm sur un
D110) — peu, au bord d'une découpe — et c'est un réglage (« Marge ») indépendant du
QR Code.

**Ce que la mesure ne dit pas** : si un QR Code à 3 px par module, avec 1,5 module
de marge extérieure, se lit encore bien sur du papier thermique. Cela demande une
impression et un lecteur, pas un calcul — et aucun matériel n'est connecté à cette
machine.

### Tranché le 30 septembre 2026 : un QR Code plus large — et ce que cela coûte

Réponse à la question posée : **prendre l'option 1** (un QR Code plus large,
jusqu'à la tête moins un module de marge), et la marge en cause est bien **le bord
de coupe en haut de l'étiquette**, dans la disposition « texte droit sous le QR
Code ».

Le chiffrage précis, sur la tête du D110 (96 px), montre que les deux demandes se
**contrarient** — et c'est cela qu'il faut savoir avant de coder :

| URL | aujourd'hui | QR à la tête entière | échelle fractionnaire, 1 mm de marge |
|---|---|---|---|
| 29 modules | 58 px — 7,26 mm, marge **2,38 mm** | 87 px — 10,89 mm, marge **0,56 mm** | 2,76 px/module — 10,01 mm, marge 1,00 mm |
| 33 modules | 66 px — 8,26 mm, marge 1,88 mm | 66 px (inchangé) | 2,42 px/module — 10,01 mm |
| 37 modules | 74 px — 9,26 mm, marge 1,38 mm | 74 px (inchangé) | 2,16 px/module — 10,01 mm |
| 41 modules | 82 px — 10,26 mm, marge **0,88 mm** | 82 px (inchangé) | 1,95 px/module — 10,01 mm |

Trois constats :

1. **Le gain ne porte que sur les adresses courtes.** À partir de 33 modules, la
   tête ne peut plus porter 3 px par module : le dimensionnement actuel est déjà au
   maximum, et il n'y a rien à gagner sans échelle fractionnaire.
2. **Un QR Code plus large rapproche le code du bord, il ne l'en éloigne pas** :
   à 29 modules, la marge passe de 2,38 mm à 0,56 mm. Sur une découpe de D110, qui
   dérive d'un demi-millimètre, c'est peu — et c'est l'inverse de la seconde
   remarque.
3. **Les deux demandes ne se concilient qu'avec une échelle fractionnaire** : un
   module de 2,76 px (modules alternés de 3 et 2 px, tous au-dessus du plancher de
   2 px) donne 10,01 mm de QR Code **et** 1 mm de marge. Cela demande de renoncer à
   la règle « un nombre entier de pixels par module » — celle qui existe pour
   qu'un QR Code ne soit pas flou — et **aucune mesure ne peut dire ici si cela se
   lit encore** : il faut une impression et un lecteur.

### Le bord de coupe, dans la disposition « texte tourné »

Précision apportée : « le problème de coupe, c'est quand on choisit avant tout
*rotated text* ». Vérifié dans le code, et le diagnostic est net :

- dans `layoutLabelRotated`, le QR Code commence à `padding` du bord — et
  `padding` vaut **6 % de la largeur de la tête**, soit **6 px = 0,75 mm** sur un
  D110. C'est peu au bord d'une découpe, qui dérive d'un demi-millimètre ;
- **le réglage « Marge » ne peut rien y faire** : `marginMm` (1,5 mm par défaut)
  est lu dans `readLabelOptions` et n'est consommé que par le chemin d'**export
  d'image** (`label-export.js`). La composition Niimbot — aperçu et impression —
  ne le reçoit jamais et garde son rembourrage de 6 %. Autrement dit, sur une
  Niimbot, l'utilisateur ne peut pas éloigner le QR Code de la coupe : c'est un
  défaut à part entière, indépendant du dimensionnement du QR Code.

Deux corrections distinctes, donc, et la seconde ne coûte rien au QR Code :

1. **Faire descendre la marge dans la composition** : passer `marginMm` en
   `padding` à `computeLabelGeometry` (chemin Niimbot). À 1,5 mm, le QR Code
   commencerait à 12 px du bord sur un D110 au lieu de 6 ;
2. **Élargir le QR Code** selon la règle bornée ci-dessus — mais attention : sur
   une tête de 96 px, une marge de 1,5 mm et un QR Code de 29 modules ne laissent
   que 72 px utiles, soit **2 px par module** : les deux corrections se
   contrarient, exactement comme le tableau précédent le montre.

**Ce qui est prêt à coder** (le point d'insertion est nommé, la règle est bornée) :
dans `computeLabelGeometry`, remplacer l'échelle automatique par *au plus un cran
au-dessus* de l'échelle du rapport, et seulement si ce cran tient dans la tête avec
un module de marge — `min(scaleTête, scaleRapport + 1)`. Cela donne +50 % sur
l'adresse courte du D110, +6 % seulement sur un M2, et ne peut jamais doubler le
code. Pour la marge haute, `padding` vaut 6 % de la largeur (0,75 mm) : un plancher
en millimètres (1,2 mm ?) est la deuxième décision à prendre, et elle touche toutes
les étiquettes, pas seulement le QR Code.

**Ce qui reste à faire, en une seule fois** : trancher entre « entier + 0,56 mm de
marge » et « fractionnaire + 1 mm de marge », puis coder, mesurer sur les quatre
densités ci-dessus, et refaire le relevé — deux contrôles existants le mesurent
déjà (« la taille du QR Code se règle sur une tête large », et l'aperçu de
l'étiquette).


## 11. Ouvert le 30 septembre 2026 : l'espacement vertical, et l'heure selon l'orientation

Deux signalements, sur la même étiquette 14 × 50 d'un D110.

### L'écart entre le QR Code et le texte — **corrigé**

« En vertical, l'interlignage entre le QR Code et le texte est trop large, surtout
pour les étiquettes de 14 × 50. C'est l'inverse : on peut avoir trop d'espace même
pour le QR Code. L'alignement est un problème plus général on dirait. »

C'était exact, et le défaut était dans la disposition **centrée** — celle par
défaut. Mesuré sur une 14 × 50 mm (400 px à 203 dpi, 1 mm = 8 px) :

| disposition | QR en haut à | écart QR → texte | vide au-dessus / en dessous |
|---|---|---|---|
| En haut | 6 px | **6 px — 0,8 mm** | 0 / 236 px |
| Centré — **avant** | 124 px | **124 px — 15,5 mm** | 118 / 0 |
| Centré — **après** | 124 px | **6 px — 0,8 mm** | 118 / 118 px |
| Réparti | 6 px | 242 px — 30,3 mm | 0 / 0 |

La place libre se partageait bien en deux, mais la seconde moitié s'ajoutait à
l'écart entre le QR Code et le texte : le code flottait 15,5 mm au-dessus de son
texte, et le texte se retrouvait collé au bas de l'étiquette — l'inverse d'un
centrage. Le commentaire du code annonçait pourtant « une moitié au-dessus du QR
Code, une **sous le texte** » : le code faisait autre chose que ce qu'il disait, et
le test qui couvrait ce comportement s'arrêtait à `below >= 0`, trop faible pour
s'en apercevoir. Les deux sont corrigés — l'écart reste la marge (6 px), et le test
affirme maintenant que le reste de la place va **sous le texte** et que l'écart
vaut la marge.

**Ce que cela ne règle pas** : une 14 × 50 porte un QR Code de 7,26 mm et trois
lignes de texte, soit ~20 mm de contenu pour 50 mm de papier. Il reste donc 236 px
(29,5 mm) de blanc, répartis en 118 px au-dessus et 118 en dessous en mode centré.
C'est la conséquence du format, pas un défaut d'alignement : les remèdes sont de
choisir « En haut » (tout groupé en haut), ou d'élargir le QR Code (§10), ou de
grossir le texte — ce que la géométrie fait déjà quand la longueur le permet.

### L'heure : à la suite de la date en tourné, sous la date en vertical

Demandé : « en *Rotate*, on mettra l'heure à la suite de la date, alors qu'en
vertical on mettra l'heure sous la date. »

C'est une contrainte **d'orientation**, et elle n'est pas encore tenue : le bloc de
date est composé une fois (`formatCaptureDate`), puis découpé selon la place
disponible — la même règle pour les deux orientations. Ce qu'il faut :

1. **Le mécanisme, établi le 30 septembre 2026** : la date est découpée **avant**
   que la disposition ne soit connue — `wrapDate(cachedTextMeasure(tailleDate),
   wanted, largeurDate, DATE_LINES_MAX)` dans `app.js`, où `largeurDate` vaut la
   **largeur** intérieure de l'étiquette (84 px sur un D110). « 15/09/2026 18:01 »
   n'y tient pas d'un tenant : elle est coupée à l'espace, date puis heure — la
   disposition tournée reçoit donc deux rangées toutes faites, alors que sa bande
   court sur la **longueur** et porterait la date entière. C'est exactement le
   défaut déjà corrigé pour le titre ; la date a gardé la découpe de l'autre
   disposition ;
2. **Ce qu'il faut** : que `layoutLabelRotated` redécoupe la date à la longueur de
   sa bande, comme il redécoupe déjà le titre — donc recevoir la date **en clair**
   (`options.date`) et **rendre ses lignes** (`dateLines`) pour que le dessin
   écrive celles de la bande, et non `content.extraText` qui vient de l'autre
   disposition. La disposition verticale, elle, ne change pas : deux rangées, la
   date puis l'heure ;
3. un test par orientation (une 12 × 75 mm pour la bande, une 12 × 50 mm pour
   l'empilement), et un contrôle de relevé jumeau de « dans la bande tournée, le
   titre coûte une rangée et non deux ».

## 12. La passe visuelle : les images sont prêtes, le regard manque encore

Les questions du §2 au §5 restent ouvertes, mais elles n'attendent plus qu'un
regard : les images existent, cadrées sur chacune d'elles, et une partie de ce
qu'elles devaient trancher a été **mesurée localement**, sans service de vision.

**Les images** (`.verify-chrome-captures/regard/`, captures de la page entière à
1280 × 900 et `deviceScaleFactor: 2`, puis recadrées) :

| Fichier | Ce qu'il montre | Question du § |
|---|---|---|
| `2a-cinq-liens.png` | 5 liens, mise en page automatique : `2 × 3 = 6` étiquettes de 95,9 × 92,5 mm | §2 — la case vide du 2 × 3 se remarque-t-elle ? |
| `2b-49-liens.png` | 49 liens, mise en page automatique : `13 × 4 = 52` de 13,7 × 68,8 mm | §2 — l'alignement des QR Codes et des URL se voit-il ? |
| `3-pied-de-page.png` | le lien d'information et la signature | §3 — la respiration, et la teinte de la mention |
| `4-aide-raccourcissement.png` | le panneau du raccourcissement et son aide | §4 — quatre phrases d'affilée : trop long ? |
| `5-en-tete.png` | le haut de la planche avec « En-tête de page » coché | §5 — l'allure de l'en-tête |
| `a-cinq-liens-page.png`, `b-49-liens-page.png` | les deux pages entières, avant recadrage | la source des cinq autres |

**Ce que la mesure locale a déjà tranché** (§3, profil d'encre ligne à ligne du
recadrage, sans API) :

- le lien « Page d'information » s'écrit en **`rgb(57, 57, 57)`** — `--text-2` — sur
  12 px de haut ;
- la signature s'écrit en **`rgb(92, 92, 92)`** — c'est `--text-3` — sur 11,5 px ;
- **13 px** les séparent : c'est la « respiration » que la note laissait au
  jugement, et elle est mesurable ;
- et le contraste de la mention est **6,08:1** sur la surface du pied
  (`rgb(244, 244, 244)`) : au-dessus du seuil de 4,5:1, avec une marge confortable —
  la teinte n'a donc rien à corriger du côté de la lisibilité.

**Ce que la mesure locale a déjà tranché** (§4 et §2, toujours sans API) :

- **§4 — l'aide du raccourcissement fait 265 caractères, et s'affiche sur
  trois lignes** (mesuré au profil d'encre du recadrage : trois bandes de 11,5 à
  12 px dans une boîte de 717 × 54 px, soit ~88 caractères par ligne). La question
  de la note — « quatre phrases d'affilée dans un panneau étroit, est-ce trop
  long ? » — porte donc sur **trois phrases et trois lignes**, dans un panneau de
  717 px de large : ce n'est ni quatre phrases, ni un panneau étroit. Le rythme
  reste une affaire de goût, mais le chiffre enlève le doute sur la longueur ;
- **§2 — l'alignement est déjà mesuré** par le relevé, sur une planche de 49
  étiquettes : **0 px** d'écart vertical entre les QR Codes d'une même rangée,
  **0 px** d'écart de taille, **0 px** d'écart vertical entre les URL. Reste la
  question de goût — « est-ce que cela se voit ? » — que l'œil seul tranche ;
- **§2 — la case vide du 2 × 3** n'est pas une mesure mais une arithmétique : cinq
  liens dans une grille de six cases, sur une A4, laissent **un sixième de la
  planche** en blanc (95,9 × 92,5 mm). L'alternative 1 × 5 donne des étiquettes de
  193 × 55 mm, sans case vide mais étirées : la tolérance de forme (facteur 2) est
  ce qui choisit, et c'est une constante assumée.

**§5 — un chiffre qui n'est pas un jugement : l'en-tête commence au bord.**
Mesuré dans l'aperçu, par un contrôle ajouté au relevé (« l'en-tête porte son nom
et sa note dans sa bande, sans la déborder ») : la bande fait **29 px** pour 9 mm,
le nom de collection occupe **0–20 px** de cette bande, la note est absente dans
cet état, le texte ne déborde pas (‑9 px) et l'air sous l'en-tête vaut **19 px**.
Autrement dit le nom commence **à 0 mm du bord haut de la feuille** — la règle est
`.print-page__header { position: absolute; top: 0 }`.

Ce n'est pas une affaire de goût : aucune imprimante jet d'encre ou laser n'imprime
à 0 mm du bord (les marges non imprimables vont de 3 à 5 mm selon les modèles), et
le navigateur peut réduire la page entière pour la faire tenir. Le relevé mesurait
le **bas** de l'en-tête face à la première étiquette (1575 px contre 1594 px) et
jamais son **haut** : le défaut était hors du champ de la mesure.

Le remède est court : centrer le texte dans sa bande de 9 mm, ou lui donner une
marge haute de 2 à 3 mm — il entre alors dans la zone imprimable sans que la
disposition change. À trancher avec vous, parce que cela déplace ce que trois
contrôles mesurent (bas de l'en-tête, haut de la première étiquette, position du
nom dans la bande).

**Ce qui bloque encore** : le service de vision. `glance` répond
`Missing config VISION_API_KEY` dans cette session, et le proxy du harnais a
refusé trois fois de suite — `HTTP 429`, *rate limit reached*, puis `HTTP 502`.
`read_image` fonctionne (l'image est bien reçue, 2048 × 1440) mais l'étape de
description passe par le même fournisseur et échoue. Tant que ce quota est épuisé,
les §2, §4 et §5 se regardent à l'œil humain — les images sont là pour ça.

**Un piège payé en les fabriquant** : trois captures par `clip` ont rendu **trois
fichiers identiques au bit près** (même SHA-256) pour trois états différents —
l'aperçu dépasse la fenêtre, et `Page.captureScreenshot` sans
`captureBeyondViewport` resservait la même image. La méthode retenue est
désormais : capturer la **page entière**, forcer une occasion de rendu avant
chaque prise, mesurer les boîtes en **coordonnées du document** (défilement
compris), puis recadrer hors du navigateur. Et vérifier que deux états donnent
deux images différentes — une comparaison de SHA-256 suffit.
