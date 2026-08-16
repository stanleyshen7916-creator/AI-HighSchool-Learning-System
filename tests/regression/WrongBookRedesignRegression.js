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
  /* Sprint AI-142: jsdom has no window.fetch — now that real Supabase
     config is committed (js/data/SupabaseConfig.js), any code path that
     reaches AHS.SupabaseClient would otherwise throw a synchronous
     ReferenceError instead of the graceful network-failure rejection
     the real code already handles via .catch(). Stub it to fail
     immediately so every test stays offline/deterministic (this sandbox
     has no real outbound access to Supabase anyway) without touching
     any Supabase source file. */
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
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

/* ---- 3. AI-129: 頁面載入時不自動彈出任何 Modal，點擊題目才彈出 -------- */
console.log("\n[3] AI-129 — 載入時無任何 Modal 自動彈出；點擊題目才真的彈出「題目詳解」");
{
  const { window: qWin } = loadPage("quiz.html");
  seedWrongItem(qWin);
  const carry = dumpSession(qWin);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());

  check("載入當下沒有任何題目列被標記為 is-active（無自動選取）",
    window.document.querySelectorAll(".wb-row.is-active").length === 0);
  check("載入當下沒有 Modal Overlay 存在", !window.document.querySelector(".wb-modal__overlay"));

  const row = window.document.querySelector(".wb-row");
  check("題目列表真實存在（未渲染成兩欄式排版，而是全寬單欄）", !!row);
  row.click();

  check("點擊題目後才真的彈出 Modal", !!window.document.querySelector(".wb-modal__overlay"));
  check("被點擊的列真的標記為 is-active", row.classList.contains("is-active"));
  check("Modal 內容真的是題目詳解（含題目文字）", !!window.document.querySelector(".wb-modal__body .wb-detail__question"));

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 4. Detail Modal — 統計區塊 + 詳解預設收合，點擊才展開 ------------- */
console.log("\n[4] Detail Modal — 統計區塊真實反映次數；詳解預設收合，點擊 explainToggle 才展開");
{
  const { window: qWin } = loadPage("quiz.html");
  const item = seedWrongItem(qWin);
  qWin.AHS.WrongBookRuntime.recordRetry(item.id, true);
  qWin.AHS.WrongBookRuntime.recordRetry(item.id, true);
  const carry = dumpSession(qWin);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());
  window.document.querySelector(".wb-row").click();

  const statValues = Array.from(window.document.querySelectorAll(".wb-detail__stat-value")).map((n) => n.textContent);
  check("Detail Modal 統計區塊顯示錯誤次數(1)與正確次數(2)", statValues.indexOf("1") !== -1 && statValues.indexOf("2") !== -1);

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

/* ---- 5. Modal 關閉機制：X／背景點擊／Escape 皆可真實關閉 --------------- */
console.log("\n[5] AI-129 — Modal 三種關閉方式（X／背景點擊／Escape）皆真實生效，且清空選取狀態");
{
  const { window: qWin } = loadPage("quiz.html");
  seedWrongItem(qWin);
  const carry = dumpSession(qWin);

  // X 按鈕
  {
    const { window } = loadPage("wrongbook.html", { seedSession: carry });
    window.document.body.appendChild(window.AHS.WrongBook.create());
    const row = window.document.querySelector(".wb-row");
    row.click();
    window.document.querySelector(".wb-modal__close").click();
    check("點擊 X 後 Modal 真的關閉", !window.document.querySelector(".wb-modal__overlay"));
    check("關閉後該列的 is-active 也真的移除", !row.classList.contains("is-active"));
  }

  // 背景點擊
  {
    const { window } = loadPage("wrongbook.html", { seedSession: carry });
    window.document.body.appendChild(window.AHS.WrongBook.create());
    window.document.querySelector(".wb-row").click();
    const overlay = window.document.querySelector(".wb-modal__overlay");
    overlay.dispatchEvent(new window.Event("click", { bubbles: true }));
    check("點擊背景（非 Panel 本身）後 Modal 真的關閉", !window.document.querySelector(".wb-modal__overlay"));
  }

  // Escape 鍵
  {
    const { window } = loadPage("wrongbook.html", { seedSession: carry });
    window.document.body.appendChild(window.AHS.WrongBook.create());
    window.document.querySelector(".wb-row").click();
    window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
    check("按下 Escape 後 Modal 真的關閉", !window.document.querySelector(".wb-modal__overlay"));
  }
}

