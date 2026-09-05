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

/* AI-133：js/data/WorkspaceData.js 的真實 Mock 密碼（測試期間統一為 "1234"，
   見該檔案自身標頭的誠實揭露：純前端明碼比對，只是門禁用途，非真正
   資安等級保護）——這裡直接對應同一份資料，不是另外發明一組。 */
const STUDENT_PASSWORDS = { Admin: "1234", "Student A": "1234", "Student B": "1234" };

async function loginAs(page, studentLabel, schoolLabel, semesterLabels) {
  await page.goto(fileUrl("login.html"));
  await page.locator(".login-option", { hasText: studentLabel }).first().click();
  await page.locator(".login-option", { hasText: schoolLabel }).first().click();
  for (const sem of semesterLabels) {
    await page.locator(".login-option--check", { hasText: sem }).click();
  }
  await page.locator(".login-enter-btn").click();
  await page.locator(".login-password__input").fill(STUDENT_PASSWORDS[studentLabel]);
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

test("AI-120 PAT①(續)：Student A -> 高二上 -> 教材中心只看到高二上的真實教材（不得出現高一下教材）", async ({ page }) => {
  /* Sprint AI-132（國文教材上傳）之後陸續再上架 tm_5（生物補充資料）／
     tm_6（世界史）／tm_7（數學：三角函數）／tm_8、tm_9（公民與社會）／
     tm_10、tm_11（物理）／tm_12（化學）8 筆 Package-track 教材，加上既有
     6 筆 Repository-track 教材（國文第一／二／三課、英文第一課、生物起源
     與演化、生物第1章講義版），高二上（g2s1）真的有 14 筆真實教材——
     「誠實顯示空狀態」的原始假設已經不成立，這裡改為驗證真正的重點：
     這 14 筆是「高二上自己的」真實教材，且完全不包含任何高一下
     （tm_1~4／civics）的教材，Workspace 過濾仍然誠實、正確。 */
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高二上學期"]);
  await page.goto(fileUrl("materials"));
  await expect(page.locator(".mat-card")).toHaveCount(14);
  await expect(page.locator("body")).toContainText("國文");
  /* 「三角函數」本身不再是唯一辨識字串：tm_7（高二上，數學第1章）自己
     的章節標題也真的含有「三角函數」——這是高一、高二課綱本來就都教三角
     函數的真實巧合，不是回歸。改用 tm_1（高一下）章節裡更完整、tm_7 不
     會出現的原始片語「三角函數的性質」來辨識，才是真正驗證「高一下教材
     沒有洩漏進高二上畫面」，而非誤判高二上自己真實擁有的 tm_7。 */
  const g1s2OnlyTitles = ["三角函數的性質", "演化與生物分類", "所有權與物權", "全球化與國際分工"];
  for (const title of g1s2OnlyTitles) {
    await expect(page.locator("body")).not.toContainText(title);
  }
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
  /* 同上（PAT①續）：高二上現在真的有 14 筆真實教材，切換後應立即同步
     成這 14 筆，而不是延續切換前高一下的 5 筆／或誠實空狀態。 */
  await expect(page.locator(".mat-card")).toHaveCount(14);
  await expect(page.locator("body")).toContainText("國文");
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
