# L'extension dans Chrome — ce qui a été mesuré

Relevé fait le 26 septembre 2026, sur **Google Chrome 153.0.8010.53** (macOS),
extension chargée depuis `dist/extension`, par `npm run verify:chrome`.

L'audit d'accessibilité (`design-options/audit-accessibilite.md`) annonçait que
ses seize paires de contraste étaient « mesurées, pas estimées ». Elles l'étaient
— mais **par calcul sur les jetons écrits dans les feuilles de style**, jamais
sur un document rendu. `test/popup-a11y.test.js` fait de même : il recalcule les
seize paires depuis `popup.css`. Les deux ont raison sur ce qu'ils mesurent, et
tous deux peuvent se tromper sur ce qui s'affiche. C'est cet écart que ce relevé
existe pour fermer.

---

## Le fait qui commande tout le reste

**Chrome 153 ignore `--load-extension`.** Le commutateur de fonctionnalité
`DisableLoadExtensionCommandLineSwitch` le neutralise, et le navigateur démarre
alors normalement, sans la moindre erreur ni le moindre avertissement : un
profil parfaitement fonctionnel et parfaitement vide. Deux lancements successifs
ont été perdus à croire à un défaut de manifeste.

Le chargement passe donc par le protocole de débogage, commande
`Extensions.loadUnpacked`, qui rend l'identifiant attribué. C'est le chemin que
l'outillage officiel emprunte, et le seul qui fonctionne encore sur cette
version. Toute vérification future dans Chrome doit partir de là.

---

## Le piège qui a d'abord fait mentir ce relevé

**Un onglet qui n'est pas rendu n'a pas de style calculé à jour.** Les onglets de
vérification sont hors écran, et Chrome diffère le calcul de style d'une page
qu'il ne peint pas. `getComputedStyle` rendait donc les valeurs de l'état
**précédent** — celui du balisage livré, où les boutons du pied portent
l'attribut `disabled` — alors que la peinture, elle, était juste.

Le piège est traître parce que tous les contrôles concordaient :

- les règles CSS correspondant à l'élément étaient les bonnes, et `--border-strong`
  s'y résolvait bien à `#8d8d8d` ;
- `:disabled` ne correspondait plus, et `element.disabled` valait `false` ;
- un bouton **neuf** portant exactement les mêmes classes rendait la bonne
  valeur, `rgb(141,141,141)` ;
- et la capture d'écran montrait un bouton noir à texte blanc là où la mesure
  lisait gris sur gris.

Quatre constats concordants accusaient le produit d'un défaut de contraste qu'il
n'avait pas. La correction tient en une ligne : **forcer une occasion de rendu**
avant toute mesure, par une capture d'un pixel — le recalcul de style est global,
seul le dessin est restreint.

Ce qui avait été écrit ici avant cette correction est faux, et la façon dont ça
l'était vaut d'être retenue : la mesure ne s'était pas trompée de peu, elle avait
**fabriqué un défaut crédible**, avec des chiffres précis et une cause plausible.
Une mesure qui accuse demande à être confrontée à une seconde source — ici, les
pixels.

**Deuxième piège, du même genre :** `await eval('location.reload()')` ne répond
jamais. La navigation détruit le contexte d'exécution avant que la réponse ne
soit écrite, et la promesse reste en suspens indéfiniment — le script s'arrêtait
sans un mot, après sa dernière ligne écrite. `Page.reload` est une commande du
protocole : elle répond.

---

## Ce qui échoue, mesures en main

| # | Constat | Mesure | Critère | Lot |
|---|---------|--------|---------|-----|
| 1 | Libellés des quatre onglets | **43 px de haut au lieu de 29** : le libellé passe à la ligne | lisibilité | 3 et 5 |
| 2 | Panneau de gauche de l'application | refuse de descendre sous **432 px** : débordement horizontal dès que la fenêtre fait moins de ~448 px | 1.4.10 Reflow | 5 |
| 3 | Aperçu de la planche | **476 px dessinés sur 642 offerts, soit 74 %** : la transformation relevée est `scale(0.6)`, le plafond est atteint | — | **corrigé (lot 5)** |
| 4 | Aperçu de l'étiquette Niimbot | **384 px à l'écran pour 45 px réels, soit 8,5 ×**, en rendu `pixelated` | — | **corrigé (lot 4)** |

Les quatre constats sont désormais traités : le contour des boutons était une
fausse accusation, les deux cibles satisfont l'exception d'espacement, et les
deux aperçus ont été repris. Le relevé passe à **72 constats sur 72**, et à
**121 sur 121** après les lots suivants.

### Le constat 1 : la fenêtre la plus courante est la plus mal servie

La bande d'onglets mesure 715 px à 1280 px de large, 435 px à 1000 px, puis
**779 px à 900 px** — parce que le point de rupture de `@media (max-width: 900px)`
empile les deux panneaux et rend toute la largeur au panneau de droite.

Les libellés passent à la ligne dès que la bande descend sous ~450 px :
**43 px de haut à 1000, 560, 440, 400 et 380 px**, 29 px ailleurs. La disposition
est donc à son pire juste au-dessus du point de rupture, là où se trouvent les
portables.

L'hypothèse portée au plan — « les onglets sont à l'étroit dans une colonne de
320 px » — était **fausse** : la bande ne descend jamais sous 398 px. Le défaut
est ailleurs que là où il était supposé.

---

## Ce qui avait été annoncé en échec, et qui ne l'est pas

Trois constats de la première version de ce relevé sont **retirés**. Ils venaient
tous du piège décrit plus haut.

| Constat annoncé | Ce que dit le rendu, une fois peint |
|---|---|
| Contour des boutons « CSV », « Markdown » et « Tout effacer » à **1,08:1** | **3,02:1** — au-dessus du seuil de 3:1 de 1.4.11. Le jeton `--border-strong` est bien appliqué ; la valeur de 1,08:1 était celle de l'état inactif, que le critère exempte de toute façon |
| Sélecteur de langue à **75 × 21 px**, sous la cible de 24 px | satisfait **par l'exception d'espacement** de 2.5.8 |
| Titre d'une ligne de liste à **302 × 19 px** | satisfait par la même exception |

### L'exception d'espacement est calculée, pas supposée

Le critère 2.5.8 prévoit qu'une cible plus petite que 24 × 24 px reste conforme
si un cercle de 24 px de diamètre centré sur elle n'intersecte **aucune autre
cible**. Le harnais implémente ce calcul : il relève toutes les cibles peintes,
écarte le document lui-même et tout ce qui porte un `tabindex` négatif, puis
teste l'intersection.

Les cibles concernées — les deux liens de titre de la liste, et le lien vers la
page d'information ajouté depuis — sont **isolées**. Aucune ne réclame de
correction. (Le sélecteur de langue en faisait partie tant qu'il vivait dans la
fenêtre ; il n'y est plus, le réglage ayant été ramené à l'application.)

Réclamer une correction sur un critère mal appliqué coûte autant qu'en manquer
une : cela fait épaissir des lignes et déplacer des éléments pour rien.

---

## Ce qui passe, désormais mesuré sur des pixels

Onze paires de texte, plus quatre contours, relevés sur le document rendu, en
thème clair et en thème sombre. Toutes passent. Quelques-unes méritent d'être
notées :

| Élément | Mesure | Marge |
|---|---|---|
| Compteur, blanc sur l'accent | **5,18:1** | faible — c'est le couple que l'audit avait recalibré |
| Contour des boutons du pied, `--border-strong` sur la surface | **3,02:1** | **quasi nulle** |
| Contour d'une ligne de liste | **3,02:1** | même marge |
| Bouton neutre du pied, blanc sur l'encre | **17,4:1** | large |

Les deux marges de 3,02:1 sont l'enseignement de ce relevé : le projet a déjà
choisi, pour son accent, une marge minimale de 5,0:1 *parce qu'une valeur juste
au seuil est une valeur qui tombera*. Les contours n'ont pas eu cette attention.

---

## Le clavier

Dix arrêts de tabulation, obtenus par de **vrais appuis de touche** envoyés par le
protocole — pas en simulant des événements, ce qui ne déplacerait aucun focus et
ne prouverait rien.

```
langue → titre de la 1ʳᵉ ligne → supprimer → titre de la 2ᵉ → supprimer
       → voir les QR Codes → CSV → Markdown → tout effacer → page d'information
```

Chaque arrêt porte un anneau de focus visible, et le cycle se referme sans
dériver vers un élément invisible. La largeur imposée est bien de 380 px, sans
débordement horizontal.

---

## Le menu contextuel tel qu'il est réellement installé

Les cinq entrées candidates sont sondées une à une par
`chrome.contextMenus.update`, dont l'échec renseigne `runtime.lastError` — la
seule façon d'interroger un menu natif, qu'aucune API ne permet de cliquer.

| Entrée | État | Attendu |
|---|---|---|
| `urq-add-page` | présente | oui |
| `urq-add-link` | présente | oui |
| `urq-add-selection` | présente | oui |
| `urq-open-app` | absente | **oui** : la fiche publiée ne la mentionne pas |
| `urq-separator` | absente | **oui**, même raison |

L'entrée de sélection naissait **désactivée** : `installMenus()` appelait
`buildMenuDefinitions()` sans argument. L'utilisateur voyait une ligne grisée, et
la justification de permission publiée sur le Chrome Web Store annonçait pourtant
trois entrées fonctionnelles, dont « Add the selected text ». L'écart entre la
fiche et le comportement est exactement ce qu'un examinateur du magasin
recherche ; il est refermé.

Les deux entrées absentes le restent **par choix** : la fiche décrit trois entrées
d'ajout et ne parle ni de séparateur ni d'« Ouvrir ». En créer une de plus
rouvrirait le même écart dans l'autre sens.

**Ce que cette sonde ne peut pas dire.** `chrome.contextMenus` n'expose aucun
moyen de relire la propriété `enabled` d'une entrée. L'existence est constatée en
navigateur ; l'activation est tenue par un test unitaire sur le point d'appel de
production (`test/capture.test.js`).

---

## Le retour du clic droit

Le clic droit n'a qu'un retour : le badge de la barre d'outils.

| Cas | Texte | Fond mesuré |
|---|---|---|
| Ajout | `+` | `rgb(28, 124, 74)` — vert |
| Doublon | `=` | `rgb(244, 244, 244)` — **inversé** |
| Compteur au repos | le nombre | `rgb(26, 26, 26)` |

