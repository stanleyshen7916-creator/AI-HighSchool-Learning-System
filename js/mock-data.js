/* js/mock-data.js — Mock data for the Home Hero (Prototype v0.1).
   No network / API / backend — all values are embedded here. */
window.AHS = window.AHS || {};
AHS.Mock = {
  teacher: {
    name: "AI 巧巧老師"
  },
  student: {
    name: "靖恩"
  },
  hero: {
    greeting: "嗨，靖恩，早安！",
    recommendation: "今天先複習數學《三角函數》，再一起挑戰今日的小測驗吧！",
    startLabel: "開始今日學習",
    continueLabel: "繼續昨天進度",
    /* Mock feedback shown when a button is tapped (no real navigation yet). */
    startFeedback: "（Mock）開始今日學習：數學《三角函數》",
    continueFeedback: "（Mock）繼續昨天進度：英文《文法》第 2 章"
  }
};
