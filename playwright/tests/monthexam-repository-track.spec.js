/* playwright/tests/monthexam-repository-track.spec.js — 2026-10-09: 模擬月考
   也收舊版教材庫（data/materials/*.js）的單選題，長榮高二上的國文、英文
   因此可以出題。在真實瀏覽器確認頁面載入了這些紀錄、科目出現、沒有錯誤。 */
"use strict";
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");

test("長榮高二上：國文、英文出現在模擬月考科目中且可開始作答", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") { return; }
    const loc = msg.location && msg.location();
    if (loc && /SupabaseConfig\.local\.js$/.test(loc.url || "")) { return; }
    errors.push(msg.text());
  });
  await page.addInitScript(() => {
    window.sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] }));
  });
  await page.goto(fileUrl("monthexam"));
  const counts = await page.evaluate(() => {
    const out = {};
    window.AHS.MonthExamRuntime.listSubjects().forEach((s) => { out[s.subject] = s.materials.reduce((a, m) => a + m.count, 0); });
    return out;
  });
  expect(counts["國文"]).toBeGreaterThanOrEqual(48);
  expect(counts["英文"]).toBeGreaterThanOrEqual(50);
  const s = await page.evaluate(() => {
    const ids = window.AHS.MonthExamRuntime.listSubjects().filter((x) => x.subject === "英文")[0].materials.map((m) => m.materialId);
    const session = window.AHS.MonthExamRuntime.start("英文", ids);
    const q = window.AHS.MonthExamRuntime.findQuestion(session.items[0].qid);
    /* usable() also accepts multi-select answers like "(A)(C)(D)" (tm_61); the old indexOf check was flaky. */
    return { n: session.items.length, hasAnswer: window.AHS.MonthExamRuntime.usable(q) };
  });
  expect(s.n).toBe(50);
  expect(s.hasAnswer).toBe(true);
  await expect(page.locator("body")).toContainText("國文");
  expect(errors).toEqual([]);
});