Le doublon partageait auparavant la couleur exacte du compteur : « déjà présent »
et « rien ne s'est passé » étaient indiscernables, et un lien déjà collecté
passait pour un ajout raté. Il **inverse** désormais le badge au lieu d'ajouter
une teinte à la palette — éclaircir le gris n'aurait fait qu'amoindrir le
contraste sur une icône orange. Le glyphe reste distinct dans les quatre cas, si
bien que la couleur n'est jamais la seule information (1.4.1).

Le retour dure 2,5 s au lieu de 1,5 : un clic droit se fait en regardant la page,
pas la barre d'outils.

**Et un défaut qui se lisait dans le code** : à l'installation neuve, la branche
sans consentement ouvrait l'onglet de la mention et **ne posait aucun badge**, là
où un refus explicite posait un `!`. L'utilisateur le moins au fait était le
moins renseigné. Les deux cas posent maintenant le même signal.

---

## La disposition ne rendait pas ses marges

Le premier en-tête de page ne s'imprimait jamais, et refusait de le faire en
annonçant « la marge actuelle est de **0** mm » alors que la première étiquette
était posée à 15,02 mm.

La cause : `computeSheet` ne rendait **pas** les marges. Les positions des
cellules les contiennent — `yMm` vaut la marge plus les rangées précédentes —
si bien que leur absence ne se voyait nulle part. Un appelant qui veut savoir où
**commence** la grille n'avait donc aucun moyen de les retrouver, sinon en
défaisant le calcul de la première cellule. L'en-tête lisait `layout.marginYMm`,
qui valait `undefined` : `nonNegative(undefined ?? 0)` en faisait zéro, et le
refus était fondé sur un chiffre qui n'existait pas.

Deux enseignements. D'abord, **le produit a dit la vérité** : c'est le message du
refus, affiché sous la case, qui a nommé le chiffre fautif — « 0 mm » là où
l'étiquette était à 15. Sans lui, la recherche aurait porté sur la géométrie,
puis sur le CSS, puis sur la position de l'élément. Ensuite, un objet de retour
qui n'expose que les conséquences d'un calcul oblige chaque appelant à le
refaire : la disposition rend maintenant `marginXMm` et `marginYMm`, et un test
vérifie qu'elles situent bien la première cellule.

---

## Une boucle de rétroaction dans l'aperçu

Corrigé au lot 5, et le diagnostic vaut d'être conservé parce que la mesure
accusait l'aperçu d'un écart dont la cause était dans l'ordre des opérations.

Le cadre de l'aperçu se dessinait à **685 px** dans une place de **670**. Stable,
reproductible, et un redimensionnement explicite n'y changeait rien : ni un
retard de mesure, ni un déclencheur manquant.

La cause tient en deux lignes :

1. `renderPreview` **vide** l'aperçu avant de le reconstruire ;
2. le vider fait disparaître sa barre de défilement verticale, donc la largeur
   utile augmente de quinze pixels — exactement l'écart mesuré.

L'échelle était donc calculée sur la largeur *sans* barre, le nouveau contenu
rappelait la barre, et le cadre restait plus large que la place réelle. La
correction : mesurer la largeur **une fois, avant de vider**, et s'en servir pour
tous les rendus de ce passage.

Ce que la mesure a coûté, et ce qu'elle apprend : trois hypothèses successives —
un retard de rendu, un déclencheur manquant, un observateur absent — ont été
écartées par la mesure avant que la bonne ne soit trouvée. Un écart **stable**
n'est pas un écart de temps.

---

## Un anneau de focus qui manque, sans que la règle soit en cause

Mesuré au lot 7 : un arrêt de tabulation sur dix — `#open-app`, puis `#export-md`
au passage suivant — sans anneau de focus. Reproductible deux fois, puis absent.

Le contrôle confondait deux causes : la règle de style qui ne s'applique pas, et
l'heuristique du navigateur. Il les distingue maintenant, en interrogeant
`element.matches(':focus-visible')` :

- `:focus-visible` **faux** → le navigateur n'a pas classé ce focus comme venant
  du clavier. C'est son heuristique, qui dépend de la modalité de la dernière
  interaction — et sous des appuis de touche envoyés par le protocole, elle peut
  faiblir. Ce n'est pas la règle qui est en cause.
- `:focus-visible` **vrai** et anneau absent → **c'est notre règle**. Le contrôle
  échoue, et il nomme l'élément.

Trois passages consécutifs donnent 121 constats satisfaits sur 121, le troisième
relevant l'artefact et le nommant. Un contrôle qui échoue au hasard finit par être
ignoré ; celui-ci dit ce qu'il a vu et pourquoi il ne conclut pas à un défaut.

---

## Le curseur de largeur du QR Code ne remonte pas tout seul

Constaté en éprouvant les options de la planche, et **laissé en l'état** : c'est
un arbitrage, pas un défaut à corriger seul.

Le curseur **Largeur du QR Code** est un réglage de l'utilisateur, mais ses
bornes sont recalculées à chaque rendu, parce qu'elles dépendent de la place que
le texte réclame. Quand les options demandent plus de place, la borne haute
descend et `applyQrSliderBounds` **écrête la valeur du curseur**. Quand la
contrainte se lève — on décoche le titre et l'URL — la borne remonte, mais la
valeur reste là où l'écrêtage l'avait laissée.

Mesuré sur une étiquette de 63,5 mm : borne haute **81 %** avec texte, **97 %**
sans ; le curseur, lui, passe de 81 % à 70 %, et le QR Code **rétrécit** de 62 à
54 px au lieu de grandir.

Le modèle, lui, est juste : ce que la fonctionnalité promet est de **permettre**
un QR Code plus grand, et la borne haute le dit. Rétablir automatiquement la
valeur choisie auparavant demande de décider ce qu'est « la valeur choisie »
quand elle n'a jamais été touchée, et si un réglage abandonné doit être
ressuscité. Le contrôle automatique porte donc sur la borne, pas sur la taille
dessinée — mesurer la seconde reviendrait à mesurer l'écrêtage et à l'appeler un
défaut.

---

## Un contrôle qui ne voyait rien, sans que le produit soit en cause

L'onglet « Étiquette (divers) » proposait trois réglages pour une seule question
— ce qui s'imprime sous le QR Code : une liste « Texte imprimé » à cinq modes
exclusifs, une case « Titre » qui s'ajoutait par-dessus, et un groupe de cases de
date. Il n'en reste qu'un, le groupe **Contenu de l'étiquette**, avec les mêmes
cases, dans le même ordre et sous les mêmes mots que l'onglet Niimbot. Deux
constats neufs le mesurent : la structure, et l'effet.

Le premier contrôle écrit pour l'effet **échouait**, avec des chiffres précis :

```
hauteur 206 px → date cochée : 254 px → décochée : 206 px
              → domaine coché : 206 px → retour : 206 px
```

La date suivait — 48 px de plus, puis retour exact. Le domaine, non : 206 px
avant, 206 px après. Le produit était pourtant en cause pour rien : le lien que
l'aperçu montrait portait une adresse de plus de cent caractères, dont le texte
atteint le **plafond de quatre lignes**. Une ligne de plus ne peut pas s'y voir,
puisqu'il n'y a plus de place pour elle. Deux contenus différents donnent la même
hauteur, et la mesure concluait à un défaut qui n'existait pas.

Le contrôle choisit donc ses conditions **par la mesure** :

- l'adresse **la plus courte** de la liste, prise sur les liens eux-mêmes ;
- un **rouleau continu de 62 mm**, où la hauteur suit le texte — sur un format à
  hauteur fixe, c'est le QR Code qui cède la place, et la hauteur ne bouge pas ;
