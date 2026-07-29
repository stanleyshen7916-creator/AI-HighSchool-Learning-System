# ReviewDependencyAudit.md — Sprint AI-015G Part C

Legacy Dependency Audit. Pure documentation — no code touched, nothing removed, nothing refactored. Every dependency below is grep-verified against real call sites.

## 1. `review.html` is entirely disconnected from the WrongBook → ReviewQueue → ReviewModel Production chain

| | |
|---|---|
| **File** | `js/pages/AppReview.js` (`init()`, lines 106-135) |
| **Function** | `init()` reads `AHS.HistoryRuntime.list()` and `AHS.WrongBookRuntime.list()` only |
| **Dependency** | `AHS.HistoryRuntime` (Exam Mode history), `AHS.WrongBookRuntime` (Sprint 4, boolean `hasWrongItems` check only) |
| **Purpose (historical)** | Sprint 5's original Review Home design (`EO-R001A`), predating the entire Sprint 7.0 WrongBook v1.0 track by several sprints — `review.html` was never updated when `WrongBookSession`/`ReviewQueue`/`ReviewModel` were introduced. |
| **Production impact** | **Real and structural, not cosmetic**: `review.html` — the page literally named "Review" — cannot display real Practice-mode wrong-answer/mastery data at all, because `ReviewQueue.js`, `ReviewModel.js`, `WrongBookSession.js`, and `LearningQuestionSession.js` are not even loaded in its `<script>` list (confirmed by `grep`). A student who answers wrong in Quiz and visits `review.html` sees only their Exam Mode history and a generic "you have wrong items" flag — none of the real mastery ladder, priority, or due-review data the Production chain now computes correctly (validated in Part B). This is the single largest finding of this Sprint. |

## 2. `ReviewRuntime.build(examId)` is loaded on `review.html` but has zero real callers

| | |
|---|---|
| **File** | `review.html` (script tag), `js/runtime/ReviewRuntime.js` |
| **Function** | `build(examId)` |
| **Dependency** | `AHS.AutoGrader.getGraded(examId)` |
| **Purpose (historical)** | Sprint 4's Exam Mode review-detail shaper; `AppReview.js`'s own header explicitly documents it as "intentionally NOT used on this page... reserved for Review Session / Review Result" per an earlier PMO ruling. |
| **Production impact** | **None** — confirmed via `grep -rn "AHS.ReviewRuntime.build("` across the repository: zero real call sites (only the file's own definition). Loaded solely so the page "initializes correctly," per a still-standing, explicit Acceptance Criterion from an earlier EO. Not a bug, not urgent — a documented, intentional dormancy. |

## 3. `ReviewGeneratorRuntime` — wired, but with zero production trigger

| | |
|---|---|
| **File** | `js/runtime/AITutorRuntime.js` (`getReviewList()`, line 150) |
| **Function** | `getReviewList(materialId)` — its own comment: *"Read-only: never generateReview()."* |
| **Dependency** | `AHS.ReviewGeneratorRuntime.getReviewByMaterial()` only (a pure read) |
| **Purpose (historical)** | Sprint 8.2's Material AI review panel — feeds `AITutorService.buildLearningContext().review`. |
| **Production impact** | **Real**: `grep -rn "AHS.ReviewGeneratorRuntime\."` across the entire repository (excluding its own file and tests) confirms **zero production caller of `generateReview()`** — the function that would actually populate this Runtime's `store`. `getReviewList()` therefore always returns `[]` in production (empirically confirmed, Part B-4). Additionally confirmed by grepping every `js/components/*.js`/`js/ui/*.js` file: **no UI component anywhere reads `getLearningContext().review`** — so even a hypothetical future trigger firing `generateReview()` would have no visible destination without further UI work. This dependency is fully built, fully wired at the Runtime layer, and completely inert end-to-end. |

## 4. `ReviewGeneratorRuntime.generateReview()`'s id-space mismatch (independent of §3, would block even a wired trigger)

| | |
|---|---|
| **File** | `js/runtime/ReviewGeneratorRuntime.js` (`generateReview()`, line 104; specifically `qr.getQuestion(entry.questionId)`, line 120) |
| **Function** | `generateReview(materialId)` |
| **Dependency** | `AHS.QuestionGenerationRuntime.getQuestion(id)` — searches only that Runtime's own `qg_<n>` id space |
| **Purpose (historical)** | Resolving a WrongBook entry's `knowledgeType`/`knowledgeNodeId`/`difficulty` from the Quiz/Exam Result, per the EO's fixed two-source rule. |
| **Production impact** | **Real and confirmed empirically (Part B-4)**: `WrongBookSession` entries always carry a `LearningQuestionSession`-shaped `questionId` (`lqv1_<n>` or, via `QuestionGenerator`, `lq_<n>`) — never a `QuestionGenerationRuntime`-native `qg_<n>` id. `QuestionGenerationRuntime.getQuestion()` therefore returns `null` for every real WrongBook entry that can exist in this repository, and `generateReview()`'s own code silently skips it (`if (!question) { return; }`) — confirmed by directly invoking `generateReview()` in Part B-4 and observing it return `null` even against a freshly-created, real WrongBook entry. This predates Sprint AI-015E/F entirely — the mismatch has existed since `ReviewGeneratorRuntime` was built (Sprint 8.2), because `WrongBookSession` has never carried a `QuestionGenerationRuntime`-native id in any Sprint. Resolving it would require either changing what id `WrongBookGenerator`/`QuizCenter.js` supply (a `LearningQuestionRuntime`/`LearningQuestionSession` Public API or Identity Mapping change) or changing `ReviewGeneratorRuntime`'s resolution source — **both are LOCK Runtime API changes**, out of this Sprint's scope per its own Forbidden list. |

## Summary

The Production chain itself (`WrongBookGenerator → WrongBookSession → ReviewQueue → ReviewModel → ReviewWidget`, `index.html`) has **zero** remaining Legacy dependency — Part B confirms it works correctly end-to-end. Every dependency found in this audit sits in the *other three* Review consumers: `review.html` never connected to the chain at all (§1, structural, largest finding), `ReviewRuntime` intentionally dormant (§2, documented, not a gap), and `ReviewGeneratorRuntime` doubly inert — no trigger (§3) and, even if triggered, an id-space mismatch that would still produce nothing (§4). None are removed or refactored here, per this Part's explicit instruction.
