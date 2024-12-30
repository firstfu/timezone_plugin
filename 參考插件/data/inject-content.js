class TimezoneChangeInject {
  init() {
    this.observeTimeZoneChange();
    this.onSettingsChanged();
    this.runInjectCode();
  }

  onSettingsChanged() {
    const prefs = this.observingEl.getAttribute("data-timezone-ext-el");
    if (!prefs) {
      return;
    }
    Date.prefs = JSON.parse(prefs);
  }

  observeTimeZoneChange() {
    const observingEl = (this.observingEl = document.querySelector("[data-timezone-ext-el]"));
    if (!observingEl) {
      return;
    }

    const observer = new MutationObserver(() => this.onSettingsChanged());
    observer.observe(observingEl, {
      attributes: true,
    });
  }

  runInjectCode() {
    Date.prefs = Date.prefs || ["Etc/GMT", 0, new Date().getTimezoneOffset(), "GMT"];
    try {
      Date.prefs = window.parent.Date.prefs;
    } catch (e) {}

    const ODate = Date;
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
    } = ODate.prototype;

    const ShiftedDate = class extends ODate {
      constructor(...args) {
        super(...args);
        this.shiftedDate = new ODate(getTime.apply(this) + (Date.prefs[2] - Date.prefs[1]) * 60 * 1000);
      }

      // 基本方法
      getTime() {
        return getTime.apply(this.shiftedDate);
      }

      valueOf() {
        return this.shiftedDate.valueOf();
      }

      // 本地時間方法
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

      // 獲取方法
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

      // 設置方法
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

      getTimezoneOffset() {
        return Date.prefs[1];
      }

      formatTimeString(str) {
        const timezoneName = Date.prefs[3] || "GMT";
        if (str.includes("(")) {
          str = str.split("(")[0].trim() + " (" + timezoneName + ")";
        }
        return str;
      }
    };

    globalThis.Date = ShiftedDate;

    const ODateTimeFormat = Intl.DateTimeFormat;
    globalThis.Intl.DateTimeFormat = function (locales, options = {}) {
      options.timeZone = Date.prefs[0];
      return new ODateTimeFormat(locales, options);
    };
  }
}

new TimezoneChangeInject().init();
