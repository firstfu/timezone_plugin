// 獲取當前系統時區偏移
const systemOffset = new Date().getTimezoneOffset();

// 監聽來自內容腳本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.op === "GetTimezoneSettings") {
    getTimezoneSettings().then(sendResponse);
    return true; // 保持消息通道開啟
  }
});

// 獲取時區設定
async function getTimezoneSettings() {
  const { targetTimezone, enabled } = await chrome.storage.local.get(["targetTimezone", "enabled"]);

  if (!enabled) {
    return null;
  }

  // 如果沒有設定目標時區，使用預設值
  const timezone = targetTimezone || "UTC";
  const offset = getTimezoneOffset(timezone);
  const timezoneName = getTimezoneName(timezone);

  return [
    timezone, // 時區標識符
    offset, // 目標時區的偏移量（分鐘）
    systemOffset, // 系統時區的偏移量（分鐘）
    timezoneName, // 時區顯示名稱
  ];
}

// 獲取時區偏移量（分鐘）
function getTimezoneOffset(timezone) {
  const date = new Date();
  const targetTime = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  const targetOffset = (targetTime - date) / (60 * 1000);
  return targetOffset;
}

// 獲取時區顯示名稱
function getTimezoneName(timezone) {
  try {
    const options = { timeZoneName: "long", timeZone: timezone };
    return new Date().toLocaleString("en-US", options).split(" (")[1].slice(0, -1);
  } catch (e) {
    return timezone;
  }
}

// 初始化設定
chrome.runtime.onInstalled.addListener(async () => {
  const { targetTimezone } = await chrome.storage.local.get("targetTimezone");
  if (!targetTimezone) {
    await chrome.storage.local.set({
      targetTimezone: "UTC",
      enabled: true,
    });
  }
});
