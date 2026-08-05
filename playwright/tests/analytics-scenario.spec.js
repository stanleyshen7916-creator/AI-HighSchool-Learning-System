/* playwright/tests/analytics-scenario.spec.js — Sprint AI-117 AI-117-13
   Playwright Analytics Scenario.

   Verifies the Sprint's own worked example end-to-end in a REAL browser:
   教材閱讀完成 -> 20% -> 完成測驗 -> 60% -> 完成複習 -> 100%, and that
   every page showing this material's completion (首頁/教材中心) renders
   the exact same number — never a page-local recalculation
   (AI-117-10 Single Source, verified here from the browser side; the
   Node-side proof is tests/regression/AnalyticsRegression.js). */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");
const { seedSession } = require("../helpers/seed.js");

const MATERIAL_ID = "rt_1";
const MATERIAL_TITLE = "AI-117 Analytics 測試教材";

function baseSeed(progress) {
  return {
    "ahs:materialRuntime": {
      materials: [{
        id: MATERIAL_ID, order: 1, subject: "math", title: MATERIAL_TITLE, chapter: "第一章",
        grade: "高一", category: "課本", date: "2026/08/03", views: "1", content: "",
        progress: progress, lastOpenedAt: "2026/08/03 09:00", lastLearningAt: "2026/08/03 09:00",
        learningTime: 10, learningCount: 1, favorite: false, fileName: "", fileType: "FILE",
        fileSize: "", folderId: null
      }],
      folders: [], seq: 1, folderSeq: 0
    }
  };
}

async function completionTextOn(page, url, seed) {
  await seedSession(page, seed);
  await page.goto(url);
  /* Both pages also bridge the repository's own real Civics material
     (data/materials/MaterialRepositoryIndex.js, loaded on every page) —
     scope strictly to THIS test's own seeded material so its card is
     never confused with that unrelated real one. */
  const card = page.locator('[data-id="' + MATERIAL_ID + '"], [data-href*="' + MATERIAL_ID + '"]').first();
  const head = card.locator(".mat-card__progress-head, .recent-card__progress-head").first();
  return head.textContent();
}

test("Analytics Scenario：Material Completion 20% -> 60% -> 100%，跨頁一致", async ({ page }) => {
  /* Stage 0: reading not yet complete. */
  const seed0 = baseSeed(50);
  const text0 = await completionTextOn(page, fileUrl("materials"), seed0);
  expect(text0).toContain("教材完成度");
  expect(text0).toContain("10%"); // round(50/100*20)

  /* Stage 1: ①教材閱讀完成 -> 20%. */
  const seed1 = baseSeed(100);
  const text1Materials = await completionTextOn(page, fileUrl("materials"), seed1);
  expect(text1Materials).toContain("教材閱讀完成");
  expect(text1Materials).toContain("20%");
  const text1Home = await completionTextOn(page, fileUrl("home"), seed1);
  expect(text1Home).toContain("教材閱讀完成");
  expect(text1Home).toContain("20%");

  /* Stage 2: ②完成測驗（尚有未精熟錯題）-> 60%. */
  const seed2 = Object.assign({}, baseSeed(100), {
    "ahs:historyRuntime": { items: [{
      id: "hist_1", order: 1, examId: "teaching_material_" + MATERIAL_ID, subject: "math",
      title: MATERIAL_TITLE, chapter: "第一章", score: 80, accuracy: 80, correctCount: 4, totalCount: 5,
      when: "2026/08/03 10:00"
    }], seq: 1 },
    "ahs:wrongBookRuntime": { items: [{
      id: "wb_1", questionId: "q1", subject: "math", title: MATERIAL_TITLE, chapter: "第一章",
      materialId: MATERIAL_ID, knowledgePoint: "kp1", question: "Q1",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
      yourAnswer: "A", correctAnswer: "B", explanation: "", errorCount: 1, lastError: "2026/08/03",
      bookmarked: false, correctStreak: 0
    }], seq: 1 }
  });
  const text2Materials = await completionTextOn(page, fileUrl("materials"), seed2);
  expect(text2Materials).toContain("測驗完成");
  expect(text2Materials).toContain("60%");
  const text2Home = await completionTextOn(page, fileUrl("home"), seed2);
  expect(text2Home).toContain("測驗完成");
  expect(text2Home).toContain("60%");

  /* Stage 3: ③完成複習（唯一錯題已精熟）-> 100%. */
  const seed3 = JSON.parse(JSON.stringify(seed2));
  seed3["ahs:wrongBookRuntime"].items[0].correctStreak = 3;
  const text3Materials = await completionTextOn(page, fileUrl("materials"), seed3);
  expect(text3Materials).toContain("複習完成");
  expect(text3Materials).toContain("100%");
  const text3Home = await completionTextOn(page, fileUrl("home"), seed3);
  expect(text3Home).toContain("複習完成");
  expect(text3Home).toContain("100%");
});

test("Analytics Scenario：學習中心科目進度來自 StatisticsRuntime.subjectAnalytics()，非自行計算", async ({ page }) => {
  const seed = baseSeed(100);
  await seedSession(page, seed);
  await page.goto(fileUrl("learning"));
  const subjectPercent = await page.evaluate(() => {
    const el = document.querySelector(".ml-progress__pct");
    return el ? el.textContent : null;
  });
  const analyticsPercent = await page.evaluate(() => {
    const a = window.AHS.StatisticsRuntime.subjectAnalytics().find((s) => s.subject === "math");
    return a ? a.materialCompletionRate + "%" : null;
  });
  expect(subjectPercent).toBe(analyticsPercent);
});
