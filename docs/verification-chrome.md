# L'extension dans Chrome — ce qui a été mesuré

Relevé fait le 26 septembre 2026, sur **Google Chrome 153.0.8010.53** (macOS),
extension chargée depuis `dist/extension`, par `npm run verify:chrome`.

L'audit d'accessibilité (`design-options/audit-accessibilite.md`) annonçait que
ses seize paires de contraste étaient « mesurées, pas estimées ». Elles l'étaient
— mais **par calcul sur les jetons écrits dans les feuilles de style**, jamais
sur un document rendu. `test/popup-a11y.test.js` fait de même : il recalcule les
seize paires depuis `popup.css`. Les deux ont raison sur ce qu'ils mesurent, et
tous deux peuvent se tromper sur ce qui s'affiche. C'est cet écart que ce relevé
existe pour fermer.

---

## Le fait qui commande tout le reste

**Chrome 153 ignore `--load-extension`.** Le commutateur de fonctionnalité
`DisableLoadExtensionCommandLineSwitch` le neutralise, et le navigateur démarre
alors normalement, sans la moindre erreur ni le moindre avertissement : un
profil parfaitement fonctionnel et parfaitement vide. Deux lancements successifs
ont été perdus à croire à un défaut de manifeste.

Le chargement passe donc par le protocole de débogage, commande
`Extensions.loadUnpacked`, qui rend l'identifiant attribué. C'est le chemin que
l'outillage officiel emprunte, et le seul qui fonctionne encore sur cette
version. Toute vérification future dans Chrome doit partir de là.

---

## Ce qui échoue, mesures en main

| # | Constat | Mesure | Critère | Où |
|---|---------|--------|---------|-----|
| 1 | Contour des boutons « CSV », « Markdown » et « Tout effacer » | **1,08:1** — `rgb(224,224,224)` sur `rgb(232,232,232)` | 1.4.11 — 3:1 | `popup.css` |
| 2 | Cible du sélecteur de langue | **75 × 21 px** | 2.5.8 — 24 × 24 px | `popup.css` |
| 3 | Cible du titre d'une ligne de la liste | **302 × 19 px** | 2.5.8 — 24 × 24 px | `popup.css` |
| 4 | Libellés des quatre onglets | **43 px de haut au lieu de 29** : le libellé passe à la ligne | lisibilité | `style.css` |
| 5 | Panneau de gauche de l'application | refuse de descendre sous **432 px** : débordement horizontal dès que la fenêtre fait moins de ~448 px | 1.4.10 Reflow | `style.css` |

### Le constat 1 est le plus grave, parce qu'il était annoncé corrigé

L'audit, point 1 de son tableau, décrit exactement ce défaut — « contour des
boutons CSV / Markdown / Tout effacer », 1,36:1 — et annonce le correctif :
« jeton `--border-strong` dédié aux limites de composants, mesuré ≥ 3,0:1 sur
les deux thèmes ».

Le rendu dit autre chose. `--border-strong` vaut `#8d8d8d` et donne bien 3,02:1
sur la ligne de liste et 3,32:1 sur le sélecteur de langue — **mais les trois
boutons du pied portent encore `--border-line`**, la teinte décorative, à
1,08:1. Le correctif a été appliqué ailleurs que là où le défaut avait été
relevé.

La leçon vaut pour la suite : un test qui recalcule depuis les jetons ne peut pas
attraper cette erreur, puisque les jetons sont justes. Seul un contrôle sur le
rendu le peut.

### Le constat 4 : la fenêtre la plus courante est la plus mal servie

La bande d'onglets mesure 715 px à 1280 px de large, 435 px à 1000 px, puis
**779 px à 900 px** — parce que le point de rupture de `@media (max-width: 900px)`
empile les deux panneaux et rend toute la largeur au panneau de droite.

