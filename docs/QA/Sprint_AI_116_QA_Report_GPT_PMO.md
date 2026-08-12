# Sprint AI-116 — QA Report for GPT PMO Review

Sprint AI-116 AI-116-10 deliverable: a standing QA Report meant to be re-read (and, going
forward, re-run: `npm run qa:dashboard`) by GPT PMO on each release, not just a one-time
snapshot. Organized around the four review dimensions AI-116-10 names: Regression,
Architecture, Product QA, Technical Debt.

## QA Architecture (as built)

```
Claude Code → Push → GitHub → Playwright → Regression → QA Report → GPT PMO Review → Project Owner PAT
```

- **Claude Code → Push → GitHub**: every Sprint/Hotfix in this project's history follows the
  same discipline — implement, verify, push, PR, merge `main` — unchanged by this Sprint.
- **GitHub → Playwright/Regression**: `.github/workflows/playwright.yml` runs on every
  `push`/`pull_request`, fully automatically (`不得：人工執行`): `npm run verify` →
  `npm test` (BehaviorSuite + PipelineRegression + RepositoryFoundation +
  MaterialPipelineRegression) → `npx playwright install --with-deps chromium` →
  `npm run test:e2e` (Smoke + Learning Loop E2E + UI Snapshot) → `npm run qa:dashboard`. Any
  step failing fails the whole job.
- **Regression → QA Report**: `scripts/qa/QaDashboard.js` aggregates all five suites' real
  PASS/FAIL counts (never re-grades any suite itself) into `docs/QA/QaDashboard.json`,
  uploaded as a workflow artifact every run.
- **QA Report → GPT PMO Review → Project Owner PAT**: this document, plus
  `docs/EO/SPRINT_AI116_QA_Automation_Framework_Report.md`'s own PASS/FAIL table and
  `docs/QA/QaDashboard.json`, are the three artifacts GPT PMO (and Project Owner) need to
  review a release without re-deriving anything by hand.

**Real, disclosed gap in this chain**: this workflow file cannot itself force GitHub to BLOCK
a merge on a red status check — that requires a Branch Protection Rule (repo Settings →
Branches → Require status checks to pass before merging) naming this workflow's job as
required. That is a repository-admin setting, outside what any workflow file or code change
can configure. Today, "不得 Regression FAIL 仍 Merge" is enforced by process discipline (this
session's own established rule: never merge a red run) and by the status check being visible
on every PR, not by a technical block. Recommend Project Owner (or whoever holds repo admin
access) enable it once.

## 1. Regression

| Suite | Scope | Latest result |
|---|---|---|
| BehaviorSuite (jsdom) | Cross-page component/Runtime behavior, 44 groups | 329/329 PASS |
| PipelineRegression | MaterialParser→KnowledgeBuilder→SummaryGenerator→QuestionGenerator→LearningPipeline stub chain | 6/6 PASS |
| RepositoryFoundation | Teaching Material Repository → Loader → Bridge → Runtime → every consuming page | 29/29 PASS |
| MaterialPipelineRegression (Sprint AI-115) | Material Lifecycle → RepositoryManager → ImportManager (validation/duplicate/rollback/log) → browser downstream | 37/37 PASS |
| Playwright (Sprint AI-116, new) | Real-browser Smoke (7 pages) + Learning Loop E2E (9-page chain incl. one real interactive Review Session) + UI Snapshot (7 pages) | 15/15 PASS |

**What real-browser Playwright coverage adds that jsdom cannot**: jsdom is a DOM simulation —
it has no CSS layout/paint engine, so an entire class of real bug (the `[hidden]`-attribute
CSS-specificity bug HOTFIX-006 and the AI-114 audit both found; screenshot-visible layout
regressions) is structurally invisible to `npm test` alone, no matter how many jsdom checks
exist. Playwright closes that gap for the pages/flows it covers. It does not replace jsdom
regression — the two are complementary (jsdom for fast, wide behavioral coverage across every
Runtime API; Playwright for real rendering/interaction on the highest-traffic pages/flows).

**Known regression gap, disclosed**: Playwright's Learning Loop E2E seeds a WrongBook item
representing "a quiz was already taken and got one question wrong" rather than driving a full
Exam-Mode quiz-taking interaction through real clicks end-to-end (selecting an answer from a
real exam session, submitting, grading). This was a scope/time trade-off for this Sprint, not
an oversight — flagged in `learning-loop.spec.js`'s own header. A future Sprint could extend
it to drive a real quiz session too.

## 2. Architecture

- No new Runtime, no Learning Workflow change, no Statistics logic change — confirmed by this
  Sprint's own `git diff` scope: every changed/added file is under `playwright/`,
  `.github/workflows/`, `scripts/qa/`, `docs/QA/`, `docs/EO/`, plus one `package.json` script
  addition. Zero files under `js/runtime/`, `js/components/` (page-feature logic), or
  `js/data/` were touched.
- Playwright tests navigate via real `file://` URLs (`playwright/helpers/urls.js`), the same
  access mode CLAUDE.md requires this static prototype to keep supporting — no dev server was
  introduced, consistent with "no build/dev-server script by design."
- Test data seeding (`playwright/helpers/seed.js`) reuses the exact same `ahs:<key>` →
  sessionStorage schema `tests/jsdom/BehaviorSuite.js` already seeds and has proven correct —
  this Sprint did not invent a second seeding convention.
- `scripts/qa/QaDashboard.js` reads each suite's own real exit code / JSON report; it never
  re-implements pass/fail grading logic for any of the five suites it aggregates.

## 3. Product QA

- **Smoke** (AI-116-03): 首頁/教材中心/測驗中心/錯題本/複習中心/AI Tutor/Settings all open with
  zero console errors, correct `<title>`, and a rendered `.shell`/`.shell__main` — the exact 7
  surfaces the spec named.
- **Learning Loop E2E** (AI-116-04): 首頁 → 教材 → Summary → Quiz → WrongBook → Review → Tutor
  → Learning → Statistics, one continuous real browser session, zero console errors anywhere in
  the chain. The Review step is a genuine interactive test: a real option click, a real
  "提交答案" click, real grading through `AHS.ReviewRuntime.answerCurrent()`, and a real
  assertion that `WrongBookRuntime`'s `correctStreak` actually advanced (1) in
  `sessionStorage` — this is Sprint AI-114's own real Review Session feature, now proven to
  work in an actual browser, not just jsdom.
- **UI Snapshot** (AI-116-06): 首頁/教材中心/Quiz/WrongBook/Review/Tutor/Settings each have a
  committed baseline PNG plus a fresh screenshot captured every run (`playwright/report/
  screenshots/`, always regenerated, useful for manual comparison independent of the automated
  diff). Home's `.hero-card` (real random daily quote + today's real date, by design) is
  masked from the diff and its `Math.random()` is pinned for the baseline's own capture, since
  an unmasked/unpinned diff would otherwise flag a real, working feature as a false regression
  every single run.

