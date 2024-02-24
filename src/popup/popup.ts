import { NoteItem } from "../components/NoteItem/NoteItem";
import { Settings } from "../components/Settings/Settings";
import { Header } from "../Header";

customElements.define('note-item', NoteItem);
customElements.define('settings-component', Settings);
customElements.define('header-component', Header);

let popupPort = browser.runtime.connect({ name: 'popup' });
if(popupPort.onMessage.hasListener(createNotes)) popupPort.onMessage.removeListener(createNotes);
popupPort.onMessage.addListener((res) => createNotes(res));

function createNotes(res: object) {
    let { query, notes } = res as {query: string, notes: ResultNoteApi[]};
    // Set query text
    let queryText = document.getElementById('query-text');
    if(queryText) queryText.innerText = `Search Query: ${query ? query : ''}`;
    // Load notes into container
    let contentDiv = document.getElementById('omnisearch-content');
    if(contentDiv) contentDiv.innerHTML = 'Loading...';
    if(!notes){
        if(contentDiv) contentDiv.innerHTML = 'Nothing here yet :(';
        return;
    }
    if(notes.length < 1){
        if(contentDiv) contentDiv.innerHTML = 'No notes match this query';
        return;
    }
    for(let [i, data] of notes.entries()){
        if(i === 0 && data != null){
            if(contentDiv)
            contentDiv.innerHTML = '';
        }
        const noteItem = new NoteItem(data.basename, `obsidian://open?vault=ObsidianVault&file=${data.path}`);
        contentDiv?.appendChild(noteItem);
    }
}

const settings = new Settings();
document.querySelector('body')?.appendChild(settings);

const header = document.getElementsByTagName('header-component')[0] as Header
header.button.addEventListener('click', (e) => {
    settings.toggleDisplay();
})