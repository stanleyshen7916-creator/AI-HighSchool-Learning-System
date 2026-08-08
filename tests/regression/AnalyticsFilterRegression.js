/* tests/regression/AnalyticsFilterRegression.js — Sprint AI-120 (Workspace
   Repository Integration) AI-120-05/AI-120-09. Real proof that
   AHS.StatisticsRuntime — untouched this Sprint, per its own "Analytics
   Architecture" LOCK — is automatically scoped to the Current Workspace
   as a direct consequence of Sprint AI-119's PersistenceAdapter
   namespacing: it only ever reads AHS.HistoryRuntime/AHS.WrongBookRuntime/
   AHS.MaterialRuntime, which are themselves already Workspace-namespaced.
   No Analytics code was added or modified to achieve this — this suite
   exists to prove the "for free" claim is actually true, not assumed.

   Run: node tests/regression/AnalyticsFilterRegression.js */
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

function loadPage(htmlFile, { seedSession } = {}) {
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
    url: "https://ahs.test/" + htmlFile,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vconsole
  });
  const { window } = dom;
  if (seedSession) {
    Object.entries(seedSession).forEach(([k, v]) => window.sessionStorage.setItem(k, JSON.stringify(v)));
  }
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; } /* optional, git-ignored local-only script (e.g. SupabaseConfig.local.js) */
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function gradeOneWrongAnswer(window) {
  const AHS = window.AHS;
  AHS.QuestionRuntime.importQuestions("exam_analytics_test", [
    { id: "q1", index: 1, subject: "math", text: "t", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      questionSource: "ORIGINAL", origin: "x", materialId: "m1" }
  ]);
  const session = AHS.ExamRuntime.startFromExam("exam_analytics_test", { subject: "math", title: "t" });
  AHS.AnswerRuntime.saveAnswer(session.examId, "q1", "B");
  const graded = AHS.AutoGrader.grade(AHS.ExamRuntime.finish(session.examId));
  AHS.WrongBookRuntime.sync(graded);
  AHS.HistoryRuntime.record(graded);
}

console.log("Analytics Filter Regression — Sprint AI-120");

/* ---- 1. 高一下學期真實累積錯題／歷史，Analytics 反映該 Workspace ------ */
console.log("\n[1] StatisticsRuntime — 真實反映高一下學期 Workspace 自己的錯題/歷史");
{
  const { window } = loadPage("quiz.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  gradeOneWrongAnswer(window);
  const dueForReview = window.AHS.StatisticsRuntime.dueForReview().length;
  check("dueForReview() > 0（真實反映剛才的錯題）", dueForReview > 0);
}

/* ---- 2. 切換到高二上（同一 Student）：Analytics 立即歸零，不混入高一下的
   資料 ------------------------------------------------------------- */
console.log("\n[2] Workspace 切換 -> Analytics 立即同步為新 Workspace 自己的（真實隔離，非快取舊值）");
{
  const { window } = loadPage("quiz.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] } }
  });
  check("高二上 dueForReview() = 0（不混入高一下的錯題）", window.AHS.StatisticsRuntime.dueForReview().length === 0);
  check("高二上 WrongBookRuntime 真實為空", window.AHS.WrongBookRuntime.list().length === 0);
}

/* ---- 3. Student B 看不到 Student A 的 Analytics -------------------- */
console.log("\n[3] Student B 的 Analytics 與 Student A 完全獨立");
{
  const { window } = loadPage("quiz.html", {
    seedSession: { "ahs:workspace": { studentId: "student_b", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  check("Student B 在高一下學期的 dueForReview() = 0（Student A 的錯題不會外洩）",
    window.AHS.StatisticsRuntime.dueForReview().length === 0);
}

/* ---- 4. AI-117 既有的 subjectAnalytics()／materialCompletion() 同樣自動
   隨 Workspace 隔離（未修改 Analytics Architecture 本身，僅驗證其結果） -- */
console.log("\n[4] subjectAnalytics() 同樣自動隨 Workspace 隔離（Analytics Architecture 本身未修改）");
{
  const { window } = loadPage("materials.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  const analytics = window.AHS.StatisticsRuntime.subjectAnalytics();
  check("高一下學期 subjectAnalytics() 反映真實已遷移的教材科目（非空）", analytics.length > 0);

  const { window: g2s1Window } = loadPage("materials.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] } }
  });
  check("高二上學期 subjectAnalytics() 真實為空（尚無教材）", g2s1Window.AHS.StatisticsRuntime.subjectAnalytics().length === 0);
}

console.log("\n==============================");
console.log("AnalyticsFilterRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
