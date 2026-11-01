/* tests/regression/ExamPeriodRegression.js — 2026-11-01 使用者需求：「第一次月考已結束，
   目前上傳均為第二次月考的範圍，在所有內容中均須加以區分出來，便於複習」；
   第二次月考範圍：國文 5–8 課、歷史 3–4 章、地球科學單元3 地質（另含數學第3章、英文 L4–6）。
   Verifies with the real 長榮高二上 workspace (cjsh / g2s1):
   - AHS.ExamPeriod classifies real packages (tm_94 第二次、tm_7 第一次、竹圍 tm_90 無設定)
     and question ids / wrong-book records;
   - 平時練習 shows a 月考範圍 filter and per-row tags, and the filter really narrows the list;
   - 教材中心 cards carry the 月考範圍 badge;
   - 模擬月考 defaults to the current exam (第二次月考) materials when no range is set.
   Run: node tests/regression/ExamPeriodRegression.js */
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

const DEFAULT_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] };

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
  Object.entries(seed).forEach(([k, v]) => window.sessionStorage.setItem(k, JSON.stringify(v)));
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
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


console.log("ExamPeriod Regression — 第一次／第二次月考範圍");

console.log("\n[1] AHS.ExamPeriod 分類");
{
  const { window } = loadPage("quiz.html");
  const E = window.AHS.ExamPeriod;
  const m = (id) => (E.ofMaterialId(id) || {}).label || null;
  ["tm_84", "tm_85", "tm_86", "tm_92", "tm_98", "tm_99", "tm_100", "tm_94", "tm_95", "tm_96", "tm_97"].forEach((id) =>
    check(id + " 是第二次月考", m(id) === "第二次月考"));
  ["tm_7", "tm_12", "tm_17", "tm_15", "tm_16", "tm_62", "tm_83"].forEach((id) =>
    check(id + " 是第一次月考", m(id) === "第一次月考"));
  check("舊版教材庫的國文第一課（chinese-g11-laoshan-daoshi）是第一次月考", m("chinese-g11-laoshan-daoshi") === "第一次月考");
  check("竹圍 tm_90 沒有設定月考範圍（不顯示標籤）", E.ofMaterialId("tm_90") === null);
  check("題目編號 tm_95_q3 → 第二次月考", (E.ofQuestionId("tm_95_q3") || {}).label === "第二次月考");
  check("錯題紀錄依題目編號判斷", (E.ofWrongItem({ questionId: "tm_7_q1" }) || {}).label === "第一次月考");
  const opts = E.workspaceOptions().map((o) => o.label);
  check("篩選選項：目前的第二次月考排第一，第一次標示已結束", JSON.stringify(opts) === JSON.stringify(["第二次月考", "第一次月考（已結束）"]));
}

console.log("\n[2] 平時練習：月考範圍篩選與標籤");
{
  const { window, consoleErrors } = loadPage("quiz.html");
  const doc = window.document;
  const sel = [...doc.querySelectorAll(".quiz-select")].find((l) => l.querySelector(".quiz-select__label").textContent === "月考範圍");
  check("有「月考範圍」篩選", !!sel);
  const rows = () => [...doc.querySelectorAll(".quiz-row")];
  const tagOf = (r) => { const t = r.querySelector(".quiz-row__tag--period"); return t ? t.textContent : null; };
  const all = rows();
  const m2 = all.filter((r) => tagOf(r) === "第二次月考");
  const m1 = all.filter((r) => tagOf(r) === "第一次月考");
  check("清單同時有第一次與第二次月考的教材", m2.length > 0 && m1.length > 0);
  check("第二次月考的標籤醒目（is-current）", m2.every((r) => r.querySelector(".quiz-row__tag--period").classList.contains("is-current")));
  if (sel) {
    const s = sel.querySelector("select");
    s.value = "第二次月考"; s.dispatchEvent(new window.Event("change", { bubbles: true }));
    const after = rows();
    check("選「第二次月考」後只剩第二次月考的教材", after.length === m2.length && after.every((r) => tagOf(r) === "第二次月考"));
    s.value = "第一次月考（已結束）"; s.dispatchEvent(new window.Event("change", { bubbles: true }));
    const after1 = rows();
    check("選「第一次月考」後只剩第一次月考的教材", after1.length === m1.length && after1.every((r) => tagOf(r) === "第一次月考"));
  }
  check("Console errors = 0（quiz.html）", consoleErrors.length === 0);
}

