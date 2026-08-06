/* tests/regression/AnalyticsRegression.js — Sprint AI-117 Learning
   Analytics Engine. Real, end-to-end regression for every new
   AHS.StatisticsRuntime Analytics function this Sprint added
   (materialCompletion/subjectAnalytics/materialAnalytics/
   knowledgeAnalytics/learningTrend/wrongBookAnalytics/materialContext),
   the Platform Tutor Engine's Analytics-only read path (AI-117-07), the
   Assessment Mode question-source split (AI-117-08), and Random Exam
   Session display-order shuffling (AI-117-09) — none of which
   tests/jsdom/BehaviorSuite.js or the other regression suites already
   cover end-to-end.

   Run: node tests/regression/AnalyticsRegression.js */
"use strict";
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

/* Sprint AI-119 (Platform Core Baseline): AHS.PersistenceAdapter now
   namespaces every save()/load()/remove() under the active Workspace's
   storage namespace, and AHS.AppShell.create() redirects to login.html
   (rendering nothing) unless a Workspace is active. This suite predates
   Login/Workspace entirely and isn't about testing either — rather than
   rewrite every individual seedSession literal in this file, loadPage()
   auto-establishes ONE fixed default test Workspace (unless the caller
   passes skipLogin) and transparently namespaces each bare "ahs:<key>"
   seed entry to match — idempotent (an already-namespaced entry, e.g.
   from carry(), passes through unchanged). */
const AHS_TEST_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };
const AHS_TEST_NS = "student_a__cjsh__g1s2";
function namespacedKey(k) {
  if (k === "ahs:workspace") { return k; }
  const nsPrefix = "ahs:" + AHS_TEST_NS + ":";
  if (k.indexOf(nsPrefix) === 0) { return k; }
  if (k.indexOf("ahs:") === 0) { return "ahs:" + AHS_TEST_NS + ":" + k.slice(4); }
  return k;
}

function loadPage(htmlFile, { seedSession, url, skipLogin, excludeScripts } = {}) {
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const vconsole = new (require("jsdom").VirtualConsole)();
  const consoleErrors = [];
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    const s = String((e && e.message) || e);
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) { return; }
    consoleErrors.push(s);
  });
  const dom = new JSDOM(html, {
    url: "https://ahs.test/" + (url || htmlFile),
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vconsole
  });
  const { window } = dom;
  if (!skipLogin) {
    window.sessionStorage.setItem("ahs:workspace", JSON.stringify(AHS_TEST_WORKSPACE));
  }
  if (seedSession) {
    Object.entries(seedSession).forEach(([k, v]) => window.sessionStorage.setItem(skipLogin ? k : namespacedKey(k), JSON.stringify(v)));
  }
  const scripts = [...dom.window.document.querySelectorAll("script[src]")]
    .map((s) => s.getAttribute("src"))
    .filter((src) => !(excludeScripts && excludeScripts.some((x) => src.includes(x))));
  scripts.forEach((src) => window.eval(fs.readFileSync(path.join(REPO, src), "utf8")));
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

console.log("Learning Analytics Engine Regression — Sprint AI-117");

/* ---- 1. Material Completion (AI-117-01) — three real sequential
   stages, reflected consistently across pages. */
