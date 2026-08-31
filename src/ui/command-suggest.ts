import { App, FuzzySuggestModal } from 'obsidian';
import { getCommandsApi } from '../menus/apply-surface';

export interface CommandOption {
	id: string;
	name: string;
	icon?: string;
}

export class CommandSuggestModal extends FuzzySuggestModal<CommandOption> {
	private onChoose: (command: CommandOption) => void;

	constructor(app: App, onChoose: (command: CommandOption) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder('Select a command…');
	}

	getItems(): CommandOption[] {
		return getCommandsApi(this.app)
			.listCommands()
			.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	getItemText(item: CommandOption): string {
		return item.name;
	}

	onChooseItem(item: CommandOption): void {
		this.onChoose(item);
	}
}
