# WrongBookDependencyAudit.md — Sprint AI-015F Part C

Legacy Dependency Audit. Pure documentation — no code touched, nothing removed, nothing refactored. Every dependency below is grep-verified against real call sites, not inferred.

## 1. `quiz.html` still loads `js/parser/QuestionGenerationFlow.js` — now fully orphaned

| | |
|---|---|
| **File** | `quiz.html` (line 40) |
| **Function** | N/A — a `<script src="js/parser/QuestionGenerationFlow.js">` tag |
| **Dependency** | The file itself, and transitively `AHS.LearningQuestionGenerator` + `AHS.LearningQuestionSession` (which it calls internally at its own line 248, `S.add(candidate)`) |
| **Purpose (historical)** | Sprint 6.9's Practice content generator, sourced from `SummaryRuntime` — this was Quiz's `showQuestionGuide().onStart()` trigger before Sprint AI-015E. |
| **Production impact** | **None today** — confirmed via `grep -rn "QuestionGenerationFlow\.run("` across the entire repository: the only remaining reference to `.run(` is a comment in `QuizCenter.js` documenting its own removal. The file is still parsed and its IIFE still executes on every `quiz.html` load (defining `AHS.QuestionGenerationFlow` in the namespace), but nothing calls `.run()` in production. This is dead-weight script loading, not a functional dependency — flagged, not removed, per this Part's explicit instruction. |

## 2. `LearningPipeline.js`'s `buildQuestions()` still writes Stub content into `LearningQuestionRuntime` on every material upload

| | |
|---|---|
| **File** | `js/parser/LearningPipeline.js` (function `buildQuestions()`, line 124; called from `process()`, line 226) |
| **Function** | `js/components/MaterialCenter.js`'s `runLearningPipeline(materialId)` (line 595), called automatically right after every material is created/uploaded |
| **Dependency** | `AHS.LearningQuestionRuntime.sync({mode: "ai", knowledge: anchoredKnowledge})` (line 136) → internally `AHS.QuestionGenerator.generateAIQuestion()` (Mode B) — the `[Stub]`-prefixed path documented in `js/parser/QuestionGenerator.js`'s own header. |
| **Purpose (historical)** | Sprint 6's one-shot "upload → parse → knowledge → summary → questions" pipeline, narrated to the user via a staged progress UI (`runLearningPipeline`'s own comment: "a paced UI narration of the REAL final outcome"). |
| **Production impact** | **Real and currently active**: `LearningQuestionRuntime` receives a `[Stub]`-prefixed record for (up to) every real Knowledge node on **every material upload**, automatically, with no user action beyond uploading — entirely separate from, and prior to, the Sprint AI-015E Production Pipeline (which only writes when a user explicitly clicks「產生 AI 題目」). Quiz's `isRealLearningQuestion()` filter (unchanged, Sprint AI-015E) correctly hides this Stub content from display, so there is **no display-correctness impact** — but `LearningQuestionRuntime`'s store genuinely grows with Stub entries the Production Pipeline never asked for, and `LearningPipeline.process()`'s question-generation stage runs (and can report "沒有產生任何完整的 Learning Question") on every single upload regardless of whether the student ever visits materials.html's question card at all. This is Repository Truth, not a hypothesis — confirmed via `grep` call-site tracing from `MaterialCenter.js` through to `LearningQuestionRuntime.sync()`. |

## 3. `WrongBookRuntime`'s two real write sources remain both live (Sprint 4 Exam sync + Sprint 7.0 bridge)

| | |
|---|---|
| **File** | `js/pages/AppWrongBook.js` (`bridgeSessionIntoSprint4Runtime()`, line 33) and `js/components/QuizCenter.js` (`finishExam()`, calls `AHS.WrongBookRuntime.sync(graded)` after `AutoGrader.grade()`) |
| **Function** | Both call the same, single `AHS.WrongBookRuntime.sync()` Public API — one from Exam Mode's real grading flow, one from the wrongbook.html page-load bridge described in `docs/Architecture/WrongBookProductionFlow.md` §4. |
| **Dependency** | `AHS.WrongBookRuntime` (LOCK, Sprint 4) as the shared write target; the bridge additionally depends on `AHS.WrongBookSession` + `AHS.LearningQuestionSession` (read-only) to build its `sync()` input. |
| **Purpose** | Exam Mode's sync is the original, unmodified Sprint-4 write path. The bridge (Sprint 7.0 · EO-S7.0-002) is what makes real Practice-mode Wrong Book data visible through the legacy `WrongBook.js` UI component, which — per its own PMO-ruling comment — reads `WrongBookRuntime` exclusively and has never been changed to read `WrongBookSession` directly. |
| **Production impact** | **None negative, by design** — the two write sources use disjoint `questionId` namespaces (Exam-mode `QuestionRuntime` ids vs. `LearningQuestionSession` ids) and `WrongBookRuntime.sync()`'s own `findExisting(questionId)` dedupe means they never collide or overwrite each other's entries. This is a legitimate, still-necessary dependency — not legacy cruft — because `WrongBook.js`'s "Runtime is Source of Truth" ruling has not been revisited by any Sprint since Sprint 7.0. |

## 4. Legacy `LearningQuestionSession` records with no `QuestionProviderBridge` provenance are structurally indistinguishable at read time

| | |
|---|---|
| **File** | `js/runtime/LearningQuestionSession.js` (schema-level; no single call site) |
| **Function** | N/A — this is a schema/provenance observation, not a call-site dependency |
| **Dependency** | `metadata.source`/`source.type` field: Bridge-written records carry `source: {type: "knowledge_graph", ...}` (per `QuestionProviderBridge.buildSessionInput()`); a record written by `QuestionGenerationFlow` (if it were ever invoked again — see §1) would instead carry `source: {type: "summary_derived", ...}`. |
| **Purpose** | Distinguishing real production provenance from the retired Summary-derived path, for any future audit or cleanup Sprint. |
| **Production impact** | **None currently** — since §1 confirms zero live callers of `QuestionGenerationFlow.run()`, every `LearningQuestionSession` record created from this point forward will carry `source.type: "knowledge_graph"`. This entry is documented for completeness (any record already created by a prior test run or a future re-introduction of the old trigger would carry the other `source.type`, and `WrongBookGenerator`/`ReviewQueue`/`ReviewModel` make no distinction between them — they treat every valid Session record identically, real production or legacy alike). |

## Summary

No dependency identified here blocks WrongBook's Production status — WrongBook's own write/read chain (`WrongBookGenerator` ↔ `WrongBookSession` ↔ `ReviewQueue`/`ReviewModel`) has **zero** remaining dependency on any retired path. The dependencies found are all one level upstream, in the Question layer: an orphaned script tag (§1, cosmetic) and a still-active legacy Stub-writer that shares `LearningQuestionRuntime`'s store with the new pipeline without corrupting Quiz's display (§2, real but display-safe). Per this Part's instruction, none of these are removed or refactored here.
