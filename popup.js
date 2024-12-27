document.addEventListener("DOMContentLoaded", async () => {
  const timezoneSelect = document.getElementById("timezoneSelect");
  const saveButton = document.getElementById("saveButton");
  const enableSwitch = document.getElementById("enableSwitch");

  // 載入保存的設置
  const { timezone, enabled } = await chrome.storage.local.get(["timezone", "enabled"]);
  if (timezone) {
    timezoneSelect.value = timezone;
  }
  enableSwitch.checked = enabled ?? false;

  // 更新介面狀態
  function updateUIState(enabled) {
    timezoneSelect.disabled = !enabled;
    saveButton.disabled = !enabled;
    if (!enabled) {
      saveButton.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      saveButton.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  updateUIState(enableSwitch.checked);

  // 處理開關切換
  enableSwitch.addEventListener("change", async () => {
    const enabled = enableSwitch.checked;
    await chrome.storage.local.set({ enabled });
    updateUIState(enabled);

    // 通知 background script 更新狀態
    chrome.runtime.sendMessage({
      type: enabled ? "ENABLE_TIMEZONE" : "DISABLE_TIMEZONE",
    });
  });

  saveButton.addEventListener("click", async () => {
    const selectedTimezone = timezoneSelect.value;
    console.log("保存時區設置:", selectedTimezone);

    await chrome.storage.local.set({ timezone: selectedTimezone });

    chrome.runtime.sendMessage({
      type: "UPDATE_TIMEZONE",
      timezone: selectedTimezone,
    });

    saveButton.textContent = "已保存！";
    saveButton.classList.remove("bg-blue-500", "hover:bg-blue-600");
    saveButton.classList.add("bg-green-500", "hover:bg-green-600");

    setTimeout(() => {
      saveButton.textContent = "保存設置";
      saveButton.classList.remove("bg-green-500", "hover:bg-green-600");
      saveButton.classList.add("bg-blue-500", "hover:bg-blue-600");
    }, 2000);
  });
});
