# Barre de qualité UI — l'outil de mesure de la refonte

**But** : transformer « c'est mieux » en une note reproductible sur 5, itération après itération, jusqu'à **4,8**. Le barème ne juge pas le goût : il juge ce qui se mesure, et laisse au jugement ce qui ne se mesure pas — en le bornant par des critères explicites.

**Version auditée** : 0.4.0, branche `extension-layout-improvement` — **2,3 / 5** (détail dans [audit-ui-ux-2026-11-22.md](audit-ui-ux-2026-11-22.md)).

---

## 1. Les douze dimensions

Chaque dimension est notée sur 5, multipliée par son poids. Le total est divisé par 100.

| # | Dimension | Poids | Ce qu'elle mesure | Cible à 4,8 |
|---|---|---|---|---|
| 1 | Clarté & hiérarchie visuelle | 12 | Un point focal identifiable par écran, une seule action primaire, ce qui compte est visible sans défiler. | 1 point focal ; 1 primaire ; aperçu visible à 1440 × 900. |
| 2 | Architecture de l'information & navigation | 12 | Les objets (collection, sortie, réglages) sont groupés par tâche, et les commandes sont près de ce qu'elles gouvernent. | 3 zones nommées ; 0 commande hors de son contexte ; 0 duplication explicative. |
| 3 | Densité, espacement & rythme | 10 | Échelles uniques d'espacement et de typo, densité régulière, pas de valeurs orphelines. | 0 valeur de gap/padding hors échelle ; ≤ 6 tailles de texte. |
| 4 | Système de composants & cohérence | 8 | Variantes nommées et finies : boutons, champs, onglets, listes, badges. | 1 table de variantes ; 3 hauteurs de contrôle ; 0 composant natif non habillé. |
| 5 | États & feedback | 10 | Vide, chargement, erreur, succès, désactivé, survol, focus — pour chaque surface. | 3 états vides avec action ; progression > 1 s ; désactivé ≥ 4,5:1 dans les 2 thèmes. |
| 6 | Accessibilité & inclusivité | 10 | WCAG 2.2 AA mesuré sur le rendu, pas sur les jetons. | 0 échec AA ; cibles ≥ 24 × 24 ; texte ≥ 11 px ; reduced-motion respecté. |
| 7 | Affordance & interactions | 8 | Ce qui est cliquable se voit, ce qui est dangereux ne côtoie pas ce qui est banal, rien ne dépend du survol seul. | 0 action destructive adjacente à une action banale ; 0 commande à valeur cachée. |
| 8 | Expression de marque & art direction | 10 | Une direction tenue, une matière, un objet visuel, une voix. | Direction tenue sur 100 % des surfaces ; ≥ 1 visuel produit sur le site ; 0 exception de style. |
| 9 | Charge cognitive & efficacité du flux | 10 | Nombre de décisions par écran, distance au résultat, coût du parcours principal. | < 40 contrôles visibles ; 0 px de défilement pour voir l'aperçu ; 0 texte d'aide au milieu d'un formulaire. |
| 10 | Responsive & adaptation | 4 | La relation entre contenu et résultat survit au redimensionnement. | 0 débordement de 380 à 1440 px ; aperçu visible ou atteignable en 1 geste à 1024. |
| 11 | Microcopy & ton | 4 | Chaque libellé dit ce qu'il fait ; aucune phrase ne répète une valeur ; les erreurs disent quoi faire. | 0 libellé ambigu ; 0 message sans action ; ≤ 1 phrase par aide. |
| 12 | Finition & craft | 2 | Détails cohérents : ombres, rayons, mouvement, focus, densité des glyphes. | 1 seule ombre ; 0 rayon orphelin ; mouvement tokenisé. |

**Pourquoi ces poids** : 46 points sur 100 portent sur la structure et la lecture (1, 2, 9) ; 30 sur l'état et le système (3, 4, 5) ; 20 sur l'accessibilité et la marque ; 4 sur l'adaptation et le texte. Le décor ne pèse presque rien — c'est volontaire : il se corrige en dernier et ne sauve jamais une structure.

---

