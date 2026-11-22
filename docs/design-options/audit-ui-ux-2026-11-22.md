# Audit UI/UX sévère — URLQRCodePrinter

**Date** : 22 novembre 2026 · **Branche** : `extension-layout-improvement` (locale, rien de publié) · **Version auditée** : 0.4.0 (`7973d17`)
**Périmètre** : application web (`src/web/`), fenêtre de l'extension (`src/extension-src/`), page publique (`src/site/`), page de confidentialité, rendu imprimable.
**Posture** : lecture de Senior Human Interface Engineer + direction artistique. Le but n'est pas de flatter un travail déjà sérieux, c'est de nommer ce qui empêche le produit de passer de « fonctionnel » à « évident ».

**Méthode** : 24 captures d'états réels (clair, sombre, 4 modes, 4 largeurs, 60 liens, vide, impression, fenêtre, site), relevés de styles calculés et de géométrie par CDP, lecture du code. Chaque constat porte une preuve vérifiable. Les mesures brutes sont dans `.audit/mesures.json`, les captures dans `.audit/captures/`.

**Un constat a été écarté après vérification** : les boutons désactivés semblaient illisibles en thème sombre (`#818181` sur `#878787`, 1,08:1). C'était un artefact de capture — le cliché a été pris pendant la transition des couleurs au changement de thème. La reproduction forcée donne `#333333` sur `#a8a8a8`, soit 5,31:1, conforme. Le constat n'est pas publié. Les défauts listés ci-dessous ont tous été reproduits au moins deux fois.

---

## 0. Verdict

**Note de la version actuelle : 2,3 / 5.**

C'est une interface **fabriquée avec soin et pensée sans direction**. La discipline d'ingénierie est réelle — jetons partagés entre les deux feuilles, audit WCAG mesuré, focus visible, thème sombre, rendu papier au millimètre — mais elle sert une architecture qui n'a pas été dessinée : deux colonnes de formulaires empilés, 85 contrôles de formulaire dans le document, 28 blocs d'aide, et **l'aperçu du produit relégué à 1 545 px du haut de la page**, hors de l'écran au chargement.

Autrement dit : le produit sait faire une planche de QR Codes, mais l'écran ne montre jamais la planche. L'utilisateur règle des champs pour un résultat qu'il ne voit pas, puis imprime en espérant. C'est le défaut central, et il explique la plupart des autres.

L'objectif 4,8 / 5 est atteignable, mais **pas par retouches**. Un premier passage de correctifs (I0) répare les défauts bloquants et fait monter à 2,5 au mieux ; le saut vient ensuite de la structure (I1), puis du système (I2), puis de la marque (I5). Le chemin complet est en §6, avec une note attendue par palier. Le barème réutilisable est dans [barre-qualite-ui.md](barre-qualite-ui.md), le référentiel externe dans [referentiel-patterns-ui.md](referentiel-patterns-ui.md).

---

## 1. Barème et notes détaillées

Douze dimensions pondérées, notées sur 5. Le poids reflète ce qui fait revenir un utilisateur sur un outil utilitaire : structure, clarté, efficacité — pas le décor.

