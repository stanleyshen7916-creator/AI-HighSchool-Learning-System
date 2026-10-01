/* tests/regression/QuestionReferenceRegression.js — 2026-10-02 題目出處與歷屆試題.

   Verifies:
   - every 補充題庫 question merged into a material carries a reference (出處);
   - past national exam questions (questionSource PAST_EXAM) all name the
     exam, year, subject and question number, and keep their official
     option order (never shuffled by AHS.OptionOrder);
   - AHS.QuestionReference shows 「出處：…」 (with a 「歷屆試題」 badge for
     PAST_EXAM) and finds the reference for old records that lack it;
   - 測驗中心: tm_4 (an exam paper) opens 原始試卷, its practice side is
     labelled 「歷屆試題練習」 and shows the past exam questions with 出處;
   - the schema and validator accept PAST_EXAM and require its reference.

   Run: node tests/regression/QuestionReferenceRegression.js */
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

function loadPage(htmlFile, semester) {
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
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: "student_a", schoolId: "cjsh", semesterIds: [semester] }));
  [...window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (fs.existsSync(p)) { window.eval(fs.readFileSync(p, "utf8")); }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, doc: window.document, consoleErrors };
}
function click(node) { node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true })); }

console.log("QuestionReference Regression — 題目出處與歷屆試題");

console.log("\n[1] 資料");
global.window = global;
require(path.join(REPO, "js/data/TeachingMaterialData.js"));
const all = AHS.TeachingMaterialData.flatMap((e) => e.questions);
const supplement = all.filter((q) => q.supplementId);
check("補充題庫的題目全部都有出處", supplement.length >= 48 && supplement.every((q) => q.reference && q.reference.trim()));
const past = all.filter((q) => q.questionSource === "PAST_EXAM");
check("歷屆試題 13 題，全部來自補充題庫", past.length === 13 && past.every((q) => q.supplementId));
check("歷屆試題出處寫明年度、考試、考科、題號與出題單位",
  past.every((q) => /^11[34]學年度學科能力測驗 社會考科 第\d+題（.*大考中心）$/.test(q.reference)));
check("歷屆試題的詳解註明由 AI 撰寫", past.every((q) => /^（詳解為 AI 撰寫）/.test(q.explanation)));
const byParent = {};
past.forEach((q) => { byParent[q.materialId] = (byParent[q.materialId] || 0) + 1; });
check("歷屆試題併入 tm_4／tm_8／tm_9／tm_15／tm_16", JSON.stringify(byParent) === JSON.stringify({ tm_15: 2, tm_16: 1, tm_4: 6, tm_8: 2, tm_9: 2 }));
require(path.join(REPO, "js/utils/OptionOrder.js"));
const L = ["A", "B", "C", "D"];
check("歷屆試題維持官方選項順序（不打亂）",
  past.every((q) => AHS.OptionOrder.order({ id: q.id, options: q.options.map((t, i) => ({ key: L[i], text: t })) }).every((o, i) => o.key === L[i])));

console.log("\n[2] 顯示");
{
  const { window } = loadPage("wrongbook.html", "g2s1");
  const QR = window.AHS.QuestionReference;
  const p = QR.node(past[0]);
  check("歷屆試題顯示「歷屆試題」標籤與出處", !!p && p.classList.contains("qref--past") && p.textContent === "歷屆試題出處：" + past[0].reference);
  const ai = supplement.find((q) => q.questionSource === "AI_GENERATED");
  check("AI 補充題顯示出處（無歷屆標籤）", QR.node(ai).textContent === "出處：" + ai.reference && !QR.node(ai).querySelector(".qref__badge"));
  check("舊紀錄沒有 reference 時，用 questionId 找回出處", QR.of({ questionId: past[1].id, question: "x" }).text === past[1].reference);
  check("舊紀錄沒有 questionId 時，用題目文字找回出處", QR.of({ question: past[2].question }).text === past[2].reference);
  const own = all.find((q) => !q.reference && !q.supplementId);
  check("教材本身的題目不顯示出處", QR.node({ id: own.id, question: own.question }) === null);
}

console.log("\n[3] 測驗中心：tm_4（考卷）＋歷屆試題");
{
  const { window, doc, consoleErrors } = loadPage("quiz.html", "g1s2");
  const AHSw = window.AHS;
  const row = [...doc.querySelectorAll(".quiz-row")].find((r) => r.textContent.indexOf("全球化與國際分工") !== -1);
  click(row.querySelector(".quiz-row__start"));
  let s = AHSw.ExamRuntime.getCurrent();
  check("tm_4 先進入原始試卷（只有原題）", /__original$/.test(s.examId) && AHSw.QuestionRuntime.getSet(s.examId).every((q) => q.questionSource === "ORIGINAL"));
  const labels = [...doc.querySelectorAll(".qexam__mode-btn")].map((b) => b.textContent);
  check("練習側標示為「歷屆試題練習」", labels.length === 2 && labels[1].indexOf("歷屆試題練習") !== -1);
  click([...doc.querySelectorAll(".qexam__mode-btn")][1]);
  s = AHSw.ExamRuntime.getCurrent();
  const qs = AHSw.QuestionRuntime.getSet(s.examId);
  check("切換後是 6 題歷屆試題", /__ai$/.test(s.examId) && qs.length === 6 && qs.every((q) => q.questionSource === "PAST_EXAM"));
  const ref = doc.querySelector(".qcard .qref--past");
  check("題目下方顯示出處（大考中心）", !!ref && ref.textContent.indexOf("學年度學科能力測驗 社會考科") !== -1);
  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\n[4] Schema 與驗證");
{
  const schema = JSON.parse(fs.readFileSync(path.join(REPO, "docs/TeachingMaterials/schema/QuestionBank.schema.json"), "utf8"));
  const props = schema.properties.questions.items.properties;
  check("Schema：questionSource 含 PAST_EXAM、origin 含 Past Exam、有 reference 欄位",
    props.questionSource.enum.indexOf("PAST_EXAM") !== -1 && props.origin.enum.indexOf("Past Exam") !== -1 && !!props.reference);
  const validator = fs.readFileSync(path.join(REPO, "docs/TeachingMaterials/scripts/ValidateMaterial.js"), "utf8");
  check("驗證：PAST_EXAM 必須有出處", /PAST_EXAM carries a reference/.test(validator));
}

console.log("\nQuestionReferenceRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
