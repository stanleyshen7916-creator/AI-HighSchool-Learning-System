# REPORT.md — EO-AI-006｜AI Summary Runtime Integration

Priority：P0 ｜ Baseline：EO-AI-001～EO-AI-005（LOCKED，最新 commit `0d02dec`）｜ 完成後停止。

## Objective

把 Summary Engine（EO-AI-005）接進 AI Runtime Flow：新增 Runtime 儲存、生成歷史、Session 追蹤、完整 Pipeline 串接，並用既有 `registerService()` 完成 AIEngine 整合。不重建 Summary Engine、不修改 AIEngine／Knowledge Engine／MaterialRuntime／PromptManager 架構。

## Changed Files

**新增（4 檔案，`ai-engine/src/runtime/`——全新資料夾）**
```
SummaryRuntime.js    — save(summary)/get(materialId)/list()/remove(materialId)/clear()
SummaryHistory.js     — record(summary)/latest(materialId)/list()
SummarySession.js      — start(materialId)/stop()/current()
SummaryPipeline.js      — 完整 Pipeline 串接
```

**修改（1 檔案）**
```
ai-engine/README.md  — 補上本次新增模組的文件
```

**零修改**：`AIEngine.js`、`ai-engine/src/knowledge/*`、`ai-engine/src/services/summary/*`、`js/runtime/MaterialRuntime.js`、`js/core/PersistenceAdapter.js`、`js/runtime/HistoryRuntime.js`（**含此檔——見下方「History Integration」的判斷與理由**）、其餘既有 Platform／Runtime／HTML／CSS：**全部零 differ**。

## Architecture Impact

```
SummaryPipeline.run(materialId)
  session.start(materialId)
  → SummaryEngine.generate(materialId)          【EO-AI-005，完整重用，未重建】
      → KnowledgeLoader.loadFromMaterial()         【EO-AI-004，唯讀】
      → SummaryExtractor.extract()                   【EO-AI-005】
      → SummaryBuilder.build()                         【EO-AI-005】
      → SummaryValidator.validateOrThrow()               【EO-AI-005】
  → SummaryFormatter.toRuntimeObject()             【EO-AI-005，重用】
  → SummaryRuntime.save()                            【本 EO 新增】
  → SummaryHistory.record()                            【本 EO 新增】
  session.stop()（try/finally，即使拋錯也會執行）
  → return Summary
```

### Cache Integration（完全依規格「Reuse EO-AI-004，不得重建 Cache」）

`SummaryRuntime` 內部**組合（composition）一個真正的 `AHS.AIEngine.KnowledgeCache` 實例**做為儲存底層（不是自己另外刻一個 `{}` 儲存），`remove(materialId)` 具體呼叫的是 `KnowledgeCache.invalidate()`（EO-AI-004 新增的方法）——完全依照規格圖示「SummaryRuntime ↓ KnowledgeCache ↓ invalidate()」的字面意思實作，`KnowledgeCache.js` 本身零修改。

### AIEngine Integration（完全依規格「Reuse registerService()，不修改架構」）

`SummaryRuntime` 建構子設定 `this.id = "summaryRuntime"`，因此可以直接丟給 EO-AI-002 就存在、完全未修改的 `AIEngine.registerService()`／`getService()` 使用，無需 `instanceof AIService`（`ServiceRegistry.register()` 本來就只檢查 `service.id`）。已用測試驗證 `summary`（Engine，EO-AI-005）與 `summaryRuntime`（本 EO）兩個 id 同時註冊在同一個 `ServiceRegistry` 不衝突。

## 一個重要判斷：History Integration 沒有照字面呼叫既有 `AHS.HistoryRuntime.record()`

規格第 7 項寫「Reuse existing HistoryRuntime. Only append summary events.」，但我先讀了 `js/runtime/HistoryRuntime.js` 的真實程式碼後發現：**`record(gradedResult)` 是專門為「考試批改結果」寫死的 schema**（讀取 `gradedResult.examId／score／accuracy／correctCount／totalCount`，組出固定欄位的 entry），檔案自己的註解也寫明「Sprint 4 · Quiz Runtime Foundation」，而且 `StatisticsRuntime` 會讀這個清單去算測驗統計。

