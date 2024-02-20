import { NoteItem } from "../components/NoteItem/NoteItem";
import { Settings } from "../components/Settings/Settings";
customElements.define('omnisearch-item', NoteItem);
customElements.define('settings-menu', Settings);

let myPort = browser.runtime.connect({ name: 'popup' });
myPort.onMessage.addListener((res) => {
    let { query, notes } = res as {query: string, notes: ResultNoteApi[]};
    let contentDiv = document.getElementsByClassName('omnisearch-content').item(0);
    if(contentDiv) contentDiv.innerHTML = 'Loading...';
    if(notes.length < 1){
        if(contentDiv) contentDiv.innerHTML = 'No notes match this query';
    }
    for(let [i, data] of notes.entries()){
        if(i === 0 && data != null){
            if(contentDiv)
            contentDiv.innerHTML = '';
        }
        const noteItem = new NoteItem(data.basename, `obsidian://open?vault=ObsidianVault&file=${data.path}`);
        contentDiv?.appendChild(noteItem);
    }

    let queryText = document.getElementById('query-text');
    if(queryText) queryText.innerHTML = `<p>Search Query: ${query ? query : ''}</p>`;
})

const settings = new Settings();
document.querySelector('body')?.appendChild(settings);

let settingsButton = document.getElementById("settings-button");
settingsButton?.addEventListener('click', (e) => {
    settings.toggleDisplay();
})