- et il **compte l'encre** plutôt que les lignes : les pixels noirs du canevas
  (140 363 avec la date contre 139 082 sans, 140 009 pour l'URL et le domaine
  contre 139 082 pour l'URL seule). Ajouter du texte écrit des caractères de
  plus, même quand le nombre de lignes ne change pas.

C'est la leçon, et elle est l'inverse de celle du piège de peinture : là, quatre
constats concordants **fabriquaient** un défaut ; ici, un constat unique
**cachait** une fonctionnalité qui marchait. Dans les deux cas, la cause est la
même — la mesure portait sur autre chose que ce qu'elle croyait mesurer.

---

## Deux réglages réclamés : la taille du titre, et celle du QR Code

Demandé : « ajouter dans layout un champ pour la taille du titre en plus de la
taille du texte », et « pour le Niimbot M2 et M3, pouvoir changer la taille du QR
Code car on a de la place quand on compare au D110 ».

**Une taille de titre, indépendante du texte.** Le titre s'écrivait en gras à la
taille du texte : aucun réglage ne pouvait l'alléger ou le mettre en avant.
Mesuré dans l'application, sur un D110 : le titre passe de 1,2 à 3 mm, et
l'étiquette dessinée change — **11 720 pixels d'encre puis 15 540**, pour une
hauteur de 362 px puis 422 px.

La géométrie devait apprendre ce qu'elle ignorait : ses rangées supplémentaires
ne s'interlignent pas toutes à la même hauteur. Elle reçoit donc **combien de ces
rangées sont des rangées de titre** et à quelle taille, et les deux dispositions
— empilée et tournée — comme le dessin s'en servent. Sans taille demandée, le
titre reprend celle du texte **retenue**, au pixel près : aucun appelant existant
ne change de comportement, et la suite le vérifie.

**Une taille de QR Code, sur les têtes qui ont la place.** Le QR Code prenait
toujours la plus grande part de la largeur utile — 95 % — quel que soit le
modèle. Sur une tête de 12 mm c'est la seule possibilité ; sur une tête de 48 ou
72 mm, c'était un choix imposé. Le champ existe donc là où il agit, et **n'est pas
affiché sur un D110** : le projet retire les commandes sans effet plutôt que de
les laisser mentir.

La demande est bornée des deux côtés, et le relevé le mesure sur un M2 :
**15 mm → 4 px par module, 40 mm → 12 px par module**, champ visible ; sur un D110,
champ masqué. Le plancher est la lisibilité — 2 px par module, sous lequel une
tête thermique fusionne les points — et le plafond la place réelle. Le côté obtenu
est un **nombre entier de modules** : c'est ce qui empêche un QR Code arrondi au
pixel de ne plus se lire. La ligne sous le champ annonce la taille obtenue,
l'intervalle permis, et dit quand la demande a été ramenée à ce qui tient.

**Ce que le contrôle ne dit pas.** Il ne juge pas si le titre est *beau* à telle
taille, ni si l'utilisateur trouvera le réglage : il vérifie qu'il agit, et qu'il
n'apparaît pas là où il ne peut rien.

---

## Le titre était coupé à la largeur, dans une bande qui court sur la longueur

Signalé : « en fonction de la taille du supply on est coupé, alors qu'on a de la
place pour afficher du texte — surtout avec le texte tourné ».

**Mesuré avant correction**, sur la disposition *texte tourné* d'un 12 × 75 mm :

| | Avec le titre | Sans le titre |
|---|---|---|
| Rangées composées | **4** | 2 |
| Encre du canevas | 20 268 px | 18 272 px |

Le titre (63 caractères) coûtait donc **deux** rangées, et l'encre n'augmentait
que de 1 996 px là où le titre entier en vaut près du double : **la moitié du
titre était perdue**, et la bande avait de quoi l'écrire — chaque rangée de titre
n'occupait que 72 px sur les 490 px que la bande offrait.

La cause se lit dans le code : les lignes du titre étaient découpées, par
`composeLabel`, à la **largeur** de l'étiquette — la contrainte de la disposition
empilée, où les rangées s'empilent effectivement sur cette largeur. Dans la bande
tournée, chaque rangée court sur la **longueur**. La bande redécoupait bien le
corps du texte pour cette raison, et son commentaire le disait ; le titre, lui,
gardait la découpe de l'autre disposition.

**Correction** : quand l'appelant fournit le titre **en clair**, la bande le
redécoupe elle-même à sa longueur, comme elle le fait du corps. Sans titre en
clair, les lignes fournies sont conservées — les appelants qui ne passent que des
lignes ne changent pas de comportement.

| | Avant | Après |
|---|---|---|
| Rangées pour le titre (12 × 75 mm) | 2 | **1** |
| Rangées au total | 4 | **3** |
| Encre | 20 268 px | **24 261 px** |
| Même mesure sur 12 × 109 mm | 3 rangées, 20 417 px | **2 rangées, 24 373 px** |

Sur l'étiquette la plus longue, **une rangée de moins et 3 956 px d'encre de
plus** : c'est le titre qui revient.

**Et quand le texte ne peut réellement pas tenir**, le produit le dit désormais.
Le calcul le savait — la boucle de composition cherche une taille où tout entre —
et le taisait : une adresse tronquée sortait sans un mot. L'aperçu affiche
« Texte coupé : il ne tient pas entier sur cette étiquette. Raccourcissez
l'adresse, décochez du contenu, ou prenez une étiquette plus longue. », du même
genre que le refus de largeur du QR Code.

**Ce que le contrôle ne dit pas.** Il mesure le coût du titre en rangées et
l'encre déposée, sur un 12 × 75 mm ; il ne juge pas la lisibilité du résultat ni
la bonne coupe des mots. Une étiquette de 12 × 22 mm avec un titre long et une
adresse longue ne peut pas tout porter à une taille lisible : le produit le dit,
il ne le résout pas.

---

## Le tableau imprimé s'arrêtait au bas de la première page

Signalé : « en mode tableau, quand une ligne est coupée, il faut gérer
l'impression multi-pages » — et la même question posée pour la planche.

**Mesuré avant correction**, sur 45 liens, avec la médiation d'impression du
protocole (`Emulation.setEmulatedMedia` : sans elle, `#print-root` est en
`display: none` et toute la géométrie se lit à zéro — c'est le premier piège
retombé ici) :

| | Tableau | Planche |
|---|---|---|
| Boîtes de page construites | **1** | 2 |
| Hauteur de page utile | 1 123 px | 1 123 px |
| Contenu à imprimer | **2 596 px** | — |
| Lignes hors de la page | **27 sur 46** | 0 |
| Dernière ligne coupée | **oui** | non |
| Pages du PDF du navigateur | **1** | 2 |

La cause est dans la feuille de style et dans un seul appel : `.print-page` a la
hauteur du papier **et** `overflow: hidden`, et `printSelection` n'en construisait
qu'une, quelle que soit la longueur du tableau. Tout ce qui dépassait était donc
tranché au bord de la feuille — sans un mot dans l'interface.

**La correction découpe le tableau en pages réelles**, comme la planche le fait
déjà. Elle **mesure** les hauteurs au lieu de les estimer : les lignes sont
montées une fois dans une page aux vraies cotes, posée hors de l'écran mais
**mise en page** — `visibility: hidden` conserve la mise en page, contrairement à
`display: none` — puis `paginateByHeight` dit où couper :

| | Avant | Après |
|---|---|---|
| Pages construites | 1 | **3** (18 + 18 + 13 lignes) |
| Lignes hors de la page | 27 | **0** |
| Adresses manquantes | 21 | **0** |
| En-tête répété par page | — | oui, sur les 3 |
| Pages du PDF du navigateur | 1 | **3** |

L'encodage des QR Codes n'a lieu qu'une fois : les lignes sont **déplacées** d'un
tableau à l'autre, jamais refaites. L'aperçu montre les deux premières pages, et
sa légende annonce ce que rien ne disait — « 49 lignes imprimées sur 3 pages. »

Le calcul vit dans `src/core/pagination.js`, et il est **pur** : il reçoit des
hauteurs, il rend des tranches. Trois règles y sont tenues par des tests — l'ordre
d'impression est conservé, une ligne plus haute qu'une page occupe sa page seule
plutôt que d'être coupée, et une mesure absente rend **une** page au lieu d'une
par ligne. La planche, elle, était déjà correcte : le contrôle le vérifie
désormais, pour qu'un correctif d'un côté ne casse pas l'autre.

**Ce que le contrôle ne dit pas** : la mesure porte sur les liens semés par le
relevé, pas sur une collection réelle de plusieurs centaines de liens. **La
longueur a donc été poussée plus loin**, hors relevé, avec l'instrument :
à **150 liens**, le tableau sort sur **9 pages** — 18 lignes par page, 0 hors
page, 0 adresse manquante, PDF de 9 pages — et la planche sur **7 pages**, 150
étiquettes dont aucune hors page. Le nombre de pages suit donc bien la longueur,
et pas seulement le cas de 45.

### Trois pages de tableau, cinq pages mesurées

Le passage de l'A4 3 × 8 à l'A4 3 × 4 par défaut a fait tomber un contrôle : le
tableau construisait **3 pages** et le PDF du navigateur en sortait **5**. Le
soupçon portait sur le produit — la taille de texte par défaut suit la hauteur de
l'étiquette, 69 mm au lieu de 33,9 mm donnant un corps plus grand, que le tableau
imprime aussi.

**Le soupçon était faux, et deux mesures l'ont montré.** D'abord sur un profil
neuf, avec `node scripts/measure-print-pages.mjs 49` : le tableau construit 3
pages **et** le PDF en sort 3. Ensuite en relisant le relevé : les 5 pages
mesurées étaient celles de la **planche**, restées dans la racine d'impression.
La séquence du contrôle préparait le tableau, puis la planche, et imprimait
ensuite — et `beforeprint` ne rebâtissait rien, puisque la racine n'était pas
vide. Trois pages annoncées, cinq pages mesurées : la mesure portait sur un autre
document que celui qu'elle nommait.

C'est le piège de peinture du début de ce fichier, retourné. Là, quatre constats
concordants **fabriquaient** un défaut inexistant ; ici, un chiffre unique
accusait le produit d'un défaut qui était dans l'instrument. La règle est la même
dans les deux sens : **une mesure qui accuse demande une seconde source**.

Deux corrections en sont sorties, l'une pour l'instrument, l'autre pour le
produit :

1. **Le contrôle prépare le tableau pour de bon avant d'imprimer**, au lieu de
   compter sur l'état laissé par la mesure précédente. Ce qu'il mesure est ce
   qu'il nomme.
2. **Le produit rebâtit la racine quand le mode a changé** : `beforeprint`
   n'était appelé que sur une racine **vide**, si bien qu'un Ctrl+P après un
   changement d'onglet imprimait les pages de l'autre mode — exactement ce que le
   relevé venait de faire sans le vouloir. Le mode qui a rempli la racine est
   désormais retenu, et la racine est refaite s'il diffère.

---

## « Paysage » dans l'interface anglaise, ou l'angle mort du relevé des clés

Signalé : « la traduction anglaise de *Orientation de la page > Paysage* est
fausse, utiliser *Landscape* ». La mesure a donné autre chose qu'une faute de
traduction : **la clé n'existait pas**. Le catalogue anglais ne portait aucune
entrée pour « Paysage », et `t()` retombait donc sur le français — ce que le
produit fait exprès, et qu'un test couvre.

Pourquoi rien ne l'avait vu : le relevé des clés de `test/i18n.test.js` lit les
appels `t('…')` **littéraux** et les attributs `data-i18n`. Or ces libellés-là ne
sont pas écrits à l'endroit où ils s'affichent — ils vivent dans des tableaux, et
sont donnés à `t()` par variable : `t(entree.label)`. L'expression régulière ne
les voit pas. Ils étaient donc invisibles **et** non traduits.

L'inventaire, fait en parcourant ces listes une à une, en a trouvé dix-huit
autres du même genre :

| Liste | Libellés sans traduction |
|---|---|
| Sens de la feuille | « Paysage » |
| Dispositions du texte | les **cinq** |
| Consommables | douze — `(bijouterie)`, `(câble)`, `(auto-pelliculé)`, et les sept `(rond)` |

Dans l'interface anglaise, la liste des dispositions s'affichait donc **entièrement
en français**, et quatre consommables portaient un mot français. Le relevé mesure
désormais les listes **telles qu'elles s'affichent**, en anglais :
`orientation : Portrait, Landscape — 4 disposition(s), 15 consommable(s)`, sans
aucun reste français.

Le contrôle de clés a été étendu à ces listes, avec un partage explicite : un
libellé qui ne contient que des nombres, des unités et des marques — « 12 × 22 mm »,
« Brother QL — 62 mm (300 dpi) » — n'a pas besoin d'entrée, et l'exiger
remplirait le catalogue de traductions sans effet. Le partage tombe juste : **47
libellés à traduire, 35 neutres, aucun manquant**. Un contrôle qui réclame pour
rien finit par être ignoré ; c'est la raison du tri.

**Ce que le contrôle ne dit pas.** Il vérifie que chaque libellé **a** une
traduction, jamais qu'elle est **bonne** : « Landscape » est présent, et c'est
l'anglais. Juger la qualité d'une traduction demande un lecteur, pas une
expression régulière.

---

## Le vide sous les champs, ou 315 px perdus

Un défaut signalé à l'œil — « la note de collection est trop bas, il y a trop
d'espace » — et mesuré avant d'être corrigé. La feuille portait :

```css
.field { display: flex; flex-direction: column; flex: 1 1 160px; }
```

`flex-basis: 160px` était pensé pour une **rangée** (`.fields`), où la base est
une largeur. Mais la règle visait `.field` lui-même, donc aussi les champs
enfants directs d'un panneau — une **colonne**, où la base devient une hauteur.

Rendu réel, avant correction (1280 × 900, `deviceScaleFactor: 2`) :

| Conteneur | Champ | Hauteur | Vide sous le libellé |
|---|---|---|---|
| panneau collection | Nom de la collection | 160 px | 109 px |
| panneau collection | Note de la collection | 160 px | 94 px |
| panneau mise en forme | Le QR Code pointe vers | 160 px | 107 px |

Trois champs, 310 px de vide, et un panneau de 1099 px dans une fenêtre de
900 px — la note repoussée de 109 px vers le bas, les boutons d'export hors de
vue. Après correction (`.fields > .field` porte désormais la base) : 51, 66 et
53 px, **zéro** vide, panneau de 896 px, qui tient dans la fenêtre.

Aucun test ne pouvait l'attraper : c'est une mesure de rendu, pas une
déclaration. Le contrôle est donc dans le relevé Chrome (hauteur des champs
nuls) et non dans la suite Node, qui ne mesure pas la mise en page.

---

## Un constat de service qui échouait au hasard

Le contrôle du raccourcissement bloquait `*tinyurl.com*` puis dormait 2500 ms.
Or le service **espace ses requêtes** de 800 ms (`spacingMs`), et la collection
en compte trois : le lot demandait à peu près exactement le délai fixé, et le
constat passait ou échouait selon quelques centaines de millisecondes. Il est
tombé rouge deux fois sur trois après un changement sans rapport.

Un constat qui dépend du hasard ne prouve rien. Le relevé **attend maintenant
la fin du lot** — l'indice cesse d'annoncer « n/3… » — avec un plafond de 30 s,
puis lit l'état final. Même chose pour le glissement : il attend que l'ordre
soit réécrit, puis recharge la page pour le relire à l'affichage.

---

## Le glissement, éprouvé avec de vrais événements souris

Le rangement a été vérifié par `Input.dispatchMouseEvent` : appui sur la
poignée, six mouvements, relâchement. Pas des `PointerEvent` fabriqués en
script — un événement synthétique ne peut pas capturer de pointeur, et
`setPointerCapture` lève alors une exception : le chemin de capture serait
resté non vérifié, ce qui est précisément la partie fragile du geste.

Relevé : l'ordre affiché change, les rangs se renumérotent (1 → 3), et un
**rechargement complet** rend le même ordre — l'écriture est donc bien en
base. Comparer au tableau stocké, lui, ne prouve rien : le magasin garde ses
entrées en place et ne met à jour que le champ `order`.

---

## Capturer le pointeur sur la ligne qu'on déplace, et perdre le geste

Le premier relevé du glissement a échoué, et deux détails ont désigné la cause
sans ambiguïté :

```
rangs 2,1,3 · 1 ligne(s) encore saisie(s)
événements {"appui":1,"bouge":5,"relache":0,"annule":0,"perdu":1}
```

`relache: 0` — le relâchement du doigt n'est **jamais arrivé**. `perdu: 1` —
`lostpointercapture` a été émis en plein geste. Et les rangs inchangés disent
que rien n'a été écrit, alors que la ligne avait bel et bien bougé à l'écran.

La cause est structurelle : ranger une ligne, c'est la **retirer du document**
(`insertBefore`) pour la réinsérer plus loin. Ses descendants sont détachés au
passage, et le navigateur relâche aussitôt la capture de pointeur que porte la
poignée. Les mouvements continuaient d'atteindre l'élément sous le curseur — ce
qui donnait l'illusion que le geste suivait — mais le relâchement, lui, n'avait
plus de destinataire.

La capture se prend donc sur **la liste**, qui ne quitte jamais le document.
C'est une correction d'une ligne, mais elle ne se déduit pas : elle se mesure.
Le contrôle porte maintenant, en plus de l'ordre, le nombre de lignes restées
marquées « en cours de glissement » — un geste interrompu se distingue ainsi
d'une écriture refusée.

---

## Les deux doublons de l'onglet Niimbot, confirmés

Libellés relevés dans l'interface française :

| Question | Premier endroit | Second endroit |
|---|---|---|
| Quel lien ? | « Lien à imprimer » (`#label-link`, 3 options) | « Quels liens » (`#print-scope`, 2 options) |
| Combien d'exemplaires ? | « Copies » (`#copies`) | « Exemplaires de chacun » (`#print-copies`) |

Deux sélecteurs et deux compteurs répondent à la même question, dans le même
onglet. Le regroupement demandé porte donc sur quatre champs et deux boutons.

**Le bloc « série » tient déjà ses deux champs sur une ligne** à toutes les
largeurs mesurées, de 1280 px à 380 px : le défaut n'est pas là. Il est dans la
duplication, pas dans l'alignement.

---

## Ce qui n'a pas pu être vérifié, et qui doit être dit comme tel

- **Le menu contextuel ne se clique pas.** Aucune API n'ouvre le menu natif ni
  n'en choisit une entrée. L'existence des entrées a été sondée ; leur *effet* ne
  peut être obtenu qu'à la main — ce que le produit **fait** de ce que le
  navigateur lui donne est mesuré depuis le 30 septembre 2026, voir « L'ajout au
  clic droit, éprouvé sur le produit lui-même ».
- **Le pré-remplissage du titre, dans la fenêtre, n'est pas éprouvable ici.**
  `chrome.tabs.query` ne rend l'URL et le titre d'une page ordinaire qu'avec
  `activeTab`, que Chrome n'accorde qu'au clic sur l'icône de la barre d'outils —
  un geste qu'un relevé automatisé ne produit pas. Mesuré : l'onglet actif rend
  une URL vide, la fenêtre prend la branche « cette page ne peut pas être
  enregistrée ». Seule la cohérence du champ et du bouton est mesurée.
- **Le comportement en fenêtre privée n'est pas reproduit** : Chrome n'ouvre pas
  de fenêtre privée avec l'extension chargée en mode automatisé. La collection
  privée n'existe donc pas dans ce profil, et une capture marquée privée y
  retombe sur la collection courante — le contrôle du clic droit n'exerce que le
  chemin public.
- **La fenêtre réelle n'est pas ouvrable.** `popup.html` a été chargé dans un
  onglet : même document, mêmes règles, même largeur imposée de 380 px — mais pas
  le même cadre. Un défaut qui ne dépend que du document se voit ici ; un défaut
  lié au cadre du popup, non.
- **Le bug YouTube n'a pas été reproduit en conditions réelles**, pour la raison
  ci-dessus : le scénario se joue au clic droit. Sa cause a été établie autrement,
  au niveau où la décision se prend — voir plus bas.
- **L'impression d'une planche sur papier** n'a pas été faite : aucun matériel
  n'est connecté à cette machine. C'est la seule partie de la portée restante de
  l'audit qui reste entière.

---

## Le bug YouTube, établi autrement

Chrome remplit `info.linkUrl` **dès que le clic tombe sur un lien, quel que soit
l'item de menu choisi**. L'accueil et les pages de chaîne de YouTube sont des
grilles de vignettes, donc des liens ; une page de vidéo se clique dans le vide.

L'ancienne version donnait la priorité au lien visé : « Ajouter cette page »
enregistrait donc la vidéo, jamais la page. L'utilisateur, ne trouvant pas ce
qu'il avait demandé, concluait que l'ajout n'avait pas eu lieu.

| Geste, ancien comportement | Ce qui était enregistré |
|---|---|
| Clic droit sur une vignette, item « Ajouter cette page » | l'URL de la **vidéo**, titre `youtube.com` |
| Clic droit dans le vide d'une page de vidéo, même item | l'URL de la vidéo, titre de la page |

**La règle est désormais : l'item choisi commande.** Trois causes concouraient, et
les trois sont traitées : le titre perdu sur les vignettes, le doublon muet, et
l'absence de retour lisible. Sept tests fixent la nouvelle règle dans
`test/capture.test.js`.

---

## L'ajout au clic droit, éprouvé sur le produit lui-même

Signalé le 29 septembre 2026 : « sur la page d'information, sur l'utilisation, on
a deux façons d'utiliser l'extension — soit avec le clic droit, soit via le bouton
de l'extension — car l'ajout au clic droit peut jouer des tours. Il faudra bien
faire des tests plus poussés plus tard. »

**Le menu natif ne se clique toujours pas** : aucune API n'ouvre un menu
contextuel, et c'est écrit plus haut dans ce fichier. Ce qui **est** éprouvable,
c'est ce que le produit fait de ce que le navigateur lui donne — les trois entrées
passent par `captureFromClick`, puis par `record`. Le relevé les appelle donc
**dans le service worker**, avec les `info` que Chrome fournit réellement, et lit
ce qui en sort. Cinq contrôles en sont nés :

| Contrôle | Mesure |
|---|---|
| Trois entrées, trois cibles | page `https://exemple.fr/accueil` · lien `…/article-vise` · sélection `https://autre.fr/selection` |
| L'item commande, même sur une image | « Ajouter cette page » sur une image → la **page**, et le titre de la page (« Accueil — exemple.fr ») |
| Les trois chemins enregistrent | 4 → 7 liens, badge `+` pour chacun ; titres : celui de la page, le domaine pour un lien, rien pour une sélection |
| Page déjà collectée | 7 liens **avant et après** le second ajout, badge `=` |
| Page interdite (`chrome://`) | capture `null`, badge `!` |

Le contrôle de l'image est celui du bug YouTube, rejoué : Chrome remplit
`linkUrl` dès que le clic tombe sur un lien, et le produit doit malgré tout
enregistrer ce que l'item annonce. Et le relevé **se rend propre** : il retire les
liens qu'il a ajoutés, un contrôle l'atteste (4 liens rendus pour 4 avant), sans
quoi la planche de 49 liens mesurée ensuite ne serait plus celle qu'elle annonce.

**Ce que ces contrôles ne disent pas.** Que le menu *affiche* ces entrées dans ces
contextes : la sonde d'existence (`chrome.contextMenus.update`) dit qu'elles sont
installées, pas qu'elles apparaissent sur une image ou sur un texte sélectionné.
Et le chemin réel — le clic dans le menu natif — n'est pas exercé : c'est ce que
la note garde ouvert pour un essai à la main.

**La fenêtre, et ce qu'elle peut dire de la page courante.** Le pré-remplissage du
titre repose sur `activeTab`, que Chrome n'accorde **qu'au clic sur l'icône de la
barre d'outils**. Un relevé automatisé ne fait pas ce clic : mesuré ici,
`chrome.tabs.query` rend un onglet **sans URL ni titre**, la fenêtre prend donc la
branche « cette page ne peut pas être enregistrée », et le pré-remplissage n'est
pas éprouvé. Ce qui est mesuré, c'est la **cohérence des deux commandes** : le
champ (`#link-title`, texte, 300 caractères) et le bouton sont dans le même état
— un champ qui accepterait une saisie que le bouton refuserait serait un piège.

---

## La passe de rédaction : ce qui est attesté, ce qui ne l'est pas

Signalé le 29 septembre 2026 : « il faudra faire une passe avec un rédacteur qui
teste et atteste des dires du manuel et de la FAQ ». C'est la règle appliquée ici :
**chaque affirmation contrôlée a une mesure ou un test derrière elle**, et ce qui
n'en a pas est écrit comme tel plutôt que reformulé.

### Attesté par une mesure dans ce relevé

| Affirmation | Où | Mesure |
|---|---|---|
| « Vous y choisissez votre imprimante, ou un fichier » — la fenêtre d'impression du navigateur prend le relais | page d'information, guide | Chrome produit le PDF par son propre paginateur : tableau 49 lignes → **3 pages**, planche → **5 pages**, `@page` du produit honoré (`preferCSSPageSize`) |
| « Exporter la planche (ZIP) » produit trois fichiers : `planche.html`, `planche.json`, `liens.csv` | guide, README | archive relue **par le lecteur du produit** : `liens.csv, planche.html, planche.json` |
| « La page exportée **est** celle de l'aperçu » | guide | proportions mesurées identiques : `0,3024 × 0,2325` à l'aperçu comme à l'export |
| Les étiquettes s'exportent **sans aucune imprimante** | guide, « Étiquette (divers) » | export mesuré sans imprimante connectée : ZIP `Mes-liens-niimbot…`, 1 image, profil D110 / 12 × 22 |
| « Les images sont des PNG à une échelle donnée » | page d'information | dimensions mesurées = celles de la tête : **96 × 197 px** annoncés, 96 × 197 obtenus |
| L'aperçu annonce son échelle, plafonnée à quatre fois la taille réelle | guide | « Aperçu à 4,0 × la taille réelle (12,0 × 25,8 mm) », et 182 px → 45 px à la taille réelle |
| Imprimantes prises en charge : **D110, M2, M3** | page d'information, guide | noms lus **dans le code** (`PROFILES`) par `test/site-redaction.test.js` : une page qui citerait une machine absente du produit échoue |
| « Aucun service n'est contacté au chargement, ni à la collecte » | README | compté dans le navigateur : ressources demandées au chargement puis après une collecte, **aucune hors de l'extension** |
| « L'URL d'origine n'est jamais remplacée » | README, guide | `shortUrl` est un champ **à côté** de `url` ; l'étiquette ne prend le raccourci que si on le demande (`veutLeRaccourci`), et `test/shorten.test.js` fixe les deux cas |

### Les limites annoncées : il n'y en a pas

Le point de la note — « les limites annoncées : longueurs de titre, de note, de
collection » — s'est révélé **vide** : ni le guide, ni le README, ni la page
d'information n'annoncent de longueur maximale. Rien à attester, donc, et rien à
corriger : les limites du produit vivent là où elles s'appliquent, dans les champs
eux-mêmes — 300 caractères pour un titre, 600 pour une note de collection, 80 pour
un nom. Un document qui les annoncerait prendrait le risque d'annoncer faux.

### Attesté par un test, et non par ce relevé

- **`table.json`, `table.html`, `qr/<id>.png`** (dossier du tableau) :
  `test/table-export.test.js` relit l'archive et vérifie son contenu ;
- **le tableur avec les QR Codes**, le **CSV**, le **Markdown** et l'**archive
  JSON** : `test/spreadsheet.test.js`, `test/table-export.test.js`,
  `test/import.test.js` — dont l'aller-retour d'un export vers un import ;
- **les noms de consommables et de préréglages** cités par la page d'information :
  lus dans le code par `test/site-redaction.test.js`.

### Ce qui reste **non attesté**, et qui doit se lire comme tel

1. **La fenêtre d'impression sur Safari et sur Brave.** La mesure ci-dessus est
   faite dans Chrome. `npm run verify:brave` existe, mais il exige Brave **et un
   accès réseau** (le raccourcissement interroge un vrai service) ; Safari n'a pas
   d'instrument équivalent. Ce que chaque navigateur propose réellement dans sa
   fenêtre d'impression reste donc à voir, à la main.
2. **L'impression sur papier.** Aucun matériel n'est connecté à cette machine :
   tout ce qui est mesuré ici l'est sur le document rendu, jamais sur une feuille.
3. **L'élégance.** Ce relevé porte sur des positions, des contrastes et des
   accords ; il ne dit rien du goût — c'est l'objet de la note ouverte.

---

## Comment relancer

```bash
npm run build          # produit dist/extension
npm run verify:chrome  # éprouve dans Chrome et écrit le relevé
```

Le script utilise un **profil isolé** (`.verify-chrome/profile`), redirige les
téléchargements et **tue le navigateur par SIGKILL** : un SIGTERM déclenche sa
boîte de confirmation, qui reste à l'écran et bloque l'arrêt. Trois précautions
reprises de `verify-brave.mjs`, apprises d'un incident où des vérifications
écrites à la volée avaient laissé un navigateur ouvert et des téléchargements
échoués chez l'utilisateur.

Le relevé complet est écrit dans `.verify-chrome/releve.json` et les captures
d'écran dans `.verify-chrome-captures/`.

Pour **regarder** l'interface plutôt que la mesurer, quand un défaut se signale à
l'œil sans qu'on sache où :

```bash
node scripts/shot-app.mjs 1280 /tmp/captures
```

Le script ouvre l'application embarquée dans un profil à part, capture la fenêtre
et imprime la position et la hauteur réelles de chaque bloc du panneau de
collection — c'est ainsi qu'un champ de 160 px pour 51 px de contenu a été
trouvé. Il ne porte aucun verdict : il rend des images et des nombres.

Pour **mesurer la pagination** d'une collection de longueur choisie, et garder
les PDF produits par le navigateur :

```bash
node scripts/measure-print-pages.mjs 45
```

Il sème la collection demandée, remplit la racine d'impression par un
`beforeprint` envoyé à la main — la boîte de dialogue système est bloquante, et
`window.print()` arrêterait le script —, mesure chaque page sous médiation
d'impression, puis rend deux PDF dans `.verify-chrome-pages/`. Les constats du
relevé portent la même mesure sur 45 liens ; ce script sert à en essayer une
autre longueur.

Pour **comprendre une grille automatique** — pourquoi celle-ci et pas une autre —
sans passer par le relevé entier :

```bash
node scripts/measure-auto-layout.mjs 49 a4-3x4 tous
```

Il importe le **même module** que l'application (`core/sheet.js`, servi en HTTP
pour que Chrome accepte un module ES) et mesure le texte par un canevas réglé sur
la même police. Il rend la courbe du besoin (lignes réclamées par largeur), ce que
le calcul à deux passes choisissait, ce que le rendu en ferait — lignes coupées
comprises — et la table des grilles candidates. C'est l'instrument qui a établi
que le défaut du 30 septembre 2026 tenait à une largeur, et non à la formule.

