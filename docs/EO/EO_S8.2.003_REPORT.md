# REPORT.md — EO-S8.2.003｜Question Generation Runtime

## 1. Repository Search

依 Execution Rule 1 先搜尋既有 Question Generation 能力：

| 既有資產 | 內容 | 能否 Reuse 以滿足本 EO |
|---|---|---|
| `js/parser/QuestionGenerationFlow.js`（11,729 bytes） | EO-S6.9-002 產題流程，**資料來源為 `AHS.SummaryRuntime`**（`latestSummaryFor()` → 五段摘要） | **否（且為關鍵）** —— 本 EO 明文「禁止呼叫 SummaryRuntime」「不得建立 KnowledgeGraph→Summary→Question」。此模組正是被禁止的那條路徑，且為 LOCK，故不得 Reuse 亦不得修改 |
| `js/parser/LearningQuestionGenerator.js`（8,907 bytes） | Schema v1.0 Interface（generate／validate／normalize），欄位為 chapter／section／knowledgePoint／learningObjective… | **否** —— Model 與本 EO LOCK 十欄（knowledgeNodeId／knowledgeType／traceability…）不符，且為 LOCK |
| `js/runtime/LearningQuestionSession.js`（5,677 bytes） | Schema v1.0 題目儲存（sessionStorage 持久化） | **否** —— 本 EO 要求 Memory Only，且 Model 不符，為 LOCK |
| `js/runtime/ExamBankRuntime.js`（5,061 bytes） | Mode A 考卷原題逐字入庫 | **否** —— 為「保留原題」而非「由知識圖譜產題」，為 LOCK |
| `js/parser/QuestionGenerator.js`、`js/runtime/QuestionBank.js`、`js/runtime/LearningQuestionRuntime.js` | 舊 pipeline 產題與題庫（LOCK） | **否** —— 非 Knowledge Graph 來源 |
| `js/runtime/KnowledgeGraphRuntime.js` | 內容節點 `definition／formula／keyword／concept／knowledge_point`；公開查詢 `queryByMaterial()／getNode()／neighbors()` | **是（已 Reuse）** —— 本 EO 指定之唯一知識來源 |
| `js/parser/KnowledgePipeline.js`、`js/runtime/KnowledgeExtractionRuntime.js` | 上游 Foundation（LOCK） | **是（已 Reuse）** —— 上游，未修改 |

**目標路徑 `js/runtime/QuestionGenerationRuntime.js` 不存在** —— 本 EO 無命名衝突，直接依指定路徑新增。

**Reuse**：KnowledgeGraphRuntime（唯一知識來源，公開查詢 API）、KnowledgeExtractionRuntime、KnowledgePipeline、既有 Foundation 全鏈。
**New**：`js/runtime/QuestionGenerationRuntime.js`（`AHS.QuestionGenerationRuntime`）、`tests/regression/QuestionGenerationRuntimeV1.js`。

---

## 2. Modified Files

**新增**
- `js/runtime/QuestionGenerationRuntime.js`
- `tests/regression/QuestionGenerationRuntimeV1.js`

**修改**
- 無

**未修改**（逐位比對確認 byte-identical）
- `js/parser/QuestionGenerationFlow.js`、`js/parser/LearningQuestionGenerator.js`、`js/runtime/LearningQuestionSession.js`、`js/runtime/LearningQuestionRuntime.js`、`js/parser/QuestionGenerator.js`、`js/runtime/QuestionBank.js`、`js/runtime/ExamBankRuntime.js`
- `js/runtime/SummaryRuntime.js`、`js/runtime/KnowledgeSummaryRuntime.js`、`js/parser/SummaryGenerator.js`
- `js/runtime/KnowledgeGraphRuntime.js`、`js/runtime/KnowledgeExtractionRuntime.js`、`js/parser/AnalysisRuntime.js`、`js/parser/MaterialTextProvider.js`、`js/parser/ParserAdapterRegistry.js`、`js/parser/KnowledgePipeline.js`、`js/runtime/MaterialRuntime.js`、`js/runtime/FolderRuntime.js`、`js/runtime/DocumentClassifierRuntime.js`
- 全部 UI（`js/components/`、`js/ui/`）、全部 CSS、全部 HTML（**本 Sprint 未接線任何頁面**）

實測：`diff -rq` 對交付前快照比對，**既有檔案差異數 = 0**。

---

## 3. Architecture Check

| 檢查項 | 結果 |
|---|---|
| Foundation Runtime 未修改 | ✅ 既有 js／css／html 全數 byte-identical |
| Public API 未修改 | ✅ 未觸碰任何既有模組之匯出 |
| Runtime 未重複建立 | ✅ 目標路徑原不存在；既有產題資產皆為不同 Model／不同來源（Summary 或原題保留），本 Runtime 為唯一的 Knowledge-Graph 產題 Consumer |
| **Question Runtime 未依賴 Summary Runtime** | ✅ 原始碼掃描：零 `AHS.SummaryRuntime`、零 `AHS.KnowledgeSummaryRuntime`、零 `AHS.SummaryGenerator`、零 `AHS.QuestionGenerationFlow` —— 被禁止的 KnowledgeGraph→Summary→Question 路徑在程式結構上不存在 |
| Architecture 未變更 | ✅ 本 Runtime 為末端唯讀 Consumer，與 Summary 能力**平行**；上游模組與資料流未動 |
| Question Source LOCK | ✅ 零 `AHS.MaterialRuntime`（不重新解析教材）、零 `AHS.AnalysisRuntime`／`MaterialTextProvider`（不建立新 Analysis Pipeline）、零 `AHS.KnowledgeExtractionRuntime`（不重複擷取 Knowledge）；唯一來源為 `KnowledgeGraphRuntime.queryByMaterial()` |
| Memory Runtime Only | ✅ 零 localStorage／sessionStorage／IndexedDB／PersistenceAdapter；零 fetch／XHR |

