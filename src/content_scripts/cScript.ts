const params = new URLSearchParams(window.location.search);
const query = params.get('q');

browser.runtime.sendMessage(query);

async function saveQuery() {
    await browser.storage.local.set({"query": query});
}

saveQuery().then(() => console.log('Saved query to local storage'));
