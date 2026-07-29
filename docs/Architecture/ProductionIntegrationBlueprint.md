# ProductionIntegrationBlueprint.md — Sprint AI-017

The single authoritative Production Integration Blueprint, consolidating Repository Truth established across Sprints AI-015C (Question Provider Bridge), AI-015E (Quiz Production Cutover), AI-015F (WrongBook Production Integration Audit), AI-015G (Review Production Audit), and AI-016 (Learning History Production Audit). **No new discovery was performed for this document** — every claim below cites the specific prior Sprint's already-committed or already-produced evidence. Pure consolidation, no code touched, no Runtime modified.

## Pipeline-wide status at a glance

```
Material ──✅── AI Summary ──✅(parallel,── Question ──✅── Quiz ──✅── WrongBook ──◐── Review ──❌── History ──❌── Dashboard
(complete)      not sequential,     (complete)  (complete) (complete)  (1 of 4 real
                 see Boundary 2)                                        consumers)
```
✅ = Production-complete and validated with real evidence. ◐ = Partially complete (one real consumer working, others structurally disconnected). ❌ = No code path exists at all.

## Boundary 1 — Material → AI Summary

1. **Current Production implementation**: `AHS.AIEngine.SummaryProvider`, default mode `"new"` since Sprint AI-013's Beta Cutover. `AITutorService.ensureLearningSummary()`/`getLearningSummary()` delegate to it.
2. **Repository Runtime(s)**: `KnowledgeGraphRuntime` (source), `ai-engine/src/runtime/SummaryRuntime.js` + `SummaryService`/`SummaryEngine`/`SummaryBuilder` (New Runtime), `KnowledgeSummaryRuntime` (Legacy Runtime, still valid rollback path).
3. **Existing Bridge(s)**: `SummaryProvider` itself is the Migration Bridge (Read/Generate separation, LOCK per EO-AI-012C).
4. **Existing Projection(s)**: `MaterialSummaryCard.js` (materials.html UI), pure display.
5. **Existing reusable components**: All of the above — untouched by this consolidation.
6. **Remaining integration gap**: **None.** Cutover complete and QA-validated (Sprint AI-013 Part C Runtime Validation, Sprint AI-014 Phase 1 Legacy Manifest confirmed nothing removable, no regression).
7. **Components that must remain unchanged**: `SummaryProvider`, `KnowledgeSummaryRuntime` (Legacy, rollback path), the entire `ai-engine/` New Runtime chain.
8. **Recommended minimum implementation sequence**: None required — this boundary is done.

## Boundary 2 — AI Summary → Question

**Repository Truth correction (carried forward from `QuestionGenerationRuntime.js`'s own LOCK header, re-confirmed in Sprint AI-015A's audit)**: this boundary is drawn as sequential in every version of the pipeline diagram used across AI-015E through AI-017, but the real architecture is that **Summary and Question are PARALLEL siblings**, both independently consuming `KnowledgeGraphRuntime` — Question generation never reads Summary output. This is a LOCK architectural fact (source-scan asserted in `tests/regression/QuestionGenerationRuntimeV1.js`), not a simplification this Blueprint should smooth over.

