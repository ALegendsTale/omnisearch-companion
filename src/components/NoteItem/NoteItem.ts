const template = document.createElement('template');
template.innerHTML = `<style>
    :host {
        margin-bottom: 7px;
    }

    li {
        font-family: Inter;
    }

    a {
        color: var(--text);
        text-decoration: none;
        cursor: pointer;
        font-family: Inter;
        font-size: 1rem;
    }

    a:hover {
        color: var(--highlight);
    }
</style>`

export class NoteItem extends HTMLElement {
    static observedAttributes = ["href"];
    listItem: HTMLLIElement
    anchor: HTMLAnchorElement

    constructor(note: ResultNoteApi){
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.append(template.content.cloneNode(true));
        this.listItem = shadow.appendChild(document.createElement('li'));
        this.anchor = this.listItem.appendChild(document.createElement('a'));
        this.anchor.innerText = note.basename;
        this.anchor.appendChild(document.createElement('slot'));
        this.anchor.addEventListener('click', async (e) => {
            const tabs = await browser.tabs.query({ currentWindow: true, active: true });
            // Send href to current active tab
            if(tabs[0]?.id) browser.tabs.sendMessage(tabs[0].id, { value: `obsidian://open?vault=ObsidianVault&file=${note.path}`, sender: 'NoteItem' });
            // Close popup window
            window.close();
        })
    }
    connectedCallback() {

    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {

    }
}