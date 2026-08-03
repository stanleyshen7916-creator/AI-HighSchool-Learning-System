/* playwright/config/playwright.config.js — Sprint AI-116 AI-116-01
   Playwright Foundation.

   No webServer entry: this is a static, file://-capable prototype (per
   CLAUDE.md, "no build/dev-server script by design") — tests navigate
   directly to file:// URLs via playwright/helpers/urls.js, the same
   access mode the repository's own README/CLAUDE.md name as a first-
   class supported deployment, not a workaround.

   PLAYWRIGHT_CHROMIUM_EXECUTABLE (optional): when set, overrides the
   Chromium executable Playwright launches — used only for local runs
   inside an environment that ships a pre-installed browser under a
   non-standard path (this project's own CI, via
   .github/workflows/playwright.yml, always runs the standard
   `npx playwright install --with-deps chromium` first and leaves this
   unset, so it launches the normal Playwright-managed browser). Never
   required for a normal `npx playwright install && npx playwright test`
   run. */
"use strict";
const { defineConfig, devices } = require("@playwright/test");

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

module.exports = defineConfig({
  testDir: "../tests",
  outputDir: "../report/test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["html", { outputFolder: "../report/html", open: "never" }],
    /* AI-116-09: machine-readable results QaDashboard.js reads to
       aggregate this suite's PASS/FAIL alongside BehaviorSuite/
       PipelineRegression/RepositoryFoundation/MaterialPipelineRegression
       — not a second, hand-parsed source of truth. */
    ["json", { outputFile: "../report/results.json" }],
    ["list"]
  ],
  use: {
    /* AI-116-07/AI-116-08: Report + Failure Artifact — screenshot/
       trace/video captured only on failure (kept lean on green runs,
       always present when Claude needs to diagnose a real FAIL). */
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    launchOptions: executablePath
      ? { executablePath: executablePath, args: ["--no-sandbox"] }
      : {}
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ]
});
