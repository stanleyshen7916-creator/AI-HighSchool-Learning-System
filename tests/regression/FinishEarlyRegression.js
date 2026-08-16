/* tests/regression/FinishEarlyRegression.js — 完成測試 (early-finish)
   hotfix regression. Verifies:
   - AHS.AutoGrader.grade(examSession, { answeredOnly: true }) scopes
     totalCount/correctCount/results/wrong to ONLY the questions actually
     answered — an unanswered question is excluded, never counted wrong.
   - Every existing caller (no opts) keeps its exact prior behavior
     (unanswered counted as wrong, in totalCount) — no regression.
   - The real end-to-end flow js/components/QuizCenter.js's
     finishExamEarly() drives (ExamRuntime.finish -> AutoGrader.grade
     with answeredOnly -> WrongBookRuntime.sync / HistoryRuntime.record /
     KnowledgeMasteryRuntime.recordGraded -> ReviewRuntime.build) really
     records only the answered subset, and the resulting Review view-model
     reflects exactly that subset (user requirement: "本次測試也必須記錄").
   - grade(examSession, { answeredOnly: true }) returns null when nothing
     was answered (nothing real to grade).

   Run: node tests/regression/FinishEarlyRegression.js */
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

function loadPage(htmlFile) {
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
  /* Sprint AI-142: jsdom has no window.fetch — now that real Supabase
     config is committed (js/data/SupabaseConfig.js), any code path that
     reaches AHS.SupabaseClient would otherwise throw a synchronous
     ReferenceError instead of the graceful network-failure rejection
     the real code already handles via .catch(). Stub it to fail
     immediately so every test stays offline/deterministic (this sandbox
     has no real outbound access to Supabase anyway) without touching
     any Supabase source file. */
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify(DEFAULT_WORKSPACE));
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function tenQuestions() {
  const out = [];
  for (let i = 1; i <= 10; i++) {
    out.push({ id: "q" + i, index: i, text: "第" + i + "題", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A", knowledgePoint: "kp" + i, explanation: "詳解" + i });
  }
  return out;
}

console.log("Finish Early Regression — 完成測試 (early-finish, answeredOnly partial grading)");

/* ---- 1. AutoGrader.grade(session, { answeredOnly: true }) ------------ */
console.log("\n[1] AutoGrader.grade — answeredOnly 只計算已作答題目");
{
  const { window } = loadPage("quiz.html");
  const AHS = window.AHS;
  const examId = "finish_early_test_1";
  AHS.QuestionRuntime.importQuestions(examId, tenQuestions());
  const session = AHS.ExamRuntime.startFromExam(examId, { subject: "math", title: "測試教材" });
  /* Answer only 3 of 10 (2 correct, 1 wrong) — matches user's own example. */
  AHS.AnswerRuntime.saveAnswer(session.examId, "q1", "A"); /* correct */
  AHS.AnswerRuntime.saveAnswer(session.examId, "q2", "A"); /* correct */
  AHS.AnswerRuntime.saveAnswer(session.examId, "q3", "B"); /* wrong */
  const finished = AHS.ExamRuntime.finish(session.examId);
  const graded = AHS.AutoGrader.grade(finished, { answeredOnly: true });

  check("graded 不為 null", !!graded);
  check("totalCount 僅為已作答的 3 題（非全部 10 題）", graded.totalCount === 3);
  check("correctCount 正確為 2", graded.correctCount === 2);
  check("results 只含 q1/q2/q3，不含未作答的 q4~q10", graded.results.length === 3 &&
    graded.results.every((r) => ["q1", "q2", "q3"].indexOf(r.questionId) !== -1));
  check("wrong 只含真正答錯的 q3（未作答的題目不算入 wrong）", graded.wrong.length === 1 && graded.wrong[0].questionId === "q3");
  check("accuracy 以 3 題為分母計算（2/3 = 67%），非以 10 題為分母", graded.accuracy === Math.round((2 / 3) * 100));
}

/* ---- 2. Existing callers (no opts) — byte-for-byte unchanged --------- */
console.log("\n[2] AutoGrader.grade — 既有呼叫方式（無 opts）行為完全不變");
{
  const { window } = loadPage("quiz.html");
  const AHS = window.AHS;
  const examId = "finish_early_test_2";
  AHS.QuestionRuntime.importQuestions(examId, tenQuestions());
  const session = AHS.ExamRuntime.startFromExam(examId, { subject: "math", title: "測試教材" });
  AHS.AnswerRuntime.saveAnswer(session.examId, "q1", "A");
  AHS.AnswerRuntime.saveAnswer(session.examId, "q2", "A");
  AHS.AnswerRuntime.saveAnswer(session.examId, "q3", "B");
  const finished = AHS.ExamRuntime.finish(session.examId);
  const graded = AHS.AutoGrader.grade(finished);

  check("totalCount 仍為全部 10 題（未作答視為答錯，計入總數）", graded.totalCount === 10);
  check("correctCount 仍為 2", graded.correctCount === 2);
  check("wrong 含 1 題答錯 + 7 題未作答，共 8 題", graded.wrong.length === 8);
}

/* ---- 3. answeredOnly with zero answered -> null ----------------------- */
console.log("\n[3] AutoGrader.grade — answeredOnly 且完全未作答 -> null（無真實內容可記錄）");
{
  const { window } = loadPage("quiz.html");
  const AHS = window.AHS;
  const examId = "finish_early_test_3";
  AHS.QuestionRuntime.importQuestions(examId, tenQuestions());
  const session = AHS.ExamRuntime.startFromExam(examId, { subject: "math", title: "測試教材" });
  const finished = AHS.ExamRuntime.finish(session.examId);
  const graded = AHS.AutoGrader.grade(finished, { answeredOnly: true });
  check("完全未作答時 graded 為 null", graded === null);
}

/* ---- 4. End-to-end: finishExamEarly-equivalent flow ------------------- */
console.log("\n[4] 端對端 — 提前完成流程真實記錄到 WrongBook/History/KnowledgeMastery/Review");
{
  const { window, consoleErrors } = loadPage("quiz.html");
  const AHS = window.AHS;
  const examId = "finish_early_test_4";
  AHS.QuestionRuntime.importQuestions(examId, tenQuestions());
  const session = AHS.ExamRuntime.startFromExam(examId, { subject: "math", title: "測試教材" });
  AHS.AnswerRuntime.saveAnswer(session.examId, "q1", "A"); /* correct */
  AHS.AnswerRuntime.saveAnswer(session.examId, "q2", "B"); /* wrong */
  AHS.AnswerRuntime.saveAnswer(session.examId, "q3", "B"); /* wrong */

  const finished = AHS.ExamRuntime.finish(session.examId);
  const graded = AHS.AutoGrader.grade(finished, { answeredOnly: true });
  check("graded 真實產生（3 題已作答）", !!graded && graded.totalCount === 3);

  AHS.WrongBookRuntime.sync(graded);
  AHS.HistoryRuntime.record(graded);
  if (AHS.KnowledgeMasteryRuntime) { AHS.KnowledgeMasteryRuntime.recordGraded(graded); }

  const review = AHS.ReviewRuntime.build(session.examId);
  check("ReviewRuntime.build() 真實產生（讀取剛才 answeredOnly 的 graded cache）", !!review);
  check("Review 視圖只顯示已作答的 3 題（不含未作答的 7 題）", review.totalCount === 3);
  check("Review 正確率以 3 題為分母（1/3）", review.accuracy === Math.round((1 / 3) * 100));

  const wrongList = AHS.WrongBookRuntime.list();
  const wrongIds = wrongList.map((w) => w.questionId);
  check("WrongBookRuntime 真實記錄了本次答錯的 q2/q3", wrongIds.indexOf("q2") !== -1 && wrongIds.indexOf("q3") !== -1);
  check("WrongBookRuntime 沒有記錄未作答的 q4~q10（未作答不等於答錯）",
    ["q4", "q5", "q6", "q7", "q8", "q9", "q10"].every((id) => wrongIds.indexOf(id) === -1));

  check("整個流程 0 console error", consoleErrors.length === 0);
}

console.log("\nFinishEarlyRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
