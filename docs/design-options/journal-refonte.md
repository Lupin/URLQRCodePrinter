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

## Prochains paliers

| Palier | Note visée | Porte de sortie |
|---|---|---|
| I1 Structure | 3,1 | aperçu visible sans défiler (0 px), 1 primaire, < 40 contrôles |
| I2 Système | 3,7 | 0 valeur hors échelle, onglet actif ≥ 3:1 |
| I3 Liste & flux | 4,1 | liste dense, sélection contextuelle, import guidé |
| I4 Canvas & sortie | 4,45 | planche encadrée, zoom, progression |
| I5 Marque & site | 4,65 | direction tenue, site avec preuve visuelle |
| I6 Polissage | 4,8 | barème ≥ 4,8, 0 exception |
