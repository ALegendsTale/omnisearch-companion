import { SettingsField } from "./SettingsField";
import { createElement, Undo2 } from "lucide";

const template = document.createElement('template');
template.innerHTML = `<style>
    .interface-container > input {
        width: 88px;
        height: 24px;
        padding-left: 10px;
        font-size: .8rem;
        font-family: Inter;
        box-sizing: border-box;
        color: var(--dark);
        background-color: var(--off-white);
    }

    .interface-container > input:hover {
        color: var(--purple)
    }

    .interface-container > button {
        position: absolute;
        right: 0;
        height: 24px;
        border: none;
        box-sizing: border-box;
    }

    .interface-container > button > svg {
        stroke: var(--dark-2);
    }

    .interface-container > button:hover > svg {
        stroke: var(--dark-2);
    }

    .interface-container > button:hover {
        background-color: var(--light-purple);
    }
</style>`

export class SettingsInput extends SettingsField {
    input: HTMLInputElement
    reset: HTMLButtonElement

    constructor(fieldName: string, fieldDescription: string, onSubmit: () => void){
        super(fieldName, fieldDescription, () => onSubmit());
        this.shadow.append(template.content.cloneNode(true));
        const fieldNameSanitized = fieldName.replace(' ', '-').toLowerCase();
        this.input = this.interfaceContainer.appendChild(document.createElement('input'));
        this.input.type = 'text';
        this.input.id = `${fieldNameSanitized}-input`;
        this.input.name = fieldNameSanitized;
        this.reset = this.interfaceContainer.appendChild(document.createElement('button'));
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
            const isDefault = this.isDefaultValue(this.input.value);
            this.reset.style.visibility = isDefault ? 'hidden' : 'visible';
            this.reset.title = isDefault ? '' : `Reset to ${this.getDefaultValue()}`;
        })
    }
}