# Brief OpenDesign — image promotionnelle 440 × 280

[← Images de la fiche](../README.md)

Ce dossier reçoit la **petite image promotionnelle** de la fiche Chrome Web
Store. Elle est obligatoire : sans elle, la fiche est affichée après celles qui
en ont une.

## Ce qu'il faut joindre au prompt

OpenDesign ne connaît pas ce projet. Trois fichiers à lui donner :

| Fichier | Pourquoi |
|---|---|
| `src/extension-src/icons/icon-512.png` | Le signe réel du produit — indispensable |
| `src/extension-src/icons/icon-1024.png` | La même en plus grand, s'il veut zoomer sur le détail |
| `store/screenshots/01-fenetre-popup-fr.jpg` | Pour lui montrer à quoi ressemble le produit — **à ne pas réutiliser** dans l'image |

## Le prompt

> Rédigé en anglais : les outils de conception le traitent mieux, et le brief
> n'a pas besoin d'être traduit pour être compris. À copier tel quel.

```
Design a promotional tile for a Chrome Web Store extension.

DELIVERABLE
4 to 6 distinct proposals. Each as a 440 x 280 px PNG, full bleed — no padding,
no border, square corners. Also export a 220 x 140 px version of each, so we can
check legibility at half size.

WHERE IT WILL BE USED
The Chrome Web Store listing page. The tile is shown at 440 x 280 on the listing
and scaled to half size in search results. It sits on a light grey background
next to other extensions, and its only job is to make someone stop and click.
This image is not a screenshot and should not contain one.

THE PRODUCT
URLQRCodePrinter is a browser extension that collects links the user chooses and
turns them into printable QR labels — for labelling folders, cables, boxes and
belongings. Everything stays on the user's device: no account, no server, no
analytics. It prints to a small Bluetooth label printer, or exports a PDF sheet
of labels.

THE MARK
The attached icon is the product's existing mark: a QR code emerging from a
label slot — an orange QR sitting on a label shape. It reads as "a QR code you
can stick on something". Build on it; do not redesign it. You may crop, scale or
bleed it, and you may recolour it to white or to a darker orange, but the shape
language must stay recognisable.

BRAND PALETTE — sampled from the real icon, please use these exact values
  #C2420E  primary rust orange — should dominate
  #BE3501  deep orange, for depth and shadows
  #DE6A34  light orange, for gradients and highlights
  #FFFFFF  paper white
  #FAF6F3  warm off-white, for label surfaces
  #1A1A1A  ink, only if a near-black is needed

OFFICIAL CHROME WEB STORE GUIDANCE
The size is the only hard requirement; the rest is what the store's own
documentation asks for, and it matters:
  - Avoid text. Promotional images are not localised, and a text tile would be
    wrong for most users — the extension name is displayed next to the image
    anyway.
  - It must read clearly when shrunk to half size.
  - Fill the entire 440 x 280 region, with well-defined edges.
  - Use saturated colours. Avoid large areas of white or light grey — the
    surrounding store page is light grey.
  - Communicate the brand, rather than illustrating the interface.

DIRECTIONS TO EXPLORE
  1. A single label as hero: one label carrying a QR code, on saturated orange.
  2. A field of QR modules in two tonal oranges, with one label floating above it.
  3. The mark scaled up until it bleeds off the edges — bold, close-cropped.
  4. Two or three overlapping labels at slight angles, suggesting the act of
     printing them one after another.
  5. Something that suggests a small label printer or a scrolling strip of labels.

AVOID
  - Gradients that turn muddy or brown when blended.
  - Soft drop shadows that vanish at half size; if you use shadow, make it
    deliberate and large.
  - Any text, wordmark or logo lockup.
  - Screenshot collages, mockups with device frames, or added browser chrome.
  - Thin lines and small details that disappear when scaled down.

OUTPUT
Numbered proposals, each exported at both sizes, named proposal-01.png,
proposal-02.png, and so on. For each one, tell me in one line what the idea is.
```

## Ce que j'attends en retour

- **Les deux tailles** pour chaque proposition — c'est à 220 × 140 que se joue
  la lisibilité, pas à 440 × 280.
- **Une ligne d'intention** par proposition, pour pouvoir choisir sans deviner.

## Après réception

1. Déposer les retenues ici, nommées `promo-440x280.png` et `promo-220x140.png`.
2. Référencer le choix dans [`../README.md`](../README.md).

## Une alternative, si besoin

Si OpenDesign ne donne rien d'exploitable, je peux produire des propositions
localement : le QR code des compositions peut être **un vrai**, encodé par le
code du projet (`src/core/qr.js`), ce qui donnerait une image scannable. Dites-le
simplement, je m'en occupe.
