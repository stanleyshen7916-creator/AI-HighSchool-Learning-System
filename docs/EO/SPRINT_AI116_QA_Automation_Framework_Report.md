# Sprint AI-116 — QA Automation Framework Report

Spec: `SPRINT_AI116_QA_AUTOMATION_FRAMEWORK.md` v1.0, Status EXECUTE.

Scope confirmed honored: no platform feature added, no Learning Workflow modified, no LLM API
connected. Every changed/added file this Sprint is under `playwright/`,
`.github/workflows/playwright.yml`, `scripts/qa/`, `docs/QA/`, `docs/EO/`, plus one additive
`package.json` script block and one `.gitignore` addition — zero files under `js/runtime/`,
`js/components/`, `js/pages/`, or `js/data/` were touched.

## Sprint AI-116 Report

| Item | Result |
|---|---|
| Playwright | PASS |
| Smoke | PASS |
| Learning Loop | PASS |
| Regression | PASS |
| Snapshot | PASS |
| Report | PASS |
| Artifact | PASS |
| Dashboard | PASS |
| Verify | PASS |
| Test | PASS |
| Deployment | PASS |

## Detail per item

**AI-116-01 Playwright Foundation** — `/playwright/{config,tests,helpers,report}` created.
`@playwright/test` added as a devDependency. `playwright/config/playwright.config.js`: no
`webServer` entry (tests navigate real `file://` URLs via `playwright/helpers/urls.js`,
matching CLAUDE.md's "must keep working over file://" and this repo's "no build/dev-server
script by design"); HTML + JSON + list reporters; screenshot/trace/video captured
only-on-failure. Verified runnable (`npm run test:e2e`).

**AI-116-02 GitHub Actions** — `.github/workflows/playwright.yml`: triggers on every `push`
(all branches) and `pull_request` into `main` — no `workflow_dispatch`, so there is no manual
trigger at all ("不得：人工執行"). Runs `npm run verify` → `npm test` → install Chromium →
`npm run test:e2e` → `npm run qa:dashboard`, uploading the HTML report, failure artifacts, and
QA Dashboard JSON every run.

**AI-116-03 Smoke Test** — `playwright/tests/smoke.spec.js`: 首頁/教材中心/測驗中心/錯題本/
複習中心/AI Tutor/Settings all verified to open with zero console errors, correct title, and a
rendered shell. 7/7 PASS.

**AI-116-04 Learning Loop E2E** — `playwright/tests/learning-loop.spec.js`: one continuous real
browser session, 首頁 → 教材 → Summary → Quiz → WrongBook → Review → Tutor → Learning →
Statistics, zero console errors across the whole chain. The Review step drives a real
interactive answer (click an option → click 提交答案 → real grading via
`AHS.ReviewRuntime.answerCurrent()`) and asserts `WrongBookRuntime`'s `correctStreak` actually
advanced in `sessionStorage` — Sprint AI-114's real Review Session feature, now verified in an
actual browser. 1/1 PASS (multiple real steps within it).

**AI-116-05 Regression (gate)** — the GitHub Actions job runs every gate in sequence; any step
failing fails the whole job (a visible red status check on the PR). Flagged, real limitation:
this workflow file cannot itself force GitHub to block a merge on that red check — that
requires a Branch Protection Rule (repo-admin setting, outside any code change's reach). See
`docs/QA/Sprint_AI_116_QA_Report_GPT_PMO.md` for the full disclosure and recommendation.

**AI-116-06 UI Snapshot** — `playwright/tests/snapshot.spec.js`: 首頁/教材中心/Quiz/WrongBook/
Review/Tutor/Settings each get a fresh, always-saved screenshot
(`playwright/report/screenshots/`, useful for manual comparison even without diffing) plus an
automated `toHaveScreenshot()` pixel-diff regression against a committed baseline. Two real
flakiness sources were found and fixed while authoring this test (not silently tolerated):
(1) Home's `.hero-card` renders a real random daily quote (`js/utils/Quote.js`'s own
`Math.random()`) plus today's real date — a longer/shorter quote changes the card's own
height, shifting every element below it, which produced a full-page dimension mismatch, not
mere anti-aliasing noise. Fixed by pinning `Math.random` for this test's own page load and
still masking the region (masking alone doesn't fix a height difference). (2) Settings'
background (the semi-transparent overlay lets the home page bleed through) inherited the same
issue; fixed by scoping the Settings screenshot to `.settings-panel__dialog` only, which is
also the more correct unit to regression-test. Verified stable across repeated local reruns
(21/21 across 3 full-suite runs, then included in the final 15/15 combined run). 7/7 PASS.

**AI-116-07 Report** — Playwright's own HTML reporter
(`playwright/report/html/`, `open: never`) includes PASS/FAIL status, duration, and (per
AI-116-08 below) attached screenshot/video/trace on failure — verified by intentionally
breaking a test during authoring and confirming all attachments appeared before removing the
break.

**AI-116-08 Failure Artifact** — `screenshot: "only-on-failure"`, `trace: "retain-on-failure"`,
`video: "retain-on-failure"` in `playwright.config.js`; the GitHub Actions workflow uploads
`playwright/report/test-results/` (screenshot/trace/video/error-context) as a workflow artifact
whenever the job fails. No Network Log is ever produced or promised — this static app makes no
network calls (per CLAUDE.md, no real backend/fetch), so "Network Log（若有）" is honestly
never present, not omitted by oversight.

**AI-116-09 QA Dashboard** — new `scripts/qa/QaDashboard.js` (`npm run qa:dashboard`):
aggregates BehaviorSuite / PipelineRegression / RepositoryFoundation /
MaterialPipelineRegression (each suite's own real exit code + parsed PASS/FAIL line) and
Playwright (its own JSON reporter output, `playwright/report/results.json`) into one real
PASS/FAIL table, written to `docs/QA/QaDashboard.json`. Never re-implements any suite's own
grading logic — pure aggregation.

**AI-116-10 GPT PMO Support** — new `docs/QA/Sprint_AI_116_QA_Report_GPT_PMO.md`: a standing
(re-run-able, not one-shot) QA Report organized around Regression / Architecture / Product QA /
Technical Debt, including this Sprint's own new technical debt (screenshot-baseline cross-build
risk, missing branch protection) and notable pre-existing items surfaced while building
real end-to-end coverage across almost every page.

## Verify / Test / Playwright

`npm run verify` PASS (0 broken paths / 0 legacy references / 0 forbidden patterns). `npm
test`: BehaviorSuite 329/329, PipelineRegression 6/6, RepositoryFoundation 29/29,
MaterialPipelineRegression 37/37 — all unchanged from before this Sprint (no existing suite
touched). `npm run test:e2e` (Playwright): 15/15 PASS (7 Smoke + 1 Learning Loop E2E + 7
Snapshot). `npm run qa:dashboard`: overall PASS, `docs/QA/QaDashboard.json` written.

## Judgment calls (flagged, not silently decided)

1. **Baseline screenshots generated locally, not from GitHub Actions' own browser build** —
   this development environment's outbound network policy blocks Playwright's CDN, so the
   exact Chromium build `npx playwright install` fetches on CI could not be downloaded here.
   Regeneration instructions are documented in `snapshot.spec.js`'s own header and in the GPT
   PMO QA Report.
2. **"不得 Regression FAIL 仍 Merge"** implemented as a fully automatic, always-run gate
   (workflow triggers on every push/PR, any step failing fails the job) plus this session's own
   standing discipline of never merging a red run — NOT as a GitHub-enforced merge block, since
   that requires a repo-admin Branch Protection setting no code change can configure. Flagged,
   recommended to Project Owner in the GPT PMO QA Report.
3. **Learning Loop E2E's Quiz step** verifies the page opens cleanly rather than driving a full
   real quiz-taking interaction — a scope/time trade-off for this Sprint, documented in the
   test file's own header, not a silently-reduced requirement.

## Merge Commit / GitHub Pages Deploy Status

- PR #37，已合併至 `main`。Merge commit：`34cdb5e644bdc7827e4c6fc159940e02d71bf68f`。
- GitHub Pages "pages build and deployment" workflow 已針對此 commit 觸發並成功完成部署。
- **本 Sprint 新增的「QA Automation Framework」workflow（`.github/workflows/playwright.yml`）
  也已針對此 commit 觸發並成功完成**（run id `30787270646`，`completed` / `success`）——這是
  該 workflow 在真實 GitHub Actions 環境的第一次執行，包含全新安裝 Playwright 瀏覽器與完整
  Snapshot 截圖比對。本報告先前揭露的「截圖基準圖在本機沙盒瀏覽器版本與 CI 實際安裝版本
  不同，可能導致 CI 上比對失敗」風險，這次真實執行**並未發生**——所有 15 項 Playwright 測試
  （含 7 項 Screenshot Regression）在 CI 上皆一次通過，本機產生的基準圖無需重新產生。

## 修改檔案

- `playwright/config/playwright.config.js`, `playwright/helpers/{urls,seed}.js`,
  `playwright/tests/{smoke,learning-loop,snapshot}.spec.js`,
  `playwright/tests/snapshot.spec.js-snapshots/*.png`, `playwright/report/.gitkeep` — new
- `.github/workflows/playwright.yml` — new
- `scripts/qa/QaDashboard.js` — new
- `docs/QA/Sprint_AI_116_QA_Report_GPT_PMO.md` — new
- `package.json` — `test:e2e`/`qa:dashboard` scripts + `@playwright/test` devDependency
- `package-lock.json` — new (first devDependency install to produce one)
- `.gitignore` — Playwright's own ephemeral run output (HTML report/test-results/ad-hoc
  screenshots) excluded; baseline images stay tracked
