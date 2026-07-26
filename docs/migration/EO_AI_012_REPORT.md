# REPORT.md — EO-AI-012 Revision-1｜AI Summary Legacy Migration（Migration Bridge）

Priority：P0 ｜ Type：PMO Revision ｜ Baseline：EO-AI-001～EO-AI-011（LOCKED）｜ 完成後停止。

## Revision 背景

原始 EO-AI-012 要求 `MaterialSummaryCard → SummaryAdapter → SummaryProvider → New Pipeline` 鏈路真實生效，但其 Forbidden 清單同時禁止修改 `MaterialSummaryCard.js`／`MaterialPreview.js`——這兩個檔案是唯一能決定畫面實際資料來源的地方，且經 grep 確認全專案沒有任何檔案呼叫 `SummaryAdapter`、沒有任何 HTML 頁面載入 `ai-engine/`。此結構性衝突已於上一輪回報並暫停，PMO 確認後發出 Revision-1，將範圍限縮為 `AITutorService → SummaryProvider` 內部委派（Migration Bridge），不涉及 UI／MaterialSummaryCard／MaterialPreview。

**路徑澄清**：Revision-1 規格文字寫 `js/services/AITutorService.js`，但專案裡實際檔案位於 `js/runtime/AITutorService.js`（`js/services/` 是專案 legacy 禁用路徑，經 `VerifyPaths.js` 確認）。本 EO 修改的是真實存在的 `js/runtime/AITutorService.js`，視為規格筆誤，非路徑衝突。

## Objective

僅完成 `AITutorService → SummaryProvider` 內部委派（Migration Bridge），`MaterialSummaryCard`／`MaterialPreview` 完全不修改，UI 與 Public API 完全不變。

## Changed Files

**修改（1 檔案，僅新增一個私有 helper + 改寫一個函式的內部實作，Public API 逐字未變）**
```
js/runtime/AITutorService.js
  — 新增私有 summaryProvider() helper：偵測 AHS.AIEngine.SummaryProvider 是否存在。
  — getLearningSummary(materialId) 內部實作改為：若 SummaryProvider 存在，委派給
    provider.getSummary(materialId)（routing 完全由 Provider 自己的 mode 決定，本檔案
    不檢查/不比對 mode）；否則 fallback 至修改前的 AITutorRuntime 協調讀取（逐字不變）。
  — ensureLearningSummary()／其餘 8 個 Public API 完全未動（僅新增 1 個私有 helper 之外，
    無任何其他函式簽名、參數、回傳格式變更）。
```

**修改（1 檔案，文件）**
```
ai-engine/README.md — 補上 Migration Bridge 說明
```

**零修改（依 Forbidden 清單逐一以 `git diff --stat` 確認）**
```
js/ui/MaterialSummaryCard.js    — 未變
js/ui/MaterialPreview.js        — 未變
ai-engine/src/core/AIEngine.js  — 未變
js/runtime/KnowledgeRuntime.js  — 未變
js/runtime/HistoryRuntime.js    — 未變
```

## 設計

```
MaterialSummaryCard.js（未修改）
      │  仍然只呼叫 AHS.AITutorService（呼叫端完全沒變）
      ▼
AITutorService.getLearningSummary(materialId)
      │  若 AHS.AIEngine.SummaryProvider 存在 → 委派（mode 決策 100% 在 Provider 內）
      │  若不存在（目前所有真實頁面皆是如此，接線延後至 EO-AI-012A）→ fallback
      ▼                                              ▼
SummaryProvider.getSummary()                  AITutorRuntime.getKnowledgeSummary()
（legacy/new/compare 由 Provider 自己決定）      （修改前逐字相同的路徑）
```

- `AITutorService` 本身完全不檢查、不比較 mode 字串——原始碼掃描確認檔案內沒有 `getMode()` 呼叫、沒有 `=== "legacy"/"new"/"compare"` 比對。
- `ensureLearningSummary()` 的產生鏈（Text Pipeline → KnowledgePipeline → `KnowledgeSummaryRuntime.createSummary`）完全未動——本 EO 範圍明訂「Migration 尚未完成」、預設模式仍為 `legacy`，只有讀取路徑安全可先接上。
- 目前所有真實頁面都尚未載入 `ai-engine/`（接線是 EO-AI-012A 的範圍），因此 `summaryProvider()` 在所有正式頁面上都回傳 `null`，`getLearningSummary` 100% 走原本的 fallback 分支——**對真實使用者是零行為變化**。

## 真實驗證結果（jsdom，兩種情境）

**情境一：真實 `materials.html`，不接 ai-engine（今日所有正式頁面的真實狀態）**