### Question Model（LOCK，實測相符）
頂層恰為 `materialId / generatedAt / questions`；每題欄位恰為 `id / knowledgeNodeId / knowledgeType / type / difficulty / question / options / answer / explanation / traceability`（核心欄位未增減）。`type` 固定 `single_choice`（四選項單選為 Question Rules 的必然結果）。

### Knowledge Type（LOCK）
僅 `definition / formula / keyword / concept`；每題之 `knowledgeType` **等於圖譜節點的真實型別**（測試逐題比對，未改標）。

**Flag**：Knowledge Graph 另有 `knowledge_point` 型別節點，但該值不在本 EO 允許清單中。處置為**跳過**此類節點，而非改標為允許值（改標會誤報來源）。若 PMO 希望納入，需擴充 Knowledge Type 允許清單。

### Question Rules（LOCK）
每題恰四個選項、選項互不重複、正確答案必在選項內、題目／答案／詳解皆非空、difficulty ∈ easy／medium／hard（測試逐項驗證）。

**選項皆為真實內容**：每個選項必為「真實節點內容」或「四類固定標籤」之一（測試以圖譜節點文字集合比對）；**零填充式選項**（以上皆非／N/A 等）。當圖譜無法提供三個真實干擾項時，該題型**不產生**，絕不虛構。

### 決定性產題規則（無 AI、無隨機）
- **A · 分類題**（永遠可產生）：「「內容」屬於下列哪一類知識？」選項＝四類固定標籤，答案＝節點真實型別 → **easy**
- **B · 回想題**（需三個真實干擾項）：「下列哪一項是本教材記錄的〈型別〉？」選項＝該節點文字＋三個其他真實節點文字，答案＝該節點文字 → 干擾項全為**同型別**時 **hard**，否則 **medium**

節點依圖譜 id 排序處理、答案位置由節點 id 決定 —— 同一圖譜重複產生結果完全一致（測試驗證）。

### Traceability（LOCK）
每題 `traceability` 皆帶 `materialId / knowledgeNodeId / paragraph / lineStart / lineEnd`；`knowledgeNodeId` 全數可解析回真實圖譜節點；`paragraph` 為真實段落序號；**`lineStart／lineEnd` 誠實為 `null`**（圖譜目前不含行號，待 Parser 供給 —— 不猜測、不虛構）。

---

## 4. Regression

| 項目 | 結果 |
|---|---|
| **Runtime Regression** | QuestionGenerationRuntimeV1 **60/60**｜KnowledgeSummaryV1 40/40｜ParserAdapterV1 47/47｜MaterialTextProviderV1 37/37｜AnalysisPipelineIntegration 65/65｜KnowledgeFoundationV1 40/40｜KnowledgeExtractionV1 48/48｜FolderRuntimeV1 39/39｜WrongBookFoundationV1 37/37｜QuestionFoundationV1 29/29｜QuestionGenerationFlow 18/18｜ReviewModelV1 10/10｜PipelineRegression 6/6｜InitializationGuard 6/6｜MaterialDownloadFlow 19/19｜MaterialBatchPersistence 27/27 —— **合計 528 PASS / 0 FAIL** |
| **jsdom** | BehaviorSuite **129 PASS / 0 FAIL** |
| **HTML Validator** | html5validator 10 頁 **0 errors** |
| **Console Error** | **0**（本 Sprint 未接線任何 UI，HTML／CSS／既有 JS 逐位未變更；jsdom 各頁 Console Error 斷言全數通過） |
| 其他稽核 | VerifyPaths **PASS**（0 broken／0 legacy）｜VerifyForbiddenPatterns **PASS** |

GitHub Pages Console Error = 0：新檔未被任何頁面載入、既有資產零變更，頁面行為與推送前完全一致；實機覆核建議推送後 Ctrl+F5 確認（本環境無 github.io 存取權）。

---

## 5. Final Self Check

- ☑ **無重複 Runtime** —— 目標路徑原不存在；既有產題資產來源／Model 皆不同（Summary 衍生或原題保留），本 Runtime 為唯一 Knowledge-Graph 產題 Consumer。
- ☑ **無 Architecture Refactor** —— 上游與資料流未動，本模組為末端唯讀 Consumer。
- ☑ **無修改 Baseline** —— 既有檔案 byte-identical（差異數 0）。
- ☑ **無依賴 SummaryRuntime** —— 原始碼掃描證實零 Summary 相關呼叫；且測試驗證 Summary 能力與本 Runtime 互不影響。
- ☑ **無新增非本 EO 範圍功能** —— 未實作 WrongBook Generator／Review Generator／AI Tutor／PDF／DOCX／OCR；未修改任何 UI；公開成員僅六個 API 與兩個唯讀常數。

---

## Acceptance Criteria 對照
✅ QuestionGenerationRuntime ✅ Runtime Integration（Folder→Material→Analysis→Extraction→Graph→Question 端到端實測，9 個節點產出多題）✅ Question Model（LOCK 欄位相符）✅ Traceability（五欄位齊備、可回溯真實節點）✅ Runtime Regression = 0 ✅ GitHub Pages Console Error = 0 ✅ 不影響既有功能
