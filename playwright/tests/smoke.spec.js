/* playwright/tests/smoke.spec.js — Sprint AI-116 AI-116-03 Smoke Test.
   Every page named in the spec opens cleanly in a REAL browser (not
   jsdom — this is the whole point of this Sprint: catching real
   rendering/CSS bugs jsdom's own DOM-only simulation can't, exactly the
   class of bug HOTFIX-006/the [hidden]-specificity audit found by hand
   earlier this project). */
"use strict";
const { test, expect } = require("@playwright/test");
const { fileUrl } = require("../helpers/urls.js");

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => { if (msg.type() === "error") { errors.push(msg.text()); } });
  return errors;
}

const PAGES = [
  { key: "home", label: "首頁", titleIncludes: "首頁" },
  { key: "materials", label: "教材中心", titleIncludes: "教材中心" },
  { key: "quiz", label: "測驗中心", titleIncludes: "測驗中心" },
  { key: "wrongbook", label: "錯題本", titleIncludes: "錯題本" },
  { key: "review", label: "複習中心", titleIncludes: "複習中心" },
  { key: "tutor", label: "AI Tutor", titleIncludes: "AI Tutor" }
];

for (const p of PAGES) {
  test("Smoke：" + p.label + " 可正常開啟", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(fileUrl(p.key));
    await expect(page).toHaveTitle(new RegExp(p.titleIncludes));
    await expect(page.locator(".shell")).toBeVisible();
    await expect(page.locator(".shell__main")).toBeVisible();
    expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
  });
}

test("Smoke：Settings 可正常開啟（AppShell 共用 Settings Panel）", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(fileUrl("home"));
  const settingsBtn = page.locator(".sidebar__item", { hasText: "設定" });
  await settingsBtn.click();
  const overlay = page.locator(".settings-panel__overlay");
  await expect(overlay).toBeVisible();
  await expect(overlay.locator(".settings-panel__heading")).toHaveText("設定");
  await expect(overlay.locator('section[aria-label="Profile"]')).toBeVisible();
  await expect(overlay.locator('section[aria-label="Repository"]')).toBeVisible();
  expect(errors, "Console errors: " + errors.join(" | ")).toEqual([]);
});
