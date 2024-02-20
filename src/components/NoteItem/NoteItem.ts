const template = document.createElement('template');
template.innerHTML = `<style>
    a {
        color: white;
        text-decoration: none;
        padding: 2%;
    }

    a:hover {
        background-color: #20202080;
    }
</style>`

export class NoteItem extends HTMLElement {
    static observedAttributes = ["href"];
    anchor: HTMLAnchorElement

    constructor(name: string, href: string){
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));
        this.anchor = shadow.appendChild(document.createElement('a'));
        this.anchor.href = href;
        this.anchor.innerText = name;
        this.anchor.appendChild(document.createElement('slot'));
    }
    connectedCallback() {

    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {

    }
}