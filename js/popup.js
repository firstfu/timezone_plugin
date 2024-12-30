// 當前時區和時間更新
function updateCurrentTime() {
  const currentTimezone = document.getElementById("currentTimezone");
  const currentTime = document.getElementById("currentTime");

  chrome.storage.sync.get(["timezone"], function (result) {
    const timezone = result.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    currentTimezone.textContent = TIMEZONES.find(tz => tz.value === timezone)?.label || timezone;
    currentTime.textContent = now.toLocaleString("zh-TW", { timeZone: timezone });
  });
}

// 渲染時區列表
function renderTimezoneList() {
  const timezoneList = document.getElementById("timezoneList");
  const favoriteList = document.getElementById("favoriteList");

  chrome.storage.sync.get(["favorites", "timezone"], function (result) {
    const favorites = result.favorites || [];
    const currentTimezone = result.timezone;

    // 渲染常用時區
    favoriteList.innerHTML = favorites
      .map(tz => TIMEZONES.find(t => t.value === tz))
      .filter(Boolean)
      .map(tz => createTimezoneElement(tz, currentTimezone, true))
      .join("");

    // 渲染所有時區
    timezoneList.innerHTML = TIMEZONES.map(tz => createTimezoneElement(tz, currentTimezone, false)).join("");
  });
}

// 創建時區元素
function createTimezoneElement(timezone, currentTimezone, isFavorite) {
  const isActive = timezone.value === currentTimezone;
  return `
        <div class="timezone-item ${isActive ? "active" : ""}"
             data-timezone="${timezone.value}">
            <span>${timezone.label}</span>
            <button class="favorite-btn" data-timezone="${timezone.value}">
                ${isFavorite ? "★" : "☆"}
            </button>
        </div>
    `;
}

// 切換時區
function switchTimezone(timezone) {
  chrome.storage.sync.set({ timezone }, function () {
    updateCurrentTime();
    renderTimezoneList();
  });
}

// 切換收藏狀態
function toggleFavorite(timezone) {
  chrome.storage.sync.get(["favorites"], function (result) {
    let favorites = result.favorites || [];
    const index = favorites.indexOf(timezone);

    if (index === -1) {
      favorites.push(timezone);
    } else {
      favorites.splice(index, 1);
    }

    chrome.storage.sync.set({ favorites }, function () {
      renderTimezoneList();
    });
  });
}

// 搜索功能
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", function (e) {
    const searchText = e.target.value.toLowerCase();
    const items = document.querySelectorAll(".timezone-item");

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(searchText) ? "flex" : "none";
    });
  });
}

// 事件監聽器設置
function setupEventListeners() {
  // 時區點擊
  document.addEventListener("click", function (e) {
    const timezoneItem = e.target.closest(".timezone-item");
    if (timezoneItem) {
      const timezone = timezoneItem.dataset.timezone;
      switchTimezone(timezone);
    }

    // 收藏按鈕點擊
    const favoriteBtn = e.target.closest(".favorite-btn");
    if (favoriteBtn) {
      e.stopPropagation();
      const timezone = favoriteBtn.dataset.timezone;
      toggleFavorite(timezone);
    }
  });

  // 設置按鈕點擊
  document.getElementById("settingsBtn").addEventListener("click", function () {
    // TODO: 實現設置面板
  });
}

// 初始化
document.addEventListener("DOMContentLoaded", function () {
  updateCurrentTime();
  renderTimezoneList();
  setupSearch();
  setupEventListeners();

  // 每秒更新當前時間
  setInterval(updateCurrentTime, 1000);
});
