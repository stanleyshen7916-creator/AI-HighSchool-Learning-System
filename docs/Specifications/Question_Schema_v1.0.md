# Question Schema v1.0

- EO：EO-S6.9-001｜日期：2026-07-22｜狀態：v1.0
- PMO Ruling 3A：本 Schema 為**超集** —— EO 之 13 個欄位 + EO-S6-004 LOCK 必要欄位，十項完整性原則不弱化。
- PMO Ruling 4：`questionType` 儲存值為 snake_case，與既有 repo 慣例一致。

## Schema（固定）

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `id` | String | ✅ | 題目唯一識別 |
| `materialId` | String | ✅ | 來源教材 |
| `subject` | String | ✅ | 九科 key |
| `grade` | String | 超集 | 年級 |
| `chapter` | String | — | 章 |
| `section` | String | 超集 | 節 |
| `knowledgePoint` | String | ✅ 不得為空 | 考點 |
| `difficulty` | Enum | ✅ | `easy` / `medium` / `hard`（Ruling 2B：由呼叫端明確傳入，不得推論、不得預設） |
| `questionType` | Enum | ✅ | `single_choice` / `multiple_choice` / `true_false` / `fill_blank` / `short_answer`（LOCK，不得新增） |
| `question` | String | ✅ 不得為空 | 題目本文 |
| `options` | Array | 選擇題必填（≥2） | 選項 |
| `answer` | Any | ✅ 不得為空 | 標準答案 |
| `explanation` | String | ✅ 不得為空 | 詳解 |
| `reference` | String | — | 出處說明 |
| `learningObjective` | String | 超集 | 學習目標 |
| `relatedConcepts` | Array | 超集 | 延伸概念 |
| `source` | Object | 超集 | 來源結構 |
| `traceability` | Object | ✅（超集） | `{materialId, knowledgeId, summaryId}` —— materialId + knowledgeId 必須可追溯 |
| `metadata` | Object | 超集 | 保留 |
| `createdAt` | String | ✅ | `YYYY/MM/DD` |

## Validation 規則（Schema Validation v1.0）

Required Field、questionType 值域、difficulty 值域、answer / explanation / knowledgePoint 不得為空、選擇題 options ≥ 2、traceability 可追溯。**Validation Failed 之記錄不得加入任何 Runtime**（由 `LearningQuestionSession.add()` 之 gate 強制）。禁止 Mock / Stub / Placeholder Question 進入（`generate()` 無題目本文即回傳 null，validate() 拒絕空內容欄位 —— 無任何造假路徑）。
