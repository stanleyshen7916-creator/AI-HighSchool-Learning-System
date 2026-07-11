/* js/utils/date.js — Sprint 1 · Task 002: 首頁日期與星期功能.
   Pure Vanilla JS utility under window.AHS.Utils. Returns the current
   system date formatted as "YYYY / MM / DD" plus the Traditional Chinese
   weekday label. Never throws — falls back to "--" on failure. */
window.AHS = window.AHS || {};
AHS.Utils = AHS.Utils || {};

/* getCurrentDate()
   回傳 { date: "YYYY / MM / DD", weekday: "星期X" }。
   若系統日期取得失敗，回傳 { date: "--", weekday: "--" }，不得拋出例外。 */
AHS.Utils.getCurrentDate = function () {
  var FALLBACK = { date: "--", weekday: "--" };
  var WEEKDAY_LABELS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  try {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var weekdayIndex = now.getDay();

    if (
      typeof year !== "number" || isNaN(year) ||
      typeof month !== "number" || isNaN(month) ||
      typeof day !== "number" || isNaN(day) ||
      typeof weekdayIndex !== "number" || isNaN(weekdayIndex) ||
      weekdayIndex < 0 || weekdayIndex > 6
    ) {
      return FALLBACK;
    }

    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    var formattedDate = year + " / " + pad(month) + " / " + pad(day);

    return {
      date: formattedDate,
      weekday: WEEKDAY_LABELS[weekdayIndex]
    };
  } catch (err) {
    return FALLBACK;
  }
};
