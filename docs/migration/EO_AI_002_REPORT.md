# REPORT.md — EO-AI-002｜AI Core Foundation

Mode：Feature EO ｜ Priority：P0 ｜ Phase：AI Engine Core ｜ 完成後停止。

## Objective

完成 AI Engine Core Foundation：Provider Framework、Service Registry、Context Framework、Dependency Injection、Lifecycle、Common Framework、統一 Error Framework。全部僅建立基礎架構，不串接 OpenAI、不撰寫 Prompt、不建立 Knowledge/Summary/Question/Review/Tutor 邏輯。

## Changed Files

**新增（8 檔案）**
```
ai-engine/src/common/Utilities.js
ai-engine/src/context/ContextManager.js
ai-engine/src/context/ContextBuilder.js
ai-engine/src/context/ContextValidator.js
ai-engine/src/core/ServiceRegistry.js
ai-engine/src/providers/ProviderRegistry.js
ai-engine/src/providers/ProviderFactory.js
ai-engine/src/providers/ProviderManager.js
```

**修改（4 檔案）**
```
ai-engine/src/common/Errors.js   — 擴充 Error Framework（見下）
ai-engine/src/core/AIEngine.js   — 組裝 ProviderManager/ServiceRegistry/ContextManager + Lifecycle
ai-engine/src/core/AIService.js  — 建構子新增 Dependency Injection（provider/context）
ai-engine/README.md              — 補齊 EO-AI-001（prompt/）與本 EO 全部新模組的文件（先前兩次 EO 都漏了）
```

**既有 Platform／Runtime／HTML／CSS／既有 JS／既有 AI Flow（AITutorRuntime 等）：零 differ。**

## Architecture Impact

```
AIEngine（core/AIEngine.js）
  ├─ providers → ProviderManager → ProviderRegistry ＋ ProviderFactory
  ├─ services  → ServiceRegistry
  └─ contexts  → ContextManager
```

`AIEngine.registerProvider/getProvider/registerService/getService` 這四個 EO-MIG-002 就存在的方法**外部行為完全不變**（同樣的錯誤型別、同樣的訊息），內部改為委派給上面三個新框架，不再是裸 `{}`。

`AIService` 建構子新增第二參數 `{ provider, context }`：完成 `AIEngine → Provider → Service → Context` 的 Dependency Injection 鏈——具體服務（未來 EO）透過建構子注入依賴，而不是自己去抓全域物件；本身仍是純 Interface，`run()` 未實作。

### Error Framework（統一）
```
AIEngineError
  ProviderError    -> ProviderNotRegisteredError（原本直接繼承 AIEngineError，name/message 不變）
  ServiceError      -> ServiceNotImplementedError（原本直接繼承 AIEngineError，name/message 不變）
  ContextError
  RegistryError
  ValidationError
```

## Root Cause

無（Feature EO，非 Bug Fix）。

## Impact Analysis

- `ai-engine/src/common/Errors.js` 的變動屬於**擴充繼承鏈**，不改變任何既有 class 的 `name`／`message`／建構子簽名，`instanceof AIEngineError` 全部維持成立——EO-MIG-002、EO-AI-001 的自我驗證（selftest）重新跑過一次全數通過，見下。
- `AIEngine.js`／`AIService.js` 修改前後對外 API 簽名一致（`AIService` 新增的第二參數為可選）。
- `ai-engine/src/services/*`（7 個空槽）、`ai-engine/src/prompt/*`、既有 Platform 全部未觸碰。

## Unit Test（node vm 沙箱，66 條全數 PASS）

涵蓋：Error Framework 繼承鏈與相容性、`Utilities`、`ProviderRegistry`（含 default provider）、`ProviderFactory`（含建構子註冊/實例化/未知 id 錯誤）、`ProviderManager` facade、`ServiceRegistry`、`AIService` Dependency Injection、`ContextManager`（5 個保留型別）、`ContextBuilder`（含 frozen 結果）、`ContextValidator`（`validate`／`validateOrThrow`）、`AIEngine` Lifecycle（`initialize`/`dispose`/`reset`/`version`）與組合後的 Provider/Service/Context 端對端行為，以及回歸驗證 EO-MIG-002／EO-AI-001 既有模組（`PromptRegistry`／`PromptManager`／`PromptTemplate`／`PromptContext`）在 Errors.js 重構後**行為不變**。

```
PASS: 66   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite | 162 / 162 PASS |
| Regression Suite（19 檔） | 739 / 739 PASS |
| html5validator（vnu，10 頁） | 0 errors，exit 0 |
| Existing Runtime | PASS |
| Existing Platform | PASS |
| Console Error | 0 |

## Smoke Test

9 個既有產品頁（`index.html`／`materials.html`／`quiz.html`／`wrongbook.html`／`summary.html`／`learning.html`／`tutor.html`／`dashboard.html`／`review.html`）Console Error = 0（隨 jsdom BehaviorSuite 一併驗證）。本 EO 純後端骨架、無任何頁面 UI 串接，畫面預期無視覺變化。

## GitHub Pages

Pages 從 `main` 部署；本次直接 push 至 `main`（依既有慣例，無 PR）。無 UI 變化可供外部瀏覽器 smoke test（本環境對外部網站存取受限，無法直接截圖驗證，但既有頁面內容零 differ、regression 全綠，可推斷部署後行為與前一版一致）。

## Commit

```
EO-AI-002
AI Core Foundation
```

## QA Summary

Unit Test 66/66、Regression 739/739、jsdom 162/162、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0，既有 Platform／Runtime／AI Flow 零 differ。

## 停止聲明

依 EO 指示，完成後**停止，不自行開始 EO-AI-003**。
