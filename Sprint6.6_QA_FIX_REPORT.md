# Sprint 6.6 — GitHub QA Fix — QA Fix Report

## Scope Confirmation
依規定確認以下項目完全未修改（diff 逐一確認，逐位元組一致）：
- Runtime API（`MaterialRuntime`／`KnowledgeRuntime`／`SummaryRuntime`／
  `LearningQuestionRuntime`／`QuestionRuntime` 之 Public API 與 Schema）
- Repository Architecture（多頁面 + 真實 `<a href>` 導航模式；資料夾結構）
- Persistence Adapter（`js/core/PersistenceAdapter.js`）
- SessionStorage 架構（`hydrate()`/`persist()` 模式）
- Learning Pipeline（`js/services/LearningPipeline.js`）
- Review Runtime（`js/runtime/ReviewRuntime.js`）
- Statistics Runtime（`js/runtime/StatisticsRuntime.js`）

未新增任何 Framework。新增的唯一新元件（`BulkUploadDialog.js`）為既有
UI 模式（Dialog + 既有 `el()` helper）的延伸，非新架構。

---

## WO-001｜Home Runtime Integration

### 調查結果
「今日任務」與「AI 老師建議」兩個區塊，在全站 Runtime 清單中**沒有任何
對應資料來源**（無 Task Runtime、無 AI API）。依「不得新增功能」規則，
本次未建立這類 Runtime；改為：這兩個區塊永久顯示正式 Empty State（因
為誠實地說，目前系統確實沒有這類真實資料），而非移除功能或留空白。

### 修改內容
- `js/pages/app.js`：新增 `buildRecentMaterialsModel()`／
  `buildTodayMissionModel()`／`buildStudyStatsModel()`／
  `buildTodayMinutesModel()`／`buildContinueLearningModel()`，全部
  只透過既有 Runtime 公開方法（`list()`）讀取資料，從不直接接觸
  `sessionStorage`／Persistence Adapter
- `js/components/AiTutorHomeCard.js`：移除 `AHS.Mock.aiTutor` Fallback，
  改為要求真實 model；無真實資料時顯示 Empty State「AI 老師尚無建議」
- `js/components/StudyStats.js`：移除 `AHS.Mock.studyStats` Fallback，
  無真實資料時顯示 Empty State「尚無學習統計」
- `js/components/TodayMission.js`／`HomeRecentMaterials.js`／
  `ContinueLearning.js`：未修改檔案本身（三者皆已有既有 Empty State
  邏輯），僅由 `app.js` 改傳入明確的空 model（而非 `undefined`），使其
  既有的 Mock Fallback 分支不再被觸發
- 「今日學習」（`LearningTime.js`，未修改檔案本身）現在由
  `buildTodayMinutesModel()` 提供真實計算（依 `MaterialRuntime` 的
  `learningTime`／`lastLearningAt` 加總「今天」的分鐘數）——目前恆為
  0（因無任何流程呼叫 `startLearning()`），誠實反映現況，非虛構
- `css/pages/home.css`：新增兩組 Empty State 樣式（AI 老師／學習統計）

### 驗證結果
- **全新 Session（無任何資料）**：最近教材／今日任務／AI 老師建議／
  學習統計／繼續學習皆正確顯示 Empty State；今日學習顯示「0 min」
  （誠實、非空白畫面錯誤）。Console Error = 0
- **上傳教材後**（真實檔案上傳互動 + 模擬跨頁 sessionStorage 共用）：
  最近教材正確顯示真實教材、Summary 徽章正確顯示；學習統計正確從
  Empty State 切換為顯示真實（目前為 0 小時）圖表；今日任務／AI 老師
  建議仍誠實維持 Empty State（無真實資料來源）。Console Error = 0

---

## WO-002｜Summary Runtime Integration

### 調查結果
以正確模擬跨頁 `sessionStorage` 共用（`beforeParse` 於新頁面 script
執行前注入，如實模擬真實瀏覽器分頁行為）重新測試：上傳教材 → 導航至
`summary.html`：`SummaryRuntime` 正確還原 1 筆記錄，畫面正確顯示（非
Empty State）。**未發現可重現的真實缺陷**。判斷 GitHub QA 回報的
「全部顯示尚無資料」，最有可能是先前已記錄過的「Deploy Lag」模式
（QA 測試對象為尚未部署 HOTFIX-001 之前的版本）。

### 已強化之處
- `summary.html` 新增載入 `MaterialRuntime.js`（見 WO-003），確保
  Dropdown 與未來功能有完整的 Runtime 鏈可用
- 已用真實資料重新驗證五個區塊（核心概念／重要定義／易錯重點／
  必背內容／複習建議）皆正常顯示

---

## WO-003｜Summary Material Dropdown

### 修改內容
`js/components/SummaryCenter.js` 新增 `materialLabel(materialId)`，
透過既有 `AHS.MaterialRuntime.getById()`（唯讀）組出
「年級｜科目｜檔名」格式標籤，取代原本直接顯示 Runtime id（`rt_1`）。
`summary.html` 新增載入 `MaterialRuntime.js`。

