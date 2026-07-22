# EO-S8.0-001_Report — AI Knowledge Pipeline Foundation（PMO Final Decision 版）

## Status
COMPLETE — 依 **PMO Final Decision（LOCK，優先權高於 EO 本文）** 修正交付。Foundation QA 38/38、全鏈迴歸 213/213 零回歸、LOCK Runtime byte-identical。未 Git Push、未 GitHub QA。

## 依 Final Decision 之範圍回收（相對前一版交付）
| Decision | 修正內容 |
|---|---|
| **2** | Knowledge Graph 限縮為 **Skeleton**：白名單六型節點；knowledge_point／definition／formula／keyword／concept／exam_point／explanation 等十型**一律拒收**（等待 Analysis Pipeline）。前版允許經 API 注入內容節點之路徑已移除。新增 `document_type` 節點（Decision 2 明列允許）。 |
| **3** | `AnalysisRuntime` 保留 Runtime＋Schema v2＋validate／store 介面；**analyze() 不再產生 Summary**，改回報 `pending_analysis_pipeline` 且零儲存。SummaryRuntime 維持 LOCK。 |
| **4** | ExamBank Schema 明確預留 `sourceFileId`（與 knowledgeId／sourcePage／sourceParagraph 同為可 null）；原題無任何修改路徑；零預設題庫。 |
| **5 + 019** | `KnowledgePipeline` **移除全部產題程式**（前版 Mode B 生成邏輯刪除），收束於 `awaiting_analysis_pipeline`／`exam_bank`；process() 移除 difficulty 參數。Decision 019 兩項禁令以原始碼掃描測試結構性驗證。 |

## New Files（7 模組 + 測試 + 文件）
js/runtime/DocumentClassifierRuntime.js｜js/runtime/KnowledgeGraphRuntime.js｜js/parser/AnalysisRuntime.js｜js/runtime/ExamBankRuntime.js｜js/runtime/AnswerBuilderRuntime.js｜js/parser/AIProviderInterface.js｜js/parser/KnowledgePipeline.js｜tests/regression/KnowledgeFoundationV1.js｜docs/Decision/Decision_PMO-019_Knowledge_Foundation_Principle_v1.0.md｜docs/Specifications/Specifications_KnowledgeGraph_Runtime_v1.0.md｜docs/QA/QA_EO-S8.0-001_Foundation.md

## Modified Files
無 —— 既有 js/css/html **零變更**（Foundation 未接線，byte-identical 驗證）。

## Acceptance（PMO Final Decision 版）
✅ Console Error = 0 ✅ Regression PASS ✅ LOCK Runtime byte-identical ✅ Foundation PASS（38/38，Decisions 1–5 與 Decision 019 逐項驗證）

## Flags
1. 內容節點供給、Summary Generation、AI Question Generation、UI 接線 —— 全數留待 **Analysis Pipeline EO**（Decision 5 明定）。
2. Mode A 原題於 Parser 完成前僅能經驗證 ingestion API 進入；repo 零預設題出貨。
3. 未來 Provider 綁定需網路呼叫，與原型 no-fetch 硬規範衝突，屆時需 PMO 明確裁示（現階段全庫零 fetch/XHR，測試驗證）。
