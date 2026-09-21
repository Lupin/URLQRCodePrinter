# User guide

**English** · [Français](guide.fr.md) · [Project home](../README.md)

This guide describes the application as it is today: collect URLs from the
browser, lay them out, then print them — on a Niimbot label printer, on a sheet
of self-adhesive labels, or on any printer via a folder of images.

> An earlier version of this document described a single-URL prototype, with
> 15 mm rolls and a density from 1 to 5. It no longer matches the code: the
> D110's print head is 12 mm usable (96 px at 203 dpi) and its density goes from
> 1 to 3.

## Overview

Two surfaces, a single core:

- **the Brave / Chrome / Edge extension** — collects a link on right-click or
  from the toolbar;
- **the application** (the extension page, or `npm run serve` on
  `http://127.0.0.1:4173/`) — reads the collection back, lays it out, prints and
  exports.

Links stay on your machine: storage is local (IndexedDB or
`chrome.storage.local`). The only network traffic is URL shortening, and it
only happens if you click it.

## Collecting links

| Way | Where |
|---|---|
| Right-click a link or a page | "Save this link as a QR code" (« Enregistrer ce lien en QR ») |
| Toolbar button | saves the current tab |
| "Add" (« Ajouter ») field | manual entry |
| "Import" (« Importer ») button | reads back a JSON archive exported earlier |

**Naming the collection.** The "Collection name" (« Nom de la collection »)
field (under the panel title) gives its title to the Markdown export and to the
HTML sheet of the image archive, and gives its name to the exported files —
`Veille-du-vendredi-20260915-1741.md` rather than `liens-qr-….md`.

**Title, tags and note.** The **✎** button on each row opens the three fields
that go into the exports:

- **Title** (« Titre ») — the page title is picked up automatically on capture,
  but a link added by hand has none: this is where you give it one;
- **Tags** — comma-separated, deduplicated and formatted automatically
  (`veille, travail, veille` → `veille` and `travail`). The chips shown under
  the row filter the collection in one click;
- **Note** — free text, visible under the row and carried into the printed table
  if you check "Show notes" (« Afficher les notes »).

Enter saves, Escape cancels. These three fields appear in the CSV, the Markdown
and the workbook — and only if they have content, so as not to add empty
columns. Tags are not printed on labels: they classify the collection.

URLs are normalized on entry: `https://` added if missing, fragment removed,
campaign parameters (`utm_*`, `fbclid`, `gclid`…) stripped — they make the QR
code longer without adding anything on paper. A duplicate is not added twice;
the application tells you so instead of staying silent.

**Dating the labels.** The "Date below the QR code" (« Date sous le QR code »)
selector prints the link's collection date — `None` by default,
`Collection date` (`15/09/2026`) or `Collection date and time`
(`15/09/2026 18:01`). Useful for dating a capture in a lab notebook or a test
log. The choice applies to the sheet, to the table (the "Date" column), to the
Niimbot label and to the image archive.

A date is never printed partially: if it does not fit — column too narrow, or
more than two lines needed at that text size — it is omitted and the preview
flags it. Reducing the text size, or choosing a wider label, makes it fit.

**Opening a collected link.** The title and the URL of each row are hyperlinks:
they open in a new tab, from the application as well as from the extension
window.

## Importing a collection

The **"Import"** (« Importer ») button reads back what the application exports.
It is in the application (extension page or `localhost`), not in the toolbar
window.

| File supplied | Where it comes from | What is read back |
|---|---|---|
| `liens-….json` | **Archive** button | everything: URL, title, tags, note, collection date, short link |
| `etiquettes-….zip` | **Export images (ZIP)** (« Exporter les images (ZIP) ») button | the links from the manifest contained in the archive |
| `export.json` | extracted by hand from an archive | the same |
| `….csv` | **CSV** button, possibly edited in a spreadsheet | URL, title, tags, note, date |

**Importing adds to the current collection; it does not replace it.** To start
again from an empty collection, click "Clear all" (« Tout effacer ») first.

What happens next:

- a link **already present** (same URL) is ignored: the message says
  "0 links imported, 1 already present". Importing the same archive twice
  therefore does not create a duplicate, and it is not an error;
- an **unreadable** row is counted separately ("2 unreadable") and does not
  interrupt the rest of the import;
