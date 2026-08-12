/* playwright/tests/snapshot.spec.js — Sprint AI-116 AI-116-06 UI
   Snapshot / Screenshot Regression.

   Every page always gets a fresh full-page screenshot saved under
   ../report/screenshots/ (real artifact, useful for manual "方便 UI 比對"
   even without automated diffing — never skipped). On top of that,
   toHaveScreenshot() does automated pixel-diff regression against a
   committed baseline, with a deliberately generous maxDiffPixelRatio —
   flagged, real limitation, not silently ignored: Playwright's own
   cross-platform/cross-browser-build screenshot determinism guidance
   means a baseline captured on one Chromium build can show minor
   (sub-pixel/font-hinting) diffs against a different build's render
   of the exact same page. This environment's outbound network policy
   blocks downloading Playwright's own CDN-hosted browser builds (only
   a pre-installed Chromium is available), so these baselines were
   generated locally rather than from the exact browser build GitHub
   Actions' `npx playwright install` will fetch. See the Sprint AI-116
   report for the full disclosure and the regeneration instructions
   (`npx playwright test --update-snapshots` from an environment/CI
   matching the browser build that will run this suite going forward). */
"use strict";
const fs = require("fs");
const path = require("path");
const { test, expect } = require("../helpers/fixtures.js");
const { fileUrl } = require("../helpers/urls.js");

const SCREENSHOT_DIR = path.join(__dirname, "..", "report", "screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

/* stabilize(page) — waits for web fonts to finish loading/rasterizing
   before any screenshot. Without this, headless Chromium can render the
   exact same real, static text with slightly different glyph hinting
   between two runs of the exact same browser build (a well-known
   Playwright screenshot-flakiness cause, not this app's own bug) —
   this test suite's own first local run caught it (the lower half of
   the home page, entirely static real content, still diffed beyond
   tolerance run-to-run before this fix). */
/* freezeRandomQuote(page) — js/utils/Quote.js's getDailyQuote() picks a
   real random quote via Math.random() (js/utils/Quote.js:21), by
   design — not a bug. Masking .hero-card's pixels alone isn't enough:
   a longer/shorter random quote changes .hero-card's own rendered
   height, which shifts EVERY element below it on the page, producing a
   full-page dimension mismatch (this test suite's own first runs
   caught exactly this — "Expected an image 1280px by 1784px, received
   1280px by 1762px" — not anti-aliasing noise, a real layout height
   difference). Pinning Math.random() to always return 0 before the
   page's own scripts run makes the quote (and therefore the layout)
   deterministic for this test only. */
async function freezeRandomQuote(page) {
  await page.addInitScript(() => { Math.random = () => 0; });
}

async function stabilize(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => (document.fonts && document.fonts.ready) || Promise.resolve());
  /* Move the mouse off-screen and blur whatever has focus so a lingering
     :hover/:focus style (e.g. the just-clicked sidebar item, or a text
     input's blinking caret) never becomes a source of run-to-run diff
     noise — this test suite's own Settings screenshot flaked on this
     exact cause during authoring. */
  await page.mouse.move(0, 0);
  await page.evaluate(() => { if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); } });
}

/* Sprint AI-118 AI-118-13: Snapshot QA baseline set rebuilt to match the
   new Learning Loop (AI-118-01) — Summary added (now a core stop in the
   Loop), Review dropped (still a real page, AI-118-03's own "Page 保留"
   — just no longer part of the primary snapshot set now that its Nav
   entry and central role are gone). */
const PAGES = [
  { key: "home", label: "首頁" },
  { key: "materials", label: "教材中心" },
  { key: "summary", label: "Summary" },
  { key: "quiz", label: "Quiz" },
  { key: "wrongbook", label: "WrongBook" },
  { key: "tutor", label: "Tutor" }
];

for (const p of PAGES) {
  test("Snapshot：" + p.label, async ({ page }) => {
    if (p.key === "home") { await freezeRandomQuote(page); }
    await page.goto(fileUrl(p.key));
    await stabilize(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, p.key + ".png"), fullPage: true });
    /* Home's .hero-card genuinely varies every load by design — a real,
       random motivational quote (js/utils/Quote.js's own Math.random()
       pick) plus today's real date, not a bug to fix. Masked out of the
       pixel-diff (this test's own first run caught this; not silently
       assumed) so the rest of the page can still be regression-checked. */
    const mask = p.key === "home" ? [page.locator(".hero-card")] : [];
    await expect(page).toHaveScreenshot(p.key + ".png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
      mask: mask
    });
  });
}

test("Snapshot：Settings", async ({ page }) => {
  await page.goto(fileUrl("home"));
  await page.locator(".sidebar__item", { hasText: "設定" }).click();
  const overlay = page.locator(".settings-panel__overlay");
  await expect(overlay).toBeVisible();
  await stabilize(page);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "settings.png"), fullPage: true });
  /* Scoped to the dialog itself, not the full page: the overlay is
     semi-transparent, so a full-page screenshot would still include the
     home page bleeding through behind it — the same random-quote/
     rendering-jitter surface area already flagged above, and genuinely
     irrelevant to what a "Settings screenshot" should be regression-
     testing in the first place. */
  await expect(page.locator(".settings-panel__dialog")).toHaveScreenshot("settings.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
    threshold: 0.3
  });
});
