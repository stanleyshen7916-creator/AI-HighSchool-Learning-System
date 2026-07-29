# ImplementationReport.md — Sprint AI-100｜AI Platform Foundation

Priority：P0 ｜ Type：Implementation Sprint（Execution only）｜ 完成後停止。

## Objective

建立 AI Gateway 的基礎架構：provider-independent 的 Gateway 設計、endpoint/model/provider 設定層、
Summary／Question／Error 三份 JSON Schema、以及 API Client 抽象層。不串接任何真實後端、不執行任何
AI 生成、不在此 repository 內實作任何伺服器程式碼。

## Scope Verification (against this Sprint's own 10 items)

| # | Scope 項目 | 對應交付物 |
|---|---|---|
| 1 | Design provider-independent AI Gateway integration | `ai-engine/src/gateway/AIGateway.js` |
| 2 | Add configuration layer for endpoint/model/provider | `ai-engine/src/gateway/GatewayConfig.js` + `GatewayConfigValidator.js` |
| 3 | Define Summary JSON schema | `ai-engine/src/schema/SummarySchema.js` |
| 4 | Define Question JSON schema | `ai-engine/src/schema/QuestionSchema.js` |
| 5 | Define Error JSON schema | `ai-engine/src/schema/ErrorSchema.js` |
| 6 | Add API client abstraction | `ai-engine/src/gateway/ApiClient.js` |
| 7 | Do not modify MVP Runtime | 零 `js/runtime/*`／`js/parser/*`／HTML 檔案異動（見下方 Changed Files） |
| 8 | Do not integrate AI generation yet | `AIGateway.request()`／`summarize()`／`generateQuestions()` 恆拋錯，從未真正呼叫任何後端 |
| 9 | No frontend API keys | `GatewayConfig` 結構上不存在 apiKey 欄位；`GatewayConfigValidator` 明確拒絕任何 apiKey/secret/token 欄位（可測試保證，見 QA） |
| 10 | Prepare deployment-ready integration points | `AIGateway.validateResponse()`／`getSchema()` 今日即可完整使用，零後端依賴 |

## Changed Files

**新增（8 個檔案，`ai-engine/src/gateway/` 與 `ai-engine/src/schema/` — 全新資料夾）**
```
ai-engine/src/gateway/GatewayConfig.js
ai-engine/src/gateway/GatewayConfigValidator.js
ai-engine/src/gateway/ApiClient.js
ai-engine/src/gateway/AIGateway.js
ai-engine/src/schema/SummarySchema.js
ai-engine/src/schema/QuestionSchema.js
ai-engine/src/schema/ErrorSchema.js
ai-engine/src/schema/SchemaValidator.js
```

**新增（1 個檔案，permanent regression test）**
```
tests/regression/AIGatewayFoundationV1.js   — 50 條斷言
```

**修改（3 個檔案，文件與 QA 交付物）**
```
ai-engine/README.md                                — 補上 gateway/schema 兩個新資料夾的文件
docs/migration/Sprint_AI_100_ImplementationReport.md  — 本檔案
docs/QA/Sprint_AI_100_QAReport.md                       — QA 摘要
```

**未修改（依 Scope/Constraints 明確要求，`git diff` 逐一確認為空）**
```
任何 js/runtime/*.js                          （Scope item 7：Do not modify MVP Runtime）
任何 js/parser/*.js
任何 HTML 頁面的 <script> 順序
ai-engine/src/providers/*.js                （Provider Layer——沿用既有 BaseProvider 風格，未修改本身）
ai-engine/src/services/summary/*.js         （Summary Production Pipeline，Sprint AI-101 已確立不可重建）
ai-engine/src/services/question/*.js        （Sprint AI-101 交付物）
ai-engine/src/runtime/Summary*.js／Question*.js
ai-engine/src/service/Summary*.js／Question*.js
js/runtime/QuestionGenerationRuntime.js     （LOCK，production 問題產生器）
ai-engine/src/core/AIEngine.js／common/Constants.js  （零修改——Gateway 不需要 AIEngine 整合）
```

## Architecture Impact

```
AIGateway（provider-independent 入口，Sprint AI-100 全新）
  .configure(values)      → GatewayConfigValidator.validateOrThrow() → 建立新 GatewayConfig
  .setClient(client)       → 要求為 AHS.AIEngine.ApiClient 實例
  .isConfigured()           → config.isComplete() && client !== null（本 Sprint 恆為 false）
  .getSchema(operation)      → 回傳 SummarySchema／QuestionSchema／ErrorSchema 的真實參照
  .validateResponse(op, data) → SchemaValidator.validate(schema, data)（今日即可用，零後端）
  .request(operation, payload)
    → 未 isConfigured() 時：拋出 ServiceError「not configured」，從不捏造回應（Scope item 8）
    → 已 isConfigured()（本 Sprint 從未發生）：委派至 client.send({operation, payload, config})
  .summarize(payload)       = request("summary", payload)
  .generateQuestions(payload) = request("question", payload)
```

### 為何未修改 `ai-engine/src/core/AIEngine.js`／`common/Constants.js`

`AIGateway` 是一個獨立、可直接 `new` 的類別（如同 `ProviderManager`／`BaseProvider` 本身也是獨立
類別，並非透過 `AIEngine.registerService()` 註冊的 Service）——它不是 `AIService` 的子類別，因為
Gateway 本身不代表單一「服務」，而是所有服務未來可能共用的傳輸層抽象。因此無需修改 `AIEngine.js`
或新增任何 `SERVICE_IDS`／`PROVIDER_IDS` 常數，零既有檔案異動。

