/* tests/regression/MixedSourceExamRegression.js — 2026-10-01, rewritten 2026-10-27.

   Materials whose questions come from more than one source (原始試卷
   ORIGINAL + AI_GENERATED／PAST_EXAM 補充題庫) used to open a 原始試卷 /
   AI 練習 split; the split loaded a whole variant (e.g. 77 題) as 平時練習.
   2026-10-27 (使用者要求合併): one merged question set per material.
   Verifies, on real data:
   - 開始測驗 on a mixed material draws ONE 平時練習 set of at most 20
     from the merged bank (__formal_), with no 原始試卷／AI 練習 toggle;
   - over repeated draws both sources appear (merged, not split);
   - the session carries the material's subject.

   Run: node tests/regression/MixedSourceExamRegression.js */
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

function loadPage(htmlFile, workspace) {
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const vconsole = new (require("jsdom").VirtualConsole)();
  const consoleErrors = [];
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    const s = String((e && e.message) || e);
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) { return; }
    consoleErrors.push(s);
  });
  const dom = new JSDOM(html, { url: "https://ahs.test/" + htmlFile, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vconsole });
  const { window } = dom;
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify(workspace || { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] }));
  [...window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (fs.existsSync(p)) { window.eval(fs.readFileSync(p, "utf8")); }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, doc: window.document, consoleErrors };
}
function click(node) { node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true })); }
function rowFor(doc, text) { return [...doc.querySelectorAll(".quiz-row")].find((r) => r.textContent.indexOf(text) !== -1); }

console.log("MixedSourceExam Regression — 原題＋補充題合併為同一份題庫");

function checkMerged(label, workspace, rowText, sourceRe) {
  const pg = loadPage("quiz.html", workspace);
  click(rowFor(pg.doc, rowText).querySelector(".quiz-row__start"));
  const s1 = pg.window.AHS.ExamRuntime.getCurrent();
  const qs = s1 ? pg.window.AHS.QuestionRuntime.getSet(s1.examId) : [];
  check(label + "：平時練習抽一組（__formal_），最多 20 題", !!s1 && /__formal_\d+$/.test(s1.examId) && qs.length > 0 && qs.length <= 20);
  check(label + "：不顯示「原始試卷／AI 練習」切換", pg.doc.querySelectorAll(".qexam__mode-btn").length === 0 && !!pg.doc.querySelector(".qcard"));
  const base = s1.examId.replace(/__formal_\d+$/, "");
  const sources = {};
  qs.concat(...Array.from({ length: 12 }, () => pg.window.AHS.QuestionBankRuntime.drawCycle(base, 20)))
    .forEach((q) => { sources[q.questionSource === "ORIGINAL" ? "orig" : "extra"] = true; });
  check(label + "：原題與補充題都出現在同一份題庫", !!sources.orig && !!sources.extra);
  check(label + "：沒有 __original／__ai 分流題庫", !pg.window.AHS.QuestionRuntime.hasExam(base + "__original") && !pg.window.AHS.QuestionRuntime.hasExam(base + "__ai"));
  if (sourceRe) { check(label + "：抽到的題目都屬於這份教材", qs.every((q) => sourceRe.test(q.id))); }
  check(label + "：Console errors = 0", pg.consoleErrors.length === 0);
  return s1;
}

const s1 = checkMerged("tm_1（數學 正弦定理）", undefined, "正弦定理", /^tm_(1|18|27)_q/);
check("測驗帶有科目（數學）", s1.subject === "math");
checkMerged("tm_29（竹圍 化學 氣體）", { studentId: "student_c", schoolId: "zwsh", semesterIds: ["g2s1"] }, "第二章：氣體", /^tm_(29|30|31|32)_q/);
checkMerged("tm_7（長榮 數學 三角函數）", { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] }, "第1章：三角函數", null);

/* single-source material (tm_2, ORIGINAL only) keeps the drawn set */
{
  const second = loadPage("quiz.html");
  click(rowFor(second.doc, "演化與生物分類").querySelector(".quiz-row__start"));
  const s2 = second.window.AHS.ExamRuntime.getCurrent();
  check("只有一種題目來源的教材照常抽題（__formal_）", !!s2 && /__formal_\d+$/.test(s2.examId));
}

console.log("\nMixedSourceExamRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
