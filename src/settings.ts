import { App, PluginSettingTab, Setting } from 'obsidian';
import type CustomContextPlugin from './main';
import type { CustomMenuEntry } from './types';
import {
	isPluginCommandInContextMenu,
	PLUGIN_MENU_COMMANDS,
} from './commands/registry';
import { CommandSuggestModal } from './ui/command-suggest';
import { getCommandsApi } from './menus/apply-surface';

function newEntryId(): string {
	return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function swapEntries(list: CustomMenuEntry[], a: number, b: number): void {
	const itemA = list[a];
	const itemB = list[b];
	if (itemA === undefined || itemB === undefined) return;
	list[a] = itemB;
	list[b] = itemA;
}

export class CustomContextSettingTab extends PluginSettingTab {
	plugin: CustomContextPlugin;

	constructor(app: App, plugin: CustomContextPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Native menus')
			.setDesc(
				'On desktop, turn off Settings → Appearance → Native menus so this plugin can hide and restyle context-menu items.',
			);

		new Setting(containerEl)
			.setName('Default callout type')
			.setDesc(
				'Used by Wrap in callout when right-clicking a code block (for example note, tip, warning, info).',
			)
			.addText((text) =>
				text
					.setPlaceholder('note')
					.setValue(this.plugin.settings.defaultCalloutType)
					.onChange((value) => {
						this.plugin.settings.defaultCalloutType =
							value.trim() || 'note';
						void this.plugin.saveSettings();
					}),
			);

		this.renderPluginCommandsSection(containerEl);
		this.renderEditorSection(containerEl);
	}

	private renderPluginCommandsSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Plugin commands').setHeading();

		containerEl.createEl('p', {
			text: 'Built-in commands from this plugin. Toggle which ones appear in the editor context menu. They remain available in the command palette.',
			cls: 'setting-item-description',
		});

		for (const command of PLUGIN_MENU_COMMANDS) {
			new Setting(containerEl)
				.setName(command.name)
				.setDesc(command.description)
				.addToggle((toggle) =>
					toggle
						.setValue(
							isPluginCommandInContextMenu(
								this.plugin.settings,
								command.id,
							),
						)
						.onChange((value) => {
							this.plugin.settings.pluginMenuCommands[command.id] =
								value;
							void this.plugin.saveSettings();
						}),
				);
		}
	}

	private renderEditorSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Editor').setHeading();

		containerEl.createEl('p', {
			text: 'Applies when you right-click inside a note in edit mode (source or live preview).',
			cls: 'setting-item-description',
		});

		this.renderHiddenTitles(containerEl);
		this.renderExtraEntries(containerEl);
	}

	private renderHiddenTitles(containerEl: HTMLElement): void {
		const surface = this.plugin.settings.surfaces.editor;

		new Setting(containerEl)
			.setName('Hidden items')
			.setDesc(
				'Hide menu items by their visible title (case-insensitive). Copy the text exactly as it appears in the menu, for example Cut or Paste.',
			)
			.addButton((btn) =>
				btn.setButtonText('Add title').onClick(() => {
					void (async () => {
						surface.hiddenTitles.push('');
						await this.plugin.saveSettings();
						this.display();
					})();
				}),
			);

		surface.hiddenTitles.forEach((title, index) => {
			new Setting(containerEl)
				.setClass('cc-list-row')
				.addText((text) =>
					text
						.setPlaceholder('Cut')
						.setValue(title)
						.onChange((value) => {
							surface.hiddenTitles[index] = value;
							void this.plugin.saveSettings();
						}),
				)
				.addExtraButton((btn) =>
					btn
						.setIcon('trash')
						.setTooltip('Remove')
						.onClick(() => {
							void (async () => {
								surface.hiddenTitles.splice(index, 1);
								await this.plugin.saveSettings();
								this.display();
							})();
						}),
				);
		});
	}

	private renderExtraEntries(containerEl: HTMLElement): void {
		const surface = this.plugin.settings.surfaces.editor;
		const commands = getCommandsApi(this.app);

		new Setting(containerEl)
			.setName('Extra items')
			.setDesc(
				'Commands and separators appended to the editor context menu, in this order.',
			)
			.addButton((btn) =>
				btn.setButtonText('Add command').onClick(() => {
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
							this.display();
						})();
					}).open();
				}),
			)
			.addButton((btn) =>
				btn.setButtonText('Add separator').onClick(() => {
					void (async () => {
						surface.extraEntries.push({
							id: newEntryId(),
							type: 'separator',
						});
						await this.plugin.saveSettings();
						this.display();
					})();
				}),
			);

		surface.extraEntries.forEach((entry, index) => {
			this.renderExtraEntryRow(containerEl, entry, index, commands);
		});
	}

	private renderExtraEntryRow(
		containerEl: HTMLElement,
		entry: CustomMenuEntry,
		index: number,
		commands: ReturnType<typeof getCommandsApi>,
	): void {
		const surface = this.plugin.settings.surfaces.editor;
		const setting = new Setting(containerEl).setClass('cc-list-row');

		if (entry.type === 'separator') {
			setting.setName('Separator');
		} else {
			const command = entry.commandId
				? commands.findCommand(entry.commandId)
				: null;
			const label = entry.title || command?.name || entry.commandId || 'Command';
			setting.setName(label);
			setting.setDesc(entry.commandId ?? '');

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
								this.display();
							})();
						}).open();
					}),
			);
		}

		setting
			.addExtraButton((btn) =>
				btn
					.setIcon('lucide-arrow-up')
					.setTooltip('Move up')
					.setDisabled(index === 0)
					.onClick(() => {
						if (index === 0) return;
						void (async () => {
							swapEntries(surface.extraEntries, index - 1, index);
							await this.plugin.saveSettings();
							this.display();
						})();
					}),
			)
			.addExtraButton((btn) =>
				btn
					.setIcon('lucide-arrow-down')
					.setTooltip('Move down')
					.setDisabled(index === surface.extraEntries.length - 1)
					.onClick(() => {
						const list = surface.extraEntries;
						if (index >= list.length - 1) return;
						void (async () => {
							swapEntries(list, index, index + 1);
							await this.plugin.saveSettings();
							this.display();
						})();
					}),
			)
			.addExtraButton((btn) =>
				btn
					.setIcon('trash')
					.setTooltip('Remove')
					.onClick(() => {
						void (async () => {
							surface.extraEntries.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						})();
					}),
			);
	}
}
