# Privacy Policy for Tab Harbor

Last updated: 2026-04-18

Tab Harbor is a Chrome extension that turns the browser new tab page into a calmer workspace for open tabs, quick links, saved reads, and lightweight todos.

This Privacy Policy explains what data Tab Harbor accesses, how that data is used, and how it is stored.

## 1. Summary

Tab Harbor is designed to work locally in the browser.

It does not require a user account.
It does not sell user data.
It does not use remote code.
It does not send workspace data to a backend controlled by the developer.

Most extension data is stored locally through Chrome extension storage APIs.

## 2. Information the extension accesses

To provide its core features, Tab Harbor may access the following categories of data:

- Open tab metadata, including tab titles, URLs, and tab state
- Quick links created by the user
- Saved read-later items created by the user
- Todo items created by the user
- Theme, transparency, layout, and ordering preferences selected by the user
- Clipboard image or SVG content, but only when the user explicitly pastes a custom shortcut icon

Tab Harbor does not intentionally collect sensitive categories such as health data, financial account credentials, or personal communications.

## 3. How the data is used

Tab Harbor uses the accessed data only to provide the extension’s single purpose:

- Show and organize the user’s current browser session in the new tab page
- Help the user review, group, focus, close, deduplicate, save, and restore tabs
- Let the user manage quick links, saved reads, and lightweight todos in one workspace
- Restore user preferences and layout state when the new tab page is opened again
- Let the user paste a custom icon into a shortcut when they explicitly choose to do so

Tab Harbor does not use this data for advertising, profiling, creditworthiness, or unrelated analytics.

## 4. Chrome permissions and why they are needed

Tab Harbor requests the following Chrome permissions:

### `tabs`

Used to read and manage the user’s open tabs so the extension can:

- display open tabs in the workspace
- group tabs by site or workflow
- focus a selected tab
- close or deduplicate tabs at the user’s request
- save or restore tabs as part of the read-later workflow

### `storage`

Used to store user-created and user-selected local state, including:

- quick links
- saved reads
- todo items
- theme settings
- group order and layout order
- other local workspace preferences

### `search`

Used when the user types into the built-in search field and explicitly submits a search.  
This permission allows Tab Harbor to send the query through the browser’s default search engine in the current tab.

### `clipboardRead`

Used only when the user explicitly pastes an image or SVG into the shortcut editor to create a custom shortcut icon.  
Tab Harbor does not continuously monitor or silently read clipboard contents in the background.

## 5. Data storage and retention

Tab Harbor stores extension data using Chrome extension storage APIs. Saved reads and todos may use `chrome.storage.sync` so Chrome can sync them between browser instances signed into the same Chrome account with Chrome Sync enabled. Other workspace data is stored primarily in `chrome.storage.local`.

This includes items such as:

- quick links
- saved reads
- todos
- theme preferences
- layout and ordering preferences

This data remains in the browser profile until the user removes it through the extension UI, clears extension storage, or uninstalls the extension.
Synced saved reads and todos are also subject to the user's Chrome Sync settings and Google account sync controls.

## 6. Data sharing

Tab Harbor does not sell user data.

Tab Harbor does not transfer user data to third parties except where necessary to perform a user-requested browser action, such as:

- opening a page URL chosen by the user
- sending a search query through the browser’s default search engine after the user explicitly submits it

Aside from those normal browser actions initiated by the user, Tab Harbor does not send workspace data to a developer-controlled remote service.

## 7. Remote code

Tab Harbor does not use remote code.

All JavaScript and extension assets required to run the extension are packaged with the extension bundle. Tab Harbor does not download and execute external JavaScript or WebAssembly at runtime.

## 8. Third-party services

Tab Harbor relies on Chrome’s extension platform APIs to function.

When a user opens a webpage or submits a search through the extension, the browser may connect to the destination website or the configured default search engine as part of the user’s explicit action.

## 9. User choices and controls

Users can control their data by:

- editing or deleting quick links
- deleting saved reads or todos
- changing theme and layout preferences
- uninstalling the extension
- clearing extension storage through browser settings

If you do not want Tab Harbor to access your open tabs, do not use the extension.

## 10. Children’s privacy

Tab Harbor is not directed to children under 13, and the developer does not knowingly collect personal information from children.

## 11. Changes to this policy

This Privacy Policy may be updated from time to time to reflect product changes, permission changes, or legal requirements.

The latest version will be published at the public URL associated with the extension listing.

## 12. Contact

If you have questions about this Privacy Policy or Tab Harbor, you may contact:

- Publisher contact email: `lunatic.halle@gmail.com`
