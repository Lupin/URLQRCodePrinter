# Prompt OpenDesign — analyse de l'interface, et visuels pour la page d'information

[← Documents](../README.md)

Ce prompt se lance dans **OpenDesign**, qui ne connaît pas ce projet. Il sert à
deux choses, dans cet ordre : **analyser et améliorer l'interface**, puis
**créer les visuels de la page d'information** (la page publique du produit).

## Ce qu'il faut joindre au prompt

| Fichier | Pourquoi |
|---|---|
| `src/site/index.html`, `src/site/en/index.html` | La page à illustrer, dans ses deux langues |
| `src/site/style.css` | Ses jetons, ses sections, sa mise en page |
| `src/web/index.html`, `src/web/style.css` | L'application — la surface la plus dense en réglages |
| `src/extension-src/popup.html`, `popup.css` | La fenêtre de l'extension, 380 px de large |
| `src/extension-src/icons/icon-512.png` | Le signe réel du produit — à réutiliser, pas à redessiner |
| `docs/design-options/audit-accessibilite.md` | Ce qui a déjà été mesuré, et les seuils tenus |
| `store/promo/BRIEF.md` | Le brief d'images déjà passé par OpenDesign, comme précédent de forme |

`store/screenshots/01-fenetre-popup-fr.jpg` et `02-application-fr.png` peuvent
être joints **pour montrer le produit** — sans être réutilisés comme illustration.

## Où va ce qui sort

- Les visuels de la page : `src/site/` (le build du site recopie le dossier tel
  quel, sous-dossiers compris).
- Les explorations et variantes : `store/promo/alternatives/`.
- L'analyse d'interface : à rendre en texte, et à recopier dans
  `docs/design-options/` si elle tient debout.

## Le prompt

> Rédigé en anglais, comme le brief précédent : les outils de conception le
> traitent mieux. À copier tel quel.

```
Analyse a product's interface, then design the visuals for its public page.

CONTEXT
URLQRCodePrinter is a browser extension plus a web application. It collects the
links you come across and prints them as QR Code labels: on sticky A4 sheets, on
a Bluetooth Niimbot label printer, or as image files. Everything stays on the
user's device — no account, no server, no analytics.

Three surfaces, three very different constraints:
- the public information page (src/site/index.html), read by anyone, on any
  device, in French and English;
- the web application (src/web/index.html), dense with settings, used on a
  desktop, and its output is printed on paper;
- the extension window (src/extension-src/popup.html), 380 px wide, used in a
  hurry, mostly with a mouse.

PART ONE — ANALYSE (text, no images)
Critique the three surfaces and give a prioritised list of changes. For each
item: what is wrong, on which surface, why it matters, and what you would do.
Be concrete — name the element, the section, the label. Order by what a real
person would notice first, not by what is easiest to change.

Judge these in particular:
- hierarchy: is the primary action obvious on each surface? Is anything
  competing with it?
- the information page: does a newcomer understand what the product does, in
  what order, and what to do first? Where would they stop reading?
- density and rhythm: spacing, alignment, grouping of the settings in the app;
- wording: short, plain, no jargon, no empty praise. The audience is broad —
  someone who prints a label for a storage box, not a developer.
- accessibility beyond contrast: focus order, target sizes, what a screen
  reader announces.

PART TWO — VISUALS FOR THE INFORMATION PAGE (images)
The page is flat, squared and ink-based: an orange accent (#c2410c, and #fdba74
in dark mode) reserved for actions only, black or near-black text and thin
rules for everything else, no gradients, no glow, no drop shadows, no rounded
corners. The product's mark is the supplied icon — reuse it, do not redraw it.

Design these:
1. A hero visual, 1600 x 900, that says what the product does without words:
   links becoming QR Code labels. It must work on a white background and on the
   page's dark background.
2. Three small explanatory visuals, one per step of the workflow — collect a
   link from a browser, lay the labels out on a sheet, print on a label printer.
   SVG, single colour plus the orange accent, readable at 320 px wide.
3. The same three as a single process diagram, 1200 x 400, SVG.
4. A social sharing image, 1200 x 630, with the product name, one plain sentence
   about what it does, and the mark.

DELIVERABLES
- The analysis as text, in English.
- Each visual as a separate file, named in lowercase with dashes.
- SVG for diagrams (no embedded raster, no external fonts), PNG at 2x for the
  hero and the social image.
- A short note per visual: what it shows, where it goes on the page, and any
  colour you added.

CONSTRAINTS
- Palette: do not introduce new colours. If you need one, say why and give the
  contrast ratio against the background it sits on. Text must reach 4.5:1,
  graphic elements 3:1.
- Any text inside an image must be French, short, and set in a system font
  stack, since the page loads no web font.
- Do not claim anything in a visual that the product's README does not support.
  If you are unsure whether a feature exists, leave it out rather than
  illustrate it. An invented detail in a picture is worse than an empty one.
- No stock photography, no 3D renders, no abstract "network of nodes".
- Alt text for each image, in French and English.
- Keep each SVG under 40 kB and each PNG under 400 kB.

WHAT NOT TO DO
- Do not propose a redesign of the whole identity: the palette, the squared
  corners and the accent rule are settled, and the app and the extension share
  them.
- Do not add a hero animation, a video, or a carousel.
- Do not write marketing copy: no "seamless", no "powerful", no three-item
  lists that sound like a brochure.
```

## Après la session OpenDesign

- Recopier les visuels dans `src/site/`, les référencer dans les deux pages, et
  lancer `npm run build:site` : une image oubliée dans le build ne se voit qu'en
  production.
- Vérifier les textes alternatifs dans les deux langues.
- Ce qui touche à l'application ou à la fenêtre passe par `src/web/style.css` ou
  `src/extension-src/popup.css`, et par `npm test` : les contrastes, les tailles
  de cible et la structure sont tenus par des tests.
