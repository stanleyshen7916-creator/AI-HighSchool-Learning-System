/* playwright/tests/visual-lesson-201.spec.js — 2026-10-21 圖解教材（互動）.

   Real-browser proof that the interactive visual lesson for 高二數學
   第1章 三角函數 (tm_7) actually renders where a student sees it:
   - 教材中心: opening the material shows the 互動圖解 tab with the lesson
     page inside, whose canvases are drawn and whose quiz answers work;
   - 學習助教: asking about「疊合」adds the single formula card, and the
     frame grows to the card's real height. */
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
    if (/fonts\.(googleapis|gstatic)\.com/.test((loc && loc.url) || "") || /ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION|TUNNEL)/.test(msg.text())) { return; }
    errors.push(msg.text());
  });
  return errors;
}

async function useG2S1(page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] }));
  });
}

test("圖解教材：教材中心開啟 tm_7 顯示互動圖解分頁", async ({ page }) => {
  const errors = collectErrors(page);
  await useG2S1(page);
  await page.goto(fileUrl("materials"));
  const runtimeId = await page.evaluate(() => window.AHS.TeachingMaterialLoader.runtimeIdFor("tm_7"));
  expect(runtimeId).toBeTruthy();
  await page.evaluate((id) => {
    const item = window.AHS.MaterialRuntime.getById(id);
    document.body.appendChild(window.AHS.MaterialPreview.open(item, function () {}));
  }, runtimeId);
  await expect(page.locator(".mat-preview__tab").first()).toHaveText("互動圖解");
  await expect(page.locator(".mat-preview__tab").first()).toHaveAttribute("aria-selected", "true");
  const frame = page.frameLocator(".vlesson__frame");
  await expect(frame.locator("#F14 h3")).toHaveText("疊合公式");
  await frame.locator("#F14 [data-c=a]").click();
  await expect(frame.locator("[data-q=F14] .fb")).toContainText("答對了");
  const drawn = await page.frames().find((f) => /MAT_H2_Ch1_Trigonometry/.test(f.url())).evaluate(() => {
    const c = document.querySelector("#w-fuse canvas");
    return c.width > 0 && c.getContext("2d").getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0);
  });
  expect(drawn).toBe(true);
  await page.locator(".mat-preview__tab").nth(1).click();
  await expect(page.locator("#mat-preview-panel-text")).toBeVisible();
  expect(errors).toEqual([]);
});

test("圖解教材：學習助教查「疊合」附上公式卡片", async ({ page }) => {
  const errors = collectErrors(page);
  await useG2S1(page);
  await page.goto(fileUrl("tutor"));
  await page.locator(".tutor-input__field").fill("什麼是疊合");
  await page.keyboard.press("Enter");
  const frameEl = page.locator(".vlesson--card iframe").first();
  await expect(frameEl).toHaveAttribute("src", /\?card=F14&theme=light$/);
  const frame = page.frameLocator(".vlesson--card iframe").first();
  await expect(frame.locator("#F14")).toBeVisible();
  await expect(frame.locator("#F1")).toBeHidden();
  await expect.poll(async () => parseInt(await frameEl.evaluate((f) => f.style.height || "0"), 10)).toBeGreaterThan(600);
  expect(errors).toEqual([]);
});
