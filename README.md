# GhostTab

**A haunted reading queue for the links that never quite get read.**

GhostTab turns a pasted list of HTTP(S) links into a focused one-at-a-time reading queue. No accounts. No tracking. No server. Everything stays in your browser.

Built for the Kiroween 2026 Costume Contest on Halloween 2026.

Live app: https://ghosttab-kiroween-matias.matiasluparia.chatgpt.site

---

## Features

- Paste a list of URLs (one per line) and build an instant reading queue
- One link visible at a time — prevents tab-paralysis and procrastination browsing
- Open in new tab (without auto-marking), mark read, or skip
- Progress bar with read / skipped / pending counts
- Queue persists automatically in `localStorage` — survives page refresh
- Export remaining pending links as plain text
- Load a demo queue of safe public links (MDN, Wikipedia, example.org)
- Keyboard shortcuts: `O` open link · `R` mark read · `S` skip
- `Ctrl+Enter` (or `Cmd+Enter`) to submit from the textarea
- Responsive — works on iPhone 12 / SE width (375 px)
- 2-column desktop layout: current link high on the left, full queue on the right
- Haunted library UI: near-black plum, ivory type, lavender accents, CSS ghost
- Respects `prefers-reduced-motion`

---

## Running locally

The app uses ES modules (`type="module"`), which browsers require to be served over HTTP — not loaded from the filesystem directly. Use any static file server.

### Python (built-in, no install)

```bash
cd dist
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

### Node (npx, no install)

```bash
npx serve dist
```

Then open the URL shown in the terminal.

---

## Running tests

Tests cover `dist/core.mjs` (all business logic). They use Node's built-in test runner — no packages to install.

**Requirements:** Node.js v18 or later.

```bash
node --test tests/core.test.mjs
```

Expected output:

```
✔ isValidUrl — accepts http URLs (...)
✔ isValidUrl — accepts https URLs (...)
...
ℹ tests 48
ℹ pass 48
ℹ fail 0
```

---

## Project structure

```
ghosttab/
├── dist/
│   ├── index.html    Main application page
│   ├── style.css     All styling (haunted library theme)
│   ├── app.js        DOM controller and persistence
│   └── core.mjs      Pure business logic (no DOM dependency)
├── tests/
│   └── core.test.mjs Tests for core.mjs (node --test)
├── .kiro/
│   ├── specs/ghosttab/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── steering/
│       └── product.md
├── submission/
│   ├── description.md
│   ├── demo-script.md
│   └── kiro-process.md
├── LICENSE
└── README.md
```

---

## Limitations

These are honest, known constraints — not bugs:

- **No URL titles or favicons.** Links are shown as raw URL strings. Fetching page titles would require a backend proxy (CORS) or a browser extension context.
- **ES modules require HTTP.** `dist/index.html` uses `<script type="module">` and must be served over HTTP, not opened as a `file://` URL.
- **Single device, single browser.** Queue is stored in `localStorage` and is not synced anywhere else.
- **No drag reordering.** Queue order is determined by paste order. Items cannot be manually rearranged.
- **No undo.** Marking an item read or skipped cannot be reversed through the UI.
- **`confirm()` for clear.** The "Clear queue" dialog uses the native browser confirmation dialog, which cannot be styled and is suppressed in some embedded views.

---

## Privacy notes

- The app itself never sends your URLs anywhere.
- When you click "Open link", your browser makes a normal request to that URL — the destination site's server will log it as it would any visit.
- If hosted statically, the hosting provider has standard access logs for page loads; it cannot see your queue content, which lives entirely in your browser's localStorage.

---

## Security notes

- All user-supplied URLs are inserted into the DOM using `textContent` only — never `innerHTML`.
- Links open via a real `<a rel="noopener noreferrer">` — safe against tab-napping and `javascript:` injection.
- `javascript:`, `data:`, `ftp:`, and all other non-http/https schemes are rejected at input time.
- localStorage data is fully validated on restore; malformed data is silently discarded.

---

## Source

[github.com/matiasluparia-star/ghosttab-kiroween-2026](https://github.com/matiasluparia-star/ghosttab-kiroween-2026)

---

## License

MIT — see [LICENSE](LICENSE).
Copyright 2026 Matias Luparia.
