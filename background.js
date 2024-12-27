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
  } else if (message.type === "ENABLE_TIMEZONE") {
    enableTimezoneEmulation();
  } else if (message.type === "DISABLE_TIMEZONE") {
    disableTimezoneEmulation();
  }
});

// 當瀏覽器啟動時
chrome.runtime.onStartup.addListener(async () => {
  const { timezone, enabled } = await chrome.storage.local.get(["timezone", "enabled"]);
  if (enabled && timezone) {
    updateTimezoneEmulation(timezone);
  }
});

// 當插件安裝或更新時
chrome.runtime.onInstalled.addListener(async () => {
  const { timezone, enabled } = await chrome.storage.local.get(["timezone", "enabled"]);
  if (enabled && timezone) {
    updateTimezoneEmulation(timezone);
  }
});

// 監聽新開啟的頁面
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    const { timezone, enabled } = await chrome.storage.local.get(["timezone", "enabled"]);
    if (enabled && timezone) {
      console.log("新開啟的頁面:", tabId, timezone);
      try {
        await chrome.debugger.attach({ tabId }, "1.3");

        // 設置時區
        await chrome.debugger.sendCommand({ tabId }, "Emulation.setTimezoneOverride", { timezoneId: timezone });

        // 設置地理位置
        const coordinates = TIMEZONE_COORDINATES[timezone] || { latitude: 0, longitude: 0 };
        await chrome.debugger.sendCommand({ tabId }, "Emulation.setGeolocationOverride", {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: 1,
        });
      } catch (error) {
        console.error(`無法在標籤頁 ${tabId} 執行時區模擬:`, error);
      }
    }
  }
});

// 啟用時區模擬
async function enableTimezoneEmulation() {
  const { timezone } = await chrome.storage.local.get("timezone");
  if (timezone) {
    updateTimezoneEmulation(timezone);
  }
}

// 停用時區模擬
async function disableTimezoneEmulation() {
  const tabs = await chrome.tabs.query({
    url: ["http://*/*", "https://*/*"],
  });

  // 清除所有通知
  await chrome.notifications.getAll(notifications => {
    for (let notificationId in notifications) {
      chrome.notifications.clear(notificationId);
    }
  });

  for (const tab of tabs) {
    try {
      // 先檢查是否已經附加了 debugger
      try {
        await chrome.debugger.attach({ tabId: tab.id }, "1.3");
      } catch (e) {
        // 如果已經附加，這裡會拋出錯誤，我們可以忽略它
      }

      // 清除地理位置模擬
      await chrome.debugger.sendCommand({ tabId: tab.id }, "Emulation.clearGeolocationOverride");

      // 清除時區模擬
      await chrome.debugger.sendCommand({ tabId: tab.id }, "Emulation.clearTimezoneOverride");

      // 分離 debugger
      await chrome.debugger.detach({ tabId: tab.id });

      // 重新載入頁面以確保完全重置
      await chrome.tabs.reload(tab.id);
    } catch (error) {
      console.error(`無法在標籤頁 ${tab.id} 停用時區模擬:`, error);
    }
  }
}

// 更新時區模擬
async function updateTimezoneEmulation(timezone) {
  const { enabled } = await chrome.storage.local.get("enabled");
  if (!enabled) return;

  console.log("更新時區:", timezone);
  const tabs = await chrome.tabs.query({
    url: ["http://*/*", "https://*/*"],
  });

  // 獲取對應的地理位置
  const coordinates = TIMEZONE_COORDINATES[timezone] || { latitude: 0, longitude: 0 };

  for (const tab of tabs) {
    try {
      await chrome.debugger.attach({ tabId: tab.id }, "1.3");

      // 設置時區
      await chrome.debugger.sendCommand({ tabId: tab.id }, "Emulation.setTimezoneOverride", { timezoneId: timezone });

      // 設置地理位置
      await chrome.debugger.sendCommand({ tabId: tab.id }, "Emulation.setGeolocationOverride", {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: 1,
      });
    } catch (error) {
      console.error(`無法在標籤頁 ${tab.id} 執行時區模擬:`, error);
    }
  }
}
