/**
 * GhostTab — app.js
 * Application controller. Imports core.mjs as an ES module.
 * All DOM mutations use textContent / createElement — never innerHTML with
 * user data — to prevent XSS.
 * Copyright 2026 Matias Luparia — MIT License
 */

import {
  parseLinks,
  deduplicateUrls,
  buildQueue,
  currentItem,
  updateItemStatus,
  calcProgress,
  exportPending,
  serialiseQueue,
  deserialiseQueue,
  STORAGE_KEY,
  DEMO_LINKS,
} from './core.mjs';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {ReturnType<typeof buildQueue>} */
let queue = [];

// ---------------------------------------------------------------------------
// DOM references (populated after DOMContentLoaded)
// ---------------------------------------------------------------------------

let $ = {};   // filled in by init()

// ---------------------------------------------------------------------------
// Persist / restore
// ---------------------------------------------------------------------------

function saveQueue() {
  try {
    localStorage.setItem(STORAGE_KEY, serialiseQueue(queue));
  } catch {
    // Storage quota exceeded or private-browsing restriction — silently ignore.
  }
}

function loadQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return deserialiseQueue(raw);   // returns [] on any error
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Notification toast
// ---------------------------------------------------------------------------

let notifTimer = null;

function showNotif(msg) {
  $.notif.textContent = msg;
  $.notif.classList.add('show');
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(() => $.notif.classList.remove('show'), 2400);
}

// ---------------------------------------------------------------------------
// Render helpers — safe, no innerHTML with user data
// ---------------------------------------------------------------------------

function renderProgress() {
  const p = calcProgress(queue);
  const pct = p.total === 0 ? 0 : p.percent;

  // Fix 2: aria-valuenow updated on the role=progressbar element, not the fill child
  $.progressBar.setAttribute('aria-valuenow', String(pct));
  $.progressFill.style.width = pct + '%';

  // Stats line
  $.progressRead.textContent    = p.read + ' read';
  $.progressSkip.textContent    = p.skipped + ' skipped';
  $.progressPending.textContent = p.pending + ' pending';
  $.progressPct.textContent     = pct + '%';
}

function renderCurrentItem() {
  const item = currentItem(queue);

  if (!item) {
    $.currentPanel.classList.add('hidden');
    return;
  }

  $.currentPanel.classList.remove('hidden');
  $.currentUrl.textContent = item.url;   // textContent only — safe, no XSS

  // Fix 1: Update the real <a> anchor's href to the validated URL.
  // Only http/https URLs ever reach here (validated by core.mjs).
  // Opening does NOT mark read — that remains a separate user action.
  $.btnOpen.href = item.url;
  $.btnOpen.setAttribute('data-id', item.id);
}

function renderQueueList() {
  // Clear existing children
  while ($.queueList.firstChild) {
    $.queueList.removeChild($.queueList.firstChild);
  }

  if (queue.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    const icon = document.createElement('span');
    icon.className = 'empty-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '👻';
    const msg = document.createTextNode(' Paste links above to summon your reading queue.');
    empty.appendChild(icon);
    empty.appendChild(msg);
    $.queueList.appendChild(empty);
    return;
  }

  const active = currentItem(queue);

  for (const item of queue) {
    const li = document.createElement('li');
    li.className = 'queue-item';
    li.setAttribute('data-status', item.status);
    li.setAttribute('data-id', item.id);

    const isCurrent = active && item.id === active.id;
    if (isCurrent) li.setAttribute('data-current', 'true');

    // Status dot
    const dot = document.createElement('span');
    dot.className = 'queue-item-status-dot';
    dot.setAttribute('aria-hidden', 'true');
    li.appendChild(dot);

    // URL text
    const urlSpan = document.createElement('span');
    urlSpan.className = 'queue-item-url';
    urlSpan.textContent = item.url;   // textContent — no XSS risk
    urlSpan.title = item.url;
    li.appendChild(urlSpan);

    // Badge
    const badge = document.createElement('span');
    badge.className = 'queue-item-badge';
    if (isCurrent) {
      badge.className += ' badge-current';
      badge.textContent = 'now';
      badge.setAttribute('aria-label', 'current item');
    } else {
      badge.className += ` badge-${item.status}`;
      badge.textContent = item.status;
    }
    li.appendChild(badge);

    $.queueList.appendChild(li);
  }
}

