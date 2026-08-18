/* playwright/tests/repeat-practice-145.spec.js — Sprint AI-145 (使用者需求：
   「平時練習」增加可以再次出題的選項，使用場景為當日可以多次進行「平時
   練習」，不是同一組題目重複做).

   Real-browser proof that finishing a real drawCycle-drawn 平時練習
   session (js/components/QuizCenter.js's own tryDirectExamEntry()) now
   offers a real "再次出題" action on the 檢討 (Review) screen, and that
   clicking it genuinely starts a brand-new Exam Session — not the exact
   same question set re-shown — by drawing the NEXT batch from
   AHS.QuestionBankRuntime's already-persisted shuffled bag (drawCycle()'s
   own "never repeats until every question has been drawn once"
   guarantee). Complements tests/regression/KnowledgeEngineRegression.js's
   own §9 (jsdom-level, same scenario, Runtime-level assertions). */
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

test("AI-145：平時練習完成後「再次出題」— 真實再抽一組不同題目，可當日重複進行", async ({ page }) => {
  const errors = collectErrors(page);
  const examId = "teaching_material_rt_repeat145";

  /* AHS.QuestionRuntime/QuestionBankRuntime are page-lifetime/in-memory
     only (never persisted to sessionStorage) — navigating straight to
     quiz.html?examId=... would load with none of this real data present.
     addInitScript() re-runs the import on this and every subsequent
     navigation in this context. QuizCenter.js's own create() reads
     AHS.QuestionBankRuntime.hasBank()/drawCycle() SYNCHRONOUSLY inside
     AppQuiz.js's own document-level DOMContentLoaded listener — a
     same-phase (bubble) window listener would fire AFTER that
     target-phase document listener, too late (see
     playwright/tests/ux-hotfix-122.spec.js's PAT-122-07 for the same
     race and fix). capture:true on window fires during the CAPTURE
     phase, strictly before the event reaches document's own listeners,
     guaranteeing the import lands first. */
  await page.addInitScript((examId) => {
    window.addEventListener("DOMContentLoaded", () => {
      const AHS = window.AHS;
      if (!AHS || !AHS.QuestionRuntime || !AHS.QuestionBankRuntime) { return; }
      if (AHS.QuestionBankRuntime.hasBank(examId)) { return; } // already seeded by an earlier navigation
      const questions = [];
      for (let i = 1; i <= 25; i++) {
        questions.push({
          id: "rp" + i, index: i, subject: "math", text: "AI-145 平時練習題 " + i,
          type: "single_choice", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
          correctAnswer: "A", knowledgePoint: "kp_repeat145", materialId: "rt_repeat145",
          questionSource: "ORIGINAL", origin: "x"
        });
      }
      AHS.QuestionRuntime.importQuestions(examId, questions);
      AHS.QuestionBankRuntime.ensureBank(examId, questions);
    }, { once: true, capture: true });
  }, examId);

  await page.goto(fileUrl("quiz") + "?examId=" + encodeURIComponent(examId));

  // Real proof this landed on the drawCycle/Formal Exam path (平時練習),
  // never Practice Mode.
  await expect(page.locator(".qcard")).toBeVisible();
  await expect(page.locator('.qguide[aria-label="巧巧老師出題引導"]')).toHaveCount(0);

  const firstExamId = await page.evaluate(() => window.AHS.ExamRuntime.getCurrent().examId);
  const firstIds = await page.evaluate((examId) =>
    window.AHS.QuestionRuntime.getSet(examId).map((q) => q.id).sort(), firstExamId);
  expect(firstIds.length).toBe(10); // FORMAL_EXAM_QUESTION_COUNT

  // Real click-through: answer every question, then finish.
  for (let i = 0; i < 10; i++) {
    await page.locator(".qcard-option").first().click();
    const finishBtn = page.locator(".qnav__finish");
    if (await finishBtn.count()) { await finishBtn.click(); break; }
    await page.locator(".qnav__next").click();
  }

  await expect(page.locator(".qreview")).toBeVisible();
  const retryBtn = page.locator(".qreview__retry", { hasText: "再次出題" });
  await expect(retryBtn).toBeVisible();
  await expect(page.locator(".qreview__back", { hasText: "返回測驗中心" })).toBeVisible();

  await retryBtn.click();

  // Lands directly back on a fresh exam-taking view — no intermediate
  // list/navigation required (真的可以「再次出題」，不必先離開再回來).
  await expect(page.locator(".qcard")).toBeVisible();
  const secondExamId = await page.evaluate(() => window.AHS.ExamRuntime.getCurrent().examId);
  expect(secondExamId).not.toBe(firstExamId);

  const secondIds = await page.evaluate((examId) =>
    window.AHS.QuestionRuntime.getSet(examId).map((q) => q.id).sort(), secondExamId);
  expect(secondIds.length).toBe(10);
  // Bank has 25 real questions, far more than the 10 drawn per round —
  // a real different combination, not the same set shown again.
  expect(secondIds).not.toEqual(firstIds);

  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
