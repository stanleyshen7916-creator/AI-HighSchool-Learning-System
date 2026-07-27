# REPORT.md — EO-AI-012E｜Summary Metadata Migration

Priority：P0 ｜ Type：Migration ｜ Baseline：EO-AI-001～EO-AI-012D（LOCKED）｜ 完成後恢復 Sprint AI-013。

## Objective

補齊 New Summary Pipeline 所需 Metadata，僅修正 Summary Title——不修改 Summary 演算法、Summary Flow、AI Pipeline。

## Background

Sprint AI-013 Part A（Default Mode Migration）執行前的探測發現：New Pipeline 的 `Summary.title` 恆為 `null`（EO-AI-005 的 honest stub），造成切換預設模式為 `new` 後，`MaterialSummaryCard` 顯示通用的「AI 重點整理」而非教材真實名稱——已回報 PMO 為 Metadata 缺失（非 AI Summary 品質問題）。本 EO 為 PMO 發出的正式修正指示。

## Development

### Part A — 擴充 Metadata Schema

`ai-engine/src/knowledge/Metadata.js`：`FIELDS` 新增 `"title"`，共 17 個欄位。完全 Backward Compatible——16 個既有欄位（含 `studyScope`）逐字未動，新欄位遵循與其餘欄位相同的「不存在則為 `null`」規則。`ai-engine/src/knowledge/MetadataValidator.js`：`STRING_FIELDS` 新增 `"title"`（存在時必須為字串，與其他結構欄位一致），`REQUIRED_FIELDS` 不變（title 維持選填）。

### Part B — MetadataBuilder

`ai-engine/src/knowledge/MetadataBuilder.js`：`fromMaterial()` 新增 `this.set("title", material.title || null)`，與既有 `subject`/`grade`/`chapter` 的映射方式完全一致——純結構性 pass-through，非 AI 產生。

### Part C — SummaryBuilder

`ai-engine/src/services/summary/SummaryBuilder.js`：`build()` 的 `title` 欄位從硬編碼 `null` 改為 `(metadata && metadata.title) || null`，與 `subject`/`grade`/`difficulty` 的既有寫法完全一致。教材無標題時仍誠實回傳 `null`，未自行產生標題。

### Part D — Regression

Legacy 完全不受影響（`KnowledgeSummaryRuntime`／`AITutorRuntime`／`AITutorService` 皆未觸碰）。New：`MaterialSummaryCard` 在 `SummaryProvider` mode=`new` 下，重新產生後真實顯示教材名稱（如「三角函數講義」），不再是「AI 重點整理」預設字樣。

### Part E — BehaviorSuite

`tests/jsdom/BehaviorSuite.js` 既有測試 [21]（含「Summary 已由 KnowledgeSummaryRuntime 產生」斷言）**逐字保留、未刪除、未修改**。新增測試 [23]「EO-AI-012E — AI 重點整理 UI 串接（New Runtime，SummaryProvider mode='new'）」：涵蓋 mode='new' 下的完整真實 UI 流程（Idle → 點擊「開始 AI 分析」→ Ready，含真實標題斷言），以及對應的 AI Engine 專屬斷言（`AHS.AIEngine.SummaryService.get()` 有內容、`KnowledgeSummaryRuntime` 未被寫入）取代舊測試裡「必須經 KnowledgeSummaryRuntime 產生」這個現已不完全適用於 New Runtime 路徑的假設——但這個假設在 Legacy 模式下依然成立且未被移除。

## Changed Files

**修改（4 檔案，ai-engine，Extension Only）**
```
ai-engine/src/knowledge/Metadata.js           — FIELDS 新增 "title"（17 欄位，向下相容）
ai-engine/src/knowledge/MetadataBuilder.js    — fromMaterial() 新增 title 映射
ai-engine/src/knowledge/MetadataValidator.js  — STRING_FIELDS 新增 "title"
ai-engine/src/services/summary/SummaryBuilder.js — title 欄位改讀 metadata.title
```

**修改（1 檔案，測試，僅新增區塊）**
```
tests/jsdom/BehaviorSuite.js — 新增測試 [23]（New Runtime），既有 [21]／[22] 逐字未動
```

