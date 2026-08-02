# SPRINT_AI112_Teaching_Material_Repository_Foundation_Report.md

## Summary

Sprint AI-112 asked for a Teaching Material Repository Foundation (Architecture/Schema/Index/
Adapter/Loader/Bridge/Import Pipeline/Regression) that any future material can import through.
Traced against real repository state (not assumed): **this Foundation already exists and has been
operating since Sprint v1.4 / HOTFIX-002**, across two independently-built but now-bridged tracks.
This Sprint's real, additive work was: (1) formally document that architecture
(`docs/Architecture/Architecture_TeachingMaterialRepository_Foundation_v1.0.md`), (2) close two
real, previously-disclosed schema gaps (`reviewSuggestions`, per-question `knowledgePoint`/
`difficulty` on the Package track), (3) fix the Repository Index so it is genuinely auto-generated
instead of hand-maintainable, and (4) build the dedicated Repository Regression Test. No Runtime
API was modified; no new Runtime was created; no UI was touched.

## Root Cause / Finding

Two things were true before this Sprint, found by tracing the real code and JSON Schema files, not
assumed:

1. **`docs/TeachingMaterials/index.json`** (the "Repository Index" AI-703 asks for) had existed
   since EO-S1.1-001 but **no script ever wrote to it** — `grep`-confirmed zero references to
   `index.json` anywhere in `docs/TeachingMaterials/scripts/`. In practice this made it
   hand-maintainable, directly contradicting its own stated "不得人工修改."
