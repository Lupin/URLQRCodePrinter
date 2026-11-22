# Atteindre plus de 4,5 / 5 — ce que ça exige vraiment

**Statut** : plan de sortie, à appliquer après validation de la maquette. **Note de départ** : 2,3 / 5 (232 points sur 500). **Cible** : ≥ 4,5, puis 4,8.

Ce document ne répète pas l'audit : il dit **quelle distribution de notes est nécessaire**, **ce que chaque dimension doit contenir pour valoir 4,5**, **dans quel ordre**, et **les pièges qui empêchent d'y arriver**.

---

## 1. Le calcul : 4,5 n'est pas « tout un peu mieux », c'est « plus rien sous 4,3 »

La note est une moyenne pondérée : `Σ (poids × note) / 100`. Pour 4,5, il faut **450 points sur 500**. La distribution visée, avec les poids réels :

| # | Dimension | Poids | Actuel | Cible | Points |
|---|---|---:|---:|---:|---:|
| 1 | Clarté & hiérarchie | 12 | 2,2 | **4,7** | 56,4 |
| 2 | Architecture & navigation | 12 | 2,3 | **4,6** | 55,2 |
| 3 | Densité, espacement, rythme | 10 | 1,9 | **4,6** | 46,0 |
| 4 | Système de composants | 8 | 2,6 | **4,6** | 36,8 |
| 5 | États & feedback | 10 | 2,5 | **4,6** | 46,0 |
| 6 | Accessibilité | 10 | 2,7 | **4,8** | 48,0 |
| 7 | Affordance & interactions | 8 | 2,5 | **4,6** | 36,8 |
| 8 | Marque & art direction | 10 | 1,9 | **4,5** | 45,0 |
| 9 | Charge cognitive & flux | 10 | 2,2 | **4,6** | 46,0 |
| 10 | Responsive & adaptation | 4 | 2,5 | **4,5** | 18,0 |
| 11 | Microcopy & ton | 4 | 2,6 | **4,6** | 18,4 |
| 12 | Finition & craft | 2 | 2,4 | **4,6** | 9,2 |
| | **Total** | **100** | **2,32** | | **461,8 → 4,62** |

Conséquence arithmétique : **une seule dimension laissée à 3,5 coûte plus que trois dimensions gagnées**. Exemple : laisser la marque à 3,5 (10 points de poids) fait perdre 10 points, soit 0,1 de note — il faut alors +0,5 sur trois autres dimensions pour compenser. C'est pour cela que le plan est **systémique** : il n'y a pas de « petit » chantier à 4,5.

Le plancher à respecter : **aucune dimension sous 4,3**, et les cinq grosses (1, 2, 3, 8, 9 — 54 points de poids) au-dessus de **4,5**.

---

## 2. Quand 4,5 est franchi (et pourquoi on ne peut pas sauter d'étape)

Le cumul des paliers, avec les cibles déjà fixées :

| Palier | Note | Points | Ce qui vient d'être gagné |
|---|---:|---:|---|
| Départ | 2,32 | 232 | — |
| I0 Correctifs | 2,5 | 250 | on ne perd plus de données, les impasses disparaissent |
| I1 Structure | 3,1 | 310 | l'aperçu permanent, un seul primaire, moins de contrôles |
| I2 Système | 3,7 | 370 | échelles, variantes, états lisibles |
| I3 Liste & flux | 4,1 | 410 | la liste devient un outil, le flux se tient |
| I4 Canvas & sortie | 4,45 | 445 | la sortie devient le produit |
| **I5 Marque & site** | **4,65** | **465** | **la direction tient partout, le site montre le produit** |
| I6 Polissage | 4,8 | 480 | les détails qu'on ne voit qu'en comparant |

**Le franchissement de 4,5 se joue à I5.** À la fin de I4, on est à 4,45 : le demi-point qui manque ne vient ni du moteur d'impression ni d'un nouveau réglage, il vient de la **marque** (dimension 8) et du **site** (surface actuellement à 2,1). C'est le piège classique : on s'arrête à 4,45 en croyant que « la marque, c'est cosmétique ». Ici, la marque pèse 10 points et le site est la preuve publique du produit.

---

## 3. Ce que « 4,5 » veut dire, dimension par dimension

Une note ne se décrète pas : elle se vérifie. Voici ce qui doit être **vrai et mesuré** pour chaque dimension.

