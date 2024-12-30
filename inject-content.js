class TimezoneConverter {
  constructor() {
    this.init();
  }

  init() {
    this.observeTimeZoneChange();
    this.onSettingsChanged();
    this.overrideDateObject();
  }

  observeTimeZoneChange() {
    const observingEl = (this.observingEl = document.querySelector("[data-timezone-ext-el]"));
    if (!observingEl) return;

    const observer = new MutationObserver(() => this.onSettingsChanged());
    observer.observe(observingEl, {
      attributes: true,
    });
  }

  onSettingsChanged() {
    const prefs = this.observingEl.getAttribute("data-timezone-ext-el");
    if (!prefs) return;

    Date.prefs = JSON.parse(prefs);
  }

  overrideDateObject() {
    // 保存原始 Date 物件
    const OriginalDate = Date;
    const originalProto = OriginalDate.prototype;

    // 獲取原始方法
    const {
      getTime,
      toString,
      toLocaleString,
      toLocaleDateString,
      toLocaleTimeString,
      getDate,
      getDay,
      getFullYear,
      getHours,
      getMinutes,
      getMonth,
      getSeconds,
      setDate,
      setFullYear,
      setHours,
      setMinutes,
      setMonth,
      setSeconds,
    } = originalProto;

    // 創建新的 Date 類別
    const ShiftedDate = class extends OriginalDate {
      constructor(...args) {
        super(...args);
        // 創建一個新的日期物件，加上時區偏移
        this.shiftedDate = new OriginalDate(getTime.apply(this) + (Date.prefs?.[2] - Date.prefs?.[1]) * 60 * 1000);
      }

      // Override toString methods
      toString() {
        return this.formatTimeString(toString.apply(this.shiftedDate));
      }

      toLocaleString(...args) {
        return toLocaleString.apply(this.shiftedDate, args);
      }

      toLocaleDateString(...args) {
        return toLocaleDateString.apply(this.shiftedDate, args);
      }

      toLocaleTimeString(...args) {
        return toLocaleTimeString.apply(this.shiftedDate, args);
      }

      // Override getter methods
      getDate() {
        return getDate.apply(this.shiftedDate);
      }
      getDay() {
        return getDay.apply(this.shiftedDate);
      }
      getFullYear() {
        return getFullYear.apply(this.shiftedDate);
      }
      getHours() {
        return getHours.apply(this.shiftedDate);
      }
      getMinutes() {
        return getMinutes.apply(this.shiftedDate);
      }
      getMonth() {
        return getMonth.apply(this.shiftedDate);
      }
      getSeconds() {
        return getSeconds.apply(this.shiftedDate);
      }

      // Override setter methods
      setDate(...args) {
        const oldTime = getTime.apply(this.shiftedDate);
        const result = setDate.apply(this.shiftedDate, args);
        const newTime = getTime.apply(this.shiftedDate);
        super.setTime(getTime.apply(this) + (newTime - oldTime));
        return result;
      }

      setFullYear(...args) {
        const oldTime = getTime.apply(this.shiftedDate);
        const result = setFullYear.apply(this.shiftedDate, args);
        const newTime = getTime.apply(this.shiftedDate);
        super.setTime(getTime.apply(this) + (newTime - oldTime));
        return result;
      }

      setHours(...args) {
        const oldTime = getTime.apply(this.shiftedDate);
        const result = setHours.apply(this.shiftedDate, args);
        const newTime = getTime.apply(this.shiftedDate);
        super.setTime(getTime.apply(this) + (newTime - oldTime));
        return result;
      }

      setMinutes(...args) {
        const oldTime = getTime.apply(this.shiftedDate);
        const result = setMinutes.apply(this.shiftedDate, args);
        const newTime = getTime.apply(this.shiftedDate);
        super.setTime(getTime.apply(this) + (newTime - oldTime));
        return result;
      }

      setMonth(...args) {
        const oldTime = getTime.apply(this.shiftedDate);
        const result = setMonth.apply(this.shiftedDate, args);
        const newTime = getTime.apply(this.shiftedDate);
        super.setTime(getTime.apply(this) + (newTime - oldTime));
        return result;
      }

      setSeconds(...args) {
        const oldTime = getTime.apply(this.shiftedDate);
        const result = setSeconds.apply(this.shiftedDate, args);
        const newTime = getTime.apply(this.shiftedDate);
        super.setTime(getTime.apply(this) + (newTime - oldTime));
        return result;
      }

      // 格式化時間字串
      formatTimeString(str) {
        const timeZoneName = Date.prefs?.[3] || "GMT";
        if (str.includes("(")) {
          str = str.split("(")[0] + `(${timeZoneName})`;
        }
        return str;
      }

      // 獲取時區偏移
      getTimezoneOffset() {
        return Date.prefs?.[1] || 0;
      }
    };

    // 替換全域的 Date 物件
    globalThis.Date = ShiftedDate;
  }
}

// 初始化
new TimezoneConverter();
