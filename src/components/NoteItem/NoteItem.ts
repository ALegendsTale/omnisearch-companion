const template = document.createElement('template');
template.innerHTML = `<style>
    a {
        color: white;
        text-decoration: none;
        cursor: pointer; 
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