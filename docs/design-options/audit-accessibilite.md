# Audit d'accessibilité — fenêtre de l'extension

Cible retenue : **WCAG 2.2 niveau AA**, conformément à `craft/accessibility-baseline.md`
d'OpenDesign (« la cible pratique est WCAG 2.2 AA ; tout ce qui est en dessous est
une dette de fabrication »).

Périmètre : `src/extension-src/popup.html`, `popup.css`, `popup.js` — la fenêtre
qui s'ouvre au clic sur l'icône de l'extension. L'application embarquée
(`app.html`, copiée depuis `src/web/`) fait l'objet d'un second passage ; elle
partage le même socle de jetons.

Tous les rapports de contraste ci-dessous sont **mesurés**, pas estimés
(luminance relative sRGB, seuils inclusifs : 4,50:1 passe, 4,49:1 échoue).

---

## 1. Ce qui échoue aujourd'hui

| # | Constat | Mesure | Critère | Correctif retenu |
|---|---------|--------|---------|------------------|
| 1 | Contour des boutons « CSV / Markdown / Tout effacer » | **1,36:1** (clair) — 1,40:1 face à la surface du bouton ; **1,55:1** (sombre) | 1.4.11 Contraste des éléments non textuels — 3:1 | Jeton `--border-strong` dédié aux limites de composants, mesuré ≥ 3,0:1 sur les deux thèmes. Le jeton `--border-soft` reste réservé aux séparateurs décoratifs, explicitement exemptés |
| 2 | « Tout effacer » au survol, thème sombre | **2,34:1** sur le fond teinté, 2,81:1 sur le fond nu | 1.4.3 Contraste (minimum) — 4,5:1 | Deux jetons `--danger` : `#b3122b` en clair, `#ff8a80` en sombre — mesurés ≥ 6,6:1 partout |
| 3 | Bouton de suppression d'une ligne | cible ≈ **19 × 19 px** | 2.5.8 Target Size (Minimum) — 24 × 24 px | Cible portée à **28 × 28 px** (marge confortable, sans épaissir la ligne) |
| 4 | Badge de comptage : blanc sur `#21808d` | **4,50:1** — passe sans aucune marge (la moindre retouche de teinte fait échouer) | 1.4.3 | Accent re-calibré par thème ; marge minimale mesurée portée à **5,0:1** |
| 5 | `:disabled { opacity: .45 }` | libellé quasi illisible | hors critère (les contrôles inactifs sont exemptés), mais dette d'usage | Désactivation par jetons (`--text-3` sur `--surface-2`) : l'état « inactif » reste lisible et ne dépend plus d'une transparence |
| 6 | Liens en ligne : seul un soulignement au survol | anneau de focus non unifié | 2.4.7 Focus visible, 2.4.13 Focus Appearance | Anneau unique `2px solid var(--focus)` + `outline-offset` — **inset de −2px** dans la liste, sinon le défilement rogne l'anneau |
| 7 | Deux `<footer>` de premier niveau | deux repères `contentinfo` concurrents | 1.3.1 Info et relations, 2.4.1 | Un seul `<footer>`, deux rangées internes |
| 8 | Aucun `<main>` | pas de repère principal ; navigation par repères impossible | 1.3.1, 2.4.1 | `header` → `main` (capture + collection) → `footer` |
| 9 | `aria-live` sur un nombre nu (`3`) | annonce « 3 », sans unité ni contexte, à chaque rendu | 4.1.3 Messages de statut | `role="status"` + `aria-atomic="true"` sur « 3 liens », singulier/pluriel géré |
| 10 | Échec de démarrage écrit dans `#empty` | message d'erreur sans rôle annoncé | 4.1.3, 3.3.1 | Région `role="alert"` dédiée, distincte de l'état vide |
| 11 | Suppression d'une ligne | le bouton focalisé est détruit au `render()` complet → le focus retombe sur `<body>` | 2.4.3 Ordre de focus | Le focus est déplacé vers le bouton de suppression suivant (ou précédent, ou la liste elle-même) |
| 12 | Deux liens par ligne vers la même destination (`titre` **et** `url`) | double arrêt de tabulation, double annonce | 2.4.4, 3.2.5 | Un seul lien par ligne (le titre) ; l'URL redevient du texte, avec l'URL complète dans `title` |
| 13 | Ouverture dans un nouvel onglet | changement de contexte non annoncé | 3.2.5 (AAA) — retenu comme engagement de fabrication | Mention sr-only « (ouvre un nouvel onglet) » |
| 14 | `transition` sans garde | animations subies | 2.3.3 (AAA) — baseline OpenDesign : non négociable | Bloc `prefers-reduced-motion: reduce` |
| 15 | Aucun mode contraste forcé | bordures `rgba()` invisibles en contraste élevé Windows | 1.4.11 en mode `forced-colors` | Bloc `@media (forced-colors: active)` avec `CanvasText` / `Highlight` |
| 16 | Tailles en `px` partout | insensible au réglage « taille de police » du navigateur | 1.4.4 Redimensionnement du texte | Échelle typographique en `rem` |
| 17 | Aucun `prefers-contrast: more` | — | engagement de fabrication | Renforcement `--text-3` → `--text-2`, `--border-soft` → `--border-strong` |

