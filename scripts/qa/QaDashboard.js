/* scripts/qa/QaDashboard.js — Sprint AI-116 AI-116-09 QA Dashboard.

   Single-command aggregator: `npm run qa:dashboard`. Runs (or reads the
   already-fresh result of) every real suite this repository's QA
   discipline requires — BehaviorSuite / PipelineRegression /
   RepositoryFoundation / MaterialPipelineRegression / AnalyticsRegression
   (Sprint AI-117) / Playwright — and writes one real PASS/FAIL summary
   to docs/QA/QaDashboard.json. Never
   re-implements any suite's own pass/fail logic: each Node suite's exit
   code is the source of truth (0 = PASS, matching every suite's own
   `process.exit(fail === 0 ? 0 : 1)` convention already in this repo),
   and Playwright's own JSON reporter output (playwright/report/results.json,
   configured in playwright/config/playwright.config.js) is the source of
   truth for Playwright — this script only parses and aggregates, it
   does not re-grade anything.

   Playwright is NOT re-run by default if playwright/report/results.json
   already exists (the GitHub Actions workflow always runs
   `npm run test:e2e` immediately before `npm run qa:dashboard`, so the
   file is fresh) — pass --run-playwright to force a fresh run for a
   standalone local invocation. */
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.join(__dirname, "..", "..");
const OUTPUT_FILE = path.join(REPO_ROOT, "docs", "QA", "QaDashboard.json");
const PLAYWRIGHT_RESULTS = path.join(REPO_ROOT, "playwright", "report", "results.json");

const NODE_SUITES = [
  { name: "BehaviorSuite", script: "tests/jsdom/BehaviorSuite.js", countPattern: /PASS:\s*(\d+)\s+FAIL:\s*(\d+)/ },
  { name: "PipelineRegression", script: "tests/regression/PipelineRegression.js", countPattern: /PipelineRegression:\s*(\d+)\s*PASS\s*\/\s*(\d+)\s*FAIL/ },
  { name: "RepositoryFoundation", script: "tests/regression/RepositoryFoundation.js", countPattern: /RepositoryFoundation:\s*(\d+)\s*PASS\s*\/\s*(\d+)\s*FAIL/ },
  { name: "MaterialPipelineRegression", script: "tests/regression/MaterialPipelineRegression.js", countPattern: /MaterialPipelineRegression:\s*(\d+)\s*PASS\s*\/\s*(\d+)\s*FAIL/ },
  { name: "AnalyticsRegression", script: "tests/regression/AnalyticsRegression.js", countPattern: /AnalyticsRegression:\s*(\d+)\s*PASS\s*\/\s*(\d+)\s*FAIL/ }
];

function runNodeSuite(suite) {
  const start = Date.now();
  const result = spawnSync(process.execPath, [path.join(REPO_ROOT, suite.script)], { encoding: "utf8" });
  const durationMs = Date.now() - start;
  const output = (result.stdout || "") + (result.stderr || "");
  const match = suite.countPattern.exec(output);
  return {
    name: suite.name,
    result: result.status === 0 ? "PASS" : "FAIL",
    pass: match ? Number(match[1]) : null,
    fail: match ? Number(match[2]) : null,
    durationMs: durationMs
  };
}

function readPlaywrightResults(forceRun) {
  if (forceRun || !fs.existsSync(PLAYWRIGHT_RESULTS)) {
    spawnSync("npx", ["playwright", "test", "--config=playwright/config/playwright.config.js"], {
      cwd: REPO_ROOT, encoding: "utf8", stdio: "inherit"
    });
  }
  if (!fs.existsSync(PLAYWRIGHT_RESULTS)) {
    return { name: "Playwright", result: "FAIL", pass: null, fail: null, durationMs: null, error: "results.json not found" };
  }
  let json;
  try { json = JSON.parse(fs.readFileSync(PLAYWRIGHT_RESULTS, "utf8")); }
  catch (e) { return { name: "Playwright", result: "FAIL", pass: null, fail: null, durationMs: null, error: "results.json invalid JSON" }; }
  const stats = json.stats || {};
  const passCount = stats.expected || 0;
  const failCount = (stats.unexpected || 0) + (stats.flaky || 0);
  return {
    name: "Playwright",
    result: failCount === 0 && passCount > 0 ? "PASS" : "FAIL",
    pass: passCount,
    fail: failCount,
    durationMs: stats.duration || null
  };
}

function run() {
  const forceRunPlaywright = process.argv.indexOf("--run-playwright") !== -1;
  const results = NODE_SUITES.map(runNodeSuite);
  results.push(readPlaywrightResults(forceRunPlaywright));

  const overall = results.every((r) => r.result === "PASS") ? "PASS" : "FAIL";
  const dashboard = { generatedAt: new Date().toISOString(), overall: overall, suites: results };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dashboard, null, 2) + "\n", "utf8");

  console.log("\nQA Dashboard — " + dashboard.generatedAt);
  results.forEach((r) => {
    const counts = r.pass !== null ? (r.pass + " PASS / " + r.fail + " FAIL") : (r.error || "");
    console.log("  " + r.result.padEnd(4) + "  " + r.name.padEnd(28) + counts);
  });
  console.log("\nOverall: " + overall);
  console.log("Written: " + path.relative(REPO_ROOT, OUTPUT_FILE));

  process.exit(overall === "PASS" ? 0 : 1);
}

run();
