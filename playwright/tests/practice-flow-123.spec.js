/* playwright/tests/practice-flow-123.spec.js — Sprint AI-123 (Practice
   Flow UX Refactor, PAT Hotfix), real-browser proof of the Sprint's own
   PAT checklist: full-screen Practice View replaces the old inline
   answering surface, its Header/back-button/exit-confirm/score-summary
   are all real, and the question list's own ✔/✘/○ status icons update
   immediately on return — without a page reload and without losing
   scroll position. Complements tests/jsdom/BehaviorSuite.js's own [8]/
   [10] coverage (grading/Runtime sync) rather than duplicating it — this
   suite is about the View/Navigation layer AI-123 actually changed. */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");

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

/* Seeds two real AHS.QuestionRuntime questions for one material, the
   same addInitScript pattern playwright/tests/ux-hotfix-122.spec.js's
   own PAT-122-03 already established (AHS.QuestionRuntime is
   page-lifetime/in-memory only — never persisted — so it must be
   (re)imported on every fresh navigation, before AppQuiz.js's own
   init() runs). */
/* enterPracticeList(page, materialId) — mode=practice&materialId lands
   on 巧巧老師出題引導 first (Sprint 6.8 EO-S6.8-002 Task 001, unchanged by
   this Sprint — AI-123-13 forbids touching it), same as
   ux-hotfix-122.spec.js's own PAT-122-03. Picks any difficulty then
   繼續 into the real practice list this Sprint's own tests care about. */
async function enterPracticeList(page, materialId) {
  await page.goto(fileUrl("quiz") + "?mode=practice&materialId=" + materialId);
  await page.locator('.qguide__diff[data-difficulty="medium"]').click();
  await page.locator(".qguide__start").click();
}

async function seedTwoQuestions(page, materialId) {
  await seedQuestions(page, materialId, 2);
}

/* seedQuestions(page, materialId, count) — same shape as
   seedTwoQuestions above, generalized so the scroll-position test below
   can seed enough rows to make the page genuinely tall enough to
   scroll (a 2-row list on a real viewport never overflows). */
async function seedQuestions(page, materialId, count) {
  await page.addInitScript((args) => {
    window.addEventListener("DOMContentLoaded", () => {
      const AHS = window.AHS;
      if (!AHS || !AHS.QuestionRuntime) { return; }
      const matId = args.matId;
      const qs = [];
      for (let i = 1; i <= args.count; i++) {
        qs.push({
          id: matId + "-q" + i, index: i, subject: "civics", text: "AI-123 練習題" + i,
          type: "single_choice", options: [{ key: "A", text: "正確答案" }, { key: "B", text: "錯誤答案" }],
          correctAnswer: "A", knowledgePoint: "kp_ai123_" + i, materialId: matId,
          questionSource: "ORIGINAL", origin: "x"
        });
      }
      AHS.QuestionRuntime.importQuestions("teaching_material_" + matId, qs);
    }, { once: true });
  }, { matId: materialId, count: count });
}

