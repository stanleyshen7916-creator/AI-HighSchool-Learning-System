# Teaching Material Repository — EO-S1.1-001 v1.1

Status: **LOCKED** (schema/workflow) ｜ Owner: Project Owner ｜ Analysis Engine: Claude

This directory is the Teaching Material Repository — the permanent, Git-versioned Source
of Truth for teaching material analysis results, per EO-S1.1-001 v1.1. It exists
alongside, not inside, `js/`/`css/`/the app's Runtime layer: nothing here is loaded by any
`<script>` tag, and no existing Runtime has been modified to read it (per this EO's own
Runtime Rule — "不得修改既有 Runtime／不得重構 Runtime"). Wiring a real loader is explicit
future scope, not this EO's.

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
  materials/
    <materialId>/         — one folder per analyzed material, materialId = tm_<seq>
      metadata.json
      summary.json
      questions.json
      related.json
```

## Record schemas

### Metadata

Reuses Sprint AI-103's already-PMO-approved 11-field `MetadataParser.js` schema (Subject/
Grade/Publisher/Version/Chapter/Unit/Difficulty/Tags/Author/CreatedTime/UpdatedTime) as the
base — per this project's "Reuse Before Create" discipline, rather than inventing a second,
different Metadata shape — plus this EO's own two additional fields (`Keywords`, `Source`)
that field list didn't carry. See `schema/Metadata.schema.json`.

| Field | Source | Notes |
|---|---|---|
| `Subject` | EO-S1.1-001 + AI-103 | e.g. `math`/`chinese` — aligns with `AHS.Subjects` keys used elsewhere in the app |
| `Grade` | EO-S1.1-001 + AI-103 | `高一`/`高二`/`高三` |
| `Chapter` | EO-S1.1-001 + AI-103 | |
| `Unit` | EO-S1.1-001 + AI-103 | |
| `Keywords` | EO-S1.1-001 | array of strings (aliases AI-103's `Tags`, kept as a separate field to match this EO's own literal wording) |
| `Source` | EO-S1.1-001 | e.g. `教師補充教材`/`教科書`/`考卷`/`講義` — the material's real origin, never guessed |
| `Publisher`, `Version`, `Difficulty`, `Tags`, `Author`, `CreatedTime`, `UpdatedTime` | AI-103 | defensive defaults (`null`/`[]`), never fabricated |

### Summary

`核心概念` (core concepts), `定義` (definitions), `關鍵字` (keywords), `重點整理` (key
points), `易錯觀念` (common misconceptions) — each an array of strings, empty until real
material is analyzed. See `schema/Summary.schema.json`.

### Question Bank

At minimum `單選題` (single choice), `是非題` (true/false), `填充題` (fill-in-the-blank);
`計算題` (calculation) and `申論題` (essay) added only when the source material's own
content genuinely supports them (never invented to pad variety). Every question carries a
`source` trace field (which material, which page/section) — never a bare, untraceable
question. See `schema/QuestionBank.schema.json`.

### Related Materials

Links to other `materialId`s already in this Repository that cover the same knowledge —
established only when a genuine overlap is found during analysis, never speculatively.
"不得重複建立教材" — an existing, closely-related material is linked, not duplicated. See
`schema/RelatedMaterials.schema.json`.

## Workflow (per EO-S1.1-001 v1.1)

```
Project Owner uploads real material (PDF/PPT/Word/JPG/PNG/考卷/講義/教科書/教師補充教材)
  → Claude analyzes it (OCR if needed — no AI API, per this EO's "不需任何 API")
  → Metadata / Summary / Question Bank / Related Materials built
  → materials/<materialId>/*.json written; index.json updated
  → QA checklist (below) confirmed
  → git commit, git push
```

## QA Checklist (run per material, once real analysis begins)

- [ ] Metadata complete (every field present; unknowns `null`/`[]`, never guessed)
- [ ] Summary complete
- [ ] Question Bank built (≥ 單選/是非/填充; 計算/申論 only where the material supports them)
- [ ] Related Materials checked (linked if genuine overlap found; never duplicated)
- [ ] `index.json` updated
- [ ] `npm run verify` / `npm test` still PASS (this Repository is inert to the app today,
      but a regression sweep costs nothing and confirms nothing was accidentally broken)
- [ ] Git commit
- [ ] Git push

## Explicitly out of scope for this EO

Per "目前階段：建立教材分析能力，不是建立教材內容" and the Runtime Rule ("不得修改既有
Runtime／不得重構 Runtime"): no Runtime loader/adapter reading from this Repository has
been built. `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/`WrongBookRuntime` are
byte-identical to before this EO. Wiring — Material Center/AI Tutor Router/Dashboard/Review
Center actually reading this Repository — is future scope, not started here.
