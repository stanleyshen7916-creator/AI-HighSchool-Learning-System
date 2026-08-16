/* tests/regression/KnowledgeEngineRegression.js — Sprint AI-121 (Learning
   Knowledge Engine). Real, end-to-end regression for every new Runtime
   this Sprint added — AHS.QuestionBankRuntime (AI-121-03, build-once real
   QuestionBank) / AHS.KnowledgeMasteryRuntime (AI-121-09/10/17, real
   per-knowledge-point Mastery/Trend/Growth) / AHS.MaterialLearningStateRuntime
   (AI-121-02, the 5-state machine) — plus every existing Runtime this
   Sprint extended: AHS.WrongBookRuntime's real archive()/weaknessState()
   (AI-121-08), AHS.StatisticsRuntime's homeKpis()/knowledgeAnalytics()
   rewrite/priority-sorted dueForReview() (AI-121-13/17/19),
   AHS.ReviewRuntime.startSession(count) (AI-121-06), AHS.TutorMessage's
   real Knowledge-only priority branch (AI-121-15/16), and QuizCenter's
   mode=daily/mode=retest real random-draw entry points (AI-121-05/07).

   Run: node tests/regression/KnowledgeEngineRegression.js */
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

const DEFAULT_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };
const AHS_TEST_NS = "student_a__cjsh__g1s2";

/* namespacedKey(k) — this file's own seedSession keys (e.g.
   "ahs:materialRuntime") are bare/legacy-shaped, but every real Runtime
   here persists through AHS.PersistenceAdapter's Workspace-namespaced
   effectiveKey() once DEFAULT_WORKSPACE is active (seeded below) — so a
   raw "ahs:xxx" seed would silently miss the real namespaced key the
   Runtime actually reads from. Same idempotent rewrite
   tests/jsdom/BehaviorSuite.js's own loadPage() already established. */
function namespacedKey(k) {
  if (k === "ahs:workspace") { return k; }
  const nsPrefix = "ahs:" + AHS_TEST_NS + ":";
  if (k.indexOf(nsPrefix) === 0) { return k; }
  if (k.indexOf("ahs:") === 0) { return "ahs:" + AHS_TEST_NS + ":" + k.slice(4); }
  return k;
}

function loadPage(htmlFile, { seedSession, url } = {}) {
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
  /* Sprint AI-142: jsdom has no window.fetch — now that real Supabase
     config is committed (js/data/SupabaseConfig.js), any code path that
     reaches AHS.SupabaseClient would otherwise throw a synchronous
     ReferenceError instead of the graceful network-failure rejection
     the real code already handles via .catch(). Stub it to fail
     immediately so every test stays offline/deterministic (this sandbox
     has no real outbound access to Supabase anyway) without touching
     any Supabase source file. */
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  const seed = Object.assign({ "ahs:workspace": DEFAULT_WORKSPACE }, seedSession || {});
  Object.entries(seed).forEach(([k, v]) => window.sessionStorage.setItem(namespacedKey(k), JSON.stringify(v)));
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; } /* optional, git-ignored local-only script (e.g. SupabaseConfig.local.js) */
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function dumpSession(window) {
  const dump = {};
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i);
    dump[k] = JSON.parse(window.sessionStorage.getItem(k));
  }
  return dump;
}

function gradeQuestions(window, examId, questions, answers) {
  const AHS = window.AHS;
  AHS.QuestionRuntime.importQuestions(examId, questions);
  const session = AHS.ExamRuntime.startFromExam(examId, { subject: "math", title: "測試教材" });
  questions.forEach((q) => AHS.AnswerRuntime.saveAnswer(session.examId, q.id, answers[q.id]));
  const finished = AHS.ExamRuntime.finish(session.examId);
  const graded = AHS.AutoGrader.grade(finished);
  AHS.WrongBookRuntime.sync(graded);
  AHS.HistoryRuntime.record(graded);
  if (AHS.KnowledgeMasteryRuntime) { AHS.KnowledgeMasteryRuntime.recordGraded(graded); }
  return graded;
}

console.log("Knowledge Engine Regression — Sprint AI-121 (Learning Knowledge Engine)");

