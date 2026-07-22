# EO-S8.0-003_Report — Folder Scope Runtime（Study Scope Baseline）

## Status
COMPLETE — `AHS.FolderRuntime` 建立完成，Foundation QA 39/39、全鏈迴歸 297/297 零回歸、既有 js/css/html **全數 byte-identical**。未 Git Push、未 GitHub QA。

## New Files（4）
- js/runtime/FolderRuntime.js（七個公開 API；Study Scope 資料模型；預留關聯全 null）
- tests/regression/FolderRuntimeV1.js（39 項）
- docs/Specifications/Specifications_FolderRuntime_v1.0.md
- docs/QA/QA_EO-S8.0-003_Foundation.md

## Modified Files
**無** —— 未修改 Material Center UI、Dashboard、Quiz Center、WrongBook、AI Tutor，亦未修改 DocumentClassifier／KnowledgeGraph／KnowledgeExtraction／Analysis／Summary 等 LOCK Runtime（逐位一致）。

## ID 空間決策（需 PMO 確認）
MaterialRuntime（LOCK）已擁有 folder 容器與 material 之單一 `folderId`，且**無重新指派 API**。故 `createFolder()` 包裝其公開 `addFolder()` 共用同一 canonical id，Study Scope metadata 另存於 `folderRuntime` key。此舉使 Material Binding 真實可用（避免平行 id 空間產生孤兒關聯），且未修改 MaterialRuntime 一個位元組。若 PMO 傾向完全獨立 id 空間，需另開 EO 為 MaterialRuntime 增設 assign API（本 EO 禁止修改）。

## Study Scope Baseline v1.0 落實
Folder → Files 關聯已實作（唯讀解析、單一歸屬結構保證）；Knowledge Graph／Summary／Question Bank／Wrong Book／Review 之關聯**僅預留欄位、值恆 null**，本 EO 未建立任何內容、未執行任何 AI 分析。

## Acceptance
✅ Console Error = 0 ✅ Runtime Regression PASS ✅ LOCK Runtime byte-identical ✅ Existing Runtime Zero Regression ✅ No UI Change ✅ No Git Push ✅ No GitHub QA
