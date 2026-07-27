# REPORT.md — EO-AI-010B｜Summary Extraction Rule Expansion

Priority：P0 ｜ Type：AI Rule Tuning ｜ Baseline：EO-AI-001～EO-AI-012E（LOCKED）｜ 完成後恢復 Sprint AI-013 Part B。

## Objective

擴充 `SummaryContentExtractor` 的 Concept Pattern，提升 Repository 真實教材辨識率；不修改 Pipeline、Summary Flow、Summary Builder。

## Background

Sprint AI-013 Part B（Equivalence Validation）用真實 Compare Mode 對 `js/data/MockData.js` 全部 8 筆真實教材驗證時發現：6/8（75%）的 Core Concept 遺失，誤分類為 Important Point。逐一檢視發現全部 8 筆真實內容皆以「本教材介紹/整理/彙整/說明…」開頭——EO-AI-010A 的 `CONCEPT_SENTENCE_PATTERN` 只涵蓋「本節/本章/本單元/本課」+「說明/介紹」，沒有涵蓋「本教材」這個主詞，也沒有涵蓋「整理/彙整」這兩個動詞。已回報 PMO，本 EO 為正式修正指示。

## Development

### Part A — Pattern Expansion

`ai-engine/src/parser/SummaryContentExtractor.js` 的 `CONCEPT_SENTENCE_PATTERN`：

```
Before: /^(本節|本章|本單元|本課)(說明|介紹)|的(定義|概念)|主要探討|可分為|包含/
After:  /^(本節|本章|本單元|本課|本教材)(說明|介紹|整理|彙整)|的(定義|概念)|主要探討|可分為|包含/
```

主詞新增「本教材」、動詞新增「整理」「彙整」——皆為真實 Repository MockData 的實際措辭。既有選項（本節/本章/本單元/本課、說明/介紹、的定義/的概念/主要探討/可分為/包含）逐字未動，僅新增，符合「不得刪除既有 Pattern，僅 Expansion」的要求。

### Part B — Backward Compatible

EO-AI-010A 原始測試案例「本節說明三角函數的定義與應用。」修正後仍正確分類為 coreConcepts；Keyword 長度規則（`KEYWORD_MAX_LENGTH=6`）與短詞分類（三角函數／斜邊）完全未受影響。

### Part C — Repository Validation

用真實 jsdom 對全部 8 筆 Repository MockData 教材（`js/data/MockData.js`）跑 Compare Mode，逐一確認 Core Concept 分類正確——詳見 `docs/migration/EO_AI_010_VALIDATION.md`「Pattern Expansion（EO-AI-010B）」章節的完整 Before/After 表格。

### Part D — Regression

重新跑 BehaviorSuite（174/174）、Regression Suite（739/739，20 檔）、Pipeline Regression（6/6），確認零 Regression。

## Changed Files

**修改（1 檔案，僅 Pattern Expansion）**
```
ai-engine/src/parser/SummaryContentExtractor.js
  — CONCEPT_SENTENCE_PATTERN 新增「本教材」主詞、「整理／彙整」動詞，
    既有選項逐字未動。
```

**修改（2 檔案，文件）**
```
docs/migration/EO_AI_010_VALIDATION.md — 新增「Pattern Expansion（EO-AI-010B）」章節
ai-engine/README.md                     — 補上 EO-AI-010B 說明
```

**零修改（依 Forbidden 清單逐一以 `git diff --stat` 確認）**
```
ai-engine/src/services/summary/SummaryBuilder.js  — 未變
ai-engine/src/service/SummaryProvider.js          — 未變
ai-engine/src/runtime/SummaryRuntime.js           — 未變
ai-engine/src/runtime/SummaryPipeline.js          — 未變
ai-engine/src/knowledge/Metadata.js               — 未變
```

## 真實驗證結果（jsdom，全部 8 筆真實 Repository MockData）

| 學科 | Legacy Count | New Count | Coverage % |
|---|---|---|---|
| math | 1 | 1 | 100% |
| english | 1 | 1 | 100% |
| physics | 1 | 1 | 100% |
| chemistry | 1 | 1 | 100% |
| biology | 1 | 1 | 100% |
| history | 1 | 1 | 100% |
| geography | 1 | 1 | 100% |
| civics | 1 | 1 | 100% |

| 驗證項目 | 結果 |
|---|---|
| EO-AI-010A 原始測試句仍正確分類為 coreConcepts（向下相容） | PASS |
| EO-AI-010A 原始測試句不再誤入 importantPoints | PASS |
| Keyword 分類（三角函數／斜邊）完全不受影響 | PASS |
| Repository MockData 8 筆皆有內容 | PASS |
| 8 筆真實教材 Core Concepts Coverage 全數 100% | PASS |
| Console errors = 0 | PASS |

```
PASS: 14   FAIL: 0
```

## Root Cause

已於 Background 段落完整說明：真實 Repository 教材的措辭風格（本教材 + 整理/彙整）超出 EO-AI-010A 當初驗證所用的單一手寫測試句涵蓋範圍。

## Impact Analysis

唯一程式碼修改是在既有 regex 的兩個選項群組中新增選項（不影響其他任何選項），未改動 Formula／Definition／Important Point／Keyword 判斷邏輯與門檻值，未改動函式簽名、未改動 `SummaryBuilder`／`SummaryProvider`／`SummaryPipeline`／`SummaryRuntime`／`Metadata` 任何一個檔案。

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite | 174 / 174 PASS |
| PipelineRegression | 6 / 6 PASS |
| Regression Suite（20 檔） | 739 / 739 PASS |
| html5validator（vnu，全部根頁面） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

既有產品頁 Console Error = 0。無 UI 變化——本次修正僅影響 New Pipeline 內部分類結果，不涉及任何 UI 檔案。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Concept Pattern 擴充完成、全部 8 筆真實 Repository MockData 教材 Core Concepts Coverage 達 100%（0% → 100% 的有 6 筆）、EO-AI-010A 既有案例與 Keyword 分類完全向下相容、Regression 739/739 + jsdom 174/174 + PipelineRegression 6/6 全綠、5 個 Forbidden 檔案零 differ。無 LLM、無外部套件、無 Pipeline／Summary Flow／Summary Builder 變更。

## 完成後

依 EO 指示，**恢復 Sprint AI-013 Part B**（Equivalence Validation 現在應對真實 Repository MockData 顯示零退化，可重新驗證並視結果決定是否重新嘗試 Part A）。
