'use strict';

const {
  t: themeT,
} = globalThis.TabHarborI18n || {};

const {
  escapeHtml: themeEscapeHtml,
  escapeHtmlAttribute: themeEscapeHtmlAttribute,
  getFallbackLabel: themeGetFallbackLabel,
  getGoogleFaviconUrl: themeGetGoogleFaviconUrl,
  getIconSources: themeGetIconSources,
} = globalThis.TabOutIconUtils || {};

const {
  compressImageFileForStorage: themeCompressImageFileForStorage,
} = globalThis.TabOutBackgroundImage || {};

const {
  reorderSubsetByIds: themeReorderSubsetByIds,
} = globalThis.TabOutListOrder || {};

let themeMenuOpen = false;
let shortcutEditorState = {
  open: false,
  mode: 'create',
  shortcutId: '',
  url: '',
  label: '',
  icon: '',
  iconKind: '',
  presentation: 'default',
  returnToTabPicker: false,
  focusReturnEl: null,
};
let quickShortcutDragState = null;
let quickShortcutDraggedId = '';
let quickShortcutDraggedEl = null;
let quickShortcutGhostEl = null;
let quickShortcutSlotEl = null;
let quickShortcutSuppressClickUntil = 0;
let quickShortcutMiddleClickSuppressUntil = 0;
let shortcutIconSearchState = {
  token: 0,
  status: 'idle',
  candidates: [],
  message: '',
};

// ---- Tab Picker state ----
let tabPickerOpen = false;
let tabPickerMode = 'tabs';
let tabPickerSearchQuery = '';
let tabPickerSelectedIds = new Set();
let tabPickerFocusReturnEl = null;
let tabPickerManualDraft = { url: '', label: '' };
const THEME_PREFERENCES_KEY = 'themePreferences';
const QUICK_SHORTCUTS_KEY = 'quickShortcuts';
const FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([hidden])',
  '[href]:not([hidden])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const THEME_MODE_ORDER = ['system', 'light', 'dark'];
const THEME_PALETTE_ORDER = ['paper', 'sage', 'mist', 'blush'];
const VALID_THEME_MODES = new Set(THEME_MODE_ORDER);
const VALID_THEME_PALETTES = new Set(THEME_PALETTE_ORDER);
const SHORTCUT_ICON_SEARCH_TIMEOUT = 2600;
const SHORTCUT_ICON_DEFAULT_SIZE = 30;
const SHORTCUT_ICON_MASK_SIZE = 36;
const SHORTCUT_ICON_DEFAULT_RADIUS = 0;
const SHORTCUT_ICON_MASK_RADIUS = 10;
const SHORTCUT_ICON_MIN_SIZE = 24;
const SHORTCUT_ICON_MAX_SIZE = 40;
const SHORTCUT_ICON_MIN_RADIUS = 0;
const SHORTCUT_ICON_MAX_RADIUS = 20;
const THEME_MODE_LABEL_KEYS = {
  system: 'themeModeSystem',
  light: 'themeModeLight',
  dark: 'themeModeDark',
};
const LEGACY_THEME_MIGRATION = {
  paper: { mode: 'light', paletteId: 'paper' },
  sage: { mode: 'light', paletteId: 'sage' },
  mist: { mode: 'light', paletteId: 'mist' },
  blush: { mode: 'light', paletteId: 'blush' },
  midnight: { mode: 'dark', paletteId: 'mist' },
};
const THEME_FAMILIES = {
  paper: {
    name: 'Paper',
    meta: 'Warm neutral',
    light: {
      '--ink': '#1a1613',
      '--paper': '#f8f5f0',
      '--warm-gray': '#e8e2da',
      '--muted': '#9a918a',
      '--accent-amber': '#c8713a',
      '--accent-sage': '#5a7a62',
      '--accent-slate': '#5a6b7a',
      '--accent-rose': '#b35a5a',
      '--workspace-accent': '#8a653f',
      '--workspace-accent-soft': '#f2e7db',
      '--workspace-accent-border': '#d4b396',
      '--workspace-accent-contrast': '#fffaf5',
      '--status-active': '#3d7a4a',
      '--status-cooling': '#b8892e',
      '--status-abandoned': '#b35a5a',
      '--card-bg': '#fffdf9',
    },
    dark: {
      '--ink': '#e8e2da',
      '--paper': '#1a1613',
      '--warm-gray': '#2d2722',
      '--muted': '#7a726a',
      '--accent-amber': '#d4854a',
      '--accent-sage': '#6a8a72',
      '--accent-slate': '#6a7b8a',
      '--accent-rose': '#b37a7a',
      '--workspace-accent': '#a0754f',
      '--workspace-accent-soft': '#2d2722',
      '--workspace-accent-border': '#5a4a3a',
      '--workspace-accent-contrast': '#f8f5f0',
      '--status-active': '#5a9a6a',
      '--status-cooling': '#c89a3a',
      '--status-abandoned': '#c36a6a',
      '--card-bg': '#231f1a',
    },
  },
  sage: {
    name: 'Sage',
    meta: 'Soft green',
    light: {
      '--ink': '#172018',
      '--paper': '#eef2eb',
      '--warm-gray': '#dbe3d7',
      '--muted': '#7f8c81',
      '--accent-amber': '#8b7146',
      '--accent-sage': '#4d6f57',
      '--accent-slate': '#5e7072',
      '--accent-rose': '#9a6860',
      '--workspace-accent': '#4f7657',
      '--workspace-accent-soft': '#deebe1',
      '--workspace-accent-border': '#9ebda6',
      '--workspace-accent-contrast': '#f6fbf7',
      '--status-active': '#446953',
      '--status-cooling': '#907548',
      '--status-abandoned': '#996760',
      '--card-bg': '#fafcf8',
    },
    dark: {
      '--ink': '#d8e3d7',
      '--paper': '#172018',
      '--warm-gray': '#252d25',
      '--muted': '#6a7a6a',
      '--accent-amber': '#9a8a5a',
      '--accent-sage': '#6a9a7a',
      '--accent-slate': '#6a7a8a',
      '--accent-rose': '#9a7a7a',
      '--workspace-accent': '#5a8a6a',
      '--workspace-accent-soft': '#252d25',
      '--workspace-accent-border': '#3a4a3a',
      '--workspace-accent-contrast': '#eef2eb',
      '--status-active': '#5a9a7a',
      '--status-cooling': '#b89a4a',
      '--status-abandoned': '#c36a6a',
      '--card-bg': '#1e261e',
    },
  },
  mist: {
    name: 'Mist',
    meta: 'Cool neutral',
    light: {
      '--ink': '#161c21',
      '--paper': '#eef2f5',
      '--warm-gray': '#d8dee5',
      '--muted': '#7d8791',
      '--accent-amber': '#927255',
      '--accent-sage': '#5d7569',
      '--accent-slate': '#4f687a',
      '--accent-rose': '#9b6b71',
      '--workspace-accent': '#4f6d88',
      '--workspace-accent-soft': '#dde7f0',
      '--workspace-accent-border': '#9fb2c5',
      '--workspace-accent-contrast': '#f7fafc',
      '--status-active': '#4e6c61',
      '--status-cooling': '#94724a',
      '--status-abandoned': '#93636c',
      '--card-bg': '#fafcfd',
    },
    dark: {
      '--ink': '#d8dee5',
      '--paper': '#161c21',
      '--warm-gray': '#252d35',
      '--muted': '#5d6771',
      '--accent-amber': '#a08a6a',
      '--accent-sage': '#6a8a7a',
      '--accent-slate': '#6a8a9a',
      '--accent-rose': '#9a7a7a',
      '--workspace-accent': '#6a8a9a',
      '--workspace-accent-soft': '#252d35',
      '--workspace-accent-border': '#3a4a5a',
      '--workspace-accent-contrast': '#f8f5f0',
      '--status-active': '#5a9a7a',
      '--status-cooling': '#c8a83a',
      '--status-abandoned': '#c36a6a',
      '--card-bg': '#1c232b',
    },
  },
  blush: {
    name: 'Blush',
    meta: 'Soft clay',
    light: {
      '--ink': '#201716',
      '--paper': '#f6efec',
      '--warm-gray': '#e5d8d2',
      '--muted': '#97827c',
      '--accent-amber': '#a06d4f',
      '--accent-sage': '#6a7866',
      '--accent-slate': '#64707a',
      '--accent-rose': '#ad6966',
      '--workspace-accent': '#a5656f',
      '--workspace-accent-soft': '#f2dfe1',
      '--workspace-accent-border': '#d2a1a7',
      '--workspace-accent-contrast': '#fff7f8',
      '--status-active': '#5a7162',
      '--status-cooling': '#9c7448',
      '--status-abandoned': '#a96262',
      '--card-bg': '#fffaf7',
    },
    dark: {
      '--ink': '#e8e2da',
      '--paper': '#201716',
      '--warm-gray': '#332a2a',
      '--muted': '#8a7a7a',
      '--accent-amber': '#a06d4f',
      '--accent-sage': '#6a7a6a',
      '--accent-slate': '#6a7a8a',
      '--accent-rose': '#c37a7a',
      '--workspace-accent': '#a5656f',
      '--workspace-accent-soft': '#332a2a',
      '--workspace-accent-border': '#5a4a4a',
      '--workspace-accent-contrast': '#f6efec',
      '--status-active': '#5a9a7a',
      '--status-cooling': '#b89a4a',
      '--status-abandoned': '#c36a6a',
      '--card-bg': '#281f1f',
    },
  },
};

let themePreferences = {
  mode: 'system',
  paletteId: 'paper',
  customBackground: '',
  surfaceOpacity: 14,
  quickShortcutIconSize: SHORTCUT_ICON_DEFAULT_SIZE,
  quickShortcutIconRadius: SHORTCUT_ICON_MASK_RADIUS,
  hitokotoEnabled: true,
};

let systemThemeMediaQuery = null;
let systemThemeListener = null;

function normalizeThemePreferences(input) {
  const next = input && typeof input === 'object' ? input : {};
  const legacyThemeId = String(next.themeId || '');
  const migrated = LEGACY_THEME_MIGRATION[legacyThemeId] || null;
  const rawMode = String(next.mode || migrated?.mode || 'system');
  const rawPaletteId = String(next.paletteId || migrated?.paletteId || 'paper');
  const rawOpacity = Number(next.surfaceOpacity);
  const surfaceOpacity = Number.isFinite(rawOpacity)
    ? Math.min(60, Math.max(2, Math.round(rawOpacity)))
    : 14;
  const shortcutIconStyle = getQuickShortcutIconStylePreferences(next);
  return {
    mode: VALID_THEME_MODES.has(rawMode) ? rawMode : 'system',
    paletteId: VALID_THEME_PALETTES.has(rawPaletteId) ? rawPaletteId : 'paper',
    customBackground: typeof next.customBackground === 'string' ? next.customBackground : '',
    surfaceOpacity,
    quickShortcutIconSize: shortcutIconStyle.iconSize,
    quickShortcutIconRadius: shortcutIconStyle.iconMaskRadius,
    hitokotoEnabled: next.hitokotoEnabled !== false,
  };
}

