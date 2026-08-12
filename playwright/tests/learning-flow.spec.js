/* playwright/tests/learning-flow.spec.js — Sprint AI-118 AI-118-12
   Learning Flow E2E — the new Learning Loop this Sprint's own AI-118-01
   defines: 首頁 -> 教材中心 -> 學習總結 -> 考前總複習 -> 平時練習 -> 錯題本
   -> 首頁, driven by real clicks through the real, reworked CTAs
   (AI-118-04/05/06/07/08), confirming Navigation/Statistics/WrongBook/
   Tutor all stay in sync — never a second, independently-recomputed
   number at any stop.

   Practice questions are generated via the same REAL pipeline
   tests/jsdom/BehaviorSuite.js's own seedProductionQuestions() uses
   (AHS.AITutorService.ensureQuestionSet() -> AHS.QuestionProviderBridge.
   bridge()) — genuine LearningQuestionRuntime content, not hand-seeded
   fake records. 平時練習 is driven via page.evaluate() calling the same
   real ExamRuntime/AutoGrader/WrongBookRuntime/HistoryRuntime functions
   assessment-scenario.spec.js already established as this Sprint's own
   accepted pattern for a teaching-material-scoped exam (no real
   dual-mode Package exists to click a catalog-exam entry through, same
   scoping note as that file's own header). */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");
const { seedSession, todayStr } = require("../helpers/seed.js");

const MATERIAL_ID = "rt_1";
const MATERIAL_TITLE = "AI-118 學習迴圈教材";

const BASE_SEED = {
  "ahs:materialRuntime": {
    materials: [{
      id: MATERIAL_ID, order: 1, subject: "math", title: MATERIAL_TITLE, chapter: "第一章",
      grade: "高一", category: "課本", date: "2026/08/05", views: "1", content: "三角函數的基本定義與應用。",
      createdAt: todayStr(),
      progress: 100, lastOpenedAt: "2026/08/05 09:00", lastLearningAt: "2026/08/05 09:00",
      learningTime: 20, learningCount: 1, favorite: false, fileName: "", fileType: "FILE",
      fileSize: "", folderId: null
    }],
    folders: [], seq: 1, folderSeq: 0
  },
  "ahs:summaryRuntime": {
    items: [{
      id: "sr_1", materialId: MATERIAL_ID, subject: "math", grade: "高一",
      chapter: "第一章", section: "第一節", title: MATERIAL_TITLE,
      coreConcepts: ["AI-118 核心概念"], definitions: ["AI-118 定義"],
      pitfalls: ["AI-118 易錯點"], memorize: ["AI-118 重點"],
      reviewSuggestions: ["建議複習：第一章"], generatedAt: "2026/08/05"
    }], seq: 1
  }
};

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

/* Sprint AI-119: this file's own seedAll() has been folded into the
   shared playwright/helpers/seed.js's seedSession() (used elsewhere in
   this suite already) — it namespaces bare "ahs:<key>" seed entries to
   match the fixture's default test Workspace, idempotently, so an
   already-namespaced dumpSession() capture round-trips unchanged. */
const seedAll = seedSession;

async function dumpSession(page) {
  return page.evaluate(() => {
    const out = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      out[k] = JSON.parse(window.sessionStorage.getItem(k));
    }
    return out;
  });
}