### Ce qui passe déjà et qu'il ne faut pas casser

- Texte principal et secondaire : **12,9:1** et **5,2:1** en clair, **15,6:1** et
  **7,7:1** en sombre.
- Anneau de focus actuel (`--primary` sur le fond) : **4,50:1** en clair,
  **3,72:1** en sombre — au-dessus du seuil de 3:1 des deux côtés.
- `<html lang="fr">`, `role="status"` sur le message transitoire, `aria-label`
  sur le bouton de suppression, `target="_blank"` + `rel="noopener noreferrer"`,
  et surtout l'absence totale d'`innerHTML` sur des données de page tierce :
  c'est la bonne décision de sécurité, elle est conservée telle quelle.

### Déviation assumée

Aucun lien d'évitement (« aller au contenu ») n'est ajouté. Le critère 2.4.1
Bypass Blocks vise les blocs répétés : cette fenêtre compte une dizaine d'arrêts
de tabulation, sans navigation répétée. Ajouter un lien d'évitement ici
ajouterait un arrêt de tabulation au lieu d'en économiser.

---

## 2. Les trois options partagent ce socle

Les trois directions diffèrent par **l'apparence**, jamais par l'accessibilité.
Chaque option embarque l'intégralité des correctifs 1 à 17 et les mêmes
comportements clavier. Les tableaux de contraste de chaque option sont mesurés
sur ses propres jetons, dans les deux thèmes.

Deux thèmes obligatoires, `prefers-color-scheme` respecté, sans bascule manuelle :
une fenêtre d'extension vit quelques secondes, un sélecteur de thème y serait un
réglage de plus à comprendre.

---

## 3. Provenance OpenDesign

| Option | Système de design source | Emprunt |
|--------|--------------------------|---------|
| A — Précision | `linear-app` | Noir natif, échelle achromatique + un seul accent indigo, chiffres tabulaires, densité maîtrisée par paliers de luminance |
| B — Console | `ibm` (Carbon) | Angles vifs, contours 1 px pleins à 3:1, hiérarchie par règles, priorité au clavier. Seule la structure est empruntée : l'accent est graphite, sans chroma |
| C — Papier | `notion`, `arc` | Neutres chauds, blancs généreux, rayon doux, titre serif, teal conservé de l'identité actuelle |

Règles de fabrication appliquées : `craft/accessibility-baseline.md`,
`craft/color.md`, `craft/state-coverage.md`, `craft/anti-ai-slop.md`.

---

## 4. Décision et état d'avancement

**Option B — Console retenue**, avec l'accent **orange brûlé** : `#c2410c` en
thème clair, `#fdba74` en thème sombre. La lisibilité qui justifiait le choix de
la structure B — contours pleins, angles vifs, hiérarchie par règles — est
intacte.

Trois accents ont été essayés puis écartés : le bleu Carbon `#0f62fe` lit
« Windows », le teal relève du registre sur lequel convergent les interfaces
générées, et le graphite, s'il offrait la meilleure marge, n'apportait aucune
identité. Restait un critère qui vaut pour tout accent coloré : **la concurrence
avec le rouge de destruction.**

| Candidat | Libellé sur accent (clair) | Écart de luminance avec `#b3122b` | Verdict |
|---|---|---|---|
| Bleu Carbon `#0f62fe` | 5,00:1 | 1,38:1 | écarté — lit « Windows » |
| Teal `#0f6b76` | 6,20:1 | 1,11:1 | écarté — registre des interfaces générées |
| Rouille `#a03a12` | 6,76:1 | **1,02:1** | écarté — quasi confondu avec le rouge |
| Graphite `#1a1a1a` | 17,40:1 | **2,52:1** | écarté — aucune identité |
| Ambre `#b45309` | 5,02:1 | 1,17:1 | repli valable — teinte à 35° du rouge |
| **Orange brûlé `#c2410c`** | **5,18:1** | 1,33:1 | **retenu** — marge la plus large des teintes chaudes |