console.log("\n[3] 教材中心：卡片顯示月考範圍");
{
  const { window, consoleErrors } = loadPage("materials.html");
  const badges = [...window.document.querySelectorAll(".mat-card__period")].map((b) => b.textContent);
  check("卡片上有「第二次月考」標籤", badges.includes("第二次月考"));
  check("卡片上有「第一次月考（已結束）」標籤", badges.includes("第一次月考（已結束）"));
  check("Console errors = 0（materials.html）", consoleErrors.length === 0);
}

console.log("\n[4] 模擬月考：預設範圍為第二次月考");
{
  const { window } = loadPage("monthexam.html");
  const RT = window.AHS.MonthExamRuntime;
  const r = RT.getRange("國文");
  check("國文預設範圍來源是「目前月考」", r.source === "period" && r.periodLabel === "第二次月考");
  check("國文預設範圍正好是第五～八課（tm_94～tm_97）", JSON.stringify(r.materialIds.slice().sort()) === JSON.stringify(["tm_94", "tm_95", "tm_96", "tm_97"]));
  const h = RT.getRange("歷史");
  check("歷史預設範圍是第3、4章（tm_85、tm_86）", JSON.stringify(h.materialIds.slice().sort()) === JSON.stringify(["tm_85", "tm_86"]));
}

console.log("\n[5] 知識弱點：月考範圍篩選與錯題標籤");
{
  /* 在 quiz.html 用真實的 Exam -> AutoGrader -> WrongBookRuntime 產生兩筆錯題：
     一題來自第二次月考（tm_94），一題來自第一次月考（tm_7）。 */
  const quiz = loadPage("quiz.html");
  const A = quiz.window.AHS;
  A.QuestionRuntime.importQuestions("exam_period_test", [
    { id: "tm_94_q1", index: 1, text: "第二次月考的題目", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A", knowledgePoint: "燭之武的說服策略", explanation: "詳解" },
    { id: "tm_7_q1", index: 2, text: "第一次月考的題目", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A", knowledgePoint: "弧度量", explanation: "詳解" }
  ]);
  const ses = A.ExamRuntime.startFromExam("exam_period_test", { subject: "chinese", title: "測試" });
  A.AnswerRuntime.saveAnswer(ses.examId, "tm_94_q1", "B");
  A.AnswerRuntime.saveAnswer(ses.examId, "tm_7_q1", "B");
  A.WrongBookRuntime.sync(A.AutoGrader.grade(A.ExamRuntime.finish(ses.examId)));
  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: dumpSession(quiz.window) });
  const doc = window.document;
  const sel = [...doc.querySelectorAll(".wb-select")].find((l) => l.querySelector(".wb-select__label").textContent === "月考範圍");
  check("知識弱點有「月考範圍」篩選", !!sel);
  const visibleMeta = () => [...doc.querySelectorAll(".wb-row")].filter((r) => r.style.display !== "none").map((r) => r.querySelector(".wb-row__meta").textContent);
  const metas = visibleMeta();
  check("錯題列標示月考範圍（第二次月考｜燭之武的說服策略）", metas.includes("第二次月考｜燭之武的說服策略"));
  check("錯題列標示月考範圍（第一次月考｜弧度量）", metas.includes("第一次月考｜弧度量"));
  if (sel) {
    const s = sel.querySelector("select");
    s.value = "第二次月考"; s.dispatchEvent(new window.Event("change", { bubbles: true }));
    check("選「第二次月考」只剩第二次月考的錯題", JSON.stringify(visibleMeta()) === JSON.stringify(["第二次月考｜燭之武的說服策略"]));
  }
  check("Console errors = 0（wrongbook.html）", consoleErrors.length === 0);
}

console.log("\nExamPeriodRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
