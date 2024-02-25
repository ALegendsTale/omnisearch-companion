import Storage from "../../utils/storage";
import { createElement, Undo2 } from "lucide";

const template = document.createElement('template');
template.innerHTML = `<style>
    :host {
        margin-bottom: 20px;
    }

    div {
        display: flex;
        justify-content: space-between;
    }

    div > .name-container {
        display: flex;
        flex-direction: column;
        margin-right: 5%;
    }

    .name-container > .setting-name {
        font-size: 1rem;
        font-family: Inter;
        margin-bottom: 1%;
        
    }

    .name-container > .setting-description {
        font-size: .7rem;
        font-family: Inter;
    }

    div > .input-container {
        position:  relative;
        display: flex;
        flex-direction: row;
        height: 24px;
    }

    .input-container > input {
        width: 88px;
        height: 100%;
        padding-left: 10px;
        font-size: .8rem;
        font-family: Inter;
        box-sizing: border-box;
    }

    .input-container > button {
        position: absolute;
        right: 0;
        top: 0;
        height: 100%;
        border: none;
        background-color: transparent;
        color: var(--dark);
        box-sizing: border-box;
    }

    .input-container > button:hover {
        color: var(--purple);
        background-color: var(--grey);
    }

    .input-container > button > svg {
        width: 90%;
        height: 90%;
    }
</style>`

const storage = new Storage();

export class SettingsField extends HTMLElement {
    fieldName: string
    fieldContainer: HTMLDivElement
    nameContainer: HTMLDivElement
    inputContainer: HTMLDivElement
    name: HTMLSpanElement
    description: HTMLSpanElement
    input: HTMLInputElement
    reset: HTMLButtonElement

    constructor(fieldName: string, fieldDescription: string, onSubmit: () => void){
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));
        this.fieldName = fieldName;
        const fieldNameSanitized = fieldName.replace(' ', '-').toLowerCase();
        this.fieldContainer = shadow.appendChild(document.createElement('div'));
        this.nameContainer = this.fieldContainer.appendChild(document.createElement('div'));
        this.nameContainer.className = 'name-container';
        this.inputContainer = this.fieldContainer.appendChild(document.createElement('div'));
        this.inputContainer.className = 'input-container';
        this.name = this.nameContainer.appendChild(document.createElement('span'));
        this.name.className = 'setting-name'
        this.name.innerText = fieldName;
        this.description = this.nameContainer.appendChild(document.createElement('span'));
        this.description.className = 'setting-description'
        this.description.innerText = fieldDescription;
        this.input = this.inputContainer.appendChild(document.createElement('input'));
        this.input.type = 'text';
        this.input.id = `${fieldNameSanitized}-input`;
        this.input.name = fieldNameSanitized;
        this.reset = this.inputContainer.appendChild(document.createElement('button'));
        this.reset.appendChild(createElement(Undo2));
        this.reset.addEventListener('click', (e) => {
            if(confirm(`Reset ${fieldName} to ${this.getDefaultValue()}?`)){
                console.info(`Reset ${fieldName}`);
                this.input.value = this.getDefaultValue();
                // Synthetic event to trigger reset button to become hidden
                this.input.dispatchEvent(new Event('input', { bubbles: true }));
                onSubmit();
            }
        })
        this.input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter'){
                onSubmit();
            }
        })
    }
    async connectedCallback() {
        // input value is set after loading storage in settings
        this.input.addEventListener('input', (e) => {
            const isDefault = this.isDefaultValue();
            this.reset.style.visibility = isDefault ? 'hidden' : 'visible';
            this.reset.title = isDefault ? '' : `Reset to ${this.getDefaultValue()}`;
        })
    }
    public isDefaultValue() {
        if(this.input.value === this.getDefaultValue()) return true;
        else return false;
    }
    public getDefaultValue() {
        const fieldNameCamel = this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1).replace(' ', '');
        return storage.defaultValues[fieldNameCamel];
    }
}