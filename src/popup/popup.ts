import { createElement, Settings as SettingsIcon } from "lucide";
import { NoteItem } from "../components/NoteItem/NoteItem";
import { Settings } from "../components/Settings/Settings";

const settingsIcon = createElement(SettingsIcon);
settingsIcon.style.stroke = 'white';

customElements.define('omnisearch-item', NoteItem);
customElements.define('settings-menu', Settings);

let popupPort = browser.runtime.connect({ name: 'popup' });
if(popupPort.onMessage.hasListener(createNotes)) popupPort.onMessage.removeListener(createNotes);
popupPort.onMessage.addListener((res) => createNotes(res));

function createNotes(res: object) {
    let { query, notes } = res as {query: string, notes: ResultNoteApi[]};
    // Set query text
    let queryText = document.getElementById('query-text');
    if(queryText) queryText.innerHTML = `<p>Search Query: ${query ? query : ''}</p>`;
    // Load notes into container
    let contentDiv = document.getElementsByClassName('omnisearch-content').item(0);
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

let settingsButton = document.getElementById("settings-button");
if(settingsButton){
    settingsButton.appendChild(settingsIcon);
    settingsButton.addEventListener('click', (e) => {
        settings.toggleDisplay();
    })
}