console.log("\n[1] Material Completion — reading -> quiz -> review, 0/partial/20/60/100");
{
  const materialSeed = {
    materials: [{
      id: "rt_1", order: 1, subject: "math", title: "AI-117 測試教材", chapter: "第一章",
      grade: "高一", category: "課本", date: "2026/08/03", views: "1", content: "",
      progress: 0, lastOpenedAt: null, lastLearningAt: null, learningTime: 0,
      learningCount: 0, favorite: false, fileName: "", fileType: "FILE", fileSize: "", folderId: null
    }],
    folders: [], seq: 1, folderSeq: 0
  };
  const { window: w0 } = loadPage("index.html", { seedSession: { "ahs:materialRuntime": materialSeed } });
  const c0 = w0.AHS.StatisticsRuntime.materialCompletion("rt_1");
  check("尚未閱讀：stage 0，percent 0", c0.stage === 0 && c0.percent === 0 && c0.label === "尚未開始");

  const partialSeed = JSON.parse(JSON.stringify(materialSeed));
  partialSeed.materials[0].progress = 50;
  const { window: wP } = loadPage("index.html", { seedSession: { "ahs:materialRuntime": partialSeed } });
  const cP = wP.AHS.StatisticsRuntime.materialCompletion("rt_1");
  check("閱讀中（50%）：stage 仍為 0，但 percent 真實內插（非卡在 0）", cP.stage === 0 && cP.percent === 10);

  const readSeed = JSON.parse(JSON.stringify(materialSeed));
  readSeed.materials[0].progress = 100;
  const { window: w1 } = loadPage("index.html", { seedSession: { "ahs:materialRuntime": readSeed } });
  const c1 = w1.AHS.StatisticsRuntime.materialCompletion("rt_1");
  check("① 教材閱讀完成：stage 1，percent 20", c1.stage === 1 && c1.percent === 20 && c1.label === "教材閱讀完成");

  const quizSeed = {
    "ahs:materialRuntime": readSeed,
    "ahs:historyRuntime": { items: [{
      id: "hist_1", order: 1, examId: "teaching_material_rt_1", subject: "math", title: "AI-117 測試教材",
      chapter: "第一章", score: 100, accuracy: 100, correctCount: 1, totalCount: 1, when: "2026/08/03 09:00"
    }], seq: 1 }
  };
  const { window: w2 } = loadPage("index.html", { seedSession: quizSeed });
  const c2 = w2.AHS.StatisticsRuntime.materialCompletion("rt_1");
  /* Real quiz-completion is genuinely detected here even though
     WrongBookRuntime is entirely empty (via the real HistoryRuntime
     examId check materialCompletion() adds — LearningStateRuntime's own
     quizAttempted alone would have stayed false for a perfect score).
     Landing on stage 3/100% (not 2/60%) for a ZERO-wrong-item quiz is
     the same real "vacuously nothing left to review" rule
     LearningStateRuntime.materialState()'s own `completed` field
     already established (AI-113) — reused here, not a new definition:
     a perfect score genuinely has nothing to review. */
  check("② 完成測驗（滿分，無錯題）：quizDone 真實判定為 true — 即使 WrongBookRuntime 全空", c2.quizDone === true);
  check("滿分測驗：無錯題可複習，vacuously 直接視為 stage 3 完成（沿用 LearningStateRuntime 既有規則，非新定義）",
    c2.stage === 3 && c2.percent === 100 && c2.label === "複習完成");

  const reviewSeed = Object.assign({}, quizSeed, {
    "ahs:wrongBookRuntime": { items: [{
      id: "wb_1", questionId: "q1", subject: "math", title: "AI-117 測試教材", chapter: "第一章",
      materialId: "rt_1", knowledgePoint: "kp1", question: "Q", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
      yourAnswer: "A", correctAnswer: "B", explanation: "", errorCount: 1, lastError: "2026/07/20",
      bookmarked: false, correctStreak: 3
    }], seq: 1 }
  });
  const { window: w3 } = loadPage("index.html", { seedSession: reviewSeed });
  const c3 = w3.AHS.StatisticsRuntime.materialCompletion("rt_1");
  check("③ 完成複習（唯一錯題已精熟）：stage 3，percent 100", c3.stage === 3 && c3.percent === 100 && c3.label === "複習完成");

  const dueSeed = Object.assign({}, quizSeed, {
    "ahs:wrongBookRuntime": { items: [{
      id: "wb_1", questionId: "q1", subject: "math", title: "AI-117 測試教材", chapter: "第一章",
      materialId: "rt_1", knowledgePoint: "kp1", question: "Q", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
      yourAnswer: "A", correctAnswer: "B", explanation: "", errorCount: 1, lastError: "2026/07/20",
      bookmarked: false, correctStreak: 0
    }], seq: 1 }
  });
  const { window: w4 } = loadPage("index.html", { seedSession: dueSeed });
  const c4 = w4.AHS.StatisticsRuntime.materialCompletion("rt_1");
  check("尚有未精熟錯題：停在 stage 2（複習尚未完成）", c4.stage === 2 && c4.reviewDone === false);
}

/* ---- 2/3/6. Subject / Material / WrongBook Analytics — single source,
   every page reads the same real function, never re-derives. */