2. **`docs/TeachingMaterials/schema/Summary.schema.json`/`QuestionBank.schema.json`** had no field
   for `reviewSuggestions` (Summary) or `knowledgePoint`/per-question `difficulty` (QuestionBank)
   at all — `additionalProperties: false` meant even if a future Package genuinely wanted to
   provide them, `ValidateMaterial.js` would reject the whole Package. This matches (and formally
   closes) two gaps already disclosed in earlier Hotfix reports this session
   (HOTFIX-004: "Package's own questions.json schema has no difficulty field at all";
   TeachingMaterialAdapter.js's own comment: "Package has no reviewSuggestions").

## Runtime Flow Diagram

See `docs/Architecture/Architecture_TeachingMaterialRepository_Foundation_v1.0.md` for the full
diagram and field-by-field schema reconciliation table. Summary:

```
教材 → [Package: TeachingMaterialAdapter.js → docs/TeachingMaterials/materials/tm_<n>/ →
         GenerateTeachingMaterialData.js → js/data/TeachingMaterialData.js + index.json]
       [Repository: hand-authored data/materials/<Name>.js, self-registers into
         AHS.MaterialRepository]
         │  (both converge here — the one real seam)
         ▼
       TeachingMaterialLoader.js (Loader + Bridge)
         │
         ▼
       MaterialRuntime / SummaryRuntime / QuestionRuntime (unmodified Public API)
         │
         ▼
       Platform (Material Center / Summary / Quiz / WrongBook / Review / 首頁 / AI Tutor)
```

## AI-701 — Repository Architecture (DONE — documented, real structure)

New: `docs/Architecture/Architecture_TeachingMaterialRepository_Foundation_v1.0.md`. Maps the
Sprint's requested `Repository/{metadata/, materials/, index/, schema/, adapter/, loader/}` layout
onto the real, already-existing paths across both tracks (table in that document) — no new
top-level folder created (would duplicate working infrastructure and itself require the
structural sign-off this Sprint doesn't grant).

## AI-702 — Material Package Standard (DONE — 2 real schema gaps closed)

- `docs/TeachingMaterials/schema/Summary.schema.json`: added optional `reviewSuggestions: string[]`.
- `docs/TeachingMaterials/schema/QuestionBank.schema.json`: added optional per-question
  `knowledgePoint`/`difficulty`.
- `docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js`: `convertSummary()`/
  `convertQuestions()` now pass these through **only when the source Package actually provides
  them** (never fabricated, never defaulted to an empty placeholder) — additive, backward
  compatible; every existing field/behavior unchanged.
- No field's type/meaning varies by subject (confirmed by reading both schemas end-to-end against
  the one real Repository-track material) — "不得因科目不同修改 Schema" holds.
- **Verified with a temporary, scratch, never-committed Package (`tm_999`)**: created a minimal
  valid Package using the new optional fields, ran `ValidateMaterial.js tm_999` (13 PASS / 0 FAIL),
  ran the generator and confirmed `reviewSuggestions`/`knowledgePoint`/`difficulty` correctly
  flowed all the way into the generated `js/data/TeachingMaterialData.js`, then deleted the scratch
  Package and re-ran the generator to confirm the repository returns to its genuinely empty,
  real state — no test data left committed.

## AI-703 — Repository Index (DONE — real gap closed)

`docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js` now also regenerates
`docs/TeachingMaterials/index.json` from the exact same real Package scan it already used to build
`js/data/TeachingMaterialData.js` — one real source, two generated views. Verified via the same
scratch-Package test above (index correctly showed 1 real entry with real subject/grade/chapter/
materialType/version, then correctly returned to `materials: []`/`updatedAt: null` after cleanup).

## AI-704 — Material Adapter (DONE — verified, minimal additive change only)

`TeachingMaterialAdapter.js` — same exported functions, same signatures. Only `convertSummary()`/
`convertQuestions()` gained the passthrough above; `convertMaterial()`/`convertRelated()`/
`loadPackage()`/`validatePackage()` untouched.

## AI-705 — Repository Loader (DONE — verified unmodified)

`js/runtime/TeachingMaterialLoader.js` — confirmed unmodified this Sprint; every write still goes
through `AHS.MaterialRuntime.add()`/`AHS.SummaryRuntime.add()`/`AHS.QuestionRuntime.importQuestions()`
only (re-read the full file to confirm, not assumed).

## AI-706 — Repository Bridge (DONE — documented; already real from Sprint AI-111)

The Repository → Summary → Question → (Statistics) → Tutor bridge already exists, built in Sprint
AI-111 (`AHS.StatisticsRuntime`'s pure derivations + `AHS.TutorMessage.build()`). "Knowledge
Runtime"/"Tutor Runtime" in the literal sense (`AHS.KnowledgeRuntime`/`AHS.AITutorRuntime`) are
Practice-Mode-only Runtimes by long-standing LOCK design ("兩者不得混用") — the Repository was never
asked to feed them by any prior EO, and doing so now would be new architecture/business logic,
explicitly out of this Sprint's scope. Documented, not built.

## AI-707 — Import Pipeline (DONE — documented; one real seam confirmed)

Two authoring-time entry points (Package generator script vs. hand-authored Repository-track file)
converge on exactly one platform-facing chain (`TeachingMaterialLoader.js` → Runtime → Platform) —
confirmed by tracing the real code. "不得存在第二套匯入流程" holds at the level that matters:
nothing downstream of the Loader needs to know which track a material came from.

## AI-708 — Regression (DONE — new dedicated test)

New `tests/regression/RepositoryFoundation.js`, wired into `npm test` (`package.json`). Covers all
10 required checkpoints against the real, live Repository/Runtime state (Repository 建立/Index
更新/Loader/Bridge/Runtime/Material Center/Summary/Quiz/WrongBook/Tutor) — **21/21 PASS**.

## What was deliberately NOT done

- No new Runtime; no Runtime API (`MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/
  `WrongBookRuntime`/`ReviewRuntime`/`StatisticsRuntime`/`AITutorRuntime`) signature or behavior
  changed — every call from the Loader/Adapter remains through already-existing Public API only.
- No UI changed.
- No migration of the real Civics material between tracks, and no deletion/replacement of either
  track's own infrastructure.
- `AHS.SummaryRuntime`'s own accepted-field shape (`keywords` still not first-class there) left
  untouched — closing that specific gap requires a Runtime change, out of scope this Sprint;
  disclosed in the Architecture Document instead of silently worked around.
- No bridge built from Repository into `AHS.KnowledgeRuntime`/`AHS.AITutorRuntime` (Practice-Mode
  LOCK boundary respected, not an oversight).

## 修改檔案

- `docs/Architecture/Architecture_TeachingMaterialRepository_Foundation_v1.0.md` (new)
- `docs/TeachingMaterials/schema/Summary.schema.json` — optional `reviewSuggestions`
- `docs/TeachingMaterials/schema/QuestionBank.schema.json` — optional per-question `knowledgePoint`/`difficulty`
- `docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js` — additive passthrough only
- `docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js` — also regenerates `index.json`
- `docs/TeachingMaterials/index.json` — regenerated (still genuinely empty)
- `tests/regression/RepositoryFoundation.js` (new, 21 checks)
- `package.json` — `test` script now also runs `RepositoryFoundation.js`
- `docs/PMO/PROJECT_STATUS.json`, `docs/PMO/SPRINT.json`

## Verify / Test

`npm run verify` PASS. `npm test` → BehaviorSuite 273/273 PASS + PipelineRegression 6/6 PASS +
**RepositoryFoundation 21/21 PASS** (new). All three suites PASS.

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.

## Acceptance

- ☑ Repository 建立完成（確認既有雙軌 Repository 皆正常運作，非新建）
- ☑ Repository Schema 固定（不因科目變動；2 項真實欄位缺口已補上，皆為選填、向下相容）
- ☑ Loader 可正常運作（未修改，重新確認）
- ☑ Bridge 可正常同步（未修改，重新確認；Repository→Statistics→Tutor 橋接為 AI-111 既有成果）
- ☑ Runtime 無修改（MaterialRuntime/SummaryRuntime/QuestionRuntime/WrongBookRuntime/ReviewRuntime/
  StatisticsRuntime/AITutorRuntime 皆確認 API 未變更）
- ☑ 新教材可直接匯入（以 scratch Package `tm_999` 實測整條鏈路，含新欄位）
- ☑ 平台自動出現教材（scratch 測試確認教材資料正確流入 TeachingMaterialData.js／index.json）

等待 Project Owner PAT 後 Sprint AI-112 Closed。
