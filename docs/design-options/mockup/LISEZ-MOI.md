# Maquette « Console révisée » — à valider

Ce dossier contient la maquette de validation de la refonte, **avant toute
implémentation**. Rien de ce qui est dessiné ici n'est branché sur `src/` :
c'est une proposition à valider, pas une livraison.

## Ouvrir

- `console-revisee.html` s'ouvre dans un navigateur (fichier autonome, aucune
  dépendance, aucune donnée).
- Les images sont les rendus exacts des deux écrans à 1440 × 900 (×2) :
  `ecran-1.png`, `ecran-2.png`, plus les spécimens d'états (`etats.png`) et les
  fondations (`fondations.png`).

## Ce que montre la maquette

| Élément | Intention |
|---|---|
| Écran 1 — mode Planche | Trois zones : collection (340 px), feuille sur bureau (flexible), inspecteur (304 px). La feuille est visible en permanence, à l'échelle, avec ses repères de coupe et son format écrit dessous. |
| Écran 2 — mode Niimbot | Même châssis, autre surface : une étiquette cotée (22 × 12 mm), l'imprimante comme **état** en tête d'inspecteur, et un contenu d'étiquette réduit à quatre cases. |
| Spécimens | Collection vide, sélection active, série en cours : les trois états qui doivent devenir évidents. |
| Fondations | Rôles de couleur, échelle typographique, échelle d'espacement, contrôles 28/32/36, rayon 0, une seule ombre. |

## Ce qui n'est **pas** dans la maquette (volontairement)

Mode sombre, états de focus détaillés, fenêtre 380 px, panneau d'import,
onboarding, mouvement, mode Tableau et mode Images au-delà de l'onglet. Ces
sujets viennent en I2 (système, thèmes, focus), I3 (import) et I4 (canvas), et
seront maquettés au moment de leur palier.

## Les six décisions à valider (recommandation entre parenthèses)

Elles se tranchent dans le ticket GitHub **#12** (`[Cadrage] Valider la maquette des deux écrans`).

1. **La feuille au centre, l'inspecteur à droite** — et non deux colonnes de
   formulaires. (Recommandé : oui, c'est le point focal du produit.)
2. **Un seul bouton primaire, en bas de l'inspecteur** — « Imprimer », à côté de
   ce qu'il imprime. (Recommandé : oui, Carbon impose un primaire par page.)
3. **La collection en volet fixe de 340 px** — redimensionnable plus tard, pas
   en I1. (Recommandé : fixe en I1, poignée en I3 si le besoin se confirme.)
4. **La matérialité du bureau** — fond chaud `#eae6df`, ombre unique, repères de
   coupe, cotation en millimètres. (Recommandé : oui, c'est ce qui distingue un
   instrument d'impression d'un tableau de bord.)
5. **Les actions de ligne au survol et au focus seulement**, pas visibles au
   repos. (Recommandé : oui, avec le spécimen « sélection » comme état de repli.)
6. **Le bloc RÉSUMÉ dans l'inspecteur** — feuille, places, pages. (Recommandé :
   oui, il évite d'aller chercher l'information dans le canvas.)

## Après validation

Le palier **I0 (correctifs)** ne dépend pas de ces décisions et peut être livré
avant. **I1 (structure)** implémente ces deux écrans avec les jetons réels du
produit, puis rejoue la matrice de captures et le barème
(`../barre-qualite-ui.md`) pour vérifier la note cible : **3,1 / 5**.
