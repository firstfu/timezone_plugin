// 創建腳本元素
const script = document.createElement("script");
script.setAttribute("data-timezone-ext-el", "");
script.setAttribute("src", chrome.runtime.getURL("inject-content.js"));
document.documentElement.appendChild(script);

// 從背景腳本獲取時區設定
chrome.runtime.sendMessage(
  {
    op: "GetTimezoneSettings",
  },
  response => {
    if (!response) return;
    script.setAttribute("data-timezone-ext-el", JSON.stringify(response));
  }
);
