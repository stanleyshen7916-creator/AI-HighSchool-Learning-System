# Sprint AI-108｜Release Candidate — RC-01 Repository Audit Report

## Repository Structure vs AI-104A Baseline

Confirmed consistent with `docs/Architecture/Architecture_Repository_Structure_vNext.md`
(the AI-104A baseline, generated from real repository inspection): top-level directories
(`ai-engine/`, `assets/`, `css/`, `docs/`, `js/`, `platform/`, `shared/`, `scripts/`, `tests/`,
root `*.html` + `CLAUDE.md`/`ChangedFiles.txt`/`LICENSE`/`README.md`/`package.json`/
`package-lock.json`) match exactly — no stray root files, no unauthorized top-level
folders (`/import`/`/data` still correctly absent), no accidentally-tracked empty
directories beyond the two documented placeholder scaffolds (`platform/`, `shared/`,
`.gitkeep` only, unchanged, not populated).

`js/` remains the documented nine categories. Real current counts (grown since AI-104A
via authorized Sprint work — AI-103 added 4 `runtime/` files, AI-105 added 1 `ui/` file,
AI-107 removed 1 `ui/` file):

| Category | AI-104A count | Current count | Delta reason |
|---|---:|---:|---|
| `core/` | 4 | 4 | — |
| `runtime/` | 32 | 34 | +4 (AI-103: `ImportRuntime`/`ImportValidator`/`ContentLoader`/`MetadataParser`) |
| `parser/` | 14 | 14 | — |
| `pages/` | 9 | 9 | — |
| `components/` | 22 | 23 | (pre-existing drift, not from this Sprint's changes) |
| `ui/` | 21 | 22 | +1 (AI-105: `MaterialContentView`), −1 (AI-107: `MaterialSubjectTabs`, see below) |
| `data/` | 5 | 5 | — |
| `utils/` | 5 | 5 | — |
| `ai/` | 3 | 3 | — |

## Findings

### 1. Removed — genuinely unused component: `js/ui/MaterialSubjectTabs.js`

Script-tagged in `materials.html` but never instantiated anywhere (`AHS.MaterialSubjectTabs`
had zero references outside its own file). Confirmed superseded: `MaterialCenter.js` wires
`AHS.MaterialCategoryTabs.create()`, not `MaterialSubjectTabs` — this is the M013-era subject
tab component that was replaced by `MaterialCategoryTabs` and never removed. **Removed**: the
file, its `<script>` tag in `materials.html`, its now-dead `.mat-subject-tabs*` CSS rules in
`css/pages/material.css`, and its listing in `docs/Architecture/ComponentInventory.md`
(corrected, not left stale). Verified zero references remain anywhere in `js/`, `tests/`, or
any `*.html`; `npm test`/`npm run verify` confirmed unaffected (175/175, 6/6, PASS).

### 2. Removed — 2 leftover debug statements

- `js/ui/AppShell.js` — `console.log("Profile Menu：" + actionId)` inside the (Mock/
  prototype, non-functional) Profile Menu handler. Removed; menu still closes correctly.
- `js/ui/MaterialCard.js` — `console.log(item.id)` on every material card click, originally
  added years earlier to satisfy an early acceptance check (`MAT-F001`) long since
  superseded by the real preview-opening behavior on the very next line. Removed.

Both were pure `console.log` calls with no user-facing effect; removal is behavior-neutral
(confirmed via full regression re-run below).

### 3. Confirmed clean — no other issues found

- **No TODO/FIXME/HACK** anywhere in `js/`, `css/`, or `ai-engine/` (0 matches).
- **No temp/backup/fixture files** tracked outside `tests/` (`.tmp`/`.bak`/`.orig`/`.swp`/`~`:
  0 matches; scratch/debug/temp-named files outside `tests/`: only `.gitkeep` placeholders
  and one false-positive substring match inside `PromptTemplate.js`'s own filename).
- **0 unreferenced CSS files** (every `.css` file is `<link>`-tagged in at least one page).
- **0 unused components/ui widgets** remaining after the fix above (every `AHS.<Name>` in
  `js/components/` and `js/ui/` is referenced by at least one other file).

### 4. Disclosed, not removed — documented Foundation/deferred code (28 files)

28 `.js` files exist but are not `<script>`-tagged in any HTML page. All 28 are
**previously-documented, intentionally-unwired Foundation or Interface-only code**, each
independently verified via its own regression suite even though not yet page-wired —
consistent with this repository's own established "build Runtime first, wire UI later"
precedent (explicitly named in the Sprint AI-103 Implementation Report):

- **17 files** — `ai-engine/src/{context,core,knowledge,prompt,providers}/*`: the AI Engine's
  Foundation layers (Context Manager, Core AIEngine/Factory/ServiceRegistry, Knowledge
  Registry/Provider/Index, Prompt Manager/Registry/Template/Context, Provider
  Base/Factory/Manager/Registry), all explicitly documented in
  `Architecture_Repository_Structure_vNext.md` as real, tested, Foundation-only code —
  "page wiring is a future EO."
- **6 files** — `js/data/{MockData,ExamData,TasksData}.js`: explicitly named as legitimate
  `data/` category members in `CLAUDE.md`'s own Project Overview; historical/reserve mock
  data, kept as documented, not dead code to remove.
- **3 files** — `js/parser/AIProviderInterface.js`, `js/runtime/{AnswerBuilderRuntime,
  ExamBankRuntime}.js`: PMO "Foundation Only" / "Interface Only" LOCK decisions (Decision 4/5,
  `KnowledgeFoundationV1.js`'s own header) — deliberately not bound to any real Provider or
  page yet.
- **4 files** — `js/runtime/{ImportRuntime,ImportValidator,ContentLoader,MetadataParser}.js`:
  Sprint AI-103's Content Import Runtime — its own Implementation Report explicitly disclosed
  "Import Wizard UI is deferred, not built this Sprint... wiring a real UI trigger is left to
  a future Sprint."

None of these 28 are candidates for deletion (they are real, tested, PMO-documented Foundation
work, not orphaned mistakes) and none are candidates for wiring in this Sprint (RC-01 is
audit-only; wiring them would be a new feature, explicitly forbidden this Sprint). Carried
forward honestly into RC-05's Known Limitations.

## Verification

`npm run verify` PASS, `npm test` 175/175 + 6/6 PASS after the RC-01 cleanup (full numbers in
the RC-08 Final QA section of the Release Candidate Report).

## Result: Repository Audit **PASS**
