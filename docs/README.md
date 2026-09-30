# Documentation

[← Project home](../README.md) · [Accueil en français](../README.fr.md)

Most documents in this folder were written in French while the project was
single-language. The user-facing entry points are now bilingual; the technical
and design notes remain French-only and are marked **[FR]** below. Translations
are welcome — see [CONTRIBUTING.md](../CONTRIBUTING.md).

## User documentation

| Document | Language | Contents |
|---|---|---|
| [guide.md](guide.md) | EN | Full walkthrough, from collecting a link to printing it |
| [guide.fr.md](guide.fr.md) | FR | Same guide, in French |
| [README.md](../README.md) | EN | Project overview, architecture, development |
| [README.fr.md](../README.fr.md) | FR | Same overview, in French |
| [CHANGELOG.md](../CHANGELOG.md) | EN | Every released version, and the source of the release note filed on the Chrome Web Store |
| [CHANGELOG.fr.md](../CHANGELOG.fr.md) | FR | Same changelog, in French |

## Technical notes

| Document | Language | Contents |
|---|---|---|
| [protocole-niimbot-ble.fr.md](protocole-niimbot-ble.fr.md) | FR | Niimbot BLE protocol: UUIDs, frame format, per-model print sequences, Web Bluetooth and CoreBluetooth constraints, and what still needs to be verified on real hardware |
| [faisabilite-brother-bluetooth.fr.md](faisabilite-brother-bluetooth.fr.md) | FR | Brother Bluetooth label printers: which ones a browser can reach, and by which API — the Web Bluetooth GATT limit, the Web Serial RFCOMM path, the one proven BLE model, and what remains to be measured |
| [preparation-app-store.fr.md](preparation-app-store.fr.md) | FR | App Store submission: what is already compliant, what remains, the regeneration trap, and how to reuse the checklist for other Swift apps |
| [chrome-web-store.md](chrome-web-store.md) | FR | Chrome Web Store listing: ready-to-paste description, permission justifications, privacy fields, the in-product consent flow, and the procedure for updating the published item |
| [site-public.fr.md](site-public.fr.md) | FR | Public site: why the landing page and the app are served separately, the usage and FAQ sections, the footer signature, how to deploy on Vercel, and what is not verified |
| [note-capacites-capture-url-safari-brave.md](note-capacites-capture-url-safari-brave.md) | FR | Capability matrix for browser extensions on Safari macOS, Safari iOS and Brave, with sources |
| [safari-extension-verification.md](safari-extension-verification.md) | FR | What was verified in the real Safari browser, and what cannot be |
| [verification-chrome.md](verification-chrome.md) | FR | What was measured in the real Chrome browser: rendered contrast, keyboard pass, context menu and badge, and the layout defects the stylesheets concealed |
| [note-a-verifier-a-l-oeil.md](note-a-verifier-a-l-oeil.md) | FR | What could **not** be settled by measurement, because the vision service was unavailable: the field styling, the sheet's alignment, the automatic layout's balance, the footer, the header, and the shortening text — each with what was measured and what remains to be looked at |
| [prompt-prochaine-session.md](prompt-prochaine-session.md) | FR | The prompt to paste at the start of the next session: what to read first, the state of the suite and the browser record, the work to do in order, what not to redo, and the house rules that cost a defect when forgotten |
| [prompt-open-design-interface.md](prompt-open-design-interface.md) | FR | The prompt to run in OpenDesign: analyse the three surfaces and design the visuals for the public page — what to attach, what to deliver, and the palette rules the images must respect |

## Design

| Document | Language | Contents |
|---|---|---|
| [design-options/icones.md](design-options/icones.md) | FR | Icon design exploration |
| [design-options/audit-accessibilite.md](design-options/audit-accessibilite.md) | FR | Accessibility audit of the interface |
| [logo/](logo/) | — | Logo proposals (SVG, HTML preview) |

## Archive

Kept for the record; not part of the current code.

| Document | Language | Contents |
|---|---|---|
| [archive/qr-niimbot-printer/](archive/qr-niimbot-printer/) | FR | Earlier single-page prototype. **Its Bluetooth code cannot work** — the UUIDs are placeholders and the commands are ESC/POS, not Niimbot. Superseded by `src/` and `native/niimbot-kit/`. |
| [archive/prompt-session-safari.fr.md](archive/prompt-session-safari.fr.md) | FR | Working note that handed the Safari port to a later session |
