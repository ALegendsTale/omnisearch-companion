browser.runtime.onMessage.addListener(async (query) => {
    if(query != null){
        const port = 51361;
        const response = await fetch(`http://localhost:${port}/search?q=${query}`);
        response.json().then((r: ResultNoteApi[]) => {
            const notes = r.filter((v) => v.score > 10)
            console.log(notes);
    
            browser.runtime.onConnect.addListener((port) => {
                port.postMessage({"query": query, "notes": notes});
            });
    
            browser.browserAction.setBadgeText({ text: notes.length !== 0 ? notes.length.toString() : '' });
        });
    }
})