console.log("\n[2/3/6] Subject / Material / WrongBook Analytics");
{
  const materialSeed = {
    materials: [
      { id: "rt_1", order: 1, subject: "math", title: "教材A", chapter: "第一章", grade: "高一",
        category: "課本", date: "2026/08/01", views: "1", content: "", progress: 100,
        lastOpenedAt: "2026/08/01 09:00", lastLearningAt: "2026/08/01 09:00", learningTime: 10,
        learningCount: 1, favorite: false, fileName: "", fileType: "FILE", fileSize: "", folderId: null },
      { id: "rt_2", order: 2, subject: "math", title: "教材B", chapter: "第二章", grade: "高一",
        category: "課本", date: "2026/08/01", views: "1", content: "", progress: 0,
        lastOpenedAt: null, lastLearningAt: null, learningTime: 0,
        learningCount: 0, favorite: false, fileName: "", fileType: "FILE", fileSize: "", folderId: null }
    ],
    folders: [], seq: 2, folderSeq: 0
  };
  function fmtDate(d) {
    var p = (n) => (n < 10 ? "0" + n : String(n));
    return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate());
  }
  const recentDate = fmtDate(new Date());
  const longAgoDate = fmtDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
  const wrongBookSeed = {
    items: [
      { id: "wb_1", questionId: "q1", subject: "math", title: "教材A", chapter: "第一章", materialId: "rt_1",
        knowledgePoint: "kp1", question: "Q1", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "A", correctAnswer: "B", explanation: "", errorCount: 2, lastError: recentDate,
        bookmarked: false, correctStreak: 3 },
      { id: "wb_2", questionId: "q2", subject: "math", title: "教材A", chapter: "第一章", materialId: "rt_1",
        knowledgePoint: "kp1", question: "Q2", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "A", correctAnswer: "B", explanation: "", errorCount: 1, lastError: longAgoDate,
        bookmarked: false, correctStreak: 0 }
    ], seq: 2
  };
  const historySeed = {
    items: [
      { id: "hist_1", order: 1, examId: "teaching_material_rt_1", subject: "math", title: "教材A",
        chapter: "第一章", score: 80, accuracy: 80, correctCount: 4, totalCount: 5, when: "2026/08/01 10:00" },
      { id: "hist_2", order: 2, examId: "teaching_material_rt_1", subject: "math", title: "教材A",
        chapter: "第一章", score: 90, accuracy: 90, correctCount: 4, totalCount: 5, when: "2026/08/02 10:00" }
    ], seq: 2
  };
  const { window } = loadPage("index.html", {
    excludeScripts: ["data/materials/", "js/data/TeachingMaterialData.js"],
    seedSession: {
      "ahs:materialRuntime": materialSeed,
      "ahs:wrongBookRuntime": wrongBookSeed,
      "ahs:historyRuntime": historySeed
    }
  });
  const A = window.AHS;

  const subjects = A.StatisticsRuntime.subjectAnalytics();
  const math = subjects.find((s) => s.subject === "math");
  /* rt_1 has read+quizzed but still has ONE real unmastered wrong item
     (wb_2, correctStreak 0) — genuinely stage 2 (測驗完成), not stage 3
     (複習完成) yet; rt_2 is untouched (stage 0). 0 of 2 materials are at
     full stage 3, so the real completion rate is 0%, not a vacuous 50%. */
  check("Subject Analytics：math 教材完成率 0%（rt_1 仍有未精熟錯題，rt_2 未開始，皆未達 stage 3）",
    !!math && math.materialCompletionRate === 0);
  check("Subject Analytics：math 測驗完成率 50%（rt_1 已測驗，rt_2 未測驗）", math.quizCompletionRate === 50);
  check("Subject Analytics：math 錯題數/精熟率正確（2 筆，1 已精熟）", math.wrongCount === 2 && math.masteryRate === 50);
  check("Subject Analytics：math 待複習數正確", math.dueForReviewCount === 1);

  const matA = A.StatisticsRuntime.materialAnalytics("rt_1");
  check("Material Analytics：教材A 測驗次數/最佳/平均成績正確", matA.attemptCount === 2 && matA.bestScore === 90 && matA.avgScore === 85);
  check("Material Analytics：教材A 錯題數/精熟率正確", matA.wrongCount === 2 && matA.masteryRate === 50);
  check("Material Analytics：不建立第二份資料 — completion 與 materialCompletion() 完全一致",
    JSON.stringify(matA.completion) === JSON.stringify(A.StatisticsRuntime.materialCompletion("rt_1")));

  const wba = A.StatisticsRuntime.wrongBookAnalytics();
  check("WrongBook Analytics：最常錯知識點正確（kp1 共 3 次錯誤）",
    wba.topWrongKnowledgePoints.length === 1 && wba.topWrongKnowledgePoints[0].knowledgePoint === "kp1" && wba.topWrongKnowledgePoints[0].count === 3);
  check("WrongBook Analytics：最常錯教材正確", wba.topWrongMaterials.length === 1 && wba.topWrongMaterials[0].materialId === "rt_1");
  check("WrongBook Analytics：已精熟/待複習分組正確", wba.mastered.length === 1 && wba.dueForReview.length === 1);
  check("WrongBook Analytics：長期未複習（lastError 14 天前，早於今日 7 天以上，且未精熟）",
    wba.longUnreviewed.length === 1 && wba.longUnreviewed[0].id === "wb_2");

  const ka = A.StatisticsRuntime.knowledgeAnalytics();
  check("Knowledge Analytics：kp1 精熟率/錯題數正確", ka.length === 1 && ka[0].masteryRate === 50 && ka[0].errorCount === 3);
}

