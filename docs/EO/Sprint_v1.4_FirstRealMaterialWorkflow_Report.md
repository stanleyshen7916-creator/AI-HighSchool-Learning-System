# Sprint_v1.4_FirstRealMaterialWorkflow_Report.md — First Real Material Workflow (v1.0)

## Summary

Sprint v1.3 ("Teaching Material Runtime Integration") was reported back with three concrete
conflicts before implementation: (1) the Repository Loader it described as a live in-browser
read is architecturally impossible (no `fetch()`, no build tool); (2) Material Card's requested
出版社/關鍵字/教材來源 fields have no home in `MaterialRuntime`'s schema or `MaterialCard.js`'s
render code, and adding either is forbidden by that same Sprint's own Constraints; (3) no real
material exists in the Repository or was attached. Sprint v1.4 adopts exactly the resolution
proposed for (1) — an offline generator producing a static `js/data/` file, the same convention
`MockData.js`/`ExamData.js` already use — and narrows scope so (2) doesn't recur (Material Card
fields aren't requested here) and (3) is handled by scoping "Integration QA" to an automated,
scratch-Package test rather than requiring real material up front. This report documents what
was built against that narrowed, now-buildable scope, plus one new architectural finding
discovered while wiring Module F (Practice).

## What was built

**Module A — `docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js`** (new): scans
`materials/`, and for every Package that both has a loadable `metadata.json` and passes
`TeachingMaterialAdapter.validatePackage()` (ValidateMaterial.js, reused unmodified — a broken
Package is skipped with a `console.warn`, never silently inlined), converts it through the
unmodified `TeachingMaterialAdapter` and writes `js/data/TeachingMaterialData.js`: a plain
static array (`AHS.TeachingMaterialData`), `<script>`-tagged exactly like `MockData.js`. No
`fetch()`/XHR/bundler/build step anywhere — the JSON is inlined offline, by a Node script run
manually or by Claude, per this Sprint's own "可手動執行。可由 Claude 執行."

**Module B — `js/runtime/TeachingMaterialLoader.js`** (new, browser, coordinator only — no
material-content store of its own, same pattern as `js/runtime/ImportRuntime.js`):
`AHS.TeachingMaterialLoader.initialize()` reads `AHS.TeachingMaterialData` and calls only
existing, unmodified `MaterialRuntime.add()` / `SummaryRuntime.add()` /
`QuestionRuntime.importQuestions()`.

**Module C — Bootstrap Integration**: `<script>` tags for `js/data/TeachingMaterialData.js` and
`js/runtime/TeachingMaterialLoader.js` added to `materials.html` and `quiz.html`;
`AHS.TeachingMaterialLoader.initialize()` called once at the top of `init()` in
`js/pages/AppMaterials.js` and `js/pages/AppQuiz.js`, before either page's component reads
Runtime data.

**Modules D/E — Material Center / Summary Wiring**: no code changes needed — both already read
exclusively through `MaterialRuntime.list()`/`isEmpty()` and
`SummaryRuntime.findByMaterialId()`/`list()`. Verified, not assumed (see Testing below).

**Module F — Practice Wiring**: `TeachingMaterialLoader` re-runs on `quiz.html` (not just
`materials.html`) specifically because `QuestionRuntime` is intentionally memory-only and isn't
even `<script>`-tagged on `materials.html` — see the architectural finding below for why this
was necessary and what it does/doesn't achieve.

**Module G — Integration QA**: full multi-page simulation against scratch data (see Testing).

**`docs/TeachingMaterials/README.md`**: new "Runtime Wiring" section replacing the stale
"Explicitly out of scope" framing (which is no longer accurate — the Repository is now
genuinely live), workflow diagram and QA checklist updated with the new generator step.

## A real architectural finding made while building this (flagged, not hidden)