function renderDonePanel() {
  const p = calcProgress(queue);
  const allDone = p.total > 0 && p.pending === 0;

  $.donePanel.classList.toggle('hidden', !allDone);
  $.currentPanel.classList.toggle('hidden', allDone || p.total === 0);
}

function renderAll() {
  // Discard any export from a previous queue state.
  $.exportOutput.value = '';
  $.exportOutput.classList.add('hidden');
  const p = calcProgress(queue);
  const hasQueue = p.total > 0;

  // Show/hide panels based on state
  $.progressPanel.classList.toggle('hidden', !hasQueue);
  $.queuePanel.classList.toggle('hidden', !hasQueue);
  $.exportPanel.classList.toggle('hidden', !hasQueue);

  renderProgress();
  renderCurrentItem();
  renderQueueList();
  renderDonePanel();
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function loadLinks() {
  const text = $.textarea.value;
  const urls = deduplicateUrls(parseLinks(text));

  if (urls.length === 0) {
    showNotif('👻 No valid http/https links found.');
    return;
  }

  // Merge — don't re-add URLs already present in any status
  const existingUrls = new Set(queue.map((i) => i.url));
  const newUrls = urls.filter((u) => !existingUrls.has(u));

  if (newUrls.length === 0) {
    showNotif('All links are already in your queue.');
    return;
  }

  const newItems = buildQueue(newUrls);
  queue = [...queue, ...newItems];

  $.textarea.value = '';
  saveQueue();
  renderAll();
  showNotif(`✨ Added ${newItems.length} link${newItems.length === 1 ? '' : 's'} to your queue.`);
  $.textarea.focus();
}

function loadDemo() {
  const existingUrls = new Set(queue.map((i) => i.url));
  const newUrls = DEMO_LINKS.filter((u) => !existingUrls.has(u));

  if (newUrls.length === 0) {
    showNotif('Demo links are already in your queue.');
    return;
  }

  const newItems = buildQueue(newUrls);
  queue = [...queue, ...newItems];

  saveQueue();
  renderAll();
  showNotif(`👻 Demo queue loaded — ${newItems.length} links summoned!`);
}

// Fix 1: openCurrent is REMOVED — the anchor element handles navigation natively.
// The O shortcut below calls $.btnOpen.click() to trigger the real <a> element.

function markRead() {
  const item = currentItem(queue);
  if (!item) return;

  queue = updateItemStatus(queue, item.id, 'read');
  saveQueue();
  renderAll();
  showNotif('✅ Marked read — next link ready.');
}

function skipCurrent() {
  const item = currentItem(queue);
  if (!item) return;

  queue = updateItemStatus(queue, item.id, 'skipped');
  saveQueue();
  renderAll();
  showNotif('⏭ Skipped — moving on.');
}

function clearQueue() {
  if (queue.length === 0) return;
  if (!confirm('Clear the entire reading queue? This cannot be undone.')) return;

  queue = [];
  saveQueue();
  renderAll();
  showNotif('Queue cleared. The library is empty once more.');
}

// Fix 4: New queue — clear state and focus the textarea for a fresh start.
function newQueue() {
  queue = [];
  saveQueue();
  renderAll();
  $.textarea.focus();
  showNotif('✦ Ready for a new queue — paste your links.');
}

function exportLinks() {
  const text = exportPending(queue);

  if (!text) {
    showNotif('No pending links to export.');
    return;
  }

  $.exportOutput.value = text;
  $.exportOutput.classList.remove('hidden');
  $.exportOutput.select();

  // Clipboard API with textarea fallback
  navigator.clipboard?.writeText(text).then(() => {
    showNotif('📋 Pending links copied to clipboard!');
  }).catch(() => {
    showNotif('Links shown below — select all and copy manually.');
  });
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

function handleGlobalKey(e) {
  // Don't intercept when typing in an input or textarea
  const tag = document.activeElement?.tagName;
  if (tag === 'TEXTAREA' || tag === 'INPUT') return;

  switch (e.key) {
    case 'o':
    case 'O':
      // Fix 1: O shortcut clicks the real <a> anchor element
      if (!$.currentPanel.classList.contains('hidden')) {
        e.preventDefault();
        $.btnOpen.click();
      }
      break;
    case 'r':
    case 'R':
      if (!$.currentPanel.classList.contains('hidden')) {
        e.preventDefault();
        markRead();
      }
      break;
    case 's':
    case 'S':
      if (!$.currentPanel.classList.contains('hidden')) {
        e.preventDefault();
        skipCurrent();
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

function init() {
  // Collect DOM references — note: btnOpen is now an <a>, not a <button>
  $ = {
    textarea:        document.getElementById('links-textarea'),
    btnLoad:         document.getElementById('btn-load'),
    btnDemo:         document.getElementById('btn-demo'),
    btnClear:        document.getElementById('btn-clear'),

    // Fix 2: reference the role=progressbar container (not the fill child)
    progressPanel:   document.getElementById('progress-panel'),
    progressBar:     document.getElementById('progress-bar'),
    progressFill:    document.getElementById('progress-fill'),
    progressRead:    document.getElementById('progress-read'),
    progressSkip:    document.getElementById('progress-skip'),
    progressPending: document.getElementById('progress-pending'),
    progressPct:     document.getElementById('progress-pct'),

    currentPanel:    document.getElementById('current-panel'),
    currentUrl:      document.getElementById('current-url'),
    // Fix 1: <a> element — href set in renderCurrentItem(); no click handler needed
    btnOpen:         document.getElementById('btn-open'),
    btnRead:         document.getElementById('btn-read'),
    btnSkip:         document.getElementById('btn-skip'),

    queuePanel:      document.getElementById('queue-panel'),
    queueList:       document.getElementById('queue-list'),

    donePanel:       document.getElementById('done-panel'),
    btnNewQueue:     document.getElementById('btn-new-queue'),

    exportPanel:     document.getElementById('export-panel'),
    btnExport:       document.getElementById('btn-export'),
    exportOutput:    document.getElementById('export-output'),

    notif:           document.getElementById('notification'),
  };

  // Wire up events
  $.btnLoad.addEventListener('click', loadLinks);
  $.btnDemo.addEventListener('click', loadDemo);
  $.btnClear.addEventListener('click', clearQueue);
  // Fix 1: no click listener on $.btnOpen — it's a plain <a> that navigates natively
  $.btnRead.addEventListener('click', markRead);
  $.btnSkip.addEventListener('click', skipCurrent);
  // Fix 4: new-queue button in done panel
  $.btnNewQueue.addEventListener('click', newQueue);
  $.btnExport.addEventListener('click', exportLinks);

  // Fix 3: Ctrl+Enter (or Cmd+Enter) submits; plain Enter inserts newline
  $.textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      loadLinks();
    }
    // Plain Enter: browser default (newline in textarea) — no interception
  });

  // Global keyboard shortcuts
  document.addEventListener('keydown', handleGlobalKey);

  // Restore queue from localStorage
  queue = loadQueue();

  // Initial render
  renderAll();

  // Announce restore to screen-reader users
  if (queue.length > 0) {
    const p = calcProgress(queue);
    const label = `Queue restored: ${p.pending} pending, ${p.read} read, ${p.skipped} skipped.`;
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      setTimeout(() => { liveRegion.textContent = label; }, 300);
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
