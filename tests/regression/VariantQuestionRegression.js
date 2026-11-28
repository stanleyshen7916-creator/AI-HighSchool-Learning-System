/* tests/regression/VariantQuestionRegression.js — 2026-11-17 B2 變式題.
   - 教材包可帶 variants（variantOf＝原題 id）：錯題本「做一題類題」優先出這一題的專屬變式題，
     而不是「同知識點的另一題」。
   - 變式題不在 questions，所以一般練習／測驗／月考抽不到。
   - 沒有專屬變式題時維持原行為（沿用 2026-11-15 的題庫類似題）。
   Run: node tests/regression/VariantQuestionRegression.js */
"use strict";
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); } else { fail++; console.log("  FAIL  " + name); }
}
const WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };

function loadPage(htmlFile, seedSession) {
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const vconsole = new VirtualConsole();
  const dom = new JSDOM(html, { url: "https://ahs.test/" + htmlFile, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vconsole });
  const { window } = dom;
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  const seed = Object.assign({ "ahs:workspace": WORKSPACE }, seedSession || {});
  Object.entries(seed).forEach(([k, v]) => window.sessionStorage.setItem(k, JSON.stringify(v)));
  [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (fs.existsSync(p)) { window.eval(fs.readFileSync(p, "utf8")); require("./SplitDataHarness.js")(window, p); }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return window;
}
function carry(win) {
  const out = {};
  for (let i = 0; i < win.sessionStorage.length; i++) { const k = win.sessionStorage.key(i); out[k] = JSON.parse(win.sessionStorage.getItem(k)); }
  return out;
}

console.log("Variant question regression — 變式題 (B2)");

/* 1. 做錯一題，存進錯題本 */
const p1 = loadPage("quiz.html");
const A1 = p1.AHS;
const materialId = A1.MaterialRuntime.list()[0].id;
const examId = "teaching_material_" + materialId;
A1.ExamRuntime.startFromExam(examId, A1.TeachingMaterialLoader.resolveExamMeta(examId) || {});
const qs = A1.QuestionRuntime.getSet(examId);
const wrongQ = qs.find((q) => A1.QuestionKind.isChoice(q)) || qs[0];
qs.forEach((q) => A1.AnswerRuntime.saveAnswer(examId, q.id, q.id === wrongQ.id ? "WRONG_ON_PURPOSE" : q.correctAnswer));
const graded = A1.AutoGrader.grade(A1.ExamRuntime.finish(examId));
A1.WrongBookRuntime.sync(graded);
const wrongId = A1.WrongBookRuntime.list()[0].id;
const session = carry(p1);

/* 2. 錯題本頁：替這題的教材包加一題專屬變式題，點「做一題類題」 */
const pw = loadPage("wrongbook.html", session);
const data = pw.AHS.TeachingMaterialSource.entries();
const entry = data.find((e) => (e.questions || []).some((q) => q.id === wrongQ.id));
check("測試前提：錯題對得上教材包題目", !!entry);
const VARIANT = {
  id: wrongQ.id + "_v", materialId: entry.materialId, questionNumber: "999", type: "single_choice",
  question: "（變式題）這是專屬於原題的變式題，題幹與原題不同",
  options: ["甲說", "乙說", "丙說", "丁說"], answer: "丙說", explanation: "變式題詳解",
  questionSource: "AI_GENERATED", origin: "AI", variantOf: wrongQ.id
};
entry.variants = [VARIANT];

check("變式題不在教材包 questions（一般抽題看不到）", !entry.questions.some((q) => q.id === VARIANT.id || q.variantOf));
pw.document.body.appendChild(pw.AHS.WrongBook.create());
pw.document.querySelector(".wb-row").click();
const btn = [...pw.document.querySelectorAll(".wb-detail__btn")].find((b) => /做一題類題|立即重做/.test(b.textContent));
check("有專屬變式題時按鈕是「做一題類題」", !!btn && /做一題類題/.test(btn.textContent));
btn.click();
const shown = pw.document.querySelector(".wb-variant .wb-detail__question");
check("畫面出的就是這題的專屬變式題", !!shown && shown.textContent.indexOf("這是專屬於原題的變式題") !== -1);
check("標示為「類題練習」而非「題庫中另一題」", /^類題練習（同觀念/.test((pw.document.querySelector(".wb-variant__label") || {}).textContent || ""));

/* 3. 沒有專屬變式題 → 維持原行為，且絕不會出別題的變式題 */
const pn = loadPage("wrongbook.html", session);
const e2 = pn.AHS.TeachingMaterialSource.entries().find((e) => (e.questions || []).some((q) => q.id === wrongQ.id));
e2.variants = [Object.assign({}, VARIANT, { variantOf: "tm_other_q1" })];
pn.document.body.appendChild(pn.AHS.WrongBook.create());
pn.document.querySelector(".wb-row").click();
const btn2 = [...pn.document.querySelectorAll(".wb-detail__btn")].find((b) => /做一題類題|立即重做/.test(b.textContent));
btn2.click();
const shown2 = pn.document.querySelector(".wb-variant .wb-detail__question");
check("變式題指向別的原題時不會被拿來用", !shown2 || shown2.textContent.indexOf("這是專屬於原題的變式題") === -1);
check("原題仍在（wrongId 存在）", !!pn.AHS.WrongBookRuntime.getById(wrongId));

console.log("\nVariantQuestionRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