**MaterialRuntime/SummaryRuntime rehydrate from sessionStorage on every page load; QuestionRuntime
does not.** This app is a classic multi-page site — every navigation is a full page reload,
re-executing every `<script>` from scratch. `MaterialRuntime`/`SummaryRuntime` are
sessionStorage-persisted (`js/core/PersistenceAdapter.js`) and therefore rehydrate previously
-added records on every reload; a naive Loader calling `MaterialRuntime.add()` again on a
revisit would silently create a duplicate record every single time. `QuestionRuntime`, by
contrast, is deliberately memory-only (per `docs/PMO/PROJECT_STATUS.json`'s own
`runtimePersistence.notCovered` list) and is not `<script>`-tagged on `materials.html` at all —
so anything the Loader wrote to it there would already be gone by the time a user reaches
`quiz.html`.

**Resolution** (judgment call, not spelled out by the Sprint, but required for correctness):
the Loader persists a small `{ Package materialId → MaterialRuntime record id }` map of its own,
through the same already-LOCK `PersistenceAdapter` every Runtime already uses, purely to
recognize "already added this session" and skip re-adding to `MaterialRuntime`/`SummaryRuntime`.
`QuestionRuntime.importQuestions()`, by contrast, is deliberately re-run on every page load where
`AHS.QuestionRuntime` exists (guarded by `hasExam()` against a same-page double-call), resolving
the real `MaterialRuntime` id via that persisted map even on a page (`quiz.html`) that never
loads `MaterialRuntime.js` itself.

**A second, more fundamental finding**: this app already draws a hard, pre-existing,
explicitly-commented line in `js/components/QuizCenter.js` between "練習模式" (Practice Mode —
reads *only* `AHS.LearningQuestionRuntime`) and Exam Mode (reads *only* `AHS.QuestionRuntime`) —
"兩者不得混用." The Adapter (per `EO_S1.2-001_Report.md`'s own judgment call 5) targets
`QuestionRuntime`, so Teaching Material questions are genuinely stored and queryable there
(`hasExam()`/`getSet()` correctly reflect them — confirmed by test) but are reachable only
through Exam Mode's `examId`, not through the "開始練習" button a student would actually click
(that button is wired to `LearningQuestionRuntime`, a different Runtime, by long-standing,
pre-existing app design). Exam Mode's own session list is driven by a fixed catalog
(`ExamData.js`, via `ExamRuntime.start()`), with no dynamic entry point for an externally
-imported `examId` — so there is currently no live UI path for a student to reach this content.
This is the exact same category of gap `js/runtime/ImportRuntime.js`'s own header already
disclosed for a different import format ("imported content is genuinely written and queryable
... but will not visibly appear ... today") — an honest, pre-existing UI-wiring gap, not
something this Sprint's own Constraints ("不得重新設計 UI") permit fixing. The data-level wiring
this Sprint asked for (Adapter → Runtime, verified reachable via existing Runtime query APIs) is
complete; a live click-through path into Exam Mode is out of scope here.

## Testing before relying on any of this (scratch data, never committed)

Built a realistic scratch Package (`tm_997`, `materialType: TEXTBOOK`, 2 questions covering
`ORIGINAL`/`AI_GENERATED`) and ran a full multi-page simulation in an isolated Node `vm` context
— a genuinely stronger test than jsdom's single-page model can offer here, since the bug being
tested for is specifically about behavior *across* page reloads:

1. `ValidateMaterial.js tm_997` → 18/18 PASS.
2. `GenerateTeachingMaterialData.js` → correctly picked up the scratch Package, produced a
   1-entry `js/data/TeachingMaterialData.js`.
3. **Page load #1 (`materials.html`, first visit)**: loaded the real, unmodified
   `PersistenceAdapter.js`/`MaterialRuntime.js`/`SummaryRuntime.js` plus the generated data file
   and the Loader into a fresh `vm` context with a shared, persistent `sessionStorage` mock.
   `initialize()` → `MaterialRuntime.list().length === 1`, record fields correct
   (`title`/`chapter`/`category`/`grade`/`subject` all real, non-fabricated); `SummaryRuntime`
   record correctly threaded with `materialId: "rt_1"` (the real assigned id, not the Package's
   `tm_997`).
4. **Page load #2 (`materials.html` revisited)**: a fresh `vm` context (simulating a full page
   reload — all module-level state reset) but the *same* `sessionStorage` mock (simulating the
   same browser tab). `initialize()` → `MaterialRuntime.list().length` still `1`,
   `SummaryRuntime.list().length` still `1` — **no duplicate**, confirming the id-map fix works.
5. **Page load #3 (`quiz.html`)**: fresh `vm` context loading `QuestionBank.js`/
   `QuestionRuntime.js`/`SummaryRuntime.js` (deliberately **not** `MaterialRuntime.js`, matching
   the real `quiz.html` script list) plus the same data file and Loader, same shared
   `sessionStorage`. `initialize()` → `QuestionRuntime.hasExam("teaching_material_rt_1")` is
   `true`, `getSet()` returns both real questions with `materialId: "rt_1"` correctly resolved
   *without* `MaterialRuntime.js` being loaded on this page — proving the persisted id-map
   threading works cross-page, not just on paper.
6. Called `initialize()` a second time within page #3 → question count unchanged (same-page
   idempotency guard confirmed).
