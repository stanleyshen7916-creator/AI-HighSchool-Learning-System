# Sprint 6.6 — CHANGELOG (Final)
Learning Center Runtime Integration — Issue #026 / #027

## Modified Files

### `js/components/MyLearning.js` (Issue #026, #027)
- Full rewrite of data sourcing: every section now reads real,
  existing Runtimes (`AHS.MaterialRuntime`, `AHS.HistoryRuntime`)
  instead of `AHS.Mock.myLearning` wherever a real signal exists.
- `overview()`: real 累積學習天數 (distinct calendar days with
  `lastLearningAt`), real 完成題數/正確率 (aggregated from
  `AHS.HistoryRuntime`).
- `record()`: 本週 bars real (aggregated `learningTime` by day for the
  current real calendar week); Empty State when no materials exist;
  今日學習重點 is an honest permanent Empty State (no Runtime tracks
  "today's planned focus" anywhere in this repo). 本月/今年/全部 tabs
  unchanged from Round 1 (Disabled + Coming Soon — no historical-period
  Runtime exists).
- `weeklyReport()`: radar chart now real (this-week vs last-week
  per-subject hours from `AHS.MaterialRuntime`); Empty State when no
  materials exist; "查看全部" changed from a dead `href="#"` to an
  explicit Coming Soon indicator.
- `calendar()`: complete rewrite — real system-date-based month/day
  computation, real day-level activity aggregation, real 上一月/下一月/
  今日 navigation (re-renders with real recomputation), real 日期點擊
  feedback (actual minutes for that day, or an honest "沒有學習記錄").
- `progress()`: real per-subject average of `AHS.MaterialRuntime`'s own
  `progress` field; Empty State when no materials exist; "查看全部"
  changed from dead `href="#"` to Coming Soon.
- `badges()`: "分享成就" button (previously had zero event listener)
  now explicitly `disabled` with a Coming Soon `aria-label`; "查看全部"
  changed from dead `href="#"` to Coming Soon. Badge catalog content
  itself unchanged — no achievement-earning Runtime exists anywhere in
  this repo; defining one is new gamification logic, out of scope for
  this Bug Fix (documented in-code and in the Fix Report).

### `learning.html`
- Added `<script>` tags for `js/core/PersistenceAdapter.js`,
  `js/runtime/MaterialRuntime.js`, `js/runtime/HistoryRuntime.js` (all
  pre-existing, unmodified Runtimes — needed so MyLearning.js's new real
  computations have data to read).

### `css/pages/learning.css`
- `.ml-cal__cell` reset to a real `<button>` (day-click is now
  functional) with hover/disabled states.
- New `.ml-badges__share.is-disabled`, `.card__more--soon`,
  `.ml-record__empty` styles.

## Unchanged (confirmed via diff)
All Runtimes (`MaterialRuntime`, `HistoryRuntime`, `KnowledgeRuntime`,
`SummaryRuntime`, `LearningQuestionRuntime`, `QuestionRuntime`),
`PersistenceAdapter.js`, `LearningPipeline.js`, `AppShell.js`,
`MaterialCenter.js`, `SummaryCenter.js`, `QuizCenter.js`, `app.js`,
`app-materials.js`, `app-summary.js`, `tokens.css`, `shell.css`, and
every other page (`index.html`, `materials.html`, `summary.html`,
`quiz.html`, `wrongbook.html`, `review.html`, `dashboard.html`,
`tutor.html`).