/* ---- 6. 篩選區塊與「今日待複習」並排（wb-top-row），非左右兩欄 -------- */
console.log("\n[6] AI-129 — 篩選區塊與「今日待複習」統計卡並排於同一列，題目列表為單欄全寬");
{
  const { window: qWin } = loadPage("quiz.html");
  seedWrongItem(qWin);
  const carry = dumpSession(qWin);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());

  const topRow = window.document.querySelector(".wb-top-row");
  check("wb-top-row 真實存在", !!topRow);
  check("wb-top-row 內同時包含「今日待複習」統計卡與篩選區塊（並排）",
    !!topRow.querySelector(".wb-summary") && !!topRow.querySelector(".wb-filter"));
  check("舊的左右兩欄式 wb-layout 不再存在（題目列表已改為單欄全寬）",
    !window.document.querySelector(".wb-layout"));

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 7. 清除篩選 bugfix：真的能重置下拉選單的視覺狀態 ------------------ */
console.log("\n[7] AI-129 bugfix — 清除篩選真的能重置篩選下拉選單（不只重置內部狀態）");
{
  const { window: qWin } = loadPage("quiz.html");
  seedWrongItem(qWin);
  const carry = dumpSession(qWin);

  const { window } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());

  const subjectSelect = window.document.querySelector('select[aria-label="科目"]');
  subjectSelect.selectedIndex = 1;
  subjectSelect.dispatchEvent(new window.Event("change", { bubbles: true }));

  const clearBtn = window.document.querySelector(".wb-clear");
  clearBtn.click();

  check("清除篩選後，科目下拉選單真的視覺回到第一個選項（bugfix：之前查詢錯 DOM 範圍，選單畫面不會重置）",
    subjectSelect.selectedIndex === 0);
}

/* ---- 8. 立即重做（startReview）流程仍與 Modal／詳解收合機制相容 -------- */
console.log("\n[8] 立即重做流程仍正常運作（在 Modal 內，不受詳解收合機制影響）");
{
  const { window: qWin } = loadPage("quiz.html");
  seedWrongItem(qWin);
  const carry = dumpSession(qWin);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());
  window.document.querySelector(".wb-row").click();

  const reviewBtn = window.document.querySelector(".wb-detail__btn--primary");
  check("立即重做按鈕存在且可點擊（有真實選項資料）", !!reviewBtn && !reviewBtn.disabled);
  reviewBtn.click();
  const interaction = window.document.querySelector(".wb-detail__review");
  check("點擊後真實進入重新作答互動介面（仍在同一個 Modal 內，未關閉再重開）", !!interaction);
  check("Modal 本身仍維持開啟（同一個 overlay，未被關閉重建）", !!window.document.querySelector(".wb-modal__overlay"));
  const explainWrap = window.document.querySelector(".wb-detail__explain");
  check("重做期間詳解區塊整個隱藏（不會透過收合機制偷看到答案）",
    !explainWrap || explainWrap.hasAttribute("hidden"));

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 9. AI-129 hotfix — 無選項資料時「立即重做」真的 disabled，並且有
   看得出來的視覺區別（使用者回報：按鈕看起來可點擊，點了卻沒反應） ------ */
function seedWrongItemNoOptions(window) {
  const AHS = window.AHS;
  const examId = "wb_no_options_test";
  AHS.QuestionRuntime.importQuestions(examId, [
    { id: "wq_no_opt", index: 1, text: "無選項資料的真實錯題（模擬 Supabase 拉回、無 options 欄位的情境）",
      correctAnswer: "A", knowledgePoint: "測試知識點", explanation: "詳解內容" }
  ]);
  const session = AHS.ExamRuntime.startFromExam(examId, { subject: "math", title: "測試教材" });
  AHS.AnswerRuntime.saveAnswer(session.examId, "wq_no_opt", "B");
  const finished = AHS.ExamRuntime.finish(session.examId);
  const graded = AHS.AutoGrader.grade(finished);
  AHS.WrongBookRuntime.sync(graded);
  return AHS.WrongBookRuntime.list()[0];
}

console.log("\n[9] AI-129 hotfix — 無選項資料（如 Supabase 拉回的真實記錄）時，立即重做真的被 disabled，且不會誤觸互動介面");
{
  const { window: qWin } = loadPage("quiz.html");
  seedWrongItemNoOptions(qWin);
  const carry = dumpSession(qWin);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carry });
  window.document.body.appendChild(window.AHS.WrongBook.create());
  window.document.querySelector(".wb-row").click();

  const reviewBtn = window.document.querySelector(".wb-detail__btn--primary");
  check("無選項資料時，立即重做按鈕真的是 disabled（過去雖 disabled 但無視覺差異，使用者會誤以為壞掉）",
    !!reviewBtn && reviewBtn.disabled === true);
  check("按鈕帶有 title 提示說明原因", reviewBtn.getAttribute("title") === "此題無選項資料，暫不支援立即重做");

  reviewBtn.click();
  check("點擊 disabled 按鈕不會誤觸互動介面（瀏覽器原生阻擋 disabled 按鈕觸發 click）",
    !window.document.querySelector(".wb-detail__review"));

  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\nWrongBookRedesignRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
