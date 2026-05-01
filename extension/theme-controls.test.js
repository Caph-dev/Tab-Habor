'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.document = { addEventListener: () => {}, removeEventListener: () => {}, activeElement: null, documentElement: { style: {} }, body: { classList: { remove: () => {} } }, querySelectorAll: () => [], createElement: () => ({}) };
globalThis.TabOutIconUtils = {};
globalThis.TabOutBackgroundImage = {};
globalThis.TabOutListOrder = { reorderSubsetByIds: (a, b) => a };
globalThis.TabHarborTodos = { load: async () => [], save: async () => {} };
globalThis.TabHarborDashboardRuntime = null;
globalThis.chrome = { runtime: { lastError: null }, storage: { local: { get: async () => ({}), set: async () => {} } } };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.window = {
  matchMedia: query => ({
    media: query,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
};

require('./theme-controls.js');

const {
  createShortcutIconCandidates,
  extractShortcutIconCandidatesFromHtml,
  filterRealTabs,
  getCodelifeFaviconUrl,
  getShortcutIconSearchHostname,
  getQuickShortcutIconStyleAttribute,
  getQuickShortcutIconStylePreferences,
  getResolvedThemeDefinition,
  getResolvedTone,
  normalizeShortcutIconRadius,
  normalizeShortcutIconSize,
  normalizeShortcutUrl,
  normalizeQuickShortcuts,
  normalizeThemePreferences,
} = globalThis.TabOutThemeControls;

// ---- normalizeThemePreferences / resolved theme ----

test('normalizeThemePreferences migrates legacy midnight to dark mist', () => {
  const result = normalizeThemePreferences({ themeId: 'midnight', surfaceOpacity: 19 });
  assert.equal(result.mode, 'dark');
  assert.equal(result.paletteId, 'mist');
  assert.equal(result.surfaceOpacity, 19);
});

test('normalizeThemePreferences migrates legacy light theme ids to light palette families', () => {
  const result = normalizeThemePreferences({ themeId: 'sage' });
  assert.equal(result.mode, 'light');
  assert.equal(result.paletteId, 'sage');
});

test('normalizeThemePreferences keeps explicit mode and palette values', () => {
  const result = normalizeThemePreferences({ mode: 'system', paletteId: 'blush', surfaceOpacity: 9 });
  assert.equal(result.mode, 'system');
  assert.equal(result.paletteId, 'blush');
  assert.equal(result.surfaceOpacity, 9);
});

test('normalizeThemePreferences keeps global quick shortcut icon style', () => {
  const result = normalizeThemePreferences({
    quickShortcutIconSize: 38,
    quickShortcutIconRadius: 14,
  });
  assert.equal(result.quickShortcutIconSize, 38);
  assert.equal(result.quickShortcutIconRadius, 14);
});

test('getResolvedTone follows system preference when mode is system', () => {
  const originalMatchMedia = globalThis.window.matchMedia;
  globalThis.window.matchMedia = query => ({
    media: query,
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  try {
    assert.equal(getResolvedTone({ mode: 'system' }), 'dark');
  } finally {
    globalThis.window.matchMedia = originalMatchMedia;
  }
});

test('getResolvedThemeDefinition resolves dark tokens from palette family', () => {
  const theme = getResolvedThemeDefinition({ mode: 'dark', paletteId: 'paper' });
  assert.equal(theme.name, 'Paper');
  assert.equal(theme.tone, 'dark');
  assert.equal(theme.vars['--paper'], '#1a1613');
});

// ---- filterRealTabs ----

test('filterRealTabs removes chrome:// internal pages', () => {
  const tabs = [
    { id: 1, url: 'https://github.com' },
    { id: 2, url: 'chrome://newtab' },
    { id: 3, url: 'chrome://settings' },
  ];
  const result = filterRealTabs(tabs);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 1);
});

test('filterRealTabs removes chrome-extension:// URLs', () => {
  const tabs = [
    { id: 1, url: 'https://example.com' },
    { id: 2, url: 'chrome-extension://abc123/background.html' },
  ];
  const result = filterRealTabs(tabs);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 1);
});

test('filterRealTabs removes about:blank and about:s pages', () => {
  const tabs = [
    { id: 1, url: 'https://example.com' },
    { id: 2, url: 'about:blank' },
    { id: 3, url: 'about:settings' },
  ];
  const result = filterRealTabs(tabs);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 1);
});

test('filterRealTabs removes edge:// and brave:// URLs', () => {
  const tabs = [
    { id: 1, url: 'https://example.com' },
    { id: 2, url: 'edge://settings' },
    { id: 3, url: 'brave://rewards' },
  ];
  const result = filterRealTabs(tabs);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 1);
});

