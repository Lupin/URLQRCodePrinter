# Images de la fiche Chrome Web Store

Les visuels à fournir au magasin. Les dimensions ci-dessous viennent de la page
officielle [Supplying Images](https://developer.chrome.com/docs/webstore/images),
vérifiée le 21 septembre 2026 — pas d'une estimation.

| Image | Dimensions | Format | Obligatoire ? | État |
|---|---|---|---|---|
| Icône de l'extension | 128 × 128 | PNG, avec canal alpha | **Oui**, dans le `.zip` | ✅ `src/extension-src/icons/icon-128.png` |
| Captures d'écran | 1280 × 800 **ou** 640 × 400 | PNG ou JPEG | **Oui**, au moins 1, jusqu'à 5 | ✅ `screenshots/` — 01 à 04 |
| Petite image promotionnelle | 440 × 280 | PNG ou JPEG | **Oui** | ✅ [`promo/promo-440x280.jpg`](promo/promo-440x280.jpg) |
| Image « marquee » | 1400 × 560 | PNG ou JPEG | Non | ✅ [`promo/marquee-1400x560.jpg`](promo/marquee-1400x560.jpg) |

## Le point à ne pas manquer

**La petite image promotionnelle est obligatoire**, et ce n'est pas une formalité.
La documentation officielle est doublement claire :

> You must provide one small, 440x280-pixel promotional image.

et

> Extensions that don't have a small promotional image will be shown **after**
> extensions that do have that image.

Une fiche sans cette image n'est donc pas seulement incomplète : elle est
reléguée derrière les autres dans les résultats du magasin.

## L'icône : ce qui est vérifié

`icon-128.png` fait bien 128 × 128 et **possède un canal alpha** — vérifié. La
conséquence compte : d'après la documentation, une icône *sans* alpha est placée
dans un cadre à coins arrondis, ce qui n'est pas le cas ici.

Une recommandation qu'elle ne suit peut-être pas : le magasin suggère que le
dessin occupe **96 × 96** au centre, les 16 pixels de chaque côté restant
transparents. C'est un conseil d'harmonie visuelle entre extensions, pas une
exigence — à vérifier à l'œil si vous voulez soigner ce point.

### Changer de dessin

```bash
npm run icons:propositions
```

Le script écrit **huit propositions** dans `dist/brouillons-icones/` — huit PNG
128 × 128 avec canal alpha, leurs rendus 512 px, et une planche qui les montre à
256, à 128, à 32 px et sur fond sombre (le gris clair de la fiche n'est pas le
seul fond où l'icône vit). Les dessins sont des **formes SVG** rendues par Chrome
puis réduites à 128 px : nets à toute taille, et le fond reste transparent.

Le dessin retenu ne s'expédie pas tel quel : il est reporté dans
[`scripts/make-icons.mjs`](../scripts/make-icons.mjs), qui reste la source des
icônes du paquet et les produit à toutes les tailles, sans dépendance graphique.

## Les images promotionnelles : comment elles se conçoivent

Ce ne sont pas des captures. La documentation demande de communiquer la marque,
et donne ces repères :

- **éviter le texte** — les visuels promotionnels ne sont pas déclinés par langue,
  contrairement aux captures ;
- rester lisible **réduit de moitié** ;
- supposer un fond **gris clair** ;
- couleurs saturées, et éviter le blanc et le gris clair en grande surface ;
- **remplir** toute la zone, avec des bords bien définis.

Une image qui n'est qu'une capture d'écran passera, mais n'aura pas l'effet
recherché.

### Les deux images, et comment elles sont produites

```bash
npm run capture:promo
```

`scripts/capture-promo.mjs` compose les deux scènes en HTML, les fait peindre par
Chrome, prend le cliché à **deux fois la taille**, puis le ramène à la dimension
exacte et l'encode en **JPEG** — un 24 bits sans canal alpha par construction,
ce que le magasin exige ; un PNG sorti de Chrome porterait, lui, un alpha.

Les deux images sont **sans texte**, à une exception près : le nom du produit et
l'icône, qui sont la marque et non une langue. C'est ce qui leur permet de servir
la fiche française **et** la fiche internationale : le magasin ne décline pas ces
visuels par langue. Les QR Codes qu'elles montrent sont **réels** — encodés par
le produit, ils mènent au site et à la fiche du magasin —, et non un motif
décoratif. Une image promotionnelle dont le QR Code ne se lit pas serait un aveu.

| Fichier | Dimension | Poids | Contenu |
|---|---|---|---|
| [`promo-440x280.jpg`](promo/promo-440x280.jpg) | 440 × 280 | ~28 Ko | la fenêtre qui collecte, la flèche, l'étiquette QR Code |
| [`marquee-1400x560.jpg`](promo/marquee-1400x560.jpg) | 1400 × 560 | ~148 Ko | la même histoire, au format bandeau : fenêtre, flèche, trois étiquettes |

Les fichiers sont vérifiés à la main après chaque génération : dimension exacte,
JPEG sans alpha, lisibles réduits de moitié sur le gris clair du magasin.

## Les captures

Elles doivent montrer **l'expérience réelle** de l'extension — pas une
reconstitution. Voir [`screenshots/`](screenshots/) pour les détails et le
classement.
