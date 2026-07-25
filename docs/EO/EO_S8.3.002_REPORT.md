# REPORT.md — EO-S8.3.002｜AI Tutor Service Runtime

## 1. Repository Search

依 Execution Rule 1／2（Search／Reuse Before Create）先搜尋既有可協調的服務能力：

| 既有資產 | 內容 | 於本 EO 的角色 |
|---|---|---|
| `js/runtime/AITutorRuntime.js`（EO-S8.3.001） | 讀取整合層，公開七個唯讀 API：`initialize／getLearningContext／getKnowledgeSummary／getQuestionSet／getWrongBook／getReviewList／serialize`。已完成 Summary／Question／WrongBook／Review 的唯讀整合並回報為即時視圖 | **Reuse（本 EO 的資料協調來源）** —— 架構圖 `AITutorRuntime → AITutorService`，Service 位於其上 |
| `js/runtime/KnowledgeSummaryRuntime.js`（EO-S8.2.002） | KG 衍生摘要，`getSummaryByMaterial` | 間接 Reuse（經 AITutorRuntime） |
| `js/runtime/QuestionGenerationRuntime.js`（EO-S8.2.003） | 題目產生，`getQuestionsByMaterial` | 間接 Reuse（經 AITutorRuntime） |
| `js/runtime/WrongBookSession.js`（EO-S7.0-001） | 錯題儲存，`list` | 間接 Reuse（經 AITutorRuntime） |
| `js/runtime/ReviewGeneratorRuntime.js`（EO-S8.2.005） | 複習清單，`getReviewByMaterial` | 間接 Reuse（經 AITutorRuntime） |

**目標路徑 `js/runtime/AITutorService.js` 不存在** —— 無命名衝突，依指定路徑新增。

### 設計決策：Service 經 AITutorRuntime 協調，而非自行重連四個 Runtime
架構圖顯示 `AITutorRuntime → AITutorService → {四個能力 Runtime}`。上一個 EO 的 `AITutorRuntime` 已建立四個能力的唯讀整合並回報為即時視圖。依 **Reuse Before Create**，本 Service 透過 AITutorRuntime 的既有唯讀 API 協調資料，**不重複開啟自己對四個 Runtime 的連接** —— 架構圖的四條向下箭頭由該既有整合層一次滿足。測試已驗證 Service 的四個協調 API 輸出與 AITutorRuntime 對應輸出**逐字一致**。

**Reuse**：`AHS.AITutorRuntime`（唯讀協調來源），間接含四個能力 Runtime。
**New**：`js/runtime/AITutorService.js`（`AHS.AITutorService`）、`tests/regression/AITutorServiceV1.js`。

---

## 2. Modified Files

**新增**
- `js/runtime/AITutorService.js`
- `tests/regression/AITutorServiceV1.js`

**修改**
- 無

**未修改**（逐位比對確認 byte-identical）
- `js/runtime/AITutorRuntime.js`、`js/runtime/KnowledgeSummaryRuntime.js`、`js/runtime/QuestionGenerationRuntime.js`、`js/runtime/ReviewGeneratorRuntime.js`、`js/runtime/WrongBookSession.js`、`js/parser/WrongBookGenerator.js`
- `js/runtime/SummaryRuntime.js`、`js/runtime/KnowledgeGraphRuntime.js`、`js/runtime/KnowledgeExtractionRuntime.js`、`js/parser/AnalysisRuntime.js`、`js/parser/MaterialTextProvider.js`、`js/parser/ParserAdapterRegistry.js`、`js/parser/KnowledgePipeline.js`、`js/runtime/MaterialRuntime.js`、`js/runtime/FolderRuntime.js`、`js/runtime/DocumentClassifierRuntime.js`、`js/runtime/ReviewModel.js`、`js/runtime/ReviewQueue.js`
- 全部 UI（`js/components/`、`js/ui/`、`js/pages/`）、全部 CSS、全部 HTML（**本 Sprint 未接線任何頁面**，新檔未被任何 HTML 載入）

實測：`diff -rq` 對交付前快照比對，**既有檔案差異數 = 0**。

---

## 3. Architecture Check

| 檢查項 | 結果 |
|---|---|
| Foundation Runtime 未修改 | ✅ 既有 js／css／html 全數 byte-identical |
| Public API 未修改 | ✅ 未觸碰任何既有模組之匯出；AITutorRuntime 七個 API 完整保留（測試驗證） |
| Runtime 未重複建立 | ✅ 目標路徑原不存在；Service 不重複 AITutorRuntime 的整合，而是協調其輸出 |
| Runtime Dependency 正確 | ✅ 僅依賴 `AHS.AITutorRuntime` 之唯讀 API。原始碼掃描證實**零依賴** MaterialRuntime／AnalysisRuntime／KnowledgeExtractionRuntime／KnowledgeGraphRuntime／MaterialTextProvider／ParserAdapterRegistry／SummaryGenerator／QuestionGenerationFlow |
| Architecture 未變更 | ✅ 本模組為 AITutorRuntime 之上的協調層；上游模組、資料流、既有 Runtime 相依關係皆未動 |
| Memory Runtime Only | ✅ 零 localStorage／sessionStorage／IndexedDB／PersistenceAdapter |