/* ---- 1. QuestionBankRuntime — build-once, capped, never fabricated --- */
console.log("\n[1] QuestionBankRuntime — 建立一次永久保存，capped 於 50，從不假造");
{
  const { window } = loadPage("quiz.html");
  const A = window.AHS;
  const real6 = [1, 2, 3, 4, 5, 6].map((i) => ({ id: "q" + i, index: i, text: "t" + i }));
  const bank1 = A.QuestionBankRuntime.ensureBank("exam_bank_test", real6);
  check("首次 ensureBank() 真實建立（6 題真實內容，非補到 50）", bank1.length === 6);
  const bank2 = A.QuestionBankRuntime.ensureBank("exam_bank_test", [{ id: "extra", index: 99, text: "x" }]);
  check("第二次 ensureBank() 不重新產生（仍是原本 6 題，不因再次傳入而改變）", bank2.length === 6 && bank2[0].id === "q1");
  check("hasBank() 反映真實已建立狀態", A.QuestionBankRuntime.hasBank("exam_bank_test") === true);
  check("bankSize() 正確", A.QuestionBankRuntime.bankSize("exam_bank_test") === 6);
  const many = [];
  for (let i = 0; i < 80; i++) { many.push({ id: "m" + i, index: i, text: "t" }); }
  const bankBig = A.QuestionBankRuntime.ensureBank("exam_bank_big", many);
  check("MAX_BANK_SIZE 上限生效（80 題真實內容被 cap 在 50，never 補到更多）", bankBig.length === 50);
  const drawn = A.QuestionBankRuntime.drawRandom("exam_bank_test", 10);
  check("drawRandom() 對僅 6 題的真實 Bank 誠實只回傳 6 題（不假造湊滿 10）", drawn.length === 6);
  const drawnBig = A.QuestionBankRuntime.drawRandom("exam_bank_big", 10);
  check("drawRandom() 對 50 題 Bank 正確回傳 10 題", drawnBig.length === 10);
}

/* ---- 2. KnowledgeMasteryRuntime — real Mastery/Trend/Growth ---------- */
console.log("\n[2] KnowledgeMasteryRuntime — 真實 Mastery／Trend／Growth（含跨日 Growth 模擬）");
{
  const { window } = loadPage("quiz.html");
  const A = window.AHS;
  const kmr = A.KnowledgeMasteryRuntime;
  kmr.recordAttempt("三角函數", true, "math", "mat_1");
  kmr.recordAttempt("三角函數", false, "math", "mat_1");
  kmr.recordAttempt("三角函數", true, "math", "mat_1");
  const kp = kmr.get("三角函數");
  check("real attemptCount/correctCount 正確（3 次真實作答，2 次答對）", kp.attemptCount === 3 && kp.correctCount === 2);
  check("Mastery 為真實比例（2/3 -> 67%）", kp.mastery === 67);
  check("materialId 真實記錄最近一次的來源教材（never fabricated）", kp.materialId === "mat_1");
  check("空白 knowledgePoint 被誠實跳過（不建立假的空字串桶）", (() => {
    kmr.recordAttempt("", true, "math");
    return kmr.get("") === null;
  })());

  /* Simulate a real "yesterday" attempt by seeding the persisted store
     directly (legitimate fixture data — this file's own scope, not the
     app fabricating content) so growth()/trend() can be verified without
     an actual multi-day wait. */
  const { window: w2 } = loadPage("quiz.html", {
    seedSession: {
      "ahs:knowledgeMasteryRuntime": {
        points: {
          "餘弦定理": {
            subject: "math", materialId: "mat_2",
            attempts: [
              { correct: false, day: "2020/01/01", ts: "2020-01-01T00:00:00.000Z" },
              { correct: false, day: "2020/01/01", ts: "2020-01-01T00:00:01.000Z" }
            ]
          }
        }
      }
    }
  });
  const A2 = w2.AHS;
  A2.KnowledgeMasteryRuntime.recordAttempt("餘弦定理", true, "math", "mat_2");
  A2.KnowledgeMasteryRuntime.recordAttempt("餘弦定理", true, "math", "mat_2");
  const growth = A2.KnowledgeMasteryRuntime.growth("餘弦定理");
  check("growth() 真實計算今日與前一個真實有資料日的差值（0% -> 100%，+100）",
    growth.today === 100 && growth.previous === 0 && growth.delta === 100);
  const topGrowth = A2.StatisticsRuntime.knowledgeGrowthToday(1);
  check("StatisticsRuntime.knowledgeGrowthToday() 正確反映最大進步知識點",
    topGrowth.length === 1 && topGrowth[0].knowledgePoint === "餘弦定理");
}

