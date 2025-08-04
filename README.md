# Omnisearch Companion

This extension displays relevant notes using the powerful [Omnisearch](https://github.com/scambier/obsidian-omnisearch) plugin for Obsidian from your browser. You can search your Obsidian vault while searching the web and quickly open the results in Obsidian.

![Omnisearch Companion](demo.png) ![Settings](demo-settings.png)

## Permissions Notice

### tabs

Required to retrieve URL queries which Omnisearch uses to determine which notes to fetch.

### storage

Required to store settings for user customization and plugin function.

### contextMenus

Required to add a button to the right click (context) menu for interactions with links or text selections.

## Installation

The plugin is available for both Firefox and Chrome browsers.

- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/omnisearch-companion/)
- [Chrome](https://chromewebstore.google.com/detail/omnisearch-companion/kcjcnnlpfbilodfnnkpioijobpjhokkd)

After installing the plugin:

- Install the Omnisearch plugin for Obsidian and enable the local HTTP server option
- Set your preferred port (default port is 51361)
- Enjoy passively searching your vault!

## Build from Source

Firefox

- npm `export-ff`

Chrome

- npm `export-cr`