/* ---- 4/5. Knowledge Analytics honest-empty + Learning Trend windows */
console.log("\n[4/5] Knowledge Analytics 誠實空狀態 + Learning Trend");
{
  const { window: wEmpty } = loadPage("index.html", {});
  const kaEmpty = wEmpty.AHS.StatisticsRuntime.knowledgeAnalytics();
  check("無任何錯題時 Knowledge Analytics 誠實回傳空陣列（非假造）", Array.isArray(kaEmpty) && kaEmpty.length === 0);

  const today = new Date();
  function fmt(d) {
    var p = (n) => (n < 10 ? "0" + n : String(n));
    return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " 10:00";
  }
  const eightDaysAgo = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);
  const historySeed = {
    items: [
      { id: "hist_1", order: 1, examId: "e1", subject: "math", title: "T", chapter: "C", score: 100, accuracy: 100, correctCount: 1, totalCount: 1, when: fmt(today) },
      { id: "hist_2", order: 2, examId: "e2", subject: "math", title: "T", chapter: "C", score: 60, accuracy: 60, correctCount: 1, totalCount: 1, when: fmt(eightDaysAgo) }
    ], seq: 2
  };
  const { window } = loadPage("index.html", { seedSession: { "ahs:historyRuntime": historySeed } });
  const trend = window.AHS.StatisticsRuntime.learningTrend();
  check("Learning Trend 今日：只計入今天的真實測驗（1 筆，正確率 100）", trend.today.quizzesCompleted === 1 && trend.today.avgAccuracy === 100);
  check("Learning Trend 七日：8 天前的測驗不計入（仍只 1 筆）", trend.sevenDay.quizzesCompleted === 1);
  check("Learning Trend 三十日：兩筆都計入，正確率為兩者平均", trend.thirtyDay.quizzesCompleted === 2 && trend.thirtyDay.avgAccuracy === 80);
}

/* ---- 7. Platform Tutor Engine reads only via Analytics (AI-117-07) */
console.log("\n[7] Platform Tutor Engine — 只讀取 Learning Analytics，不直接存取各 Runtime");
{
  const src = fs.readFileSync(path.join(REPO, "js/utils/TutorMessage.js"), "utf8");
  // Strip every /* ... */ block comment first (this file's comments are prose, not code).
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, "");
  const forbidden = /AHS\.MaterialRuntime\.|AHS\.LearningStateRuntime\.|AHS\.WrongBookRuntime\.|AHS\.HistoryRuntime\./;
  check("TutorMessage.js 原始碼中（排除註解）不含任何直接 Runtime 存取", !forbidden.test(codeOnly));

  const materialSeed = {
    materials: [{ id: "rt_1", order: 1, subject: "math", title: "Tutor 測試教材", chapter: "第一章",
      grade: "高一", category: "課本", date: "2026/08/03", views: "1", content: "", progress: 100,
      lastOpenedAt: "2026/08/03 09:00", lastLearningAt: "2026/08/03 09:00", learningTime: 10,
      learningCount: 1, favorite: false, fileName: "", fileType: "FILE", fileSize: "", folderId: null }],
    folders: [], seq: 1, folderSeq: 0
  };
  const { window } = loadPage("index.html", { seedSession: { "ahs:materialRuntime": materialSeed } });
  const built = window.AHS.TutorMessage.build(window.AHS.StatisticsRuntime.learningContext(), { page: "materials", materialId: "rt_1" });
  check("Tutor 訊息真實反映 materialContext() 的 Material Completion（教材閱讀完成 20%）",
    !!built && built.message.includes("教材閱讀完成") && built.message.includes("20%"));
}

