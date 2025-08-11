import browser from 'webextension-polyfill';
import Storage, { SearchType, SettingsType, Vault } from '../utils/storage';
import { splitURLSearchParams, browserAction, isCommonProtocol } from '../utils/helpers';
import { ResultNoteApi } from '../types/OmnisearchTypes';
import { getDomainWithoutSuffix } from 'tldts';

type Tab = browser.Tabs.Tab;

const storage = new Storage();
let port: browser.Runtime.Port | undefined;
/* Cached tab to prevent loading more than necessary */
let tabCached: Tab;
let loading = false;

/**
 * Waits for loading variable to equal true
 */
const waitForLoading = () =>
	new Promise((resolve) => {
		const checkLoading = setInterval(() => {
			if (!loading) {
				clearInterval(checkLoading);
				resolve(true);
			}
		}, 100);
	});

/**
 * Create context menu item on load
 */
browser.runtime.onInstalled.addListener(() => {
	browser.contextMenus.create({
		id: 'omnisearchcompanion',
		title: 'Omnisearch Companion',
		contexts: ['selection', 'link'],
	});
})

/**
 * Get query from user interaction with context menu
 */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
	if (!tab) return;

	if (info.selectionText) {
		console.info(`Text selected, loading suggestions`);
		browserAction.openPopup();
		await loadNotes(info.selectionText.trim());
		await sendNotes();
	}
	else if (info.linkUrl) {
		console.info(`Link selected, loading suggestions`);
		browserAction.openPopup();
		await loadNotes(info.linkUrl);
		await sendNotes();
	}
	else if (info.pageUrl) {
		console.info(`Tab selected, loading suggestions`);
		browserAction.openPopup();
		await loadNotes(info.pageUrl);
		await sendNotes();
	}

	tabCached = tab;
});

/**
 * Retrieve query when tab url changes & reload notes
 */
browser.tabs.onUpdated.addListener(async (tabId, changedInfo, tab) => {
	// Return early if no URL
	if (!tab?.url) return;
	// Always defined because of above check
	const tabURL = splitURLSearchParams(tab.url)!;
	const tabCachedURL = splitURLSearchParams(tabCached?.url);
	// Ensure the URL was updated & the tab is active
	if (changedInfo.status === 'complete' && tab.active) {
		// Only load on first update, or if tab URL / search changed
		if (tabCached === undefined || tabURL.url !== tabCachedURL?.url || tabURL.search !== tabCachedURL?.search) {
			tabCached = tab;
			await loadNotes(tab);
			console.info(`Tab updated, loading suggestions`);
			await sendNotes();
		}
	}
});

/**
 * Retrieve query when tab changes & reload notes
 */
browser.tabs.onActivated.addListener(async (tab) => {
	browser.tabs.get(tab.tabId).then(async (tab) => {
		tabCached = tab;
		await loadNotes(tab);
		console.info(`Tab changed, loading suggestions`);
		await sendNotes();
	});
});

/**
 * Reload after settings changes
 */
browser.storage.onChanged.addListener(async (change, area) => {
	// Run only if the storage type is sync
	if (area === 'sync') {
		// Load notes based on the last cached tab (avoids needing `activeTab` permission)
		await loadNotes(tabCached);
		console.info('Storage changed, reloading suggestions');
		await sendNotes();
	}
});

/**
 * Connects to popup each time it is opened. Creates initial notes on open & saves port for later use.
 */
const portFn = async (popupPort: browser.Runtime.Port) => {
	// Saves initial connection port for later use
	port = popupPort;
	port.onDisconnect.addListener(() => port = undefined)
	await sendNotes();
};

// Create & connect port to popup
if (browser.runtime.onConnect.hasListener(portFn)) browser.runtime.onConnect.removeListener(portFn);
browser.runtime.onConnect.addListener(portFn);

/**
 * Sends a message to popup to create notes
 */
async function sendNotes() {
	// Get query / notes from local storage
	const { query, rawNotes, notes, errors } = await browser.storage.local.get({ query: '', rawNotes: '', notes: '', errors: '' }) as { query: string, rawNotes: string, notes: string, errors: string };
	
	await waitForLoading();

	// Only send message if query & port are non-null
	if (port) port.postMessage({ query: query, rawNotes: JSON.parse(rawNotes), notes: JSON.parse(notes), errors: JSON.parse(errors) });
}

/**
 * Load notes after setting query/URL. Saves to local storage.
 * @param tab Browser tab
 */
