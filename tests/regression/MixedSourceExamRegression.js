/* tests/regression/MixedSourceExamRegression.js — 2026-10-01.

   tm_1 is an exam paper (ORIGINAL questions) that now also has a 補充題庫
   (tm_18, AI_GENERATED). Assessment Mode says the two are never mixed in
   one exam ("不得混用"). Verifies, on real data (高一下 g1s2):
   - 開始測驗 on tm_1 opens its 原始試卷 variant: only ORIGINAL questions;
   - the 原始試卷 / AI 練習 toggle is shown, and AI 練習 has only AI questions;
   - the variant sessions carry the material's subject (they used to start
     without meta and crash the exam view);
   - a single-source material still gets the usual drawn 平時練習 set.

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

console.log("MixedSourceExam Regression — 原題＋補充題的教材不混用");
const { window, doc, consoleErrors } = loadPage("quiz.html");
const AHS = window.AHS;

click(rowFor(doc, "正弦定理").querySelector(".quiz-row__start"));
let session = AHS.ExamRuntime.getCurrent();
check("tm_1 開始測驗：進入原始試卷", !!session && /__original$/.test(session.examId) && !!doc.querySelector(".qcard"));
let qs = AHS.QuestionRuntime.getSet(session.examId);
check("原始試卷只有原題（ORIGINAL）", qs.length > 0 && qs.every((q) => q.questionSource === "ORIGINAL"));
check("測驗帶有科目（數學）", session.subject === "math");
const toggle = [...doc.querySelectorAll(".qexam__mode-btn")].map((b) => b.textContent);
/* 2026-10-02: tm_1's practice side now holds AI questions (tm_18) and past
   學測數學A questions (tm_27), so the toggle reads 「補充練習（AI＋歷屆試題）」. */
check("顯示「原始試卷／補充練習（AI＋歷屆試題）」切換", toggle.length === 2 && toggle[0].indexOf("原始試卷") !== -1 &&
  toggle[1].indexOf("補充練習（AI＋歷屆試題）") !== -1);

click([...doc.querySelectorAll(".qexam__mode-btn")][1]);
session = AHS.ExamRuntime.getCurrent();
qs = AHS.QuestionRuntime.getSet(session.examId);
check("切到補充練習：只有 AI 題與歷屆試題（含 tm_18、tm_27），沒有原題", /__ai$/.test(session.examId) && qs.length >= 14 &&
  qs.every((q) => q.questionSource === "AI_GENERATED" || q.questionSource === "PAST_EXAM") &&
  qs.some((q) => /^tm_18_q/.test(q.id)) && qs.some((q) => /^tm_27_q/.test(q.id)));
check("補充練習也帶有科目", session.subject === "math" && !!doc.querySelector(".qcard"));
check("Console errors = 0", consoleErrors.length === 0);

/* single-source material (tm_2, ORIGINAL only) keeps the drawn set */
{
  const second = loadPage("quiz.html");
  click(rowFor(second.doc, "演化與生物分類").querySelector(".quiz-row__start"));
  const s2 = second.window.AHS.ExamRuntime.getCurrent();
  check("只有一種題目來源的教材照常抽題（__formal_）", !!s2 && /__formal_\d+$/.test(s2.examId));
  check("不顯示切換", second.doc.querySelectorAll(".qexam__mode-btn").length === 0);
}

/* 2026-10-04: tm_29（竹圍高中化學課本 第二章 氣體）本身是 AI 題；課本原題放在補充題庫
   tm_30（ORIGINAL），另有 AI 加題 tm_31 與歷屆試題 tm_32。原始試卷只出課本原題。 */
{
  const zw = loadPage("quiz.html", { studentId: "student_c", schoolId: "zwsh", semesterIds: ["g2s1"] });
  click(rowFor(zw.doc, "第二章：氣體").querySelector(".quiz-row__start"));
  const s3 = zw.window.AHS.ExamRuntime.getCurrent();
  const orig = zw.window.AHS.QuestionRuntime.getSet(s3.examId);
  check("tm_29 原始試卷：只抽課本原題（tm_30）", /__original$/.test(s3.examId) && orig.length >= 10 &&
    orig.every((q) => q.questionSource === "ORIGINAL" && /^tm_30_q/.test(q.id)));
  click([...zw.doc.querySelectorAll(".qexam__mode-btn")][1]);
  const s4 = zw.window.AHS.ExamRuntime.getCurrent();
  const extra = zw.window.AHS.QuestionRuntime.getSet(s4.examId);
  check("tm_29 補充練習：原 AI 題＋AI 加題（tm_31）＋歷屆試題（tm_32），共 36 題", /__ai$/.test(s4.examId) && extra.length === 36 &&
    extra.some((q) => /^tm_31_q/.test(q.id)) && extra.filter((q) => q.questionSource === "PAST_EXAM").length === 6);
  check("竹圍高中 Console errors = 0", zw.consoleErrors.length === 0);
}

console.log("\nMixedSourceExamRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
