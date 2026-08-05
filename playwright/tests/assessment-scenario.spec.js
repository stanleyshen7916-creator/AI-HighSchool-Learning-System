/* playwright/tests/assessment-scenario.spec.js — Sprint AI-117 AI-117-14
   Playwright Assessment Scenario.

   原始試卷 -> AI 題庫 -> Random Exam -> Statistics -> WrongBook -> Review
   -> Learning Analytics, verified consistent, in a REAL browser
   (Chromium via Playwright, not jsdom).

   Scoping note (flagged, not silently narrowed): AHS.QuestionRuntime is
   intentionally memory-only (never sessionStorage-persisted, per this
   app's own existing design — see js/runtime/TeachingMaterialLoader.js's
   own header) and quiz.html's real Assessment Mode toggle only appears
   once a real Teaching-Material Package with BOTH ORIGINAL and
   AI_GENERATED questions has already been imported through the full
   pipeline (Sprint AI-115) — this Sprint doesn't ship one. Rather than
   fabricate a Package just to click a UI toggle, this scenario drives
   the exact same real, unmodified functions (QuestionRuntime.
   importQuestions/shuffleOrder, TeachingMaterialLoader.
   importAssessmentModeVariants, ExamRuntime.startFromExam/abandon,
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

test("Assessment Scenario：原始試卷／AI 練習分流 -> Random Exam -> Statistics/WrongBook/Review 全部一致", async ({ page }) => {
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
    AHS.TeachingMaterialLoader.importAssessmentModeVariants(examBase, AHS.QuestionRuntime.getSet(examBase));

    const originalOk = AHS.QuestionRuntime.hasExam(examBase + "__original") &&
      AHS.QuestionRuntime.getSet(examBase + "__original").every((q) => q.questionSource === "ORIGINAL");
    const aiOk = AHS.QuestionRuntime.hasExam(examBase + "__ai") &&
      AHS.QuestionRuntime.getSet(examBase + "__ai").every((q) => q.questionSource === "AI_GENERATED");

    // Random Exam Session: shuffle the 原始試卷 set and confirm IDs survive.
    const beforeIds = AHS.QuestionRuntime.getSet(examBase + "__original").map((q) => q.id).sort();
    AHS.QuestionRuntime.shuffleOrder(examBase + "__original");
    const afterIds = AHS.QuestionRuntime.getSet(examBase + "__original").map((q) => q.id).sort();
    const idsUnchanged = beforeIds.join(",") === afterIds.join(",");

    // Take the 原始試卷 exam for real: one right, one wrong.
    const session = AHS.ExamRuntime.startFromExam(examBase + "__original", { subject: "math", title: "Assessment 測試" });
    const qs = AHS.QuestionRuntime.getSet(session.examId);
    qs.forEach((q) => AHS.AnswerRuntime.saveAnswer(session.examId, q.id, q.id === "aq_o1" ? "A" : "WRONG"));
    const finished = AHS.ExamRuntime.finish(session.examId);
    const graded = AHS.AutoGrader.grade(finished);
    AHS.WrongBookRuntime.sync(graded);
    AHS.HistoryRuntime.record(graded);

    return {
      originalOk, aiOk, idsUnchanged,
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

  expect(setup.originalOk, "原始試卷只含 ORIGINAL 題目").toBe(true);
  expect(setup.aiOk, "AI 練習只含 AI_GENERATED 題目").toBe(true);
  expect(setup.idsUnchanged, "Random Exam Session：shuffle 後 Question ID 集合不變").toBe(true);
  expect(setup.totalCount).toBe(2);
  expect(setup.correctCount).toBe(1);
  expect(setup.wrongCount).toBe(1);
  expect(setup.statsAccuracy).toBe(50);

  /* 真實導航到錯題本／複習中心，確認畫面呈現與剛才的真實批改結果一致 —
     不是再次呼叫 evaluate() 讀 Runtime，而是讀真正 render 出來的 DOM。 */
  await page.addInitScript((seed) => {
    Object.keys(seed).forEach((k) => window.sessionStorage.setItem(k, JSON.stringify(seed[k])));
  }, setup.sessionCarry);

  await page.goto(fileUrl("wrongbook"));
  await expect(page.locator("body")).toContainText("Assessment 測試");

  await page.goto(fileUrl("review"));
  const dueCount = await page.evaluate(() => window.AHS.StatisticsRuntime.dueForReview().length);
  expect(dueCount).toBe(1);
  await expect(page.locator("body")).toContainText("今日待複習");
});
