import browser from 'webextension-polyfill';

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
            const [activeTab] = await browser.tabs.query({active: true, currentWindow:true});
            // Open deep-link directly without creating tab / window
            browser.tabs.update(activeTab.id, { url: `obsidian://open?vault=ObsidianVault&file=${note.path}` });
            // Close popup window
            window.close();
        })
    }
    connectedCallback() {

    }
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {

    }
}