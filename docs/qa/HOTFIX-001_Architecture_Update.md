# Architecture Update — PMO Decision 025 · Architecture Evolution v2.0
# Runtime Persistence Layer

## 1. Runtime Persistence Layer — Overview

```
UI
 ↓
Runtime  (MaterialRuntime / KnowledgeRuntime / SummaryRuntime / LearningQuestionRuntime)
 ↓
Persistence Adapter  (AHS.PersistenceAdapter — js/core/PersistenceAdapter.js)
 ↓
sessionStorage
```

四個 Runtime 現在會在模組載入時（top-level IIFE 執行時）呼叫
`AHS.PersistenceAdapter.load(key)` 嘗試還原上一頁留下的資料；若找到，
`store` 就從還原資料開始，而非固定的空物件。每次寫入操作（`add`／
`remove`／`toggleFavorite`／`markPreviewed`／`startLearning`／
`addFolder`／`removeFolder`／`reset` 等，依各 Runtime 實際擁有的
mutating 方法）結束時，呼叫 `persist()` 將目前 `store` 存回
`AHS.PersistenceAdapter.save(key, store)`。

**沒有任何 Runtime 直接呼叫 `window.sessionStorage`** — 全部經過
`AHS.PersistenceAdapter`，符合「Storage 存取應集中於 Adapter」之要求。
未來若導入 Cloud Storage／Backend，只需替換
`js/core/PersistenceAdapter.js` 這一個檔案的內部實作（`save`／
`load`／`remove`／`clear` 這四個方法簽章不變），四個 Runtime 完全不需
修改一行程式碼。

## 2. Persistence Adapter — `js/core/PersistenceAdapter.js`

Public API：
- `save(key, value)` → boolean：JSON 序列化後寫入 `sessionStorage`，
  key 前綴 `"ahs:"` 避免與其他頁面/第三方腳本衝突。失敗（storage 不可用、
  超出容量、值無法序列化）回傳 `false`，絕不拋出例外。
- `load(key)` → 還原的值，或 `null`（key 不存在／storage 不可用／JSON
  損毀）。絕不拋出例外。
- `remove(key)`／`clear()`：移除單一 key／移除所有 `"ahs:"` 前綴 key。
- `isAvailable()`：以一次 try/catch 探測 `sessionStorage` 是否可用（
  隱私模式、被停用、非瀏覽器環境等情況下會傳回 `false`），結果快取。

**Fail-safe 設計**：若 `sessionStorage` 完全不可用，四個 Runtime 會
自動退回本次修正前的行為（純記憶體、不跨頁）——不會拋錯、不會讓頁面
壞掉，只是 Persistence 這個新能力在該環境下沒有效果。

## 3. SessionStorage Flow（實際資料流）

1. 使用者在 `materials.html` 上傳教材 → `MaterialRuntime.add()` 寫入
   記憶體 `store` → 呼叫 `persist()` → `AHS.PersistenceAdapter.save
   ("materialRuntime", store)` → 寫入 `sessionStorage["ahs:materialRuntime"]`
2. 同一次上傳後半段，`MaterialCenter.js` 呼叫既有（未修改）
   `AHS.LearningPipeline.process()` → 依序觸發
   `KnowledgeRuntime.sync()`／`SummaryRuntime.sync()`／
   `LearningQuestionRuntime.sync()`，各自的 `add()` 內部也呼叫自己的
   `persist()`，各自寫入 `sessionStorage["ahs:knowledgeRuntime"]`／
   `["ahs:summaryRuntime"]`／`["ahs:learningQuestionRuntime"]`
3. 使用者點擊 Sidebar／Bottom Navigation 連結（真實 `<a href>`，
   整頁導航）前往 `index.html`／`quiz.html`／`summary.html` 等頁面
4. 瀏覽器對同一個 Tab 的 `sessionStorage` 是原生共用的（這是瀏覽器本身
   的行為，不需要任何額外程式碼）——新頁面載入時，四個 Runtime 的
   IIFE 在模組載入當下就呼叫 `hydrate()` 讀回上一頁寫入的資料，`store`
   從真實資料開始，而非空物件
5. `index.html`（Home）在 `js/pages/app.js` 的 `buildHome()` 中，讀取
   `AHS.MaterialRuntime.list()`／`AHS.SummaryRuntime.list()`（皆為既有
   Public API，唯讀）組出真實 model，傳入既有的
   `HomeRecentMaterials.create(model)`／`StudyStats.create(model)`／
   `ContinueLearning.create(model)` —— Home 完全沒有直接碰
   `sessionStorage` 或 `AHS.PersistenceAdapter`，一律透過 Runtime 的
   既有 API
6. 瀏覽器 Session 結束（分頁或瀏覽器關閉）時，`sessionStorage` 由
   瀏覽器自動清除 —— 完全不需要任何額外程式碼，也是本次授權範圍
   （sessionStorage 作為第一階段 Provider）明確要求的行為

## 4. Compatibility Review