/* ---- 8. Assessment Mode — 原始試卷／AI 練習不得混用 (AI-117-08) */
console.log("\n[8] Assessment Mode — 原始試卷／AI 練習分流，不得混用");
{
  const { window } = loadPage("quiz.html", {});
  const Q = window.AHS.QuestionRuntime;
  Q.importQuestions("teaching_material_rt_9", [
    { id: "q_o1", index: 1, subject: "civics", text: "原始題目", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      questionSource: "ORIGINAL", origin: "Uploaded Material" },
    { id: "q_a1", index: 1, subject: "civics", text: "AI 題目", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      questionSource: "AI_GENERATED", origin: "AI" }
  ]);
  window.AHS.TeachingMaterialLoader.importAssessmentModeVariants("teaching_material_rt_9", Q.getSet("teaching_material_rt_9"));

  check("原始試卷 examId 只含 questionSource=ORIGINAL", Q.hasExam("teaching_material_rt_9__original") &&
    Q.getSet("teaching_material_rt_9__original").every((q) => q.questionSource === "ORIGINAL"));
  check("AI 練習 examId 只含 questionSource=AI_GENERATED", Q.hasExam("teaching_material_rt_9__ai") &&
    Q.getSet("teaching_material_rt_9__ai").every((q) => q.questionSource === "AI_GENERATED"));
  check("兩種模式彼此不混用（原始試卷不含 AI 題目，AI 練習不含原始題目）",
    Q.getSet("teaching_material_rt_9__original").every((q) => q.id !== "q_a1") &&
    Q.getSet("teaching_material_rt_9__ai").every((q) => q.id !== "q_o1"));

  const ExamRt = window.AHS.ExamRuntime;
  const s1 = ExamRt.startFromExam("teaching_material_rt_9__original", { subject: "civics", title: "原始試卷" });
  check("ExamRuntime 可針對「原始試卷」單獨啟動一場 Session", !!s1 && s1.totalQuestions === 1);
  const abandoned = ExamRt.abandon(s1.examId);
  check("切換模式時 abandon() 不會產生任何評分/錯題/歷史紀錄（非真正繳交）",
    abandoned === null && window.AHS.WrongBookRuntime.list().length === 0 && window.AHS.HistoryRuntime.list().length === 0);
  const s2 = ExamRt.startFromExam("teaching_material_rt_9__ai", { subject: "civics", title: "AI 練習" });
  check("abandon() 後可切換至「AI 練習」啟動新 Session（單一運作中考試限制未被破壞）", !!s2 && s2.totalQuestions === 1);
}

/* ---- 9. Random Exam Session — Question ID 不變，Display Order 真實 Random (AI-117-09) */
console.log("\n[9] Random Exam Session — Question ID 不變，Display Order 真實隨機");
{
  const { window } = loadPage("quiz.html", {});
  const Q = window.AHS.QuestionRuntime;
  const original = [];
  for (let i = 0; i < 20; i++) {
    original.push({ id: "rq_" + i, index: i + 1, subject: "math", text: "第 " + i + " 題", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A" });
  }
  Q.importQuestions("exam_random_test", original.slice());
  const before = Q.getSet("exam_random_test").map((q) => q.id);
  Q.shuffleOrder("exam_random_test");
  const after = Q.getSet("exam_random_test").map((q) => q.id);

  check("shuffleOrder() 後 Question ID 集合完全不變（同一組 20 題）",
    before.slice().sort().join(",") === after.slice().sort().join(","));
  check("shuffleOrder() 真實改變了顯示順序（非原封不動 — 20 題洗牌後與原順序相同的機率極低）",
    before.join(",") !== after.join(","));

  const ExamRt = window.AHS.ExamRuntime;
  const orders = [];
  for (let i = 0; i < 5; i++) {
    const s = ExamRt.startFromExam("exam_random_test", { subject: "math", title: "隨機測驗" });
    orders.push(Q.getSet("exam_random_test").map((q) => q.id).join(","));
    ExamRt.abandon(s.examId);
  }
  const distinctOrders = new Set(orders);
  check("重複練習同一場考試：Question ID 集合每次仍完全相同", orders.every((o) => o.split(",").sort().join(",") === before.slice().sort().join(",")));
  check("重複練習同一場考試：Display Order 確實每次重新 Random（5 次中至少出現 2 種不同順序）", distinctOrders.size >= 2);
}

console.log("\nAnalyticsRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