function normalizeQuickShortcuts(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(item => item && item.url)
    .map(item => {
      const normalizedIcon = normalizeShortcutIcon(item.icon || item.customIcon || '');
      const iconMask = String(item.iconMask || '') === 'rounded' ? 'rounded' : 'none';
      return {
        id: String(item.id || `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        url: String(item.url).trim(),
        label: String(item.label || '').trim(),
        icon: normalizedIcon.value,
        iconKind: normalizedIcon.kind,
        iconMask,
      };
    })
    .filter(item => item.url);
}

function clampNumber(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function normalizeShortcutIconSize(value, iconMask = 'none') {
  return clampNumber(
    value,
    SHORTCUT_ICON_MIN_SIZE,
    SHORTCUT_ICON_MAX_SIZE,
    iconMask === 'rounded' ? SHORTCUT_ICON_MASK_SIZE : SHORTCUT_ICON_DEFAULT_SIZE
  );
}

function normalizeShortcutIconRadius(value, iconMask = 'none') {
  return clampNumber(
    value,
    SHORTCUT_ICON_MIN_RADIUS,
    SHORTCUT_ICON_MAX_RADIUS,
    iconMask === 'rounded' ? SHORTCUT_ICON_MASK_RADIUS : SHORTCUT_ICON_DEFAULT_RADIUS
  );
}

function getQuickShortcutIconStylePreferences(input = themePreferences) {
  const next = input && typeof input === 'object' ? input : {};
  return {
    iconSize: normalizeShortcutIconSize(next.quickShortcutIconSize, 'none'),
    iconMaskRadius: normalizeShortcutIconRadius(next.quickShortcutIconRadius, 'rounded'),
  };
}

function isSvgMarkup(value) {
  const text = String(value || '').trim();
  return /^<svg[\s>]/i.test(text) || /^<\?xml[\s\S]*<svg[\s>]/i.test(text);
}

function svgToDataUrl(svgText) {
  const normalized = String(svgText || '').trim();
  if (!normalized) return '';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalized)}`;
}

function extractIconFromClipboardHtml(html) {
  const raw = String(html || '').trim();
  if (!raw) return { value: '', kind: '' };

  if (isSvgMarkup(raw)) {
    return { value: raw, kind: 'svg' };
  }

  const imageMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imageMatch?.[1]) {
    const src = imageMatch[1].trim();
    if (/^data:image\//i.test(src)) {
      return { value: src, kind: 'image' };
    }
  }

  const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (svgMatch?.[0]) {
    return { value: svgMatch[0], kind: 'svg' };
  }

  return { value: '', kind: '' };
}

function isTransientClipboardReference(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  return (
    /^file:\/\//i.test(text) ||
    /^blob:/i.test(text) ||
    /^\/(private|var|tmp|Users)\//.test(text) ||
    /^[A-Za-z]:\\/.test(text)
  );
}

function getSystemThemeMode() {
  return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function getResolvedTone(preferences = themePreferences) {
  const normalized = normalizeThemePreferences(preferences);
  if (normalized.mode === 'system') {
    return getSystemThemeMode();
  }
  return normalized.mode;
}

function getThemeFamilyDefinition(paletteId) {
  return THEME_FAMILIES[paletteId] || THEME_FAMILIES.paper;
}

function getResolvedThemeDefinition(preferences = themePreferences) {
  const normalized = normalizeThemePreferences(preferences);
  const resolvedTone = getResolvedTone(normalized);
  const family = getThemeFamilyDefinition(normalized.paletteId);
  return {
    id: normalized.paletteId,
    name: family.name,
    meta: family.meta,
    tone: resolvedTone,
    vars: family[resolvedTone],
  };
}

function getPalettePreviewStyle(paletteId) {
  const family = getThemeFamilyDefinition(paletteId);
  return `--theme-paper:${family.light['--paper']};--theme-accent:${family.light['--accent-amber']};`;
}

function syncSystemThemeSubscription() {
  if (systemThemeMediaQuery && systemThemeListener) {
    if (typeof systemThemeMediaQuery.removeEventListener === 'function') {
      systemThemeMediaQuery.removeEventListener('change', systemThemeListener);
    } else if (typeof systemThemeMediaQuery.removeListener === 'function') {
      systemThemeMediaQuery.removeListener(systemThemeListener);
    }
  }

  systemThemeMediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') || null;
  systemThemeListener = null;
  if (!systemThemeMediaQuery) return;

  systemThemeListener = () => {
    if (themePreferences.mode !== 'system') return;
    applyThemePreferences();
    renderThemeMenu();
  };

  if (typeof systemThemeMediaQuery.addEventListener === 'function') {
    systemThemeMediaQuery.addEventListener('change', systemThemeListener);
  } else if (typeof systemThemeMediaQuery.addListener === 'function') {
    systemThemeMediaQuery.addListener(systemThemeListener);
  }
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

function focusFirstElement(container) {
  if (!container) return null;
  const target = container.querySelector(FOCUSABLE_SELECTOR);
  target?.focus?.({ preventScroll: true });
  return target || null;
}

function setThemeMenuOpen(nextOpen, { restoreFocus = false } = {}) {
  themeMenuOpen = Boolean(nextOpen);
  renderThemeMenu();

  if (themeMenuOpen) {
    const panel = document.getElementById('themeMenuPanel');
    requestAnimationFrame(() => {
      focusFirstElement(panel);
    });
    return;
  }

  if (restoreFocus) {
    document.getElementById('themeMenuTrigger')?.focus?.({ preventScroll: true });
  }
}

function hexToRgbChannels(hex) {
  const value = String(hex || '').replace('#', '');
  if (value.length !== 6) return '248 245 240';

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function computeThemeOpacityVars(surfaceOpacity) {
  return {
    '--custom-surface-opacity': `${surfaceOpacity}%`,
    '--custom-border-opacity': `${Math.max(8, surfaceOpacity)}%`,
    '--custom-badge-opacity': `${Math.max(3, Math.round(surfaceOpacity * 0.28))}%`,
    '--custom-fallback-opacity': `${Math.max(4, Math.round(surfaceOpacity * 0.36))}%`,
  };
}

function computeQuickShortcutIconStyleVars(input = themePreferences) {
  const shortcutIconStyle = getQuickShortcutIconStylePreferences(input);
  return {
    '--shortcut-icon-size': `${shortcutIconStyle.iconSize}px`,
    '--shortcut-icon-radius': `${shortcutIconStyle.iconMaskRadius}px`,
  };
}

function getQuickShortcutIconStyleAttribute(input = themePreferences) {
  return Object.entries(computeQuickShortcutIconStyleVars(input))
    .map(([name, value]) => `${name}:${value}`)
    .join(';');
}

function applyThemePreferences() {
  const root = document.documentElement;
  const body = document.body;
  const theme = getResolvedThemeDefinition(themePreferences);
  const opacityVars = computeThemeOpacityVars(themePreferences.surfaceOpacity);
  const shortcutIconVars = computeQuickShortcutIconStyleVars(themePreferences);

  Object.entries(theme.vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  Object.entries(opacityVars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  Object.entries(shortcutIconVars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  if (body) {
    body.classList.toggle('theme-tone-light', theme.tone === 'light');
    body.classList.toggle('theme-tone-dark', theme.tone === 'dark');
  }

  if (themePreferences.customBackground) {
    root.style.setProperty('--page-custom-background', `url("${themePreferences.customBackground}")`);
    if (body) {
      const paperRgb = hexToRgbChannels(theme.vars['--paper']);
      body.style.backgroundImage = `linear-gradient(rgba(${paperRgb} / 0.26), rgba(${paperRgb} / 0.26)), url("${themePreferences.customBackground}")`;
      body.classList.add('has-custom-background');
    }
  } else {
    root.style.setProperty('--page-custom-background', 'none');
    if (body) {
      body.style.removeProperty('background-image');
      body.classList.remove('has-custom-background');
    }
  }
}

function renderThemeMenu() {
  const trigger = document.getElementById('themeMenuTrigger');
  const modeOptions = document.getElementById('themeModeOptions');
  const pinToggle = document.getElementById('headerPinToggle');
  const panel = document.getElementById('themeMenuPanel');
  const options = document.getElementById('themeOptions');
  const transparencyRange = document.getElementById('themeTransparencyRange');
  const transparencyValue = document.getElementById('themeTransparencyValue');
  if (!trigger || !panel || !modeOptions || !options || !transparencyRange || !transparencyValue) return;

  trigger.setAttribute('aria-expanded', String(themeMenuOpen));
  panel.hidden = !themeMenuOpen;
  transparencyRange.value = String(themePreferences.surfaceOpacity);
  transparencyValue.textContent = `${themePreferences.surfaceOpacity}%`;
  if (pinToggle && typeof groupOrderState !== 'undefined') {
    const pinTooltip = groupOrderState.pinEnabled
      ? (themeT ? themeT('pinnedOrder') : 'Pinned order')
      : (themeT ? themeT('pinOrder') : 'Pin order');
    pinToggle.classList.toggle('is-active', groupOrderState.pinEnabled);
    pinToggle.dataset.tooltip = pinTooltip;
    pinToggle.setAttribute('aria-label', pinTooltip);
    pinToggle.setAttribute('aria-pressed', String(groupOrderState.pinEnabled));
  }

  modeOptions.innerHTML = THEME_MODE_ORDER.map(id => `
    <button
      class="theme-mode-option ${themePreferences.mode === id ? 'is-active' : ''}"
      type="button"
      data-action="select-theme-mode"
      data-theme-mode="${id}"
      aria-pressed="${themePreferences.mode === id}"
    >${themeT ? themeT(THEME_MODE_LABEL_KEYS[id]) : id}</button>
  `).join('');

  options.innerHTML = THEME_PALETTE_ORDER.map(id => {
    const family = getThemeFamilyDefinition(id);
    return `
    <button
      class="theme-option ${themePreferences.paletteId === id ? 'is-active' : ''}"
      type="button"
      data-action="select-theme"
      data-palette-id="${id}"
      aria-pressed="${themePreferences.paletteId === id}"
      style="${getPalettePreviewStyle(id)}"
    >
      <span class="theme-option-main">
        <span class="theme-option-swatch" aria-hidden="true"></span>
        <span>
          <span class="theme-option-name">${themeEscapeHtml ? themeEscapeHtml(family.name) : family.name}</span>
        </span>
      </span>
      <span class="theme-option-check" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" /></svg>
      </span>
    </button>
  `;
  }).join('');
}

async function getQuickShortcuts() {
  const stored = await chrome.storage.local.get(QUICK_SHORTCUTS_KEY);
  return normalizeQuickShortcuts(stored[QUICK_SHORTCUTS_KEY]);
}

async function saveQuickShortcuts(shortcuts) {
  const normalized = normalizeQuickShortcuts(shortcuts);
  await chrome.storage.local.set({ [QUICK_SHORTCUTS_KEY]: normalized });
  return normalized;
}

async function removeQuickShortcutById(shortcutId) {
  if (!shortcutId) return await getQuickShortcuts();
  const shortcuts = await getQuickShortcuts();
  return await saveQuickShortcuts(shortcuts.filter(item => item.id !== shortcutId));
}

async function saveQuickShortcutOrder(orderIds) {
  const shortcuts = await getQuickShortcuts();
  if (!Array.isArray(orderIds) || !orderIds.length || !themeReorderSubsetByIds) {
    return shortcuts;
  }
  return await saveQuickShortcuts(themeReorderSubsetByIds(shortcuts, orderIds));
}

function normalizeShortcutUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  const withProtocol = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return '';
  }
}

function normalizeShortcutIcon(input) {
  const raw = String(input || '').trim();
  if (!raw) return { value: '', kind: '' };

  if (isSvgMarkup(raw)) {
    return { value: raw, kind: 'svg' };
  }

  if (/^data:image\//i.test(raw)) {
    return { value: raw, kind: 'image' };
  }

  if (/^[a-z]+:\/\//i.test(raw) || raw.includes('.') || raw.startsWith('/')) {
    const normalizedUrl = normalizeShortcutUrl(raw);
    if (normalizedUrl) {
      return { value: normalizedUrl, kind: 'image' };
    }
  }

  const glyph = [...raw].slice(0, 2).join('');
  return { value: glyph, kind: glyph ? 'glyph' : '' };
}

function getShortcutIconSearchHostname(input) {
  const normalizedUrl = normalizeShortcutUrl(input);
  if (!normalizedUrl) return '';
  try {
    const url = new URL(normalizedUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.hostname;
  } catch {
    return '';
  }
}

function getCodelifeFaviconUrl(input, size = 64) {
  const normalizedUrl = normalizeShortcutUrl(input);
  if (!normalizedUrl) return '';
  try {
    const url = new URL(normalizedUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const params = new URLSearchParams({
      client: 'SOCIAL',
      type: 'FAVICON',
      fallback_opts: 'TYPE,SIZE,URL',
      url: normalizedUrl,
      size: String(size),
    });
    return `https://ico.codelife.cc/faviconV2?${params.toString()}`;
  } catch {
    return '';
  }
}

function createShortcutIconCandidates(input) {
  const hostname = getShortcutIconSearchHostname(input);
  if (!hostname) return [];

  const origin = `https://${hostname}`;
  const googleFaviconUrl = typeof themeGetGoogleFaviconUrl === 'function'
    ? themeGetGoogleFaviconUrl
    : ((host, size = 32) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`);
  const rawCandidates = [
    { id: 'codelife-32', label: 'iTab match 32px', url: getCodelifeFaviconUrl(input, 32) },
    { id: 'codelife-64', label: 'iTab match 64px', url: getCodelifeFaviconUrl(input, 64) },
    { id: 'codelife-128', label: 'iTab match 128px', url: getCodelifeFaviconUrl(input, 128) },
    { id: 'site-favicon', label: 'Site favicon', url: `${origin}/favicon.ico` },
    { id: 'apple-touch-icon', label: 'Apple touch icon', url: `${origin}/apple-touch-icon.png` },
    { id: 'apple-touch-icon-precomposed', label: 'Touch icon', url: `${origin}/apple-touch-icon-precomposed.png` },
    { id: 'favicon-32', label: '32px favicon', url: `${origin}/favicon-32x32.png` },
    { id: 'favicon-192', label: '192px icon', url: `${origin}/android-chrome-192x192.png` },
    { id: 'google-32', label: 'Google 32px', url: googleFaviconUrl(hostname, 32) },
    { id: 'google-64', label: 'Google 64px', url: googleFaviconUrl(hostname, 64) },
    { id: 'google-128', label: 'Google 128px', url: googleFaviconUrl(hostname, 128) },
  ];

  const seen = new Set();
  return rawCandidates.filter(candidate => {
    if (!candidate.url || seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

function resolveShortcutIconUrl(value, pageUrl) {
  const raw = String(value || '').trim();
  if (!raw || /^data:/i.test(raw)) return '';
  try {
    const resolved = new URL(raw, pageUrl);
    if (!['http:', 'https:'].includes(resolved.protocol)) return '';
    return resolved.toString();
  } catch {
    return '';
  }
}

function extractShortcutIconCandidatesFromHtml(html, pageUrl) {
  const raw = String(html || '');
  if (!raw || !pageUrl) return [];
  const candidates = [];
  const seen = new Set();
  const linkPattern = /<link\b[^>]*>/gi;
  let match;

  while ((match = linkPattern.exec(raw))) {
    const tag = match[0];
    const rel = tag.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    if (!/\b(?:icon|apple-touch-icon|mask-icon)\b/i.test(rel)) continue;

    const href = tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    const resolvedUrl = resolveShortcutIconUrl(href, pageUrl);
    if (!resolvedUrl || seen.has(resolvedUrl)) continue;
    seen.add(resolvedUrl);

    const label = /\bapple-touch-icon\b/i.test(rel)
      ? 'Apple touch icon'
      : /\bmask-icon\b/i.test(rel)
        ? 'Mask icon'
        : 'Site icon';
    candidates.push({ id: `html-${candidates.length}`, label, url: resolvedUrl });
  }

  return candidates;
}

function createShortcutEditorState(input = {}) {
  const globalIconStyle = getQuickShortcutIconStylePreferences(themePreferences);
  return {
    open: Boolean(input.open),
    mode: input.mode === 'edit' ? 'edit' : 'create',
    shortcutId: String(input.shortcutId || ''),
    url: String(input.url || ''),
    label: String(input.label || ''),
    icon: String(input.icon || ''),
    iconKind: String(input.iconKind || 'site'),
    iconMask: input.iconMask === 'rounded' ? 'rounded' : 'none',
    iconSize: globalIconStyle.iconSize,
    iconMaskRadius: globalIconStyle.iconMaskRadius,
    presentation: input.presentation === 'tab-picker' ? 'tab-picker' : 'default',
    returnToTabPicker: Boolean(input.returnToTabPicker),
    focusReturnEl: input.focusReturnEl instanceof HTMLElement ? input.focusReturnEl : null,
  };
}

function createTabPickerManualDraft(input = {}) {
  return {
    url: String(input.url || ''),
    label: String(input.label || ''),
  };
}

function getShortcutEditorElements() {
  return {
    modalBackdrop: document.getElementById('shortcutEditorBackdrop'),
    modalPanel: document.getElementById('shortcutEditor'),
    embeddedHost: document.getElementById('tabPickerEditorHost'),
    form: document.getElementById('shortcutEditorForm'),
    title: document.getElementById('shortcutEditorTitle'),
    back: document.getElementById('shortcutEditorBack'),
    url: document.getElementById('shortcutEditorUrl'),
    label: document.getElementById('shortcutEditorLabel'),
    source: document.getElementById('shortcutEditorSource'),
    sourceButtons: [...document.querySelectorAll('[data-action="select-shortcut-source"]')],
    emoji: document.getElementById('shortcutEditorEmoji'),
    svgCode: document.getElementById('shortcutEditorSvgCode'),
    siteGroup: document.getElementById('shortcutEditorSiteGroup'),
    emojiGroup: document.getElementById('shortcutEditorEmojiGroup'),
    imageGroup: document.getElementById('shortcutEditorImageGroup'),
    svgGroup: document.getElementById('shortcutEditorSvgGroup'),
    styleGroup: document.getElementById('shortcutEditorStyleGroup'),
    maskButtons: [...document.querySelectorAll('[data-action="set-shortcut-icon-mask"]')],
    iconSize: document.getElementById('shortcutEditorIconSize'),
    iconRadius: document.getElementById('shortcutEditorIconRadius'),
    iconSizeValue: document.getElementById('shortcutEditorIconSizeValue'),
    iconRadiusValue: document.getElementById('shortcutEditorIconRadiusValue'),
    iconSearchStatus: document.getElementById('shortcutEditorIconSearchStatus'),
    iconCandidates: document.getElementById('shortcutEditorIconCandidates'),
    preview: document.getElementById('shortcutEditorPreview'),
    previewFallback: document.getElementById('shortcutEditorPreviewFallback'),
    previewTitle: document.getElementById('shortcutEditorPreviewTitle'),
    previewMeta: document.getElementById('shortcutEditorPreviewMeta'),
    fileInput: document.getElementById('shortcutIconFileInput'),
  };
}

function getTabPickerElements() {
  return {
    panel: document.getElementById('tabPicker'),
    tabsTab: document.getElementById('tabPickerTabsTab'),
    urlTab: document.getElementById('tabPickerUrlTab'),
    searchWrap: document.getElementById('tabPickerSearchWrap'),
    search: document.getElementById('tabPickerSearch'),
    list: document.getElementById('tabPickerList'),
    editorHost: document.getElementById('tabPickerEditorHost'),
    footer: document.getElementById('tabPickerFooter'),
  };
}

function syncFormControlValue(element, nextValue) {
  if (!element) return;
  const normalized = String(nextValue || '');
  const isActive = element === document.activeElement;
  if (element.dataset.composing === 'true') return;
  if (isActive && element.value === normalized) return;
  if (element.value !== normalized) {
    element.value = normalized;
  }
}

function getShortcutIconSearchStatusText() {
  if (shortcutIconSearchState.message) return shortcutIconSearchState.message;
  if (shortcutIconSearchState.status === 'loading') {
    return themeT ? themeT('shortcutIconSearchLoading') : 'Searching website icons...';
  }
  if (shortcutIconSearchState.status === 'empty') {
    return themeT ? themeT('shortcutIconSearchEmpty') : 'No usable icons found for this website.';
  }
  if (shortcutIconSearchState.status === 'error') {
    return themeT ? themeT('shortcutIconSearchError') : 'Could not search icons for this website.';
  }
  return '';
}

function renderShortcutIconSearch(elements = getShortcutEditorElements()) {
  if (elements.iconSearchStatus) {
    const statusText = getShortcutIconSearchStatusText();
    elements.iconSearchStatus.hidden = !statusText;
    elements.iconSearchStatus.textContent = statusText;
  }

  if (!elements.iconCandidates) return;
  elements.iconCandidates.innerHTML = '';
  shortcutIconSearchState.candidates.forEach(candidate => {
    const button = document.createElement('button');
    button.className = 'shortcut-editor-icon-candidate';
    button.type = 'button';
    button.dataset.action = 'select-shortcut-icon-candidate';
    button.dataset.iconUrl = candidate.url;
    button.setAttribute('aria-label', candidate.label);

    const image = document.createElement('img');
    image.src = candidate.url;
    image.alt = '';
    image.loading = 'lazy';
    button.appendChild(image);

    const label = document.createElement('span');
    label.textContent = candidate.label;
    button.appendChild(label);

    elements.iconCandidates.appendChild(button);
  });
}

function syncShortcutEditorStyleControls(elements = getShortcutEditorElements()) {
  const showStyleControls = ['site', 'image', 'svg', 'glyph'].includes(shortcutEditorState.iconKind);
  if (elements.styleGroup) {
    elements.styleGroup.hidden = !showStyleControls;
  }
  elements.maskButtons.forEach(button => {
    const isSelected = button.dataset.mask === shortcutEditorState.iconMask;
    button.setAttribute('aria-pressed', String(isSelected));
  });
  syncFormControlValue(elements.iconSize, shortcutEditorState.iconSize);
  syncFormControlValue(elements.iconRadius, shortcutEditorState.iconMaskRadius);
  if (elements.iconSizeValue) {
    elements.iconSizeValue.textContent = `${shortcutEditorState.iconSize} px`;
  }
  if (elements.iconRadiusValue) {
    elements.iconRadiusValue.textContent = `${shortcutEditorState.iconMaskRadius} px`;
  }
}

async function saveGlobalShortcutIconStyle(nextStyle = {}) {
  const normalizedStyle = getQuickShortcutIconStylePreferences({
    ...themePreferences,
    ...nextStyle,
  });
  themePreferences = normalizeThemePreferences({
    ...themePreferences,
    quickShortcutIconSize: normalizedStyle.iconSize,
    quickShortcutIconRadius: normalizedStyle.iconMaskRadius,
  });
  await chrome.storage.local.set({ [THEME_PREFERENCES_KEY]: themePreferences });
  shortcutEditorState = createShortcutEditorState(shortcutEditorState);
  applyThemePreferences();
  syncShortcutEditor();
  await renderQuickShortcuts();
  return normalizedStyle;
}

function resetShortcutEditorPosition(panel) {
  if (!panel) return;
  panel.style.removeProperty('left');
  panel.style.removeProperty('top');
  panel.style.removeProperty('right');
  panel.style.removeProperty('bottom');
  panel.style.removeProperty('inset');
}

function positionShortcutEditor(triggerEl = null) {
  if (shortcutEditorState.presentation === 'tab-picker') return;

  const panel = document.getElementById('shortcutEditor');
  if (!panel) return;

  if (!(triggerEl instanceof HTMLElement)) {
    resetShortcutEditorPosition(panel);
    return;
  }

  const viewportPadding = 16;
  const offset = 14;
  const triggerRect = triggerEl.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const panelWidth = panelRect.width || 360;
  const panelHeight = panelRect.height || 420;

  const fitsBelow = triggerRect.bottom + offset + panelHeight <= window.innerHeight - viewportPadding;
  const top = fitsBelow
    ? triggerRect.bottom + offset
    : Math.max(viewportPadding, triggerRect.top - panelHeight - offset);
  const left = Math.min(
    Math.max(triggerRect.left - 8, viewportPadding),
    window.innerWidth - panelWidth - viewportPadding
  );

  panel.style.inset = 'auto';
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

function restoreShortcutEditorHome() {
  const elements = getShortcutEditorElements();
  if (!elements.form || !elements.modalPanel) return;
  if (elements.form.parentElement !== elements.modalPanel) {
    elements.modalPanel.appendChild(elements.form);
  }
}

function mountShortcutEditorInTabPicker() {
  const elements = getShortcutEditorElements();
  if (!elements.form || !elements.embeddedHost) return;
  if (elements.form.parentElement !== elements.embeddedHost) {
    elements.embeddedHost.appendChild(elements.form);
  }
}

function syncShortcutEditor() {
  const elements = getShortcutEditorElements();
  if (!elements.form) return;

  const isEmbedded = shortcutEditorState.presentation === 'tab-picker';
  if (isEmbedded) {
    mountShortcutEditorInTabPicker();
    if (elements.modalPanel) elements.modalPanel.hidden = true;
    if (elements.modalBackdrop) elements.modalBackdrop.hidden = true;
    if (elements.embeddedHost) elements.embeddedHost.hidden = !shortcutEditorState.open;
    elements.form.classList.add('is-tab-picker-pane');
  } else {
    restoreShortcutEditorHome();
    if (elements.modalPanel) elements.modalPanel.hidden = !shortcutEditorState.open;
    if (elements.modalBackdrop) elements.modalBackdrop.hidden = !shortcutEditorState.open;
    if (elements.embeddedHost) elements.embeddedHost.hidden = true;
    elements.form.classList.remove('is-tab-picker-pane');
  }

  if (elements.back) {
    elements.back.hidden = true;
  }
  if (shortcutEditorState.presentation === 'tab-picker' && shortcutEditorState.mode === 'create') {
    elements.title.textContent = themeT ? themeT('addByUrlTitle') : 'Add by URL';
  } else {
    elements.title.textContent = shortcutEditorState.mode === 'edit'
      ? (themeT ? themeT('shortcutEditTitle') : 'Edit shortcut')
      : (themeT ? themeT('shortcutAddTitle') : 'Add shortcut');
  }
  syncFormControlValue(elements.url, shortcutEditorState.url);
  syncFormControlValue(elements.label, shortcutEditorState.label);
  elements.sourceButtons.forEach(button => {
    const isSelected = button.dataset.source === shortcutEditorState.iconKind;
    button.setAttribute('aria-pressed', String(isSelected));
  });
  syncFormControlValue(elements.emoji, shortcutEditorState.iconKind === 'glyph' ? shortcutEditorState.icon : '');
  if (elements.svgCode) {
    syncFormControlValue(elements.svgCode, shortcutEditorState.iconKind === 'svg' ? shortcutEditorState.icon : '');
  }
  if (elements.siteGroup) elements.siteGroup.hidden = shortcutEditorState.iconKind !== 'site';
  if (elements.emojiGroup) elements.emojiGroup.hidden = shortcutEditorState.iconKind !== 'glyph';
  if (elements.imageGroup) elements.imageGroup.hidden = shortcutEditorState.iconKind !== 'image';
  if (elements.svgGroup) elements.svgGroup.hidden = shortcutEditorState.iconKind !== 'svg';
  renderShortcutIconSearch(elements);
  syncShortcutEditorStyleControls(elements);

  const label = shortcutEditorState.label.trim() || shortcutEditorState.url.trim() || (themeT ? themeT('shortcutPreviewFallbackLabel') : 'Shortcut');
  const previewTitle = shortcutEditorState.iconKind === 'image'
    ? (themeT ? themeT('shortcutPreviewCustomImageIcon') : 'Custom image icon')
    : shortcutEditorState.iconKind === 'svg'
      ? (themeT ? themeT('shortcutPreviewSvgIcon') : 'SVG icon')
      : shortcutEditorState.iconKind === 'glyph'
        ? (themeT ? themeT('shortcutPreviewEmojiIcon') : 'Emoji icon')
        : (themeT ? themeT('shortcutPreviewWebsiteIcon') : 'Website icon');
  const previewMeta = shortcutEditorState.iconKind
    ? (themeT ? themeT('shortcutPreviewHasCustomIcon') : 'Custom icon will replace the site favicon.')
    : (themeT ? themeT('shortcutPreviewNoCustomIcon') : 'Upload or paste an image, or type an emoji.');

  if (elements.previewTitle) elements.previewTitle.textContent = previewTitle;
  if (elements.previewMeta) elements.previewMeta.textContent = previewMeta;
  if (elements.preview) {
    elements.preview.setAttribute('aria-label', `${previewTitle}. ${previewMeta}`);
  }

  if (elements.preview) {
    elements.preview.innerHTML = '';
    elements.preview.style.setProperty('--preview-icon-size', `${shortcutEditorState.iconSize}px`);
    elements.preview.style.setProperty('--preview-icon-radius', `${shortcutEditorState.iconMaskRadius}px`);
    elements.preview.classList.toggle('is-rounded-mask', shortcutEditorState.iconMask === 'rounded');
    if ((shortcutEditorState.iconKind === 'image' || shortcutEditorState.iconKind === 'svg') && shortcutEditorState.icon) {
      const img = document.createElement('img');
      img.src = shortcutEditorState.iconKind === 'svg' ? svgToDataUrl(shortcutEditorState.icon) : shortcutEditorState.icon;
      img.alt = '';
      img.addEventListener('error', () => {
        img.remove();
        if (elements.previewFallback) {
          elements.previewFallback.textContent = themeGetFallbackLabel(label, '');
          elements.preview.appendChild(elements.previewFallback);
        }
      });
      elements.preview.appendChild(img);
    } else if (shortcutEditorState.iconKind === 'glyph' && shortcutEditorState.icon) {
      const glyph = document.createElement('span');
      glyph.className = 'shortcut-editor-preview-glyph';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = shortcutEditorState.icon;
      elements.preview.appendChild(glyph);
    } else if (elements.previewFallback) {
      elements.previewFallback.textContent = themeGetFallbackLabel(label, '');
      elements.preview.appendChild(elements.previewFallback);
    }
  }
}

function openShortcutEditor(shortcut = null, triggerEl = null, options = {}) {
  const normalized = shortcut ? normalizeQuickShortcuts([shortcut])[0] : null;
  shortcutIconSearchState = {
    token: shortcutIconSearchState.token + 1,
    status: 'idle',
    candidates: [],
    message: '',
  };
  if (options.presentation === 'tab-picker') {
    mountShortcutEditorInTabPicker();
  } else {
    restoreShortcutEditorHome();
  }
  shortcutEditorState = createShortcutEditorState({
    open: true,
    mode: normalized ? 'edit' : 'create',
    shortcutId: normalized?.id || '',
    url: normalized?.url || '',
    label: normalized?.label || '',
    icon: normalized?.icon || '',
    iconKind: normalized?.iconKind || 'site',
    iconMask: normalized?.iconMask || 'none',
    presentation: options.presentation,
    returnToTabPicker: options.returnToTabPicker,
    focusReturnEl: triggerEl instanceof HTMLElement ? triggerEl : document.activeElement,
  });
  syncShortcutEditor();
  requestAnimationFrame(() => {
    if (shortcutEditorState.presentation !== 'tab-picker') {
      positionShortcutEditor(triggerEl);
    }
    getShortcutEditorElements().url?.focus?.({ preventScroll: true });
  });
}

function closeShortcutEditor({ restoreFocus = true } = {}) {
  const focusTarget = shortcutEditorState.focusReturnEl;
  const wasEmbedded = shortcutEditorState.presentation === 'tab-picker';
  resetShortcutEditorPosition(getShortcutEditorElements().modalPanel);
  shortcutIconSearchState = {
    token: shortcutIconSearchState.token + 1,
    status: 'idle',
    candidates: [],
    message: '',
  };
  shortcutEditorState = createShortcutEditorState();
  syncShortcutEditor();
  restoreShortcutEditorHome();
  if (wasEmbedded) {
    closeTabPicker({ restoreFocus });
    return;
  }
  if (restoreFocus) {
    focusTarget?.focus?.({ preventScroll: true });
  }
}

function setShortcutEditorField(field, value) {
  if (field === 'url') {
    shortcutIconSearchState = {
      token: shortcutIconSearchState.token + 1,
      status: 'idle',
      candidates: [],
      message: '',
    };
  }
  shortcutEditorState = createShortcutEditorState({
    ...shortcutEditorState,
    [field]: value,
  });
  syncShortcutEditor();
}

function syncTabPickerLayout() {
  const elements = getTabPickerElements();
  if (!elements.panel) return;

  const isUrlMode = tabPickerMode === 'url';
  if (elements.tabsTab) {
    elements.tabsTab.classList.toggle('is-active', !isUrlMode);
    elements.tabsTab.setAttribute('aria-selected', String(!isUrlMode));
  }
  if (elements.urlTab) {
    elements.urlTab.classList.toggle('is-active', isUrlMode);
    elements.urlTab.setAttribute('aria-selected', String(isUrlMode));
  }
  if (elements.searchWrap) {
    elements.searchWrap.hidden = isUrlMode;
  }
  if (elements.list) {
    elements.list.hidden = isUrlMode;
  }
  if (elements.editorHost) {
    elements.editorHost.hidden = !isUrlMode;
  }
  if (elements.footer && isUrlMode) {
    elements.footer.hidden = true;
  }
}

function setTabPickerMode(nextMode, { focus = true } = {}) {
  tabPickerMode = nextMode === 'url' ? 'url' : 'tabs';
  if (tabPickerMode === 'url') {
    openShortcutEditor(null, tabPickerFocusReturnEl || document.activeElement, {
      presentation: 'tab-picker',
    });
  } else if (shortcutEditorState.presentation === 'tab-picker') {
    shortcutEditorState = createShortcutEditorState();
    syncShortcutEditor();
    restoreShortcutEditorHome();
  }
  syncTabPickerLayout();

  requestAnimationFrame(() => {
    if (!focus) return;
    const elements = getTabPickerElements();
    if (tabPickerMode === 'url') {
      getShortcutEditorElements().url?.focus?.({ preventScroll: true });
      return;
    }
    elements.search?.focus?.({ preventScroll: true });
  });

  if (tabPickerMode === 'tabs') {
    renderTabPickerPanel();
  }
}

function setTabPickerManualField(field, value) {
  tabPickerManualDraft = createTabPickerManualDraft({
    ...tabPickerManualDraft,
    [field]: value,
  });
}

function setShortcutEditorIcon(input) {
  const normalized = normalizeShortcutIcon(input);
  shortcutEditorState = createShortcutEditorState({
    ...shortcutEditorState,
    icon: normalized.value,
    iconKind: normalized.kind || 'site',
  });
  syncShortcutEditor();
}

function setShortcutEditorIconMask(nextMask) {
  const iconMask = nextMask === 'rounded' ? 'rounded' : 'none';
  shortcutEditorState = createShortcutEditorState({
    ...shortcutEditorState,
    iconMask,
  });
  syncShortcutEditor();
}

async function setShortcutEditorIconStyleField(field, value) {
  if (field === 'iconSize') {
    await saveGlobalShortcutIconStyle({ quickShortcutIconSize: value });
    return;
  }
  await saveGlobalShortcutIconStyle({ quickShortcutIconRadius: value });
}

function setShortcutEditorSource(source) {
  const nextSource = ['site', 'glyph', 'image', 'svg'].includes(source) ? source : 'site';
  if (nextSource !== 'image') {
    shortcutIconSearchState = {
      ...shortcutIconSearchState,
      status: 'idle',
      candidates: [],
      message: '',
    };
  }
  shortcutEditorState = createShortcutEditorState({
    ...shortcutEditorState,
    iconKind: nextSource,
    icon: nextSource === shortcutEditorState.iconKind ? shortcutEditorState.icon : '',
  });
  syncShortcutEditor();
}

function probeShortcutIconCandidate(candidate, timeout = SHORTCUT_ICON_SEARCH_TIMEOUT) {
  return new Promise(resolve => {
    const img = new Image();
    let settled = false;
    const finish = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok ? candidate : null);
    };
    const timer = setTimeout(() => finish(false), timeout);
    img.onload = () => finish(Boolean(img.naturalWidth || img.width));
    img.onerror = () => finish(false);
    img.referrerPolicy = 'no-referrer';
    img.src = candidate.url;
  });
}

async function getShortcutHtmlIconCandidates(input) {
  const normalizedUrl = normalizeShortcutUrl(input);
  if (!normalizedUrl || typeof fetch !== 'function') return [];
  try {
    const response = await fetch(normalizedUrl, {
      credentials: 'omit',
      redirect: 'follow',
    });
    if (!response.ok) return [];
    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) return [];
    const html = await response.text();
    return extractShortcutIconCandidatesFromHtml(html, response.url || normalizedUrl);
  } catch {
    return [];
  }
}

async function searchShortcutWebsiteIcons() {
  const hostname = getShortcutIconSearchHostname(shortcutEditorState.url);
  if (!hostname) {
    shortcutIconSearchState = {
      ...shortcutIconSearchState,
      status: 'error',
      candidates: [],
      message: themeT ? themeT('shortcutIconSearchNeedsUrl') : 'Enter a valid URL before searching icons.',
    };
    setShortcutEditorSource('image');
    return;
  }

  const token = shortcutIconSearchState.token + 1;
  shortcutIconSearchState = {
    token,
    status: 'loading',
    candidates: [],
    message: '',
  };
  setShortcutEditorSource('image');

  const candidates = [
    ...await getShortcutHtmlIconCandidates(shortcutEditorState.url),
    ...createShortcutIconCandidates(shortcutEditorState.url),
  ].filter((candidate, index, all) => (
    candidate.url && all.findIndex(item => item.url === candidate.url) === index
  ));
  const settledCandidates = (await Promise.all(candidates.map(candidate => probeShortcutIconCandidate(candidate))))
    .filter(Boolean);

  if (shortcutIconSearchState.token !== token) return;
  shortcutIconSearchState = {
    token,
    status: settledCandidates.length ? 'ready' : 'empty',
    candidates: settledCandidates,
    message: '',
  };
  syncShortcutEditor();
}

async function applyShortcutEditorImageFile(file) {
  if (!themeCompressImageFileForStorage) {
    throw new Error(themeT ? themeT('errorImageCompressionUnavailable') : 'Image compression is unavailable');
  }
  const dataUrl = await themeCompressImageFileForStorage(file, {
    maxBytes: 96 * 1024,
    maxEdge: 160,
  });
  setShortcutEditorIcon(dataUrl);
}

async function saveShortcutEditorShortcut() {
  const url = normalizeShortcutUrl(shortcutEditorState.url);
  if (!url) {
    throw new Error(themeT ? themeT('errorPleaseEnterValidUrl') : 'Please enter a valid URL');
  }

  const shortcuts = await getQuickShortcuts();
  const nextShortcut = {
    id: shortcutEditorState.shortcutId || `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    label: shortcutEditorState.label.trim(),
    icon: shortcutEditorState.icon,
    iconKind: shortcutEditorState.iconKind,
    iconMask: shortcutEditorState.iconMask,
  };

  const nextShortcuts = shortcutEditorState.mode === 'edit'
    ? shortcuts.map(item => item.id === nextShortcut.id ? nextShortcut : item)
    : [...shortcuts, nextShortcut];

  await saveQuickShortcuts(nextShortcuts);
  await renderQuickShortcuts();
  closeShortcutEditor();
}

async function saveTabPickerUrlShortcut() {
  const url = normalizeShortcutUrl(tabPickerManualDraft.url);
  if (!url) {
    throw new Error('Please enter a valid URL');
  }

  const shortcuts = await getQuickShortcuts();
  if (shortcuts.some(item => item.url === url)) {
    throw new Error('Already in shortcuts');
  }

  const nextShortcut = {
    id: `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    label: tabPickerManualDraft.label.trim(),
    icon: '',
    iconKind: 'site',
    iconMask: 'none',
  };

  await saveQuickShortcuts([...shortcuts, nextShortcut]);
  await renderQuickShortcuts();
  closeTabPicker();
}

function getShortcutLabel(shortcut) {
  if (shortcut.label) return shortcut.label;

  try {
    return friendlyDomain(new URL(shortcut.url).hostname);
  } catch {
    return shortcut.url;
  }
}

function animateQuickShortcutNode(item, previousRect) {
  if (!item || !previousRect) return;

  const nextRect = item.getBoundingClientRect();
  const deltaX = previousRect.left - nextRect.left;
  const deltaY = previousRect.top - nextRect.top;
  if (!deltaX && !deltaY) return;

  const travel = Math.hypot(deltaX, deltaY);
  const duration = prefersReducedMotion()
    ? 0
    : Math.min(380, Math.max(240, Math.round(228 + travel * 0.4)));

  item.style.transition = 'none';
  item.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
  requestAnimationFrame(() => {
    item.style.transition = duration
      ? `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : 'none';
    item.style.transform = '';
  });
}

function animateQuickShortcutItems(listEl, previousRects, affectedIds = null) {
  const affected = affectedIds instanceof Set ? affectedIds : null;
  listEl?.querySelectorAll('[data-shortcut-id]:not(.is-drag-slot)').forEach(item => {
    const key = item.dataset.shortcutId || '';
    if (affected && !affected.has(key)) return;
    animateQuickShortcutNode(item, previousRects.get(key));
  });
}

function settleQuickShortcutItems(listEl, affectedIds = null) {
  const affected = affectedIds instanceof Set ? affectedIds : null;
  listEl?.querySelectorAll('[data-shortcut-id]:not(.is-drag-slot)').forEach(item => {
    const key = item.dataset.shortcutId || '';
    if (affected && !affected.has(key)) return;
    item.style.transition = 'none';
    item.style.transform = '';
  });
}

function ensureQuickShortcutSlot() {
  if (quickShortcutSlotEl || !quickShortcutDraggedEl) return quickShortcutSlotEl;

  quickShortcutSlotEl = document.createElement('div');
  quickShortcutSlotEl.className = 'quick-shortcut-slot is-drag-slot';
  quickShortcutSlotEl.dataset.shortcutId = quickShortcutDraggedId;
  quickShortcutSlotEl.style.width = `${quickShortcutDragState?.width || quickShortcutDraggedEl.getBoundingClientRect().width}px`;
  quickShortcutSlotEl.style.height = `${quickShortcutDragState?.height || quickShortcutDraggedEl.getBoundingClientRect().height}px`;
  quickShortcutDraggedEl.replaceWith(quickShortcutSlotEl);
  return quickShortcutSlotEl;
}

function ensureQuickShortcutGhost() {
  if (quickShortcutGhostEl || !quickShortcutDraggedEl) return quickShortcutGhostEl;

  quickShortcutGhostEl = quickShortcutDraggedEl.cloneNode(true);
  quickShortcutGhostEl.classList.remove('is-drag-origin');
  quickShortcutGhostEl.classList.add('is-drag-ghost');
  quickShortcutGhostEl.style.setProperty('--drag-width', `${quickShortcutDragState?.width || quickShortcutDraggedEl.getBoundingClientRect().width}px`);
  quickShortcutGhostEl.style.setProperty('--drag-height', `${quickShortcutDragState?.height || quickShortcutDraggedEl.getBoundingClientRect().height}px`);
  document.body.appendChild(quickShortcutGhostEl);
  return quickShortcutGhostEl;
}

function clearQuickShortcutDragState() {
  quickShortcutDragState = null;
  quickShortcutDraggedId = '';
  document.body.classList.remove('quick-shortcut-list-dragging');

  quickShortcutDraggedEl = null;
  quickShortcutGhostEl?.remove();
  quickShortcutGhostEl = null;
  quickShortcutSlotEl?.remove();
  quickShortcutSlotEl = null;
}

function clampQuickShortcutDragPoint(clientX, clientY) {
  const listEl = quickShortcutDragState?.listEl;
  if (!listEl || !quickShortcutDragState) {
    return { clientX, clientY };
  }

  const listRect = listEl.getBoundingClientRect();
  const width = Number(quickShortcutDragState.width) || 0;
  const height = Number(quickShortcutDragState.height) || 0;
  const minClientX = listRect.left + quickShortcutDragState.offsetX - width / 2;
  const maxClientX = listRect.right + quickShortcutDragState.offsetX - width / 2;
  const minClientY = listRect.top + quickShortcutDragState.offsetY - height / 2;
  const maxClientY = listRect.bottom + quickShortcutDragState.offsetY - height / 2;

  return {
    clientX: Math.min(Math.max(clientX, minClientX), maxClientX),
    clientY: Math.min(Math.max(clientY, minClientY), maxClientY),
  };
}

function updateDraggedQuickShortcutPosition(clientX, clientY) {
  if (!quickShortcutGhostEl || !quickShortcutDragState) return;

  quickShortcutGhostEl.style.setProperty('--drag-left', `${clientX - quickShortcutDragState.offsetX}px`);
  quickShortcutGhostEl.style.setProperty('--drag-top', `${clientY - quickShortcutDragState.offsetY}px`);
}

function buildQuickShortcutSlotTargets(listEl) {
  if (!(listEl instanceof HTMLElement)) return [];

  return [...listEl.querySelectorAll('[data-shortcut-id]')].map(item => {
    const rect = item.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    };
  });
}

function findQuickShortcutSlotIndex(slotTargets, draggedCenterX, draggedCenterY) {
  if (!Array.isArray(slotTargets) || !slotTargets.length) return -1;

  let targetIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  slotTargets.forEach((slot, index) => {
    const dx = draggedCenterX - slot.centerX;
    const dy = draggedCenterY - slot.centerY;
    const distance = (dx * dx) + (dy * dy);
    if (distance < closestDistance) {
      closestDistance = distance;
      targetIndex = index;
    }
  });

  return targetIndex;
}

function previewQuickShortcutOrder(clientX, clientY) {
  const listEl = quickShortcutDragState?.listEl;
  if (!listEl || !quickShortcutDraggedId || !quickShortcutSlotEl) return;

  const clampedPoint = clampQuickShortcutDragPoint(clientX, clientY);
  const draggedCenterX = clampedPoint.clientX - quickShortcutDragState.offsetX + quickShortcutDragState.width / 2;
  const draggedCenterY = clampedPoint.clientY - quickShortcutDragState.offsetY + quickShortcutDragState.height / 2;

  const items = [...listEl.querySelectorAll('[data-shortcut-id]:not(.is-drag-slot)')];
  if (!items.length) return;

  const targetIndex = findQuickShortcutSlotIndex(
    quickShortcutDragState.slotTargets,
    draggedCenterX,
    draggedCenterY
  );
  if (targetIndex === -1) return;

  const insertBeforeItem = items[targetIndex] || null;
  const addCard = listEl.querySelector('.quick-shortcut-card.is-add');
  const targetBeforeNode = insertBeforeItem || addCard || null;
  const currentBeforeNode = quickShortcutSlotEl.nextElementSibling || null;
  if (targetBeforeNode === currentBeforeNode) return;

  const previousOrderIds = [...listEl.querySelectorAll('[data-shortcut-id]')]
    .map(item => item.dataset.shortcutId || '')
    .filter(Boolean);
  const previousSlotIndex = previousOrderIds.indexOf(quickShortcutDraggedId);
  const previousRects = new Map();
  listEl.querySelectorAll('[data-shortcut-id]:not(.is-drag-slot)').forEach(item => {
    previousRects.set(item.dataset.shortcutId || '', item.getBoundingClientRect());
  });
  const previousSlotRect = quickShortcutSlotEl.getBoundingClientRect();

  if (insertBeforeItem) {
    listEl.insertBefore(quickShortcutSlotEl, insertBeforeItem);
  } else {
    if (addCard) {
      listEl.insertBefore(quickShortcutSlotEl, addCard);
    } else {
      listEl.appendChild(quickShortcutSlotEl);
    }
  }

  const nextOrderIds = [...listEl.querySelectorAll('[data-shortcut-id]')]
    .map(item => item.dataset.shortcutId || '')
    .filter(Boolean);
  const nextSlotIndex = nextOrderIds.indexOf(quickShortcutDraggedId);
  const affectedIds = new Set(
    nextOrderIds.filter(id => previousOrderIds.indexOf(id) !== nextOrderIds.indexOf(id))
  );

  const rangeStart = Math.min(previousSlotIndex, nextSlotIndex);
  const rangeEnd = Math.max(previousSlotIndex, nextSlotIndex);
  nextOrderIds.forEach((id, index) => {
    if (index >= rangeStart && index <= rangeEnd) {
      affectedIds.add(id);
    }
  });

  settleQuickShortcutItems(listEl, affectedIds);
  animateQuickShortcutItems(listEl, previousRects, affectedIds);
  animateQuickShortcutNode(quickShortcutSlotEl, previousSlotRect);
}

function renderQuickShortcutCard(shortcut) {
  const label = getShortcutLabel(shortcut);
  const safeLabel = themeEscapeHtml ? themeEscapeHtml(label) : label;
  const safeAriaLabel = themeEscapeHtmlAttribute ? themeEscapeHtmlAttribute(label) : label.replace(/"/g, '&quot;');
  const iconData = themeGetIconSources({ url: shortcut.url, title: label }, 32);
  const faviconUrl = iconData.sources[0] || '';
  const fallbackUrl = iconData.sources[1] || '';
  const fallbackLabel = themeGetFallbackLabel(label, iconData.hostname);
  const safeId = themeEscapeHtmlAttribute ? themeEscapeHtmlAttribute(shortcut.id) : shortcut.id.replace(/"/g, '&quot;');
  const safeUrl = themeEscapeHtmlAttribute ? themeEscapeHtmlAttribute(shortcut.url) : shortcut.url.replace(/"/g, '&quot;');
  const customIcon = normalizeShortcutIcon(shortcut.icon);
  const iconMask = shortcut.iconMask === 'rounded' ? 'rounded' : 'none';
  const iconStyle = getQuickShortcutIconStyleAttribute(themePreferences);
  const iconErrorFallback = (customIcon.kind === 'image' || customIcon.kind === 'svg') ? (faviconUrl || fallbackUrl) : fallbackUrl;
  const safeIconErrorFallback = themeEscapeHtmlAttribute ? themeEscapeHtmlAttribute(iconErrorFallback) : iconErrorFallback.replace(/"/g, '&quot;');
  const primaryIconUrl = customIcon.kind === 'image'
    ? customIcon.value
    : customIcon.kind === 'svg'
      ? svgToDataUrl(customIcon.value)
      : customIcon.kind === 'glyph'
        ? ''
        : faviconUrl;
  const glyphIcon = customIcon.kind === 'glyph' ? customIcon.value : '';
  const stretchClass = customIcon.kind === 'image' || customIcon.kind === 'svg'
    ? ' quick-shortcut-icon-auto-stretch'
    : '';

  return `
    <div class="quick-shortcut-card${iconMask === 'rounded' ? ' has-rounded-icon-mask' : ''}" data-shortcut-id="${safeId}" style="${iconStyle}">
      <button class="quick-shortcut-open" type="button" data-action="open-quick-shortcut" data-shortcut-url="${safeUrl}" aria-label="${safeAriaLabel}" draggable="false">
        <span class="quick-shortcut-icon-wrap">
          ${primaryIconUrl ? `<img class="quick-shortcut-icon${customIcon.kind === 'image' ? ' quick-shortcut-icon-custom' : ''}${stretchClass}" src="${primaryIconUrl}" alt="" draggable="false" data-fallback-src="${safeIconErrorFallback}" data-auto-stretch-icon="true">` : ''}
          ${glyphIcon ? `<span class="quick-shortcut-custom-glyph" aria-hidden="true">${glyphIcon}</span>` : ''}
          <span class="quick-shortcut-fallback"${primaryIconUrl || glyphIcon ? ' style="display:none"' : ''}>${fallbackLabel}</span>
        </span>
        <span class="quick-shortcut-label">${safeLabel}</span>
      </button>
      <button class="quick-shortcut-edit" type="button" data-action="edit-quick-shortcut" data-shortcut-id="${safeId}" aria-label="${themeT ? themeT('editQuickTab') : 'Edit quick tab'}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a2.25 2.25 0 1 1 3.182 3.182L10.582 17.13a4.5 4.5 0 0 1-1.897 1.13L6 19l.74-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487ZM19.5 7.125 16.875 4.5" /></svg>
      </button>
      <button class="quick-shortcut-remove" type="button" data-action="remove-quick-shortcut" data-shortcut-id="${safeId}" aria-label="${themeT ? themeT('removeQuickTab') : 'Remove quick tab'}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>
  `;
}

function syncQuickShortcutAutoStretchImage(imgEl) {
  if (!(imgEl instanceof HTMLImageElement)) return;
  if (imgEl.dataset.autoStretchIcon !== 'true') return;
  const card = imgEl.closest('.quick-shortcut-card');
  if (!card?.classList.contains('has-rounded-icon-mask')) return;

  const naturalMin = Math.min(imgEl.naturalWidth || 0, imgEl.naturalHeight || 0);
  if (!naturalMin) return;
  imgEl.classList.toggle('is-auto-stretched', naturalMin <= 48);
}

function syncQuickShortcutAutoStretchImages(root = document) {
  root.querySelectorAll?.('.quick-shortcut-icon[data-auto-stretch-icon="true"]').forEach(img => {
    if (img.complete) {
      syncQuickShortcutAutoStretchImage(img);
    }
  });
}

function renderQuickShortcutAddCard() {
  return `
    <div class="quick-shortcut-card is-add">
      <button class="quick-shortcut-open" type="button" data-action="add-quick-shortcut" aria-label="${themeT ? themeT('addQuickTab') : 'Add quick tab'}">
        <span class="quick-shortcut-icon-wrap">
          <svg class="quick-shortcut-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5.25v13.5m6.75-6.75H5.25" />
          </svg>
        </span>
        <span class="quick-shortcut-label">${themeT ? themeT('addLink') : 'Add link'}</span>
      </button>
    </div>
  `;
}

async function renderQuickShortcuts() {
  const list = document.getElementById('quickTabsList');
  if (!list) return;

  const shortcuts = await getQuickShortcuts();
  list.innerHTML = `${shortcuts.map(renderQuickShortcutCard).join('')}${renderQuickShortcutAddCard()}`;
  syncQuickShortcutAutoStretchImages(list);
}

async function openShortcutEditorById(shortcutId, triggerEl = null) {
  const shortcuts = await getQuickShortcuts();
  const shortcut = shortcuts.find(item => item.id === shortcutId);
  if (!shortcut) return;
  openShortcutEditor(shortcut, triggerEl);
}

async function handleShortcutEditorPaste() {
  if (!shortcutEditorState.open) {
    return;
  }

  if (!navigator.clipboard?.read) {
    showToast(themeT ? themeT('toastClipboardUsePasteShortcut') : 'Press Cmd/Ctrl+V inside the editor to paste an image or SVG');
    return;
  }

  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find(type => type.startsWith('image/'));
      if (!imageType) continue;
      const blob = await item.getType(imageType);
      const file = new File([blob], 'shortcut-icon.png', { type: imageType });
      await applyShortcutEditorImageFile(file);
      showToast(themeT ? themeT('toastShortcutIconPasted') : 'Shortcut icon pasted');
      return;
    }

    const textItem = items.find(item => item.types.includes('text/plain'));
    const htmlItem = items.find(item => item.types.includes('text/html'));
    if (htmlItem) {
      const htmlBlob = await htmlItem.getType('text/html');
      const html = await htmlBlob.text();
      const normalized = extractIconFromClipboardHtml(html);
      if (normalized.kind) {
        setShortcutEditorIcon(normalized.value);
        showToast(normalized.kind === 'svg'
          ? (themeT ? themeT('toastSvgIconPasted') : 'SVG icon pasted')
          : (themeT ? themeT('toastShortcutIconPasted') : 'Shortcut icon pasted'));
        return;
      }
      const htmlImageMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (htmlImageMatch?.[1] && isTransientClipboardReference(htmlImageMatch[1])) {
        showToast(themeT ? themeT('toastClipboardTemporaryRef') : 'This clipboard image is a temporary file reference. Use Cmd/Ctrl+V instead.');
        return;
      }
    }

    if (textItem) {
      const textBlob = await textItem.getType('text/plain');
      const text = await textBlob.text();
      const normalized = normalizeShortcutIcon(text);
      if (normalized.kind === 'svg' || /^data:image\//i.test(String(normalized.value || ''))) {
        setShortcutEditorIcon(normalized.value);
        showToast(normalized.kind === 'svg'
          ? (themeT ? themeT('toastSvgIconPasted') : 'SVG icon pasted')
          : (themeT ? themeT('toastShortcutIconPasted') : 'Shortcut icon pasted'));
        return;
      }
      if (isTransientClipboardReference(text)) {
        showToast(themeT ? themeT('toastClipboardTemporaryRef') : 'This clipboard image is a temporary file reference. Use Cmd/Ctrl+V instead.');
        return;
      }
    }

    showToast(themeT ? themeT('toastClipboardNoImage') : 'Clipboard does not contain an image or SVG');
  } catch (err) {
    showToast(themeT ? themeT('toastClipboardUsePasteShortcut') : 'Use Cmd/Ctrl+V inside the editor if direct clipboard access is unavailable');
  }
}

async function tryShortcutEditorPasteViaExecCommand() {
  return new Promise(resolve => {
    const target = document.createElement('textarea');
    target.setAttribute('aria-hidden', 'true');
    target.style.position = 'fixed';
    target.style.opacity = '0';
    target.style.pointerEvents = 'none';
    target.style.inset = '0 auto auto -9999px';
    document.body.appendChild(target);

    let finished = false;
    const cleanup = (result) => {
      if (finished) return;
      finished = true;
      target.removeEventListener('paste', onPaste);
      target.remove();
      resolve(result);
    };

    const onPaste = async (e) => {
      const imageItem = [...(e.clipboardData?.items || [])].find(item => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          e.preventDefault();
          try {
            await applyShortcutEditorImageFile(file);
            showToast(themeT ? themeT('toastShortcutIconPasted') : 'Shortcut icon pasted');
            cleanup(true);
            return;
          } catch {
            cleanup(false);
            return;
          }
        }
      }

      const pastedHtml = e.clipboardData?.getData('text/html') || '';
      const normalizedFromHtml = extractIconFromClipboardHtml(pastedHtml);
      if (normalizedFromHtml.kind) {
        e.preventDefault();
        setShortcutEditorIcon(normalizedFromHtml.value);
        showToast(normalizedFromHtml.kind === 'svg'
          ? (themeT ? themeT('toastSvgIconPasted') : 'SVG icon pasted')
          : (themeT ? themeT('toastShortcutIconPasted') : 'Shortcut icon pasted'));
        cleanup(true);
        return;
      }

      cleanup(false);
    };

    target.addEventListener('paste', onPaste, { once: true });
    target.focus({ preventScroll: true });

    let commandWorked = false;
    try {
      commandWorked = document.execCommand('paste');
    } catch { }

    setTimeout(() => cleanup(commandWorked), 120);
  });
}

// ---- Tab Picker ----

function filterRealTabs(tabs) {
  return tabs.filter(t => {
    const url = t.url || '';
    return (
      !url.startsWith('chrome://') &&
      !url.startsWith('chrome-extension://') &&
      !url.startsWith('about:') &&
      !url.startsWith('edge://') &&
      !url.startsWith('brave://')
    );
  });
}

function openTabPicker(triggerEl = null) {
  if (tabPickerOpen) return;
  tabPickerOpen = true;
  tabPickerMode = 'tabs';
  tabPickerSearchQuery = '';
  tabPickerSelectedIds = new Set();
  tabPickerFocusReturnEl = document.activeElement;
  tabPickerManualDraft = createTabPickerManualDraft();

  const backdrop = document.getElementById('tabPickerBackdrop');
  const panel = document.getElementById('tabPicker');
  if (backdrop) backdrop.removeAttribute('hidden');
  if (panel) panel.removeAttribute('hidden');

  shortcutEditorState = createShortcutEditorState();
  syncShortcutEditor();
  restoreShortcutEditorHome();
  syncTabPickerLayout();
  renderTabPickerPanel();
  getTabPickerElements().search?.focus?.({ preventScroll: true });
}

function closeTabPicker({ restoreFocus = true } = {}) {
  if (!tabPickerOpen) return;
  if (shortcutEditorState.presentation === 'tab-picker') {
    shortcutEditorState = createShortcutEditorState();
    syncShortcutEditor();
    restoreShortcutEditorHome();
  }
  tabPickerOpen = false;
  tabPickerMode = 'tabs';
  tabPickerSearchQuery = '';
  tabPickerSelectedIds = new Set();
  tabPickerManualDraft = createTabPickerManualDraft();

  const backdrop = document.getElementById('tabPickerBackdrop');
  const panel = document.getElementById('tabPicker');
  if (backdrop) backdrop.setAttribute('hidden', '');
  if (panel) panel.setAttribute('hidden', '');

  if (restoreFocus && tabPickerFocusReturnEl) {
    tabPickerFocusReturnEl.focus();
    tabPickerFocusReturnEl = null;
  }
}

async function renderTabPickerPanel() {
  if (!tabPickerOpen) return;
  if (tabPickerMode !== 'tabs') {
    syncTabPickerLayout();
    return;
  }

  const runtime = globalThis.TabHarborDashboardRuntime;
  if (!runtime) return;

  await runtime.fetchOpenTabs();
  const allTabs = runtime.getOpenTabs();
  const realTabs = filterRealTabs(allTabs);

  const shortcuts = await getQuickShortcuts();
  const existingUrls = new Set(shortcuts.map(s => s.url));

  const query = tabPickerSearchQuery.trim().toLowerCase();
  const filtered = query
    ? realTabs.filter(t => {
      const title = (t.title || '').toLowerCase();
      const url = (t.url || '').toLowerCase();
      return title.includes(query) || url.includes(query);
    })
    : realTabs;

  const byDomain = new Map();
  for (const tab of filtered) {
    let hostname = '';
    try { hostname = new URL(tab.url).hostname; } catch { }
    const group = hostname.replace(/^www\./, '') || 'other';
    if (!byDomain.has(group)) byDomain.set(group, []);
    byDomain.get(group).push(tab);
  }

  const listEl = document.getElementById('tabPickerList');
  if (!listEl) return;

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="tab-picker-empty">${query ? 'No tabs match your search.' : 'No open tabs found.'}</div>`;
    syncTabPickerFooter();
    return;
  }

  let html = '';
  for (const [domain, tabs] of byDomain) {
    html += `<div class="tab-picker-group-label">${friendlyDomain(domain) || domain}</div>`;
    for (const tab of tabs) {
      const tabId = String(tab.id);
      const isSelected = tabPickerSelectedIds.has(tabId);
      const isAdded = existingUrls.has(tab.url);
      const title = stripTitleNoise(tab.title) || tab.url;
      const safeTitle = themeEscapeHtmlAttribute(title);
      const fallbackInitial = (friendlyDomain(tab.url ? new URL(tab.url).hostname : '') || '?')[0] || '?';
      let faviconHtml;
      if (tab.favIconUrl) {
        faviconHtml = `<img class="tab-picker-favicon" src="${themeEscapeHtmlAttribute(tab.favIconUrl)}" alt="" data-fallback-src=""><span class="tab-picker-favicon-fallback" style="display:none">${fallbackInitial.toUpperCase()}</span>`;
      } else {
        faviconHtml = `<span class="tab-picker-favicon-fallback">${fallbackInitial.toUpperCase()}</span>`;
      }

      const checkbox = `<input class="tab-picker-checkbox" type="checkbox" ${isSelected ? 'checked' : ''} data-action="toggle-tab-picker-selection" data-tab-id="${tabId}" aria-label="Select ${safeTitle}">`;

      let actionIcon;
      if (isAdded) {
        actionIcon = `<svg class="tab-picker-added-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`;
      } else {
        actionIcon = `<button class="tab-picker-add-btn" type="button" data-action="add-tab-to-shortcuts" data-tab-id="${tabId}" aria-label="Add ${safeTitle} to shortcuts">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>`;
      }

      html += `<div class="tab-picker-row ${isSelected ? 'is-selected' : ''}" role="option" aria-selected="${isSelected}">
        ${checkbox}
        ${faviconHtml}
        <span class="tab-picker-tab-title" title="${safeTitle}">${safeTitle}</span>
        ${actionIcon}
      </div>`;
    }
  }

  listEl.innerHTML = html;
  syncTabPickerFooter();
}

function syncTabPickerFooter() {
  const footer = document.getElementById('tabPickerFooter');
  const count = document.getElementById('tabPickerFooterCount');
  if (!footer || !count) return;

  const count_val = tabPickerSelectedIds.size;
  if (count_val === 0) {
    footer.setAttribute('hidden', '');
  } else {
    footer.removeAttribute('hidden');
    count.textContent = `${count_val} selected`;
  }
}

async function addSingleTabToQuickShortcuts(tab) {
  const shortcuts = await getQuickShortcuts();

  if (shortcuts.some(s => s.url === tab.url)) {
    showToast('Already in shortcuts');
    return;
  }

  const hostname = tab.url ? (() => { try { return new URL(tab.url).hostname; } catch { return ''; } })() : '';
  const label = stripTitleNoise(tab.title) || friendlyDomain(hostname) || hostname || tab.url;

  const nextShortcut = {
    id: `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: tab.url,
    label,
    icon: tab.favIconUrl || '',
    iconKind: tab.favIconUrl ? 'image' : 'site',
  };

  const updated = [...shortcuts, nextShortcut];
  await saveQuickShortcuts(updated);
  await renderQuickShortcuts();
  showToast('Tab added — undo?', {
    action: {
      label: 'Undo',
      fn: async () => {
        await removeQuickShortcutById(nextShortcut.id);
        await renderQuickShortcuts();
      },
    },
  });
}

async function addSelectedTabsToQuickShortcuts() {
  const runtime = globalThis.TabHarborDashboardRuntime;
  if (!runtime) return;

  const allTabs = runtime.getOpenTabs();
  const selectedTabs = allTabs.filter(t => tabPickerSelectedIds.has(String(t.id)));
  if (selectedTabs.length === 0) return;

  const shortcuts = await getQuickShortcuts();
  const existingUrls = new Set(shortcuts.map(s => s.url));

  const newShortcuts = [];
  for (const tab of selectedTabs) {
    const shortcutUrl = tab.url || '';
    if (existingUrls.has(shortcutUrl)) continue;
    const hostname = shortcutUrl ? (() => { try { return new URL(shortcutUrl).hostname; } catch { return ''; } })() : '';
    const label = stripTitleNoise(tab.title) || friendlyDomain(hostname) || hostname || shortcutUrl;
    newShortcuts.push({
      id: `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: shortcutUrl,
      label,
      icon: tab.favIconUrl || '',
      iconKind: tab.favIconUrl ? 'image' : 'site',
    });
    existingUrls.add(shortcutUrl);
  }

  await saveQuickShortcuts([...shortcuts, ...newShortcuts]);
  await renderQuickShortcuts();
  closeTabPicker();
  showToast(`${newShortcuts.length} tab${newShortcuts.length !== 1 ? 's' : ''} added`);
}

// ---- Escape / backdrop click handlers for picker ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tabPickerOpen) {
    closeTabPicker();
  }
});

