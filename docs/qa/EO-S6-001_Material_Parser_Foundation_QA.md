# EO-S6-001 — Material Parser Foundation — QA Report

## Flags Raised

**1. 路徑調整：`processors/MaterialParser.js` → `js/services/MaterialParser.js`.**
專案中沒有 `processors/` 這個資料夾（也沒有任何檔案曾用過這個路徑）。
但專案已存在一個空的、預先規劃好的 `js/services/` 資料夾（與
`js/runtime/`、`js/components/` 同層，git 上只有 `.gitkeep`），概念上正是
「非 UI、非 Runtime 的處理／服務模組」該放的位置。使用它不需新增任何
頂層目錄，完全符合本 EO「不得修改 Repository Structure」；若照字面新增
`processors/` 才會真正變成修改 Repository Structure。已採用
`js/services/MaterialParser.js`，特此記錄供 PMO 確認。

**2.「不得修改 window.AHS Namespace」的解讀。** 本檔案仍依照全專案唯一
慣例，以 `AHS.MaterialParser = (function () {...})();` 掛載到既有
`window.AHS` 命名空間下（與 `AHS.WrongBookRuntime`、
`AHS.ReviewHomeCard` 等完全同一寫法）。理解為「不得改變命名空間的機制
／結構」（例如另建全域變數、改名 AHS、改用 ES Module），而非「不得新增
任何屬性」— 否則全專案自 Sprint 1 起的每一次 EO 都會牴觸此規則。若 PMO
意圖更嚴格，請再次裁示。

## Scope Confirmation
- 未建立 Knowledge Runtime／Summary Runtime／Question Runtime
- 未修改 `js/runtime/MaterialRuntime.js`（逐位元組確認未變動，本檔案
  完全未讀取或引用它）
- 未修改任何 UI／頁面／Sidebar／Bottom Navigation（`MaterialParser.js`
  未被任何 `.html` 檔案的 `<script>` 標籤引用 — 已用 grep 全站確認為
  零筆），本 EO 刻意保持獨立、未接線，留給後續 EO（Knowledge Builder
  等）處理
- 未使用 ES Module（無 `import`/`export`）、無 Router、無新 Framework
- 無 `fetch`／`XMLHttpRequest`／`localStorage`／`require`

## Implementation Notes
- Material Document Schema 完全依 EO 指定：
  `{ id, materialId, subject, grade, category, fileName, fileType,
  content, createdAt }`，`content` 一律為 `String`
- 六種格式（PDF／DOCX／PPTX／TXT／Image／Audio）+ `parse()` 共 7 個
  Public API，全部存在且皆可正常呼叫（含不帶參數呼叫）
- 真實二進位解析（PDF/DOCX/PPTX/音訊/圖片解碼）在無 build tool、無
  後端、純前端 Prototype 環境中不可行（缺乏對應函式庫），故依 EO 明文
  允許的「Stub Implementation」處理：每個 parseX() 回傳完整、正確形狀
  的 Material Document，`content` 為清楚標示的
  `"[Stub] <格式> 內容尚未解析：<檔名>"` 字串，絕不假造解析結果，也絕
  不拋出例外
- `parseTXT()` 例外處理：若呼叫者提供 `raw.rawText`（本來就是純文字，
  無需二進位解析），直接使用該文字作為 `content`（真實而非 Stub）；
  否則回退為與其他格式一致的 Stub 慣例
- `parse(raw)` 依 `raw.fileType`（不分大小寫）分派至對應方法；未知或缺
  少 `fileType` 時，回退為 `fileType: "UNKNOWN"` 的通用 Stub 文件，
  絕不拋出例外（滿足 Acceptance「parse() 可正常呼叫」）
- `createdAt` 格式沿用 `js/runtime/MaterialRuntime.js` 既有的
  `formatDate()`（`YYYY/MM/DD`），維持風格一致
- id 產生方式：模組內部計數器（`mdoc_1`, `mdoc_2`, ...），與全專案其他
  模組相同 — Session-scoped、無 Storage

## Developer QA
- [x] `node --check` — 通過
- [x] 禁用模式 grep（`fetch`／`XMLHttpRequest`／`localStorage`／
  `import`／`export`／`require`）— 乾淨
- [x] 獨立 jsdom 測試（本檔案未接線至任何頁面，故以最小 HTML shell
  單獨載入測試，符合本 EO 範圍）：
  - 7 個 Public API 皆存在且為函式
  - 全部 7 個方法「不帶參數呼叫」皆不拋出例外，`content` 皆為 `string`
  - `parse({fileType:"pdf", ...})` 正確分派至 `parsePDF` 邏輯，回傳
    schema 完全符合（9 個欄位，鍵值集合逐一核對一致）
  - `parseTXT({rawText:"..."})` 正確使用真實文字，非 Stub
  - `parse({fileType:"zip"})`（未知格式）不拋出例外，回退為
    `fileType:"UNKNOWN"` 的合法 Stub 文件
  - 連續呼叫產生的 id 皆為唯一值
  - Console Error = 0
- [x] `diff -rq` 比對 Baseline — 除本檔案（新增）外，Sprint 5 已交付的
  全部檔案逐位元組未變動；`MaterialParser.js` 未被任何 `.html` 引用

## Acceptance Checklist
- [x] MaterialParser.js
- [x] Parser Interface（6 格式 + parse() 皆完整）
- [x] Material Document Schema（完全符合指定欄位）
- [x] 六種 Input API
- [x] parse() 可正常呼叫（含邊界案例：無參數、未知格式）
- [x] Console Error = 0
- [x] 未修改 UI
- [x] 未修改 Runtime Schema
- [x] 未修改 Repository Structure（使用既有 js/services/ 空資料夾）

## Known Issues
1. 路徑由 `processors/` 調整為 `js/services/`（見 Flag 1），待 PMO 確認
2. 所有格式目前皆為 Stub（除 `parseTXT` 在提供 `rawText` 時），真實解析
   邏輯留待後續 EO／技術方案決定後再實作
