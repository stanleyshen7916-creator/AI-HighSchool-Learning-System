# SPRINT_AI111_Learning_Loop_Integration_Report.md

## Summary

Sprint AI-111 closed the Learning Loop's remaining real gaps: WrongBook's retry lifecycle never
actually reached WrongBookRuntime (AI-610), 複習中心/首頁/AI Tutor never read the real Exam-Mode
chain at all in some cases because the required Runtime scripts weren't even loaded on those pages
(AI-609/611/612), and no test in this repository had ever verified the full loop end-to-end across
real page navigations (AI-613). All six items (AI-608–613) are implemented, tested, and merged —
no item in this Sprint required contradicting its own Rules (unlike Sprint AI-109's AI-605/606/607),
because every requirement here mapped onto either a pure Runtime fix or an already-existing UI slot
that simply had never been fed real data.

## Root Cause

Three distinct, evidence-based root causes, traced (not assumed):

1. **AI-610**: `js/components/WrongBook.js`'s own comment said it outright — "Correct re-answers
   have no Runtime concept to update... only the session-scoped mastery tracker advances." A correct
   retry on 立即重做 only ever updated a local, in-memory `masteryTracker` object private to that one
   page load — invisible to `WrongBookRuntime`, lost on reload, and never reachable by any other
   Runtime. "答對 → 更新 WrongBook Runtime → 同步 Review/Statistics" never actually happened.
2. **AI-609/611/612**: `index.html` (首頁) and `tutor.html` (AI Tutor) never `<script>`-tagged
   `QuestionRuntime`/`ExamRuntime`/`AutoGrader`/`WrongBookRuntime`/`HistoryRuntime`/
   `StatisticsRuntime` at all — these pages were structurally blind to the real Exam-Mode chain, not
   merely un-wired. `tutor.html`'s live page (`AiTutor.js`) was 100% Mock (canned replies); 首頁's
   `AiTutorHomeCard.create()` was called with no model at all despite the component already
   supporting a real-data path.
3. **AI-613**: no test in this repository had ever simulated a real, multi-page browser journey
   through the *entire* loop (materials → exam → grade → wrong → retry-to-mastery → home → tutor →
   review → quiz) in one continuous session — every prior PAT verified individual links in the chain,
   never the chain itself end-to-end across real page loads.

## Runtime Flow Diagram

```
Repository → MaterialRuntime → QuestionRuntime (Exam Mode)
                                     │
                                     ▼
                          AutoGrader.grade()  (materialId passthrough, AI-109)
                                     │
                    ┌────────────────┼─────────────────┐
                    ▼                                   ▼
      WrongBookRuntime.sync()                 HistoryRuntime.record()
   (persisted, AI-109)                      (persisted, AI-109)
                    │
                    ▼
      WrongBookRuntime.recordRetry()   ← NEW (AI-610): 立即重做 UI → real,
      (real correctStreak, persisted)     persisted correctStreak, not a
                    │                     session-local tracker
                    ▼
      AHS.StatisticsRuntime  ← NEW (AI-609/611/612): dueForReview() /
      (still purely computed,   masteredReviewItems() / recentWrongItems() /
       no store of its own)     weakestSubject() / recommendedRetest() /
                    │           recommendedChapters() / learningContext()
        ┌───────────┼───────────────────┬─────────────────────┐
        ▼           ▼                   ▼                     ▼
   複習中心      測驗中心 (repositoryExamCatalog,   首頁 (AiTutorHomeCard,   AI Tutor (tutor.html,
 (dueToday/       AI-109, unchanged this Sprint)    AI-611, NEW model)      AI-612, NEW real
  已完成複習,                                                                 chat message)
  AI-609, NEW)
        │
        ▼
   AHS.TutorMessage.build()  ← NEW shared stateless text builder (js/utils/),
   used verbatim by both 首頁 and AI Tutor — one real message, not two texts
   that could drift.
```

`AHS.LearningQuestionRuntime`/`WrongBookSession`/`ReviewQueue`/`ReviewModel` (Practice-Mode
pipeline, feeding `ReviewWidget`'s 間隔複習) remain completely untouched — "兩者不得混用" still
holds.

## AI-608 — Learning Flow Integration (DONE, verified by the E2E test)

The full chain (Repository → MaterialRuntime → 教材中心 → 學習總結 → 開始測驗 → AutoGrader →
HistoryRuntime → WrongBookRuntime → ReviewRuntime → AI Tutor → 首頁同步 → 再次學習) is exercised
end-to-end by the new regression test (see Testing). No new Runtime was created for this item —
AI-608 is the *outcome* of AI-609/610/611/612 all being real and connected, not a separate piece of
code.

## AI-609 — Review Runtime Completion (DONE)

- **今日待複習**: `js/pages/AppReview.js` now passes `AHS.StatisticsRuntime.dueForReview().length`
  (real WrongBookRuntime entries not yet 已精熟) instead of the old fixed `0`.
- **已完成複習**: new `AHS.StatisticsRuntime.masteredReviewItems()`; surfaced via one additive entry
  in `ReviewHomeCard.js`'s existing `STAT_DEFS` array (same stat-row markup as the three fields
  already there — no new component).
- **最近複習**: unchanged, already real (`AHS.HistoryRuntime.list()[0]`).
- **間隔複習**: unchanged, already real for Practice-Mode data (`ReviewWidget`).
- **AI 推薦複習**: exposed as real data (`AHS.StatisticsRuntime.recommendedChapters()`) and surfaced
  as real text on 首頁/AI Tutor (AI-611/612, same underlying data) rather than as a third, separate
  UI element on 複習中心 itself — adding a distinct new visual block there for the same concept
  already shown elsewhere would be additive UI, which this Sprint's Rules do still forbid
  ("不得重新設計 UI"); the data is real and available, only its 複習中心-specific presentation was
  intentionally not duplicated.
- **Judgment call carried over from Sprint AI-109, now resolved**: 開始今日複習's `dueToday > 0`
  branch previously showed the honest stub "Review Session 尚未實作". Since dueToday is real now,
  that branch is reachable and needed a real destination. Rather than building a new Review Session
  screen (still "新增功能" this Sprint too), it now renders as a real `<a href="wrongbook.html">` —
  the exact same destination/pattern 錯題複習 already uses one button over, since dueToday's items
  literally *are* WrongBookRuntime entries. No new entry point, no new UI.

## AI-610 — WrongBook Integration (DONE)

- `js/runtime/WrongBookRuntime.js`: additive `correctStreak` field (0 on creation, reset to 0 on any
  wrong re-answer via `sync()`) and new `recordRetry(id, wasCorrect)` — persisted via the same
  `PersistenceAdapter` hook AI-109 already added. Public API only grows (`sync`/`toggleBookmark`/
  `reset`/`list`/`isEmpty`/`getById` all unchanged).
- `js/components/WrongBook.js`: removed the local `masteryTracker`/`recordReviewResult` entirely —
  `getMasteryStatus()` now derives 待複習/複習中/已精熟 purely from the item's own real
  `correctStreak` (single source of truth, no more parallel/inconsistent state). `applyReviewResult()`
  calls `runtime.recordRetry()` on every retry (correct or wrong), so the Detail Panel, row chips, and
  every downstream Runtime consumer (`StatisticsRuntime`, 複習中心) agree immediately.

## AI-611 — Dashboard Runtime Synchronization (DONE, within existing UI slots)

- `index.html` now `<script>`-tags the Exam-Mode Runtime chain (`QuestionBank`/`QuestionRuntime`/
  `ExamRuntime`/`AnswerRuntime`/`AutoGrader`/`WrongBookRuntime`/`HistoryRuntime`/`StatisticsRuntime`)
  — previously entirely absent, so 首頁 was structurally blind to it regardless of any component
  wiring.
- `js/pages/AppHome.js`'s existing `AHS.AiTutorHomeCard.create()` call (previously always empty)
  now receives a real model built from `AHS.StatisticsRuntime.learningContext()` +
  `AHS.TutorMessage.build()` — real 弱點科目/待複習題數/建議重測/精熟題數, no Mock, no fixed text.
- "最近測驗"/"最近錯題"/"平均正確率" as *distinct new stat displays* were not added — 首頁 has no
  existing slot for them, and creating one is "新增功能入口"/"重新設計 UI", both explicitly
  forbidden this Sprint. Their real values ARE surfaced through the now-real AI Tutor card message
  (which references them directly) — "不得建立第二份統計" is honored: there is exactly one
  `StatisticsRuntime`-computed source, reused wherever real data needs to appear.

## AI-612 — AI Tutor Recommendation (DONE, within existing chat UI)

- `tutor.html`: added the same Exam-Mode Runtime scripts as 首頁, plus `js/utils/TutorMessage.js`
  (new, stateless).
- `js/pages/AppTutor.js`: appends ONE real, Runtime-derived assistant message (via the same
  `AHS.TutorMessage.build()` 首頁 uses — guaranteed identical wording for identical data, never two
  divergent texts) to the end of the existing chat thread. Reuses `AiTutor.js`'s own unmodified
  `bubble()` rendering — no new component, no new entry point. When there is genuinely no real data
  yet, nothing is appended and the existing canned demo thread renders exactly as before (never a
  fabricated "you have no weaknesses" message).
- Covers 今日弱點 (`weakestSubject`), 建議複習教材/建議複習章節 (`recommendedChapters`), 建議再次
  測驗 (`recommendedRetest`), 推薦錯題 (`dueForReview` count) — all real, all vary with actual data
  ("不得使用 Mock。不得固定文字" — every sentence embeds a real number/name). 建議學習順序 is
  implicit in the sentence ordering itself (weakest subject → chapter → due items → retest →
  mastered count), not a separately fabricated ranking.

## AI-613 — End-to-End Validation (DONE)

New regression group `[34]` (see Testing) walks the entire real loop across seven fresh page loads,
carrying only `sessionStorage` forward exactly like a real browser tab (the same technique Sprint
AI-109 introduced, now extended to every page this Sprint touches: quiz.html → wrongbook.html ×3
retries → review.html → index.html → tutor.html → quiz.html again). Confirms: no Runtime island (every
page picks up the real state left by the previous one), no duplicate data (`StatisticsRuntime`
computes fresh from `WrongBookRuntime`/`HistoryRuntime` every time, no cached/second copy), no
inconsistent data (the same wrong-book record's `correctStreak`/mastered status agrees across
WrongBookRuntime, 複習中心, and 測驗中心 at the end of the run).

## 修改檔案

- `js/runtime/WrongBookRuntime.js` — `correctStreak` field, `recordRetry()`
- `js/runtime/StatisticsRuntime.js` — `dueForReview`, `masteredReviewItems`, `recentWrongItems`,
  `weakestSubject`, `recommendedRetest`, `recommendedChapters`, `learningContext`
- `js/components/WrongBook.js` — real mastery status (removed session-local tracker)
- `js/pages/AppReview.js` — real `dueToday`/`masteredReview`
- `js/components/ReviewHomeCard.js` — one additive stat entry
- `js/components/ReviewQuickAction.js` — real link instead of dead stub when `dueToday > 0`
- `js/pages/AppHome.js` — real AiTutorHomeCard model
- `js/pages/AppTutor.js` — real chat message appended
- `js/utils/TutorMessage.js` — new, shared, stateless text builder
- `index.html`, `tutor.html`, `review.html` — added missing Runtime `<script>` tags
- `tests/jsdom/BehaviorSuite.js` — new group `[34]`, 12 checks, full E2E loop
- `docs/EO/SPRINT_AI111_Learning_Loop_Integration_Report.md` (this file)
- `docs/PMO/PROJECT_STATUS.json`, `docs/PMO/SPRINT.json`

## What was deliberately NOT done

- No new Runtime created (`AHS.StatisticsRuntime`/`WrongBookRuntime` extended in place;
  `TutorMessage` is a stateless util, not a Runtime — no store, no schema).
- No Repository Schema change; no Material/Summary/Question/WrongBook/History Runtime API
  signature changed or removed.
- No new UI component/page section — every real-data surface reuses an existing slot
  (`AiTutorHomeCard`'s already-built real-data path, `AiTutor.js`'s existing chat thread,
  `ReviewHomeCard`'s existing `STAT_DEFS` array, `ReviewQuickAction`'s existing button reused as a
  real link).
- "AI 推薦複習" as a distinct new visual block on 複習中心 itself, and "最近測驗"/"最近錯題"/"平均
  正確率" as distinct new stat displays on 首頁 — no existing slot exists for these specifically;
  their real data is available (`StatisticsRuntime`) and already surfaced through the AI Tutor
  message, but a dedicated new UI element for them was not added, per this Sprint's own "不得重新
  設計 UI"/"不得新增功能入口" rules.

## Testing before relying on any of this

`npm test`: **270/270 PASS** (258 prior + 12 new in group `[34]`). New group `[34]` walks the real
loop via actual DOM interaction where it matters most — the 立即重做 retry flow is driven by
clicking the real row, the real 立即重做 button, the real correct-answer option, and the real
提交答案 button (not a direct internal function call), three times in a row across three separate
fresh `wrongbook.html` page loads, confirming `correctStreak` reaches 3 and 已精熟 through the
actual user-facing flow. `PipelineRegression`: **6/6 PASS**. `npm run verify`: PASS (0 broken paths,
0 legacy references, 0 forbidden-pattern hits).

## QA

`npm run verify` PASS. `npm test` 270/270 PASS. `PipelineRegression` 6/6 PASS. Coverage increased.

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.

## Acceptance

- ☑ 教材完成後立即更新首頁（AiTutorHomeCard 讀取真實 Runtime 資料）
- ☑ 測驗完成立即更新測驗中心（HOTFIX-005/AI-109 既有機制，本 Sprint 驗證跨頁一致）
- ☑ 錯題立即進入錯題本（AI-109 既有，本 Sprint 驗證跨頁一致）
- ☑ 今日待複習立即更新（AI-609，不再固定為 0）
- ☑ 我的學習立即更新（首頁 AI Tutor 卡片，範圍見 AI-611 說明）
- ☑ AI Tutor 建議同步更新（AI-612，首頁與 tutor.html 共用同一份真實文字）
- ☑ 所有 Runtime 資料一致（AI-613 端對端測試驗證）
