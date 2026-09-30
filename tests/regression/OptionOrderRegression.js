/* tests/regression/OptionOrderRegression.js — 2026-09-30 選項顯示順序.

   tm_16 / tm_17 had the correct answer as option A in 22 of 22 questions.
   Verifies AHS.OptionOrder and its use in 測驗中心 (QuestionCard) and
   知識弱點 (WrongBook detail):
   - only package-track AI_GENERATED questions without self-labelled or
     positional options are shuffled; original exam questions, "(1) …"
     options, 「以上皆非」 and repository-track questions keep their order;
   - the order is fixed per question id (same on every render/page);
   - tm_16 / tm_17 no longer show the correct answer first every time;
   - clicking a displayed option reports the ORIGINAL key; the letters the
     student sees in 知識弱點 are the same display letters as in 測驗中心;
   - the teaching-material data itself is not modified.

   Run: node tests/regression/OptionOrderRegression.js */
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

global.window = global;
require(path.join(REPO, "js/data/TeachingMaterialData.js"));
const dataBefore = JSON.stringify(AHS.TeachingMaterialData);
require(path.join(REPO, "js/utils/OptionOrder.js"));
const OO = AHS.OptionOrder;
const L = ["A", "B", "C", "D", "E"];
const byId = {};
AHS.TeachingMaterialData.forEach((e) => e.questions.forEach((q) => { byId[q.id] = q; }));
function asQuestion(id) {
  const q = byId[id];
  return { id: id, options: q.options.map((t, i) => ({ key: L[i], text: t })), correctAnswer: L[q.options.indexOf(q.answer)] };
}
function shuffled(q) { return OO.order(q).some((o, i) => o.key !== L[i]); }

console.log("OptionOrder Regression — 選項顯示順序");

console.log("\n[1] 哪些題目會打亂");
{
  const original = AHS.TeachingMaterialData.flatMap((e) => e.questions).find((q) => q.questionSource === "ORIGINAL" && q.options && q.options.length >= 3);
  check("原始考卷題（ORIGINAL）維持原順序", !!original && !shuffled({ id: original.id, options: original.options }));
  check("選項自帶編號（tm_1_q1「(1) …」）維持原順序", !shuffled({ id: "tm_1_q1", options: byId.tm_1_q1.options }));
  check("「兩者皆是」這類選項（tm_16_q6）維持原順序", !shuffled(asQuestion("tm_16_q6")));
  check("非教材包題目（教材庫 id）維持原順序",
    !shuffled({ id: "english-g11-day-i-broke-the-rules-q1", options: [{ key: "A", text: "x" }, { key: "B", text: "y" }, { key: "C", text: "z" }] }));
  check("兩個選項（是非題）不打亂", !shuffled({ id: "tm_17_q1", options: [{ key: "A", text: "對" }, { key: "B", text: "錯" }] }));
  check("tm_17_q1（AI 出題、一般文字選項）會打亂", shuffled(asQuestion("tm_17_q1")));
}

console.log("\n[2] 固定順序、答案位置不再集中在 A");
{
  check("同一題每次順序都相同", JSON.stringify(OO.order(asQuestion("tm_17_q3"))) === JSON.stringify(OO.order(asQuestion("tm_17_q3"))));
  ["tm_16", "tm_17"].forEach((m) => {
    const qs = AHS.TeachingMaterialData.find((e) => e.materialId === m).questions.filter((q) => q.options && q.options.indexOf(q.answer) >= 0);
    const firstCount = qs.filter((q) => OO.order(asQuestion(q.id))[0].key === asQuestion(q.id).correctAnswer).length;
    check(m + "：正確答案排在第一個的題數由 " + qs.length + " 降到 " + firstCount + "（< 一半）", firstCount < qs.length / 2);
  });
  check("每個選項都保留原始代號與文字", OO.order(asQuestion("tm_17_q1")).every((o) => asQuestion("tm_17_q1").options.some((x) => x.key === o.key && x.text === o.text)));
  check("describe() 顯示「顯示代號「文字」」", /^[A-E]「.+」$/.test(OO.describe(asQuestion("tm_17_q1"), "A")));
  check("教材資料本身沒有被修改", JSON.stringify(AHS.TeachingMaterialData) === dataBefore);
}

