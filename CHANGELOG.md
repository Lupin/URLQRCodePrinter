# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project uses [Semantic Versioning](https://semver.org/).

**The update note filed on the Chrome Web Store is read from this file.**
`scripts/preparer-soumission.mjs` takes the entry of the packaged version and
renders it as plain text, in both languages — so a version without an entry here
is filed without a note. The French counterpart is
[`CHANGELOG.fr.md`](CHANGELOG.fr.md), and both files carry the same versions.

Two conventions, so the file stays machine-readable:

- one `## [version]` heading per released version, the newest first, with the
  date of its filing (`## [0.2.0] - 2026-09-30`);
- the categories of Keep a Changelog — `Added`, `Changed`, `Fixed`, `Removed`,
  `Security` — and a closing `What does not change` section, which the note filed
  on the store ends with.

The oldest version carries no date: it was not recorded at the time. It is not
invented here either.

## [Unreleased]

## [0.2.1] - 2026-09-30

This update makes the toolbar counter and the collection agree: emptying the
collection updates both, whichever page the button is used from.

### Fixed

- Clearing the collection from the application no longer leaves the previous
  count on the toolbar icon, and clearing it from the extension window no longer
  leaves the application showing links that are gone. The icon, the application
  and the window all follow the same storage: each reloads what it shows as soon
  as another one writes.

### What does not change

Nothing new is read, stored or sent. No permission was added.

## [0.2.0] - 2026-09-30

This update renames the QR Code everywhere it is named, so the listing and the
interface finally agree.

### Added

- Importing asks where to file what it just read: merge into the collection on
  screen, replace it (name and note included), or file the links into a new
  collection. The archive's collection name and note are read back, and a name
  already taken is suffixed instead of being refused.
- A collection note, printed in the page header beside the collection name.
- Numbering that can start at the number you choose.
- Nine sort orders, and manual reordering of the collection.
- The QR Code target is now chosen link by link, not only globally.
- Page headers on the label sheet, as the table already had.
- A text size and a title size, set independently.
- Landscape label layouts, and every label caption translated.

### Changed

- A4 3 x 4 (63.5 x 69.1 mm) is now the default label sheet.

### Fixed

- An emptied collection name is saved as empty, and displayed and exported under
  the built-in name — instead of silently keeping the previous one.
- Right-clicking a search result saves the page it points to, not the search
  engine's redirect: the list reads "fr.wikipedia.org" where it used to read
  "google.com", and the QR Code is shorter.
- Automatic layout measures the text at each grid's own width. It no longer
  announces a grid "computed for this content" that then cuts 45 lines, and when
  a page cannot hold every label legibly it paginates instead of squeezing them.
- A rotated label's title is no longer cut to the label's width: the band re-cuts
  it along its length, so a long title comes back on one row instead of two.
- On a fixed length, a centred label keeps its text next to the QR Code instead of
  pushing it to the bottom edge.
- The printed table continues across pages without cutting a row.

### What does not change

Nothing new is read, stored or sent. No permission was added.

## [0.1.0]

First published version.

### Added

- Collecting a link by right-click, by the toolbar button or through the add
  field.
- A local collection of links, with search, tags and a note.
- Label sheets on A4 and Letter stock, from plain paper to commercial sheets.
- Direct printing on Niimbot D110, M2 and M3.
- The workbook, CSV, Markdown, image-folder and archive exports.
- Importing archives and CSVs exported from here.
- Optional URL shortening.

The details of that version are the ones the published listing describes; its
entry was not written at the time, and this one claims nothing more.