## 2. Ce qui est mesurable par script, et ce qui ne l'est pas

Le barème se remplit en deux passes. La première est automatisable ; la seconde demande un œil, mais avec des critères écrits.

### Passe A — mesurable (à script, aucune interprétation)

| Mesure | Seuil | Comment |
|---|---|---|
| Aperçu visible sans défilement, 1440 × 900, 4 modes | requis | `#preview` `getBoundingClientRect().top < innerHeight` |
| Défilement pour voir l'aperçu | 0 px | `preview.top - innerHeight` |
| Nombre de contrôles visibles par écran | < 40 | `button, input, select, textarea` visibles |
| Boutons primaires visibles simultanément | 1 | `classList.contains('btn--primary')` |
| Cibles interactives sous 24 × 24 | 0 | `getBoundingClientRect()` |
| Contrastes texte et composants | AA (4,5:1 / 3:1), viser 7:1 | luminance relative sRGB sur le fond **peint** |
| Onglet actif distinguable | ≥ 3:1 sur son fond | idem |
| Valeurs de gap/padding hors échelle | 0 | grep sur la feuille + `getComputedStyle` |
| Tailles de police distinctes | ≤ 6 | idem |
| Débordement horizontal | 0 de 380 à 1440 px | `scrollWidth - clientWidth` |
| `prefers-reduced-motion` | présent sur chaque surface | grep + émulation |
| États vides avec action | 3/3 | présence d'un bouton par état vide |
| Opération > 1 s avec progression | 1/1 | présence d'une barre ou d'un compte |

### Passe B — jugée (œil + critères écrits)

Quatre questions, dans cet ordre, et une note argumentée en une phrase :

1. **Où va mon œil en premier ?** Un seul point focal doit l'emporter. Si l'œil hésite entre deux blocs, ≤ 3.
2. **Où suis-je ?** Le mode, la collection et l'état doivent être lisibles sans lire. Si l'onglet actif ou le contexte demande un effort, ≤ 3.
3. **Qu'est-ce que je fais ensuite ?** L'action suivante doit être la plus forte. Si l'utilisateur doit chercher, ≤ 3.
4. **Est-ce que ça ressemble au produit ?** La matière, la voix, l'objet imprimé doivent être présents. Si l'écran pourrait appartenir à n'importe quel tableau de bord, ≤ 3.

---

## 3. Protocole d'itération

1. **Capturer** : rejouer la même matrice (21 états : 4 modes, 4 largeurs, clair/sombre, vide/1/60 liens, rangement, suppression, fenêtre ×3, site ×3, confidentialité). Même script, pour que la comparaison soit honnête.
2. **Mesurer** : relancer la passe A ; consigner les écarts avec la version précédente.
3. **Juger** : passe B, en une phrase par question, avant de regarder la note précédente — sinon on confirme.
4. **Noter** : remplir le tableau des 12 dimensions. Une note ne descend que si un fait la justifie ; elle ne monte que si le critère est vérifié sur le rendu.
5. **Décider** : si la note cible de l'itération est atteinte, on passe ; sinon, on corrige les dimensions les plus basses avant d'avancer.
6. **Archiver** : captures et `mesures.json` datés, tag git du palier. Le retour arrière doit toujours être un `git reset --hard <tag>`.

---

## 4. Grille de notes attendue

| Palier | Note | Ce que ça veut dire |
|---|---|---|
| Actuel | 2,3 | Fonctionnel, fabriqué, non dessiné. On s'en sert parce qu'on en a besoin. |
| I0 | 2,5 | Les défauts qui coûtent une erreur sont réparés ; le dessin n'a pas bougé. |
| I1 | 3,1 | La structure tient : on voit ce qu'on fait. |
| I2 | 3,7 | Le système tient : rien ne jure, on apprend une fois. |
| I3 | 4,1 | La liste est un outil : on va vite. |
| I4 | 4,45 | La sortie est le produit : on comprend en regardant. |
| I5 | 4,65 | Le produit a une voix et une matière. |
| I6 | **4,8** | On ne remarque plus l'interface. |

