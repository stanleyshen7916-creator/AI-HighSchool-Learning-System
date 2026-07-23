# Regression_QA_Report — HF-8.2.001

## Hotfix 專屬驗證
### jsdom BehaviorSuite 新增 [15]–[18]（共 17 項）
- **[15] HF-001**：首次載入即渲染 2 張卡片、標題正確、Empty State 未誤顯示、Console errors = 0、切換後張數一致（證明初始化完整）
- **[16] HF-001**：零教材時仍顯示正式 Empty State（非空白頁）、Console errors = 0
- **[17] HF-002**：下載事件觸發取得 Blob URL、**Blob 由真實位元組重建且長度正確**、檔名為原始 fileName、回報成功、Console errors = 0
- **[18] HF-002**：三種失敗情境（無檔案來源／檔案過大／位元組無法還原）各有精確誠實訊息，且 Console errors = 0

### tests/regression/MaterialDownloadFlow.js — **18 PASS / 0 FAIL**（端到端，含非同步 FileReader）
1. **真實上傳**：檔案輸入 → 上傳對話框 → 建立教材 → 位元組經 PersistenceAdapter 寫入 → 保存原始檔名與 MIME → data URL 為真實內容
2. **跨頁下載**（HF-002 修正核心）：新頁面首次載入即顯示教材、**Runtime 記錄之 file 已為 null（前提成立）**、下載觸發、**Blob 長度與原檔一致**、檔名正確、回報成功
3. **刪除同步釋放位元組**：確認對話框 → 刪除 → 位元組存放清空

## 全鏈 Regression（Zero Regression）
| 套件 | 結果 |
|---|---|
| jsdom BehaviorSuite（[1]–[18]） | **124 PASS / 0 FAIL** |
| MaterialDownloadFlow（新增） | 18/18 |
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
| VerifyPaths / VerifyForbiddenPatterns | **PASS** |
| Console Error | **= 0**（所有頁面） |

## Baseline 驗證
- **LOCK Runtime byte-identical**：MaterialRuntime／FolderRuntime／MaterialTextProvider／AnalysisRuntime／KnowledgeExtractionRuntime／KnowledgeGraphRuntime／SummaryRuntime／DocumentClassifierRuntime／KnowledgePipeline／ParserAdapterRegistry／PersistenceAdapter **全數逐位一致 ✓**
- **變更檔案僅 2 個**：js/components/MaterialCenter.js、tests/jsdom/BehaviorSuite.js（＋1 個新測試檔）
- **No UI Regression**：css 差異數 = 0、10 個 HTML 全數未變更 ✓
- **Foundation Architecture 未變更**：Sprint 8 管線（Folder → Material → Provider → Analysis → Extraction → Knowledge Graph）零觸碰 ✓

## GitHub Pages QA（誠實揭露）
修正全程為用戶端、同源、零網路請求（VerifyForbiddenPatterns 通過，無 fetch／XHR／localStorage／indexedDB），靜態託管行為與本機一致。**實機 PASS 需推送後執行**（本工作環境無 github.io 存取權）：
1. 推送 → 等 Pages 部署 1–3 分鐘 → **Ctrl+F5 硬重新整理**
2. 開啟教材中心：**首次進入即應顯示教材**（不需切換）
3. 上傳一份檔案 → 切換到其他頁面再回來 → **點擊下載應正常下載且檔名正確**
4. Console：Error = 0
