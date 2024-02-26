import { createElement, Settings as SettingsIcon, Save as SaveIcon } from "lucide";

const template = document.createElement('template');
template.innerHTML = `<style>
    :host {
        width: 100%;
    }
    div {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--purple);
        width: 100%;
        height: 60px;
        gap: 5%;
        box-sizing: border-box;
    }
    h1 {
        font-family: Inter;
        font-weight: bold;
        font-size: 1.5rem;
        color: var(--off-white);
        white-space: nowrap;
    }
    button {
        background-color: transparent;
        border: none;
        cursor: pointer;
    }
    svg {
        background-color: transparent;
        stroke: white;
        width: 1.5rem;
        height: 1.5rem;
    }
    button:hover > svg{
        stroke: var(--grey);
    }
</style>`

export class Header extends HTMLElement {
    container: HTMLDivElement
    name: HTMLHeadingElement
    button: HTMLButtonElement
    icon: SVGElement

    constructor(settings = false){
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));
        this.container = shadow.appendChild(document.createElement('div'));
        this.name = this.container.appendChild(document.createElement('h1'));
        this.button = this.container.appendChild(document.createElement('button'));
        this.icon = this.button.appendChild(createElement(settings ? SaveIcon : SettingsIcon));

        this.name.innerText = 'OMNISEARCH COMPANION';
    }
    connectedCallback() {

    }
}