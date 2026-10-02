/* tests/regression/QuestionReferenceRegression.js — 2026-10-02 題目出處、歷屆試題與對應課程.

   Verifies:
   - every 補充題庫 question merged into a material carries a reference (出處);
   - past national exam questions (questionSource PAST_EXAM) name the exam,
     year, subject and question number, keep their official option order
     (never shuffled by AHS.OptionOrder), and map to at least a lesson (課)
     of the textbook: 對應課程 + optional 節次 + 完全/部分對應 + reason;
   - AHS.QuestionReference shows 「出處：…」 (with a 「歷屆試題」 badge) and
     「對應：課 · 節」 (plus the extra concepts needed for 部分對應), and
     finds both for old records that lack them;
   - tm_4's past exam questions (tm_21) are archived — tm_4 is a
     multi-lesson exam paper whose lessons can't be told apart — so tm_4
     keeps its usual single-source 平時練習 without a toggle;
   - the schema and validator accept PAST_EXAM and require reference and
     a lesson mapping.

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

console.log("QuestionReference Regression — 題目出處、歷屆試題與對應課程");

console.log("\n[1] 資料");
global.window = global;
require(path.join(REPO, "js/data/TeachingMaterialData.js"));
const all = AHS.TeachingMaterialData.flatMap((e) => e.questions);
const supplement = all.filter((q) => q.supplementId);
check("補充題庫的題目全部都有出處", supplement.length >= 42 && supplement.every((q) => q.reference && q.reference.trim()));
const past = all.filter((q) => q.questionSource === "PAST_EXAM");
check("歷屆試題 11 題，全部來自補充題庫（tm_4 的 6 題已封存）", past.length === 11 && past.every((q) => q.supplementId));
check("出處寫明年度、考試、考科、題號與出題單位（學測社會、學測數學A、分科化學）",
  past.every((q) => /^11[1-4]學年度(學科能力測驗 (社會|數學A)|分科測驗 化學)考科 第\d+題（.*大考中心）$/.test(q.reference)));
check("詳解註明由 AI 撰寫", past.every((q) => /^（詳解為 AI 撰寫）/.test(q.explanation)));
check("每題都對應到課（對應課程＋完全／部分對應＋理由）",
  past.every((q) => q.mapping && /^第(\d|[一二三四五六七八九十])章 |^第[一二三四]冊 第\d章 /.test(q.mapping.lesson) &&
    /^(完全|部分)對應$/.test(q.mapping.fit) && q.mapping.note));
check("部分對應的題目寫出另需的觀念", past.filter((q) => q.mapping.fit === "部分對應").length === 3 &&
  past.filter((q) => q.mapping.fit === "部分對應").every((q) => q.mapping.note.length > 10));
const byParent = {};
past.forEach((q) => { byParent[q.materialId] = (byParent[q.materialId] || 0) + 1; });
check("併入 tm_1／tm_8／tm_9／tm_13／tm_15／tm_16",
  JSON.stringify(byParent) === JSON.stringify({ tm_1: 2, tm_13: 2, tm_15: 2, tm_16: 1, tm_8: 2, tm_9: 2 }));
const tm21 = JSON.parse(fs.readFileSync(path.join(REPO, "docs/TeachingMaterials/materials/tm_21/manifest.json"), "utf8"));
check("tm_21（tm_4 的歷屆試題）已封存，題目檔案保留",
  tm21.archived === true && fs.existsSync(path.join(REPO, "docs/TeachingMaterials/materials/tm_21/questionbank.json")));
require(path.join(REPO, "js/utils/OptionOrder.js"));
const L = ["A", "B", "C", "D", "E"];
check("維持官方選項順序（不打亂）",
  past.every((q) => AHS.OptionOrder.order({ id: q.id, options: q.options.map((t, i) => ({ key: L[i], text: t })) }).every((o, i) => o.key === L[i])));

console.log("\n[2] 顯示");
{
  const { window } = loadPage("wrongbook.html", "g2s1");
  const QR = window.AHS.QuestionReference;
  const full = past.find((q) => q.mapping.fit === "完全對應" && q.mapping.section);
  const pf = QR.node(full);
  check("歷屆試題：標籤、出處、對應課節",
    !!pf && pf.classList.contains("qref--past") &&
    pf.textContent === "歷屆試題出處：" + full.reference + "對應：" + full.mapping.lesson + " · " + full.mapping.section);
  const partial = past.find((q) => q.mapping.fit === "部分對應");
  check("部分對應註明另需的觀念", QR.node(partial).querySelector(".qref__map").textContent.indexOf("（部分對應：" + partial.mapping.note) !== -1);
  const ai = supplement.find((q) => q.questionSource === "AI_GENERATED");
  check("AI 補充題顯示出處（無歷屆標籤、無對應行）",
    QR.node(ai).textContent === "出處：" + ai.reference && !QR.node(ai).querySelector(".qref__badge") && !QR.node(ai).querySelector(".qref__map"));
  check("舊紀錄沒有 reference 時，用 questionId 找回出處與對應", QR.of({ questionId: past[1].id, question: "x" }).mapping.lesson === past[1].mapping.lesson);
  check("舊紀錄沒有 questionId 時，用題目文字找回出處", QR.of({ question: past[2].question }).text === past[2].reference);
  const own = all.find((q) => !q.reference && !q.supplementId);
  check("教材本身的題目不顯示出處", QR.node({ id: own.id, question: own.question }) === null);
}

console.log("\n[3] 測驗中心");
{
  const { window, doc, consoleErrors } = loadPage("quiz.html", "g1s2");
  const row = [...doc.querySelectorAll(".quiz-row")].find((r) => r.textContent.indexOf("全球化與國際分工") !== -1);
  click(row.querySelector(".quiz-row__start"));
  const s4 = window.AHS.ExamRuntime.getCurrent();
  check("tm_4 照常平時練習（只有原題、沒有切換）", /__formal_\d+$/.test(s4.examId) &&
    window.AHS.QuestionRuntime.getSet(s4.examId).every((q) => q.questionSource === "ORIGINAL") && !doc.querySelector(".qexam__mode-btn"));
  check("Console errors = 0（高一下）", consoleErrors.length === 0);
}
{
  const { window, doc, consoleErrors } = loadPage("quiz.html", "g2s1");
  const idMap = window.AHS.PersistenceAdapter.load("teachingMaterialLoaderIdMap") || {};
  const examId = "teaching_material_" + idMap.tm_9;
  const q = window.AHS.QuestionRuntime.getSet(examId).find((x) => x.id === "tm_23_q2");
  check("tm_9 的題目裡有歷屆試題（帶對應資料）", !!q && q.questionSource === "PAST_EXAM" && q.mapping && q.mapping.fit === "完全對應");
  const card = window.AHS.QuestionCard.create(q, null, function () {});
  doc.body.appendChild(card);
  const map = card.querySelector(".qref__map");
  check("題卡顯示「對應：第2章 需求與供給 · 第3節 供給」",
    !!card.querySelector(".qref--past") && !!map && map.textContent === "對應：第2章 需求與供給 · 第3節 供給");
  check("Console errors = 0（高二上）", consoleErrors.length === 0);
}

console.log("\n[4] Schema 與驗證");
{
  const schema = JSON.parse(fs.readFileSync(path.join(REPO, "docs/TeachingMaterials/schema/QuestionBank.schema.json"), "utf8"));
  const props = schema.properties.questions.items.properties;
  check("Schema：PAST_EXAM／Past Exam／reference／mapping",
    props.questionSource.enum.indexOf("PAST_EXAM") !== -1 && props.origin.enum.indexOf("Past Exam") !== -1 && !!props.reference &&
    JSON.stringify(props.mapping.required) === JSON.stringify(["lesson", "fit"]));
  const validator = fs.readFileSync(path.join(REPO, "docs/TeachingMaterials/scripts/ValidateMaterial.js"), "utf8");
  check("驗證：PAST_EXAM 必須有出處，且至少對應到課", /PAST_EXAM carries a reference/.test(validator) && /PAST_EXAM maps to a lesson/.test(validator));
}

console.log("\nQuestionReferenceRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
