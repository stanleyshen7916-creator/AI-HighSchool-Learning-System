# Sprint AI-115 — Material Pipeline Automation Report

Spec: `SPRINT_AI115_Material_Pipeline_Automation.md` v1.0, Status EXECUTE.

Scope confirmed honored throughout: no LLM/AI API connected, no existing Learning Workflow /
Statistics logic / Quiz flow / Review flow modified — every check below is real, deterministic
Node/browser logic, verified against the Teaching Material Repository (`docs/TeachingMaterials/`),
which remains genuinely empty (no real material exists yet); everything is proven with scratch,
never-committed Package data, same discipline every prior Sprint in this track used.

## Sprint AI-115 Report

| Item | Result |
|---|---|
| Material Lifecycle (AI-115-01) | PASS |
| Repository (AI-115-03) | PASS |
| Import (AI-115-04) | PASS |
| Validation (AI-115-05) | PASS |
| Duplicate (AI-115-06) | PASS |
| Rollback (AI-115-09) | PASS |
| Repository Dashboard (AI-115-07) | PASS |
| Import Log (AI-115-08) | PASS |
| Regression (AI-115-10) | PASS |
| Verify | PASS |
| Test | PASS |
| Deployment | Filled in after merge. |

## Detail per item

**AI-115-01 Material Lifecycle** — `docs/TeachingMaterials/scripts/MaterialLifecycle.js`
re-defined to the spec's exact 6 stages (`RAW → ANALYZING → CLAUDE_READY → READY_FOR_IMPORT →
IMPORTED → ARCHIVED`), replacing the prior Sprint AI-113 4-stage set. `resolveStage()` is a
single if/else chain — by construction it can never report two stages for the same Package at
once, which is the real property "所有教材必須只有一個生命週期。不得：同時存在多個生命週期"
requires, not a rule enforced elsewhere. `ARCHIVED`'s only real signal is a new optional
`manifest.json` field, `archived: boolean` (added to `Manifest.schema.json`) — never inferred
from age/usage.

**AI-115-02 Material Package** — Package Standard extended: `material.md` added as a new
required, Claude-authored input file (real content, not generated — its absence/emptiness is a
`ValidateMaterial.js` FAIL); `questions.json` renamed `questionbank.json`, aligning the actual
file name with its own schema file's pre-existing name (`QuestionBank.schema.json`). Renamed
while the Repository was still genuinely empty — no real Package data needed migration.
`index.json` is interpreted as the single, repository-level generated Index (AI-115-03's own
"建立唯一 Index"), not a per-Package file — flagged in `README.md`, not silently assumed.

**AI-115-03 Repository Manager** — new `docs/TeachingMaterials/scripts/RepositoryManager.js`:
`scanPackages()`, `checkDuplicates()`/`checkVersions()`/`checkStatuses()` (real content-hash +
subject/chapter/title collision detection, version-format check, per-stage tally), `report()`,
`rebuildIndex()` (the only path that (re)writes `index.json` — delegates to
`GenerateTeachingMaterialData.js`'s existing `generate()`, so there is exactly one writer, never
a hand-edit), and `prepare()` (derives `knowledge.json`/`report.md` for every `CLAUDE_READY`
Package, advancing it to `READY_FOR_IMPORT` — reuses the generator's own
`buildKnowledgeIndex()`/`buildReportMarkdown()`, not a second implementation).

**AI-115-04 Import Manager** — new `docs/TeachingMaterials/scripts/ImportManager.js`:
`importAll()` is the sole Import Flow. Runtime reality check (flagged in the file's own header):
`MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/`StatisticsRuntime`/`LearningStateRuntime`
are all browser `window.AHS` code, unreachable from Node — the real bridge is
`js/runtime/TeachingMaterialLoader.js` (unmodified this Sprint, already the sole writer to
`MaterialRuntime` for this Package track), and `StatisticsRuntime`/`LearningStateRuntime` need
no write-through at all (pure computed views, this codebase's existing Single-Source
discipline). "不得直接寫入 Runtime" is honestly satisfied as: `ImportManager.js` is the sole
gate deciding which Packages ever become visible to that browser bridge — verified end-to-end by
`MaterialPipelineRegression.js`.