Les libellés passent à la ligne quand la bande descend sous ~450 px, c'est-à-dire
pour une fenêtre entre **900 et 1100 px** : un 1000 px, 560 px et 380 px donnent
43 px de hauteur, un 900 px en donne 29. La disposition est donc à son pire juste
au-dessus du point de rupture, là où se trouvent les portables.

L'hypothèse portée au plan — « les onglets sont à l'étroit dans une colonne de
320 px » — était **fausse** : la bande ne descend jamais sous 398 px. Le défaut
est ailleurs que là où il était supposé.

---

## L'aperçu ment sur ses échelles

Deux mesures, deux causes distinctes, un même effet : l'aperçu ne montre pas
grand-chose.

**La planche** est plafonnée à `Math.min(0.6, place / largeur)` (`app.js`). À
1280 px de fenêtre, 642 px sont offerts à l'aperçu et la page n'en occupe que
**476, soit 74 %** — la transformation relevée est `scale(0.6)`, le plafond
atteint.

**L'étiquette Niimbot** est agrandie d'un facteur entier, plafonné à 4 :
`Math.min(4, place / largeur_rendue)`. Sur un D110, dont la tête fait 96 px, le
plafond est atteint. Un rouleau 12 × 22 mm s'affiche à **384 px de large pour
45 px réels, soit 8,5 ×**, en rendu `pixelated`. C'est le « trop gros » signalé
en usage, et il se chiffre.

---

## Le menu contextuel tel qu'il est réellement installé

Les quatre entrées déclarées dans le manifeste sont sondées une à une par
`chrome.contextMenus.update`, dont l'échec renseigne `runtime.lastError` — la
seule façon d'interroger un menu natif, qu'aucune API ne permet de cliquer.

| Entrée | État constaté |
|---|---|
| `urq-add-page` | présente |
| `urq-add-link` | présente |
| `urq-add-selection` | présente, mais **désactivée** |
| `urq-open-app` | **absente** |
| `urq-separator` | **absente** |

La cause se lit dans `background.js` : `installMenus()` appelle
`buildMenuDefinitions()` **sans argument**, si bien qu'`includeSelection` est
faux — l'entrée de sélection naît `enabled: false` — et qu'`appUrl` est absent,
donc ni séparateur ni entrée « Ouvrir ». Les tests existants couvraient la
fonction avec ses options, jamais ce point d'appel.

Conséquence directe : la justification de permission publiée sur le Chrome Web
Store décrit **trois** entrées de clic droit fonctionnelles, dont « Add the
selected text ». L'écart entre la fiche et le comportement est précisément ce
qu'un examinateur du magasin recherche.

---

## Le retour du clic droit, et une sonde qui a menti

Le clic droit n'a qu'un retour : le badge de la barre d'outils, pendant 1,5 s.

| Cas | Texte | Fond mesuré |
|---|---|---|
| Ajout | `+` | `rgb(28, 124, 74)` — vert |
| Doublon | `=` | `rgb(26, 26, 26)` |
| Compteur au repos | le nombre | `rgb(26, 26, 26)` |

Le doublon et le compteur partagent **exactement** la même couleur. Un lien déjà
présent est donc signalé par un signe qui ne se distingue pas de l'état habituel
de l'icône : c'est le « l'ajout ne se fait pas tout le temps » rapporté en usage,
pour une part au moins.

**Une première version de ce script concluait à une panne inexistante.** Elle
envoyait `record-capture` depuis le service worker lui-même, et lisait un badge
inchangé. Un contexte ne reçoit pas ses propres messages : le worker n'était
jamais prévenu. La sonde a été refaite depuis la page de l'extension, et le
retour est bien là. Le relevé doit se tromper d'une manière qui se voie, pas
d'une manière qui accuse le produit.

**Un défaut réel, lui, se lit dans le code** (`background.js`, `record()`) et
n'est pas encore mesuré en navigateur : quand le consentement n'a **jamais** été
donné — installation neuve — la branche ouvre l'onglet de la mention et **ne
pose aucun badge**. Après un refus explicite, elle pose `!`. Une installation
neuve n'a donc aucun retour visuel là où un refus en a un.

