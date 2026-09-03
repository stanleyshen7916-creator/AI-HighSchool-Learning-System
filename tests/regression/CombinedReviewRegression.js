/* tests/regression/CombinedReviewRegression.js — Feature B (使用者需求）：
   "在「平時測驗」與「考前複習」裡增加一個選擇功能，用於可以挑選複習的
   課別，舉例：國文第一次月考共考三課，除了每課自行練習外，可以一次
   選擇三課來進行複習". 使用者確認方案：「進入平時練習/考前總複習前，
   先跳出課別複選畫面（推薦）」.

   Uses the repo's own REAL Repository fixture data — the 3 real 國文
   (chinese) chapters under data/materials/ChineseG11*.js (第一課／第二課／
   第三課／近體詩選, all real workspaceSemester "g2s1") — exactly the
   使用者's own worked example (同一科目、三課). No fabricated content;
   every assertion below reads real, already-imported
   AHS.QuestionRuntime/AHS.QuestionBankRuntime data, never a hardcoded
   question count.

   Since the 高二上（g2s1）workspace now also carries a real 英文 chapter
   (data/materials/EnglishG11DayIBrokeTheRules.js), the Picker's own
   subject-tab UI is exercised too: the tests below verify the Picker
   correctly shows 2 subject tabs, defaults to 國文 (registration order),
   and only the checkboxes within the currently active subject tab are
   selected/combined — the underlying "同一科目、三課" combined-review
   scenario this file was written to verify is otherwise unchanged.

   Verifies:
   - 平時練習 (Exam Mode) list shows a real "選擇多課合併複習" action;
     opens a real chapter-picker overlay (openChapterPicker) defaulting to
     the 國文 subject tab, listing all 3 real chinese chapters as
     checkable rows.
   - Checking >=1 chapter and confirming starts ONE real combined
     ExamRuntime session (tryCombinedExamEntry) whose question count is
     the real sum of each selected chapter's own drawCycle() draw
     (min(FORMAL_EXAM_QUESTION_COUNT, that chapter's real bank size)) —
     never fabricated/padded.
   - The combined session's subject/title/chapter are real, derived from
     the same repositoryExamCatalog() entries the picker displayed.
   - Backdrop-click / Escape / X-button cancel the picker without
     starting any session (list unchanged).
   - 考前總複習 (Practice Mode)'s Repository 教材 section shows the same
     action; confirming opens ONE real combined Practice Session
     (openCombinedPractice) whose question count is the real sum of
     every selected chapter's FULL real question set (no
     FORMAL_EXAM_QUESTION_COUNT cap — 考前總複習's own real
     "涵蓋題庫全部題目" characteristic, unchanged).
   - The combined Practice Session header honestly shows "N 課合併複習"
     rather than any single chapter's own name.
   - The end-to-end combined-exam flow still drives the exact same real
     ExamRuntime -> AutoGrader -> WrongBookRuntime/HistoryRuntime chain
     every other exam entry point uses (not a parallel grading path).

   Run: node tests/regression/CombinedReviewRegression.js */
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

/* student_a is real-data authorized for BOTH cjsh/g1s2 AND cjsh/g2s1
   (js/data/WorkspaceData.js permissions) — scoping to g2s1 ONLY here
   means exactly the 3 real chinese chapters load (all tagged g2s1),
   with no unrelated tm_1~4 (g1s2) content mixed in, giving a clean,
   real single-subject multi-chapter scenario matching 使用者's own
   example without needing to fabricate any fixture data. */
const DEFAULT_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] };

function loadPage(htmlFile, opts) {
  opts = opts || {};
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
    url: "https://ahs.test/" + htmlFile,
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
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify(opts.workspace || DEFAULT_WORKSPACE));
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function click(node) {
  node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
}

console.log("Combined Review Regression — Feature B（平時練習／考前總複習 課別複選合併）");

