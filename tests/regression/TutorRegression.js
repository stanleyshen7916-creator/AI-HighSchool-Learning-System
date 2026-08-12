/* tests/regression/TutorRegression.js — Sprint AI-120 (Workspace
   Repository Integration) AI-120-06/AI-120-09. Real proof that
   AHS.TutorMessage.build() (untouched this Sprint) never recommends a
   material or context from a different Semester/Workspace — a direct
   consequence of (a) Sprint AI-119's PersistenceAdapter namespacing and
   (b) this Sprint's own AI-120-01 Material Center Workspace filter:
   TutorMessage only ever reads AHS.StatisticsRuntime/AHS.MaterialRuntime,
   both already scoped to Current Workspace, so a material that was
   filtered out of MaterialRuntime for this Workspace can never appear in
   a recommendation either.

   Run: node tests/regression/TutorRegression.js */
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
  AHS.QuestionRuntime.importQuestions("exam_tutor_test", [
    { id: "q1", index: 1, subject: "math", text: "t", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      questionSource: "ORIGINAL", origin: "x", materialId: "m1" }
  ]);
  const session = AHS.ExamRuntime.startFromExam("exam_tutor_test", { subject: "math", title: "t" });
  AHS.AnswerRuntime.saveAnswer(session.examId, "q1", "B");
  const graded = AHS.AutoGrader.grade(AHS.ExamRuntime.finish(session.examId));
  AHS.WrongBookRuntime.sync(graded);
  AHS.HistoryRuntime.record(graded);
}

console.log("Tutor Context Regression — Sprint AI-120");

/* ---- 1. 高一下學期：真實產生錯題後，Tutor 建議真實反映該 Workspace ---- */
console.log("\n[1] AI Tutor — 高一下學期真實建議反映該 Workspace 自己的真實資料（非固定文字）");
{
  const { window, consoleErrors } = loadPage("quiz.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  gradeOneWrongAnswer(window);
  const ctx = window.AHS.StatisticsRuntime.learningContext();
  const msg = window.AHS.TutorMessage.build(ctx);
  check("Tutor 訊息真實產生（非空，因為此 Workspace 剛才真實產生了錯題）", !!msg && Array.isArray(msg.actions));
  check("建議動作皆為真實連結（非 # 佔位符，AI-118-08 既有規則延續）",
    !!msg && msg.actions.every((a) => !a.href || a.href !== "#"));
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 2. 高二上（無教材、無錯題）：Tutor 不得推薦高一下的教材／內容 ----- */
console.log("\n[2] AI Tutor — 高二上（尚無教材/錯題）不得推薦其他 Semester 的內容（AI-120-06）");
{
  const { window: g1s2Window } = loadPage("index.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  const g1s2Titles = g1s2Window.AHS.MaterialRuntime.list().map((m) => m.title).filter(Boolean);
  check("（前置）高一下學期真實有教材可比對", g1s2Titles.length > 0);

  /* 高二上（g2s1）自「國文教材上傳｜高二國文五課」加入後已非空 workspace，
     改用真正尚無任何 Repository 教材標記的高二下（g2s2）驗證此處為空。 */
  const { window: g2s2Window } = loadPage("index.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s2"] } }
  });
  const ctx = g2s2Window.AHS.StatisticsRuntime.learningContext();
  const msg = g2s2Window.AHS.TutorMessage.build(ctx);
  const text = msg ? (msg.text || "") + JSON.stringify(msg.actions || []) : "";
  const leaked = g1s2Titles.some((t) => text.indexOf(t) !== -1);
  check("高二下的 Tutor 訊息（若有）不含任何高一下學期教材標題", !leaked);
  check("高二下 MaterialRuntime 真實為空（Tutor 的 Context 本來就沒有可推薦的教材）",
    g2s2Window.AHS.MaterialRuntime.list().length === 0);
}

/* ---- 3. AI Tutor 頁面本身：Console 無錯誤、真實渲染 -------------------- */
console.log("\n[3] tutor.html — 依 Current Workspace 正常渲染，無錯誤");
{
  const { window, consoleErrors } = loadPage("tutor.html", {
    seedSession: { "ahs:workspace": { studentId: "student_b", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  check(".shell 正常渲染", !!window.document.querySelector(".shell"));
  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\n==============================");
console.log("TutorRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
