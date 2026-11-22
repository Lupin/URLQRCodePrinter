# Journal de la refonte UI

**But** : garder, palier par palier, ce qui a été mesuré **avant** et **après**, pour que la note ne soit pas une opinion et que chaque régression soit visible. Une ligne par palier, des chiffres, des captures, un tag.

**Références** : [audit sévère](audit-ui-ux-2026-11-22.md) · [barème](barre-qualite-ui.md) · [plan vers 4,5](atteindre-4-5.md) · [maquette](mockup/LISEZ-MOI.md).

---

## I0 — Correctifs · 22 novembre 2026

**Tag** : `checkpoint/i0` · **Tickets** : #14 à #22 (9 fermés) · **Note provisoire** : **2,45 / 5** (contre 2,32).

Réparer sans dessiner : les défauts qui coûtent une erreur ou bloquent une partie des utilisateurs.

| Mesure | Avant | Après | Preuve |
|---|---|---|---|
| Hauteur de l'en-tête | 125,5 px | **82 px** | `.topbar` mesuré 82 px ; logo et titre sur la même ligne |
| Balise `</div>` orpheline | 1 | **0** | `src/web/index.html` : `.topbar__brand` restauré |
| Onglets : `aria-controls` | 0 / 4 | **4 / 4** | relevé DOM |
| Onglets : `role="tabpanel"` | 0 / 4 | **4 / 4** | relevé DOM |
| Onglets dans l'ordre de tabulation | 4 | **1** (+ flèches, Home/End) | `tabindex` relevé : 0, −1, −1, −1 |
| Contrôles sous 24 × 24 (hors liens en ligne) | case 13×13, × 21×19, ✎ 24×19, puce 47,9×14, langue 82×22 | **0** | cible = label ; `.link__check-hit` 24×24 |
| Focus d'un champ | fond `#f1d3bf` seul, **1,42:1** | fond + anneau encre 2 px, **≥ 11:1** | styles calculés + capture `focus-champ.png` |
| « Vider la collection » | 1 clic, sans confirmation | **confirmation** (texte + 2 issues, focus sur Annuler, Échap) | `confirmation-vidage.png` ; focus rendu au bouton |
| Suppression d'une ligne | définitive | **annulable 6 s** (« Annuler »), rang conservé | 6 → 5 → 6 liens mesurés |
| Double défilement de la fenêtre | document 2 436 × 545, 2 barres, pied rogné | **380 × 560, une seule zone de défilement** | `scrollHeight === clientHeight`, `scrollWidth === clientWidth` |
| Confidentialité accessible | non (bandeau seulement) | **lien permanent** : 82×24 (application), 76×24 (fenêtre) | `#privacy-link` href `privacy.html` |
| Jetons CSS non définis du site | 3 (`--text-2`, `--border-line`, `--focus`) | **0** | fichier + test `site-tokens.test.js` ; filets de FAQ visibles |
| `prefers-reduced-motion` | 1 surface sur 3 | **3 sur 3** | test `site-tokens.test.js` |
| Tests | 1 088 | **1 090** (dont 2 nouveaux) | `npm test` vert |

