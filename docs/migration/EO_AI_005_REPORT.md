# REPORT.md — EO-AI-005｜AI Summary Engine Foundation

Priority：P0 ｜ Baseline：EO-AI-004（commit `2d808b9`，LOCKED）｜ 完成後停止。

## Objective

建立 AI Summary Engine 的 Summary Pipeline 基礎架構，輸出結構化 Summary Model。不串接任何 LLM 或外部 AI 服務。

## Changed Files

**新增（5 檔案，`ai-engine/src/services/summary/`——這是 EO-MIG-002 就保留、原本空的服務槽）**
```
SummaryEngine.js       — generate(materialId) / generateByKnowledge(knowledge) / generateBatch(materialIds)
SummaryExtractor.js     — 從 Knowledge Object 抽取結構性資訊（metadata/tags/chapter/section/content 長度）
SummaryBuilder.js        — 組出 12 欄位 Summary Model
SummaryFormatter.js      — toJSON() / toRuntimeObject()
SummaryValidator.js      — 必填欄位／空值／重複關鍵字 + 委派既有 MetadataValidator 驗證 metadata
```

**修改（1 檔案）**
```
ai-engine/README.md  — 補上本次新增模組的文件
```

**`ai-engine/src/core/AIEngine.js`：零修改**（見下「AIEngine Integration」）。既有 Platform／Runtime／HTML／CSS／既有 JS／既有 Knowledge Engine／Prompt Manager／AI Core：**零 differ**。

## Architecture Impact

```
SummaryEngine（extends AIService, id="summary"）
  .generate(materialId)
    → KnowledgeLoader.loadFromMaterial(materialId)   【EO-AI-004，唯讀，未修改】
    → SummaryExtractor.extract(knowledge)              → 結構性資訊
    → SummaryBuilder.build(extracted)                    → Summary Model（12 欄位）
    → SummaryValidator.validateOrThrow(model)              → 保證輸出合法
```

### Summary Model（12 欄位，無 AI 生成內容）

`title`／`concepts`／`definitions`／`formulas`／`examples` 為誠實的 `null`／空陣列 stub（跟本專案既有 `js/parser/SummaryGenerator.js` 一貫的「不捏造內容」原則一致，PipelineRegression.js 也明確驗證這條原則）——這些欄位需要真正的 AI/NLP 才能產生，本 EO 明確禁止。`keywords` 是 `metadata.tags` 的結構性直接映射，不是生成結果。`subject`／`grade`／`chapter`／`section`／`difficulty`／`metadata` 全部來自既有 Knowledge Object 的結構資料，非文字生成。

### AIEngine Integration

**未修改 `AIEngine.js` 一行程式碼**——`SummaryEngine` 繼承 `AHS.AIEngine.AIService`（EO-AI-002），`id` 使用既有 `AHS.AIEngine.SERVICE_IDS.SUMMARY` 常數，直接相容 EO-AI-002 就建好、完全沒改動過的 `AIEngine.registerService()` / `getService()`。整合方式已用測試驗證：`engine.registerService(new AHS.AIEngine.SummaryEngine())` → `engine.getService("summary")` 取得後可正常呼叫 `generate()`。

## Root Cause

無（Feature EO，非 Bug Fix）。

## Impact Analysis

新增內容全部落在先前保留的空資料夾 `ai-engine/src/services/summary/`，未修改任何既有檔案的邏輯（唯一修改是 README 文件）。Summary Pipeline 對 `AHS.MaterialRuntime` 的存取完全透過 EO-AI-004 已驗證過的唯讀 `KnowledgeLoader.loadFromMaterial()`，沒有新增任何直接的 Runtime 存取路徑。已用原始碼掃描確認 Summary Pipeline 五個檔案內**沒有** `fetch`／`XMLHttpRequest`／`localStorage`／`OpenAI` 字樣。

## Unit Test（node vm 沙箱，40 條全數 PASS）

涵蓋：`SummaryExtractor`（含非物件輸入錯誤路徑、`frozen` 結果、真實教材資料抽取正確）、`SummaryBuilder`（12 欄位齊全、誠實 stub 驗證、`frozen` 結果）、`SummaryFormatter`（`toRuntimeObject`／`toJSON`、確認輸出不含 HTML 標籤）、`SummaryValidator`（必填／重複關鍵字／委派 metadata 驗證／`validateOrThrow`）、`SummaryEngine`（三個 API 端對端跑通、含批次處理、找不到教材時正確拋錯）、原始碼靜態掃描確認零 LLM／網路／持久化呼叫，以及 **AIEngine 整合驗證**（透過既有 `registerService`/`getService`，未修改 `AIEngine.js`），並回歸 EO-AI-001～004 全部既有行為不變。

```
PASS: 40   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS（無 fetch/XHR/localStorage） |
| jsdom BehaviorSuite | 162 / 162 PASS |
| Regression Suite（19 檔） | 739 / 739 PASS |
| html5validator（vnu，10 頁） | 0 errors，exit 0 |
| Existing Runtime | PASS |
| Existing Product Flow | PASS |
| Existing UI | PASS |
| Console Error | 0 |

## Smoke Test

9 個既有產品頁 Console Error = 0（jsdom BehaviorSuite 一併驗證）。本 EO 純後端骨架、無頁面 UI 串接，畫面預期無視覺變化。

## GitHub Pages

Push 至 `main`。無 UI 變化可供外部瀏覽器驗證（環境對外部網站存取受限），既有頁面內容零 differ、regression 全綠可推斷部署後行為一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Unit Test 40/40、Regression 739/739、jsdom 162/162、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0。無 OpenAI/Claude/Gemini API、無 Prompt Engineering、無 LLM/NLP/RAG/Embedding/Vector Database、無外部套件、無 fetch/XHR/localStorage。`AIEngine.js` 零修改，透過既有 `registerService()` 完成整合。

## 停止聲明

依 EO 指示，完成後**停止，不自動開始 EO-AI-006**。