**AI-115-05 Import Validation** — `validateForImport()`: `metadata.json`/`summary.json`/
`questionbank.json`/`knowledge.json`/`report.md` must all exist, plus a real
`ValidateMaterial.js` re-check (catches schema-invalid content even when every file merely
*exists*), plus confirming the root `index.json` itself still parses as valid JSON. Any failure
→ that Package alone is rejected (`FAIL_VALIDATION`, logged), never a partial import. Verified
with a Package whose `questionbank.json` was corrupted after reaching `READY_FOR_IMPORT`
(file-existence checks alone wouldn't have caught this — the deeper `ValidateMaterial.js`
re-check does).

**AI-115-06 Duplicate Detection** — `RepositoryManager.checkDuplicates()` (reused by
`ImportManager.js`, not re-implemented): flags Packages sharing an identical content hash
(`metadata.json`+`material.md`+`summary.json`+`questionbank.json` bytes) or the same
subject+chapter+derived-title. Within a duplicate group the lexicographically smallest
`materialId` (the earliest-assigned) is kept; every other member is rejected
(`FAIL_DUPLICATE`, logged) and stays at `READY_FOR_IMPORT` — never silently promoted to
`IMPORTED`. Verified with two Packages built from identical content.

**AI-115-07 Repository Dashboard** — `GenerateTeachingMaterialData.js` now also writes
`js/data/RepositoryStatus.js` (`AHS.RepositoryStatus.counts`, real per-stage tally from
`MaterialLifecycle.js`'s `countByStage()`) — the only way this static, no-fetch app's browser
side can ever see RAW/ANALYZING/CLAUDE_READY/READY_FOR_IMPORT counts (those Packages are, by
definition, not yet in the Runtime-visible `TeachingMaterialData.js`). `js/ui/SettingsPanel.js`'s
existing Repository section now renders these counts (degrades to nothing shown, never a
fabricated all-zero, when the data file isn't loaded). `<script src="js/data/
RepositoryStatus.js">` added to every page that mounts Settings (all 9 root pages except
`qiaoqiao-gallery.html`, which never mounts `AppShell`).

**AI-115-08 Import Log** — `docs/TeachingMaterials/import-log.json` (git-tracked, same
"generated, always re-readable" convention as `index.json`), one entry per attempted Package per
`importAll()` run: `{ time, materialId, version, result, error }`,
`result` ∈ `SUCCESS` / `FAIL_VALIDATION` / `FAIL_DUPLICATE` / `FAIL_ROLLBACK`. Not yet
surfaced in the Settings UI (AI-115-08's own wording only asked for the History to exist "方便
日後追蹤", unlike AI-115-07 which explicitly named a Settings UI) — flagged, not silently
decided.

**AI-115-09 Rollback** — before `ImportManager.js` calls `generate()`, it backs up
`js/data/TeachingMaterialData.js` / `index.json` / `js/data/RepositoryStatus.js` in memory. If
`generate()` throws, all three are restored byte-for-byte — each restore attempt independent and
best-effort, so a restore-write failing at the exact same path that caused the original failure
(a real edge case this Sprint's own regression test caught on its first run) never blocks
restoring the other two files or skips the Import Log entry. Verified by monkey-patching
`fs.writeFileSync` to fail on the `index.json` write mid-`generate()` and confirming both files
return to their exact pre-import bytes, the candidate Package stays `READY_FOR_IMPORT` (never
`IMPORTED`), and a `FAIL_ROLLBACK` entry with the real error message is logged.

**AI-115-10 Regression** — new `tests/regression/MaterialPipelineRegression.js` (37 checks):
real `RAW → ANALYZING → CLAUDE_READY → (RepositoryManager.prepare()) → READY_FOR_IMPORT →
(ImportManager.importAll()) → IMPORTED` progression, then the full downstream chain (Summary /
Quiz / WrongBook / Review / Tutor, browser-side via jsdom, zero console errors), plus dedicated
sections for Duplicate Detection, Rollback, and Import Validation. Wired into `npm test`.
`tests/regression/RepositoryFoundation.js`'s own `[11]` section (which exercises the lower-level
`generate()` path directly, not the new gated pipeline) was updated for the renamed stages/files
only — its scope wasn't expanded, to avoid duplicating what the new file now covers more
thoroughly. All scratch Package directories and `import-log.json`'s content are restored to
their exact pre-test state in every run's `finally` block (backup/restore, same discipline
`RepositoryFoundation.js` already used for `index.json`/`TeachingMaterialData.js`) — `npm test`
never accumulates scratch-test noise into a file real imports are meant to be tracked in.

## Judgment calls (flagged, not silently decided)

1. **"index" in AI-115-02/05's file lists** — read as the single, repository-level `index.json`
   (AI-115-03's own "建立唯一 Index" reaffirms there is only one), not a per-Package file. A
   per-Package `index.json` would contradict "建立唯一 Index" and this Repository has never had
   one.
2. **`ImportManager.js` cannot literally "write to Runtime"** — it is a Node script; every named
   Runtime is browser code. Read as: the sole gate deciding which Packages become visible to the
   existing, unmodified browser bridge (`TeachingMaterialLoader.js`) at all. See its own file
   header and the README's new "Repository Manager / Import Manager" section for the full
   reasoning.
3. **CLAUDE_READY vs READY_FOR_IMPORT split** — the spec lists both as distinct stages but
   doesn't define the boundary between them. Read as: `CLAUDE_READY` = every Package Standard
   input file present, manifest complete/pending_review; `READY_FOR_IMPORT` = that, plus
   `knowledge.json`/`report.md` already derived (`RepositoryManager.prepare()`'s own real
   output) — a genuinely different, checkable condition, not an arbitrary split.
4. **Real subject-field convention bug found and fixed in this Sprint's own test, not the
   pipeline** — `README.md`'s Metadata table previously said `subject` should look like
   `math`/`chinese` (an internal `AHS.Subjects` key); the actual, already-shipped
   `js/runtime/TeachingMaterialLoader.js` (`subjectKeyFromChineseName()`) expects the real
   Chinese display name (`數學`) for this Package track specifically (the *separate*
   `data/materials/` track uses keys directly — a different, pre-existing convention).
   `MaterialPipelineRegression.js` caught this documentation error on its first run (0
   Exam-Mode-compatible questions bridged); `README.md`'s Metadata table corrected, no Runtime/
   Loader code changed (the Loader was already correct — only the doc was wrong).

## Verify / Test

`npm run verify` PASS (0 broken paths / 0 legacy references / 0 forbidden patterns). `npm test`:

- BehaviorSuite **329/329 PASS** (unchanged from before this Sprint — no existing behavior
  touched)
- PipelineRegression **6/6 PASS**
- RepositoryFoundation **29/29 PASS** (its own `[11]` section updated for renamed stages/files)
- MaterialPipelineRegression **37/37 PASS** (new, AI-115-10)

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.

## 修改檔案

- `docs/TeachingMaterials/schema/Manifest.schema.json` — added optional `archived` field
- `docs/TeachingMaterials/scripts/MaterialLifecycle.js` — 6-stage rewrite
- `docs/TeachingMaterials/scripts/ValidateMaterial.js` — `questionbank.json` rename +
  `material.md` check
- `docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js` — `loadPackage()` updated,
  `deriveTitle` exported
- `docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js` — `skipIds` param, archived
  exclusion, `writeRepositoryStatus()`, exports extended
- `docs/TeachingMaterials/scripts/RepositoryManager.js` — new (AI-115-03)
- `docs/TeachingMaterials/scripts/ImportManager.js` — new (AI-115-04/05/06/08/09)
- `docs/TeachingMaterials/README.md` — updated throughout for the above
- `js/ui/SettingsPanel.js` — Repository Status counts (AI-115-07)
- `js/data/RepositoryStatus.js` — new generated file
- `index.html`/`materials.html`/`quiz.html`/`wrongbook.html`/`summary.html`/`learning.html`/
  `tutor.html`/`dashboard.html`/`review.html` — added `RepositoryStatus.js` script tag
- `tests/regression/RepositoryFoundation.js` — `[11]` updated for renamed stages/files
- `tests/regression/MaterialPipelineRegression.js` — new (AI-115-10)
- `package.json` — `test` script extended
