import browser from 'webextension-polyfill';

type Port = string;
type NotesShown = string;
type NotesScore = string;
export type SearchType = "Query" | "URL" | "Both";
export type ThemeType = "light" | "dark";

export type SettingsType = {
	port: Port
	notesShown: NotesShown
	notesScore: NotesScore
	searchType: SearchType
	theme: ThemeType
}

export default class Storage {
	public defaultValues: SettingsType;
	constructor(){
		this.defaultValues = {
			port: '51361',
			notesShown: '25',
			notesScore: '10',
			searchType: 'Both',
			theme: 'light'
		}
	}

	/**
	 * Retrieve settings from storage
	 * @returns settings object
	 */
	public async getSettingsStorage() {
		const settings = (await browser.storage.sync.get("settings") as {settings: Partial<SettingsType>}).settings;
		return {
			port: settings?.port ?? this.defaultValues.port,
			notesShown: settings?.notesShown ?? this.defaultValues.notesShown,
			notesScore: settings?.notesScore ?? this.defaultValues.notesScore,
			searchType: settings?.searchType ?? this.defaultValues.searchType,
			theme: settings?.theme ?? this.defaultValues.theme
		} as SettingsType
	}
	
	/**
	 * Set settings in storage.
	 * @param settings Settings object to be stored. Fills any parameters not set with current settings.
	 */
	public async setSettingsStorage(settings: SettingsType) {
		await browser.storage.sync.set({
			settings: {...await this.getSettingsStorage(), ...settings}
		});
	}
}