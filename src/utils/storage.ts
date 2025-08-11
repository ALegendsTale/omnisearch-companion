import browser from 'webextension-polyfill';

type NotesShown = string;
type NotesScore = string;
export type SearchType = "Auto" | "Query" | "Full URL" | "Partial URL" | "Title";
export type ThemeType = "light" | "dark";

export type SettingsType = {
	notesShown: NotesShown
	notesScore: NotesScore
	searchType: SearchType
	theme: ThemeType
}

export type Vault = { name: string, port: number, active: boolean };

export default class Storage {
	public defaultSettings: SettingsType;
	public defaultVaults: Vault[];

	constructor(){
		this.defaultSettings = {
			notesShown: '25',
			notesScore: '10',
			searchType: 'Auto',
			theme: 'light'
		}
		this.defaultVaults = [
			{
				name: 'default',
				port: 51361,
				active: true
			},
		];
	}

	/**
	 * Retrieve settings from storage
	 * @returns settings object
	 */
	public async getSettings(): Promise<SettingsType> {
		const settings = (await browser.storage.sync.get("settings") as {settings: Partial<SettingsType>}).settings;
		return {
			notesShown: settings?.notesShown ?? this.defaultSettings.notesShown,
			notesScore: settings?.notesScore ?? this.defaultSettings.notesScore,
			searchType: settings?.searchType ?? this.defaultSettings.searchType,
			theme: settings?.theme ?? this.defaultSettings.theme
		}
	}
	
	/**
	 * Set settings in storage.
	 * @param settings Settings object to be stored. Fills any parameters not set with current settings.
	 */
	public async setSettings(settings: SettingsType) {
		const newSettings = {...await this.getSettings(), ...settings};
		await browser.storage.sync.set({ settings: newSettings });
	}
	
	public async getVaults(): Promise<Vault[]> {
		const vaults = (await browser.storage.sync.get("vaults") as {vaults: Vault[]}).vaults;
		return vaults ?? this.defaultVaults;
	}

	public async setVaults(vaults: Vault[]) {
		await browser.storage.sync.set({ vaults });
	}
}