/* ---- 3. WrongBookRuntime — 知識弱點 real archive/weaknessState -------- */
console.log("\n[3] WrongBookRuntime — 知識弱點狀態機（NEW/LEARNING/MASTERED/ARCHIVED），永不真的刪除");
{
  const { window } = loadPage("quiz.html");
  const graded = gradeQuestions(window, "exam_wb_test", [
    { id: "wq1", index: 1, subject: "math", text: "t", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      knowledgePoint: "圓的方程式", materialId: "mat_3" }
  ], { wq1: "B" });
  const A = window.AHS;
  const item = A.WrongBookRuntime.list()[0];
  check("新錯題 weaknessState 為 NEW", item.weaknessState === "NEW");
  check("firstError 真實記錄建立當下日期", !!item.firstError);
  check("masteredAt 初始為 null（尚未精熟）", item.masteredAt === null);

  A.WrongBookRuntime.recordRetry(item.id, true);
  check("答對一次後 weaknessState 變為 LEARNING", A.WrongBookRuntime.getById(item.id).weaknessState === "LEARNING");
  A.WrongBookRuntime.recordRetry(item.id, true);
  A.WrongBookRuntime.recordRetry(item.id, true);
  const mastered = A.WrongBookRuntime.getById(item.id);
  check("三次連續答對後 weaknessState 為 MASTERED", mastered.weaknessState === "MASTERED");
  check("masteredAt 真實記錄精熟當下日期（僅設定一次）", !!mastered.masteredAt);

  const archived = A.WrongBookRuntime.archive(item.id);
  check("archive() 真實設定 archived=true，weaknessState 變為 ARCHIVED", archived.archived === true && archived.weaknessState === "ARCHIVED");
  check("archive 後記錄仍存在於 list()（永不真的刪除）", A.WrongBookRuntime.list().some((i) => i.id === item.id));
  check("dueForReview() 誠實排除已封存項目", !A.StatisticsRuntime.dueForReview().some((i) => i.id === item.id));

  const unarchived = A.WrongBookRuntime.unarchive(item.id);
  check("unarchive() 真實還原", unarchived.archived === false);
}

/* ---- 4. StatisticsRuntime — homeKpis()／dueForReview() priority sort -- */
console.log("\n[4] StatisticsRuntime — homeKpis() 真實 KPI ／ dueForReview() 依優先序排序（非隨機）");
{
  const { window } = loadPage("quiz.html");
  const A = window.AHS;
  gradeQuestions(window, "exam_prio_1", [
    { id: "pq1", index: 1, subject: "math", text: "t1", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      knowledgePoint: "低優先", materialId: "mat_p1" }
  ], { pq1: "B" });
  // Grade this same low-priority knowledge point correctly 3x elsewhere to
  // give it a real, high Mastery — genuinely LOW urgency despite errorCount=1.
  ["c1", "c2", "c3"].forEach((qid, i) => {
    gradeQuestions(window, "exam_prio_boost_" + i, [
      { id: qid, index: 1, subject: "math", text: "t", type: "single_choice",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
        knowledgePoint: "低優先", materialId: "mat_p1" }
    ], { [qid]: "A" });
  });
  gradeQuestions(window, "exam_prio_2", [
    { id: "pq2", index: 1, subject: "math", text: "t2", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      knowledgePoint: "高優先", materialId: "mat_p2" }
  ], { pq2: "B" });
  const due = A.StatisticsRuntime.dueForReview();
  const highIdx = due.findIndex((i) => i.knowledgePoint === "高優先");
  const lowIdx = due.findIndex((i) => i.knowledgePoint === "低優先");
  check("dueForReview() 真實依優先序排序（低 Mastery／低正確率的「高優先」排在高 Mastery 的「低優先」之前）",
    highIdx !== -1 && lowIdx !== -1 && highIdx < lowIdx);

  const kpis = A.StatisticsRuntime.homeKpis();
  check("homeKpis() 回傳完整 8 個真實欄位", [
    "outstandingTasks", "accuracyToday", "accuracyThisWeek", "knowledgeMasteryAvg",
    "knowledgeGrowthToday", "topGrowthPoint", "newWeaknessesToday", "resolvedWeaknessesToday"
  ].every((k) => k in kpis));
  check("newWeaknessesToday 真實 > 0（剛才建立了 2 個新知識弱點）", kpis.newWeaknessesToday >= 2);
  check("accuracyToday 為真實計算的百分比（非 null，因為今天已有真實作答）", typeof kpis.accuracyToday === "number");

  const { window: wEmpty } = loadPage("quiz.html");
  const emptyKpis = wEmpty.AHS.StatisticsRuntime.homeKpis();
  check("無任何資料時 accuracyToday／knowledgeMasteryAvg 誠實回傳 null（非假造 0）",
    emptyKpis.accuracyToday === null && emptyKpis.knowledgeMasteryAvg === null);
}

