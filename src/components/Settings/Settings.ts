import { createElement, Sun, X as XIcon } from "lucide";
import Storage, { SettingsType } from "../../utils/storage";
import { SettingsInput } from "./SettingsInput";
import _ from 'lodash'
import { Header } from "../Header";
import { SettingsButton } from "./SettingsButton";

if(customElements.get('settings-input') == undefined) customElements.define('settings-input', SettingsInput);
if(customElements.get('settings-button') == undefined) customElements.define('settings-button', SettingsButton);

const xIcon = createElement(XIcon);
xIcon.style.stroke = 'black';

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
    theme: SettingsButton
    storage: Storage
    settings: SettingsType

    constructor(display?: boolean){
        super();
        // Storage
        this.storage = new Storage();
        this.settings = {
            port: '',
            notesShown: '',
            notesScore: '',
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
        // Port settings
        this.port = this.form.appendChild(new SettingsInput('Port', 'Set this to the same port that your Omnisearch server is set to.', 
        async () => {
            await this.saveSettings();
        }));
        // Notes shown settings
        this.notesShown = this.form.appendChild(new SettingsInput('Notes Shown', 'The number of notes shown per query.', 
        async () => {
            await this.saveSettings();
        }));
        // Notes score settings
        this.notesScore = this.form.appendChild(new SettingsInput('Notes Score', 'Filter notes by how closely they relate to your query. Score ranges from 0 - 100.', 
        async () => {
            await this.saveSettings();
        }));
        this.theme = this.form.appendChild(new SettingsButton('Theme', 'Change Omnisearch Companion appearance.', Sun,
        async () => {
            await this.saveSettings();
        }));

        // Close button
        this.heading.button.title = 'Close settings and save';
        this.heading.button.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.saveSettings();
            this.toggleDisplay();
        })

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

    private async loadSettings() {
        this.settings = await this.storage.getSettingsStorage();

        this.port.input.value = this.settings.port;
        // Create synthetic event
        this.port.input.dispatchEvent(new Event('input', { bubbles: true }));

        this.notesShown.input.value = this.settings.notesShown;
        this.notesShown.input.dispatchEvent(new Event('input', { bubbles: true }));

        this.notesScore.input.value = this.settings.notesScore;
        this.notesScore.input.dispatchEvent(new Event('input', { bubbles: true }));

        this.theme.value = this.settings.theme;
        this.theme.button.dispatchEvent(new Event('input', { bubbles: true }));
    }

    private async saveSettings() {
        const settings: SettingsType = {
            port: this.port.input.value,
            notesShown: this.notesShown.input.value,
            notesScore: this.notesScore.input.value,
            theme: this.theme.value
        }
        // Only save if settings have been changed
        if(!_.isEqual(this.settings, settings)){
            await this.storage.setSettingsStorage(settings);
            this.settings = settings;
        }
    }
}