# PipelineDependencyMap.md — Sprint AI-017

Consolidated dependency map across the entire Production Pipeline. Companion to `ProductionIntegrationBlueprint.md`. Every edge below is grep/read-verified in a prior Sprint (cited inline) — no new discovery performed.

## 1. Full Runtime inventory, by pipeline role

| Runtime / Module | Role | Written by | Read by | Status |
|---|---|---|---|---|
| `KnowledgeGraphRuntime` | Source of truth for both Summary and Question generation | `KnowledgePipeline` | `KnowledgeSummaryRuntime`/AI Engine SummaryService, `QuestionGenerationRuntime` (parallel, not sequential) | ✅ Production |
| `AIEngine.SummaryProvider` + New/Legacy Summary Runtimes | AI Summary | `AITutorService.ensureLearningSummary()` | `MaterialSummaryCard.js` | ✅ Production |
| `QuestionGenerationRuntime` | Question generation (KG-sourced) | `AITutorService.ensureQuestionSet()` | `MaterialQuestionCard.js`, `QuestionProviderBridge` | ✅ Production |
| `QuestionProviderBridge` | Shape-maps Question → Session/Runtime | `MaterialQuestionCard.js`'s button (composed, AI-015E) | — (write-only Bridge) | ✅ Production |
| `LearningQuestionSession` | Schema v1.0 Question store | `QuestionProviderBridge`, `LearningQuestionGenerator` | `QuizCenter.js` (Identity Mapping only, not display since AI-015E), `WrongBookGenerator`, `ReviewQueue`(validation) | ✅ Production |
| `LearningQuestionRuntime` | Sprint 6 Question store, now Quiz's sole read source | `QuestionProviderBridge` | `QuizCenter.js` (100% Read, AI-015E) | ✅ Production |
| `QuestionRuntime`/`QuestionBank`/`ExamRuntime`/`AutoGrader` | Exam Mode (Loop A), Mock-Data-driven | `QuizCenter.js`'s Exam functions | `QuizCenter.js` | ✅ Untouched, isolated |
| `WrongBookGenerator` | WrongBook write Interface | `QuizCenter.js` (Identity-Mapped), `WrongBook.js` retry flow | `WrongBookSession` | ✅ Production |
| `WrongBookSession` | v1.0 WrongBook store | `WrongBookGenerator` only | `ReviewQueue`, `ReviewModel`, `ReviewGeneratorRuntime`, `AppWrongBook.js` bridge | ✅ Production |
| `WrongBookRuntime` | Sprint 4 legacy WrongBook store | `QuizCenter.js`'s `finishExam()` (Exam), `AppWrongBook.js`'s bridge (mirrors Session) | `WrongBook.js` (sole display source) | ✅ Production (two legitimate write sources) |
| `ReviewQueue` | Review scheduling queue | `QuizCenter.js`, `WrongBook.js` retry flow | `ReviewModel` | ✅ Production |
| `ReviewModel` | Read-only Review projection | — (read-only) | `ReviewWidget.js` (`index.html`) | ✅ Production (1 real consumer) |
| `ReviewRuntime` | Sprint 4 Exam-detail shaper | — (never called) | — (never called) | ⚪ Dormant, intentional, not a gap |
| `ReviewGeneratorRuntime` | materials.html AI Tutor review panel | — (never called, Gap 5b) | `AITutorRuntime.getReviewList()` (always empty) | ❌ Inert (no trigger + id mismatch) |
| `HistoryRuntime` | Exam Mode history | `QuizCenter.js`'s `finishExam()` only | `StatisticsRuntime`, `MyLearning.js`, `ReviewHomeCard.js`/`ReviewRecentSession.js` (via `AppReview.js`), `QuizCenter.js`'s own history() | ✅ Production for Exam Mode; ❌ zero Practice Mode connection |
| `StatisticsRuntime` | Derives Exam stats from `HistoryRuntime` | — (read-only) | `QuizCenter.js`'s own right rail ONLY (not Dashboard — a clarified misconception) | ✅ Production, narrowly scoped |
| `Dashboard.js` / `AppDashboard.js` | Dashboard page | — (no writer) | — (`create(model)` never called with real data) | ❌ Structurally disconnected from every Runtime |

## 2. Real vs. assumed edges (every "Baseline diagram" correction found across AI-015E/F/G/016, consolidated)

| Diagram implies | Repository Truth | Established in |
|---|---|---|
| Summary → Question (sequential) | Summary and Question are **parallel** siblings, both reading `KnowledgeGraphRuntime` independently | Sprint AI-015A/`QuestionGenerationRuntime.js` LOCK header (re-confirmed here) |
| `LearningQuestionSession → LearningQuestionRuntime` | Two **independent, parallel** stores; only `QuestionProviderBridge` writes to both, with unrelated ids | Sprint AI-015E Part A |
| `WrongBookGenerator → WrongBookRuntime` | `WrongBookGenerator` never touches `WrongBookRuntime`; the real path is `WrongBookGenerator → WrongBookSession`, plus a *separate* page-load bridge (`AppWrongBook.js`) into `WrongBookRuntime` | Sprint AI-015F Part A |
| `WrongBookRuntime → Review` (single chain) | Four independent Review consumers; only `index.html`'s `ReviewWidget` (via `ReviewModel`, sourced from `WrongBookSession`, not `WrongBookRuntime`) is Production-connected | Sprint AI-015G Part A |
| `Review → History → Dashboard` (single chain) | Neither edge exists in the repository at all | Sprint AI-016 |

## 3. Bridge / Projection inventory (for reuse — Sprint AI-017's explicit mandate: maximize reuse, avoid new layers)

| Name | Type | Pattern | Reusable for |
|---|---|---|---|
| `AIEngine.SummaryProvider` | Bridge (Read/Generate separation) | Mode-based routing between Legacy/New | Precedent only — Summary boundary is already complete |
| `QuestionProviderBridge` | Bridge (pure Shape Mapping) | Reads one Runtime, writes two others via their own existing APIs | Precedent for any future cross-store shape mapping — **do not extend this file itself** (Forbidden across every subsequent Sprint) |
| `QuizCenter.js`'s `wrongBookQuestionId()` | Identity Mapping (read-only, in-component) | Matches a record in Store A to its sibling in Store B via shared content fields, not a shared id | **Directly reusable pattern for Gap 5b** — `ReviewGeneratorRuntime` needs the same kind of resolution, from `QuestionGenerationRuntime`'s `qg_N` space to `LearningQuestionSession`'s `lqv1_N`/`lq_N` space |
| `AppWrongBook.js`'s `bridgeSessionIntoSprint4Runtime()` | Bridge (page-load projection into a legacy Runtime) | Deterministic delta-sync via an existing `sync()` API, idempotent across reloads | Precedent for Gap 5a if `review.html` were to mirror data into a legacy shape — likely unnecessary since `ReviewModel` can be read directly (see Roadmap Phase 1) |
| `ReviewModel.js` | Projection (pure, read-only, derived per call, never stored) | "single flow, no second runtime" — the exact shape Boundary 6/7 need | **Direct precedent for the Boundary 6 History Projection** — same pattern, different source Runtime |
| `StatisticsRuntime.refresh()` | Projection (shape-matches an existing UI's expected model) | "so the UI can swap from static Mock numbers to live Runtime numbers without any markup change" | **Direct precedent for Boundary 7** — `Dashboard.js`'s `create(model)` already expects exactly this kind of pre-shaped model |

No new Bridge or Projection *type* is needed anywhere in the remaining Roadmap — every remaining gap closes by instantiating one of the four patterns already proven in this repository.
