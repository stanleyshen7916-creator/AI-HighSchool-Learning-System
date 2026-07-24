# REPORT.md — EO-S8.2.002｜Summary Runtime

## 1. Repository Search

依 Execution Rule 1 先搜尋既有 Summary 能力，結果如下：

| 既有資產 | 內容 | 能否直接 Reuse 以滿足本 EO |
|---|---|---|
| `js/runtime/SummaryRuntime.js`（5,821 bytes） | Sprint-5 五段儲存：`coreConcepts / definitions / pitfalls / memorize / reviewSuggestions`；API `add / sync / list / isEmpty / getById / findByMaterialId / findBySubject / reset`。經 EO-S8.0-001 PMO Final Decision 3 明定 **LOCK**，由 SummaryCenter UI 與 SummaryGenerator 實際使用 | **否** —— 五區名稱與本 EO LOCK 規格（`coreConcepts / keywords / definitions / formulas / importantPoints`）不同、API 不同、Model 不同、無 traceability 欄位。改造它會同時違反 Rule 4（不得修改 Foundation Runtime）與 Rule 5（不得修改 Public API） |
| `js/parser/AnalysisRuntime.js` 之 Summary Schema v2 | 七段（含 examTypes／furtherReading）＋ `validate()／store()／getByMaterialId()` | **否** —— 段數與欄位結構與本 EO LOCK 五區不符，且該檔為 LOCK |
| `js/parser/SummaryGenerator.js` | 舊 pipeline 的摘要產生器（LOCK） | **否** —— 非 Knowledge-Graph 來源，且為 LOCK |
| `js/runtime/KnowledgeGraphRuntime.js` | 內容節點 `concept / keyword / definition / formula / knowledge_point`，公開查詢 `queryByMaterial()／getNode()` | **是（已 Reuse）** —— 本 EO 指定之唯一 Summary 來源 |
| `js/runtime/KnowledgeExtractionRuntime.js` | 將分析結果寫入圖譜（LOCK） | **是（已 Reuse）** —— 上游，不修改 |
| `js/parser/KnowledgePipeline.js` | Folder→Material→Classifier→Analysis→Extraction→Graph（LOCK） | **是（已 Reuse）** —— 上游，不修改 |

**Reuse**：KnowledgeGraphRuntime（唯一資料來源，公開查詢 API）、KnowledgeExtractionRuntime、KnowledgePipeline、既有 Foundation 全鏈。
**New**：`js/runtime/KnowledgeSummaryRuntime.js`（`AHS.KnowledgeSummaryRuntime`）、`tests/regression/KnowledgeSummaryV1.js`。

### ⚠ 命名衝突與處置（請 PMO 裁示）
本 EO 要求「新增 `js/runtime/SummaryRuntime.js`」，但**該檔已存在且為 LOCK**。於該路徑建立本 EO 的新 Model／新 API，等同覆寫 Foundation Runtime 並變更 Public API —— 違反本 EO 自身的 Rule 4 與 Rule 5，且會破壞 SummaryCenter UI 與既有迴歸。

處置：依本專案既有 **Ruling 1B 並行命名前例**（LearningQuestionSession vs LearningQuestionRuntime、WrongBookSession vs WrongBookRuntime、ReviewModel vs ReviewRuntime），以 **`AHS.KnowledgeSummaryRuntime`（`js/runtime/KnowledgeSummaryRuntime.js`）** 實作。**Model／五區名稱／五個 API／Traceability／Memory-Only 全部依 EO LOCK 規格，一字未改**；既有 SummaryRuntime 逐位未動。若 PMO 要求改用其他名稱或路徑，為單檔改名，可即刻執行。

---

## 2. Modified Files

**新增**
- `js/runtime/KnowledgeSummaryRuntime.js`
- `tests/regression/KnowledgeSummaryV1.js`

**修改**
- 無

**未修改**（逐位比對確認 byte-identical）
- `js/runtime/SummaryRuntime.js`、`js/parser/SummaryGenerator.js`、`js/components/SummaryCenter.js`
- `js/runtime/MaterialRuntime.js`、`js/runtime/FolderRuntime.js`、`js/runtime/DocumentClassifierRuntime.js`
- `js/runtime/KnowledgeGraphRuntime.js`、`js/runtime/KnowledgeExtractionRuntime.js`
- `js/parser/AnalysisRuntime.js`、`js/parser/MaterialTextProvider.js`、`js/parser/ParserAdapterRegistry.js`、`js/parser/KnowledgePipeline.js`
- 全部 UI（`js/components/`、`js/ui/`）、全部 CSS、全部 HTML（**本 Sprint 未接線任何頁面**，僅提供 Runtime API）

實測：`diff -rq` 對交付前快照比對，**既有檔案差異數 = 0**，變更僅為上述 2 個新增檔。

---

## 3. Architecture Check

