import Storage from "../utils/storage";

const storage = new Storage();

let query: string;

let port: browser.runtime.Port;

let notes: ResultNoteApi[];

/**
 * Receives query from cScript & loads notes
 */
browser.runtime.onMessage.addListener(async (message: {value: any, sender?: string}) => {
    if(message.sender === 'cScript'){
        console.info(`Received query: ${message.value}, loading suggestions`);
        query = message.value;
        // Preload badge prior to popup initialization & load notes for query
        notes = await getNotes();
    }
})

/**
 * Reload after settings changes
 */
browser.storage.onChanged.addListener(async (change) => {
    console.info('Storage changed, reloading suggestions');
    // Load notes after settings change
    notes = await getNotes();
    if(query && port){
        port.postMessage({"query": query, "notes": notes});
    }
})

const portFn = async (popupPort: browser.runtime.Port) => {
    port = popupPort;
    popupPort.postMessage({"query": query, "notes": notes});
}

if(browser.runtime.onConnect.hasListener(portFn)) browser.runtime.onConnect.removeListener(portFn);
browser.runtime.onConnect.addListener(portFn);

async function getNotes() {
    if(query != null){
        const settings = await storage.getSettingsStorage();
        const port = settings.port;
        const response = await fetch(`http://localhost:${port}/search?q=${query}`);
        const notes: ResultNoteApi[] = await response.json()
        const notesFiltered = notes.filter((note) => note.score > Number(settings.notesScore))
        .sort((a, b) => b.score - a.score)
        .slice(0, Number(settings.notesShown));

        // Set badge number
        browser.browserAction.setBadgeText({ text: notesFiltered.length !== 0 ? notesFiltered.length.toString() : '' });

        return notesFiltered;
    }
    return [];
}