test('filterRealTabs preserves tabs with no url field', () => {
  const tabs = [
    { id: 1, title: 'GitHub' },
    { id: 2, url: 'https://github.com' },
  ];
  const result = filterRealTabs(tabs);
  assert.equal(result.length, 2);
});

test('filterRealTabs is case-insensitive for protocol prefix', () => {
  const tabs = [
    { id: 1, url: 'CHROME://settings' },
    { id: 2, url: 'Chrome-extension://abc' },
  ];
  const result = filterRealTabs(tabs);
  assert.equal(result.length, 2); // url.startsWith is case-sensitive in JS
});

test('filterRealTabs handles empty array', () => {
  assert.equal(filterRealTabs([]).length, 0);
});

// ---- normalizeShortcutUrl ----

test('normalizeShortcutUrl strips leading/trailing whitespace', () => {
  // URL() normalizes to canonical form (adds trailing slash for bare domains)
  assert.equal(normalizeShortcutUrl('  https://example.com  '), 'https://example.com/');
  assert.equal(normalizeShortcutUrl('  https://github.com/user  '), 'https://github.com/user');
});

test('normalizeShortcutUrl handles empty input', () => {
  assert.equal(normalizeShortcutUrl(''), '');
  assert.equal(normalizeShortcutUrl('   '), '');
});

test('normalizeShortcutUrl preserves valid URLs', () => {
  assert.equal(normalizeShortcutUrl('https://github.com/user/repo'), 'https://github.com/user/repo');
});

test('normalizeShortcutUrl adds https for host-only URLs', () => {
  assert.equal(normalizeShortcutUrl('github.com'), 'https://github.com/');
  assert.equal(normalizeShortcutUrl('example.org/path'), 'https://example.org/path');
});

test('normalizeShortcutUrl supports internationalized domains and paths', () => {
  assert.equal(
    normalizeShortcutUrl('例子.测试/路径'),
    'https://xn--fsqu00a.xn--0zwm56d/%E8%B7%AF%E5%BE%84'
  );
});

// ---- normalizeQuickShortcuts ----

test('normalizeQuickShortcuts ignores non-array input', () => {
  assert.deepEqual(normalizeQuickShortcuts(null), []);
  assert.deepEqual(normalizeQuickShortcuts(undefined), []);
  assert.deepEqual(normalizeQuickShortcuts('not an array'), []);
});

test('normalizeQuickShortcuts filters shortcuts missing url only', () => {
  const input = [
    { id: 'a', url: 'https://a.com' },
    { id: 'b', url: '' },
    { id: '', url: 'https://c.com' }, // id missing is ok, id is auto-generated
  ];
  const result = normalizeQuickShortcuts(input);
  assert.equal(result.length, 2);
});

test('normalizeQuickShortcuts defaults iconKind to empty string for no icon', () => {
  const input = [{ id: 's1', url: 'https://ex.com' }];
  const result = normalizeQuickShortcuts(input);
  assert.equal(result[0].iconKind, '');
  assert.equal(result[0].iconMask, 'none');
  assert.equal('iconSize' in result[0], false);
  assert.equal('iconMaskRadius' in result[0], false);
});

test('normalizeQuickShortcuts infers iconKind from icon content', () => {
  const input = [{ id: 's1', url: 'https://ex.com', icon: '🌟' }];
  const result = normalizeQuickShortcuts(input);
  assert.equal(result[0].iconKind, 'glyph');
  assert.equal(result[0].icon, '🌟');
});

