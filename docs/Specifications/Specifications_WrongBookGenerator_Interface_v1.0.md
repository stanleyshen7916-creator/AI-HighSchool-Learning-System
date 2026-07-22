# Specifications_WrongBookGenerator_Interface_v1.0

- EO：EO-S7.0-001｜模組：`AHS.WrongBookGenerator`（`js/parser/WrongBookGenerator.js`）
- 血緣：LearningQuestionSession → **WrongBookGenerator** → WrongBookSession → Review Queue → Review Center

## Interface（固定四方法，所有錯題操作必經）

### `add({ questionId, userAnswer }) -> record | null`
唯一建立/累計錯題的途徑。僅接受兩個輸入欄位；其餘 20 欄一律**唯讀解析自 LearningQuestionSession 的真實題目**。拒收條件（皆回傳 null、零副作用）：questionId 查無題目（不得人工建立）、userAnswer 為空、userAnswer 等於 correctAnswer（答對不得加入）。已存在同 questionId：wrongCount +1、更新 lastWrongAt/updatedAt/userAnswer，**firstWrongAt 不參與 patch（不得覆蓋）**。首次：wrongCount=1、firstWrongAt=lastWrongAt、masteryLevel="new"、status="active"、nextReviewAt=null。

### `update(id, patch) -> record | null`
明確欄位更新（masteryLevel 於固定 enum 內轉換、status、呼叫端提供之 nextReviewAt 等）。鎖定欄位不受 patch 影響：id / questionId / materialId / **wrongCount / firstWrongAt** / createdAt / traceability。patch 結果未通過 validate → 整筆拒絕、原記錄不變。

### `remove(id) -> boolean`

### `validate(record) -> { valid, errors }`
Schema Validation v1.0（見 Schema 規格）。Session.store 以同一函式作 Runtime gate。

## 公開常數
`MASTERY_LEVELS`：new / learning / reviewing / mastered（固定）｜`STATUSES`：active / archived（固定）

## Review Queue Foundation（`AHS.ReviewQueue`，`js/runtime/ReviewQueue.js`）
固定四欄 `{questionId, nextReviewAt, priority, masteryLevel}`。enqueue 驗證：questionId 必須對應真實錯題（不得直接產生 Review）、masteryLevel 於固定 enum、priority 為數字；nextReviewAt 一律呼叫端提供（**不得自動排程**，預設 null）。同 questionId 取代不重複。Foundation Only —— 無任何排程/產生邏輯。
