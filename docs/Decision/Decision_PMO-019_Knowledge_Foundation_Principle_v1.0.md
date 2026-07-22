# Decision_PMO-019 · Knowledge Foundation Principle v1.0（LOCK）

- 建立：EO-S8.0-001 PMO Final Decision｜日期：2026-07-22｜狀態：**LOCK**
- 優先權：高於 EO 本文；衝突一律依本原則執行。

## 固定流程
```
Metadata → Analysis → Knowledge → Summary → Question
```

## 禁止
- **禁止 Metadata → Question**
- **禁止 Material → Question**
- 所有 AI 功能必須經由 Knowledge Graph（Single Source of Truth）

## 本 EO 之結構性落實（非慣例，為程式結構保證）
| 原則 | 落實 |
|---|---|
| Metadata → Question 禁止 | `KnowledgePipeline.js` 內**零產題程式**（測試以原始碼掃描驗證無 LearningQuestionGenerator／questionType／generate() 之呼叫），且 process() 無 difficulty 參數 |
| Material → Question 禁止 | AnalysisRuntime 不接受檔案輸入、無檔案存取能力；唯一資料來源為 Knowledge Graph 查詢 API |
| 必經 Knowledge Graph | Skeleton 節點全數強制 `sourceFileId`；未來 Summary 之每一項目須以 `knowledgeId` 解析回真實節點，否則 `AnalysisRuntime.store()` 拒絕寫入 |

## 分期界線
- **本 EO（Foundation）**：Metadata 階段 —— Classifier ＋ Knowledge Graph Skeleton ＋ 各 Runtime/Interface 骨架。
- **Analysis Pipeline EO（後續）**：內容節點（KnowledgePoint／Definition／Formula／Keyword／Concept／ExamPoint／Explanation）、Summary Generation、AI Question Generation、UI 接線。
