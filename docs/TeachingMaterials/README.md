# Teaching Material Repository — EO-S1.1-001 v1.1 + EO-S1.1-002 v1.0 + EO-S1.1-002A v1.0 + EO-S1.1-003 v1.0 + EO-S1.2-001 (Revision) v1.0 + Sprint v1.4 + Sprint v1.6 + HOTFIX-002 + Sprint AI-113 AI-806/807 + Sprint AI-115

Status: **LOCKED** (schema/workflow) ｜ Owner: Project Owner ｜ Analysis Engine: Claude

> **HOTFIX-002 note**: `origin/main` also contains a second, independently-built Teaching
> Material Repository at `data/materials/` (`AHS.MaterialRepository`, defined in
> `MaterialRepositoryIndex.js`) from a different branch, holding one real material
> (`CivicsG10Ch5to6Exam20260730.js`). It uses a different schema and predates no coordination
> with this directory. `js/runtime/TeachingMaterialLoader.js` now bridges **both** — this
> directory's own Package format (below) and that one — into the same Runtimes side by side.
> See `docs/EO/HOTFIX-002_PAT_FAIL_Repository_Reconciliation_Report.md` for the full story.
> Nothing below this note describes that other Repository; it describes only this one.

This directory is the Teaching Material Repository — the permanent, Git-versioned Source
of Truth for teaching material analysis results, per EO-S1.1-001 v1.1 (established this
Repository), EO-S1.1-002 v1.0 (exact Metadata schema, question provenance, Import Rule,
per-material Git commit format), EO-S1.1-002A v1.0 (Question Source Rule refinement:
`questionSource`/`origin` pairing, OCR-uncertainty handling), and EO-S1.1-003 v1.0
(**Teaching Material Package Standard** — formalizes each material's folder as a self-
contained Package: adds `source/` (the original uploaded files) and `manifest.json`,
`materialType`, a third question source `TEACHER_CREATED`, page-accurate `questionNumber`/
`page`, `ocrConfidence`, and the Original Question Rule for exam materials). EO-S1.1-003's
own explicit Runtime Rule — "本 EO：不得修改 Material/Quiz/WrongBook/Dashboard/AI Tutor
Runtime。僅建立 Material Package Standard" — and its Acceptance clause's own wording
("所有 Runtime **後續**直接讀取 Package", i.e. *subsequently*) settle a question EO-S1.1-002A
had left ambiguous: its Quiz Center/AI Tutor display rules are a **Display Contract for a
future Runtime to implement**, not a build-it-now instruction. See the dedicated section
below. This directory exists alongside, not inside, `js/`/`css/`/the app's Runtime layer:
nothing here is loaded by any `<script>` tag, and no existing Runtime has been modified to
read it (per all four EOs' Runtime Rule). Wiring a real loader is explicit future scope, not
any of these EOs'.

## Two decisions made without an explicit answer from Project Owner (flagged, not hidden)

1. **Placement**: nested under `docs/TeachingMaterials/` rather than a new top-level
   folder. `Architecture_Repository_Structure_vNext.md` (the AI-104A Baseline, still
   governing) states no new top-level folder is authorized without PMO sign-off through
   that document; `docs/` is already a sanctioned, versioned container, so this satisfies
   EO-S1.1-001's own "Git Version Control / 可追蹤 / 可修改 / 可回復" requirement without
   opening a new structural question. Trivially relocatable later if Project Owner wants a
   top-level folder instead.
2. **Release gate**: Sprint AI-108 closed with "no new feature planning until v1.0.0
   Release Approval is granted." This EO's own re-issued `Status: LOCKED` (v1.1, issued
   after that gate was raised as a concern) is treated as Project Owner's authorization to
   proceed despite the gate. `docs/PMO/SPRINT.json` is updated to record this explicitly.

## Current state: capability, not content

