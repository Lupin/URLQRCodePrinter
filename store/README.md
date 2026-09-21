# Images de la fiche Chrome Web Store

Les visuels à fournir au magasin. Les dimensions ci-dessous viennent de la page
officielle [Supplying Images](https://developer.chrome.com/docs/webstore/images),
vérifiée le 21 septembre 2026 — pas d'une estimation.

| Image | Dimensions | Format | Obligatoire ? | État |
|---|---|---|---|---|
| Icône de l'extension | 128 × 128 | PNG, avec canal alpha | **Oui**, dans le `.zip` | ✅ `src/extension-src/icons/icon-128.png` |
| Captures d'écran | 1280 × 800 **ou** 640 × 400 | PNG ou JPEG | **Oui**, au moins 1, jusqu'à 5 | ❌ à produire → [`screenshots/`](screenshots/) |
| Petite image promotionnelle | 440 × 280 | PNG ou JPEG | **Oui** | ❌ à produire |
| Image « marquee » | 1400 × 560 | PNG ou JPEG | Non | — |

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

## Les captures

Elles doivent montrer **l'expérience réelle** de l'extension — pas une
reconstitution. Voir [`screenshots/`](screenshots/) pour les détails et le
classement.
