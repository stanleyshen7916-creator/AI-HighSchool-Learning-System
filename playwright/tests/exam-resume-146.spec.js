/* playwright/tests/exam-resume-146.spec.js — Sprint AI-146 (PO 回報：手機
   ／電腦上，點「開始測驗」畫面又跳回測驗中心列表，且之後永久卡住，重新
   整理頁面才會恢復).

   Root cause: js/pages/AppQuiz.js's own window.addEventListener(
   "ahs:repository-pulled", guardedInit) — Sprint AI-142 wired real
   Supabase credentials into production, so js/repository/RepositorySync.js's
   background pull() now genuinely round-trips the network for the first
   time (before AI-142, AHS.SyncBridge.isConfigured() was false and pull()
   returned on its very first line — this event never used to fire at
   all). When that real pull resolves while a student is mid-exam, this
   listener re-runs the ENTIRE page bootstrap, rebuilding AHS.QuizCenter.
   create() from scratch — whose own routing only ever read URL params,
   never "is there already a real Session running", so it silently fell
   back to the plain list, discarding the exam view. Meanwhile
   AHS.ExamRuntime's own "only one Session can run at a time" guard (its
   activeExamId is memory-only, never reset except by a genuine full page
   reload) kept blocking every subsequent attempt — the "永久卡住" symptom.

   Fix (js/components/QuizCenter.js): create() now checks
   AHS.ExamRuntime.getCurrent() first and resumes a real running Session
   instead of blindly re-deriving the view from URL params. This spec
   reproduces the exact real-browser trigger — a real
   window.dispatchEvent(new CustomEvent("ahs:repository-pulled")), the
   same event RepositorySync.js's own real pull dispatches — while a real
   exam is running, and confirms the exam view survives it. Complements
   tests/regression/KnowledgeEngineRegression.js's own §10 (jsdom-level,
   same scenario, Runtime-level assertions). */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") { return; }
    const loc = msg.location && msg.location();
    if (loc && /SupabaseConfig\.local\.js$/.test(loc.url || "")) { return; }
    errors.push(msg.text());
  });
  return errors;
}

test("AI-146：ahs:repository-pulled 背景重新渲染，不得蓋掉正在進行的測驗（真實點擊「開始測驗」後模擬背景 Pull 完成）", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("quiz"));

  // 平時練習列表裡，任一真實 Repository 教材的「開始測驗」— 這裡直接抓
  // 畫面上第一筆真實存在的列，不假設特定教材/科目，對應 PO 回報「任何
  // 教材都一樣」。
  const startBtn = page.locator(".quiz-row__start").first();
  await expect(startBtn).toBeVisible();
  await startBtn.click();

  // 真實進入作答畫面（.qcard），非清單。
  await expect(page.locator(".qcard")).toBeVisible();
  const firstExamId = await page.evaluate(() => window.AHS.ExamRuntime.getCurrent().examId);
  expect(firstExamId).toBeTruthy();

  // 真實觸發與 RepositorySync.js 完全相同的事件（背景 Supabase pull 完成
  // 時會 dispatch 的那一個），模擬 AI-142 上線後才會真的出現的競態時機。
  await page.evaluate(() => {
    window.dispatchEvent(new window.CustomEvent("ahs:repository-pulled"));
  });

  // 核心修正：畫面必須繼續停留在同一個作答畫面，不能被背景重新渲染蓋掉
  // 變回清單。
  await expect(page.locator(".qcard")).toBeVisible();
  await expect(page.locator(".quiz-row")).toHaveCount(0);
  const examIdAfterRepull = await page.evaluate(() => window.AHS.ExamRuntime.getCurrent().examId);
  expect(examIdAfterRepull).toBe(firstExamId);

  // 真實答完並完成測驗（點擊真實的作答/下一題/完成測試按鈕，非直接呼叫
  // Runtime），證明沒有卡死：完成後同一頁再次點其他教材的「開始測驗」也
  // 要真的能成功進入，而不是被剛剛那個已經結束的 Session 卡住。
  for (let i = 0; i < 20; i++) {
    await page.locator(".qcard-option").first().click();
    const finishBtn = page.locator(".qnav__finish");
    if (await finishBtn.count()) { await finishBtn.click(); break; }
    await page.locator(".qnav__next").click();
  }
  await expect(page.locator(".qreview")).toBeVisible();

  await page.locator(".qreview__back").click();
  await expect(page.locator(".quiz-row").first()).toBeVisible();

  const secondStartBtn = page.locator(".quiz-row__start").first();
  await secondStartBtn.click();
  await expect(page.locator(".qcard")).toBeVisible();

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
