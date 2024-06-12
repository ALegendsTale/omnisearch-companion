import Storage from "../../utils/storage";

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

    div > .interface-container {
        position:  relative;
        display: flex;
        flex-direction: row;
        flex-basis: 88px;
        flex-shrink: 0;
        justify-content: center;
        align-items: center;
    }

    .interface-container > button {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .interface-container > button > svg {
        width: 90%;
        height: 90%;
        stroke: var(--text);
    }

    .interface-container > button:hover {
        background-color: var(--background);
    }

    .interface-container > button:hover > svg {
        stroke: var(--highlight);
    }
</style>`

export class SettingsField extends HTMLElement {
    shadow: ShadowRoot
    fieldName: string
    fieldContainer: HTMLDivElement
    nameContainer: HTMLDivElement
    interfaceContainer: HTMLDivElement
    name: HTMLSpanElement
    description: HTMLSpanElement
    storage: Storage

    constructor(fieldName: string, fieldDescription: string, onSubmit: () => void){
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.append(template.content.cloneNode(true));
        this.storage = new Storage();
        this.fieldName = fieldName;
        this.fieldContainer = this.shadow.appendChild(document.createElement('div'));
        this.nameContainer = this.fieldContainer.appendChild(document.createElement('div'));
        this.nameContainer.className = 'name-container';
        this.interfaceContainer = this.fieldContainer.appendChild(document.createElement('div'));
        this.interfaceContainer.className = 'interface-container';
        this.name = this.nameContainer.appendChild(document.createElement('span'));
        this.name.className = 'setting-name'
        this.name.innerText = fieldName;
        this.description = this.nameContainer.appendChild(document.createElement('span'));
        this.description.className = 'setting-description'
        this.description.innerText = fieldDescription;
    }
    
    /**
     * Checks if `fieldValue` is equal to the field's default value.
     */
    public isDefaultValue(fieldValue: any) {
        if(fieldValue === this.getDefaultValue()) return true;
        else return false;
    }

    /**
     * Retrieves the default value of the current `SettingsField` from storage
     */
    public getDefaultValue() {
        const fieldNameCamel = this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1).replace(' ', '');
        return this.storage.defaultValues[fieldNameCamel];
    }
}