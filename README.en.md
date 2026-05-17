# Tab Harbor Changes

[简体中文](README.md) | [English](README.en.md)

This fork keeps the original Tab Harbor idea, but this README only records the changes made in this branch.

## What Changed

### Chrome Sync Summary

- Added cross-device sync through `chrome.storage.sync`, with no custom server.
- Sync requires both devices to use the same Google Chrome account, Chrome Sync to be enabled, and Extensions or related extension data to be allowed in Chrome Sync settings.
- Saved-for-later items sync URL, title, completed / archived / deleted state, and order.
- Todos sync title, description, completed / archived / deleted state, and order.
- Quick shortcuts under the search bar sync URL, label, order, icon type, icon mask, and lightweight icons.
- Large shortcut icon images are not written to Chrome Sync; they stay in the local cache to avoid Chrome Sync per-item quota limits.
- `chrome.storage.local` remains a local cache and legacy data backup. Deletes are stored as tombstones so stale data from another device does not revive removed items.

### Shortcut icon editor

- Added icon mask controls for quick shortcuts.
- Added global shortcut icon size and corner-radius sliders.
- Added a website icon search action that looks for usable favicons, Apple touch icons, and fallback favicon services from the shortcut URL.
- Improved custom image / SVG rendering so rounded icons fill the mask more cleanly.
- Added middle-click support for quick shortcuts so a shortcut can open in a background tab.

### Visual direction

- Switched the editorial display typography from the remote Libre Caslon font to local editorial fonts:
  - `Test Tiempos Text`
  - `方正FW筑紫A老明朝 简`
- Tuned the greeting, date, drawer counts, group titles, and footer typography to use the local editorial stack.
- Reduced the default quick shortcut chrome so icons can read more like a quiet icon rail instead of small cards.

### Drawer and dashboard details

- Adjusted the saved drawer width so it has more breathing room on wider screens.
- Let todo text wrap to two lines instead of forcing single-line truncation.
- Updated the duplicate Tab Harbor banner copy so it appears only when there are 3 or more Tab Harbor tabs open.
- Added missing i18n hooks for saved-for-later and todo empty states.
- Moved the desk settings and pinned-order controls out of the top group navigation row and into quiet floating controls at the bottom-right of the page.
- Kept the group navigation inside the left open-tabs column so the right rail can move upward into the space freed by those controls.
- Updated the theme menu to open upward from the bottom-right controls, with a fixed mobile placement so it stays inside the viewport and avoids the drawer triggers.
- Tuned the right-side search box spacing so its top border visually aligns with the divider line in the left open-tabs section header.
- Made the right drawer feel more immediate by opening the shell first, then refreshing only the active drawer view after paint.
- Added a drawer speed slider to Desk settings, with a faster default and persisted 1-5 speed levels.
- Added UI regression coverage for the new group navigation placement, bottom-right floating controls, upward theme menu, search spacing, drawer open path, and drawer speed setting.

### Popup experience

- Synced shortcut icon sizing and mask variables into the extension popup.
- Updated popup rendering/tests for the shortcut icon mask behavior.
- Kept popup styling aligned with the quieter shortcut icon treatment.

### Privacy page

- Updated the privacy page typography to match the local editorial font stack.

## Current Diff Scope

Compared with upstream `V-IOLE-T/tab-harbor@main`, this branch currently changes:

- `extension/drawer-sync-store.js`
- `extension/quick-shortcuts-sync-store.js`
- `extension/theme-controls.js`
- `extension/style.css`
- `extension/index.html`
- `extension/popup/popup.js`
- `extension/popup/popup.css`
- `extension/popup/popup.html`
- `extension/drawer-manager.js`
- `extension/dashboard-runtime.js`
- `extension/i18n.js`
- `extension/manifest.json`
- sync, shortcut, popup, theme, drawer, todo, and UI regression tests
- `privacy.html`

## Validation

Relevant validation command:

```bash
node --test extension/*.test.js extension/popup/*.test.js
```

For script-loading or startup changes, also verify the extension in Chrome because this project uses ordered plain script tags rather than a bundler.

## Notes

The recent GitHub feedback noted that the plain HTML/CSS/JS structure is becoming harder to maintain. This branch does not convert the project to Vue or another framework; it keeps the current architecture and focuses on a narrower set of UI, interaction, and sync refinements.