**Rappel de lecture** : 4,8 n'est pas « parfait ». C'est « aucun défaut qu'un utilisateur remarquera sans y être invité ». Le dernier demi-point se gagne sur des détails qu'on ne voit qu'en comparant — c'est pour cela que l'itération 6 existe, et qu'elle ne peut pas être fusionnée avec les autres.

---

## 5. Règle anti-complaisance

Trois garde-fous, appris du produit lui-même (l'audit WCAG annonçait 28 × 28 px pour une cible mesurée à 21 × 19 px) :

1. **Toute note > 4 doit être justifiée par une mesure du rendu**, jamais par une intention de code. Une règle CSS présente n'est pas un défaut corrigé.
2. **Toute dimension en hausse doit avoir sa capture** dans le dossier de l'itération, au même état que la capture de référence.
3. **À chaque itération, chercher un défaut, pas une confirmation.** Le rôle de l'audit sévère est de tenir ce rôle, même quand tout va mieux.

---

## 6. Pourquoi une note basse n'est pas un jugement sur le travail

La question revient à chaque audit : le produit est soigné, testé, documenté — comment peut-il valoir 2,3 ? La réponse tient en une phrase : **le barème ne note pas l'effort, il note ce que la personne devant l'écran obtient.** Un moteur d'impression excellent qui reste invisible ne rend service qu'à moitié.

### Où les points se perdent (version 0.4.0)

| Groupe | Dimensions | Poids | Obtenu | Note du groupe |
|---|---|---|---|---|
| Lire et comprendre | clarté (12), architecture (12), densité (10), marque (10), charge cognitive (10) | **54** | 114 / 270 | **2,1** |
| Système et états | composants (8), états (10), affordance (8), finition (2) | 28 | 70,6 / 140 | 2,5 |
| Accessibilité et adaptation | accessibilité (10), responsive (4) | 14 | 37 / 70 | 2,6 |
| Ton et texte | microcopy (4) | 4 | 10,4 / 20 | 2,6 |

**54 points sur 100** portent sur la lecture de l'écran — et c'est là que se concentre la perte : 156 des 268 points manquants. Le socle d'ingénierie, lui, n'apparaît que dans l'accessibilité et la finition (14 points au total). C'est volontaire : un audit qui récompenserait le travail réalisé masquerait exactement le problème à corriger (l'aperçu hors écran, la hiérarchie absente), et la refonte ne partirait pas.

### Ce que la note ne dit pas

- Elle ne dit pas que le produit est cassé : il fonctionne, il est testé (1 088 tests), il est accessible au-delà de la moyenne, et sa fenêtre vaut **3,1 / 5** à elle seule.
- Elle ne dit pas que le travail est vain : elle dit que **la couche qui donne envie et qui évite l'effort n'a jamais été dessinée**.
- Elle n'est pas absolue : l'audit source de l'application, avec d'autres poids, conclut 2,6 ; un barème qui pèserait l'ingénierie donnerait ~3,5. Ce barème-ci est celui de la cible 4,8, donc il est sévère par construction.

### Les ancrages

| Note | Ce que ça veut dire |
|---|---|
| 2,0 | Utilisable, mais rebutant : on s'en sert par obligation. |
| 2,3 | **Ici.** Tout fonctionne ; le résultat n'est pas visible, et l'écran demande un effort constant. |
| 3,0 | Outil correct d'ingénieur : on comprend où l'on est, on voit ce qu'on fait. |
| 4,0 | Outil qu'on montre : la structure et le système tiennent, la marque commence. |
| 4,8 | On ne remarque plus l'interface tant elle fait ce qu'on attend. |

### Ce que deux paliers suffisent à changer

- **I0 (correctifs)** : les défauts qui coûtent une erreur disparaissent → 2,5. La note ne bouge presque pas, parce que le dessin n'a pas bougé. C'est normal : I0 protège, il ne séduit pas.
- **I1 (structure)** : l'aperçu visible, un seul primaire, moins de contrôles, des états vides qui agissent → **3,1**. C'est le premier saut ressenti, et il ne touche ni la couleur ni la typographie.
