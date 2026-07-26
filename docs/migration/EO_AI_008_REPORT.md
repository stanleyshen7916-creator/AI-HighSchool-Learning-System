# REPORT.md — EO-AI-008｜AI Summary Replace Legacy Integration

Priority：P0 ｜ Baseline：EO-AI-001～EO-AI-007（LOCKED）+ EO-S8.3.004（MaterialSummaryCard，LOCKED）｜ 完成後停止。

## Objective（依 PMO 修正指示執行）

原始 EO-AI-008 要求把 Material Detail 的 AI 重點整理正式從 Legacy（`AITutorService`/`KnowledgeSummaryRuntime`）切換到新 `ai-engine` 架構。執行前發現：`SummaryPipeline`/`SummaryEngine` 目前結構上**產不出**與 `KnowledgeSummaryRuntime` 等價的真實內容（EO-AI-005 當初明確要求「不做 AI 生成」），若照字面 Replace，`tests/jsdom/BehaviorSuite.js` 第 602~663 行（`[21] EO-S8.3.004`）的斷言「卡片顯示重點條列（至少一項）」「卡片顯示關鍵字（至少一項）」必定失敗——已回報並暫停，附上確切證據（行號、程式碼）。PMO 確認後發出修正指示（LOCK）：**禁止 Replace Legacy**，本 EO 縮小為在 `SummaryAdapter`/`SummaryService` 新增**唯讀 Compatibility Layer**，不修改任何既有檔案。

## Changed Files

**修改（2 檔案，僅新增方法，既有方法簽名與行為不變）**
```
ai-engine/src/service/SummaryService.js  — 新增 getWithFallback(materialId)
js/ai/SummaryAdapter.js                   — 新增 getWithFallback(materialId)，委派 SummaryService
```

**修改（1 檔案）**
```
ai-engine/README.md  — 補上本次新增能力的文件，並記錄「Replace Legacy 延後至未來 AI Summary Migration EO」
```

**零修改（逐一以 `git diff --stat` 比對確認，且用真實 jsdom 載入 `materials.html` 端對端驗證）**
```
js/ui/MaterialPreview.js         — 確認未變
js/ui/MaterialSummaryCard.js     — 確認未變
js/runtime/AITutorService.js     — 確認未變
js/runtime/KnowledgeSummaryRuntime.js — 確認未變
AIEngine.js / HistoryRuntime.js / KnowledgeRuntime.js / ReviewRuntime.js — 未讀取、未引用、零修改
```

## Architecture Impact

```
（能力已就緒，尚未被任何頁面呼叫；MaterialSummaryCard 仍呼叫 AITutorService，未變）

SummaryAdapter.getWithFallback(materialId)
  → SummaryService.getWithFallback(materialId)
      1. 讀取本身 SummaryRuntime 是否已有「有效內容」（concepts/definitions/formulas/examples/keywords
         任一非空陣列）→ 有就直接回傳
      2. 沒有 → 唯讀呼叫既有 AHS.KnowledgeSummaryRuntime.getSummaryByMaterial(materialId)
         → 回傳既有 Summary（可能為 null）
```

不呼叫 `AITutorService.ensureLearningSummary()`（不觸發新的 Legacy 生成，只讀已存在的）；`AHS.KnowledgeSummaryRuntime` 全程只被呼叫其既有的唯讀方法 `getSummaryByMaterial()`。

`SummaryPipeline` 本身完全未變、未被賦予接管能力——目前產出的內容依然是誠實 stub。等未來 `SummaryPipeline` 真正具備等價內容生成能力後，`getWithFallback()` 的「有效內容」判斷會自然轉為優先回傳新管線結果，不需要再改這支程式碼——但**實際切換使用者看到的畫面（讓 `MaterialSummaryCard` 呼叫這個 Adapter）屬於未來獨立的「AI Summary Migration」EO，本 EO 不執行、不開始**。

## Root Cause

無（Feature EO，非 Bug Fix）——上面段落是設計判斷與 PMO 確認後的執行紀錄。

## Impact Analysis + 端對端驗證

用**真實 `materials.html`**（jsdom 載入完整既有 script 順序：`MaterialRuntime`→`KnowledgePipeline`→`AnalysisRuntime`→`KnowledgeGraphRuntime`→`KnowledgeSummaryRuntime`→`AITutorService`→`MaterialSummaryCard`→`MaterialPreview`……）疊上新的 `ai-engine` 檔案，做了關鍵的端對端驗證：

1. 建立教材、跑真實知識管線、呼叫既有 `AITutorService.ensureLearningSummary()` 產生**真實**的 Legacy Summary（`coreConcepts.length > 0`）。
2. `SummaryAdapter.getWithFallback()` 在新系統尚無資料時，正確回傳這份真實 Legacy 內容（逐位元組比對相符）。
3. **關鍵測試**：接著呼叫新的 `SummaryService.generate()`，新系統現在「有」一筆紀錄，但內容仍是空陣列（誠實 stub）——再次呼叫 `getWithFallback()`，確認它**沒有**因為新系統「有紀錄」就誤判為有效，依然正確 fallback 回真實 Legacy 內容。這證明「不得讓畫面失去內容」的判斷邏輯是對的，不是只檢查「有沒有存在」，而是真的檢查「有沒有內容」。
4. 兩邊都沒有資料時回傳 `null`。
5. 連續呼叫 `getWithFallback()` 前後，Legacy `KnowledgeSummaryRuntime` 的內容逐位元組不變，證明全程唯讀。
6. 整個真實頁面載入 + 新層疊加 + 相容層呼叫，Console Error = 0。
7. 四個禁止修改的檔案用 `git diff --stat` 逐一確認零 differ。

## Unit Test / Integration Test（15 條全數 PASS，真實 jsdom + 完整既有管線）

```
PASS: 15   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS（無 fetch/XHR/localStorage） |
| jsdom BehaviorSuite（含 `[21] EO-S8.3.004` 原有斷言） | **162 / 162 PASS，完全未受影響** |
| Regression Suite（19 檔） | 739 / 739 PASS |
| html5validator（vnu，10 頁） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

9 個既有產品頁 Console Error = 0。Material Detail 的 AI 重點整理功能行為與畫面**完全沒有變化**——這正是本 EO 修正後的核心要求。

## GitHub Pages

Push 至 `main`。無 UI 變化可供外部瀏覽器驗證（環境對外部網站存取受限），既有頁面內容零 differ、regression 全綠（含原有的 AI 重點整理端對端測試全數通過）可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Unit/Integration Test 15/15（真實 jsdom + 完整既有知識管線端對端驗證）、Regression 739/739、jsdom 162/162（含未受影響的既有 AI 重點整理測試）、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0。四個禁止修改檔案逐一確認零 differ。未 Replace Legacy、未建立第二套 UI／按鈕／Runtime、未新增外部套件、無 fetch/XHR/localStorage。

## 停止聲明

依 EO 指示，完成後**停止，不開始 Migration**。
