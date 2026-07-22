/* js/data/AppConfig.js — Sprint 7.0 · EO-S7.0-003 Production Cleanup.

   This file REPLACES js/data/MockData.js. It contains ONLY legitimate
   static UI configuration and copy — navigation labels, page titles,
   filter vocabularies, Qiaoqiao's spoken lines, button text. Per
   Repository Structure v2.1 §js/data ("未來所有 Static Data / Metadata /
   Config 皆放此資料夾") this is its designated home.

   What was deliberately NOT carried over from MockData.js (removed for
   good, per the Production Cleanup order):
     - 預設教材 items / recentFiles        (Material Runtime is the source)
     - 預設題庫 quiz.items                 (Exam list starts EMPTY)
     - 假統計 quiz.stats / accuracyByStudy / history / dashboard /
       studyPlan / achievements / myLearning
     - 預設錯題 wrongBook.items            (WrongBookSession is the source)
     - 假通知 notifications、假使用者 陳同學/email、lastReading seed、
       假對話 aiTutorPage.messages / history / resources、
       假科目數量 subjectCounts (now computed live from MaterialRuntime)
   Every module that consumed those now renders its 正式 Empty State or
   derives real values from the Runtimes. */
window.AHS = window.AHS || {};
AHS.AppConfig = {
  teacher: { name: "AI 巧巧老師" },
  student: { name: "同學", grade: "高中生" },

  hero: {
    greeting: "早安，同學！",
    headline: "今天也是充實學習的一天！",
    recommendation: "持續學習，你會看到更好的自己！",
    tipTitle: "巧巧老師的小提醒",
    tip: "學習就像累積小小的進步，每天一點點，未來會很不一樣！",
    startLabel: "開始今日學習",
    continueLabel: "繼續昨天進度",
    startFeedback: "從上傳教材開始今天的學習吧！",
    continueFeedback: "回到教材中心繼續你的學習進度。"
  },

  materials: {
    title: "教材中心",
    subtitle: "探索、學習與下載各科教材資源",
    categories: ["全部分類", "課本", "講義", "考卷", "筆記", "補充資料", "影片", "其他"],
    grades: ["高一", "高二", "高三"],
    sorts: ["最新上傳", "最多觀看", "學習進度"],
    formats: ["全部格式", "PDF", "PPT", "PPTX", "DOC", "DOCX", "XLS", "XLSX", "TXT", "MP4", "MP3", "JPG", "JPEG", "PNG", "GIF", "WEBP", "其他"],
    /* subjectCounts is a template of the nine fixed subjects; the REAL
       per-subject counts are computed from AHS.MaterialRuntime at page
       init (MaterialCenter) — never faked here. */
    subjectCounts: [
      { subject: "chinese", count: 0 }, { subject: "english", count: 0 },
      { subject: "math", count: 0 }, { subject: "physics", count: 0 },
      { subject: "chemistry", count: 0 }, { subject: "biology", count: 0 },
      { subject: "history", count: 0 }, { subject: "geography", count: 0 },
      { subject: "civics", count: 0 }
    ]
  },

  quiz: {
    title: "測驗中心",
    titleEn: "Quiz Center",
    subtitle: "上傳教材後，AI 會為你建立專屬練習！",
    subjects: ["all", "math", "english", "physics", "chemistry", "biology"],
    grades: ["高一", "高二", "高三"],
    chapters: ["全部章節"],
    difficulties: ["全部難度", "易", "中等", "難"],
    types: ["全部題型", "選擇題", "填充題", "問答題"],
    sorts: ["最新排序", "正確率", "完成度"],
    items: [],          /* 預設題庫已移除 — 正式 Empty State */
    stats: [],
    accuracyByStudy: [],
    history: []
  },

  wrongBook: {
    title: "錯題本",
    subtitle: "整理錯題，釐清觀念，強化弱點！",
    bannerTip: "每一次錯誤，都是進步的線索！再試一次，你一定可以更好！",
    subjectOptions: ["全部科目", "國文", "英文", "數學", "物理", "化學", "生物", "歷史", "地理", "公民"],
    knowledgeOptions: ["全部知識點"],
    difficultyOptions: ["全部難易度", "簡單", "中等", "困難"],
    statusOptions: ["全部狀態", "待複習", "複習中", "已精熟"],
    perPage: 6
  },

  aiTutorPage: {
    title: "巧巧老師 AI Tutor",
    tagline: "有問題儘管問我，我會陪你一起思考、一起進步！",
    badge: "AI 助教",
    messages: [],       /* 假對話已移除 — 對話從空白開始 */
    suggestions: [
      { icon: "summary", label: "解題步驟詳解", desc: "請詳細解題" },
      { icon: "chat", label: "概念解釋", desc: "用簡單的方式說明" },
      { icon: "quiz", label: "類題練習", desc: "出類似的題目練習" },
      { icon: "bookmark", label: "重點整理", desc: "整理成重點筆記" },
      { icon: "target", label: "考卷解析", desc: "解析考卷題目" },
      { icon: "refresh", label: "換個主題", desc: "聊聊別的內容" }
    ],
    /* 巧巧老師 prototype 回覆台詞（UI copy，同勵志語錄性質；已於
       EO 報告 Flag，PMO 可裁定移除）。 */
    cannedReplies: [
      "好的！這是一個很好的問題，我們一步一步來看。首先確認題目的已知條件，再選擇適合的公式或方法。",
      "沒問題～我先幫你把關鍵概念拆解成幾個小步驟，這樣會更容易理解喔！",
      "很棒的思考方向！讓我用一個簡單的例子帶你一起推導看看。"
    ],
    history: [],        /* 假對話紀錄已移除 */
    resources: []       /* 假檔案清單已移除 */
  },

  nav: {
    active: "home",
    items: [
      { id: "home", label: "首頁", icon: "home" },
      { id: "materials", label: "教材中心", icon: "book" },
      { id: "quiz", label: "測驗中心", icon: "quiz" },
      { id: "wrongbook", label: "錯題本", icon: "wrong" },
      { id: "summary", label: "學習總結", icon: "summary" },
      { id: "review", label: "複習中心", icon: "clock" },
      { id: "learning", label: "我的學習", icon: "learning" },
      { id: "tutor", label: "AI Tutor", icon: "tutor" }
    ],
    bottomItems: [
      { id: "home", label: "首頁", icon: "home" },
      { id: "materials", label: "教材", icon: "book" },
      { id: "quiz", label: "測驗", icon: "quiz" },
      { id: "review", label: "複習", icon: "clock" },
      { id: "dashboard", label: "我的", icon: "tutor" }
    ]
  },

  notifications: [],    /* 假通知已移除 — AppShell 既有通知 Empty State */
  user: { name: "同學", avatar: "", email: "" }
};
