// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_TIMEZONE") {
    console.log("收到更新時區的消息:", message.timezone);
    updateTimezone(message.timezone);
  }
});

// 當瀏覽器啟動時，檢查並應用保存的時區設置
chrome.runtime.onStartup.addListener(async () => {
  const { timezone } = await chrome.storage.local.get("timezone");
  if (timezone) {
    updateTimezone(timezone);
  }
});

// 當插件安裝或更新時，檢查並應用保存的時區設置
chrome.runtime.onInstalled.addListener(async () => {
  const { timezone } = await chrome.storage.local.get("timezone");
  if (timezone) {
    updateTimezone(timezone);
  }
});

// 監聽新開啟的頁面
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    const { timezone } = await chrome.storage.local.get("timezone");
    if (timezone) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: newTimezone => {
            const originalDate = Date;

            // 修改 Date 構造函數
            Date = class extends originalDate {
              constructor() {
                super(...arguments);
                if (arguments.length === 0) {
                  const date = new originalDate();
                  const utcTime = date.getTime();
                  const tzOffset = -new originalDate().getTimezoneOffset();
                  const newOffset = this.getTargetTimezoneOffset(newTimezone);
                  const targetTime = utcTime + (newOffset - tzOffset) * 60000;
                  return new originalDate(targetTime);
                }
                return new originalDate(...arguments);
              }

              getTargetTimezoneOffset(tz) {
                const date = new originalDate();
                const utcDate = new originalDate(date.toLocaleString("en-US", { timeZone: "UTC" }));
                const tzDate = new originalDate(date.toLocaleString("en-US", { timeZone: tz }));
                return (utcDate - tzDate) / 60000;
              }
            };

            // 覆蓋本地化相關方法
            Date.prototype.toLocaleString = function () {
              return new originalDate(this.getTime()).toLocaleString("en-US", { timeZone: newTimezone });
            };

            Date.prototype.toLocaleDateString = function () {
              return new originalDate(this.getTime()).toLocaleDateString("en-US", { timeZone: newTimezone });
            };

            Date.prototype.toLocaleTimeString = function () {
              return new originalDate(this.getTime()).toLocaleTimeString("en-US", { timeZone: newTimezone });
            };

            // 修改 toString 方法以正確顯示時區
            Date.prototype.toString = function () {
              const date = new originalDate(this.getTime());
              const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
              const tzTime = new originalDate(utcTime).toLocaleString("en-US", {
                timeZone: newTimezone,
                hour12: false,
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              return tzTime + ` (${newTimezone})`;
            };

            // 修改 getTimezoneOffset 方法
            Date.prototype.getTimezoneOffset = function () {
              const date = new originalDate();
              const utcDate = new originalDate(date.toLocaleString("en-US", { timeZone: "UTC" }));
              const tzDate = new originalDate(date.toLocaleString("en-US", { timeZone: newTimezone }));
              return (utcDate - tzDate) / 60000;
            };

            // 保持原始方法的引用
            Object.defineProperty(window, "originalDate", {
              value: originalDate,
              writable: false,
              configurable: false,
            });
          },
          args: [timezone],
        });
      } catch (error) {
        console.error(`無法在標籤頁 ${tabId} 執行腳本:`, error);
      }
    }
  }
});

// 更新時區的函數
async function updateTimezone(timezone) {
  console.log("更新時區的函數:", timezone);
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: newTimezone => {
          // 檢查是否已經修改過
          if (window._timezonePatchApplied) return;

          const originalDate = Date;

          // 修改 Date 構造函數
          Date = class extends originalDate {
            constructor() {
              super(...arguments);
              if (arguments.length === 0) {
                const date = new originalDate();
                const utcTime = date.getTime();
                const tzOffset = -new originalDate().getTimezoneOffset();
                const newOffset = this.getTargetTimezoneOffset(newTimezone);
                const targetTime = utcTime + (newOffset - tzOffset) * 60000;
                return new originalDate(targetTime);
              }
              return new originalDate(...arguments);
            }

            getTargetTimezoneOffset(tz) {
              const date = new originalDate();
              const utcDate = new originalDate(date.toLocaleString("en-US", { timeZone: "UTC" }));
              const tzDate = new originalDate(date.toLocaleString("en-US", { timeZone: tz }));
              return (utcDate - tzDate) / 60000;
            }
          };

          // 覆蓋本地化相關方法
          Date.prototype.toLocaleString = function () {
            return new originalDate(this.getTime()).toLocaleString("en-US", { timeZone: newTimezone });
          };

          Date.prototype.toLocaleDateString = function () {
            return new originalDate(this.getTime()).toLocaleDateString("en-US", { timeZone: newTimezone });
          };

          Date.prototype.toLocaleTimeString = function () {
            return new originalDate(this.getTime()).toLocaleTimeString("en-US", { timeZone: newTimezone });
          };

          // 修改 toString 方法以正確顯示時區
          Date.prototype.toString = function () {
            const date = new originalDate(this.getTime());
            const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
            const tzTime = new originalDate(utcTime).toLocaleString("en-US", {
              timeZone: newTimezone,
              hour12: false,
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            return tzTime + ` (${newTimezone})`;
          };

          // 修改 getTimezoneOffset 方法
          Date.prototype.getTimezoneOffset = function () {
            const date = new originalDate();
            const utcDate = new originalDate(date.toLocaleString("en-US", { timeZone: "UTC" }));
            const tzDate = new originalDate(date.toLocaleString("en-US", { timeZone: newTimezone }));
            return (utcDate - tzDate) / 60000;
          };

          // 標記已經修改過
          window._timezonePatchApplied = true;

          // 保存原始 Date 到 window 對象
          window._originalDate = originalDate;
        },
        args: [timezone],
      });
    } catch (error) {
      console.error(`無法在標籤頁 ${tab.id} 執行腳本:`, error);
    }
  }
}
