# REPORT.md — EO-AI-010｜AI Summary Equivalence Validation

Priority：P0 ｜ Baseline：EO-AI-001～EO-AI-009（LOCKED）｜ 完成後停止。

## Objective

建立 Legacy `KnowledgeSummaryRuntime` vs 新 `SummaryPipeline` 的功能等價性（Functional Equivalence）驗證能力。僅建立驗證能力，不修改 UI、不修改 Runtime、不進行 Migration。

## Changed Files

**新增（1 檔案，`ai-engine/src/validator/`——全新資料夾）**
```
SummaryComparator.js  — compare()/coverageReport()/missingItems()/checkCompatibility()
```

**新增（1 檔案，驗證報告）**
```
docs/migration/EO_AI_010_VALIDATION.md  — 真實比對數據、Coverage Summary、Missing Analysis、
                                            Difference Analysis、Migration Readiness
```

**修改（1 檔案）**
```
ai-engine/README.md  — 補上本次新增模組的文件
```

**零修改（逐一以 `git diff --stat` 比對確認）**
```
js/ui/MaterialPreview.js               — 確認未變
js/ui/MaterialSummaryCard.js           — 確認未變
js/runtime/AITutorService.js           — 確認未變
js/runtime/KnowledgeSummaryRuntime.js  — 確認未變
ai-engine/src/runtime/SummaryRuntime.js — 確認未變
ai-engine/src/core/AIEngine.js          — 確認未變
```

## SummaryComparator 設計

- `compare(legacySummary, newSummary)` — 逐項（coreConcepts/keywords/definitions/formulas/importantPoints）比對 exists／count／completeness／emptyRatio。**全程無任何 `.text` 字串相等判斷**（已用原始碼掃描確認），符合「不得比較字串完全一致，採功能等價驗證」。
- `coverageReport(legacySummary, newSummary)` — 每項輸出 legacyCount／newCount／coveragePercent／missing。
- `missingItems(legacySummary, newSummary)` — 回傳 Legacy 有內容但 New 沒有的分類名稱陣列。
- `checkCompatibility(summary)` — **直接呼叫真實、未修改的 `AHS.MaterialSummaryCard.hasSummaryContent()`**，不是重新實作一份邏輯。

## 真實驗證結果（用真實 jsdom 載入 `materials.html` 完整既有管線，2 個測試情境）

詳細數據見 `docs/migration/EO_AI_010_VALIDATION.md`。摘要：

| 情境 | Compatibility（Legacy／New） | 發現的落差 |
|---|---|---|
| rich（含公式、定義、關鍵字、句子） | PASS／PASS | `coreConcepts`：Legacy 1、New 0（規則分類粒度差異，非遺失——內容仍在 New 的 keywords 分類中） |
| sparse（單行極簡內容） | PASS／PASS | 無（雙方誠實回報空值） |

**Migration Readiness 結論（誠實回報，非美化）**：Keywords／Definitions／Formulas 三項在測試情境下 Coverage 100%；MaterialSummaryCard 相容性兩情境皆 PASS；但 `coreConcepts` 分類存在一個真實的已知邊界案例（`SummaryContentExtractor` 用「行長度 ≤ 6 字」判斷 keyword，導致短詞主題概念被歸類為 keyword 而非 coreConcept），建議在正式 Migration EO 之前先修正這個分類規則，或在 Migration EO 中明確評估此差異是否可接受。

## Root Cause

無（Feature EO，非 Bug Fix）——上面是驗證過程中誠實發現的既有落差，寫進 Validation Report 供後續 EO 參考，本 EO 範圍不含修正。

## Impact Analysis

新增內容為全新檔案（`ai-engine/src/validator/`），未修改 `SummaryPipeline`／`SummaryEngine`／`SummaryRuntime`／任何既有 UI 或 Legacy Runtime。`SummaryComparator` 純讀取兩個已存在的 Summary 物件做比對計算，不寫入、不修改任何 Runtime 狀態。

## Unit Test（真實 jsdom + 完整既有管線，15 條全數 PASS）

涵蓋：2 個情境下 `coverageReport` 五個分類齊全、`checkCompatibility` 正確呼叫真實 `MaterialSummaryCard.hasSummaryContent()` 並回傳布林值（兩情境 Legacy／New 皆 PASS）、原始碼掃描確認無字串相等比較、無 LLM/網路呼叫、Console Error = 0、6 個禁止修改檔案逐一 `git diff --stat` 確認零 differ。

```
PASS: 15   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS（無 fetch/XHR/localStorage） |
| jsdom BehaviorSuite | 162 / 162 PASS |
| Regression Suite（19 檔） | 739 / 739 PASS |
| html5validator（vnu，10 頁） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

9 個既有產品頁 Console Error = 0。無 UI／Runtime 變化。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Unit Test 15/15、Regression 739/739、jsdom 162/162、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0。無 LLM、無外部套件、無 fetch/XHR/localStorage、無字串相等比較（功能等價驗證）。6 個禁止修改檔案全數確認零 differ。MaterialSummaryCard Compatibility：兩測試情境 Legacy／New 皆 PASS。

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-011**。Migration 需獨立於 EO-AI-011 執行，本 EO 不進行 Legacy Migration。
