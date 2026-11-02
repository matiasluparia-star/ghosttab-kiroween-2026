/**
 * GhostTab — core.mjs
 * Pure functions: no DOM, no side-effects, fully testable with node --test.
 * Copyright 2026 Matias Luparia — MIT License
 */

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

/**
 * Returns true if the string is a valid http or https URL.
 * Rejects every other scheme (javascript:, data:, ftp:, etc.).
 *
 * @param {string} raw
 * @returns {boolean}
 */
export function isValidUrl(raw) {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Parsing raw text into a list of links
// ---------------------------------------------------------------------------

/**
 * Splits a multi-line string into trimmed, non-empty lines and validates each
 * as an http(s) URL.  Returns only valid URLs.
 *
 * @param {string} text  Raw paste / textarea content
 * @returns {string[]}   Array of valid URL strings (not deduplicated yet)
 */
export function parseLinks(text) {
  if (typeof text !== 'string') return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter(isValidUrl);
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Removes duplicate URLs, preserving first-seen order.
 * Comparison is case-sensitive (URLs are case-sensitive by spec).
 *
 * @param {string[]} urls
 * @returns {string[]}
 */
export function deduplicateUrls(urls) {
  if (!Array.isArray(urls)) return [];
  const seen = new Set();
  const result = [];
  for (const url of urls) {
    if (!seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Queue item factory
// ---------------------------------------------------------------------------

/**
 * @typedef {'pending'|'read'|'skipped'} ItemStatus
 */

/**
 * Creates a queue item object from a URL string.
 *
 * @param {string} url
 * @param {number} [index]  Optional insertion index for stable identity
 * @returns {{ id: string, url: string, status: ItemStatus, addedAt: number }}
 */
export function createItem(url, index = 0) {
  return {
    id: `item-${Date.now()}-${index}`,
    url,
    status: 'pending',
    addedAt: Date.now(),
  };
}

/**
 * Build a queue array from a list of validated, deduplicated URL strings.
 *
 * @param {string[]} urls
 * @returns {Array<ReturnType<typeof createItem>>}
 */
export function buildQueue(urls) {
  return urls.map((url, i) => createItem(url, i));
}

// ---------------------------------------------------------------------------
// Queue navigation helpers
// ---------------------------------------------------------------------------

/**
 * Returns the first pending item in the queue, or null if none exists.
 *
 * @param {Array<ReturnType<typeof createItem>>} queue
 * @returns {ReturnType<typeof createItem> | null}
 */
export function currentItem(queue) {
  if (!Array.isArray(queue)) return null;
  return queue.find((item) => item.status === 'pending') ?? null;
}

/**
 * Returns a new queue with the item matching `id` updated to `status`.
 * Does not mutate the original array.
 *
 * @param {Array<ReturnType<typeof createItem>>} queue
 * @param {string} id
 * @param {ItemStatus} status
 * @returns {Array<ReturnType<typeof createItem>>}
 */
export function updateItemStatus(queue, id, status) {
  if (!Array.isArray(queue)) return [];
  return queue.map((item) =>
    item.id === id ? { ...item, status } : item
  );
}

// ---------------------------------------------------------------------------
// Progress calculation
// ---------------------------------------------------------------------------

/**
 * Returns progress information for the queue.
 *
 * @param {Array<ReturnType<typeof createItem>>} queue
 * @returns {{ total: number, read: number, skipped: number, pending: number, percent: number }}
 */
export function calcProgress(queue) {
  if (!Array.isArray(queue) || queue.length === 0) {
    return { total: 0, read: 0, skipped: 0, pending: 0, percent: 0 };
  }
  const total = queue.length;
  const read = queue.filter((i) => i.status === 'read').length;
  const skipped = queue.filter((i) => i.status === 'skipped').length;
  const pending = queue.filter((i) => i.status === 'pending').length;
  const percent = Math.round(((read + skipped) / total) * 100);
  return { total, read, skipped, pending, percent };
}

// ---------------------------------------------------------------------------
// Export remaining links
// ---------------------------------------------------------------------------

/**
 * Returns a newline-separated string of all pending URLs — suitable for
 * pasting back or saving.
 *
 * @param {Array<ReturnType<typeof createItem>>} queue
 * @returns {string}
 */
export function exportPending(queue) {
  if (!Array.isArray(queue)) return '';
  return queue
    .filter((item) => item.status === 'pending')
    .map((item) => item.url)
    .join('\n');
}

// ---------------------------------------------------------------------------
// localStorage serialisation helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ghosttab-queue-v1';

/**
 * Safely serialise a queue to a JSON string ready for localStorage.
 *
 * @param {Array<ReturnType<typeof createItem>>} queue
 * @returns {string}
 */
export function serialiseQueue(queue) {
  return JSON.stringify(queue);
}

/**
 * Safely deserialise a queue from a localStorage JSON string.
 * Returns an empty array on any parse error or invalid shape.
 *
 * @param {string | null | undefined} raw
 * @returns {Array<ReturnType<typeof createItem>>}
 */
export function deserialiseQueue(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate shape: each element must have id, url, status, addedAt
    const validStatuses = new Set(['pending', 'read', 'skipped']);
    return parsed.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.url === 'string' &&
        isValidUrl(item.url) &&
        validStatuses.has(item.status) &&
        typeof item.addedAt === 'number'
    );
  } catch {
    return [];
  }
}

export { STORAGE_KEY };

// ---------------------------------------------------------------------------
// Demo links (safe, well-known public pages — no external fetching needed)
// ---------------------------------------------------------------------------

export const DEMO_LINKS = [
  'https://developer.mozilla.org/en-US/docs/Web/HTML',
  'https://developer.mozilla.org/en-US/docs/Web/CSS',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'https://en.wikipedia.org/wiki/World_Wide_Web',
  'https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol',
  'https://www.example.org/',
  'https://developer.mozilla.org/en-US/docs/Web/Accessibility',
  'https://en.wikipedia.org/wiki/Progressive_web_application',
];