**修改（1 檔案，文件）**
```
ai-engine/README.md — 補上 title 欄位說明、Metadata 17 欄位更新
```

**零修改（依 Forbidden 清單逐一以 `git diff --stat` 確認）**
```
js/ui/MaterialSummaryCard.js             — 未變
js/ui/MaterialPreview.js                 — 未變
ai-engine/src/service/SummaryProvider.js — 未變
js/runtime/AITutorService.js             — 未變（Public API 逐字未變）
```

## 真實驗證結果（jsdom）

| 驗證項目 | 結果 |
|---|---|
| Metadata.FIELDS 新增 title（17 欄位）且既有 16 個欄位逐字保留 | PASS |
| MetadataBuilder.fromMaterial() 正確映射 material.title → metadata.title | PASS |
| 教材無標題時 metadata.title 正確為 null | PASS |
| MetadataValidator 對有效／非字串 title 驗證正確 | PASS |
| New Pipeline：SummaryBuilder 現在正確填入教材真實標題（非 null） | PASS |
| New Pipeline：metadata.title 亦正確填入（非僅頂層欄位） | PASS |
| mode='new' 下 `ensureLearningSummary()` 回傳真實標題 | PASS |
| `hasSummaryContent()` 不受標題修正影響，仍正確判斷 | PASS |
| Legacy 生成完全不受影響（仍經 KnowledgeSummaryRuntime 產生自己的真實標題） | PASS |
| **決定性複驗**：暫時切換預設模式為 new，跑真實 BehaviorSuite——「卡片顯示標題（教材名稱）」由 FAIL 恢復 PASS | PASS |
| 4 個 Forbidden 檔案逐一確認零 differ | PASS |
| Console errors = 0 | PASS |

```
PASS: 16   FAIL: 0
```

**BehaviorSuite 全量複驗（含新增測試 [23]）**：
```
PASS: 174   FAIL: 0
```
（既有 162 項 + 新增 12 項 = 174；測試 [21] 的「Summary 已由 KnowledgeSummaryRuntime 產生」斷言逐字保留且依然 PASS。）

## Root Cause

已於 Background／Part A-C 段落完整說明：New Pipeline 的 Metadata Schema 原本沒有 title 欄位可承載教材真實名稱，這是 Metadata 缺失，不是 AI Summary 演算法或品質問題。

## Impact Analysis

`Metadata`／`MetadataBuilder`／`MetadataValidator`／`SummaryBuilder` 四個檔案僅新增／擴充欄位映射，既有 16 個 Metadata 欄位與既有 11 個 Summary Model 欄位（`title` 除外）的行為完全未變。未修改 `SummaryProvider.js`（Read/Generate Contract 不受影響）、未修改 `AITutorService.js`（Public API 逐字未變）、未修改任何 UI 檔案。`BehaviorSuite.js` 僅新增一個獨立測試區塊，未修改任何既有斷言。

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite（含新增測試 [23]） | 174 / 174 PASS |
| PipelineRegression | 6 / 6 PASS |
| Regression Suite（20 檔） | 739 / 739 PASS |
| html5validator（vnu，全部根頁面） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

既有產品頁 Console Error = 0。預設模式仍為 `legacy`，本 EO 對現行上線行為零影響。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Summary Title 缺失已修正（Metadata Schema 向下相容擴充，非重新設計）、Legacy 完全不受影響、New Pipeline 現在正確顯示教材真實標題、BehaviorSuite 新增 AI Engine 專屬測試且保留全部既有 Legacy 斷言、Regression 739/739 + jsdom 174/174 + PipelineRegression 6/6 全綠、4 個 Forbidden 檔案零 differ。無 LLM、無外部套件、無 fetch/XHR/localStorage、無 Summary 演算法或 AI Pipeline 變更。

## 完成後

依 EO 指示，**恢復 Sprint AI-013**（Part A 的 Default Mode Migration 現在可以重新嘗試，導致上次停止的 Title 缺失已修正），**不自行開始 EO-AI-014**。
