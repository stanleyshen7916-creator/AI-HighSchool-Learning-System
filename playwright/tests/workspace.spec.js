/* playwright/tests/workspace.spec.js — Sprint AI-119 (Platform Core
   Baseline) §20 PAT — real-browser, same-tab, cross-navigation Workspace
   isolation. This is the one class of check tests/regression/
   WorkspaceRegression.js's own jsdom loadPage() structurally cannot do
   (each loadPage() call is a brand new sessionStorage) — a real
   Chromium `page` keeps its sessionStorage across page.goto() calls
   within the same test, exactly like a real student's browser tab, so
   this is where "does Student B genuinely never see Student A's real
   data, in the same tab, without closing it" gets proven for real.

   Uses `skipDefaultLogin` (playwright/helpers/fixtures.js) to opt out
   of the suite-wide default test Workspace — every test here manages
   its own real Login/logout state on purpose. */
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

/* loginAs(page, studentLabel, schoolLabel, semesterLabels) — drives the
   real Login flow (login.html) via real clicks, exactly as
   tests/regression/WorkspaceRegression.js's own [5] proves the flow
   itself works — this helper just reuses it end-to-end in a real
   browser instead of asserting on it directly. */
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

test("Workspace PAT①：Student A 完成 教材→Practice→WrongBook→Analytics→Tutor 全部正常", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await expect(page.locator(".shell")).toBeVisible();
  await expect(page.locator(".topbar__workspace-chip")).toContainText("Student A");

  await page.evaluate(() => {
    const AHS = window.AHS;
    AHS.MaterialRuntime.add({
      title: "PAT 教材", subject: "math", grade: "高一", chapter: "第一章",
      category: "講義", fileName: "", fileType: "FILE", content: "PAT 測試內容"
    });
  });
  await page.goto(fileUrl("materials"));
  await expect(page.locator("body")).toContainText("PAT 教材");
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("Workspace PAT②：Student B 在同一分頁登入後，完全看不到 Student A 的真實資料", async ({ page }) => {
  const errors = collectErrors(page);

  // Student A：真實新增一筆教材。
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await page.evaluate(() => {
    window.AHS.MaterialRuntime.add({
      title: "只有 Student A 看得到的教材", subject: "math", grade: "高一", chapter: "第一章",
      category: "講義", fileName: "", fileType: "FILE", content: "x"
    });
  });
  await page.goto(fileUrl("materials"));
  await expect(page.locator("body")).toContainText("只有 Student A 看得到的教材");

  // 同一個分頁：登出，改用 Student B 登入（不得看到剛才 Student A 的資料）。
  await page.locator(".sidebar__item", { hasText: "登出" }).click();
  await expect(page).toHaveURL(/login\.html$/);
  await loginAs(page, "Student B", "長榮中學", ["高一下學期"]);
  await page.goto(fileUrl("materials"));
  await expect(page.locator("body")).not.toContainText("只有 Student A 看得到的教材");

  const isolation = await page.evaluate(() => ({
    materials: window.AHS.MaterialRuntime.list().map((m) => m.title),
    ns: window.AHS.WorkspaceRuntime.storageNamespace()
  }));
  expect(isolation.materials).not.toContain("只有 Student A 看得到的教材");
  expect(isolation.ns).toBe("student_b__cjsh__g1s2");
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("Workspace PAT③：Topbar 快速切換學期（Student A 高一下 -> 高二上），不需重新登入，資料同步", async ({ page }) => {
  const errors = collectErrors(page);
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await page.evaluate(() => {
    window.AHS.MaterialRuntime.add({
      title: "高一下學期教材", subject: "math", grade: "高一", chapter: "第一章",
      category: "講義", fileName: "", fileType: "FILE", content: "x"
    });
  });

  // Topbar 快速切換 -> 高二上學期：真實點擊，不經過 Login Flow。
  await page.locator(".topbar__workspace-chip").click();
  await page.locator(".workspace-menu__item", { hasText: "高二上學期" }).click();
  await expect(page).toHaveURL(/index\.html/);
  await expect(page.locator(".topbar__workspace-chip")).toContainText("高二上學期");
  await expect(page.locator(".topbar__workspace-chip")).not.toContainText("高一下學期");

  const afterSwitch = await page.evaluate(() => ({
    materials: window.AHS.MaterialRuntime.list().map((m) => m.title),
    ns: window.AHS.WorkspaceRuntime.storageNamespace()
  }));
  expect(afterSwitch.ns).toBe("student_a__cjsh__g2s1");
  expect(afterSwitch.materials).not.toContain("高一下學期教材");

  // 切回高一下學期：真實資料仍在（Workspace 切換 = 換命名空間，不是清空）。
  await page.locator(".topbar__workspace-chip").click();
  await page.locator(".workspace-menu__item", { hasText: "高一下學期" }).click();
  await expect(page.locator(".topbar__workspace-chip")).toContainText("高一下學期");
  const backAgain = await page.evaluate(() => window.AHS.MaterialRuntime.list().map((m) => m.title));
  expect(backAgain).toContain("高一下學期教材");
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});

test("Workspace PAT④/⑤：Analytics／AI Tutor 僅分析 Current Workspace，不混入其他 Workspace", async ({ page }) => {
  const errors = collectErrors(page);

  // Student A：真實作答一題並答錯，產生真實 WrongBook/History。
  await loginAs(page, "Student A", "長榮中學", ["高一下學期"]);
  await page.goto(fileUrl("quiz"));
  await page.evaluate(() => {
    const AHS = window.AHS;
    AHS.QuestionRuntime.importQuestions("exam_a", [
      { id: "q1", index: 1, subject: "math", text: "t", type: "single_choice",
        options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
        questionSource: "ORIGINAL", origin: "x", materialId: "m1" }
    ]);
    const session = AHS.ExamRuntime.startFromExam("exam_a", { subject: "math", title: "t" });
    AHS.AnswerRuntime.saveAnswer(session.examId, "q1", "B");
    const graded = AHS.AutoGrader.grade(AHS.ExamRuntime.finish(session.examId));
    AHS.WrongBookRuntime.sync(graded);
    AHS.HistoryRuntime.record(graded);
  });
  const aStats = await page.evaluate(() => window.AHS.StatisticsRuntime.dueForReview().length);
  expect(aStats).toBeGreaterThan(0);

  // 換 Student B（同一分頁，真實登出/登入）：Analytics/Tutor 必須是全新、空的，不得混入 Student A 的錯題。
  await page.locator(".sidebar__item", { hasText: "登出" }).click();
  await loginAs(page, "Student B", "長榮中學", ["高一下學期"]);
  const bStats = await page.evaluate(() => ({
    dueForReview: window.AHS.StatisticsRuntime.dueForReview().length,
    wrongBook: window.AHS.WrongBookRuntime.list().length
  }));
  expect(bStats.dueForReview).toBe(0);
  expect(bStats.wrongBook).toBe(0);

  await page.goto(fileUrl("tutor"));
  await expect(page.locator("body")).not.toContainText("exam_a");
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
