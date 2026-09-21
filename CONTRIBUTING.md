# Contributing

Thanks for looking at URLQRCodePrinter. This document describes how the project
is built and what it expects from a change. It is written in English because the
repository is public; **the code itself is in French** — identifiers, comments,
error messages, test names and commit messages included. A contribution that
follows that convention is easier to review.

## Getting started

```bash
npm install          # one runtime dependency: uqr
npm run build        # assembles dist/web and dist/extension*
npm run serve        # http://127.0.0.1:4173/ — localhost is required
npm test             # 616 JavaScript tests (rebuilds dist/ first)
npm run test:swift   # 104 Swift tests for the native core
npm run test:all     # both
```

`npm test` runs `scripts/build.mjs` first (`pretest`), because several tests
exercise the assembled artifact. Running `node --test` directly without building
fails with an explicit message.

## Project conventions

These are not stylistic preferences; each one exists because breaking it caused
a real defect.

- **Zero dependencies.** The core uses native ES modules and no bundler. The
  only runtime dependency is `uqr`, a pure ESM QR encoder. Do not add a library
  for something that fits in a module here.
- **The core is pure.** `src/core/` must not touch the DOM, the network, or
  global state that is not injected. `src/web/` and `src/extension-src/` own
  everything DOM-related. `test/helpers/dom-shim.mjs` exists so the web layer
  can be tested without a browser.
- **Comments explain *why*.** A comment that restates the code is noise. A
  comment that records the defect a line prevents — or the measurement that
  justifies a constant — keeps it from being reintroduced. This repository has a
  habit of citing the failing output verbatim.
- **The extension is assembled, not bundled.** `scripts/bundle.mjs` concatenates
  the extension modules in dependency order and refuses to emit if two modules
  declare the same top-level name. Safari cannot resolve ES module imports
  inside an extension's own subfolder, which is the reason this exists.
- **Never edit `dist/`, `native/safari/` resources or `native/niimbot-kit` build
  output by hand.** Edit `src/` and rebuild. `dist/` is git-ignored.
- **Never assert a number you did not measure.** Test counts, verification
  counts and protocol byte sequences in the documentation come from a real run.

## Where things live

| Path | Role |
|---|---|
| `src/core/` | Pure business core: links, QR, labels, sheets, storage, exports, Niimbot protocol |
| `src/web/` | Standalone application (the extension's full page) |
| `src/extension-src/` | MV3 extension source (Brave, Chrome, Edge, Safari) |
| `native/niimbot-kit/` | Swift core: same protocol, same print sequence, same test vectors |
| `native/safari/` | Generated Xcode project (macOS + iOS) |
| `scripts/` | Build, icons, packaging, and the browser verification passes |
| `test/` | `node --test` suites |
| `docs/` | All documentation, see `docs/README.md` |

## Tests

- One test file per concern, named `test/*.test.js`. Read an existing file before
  adding one; the shapes are consistent.
- The Niimbot frames are validated **byte for byte in both languages**. If you
  change a frame, update both implementations and both test vectors — the
  duplication is deliberate and is the project's main correctness check.
- Property-style tests (grid layouts, QR bounds) are preferred over a handful of
  examples when a range of inputs is possible.
- `npm run verify:brave` drives a real browser on an isolated profile and checks
  the files actually written to disk. `npm run verify:safari` drives the real
  Safari through WebDriver. Both require the corresponding browser installed and,
  for Brave, network access. Report what they print; do not soften a failure.

## Commits and pull requests

- Commit messages are in French, present tense, one line, **without accents in
  the summary** — matching the existing history.
- One concern per commit. Say what the change fixes, not which files it touches.
- In a pull request, state how the change was verified. If something could not be
  verified (real hardware, a signed Xcode build), say so explicitly rather than
  implying it was.

## Reporting a defect

Include the browser and version, the operating system, and the exact output. For
label geometry or print issues, name the printer or label reference (for example
Avery L7160, Niimbot D110) and the values in the layout fields — a misprint is
almost always reproduced by a specific six-value grid.

## License

By contributing, you agree that your contribution is released under the
[MIT License](LICENSE).
