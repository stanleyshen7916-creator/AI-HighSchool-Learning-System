/* playwright/tests/exam-archive.spec.js — 2026-10-27: 月考資料。
   在真實瀏覽器確認：六科分頁都在、每題附圖都載得到、解析預設收合，
   對應教材的連結指向真實的圖解教材檔案，且沒有任何錯誤。 */
"use strict";
const fs = require("fs");
const path = require("path");
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl, REPO_ROOT } = require("../helpers/urls.js");

test("月考資料：六科題目、附圖與解析", async ({ page }) => {
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
  await page.goto(fileUrl("examarchive"));

  const tabs = page.locator(".xa-tab");
  await expect(tabs).toHaveCount(6);
  await expect(page.locator(".sidebar__item.is-active")).toContainText("月考資料");

  for (let i = 0; i < 6; i++) {
    await tabs.nth(i).click();
    await expect(page.locator(".xa-q").first()).toBeVisible();
    /* 解析預設收合 */
    expect(await page.locator(".xa-expl[open]").count()).toBe(0);
    /* 每張附圖都載入成功 */
    const broken = await page.evaluate(async () => {
      const imgs = [...document.querySelectorAll(".xa-figure img")];
      imgs.forEach((img) => { img.loading = "eager"; });
      await Promise.all(imgs.map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
      return imgs.filter((img) => !img.naturalWidth).map((img) => img.getAttribute("src"));
    });
    expect(broken).toEqual([]);
  }

  /* 展開第一題的解析：答案、【確認】／【推論】、對應教材 */
  await tabs.nth(0).click();
  const first = page.locator(".xa-q:not(.xa-q--passage)").first();
  await first.locator("summary").click();
  await expect(first.locator(".xa-answer")).toContainText("答案：");
  await expect(first.locator(".xa-basis").first()).toHaveText(/【確認】|【推論】/);

  const hrefs = await page.evaluate(() => [...document.querySelectorAll(".xa-lesson a")].map((a) => a.getAttribute("href")));
  hrefs.forEach((h) => expect(fs.existsSync(path.join(REPO_ROOT, h.split("#")[0]))).toBe(true));
  expect(errors).toEqual([]);
});