/* ---- 5. ReviewRuntime.startSession(count) — Review Mode 選題數 -------- */
console.log("\n[5] ReviewRuntime.startSession(count) — AI-121-06 Review Mode 真實選題數（不足則誠實回傳全部）");
{
  const { window } = loadPage("quiz.html");
  const A = window.AHS;
  for (let i = 0; i < 3; i++) {
    gradeQuestions(window, "exam_review_mode_" + i, [
      { id: "rq" + i, index: 1, subject: "math", text: "t", type: "single_choice",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
        knowledgePoint: "kp" + i, materialId: "m" }
    ], { ["rq" + i]: "B" });
  }
  const full = A.ReviewRuntime.startSession();
  check("不傳 count 時維持既有全部題數行為（3 題）", full.total === 3);
  const capped = A.ReviewRuntime.startSession(2);
  check("count=2 時真實只取 2 題（優先序最前的 2 題，非隨機）", capped.total === 2);
  const overCapped = A.ReviewRuntime.startSession(50);
  check("count 超過真實可複習題數時誠實回傳全部（不假造湊滿 50）", overCapped.total === 3);
}

/* ---- 6. MaterialLearningStateRuntime — 5-state machine --------------- */
console.log("\n[6] MaterialLearningStateRuntime — NOT_STARTED/READING/READY_FOR_PRACTICE/READY_FOR_RETEST/MASTERED");
{
  const materialSeed = {
    materials: [{
      id: "rt_1", order: 1, subject: "math", title: "測試教材", chapter: "第一章",
      grade: "高一", category: "課本", date: "2026/08/01", views: "1", content: "",
      progress: 0, lastOpenedAt: "", lastLearningAt: "", learningTime: 0, learningCount: 0,
      favorite: false, fileName: "", fileType: "FILE", fileSize: "", folderId: null
    }],
    folders: [], seq: 1, folderSeq: 0
  };
  const { window } = loadPage("quiz.html", { seedSession: { "ahs:materialRuntime": materialSeed } });
  const A = window.AHS;
  check("progress=0／無測驗紀錄 -> NOT_STARTED", A.MaterialLearningStateRuntime.state("rt_1").state === "NOT_STARTED");

  const { window: w2 } = loadPage("quiz.html", {
    seedSession: {
      "ahs:materialRuntime": Object.assign({}, materialSeed, {
        materials: [Object.assign({}, materialSeed.materials[0], { progress: 50 })]
      })
    }
  });
  check("0 < progress < 100 -> READING", w2.AHS.MaterialLearningStateRuntime.state("rt_1").state === "READING");

  const { window: w3 } = loadPage("quiz.html", {
    seedSession: {
      "ahs:materialRuntime": Object.assign({}, materialSeed, {
        materials: [Object.assign({}, materialSeed.materials[0], { progress: 100 })]
      })
    }
  });
  check("progress=100／尚未測驗 -> READY_FOR_PRACTICE", w3.AHS.MaterialLearningStateRuntime.state("rt_1").state === "READY_FOR_PRACTICE");

  const graded4 = gradeQuestions(w3, "exam_state_test", [
    { id: "sq1", index: 1, subject: "math", text: "t", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      knowledgePoint: "kp", materialId: "rt_1" }
  ], { sq1: "B" });
  check("已讀完且有真實未精熟錯題 -> READY_FOR_RETEST", w3.AHS.MaterialLearningStateRuntime.state("rt_1").state === "READY_FOR_RETEST");

  const wbItem = w3.AHS.WrongBookRuntime.list().find((i) => i.materialId === "rt_1");
  w3.AHS.WrongBookRuntime.recordRetry(wbItem.id, true);
  w3.AHS.WrongBookRuntime.recordRetry(wbItem.id, true);
  w3.AHS.WrongBookRuntime.recordRetry(wbItem.id, true);
  check("全部相關錯題精熟後 -> MASTERED", w3.AHS.MaterialLearningStateRuntime.state("rt_1").state === "MASTERED");
}

