chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https/.test(tab.url)) {
        chrome.storage.local.set({ "learning_mode": false });
        let domRes = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['scripts/filter.js']
        }
        ).catch(console.error);
        if (!domRes) return;
    }
});

chrome.runtime.onInstalled.addListener(async () => {
    for (const tab of await chrome.tabs.query({ url: chrome.runtime.getManifest().host_permissions })) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/filter.js']
        });
    }
});