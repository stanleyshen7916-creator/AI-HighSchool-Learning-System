# HOTFIX-004_Review_Quiz_Runtime_Report.md

## Summary

Follow-up to HOTFIX-003 (Material Detail): with Material Card and Detail Modal both correctly
showing the real Civics material, this PAT found two remaining gaps — Summary Center's ⑤ 複習
建議 section stayed empty, and Quiz Center's Practice-Mode entry point (「開始 AI 練習」from
Summary Detail) still showed "尚無 AI 練習題" for a Repository-sourced material even though real
questions exist. Both fixed without touching any protected file
(`MaterialRuntime`/`SummaryRuntime`/`WrongBookRuntime`/`HistoryRuntime`/Material Card/Material
Detail/`TeachingMaterialLoader`/Repository Schema — all confirmed byte-identical).

## Issue 001 — Review Suggestion

**Root cause**: `SummaryRuntime`'s `reviewSuggestions` field genuinely has no source data — neither
Repository record has a field named `reviewSuggestions`, and `TeachingMaterialLoader.js` (protected
this Hotfix) never populated it. `SummaryRuntime.add()` also has no update-in-place API (`sync()`
only creates new records via `SummaryGenerator`), so there was no way to patch the already-stored
record even if a resolver computed suggestions after the fact.

**Fix**: added `deriveReviewSuggestions(record)` directly inside `js/components/SummaryCenter.js`
— used **only** as a rendering-time fallback when `record.reviewSuggestions` is genuinely empty,
computed **entirely from fields the record already has** (`chapter`/`section`/`coreConcepts`/
`memorize`/`pitfalls` — themselves real Repository data, already carried into `SummaryRuntime` by
`TeachingMaterialLoader.js` in HOTFIX-002). No new file, no new Repository lookup, no dependency on
which Repository track the data came from — this works uniformly for any Repository-sourced
material by construction. Real `reviewSuggestions` (if ever populated by a future EO) always wins
unconditionally; a record with no underlying data at all (the honest Stub-pipeline pending state)
still produces `[]`, so the existing "AI 正在分析教材" pending block is completely unaffected.

Three suggestion lines, each from real fields only, never fabricated:
- **建議閱讀順序**: `record.chapter` + `record.section` (e.g. "先複習「第5～6課→...」的內容...")
- **建議複習方式**: real counts of `record.coreConcepts.length` / `record.memorize.length`
- **建議注意事項**: `record.pitfalls` (already real — HOTFIX-002 already derived these from the
  Civics record's own `commonMistakes`), up to 3 entries

## Issue 002 — Quiz Center

**Root cause, found by tracing the actual code path** (not assumed from the ticket text): "巧巧老師
：尚無 AI 練習題" is `js/components/QuestionGuide.js`'s own empty-state string, reachable only via
`quiz.html?mode=practice&materialId=...` — a link `js/components/SummaryCenter.js` has offered
since Sprint 6.8 ("開始 AI 練習"), **unchanged and unrelated to Sprint v1.6's own new `examId` link**.
That guide reads exclusively from `AHS.LearningQuestionRuntime`, which is honestly empty for every
Repository-sourced material (its completeness gate needs a `knowledgeId`/`learningObjective` no
Repository record has — Sprint v1.6's own documented, still-valid reasoning; not fabricated here
either). Sprint v1.6's `examId`-based direct entry into `QuestionRuntime` (Exam Mode) already works
correctly, but only for the *new* link — the pre-existing `materialId`-only link never used it.

**A second bug found in the same investigation**: Sprint v1.6's own Material Card link
(`quiz.html?mode=practice&examId=...`) sets `mode=practice` *and* `examId` together — since
`startOnPractice = (initialMode === "practice")` controlled whether `practiceRoot` (Practice
Mode's own section) was hidden, and that check never considered `examId`, a Repository-sourced
material's Exam view and an unrelated, empty Practice Mode section were both visible at once.

**Fix, in `js/components/QuizCenter.js`**: added `resolveDirectExamId()` — a small, additive
routing function that resolves `initialExamId` when present, or (new) derives
`"teaching_material_" + initialMaterialId` and checks `QuestionRuntime.hasExam()` when only
`initialMaterialId` is given. Either path calls the same, already-built, unmodified
`tryDirectExamEntry()`/`ExamRuntime.startFromExam()` (Sprint v1.6) — never `QuestionBank.generate()`,
never a new Runtime, never re-analysis. `practiceRoot` is now hidden whenever a direct exam id
resolves, regardless of `mode`, fixing the double-render. Regular (non-Repository) materials are
completely unaffected — `resolveDirectExamId()` returns `null` for them and every existing code
path runs exactly as before.

**難度/考點 display**: added to both `js/ui/QuestionCard.js` (Exam Mode) and, via HOTFIX-003's
already-built `MaterialDetailRepositorySource.js`, resolved `difficulty` for the Repository track —
that field never survived into `QuestionRuntime`'s stored shape (`TeachingMaterialLoader.js`,
protected this Hotfix, never carried it over; a real, if narrow, gap left by HOTFIX-002). Rather than
touching the protected Loader, `QuestionCard.js` now looks the real Repository record back up
(read-only, by the question's own real `id` — added as a small, additive field to
`MaterialDetailRepositorySource.js`'s existing quiz mapping, which doesn't change Material Detail's
own rendering at all) and displays `難度` when found. `考點` (`knowledgePoint`) was already present
directly on the stored question object — shown as-is, no lookup needed. Both are omitted, never
fabricated, when the source data doesn't have them (e.g. Mock/`QuestionBank`-generated exam
questions).

