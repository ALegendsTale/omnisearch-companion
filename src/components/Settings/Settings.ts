import { createElement, X as XIcon } from "lucide";
import Storage from "../../utils/storage";

const xIcon = createElement(XIcon);
xIcon.style.stroke = 'black';

const template = document.createElement('template');
template.innerHTML = `<style>
:host {
    z-index: 1;
    color: black;
    background-color: white;
    width: 100%;
    height: 100%;
}

#settings-container {
    display: flex;
    flex-direction: column;
    margin: auto;
    width: 50%;
    height: 100%;
}

#open-settings {
    display: flex;
    align-self: flex-end;
    justify-content: center;
    width: 50%;
    text-align: center;
}

h1 {
    display: flex;
    justify-self: center;
    align-self: center;
}

form {
    display: flex;
    flex-direction: column;
}

form > div {
    display: flex;
    justify-content: space-between;
    padding: 2% 0;
}

form > div > input {
    width: 50%;
}

#close-button {
    position: absolute;
    top: 5vh;
    right: 5vh;
    background-color: white;
    border: none;
    cursor: pointer;
}
</style>`

export class Settings extends HTMLElement {
    container: HTMLDivElement
    heading: HTMLHeadingElement
    form: HTMLFormElement
    portInputContainer: HTMLDivElement
    portSpan: HTMLSpanElement
    portInput: HTMLInputElement
    closeSettingButton: HTMLButtonElement
    openSettingsButton: HTMLButtonElement
    notesShownContainer: HTMLDivElement
    notesShownSpan: HTMLSpanElement
    notesShownInput: HTMLInputElement
    notesScoreContainer: HTMLDivElement
    notesScoreSpan: HTMLSpanElement
    notesScoreInput: HTMLInputElement
    storage: Storage

    constructor(display?: boolean){
        super();
        // Storage
        this.storage = new Storage();
        // Create shadow DOM
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));

        // Create other components
        this.container = shadow.appendChild(document.createElement('div'));
        this.container.id = 'settings-container'
        this.heading = this.container.appendChild(document.createElement('h1'));
        this.heading.innerText = 'Settings';

        // Form items
        this.form = this.container.appendChild(document.createElement('form'));
        this.form.acceptCharset = 'UTF-8'
        // Port settings
        this.portInputContainer = this.form.appendChild(document.createElement('div'));
        this.portSpan = this.portInputContainer.appendChild(document.createElement('span'));
        this.portSpan.innerText = 'Port';
        this.portInput = this.portInputContainer.appendChild(document.createElement('input'));
        this.portInput.type = 'text';
        this.portInput.id = 'port-input';
        this.portInput.name = 'port';
        // Notes shown settings
        this.notesShownContainer = this.form.appendChild(document.createElement('div'));
        this.notesShownSpan = this.notesShownContainer.appendChild(document.createElement('span'));
        this.notesShownSpan.innerText = 'Notes Shown'
        this.notesShownInput = this.notesShownContainer.appendChild(document.createElement('input'));
        this.notesShownInput.type = 'text';
        this.notesShownInput.id = 'notes-shown-input';
        this.notesShownInput.name = 'notes-shown';
        // Notes score settings
        this.notesScoreContainer = this.form.appendChild(document.createElement('div'));
        this.notesScoreSpan = this.notesScoreContainer.appendChild(document.createElement('span'));
        this.notesScoreSpan.innerText = 'Notes Score'
        this.notesScoreInput = this.notesScoreContainer.appendChild(document.createElement('input'));
        this.notesScoreInput.type = 'text';
        this.notesScoreInput.id = 'notes-score-input';
        this.notesScoreInput.name = 'notes-score';

        // Close & open buttons
        this.closeSettingButton = this.container.appendChild(document.createElement('button'));
        this.closeSettingButton.title = 'Close settings and save'
        this.closeSettingButton.id = 'close-button';
        this.closeSettingButton.appendChild(xIcon);
        this.closeSettingButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.saveSettings();
            this.toggleDisplay();
        })
        this.openSettingsButton = this.container.appendChild(document.createElement('button'));
        this.openSettingsButton.id = 'open-settings';
        this.openSettingsButton.innerText = 'Open Settings';
        this.openSettingsButton.addEventListener('click', (e) => {
            e.preventDefault();
            browser.runtime.openOptionsPage();
        })

        // Show settings as an embed
        if(display){
            this.style.display = 'flex';
            this.closeSettingButton.style.display = 'none';
            this.openSettingsButton.style.display = 'none';
        }
        // Show settings as a toggle
        else{
            this.style.display = 'none';
            this.style.position = 'absolute';
            this.style.left = '0';
            this.style.top = '0';
        }
    }
    connectedCallback() {
        this.loadSettings();
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {

    }

    /**
     * Toggle the display of the settings menu
     */
    public toggleDisplay() {
        this.style.display = this.style.display === 'none' ? 'flex' : 'none';
    }

    private async loadSettings() {
        const settings = await this.storage.getSettingsStorage();
        this.portInput.value = settings.port;
        this.notesShownInput.value = settings.notesShown;
        this.notesScoreInput.value = settings.notesScore;
    }

    private async saveSettings() {
        await this.storage.setSettingsStorage({
            port: this.portInput.value,
            notesShown: this.notesShownInput.value,
            notesScore: this.notesScoreInput.value
        })
    }
}