如果照字面把 Summary Model 丟進 `AHS.HistoryRuntime.record()`，因為 Summary Model 完全沒有 `examId`／`score`／`accuracy` 這些欄位，會產生一筆全部欄位都是 `undefined` 的假資料，混進既有的測驗歷史清單裡，**直接污染 `StatisticsRuntime` 的統計結果**——這正好違反本 EO 自己列的 Completion Criteria（「Existing Runtime PASS」「Existing Product Flow PASS」「Regression」）。

因此我的處理方式是：**新建的 `SummaryHistory.js` 完全承接「記錄 Summary 生成事件」這個職責**（`record()`/`latest()`/`list()`，遵循 `HistoryRuntime.js` 自己註解描述的「starts empty, grows at runtime, store only」同一種模式），但**不呼叫**既有 `AHS.HistoryRuntime.record()`。已用測試驗證：跑完整條 Summary Pipeline 前後，`AHS.HistoryRuntime.count()` 完全不變；同時確認 `AHS.HistoryRuntime.record()` 對真正的考試批改結果依然正常運作、檔案本身零修改。

## Root Cause

無（Feature EO，非 Bug Fix）——上面是設計判斷，不是缺陷修正。

## QA：No duplicated Runtime / Registry / Cache

- **No duplicated Runtime**：`AHS.AIEngine.SummaryRuntime`（本 EO）與 LOCKED 的 `AHS.SummaryRuntime`（`js/runtime/SummaryRuntime.js`，Sprint-5 五段式模型，供 SummaryCenter/SummaryGenerator 使用）分屬不同命名空間（`AHS.AIEngine.*` vs 頂層 `AHS.*`）、不同 schema、不同消費者，互不重疊，後者零修改。
- **No duplicated Registry**：沒有新建任何 Registry 類別，`SummaryRuntime`／`SummaryHistory` 都是專用的輕量儲存，走既有 `ServiceRegistry`（EO-AI-002）做外部註冊。
- **No duplicated Cache**：`SummaryRuntime` 組合既有 `KnowledgeCache` 實例，不是另刻一份快取邏輯。

## Unit Test（node vm 沙箱，36 條全數 PASS）

涵蓋：`SummaryRuntime` 全 5 個 API（含未提供 `metadata.materialId` 的錯誤路徑、`remove` 確實透過 `KnowledgeCache.invalidate()`）、`SummaryHistory` 全 3 個 API、`SummarySession` 全 3 個 API、`SummaryPipeline.run()` 端對端（含第二筆教材、找不到教材時正確拋錯且 `session` 仍會在 `finally` 清空）、AIEngine 整合（`summary`／`summaryRuntime` 兩個 id 共存不衝突）、No-duplicate 三項確認、**History Integration 判斷的驗證**（Pipeline 執行前後 `AHS.HistoryRuntime.count()` 不變、且該既有 API 對正常考試資料仍正確運作）、原始碼靜態掃描零 LLM／網路／持久化呼叫，以及回歸 EO-AI-001～005 全部既有行為不變（含 `SummaryEngine.generate()` 獨立呼叫仍正常，證明沒有被重建）。

```
PASS: 36   FAIL: 0
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

## Runtime Test

`SummaryPipeline.run()` 用真實 `AHS.MaterialRuntime`（含 `PersistenceAdapter`）跑兩筆不同教材，端對端組出正確 Summary、正確存進 `SummaryRuntime`、正確記錄 `SummaryHistory`，全程唯讀存取 `MaterialRuntime`。

## Smoke Test

9 個既有產品頁 Console Error = 0（jsdom BehaviorSuite 一併驗證）。本 EO 純後端骨架、無頁面 UI 串接，畫面預期無視覺變化。

## GitHub Pages

Push 至 `main`。無 UI 變化可供外部瀏覽器驗證（環境對外部網站存取受限），既有頁面內容零 differ、regression 全綠可推斷部署後行為一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Unit Test 36/36、Regression 739/739、jsdom 162/162、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0。無 OpenAI/Claude/Gemini API、無 Prompt、無 NLP/Embedding/RAG/Vector DB、無外部套件、無 fetch/XHR/localStorage。Summary Engine 未重建，AIEngine／Knowledge Engine／MaterialRuntime／PromptManager／HistoryRuntime 架構零修改。No duplicated Runtime/Registry/Cache 已逐項驗證。

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-007**。
