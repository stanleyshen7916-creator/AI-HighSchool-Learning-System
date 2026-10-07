/* tests/regression/QuestionKindRegression.js — 2026-10-08 題型支援：是非、多選、計算／填充.

   Until now only single-choice questions reached a quiz. Verifies, on
   real data (長榮中學 高二上):
   - the loader brings tm_7's true/false and calculation questions and
     tm_28's multi-select questions into the exam sets;
   - QuestionCard: 是非題 shows 正確／錯誤; 多選題 toggles and saves the
     sorted keys ("BCD"), un-ticking everything leaves it unanswered;
     計算／填充題 shows 「看答案」 first, then 我答對了／我答錯了;
   - grading: a multi-select answer is right only when every key matches;
     a self-graded wrong answer goes to the Wrong Book with readable
     labels (自評答錯 / the worked answer text);
   - Wrong Book redo works for multi-select and self-graded questions;
   - Practice Mode (one-click answers) keeps choice questions only.

   Run: node tests/regression/QuestionKindRegression.js */
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
  const dom = new JSDOM(html, { url: "https://ahs.test/" + htmlFile, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vconsole });
  const { window } = dom;
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] }));
  [...window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (fs.existsSync(p)) { window.eval(fs.readFileSync(p, "utf8")); }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, doc: window.document, consoleErrors };
}
function click(node) { node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true })); }

console.log("QuestionKind Regression — 是非、多選、計算／填充題進入測驗");
const { window, doc, consoleErrors } = loadPage("quiz.html");
const AHS = window.AHS;
const QK = AHS.QuestionKind;
const idMap = AHS.PersistenceAdapter.load("teachingMaterialLoaderIdMap") || {};
const set7 = AHS.QuestionRuntime.getSet("teaching_material_" + idMap.tm_7 + "__original");
const set28 = AHS.QuestionRuntime.getSet("teaching_material_" + idMap.tm_28);

console.log("\n[1] 載入");
const tf = set7.find((q) => q.type === "true_false");
const calc = set7.find((q) => q.type === "calculation");
const multi = set28.find((q) => q.answerMode === "multi");
check("tm_7 原始試卷含是非題與計算題（之前只有單選題）", !!tf && !!calc && set7.length >= 100);
check("是非題：選項為「正確／錯誤」，答案為其中一個 key",
  JSON.stringify(tf.options.map((o) => o.text)) === JSON.stringify(["正確", "錯誤"]) && ["A", "B"].indexOf(tf.correctAnswer) !== -1);
check("計算題：自評題，答案 key 為 SELF_CORRECT，帶有答案文字", QK.kindOf(calc) === "self" && calc.correctAnswer === QK.SELF_CORRECT && calc.answerText.length > 0);
check("tm_28 多選題：答案為排序後相連的 key", !!multi && /^[A-F]{2,}$/.test(multi.correctAnswer) &&
  multi.correctAnswer === multi.correctAnswer.split("").sort().join("") && multi.type === "multiple_choice");

console.log("\n[2] 題卡");
{
  const card = AHS.QuestionCard.create(tf, null, () => {});
  check("是非題題卡：兩個選項（正確、錯誤），標示「是非題」",
    [...card.querySelectorAll(".qcard-option__text")].map((n) => n.textContent).join("|") === "正確|錯誤" && card.querySelector(".qcard__type").textContent === "是非題");
}
{
  let saved = "unset";
  const card = AHS.QuestionCard.create(multi, null, (k) => { saved = k; });
  const btns = [...card.querySelectorAll(".qcard-option")];
  click(btns[2]);
  check("多選題：點一個選項 → 存該 key", saved === btns[2].getAttribute("data-key"));
  const card2 = AHS.QuestionCard.create(multi, "C", (k) => { saved = k; });
  click([...card2.querySelectorAll(".qcard-option")].find((b) => b.getAttribute("data-key") === "A"));
  check("多選題：再點另一個 → 存排序後的 \"AC\"", saved === "AC");
  const card3 = AHS.QuestionCard.create(multi, "AC", (k) => { saved = k; });
  check("多選題：已選的選項都標示為選取、有多選提示",
    card3.querySelectorAll(".qcard-option.is-selected").length === 2 && card3.querySelector(".qcard__hint").textContent.indexOf("多選題") === 0);
  const card4 = AHS.QuestionCard.create(multi, "A", (k) => { saved = k; });
  click([...card4.querySelectorAll(".qcard-option")].find((b) => b.getAttribute("data-key") === "A"));
  check("多選題：取消所有選項 → null（未作答）", saved === null);
}
{
  let saved = null;
  const card = AHS.QuestionCard.create(calc, null, (k) => { saved = k; });
  doc.body.appendChild(card);
  const grades = card.querySelector(".qcard-self__grades");
  check("計算題：先顯示「看答案」，答案與自評按鈕隱藏、沒有選項",
    !!card.querySelector(".qcard-self__reveal") && grades.classList.contains("is-hidden") && !card.querySelector(".qcard-option"));
  click(card.querySelector(".qcard-self__reveal"));
  check("按「看答案」→ 顯示答案文字與自評按鈕",
    !grades.classList.contains("is-hidden") && card.querySelector(".qcard-self__answer-text").textContent === calc.answerText);
  click(card.querySelector('.qcard-self__grade[data-key="SELF_CORRECT"]'));
  check("按「我答對了」→ 存 SELF_CORRECT", saved === QK.SELF_CORRECT);
  card.remove();
}
{
  AHS.AnswerRuntime.saveAnswer("kind_null", "q1", "AB");
  AHS.AnswerRuntime.saveAnswer("kind_null", "q1", null);
  check("AnswerRuntime：存 null 視為未作答（不留紀錄）", AHS.AnswerRuntime.answeredCount("kind_null") === 0);
}

