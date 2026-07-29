# ReviewProductionFlow.md — Sprint AI-015G Part A

Repository Audit of the complete Review architecture. Pure documentation — no code touched. Every claim below is taken from reading `js/runtime/ReviewQueue.js`, `js/runtime/ReviewModel.js`, `js/runtime/ReviewRuntime.js`, `js/runtime/ReviewGeneratorRuntime.js`, `js/components/ReviewWidget.js`, `js/components/ReviewHomeCard.js`, `js/components/ReviewQuickAction.js`, `js/components/ReviewRecentSession.js`, `js/pages/AppReview.js`, `js/runtime/AITutorRuntime.js` in full, plus `grep`-verified `<script>` wiring on `review.html`/`index.html`/`materials.html` — not inferred from this Sprint's Baseline diagram. `ai-engine/review/` and `ai-engine/src/services/review/` are confirmed empty `.gitkeep` placeholders (per CLAUDE.md), not part of the runtime.

**There are four independent Review consumers, not one** — confirmed structurally (disjoint `<script>` loads, zero cross-references), consistent with Sprint AI-015A's original finding and re-verified fresh here against the current (post Sprint AI-015E/F) codebase.

## 1. ReviewQueue (`js/runtime/ReviewQueue.js`, Sprint 7.0 · EO-S7.0-001)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | Whatever a caller supplies to `enqueue({questionId, nextReviewAt, priority, masteryLevel})`. Real callers: `QuizCenter.js`'s `wrongBookHook()`, `WrongBook.js`'s `syncV1OnReviewResult()` (both confirmed in Sprint AI-015F's audit). |
| **Read Path** | `list()`, `count()`, `getByQuestionId()`. |
| **Write Path** | `enqueue()` — validate-gated: `questionId` must resolve to a real `AHS.WrongBookSession.getByQuestionId()` entry or the enqueue is rejected. One entry per `questionId` (replace, never duplicate). |
| **Identity Mapping** | `questionId` is a `LearningQuestionSession` id, verbatim passthrough from `WrongBookSession`. |
| **Runtime Dependency** | `AHS.WrongBookSession` (validation, read-only), `AHS.WrongBookGenerator` (only for `MASTERY_LEVELS` enum), `AHS.PersistenceAdapter` (key `"reviewQueue"`). Zero dependency on `WrongBookRuntime`/`ReviewRuntime`. |

## 2. ReviewModel (`js/runtime/ReviewModel.js`, Sprint 7.0 · EO-S7.0-003)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | `AHS.ReviewQueue` (queue entries) + `AHS.WrongBookSession` (record resolution + mastery statistics) — both read-only, its own header states the fixed lineage: `WrongBookSession ─▶ ReviewQueue ─▶ ReviewModel(read-only)`. |
| **Read Path** | `getTodayReview()` (queue entries with non-null `nextReviewAt <= today`, resolved to WrongBook records, unresolvable entries dropped), `getDueReview()` (all non-null-`nextReviewAt` entries, sorted ASC), `getReviewProgress()` (`{todayDue, completed, totalWrong}`, `completed` = mastered count), `getMasteryStatistics()` (`{new, learning, reviewing, mastered}`). All four are pure derivations, recomputed per call, never stored. |
| **Write Path** | `setNextReview(questionId, nextReviewAt)` — the sole Scheduler Foundation hook, routes exclusively through `WrongBookGenerator.update()` + `ReviewQueue.enqueue()` (never touches `WrongBookSession` directly). Confirmed: **called by nothing automatically** in the current repository — a preserved interface for a future Scheduler Sprint, not active production logic. |
| **Identity Mapping** | None of its own — passes `questionId` through unchanged between `ReviewQueue` and `WrongBookSession`, both of which already use the same `LearningQuestionSession` id space. |
| **Runtime Dependency** | `AHS.ReviewQueue`, `AHS.WrongBookSession`, `AHS.WrongBookGenerator` (update path only). Zero dependency on `WrongBookRuntime`/`ReviewRuntime`/`ReviewGeneratorRuntime`. |