document.addEventListener('click', (e) => {
  if (!tabPickerOpen) return;
  if (e.target.id === 'tabPickerBackdrop') {
    closeTabPicker();
  }
});

// ---- Tab picker search ----
document.addEventListener('input', (e) => {
  if (e.target.id !== 'tabPickerSearch') return;
  tabPickerSearchQuery = e.target.value || '';
  renderTabPickerPanel();
});

// ---- Main action click handler ----
document.addEventListener('click', async (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;

  if (action === 'add-quick-shortcut') {
    e.preventDefault();
    e.stopImmediatePropagation();
    openTabPicker(actionEl);
    return;
  }

  if (action === 'switch-tab-picker-view') {
    e.preventDefault();
    setTabPickerMode(actionEl.dataset.view || 'tabs');
    return;
  }

  if (action === 'show-tab-picker-tabs') {
    e.preventDefault();
    setTabPickerMode('tabs');
    return;
  }

  if (action === 'open-tab-picker') {
    e.preventDefault();
    e.stopImmediatePropagation();
    openTabPicker(actionEl);
    return;
  }

  if (action === 'close-tab-picker') {
    closeTabPicker();
    return;
  }

  if (action === 'add-tab-to-shortcuts') {
    const tabId = actionEl.dataset.tabId;
    if (!tabId) return;
    const runtime = globalThis.TabHarborDashboardRuntime;
    if (!runtime) return;
    const tab = runtime.getOpenTabs().find(t => String(t.id) === tabId);
    if (!tab) return;
    await addSingleTabToQuickShortcuts(tab);
    await renderTabPickerPanel();
    return;
  }

  if (action === 'toggle-tab-picker-selection') {
    const row = actionEl.closest('.tab-picker-row');
    const tabId = actionEl.dataset.tabId || '';
    if (tabPickerSelectedIds.has(tabId)) {
      tabPickerSelectedIds.delete(tabId);
      if (row) row.classList.remove('is-selected');
    } else {
      tabPickerSelectedIds.add(tabId);
      if (row) row.classList.add('is-selected');
    }
    syncTabPickerFooter();
    return;
  }

  if (action === 'add-selected-tabs') {
    e.preventDefault();
    await addSelectedTabsToQuickShortcuts();
    return;
  }

  if (action === 'clear-tab-picker-selection') {
    tabPickerSelectedIds = new Set();
    renderTabPickerPanel();
    return;
  }

  if (action === 'edit-quick-shortcut') {
    e.preventDefault();
    e.stopImmediatePropagation();
    const shortcutId = actionEl.dataset.shortcutId || '';
    await openShortcutEditorById(shortcutId, actionEl);
    return;
  }

  if (action === 'remove-quick-shortcut') {
    e.stopImmediatePropagation();
    const shortcutId = actionEl.dataset.shortcutId;
    if (!shortcutId) return;
    await removeQuickShortcutById(shortcutId);
    await renderQuickShortcuts();
    showToast(themeT ? themeT('toastQuickTabRemoved') : 'Quick tab removed');
    return;
  }

  if (action === 'open-quick-shortcut') {
    e.stopImmediatePropagation();
    if (Date.now() < quickShortcutSuppressClickUntil) return;
    const url = actionEl.dataset.shortcutUrl;
    if (!url) return;
    await openOrFocusUrl(url);
    return;
  }

  if (action === 'close-shortcut-editor') {
    e.preventDefault();
    closeShortcutEditor({ restoreFocus: true });
    return;
  }

  if (action === 'select-shortcut-source') {
    e.preventDefault();
    setShortcutEditorSource(actionEl.dataset.source || 'site');
    if (actionEl.dataset.source === 'glyph') {
      getShortcutEditorElements().emoji?.focus?.({ preventScroll: true });
    }
    return;
  }

  if (action === 'upload-shortcut-icon') {
    e.preventDefault();
    getShortcutEditorElements().fileInput?.click();
    return;
  }

  if (action === 'search-shortcut-icons') {
    e.preventDefault();
    await searchShortcutWebsiteIcons();
    return;
  }

  if (action === 'select-shortcut-icon-candidate') {
    e.preventDefault();
    const iconUrl = actionEl.dataset.iconUrl || '';
    if (!iconUrl) return;
    setShortcutEditorIcon(iconUrl);
    showToast(themeT ? themeT('toastShortcutIconSelected') : 'Shortcut icon selected');
    return;
  }

  if (action === 'set-shortcut-icon-mask') {
    e.preventDefault();
    setShortcutEditorIconMask(actionEl.dataset.mask || 'none');
    return;
  }

  if (action === 'paste-shortcut-icon') {
    e.preventDefault();
    const pasted = await tryShortcutEditorPasteViaExecCommand();
    if (!pasted) {
      await handleShortcutEditorPaste();
    }
    return;
  }

  if (action === 'clear-shortcut-icon') {
    e.preventDefault();
    setShortcutEditorIcon('');
    return;
  }
});

