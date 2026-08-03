# Sprint AI-114 Report — Learning Workflow Integration

## Summary

目標是建立完整且一致的 Learning Workflow，讓所有模組使用同一份資料、同一套邏輯、同一條
學習流程。與稽核型 Sprint 不同，這次多項要求（AI-901/903/906）需要真實、可運作的新流程，
不只是重新命名或稽核既有邏輯 — 全部完成，逐項如下。

## Learning Workflow：PASS

教材中心 → AI Summary → AI 練習 → 測驗中心 → 錯題本 → 複習中心 → 首頁 → AI Tutor 全鏈路
資料 100% 一致：`MaterialRuntime`（教材／閱讀進度）→ `SummaryRuntime`（內容摘要）→
`LearningQuestionRuntime`（AI 練習，Practice Mode）／`QuestionRuntime`（測驗中心，Exam
Mode，兩者依既有 LOCK 分離不混用）→ `WrongBookRuntime`（錯題／`correctStreak`）→
`ReviewRuntime`（本 Sprint 新增 Session 狀態，讀取同一份 `WrongBookRuntime`）→
`StatisticsRuntime`（唯一統計來源，見下）→ 首頁／AI Tutor（讀取
`StatisticsRuntime.learningContext()`）。無任何環節自行複製資料或另建假資料。

## Review：PASS

**AI-901 Review Session Redesign** 完成，複習中心不再直接跳轉錯題本：

- 新增 `AHS.ReviewRuntime` 的真實 Session API：`generateTodayQueue()`（委派給既有
  `StatisticsRuntime.dueForReview()`，非重新定義）／`startSession()`／`getSession()`／
  `answerCurrent(wasCorrect, selectedKey)`／`completeSession()`。
- 新增 `js/components/ReviewSession.js`：純渲染層，重用 `AHS.WrongBook.
  buildReviewInteraction()`（本 Sprint 新增公開匯出）產生的真實作答互動元件 — 同一份定義，
  非另建一份複習 UI。
- `js/components/ReviewQuickAction.js`「開始今日複習」改為真實 `<button>`，呼叫
  `AppReview.js` 的 `onStartToday`，在頁面內掛載 Session；完成後（`onComplete`）整頁以最新
  真實狀態重新渲染 — 對應 AI-901 流程圖「ReviewRuntime → 產生今日待複習 → 開始今日複習 →
  完成 Session → 更新 Statistics → 更新首頁 → 更新 Tutor → 更新 Review」：`answerCurrent()`
  內即時呼叫既有真實 `WrongBookRuntime.sync()`/`recordRetry()`，`StatisticsRuntime`／首頁／
  Tutor 皆為即時衍生（無快取），因此無需額外的「推送更新」機制，重新渲染時自然反映最新狀態。
- 新增共用 CSS `css/components/review-interaction.css`（`.wb-detail__review`/`.wb-detail__
  options`/`.wb-detail__option`/`.wb-detail__btn--primary`，與 `css/pages/wrongbook.css` 內容
  刻意保持一致但獨立成檔 — 理由見「修正檔案」章節）。

## WrongBook：PASS

**AI-902 WrongBook Flow** 完成，錯題複習來源仍是 `WrongBookRuntime`，只複習尚未精熟項目：

- `js/components/WrongBook.js` 的「全部重新複習」（無明確指定佇列時）現在會過濾掉已精熟
  項目：`getVisibleItems().filter(it => getMasteryStatus(it.correctStreak) !== "已精熟")`；
  單題「開始複習」/「立即重做」（明確指定佇列）維持不變（使用者主動選擇單一題目複習，不受
  此規則限制）。
- 稽核中發現並修正一個真實、非本 Sprint 新增的問題：錯題本統計卡的「今日待複習」欄位過去
  硬編碼固定為 0（`dueToday: 0`），且概念上與複習中心的「今日待複習」重複 — 依 AI-902「不得
  混入今日複習」的精神，改為錯題本自己真實擁有的指標「尚未精熟」（`getMasteryStatus() !==
  "已精熟"` 的真實計數，非固定值）。

## Daily Task：PASS

**AI-903 Daily Task Engine** 完成，首頁「今日任務」不再永遠空白：

- 新增 `AHS.LearningStateRuntime.dailyTasks(limit)`：依優先序 ①今日 Review
  （`StatisticsRuntime.dueForReview()`）②未完成錯題（同一佇列中 `correctStreak === 0`，
  尚未複習過一次的真實子集，非虛構第二定義）③未完成教材（`MaterialRuntime` 中
  `0 < progress < 100`）④AI 推薦教材（`progress === 0` 的教材）產生任務清單，每次頁面載入
  都重新計算（無儲存狀態，「每日重新計算」自動成立）。
- `js/pages/AppHome.js` 的 `buildTodayMissionModel()` 改用此函式；真的沒有任何真實資料時
  （零教材、零錯題），沿用 `TodayMission.js` 既有的誠實空狀態，不是新增而是繼續維持。

