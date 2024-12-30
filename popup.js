// 時區列表
const TIMEZONES = [
  "UTC",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Moscow",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Australia/Sydney",
  "Pacific/Auckland",
];

// DOM 元素
const enabledSwitch = document.getElementById("enabled");
const timezoneSelect = document.getElementById("timezone-select");
const systemTimezoneSpan = document.getElementById("system-timezone");
const currentTimeSpan = document.getElementById("current-time");
const targetTimeSpan = document.getElementById("target-time");

// 初始化時區選擇器
function initializeTimezoneSelect() {
  TIMEZONES.forEach(timezone => {
    const option = document.createElement("option");
    option.value = timezone;
    option.textContent = timezone;
    timezoneSelect.appendChild(option);
  });
}

// 更新時間顯示
function updateTimeDisplay() {
  const now = new Date();

  // 顯示系統時區
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  systemTimezoneSpan.textContent = systemTimezone;

  // 顯示當前時間
  currentTimeSpan.textContent = now.toLocaleString("zh-TW", {
    timeZone: systemTimezone,
    hour12: false,
  });

  // 顯示目標時區時間
  const selectedTimezone = timezoneSelect.value;
  targetTimeSpan.textContent = now.toLocaleString("zh-TW", {
    timeZone: selectedTimezone,
    hour12: false,
  });
}

// 載入設定
async function loadSettings() {
  const { targetTimezone, enabled } = await chrome.storage.local.get(["targetTimezone", "enabled"]);

  enabledSwitch.checked = enabled ?? true;
  timezoneSelect.value = targetTimezone || "UTC";

  updateTimeDisplay();
}

// 保存設定
async function saveSettings() {
  await chrome.storage.local.set({
    targetTimezone: timezoneSelect.value,
    enabled: enabledSwitch.checked,
  });

  // 重新載入所有標籤頁
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.reload(tab.id);
  });
}

// 事件監聽器
enabledSwitch.addEventListener("change", saveSettings);
timezoneSelect.addEventListener("change", () => {
  saveSettings();
  updateTimeDisplay();
});

// 初始化
initializeTimezoneSelect();
loadSettings();

// 定時更新時間顯示
setInterval(updateTimeDisplay, 1000);
