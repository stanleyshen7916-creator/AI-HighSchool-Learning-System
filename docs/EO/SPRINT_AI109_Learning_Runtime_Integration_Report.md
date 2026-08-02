# SPRINT_AI109_Learning_Runtime_Integration_Report.md

## Summary

Sprint AI-109 asked for seven items (AI-601 – AI-607). Four are completed and merged (AI-601,
AI-602, AI-604, plus AI-603 verified already substantially satisfied by prior EOs). Three
(AI-605, AI-606, AI-607) are **not implemented** — each one textually contradicts this Sprint's
own stated Rules ("不新增功能、不重新設計 UI、不修改 UI Baseline"), and each would require
exactly the kind of change those Rules forbid. Rather than guess which instruction should win,
they are reported here with concrete evidence for an explicit Project Owner decision.

## Root Cause (the real "Runtime 孤島" this Sprint asked to close)

Tracing the actual data flow (not assumed): `AHS.WrongBookRuntime` and `AHS.HistoryRuntime` —
the two Sprint-4 stores the real Exam-Mode chain (`AutoGrader.grade()` → `WrongBookRuntime.sync()`
/ `HistoryRuntime.record()`) writes into, and that `js/components/WrongBook.js` (錯題本) /
`js/components/QuizCenter.js` (測驗中心) actually read from — were **plain in-memory stores with
no `AHS.PersistenceAdapter` hydrate/persist calls anywhere in either file**. Every other Runtime in
this app (`MaterialRuntime`, `SummaryRuntime`, …) already persists via the Adapter; these two never
did. In this multi-page, no-router app, every page navigation re-evaluates each `<script>`'s IIFE
from scratch — so a real wrong answer recorded via `sync()` on `quiz.html` was silently lost the
instant the user navigated to `wrongbook.html`. Every previous PAT in this session verified the
Exam-Mode chain end-to-end (AutoGrader → WrongBook → History) but always within **one simulated
jsdom `window`**, which never exercises a real page navigation — so this gap was never caught
until this Sprint's own cross-page test (see Testing, below) reproduced it directly.

## Runtime Flow (after this Sprint)

```
Repository → MaterialRuntime → QuestionRuntime (Exam Mode)
                                     │
                                     ▼
                          AutoGrader.grade() (now passes q.materialId through)
                                     │
                    ┌────────────────┼─────────────────┐
                    ▼                                   ▼
      WrongBookRuntime.sync()                 HistoryRuntime.record()
   (now PersistenceAdapter-backed)          (now PersistenceAdapter-backed)
                    │                                   │
                    ▼                                   ▼
        錯題本 (WrongBook.js, unchanged)      StatisticsRuntime (unchanged, derives live)
                                                          │
                                                          ▼
                                    測驗中心 repositoryExamCatalog() — real
                                    正確率/最高分/完成狀態 per Repository material
                                                          │
                                                          ▼
                                    複習中心 (AppReview.js, unchanged) — 最近複習/
                                    今日已完成/本週完成, already real via HistoryRuntime
```

`AHS.LearningQuestionRuntime`/`AHS.WrongBookSession`/`AHS.ReviewQueue`/`AHS.ReviewModel` (the
separate Practice-Mode pipeline, feeding `js/components/ReviewWidget.js`'s 間隔複習 section) remain
untouched and fully separate — "兩者不得混用" (the LOCK this whole session has consistently
preserved) still holds; nothing here reads or writes across the two pipelines.

## AI-601 — WrongBook Runtime Integration (DONE)

**Root cause**: see above. **Fix**:
- `js/runtime/WrongBookRuntime.js`: added `hydrate()`/`persist()` (identical pattern to
  `MaterialRuntime.js`), called after `sync()`, `toggleBookmark()`, and `reset()`. Public API
  unchanged.
- `js/runtime/AutoGrader.js`: each `results`/`wrong` entry now additionally carries
  `materialId: q.materialId || ""` — real, already-existing data on the question record (set by
  `TeachingMaterialLoader.js` since HOTFIX-002), never fabricated; `""` for Mock/QuestionBank
  questions with no real material behind them. Purely additive field, no existing field touched.
- `js/runtime/WrongBookRuntime.js`'s `sync()`: stores this as `materialId` on each wrong-book
  record — the real "教材來源" this task required. All eight required fields now present: 題目
  (`question`), 正確答案 (`correctAnswer`), 使用者答案 (`yourAnswer`), 錯誤次數 (`errorCount`),
  最近錯誤時間 (`lastError`), 教材來源 (`materialId`, new), 科目 (`subject`), 章節 (`chapter`) —
  all pre-existing except `materialId`.

## AI-602 — Quiz Runtime Integration (DONE)

**Fix**:
- `js/runtime/HistoryRuntime.js`: same `hydrate()`/`persist()` fix as WrongBookRuntime — 測驗次數/
  最高分/歷史紀錄 now survive page navigation, not just a same-page session (which already worked;
  `js/components/QuizCenter.js`'s `showList()`/`history()` already re-read live Runtime state on
  every render — no reload was ever needed there).
- `js/components/QuizCenter.js`'s `repositoryExamCatalog()` (HOTFIX-005 AI-501's own resolver): the
  `progress`/`accuracy`/`best`/`done` fields it emits per Repository material were hardcoded to
  `0`/`false` placeholders left over from that Hotfix. New `realStatsFor(examId)` computes them for
  real from `AHS.HistoryRuntime.list()` filtered by the material's own `examId` — `done` when any
  attempt exists, `best` = max real score, `accuracy` = most recent real attempt's accuracy,
  `progress` = 100 once attempted (Exam Mode has no partial-progress concept, matching the existing
  Mock item semantics). A material never attempted stays honestly `0`/`false`.

