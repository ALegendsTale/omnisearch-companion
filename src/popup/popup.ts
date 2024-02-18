type OmnisearchApi = {
    // Returns a promise that will contain the same results as the Vault modal
    search: (query: string) => Promise<ResultNoteApi[]>,
    // Refreshes the index
    refreshIndex: () => Promise<void>
    // Register a callback that will be called when the indexing is done
    registerOnIndexed: (callback: () => void) => void,
    // Unregister a callback that was previously registered
    unregisterOnIndexed: (callback: () => void) => void,
}
  
type ResultNoteApi = {
    score: number
    vault: string
    path: string
    basename: string
    foundWords: string[]
    matches: SearchMatchApi[]
    excerpt: string
}
  
type SearchMatchApi = {
    match: string
    offset: number
}

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
        if(contentDiv)
        contentDiv.innerHTML += `<a href="obsidian://open?vault=ObsidianVault&file=${data.path}">${data.basename}</a>`;
    }

    let queryText = document.getElementById('query-text');
    if(queryText) queryText.innerHTML = `<p>Search Query: ${query ? query : ''}</p>`;
})