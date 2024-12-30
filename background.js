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
            // 保存原始的 Date 構造函數
            const OriginalDate = Date;

            // 創建新的 Date 構造函數
            function CustomDate(...args) {
              // 如果沒有參數，使用當前時區的時間
              if (args.length === 0) {
                const now = new OriginalDate();
                const tzTime = now.toLocaleString("en-US", { timeZone: timezone });
                return new OriginalDate(tzTime);
              }

              // 如果有參數，正常創建
              const instance = new OriginalDate(...args);
              return instance;
            }

            // 繼承原始 Date 的所有靜態屬性和方法
            Object.setPrototypeOf(CustomDate, OriginalDate);
            CustomDate.prototype = Object.create(OriginalDate.prototype);
            CustomDate.prototype.constructor = CustomDate;

            // 重寫 toString 方法
            CustomDate.prototype.toString = function () {
              const date = new OriginalDate(this.valueOf());
              const options = {
                timeZone: timezone,
                hour12: false,
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "long",
              };

              return date.toLocaleString("en-US", options);
            };

            // 重寫 toLocaleString 方法
            CustomDate.prototype.toLocaleString = function (locale = "en-US", options = {}) {
              options.timeZone = timezone;
              return OriginalDate.prototype.toLocaleString.call(this, locale, options);
            };

            // 重寫 getTimezoneOffset 方法
            CustomDate.prototype.getTimezoneOffset = function () {
              const date = new OriginalDate();
              const utc = date.getTime() + date.getTimezoneOffset() * 60000;
              const tzDate = new OriginalDate(date.toLocaleString("en-US", { timeZone: timezone }));
              return (utc - tzDate.getTime()) / 60000;
            };

            // 替換全局的 Date 對象
            window.Date = CustomDate;

            console.log(`Timezone successfully set to: ${timezone}`);
            // 打印本地時間以驗證時區切換
            const localTime = new Date().toString();
            console.log("Current local time:", localTime);
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