## AI-603 — Review Runtime Integration (verified already substantially real; one field
intentionally left as-is — see judgment call)

Tracing `js/pages/AppReview.js` (複習中心's actual bootstrap) found three of the four requested
concepts **already wired to real data by prior EOs**, not islands:
- **最近複習** (`ReviewRecentSession`) — already `AHS.HistoryRuntime.list()[0]`, real.
- **今日已完成/本週完成** (`ReviewHomeCard`'s `doneToday`/`doneWeek`) — already derived from real
  `HistoryRuntime` records' `when` timestamps.
- **間隔複習** (`ReviewWidget`, Sprint AI-015G) — already 100% real, sourced from the Practice-Mode
  `WrongBookSession → ReviewQueue → ReviewModel` chain, confirmed by that Sprint's own report as
  "the one real, already-Production-connected Review consumer."

**Judgment call (flagged, not silently changed)**: `dueToday` (今日待複習) is hardcoded to `0` by
an explicit, documented PMO ruling ("no due-date concept exists anywhere in the repository").
Making it reflect a real non-zero wrong-item count without also building the missing feature behind
it would make things *worse*, not better: `js/components/ReviewQuickAction.js`'s own
`dueToday > 0` branch is real code that is honestly documented as "currently unreachable," and its
action is the literal message **"Review Session 尚未實作"** ("not yet implemented"). Turning
`dueToday` into a real, inviting number would surface that stub message as the primary action of a
now-nonzero-looking card — a dishonest-looking regression, not a fix. Building the actual Review
Session feature behind it would satisfy this literally, but is a **new feature**, which this
Sprint's own Rules explicitly forbid ("不新增功能"). Left untouched; flagged for an explicit PMO/PO
decision on which instruction should win.

Separately: `ReviewWidget`'s 間隔複習 only ever reflects Practice-Mode (`WrongBookSession`) data —
a real Exam-Mode wrong answer (the only kind the one real Civics material can produce) does not
appear there, because `ReviewQueue.enqueue()` validates every `questionId` against
`WrongBookSession.getByQuestionId()`, a completely different id space than Exam-Mode's
`QuestionRuntime` question ids. Merging the two WrongBook pipelines into one queue is a real,
substantial architectural project (new validation paths, new id reconciliation, likely new Runtime
surface) — the kind of change "不新增功能"/"不得重寫 Runtime API" was written to prevent. Not
attempted; flagged.

## AI-604 — Repository Subject Synchronization (DONE)

**Root cause**: `AHS.AppConfig.quiz.subjects` is a fixed array
(`["all", "math", "english", "physics", "chemistry", "biology"]`) — "civics" (公民) was never in it,
even though `repositoryExamCatalog()` (HOTFIX-005) already emits real `subject: "civics"` items.

**Fix**: `QuizCenter.js`'s `mergedListData()` (already built in HOTFIX-005 to append Repository
rows to `data.items`) now also appends any real, `AHS.Subjects`-valid subject key found among those
rows to a **local copy** of `data.subjects` — `AHS.AppConfig.quiz.subjects` itself is never
mutated, so this only affects the actual current render, and every existing Mock subject/filter
still works unchanged.

## AI-605 / AI-606 / AI-607 — NOT implemented (flagged, contradicts this Sprint's own Rules)

- **AI-605 (AI Tutor)**: `tutor.html`'s live page (`js/components/AiTutor.js`) is a 100%
  Mock-driven chat UI — `model = AHS.AppConfig.aiTutorPage`, canned replies, static
  suggestions/history/resources — with **no existing section** for "今日弱點/建議複習教材/建議再次
  測驗/推薦錯題/建議學習順序." It does not even `<script>`-tag `AHS.AITutorRuntime.js`. Making these
  five real would require adding new UI sections/components to this page — literally "新增功能" and
  "重新設計 UI," which this Sprint's own Objective explicitly forbids in the same sentence it asks
  for this. Not attempted without a clarifying decision.
- **AI-606 (Module Responsibility Refactor)**: explicitly redefines what 測驗中心/錯題本/複習中心/
  我的學習 each may and may not contain — by construction this means moving/removing existing,
  real, working UI between four pages. This is "重新設計 UI" and "修改 UI Baseline" by definition,
  both explicitly forbidden by this Sprint's Rules section.
- **AI-607 (Navigation Update)**: reorders/replaces the sitewide navigation menu across every page
  ("全站同步") — again explicitly "UI Baseline."

All three are reported with concrete evidence rather than guessed at, per this session's own
governing instruction to report architectural conflicts rather than silently work around them. If
the Project Owner confirms these three should proceed despite the stated Rules (i.e., the Rules
apply only to AI-601–604, or are superseded for AI-605–607 specifically), a follow-up Sprint can
implement them with that explicit scope.

## What was deliberately NOT done

- No new Runtime created; no existing Runtime's Public API renamed or removed (`materialId` is a
  purely additive field on `AutoGrader.grade()`'s output and `WrongBookRuntime`'s stored record).