Per this EO's own Development Scope ("目前階段：建立教材分析能力。不是建立教材內容。
Repository 初始可為空。"): this Repository currently holds **zero real teaching
materials**. `index.json` is an empty manifest; `materials/` is an empty, structural
directory (`.gitkeep`, matching this repository's own existing convention for `platform/`/
`shared/`). Nothing here is fabricated, placeholder, or demo content — per this EO's own
explicit prohibitions ("不得建立 MockData／不得建立 Demo Data／不得建立 Placeholder／
不得未經提供即分析不存在之教材"). The schema below is ready to receive real material the
moment Project Owner uploads it.

## Directory layout (per material, once real material arrives) — EO-S1.1-003 Package Standard

```
docs/TeachingMaterials/
  README.md              — this file
  index.json             — the single, auto-generated Knowledge Index: one real entry per
                            IMPORTED material (empty for now). "建立唯一 Index" (AI-115-03) —
                            never a second index, never hand-edited (only ever written by
                            GenerateTeachingMaterialData.js's writeIndex()).
  import-log.json        — NEW, Sprint AI-115 AI-115-08: git-tracked Import History, one
                            entry per Package ImportManager.js has ever attempted to import
                            ({time, materialId, version, result, error}). Absent until the
                            first real import.
  schema/                — JSON Schema definitions for the five record types below
    Metadata.schema.json
    Manifest.schema.json  — Sprint AI-115: gained an optional `archived` boolean (the
                            ARCHIVED Lifecycle Stage's only real signal)
    Summary.schema.json
    QuestionBank.schema.json
    RelatedMaterials.schema.json
  scripts/
    ValidateMaterial.js  — EO-S1.1-002 QA's "JSON Schema 合法" check, made runnable:
                            node docs/TeachingMaterials/scripts/ValidateMaterial.js <materialId>
    TeachingMaterialAdapter.js  — NEW, EO-S1.2-001 (Revision): pure data-shape converter,
                            Package -> MaterialRuntime/SummaryRuntime/QuestionRuntime-accepted
                            objects. See dedicated section below.
    GenerateTeachingMaterialData.js  — Sprint v1.4: offline generator, Repository ->
                            js/data/TeachingMaterialData.js. See "Runtime Wiring" below.
    MaterialLifecycle.js  — Sprint AI-113 AI-806, re-defined Sprint AI-115 AI-115-01: real
                            6-stage Lifecycle Stage resolver (RAW / ANALYZING / CLAUDE_READY /
                            READY_FOR_IMPORT / IMPORTED / ARCHIVED), computed from real files
                            on disk + index.json, never a hand-maintained field. See "Material
                            Lifecycle" below.
    RepositoryManager.js  — NEW, Sprint AI-115 AI-115-03: scans every Package, checks
                            duplicates/versions/statuses, and is the only path that advances
                            CLAUDE_READY -> READY_FOR_IMPORT (prepare(), deriving
                            knowledge.json/report.md) or rebuilds index.json (rebuildIndex(),
                            delegates to GenerateTeachingMaterialData.js — no second writer).
    ImportManager.js      — NEW, Sprint AI-115 AI-115-04/05/06/08/09: the sole Import Flow.
                            Validates (AI-115-05) and duplicate-checks (AI-115-06) every
                            READY_FOR_IMPORT Package before letting it become IMPORTED, logs
                            every attempt to import-log.json (AI-115-08), and rolls back
                            (AI-115-09) every generated file to its pre-import content if the
                            write fails partway.
  materials/
    <materialId>/         — one self-contained Package per material, materialId = tm_<seq>
      source/              — the ORIGINAL uploaded file(s), byte-identical, original filenames,
                              never modified/recompressed/renamed (EO-S1.1-003 Package Structure)
      metadata.json
      manifest.json         — EO-S1.1-003: package bookkeeping, distinct from metadata.json
      material.md            — NEW, Sprint AI-115 AI-115-02: Claude-authored, human-readable
                              rendering of this Package's content. A real authored input, like
                              metadata.json — never generated, its absence/emptiness is a real
                              ValidateMaterial.js FAIL.
      summary.json
      questionbank.json      — Sprint AI-115 AI-115-02: renamed from `questions.json`, aligning
                              the file name with its own schema file's name
                              (QuestionBank.schema.json), which already used this name. Renamed
                              while the Repository was still genuinely empty — no real Package
                              data needed migration.
      related.json
      knowledge.json        — Sprint AI-113 AI-807, now derived by RepositoryManager.js's
                              prepare() (previously GenerateTeachingMaterialData.js directly)
                              from this Package's own summary.json/questionbank.json — never
                              hand-authored, never a second source of truth. Present once this
                              Package has reached READY_FOR_IMPORT or later.
      report.md              — Sprint AI-113 AI-807, same "generated, not authored" rule and
                              same AI-115 mover (RepositoryManager.js's prepare()) as
                              knowledge.json.
```

## Material Lifecycle (Sprint AI-113 AI-806, re-defined Sprint AI-115 AI-115-01)

`AHS.平台可以直接辨識教材目前狀態` — every Package is always in exactly one of these real,
computable stages (`scripts/MaterialLifecycle.js`'s `resolveStage(materialId)`, a single
if/else chain — structurally incapable of reporting two stages for the same Package at once,
which is what AI-115-01's "所有教材必須只有一個生命週期" actually requires):

| Stage | Real, checkable condition |
|---|---|
| `RAW` | Package folder exists, `metadata.json` missing |
| `ANALYZING` | `metadata.json` exists, but `manifest.json` is missing/`status === "draft"`, or `summary.json`/`questionbank.json`/`material.md` are missing |
| `CLAUDE_READY` | `manifest.status` is `"complete"` or `"pending_review"` and every Package Standard input file (AI-115-02) is present, but `knowledge.json`/`report.md` haven't been derived yet |
| `READY_FOR_IMPORT` | `knowledge.json`/`report.md` exist (`RepositoryManager.js`'s `prepare()` has run), but this Package isn't in the current `index.json` yet |
| `IMPORTED` | Present in the current, auto-generated `index.json` (same real data `js/data/TeachingMaterialData.js` carries) — `ImportManager.js`'s `importAll()` has included it |
| `ARCHIVED` | `manifest.json`'s own `archived: true` flag is set — the only real signal used, never inferred from age/usage |

Whether an `IMPORTED` Package is also genuinely bridged into the live browser
`AHS.MaterialRuntime` is **not decidable from this offline Node tooling**; it can only be
observed in a browser. `tests/regression/RepositoryFoundation.js`'s own checks, and Sprint
AI-115's own `tests/regression/MaterialPipelineRegression.js`, are that confirmation (Loader →
Runtime → Material Center/Summary/Quiz/WrongBook/Review/Tutor, all real). `IMPORTED` is this
tooling's own honest maximum — never a fabricated further state.

Per EO-S1.1-003's own Objective: this Package (not `js/data/MockData.js`, not any other
format) is meant to become the single, common data source for Material Center, Quiz Center,
Wrong Book, Dashboard, and AI Tutor once wired — "不得建立其他教材格式" (no other teaching
material format may be created).

## Record schemas

### Metadata

**EO-S1.1-002's exact 11-field list** (camelCase, supersedes EO-S1.1-001's initial reuse of
`MetadataParser.js`'s PascalCase field names — that set described a different context, the
raw `Metadata.json` import file, not this Repository's own schema), **plus EO-S1.1-003's
`materialType`**: `materialId`, `subject`, `grade`, `publisher`, `chapter`, `unit`,
`keywords`, `difficulty`, `source`, `uploadDate`, `version`, `materialType`. Every field
always present; unknown values `null`/`[]`, never guessed. See `schema/Metadata.schema.json`.

| Field | Notes |
|---|---|
| `subject` | the real Chinese display name, e.g. `數學`/`國文` (matches `AHS.Subjects[key].name` — this Package track's own convention, confirmed and corrected by Sprint AI-115's `tests/regression/MaterialPipelineRegression.js`; **not** the internal key like `math`, which is the *other*, separate `data/materials/` Repository track's own different convention — see `js/runtime/TeachingMaterialLoader.js`'s `subjectKeyFromChineseName()`) |
| `grade` | `高一`/`高二`/`高三` |
| `keywords` | array of strings |
| `source` | e.g. `教師補充教材`/`教科書`/`考卷`/`講義` — the material's real origin, never guessed |
| `uploadDate` | when Project Owner provided it, not when it was originally published |
| `version` | starts `"1"`; incremented when Existing Material is updated (see Import Rule) |
| `materialType` | **EO-S1.1-003**: `TEXTBOOK` \| `HANDOUT` \| `EXAM` \| `HOMEWORK` \| `PPT` \| `REFERENCE`. `EXAM` triggers the Original Question Rule below. |
| `publisher`, `chapter`, `unit`, `difficulty` | defensive defaults (`null`), never fabricated |

### Manifest (EO-S1.1-003, new)

Package-level bookkeeping, separate from `metadata.json`'s subject-matter fields:
`packageVersion`, `createdDate`, `updatedDate`, `repositoryVersion`, `analysisEngine`,
`status`. See `schema/Manifest.schema.json`.

**Two judgment calls — this EO names the fields but not their exact allowed values, flagged
here rather than decided silently:**

- `status` enum (`draft` | `pending_review` | `complete`): `draft` while Claude is still
  analyzing; `pending_review` when at least one question has `needsReview: true` (OCR
  confidence below threshold) — per the OCR Rule, such a package is **not yet the official
  Repository entry** until resolved; `complete` once every question is resolved.
- `analysisEngine` is a fixed single allowed value, `"Claude"` — the only honest value given
  every EO in this track's "no AI API" constraint and Claude's own "Analysis Engine" role.

### Source Files (EO-S1.1-003, new)

`materials/<materialId>/source/` holds Project Owner's original uploaded file(s) exactly as
provided — PDF/PPT/DOCX/JPG/PNG/scanned files. **不得修改原始教材／不得重新壓縮／不得重新
命名內容**: never edited, never recompressed, original filenames kept. This is the actual
source of truth a human (or a future OCR/verification step) can always check any transcribed
`questionbank.json` entry against.

### Summary

`核心概念` (core concepts), `定義` (definitions), `關鍵字` (keywords), `重點整理` (key
points), `易錯觀念` (common misconceptions) — each an array of strings, empty until real
material is analyzed. See `schema/Summary.schema.json`.

### Question Bank

At minimum `單選題` (single choice), `是非題` (true/false), `填充題` (fill-in-the-blank);
`計算題` (calculation) and `申論題` (essay) added only when the source material's own
content genuinely supports them (never invented to pad variety). Every question carries a
`questionId` (renamed from the earlier `id`), `materialId`, and **EO-S1.1-003**'s
`questionNumber` (the question's real number/label in the source material, e.g. `"1"` or
`"3-b"` — never renumbered) and flat `page` (replacing the earlier nested `source` object,
which only ever carried `materialId`/`page` — both now flat, avoiding duplication;
`section` survives as an optional, non-required continuity field for extra traceability).

**Question Source Rule (EO-S1.1-002A, extended by EO-S1.1-003)** — every question carries
both `questionSource` and `origin`, which must pair consistently — enforced by
`scripts/ValidateMaterial.js`, since plain JSON Schema draft-07 can't express that pairing
without more machinery than this Repository's hand-rolled validator carries:

| `questionSource` | `origin` | Applies to |
|---|---|---|
| `ORIGINAL` | `Uploaded Material` | 段考/模擬考/歷屆試題/教師試卷/作業/課本習題 — copied verbatim, no rewriting/simplifying/reorganizing/polishing/AI correction |
| `AI_GENERATED` | `AI` | A question Claude derived from the material's real content |
| `TEACHER_CREATED` | `Teacher` | Authored by a teacher, provided as such by Project Owner — **the `Teacher` origin value is Claude's own judgment call**: EO-S1.1-003 names `TEACHER_CREATED` as a `questionSource` value but doesn't state its paired `origin` value; flagged here rather than decided silently |

**OCR Rule (EO-S1.1-003)** — `ORIGINAL` questions additionally require `ocrConfidence`
(0–1) and `needsReview` (explicit `true`/`false`, never omitted); both fields must be
*absent* on `AI_GENERATED`/`TEACHER_CREATED` questions (the concept doesn't apply). If
`ocrConfidence < 0.90`, `needsReview` must be `true` — Claude must never guess/self-complete
uncertain transcription, and per the Manifest's own `status` field, a package with any such
question is not `complete` until a human resolves it.

**Original Question Rule (EO-S1.1-003)** — when `metadata.json`'s `materialType` is
`EXAM`, every question in that material must be `questionSource: "ORIGINAL"` (100% content
preservation — 題號/題幹/選項/圖片/表格/標點/版面順序 all kept exactly as in the source;
no summarizing, rewriting, or AI optimization). Enforced cross-file by
`scripts/ValidateMaterial.js` (checks `metadata.json`'s `materialType` against every entry
in `questionbank.json`).

See `schema/QuestionBank.schema.json`.

### Related Materials

Links to other `materialId`s already in this Repository that cover the same knowledge —
established only when a genuine overlap is found during analysis, never speculatively.
"不得重複建立教材" — an existing, closely-related material is linked, not duplicated. See
`schema/RelatedMaterials.schema.json`.

## Import Rule (EO-S1.1-002) — New / Existing / Related classification

Before analyzing a newly-uploaded material, check it against `index.json`'s existing
entries:

- **New Material**: no existing entry matches → assign the next `materialId` (`tm_<seq>`),
  `version: "1"`.
- **Existing Material**: an entry matches → update that same `materialId`'s files in place
  (never create a second `materialId` for the same material), increment `version`. **Match
  rule (a judgment call — this EO doesn't specify one, flagged here rather than decided
  silently)**: same `subject` + `chapter` + `unit` **and** the same original filename (or,
  for a rescanned paper document with no stable filename, a title/heading match Claude
  confirms is the same physical material) — deliberately conservative, so two genuinely
  different materials that merely share a chapter are never wrongly merged.
- **Related Material**: doesn't match closely enough to be "the same material" but covers
  the same chapter/unit as an existing entry → link both ways via `related.json`, per the
  Related Materials schema above. Never create a duplicate `materialId` for something that
  should instead be a Related Material link.

## Git Rule (EO-S1.1-002)

Every material-import commit (New or Existing) uses exactly this message format:
`feat(material): import {materialId}` — e.g. `feat(material): import tm_1`. This is
intentionally different from this repository's own Sprint/EO-label commit convention
(`docs/PMO/PMO_Commit_Message_Rule_v1.0.md` / observed practice) — EO-S1.1-002 LOCKs this
exact format specifically for per-material import commits; infrastructure/schema changes to
this Repository itself (like this README, the schemas, or the validator script) still use
the repository's normal Sprint/EO-label commit convention.

## Workflow (per EO-S1.1-001 v1.1 + EO-S1.1-002 v1.0 + EO-S1.1-003 v1.0)

```
Project Owner uploads real material (PDF/PPT/DOCX/JPG/PNG/掃描講義/考卷/課本/教師補充資料;
  one or several at once)
  → Claude receives it, classifies New / Existing / Related (Import Rule above)
  → source/ populated with the original file(s), byte-identical, original filenames
  → Claude analyzes it (OCR if needed — no AI API, per "不使用任何 API"); for materialType
    = EXAM, every question extracted as ORIGINAL with 100% content preservation
  → Metadata (incl. materialType) / manifest.json / material.md / Summary / Question Bank
    (source+origin tagged, ocrConfidence/needsReview set honestly) / Related Materials built
    → Package reaches CLAUDE_READY (Material Lifecycle above)
  → materials/<materialId>/* + source/ written
  → QA checklist (below) confirmed, including node scripts/ValidateMaterial.js <materialId>
  → node scripts/RepositoryManager.js  (NEW, Sprint AI-115 — prepare() derives
    knowledge.json/report.md, Package reaches READY_FOR_IMPORT)
  → node scripts/ImportManager.js  (NEW, Sprint AI-115 — the sole Import Flow: validates
    (AI-115-05) + duplicate-checks (AI-115-06) this Package, then regenerates
    js/data/TeachingMaterialData.js/index.json so the running app can actually see this
    material — Package reaches IMPORTED; rolls back (AI-115-09) and logs the failure
    (import-log.json, AI-115-08) instead if anything goes wrong; see "Runtime Wiring" and
    "Repository Manager / Import Manager" sections below)
  → git commit -m "feat(material): import <materialId>"
  → git push
```

## QA Checklist (run per material, once real analysis begins)

- [ ] Metadata complete (every field present incl. `materialType`; unknowns `null`/`[]`,
      never guessed)
- [ ] `manifest.json` written (`status` accurately reflects whether any question still
      needs review)
- [ ] `source/` populated with the real, unmodified original file(s)
- [ ] Summary complete
- [ ] Question Bank built (≥ 單選/是非/填充; 計算/申論 only where the material supports
      them; every question's `questionSource`/`origin` pair set and consistent;
      `ocrConfidence`/`needsReview` set honestly on every ORIGINAL question, absent on
      AI_GENERATED/TEACHER_CREATED; if `materialType = EXAM`, every question is ORIGINAL)
- [ ] Related Materials checked (linked if genuine overlap found; never duplicated)
- [ ] Repository updated (`index.json`, and `materials/<materialId>/*` — new Package for
      New Material, same Package updated in place for Existing Material)
- [ ] **JSON Schema 合法**: `node docs/TeachingMaterials/scripts/ValidateMaterial.js
      <materialId>` — all records + Question Source Rule + Original Question Rule +
      `source/` checks PASS
- [ ] **NEW, Sprint v1.4**: `node docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js`
      run and its output (`js/data/TeachingMaterialData.js`) committed — otherwise the
      Repository is still schema-valid but invisible to the running app (see "Runtime
      Wiring" below)
- [ ] `npm run verify` / `npm test` still PASS
- [ ] Git commit (`feat(material): import <materialId>`)
- [ ] Git push

## Display Contract for a future Runtime (EO-S1.1-002A + EO-S1.1-003) — NOT implemented yet

Both EO-S1.1-002A and EO-S1.1-003 specify how a question's source should eventually be
shown across the live app. EO-S1.1-003's own explicit Runtime Rule — "不得修改 Material/
Quiz/WrongBook/Dashboard/AI Tutor Runtime。僅建立 Material Package Standard" — and its
Acceptance clause's "所有 Runtime **後續**直接讀取 Package" settle how to read these
sections: as a **contract for a future Runtime to implement**, not an instruction to build
UI/Runtime code now. (This also resolves EO-S1.1-002A's own ambiguity on this exact point,
noted in `docs/EO/EO_S1.1-002A_Report.md` at the time — it didn't repeat the "no Runtime/UI"
constraint the way EO-S1.1-001/002 had, and this reads that silence as an oversight EO-S1.1-
003 corrects, not a standing request to build it after all.)

**Quiz Center Display Rule**: every question shows its source badge —
`questionSource: ORIGINAL` → 📄 上傳教材, `AI_GENERATED` → 🤖 AI 模擬試題,
`TEACHER_CREATED` → 👨‍🏫 教師題目. Never hidden. Plus a source filter (全部／上傳教材／
AI 模擬試題／— a fourth 教師題目 option follows naturally once `TEACHER_CREATED` exists).

**Dashboard**: Original / AI-Generated / Teacher-Created question counts, kept separate,
never merged into one number.

**Wrong Book**: retains `questionSource` per wrong-answer entry, so a student can later see
whether a missed question was from their own material or an AI-generated one.

**AI Tutor**: explanation text keyed by `questionSource` — `ORIGINAL` → "本題來自你上傳的
教材。"; `AI_GENERATED` → "本題由 AI 根據教材延伸產生。"; `TEACHER_CREATED` → "本題由教師
建立。"

None of the *Display Contract* items above (source badges, filter, Dashboard split stats, AI
Tutor prompts) have been implemented anywhere. `MaterialRuntime`/`SummaryRuntime`/
`QuestionRuntime`/`WrongBookRuntime`/`Dashboard.js`/`WrongBook.js`/`AITutorService.js` remain
fully unmodified. `QuizCenter.js`/`ExamRuntime.js` **did** gain a small, unrelated, purely-additive
change in Sprint v1.6 (direct entry into an already-imported exam by `examId` — see "Runtime
Wiring" below) — that is data plumbing, not any part of this Display Contract. This Repository's
schema already carries every field this contract needs (`questionSource`, `origin`,
`materialType`), so whenever it's authorized, no further schema work should be required first.

## Teaching Material Adapter (EO-S1.2-001 Revision v1.0) — data conversion only, still not wired in

`scripts/TeachingMaterialAdapter.js` is a pure, stateless converter: `convertMaterial()` /
`convertSummary()` / `convertQuestions()` / `convertRelated()` turn already-loaded Package
JSON into the exact shapes `AHS.MaterialRuntime.add()`, `AHS.SummaryRuntime.add()`, and
`AHS.QuestionRuntime.importQuestions()` already accept, unmodified — plus `validatePackage()`,
which reuses `ValidateMaterial.js` as a subprocess rather than re-implementing any check. It
holds no state, calls no Runtime itself, and never touches `save`/`update`/`delete`. Every
mapping decision (title derivation, `category`/`unit`, which Question Runtime is targeted and
why, which Summary/Question fields have no honest target and are dropped, and the
`materialRuntimeId` threading needed because `MaterialRuntime.add()` assigns its own `id`) is
documented in the file's own header comment and in `docs/EO/EO_S1.2-001_Report.md` — flagged,
not silently decided. Self-tested against scratch, never-committed Package data (clean
conversion, then fed through the real `MaterialRuntime.add()`/`SummaryRuntime.add()`/
`QuestionRuntime.importQuestions()` in an isolated Node context to confirm every field is
genuinely accepted, not just shaped correctly on paper) before being documented as working.

Architecture (per this EO): Repository → Adapter → MaterialRuntime → Material Center. At the
time this section was first written, the Adapter was called by nothing — see "Runtime Wiring"
below for how Sprint v1.4 actually connected it.

## Runtime Wiring (Sprint v1.4 "First Real Material Workflow") — the Repository is now live

The full chain is real and wired: **Repository → `GenerateTeachingMaterialData.js` (offline) →
`js/data/TeachingMaterialData.js` → `TeachingMaterialLoader` (browser) → `MaterialRuntime` /
`SummaryRuntime` / `QuestionRuntime` → Material Center / Summary / Quiz Center**.

- **`scripts/GenerateTeachingMaterialData.js`** (Node, run manually or by Claude after any
  Repository change — never automatically, no build step exists): scans `materials/`, converts
  every Package that passes `ValidateMaterial.js` through the unmodified `TeachingMaterialAdapter`,
  and writes `js/data/TeachingMaterialData.js` — a plain static data file, `<script>`-tagged
  exactly like `MockData.js`/`ExamData.js`. This is the answer to "how does Repository JSON
  reach a browser with no `fetch()`, no bundler, and no server" (flagged as an open question in
  Sprint v1.3's report): the JSON is inlined offline, not read live.
- **`js/runtime/TeachingMaterialLoader.js`** (browser, `<script>`-tagged on `materials.html` and
  `quiz.html`, coordinator only — holds no material-content store of its own, same pattern as
  `js/runtime/ImportRuntime.js`): `AHS.TeachingMaterialLoader.initialize()` reads
  `AHS.TeachingMaterialData` and calls only existing, unmodified `MaterialRuntime.add()` /
  `SummaryRuntime.add()` / `QuestionRuntime.importQuestions()`. Called once at bootstrap on each
  page (`js/pages/AppMaterials.js`, `js/pages/AppQuiz.js`), before that page's component reads
  Runtime data. No-ops completely when the Repository is empty — the existing Empty State is
  untouched, confirmed by test.
- **Why it runs on `quiz.html` too, not just `materials.html`**: `QuestionRuntime` is
  intentionally memory-only (never sessionStorage-persisted, per design) and isn't even
  `<script>`-tagged on `materials.html` — so Teaching-Material questions only actually reach
  `QuestionRuntime` if the Loader runs again on `quiz.html` itself. `MaterialRuntime`/
  `SummaryRuntime`, by contrast, **are** sessionStorage-persisted and rehydrate on every page
  load, so the Loader tracks a small `{Package materialId → MaterialRuntime id}` map of its own
  (via the same LOCK `PersistenceAdapter`) purely to avoid creating a duplicate `MaterialRuntime`
  record on a revisit — confirmed by test across three simulated page loads (first visit,
  revisit, and `quiz.html` with `MaterialRuntime.js` absent from that page).
- **Material Center / Summary Center need no code changes**: both already read exclusively
  through `MaterialRuntime.list()`/`isEmpty()` and `SummaryRuntime.findByMaterialId()`/`list()`
  — once the Loader has written real records, they display through the existing, unmodified
  rendering path.
- **UI reachability — RESOLVED for `single_choice` questions, Sprint v1.6 "Learning Experience
  Integration"**: `MaterialCard.js` now renders a real "開始練習" `<a href="quiz.html?mode=
  practice&examId=teaching_material_<id>">`, and `js/pages/AppQuiz.js`/`QuizCenter.js` read that
  `examId` to call a new, additive `AHS.ExamRuntime.startFromExam(examId, meta)` — a `RUNNING`
  session created directly from the already-imported `QuestionRuntime` set, never through
  `ExamRuntime.start()`'s fixed-catalog/`QuestionBank.generate()` flow. This app's own
  pre-existing "練習模式 (`LearningQuestionRuntime`) vs Exam Mode (`QuestionRuntime`) 不得混用"
  separation is respected exactly as before — Teaching Material questions reach the student
  through Exam Mode, not Practice Mode, matching the Adapter's own original design.
- **A second, deeper finding fixed in the same Sprint**: `QuestionRuntime.importQuestions()`
  accepts any object shape, but `AHS.AutoGrader.grade()` and `js/ui/QuestionCard.js` hard-code
  `AHS.QuestionBank`'s own native field names (`text`/`correctAnswer`/`index`/`knowledgePoint`,
  `options` as `{key,text}` objects, and an `AHS.Subjects`-keyed `subject` with **no fallback** —
  an unmapped key would throw). The Adapter's own question shape (`question`/`answer`/plain-string
  `options`, by design) was never actually gradable or renderable — nothing had exercised this
  path before Sprint v1.6. Fixed inside `TeachingMaterialLoader.js` (permitted as "Wiring", not an
  Adapter/Runtime change): only `single_choice` questions whose `answer` matches one of their own
  `options`, on a material whose `subject` matches one of `AHS.Subjects`' 9 known Chinese names,
  are reshaped and included. `true_false`/`fill_blank`/`calculation`/`essay` questions, and any
  unmappable subject, are honestly skipped — never fabricated into fake multiple-choice content.
  See `docs/EO/Sprint_v1.6_LearningExperienceIntegration_Report.md` for full detail.
- **Material Card fields** (`出版社`/`關鍵字`/`教材來源`, requested by Sprint v1.3 but dropped
  from v1.4/v1.6's scope): still not displayable — `MaterialRuntime.add()`'s field whitelist has
  no publisher/keywords/source, and `MaterialCard.js` renders none of them. Unresolved, not
  silently fixed or silently dropped from tracking.

## Repository Manager / Import Manager (Sprint AI-115 — Material Pipeline Automation)

Sprint AI-115's own Objective — "建立教材從上傳、分析、匯入到平台使用的完整流程" — formalized
the previously-implicit "run the generator by hand" step into two real, gated Node modules:

- **`scripts/RepositoryManager.js`** (AI-115-03): `scanPackages()` (Lifecycle Stage per
  Package), `checkDuplicates()`/`checkVersions()`/`checkStatuses()` (real content-hash +
  subject/chapter/title collision detection, version-format check, per-stage tally — the same
  functions ImportManager.js reuses, not a second implementation), `report()` (aggregates all
  of the above), `rebuildIndex()` (the only path that (re)writes `index.json` — delegates
  entirely to `GenerateTeachingMaterialData.js`'s own `generate()`, so "不得人工修改 index"
  holds structurally: there is exactly one writer, and it was never a hand-edit), and
  `prepare()` (derives `knowledge.json`/`report.md` for every `CLAUDE_READY` Package,
  advancing it to `READY_FOR_IMPORT` — reuses `GenerateTeachingMaterialData.js`'s own
  `buildKnowledgeIndex()`/`buildReportMarkdown()`).
- **`scripts/ImportManager.js`** (AI-115-04/05/06/08/09): `importAll()` is the sole Import
  Flow — every `READY_FOR_IMPORT` Package is Import-Validated (AI-115-05: `metadata.json`/
  `summary.json`/`questionbank.json`/`knowledge.json`/`report.md` must all exist, plus a real
  `ValidateMaterial.js` re-check, plus confirming the root `index.json` itself still parses —
  this Repository has exactly one `index.json`, never a per-Package file, a flagged reading of
  AI-115-05's checklist) and Duplicate-Detected (AI-115-06: reuses
  `RepositoryManager.checkDuplicates()`; within a duplicate group, the lexicographically
  smallest `materialId` — i.e. the earliest-assigned — is kept, every other member is
  rejected) before being allowed into one `generate({ skipIds })` call (a small, additive
  parameter on `GenerateTeachingMaterialData.js`'s `generate()`, backward compatible with
  every existing no-argument call). Every attempt — success or rejection — is appended to
  `import-log.json` (AI-115-08: `{ time, materialId, version, result, error }`,
  `result` ∈ `SUCCESS` / `FAIL_VALIDATION` / `FAIL_DUPLICATE` / `FAIL_ROLLBACK`). Before
  calling `generate()`, `js/data/TeachingMaterialData.js` / `index.json` /
  `js/data/RepositoryStatus.js` are backed up in memory; if `generate()` throws for any
  reason, all three are restored byte-for-byte (each restore attempt independent and
  best-effort, so one failing restore never blocks the other two or swallows the Import Log
  entry) before the error is re-thrown — AI-115-09's "Runtime 保持一致" (the browser never
  sees a partially-written state, since `js/runtime/TeachingMaterialLoader.js` only ever reads
  these three files as a whole on its next page load).
- **Runtime reality check (flagged in `ImportManager.js`'s own header, not silently
  reinterpreted)**: AI-115-04's "不得直接寫入 Runtime。所有 Import 必須經由 Import Manager"
  is written as if a Node script could write to `MaterialRuntime`/`SummaryRuntime`/
  `QuestionRuntime`/`StatisticsRuntime`/`LearningStateRuntime` — all `window.AHS` browser code,
  unreachable from Node (no server, no fetch, per `CLAUDE.md`). The only real bridge is
  `js/runtime/TeachingMaterialLoader.js` (unmodified this Sprint), and it was already the sole
  caller of `AHS.MaterialRuntime.add()` for this Package track before this Sprint.
  `StatisticsRuntime`/`LearningStateRuntime` need no explicit write-through at all — this
  codebase's own Single-Source discipline already makes them pure computed views over
  `MaterialRuntime`/`QuestionRuntime`/`WrongBookRuntime`. So "不得直接寫入 Runtime" is honestly
  satisfied as: **`ImportManager.js` is the sole gate deciding which Packages ever become
  visible to that browser bridge at all** — verified end-to-end (Package → `ImportManager.js`
  → `TeachingMaterialLoader` → `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime` →
  `StatisticsRuntime`/`LearningStateRuntime` → Summary/Quiz/WrongBook/Review/Tutor, all real,
  zero fabricated) by `tests/regression/MaterialPipelineRegression.js` (AI-115-10).
- **Repository Dashboard** (AI-115-07): `GenerateTeachingMaterialData.js` also writes
  `js/data/RepositoryStatus.js` (`AHS.RepositoryStatus.counts`, real per-stage Package tally
  from `MaterialLifecycle.js`'s own `countByStage()`) — the only way the browser (a static,
  no-fetch app) can ever see RAW/ANALYZING/CLAUDE_READY/READY_FOR_IMPORT counts, since those
  Packages are by definition not yet in the Runtime-visible `TeachingMaterialData.js`.
  `js/ui/SettingsPanel.js`'s Repository section reads it directly, degrading to nothing shown
  (never a fabricated all-zero) when the data file isn't loaded on a given page.

## Explicitly out of scope, confirmed unaffected

`MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/`WrongBookRuntime`/`HistoryRuntime`/
`TeachingMaterialAdapter`/`Dashboard.js`/`WrongBook.js`/`AITutorService.js` APIs are all
byte-identical to before every EO/Sprint in this track. `ExamRuntime.js` gained exactly one new,
additive function (`startFromExam()`, Sprint v1.6) — every pre-existing function untouched.
`QuizCenter.js`/`MaterialCard.js` gained small, additive changes (an optional 4th `create()`
param; two new `<a>` Navigation Actions reusing an existing CSS class) — no redesign, no new
Design Token. `js/pages/AppMaterials.js`/`AppQuiz.js` gained a couple of lines each;
`materials.html`/`quiz.html` gained two `<script>` tags each. No Mock/Demo/Placeholder data was
added — `js/data/TeachingMaterialData.js` is generated from real Repository content only
(currently `[]`, since the Repository is still genuinely empty). Dashboard/AI Tutor Router/Review
Center reading this Repository, the Display Contract, non-`single_choice` Exam-Mode support, and
Material Card's `出版社`/`關鍵字`/`教材來源` fields all remain future scope.

**Sprint AI-115** (Material Pipeline Automation): no LLM/AI API connected (none of this
Sprint's own code calls one — every check is deterministic file/schema logic), no existing
Learning Workflow/Statistics logic/Quiz flow/Review flow modified (`StatisticsRuntime`/
`ReviewRuntime`/`QuizCenter.js`/`WrongBook.js` are all byte-identical to before this Sprint —
they simply see this Sprint's Repository output the same way they already saw every prior
Sprint's). `js/runtime/TeachingMaterialLoader.js` is also untouched — the entire pipeline
change is on the offline/Node side (`docs/TeachingMaterials/scripts/`) plus one small, additive
Settings section (AI-115-07) and one small, additive `generate()` parameter (AI-115-06's
`skipIds`, defaulting to none).