## Testing before relying on any of this

Verified against the real, permanent Civics material via jsdom, across both the new
`materialId`-only route and the existing `examId` route: `⑤ 複習建議` shows all three real,
derived suggestion lines (with the actual real chapter/section/counts/pitfalls text, not
placeholders); both Quiz Center entry points land on the same real 6-question Exam view with no
"尚無 AI 練習題" and no double-rendered empty Practice section; 難度/考點 render correctly per
question. Ran the full PAT chain end-to-end on the real data: answered questions (one
deliberately wrong) → `ExamRuntime.finish()` → `AutoGrader.grade()` (correct totals/wrong count) →
`WrongBookRuntime.sync()` (1 real entry) → `HistoryRuntime.record()` (1 real entry) — all through
the completely unmodified Sprint-4 chain. Separately confirmed: a regular material's Summary still
shows the honest "AI 正在分析教材" pending state (not suggestions derived from nothing), and a
regular material's Practice/Guide flow still honestly shows "尚無 AI 練習題" — neither path
touched by this Hotfix's changes.

## What was deliberately NOT done

- No protected file modified: `MaterialRuntime.js`, `SummaryRuntime.js`, `WrongBookRuntime.js`,
  `HistoryRuntime.js`, `MaterialCard.js`, `MaterialContentView.js`/`MaterialSummaryCard.js`/
  `MaterialQuestionCard.js`/`AIGatewayPanel.js`/`MaterialPreview.js` (Material Detail's own
  components), `TeachingMaterialLoader.js`, and both Repository schemas are all confirmed
  byte-identical.
- No new Runtime created; no Repository write path added — `Runtime Rule`'s "所有 Runtime 只能讀"
  is unaffected, since nothing here writes back to either Repository.
- `reviewSuggestions` is never written into `SummaryRuntime`'s actual stored record — it's derived
  purely at render time in `SummaryCenter.js`, exactly mirroring the pattern HOTFIX-003 already
  established for Material Detail's own sections.
- No AI Gateway call, no re-analysis, no new question generation anywhere in this Hotfix.

## QA

`npm run verify` PASS. `npm test` 211/211 PASS (194 prior + 17 new, from a new regression-test
group covering both issues plus their respective no-regression checks) + `PipelineRegression` 6/6
PASS. Coverage increased, not decreased.

## Ready state

PR remains open (not merged — this Hotfix's commits are added to the same, still-open PR carrying
HOTFIX-003, per "不得直接 Merge。等待 Project Owner PAT."), awaiting Project Owner's live PAT
re-verification of both this Hotfix and HOTFIX-003 together.
