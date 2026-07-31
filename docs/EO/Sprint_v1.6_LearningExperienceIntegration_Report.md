# Sprint_v1.6_LearningExperienceIntegration_Report.md — Learning Experience Integration (v1.0)

## Summary

Sprint v1.6 confirmed both blockers raised against v1.5 are resolved: it explicitly scopes all
verification to Scratch Package data ("本 Sprint 不依賴真實教材") and explicitly authorizes
minimal Material Card navigation additions ("僅新增 Navigation Action"). This report documents
the full learning-loop wiring built and verified against that scope, plus one significant new
architectural finding made while building Module C/D that required an additive `ExamRuntime`
extension and a real field-shape fix inside `TeachingMaterialLoader.js`.

## What was built

**Module A — Material Card Navigation** (`js/ui/MaterialCard.js`): two new `<a href>` elements
— "查看摘要" (`summary.html?materialId=<id>`) and "開始練習"
(`quiz.html?mode=practice&examId=teaching_material_<id>`) — added to the existing
`.mat-card__acts` icon-button row, reusing the `.mat-card__act` class verbatim (zero new CSS).
Plain anchor tags, never `window.location.href=` (this repo's forbidden-pattern rule). Rendered
unconditionally on every card; materials with no real Summary/Exam data behind them simply land
on the target page's own existing Empty State / Exam Mode list — never a crash, never fabricated
content.

**Module B — Summary Navigation**: needed no new code. `summary.html?materialId=...` was already
fully wired (Sprint 6.6, `js/pages/AppSummary.js`) — Module A's new link is the only missing
piece, now added.

**Module C — Quiz Direct Entry**: `js/pages/AppQuiz.js` now reads an `examId` query param and
passes it through `js/components/QuizCenter.js`'s `create()` (new 4th, optional, additive
parameter — every existing caller/behavior unchanged). When present, `QuizCenter.js` calls a
**new, additive** `AHS.ExamRuntime.startFromExam(examId, meta)` instead of the normal
catalog-driven `start()` — this never calls `QuestionBank.generate()` and never touches
`buildExamId()`; it creates a `RUNNING` session directly for an `examId` whose questions were
already written to `QuestionRuntime` by `TeachingMaterialLoader.js`. `meta` (subject/title/
chapter/grade, for display only) is resolved by a new `TeachingMaterialLoader.resolveExamMeta()`
helper, which reverses `examId → runtimeMaterialId → (persisted id map) packageMaterialId →
(already-loaded AHS.TeachingMaterialData) real material fields` — never fabricated. Failure at
any step (no session, unknown examId, another exam already running) falls back to the normal
Exam Mode list, never a broken view.

**Module D — Quiz Completion**: needed no new code — `finishExam()`'s existing
`ExamRuntime.finish()` → `AutoGrader.grade()` → `WrongBookRuntime.sync()` /
`HistoryRuntime.record()` → `ReviewRuntime.build()` chain works unmodified once the questions
entering `QuestionRuntime` are shaped correctly (see the finding below).

**Modules E/F — Wrong Book / Learning Record**: per Module E's own instruction ("若既有流程即可
支援：不得修改"), confirmed the existing flow supports Teaching-Material-sourced exams with zero
`WrongBookRuntime`/`HistoryRuntime` changes, once Module C's underlying shape problem was fixed.

**Module G — Integration QA**: full end-to-end Node `vm` simulation across a materials.html-like
page and a quiz.html-like page, using scratch Package data (see Testing).

## A real architectural finding made while building this (flagged, not hidden)

**`QuestionRuntime.importQuestions()` accepts any shape, but every downstream consumer hard-codes
`QuestionBank`'s native field names.** `AHS.AutoGrader.grade()` reads `q.text`/`q.correctAnswer`/
`q.index`/`q.knowledgePoint`, and `js/ui/QuestionCard.js` reads `question.options[i].key`/`.text`
and looks up `AHS.Subjects[question.subject]` **with no fallback** — an unmapped subject key
would throw. `TeachingMaterialAdapter.convertQuestions()`'s own output (by design, matching
Sprint AI-103's `ImportRuntime.js` precedent) uses `question`/`answer`/plain-string `options` and
carries no `subject`/`index`/`knowledgePoint` at all — genuinely incompatible with this pipeline
as originally shipped in EO-S1.2-001/Sprint v1.4. This was never caught earlier because nothing
had ever actually tried to grade an imported exam through `AutoGrader` before this Sprint (the
same latent gap `ImportRuntime.js`'s own header already flagged for a different import path, just
never exercised).

