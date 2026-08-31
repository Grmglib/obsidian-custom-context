# Custom Context

Obsidian plugin that lets you customize the context menu (right-click) in the editor.

## What it does (v1)

On right-click **inside a note in edit mode** (Source or Live Preview):

- **Hide** menu items by visible title (native items or from other plugins).
- **Add** Command Palette commands and separators, in the order you define.
- **Wrap in callout:** when you right-click **inside a code block**, an option appears to wrap the block in an Obsidian callout (`> [!note]`, etc.). Also available from the Command Palette. In **Settings → Custom Context → Plugin commands**, choose which plugin commands appear in the context menu.

Items you do not hide stay in the menu; extras are appended at the end.

## How to use

1. Install the plugin and enable it in **Settings → Community plugins**.
2. Open **Settings → Custom Context**.
3. Under **Hidden items**, add titles exactly as they appear in the menu (e.g. `Cut`, `Paste`). Matching is case-insensitive.
4. Under **Extra items**, add commands (any Command Palette command, including other installed plugins) or separators. Use the arrows to reorder.
5. Right-click in the editor to see the updated menu.
6. For **Wrap in callout**, place the cursor inside a code block, right-click and select the option (or use the Command Palette). The default type is set under **Default callout type** in settings.

## Development install

```bash
npm install
npm run dev
```

Copy `main.js`, `manifest.json`, and `styles.css` to:

```
<Vault>/.obsidian/plugins/custom-context/
```

Reload Obsidian and enable the plugin.

## Current scope and future

**Now:** editor menu only (`editor-menu`).

**Possible extensions:** other menus (file explorer, tabs, links), folder/note rules, and deeper integrations with other plugins. Commands from already installed plugins can already be added via the palette in v1.

## Limitations

- There is no official Obsidian API to remove or reorder native items; the plugin hides them via the DOM after the menu is built.
- Reordering native items is not part of v1.
- Hiding by title affects any item with that text in the editor menu.

## License

0-BSD (see `LICENSE`).
