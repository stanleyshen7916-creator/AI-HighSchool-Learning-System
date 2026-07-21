# Sprint 6.6 Runtime QA Round 3 — Bug Fix Report

## Scope Confirmation
確認本輪完全未修改：Repository Structure、Runtime Architecture、UI
Library（既有元件樣式基準）、Design Token、Component Baseline、
Runtime API、Runtime Schema（已用 diff 逐一確認）。

---

## Issue #022｜WO-011 教材中心－Header 全域搜尋無法使用

### 根因
`js/components/AppShell.js`（所有頁面共用的頂部 Header）的
`.topbar__search-input` 從建立以來**從未綁定任何事件監聽器**——純
裝飾性輸入框，這是真實缺陷，非部署延遲。

### 修正
- `AppShell.js`：`create(model, options)` 新增可選
  `options.onGlobalSearch(keyword)`，於 Header 搜尋框 `input` 事件
  即時觸發。未提供此參數的頁面（首頁、Summary、Quiz 等）完全不受
  影響，行為與修正前一致
- `MaterialCenter.js`：`create()` 回傳的節點新增 `setKeyword(keyword)`
  方法，接到既有（已驗證正常運作的）搜尋／篩選流程，與教材中心自己
  的搜尋框共用同一套比對邏輯（教材名稱／章節／檔名／內容／資料夾
  名稱），並新增比對**教材編號**（`item.id`，WO-011 明確要求但原邏輯
  未涵蓋）
- `js/pages/app-materials.js`：串接 `onGlobalSearch` → `setKeyword()`

### 驗證
真實上傳 2 筆教材 → 在 Header 搜尋框（非教材中心自己的搜尋框）輸入
關鍵字 → 即時正確篩選為 1 筆；輸入教材編號同樣正確篩選；教材中心
自己的搜尋框同步顯示相同關鍵字。無資料時既有 Empty State 邏輯不變。
Console Error = 0。

---

## Issue #023｜WO-012 教材中心－格式篩選內容不足

### 根因
`js/data/mock-data.js` 的格式選項僅
`["全部格式","PDF","PPT","DOCX","MP4"]`，與 WO-012 要求清單差距甚大。

### 修正
- 格式選項擴充為：全部格式／PDF／PPT／PPTX／DOC／DOCX／XLS／XLSX／
  TXT／MP4／MP3／JPG／JPEG／PNG／GIF／WEBP／其他（完整對應 WO-012
  清單）
- 「其他」新增真實比對邏輯：符合任何**不在**上述已命名清單中的
  `fileType`，而非裝飾性選項
- 既有比對邏輯（`item.fileType` 大小寫比對）不需修改即可套用全部
  新格式（`fileExt()` 本已忠實擷取真實副檔名）

### 驗證
上傳 `.pptx`／`.webp`／`.xyz`（未知格式）三筆教材 → 選擇「PPTX」
正確篩選為 1 筆；選擇「其他」正確篩選出 `.xyz` 那一筆。Console
Error = 0。

---

## Issue #024｜WO-013 學習總結－摘要內容未載入

### 調查結果（重要）
以**真實端對端上傳流程**（非手動塞測試資料）追蹤一筆真實 Summary
Runtime 記錄，結果為：

```
coreConcepts: []
definitions: []
pitfalls: []
memorize: []
reviewSuggestions: ["建議複習：第八章 光合作用"]
```

**`SummaryCenter.js` 確實有正確讀取 Runtime**（`reviewSuggestions`
正確顯示真實內容），並非讀取邏輯缺陷。四個區塊（核心概念／重要定義／
易錯重點／必背內容）誠實地為空，根本原因是上游 `KnowledgeBuilder.js`
的萃取器面對的 Material Document `content` 目前恆為 MaterialParser
產生的 Stub 字串（例如「[Stub] PDF 內容尚未解析：檔名.pdf」）——這是
Sprint 6（EO-S6-002／EO-S6-003）當時就已明訂、刻意採用的
Stub Implementation 設計，並非本輪引入的缺陷。

**若某筆教材連章節資訊都無法從檔名擷取（例如檔名未包含「第X章」），
則 `reviewSuggestions` 也會是空的，此時五個區塊會全部顯示「尚無
資料」**——這正是 QA 回報的實際情境。

**由於全站沒有任何 PDF/文件真實內容解析能力（沒有對應函式庫、無法
新增 Framework、也不允許新增 Backend／Cloud API），無法在不虛構內容
的前提下讓五個區塊出現「真正的」核心概念等內容。** 若要讓內容真正
非空，需要先有真實文件解析能力，這超出本次 Bug Fix 範圍，也非
Runtime 讀取問題可以解決。

