# REPORT.md — EO-AI-012A｜AI Engine Script Wiring

Priority：P0 ｜ Type：Infrastructure ｜ Baseline：EO-AI-001～EO-AI-012 Revision-1（LOCKED）｜ 完成後停止。

## Objective

完成 ai-engine 與既有前端的正式 Script Wiring，僅建立 Runtime 載入能力，不改變任何使用者可見功能、不切換預設模式、不進行 Migration。

## Development 過程：依相依性逐檔追蹤，非整包載入

依 EO 要求「僅允許實際 Migration 所需模組，不得提前載入未使用模組」，本 EO 未直接沿用先前驗證腳本慣用的「全部 ai-engine 檔案」清單，而是從 `SummaryProvider.js` 出發，逐檔案實際閱讀（非僅 grep 字串比對，以排除註解誤判），追蹤每個檔案真正呼叫/建構的 `AHS.AIEngine.X` 符號，得出真實最小依賴閉包，共 **22 個檔案**：

```
common/Errors.js, common/Constants.js, common/Utilities.js
core/AIService.js
knowledge/Metadata.js, MetadataBuilder.js, MetadataValidator.js, KnowledgeCache.js, KnowledgeLoader.js
services/summary/SummaryExtractor.js, SummaryBuilder.js, SummaryFormatter.js, SummaryValidator.js, SummaryEngine.js
parser/SummaryContentExtractor.js
runtime/SummaryRuntime.js, SummaryHistory.js, SummarySession.js, SummaryPipeline.js
service/SummaryService.js
validator/SummaryComparator.js
service/SummaryProvider.js
```

**確認排除、非本次載入**（逐檔閱讀後確認 Summary 鏈路中無任何檔案真正呼叫或建構這些符號）：
- `core/AIEngine.js`（Composition Root）／`core/AIEngineFactory.js`／`core/ServiceRegistry.js` — Summary 鏈路完全不呼叫 `AIEngineFactory.getInstance()` 或 `new AIEngine()`
- `providers/*`（BaseProvider／ProviderRegistry／ProviderFactory／ProviderManager）— 無任何 Summary 檔案引用
- `context/*`（ContextManager／ContextBuilder／ContextValidator）— 無任何 Summary 檔案引用
- `prompt/*` — 無任何 Summary 檔案引用
- `knowledge/KnowledgeRegistry.js`／`KnowledgeProvider.js`／`KnowledgeIndex.js` — Summary 鏈路只用到 `KnowledgeLoader`／`KnowledgeCache`／`Metadata*`，不用到 Registry/Provider/Index 這三個
- `common/Version.js` — 只有 `core/AIEngine.js` 用到，Summary 鏈路不需要
- `js/ai/SummaryAdapter.js` — 全專案 grep 確認零呼叫端；`AITutorService` 的 Migration Bridge（EO-AI-012 Revision-1）直接呼叫 `AHS.AIEngine.SummaryProvider`，完全繞過 `SummaryAdapter`，因此它不是這條鏈路的真實依賴

## Changed Files

**修改（1 檔案，僅新增 `<script>` 標籤，無其他變更）**
```
materials.html
  — 在 <script src="js/runtime/AITutorService.js"> 之前插入 22 個 ai-engine <script> 標籤
    （唯一載入 AITutorService.js 的頁面，確認過其餘 9 個根頁面皆未載入它）。
```

**修改（1 檔案，文件）**
```
ai-engine/README.md — 新增「Browser Wiring（EO-AI-012A）」章節，記錄實際接線清單與排除清單
```

**零修改（依 Forbidden 清單逐一以 `git diff --stat` 確認）**
```
js/ui/MaterialSummaryCard.js         — 未變
js/ui/MaterialPreview.js             — 未變
js/runtime/AITutorService.js         — 未變（Public API 與實作皆與上一版本零 diff）
ai-engine/src/core/AIEngine.js       — 未變（且本次未被載入）
```

## 真實驗證結果（jsdom 載入真實 `materials.html`，含新接線的 22 個 `<script>`）