test("AI-123-01/02：點擊題目直接開啟全畫面 Practice View，Header 顯示科目／考前練習／第 N/M 題", async ({ page }) => {
  const errors = collectErrors(page);
  await seedTwoQuestions(page, "ai123_a");
  await enterPracticeList(page, "ai123_a");

  await expect(page.locator(".quiz-practice__row")).toHaveCount(2);
  await page.locator(".quiz-practice__row").first().click();

  // AI-123-01: never the old inline Detail Panel — a real full-screen overlay.
  await expect(page.locator(".qpv-overlay")).toBeVisible();
  await expect(page.locator(".quiz-practice__question")).toContainText("AI-123 練習題1");
  // AI-123-02: Header carries 科目／考前練習／第 N / M 題.
  await expect(page.locator(".qpv__title")).toContainText("公民");
  await expect(page.locator(".qpv__title")).toContainText("考前練習");
  await expect(page.locator(".qpv__title")).toContainText("第 1 / 2 題");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-123-03/11：返回題目列表不遺失作答進度，且保留 Scroll Position", async ({ page }) => {
  const errors = collectErrors(page);
  // A small viewport makes even a 2-row list genuinely overflow, so the
  // scroll below is real (not a no-op on an already-fully-visible page).
  await page.setViewportSize({ width: 390, height: 480 });
  await seedTwoQuestions(page, "ai123_b");
  await enterPracticeList(page, "ai123_b");

  // Scroll the page down before entering Practice View.
  await page.evaluate(() => window.scrollTo(0, 400));
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);

  await page.locator(".quiz-practice__row").first().click();
  await page.locator(".quiz-practice__option--btn").first().click(); // answer q1 (correct)
  await expect(page.locator(".quiz-practice__result")).toContainText("答對了");

  // Both questions now answered? No — only q1. Back button should warn.
  await page.locator(".qpv__back").click();
  await expect(page.locator(".qpv-confirm__text")).toContainText("尚有 1 題未完成");
  // AI-123-12: 繼續作答 dismisses the prompt, stays on Practice View — progress kept.
  await page.locator(".qpv-confirm__btn", { hasText: "繼續作答" }).click();
  await expect(page.locator(".qpv-overlay")).toBeVisible();
  await expect(page.locator(".quiz-practice__result")).toContainText("答對了"); // progress not lost

  await page.locator(".qpv__back").click();
  await page.locator(".qpv-confirm__btn", { hasText: "返回列表" }).click();

  // AI-123-11: back at the real list — no reload, scroll position restored.
  await expect(page.locator(".qpv-overlay")).toHaveCount(0);
  await expect(page.locator(".quiz-practice__row")).toHaveCount(2);
  const after = await page.evaluate(() => window.scrollY);
  expect(after).toBe(before);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-123-05/06/07：列表 Status Icon 立即更新，重新點擊已完成題目需重新作答（非直接顯示答案）", async ({ page }) => {
  const errors = collectErrors(page);
  await seedTwoQuestions(page, "ai123_c");
  await enterPracticeList(page, "ai123_c");

  // Before answering: both rows show ○ (尚未作答).
  const rows = page.locator(".quiz-practice__row");
  await expect(rows.nth(0).locator(".quiz-practice__row-status")).toHaveText("○");
  await expect(rows.nth(1).locator(".quiz-practice__row-status")).toHaveText("○");

  // Answer q1 wrong, exit without finishing (only 1/2 answered).
  await rows.nth(0).click();
  await page.locator(".quiz-practice__option--btn").nth(1).click(); // wrong option
  await expect(page.locator(".quiz-practice__result")).toContainText("答錯了");
  await page.locator(".qpv__back").click();
  await page.locator(".qpv-confirm__btn", { hasText: "返回列表" }).click();

  // AI-123-05/06: row status icon updated immediately, no reload.
  await expect(rows.nth(0).locator(".quiz-practice__row-status")).toHaveText("✘");
  await expect(rows.nth(1).locator(".quiz-practice__row-status")).toHaveText("○");

  // AI-123-07: re-clicking the already-wrong row must NOT show the old
  // answer immediately — it restarts the answer flow (options unmarked,
  // result hidden) until a fresh submit.
  await rows.nth(0).click();
  await expect(page.locator(".quiz-practice__result")).toBeHidden();
  await expect(page.locator(".quiz-practice__option--btn.is-correct")).toHaveCount(0);
  await expect(page.locator(".quiz-practice__option--btn.is-wrong")).toHaveCount(0);
  // Answer correctly this time — status icon should flip to ✔ once back on the list.
  await page.locator(".quiz-practice__option--btn").first().click();
  await expect(page.locator(".quiz-practice__result")).toContainText("答對了");
  await page.locator(".qpv__back").click();
  await page.locator(".qpv-confirm__btn", { hasText: "返回列表" }).click();
  await expect(rows.nth(0).locator(".quiz-practice__row-status")).toHaveText("✔");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-123-04/09：完成全部題目 -> 成績摘要 -> 只能返回題目列表／再次測驗／前往知識弱點", async ({ page }) => {
  const errors = collectErrors(page);
  await seedTwoQuestions(page, "ai123_d");
  await enterPracticeList(page, "ai123_d");

  await page.locator(".quiz-practice__row").first().click();
  await page.locator(".quiz-practice__option--btn").first().click(); // q1 correct
  await page.locator(".qpv__next", { hasText: "下一題" }).click();
  await expect(page.locator(".qpv__title")).toContainText("第 2 / 2 題");
  await page.locator(".quiz-practice__option--btn").nth(1).click(); // q2 wrong
  await page.locator(".qpv__next", { hasText: "完成測驗" }).click();

  // AI-123-04: real score summary, never a straight jump to Home/Material Center.
  const summary = page.locator(".qpv-summary");
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("1 / 2");
  await expect(summary.locator(".qpv-summary__btn", { hasText: "返回題目列表" })).toBeVisible();
  await expect(summary.locator(".qpv-summary__btn", { hasText: "再次測驗" })).toBeVisible();
  const wbLink = summary.locator(".qpv-summary__btn", { hasText: "前往知識弱點" });
  await expect(wbLink).toHaveAttribute("href", "wrongbook.html");
  // AI-123-09: no Home/Material Center link anywhere in the summary.
  await expect(summary.locator("a[href='index.html']")).toHaveCount(0);
  await expect(summary.locator("a[href='materials.html']")).toHaveCount(0);

  await summary.locator(".qpv-summary__btn", { hasText: "返回題目列表" }).click();
  await expect(page.locator(".qpv-overlay")).toHaveCount(0);
  await expect(page.locator(".quiz-practice__row")).toHaveCount(2);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-123-04：再次測驗重新開始整組題目，狀態重置為未作答", async ({ page }) => {
  const errors = collectErrors(page);
  await seedTwoQuestions(page, "ai123_e");
  await enterPracticeList(page, "ai123_e");

  await page.locator(".quiz-practice__row").first().click();
  await page.locator(".quiz-practice__option--btn").first().click();
  await page.locator(".qpv__next", { hasText: "下一題" }).click();
  await page.locator(".quiz-practice__option--btn").first().click();
  await page.locator(".qpv__next", { hasText: "完成測驗" }).click();

  await page.locator(".qpv-summary__btn", { hasText: "再次測驗" }).click();
  await expect(page.locator(".qpv-overlay")).toBeVisible();
  await expect(page.locator(".qpv__title")).toContainText("第 1 / 2 題");
  await expect(page.locator(".quiz-practice__result")).toBeHidden();

  await page.locator(".qpv-confirm-overlay").waitFor({ state: "hidden" }).catch(() => {});
  await page.locator(".qpv__back").click();
  await expect(page.locator(".qpv-confirm__text")).toContainText("尚有 2 題未完成");
  await page.locator(".qpv-confirm__btn", { hasText: "返回列表" }).click();
  await expect(page.locator(".quiz-practice__row").nth(0).locator(".quiz-practice__row-status")).toHaveText("○");
  await expect(page.locator(".quiz-practice__row").nth(1).locator(".quiz-practice__row-status")).toHaveText("○");

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
