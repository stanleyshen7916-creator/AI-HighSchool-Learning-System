# REPORT.md — Sprint AI-014｜Legacy Removal Checklist（Phase 1）

Priority：P0 ｜ Type：Pre-Cleanup Audit ｜ Baseline：EO-AI-001～EO-AI-010B, EO-AI-012～EO-AI-012E, Sprint AI-013（LOCKED）｜ 完成後停止，等待 PMO 核准 Phase 2。

## Objective

建立 Legacy Cleanup 唯一依據——全面盤點 Repository，本階段不刪除任何程式碼。

## Development

### Part A — Legacy Runtime 盤點

依 Repository 真實內容（非依 EO 假設的名稱清單）逐一 grep 確認，找到真正的 AI Summary Legacy 元件集合：`js/runtime/KnowledgeSummaryRuntime.js`、`js/runtime/AITutorRuntime.js`，以及 `js/runtime/AITutorService.js` 內部的 `generateLegacySummary()` 私有函式（Legacy Service）。同時發現「內容分析鏈」8 個元件（`MaterialTextPipeline`／`KnowledgePipeline`／`AnalysisRuntime`／`KnowledgeExtractionRuntime`／`KnowledgeGraphRuntime`／`DocumentClassifierRuntime`／`MaterialTextProvider`／`ParserAdapterRegistry`）**並非 AI Summary 專屬**，而是 Question Generation／Review／Exam Bank／Material Center 等現行功能的共用基礎設施。

### Part B — Dependency Matrix

見 `docs/QA/LegacyDependencyMatrix.md`：每一列皆附真實 grep 引用清單（檔名 + 次數），註解已先行剝除以避免誤把文件註解當成真實引用（例如 `SummaryContentExtractor.js`／`ReviewGeneratorRuntime.js`／`MaterialSummaryCard.js` 內文字提及 `KnowledgeSummaryRuntime` 但並非真實呼叫，已排除）。

### Part C — Category 分類

見 `docs/QA/LegacyRemovalChecklist.md`：全部元件分類為 Category A（仍被 Default 引用）或「Compare + Rollback」（`KnowledgeSummaryRuntime.js` 與 `generateLegacySummary()`）。**Category D（完全無引用）真實結果為 0 筆**——這是 Repository 真實依賴結構的誠實結果，不是盤點疏漏。

### Part D — Legacy Removal Checklist

見 `docs/QA/LegacyRemovalChecklist.md`：11 個元件逐一列出 Default／Compare／Rollback／引用數／建議，全部建議為 **KEEP**，0 個 CANDIDATE，0 個 REMOVE。

### Part E — Repository Validation

Checklist 100% 來自真實 grep 結果，未使用任何人工推測的引用清單。方法論：先以 Node 腳本剝除每個檔案的 `/* */` 與 `//` 註解，再對剝除後的內容比對 `\bComponent\b`，確保註解中的文字提及不會被誤算為真實程式碼引用；另外對每個 `.html` 頁面檢查對應 `<script>` 標籤。

## 誠實揭露（相關但非本次範圍的發現）

- `js/runtime/SummaryRuntime.js`（頂層，Sprint-5「重點整理」）與本次 AI Summary Migration 完全無關，不列入 Legacy Cleanup 範圍。
- `js/ai/SummaryAdapter.js` 全 Repository 零真實呼叫端，但這是 New（ai-engine）側未接線的 scaffolding，非 Legacy，僅誠實記錄供 PMO 參考，不出現在 Removal Checklist。

## Changed Files

**新增（2 檔案，Deliverables）**
```
docs/QA/LegacyDependencyMatrix.md
docs/QA/LegacyRemovalChecklist.md
```

**新增（1 檔案，本 REPORT）**
```
docs/migration/Sprint_AI_014_Phase1_REPORT.md
```

**零修改（本階段禁止任何程式碼／Runtime／README／BehaviorSuite／Pipeline 變更，已逐一確認）**
```
（無任何 .js／.html／既有 .md 檔案被修改——git status 確認僅新增上述 3 個檔案）
```

## QA

- ☑ 全 Repository 掃描（ai-engine／runtime／service／adapter／parser／summary／compare／rollback 全數涵蓋）
- ☑ Dependency Matrix 完成（每列皆有 grep 證據）
- ☑ Legacy Checklist 完成（11 個元件，KEEP/CANDIDATE/REMOVE 建議齊全）
- ☑ Candidate List 完成（真實結果為空清單，已誠實記錄原因）

## Root Cause

無（Audit EO，非 Bug Fix）。

## Impact Analysis

本階段僅新增 3 個 Markdown 文件，未修改任何 `.js`／`.html` 檔案，未修改 README、BehaviorSuite、Pipeline、SummaryProvider、AITutorService，未刪除任何程式碼，未 Commit Cleanup。

## Regression

不適用——本階段未修改任何可執行程式碼，無需重跑 BehaviorSuite/Regression/Pipeline Regression。

## QA Summary

Legacy Dependency Matrix 與 Removal Checklist 皆已完成，100% 基於真實 grep 引用資料（非人工推測），誠實揭露「內容分析鏈並非 AI Summary 專屬」與「Category D 候選為零」兩項關鍵發現。未觸碰任何程式碼。

## 完成後

依 Sprint 指示，**完成 Checklist 後停止，不得開始刪除**。等待 PMO 核准後，才建立 Sprint AI-014 Phase 2（Actual Cleanup）——鑑於 Phase 1 的真實結果顯示目前沒有任何元件符合刪除條件，PMO 可能需要重新評估 Phase 2 的必要性與範圍。