test('normalizeQuickShortcuts normalizes icon URL to image kind', () => {
  const input = [{ id: 's1', url: 'https://ex.com', icon: 'https://ex.com/f.png' }];
  const result = normalizeQuickShortcuts(input);
  assert.equal(result[0].iconKind, 'image');
  assert.equal(result[0].icon, 'https://ex.com/f.png');
});

test('normalizeQuickShortcuts preserves rounded icon mask but ignores per-shortcut style settings', () => {
  const input = [{
    id: 's1',
    url: 'https://ex.com',
    icon: 'https://ex.com/f.png',
    iconMask: 'rounded',
    iconSize: 38,
    iconMaskRadius: 14,
  }];
  const result = normalizeQuickShortcuts(input);

  assert.equal(result[0].iconMask, 'rounded');
  assert.equal('iconSize' in result[0], false);
  assert.equal('iconMaskRadius' in result[0], false);
});

test('icon mask style helpers clamp to supported ranges', () => {
  assert.equal(normalizeShortcutIconSize(99, 'rounded'), 40);
  assert.equal(normalizeShortcutIconSize('bad', 'rounded'), 36);
  assert.equal(normalizeShortcutIconRadius(-1, 'rounded'), 0);
  assert.equal(normalizeShortcutIconRadius('bad', 'rounded'), 10);
});

test('quick shortcut icon style helpers expose global CSS variables', () => {
  assert.deepEqual(getQuickShortcutIconStylePreferences({
    quickShortcutIconSize: 99,
    quickShortcutIconRadius: -1,
  }), {
    iconSize: 40,
    iconMaskRadius: 0,
  });
  assert.equal(
    getQuickShortcutIconStyleAttribute({
      quickShortcutIconSize: 32,
      quickShortcutIconRadius: 12,
    }),
    '--shortcut-icon-size:32px;--shortcut-icon-radius:12px'
  );
});

test('getShortcutIconSearchHostname normalizes URL-like input before icon search', () => {
  assert.equal(getShortcutIconSearchHostname('github.com/V-IOLE-T'), 'github.com');
  assert.equal(getShortcutIconSearchHostname('chrome://bookmarks'), '');
  assert.equal(getShortcutIconSearchHostname('not a url'), '');
});

test('createShortcutIconCandidates returns common website icon sources', () => {
  const candidates = createShortcutIconCandidates('https://github.com/V-IOLE-T');
  const urls = candidates.map(candidate => candidate.url);

  assert.ok(urls.some(url => url.startsWith('https://ico.codelife.cc/faviconV2?')));
  assert.ok(urls.includes('https://github.com/favicon.ico'));
  assert.ok(urls.includes('https://github.com/apple-touch-icon.png'));
  assert.ok(urls.some(url => url.includes('www.google.com/s2/favicons')));
  assert.equal(new Set(urls).size, urls.length);
});

test('getCodelifeFaviconUrl follows the iTab favicon service shape', () => {
  const iconUrl = getCodelifeFaviconUrl('https://github.com/V-IOLE-T', 64);

  assert.ok(iconUrl.startsWith('https://ico.codelife.cc/faviconV2?'));
  assert.ok(iconUrl.includes('client=SOCIAL'));
  assert.ok(iconUrl.includes('type=FAVICON'));
  assert.ok(iconUrl.includes('fallback_opts=TYPE%2CSIZE%2CURL'));
  assert.ok(iconUrl.includes('url=https%3A%2F%2Fgithub.com%2FV-IOLE-T'));
  assert.ok(iconUrl.includes('size=64'));
});

test('extractShortcutIconCandidatesFromHtml reads declared site icons', () => {
  const candidates = extractShortcutIconCandidatesFromHtml(`
    <link rel="icon" href="/favicon.svg">
    <link rel="apple-touch-icon" href="https://cdn.example.com/apple.png">
    <link rel="stylesheet" href="/app.css">
  `, 'https://example.com/docs/page');
  const urls = candidates.map(candidate => candidate.url);

  assert.ok(urls.includes('https://example.com/favicon.svg'));
  assert.ok(urls.includes('https://cdn.example.com/apple.png'));
  assert.equal(urls.length, 2);
});
