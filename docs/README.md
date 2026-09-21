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

## Technical notes

| Document | Language | Contents |
|---|---|---|
| [protocole-niimbot-ble.fr.md](protocole-niimbot-ble.fr.md) | FR | Niimbot BLE protocol: UUIDs, frame format, per-model print sequences, Web Bluetooth and CoreBluetooth constraints, and what still needs to be verified on real hardware |
| [preparation-app-store.fr.md](preparation-app-store.fr.md) | FR | App Store submission: what is already compliant, what remains, the regeneration trap, and how to reuse the checklist for other Swift apps |
| [chrome-web-store.md](chrome-web-store.md) | FR | Chrome Web Store listing: ready-to-paste description, permission justifications, privacy fields, and the in-product consent flow |
| [site-public.fr.md](site-public.fr.md) | FR | Public site: why the landing page and the app are served separately, how to deploy on Vercel, and what is not verified |
| [note-capacites-capture-url-safari-brave.md](note-capacites-capture-url-safari-brave.md) | FR | Capability matrix for browser extensions on Safari macOS, Safari iOS and Brave, with sources |
| [safari-extension-verification.md](safari-extension-verification.md) | FR | What was verified in the real Safari browser, and what cannot be |

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
