import { SettingsField } from "./SettingsField";
import { createElement, Undo2 } from "lucide";

const template = document.createElement('template');
template.innerHTML = `<style>
    .interface-container > div {
        position: relative;
        width: 88px;
        height: 24px;
        font-size: .8rem;
        font-family: Inter;
        box-sizing: border-box;
        color: var(--dark);
        background-color: var(--off-white);
        border: 2px inset #EBE9ED;
    }

    .interface-container > div > input {
        display: flex;
        flex: 1;
        align-items: center;
        cursor: pointer;
        user-select: none;
        font-family: Inter;
        border: none;
        background: none;
        padding: 0 0 0 10px;
        text-align: left;
    }

    .interface-container > div > input:hover {
        color: var(--purple);
    }

    .interface-container > div > ul {
        width: 70px;
        position: absolute;
        display: none;
        flex-direction: column;
        gap: 5px;
        list-style: none;
        top: 22px;
        left: -2px;
        padding: 5px 9px;
        margin: 0;
        z-index: 1;
        background-color: var(--grey); 
    }

    .interface-container > div > ul > li {
        font-size: .8rem;
        font-family: Inter;
        color: var(--dark);
        cursor: pointer;
        user-select: none;
        padding: 5%;
    }

    .interface-container > div > ul > li:hover {
        color: var(--purple);
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

export class SettingsDropdown extends SettingsField {
    dropdown: HTMLDivElement
    dropdownInput: HTMLInputElement
    dropdownList: HTMLUListElement
    reset: HTMLButtonElement
    value: string

    constructor(fieldName: string, fieldDescription: string, options: string[], onSubmit: () => void){
        super(fieldName, fieldDescription, () => onSubmit());
        this.shadow.append(template.content.cloneNode(true));
        
        this.dropdown = this.interfaceContainer.appendChild(document.createElement('div'));
        this.dropdownInput = this.dropdown.appendChild(document.createElement('input'));
        this.dropdownInput.type = 'button';
        this.dropdownList = this.dropdown.appendChild(document.createElement('ul'));

        // Close dropdownList after losing focus
        this.addEventListener('blur', () => this.dropdownList.style.setProperty('display', 'none'))
        
        // Toggle dropdownList display when clicked
        this.dropdownInput.addEventListener('click', (e) => this.dropdownList.style.display !== 'flex' ? this.dropdownList.style.setProperty('display', 'flex') : this.dropdownList.style.setProperty('display', 'none'))

        // Create dropdownList options
        for(let [i, optionText] of options.entries()){
            let option = document.createElement('li');
            option.innerText = optionText;
            // The blur event which hides the dropdown happens before the click event occurs, so mousedown must be used.
            option.addEventListener('mousedown', () => {
                // Set value of selected option before saving
                this.value = option.innerText;
                // Hide dropdownList after option is selected
                this.dropdownList.style.setProperty('display', 'none');
                // Set dropdownInput selected item text
                this.dropdown.dispatchEvent(new Event('input', { bubbles: true }));
                // Save value
                onSubmit();
            })
            this.dropdownList.appendChild(option);
        }

        // Set initial default value
        this.value = this.getDefaultValue();

        // Create reset button
        this.reset = this.interfaceContainer.appendChild(document.createElement('button'));
        this.reset.appendChild(createElement(Undo2));
        this.reset.addEventListener('click', (e) => {
            if(confirm(`Reset ${fieldName} to ${this.getDefaultValue()}?`)){
                console.info(`Reset ${fieldName}`);
                // Reset value to default
                this.value = this.getDefaultValue();
                // Hide reset button
                this.setStyle();
                // Save value
                onSubmit();
            }
        })

        // Triggered on first load & on synthetic events
        this.dropdown.addEventListener('input', () => {
            this.setStyle();
        })
    }
    async connectedCallback() {
        
    }
    /**
     * Sets text of the dropdownInput & toggles visibility of the reset button
     */
    setStyle() {
        // Set dropdownInput selected item text
        this.dropdownInput.value = this.value;
        // Set reset button styles
        const isDefault = this.isDefaultValue(this.value);
        this.reset.style.visibility = isDefault ? 'hidden' : 'visible';
        this.reset.title = isDefault ? '' : `Reset to ${this.getDefaultValue()}`;
    }
}