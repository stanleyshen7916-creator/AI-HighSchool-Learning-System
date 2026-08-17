/* playwright/tests/knowledge-engine.spec.js — Sprint AI-121 (Learning
   Knowledge Engine) real-browser, same-tab proof of the Sprint's own
   user-visible surfaces: Home KPI board (AI-121-01/19), Knowledge
   Weakness archive (AI-121-08), Review Mode question-count selector
   (AI-121-06), and Daily AI Practice's real random-draw entry
   (AI-121-05), complementing tests/regression/KnowledgeEngineRegression.js's
   jsdom-level Runtime coverage rather than duplicating it. */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");
const { seedSession } = require("../helpers/seed.js");

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") { return; }
    /* AI Supabase Persistence Root Cause Fix (Root Cause A): the one,
       git-ignored, optional js/data/SupabaseConfig.local.js this project
       already documents (.gitignore) — a real browser 404 on it (there is
       no way to reference an optional local-only file from a <script> tag
       without a real browser logging this, network-level, regardless of
       any onerror handler) is expected in CI/this Sandbox where the file
       never exists by design; every real reader already falls back to the
       committed blank AHS.SupabaseConfig. Filtered by the failing
       resource's own URL (msg.location().url), not by message text, so a
       genuine 404 on any other file still fails this assertion. */
    const loc = msg.location && msg.location();
    if (loc && /SupabaseConfig\.local\.js$/.test(loc.url || "")) { return; }
    errors.push(msg.text());
  });
  return errors;
}

test("AI-121：首頁學習成效總覽（.home-kpi）真實顯示 7 個 KPI（AI Tutor 建議因尚未串接真實 API 預設隱藏，見 Sprint AI-141），尚無資料時誠實顯示「尚無資料」", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("home"));
  const board = page.locator(".home-kpi");
  await expect(board).toBeVisible();
  const items = board.locator(".home-kpi__item");
  await expect(items).toHaveCount(7);
  await expect(board.locator('[data-kpi="tutorSuggestion"]')).toHaveCount(0);
  await expect(board.locator('[data-kpi="accuracyToday"] .home-kpi__value')).toHaveText("尚無資料");
  await expect(board.locator('[data-kpi="knowledgeMastery"] .home-kpi__value')).toHaveText("尚無資料");
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-121：知識弱點頁面 Sidebar／標題已更名（AI-121-08，非「錯題本」）", async ({ page }) => {
  await page.goto(fileUrl("wrongbook"));
  await expect(page.locator(".sidebar__item", { hasText: "知識弱點" })).toBeVisible();
  await expect(page).toHaveTitle(/知識弱點/);
});

