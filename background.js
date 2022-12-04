chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https/.test(tab.url)) {
        let domRes = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['scripts/find-list.js']
        }).catch(console.error);
        if (!domRes) return;
    }
});