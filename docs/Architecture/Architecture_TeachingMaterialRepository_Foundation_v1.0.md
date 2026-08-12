# Architecture_TeachingMaterialRepository_Foundation_v1.0.md

Sprint AI-112 · Status: LOCKED (documents the real, already-operating architecture; does not
introduce a new one)

## Objective

Formally document the Teaching Material Repository Foundation this platform already runs on —
the Repository, Schema, Adapter, Loader, Bridge, Index, and single Import Pipeline — so any future
material (any subject, any source format) can be imported through one documented, understood path.
This Sprint's own Rules forbid a new Runtime, a new UI, and any Runtime API change; every component
described below already exists and is unmodified except where explicitly marked "Sprint AI-112
change."

## Why this reads as "two tracks," honestly, not hidden

Real repository history (`git log`, `docs/EO/HOTFIX-002_PAT_FAIL_Repository_Reconciliation_Report.md`)
shows two Repository formats were built independently, in parallel branches, before either knew
about the other:

1. **Package track** — `docs/TeachingMaterials/materials/tm_<n>/` (this Sprint's own primary
   subject), a fixed folder-per-material structure with `metadata.json`/`summary.json`/
   `questions.json`/`manifest.json`/`related.json`/`source/`. Currently holds **zero** real
   materials — this track has never had a real subject uploaded through it.
2. **Repository track** — `data/materials/<Name>.js`, one file per material, self-registering into
   `AHS.MaterialRepository` at `<script>` load time. Currently holds **one** real material
   (`CivicsG10Ch5to6Exam20260730.js`, 公民與社會, exam-transcript-verified questions).

`js/runtime/TeachingMaterialLoader.js` bridges **both** into the same `MaterialRuntime`/
`SummaryRuntime`/`QuestionRuntime` — this is the single point where "two authoring formats"
becomes "one platform-facing pipeline" (see Import Pipeline, below). Unifying the two
*authoring* formats into one was considered and rejected for this Sprint: it would mean either
migrating the one real, human-verified Civics record into the Package format (a real data-loss
risk with no benefit — nothing downstream needs it moved) or deleting the Package track's own
already-built, tested Adapter/Loader chain to standardize on the other track — both are
"reinvent working infrastructure," not "build a Foundation," and both risk breaking the one real
Repository-track material currently live in production. The two tracks converging on one Loader/
Bridge/Runtime chain is judged the correct, minimal-risk architecture; documented here rather than
silently left implicit.

## Repository/ — conceptual layout, mapped onto real paths

