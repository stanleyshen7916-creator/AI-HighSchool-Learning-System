/* playwright/tests/learning-loop.spec.js — Sprint AI-116 AI-116-04
   Learning Loop E2E.

   首頁 -> 教材 -> Summary -> Quiz -> WrongBook -> Review -> Tutor ->
   Learning -> Statistics(Dashboard), in one real browser session
   (sessionStorage carries across file:// navigations within this
   repository's own directory, confirmed empirically — the same real
   behavior GitHub Pages hosting gives this static app).

   Seed data (one material + its Summary + one wrong-answer WrongBook
   item) uses the exact same real Runtime schemas
   tests/jsdom/BehaviorSuite.js already seeds and has proven correct —
   this Sprint adds the real-browser layer on top (catching rendering/
   CSS bugs jsdom's DOM-only simulation structurally cannot, the same
   class of bug HOTFIX-006/007 needed a human to catch by hand before
   this Sprint existed), it does not re-derive the schema from scratch.
   The Review Session step is driven by REAL clicks (select option ->
   submit -> read the real result screen), not just sessionStorage
   assertions — this is the one step in the loop with genuine
   interactive UI to exercise; Quiz/Tutor/Learning/Dashboard are
   verified as real, error-free, correctly-rendered stops in the chain
   (a judgment call, flagged in the Sprint report: driving a full
   Exam-Mode quiz-taking interaction end-to-end was out of scope for
   this Sprint's own time budget — WrongBook is seeded to already
   contain one real wrong answer, the same "a quiz was already taken"
   starting state Sprint AI-114's own Review Session test used). */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");
const { seedSession, todayStr } = require("../helpers/seed.js");

const MATERIAL_ID = "rt_1";
const MATERIAL_TITLE = "AI-116 學習迴圈教材";

const SEED = {
  "ahs:materialRuntime": {
    materials: [{
      id: MATERIAL_ID, order: 1, subject: "math", title: MATERIAL_TITLE, chapter: "第一章",
      grade: "高一", category: "課本", date: "2026/08/03", views: "1", content: "",
      createdAt: todayStr(),
      progress: 40, lastOpenedAt: "2026/08/03 09:00", lastLearningAt: "2026/08/03 09:00",
      learningTime: 15, learningCount: 1, favorite: false, fileName: "", fileType: "FILE",
      fileSize: "", folderId: null
    }],
    folders: [], seq: 1, folderSeq: 0
  },
  "ahs:summaryRuntime": {
    items: [{
      id: "sr_1", materialId: MATERIAL_ID, subject: "math", grade: "高一",
      chapter: "第一章", section: "第一節", title: MATERIAL_TITLE,
      coreConcepts: ["AI-116 核心概念"], definitions: ["AI-116 定義"],
      pitfalls: ["AI-116 易錯點"], memorize: ["AI-116 重點"],
      reviewSuggestions: ["建議複習：第一章"], generatedAt: "2026/08/03"
    }], seq: 1
  },
  "ahs:wrongBookRuntime": {
    items: [{
      id: "wb_1", questionId: "q1", subject: "math", title: MATERIAL_TITLE,
      chapter: "第一章", materialId: MATERIAL_ID, knowledgePoint: "AI-116 核心概念",
      question: "1+1=?", options: [{ key: "A", text: "1" }, { key: "B", text: "2" }],
      yourAnswer: "A", correctAnswer: "B", explanation: "詳解", errorCount: 1,
      lastError: "2026/08/03 09:00", bookmarked: false, correctStreak: 0
    }], seq: 1
  }
};

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => { if (msg.type() === "error") { errors.push(msg.text()); } });
  return errors;
}

