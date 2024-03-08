import browser from 'webextension-polyfill';
import Storage from "../utils/storage";
import { isManifestV3 } from '../utils/helpers';

const storage = new Storage();
let port: browser.Runtime.Port;
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
 * Retrieve query when tab url changes & reload notes
 */
browser.tabs.onUpdated.addListener(async (tabId, changedInfo, tab) => {
    loading = true;
    if(changedInfo.url && tab.active){
        if(!tab.url) return;
        const query = new URL(tab.url).searchParams.get('q');
        console.info(`Received query: ${query} from tab url update, loading suggestions`);
        await browser.storage.local.set({ query });
        // Get notes after query is set
        let notes = JSON.stringify(await getNotes());
        await browser.storage.local.set({ notes });
    }
    loading = false;
})

/**
 * Retrieve query when tab changes & reload notes
 */
browser.tabs.onActivated.addListener(async (tab) => {
    loading = true;
    browser.tabs.get(tab.tabId).then(async (tabDetails) => {
        // Return early if query isn't set
        if(!tabDetails?.url) return;
        const query = new URL(tabDetails.url).searchParams.get('q');
        console.info(`Received query: ${query} from tab change, loading suggestions`);
        await browser.storage.local.set({ query });
        // Get notes after query is set
        let notes = JSON.stringify(await getNotes());
        await browser.storage.local.set({ notes });
    })
    loading = false;
})

/**
 * Reload after settings changes
 */
browser.storage.onChanged.addListener(async (change, area) => {
    if(area === 'sync'){
        const { query }: { query?: string } = await browser.storage.local.get([ "query" ]);
        console.info('Storage changed, reloading suggestions');
        // Load notes after settings change
        let notes = await getNotes();
        await browser.storage.local.set({ notes: JSON.stringify(notes) });
        if(query && port){
            port.postMessage({"query": query, "notes": notes});
        }
    }
})

const portFn = async (popupPort: browser.Runtime.Port) => {
    const { query, notes }: { query?: string, notes?: string } = await browser.storage.local.get([ "query", "notes" ]);
    if(!notes) return;
    port = popupPort;
    await waitForLoading();
    port.postMessage({"query": query, "notes": JSON.parse(notes)});
}

if(browser.runtime.onConnect.hasListener(portFn)) browser.runtime.onConnect.removeListener(portFn);
browser.runtime.onConnect.addListener(portFn);

async function getNotes() {
    const { query }: { query?: string } = await browser.storage.local.get([ "query" ]);
    const settings = await storage.getSettingsStorage();
    if(query != null){
        const response = await fetch(`http://localhost:${settings.port}/search?q=${query}`).catch(async (error) => {
            const errorMessage = 'Please ensure Obsidian is open, the Omnisearch HTTP server is enabled, and that the port in settings matches.';
            await browser.notifications.create('network-error', { title: 'Omnisearch Companion - Failed to connect', message: errorMessage, type: 'basic' });
            console.error(errorMessage);
            return null;
        });
        // If no response, exit & reset badge
        if(!response) {
            // Reset badge number
            setBadge({ text: '' });
            return [];
        }
        const notes: ResultNoteApi[] = await response.json()
        const notesFiltered = notes.filter((note) => note.score > Number(settings.notesScore))
        .sort((a, b) => b.score - a.score)
        .slice(0, Number(settings.notesShown));

        setBadge({ text: notesFiltered.length !== 0 ? notesFiltered.length.toString() : '' });

        return notesFiltered;
    }
    // Reset badge number
    setBadge({ text: '' });
    return [];
}

/**
 * Use action or browserAction depending on manifest
 * @param textDetails 
 */
function setBadge(textDetails: browser.Action.SetBadgeTextDetailsType) {
    if(isManifestV3()){
        // Set badge number
        browser.action.setBadgeText(textDetails);
    }
    else {
        // Set badge number
        browser.browserAction.setBadgeText(textDetails);
    }
}