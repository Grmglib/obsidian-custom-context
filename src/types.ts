export type MenuSurfaceId = 'editor';

export interface CustomMenuEntry {
	id: string;
	type: 'command' | 'separator';
	/** Required when type is "command". */
	commandId?: string;
	/** Optional label; defaults to the command name. */
	title?: string;
	/** Optional Lucide icon name. */
	icon?: string;
}

export interface SurfaceConfig {
	/** Case-insensitive match against visible menu item titles. */
	hiddenTitles: string[];
	extraEntries: CustomMenuEntry[];
}

export interface CustomContextSettings {
	surfaces: Record<MenuSurfaceId, SurfaceConfig>;
	/** Default Obsidian callout type used by Wrap in callout (e.g. note, tip, warning). */
	defaultCalloutType: string;
	/**
	 * Per built-in plugin command: whether it appears in the editor context menu.
	 * Keys are command ids (e.g. wrap-in-callout).
	 */
	pluginMenuCommands: Record<string, boolean>;
}

export const DEFAULT_SURFACE_CONFIG: SurfaceConfig = {
	hiddenTitles: [],
	extraEntries: [],
};

export const DEFAULT_SETTINGS: CustomContextSettings = {
	surfaces: {
		editor: { ...DEFAULT_SURFACE_CONFIG },
	},
	defaultCalloutType: 'note',
	pluginMenuCommands: {
		'wrap-in-callout': true,
	},
};
