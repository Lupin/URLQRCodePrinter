# URLQRCodePrinter

**English** · [Français](README.fr.md) · [User guide](docs/guide.md)

Collect URLs from the browser (right-click or button), keep them in a local
database, then print them as QR labels — table, CSV or Markdown export, or send
them straight to a Niimbot printer.

## Where the project stands

| Step | Status |
|---|---|
| Core business logic (links, QR, labels, storage, exports) | done, tested |
| Niimbot protocol (frames, D110 / M2 / M3 profiles) | done, tested |
| Web Bluetooth transport + D110 / M2 / M3 print session | done, tested, **printed on a real D110** |
| Brave / Chrome extension (right-click, popup, clickable links) | done, verified in Brave |
| Standalone web app (list, exports, layouts) | done, verified in Brave |
| Optional URL shortening (TinyURL, is.gd, v.gd, spoo.me) | done, verified in Brave |
| Avery A4 and Letter sheets, print calibration | done, geometry checked against published dimensions |
| Niimbot label preview with no printer connected | done, verified in Brave |
| Safari extension — multiplatform Xcode project | generated, **compiles for macOS** |
| Safari extension — `app.html` page verified in Safari | done, `npm run verify:safari` (37 checks) |
| Safari extension — loading of the extension by Safari | one-time manual setting, see "Safari" |
| Native Swift core (protocol, session, CoreBluetooth) | done, tested |
| iOS app that uses that core | to do |

**723 tests, all green** — 619 in JavaScript and 104 in Swift — including:

- **byte-for-byte** validation of the Niimbot frames against the documented
  records, **in both languages**: two independent implementations that
  confirm each other;
- the real execution of the web app's startup;
- verification of the PNG icons by decompression;
- URL shortening, simulated network: the services' real failures (error text
  returned with a 200 status, JSON response, link refused) are reproduced so
  they can be handled, not guessed at;
- a **layout matrix** over the thirteen label layouts and their edge cases —
  no overlap, no label off the sheet, no cumulative drift — paired with a
  measurement of the real rendering in Brave;
- the **inverse calculation** "fill the sheet": the requested grid is exactly
  the one that comes out, over more than 400 combinations of columns, rows,
  margins and gaps, for A4 as well as for Letter;
- the **QR bounds** per print type: the slider value is computed before
  rendering, and the text wrapping that follows from it is verified line by
  line.

**The app is verified in a real browser**: `npm run verify:brave` launches
Brave on an isolated profile, collects a link, shortens it, exports the CSV and
the label archive, then checks the files actually written to disk (ZIP
signature, `unzip -t`, CSV contents). 131 checks, including the rendering of
clickable links in the app *and* in the extension popup, the grid actually
computed for four Avery references, and the label preview composed with no
printer connected.

**The extension page is verified in Safari**: `npm run verify:safari` drives
the real Safari through WebDriver, loads `app.html`, and compares its outputs
with the core run outside the browser. 37 checks — the CSV exported by Safari
is **identical byte for byte** to the core's, and the QR drawn is **identical
module for module** (31 × 31, 436 modules, zero gap). The full record, what
could not be verified and why: `docs/safari-extension-verification.md`.

What remains to be verified: the loading of the extension by Safari itself
(manual step, see below). Printing, for its part, came out on a **real Niimbot
D110** — see "Acknowledged uncertainties".

**The iOS target of the Xcode project does not compile in a restricted
environment.** Xcode needs to write to `~/Library/Developer/CoreSimulator` to
launch `IBAgent-iOS`, and clang to a system module cache. Both fail without
full access. The generated project is correct: the macOS target, which needs no
simulator, compiles. The Swift core itself compiles and is tested without
reservation (`npm run test:swift`).

The `docs/archive/qr-niimbot-printer/` folder is an earlier prototype, kept as
a record of the design. **Its Bluetooth code cannot work**: the UUIDs are
example values and the commands sent are ESC/POS protocol, not Niimbot. It is
replaced by `src/` and `native/niimbot-kit/`.

## Architecture

A single JavaScript core, with no DOM dependency outside canvas rendering,
consumed by all the surfaces:

```
src/core/
  link.js              link model, normalization, QR target, safe href
  capture.js           capture decision from a context click
  qr.js                QR encoding → matrix → 1 bit/pixel bitmap, PNG
  label.js             label geometry, text wrapping, legibility
  raster.js            ImageData → monochrome bitmap for the thermal head
  sheet.js             print sheets: dimensions, pagination, calibration
  store.js             IndexedDB / chrome.storage / memory, same interface
  exporters.js         CSV (RFC 4180), Markdown, JSON
  spreadsheet.js       .xlsx workbook with embedded QR codes
  label-export.js      label formats, HTML sheet, ZIP archive
  table-export.js      table folder: JSON model, QR PNG, HTML page
  shorten.js           URL shortening: services, failures, pacing
  settings.js          remembered preferences (service, QR target)
  i18n.js              fr → en interface messages, language resolution
  locales/en.js        English translation table
  png.js               PNG encoder (CompressionStream), CRC and deflate
  zip.js               uncompressed ZIP writing
  xlsx.js              OOXML writing, images anchored to cells
  download.js          file saving and clipboard
  printer/
    packet.js          Niimbot frames, checksum, stream decoder
    profiles.js        printer profiles (head width, task, density)
    transport.js       Web Bluetooth: filtering, batching, notifications
    printer.js         print session, sequence and acknowledgements

src/extension-src/     MV3 extension (Brave, Chrome, Edge, Safari)
src/web/               standalone app
scripts/build.mjs      assembles dist/extension and dist/web
scripts/serve.mjs      static development server
scripts/make-icons.mjs generates the PNG icons (homegrown encoder, no dependency)
scripts/verify-brave.mjs  full run in Brave, on an isolated profile
scripts/verify-safari.mjs run of the extension page in the real Safari
scripts/webdriver-safari.mjs  minimal WebDriver client, no dependency
scripts/package-safari.mjs  produces the Safari Xcode project
scripts/test-swift.mjs runs the native core tests
native/safari/         generated Xcode project (macOS + iOS)
native/niimbot-kit/    Swift core: protocol, session, CoreBluetooth
```

`src/extension-src/` does **not** contain a `manifest.json`: the manifest is a
template (`manifest.template.json`) that the build turns into two variants.
That folder therefore cannot be loaded as is by a browser, which avoids
confusion with `dist/extension`.

The core depends only on `uqr` (pure ESM, no dependency). No bundler:
everything is in native ES modules.

### Why a second core, in Swift

No iOS browser exposes Web Bluetooth — Apple imposes WebKit, which does not
implement it. Printing from an iPhone therefore necessarily goes through
CoreBluetooth, and thus through native code. `native/niimbot-kit/` is that
core: the same protocol, the same print sequence, the same test vectors as the
JavaScript implementation. It is independent of any interface, so it can be
reused by an iOS app as well as by a macOS companion.

## Usage

```bash
npm run build
npm run serve      # then open http://127.0.0.1:4173/
```

`localhost` is mandatory: Web Bluetooth requires a secure context, and the
`file://` protocol refuses to load ES modules.

For the extension in Brave, Chrome or Edge:

```bash
npm run open:extension        # assembles and opens the folder in the Finder
```

Then `brave://extensions` (or `chrome://extensions`) → **Developer mode** →
drag the `extension` folder from the Finder, or click "Load unpacked" and
select `dist/extension`.

**To print from Brave**, Web Bluetooth must be enabled:
`brave://flags#brave-web-bluetooth-api`. Chrome and Edge do not have this
constraint. Safari does not implement it at all.

> None of these browsers accepts a one-click local installation: a `.crx` file
> downloaded outside the Chrome Web Store is refused. Only a store
> publication would give that convenience.

### Safari

```bash
npm run install:safari        # generates, compiles and runs the macOS app
npm run verify:safari         # verifies the extension page in Safari
```

This is the most direct route: a Safari extension **is** a macOS application,
and running it is the only way to register it. The script chains everything,
then displays the two settings that remain to be done once.

**What remains to be done once, by hand, in Safari**, in this order:

1. Settings → **Advanced** → "Show Developer menu";
2. **Developer** menu → "Allow unsigned extensions";
3. Settings → **Extensions** → check "URLQRCodePrinter".

