# QuestionProviderBridgeMapping.md — Sprint AI-015C Part A

Repository Audit / Mapping Table for the `QuestionGenerationRuntime → Question Provider Bridge → LearningQuestionSession / LearningQuestionRuntime` integration. Pure documentation — no Runtime modified. All shapes below are taken directly from reading the five source files in full (`js/runtime/QuestionGenerationRuntime.js`, `js/parser/LearningQuestionGenerator.js`, `js/runtime/LearningQuestionSession.js`, `js/runtime/LearningQuestionRuntime.js`, `js/parser/QuestionGenerator.js`) plus `js/runtime/KnowledgeGraphRuntime.js` and every root HTML page's real `<script>` list — not inferred from names.

## 1. Source shape — `QuestionGenerationRuntime.generateQuestions(materialId)`

Stored/returned record: `{materialId, generatedAt, questions: [...]}`. Each question:

```
{ id, knowledgeNodeId, knowledgeType (definition|formula|keyword|concept),
  type: "single_choice", difficulty (easy|medium|hard),
  question, options: [], answer, explanation (STRING), traceability }
```

## 2. Target A — `LearningQuestionSession` (via `LearningQuestionGenerator.generate()` → Schema v1.0 → `LearningQuestionSession.add()`)

| Schema v1.0 field | Source | Notes |
|---|---|---|
| `id` | omit | `LearningQuestionGenerator.generate()` auto-assigns `lqv1_<n>` |
| `materialId` | `record.materialId` | pass through |
| `subject`/`grade`/`chapter`/`section` | `AHS.MaterialRuntime.getById(materialId)` | CONTENT_TYPE KG nodes carry no subject/grade/chapter themselves |
| `knowledgePoint` | `AHS.KnowledgeGraphRuntime.getNode(q.knowledgeNodeId)`'s `content \|\| label` | real KG node text, not invented |
| `difficulty` | `q.difficulty` | pass through |
| `questionType` | `q.type` | pass through (`single_choice` satisfies v1.0's enum) |
| `question`/`options`/`answer` | `q.question`/`q.options`/`q.answer` | pass through |
| `explanation` | `q.explanation` | already a string in QuestionGenerationRuntime — matches v1.0's string expectation directly, no reshaping |
| `reference` | constructed | `"Knowledge Graph node " + q.knowledgeNodeId` |
| `learningObjective` | templated | `"能理解並應用「" + nodeText + "」的相關內容"` — same honest-templating style already used elsewhere in this codebase |
| `relatedConcepts` | `[]` | honestly empty; v1.0's `validate()` does not require non-empty |
| `source` | `{type: "knowledge_graph", knowledgeNodeId: q.knowledgeNodeId}` | |
| `traceability` | `{materialId, knowledgeId: q.knowledgeNodeId, summaryId: null}` | v1.0 requires `materialId`+`knowledgeId` present — both real |
| `metadata` | `{sourceQuestionId: q.id, generatedAt: record.generatedAt}` | provenance only |
| `createdAt` | omit | `generate()` auto-fills |

## 3. Target B — `LearningQuestionRuntime` (via `LearningQuestionRuntime.sync(input)` → `QuestionGenerator.generate({mode: "original", ...})`)

`mode: "original"` is required — `QuestionGenerationRuntime` content is real, so Mode A (`generateOriginalQuestion`, "caller supplies real content, packages it, never invents") is the correct path. Mode B (`mode: "ai"`) would incorrectly route through the `[Stub]`-producing generator.

| `QuestionGenerator` Mode A input field | Source |
|---|---|
| `mode` | `"original"` (fixed) |
| `question`/`answer`/`options`/`questionType`/`difficulty` | pass through from `q` |
| `knowledge` | `{id: q.knowledgeNodeId, materialId, subject, grade, chapter, section, concepts: [nodeText]}` — supplying this lets `generateFromKnowledge()` auto-derive `concept`/`conceptId`/`knowledgePoint`/`learningObjective` via its own existing, unmodified logic |
| `explanation` | `{whyCorrect: q.explanation}` — real content in the one dimension available; other dimensions fall back to `[Stub]` per this file's own pre-existing, documented "Explanation Rules" allowance, not a Bridge invention |
| `reference` | same knowledge-graph reference string as Target A |
| (relatedConcepts) | auto-derived by `buildRelatedConcepts()` from `input.knowledge.concepts` — no Bridge logic needed |

Both targets are reached exclusively through existing, unmodified Public API functions. The Bridge's own code is limited to: (1) read-only lookups against `QuestionGenerationRuntime`, `AHS.MaterialRuntime.getById()`, `AHS.KnowledgeGraphRuntime.getNode()`; (2) constructing the two `input` shapes above; (3) calling `LearningQuestionGenerator.generate()` + `LearningQuestionSession.add()`, and `LearningQuestionRuntime.sync()`. No generation, validation, or session logic of its own — pure Shape Mapping, per the Sprint's Architecture Rules.

## 4. Real architecture conflict found — Script Wiring gap (Stop Condition candidate)

Verified via `grep -n "<script" materials.html quiz.html`:

**`materials.html`** (host of the Bridge's read source, `QuestionGenerationRuntime`) loads: `MaterialRuntime.js`, `QuestionGenerator.js` (old, Sprint 6), `LearningQuestionRuntime.js`, `KnowledgeGraphRuntime.js`, `QuestionGenerationRuntime.js`. It does **NOT** load `js/parser/LearningQuestionGenerator.js` or `js/runtime/LearningQuestionSession.js`.

**`quiz.html`** loads `LearningQuestionRuntime.js`, `LearningQuestionGenerator.js`, `LearningQuestionSession.js`. It does **NOT** load `QuestionGenerationRuntime.js`, `KnowledgeGraphRuntime.js`, or `QuestionGenerator.js` (old).

Consequence: if the Bridge runs where its read source (`QuestionGenerationRuntime`) actually lives — `materials.html` — then:

- **Target B (`LearningQuestionRuntime.sync()`)** works today, no wiring change needed: `QuestionGenerator.js` is already loaded on `materials.html`, and `sync()`'s internal guard (`if (!AHS.QuestionGenerator...)`, line 139) would pass.
- **Target A (`LearningQuestionSession.add()`)** cannot work today: neither `LearningQuestionSession.js` nor its validation dependency `LearningQuestionGenerator.js` is loaded on `materials.html`. `LearningQuestionSession.add()`'s own defensive guard (line 72: `if (!AHS.LearningQuestionGenerator...) return null`) confirms this fails safe (silent `null`, no crash) rather than throwing — but the Bridge would silently produce zero Session writes, which is a real functional gap, not a cosmetic one.

The Sprint AI-015C spec's stated Baseline ("`QuestionGenerationRuntime`與`LearningQuestionSession`/`LearningQuestionRuntime` 已存在，缺一座橋") assumes both write targets are already reachable from the read source's page. That assumption does not hold — reaching Target A requires adding two `<script>` tags to `materials.html`, a Script Wiring change in the same shape as EO-AI-012A in the AI Summary track, but not explicitly listed in this Sprint's Development Parts A–F or Deliverables.

This is reported per the Sprint's own Stop Condition (1), Repository 真實架構衝突, before any Part B/C code is written.
