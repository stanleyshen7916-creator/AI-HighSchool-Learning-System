# REPORT.md — EO-AI-012D｜Generate Path Migration

Priority：P0 ｜ Type：Migration ｜ Baseline：EO-AI-001～EO-AI-012C（LOCKED）｜ 完成後恢復 Sprint AI-013。

## Objective

完成 AI Summary Migration 最後一段：Generate Path Migration，使 Read／Generate 使用同一 Runtime，Repository 不再存在 Read/Generate Split-Brain。

## Background

EO-AI-012C 已修正 Read 路徑（`getLearningSummary()`／`SummaryProvider.getSummary()` 在三種模式下皆為 Read Only），但刻意將 `ensureLearningSummary()` 的產生鏈保留為固定走 Legacy——這在 Sprint AI-013 v3.0 執行前的探測中被發現是個真實缺口：預設模式切到 `new` 後，Read 走 New（空的，因為從未有東西寫入），Generate 仍固定走 Legacy，造成「使用者分析後關閉再重新開啟教材預覽，畫面又跳回『開始 AI 分析』按鈕」的真實回歸——即使 Legacy 確實已經有記錄。已於實作前先回報 PMO，本 EO 為 PMO 發出的正式修正指示。

## Development

### Part A／B — Routing Rule

`js/runtime/AITutorService.js` 的 `ensureLearningSummary()` 內部新增依 `SummaryProvider.getMode()` 分流（此為本 EO 明確授權的例外，僅限 Generate 路徑；Read 路徑仍完全不由此檔案判斷模式）：

```
mode = legacy  → 維持原本 Legacy Generate 鏈（Text Pipeline → KnowledgePipeline →
                  KnowledgeSummaryRuntime.createSummary），邏輯逐字未變，只是抽成
                  獨立的 generateLegacySummary() 私有函式以便 compare 分支共用。
mode = new     → 改呼叫 SummaryProvider.generateSummary()，Legacy 鏈完全不執行。
mode = compare → 仍執行 Legacy 鏈（UI 看到的回傳值維持 Legacy，符合既有 Compare
                  Contract），並額外呼叫一次 generateSummary() 作為副作用，讓
                  SummaryProvider.getLastComparison() 能拿到真實的 New 資料可比對。
```

### Part C — Idempotency（Adapter）

原本的 idempotent 判斷 `existing && existing.materialId` 只認得 Legacy 的頂層 `materialId` 欄位；New Pipeline 的輸出沒有這個欄位（`materialId` 在 `metadata.materialId`）。新增私有（非 Public API）helper `hasProducedContent(summary)`：先檢查 `.materialId`（保留 Legacy 原本行為逐字不變），沒有的話再檢查 `.summary` 底下 5 個分類陣列是否有內容（New 與 Legacy 皆共用這個 `.summary` 子物件形狀，源自 EO-AI-009）。這就是 Part C 允許建立的「Adapter」——一個純函式、不是新檔案、不是新 Runtime，僅解決兩種 Shape 的辨識問題。

## Changed Files

**修改（1 檔案，僅擴充 `ensureLearningSummary()` 內部實作，Public API 逐字未變）**
```
js/runtime/AITutorService.js
  — 新增私有 hasProducedContent(summary)：shape-agnostic 的「是否已產生」判斷。
  — ensureLearningSummary() 內部依 mode 分流（見上）。
  — 新增私有 generateLegacySummary(materialId)：抽出原本內嵌於 ensureLearningSummary
    的 Legacy 產生鏈，邏輯完全未變，供 legacy／compare 分支共用。
  — 其餘 8 個 Public API（buildLearningContext/getLearningSummary/getPracticeQuestions/
    getWrongBookItems/getReviewItems/getTutorSession/serialize/ensureQuestionSet）
    完全未動。
```

**修改（1 檔案，文件）**
```
ai-engine/README.md — 補上 Generate Path Migration 說明
```

**零修改（依 Forbidden 清單逐一以 `git diff --stat` 確認）**
```
js/ui/MaterialSummaryCard.js             — 未變
js/ui/MaterialPreview.js                 — 未變
ai-engine/src/service/SummaryProvider.js — 未變（Read Contract／Read API 完全未觸碰）
```

