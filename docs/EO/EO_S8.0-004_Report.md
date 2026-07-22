# EO-S8.0-004_Report — Analysis Pipeline Integration

## Status
COMPLETE — Analysis Pipeline 正式啟用（Folder → Material → Document → Classifier → Analysis → Extraction → Knowledge Graph），整合 QA 57/57、全鏈迴歸 397/397 零回歸、LOCK Runtime byte-identical、UI 零變更。未 Git Push、未 GitHub QA。

## Modified Files（4，皆為本 EO 明文授權解除之對象）
- js/runtime/KnowledgeGraphRuntime.js：白名單解除五型內容節點；下游產物型別永久禁止；內容節點強制 folderId + documentType；新增 `queryByFolder()`；內容節點 natural key 去重（冪等重跑）
- js/parser/AnalysisRuntime.js：解除 `pending_analysis_pipeline`，回傳真實 analysisResult
- js/runtime/KnowledgeExtractionRuntime.js：ready 閘門、Folder Scope 強制、folderId 納入追溯
- js/parser/KnowledgePipeline.js：五道驗證閘門之完整串接 + `processFolder()`

## New Files
tests/regression/AnalysisPipelineIntegration.js（57 項）｜docs/Specifications/Specifications_AnalysisPipeline_v1.0.md｜docs/QA/QA_EO-S8.0-004_Integration.md

## 誠實邊界（請 PMO 知悉）
無文件解析器、AI Provider 未綁定，故 AnalysisRuntime 真實可讀來源僅教材記錄之 `content` 欄位：有文字即真實切段（逐字保留、真實段落序號、sourcePage 誠實 null）；無文字即 `insufficient_source` 零節點，**絕不由檔名或二進位臆測**。上傳流程目前不收集文字（UI 不得改），故實務上多數教材回 insufficient_source；文字來源就緒後本管線零改動即產出真實節點（已以真實文字前驗全鏈）。

## 本次發現並修正之真實缺陷
重跑 Analysis Pipeline 會重複建立內容節點 → 已為內容節點加入 natural key（type + 原文 + 來源檔 + 段落序號），重跑冪等（測試驗證）。

## Flags
1. EO 引用之「Decision 021」白名單，於 EO-S8.0-001 PMO Final Decision 中編號為 Decision 2 —— 同一規則，已依 EO 意圖解除，建議 PMO 統一編號。
2. 交互作用記錄：若 MaterialRuntime 單獨 reset 而 FolderRuntime 仍持有舊 folderId，FolderRuntime 之唯一性守衛會正確擋下 id 碰撞（createFolder 回 null）。實務上 sessionStorage 同時清除，不受影響。
3. 先前 EO 測試中記錄「白名單封鎖／pending」之斷言，已依本 EO 授權更新為解除後之正確行為（見 Integration QA Report）。

## Acceptance
✅ Console Error = 0 ✅ Runtime Regression PASS ✅ LOCK Runtime byte-identical ✅ Existing Runtime Zero Regression ✅ Integration PASS ✅ No UI Change ✅ No Git Push ✅ No GitHub QA