7. **Fallback**: a genuinely fresh session (fresh `sessionStorage`, nothing hydrated) with
   `AHS.TeachingMaterialData = []` → `MaterialRuntime.isEmpty()` is `true` — the natural Empty
   State is untouched. (An earlier version of this check reused the same `sessionStorage` mock
   already carrying `tm_997`'s state and produced a false failure — a test-harness mistake on my
   part, not a Loader bug; corrected before relying on the result.)
8. Scratch Package (`materials/tm_997/`) and the temporary Node test script deleted immediately
   after; `js/data/TeachingMaterialData.js` regenerated against the real (empty) Repository
   (`AHS.TeachingMaterialData = []`); `git status --short` confirmed clean before committing.

## What was deliberately NOT done

- No real material analyzed (none was attached to this Sprint).
- No new Runtime created; no `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/
  `TeachingMaterialAdapter` API changed — all confirmed byte-identical.
- No new UI. `MaterialCard.js`, `SummaryCenter.js`, `QuizCenter.js` are untouched; Material
  Card's 出版社/關鍵字/教材來源 gap (Sprint v1.3) remains unresolved, not silently patched.
- No live UI path into Exam Mode for a Teaching-Material-sourced `examId` — see the
  architectural finding above.
- No `related.json` wiring — still no Runtime concept exists for it (per
  `EO_S1.2-001_Report.md`'s judgment call 9); the Loader doesn't touch it.

## QA

`npm run verify` PASS (0 broken paths, 0 legacy references, 0 forbidden-pattern hits — the new
`js/runtime/TeachingMaterialLoader.js` and generated `js/data/TeachingMaterialData.js` contain
no `fetch`/XHR/localStorage/indexedDB/import/export). `npm test` 175/175 PASS +
`PipelineRegression` 6/6 PASS — including jsdom's own real page loads of `materials.html` and
`quiz.html` with the new `<script>` tags and bootstrap calls, confirming `Console errors = 0` on
both. Loader logic additionally verified via the multi-page `vm` simulation above, which jsdom's
single-page-per-run model can't exercise on its own.

## Ready state

The full pipeline (Teaching Material → Repository → Generator → Loader → Adapter →
MaterialRuntime → Material Center → Summary → QuestionRuntime) is real and wired end-to-end,
confirmed with scratch data. The Repository itself remains genuinely empty
(`js/data/TeachingMaterialData.js` currently `AHS.TeachingMaterialData = []`) — ready for
Project Owner's first real material: once analyzed into a Package and the generator is re-run,
it will appear on Material Center and Summary automatically, and its questions will be real and
queryable in `QuestionRuntime` on `quiz.html` (though not yet reachable via a live button, per
the disclosed gap above).
