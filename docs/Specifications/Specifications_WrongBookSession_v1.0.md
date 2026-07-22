# Specifications_WrongBookSession_v1.0

- EO：EO-S7.0-001｜模組：`AHS.WrongBookSession`（`js/runtime/WrongBookSession.js`）
- 命名：與 Sprint-4 `WrongBookRuntime`（LOCK，零變更）並行，依 EO-S6.9-001 Ruling 1B 前例。

## 固定內容（Store / Query only）

| 內容 | API |
|---|---|
| Wrong Question List | `list()` `count()` `isEmpty()` `getById()` `getByQuestionId()` `findBySubject()` `findByStatus()` |
| Statistics | `statistics()` → `{total, totalWrongCount, bySubject, byMastery, byStatus}`（即時推導，永不儲存、永不過期） |
| Metadata | `getMetadata()` `setMetadata(patch)` |
| Status | `getStatus()` → `"empty"` \| `"ready"`（推導值，不可外部設定） |

## 禁止項（API 層面即不存在）

Review Logic、Practice Logic、AI Logic —— 無排程、無評分、無推論方法。

## 寫入路徑

`store(record, validateFn)` 與 `removeById(id)` 僅由 `WrongBookGenerator` Interface 呼叫（架構上唯一寫入者）；store() 自行重跑 Interface validate() 作為 Runtime Validation gate —— 未通過驗證之記錄無論來源一律拒收。持久化僅經 PersistenceAdapter（key：`wrongBookSession`，與 legacy 錯題資料及所有 Runtime 完全隔離）。

## Empty State 支撐

`isEmpty()` / `getStatus()==="empty"` 供接線 EO 顯示「目前沒有錯題紀錄。」；Foundation 本身不接線任何頁面。
