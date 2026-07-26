# REPORT.md — EO-AI-009｜AI Summary Content Extraction Foundation

Priority：P0 ｜ Baseline：EO-AI-001～EO-AI-008（LOCKED）｜ 完成後停止。

## Objective

補齊 `SummaryPipeline` 的內容擷取能力，使其產出與 Legacy `KnowledgeSummaryRuntime`／`MaterialSummaryCard` 相容的 `summary.{coreConcepts, keywords, definitions, formulas, importantPoints}` 資料。不進行 AI 生成、不修改 UI、不進行 Migration。

## Changed Files

**新增（1 檔案，`ai-engine/src/parser/`——全新資料夾）**
```
SummaryContentExtractor.js  — 規則式（regex，非 LLM）逐行分類，抽取 5 類內容
```

**修改（1 檔案，僅新增一個處理步驟）**
```
ai-engine/src/runtime/SummaryPipeline.js  — 新增呼叫 SummaryContentExtractor，
                                             把結果附加到輸出的 .summary 屬性
```

**修改（1 檔案）**
```
ai-engine/README.md  — 補上本次新增模組的文件
```

**零修改（逐一以 `git diff --stat` 比對確認）**
```
ai-engine/src/services/summary/SummaryEngine.js    — 確認未變（不得修改 SummaryEngine 架構）
ai-engine/src/services/summary/SummaryBuilder.js   — 確認未變
ai-engine/src/core/AIEngine.js                      — 確認未變
js/ui/MaterialPreview.js                             — 確認未變
js/ui/MaterialSummaryCard.js                         — 確認未變
js/runtime/AITutorService.js                         — 確認未變
js/runtime/KnowledgeSummaryRuntime.js                — 確認未變
```

## Extraction Rules（規則式，非 LLM，逐字取自原文）

逐行（`\n` 分割）判斷，每行只落入一類：

| 判斷順序 | 規則 | 分類 | confidence |
|---|---|---|---|
| 1 | 含「=／＝」且後方有數字，或含 `²³√±×÷∑∫≤≥≈` 等數學符號 | `formulas` | 0.9 |
| 2 | 符合「詞：說明」／「詞是說明」／「詞為說明」／「詞定義為說明」樣式 | `definitions` | 0.85 |
| 3 | 以句號／驚嘆號／問號結尾且長度 ≥ 12 字 | `importantPoints` | 0.7 |
| 4 | 長度 ≤ 6 字 | `keywords` | 0.6 |
| 5（其餘） | 其他非空行 | `coreConcepts` | 0.6 |

每個項目 `{ text, confidence, sourceRange: { lineStart, lineEnd } }`：`text` 100% 逐字取自原文（未改寫、未生成任何新文字）；`confidence` 是固定規則分數（非模型輸出）；`sourceRange` 是真實的 0-based 行號（比 Legacy 更精確——Legacy 因為源頭是知識圖譜節點、本來就誠實承認 `lineStart`/`lineEnd` 常常是 `null`，這裡因為直接讀原始文字，可以給出真實行號）。

## SummaryPipeline Integration

```
SummaryPipeline.run(materialId)
  → SummaryEngine.generate(materialId)        【EO-AI-005，完全未重建】
  → SummaryFormatter.toRuntimeObject()          【EO-AI-005，完全未重建】
  → KnowledgeLoader.loadFromMaterial()             【EO-AI-004，唯讀，重用】取得教材原文
  → SummaryContentExtractor.extract(content)         【本 EO 新增】
  → formatted.summary = { coreConcepts, keywords, definitions, formulas, importantPoints }
  → SummaryRuntime.save(formatted)                     【EO-AI-006，介面完全未變】
  → SummaryHistory.record(formatted)                     【EO-AI-006，介面完全未變】
```

輸出物件同時保有 EO-AI-005 原本的 12 個扁平欄位（`title/subject/grade/chapter/section/keywords/concepts/definitions/formulas/examples/difficulty/metadata`，全數未改名未移除）**以及**新增的巢狀 `.summary`（5 個與 Legacy 完全同名的欄位）——是純新增，不是取代或改名既有欄位。

## Compatibility 驗證（QA 清單第 4 項：MaterialSummaryCard 可直接使用）

直接複製 `js/ui/MaterialSummaryCard.js` 自己的 `hasSummaryContent()` 判斷邏輯（逐字比對過確認一致）拿新輸出去測：**回傳 `true`**——代表如果未來把 `MaterialSummaryCard` 接到這個新輸出，畫面上真的會顯示卡片，不會是空狀態。這是本 EO 存在的意義：補齊 EO-AI-008 當時發現「新管線產不出真實內容」的缺口。

**本 EO 沒有把 `MaterialSummaryCard` 接上去**——`MaterialSummaryCard.js` 逐位元組確認未變，依規格「不得進行 Migration」。

## Root Cause

無（Feature EO，非 Bug Fix）。

## Impact Analysis

新增內容為全新檔案（`ai-engine/src/parser/`）加上 `SummaryPipeline.js` 的一個新增步驟（呼叫新檔案、把結果附加到輸出物件的新屬性），未修改 `SummaryEngine`/`SummaryBuilder` 等既有邏輯、未修改 `SummaryRuntime` 對外介面（`save/get/list/remove/clear` 簽名與行為不變，只是存進去的物件多了一個 `.summary` 屬性）、未觸碰任何既有 UI 或 Legacy Runtime 檔案。

## Unit Test（node vm 沙箱，26 條全數 PASS）

涵蓋：`SummaryContentExtractor` 五類規則分類（含真實測試教材逐行驗證）、每個項目的 `text`/`confidence`/`sourceRange` 正確性、非字串輸入的錯誤路徑、`frozen` 結果、`SummaryPipeline.run()` 端對端（`.summary` 五欄位齊全且有真實內容、既有 12 扁平欄位不變、`SummaryRuntime` 介面不變）、**用 MaterialSummaryCard 真實 `hasSummaryContent()` 邏輯驗證相容性回傳 `true`**、原始碼掃描零 LLM/網路呼叫，以及 7 個禁止修改檔案逐一 `git diff --stat` 確認零 differ，並回歸 EO-AI-005～008 既有行為不變。

```
PASS: 26   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS（無 fetch/XHR/localStorage） |
| jsdom BehaviorSuite | 162 / 162 PASS |
| Regression Suite（19 檔） | 739 / 739 PASS |
| html5validator（vnu，10 頁） | 0 errors，exit 0 |
| Console Error | 0 |

## Smoke Test

9 個既有產品頁 Console Error = 0。`MaterialSummaryCard`／`MaterialPreview` 畫面與行為完全無變化（未被接線）。

## GitHub Pages

Push 至 `main`。無 UI 變化，既有頁面內容零 differ、regression 全綠可推斷部署後行為與前一版一致。

## Commit ID

（見下方 push 結果）

## QA Summary

Unit Test 26/26、Regression 739/739、jsdom 162/162、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0。無 LLM、無外部套件、無 fetch/XHR/localStorage。`SummaryEngine`／既有 UI／Legacy Runtime 全數確認零修改。`SummaryPipeline` 輸出現在具備與 `MaterialSummaryCard` 相容的真實內容（已驗證，未接線）。

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-010**。
