# GhostTab — Kiro Process Document

> **DRAFT — not submitted**
> Truthful account of how this project was built with Kiro's assistance.
> No credentials, no fabricated proofs, no claims of submission or publication.

---

## Chronology

### 2026-10-31 — Initial build (one session)

A single scoped prompt was provided to Kiro CLI describing:
- The product purpose: focused one-at-a-time reading queue from pasted URLs
- File layout: buildless `dist/` with `core.mjs`, `app.js`, `style.css`, `index.html`
- UI concept: haunted library aesthetic (near-black plum, ivory, lavender, CSS ghost)
- Constraints: no bundler, no external deps, no backend, no accounts
- Security requirements: `textContent`-only DOM, `noopener noreferrer`, URL scheme validation
- Accessibility requirements: ARIA, keyboard shortcuts, responsive
- Test requirement: `node --test` with Node built-in runner, no install
- Documentation: `.kiro/specs/`, `.kiro/steering/`, README, submission docs, MIT license

Kiro implemented all files in a single pass:
1. `dist/core.mjs` — pure business logic, no DOM
2. `dist/style.css` — haunted library theme, CSS ghost silhouette
3. `dist/app.js` — DOM controller, localStorage, keyboard shortcuts
4. `dist/index.html` — semantic HTML, accessible, buildless
5. `tests/core.test.mjs` — 48 node:test cases
6. `.kiro/specs/ghosttab/requirements.md`
7. `.kiro/specs/ghosttab/design.md`
8. `.kiro/specs/ghosttab/tasks.md`
9. `.kiro/steering/product.md`
10. `LICENSE` and `README.md`
11. `submission/description.md` and `submission/demo-script.md`

Tests were run immediately: `node --test tests/core.test.mjs` → 48 pass, 0 fail.

---

### 2026-10-31, later — Browser QA and repairs

ChatGPT/Codex (the orchestrating assistant, separate from Kiro) performed browser QA by loading the served app and testing interactions. Seven bugs were identified and reported back to Kiro for repair:

**Bug 1 — Open button used `window.open` + blank target, which fails with noopener**
The old approach called `window.open('', '_blank', 'noopener,noreferrer')` then tried to set `w.location`. Browsers that allow pop-ups would open a blank window; with strict noopener policies the window reference could be null or the navigation blocked. Fix: replaced the `<button>` with a real `<a href target="_blank" rel="noopener noreferrer">` whose `href` is set to the validated URL by `renderCurrentItem()`. The `O` keyboard shortcut now calls `.click()` on the anchor. Opening a link no longer auto-marks it read — that is a separate explicit action.

**Bug 2 — `aria-valuenow` written to the fill `<div>`, not the `role="progressbar"` element**
The `renderProgress()` function was calling `$.progressFill.setAttribute('aria-valuenow', pct)` on the visual fill bar child. The `role="progressbar"` was on the track wrapper (`#progress-bar`). Fix: added `$.progressBar` DOM reference and moved the attribute update there.

**Bug 3 — Enter in the textarea immediately submitted; no way to paste multi-line text by typing**
Plain Enter was intercepted and called `loadLinks()`. This made it impossible to type multi-line content without pasting. Fix: changed the keydown handler to only submit on `Ctrl+Enter` or `Cmd+Enter` (Mac). Plain Enter now inserts a newline as the browser default. Placeholder text and keyboard hint updated to say "Ctrl+Enter (or Cmd+Enter) to add".

**Bug 4 — Done panel had an "Export remaining / start over" button that exported nothing**
When all items were processed there were no pending links to export, so the button produced an empty result. Fix: replaced it with a "New queue" button that clears `queue = []`, saves, re-renders (returning to the empty input state), and focuses the textarea. Export functionality remains in the separate export panel for non-done states.

**Bug 5 — README and submission docs had inaccuracies**
- Test count said 50; actual count is 48
- README offered a `file://` direct-open option, but ES modules require HTTP
- README claimed marking an item could be undone by reloading localStorage — this is not a supported feature
- Footer and README linked to a placeholder GitHub URL
- Documentation needed to distinguish the prompt-led implementation from a spec-first workflow; hooks, MCP and property-based testing were not used

Fix: corrected all of the above. README now only offers HTTP server options. Test count is 48. No false undo claim. GitHub URL is `https://github.com/matiasluparia-star/ghosttab-kiroween-2026`. Workflow description is the accurate account in this document.

**Bug 6 — Muted text contrast too low; no 2-column desktop layout; emoji ghost in heading**
- `--text-muted: #7a6a8a` on `--bg-card: #231530` falls below 4.5:1 contrast ratio
- `--text-secondary: #b8a9cc` also marginal
- Single-column layout placed the queue list below a long scroll
- Heading used the 👻 emoji rather than a designed CSS element

Fix: lifted `--text-muted` to `#9e8fb0` and `--text-secondary` to `#c8badc`. Added `.layout-grid` CSS grid: two columns at ≥720 px (main/left, queue/right with `position:sticky`), single column on mobile with current-item card appearing above the queue. Replaced the emoji `<i>` with `.ghost-emblem` / `.ghost-body` / `.ghost-eye` spans styled entirely in CSS.

**Bug 7 — No process document existed**
Fix: this file.

---

## What Kiro did

- Wrote all application code and tests from the initial prompt
- Repaired all seven QA bugs when reported
- Wrote all specification and documentation files

## What Kiro did not do

- Run git, commit, push, or publish anything
- Access credentials, secrets, or external services
- Install npm packages
- Access directories outside `/workspace/sites/ghosttab`
- Claim submission, deployment, or video production

## What was not used

- Kiro spec hooks (`.kiro/hooks/`)
- MCP servers
- Property-based testing
- Any spec-first / TDD workflow — implementation preceded and informed the spec documents

---

## Test evidence

```
$ node --test tests/core.test.mjs
✔ isValidUrl — accepts http URLs
✔ isValidUrl — accepts https URLs
✔ isValidUrl — rejects non-http schemes
... (48 tests total)
ℹ tests 48
ℹ pass  48
ℹ fail  0
```

## Final documentation review
Codex reconciled specs, steering, verification notes and the iPhone recording plan after Kiro repairs. Actual CLI output is preserved in .kiro/evidence/. One repair response was throttled; the next resumed session completed the code repairs.

Codex applied one final three-line controller correction after testing Clear queue followed by Load demo: discard stale exported text whenever queue state renders. All other application implementation and QA repairs were performed by Kiro.