These settings cannot be automated, and Safari macOS is the only browser in the
project in that situation: `safaridriver` **does not know** any extension
installation command, and the extension state cannot be read from a script. The
full record, with what was observed and what cannot be, is in
`docs/safari-extension-verification.md`.

> `verify:safari` also needs Safari to accept WebDriver:
> Developer menu → "Allow Remote Automation", or
> `sudo safaridriver --enable` — which asks for the administrator password,
> so once, by hand.

To go step by step:

```bash
npm run package:safari        # assembles, generates the icons, converts, aligns
npm run sync:safari           # copies only the appex resources
```

The project appears in `native/safari/`. Open it in Xcode and run the
**URLQRCodePrinter (macOS)** scheme.

`native/safari/…/Resources/` is versioned because the Xcode project references
it, but it is only a **copy** of `dist/extension-safari`: the same one that
Apple's converter produces with `--copy-resources`. `npm run package:safari`
remakes it by regenerating the whole project; `npm run sync:safari` only does
the copy, without Xcode. Without one of the two, Xcode compiles an `app.js`
older than `src/`.

The script also does two non-obvious things.

**It raises the deployment targets** of the generated project: Apple's
converter produces iOS 15.0 / macOS 10.14 targets, whereas our manifest
declares `strict_min_version: "16.4"`.

**It fixes the container app's window.** Apple's template contains two silent
dead ends: when Safari refuses to open its settings — which happens with an
unsigned build — the "Quit and Open Safari Extensions Preferences…" button
leaves its closure **without doing anything**. No settings, no quit, no
message. `scripts/safari-container-app.mjs` replaces those methods with
versions that explain what to do, and adds a "Quit" button so you never get
stuck.

## The extension is assembled into single files

`npm run build` produces two entry points with **no** `import` at all:

```
dist/extension/
  background.js    ← assembled service worker
  popup.js         ← assembled popup
  popup.html  popup.css  manifest.json  icons/
```

This is not an optimization, it is a necessity. **Safari does not resolve
module imports located in a subfolder of an extension**: it answers

```
Unable to find "core/store.js" in the extension's resources. It is an invalid path.
```

even though the file really is in the bundle — verified. Two Apple discussion
threads document this ES modules defect in Safari extensions, and several
reports of ports from Chrome confirm it.

Rather than flattening the tree to work around the symptom, we remove the
cause: `scripts/bundle.mjs` concatenates the modules in dependency order. The
result works identically on Chrome, Brave and Safari, and `"type": "module"`
can be removed from the manifest — which also makes Apple's converter warning
disappear.

The assembler **refuses to produce output** if two modules declare the same
top-level name: a collision would be masked silently, and the produced file
would not behave like the sources. It is not minified, each module keeps its
header, and the extension therefore remains readable in the inspector.

## Two manifest variants

`npm run build` produces two folders:

| Folder | For | Particularity |
|---|---|---|
| `dist/extension` | Brave, Chrome, Edge | without `browser_specific_settings` |
| `dist/extension-safari` | Safari | keeps that key, which Apple's converter needs |

`browser_specific_settings` is a Firefox/Safari key **unknown to Chrome and
Brave**. They display it as a manifest warning, highlighting the file with its
line numbers — enough to make you believe in a blocking error while the
extension works. The build therefore removes it from the Chromium variant.

**Always load a folder from `dist/`, never `src/extension`.** The source folder
does not contain `core/`, which is only copied there at build time: the service
worker would fail to load.

Safari does not expose `chrome` but `browser`, and **does not provide
`contextMenus` on iOS**. The extension detects both: the context menu is only
wired up if it exists, and the tab URL is read by injection when `tab.url` is
missing.

## Two numbers not to be confused

- **Head width is not label width.** A D110 accepts 15 mm rolls but its head is
  only **96 px = 12 mm** at 203 dpi. Sending 120 columns causes no error: the
  printer crops in silence.
- **The print dialog depends on the model.** A D110 expects a `SetPageSize` of
  4 bytes; the "v4" format (13 bytes) makes it return a `DataError` error
  instead of printing.

## What is printable is computed in advance, not reported afterwards

A QR code has two physical limits, and they depend on the **print type**:

| Medium | Constraint | On a D110 (203 dpi) | On paper |
|---|---|---|---|
| Thermal head | 2 px per module, otherwise the head fuses the dots | 0.25 mm per module | — |
| Paper (laser, inkjet) | 0.4 mm per module, otherwise the module is no longer resolved and the camera does not focus | — | 0.4 mm |

