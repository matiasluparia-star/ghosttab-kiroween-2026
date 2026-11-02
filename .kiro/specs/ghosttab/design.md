# GhostTab design — current revision
Kiro implemented the application and repaired issues found by Codex browser QA. These documents describe the implementation; they were not a spec-first development sequence.
## Architecture
Buildless HTML, CSS and ES modules in dist/. core.mjs contains queue and URL logic; app.js handles DOM, persistence and events. No dependencies or application backend. Serve over HTTP(S); file:// is unsupported.
## State
Each item has id, url, status (pending/read/skipped), addedAt. First pending is current. Exact URL strings are deduplicated. Read and skipped items both count toward completion; only pending items are exported. No sync, undo, article parsing, title fetching or URL reachability checks.
## Browser behaviour
Open link is a real anchor, target=_blank, rel=noopener noreferrer. Its validated href is updated during rendering. Opening does not modify queue status. Ctrl/Cmd+Enter submits; Enter inserts newline. ARIA progress value updates on the progressbar element.
## Privacy and safety
User text is rendered through textContent. Only HTTP(S) schemes are accepted; stored data is checked on restore. Queue data stays in localStorage. Opening links contacts the destination; hosting has ordinary request logging. No service can guarantee that user-supplied destination websites are safe.
## Presentation
Dark plum, ivory and lavender haunted library. Original CSS ghost emblem. Two columns at desktop widths and one on mobile. Current link precedes full queue in mobile flow. Reduced-motion preference supported.
