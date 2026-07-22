# Specifications_WrongBook_Schema_v1.0

- EO：EO-S7.0-001｜日期：2026-07-22

## Schema（固定 22 欄）

| 欄位 | 型別 | 規則 |
|---|---|---|
| `id` | String | 必填，`wb_` 前綴 |
| `questionId` | String | 必填，**必須對應 LearningQuestionSession 之真實題目**（防人工建立/假資料的結構性保證） |
| `materialId` / `subject` | String | 必填，解析自題目記錄 |
| `chapter` / `section` | String | 解析自題目記錄 |
| `knowledgePoint` | String | 必填不得為空 |
| `difficulty` | Enum | easy / medium / hard |
| `questionType` | Enum | Schema v1.0 五類 snake_case |
| `userAnswer` | Any | 必填不得為空；**不得等於 correctAnswer**（答對不得加入） |
| `correctAnswer` | Any | 必填，解析自真實題目 |
| `explanation` | String | 必填不得為空，解析自真實題目 |
| `traceability` | Object | **EO-S6.9 全部保留**（materialId + knowledgeId + summaryId 原樣複製） |
| `wrongCount` | Number | ≥1；僅 add() 可遞增 |
| `firstWrongAt` | ISO String | 首次建立時寫入，**不得覆蓋**（update 路徑鎖定） |
| `lastWrongAt` | ISO String | 每次答錯更新 |
| `nextReviewAt` | ISO String \| null | 呼叫端明確提供；**不得自動排程**，預設 null |
| `masteryLevel` | Enum | `new` / `learning` / `reviewing` / `mastered`（固定，不得新增，不得 AI 推論；儲存值小寫依 Ruling-4 慣例，New/Learning/Reviewing/Mastered 為顯示層標籤） |
| `status` | Enum | `active` / `archived`（固定） |
| `metadata` | Object | 保留 |
| `createdAt` / `updatedAt` | ISO String | 必填 |

## Validation（三層）

Interface（add/update 之解析與規則）→ Schema（validate()：必填、enum、答對拒收、Traceability）→ Runtime（Session.store 重跑同一 validate）。任一失敗**不得寫入 WrongBookSession**。Mock / Stub / Placeholder 無進入路徑：內容唯一來源為真實題目記錄之唯讀解析。
