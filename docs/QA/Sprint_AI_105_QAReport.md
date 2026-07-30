# QAReport.md — Sprint AI-105｜Platform Integration & MVP Completion

## Checklist (per Sprint's own QA section)

- ☑ AI105-01 Material Center Integration — PASS, no real sync issue found (see Integration Report)
- ☑ AI105-02 Summary Integration — PASS, single flow confirmed, no parallel flow created
- ☑ AI105-03 Practice/Exam Flow Audit — PASS, both flows confirmed non-contaminating
- ☑ AI105-04 Wrong Book Integration — PASS, sources confirmed limited to Practice + Exam
- ☑ AI105-05 Dashboard Integration — PASS, zero `DashboardRuntime` references, existing Runtimes only
- ☑ AI105-06 Material Detail — implemented (`MaterialContentView.js`), new regression suite PASS
- ☑ AI105-07 Empty State Audit — PASS, unified honest empty states, 0 console errors across pages
- ☑ AI105-08 Regression QA — PASS, see totals below

## Test Results

| Suite | Result |
|---|---|
| `tests/regression/MaterialContentViewV1.js` (new) | 16/16 PASS |
| `npm test` (BehaviorSuite + PipelineRegression) | 181/181 PASS |
| `npm run verify` (VerifyPaths + VerifyForbiddenPatterns) | PASS (1 pre-existing KNOWN-ISSUE, unrelated) |
| All 25 other permanent regression suites | 989/989 PASS |
| **Grand Total** | **1170/1170 real assertions PASS** (175 + 6 + 989, PipelineRegression not double-counted) |

Full sweep executed as 26 individual `node tests/regression/*.js` runs plus `npm test` plus
`npm run verify` — every command run directly in this session, no numbers estimated or carried
over from a prior report.

## Baseline Regression — explicitly confirmed unaffected (AI105-08)

Per this Sprint's own "不得影響：Home / Material / Quiz / WrongBook / Review / Learning / Dashboard"
requirement: `npm test`'s 175-assertion `BehaviorSuite` (real page loads, real user flows across
every one of those pages) is 175/175 PASS. The one pre-existing fragile assertion found during this
Sprint (block [21], `.mat-summary__heading` query ambiguous after `MaterialContentView.js`'s
same-named heading was inserted earlier in document order) was fixed by scoping the query via
`aria-label="AI 重點整理"` — not routed around — and the fix was verified to restore all 175
assertions with no other block affected.

## Constraint Verification

- ☑ **No new Runtime / Store / Data Source** — `MaterialContentView.js` is presentation-only,
  reading `item.content` off the same `AHS.MaterialRuntime` record every other preview section
  already reads. `git diff` confirms no existing Runtime file's public API changed in this Sprint.
- ☑ **No second parallel Summary→Practice flow** — `MaterialQuestionCard.js`/`AITutorService`'s
  existing single path confirmed untouched.
- ☑ **No new `DashboardRuntime`** — `js/components/Dashboard.js` + `js/pages/AppDashboard.js`
  confirmed to read `StatisticsRuntime` + `LearningHistoryModel` directly, exactly as per the
  AI-104A Baseline; no reference to any `DashboardRuntime` symbol exists anywhere in the repository.
- ☑ **XSS-safe content rendering** — Markdown path builds real DOM nodes via `AHS.UI.el()`/
  `document.createTextNode` (zero `innerHTML`, source-scanned by the new regression suite); HTML
  path renders inside a sandboxed `<iframe sandbox="">` via `srcdoc` (no `allow-scripts`/
  `allow-same-origin`), verified by an explicit script-escape assertion.
- ☑ **No fetch()/XMLHttpRequest/localStorage** — confirmed both by `npm run verify`'s
  `VerifyForbiddenPatterns` (PASS) and by the new regression suite's own source scan.

## Known, Honestly-Disclosed Limitations

1. AI105-07's Empty State audit was evidenced primarily through `BehaviorSuite`'s clean 175/175 pass
   (which exercises real empty-state paths for Material/Summary/Practice/WrongBook/Dashboard/Review
   as part of its existing assertions) rather than a newly-written, exhaustive per-component empty
   state test file — see Integration Report for the precise scope of this verification.
2. `MaterialContentView.js`'s Markdown renderer is a small, dependency-free subset (headings, bold/
   italic, lists, paragraphs) — not a full CommonMark implementation. Sufficient for real uploaded
   study-material text; documented in the file's own header, not silently assumed.

## Critical Defects

**None found.**

## Recommendation

Implementation complete, fully tested, zero Baseline regressions across Home/Material/Quiz/
WrongBook/Review/Learning/Dashboard, zero new Runtime/Store/DataSource. Per this Sprint's own
explicit Deliverable 7, commit + push to `main` is authorized and has been performed — see
Integration Report and commit history for the full accumulated AI-103 + AI-104A + AI-105 change set.
