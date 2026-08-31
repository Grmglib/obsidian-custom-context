import type { Editor, Menu } from 'obsidian';
import type CustomContextPlugin from '../main';
import {
	isPluginCommandInContextMenu,
	PLUGIN_MENU_COMMANDS,
} from '../commands/registry';
import { applySurface } from './apply-surface';

export function registerEditorMenu(plugin: CustomContextPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('editor-menu', (menu, editor) => {
			addPluginCommands(plugin, menu, editor);
			applySurface(menu, plugin.app, plugin.settings.surfaces.editor);
		}),
	);
}

function addPluginCommands(
	plugin: CustomContextPlugin,
	menu: Menu,
	editor: Editor,
): void {
	for (const command of PLUGIN_MENU_COMMANDS) {
		if (!isPluginCommandInContextMenu(plugin.settings, command.id)) {
			continue;
		}
		if (!command.isAvailable(editor, plugin)) continue;

		menu.addItem((item) => {
			item.setTitle(command.name);
			if (command.icon) item.setIcon(command.icon);
			item.onClick(() => {
				command.run(editor, plugin);
			});
		});
	}
}
