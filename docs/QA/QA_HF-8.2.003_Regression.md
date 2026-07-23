# Regression_QA_Report — HF-8.2.003

## Hotfix 專屬：tests/regression/MaterialBatchPersistence.js — **27 PASS / 0 FAIL**
1. **批次三張**：教材建立、`stored=3/oversize=0/failed=0`、**每張唯一 Storage Key（`materialFile:rt_N`，互不覆蓋）**、每張皆有位元組、各張內容與原檔長度一致且互異、檔名與 MIME 逐張保存
2. **跨頁**：首次載入即顯示三張、Runtime `file` 皆為 null（前提成立）、**預覽 3/3 渲染 img 有 src**、**下載 3/3 觸發且檔名逐張正確不重複**、Blob 為真實位元組
3. **單張**：保存與跨頁下載完全正常（不受批次修正影響）
4. **配額耗盡**（模擬 5 MB，3×2 MB）：教材仍全部建立、能存的存下、存不下的標記 oversize（不靜默失敗）、**已保存者不受他人失敗波及**、狀態列具名告知、oversize 教材於同一階段仍可下載
5. **刪除**：僅釋放該張位元組，其餘完整

## jsdom BehaviorSuite — **129 PASS / 0 FAIL**
新增 **[19]** 跨頁圖片預覽（位元組還原）、**[20]** HF-8.2.001 舊單一 key 向下相容下載；**[17][18]** 依本 EO 授權改用每檔唯一 key 播種（單一 key 為本次修正的 root cause）。

## 全鏈 Regression（Zero Regression）
| 套件 | 結果 |
|---|---|
| jsdom BehaviorSuite（[1]–[20]） | **129/129** |
| MaterialBatchPersistence（新增） | 27/27 |
| MaterialDownloadFlow（更新至新機制） | 19/19 |
| ParserAdapterV1 | 47/47 |
| MaterialTextProviderV1 | 37/37 |
| AnalysisPipelineIntegration | 65/65 |
| KnowledgeFoundationV1 | 40/40 |
| KnowledgeExtractionV1 | 48/48 |
| FolderRuntimeV1 | 39/39 |
| WrongBookFoundationV1 | 37/37 |
| QuestionFoundationV1 | 29/29 |
| QuestionGenerationFlow | 18/18 |
| ReviewModelV1 | 10/10 |
| PipelineRegression | 6/6 |
| InitializationGuard | 6/6 |
| html5validator（10 頁） | **0 errors** |
| VerifyPaths / VerifyForbiddenPatterns | **PASS**（零 fetch／XHR／localStorage／indexedDB） |
| Console Error | **= 0** |

## Baseline
**禁改清單全數 byte-identical**：MaterialRuntime／MaterialTextProvider／AnalysisRuntime／KnowledgeGraphRuntime／KnowledgeExtractionRuntime／FolderRuntime／DocumentClassifierRuntime／KnowledgePipeline／ParserAdapterRegistry／SummaryRuntime／PersistenceAdapter ✓
CSS 差異 = 0；HTML 僅 materials.html 增 1 行 script。

## 測試方法學修正（重要）
本次發現既有 jsdom harness 會**手動 dispatch DOMContentLoaded**，而 jsdom 隨後亦自然觸發一次 → 頁面 bootstrap 執行兩次、第一個實例的節點脫離 DOM，導致狀態列觀測失真（真實瀏覽器僅觸發一次）。新測試檔改為等待 jsdom 自然事件，觀測結果才可信。此為測試方法問題，非產品缺陷（已以 create/mount 計數證實產品每次載入僅初始化一次）。

## GitHub Pages QA（誠實揭露）
需推送後實機驗證（本環境無 github.io 存取）：
1. Ctrl+F5 硬重新整理
2. 批次上傳 2–3 張**小圖**（各數百 KB）→ 切換頁面再回來 → 逐張預覽與下載應全部正常、檔名正確
3. 批次上傳大圖（各 2 MB 以上）→ 應出現具名提示「…超出瀏覽器暫存空間…僅能於本次瀏覽階段」
4. Console：Error = 0