L'orange brûlé et l'ambre passent ce filtre : leur teinte est à 26° et 35° du
rouge, et surtout l'action destructrice porte **aussi** un libellé et une
bordure, si bien que la couleur n'y est jamais la seule information (1.4.1).
Sans ce libellé, aucune des deux ne serait acceptable : orange et rouge sont la
paire que confondent les daltonismes rouge-vert.

### Deux corrections nées de la revue

**Le rationnement de l'accent.** `craft/color.md` plafonne à deux usages
visibles de `--accent` par écran. L'orange posé sur le filet d'en-tête, le
compteur, les deux boutons remplis et les bordures de survol en faisait cinq.
Seul « Ajouter cette page » porte donc la couleur ; le reste est passé à un
jeton d'encre neutre (`--ink`).

**La suppression du rose.** Le rouge de destruction était posé sur
`--danger-soft`, un rouge très clair qui vire au rose — une **troisième teinte
chaude** coincée entre l'orange et le rouge. Trois teintes voisines ne
s'ordonnent plus à l'œil. Le danger est désormais porté par la bordure, l'icône
et le libellé, sur un fond neutre (`--surface-2`) : trois signaux, aucune teinte
ajoutée. La marge du texte rouge passe de 5,91:1 à 5,65:1 — un bon échange, la
lisibilité reste large et la palette perd une teinte. C'est aussi le motif
Carbon d'origine pour les messages d'erreur : bordure gauche épaisse, fond
neutre.

Appliqué :

- `src/extension-src/popup.html` — repères `header` / `main` / `footer`
  (un seul `contentinfo`), compteur avec unité, région `role="alert"` dédiée à
  l'échec de démarrage.
- `src/extension-src/popup.css` — jetons Console + accent graphite, échelle en `rem`,
  `--border-line` (décor) séparé de `--border-strong` (composant, ≥ 3:1),
  anneau de focus unifié, désactivation sans opacité, `prefers-reduced-motion`,
  `forced-colors`, `prefers-contrast`.
- `src/extension-src/popup.js` — un seul lien par ligne, annonce du nouvel
  onglet, reprise du focus après suppression, erreur de démarrage annoncée.
- `test/popup-a11y.test.js` — 21 garde-fous. Les seize paires de contraste sont
  **recalculées depuis les jetons écrits dans `popup.css`**, jamais recopiées :
  recopier les valeurs laisserait passer exactement ce qu'on veut attraper.

### L'application embarquée

Le même socle a été étendu à `src/web/style.css` — la page que la fenêtre ouvre.
Elle portait les mêmes défauts, avec deux de plus :

| Constat | Mesure | Critère | Correctif |
|---|---|---|---|
| Contour des champs de saisie et des boutons discrets | **1,36:1** | 1.4.11 — 3:1 | Jeton `--border-strong`, comme dans la fenêtre |
| `--danger` n'était pas redéfini en thème sombre | **2,88:1** pour le texte rouge | 1.4.3 — 4,5:1 | Jeton `--danger` par thème |
| Anneau de focus des champs | `rgba(…, 0.35)` — sous 3:1 | 2.4.11 / 2.4.13 | `outline: 2px solid var(--focus)` |
| Voyant « en cours » | `#d08b1f` à **2,85:1**, et troisième teinte chaude | 1.4.11 — 3:1 | L'accent dit « en cours », le vert « connecté », le gris « au repos » |
| Opacités de texte (`.link__short-mark` à 0,6) | ≈ **2,8:1** | 1.4.3 — 4,5:1 | Jetons `--text-3` |
| `.btn:disabled { opacity: .45 }` | libellés illisibles | dette d'usage | Désactivation par jetons |
| `.columns__item` (cases à cocher) | hauteur ~18 px | 2.5.8 — 24 px | `min-height: 24px` |
| Compteur occupant la colonne large | défaut de mise en page | — | `grid-column: 2` : un élément à **ligne définie mais colonne automatique** est placé *avant* les éléments entièrement automatiques, donc avant le titre |
| Cases et curseurs natifs | bleu système, seule touche froide | cohérence | `accent-color: var(--accent)` |

Les deux feuilles déclarent désormais **les mêmes quinze jetons** dans les deux
thèmes, et `test/tokens-partages.test.js` refuse toute divergence : c'est le seul
mécanisme qui empêche deux feuilles livrées séparément de dériver en silence.

L'accent est rationné différemment selon la surface, et c'est délibéré : la
fenêtre n'a qu'un objectif, donc un seul élément coloré ; l'application est un
outil à plusieurs panneaux, donc **l'accent y marque les actions** et rien
d'autre — compteur, badges, numéros d'ordre et bordures de survol sont à
l'encre neutre.

Portée restante : charger l'extension dans Brave, parcourir la fenêtre au
clavier et imprimer une planche, pour confirmer en rendu réel.

