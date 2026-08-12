/* tests/regression/WrongBookRedesignRegression.js — AI-128（知識弱點右側
   排版重新設計）regression. Verifies:
   - WrongBookRuntime: new real, cumulative `correctCount` field —
     increments on every correct recordRetry(), never reset by a later
     wrong answer (distinct from correctStreak, which DOES reset to 0 on
     a miss). A record created before this field existed defaults safely
     via `|| 0`.
   - js/components/WrongBook.js: the Question List row shows BOTH
     錯誤次數 and 正確次數 (was 錯誤次數 only); the Detail Panel shows a
     real 錯誤次數／正確次數 stats block; the 詳解 (explanation) section
     is collapsed by default and only expands when its own toggle is
     clicked ("當點選本題目時，才展開詳解").

   Run: node tests/regression/WrongBookRedesignRegression.js */
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

const DEFAULT_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };

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

/* seedWrongItem(window) — quiz.html has QuestionRuntime/ExamRuntime/
   AutoGrader loaded (wrongbook.html does not), so a real wrong answer has
   to be created there first, exactly like KnowledgeEngineRegression.js's
   own gradeQuestions() helper. */
function seedWrongItem(window) {
  const AHS = window.AHS;
  const examId = "wb_redesign_test";
  AHS.QuestionRuntime.importQuestions(examId, [
    { id: "wq1", index: 1, text: "測試題目", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
      correctAnswer: "A", knowledgePoint: "測試知識點", explanation: "這是詳解內容" }
  ]);
  const session = AHS.ExamRuntime.startFromExam(examId, { subject: "math", title: "測試教材" });
  AHS.AnswerRuntime.saveAnswer(session.examId, "wq1", "B");
  const finished = AHS.ExamRuntime.finish(session.examId);
  const graded = AHS.AutoGrader.grade(finished);
  AHS.WrongBookRuntime.sync(graded);
  return AHS.WrongBookRuntime.list()[0];
}

console.log("WrongBook Redesign Regression — AI-128（知識弱點右側排版重新設計）");

/* ---- 1. WrongBookRuntime.correctCount — real, cumulative, additive --- */
console.log("\n[1] WrongBookRuntime — correctCount 真實累計，不受答錯重置（區別於 correctStreak）");
{
  const { window } = loadPage("quiz.html");
  const item = seedWrongItem(window);
  const AHS = window.AHS;
  check("新錯題 correctCount 初始為 0", item.correctCount === 0);

  AHS.WrongBookRuntime.recordRetry(item.id, true);
  AHS.WrongBookRuntime.recordRetry(item.id, true);
  var afterTwoCorrect = AHS.WrongBookRuntime.getById(item.id);
  check("連續答對 2 次後 correctCount = 2", afterTwoCorrect.correctCount === 2);
  check("連續答對 2 次後 correctStreak 也是 2（兩者此時一致）", afterTwoCorrect.correctStreak === 2);

  AHS.WrongBookRuntime.recordRetry(item.id, false);
  var afterMiss = AHS.WrongBookRuntime.getById(item.id);
  check("答錯一次後 correctStreak 歸零", afterMiss.correctStreak === 0);
  check("答錯一次後 correctCount 維持累計值 2（不因答錯被重置，這是與 correctStreak 的關鍵差異）",
    afterMiss.correctCount === 2);

  AHS.WrongBookRuntime.recordRetry(item.id, true);
  var afterThirdCorrect = AHS.WrongBookRuntime.getById(item.id);
  check("再答對一次後 correctCount 累計為 3（跨越中間的答錯持續累計）", afterThirdCorrect.correctCount === 3);
  check("但 correctStreak 只反映本次連續（=1，非 3）", afterThirdCorrect.correctStreak === 1);
}

/* ---- 2. Question List row — 錯誤次數／正確次數 並列 -------------------- */
console.log("\n[2] Question List Row — 同時顯示錯誤次數與正確次數");
{
  const { window: qWin } = loadPage("quiz.html");
  const item = seedWrongItem(qWin);
  qWin.AHS.WrongBookRuntime.recordRetry(item.id, true);
  const carry = dumpSession(qWin);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());

  const wrongEl = window.document.querySelector(".wb-row__count--wrong");
  const correctEl = window.document.querySelector(".wb-row__count--correct");
  check("列表列存在錯誤次數欄位", !!wrongEl && /錯\s*1\s*次/.test(wrongEl.textContent));
  check("列表列存在正確次數欄位（新增，非舊排版只有錯誤次數）", !!correctEl && /對\s*1\s*次/.test(correctEl.textContent));
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 3. Detail Panel — 統計區塊 + 詳解預設收合，點擊才展開 -------------- */
console.log("\n[3] Detail Panel — 統計區塊真實反映次數；詳解預設收合，點擊 explainToggle 才展開");
{
  const { window: qWin } = loadPage("quiz.html");
  const item = seedWrongItem(qWin);
  qWin.AHS.WrongBookRuntime.recordRetry(item.id, true);
  qWin.AHS.WrongBookRuntime.recordRetry(item.id, true);
  const carry = dumpSession(qWin);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());

  const statValues = Array.from(window.document.querySelectorAll(".wb-detail__stat-value")).map((n) => n.textContent);
  check("Detail Panel 統計區塊顯示錯誤次數(1)與正確次數(2)", statValues.indexOf("1") !== -1 && statValues.indexOf("2") !== -1);

  const explainToggle = window.document.querySelector(".wb-detail__explain-toggle");
  const explainText = window.document.querySelector(".wb-detail__explain-text");
  check("詳解切換按鈕存在", !!explainToggle);
  check("詳解內容預設收合（hidden 屬性存在，點選前不應直接看到詳解全文）", explainText.hasAttribute("hidden"));
  check("詳解切換按鈕預設 aria-expanded=false", explainToggle.getAttribute("aria-expanded") === "false");

  explainToggle.click();
  check("點擊後詳解展開（hidden 移除，真實顯示詳解內容）",
    !explainText.hasAttribute("hidden") && explainText.textContent === "這是詳解內容");
  check("點擊後 aria-expanded 變為 true", explainToggle.getAttribute("aria-expanded") === "true");

  explainToggle.click();
  check("再次點擊收合回去（hidden 恢復）", explainText.hasAttribute("hidden"));
  check("再次點擊 aria-expanded 恢復 false", explainToggle.getAttribute("aria-expanded") === "false");

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 4. 立即重做（startReview）流程仍與詳解收合機制相容 ---------------- */
console.log("\n[4] 立即重做流程仍正常運作（不受詳解收合機制影響）");
{
  const { window: qWin } = loadPage("quiz.html");
  seedWrongItem(qWin);
  const carry = dumpSession(qWin);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());

  const reviewBtn = window.document.querySelector(".wb-detail__btn--primary");
  check("立即重做按鈕存在且可點擊（有真實選項資料）", !!reviewBtn && !reviewBtn.disabled);
  reviewBtn.click();
  const interaction = window.document.querySelector(".wb-detail__review");
  check("點擊後真實進入重新作答互動介面", !!interaction);
  const explainWrap = window.document.querySelector(".wb-detail__explain");
  check("重做期間詳解區塊整個隱藏（不會透過收合機制偷看到答案）",
    !explainWrap || explainWrap.hasAttribute("hidden"));

  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\nWrongBookRedesignRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
