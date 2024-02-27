import Storage from "../utils/storage";

const storage = new Storage();
let query: string | null;
let port: browser.runtime.Port;
let notes: ResultNoteApi[];
let loading = false;

const waitForLoading = () => new Promise(resolve => {
    const checkLoading = setInterval(() => {
        if (!loading) {
            clearInterval(checkLoading);
            resolve(true);
        }
    }, 100);
});

/**
 * Retrieve query when tab changes & reload notes
 */
browser.tabs.onActivated.addListener(async (tab) => {
    loading = true;
    browser.tabs.get(tab.tabId).then(async (tabDetails) => {
        const params = new URLSearchParams(tabDetails.url);
        const tabQuery = params.get('q');
        console.info(`Received query: ${tabQuery} from tab change, loading suggestions`);
        query = tabQuery;
        notes = await getNotes();
        loading = false;
    })
})

/**
 * Receives query from cScript & loads notes
 */
browser.runtime.onMessage.addListener(async (message: {value: any, sender?: string}, sender) => {
    loading = true;
    if(message.sender === 'cScript'){
        let activeTab = await browser.tabs.query({ active: true, currentWindow: true });
        // Make sure the content script sending the query is the active tab
        if(activeTab[0].id === sender.tab?.id){
            console.info(`Received query: ${message.value} from cScript, loading suggestions`);
            query = message.value;
            // Preload badge prior to popup initialization & load notes for query
            notes = await getNotes();
            loading = false;
        }
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
    await waitForLoading();
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
    // Reset badge number
    else browser.browserAction.setBadgeText({ text: '' });
    return [];
}