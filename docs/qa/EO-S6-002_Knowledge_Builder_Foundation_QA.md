# EO-S6-002 — Knowledge Builder Foundation — QA Report

## Scope Confirmation
- `js/services/KnowledgeBuilder.js`（新增）與 `js/runtime/KnowledgeRuntime.js`
  （新增）路徑完全依 EO 指定，無需路徑調整
- `KnowledgeBuilder.js` 為純函式、無狀態，從未讀取或呼叫
  `AHS.KnowledgeRuntime`、任何 UI、或 AI API（全站無 AI API 可呼叫）
- `KnowledgeBuilder.js` 只接受 Material Document 作為輸入，從未直接解析
  PDF／DOCX／PPTX／Image／Audio
- `KnowledgeRuntime.js` 僅負責儲存／查詢／同步，未產生 Summary、未產生
  Question
- 未修改 `js/services/MaterialParser.js`（本次未編輯此檔案；EO-S6-001
  交付版本原樣保留）
- 未修改 `js/runtime/MaterialRuntime.js`（逐位元組確認與 Sprint 5
  Baseline 相同）
- 未修改 Material Document Schema（`KnowledgeBuilder.js` 僅讀取其
  `content`／`materialId`／`subject`／`grade`／`fileName`／`fileType`／
  `category` 欄位，未新增或改動該 Schema 本身）
- 未修改任何 UI／頁面／Sidebar／Bottom Navigation — 兩個新檔案皆未被
  任何 `.html` 引用（已用 grep 全站確認為零筆），與 EO-S6-001 相同慣例，
  刻意保持獨立
- 無 ES Module、無 Router、無新 Framework、無 fetch/XHR/localStorage

## Implementation Notes
- `KnowledgeBuilder` 與 `KnowledgeRuntime` 的分工：Builder 只負責「建立
  知識結構」（純函式，`build()` 回傳完整記錄但不寫入任何地方）；Runtime
  的 `sync(materialDocument)` 才是「Material Document → Knowledge
  Runtime」流程的橋接點 — 內部呼叫 `AHS.KnowledgeBuilder.build()` 後
  存入 store，符合 Runtime 說明的「同步」職責，同時保持兩者關注點分離
  （Builder 不觸碰 Runtime，Runtime 不做萃取邏輯）
- `extractConcept`／`extractKeyword`／`extractDefinition`／
  `extractFormula`／`extractExample`／`extractExercise` 皆為誠實的
  Stub（回傳 `[]`）— 因為 Material Document 目前的 `content` 永遠是
  `MaterialParser.js` 產生的 Stub 字串，沒有可靠、非 AI 的訊號可供萃取，
  回傳空陣列比虛構內容更符合本專案一貫原則（今日待複習固定 0、花費時間
  「尚無資料」等同一慣例）
- `extractChapter`／`extractSection` 則是真實（非 Stub）的正規表達式
  邏輯，對 `content` 字串尋找「第X章／第X節」模式；在目前的 Stub 內容下
  通常回傳空字串，但已用真實內容測試證明其正確運作 — 一旦
  `MaterialParser.js` 未來實作真正解析，此函式不需修改即可生效
- `normalize()`／`validate()` 為真實（非 Stub）的資料整形／檢查邏輯：
  純函式、不拋例外、不臆測內容，只保證型別正確與必要欄位存在
- id／createdAt 慣例沿用 `MaterialParser.js`／既有 Runtime 一致的格式
  （`YYYY/MM/DD`、遞增計數器 id）

## Developer QA
- [x] `node --check` — 兩個檔案皆通過
- [x] 禁用模式 grep — 乾淨
- [x] 獨立 jsdom 測試（三檔案：MaterialParser + KnowledgeBuilder +
  KnowledgeRuntime 一起載入於最小 HTML shell，未接線任何頁面）：
  - `KnowledgeBuilder` 11 個 Public API 全部存在，皆為函式
  - `KnowledgeRuntime` 8 個 Public API 全部存在（add／sync／list／
    isEmpty／getById／findByMaterialId／findBySubject／reset）
  - 全部 11 個 Builder 方法「不帶參數呼叫」皆不拋例外
  - **完整管線測試**：`MaterialParser.parse()` → `KnowledgeBuilder.build()`
    → `KnowledgeRuntime.add()`，逐步驗證資料正確傳遞
  - `KnowledgeRuntime.sync(materialDocument)` 一次呼叫完成
    Builder+Runtime 橋接，驗證正確
  - 查詢方法（`list`／`getById`／`findByMaterialId`／`findBySubject`）
    皆正確回傳
  - 儲存記錄逐一核對 Knowledge Runtime Schema 15 個欄位鍵值完全一致
  - `extractChapter`／`extractSection` 對真實內容字串正確擷取
    「第三章 指數函數」／「第一節 指數的定義」；對 Stub 內容正確回傳
    空字串（無誤判、無擷取到檔名副檔名等雜訊 — 已修正過一次正規表達式
    避免貪婪比對吃到 `.pdf` 等副檔名）
  - `validate()` 對刻意不完整的記錄正確回報 10 筆缺漏訊息，不拋例外
  - `reset()` 正確清空 store
  - Console Error = 0
- [x] `diff -rq` 比對前次交付 — 除本次新增兩個檔案外，其餘既有檔案
  （含 Sprint 5 全部交付、`MaterialParser.js`、`MaterialRuntime.js`）
  逐位元組未變動；兩個新檔案皆未被任何 `.html` 引用

## Acceptance Checklist
- [x] KnowledgeBuilder.js
- [x] KnowledgeRuntime.js
- [x] Knowledge Runtime Schema（完全符合指定 15 個欄位）
- [x] Material Document → Knowledge Runtime（`sync()` 完整管線已測試）
- [x] build() 可正常呼叫（含不帶參數）
- [x] normalize() 可正常呼叫（含不帶參數）
- [x] validate() 可正常呼叫（含不帶參數、含刻意不完整記錄）
- [x] Public API 全部存在（Builder 11 個 + Runtime 8 個）
- [x] Console Error = 0
- [x] 未修改 UI
- [x] 未修改 Material Runtime
- [x] 未修改 Material Parser
- [x] 未修改 Repository Structure

## Known Issues
無。本次未發現需要 PMO 裁示的架構衝突（路徑、Namespace 用法皆延續
EO-S6-001 已確認的慣例）。