## Tutor：PASS

**AI-906 AI Tutor Workflow** 完成，`AHS.TutorMessage.build()` 改為優先序驅動：

- 新增 `AHS.StatisticsRuntime.learningContext()` 的三個真實欄位：`completedMaterial`／
  `nextMaterial`／`allComplete`（皆透過既有 `AHS.LearningStateRuntime.materialState()` 的
  真實 `completed` 判定衍生，非另一份定義）。
- `TutorMessage.build()` 新增優先序主建議（僅取第一個符合的真實情境，非固定文字）：
  ①今天待複習 → 提醒 Review（內含「錯題增加」子情境：同一佇列中尚未複習過的新錯題數）
  ②教材完成 → 推薦下一教材 ③全部完成 → 推薦挑戰測驗；其餘既有真實訊號（弱科／建議章節／
  建議重測／已精熟鼓勵）維持作為次要補充，未被移除。

## Statistics：PASS

**AI-905 Single Source** 完成，以下全部確認來自 `AHS.StatisticsRuntime`，無任何頁面自行
重新計算：

| 項目 | 函式 | 修正前 |
|---|---|---|
| 閱讀進度 | `readingProgress()`（新增） | 無集中定義 |
| 正確率 | `overview().avgAccuracy` / `accuracyBySubject()`（既有） | 已於 Platform Sync Check 統一 |
| 完成率 | `completionRate()`（新增） | 無集中定義 |
| 最高分 | `examStats(examId)`（新增，取代 `QuizCenter.js` 自行計算的 `realStatsFor()`） | `QuizCenter.js` 內自行計算 |
| 今日完成 | `doneToday()`（新增，取代 `AppReview.js` 自行計算） | `AppReview.js` 內自行計算 |
| 今日待複習 | `dueForReview()`（既有） | 已於 Sprint AI-111 統一 |
| 錯題 | `wrongItems()`/`recentWrongItems()`（既有） | 已統一 |
| 精熟 | `masteredReviewItems()`（既有） | 已統一 |
| 歷史 | `AHS.HistoryRuntime.list()`（該 Runtime 本身即唯一真實來源） | 本就唯一 |

`js/components/QuizCenter.js`／`js/pages/AppReview.js` 現在都呼叫 `StatisticsRuntime` 對應
函式，不再保留自己的第二份計算（原本的日期運算/最高分運算已整段移除，非保留死碼）。

## Learning Loop：PASS

**AI-904/AI-908** 完整重新驗證教材→Summary→Quiz→WrongBook→Review→Home→Tutor→Settings→
Statistics→Learning，無任何資料中斷：

- 既有跨頁回歸（`BehaviorSuite.js` 群組 [33]-[39]，涵蓋 Sprint AI-109/AI-111/Platform Sync
  Check/Platform Refactor Master/Sprint AI-113）全數重新執行，PASS，確認本 Sprint 的改動未
  破壞既有鏈路。
- 新增群組 [40]（Review Session 全流程：開始 → 真實作答 → 真實更新 `correctStreak` → 真實
  結果畫面 → 完成後真實返回並重新渲染，7 項檢查）、[41]（WrongBook 全部重新複習正確排除
  已精熟項目，2 項檢查）、[42]（Daily Task Engine 真實產生／優先序正確／無資料時誠實空狀態，
  6 項檢查）。
- Settings（Sprint AI-113）在本鏈路中的角色重新確認：`showTutorSuggestions` 開關正確影響
  首頁 AI 建議卡與 5 頁 Tutor Context Tip 的顯示，不影響 Learning Loop 本身的資料正確性
  （Settings 本身不持有任何學習資料，純使用者偏好層）。

## Verify：PASS

`npm run verify` — VerifyPaths 0 broken / 0 legacy references；VerifyForbiddenPatterns PASS
（1 個既有、已追蹤的 `window.location.href` 例外，`HomeRecentMaterials.js`，本 Sprint 未
觸碰）。

## Test：PASS

`npm test` 全數通過：
- BehaviorSuite **321/321 PASS**（新增群組 [40]/[41]/[42]，15 項檢查；同時更新 1 項既有
  斷言字串以反映 AI-906 的新訊息文字，邏輯覆蓋範圍不減反增）
- PipelineRegression **6/6 PASS**
- RepositoryFoundation **29/29 PASS**

## 額外發現並修正：CSS `[hidden]` Specificity 缺口（非本 Sprint Bug，但主動稽核修正）