| 驗證項目 | 結果 |
|---|---|
| `materials.html` 恰好載入追蹤出的 22 個檔案（不多不少） | PASS |
| 確認排除的 6 類模組（AIEngine.js／providers／context／prompt／KnowledgeRegistry 等／SummaryAdapter.js）皆未被載入 | PASS |
| ai-engine 檔案於 `AITutorService.js` 之前載入（符合 Boot Sequence） | PASS |
| `window.AHS.AIEngine` Namespace 正常存在 | PASS |
| `AHS.AIEngine.SummaryProvider` 可正常取得且功能正常 | PASS |
| `AHS.AIEngine.SummaryService`／`SummaryComparator` 可正常取得 | PASS |
| 鏈路中段無 undefined（SummaryPipeline／SummaryEngine／SummaryRuntime 皆可正常建構） | PASS |
| 無 Global Scope 污染（`window.SummaryProvider`／`window.SummaryEngine`／`window.AIEngineError` 皆不存在，僅存在於 `window.AHS.AIEngine` 之下） | PASS |
| 接線後 `SummaryProvider` 預設模式仍為 `legacy`（未自動切換） | PASS |
| 接線後 `AITutorService.getLearningSummary()` 內容與 Legacy 逐字相同（零行為變化） | PASS |
| `MaterialSummaryCard` 渲染與 `hasSummaryContent()` 皆不受影響 | PASS |
| Compare Mode 可正常初始化，回傳值仍固定為 Legacy，比較報告正常產生 | PASS |
| Rollback 回 `legacy` 模式正常 | PASS |
| Console errors 全流程 = 0 | PASS |
| 3 個 Forbidden 檔案（MaterialSummaryCard.js／MaterialPreview.js／AIEngine.js）逐一確認零 differ | PASS |
| `AITutorService.js` 本身零 diff（本 EO 未修改任何 JS 邏輯，只動 HTML） | PASS |

```
PASS: 27   FAIL: 0
```

## Root Cause

無（Infrastructure EO，非 Bug Fix）。

## Impact Analysis

本 EO 唯一程式碼變更是 `materials.html` 新增 22 個 `<script src>` 標籤——沒有任何 `.js` 檔案的邏輯被修改（`js/runtime/AITutorService.js` 經 `git diff --stat` 確認與上一版本零 diff）。新增的 ai-engine 檔案全部是先前 EO（EO-AI-001～EO-AI-011）已完成、已通過驗證的既有程式碼，本 EO 沒有新增或修改任何 ai-engine 原始碼。由於 `SummaryProvider` 預設模式仍為 `legacy`，`AITutorService.getLearningSummary()` 的 Migration Bridge（EO-AI-012 Revision-1 新增）現在找到真實的 `SummaryProvider` 並委派給它，但因為 mode 是 `legacy`，內容與委派前逐字相同——對真實使用者是零行為變化。

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy，22 個新 `<script src>` 皆解析到真實檔案） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite（含真實 `materials.html` 現在會多載入 22 個 ai-engine 檔案） | 162 / 162 PASS |
| PipelineRegression | 6 / 6 PASS |
| Regression Suite（20 檔） | 739 / 739 PASS |
| html5validator（vnu，全部根頁面） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

既有產品頁 Console Error = 0。UI 零變化——`materials.html` 視覺與互動行為與接線前完全相同，`AHS.AIEngine.SummaryProvider` 現在真實可用，但預設 `legacy` 模式使其對使用者透明。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Script 接線僅載入真實依賴閉包（22 檔，非整包 ai-engine）、`SummaryProvider`／`AIEngine` Namespace 正常、Legacy Mode 維持預設且零行為變化、Compare Mode 可正常初始化、Regression 739/739 + jsdom 162/162 + PipelineRegression 6/6 全綠、3 個 Forbidden 檔案零 differ、`AITutorService.js` 本身零 diff（本 EO 純屬 HTML 接線）。無 LLM、無外部套件、無 fetch/XHR/localStorage、無第二套 Runtime/Namespace/Provider/Pipeline。

## Deferred Work（LOCK，依 PMO 決議）

- **EO-AI-012B**：Default Mode Migration（`SummaryProvider` 預設模式 `legacy → new`，完成真正 Migration）
- **EO-AI-013**：Legacy Cleanup（至少一個 Sprint 驗證穩定後，才允許移除 `KnowledgeSummaryRuntime` 相關 Legacy 邏輯）

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-012B**。
