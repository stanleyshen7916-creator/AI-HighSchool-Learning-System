# HOTFIX-001 — Runtime Persistence & Home Sync — QA Report

## PMO Decision 025 Applied
Architecture Evolution v2.0：撤銷 Sprint 1 Baseline 的 Memory-Only
限制，授權建立 sessionStorage-based Runtime Persistence Layer +
Persistence Adapter。仍禁止 localStorage／IndexedDB／Backend／Cloud
API／Router／SPA／Repository 重構／Runtime Schema 大幅修改（皆已
確認遵守，見下方 Compatibility Review）。

## Developer QA（依 EO 指定測試項目逐一驗證）

### 第一次開啟：全部 Empty — PASS
確認四個 Runtime（MaterialRuntime／KnowledgeRuntime／SummaryRuntime／
LearningQuestionRuntime）於全新 `sessionStorage`（無任何 `ahs:` 前綴
key）情況下，皆正確從空 `store` 起始（`hydrate()` 回傳 `null` 時的
既有 fallback），與本次修正前行為一致。

### 上傳教材 — PASS
以真實 DOM 互動（觸發檔案輸入 change 事件 → 填寫新增教材對話框 →
點擊建立）上傳教材：`MaterialRuntime`／`KnowledgeRuntime`／
`SummaryRuntime`／`LearningQuestionRuntime` 皆正確新增記錄，且皆已
透過 `persist()` 寫入對應 `sessionStorage["ahs:*"]` key（已直接檢查
`sessionStorage` 內容確認 4 個 key 皆存在）。

### 切換頁面 / 重新返回 Material — PASS
**測試方法說明**：本環境（jsdom）不會像真實瀏覽器分頁一樣自動在多個
`JSDOM`執行個體間共用 `sessionStorage`，因此測試中明確地將第一個
頁面寫入的 `sessionStorage` 內容，於第二個頁面的 script 執行**之前**
（`beforeParse`）複製過去 —— 這誠實地模擬了真實瀏覽器分頁對同一
`sessionStorage` 的原生共用行為，而非另外發明一套測試專用機制。

在此測試方法下：上傳教材 → 模擬離開頁面 → 重新載入
`materials.html`：`MaterialRuntime.list().length` 正確還原為 1，
教材標題（含從檔名擷取的章節資訊）正確保留，`file` 欄位正確為
`null`（如預期，因 File 物件無法序列化），頁面 UI 正確渲染出教材
卡片。同一份 `sessionStorage` 帶到 `quiz.html`：Practice Mode 正確
顯示 1 筆真實練習題（非空狀態）。Console Error 全程為 0。

### 首頁立即更新 — PASS
上傳前重新載入 `index.html`：「最近教材」顯示既有 4 筆 Mock Seed Data
（未受影響，符合「維持目前 Repository 行為」）。在 `materials.html`
上傳一筆真實教材後，帶著 `sessionStorage` 重新載入 `index.html`：
「最近教材」正確改為顯示 1 筆真實教材，標題正確、「已生成學習總結」
徽章正確顯示（因該教材已有真實 `SummaryRuntime` 記錄）。Home 完全
沒有直接讀取 `sessionStorage`，只透過 `AHS.MaterialRuntime.list()`／
`AHS.SummaryRuntime.list()` 這兩個既有公開方法。

### Summary 更新 — PASS
`HomeRecentMaterials.js` 新增的「已生成學習總結」徽章，資料來源為真實
`AHS.SummaryRuntime.list()` 比對 `materialId`，非本檔案自行判斷。已於
上傳前（無徽章）／上傳後（有徽章）兩種情境測試通過。

### Practice Mode 更新 — PASS
`quiz.html` 帶著上傳後的 `sessionStorage` 重新載入：Practice Mode
列表正確顯示 1 筆真實 `LearningQuestionRuntime` 記錄（非 Empty
State），與 EO-S6-006 已驗證的 Practice Mode 渲染邏輯完全相容（本次
未修改 `QuizCenter.js`）。

### Console Error = 0 — PASS
全部測試情境（含全新 9 個頁面之迴歸測試）皆為 0 錯誤。

## Regression QA
- 9 個頁面（`index`／`materials`／`summary`／`quiz`／`wrongbook`／
  `review`／`dashboard`／`tutor`／`learning`）全數重新載入：0 錯誤
- `diff -rq` 比對前次交付（EO-S6-007）：確認僅下列檔案有變動 ——
  `js/core/PersistenceAdapter.js`（新增）、`js/runtime/
  MaterialRuntime.js`／`KnowledgeRuntime.js`／`SummaryRuntime.js`／
  `LearningQuestionRuntime.js`（新增 hydrate/persist，Public API 與
  Schema 未變）、`js/pages/app.js`（新增 buildXModel 函式）、
  `js/components/HomeRecentMaterials.js`（新增 Summary 徽章渲染）、
  `css/pages/home.css`（新增徽章樣式）、`index.html`／
  `materials.html`／`summary.html`／`quiz.html`（新增
  PersistenceAdapter.js／既有 Runtime script 標籤）
- 已用個別 diff 逐一確認 **完全未變動**：四個 Core Engine
  （MaterialParser／KnowledgeBuilder／SummaryGenerator／
  QuestionGenerator）、`LearningPipeline.js`、既有 `QuestionRuntime.js`
  （Sprint 4）、`QuizCenter.js`、`SummaryCenter.js`、`WrongBook.js`、
  `Dashboard.js`、Review Center 全部檔案
- `html5validator --match "*.html"`：全站 exit 0
- 禁用模式 grep（`localStorage`／`IndexedDB`／`fetch`／
  `XMLHttpRequest`）：全部新增/修改檔案皆乾淨（僅出現在說明「本檔案
  不使用這些」的註解文字中）

## Fix-003 Confirmation（無需程式碼變動）
已於前次分析階段確認：全部 Runtime（含本次新增持久化的四個）起始
`store` 皆為空，無任何自動建立的 Mock／Demo Data。本次持久化實作
未改變此行為 —— `hydrate()` 找不到已存資料時，仍如實回退到原本的
空 `store` 預設值。未新增「Developer Mode」機制（依 PMO 指示不需要）。

## Known Issues（誠實記錄，非本次範圍內 Bug）
1. `file`（上傳檔案物件參考）無法跨頁保存，還原後為 `null`；原始
   註解本已標明此欄位 "Not persisted"，行為符合預期
2. 「Recent Learning」（繼續學習）目前仍顯示 Mock 內容，因無任何流程
   呼叫 `MaterialRuntime.startLearning()`——這是誠實的「尚無真實資料」，
   非持久化機制故障
3. 測試過程中一度以「手動 `add()` + 重新 mount」的方式測試 UI 渲染，
   結果與真實上傳互動不一致（`.mat-card` 數量為 0）——已確認為測試
   方法本身未走到 `MaterialCenter.js` 內部真實的 `renderAll()` 流程
   所致的測試假象，並非持久化或渲染邏輯的真實缺陷（已用真實上傳
   互動流程重新驗證，`.mat-card` 正確顯示為 1）

詳見 `docs/qa/HOTFIX-001_Architecture_Update.md` 之完整 Architecture
Update 說明（Persistence Layer／Adapter／SessionStorage Flow／
Compatibility Review）。
