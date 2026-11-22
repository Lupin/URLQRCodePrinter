# Référentiel de patterns UI/UX — refonte de URLQRCodePrinter

**Objet.** Fournir des patterns *concrets et applicables* pour refondre un outil utilitaire dense : collecte de liens à gauche, mise en page + aperçu d'étiquettes à droite, impression papier et étiqueteuse Bluetooth.

**Usage.** Document de référence pour la refonte : chaque pattern retenu est adossé à une source lue, et accompagné de ce qu'il ne faut pas copier. Il accompagne [l'audit UI/UX](audit-ui-ux-2026-11-22.md) et [le barème de qualité](barre-qualite-ui.md).

**Méthode.** Chaque affirmation de ce document adossée à une source externe provient d'une page réellement récupérée avec `web_fetch` le 22 novembre 2026. Les pages inaccessibles (murs de connexion, coquilles JavaScript) sont déclarées en §7, jamais comblées. Les faits sur le produit viennent de la lecture de [style.css](../../src/web/style.css), [index.html](../../src/web/index.html) et [app.js](../../src/web/app.js).

**Socle produit relevé (pour situer les recommandations).**

| Élément | État actuel | Référence |
|---|---|---|
| Grille | `minmax(320px, 420px) minmax(0, 1fr)`, gouttière 16 px, rupture à 900 px | [style.css:204](../../src/web/style.css#L204) |
| Rayon | `--radius: 0` unique | [style.css:55](../../src/web/style.css#L55) |
| Accent | `#c2410c` (orange brûlé), thème sombre `#fdba74` | [style.css:27](../../src/web/style.css#L27) |
| Typo | système, 14 px de base, libellés jusqu'à 9 px | [style.css:99](../../src/web/style.css#L99) |
| Thèmes | clair + sombre par `prefers-color-scheme`, sans bascule applicative | [style.css:64](../../src/web/style.css#L64) |
| Boutons primaires | « Ajouter » (gauche) **et** « Imprimer » (droite) | [index.html:172](../../src/web/index.html#L172), [index.html:891](../../src/web/index.html#L891) |
| Toast | bas-droite, 180 ms, empilement non géré | [style.css:1294](../../src/web/style.css#L1294) |
| Mouvement réduit | absent de l'application web (présent dans la fenêtre de l'extension) | [popup.css:656](../../src/extension-src/popup.css#L656) |

---

## §0 — Résumé : les 8 décisions recommandées

1. **Deux volets redimensionnables** (poignée, largeur mémorisée, 320–560 px) et panneau gauche repliable, plutôt qu'une grille figée avec rupture sèche.
2. **Un seul bouton primaire par vue** : « Imprimer » le reste ; « Ajouter » descend en secondaire et cesse de concurrencer la sortie.
3. **Liste dense et scannable** : ligne 36 px, numéro tabulaire, une ligne de méta, actions de ligne révélées au survol *et* au focus clavier.
4. **L'aperçu est le canvas** : chrome minimal, géométrie figée pendant qu'on règle, zoom/ajustement et passage plein écran à la demande.
5. **Un socle de tokens unique** : espacements 4/8/12/16/24/32, typo 11/12/13/14/16, contrôles 28/32/36, rayon 0 conservé, **une seule** ombre.
6. **Retour gradué dans le temps** : écho immédiat sous 100 ms, progression chiffrée au-delà de 1 s, toast de 240 ms pour le reste — jamais de rotation seule.
7. **Trois états vides distincts** (collection vide, recherche sans résultat, filtre sans résultat), chacun portant son action de sortie ; divulgation progressive au lieu d'un tutoriel.
8. **Thème** : suivre le système sans bascule applicative, deux élévations seulement, contraste mesuré (4,5:1 minimum, 7:1 visé), palette dérivée de trois pigments.

---

## §1 — Tableau de patterns (36 lignes applicables)

> Chaque ligne a été lue à l'URL indiquée. La colonne « ce qu'il ne faut pas copier » est aussi importante que les autres : c'est là que la refonte se perd.

| Pattern | Source (URL) | Pourquoi ça marche | Application précise à URLQRCodePrinter | Ce qu'il ne faut PAS copier |
|---|---|---|---|---|
| Chrome « L inversé » : en-tête + rail de navigation traités comme **une seule** surface | [Linear — partie II](https://linear.app/blog/how-we-redesigned-the-linear-ui) et [partie I](https://linear.app/now/a-design-reset) | Linear décrit n'avoir retouché que la sidebar, les onglets, les en-têtes et les panneaux, pour « réduire le bruit visuel, tenir l'alignement, et augmenter la hiérarchie et la densité de la navigation » sans toucher au contenu | Traiter la barre supérieure et les deux panneaux comme un seul chrome : même hauteur de ligne, même gouttière de 16 px (échelle 4/8), titres de panneau sur la même ligne de base | Une navigation multi-produits de type workspace : le produit n'a qu'un écran, le rail latéral deviendrait un ornement |
| Volet de navigation escamotable, deux niveaux maximum | [Apple HIG — Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars.md) | Les gens veulent masquer le volet pour gagner de la place ; l'interface doit prévoir le repli et éviter de placer des actions critiques en bas de volet (fenêtre souvent déplacée) | Le panneau « Ma collection » gagne un bouton de repli et un raccourci ; les actions destructrices (« Vider la collection ») remontent au-dessus de la zone de défilement, jamais dans le pied | Le volet translucide « Liquid Glass » : pour un outil d'impression, la lisibilité prime sur la matière |
| Deux volets redimensionnables, largeur persistée | [shadcn/ui — index des composants](https://ui.shadcn.com/llms.txt) + [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout.md) | shadcn expose un primitif dédié aux panneaux redimensionnables ; HIG impose qu'une fenêtre reste utilisable quand on la redimensionne et que le redimensionnement soit supporté par défaut | Remplacer la grille fixe par une poignée de 6 px avec zone de préhension de 12 px, min 320 / max 560, largeur mémorisée par profil | Un troisième volet permanent : la troisième colonne (inspecteur d'un lien) doit être un panneau temporaire, pas un tiers de la largeur |
| Panneau d'inspecteur à sections repliables | [Carbon — Patterns](https://www.carbondesignsystem.com/building-blocks/core/patterns/overview) + [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout.md) | Carbon classe la divulgation (« Disclosures ») comme pattern de premier rang ; HIG demande la divulgation progressive pour alléger un écran chargé | Les quatre onglets existants restent, mais chaque `fieldset` devient une section mémorisée : Page, Étiquette, En-tête, Raccourcissement — ouvertes par défaut seulement quand une valeur diffère du défaut | Replier sans indice : une section repliée dont une valeur n'est pas celle par défaut doit porter un badge « modifié » |
| Liste maîtresse + volet de détail | [Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md) | Le composant de liste de Raycast propose `isShowingDetail` : la liste reste compacte, le détail s'affiche à droite, et Raycast recommande explicitement de **retirer les accessoires** redondants quand le détail est ouvert | L'édition d'un lien (aujourd'hui dépliée dans la ligne) passe dans un volet de détail à droite de la liste ; la ligne garde numéro, titre, hôte, et cesse d'héberger des champs | Dupliquer dans la ligne l'information affichée dans le détail : c'est précisément ce que Raycast déconseille |
| Recherche filtrante intégrée à la liste | [Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md) | Filtrage intégré sur le titre et des `keywords` indexables, avec `throttle` pour le filtrage asynchrone ; la recherche est un champ, pas un panneau | `#search` filtre titre, URL et tags, avec un compteur de résultats à côté du champ et la touche `Échap` qui vide la requête | Un panneau de filtres à cases à cocher : un champ + un menu déroulant suffisent pour 50 liens |
| Second axe de filtre logé dans la barre de recherche | [Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md) | `searchBarAccessory` place un menu déroulant à droite de la barre de recherche : un second axe (collection, tri, type) sans ajouter de ligne d'interface | Ajouter à droite de `#search` un menu « Collection / Tri », aujourd'hui dispersé entre le sélecteur de collection et `#sort` | Deux champs de recherche distincts (liens / tableau) : un seul champ doit filtrer ce qui est affiché |
| Barre d'actions contextuelle de sélection | [Beautiful UI — Selection Actions](https://www.beautifului.dev/) | Les actions de masse n'apparaissent qu'avec une sélection, au lieu de rester grisées en permanence et d'occuper l'œil | La barre actuelle (Réorganiser, Déplacer vers, Supprimer) devient une barre collante qui n'existe que si `sélection > 0`, avec le compte en tête (« 3 liens sélectionnés ») | Six boutons grisés visibles à vide dans le panneau gauche |
| Table de records avec tri, tags et état par ligne | [Beautiful UI — Records Table](https://www.beautifului.dev/) | Une grille de records lisible (entreprise, catégories, dernière interaction, force de connexion) rend une donnée dense scannable sans ouvrir de fiche | Onglet Tableau : en-tête collant, tri par colonne (numéro, hôte, date), état QR par ligne (à jour / cassé / non vérifié), largeur de colonne mémorisée | Recopier cinq colonnes de tags : la table de liens a besoin de trois colonnes fortes, pas d'un CRM |
| Table dense avec sélection de lignes et colonnes déplaçables | [21st.dev — Data Grid Table, variante dense](https://21st.dev/@sean0205/components/data-grid-table/dense-table) | La démo s'appuie sur TanStack Table : tri, pagination, visibilité et déplacement de colonnes, cellules composées — le tout sans perdre la densité | Si l'onglet Tableau grandit (plus de 10 colonnes), prévoir densité réglable, sélection de lignes et export de la sélection | Embarquer TanStack pour la liste de liens : c'est une liste **ordonnée** (numérotation imprimée), pas une grille de données |
| Sélection multiple avec état explicite et sortie de sélection | [Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md) | `selectedItemId`, `onSelectionChange` et le cas « plus aucun élément sélectionné » sont explicitement modélisés : la sélection est un état de premier rang, pas un effet de bord | Le `#selection-hint` existant devient une vraie barre d'état ; la touche `Échap` vide la sélection ; « Tout sélectionner » est une case d'en-tête avec état indéterminé | Une sélection qui survit à un changement de collection ou de recherche sans le dire : source d'erreur irréversible |
| Réordonnancement par poignée **et** par boutons | [Apple HIG — Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars.md) | HIG recommande de laisser les gens décider de l'ordre des éléments d'un volet ; un ordre personnalisable doit rester opérable sans glisser-déposer | Conserver le couplage actuel (poignée ⠿ + flèches ↑↓) et l'étendre : insertion au clavier (⌥↑ / ⌥↓), annonce `aria-live` du nouvel index | Un réordonnancement par glisser seul : inaccessible au clavier et imprécis sur une ligne de 36 px |
| Lignes de tâches avec état et compteurs | [Beautiful UI — Task Rows](https://www.beautifului.dev/) | Une ligne par traitement, avec l'état (en cours / échec / terminé) et un compteur (« 12/12 »), rend un lot lisible d'un coup d'œil | Génération de planche et impression : une ligne par page (« Page 2 — 18/24 QR ») remplace le toast unique « Impression… » | Transformer la liste des liens en file de tâches : ce sont deux objets, l'un est un contenu, l'autre un journal |
| État vide anatomique : titre positif, corps, action | [Carbon — Empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states) | Carbon détaille l'anatomie (image optionnelle, titre, corps expliquant l'action, action primaire, action secondaire) et recommande un titre positif : « Start by adding data assets » plutôt que « You don't have any data assets » | Le bloc actuel « Aucun lien. » devient : titre « Commencez par ajouter un lien », corps d'une phrase sur les trois entrées possibles, bouton primaire « Ajouter un lien », lien secondaire « Importer une archive » | Une grande illustration dans un panneau de 320 px : Carbon dit explicitement de n'utiliser que du texte quand la place manque |
| État vide dégradé en espace étroit | [Carbon — Empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states) | Dans une tuile ou un panneau latéral, l'image passe au-dessus d'un bloc de texte aligné à gauche ; en cas d'états vides multiples simultanés, Carbon recommande un bouton tertiaire pour éviter plusieurs primaires | L'état vide de la liste est en texte seul ; si la page 2, le tableau et l'étiquette sont vides en même temps, leurs appels à l'action passent en tertiaire | Un bouton primaire dans chaque zone vide : trois primaires à l'écran, plus aucune hiérarchie |
| État vide spécifique à la recherche | [Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md) | `List.EmptyView` est un composant à part : « Type something to get started » n'est pas le message de « aucun résultat » | Trois états distincts : collection vide, recherche sans résultat (« Aucun lien ne correspond à « x » — Effacer la recherche »), filtre sans résultat (« Aucun lien dans cette collection ») | Un seul message générique pour les trois cas : l'action de sortie n'est pas la même |
| Toast borné : trois lignes, largeur fixe, empilement | [Carbon — Notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications) | Un toast est un message « at-a-glance » : trois lignes maximum, largeur fixe, empilement vertical avec le plus récent en haut ; les toasts avec action persistent | `#toast` garde `role="status"`, mais plafonne à deux lignes, empile au lieu de remplacer, et reste persistant quand il porte « Annuler » | Empiler des toasts d'erreur de formulaire : une erreur de champ va dans le champ |
| Choisir inline, toast ou bannière selon l'origine | [Carbon — Notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications) | Carbon distingue les notifications issues d'une tâche (près de la zone concernée) des notifications système ; il prévient aussi contre la « fatigue d'alerte » | Erreur d'URL → inline sous le champ ; export ou impression terminés → toast ; imprimante Niimbot déconnectée → bannière inline persistante en haut du panneau | Notifier deux fois la même chose (inline + toast) : l'utilisateur cherche le conflit |
| Statut = couleur **et** icône, jamais la couleur seule | [Carbon — Notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications) | Chaque statut Carbon (information, succès, avertissement, erreur) associe une couleur et une icône, pour rester lisible en daltonisme et en contraste forcé | Les états du produit (« connecté » en vert, « QR cassé » en danger, « à vérifier ») portent tous une icône et un libellé, pas seulement `--ok` ou `--danger` | Multiplier les teintes chaudes : la palette doit rester à quatre statuts (neutre, accent, danger, ok) |
| Un seul bouton primaire par vue | [Carbon — Button](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) | « Each page should have only one primary button » ; le secondaire n'existe qu'en paire avec un primaire et porte l'action négative (« Annuler ») | « Imprimer » reste primaire ; « Ajouter » passe en secondaire avec bordure ; « Exporter… » reste fantôme ; un seul primaire visible à la fois | Promouvoir chaque action utile en primaire : c'est le défaut le plus fréquent des refontes |
| Tailles de bouton alignées sur les champs | [Carbon — Button](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) | Carbon apparie explicitement les tailles : bouton petit avec champ 32 px, moyen avec champ 40 px, grand « productif » avec du texte 14 px ; il déconseille de mélanger les tailles dans un groupe | Figer trois hauteurs (28 compact / 32 défaut / 36 barre d'actions) et aligner `input` et `select` sur la même hauteur que le bouton voisin | Un bouton de 26 px à côté d'un champ de 34 px : la ligne ne tient pas |
| Variantes de bouton nommées, vérifiables | [21st.dev — Button de shadcn](https://21st.dev/@shadcn/components/button) | La démo expose `default / secondary / destructive / outline / ghost / link / icon / loading` : la hiérarchie devient une API testable au lieu d'un empilement de classes | Mapper `.btn--primary`, `.btn--ghost`, `.btn--danger` sur une table unique de variantes, avec un test qui vérifie qu'une seule primaire est visible par onglet | Importer trois niveaux bas (outline + ghost + link) : deux niveaux bas suffisent |
| Couleurs par rôles sur une échelle de 12 pas | [Radix — Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) | Chaque pas a un usage documenté : 1–2 fonds, 3–5 fonds de composants (défaut/survol/actif), 6–8 bordures, 9–10 aplats, 11–12 texte | Formaliser les tokens sur ce mappage : `--surface` = pas 2, `--surface-2` = pas 3, `--border-line` = pas 6, `--border-strong` = pas 7, `--text-3` = pas 11, `--text` = pas 12, `--accent` = pas 9 | Utiliser l'accent (pas 9, chroma maximal) comme fond d'un composant neutre : il attirerait l'œil sans être une action |
| Mode sombre en deux élévations, sans inversion | [Apple HIG — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md) | Cupertino décrit deux jeux de fonds — *base* (sombre, recule) et *elevated* (plus clair, avance) — et demande de ne pas offrir de réglage d'apparence propre à l'application | Deux niveaux seulement : `--bg` (#161616) et `--surface` (#262626) ; un panneau se pose sur la page, une modale se pose sur un panneau | Un quatrième gris « pour faire joli » : chaque niveau supplémentaire brouille la profondeur |
| Thème dérivé de trois variables | [Linear — partie II](https://linear.app/blog/how-we-redesigned-the-linear-ui) | Linear remplace 98 variables par trois (couleur de base, accent, contraste) générées en LCH, ce qui donne aussi des thèmes à fort contraste pour l'accessibilité | Extraire trois pigments (accent, neutre, ok) et générer les pas intermédiaires en LCH plutôt qu'à la main ; le thème sombre devient une transformation, pas un doublon | La dérive actuelle de deux gris presque identiques (`#e8e8e8`, `#e0e0e0`) sans rôle distinct |
| Durées et courbes tokenisées | [Carbon — Motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) | Carbon distingue mouvement *productif* et *expressif*, fait dépendre la durée de la distance, et publie six jetons (70, 110, 150, 240, 400, 700 ms) avec leurs courbes | Jetons : 110 ms survol, 150 ms dépliage, 240 ms toast, 400 ms panneau ; courbe productive `cubic-bezier(0.2, 0, 0.38, 0.9)` ; expressif réservé au succès d'impression | Une courbe à rebond pour un dépliage de section : le mouvement doit expliquer, pas divertir |
| Mouvement réduit respecté | [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) | Une préférence système existe pour les troubles vestibulaires ; les animations de mise à l'échelle ou de déplacement de grandes surfaces en sont les déclencheurs typiques | Ajouter le bloc `@media (prefers-reduced-motion: reduce)` à l'application web : toast sans translation, panneaux sans transition, changement d'état instantané mais lisible | Un `transition: none` global : on perd aussi les retours de survol utiles |
| Trois seuils de délai perçu | [NN/g — Website Response Times](https://www.nngroup.com/articles/website-response-times/) | 0,1 s donne la sensation d'immédiateté, 1 s préserve le fil de la pensée, 10 s retient l'attention ; au-delà, l'utilisateur décroche | Génération de 24 QR : écho immédiat (< 100 ms) sur le bouton, barre de progression dès 1 s, message avec temps écoulé si l'opération dépasse quelques secondes | Une roue qui tourne sans progression pendant l'impression : l'utilisateur ne sait pas si le travail avance |
| Divulgation progressive des réglages avancés | [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Nielsen prend la boîte d'impression comme exemple canonique : peu d'options d'abord, les réglages spécialisés à la demande ; il exige que la progression soit évidente | Les marges mm, décalages et écarts (rarement touchés) restent derrière « Ajuster l'espacement » ; format, disposition et nombre de colonnes restent visibles — ce sont eux qu'on règle à chaque impression | Cacher ce qu'on règle tous les jours : la divulgation doit suivre la fréquence d'usage |
| Moins de bordures, plus d'espace | [Refactoring UI](https://refactoringui.com/) | Le chapitre « Use fewer borders » propose de remplacer un trait par une ombre, un fond contrasté ou de l'espace : trop de traits rendent l'interface occupée | Le panneau droit empile des `fieldset` à contour : les séparer par un rythme vertical (16/24 px) et un seul trait entre groupes, en gardant le contour sur les champs eux-mêmes | Supprimer tous les traits : la planche en millimètres a besoin de repères physiques |
| Une seule ombre, translucide | [Geist — Colors](https://vercel.com/geist/colors) | Geist demande de garder les ombres translucides (une ombre opaque laisse un halo gris) et de ne dessiner chaque bordure qu'une fois (des bordures alpha superposées font ressortir les intersections) | Une seule ombre dans l'application (`0 1px 2px rgba(0,0,0,.08)`), réservée à l'onglet actif et aux surfaces flottantes ; rien sur les panneaux | Une ombre par carte + une bordure + un fond teinté : trois façons de dire la même limite |
| Typo produit : 14 par défaut, 13 en secondaire, chiffres tabulaires | [Geist — Typography](https://vercel.com/geist/typography) | Geist documente `label-14` comme « most common text style of all », `label-13` comme secondaire avec chiffres tabulaires, `copy-13` pour les vues où l'espace est compté | Corriger les numéros de lien, les millimètres et les compteurs en `font-variant-numeric: tabular-nums` ; garder 14 px pour le texte principal et 13 px pour la méta | Passer tout le corps à 12 px « pour faire dense » : la densité vient de l'espacement et des lignes, pas de la taille du texte |
| Taille minimale de texte | [Apple HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography.md) | Sur macOS, Apple donne 13 pt par défaut et **10 pt minimum**, et déconseille les graisses Light pour le texte petit | Établir un plancher à 11 px, 12 px pour les libellés de champ ; les contrôles de ligne à 9–10,5 px ([style.css:904](../../src/web/style.css#L904)) remontent | Compenser par la couleur : petit et gris n'est pas « discret », c'est illisible |
| Échelle d'espacement 4/8 | [Carbon — Spacing](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview) + [Radix — Spacing](https://www.radix-ui.com/themes/docs/theme/spacing) | Carbon publie 2/4/8/12/16/24/32/40/48/64 px ; Radix 4/8/12/16/24/32/40/48/64 px avec un facteur d'échelle global (90–110 %) pour régler la densité | Adopter 4/8/12/16/24/32 et interdire les valeurs hors échelle ; remplacer les paddings 3/6/7/9/10/22 px hérités | Un facteur d'échelle réglable par l'utilisateur : un outil d'impression doit rester au millimètre, pas à 105 % |
| Galerie de composants comme spécification | [21st.dev](https://21st.dev/) | La galerie classe 12 000 composants par usage et nomme les variantes ; chaque composant expose sa démo copiable, ce qui en fait un vocabulaire commun | Utiliser cette taxonomie comme liste de spécifications à couvrir : `resizable`, `command`, `empty`, `data-table`, `selection-actions`, `toast`, `kbd` | Le goût de la galerie : sa page d'accueil met en avant « Liquid Metal Hero », « Liquid Glass Button », « Aurora Background », « Shader Animation » — objets de marketing, hors sujet ici |
| Référence sur écrans réels, annotés | [Mobbin — MCP](https://mobbin.com/mcp) + [Mobbin — clients](https://mobbin.com/customers) | Mobbin revendique 600 000 écrans réels et une méthode de référence par écran annoté ; un designer cité sur la page clients y voit « les bonnes pratiques ou les standards » de son domaine | Pour chaque pattern retenu, citer le composant ou l'écran réel qui l'incarne — et non une impression — avant de l'appliquer à cet outil | S'appuyer sur les captures Mobbin comme preuve visuelle : la galerie est derrière une connexion (voir §7), seules les pages marketing ont été lues |

---

## §2 — Couverture par domaine

### (a) Layout d'outil à deux ou trois volets, et redimensionnement

**Ce que disent les sources.** Apple HIG demande une mise en page qui s'adapte à la taille de fenêtre et au redimensionnement, et note que la hiérarchie visuelle se lit par l'alignement, l'indentation et le regroupement ([HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout.md)). HIG demande aussi de laisser masquer un volet et de ne pas y placer d'action critique en bas ([HIG — Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars.md)). Linear décrit le chrome en « L inversé » comme la seule surface à retoucher pour gagner en densité et en calme ([Linear, partie II](https://linear.app/blog/how-we-redesigned-the-linear-ui)). Raycast modélise le troisième volet comme un détail d'élément sélectionné, et non comme une colonne permanente ([Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md)).

**Application.** Le produit a déjà deux volets, mais la largeur est figée (`minmax(320px, 420px)`) et la rupture à 900 px empile tout d'un coup ([style.css:204](../../src/web/style.css#L204), [style.css:217](../../src/web/style.css#L217)). Trois changements :

1. Une poignée de redimensionnement entre les volets (curseur `col-resize`, zone de préhension 12 px pour une cible tactile correcte), bornes 320 et 560 px, largeur conservée dans les réglages locaux.
2. Un état « volet gauche replié » (32 px de rail avec l'icône, réouverture au clic ou au raccourci), pour les moments où l'on ne travaille que la planche.
3. Un troisième volet **temporaire** pour l'édition d'un lien (panneau de 280–320 px à droite de la liste), qui se ferme à `Échap` et rend le focus à la ligne. Jamais trois colonnes permanentes.

**Piège.** Empiler en dessous de 900 px fait perdre le bénéfice du deuxième volet : mieux vaut un volet repliable qu'un empilement subi.

### (b) Barre d'outils, panneau d'inspecteur, propriétés contextuelles

**Ce que disent les sources.** Carbon distingue les actions de barre d'outils des actions de page : dans un contexte à plusieurs actions (barres d'outils, listes, tableaux de bord), il faut préférer les boutons de faible emphase ([Carbon — Button](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines)). Carbon identifie aussi « Text toolbar » et « Disclosures » comme patterns à part entière ([Carbon — Patterns](https://www.carbondesignsystem.com/building-blocks/core/patterns/overview)). Raycast montre qu'une liste peut porter ses actions dans un panneau contextuel lié à la sélection ([Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md)).

**Application.** Le panneau droit est déjà un inspecteur par onglets (Planche / Tableau / Étiquette Niimbot / Étiquette divers), ce qui est la bonne architecture : chaque mode ne montre que ses réglages. Deux corrections :

- Une **barre d'outils de mode** au-dessus des réglages : à gauche le mode, à droite les deux actions de sortie du mode (exporter la planche, imprimer). Aujourd'hui ces deux sorties sont dans `#panel-actions` en bas, loin des réglages qui les gouvernent.
- Des **propriétés contextuelles** : quand une sélection existe, l'inspecteur affiche en tête un résumé calculé (numéros concernés, pages couvertes, nombre d'étiquettes) avant les réglages. C'est la version « propriétés » de la barre de sélection.

**Piège.** Mettre les actions de masse dans l'inspecteur de droite : elles concernent la liste de gauche, elles doivent rester du côté de la liste.

### (c) Surface canvas ou aperçu avec chrome minimal

**Ce que disent les sources.** HIG demande de différencier les contrôles du contenu et propose des effets de bord de défilement pour que les contrôles flottent au-dessus du contenu, au lieu d'un fond opaque ([HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout.md)). Linear traite l'affichage (liste, tableau, chronologie, découpage, plein écran) comme un mode, pas comme un panneau de plus ([Linear, partie II](https://linear.app/blog/how-we-redesigned-the-linear-ui)). Geist rappelle qu'une limite ne se dessine qu'une fois ([Geist — Colors](https://vercel.com/geist/colors)).

**Application.** L'aperçu (`#preview`, `.preview__surface`) est déjà séparé du papier par `#print-root` : c'est le bon découpage, à conserver tel quel. À ajouter :

- Un cadre unique autour de l'aperçu (il en a déjà un), et **rien** à l'intérieur : ni grille, ni libellés mm à l'écran. Les légendes (`#preview-caption`) restent *sous* le cadre, comme aujourd'hui.
- Trois contrôles flottants dans un coin : ajuster à la largeur, zoom 100 %, plein écran. Disparaissent après 2 s d'inactivité, réapparaissent au survol ou au focus.
- Une navigation de page (◀ 2/5 ▶) rattachée au cadre, pas au panneau de réglages.
- Le mode plein écran de l'aperçu (maquette agrandie, panneau droit replié) — l'équivalent du « fullscreen » de Linear.

**Piège.** Dessiner une grille ou des cotes dans l'aperçu : on ne saurait plus distinguer ce qui sera imprimé de ce qui est une aide.

### (d) Gestion de liste : lignes, sélection multiple, réordonnancement, recherche, densité

**Ce que disent les sources.** Raycast documente la liste comme l'interface par défaut : filtrage intégré sur titre et mots-clés, sections, accessoires (texte, date, tag, icône), pagination avec `pageSize`, `isShowingDetail`, et un état vide dédié ([Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md)). 21st.dev propose des variantes explicites de table dense, de sélection de lignes et de colonnes déplaçables ([Data Grid Table — dense](https://21st.dev/@sean0205/components/data-grid-table/dense-table)). Beautiful UI montre des barres d'actions de sélection ([Beautiful UI](https://www.beautifului.dev/)). Carbon rappelle que l'espace crée la relation et la hiérarchie ([Carbon — Spacing](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview)).

**Application — la ligne de lien.** Une seule ligne, 36 px de haut, quatre zones :

| Zone | Contenu | Règle |
|---|---|---|
| 1 | Poignée ⠿ + case à cocher | 24 px de cible minimum ; la poignée n'apparaît qu'au survol ou au focus |
| 2 | Numéro (`tabular-nums`) | Largeur fixe de 32 px, aligné à droite |
| 3 | Titre + hôte | Une seule ligne chacun, troncature au milieu pour l'URL |
| 4 | Actions de ligne | Révélées au survol et au focus, sinon invisibles mais présentes au clavier |

**Densité.** Trois valeurs derrière un seul jeton `--row-h` : 32 px (compacte), 36 px (défaut), 44 px (confortable) — jamais réglées à la main.

**Recherche et tri.** Un champ, un menu déroulant à droite (« Tout / Collection courante / Sélection »), et une ligne de résultat comptée (« 12 résultats sur 48 »). Le tri se fait par le menu, pas par un clic sur l'en-tête de liste (il n'y a pas d'en-tête dans une liste).

**Réordonnancement.** Le couplage actuel poignée + flèches est bon et doit rester ([style.css:923](../../src/web/style.css#L923), [app.js:1241](../../src/web/app.js#L1241)). À ajouter : `⌥↑`/`⌥↓` au clavier, et une annonce `aria-live` « déplacé en position 3 sur 48 ».

**Piège.** Faire de la liste un tableau éditable : l'ordre et la numérotation sont le sens de cet objet.

### (e) États vides et premiers pas

**Ce que disent les sources.** Carbon fournit une anatomie complète et trois familles d'états vides : absence de données (premier usage), conséquence d'une action (recherche sans résultat, fin de processus), et gestion d'erreur ; il recommande un titre positif et l'action la plus directe ([Carbon — Empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states)). Raycast fournit un composant dédié pour l'état vide de liste ([Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md)). HIG demande de faire de la divulgation progressive le moyen d'alléger un écran surchargé ([HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout.md)).

**Application.** Trois états, trois sorties :

| Situation | Titre | Action |
|---|---|---|
| Collection vide | « Commencez par ajouter un lien » | Primaire : « Ajouter un lien » (focus dans le champ) ; secondaire : « Importer une archive » |
| Recherche sans résultat | « Aucun lien ne correspond à « … » » | « Effacer la recherche » |
| Collection sans correspondance après filtre | « Aucun lien dans cette collection » | « Voir toutes les collections » |

Le message actuel (`Aucun lien.` + une phrase à trois entrées) est déjà proche de l'anatomie Carbon : il lui manque un titre positif et un bouton pour agir, au lieu d'une phrase à lire.

**Piège.** Un état vide illustré dans un panneau de 320 px : Carbon demande explicitement du texte seul quand la place manque.

### (f) Feedback de progression et de succès

**Ce que disent les sources.** NN/g fixe trois seuils : 0,1 s, 1 s, 10 s ([NN/g — Website Response Times](https://www.nngroup.com/articles/website-response-times/)). Carbon décrit les toasts (trois lignes, coin haut droit, empilement, action qui persiste), les inline (près de la zone concernée) et met en garde contre la fatigue d'alerte ([Carbon — Notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications)). Beautiful UI montre des lignes de tâches avec état et compteur, et un écran de chargement qui affiche le temps écoulé ([Beautiful UI](https://www.beautifului.dev/)). Enfin, la « visibilité de l'état du système » est la première des dix heuristiques de Nielsen ([NN/g — 10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)).

**Application — la règle des trois vitesses.**

1. **< 100 ms** : écho immédiat. Le bouton pressé change d'état, la ligne ajoutée apparaît avant l'enregistrement (optimiste, avec retour arrière si échec).
2. **< 1 s** : état en place, sans barre. Un simple texte « Génération… » sur le bouton suffit.
3. **> 1 s** : progression **chiffrée** et temps écoulé — « 18/40 QR — 4 s ». Pour une impression, une ligne par page.
4. **> 10 s** (impression Niimbot, gros lots) : la progression reste, un bouton « Arrêter » apparaît, et la fenêtre reste utilisable.

Le toast actuel est en bas à droite et peut recouvrir `#panel-actions` (donc « Imprimer ») : le déplacer en haut à droite (Carbon) ou réserver une marge basse au conteneur d'actions.

**Piège.** Un spinner sans progression sur une opération de plusieurs secondes : l'utilisateur ne peut pas distinguer « ça travaille » de « c'est bloqué ».

### (g) Échelles typographiques et d'espacement (valeurs chiffrées, 4/8 pt)

**Ce que disent les sources.** Carbon : 2/4/8/12/16/24/32/40/48/64 px, « multiples de deux, quatre et huit » ([Carbon — Spacing](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview)). Radix : 4/8/12/16/24/32/40/48/64 px, avec un facteur d'échelle global de 90 à 110 % ([Radix — Spacing](https://www.radix-ui.com/themes/docs/theme/spacing)). Carbon typographie : 12/14/16/18/20/24/28/32… et graisses Light/Regular/SemiBold ([Carbon — Typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview)). Geist : `label-14` le plus courant, `label-13` secondaire et tabulaire, `copy-13` pour les vues serrées ([Geist — Typography](https://vercel.com/geist/typography)). HIG : 13 pt par défaut et 10 pt minimum sur macOS ([HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography.md)).

**Application.** Voir §3 pour les tableaux complets. En résumé : cinq tailles de texte (11, 12, 13, 14, 16), sept pas d'espacement (4, 8, 12, 16, 24, 32, 40), et l'exigence que toute valeur du fichier de style appartienne à l'une de ces listes.

**Piège.** Introduire 5, 7, 10, 14 px « pour ajuster » : c'est ainsi qu'un système se dissout. L'état actuel contient déjà 3, 6, 7, 9, 10, 22 px.

### (h) Hiérarchie de boutons et rôles de couleur

**Ce que disent les sources.** Carbon : un seul primaire par page (hors en-tête, modale, panneau latéral) ; secondaire uniquement en paire ; tertiaire pour les actions indépendantes ; fantôme pour les moins prononcées ; danger pour le destructif ([Carbon — Button](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines)). Radix : 12 pas, chacun avec un usage, le pas 9 étant le plus chromatique ([Radix — Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)). Carbon typographie : garder la couleur du texte neutre, réserver la couleur primaire aux actions ([Carbon — Typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview)).

**Application — quatre rôles, pas plus.**

| Rôle | Couleur | Usage dans le produit |
|---|---|---|
| Action principale | accent (`#c2410c` / `#fdba74`) | « Imprimer », un seul à l'écran |
| Action de surface | encre neutre (`--ink`) | « Ajouter », « Enregistrer » — autrefois primaires |
| Action discrète | bordure `--border-strong`, fond transparent | exports, réorganisation, retirer |
| Danger | `--danger` sur bordure, icône et libellé, fond neutre | vider, supprimer |

**Piège.** Utiliser l'accent comme couleur de survol universelle : le produit s'est déjà donné la règle inverse en commentaire ([style.css:708](../../src/web/style.css#L708)), et elle est juste.

### (i) Mouvement et micro-interactions

**Ce que disent les sources.** Carbon publie les courbes et les durées, avec deux registres : productif et expressif ; il demande d'éviter les courbes décoratives ([Carbon — Motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview)). MDN décrit `prefers-reduced-motion` et nomme les déclencheurs vestibulaires ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)).

**Application.**

| Moment | Durée | Courbe |
|---|---|---|
| Survol, focus, appui | 110 ms | productive standard |
| Dépliage d'une section | 150 ms | productive standard |
| Toast entrant | 240 ms | productif entrant |
| Panneau de détail | 400 ms | productif standard |
| Succès d'impression | 400–700 ms | expressif, une seule fois |

`@media (prefers-reduced-motion: reduce)` : toast sans translation (fondu seul), panneaux sans transition, et **aucune** animation de mise à l'échelle.

**Piège.** Animer la largeur des volets pendant le redimensionnement à la souris : le mouvement doit être direct, sinon l'interface paraît molle.

### (j) Mode sombre

**Ce que disent les sources.** HIG : ne pas proposer de réglage d'apparence propre à l'application, respecter le choix système, deux fonds (base et élevé), contraste minimal 4,5:1 et cible 7:1 pour les couleurs personnalisées ([HIG — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md)). Linear : thèmes générés en LCH à partir de trois variables, avec un axe de contraste ([Linear — partie II](https://linear.app/blog/how-we-redesigned-the-linear-ui)). Radix : échelles sombres dédiées, pas des inversions ([Radix — Scales](https://www.radix-ui.com/colors/docs/palette-composition/scales)). Geist : ombres translucides, une seule bordure ([Geist — Colors](https://vercel.com/geist/colors)).

**Application.** Le produit suit déjà le système : c'est conforme et à conserver. Trois corrections : ramener le nombre de gris à deux niveaux d'élévation, générer les pas en LCH depuis trois pigments, et vérifier par test les paires `--text-3 / --surface`, `--accent-ink / --accent`, `--border-strong / --surface` dans les deux thèmes (seuils 4,5:1 et 3:1).

**Piège.** Ajouter un bouton « Clair / Sombre » dans la barre supérieure : c'est l'exemple même que HIG déconseille, et cela double la surface de test.

### (k) Divulgation progressive, onboarding sans tutoriel

**Ce que disent les sources.** NN/g : montrer d'abord peu d'options, proposer les options spécialisées à la demande, et rendre la progression évidente ([NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)). HIG recommande la divulgation progressive pour alléger un écran ([HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout.md)). Carbon range les divulgations parmi ses patterns ([Carbon — Patterns](https://www.carbondesignsystem.com/building-blocks/core/patterns/overview)). NN/g rappelle que la visibilité de l'état du système et la reconnaissance plutôt que le rappel sont des heuristiques de base ([NN/g — 10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)).

**Application.** Pas de visite guidée, pas de bulles. Quatre dispositifs suffisent :

1. **Une ligne d'amorce** dans l'état vide (déjà présente, à raccourcir).
2. **Des valeurs par défaut crédibles** : une planche prête à imprimer sans rien régler ; l'utilisateur ne voit les réglages mm que s'il clique « Ajuster l'espacement ».
3. **Des indices contextuels à la première utilisation seulement** (`hint--tight` existe déjà, à afficher tant que le réglage est au défaut, puis à masquer).
4. **La découverte par l'action** : le premier import montre la fusion, le premier changement de disposition montre l'aperçu bouger. C'est la divulgation par l'usage.

**Piège.** Un tutoriel en surcouche pour expliquer une interface qu'on pourrait rendre évidente : il coûte un écran, se ferme, et ne revient jamais.

---

## §3 — Valeurs concrètes

### 3.1 Espacement

| Jeton | Valeur | Source | Emploi |
|---|---|---|---|
| `space-1` | 4 px | [Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview) | Écart icône / libellé |
| `space-2` | 8 px | Carbon, [Radix](https://www.radix-ui.com/themes/docs/theme/spacing) | Gouttière interne des contrôles |
| `space-3` | 12 px | Carbon, Radix | Entre deux champs d'une même ligne |
| `space-4` | 16 px | Carbon, Radix | Padding de panneau, gouttière entre volets |
| `space-5` | 24 px | Carbon, Radix | Entre deux groupes de réglages |
| `space-6` | 32 px | Carbon, Radix | Entre deux sections majeures |
| `space-7` | 40 px | Carbon, Radix | Marge de page en grand écran |

Règle : aucune valeur hors échelle. Les 3, 6, 7, 9, 10, 22 px présents aujourd'hui disparaissent.

### 3.2 Tailles typographiques

| Rôle | Taille / interligne | Graisse | Source |
|---|---|---|---|
| Micro-libellé (rare) | 11 px / 14 px | 500 | Cible dérivée ; plancher [HIG](https://developer.apple.com/design/human-interface-guidelines/typography.md) (10 pt minimum sur macOS) |
| Libellé de champ, méta | 12 px / 16 px | 500 | [Geist](https://vercel.com/geist/typography) `label-12`, `label-13` |
| Texte secondaire | 13 px / 18 px | 400 | Geist `copy-13`, `label-13` |
| Texte principal | 14 px / 20 px | 400 | Geist `label-14` (« most common »), [Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview) (14 px) |
| Titre de panneau | 16 px / 22 px | 600 | Carbon (SemiBold réservé aux en-têtes de section) |
| Chiffres, URL, mm | 13 px, `tabular-nums` | 400 | Geist (`label-13` tabulaire) |

Le produit est déjà à 14 px de base avec une échelle 9–20 px : il suffit de supprimer le bas de l'échelle.

### 3.3 Hauteurs de contrôles

| Contrôle | Hauteur | Source | Remarque |
|---|---|---|---|
| Bouton / champ par défaut | 32 px | [Carbon](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) : la taille « small » s'apparie avec un champ de 32 px | Une seule hauteur pour `input`, `select` et bouton |
| Bouton de barre d'actions | 36 px | Cible dérivée (32 px + un pas de 4 px) ; Carbon documente une taille « large productive » pour le texte 14 px | Barre d'actions de mode |
| Bouton compact dans une ligne | 28 px | Cible dérivée de l'échelle 4/8 | Actions de ligne révélées au survol |
| Ligne de lien — compacte | 32 px | Cible dérivée (hauteur du contrôle par défaut) ; principe des densités réglables : [Raycast](https://developers.raycast.com/api-reference/user-interface/list.md) | Densité « compacte » |
| Ligne de lien — défaut | 36 px | Cible dérivée (32 px de contenu + 4 px de respiration) | Densité par défaut |
| Ligne de lien — confortable | 44 px | Cible dérivée (28 px de contenu + 2 × 8 px de respiration) | Écran tactile, sélection facile |
| Cible minimale | 24 × 24 px | WCAG 2.5.8, déjà suivie par le produit ([audit interne](../design-options/audit-accessibilite.md)) | À conserver |

Les hauteurs de bouton publiées par Carbon valent pour le composant lui-même ; les hauteurs de ligne sont des cibles dérivées, signalées comme telles.

### 3.4 Rayons

| Décision | Valeur | Source |
|---|---|---|
| Rayon global | **0**, conservé | [Radix Themes](https://www.radix-ui.com/themes/docs/theme/radius) : le rayon est un **facteur de thème** appliqué contextuellement, pas une valeur posée composant par composant ; un facteur unique garantit la cohérence |
| Exception | aucun | Radix applique un facteur unique ; introduire 4 px sur une carte et 0 ailleurs est exactement ce que le modèle évite |
| Rayon de la planche imprimée | 0 | Le papier n'a pas de rayon : l'aperçu ne doit pas en montrer |

Si la direction « Atelier » (§6) était retenue, le seul changement acceptable serait un facteur **2 px** appliqué à *tous* les composants — pas un rayon par type.

### 3.5 Ombres

| Jeton | Valeur | Source | Emploi |
|---|---|---|---|
| `shadow-1` | `0 1px 2px rgba(0,0,0,.08)` | Valeur déjà présente ([style.css:781](../../src/web/style.css#L781)) ; principe de translucidité : [Geist](https://vercel.com/geist/colors) | Onglet actif uniquement |
| `shadow-2` | `0 2px 10px rgb(0 0 0 / 18%)` | Déjà présente ([style.css:940](../../src/web/style.css#L940)) | Ligne en cours de glisser |
| `shadow-3` | réservé, non utilisé | [Radix Themes — Shadows](https://www.radix-ui.com/themes/docs/theme/shadows) : échelle de 6 pas, sémantique (inset, carte, popover, dialogue) | Panneau de détail flottant |
| Interdit | toute ombre opaque, toute ombre sur les panneaux | [Geist](https://vercel.com/geist/colors) (halo gris) | — |

Note : Radix documente la *sémantique* des six pas, mais renvoie les valeurs au code source ; les valeurs ci-dessus sont donc celles du produit, conformées au principe de translucidité.

### 3.6 Durées et courbes

| Jeton | Durée | Courbe | Source | Emploi |
|---|---|---|---|---|
| `motion-hover` | 110 ms | `cubic-bezier(0.2, 0, 0.38, 0.9)` | [Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) (`duration-fast-02`, standard productive) | Survol, focus, appui |
| `motion-reveal` | 150 ms | idem | Carbon (`duration-moderate-01`) | Dépliage de section |
| `motion-toast` | 240 ms | entrée productive | Carbon (`duration-moderate-02`) | Toast |
| `motion-panel` | 400 ms | standard productive | Carbon (`duration-slow-01`) | Panneau de détail |
| `motion-feedback` | 700 ms | expressif | Carbon (`duration-slow-02`, expressif) | Succès d'impression, une seule fois |
| `motion-none` | 0 ms | — | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) | Sous `prefers-reduced-motion: reduce` |

Seuils de latence associés : 0,1 s / 1 s / 10 s ([NN/g](https://www.nngroup.com/articles/website-response-times/)).

### 3.7 Fenêtre et volets

| Paramètre | Valeur | Source |
|---|---|---|
| Largeur minimale du volet gauche | 320 px | Valeur actuelle ([style.css:204](../../src/web/style.css#L204)) |
| Largeur maximale du volet gauche | 560 px | Dérivée du maximum actuel (420 px) élargi pour l'édition en détail |
| Gouttière entre volets | 16 px | Échelle 4/8 |
| Zone de préhension de la poignée | 12 px | Confort de cible (≥ 24 px de haut, cf. WCAG 2.5.8) |
| Volet de détail | 280–320 px | [Raycast](https://developers.raycast.com/api-reference/user-interface/list.md) : le détail est adjacent, pas une colonne permanente |
| Rupture d'empilement | 900 px | Valeur actuelle ([style.css:217](../../src/web/style.css#L217)), à conserver |

---

## §4 — Anti-patterns 2026 : ce qui date une UI d'outil utilitaire

| Anti-pattern | Pourquoi c'est daté | Source |
|---|---|---|
| **Dégradés, métal liquide, verre, shaders en fond** | Les galeries les mettent en avant parce que ce sont des objets de démonstration (« Liquid Metal Hero », « Liquid Glass Button », « Aurora Background », « Shader Animation », « Glass Dashboard » figurent parmi les composants les plus enregistrés) ; dans un outil dense, ils coûtent du contraste et de la lisibilité sans rien expliquer | [21st.dev](https://21st.dev/), [21st.dev — composants](https://21st.dev/community/components) |
| **Ombre opaque ou ombre sur chaque carte** | Une ombre opaque laisse un halo gris ; une carte n'a pas besoin de bordure + ombre + fond teinté pour dire qu'elle est une carte | [Geist — Colors](https://vercel.com/geist/colors) |
| **Double bordure** | Deux bordures alpha superposées font ressortir les intersections ; chaque limite ne se dessine qu'une fois | [Geist — Colors](https://vercel.com/geist/colors) |
| **Trop de bordures en général** | « Use fewer borders » : un trait peut être remplacé par de l'espace, un fond contrasté ou une ombre | [Refactoring UI](https://refactoringui.com/) |
| **Boutons primaires partout** | « Each page should have only one primary button » ; la hiérarchie disparaît dès qu'il y en a deux | [Carbon — Button](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) |
| **Rayons incohérents** (0 ici, 6 px là, pilule ailleurs) | Le rayon est un facteur de thème unique appliqué contextuellement ; la fantaisie par composant se voit immédiatement | [Radix — Radius](https://www.radix-ui.com/themes/docs/theme/radius) |
| **Texte sous le plancher de lisibilité** | 9–10 px pour des libellés, 13 pt étant le défaut macOS et 10 pt le minimum | [HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography.md) ; constat : [style.css:904](../../src/web/style.css#L904) |
| **Gris sur couleur** | Un texte gris posé sur un fond coloré perd son contraste ; il faut baisser la teinte du fond, pas la luminance du texte | [Refactoring UI](https://refactoringui.com/) (chapitre « Don't use grey text on colored backgrounds ») |
| **Notifications à répétition** | Trop de notifications créent la fatigue d'alerte et font baisser la productivité ; chaque notification doit être pertinente, opportune, informative | [Carbon — Notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications) |
| **Mouvement décoratif** | Carbon demande d'éviter les courbes « artificielles, distrayantes ou purement décoratives » et de réserver l'expressif aux moments importants | [Carbon — Motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) |
| **Ignorer `prefers-reduced-motion`** | La préférence système existe pour les troubles vestibulaires ; les animations de mise à l'échelle et de déplacement de grandes surfaces sont les déclencheurs typiques | [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) |
| **Bascule clair/sombre propre à l'app** | Elle force l'utilisateur à régler deux fois la même chose et donne l'impression que l'app ignore le système | [HIG — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md) |
| **Empiler les états vides illustrés** | Carbon recommande un bouton tertiaire quand plusieurs états vides coexistent, et du texte seul quand l'espace est limité | [Carbon — Empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states) |
| **Spinner nu pour une opération longue** | Au-delà d'une seconde, il faut une progression ; au-delà de dix, l'attention se perd | [NN/g](https://www.nngroup.com/articles/website-response-times/) |
| **Page entièrement dense** | Carbon admet des sections denses, mais pas une page entière sans respiration : le regard doit pouvoir se poser | [Carbon — Spacing](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview) |
| **Contenu avancé caché sans indice de progression** | La divulgation progressive exige que le passage au niveau secondaire soit évident et que le libellé annonce ce qu'on va trouver | [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) |
| **Pilules et badges pour tout** | Un badge est une information secondaire ; trois badges par ligne suffisent avant que la ligne ne devienne un sapin | [Beautiful UI — Records Table](https://www.beautifului.dev/) (deux à trois tags par record dans la démo) |

---

## §5 — Ce que le produit fait déjà bien (et que les sources confirment)

| Choix existant | Confirmation externe |
|---|---|
| L'accent est réservé aux **actions** ; compteurs, badges et bordures de survol restent à l'encre neutre ([style.css:17](../../src/web/style.css#L17)) | Carbon demande de garder la couleur du texte neutre et de réserver la couleur primaire aux actions primaires ; Radix réserve le pas 9 (chroma maximal) aux aplats d'action ([Carbon — Typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview), [Radix](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)) |
| Deux thèmes suivant `prefers-color-scheme`, sans bascule applicative ([style.css:64](../../src/web/style.css#L64)) | HIG demande explicitement d'éviter un réglage d'apparence propre à l'application et de respecter le choix système ([HIG — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md)) |
| Pas de fond rouge pâle pour le danger : bordure, icône et libellé sur fond neutre ([style.css:35](../../src/web/style.css#L35)) | Radix réserve les pas 3–5 aux fonds de composants (défaut, survol, actif) et non aux emplois sémantiques ; Carbon fournit un bouton danger sans imposer un aplat ([Radix](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), [Carbon — Button](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines)) |
| Un rayon unique à 0, appliqué partout ([style.css:55](../../src/web/style.css#L55)) | Le rayon comme facteur de thème unique, appliqué contextuellement, est le modèle Radix ([Radix — Radius](https://www.radix-ui.com/themes/docs/theme/radius)) |
| Les cadres de panneau ont été retirés au profit du fond et de l'espacement ([style.css:220](../../src/web/style.css#L220)) | « Use fewer borders » : espace, fond contrasté ou ombre remplacent un trait ([Refactoring UI](https://refactoringui.com/)) ; et une limite ne se dessine qu'une fois ([Geist](https://vercel.com/geist/colors)) |
| État vide en deux phrases, avec les trois voies d'entrée ([index.html:222](../../src/web/index.html#L222)) | L'anatomie Carbon (titre + corps + action) est presque respectée : il manque un titre positif et un bouton ([Carbon — Empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states)) |
| Compteur et toast en `aria-live` ([index.html:28](../../src/web/index.html#L28), [index.html:930](../../src/web/index.html#L930)) | Visibilité de l'état du système : informer vite et clairement ([NN/g — 10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)) |
| Réordonnancement à la poignée **et** boutons ↑↓ ([app.js:1241](../../src/web/app.js#L1241)) | Une liste doit rester opérable sans glisser-déposer ; Raycast modélise les actions de liste et la sélection comme des états de premier rang ([Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md)) |
| Deux volets, rupture à 900 px, `minmax(0,1fr)` assumé ([style.css:204](../../src/web/style.css#L204)) | Mise en page adaptable au redimensionnement ; le détail de l'explication (`1fr` vs `minmax(0,1fr)`) est exactement le genre de décision que HIG demande de traiter ([HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout.md)) |

---

## §6 — Trois directions artistiques pour la refonte

### Direction A — « Console » (direction actuelle, révisée)

**Intention.** Un instrument de mesure, pas un tableau de bord : l'encre, le papier, et un seul signal chaud qui dit « action ». L'interface s'efface devant la planche.

**Palette.** Blanc `#ffffff`, surfaces `#f4f4f4` et `#e8e8e8`, encre `#161616` / `#393939` / `#5c5c5c`, accent orange brûlé `#c2410c`, vert de disponibilité `#1c7c4a`, danger `#b3122b`. Sombre : `#161616` / `#262626` / `#333333`, accent `#fdba74`. Sources : tokens actuels ([style.css:18–62](../../src/web/style.css#L18)), logique d'échelle Radix ([Radix](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)), génération LCH de Linear ([Linear](https://linear.app/blog/how-we-redesigned-the-linear-ui)).

**Typographie.** Système, 5 tailles (11/12/13/14/16), tabulaire pour chiffres et URL, SemiBold réservé aux titres de section. Sources : [Carbon — Typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview), [HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography.md).

**Formes.** Rayon 0 partout, traits 1 px, séparation par fond et espace, une seule ombre. Sources : Carbon (structure, hiérarchie par règles), [Geist](https://vercel.com/geist/colors) (une bordure, ombre translucide), [Refactoring UI](https://refactoringui.com/) (moins de bordures).

**Mouvement.** Productif uniquement (110–240 ms), un seul moment expressif au succès d'impression. Source : [Carbon — Motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview).

**Références externes.** [Linear, partie II](https://linear.app/blog/how-we-redesigned-the-linear-ui) (chrome réduit), [Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview) (échelle, structure), [Geist](https://vercel.com/geist/typography) (densité typographique produit).

**Risque.** À force d'angles vifs, de traits et de densité, l'outil peut glisser vers le formulaire administratif : peu de plaisir, et une fatigue visuelle si les séparations sont partout. La révision doit retirer des traits, pas en ajouter.

### Direction B — « Atelier » (chaleureuse, orientée objet imprimé)

**Intention.** L'étiquette est l'objet ; l'interface est un établi en papier. Le produit doit donner envie de manipuler la planche, pas seulement de la configurer.

**Palette.** Neutres chauds (papier `#faf7f2`, surface `#f2ece4`, ligne `#e2d9cc`), encre chaude `#1c1917`, accent orange brûlé conservé `#c2410c`, vert `#1c7c4a`, danger `#b3122b`. Sombre : nuit d'atelier `#1a1a18` / `#262421` / `#312e29`, accent `#fdba74`. *Couleurs proposées, à mesurer avant adoption.* Sources : échelles chaudes Radix (Amber, Orange, Tomato) et leurs pas ([Radix — Scales](https://www.radix-ui.com/colors/docs/palette-composition/scales)) ; principe des ombres en deux parties ([Refactoring UI](https://refactoringui.com/)).

**Typographie.** Système pour l'interface ; chasse fixe (`ui-monospace`) pour les URL, les millimètres et les numéros de page. Geist documente ce couplage label/mono pour les chiffres ([Geist — Typography](https://vercel.com/geist/typography)).

**Formes.** Facteur de rayon 2 px appliqué à **tous** les composants (jamais par composant, cf. [Radix — Radius](https://www.radix-ui.com/themes/docs/theme/radius)) ; deux ombres translucides ; bordures réservées aux champs. La planche imprimée reste à 0.

**Mouvement.** 150–240 ms, léger déplacement vertical des toasts et des panneaux ; rien sur la planche elle-même (la géométrie ne doit pas bouger).

**Références externes.** [Refactoring UI](https://refactoringui.com/) (profondeur par l'ombre, moins de bordures, hiérarchie par la graisse), [Beautiful UI](https://www.beautifului.dev/) (lignes de tâches et records lisibles), [Radix — Shadows](https://www.radix-ui.com/themes/docs/theme/shadows) (sémantique des ombres).

**Risque.** La dérive décorative : grain de papier, texture bois, ombres portées. Et un fond chaud fausse la lecture des couleurs de la planche — pour un outil d'impression, c'est un défaut fonctionnel, pas un détail esthétique.

### Direction C — « Studio » (sombre par défaut, densité Linear/Raycast)

**Intention.** Un outil de production dense, sombre, rapide au clavier, à la manière d'un IDE : on reste dedans des heures.

**Palette.** `#161616` (base) / `#262626` (élevé) / `#333333` (survol), bordures aux pas 6–7, texte aux pas 11–12, accent orange conservé. Sources : deux élévations sombres ([HIG — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md)), échelle Radix ([Radix](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)), génération LCH ([Linear](https://linear.app/blog/how-we-redesigned-the-linear-ui)).

**Typographie.** 13 px partout, 12 px pour la méta, mono pour les URL ; les libellés de champ en capitales 11 px comme Geist `label-12` ([Geist](https://vercel.com/geist/typography)).

**Formes.** Rayon 4–6 px sur les surfaces et contrôles, 0 sur la planche ; deux ombres translucides ; bordures rares.

**Mouvement.** 110–240 ms ; transition de panneau 400 ms ; un moment expressif à l'impression.

**Références externes.** [Linear, partie II](https://linear.app/blog/how-we-redesigned-the-linear-ui), [Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md) (liste + détail au clavier), [Geist — Colors](https://vercel.com/geist/colors).

**Risque.** Le contresens : un outil dont la sortie est du papier réglé en sombre par défaut envoie un mauvais signal, et double le coût (deux thèmes à tenir, deux jeux de captures). Le risque secondaire est le plus grave : ressembler à n'importe quel tableau de bord SaaS.

### Comparaison et recommandation

| Critère | A — Console | B — Atelier | C — Studio |
|---|---|---|---|
| Densité atteignable | Élevée | Élevée | Très élevée |
| Justesse pour un outil d'impression | Forte (encre/papier) | Très forte (objet papier) | Faible (sombre par défaut) |
| Écart avec le socle existant | Nul | Moyen (surfaces, rayons, chaleur) | Fort (thème, rayons, densité) |
| Coût de mise en œuvre | Faible | Moyen | Élevé |
| Risque de datation | Faible | Moyen (déco chaleureuse à la mode) | Moyen (look SaaS générique) |
| Risque de casser l'aperçu couleur | Nul | Réel (fond chaud) | Nul |

**Recommandation.** **A, révisée**, comme direction principale : elle est déjà le socle, elle est juste pour un outil d'impression, et les sources externes en confirment les choix structurants (Carbon pour l'échelle et le radius 0, Geist pour la bordure unique et l'ombre translucide, Linear pour le chrome). **B** mérite une exploration limitée aux *surfaces* (papier chaud) et aux ombres, sans toucher à la planche ni au facteur de rayon. **C** est écartée pour cette refonte : elle contredit la nature du produit et coûte deux fois plus pour un bénéfice non démontré.

---

## §7 — Limites de collecte

### 7.1 Sources consultées et ce qui a été réellement lu

| URL | Statut | Ce qui a été lu | Limite |
|---|---|---|---|
| [mobbin.com](https://mobbin.com/) | 200 | Accueil marketing, très partiellement (HTML bruité) | La galerie n'est pas accessible |
| [mobbin.com/mcp](https://mobbin.com/mcp) | 200 | Texte marketing complet (600 000 écrans revendiqués, plans Pro et Team) | Chiffres **annoncés par l'éditeur**, non vérifiés |
| [mobbin.com/customers](https://mobbin.com/customers) | 200 | Études de cas (Cursor, OKX, Meng To), citation d'un designer, « 7 500+ équipes » | Aucun écran réel inspecté |
| [mobbin.com/discover](https://mobbin.com/discover) | 200 | Coquille JavaScript | **Galerie derrière connexion** : rien n'a été vu |
| [mobbin.com/collections](https://mobbin.com/collections) | 200 | Coquille JavaScript | Idem |
| [mobbin.com/blog](https://mobbin.com/blog) | 200 | Titre seul | Contenu non rendu |
| [21st.dev](https://21st.dev/) | 200 | Accueil, catégories et compteurs, sélection « Top today » | — |
| [21st.dev — composants](https://21st.dev/community/components) | 200 | Taxonomie complète avec compteurs | La suite du catalogue exige un compte gratuit |
| [21st.dev — catégorie Boutons](https://21st.dev/community/components/s/button) | 200 | Composants listés, variantes nommées | Source des composants réservée aux comptes |
| [21st.dev — catégorie Dashboards](https://21st.dev/community/components/s/dashboard) | 200 | Data Grid Table dense, Empty State, Sidebar | Idem |
| [21st.dev — Button de shadcn](https://21st.dev/@shadcn/components/button) | 200 | Code de démonstration complet (variantes) | La source du composant « comes with a free account » |
| [21st.dev — Data Grid Table dense](https://21st.dev/@sean0205/components/data-grid-table/dense-table) | 200 | Code de démonstration (TanStack : tri, pagination, colonnes) | Idem |
| [21st.dev — chemin erroné](https://21st.dev/community/components/buttons) | **404** | — | Slug inexistant, corrigé par `/s/button` |
| [beautifului.dev](https://www.beautifului.dev/) | 200 | Index des 21 composants + détail de 12 d'entre eux | **Page unique, contenu tronqué** après « Records Table » : les composants 12 à 21 sont nommés mais non inspectés |
| [Linear — A design reset](https://linear.app/now/a-design-reset) | 200 | Article complet (dette de design, conduite d'une refonte) | Article de méthode, peu de valeurs |
| [Linear — partie II](https://linear.app/blog/how-we-redesigned-the-linear-ui) | 200 (redirige vers `/now/`) | Article complet : chrome en L inversé, LCH, trois variables, densités | Aucune valeur numérique publiée |
| [Geist — Introduction](https://vercel.com/geist/introduction) | 200 | Index du système et des composants | — |
| [Geist — Colors](https://vercel.com/geist/colors) | 200 | Règles structurelles (une bordure, ombres translucides, fonds 1 et 2) | Les valeurs hexadécimales ne sont pas textuellement disponibles (« right click to copy ») |
| [Geist — Typography](https://vercel.com/geist/typography) | 200 | Échelle et usages (label-14, label-13, copy-13…) | — |
| [Carbon — Spacing](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview) | 200 | Échelle complète en px et rem | — |
| [Carbon — Typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview) | 200 | Échelle, graisses, couleur du texte | — |
| [Carbon — Motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) | 200 | Courbes, durées, registres productif et expressif | — |
| [Carbon — Button (guidelines)](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) | 200 | Hiérarchie, tailles, appariement aux champs | La page `usage` redirige vers `guidelines` |
| [Carbon — Button (specifications)](https://www.carbondesignsystem.com/building-blocks/core/components/button/specifications) | 200 | Tokens de couleur par variante et par état | Section « Size » tronquée avant les valeurs de hauteur |
| [Carbon — Empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states) | 200 | Anatomie, trois familles, règles d'espace | Corrigé depuis une URL `/overview` qui redirigeait |
| [Carbon — Notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications) | 200 | Statuts, types, règles des toasts et des inline | — |
| [Radix — Scales](https://www.radix-ui.com/colors/docs/palette-composition/scales) | 200 | Échelles claires, sombres et alpha | — |
| [Radix — Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) | 200 | Mappage des 12 pas | — |
| [Radix Themes — Radius](https://www.radix-ui.com/themes/docs/theme/radius) | 200 | Facteur de rayon, échelle de 6 pas | Valeurs en px non publiées |
| [Radix Themes — Shadows](https://www.radix-ui.com/themes/docs/theme/shadows) | 200 | Sémantique des 6 pas | Valeurs renvoyées au code source |
| [Radix Themes — Spacing](https://www.radix-ui.com/themes/docs/theme/spacing) | 200 | Échelle 4→64 px, facteur 90–110 % | — |
| [NN/g — 10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | 200 | Les dix heuristiques | — |
| [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | 200 | Article complet, exemple de la boîte d'impression | — |
| [NN/g — Website Response Times](https://www.nngroup.com/articles/website-response-times/) | 200 | Seuils 0,1 / 1 / 10 s | — |
| [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout.md) | 200 (variante `.md`) | Hiérarchie visuelle, adaptation, guides, macOS | La page HTML est rendue en JavaScript |
| [Apple HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography.md) | 200 (`.md`) | Tailles par plateforme, hiérarchie, Dynamic Type, tracking macOS | Idem |
| [Apple HIG — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode.md) | 200 (`.md`) | Fonds base/élevé, contrastes 4,5:1 et 7:1 | Idem |
| [Apple HIG — Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars.md) | 200 (`.md`) | Repli, hiérarchie, actions à éviter en bas | Idem |
| [Apple HIG — index HTML](https://developer.apple.com/design/human-interface-guidelines/layout) | 200 | Titre seul | **Page rendue en JavaScript** : illisible sans `.md` |
| [Apple — endpoint JSON tenté](https://developer.apple.com/tutorials/data/documentation/design/human-interface-guidelines/layout.json) | **404** | — | Deux variantes testées, toutes deux 404 |
| [Raycast — `List`](https://developers.raycast.com/api-reference/user-interface/list.md) | 200 (`.md`) | API complète : filtrage, accessoires, détail, pagination, état vide | Documentation d'API, pas de valeurs visuelles |
| [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) | 200 | Sémantique, déclencheurs, exemple CSS | — |
| [Refactoring UI](https://refactoringui.com/) | 200 | Page de vente : tactique « fewer borders », table des matières complète | **Livre payant** : seuls les titres de chapitres et la tactique d'exemple sont accessibles |
| [shadcn/ui — index `llms.txt`](https://ui.shadcn.com/llms.txt) | 200 | Index complet des composants et concepts | — |
| [shadcn/ui — Button](https://ui.shadcn.com/docs/components/base/button) | 200 | Coquille de navigation seule | **Contenu non rendu** pour un récupérateur non-JS ; contourné via la copie 21st.dev |
| [shadcn/ui — Empty](https://ui.shadcn.com/docs/components/base/empty) | 200 | Coquille de navigation seule | Idem |
| [Material Design 3 — Easing and duration](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) | 200 | Titre seul | **Page rendue en JavaScript** : aucun jeton lu. Les durées et courbes viennent donc de Carbon |
| [Figma — Behind our redesign (UI3)](https://www.figma.com/blog/behind-our-redesign-ui3/) | 200 | Titre seul | Page rendue en JavaScript |
| [Figma — mauvais slug](https://www.figma.com/blog/introducing-ui3/) | **404** | — | — |

### 7.2 Ce qui n'a pas pu être collecté, et pourquoi

1. **Mobbin** : la bibliothèque d'écrans est derrière une authentification. Aucune capture n'a été ouverte, aucun écran n'est décrit dans ce document. Seules trois pages marketing (`/`, `/mcp`, `/customers`) sont lisibles sans compte, et leurs chiffres sont des déclarations d'éditeur.
2. **21st.dev** : le catalogue au-delà de la première page, les sources des composants et les thèmes demandent un compte gratuit. Les variantes citées viennent des pages de catégorie et des démos publiques.
3. **Beautiful UI** : site d'une seule page ; le contenu est tronqué après « Records Table » dans la récupération, donc les composants 12 à 21 de l'index (Sidebar Nav, Search, Flowchart, Insight Cards, Code Block, Fine-tune Card, Selection Actions, Agent Screen) sont nommés mais n'ont pas été inspectés en détail.
4. **Material 3** : page rendue en JavaScript, aucun jeton de mouvement lu. Les valeurs de mouvement de ce référentiel proviennent donc de Carbon, seule source accessible et chiffrée.
5. **shadcn/ui** : les pages de composants ne rendent que la navigation pour un récupérateur statique ; l'index `llms.txt` a servi de table des matières, et le code de démonstration a été lu via la copie publiée sur 21st.dev.
6. **Figma** : le billet sur la refonte UI3 n'a livré que son titre ; aucun contenu exploité.
7. **Refactoring UI** : le livre est payant ; seuls la table des matières et l'exemple public sont cités. Aucun chapitre n'est paraphrasé comme s'il avait été lu.
8. **Valeurs hexadécimales Geist** : non disponibles textuellement (copie par clic sur pastille). Les règles citées sont structurelles, pas chromatiques.
9. **Apple HIG** : les pages HTML sont inaccessibles sans JavaScript ; les variantes `.md` ont été utilisées, donc les citations Apple reposent sur ces URL `.md` et non sur leur rendu.
10. **Aucun compte, aucune API, aucun identifiant** n'a été utilisé pendant cette collecte.

### 7.3 Ce que ce document n'est pas

- Une revue de code : les recommandations de §2 et §3 sont des cibles, pas des correctifs appliqués.
- Une revue d'accessibilité : le produit possède déjà son propre audit mesuré ([audit-accessibilite.md](../design-options/audit-accessibilite.md)) ; ce référentiel ne le remplace pas et n'a pas remesuré les contrastes.
- Une enquête utilisateur : aucune session, aucun test d'usage, aucune donnée d'usage réelle n'a été consultée.
