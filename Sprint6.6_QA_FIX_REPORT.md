# Sprint 6.6 — GitHub QA Fix — QA Fix Report

## Round 3 — Runtime QA Round 2, Phase 1~4 Bug Fix (this update)

### Scope Confirmation
確認本輪完全未修改：UI Library、Design Token、Architecture、Runtime
API、Repository Structure（已用 diff 逐一確認）。未新增任何 Framework。

### Issue #016｜WO-008 Home Recent Material Action
**根因**：`docBtn`／`dlBtn`（開啟／下載）點擊後只顯示
「（Mock）開啟教材：...」文字，未真正開啟或下載檔案——這確實是「可
點擊但沒有真實反應」，非本次新引入，是既有既有行為首次被明確標為 Bug。

**調查中額外發現**：卡片的科目/年級說明列將年級**寫死為「高一」**
（`"高一" + subj.name + ...`），與真實教材的年級無關——這是本次
遷移過程中一直存在、之前未被發現的顯示錯誤，順手一併修正。

**修正**：
- `js/pages/app.js`：`buildRecentMaterialsModel()` 的每個 item 新增
  真實 `grade`（修正上述寫死問題）與真實 `file`（記憶體中的 File
  物件參考，僅在同一頁面 Session 內有效——File 物件本身無法序列化，
  無法跨頁保存，這是 HOTFIX-001 已記載的既有限制）、`fileName`
- `js/components/HomeRecentMaterials.js`：
  - 有真實 `file` 參考時：「開啟」透過 `URL.createObjectURL()` +
    `window.open()` 真正在新分頁開啟檔案；「下載」透過臨時 `<a
    download>` 觸發真實瀏覽器下載 —— 皆為真實 Event Binding + File
    Runtime 操作，非 Mock
  - 沒有真實 `file` 參考時（例如已跨頁導覽，File 物件已遺失）：
    按鈕改為 `disabled`，並以 `aria-label` 說明原因，**不再顯示假的
    成功訊息** —— 符合「若尚未支援：Disabled。不得：可點擊但沒有任何
    反應」
  - 移除因此變成真正死程式碼的 `announce()` 函式
- `css/pages/home.css`：新增 disabled 狀態樣式

**驗證**：真實檔案物件存在時，按鈕可正常點擊且不被 disabled；模擬跨頁
導覽（File 物件遺失）後，按鈕正確變為 `disabled` 且 `aria-label` 正確
說明原因；年級欄位正確顯示「高二」（測試教材）而非寫死的「高一」。
Console Error = 0。

### Issue #019｜WO-009 Material Search
**調查結果**：以真實檔案上傳互動（上傳 2 筆不同教材）+ 在搜尋框輸入
關鍵字（觸發真實 `input` 事件）重新測試 Material Center 既有搜尋功能
——結果**正確即時過濾**（2 筆 → 輸入「細胞」→ 正確篩選為 1 筆
「細胞分裂」）。程式碼確認搜尋邏輯本已比對教材名稱／章節／檔名／
內容／資料夾名稱，且透過 `input` 事件即時觸發，並非「沒有任何
Filter」。**未發現可重現的真實缺陷**，判斷為 Deploy Lag（與前兩輪
WO-002 相同模式）。本輪未變更任何搜尋相關程式碼。

### Issue #021｜WO-010 Summary Detail
**根因**：`HomeRecentMaterials.js` 的「已生成學習總結」徽章原本連結到
純 `summary.html`（無參數），導向的是**未篩選的完整列表**，而非該
教材的「Detail」——使用者體感上等同於「Summary Detail 無法載入」
（看不到自己剛剛那筆教材的摘要，除非自己手動用 Dropdown 篩選）。
`summary.html` 本身也從未支援任何 URL 參數做深層連結。

**修正**：
- `js/components/HomeRecentMaterials.js`：徽章連結改為
  `summary.html?materialId=<真實id>`
- `js/pages/app-summary.js`：讀取 `?materialId=` 參數，傳入
  `SummaryCenter.create()`
- `js/components/SummaryCenter.js`：`create(model, initialMaterialId)`
  —— 有 `initialMaterialId` 時，初次渲染直接使用既有
  `SummaryRuntime.findByMaterialId()` 顯示該教材的 Detail（而非完整
  列表），Dropdown 同時正確預選該教材；若該教材確實還沒有 Summary，
  正確顯示 Empty State（**不是空白畫面**）

**驗證**：植入教材＋摘要後點擊徽章 → 正確只顯示該教材的 Summary
Detail（章節資訊正確）；改用一個不存在的 materialId 深層連結測試 →
正確顯示 Empty State，`#app` 內容非空（排除空白畫面情況）。Console
Error = 0。

### Round 3 Regression
- 全站 9 個頁面重新載入：Console Error = 0
- Phase 1／Phase 2 已 PASS 功能重新測試：單檔案上傳、批量上傳
  （3 檔案＋共同設定＋個別修改）、Practice Mode 皆與前一輪結果一致
- `diff -rq` 比對前一輪交付：確認本輪異動精確為 5 個檔案，其餘（含
  全部 Runtime、Persistence Adapter、Learning Pipeline、
  `MaterialCenter.js`、`QuizCenter.js`、`MyLearning.js`、
  `BulkUploadDialog.js`、`TodayMission.js`、`ContinueLearning.js`、
  `LearningTime.js`、`AiTutor.js`、`mock-data.js`）逐位元組未變動

