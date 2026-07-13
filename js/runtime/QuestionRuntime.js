/* js/runtime/QuestionRuntime.js — Quiz Center Runtime (WO-Q001).
   Follows the MaterialRuntime pattern (LOCKED):
     window.AHS → Runtime → Render → UI
   This module is the Question-domain Runtime Memory — a plain in-memory
   store under the existing window.AHS namespace. No localStorage / fetch
   / backend. Memory only: resets on reload (expected Prototype behavior).

   Unlike MaterialRuntime (which starts EMPTY), QuestionRuntime starts
   PRE-SEEDED per WO-Q001 spec: ~20 fixed Seed Questions across 8 subjects
   (國文/英文/數學/生物/化學/地理/歷史/公民), so Question Bank UI (Q002+)
   has data to render from day one. reset() restores this Seed Data.

   Scope (WO-Q001 LOCKED): Question Runtime only. Does NOT implement
   Question Bank UI, Exam Runtime, Exam UI, Auto Grading, Wrong Book,
   Review, History, or Statistics — those are later Work Orders.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionRuntime = (function () {
  "use strict";

  /* ---- Seed Data (20 fixed questions, 8 subjects, ≥2 per subject) ---- */
  var SEED = [
    {
      id: "q_1", subject: "chinese", grade: "高一", chapter: "詩經",
      difficulty: "易", type: "single",
      question: "《詩經》依內容性質可分為哪三個部分？",
      options: ["風、雅、頌", "賦、比、興", "楚辭、漢賦、樂府", "古詩、律詩、絕句"],
      answer: 0, explanation: "《詩經》依內容分為風、雅、頌三部分。",
      tags: ["詩經", "國學常識"], favorite: false
    },
    {
      id: "q_2", subject: "chinese", grade: "高一", chapter: "文言文閱讀",
      difficulty: "中等", type: "single",
      question: "「不以物喜，不以己悲」出自哪篇文章？",
      options: ["岳陽樓記", "出師表", "桃花源記", "蘭亭集序"],
      answer: 0, explanation: "此句出自范仲淹〈岳陽樓記〉。",
      tags: ["文言文", "范仲淹"], favorite: false
    },
    {
      id: "q_3", subject: "chinese", grade: "高二", chapter: "現代文學",
      difficulty: "難", type: "multiple",
      question: "下列哪些作家屬於臺灣鄉土文學代表？",
      options: ["黃春明", "朱天心", "賴和", "三毛"],
      answer: [0, 2], explanation: "黃春明與賴和皆為臺灣鄉土文學代表作家。",
      tags: ["臺灣文學", "鄉土文學"], favorite: false
    },
    {
      id: "q_4", subject: "english", grade: "高一", chapter: "Grammar: Tenses",
      difficulty: "易", type: "single",
      question: "Choose the correct form: She ___ to school every day.",
      options: ["go", "goes", "going", "gone"],
      answer: 1, explanation: "主詞為第三人稱單數，動詞需加 s，故答案為 goes。",
      tags: ["grammar", "tense"], favorite: false
    },
    {
      id: "q_5", subject: "english", grade: "高一", chapter: "Vocabulary",
      difficulty: "中等", type: "single",
      question: "Which word means \"to make something better\"?",
      options: ["deteriorate", "improve", "damage", "ignore"],
      answer: 1, explanation: "improve 意為使變得更好。",
      tags: ["vocabulary"], favorite: false
    },
    {
      id: "q_6", subject: "english", grade: "高二", chapter: "Reading Comprehension",
      difficulty: "難", type: "single",
      question: "In the passage, the author's tone can best be described as:",
      options: ["sarcastic", "neutral", "enthusiastic", "apologetic"],
      answer: 2, explanation: "根據文章語氣線索，作者態度為熱切（enthusiastic）。",
      tags: ["reading", "tone"], favorite: false
    },
    {
      id: "q_7", subject: "math", grade: "高一", chapter: "一元二次方程式",
      difficulty: "易", type: "single",
      question: "方程式 x² − 5x + 6 = 0 的解為？",
      options: ["x=2,3", "x=1,6", "x=-2,-3", "x=2,-3"],
      answer: 0, explanation: "分解為 (x-2)(x-3)=0，得 x=2 或 3。",
      tags: ["二次方程式"], favorite: false
    },
    {
      id: "q_8", subject: "math", grade: "高二", chapter: "三角函數",
      difficulty: "中等", type: "single",
      question: "sin(30°) 的值為？",
      options: ["1/2", "√2/2", "√3/2", "1"],
      answer: 0, explanation: "sin(30°) = 1/2 為基本三角函數值。",
      tags: ["三角函數", "特殊角"], favorite: false
    },
    {
      id: "q_9", subject: "math", grade: "高三", chapter: "微積分基礎",
      difficulty: "難", type: "single",
      question: "函數 f(x) = x³ 的導函數為？",
      options: ["3x²", "x²", "3x", "x³/3"],
      answer: 0, explanation: "依冪次法則，d/dx(x³) = 3x²。",
      tags: ["微積分", "導數"], favorite: false
    },
    {
      id: "q_10", subject: "biology", grade: "高一", chapter: "細胞結構",
      difficulty: "易", type: "single",
      question: "細胞中負責能量產生的胞器稱為？",
      options: ["核糖體", "粒線體", "高基氏體", "內質網"],
      answer: 1, explanation: "粒線體是細胞進行呼吸作用產生 ATP 的胞器。",
      tags: ["細胞", "胞器"], favorite: false
    },
    {
      id: "q_11", subject: "biology", grade: "高二", chapter: "遺傳學",
      difficulty: "中等", type: "single",
      question: "孟德爾豌豆實驗中，單性狀雜交 F2 代顯性對隱性的表現型比例為？",
      options: ["1:1", "3:1", "1:2:1", "9:3:3:1"],
      answer: 1, explanation: "單性狀雜交 F2 代顯隱性表現型比例為 3:1。",
      tags: ["遺傳學", "孟德爾"], favorite: false
    },
    {
      id: "q_12", subject: "chemistry", grade: "高一", chapter: "物質三態",
      difficulty: "易", type: "single",
      question: "水從液態變成氣態的過程稱為？",
      options: ["凝固", "昇華", "蒸發", "凝結"],
      answer: 2, explanation: "液態變氣態的過程稱為蒸發（汽化）。",
      tags: ["物質變化"], favorite: false
    },
    {
      id: "q_13", subject: "chemistry", grade: "高二", chapter: "酸鹼反應",
      difficulty: "中等", type: "single",
      question: "pH 值小於 7 表示溶液呈現？",
      options: ["中性", "酸性", "鹼性", "無法判斷"],
      answer: 1, explanation: "pH < 7 表示溶液呈酸性。",
      tags: ["酸鹼", "pH值"], favorite: false
    },
    {
      id: "q_14", subject: "chemistry", grade: "高三", chapter: "氧化還原反應",
      difficulty: "難", type: "multiple",
      question: "下列哪些反應屬於氧化還原反應？",
      options: ["金屬生鏽", "酸鹼中和", "電池放電", "蒸發結晶"],
      answer: [0, 2], explanation: "金屬生鏽與電池放電皆涉及電子轉移，屬於氧化還原反應。",
      tags: ["氧化還原"], favorite: false
    },
    {
      id: "q_15", subject: "geography", grade: "高一", chapter: "地形",
      difficulty: "易", type: "single",
      question: "臺灣最高峰為？",
      options: ["玉山", "雪山", "合歡山", "阿里山"],
      answer: 0, explanation: "玉山為臺灣最高峰，海拔約3952公尺。",
      tags: ["臺灣地理", "地形"], favorite: false
    },
    {
      id: "q_16", subject: "geography", grade: "高二", chapter: "氣候類型",
      difficulty: "中等", type: "single",
      question: "臺灣北部冬季主要受何種季風影響而多雨？",
      options: ["東北季風", "西南季風", "焚風", "颱風"],
      answer: 0, explanation: "冬季臺灣受東北季風影響，北部迎風面多雨。",
      tags: ["氣候", "季風"], favorite: false
    },
    {
      id: "q_17", subject: "history", grade: "高一", chapter: "臺灣史",
      difficulty: "易", type: "single",
      question: "臺灣進入荷蘭統治時期是在哪個世紀？",
      options: ["16世紀", "17世紀", "18世紀", "19世紀"],
      answer: 1, explanation: "荷蘭自17世紀（1624年起）統治臺灣南部。",
      tags: ["臺灣史", "荷治時期"], favorite: false
    },
    {
      id: "q_18", subject: "history", grade: "高二", chapter: "世界史",
      difficulty: "中等", type: "single",
      question: "文藝復興運動最早發源於？",
      options: ["法國", "英國", "義大利", "德國"],
      answer: 2, explanation: "文藝復興發源於義大利，以佛羅倫斯為中心。",
      tags: ["世界史", "文藝復興"], favorite: false
    },
    {
      id: "q_19", subject: "civics", grade: "高一", chapter: "憲法與人權",
      difficulty: "易", type: "single",
      question: "下列何者不屬於憲法保障的基本人權範疇？",
      options: ["言論自由", "財產權", "選舉權", "無限制的財產累積"],
      answer: 3, explanation: "憲法保障基本人權，但財產權之行使仍受法律限制，非無限制累積。",
      tags: ["憲法", "人權"], favorite: false
    },
    {
      id: "q_20", subject: "civics", grade: "高二", chapter: "政府體制",
      difficulty: "中等", type: "single",
      question: "我國中央政府體制屬於？",
      options: ["內閣制", "總統制", "委員制", "半總統制"],
      answer: 3, explanation: "我國中央政府體制屬於半總統制（雙首長制）。",
      tags: ["政府體制"], favorite: false
    }
  ];

  var DIFF_ORDER = { "易": 1, "中等": 2, "難": 3 };

  var store = {
    questions: [],
    seq: 0
  };

  /* clone(obj) — deep clone via JSON round-trip. Seed/records here are
     plain JSON-shaped data (no Date objects, no File refs), so this is
     safe and matches spec: list()/get() "必須回傳 Deep Clone". */
  function clone(obj) {
    return obj == null ? obj : JSON.parse(JSON.stringify(obj));
  }

  function buildSeed() {
    return SEED.map(function (q) {
      var now = new Date().toISOString();
      var record = clone(q);
      record.createdAt = now;
      record.updatedAt = now;
      return record;
    });
  }

  /* init() — (re)populate the store from Seed Data. Idempotent: safe to
     call on page load; also the basis for reset(). */
  function init() {
    store.questions = buildSeed();
    store.seq = store.questions.length;
    return true;
  }

  function findById(id) {
    for (var i = 0; i < store.questions.length; i++) {
      if (store.questions[i].id === id) { return store.questions[i]; }
    }
    return null;
  }

  function list() {
    return clone(store.questions);
  }

  function get(id) {
    var q = findById(id);
    return q ? clone(q) : null;
  }

  /* create(question) — appends a new question. id is runtime-generated
     (q_<seq>), createdAt/updatedAt stamped now. Returns a Deep Clone of
     the created record. */
  function create(question) {
    question = question || {};
    store.seq += 1;
    var now = new Date().toISOString();
    var record = {
      id: "q_" + store.seq,
      subject: question.subject || "",
      grade: question.grade || "高一",
      chapter: question.chapter || "",
      difficulty: question.difficulty || "中等",
      type: question.type || "single",
      question: question.question || "",
      options: question.options ? clone(question.options) : [],
      answer: question.answer != null ? clone(question.answer) : null,
      explanation: question.explanation || "",
      tags: question.tags ? clone(question.tags) : [],
      favorite: !!question.favorite,
      createdAt: now,
      updatedAt: now
    };
    store.questions.push(record);
    return clone(record);
  }

  /* update(question) — question.id required; only recognized fields are
     applied. updatedAt is refreshed; createdAt/id are immutable. Returns
     a Deep Clone of the updated record, or null if id not found. */
  function update(question) {
    if (!question || !question.id) { return null; }
    var record = findById(question.id);
    if (!record) { return null; }
    var fields = [
      "subject", "grade", "chapter", "difficulty", "type",
      "question", "options", "answer", "explanation", "tags", "favorite"
    ];
    fields.forEach(function (f) {
      if (Object.prototype.hasOwnProperty.call(question, f)) {
        var v = question[f];
        record[f] = (f === "options" || f === "tags" || f === "answer") ? clone(v) : v;
      }
    });
    record.updatedAt = new Date().toISOString();
    return clone(record);
  }

  /* remove(id) — returns true if a question was removed, false if id
     was not found. */
  function remove(id) {
    var next = [];
    var removed = false;
    for (var i = 0; i < store.questions.length; i++) {
      if (store.questions[i].id === id) { removed = true; }
      else { next.push(store.questions[i]); }
    }
    store.questions = next;
    return removed;
  }

  /* search(keyword) — matches question / chapter / tags (case-insensitive
     substring match). Empty keyword returns the full list. */
  function search(keyword) {
    var k = String(keyword == null ? "" : keyword).trim().toLowerCase();
    if (!k) { return list(); }
    var out = store.questions.filter(function (q) {
      if (q.question && String(q.question).toLowerCase().indexOf(k) !== -1) { return true; }
      if (q.chapter && String(q.chapter).toLowerCase().indexOf(k) !== -1) { return true; }
      if (q.tags && q.tags.some(function (t) { return String(t).toLowerCase().indexOf(k) !== -1; })) { return true; }
      return false;
    });
    return clone(out);
  }

  /* filter(options) — options: { subject, grade, difficulty, type }.
     Unset / "all" fields are ignored (no filtering on that dimension). */
  function filter(options) {
    options = options || {};
    var out = store.questions.filter(function (q) {
      if (options.subject && options.subject !== "all" && q.subject !== options.subject) { return false; }
      if (options.grade && options.grade !== "all" && q.grade !== options.grade) { return false; }
      if (options.difficulty && options.difficulty !== "all" && q.difficulty !== options.difficulty) { return false; }
      if (options.type && options.type !== "all" && q.type !== options.type) { return false; }
      return true;
    });
    return clone(out);
  }

  /* sort(type) — "newest" (default) | "oldest" | "subject" | "difficulty".
     Sorts a Deep Clone snapshot of the current store; never mutates
     store order. */
  function sort(type) {
    var arr = list();
    switch (type) {
      case "oldest":
        arr.sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
        break;
      case "subject":
        arr.sort(function (a, b) { return String(a.subject).localeCompare(String(b.subject)); });
        break;
      case "difficulty":
        arr.sort(function (a, b) {
          return (DIFF_ORDER[a.difficulty] || 0) - (DIFF_ORDER[b.difficulty] || 0);
        });
        break;
      case "newest":
      default:
        arr.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    }
    return arr;
  }

  /* reset() — restores the store back to the fixed Seed Data. */
  function reset() {
    return init();
  }

  return {
    init: init,
    list: list,
    get: get,
    create: create,
    update: update,
    remove: remove,
    search: search,
    filter: filter,
    sort: sort,
    reset: reset
  };
})();
