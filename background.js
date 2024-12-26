// 時區對應的經緯度
const TIMEZONE_COORDINATES = {
  "Asia/Tokyo": { latitude: 35.6762, longitude: 139.6503 },
  "Asia/Shanghai": { latitude: 31.2304, longitude: 121.4737 },
  "America/New_York": { latitude: 40.7128, longitude: -74.006 },
  "Europe/London": { latitude: 51.5074, longitude: -0.1278 },
  UTC: { latitude: 0, longitude: 0 },
};

// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_TIMEZONE") {
    updateTimezoneEmulation(message.timezone);
  }
});

// 當瀏覽器啟動時
chrome.runtime.onStartup.addListener(async () => {
  const { timezone } = await chrome.storage.local.get("timezone");
  if (timezone) {
    updateTimezoneEmulation(timezone);
  }
});

// 當插件安裝或更新時
chrome.runtime.onInstalled.addListener(async () => {
  const { timezone } = await chrome.storage.local.get("timezone");
  if (timezone) {
    updateTimezoneEmulation(timezone);
  }
});

// 監聽新開啟的頁面
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    const { timezone } = await chrome.storage.local.get("timezone");
    if (timezone) {
      console.log("新開啟的頁面:", tabId, timezone);
      try {
        await chrome.debugger.attach({ tabId }, "1.3");
        await chrome.debugger.sendCommand({ tabId }, "Emulation.setTimezoneOverride", { timezoneId: timezone });
      } catch (error) {
        console.error(`無法在標籤頁 ${tabId} 執行時區模擬:`, error);
      }
    }
  }
});

// 更新時區模擬
async function updateTimezoneEmulation(timezone) {
  console.log("更新時區:", timezone);
  const tabs = await chrome.tabs.query({
    url: ["http://*/*", "https://*/*"],
  });

  for (const tab of tabs) {
    try {
      await chrome.debugger.attach({ tabId: tab.id }, "1.3");
      await chrome.debugger.sendCommand({ tabId: tab.id }, "Emulation.setTimezoneOverride", { timezoneId: timezone });
    } catch (error) {
      console.error(`無法在標籤頁 ${tab.id} 執行時區模擬:`, error);
    }
  }
}