async function loadNotes(_query: string | Tab) {
	loading = true;
	browserAction.setBadgeText({ text: '' });
	const [settings, vaults] = await Promise.all([
		storage.getSettings(),
		storage.getVaults()
	]);
	const activeVaults = vaults.filter((vault) => vault.active);
	const queriesToSearch = getQueriesToSearch(_query, settings).filter(query => query != null);

	// Return if there are no queries
	if(queriesToSearch.length === 0) {
		loading = false;
		return;
	}

	console.info(`Loading:`, queriesToSearch);
	// Save either query or full url
	await browser.storage.local.set({ query: queriesToSearch[0] });

	// Fetch notes
	try {
		const getNotesPromises = activeVaults.flatMap(vault => queriesToSearch.map(query => getNotes(query, vault)));
		const rawPromiseResults = await Promise.all(getNotesPromises);
		const results = rawPromiseResults.filter(item => item !== null);

		const flattenedResults = results.flatMap(result => result.notes);

		// Remove duplicates (overwrites based on basename key)
		const uniqueNotes = flattenedResults.reduce((map, note) => {
			const existingNote = map.get(note.basename);
			// Combine score if note already exists
			if(existingNote) existingNote.score += note.score;
			// Add new note
			else map.set(note.basename, note);
			return map;
		}, new Map<string, ResultNoteApi>());

		const rawNotes = [...uniqueNotes.values()];

		// Get any errors that occurred (remove null or undefined)
		const errors = results.flatMap(result => result?.error ? [result.error] : []);

		// Process notes
		const notes = rawNotes
			.filter((note) => note.score > +settings.notesScore)
			.sort((a, b) => b.score - a.score)
			.slice(0, +settings.notesShown);

		// Set badge
		if(results.length > 0) {
			browserAction.setBadgeText({ text: notes.length > 0 ? notes.length.toString() : '' });
		}
		else {
			browserAction.setBadgeText({ text: '🛇' });
			console.error('Please ensure Obsidian is open, the Omnisearch HTTP server is enabled, and that the port in settings matches.');
		}

		// Save
		await browser.storage.local.set({ rawNotes: JSON.stringify(rawNotes), notes: JSON.stringify(notes), errors: JSON.stringify(errors) });
		loading = false;
	}
	catch(e) {
		loading = false;
		console.error(e);
		return;
	}
}

/**
 * Retrieve which queries to search based on input and settings
 */
function getQueriesToSearch(_query: string | Tab, settings: SettingsType) {
	if(typeof _query === 'string') return[_query];

	const allQueries = getTabQueries(_query);	
	const isOnlyTitle = allQueries?.Query == null && allQueries?.['Full URL'] == null && allQueries?.['Partial URL'] == null;
	// Return nothing if no queries, or if title is the only query (preventing newtab or other non-urls)
	if(!allQueries || isOnlyTitle) return [];

	if(settings.searchType === 'Auto') return Object.values(allQueries);
	else return [allQueries[settings.searchType]];
}

/**
 * Get query types and values based on the tab
 */
function getTabQueries(tab: Tab): Record<SearchType, string | null> | null {
	if(!tab?.url) return null;

	const url = new URL(tab.url);
	const query = url.searchParams.get('q');

	// If there is a query, only return that.
	if(query) {
		return {
			'Auto': null,
			'Query': query,
			'Full URL': null,
			'Partial URL': null,
			'Title': null
		}
	}

	return {
		'Auto': null,
		'Query': query,
		// Set URL (which has an origin i.e. not browser native pages)
		"Full URL": isCommonProtocol(url.protocol) ? url.href : null,
		"Partial URL": isCommonProtocol(url.protocol) ? getDomainWithoutSuffix(url.href) : null,
		'Title': tab.title ?? null
	}
}

/**
 * Fetch notes from the Omnisearch plugin http server
 * @returns Notes array
 */
async function getNotes(query: string | null, vault: Vault): Promise<{ notes: ResultNoteApi[], error?: Vault }> {
	if(query == null) return { notes: [] };

	try {
		// Encode query
		const searchQuery = encodeURIComponent(query);
		const response = await fetch(`http://localhost:${vault.port}/search?q=${searchQuery}`);

		// If no response, exit
		if (!response.ok) return { notes: [], error: vault };

		// Get notes from fetch response
		const notes: ResultNoteApi[] = await response.json();
		return { notes };
	}
	catch(e) {
		console.warn(e);
		return { notes: [], error: vault };
	}
}
