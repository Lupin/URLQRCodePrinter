# Icônes — état de l'art et choix

Périmètre : les icônes de l'extension URLQRCodePrinter (barre d'outils, page de
gestion, menu contextuel) et les icônes d'interface de la fenêtre.

Le projet n'a **qu'une dépendance d'exécution** (`uqr`) et encode ses PNG à la
main plutôt que d'installer une bibliothèque graphique. Le choix d'icônes suit
la même ligne : aucune dépendance ajoutée, des tracés recopiés.

---

## 1. Les contraintes, avant les goûts

Elles éliminent la majorité des options avant même de comparer les dessins.

### Les icônes du manifeste doivent être des PNG

> « Provide icons in PNG format for the best visual results, although any raster
> format supported by Chrome is accepted. […] **SVG files are not supported for
> any icons declared in the manifest.** »
> — [Chrome for Developers, *Add extension icons*](https://developer.chrome.com/docs/extensions/develop/ui/configure-icons)

Sans appel : `action.default_icon` et `icons` restent des PNG produits par
`scripts/make-icons.mjs`. Le SVG n'est envisageable que pour les icônes
**dans** les pages de l'extension, pas dans le manifeste.

### Un seul PNG sert les barres d'outils claire et sombre

Sous MV2, `browser_action.theme_icons` permettait de fournir une variante par
thème. Cette clé n'existe plus en MV3 : `action.default_icon` est statique. Une
encre unique doit donc tenir sur les deux fonds. Mesuré :

| Encre | Barre claire `#ffffff` | Barre claire grise `#f1f3f4` | Barre sombre `#202124` | Pire cas |
|---|---|---|---|---|
| Teal d'origine `#21808d` | 4,63:1 | 4,16:1 | 3,48:1 | 3,10:1 |
| **Orange `#e8590c`** | **3,58:1** | **3,22:1** | **4,50:1** | **3,22:1** |
| Orange clair `#f97316` | 2,80:1 | 2,52:1 | 5,74:1 | 2,52:1 — échoue |
| Graphite `#1a1a1a` | 17,40:1 | 15,64:1 | **1,08:1** | **invisible** |
| Graphite moyen `#5f6368` | 6,05:1 | 5,44:1 | 2,66:1 | 2,37:1 — échoue |

**Le graphite de l'interface est disqualifié pour la barre d'outils** : à
1,08:1 sur une barre sombre, l'icône disparaît. C'est ce qui justifie que la
marque porte une couleur alors que l'interface reste achromatique — une couleur
de marque n'est pas un accent d'interface, et la règle de rationnement de
`craft/color.md` ne s'y applique pas.

### Aucune ressource distante

La CSP par défaut de MV3 interdit tout script ou style distant, et le README du
projet documente déjà le refus de dépendre du réseau. Toute icône est donc
embarquée : soit un tracé SVG en ligne, soit un PNG local.

---

## 2. Comparaison des bibliothèques

« Vérifié » = j'ai lu le fichier ou la documentation primaire pendant cette
session. Les autres lignes viennent de la documentation des projets et n'ont pas
été recontrôlées ici.

| Bibliothèque | Licence | Grille | Mode de tracé | Graisses | Vérifié |
|---|---|---|---|---|---|
| **Phosphor** | MIT | 256 × 256 | **contour plein** (`fill="currentColor"`) | 6 (thin → fill, duotone) | oui |
| Heroicons | MIT | 24 × 24 | trait 1,5 px | outline + solid 24/20/16 | oui |
| Lucide | ISC | 24 × 24 | trait 2 px | 1 | non |
| Tabler | MIT | 24 × 24 | trait 2 px | 1 | non |
| Iconoir | MIT | 24 × 24 | trait 1,5 px | 1 | non |
| Remix Icon | Apache 2.0 | 24 × 24 | trait + plein | 2 (line/fill) | non |
| Material Symbols | Apache 2.0 | 24 × 24 | variable (axe `wght`/`FILL`) | variable | non |

### Pourquoi le mode de tracé tranche

C'est le point qui décide, et il ne se voit qu'à petite taille. Une icône de
trait sur une grille de 24 rendue à 16 px donne un trait de **1 px** ; ce trait
tombe entre deux rangées de pixels et s'antialiasé en gris sur les deux. Le
dessin s'empâte. Sur la grille de 256 de Phosphor, le contour est une **surface
pleine** : sa silhouette reste nette à n'importe quelle taille.

### Pourquoi pas Lucide, qui est le choix par défaut

Le skill `redesign-existing-projects` d'OpenDesign est explicite :

> « **Lucide or Feather icons exclusively.** These are the "default" AI icon
> choice. Use Phosphor, Heroicons, or a custom set for differentiation. »

Lucide est très bon. C'est aussi la signature visuelle de presque tout ce qui
est généré — même raisonnement que pour le teal écarté côté couleur.

---

## 3. Décision

**Phosphor Icons, graisse `regular`, licence MIT**, avec les tracés recopiés à
la main dans `src/extension-src/popup.js`.

| Emplacement | Support | Icône |
|---|---|---|
| Barre d'outils, menu contextuel, page de gestion | PNG généré | marque QR, encre orange `#e8590c`, **fond transparent** |
| Bouton de suppression d'une ligne | SVG en ligne | Phosphor `x` (regular) |

### Ce qui a changé, et pourquoi

1. **Le bouton de suppression n'utilise plus le glyphe `✕`.** Ce caractère n'a
   ni la même chasse ni le même centrage selon la plateforme : la cible
   changeait de taille et d'alignement d'un système à l'autre. Un tracé
   vectoriel a une géométrie identique partout.
2. **Le fond des PNG est transparent.** Il était blanc opaque. Sur une barre
   d'outils sombre, un carré blanc se lit comme un autocollant — et MV3 ne
   permet plus de fournir une variante par thème.
3. **L'encre passe du teal `#21808d` à l'orange `#e8590c`.** Le teal avait été
   écarté de l'interface ; le laisser dans l'icône de la barre d'outils aurait
   maintenu deux identités. L'orange est aussi la seule encre qui tient ≥ 3:1
   sur les deux thèmes de barre.

### L'icône et son nom accessible

Le tracé porte `aria-hidden="true"` et `focusable="false"` : le nom accessible
vient du bouton (`aria-label="Supprimer « … »"`). Un dessin annoncé **en plus**
de son bouton ferait bégayer le lecteur d'écran — « x, bouton, Supprimer
Protocole Niimbot BLE, bouton ».

`fill="currentColor"` fait le reste : l'icône prend la couleur de son bouton, si
bien que le passage au rouge au survol ne demande aucune règle CSS
supplémentaire.

### Ajouter une icône plus tard

1. Récupérer le tracé : `https://unpkg.com/@phosphor-icons/core@2.1.1/assets/regular/<nom>.svg`
2. Copier la valeur de `d` dans `ICON_PATHS` (`src/extension-src/popup.js`), en
   gardant la mention de provenance et de licence déjà en place.
3. Appeler `icon('nom')`. Rien d'autre : la couleur, la taille et
   `aria-hidden` viennent du helper.

Le coût par icône est d'environ 200 à 400 octets. C'est ce qui rend le recopiage
préférable à une dépendance : pour trois ou quatre icônes, un paquet entier
coûterait plus cher que les tracés qu'on utilise.

---

## 4. Ce que les tests verrouillent

| Test | Ce qu'il empêche |
|---|---|
| `l'encre reste lisible sur une barre d'outils claire et sombre` | Une encre qui disparaît sur l'un des deux thèmes de barre |
| `le fond de l'icône est transparent` | Le retour du carré blanc opaque |
| `le bouton de suppression ne dépend plus d'un glyphe texte` | Le retour de `✕`, et de ses métriques variables |
| `les icônes sont décoratives et le nom reste sur le bouton` | Une icône annoncée en double par le lecteur d'écran |