**Ce que I0 ne fait pas, volontairement** : l'aperçu reste à 1 545 px (I1), les deux boutons primaires restent (I1), les échelles n'existent pas (I2), l'onglet actif reste à 1,10:1 (I2 #31), l'état vide reste une phrase (I1 #27). C'est pourquoi la note ne bouge que de 0,13 : **I0 protège, il ne séduit pas**.

**Ce qui a été écarté après vérification** : un constat de boutons désactivés illisibles en thème sombre s'est révélé être un artefact de capture pendant la transition de thème. Il n'a pas été publié.

---

## I1a — Châssis et aperçu permanent · 22 novembre 2026

**Tag** : `checkpoint/i1a` · **Tickets fermés** : #23, #24, #25, #28 · **Note provisoire** : **2,9 / 5** (contre 2,45 après I0).

Le poste de travail devient trois zones, et l'aperçu cesse d'être un panneau de formulaire.

| Mesure | Avant I1a | Après I1a | Preuve |
|---|---|---|---|
| Zones de l'écran | 2 colonnes de formulaires | **3 zones** : 360 / 740 / 340 px | mesures `mesures-i1a.json` |
| Position de l'aperçu à 1440 × 900 | 1 545 px | **112 px** | l'aperçu commence sous la barre de scène |
| Défilement de la page pour voir l'aperçu | 1 310 px | **0 px** | `scrollHeight = innerHeight` |
| Actions primaires visibles | 2 (Ajouter + Imprimer) | **1 par vue** (Imprimer / Imprimer l'étiquette / Exporter les images) | relevé par mode |
| Survol des boutons secondaires | 7 deviennent orange | **0** (survol neutre) | règle + test |
| Hauteur de l'en-tête | 125,5 px (82 après I0) | **48 px** | barre de commande sur une ligne |
| Contrôles dans l'écran | 77 | **54** | relevé géométrique |
| Aperçu à 768 / 380 px | 2 812 / 3 614 px | **142 / 178 px**, scène en tête | ordre responsive |
| Pied de page | liens + signature | **barre d'état** : liens, promesse « Aucune donnée envoyée », signature | captures |
| Réglages hors usage courant | visibles | **deux dépliants** : « Cible et raccourcissement », « Nom, numéro et note » | captures |
| Tests | 1 090 | **1 090** | `npm test` vert |

**Ce qui reste pour I1b (et pourquoi la note n'est pas encore 3,1)** : le volet porte encore ses exports et son import en pied (les déplacer dans un menu), l'inspecteur garde 54 contrôles à l'écran (cible < 40), les états vides ne sont pas encore dessinés, la fenêtre n'est pas alignée sur son écran 3, et les onglets tiennent sur deux rangées. I1b s'en occupe avant I2.

**Comparaison visuelle** : `mockup/comparaison-maquette-reel-i1a.png`.

---

## I1b — Volet allégé, état vide, fenêtre · 22 novembre 2026

**Tag** : `checkpoint/i1b` · **Tickets fermés** : #26, #27, #52 · **Note provisoire** : **3,0 / 5** (contre 2,9 après I1a).

Le détail qui reste entre une structure juste et un outil utilisable.

| Mesure | Avant I1b | Après I1b | Preuve |
|---|---|---|---|
| Contrôles à l'écran (1440 × 900) | 54 | **32** (cible < 40) | `checkVisibility` + intersection viewport |
| Actions de ligne visibles au repos | 16 | **0** (au survol et au focus) | capture + mesure |
| Gestes de gestion du volet | 6 boutons visibles | **1 dépliant** (« Exporter, importer et vider ») | capture |
| Onglets de mode | 2 rangées | **1 rangée** de 4 | hauteur 35 px |
| État vide | une phrase | **3 états** avec action : collection vide (Ajouter / Importer), recherche sans résultat (Effacer) | captures |
| Rangée de sélection sur collection vide | case orpheline + bouton | **masquée** | capture |
| Fenêtre : issue de secours | « Ouvrir l'application » désactivé à vide | **toujours actif**, en secondaire de contour | relevé |
| Fenêtre : barre horizontale dans la liste | présente | **absente** ; document 380 × 560 | relevé |
| Tests | 1 090 | **1 090** | `npm test` vert |

**Note provisoire : 3,0.** La cible du palier (3,1) sera vérifiée après I2 : il reste les échelles (11 tailles de texte, 27 paddings), les variantes de bouton, l'onglet actif à 1,10:1, les composants natifs et le thème sombre. C'est le programme d'I2, et c'est lui qui doit faire monter la note, pas un arrondi.

**Comparaison visuelle** : `mockup/comparaison-maquette-reel-i1a.png` (structure) ; captures détaillées : `.audit/captures-i1b/`.

---

## I2a — Échelles, hauteurs et onglet actif · 22 novembre 2026

**Tag** : `checkpoint/i2a` · **Note provisoire** : **3,1 / 5**.

Le socle qui fait tenir l'écran : des échelles nommées, des contrôles à trois hauteurs, un état actif lisible.

| Mesure | Avant I2a | Après I2a | Preuve |
|---|---|---|---|
| Tailles de texte d'écran distinctes | 11 | **5** (11 / 12 / 13 / 14 / 20 px) | 5 jetons `--type-*`, test `design-scale` |
| `gap` en pixels hors échelle | 11 valeurs | **0** (55 écarts tokenisés, 2 en mm pour le papier) | test |
| Hauteurs de contrôle | 26 / 32 / 33 px selon les boutons | **28 / 32 / 36** (jetons) | mesure : petit 28, champ 32, pied 36 |
| Onglet actif | 1,10:1, ombre de 1 px | **14,2:1** (texte), **17,4:1** (soulignement) en clair ; **11,5:1 / 16,5:1** en sombre | mesure des styles calculés |
| Ombres | 3 valeurs | **1** jeton (`--shadow-sheet`) | test |
| Trois primaires visibles en même temps | 3 (les `[hidden]` étaient battus par `display`) | **1** par vue | `[hidden] { display:none !important }` + mesure |
| Tests | 1 095 | **1 096** | `npm test` vert |

**Correctif systémique trouvé en chemin** : depuis que des composants déclarent leur `display`, l'attribut `hidden` ne gagnait plus. Les trois actions primaires des trois modes s'affichaient simultanément dans le pied de l'inspecteur. Une règle globale `[hidden]` a été ajoutée ; les mesures de primaires et de contrôles redeviennent justes.

**Méthode de mesure** : une fenêtre hors écran ne joue aucune frame d'animation ; `getComputedStyle` renvoie alors la valeur de départ des transitions, pas l'état final. Les captures de thème sont donc prises avec le thème posé **avant chargement** et les transitions neutralisées (`* { transition: none }`). C'est ce qui avait produit le faux constat de I0 sur les boutons désactivés.

**Reste pour I2b** : les `padding` en pixels (la dernière série hors échelle), la table unique de variantes (boutons désactivés, champs étirés), les composants natifs (cases, curseur, barres de défilement), et la re-mesure complète du thème sombre au-delà de l'onglet actif.

---

## I2b — Variantes, composants natifs, thème sombre · 22 novembre 2026

**Tag** : `checkpoint/i2b` · **Tickets fermés** : #29, #30, #31, #32, #33 · **Note mesurée** : **3,3 / 5** (cible du plan : 3,7).

Le dernier étage du système : les paddings, les variantes, les contrôles natifs et le thème sombre.

| Mesure | Avant I2b | Après I2b | Preuve |
|---|---|---|---|
| Paddings en pixels hors échelle | 20 déclarations | **0** (clamp et mm exceptés) | test `design-scale` |
| Variantes de bouton | une classe `btn--outline` employée mais **non définie** | table fermée de 8 variantes, testée | test |
| Cases à cocher | natives (bleu système) | **habillées** : bordure encre, coche SVG, focus visible | capture Tableau |
| Curseur (taille du QR Code) | natif | **piste 2 px, pouce carré encre** | capture Tableau |
| Barres de défilement | par défaut | fines, encre, transparentes | règle + captures |
| Thème sombre — texte | non re-mesuré | **16,5:1** (texte), 8,9:1 (secondaire), 6,4:1 (tertiaire) | calcul sur jetons |
| Thème sombre — désactivé | 5,31:1 | **5,31:1** (≥ 4,5) | calcul |
| Thème sombre — primaire | 10,5:1 | **10,5:1** | calcul |
| Thème sombre — onglet actif | 1,10:1 avant I2a | **11,49:1** | calcul + capture |
| Tests | 1 096 | **1 099** | `npm test` vert |

**Écart avec la cible du plan (3,7)** : la mesure donne **3,3**. L'estimation de 3,7 était trop optimiste — elle supposait que le système suffirait à lui seul. Les points restants sont dans I3 (liste, sélection, détail, recherche, import) et I4 (canvas, zoom, progression, sorties), pas dans des jetons supplémentaires. Je préfère le dire maintenant que l'ajuster après coup.

**Correctif après revue (même jour)** : le curseur « Taille du QR Code » porte la classe `.input` pour sa largeur, et héritait donc du filet, du fond de focus et de l'anneau intérieur d'encre des champs — un cadre noir épais au clic. Remise à zéro ciblée (`border: 0`, fond et `box-shadow` neutralisés) ; le focus clavier garde son anneau d'accent de 2 px. Test de garde ajouté (`design-scale`), comparaison visuelle : `mockup/curseur-avant-apres.png`.

**Deuxième passe, après revue** : le curseur restait brut et disproportionné (pavé de 14 px sur une piste de 2 px). Redessiné en **lame de fader** : piste de **3 px** dont la partie utile est remplie d'encre (variable `--slider-pct` posée par `app.js` à chaque geste), pouce de **10 × 20 px**. Le rapport 3:10 remplace 2:14, et la valeur se lit sans lire le nombre.

**Flake connu** : le test de l'encart de consentement (minuterie `settle()`) échoue environ une fois sur trois sous charge, puis repasse. Il est indépendant de la refonte ; à stabiliser séparément.

---

## I3a — Liste dense, sélection contextuelle, recherche comptée · 22 novembre 2026

**Tag** : `checkpoint/i3a` · **Tickets fermés** : #34, #35, #37 · **Note provisoire** : **3,4 / 5**.

La liste devient ce qu'on parcourt, pas ce qu'on subit.

| Mesure | Avant I3a | Après I3a | Preuve |
|---|---|---|---|
| Hauteur d'une ligne | 76 à 103 px (moyenne 82) | **44 à 55 px** (moyenne 48) | mesure géométrique sur 10 liens |
| Rangée permanente de sélection | case + phrase + bouton + déplacement | **une ligne de sélection** ; la barre d'état n'existe qu'avec une sélection | captures |
| Phrase « aucun lien coché » | affichée en permanence | **hors du repos**, remplacée par le compte de sélection | mesure : barre masquée à 0 coché |
| Recherche | champ muet | **compteur « 3 résultats »**, croix d'effacement, **Échap** | capture + mesure |
| Ligne avec puces | passait à trois lignes | **deux lignes**, puce sur la ligne de l'adresse | capture |
| Tests | 1 099 | **1 100** | `npm test` vert |

**Deux corrections de structure** : le bouton d'édition réservait une rangée entière même fermé (`flex: 1 0 100%`) — il reste inline et l'éditeur ne prend sa ligne qu'ouvert (`:has`) ; et l'adresse, non compressible, renvoyait les puces à la ligne suivante — le corps de ligne est passé en grille `minmax(0,1fr) auto`.

**Reste pour I3b** : l'édition en volet de détail (#36) et l'import guidé (#38). Ce sont deux refontes de flux, pas des ajustements.

**Dette de finition** : le curseur reste « un peu brut » (accepté pour l'instant) — consigné pour la passe finale, ticket #54.

---

## I3b — Volet de détail et import guidé · 22 novembre 2026

**Tag** : `checkpoint/i3b` · **Tickets fermés** : #36, #38 · **Note provisoire** : **3,5 / 5**.

L'édition quitte la ligne. Le volet de collection cède sa place au détail, au lieu de grandir.

| Mesure | Avant I3b | Après I3b | Preuve |
|---|---|---|---|
| Édition d'un lien | formulaire dans la ligne : la liste se replie, la ligne grandit | **volet de détail** qui remplace la collection ; la liste ne bouge pas | capture + mesure |
| Largeur des champs | 364 px intrinsèques, débordement historique | **303 px**, dans le volet | mesure |
| Focus à l'ouverture | — | **champ Titre** | mesure |
| Focus à la fermeture | — | **le crayon qui a ouvert** (`link__edit`) | mesure |
| Sorties de l'édition | Entrée / Échap | Entrée, Échap, **Annuler**, **Enregistrer**, **← Retour** — tous par `fermerDetail()` | test |
| Import : nature | `role="group"` | **`role="dialog"`**, `aria-describedby` sur l'hint | test |
| Import : destructif | « Remplacer » en fantôme neutre | **variante danger** | test |
| Import : Échap | sans effet | **referme et rend le focus** au bouton d'import | test |
| Tests | 1 100 | **1 104** | `npm test` vert |

**Ce qui n'a pas été fait, et pourquoi** : l'import n'a pas été transformé en assistant multi-étapes. La question posée est déjà unique (fusionner, remplacer, créer), avec le nom de la collection et l'avertissement destructif. Y ajouter des étapes aurait ajouté des clics sans retirer une décision. Les critères #38 — Échap, focus rendu, destructif annoncé — sont tenus.

**Écart avec la cible du plan (4,1)** : la mesure donne **3,5**. Les deux paliers I3 ont surtout retiré de la friction ; les points de « qualité perçue » restants sont dans I4 (canvas, zoom, progression, sortie) et I5 (marque, site).

**Dette de finition** : le curseur, toujours noté (#54).

---

## I4a — La scène comme plan de travail · 22 novembre 2026

**Tag** : `checkpoint/i4a` · **Ticket fermé** : #39 · **Note provisoire** : **3,6 / 5**.

La feuille devient un objet posé, qu'on regarde de près ou de loin.

| Mesure | Avant I4a | Après I4a | Preuve |
|---|---|---|---|
| Cadre de feuille | page blanche sur fond clair, sans bord | **bord de 1 px** + **ombre unique** (`--shadow-sheet`) | mesure des styles |
| Échelle absolue | implicite | **« Aperçu à 54 % de la taille réelle »** sous la feuille | `mesures-i4a.json` |
| Pages | deux premières affichées, sans le dire | **« 4 pages · A4 (210 × 297 mm) · 54 % »** | idem |
| Zoom | absent | **100 % / 125 % / 150 %**, valeur affichée, ajustement à 100 % | cadre 430 → 538 → 645 px |
| Zoom sur étiquette/image | — | **masqué** : il n'y a pas de page à régler | mesure |
| Tests | 1 109 | **1 109**, stables sur 4 exécutions | `npm test` |

**Deux défauts de méthode corrigés en chemin** :

1. **La suite était instable sous charge** (un test de la fenêtre échouait une fois sur trois, un autre à chaque fois selon l'ordre). Les attentes de démarrage sont passées de « deux tours de boucle » à **l'état attendu** (`waitFor`, 10 s), et la concurrence des fichiers de test est bornée à 4 (`--test-concurrency=4`). Quatre exécutions consécutives, zéro échec.
2. **Un test d'échelle encodait la formule** (`Math.min(1, …)`). Il vérifie maintenant le sens : à l'ajustement, l'aperçu ne dépasse pas la taille physique ; au-delà, c'est le zoom demandé qui fait foi.

**Reste pour I4b** : cotation et taille réelle (#40), progression/arrêt des opérations longues (#41), avertissements actionnables (#42), retour d'impression papier (#43).

---

## I4b — Sortie : dire ce qui va sortir, et quoi faire quand ça bloque · 22 novembre 2026

**Tag** : `checkpoint/i4b` · **Tickets fermés** : #43 · **Tickets avancés** : #41, #42 · **Note provisoire** : **3,7 / 5**.

| Mesure | Avant I4b | Après I4b | Preuve |
|---|---|---|---|
| Avant impression | clic → boîte système, sans rien dire | **résumé** « Imprimer 10 liens sur 1 page (A4 (210 × 297 mm)). » + Annuler / Imprimer | capture + `mesures-i4b.json` |
| Après impression | rien | **« Impression terminée ou annulée. »** — sans prétendre que le papier est sorti | code |
| Primaires pendant la confirmation | — | **1** : le bouton du pied s'efface, celui du résumé prend la place | capture |
| Accord des pages | « sur 1 pages » | **deux accords indépendants** : 10 liens, 1 page | mesure du texte |
| Refus de longueur (Niimbot) | constat seul | **action** « Changer d'étiquette » (+ « Encoder l'adresse courte » quand un raccourci existe) | capture |
| Export d'images long | libellé chiffré, sans sortie | **« Arrêter (3/40) »**, arrêt effectif, bilan « Export arrêté : 3 étiquette(s) sur 40. » ou « 40 étiquettes exportées — fichier » | code + test |
| Tests | 1 109 | **1 113** | `npm test` vert |

**Ce qui reste sur I4** : #40 (cotation et taille réelle), #41 (progression des exports ZIP et de la préparation papier), #42 (avertissements de la planche et du tableau, pas seulement de l'étiquette). C'est le programme d'I4c.

**Écart avec la cible du plan (4,45)** : la mesure donne **3,7**. Les deux paliers I4 ont surtout rendu la sortie **explicite** ; la note de finition viendra de la passe générale (I6).

---

## I4c — Cotation, conseils et écho des exports · 22 novembre 2026

**Tag** : `checkpoint/i4c` · **Tickets fermés** : #40, #42 · **Ticket avancé** : #41 · **Note provisoire** : **3,8 / 5**.

| Mesure | Avant I4c | Après I4c | Preuve |
|---|---|---|---|
| Cotes d'étiquette | dans la légende seulement | **12 mm** sous l'étiquette, **22 mm** à sa droite (lignes de cote) | capture |
| Cotation et orientation | millimètres de la géométrie | cotes de ce qui est **affiché** (rotation comprise) | code |
| Taille réelle | case existante | vérifiée : canvas **182 → 45 px** de large à 12 mm, légende « à la taille réelle » | mesure |
| Avertissement de planche | indice seul | **action** « Mise en page automatique » / « Ajuster la grille » sous l'indice | mesure |
| Export d'archive | clic muet pendant ~1 s | **écho** « Préparation… » peint **avant** le travail (une frame est laissée passer) | capture + code |
| Numérotation (demande de revue) | absente | option **« Numéroter les pages »**, « Page 1 / 4 » dans la marge | #55 |
| Tests | 1 114 | **1 117** | `npm test` vert |

**Trois corrections de justesse** : les cotes suivent l'orientation affichée et non la géométrie brute ; les décimales passent par `decimal()` (virgule française) ; l'écho d'export est différé d'une frame, sinon le navigateur ne le peint qu'après la fin du travail — constaté à la mesure.

**Reste sur #41** : la progression **chiffrée** des exports d'archive. Les archives mesurées tournent autour d'une seconde ; tant qu'une opération peut dépasser ce seuil sur une grosse collection, l'écho ne suffit pas à satisfaire le critère. Ticket laissé ouvert.


## Correctif — l'écart entre étiquettes ne rétrécit plus l'étiquette · 22 novembre 2026

Signalé en revue : « en mode planche, l'écart entre étiquettes crée une marge autour du QR Code et efface progressivement le texte ».

**Cause mesurée.** L'écart ne servait pas qu'à espacer : il **réduisait les cotes de l'étiquette**. À 3 × 4 sur A4, l'étiquette passait de **63,5 × 69,1 mm à 57,7 × 69,1 mm** quand l'écart horizontal montait de 1,25 à 10 mm. Le QR Code, calculé sur le plus petit côté, gardait sa proportion — d'où la marge apparente —, et le texte, lui, perdait des lignes jusqu'à disparaître.

**Correctif.** En mode manuel, les cotes viennent de la disposition et **ne bougent plus** ; c'est la **grille** qui cède : moins de colonnes ou de rangées si l'écart grandit, avec l'explication sous l'indice (« L'écart ou la marge a ramené la grille à 2 × 4 : la taille des étiquettes est conservée »). La grille réduite est centrée, et les champs Colonnes/Rangées suivent ce qui s'imprime. La mise en page automatique, elle, continue de déduire les cotes du contenu.

| Mesure (écart 1,25 → 10 mm) | Avant | Après |
|---|---|---|
| Cotes de l'étiquette | 63,5 → 57,7 mm | **63,5 × 69,1 mm, constantes** |
| Largeur du QR Code | 66 → 60 px | **66 px** |
| Lignes de texte dessinées | 6 → 6 (repliées, plus étroites) | **6, identiques** |
| Grille | 3 × 4 silencieusement rétrécie | **2 × 4 annoncée, centrée** |
| Champs Colonnes/Rangées | 3 × 4 (faux) | **2 × 4 (ce qui s'imprime)** |
| Tests | 1 117 | **1 118** |

Preuves : `.audit/captures-ecart/titre-long-ecart-1.png`, `titre-long-ecart-10.png`, `mesures-ecart2.json`.

## I4d — Progression et arrêt des archives · 22 novembre 2026

**Tag** : `checkpoint/i4d` · **Ticket fermé** : #41 · **Note provisoire** : **3,85 / 5**.

| Opération | Durée mesurée (400 liens) | Progression | Arrêt | Bilan |
|---|---|---|---|---|
| Archive de la planche | **148 ms** | écho « Préparation… » (peint avant le travail) | — | toast « fichier enregistré » |
| Archive du tableau | **~1 000 ms** | **« QR Code 12/40… »** | **Arrêter (12/40)**, coopératif | **« Export arrêté : 12 QR Code(s) sur 40. »** |
| Export d'images | boucle chiffrée | **« Étiquette 3/40… »** | oui | bilan « 40 étiquettes exportées » |
| Série Niimbot | série existante | chiffrée | oui | bilan |

**Ce qui a changé** : `buildTableArchive` accepte un **arrêt coopératif** (`shouldStop`) et rend `{ aborted, done, total }` ; l'export du tableau affiche le compte de QR Codes, un bouton Arrêter, et le bilan d'arrêt. Les opérations mesurées sous la seconde gardent l'écho seul, conformément au critère (« écho < 100 ms ; progression chiffrée au-delà d'1 s »).

**Mesure** : `.audit/captures-i4d/mesures-exports.json` (planche 148 ms, tableau ~1 000 ms, compteur de QR Codes).

**I4 est complet** : #39 canvas, #40 cotation, #41 progression, #42 avertissements, #43 retour d'impression, #55 numérotation, #56 écart des étiquettes.

## Correctif — le mode rangement · 22 novembre 2026

Signalé : « le bouton Réorganiser ne fonctionne plus, ou c'est le graphisme qui est confus ». Les deux, en fait.

**Le bug.** En mode rangement, `renderLink` prenait une branche dédiée et **retournait avant d'attacher le glissement** (`wireDrag`). La poignée et les flèches existaient, les flèches déplaçaient et enregistraient bien l'ordre — vérifié, il survit au rechargement —, mais **faire glisser une ligne ne faisait rien**. Le geste est désormais branché avant la bifurcation, sur **toute la ligne** et non plus seulement la poignée ; les liens ne naviguent plus pendant le rangement.

**La confusion.** Le mode ressemblait à du texte : deux triangles de 24 px sans surface, une poignée discrète, et les cases à cocher au milieu. Il se voit maintenant :

- liste encadrée, lignes sur fond alterné ;
- cases à cocher retirées (y compris la case maîtresse) : ce n'est pas la tâche ;
- poignée et flèches **de 28 px, avec bordure et fond**, cibles visibles ;
- bannière « Rangement en cours : faites glisser une ligne, ou utilisez les flèches. Échap pour terminer. » ;
- glissement **par la ligne entière**, y compris le titre.

| Mesure | Avant | Après |
|---|---|---|
| Glissement | sans effet | déplace, écrit `order`, survit au rechargement |
| Cibles visibles | glyphes de 24 px | boutons de **28 px** bordés |
| Cases à cocher en mode | visibles | **0** |
| Repère de mode | phrase parmi d'autres | **bannière** + liste encadrée |
| Tests | 1 119 | **1 122** |

Preuves : `.audit/captures-reorder/` (`apres-reorder.png`, `mesures-reorder.json` avec ordre et `order` stockés).

## I5 — Marque et site · 22 novembre 2026

**Tag** : `checkpoint/i5` · **Tickets fermés** : #44, #45, #46 · **Note provisoire** : **3,9 / 5**.

| Mesure | Avant | Après | Preuve |
|---|---|---|---|
| Héros du site | 78 mots, 8 lignes | **4 lignes** à 1440 px | `mesures-i5.json` |
| Visuels réels du produit | 0 | **3 captures** (planche, étiquette cotée, tableau) | site + `.audit/captures-i5/` |
| FAQ | 9 questions avec `<details>` | conservée, focus visible (déjà en I0) | mesure |
| Largeur de prose du site | ~125 car./ligne | **72** (57 ch) | mesure |
| Page de confidentialité | 93 car./ligne, **sans `viewport`** | **72 car./ligne**, `viewport`, **sommaire de 6 entrées**, mobile sans débordement | mesure |
| Rayons | site arrondi (20 px, 0.75 rem…) | **0 partout**, `--radius: 0` sur les trois surfaces | test |
| Mouvement | 120 ms en dur (web), 140 ms (fenêtre), site sans jeton | **`--motion`** partagé, réduction sur les trois surfaces | test `design-direction` |
| Ombres | une seule côté web | une seule, **aucune** sur le site | test |
| Captures des quatre modes | dispersées | **`mockup/quatre-modes.png`** | preuve |
| Tests | 1 119 | **1 126** | `npm test` vert |

**Défaut trouvé en relevant les quatre modes** : en mode Images, la légende affichait « (— × — mm) ». `decimal()` recevait une chaîne déjà passée par `toFixed()` ; les dimensions sont désormais passées en nombres, et le cadre n'est ajouté qu'une fois. Test de garde ajouté.

**Reste pour I6** : la passe générale de finition — curseur (#54), derniers composants « décoffrés », revue à l'œil des quatre surfaces, et vérification du barème instrumenté (#50) pour viser 4,8.

## Dettes de finition (assumées, pour I6)

Consignées au fil des revues, traitées lors de la **passe générale** avant la note 4,8 :

1. **Curseur** : acceptable en l'état (piste 3 px remplie, lame 10 × 20), mais encore « un peu brut ». Arbitrer le dessin final (pouce 8 × 16 ou 10 × 24, liseré interne, masse du remplissage) — ticket #54.
2. Compléter l'inventaire à chaque revue visuelle (cases, onglets, champs, densité, alignements optiques).

Rien de cette liste ne bloque I3–I5 : ce sont des points de finition, pas de structure.

---

## Prochains paliers

| Palier | Note visée | Porte de sortie |
|---|---|---|
| I1 Structure (I1a + I1b) | 3,0 mesuré | aperçu visible sans défiler (0 px), 1 primaire, < 40 contrôles |
| I2 Système (I2a + I2b) | 3,3 mesuré (cible 3,7 non tenue) | 0 valeur hors échelle, onglet actif ≥ 3:1 |
| I3 Liste & flux | 4,1 | liste dense, sélection contextuelle, import guidé |
| I4 Canvas & sortie | 4,45 | planche encadrée, zoom, progression |
| I5 Marque & site | 4,65 | direction tenue, site avec preuve visuelle |
| I6 Polissage | 4,8 | barème ≥ 4,8, 0 exception |
