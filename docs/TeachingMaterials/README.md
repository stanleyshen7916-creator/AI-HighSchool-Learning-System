# Teaching Material Repository — EO-S1.1-001 v1.1 + EO-S1.1-002 v1.0 + EO-S1.1-002A v1.0

Status: **LOCKED** (schema/workflow) ｜ Owner: Project Owner ｜ Analysis Engine: Claude

This directory is the Teaching Material Repository — the permanent, Git-versioned Source
of Truth for teaching material analysis results, per EO-S1.1-001 v1.1 (established this
Repository), EO-S1.1-002 v1.0 (refined the exact Metadata schema, added AI/Original
question provenance, defined the Import Rule and the per-material Git commit format), and
EO-S1.1-002A v1.0 (Question Source Rule: `questionSource`/`origin` pairing, OCR-uncertainty
handling — **the Repository-schema part only**; its Quiz Center/Dashboard/Wrong Book/AI
Tutor display requirements are flagged, not implemented — see the dedicated section below).
This directory exists alongside, not inside, `js/`/`css/`/the app's Runtime layer: nothing
here is loaded by any `<script>` tag, and no existing Runtime has been modified to read it
(per all three EOs' Runtime Rule — "不得修改既有 Runtime／不得重構 Runtime"). Wiring a real
loader is explicit future scope, not any of these EOs'.

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

## Directory layout (per material, once real material arrives)

```
docs/TeachingMaterials/
  README.md              — this file
  index.json             — Knowledge Index: manifest of every material (empty for now)
  schema/                — JSON Schema definitions for the four record types below
    Metadata.schema.json
    Summary.schema.json
    QuestionBank.schema.json
    RelatedMaterials.schema.json
  scripts/
    ValidateMaterial.js  — EO-S1.1-002 QA's "JSON Schema 合法" check, made runnable:
                            node docs/TeachingMaterials/scripts/ValidateMaterial.js <materialId>
  materials/
    <materialId>/         — one folder per analyzed material, materialId = tm_<seq>
      metadata.json
      summary.json
      questions.json
      related.json
```

## Record schemas

### Metadata

**EO-S1.1-002's exact 11-field list** (camelCase, supersedes EO-S1.1-001's initial reuse of
`MetadataParser.js`'s PascalCase field names — that set described a different context, the
raw `Metadata.json` import file, not this Repository's own schema): `materialId`, `subject`,
`grade`, `publisher`, `chapter`, `unit`, `keywords`, `difficulty`, `source`, `uploadDate`,
`version`. Every field always present; unknown values `null`/`[]`, never guessed. See
`schema/Metadata.schema.json`.

| Field | Notes |
|---|---|
| `subject` | e.g. `math`/`chinese` — aligns with `AHS.Subjects` keys used elsewhere in the app |
| `grade` | `高一`/`高二`/`高三` |
| `keywords` | array of strings |
| `source` | e.g. `教師補充教材`/`教科書`/`考卷`/`講義` — the material's real origin, never guessed |
| `uploadDate` | when Project Owner provided it, not when it was originally published |
| `version` | starts `"1"`; incremented when Existing Material is updated (see Import Rule) |
| `publisher`, `chapter`, `unit`, `difficulty` | defensive defaults (`null`), never fabricated |

### Summary

`核心概念` (core concepts), `定義` (definitions), `關鍵字` (keywords), `重點整理` (key
points), `易錯觀念` (common misconceptions) — each an array of strings, empty until real
material is analyzed. See `schema/Summary.schema.json`.

### Question Bank

At minimum `單選題` (single choice), `是非題` (true/false), `填充題` (fill-in-the-blank);
`計算題` (calculation) and `申論題` (essay) added only when the source material's own
content genuinely supports them (never invented to pad variety). Every question carries a
`source` trace field (which material, which page/section) — never a bare, untraceable
question, and a `questionId` (renamed from the earlier `id`, per EO-S1.1-002A's exact field
name).

**EO-S1.1-002A Question Source Rule** — every question carries both `questionSource`
(`"ORIGINAL"` | `"AI_GENERATED"`) and `origin` (`"Uploaded Material"` | `"AI"`), which must
pair consistently (ORIGINAL↔Uploaded Material, AI_GENERATED↔AI) — enforced by
`scripts/ValidateMaterial.js`, since plain JSON Schema draft-07 can't express that pairing
without more machinery than this Repository's hand-rolled validator carries.

- **`ORIGINAL`**: 段考/模擬考/歷屆試題/教師試卷/作業/課本習題 — the question text **must
  match the source material exactly**: no rewriting, simplifying, reorganizing, polishing,
  or AI correction. If OCR/transcription confidence is insufficient to be certain the text
  is verbatim, Claude must never guess — `needsManualReview: true` is set instead (required
  field on every ORIGINAL question, explicit `true`/`false`, never omitted).
- **`AI_GENERATED`**: a question Claude derived from the material's real content (single
  choice/fill-in/true-false/calculation/essay as appropriate) — `needsManualReview` doesn't
  apply and must not be present.