document.addEventListener('load', (e) => {
  syncQuickShortcutAutoStretchImage(e.target);
}, true);

async function handleQuickShortcutMiddleOpen(shortcutButton, e) {
  if (!shortcutButton) return false;
  if (shortcutButton.dataset.action !== 'open-quick-shortcut') return;

  e?.preventDefault?.();
  e?.stopImmediatePropagation?.();
  const now = Date.now();
  if (now < quickShortcutSuppressClickUntil || now < quickShortcutMiddleClickSuppressUntil) return false;

  const url = shortcutButton.dataset.shortcutUrl;
  if (!url) return false;

  const runtime = globalThis.TabHarborDashboardRuntime;
  if (typeof runtime?.openUrlInBackgroundTab !== 'function') {
    return false;
  }

  quickShortcutMiddleClickSuppressUntil = now + 600;
  await runtime.openUrlInBackgroundTab(url);
  return true;
}

document.addEventListener('auxclick', async (e) => {
  const shortcutButton = e.target.closest('.quick-shortcut-open');
  if (!shortcutButton || e.button !== 1) return;
  await handleQuickShortcutMiddleOpen(shortcutButton, e);
});

document.addEventListener('pointerdown', (e) => {
  const shortcutButton = e.target.closest('.quick-shortcut-open');
  if (!shortcutButton) return;
  if (shortcutButton.dataset.action !== 'open-quick-shortcut') return;

  if (e.button === 1) {
    void handleQuickShortcutMiddleOpen(shortcutButton, e);
    return;
  }

  if (e.button !== 0) return;

  const item = shortcutButton.closest('[data-shortcut-id]');
  const listEl = item?.parentElement;
  if (!item || !listEl) return;

  quickShortcutDraggedId = item.dataset.shortcutId || '';
  quickShortcutDraggedEl = item;

  const rect = item.getBoundingClientRect();
  quickShortcutDragState = {
    listEl,
    x: e.clientX,
    y: e.clientY,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    slotTargets: buildQuickShortcutSlotTargets(listEl),
    width: rect.width,
    height: rect.height,
    moved: false,
  };
});

