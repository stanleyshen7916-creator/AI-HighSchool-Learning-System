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
      { id: 1, subject: "math", title: "第三章 指數函數", done: 2, total: 5 },
      { id: 2, subject: "english", title: "Unit 4 文法練習", done: 7, total: 10 },
      { id: 3, subject: "physics", title: "牛頓運動定律總整理", done: 5, total: 5 },
      { id: 4, subject: "chemistry", title: "化學反應與平衡", done: 0, total: 4 }
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

  materials: {
    title: "教材中心",
    subtitle: "探索、學習與下載各科教材資源",
    subjectCounts: [
      { subject: "chinese", count: 128 },
      { subject: "english", count: 156 },
      { subject: "math", count: 142 },
      { subject: "physics", count: 98 },
      { subject: "chemistry", count: 87 },
      { subject: "biology", count: 74 },
      { subject: "history", count: 93 },
      { subject: "geography", count: 81 },
      { subject: "civics", count: 65 }
    ],
    categories: ["全部分類", "課本", "講義", "考卷", "筆記", "補充資料", "影片", "其他"],
    grades: ["高一", "高二", "高三"],
    sorts: ["最新上傳", "最多觀看", "學習進度"],
    formats: ["全部格式", "PDF", "PPT", "DOCX", "MP4"],
    items: [
      { id: 1, subject: "math", title: "二次函數的圖形與性質", chapter: "第三章", date: "2024/06/20", views: "1.2k", content: "本教材介紹二次函數的圖形特徵、頂點座標與對稱軸，並透過範例說明如何由標準式判斷開口方向與最大最小值。", progress: 45 },
      { id: 2, subject: "english", title: "英文閱讀理解攻略", chapter: "Unit 3", date: "2024/06/19", views: "980", content: "本教材整理閱讀理解常見題型與解題技巧，包含主旨判斷、細節查找與推論題的解題步驟。", progress: 100 },
      { id: 3, subject: "physics", title: "牛頓運動定律總整理", chapter: "第二章", date: "2024/06/18", views: "756", content: "本教材彙整牛頓三大運動定律的定義與應用範例，並附上常見計算題型解析。", progress: 0 },
      { id: 4, subject: "chemistry", title: "化學反應與平衡", chapter: "第三章", date: "2024/06/17", views: "832", content: "本教材說明化學反應速率與平衡常數的關係，並介紹勒沙特列原理的應用情境。", progress: 70 },
      { id: 5, subject: "biology", title: "細胞構造與功能", chapter: "第 1-2 節", date: "2024/06/16", views: "1.1k", content: "本教材介紹動植物細胞的基本構造與各胞器功能，並比較兩者的差異。", progress: 0 },
      { id: 6, subject: "history", title: "中國古代史總整理", chapter: "第二章", date: "2024/06/15", views: "645", content: "本教材整理中國古代重要朝代的政治制度與社會變遷重點。", progress: 100 },
      { id: 7, subject: "geography", title: "臺灣的地形與氣候", chapter: "第二章", date: "2024/06/14", views: "701", content: "本教材說明臺灣主要地形分布與氣候特徵，並分析其對產業發展的影響。", progress: 30 },
      { id: 8, subject: "civics", title: "憲法基本原則", chapter: "第一章", date: "2024/06/13", views: "589", content: "本教材介紹憲法的基本原則與立憲精神，並說明其在國家治理中的角色。", progress: 0 }
    ],
    recentFiles: [
      { name: "二次函數重點整理.pdf", type: "PDF", size: "2.4 MB", date: "2024/06/20" },
      { name: "牛頓定律講義.pptx", type: "PPT", size: "5.6 MB", date: "2024/06/18" },
      { name: "英文單字筆記.docx", type: "DOCX", size: "1.8 MB", date: "2024/06/17" },
      { name: "高一模考成績分析.xlsx", type: "XLSX", size: "2.1 MB", date: "2024/06/15" },
      { name: "化學反應動畫.mp4", type: "MP4", size: "45.2 MB", date: "2024/06/14" }
    ]
  },

  quiz: {
    title: "測驗中心",
    titleEn: "Quiz Center",
    subtitle: "大量題庫，智能練習，精準提升學習成效！",
    subjects: ["all", "math", "english", "physics", "chemistry", "biology"],
    grades: ["高一", "高二", "高三"],
    chapters: ["全部章節", "第一章", "第二章", "第三章"],
    difficulties: ["全部難度", "易", "中等", "難"],
    types: ["全部題型", "選擇題", "填充題", "問答題"],
    sorts: ["最新排序", "正確率", "完成度"],
    items: [
      { subject: "math", title: "二次函數的圖形與性質", grade: "高一上", chapter: "第三章",
        count: 10, type: "選擇題", difficulty: "易~中等", progress: 80, accuracy: 85, best: 85, done: false },
      { subject: "english", title: "英文閱讀理解攻略", grade: "高一上", chapter: "Unit 3",
        count: 15, type: "選擇題", difficulty: "中等", progress: 40, accuracy: 66, best: 66, done: false },
      { subject: "physics", title: "牛頓運動定律總整理", grade: "高一上", chapter: "第二章",
        count: 12, type: "選擇題", difficulty: "中等", progress: 60, accuracy: 75, best: 75, done: false },
      { subject: "chemistry", title: "化學反應與平衡", grade: "高一上", chapter: "第三章",
        count: 10, type: "選擇題", difficulty: "難", progress: 20, accuracy: 40, best: 40, done: false },
      { subject: "biology", title: "細胞構造與功能", grade: "高一上", chapter: "第一章",
        count: 10, type: "選擇題", difficulty: "易~中等", progress: 100, accuracy: 92, best: 92, done: true }
    ],
    stats: [
      { icon: "clock", label: "總測驗次數", value: "18", unit: "次", delta: "較上週 +4 次" },
      { icon: "target", label: "平均正確率", value: "78", unit: "%", delta: "較上週 +8%" },
      { icon: "award", label: "總得分", value: "1408", unit: "分", delta: "較上週 +256 分" },
      { icon: "check", label: "已完成題數", value: "156", unit: "題", delta: "較上週 +28 題" }
    ],
    accuracyByStudy: [
      { subject: "math", percent: 85 },
      { subject: "english", percent: 75 },
      { subject: "physics", percent: 70 },
      { subject: "chemistry", percent: 60 },
      { subject: "biology", percent: 90 },
      { subject: "history", percent: 65 },
      { subject: "geography", percent: 70 }
    ],
    history: [
      { subject: "math", title: "二次函數的圖形與性質", when: "2024/06/20 14:30", score: 85, accuracy: 85 },
      { subject: "english", title: "英文閱讀理解攻略", when: "2024/06/19 19:20", score: 66, accuracy: 66 },
      { subject: "physics", title: "牛頓運動定律總整理", when: "2024/06/19 10:15", score: 75, accuracy: 75 },
      { subject: "chemistry", title: "化學反應與平衡", when: "2024/06/18 16:45", score: 40, accuracy: 40 }
    ]
  },

  wrongBook: {
    title: "錯題本",
    subtitle: "整理錯題，釐清觀念，強化弱點！",
    bannerTip: "每一次錯誤，都是進步的線索！再試一次，你一定可以更好！",
    subjectOptions: ["全部科目", "國文", "英文", "數學", "物理", "化學", "生物", "歷史", "地理", "公民"],
    knowledgeOptions: ["全部知識點", "二次函數", "關係代名詞", "牛頓運動定律", "反應速率", "光合作用"],
    difficultyOptions: ["全部難易度", "簡單", "中等", "困難"],
    statusOptions: ["全部狀態", "未複習", "已複習", "已精熟"],
    totalCount: 58,
    perPage: 6,
    totalPages: 10,
    items: [
      {
        subject: "math", title: "二次函數的圖形與性質", chapter: "高一數學｜第二章 二次函數",
        difficulty: "困難", errorCount: 2, lastError: "2024/06/20", bookmarked: true,
        question: "若二次函數 f(x) = x² − 6x + 5，則下列敘述何者錯誤？",
        options: [
          { key: "A", text: "此函數圖形開口向上" },
          { key: "B", text: "頂點坐標為 (3, −4)" },
          { key: "C", text: "與 x 軸有兩個交點" },
          { key: "D", text: "y 截距為 5" }
        ],
        yourAnswer: "B", correctAnswer: "B",
        knowledgePoint: "二次函數的圖形與頂點",
        explanation: "頂點公式 x = −b / 2a = −(−6) / 2(1) = 3，代入 f(3) = 3² − 6(3) + 5 = 9 − 18 + 5 = −4，所以頂點為 (3, −4)。因此 (B) 頂點坐標為 (3, −4) 是正確的，故錯誤的選項應為其他敘述。"
      },
      {
        subject: "english", title: "關係代名詞綜合題", chapter: "高一英文｜Unit 4 關係子句",
        difficulty: "中等", errorCount: 1, lastError: "2024/06/18", bookmarked: false,
        question: "Choose the correct relative pronoun: The book ___ I borrowed is interesting.",
        options: [
          { key: "A", text: "who" },
          { key: "B", text: "which" },
          { key: "C", text: "whose" },
          { key: "D", text: "where" }
        ],
        yourAnswer: "A", correctAnswer: "B",
        knowledgePoint: "關係代名詞 which / that",
        explanation: "先行詞 the book 為「事物」，且關係子句中作受詞，應使用 which 或 that；who 用於「人」，故正確答案為 (B) which。"
      },
      {
        subject: "physics", title: "牛頓運動定律應用", chapter: "高一物理｜第二章 力與運動",
        difficulty: "中等", errorCount: 3, lastError: "2024/06/17", bookmarked: false,
        question: "質量 2 kg 的物體受 10 N 的水平力，若摩擦力為 2 N，則加速度為？",
        options: [
          { key: "A", text: "3 m/s²" },
          { key: "B", text: "4 m/s²" },
          { key: "C", text: "5 m/s²" },
          { key: "D", text: "6 m/s²" }
        ],
        yourAnswer: "C", correctAnswer: "B",
        knowledgePoint: "牛頓第二運動定律",
        explanation: "合力 = 10 − 2 = 8 N，由 F = ma 得 a = F / m = 8 / 2 = 4 m/s²，故正確答案為 (B)。"
      },
      {
        subject: "chemistry", title: "化學反應速率計算", chapter: "高一化學｜第三章 化學反應速率",
        difficulty: "困難", errorCount: 2, lastError: "2024/06/16", bookmarked: false,
        question: "溫度升高使反應速率加快，主要原因為？",
        options: [
          { key: "A", text: "活化能降低" },
          { key: "B", text: "有效碰撞次數增加" },
          { key: "C", text: "反應物濃度增加" },
          { key: "D", text: "催化劑增加" }
        ],
        yourAnswer: "A", correctAnswer: "B",
        knowledgePoint: "反應速率與碰撞理論",
        explanation: "溫度升高使分子平均動能增加，達到活化能的有效碰撞次數增加，故反應速率加快；活化能本身不因溫度而改變，故正確答案為 (B)。"
      },
      {
        subject: "biology", title: "光合作用階段比較", chapter: "高一生物｜第三章 植物的生理作用",
        difficulty: "簡單", errorCount: 1, lastError: "2024/06/15", bookmarked: false,
        question: "光反應發生的位置為？",
        options: [
          { key: "A", text: "基質" },
          { key: "B", text: "類囊體膜" },
          { key: "C", text: "細胞質" },
          { key: "D", text: "粒線體" }
        ],
        yourAnswer: "A", correctAnswer: "B",
        knowledgePoint: "光合作用的光反應",
        explanation: "光反應發生於葉綠體的類囊體膜上，暗反應（卡爾文循環）才發生於基質，故正確答案為 (B)。"
      },
      {
        subject: "history", title: "明清時期社會經濟發展", chapter: "高一歷史｜第二章 明清時期",
        difficulty: "中等", errorCount: 2, lastError: "2024/06/14", bookmarked: false,
        question: "明清時期江南地區經濟發展的重要特徵為？",
        options: [
          { key: "A", text: "遊牧經濟興盛" },
          { key: "B", text: "手工業與商業市鎮興起" },
          { key: "C", text: "莊園制度確立" },
          { key: "D", text: "海禁完全解除" }
        ],
        yourAnswer: "C", correctAnswer: "B",
        knowledgePoint: "明清社會經濟",
        explanation: "明清時期江南地區手工業（紡織）與商業市鎮蓬勃發展，出現專業化生產與商品經濟，故正確答案為 (B)。"
      }
    ]
  },

  summary: {
    title: "學習總結",
    subtitle: "AI 智能總結，幫助你快速掌握重點",
    subject: "chemistry",
    grade: "高一化學",
    chapter: "第三章 物質的組成與化學反應",
    section: "3-2 化學反應中的質量關係",
    stats: [
      { icon: "summary", label: "總結字數", value: "1,245", unit: "字" },
      { icon: "star", label: "重點數量", value: "12", unit: "個" },
      { icon: "clock", label: "預估閱讀時間", value: "6", unit: "分鐘" }
    ],
    summaryText: "本節重點在於理解「質量守恆定律」與化學方程式的計量關係。任何化學反應中，反應物的總質量等於生成物的總質量。透過莫耳概念與化學計量，可進行反應物與生成物之間的質量換算，並能解決相關計算題。此外，純物質與混合物的組成分析、溶液濃度的計算，也是本節常考點。",
    keywords: ["質量守恆定律", "莫耳概念", "化學計量", "濃度計算", "純物質與混合物"],
    mindmap: {
      center: "3-2 化學反應中的質量關係",
      branches: [
        { title: "質量守恆定律", tone: "#7c5cff", leaves: ["定義", "實驗驗證", "意義與應用"] },
        { title: "純物質與混合物", tone: "#f59e0b", leaves: ["純物質定義", "混合物定義", "分離方法"] },
        { title: "化學計量", tone: "#3b82f6", leaves: ["莫耳概念", "莫耳質量", "化學方程式"] },
        { title: "溶液濃度", tone: "#ec4899", leaves: ["重量百分率", "莫耳濃度", "稀釋計算"] },
        { title: "計算應用", tone: "#22b573", leaves: ["質量換算", "百分組成", "產率計算"] },
        { title: "常見考點", tone: "#06b6d4", leaves: ["計算題型", "圖表判讀", "易錯觀念"] }
      ]
    },
    keyPoints: [
      "質量守恆定律：反應前後物質的總質量不變。",
      "莫耳（mol）：物質的量單位，1 莫耳 = 6.02 × 10²³ 個粒子。",
      "莫耳質量：物質的質量 (g) ÷ 莫耳數 (mol)。",
      "化學方程式的計量關係可用於計算質量、莫耳數與體積。",
      "溶液濃度的計算需注意單位與稀釋前後的關係。",
      "純物質具有固定組成，混合物可用物理方法分離。"
    ],
    knowledgeTree: {
      root: "物質的組成與化學反應",
      nodes: [
        { name: "物質的分類", children: ["純物質", "混合物"] },
        { name: "化學反應", children: ["反應式", "反應類型"] },
        { name: "質量關係", children: ["質量守恆定律", "化學計量", "計算應用"] },
        { name: "溶液與濃度", children: ["濃度表示法", "稀釋計算", "應用題型"] }
      ]
    },
    resources: [
      { name: "課程講義：3-2 化學反應中的質量關係.pdf", type: "PDF" },
      { name: "精選例題與解析.pdf", type: "PDF" },
      { name: "課後筆記（老師版）.pptx", type: "PPT" },
      { name: "延伸閱讀：化學計量應用.docx", type: "DOCX" },
      { name: "歷屆試題精選（含解析）.pdf", type: "PDF" }
    ],
    notes: {
      text: "注意稀釋計算時，溶質的莫耳數不變！常考：利用化學計量計算產率。",
      tags: [
        { label: "計算題", tone: "#7c5cff" },
        { label: "濃度", tone: "#ec4899" },
        { label: "莫耳概念", tone: "#22b573" },
        { label: "常考觀念", tone: "#f59e0b" }
      ]
    }
  },

  myLearning: {
    title: "我的學習",
    overview: {
      title: "學習總覽",
      speech: "學習是一場馬拉松，你已經比昨天更進步了！繼續加油吧！",
      stats: [
        { icon: "clock", label: "總學習時間", value: "128.6", unit: "小時", delta: "較上週 +12.4 小時", tone: "ok" },
        { icon: "calendar", label: "累積學習天數", value: "46", unit: "天", delta: "連續學習 12 天", tone: "fire" },
        { icon: "check", label: "完成題數", value: "2,540", unit: "題", delta: "較上週 +320 題", tone: "ok" },
        { icon: "target", label: "正確率", value: "78.6", unit: "%", delta: "較上週 +6.3%", tone: "ok" }
      ]
    },
    record: {
      title: "學習記錄",
      tabs: ["本週", "本月", "今年", "全部"],
      bars: [
        { label: "5/12", sub: "週一", hours: 7.2 },
        { label: "5/13", sub: "週二", hours: 9.6 },
        { label: "5/14", sub: "週三", hours: 8.1 },
        { label: "5/15", sub: "週四", hours: 10.3 },
        { label: "5/16", sub: "週五", hours: 7.8 },
        { label: "5/17", sub: "週六", hours: 6.4 },
        { label: "5/18", sub: "週日", hours: 5.2 }
      ],
      todayFocus: [
        { time: "09:30", subject: "math", unit: "二次函數的圖形與性質", minutes: 45, done: true },
        { time: "11:15", subject: "english", unit: "文法練習：關係代名詞", minutes: 30, done: true },
        { time: "14:00", subject: "physics", unit: "牛頓運動定律總整理", minutes: 60, done: false }
      ]
    },
    weekly: {
      title: "週報告",
      range: "5/12 - 5/18",
      radar: [
        { subject: "math", now: 9.0, last: 7.0 },
        { subject: "english", now: 8.0, last: 7.0 },
        { subject: "physics", now: 7.0, last: 6.0 },
        { subject: "chemistry", now: 6.5, last: 6.0 },
        { subject: "biology", now: 7.5, last: 6.5 },
        { subject: "history", now: 6.0, last: 5.5 },
        { subject: "geography", now: 6.5, last: 6.0 },
        { subject: "chinese", now: 7.0, last: 6.0 }
      ],
      radarMax: 10,
      summary: [
        { label: "本週總時數", value: "54.6", unit: "小時", delta: "較上週 +12.4" },
        { label: "本週完成題數", value: "420", unit: "題", delta: "較上週 +85" },
        { label: "本週正確率", value: "78.6", unit: "%", delta: "較上週 +6.3%" }
      ]
    },
    calendar: {
      title: "學習日曆",
      monthLabel: "2024 年 5 月",
      firstWeekday: 3,
      daysInMonth: 31,
      today: 18,
      levels: {
        1: 1, 2: 2, 3: 1, 6: 2, 7: 3, 8: 1, 9: 2, 10: 2,
        12: 1, 13: 2, 14: 3, 15: 2, 16: 1, 17: 2, 18: 4,
        20: 2, 21: 1, 22: 3, 23: 2, 27: 1, 28: 2, 30: 1, 31: 1
      },
      legend: [
        { label: "0-1 小時", tone: "#c7f0da" },
        { label: "1-2 小時", tone: "#7fd8a8" },
        { label: "2-3 小時", tone: "#3fb877" },
        { label: "3 小時以上", tone: "#1f8f52" },
        { label: "無記錄", tone: "#eceef3" }
      ]
    },
    badges: {
      title: "成就徽章",
      items: [
        { icon: "star", label: "學習新星", desc: "連續學習 7 天", tone: "#f2b705" },
        { icon: "award", label: "勤奮學習者", desc: "學習時數滿 50 小時", tone: "#7c5cff" },
        { icon: "quiz", label: "測驗達人", desc: "完成測驗 100 次", tone: "#3b82f6" },
        { icon: "target", label: "滿分挑戰者", desc: "獲得滿分 10 次", tone: "#ef4444" },
        { icon: "summary", label: "知識探索者", desc: "探索知識點 200 個", tone: "#22b573" }
      ],
      recent: { label: "測驗達人", desc: "完成測驗 100 次", date: "2024/05/17" }
    },
    progress: {
      title: "學習進度",
      items: [
        { subject: "math", percent: 80, status: "進度超前" },
        { subject: "english", percent: 65, status: "持續進步" },
        { subject: "physics", percent: 70, status: "良好" },
        { subject: "chemistry", percent: 60, status: "加強練習" },
        { subject: "biology", percent: 75, status: "良好" },
        { subject: "history", percent: 55, status: "加強複習" },
        { subject: "geography", percent: 68, status: "持續進步" },
        { subject: "chinese", percent: 72, status: "良好" }
      ]
    }
  },

  aiTutorPage: {
    title: "巧巧老師 AI Tutor",
    tagline: "有問題儘管問我，我會陪你一起思考、一起進步！",
    badge: "AI 助教 · 24 小時在線",
    messages: [
      { role: "user", time: "10:30",
        text: "老師，請問二次函數 f(x) = x² − 4x + 3 的圖形與 x 軸的交點是？" },
      { role: "assistant", time: "10:30",
        text: "我們可以把二次函數因式分解，找出與 x 軸的交點（即 y = 0 時的 x 值）。\nf(x) = x² − 4x + 3 = (x − 1)(x − 3)\n令 f(x) = 0：(x − 1)(x − 3) = 0 ⇒ x = 1 或 x = 3\n所以圖形與 x 軸的交點為 (1, 0) 與 (3, 0)。" },
      { role: "user", time: "10:31", text: "可以畫圖讓我看嗎？" }
    ],
    suggestions: [
      { icon: "summary", label: "解題步驟詳解", desc: "請詳細解題" },
      { icon: "chat", label: "概念解釋", desc: "用簡單的方式說明" },
      { icon: "quiz", label: "類題練習", desc: "出類似的題目練習" },
      { icon: "bookmark", label: "重點整理", desc: "整理成重點筆記" },
      { icon: "target", label: "考卷解析", desc: "解析考卷題目" },
      { icon: "refresh", label: "換個主題", desc: "聊聊別的內容" }
    ],
    cannedReplies: [
      "好的！這是一個很好的問題，我們一步一步來看。首先確認題目的已知條件，再選擇適合的公式或方法。",
      "沒問題～我先幫你把關鍵概念拆解成幾個小步驟，這樣會更容易理解喔！",
      "很棒的思考方向！讓我用一個簡單的例子帶你一起推導看看。"
    ],
    history: [
      { title: "二次函數圖形與交點", sub: "老師，請問二次函數 f(x) = x² − 4x + 3 …", time: "10:31" },
      { title: "化學反應速率", sub: "請問影響化學反應速率的因素有哪些？", time: "昨天" },
      { title: "牛頓運動定律", sub: "作用力與反作用力的關係是？", time: "昨天" },
      { title: "英文時態整理", sub: "過去完成式怎麼用？", time: "2 天前" },
      { title: "光合作用過程", sub: "請解釋光反應與暗反應的差別", time: "3 天前" }
    ],
    resources: [
      { name: "高中數學公式手冊", type: "PDF" },
      { name: "化學元素週期表", type: "PDF" },
      { name: "物理重點整理筆記", type: "DOCX" },
      { name: "英文單字大全", type: "PDF" },
      { name: "生物圖解總整理", type: "PPT" }
    ]
  },

  dashboard: {
    title: "學習儀表板",
    subtitle: "掌握學習狀況，讓進步看得見！",
    stats: [
      { icon: "clock", label: "總學習時間", value: "128.6", unit: "小時", delta: "較上週 +12.4 小時", tone: "#7c5cff" },
      { icon: "check", label: "完成題數", value: "2,540", unit: "題", delta: "較上週 +320 題", tone: "#3b82f6" },
      { icon: "target", label: "正確率", value: "78.6", unit: "%", delta: "較上週 +6.3%", tone: "#22b573" },
      { icon: "star", label: "連續學習天數", value: "46", unit: "天", delta: "累計最佳 46 天", tone: "#f59e0b" },
      { icon: "award", label: "總積分", value: "14,080", unit: "分", delta: "較上週 +256 分", tone: "#7c5cff" }
    ],
    trend: {
      range: "近 7 天",
      hoursMax: 30,
      days: [
        { label: "5/12 一", hours: 14.2, acc: 72 },
        { label: "5/13 二", hours: 16.8, acc: 74 },
        { label: "5/14 三", hours: 18.6, acc: 77 },
        { label: "5/15", hours: 15.3, acc: 75 },
        { label: "5/16", hours: 17.9, acc: 78 },
        { label: "5/17 六", hours: 20.4, acc: 80 },
        { label: "5/18 日", hours: 25.4, acc: 82 }
      ]
    },
    timeDist: {
      total: "128.6", unit: "小時",
      items: [
        { subject: "math", label: "數學", percent: 28 },
        { subject: "english", label: "英文", percent: 20 },
        { subject: "physics", label: "物理", percent: 15 },
        { subject: "chemistry", label: "化學", percent: 13 },
        { subject: "biology", label: "生物", percent: 11 },
        { subject: "other", label: "其他", percent: 13 }
      ]
    },
    progress: {
      overall: 68,
      items: [
        { subject: "math", percent: 75 },
        { subject: "english", percent: 65 },
        { subject: "physics", percent: 60 },
        { subject: "chemistry", percent: 70 },
        { subject: "biology", percent: 55 },
        { subject: "history", percent: 60 },
        { subject: "geography", percent: 65 }
      ]
    },
    knowledge: [
      { name: "指數與對數", percent: 92 },
      { name: "二次函數", percent: 88 },
      { name: "力與運動", percent: 85 },
      { name: "化學計量", percent: 82 },
      { name: "細胞構造", percent: 78 },
      { name: "英文閱讀理解", percent: 75 },
      { name: "電學基礎", percent: 72 },
      { name: "酸鹼反應", percent: 70 },
      { name: "光合作用", percent: 68 },
      { name: "世界大戰", percent: 65 }
    ],
    todayTasks: {
      goalText: "完成 5 個任務可獲得 120 積分",
      goalDone: 3, goalTotal: 5,
      items: [
        { unit: "完成數學練習：指數與對數", points: 30, done: true },
        { unit: "閱讀英文長篇文章", points: 20, done: true },
        { unit: "觀看物理教學影片", points: 20, done: false },
        { unit: "完成化學章節測驗", points: 30, done: false },
        { unit: "整理生物重點筆記", points: 20, done: false }
      ]
    },
    subjectStatus: [
      { subject: "math", percent: 75 },
      { subject: "english", percent: 65 },
      { subject: "physics", percent: 60 },
      { subject: "chemistry", percent: 70 },
      { subject: "biology", percent: 55 },
      { subject: "history", percent: 60 },
      { subject: "geography", percent: 65 },
      { subject: "chinese", percent: 70 }
    ],
    aiTips: {
      intro: "根據你的學習狀況，巧巧建議你：",
      tips: [
        "加強「二次函數」的練習，正確率可提升至 85% 以上",
        "增加「英文閱讀」時間，每天 20 分鐘效果更佳",
        "本週可挑戰「化學計量」進階題型，提升應試能力"
      ]
    }
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
  },

  /* Sprint 1 · HOME-F006: 今日學習時間 (Learning Time). */
  learning: {
    todayMinutes: 85
  },

  /* Material Center Sprint 3 · MAT-F005: 繼續閱讀 (Continue Reading). */
  lastReading: {
    materialId: 1
  }
};
