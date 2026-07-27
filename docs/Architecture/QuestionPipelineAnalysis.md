# QuestionPipelineAnalysis.md — EO-AI-015E-002

Repository Audit answering EO-AI-015E-002's Investigation and Reuse Analysis. Pure documentation — no code touched, no implementation begun. Every claim below is taken from reading `js/parser/QuestionGenerationFlow.js`, `js/runtime/AITutorService.js`, `js/runtime/QuestionGenerationRuntime.js`, `js/runtime/QuestionProviderBridge.js`, `js/ui/MaterialQuestionCard.js` in full, plus `grep` across the repository for real call sites — not inferred from any spec's assumption.

## 1. Investigation — what `QuestionGenerationFlow.run(materialId, difficulty)` actually does

| Responsibility | Real behavior (from source) |
|---|---|
| **Question Generation** | Deterministically builds candidates FROM `AHS.SummaryRuntime`'s already-produced content — `coreConcepts` → `single_choice`, `definitions` → `short_answer` or `true_false`, `pitfalls` → `true_false`, `memorize` → `fill_blank` (falls back to `true_false` when no real segment is blankable). Four question **types** are producible, each mechanically derived from real summary text — never invented. |
| **Session 建立** | Every candidate goes through the triple gate: `LearningQuestionGenerator.generate()` (Interface) → `.validate()` (Schema) → `AHS.LearningQuestionSession.add()` (Runtime, itself re-validates). Dedupe: skips a candidate if the Session already holds one with the same `(materialId, knowledgePoint, questionType, difficulty)`. |
| **Runtime 寫入** | **None.** The file's own header states it explicitly ("never writes to LearningQuestionRuntime or any other Runtime"), confirmed in code — only `AHS.LearningQuestionSession.add()` is called. |
| **Metadata** | `source: {type: "summary_derived", summaryId, reference: "Summary Runtime: " + summaryId}`, `metadata: {mode: "summary_derived", flow: "EO-S6.9-002"}` — a distinct provenance marker from `QuestionProviderBridge`'s Session writes (`source.type: "knowledge_graph"`). |
| **WrongBook Dependency** | None directly in this file. Downstream, `WrongBookGenerator.add()` resolves wrong answers exclusively via `AHS.LearningQuestionSession.getById()` — so any question this flow stores becomes wrong-book-eligible the moment it's in the Session, with no further coupling needed. |
| **Navigation Dependency** | None inside this file — it is a pure function, `run(materialId, difficulty)`, with zero DOM/UI reference. Its only real-world caller today is `QuizCenter.js`'s `showQuestionGuide().onStart()`, itself reached via `summary.html`'s「開始 AI 練習」deep link → `quiz.html?mode=practice&materialId=...` → Question Guide →「開始練習」button (difficulty picker, Ruling 2B — explicit caller-supplied difficulty, never inferred). |

## 2. Reuse Analysis — do `AITutorService.ensureQuestionSet()` + `QuestionProviderBridge` already form a Production Pipeline?

**Structurally, yes, for Generate → Runtime write → Session write** — but **not yet wired together anywhere in production code**, and **not equivalent in product behavior** to what `QuestionGenerationFlow` currently provides. Both gaps are real, not cosmetic.

### 2a. What already works (verified, Sprint AI-015C Part D — 35/35 real jsdom assertions)

```
AITutorService.ensureQuestionSet(materialId)
  → Material → MaterialTextPipeline → KnowledgePipeline (builds graph if absent)
  → QuestionGenerationRuntime.generateQuestions(materialId)   [Generate]

QuestionProviderBridge.bridge(materialId)
  → reads QuestionGenerationRuntime.getQuestionsByMaterial()  [never generates itself]
  → LearningQuestionGenerator.generate() + LearningQuestionSession.add()   [Session write]
  → LearningQuestionRuntime.sync()                                        [Runtime write]
```