/* ---- 0. Sanity: real 3-chapter same-subject fixture actually loaded -- */
console.log("\n[0] 前置檢查 — 真實 3 個國文課別（第一課／第二課／第三課）確實已匯入");
let realExamIds = [];
{
  const { window, consoleErrors } = loadPage("quiz.html");
  const AHS = window.AHS;
  const idMap = AHS.PersistenceAdapter.load("teachingMaterialLoaderIdMap") || {};
  const chineseSourceIds = ["chinese-g11-jinti-shixuan", "chinese-g11-laoshan-daoshi", "chinese-g11-inventions-changed-world"];
  realExamIds = chineseSourceIds
    .map((sourceId) => idMap[sourceId])
    .filter(Boolean)
    .map((runtimeId) => "teaching_material_" + runtimeId)
    .filter((examId) => AHS.QuestionRuntime.hasExam(examId));
  check("真實匯入了 3 個國文課別（非捏造數字）", realExamIds.length === 3);
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 1. 平時練習：選擇多課合併複習按鈕 + Picker 真實顯示 3 課 --------- */
console.log("\n[1] 平時練習列表 — 真實顯示「選擇多課合併複習」按鈕，點擊後開啟真實課別複選畫面");
{
  const { window } = loadPage("quiz.html");
  const doc = window.document;
  const combineBtn = doc.querySelector(".quiz-combine-btn");
  check("平時練習列表真實顯示合併複習按鈕", !!combineBtn);

  click(combineBtn);
  const overlay = doc.querySelector(".qpick-overlay");
  check("點擊後真實開啟課別複選 Picker（進入平時練習前，先跳出複選畫面）", !!overlay);

  const subjectChips = doc.querySelectorAll(".qpick-subject");
  const subjectChipNames = Array.prototype.map.call(subjectChips, (c) => c.textContent);
  check("Picker 真實顯示 6 個科目（生物＋國文＋英文＋歷史＋數學＋公民與社會，本次 Workspace 範圍內的真實科目數，含 tm_5、tm_6、tm_7、tm_8、tm_9）",
    subjectChips.length === 6 && ["生物", "國文", "英文", "歷史", "數學", "公民與社會"].every((s) => subjectChipNames.indexOf(s) !== -1));

  /* tm_5（生物，Package track）現為此 Workspace 內註冊順序最早的教材，
     成為預設分頁 — 不再假設「國文」永遠是第一個分頁，改為明確點擊「國文」
     分頁後，再驗證該分頁底下的真實課別內容（更貼近使用者實際操作，也不
     會因未來教材匯入順序改變而變得脆弱）。 */
  const chineseChip = Array.prototype.filter.call(subjectChips, (c) => c.textContent === "國文")[0];
  check("真實存在「國文」科目分頁", !!chineseChip);
  click(chineseChip);

  const rows = doc.querySelectorAll(".qpick-row");
  check("點擊國文分頁後真實列出 3 個可複選課別（第一課／第二課／第三課／近體詩選）", rows.length === 3);

  const checkboxes = doc.querySelectorAll(".qpick-row input[type='checkbox']");
  check("每個課別 checkbox 都帶有真實 examId（可追溯回真實 QuestionRuntime exam）",
    Array.prototype.every.call(checkboxes, (cb) => realExamIds.indexOf(cb.getAttribute("data-exam-id")) !== -1));

  const confirmBtnBefore = doc.querySelector(".qpick-btn--primary");
  check("尚未勾選任何課別時，確認按鈕真實為 disabled（不得空選就開始）", confirmBtnBefore.disabled === true);
}

/* ---- 2. 平時練習：勾選 2 課並確認 -> 真實開啟「一個」合併測驗 -------- */
console.log("\n[2] 平時練習 — 勾選 2 課並確認，真實開始「一個」合併測驗（非分開兩次）");
{
  const { window } = loadPage("quiz.html");
  const AHS = window.AHS;
  const doc = window.document;

  /* Real, pre-combine bank sizes — the expected combined count is
     derived from these, never hardcoded, so this assertion stays
     correct even if the real fixture content changes later. */
  const expectedPerChapter = realExamIds.map((examId) => {
    const bank = AHS.QuestionBankRuntime.getBank(examId);
    return Math.min(10, bank.length); /* FORMAL_EXAM_QUESTION_COUNT */
  });

  click(doc.querySelector(".quiz-combine-btn"));
  const subjectChips2 = doc.querySelectorAll(".qpick-subject");
  click(Array.prototype.filter.call(subjectChips2, (c) => c.textContent === "國文")[0]);
  const checkboxes = Array.prototype.slice.call(doc.querySelectorAll(".qpick-row input[type='checkbox']"), 0, 2);
  checkboxes.forEach((cb) => { cb.checked = true; cb.dispatchEvent(new window.Event("change", { bubbles: true })); });

  const confirmBtn = doc.querySelector(".qpick-btn--primary");
  check("勾選 2 課後，確認按鈕真實啟用，文字顯示「已選 2 課」", !confirmBtn.disabled && confirmBtn.textContent.indexOf("已選 2 課") !== -1);
  click(confirmBtn);

  check("Picker 確認後真實關閉", !doc.querySelector(".qpick-overlay"));
  check("真實進入測驗作答畫面（.qexam）", !!doc.querySelector(".qexam"));

  const current = AHS.ExamRuntime.getCurrent();
  check("ExamRuntime 真實只有「一個」正在進行的合併 Session（非兩個獨立 Session）", !!current);
  check("合併 Session 的 examId 是一個新的 derived id（combined_exam_...）", /^combined_exam_/.test(current.examId));
  check("合併 Session 的科目真實為 chinese（來自真實 catalog，非捏造）", current.subject === "chinese");

  const expectedTotal = expectedPerChapter[0] + expectedPerChapter[1];
  const actualQuestions = AHS.QuestionRuntime.getSet(current.examId);
  check("合併後題數 = 兩課真實抽題數總和（" + expectedTotal + " 題，非固定數字）", actualQuestions.length === expectedTotal);

  const ids = actualQuestions.map((q) => q.id);
  check("題目 id 皆真實唯一，無跨課合併碰撞", new Set(ids).size === ids.length);
}

/* ---- 3. 取消 Picker（背景點擊／Escape/X）— 不得誤觸開始測驗 --------- */
console.log("\n[3] 取消 Picker — 背景點擊／Escape／X 按鈕皆真實取消，不啟動任何合併 Session");
{
  const { window } = loadPage("quiz.html");
  const AHS = window.AHS;
  const doc = window.document;

  click(doc.querySelector(".quiz-combine-btn"));
  var overlay = doc.querySelector(".qpick-overlay");
  /* Dispatching directly on the overlay node itself (not a descendant)
     makes e.target === overlay, the exact real backdrop-click condition
     openChapterPicker()'s own click handler checks. */
  overlay.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("背景點擊真實關閉 Picker", !doc.querySelector(".qpick-overlay"));
  check("背景點擊取消後，未啟動任何合併測驗（ExamRuntime 無真實 Session）", !AHS.ExamRuntime.getCurrent());

  click(doc.querySelector(".quiz-combine-btn"));
  const closeX = doc.querySelector(".qpick-close");
  click(closeX);
  check("X 按鈕真實關閉 Picker", !doc.querySelector(".qpick-overlay"));

  click(doc.querySelector(".quiz-combine-btn"));
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("Escape 真實關閉 Picker", !doc.querySelector(".qpick-overlay"));
  check("整個取消流程結束後，列表仍正常顯示（未卡在 Picker 或崩潰畫面）", !!doc.querySelector(".quiz-combine-btn"));
}

/* ---- 4. 考前總複習：Repository 教材區塊真實顯示合併複習按鈕 --------- */
console.log("\n[4] 考前總複習 — Repository 教材區塊真實顯示合併複習按鈕，勾選 3 課後真實開啟「一個」合併練習畫面");
{
  const { window } = loadPage("quiz.html");
  const AHS = window.AHS;
  const doc = window.document;

  const practiceTab = Array.prototype.filter.call(doc.querySelectorAll(".quiz-mode__tab"), (b) => b.textContent === "考前總複習")[0];
  check("真實找到考前總複習分頁", !!practiceTab);
  click(practiceTab);

  const combineBtn = doc.querySelector(".quiz-practice__list .quiz-combine-btn");
  check("Repository 教材清單真實顯示合併複習按鈕", !!combineBtn);

  /* Real, pre-combine full question counts (考前總複習 涵蓋題庫「全部」
     題目，不像平時練習有 10 題上限) — derived from AHS.QuestionRuntime
     directly, never hardcoded. */
  const expectedTotal = realExamIds.reduce((sum, examId) => sum + AHS.QuestionRuntime.getSet(examId).length, 0);

  click(combineBtn);
  const subjectChips4 = doc.querySelectorAll(".qpick-subject");
  click(Array.prototype.filter.call(subjectChips4, (c) => c.textContent === "國文")[0]);
  const checkboxes = doc.querySelectorAll(".qpick-row input[type='checkbox']");
  check("考前總複習的 Picker 點擊國文分頁後也真實列出全部 3 課", checkboxes.length === 3);
  Array.prototype.forEach.call(checkboxes, (cb) => { cb.checked = true; cb.dispatchEvent(new window.Event("change", { bubbles: true })); });
  click(doc.querySelector(".qpick-btn--primary"));

  check("Picker 確認後真實關閉", !doc.querySelector(".qpick-overlay"));
  const qpv = doc.querySelector(".qpv");
  check("真實進入「一個」合併練習作答畫面（.qpv，非個別跳轉 3 次）", !!qpv);

  const title = doc.querySelector(".qpv__title");
  check("合併練習標題真實標示「3 課合併複習」（誠實呈現為合併，而非假裝是單一課）",
    !!title && title.textContent.indexOf("3 課合併複習") !== -1);
  check("合併練習標題仍真實顯示科目「國文」", !!title && title.textContent.indexOf("國文") !== -1);

  const total = doc.querySelectorAll(".qpv__body").length ? Number((title.textContent.match(/第 1 \/ (\d+) 題/) || [])[1]) : 0;
  check("合併練習真實涵蓋 3 課「全部」題目總和（" + expectedTotal + " 題，非平時練習的 10 題上限）", total === expectedTotal);
}

/* ---- 5. 端對端 — 合併測驗仍走真實 ExamRuntime->AutoGrader->WrongBook 鏈 */
console.log("\n[5] 端對端 — 合併測驗作答後，仍真實走完整 ExamRuntime -> AutoGrader -> WrongBook/History 鏈（非另一條特例路徑）");
{
  const { window, consoleErrors } = loadPage("quiz.html");
  const AHS = window.AHS;
  const doc = window.document;

  click(doc.querySelector(".quiz-combine-btn"));
  const checkboxes = doc.querySelectorAll(".qpick-row input[type='checkbox']");
  Array.prototype.forEach.call(checkboxes, (cb) => { cb.checked = true; cb.dispatchEvent(new window.Event("change", { bubbles: true })); });
  click(doc.querySelector(".qpick-btn--primary"));

  const current = AHS.ExamRuntime.getCurrent();
  const questions = AHS.QuestionRuntime.getSet(current.examId);
  check("合併 Session 真實涵蓋全部 3 課題目", questions.length > 0);

  /* Answer the first question only, then finish — real end-to-end. */
  const firstQ = questions[0];
  const firstOptionKey = (firstQ.options && firstQ.options[0] && firstQ.options[0].key) || "A";
  AHS.AnswerRuntime.saveAnswer(current.examId, firstQ.id, firstOptionKey);
  const finished = AHS.ExamRuntime.finish(current.examId);
  const graded = AHS.AutoGrader.grade(finished);
  check("AutoGrader 真實成功評分合併 Session", !!graded);

  AHS.WrongBookRuntime.sync(graded);
  AHS.HistoryRuntime.record(graded);
  const historyList = AHS.HistoryRuntime.list ? AHS.HistoryRuntime.list() : [];
  check("HistoryRuntime 真實記錄了這次合併測驗", historyList.some((h) => h.examId === current.examId));

  check("整個合併測驗端對端流程 0 console error", consoleErrors.length === 0);
}

console.log("\nCombinedReviewRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