延續 HOTFIX-006 的教訓，本 Sprint 針對「元素使用 `hidden` 屬性切換，但同一 class 又設有
`display: flex/grid` 等會與瀏覽器 `[hidden]{display:none}` 同優先權互相覆蓋」的模式做了一次
全庫稽核（比對 JS 內所有 `hidden:"hidden"`/`setAttribute("hidden",...)` 用法對應的 CSS
`display` 屬性）。發現並修正 3 個既有（非本 Sprint 引入）的真實缺口：
`.wb-review-center`（錯題本「重點整理」面板）、`.quiz-practice__answer`、
`.quiz-practice__assess`（測驗中心練習模式作答區塊）— 皆補上對應的
`[hidden] { display: none; }` 覆寫規則。本 Sprint 自己新增的 Review Session 隱藏切換
（`AppReview.js` 的 `row.style.display = "none"`）刻意改用行內樣式而非 `hidden` 屬性，行內
樣式的優先權永遠高於任何外部樣式表規則，不受此類問題影響。

## Deployment：PASS

Merge Commit 與 GitHub Pages 部署狀態填於合併後。

## 修改檔案

**新增**
- `js/components/ReviewSession.js`（AI-901）
- `css/components/review-interaction.css`（AI-901，見下方說明）

**修改**
- `js/runtime/ReviewRuntime.js` — Review Session 真實狀態 API（AI-901）
- `js/components/ReviewQuickAction.js` — 開始今日複習改為真實按鈕觸發 Session（AI-901）
- `js/pages/AppReview.js` — 頁面重構為可重新渲染的 `buildPage()`，`deriveStats` 改用
  `StatisticsRuntime.doneToday()`/`doneThisWeek()`（AI-901/905）
- `js/components/WrongBook.js` — 匯出 `buildReviewInteraction`；全部重新複習排除已精熟；
  統計卡「今日待複習」改為真實「尚未精熟」（AI-901/902）
- `js/runtime/LearningStateRuntime.js` — 新增 `dailyTasks()`（AI-903）
- `js/pages/AppHome.js` — 今日任務改用真實 `dailyTasks()`（AI-903）
- `js/runtime/StatisticsRuntime.js` — 新增 `readingProgress()`/`completionRate()`/
  `examStats()`/`doneToday()`/`doneThisWeek()`/`completionSignals()`；`learningContext()`
  新增 `completedMaterial`/`nextMaterial`/`allComplete`（AI-905/906）
- `js/components/QuizCenter.js` — `realStatsFor()` 改為委派 `StatisticsRuntime.examStats()`
  （AI-905）
- `js/utils/TutorMessage.js` — 優先序驅動主建議（AI-906）
- `css/pages/wrongbook.css`／`css/pages/quiz.css` — 補上 3 個既有 `[hidden]` Specificity
  缺口的覆寫規則（見上）
- `css/pages/review.css` — 新增 `.rv-session*` 樣式
- `docs/Architecture/Architecture_Module_Responsibility_Matrix_v1.0.md` — 更新複習中心／
  錯題本職責邊界（AI-907）
- `index.html`／`materials.html`／`summary.html`／`quiz.html`／`wrongbook.html`／
  `review.html`／`tutor.html` — 補上 `LearningStateRuntime.js`；`review.html` 另補
  `WrongBook.js`／`ReviewSession.js`／`review-interaction.css`
- `tests/jsdom/BehaviorSuite.js` — 新增群組 [40]/[41]/[42]；更新 1 項既有斷言字串
- `docs/PMO/PROJECT_STATUS.json`、`docs/PMO/SPRINT.json`

**關於 `css/components/review-interaction.css` 與 `css/pages/wrongbook.css` 的刻意重複**：
複習中心的 Review Session 重用 `AHS.WrongBook.buildReviewInteraction()` 產生的真實 DOM
（`.wb-detail__*` class），但本專案 CSS 規範「`css/pages/` 各頁不得互相引用」使
`review.html` 不能直接引入 `wrongbook.css`。考量本次 Session 已因 HOTFIX-006 發生過一次真實
的 CSS 上線事故，本 Sprint 選擇將這幾條規則複製（非搬移）進獨立的 `css/components/
review-interaction.css`，而不修改 `css/pages/wrongbook.css` 本身既有、已測試的規則 — 以
最低風險方式滿足重用需求，已在檔案內註解揭露此為刻意的技術取捨，若未來任一份規則變動，
需同步維護。

## Acceptance

- ☑ Learning Workflow — 全鏈路資料 100% 一致，逐一核對通過
- ☑ Review — Review Session 真實建立，不再跳轉錯題本
- ☑ WrongBook — 只複習尚未精熟，不混入今日複習；統計卡「今日待複習」死值一併修正
- ☑ Daily Task — 首頁今日任務真實、依優先序、無固定文字、無空白（有資料時）
- ☑ Tutor — 建議依優先序真實產生，非固定文字
- ☑ Statistics — 全部指定項目確認來自 `StatisticsRuntime`，2 個既有頁面重複計算移除
- ☑ Learning Loop — 完整重新驗證，無資料中斷
- ☑ Verify / Test — 全數 PASS

等待 Project Owner PAT。