Pour **éprouver un ajout par clic droit**, du service worker à l'application :

```bash
npm run build
npm run verify:menu
```

Aucune API n'ouvre puis ne choisit une entrée du menu natif : le script exécute
donc **les modules du service worker** hors navigateur — `captureFromClick`, le
magasin, la normalisation —, écrit l'enregistrement obtenu dans une vraie
extension chargée, recharge l'application et lit la ligne affichée. Il rend son
verdict : la destination est enregistrée, l'application l'affiche, et la même page
ajoutée par son adresse directe est reconnue comme un doublon.

Pour **éprouver ensemble le compteur de l'icône et « Vider la collection »**,
depuis les deux pages qui portent le bouton :

```bash
npm run build
npm run verify:badge
```

Le script charge une vraie extension, sème trois liens, puis vide la collection
**d'abord depuis l'application, ensuite depuis la fenêtre**, en relevant à chaque
fois le badge de l'icône, ce que l'application affiche et ce que la fenêtre
affiche. Il rend son verdict : après l'un ou l'autre vidage, les trois doivent
dire la même chose. Ce qu'il ne fait pas : il ne déclenche aucun clic droit —
aucune API ne choisit une entrée du menu natif —, donc le retour transitoire
(« + », « = », « ✎ ») reste du ressort de `verify-chrome.mjs` et de
`test/extension-bundle.test.js`.

