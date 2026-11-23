# I7 — Identité : cadrage à valider

**Date** : 23 novembre 2026 · **Statut** : proposition, rien n'est implémenté.
**Note mesurée au départ** : 3,9 / 5. **Cible de la porte I7** : ≥ 4,3 (porte #51 : 4,5).

## Pourquoi un palier d'identité

Les paliers I0–I6 ont corrigé la **structure** (châssis, liste, détail, sortie), la **cohérence** (échelles, jetons, deux thèmes) et la **mesure** (contrastes, cibles, états). La note s'est arrêtée à 3,9 parce que ce qui reste n'est pas un défaut : c'est une **absence d'identité**. Aujourd'hui, l'interface pourrait être celle de n'importe quel outil de formulaires :

- une police système par défaut, sans voix ;
- des glyphes Unicode hétérogènes (`✎ × ▲ ▼ ⠿ ◀ ▶`) à la place d'icônes ;
- deux durées de mouvement en dur, sans échelle ;
- des états vides en texte seul ;
- une densité juste, mais sans rythme typographique propre.

I7 ne touche ni les flux, ni la structure, ni les fonctions. Il donne une **matière** et une **voix**.

## Décision 1 — Typographie (à valider)

Trois options, rendues dans la maquette :

| | Option A — Plex (recommandée) | Option B — Inter + mono | Option C — Système + mono |
|---|---|---|---|
| UI | IBM Plex Sans 400/500/600 | Inter 400/500/600 | système (`-apple-system`…) |
| Données (URL, rangs, cotes, statut) | **IBM Plex Mono** 400/500 | IBM Plex Mono (ou SF Mono) | SF Mono / Menlo |
| Voix | technique, papier, IBM/console | neutre, très lisible | celle de l'OS, aucune |
| Licence | OFL (libre, embarquable) | OFL (Inter) + OFL (Plex Mono) | — |
| Poids | 3 à 4 fichiers woff2, **~120–180 Ko** au total | 2 à 3 fichiers | 0 |
| Risque | FOUT (fallback système le temps du chargement) | Inter très répandu, identité faible | identité nulle |

**Recommandation : A.** Plex donne une voix technique et papier qui va avec la direction « Console » ; le mono relie naturellement les URL, les cotes et les numéros. Le sous-ensemble latin + latin-ext suffit (français/anglais).

**Règles typographiques proposées**

- Échelle : **11 / 12 / 13 / 15 / 20 px** (au lieu de 11/12/13/14/20). L'écart 13→15 crée une hiérarchie lisible ; 14 disparaît, trop proche de 13.
- Interlignes : 1,35 pour le corps, 1,2 pour les titres.
- Graisses : 400 (texte), 500 (données, libellés), 600 (titres, primaire). Jamais en dessous de 12 px en 400.
- Chiffres tabulaires pour tout ce qui s'aligne (rangs, compteurs, mm).
- **Mono** pour : URL, rangs, compteurs, cotes (mm), statut de langue, version.
- Wordmark : marque existante + « URLQRCodePrinter » en Plex Sans 600, interlettrage −0,01 em.

## Décision 2 — Icônes (à valider)

Remplacer tous les glyphes Unicode par **un jeu SVG maison**, 20 × 20, trait 1,5 px, bouts carrés, sans remplissage (sauf points de la poignée) :

`lien · ajouter · éditer · supprimer · poignée · haut · bas · chevron gauche/droite · exporter · importer · imprimer · recherche · réglages · zoom −/+ · ajuster`

- 16 px dans les lignes, 20 px dans les barres, zone cliquable inchangée (≥ 24 px).
- Une seule couleur (`currentColor`), donc les deux thèmes suivent.
- Pas d'emoji, pas de glyphe dépendant de la police système.

## Décision 3 — Mouvement

| Jeton | Valeur | Usage |
|---|---|---|
| `--motion-fast` | 90 ms | survol, focus, press |
| `--motion` | 140 ms | panneaux, toasts, onglets |
| `--motion-slow` | 220 ms | changement de mode, volet de détail |
| courbe | `cubic-bezier(0.2, 0.7, 0.2, 1)` | toutes les transitions |

- Aucune animation d'entrée de liste (le contenu ne danse pas).
- `prefers-reduced-motion` : durées à 0, aucune exception.

## Décision 4 — États vides illustrés

Trois dessins au trait, monochromes, cohérents avec les icônes :

1. **Collection vide** : feuille + QR fantôme → « Ajouter un lien » / « Importer une archive ».
2. **Recherche sans résultat** : loupe sur feuille → « Effacer la recherche ».
3. **Import en échec** : boîte + flèche → « Réessayer » / « Choisir un autre fichier ».

Le dessin ne remplace pas l'action : il l'accompagne.

## Ce que I7 ne fait pas

- Pas de nouvelle structure ni de nouveau flux (validés en I1–I4).
- Pas de nouvelle fonctionnalité.
- Pas de thème clair/sombre supplémentaire.
- Pas de refonte du site public au-delà de la typographie et du wordmark.

## Découpage proposé

| Ticket | Contenu | Preuve attendue |
|---|---|---|
| **I7a** Typographie et wordmark | polices embarquées, échelle 11/12/13/15/20, mono données, preload/fallback, wordmark | captures avant/après, poids des fichiers, test « aucune requête distante » |
| **I7b** Icônes et mouvement | jeu SVG complet, remplacement des glyphes, jetons de mouvement, réduction | captures des 4 modes, test « 0 glyphe Unicode d'action », test jetons |
| **I7c** États vides et densité | trois illustrations, actions, rythme de densité (espaces 4/8/12/16/24) | captures des 3 états, mesures d'espacement |
| **I7d** Re-mesure | barème instrumenté, contrastes, cibles, poids, note | scorecard datée, note ≥ 4,3 ; sinon on ne ferme pas |

## Risques et parades

- **Poids des polices** : sous-ensembles latin/latin-ext, 3 fichiers max, `font-display: swap`, fallback métrique (Arial/Helvetica) pour limiter le FOUT. Mesurer l'impact sur le démarrage de la fenêtre.
- **CSP de l'extension** : polices **embarquées** uniquement (aucune requête distante). Le site les sert depuis son propre domaine.
- **Licences** : OFL pour Plex et Inter ; mention dans `CREDITS`/`LICENSE`.
- **Accessibilité** : aucune graisse < 400 sous 12 px ; contrastes inchangés (les polices ne changent pas les ratios, mais re-mesure obligatoire).
- **Régression** : les tests de structure et de jetons restent ; un test vérifie qu'aucune police distante n'est chargée.

## Décisions à valider avant de coder

1. **Option typographique** : A (Plex), B (Inter), C (système) ?
2. **Icônes** : jeu SVG maison (recommandé) ou conservation des glyphes ?
3. **Wordmark** : marque + nom en 600, ou nom seul ?
4. **Périmètre** : I7a–c en une passe (3 paliers) ou I7a seul d'abord, maquette à l'appui ?

Maquette : `docs/design-options/mockup/i7-identite.html` (+ `i7-identite.png`).