test("AI-121：知識弱點封存（archive）真實隱藏於預設檢視，切換「已封存」篩選可見，永不真的刪除", async ({ page }) => {
  const errors = collectErrors(page);
  /* Sprint AI-122: seeding via page.evaluate(AHS.WrongBookRuntime.sync())
     immediately followed by page.reload() proved genuinely unreliable
     under CPU contention — sessionStorage was occasionally found
     completely empty after the reload, even after confirming the write
     landed (via page.waitForFunction()) before reloading. Switched to
     the robust, already-established pattern the rest of this suite uses
     for every other Runtime (see e.g. playwright/tests/analytics-
     scenario.spec.js's own "ahs:wrongBookRuntime" seed): seedSession()
     writes directly into sessionStorage via page.addInitScript(), which
     runs before ANY of the page's own <script> tags — a single
     page.goto() (never page.reload()) always finds the data already in
     place before AHS.WrongBookRuntime's own hydrate() call runs. */
  await seedSession(page, {
    "ahs:wrongBookRuntime": {
      items: [{
        id: "wb_1", questionId: "aq1", subject: "math", title: "封存測試題", chapter: "第一章",
        materialId: "", knowledgePoint: "kp_archive", question: "封存測試題內文",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "B", correctAnswer: "A", explanation: "",
        errorCount: 1, lastError: "2026/08/06", firstError: "2026/08/06", masteredAt: null,
        bookmarked: false, archived: false, correctStreak: 0
      }],
      seq: 1
    }
  });
  await page.goto(fileUrl("wrongbook"));
  const row = page.locator(".wb-row", { hasText: "封存測試題" });
  await expect(row).toBeVisible();

  await row.locator(".wb-row__more").click();
  await page.locator(".wb-row__menu-item", { hasText: "封存" }).click();
  // Filtered rows are hidden via display:none (real pagination/filter
  // mechanism, same as every other filter here), not removed from the
  // DOM — "永不真的刪除" holds at the DOM layer too.
  await expect(page.locator(".wb-row", { hasText: "封存測試題" })).toBeHidden();

  // Real record still exists — switching the 狀態 filter to 已封存 reveals it.
  await page.selectOption('select[aria-label="狀態"]', "已封存");
  await expect(page.locator(".wb-row", { hasText: "封存測試題" })).toBeVisible();

  const stillReal = await page.evaluate(() =>
    window.AHS.WrongBookRuntime.list().some((i) => i.title === "封存測試題" && i.archived === true));
  expect(stillReal).toBe(true);
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-121：複習中心 Review Mode 題數選單真實存在（AI-121-06）", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("review"));
  const select = page.locator(".rv-quick__count");
  await expect(select).toBeVisible();
  const optionValues = await select.locator("option").allTextContents();
  expect(optionValues.some((t) => t.includes("10"))).toBe(true);
  expect(optionValues.some((t) => t.includes("20"))).toBe(true);
  expect(optionValues.some((t) => t.includes("30"))).toBe(true);
  expect(optionValues.some((t) => t.includes("50"))).toBe(true);
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-121：再次測試 — 從真實 QuestionBank 隨機抽 10 題開始一個真實 Exam Session（AI-121-07）", async ({ page }) => {
  const errors = collectErrors(page);
  /* Sprint AI-143: 每日 AI 練習（mode=daily）已移除（與平時練習實質重複，
     且從未有真正的入口按鈕）——這個測試改為驗證 mode=retest（再次測試），
     它與 mode=daily 原本共用同一個 startDrawnSession()/drawRandom() 機制，
     是唯一還在使用這個真實隨機抽題路徑的入口，需要保留這條 Playwright
     覆蓋率，不能隨著 mode=daily 一起消失。
     Sprint AI-122: seeded via page.addInitScript()（seedSession()）before
     ANY page script runs — sidesteps a real evaluate()+navigate race this
     Sprint already found/fixed elsewhere (an evaluate() promise resolving
     back to Node can race ahead of the write actually committing in the
     browser process before the next navigation). */
  const questions = [];
  for (let i = 1; i <= 15; i++) {
    questions.push({
      id: "rq" + i, index: i, subject: "math", text: "再次測試題 " + i, type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      knowledgePoint: "kp_retest", questionSource: "ORIGINAL", origin: "x"
    });
  }
  await seedSession(page, {
    "ahs:questionBankRuntime": { banks: { "teaching_material_retest_test": questions } }
  });
  await page.goto(fileUrl("quiz") + "?mode=retest&examId=" + encodeURIComponent("teaching_material_retest_test"));
  // Wait for the real exam view to actually render before reading Runtime
  // state — under parallel-worker CPU contention, page.goto()'s own load
  // event can resolve a beat before this page's many synchronous <script>
  // tags finish executing AppQuiz.js's init(); the rendered .qcard is the
  // one honest, definitive "initialization actually finished" signal.
  await expect(page.locator(".qcard").first()).toBeVisible();
  const session = await page.evaluate(() => window.AHS.ExamRuntime.getCurrent());
  expect(session).toBeTruthy();
  expect(session.status).toBe("running");
  expect(session.totalQuestions).toBe(10); // Bank 有 15 題，再次測試真實抽 10 題
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
