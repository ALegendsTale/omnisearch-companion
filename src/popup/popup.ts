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