1. **Current Production implementation**: `AHS.QuestionGenerationRuntime.generateQuestions(materialId)`, triggered via `AHS.AITutorService.ensureQuestionSet(materialId)`.
2. **Repository Runtime(s)**: `KnowledgeGraphRuntime` (source), `QuestionGenerationRuntime` (Sprint 8.2, LOCK).
3. **Existing Bridge(s)**: None needed at this boundary — `ensureQuestionSet()` is a direct, single-Runtime trigger.
4. **Existing Projection(s)**: `MaterialQuestionCard.js` (materials.html UI, displays `QuestionGenerationRuntime`'s own store directly).
5. **Existing reusable components**: `AITutorService.ensureQuestionSet()`, `MaterialTextPipeline`, `KnowledgePipeline`.
6. **Remaining integration gap**: **None.** This boundary works and is validated (Sprint AI-015C Part D, Sprint AI-015E Part D/E — same trigger, now also composed with the next boundary's Bridge).
7. **Components that must remain unchanged**: `QuestionGenerationRuntime` (LOCK, Forbidden-listed across AI-015E/F/G/016), `AITutorService.ensureQuestionSet()`.
8. **Recommended minimum implementation sequence**: None required.

## Boundary 3 — Question → Quiz

1. **Current Production implementation**: materials.html's「產生 AI 題目」button (`js/ui/MaterialQuestionCard.js`) composes `ensureQuestionSet()` → `QuestionProviderBridge.bridge()` (Sprint AI-015E Option A, PMO-approved after two real architecture-conflict stops). Quiz (`QuizCenter.js`) reads `LearningQuestionRuntime` only — 100% Read, zero self-generation.
2. **Repository Runtime(s)**: `QuestionGenerationRuntime` (source), `LearningQuestionSession` + `LearningQuestionRuntime` (both write targets).
3. **Existing Bridge(s)**: `QuestionProviderBridge` (Sprint AI-015C) — pure Shape Mapping, calls only existing `LearningQuestionGenerator.generate()` + `LearningQuestionSession.add()` and `LearningQuestionRuntime.sync()`.
4. **Existing Projection(s)**: `QuizCenter.js`'s `buildPracticeListView()`/`showQuestionGuide()` (read-only, `LearningQuestionRuntime`-sourced).
5. **Existing reusable components**: `LearningQuestionGenerator` (Schema v1.0 packager), `QuestionGenerator.js` (Mode A `generateOriginalQuestion`, real-content packager for `LearningQuestionRuntime`).
6. **Remaining integration gap**: **None.** Fully validated end-to-end across 3 real materials (math/biology/history), 42/42 checks (Sprint AI-015E Part D/E).
7. **Components that must remain unchanged**: `QuestionGenerationRuntime`, `QuestionProviderBridge`, `LearningQuestionSession`/`LearningQuestionRuntime` Public APIs, `QuestionRuntime`/`QuestionBank`/`ExamRuntime`/`AutoGrader` (Exam Mode / Loop A, structurally untouched throughout).
8. **Recommended minimum implementation sequence**: None required.

## Boundary 4 — Quiz → WrongBook

1. **Current Production implementation**: `QuizCenter.js`'s `wrongBookHook()`, using a read-only Identity Mapping (`wrongBookQuestionId()`, Sprint AI-015E) to resolve a displayed `LearningQuestionRuntime` record to its `LearningQuestionSession` sibling before calling `WrongBookGenerator.add()` — required because `WrongBookGenerator` is hardwired to resolve only against `LearningQuestionSession`.
2. **Repository Runtime(s)**: `WrongBookSession` (v1.0 store), `WrongBookRuntime` (Sprint 4, legacy Exam-mode store — has a SECOND real write source, see Existing Bridge below).
3. **Existing Bridge(s)**: `WrongBookGenerator` (Interface, Sprint 7.0) is the sole `WrongBookSession` writer. Separately, `js/pages/AppWrongBook.js`'s `bridgeSessionIntoSprint4Runtime()` mirrors `WrongBookSession` into `WrongBookRuntime` on every `wrongbook.html` load, via `WrongBookRuntime.sync()` (the same, existing, unmodified API `AutoGrader.grade()` also uses) — this is what lets the legacy `WrongBook.js` UI component (which reads `WrongBookRuntime` exclusively, per an existing PMO ruling) display real v1.0 data.
4. **Existing Projection(s)**: `WrongBook.js`'s Summary Card / Live Stats card (`AppWrongBook.js`'s `buildSessionStatsCard()`, reads `WrongBookSession.statistics()` directly).
5. **Existing reusable components**: The in-page Retry Flow (`WrongBook.js`'s `syncV1OnReviewResult()`) already correctly round-trips through `WrongBookGenerator.update()`/`.add()` + `ReviewQueue.enqueue()`.
6. **Remaining integration gap**: **None.** Fully validated (Sprint AI-015F Part B, 22/22 — wrong-answer creation, duplicate handling, retry flow, statistics, the `WrongBookRuntime` bridge).
7. **Components that must remain unchanged**: `WrongBookGenerator`, `WrongBookSession`, `WrongBookRuntime` (both of its real write sources are legitimate, not cleanup candidates), `QuizCenter.js`'s Identity Mapping.
8. **Recommended minimum implementation sequence**: None required.

## Boundary 5 — WrongBook → Review

**Real architecture**: four independent Review consumers exist, only one is Production-connected.

1. **Current Production implementation**: `AHS.WrongBookSession` → `AHS.ReviewQueue.enqueue()` (called from `QuizCenter.js`'s `wrongBookHook()` and `WrongBook.js`'s retry flow) → `AHS.ReviewModel` (read-only) → `AHS.ReviewWidget` (`index.html` home page only).
2. **Repository Runtime(s)**: `ReviewQueue`, `ReviewModel` (both real, Production-connected, Sprint 7.0). `ReviewRuntime` (Sprint 4, Exam-mode detail shaper, loaded on `review.html` but zero real callers — intentionally dormant per an earlier PMO ruling, not a gap). `ReviewGeneratorRuntime` (Sprint 8.2, materials.html AI Tutor panel — built, wired to `AITutorRuntime.getReviewList()`, but inert, see gap below).
3. **Existing Bridge(s)**: None needed for the working `index.html` path — `ReviewModel` reads `ReviewQueue`/`WrongBookSession` directly.
4. **Existing Projection(s)**: `ReviewWidget.js` (`index.html`, 100% `ReviewModel`-sourced, working correctly — Sprint AI-015G Part B, 6/6).
5. **Existing reusable components**: `ReviewQueue`, `ReviewModel` — both already correct and sufficient for any future consumer; no new Runtime needed to close either gap below.
6. **Remaining integration gap — TWO real, confirmed gaps**:
   - **Gap 5a — `review.html` is structurally disconnected.** `AppReview.js` reads only `HistoryRuntime` (Exam Mode) + `WrongBookRuntime` (a boolean `hasWrongItems` check). `review.html`'s `<script>` list does not load `ReviewQueue.js`, `ReviewModel.js`, `WrongBookSession.js`, or `LearningQuestionSession.js` at all — confirmed via `grep`. Empirically confirmed (Sprint AI-015G Part B-3): real, promoted Mastery data never appears anywhere in `review.html`'s DOM.
   - **Gap 5b — `ReviewGeneratorRuntime` is doubly inert.** (i) Zero production trigger: `grep` confirms nothing calls `generateReview()` anywhere in production code; `AITutorRuntime.getReviewList()`'s own comment states "Read-only: never generateReview()." (ii) Even if triggered, an independent id-space mismatch: `WrongBookSession.questionId` is always `LearningQuestionSession`-shaped (`lqv1_N`/`lq_N`); `generateReview()` resolves it via `QuestionGenerationRuntime.getQuestion(id)`, which only recognizes its own `qg_N` ids — always returns `null`, entry silently skipped. Both confirmed empirically (Sprint AI-015G Part B-4).
7. **Components that must remain unchanged**: `ReviewQueue`, `ReviewModel`, `ReviewWidget` (all already correct — do not touch), `WrongBookGenerator`/`WrongBookSession` (Forbidden across every prior Sprint in this track).
8. **Recommended minimum implementation sequence**: See Roadmap Phase 1 (Gap 5a) and Phase 2 (Gap 5b) — both closeable by **reusing** `ReviewQueue`/`ReviewModel` (5a) and by redirecting `ReviewGeneratorRuntime`'s resolution to `LearningQuestionSession`/`LearningQuestionRuntime` instead of `QuestionGenerationRuntime` (5b) — neither requires a new Runtime.

## Boundary 6 — Review → History

1. **Current Production implementation**: **None exists.**
2. **Repository Runtime(s)**: `HistoryRuntime` (Sprint 4) exists but is Exam-Mode-native only (`examId`/`score`/`accuracy` schema) — it has no field connecting it to `LearningQuestionSession`/`WrongBookSession`/`ReviewQueue` at all.
3. **Existing Bridge(s)**: None.
4. **Existing Projection(s)**: None for Practice Mode. (`StatisticsRuntime` projects `HistoryRuntime` for Exam Mode only, consumed solely by `QuizCenter.js`'s own right rail — not Dashboard, a clarified misconception, see Boundary 7.)
5. **Existing reusable components**: `WrongBookSession` already carries everything a "Practice History" view would need — `firstWrongAt`/`lastWrongAt` timestamps, `wrongCount`, `masteryLevel` progression — and `ReviewModel.js` already demonstrates the exact reuse pattern needed (a pure, read-only, per-call-derived Projection over `WrongBookSession` + `ReviewQueue`, "never stored, never stale").
6. **Remaining integration gap**: **The entire boundary is missing.** Confirmed via `grep -rn "HistoryRuntime\.record("`: the only call site is Exam Mode's `finishExam()`. Empirically confirmed (Sprint AI-016 Check 1): a full real Practice Mode → WrongBook → mastery-promotion → Review sequence never once touches `HistoryRuntime`.
7. **Components that must remain unchanged**: `HistoryRuntime` (works correctly for Exam Mode, not a bug), `WrongBookSession`/`ReviewQueue` (source data, already correct).
8. **Recommended minimum implementation sequence**: See Roadmap Phase 3 — build a **read-only Projection** (following `ReviewModel.js`'s exact precedent), not a new persisted Runtime. `WrongBookSession`'s existing timestamp/mastery fields are sufficient source data; no new write path is needed.

## Boundary 7 — History → Dashboard

1. **Current Production implementation**: **None exists.**
2. **Repository Runtime(s)**: N/A — `dashboard.html` does not load `HistoryRuntime.js`, `StatisticsRuntime.js`, `WrongBookSession.js`, or `ReviewQueue.js` at all (confirmed via `grep -n "<script" dashboard.html`).
3. **Existing Bridge(s)**: None.
4. **Existing Projection(s)**: `Dashboard.js`'s `create(model)` **already exists and already accepts a real model** — its only current caller, `AppDashboard.js`, simply never constructs or passes one, so `create()` always takes its `!data` branch and renders the honest Empty State. `StatisticsRuntime.refresh()` already demonstrates the exact shape-matching pattern needed for Exam-Mode stat cards ("shapes... into the exact stat-card/donut shape AHS.QuizCenter already renders, so the UI can swap from static Mock numbers to live Runtime numbers without any markup change").
5. **Existing reusable components**: `StatisticsRuntime` (Exam-Mode stats, ready to reuse as-is), the Boundary 6 Projection (once built, supplies Practice-Mode stats in the same spirit).
6. **Remaining integration gap**: **The entire boundary is missing**, but the gap is narrow and precisely bounded — `Dashboard.js` itself needs **no changes**; only `AppDashboard.js` needs to construct a real `model` and pass it to the existing `create(model)`. Confirmed via `grep`: zero `HistoryRuntime`/`StatisticsRuntime`/`WrongBookSession`/`ReviewQueue` references anywhere in `dashboard.html`'s script list or `Dashboard.js`/`AppDashboard.js`. Empirically confirmed (Sprint AI-016 Check 3): Dashboard shows the Empty State unconditionally even when real WrongBook/Review data exists elsewhere in the same session.
7. **Components that must remain unchanged**: `Dashboard.js`'s `create(model)` signature and rendering logic (already correct and ready — do not modify), `StatisticsRuntime` (already correct).
8. **Recommended minimum implementation sequence**: See Roadmap Phase 4 — depends on Phase 3 (the History Projection supplies Practice-Mode data); `AppDashboard.js` combines `StatisticsRuntime.refresh()` (Exam data, already exists) + the new Projection (Practice data) into one `model` object shaped for `Dashboard.js`'s existing `create(model)`, plus the missing `<script>` tags on `dashboard.html`.

## One further, real, cross-cutting finding (not a pipeline boundary, but affects consistency)

`QuizCenter.js`'s own Exam Mode right-rail `history()` function still falls back to static Mock data when `HistoryRuntime` is empty (Sprint AI-016 Dependency Audit §2) — inconsistent with the "honest Empty State, never Mock" convention every other page in this track (`WrongBook`, `Dashboard`, `Review Home`'s `dueToday`) already follows since `EO-S7.0-003 Production Cleanup`. Flagged for the Roadmap; not a pipeline-boundary gap.
