/* js/app-wrongbook.js — bootstraps 錯題本 inside the shared AppShell.

   ============================================================================
   TEMPORARY — Sprint 4 · W004B Developer Seed Wrong Questions
   ----------------------------------------------------------------------------
   Purpose: populate AHS.WrongBookRuntime with 16 realistic wrong-question
   records (2 per subject × 8 subjects) so the Wrong Book module — Summary,
   List, Detail, Search, Filter, Sort, Favorite, Empty State — can be tested
   independently of a real Quiz session.

   This block calls ONLY the Runtime's existing public API (sync(),
   toggleBookmark()) — the same API AutoGrader.grade() already uses in real
   usage. WrongBookRuntime itself is untouched; no fields, no new API.

   Guarded by isEmpty(): if a real Quiz session has already populated the
   Runtime (or once Quiz → WrongBookRuntime integration ships), this seed is
   a no-op and does nothing.

   REMOVE THIS BLOCK once Quiz → WrongBookRuntime integration is complete
   (per PMO Work Order W004B — "temporary testing data").
   ============================================================================ */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  var DEV_SEED_WRONG_QUESTIONS = [
    {
      subject: "chinese", title: "文言文閱讀理解", chapter: "高一國文｜第三課 岳陽樓記",
      questionId: "wb_seed_cn_01", knowledgePoint: "文言文虛詞判讀",
      text: "「而或長煙一空，皓月千里」中的「或」字意思最接近？",
      options: [{ key: "A", text: "有時" }, { key: "B", text: "或者" }, { key: "C", text: "如果" }, { key: "D", text: "也許" }],
      correctAnswer: "A", yourAnswer: "C",
      explanation: "此處「或」為文言虛詞，作「有時」解，表示偶發的情況。"
    },
    {
      subject: "chinese", title: "現代詩鑑賞", chapter: "高一國文｜第五課 現代詩選",
      questionId: "wb_seed_cn_02", knowledgePoint: "意象與修辭",
      text: "詩句「星星是夜空的眼睛」使用了哪種修辭手法？",
      options: [{ key: "A", text: "誇飾" }, { key: "B", text: "擬人" }, { key: "C", text: "排比" }, { key: "D", text: "借代" }],
      correctAnswer: "B", yourAnswer: "A",
      explanation: "將星星賦予人的器官「眼睛」，屬於擬人修辭法。"
    },
    {
      subject: "english", title: "關係代名詞練習", chapter: "高一英文｜Unit 4 Relative Clauses",
      questionId: "wb_seed_en_01", knowledgePoint: "關係代名詞 which/who",
      text: "The book ___ I borrowed is great.",
      options: [{ key: "A", text: "who" }, { key: "B", text: "which" }, { key: "C", text: "whom" }, { key: "D", text: "whose" }],
      correctAnswer: "B", yourAnswer: "A",
      explanation: "先行詞 the book 為事物，關係代名詞應使用 which。"
    },
    {
      subject: "english", title: "動詞時態測驗", chapter: "高一英文｜Unit 6 Verb Tenses",
      questionId: "wb_seed_en_02", knowledgePoint: "過去完成式",
      text: "By the time she arrived, the meeting ___.",
      options: [{ key: "A", text: "already started" }, { key: "B", text: "has already started" }, { key: "C", text: "had already started" }, { key: "D", text: "was starting" }],
      correctAnswer: "C", yourAnswer: "B",
      explanation: "動作發生在過去某時間點之前，需使用過去完成式 had + p.p.。"
    },
    {
      subject: "math", title: "二次函數應用", chapter: "高一數學｜第二章 二次函數",
      questionId: "wb_seed_ma_01", knowledgePoint: "頂點座標公式",
      text: "f(x) = x² − 6x + 5 的頂點座標為？",
      options: [{ key: "A", text: "(3, -4)" }, { key: "B", text: "(-3, 4)" }, { key: "C", text: "(3, 4)" }, { key: "D", text: "(-3, -4)" }],
      correctAnswer: "A", yourAnswer: "B",
      explanation: "配方後 f(x) = (x-3)² - 4，頂點座標為 (3, -4)。"
    },
    {
      subject: "math", title: "數列與級數", chapter: "高一數學｜第四章 數列",
      questionId: "wb_seed_ma_02", knowledgePoint: "等差數列公式",
      text: "首項 3、公差 4 的等差數列，第 10 項為？",
      options: [{ key: "A", text: "39" }, { key: "B", text: "36" }, { key: "C", text: "40" }, { key: "D", text: "43" }],
      correctAnswer: "A", yourAnswer: "C",
      explanation: "an = a1 + (n-1)d = 3 + 9×4 = 39。"
    },
    {
      subject: "history", title: "台灣史重要事件", chapter: "高一歷史｜第三章 日治時期",
      questionId: "wb_seed_hi_01", knowledgePoint: "殖民統治政策",
      text: "日治時期的「皇民化運動」主要目的為？",
      options: [{ key: "A", text: "推動工業化" }, { key: "B", text: "同化台灣人" }, { key: "C", text: "發展農業" }, { key: "D", text: "興建鐵路" }],
      correctAnswer: "B", yourAnswer: "A",
      explanation: "皇民化運動旨在使台灣人在語言、信仰、生活習慣上同化為日本人。"
    },
    {
      subject: "history", title: "世界史近代化", chapter: "高一歷史｜第五章 工業革命",
      questionId: "wb_seed_hi_02", knowledgePoint: "工業革命影響",
      text: "工業革命首先發生於哪個國家？",
      options: [{ key: "A", text: "法國" }, { key: "B", text: "德國" }, { key: "C", text: "英國" }, { key: "D", text: "美國" }],
      correctAnswer: "C", yourAnswer: "A",
      explanation: "工業革命於18世紀中葉率先發生於英國，後擴及歐美各國。"
    },
    {
      subject: "geography", title: "氣候類型判讀", chapter: "高一地理｜第二章 氣候",
      questionId: "wb_seed_ge_01", knowledgePoint: "季風氣候特徵",
      text: "台灣的氣候類型主要屬於？",
      options: [{ key: "A", text: "地中海型氣候" }, { key: "B", text: "溫帶大陸性氣候" }, { key: "C", text: "亞熱帶季風氣候" }, { key: "D", text: "極地氣候" }],
      correctAnswer: "C", yourAnswer: "A",
      explanation: "台灣位於北回歸線附近，屬於亞熱帶季風氣候。"
    },
    {
      subject: "geography", title: "地形與地貌", chapter: "高一地理｜第四章 地形",
      questionId: "wb_seed_ge_02", knowledgePoint: "板塊運動",
      text: "台灣島的形成主要與下列何者有關？",
      options: [{ key: "A", text: "火山噴發" }, { key: "B", text: "板塊擠壓造山" }, { key: "C", text: "河川侵蝕" }, { key: "D", text: "風力堆積" }],
      correctAnswer: "B", yourAnswer: "C",
      explanation: "台灣島是菲律賓海板塊與歐亞板塊擠壓造山運動所形成。"
    },
    {
      subject: "civics", title: "憲法與人權", chapter: "高一公民｜第一章 憲法基本原則",
      questionId: "wb_seed_ci_01", knowledgePoint: "基本人權保障",
      text: "下列何者屬於憲法保障的「自由權」？",
      options: [{ key: "A", text: "選舉權" }, { key: "B", text: "言論自由" }, { key: "C", text: "應考試權" }, { key: "D", text: "請願權" }],
      correctAnswer: "B", yourAnswer: "D",
      explanation: "言論自由屬於憲法保障的自由權；選舉權與應考試權屬於參政權。"
    },
    {
      subject: "civics", title: "政府體制認識", chapter: "高一公民｜第三章 政府與治理",
      questionId: "wb_seed_ci_02", knowledgePoint: "權力分立原則",
      text: "我國中央政府體制採行下列何種制度？",
      options: [{ key: "A", text: "內閣制" }, { key: "B", text: "總統制" }, { key: "C", text: "五權分立制" }, { key: "D", text: "君主立憲制" }],
      correctAnswer: "C", yourAnswer: "B",
      explanation: "我國中央政府體制依孫中山五權憲法理論，採五權分立制。"
    },
    {
      subject: "biology", title: "細胞分裂機制", chapter: "高一生物｜第三章 細胞分裂",
      questionId: "wb_seed_bi_01", knowledgePoint: "有絲分裂階段",
      text: "染色體排列在細胞中央赤道板上，是有絲分裂的哪個階段？",
      options: [{ key: "A", text: "前期" }, { key: "B", text: "中期" }, { key: "C", text: "後期" }, { key: "D", text: "末期" }],
      correctAnswer: "B", yourAnswer: "A",
      explanation: "中期時染色體整齊排列於細胞中央的赤道板上。"
    },
    {
      subject: "biology", title: "遺傳學基礎", chapter: "高一生物｜第五章 遺傳",
      questionId: "wb_seed_bi_02", knowledgePoint: "孟德爾定律",
      text: "豌豆的圓形（R）對皺縮（r）為顯性，Rr × Rr 後代圓形比例約為？",
      options: [{ key: "A", text: "25%" }, { key: "B", text: "50%" }, { key: "C", text: "75%" }, { key: "D", text: "100%" }],
      correctAnswer: "C", yourAnswer: "B",
      explanation: "Rr × Rr 後代基因型比例為 1RR : 2Rr : 1rr，表現圓形（RR、Rr）佔 3/4。"
    },
    {
      subject: "chemistry", title: "化學鍵結類型", chapter: "高一化學｜第二章 化學鍵",
      questionId: "wb_seed_ch_01", knowledgePoint: "離子鍵與共價鍵",
      text: "NaCl 中鈉與氯之間的鍵結屬於？",
      options: [{ key: "A", text: "共價鍵" }, { key: "B", text: "離子鍵" }, { key: "C", text: "金屬鍵" }, { key: "D", text: "氫鍵" }],
      correctAnswer: "B", yourAnswer: "A",
      explanation: "鈉為金屬易失去電子，氯為非金屬易獲得電子，形成離子鍵。"
    },
    {
      subject: "chemistry", title: "酸鹼反應", chapter: "高一化學｜第四章 酸鹼",
      questionId: "wb_seed_ch_02", knowledgePoint: "pH值計算",
      text: "pH = 3 的溶液，氫離子濃度為多少 mol/L？",
      options: [{ key: "A", text: "1×10⁻³" }, { key: "B", text: "1×10³" }, { key: "C", text: "3×10⁻¹" }, { key: "D", text: "1×10⁻¹¹" }],
      correctAnswer: "A", yourAnswer: "D",
      explanation: "pH = -log[H+]，故 [H+] = 10^(-pH) = 1×10⁻³ mol/L。"
    }
  ];

  /* Two questions are synced a second time to give them a realistic
     errorCount > 1 (for testing Sort by 錯誤次數), and a few are
     pre-bookmarked (for testing Favorite Filter / Sort by 我的收藏) —
     all via the existing sync() / toggleBookmark() Runtime API only. */
  var REPEAT_MISS_QUESTION_IDS = ["wb_seed_ma_01", "wb_seed_bi_02"];
  var PRE_BOOKMARKED_QUESTION_IDS = ["wb_seed_en_01", "wb_seed_hi_02", "wb_seed_ch_01"];

  function seedDeveloperWrongQuestions() {
    if (!AHS.WrongBookRuntime || !AHS.WrongBookRuntime.isEmpty()) { return; }

    DEV_SEED_WRONG_QUESTIONS.forEach(function (q) {
      AHS.WrongBookRuntime.sync({
        subject: q.subject, title: q.title, chapter: q.chapter,
        wrong: [{
          questionId: q.questionId, knowledgePoint: q.knowledgePoint,
          text: q.text, options: q.options,
          yourAnswer: q.yourAnswer, correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }]
      });
    });

    REPEAT_MISS_QUESTION_IDS.forEach(function (questionId) {
      var q = DEV_SEED_WRONG_QUESTIONS.filter(function (x) { return x.questionId === questionId; })[0];
      if (!q) { return; }
      AHS.WrongBookRuntime.sync({
        subject: q.subject, title: q.title, chapter: q.chapter,
        wrong: [{
          questionId: q.questionId, knowledgePoint: q.knowledgePoint,
          text: q.text, options: q.options,
          yourAnswer: q.yourAnswer, correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }]
      });
    });

    var all = AHS.WrongBookRuntime.list();
    PRE_BOOKMARKED_QUESTION_IDS.forEach(function (questionId) {
      var record = all.filter(function (r) { return r.questionId === questionId; })[0];
      if (record) { AHS.WrongBookRuntime.toggleBookmark(record.id); }
    });
  }
  /* ======================== END TEMPORARY W004B BLOCK ==================== */

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    seedDeveloperWrongQuestions();

    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "wrongbook",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });

    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.WrongBook.create());
  }

  function coreReady() {
    return !!(window.AHS && AHS.UI && typeof AHS.UI.el === "function" &&
              AHS.AppShell && typeof AHS.AppShell.create === "function");
  }

  /* EO-S7.0-HOTFIX-001 · Initialization Order gate: Browser -> window.AHS
     -> Core Runtime -> AppShell -> Page Runtime -> Component -> Render.
     Components are never created before AppShell's dependencies exist.
     On core-load failure (e.g. a 404'd script), show a diagnostic
     instead of a white page. */
  function guardedInit() {
    if (coreReady()) { init(); return; }
    var app = document.getElementById("app");
    if (app) {
      app.textContent = "系統資源載入失敗（js/core/UI.js 或 AppShell 未載入）。請重新整理；若持續發生，請回報 PMO 檢查部署檔案。";
    }
    if (window.console && console.warn) {
      console.warn("AHS core not ready — component mount aborted (EO-S7.0-HOTFIX-001 gate).");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guardedInit);
  } else {
    guardedInit();
  }
})();
