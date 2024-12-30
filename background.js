// 監聽安裝事件
chrome.runtime.onInstalled.addListener(function () {
  // 初始化存儲
  chrome.storage.sync.get(["timezone", "favorites"], function (result) {
    if (!result.timezone) {
      chrome.storage.sync.set({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        favorites: [],
      });
    }
  });
});

// 監聽時區變更
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "sync" && changes.timezone) {
    const newTimezone = changes.timezone.newValue;
    // 獲取所有標籤頁
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        // 對每個標籤頁注入時區設置腳本
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: timezone => {
            // 覆蓋原生的 Date 對象
            const originalDate = Date;
            const originalToString = Date.prototype.toString;
            const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

            // 計算時區偏移
            const offset = (() => {
              const date = new originalDate();
              const timeString = date.toLocaleString("en-US", { timeZone: timezone });
              const localTime = new originalDate(timeString);
              return (date - localTime) / 60000;
            })();

            // 修改 Date.prototype.getTimezoneOffset
            Date.prototype.getTimezoneOffset = function () {
              return offset;
            };

            // 修改 Date.prototype.toString
            Date.prototype.toString = function () {
              return this.toLocaleString("en-US", { timeZone: timezone });
            };

            // 修改 console.log 的時間顯示
            const originalConsoleLog = console.log;
            console.log = function (...args) {
              args = args.map(arg => {
                if (arg instanceof Date) {
                  return new Date(arg.toLocaleString("en-US", { timeZone: timezone }));
                }
                return arg;
              });
              originalConsoleLog.apply(console, args);
            };
          },
          args: [newTimezone],
        });
      });
    });
  }
});

// 監聽快捷鍵
chrome.commands.onCommand.addListener(function (command) {
  if (command === "_execute_action") {
    chrome.action.openPopup();
  }
});
