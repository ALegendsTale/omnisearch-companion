import browser from 'webextension-polyfill';
import Storage from "../utils/storage";
import { isManifestV3 } from '../utils/helpers';

const storage = new Storage();
let port: browser.Runtime.Port;
let tabCached: browser.Tabs.Tab;
let loading = false;

/**
 * Waits for loading variable to equal true
 */
const waitForLoading = () => new Promise(resolve => {
    const checkLoading = setInterval(() => {
        if (!loading) {
            clearInterval(checkLoading);
            resolve(true);
        }
    }, 100);
});

/**
 * Removes search parameters from URL
 */
function splitURLSearchParams(url: string | undefined) {
    if(!url) return;
    const urlObj = new URL(url);
    const search = urlObj.search;
    urlObj.search = '';
    return {url: urlObj.toString(), search};
}

/**
 * Retrieve query when tab url changes & reload notes
 */
browser.tabs.onUpdated.addListener(async (tabId, changedInfo, tab) => {
    // Return early if no URL
    if(!tab?.url) return;
    // Always defined because of above check
    const tabURL = splitURLSearchParams(tab.url)!;
    const tabCachedURL = splitURLSearchParams(tabCached?.url);
    // Ensure the URL was updated & the tab is active
    if(changedInfo.url && tab.active){
        // Only load on first update, or if tab URL / search changed
        if(tabCached === undefined || tabURL.url !== tabCachedURL?.url || tabURL.search !== tabCachedURL?.search) {
            tabCached = tab;
            await loadNotes(tab);
            console.info(`Tab updated, loading suggestions`);
        }
    }
})

/**
 * Retrieve query when tab changes & reload notes
 */
browser.tabs.onActivated.addListener(async (tab) => {
    browser.tabs.get(tab.tabId).then(async (tab) => {
        tabCached = tab;
        await loadNotes(tab);
        console.info(`Tab changed, loading suggestions`);
    })
})

/**
 * Reload after settings changes
 */
browser.storage.onChanged.addListener(async (change, area) => {
    // Run only if the storage type is sync
    if(area === 'sync'){
        // Load notes based on the last cached tab (avoids needing `activeTab` permission)
        await loadNotes(tabCached);
        console.info('Storage changed, reloading suggestions');
        await sendMessage();
    }
})

/**
 * Connects to `popup` each time it is opened. Creates initial notes on open & saves port for later use.
 */
const portFn = async (popupPort: browser.Runtime.Port) => {
    // Saves initial connection port for later use
    port = popupPort;
    await sendMessage();
}

// Create & connect port to `popup`
if(browser.runtime.onConnect.hasListener(portFn)) browser.runtime.onConnect.removeListener(portFn);
browser.runtime.onConnect.addListener(portFn);

/**
 * Sends a message to `popup.ts` to create notes
 */
async function sendMessage() {
    // Get query / notes from local storage
    const { query, notes }: { query?: string, notes?: string } = await browser.storage.local.get([ "query", "notes" ]);
    // Returns early if notes is null
    if(!notes) return;
    await waitForLoading();
    // Only send message if query & port are non-null
    if(port){
        // Convert notes to object before sending
        port.postMessage({"query": query, "notes": JSON.parse(notes)});
    }
}

/**
 * Load notes after setting query/URL. Saves to local storage.
 * @param tab Browser tab
 */
async function loadNotes (tab: browser.Tabs.Tab) {
    loading = true;
    // Return early if query isn't set
    if(!tab?.url) return;

    // Reset badge before loading
    setBadge({ text: '' });

    const { searchType } = await storage.getSettingsStorage();
    const url = new URL(tab.url);
    let query: string | null = null;
    // Set query based on searchType setting
    switch(searchType) {
        case 'Query':
            query = url.searchParams.get('q');
            break;
        case 'URL':
            query = isCommonProtocol(url.protocol) ? url.href : null;
            break;
        case 'Both':
            // Set query as search paramter, otherwise set URL (which has an origin i.e. not browser native pages)
            query = url.searchParams.get('q') || (isCommonProtocol(url.protocol) ? url.href : null);
            break;
    }

    /**
     * Checks if the protocol is commonly used by browsers
     * @param protocol The protocol to check
     * @returns boolean
     */
    function isCommonProtocol(protocol: string) {
        let commonProtocols = ['http', 'https', 'file', 'ftp'];
        return commonProtocols.some((commonProtocol) => protocol.includes(commonProtocol));
    }

    console.info(`Loading: ${query}`);
    
    // Save query to local storage
    await browser.storage.local.set({ query });
    // Get notes after query is set
    let notes = await getNotes();
    // Save string notes to local storage
    await browser.storage.local.set({ notes: JSON.stringify(notes) });
    loading = false;
}

/**
 * Fetch notes from the Omnisearch plugin http server
 * @returns Notes array
 */
async function getNotes() {
    // Get query from local storage
    const { query }: { query?: string } = await browser.storage.local.get([ "query" ]);
    // Get settings from storage
    const settings = await storage.getSettingsStorage();
    // Skip fetch if query is null or undefined
    if(query != null){
        // If URL, encode before passing to Omnisearch
        const response = await fetch(`http://localhost:${settings.port}/search?q=${URL.canParse(query) ? encodeURIComponent(query) : query}`).catch(() => null);
        // If no response, exit
        if(!response) {
				// Set error badge
				setBadge({ text: '🛇' });
				console.error('Please ensure Obsidian is open, the Omnisearch HTTP server is enabled, and that the port in settings matches.');
            return null;
        }
        // Get notes from fetch response
        const notes: ResultNoteApi[] = await response.json()
        // Filter notes by user defined score
        const notesFiltered = notes.filter((note) => note.score > Number(settings.notesScore))
        .sort((a, b) => b.score - a.score)
        .slice(0, Number(settings.notesShown));

        // Set badge to the number of notes fetched
        setBadge({ text: notesFiltered.length !== 0 ? notesFiltered.length.toString() : '' });

        return notesFiltered;
    }
    // Reset badge number
    setBadge({ text: '' });
    return [];
}

/**
 * Use `action` or `browserAction` depending on manifest
 */
function setBadge(textDetails: browser.Action.SetBadgeTextDetailsType) {
    // Set badge using function based on which manifest the extension is using
    if(isManifestV3()){
        browser.action.setBadgeText(textDetails);
    }
    else {
        browser.browserAction.setBadgeText(textDetails);
    }
}