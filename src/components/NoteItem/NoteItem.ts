const template = document.createElement('template');
template.innerHTML = `<style>
    :host {
        margin-bottom: 7px;
    }

    ul {
        display: flex;
        flex: 1;
        margin: 0;
        padding-left: 5%;
    }

    a {
        color: var(--dark);
        text-decoration: none;
        cursor: pointer;
        font-family: Inter;
        font-size: 1rem;
    }

    a:hover {
        color: var(--purple);
    }
</style>`

export class NoteItem extends HTMLElement {
    static observedAttributes = ["href"];
    list: HTMLUListElement
    listItem: HTMLLIElement
    anchor: HTMLAnchorElement

    constructor(name: string, href: string){
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));
        this.list = shadow.appendChild(document.createElement('ul'));
        this.listItem = this.list.appendChild(document.createElement('li'));
        this.anchor = this.listItem.appendChild(document.createElement('a'));
        this.anchor.innerText = name;
        this.anchor.appendChild(document.createElement('slot'));
        this.anchor.addEventListener('click', async (e) => {
            const tabs = await browser.tabs.query({ currentWindow: true, active: true });
            // Send href to current active tab
            if(tabs[0]?.id) browser.tabs.sendMessage(tabs[0].id, { value: href, sender: 'NoteItem' });
            // Close popup window
            window.close();
        })
    }
    connectedCallback() {

    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {

    }
}