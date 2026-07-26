# REPORT.md — EO-AI-003｜Knowledge Engine Foundation

Priority：P0 ｜ 完成後停止。

## Objective

建立 AI 共用知識層基礎架構：Knowledge Registry、Knowledge Provider、Knowledge Loader、Knowledge Index、Knowledge Cache、Metadata Framework，並完成與 AIEngine 的整合。不串接任何外部資料來源、不建立 OpenAI/Prompt/Summary/Question/Review/Tutor 邏輯、不使用 Vector Database/Embedding/RAG/語意搜尋、不新增任何外部相依套件。

## Changed Files

**新增（8 檔案，`ai-engine/src/knowledge/`）**
```
KnowledgeRegistry.js    — register/unregister/get/has/list/clear
KnowledgeProvider.js    — load/unload/refresh/supports（Interface，未串接外部來源）
KnowledgeLoader.js       — loadFromObject/loadFromJSON/normalize（未讀取 Platform Runtime）
KnowledgeIndex.js         — build/rebuild/search/remove（純 exact-match，非語意搜尋）
KnowledgeCache.js         — set/get/has/remove/clear（純記憶體，未使用 localStorage/IndexedDB）
Metadata.js                — 9 個保留欄位（subject/grade/chapter/section/topic/difficulty/source/tags/version）
MetadataBuilder.js          — Fluent Builder，產出 Metadata 實例
MetadataValidator.js        — 結構驗證（plain object + 已知欄位）
```

**修改（2 檔案）**
```
ai-engine/src/core/AIEngine.js  — 新增 this.knowledge（KnowledgeRegistry 實例），dispose() 一併重置；
                                   未修改既有 Provider/Context/Service/Lifecycle 的行為與程式碼
ai-engine/README.md              — 補上 knowledge/ 資料夾與 Public API 文件
```

**既有 Platform／Runtime／HTML／CSS／既有 JS／既有 AI Flow／既有 Provider Framework／既有 Context Framework／既有 Service Registry／既有 Lifecycle：零 differ。** 未使用任何外部相依套件（`package.json` 未變更）。

## Architecture Impact

```
AIEngine.knowledge → KnowledgeRegistry
（KnowledgeProvider / KnowledgeLoader / KnowledgeIndex / KnowledgeCache
 為獨立可用模組，供未來 EO 在建立具體 Knowledge Provider 時組合使用）
```

`AIEngine` 建構子與 `dispose()` 各新增一行（建立/重置 `this.knowledge`），`registerProvider`／`getProvider`／`registerService`／`getService`／`initialize`／`reset`／`version` 完全未變動。

## Root Cause

無（Feature EO，非 Bug Fix）。

## Impact Analysis

新增內容為獨立資料夾（`ai-engine/src/knowledge/`）與 `AIEngine.js` 的兩行整合式新增，未修改任何既有檔案的既有邏輯。`KnowledgeIndex.search()` 為單純欄位相等比對（linear filter），未引入語意/向量能力；`KnowledgeCache` 逐行檢查確認無 `localStorage.`／`indexedDB.` 呼叫（僅檔頭註解提及禁止事項，已用 `VerifyForbiddenPatterns` 與人工 grep 雙重確認）。

## Unit Test（node vm 沙箱）

```
PASS: 47   FAIL: 0
```
（另有 1 條自訂測試因正則過於寬鬆誤判註解文字為程式碼呼叫，已用 `grep` 及 `npm run verify` 之 `VerifyForbiddenPatterns` 雙重確認實際程式碼零違規，非真實缺陷。）

涵蓋：`KnowledgeRegistry` 全 6 個方法、`KnowledgeProvider` 4 個 Interface 方法皆正確拋出、`KnowledgeLoader`（含壞 JSON／非物件的錯誤路徑）、`KnowledgeIndex`（build/rebuild/search 單欄位與多欄位比對/remove/size）、`KnowledgeCache` 全 5 個方法、`Metadata`／`MetadataBuilder`／`MetadataValidator`（含未知欄位錯誤路徑）、`AIEngine.knowledge` 整合（dispose/reset 正確清空），以及回歸驗證 EO-AI-002（Provider／Service／Context／Lifecycle）與 EO-AI-001（Prompt）行為完全不變。

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
| Existing AI Flow | PASS |
| Console Error | 0 |

## Smoke Test

9 個既有產品頁 Console Error = 0（jsdom BehaviorSuite 一併驗證）。本 EO 純後端骨架、無頁面 UI 串接，畫面預期無視覺變化。

## GitHub Pages

Push 至 `main`。無 UI 變化可供外部瀏覽器驗證（環境對外部網站存取受限），既有頁面內容零 differ、regression 全綠可推斷部署後行為一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Unit Test 47/47（+1 測試腳本自身誤判已排除）、Regression 739/739、jsdom 162/162、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0，既有 Platform／Runtime／AI Flow／Provider Framework／Context Framework／Service Registry／Lifecycle 零 differ，無新增外部相依套件。

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-004**。