document.addEventListener('pointermove', (e) => {
  if (!quickShortcutDraggedId || !quickShortcutDragState) return;

  const distance = Math.hypot(e.clientX - quickShortcutDragState.x, e.clientY - quickShortcutDragState.y);
  if (!quickShortcutDragState.moved && distance < 4) return;

  if (!quickShortcutDragState.moved) {
    quickShortcutDragState.moved = true;
    document.body.classList.add('quick-shortcut-list-dragging');
    ensureQuickShortcutSlot();
    ensureQuickShortcutGhost();
  }

  updateDraggedQuickShortcutPosition(e.clientX, e.clientY);
  previewQuickShortcutOrder(e.clientX, e.clientY);
});

document.addEventListener('pointerup', async () => {
  if (!quickShortcutDraggedId || !quickShortcutDragState) return;

  const moved = quickShortcutDragState.moved;
  const nextOrderIds = moved
    ? [...quickShortcutDragState.listEl.children]
      .map(node => {
        if (node === quickShortcutSlotEl) return quickShortcutDraggedId;
        return node.dataset?.shortcutId || '';
      })
      .filter(Boolean)
    : [];
  clearQuickShortcutDragState();

  if (!moved) return;

  quickShortcutSuppressClickUntil = Date.now() + 250;
  await saveQuickShortcutOrder(nextOrderIds);
  await renderQuickShortcuts();
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'shortcutEditorUrl') {
    setShortcutEditorField('url', e.target.value);
    return;
  }

  if (e.target.id === 'shortcutEditorLabel') {
    setShortcutEditorField('label', e.target.value);
    return;
  }

  if (e.target.id === 'shortcutEditorEmoji') {
    const normalized = normalizeShortcutIcon(e.target.value);
    shortcutEditorState = createShortcutEditorState({
      ...shortcutEditorState,
      icon: normalized.value,
      iconKind: normalized.kind || 'glyph',
    });
    syncShortcutEditor();
    return;
  }

  if (e.target.id === 'shortcutEditorSvgCode') {
    const normalized = normalizeShortcutIcon(e.target.value);
    shortcutEditorState = createShortcutEditorState({
      ...shortcutEditorState,
      icon: normalized.value,
      iconKind: normalized.kind || 'svg',
    });
    syncShortcutEditor();
    return;
  }

  if (e.target.id === 'shortcutEditorIconSize') {
    void setShortcutEditorIconStyleField('iconSize', e.target.value);
    return;
  }

  if (e.target.id === 'shortcutEditorIconRadius') {
    void setShortcutEditorIconStyleField('iconMaskRadius', e.target.value);
  }
});