---

## Les deux doublons de l'onglet Niimbot, confirmés

Libellés relevés dans l'interface française :

| Question | Premier endroit | Second endroit |
|---|---|---|
| Quel lien ? | « Lien à imprimer » (`#label-link`, 3 options) | « Quels liens » (`#print-scope`, 2 options) |
| Combien d'exemplaires ? | « Copies » (`#copies`) | « Exemplaires de chacun » (`#print-copies`) |

Deux sélecteurs et deux compteurs répondent à la même question, dans le même
onglet. Le regroupement demandé porte donc sur quatre champs et deux boutons.

**Le bloc « série » tient déjà ses deux champs sur une ligne** à toutes les
largeurs mesurées, de 1280 px à 380 px : le défaut n'est pas là. Il est dans la
duplication, pas dans l'alignement.

---

## Ce qui n'a pas pu être vérifié, et qui doit être dit comme tel

- **Le menu contextuel ne se clique pas.** Aucune API n'ouvre le menu natif ni
  n'en choisit une entrée. L'existence des entrées a été sondée ; leur *effet*
  ne peut être obtenu qu'à la main.
- **La fenêtre réelle n'est pas ouvrable.** `popup.html` a été chargé dans un
  onglet : même document, mêmes règles, même largeur imposée de 380 px — mais
  pas le même cadre. Un défaut qui ne dépend que du document se voit ici ; un
  défaut lié au cadre du popup, non.
- **Le bug YouTube n'a pas été reproduit en conditions réelles**, pour la raison
  ci-dessus : le scénario se joue au clic droit. Ce qui a pu être établi l'est
  autrement, et de façon déterministe — voir plus bas.
- **L'impression d'une planche sur papier** n'a pas été faite : aucun matériel
  n'est connecté à cette machine. C'est la seule partie de la portée restante de
  l'audit qui reste entière.

---

## Le bug YouTube, établi autrement

Le clic droit ne se rejouant pas, la capture a été éprouvée au niveau où la
décision se prend, et `test/capture.test.js` fixe désormais le comportement :

Chrome remplit `info.linkUrl` **dès que le clic tombe sur un lien**, quel que
soit l'item de menu choisi. L'accueil et les pages de chaîne de YouTube sont des
grilles de vignettes, donc des liens ; une page de vidéo se clique dans le vide.

| Geste | Ce qui est enregistré |
|---|---|
| Clic droit sur une vignette de l'accueil, item « Ajouter cette page » | l'URL de la **vidéo**, avec ses paramètres de liste, pour titre `youtube.com` |
| Clic droit dans le vide de la page de vidéo, même item | l'URL de la vidéo, pour titre le vrai titre de la page |

Le même item, le même geste apparent, deux résultats. S'y ajoute
`https://www.youtube.com/` qui se normalise en `https://www.youtube.com` : la
page d'accueil ne s'enregistre donc qu'une fois, et toute tentative suivante est
un doublon — silencieux, puisque son badge a la couleur du compteur.

Trois causes concourent, et aucune n'est exclusive : le titre perdu sur les
vignettes, le doublon muet, et l'absence de retour lisible.

---

## Comment relancer

```bash
npm run build          # produit dist/extension
npm run verify:chrome  # éprouve dans Chrome et écrit le relevé
```

Le script utilise un **profil isolé** (`.verify-chrome/profile`), redirige les
téléchargements et **tue le navigateur par SIGKILL** : un SIGTERM déclenche sa
boîte de confirmation, qui reste à l'écran et bloque l'arrêt. Trois précautions
reprises de `verify-brave.mjs`, apprises d'un incident où des vérifications
écrites à la volée avaient laissé un navigateur ouvert et des téléchargements
échoués chez l'utilisateur.

Le relevé complet est écrit dans `.verify-chrome/releve.json` et les captures
d'écran dans `.verify-chrome-captures/`.