Pour **regarder le choix d'import**, qui ne s'ouvre qu'après un fichier lu :

```bash
node scripts/shot-import.mjs
```

Il sert l'application construite, lui pose une API d'extension en mémoire — c'est
ce qui fait exister plusieurs collections, donc un choix à proposer —, puis
déclenche un **vrai** import en posant un fichier sur le champ de fichier par
`DataTransfer`. Le chemin est donc celui de l'utilisateur : lecture, panneau,
libellés, et le nom vidé qui suit. Il relève les libellés tels quels, mesure le
débordement des trois issues plutôt que de l'estimer, et rend deux captures dans
`.verify-chrome-captures/`.

Ce qu'il ne fait pas : il n'ouvre pas la page de l'extension, et ne clique aucun
des trois choix — cela écrirait dans le stockage. Les trois issues et le nom vide
sont exécutés pour de bon dans `test/web-import.test.js`.

## L'en-tête de la fenêtre, et ce qu'elle ne fait pas

Le contrôle charge `popup.html` dans un onglet et lit le document rendu. Trois
constats y portent sur une **absence** autant que sur une présence :

1. **L'en-tête porte le nom de la collection, entre ses deux flèches.** L'icône
   du produit le précède, avec son alternative textuelle — le nom du produit
   n'est plus écrit en clair, il occupait la place du seul titre qui informe.
2. **La fenêtre ne crée pas de collection.** Créer, renommer et supprimer se
   font dans l'application : ces gestes demandent un nom, une note, et la place
   de les relire. Un contrôle statique (`test/extension.test.js`) vérifie en
   plus que ni `collection-add` ni `collection-new` n'existent dans le document.
3. **Le choix de la langue n'y est plus.** Le sélecteur vit dans l'application ;
   la fenêtre suit la langue mémorisée, et la page d'information qu'elle ouvre
   suit la même.

## Une seule action sur la ligne du lien court

Le contrôle signalé : « la case *encode the short link* dans la liste n'est pas
claire, surtout quand on clique sur l'hyper lien ». Deux intentions vivaient dans
le même bloc — l'adresse courte était un lien (pour aller la vérifier) et, juste
en dessous, une case dont la phrase ne disait pas *laquelle* encoder.

