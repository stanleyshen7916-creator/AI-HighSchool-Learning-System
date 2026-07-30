# Teaching Material Repository — EO-S1.1-001 v1.1 + EO-S1.1-002 v1.0

Status: **LOCKED** (schema/workflow) ｜ Owner: Project Owner ｜ Analysis Engine: Claude

This directory is the Teaching Material Repository — the permanent, Git-versioned Source
of Truth for teaching material analysis results, per EO-S1.1-001 v1.1 (established this
Repository) and EO-S1.1-002 v1.0 (refined the exact Metadata schema, added AI/Original
question provenance, defined the Import Rule and the per-material Git commit format). It
exists alongside, not inside, `js/`/`css/`/the app's Runtime layer: nothing here is loaded
by any `<script>` tag, and no existing Runtime has been modified to read it (per both EOs'
Runtime Rule — "不得修改既有 Runtime／不得重構 Runtime"). Wiring a real loader is explicit
future scope, not either EO's.

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
question. **EO-S1.1-002**: every question also carries `origin` — `"Original"` for a
question copied verbatim from the source material (e.g. a real exam question), `"AI"` for a
question Claude derived from the material's real content (still traceable via `source`,
never invented from nothing). See `schema/QuestionBank.schema.json`.

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
      them; every question's `origin` correctly `"AI"` or `"Original"`)
- [ ] Related Materials checked (linked if genuine overlap found; never duplicated)
- [ ] Repository updated (`index.json`, and `materials/<materialId>/*.json` — new folder for
      New Material, same folder updated in place for Existing Material)
- [ ] **JSON Schema 合法**: `node docs/TeachingMaterials/scripts/ValidateMaterial.js
      <materialId>` — all four records PASS
- [ ] `npm run verify` / `npm test` still PASS (this Repository is inert to the app today,
      but a regression sweep costs nothing and confirms nothing was accidentally broken)
- [ ] Git commit (`feat(material): import <materialId>`)
- [ ] Git push

## Explicitly out of scope for both EOs

Per "目前階段：建立教材分析能力，不是建立教材內容" and the Runtime Rule ("不得修改既有
Runtime／不得重構 Runtime／不得要求修改 UI／不得要求重新設計 Repository"): no Runtime
loader/adapter reading from this Repository has been built. `MaterialRuntime`/
`SummaryRuntime`/`QuestionRuntime`/`WrongBookRuntime` are byte-identical to before either
EO. Wiring — Material Center/AI Tutor Router/Dashboard/Review Center actually reading this
Repository — is future scope, not started here.
