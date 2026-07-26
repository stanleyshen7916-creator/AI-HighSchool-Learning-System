# REPORT.md — EO-AI-004｜Knowledge Runtime Integration

Priority：P0 ｜ Baseline：EO-AI-003（commit `94d924a`，LOCKED）｜ 完成後停止。

## Objective

在既有 Knowledge Engine（EO-AI-003）基礎上擴充，不重建、不重新命名既有 API。完成 Material Runtime 整合（唯讀）、Metadata 欄位擴充、MetadataBuilder／MetadataValidator 補強、KnowledgeCache／KnowledgeRegistry 擴充。

## Changed Files

**修改（6 檔案，全部為擴充，無既有 API 被改名/移除）**
```
ai-engine/src/knowledge/KnowledgeLoader.js     — 新增 loadFromMaterial(id)、loadAllFromMaterialRuntime()
ai-engine/src/knowledge/Metadata.js            — FIELDS 從 9 個擴充為 16 個
ai-engine/src/knowledge/MetadataBuilder.js     — 新增 fromMaterial(material)
ai-engine/src/knowledge/MetadataValidator.js   — 新增 Required Field／Empty Value／Duplicate／Invalid Type 四類驗證
ai-engine/src/knowledge/KnowledgeCache.js      — 新增 invalidate(key)
ai-engine/src/knowledge/KnowledgeRegistry.js   — 新增 getVersion(id)（Version Management）
ai-engine/README.md                             — 補齊本次擴充的文件
```

**未變動（依 Baseline 規定，未重建）**：`KnowledgeRegistry`／`KnowledgeProvider`／`KnowledgeIndex` 既有方法簽名與行為、`KnowledgeCache` 既有 5 個方法、`js/runtime/MaterialRuntime.js`（**零修改，純唯讀存取**）。既有 Platform／Runtime／HTML／CSS／既有 JS／既有 AI Flow：**零 differ**。

## Architecture Impact

```
KnowledgeLoader.loadFromMaterial(id)
  → AHS.MaterialRuntime.getById(id)  【唯讀，只呼叫這一個既有 API】
  → MetadataBuilder.fromMaterial(material) → Metadata
  → { id, materialId, metadata, content }（frozen Knowledge Object）

KnowledgeLoader.loadAllFromMaterialRuntime()
  → AHS.MaterialRuntime.list()  【唯讀】
  → 對每筆呼叫 loadFromMaterial()
```

`AHS.MaterialRuntime` 若不存在（本層目前未掛在任何 HTML 頁面上），這兩個新方法會拋出清楚的 `ValidationError`，而不是原生 `TypeError`；`loadFromObject`／`loadFromJSON`／`normalize`（EO-AI-003）完全不受影響，沒有 MaterialRuntime 也照常運作。

## Root Cause

無（Feature EO，非 Bug Fix）。

## Impact Analysis

- `KnowledgeLoader` 新增的兩個方法**只呼叫 `MaterialRuntime.getById`／`list`**，兩者皆為既有唯讀 API；已用 spy（假 `MaterialRuntime` 物件，`add`/`remove` 呼叫計數）與**真實 `MaterialRuntime.js`（含 `PersistenceAdapter.js`）端對端整合測試**雙重驗證：載入前後 `list().length` 不變、write 方法呼叫次數為 0。
- `Metadata.FIELDS` 由 9 擴充至 16，原 9 個欄位順序與行為不變；`studyScope` 僅作為保留欄位存在（預設 `null`），沒有任何邏輯讀寫它。
- `MetadataValidator` 新增的四類檢查為**疊加**（在既有「plain object + 已知欄位」檢查之後追加），舊有呼叫方式與回傳結構（`{valid, errors}`）不變。
- `KnowledgeCache.invalidate()`／`KnowledgeRegistry.getVersion()` 皆為新增方法，未觸碰既有方法的程式碼。

## Unit Test（node vm 沙箱，58 條全數 PASS + 1 條真實 MaterialRuntime 端對端整合驗證）

涵蓋：Metadata 16 欄位（含新欄位預設 null、原欄位不受影響）、`MetadataBuilder.fromMaterial`（含非物件輸入錯誤路徑）、`MetadataValidator` 四類新檢查（必填／空值／重複 tag／型別錯誤，含合法案例與既有「未知欄位」行為不變）、`KnowledgeCache.invalidate`（含既有 5 方法仍在）、`KnowledgeRegistry.getVersion`（含遞增、未註冊拋錯、`unregister` 一併清除版本、既有 5 方法仍在）、`KnowledgeLoader` 兩個新方法（含 MaterialRuntime 不存在時的錯誤、找不到教材的錯誤、正確組出 Knowledge Object、結果凍結、唯讀不呼叫寫入方法），以及回歸 EO-AI-003（`KnowledgeIndex`／`KnowledgeProvider`／`AIEngine.knowledge` 整合）、EO-AI-002（Provider／Service／Lifecycle）、EO-AI-001（Prompt）全部行為不變。

```
Self-test (mock MaterialRuntime): PASS 58 / FAIL 0
Real MaterialRuntime.js + PersistenceAdapter.js integration: PASS（端對端組出正確 Knowledge Object，list() 筆數在讀取前後不變）
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
| Existing Product Flow（Material/Quiz/WrongBook/Review/Learning） | PASS（regression 涵蓋，功能無變化） |
| Existing UI | PASS |
| Console Error | 0 |

## Smoke Test

9 個既有產品頁 Console Error = 0（jsdom BehaviorSuite 一併驗證）。本 EO 純後端擴充、無頁面 UI 串接，畫面預期無視覺變化。

## GitHub Pages

Push 至 `main`。無 UI 變化可供外部瀏覽器驗證（環境對外部網站存取受限），既有頁面內容零 differ、regression 全綠可推斷部署後行為一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Unit Test 58/58 + 真實 MaterialRuntime 端對端驗證通過、Regression 739/739、jsdom 162/162、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0。`MaterialRuntime.js` 零修改、唯讀存取已雙重驗證。既有 Knowledge Engine（EO-AI-003）API 零重新命名、零移除。

## 停止聲明

依 EO 指示，完成後**停止，不自動開始下一個 EO**。