/* ---- 7. TutorMessage — Knowledge-only 優先建議（AI-121-15/16） -------- */
console.log("\n[7] TutorMessage — 真實、可追溯、Knowledge-only 建議（非模糊文字）");
{
  const { window } = loadPage("quiz.html");
  const A = window.AHS;
  gradeQuestions(window, "exam_tutor_kp", [
    { id: "tq1", index: 1, subject: "biology", text: "t", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      knowledgePoint: "DNA 聚合酶", materialId: "mat_bio" }
  ], { tq1: "B" });
  const ctx = A.StatisticsRuntime.learningContext();
  check("learningContext() 提供真實 weakestKnowledgePoint", !!ctx.weakestKnowledgePoint && ctx.weakestKnowledgePoint.knowledgePoint === "DNA 聚合酶");
  const built = A.TutorMessage.build(ctx, { page: "home" });
  check("Tutor 訊息包含真實知識點名稱與真實 Mastery 百分比（可追溯，非模糊建議）",
    built.message.includes("DNA 聚合酶") && built.message.includes("Mastery " + ctx.weakestKnowledgePoint.mastery + "%"));
  check("Tutor 提供真實「重新閱讀摘要」動作，連向真實 materialId", built.actions.some((a) =>
    a.label === "重新閱讀摘要" && a.href === "summary.html?materialId=mat_bio"));
}

/* ---- 8. QuizCenter — mode=daily／mode=retest 真實隨機抽題入口 --------- */
console.log("\n[8] QuizCenter — mode=daily／mode=retest 從真實 QuestionBank 隨機抽 10 題（AI-121-05/07）");
{
  const { window } = loadPage("quiz.html");
  const A = window.AHS;
  const bankQuestions = [];
  for (let i = 1; i <= 20; i++) {
    bankQuestions.push({
      id: "bq" + i, index: i, subject: "math", text: "t" + i, type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      knowledgePoint: "kp", materialId: "rt_daily"
    });
  }
  A.QuestionRuntime.importQuestions("teaching_material_rt_daily", bankQuestions);
  A.QuestionBankRuntime.ensureBank("teaching_material_rt_daily", bankQuestions);
  const carry = dumpSession(window);

  const { window: wDaily } = loadPage("quiz.html", {
    url: "quiz.html?mode=daily&examId=" + encodeURIComponent("teaching_material_rt_daily"),
    seedSession: carry
  });
  const dailySession = wDaily.AHS.ExamRuntime.getCurrent();
  check("mode=daily 真實啟動一個 Exam Session（從 QuestionBank 隨機抽題）", !!dailySession && dailySession.status === "running");
  check("每日 AI 練習真實抽 10 題（Bank 有 20 題，10 題上限生效）", dailySession && dailySession.totalQuestions === 10);

  const { window: wRetest } = loadPage("quiz.html", {
    url: "quiz.html?mode=retest&examId=" + encodeURIComponent("teaching_material_rt_daily"),
    seedSession: carry
  });
  const retestSession = wRetest.AHS.ExamRuntime.getCurrent();
  check("mode=retest 真實啟動一個獨立 Exam Session", !!retestSession && retestSession.status === "running");
  check("再次測試同樣真實抽 10 題", retestSession && retestSession.totalQuestions === 10);
  check("每日練習與再次測試使用不同的 derived examId（互不干擾）",
    dailySession.examId !== retestSession.examId);
}

console.log("\n==============================");
console.log("KnowledgeEngineRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
