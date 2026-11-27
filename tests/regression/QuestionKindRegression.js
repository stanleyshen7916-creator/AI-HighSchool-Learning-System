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
    if (fs.existsSync(p)) { window.eval(fs.readFileSync(p, "utf8")); require("./SplitDataHarness.js")(window, p); }
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
/* 2026-10-27: 原始試卷與 AI 題合併，tm_7 只有一份題庫。 */
const set7 = AHS.QuestionRuntime.getSet("teaching_material_" + idMap.tm_7);
const set28 = AHS.QuestionRuntime.getSet("teaching_material_" + idMap.tm_28);

console.log("\n[1] 載入");
const tf = set7.find((q) => q.type === "true_false");
const calc = set7.find((q) => q.type === "calculation");
const multi = set28.find((q) => q.answerMode === "multi");
/* 2026-10-27: 計算題改輸入作答自動批改，答案無法自動比對的長篇作答不出題。 */
check("tm_7 題庫含是非題與計算題（之前只有單選題）", !!tf && !!calc && set7.length >= 70);
check("計算題都能自動批改（長篇作答不出題）", set7.filter((q) => QK.kindOf(q) === "self").every((q) => QK.gradable({ type: q.type, answer: q.answerText })));
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
  const inputs = [...card.querySelectorAll(".qcard-self__input")];
  const want = QK.parts(calc.answerText);
  check("計算題：沒有「看答案」、沒有選項，每一格一個輸入框",
    !card.querySelector(".qcard-self__reveal") && !card.querySelector(".qcard-option") && inputs.length === want.length && inputs.length > 0);
  check("作答中不顯示答案文字", card.textContent.indexOf(calc.answerText) === -1);
  inputs.forEach((inp) => { inp.value = "999999"; });
  click(card.querySelector(".qcard-self__save"));
  check("輸入錯誤答案 → 存輸入文字（不是 SELF_CORRECT）", saved === want.map(() => "999999").join("；"));
  inputs.forEach((inp, i) => { inp.value = want[i]; });
  click(card.querySelector(".qcard-self__save"));
  check("輸入正確答案 → 自動判定 SELF_CORRECT", saved === QK.SELF_CORRECT);
  const card2 = AHS.QuestionCard.create(calc, "999999", () => {});
  check("回到這題：輸入框還原為上次輸入", card2.querySelector(".qcard-self__input").value === "999999");
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