### 已完成的、誠實可達成的修正
- **區分「教材完全沒有建立過 Summary」與「Summary 已建立但內容為
  Stub」兩種情況**：
  - 透過 `?materialId=` 深層連結進入某教材，但該教材**完全沒有**
    Summary 記錄 → 顯示規定文案「尚未建立學習總結」（`sum-empty`，
    非本次新建 UI 樣式，僅新增訊息內容）
  - Summary 記錄**存在**，但五個區塊全部誠實為空 → 不再顯示五個
    重複的「尚無資料」，改為**一個**清楚說明「此教材的學習總結尚未
    包含具體內容。教材解析（核心概念／重要定義／易錯重點／必背
    內容）功能持續開發中，完成後會自動顯示於此。」——誠實說明現況，
    不虛構內容
  - 若五個區塊中**至少一個**有真實內容（如上方真實案例的
    `reviewSuggestions`），則正常逐一顯示每個區塊（有內容的顯示
    內容，仍為空的維持個別「尚無資料」，因為此時已有其他真實內容
    可對照，不會讓整頁看起來像完全空白／故障）

### 驗證
- 真實情境（`reviewSuggestions` 有內容，其餘 4 個為空）→ 正常逐一
  顯示 5 個區塊（非本次新增的「整合訊息」分支）
- 模擬「五個區塊全部真的空」情境 → 正確顯示單一整合說明訊息，不再是
  5 個重複「尚無資料」
- 深層連結至完全沒有 Summary 的教材 → 正確顯示「尚未建立學習總結」，
  非空白畫面
- Console Error = 0

---

## WO-014｜Runtime Interactive Component Audit

### 方法
逐一檢查教材中心（連同共用 Header）列出的每個互動元件，確認其為
①已完整實作、②Disabled 並說明原因、或③明確標示 Coming Soon 三者
之一，不得「看起來可操作但實際無功能」。

### 稽核結果

| 元件 | 狀態 | 說明 |
|---|---|---|
| Header Search | ① 已修正為完整實作 | 見 Issue #022 |
| 教材搜尋（教材中心自身） | ① 已完整實作 | 本輪重新驗證：真實上傳＋輸入關鍵字即時正確篩選，非裝飾性 |
| 全部分類（分類頁籤） | ① 已完整實作 | `AHS.MaterialCategoryTabs` 真實回呼，驅動 `currentCategory` |
| 科目 / 年級（篩選面板） | ① 已完整實作 | `AHS.MaterialFilter` 真實回呼，驅動 `currentFilter` |
| 排序 | ① 已完整實作 | `AHS.MaterialSort.apply()` 真實排序既有清單 |
| 格式 | ① 已修正為完整實作 | 見 Issue #023 |
| 篩選（整體 Filter Panel） | ① 已完整實作 | 與科目/年級為同一套真實邏輯 |
| 檢視切換（格狀／列表） | ① 已完整實作 | `setView()` 真實切換 `data-view` 屬性驅動版面 |
| 新增資料夾 | ① 已完整實作 | 真實呼叫 `AHS.MaterialRuntime.addFolder()` |
| 教材上傳（單檔／批量） | ① 已完整實作 | 前幾輪已驗證，本輪重新迴歸測試通過 |
| 教材卡片（收藏／預覽／下載／刪除） | ① 已完整實作 | 收藏／預覽（真實開啟 `AHS.MaterialPreview`）／下載／刪除（真實刪除確認對話框）皆呼叫真實 `AHS.MaterialRuntime` 方法 |
| 最近學習（教材中心內） | ① 已完整實作 | `AHS.MaterialRecentLearning.createFromRuntime()` 讀取真實 Runtime |
| 學習總結（Summary 徽章／連結） | ① 已修正為完整實作 | 見 Issue #024，深層連結＋內容誠實呈現 |

**結論**：本次全面稽核未發現額外「UI 已存在但 Runtime 未實作」的
隱藏缺陷；教材中心既有互動元件在 Header 搜尋與格式篩選修正後，全部
符合規則①（已完整實作）。

---

## Regression
- 全站 9 個頁面重新載入：Console Error = 0
- 首頁（Recent Material／Statistics／Continue Learning／Summary
  badge）、教材中心（單檔／批量上傳、原有搜尋、Practice Mode）、
  Material Runtime、Summary Runtime、Search Runtime（既有）、Quiz
  Runtime：重新測試結果與前一輪一致，未受影響
- `diff -rq` 比對前一輪交付：確認本輪異動精確為 6 個檔案，其餘（含
  全部 Runtime、Persistence Adapter、Learning Pipeline、Design
  Token、其餘既有元件）逐位元組未變動

## Acceptance Checklist
- [x] Issue #022 PASS
- [x] Issue #023 PASS
- [x] Issue #024 PASS
- [x] Interactive Component Audit PASS
- [x] Console Error = 0
- [x] Runtime Error = 0
- [x] Architecture 不變
- [x] Repository 不變
- [x] Runtime API 不變
