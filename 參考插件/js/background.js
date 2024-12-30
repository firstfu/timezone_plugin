/* globals resolve, offsets */
'use strict';

const df = (new Date()).getTimezoneOffset();

const randoms = {};
chrome.tabs.onRemoved.addListener(tabId => delete randoms[tabId]);

chrome.runtime.onMessage.addListener((msg, sender, sendRes) => {
    if (!msg?.op || sender.id != chrome.runtime.id) {
        return void sendRes();
    }

    switch (msg.op) {
        case "DatePrefs": {
            void sendDatePrefsAsync(sendRes, sender.tab.id, sender.frameId);
            return true;
        }
        case "Analyze": {
            const res = resolve.analyze(msg.value);
            return void sendRes(res);
        }
        case "Reset": {
            void resetAsync(sendRes);
            return true;
        }
    }

    return true;
});

async function resetAsync(sendRes) {
    await chrome.storage.local.clear();
    await set("Etc/GMT");
    sendRes();
}

async function sendDatePrefsAsync(sendRes, tabId, frameId) {
    let { location, standard, daylight, offset, isDST, random, enabled } = await chrome.storage.local.get();
    offset ||= 0;
    enabled ??= true;

    if (!enabled) {
        return sendRes();
    }

    let msg = isDST === 'false' ? standard : daylight;

    if (random === 'true') {
        const ofs = Object.keys(offsets);
        if (frameId === 0 || randoms[tabId] === undefined) {
            location = ofs[Math.floor(Math.random() * ofs.length)];
            randoms[tabId] = location;
        }

        const o = resolve.analyze(location);
        offset = o.offset;
        msg = offset !== o.offset ? o.storage.msg.daylight : o.storage.msg.standard;
    }

    sendRes([location, -1 * offset, df, msg]);
}

const set = async (timezone = 'Etc/GMT') => {
    const { offset, storage } = resolve.analyze(timezone);

    chrome.storage.local.set({
        offset,
        isDST: offset !== storage.offset,
        location: timezone,
        daylight: storage.msg.daylight,
        standard: storage.msg.standard,
    });
};

chrome.runtime.onInstalled.addListener(async () => {
    const { location } = await chrome.storage.local.get("location");
    await set(location || "Etc/GMT");
});