console.log("\n[4] 考前總複習：整份題庫（單選、多選、選填）");
{
  /* 2026-10-27: 考前總複習列出整份題庫，題數與教材一致。 */
  const practice = AHS.QuizParts.realExamQuestionsFor(idMap.tm_7);
  check("考前總複習題數 = 教材題庫題數", practice.length === set7.length);
  check("含單選、是非、多選與選填題", ["choice", "multi", "self"].every((k) => practice.some((q) => QK.kindOf(q) === k)) && practice.some((q) => q.type === "true_false"));
  const entry = AHS.QuizParts.repositoryExamCatalog().find((e) => e._repoExamId === "teaching_material_" + idMap.tm_7);
  check("列表「共 N 題」：考前總複習為整份題數，平時練習為 20 題", !!entry && entry.total === set7.length && entry.count === 20);

  const R = AHS.QuizParts.renderRealQuestionBody;
  const fillQ = practice.find((q) => QK.kindOf(q) === "self" && QK.parts(q.answerText).length === 1);
  let got = null;
  const fillCard = R(fillQ, (id, ok) => { got = ok; });
  const input = fillCard.querySelector(".quiz-practice__fill-input");
  input.value = QK.parts(fillQ.answerText)[0];
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  click(fillCard.querySelector(".quiz-practice__submit"));
  check("選填題：輸入正確答案自動判定答對，並顯示答案文字", got === true && fillCard.querySelector(".quiz-practice__answer").textContent.indexOf(fillQ.answerText) !== -1);

  const multiQ = set28.find((q) => QK.kindOf(q) === "multi");
  got = null;
  const multiCard = R(multiQ, (id, ok) => { got = ok; });
  QK.multiKeys(multiQ.correctAnswer).forEach((k) => click(multiCard.querySelector('.quiz-practice__option--btn[data-key="' + k + '"]')));
  click(multiCard.querySelector(".quiz-practice__submit"));
  check("多選題：可複選，全部選對判定答對", got === true && multiCard.querySelectorAll(".quiz-practice__option--btn.is-correct").length === QK.multiKeys(multiQ.correctAnswer).length);
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

/* 2026-11-16 英文 L4～L6 單字克漏字（tm_103～tm_105）改為「短文＋每格單選」：
   一篇短文留 7～9 個編號空格，每個空格一題、4 個選項、可整篇當題組出題。 */
console.log("\n[英文單字克漏字] tm_103～tm_105（短文＋單選）");
{
  const counts = { tm_103: 56, tm_104: 43, tm_105: 55 };
  Object.keys(counts).forEach((mid) => {
    const set = AHS.QuestionRuntime.getSet("teaching_material_" + idMap[mid]);
    check(mid + "：" + counts[mid] + " 題全部進入測驗，且都是 4 選 1 單選題",
      set.length === counts[mid] && set.every((q) => QK.kindOf(q) === "choice" && q.options.length === 4));
    check(mid + "：每題題幹含短文，且只有本題空格用【】標示",
      set.every((q) => /【\(\d+\) ______】/.test(q.text) && (q.text.match(/【\(/g) || []).length === 1 && /\(\d+\) ______/.test(q.text)));
    check(mid + "：每題恰有一個正確選項",
      set.every((q) => q.options.filter((o) => o.key === q.correctAnswer).length === 1));
  });
  const set = AHS.QuestionRuntime.getSet("teaching_material_" + idMap.tm_103);
  const first = set.find((q) => /〈A Festival of Life〉/.test(q.text) && /【\(1\) ______】/.test(q.text));
  const correct = first.options.find((o) => o.key === first.correctAnswer).text;
  check("第一篇短文的第一格：正確選項是 mourn", correct === "mourn");
  const card = AHS.QuestionCard.create(first, null, () => {});
  check("克漏字題卡：4 個選項按鈕、沒有輸入框", card.querySelectorAll(".qcard-option").length === 4 && card.querySelectorAll(".qcard-self__input").length === 0);

  /* 2026-11-16 整篇短文一張卡片：短文只出現一次，每個空格內嵌自己的下拉選單，
     選擇時各自存成該格那一題的作答；上一題／下一題以整篇短文為單位。 */
  const CG = AHS.ClozeGroup;
  const unit = set.filter((q) => q.groupId && q.groupId === first.groupId);
  check("第一篇短文 8 格同一個題組，題幹格式可解析", unit.length === 8 && unit.every((q) => CG.isCloze(q)) && CG.parse(first).title === "A Festival of Life" && CG.parse(unit[2]).number === 3);
  const saved = {};
  const cloze = AHS.QuestionCard.createCloze(unit, saved, (qid, key, pos) => { saved[qid] = key; });
  const selects = cloze.querySelectorAll(".qcard-cloze__select");
  check("克漏字卡片：8 個空格各一個下拉選單，每個 4 個選項（另有「請選擇」），沒有第二份短文",
    selects.length === 8 && [...selects].every((x) => x.options.length === 5) && cloze.textContent.split("For most people").length === 2);
  const target = unit[2];
  const rightKey = target.correctAnswer;
  selects[2].value = rightKey;
  selects[2].dispatchEvent(new window.Event("change", { bubbles: true }));
  check("選第 3 格：只存第 3 題的作答（key 為該題的正確選項）", Object.keys(saved).length === 1 && saved[target.id] === rightKey);
  const reopened = AHS.QuestionCard.createCloze(unit, saved, () => {});
  check("已答的空格還原選取，計數顯示 已作答 1 / 8 格", reopened.querySelectorAll(".qcard-cloze__select")[2].value === rightKey && reopened.textContent.indexOf("已作答 1 / 8 格") !== -1);
  check("成績頁短句只含本題空格那一句", /^〈A Festival of Life〉第 3 格：Every autumn/.test(CG.snippet(target)) && CG.snippet(target).indexOf("For most people") === -1);
  {
    /* 一句裡有兩格時：只有本題那一格是 ______，另一格標成 (n) …。 */
    const head = "【單字克漏字】閱讀短文〈T〉，選出第 2 格最適合的答案。（第 1–2 題為題組）\n\n";
    const two = CG.snippet({ question: head + "Intro here. Many (1) ______ join, and each 【(2) ______】 is done. End." });
    check("成績頁短句：同一句有兩格時分得出本題是哪一格", two === "〈T〉第 2 格：Many (1) … join, and each ______ is done.");
  }

  /* 測驗頁（buildExamView）：用真的測驗（整組打亂、組內順序不變）；整篇短文一張卡片，
     選擇寫入 AnswerRuntime，上一題／下一題以整篇短文為單位。 */
  const examId = "teaching_material_" + idMap.tm_103;
  AHS.ExamRuntime.startFromExam(examId, { subject: "english", title: "英文 L4 單字克漏字" });
  const shuffled = AHS.QuestionRuntime.getSet(examId);
  const groupsInOrder = [];
  shuffled.forEach((q, i) => { if (!groupsInOrder.length || groupsInOrder[groupsInOrder.length - 1].id !== q.groupId) { groupsInOrder.push({ id: q.groupId, start: i, end: i }); } else { groupsInOrder[groupsInOrder.length - 1].end = i; } });
  check("打亂後 7 篇短文各自連續、每篇 8 題", groupsInOrder.length === 7 && groupsInOrder.every((g) => g.end - g.start === 7));
  const g0 = groupsInOrder[0], g1 = groupsInOrder[1];
  AHS.ExamRuntime.goTo(examId, g0.start + 3);
  let rerendered = 0;
  const view = AHS.QuizParts.buildExamView(AHS.ExamRuntime.getById(examId), () => { rerendered++; }, () => {}, () => {});
  check("測驗頁：站在短文中間時顯示整篇短文卡片（1 張卡片、8 個選單、沒有選項按鈕）",
    view.querySelectorAll(".qcard-cloze").length === 1 && view.querySelectorAll(".qcard-cloze__select").length === 8 && view.querySelectorAll(".qcard-option").length === 0);
  const pills = [...view.querySelectorAll(".qnav__num")];
  check("測驗頁：題號列把整篇短文的 8 題都標成目前題，進度寫「第 a～b 題」",
    pills.filter((x) => x.classList.contains("is-current")).length === 8 && pills[g0.start].classList.contains("is-current") && pills[g0.end].classList.contains("is-current") &&
    view.querySelector(".qnav__progress-label").textContent === (g0.start + 1) + "～" + (g0.end + 1) + " / " + shuffled.length + " 題");
  check("測驗頁：卡片標頭的題號與題號列一致（打亂後也是作答順序，不是原始題號）",
    view.querySelector(".qcard__index").textContent === "第 " + (g0.start + 1) + "～" + (g0.end + 1) + " 題");
  check("測驗頁：出處的「第 a–b 題為題組」改成與標頭相同的作答順序題號",
    view.querySelector(".qref").textContent.indexOf("第 " + (g0.start + 1) + "～" + (g0.end + 1) + " 題為題組") !== -1 && !/第 \d+[–-]\d+ 題為題組/.test(view.querySelector(".qref").textContent));
  const pick = shuffled[g0.start + 4];
  const pickSelect = view.querySelectorAll(".qcard-cloze__select")[AHS.ClozeGroup.parse(pick).number - 1];
  pickSelect.value = pick.correctAnswer;
  pickSelect.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("測驗頁：選一格只寫入該格那一題的作答，並重繪一次", Object.keys(AHS.AnswerRuntime.getAnswers(examId)).length === 1 && AHS.AnswerRuntime.getAnswers(examId)[pick.id] === pick.correctAnswer && rerendered === 1);
  const clickBtn = (root, re) => { const b = [...root.querySelectorAll("button")].find((x) => re.test(x.textContent)); b.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); };
  clickBtn(view, /下一題/);
  check("測驗頁：下一題跳到下一篇短文的第一題", AHS.ExamRuntime.getById(examId).currentIndex === g1.start);
  AHS.ExamRuntime.goTo(examId, g1.start + 2);
  const view2 = AHS.QuizParts.buildExamView(AHS.ExamRuntime.getById(examId), () => {}, () => {}, () => {});
  clickBtn(view2, /上一題/);
  check("測驗頁：上一題跳回上一篇短文的最後一題", AHS.ExamRuntime.getById(examId).currentIndex === g0.end);

  /* 平時練習（考前總複習）：整篇短文一張卡片，全部選好才能確認，一次批改 8 格；
     每格各自回報 onAnswered，答錯的各自寫入知識弱點。上一題／下一題以整篇短文為單位。 */
  {
    const questions = AHS.QuizParts.realExamQuestionsFor(idMap.tm_103);
    const answered = {};
    const status = {};
    const doc = window.document;
    const sessionView = AHS.QuizParts.buildPracticeSessionView({
      kind: "real", questions, startIndex: 3, headerMeta: { subjectName: "英文", chapterLabel: "L4" },
      statusFor: (k, id) => status[id] || null,
      onAnswered: (id, ok) => { answered[id] = ok; status[id] = ok ? "correct" : "wrong"; }
    }, { onExit() {}, onRetest() {} });
    doc.body.appendChild(sessionView);
    const grp = [];
    questions.forEach((q, i) => { if (q.groupId === questions[3].groupId) { grp.push(i); } });
    check("平時練習：站在短文中間時顯示整篇短文卡片（8 個選單、標題為「第 a～b / 總數 題」）",
      sessionView.querySelectorAll(".qcard-cloze__select").length === 8 &&
      sessionView.querySelector(".qpv__title").textContent.indexOf("第 " + (grp[0] + 1) + "～" + (grp[7] + 1) + " / " + questions.length + " 題") !== -1);
    const confirmBtn = sessionView.querySelector(".quiz-practice__submit");
    check("平時練習：還有空格沒選時，「確認」不能按", confirmBtn.disabled === true);
    const selects = [...sessionView.querySelectorAll(".qcard-cloze__select")];
    const byNum = {};
    grp.forEach((i) => { byNum[AHS.ClozeGroup.parse(questions[i]).number] = questions[i]; });
    selects.forEach((sel, k) => {
      const q = byNum[Number(/[0-9]+/.exec(sel.getAttribute("aria-label"))[0])];
      const wrongKey = q.options.map((o) => o.key).find((key) => key !== q.correctAnswer);
      sel.value = k === 0 ? wrongKey : q.correctAnswer;
      sel.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    check("平時練習：8 格都選好後「確認」才可按", confirmBtn.disabled === false);
    confirmBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    check("平時練習：一次批改 8 格，每格各自回報（7 對 1 錯）", Object.keys(answered).length === 8 && Object.values(answered).filter(Boolean).length === 7);
    check("平時練習：批改後選單鎖定並標示對錯，並顯示每格答案", selects.every((x) => x.disabled) && sessionView.querySelectorAll(".qcard-cloze__select.is-wrong").length === 1 &&
      sessionView.querySelectorAll(".quiz-practice__cloze-list li").length === 8 && sessionView.querySelector(".quiz-practice__result").textContent.indexOf("答對 7 / 8 格") !== -1);
    const wrongIds = Object.keys(answered).filter((id) => !answered[id]);
    check("平時練習：答錯的那一格寫入知識弱點", wrongIds.length === 1 && AHS.WrongBookRuntime.list().some((w) => w.questionId === wrongIds[0]));
    const nextBtn = sessionView.querySelector(".qpv__next");
    nextBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const nextGrp = questions[grp[7] + 1].groupId;
    check("平時練習：下一題跳到下一篇短文", nextGrp !== questions[3].groupId && sessionView.querySelector(".qpv__title").textContent.indexOf("第 " + (grp[7] + 2) + "～") !== -1);
    sessionView.querySelector(".qpv__prev").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    check("平時練習：上一題跳回上一篇短文", sessionView.querySelector(".qpv__title").textContent.indexOf("第 " + (grp[0] + 1) + "～") !== -1);
    sessionView.remove();
  }
}

/* 2026-11-18 知識弱點：短文式克漏字答錯後，列表只列含該格的那一句，詳細頁仍有整篇短文與 4 個選項。 */
console.log("\n[知識弱點] 克漏字錯題");
{
  const wb = loadPage("wrongbook.html");
  const W = wb.window.AHS;
  const wbIdMap = W.PersistenceAdapter.load("teachingMaterialLoaderIdMap") || {};
  const pkg = W.TeachingMaterialSource.entries().find((e) => e.materialId === "tm_103");
  const pq = pkg.questions.find((q) => /〈A Festival of Life〉/.test(q.question) && /【\(3\) ______】/.test(q.question));
  W.WrongBookRuntime.sync({
    subject: "english", title: pq.question, chapter: pq.knowledgePoint || "",
    wrong: [{ questionId: pq.id, knowledgePoint: pq.knowledgePoint, text: pq.question,
      options: pq.options.map((t, i) => ({ key: "ABCD"[i], text: t })), yourAnswer: "A",
      correctAnswer: "ABCD"[pq.options.indexOf(pq.answer)], explanation: pq.explanation, materialId: wbIdMap.tm_103 }]
  });
  const view = W.WrongBook.create();
  wb.doc.body.appendChild(view);
  const rowText = view.querySelector(".wb-row__question").textContent;
  check("錯題本列表：克漏字只列含該格的那一句，不重複整篇短文", /^〈A Festival of Life〉第 3 格：/.test(rowText) && rowText.length < 200 && rowText.indexOf("For most people") === -1);
  click(view.querySelector("[aria-label^='第 1 題']"));
  check("錯題本詳細頁：仍有整篇短文與該格的 4 個選項", wb.doc.querySelector(".wb-detail__question").textContent.indexOf("For most people") !== -1 && wb.doc.querySelectorAll(".wb-detail__option").length === 4);
  check("Console errors = 0（克漏字錯題）", wb.consoleErrors.length === 0);
}

console.log("\nQuestionKindRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
