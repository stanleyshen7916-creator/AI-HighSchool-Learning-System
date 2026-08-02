# Architecture_Platform_Terminology_v1.0.md

## 目的

Platform Refactor Master（Platform Integration）PAT 項目 2 要求：「Progress / Accuracy /
Mastery / Completion 各頁面定義不一致，需建立唯一定義」。本文件是該唯一定義的正式紀錄 —
往後任何頁面、元件、Runtime 若要顯示這幾個概念之一，必須對照本文件命名與資料來源，不得自行
發明新名詞或新算法。

本文件只定義「名詞 → 真實資料來源」的對應，不新增、不修改任何 Runtime API。

## 核心問題（PAT 6/7 的真實根因）

首頁「最近教材」卡片過去顯示的百分比標籤是「學習進度」，但其真實資料來源是
`AHS.MaterialRuntime`（透過 `MaterialRuntime.startLearning()` 寫入）的 `item.progress` 欄位 —
這個欄位量測的是**教材閱讀／互動進度**（讀了多少、有沒有開始），與測驗中心顯示的「正確率」
（`AHS.StatisticsRuntime`，來自實際作答的 Exam History）以及 AI Tutor 顯示的「精熟度」
（`AHS.WrongBookRuntime` 的 `correctStreak`）是三個完全不同的真實指標，各自來自不同 Runtime、
量測不同行為。把「閱讀進度」標成「學習進度」，會讓使用者誤以為讀完教材（進度 100%）等於
學會了教材內容（正確率 / 精熟度也應該高），但這兩者本來就沒有必然關係 — 一個人可以「讀完」
但「還沒練熟」。這不是 Bug（資料本身沒有算錯），是名詞使用造成的誤導，因此本次修正只重新
命名／重新定義，不改動任何 Runtime 算法。

## 唯一定義

### 閱讀進度（Reading Progress）
- **定義**：使用者「打開／閱讀」某份教材的進度，0–100%。
- **真實來源**：`AHS.MaterialRuntime`，欄位 `item.progress`（由 `startLearning()` 寫入）。
- **顯示位置**：教材卡片（`js/ui/MaterialCard.js`）、首頁最近教材
  （`js/components/HomeRecentMaterials.js`）、教材中心排序選項
  （`js/data/AppConfig.js` → `materials.sorts`）。
- **正式標籤**：「閱讀進度」（Reading Progress）。**不得**標示為「學習進度」——
  「學習」一詞在使用者認知中隱含「學會了」，容易與正確率／精熟度混淆。
- **不代表**：學習完成率、精熟度、正確率。閱讀進度 100% 只代表「讀完了」，不代表「學會了」。

### 正確率（Accuracy）
- **定義**：Exam Mode 測驗作答的答對比例。
- **真實來源**：`AHS.StatisticsRuntime.overview().avgAccuracy`（總覽）／
  `AHS.StatisticsRuntime.accuracyBySubject()`（分科）— 純計算，永遠即時衍生自
  `AHS.HistoryRuntime.list()`，Runtime 本身不儲存彙總值。
- **顯示位置**：測驗中心（`QuizCenter.js`）、我的學習（`MyLearning.js`）、首頁（若顯示）。
- **規則**：任何頁面顯示「正確率」都必須直接呼叫 `AHS.StatisticsRuntime`，
  **不得**自行用 `HistoryRuntime.list()` 重新計算一份（Single Source of Truth，PAT 3）。
  本 Sprint 稽核確認全平台目前無違規案例（見下方「Single Source 稽核結果」）。

### 精熟度 / 複習狀態（Mastery / Review Status）
- **定義**：某一錯題「已連續答對幾次」，決定它是否還需要複習。
- **真實來源**：`AHS.WrongBookRuntime` 的 `correctStreak` 欄位（`recordRetry()` 維護）；
  規則固定為「連續答對 3 次視為已精熟」（`WrongBook.js` 的 `getMasteryStatus()` 與
  `StatisticsRuntime.dueForReview()`/`masteredReviewItems()` 使用同一條規則，非各自定義）。
- **顯示位置**：錯題本（`WrongBook.js`）、複習中心（`AppReview.js`/`ReviewHomeCard.js`）、
  AI Tutor／首頁 AI 建議卡（透過 `StatisticsRuntime.learningContext()` → `TutorMessage.build()`）。
