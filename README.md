# Tab Harbor Changes

[English](README.md) | [简体中文](README.zh-CN.md)

This fork keeps the original Tab Harbor idea, but this README only records the changes made in this branch.

## What Changed

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

### Popup experience

- Synced shortcut icon sizing and mask variables into the extension popup.
- Updated popup rendering/tests for the shortcut icon mask behavior.
- Kept popup styling aligned with the quieter shortcut icon treatment.

### Privacy page

- Updated the privacy page typography to match the local editorial font stack.

## Current Diff Scope

Compared with upstream `V-IOLE-T/tab-harbor@main`, this branch currently changes:

- `extension/theme-controls.js`
- `extension/style.css`
- `extension/index.html`
- `extension/popup/popup.js`
- `extension/popup/popup.css`
- `extension/drawer-manager.js`
- `extension/dashboard-runtime.js`
- `extension/i18n.js`
- shortcut, popup, theme, and UI regression tests
- `privacy.html`

## Validation

Relevant validation command:

```bash
node --test extension/*.test.js extension/popup/*.test.js
```

For script-loading or startup changes, also verify the extension in Chrome because this project uses ordered plain script tags rather than a bundler.

## Notes

The recent GitHub feedback noted that the plain HTML/CSS/JS structure is becoming harder to maintain. This branch does not convert the project to Vue or another framework; it keeps the current architecture and focuses on a narrower set of UI and interaction refinements.