| 驗證項目 | 結果 |
|---|---|
| 真實 `<script>` 清單確認未載入任何 ai-engine/js/ai 檔案 | PASS |
| `getLearningSummary()` 分析前 = `{}` | PASS |
| `ensureLearningSummary()` 仍正常產生真實 Legacy Summary | PASS |
| `getLearningSummary()` 分析後與 `KnowledgeSummaryRuntime` 記錄逐字相同 | PASS |
| `MaterialSummaryCard.create()` 仍正常渲染 AI 重點整理區塊 | PASS |
| `MaterialSummaryCard.hasSummaryContent()` 行為不變 | PASS |
| Public API 仍恰為原本 9 個成員（未新增） | PASS |
| Console errors = 0 | PASS |

**情境二：同一頁面，額外把 ai-engine 疊加載入（模擬 EO-AI-012A 完成後的頁面）**

| 驗證項目 | 結果 |
|---|---|
| 接線後 `SummaryProvider` 預設模式仍為 `legacy`（未自動切換） | PASS |
| legacy 模式：`AITutorService.getLearningSummary` 已改走 Provider，內容仍與 Legacy 逐字相同 | PASS |
| new 模式：`AITutorService.getLearningSummary` 回傳真實 New Pipeline 內容（非空、與 Legacy 內容形狀不同，證明真的是 New） | PASS |
| compare 模式：`AITutorService.getLearningSummary` 仍固定回傳 Legacy（UI 永遠不會看到 New） | PASS |
| compare 模式：`getLastComparison()` 可取得完整比較報告（供 QA） | PASS |
| compare 模式：Core Concepts Coverage 經 AITutorService 全鏈路仍為 100%（EO-AI-010A HOTFIX 依然成立） | PASS |
| Rollback：`setMode("legacy")` 即可還原，無需改程式 | PASS |
| 原始碼掃描：AITutorService 不自行判斷 mode | PASS |
| Console errors = 0 | PASS |

```
PASS: 26   FAIL: 0
```

## Root Cause

無（Feature/Migration Bridge EO，非 Bug Fix）。

## Impact Analysis

`js/runtime/AITutorService.js` 僅新增 1 個私有 helper（`summaryProvider()`）並改寫 `getLearningSummary()` 的內部實作；`ensureLearningSummary` 與其餘 8 個 Public API 函式簽名、參數、回傳格式完全未變。`tests/regression/AITutorServiceV1.js`（68 項斷言，含「Public API 恰為 9 個成員」「`getLearningSummary` 與 `AITutorRuntime.getKnowledgeSummary` 輸出逐字相同」「`createSummary` 僅出現一次」等硬性規格）在此環境（未載入 ai-engine，與所有真實頁面現況相同）下 68/68 全數維持 PASS，證明對現有系統零回歸。`MaterialSummaryCard.js`／`MaterialPreview.js` 完全未觸碰，UI 零變化。

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite | 162 / 162 PASS |
| PipelineRegression | 6 / 6 PASS |
| Regression Suite（20 檔，含 AITutorServiceV1 68 項） | 739 / 739 PASS |
| html5validator（vnu，全部根頁面） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

既有產品頁 Console Error = 0。UI／既有 Runtime 行為零變化——`summaryProvider()` 在所有真實頁面上目前恆為 `null`，`getLearningSummary` 100% 走原本路徑。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

`AITutorService` Public API 完全一致（9 個成員，簽名/回傳格式未變）、`MaterialSummaryCard`／`MaterialPreview` 零修改、Legacy／New／Compare 三模式皆透過 `AITutorService` 全鏈路驗證正常、Rollback 僅需切換 mode 不需改程式、Compare Coverage 維持 100%、Regression 739/739（含 AITutorServiceV1 68/68）+ jsdom 162/162 + PipelineRegression 6/6 全綠、5 個 Forbidden 檔案逐一確認零 differ。無 LLM、無外部套件、無 fetch/XHR/localStorage、無第二套 UI/Runtime/Cache。

## Deferred Work（LOCK，依 PMO 決議）

- **EO-AI-012A**：AI Engine Script Wiring（HTML `<script>` 接線、Runtime Bootstrapping，ai-engine 正式載入頁面）
- **EO-AI-012B**：Default Mode Migration（`SummaryProvider` 預設模式 `legacy → new`，完成真正 Migration）
- **EO-AI-013**：Legacy Cleanup（至少一個 Sprint 驗證穩定後，才允許移除 `KnowledgeSummaryRuntime` 相關 Legacy 邏輯）

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-013**。
