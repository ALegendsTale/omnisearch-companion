const params = new URLSearchParams(window.location.search);
const query = params.get('q');
browser.runtime.sendMessage({ sender: 'cScript', value: query });

browser.runtime.onMessage.addListener(async (message: {value: any, sender?: string}) => {
    window.open(message.value, '_self');
})