`qrRatioBounds` (in `core/sheet.js`) crosses these constraints with the label
geometry to produce the **allowed** range of the QR width:

- **lower bound**: `qrModules × minModuleMm` — a smaller QR would be illegible
  once printed, and the matrix density depends on the URL length: on an L7160, a
  short URL leaves 30 to 86 % adjustable, a 49-module URL requires at least
  58 %;
- **upper bound**: the QR is square, it must fit within the width **and** leave
  at least one line of text below it.

**A single presentation, six values.** Columns, rows, left/right margin,
top/bottom margin, gap between columns, gap between rows: the label size
follows from them, and a sentence under the fields announces it with the real
dimensions — and recalls the offset when it is active.

There were two modes before this one, and both were incomprehensible for a
different reason. "Layout dimensions" / "Fill the sheet" did not say which of
the two quantities commanded the other. Then "Reference dimensions" **hid the
fields**: nothing said how the sheet was filled. The fields are now always
visible, and changing sheet rewrites their six values (`presetToGrid`).

This conversion deserves to be understood: a commercial sheet has a left margin
different from its right margin, which a grid with symmetric margins cannot
reproduce. `presetToGrid` therefore distributes the remainder evenly, so that
the **label size and pitch are exact** — the columns land opposite their cells
— at the cost of a constant offset of a few tenths of a millimeter, which the
offset fields make up for. A pitch error, by contrast, would accumulate from
one column to the next. The property test verifies this for the thirteen
layouts in the catalog.

The slider receives these bounds: **it can no longer request an impossible
QR**, instead of displaying a warning once the faulty setting has been chosen.
When the two bounds cross — 57 modules on a 12 mm head require 14.3 mm — the
message says so, names the densest link, and offers the only real way out:
shorten the URL, which the shortener does.

The text follows the same logic: it is broken into lines by the script
(`sheetCellLines`), capped at the number of lines that actually fit, and
truncated with an ellipsis if it is too long. Font size and line height are set
inline from the same calculation as the wrapping, so the height occupied is
exactly the height reserved — a test in Brave compares the two. Previously, the
text was left to the browser's line wrapping and could overflow the label
without anything signaling it.

## What will be printed is written, not to be guessed

Two buttons, "All" and "None", were stuck to the search field, and they
actually check the links to be printed. Worse: **both led to the same result**,
since an empty selection means "the whole collection" for printing. Enough to
understand nothing, rightly so.

Three fixes:

1. **the two groups are separated** — search on one side, then a group titled
   "Selection" with "Check all" and "Uncheck all";
2. **the scope is written under the buttons**: "No link checked: printing will
   cover the whole collection (31)." or "3 links checked out of 31.";
3. **the print button announces what it prints**: "Print the 31 links" or
   "Print the selection (3)". The least guessable rule in the app — no
   selection = all — becomes visible without clicking.

The label follows every checked box, not just the group buttons: the
verification in Brave showed precisely that it stayed frozen on an earlier
state when a row was checked by hand.

## The workbook: one QR per row

Two real defects in the `.xlsx` export, found by examining a file actually
produced:

**The anchoring was not Excel's.** I was emitting a `oneCellAnchor` — legal,
and read correctly by two independent parsers (mine and `openpyxl`) — but one
that Excel never writes. Excel writes `twoCellAnchor` with `editAs="oneCell"`
and the `from` **and** `to` markers for each inserted image. We now write that
form, with `to` on the next cell: the image is bound to a single cell, the one
holding its QR.

**The table did not fit on one page in width.** Seven columns make about
309 mm for A4 portrait (210 mm): when printing, Excel spread the columns over
several sheets, and a QR code could come out on a different page than its URL —
exactly "not one QR per row". The sheet now carries `fitToPage` +
`fitToWidth="1"` and landscape orientation, which brings the table back to one
page width.

**And the image fits in its cell**: a QR of 96 px (25.4 mm, one inch) instead
of 128, a column of 19 units (≈ 138 px), a row of 76 points. An image wider
than its column overflows onto the neighbor, and a 100-point row pushed the
table off the page.