La case porte maintenant l'adresse comme libellé : on coche ce qu'on lit, la ligne
n'a plus qu'une action, et l'adresse courte reste vérifiable dans l'éditeur de la
ligne — le seul endroit d'où l'on peut la contrôler avant d'imprimer.

Le relevé vérifie les deux bouts : une seule case, sur le seul lien qui a un
raccourci ; son libellé nomme ce qu'elle encode (« Encoder https://is.gd/abcd pour
« Un article de fond » ») ; la cocher encode le raccourci sans toucher au réglage
global ; la décocher rend exactement l'état d'avant.

## La mise en page automatique calculait la grille sans regarder le contenu

Le signalement : « la mise en page automatique n'est pas optimale, ça calcule mal
l'espace disponible, ça calcule mal les espacements, l'équilibre. Il est par
exemple absurde de proposer 11 colonnes quand on a que 5 liens ».

C'était exact, et la cause tenait en une ligne : `autoSheetLayout` cherchait la
grille **la plus dense** qui tienne à la taille minimale d'étiquette, puis
agrandissait les étiquettes pour remplir la page. Elle ne savait pas combien
d'étiquettes il y avait à placer. Cinq liens donnaient donc 11 × 7 = 77 cases —
des timbres, et une page à moitié vide.

Le calcul reçoit maintenant le **nombre d'étiquettes**, et choisit la grille en
trois temps :

1. **la grille doit contenir le contenu, et pas davantage** — une case vide est
   une étiquette qui n'existe pas ; on tolère la case qui rend la grille
   équilibrée, jamais deux ;
2. **une lame n'est pas une étiquette** — à remplissage égal, on écarte les
   grilles dont l'étiquette s'éloigne de plus du double de la forme du contenu ;
3. **la plus grande étiquette gagne** — les cotes restantes sont partagées, donc
   les étiquettes occupent la page jusqu'à ses bords.

Ce que cela donne sur une A4 (marges 8,5 mm, écarts 1,25 mm), mesuré par un test
unitaire qui parcourt treize nombres d'étiquettes :

| Liens | Grille | Étiquette |
|---|---|---|
| 1 | 1 × 1 | 193 × 280 mm |
| 3 | 1 × 3 | 193 × 92 mm |
| **5** | **2 × 3** | **96 × 92 mm** — et non 11 × 7 |
| 12 | 3 × 4 | 63 × 69 mm |
| 49 | 7 × 7 | 26,5 × 38,9 mm, exactement |
| 77 | 7 × 11 | 26,5 × 24,3 mm |

Le relevé navigateur le confirme sur la planche de 49 liens : **7 × 7 = 49 par
page** (contre 11 × 7 = 77 avant), 0 ligne coupée, et les champs calculés. Sans
nombre d'étiquettes — un appelant qui ne connaît pas son contenu —, le calcul
garde son ancien comportement : il remplit la page.

## La mise en page automatique

Un contrôle, et il porte sur le résultat plutôt que sur la mécanique : avec la
case cochée sur une A4 3 × 8 — 24 étiquettes par page —, l'application propose
**11 × 7 = 77 étiquettes de 16,4 × 38,9 mm**, les six champs de géométrie sont
calculés et inactifs, et **aucune ligne n'est coupée** (contre 45 au réglage
manuel). C'est la promesse du mode : ne plus tâtonner, et ne plus rien tronquer.

Le contrôle a d'abord échoué, et pour une raison qui n'appartenait pas au
produit : il lisait les champs de la planche alors que l'onglet **tableau** était
actif — le rendu ne recalcule que l'onglet affiché, et personne n'avait donc
touché ces champs. C'est la troisième fois dans ce relevé qu'un contrôle doit
explicitement remettre le mode qu'il mesure.

## La mise en page automatique mesurait le besoin à une autre largeur que la sienne

Le format A4 3 × 4 (63,5 × 69,1 mm) étant passé par défaut, le relevé a mesuré
deux régressions. Celle-ci est la plus grave, et elle n'a rien d'une affaire de
goût : **la grille annoncée « calculée pour ce contenu » ne portait pas le
contenu**.

Mesuré le 29 septembre 2026, sur les 49 liens du relevé :

| | Avant | Après |
|---|---|---|
| Grille choisie | **10 × 5 = 50** | **11 × 4 = 44** |
| Étiquette | **18,2 × 55 mm** | **16,4 × 69,1 mm** |
| Lignes de texte coupées | **45** | **0** |
| Pages de la planche | 1 (tassée) | **2** — 44 puis 5 |

**La cause tient à une largeur.** Le besoin de texte était calculé en **deux
passes** : la première le mesurait à la largeur de la disposition (63,5 mm), la
seconde à la largeur que la première avait retenue (26,4 mm) — et la grille
finalement choisie en avait une troisième, plus étroite encore (18,2 mm), où le
même texte réclame plus de lignes. Le calcul ne se trompait donc pas sur la
formule : il l'appliquait à une étiquette qui n'était pas celle qu'il retenait.
Ce que la mesure a montré, sur la courbe du besoin : à 26,4 mm le titre réclame
**4** lignes, à 18,2 mm il en réclame **8** — la grille retenue en offrait **7**.

**Et une seconde divergence, dans la même fonction.** Le rendu dessine le QR Code
à la proportion du curseur (70 % du petit côté), la mise en page le supposait à
son minimum lisible (0,4 mm par module) : deux formules pour une même place, donc
deux réponses. Le budget de texte vit désormais dans **une seule fonction**
(`sheetTextBudget`, `src/core/sheet.js`), appelée par le rendu et par le calcul —
et la contrainte de contenu est une **fonction des cotes candidates**
(`autoSheetLayout({ tient })`), évaluée sur chaque grille possible plutôt qu'à une
largeur choisie d'avance.

**Ce que le calcul fait quand rien ne tient.** Il ne tasse plus : aucune grille ne
porte 49 étiquettes de 16,4 mm à une largeur où leur texte tient, et il retient
donc la plus dense qui **porte son texte**, la planche paginant. Le contrôle le
mesure : 49 liens → **49 étiquettes sur 2 pages [44, 5]**, 0 coupée. C'est le
comportement demandé par la note — « 49 étiquettes sur une page qui n'en porte que
20 font trois pages, ce qui est acceptable » — et il est dit à l'écran :
« Les 49 étiquettes ne tiennent pas sur une page : la planche en demande 2. »

**Ce que le contrôle ne dit pas** : que la grille soit la plus élégante possible.
Il dit que chaque étiquette porte son texte entier, sur les cotes qu'elle a
réellement — le reste est une affaire de goût, et la tolérance de forme (facteur 2)
reste une constante assumée.

## Les QR Codes et les URL ne s'alignaient pas sur une planche

Le signalement : « la mise en page automatique doit aligner les QR Codes,
actuellement l'alignement des URL est un peu chaotique ». Deux causes, trouvées
dans la feuille et dans le script :

1. **le contenu d'une case était centré verticalement** (`justify-content:
   center`). Une étiquette dont le titre tient sur une ligne posait donc son QR
   Code plus haut que sa voisine qui en porte trois : sur une grille, les codes
   montaient et descendaient d'une case à l'autre.
2. **le titre et l'URL n'avaient pas de hauteur commune.** Le bloc d'adresse
   commençait après le titre, dont le nombre de lignes varie : l'URL descendait
   d'autant de lignes que le titre en occupait.

**Un troisième défaut, signalé ensuite** : « quand on décoche une option de
layout il faut faire un refresh de la preview, sinon on a l'impression que c'est
un bug d'affichage que rien ne change ». Le rendu était bien relancé à chaque
case décochée ; ce qui ne changeait pas, c'est ce qu'il **lisait**. La case
« Mise en page automatique » réécrit les six cotes de la planche, et la décocher
les laissait en place : la planche restait identique au millimètre près, ce qui
ressemble exactement à un aperçu qui ne se rafraîchit pas.

Le calcul met donc de côté ce que l'utilisateur avait réglé **avant** de
l'écraser, et le lui rend au décochage ; à défaut de mémoire — la case cochée
avant l'ouverture —, c'est la grille de la disposition choisie qui revient. La
mesure le dit : **3 × 8 avant · 11 × 7 cochée · 3 × 8 après décochage**, les six
champs repassant d'inactifs à réglables, et l'aperçu changeant vraiment de
contenu (77 étiquettes par page contre 24). Le scénario est aussi joué sans
navigateur, par `test/web-auto-layout.test.js`, application démarrée pour de bon.

La correction tient en deux lignes de feuille et une passe de plus dans le
script : le contenu part du **haut** de la case, et chaque page calcule la
hauteur de ses blocs — le titre le plus long, l'URL la plus longue — puis réserve
la différence à chaque étiquette par un blanc de mise en page (`aria-hidden`, sans
texte). Les blocs suivants commencent donc à la même hauteur partout.

**Ce que la mesure dit**, sur la planche de 49 étiquettes du relevé, en médiation
d'impression (la racine d'impression est en `display: none` à l'écran) :

| | |
|---|---|
| QR Codes, 5 rangées, jusqu'à 11 par rangée | écart vertical **0 px**, écart de taille **0 px** |
| URL, mêmes rangées | écart vertical **0 px** |

Le contrôle a d'abord été écrit deux fois de travers, et les deux fautes valent
d'être connues :

- **il mesurait à l'écran.** `getBoundingClientRect` sur une racine en
  `display: none` rend zéro : le relevé annonçait « 0 px d'écart » sur 49
  étiquettes empilées à l'origine — un alignement parfait dans un document qui
  n'était pas dessiné. La règle « peindre avant de mesurer » a été payée une fois
  de plus.
- **il ne mesurait que quatre URL.** Avec le titre *et* l'URL demandés, le budget
  de lignes fait disparaître l'adresse sur la plupart des étiquettes de ce
  relevé : il ne restait que quatre adresses à comparer. La mesure se fait donc en
  **deux états** — titre seul pour les QR Codes, URL seule pour les adresses — et
  rend ensuite les réglages trouvés.

**Un mot sur le profil de vérification.** Il est réutilisé d'une exécution à
l'autre, et il porte donc les liens que les contrôles y ont laissés. Une
exécution **interrompue** — tuée au bout de dix minutes, ou doublée par une
seconde qui écrit dans le même profil — laisse des liens en place : le relevé
suivant comptait 95 liens au lieu de 49, et quatre constats se sont mis à
échouer — « la fenêtre affiche les liens collectés », un tri qui ne correspond
plus, « 45 doublon(s) », une première étiquette à 101. Rien de tout cela n'était
un défaut du produit : profil effacé (`rm -rf .verify-chrome/profile`), le même
relevé passe **157/157**. Une seule vérification à la fois, et un profil neuf
quand une exécution n'est pas allée à son terme.

## Le « double filet » des champs de saisie

Le signalement, répété : « je ne suis pas fan en style du double filet pour les
champs d'input, restons sur quelque chose de plus simple et élégant ». Deux
choses faisaient bien deux traits là où un seul suffisait :

1. **Un cadre et un fond.** Le champ portait une bordure *et* un fond blanc :
   dans un panneau gris, cela faisait une boîte dans une boîte — deux contours
   pour une seule zone de saisie. Le fond est désormais **transparent** : le
   champ est une aire soulignée par son seul filet, posée sur la surface qui le
   porte.
2. **Deux marqueurs de focus.** Au focus, la bordure passait à l'accent *et*
   l'anneau s'ajoutait à 2 px de là — deux lignes concentriques pour dire une
   seule chose. Puis, l'anneau étant resté seul, le signalement est revenu : le
   contour ajouté autour du champ **est** le double filet. Le focus se dit
   désormais par le **fond du champ**, qui se teinte (`--focus-fill`), et par
   aucun trait ajouté. `:focus` et non `:focus-visible` : cliquer dans un champ
   doit le montrer actif, lui aussi. La correction vaut des deux côtés :
   `style.css` et `popup.css`, avec le même jeton — c'est le seul marqueur de
   focus d'un champ, il ne peut pas diverger d'une surface à l'autre.

   Conséquence sur le contrôle du clavier : il exigeait un **anneau** à chaque
   arrêt de tabulation. Un champ n'en a plus, et le contrôle aurait échoué sur un
   produit juste. Il accepte donc l'un ou l'autre — anneau pour les commandes,
   fond teinté pour les champs —, la couleur attendue étant lue sur une sonde
   plutôt que recopiée. `--focus-fill` entre au passage dans les jetons partagés,
   avec deux paires de contraste (le texte doit rester lisible sur le champ
   actif : 12,8:1 en clair, 9,9:1 en sombre).

Ce qui reste, et qui est mesuré : **un seul filet**, `1px rgb(141, 141, 141)`,
sur la surface du panneau → **3,02:1**. C'est le seuil de WCAG 1.4.11 pour la
limite d'un composant, tenu de justesse — et c'est la raison pour laquelle le
filet ne peut pas être éclairci : `--border-line` (le gris des séparateurs) ne
donne que 1,1:1 sur ce fond, et le champ disparaîtrait.

Le contrôle qui mesure cela lit la couleur **réellement vue** derrière le champ,
en remontant les ancêtres : un fond transparent se lit `rgba(0, 0, 0, 0)`, et un
contraste calculé contre du noir ne voudrait rien dire.

## « En-tête de page » : coché, et rien à l'écran

Le signalement : « en mode planche d'étiquettes, si on clique sur les options
dans « En-tête de page » rien ne s'affiche dans la preview, ni même dans la
preview de l'imprimante ».

La cause n'était pas le rendu : l'en-tête vit dans la marge du haut, qui doit
mesurer **9 mm** pour le porter, et la disposition par défaut — A4 3 × 8,
63,5 × 33,9 mm — déclare une marge de **8,5 mm**, soit 8,53 après centrage. Le
refus s'écrivait bien, mais sous la case et **à l'encre des aides** : on cochait,
rien ne bougeait, et l'on croyait à un aperçu figé.

Deux corrections, mesurées :

1. **La case fait la place.** Cocher « En-tête de page » porte la marge haute à
   9 mm — c'est ce que la case demande —, et le rendu suit : l'en-tête apparaît
   dans l'aperçu (`#preview .print-page__header` : 0 → 1) **et** dans la racine
   d'impression (0 → 1), mesuré sur le document réel. Sous mise en page
   automatique, le plan reçoit la même marge : sans cela, il recalculait 8,5 mm
   à chaque rendu et le refus revenait indéfiniment.