Chained in sequence, these two existing, unmodified functions cover the same Generate→Session shape `QuestionGenerationFlow` covers, **plus** the Runtime write `QuestionGenerationFlow` never did.

### 2b. Missing capability #1 — no real caller chains them together

Grepped the entire repository for `QuestionProviderBridge.bridge(` outside of its own file and test scripts: **zero production call sites.** `js/ui/MaterialQuestionCard.js`'s「產生 AI 題目」button calls `AITutorService.ensureQuestionSet()` only — it never calls `QuestionProviderBridge.bridge()`. So today, even on materials.html, generated questions reach `QuestionGenerationRuntime`'s own in-memory store and are displayed there directly by `MaterialQuestionCard.js` — they never reach `LearningQuestionSession` or `LearningQuestionRuntime` in the live app. The entire chain this EO is evaluating has been built and unit-validated (Sprint AI-015C) but has no production trigger anywhere. This is the central, concrete gap — not a Runtime/API gap, a **composition/wiring** gap.

### 2c. Missing capability #2 — different content lineage, real product-behavior change

`QuestionGenerationFlow` sources from `SummaryRuntime` (text-derived: coreConcepts/definitions/pitfalls/memorize) and can produce 4 question types. `QuestionGenerationRuntime` sources from `KnowledgeGraphRuntime` (structural nodes: definition/formula/keyword/concept) and — per its own LOCK rule — produces **`single_choice` only**. Cutting the production pipeline over from one to the other is not purely a plumbing change: it narrows the variety of question forms a student sees. This should be a named, accepted tradeoff in any resolution, not an implementation detail.

### 2d. Missing capability #3 — no caller-supplied difficulty

`QuestionGenerationFlow.run(materialId, difficulty)` requires the caller's explicit difficulty (Ruling 2B) and threads it verbatim into every question — this is what the Question Guide's 3-button difficulty picker drives. `QuestionGenerationRuntime.generateQuestions(materialId)` takes **no difficulty parameter at all** — its `easy`/`medium`/`hard` labels are derived algorithmically per-question (node type, real-distractor availability), never caller-chosen. There is no existing hook in `QuestionGenerationRuntime`/`QuestionProviderBridge`/`AITutorService` that a caller-supplied difficulty could attach to without a Runtime API change (Forbidden this Sprint).

### 2e. Missing capability #4 — Script Wiring footprint if the trigger were to live on quiz.html

`quiz.html`'s current `<script>` list carries none of `MaterialTextPipeline`, `KnowledgePipeline`, `KnowledgeGraphRuntime`, `QuestionGenerationRuntime`, `QuestionProviderBridge`, `AITutorService`, or any `ai-engine/*` file. Reaching `ensureQuestionSet()`/`bridge()` from `quiz.html` directly would require wiring in that entire chain — a materially larger footprint than Sprint AI-015C's 3-tag addition to `materials.html`. If instead the composition trigger stays entirely on `materials.html` (where every dependency is already loaded), `quiz.html` needs **zero** new wiring.

## 3. Conclusion (analysis only — no recommendation is being enacted by this document)

`AITutorService.ensureQuestionSet()` + `QuestionProviderBridge` do **not yet** form a complete, live Production Pipeline. The Runtimes/Interfaces involved are complete and individually correct (no new Runtime is needed; there must not be a second pipeline). What is missing is:

1. A composition step that calls `ensureQuestionSet()` then `bridge()` in sequence, triggered by a real user action — today nothing does this.
2. An explicit, PMO-acknowledged decision on the two real product-behavior changes this causes (§2c, §2d) if `QuestionGenerationFlow`'s Summary-derived, difficulty-aware generation is retired in its favor.
3. A decision on WHERE that composition step is triggered from (materials.html, keeping quiz.html wiring-free and truly read-only vs. quiz.html itself, which would require the large wiring addition in §2e).

No implementation is proposed or begun by this document — see `docs/migration/Sprint_AI_015E_ArchitectureResolution.md` for how this bears on Sprint AI-015E's stalled Part B.