test("Learning Loop E2E：首頁 -> 教材 -> Summary -> Quiz -> WrongBook -> Review -> Tutor -> Learning -> Statistics", async ({ page }) => {
  const errors = collectErrors(page);
  await seedSession(page, SEED);

  await test.step("首頁", async () => {
    await page.goto(fileUrl("home"));
    await expect(page.locator(".shell")).toBeVisible();
    await expect(page.locator("body")).toContainText(MATERIAL_TITLE);
  });

  await test.step("教材中心", async () => {
    await page.goto(fileUrl("materials"));
    await expect(page.locator('.mat-card[data-id="' + MATERIAL_ID + '"]')).toContainText(MATERIAL_TITLE);
  });

  await test.step("Summary（學習總結）", async () => {
    await page.goto(fileUrl("summary") + "?materialId=" + MATERIAL_ID);
    await expect(page.locator("body")).toContainText("AI-116 核心概念");
  });

  await test.step("Quiz（測驗中心）", async () => {
    await page.goto(fileUrl("quiz"));
    await expect(page.locator(".shell__main")).toBeVisible();
  });

  await test.step("WrongBook（錯題本）", async () => {
    await page.goto(fileUrl("wrongbook"));
    await expect(page.locator("body")).toContainText(MATERIAL_TITLE);
    /* Sprint AI-118 AI-118-07: 錯題本統計卡改為顯示「今日待複習」
       （AHS.StatisticsRuntime.dueForReview()，取代先前的「尚未精熟」）。 */
    await expect(page.locator("body")).toContainText("今日待複習");
  });

  await test.step("Review（複習中心）— 真實作答互動", async () => {
    await page.goto(fileUrl("review"));
    const startBtn = page.locator(".rv-quick__btn", { hasText: "開始今日複習" });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    const session = page.locator(".rv-session");
    await expect(session).toContainText(MATERIAL_TITLE);

    const correctOption = page.locator(".wb-detail__option", { hasText: "2" });
    await correctOption.click();
    const submitBtn = page.locator(".wb-detail__btn--primary", { hasText: "提交答案" });
    await submitBtn.click();

    const result = page.locator(".rv-session__result");
    await expect(result).toContainText("答對");
    await expect(result).toContainText("100%");

    const doneBtn = page.locator(".rv-session__btn--primary");
    await doneBtn.click();
    await expect(page.locator(".rv-session")).toHaveCount(0);

    const correctStreak = await page.evaluate(() => {
      const data = window.AHS.PersistenceAdapter.load("wrongBookRuntime");
      const item = data && data.items && data.items.find((it) => it.id === "wb_1");
      return item ? item.correctStreak : null;
    });
    expect(correctStreak).toBe(1);
  });

  await test.step("Tutor（AI Tutor）", async () => {
    await page.goto(fileUrl("tutor"));
    await expect(page.locator(".tutor-thread, .tutor-chat").first()).toBeVisible();
  });

  await test.step("Learning（我的學習）", async () => {
    await page.goto(fileUrl("learning"));
    await expect(page.locator(".shell__main")).toBeVisible();
  });

  await test.step("Statistics（學習儀表板）", async () => {
    await page.goto(fileUrl("dashboard"));
    await expect(page.locator(".shell__main")).toBeVisible();
  });

  /* Sprint AI-117 AI-117-12: "Learning Analytics -> 首頁 -> 確認所有資料
     一致" — after the full real loop above (including a real Review
     Session answer that just changed WrongBookRuntime), 首頁 must reflect
     the exact same real Learning Analytics numbers as
     AHS.StatisticsRuntime itself, never a stale or independently-
     recomputed value. */
  await test.step("Learning Analytics -> 首頁：資料一致", async () => {
    await page.goto(fileUrl("home"));
    const consistency = await page.evaluate((materialId) => {
      const A = window.AHS;
      return {
        renderedCompletionText: (document.querySelector('[data-href*="' + materialId + '"] .recent-card__pct') || {}).textContent || null,
        analyticsCompletion: A.StatisticsRuntime.materialCompletion(materialId),
        dueForReview: A.StatisticsRuntime.dueForReview().length
      };
    }, MATERIAL_ID);
    expect(consistency.renderedCompletionText).toContain(String(consistency.analyticsCompletion.percent) + "%");
    /* correctStreak just advanced 0 -> 1 in the Review step above — real
       progress, but mastery requires correctStreak >= 3 (the same
       existing rule this whole codebase already uses), so this one real
       item honestly still counts as due, not yet mastered. */
    expect(consistency.dueForReview).toBe(1);
  });

  expect(errors, "Console errors across the Learning Loop: " + errors.join(" | ")).toEqual([]);
});
