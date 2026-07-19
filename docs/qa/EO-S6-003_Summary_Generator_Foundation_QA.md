# EO-S6-003 — Summary Generator Foundation — QA Report

## Scope Confirmation
- `js/services/SummaryGenerator.js`（新增）與 `js/runtime/SummaryRuntime.js`
  （新增）路徑完全依 EO 指定，無需路徑調整
- `SummaryGenerator.js` 為純函式、無狀態，從未讀取或呼叫
  `AHS.SummaryRuntime`、任何 UI、或 AI API（全站無 AI API 可呼叫）
- `SummaryGenerator.js` 只接受 Knowledge Runtime 記錄作為輸入，從未直接
  讀取 Material Document 或 PDF／DOCX／PPTX／Image／Audio
- `SummaryRuntime.js` 僅負責 Store／Query／Sync，未產生 Question、未
  操作 UI
- 未修改 `js/services/MaterialParser.js`／`js/services/KnowledgeBuilder.js`／
  `js/runtime/MaterialRuntime.js`／`js/runtime/KnowledgeRuntime.js`
  （已用 md5sum 逐一確認四個檔案與前次交付版本完全一致）
- 未修改 Knowledge Runtime Schema（`SummaryGenerator.js` 僅讀取其
  `concepts`／`definitions`／`formulas`／`chapter`／`section` 等既有
  欄位，未新增或改動該 Schema 本身）
- 未修改任何 UI／頁面／Sidebar／Bottom Navigation — 兩個新檔案皆未被
  任何 `.html` 引用（已用 grep 全站確認為零筆），與 EO-S6-001／
  EO-S6-002 相同慣例，刻意保持獨立；`summary.html` 現有的 Mock 驅動
  Summary Center（Sprint 5 交付）完全未受影響
- 無 ES Module、無 Router、無新 Framework、無 fetch/XHR/localStorage
- 固定輸出五段格式（核心概念／重要定義／易錯重點／必背內容／複習建議）
  未被改變，`validate()` 明確檢查五個欄位皆為 Array

## Implementation Notes
- `SummaryGenerator` 與 `SummaryRuntime` 的分工，延續 EO-S6-002 已確立
  的模式：Generator 只負責「轉換」（純函式，`generate()` 回傳完整記錄
  但不寫入任何地方）；Runtime 的 `sync(knowledge)` 才是「Knowledge
  Runtime → Summary Runtime」流程的橋接點
- 五個 `generateX()` 的資料來源誠實對應 Knowledge Runtime 既有欄位，
  絕不虛構：
  - `generateCoreConcepts` ← `knowledge.concepts`（直接對應）
  - `generateDefinitions` ← `knowledge.definitions`（直接對應）
  - `generateMemorize` ← `knowledge.formulas` + `knowledge.definitions`
    （規則式合併，非 AI：公式與定義是學生通常需要背誦的兩類內容）
  - `generatePitfalls` — Knowledge Runtime Schema 中沒有任何欄位能誠實
    對應「易錯重點」這種需要判斷／归納的內容，且不得呼叫 AI，故為
    誠實 Stub，恆回傳 `[]`
  - `generateReviewSuggestions` — 僅在 `chapter`／`section` 非空時，
    產生一則規則式（非 AI）範本建議字串；若兩者皆空則回傳 `[]`，
    不虛構對不存在章節的複習建議
  - 目前因 Knowledge Runtime 記錄的陣列欄位多為空（上游 Stub 尚未真正
    解析），大部分摘要區段會誠實地為空 — 已用「真實形狀的 Knowledge
    記錄」單獨測試證明，一旦上游有真實資料，五個區段會正確產出對應
    內容，合約不需改變
- `normalize()`／`validate()` 為真實（非 Stub）邏輯，風格與
  `KnowledgeBuilder.js` 完全一致（純函式、不拋例外、不臆測內容）

## Developer QA
- [x] `node --check` — 兩個檔案皆通過
- [x] 禁用模式 grep — 乾淨
- [x] 獨立 jsdom 測試（五檔案：MaterialParser + KnowledgeBuilder +
  KnowledgeRuntime + SummaryGenerator + SummaryRuntime 一起載入於最小
  HTML shell，未接線任何頁面）：
  - `SummaryGenerator` 8 個 Public API、`SummaryRuntime` 8 個 Public
    API 全部存在，皆為函式
  - 全部 8 個 Generator 方法「不帶參數呼叫」皆不拋例外
  - **完整端對端管線測試**：`MaterialParser.parse()` →
    `KnowledgeBuilder.build()` → `KnowledgeRuntime.add()` →
    `SummaryGenerator.generate()` → `SummaryRuntime.sync()`，逐步驗證
    資料正確傳遞（目前因上游皆為 Stub，摘要五段皆誠實為空）
  - **真實資料測試**：以手動建構的「已有真實概念/定義/公式/章節」的
    Knowledge 記錄呼叫 `generate()`，驗證五段輸出正確對應（核心概念、
    重要定義、必背內容皆正確組合；複習建議正確引用章節；易錯重點正確
    保持空陣列，不虛構）
  - `validate()` 對正常記錄回報 `valid:true`，對刻意不完整/型別錯誤的
    記錄正確回報 9 筆錯誤，不拋例外
  - 查詢方法（`list`／`findBySubject`／`findByMaterialId`）皆正確回傳
  - `isEmpty()`／`reset()` 正確反映 store 狀態
  - 儲存記錄逐一核對 Summary Runtime Schema 13 個欄位鍵值完全一致
  - Console Error = 0
- [x] `diff -rq` 比對前次交付 — 除本次新增兩個檔案外，其餘既有檔案
  （含 Sprint 5 全部交付、EO-S6-001／EO-S6-002 交付的全部檔案）逐位
  元組未變動；已用 md5sum 個別確認四個上游檔案完全一致；兩個新檔案皆
  未被任何 `.html` 引用

## Acceptance Checklist
- [x] SummaryGenerator.js
- [x] SummaryRuntime.js
- [x] Summary Runtime Schema（完全符合指定 13 個欄位）
- [x] Knowledge Runtime → Summary Runtime（`sync()` 完整管線已測試）
- [x] generate() 可正常呼叫（含不帶參數）
- [x] normalize() 可正常呼叫（含不帶參數）
- [x] validate() 可正常呼叫（含不帶參數、含刻意不完整記錄）
- [x] Public API 全部存在（Generator 8 個 + Runtime 8 個）
- [x] Console Error = 0
- [x] 未修改 UI
- [x] 未修改 Knowledge Runtime
- [x] 未修改 Material Runtime
- [x] 未修改 Repository Structure

## Known Issues
無。本次未發現需要 PMO 裁示的架構衝突（路徑、Namespace 用法、
Builder/Runtime 分工模式皆延續 EO-S6-001／EO-S6-002 已確認的慣例）。