console.log("\n[3] 測驗中心題目卡：顯示代號依位置，點擊回報原始代號");
{
  const dom = new JSDOM("<!DOCTYPE html><div id=a></div>", { runScripts: "outside-only" });
  const w = dom.window;
  w.AHS = { TeachingMaterialData: AHS.TeachingMaterialData };
  ["js/core/UI.js", "js/core/Icons.js", "js/utils/OptionOrder.js", "js/ui/QuestionCard.js"].forEach((f) => w.eval(fs.readFileSync(path.join(REPO, f), "utf8")));
  const q = Object.assign(asQuestion("tm_17_q1"), { index: 1, subject: "earthscience", text: byId.tm_17_q1.question });
  let picked = null;
  const card = w.AHS.QuestionCard.create(q, null, (k) => { picked = k; });
  const buttons = [...card.querySelectorAll(".qcard-option")];
  check("代號依顯示位置為 A、B、C、D", buttons.map((b) => b.querySelector(".qcard-option__key").textContent).join("") === "ABCD");
  check("顯示順序與原始不同", buttons.map((b) => b.getAttribute("data-key")).join("") !== "ABCD");
  buttons[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  check("點第一個顯示選項，回報的是它的原始代號", picked === buttons[0].getAttribute("data-key"));
  const correctDisplay = buttons.findIndex((b) => b.getAttribute("data-key") === q.correctAnswer);
  check("正確答案的顯示代號 = OptionOrder.labelFor()", L[correctDisplay] === w.AHS.OptionOrder.labelFor(q, q.correctAnswer));
}

console.log("\n[4] 知識弱點：顯示的代號與測驗中心一致");
{
  const html = fs.readFileSync(path.join(REPO, "wrongbook.html"), "utf8");
  const dom = new JSDOM(html, { url: "https://ahs.test/wrongbook.html", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.fetch = () => Promise.reject(new Error("offline"));
  w.sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] }));
  const q = asQuestion("tm_17_q1");
  const wrongKey = q.options.find((o) => o.key !== q.correctAnswer).key;
  const item = {
    id: "wb_1", questionId: "tm_17_q1", subject: "earthscience", title: "t", chapter: "c", materialId: "",
    knowledgePoint: "地球的分層構造", question: byId.tm_17_q1.question, options: q.options,
    yourAnswer: wrongKey, correctAnswer: q.correctAnswer, explanation: "e",
    errorCount: 1, lastError: "2026/09/30", firstError: "2026/09/30", masteredAt: null,
    bookmarked: false, archived: false, correctStreak: 0, correctCount: 0
  };
  w.sessionStorage.setItem("ahs:student_a__cjsh__g2s1:wrongBookRuntime", JSON.stringify({ items: [item], seq: 1 }));
  [...w.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    w.eval(fs.readFileSync(p, "utf8"));
    if (/^js\/data\/SupabaseConfig(\.local)?\.js$/.test(src)) { w.AHS.SupabaseConfig = { url: "", anonKey: "" }; w.AHS.SupabaseConfigLocal = null; }
  });
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));
  const row = w.document.querySelector(".wb-row");
  row.querySelector(".wb-row__more").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  const view = [...w.document.querySelectorAll(".wb-row__menu-item")].find((b) => b.textContent.indexOf("查看詳情") !== -1);
  view.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  const badges = [...w.document.querySelectorAll(".wb-detail__answer-badge")].map((b) => b.textContent);
  check("「你的答案」顯示的是顯示代號", badges[0] === OO.labelFor(q, wrongKey));
  check("「正確答案」顯示的是顯示代號（與測驗中心相同）", badges[1] === OO.labelFor(q, q.correctAnswer));
  const keys = [...w.document.querySelectorAll(".wb-detail__options .wb-detail__option-key")].map((n) => n.textContent).join("");
  check("選項清單代號依顯示位置為 ABCD", keys === "ABCD");
  const correctLi = w.document.querySelector(".wb-detail__options .is-correct .wb-detail__option-key");
  check("標示為正確的選項代號與「正確答案」一致", !!correctLi && correctLi.textContent === badges[1]);
}

console.log("\nOptionOrderRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