- **不代表**：閱讀進度、正確率。精熟度只針對「曾經答錯、正在被追蹤複習」的題目，
  一份教材沒有任何錯題record時，精熟度本身無意義（不應顯示為 0% 或「未精熟」，
  應顯示誠實的空狀態）。

### 學習總覽統計（Overview Stats：學習天數／完成題數等）
- **真實來源**：依項目而定，一律透過既有 Runtime 的 Public API 取得
  （`MaterialRuntime`／`HistoryRuntime`／`StatisticsRuntime`），**不得**在頁面元件內重新
  計算加總。
- **已知並修正案例**：`MyLearning.js` 的「正確率」曾自行以
  `totalCorrect/totalQuestions` 加權平均計算，與 `StatisticsRuntime.overview().avgAccuracy`
  （逐場正確率平均）不同源，兩個頁面對同一份 `HistoryRuntime` 資料算出不同數字
  （Platform Sync Check 已修正，`MyLearning.js` 現在直接讀 `StatisticsRuntime`）。

## Single Source 稽核結果（PAT 3）

本 Sprint 針對「正確率／accuracy／correctCount」在 `js/components/*.js` 全面搜尋，確認：

- `QuizCenter.js`：正確率／accuracyByStudy／history 均直接來自 `StatisticsRuntime.refresh()`
  與 `HistoryRuntime.list()` 的既有真實紀錄（單場作答結果直接欄位），非重新加總計算。
- `MyLearning.js`：已於 Platform Sync Check 修正為直接讀 `StatisticsRuntime.overview()`。
- `WrongBook.js`：「正確率」為單次複習作答結果的即時統計（`results.correct/results.total`），
  屬於單次操作的暫時性資料，非跨頁彙總指標，不適用 Single Source 規則（沒有第二份可比對的
  彙總來源）。
- `ReviewRecentSession.js`：顯示的是傳入 model 的 `accuracy` 欄位（呼叫端已經透過
  `StatisticsRuntime`/`HistoryRuntime` 組好，元件本身不重新計算）。
- `AppDashboard.js`（dashboard.html）：`stats` 直接來自 `StatisticsRuntime.refresh()` +
  `LearningHistoryModel.refresh()`，`subjectStatus` 來自 `LearningHistoryModel
  .masteryRateBySubject()`（Practice Mode 專屬指標，與 Exam Mode 的
  `accuracyBySubject()` 刻意不合併 — 兩者是不同指標，合併會是本 Sprint 不授權的
  「發明新衍生指標」）。

**結論：無發現需要修正的重複計算案例** — 唯一一個已知過的重複計算
（`MyLearning.js`）在更早的 Platform Sync Check 已修正，本次稽核確認至今沒有新增或殘留的
第二份計算。

## 本次修正的檔案（名詞更正，非邏輯變更）

- `js/components/HomeRecentMaterials.js` — 教材卡片標籤「學習進度」→「閱讀進度」
- `js/ui/MaterialCard.js` — 教材卡片標籤「學習進度」→「閱讀進度」
- `js/data/AppConfig.js` — 教材中心排序選項「學習進度」→「閱讀進度」；
  首頁 `continueFeedback` 文案同步用詞
- `js/components/Dashboard.js` — 檔頭註解更正（原「All Mock」已與 Sprint AI-020 後的真實
  資料整合狀態不符；`data.progress`／`data.knowledge` 等區塊在正式環境本來就恆為空，維持
  誠實空狀態，不受影響）

`js/components/MyLearning.js` 的「科目進度」（`computeSubjectProgress()`）目前仍以
`MaterialRuntime.progress` 平均值標示「已完成／進行中／尚未開始」——依本文件定義，
這是**閱讀進度**的彙總，因此「科目進度」本身的定義沒有錯（它就是在講「這科教材讀了多少」），
只是頁面標題「科目進度」與卡片標籤「已完成」在字面上仍可能被誤讀為學習完成度；由於
`MyLearning.js` 同一頁的「學習總覽」區塊已經用 `StatisticsRuntime` 的正確率並排顯示
（見 Platform Sync Check 修正），兩者在同一頁面內互相對照即可提供正確語境，且此區塊標題
「科目進度」本身語意仍屬「閱讀」範疇（不像「學習進度」直接使用「學習」二字），
評估後判定不需要為此再新增修改；若 PO 認為仍需重新命名，需另行指示（本次未擅自更動
`MyLearning.js` 的既有標籤與邏輯）。