(Note: EO-S1.1-002 previously defined a same-named `origin` field with different values
(`"AI"`/`"Original"`) — EO-S1.1-002A's own Metadata list redefines `origin` with the two
values above, which this schema now follows as the more recent LOCK.)

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

## Workflow (per EO-S1.1-001 v1.1 + EO-S1.1-002 v1.0)

```
Project Owner uploads real material (PDF/PPT/DOCX/JPG/PNG/掃描講義/考卷/課本/教師補充資料;
  one or several at once)
  → Claude receives it, classifies New / Existing / Related (Import Rule above)
  → Claude analyzes it (OCR if needed — no AI API, per "不使用任何 API")
  → Metadata / Summary / Question Bank (origin-tagged) / Related Materials built
  → materials/<materialId>/*.json written; index.json updated
  → QA checklist (below) confirmed, including node scripts/ValidateMaterial.js <materialId>
  → git commit -m "feat(material): import <materialId>"
  → git push
```

## QA Checklist (run per material, once real analysis begins)

- [ ] Metadata complete (every field present; unknowns `null`/`[]`, never guessed)
- [ ] Summary complete
- [ ] Question Bank built (≥ 單選/是非/填充; 計算/申論 only where the material supports
      them; every question's `questionSource`/`origin` pair set and consistent; every
      ORIGINAL question's `needsManualReview` explicitly set, never guessed when OCR
      confidence is low)
- [ ] Related Materials checked (linked if genuine overlap found; never duplicated)
- [ ] Repository updated (`index.json`, and `materials/<materialId>/*.json` — new folder for
      New Material, same folder updated in place for Existing Material)
- [ ] **JSON Schema 合法**: `node docs/TeachingMaterials/scripts/ValidateMaterial.js
      <materialId>` — all four records PASS
- [ ] `npm run verify` / `npm test` still PASS (this Repository is inert to the app today,
      but a regression sweep costs nothing and confirms nothing was accidentally broken)
- [ ] Git commit (`feat(material): import <materialId>`)
- [ ] Git push

## EO-S1.1-002A's app-facing requirements — flagged, NOT implemented

EO-S1.1-002A also specifies real, live-app behavior beyond this Repository's own schema:
Quiz Center must display each question's source and offer a source filter (全部／上傳教材／
AI 模擬試題), Dashboard must count Original vs. AI-Generated questions separately, Wrong
Book must retain `questionSource` per entry, and AI Tutor must give source-aware
explanations ("本題來自你上傳的教材" / "本題為 AI 依教材內容所產生的練習題").

**None of this has been implemented.** Reasons, stated plainly rather than silently skipped:

1. **No wiring exists between this Repository and the live app at all.** Both EO-S1.1-001
   and EO-S1.1-002 explicitly kept this Repository inert — "no Runtime loader/adapter
   reading from this Repository has been built... Wiring is future scope, not started
   here" — repeated verbatim in each of their own reports. EO-S1.1-002A doesn't repeat that
   constraint, but doesn't lift it either; implementing Quiz Center/Dashboard/Wrong
   Book/AI Tutor changes would require building that wiring for the first time as an
   unstated prerequisite, which is a materially larger change than a schema refinement.
2. **This is real Runtime and UI surgery on an already-shipped, already-PAT-tested app**
   (`js/components/QuizCenter.js`, `js/components/Dashboard.js`, `js/components/
   WrongBook.js`, `js/runtime/AITutorService.js` or similar) — a different category of
   change from anything done under the EO-S1.1-00x track so far, and squarely the kind of
   change Sprint AI-108's still-standing "no new feature planning until v1.0.0 Release
   Approval" gate was written to hold off on.
3. **There is nothing real to display yet.** `materialsAnalyzed: 0` — zero real questions
   exist anywhere in this Repository, so a Quiz Center filter or a Dashboard split-count
   would have nothing genuine to operate on regardless.

Flagged in `docs/EO/EO_S1.1-002A_Report.md` for Project Owner to confirm before any Runtime/
UI work begins — not decided unilaterally, consistent with how the placement/gate questions
were handled in EO-S1.1-001/002.

## Explicitly out of scope, confirmed unaffected

Per "目前階段：建立教材分析能力，不是建立教材內容" and the Runtime Rule ("不得修改既有
Runtime／不得重構 Runtime／不得要求修改 UI／不得要求重新設計 Repository"): no Runtime
loader/adapter reading from this Repository has been built. `MaterialRuntime`/
`SummaryRuntime`/`QuestionRuntime`/`WrongBookRuntime`/`QuizCenter.js`/`Dashboard.js`/
`WrongBook.js`/`AITutorService.js` are all byte-identical to before every EO in this track.
Wiring — Material Center/AI Tutor Router/Dashboard/Review Center actually reading this
Repository — remains future scope, not started here.
