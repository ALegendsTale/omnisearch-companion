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

#port-container {
    display: flex;
    justify-content: space-between;
}

#port-container > input {
    width: 50%;
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

form > * {
    padding: 2% 0;
}

#close-button {
    position: absolute;
    top: 5vh;
    right: 5vh;
}
</style>`

export class Settings extends HTMLElement {
    container: HTMLDivElement
    heading: HTMLHeadingElement
    form: HTMLFormElement
    inputContainer: HTMLDivElement
    span: HTMLSpanElement
    input: HTMLInputElement
    button: HTMLButtonElement
    openSettingsButton: HTMLButtonElement
    // notesShownContainer: HTMLDivElement
    // notesShownSpan: HTMLSpanElement
    // notesShownInput: HTMLInputElement
    // notesScoreContainer: HTMLDivElement
    // notesScoreSpan: HTMLSpanElement
    // notesScoreInput: HTMLInputElement

    constructor(display?: boolean){
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));
        this.container = shadow.appendChild(document.createElement('div'));
        this.container.id = 'settings-container'
        this.heading = this.container.appendChild(document.createElement('h1'));
        this.heading.innerText = 'Settings';
        this.form = this.container.appendChild(document.createElement('form'));
        this.form.acceptCharset = 'UTF-8'
        this.inputContainer = this.form.appendChild(document.createElement('div'));
        this.inputContainer.id = 'port-container'
        this.span = this.inputContainer.appendChild(document.createElement('span'));
        this.span.innerText = 'Port';
        this.input = this.inputContainer.appendChild(document.createElement('input'));
        this.input.type = 'text';
        this.input.id = 'port-input';
        this.input.name = 'port';
        this.button = this.container.appendChild(document.createElement('button'));
        this.button.id = 'close-button';
        this.button.innerText = 'X';
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
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
            this.button.style.display = 'none';
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
        this.form.addEventListener('submit', this.saveSettings);
    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {

    }
    toggleDisplay() {
        this.style.display = this.style.display === 'none' ? 'flex' : 'none';
    }

    loadSettings() {
        browser.storage.sync.get("port").then((res) => {
            this.input.value = res?.port || (51361).toString();
        });
    }

    saveSettings(event: SubmitEvent) {
        event.preventDefault();
        browser.storage.sync.set({
            port: this.input.value,
        });
    }
}