- the **collection date** is kept when the file carries it — a CSV exported and
  then re-imported therefore keeps its dates;
- the **Host** (« Domaine »), **No.** (« N° »), **Image** and **QR code**
  columns are ignored: they are recomputed;
- in a CSV, columns are matched **by their name**, not by their position:
  reordering columns in a spreadsheet breaks nothing, and the optional columns
  (Note, "Short URL" (« URL courte »)) are taken when they exist;
- the **collection name** is not carried over from an archive: it stays the one
  from the current session.

A file of another type is refused with the list of expected formats, for
example: "Import failed: “notes.txt” is not a recognized format. Accepted
formats: the JSON archive from the “Archive” button, the label folder (.zip) or
its export.json, or a CSV exported from here."

## Shortening, optionally

The "Shorten links" (« Raccourcir les liens ») block sits under the search bar.
The "Service" (« Service ») field only chooses **who** does the shortening: to
get a shorter link, the "Shorten" (« Raccourcir ») button is enough, with
nothing to set.

1. Leave the service on **TinyURL — recommended** (« TinyURL — recommandé »),
   the choice offered from the start. The others state plainly what they
   change — *is.gd — no statistics*, *v.gd — warning before redirect*,
   *spoo.me — click statistics*. None asks for an API key; you can change later,
   and the next shortening will start again from the service you kept.
2. Check the links you want — with nothing checked, the button covers the whole
   collection.
3. Click "Shorten". A second click cancels the batch in progress.
4. "Remove" (« Retirer ») erases all short links.

What happens, and what does not:

- **the original URL is never replaced**; the short link is stored alongside it,
  with the service name and the date;
- **the full URL is sent to the chosen service** — that is the price of
  shortening, and the interface reminds you of it;
- **the printed link then depends on that service.** For a label that has to
  live for years, keep the original URL.

The benefit is concrete on a small label: fewer characters give fewer modules,
hence a QR code that is more legible and can be printed smaller.

Then the **"The QR code points to"** (« Le QR code pointe vers ») selector
(right column) decides what goes to the printer: the collected URL, or the short
link. It applies to all printed outputs — sheet, table, images **and Niimbot
label** — whose QR code as well as text follow this choice.

## Laying out

Four tabs, four uses.

### Label sheet (« Planche d'étiquettes »)

For A4 and Letter self-adhesive sheets. Two families of layouts:

- **generic** — geometrically valid grids, to be adjusted yourself;
- **commercial references** — the dimensions published for those products:

| Reference | Grid | Label | Paper |
|---|---|---|---|
| Avery L7160 | 3 × 7 = 21 | 63.5 × 38.1 mm | A4 |
| Avery L7159 | 3 × 8 = 24 | 63.5 × 33.9 mm | A4 |
| Avery L7162 | 2 × 8 = 16 | 99.1 × 33.9 mm | A4 |
| Avery L7163 | 2 × 7 = 14 | 99.1 × 38.1 mm | A4 |
| Avery Zweckform 3475 | 3 × 8 = 24 | 70 × 36 mm | A4 |
| Avery 5160 / 8160 | 3 × 10 = 30 | 66.7 × 25.4 mm | Letter |
| Avery 5162 / 8162 | 2 × 7 = 14 | 101.6 × 33.9 mm | Letter |
| Avery 5163 / 8163 | 2 × 5 = 10 | 101.6 × 50.8 mm | Letter |
| Avery 6871 | 3 × 6 = 18 | 60.3 × 31.8 mm | Letter |

> **The preview is scaled to the window**, not at 100%: the text therefore looks
> small in it. What you must check there is the *layout*. To judge the actual
> rendering, print on plain paper — or look at the "Images to print"
> (« Images à imprimer ») tab, which shows one label full size.

**Choosing the table columns.** In the "Table" (« Tableau ») tab, the **Printed
table** (« Tableau imprimé ») group lets you check the columns one by one:
No., QR, URL, Title, Tags, Note, Date. The date has its own checkbox, with or
without the time: each tab has its own, and a single setting would force you to
change it when moving from one to the other.

Two of them are only offered if they have content: a "Tags" or "Note" column
empty across a whole page teaches you nothing. They are enabled from the list,
with the **✎** button on each row.