| 檢查項 | 結果 |
|---|---|
| Foundation Runtime 未修改 | ✅ 既有 js/ css/ html 全數 byte-identical |
| Public API 未修改 | ✅ 既有 SummaryRuntime 八個 API 完整保留且行為不變（測試驗證） |
| Runtime 未重複建立 | ✅ 未建立第二套同功能 Runtime：LOCK SummaryRuntime 是舊 pipeline 的五段儲存，本模組是 Knowledge-Graph 衍生的 AI 輸出，兩者 Model／來源／職責皆不同且互不寫入（測試驗證 `AHS.SummaryRuntime !== AHS.KnowledgeSummaryRuntime`、且本模組不寫入前者） |
| Architecture 未變更 | ✅ 管線順序、上游模組、資料流全數沿用；本模組為末端唯讀消費者，僅透過 KnowledgeGraphRuntime 公開查詢 API 取得資料 |
| Summary Source LOCK | ✅ 原始碼掃描：零 `AHS.MaterialRuntime`、零 `AHS.MaterialTextProvider`、零 `AHS.AnalysisRuntime`、零 `AHS.SummaryRuntime／SummaryGenerator` —— 不重新解析教材、不建立新 Analysis Pipeline、不複製既有分析邏輯 |
| Memory Runtime Only | ✅ 原始碼掃描：零 localStorage／sessionStorage／IndexedDB／PersistenceAdapter；零 fetch／XHR |

### Summary Model（LOCK，實測欄位完全相符）
頂層欄位恰為 `materialId / title / generatedAt / summary / traceability`（無增加欄位）；`summary` 恰為五區 `coreConcepts / keywords / definitions / formulas / importantPoints`（名稱未改）。

### 節點型別 → 五區（決定性 1:1，無推論）
`concept → coreConcepts`｜`keyword → keywords`｜`definition → definitions`｜`formula → formulas`｜`knowledge_point → importantPoints`

### Traceability（LOCK）
每一項目皆帶 `materialId / knowledgeNodeId / paragraph / lineStart / lineEnd`，且 `traceability` 以 `knowledgeNodeId` 索引。`knowledgeNodeId` 全數可解析回真實圖譜節點；`paragraph` 為真實段落序號；**`lineStart／lineEnd` 誠實為 `null`**（Knowledge Graph 目前不含行號資訊，待 Parser 供給 —— 不猜測、不虛構）。

---

## 4. Regression

| 項目 | 結果 |
|---|---|
| **Runtime Regression** | KnowledgeSummaryV1 **40/40**｜ParserAdapterV1 47/47｜MaterialTextProviderV1 37/37｜AnalysisPipelineIntegration 65/65｜KnowledgeFoundationV1 40/40｜KnowledgeExtractionV1 48/48｜FolderRuntimeV1 39/39｜WrongBookFoundationV1 37/37｜QuestionFoundationV1 29/29｜QuestionGenerationFlow 18/18｜ReviewModelV1 10/10｜PipelineRegression 6/6｜InitializationGuard 6/6｜MaterialDownloadFlow 19/19｜MaterialBatchPersistence 27/27 —— **合計 468 PASS / 0 FAIL** |
| **jsdom** | BehaviorSuite **129 PASS / 0 FAIL** |
| **HTML Validator** | html5validator 10 頁 **0 errors** |
| **Console Error** | **0**（本 Sprint 未接線任何 UI，頁面逐位未變更；jsdom 各頁 Console Error 斷言全數通過） |
| 其他稽核 | VerifyPaths **PASS**（0 broken／0 legacy）｜VerifyForbiddenPatterns **PASS** |

GitHub Pages Console Error = 0：本 Sprint 對 HTML／CSS／既有 JS 零變更、新檔未被任何頁面載入，故頁面行為與推送前完全一致；實機覆核仍建議推送後 Ctrl+F5 確認（本環境無 github.io 存取權）。

---

## 5. Final Self Check

- ☑ **無重複 Runtime** —— 未建立第二套同功能 Runtime；LOCK SummaryRuntime 與本模組職責／Model／來源不同且互不寫入（測試證實）。命名衝突已於 §1 完整揭露並提供 PMO 否決選項。
- ☑ **無 Architecture Refactor** —— 管線與資料流未動，本模組為末端唯讀消費者。
- ☑ **無修改 Baseline** —— 既有檔案 byte-identical（差異數 0）。
- ☑ **無新增非本 EO 範圍功能** —— 未實作 AI Question／WrongBook Generator／Review Generator／AI Tutor／PDF／DOCX／OCR；未修改任何 UI。

---

## Acceptance Criteria 對照
✅ Summary Runtime ✅ Runtime Integration（Folder→Material→Analysis→Extraction→Graph→Summary 端到端實測產出四項摘要）✅ Summary Model（LOCK 欄位完全相符）✅ Traceability（五欄位齊備、可回溯真實節點）✅ Runtime Regression = 0 ✅ GitHub Pages Console Error = 0 ✅ 不影響既有功能