document.addEventListener('compositionstart', (e) => {
  if (!(e.target instanceof HTMLElement)) return;
  if (!['shortcutEditorUrl', 'shortcutEditorLabel', 'shortcutEditorEmoji', 'shortcutEditorSvgCode', 'shortcutEditorIconSize', 'shortcutEditorIconRadius'].includes(e.target.id)) {
    return;
  }
  e.target.dataset.composing = 'true';
});

document.addEventListener('compositionend', (e) => {
  if (!(e.target instanceof HTMLElement)) return;
  if (e.target.dataset.composing !== 'true') return;
  delete e.target.dataset.composing;

  if (e.target.id === 'shortcutEditorUrl') {
    setShortcutEditorField('url', e.target.value);
    return;
  }

  if (e.target.id === 'shortcutEditorLabel') {
    setShortcutEditorField('label', e.target.value);
    return;
  }
});

document.addEventListener('change', async (e) => {
  if (e.target.id !== 'shortcutIconFileInput') return;

  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;

  try {
    await applyShortcutEditorImageFile(file);
    showToast(themeT ? themeT('toastShortcutIconUpdated') : 'Shortcut icon updated');
  } catch (err) {
    showToast(err?.message || (themeT ? themeT('toastCouldNotUseShortcutImage') : 'Could not use shortcut image'));
  }
});