## 3. ReviewRuntime (`js/runtime/ReviewRuntime.js`, Sprint 4)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | `AHS.AutoGrader.getGraded(examId)` — Exam Mode's cached grading result. |
| **Read Path** | `build(examId)` — shapes one already-graded exam into a question-by-question review view-model. Nothing else. |
| **Write Path** | None — pure read/shape, never stores anything itself. |
| **Identity Mapping** | `examId`-scoped (Exam Mode's own id space); no relation to `LearningQuestionSession`/`WrongBookSession` ids at all. |
| **Runtime Dependency** | `AHS.AutoGrader` only. |
| **Real usage** | `review.html` loads this file, but `AppReview.js`'s own header states explicitly: *"AHS.ReviewRuntime (build(examId)) is intentionally NOT used on this page — its shape only supports a single already-graded exam's detail view... It remains reserved for Review Session / Review Result."* Confirmed via `grep`: zero call to `AHS.ReviewRuntime.build(` anywhere in production code. It is loaded so the page "initializes correctly" (an explicit, documented Acceptance Criterion from an earlier EO) but is otherwise dormant on this page today. |

## 4. Review Center — `review.html` (`js/pages/AppReview.js` + `ReviewHomeCard.js`/`ReviewQuickAction.js`/`ReviewRecentSession.js`)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | `AHS.HistoryRuntime.list()` (Exam Mode history — 今日已完成/本週完成/Recent Review) and `AHS.WrongBookRuntime.list()` (only to compute a boolean `hasWrongItems` for the 錯題複習 quick action). |
| **Read Path** | `AppReview.js`'s `init()` reads both Runtimes once at page load, derives `{dueToday: 0 (fixed), doneToday, doneWeek}` and `mostRecent`, and passes plain data models into the three presentational components (`ReviewHomeCard`/`ReviewQuickAction`/`ReviewRecentSession` — confirmed via `grep`, none of these three read any Runtime themselves; they are pure `create(model, handlers)` display components). |
| **Write Path** | None — `review.html` is entirely read-only. |
| **Identity Mapping** | None needed — `HistoryRuntime`/`WrongBookRuntime` are both native Exam-mode-shaped and read as-is. |
| **Runtime Dependency** | `AHS.HistoryRuntime`, `AHS.WrongBookRuntime`, `AHS.AutoGrader` (loaded, for `ReviewRuntime`'s benefit, unused). **Confirmed via `grep -n "<script" review.html`: `ReviewQueue.js`, `ReviewModel.js`, `WrongBookSession.js`/`WrongBookGenerator.js`, and `LearningQuestionSession.js` are not loaded on this page at all** — it is structurally impossible for `review.html` to read the Sprint 7.0/AI-015E/F Production chain even if a future change wanted it to; those Runtimes don't exist in its namespace. |

**Real architecture correction to this Sprint's Baseline diagram**: the diagram implies a single `WrongBookRuntime ↓ Review` edge feeding one unified Review layer. In truth, `review.html` (the page literally named "Review") consumes only `HistoryRuntime` (Exam Mode) + a `WrongBookRuntime` boolean check — it has no code path to the `WrongBookSession → ReviewQueue → ReviewModel` chain the Baseline calls "Production."

## 5. Home Widget — `index.html`'s `ReviewWidget.js` (Sprint 7.0 · EO-S7.0-003) — the ONE real Production consumer

| Aspect | Repository Truth |
|---|---|
| **Data Source** | `AHS.ReviewModel.getReviewProgress()` + `.getMasteryStatistics()` — 100% of its data, confirmed in the file's own header comment: *"資料 100% 來自 AHS.ReviewModel（唯讀查詢層）— 不直接讀取任何 Session"*. |
| **Read Path** | `create()` calls both getters fresh on every render — never caches, never stores. |
| **Write Path** | None. |
| **Identity Mapping** | None — consumes `ReviewModel`'s already-shaped output directly. |
| **Runtime Dependency** | `AHS.ReviewModel` only (transitively `ReviewQueue` + `WrongBookSession`). This is the **only** one of the four Review consumers that genuinely sits on the Production chain this Sprint's Baseline describes. |

## 6. Fourth consumer — `materials.html`'s AI Tutor panel via `ReviewGeneratorRuntime` (Sprint 8.2 · EO-S8.2.005)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | Two allowed, both read-only: `AHS.WrongBookSession.list()` (wrong-answer records) and `AHS.QuestionGenerationRuntime.getQuestion(questionId)` (knowledgeNodeId/knowledgeType/difficulty/trace — a WrongBook record alone carries none of these). |
| **Read Path** | `getReview(materialId?)`, `getReviewByMaterial(materialId)`, `getReviewByKnowledgeNode(knowledgeNodeId)` — all read the module's own in-memory `store`. |
| **Write Path** | `generateReview(materialId)` — resolves each WrongBook entry's `questionId` against `QuestionGenerationRuntime.getQuestion(entry.questionId)`; unresolvable entries are skipped, never guessed. |
| **Identity Mapping — real, confirmed gap** | `WrongBookSession` records carry a `LearningQuestionSession`-id-shaped `questionId` (e.g. `lqv1_N`, or a `QuestionGenerator`-assigned `lq_N` via the Sprint AI-015E Identity Mapping). `QuestionGenerationRuntime.getQuestion(id)` searches **only its own `qg_N` id space** (confirmed by reading `QuestionGenerationRuntime.js`'s `nextId()`/`getQuestion()` in full, Sprint AI-015C's own investigation). These two id spaces never overlap. **Every call `qr.getQuestion(entry.questionId)` inside `generateReview()` therefore returns `null` for every real WrongBook entry that exists in this repository**, and the entry is silently skipped (line 121: `if (!question) { return; }`). This is not caused by Sprint AI-015E/F — the mismatch has existed since `ReviewGeneratorRuntime` was built (Sprint 8.2), because `WrongBookSession` has never carried a `QuestionGenerationRuntime`-native id. |
| **Runtime Dependency** | `AHS.WrongBookSession`, `AHS.QuestionGenerationRuntime`. Zero dependency on `WrongBookRuntime`/`ReviewQueue`/`ReviewModel`/`ReviewRuntime`. |
| **Real trigger — confirmed absent** | `grep -rn "AHS.ReviewGeneratorRuntime\."` across the entire repository (excluding the file's own definition and tests) returns **zero production call sites**. `AITutorRuntime.getReviewList(materialId)`'s own comment states explicitly: *"Read-only: never generateReview()."* It only calls `ReviewGeneratorRuntime.getReviewByMaterial()` — a pure read against a `store` nothing ever populates. Consequently `AITutorService.buildLearningContext()`'s `review` field is always `[]` in production, and — confirmed by `grep`ping every `js/components/*.js`/`js/ui/*.js` file for any reference to that field — **no UI component anywhere reads it**. This Review consumer is fully wired at the Runtime layer but has no live trigger and no live display; it is currently inert. |

## 7. Summary diagram (Repository Truth — four independent consumers, not one Production chain)

```
WrongBookGenerator.add() writes WrongBookSession
        │
        ├──▶ ReviewQueue.enqueue() ──▶ ReviewModel(read-only) ──▶ ReviewWidget.js (index.html)
        │       [the ONLY consumer genuinely reading the "WrongBook → Review" Production chain]
        │
        └──▶ ReviewGeneratorRuntime.generateReview(materialId)   [built, wired, NEVER CALLED —
                 resolves WrongBookSession entries against       zero production trigger, and even
                 QuestionGenerationRuntime.getQuestion() —       if called, its id-space mismatch
                 id-space mismatch means every real entry         would silently skip every real
                 would be silently skipped even if this ran]      WrongBook entry — dormant on
                                                                    two independent counts]

review.html (AppReview.js)                    materials.html AI Tutor panel
        │  reads ONLY:                                │  reads getLearningContext().review
        │  - AHS.HistoryRuntime (Exam Mode)            │  → always [] (see above)
        │  - AHS.WrongBookRuntime (boolean check)       │  → no UI component displays it
        │  ZERO code path to WrongBookSession /         ▼
        │  ReviewQueue / ReviewModel — those Runtimes  (inert)
        │  are not even loaded on this page.
        ▼
(Exam Mode history + a wrong-item indicator —
 entirely disconnected from the Sprint 7.0/
 AI-015E/F Production Pipeline)
```
