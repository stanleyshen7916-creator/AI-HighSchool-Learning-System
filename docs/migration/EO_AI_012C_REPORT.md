# REPORT.md — EO-AI-012C｜Migration Bridge Hotfix

Priority：P0 ｜ Type：HOTFIX ｜ Baseline：EO-AI-001～EO-AI-012A（LOCKED）｜ 完成後恢復 Sprint AI-013。

## Objective

修正 Migration Bridge，使 `AITutorService.getLearningSummary()` 在 legacy/new/compare 三種模式下語意永久一致——永遠代表 Read Only，不因模式切換而改變 API 行為。

## Background：Sprint AI-013 執行中發現的真實回歸

執行 Sprint AI-013 Part A（Default Mode Migration，`SummaryProvider` 預設 `legacy → new`）前，依既定流程先用真實 `tests/jsdom/BehaviorSuite.js` 驗證，發現真實回歸：

```
PASS: 159   FAIL: 3
Failures:
 - 提供「開始 AI 分析」按鈕
 - 卡片顯示標題（教材名稱）
 - Summary 已由 KnowledgeSummaryRuntime 產生（Material→Service→Summary）
```

**根本原因**：`SummaryProvider.getSummary()` 的 `new` 模式分支呼叫 `SummaryService.generate()`——這個呼叫沒有任何「已存在則跳過」的檢查，每次呼叫都會真的完整跑一次 New Pipeline。`MaterialSummaryCard.create()` 在元件掛載時會呼叫一次 `service.getLearningSummary(item.id)` 決定初始狀態（idle vs ready）——這原本是純讀取（Legacy 模式下 `KnowledgeSummaryRuntime.getSummaryByMaterial()` 在尚未產生前回傳 `null`）。但當模式為 `new` 時，這個「讀取」呼叫本身就會觸發真正產生，導致使用者根本還沒點擊「開始 AI 分析」，卡片就已經直接進入 Ready 狀態並顯示內容——一個真實、可重現的 Architecture Regression。

發現後立即停止 Sprint AI-013 Part A、還原測試用的暫時性修改（`git diff --stat` 確認乾淨）、回報 PMO。PMO 確認後發出本 HOTFIX。

## Correct Contract（LOCK，本次建立）

`getLearningSummary()`／`SummaryProvider.getSummary()` 永遠代表 **Read Only**，在 legacy／new／compare 三種模式下皆然：不得產生（Generate）、不得觸發 Pipeline、不得建立 Summary。若 Summary 尚不存在，回傳 `{}`（或 Repository 既有 Empty Result），與 Legacy 行為完全一致。

真正的產生能力移到新的、獨立的 `generateSummary()` 入口——只允許從「開始 AI 分析」按鈕流程（Legacy 側為既有 `AITutorService.ensureLearningSummary()`）觸發，本次修改的檔案裡沒有任何地方自動呼叫它。

## Changed Files

**修改（2 檔案）**
```
ai-engine/src/service/SummaryProvider.js
  — getSummary() 的 new/compare 分支全面改為唯讀：新增 readNewSummary()（呼叫
    SummaryService.get()，唯讀，不產生）取代原本呼叫 SummaryService.generate() 的
    getNewSummary()；runCompare() 內部同步改為讀取（不產生）New 側資料。
  — 新增 generateSummary(materialId)：new/compare 模式下才真正呼叫
    SummaryService.generate()（透過內部 runNewSummary()），legacy 模式下僅回傳
    Legacy 讀取結果（Legacy 產生邏輯本就不屬於這個 Provider 的職責）。此方法未被
    本檔案任何地方自動呼叫。
  — setMode/getMode/getLastComparison 完全未變。

js/ai/SummaryAdapter.js
  — 新增 generateSummary(materialId)，純轉呼叫 SummaryProvider.generateSummary()。
    既有 6 個方法（generate/generateFromMaterial/get/getWithFallback/setMode/
    getMode/getSummary）完全未動。
```

**修改（1 檔案，文件）**
```
ai-engine/README.md — 補上 HOTFIX 說明與 generateSummary 文件
```

