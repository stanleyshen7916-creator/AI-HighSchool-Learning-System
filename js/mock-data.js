/* js/mock-data.js — Mock data for AI 高中學習系統 (Prototype).
   No network / API / backend — all values are embedded here.
   Home v1.0 blocks: hero / today tasks / recent materials / AI tutor /
   study stats / study plan / achievements. */
window.AHS = window.AHS || {};
AHS.Mock = {
  teacher: { name: "AI 巧巧老師" },
  student: { name: "同學", grade: "高一生" },

  hero: {
    greeting: "早安，同學！",
    headline: "今天也是充實學習的一天！",
    recommendation: "持續學習，你會看到更好的自己！",
    tipTitle: "巧巧老師的小提醒",
    tip: "學習就像累積小小的進步，每天一點點，未來會很不一樣！",
    startLabel: "開始今日學習",
    continueLabel: "繼續昨天進度",
    startFeedback: "（Mock）開始今日學習：數學《二次函數的圖形與性質》",
    continueFeedback: "（Mock）繼續昨天進度：英文《文法練習》"
  },

  todayTasks: {
    title: "今日任務",
    items: [
      { subject: "math", unit: "二次函數的圖形與性質", done: 0, total: 10 },
      { subject: "english", unit: "文法練習", done: 0, total: 8 },
      { subject: "physics", unit: "牛頓運動定律", done: 0, total: 12 }
    ]
  },

  recentMaterials: {
    title: "最近教材",
    items: [
      { subject: "math", unit: "二次函數的圖形與性質", teacher: "張老師", percent: 60 },
      { subject: "english", unit: "英文閱讀理解攻略", teacher: "Amy 老師", percent: 40 },
      { subject: "physics", unit: "牛頓運動定律總整理", teacher: "王老師", percent: 80 },
      { subject: "chemistry", unit: "化學反應與平衡", teacher: "林老師", percent: 30 }
    ]
  },

  aiTutor: {
    title: "AI 巧巧老師",
    message: "同學加油！我建議你今天先從數學開始，打好基礎會讓學習更輕鬆喔！",
    askLabel: "問問我任何問題吧！",
    askFeedback: "（Mock）開啟與巧巧老師的對話",
    actions: [
      { id: "photo", icon: "camera", label: "拍照解題", desc: "上傳題目即時解答" },
      { id: "summary", icon: "summary", label: "重點整理", desc: "AI 快速整理筆記" },
      { id: "word", icon: "aa", label: "單字小幫手", desc: "英文單字隨記憶卡" },
      { id: "plan", icon: "calendar", label: "學習計畫", desc: "客製你的學習計畫" }
    ]
  },

  studyStats: {
    title: "學習統計",
    rangeLabel: "本週",
    totalHours: 18.6,
    deltaHours: 2.4,
    bars: [
      { subject: "math", hours: 5.2 },
      { subject: "english", hours: 4.1 },
      { subject: "physics", hours: 3.6 },
      { subject: "chemistry", hours: 2.9 },
      { subject: "biology", hours: 1.8 },
      { subject: "history", hours: 1.0 }
    ]
  },

  studyPlan: {
    title: "學習計畫",
    points: { earned: 0, target: 120 },
    slots: [
      { time: "09:00", subject: "math", unit: "二次函數的圖形與性質" },
      { time: "11:00", subject: "english", unit: "文法練習" },
      { time: "14:00", subject: "physics", unit: "牛頓運動定律" }
    ]
  },

  achievements: {
    title: "成就徽章",
    items: [
      { icon: "star", label: "學習新星", desc: "連續學習 3 天", tone: "gold" },
      { icon: "quiz", label: "測驗達人", desc: "測驗正確率 80%", tone: "brand" },
      { icon: "clock", label: "時間管理大師", desc: "本週學習超過 15 小時", tone: "physics" },
      { icon: "summary", label: "知識探索者", desc: "完成 50 個教材", tone: "chemistry" },
      { icon: "heart", label: "完美主義者", desc: "測驗正確率 100%", tone: "history" },
      { icon: "sparkle", label: "堅持不懈", desc: "連續學習 7 天", tone: "english" }
    ]
  },

  nav: {
    active: "home",
    items: [
      { id: "home", label: "首頁", icon: "home" },
      { id: "materials", label: "教材中心", icon: "book" },
      { id: "quiz", label: "測驗中心", icon: "quiz" },
      { id: "wrongbook", label: "錯題本", icon: "wrong" },
      { id: "summary", label: "重點整理", icon: "summary" },
      { id: "learning", label: "我的學習", icon: "learning" },
      { id: "dashboard", label: "儀表板", icon: "dashboard" },
      { id: "tutor", label: "AI Tutor", icon: "tutor" }
    ],
    bottomItems: [
      { id: "home", label: "首頁", icon: "home" },
      { id: "materials", label: "教材", icon: "book" },
      { id: "quiz", label: "考卷", icon: "quiz" },
      { id: "wrongbook", label: "錯題", icon: "wrong" },
      { id: "me", label: "我的", icon: "tutor" }
    ]
  }
};