document.addEventListener('paste', async (e) => {
  if (!shortcutEditorState.open) return;
  const imageItem = [...(e.clipboardData?.items || [])].find(item => item.type.startsWith('image/'));
  if (imageItem) {
    const file = imageItem.getAsFile();
    if (!file) return;

    e.preventDefault();
    try {
      await applyShortcutEditorImageFile(file);
      showToast(themeT ? themeT('toastShortcutIconPasted') : 'Shortcut icon pasted');
    } catch (err) {
      showToast(err?.message || (themeT ? themeT('toastCouldNotPasteShortcutImage') : 'Could not paste shortcut image'));
    }
    return;
  }

  const pastedHtml = e.clipboardData?.getData('text/html') || '';
  const normalizedFromHtml = extractIconFromClipboardHtml(pastedHtml);
  if (normalizedFromHtml.kind) {
    e.preventDefault();
    setShortcutEditorIcon(normalizedFromHtml.value);
    showToast(normalizedFromHtml.kind === 'svg'
      ? (themeT ? themeT('toastSvgIconPasted') : 'SVG icon pasted')
      : (themeT ? themeT('toastShortcutIconPasted') : 'Shortcut icon pasted'));
    return;
  }

  const pastedText = e.clipboardData?.getData('text/plain') || '';
  const normalized = normalizeShortcutIcon(pastedText);
  if (normalized.kind === 'svg') {
    e.preventDefault();
    setShortcutEditorIcon(normalized.value);
    showToast(themeT ? themeT('toastSvgIconPasted') : 'SVG icon pasted');
  }
});

