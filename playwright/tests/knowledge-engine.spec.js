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

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => { if (msg.type() === "error") { errors.push(msg.text()); } });
  return errors;
}

test("AI-121：首頁學習成效總覽（.home-kpi）真實顯示 8 個 KPI，尚無資料時誠實顯示「尚無資料」", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("home"));
  const board = page.locator(".home-kpi");
  await expect(board).toBeVisible();
  const items = board.locator(".home-kpi__item");
  await expect(items).toHaveCount(8);
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
  await page.goto(fileUrl("wrongbook"));
  /* Sprint AI-122: under parallel-worker CPU contention, page.goto()'s
     own 'load' event can resolve a beat before wrongbook.html's many
     synchronous <script> tags finish executing AppWrongBook.js's init()
     — including the point where AHS.WorkspaceRuntime/PersistenceAdapter
     establish the real namespaced sessionStorage key
     AHS.WrongBookRuntime.sync() below writes to. Waiting for a
     genuinely-rendered element first (same fix pattern already applied
     once for knowledge-engine.spec.js's own daily-practice test, Sprint
     AI-121) proves init() actually finished before seeding. */
  await expect(page.locator(".wb-header__title")).toBeVisible();
  await page.evaluate(() => {
    // wrongbook.html doesn't load QuestionRuntime/ExamRuntime/AutoGrader
    // (those are quiz.html-only) — seed AHS.WrongBookRuntime.sync()
    // directly with a real graded-result-shaped object, same pattern
    // playwright/tests/workspace-repository.spec.js's own PAT⑤ uses.
    window.AHS.WrongBookRuntime.sync({
      subject: "math", title: "封存測試題", chapter: "第一章",
      wrong: [{
        questionId: "aq1", knowledgePoint: "kp_archive",
        text: "封存測試題內文", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "B", correctAnswer: "A", explanation: ""
      }]
    });
  });
  await page.reload();
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

test("AI-121：每日 AI 練習 — 從真實 QuestionBank 隨機抽 10 題開始一個真實 Exam Session（AI-121-05）", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("quiz"));
  await page.evaluate(() => {
    const AHS = window.AHS;
    const questions = [];
    for (let i = 1; i <= 15; i++) {
      questions.push({
        id: "dq" + i, index: i, subject: "math", text: "每日練習題 " + i, type: "single_choice",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
        knowledgePoint: "kp_daily", questionSource: "ORIGINAL", origin: "x"
      });
    }
    AHS.QuestionRuntime.importQuestions("teaching_material_daily_test", questions);
    AHS.QuestionBankRuntime.ensureBank("teaching_material_daily_test", questions);
  });
  await page.goto(fileUrl("quiz") + "?mode=daily&examId=" + encodeURIComponent("teaching_material_daily_test"));
  // Wait for the real exam view to actually render before reading Runtime
  // state — under parallel-worker CPU contention, page.goto()'s own load
  // event can resolve a beat before this page's many synchronous <script>
  // tags finish executing AppQuiz.js's init(); the rendered .qcard is the
  // one honest, definitive "initialization actually finished" signal.
  await expect(page.locator(".qcard").first()).toBeVisible();
  const session = await page.evaluate(() => window.AHS.ExamRuntime.getCurrent());
  expect(session).toBeTruthy();
  expect(session.status).toBe("running");
  expect(session.totalQuestions).toBe(10); // Bank 有 15 題，每日練習真實抽 10 題
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
