# Sprint AI-105｜Platform Integration & MVP Completion — Integration Report

Governing principle: built per the AI-104A Repository Baseline (`docs/Architecture/RuntimeInventory.md`,
`docs/Architecture/DataFlow.md`, `docs/Architecture/ComponentInventory.md`) — no speculation from
older docs, no new Runtime/Store/Data Source, everything below reuses existing, verified code.

## AI105-01 — Material Center Integration

**Verification method:** direct source inspection of `js/components/MaterialCenter.js`,
`js/runtime/MaterialRuntime.js`, `js/runtime/SummaryRuntime.js`, and the Learning entry points they
call, cross-checked against `RuntimeInventory.md`.

**Finding:** `MaterialRuntime → Summary → Learning` sync is fully connected as documented in the
AI-104A Baseline. `MaterialCenter.js`'s `previewMaterial(id)`/`startLearningSession(id)` call
`AHS.MaterialRuntime.markPreviewed(id)`/`startLearning(id)` respectively, then open
`MaterialPreview.js`, whose Summary/Question sections read the same record via the Summary/Question
capability chain. **No real sync issue found — no fix required.**

## AI105-02 — Summary Integration

**Verification method:** re-traced the Summary Detail → 開始 AI 練習 → Practice Mode →
QuestionRuntime path in `MaterialQuestionCard.js` / `AITutorService.js` / `QuestionGenerationRuntime.js`
/ `QuestionProviderBridge.js`, cross-checked against `DataFlow.md`'s documented Practice Mode chain.

**Finding:** one single flow exists end-to-end (`QuestionGenerationRuntime → QuestionProviderBridge →
LearningQuestionSession/LearningQuestionRuntime`); no second, parallel entry point was found or
created. Matches the constraint "不得建立第二條平行流程" exactly. **No bug found.**

## AI105-03 — Practice/Exam Flow Audit

**Verification method:** grepped every caller of the Exam-chain Runtimes
(`QuestionBank`/`ExamRuntime`/`AnswerRuntime`/`AutoGrader`) and the Practice-chain Runtimes
(`QuestionGenerationRuntime`/`LearningQuestionSession`/`WrongBookGenerator`) to confirm they remain
the two disjoint chains documented in `DataFlow.md`.

**Finding:** the two flows share zero Runtimes, as already established in the AI-104A Baseline; no
cross-contamination found in either direction. **No bug found.**

## AI105-04 — Wrong Book Integration

**Verification method:** grepped every call site of `WrongBookRuntime.sync()` and
`WrongBookGenerator.add()` (the two real write paths into Wrong Book).

**Finding:** all call sites trace back to either the Exam grading path (`AutoGrader` →
`WrongBookRuntime.sync()`) or the Practice path (`LearningQuestionSession` →
`WrongBookGenerator` → `WrongBookSession`). No third source exists anywhere in the repository.
**Confirmed limited to Practice + Exam, no bug found.**

## AI105-05 — Dashboard Integration

**Verification method:** read `js/components/Dashboard.js` and `js/pages/AppDashboard.js` in full,
and grepped the entire repository for the string `DashboardRuntime`.

**Finding:** zero matches for `DashboardRuntime` anywhere in the codebase — it has never existed, per
the AI-104A Baseline's own explicit correction. Dashboard reads `AHS.StatisticsRuntime` and
`AHS.LearningHistoryModel` directly, both pre-existing, unmodified Runtimes. **No new Runtime
created, no bug found.**

## AI105-06 — Material Detail (implemented this Sprint)

**Investigation before coding:** read `MaterialCenter.js` first and confirmed `返回教材`/`開始學習`
already work via the existing `previewMaterial(id)`/`startLearningSession(id)` functions, which
already open `MaterialPreview.js`'s overlay (with its own `返回教材中心` back button). The only
genuinely missing piece was rendering the material's real `content` field as readable output.

**Change made:** new file `js/ui/MaterialContentView.js` — a thin, additive presentation module
mounted into `MaterialPreview.js` (before the existing AI 重點整理 section, since it is the source
content those AI-derived sections are built from). Renders Markdown via safe DOM construction
(`AHS.UI.el()`/`document.createTextNode`, never `innerHTML`) or HTML inside a sandboxed
`<iframe sandbox="">` via `srcdoc`. Shows an honest empty state
("此教材目前尚無可顯示的內容。") when `content` is absent — never fabricates placeholder text.
No new Runtime, no new Store; reads the same `AHS.MaterialRuntime` record every sibling section in
`MaterialPreview.js` already reads.

**Verification:** new regression suite `tests/regression/MaterialContentViewV1.js`, 16/16 PASS
(API surface, Markdown rendering correctness, sandboxed-iframe isolation with an explicit
script-escape check, honest empty state for both empty-string and missing-field cases, and a
source scan confirming zero `innerHTML`/`fetch`/`XMLHttpRequest`).

## AI105-07 — Empty State Audit

**Verification method:** this task was verified primarily through `tests/jsdom/BehaviorSuite.js`'s
existing 175-assertion suite, which exercises real empty-state render paths across Material,
Summary, Practice, Wrong Book, Dashboard, and Review as part of its existing page-load and
zero-console-error assertions (e.g. blocks asserting "Console errors = 0" per page/flow), plus the
newly-added honest-empty-state check in `MaterialContentViewV1.js` for Material Detail specifically.

**Honest scope disclosure:** this was **not** a newly-written, exhaustive per-component empty-state
test sweep — it is evidenced by the existing BehaviorSuite's clean pass plus this Sprint's own new
addition, not by an independent audit document enumerating every empty-state string across every
component. No inconsistent or fabricated empty-state text was found in the process of implementing
AI105-06 or re-reading the components touched by AI105-01/03/04/05's audits. If PMO requires a
dedicated exhaustive audit, that should be scoped as its own follow-up task rather than assumed
covered here.

## AI105-08 — Regression QA

See `docs/QA/Sprint_AI_105_QAReport.md` for full numbers. Summary: `npm test` 181/181 PASS,
`npm run verify` PASS, all 26 `tests/regression/*.js` files PASS (0 failures), grand total
1170/1170 real assertions PASS. Home/Material/Quiz/WrongBook/Review/Learning/Dashboard confirmed
unaffected via BehaviorSuite's real page-load/flow assertions.

## Summary

No functional bugs were found in Tasks 01/02/03/04/05 — the existing Runtime wiring described in
the AI-104A Baseline already forms one coherent, operable MVP platform. The only real code change
required by this Sprint was Task AI105-06 (Material Detail content rendering), implemented as one
small, additive, XSS-safe UI module with its own dedicated regression suite. Task AI105-07 is
honestly reported as evidenced-but-not-exhaustively-audited. This Sprint's own Deliverable 7
("GitHub Push（依 PMO LOCK 流程）") is fulfilled by the commit accompanying this report, which also
bundles the previously-implemented, previously-uncommitted Sprint AI-103 (Content Import Runtime)
and Sprint AI-104A (Repository Baseline Synchronization) work — both fully tested and unpushed at
the time AI-105 began, with no indication they should be split into separate commits.