- No Repository Schema change.
- `AHS.AppConfig.quiz.subjects`/`.items` (Mock config) never mutated — only a local copy used for
  one render.
- No merge of the Practice-Mode and Exam-Mode WrongBook/Review pipelines — see AI-603's judgment
  call.
- No UI/navigation changes anywhere (AI-605/606/607) — see above.

## 修改檔案

- `js/runtime/WrongBookRuntime.js` — persistence + `materialId` field
- `js/runtime/HistoryRuntime.js` — persistence
- `js/runtime/AutoGrader.js` — additive `materialId` passthrough
- `js/components/QuizCenter.js` — real per-material stats (`realStatsFor`), dynamic subject chips
- `tests/jsdom/BehaviorSuite.js` — new group [33], 8 checks, real cross-page journey
- `docs/EO/SPRINT_AI109_Learning_Runtime_Integration_Report.md` (this file)
- `docs/PMO/PROJECT_STATUS.json`, `docs/PMO/SPRINT.json`

## Testing before relying on any of this

New group [33] simulates a **real cross-page browser journey** for the first time in this
session's test suite (previous PATs always stayed within one simulated `window`): `quiz.html`
(answer the real Civics exam, one question deliberately wrong, finish/grade/sync/record) →
carry `sessionStorage` forward exactly as a real tab does → fresh `wrongbook.html` load (confirms
the wrong entry, all 8 required fields, and that the actual WrongBook *page* — not just the Runtime
— renders it) → fresh `quiz.html` load (confirms the Repository row now shows real 100% progress /
real accuracy / real best score / `is-done`, and that "公民" appears as a real filter chip).

Full suite: **258/258 PASS** (250 prior + 8 new). `PipelineRegression`: **6/6 PASS**. `npm run
verify`: PASS.

## QA

`npm run verify` PASS. `npm test` 258/258 PASS. `PipelineRegression` 6/6 PASS. Coverage increased.

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.

## Acceptance (against this report's actual scope)

- ☑ 錯題立即累積（且跨頁存活，此前並未做到）
- ☑ 測驗中心統計更新（且跨頁存活）
- ☑ 複習中心有資料（最近複習／今日已完成／間隔複習皆真實；今日待複習維持既有 PMO 裁定的 0，理由見上）
- ☑ 科目依 Repository 自動建立
- ☐ AI Tutor 提供真實建議 — 需要新增 UI，與本 Sprint「不新增功能」規則衝突，待裁示
- ☐ 我的學習資料完整 / 四個中心責任明確 / 全站導覽同步 — AI-606/607，與本 Sprint「不修改 UI
  Baseline」規則衝突，待裁示
- ☑ Runtime 全流程同步（AI-601–604 涉及的鏈路）