**Resolution**: fixing this in the Adapter would violate this Sprint's "不得修改
TeachingMaterialAdapter API"; fixing it in `AutoGrader`/`QuestionCard` would mean touching LOCK
Sprint-4 files well beyond "wiring." So the reshaping happens in `TeachingMaterialLoader.js`
(explicitly permitted — Module E: "若需最小修改：僅可修改 Wiring"): a new
`buildExamCompatibleQuestions()` converts each question into the exact shape `AutoGrader`/
`QuestionCard` need, resolving `subject` via a reverse lookup against `AHS.Subjects`' own real
Chinese names (never a separately-invented list) and `correctAnswer` by locating the Package's
literal answer string within its own `options` array.

**Honest, disclosed consequence**: only `single_choice` questions whose `answer` matches one of
their own `options` verbatim, on a material whose `subject` is one of the 9 known Chinese names,
can flow into this Exam-Mode-compatible path. `true_false`/`fill_blank`/`calculation`/`essay`
questions, and any unmappable subject, are skipped here — never fabricated into fake
multiple-choice content. The full Question Bank record is untouched in the Repository/
`TeachingMaterialData.js`; only what feeds this specific Exam-Mode wiring is filtered.

## Testing before relying on any of this (scratch data, never committed)

Built a realistic scratch Package (`tm_996`, 4 questions: 2 valid `single_choice`, 1
`true_false`, 1 `single_choice` with a deliberately unresolvable answer) and ran a full two-page
Node `vm` simulation with the real, unmodified Runtime files:

1. `ValidateMaterial.js tm_996` → 28/28 PASS; `GenerateTeachingMaterialData.js` → 1 material
   included.
2. **materials.html-like page**: `TeachingMaterialLoader.initialize()` → real `MaterialRuntime`/
   `SummaryRuntime` records created correctly (same as Sprint v1.4).
3. **quiz.html-like page**: `QuestionRuntime.getSet(examId).length === 2` — confirmed only the 2
   valid `single_choice` questions were imported; the `true_false` question and the
   unresolvable-answer question were correctly excluded, not fabricated around.
4. `resolveExamMeta()` → real subject/title/chapter/grade, matching the Package exactly.
5. `ExamRuntime.startFromExam(examId, meta)` → real `RUNNING` session, `totalQuestions === 2`.
6. Answered both questions correctly via the real `AnswerRuntime.saveAnswer()` → `finish()` →
   `AutoGrader.grade()` → `accuracy: 100`, `wrong.length: 0`.
7. Re-ran with one deliberately wrong answer → `graded.wrong.length === 1` →
   `WrongBookRuntime.sync(graded)` → a real, correctly-populated wrong-book entry (question text,
   options, your/correct answer, all real) → `WrongBookRuntime.list().length === 1`.
8. `HistoryRuntime.record(graded)` → a real, correctly-populated Learning Record entry
   (subject/title/chapter/score/accuracy/correctCount/totalCount/when) — no code changes needed
   to either Runtime, confirming Module E/F's "既有即可直接 Reuse."
9. `startFromExam()` for an unknown `examId` → `null`, confirmed graceful fallback.
10. **Material Card rendering**: separately verified via a jsdom-backed `vm` context that
    `MaterialCard.create()` renders both new links as real `<a>` elements with the exact expected
    `href`s and the reused `.mat-card__act` class.
11. Scratch Package (`materials/tm_996/`) and the temporary test script deleted immediately
    after; `js/data/TeachingMaterialData.js` regenerated against the real (empty) Repository;
    `git status --short` confirmed clean before committing.

## What was deliberately NOT done

- No real material analyzed (none attached to this Sprint; not required by its own scope).
- `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/`WrongBookRuntime`/
  `TeachingMaterialAdapter` — all confirmed byte-identical. `ExamRuntime.js` gained exactly one
  new, additive function; every pre-existing function untouched.
- No UI/Layout/Design System redesign — two `<a>` tags reusing an existing class; no new CSS.
- `true_false`/`fill_blank`/`calculation`/`essay` questions still cannot be taken as an Exam-Mode
  quiz — an honest, disclosed limitation of the existing single-choice-only `QuestionCard.js`, not
  something this Sprint's scope authorized rebuilding.

## QA

`npm run verify` PASS (0 broken paths, 0 forbidden-pattern hits). `npm test` 175/175 PASS +
`PipelineRegression` 6/6 PASS — including real jsdom loads of every touched page with `Console
errors = 0`. All new logic additionally verified via the two-page `vm` simulation and a separate
jsdom-backed DOM-rendering check above, which jsdom's own single-page BehaviorSuite model doesn't
exercise on its own.

## Ready state

The full learning loop (Material Card → Summary → direct Quiz entry → Finish → Wrong Book →
Learning Record) is real and wired end-to-end for `single_choice` questions, confirmed with
scratch data. The Repository remains genuinely empty. Sprint v1.5's real-material PAT
("Sprint v1.5B") can now run the moment Project Owner provides a real material — with the
disclosed constraint that only its `single_choice` questions will be Exam-Mode-practicable today.