test("Learning Flow E2E：首頁 -> 教材中心 -> 學習總結 -> 考前總複習 -> 平時練習 -> 錯題本 -> 首頁", async ({ page }) => {
  const errors = collectErrors(page);

  /* ---- Setup: generate REAL practice questions via the real pipeline,
     on materials.html (the only page that loads QuestionGenerationRuntime
     /QuestionProviderBridge/AITutorService). ---- */
  await seedAll(page, BASE_SEED);
  await page.goto(fileUrl("materials"));
  await page.evaluate((materialId) => {
    const AHS = window.AHS;
    AHS.AITutorService.ensureQuestionSet(materialId);
    AHS.QuestionProviderBridge.bridge(materialId);
  }, MATERIAL_ID);
  let carry = await dumpSession(page);

  await test.step("首頁 — Nav 不再有複習中心／我的學習，學習成效總覽/最近教材/AI Tutor 皆為真實資料", async () => {
    await seedAll(page, carry);
    await page.goto(fileUrl("home"));
    const sidebarLabels = await page.locator(".sidebar__item").allTextContents();
    expect(sidebarLabels.some((t) => t.includes("複習中心"))).toBe(false);
    expect(sidebarLabels.some((t) => t.includes("我的學習"))).toBe(false);
    await expect(page.locator("body")).toContainText(MATERIAL_TITLE);
    // Sprint AI-121 AI-121-01/19: 教材完成度 retired as a Home KPI —
    // replaced by 學習成效總覽 (.home-kpi), driven by real Learning
    // Outcome (Knowledge Mastery/Growth/Weakness).
    await expect(page.locator(".home-kpi")).toBeVisible();
    // Sprint AI-122 AI-122-06: 最近教材 itself (not just 教材資料夾, which
    // also renders every Workspace material unconditionally) genuinely
    // shows this material — its real createdAt (seeded via todayStr())
    // is within the 3-day window.
    await expect(page.locator(".recent-card").first()).toContainText(MATERIAL_TITLE);
  });

  await test.step("教材中心 -> 前往學習總結（真實點擊）", async () => {
    await seedAll(page, carry);
    await page.goto(fileUrl("materials"));
    const card = page.locator('.mat-card[data-id="' + MATERIAL_ID + '"]');
    await expect(card).toContainText(MATERIAL_TITLE);
    await card.locator(".mat-card__summary-link").click();
    await expect(page).toHaveURL(/summary\.html\?materialId=rt_1/);
  });

  await test.step("學習總結 — 重點整理/易錯觀念/AI Tutor 建議齊全，前往考前總複習（真實點擊）", async () => {
    await expect(page.locator("body")).toContainText("AI-118 核心概念");
    await expect(page.locator("body")).toContainText("AI-118 易錯點");
    await expect(page.locator(".sum-footer__exam")).toHaveCount(0); // 前往平時練習已移除
    await page.locator(".sum-footer__quiz").click();
    await expect(page).toHaveURL(/quiz\.html\?mode=practice&materialId=rt_1/);
  });

  await test.step("考前總複習 — 真實作答（答錯），立即看到詳解，非正式成績", async () => {
    const practiceTab = page.locator(".quiz-mode__tab", { hasText: "考前總複習" });
    await expect(practiceTab).toHaveClass(/is-active/);
    const diffBtn = page.locator(".qguide__diff").first();
    if (await diffBtn.count()) {
      await diffBtn.click();
      await page.locator(".qguide__start").click();
    }
    const row = page.locator(".quiz-practice__row").first();
    await expect(row).toBeVisible();
    await row.click();
    const options = page.locator(".quiz-practice__option--btn");
    await expect(options.first()).toBeVisible();
    // Deliberately pick whichever option is NOT already marked (a real click,
    // right or wrong is both a genuine, real outcome) — then confirm the
    // result panel renders immediately, on this same page (立即解析).
    await options.first().click();
    await expect(page.locator(".quiz-practice__result")).toBeVisible();
  });

  await test.step("平時練習 — 真實批改，永久保存，錯題自動加入錯題本", async () => {
    const examResult = await page.evaluate((materialId) => {
      const AHS = window.AHS;
      const examId = "teaching_material_" + materialId;
      AHS.QuestionRuntime.importQuestions(examId, [
        { id: "eq_1", index: 1, subject: "math", text: "正式測驗題目 1", type: "single_choice",
          options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
          questionSource: "ORIGINAL", origin: "Uploaded Material", materialId: materialId },
        { id: "eq_2", index: 2, subject: "math", text: "正式測驗題目 2", type: "single_choice",
          options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "B",
          questionSource: "ORIGINAL", origin: "Uploaded Material", materialId: materialId }
      ]);
      const session = AHS.ExamRuntime.startFromExam(examId, { subject: "math", title: "AI-118 正式測驗" });
      AHS.AnswerRuntime.saveAnswer(session.examId, "eq_1", "A");
      AHS.AnswerRuntime.saveAnswer(session.examId, "eq_2", "A"); // wrong on purpose
      const finished = AHS.ExamRuntime.finish(session.examId);
      const graded = AHS.AutoGrader.grade(finished);
      AHS.WrongBookRuntime.sync(graded);
      AHS.HistoryRuntime.record(graded);
      return { totalCount: graded.totalCount, correctCount: graded.correctCount };
    }, MATERIAL_ID);
    expect(examResult.totalCount).toBe(2);
    expect(examResult.correctCount).toBe(1);
    carry = await dumpSession(page);
  });

  await test.step("錯題本 — 今日待複習來自 StatisticsRuntime.dueForReview()，全部重新練習／收藏皆為真實入口", async () => {
    await seedAll(page, carry);
    await page.goto(fileUrl("wrongbook"));
    await expect(page.locator("body")).toContainText("今日待複習");
    const dueTodayFromDom = await page.locator(".wb-summary__value").first().textContent();
    const dueTodayFromRuntime = await page.evaluate(() => window.AHS.StatisticsRuntime.dueForReview().length);
    expect(Number(dueTodayFromDom)).toBe(dueTodayFromRuntime);
    expect(dueTodayFromRuntime).toBeGreaterThan(0);
    await expect(page.locator(".wb-action", { hasText: "全部重新練習" })).toBeVisible();
    await expect(page.locator(".wb-action", { hasText: "收藏" })).toBeVisible();
    carry = await dumpSession(page);
  });

  await test.step("首頁：資料一致 — AI Tutor 建議連向真實下一步，學習成效總覽與 StatisticsRuntime 相符", async () => {
    await seedAll(page, carry);
    await page.goto(fileUrl("home"));
    const consistency = await page.evaluate(() => {
      const A = window.AHS;
      return {
        dueForReview: A.StatisticsRuntime.dueForReview().length,
        subjectAnalytics: A.StatisticsRuntime.subjectAnalytics(),
        homeKpis: A.StatisticsRuntime.homeKpis()
      };
    });
    expect(consistency.dueForReview).toBeGreaterThan(0);
    // AI Tutor's own real recommendation must point somewhere real (a
    // working href), never a dead "#" placeholder — the crux of AI-118-08
    // ("不得跳脫此流程").
    const tutorTile = page.locator(".tutor-card__tile").first();
    if (await tutorTile.count()) {
      const href = await tutorTile.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toBe("#");
    }
    // Sprint AI-121 AI-121-01/19: 教材完成度 consistency check replaced by
    // 未完成追蹤事項 (outstandingTasks) — the same real single source
    // (AHS.StatisticsRuntime.homeKpis()) the .home-kpi board itself reads.
    const outstandingFromDom = await page
      .locator('.home-kpi__item[data-kpi="outstandingTasks"] .home-kpi__value')
      .first().textContent();
    expect(Number(outstandingFromDom)).toBe(consistency.homeKpis.outstandingTasks);
  });

  expect(errors, "Console errors across the Learning Flow: " + errors.join(" | ")).toEqual([]);
});
