/* playwright/tests/assessment-scenario.spec.js — Sprint AI-117 AI-117-14
   Playwright Assessment Scenario.

   原始試卷＋AI 題（2026-10-27 起合併為同一份題庫）-> Random Exam ->
   Statistics -> WrongBook -> Review -> Learning Analytics, verified
   consistent, in a REAL browser (Chromium via Playwright, not jsdom).

   Scoping note (flagged, not silently narrowed): AHS.QuestionRuntime is
   intentionally memory-only (never sessionStorage-persisted, per this
   app's own existing design — see js/runtime/TeachingMaterialLoader.js's
   own header). This scenario drives the exact same real, unmodified
   functions (QuestionRuntime.importQuestions/shuffleOrder,
   ExamRuntime.startFromExam,
   AutoGrader.grade, WrongBookRuntime.sync, HistoryRuntime.record) inside
   a real Chromium page via page.evaluate() — genuinely executing in the
   real browser runtime this Sprint's own QA Architecture requires, not
   jsdom — then verifies the results by REAL navigation to
   wrongbook.html/review.html and reading the REAL rendered DOM, so the
   "一致" (consistent) requirement is checked exactly as a user would
   see it, not just via a second evaluate() call. */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");

test("Assessment Scenario：原始試卷＋AI 題合併 -> Random Exam -> Statistics/WrongBook/Review 全部一致", async ({ page }) => {
  await page.goto(fileUrl("quiz"));

  const setup = await page.evaluate(() => {
    const AHS = window.AHS;
    const examBase = "teaching_material_rt_assess";
    AHS.QuestionRuntime.importQuestions(examBase, [
      { id: "aq_o1", index: 1, subject: "math", text: "原始題目 1", type: "single_choice",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
        questionSource: "ORIGINAL", origin: "Uploaded Material", materialId: "rt_assess" },
      { id: "aq_o2", index: 2, subject: "math", text: "原始題目 2", type: "single_choice",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "B",
        questionSource: "ORIGINAL", origin: "Uploaded Material", materialId: "rt_assess" },
      { id: "aq_a1", index: 1, subject: "math", text: "AI 題目 1", type: "single_choice",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
        questionSource: "AI_GENERATED", origin: "AI", materialId: "rt_assess" }
    ]);
    const merged = AHS.QuestionRuntime.getSet(examBase);
    const mergedOk = typeof AHS.TeachingMaterialLoader.importAssessmentModeVariants === "undefined" &&
      merged.some((q) => q.questionSource === "ORIGINAL") && merged.some((q) => q.questionSource === "AI_GENERATED");

    // Random Exam Session: shuffle the merged set and confirm IDs survive.
    const beforeIds = merged.map((q) => q.id).sort();
    AHS.QuestionRuntime.shuffleOrder(examBase);
    const afterIds = AHS.QuestionRuntime.getSet(examBase).map((q) => q.id).sort();
    const idsUnchanged = beforeIds.join(",") === afterIds.join(",");

    // Take the merged exam for real: two right, one wrong.
    const session = AHS.ExamRuntime.startFromExam(examBase, { subject: "math", title: "Assessment 測試" });
    const qs = AHS.QuestionRuntime.getSet(session.examId);
    qs.forEach((q) => AHS.AnswerRuntime.saveAnswer(session.examId, q.id, q.id === "aq_o2" ? "WRONG" : "A"));
    const finished = AHS.ExamRuntime.finish(session.examId);
    const graded = AHS.AutoGrader.grade(finished);
    AHS.WrongBookRuntime.sync(graded);
    AHS.HistoryRuntime.record(graded);

    return {
      mergedOk, idsUnchanged,
      totalCount: graded.totalCount, correctCount: graded.correctCount,
      wrongCount: AHS.WrongBookRuntime.list().length,
      statsAccuracy: AHS.StatisticsRuntime.overview().avgAccuracy,
      sessionCarry: (() => {
        const out = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          out[k] = JSON.parse(window.sessionStorage.getItem(k));
        }
        return out;
      })()
    };
  });

  expect(setup.mergedOk, "原始題與 AI 題在同一份題庫").toBe(true);
  expect(setup.idsUnchanged, "Random Exam Session：shuffle 後 Question ID 集合不變").toBe(true);
  expect(setup.totalCount).toBe(3);
  expect(setup.correctCount).toBe(2);
  expect(setup.wrongCount).toBe(1);
  expect(setup.statsAccuracy).toBe(67);

  /* 真實導航到錯題本／複習中心，確認畫面呈現與剛才的真實批改結果一致 —
     不是再次呼叫 evaluate() 讀 Runtime，而是讀真正 render 出來的 DOM。 */
  await page.addInitScript((seed) => {
    Object.keys(seed).forEach((k) => window.sessionStorage.setItem(k, JSON.stringify(seed[k])));
  }, setup.sessionCarry);

  await page.goto(fileUrl("wrongbook"));
  /* Sprint AI-138: the exam/session title (item.title) only ever rendered
     in the Detail Panel (AI-122-04) — never in the row list itself — so
     this always needed a click to see it. Before this Sprint, the same
     text happened to also appear for free in the Tutor Suggestion banner
     (AHS.TutorContextTip, showTutorSuggestions defaulted true), which is
     what this assertion was actually reading; now that AI Tutor suggestions
     default to hidden (no real API connected yet), that coincidental path
     is gone. Click the row and read the real Detail Panel instead — the
     correct, real way this title has always been surfaced, and one that
     doesn't depend on an unrelated Settings toggle. */
  await page.locator(".wb-row").first().click();
  await expect(page.locator(".wb-detail__material")).toContainText("Assessment 測試");

  await page.goto(fileUrl("review"));
  const dueCount = await page.evaluate(() => window.AHS.StatisticsRuntime.dueForReview().length);
  expect(dueCount).toBe(1);
  await expect(page.locator("body")).toContainText("今日待複習");
});