2. **Le refus restant est à l'alerte.** Si la marge redescend sous 9 mm — elle ne
   peut de toute façon pas porter l'en-tête —, le message nomme la valeur à
   atteindre (« Portez la marge haute à 9 mm, ou décochez l'en-tête ») et passe
   en `--danger`, comme les autres refus de la planche. Il était en encre
   secondaire, c'est-à-dire invisible pour qui ne le cherchait pas.

Le scénario est aussi joué sans navigateur (`test/web-sheet-header.test.js`,
application démarrée pour de bon) : la marge est portée à 9 mm et le message
disparaît ; une marge redescendue à 3 mm rallume le message, en rouge.

## Un texte coupé sur la planche, et un chiffre qui mentait

Deux défauts, découverts par le même contrôle — et le second est celui qui compte.

**Le premier est un mensonge du calcul.** Le nombre de lignes laissées au texte
sous le QR Code était compté depuis le minimum **lisible** du QR Code (0,4 mm par
module), alors que le curseur s'arrête à 30 % de la hauteur d'étiquette. Sur une
A4 3 × 8 et 21 modules, l'application promettait donc **huit** lignes et le rendu
n'en laissait que **sept** : un titre était coupé alors qu'elle venait d'annoncer
qu'il tenait. Le nombre annoncé se calcule maintenant sur le côté que le curseur
laisse réellement atteindre, et l'invariant est tenu par un test unitaire qui
parcourt tous les préréglages, quatre densités de QR Code et toutes les
réservations de une à dix lignes (`test/sheet.test.js`).

**Le second est un silence.** La planche tronquait le texte avec des points de
suspension **sans un mot** — comme l'onglet Niimbot avant que ce message y existe.
Une adresse ou un titre amputé sortait de l'imprimante comme s'il tenait entier.
Elle l'annonce désormais, à l'alerte, en nommant le remède :

> Texte coupé sur 45 étiquettes : ils ne tiennent pas entiers à cette taille.
> Raccourcissez les adresses, décochez le titre ou l'URL, ou prenez une étiquette
> plus grande.

**Le coupable, mis à l'épreuve.** Le plancher du curseur était une proportion
choisie à l'œil — 30 % du petit côté de l'étiquette —, sans rapport avec ce qui
s'imprime. Le vrai plancher est la lisibilité : les modules de l'adresse fois
0,4 mm. Le curseur descend maintenant jusque-là, et la mesure dit ce que cela
change : sur la A4 3 × 8 du relevé, au réglage par défaut **45 lignes coupées**,
au minimum du curseur **0**. Ce que l'utilisateur demandait — « pourquoi ne
peut-on pas réduire le QR Code, alors que c'est lui le coupable ? » — était donc
juste, et l'interdiction venait d'une constante décorative.

Le contrôle navigateur ne compare pas à une valeur espérée : il vérifie un
**accord** entre le message et le rendu. La collection du relevé porte des
adresses longues, et supposer qu'elles tiennent toutes serait une supposition,
pas une mesure. Ce qui serait un défaut, c'est une ligne coupée sans message ou
un message sans ligne coupée. Mesuré : 45 lignes coupées et le message présent au
corps de texte par défaut ; **0** ligne coupée et aucun message au plus petit
corps. Les deux disent la même chose.

## Deux grilles de tableau, sur la même page

Le tableau imprimé est découpé en **un `<table>` par page**. Rien ne leur
imposait de largeurs : chacun se dimensionnait sur son propre contenu, et les
colonnes ne s'alignaient plus d'une page à l'autre. Mesuré dans Chrome, sur un
document de trois pages : la colonne des titres commençait à **465 px** sur la
première, **430 px** sur la deuxième, **436 px** sur la troisième — au point
qu'une colonne étroite peut se réduire à presque rien et paraître absente.

La correction est une grille unique : `table-layout: fixed` et un `<colgroup>`
calculé une fois (`tableColumnWidths`), en millimètres, depuis la largeur utile
de la page — le QR Code garde sa taille, les colonnes de texte se partagent le
reste au prorata de ce qu'elles portent. Après correction, les trois pages
donnent les mêmes abscisses : `[38, 120, 169, 475]`.

### Ce que la mesure a appris sur elle-même

Le premier contrôle de ce défaut **passait sans rien regarder** : il lisait la
géométrie de `#print-root`, qui est `display: none` hors impression — toutes les
valeurs valaient zéro, et « toutes les pages ont les mêmes colonnes » était vrai
par vacuité. Il fallait deux précautions, et les deux sont maintenant dans le
script :

1. **Mesurer sous médiation d'impression** (`Emulation.setEmulatedMedia`), comme
   le navigateur le fait au moment d'imprimer. Hors de là, la racine n'a pas de
   géométrie.
2. **Vérifier que la racine porte bien ce qu'on mesure** : le relevé précédent
   l'avait rebâtie pour la planche, et la mesure rendait `[]` — un tableau vide
   n'a pas de colonnes, donc pas de désalignement non plus.

Un contrôle qui rend zéro ou une liste vide doit être traité comme un contrôle
qui n'a pas eu lieu : c'est la règle qu'applique désormais ce bloc, en exigeant
au moins une colonne trouvée avant de comparer.

## La numérotation, propre à chaque collection

Un constat, exécuté sur le document réel : on règle 101 sur la collection par
défaut — la liste affiche 101, 102, 103 —, on bascule sur une collection de
contrôle qui annonce 7, puis on revient : la première a gardé 101. Le contrôle
relit aussi `chrome.storage.local`, pour vérifier que la valeur est bien *écrite*
et non seulement affichée.

Le scénario crée la collection de contrôle, la retire ensuite, **et rend à la
collection par défaut sa numérotation d'avant** : les contrôles suivants comptent
à partir de 1, et une valeur laissée à 101 les ferait échouer — ce qui est arrivé
à la première version de ce bloc.

## Déplacer une sélection

Quatre constats, hors réseau, exécutés sur le document réel : la commande est
absente au repos, apparaît dès qu'une case est cochée en proposant **les autres**
collections, déplace le lien quand on en choisit une — vérifié en relisant
`chrome.storage.local` : le lien a changé de collection, leur nombre total n'a
pas bougé, et le titre est intact —, et disparaît une fois la sélection vidée.

Le scénario ajoute une seconde collection au profil, puis le remet exactement
comme il l'a trouvé : les contrôles suivants comptent les liens de cette
collection, et un déplacement laissé en place les ferait mentir.

## Collections et service proposé d'emblée

Trois contrôles ajoutés avec les collections, tous **hors réseau** :

1. **T.LY est proposé d'emblée dans l'extension.** Le premier service du
   catalogue est `tly`, il est sélectionné au démarrage, et son libellé porte
   « défaut ». C'est le seul service qui raccourcisse sans clé ni compte — et
   seulement depuis une origine d'extension, ce que ce contrôle ne peut pas
   prouver sans sortir : c'est `test/shorten.test.js` qui tient la forme de la
   requête, et une sonde manuelle qui a établi le fait.
2. **L'aide dit que le raccourcissement reste facultatif.** La phrase sous le
   sélecteur est lue dans le DOM et doit contenir « rien n'est raccourci » :
   présélectionner un service ne doit jamais passer pour un réglage actif.
3. **L'application propose ses collections.** Le sélecteur existe, il est
   visible dans l'extension, il porte au moins la collection par défaut, et il
   affiche celle qui est courante.

Ce que ces contrôles ne couvrent pas, et qui reste manuel : un vrai
raccourcissement T.LY (il sort sur le réseau), la bascule d'une collection à
l'autre à la souris, et la collection de navigation privée — Chrome en mode
automatisé n'ouvre pas de fenêtre privée avec l'extension chargée. La
navigation privée est couverte autrement : `test/extension-bundle.test.js`
exécute le service worker et la fenêtre assemblés, avec un onglet privé, et
vérifie que le lien part dans `storage.session` et **jamais** dans
`storage.local`.

Deux règles d'écriture pour quiconque étend ces scripts, et toutes deux ont coûté
une fausse accusation ou une heure perdue :

1. **Peindre avant de mesurer.** Ne jamais lire une valeur de style sans avoir
   forcé une occasion de rendu — et, pour la racine d'impression, se placer sous
   médiation d'impression : hors impression, elle est en `display: none`, et
   toute sa géométrie vaut zéro.
2. **Aucun accent grave dans un commentaire interne.** Les scripts évalués dans la
   page vivent dans des gabarits de chaîne ; un accent grave dans un commentaire
   les referme, et l'erreur de syntaxe est signalée à côté. Le piège a été payé
   une quatrième fois en écrivant le contrôle de pagination.

## Le lien vers la page d'information, dans l'application aussi

La fenêtre de l'extension portait ce lien depuis le début ; l'application, non —
alors que c'est elle qui sert de documentation à qui l'ouvre en grand. Trois
contrôles, hors réseau, le mesurent sur le document rendu :

1. **Le lien existe, et dit où il mène.** Le libellé **visible** est
   « Page d'information », l'adresse posée est celle du site, `target="_blank"` et
   `rel` porteur de `noopener`. L'annonce du nouvel onglet est vérifiée à part :
   c'est un texte masqué, et la compter dans le libellé ferait échouer la
   comparaison sur un lien pourtant correct — l'erreur a été commise, puis
   corrigée, en écrivant ce contrôle.
2. **L'adresse dépend de la page courante.** Dans l'extension
   (`chrome-extension://…/app.html`), aucune page n'est voisine : le relevé
   attend l'adresse publiée. Servie par le site sous `/app/`, l'application
   renvoie à sa voisine (`../`), sans quoi une copie du site hébergée ailleurs
   enverrait ses visiteurs sur le site d'origine. Le second cas ne se mesure pas
   ici — le relevé ouvre la page de l'extension — et c'est
   `test/site-links.test.js` qui le tient, application démarrée pour de bon.
3. **Le lien reste à l'encre secondaire, et sous les panneaux.** Sa couleur
   calculée est comparée à celle d'une aide : elle doit être identique, et
   différente du fond de l'action principale. L'accent est réservé aux actions ;
   ce lien n'en est pas une. Le pied se place après `</main>` et ne rouvre pas le
   débordement horizontal — mesuré à huit largeurs, de 1280 à 380 px.
4. **Le pied est centré, et signé.** Une demande ultérieure : « le lien page
   d'information doit être centré dans la page dans le footer, et ajouter aussi
   mon nom G. Abegg-Gauthey, l'année et le type de licence de l'application ainsi
   que la version ». Le contrôle compare donc le **milieu** du lien à celui du
   pied (et non plus son bord gauche à celui des panneaux), et lit la signature :
   le nom, `MIT`, la version — et l'année **du jour**, comparée à celle de la
   machine qui conduit le relevé. Écrite en dur, elle se serait périmée au
   1er janvier ; la version, elle, est injectée à la construction depuis
   `package.json` (`__APP_VERSION__`), où un test vérifie qu'aucune page livrée
   ne garde le jeton.


## Le panneau de choix d'import, et deux `[hidden]` qui ne masquaient rien

Le panneau qui demande où ranger un import est **dans le flux**, sous le bouton
qui l'a ouvert : trois issues nommées d'après les collections concernées, et
« Annuler ». Ses libellés portent des noms de collection, donc leur longueur ne
se devine pas — d'où la capture, prise avec un nom volontairement long.

Ce qu'elle a montré, et qu'aucun test de DOM ne pouvait montrer : **« Annuler »
fermait le panneau dans le document et le laissait peint à l'écran**. `.import-menu
{ display: flex }` l'emporte sur le `display: none` que le navigateur attache à
l'attribut `hidden` — le piège est documenté dans la feuille de style depuis le
premier jour, pour `.field`, et il a été commis deux fois de plus : le sélecteur
de collection de la page web autonome restait visible avec une seule option et
deux commandes sans effet, et la commande de collection nouvelle du panneau
d'import restait visible hors de l'extension.

Les deux règles manquantes sont désormais là, et `test/web.test.js` les tient :
pour chaque panneau qui s'ouvre et se ferme, une règle `<sélecteur>[hidden]`
doit exister. Un substitut de DOM ne peint pas : il ne peut pas voir ce défaut,
et une assertion sur la propriété `hidden` ne le voit pas non plus — elle était
verte.

Deuxième constat de la même capture, sur le nom vidé : le champ est vide, la
liste affiche « Mes liens », l'aide sous le sélecteur dit ce que ce vide veut
dire, et le titre de la page suit. C'est le défaut d'origine — vider le champ
n'écrivait rien, et l'ancien nom restait — vu depuis l'écran plutôt que depuis le
stockage.

## Le clic droit sur un résultat de recherche enregistrait le moteur

Rapporté tel quel : chercher « wikipedia qrcode » dans Google, faire un clic droit
sur le résultat Wikipédia, « Ajouter ce lien ». Le compteur de l'icône
s'incrémentait — l'ajout avait donc eu lieu —, et l'application ne montrait
**rien qui ressemble à ce qu'on venait de cliquer**.

Le constat, établi sur une extension réellement chargée
(`scripts/verify-context-menu.mjs`) : la liste contenait bien une ligne, mais
c'était l'enveloppe du moteur.

| | Avant | Après |
|---|---|---|
| Adresse enregistrée | `https://www.google.com/url?q=https://fr.wikipedia.org/wiki/Code_QR&sa=U&ved=2ahUKEwi` | `https://fr.wikipedia.org/wiki/Code_QR` |
| Titre affiché | `google.com` | `fr.wikipedia.org` |
| Même page par son adresse directe | second lien | doublon reconnu |

Trois défauts pour un seul clic : la ligne ne disait pas ce qu'elle contenait, le
QR Code encodait une adresse deux à trois fois plus longue — donc plus dense, et
qui ne tient plus sur une étiquette étroite —, et la même page ajoutée ensuite
depuis la barre d'adresse entrait une seconde fois.

`normalizeUrl` déplie désormais les redirections connues (Google `q`/`url`, Bing
`u` en base64url, DuckDuckGo `uddg`), et la destination suit la normalisation
ordinaire. Le dépliage est borné à quatre sauts, garde les adresses déjà vues, et
n'accepte qu'une destination http(s) absolue : une valeur relative, vide ou
`javascript:` laisse l'enveloppe en place. La table des moteurs est courte à
dessein — chaque entrée est une convention d'un tiers, qui peut changer sans
prévenir, et un moteur absent garde son adresse d'origine.

Ce que les tests tiennent, et où : `test/core.test.js` pour la normalisation,
`test/capture.test.js` pour le titre, et `test/web-context-menu.test.js` pour le
contrat entre les deux moitiés — le service worker écrit, l'application lit, sur
la même zone. Ce dernier fichier est né de ce rapport : c'est précisément
l'intervalle que rien ne regardait.

## Le compteur de l'icône survivait à une collection vidée

Rapporté tel quel : « si on fait vider la collection et que la page qui est
affichée est l'application, la page ne se rafraîchit pas et même en ayant vidé la
collection j'ai toujours un artefact avec un nombre qui reste sur l'icône alors
qu'il ne devrait plus rien y avoir ou être à 0. »

Le rapport décrit **deux** défauts, et la mesure les a séparés — trois liens,
puis « Vider la collection » depuis l'une ou l'autre page
(`npm run verify:badge`) :

| Vidage depuis | | Icône | Application | Fenêtre |
|---|---|---|---|---|
| l'application | avant | `3` | « 3 liens » | 3 lignes |
| | après | **`3`** | « 0 lien » | 3 lignes |
| la fenêtre | avant | `3` | « 3 liens » | 3 lignes |
| | après | *rien* | **« 3 liens »** | 0 ligne |

En gras, ce qui restait faux : le compteur de l'icône gardait le nombre d'avant
quand l'application vidait la collection, et l'application gardait ses liens
quand c'était la fenêtre. Un seul intervalle pour les deux : **les trois
contextes partagent les mêmes documents sans se parler**. Le badge n'était peint
que par le service worker, sur événement — installation, démarrage, ou message de
la fenêtre —, et l'application n'envoyait aucun message ; la fenêtre, elle, ne
relisait rien.

Deux écouteurs de `storage.onChanged` ferment l'intervalle : celui du service
worker repose le compteur quand les liens, la liste des collections ou la
collection courante changent, où que l'écriture vienne ; celui de l'application —
et celui de la fenêtre, que le menu contextuel ouvre dans un onglet — relit ce qui
est affiché. La liste des documents surveillés vit dans `displayedDocuments()`,
avec les clés qu'elle nomme, pour qu'un contexte ne puisse pas en oublier un.

Deux précautions, apprises des mesures :

- **le retour transitoire n'est pas écrasé.** La collecte écrit le lien *avant*
  de poser son signe : sans échéance, le rafraîchissement déclenché par sa propre
  écriture remplacerait le « + » dans le même souffle ;
- **la page ne se redessine pas pour rien.** L'application compare ce qu'elle
  relit à ce qu'elle affiche, et laisse passer les événements de ses propres
  écritures — un redessin emporterait, au passage, un éditeur de lien ouvert.

Ce que les tests tiennent, et où : `test/extension-bundle.test.js` pour le
service worker et la fenêtre — l'icône suit un stockage écrit ailleurs, le signe
d'un clic droit survit à sa propre écriture, la fenêtre se met à jour —, et
`test/web-sync.test.js` pour l'application, exécutée pour de vrai : vidage,
changement de collection, et écriture de la page elle-même.
