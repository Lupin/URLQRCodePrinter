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
