import Storage, { ThemeType } from "../../utils/storage";
import { createElement, IconNode, Moon, Sun } from "lucide";

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

    div > .button-container {
        position:  relative;
        display: flex;
        flex-direction: row;
        flex-basis: 88px;
        justify-content: center;
        align-items: center;
    }

    .button-container > button {
        background-color: transparent;
        border: none;
    }

    .button-container > button > svg {
        width: 90%;
        height: 90%;
        stroke: var(--text);
    }

    .button-container > button:hover > svg {
        stroke: var(--highlight);
    }
</style>`

const storage = new Storage();

export class SettingsButton extends HTMLElement {
    fieldName: string
    fieldContainer: HTMLDivElement
    nameContainer: HTMLDivElement
    buttonContainer: HTMLDivElement
    name: HTMLSpanElement
    description: HTMLSpanElement
    button: HTMLButtonElement
    icon: SVGElement
    value: ThemeType

    constructor(fieldName: string, fieldDescription: string, icon: IconNode, onSubmit: () => void){
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));
        this.fieldName = fieldName;
        this.value = this.getDefaultValue();
        this.fieldContainer = shadow.appendChild(document.createElement('div'));
        this.nameContainer = this.fieldContainer.appendChild(document.createElement('div'));
        this.nameContainer.className = 'name-container';
        this.buttonContainer = this.fieldContainer.appendChild(document.createElement('div'));
        this.buttonContainer.className = 'button-container';
        this.name = this.nameContainer.appendChild(document.createElement('span'));
        this.name.className = 'setting-name'
        this.name.innerText = fieldName;
        this.description = this.nameContainer.appendChild(document.createElement('span'));
        this.description.className = 'setting-description'
        this.description.innerText = fieldDescription;
        this.button = this.buttonContainer.appendChild(document.createElement('button'));
        this.icon = this.button.appendChild(createElement(icon));
        this.button.addEventListener('click', (e) => {
            this.value = this.value === 'light' ? 'dark' : 'light';
            document.documentElement.style.setProperty('--background', this.value === 'light' ? 'var(--grey)' : 'var(--dark-2)');
            document.documentElement.style.setProperty('--text', this.value === 'light' ? 'var(--dark)' : 'var(--off-white)');
            document.documentElement.style.setProperty('--text-box', this.value === 'light' ? 'var(--off-white)' : 'var(--dark)');
            document.documentElement.style.setProperty('--hightlight', this.value === 'light' ? 'var(--purple)' : 'var(--light-purple)');
            this.button.removeChild(this.icon);
            this.icon = this.button.appendChild(createElement(this.value === 'light' ? Moon : Sun));
            onSubmit();
        })
        this.button.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--background', this.value === 'light' ? 'var(--grey)' : 'var(--dark-2)');
            document.documentElement.style.setProperty('--text', this.value === 'light' ? 'var(--dark)' : 'var(--off-white)');
            document.documentElement.style.setProperty('--text-box', this.value === 'light' ? 'var(--off-white)' : 'var(--dark)');
            document.documentElement.style.setProperty('--hightlight', this.value === 'light' ? 'var(--purple)' : 'var(--light-purple)');
            this.button.removeChild(this.icon);
            this.icon = this.button.appendChild(createElement(this.value === 'light' ? Moon : Sun));
        })
    }
    async connectedCallback() {

    }
    public isDefaultValue() {
        if(this.button.value === this.getDefaultValue()) return true;
        else return false;
    }
    public getDefaultValue() {
        const fieldNameCamel = this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1).replace(' ', '');
        return storage.defaultValues[fieldNameCamel];
    }
}