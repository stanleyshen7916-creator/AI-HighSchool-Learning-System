# REPORT.md — EO-AI-007｜AI Summary UI Integration

Priority：P0 ｜ Baseline：EO-AI-001～EO-AI-006（LOCKED，最新 commit `3dae703`）｜ 完成後停止。

## Objective（依 PMO 修正指示執行）

原始 EO-AI-007 要求把 AI Summary Runtime 接進 Material Detail 的可見 UI（Loading/Empty/建立按鈕）。執行前發現 Material Detail **已存在正式、可運作的 AI 重點整理功能**（`MaterialPreview` → `MaterialSummaryCard` → `AITutorService` → `KnowledgeSummaryRuntime`），已回報並暫停等待確認。PMO 隨後發出修正指示（LOCK）：**本次僅建立 Service/Adapter 兩個純邏輯檔案，不接入任何可見 UI、不建按鈕、不建 Loading/Empty State、不建立第二個入口**——這份 REPORT 依修正後範圍執行與驗收。

## Changed Files

**新增（2 檔案，依 Deliverables 字面範圍）**
```
ai-engine/src/service/SummaryService.js   — generate(materialId)/generateFromMaterial(material)/get(materialId)
js/ai/SummaryAdapter.js                    — Material → SummaryService → SummaryPipeline → SummaryRuntime（供未來使用）
```

**修改（1 檔案）**
```
ai-engine/README.md  — 補上本次新增模組的文件，並註記與既有 UI Baseline 的關係
```

**零修改（依 PMO 修正指示逐一確認）**
```
js/ui/MaterialPreview.js       — 逐位元組比對確認未變
js/ui/MaterialSummaryCard.js   — 逐位元組比對確認未變
js/runtime/AITutorService.js   — 未讀取、未引用
js/runtime/KnowledgeSummaryRuntime.js — 未讀取、未引用
ai-engine/src/runtime/*、ai-engine/src/services/summary/*、AIEngine.js — 零修改
```

## Architecture Impact

```
（未來使用，本 EO 不接畫面）
Material
  → AHS.SummaryAdapter.generate(materialId)      【js/ai/，Platform 端，無 DOM】
  → AHS.AIEngine.SummaryService.generate(materialId)  【ai-engine/src/service/，無 DOM】
  → SummaryPipeline.run(materialId)                【EO-AI-006，完整重用】
  → SummaryRuntime（Service 內部持有單一實例，頁面生命週期內共用同一份快取）
```

`SummaryService` 是 singleton（跟 Platform 其餘 `AHS.*` runtime 一樣的寫法，不用 `new`），內部只建立**一個** `SummaryRuntime` + 一個 `SummaryPipeline`，確保同一頁面內重複呼叫 `generate()`/`get()` 會共用同一份快取狀態（Cache Verify 精神），但這是既有 `SummaryPipeline`/`SummaryRuntime`（EO-AI-006）本來就有的行為，這裡沒有新增任何快取邏輯。

`SummaryAdapter` 只呼叫 `AHS.AIEngine.SummaryService` 三個方法，**沒有引用** `SummaryRuntime`／`SummaryPipeline`，符合「Adapter 不得直接操作 SummaryRuntime」規則（已用原始碼靜態掃描驗證程式碼本體，排除註解文字誤判後確認）。

## Root Cause（原始 EO 與現況的落差）

原始 EO-AI-007 的作者顯然不知道 Material Detail 已經有一套運作中的 AI 重點整理（Sprint 8.3 · EO-S8.3.004，串接 `AITutorService`/`KnowledgeSummaryRuntime`，會產生真正有內容的摘要）。若照原始指示把新的 `ai-engine` Pipeline（EO-AI-005 設計上刻意不做 AI 生成，`concepts/definitions/formulas/examples` 永遠是空陣列）接成第二個可見「AI 重點整理」區塊，會造成：
1. 同一個教材預覽畫面出現兩個功能相同但內容不同的區塊；
2. 新的那個因為底層還是誠實 stub，會一直顯示空狀態，跟舊的「按下去真的有內容」矛盾。

回報後 PMO 確認並發出 LOCK 修正指示：Material Detail 既有功能為 Baseline，不得建立第二個 UI／入口／路徑，本 EO 範圍縮小為純 Service/Adapter Layer。

## Impact Analysis

新增的兩個檔案是全新路徑（`ai-engine/src/service/`、`js/ai/`），未修改任何既有檔案的邏輯（唯一修改是 README 文件）。兩個檔案都沒有 DOM 操作、沒有 `fetch`/`XHR`/`localStorage`/`OpenAI`，且未在任何 HTML 頁面加入 `<script>` 引用——目前完全不會被任何既有頁面載入或執行，零風險影響現有畫面。

## Unit Test（node vm 沙箱，27 條全數 PASS）

涵蓋：`SummaryService` 三個 API（含未提供 id 的錯誤路徑、未產生過的教材回傳 `undefined`、重複呼叫共用同一份 Runtime 狀態）、`SummaryAdapter` 三個 API 正確委派、**Architecture Rule 驗證**（Adapter 程式碼本體零引用 `SummaryRuntime`/`SummaryPipeline`，只呼叫 `AIEngine.SummaryService`）、**Baseline 保護驗證**（兩個新檔案的程式碼本體零引用 `MaterialPreview`/`MaterialSummaryCard`/`AITutorService`/`KnowledgeSummaryRuntime`）、無 DOM／無 LLM／無網路呼叫的原始碼掃描，以及回歸 EO-AI-001～006 全部既有行為（含 `SummaryPipeline`／`SummaryEngine` 獨立呼叫仍正常，證明沒有被重建）。

```
PASS: 27   FAIL: 0
```

（過程中我自己寫的測試腳本一開始對「零引用既有 UI 檔名」的檢查誤判了 7 條——因為我的正則把檔案**頭部說明註解**裡提到的檔名也算進去了，跟 EO-AI-003 時同一種假警報。剝掉註解區塊只看可執行程式碼本體後，全部確認乾淨。）

## Regression

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS（無 fetch/XHR/localStorage） |
| jsdom BehaviorSuite | 162 / 162 PASS |
| Regression Suite（19 檔） | 739 / 739 PASS |
| html5validator（vnu，10 頁） | 0 errors，exit 0 |
| `MaterialPreview.js` | 逐位元組比對：未變 |
| `MaterialSummaryCard.js` | 逐位元組比對：未變 |
| Console Error | 0 |

## Smoke Test

9 個既有產品頁 Console Error = 0（jsdom BehaviorSuite 一併驗證）。兩個新檔案未被任何頁面載入，畫面零變化（含既有 AI 重點整理功能）。

## GitHub Pages

Push 至 `main`。既有頁面內容零 differ、regression 全綠，部署後行為與前一版一致；本 EO 完全不影響 Material Detail 畫面。

## Commit ID

（見下方 push 結果）

## QA Summary

Unit Test 27/27、Regression 739/739、jsdom 162/162、VerifyPaths／VerifyForbiddenPatterns／vnu 全 PASS，Console Error = 0。無 OpenAI/Claude/Gemini API、無 Prompt、無 NLP/RAG/Embedding/Vector DB、無外部套件、無 fetch/XHR/localStorage、無 DOM 操作。既有 Material Detail AI 重點整理功能（`MaterialPreview`/`MaterialSummaryCard`/`AITutorService`/`KnowledgeSummaryRuntime`）全數逐位元組未變，未建立第二個 UI／入口／路徑。

## 停止聲明

依 EO 指示，完成後**停止，不開始 EO-AI-008**。
