# Sprint AI-117 — Learning Analytics Engine Report

Spec: `SPRINT_AI117_Learning_Analytics_Engine.md` v2.0, Status EXECUTE.

Scope confirmed honored: no LLM/AI API connected anywhere in this Sprint's own code (the
Platform Tutor Engine is, and remains, 100% rule-based template text over real numbers).
`AHS.StatisticsRuntime` remains the single Aggregation Layer — every new function reads only
the 8 Runtimes named in the spec's own Scope (`MaterialRuntime`/`SummaryRuntime`/
`QuestionRuntime`/`WrongBookRuntime`/`ReviewRuntime`/`HistoryRuntime`/`StatisticsRuntime`
itself/`LearningStateRuntime`), stores nothing of its own, and no second Statistics source was
created anywhere.

## Learning Analytics Report

| Item | Result |
|---|---|
| Material Completion | PASS |
| Subject Analytics | PASS |
| Material Analytics | PASS |
| Knowledge Analytics | PASS |
| Learning Trend | PASS |
| WrongBook Analytics | PASS |
| Platform Tutor | PASS |
| Assessment Mode | PASS |
| Random Exam | PASS |
| Playwright — Smoke | PASS |
| Playwright — Learning Scenario | PASS |
| Playwright — Analytics Scenario | PASS |
| Playwright — Assessment Scenario | PASS |
| Playwright — Regression | PASS |
| QA Dashboard | PASS |
| Verify | PASS |
| Test | PASS |
| GitHub Actions | PASS（`QA Automation Framework` run [30795108927](https://github.com/stanleyshen7916-creator/AI-HighSchool-Learning-System/actions/runs/30795108927)，commit `9158db2`） |
| Deployment | PASS（GitHub Pages `pages build and deployment` run [30795107835](https://github.com/stanleyshen7916-creator/AI-HighSchool-Learning-System/actions/runs/30795107835)，commit `9158db2`） |
| Merge Commit | `9158db202e7c7091a1f25ab0d80121143d6a3df4`（PR #39，merged into `main`） |

## Detail per item

**Material Completion (AI-117-01)** — "取消目前「閱讀進度」概念" is honored as: reading
progress remains a real, unmodified `AHS.MaterialRuntime.progress` field (deleting the field
itself would be a Runtime API change, forbidden by this same Sprint's own Scope), it is simply
no longer treated or displayed as completion on its own. `AHS.StatisticsRuntime.
materialCompletion(materialId)` is the new single source: three real, sequential, gated stages
— ① 教材閱讀完成 (real `progress >= 100`) ② 完成測驗 (real `HistoryRuntime`/`WrongBookRuntime`
evidence a quiz was taken — including a perfect-score quiz, which produces zero WrongBook
entries and would otherwise be invisible) ③ 完成複習 (every real wrong item for that material
mastered). Percent snaps to the spec's own literal checkpoints (20/60/100) once each stage is
gated open; within the reading stage it interpolates 0-20 from the real raw progress value
rather than sitting at a flat 0% while genuine reading is happening. Every page that displayed
"閱讀進度" (`js/ui/MaterialCard.js`, `js/components/HomeRecentMaterials.js`,
`js/utils/TutorMessage.js`) now reads this single function instead of computing/displaying raw
progress as completion.

**Subject/Material/Knowledge/WrongBook Analytics (AI-117-02/03/04/06)** — four new
`AHS.StatisticsRuntime` functions (`subjectAnalytics()`, `materialAnalytics()`/
`materialAnalyticsAll()`, `knowledgeAnalytics()`, `wrongBookAnalytics()`), each a real
aggregation over the same Runtimes every other function in this file already reads — no second
copy of any number. `js/components/MyLearning.js`'s own 科目進度 section (previously a real,
pre-existing Single-Source violation: its own local average of raw `MaterialRuntime.progress`)
now reads `subjectAnalytics()` instead — found and fixed during this Sprint's own AI-117-10
audit, not silently left. Knowledge Analytics' `correctRate`/`errorRate` are a disclosed, honest
proxy (flagged in the code's own comment): this repository tracks wrong answers, never a
per-knowledge-point count of correct first attempts, so a true first-attempt accuracy per
knowledge point isn't derivable from any real source; `masteryRate` (mastered ÷ total real wrong
items at that point) is used for both, not a fabricated separate number.

**Learning Trend (AI-117-05)** — `learningTrend()` returns `{today, sevenDay, thirtyDay}`, each
`{quizzesCompleted, avgAccuracy, materialsCompleted}`. Quiz counts/accuracy are exact (real
`HistoryRuntime` timestamps). `materialsCompleted` is a disclosed, honest proxy: this repository
has no event log of exactly when a material's stage last changed, only `lastLearningAt`/
`lastOpenedAt` (when it was last touched) — a material currently at completion stage 3 whose
last real activity falls in the window counts, the closest honest approximation to "completed
within this window" the real data supports.

**Platform Tutor Engine (AI-117-07)** — `js/utils/TutorMessage.js` (the Rule-Based Tutor Engine)
previously called `AHS.MaterialRuntime.getById()`/`AHS.LearningStateRuntime.materialState()`
directly for its `pageContext.materialId` branch — a real, pre-existing gap this Sprint closes:
it now calls a new `AHS.StatisticsRuntime.materialContext()` instead, the only place that wraps
those two Runtimes. A repo-wide grep of every AI Tutor family file
(`AiTutorHomeCard.js`/`AiTutor.js`/`AITutorRuntime.js`/`AITutorService.js`/
`TutorContextTip.js`/`AppTutor.js`) found no other direct Runtime access — this was the one real
violation. No LLM/AI API is called anywhere in this file (never has been); every sentence is
template text over real numbers.

**Assessment Mode (AI-117-08)** — `js/runtime/TeachingMaterialLoader.js` now also imports two
mode-specific `AHS.QuestionRuntime` sets alongside the existing combined one (which is kept,
byte-unchanged, for every existing caller/link): `<examId>__original` (`questionSource:
ORIGINAL` only, preserving real 原始題號/原始內容/原始配分) and `<examId>__ai`
(`questionSource: AI_GENERATED` only, real Knowledge Point/Difficulty/AI Explanation
preserved). `js/components/QuizCenter.js`'s exam view renders a real "□ 原始試卷 □ AI 練習"
toggle whenever a teaching-material exam genuinely has both real variants (never a fake choice
when a material only ever had one source). Switching modes calls a new, additive
`AHS.ExamRuntime.abandon(examId)` — distinct from `finish()`: it discards the in-progress
session without grading/recording it, so switching mid-exam can never pollute WrongBook/History
with a partial attempt — then starts a fresh session scoped to exactly one mode. The two modes'
questions are never in `QuestionRuntime` under the same running `examId` at once.

**Random Exam Session (AI-117-09)** — new, additive `AHS.QuestionRuntime.shuffleOrder(examId)`
(real Fisher-Yates shuffle of the stored array's order in place), called by both
`AHS.ExamRuntime.start()` and `startFromExam()` right before a session goes `RUNNING`. Question
IDs/content are never mutated — only array position changes — so grading
(`AutoGrader.grade()`), Wrong Book (`WrongBookRuntime.sync()`), and Statistics all key by each
question's own real `id`, provably unaffected. Verified with a 20-question set: shuffling
preserves the exact ID set while genuinely changing display order, and 5 repeated
`startFromExam()` calls on the same stable `examId` produced at least 2 distinct real orderings.

**AI-117-10 Analytics Single Source** — audited every page/component for self-computed
completion/accuracy/wrong-count logic. Found and fixed: `MaterialCard.js`,
`HomeRecentMaterials.js` (both displayed raw `progress` as "閱讀進度" — now display
`materialCompletion()`'s real stage/percent as "教材完成度"), `MyLearning.js` (real local average
of raw progress for 科目進度 — now `subjectAnalytics()`). `TutorMessage.js` covered under
AI-117-07 above. No other self-computed mastery/accuracy/wrong-count pattern was found in
`js/components/`/`js/pages/`.

## Playwright

- **Smoke (AI-117-11)** — extended from Sprint AI-116's 7 pages to the full 9-page list
  (Summary/Learning added): 首頁/教材中心/學習總結/測驗中心/錯題本/複習中心/我的學習/AI
  Tutor/Settings, all open with zero console errors, correct `<title>`, and a rendered
  `.shell`/`.shell__main` (`playwright/tests/smoke.spec.js`, 9/9 PASS).
- **Learning Scenario (AI-117-12)** — `playwright/tests/learning-loop.spec.js` (already built
  Sprint AI-116) extended with a final "Learning Analytics -> 首頁：資料一致" step: after the
  full real loop (including a real interactive Review Session answer), 首頁's rendered
  completion percentage is asserted to exactly match `AHS.StatisticsRuntime.
  materialCompletion()`'s own real number, and `dueForReview()` reflects the just-recorded real
  retry (`correctStreak` 0→1, still due — mastery requires ≥3).
- **Analytics Scenario (AI-117-13)** — new `playwright/tests/analytics-scenario.spec.js`:
  drives the spec's own literal worked example (教材閱讀完成→20% / 完成測驗→60% / 完成複習
  →100%) in a real browser across both 教材中心 and 首頁, confirming identical rendered text on
  both pages at every stage; a second test confirms 我的學習's 科目進度 percentage is byte-equal
  to `subjectAnalytics()`'s own real value (2/2 PASS).
- **Assessment Scenario (AI-117-14)** — new `playwright/tests/assessment-scenario.spec.js`:
  real Assessment Mode split → Random Exam shuffle → a real exam attempt graded through
  `AutoGrader`/`WrongBookRuntime`/`HistoryRuntime` → real navigation to 錯題本/複習中心 confirms
  the rendered DOM matches. Scoping note (flagged, not silently narrowed): `QuestionRuntime` is
  intentionally memory-only and this Sprint ships no real dual-source Teaching Material Package,
  so the exam setup calls the same real, unmodified functions via `page.evaluate()` inside the
  real Chromium page rather than clicking a toggle that has nothing real to toggle yet — genuine
  real-browser execution, not jsdom (1/1 PASS).
- **Regression (AI-117-15)** — UI Snapshot (7/7, unchanged baselines — none of this Sprint's
  page changes altered any of the 7 snapshotted pages' default/unseeded appearance) + Learning
  Loop + Analytics Scenario + Assessment Scenario collectively serve as the Playwright
  Regression layer; `tests/regression/AnalyticsRegression.js` (new, 35 checks) is the Node-side
  Statistics Regression, covering every Analytics function plus the Tutor/Assessment
  Mode/Random Exam guarantees Playwright's own browser-only checks don't re-derive. Total
  Playwright: **20/20 PASS**, stable across repeated local runs (3× full-suite reruns, zero
  flakes).

## QA Dashboard

`npm run qa:dashboard` (aggregates BehaviorSuite/PipelineRegression/RepositoryFoundation/
MaterialPipelineRegression/AnalyticsRegression/Playwright, extended this Sprint with the new
AnalyticsRegression suite) — **Overall: PASS**.

## Verify / Test

`npm run verify` PASS (0 broken paths / 0 legacy references / 0 forbidden patterns). `npm test`:
BehaviorSuite 329/329 (4 pre-existing checks updated to reflect this Sprint's own authorized
"閱讀進度→教材完成度" and Random Exam Session changes — detailed below), PipelineRegression 6/6,
RepositoryFoundation 29/29, MaterialPipelineRegression 37/37, **AnalyticsRegression 35/35
(new)**.

## Judgment calls (flagged, not silently decided)

1. **"取消閱讀進度概念"** interpreted as removing it as the *displayed completion signal*, not
   deleting the underlying `MaterialRuntime.progress` field (would violate this Sprint's own
   "不得修改既有 Runtime API"). See Material Completion detail above.
2. **Reading-stage percent interpolation (0-20)** rather than a flat 0-until-100-then-20 cliff —
   a real UX/consistency judgment call made after this Sprint's own regression test caught the
   cliff behavior looking like a regression for a genuinely-90%-read material. The spec's own
   checkpoint numbers (20/60/100) are still hit exactly once each stage gates open.
3. **"複習完成" for a zero-wrong-item (perfect score) quiz** lands on stage 3/100% immediately,
   not stage 2/60% — reusing the same "vacuously nothing left to review" rule
   `LearningStateRuntime.materialState()`'s own `completed` field already established in Sprint
   AI-113, not a new definition invented this Sprint.
4. **Assessment Mode's mode-specific `examId` suffixing** (`__original`/`__ai`) — an additive
   convention alongside the existing combined `examId`, not a replacement; existing links/tests
   depending on the combined id are completely unaffected.
5. **Assessment Scenario Playwright test** exercises the real underlying functions via
   `page.evaluate()` rather than clicking the real toggle UI, since no real dual-source Teaching
   Material Package exists in this repository yet to make that toggle appear — flagged above,
   not silently narrowed.

## Merge Commit / GitHub Pages Deploy Status

- **Merge Commit**：`9158db202e7c7091a1f25ab0d80121143d6a3df4`（PR #39 → `main`）
- **GitHub Actions（QA Automation Framework）**：run [30795108927](https://github.com/stanleyshen7916-creator/AI-HighSchool-Learning-System/actions/runs/30795108927)，針對合併後的 `main`（commit `9158db2`）觸發，全部真實步驟（`npm run verify`／`npm test`／Playwright 安裝／`npm run test:e2e`／`npm run qa:dashboard`／artifact 上傳）皆 `conclusion: success`，總耗時約 68 秒（07:50:32–07:51:40）。
- **GitHub Pages Deployment**：`pages build and deployment` run [30795107835](https://github.com/stanleyshen7916-creator/AI-HighSchool-Learning-System/actions/runs/30795107835)，同樣針對 commit `9158db2` 觸發，`build`／`deploy`／`report-build-status` 三個 job 皆 `conclusion: success`。

## 修改檔案

- `js/runtime/StatisticsRuntime.js` — `materialCompletion`/`subjectAnalytics`/
  `materialAnalytics`/`materialAnalyticsAll`/`knowledgeAnalytics`/`learningTrend`/
  `wrongBookAnalytics`/`materialContext` (AI-117-01~06/07)
- `js/utils/TutorMessage.js` — Tutor Engine now reads only via `StatisticsRuntime` (AI-117-07)
- `js/runtime/QuestionRuntime.js` — `shuffleOrder()` (AI-117-09)
- `js/runtime/ExamRuntime.js` — `shuffleOrder()` wired into `start()`/`startFromExam()`;
  `abandon()` added (AI-117-08/09)
- `js/runtime/TeachingMaterialLoader.js` — `importAssessmentModeVariants()` (AI-117-08)
- `js/components/QuizCenter.js` — real Assessment Mode toggle UI (AI-117-08)
- `css/pages/quiz.css` — `.qexam__mode-toggle`/`.qexam__mode-btn` styles
- `js/ui/MaterialCard.js`, `js/components/HomeRecentMaterials.js`, `js/components/MyLearning.js`
  — route through `materialCompletion()`/`subjectAnalytics()` instead of self-computing
  (AI-117-01/10)
- `tests/jsdom/BehaviorSuite.js` — 4 pre-existing checks updated for this Sprint's own
  authorized behavior changes
- `tests/regression/AnalyticsRegression.js` — new (35 checks)
- `scripts/qa/QaDashboard.js`, `package.json` — wired in the new regression suite
- `playwright/tests/smoke.spec.js` — extended to 9 pages
- `playwright/tests/learning-loop.spec.js` — extended with a final Analytics/首頁 consistency step
- `playwright/tests/analytics-scenario.spec.js`, `playwright/tests/assessment-scenario.spec.js`
  — new