## 真實驗證結果（jsdom，含重現並修復 Sprint AI-013 發現的確切情境）

| 驗證項目 | 結果 |
|---|---|
| mode=new：點擊「開始 AI 分析」使用 New Runtime 產生真實內容 | PASS |
| mode=new：Legacy KnowledgeSummaryRuntime 完全未被觸碰（Read/Generate 皆專屬 New） | PASS |
| **修復確認**：mode=new 產生後，重新讀取（`getLearningSummary`）仍正確回傳剛產生的內容（不再是 `{}`） | PASS |
| **修復確認**：`hasSummaryContent()` 對重新讀取結果為 true——重新開啟教材預覽會顯示 Ready，不會跳回 Idle | PASS |
| mode=new：Idempotent——第二次呼叫 `ensureLearningSummary()` 不重新產生 | PASS |
| mode=legacy：產生鏈與行為完全不變（Legacy 記錄產生、New 快取不受影響） | PASS |
| mode=compare：`ensureLearningSummary()` 回傳值仍為 Legacy 形狀（UI 不變） | PASS |
| mode=compare：New 端也作為副作用被產生，`getLastComparison()` 可取得真實比較資料（Core Concepts Coverage 100%） | PASS |
| mode=compare：重新讀取內容仍與 Legacy 一致（Compare Contract 維持） | PASS |
| Rollback：切回 legacy 後，全新一次 `ensureLearningSummary()` 呼叫改走 Legacy | PASS |
| **決定性複驗**：把 `SummaryProvider` 預設模式暫時改為 `new`，跑真實 UI 流程——首次開啟顯示「開始 AI 分析」，點擊後關閉、重新開啟教材預覽，直接顯示 Summary 卡片，不再出現「開始 AI 分析」按鈕 | PASS |
| Forbidden 檔案（MaterialSummaryCard.js／MaterialPreview.js／SummaryProvider.js）逐一確認零 differ | PASS |
| AITutorService Public API 仍恰為原本 9 個成員 | PASS |
| Console errors = 0 | PASS |

```
PASS: 28   FAIL: 0
```

## Root Cause

已於 Background 段落完整說明：Generate 路徑從未隨 Read 路徑一起完成 Migration，導致兩套 Runtime 各自為政（Split-Brain）。

## Impact Analysis

修改僅限 `js/runtime/AITutorService.js` 內部實作——`ensureLearningSummary()` 的簽名、參數、回傳格式完全未變，`tests/regression/AITutorServiceV1.js` 68 項斷言（含「Public API 恰為 9 個成員」「createSummary 僅出現一次」「KnowledgeGraphRuntime／MaterialTextPipeline 僅供 ensureLearningSummary 驅動鏈使用」等原始碼掃描規則）在未載入 ai-engine 的環境下（與所有現行真實頁面現況相同）68/68 全數維持 PASS，證明對既有系統零回歸。`SummaryProvider.js` 的 Read Contract／Read API 完全未觸碰。

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite | 162 / 162 PASS |
| PipelineRegression | 6 / 6 PASS |
| Regression Suite（20 檔，含 AITutorServiceV1 68/68） | 739 / 739 PASS |
| html5validator（vnu，全部根頁面） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

既有產品頁 Console Error = 0。預設模式仍為 `legacy`，本 EO 對現行上線行為零影響；驗證重點在於確認「Sprint AI-013 Part A 切換預設模式後，Read／Generate 使用同一 Runtime，不再有狀態遺失」。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Generate Path Migration 完成、Read／Generate 三種模式下皆共用同一 Runtime、Idempotency 透過 shape-agnostic Adapter 在兩種 Shape 下皆成立、Compare Contract 未受影響、**用真實 UI 流程重現並確認修復** Sprint AI-013 發現的「重新開啟預覽狀態遺失」問題、Regression 739/739 + jsdom 162/162 + PipelineRegression 6/6 全綠、3 個 Forbidden 檔案零 differ、AITutorService Public API 逐字未變。無 LLM、無外部套件、無 fetch/XHR/localStorage、無第二套 Runtime/Namespace/Architecture。

## 完成後

依 EO 指示，**恢復 Sprint AI-013**（Part A 的 Default Mode Migration 現在具備完整、一致的 Read/Generate 基礎，可重新評估），**不自行開始下一個 Sprint**。
