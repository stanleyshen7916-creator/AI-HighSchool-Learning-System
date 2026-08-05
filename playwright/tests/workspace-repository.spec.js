/* playwright/tests/workspace-repository.spec.js — Sprint AI-120
   (Workspace Repository Integration) §20 PAT①～⑥ — real-browser,
   same-tab, cross-navigation proof that Material Center/Folder/
   Analytics/Tutor genuinely filter and re-sync by Current Workspace,
   complementing playwright/tests/workspace.spec.js (Sprint AI-119's own
   Login/isolation PAT) rather than duplicating it. */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");

test.use({ skipDefaultLogin: true });

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => { if (msg.type() === "error") { errors.push(msg.text()); } });
  return errors;
}

async function loginAs(page, studentLabel, schoolLabel, semesterLabels) {
  await page.goto(fileUrl("login.html"));
  await page.locator(".login-option", { hasText: studentLabel }).first().click();
  await page.locator(".login-option", { hasText: schoolLabel }).first().click();
  for (const sem of semesterLabels) {
    await page.locator(".login-option--check", { hasText: sem }).click();
  }
  await page.locator(".login-enter-btn").click();
  await expect(page).toHaveURL(/index\.html$/);
  await page.locator(".shell").waitFor({ state: "visible" });
}

test("AI-120 PAT①：Student A -> 高一下 -> 教材中心只看到高一下的真實 Repository 教材", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await page.goto(fileUrl("materials"));
  const cards = page.locator(".mat-card");
  await expect(cards).toHaveCount(5); // 4 Package track (tm_1~4) + 1 Repository track (civics)，全數已遷移至高一下學期
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-120 PAT①(續)：Student A -> 高二上 -> 教材中心誠實顯示空狀態（不得出現高一下教材）", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高二上學期"]);
  await page.goto(fileUrl("materials"));
  await expect(page.locator(".mat-empty")).toBeVisible();
  await expect(page.locator(".mat-card")).toHaveCount(0);
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-120 PAT②：Student B 登入教材中心，不得看到 Student A 手動新增的教材", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await page.evaluate(() => {
    window.AHS.MaterialRuntime.add({
      title: "AI-120 只有 Student A 看得到", subject: "math", grade: "高一", chapter: "第一章",
      category: "講義", fileName: "", fileType: "FILE", content: "x"
    });
  });
  await page.goto(fileUrl("materials"));
  await expect(page.locator("body")).toContainText("AI-120 只有 Student A 看得到");

  await page.locator(".sidebar__item", { hasText: "登出" }).click();
  await loginAs(page, "Student B", "長榮中學", ["高一下學期"]);
  await page.goto(fileUrl("materials"));
  await expect(page.locator("body")).not.toContainText("AI-120 只有 Student A 看得到");
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-120 PAT③：Workspace 切換 高一下 -> 高二上 -> 教材中心立即同步", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await page.goto(fileUrl("materials"));
  await expect(page.locator(".mat-card")).toHaveCount(5);

  await page.locator(".topbar__workspace-chip").click();
  await page.locator(".workspace-menu__item", { hasText: "高二上學期" }).click();
  await page.locator(".shell").waitFor({ state: "visible" });

  await page.goto(fileUrl("materials"));
  await expect(page.locator(".mat-card")).toHaveCount(0);
  await expect(page.locator(".mat-empty")).toBeVisible();
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-120 PAT④：Folder（教材資料夾）新增教材立即同步", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await expect(page.locator(".workspace-folder")).toBeVisible();
  await page.evaluate(() => {
    window.AHS.MaterialRuntime.add({
      title: "AI-120 Folder 同步測試教材", subject: "geography", grade: "高一", chapter: "第一章",
      category: "講義", fileName: "", fileType: "FILE", content: "x"
    });
  });
  await page.reload();
  await expect(page.locator(".workspace-folder")).toContainText("AI-120 Folder 同步測試教材");
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-120 PAT⑤：Analytics — Workspace 切換立即同步（不混入其他 Semester）", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await page.goto(fileUrl("quiz"));
  await page.evaluate(() => {
    const AHS = window.AHS;
    AHS.QuestionRuntime.importQuestions("exam_pat5", [
      { id: "q1", index: 1, subject: "math", text: "t", type: "single_choice",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
        questionSource: "ORIGINAL", origin: "x", materialId: "m1" }
    ]);
    const session = AHS.ExamRuntime.startFromExam("exam_pat5", { subject: "math", title: "t" });
    AHS.AnswerRuntime.saveAnswer(session.examId, "q1", "B");
    const graded = AHS.AutoGrader.grade(AHS.ExamRuntime.finish(session.examId));
    AHS.WrongBookRuntime.sync(graded);
    AHS.HistoryRuntime.record(graded);
  });
  const beforeSwitch = await page.evaluate(() => window.AHS.StatisticsRuntime.dueForReview().length);
  expect(beforeSwitch).toBeGreaterThan(0);

  await page.locator(".topbar__workspace-chip").click();
  await page.locator(".workspace-menu__item", { hasText: "高二上學期" }).click();
  await page.locator(".shell").waitFor({ state: "visible" });

  const afterSwitch = await page.evaluate(() => window.AHS.StatisticsRuntime.dueForReview().length);
  expect(afterSwitch).toBe(0);
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("AI-120 PAT⑥：Tutor — Workspace 切換立即同步（不推薦其他 Semester 的內容）", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await page.goto(fileUrl("materials"));
  const g1s2Title = (await page.locator(".mat-card__title, .mat-card h3").first().textContent()) || "";

  await page.locator(".topbar__workspace-chip").click();
  await page.locator(".workspace-menu__item", { hasText: "高二上學期" }).click();
  await page.locator(".shell").waitFor({ state: "visible" });

  await page.goto(fileUrl("tutor"));
  if (g1s2Title.trim()) {
    await expect(page.locator("body")).not.toContainText(g1s2Title.trim());
  }
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