> What could **not** be verified here: the visual rendering of the workbook.
> Quick Look stacks floating images in the corner of the sheet whatever the
> markup — I observed it by changing the anchoring form (identical rendering)
> and by comparing with a workbook produced by `openpyxl` (no image displayed).
> Excel, for its part, opens the file and does see the ten images, but its
> scripting API refuses the geometry properties. The tests therefore verify
> what is measurable: one anchor per row, `editAs="oneCell"`, consecutive
> markers, sufficient column width and row height, adjusted page setup.

## Brave and Web Bluetooth: detect, do not hope

Brave exposes `navigator.bluetooth` **and** refuses to use it when its flag is
off. A check that merely looks at whether the object exists therefore concludes
"all is well": the "Connect" button stays active, and the failure only arrives
after the click, in English — `NotFoundError: Web Bluetooth API globally
disabled.` That is exactly what was happening.

`navigator.bluetooth.getAvailability()` answers `false` in that case, without
asking the user anything. `probeWebBluetooth` (in
`core/printer/transport.js`) therefore queries it at startup: the button is
disabled, and the procedure is displayed **before** the click, in French. The
`false` answer covers two causes that must not be confused in the message: the
Brave flag being off, and the machine's Bluetooth being off.

| Situation | What the app says |
|---|---|
| `navigator.bluetooth` absent | "Web Bluetooth is not available in this browser" + Safari does not have it |
| API present, `getAvailability()` false | "disabled in this browser — or this computer's Bluetooth is off" + procedure |
| Insecure context | "requires a secure context" + use https or localhost |
| Failure after the click | the English message is translated (`explainBluetoothFailure`) |

The procedure is written once (`BRAVE_BLUETOOTH_HINT`), and the flag name comes
from Brave's sources (`browser/about_flags.cc`): `brave-web-bluetooth-api`, to
be enabled and then the browser **restarted**.

## Import reads back everything the export produces

Import accepted only **one** of the forms the app knows how to write: the JSON
archive from the "Archive" button. The exported CSV, the `.zip` label folder
and the `export.json` it contains were refused. In other words, you could not
re-import what you had just exported — which made the feature
incomprehensible, and that was the main misunderstanding.

`core/import.js` now accepts the three forms, relying on what we write:

| File provided | What is read back |
|---|---|
| `liens-qr-….json` ("Archive" button) | the whole model: URL, title, tags, note, collection date, short URL, identifier |
| `etiquettes-qr-….zip` (label folder) | the links from its `export.json` — the original URL is preferred over the printed target, which stays as the short URL |
| `export.json` extracted by hand | the same |
| `….csv` ("CSV" button) | URL, title, tags, note, date — columns located by their header, so a spreadsheet that reorders them remains importable |

The ZIP is read back by `readStoredZip`: our archives are written without
compression (`method: 0`), so a reader of local headers is enough, and a
compressed entry is reported rather than rendered wrongly.

Three rules, decided so that import never does damage:

1. **it adds, it does not replace** — the current collection is kept;
2. **a duplicate is ignored**, not merged: re-importing the same archive twice
   creates nothing, and the message distinguishes "already present" from
   "unreadable" rather than announcing a failure;
3. **an unreadable row does not fail the rest**: it is counted.

A test safeguard accompanies this: `test/web.test.js` verifies that **every
name imported by `app.js` is indeed exported by the target module**. It was
born from a real error — `parseImportFile` called without having been imported
— that no startup test could see, since the function body is never executed at
load time.

## Dating a label: an option, never a fragment

The collection date can be printed under the QR code — `None`, `Collection
date`, `Collection date and time`. None by default: every line under the QR is
paid for in available space, and a 12 mm label has none to spare. The choice
applies to the four output formats: sheet, table (a "Date" column), Niimbot
label, and image archive.

**A date is complete or absent.** That is the rule, and it comes from a defect
observed while verifying: on a 12 mm label, the line cap truncated the date to
"15/09/" — the year lost, so a **false** date, which is worse than no date.
From now on:

- the date's lines are reserved **before** those of the main text, and never
  cut by the cap;
- beyond two lines (`DATE_MAX_LINES`), the date is abandoned entirely rather
  than printed in part;
- on the sheet, where the date fits on a single line, it is discarded if the
  column is too narrow, and the message says so;
