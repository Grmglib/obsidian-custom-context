import type { Editor, IconName } from 'obsidian';
import type CustomContextPlugin from '../main';
import {
	isCursorInCodeBlock,
	wrapCodeBlockInCallout,
} from './wrap-in-callout';

/**
 * Built-in plugin commands that can optionally appear in the editor context menu.
 * Add new entries here as features grow.
 */
export interface PluginMenuCommand {
	/** Stable id (matches Command.id without plugin prefix). */
	id: string;
	name: string;
	icon?: IconName;
	description: string;
	/** Whether the item is shown in the context menu by default. */
	defaultInContextMenu: boolean;
	/** Return false to hide the item for the current editor state. */
	isAvailable: (editor: Editor, plugin: CustomContextPlugin) => boolean;
	run: (editor: Editor, plugin: CustomContextPlugin) => void;
}

export const PLUGIN_MENU_COMMANDS: PluginMenuCommand[] = [
	{
		id: 'wrap-in-callout',
		name: 'Wrap in callout',
		icon: 'lucide-quote',
		description:
			'Wrap the code block at the cursor in an Obsidian callout. Only available inside a fenced code block.',
		defaultInContextMenu: true,
		isAvailable: (editor) => isCursorInCodeBlock(editor),
		run: (editor, plugin) => {
			wrapCodeBlockInCallout(editor, plugin.settings.defaultCalloutType);
		},
	},
];

export function getDefaultPluginMenuVisibility(): Record<string, boolean> {
	const map: Record<string, boolean> = {};
	for (const cmd of PLUGIN_MENU_COMMANDS) {
		map[cmd.id] = cmd.defaultInContextMenu;
	}
	return map;
}

export function isPluginCommandInContextMenu(
	settings: { pluginMenuCommands: Record<string, boolean> },
	commandId: string,
): boolean {
	const stored = settings.pluginMenuCommands[commandId];
	if (typeof stored === 'boolean') return stored;
	const def = PLUGIN_MENU_COMMANDS.find((c) => c.id === commandId);
	return def?.defaultInContextMenu ?? false;
}
