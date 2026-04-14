import type { FontFamily, Theme } from '$lib/types';

export interface UserSettings {
	fontFamily: FontFamily;
	fontSize: number;
	lineHeight: number;
	theme: Theme;
	showLineNumbers: boolean;
	wordWrap: boolean;
}

const defaultSettings: UserSettings = {
	fontFamily: 'sans',
	fontSize: 16,
	lineHeight: 1.6,
	theme: 'light',
	showLineNumbers: true,
	wordWrap: true
};

const STORAGE_KEY = 'book-editor-settings';

function loadSettings(): UserSettings {
	if (typeof window === 'undefined') return { ...defaultSettings };

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			return { ...defaultSettings, ...JSON.parse(stored) };
		} catch {
			return { ...defaultSettings };
		}
	}
	return { ...defaultSettings };
}

class SettingsState {
	fontFamily: FontFamily = 'sans';
	fontSize = 16;
	lineHeight = 1.6;
	theme: Theme = 'light';
	showLineNumbers = true;
	wordWrap = true;

	constructor() {
		if (typeof window !== 'undefined') {
			const saved = loadSettings();
			this.fontFamily = saved.fontFamily;
			this.fontSize = saved.fontSize;
			this.lineHeight = saved.lineHeight;
			this.theme = saved.theme;
			this.showLineNumbers = saved.showLineNumbers;
			this.wordWrap = saved.wordWrap;
		}
	}

	update(partial: Partial<UserSettings>) {
		if (partial.fontFamily !== undefined) this.fontFamily = partial.fontFamily;
		if (partial.fontSize !== undefined) this.fontSize = partial.fontSize;
		if (partial.lineHeight !== undefined) this.lineHeight = partial.lineHeight;
		if (partial.theme !== undefined) this.theme = partial.theme;
		if (partial.showLineNumbers !== undefined) this.showLineNumbers = partial.showLineNumbers;
		if (partial.wordWrap !== undefined) this.wordWrap = partial.wordWrap;
		this.save();
	}

	save() {
		if (typeof window === 'undefined') return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				fontFamily: this.fontFamily,
				fontSize: this.fontSize,
				lineHeight: this.lineHeight,
				theme: this.theme,
				showLineNumbers: this.showLineNumbers,
				wordWrap: this.wordWrap
			})
		);
	}

	reset() {
		this.fontFamily = defaultSettings.fontFamily;
		this.fontSize = defaultSettings.fontSize;
		this.lineHeight = defaultSettings.lineHeight;
		this.theme = defaultSettings.theme;
		this.showLineNumbers = defaultSettings.showLineNumbers;
		this.wordWrap = defaultSettings.wordWrap;
		this.save();
	}
}

export const settingsState = new SettingsState();
