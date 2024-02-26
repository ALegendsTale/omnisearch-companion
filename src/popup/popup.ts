import { NoteItem } from "../components/NoteItem/NoteItem";
import { Settings } from "../components/Settings/Settings";
import { Header } from "../components/Header";
import Showdown from "showdown";
import { ChevronDown, ChevronUp, createElement } from "lucide";

if(customElements.get('note-item') == undefined) customElements.define('note-item', NoteItem);
if(customElements.get('settings-component') == undefined) customElements.define('settings-component', Settings);
if(customElements.get('header-component') == undefined) customElements.define('header-component', Header);

let popupPort = browser.runtime.connect({ name: 'popup' });
if(popupPort.onMessage.hasListener(createNotes)) popupPort.onMessage.removeListener(createNotes);
popupPort.onMessage.addListener((res) => createNotes(res));

const showdown = new Showdown.Converter();
showdown.setFlavor('github');

let previewContent = document.getElementById('preview-content');
if(previewContent) previewContent.style.display = 'none';
const previewButton = document.getElementById('preview-button');
// Set initial svg
setButtonSVG();
let previewButtonIcon: SVGElement;
previewButton?.addEventListener('click', (e) => {
    if(previewContent) previewContent.style.display = previewContent?.style.display === 'flex' ? 'none' : 'flex';
    if(previewButtonIcon) previewButton.removeChild(previewButtonIcon);
    setButtonSVG();
})

function setButtonSVG() {
    if(previewButton)
    previewButtonIcon = previewButton.appendChild(createElement(previewContent?.style.display === 'flex' ? ChevronDown : ChevronUp));
}

function createNotes(res: object) {
    let { query, notes } = res as {query: string, notes: ResultNoteApi[]};
    // Set query text
    let queryText = document.getElementById('query-text');
    if(queryText) queryText.innerText = `Search Query: ${query ? query : ''}`;
    // Load notes into container
    let contentDiv = document.getElementById('omnisearch-content');
    if(contentDiv) contentDiv.innerHTML = 'Loading...';
    if(!notes){
        if(contentDiv) contentDiv.innerHTML = '<p>Nothing here yet :(</p>';
        return;
    }
    if(notes.length < 1){
        if(contentDiv) contentDiv.innerHTML = '<p>No notes match this query</p>';
        return;
    }
    for(let [i, note] of notes.entries()){
        if(i === 0 && note != null){
            if(contentDiv)
            contentDiv.innerHTML = '';
        }
        const noteEl = new NoteItem(note)
        noteEl.anchor.addEventListener('mouseover', (e) => {
            if (previewContent)
            previewContent.innerHTML = showdown.makeHtml(note.excerpt);
        })
        contentDiv?.appendChild(noteEl);
    }
}

const settings = new Settings();
document.querySelector('body')?.appendChild(settings);

const header = document.getElementsByTagName('header-component')[0] as Header
header.button.addEventListener('click', (e) => {
    settings.toggleDisplay();
})