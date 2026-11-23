# I8 — Contenu et charge cognitive (cadrage)

**Date** : 23 novembre 2026 · **Branche** : `extension-layout-improvement` · **Milestone GitHub** : #13 · **Base mesurée** : **4,36 / 5** (I7e, commit `cbd3356`).

## 1. Pourquoi cette itération

La série I7 a traité l'**identité** (Plex, wordmark, icônes, mouvement), les **états vides**, les **dépliants** et les **fins de calcul d'impression**. La note est passée de 3,9 à 4,36. Les 0,14 manquants pour la **porte 4,5** (#51) ne sont plus dans les jetons : ils sont dans **ce que l'écran dit et demande**.

Deux constats mesurés, 6 liens, 1440 × 900, groupes repliés :

| Mode | Contrôles visibles | Aides visibles | Signes d'aide |
|---|---|---|---|
| Planche | 24 | 3 | 220 |
| Tableau | 41 | 6 | 512 |
| Niimbot | 38 | 7 | 499 |
| Images | 31 | 3 | 323 |
| Planche, groupes ouverts | 49 | 8 | 688 |

Le comptage mélange deux choses : de vraies aides (`.hint`) et des **légendes d'aperçu** (une page, un format, des cotes). L'inventaire d'I8a les sépare avant de supprimer quoi que ce soit.

Mesure : `.audit/mesures-i8/prose.json` (sonde `sonde-i8.mjs`).

## 2. Périmètre

| Ticket | Objet | Sortie mesurable |
|---|---|---|
| **#62 — I8a** | Prose et aides | ≤ 1 aide visible par mode (hors légendes), 0 aide > 2 phrases, 0 doublon champ/aide |
| **#63 — I8b** | Charge de l'inspecteur | ≤ 20 contrôles visibles par défaut dans chaque mode |
| **#64 — I8c** | État replié et adaptation | état mémorisé, repli par défaut sous 1024 px, 0 régression des 24 contrôles |
| **#65 — I8d** | Re-mesure et porte 4,5 | scorecard datée, décision explicite sur #51, #49 non fermé sans 4,8 |

**Hors périmètre** : nouvelle direction visuelle, nouveaux réglages d'impression, refonte du moteur QR/export, changement de police ou d'icônes.

## 3. Méthode

1. **Inventorier** : chaque aide classée (aide immédiate / légende d'aperçu / pédagogie de fond), chaque champ compté avec sa fréquence d'usage supposée et son défaut.
2. **Décider** : ce qui reste dans l'app (évite une erreur immédiate), ce qui part sur le site/FAQ, ce qui devient une infobulle.
3. **Corriger** un ticket à la fois, dans l'ordre I8a → I8b → I8c (les trois touchent `index.html` : écritures séquentielles, pas parallèles).
4. **Re-mesurer** avec les mêmes sondes, aux mêmes états : 4 modes, 6 et 40 liens, 1440 et 380, clair et sombre.
5. **Archiver** captures + JSON + tag ; ne fermer #51 que si le score mesuré est ≥ 4,5.

## 4. Critères d'acceptation d'I8

- Score mesuré **≥ 4,5 / 5**, sans arrondi vers le haut.
- Aides : ≤ 1 par mode, ≤ 2 phrases, aucune information perdue sans être retrouvable ailleurs.
- Contrôles : ≤ 20 par mode par défaut, aperçu visible dans les 4 modes à 1440 **et** 380.
- Aucune régression : 1 primaire, 0 débordement, contrastes AA, 0 cible < 24 px, tests verts (base : 1 143).
- #51 commentée puis fermée seulement si ≥ 4,5 ; #49 (4,8) reste ouverte.

## 5. Risques et parades

| Risque | Parade |
|---|---|
| Trop supprimer : l'utilisateur ne sait plus quel format choisir | Garder une aide **par mode**, actionnable ; déplacer le reste vers la FAQ du site, avec lien depuis l'app. |
| Défauts « intelligents » qui surprennent | Afficher la valeur déduite et permettre de la reprendre ; jamais de réglage caché qui change la sortie. |
| Repli mémorisé qui cache un réglage fréquent | Repli par défaut seulement sous 1024 px ; au-dessus, ouvert ou état mémorisé explicite. |
| Gagner des points en cachant les défauts | La mesure compte les contrôles **visibles par défaut** ; les critères d'aperçu, de contraste et de cibles restent inchangés. |

## 6. Ordre de travail

1. #62 — inventaire et réécriture des aides (fichiers : `src/web/index.html`, `src/core/locales/en.js`, `src/site` si déplacement).
2. #63 — allègement de l'inspecteur (fichiers : `src/web/index.html`, `style.css`, `app.js`, `element-ids.js`).
3. #64 — persistance et adaptation (fichiers : `src/web/app.js`, `style.css`, tests).
4. #65 — re-mesure, scorecard, GitHub.

Les trois premiers tickets sont **séquentiels** (même fichier HTML) ; les tests et captures sont refaits à chaque étape.