- on the Niimbot label, `drawLabel` does not wrap this line: it is only
  requested from the geometry (`extraLines`) if it fits, which avoids a
  horizontal overflow;
- the archive records `datesOmitted`, and the previews display the reason —
  without which the option would seem to have no effect.

The QR bounds calculation counts the date as one more line: enabling the date
lowers the slider's upper bound (86 % → 79 % on an L7160), because the QR must
leave room for two lines instead of one.

## An export must contain nothing that cannot be entered

Project rule, born from two fair remarks: the Markdown carried a title chosen
by the program ("Mes liens QR"), and a "Tags" column that no interface allowed
you to fill in. An export that carries empty columns, or a title that is not
the user's, is a false export.

What has been made consistent:

| Field | Input | Outputs |
|---|---|---|
| URL | "Add" field, extension | all |
| Title | row editor (✎) | CSV, Markdown, workbook, table folder, label file names |
| Tags | row editor (✎), commas | CSV, Markdown, workbook, table folder |
| Note | row editor (✎) | CSV, Markdown, workbook, printed table, table folder |
| Collection name | "Collection name" field | Markdown title, HTML sheet title, exported file names, HTML table title |

Two choices deserve to be known:

**Optional columns appear only if they serve a purpose.** "Note" (in the
Markdown and the workbook), "Short URL" (CSV) and "Original URL" (in the
exports of a shortened collection) are only added if at least one link has the
corresponding value. Without that, a seven-column table with one of them empty
over its whole height, and the existing tests would have had to change on every
addition.

**In the workbook, the note is placed before the QR code column**, whose index
is therefore recomputed (`spreadsheetLayout`): an image anchored to the wrong
column would simply be invisible. The tags there are written without "#", as in
the CSV: in a spreadsheet, the hash sign hinders filtering.

Tags are not printed on labels: they classify the collection, and the labels
carry the QR and the chosen text. They do appear, however, in all data exports.

## Label sheets

The layouts are arranged in two families: **generic grids**, to be set up
yourself, and **commercial references** whose dimensions are reproduced as the
manufacturers publish them — Avery L7160, L7159, L7162, L7163, Zweckform 3475
on A4, and 5160 / 5162 / 5163 / 6871 on Letter.

Two design points deserve to be known before touching this code.

**Margins locate the corner of the first label**, they are not symmetric. On an
L7160 there are 8.6 mm on the left and 5.1 mm on the right; a model with
symmetric margins would place only two columns out of three. `marginXMm` and
`marginYMm` are therefore offsets from the left edge and the top edge, and the
right margin is what remains.

**Sheet geometry lives outside `@media print`.** The on-screen preview and the
printed sheet share the same rules, hence the same layout. That has not always
been the case: as long as `.print-cell` was positioned only in the print block,
the preview stacked the labels into a single column, the text of one label
overflowed onto its neighbor, and the QR width slider had no effect — the SVG
kept its intrinsic size in a box that nobody constrained. The lesson is in the
tests: `test/sheet-matrix.test.js` covers pure geometry on all formats, and
`npm run verify:brave` measures the DOM actually computed by the browser
(distinct columns, no overlap, QR contained in its box, effect of the slider).
A geometry test alone would never have seen this defect.

**The number of columns can become an instruction.** By default, the geometry
deduces the grid from the dimensions; that is what a commercial sheet needs. In
"fill the sheet" mode, the user instead chooses columns, rows, overall margin
and gap, and the label size follows from them (`fitGrid`). These two directions
of calculation cannot coexist under the same names: the presets therefore carry
`declaredColumns` / `declaredRows`, which `computeSheet` **does not read**.
Naming them `columns` / `rows` would have been a trap — `computeSheet` would
have seen an explicit grid to honor, and the test that confronts the geometry
with the announced label count would have become circular.
`test/sheet-matrix.test.js` explicitly verifies that this trap remains defused.

**Built resources carry a fingerprint of their content.** Without it, a browser
can serve a `style.css` from the previous build while the HTML and scripts are
up to date: the new settings appear, but the layout remains the old one. This
happened, and the diagnosis took a long time — the sheet displayed in a single
column, QR width slider without effect, while the fix was indeed on disk. Two
safeguards: the URL carries a fingerprint (`style.css?v=…`), and the app
**detects** a stale stylesheet by reading a property that only the stylesheet
defines, then announces it in a persistent banner —
`test/web-stale-css.test.js` covers both branches.

