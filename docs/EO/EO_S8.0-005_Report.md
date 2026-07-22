# EO-S8.0-005_Report — Material Text Provider Integration

## Status
COMPLETE — Single Text Entry Point 建立完成，AnalysisRuntime 已零直讀 Material.content。Provider QA 37/37、全鏈迴歸 442/442 零回歸、LOCK Runtime byte-identical、UI 零變更。未 Git Push、未 GitHub QA。

## EO 版本說明
本次收到兩份同編號 EO-S8.0-005（前者為 Document Parser Runtime，後者為 Material Text Provider Integration）。依後送之修訂版執行：**不新增 Foundation Runtime、優先 Reuse、建立唯一文字入口**。

## New Files（3）
- js/parser/MaterialTextProvider.js（Adapter／Helper 層；非 Runtime、不持久化、不建立第二套 Content Store）
- tests/regression/MaterialTextProviderV1.js（37 項）
- docs/Specifications/Specifications_MaterialTextProvider_v1.0.md、docs/QA/QA_EO-S8.0-005_Foundation.md

## Modified Files（1，本 EO 明文授權）
- js/parser/AnalysisRuntime.js：Development Scope 允許「AnalysisRuntime 新增 Text Provider Adapter」。僅改文字來源一處（直讀 Material.content → `MaterialTextProvider.getText()`），並於分析結果新增 `textSource` / `providerStatus` 兩個唯讀欄位。**Schema v2 七段、驗證邏輯、儲存行為全數未變**，既有測試零回歸。

## 核心成果
1. **唯一文字入口**：AnalysisRuntime 原始碼零出現 material.content／getById／MaterialRuntime（掃描驗證）。
2. **未來 Parser 零改動接入**：adapter 合約 `{id, supports, extract}`，註冊後優先於 content 被諮詢 —— PDF／DOCX／OCR EO 只需註冊 adapter，AnalysisRuntime 永不依賴 Parser（已前驗）。
3. **誠實邊界維持**：content 空即 insufficient_source，零 Mock／推測／OCR／PDF Binary。

## Flags
1. 三套既有測試（AnalysisPipelineIntegration／KnowledgeExtractionV1／KnowledgeFoundationV1）已補上 MaterialTextProvider.js 相依並校正一句 reason 文案斷言 —— 因 Provider 現為 AnalysisRuntime 之必要相依，非規避測試。
2. 實務瓶頸未解除：上傳流程仍不收集文字（UI 不得改），多數教材仍回 insufficient_source。建議下個 EO 處理**文字輸入途徑**（教材文字欄位或 .txt 讀取），即可讓全鏈產出真實知識節點。

## Acceptance
✅ Console Error = 0 ✅ Runtime Regression PASS ✅ Existing Runtime Zero Regression ✅ LOCK Runtime byte-identical ✅ No UI Change ✅ No Git Push ✅ No GitHub QA
