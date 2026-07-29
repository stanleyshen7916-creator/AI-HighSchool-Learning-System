# RemainingSprintRoadmap.md — Sprint AI-017

Defines every remaining implementation Sprint needed to complete the Production Learning Pipeline, per `IntegrationExecutionPlan.md`'s sequencing. PMO may authorize any of these directly from this document without a further repository-wide audit, per this Sprint's Completion Criteria. Sprint numbers below are suggested (AI-018 onward); PMO assigns final numbering.

## Phase 1 (suggested AI-018) — Review Center Production Wiring

- **Objective**: Make `review.html` display real WrongBook/Review Production data (Boundary 5, Gap 5a) alongside its existing Exam Mode history — additive, not a replacement.
- **Implementation Scope**: Add `<script>` tags for `ReviewQueue.js`/`ReviewModel.js`/`WrongBookSession.js` (and any transitive dependency `ReviewModel` needs) to `review.html`; extend `AppReview.js`/`ReviewHomeCard.js` (or a new sibling component, implementer's choice within existing `js/components/` convention) to read and display `ReviewModel.getReviewProgress()`/`getMasteryStatistics()`/`getDueReview()`.
- **Affected Components**: `review.html`, `js/pages/AppReview.js`, `js/components/ReviewHomeCard.js` (or new component). 
- **Dependencies**: None — `ReviewQueue`/`ReviewModel` are already complete.
- **Completion Criteria**: Real WrongBook/Review data (created via the same Production Pipeline validated in AI-015E/F/G) appears in `review.html`'s DOM; Exam Mode history display is unaffected; `npm test`/`npm run verify` pass; no `ReviewQueue.js`/`ReviewModel.js`/`WrongBookSession.js` modification.
- **Expected Repository Outcome**: `review.html` becomes the second real consumer of the WrongBook → Review chain (alongside `index.html`'s `ReviewWidget`), closing Gap 5a.

## Phase 2 (suggested AI-019) — ReviewGeneratorRuntime Production Trigger + Identity Resolution

- **Objective**: Make materials.html's AI Tutor review panel produce real review items (Boundary 5, Gap 5b).
- **Implementation Scope**: (1) Add a real trigger call to `AHS.ReviewGeneratorRuntime.generateReview(materialId)` at an appropriate point in materials.html's AI Tutor flow. (2) Change `ReviewGeneratorRuntime.js`'s internal question-resolution logic to look up against `LearningQuestionSession`/`LearningQuestionRuntime` instead of `QuestionGenerationRuntime`, following the Identity Mapping pattern `QuizCenter.js` already established (Sprint AI-015E).
- **Affected Components**: `js/runtime/ReviewGeneratorRuntime.js` (internal logic only — Public API signature unchanged), materials.html's AI Tutor trigger point (likely `js/ui/MaterialQuestionCard.js` or `AiTutor.js`, implementer to confirm exact real call site).
- **Dependencies**: None — independent of Phase 1.
- **Completion Criteria**: `AITutorRuntime.getReviewList(materialId)` returns real, non-empty review items for a material with real WrongBook entries; `generateReview()`'s Public API (`generateReview`/`getReview`/`getReviewByMaterial`/`getReviewByKnowledgeNode`/`clearReview`/`serialize`) unchanged; regression suite for `ReviewGeneratorV1.js` still passes (its LOCK assertions about forbidden dependencies must still hold — the fix must not introduce a reference to `MaterialRuntime`/`AnalysisRuntime`/`SummaryRuntime`/`KnowledgeGraphRuntime`, only redirect the existing `WrongBookSession` ↔ question-record resolution).
- **Expected Repository Outcome**: materials.html's AI Tutor review panel becomes a real, working third consumer of the WrongBook chain, closing Gap 5b.

## Phase 3 (suggested AI-020) — Learning History Projection (Practice Mode)

- **Objective**: Close Boundary 6 (`Review → History`) by giving Practice Mode a real, honest history surface.
- **Implementation Scope**: One new read-only Projection module (`js/runtime/`, naming per implementer, following `ReviewModel.js`'s exact pattern) deriving Practice-Mode history entries from `WrongBookSession`'s existing fields — no new persisted schema, no new write path.
- **Affected Components**: One new file (a Projection, not a Runtime — per this Blueprint's explicit reuse-first mandate); no existing file modified.
- **Dependencies**: None on Phases 1-2. Is itself a dependency of Phase 4.
- **Completion Criteria**: The Projection's getters return real, derived data matching `WrongBookSession`'s live state on every call (never stored, never stale — same standard `ReviewModel.js` already meets); `HistoryRuntime`/Exam Mode's own history completely unaffected; new regression test confirming zero write path (mirrors `WrongBookFoundationV1.js`'s existing "零寫入" assertion style).
- **Expected Repository Outcome**: A real, queryable Practice-Mode learning history exists for the first time, without a second persisted store.

## Phase 4 (suggested AI-021) — Dashboard Real-Data Wiring

- **Objective**: Close Boundary 7 (`History → Dashboard`) — make `dashboard.html` show real data.
- **Implementation Scope**: Add missing `<script>` tags to `dashboard.html` (`HistoryRuntime.js`, `StatisticsRuntime.js`, `WrongBookSession.js`, `ReviewQueue.js`, Phase 3's Projection); change `AppDashboard.js`'s `init()` to build a real `model` (Exam stats via `StatisticsRuntime.refresh()` + Practice stats via Phase 3's Projection) and call `AHS.Dashboard.create(model)` instead of `create()`.
- **Affected Components**: `dashboard.html`, `js/pages/AppDashboard.js` only. **`js/components/Dashboard.js` itself requires zero changes** — its real-data rendering path already exists and is already correct.
- **Dependencies**: Phase 3 (needs the Practice-Mode Projection as a data source).
- **Completion Criteria**: Dashboard renders real stat cards / charts when real Exam or Practice data exists; still renders the honest Empty State when a session genuinely has none; `Dashboard.js` file diff is empty; `npm test`/`npm run verify` pass.
- **Expected Repository Outcome**: The full Production Pipeline (`Material → ... → Dashboard`) is complete and real end-to-end for the first time.

## Non-blocking cleanup (may be folded into any phase above or done standalone, PMO's choice)

- **Objective**: Remove `QuizCenter.js`'s Exam Mode `history()` function's static-Mock fallback, replacing it with the same honest Empty State convention used everywhere else.
- **Implementation Scope**: `js/components/QuizCenter.js`, `history()` function only.
- **Dependencies**: None.
- **Completion Criteria**: No Mock content ever renders in Quiz's Exam Mode right rail; `npm run verify`'s forbidden-pattern/legacy-reference checks still pass.
- **Expected Repository Outcome**: Full consistency of the "honest empty, never fabricated" convention across every page.

## Sequencing summary

```
Phase 1 (review.html) ─┐
                         ├─ no dependency between them; may run in parallel
Phase 2 (ReviewGenRT) ──┘
                                                    Phase 3 (History Projection)
                                                            │
                                                            ▼
                                                    Phase 4 (Dashboard wiring)
Cleanup item — independent, any time
```

Per this Sprint's PMO Decision: once accepted, this Roadmap is the baseline for authorizing Phases 1-4 directly, without further repository-wide audits, unless new Repository evidence contradicts a specific finding in `ProductionIntegrationBlueprint.md`.
