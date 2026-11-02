# GhostTab — Contest Submission Description

> **DRAFT — not submitted**
> This document is a draft prepared for the Kiroween 2026 Costume Contest.
> No submission has been made; no video has been recorded or published.

---

## What is GhostTab?

GhostTab is a haunted reading-queue tool for the web. You paste a list of HTTP(S) URLs — all those articles, docs, and blog posts you've been meaning to read — and it shows them to you one at a time, like a librarian who will not let you leave until you finish the book in front of you.

No signup. No backend. No tracking. Everything lives in your browser's `localStorage`.

---

## The Costume

The "costume" is the concept: GhostTab is a tool for your **ghost links** — the links that haunt your bookmarks, your Slack messages, your notes apps, and your browser history, but never actually get read.

The UI dresses the part: a near-black plum background, warm ivory typography, lavender accents, an elegant serif heading, and a pure-CSS ghost silhouette in both the heading emblem and the floating background shape.

---

## Technical Summary

| Aspect | Details |
|---|---|
| **Type** | Single-page web application |
| **Dependencies** | Zero — no npm, no CDN, no external files |
| **Architecture** | `dist/core.mjs` (pure logic) + `dist/app.js` (DOM) + `dist/style.css` + `dist/index.html` |
| **Tests** | `node --test tests/core.test.mjs` — 48 tests, zero packages required |
| **Storage** | `localStorage` only — nothing leaves the device |
| **Security** | `textContent`-only DOM, real `<a rel="noopener noreferrer">`, URL scheme validation, localStorage shape validation |
| **Accessibility** | `aria-live`, `role="progressbar"` with correct `aria-valuenow`, keyboard shortcuts, visible focus ring |
| **Responsive** | Works at 375 px (iPhone SE); 2-column layout at ≥720 px |
| **Motion** | `prefers-reduced-motion` respected throughout |

---

## How to Run

The app uses ES modules and must be served over HTTP:

```bash
cd dist
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## How it was built — actual workflow

The project was initiated with a single scoped prompt describing the full product: purpose, file layout, UI concept, security constraints, accessibility requirements, test runner, and documentation expectations.

Kiro (the AI assistant) implemented all four application files, the test suite, the spec documents, the steering document, the README, and the submission docs in one session.

After initial implementation, Codex (a separate orchestration CLI) performed browser QA and identified specific bugs. Kiro then repaired those bugs:
- Replaced the `window.open` button with a real `<a>` anchor (opening never auto-marks read)
- Moved `aria-valuenow` from the fill element to the `role="progressbar"` container
- Changed textarea submit from Enter to Ctrl/Cmd+Enter (Enter now inserts newlines)
- Replaced the misleading done-panel export button with a "New queue" action
- Corrected documentation (test count, HTTP-only requirement, GitHub URL, privacy notes)
- Added 2-column desktop layout and improved muted text contrast
- Replaced emoji heading with a pure CSS ghost emblem
- Added this truthful process document

The spec documents and README were written to reflect what was actually built, not a planned spec-first process.

---

## Source

[github.com/matiasluparia-star/ghosttab-kiroween-2026](https://github.com/matiasluparia-star/ghosttab-kiroween-2026)

License: MIT — Copyright 2026 Matias Luparia