## 4. Technical Debt (this Sprint's own, plus notable pre-existing items surfaced while building it)

**New, from this Sprint:**
- Screenshot baselines were captured against a pre-installed Chromium build (this development
  environment's outbound network policy blocks Playwright's own CDN, so the exact browser
  build `npx playwright install` fetches on GitHub Actions could not be downloaded here).
  GitHub Actions may render with sub-pixel differences against these baselines on its first
  real run. If so, re-run `npx playwright test --config=playwright/config/playwright.config.js
  --update-snapshots` from within a CI job (or any environment matching the browser build CI
  actually uses) and commit the regenerated PNGs — a one-time task, not a recurring one.
- Branch protection (blocking merge on a red required check) is not configured — see the QA
  Architecture section above.
- Import Log (`docs/TeachingMaterials/import-log.json`, Sprint AI-115 AI-115-08) still has no
  Settings UI surface — carried forward from that Sprint's own report, unchanged by this one.

**Pre-existing, unrelated to this Sprint (surfaced only because building real end-to-end
Playwright coverage touches almost every page):**
- `window.location.href =` in `js/components/HomeRecentMaterials.js` remains the one
  documented, tracked exception to the forbidden-pattern rule (`npm run verify`'s own
  KNOWN-ISSUE line) — unchanged.
- Material Card's 出版社/關鍵字/教材來源 fields (flagged since Sprint v1.3) remain
  undisplayable — unchanged.
- Non-`single_choice` Exam-Mode question types remain unsupported — unchanged (both items are
  pre-existing, already-tracked gaps in `docs/PMO/PROJECT_STATUS.json`'s own
  `knownLimitations`/`teachingMaterialRepository` sections, not newly discovered by this
  Sprint).

## Recommendation for GPT PMO

1. Enable Branch Protection on `main` requiring the "Verify + Test + Playwright" workflow job
   to pass before merge, closing this Sprint's one real enforcement gap.
2. After the first GitHub Actions run of `.github/workflows/playwright.yml`, check whether the
   Snapshot job passes; if it fails on cross-build rendering noise (not a real UI regression),
   regenerate baselines from within that same CI environment per the instructions above.
3. Treat `docs/QA/QaDashboard.json` (regenerated every CI run, uploaded as an artifact) as the
   fastest single place to check "is everything green" without re-reading five separate suite
   logs.
