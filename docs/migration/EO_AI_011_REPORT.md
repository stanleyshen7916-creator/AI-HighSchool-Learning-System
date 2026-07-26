# REPORT.md — EO-AI-011｜AI Summary Dual-run Integration

Priority：P0 ｜ Baseline：EO-AI-001～EO-AI-010A（LOCKED）｜ 完成後停止。

## Objective

建立 AI Summary 新舊 Pipeline 的雙軌整合能力（Dual-run）：可切換、可驗證，本 EO 不移除 Legacy、不修改 UI，僅建立能力。

## Changed Files

**新增（1 檔案，`ai-engine/src/service/`）**
```
SummaryProvider.js — setMode('legacy'|'new'|'compare')/getMode()/getSummary(materialId)/
                     getLastComparison()；唯一入口，依 mode 選擇 Legacy 或 New Pipeline
```

**修改（1 檔案，僅新增方法，既有方法完全不變）**
```
js/ai/SummaryAdapter.js
  — 新增 setMode/getMode/getSummary 三個方法，皆為單純轉呼叫 AHS.AIEngine.SummaryProvider。
    既有 generate/generateFromMaterial/get/getWithFallback 四個方法簽名與實作逐字未動。
```

**修改（1 檔案，文件）**
```
ai-engine/README.md — 補上本次新增模組（狀態列、Folder Structure、Public API）
```

**零修改（依 Forbidden 清單逐一以 `git diff --stat` 確認）**
```
js/ui/MaterialPreview.js               — 未變
js/ui/MaterialSummaryCard.js           — 未變
js/runtime/KnowledgeSummaryRuntime.js  — 未變
js/runtime/AITutorService.js           — 未變
ai-engine/src/core/AIEngine.js         — 未變
```

## SummaryProvider 設計

```
Material
  ↓
SummaryProvider.getSummary(materialId)
  ↓ 依 mode
  legacy  → AHS.KnowledgeSummaryRuntime.getSummaryByMaterial()（唯讀，從不寫入）
  new     → AHS.AIEngine.SummaryService.generate()（既有 singleton，不建立第二個 Pipeline/Runtime）
  compare → 兩者皆執行，交由既有 SummaryComparator 比較，回傳值仍為 Legacy 結果（不改變使用者畫面）
```

- 預設 mode 為 `legacy`，不自動切換。
- `compare` 模式下，比較報告（coverage／missingItems／compatibility）僅存放於記憶體內變數（`getLastComparison()`），不寫入任何 Runtime、不持久化、不顯示給使用者，純供 QA 讀取。
- 未建立第二套 UI、第二套 Runtime、第二套 Cache；未使用 localStorage/fetch/XMLHttpRequest/第三方套件。

## SummaryAdapter Integration

`js/ai/SummaryAdapter.js` 新增 `setMode`/`getMode`/`getSummary` 三個轉呼叫方法（皆委派給 `AHS.AIEngine.SummaryProvider`），純新增、不改動既有四個方法。未修改 `MaterialSummaryCard.js`——Adapter 本身也仍未被任何頁面 `<script>` 引用，維持「built, not wired」狀態。

## 真實驗證結果（jsdom 載入 `materials.html` 完整既有管線）

| 驗證項目 | 結果 |
|---|---|
| 預設 mode 為 legacy（Provider／Adapter 皆一致） | PASS |
| legacy 模式回傳內容與直接呼叫 `KnowledgeSummaryRuntime.getSummaryByMaterial()` 逐字一致 | PASS |
| new 模式回傳真實 New Pipeline 內容（非空，且與 `SummaryService.get()` 一致） | PASS |
| compare 模式 `getSummary()` 回傳值仍為 Legacy（UI 不會看到 New） | PASS |
| compare 模式 `getLastComparison()` 產生完整 coverage（5 分類）／missingItems／compatibility | PASS |
| compare 模式下 Core Concepts Coverage 仍為 100%（EO-AI-010A HOTFIX 在 Dual-run 下依然成立） | PASS |
| `setMode()` 拒絕未知 mode（拋出 ValidationError） | PASS |
| `MaterialSummaryCard.hasSummaryContent()` 對 Legacy 結果行為未變 | PASS |
| SummaryProvider 原始碼零 fetch/XHR/localStorage/IndexedDB | PASS |
| SummaryProvider 未建立第二個 SummaryPipeline/SummaryRuntime 實例 | PASS |
| SummaryProvider 未觸碰 document/DOM | PASS |
| Console errors 全流程 = 0 | PASS |
| 5 個 Forbidden 檔案逐一 `git diff --stat` 零 differ | PASS |

```
PASS: 26   FAIL: 0
```

## Root Cause

無（Feature EO，非 Bug Fix）。

## Impact Analysis

新增檔案為全新檔案（`SummaryProvider.js`），對既有 `SummaryService`/`SummaryPipeline`/`SummaryComparator`/`KnowledgeSummaryRuntime` 皆為純讀取／委派呼叫，未修改其實作。`SummaryAdapter.js` 僅新增三個方法，既有介面簽名與行為零異動。無 UI 變化——`MaterialSummaryCard.js`、`MaterialPreview.js` 完全未觸碰，任何頁面的 `<script>` 引用清單也未變。

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite | 162 / 162 PASS |
| PipelineRegression | 6 / 6 PASS |
| Regression Suite（20 檔） | 739 / 739 PASS |
| html5validator（vnu，全部根頁面） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

既有產品頁 Console Error = 0。無 UI／既有 Runtime 行為變化——本 EO 新增的模組未被任何頁面載入。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Legacy／New／Compare 三模式皆驗證通過（真實 jsdom + 完整既有管線）、MaterialSummaryCard 完全無變化、Compare Mode 產生完整驗證資料（coverage/missingItems/compatibility，僅存於記憶體）、Regression 739/739 + jsdom 162/162 + PipelineRegression 6/6 全綠、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS。無 LLM、無外部套件、無 fetch/XHR/localStorage、無第二套 UI/Runtime/Cache。5 個 Forbidden 檔案全數確認零 differ。

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-012**。Legacy Migration 將於 EO-AI-012 獨立執行。
