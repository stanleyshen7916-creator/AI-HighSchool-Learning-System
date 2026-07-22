# Question Generation Flow v1.0

- EO：EO-S6.9-002｜日期：2026-07-22
- 模組：`AHS.QuestionGenerationFlow`（`js/parser/QuestionGenerationFlow.js`）

## Pipeline

```
Summary Runtime ──▶ LearningQuestionGenerator（Interface 驗證）
                ──▶ Question Schema v1.0（Schema 驗證）
                ──▶ LearningQuestionSession（Runtime gate）
                ──▶ Practice（QuizCenter 唯讀合併顯示）
```

觸發點：Question Guide 之「開始練習」—— 學生**明確選擇難度**（易/中等/難，無預設、未選不得開始，Ruling 2B）後呼叫 `run(materialId, difficulty)`。

## Generation Rule（落實）

- 題目內容 **100% 只來自 Summary Runtime**：coreConcepts / definitions / pitfalls / memorize 為 Knowledge Points；reviewSuggestions 屬學習建議，不產題。
- 不讀 Material、不重新解析、不呼叫 Parser。唯一額外讀取為 KnowledgeRuntime（唯讀、僅取 traceability 之真實 knowledgeId，管線既有血緣 Material→Knowledge→Summary）；查無 Knowledge 記錄 → 候選誠實不入庫。
- 每一 Knowledge Point 至少一題；決定性建構（同輸入必同輸出），零虛構事實。

## Question Type 對應（snake_case LOCK）

| Knowledge Point 類別 | questionType | 建構方式（內容全取自 Summary 原文） |
|---|---|---|
| coreConcepts | `single_choice` | 分類辨識題：四個真實段落標籤為選項 |
| definitions（含「term：內容」） | `short_answer` | 依 term 回答定義內容，答案 = 原文內容段 |
| definitions（純敘述） | `true_false` | 敘述判斷，答案「正確」（敘述即出自總結） |
| pitfalls | `true_false` | 易錯重點確認題 |
| memorize | `fill_blank` | 原句最長片段挖空，答案 = 該片段；過短句 fallback `true_false` |

## 防重複與誠實保證

- Dedupe key：(materialId, knowledgePoint, questionType, difficulty)，重跑零重複。
- 三重 Gate：Interface（generate/normalize）→ Schema（validate）→ Runtime（Session.add）。任一失敗不入庫。
- Summary 五段全空（Parser 未完成）→ `status: no_content`、零題、Practice 顯示「AI 正在建立練習題……」。無任何 Mock / Stub / Placeholder 進入路徑（測試含反向案例）。
- 全程對 LearningQuestionRuntime **零寫入**（Practice 為唯讀合併顯示，Schema v1.0 之字串 explanation 於顯示層相容渲染）。