| Dimension | À 4,5, cela veut dire (critères vérifiables) |
|---|---|
| 1. Clarté | Un point focal par écran ; **un seul primaire visible** ; aperçu visible sans défiler (0 px) ; **< 40 contrôles** par écran ; test des 3 secondes : la prochaine action se nomme sans lire. |
| 2. Architecture | Trois zones nommées ; **0 commande hors de son contexte** ; **0 information dupliquée** ; le parcours collecter → mettre en page → imprimer se lit sans tutoriel. |
| 3. Densité | **0 valeur hors échelle** ; ≤ 6 tailles de texte ; rythme 4/8/12/16/24/32 ; chiffres tabulaires pour nombres, mm, compteurs. |
| 4. Composants | **Une seule table de variantes** ; trois hauteurs de contrôle ; **0 composant natif non habillé** ; 0 classe ad hoc dans le HTML. |
| 5. États | **Chaque état × 2 thèmes × 4 modes** ; 3 états vides avec action ; progression pour toute opération > 1 s ; **annulation pour tout geste destructeur**. |
| 6. Accessibilité | **0 échec WCAG 2.2 AA mesuré** ; cibles ≥ 24 × 24 ; focus ≥ 3:1 ; 5 parcours complets au lecteur d'écran ; 200 % de zoom ; contraste forcé ; mouvement réduit. |
| 7. Affordance | 0 destructif adjacent à une action banale ; 0 valeur cachée (curseur sans nombre, etc.) ; **0 action au survol seule** (le focus fait la même chose) ; raccourcis affichés. |
| 8. Marque | Direction tenue **sans exception** : 1 ombre, 0 rayon orphelin, 1 jeu d'icônes, 1 matière (papier), 1 profil de mouvement ; **le moment de l'impression est dessiné** ; le site montre ≥ 3 visuels réels. |
| 9. Charge cognitive | < 40 contrôles ; **0 texte d'aide au milieu d'un formulaire** ; 3 étapes maximum pour un premier lien imprimé ; les réglages avancés restent fermés dans 80 % des usages. |
| 10. Responsive | 0 débordement de 380 à 1440 ; l'aperçu reste atteignable en **un geste** à chaque largeur ; fenêtre sans double défilement ; rendu papier intact. |
| 11. Microcopy | 0 libellé ambigu ou répété ; **0 message sans action** ; une aide = une phrase ; parité FR/EN. |
| 12. Finition | Mouvement tokenisé ; 1 ombre ; 0 rayon orphelin ; focus cohérent partout ; **0 décalage de mise en page** à l'ouverture d'un panneau. |

---

## 4. Les trois régimes de progression

Ce ne sont pas les mêmes gestes selon la note.

**2,3 → 3,1 — la structure (I0, I1).** Gestes uniques et visibles : déplacer l'aperçu au centre, supprimer un primaire, regrouper les réglages, réparer ce qui est cassé. C'est le saut le moins coûteux en effort par point gagné, et le plus visible.

**3,1 → 4,1 — le système (I2, I3).** Gestes de fond : échelles, variantes, états, liste, détail, recherche, import. Le gain par geste baisse, la cohérence monte. C'est ici qu'on gagne le droit de dire « c'est un outil ».

**4,1 → 4,5+ — l'étendue et la marque (I4, I5, I6).** Plus aucun geste unique ne rapporte beaucoup : il faut couvrir **tous les états, toutes les largeurs, les deux thèmes, le clavier, le lecteur d'écran, les deux langues**, et tenir la direction artistique sur les quatre surfaces. C'est le régime des **interdits d'exception** : un seul écran hors système fait plafonner une dimension.

---

## 5. Les sept conditions non négociables

1. **Soustraire avant d'ajouter.** 28 blocs d'aide, 85 contrôles, deux primaires, trois ombres : la note monte en enlevant. Toute demande de nouveau réglage passe après une suppression équivalente.
2. **Aucune exception.** Un panneau qui garde ses anciennes valeurs (`12px` hors échelle, ombre, rayon) suffit à bloquer la dimension 4 ou 12 à 4,2. La phrase « juste cette fois » est l'ennemi du 4,5.
3. **Un écran n'est pas fini sans ses états.** Vide, chargement, erreur, désactivé, survol, focus, sélection, succès : tant qu'ils ne sont pas dessinés, l'écran n'est pas livré.
4. **Les deux thèmes en même temps.** Jamais « le sombre après ». Chaque composant se valide en clair et en sombre, avec les contrastes mesurés sur le rendu.
5. **Clavier et lecteur d'écran dès I1**, pas en I6. Un motif ARIA corrigé après coup oblige à repasser sur tous les écrans.
6. **Mesurer aux mêmes états, à chaque palier, par script.** Sans cela, la note devient une opinion et l'auto-satisfaction gagne.
7. **La marque sur toutes les surfaces.** Application, fenêtre, site, confidentialité. La dimension 8 est plafonnée par la surface la plus faible : un site à 2,1 maintient la marque sous 4,3.

