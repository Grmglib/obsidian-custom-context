import {
	App,
	PluginSettingTab,
	Setting,
	type SettingDefinition,
	type SettingDefinitionItem,
} from 'obsidian';
import type CustomContextPlugin from './main';
import {
	PLUGIN_MENU_COMMANDS,
} from './commands/registry';
import { CommandSuggestModal } from './ui/command-suggest';
import { getCommandsApi } from './menus/apply-surface';

function newEntryId(): string {
	return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getPath(obj: unknown, path: string): unknown {
	let cursor: unknown = obj;
	for (const part of path.split('.')) {
		if (cursor === null || cursor === undefined || typeof cursor !== 'object') {
			return undefined;
		}
		cursor = (cursor as Record<string, unknown>)[part];
	}
	return cursor;
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
	const parts = path.split('.');
	const last = parts.pop();
	if (last === undefined) return;

	let cursor: Record<string, unknown> = obj;
	for (const part of parts) {
		const next = cursor[part];
		if (next === null || typeof next !== 'object') {
			cursor[part] = {};
		}
		cursor = cursor[part] as Record<string, unknown>;
	}
	cursor[last] = value;
}

export class CustomContextSettingTab extends PluginSettingTab {
	plugin: CustomContextPlugin;

	constructor(app: App, plugin: CustomContextPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getControlValue(key: string): unknown {
		return getPath(this.plugin.settings, key);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		let next = value;
		if (key === 'defaultCalloutType' && typeof next === 'string') {
			next = next.trim() || 'note';
		}
		setPath(
			this.plugin.settings as unknown as Record<string, unknown>,
			key,
			next,
		);
		await this.plugin.saveSettings();
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Native menus',
				desc: 'On desktop, turn off Settings → Appearance → Native menus so this plugin can hide and restyle context-menu items.',
			},
			{
				name: 'Default callout type',
				desc: 'Used by Wrap in callout when right-clicking a code block (for example note, tip, warning, info).',
				control: {
					type: 'text',
					key: 'defaultCalloutType',
					placeholder: 'note',
					defaultValue: 'note',
				},
			},
			{
				type: 'group',
				heading: 'Plugin commands',
				items: PLUGIN_MENU_COMMANDS.map((command) => ({
					name: command.name,
					desc: command.description,
					control: {
						type: 'toggle' as const,
						key: `pluginMenuCommands.${command.id}`,
						defaultValue: command.defaultInContextMenu,
					},
				})),
			},
			{
				type: 'page',
				name: 'Editor',
				desc: 'Applies when you right-click inside a note in edit mode (source or live preview).',
				items: [
					this.hiddenTitlesList(),
					this.extraEntriesList(),
				],
			},
		];
	}

	private hiddenTitlesList(): SettingDefinitionItem {
		const surface = this.plugin.settings.surfaces.editor;

		return {
			type: 'list',
			heading: 'Hidden items',
			emptyState:
				'No hidden titles yet. Add a title exactly as it appears in the menu (for example Cut or Paste).',
			addItem: {
				name: 'Add title',
				action: () => {
					void (async () => {
						surface.hiddenTitles.push('');
						await this.plugin.saveSettings();
						this.update();
					})();
				},
			},
			onDelete: (index) => {
				void (async () => {
					surface.hiddenTitles.splice(index, 1);
					await this.plugin.saveSettings();
					this.update();
				})();
			},
			items: surface.hiddenTitles.map(
				(_title, index): SettingDefinition => ({
					name: 'Menu title',
					searchable: false,
					control: {
						type: 'text',
						key: `surfaces.editor.hiddenTitles.${index}`,
						placeholder: 'Cut',
						defaultValue: '',
					},
				}),
			),
		};
	}

	private extraEntriesList(): SettingDefinitionItem {
		const surface = this.plugin.settings.surfaces.editor;
		const commands = getCommandsApi(this.app);

		return {
			type: 'list',
			heading: 'Extra items',
			emptyState:
				'No extra items yet. Add commands or separators to append to the editor context menu.',
			addItem: {
				name: 'Add command',
				action: () => {
					new CommandSuggestModal(this.app, (command) => {
						void (async () => {
							surface.extraEntries.push({
								id: newEntryId(),
								type: 'command',
								commandId: command.id,
								title: command.name,
								icon: command.icon,
							});
							await this.plugin.saveSettings();
							this.update();
						})();
					}).open();
				},
			},
			extraButtons: [
				(btn) =>
					btn
						.setIcon('lucide-separator-horizontal')
						.setTooltip('Add separator')
						.onClick(() => {
							void (async () => {
								surface.extraEntries.push({
									id: newEntryId(),
									type: 'separator',
								});
								await this.plugin.saveSettings();
								this.update();
							})();
						}),
			],
			onReorder: (oldIndex, newIndex) => {
				const list = surface.extraEntries;
				const [moved] = list.splice(oldIndex, 1);
				if (moved === undefined) return;
				list.splice(newIndex, 0, moved);
				void this.plugin.saveSettings();
			},
			onDelete: (index) => {
				void (async () => {
					surface.extraEntries.splice(index, 1);
					await this.plugin.saveSettings();
					this.update();
				})();
			},
			items: surface.extraEntries.map((entry): SettingDefinition => {
				if (entry.type === 'separator') {
					return {
						name: 'Separator',
						searchable: false,
					};
				}

				const command = entry.commandId
					? commands.findCommand(entry.commandId)
					: null;
				const label =
					entry.title || command?.name || entry.commandId || 'Command';

				return {
					name: label,
					desc: entry.commandId ?? '',
					searchable: false,
					render: (setting: Setting) => {
						setting.addText((text) =>
							text
								.setPlaceholder('Custom title (optional)')
								.setValue(entry.title ?? '')
								.onChange((value) => {
									entry.title = value;
									void this.plugin.saveSettings();
								}),
						);

						setting.addExtraButton((btn) =>
							btn
								.setIcon('lucide-pencil')
								.setTooltip('Change command')
								.onClick(() => {
									new CommandSuggestModal(this.app, (command) => {
										void (async () => {
											entry.commandId = command.id;
											entry.title = command.name;
											entry.icon = command.icon;
											await this.plugin.saveSettings();
											this.update();
										})();
									}).open();
								}),
						);
					},
				};
			}),
		};
	}
}
