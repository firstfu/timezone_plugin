const script = document.createElement("script");
script.setAttribute("data-timezone-ext-el", "");
script.setAttribute("src", chrome.runtime.getURL("/data/inject-content.js"));
document.documentElement.appendChild(script);

chrome.runtime.sendMessage({
    op: "DatePrefs",
}, res => {
    if (!res) { return; }
    script.setAttribute("data-timezone-ext-el", JSON.stringify(res));
});