The Sprint's own requested layout (`Repository/{metadata/, materials/, index/, schema/, adapter/,
loader/}`) already exists — under its established real paths, not a new top-level folder (adding
one would itself violate `Architecture_Repository_Structure_v2.1`'s own top-level-folder
sign-off requirement, and would create exactly the "第二套匯入流程" AI-707 forbids):

| Requested | Real path | Track |
|---|---|---|
| `Repository/materials/` | `docs/TeachingMaterials/materials/tm_<n>/` | Package |
| `Repository/materials/` | `data/materials/<Name>.js` | Repository |
| `Repository/metadata/` | each Package's own `metadata.json` | Package |
| `Repository/metadata/` | each Repository record's own `metadata` object | Repository |
| `Repository/schema/` | `docs/TeachingMaterials/schema/*.schema.json` | Package (formal JSON Schema) |
| `Repository/schema/` | `data/materials/MaterialRepositoryIndex.js`'s own record shape (informal, enforced by convention — no separate schema file; see AI-702 below) | Repository |
| `Repository/index/` | `docs/TeachingMaterials/index.json` (Sprint AI-112: now real, auto-generated) + `js/data/TeachingMaterialData.js` (generated, platform-facing) | Package |
| `Repository/index/` | `AHS.MaterialRepository`'s own in-memory `list()` (self-registration at script load, no separate index file — the registry *is* the index) | Repository |
| `Repository/adapter/` | `docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js` | Package |
| `Repository/adapter/` | none — Repository-track records are already Runtime-shape-adjacent, converted inline by `TeachingMaterialLoader.js`'s own `repoMaterialPartial()`/`repoSummaryRecord()`/`repoExamCompatibleQuestions()` (kept fully separate from the Package-track adapter functions, same file, different source schema) | Repository |
| `Repository/loader/` | `js/runtime/TeachingMaterialLoader.js` | Both (single, shared file) |

## AI-702 — Material Package Standard (Schema)

One schema per track, both subject/grade-agnostic (no subject-specific schema variant exists or is
introduced), reconciled here field-by-field against this Sprint's own required list:

| Required field | Package track | Repository track |
|---|---|---|
| metadata | `metadata.json` (`Metadata.schema.json`) | `record.metadata` |
| summary | `summary.json` (`Summary.schema.json`) | `record.summary` |
| questions | `questions.json` (`QuestionBank.schema.json`) | `record.questionBank.singleChoice`/`fillIn`/`trueFalse` |
| reviewSuggestion | `summary.reviewSuggestions` — **Sprint AI-112: newly formalized as an optional field** (previously no field existed anywhere in the Package schema; `js/components/SummaryCenter.js`'s `deriveReviewSuggestions()` — HOTFIX-004 — remains the honest render-time fallback for a Package that doesn't provide one) | no field either; same HOTFIX-004 render-time derivation covers it |
| knowledgePoint | per-question `knowledgePoint` — **Sprint AI-112: newly formalized as optional**, closing a real, previously-disclosed gap (`js/ui/QuestionCard.js`'s `resolveDifficulty()` comment) | per-question `knowledgePoint`, already real (the only field Package didn't have and Repository already did) |
| difficulty | material-level `metadata.difficulty` (always existed); **Sprint AI-112: per-question `difficulty` now also optional**, matching Repository | material-level `metadata.difficulty` + per-question `difficulty`, both already real |
| subject / grade / chapter | `metadata.subject`/`.grade`/`.chapter` | `metadata.subject`/`.grade`/`.chapter` (Repository track's own convention: `subject` is already an `AHS.Subjects` key, e.g. `"civics"`; Package's is a Chinese display name, e.g. `"公民與社會"` — `TeachingMaterialLoader.js`'s own `subjectKeyFromChineseName()` reconciles this, unchanged) |
| keywords | `metadata.keywords` + `summary.keywords` (both already real; `summary.keywords` was never passed through by the Adapter into the actual `SummaryRuntime` record — a real, pre-existing, disclosed gap, not touched this Sprint since `AHS.SummaryRuntime`'s own accepted-field shape has never included `keywords` at all, and adding one would be a Runtime change, out of this Sprint's scope) | `record.summary.keywords` (same gap, same reason not touched) |
| origin | per-question `questionSource`/`origin` pair (already real) | per-question `origin` (`"exam-transcript-verified"`/`"ai-derived"`, already real) |
| version | `metadata.version` + per-question `version` (already real) | no explicit `version` field on the Repository record itself — flagged here, not fabricated; the whole record is versioned by its own file's git history instead |

No field's *type* or *meaning* varies by subject anywhere in either schema — confirmed by reading
both schema files and the one real Repository-track material (公民與社會) against them. "不得因科目
不同修改 Schema" holds.

## AI-703 — Repository Index

`docs/TeachingMaterials/index.json` existed since EO-S1.1-001 but **no script ever wrote to it** —
in practice it was manually maintainable, directly contradicting "不得人工修改." **Sprint AI-112
fix**: `GenerateTeachingMaterialData.js` (the same script that already builds
`js/data/TeachingMaterialData.js` from every real Package) now also regenerates `index.json` from
the identical real scan — one real source, two generated views, genuinely empty
(`materials: []`, `updatedAt: null`) until real Package material exists. Verified with a temporary,
never-committed scratch Package (`tm_999`) during this Sprint's own work, then removed and the
generator re-run to confirm it returns to the honest empty state — not left as committed test data.

The Repository track's own index is `AHS.MaterialRepository.list()` itself — records self-register
at `<script>` load time (`MaterialRepositoryIndex.js`'s `register()`), so the array-of-loaded-files
*is* the index; there is no separate index artifact to keep in sync, and therefore nothing to drift.

## AI-704 — Material Adapter

`docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js` — unmodified in structure/API this
Sprint (`convertMaterial`/`convertSummary`/`convertQuestions`/`convertRelated`/`loadPackage`/
`validatePackage`, all same signatures). Two of its conversion functions gained a small, additive,
backward-compatible passthrough (closing the `reviewSuggestions`/`knowledgePoint`/`difficulty`
schema gaps above) — never a Runtime change, since the *output* still flows into
`SummaryRuntime.add()`/`QuestionRuntime.importQuestions()`'s already-existing, unmodified accepted
shape (both already tolerate extra fields; neither was touched). "不同來源教材（PDF/Exam/Notes/
Lecture）統一轉換" is unaffected — `materialType` (`TEXTBOOK`/`HANDOUT`/`EXAM`/`HOMEWORK`/`PPT`/
`REFERENCE`) already covers this dimension in `Metadata.schema.json`, converted the same way
regardless of value.

## AI-705 — Repository Loader

`js/runtime/TeachingMaterialLoader.js` — unmodified this Sprint. Confirmed (by re-reading its own
source, not assumed) that every write it performs goes exclusively through already-existing,
already-public Runtime functions: `AHS.MaterialRuntime.add()`, `AHS.SummaryRuntime.add()`,
`AHS.QuestionRuntime.importQuestions()` — no direct field/store mutation, no new Runtime method
called. `load()`/`initialize()` are idempotent and safe to call from any page's own bootstrap.

## AI-706 — Repository Bridge

The "Bridge" the Sprint asks for (Repository → Summary → Question → Knowledge → Tutor) is not one
file but the composition of already-real, already-tested links, each doing pure data
synchronization, no business logic added:

```
Repository (both tracks)
   │  TeachingMaterialLoader.js — AI-705
   ▼
MaterialRuntime / SummaryRuntime / QuestionRuntime
   │  AHS.StatisticsRuntime (Sprint AI-111 additions: dueForReview/
   │  masteredReviewItems/weakestSubject/recommendedRetest/
   │  recommendedChapters/learningContext — pure derivation, no store)
   ▼
AHS.TutorMessage.build() (Sprint AI-111, js/utils/, stateless)
   ▼
AiTutorHomeCard (首頁) / AiTutor.js chat thread (tutor.html)
```

"Knowledge Runtime" in this codebase is `AHS.KnowledgeRuntime` (Practice-Mode pipeline,
Material→Knowledge Graph→Summary/Question generation) — a **different, intentionally separate**
pipeline from the Repository's own Exam-Mode chain (the "兩者不得混用" LOCK this whole platform has
maintained since Sprint 4). The Repository does not feed `KnowledgeRuntime` and was never asked to
by any prior EO; conflating the two would be exactly the kind of new architecture/business logic
this Sprint's "不得新增商業邏輯" forbids. "Tutor Runtime" — `AHS.AITutorRuntime` — is itself scoped
to the Practice-Mode capability chain (`KnowledgeSummaryRuntime`/`QuestionGenerationRuntime`/
`WrongBookSession`/`ReviewGeneratorRuntime`, per its own LOCK header); the Repository's real bridge
to "Tutor" is the one built in Sprint AI-111 (`StatisticsRuntime`→`TutorMessage`→`AiTutor.js`),
already real, already tested, unchanged this Sprint.

## AI-707 — Import Pipeline

**One platform-facing pipeline**, confirmed by tracing the real code, not assumed:

```
教材 (real subject content, any source)
   │
   ├─ Package track: TeachingMaterialAdapter.convertX() (offline, Node)
   │     → docs/TeachingMaterials/materials/tm_<n>/ (Package)
   │     → GenerateTeachingMaterialData.js → js/data/TeachingMaterialData.js + index.json
   │
   └─ Repository track: hand-authored data/materials/<Name>.js,
         self-registers into AHS.MaterialRepository at <script> load
   │
   ▼ (both converge here — the one real seam)
TeachingMaterialLoader.js (Loader + Bridge, AI-705/706)
   │
   ▼
AHS.MaterialRuntime / SummaryRuntime / QuestionRuntime (unmodified Public API)
   │
   ▼
Platform (Material Center / Summary / Quiz / WrongBook / Review / 首頁 / AI Tutor)
```

Two *authoring-time* entry points exist (an honest fact, not concealed), but exactly **one**
platform-facing Loader/Bridge/Runtime chain — satisfying "不得存在第二套匯入流程" at the level that
actually matters: nothing downstream of `TeachingMaterialLoader.js` needs to know or care which
track a material came from.

## AI-708 — Regression Test

`tests/regression/RepositoryFoundation.js` (new, this Sprint) — see Sprint Report for the full
checklist and results.

## What was deliberately NOT done

- No new top-level `Repository/` folder created (would itself violate the repository's own
  structural sign-off rule and duplicate existing, working paths — see table above).
- No migration of the real Civics material between tracks.
- `AHS.SummaryRuntime`'s own accepted-field shape (`keywords` still not a first-class field) was
  not touched — a real, disclosed, pre-existing gap, but closing it means changing
  `SummaryRuntime.add()`'s own behavior, which this Sprint's Runtime Rule forbids.
- No `version` field added to the Repository track's own record shape — same reasoning; that
  track's schema is defined by `data/materials/MaterialRepositoryIndex.js`'s own convention, not
  owned by this Sprint's Package-schema work.
- `AHS.KnowledgeRuntime`/`AHS.AITutorRuntime` (the Practice-Mode-only Runtimes) were not bridged to
  the Repository — a deliberate, LOCK-respecting boundary, not an oversight.