**Calibration remains necessary.** No manufacturer dimension accounts for the
feed of a given printer: the "Horizontal / vertical offset" fields move the
whole grid, without modifying it. And the paper size is set dynamically
(`@page`), without which a Letter sheet would go out on A4, hence scaled down
and offset.

## Shortening URLs, and opening the collected links

Two features that answer each other, around the same question: which address
ends up on the label?

**Opening a link from the list.** The title and URL of each row of the
collection are hyperlinks (`target="_blank"`, `rel="noopener noreferrer"`), in
the app as well as in the extension popup. You can therefore check a collected
link without looking it up by hand. The `href` attribute never receives
anything but an http(s) URL: the list content can come from an import or a web
page, and a `javascript:` has no business there.

**Shortening, optional.** The "Shorten" button sends the targeted links — the
selection, or the whole collection if nothing is checked — to a third-party
service, and stores the result next to the original URL.

The "Service" field does not ask you to arbitrate between four brands: its
label says what each service changes for ordinary use, and **TinyURL —
recommended** is offered from the start. Anyone who just wants a shorter link
clicks "Shorten" without touching the setting.

| Service | Displayed label | API key | Note |
|---|---|---|---|
| TinyURL | TinyURL — recommended | none | default; HTTPS, durable links |
| is.gd | is.gd — no statistics | none | volunteer service, regularly unavailable |
| v.gd | v.gd — warning before redirect | none | same infrastructure as is.gd, with a warning page |
| spoo.me | spoo.me — click statistics | none | answers over HTTP, brought back to HTTPS |

None of these services requires an additional host permission: their response
carries a permissive CORS header. That is deliberate — a tool that reads the
URLs of all your tabs should not ask for more permissions than necessary.

Three safeguards, because a printed link commits you over time:

1. **Nothing is automatic.** No service is contacted at load time, nor at
   collection time: only on a click, and the batch is cancellable.
2. **The original URL is never replaced.** The short URL lives in its own
   field; the collected URL remains the source of truth, and a "Remove" button
   clears all short URLs at once.
3. **The choice is made at print time.** The "The QR code points to" selector
   applies to all printed outputs — preview, sheet, table, labels, image ZIP,
   table folder, Niimbot print. The *data* exports (CSV, JSON) keep the
   original URL and add the short URL in a "Short URL" column; the `.xlsx`
   workbook follows the printed target and adds the original URL, and the table
   model keeps the collected address in `sourceUrl`. No output loses an
   address.

Shortening has a concrete benefit on a 12 mm label: fewer characters give a
smaller matrix, hence a more legible QR that can be printed smaller. The
trade-off is real and displayed in the interface: a shortened link depends on
the service surviving. For durable use, keep the "Collected URL" target.

## Development

```bash
npm install
npm test           # JavaScript core and web surfaces
npm run test:swift # native NiimbotKit core
npm run test:all   # both

npm run verify:brave  # full run in Brave, on an isolated profile
npm run verify:safari # run of the extension page in the real Safari
```

`verify:brave` requires Brave and network access (shortening queries TinyURL).
It works in `.verify-brave/`, redirects downloads so as never to touch your
Downloads, runs off-screen and deletes everything on exit.

`verify:safari` requires Safari and `safaridriver`. There is no isolated profile
for Safari: the script drives the real Safari, which is why it modifies no
setting, intercepts exports instead of saving them, and closes its windows on
exit. It says at the end what it could **not** verify.

`npm test` first builds `dist/` (the `pretest` script), because several tests
bear on the assembled artifact. Running `node --test` directly without having
built fails with an explicit message.

### Environment

- **Local npm cache.** Some constrained environments cannot write to `~/.npm`.
  A local `.npmrc` — not tracked by git — can then bring the cache back into
  the project (`.npm-cache/`). If your environment already exports
  `npm_config_cache`, it takes priority over `.npmrc` — neutralize it:
  `env -u npm_config_cache npm install`.
- **Xcode.** `xcode-select` points to the Command Line Tools. The Xcode tools
  remain usable without `sudo` by prefixing the commands:
  `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun …`