### 驗證結果
植入 2 筆教材＋摘要記錄後，Dropdown 正確顯示
「高一｜國文｜赤壁賦.pdf」／「高二｜數學｜指數函數.pdf」，不再顯示
Runtime id。Console Error = 0。

---

## WO-004｜Quiz Runtime Integration

### 範圍澄清
本專案全站確認**沒有** `mockQuestions.js` 這個檔案。Quiz Center 目前
有兩種模式：Exam Mode（讀取 Sprint 4 既有 `QuestionRuntime`）與
Practice Mode（讀取 `LearningQuestionRuntime`）——兩者「不得混用」是
EO-S6-006 已鎖定的架構決策。本次修正**僅針對 Practice Mode**（其資料
來源本已完全是 `LearningQuestionRuntime`，非 Mock），未變更 Exam
Mode，以維持既有架構決策一致。

### 修改內容
`js/components/QuizCenter.js`：Practice Mode 無資料時的 Empty State
文案，改為完全對齊本次要求的字句「尚未建立題目」。

### 驗證結果
無資料時正確顯示「尚未建立題目」；有真實 `LearningQuestionRuntime`
記錄時正確顯示題目列表、選項、解答。Console Error = 0。

---

## WO-005｜Learning Center

### 調查結果
`js/components/MyLearning.js` 的「本週／本月／今年／全部」分頁按鈕
**原本已有**點擊反應（切換 Active 樣式 + 顯示 Mock 提示訊息），並非
完全無反應；但確實沒有真正切換顯示資料。全站確認沒有任何
「依時間區間查詢歷史學習紀錄」的 Runtime，建立一個屬於新功能，超出
本次 Hotfix 範圍。

### 採用方案：方案 B（Disabled + Coming Soon）
- 「本週」保留可點擊（因其對應的長條圖資料為真實存在的資料結構），
  其餘三個分頁改為 `disabled`，並附加「Coming Soon」標示
- `css/pages/learning.css` 新增對應樣式

### 驗證結果
「本週」按鈕維持正常可點擊與 Active 切換；「本月」／「今年」／
「全部」皆正確顯示 `disabled` 屬性與「Coming Soon」標示，不再是
「可點擊但無真實反應」的曖昧狀態。Console Error = 0。

---

## WO-006｜Bulk Upload Metadata

### 修改內容
新增 `js/components/BulkUploadDialog.js`，僅在一次選取**多個檔案**時
啟用（單檔案上傳完全沿用既有 `AHS.MaterialUploadDialog`，未變動）：
- 共同設定區塊（科目／年級／教材分類／資料夾）＋「套用全部」按鈕，
  一鍵套用到下方每一列檔案
- 每個檔案仍保留個別欄位，套用後仍可個別修改
- 「開始匯入」會先驗證每一列的必填欄位，任一列不完整則整批不匯入
  （附錯誤提示），完整才會一次性建立全部教材並個別觸發
  `LearningPipeline.process()`
- `materials.html` 新增載入 `BulkUploadDialog.js`；
  `css/pages/material.css` 新增對應樣式

### 驗證結果
選取 3 個檔案 → 設定共同科目／年級／分類 → 套用全部 → 個別修改第 2
列的科目 → 開始匯入：3 筆教材皆正確建立，第 2 筆的科目正確反映個別
修改結果，其餘維持共同設定；3 筆皆成功觸發完整 Learning Pipeline
（3 筆 Knowledge 記錄）。單檔案上傳流程重新測試確認完全未受影響。
Console Error = 0。

---

## Acceptance Checklist
- [x] Home 無任何 Mock Data（今日任務／AI 老師建議永久 Empty State；
  其餘三區塊真實資料存在時顯示真實資料，否則 Empty State）
- [x] Summary Runtime 正常顯示，五區塊正常
- [x] Dropdown 顯示教材名稱（非 Runtime id）
- [x] Quiz Practice Mode 使用 Runtime 題目，Exam Mode 維持既有架構
  不變
- [x] Learning Center：本週正常可點擊，其餘三個分頁 Disabled +
  Coming Soon
- [x] Material Center：Bulk Upload Metadata 完成（共同設定 + 套用全部
  + 個別修改 + 開始匯入）
- [x] Console Error = 0（9 個頁面全數迴歸測試 + 全部新功能端對端測試）
- [x] 未修改 Runtime API／Repository Architecture／Persistence
  Adapter／SessionStorage 架構／Learning Pipeline／Review Runtime／
  Statistics Runtime（已用 diff 逐一確認）

## GitHub Pages
本環境無真實 GitHub Pages 部署權限（與 EO-S6-007 說明相同的環境限制）。
以本機靜態伺服器 + jsdom 驗證全部 9 個頁面與全部新增/修改功能，
Console Error 皆為 0。建議 GPT PMO 於真實 GitHub Pages 環境進行
第二輪驗收覆核。
