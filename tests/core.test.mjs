/**
 * GhostTab — core.test.mjs
 * Tests for dist/core.mjs using Node's built-in test runner (node --test).
 * Run: node --test tests/core.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidUrl,
  parseLinks,
  deduplicateUrls,
  createItem,
  buildQueue,
  currentItem,
  updateItemStatus,
  calcProgress,
  exportPending,
  serialiseQueue,
  deserialiseQueue,
  STORAGE_KEY,
  DEMO_LINKS,
} from '../dist/core.mjs';

// ---------------------------------------------------------------------------
// isValidUrl
// ---------------------------------------------------------------------------

test('isValidUrl — accepts http URLs', () => {
  assert.equal(isValidUrl('http://example.org'), true);
  assert.equal(isValidUrl('http://example.org/path?q=1#frag'), true);
});

test('isValidUrl — accepts https URLs', () => {
  assert.equal(isValidUrl('https://developer.mozilla.org/en-US/docs/Web/HTML'), true);
  assert.equal(isValidUrl('https://en.wikipedia.org/wiki/World_Wide_Web'), true);
});

test('isValidUrl — rejects non-http schemes', () => {
  assert.equal(isValidUrl('ftp://example.org'), false);
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  assert.equal(isValidUrl('data:text/html,<h1>hi</h1>'), false);
  assert.equal(isValidUrl('file:///etc/passwd'), false);
  assert.equal(isValidUrl('mailto:user@example.org'), false);
});

test('isValidUrl — rejects malformed strings', () => {
  assert.equal(isValidUrl('not a url at all'), false);
  assert.equal(isValidUrl(''), false);
  assert.equal(isValidUrl('   '), false);
  assert.equal(isValidUrl('example.org'), false);   // no scheme
});

test('isValidUrl — rejects non-string input', () => {
  assert.equal(isValidUrl(null), false);
  assert.equal(isValidUrl(undefined), false);
  assert.equal(isValidUrl(42), false);
  assert.equal(isValidUrl([]), false);
});

test('isValidUrl — trims whitespace before validation', () => {
  assert.equal(isValidUrl('  https://example.org  '), true);
});

// ---------------------------------------------------------------------------
// parseLinks
// ---------------------------------------------------------------------------

test('parseLinks — parses a multi-line string into valid URLs', () => {
  const text = [
    'https://example.org',
    'https://developer.mozilla.org/en-US/',
    '  http://example.com/page  ',   // should be trimmed
    'not a link',
    'javascript:alert(1)',
    '',
    '   ',
  ].join('\n');

  const result = parseLinks(text);
  assert.equal(result.length, 3);
  assert.equal(result[0], 'https://example.org');
  assert.equal(result[1], 'https://developer.mozilla.org/en-US/');
  assert.equal(result[2], 'http://example.com/page');
});

test('parseLinks — returns empty array for empty string', () => {
  assert.deepEqual(parseLinks(''), []);
});

test('parseLinks — returns empty array for non-string input', () => {
  assert.deepEqual(parseLinks(null), []);
  assert.deepEqual(parseLinks(undefined), []);
  assert.deepEqual(parseLinks(42), []);
});

test('parseLinks — handles single URL without newline', () => {
  const result = parseLinks('https://example.org');
  assert.deepEqual(result, ['https://example.org']);
});

// ---------------------------------------------------------------------------
// deduplicateUrls
// ---------------------------------------------------------------------------

test('deduplicateUrls — removes exact duplicates', () => {
  const input = [
    'https://example.org',
    'https://example.org',
    'https://developer.mozilla.org',
    'https://example.org',
  ];
  const result = deduplicateUrls(input);
  assert.deepEqual(result, ['https://example.org', 'https://developer.mozilla.org']);
});

test('deduplicateUrls — preserves first-seen order', () => {
  const input = ['https://c.com', 'https://a.com', 'https://b.com', 'https://a.com'];
  const result = deduplicateUrls(input);
  assert.deepEqual(result, ['https://c.com', 'https://a.com', 'https://b.com']);
});

test('deduplicateUrls — returns empty array for empty input', () => {
  assert.deepEqual(deduplicateUrls([]), []);
});

test('deduplicateUrls — returns empty array for non-array input', () => {
  assert.deepEqual(deduplicateUrls(null), []);
  assert.deepEqual(deduplicateUrls(undefined), []);
  assert.deepEqual(deduplicateUrls('https://example.org'), []);
});

test('deduplicateUrls — does not deduplicate case-differently (URLs are case-sensitive)', () => {
  // Per spec, path is case-sensitive
  const input = ['https://example.org/Page', 'https://example.org/page'];
  const result = deduplicateUrls(input);
  assert.equal(result.length, 2);
});

// ---------------------------------------------------------------------------
// createItem
// ---------------------------------------------------------------------------

test('createItem — returns object with correct shape', () => {
  const item = createItem('https://example.org', 0);
  assert.equal(typeof item.id, 'string');
  assert.equal(item.url, 'https://example.org');
  assert.equal(item.status, 'pending');
  assert.equal(typeof item.addedAt, 'number');
});

test('createItem — id includes index for stable ordering', () => {
  const a = createItem('https://a.com', 0);
  const b = createItem('https://b.com', 1);
  // IDs should both be strings and non-empty
  assert.ok(a.id.length > 0);
  assert.ok(b.id.length > 0);
});

// ---------------------------------------------------------------------------
// buildQueue
// ---------------------------------------------------------------------------

test('buildQueue — creates a pending item per URL', () => {
  const urls = ['https://a.com', 'https://b.com', 'https://c.com'];
  const q = buildQueue(urls);
  assert.equal(q.length, 3);
  q.forEach((item, i) => {
    assert.equal(item.url, urls[i]);
    assert.equal(item.status, 'pending');
  });
});

test('buildQueue — returns empty array for empty input', () => {
  assert.deepEqual(buildQueue([]), []);
});

// ---------------------------------------------------------------------------
// currentItem
// ---------------------------------------------------------------------------

test('currentItem — returns first pending item', () => {
  const q = buildQueue(['https://a.com', 'https://b.com', 'https://c.com']);
  const item = currentItem(q);
  assert.equal(item?.url, 'https://a.com');
});

test('currentItem — skips non-pending items', () => {
  let q = buildQueue(['https://a.com', 'https://b.com', 'https://c.com']);
  q = updateItemStatus(q, q[0].id, 'read');
  const item = currentItem(q);
  assert.equal(item?.url, 'https://b.com');
});

test('currentItem — returns null when all done', () => {
  let q = buildQueue(['https://a.com', 'https://b.com']);
  q = updateItemStatus(q, q[0].id, 'read');
  q = updateItemStatus(q, q[1].id, 'skipped');
  assert.equal(currentItem(q), null);
});

test('currentItem — returns null for empty queue', () => {
  assert.equal(currentItem([]), null);
});

test('currentItem — returns null for non-array', () => {
  assert.equal(currentItem(null), null);
});

// ---------------------------------------------------------------------------
// updateItemStatus
// ---------------------------------------------------------------------------

test('updateItemStatus — marks item as read', () => {
  const q = buildQueue(['https://a.com', 'https://b.com']);
  const updated = updateItemStatus(q, q[0].id, 'read');
  assert.equal(updated[0].status, 'read');
  assert.equal(updated[1].status, 'pending');
});

test('updateItemStatus — marks item as skipped', () => {
  const q = buildQueue(['https://a.com']);
  const updated = updateItemStatus(q, q[0].id, 'skipped');
  assert.equal(updated[0].status, 'skipped');
});

test('updateItemStatus — does not mutate original queue', () => {
  const q = buildQueue(['https://a.com']);
  const original = q[0].status;
  updateItemStatus(q, q[0].id, 'read');
  assert.equal(q[0].status, original);   // still 'pending'
});

test('updateItemStatus — leaves unmatched items unchanged', () => {
  const q = buildQueue(['https://a.com', 'https://b.com']);
  const updated = updateItemStatus(q, 'nonexistent-id', 'read');
  assert.equal(updated[0].status, 'pending');
  assert.equal(updated[1].status, 'pending');
});

test('updateItemStatus — returns empty array for non-array input', () => {
  assert.deepEqual(updateItemStatus(null, 'x', 'read'), []);
});

// ---------------------------------------------------------------------------
// calcProgress
// ---------------------------------------------------------------------------

test('calcProgress — returns zero object for empty queue', () => {
  const p = calcProgress([]);
  assert.deepEqual(p, { total: 0, read: 0, skipped: 0, pending: 0, percent: 0 });
});

test('calcProgress — correct counts for mixed queue', () => {
  let q = buildQueue(['https://a.com', 'https://b.com', 'https://c.com', 'https://d.com']);
  q = updateItemStatus(q, q[0].id, 'read');
  q = updateItemStatus(q, q[1].id, 'skipped');
  const p = calcProgress(q);
  assert.equal(p.total, 4);
  assert.equal(p.read, 1);
  assert.equal(p.skipped, 1);
  assert.equal(p.pending, 2);
  assert.equal(p.percent, 50);
});

test('calcProgress — percent is 100 when all done', () => {
  let q = buildQueue(['https://a.com', 'https://b.com']);
  q = updateItemStatus(q, q[0].id, 'read');
  q = updateItemStatus(q, q[1].id, 'read');
  assert.equal(calcProgress(q).percent, 100);
});

test('calcProgress — percent is 0 when all pending', () => {
  const q = buildQueue(['https://a.com', 'https://b.com', 'https://c.com']);
  assert.equal(calcProgress(q).percent, 0);
});

// ---------------------------------------------------------------------------
// exportPending
// ---------------------------------------------------------------------------

test('exportPending — returns newline-joined pending URLs', () => {
  let q = buildQueue(['https://a.com', 'https://b.com', 'https://c.com']);
  q = updateItemStatus(q, q[0].id, 'read');
  const exported = exportPending(q);
  assert.equal(exported, 'https://b.com\nhttps://c.com');
});

test('exportPending — returns empty string when no pending items', () => {
  let q = buildQueue(['https://a.com']);
  q = updateItemStatus(q, q[0].id, 'read');
  assert.equal(exportPending(q), '');
});

test('exportPending — returns empty string for empty queue', () => {
  assert.equal(exportPending([]), '');
});

test('exportPending — returns empty string for non-array', () => {
  assert.equal(exportPending(null), '');
});

// ---------------------------------------------------------------------------
// serialiseQueue / deserialiseQueue
// ---------------------------------------------------------------------------

test('serialiseQueue — round-trips through deserialiseQueue', () => {
  const q = buildQueue(['https://a.com', 'https://b.com']);
  const serialised = serialiseQueue(q);
  const restored = deserialiseQueue(serialised);
  assert.equal(restored.length, 2);
  assert.equal(restored[0].url, 'https://a.com');
  assert.equal(restored[0].status, 'pending');
});

test('deserialiseQueue — returns empty array for null', () => {
  assert.deepEqual(deserialiseQueue(null), []);
});

test('deserialiseQueue — returns empty array for undefined', () => {
  assert.deepEqual(deserialiseQueue(undefined), []);
});

test('deserialiseQueue — returns empty array for malformed JSON', () => {
  assert.deepEqual(deserialiseQueue('{not valid json'), []);
  assert.deepEqual(deserialiseQueue('null'), []);
  assert.deepEqual(deserialiseQueue('42'), []);
  assert.deepEqual(deserialiseQueue('"a string"'), []);
});

test('deserialiseQueue — filters items with invalid URLs', () => {
  const bad = JSON.stringify([
    { id: 'x', url: 'javascript:alert(1)', status: 'pending', addedAt: 1 },
    { id: 'y', url: 'https://valid.com', status: 'pending', addedAt: 2 },
  ]);
  const result = deserialiseQueue(bad);
  assert.equal(result.length, 1);
  assert.equal(result[0].url, 'https://valid.com');
});

test('deserialiseQueue — filters items with invalid status', () => {
  const bad = JSON.stringify([
    { id: 'a', url: 'https://a.com', status: 'hacked', addedAt: 1 },
    { id: 'b', url: 'https://b.com', status: 'read',   addedAt: 2 },
  ]);
  const result = deserialiseQueue(bad);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, 'read');
});

test('deserialiseQueue — filters items missing required fields', () => {
  const bad = JSON.stringify([
    { url: 'https://a.com', status: 'pending', addedAt: 1 },   // no id
    { id: 'b', status: 'pending', addedAt: 2 },                 // no url
    { id: 'c', url: 'https://c.com', addedAt: 3 },              // no status
    { id: 'd', url: 'https://d.com', status: 'pending' },       // no addedAt
    { id: 'e', url: 'https://e.com', status: 'pending', addedAt: 5 }, // valid
  ]);
  const result = deserialiseQueue(bad);
  assert.equal(result.length, 1);
  assert.equal(result[0].url, 'https://e.com');
});

// ---------------------------------------------------------------------------
// STORAGE_KEY
// ---------------------------------------------------------------------------

test('STORAGE_KEY — is a non-empty string', () => {
  assert.equal(typeof STORAGE_KEY, 'string');
  assert.ok(STORAGE_KEY.length > 0);
});

// ---------------------------------------------------------------------------
// DEMO_LINKS
// ---------------------------------------------------------------------------

test('DEMO_LINKS — is a non-empty array of valid URLs', () => {
  assert.ok(Array.isArray(DEMO_LINKS));
  assert.ok(DEMO_LINKS.length > 0);
  for (const url of DEMO_LINKS) {
    assert.ok(isValidUrl(url), `Expected valid URL: ${url}`);
  }
});

test('DEMO_LINKS — contains only https URLs', () => {
  for (const url of DEMO_LINKS) {
    assert.ok(url.startsWith('https://'), `Expected https: ${url}`);
  }
});

test('DEMO_LINKS — has no duplicates', () => {
  const deduped = deduplicateUrls(DEMO_LINKS);
  assert.equal(deduped.length, DEMO_LINKS.length);
});
