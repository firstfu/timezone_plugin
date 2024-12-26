document.addEventListener("DOMContentLoaded", async () => {
  const timezoneSelect = document.getElementById("timezoneSelect");
  const saveButton = document.getElementById("saveButton");

  // 載入保存的時區設置
  const { timezone } = await chrome.storage.local.get("timezone");
  if (timezone) {
    timezoneSelect.value = timezone;
  }

  saveButton.addEventListener("click", async () => {
    const selectedTimezone = timezoneSelect.value;

    console.log("保存時區設置:", selectedTimezone);

    // 保存時區設置
    await chrome.storage.local.set({ timezone: selectedTimezone });

    // 通知 background script 更新時區
    chrome.runtime.sendMessage({
      type: "UPDATE_TIMEZONE",
      timezone: selectedTimezone,
    });

    // 顯示成功提示
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
