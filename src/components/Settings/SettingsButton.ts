import Storage, { ThemeType } from "../../utils/storage";
import { createElement, IconNode, Moon, Sun } from "lucide";
import { SettingsField } from "./SettingsField";

const template = document.createElement('template');
template.innerHTML = `<style>
    .interface-container > button {
        width: 32px;
        height: 32px;
        background-color: transparent;
        border: none;
    }

    .interface-container > button:hover {
        border-radius: 314px;
    }
</style>`

export class SettingsButton extends SettingsField {
    button: HTMLButtonElement
    icon: SVGElement
    value: ThemeType

    constructor(fieldName: string, fieldDescription: string, icon: IconNode, onSubmit: () => void){
        super(fieldName, fieldDescription, () => onSubmit());
        this.shadow.append(template.content.cloneNode(true));
        this.value = this.getDefaultValue();
        this.button = this.interfaceContainer.appendChild(document.createElement('button'));
        this.icon = this.button.appendChild(createElement(icon));
        this.button.addEventListener('click', (e) => {
            this.value = this.value === 'light' ? 'dark' : 'light';
            this.setStyle();
            onSubmit();
        })
        this.button.addEventListener('input', (e) => {
            this.setStyle();
        })
    }
    async connectedCallback() {

    }
    setStyle() {
        document.documentElement.style.setProperty('--background', this.value === 'light' ? 'var(--grey)' : 'var(--dark-2)');
        document.documentElement.style.setProperty('--text', this.value === 'light' ? 'var(--dark)' : 'var(--off-white)');
        document.documentElement.style.setProperty('--text-box', this.value === 'light' ? 'var(--off-white)' : 'var(--dark)');
        document.documentElement.style.setProperty('--highlight', this.value === 'light' ? 'var(--purple)' : 'var(--light-purple)');
        this.button.removeChild(this.icon);
        this.icon = this.button.appendChild(createElement(this.value === 'light' ? Moon : Sun));
    }
}