**Hiding the grid.** The **"Grid and borders"** (« Grille et bordures »)
checkbox removes the rules and the gray header background: the table then reads
like a list, and prints lighter. The rows keep a little more breathing room, the
only landmark left to follow a row with your eyes.

**Choosing the number of columns, or filling the sheet.** The **Set the sheet
text size** (« Régler la taille du texte de la planche ») selector. The **Text
size (pt)** (« Taille du texte (pt) ») field gives the height of the font
printed under each QR code. It is pre-filled from the label height — 7 pt on a
25 mm label, 9.5 pt on a 3 × 8 A4, 14 pt on a 60 mm one — because 7 pt
everywhere left an A4's space unused, under a QR code that took up everything.
Changing the layout rewrites it, like the six grid values.

Raise it by hand if you want it bigger: the upper bound of the **QR width**
(« Largeur du QR ») slider comes down by itself to leave room for the text, and
nothing is truncated. The line under the slider says how many lines of text the
chosen layout still allows.

**A single preset, six values.** The **Layout** (« Disposition ») selector only
*pre-fills* the six fields that follow; you can then adjust them freely, and the
label size is recomputed:

**Selecting what gets printed.** The **Selection** (« Sélection ») group
("Check all" (« Tout cocher ») / "Uncheck all" (« Tout décocher »)) acts on the
checkboxes to the left of each row, not on the search. The sentence under the
buttons always says what will go to the printer, and the button itself announces
it: "Print the 31 links" (« Imprimer les 31 liens ») or "Print the selection (3)"
(« Imprimer la sélection (3) »).

> **No link checked means "the whole collection" (« toute la collection »).**
> This is the least guessable rule in the application: "Uncheck all" does not
> print *nothing*, it prints *everything*. It is written under the buttons for
> that reason.

| Field | What it does |
|---|---|
| **Columns** (« Colonnes ») / **Rows** (« Rangées ») | the desired grid on the sheet |
| **Left and right margin** (« Marge gauche et droite ») | the margin on each side of the grid |
| **Top and bottom margin** (« Marge haut et bas ») | the margin above and below |
| **Gap between columns** (« Écart entre colonnes ») / **Gap between rows** (« Écart entre rangées ») | the white band between two labels |
| **Horizontal / vertical offset** (« Décalage horizontal / vertical ») | moves the whole grid, without changing it |

The sentence under these fields announces the result, with your figures: "Label
size derived from these six values: 63.5 × 33.9 mm, 3 × 8 per sheet.", and adds
"Offset applied: 1.5 mm to the right and 3.5 mm to the bottom." if you entered
an offset — that is what explains a grid that does not land where you expected.

For a **commercial sheet**, choose its reference: the six fields then take its
published dimensions, and the resulting size is exact to the nearest hundredth
of a millimeter. The manufacturer's margin is not always symmetrical — 8.6 mm on
the left and 5.1 mm on the right on an L7160 — and a grid with symmetrical
margins cannot reproduce both: the **pitch** stays exact, so the columns do land
opposite their cells, but the whole thing may be offset by a few tenths of a
millimeter. Correct it with **Horizontal offset**, never with the margin.

**Calibrate before printing on a sheet.** No manufacturer's dimension accounts
for your printer's feed offset. The procedure:

1. print on **plain paper**, at **100%** scale (never "fit to page"
   (« ajuster à la page »): that is cause no. 1 of shifted sheets);
2. overlay the resulting sheet on your label sheet, holding it against a window;
3. if the text is too high or too far to the left, correct it with **Horizontal
   offset** and **Vertical offset** (in mm, negative values accepted).

The offsets move the grid without changing it. Once set, they apply to all
sheets.

### Table (« Tableau »)

A dense table — QR code, title, host, notes — for reviewing or archiving on
paper.

- **QR size** (« Taille du QR ») — a slider, from the most discreet to the most
  legible.
- **Page orientation** (« Orientation de la page ») — portrait or landscape. A
  table with many columns benefits from being laid down: the columns breathe
  instead of being cramped.
- **Margins** (« Marges ») — top and bottom, left and right, in millimeters.
  They used to be fixed: a wide table got clipped with no recourse.
- **Page header** (« En-tête de page ») — the collection name is printed at the
  top, with the print date if you ask for it. On a stack of paper, this is what
  tells you which collection it comes from.
