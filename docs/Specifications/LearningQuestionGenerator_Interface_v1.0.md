# LearningQuestionGenerator Interface v1.0

- EO：EO-S6.9-001｜日期：2026-07-22
- 模組：`AHS.LearningQuestionGenerator`（`js/parser/LearningQuestionGenerator.js`，新建）
- 既有 `AHS.QuestionGenerator`（EO-S6-004，LOCK）零變更。**不實作 AI Model**。

## Interface（固定三方法，所有 Question 必經）

### `generate(input) -> record | null`
將呼叫端提供之**真實**題目內容封裝為 Schema v1.0。無題目本文（`input.question` 空）→ 回傳 `null` —— 永不產生 Stub / Mock / Placeholder。`difficulty` 為呼叫端必填參數（Ruling 2B：不推論、不預設、不讀 Summary Runtime —— 其 LOCK Schema 無 difficulty 欄位）。`traceability` 由呼叫端真實參照組成，不得虛構。

### `validate(record) -> { valid, errors }`
Schema Validation v1.0（見 Question_Schema_v1.0.md §Validation）。決定性、非 AI、never throws。`LearningQuestionSession.add()` 呼叫同一函式作為入庫 gate。

### `normalize(draft) -> record`
全欄位型別衛生（enum 一律小寫化、Array/Object/String 保型）。純函式：不變異輸入、不發明內容、不為內容欄位填「安全」假值（拒絕是 validate 的職責）。

## 公開常數

`QUESTION_TYPES`：`single_choice` / `multiple_choice` / `true_false` / `fill_blank` / `short_answer`（LOCK）
`DIFFICULTIES`：`easy` / `medium` / `hard`（LOCK）

## Pipeline 位置（未變更）

Material → Parser → Knowledge Builder → Summary → **Question Generator** → Practice → Wrong Book → Review。本 EO 為 Foundation：兩個新模組**未接線至任何頁面**（與 EO-S6-001～004 Foundation 前例一致），既有流程零變更；接線屬未來 EO。