### Public API（恰七個，不得新增其他）
`buildLearningContext／getLearningSummary／getPracticeQuestions／getWrongBookItems／getReviewItems／getTutorSession／serialize`。測試以 `Object.keys` 驗證公開成員**恰為這七個** —— 未附加任何常數或輔助方法。

### Learning Session Model（LOCK，實測相符）
頂層恰為 `materialId / summary / questions / wrongBook / review / generatedAt`（核心欄位未增減）；`summary` 為物件、其餘三者為陣列。每一區段**逐字等於**其擁有者 Runtime 的輸出（測試以 `JSON.stringify` 逐區比對）。

**說明**：本 Model 相較 AITutorRuntime 的 Learning Context 多一個 `generatedAt` 欄位 —— 這是 Service 組裝 Session 的時間戳，屬協調層合理擁有的欄位（EO 的 Learning Session Model 亦明列此欄位）。

### Runtime Rules（LOCK，結構性保證）
原始碼掃描證實**未呼叫** `createSummary()`／`generateQuestions()`／`generateReview()`／`clear*()`／`WrongBookGenerator` —— 不重建 Summary／Question／WrongBook／Review。**未產生任何資料時**：`summary = {}`、三陣列為空，且建立 Session **不觸發**產生（測試驗證讀取後各能力仍為空）。

### Session 為即時視圖
本模組僅持有最近一次 Session（協調便利），學習資料一律即時向 AITutorRuntime 讀取 —— 能力端更新後重新建立之 Session 立即反映（測試以清除／重新產題驗證），且外部修改回傳值不影響能力端資料。

### Scope（無 LLM／聊天／UI／Parser）
原始碼掃描：零 openai／gemini／anthropic／claude／AIProvider／prompt；零 fetch／XHR；零 DOM（document／createElement／addEventListener／innerHTML）；零 speech／voice／OCR／pdfjs。

---

## 4. Regression

| 項目 | 結果 |
|---|---|
| **Runtime Regression** | AITutorServiceV1 **58/58**｜AITutorRuntimeV1 62/62｜ReviewGeneratorV1 61/61｜QuestionGenerationRuntimeV1 60/60｜KnowledgeSummaryV1 40/40｜ParserAdapterV1 47/47｜MaterialTextProviderV1 37/37｜AnalysisPipelineIntegration 65/65｜KnowledgeFoundationV1 40/40｜KnowledgeExtractionV1 48/48｜FolderRuntimeV1 39/39｜WrongBookFoundationV1 37/37｜QuestionFoundationV1 29/29｜QuestionGenerationFlow 18/18｜ReviewModelV1 10/10｜PipelineRegression 6/6｜InitializationGuard 6/6｜MaterialDownloadFlow 19/19｜MaterialBatchPersistence 27/27 —— **合計 709 PASS / 0 FAIL** |
| **VerifyPaths** | **PASS**（0 broken／0 legacy references） |
| **ForbiddenPatterns** | **PASS** |
| **jsdom** | BehaviorSuite **129 PASS / 0 FAIL** |
| **HTML5 Validator** | html5validator 10 頁 **0 errors** |
| **Console Error** | **0**（新檔未被任何頁面載入，HTML／CSS／既有 JS 逐位未變更；jsdom 各頁 Console Error 斷言全數通過） |

**Runtime Integration 為真實端到端**：Folder → Material → Analysis → Extraction → Knowledge Graph → Summary＋Question → WrongBook（真實答錯 3／2／1 次）→ Review → AITutorRuntime → **AITutorService 組裝為單一 Learning Session**，六欄位、四區段逐字比對通過。

---

## 5. Final Self Check

- ☑ **無重複 Runtime** —— 目標路徑原不存在；Service 協調 AITutorRuntime 的輸出而非重複其整合。
- ☑ **無 Architecture Refactor** —— 上游與資料流未動，本模組為協調層。
- ☑ **無修改 Baseline** —— 既有檔案 byte-identical（差異數 0）。
- ☑ **無 Scope Creep** —— 公開成員恰七個 API；零 LLM／Provider／聊天／Prompt／語音／OCR／Parser／DOM（原始碼掃描逐項驗證）。
- ☑ **僅完成 Service Layer** —— 未新增任何 UI、未修改任何頁面。

---

## Acceptance Criteria 對照
✅ AITutorService ✅ Runtime Integration（真實端到端）✅ Runtime Regression PASS ✅ VerifyPaths PASS ✅ ForbiddenPatterns PASS ✅ jsdom PASS ✅ Console Error = 0