document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'shortcutEditorForm') return;

  e.preventDefault();
  try {
    const mode = shortcutEditorState.mode;
    await saveShortcutEditorShortcut();
    showToast(mode === 'edit'
      ? (themeT ? themeT('toastQuickTabUpdated') : 'Quick tab updated')
      : (themeT ? themeT('toastQuickTabAdded') : 'Quick tab added'));
  } catch (err) {
    showToast(err?.message || (themeT ? themeT('toastCouldNotSaveShortcut') : 'Could not save shortcut'));
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && shortcutEditorState.open) {
    closeShortcutEditor({ restoreFocus: true });
  }
});

document.addEventListener('click', (e) => {
  if (!shortcutEditorState.open) return;
  if (e.target.id === 'shortcutEditorBackdrop') {
    closeShortcutEditor({ restoreFocus: true });
  }
});

async function loadThemePreferences() {
  const stored = await chrome.storage.local.get(THEME_PREFERENCES_KEY);
  themePreferences = normalizeThemePreferences(stored[THEME_PREFERENCES_KEY]);
  syncSystemThemeSubscription();
  applyThemePreferences();
  renderThemeMenu();
  return themePreferences;
}

function syncPopupTheme(targetDoc) {
  const root = targetDoc?.documentElement;
  const body = targetDoc?.body;
  if (!root) return;
  const theme = getResolvedThemeDefinition(themePreferences);
  const opacityVars = computeThemeOpacityVars(themePreferences.surfaceOpacity);
  const shortcutIconVars = computeQuickShortcutIconStyleVars(themePreferences);

  Object.entries(theme.vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  Object.entries(opacityVars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  Object.entries(shortcutIconVars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  if (body) {
    body.classList.toggle('theme-tone-light', theme.tone === 'light');
    body.classList.toggle('theme-tone-dark', theme.tone === 'dark');
  }
}

async function saveThemePreferences(nextPreferences) {
  themePreferences = normalizeThemePreferences({
    ...themePreferences,
    ...nextPreferences,
  });
  await chrome.storage.local.set({ [THEME_PREFERENCES_KEY]: themePreferences });
  syncSystemThemeSubscription();
  applyThemePreferences();
  renderThemeMenu();
  return themePreferences;
}

globalThis.TabOutThemeControls = {
  filterRealTabs,
  computeQuickShortcutIconStyleVars,
  createShortcutIconCandidates,
  extractShortcutIconCandidatesFromHtml,
  getCodelifeFaviconUrl,
  getQuickShortcutIconStyleAttribute,
  getQuickShortcutIconStylePreferences,
  getShortcutIconSearchHostname,
  normalizeShortcutIconRadius,
  normalizeShortcutIconSize,
  getResolvedThemeDefinition,
  getResolvedTone,
  getQuickShortcuts,
  loadThemePreferences,
  normalizeShortcutUrl,
  normalizeQuickShortcuts,
  normalizeThemePreferences,
  removeQuickShortcutById,
  saveQuickShortcutOrder,
  saveQuickShortcuts,
  syncPopupTheme,
  normalizeThemePreferences,
};