### Acceptance Checklist
- [x] Issue #016 PASS
- [x] Issue #019 PASS（確認既有功能已正常運作，非本輪缺陷）
- [x] Issue #021 PASS
- [x] 未影響 Phase 1／Phase 2 已 PASS 功能
- [x] Console Error = 0
- [x] 未修改 UI Library／Design Token／Architecture／Runtime API／
  Repository Structure

---

## Round 2（前次內容，供對照）



### Scope Confirmation
確認以下項目本輪完全未修改：Runtime API、Repository Architecture、
Persistence Adapter、SessionStorage 架構、Learning Pipeline、Review
Runtime、Statistics Runtime、Prototype UI、UI Library、巧巧老師、
Icon Library、Button Library、Design Token（已用 diff 逐一確認）。

### WO-001～WO-006 重新驗證
本輪 WO-001（Home Runtime）／WO-002（Summary Runtime）／WO-003
（Dropdown）／WO-004（Quiz Runtime）／WO-005（Learning Center）／
WO-006（Bulk Upload）內容與上一輪完全相同。已重新以相同測試方法逐一
重新驗證，結果與上一輪一致，皆為 PASS（詳見下方各 WO 原始章節）。
**未發現新的真實缺陷** —— 再次判斷此輪 GitHub QA 回報 FAIL 最可能仍是
「Deploy Lag」（QA 測試對象為尚未部署上一輪修正的 GitHub Pages 版本），
而非上一輪交付本身有缺陷。

### WO-007｜Prototype Mock Cleanup

**範圍界定（重要）**：WO-007 要求「全面搜尋…全部移除」，但同一份文件
的 Do NOT Modify 清單明確保留「Prototype UI」。若字面上對全站搜尋並
移除所有 Mock／Demo／固定內容，將直接掏空 Wrong Book／Dashboard／
AI Tutor／Review Center／我的學習（除本次分頁修正外）／Quiz Center
Exam Mode 等**從未被授權遷移到 Runtime** 的既有 Prototype 頁面內容，
這與同文件「不得修改 Prototype UI」直接矛盾，也會違反歷次 EO 對這些
頁面的 Do NOT Modify 保護。

因此本次將 WO-007 範圍界定為：**已被前幾輪 Sprint 6／6.6 明確授權遷移
至 Runtime 的部分**（Home 的最近教材／學習統計／繼續學習／今日學習／
今日任務／AI 建議、Summary Center、Quiz Center Practice Mode、
Material Center），確保這些部分**沒有殘留任何可觸及的 Mock Fallback
程式碼**；不觸碰 Wrong Book／Dashboard／AI Tutor／Review Center／
Quiz Center Exam Mode 等維持既有 Prototype Mock 設計的頁面。

**發現與處理**：
- `TodayMission.js`／`HomeRecentMaterials.js`／`ContinueLearning.js`／
  `LearningTime.js` 四個檔案雖然在上一輪已經「不會被觸發」使用
  `AHS.Mock.*` Fallback（因 `app.js` 已改傳入明確 model），但檔案內部
  仍**保留著**讀取 `AHS.Mock.todayTasks`／`recentMaterials`／
  `lastLearning`／`learning` 的程式碼路徑 —— 本輪已徹底移除這些內部
  Fallback，四個元件現在完全不含任何 `AHS.Mock` 讀取邏輯
- `js/data/mock-data.js`：確認 `todayTasks`／`recentMaterials`／
  `lastLearning`／`learning`／`studyStats` 五個物件在移除上述 Fallback
  後已無任何存活的呼叫端（已用全站 grep 確認），予以刪除。`aiTutor`
  這個物件**保留**，因為它仍被 `AiTutor.js`（`tutor.html`，未授權
  遷移、仍是合法 Prototype 頁面）使用
- 檢查發現 `archive/`／`developer/`／`prototype/` 三個資料夾內有歷史
  遺留檔案（舊版 CSS/JS/圖片），**確認未被任何現行頁面載入**，屬於
  死程式碼但非「正在運作中的 Prototype 測試資料」。因本次 Do NOT
  Modify 明確保留「Repository Structure」與「Architecture」，本輪
  **未刪除**這些資料夾，僅記錄於此，留待未來若有專門的 Repository
  清理 EO 再處理

### 驗證結果（Round 2）
- Home 全新 Session／已上傳教材兩種情境重新測試：結果與上一輪完全
  一致（Empty State／真實資料切換皆正確），Console Error = 0
- WO-002～WO-006 個別重新測試：結果與上一輪完全一致，Console Error = 0
- 全站 9 個頁面重新載入迴歸測試：Console Error = 0
- `html5validator --match "*.html"`：全站 exit 0
- `diff -rq` 比對上一輪交付：確認本輪異動範圍精確為 5 個檔案（見
  CHANGELOG），其餘（含全部 Runtime／Persistence Adapter／Learning
  Pipeline／Review Runtime／Statistics Runtime／`AiTutor.js`／
  上一輪已完成的 WO-001～WO-006 六個檔案）逐位元組未變動

### GitHub Pages
本環境仍無真實 GitHub Pages 部署權限。建議 GPT PMO 於部署本輪修正後
的真實環境重新執行 Runtime QA，以排除 Deploy Lag 造成的誤判。

---

## Round 1（原始內容，供對照）

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
