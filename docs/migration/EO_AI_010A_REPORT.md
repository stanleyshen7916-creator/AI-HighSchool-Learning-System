# REPORT.md — EO-AI-010A｜Summary Classification HOTFIX

Priority：P0 ｜ Type：HOTFIX ｜ Baseline：EO-AI-001～EO-AI-010（LOCKED）｜ 完成後停止。

## Objective

修正 EO-AI-010 驗證發現之 `SummaryContentExtractor` Core Concepts 分類落差，使新 Pipeline 與 Legacy 在該分類上達成功能等價，且不得降低其他分類 Coverage。

## 過程記錄：第一版假設不成立，暫停後依 PMO 修正方向重做

原始 EO-AI-010A（第一版）Background 假設「三角函數／一次函數／氧化還原／細胞分裂這類短詞應被歸類為 Core Concept」。**動手修正前先用真實 Legacy 資料驗證，發現這個假設是錯的**：直接印出 Legacy 對測試教材的真實輸出，`keywords: ["三角函數", "斜邊"]`——短詞本來就被 Legacy 分類為 Keywords，跟 New 原本行為一致；Legacy 的 1 筆 Core Concept 其實是一句完整說明句 `"本節說明三角函數的定義與應用。"`。

依第一版假設實作的修正（短詞優先判定為 Core Concept）雖然讓 Core Concepts Coverage 從 0% 變 100%，但代價是 Keywords Coverage 從 100% 降到 50%（因為把「三角函數」從 keywords 搬走了）——**直接違反本 EO 自己的「不得降低 Keywords Coverage」要求**。發現後立即暫停、回報真實資料，未 commit 該版本。PMO 確認後發出 Revision-1：正確方向是「具概念說明性的完整句 → Core Concept」，而非「短詞 → Core Concept」，短詞 Keyword 分類維持不變。

本 REPORT 記錄的是依 Revision-1 修正後、驗證通過的最終版本。

## Changed Files

**修改（1 檔案，僅新增一條規則，其餘規則完全不變）**
```
ai-engine/src/parser/SummaryContentExtractor.js
  — 新增 CONCEPT_SENTENCE_PATTERN，判斷句子是否具「本節說明／本章介紹／…的定義／…的概念／
    主要探討／可分為／包含」等概念說明樣式，若符合則優先歸類為 coreConcepts（檢查順序插在
    Definition 之後、原本的 Important Point 判斷之前）。KEYWORD_MAX_LENGTH（=6）與短詞判斷
    邏輯完全未變。
```

**修改（2 檔案，驗證報告）**
```
docs/migration/EO_AI_010_VALIDATION.md  — 新增 HOTFIX Comparison 章節（Before/After/Remaining Gap）
ai-engine/README.md                      — 補上本次 HOTFIX 說明
```

**零修改（依 Forbidden 清單逐一確認）**
```
ai-engine/src/runtime/SummaryPipeline.js — 未變（本次修正不需要調整呼叫方式）
js/ui/MaterialSummaryCard.js             — 未變
js/ui/MaterialPreview.js                 — 未變
js/runtime/KnowledgeSummaryRuntime.js    — 未變
ai-engine/src/core/AIEngine.js           — 未變
```

## Rule Priority（依規格要求的順序）

```
Formula → Definition → Core Concept（新增：說明句樣式） → Keyword（不變：長度規則） → Important Point（殘留：其餘符合句末標點+長度的句子）
```

## 真實驗證結果（Before → After，用真實 jsdom 載入 `materials.html` 完整既有管線）

| 分類 | Before Coverage | After Coverage |
|---|---|---|
| Core Concepts | 0% | **100%** |
| Keywords | 100% | 100%（未降低） |
| Definitions | 100% | 100%（未變） |
| Formulas | 100% | 100%（未變） |
| Important Points | 100%（但內容其實是誤放的說明句） | 0%（雙方一致，正確歸位） |

sparse 情境（單行「細胞」）修正前後數字完全相同，未受影響。詳細數據與 rule 說明見 `docs/migration/EO_AI_010_VALIDATION.md` 的 HOTFIX Comparison 章節。

## Root Cause

上方「過程記錄」段落已完整說明：真正差異是「說明句 vs 短詞」，不是「短詞該歸類成 Concept」。

## Impact Analysis

唯一程式碼修改是在既有分類邏輯中插入一條新規則（檢查一個新 pattern），未改動 Formula／Definition／Keyword 判斷邏輯與門檻值，未改動函式簽名、未改動 `SummaryPipeline.js` 呼叫方式。回歸測試證明 Keywords／Definitions／Formulas 三項 Coverage 完全未受影響。

## Unit / Integration Test（15 條全數 PASS，真實 jsdom + 完整既有管線）

涵蓋：目標句型正確歸類為 coreConcepts、既有短詞（三角函數／斜邊）維持 keywords 不變、兩個情境的 `SummaryComparator.coverageReport` 五個分類齊全、`checkCompatibility()`（真實 `MaterialSummaryCard.hasSummaryContent()`）兩情境 Legacy／New 皆 PASS、原始碼掃描零字串相等比較／零 LLM／零網路呼叫、5 個禁止修改檔案逐一 `git diff --stat` 確認零 differ。

```
PASS: 15   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
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

Core Concepts Coverage 明顯改善（0%→100%）、MaterialSummaryCard Compatibility 兩情境皆 PASS、Rich／Sparse Material Regression PASS、Full Regression PASS（739/739 + 162/162）、GitHub Push 完成、REPORT 完成。Keywords／Definitions／Formulas Coverage 全數未降低。無 AI／LLM、無外部套件、無 fetch/XHR/localStorage。5 個禁止修改檔案全數確認零 differ。

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-011**。Migration 將於 EO-AI-011 獨立執行，本 EO 不進行 Legacy Migration。