---

## 6. Instrumenter le barème (sinon la note reste une opinion)

Un audit qui se juge à l'œil ne tient pas six paliers. Le barème doit être **calculé**, pas discuté. Mesures automatiques proposées (un script, exécuté à chaque palier) :

| # | Critère mesuré | Seuil 4,5 |
|---|---|---|
| 1 | Aperçu visible sans défilement (4 modes) | oui, 0 px |
| 2 | Contrôles visibles par écran | < 40 |
| 3 | Boutons primaires simultanés | 1 |
| 4 | Cibles < 24 × 24 | 0 |
| 5 | Contrastes texte / composant / focus / actif | 4,5:1 · 3:1 · 3:1 · 3:1 |
| 6 | Valeurs de gap/padding hors échelle | 0 |
| 7 | Tailles de texte distinctes | ≤ 6 |
| 8 | Débordement horizontal, 380 → 1440 | 0 |
| 9 | Double défilement (fenêtre) | 0 |
| 10 | États vides sans action | 0 |
| 11 | Gestes destructeurs sans confirmation ni annulation | 0 |
| 12 | Actions visibles uniquement au survol | 0 |
| 13 | Jetons `var()` non définis | 0 |
| 14 | `prefers-reduced-motion` absent d'une surface | 0 |
| 15 | Présence d'une progression pour chaque opération > 1 s | 100 % |
| 16 | Parité FR/EN des libellés | 100 % |
| 17 | Occurrences hors système (ombre, rayon, variante ad hoc) | 0 |
| 18 | Score du barème | ≥ 4,5 |

Ce qui reste jugé à l'œil — et doit être argumenté en une phrase : **le point focal, la tenue de la direction, le ton, l'impression d'ensemble**. Trois dimensions sur douze, pas plus.

---

## 7. Les cinq pièges qui empêchent d'atteindre 4,5

1. **Confondre « plus propre » et « plus clair ».** Refaire les couleurs sans déplacer l'aperçu laisse la dimension 1 à 3,0.
2. **Empiler des réglages « utiles ».** Chaque réglage ajouté coûte sur les dimensions 1 et 9 ; à 4,5, un réglage doit remplacer un autre.
3. **Traiter le mode sombre et le clavier en fin de parcours.** Ils obligent à rouvrir tous les écrans ; les faire au fil de l'eau coûte deux fois moins.
4. **Copier la surface des références.** Mobbin, 21st.dev et Beautiful UI donnent des composants, pas une direction. Le référentiel du dépôt le dit : ce qui se copie, c'est la structure et la discipline, jamais le décor.
5. **S'arrêter à 4,45.** C'est le piège du plan : la marque et le site sont les deux derniers points, et ce sont ceux qu'on saute. Le site est aussi la preuve publique du produit.

---

## 8. Les soustractions à faire en priorité

| Aujourd'hui | Cible | Gain principal |
|---|---|---|
| 2 boutons primaires | 1 par vue | 1, 4, 7 |
| 28 blocs d'aide | ≤ 8, une phrase chacun | 2, 9, 11 |
| 85 contrôles de formulaire | ≤ 40 visibles | 1, 9 |
| 11 valeurs de `gap`, 27 de `padding`, 11 tailles d'écran | 6/6/6 | 3, 12 |
| 3 ombres, 1 rayon orphelin | 1 ombre, 0 rayon | 8, 12 |
| 4 traitements de bouton + un survol orange | 4 variantes nommées, 0 survol orange | 4, 7, 8 |
| 2 explications du même choix (mode, service) | 0 doublon | 2, 11 |
| Exports en pied de fenêtre, « Vider » nu | menu « Exporter », vidage confirmé | 7, 8 |

---

## 9. Définition de « terminé » pour le palier qui franchit 4,5

Le palier I5 ne se ferme que si, **en même temps** :

- le barème instrumenté renvoie **≥ 4,5** (≥ 450 points) ;
- **aucune dimension n'est sous 4,3**, et les cinq grosses sont ≥ 4,5 ;
- les 18 critères mesurés sont au seuil ;
- la revue à l'œil tient sur les **quatre surfaces** (application, fenêtre, site, confidentialité), dans les **deux thèmes**, à **380, 768, 1024 et 1440 px**, avec le rendu papier vérifié ;
- un parcours complet (collecter → mettre en page → imprimer → retrouver) se fait **au clavier seul**, et au lecteur d'écran sans perte d'information ;
- les captures avant/après sont archivées aux mêmes états et le tag de palier est posé.

Tant qu'un seul de ces points manque, on ne passe pas à I6 : on corrige. C'est la règle anti-complaisance du barème, appliquée au palier le plus tentant à déclarer fini.
