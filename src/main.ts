import { Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin } from 'obsidian';
import {
	getDefaultPluginMenuVisibility,
	PLUGIN_MENU_COMMANDS,
} from './commands/registry';
import { registerEditorMenu } from './menus/editor';
import { CustomContextSettingTab } from './settings';
import { CustomContextSettings, DEFAULT_SETTINGS } from './types';

export default class CustomContextPlugin extends Plugin {
	settings!: CustomContextSettings;

	async onload() {
		await this.loadSettings();
		registerEditorMenu(this);
		this.registerCommands();
		this.addSettingTab(new CustomContextSettingTab(this.app, this));
	}

	onunload() {}

	private registerCommands(): void {
		for (const command of PLUGIN_MENU_COMMANDS) {
			this.addCommand({
				id: command.id,
				name: command.name,
				icon: command.icon,
				editorCheckCallback: (
					checking: boolean,
					editor: Editor,
					_ctx: MarkdownView | MarkdownFileInfo,
				) => {
					const available = command.isAvailable(editor, this);
					if (checking) return available;

					if (!available) {
						new Notice('Command is not available here.');
						return false;
					}
					command.run(editor, this);
					return true;
				},
			});
		}
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<CustomContextSettings> | null;
		const defaults = getDefaultPluginMenuVisibility();
		this.settings = {
			surfaces: {
				editor: {
					hiddenTitles: [
						...(data?.surfaces?.editor?.hiddenTitles ??
							DEFAULT_SETTINGS.surfaces.editor.hiddenTitles),
					],
					extraEntries: [
						...(data?.surfaces?.editor?.extraEntries ??
							DEFAULT_SETTINGS.surfaces.editor.extraEntries),
					],
				},
			},
			defaultCalloutType:
				data?.defaultCalloutType?.trim() ||
				DEFAULT_SETTINGS.defaultCalloutType,
			pluginMenuCommands: {
				...defaults,
				...(data?.pluginMenuCommands ?? {}),
			},
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