- **Columns** (« Colonnes ») — No., QR, URL, Title, Tags, Note, Date. Tags and
  the note are only offered if the collection contains any.
- **Export table (ZIP)** (« Exporter le tableau (ZIP) ») — a self-contained
  folder: `table.json` (the model), `qr/*.png` (the QR codes as ready-to-use
  images) and `table.html` (the table, displayable as is). The selection and the
  checked columns apply, as they do for printing.

### Niimbot label (« Étiquette Niimbot »)

For direct printing on a D110, an M2 or an M3. See the next section.

### Label (misc.) (« Étiquette (divers) »)

A folder of print-ready images, **with no printer at all**. See "Exporting
without Niimbot".

## Printing on a Niimbot

### The format can be previewed without a printer

The **Label format** (« Format d'étiquette ») selector offers:

- **Niimbot D110** — 12 mm usable, 203 dpi;
- **Niimbot M2** — 48 mm usable, 300 dpi (576 px printhead);
- **Niimbot M3** — 72 mm usable, 300 dpi (851 px printhead).

The preview is composed **even without a connected printer**: dimensions,
module count and legibility are exact. That is what lets you judge a rendering,
or check that a URL fits, before buying the hardware.

Under the preview, a caption gives the profile used and the number of pixels per
module. Two pixels per module is the minimum: below that, a thermal printhead
merges the dots.

Once a printer is connected, the preview locks onto its real profile, and
printing **always** uses the hardware profile — never the preview's. You can
therefore explore the M2 format while plugged into a D110 with no risk of
printing at the wrong width.

### Connecting

1. **Brave blocks Web Bluetooth by default.** This is cause no. 1 of failures,
   and the application now flags it by itself: if the "Connect" (« Connecter »)
   button is grayed out with a message, here is the procedure.
   1. Open `brave://flags/#brave-web-bluetooth-api`
   2. Set **Web Bluetooth API** to **Enabled**
   3. **Restart Brave** — the flag is only read at startup, a simple page reload
      is not enough
   4. Reopen the application: the "Connect" button becomes active again

   Chrome and Edge do not have this constraint. Safari does not implement it at
   all.
2. Turn on the printer and put it in pairing mode.
3. "Niimbot label" (« Étiquette Niimbot ») tab → **Connect** → choose the
   device.
4. The model is read on connection, and the printhead width actually reported
   corrects the profile if it differs.

### Choosing your media

The **Supply** (« Consommable ») field offers the formats sold for the chosen
model — taken from the manufacturer, not guessed:

- **D110** (12 mm printhead) — 12 × 22, 12 × 30, 12 × 40, 12 × 75, 12 × 109,
  14 × 25, 14 × 28, 14 × 30, 14 × 40, 14 × 50, 15 × 30, 15 × 50 mm, and the
  continuous roll;
- **M2** (48.8 mm printhead) — 25 × 9.5, 36.5 × 9.5, 40 × 20, 40 × 40, 50 × 30,
  50 × 50, 50 × 70, 50 × 80, 30 × 70, 25 × 78, 35.25 × 50 mm, several round ones
  (20 × 20, 24 × 13, 28 × 14, 28 × 15, 31 × 31, 34 × 17, 50 × 50) and the
  continuous roll;
- **M3** (72 mm printhead) — 40 × 20, 50 × 30, 70 × 50, 60 × 100 mm, and the
  72 mm continuous roll.

A roll **wider than the printhead** remains selectable: the content takes the
printhead width and the rest of the label stays white. The application flags it
with "unprinted margin on the sides". Only rolls the printhead cannot reach —
the 25 mm ones on a D110 — are ruled out.

### Roll length

The profile only knows the **printhead width**. Without the roll length, the
composition stops at the end of its content — a short URL gives an 18 mm label —
and the printer then feeds to the next cut: everything left of the roll comes
out blank.

Fill in **Label length (mm)** (« Longueur d'étiquette (mm) ») so that the
composition fills the space: the text grows (never beyond legibility) and the
content spreads out. The field offers the common lengths for the chosen model,
and remains free — the manufacturer's catalog is not the reality of every roll.
The **Free** (« Libre ») button returns to the continuous roll, where the height
follows from the content.

**Layout** (« Disposition ») decides where the remaining space goes: *Centered*
(« Centré »), *Top* (« En haut »), or *Spread* (« Réparti ») (the QR code at the
top, the text at the bottom).

### Printing

- **Density** (« Densité »): 1 to 3 on a D110, 1 to 5 on an M2. 2 is a good
  starting point; a pale print is corrected by going up one notch.
- **Copies**: 1 to 20, for printing a single label.
- **Label content** (« Contenu de l'étiquette »): checkboxes that accumulate —
  link number, title, URL, host, collection date, and the time together with the
  date. The QR code always encodes the URL; the text displayed follows these
  choices. The number is there to find the row in the list when the label is too
  small to carry the URL.
- **Date and time** (« Date et heure »): on a 12 mm printhead,
  "15/09/2026 21:07" wraps cleanly onto two lines; the text size is reduced just
  enough for it to fit, never below 1.6 mm — below that, it would no longer be
  legible.
- **Orientation**: Normal (« Normale »), 90°, 180°, 270°. The preview shows the
  rotation, hence what will come out. On a real D110, **90° crops the text and
  270° does not**: prefer 270° until that defect is fixed.
- **Layout** (« Disposition »): see above.

Printing refuses a bitmap wider than the printhead rather than letting it be
clipped in silence.

### Batch printing

The **Batch printing** (« Imprimer en série ») box prints one label after the
other, without intervention:

- **Scope** (« Portée ») — *The whole collection* (« Toute la collection »), or
  *The checked selection* (« La sélection cochée ») in the list. The button
  always says what it will do ("Print the selection (3)" (« Imprimer la
  sélection (3) »)); an empty selection with "the checked selection" prints
  nothing and says so, rather than printing the whole collection.
- **Copies per link** (« Exemplaires par lien ») — 1 to 20. With 10 links and 2
  copies, 20 labels come out.
- The button becomes **Stop the series** (« Arrêter la série ») during printing:
  a run started by mistake stops after the current label, without cutting off
  the printer.
- A label that fails does not interrupt the run; the final report says how many
  came out and why the others failed.

## Exporting without Niimbot

### Image folder (the "Label (misc.)" (« Étiquette (divers) ») tab)

The shortest path to any label printer. Choose:

- **Label format** (« Format d'étiquette ») — Niimbot D110 / M2 / M3; Brother QL
  DK-11201, DK-11202, DK-11208, DK-11209, DK-11218, DK-11219, DK-22205,
  DK-22210; Dymo LabelWriter 54 × 32 and 54 × 101 mm; Zebra 2 and 4 × 6 inches;
  generic 50 × 30 and 70 × 40 mm; A4 sheet 3 × 8;
- **Printed text** (« Texte imprimé ») — title + URL, URL only, title only, host
  only, or nothing;
- **Margin** (« Marge »), **text size** (« taille du texte »), **cut marks**
  (« traits de coupe »);
- **Below the QR** (« Sous le QR ») — the title, then the collection date, with
  the time if you ask for it. The "Title" (« Titre ») checkbox adds the title
  even when "Printed text" does not carry it, and without duplicating it if it
  is already there. These checkboxes are specific to this tab: a date checked
  for the sheet is not printed here, and vice versa.

The **QR width** (« Largeur du QR ») slider is not free: its bounds are computed
for the chosen layout. Below them, a printed module would no longer be legible
(0.4 mm on paper, 2 pixels on a thermal printhead); above them, the QR code
would push the text off the label. The line under the slider gives the resulting
size, the actual size of a module, the permitted range and the number of text
lines available. If a URL is too dense for the format — a long link on a 12 mm
label — the message names the offending link: shorten it, or take a bigger
label.

The preview updates on every change. The export button states the scope and the
number — "Export 12 images (ZIP)" (« Exporter les 12 images (ZIP) »), or "Export
selection (3)" (« Exporter la sélection (3) ») when only a few links are checked
— then produces a self-contained archive:

```
etiquettes/1-un-article.png     one PNG per link, at the format's resolution
liens.csv                       the URL ↔ image mapping
planche.html                    to open in a browser, then Print
export.json                     the settings used, and the original URL
```

Open `planche.html` and print: it is the most direct path to paper, with no
driver or manufacturer application.

### `.xlsx` workbook with the QR codes embedded

The **"Spreadsheet + QR"** (« Tableur + QR ») button produces a real workbook in
which each row carries its QR code **and** its clickable URL. A CSV cannot carry
an image: that is the whole point of this export.

When a link is shortened, the workbook follows the printed target and adds the
original URL at the end of the table.

### Table folder (ZIP)

The **"Export table (ZIP)"** (« Exporter le tableau (ZIP) ») button sits just
before the preview, visible in the Table tab only, next to "Print" (« Imprimer »).
It produces a self-contained folder that reflects the selection and the checked
columns:

| File | Contents |
|---|---|
| `table.json` | the model: columns, rows, and for each QR code the encoded URL, the error correction and the border |
| `qr/<id>.png` | the QR code of each row, at a whole-number scale — vectorizable without loss |
| `table.html` | the rendered table, to open in a browser |

It is the only export that follows the table's formatting: the collection
exports (CSV, Markdown, Archive) carry the data, not the layout. PNG is
deliberately preferred over SVG: it opens everywhere, from the web page to the
word processor, without requiring the recipient to be able to render vector
graphics.

### CSV, Markdown, JSON archive

- **CSV** (`;`, UTF-8 BOM, RFC 4180 compliant) — the original URL as the main
  column, the short link in a "Short URL" (« URL courte ») column if it exists;
- **Markdown** — table or bulleted list, with clickable titles;
- **JSON archive** — the whole model, re-importable via "Import" (« Importer »).

## Troubleshooting

**A red banner mentions an outdated stylesheet.** The browser has kept the old
`style.css`: the preview then does not reflect what will be printed. Reload the
extension (↻ in `brave://extensions`) then reopen the page. The banner only
appears in that specific case.

**The sheet is shifted.** First check that printing is at 100% ("actual size"
(« taille réelle »)), then set the horizontal and vertical offsets. An offset
that grows from row to row points to a wrong pitch, not a wrong margin: choose
the exact reference rather than compensating.

**The QR code is illegible.** The line under the slider gives the millimeters
per module and the medium's minimum. If the URL is too dense for the label, the
slider cannot make it printable: shorten the URL (the shortener is made for
that), reduce the printed text, or take a wider label. Reminder: 0.4 mm per
module on paper, 2 pixels per module on a thermal printhead.

**"Web Bluetooth API globally disabled".** The Brave flag is off. Open
`brave://flags/#brave-web-bluetooth-api`, enable **Web Bluetooth API**, then
**restart Brave** (a page reload is not enough). The application detects this
case at startup and displays the procedure without any need to click.

**The printer does not appear.** On Brave, the Web Bluetooth flag is the first
thing to check. Move the printer away from other Bluetooth devices, and wake it
before clicking "Connect" (« Connecter »).

**The print is pale.** Raise the density by one notch. The thermal printhead may
also be dirty: clean it with a cotton swab soaked in isopropyl alcohol, with the
printer turned off.

**Rotated text is cropped.** At orientation 90°, the text comes out cropped on a
real D110; at 270° it does not. The two rotation directions therefore do not
behave symmetrically: use 270° until the defect is fixed.

**A label comes out rotated by 90°.** The D110 profile carries a `transposed`
boolean based on the convention of the reference implementations; it was not
explicitly recorded during the test on a real D110. Report it: that boolean is
what needs to be flipped.

## Known limitations

- **Niimbot printing has been validated on a real Niimbot D110.** A complete
  label came out, and the printer identifies itself correctly on connection. Two
  reservations: **text rotated by 90° is cropped, whereas at 270° it is not**, and
  the rendering remains sensitive to the chosen density and text size. The other
  models in the catalogue (M2, M3) have not been exercised on hardware.
- **Safari** does not implement Web Bluetooth. The Safari extension works for
  collecting, not for direct printing: use the image folder.
- **Avery and Niimbot are trademarks of their respective owners.** The
  dimensions reproduced are those published for those references; this project
  is neither affiliated with nor endorsed by those manufacturers.
- **Shortening depends on a third party.** TinyURL, is.gd, v.gd and spoo.me are
  external services: if they shut down, a link already printed stops working.
  The original URL always remains in your collection and in your exports.