**零修改（依 Forbidden 清單逐一以 `git diff --stat` 確認）**
```
js/ui/MaterialSummaryCard.js    — 未變
js/ui/MaterialPreview.js        — 未變
js/runtime/AITutorService.js    — 未變（Public API 與實作皆零 diff——Part C「確認
                                    getLearningSummary() Read Only」純因 SummaryProvider
                                    本身修正後自動成立，AITutorService.js 完全不需要改）
```

## 真實驗證結果（jsdom，含實際觸發過原本會壞掉的情境）

| 驗證項目 | 結果 |
|---|---|
| legacy/new/compare 三模式下，呼叫 getSummary()／getLearningSummary() 都不會讓 New Pipeline 自己的快取被填入 | PASS |
| generateSummary() 之前：New Pipeline 快取仍為空 | PASS |
| generateSummary() 確實執行 New Pipeline 並回傳真實內容 | PASS |
| generateSummary() 之後：New Pipeline 快取已填入 | PASS |
| getSummary() 讀回剛產生的內容（讀取本身不重新產生） | PASS |
| **重現 Sprint AI-013 的確切情境**：預設模式切到 new，MaterialSummaryCard 第一次顯示仍為「開始 AI 分析」按鈕（Idle State 恢復） | PASS |
| 同上情境：無 Summary 卡片提前渲染 | PASS |
| Compare 模式：getSummary() 仍固定回傳 Legacy | PASS |
| Compare 模式：明確呼叫 generateSummary() 後，比較報告正確反映真實 New 內容（Core Concepts Coverage 100%） | PASS |
| Rollback：setMode("legacy") 即可還原，無需改程式 | PASS |
| 3 個 Forbidden 檔案（MaterialSummaryCard.js／MaterialPreview.js／AITutorService.js）逐一確認零 differ | PASS |
| Console errors = 0 | PASS |

```
PASS: 17   FAIL: 0
```

**決定性複驗**：把 `SummaryProvider.js` 的預設模式暫時改為 `"new"`（模擬 Sprint AI-013 Part A 的真實情境），重跑真實、未修改的 `tests/jsdom/BehaviorSuite.js`：

```
PASS: 162   FAIL: 0
```

先前失敗的 3 項全數恢復 PASS。驗證完成後已將暫時性修改還原（`var mode = "legacy"`，`git diff --stat` 確認符合本次 Deliverable 範圍）。

## Root Cause

已於「Background」段落完整說明：`getSummary()` 的 `new` 模式分支把「讀取」與「產生」混為一談，讀取呼叫本身變成了產生觸發點。

## Impact Analysis

修改僅限 `SummaryProvider.js`（拆分 Read／Generate 兩個入口）與 `SummaryAdapter.js`（新增一個轉呼叫方法）。`AITutorService.js` 完全不需要修改——因為它的 `getLearningSummary()` 本就是透過 `provider.getSummary()` 委派（EO-AI-012 Revision-1 已完成），`SummaryProvider` 修好之後，這個委派自動變成永遠唯讀，無需在 `AITutorService.js` 端做任何調整。`MaterialSummaryCard.js`／`MaterialPreview.js` 完全未觸碰。

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite（含 mode='new' 複驗） | 162 / 162 PASS |
| PipelineRegression | 6 / 6 PASS |
| Regression Suite（20 檔） | 739 / 739 PASS |
| html5validator（vnu，全部根頁面） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

既有產品頁 Console Error = 0。預設模式仍為 `legacy`，本 HOTFIX 未改變目前上線行為；驗證重點在於證明「未來 Sprint AI-013 Part A 切換預設模式時不會再壞」。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Read/Generate 職責徹底分離、`getSummary()` 在三種模式下皆驗證為真正唯讀、`generateSummary()` 驗證能正確產生真實內容且只在明確呼叫時執行、**用真實 BehaviorSuite 重現並確認修復** Sprint AI-013 發現的 3 項回歸、Rollback／Compare 模式皆正常、Regression 739/739 + jsdom 162/162 + PipelineRegression 6/6 全綠、3 個 Forbidden 檔案零 differ（含 `AITutorService.js` 完全未修改）。無 LLM、無外部套件、無 fetch/XHR/localStorage、無第二套 Runtime/Cache/UI/Architecture。

## 完成後

依 EO 指示，**恢復 Sprint AI-013**（可重新評估 Part A 的 Default Mode Migration，因為造成回歸的根本問題已修復），**不自行開始下一個 Sprint**。
