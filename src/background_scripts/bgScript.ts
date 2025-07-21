import browser from 'webextension-polyfill';
import Storage from '../utils/storage';
import { splitURLSearchParams, browserAction, isCommonProtocol } from '../utils/helpers';
import { ResultNoteApi } from '../types/OmnisearchTypes';

type Tab = browser.Tabs.Tab;

const storage = new Storage();
let port: browser.Runtime.Port;
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
	}
	else if (info.linkUrl) {
		console.info(`Link selected, loading suggestions`);
		browserAction.openPopup();
		await loadNotes(info.linkUrl);
	}
	else if (info.pageUrl) {
		console.info(`Tab selected, loading suggestions`);
		browserAction.openPopup();
		await loadNotes(info.pageUrl);
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
	if (changedInfo.url && tab.active) {
		// Only load on first update, or if tab URL / search changed
		if (tabCached === undefined || tabURL.url !== tabCachedURL?.url || tabURL.search !== tabCachedURL?.search) {
			tabCached = tab;
			await loadNotes(tab);
			console.info(`Tab updated, loading suggestions`);
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
		await sendMessage();
	}
});

/**
 * Connects to `popup` each time it is opened. Creates initial notes on open & saves port for later use.
 */
const portFn = async (popupPort: browser.Runtime.Port) => {
	// Saves initial connection port for later use
	port = popupPort;
	await sendMessage();
};

// Create & connect port to `popup`
if (browser.runtime.onConnect.hasListener(portFn)) browser.runtime.onConnect.removeListener(portFn);
browser.runtime.onConnect.addListener(portFn);

/**
 * Sends a message to `popup.ts` to create notes
 */
async function sendMessage() {
	// Get query / notes from local storage
	const { query, notes }: { query?: string; notes?: string } = await browser.storage.local.get(['query', 'notes']);
	// Returns early if notes is null
	if (!notes) return;
	await waitForLoading();
	// Only send message if query & port are non-null
	if (port) {
		// Convert notes to object before sending
		port.postMessage({ query: query, notes: JSON.parse(notes) });
	}
}

/**
 * Load notes after setting query/URL. Saves to local storage.
 * @param tab Browser tab
 */
async function loadNotes(_query: string | Tab) {
	loading = true;

	// Reset badge before loading
	browserAction.setBadgeText({ text: '' });

	let query: string | null = null;

	if(typeof _query === 'string') {
		query = _query;
	}
	if(typeof _query === 'object') {
		// Return early if query isn't set
		query = await getURLQuery(_query) || null;
	}

	async function getURLQuery(tabQuery: Tab) {
		if (!tabQuery?.url) return;

		const url = new URL(tabQuery.url);
		const { searchType } = await storage.getSettingsStorage();
		// Set query based on searchType setting
		switch (searchType) {
			case 'Query':
				return url.searchParams.get('q');
			case 'URL':
				return isCommonProtocol(url.protocol) ? url.href : null;
			case 'Both':
				// Set query as search paramter, otherwise set URL (which has an origin i.e. not browser native pages)
				return url.searchParams.get('q') || (isCommonProtocol(url.protocol) ? url.href : null);
		}
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
	const { query }: { query?: string } = await browser.storage.local.get(['query']);
	// Get settings from storage
	const settings = await storage.getSettingsStorage();
	// Skip fetch if query is null or undefined
	if (query != null) {
		// If URL, encode before passing to Omnisearch
		const response = await fetch(`http://localhost:${settings.port}/search?q=${URL.canParse(query) ? encodeURIComponent(query) : query}`).catch(() => null);
		// If no response, exit
		if (!response) {
			// Set error badge
			browserAction.setBadgeText({ text: '🛇' });
			console.error('Please ensure Obsidian is open, the Omnisearch HTTP server is enabled, and that the port in settings matches.');
			return null;
		}
		// Get notes from fetch response
		const notes: ResultNoteApi[] = await response.json();
		// Filter notes by user defined score
		const notesFiltered = notes
			.filter((note) => note.score > +settings.notesScore)
			.sort((a, b) => b.score - a.score)
			.slice(0, +settings.notesShown);

		// Set badge to the number of notes fetched
		browserAction.setBadgeText({ text: notesFiltered.length !== 0 ? notesFiltered.length.toString() : '' });

		return notesFiltered;
	}
	// Reset badge number
	browserAction.setBadgeText({ text: '' });
	return [];
}
