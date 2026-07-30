# Teaching Material Repository — EO-S1.1-001 v1.1 + EO-S1.1-002 v1.0 + EO-S1.1-002A v1.0 + EO-S1.1-003 v1.0 + EO-S1.2-001 (Revision) v1.0 + Sprint v1.4

Status: **LOCKED** (schema/workflow) ｜ Owner: Project Owner ｜ Analysis Engine: Claude

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
  index.json             — Knowledge Index: manifest of every material (empty for now)
  schema/                — JSON Schema definitions for the five record types below
    Metadata.schema.json
    Manifest.schema.json
    Summary.schema.json
    QuestionBank.schema.json
    RelatedMaterials.schema.json
  scripts/
    ValidateMaterial.js  — EO-S1.1-002 QA's "JSON Schema 合法" check, made runnable:
                            node docs/TeachingMaterials/scripts/ValidateMaterial.js <materialId>
    TeachingMaterialAdapter.js  — NEW, EO-S1.2-001 (Revision): pure data-shape converter,
                            Package -> MaterialRuntime/SummaryRuntime/QuestionRuntime-accepted
                            objects. See dedicated section below.
    GenerateTeachingMaterialData.js  — NEW, Sprint v1.4: offline generator, Repository ->
                            js/data/TeachingMaterialData.js. See "Runtime Wiring" below.
  materials/
    <materialId>/         — one self-contained Package per material, materialId = tm_<seq>
      source/              — the ORIGINAL uploaded file(s), byte-identical, original filenames,
                              never modified/recompressed/renamed (EO-S1.1-003 Package Structure)
      metadata.json
      manifest.json         — NEW, EO-S1.1-003: package bookkeeping, distinct from metadata.json
      summary.json
      questions.json
      related.json
```

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
| `subject` | e.g. `math`/`chinese` — aligns with `AHS.Subjects` keys used elsewhere in the app |
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
`questions.json` entry against.

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
in `questions.json`).

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
  → Metadata (incl. materialType) / manifest.json / Summary / Question Bank (source+origin
    tagged, ocrConfidence/needsReview set honestly) / Related Materials built
  → materials/<materialId>/*.json + source/ written; index.json updated
  → QA checklist (below) confirmed, including node scripts/ValidateMaterial.js <materialId>
  → node scripts/GenerateTeachingMaterialData.js  (NEW, Sprint v1.4 — regenerates
    js/data/TeachingMaterialData.js so the running app can actually see this material;
    see "Runtime Wiring" section below)
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

None of `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/`WrongBookRuntime`/
`QuizCenter.js`/`Dashboard.js`/`WrongBook.js`/`AITutorService.js` have been touched — this
Repository's schema now carries every field this contract needs (`questionSource`, `origin`,
`materialType`), so whenever Runtime wiring is authorized, no further schema work should be
required first.

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
- **Known, honestly-disclosed gap (matching `ImportRuntime.js`'s own precedent for the same
  situation)**: this app draws a hard, pre-existing line between "練習模式" (Practice Mode —
  reads *only* `AHS.LearningQuestionRuntime`) and "Exam Mode" (reads *only*
  `AHS.QuestionRuntime`) — `js/components/QuizCenter.js`'s own comments call this "不得混用."
  Teaching Material questions are imported into `QuestionRuntime` (per the Adapter's own design —
  see `EO_S1.2-001_Report.md` judgment call 5), so they are genuinely stored and queryable
  (`hasExam()`/`getSet()` correctly reflect them, confirmed by test) but reachable only through
  Exam Mode's `examId`, not through the "開始練習" Practice Mode button. Exam Mode's own list is
  driven by a fixed catalog (`ExamData.js` via `ExamRuntime.start()`), which has no dynamic entry
  point for an externally-imported `examId` — so there is currently no live UI button a student
  can click to reach this content. Building one is out of this Sprint's scope ("不得重新設計
  UI"); the data-level wiring this Sprint asked for is complete and verified.
- **Material Card fields** (`出版社`/`關鍵字`/`教材來源`, requested by Sprint v1.3 but dropped
  from v1.4's scope): still not displayable — `MaterialRuntime.add()`'s field whitelist has no
  publisher/keywords/source, and `MaterialCard.js` renders none of them. Unresolved, not silently
  fixed or silently dropped from tracking.

## Explicitly out of scope, confirmed unaffected

`MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/`WrongBookRuntime`/`TeachingMaterialAdapter`/
`QuizCenter.js`/`Dashboard.js`/`WrongBook.js`/`AITutorService.js`/`MaterialCard.js` APIs are all
byte-identical to before every EO/Sprint in this track — only `js/pages/AppMaterials.js` and
`js/pages/AppQuiz.js` gained a two-line bootstrap call, and `materials.html`/`quiz.html` gained
two `<script>` tags each. No Mock/Demo/Placeholder data was added — `js/data/TeachingMaterialData.js`
is generated from real Repository content only (currently `[]`, since the Repository is still
genuinely empty). Dashboard/AI Tutor Router/Review Center reading this Repository, and the
Practice-Mode-reachability gap above, remain future scope.