| # | Dimension | Poids | Note | Justification en une phrase |
|---|-----------|-------|------|------------------------------|
| 1 | Clarté & hiérarchie visuelle | 12 | **2,2** | 77 éléments interactifs de même poids, aucun point focal, et le seul élément qui compte (l'aperçu) est invisible au chargement. |
| 2 | Architecture de l'information & navigation | 12 | **2,3** | La gestion de la collection (renommer, supprimer, réordonner) occupe le haut du panneau, au-dessus de la liste qu'elle gère, et les 4 modes de sortie sont enterrés sous des réglages globaux. |
| 3 | Densité, espacement & rythme | 10 | **1,9** | 11 valeurs de `gap`, 27 de `padding`, 11 tailles d'écran : aucune échelle, donc aucun rythme lisible. |
| 4 | Système de composants & cohérence | 8 | **2,6** | 4 traitements de bouton et 3 hauteurs cohabitent ; l'onglet actif est peint de la couleur du panneau, donc invisible. |
| 5 | États & feedback | 10 | **2,5** | L'état vide est une phrase sans action ; aucune progression pour les opérations longues au-delà de la série Niimbot ; pas d'annulation pour les gestes destructeurs. |
| 6 | Accessibilité & inclusivité | 10 | **2,7** | Bon socle documenté, mais onglets ARIA incomplets, focus de champ à 1,42:1, cibles mesurées à 13 × 13 px, libellés à 9 px, `prefers-reduced-motion` absent de l'application. |
| 7 | Affordance & interactions | 8 | **2,5** | Suppression adjacente au sélecteur de collection, « Vider la collection » sans confirmation, curseur sans valeur affichée, boutons secondaires orange au survol. |
| 8 | Expression de marque & art direction | 10 | **1,9** | Police système, aucun visuel, aucune matière : « Console » donne un formulaire d'administration, pas un instrument d'impression. Le site ne montre pas le produit. |
| 9 | Charge cognitive & efficacité du flux | 10 | **2,2** | 1 310 px de défilement pour voir le résultat ; 28 textes d'aide ; 9 réglages visibles par mode. |
| 10 | Responsive & adaptation | 4 | **2,5** | Pas de débordement horizontal, mais la rupture à 900 px détruit la relation collection ↔ aperçu : à 380 px, l'aperçu est à 3 614 px. |
| 11 | Microcopy & ton | 4 | **2,6** | Français correct et constant, mais prose technique au milieu des formulaires, explications dupliquées, formulations négatives. |
| 12 | Finition & craft | 2 | **2,4** | Focus, contraste et `forced-colors` soignés ; mais ombre unique dans un système sans ombre, rayon 7 px orphelin, composants natifs laissés bruts. |

**Calcul pondéré** : 232,0 / 100 = **2,32 → 2,3 / 5.**

Pour situer : 2,0 = « utilisable mais rebutant », 3,0 = « outil correct d'ingénieur », 4,0 = « outil qu'on montre », 4,8 = « outil dont on ne remarque plus l'interface tant elle fait ce qu'on attend ». Une version publiée aujourd'hui soutiendrait la comparaison sur la fonction, pas sur l'expérience.

---

## 2. Les douze constats majeurs

Ceux qu'un utilisateur remarque dans les dix premières secondes, ou qui lui coûtent une erreur.

### M1 — L'aperçu est hors de l'écran, dans tous les modes sauf un

Mesuré à 1440 × 900 : `#preview` commence à **1 545 px** (mode Planche), 903 px (Tableau), 1 046 px (Étiquette Niimbot), 807 px (Divers). Le document fait 2 210 px pour un écran de 900 : il faut défiler **1 310 px** pour voir le résultat de ce qu'on règle. En mode Planche, la colonne de droite mesure 1 944 px quand la gauche en fait 1 255 : les deux panneaux ne se lisent même pas comme une paire.

C'est le défaut structurant. Un outil de mise en page ne se juge pas sur ses champs, mais sur son aperçu. Ici, régler une marge, c'est agir à l'aveugle. La correction n'est pas cosmétique : il faut un troisième volet (ou un aperçu collant) qui reste visible pendant qu'on règle — voir I1.

### M2 — Deux actions primaires se disputent l'écran, en permanence

« Ajouter » (orange plein, `index.html:172`) et « Imprimer les 6 liens » / « Exporter les 6 images (ZIP) » (orange plein pleine largeur, `index.html:870`, `:891`) sont visibles simultanément. Carbon est explicite : *un seul bouton primaire par page*. Ici le produit dit « fais deux choses à la fois », et l'ajout d'un lien — action de collecte, fréquente mais banale — prend le même poids que la sortie, l'action rare et décisive.

Aggravant : `btn--fill` (`style.css:716`) transforme **7 boutons secondaires en orange plein au survol**. L'accent ne désigne donc plus « l'action » mais « ce que la souris touche ». C'est exactement la surutilisation que le commentaire d'en-tête de `popup.css` prétend éviter.

### M3 — Aucune échelle : ni espacement, ni typographie

Relevé dans `src/web/style.css` :

- **11 valeurs de `gap`** : 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16 px — plus des millimètres.
- **27 déclarations de `padding` distinctes** : 1, 2, 3, 4, 6, 7, 8, 10, 14, 16, 22, 40 px, plus des `clamp()` — aucun pas commun.
- **15 tailles de police**, dont 11 pour l'écran (9, 10, 10,5, 11, 11,5, 12, 12,5, 13, 14, 15, 20 px) et 4 pour le papier (7, 8, 9, 12 pt).

Une échelle n'est pas une coquetterie : c'est ce qui permet à l'œil de distinguer un groupe de champs d'un autre sans lire. Sans elle, tout se vaut, et l'utilisateur doit lire chaque bloc pour savoir où il est. La cible raisonnable est 4/8/12/16/24/32 et 11/12/13/14/16 (Carbon, Geist, Radix — voir le référentiel).

### M4 — L'onglet actif est invisible

`.tab--active` (`style.css:778`) pose `background: var(--surface)` sur une bande `.tabs` qui a déjà `background: var(--bg)` et un panneau à `--surface`. Résultat : l'onglet actif est **peint de la couleur du panneau**, et ne se distingue que par une ombre de 1 px à 8 % d'opacité. Les quatre modes du produit — dont dépend tout ce qui sera imprimé — ne se voient pas. C'est un défaut que les captures rendent flagrant : on ne sait pas où l'on est.

### M5 — L'état vide est un cul-de-sac

`#empty` (`style.css:949`, `index.html:221`) est une phrase grise centrée : « Aucun lien. Ajoutez-en un ci-dessus, importez une archive, ou utilisez l'extension navigateur. » Aucune action, aucun visuel, aucune des trois portes proposée comme bouton. Carbon documente l'anatomie d'un état vide : titre positif, corps, action primaire, action secondaire — et recommande de dégrader en texte seul quand la place manque, pas de rester sans action.

Dans la même capture, un **curseur de case à cocher orphelin** flotte au-dessus de « Réorganiser », sans libellé : le groupe « tout sélectionner » n'a plus de sens quand il n'y a rien, mais reste affiché.

### M6 — L'en-tête est cassé, pas seulement mal composé

Ce n'est pas une question de goût : `src/web/index.html:19` contient un `</div>` **orphelin**, sans balise ouvrante. Le conteneur `.topbar__brand` prévu par la feuille de style (`style.css:130`) n'existe donc pas dans le DOM, et ses règles ne s'appliquent à rien. Résultat mesuré : la barre fait **125,5 px** de haut (145 px à 480 px), l'image de marque est posée à `y = 22` et le `h1` à `y = 56`, donc le titre est sous le logo au lieu de lui être associé ; le sous-titre, le sélecteur de langue et la pastille de comptage flottent dans une grille à trois colonnes qui n'accueille pas ce qu'elle devait.

Un en-tête de 126 px pour quatre éléments, sur un écran de 900 px, coûte 14 % de la hauteur utile — soit précisément la place où l'aperçu aurait pu commencer à apparaître. Corriger trois lignes de HTML rend de l'espace au produit.

### M7 — Cibles trop petites et texte trop petit, malgré un audit WCAG propre

Le projet a un audit d'accessibilité mesuré (`docs/design-options/audit-accessibilite.md`) et des tests dédiés. Les mesures du rendu réel montrent pourtant :

| Élément | Mesure | Seuil |
|---|---|---|
| Case à cocher de ligne | **13 × 13 px** | 24 × 24 (WCAG 2.5.8) |
| Supprimer une ligne (`link__remove`) | **21 × 19 px** | 24 × 24 |
| Éditer une ligne (`link__edit`) | **24 × 19 px** | 24 × 24 |
| Flèches de déplacement | **24 × 24 px**, glyphe à **9 px** (`style.css:904`) | 24 × 24, texte lisible |
| Étiquettes de tag | **10,5 px** (`style.css:858`) | plancher 11 px (HIG) |

L'audit précédent annonçait une cible portée à 28 × 28 px pour la suppression ; la mesure dit 21 × 19. Soit la mesure a été faite sur un autre état, soit une régression est passée. Dans les deux cas, le garde-fou ne garde pas ce qu'il prétend.

### M8 — Le formulaire expose sa mécanique, pas sa tâche

Le panneau droit empile, avant les onglets de sortie : « Le QR Code pointe vers » + un sélecteur + **une phrase qui répète la valeur** (« Le QR Code encode l'URL collectée. »), puis « Raccourcir les liens (option) » + « Service » + un sélecteur + **la valeur encore répétée** (« T.LY (défaut) — lien plus court · toute la collection… »), puis quatre lignes de prose sur le raccourcissement, puis les onglets. Le même contenu est dit trois fois, et la décision de l'utilisateur (quel mode de sortie ?) est repoussée sous tout cela.

Nielsen prend justement la boîte d'impression comme exemple canonique de divulgation progressive : peu d'options d'abord, les réglages spécialisés à la demande. Ici, c'est le contraire : tout est affiché, tout le temps, y compris les marges au dixième de millimètre.

### M9 — La marque n'existe pas à l'écran

Police système, aucun visuel, aucun mouvement, un logo de 30 px posé au-dessus du titre dans une barre de 126 px. L'orange brûlé est la seule signature, et il est employé à la fois comme action primaire, comme survol de boutons secondaires et comme remplissage d'exports. La direction « Console » — angles vifs, contours, hiérarchie par règles — est un choix défendable, mais elle n'est tenue nulle part : trois ombres subsistent (`style.css:781`, `:940`, `:1253`), un rayon de 7 px orphelin (`:143`), et des composants natifs (case à cocher, curseur, barre de défilement) laissés bruts, qui contredisent la rigueur revendiquée.

Sur le site public, la conséquence est plus brutale : **aucune capture du produit**. Une page de vente pour un outil visuel, sans une image de ce qu'il fabrique — alors que les visuels existent déjà dans `store/` et `dist/`.

### M10 — Le site ne vend pas, il documente

La page publique est une suite de blocs de texte : héros de 700 caractères, 9 cartes de fonctionnalités sans icône ni image, genèse, mode d'emploi en 8 étapes, FAQ en lignes grasses sans chevron (rien n'indique qu'elles se déplient), encadré confidentialité, liste de ce qui n'est pas pris en charge. La hiérarchie est plate : tous les titres de section ont le même poids, les cartes sont des rectangles gris de texte.

C'est honnête, précis, et ça ne donne pas envie. La preuve manque : pas de planche imprimée, pas de photo d'étiqueteuse, pas d'avant/après. Le produit a un objet physique — c'est son meilleur argument — et le site n'en montre rien.

### M11 — Les onglets mentent aux lecteurs d'écran

Le HTML déclare `role="tablist"` et quatre `role="tab"`, mais : aucun `aria-controls`, aucun `role="tabpanel"` sur les panneaux, les quatre onglets sont tous dans l'ordre de tabulation (`tabindex="0"`) alors qu'un seul devrait l'être, et aucune flèche ne déplace le focus. Un lecteur d'écran annonce donc « onglet, sélectionné » sans jamais dire quel contenu il commande, et le pattern clavier attendu (flèches) ne fonctionne pas. Le mode actif est aussi annoncé de travers puisque l'état visuel est indistinct (M4).

C'est un défaut bloquant pour une partie des utilisateurs, dans un produit qui a par ailleurs traité le focus avec soin. Il se corrige en une trentaine de lignes.

### M12 — Les gestes destructeurs n'ont pas la même prudence que la suppression de collection

La suppression d'une collection a une confirmation complète, un `alertdialog`, un texte qui dit ce qu'elle emporte et « Annuler » placé en premier. C'est très bien. Mais :

- **« Vider la collection » détruit tout sans confirmation et sans annulation** (`app.js:7113`), alors que c'est l'action la plus destructrice du produit.
- Le **`×` d'une ligne** supprime au premier clic, sans retour.
- « Vider la collection » est visuellement une commande de pied de page banale, côte à côte avec « CSV » et « Markdown » (`fenetre-380-chargee.png`).

La prudence existe donc, mais elle a été appliquée à un objet (la collection) et pas à l'autre (les liens), sans raison lisible. C'est une incohérence de risque, la pire des incohérences pour un utilisateur.

---

## 3. Constats détaillés par surface

### 3.1 Application web

**Architecture et flux.** Le parcours réel est : collecter (extension ou champ) → ranger (collection, tri, réordonnancement) → mettre en page (mode, format, grille) → imprimer ou exporter. L'écran actuel empile ces quatre moments dans deux colonnes sans les nommer. La collecte et le rangement occupent la colonne de gauche, la mise en page et l'export la colonne de droite, et **la sortie (l'aperçu) vient après tous les réglages**. Le flux est correct dans l'ordre, incorrect dans la visibilité : chaque étape cache la suivante.

**Hiérarchie.** Un seul niveau de titre de panneau (13 px, capitales, gris `--text-2`), un seul niveau de libellé (12 px), un seul niveau de texte. Aucune zone n'est plus importante qu'une autre, alors que le produit a un objet principal (la collection) et un objet final (la planche). L'accent devrait désigner la sortie ; il désigne l'ajout et les survols.

**En-tête.** 126 px de haut, et pas seulement mal composé : la structure HTML est cassée (M6). Logo à gauche, titre en dessous (donc désaligné), sous-titre, sélecteur de langue, pastille de comptage noire. Les quatre éléments n'ont ni ligne de base ni gouttière commune. La barre est essentiellement vide à droite, mais occupe 14 % de la hauteur d'écran.

**Panneau gauche.** Dix blocs hétérogènes se suivent : sélecteur de collection, bouton « Supprimer » nu (destructif, sans libellé de contexte, visuellement rempli), un texte d'aide qui contredit le champ (« Nom vide : … » alors que le champ affiche « Mes liens » en filigrane), nom + « Enregistrer » + « Nouvelle », numérotation, note, ajout de lien, recherche + tri, texte d'aide sur le rangement, case « tout sélectionner » avec phrase négative et « Réorganiser », puis la liste — qui commence à **55 % de la hauteur du panneau** et ne montre que deux lignes.

**Liste.** Ligne dense et correcte dans l'ensemble (titre, URL tronquée, tag, numéro, case, suppression, crayon). Trois reproches : les commandes de ligne sont petites et alignées à droite sans regroupement, le crayon ouvre un éditeur en ligne qui élargit la ligne et déplace tout, et le réordonnancement ajoute trois contrôles de plus par ligne (poignée, ↑, ↓), ce qui sature la rangée.

**Panneau droit.** Neuf réglages visibles en mode Niimbot, onze en mode Planche, plus quatre cases de contenu ; les libellés techniques (« Marge gauche et droite (mm) », « Écart entre étiquettes — horizontal (mm) ») occupent autant de place que les champs. Les contrôles sont étirés à la largeur de la colonne, y compris pour une valeur de 1,25 mm : le champ fait 464 px pour trois caractères. Un tel remplissage signale « formulaire » et non « instrument ».

**Aperçu.** Canvas blanc sur page blanche : pas de bord de feuille, pas d'ombre (la seule ombre de page existe dans `style.css:1253` mais ne se lit pas sur fond blanc), pas de zoom, pas de navigation de pages, pas d'indication d'échelle — alors que l'échelle est justement ce qui compte pour l'impression. En mode Divers, un avertissement utile mais mal placé (« URL trop longue pour ce format : le QR Code fait 90 px pour 96 px de large ») flotte au-dessus de l'aperçu, en petites lignes rouges centrées, sans icône ni action correctrice.

**États.** Vide : une phrase sans action (M5). Chargement : aucun état visible. Erreur : bandeau `#stale-style` soigné, mais erreurs de champ peu visibles. Succès : toast de 2,8 s qui disparaît sans laisser de trace. **Focus : le point le plus solide du produit** pour les boutons et les onglets (anneau 2 px, `outline-offset`) ; il faut en revanche noter que le focus d'un champ de saisie n'est signalé que par un fond `#f1d3bf` qui ne contraste qu'à **1,42:1** avec le blanc, sous le seuil de 3:1 de WCAG 2.4.11 — c'est un écart réel entre l'audit sur papier et le rendu.

**Responsive.** À 1024 px, la colonne droite tombe à 493 px et les champs à deux colonnes se tassent ; l'aperçu descend à 1 709 px. À 768 px et 380 px, la grille passe à une colonne : l'aperçu se retrouve à 2 812 px et 3 614 px. La rupture est propre techniquement (aucun débordement horizontal mesuré) mais la relation entre la collection et son aperçu disparaît, alors que c'est l'essence de l'outil.

### 3.2 Fenêtre de l'extension (380 × 560)

Meilleure que l'application sur la hiérarchie : en-tête compact, liste en cartes, deux actions claires (ajouter / ouvrir l'application). Trois défauts nets :

1. **Double défilement : 40 éléments `sr-only` s'échappent de la liste.** La liste a bien son propre défilement (`ul.list` : 183 px visibles, 2 196 px de contenu). Mais chaque ligne contient le texte lecteur d'écran « (ouvre un nouvel onglet) » en `position: absolute` (`popup.css:132`, créé par `popup.js:745-747`), et **aucun ancêtre n'est positionné** — ni la liste, ni `.collection`, ni `main`, ni `body`. Les 40 absolus se placent donc par rapport au bloc initial, à leur position statique loin dans la liste, échappent au rognage de `overflow-y: auto` et étirent le document : mesuré à 380 × 560, `documentElement.scrollHeight` = **2 436 px** pour un `body` plafonné à 560 px. La barre verticale prend 15 px, la largeur cliente tombe à 365 px alors que le `body` en fait 380, une barre **horizontale** apparaît, le bas du pied (« Page d'information ») est rogné, et la page entière défile (`window.scrollTo(0, 400)` déplace la vue).

   **Preuve expérimentale** : ajouter `position: relative` sur `ul.list` fait passer le document de `2 436 × 545` (deux barres) à **`560 × 560` exactement**, sans autre changement. Le correctif tient en une ligne. Un audit de la fenêtre par harnais HTTP ne reproduit pas le défaut, parce que ce harnais ne crée pas ces 40 textes : la mesure n'est pas fausse, elle porte sur un DOM différent de celui du produit.
2. **État vide sans issue.** Quand la collection est vide, le pied de page propose toujours « Vider la collection » et deux exports sans objet, et les deux boutons du haut sont désactivés : l'écran n'a plus aucune action utile. Le grand blanc sous le pied de page n'est pas anodin : le pied n'est pas ancré en bas.
3. **Chevrons de collection non étiquetés.** Deux grosses flèches encadrent « Mes liens » sans dire ce qu'elles changent (collection précédente/suivante). Coût : 96 px de large sur 380 pour un geste rare, au détriment du titre.

Le reste tient : densité, cartes, cibles de suppression confortables, hiérarchie noir/orange cohérente avec l'application.

### 3.3 Page de confidentialité

Lisibilité correcte, ton juste, structure claire. Deux points de forme : pas de sommaire, et des blocs denses où la question que se pose le lecteur (« est-ce que mes données partent quelque part ? ») n'est pas mise en avant alors que la réponse est bonne.

Mais le défaut n'est pas la page, c'est qu'on **ne peut plus l'ouvrir**. Après acceptation du consentement, le seul lien vers `privacy.html` vivait dans le bandeau de consentement, désormais masqué ; le manifeste ne déclare ni `options_ui` ni page de réglages, et aucune autre surface ne pointe vers elle. La page promet pourtant « Vous pourrez changer d'avis depuis sa fenêtre » (`privacy.html:103-106`) et `privacy.js:29-33` justifie de garder les boutons actifs pour cela. En pratique, retirer son accord exige de désinstaller l'extension. C'est un défaut de promesse, pas de mise en page : dans un produit dont la confidentialité est l'argument principal, il coûte plus cher que dix pixels de marge.

### 3.4 Site public

Voir M10. Ajouts mesurés : héros à 88 px d'icône + titre 40 px, paragraphe d'accroche de 78 mots qui court sur 8 lignes à 1440 px (10 sur mobile), grille de 3 × 3 cartes sans média, FAQ en simple liste de titres gras sans affordance de dépliage. Aucune image du produit, aucune preuve visuelle, aucun mouvement, aucune citation d'utilisateur. Le site est un document technique, pas une page de produit.

Et un défaut silencieux qui explique une partie du rendu : `src/site/style.css` utilise **trois jetons qu'elle ne définit pas** — `--text-2` (3 usages), `--border-line` (2 usages), `--focus` (1 usage) — alors que son bloc de jetons ne déclare que `--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent`, `--accent-fg`. Toute déclaration qui passe par ces variables est donc invalide : les filets de la FAQ disparaissent, l'anneau de focus des liens de la page n'existe pas. Aucun test ne couvre le CSS du site. C'est le même type de dette que les cibles à 21 × 19 px : l'intention est écrite, le rendu ne la reçoit pas.

---

## 4. Direction artistique : ce que l'écran raconte

La direction déclarée est « Console » : angles vifs, contours 1 px, hiérarchie par règles, priorité au clavier. C'est une bonne hypothèse pour ce produit — un instrument de mesure du papier ne doit pas ressembler à un tableau de bord SaaS. Le problème n'est pas la direction, c'est qu'elle **s'arrête au CSS**.

- **Ce qui la tient** : rayon 0 presque partout, filets à 3:1, focus net, densité assumée, deux thèmes.
- **Ce qui la contredit** : trois ombres, un rayon de 7 px, des composants natifs non habillés (checkbox, range, scrollbar), un orange qui sert de survol, et surtout une composition qui n'est pas dessinée — deux colonnes de formulaires ne sont pas une « console », c'est un back-office.
- **Ce qui manque** : un objet visuel. Un outil d'impression devrait avoir une matière — le papier, la planche, l'étiquette, la machine. Aujourd'hui, l'écran ne montre jamais le papier ; il montre des champs qui le décrivent.

Trois directions sont possibles (voir [le référentiel](referentiel-patterns-ui.md), §6) : **Console révisée** (recommandée — garder l'austérité, mais composer : un volet, un canvas, une barre d'actions, une échelle), **Atelier** (surfaces papier chaudes, une seule ombre douce, mono pour les URL et les mm — plus proche de l'objet imprimé, risque de dérive décorative), **Studio** (sombre par défaut, densité Linear/Raycast — séduisant, mais contre-sens pour un outil dont la sortie est du papier blanc).

La recommandation : **Console révisée**, avec un emprunt mesuré à Atelier sur la surface de l'aperçu (la planche comme objet posé, pas comme canvas blanc).

---

## 5. Ce qui est bon, et qu'il ne faut pas casser

Il faut le dire aussi, parce qu'une refonte qui jette ça perdra plus qu'elle ne gagnera.

1. **Les jetons partagés entre l'application et la fenêtre**, tenus par un test (`test/tokens-partages.test.js`). C'est rare et précieux.
2. **Focus visible** : anneau 2 px avec `outline-offset`, sur les bons éléments, avec inset dans la liste pour éviter la coupe au défilement.
3. **Deux thèmes complets, sans bascule applicative**, avec des accents recalibrés par contraste — bonne décision.
4. **`forced-colors` et `prefers-reduced-motion`** traités dans la fenêtre (à étendre à l'application).
5. **Le rendu papier en millimètres** (`@media print`, `#print-root`), qui est le cœur de valeur et qui fonctionne.
6. **Le texte français est propre**, sans jargon marketing, avec un ton de notice — c'est une voix, même discrète.
7. **La confidentialité est un argument produit**, pas une page légale : « aucune mesure d'audience, aucun compte » est dit clairement.
8. **Aucune donnée tierce dans `innerHTML`**, choix de sécurité conservé partout.
9. **Les avertissements de format** (URL trop longue, QR trop petit) existent et sont honnêtes — il faut les rendre actionnables, pas les supprimer.
10. **Le test de cohérence des jetons** et les scripts de vérification navigateur sont un actif : la refonte doit continuer à s'appuyer dessus.
11. **Le retour de série Niimbot** (progression « Étiquette 3/12 — titre », bouton « Arrêter », bilan final) est l'état le mieux traité de l'application : c'est le modèle à généraliser aux exports et à l'impression papier.
12. **La fenêtre de l'extension** (`popup.*`) est plus aboutie que l'application : hiérarchie nette, cibles confortables, deux actions distinctes. Elle donne la bonne échelle de ce que l'application devrait être.

**Triangulation.** Deux audits indépendants ont été menés en parallèle sur la même version : l'audit source de l'application conclut **2,6 / 5** sur ses propres poids (interface ~2,5, ingénierie ~4), l'audit des surfaces périphériques note la fenêtre au-dessus de l'application. L'écart avec le 2,3 ci-dessus vient du poids donné ici à la direction artistique et à l'efficacité du flux. Les trois lectures convergent sur le diagnostic : structure non dessinée, exécution soignée.

---

## 6. Chemin vers 4,8 / 5

Sept paliers : un passage de correctifs bloquants, puis six itérations. Chacune a un objectif borné, des critères de sortie mesurables et une note attendue. Chaque palier est un commit (ou une série) sur la branche locale, avec un tag de retour arrière. Rien n'est publié.

| Itération | Intention | Critères de sortie mesurables | Note visée |
|---|---|---|---|
| **I0 — Correctifs** | Réparer sans dessiner : `</div>` orphelin de l'en-tête, onglets ARIA complets, cibles à 24 × 24, confirmation de « Vider la collection » et du `×` de ligne, focus de champ à 3:1, `position: relative` sur la liste de la fenêtre, accès permanent à la confidentialité et retrait du consentement, trois jetons du site. | En-tête < 90 px ; 0 cible < 24 × 24 ; onglets : `aria-controls` + `tabpanel` + flèches ; focus de champ ≥ 3:1 ; fenêtre : `scrollHeight == clientHeight` ; 0 action destructive sans confirmation ou annulation ; lien « Confidentialité » atteignable depuis la fenêtre et l'application ; 0 jeton `var()` non défini. | 2,5 |
| **I1 — Structure** | Un volet collection, un canvas de sortie, une barre d'actions ; l'aperçu visible en permanence ; un seul primaire par vue ; réglages avancés derrière « Ajuster ». | Aperçu visible sans défilement à 1440 × 900 dans les 4 modes ; 1 seul bouton primaire visible ; défiler pour voir l'aperçu = 0 px ; contrôles visibles < 40. | 3,1 |
| **I2 — Système** | Échelles 4/8/12/16/24/32 et 11/12/13/14/16 ; trois hauteurs de contrôle ; une table de variantes de bouton ; onglet actif lisible ; états désactivé/survol/focus corrigés dans les deux thèmes. | 0 valeur hors échelle ; onglet actif ≥ 3:1 sur son fond ; bouton désactivé ≥ 4,5:1 en clair **et** en sombre ; cibles ≥ 24 × 24 px partout. | 3,7 |
| **I3 — Liste et flux** | Liste dense scannable, barre de sélection contextuelle, édition en volet de détail, recherche + filtre, réordonnancement, import guidé. | 0 contrôle de ligne visible hors survol/focus ; sélection = 1 barre + compte ; 0 débordement à 380 px ; réordonnancement opérable au clavier. | 4,1 |
| **I4 — Canvas et sortie** | L'aperçu devient le produit : planche encadrée, zoom/ajustement, pages, progression d'impression, succès explicite, avertissements actionnables. | Planche avec bord et échelle visibles ; zoom présent ; opération > 1 s = progression chiffrée ; avertissement avec action. | 4,45 |
| **I5 — Marque et site** | Passage de direction artistique : un objet visuel (planche/étiquette), une matière d'aperçu, le moment de la sortie ; le site montre le produit. | Site avec ≥ 3 visuels réels du produit ; page 1440 px avec 1 point focal visible au premier écran ; profil de mouvement tokenisé. | 4,65 |
| **I6 — Polissage** | Balayage de cohérence, microcopy, accessibilité re-mesurée, détails d'un pour cent. | Audit WCAG AA re-mesuré sans échec ; 0 incohérence de variante ; contraste ≥ 7:1 sur le texte courant ; note du barème ≥ 4,8. | **4,8** |

**Trajectoire** : le détail de ce qu'exige le franchissement de 4,5 (distribution de notes, conditions, pièges, barème instrumenté) est dans [atteindre-4-5.md](atteindre-4-5.md).

**Maquette** : les écrans de I1 et la capture depuis la barre sont maquettés dans [`mockup/console-revisee.html`](mockup/console-revisee.html) (rendus : `mockup/ecran-1.png`, `mockup/ecran-2.png`). Ils sont à valider avant toute implémentation ; les décisions attendues et les sujets volontairement absents sont listés dans [`mockup/LISEZ-MOI.md`](mockup/LISEZ-MOI.md).

**Règle d'itération** : à chaque tour, on rejoue la même matrice de captures, on remplit le barème, on compare à la note cible. Si la note n'est pas atteinte, on ne passe pas à l'itération suivante — on corrige. Les critères sont mesurables par script (géométrie, contrastes, nombre de contrôles) pour éviter l'auto-satisfaction.

**Ce qu'on ne fera pas** : ajouter des illustrations décoratives, changer la direction « Console » pour une mode SaaS, introduire un cadre CSS ou une bibliothèque de composants, toucher au rendu papier tant que la structure d'écran n'est pas stable.

---

## 7. Traçabilité et retour arrière

- Branche locale : `extension-layout-improvement`, basée sur `7973d17` (0.4.0). Rien n'est poussé.
- Tags de retour : `checkpoint/avant-audit-ui-2026-11-22` (état antérieur) et `checkpoint/avant-audit-ui-2026-11-22-2` (état 0.4.0 au moment de l'audit).
- Retour arrière : `git reset --hard checkpoint/avant-audit-ui-2026-11-22-2`.
- Captures et mesures : `.audit/captures/`, `.audit/mesures.json` (dossier ignoré par Git, local).
- Détail source par source : `.audit/forensics-app.md` (application), `.audit/forensics-popup.md` (fenêtre, site, confidentialité), `.audit/benchmark.md` (référentiel externe).
- Barème réutilisable : [barre-qualite-ui.md](barre-qualite-ui.md).
- Jalons GitHub : milestones **#4 à #11** (Cadrage, I0 à I6), 38 tickets **#12 à #49**. Chaque ticket porte ses critères d'acceptation et une section « Preuve de travail » ; la convention est décrite dans le ticket #13. Le code reste local : seuls les jalons et les tickets existent sur GitHub.

## Annexe A — Inventaire des captures

| Fichier | État capturé |
|---|---|
| `app-1440-defaut.png` | Application, 1440 px, 6 liens, mode Planche |
| `app-1440-page-entiere.png` | Idem, page entière (2 210 px de haut) |
| `app-1440-tableau.png` | Mode Tableau |
| `app-1440-etiquette-niimbot.png` | Mode Étiquette Niimbot |
| `app-1440-etiquette-divers.png` | Mode Étiquette (divers) |
| `app-1440-vide.png` | Collection vide |
| `app-1440-60-liens.png` | 60 liens |
| `app-1440-sombre.png` | Thème sombre |
| `app-1440-sombre-niimbot.png` | Thème sombre, mode Niimbot |
| `app-1440-rangement.png` | Mode rangement ouvert |
| `app-1440-suppression.png` | Confirmation de suppression |
| `app-1280/1024/768/480-defaut.png` | Largeurs intermédiaires |
| `fenetre-380-clair.png`, `-sombre.png`, `-vide.png` | Fenêtre de l'extension |
| `site-fr.png`, `site-en.png`, `site-fr-mobile.png` | Site public (+ versions `-apercu.jpg` lisibles) |
| `confidentialite.png` | Page de confidentialité |
| `zoom-apercu-planche.jpg` | Aperçu de la planche, recadré |
| `sonde-popup-40-page-entiere.png` | Fenêtre à 40 liens, document entier (preuve du double défilement) |

## Annexe B — Mesures brutes

Voir `.audit/mesures.json` : jetons résolus par thème, styles calculés des boutons et onglets, géométrie des panneaux et de l'aperçu, cibles sous 24 px, colonnes et débordements par largeur, coût de défilement et nombre de contrôles par mode.

## Annexe C — Détail des constats et référentiel

Trois documents de travail complètent cet audit. Ils sont conservés localement (dossier `.audit/`, non versionné) et seront joints à la branche si l'on veut les garder :

| Document | Contenu | Volume |
|---|---|---|
| `forensics-app.md` | 30 constats APP-01…APP-30 (3 bloquants, 17 majeurs, 10 mineurs), preuve `fichier:ligne` pour chacun, notation détaillée, 10 chantiers impact/effort. | 463 lignes |
| `forensics-popup.md` | Constats WIN / SITE / PRIV / IMP sur la fenêtre, le site, la confidentialité et l'import, avec mesures 380 × 560 et relevé des 107 arrêts de tabulation pour 50 liens. | 535 lignes |
| `benchmark.md` | Référentiel externe : 36 patterns sourcés (Mobbin, 21st.dev, Beautiful UI, Carbon, Radix, Apple HIG, Linear, Raycast…), valeurs chiffrées, anti-patterns 2026, trois directions artistiques. | 504 lignes |
