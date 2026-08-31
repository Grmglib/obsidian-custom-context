import type { App, Menu } from 'obsidian';
import type { SurfaceConfig } from '../types';

/** Minimal typing for the internal commands API. */
interface CommandsApi {
	listCommands: () => Array<{ id: string; name: string; icon?: string }>;
	executeCommandById: (id: string) => boolean;
	findCommand: (id: string) => { id: string; name: string; icon?: string } | null;
}

export function getCommandsApi(app: App): CommandsApi {
	return (app as unknown as { commands: CommandsApi }).commands;
}

/**
 * Adds configured extra entries (commands / separators) to a context menu.
 */
export function addExtraEntries(menu: Menu, app: App, config: SurfaceConfig): void {
	const commands = getCommandsApi(app);
	const entries = config.extraEntries;
	if (entries.length === 0) return;

	menu.addSeparator();

	for (const entry of entries) {
		if (entry.type === 'separator') {
			menu.addSeparator();
			continue;
		}

		const commandId = entry.commandId;
		if (!commandId) continue;

		const command = commands.findCommand(commandId);
		const title = entry.title?.trim() || command?.name || commandId;
		const icon = entry.icon || command?.icon;

		menu.addItem((item) => {
			item.setTitle(title);
			if (icon) item.setIcon(icon);
			item.onClick(() => {
				commands.executeCommandById(commandId);
			});
		});
	}
}

/**
 * Hides menu items whose visible title matches any of the configured hidden titles
 * (case-insensitive). Also collapses consecutive/orphan separators.
 *
 * Runs after a short delay so other plugins can finish populating the menu.
 */
export function hideMatchingItems(menu: Menu, config: SurfaceConfig): void {
	const titles = config.hiddenTitles
		.map((t) => t.trim().toLowerCase())
		.filter(Boolean);
	if (titles.length === 0) return;

	const run = () => {
		const menuEl = (menu as unknown as { dom?: HTMLElement }).dom;
		if (!menuEl) return;

		const items = Array.from(
			menuEl.querySelectorAll<HTMLElement>('.menu-item'),
		);

		for (const el of items) {
			if (el.classList.contains('menu-separator')) continue;

			const titleEl = el.querySelector('.menu-item-title');
			const text = (titleEl?.textContent ?? el.textContent ?? '')
				.trim()
				.toLowerCase();

			if (text && titles.includes(text)) {
				el.addClass('cc-hidden-item');
				el.hide();
			}
		}

		collapseOrphanSeparators(menuEl);
	};

	// Defer so core + other plugins finish adding items first.
	window.setTimeout(run, 0);
}

function collapseOrphanSeparators(menuEl: HTMLElement): void {
	const children = Array.from(menuEl.children) as HTMLElement[];
	let lastWasSeparatorOrHidden = true; // treat start as "edge"

	for (const child of children) {
		const isSeparator = child.classList.contains('menu-separator');
		const isHidden =
			child.hasClass('cc-hidden-item') ||
			child.style.display === 'none' ||
			child.hasClass('is-hidden');

		if (isHidden && !isSeparator) {
			continue;
		}

		if (isSeparator) {
			if (lastWasSeparatorOrHidden) {
				child.addClass('cc-hidden-item');
				child.hide();
			} else {
				lastWasSeparatorOrHidden = true;
			}
			continue;
		}

		lastWasSeparatorOrHidden = false;
	}

	// Hide trailing separators
	for (let i = children.length - 1; i >= 0; i--) {
		const child = children[i];
		if (!child) continue;

		const isHidden =
			child.hasClass('cc-hidden-item') || child.style.display === 'none';
		const isSeparator = child.classList.contains('menu-separator');

		if (isHidden && !isSeparator) continue;
		if (isSeparator) {
			child.addClass('cc-hidden-item');
			child.hide();
			continue;
		}
		break;
	}
}

/**
 * Applies a surface config: add extras immediately, hide matches after paint.
 */
export function applySurface(menu: Menu, app: App, config: SurfaceConfig): void {
	addExtraEntries(menu, app, config);
	hideMatchingItems(menu, config);
}
