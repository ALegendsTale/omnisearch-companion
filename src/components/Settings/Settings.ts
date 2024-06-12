import { createElement, Sun, X as XIcon } from "lucide";
import Storage, { SearchType, SettingsType } from "../../utils/storage";
import { SettingsInput } from "./SettingsInput";
import _ from 'lodash'
import { Header } from "../Header";
import { SettingsButton } from "./SettingsButton";
import { SettingsDropdown } from "./SettingsDropdown";

// Define custom elements
if(customElements.get('settings-input') == undefined) customElements.define('settings-input', SettingsInput);
if(customElements.get('settings-button') == undefined) customElements.define('settings-button', SettingsButton);
if(customElements.get('settings-dropdown') == undefined) customElements.define('settings-dropdown', SettingsDropdown);

const template = document.createElement('template');
template.innerHTML = `<style>
:host {
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
    background-color: var(--background);
    width: 100%;
}

#settings-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    height: 100vh;
}

#settings-content {
    display: flex;
    flex-direction: column;
    background-color: var(--text-box);
    border-radius: 5px;
    font-size: 1rem;
    padding: 5%;
    margin-bottom: 5%;
    flex-wrap: nowrap;
    color: var(--text);
    width: 80%;
    height: 100%;
    overflow-y: auto;
    scrollbar-width: thin;
}

h3 {
    color: var(--light-purple);
    font-weight: bold;
    font-family: Inter;
    font-size: 1.25rem;
    margin: 5%;
}

form {
    display: flex;
    flex-direction: column;
}

#open-settings {
    display: flex;
    align-self: flex-end;
    justify-content: center;
    width: 50%;
    text-align: center;
    color: var(--text);
}
</style>`

export class Settings extends HTMLElement {
    container: HTMLDivElement
    contentContainer: HTMLDivElement
    heading: Header
    subHeading: HTMLHeadingElement
    form: HTMLFormElement
    port: SettingsInput
    notesShown: SettingsInput
    notesScore: SettingsInput
    searchType: SettingsDropdown
    theme: SettingsButton
    storage: Storage
    settings: SettingsType

    constructor(display?: boolean){
        super();
        this.storage = new Storage();
        this.settings = {
            port: '',
            notesShown: '',
            notesScore: '',
            searchType: 'Both',
            theme: 'light',
        }
        // Create shadow DOM
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));

        this.container = shadow.appendChild(document.createElement('div'));
        this.container.id = 'settings-container'

        this.heading = this.container.appendChild(new Header(true));

        this.subHeading = this.container.appendChild(document.createElement('h3'));
        this.subHeading.innerText = 'Settings';

        this.contentContainer = this.container.appendChild(document.createElement('div'));
        this.contentContainer.id = 'settings-content'

        // Form items
        this.form = this.contentContainer.appendChild(document.createElement('form'));
        this.form.acceptCharset = 'UTF-8'

        /* Create Settings */

        this.port = this.form.appendChild(new SettingsInput('Port', 'Set this to the same port that your Omnisearch server is set to.', 
        async () => {
            await this.saveSettings();
        }));

        this.notesShown = this.form.appendChild(new SettingsInput('Notes Shown', 'The number of notes shown per query.', 
        async () => {
            await this.saveSettings();
        }));

        this.notesScore = this.form.appendChild(new SettingsInput('Notes Score', 'Filter notes by how closely they relate to your query. Score ranges from 0 - 100.', 
        async () => {
            await this.saveSettings();
        }));

        this.searchType = this.form.appendChild(new SettingsDropdown('Search Type', 'Query: Searches notes from search engine matches.\nURL: Searches notes from full-text URL.', ['Query', 'URL', 'Both'],
        async () => {
            await this.saveSettings();
        }));

        this.theme = this.form.appendChild(new SettingsButton('Theme', 'Change Omnisearch Companion appearance.', Sun,
        async () => {
            await this.saveSettings();
        }));

        this.heading.button.title = 'Close settings and save';
        // Save settings & close on click
        this.heading.button.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.saveSettings();
            this.toggleDisplay();
        })

        /* Display settings window in popup or embded into browser default settings */

        // Show settings as an embed
        if(display){
            this.style.display = 'flex';
            this.heading.style.display = 'none';
            this.subHeading.style.display = 'none';
            // Default value for overflow-y
            this.contentContainer.style.overflowY = 'visible';
        }
        // Show settings as a toggle
        else{
            this.style.display = 'none';
            this.style.position = 'absolute';
            this.style.top = '0';
            this.style.left = '0';
        }
    }
    connectedCallback() {
        this.loadSettings();
    }

    /**
     * Toggle the display of the settings menu
     */
    public toggleDisplay() {
        this.style.display = this.style.display === 'none' ? 'flex' : 'none';
    }

    /**
     * Load settings from storage and restore values to `SettingsFields`
     */
    private async loadSettings() {
        this.settings = await this.storage.getSettingsStorage();

        /* Synthetic events to refresh SettingsComponent styles */

        this.port.input.value = this.settings.port;
        this.port.input.dispatchEvent(new Event('input', { bubbles: true }));

        this.notesShown.input.value = this.settings.notesShown;
        this.notesShown.input.dispatchEvent(new Event('input', { bubbles: true }));

        this.notesScore.input.value = this.settings.notesScore;
        this.notesScore.input.dispatchEvent(new Event('input', { bubbles: true }));

        this.searchType.value = this.settings.searchType;
        this.searchType.dropdown.dispatchEvent(new Event('input', { bubbles: true }));

        this.theme.value = this.settings.theme;
        this.theme.button.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Save settings to storage
     */
    private async saveSettings() {
        const settings: SettingsType = {
            port: this.port.input.value,
            notesShown: this.notesShown.input.value,
            notesScore: this.notesScore.input.value,
            searchType: this.searchType.value as SearchType,
            theme: this.theme.value
        }
        // Only save if settings have been changed
        if(!_.isEqual(this.settings, settings)){
            await this.storage.setSettingsStorage(settings);
            this.settings = settings;
        }
    }
}