| 項目 | 是否變動 | 說明 |
|---|---|---|
| MaterialRuntime Public API | 未變動 | `list/isEmpty/getById/add/remove/toggleFavorite/favorites/recentByCreatedOrder/addFolder/listFolders/getFolderById/folderMaterialCount/removeFolder/searchFolders/markPreviewed/startLearning/reset` 簽章與回傳形狀皆未變 |
| MaterialRuntime Schema | 未變動 | 記錄欄位集合不變；`file` 欄位語意不變（原本就註明"Not persisted"，本次持久化實作忠實遵守這點） |
| KnowledgeRuntime／SummaryRuntime／LearningQuestionRuntime Public API | 未變動 | `add/sync/list/isEmpty/getById/findByMaterialId/findBySubject(/findByConceptId)/reset` 皆未變 |
| Learning Pipeline | 未變動（零程式碼修改） | Pipeline 完全透過上述 Runtime 的既有方法運作，Runtime 內部改為持久化對 Pipeline 完全透明 |
| QuestionRuntime（Sprint 4） | 未變動 | 本次授權範圍外，逐位元組確認未變 |
| Core Engine（Material Parser／Knowledge Builder／Summary Generator／Question Generator） | 未變動 | 逐位元組確認未變 |
| Repository Structure | 未重構 | 僅新增一個檔案 `js/core/PersistenceAdapter.js`，放在既有 `js/core/`（與 `ui.js`／`Icons.js` 同層的基礎設施位置），未新增／調整任何資料夾 |
| Architecture | 僅新增被授權的部分 | 多頁面 + Router-free 導航模式未變（仍是真實 `<a href>` 整頁導航，非 SPA）；僅新增 Persistence 這一層，其餘 Architecture 原則不變 |

## 5. Home Sync（Fix-002 重新實作）

`js/pages/app.js` 新增三個 `buildXModel()` 函式，皆只透過 Runtime 既有
公開方法讀取資料（`list()`），從不直接碰 `sessionStorage`／Adapter：

- `buildRecentMaterialsModel()` → 對應「最近教材」，同時查詢
  `SummaryRuntime.list()` 標記哪些教材已有摘要（`hasSummary`），對應
  Fix-002 的「Summary」更新項目
- `buildStudyStatsModel()` → 對應「Statistics」，誠實依真實
  `learningTime`／`progress` 計算，無真實資料時保持 0，不虛構非零數字
- `buildContinueLearningModel()` → 對應「Recent Learning」；因目前
  沒有任何流程呼叫 `MaterialRuntime.startLearning()`，此函式目前恆
  回傳 `undefined`，Home 誠實地退回既有 Mock Seed Data 顯示 —— 這是
  已知、如實記錄的限制，非本次修正範圍內的 Bug（見 Known Issues）

三個函式回傳 `undefined` 時，`HomeRecentMaterials.create()`／
`StudyStats.create()`／`ContinueLearning.create()` 皆已有既有的
Mock Fallback 邏輯（`model || AHS.Mock.xxx`／
`model !== undefined ? model : AHS.Mock.xxx`），完全不需修改這三個
元件檔案的邏輯本身。

`HomeRecentMaterials.js` 新增一個小型、誠實的「已生成學習總結」徽章
（只在 `item.hasSummary` 為真時才渲染，資料完全來自真實
`SummaryRuntime`，非本檔案自行判斷或臆測）。

## 6. Regression QA

詳見 `docs/qa/HOTFIX-001_Runtime_Persistence_QA.md`。摘要：
- 9 個頁面全數重新載入：0 錯誤
- 跨頁持久化端對端測試（真實檔案上傳互動 + 模擬瀏覽器分頁間
  sessionStorage 共用）：上傳教材 → 離開頁面 → 重新進入
  `materials.html`／`quiz.html`／`index.html`：資料皆正確還原
- Home Sync 端對端測試：上傳前顯示 Mock Fallback；上傳後顯示真實
  「最近教材」「Summary 徽章」「Statistics」
- Fix-003 確認：所有 Runtime 起始狀態仍為空，無新增 Mock 自動建立行為

## 7. Known Limitations（誠實記錄，非本次範圍內 Bug）

1. **`file`（上傳檔案的 File 物件參考）無法跨頁保存** — File 物件本身
   無法有意義地序列化，這是瀏覽器層級的限制，非本 Adapter 的缺陷。
   還原後 `file` 一律為 `null`，其餘欄位（`fileName`／`fileType`／
   `fileSize` 等中繼資料）完全保留。原始碼中此欄位早已註明
   "Not persisted"。
2. **「Recent Learning」（繼續學習）目前仍顯示 Mock 內容** — 因為目前
   沒有任何頁面呼叫 `MaterialRuntime.startLearning()`，這條資料流是
   誠實地「還沒有真實資料」，而非持久化機制故障。若需要串接
   （例如 Practice Mode 完成練習時呼叫 `startLearning()`），屬於新
   功能範疇，建議另立 EO。
3. **sessionStorage 有容量上限**（通常各瀏覽器 5–10MB）——目前資料量
   遠低於此上限；若未來教材數量大幅增加，`save()` 會靜默失敗並回傳
   `false`（不拋錯，但該次寫入不會被持久化）。建議未來視需要在
   Adapter 內加入容量監控或資料清理策略。
