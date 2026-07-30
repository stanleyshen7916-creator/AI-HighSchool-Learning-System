# RuntimeInventory.md — Sprint AI-104A｜Repository Baseline Synchronization

Every stateful Runtime-class module in the repository, verified by direct file inspection (header
comments + public API), not by memory or prior docs. "LOCK" = the file's own header/commit history
declares it LOCK or the equivalent (e.g. "PMO Decision (LOCKED, ...)"). "Still Used" = confirmed by
grep for real callers, not assumed. "Deprecated" = superseded by a newer module but not deleted.

## `js/runtime/` (32 files)

| Runtime | Function | Key API | Real Callers | LOCK | Still Used | Deprecated |
|---|---|---|---|---|---|---|
| `MaterialRuntime` | Single source of truth for uploaded/imported materials. Starts empty, no seed. | `add`,`list`,`getById`,`remove`,`toggleFavorite`,`markPreviewed`,`startLearning`,`addFolder`+folder ops | Material Center, Home, Quiz, WrongBook, Dashboard (indirect), AI Engine's `KnowledgeLoader`, `ImportRuntime` | ✅ LOCK (2026-07-10) | ✅ Yes, extensively | No |
| `SummaryRuntime` | Sprint-5 5-section Summary store (`coreConcepts`/`definitions`/`pitfalls`/`memorize`/`reviewSuggestions`). | `add`,`sync`,`list`,`getById`,`findByMaterialId`,`findBySubject` | `summary.html`→`SummaryCenter.js`/`AppSummary.js` (real, wired) | Sprint 6 (EO-S6-003) | ✅ Yes, `summary.html`'s real data source | No — NOT deprecated; distinct from `ai-engine`'s `SummaryRuntime` (different namespace/schema) |
| `QuestionRuntime` | Exam Mode question-set cache, keyed by examId. Fed by `QuestionBank.generate()`. | `loadForExam`,`hasExam`,`getSet`,`count`,`getQuestion`,`getQuestionById`,`clear`,`importQuestions`*,`reset` | `QuizCenter.js` (Exam Mode), `ExamRuntime`, `AutoGrader`; `importQuestions` used by `ImportRuntime` (Sprint AI-103) | Sprint 4 | ✅ Yes | No |
| `WrongBookRuntime` | Exam-Mode 錯題 store, grows via `sync(gradedResult)` after `AutoGrader.grade()`. | `list`,`isEmpty`,`getById`,`sync`,`toggleBookmark`,`reset` | `AutoGrader`→this; `ImportRuntime` (Sprint AI-103, reshapes ErrorBook.json into `sync()`'s contract) | Sprint 4 | ✅ Yes for Exam Mode | Partially — Dashboard does NOT read this (see `WrongBookSession` below) |
| `WrongBookSession` | PersistenceAdapter-backed Practice-Mode wrong-book store — what Dashboard actually reads. | (Practice Mode write/read API, session-persisted) | `WrongBookGenerator`, `WrongBook.js`/`AppWrongBook.js`, Dashboard's `hasAnyRealData()` | Sprint 6.6/AI-015F era | ✅ Yes, Dashboard's real source | No |
| `ReviewRuntime` | Read-only View-Model builder off `AutoGrader`'s cached graded result (Exam Mode). | `build(examId)` | Exam Mode Review screen | Sprint 4 | ✅ Yes for Exam Mode | Not deprecated but narrow-scope; Practice-Mode review is `ReviewQueue`/`ReviewModel`/`ReviewGeneratorRuntime` below |
| `ReviewGeneratorRuntime` | Knowledge-Graph-traceable review generation for Practice Mode, wired into `materials.html`'s AI Tutor panel. | `generateReview`,`getReview`,`getReviewByMaterial`,`getReviewByKnowledgeNode`,`clearReview`,`serialize` | `MaterialQuestionCard.js`'s generate flow (Sprint AI-018) | Sprint AI-018 | ✅ Yes | No |
| `ReviewQueue` | PersistenceAdapter-backed spaced-repetition queue. | `enqueue`,`getByQuestionId`, etc. | `review.html`'s `ReviewWidget`, `LearningHistoryModel` | Sprint 7.0-era | ✅ Yes | No |
| `ReviewModel` | Read-only Projection over `ReviewQueue`. | query methods | `review.html` | Sprint 7.0 | ✅ Yes | No |
| `HistoryRuntime` | Append-only finished-exam summary list, memory-only. | `record`,`list` | `AutoGrader`→this; `StatisticsRuntime` reads it; Dashboard's `hasAnyRealData()` | Sprint 4 | ✅ Yes, Dashboard's real Exam-side source | No |
| `StatisticsRuntime` | Purely computed — reads `HistoryRuntime.list()`, no storage of its own. | `refresh`,`getSubject`,`accuracyBySubject` | Dashboard (`AppDashboard.js`) | Sprint 4 | ✅ Yes | No |
| `LearningHistoryModel` | Read-only Projection: Practice-Mode history derived from `WrongBookSession`+`ReviewQueue`. Shape-compatible with `StatisticsRuntime.refresh()`. | `list`,`masteryRateBySubject`,`getSubject`,`refresh` | Dashboard (`AppDashboard.js`, Sprint AI-020) | Sprint AI-019 | ✅ Yes | No |
| `KnowledgeRuntime` | Sprint-6 Knowledge store/query/sync. | `add`,`sync`,query methods | `summary.html` chain (legacy path) | Sprint 6 (EO-S6-002) | Partial — superseded in the real Production Pipeline by `KnowledgeGraphRuntime` (below) for materials.html's flow, but still loaded/used by the Sprint-6 Summary path | Effectively superseded for the main pipeline, not deleted |
| `KnowledgeGraphRuntime` | THE Single Source of Truth graph for every real AI feature since Sprint 8.0 — one shared graph, multiple files merge into it. | `queryByMaterial`, node CRUD, `reset` | `KnowledgeExtractionRuntime`→this; `QuestionGenerationRuntime`, `KnowledgeSummaryRuntime`, `AnswerBuilderRuntime` all read it | Sprint 8.0 (EO-S8.0-001) | ✅ Yes — the real production graph | No |
| `KnowledgeExtractionRuntime` | Fixed pipeline stage: `AnalysisRuntime → THIS → KnowledgeGraphRuntime`. | `extract`/pipeline hook | `KnowledgePipeline.js` | Sprint 8.0 (EO-S8.0-002) | ✅ Yes | No |
| `KnowledgeSummaryRuntime` | Real, production, rule-based Summary generator reading `KnowledgeGraphRuntime` — the Legacy target `SummaryProvider` falls back to. | `getSummaryByMaterial`, generate | `AITutorService`, `SummaryProvider` (ai-engine, legacy mode) | Sprint 8.2 (EO-S8.2.002) | ✅ Yes, real production path for `materials.html` | No |
| `FolderRuntime` | Study Scope container (not a file folder) — scopes every AI flow. | `createFolder`,`listFolders`,folder ops | Material Center, `ImportRuntime` tests | Sprint 8.0 (EO-S8.0-003) | ✅ Yes | No |
| `DocumentClassifierRuntime` | Classifies a material into material/handout/exam/answer_key/note/other. | `classify` | `KnowledgePipeline.js` | Sprint 8.0 (EO-S8.0-001) | ✅ Yes | No |
| `QuestionGenerationRuntime` | THE real, LOCK, rule-based production question generator — reads `KnowledgeGraphRuntime` only, never Summary. Four real options, no invented distractors. | `generateQuestions`,`getQuestion`,`getQuestions`,`getQuestionsByMaterial`,`clearQuestions`,`serialize` | `QuestionProviderBridge`→`LearningQuestionSession`/`Runtime` (Sprint AI-015C bridge), `materials.html`'s real 「產生 AI 題目」button | Sprint 8.2 (EO-S8.2.003) | ✅ Yes, the real production path | No |
| `QuestionProviderBridge` | Shape-mapping bridge: `QuestionGenerationRuntime` output → `LearningQuestionSession`/`LearningQuestionRuntime` shape, for Quiz's Practice Mode reads. | `bridge(materialId)` | `MaterialQuestionCard.js`'s generate button | Sprint AI-015C | ✅ Yes | No |
| `LearningQuestionRuntime` | Sprint-6 Practice Mode question store; Quiz Center's real Practice Mode read source. | query API | `QuizCenter.js` (Practice Mode) | Sprint 6 (EO-S6-004) | ✅ Yes | No |
| `LearningQuestionSession` | Sprint 6.9 session-scoped question store, PersistenceAdapter-backed. | write/read API | `QuestionProviderBridge`, `QuizCenter.js` | Sprint 6.9 | ✅ Yes | No |
| `QuestionBank` | Pure, deterministic mock-question generator for Exam Mode, reads `AHS.Mock.quiz.items`. | `generate(examMeta)` | `QuestionRuntime.loadForExam()` | Sprint 4 | ✅ Yes for Exam Mode | No |
| `ExamRuntime` | Exam session state machine (draft→ready→running→finished). | session API | Exam Mode flow | Sprint 4 | ✅ Yes | No |
| `ExamBankRuntime` | Question Bank Mode A — real questions ingested from uploaded exam files, verbatim, no edit path. | `ingest` | Exam upload flow (Sprint 8.0 Module 5) | Sprint 8.0 (EO-S8.0-001) | Partial — no default bank ships; real use gated on exam-file ingestion | No |
| `AnswerRuntime` | Records a student's in-progress answers during an Exam session. | `saveAnswer`,`getAnswers` | `QuestionCard.js`, `AutoGrader` | Sprint 4 | ✅ Yes | No |
| `AutoGrader` | Grades a finished exam (`QuestionRuntime`+`AnswerRuntime`→graded result), cached per examId. | `grade`,`getGraded` | `ReviewRuntime`,`WrongBookRuntime.sync()`,`HistoryRuntime.record()` | Sprint 4 | ✅ Yes | No |
| `AnswerBuilderRuntime` | Explanation-building interface walking the real Question→KnowledgeNode→Summary→Material chain — Foundation only per PMO Final Decision 5. | lookup chain API | (Foundation, minimal real callers pending downstream content) | Sprint 8.0 (EO-S8.0-001 Module 6) | Partial (skeleton graph limits real output — by design, not a bug) | No |
| `AITutorRuntime` | Unified entry point aggregating existing capability Runtimes into one Learning Context. | context aggregation API | `AITutorService` | Sprint 8.3 (EO-S8.3.001) | ✅ Yes | No |
| `AITutorService` | Service layer above `AITutorRuntime`; real trigger for `ensureLearningSummary()`/`ensureQuestionSet()`/`getLearningSummary()`/`getPracticeQuestions()`. | see above | `MaterialSummaryCard.js`, `MaterialQuestionCard.js` | Sprint 8.3 (EO-S8.3.002) | ✅ Yes, real production trigger path | No |
| `ImportRuntime` | Sprint AI-103 Coordinator — no internal store, calls existing Runtime APIs only. | `importFolder(input)` | (not yet wired to any UI — built, not wired, matching AI-100's own precedent) | Sprint AI-103 | Built, not yet UI-wired | No |
| `ImportValidator` | Sprint AI-103 — structural validation of the 6 fixed import files. | `validate(rawFiles)` | `ImportRuntime` | Sprint AI-103 | Built, not yet UI-wired | No |
| `MetadataParser` | Sprint AI-103 — parses `Metadata.json`'s 11 fixed fields. | `parse(rawJsonText)` | `ImportRuntime` | Sprint AI-103 | Built, not yet UI-wired | No |
| `ContentLoader` | Sprint AI-103 — loads/normalizes the 6 fixed import files (map or File[] input). | `load(input)` | `ImportRuntime` | Sprint AI-103 | Built, not yet UI-wired | No |

## `js/core/`

| Module | Function | LOCK | Still Used |
|---|---|---|---|
| `PersistenceAdapter` | The ONLY module allowed to touch `sessionStorage` directly; every persisted Runtime goes through it. | ✅ LOCK (PMO Decision 025) | ✅ Yes — `MaterialRuntime`, `SummaryRuntime`, `LearningQuestionRuntime`, `WrongBookSession`, `ReviewQueue`, etc. |

## `js/ai/` (Platform-side Adapters, 3 files)

| Adapter | Function | LOCK | Still Used |
|---|---|---|---|
| `SummaryAdapter` | Facade in front of `ai-engine`'s `SummaryService`/`SummaryProvider`; +`generateViaGateway()` (Sprint AI-101C, additive). | EO-AI-007/008/011, extended AI-101C | Not wired into any page's `<script>` order for its Baseline methods; `generateViaGateway()` wired via `AIGatewayPanel.js` (materials.html) |
| `QuestionAdapter` | Mirrors `SummaryAdapter` for Question; +`generateViaGateway()`. | Sprint AI-101, extended AI-101C | Same as above |
| `GatewayIntegration` | Owns the one page-lifetime `AIGateway` instance; configure/build/call/validate/normalize orchestration. | Sprint AI-101C | ✅ Yes, `materials.html` |

## `ai-engine/src/runtime/` + `ai-engine/src/service/` (AI Engine layer, 12 files)

| Module | Function | Namespace collision risk | LOCK | Still Used |
|---|---|---|---|---|
| `SummaryRuntime`/`SummaryHistory`/`SummarySession`/`SummaryPipeline` | 12-field Summary Model store/history/session/orchestration. **Different schema from `js/runtime/SummaryRuntime.js`** — not a duplicate, explicitly documented as such in its own header. | Namespaced under `AHS.AIEngine.*`, no real collision | EO-AI-006 | ✅ Yes — `materials.html`'s real "New" Summary path since Sprint AI-013 Beta Cutover |
| `SummaryService`/`SummaryProvider` | Singleton owning one Summary Runtime+Pipeline; `SummaryProvider` is the legacy/new/compare mode router, default mode `new` since Sprint AI-013. | — | EO-AI-007/011 | ✅ Yes, real production default path |
| `QuestionRuntime`/`QuestionHistory`/`QuestionSession`/`QuestionPipeline` | Mirrors the Summary quartet for Question. 9-field Question Set Model, honest empty `questions[]` stub (no rule-based composition exists yet). | Namespaced under `AHS.AIEngine.*` | Sprint AI-101 | Built, not wired to any UI trigger (Adapter's non-Gateway methods unused so far) |
| `QuestionService`/`QuestionProvider` | Mirrors Summary's pair; `QuestionProvider` default mode `legacy` (not `new` — the New pipeline has no real content yet). | — | Sprint AI-101 | Built, not wired |

## `ai-engine/src/gateway/` (5 files) + `ai-engine/src/schema/` (4 files)

| Module | Function | LOCK | Still Used |
|---|---|---|---|
| `AIGateway` | Provider-independent entry point; `isConfigured()` false unless a real endpoint+client are set. | Sprint AI-100 | ✅ Yes — `GatewayIntegration.js` (materials.html) |
| `GatewayConfig`/`GatewayConfigValidator` | `provider`/`endpoint`/`model` only — no API-key field, structurally. | Sprint AI-100 | ✅ Yes |
| `ApiClient` | Interface only, zero network code. | Sprint AI-100 | ✅ Yes (base class for `HttpApiClient`) |
| `HttpApiClient` | Concrete `ApiClient`, real `fetch()` — this repo's only network call. | Sprint AI-101C | ✅ Yes, inert unless `AppConfig.aiGateway.endpoint` is set (empty by default) |
| `SummarySchema`/`QuestionSchema`/`ErrorSchema`/`SchemaValidator` | JSON Schema definitions + dependency-free validator. | Sprint AI-100 | ✅ Yes |

## Deprecated / Superseded — none formally deprecated, one effectively superseded

No Runtime in this repository is marked `Deprecated` in its own header. The one case of **effective**
supersession without deletion: `KnowledgeRuntime` (Sprint 6, EO-S6-002) predates
`KnowledgeGraphRuntime` (Sprint 8.0) as the "Single Source of Truth" — the real Production Pipeline
(Material→Summary→Question→...) runs on `KnowledgeGraphRuntime`; `KnowledgeRuntime` remains loaded
and used by the older Sprint-6 Summary chain (`summary.html`) but is not part of the newer, real
production flow. Not deleted or renamed here — flagged for a future PMO decision, not resolved by
this Sprint (no code changes authorized).

## Runtime-adjacent but NOT a Runtime (naming caution for future Sprints)

- `js/components/Dashboard.js` / `js/pages/AppDashboard.js` — **no `AHS.DashboardRuntime` exists
  anywhere in this repository.** Dashboard is a pure UI component + page bootstrap that reads
  `StatisticsRuntime`/`LearningHistoryModel`/`HistoryRuntime`/`WrongBookSession` directly. A prior
  Sprint (AI-103's original draft) assumed `DashboardRuntime` existed; it does not.
- `js/components/QuizCenter.js`, `WrongBook.js`, `SummaryCenter.js`, `MaterialCenter.js` — UI
  components, not Runtimes, despite similar naming conventions.
