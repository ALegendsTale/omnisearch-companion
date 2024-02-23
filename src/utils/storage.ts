type SettingsType = {
    port: string
    notesShown: string
    notesScore: string
}

export default class Storage {
    constructor(){

    }

    /**
     * Retrieve settings from storage
     * @returns settings object
     */
    public async getSettingsStorage() {
        const settingsObject = await browser.storage.sync.get("settings") as {settings: SettingsType};
        const settings = settingsObject.settings;
        return {
            port: settings?.port || '51361',
            notesShown: settings?.notesShown || '5',
            notesScore: settings?.notesScore || '10'
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