/* tests/regression/TutorContinuityAndQuizScopeRegression.js — Sprint
   AI-154（使用者回報的 3 項，經核對上游 2026-09-30~11-13 期間的既有進度
   後，確認仍未解決的缺口）：

     1. 知識弱點開啟速度慢的根因之一 — js/pages/AppWrongBook.js 每次背景
        Repository pull 完成都整頁重新 mount，即使學生已經在互動。改用
        js/pages/AppTutor.js 2026-09-30 已經驗證過的「interacted 旗標」
        解法（而非重新發明一套）。
     2. 從知識弱點「問 AI 巧巧老師」到 tutor.html，對話串本身的第一則訊息
        仍與該題無關（上游已有的「針對這一題」側欄卡片沒有解決對話串本身
        的連貫性）。AHS.TutorEngine.greetForQuestion() + js/pages/
        AppTutor.js 補上這則開場訊息。
     3. 「出題考我」卡片只能選科目與題數，不能選章節／課文
        （js/runtime/StudyAssistant.js 的 pickQuiz() 新增 opts.sourceId
        篩選，js/components/AiTutor.js 的 quizCard 新增「章節／課文」選
        單）。

   立即重做換題目（variantFor()/note.variants）已於 2026-11-06 由其他工作
   完成，這裡不重複測試 —— 已有 WrongBookRedesignRegression.js 等既有套
   件覆蓋。

   Run: node tests/regression/TutorContinuityAndQuizScopeRegression.js */
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
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  if (seedSession) {
    Object.entries(seedSession).forEach(([k, v]) => window.sessionStorage.setItem(k, JSON.stringify(v)));
  }
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    const p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8")); require("./SplitDataHarness.js")(window, p);
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function seedLoggedInWorkspace() {
  return { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } };
}

console.log("TutorContinuityAndQuizScopeRegression — Sprint AI-154");

/* ---- 1. 知識弱點：背景 pull 完成時，若學生已互動過，不得整頁重繪 ------ */
console.log("\n[1] 知識弱點 — repository pull 完成後，若學生已互動則不整頁重繪（AppTutor.js 2026-09-30 同款解法）");
{
  const { window } = loadPage("wrongbook.html", { seedSession: seedLoggedInWorkspace() });
  const app = window.document.getElementById("app");
  const firstRoot = app.firstElementChild;
  check("初次渲染真實存在", !!firstRoot);

  // 尚未互動時，repository pull 完成仍會（正常）重新渲染一次。
  window.dispatchEvent(new window.Event("ahs:repository-pulled"));
  const afterPullNoInteract = app.firstElementChild;
  check("尚未互動前，repository pull 後允許重新渲染（維持既有「背景資料融合」行為）",
    !!afterPullNoInteract);

  // 學生開始互動（例如點擊畫面上任一元素）後，之後的 pull 不得再整頁重繪。
  window.document.body.dispatchEvent(new window.Event("click", { bubbles: true }));
  const rootBeforeSecondPull = app.firstElementChild;
  window.dispatchEvent(new window.Event("ahs:repository-pulled"));
  const rootAfterSecondPull = app.firstElementChild;
  check("學生互動後，背景 pull 不再整頁重繪（DOM 根節點維持同一個真實節點）",
    rootBeforeSecondPull === rootAfterSecondPull);
}

/* ---- 2. tutor.html：從知識弱點問 AI 巧巧老師，開場訊息真實承接 -------- */
console.log("\n[2] 問 AI 巧巧老師 — tutor.html 對話串開場訊息真實承接「從哪一題過來」");
{
  const p1 = loadPage("quiz.html", { seedSession: seedLoggedInWorkspace() });
  const A1 = p1.window.AHS;
  const materialId = A1.MaterialRuntime.list()[0].id;
  const examId = "teaching_material_" + materialId;
  const meta = A1.TeachingMaterialLoader.resolveExamMeta(examId) || {};
  A1.ExamRuntime.startFromExam(examId, meta);
  const qs = A1.QuestionRuntime.getSet(examId);
  qs.forEach((q) => A1.AnswerRuntime.saveAnswer(examId, q.id, q.id === qs[0].id ? "WRONG_ON_PURPOSE" : q.correctAnswer));
  const graded = A1.AutoGrader.grade(A1.ExamRuntime.finish(examId));
  A1.WrongBookRuntime.sync(graded);
  const wrongId = A1.WrongBookRuntime.list()[0].id;
  const wrongItem = A1.WrongBookRuntime.getById(wrongId);

  const carried = {};
  for (let i = 0; i < p1.window.sessionStorage.length; i++) {
    const k = p1.window.sessionStorage.key(i);
    carried[k] = JSON.parse(p1.window.sessionStorage.getItem(k));
  }

  const pt = loadPage("tutor.html", { seedSession: carried, url: "tutor.html?questionId=" + wrongId });
  const bodyText = pt.window.document.body.textContent;
  check("對話串開場訊息提及「從這一題過來」", bodyText.includes("我看到你是從這一題過來的"));
  check("開場訊息包含真實題目文字", bodyText.includes(wrongItem.question));

  const menuBtns = [...pt.window.document.querySelectorAll(".tutor-msg__menu-item")];
  const stepsBtn = menuBtns.find((b) => b.textContent.includes("解題步驟詳解"));
  check("開場訊息的「解題步驟詳解」按鈕真實存在", !!stepsBtn);
  const beforeCount = pt.window.document.querySelectorAll(".tutor-msg").length;
  stepsBtn.click();
  const afterCount = pt.window.document.querySelectorAll(".tutor-msg").length;
  check("點擊開場訊息的按鈕真的觸發新訊息（AiTutor.js seed 訊息 onMenuPick 綁定修正）", afterCount > beforeCount);
}

/* ---- 3. 出題考我：章節／課文選單真實存在，且真的能把出題範圍縮小到單一教材 */
console.log("\n[3] AI Tutor「出題考我」— 章節／課文選單真實存在且真能縮小出題範圍");
{
  const { window } = loadPage("tutor.html", { seedSession: seedLoggedInWorkspace() });
  const AHS = window.AHS;
  const quizMaterialSel = window.document.querySelector('.tutor-quiz-card select[aria-label="章節／課文"]');
  check("出題考我卡片真實存在「章節／課文」選單", !!quizMaterialSel);
  check("預設選項為「全部章節」", !!quizMaterialSel && quizMaterialSel.options[0].text === "全部章節");

  const realSources = AHS.StudyAssistant.sources();
  check("測試前提：目前學期真的有兩筆以上教材可供挑選不同章節", realSources.length > 1);
  check("章節／課文選單的真實選項數與教材數一致（全部章節 + 每個教材各一筆）",
    quizMaterialSel.options.length === realSources.length + 1);

  const target = realSources.find((s) => s.questions.length > 0);
  check("測試前提：挑選的教材真的有真實題目", !!target && target.questions.length > 0);
  quizMaterialSel.value = target.sourceId;

  const startBtn = [...window.document.querySelectorAll(".tutor-quiz-card .tutor-start")][0];
  startBtn.click();
  const stem = window.document.querySelector(".tutor-quiz__stem");
  check("選定章節後，出題考我真實顯示該教材的題目", !!stem);
  const shownText = stem ? stem.textContent : "";
  const belongsToTarget = target.questions.some((q) => q.text === shownText);
  check("出題內容真的屬於選定的那個章節／課文（不是其他教材的題目）", belongsToTarget);
}

console.log("\n==============================");
console.log("TutorContinuityAndQuizScopeRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
