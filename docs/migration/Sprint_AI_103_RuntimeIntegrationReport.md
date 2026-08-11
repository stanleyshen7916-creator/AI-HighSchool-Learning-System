# RuntimeIntegrationReport.md — Sprint AI-103｜Content Import Runtime

## Summary Table

| Import File | Target Runtime | API Used | Extension Needed? |
|---|---|---|---|
| Material.md | `AHS.MaterialRuntime` | `add(partial)` — existing, unmodified | No |
| Summary.json | `AHS.SummaryRuntime` | `add(record)` — existing, unmodified | No |
| Quiz.json + Answer.json | `AHS.QuestionRuntime` | `importQuestions(examId, questions)` | **Yes — see below** |
| ErrorBook.json | `AHS.WrongBookRuntime` | `sync(gradedResult)` — existing, unmodified | No (reshaped input) |
| Metadata.json | (no Runtime of its own — feeds fields into the above) | — | — |

## Material Runtime Integration

`ImportRuntime.importMaterial()` merges `Material.md`'s optional inline header (`Subject:`/`Grade:`/
`Chapter:`/`Unit:` lines) with `Metadata.json` (which takes precedence when both are present), and
calls `AHS.MaterialRuntime.add({title, subject, grade, chapter, category, content, fileName, fileType})`
— the exact same public API every other real material-creation path in this repository already uses
(upload, batch upload). `title` is taken from the first Markdown `# ` heading in the body; `MaterialRuntime.add()`'s
own existing default (`"未命名教材"`) applies honestly when no heading exists — no invented title.

**Verified**: `tests/regression/ImportRuntimeV1.js` — the returned material's `id` is confirmed to be
a real, queryable record via the existing `MaterialRuntime.getById()`.

## Summary Runtime Integration

`ImportRuntime.importSummary()` calls `AHS.SummaryRuntime.add()` (the LOCK, Sprint-5 5-section
schema) with `coreConcepts` mapped from `Summary.json`'s `KeyPoints`, `memorize` mapped from
`Memory`. **Known, honestly-disclosed gap**: `Summary.json`'s `Keywords` field has no corresponding
slot in this existing, LOCK schema (`coreConcepts`/`definitions`/`pitfalls`/`memorize`/
`reviewSuggestions` — no `keywords` field exists). Rather than silently fold Keywords into
`coreConcepts` (which would mislabel them) or invent a new field on a LOCK schema (forbidden by this
Sprint's own Baseline Lock), `Keywords` is read by `ContentLoader` but intentionally not written
anywhere. This is a real, disclosed limitation, not a defect — matches this project's "honest gap
over fabricated placement" convention.

**Verified**: `tests/regression/ImportRuntimeV1.js` confirms the created record is real and queryable
via `SummaryRuntime.getById()`, and that `coreConcepts`/`memorize` map correctly.

## Question Runtime Integration — the one Runtime Extension

**Gap found**: `AHS.QuestionRuntime` (Sprint 4, Exam Mode Foundation) has exactly one write path,
`loadForExam(examMeta)`, which internally calls `AHS.QuestionBank.generate(examMeta)` — there is no
way to supply externally-authored question content through the existing public API. Modifying
`loadForExam()` itself, or reading directly into its private `store` variable from outside the file,
were both correctly ruled out (`不得重構任何已 LOCK Runtime`).

**Extension applied** (per this Sprint's own explicit instruction: *"若 API 不足：請提出 Runtime
Extension，不得自行建立 Parallel Runtime"*):

```js
function importQuestions(examId, questions) {
  var list = Array.isArray(questions) ? questions : [];
  store[examId] = clone(list);
  return clone(store[examId]);
}
```

- Purely additive: one new function, one new line in the returned public-API object.
- Writes into the exact same `store` object `loadForExam()` already writes to — so every existing
  read method (`hasExam`/`getSet`/`count`/`getQuestion`/`getQuestionById`) transparently sees
  imported questions with zero changes to any of them.
- Does not call, wrap, or alter `AHS.QuestionBank` in any way — that remains `loadForExam()`'s sole,
  untouched route.
- `ImportRuntime.importQuiz()` merges `Quiz.json` (question/options/knowledgePoint) with
  `Answer.json` (answer/explanation) by `id` before calling this method; only the three types this
  Sprint's Import Standard names (`single_choice`/`multiple_choice`/`true_false`) are accepted —
  anything else is dropped with a warning, never silently imported with an invented type.

**Verified**: `tests/regression/ImportRuntimeV1.js` — (1) all 8 pre-existing `QuestionRuntime` methods
confirmed present and callable; (2) `importQuestions()`-written data is confirmed readable through
the pre-existing, unmodified `getSet()`/`count()`/`getQuestionById()`; (3) an unsupported question
type in the test fixture is confirmed skipped with a warning, not imported.

## WrongBook Runtime Integration — no extension needed

`AHS.WrongBookRuntime.sync(gradedResult)` already accepts a generic-enough shape
(`{subject, title, chapter, wrong: [{questionId, text, options, yourAnswer, correctAnswer,
explanation, knowledgePoint}]}`) that `ImportRuntime.importErrorBook()` can reshape `ErrorBook.json`'s
entries into it directly — this is the API being used exactly as designed, not an extension.

**Verified**: real entries appear in `WrongBookRuntime.list()` afterward, with `questionId`/
`correctAnswer`/`explanation` traceability intact.

## Dashboard Refresh — honest disclosure, not a silent gap

This Sprint's own "Existing Runtime（Reuse）" list names `AHS.QuestionRuntime` and
`AHS.WrongBookRuntime` (both Sprint 4, Exam Mode) as the reuse targets for Quiz/ErrorBook import.
**These are confirmed, by direct code inspection, to NOT be what Dashboard actually reads.** Per
Sprint AI-020's real, already-shipped wiring, Dashboard's `hasAnyRealData()` and its stat cards are
driven by `HistoryRuntime`/`WrongBookSession`/`StatisticsRuntime`/`LearningHistoryModel` — a
different set of Runtimes entirely. `AHS.DashboardRuntime` does not exist anywhere in this
repository (`js/components/Dashboard.js` is a UI component, `js/pages/AppDashboard.js` is a page
bootstrap — neither is a Runtime).

**Consequence**: material, summary, quiz, and wrong-book content imported by this Sprint is genuinely
written and fully queryable through `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/
`WrongBookRuntime`'s real, existing APIs — but **will not cause any visible change on the Dashboard
page today**. This is a pre-existing architecture reality (established Sprint AI-020), not something
this Sprint introduced, worsened, or should silently route around by writing into a different
Runtime than the ones this Sprint explicitly named to reuse. Flagged here for PMO visibility rather
than hidden behind a checked "Dashboard Refresh PASS" box that would be misleading.

## No Parallel Runtime Created

Confirmed by source inspection and `git diff`: zero new files named `*MaterialRuntime*`,
`*SummaryRuntime*`, `*WrongBookRuntime*`, `*QuestionRuntime*`, `*ReviewRuntime*`, or
`*DashboardRuntime*` were created. The only Runtime-layer file modified is `QuestionRuntime.js`
itself (additive extension, not a parallel file).
