# LearningQuestionRuntime v1.0

- EO：EO-S6.9-001｜日期：2026-07-22
- **PMO Ruling 1B（命名）**：因 `js/runtime/LearningQuestionRuntime.js`（EO-S6-004，LOCK，Practice Mode 現行資料來源）已存在且本 EO 禁止修改 Runtime，本規格由**新模組 `AHS.LearningQuestionSession`**（`js/runtime/LearningQuestionSession.js`）實作 —— 沿用 EO-S6-004 QuestionRuntime 命名衝突之處理前例。既有 LearningQuestionRuntime.js 零變更（diff 驗證）。

## 狀態（固定四項，Store/Query only）

| 狀態 | API | 說明 |
|---|---|---|
| Question List | `add()`（validate-gated）、`list()`、`count()`、`isEmpty()`、`getById()`、`findByMaterialId()` | 僅存 Schema v1.0 合法記錄 |
| Current Index | `getCurrentIndex()`、`setCurrentIndex(i)`（range-clamped）、`getCurrent()` | 純導覽狀態，無副作用 |
| Metadata | `getMetadata()`、`setMetadata(patch)` | 淺合併 |
| Status | `getStatus()` → `"empty"` \| `"ready"` | **推導值**，不可外部設定，無法造假 |

## 禁止項（EO 明定，API 層面即不存在）

Practice Logic、Wrong Book Logic、Score Logic —— 無作答、無評分、無同步其他 Runtime 之任何方法。

## Gate 與持久化

`add()` 一律先經 `AHS.LearningQuestionGenerator.validate()`；失敗回傳 `null` 且不儲存。Interface 未載入時無 gate 可用 → 一律拒收。持久化依 PMO Decision 025 僅經 `PersistenceAdapter`（key：`learningQuestionSession`，與既有 `learningQuestionRuntime` 完全隔離，測試驗證零交叉寫入）。
