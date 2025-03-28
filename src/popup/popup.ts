import browser from 'webextension-polyfill';
import { NoteItem } from "../components/NoteItem/NoteItem";
import { Settings } from "../components/Settings/Settings";
import { Header } from "../components/Header";
import Showdown from "showdown";
import { ChevronDown, ChevronUp, createElement } from "lucide";
import sanitize from "sanitize-html";
import { getShortString } from '../utils/helpers';

type Notes = { query: string, notes: ResultNoteApi[] };

// Define custom elements
if(customElements.get('note-item') == undefined) customElements.define('note-item', NoteItem);
if(customElements.get('settings-component') == undefined) customElements.define('settings-component', Settings);
if(customElements.get('header-component') == undefined) customElements.define('header-component', Header);

// Create & connect port to `bgScript`
let popupPort = browser.runtime.connect({ name: 'popup' });
if(popupPort.onMessage.hasListener(createNotes)) popupPort.onMessage.removeListener(createNotes);
// Create notes from received message
popupPort.onMessage.addListener((res: Notes) => createNotes(res));

// Create new markdown > HTML converter object
const showdown = new Showdown.Converter();
showdown.setFlavor('github');

let previewContent = document.getElementById('preview-content');
if(previewContent) previewContent.style.display = 'none';
const previewButton = document.getElementById('preview-button');
// Set initial preview svg (up or down arrow)
setButtonState();
let previewButtonIcon: SVGElement;
// Toggle preview window display & change SVG on click
previewButton?.addEventListener('click', (e) => {
    if(previewContent) previewContent.style.display = previewContent?.style.display === 'flex' ? 'none' : 'flex';
    if(previewButtonIcon) previewButton.removeChild(previewButtonIcon);
    setButtonState();
})

/**
 * Toggles `previewButtonIcon` & hover text based on display state
 */
function setButtonState() {
    if(previewButton) previewButtonIcon = previewButton.appendChild(createElement(previewContent?.style.display === 'flex' ? ChevronDown : ChevronUp));
    if (previewButton) previewButton.title = `${previewContent?.style.display === 'flex' ? 'Close' : 'Open'} preview window`
}

/**
 * Creates & replaces notes in the Omnisearch Content window
 * @param res `query` & `notes` to create notes from
 */
function createNotes({ query, notes }: Notes) {
    // Checks if query is a URL
    const isQueryURL = URL.canParse(query);
    // Checks if URL has a pathname
    const urlHasPath = isQueryURL && new URL(query).pathname !== '/';

    let queryItem = document.getElementById('query-item');
    // Set hover tip text
    if(queryItem) queryItem.title = query;
    
    let queryFavicon = document.getElementById('query-favicon') as HTMLImageElement;
    // Only load favicon if query has URL & path
    if(urlHasPath) queryFavicon.src = `https://www.google.com/s2/favicons?domain=${new URL(query).href}&sz=${32}`;
    // Controls favicon visibility based on if query has URL & path
    queryFavicon.style.setProperty('display', urlHasPath ? 'unset' : 'none');

    let queryText = document.getElementById('query-text');
    // Set query text
    if(queryText) {
        if(isQueryURL) queryText.innerText = getShortURL(new URL(query), urlHasPath);
        else queryText.innerText = query ? getShortString(query) : '';
    }

    let contentDiv = document.getElementById('omnisearch-content');
    // Replace container children with placeholder Loading...
    if(contentDiv) contentDiv.replaceChildren(createTextEl('Loading...'));
    // Return early if notes is null
    if(!notes){
		if(contentDiv) contentDiv.replaceChildren(
			createTextEl('Failed to connect to Omnisearch.'), 
			createTextEl('Please ensure Obsidian is open, the Omnisearch HTTP server is enabled, and that the port in settings matches.')
		);
		return;
    }
    // Return early if there aren't any notes
    if(notes.length < 1){
        if(contentDiv) contentDiv.replaceChildren(createTextEl('No notes match this query.'));
        return;
    }
    // Load notes into container
    for(let [i, note] of notes.entries()){
        if(i === 0 && note != null){
            if(contentDiv)
            contentDiv.replaceChildren('');
        }
        const noteEl = new NoteItem(note)
        // Load preview window content on hover
        noteEl.anchor.addEventListener('mouseover', (e) => {
            if (previewContent)
            // Sanitize the contents before converting and loading the markdown
            previewContent.innerHTML = sanitize(showdown.makeHtml(note.excerpt));
        })
        contentDiv?.appendChild(noteEl);
    }

    /**
     * Creates a new `p` element & sets `innerText`
     * @param text innerText content
     * @returns Paragraph element
     */
    function createTextEl(text: string) {
        let textEl = document.createElement('p');
        textEl.innerText = text;
        return textEl;
    }
}

/**
 * Returns a shortened URL path
 */
function getShortURL(url: URL, urlHasPath: boolean){
    // Return host if url has no path
    if(!urlHasPath) return url.host;
    const path = url.pathname;

    return getShortString(path);
}

const settings = new Settings();
// Create settings page
document.querySelector('body')?.appendChild(settings);

const header = document.getElementsByTagName('header-component')[0] as Header
// Toggle settings page when header button is clicked
header.button.addEventListener('click', (e) => {
    settings.toggleDisplay();
})