## Reference documents

- [docs/guide.md](docs/guide.md) — the complete path, from collection to
  printing: shortening, Avery sheets and their calibration, offline Niimbot
  preview, exports without a printer, troubleshooting.
- [docs/protocole-niimbot-ble.fr.md](docs/protocole-niimbot-ble.fr.md) —
  Niimbot BLE protocol: UUIDs, frame format, print sequences, Web Bluetooth and
  CoreBluetooth constraints, and the points still to be verified on hardware.
- [docs/note-capacites-capture-url-safari-brave.md](docs/note-capacites-capture-url-safari-brave.md)
  — capability matrix of the browser extensions on Safari macOS, Safari iOS and
  Brave.
- [docs/safari-extension-verification.md](docs/safari-extension-verification.md)
  — what was verified in the real Safari, and what cannot be.
- [docs/README.md](docs/README.md) — index of all the documentation.

## Acknowledged uncertainties

### A defect fixed in the native composer

Two tests in `LabelComposerTests` were failing, and the analysis showed that
they did not stem from the same cause:

- **A real defect, fixed.** Enabling the title did not change the height of the
  rendering: the title was drawn *on top of* the first URL line, and the last
  URL line went off the bottom of the image — cropped in silence. The geometry
  now reserves the title line (`reservedLines`), and the line cap applies to
  the total, title included.
- **A false test.** `testTopRowsContainTheQrCode` looked for ink in the first
  ten lines. That was impossible by construction: the two modules of white that
  surround the QR — its quiet zone, without which no reader latches on — occupy
  exactly that band. The test now verifies the position of the first inked
  pixel, `margin + 2 × scale`, which is more precise than what it verified
  before.

This composer serves the Swift core, not the Brave / web path, which composes
its labels in JavaScript.

### What was measured on a real D110

A complete label came out of a **real Niimbot D110**. Three findings:

- the printer **identifies itself correctly on connection**: the `modelId` read
  is indeed that of a D110;
- the printed content is correct **for the chosen density and text size** — those
  two settings remain the ones that govern legibility;
- **rotated text was cropped in one direction and not in the other.** The defect
  came from the composition, not the protocol: the title was counted twice in the
  reserved thickness, and each direction anchored the text on a different side.
  The block is now **centred in its band**, in both directions, and three tests
  check it against the positions actually drawn.

### What cannot be verified here

These points cannot be settled without hardware or a device:

- **Matrix orientation.** The D110 profile carries `transposed: true`, based on
  the convention of the reference implementations. It was not explicitly recorded
  during the real test. If a label comes out rotated by 90°, it is this boolean
  that must be flipped.
- **Batching of Bluetooth writes.** The 240-byte groups were validated on B1
  and M2-H. A complete label came out on D110, which exercises that path, but the
  group size was not instrumented on that model: the limit remains adjustable.
- **"D110A" does not exist in any source** — neither the Niimbot wiki, nor the
  manufacturer API, nor the libraries. The real `modelId` is read at connection
  time and logged, and model identification is correct on the D110 that was
  exercised; a "D110A" unit would be settled by that same reading.
- **`contextMenus` on Safari iOS.** MDN announces it as unsupported, WebKit's
  source code suggests the opposite. The extension no longer depends on the
  answer: the menu is only wired up if it exists, and everything remains
  accessible from the toolbar popup. The question is therefore no longer
  blocking, only informative.
- **iOS compilation.** `IBAgent-iOS` must write to
  `~/Library/Developer/CoreSimulator` and clang to a system module cache. Both
  fail without full access. To be re-run on a machine without restriction:
  `xcodebuild -scheme "URLQRCodePrinter (iOS)"`.

## License

MIT — see [LICENSE](LICENSE). The project can be used, modified and
redistributed, including commercially, provided the copyright notice is kept.

## Contributing

The code, comments, error messages and commits are in French; the documentation
exists in French and English. Before opening a pull request:

```bash
npm install
npm run test:all   # 619 JavaScript tests + 104 Swift tests
```

The repository conventions — a core with no DOM and no implicit network, zero
dependencies, comments that explain *why* — are detailed in
[CONTRIBUTING.md](CONTRIBUTING.md).
