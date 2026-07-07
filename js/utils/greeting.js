/* js/utils/greeting.js — Sprint 1 · Task 001: AI 老師今日問候 (Greeting).
   Pure Vanilla JS utility under window.AHS.Utils. Returns a time-based
   greeting string; never throws. No DOM access, no localStorage, no
   HTML/CSS changes — this file only computes a String. */
window.AHS = window.AHS || {};
AHS.Utils = AHS.Utils || {};

/* getGreeting()
   回傳依目前系統時間對應的問候文字（String）。
   時間區間：
     05:00–10:59  早安
     11:00–16:59  午安
     17:00–22:59  晚安
     23:00–04:59  深夜
   若系統時間取得失敗，回傳預設歡迎詞，不得拋出例外。 */
AHS.Utils.getGreeting = function () {
  var FALLBACK = "歡迎回來，開始今天的學習吧！";

  try {
    var hour = new Date().getHours();

    if (typeof hour !== "number" || isNaN(hour)) {
      return FALLBACK;
    }

    if (hour >= 5 && hour <= 10) {
      return "☀️ 早安，今天一起努力學習吧！";
    }
    if (hour >= 11 && hour <= 16) {
      return "🌤 午安，保持節奏，繼續加油！";
    }
    if (hour >= 17 && hour <= 22) {
      return "🌙 晚安，今天也完成不少進度了！";
    }
    /* 23:00–04:59 */
    return "🌌 夜深了，記得適當休息，明天再努力。";
  } catch (err) {
    return FALLBACK;
  }
};
