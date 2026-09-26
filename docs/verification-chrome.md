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
**116 sur 116** après les lots suivants.

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

Les cibles concernées — le sélecteur de langue, les deux liens de titre de la
liste, et le lien vers la page d'information ajouté depuis — sont **isolées**.
Aucune ne réclame de correction.

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

Trois passages consécutifs donnent 116 constats satisfaits sur 116, le troisième
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
  peut être obtenu qu'à la main.
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