console.log("\n[3] 批改與知識弱點");
{
  const multi2 = set28.filter((q) => q.answerMode === "multi")[1];
  const calc2 = set7.filter((q) => q.type === "calculation")[1];
  AHS.QuestionRuntime.importQuestions("kind_test", [multi, multi2, calc, calc2, tf]);
  AHS.ExamRuntime.startFromExam("kind_test", { subject: "chemistry", title: "題型測試" });
  AHS.AnswerRuntime.saveAnswer("kind_test", multi.id, multi.correctAnswer);
  AHS.AnswerRuntime.saveAnswer("kind_test", multi2.id, multi2.correctAnswer.slice(1));
  AHS.AnswerRuntime.saveAnswer("kind_test", calc.id, QK.SELF_CORRECT);
  AHS.AnswerRuntime.saveAnswer("kind_test", calc2.id, QK.SELF_WRONG);
  AHS.AnswerRuntime.saveAnswer("kind_test", tf.id, tf.correctAnswer);
  const graded = AHS.AutoGrader.grade(AHS.ExamRuntime.finish("kind_test"));
  const byId = {};
  graded.results.forEach((r) => { byId[r.questionId] = r; });
  check("多選全對才算對；少選一個算錯", byId[multi.id].isCorrect && !byId[multi2.id].isCorrect);
  check("自評答對算對、自評答錯算錯；是非題照常批改", byId[calc.id].isCorrect && !byId[calc2.id].isCorrect && byId[tf.id].isCorrect);
  check("成績：5 題對 3 題", graded.totalCount === 5 && graded.correctCount === 3);
  const r = byId[calc2.id];
  check("結果頁：你的答案「自評答錯」、正確答案為答案文字",
    AHS.OptionOrder.describe(r, r.yourAnswer) === "自評答錯" && AHS.OptionOrder.describeCorrect(r) === calc2.answerText);
  const m = byId[multi2.id];
  check("結果頁：多選答案以 (B)(C) 形式顯示", /^(\([A-F]\)){2,}$/.test(AHS.OptionOrder.describe(m, m.correctAnswer)));
  AHS.WrongBookRuntime.sync(graded);
  const wbCalc = AHS.WrongBookRuntime.list().find((w) => w.questionId === calc2.id);
  check("自評答錯的計算題進入知識弱點", !!wbCalc && wbCalc.correctAnswer === QK.SELF_CORRECT && wbCalc.yourAnswer === QK.SELF_WRONG);
}

console.log("\n[4] 平時練習（點一下就作答）");
{
  const practice = AHS.QuizParts.realExamQuestionsFor(idMap.tm_7);
  check("只保留單選與是非題，不含多選與自評題", practice.length > 0 && practice.every((q) => QK.isChoice(q)) && practice.some((q) => q.type === "true_false"));
}
check("Console errors = 0（測驗中心）", consoleErrors.length === 0);

console.log("\n[5] 知識弱點：重新作答");
{
  const wb = loadPage("wrongbook.html");
  const calc2 = set7.filter((q) => q.type === "calculation")[1];
  let got = null;
  const selfUi = wb.window.AHS.WrongBook.buildReviewInteraction({
    questionId: calc2.id, question: calc2.text, options: [], correctAnswer: QK.SELF_CORRECT, yourAnswer: QK.SELF_WRONG
  }, (ok, key) => { got = [ok, key]; });
  wb.doc.body.appendChild(selfUi);
  const reveal = [...selfUi.querySelectorAll("button")].find((b) => b.textContent === "看答案");
  check("計算題重做：先「看答案」", !!reveal && selfUi.textContent.indexOf(calc2.answerText) !== -1 &&
    selfUi.querySelector(".wb-detail__self-answer").classList.contains("is-hidden"));
  click(reveal);
  click([...selfUi.querySelectorAll("button")].find((b) => b.textContent === "我答對了"));
  check("看答案後自評答對 → 回報答對", JSON.stringify(got) === JSON.stringify([true, QK.SELF_CORRECT]));

  const multiUi = wb.window.AHS.WrongBook.buildReviewInteraction({
    questionId: multi.id, question: multi.text, options: multi.options, correctAnswer: multi.correctAnswer, yourAnswer: "A"
  }, (ok, key) => { got = [ok, key]; });
  wb.doc.body.appendChild(multiUi);
  const items = [...multiUi.querySelectorAll(".wb-detail__option")];
  multi.correctAnswer.split("").forEach((k) => {
    click(items.find((li) => li.querySelector(".wb-detail__option-text").textContent === multi.options.find((o) => o.key === k).text));
  });
  click([...multiUi.querySelectorAll("button")].find((b) => b.textContent.indexOf("提交答案") !== -1));
  check("多選題重做：勾選所有正確選項 → 回報答對（排序後的 key）", JSON.stringify(got) === JSON.stringify([true, multi.correctAnswer]));
  check("Console errors = 0（知識弱點）", wb.consoleErrors.length === 0);
}

console.log("\nQuestionKindRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