### 為何 `GatewayConfig` 沒有 apiKey 欄位（No frontend API keys 的具體實作）

`GatewayConfig`／`GatewayConfigValidator` 的欄位清單（`FIELDS`）只有三項：`provider`／`endpoint`／
`model`。這不只是「約定不填」，而是結構性保證——建構子只讀取 `FIELDS` 內的欄位，任何 `apiKey`
之類的值傳入建構子會被靜默忽略（從未成為任何屬性）；`GatewayConfigValidator.validate()` 更進一步，
若輸入物件含有任何 `FIELDS` 之外的欄位（包含 apiKey/secret/token）一律驗證失敗。真實金鑰預期只存在
於未來某個「不在本 repository 內」的後端，前端（本 repository）在設計上永遠無法保存或傳遞它。

### 為何 `AIGateway` 預設恆為未接線（isConfigured() 恆 false）

Scope item 8 明確要求「Do not integrate AI generation yet」。本 Sprint 的所有程式碼與測試中，
`AIGateway` 從未被呼叫 `setClient()` 搭配任何真實的、可連網的 `ApiClient` 子類別（唯一使用具體子
類別的地方是 QA 測試中用來證明佈線正確的 `StubClient`——純記憶體回傳，證明「介面能正確委派」而非
「後端能真的被呼叫」，測試本身也明確標註為「測試專用，非正式產物」）。因此 `request()`／
`summarize()`／`generateQuestions()` 在本 Sprint 交付的狀態下，呼叫必定拋出誠實的「not configured」
錯誤，絕不會產生任何捏造的回應內容。

## Root Cause

無（Feature Sprint，非 Bug Fix）。

## Impact Analysis

新增內容全部落在兩個全新的資料夾（`ai-engine/src/gateway/`／`ai-engine/src/schema/`），未修改任何
既有檔案的邏輯（唯一修改是 `ai-engine/README.md` 文件）。已用原始碼掃描（`tests/regression/
AIGatewayFoundationV1.js` 內建）確認新增 8 個檔案內沒有 `fetch`／`XMLHttpRequest`／`localStorage`／
`indexedDB`／`OpenAI`／`Anthropic`／WebSocket／硬編碼金鑰字樣。零 HTML 頁面被修改，零 Runtime 檔案
被修改。`SummarySchema`／`QuestionSchema` 的欄位清單已用測試驗證與真實 `SummaryBuilder.FIELDS`／
`QuestionBuilder.FIELDS` 逐字相符；`QuestionSchema` 的題目子綱要已用測試驗證與真實
`AHS.QuestionGenerationRuntime`（LOCK production）輸出逐項相容，而非憑空發明的形狀。

## Unit Test（`tests/regression/AIGatewayFoundationV1.js`，node vm 沙箱，50 條全數 PASS）

涵蓋：`GatewayConfig`／`GatewayConfigValidator`（無 apiKey 欄位的結構性與驗證性雙重保證）、
`ApiClient`（純介面、零網路能力驗證）、三份 Schema（frozen、欄位與既有真實 Model 完全對齊）、
`SchemaValidator`（對真實 SummaryBuilder／QuestionBuilder 輸出驗證、對真實 LOCK
QuestionGenerationRuntime 逐題驗證、minItems／enum 規則驗證）、原始碼靜態掃描（零 LLM／網路／
持久化／硬編碼金鑰）、`AIGateway`（provider-independent、預設永遠未接線、`validateResponse()`
零後端可用、`request()`／`summarize()`／`generateQuestions()` 誠實拋錯、透過測試專用 StubClient
證明佈線正確），並回歸既有 `AHS.QuestionGenerationRuntime`／`AHS.AIEngine.MetadataValidator`
行為不變。

```
PASS: 50   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| `npm test`（BehaviorSuite + PipelineRegression） | 181/181 PASS |
| `npm run verify`（VerifyPaths + VerifyForbiddenPatterns） | PASS（1 pre-existing KNOWN-ISSUE，無關） |
| 全部 23 個 permanent regression 檔案 | 916/916 PASS（含新增的 AIGatewayFoundationV1.js 50 條與 Sprint AI-101 的 AIEngineQuestionV1.js 77 條） |
| **Grand Total** | **1097/1097 real assertions PASS**（175 BehaviorSuite + 6 PipelineRegression + 916 regression 檔案，PipelineRegression 不重複計算） |
| Console Error | 0 |

## Smoke Test

零 HTML 頁面被修改，零既有頁面行為變化——本 Sprint 純後端骨架，與 Sprint AI-101／EO-AI-005 當初的
性質相同。既有 9 個產品頁 Console Error = 0（jsdom BehaviorSuite 已驗證）。

## QA Summary

Unit Test 50/50、Regression 1097/1097、npm run verify PASS，Console Error = 0。無 OpenAI/Claude/
Gemini API、無真實 LLM 整合、無 fetch/XHR/localStorage/indexedDB/WebSocket、無新增網路 I/O、無前端
API 金鑰（結構性與驗證性雙重保證）。MVP Runtime／既有 Provider Layer／既有 Summary／Question
Production Pipeline／任何 HTML 頁面：零修改。本 repository 內未新增任何伺服器程式碼。

## 停止聲明

依 Sprint 指示，Execution only。完成後停止，等待 PMO 確認並授權後續 Commit/Push（本 Sprint 本身
未執行任何 git 操作）。
