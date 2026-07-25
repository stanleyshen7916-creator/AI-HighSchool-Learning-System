# REPORT.md — EO-S8.3.001｜AI Tutor Runtime Foundation

## 1. Repository Search

依 Execution Rule 1（Search Before Create）先搜尋既有 AI Tutor 能力與四個整合來源：

### 既有 AI Tutor 資產
| 資產 | 內容 | 能否 Reuse |
|---|---|---|
| `js/components/AiTutor.js`（7,835 bytes） | AI Tutor 頁面 UI 元件 | **否** —— 屬 UI 層，本 EO 不得新增／修改任何 UI |
| `js/components/AiTutorHomeCard.js`（3,836 bytes） | 首頁入口卡 UI | **否** —— 同上 |
| `js/pages/AppTutor.js`（1,570 bytes）／`tutor.html`（995 bytes） | 頁面 bootstrap 與 HTML | **否** —— 同上 |
| **AI Tutor Runtime** | `grep` 全 `js/runtime/`、`js/parser/` —— **不存在任何 AI Tutor Runtime** | 需新建 |

**目標路徑 `js/runtime/AITutorRuntime.js` 不存在** —— 無命名衝突，依指定路徑新增。

### 四個整合來源之實際存在狀況
| EO 指名 | Repository 實況 | 本模組採用 |
|---|---|---|
| SummaryRuntime | **兩個模組並存**：`js/runtime/SummaryRuntime.js`（Sprint-5 五段儲存，LOCK，非 KG 衍生）與 `js/runtime/KnowledgeSummaryRuntime.js`（EO-S8.2.002，**KG 衍生**） | **`AHS.KnowledgeSummaryRuntime`** —— 本 EO 架構圖將 Summary 置於 Knowledge Graph Consumer 位置，即此模組；LOCK 的舊 SummaryRuntime 刻意不使用（見 Flag 1） |
| QuestionGenerationRuntime | ✓ `js/runtime/QuestionGenerationRuntime.js`（EO-S8.2.003） | `AHS.QuestionGenerationRuntime`（唯讀） |
| WrongBookGeneratorRuntime | **✗ 不存在** —— 錯題能力為 EO-S7.0-001 配對：`WrongBookGenerator`（寫入 Interface）＋`WrongBookSession`（儲存） | **`AHS.WrongBookSession`**（唯讀，見 Flag 2） |
| ReviewGeneratorRuntime | ✓ `js/runtime/ReviewGeneratorRuntime.js`（EO-S8.2.005） | `AHS.ReviewGeneratorRuntime`（唯讀） |

**Reuse**：`KnowledgeSummaryRuntime`、`QuestionGenerationRuntime`、`WrongBookSession`、`ReviewGeneratorRuntime` —— 全部僅呼叫其**唯讀 API**。
**New**：`js/runtime/AITutorRuntime.js`（`AHS.AITutorRuntime`）、`tests/regression/AITutorRuntimeV1.js`。

### ⚠ Flag 1：Summary 有兩個模組，本模組採用 KG 衍生者
`SummaryRuntime`（LOCK，Sprint-5）之五段為 coreConcepts／definitions／pitfalls／memorize／reviewSuggestions，來源為舊 pipeline，**非** Knowledge Graph。本 EO 架構圖明確將 Summary 與 Question、AI Tutor 並列為 Knowledge Graph 的三個 Consumer，故採用 EO-S8.2.002 建立的 `KnowledgeSummaryRuntime`（KG 衍生、五區為 coreConcepts／keywords／definitions／formulas／importantPoints）。註冊狀態會回報所依賴之模組名稱，PMO 可於 `initialize()` 輸出直接核對；若 PMO 要求改用 LOCK SummaryRuntime，為單一常數修改。

### ⚠ Flag 2：EO 指名的 `WrongBookGeneratorRuntime` 不存在（與 EO-S8.2.005 同一情況）
Repository 內無此模組（EO-S8.2.004 未送達本開發者）。AI Tutor 作為 Consumer 僅需**讀取**錯題，故讀取 `WrongBookSession.list()` 並依 materialId 過濾，且**完全不寫入**錯題（測試以原始碼掃描驗證未出現 `AHS.WrongBookGenerator`）。若該模組日後落地，僅需替換註冊表中的一個 namespace 字串。

---

## 2. Modified Files

**新增**
- `js/runtime/AITutorRuntime.js`
- `tests/regression/AITutorRuntimeV1.js`

**修改**
- 無

**未修改**（逐位比對確認 byte-identical）
- `js/runtime/KnowledgeSummaryRuntime.js`、`js/runtime/SummaryRuntime.js`、`js/runtime/QuestionGenerationRuntime.js`、`js/runtime/ReviewGeneratorRuntime.js`、`js/runtime/WrongBookSession.js`、`js/parser/WrongBookGenerator.js`、`js/runtime/WrongBookRuntime.js`
- `js/runtime/KnowledgeGraphRuntime.js`、`js/runtime/KnowledgeExtractionRuntime.js`、`js/parser/AnalysisRuntime.js`、`js/parser/MaterialTextProvider.js`、`js/parser/ParserAdapterRegistry.js`、`js/parser/KnowledgePipeline.js`、`js/runtime/MaterialRuntime.js`、`js/runtime/FolderRuntime.js`、`js/runtime/DocumentClassifierRuntime.js`、`js/runtime/ReviewModel.js`、`js/runtime/ReviewQueue.js`
- **全部 UI**：`js/components/AiTutor.js`、`js/components/AiTutorHomeCard.js`、`js/pages/AppTutor.js`、`tutor.html` 及其餘所有 components／ui／pages
- 全部 CSS、全部 HTML（**本 Sprint 未接線任何頁面**，新檔未被任何 HTML 載入）

實測：`diff -rq` 對交付前快照比對，**既有檔案差異數 = 0**。

---

## 3. Architecture Check

| 檢查項 | 結果 |
|---|---|
| Foundation Runtime 未修改 | ✅ 既有 js／css／html 全數 byte-identical |
| Public API 未修改 | ✅ 未觸碰任何既有模組之匯出；LOCK ReviewModel 五個 API 與 SummaryRuntime 皆完整保留（測試驗證） |
| Runtime 未重複建立 | ✅ 目標路徑原不存在；既有 AI Tutor 資產全為 UI 層，無任何 Runtime 可重複 |
| **Runtime Dependency 正確** | ✅ 僅依賴四個能力 Runtime 之唯讀 API：`getSummaryByMaterial`／`getQuestionsByMaterial`／`list`／`getReviewByMaterial`。原始碼掃描證實**零依賴** MaterialRuntime／AnalysisRuntime／KnowledgeExtractionRuntime／**KnowledgeGraphRuntime**／MaterialTextProvider／ParserAdapterRegistry／SummaryGenerator／QuestionGenerationFlow |
| Architecture 未變更 | ✅ 本模組為鏈末唯讀整合層；上游模組、資料流、既有 Runtime 之相依關係皆未動 |
| Memory Runtime Only | ✅ 零 localStorage／sessionStorage／IndexedDB／PersistenceAdapter |

### Public API（恰七個，不得新增其他）
`initialize`／`getLearningContext`／`getKnowledgeSummary`／`getQuestionSet`／`getWrongBook`／`getReviewList`／`serialize`。
測試以 `Object.keys` 驗證公開成員**恰為這七個** —— 未附加任何常數或輔助方法。

### Runtime Registration（`initialize()`）
回報 `{ initialized, initializedAt, capabilities:[{id, namespace, available}], availableCount, missing:[] }`。四個 capability（summary／question／wrongBook／review）逐一檢查其模組與讀取方法是否可呼叫；**capability 缺失時誠實回報而非建立**（測試以暫時移除 ReviewGeneratorRuntime 反證 `availableCount = 3`、`missing = ["review"]`）。可重複呼叫。

### Learning Context Model（LOCK，實測相符）
頂層恰為 `materialId / summary / questions / wrongBook / review`（核心欄位未增減）；`summary` 為物件、其餘三者為陣列。每一區段**逐字等於**其擁有者 Runtime 的輸出（測試以 `JSON.stringify` 逐區比對），AI Tutor 不改寫任何內容。

### Runtime Rules（LOCK，結構性保證）
原始碼掃描證實**未呼叫** `createSummary()`／`generateQuestions()`／`generateReview()`／`clearSummary()`／`clearQuestions()`／`clearReview()`／`AHS.WrongBookGenerator` —— 不產生新題目、不重建 Summary／WrongBook／Review。
**未產生任何資料時**：`summary = {}`、三個陣列為空，且讀取 Context **不觸發**任何產生（測試驗證讀取後各能力仍為空）。

### Context 為即時視圖
本模組僅持有註冊狀態，學習資料一律即時向擁有者 Runtime 讀取 —— 能力端更新後 Context 立即反映（測試以清除／重新產題驗證），且外部修改回傳值不影響能力端資料。

### Scope（無 LLM／聊天／UI／Parser）
原始碼掃描：零 openai／gemini／anthropic／claude／AIProvider／prompt 字樣；零 fetch／XHR；零 DOM 操作（document／createElement／addEventListener／innerHTML）；零 speech／voice／OCR／pdfjs。

---

## 4. Regression

| 項目 | 結果 |
|---|---|
| **Runtime Regression** | AITutorRuntimeV1 **62/62**｜ReviewGeneratorV1 61/61｜QuestionGenerationRuntimeV1 60/60｜KnowledgeSummaryV1 40/40｜ParserAdapterV1 47/47｜MaterialTextProviderV1 37/37｜AnalysisPipelineIntegration 65/65｜KnowledgeFoundationV1 40/40｜KnowledgeExtractionV1 48/48｜FolderRuntimeV1 39/39｜WrongBookFoundationV1 37/37｜QuestionFoundationV1 29/29｜QuestionGenerationFlow 18/18｜ReviewModelV1 10/10｜PipelineRegression 6/6｜InitializationGuard 6/6｜MaterialDownloadFlow 19/19｜MaterialBatchPersistence 27/27 —— **合計 651 PASS / 0 FAIL** |
| **VerifyPaths** | **PASS**（0 broken／0 legacy references） |
| **ForbiddenPatterns** | **PASS** |
| **jsdom QA** | BehaviorSuite **129 PASS / 0 FAIL** |
| **HTML5 Validator** | html5validator 10 頁 **0 errors** |
| **Console Error** | **0**（新檔未被任何頁面載入，HTML／CSS／既有 JS 逐位未變更；jsdom 各頁 Console Error 斷言全數通過） |

**Runtime Integration 為真實端到端**：Folder → Material → Analysis → Extraction → Knowledge Graph → Summary（KG 衍生）＋Question → WrongBook（真實答錯 3／2／1 次）→ Review，最後由 AI Tutor 整合為單一 Learning Context，四區段逐字比對通過。

---

## 5. Final Self Check

- ☑ **無重複 Runtime** —— 目標路徑原不存在；既有 AI Tutor 資產全屬 UI 層。
- ☑ **無 Architecture Refactor** —— 上游與資料流未動，本模組為鏈末唯讀整合層。
- ☑ **無修改 Baseline** —— 既有檔案 byte-identical（差異數 0）。
- ☑ **無 Scope Creep** —— 公開成員恰七個 API；零 LLM／Provider／聊天／Prompt／語音／OCR／Parser／DOM（原始碼掃描逐項驗證）。
- ☑ **僅完成 Runtime Foundation** —— 未新增任何 UI、未修改任何頁面（tutor.html 與 AI Tutor 元件逐位未變更）。

---

## Acceptance Criteria 對照
✅ AITutorRuntime ✅ Runtime Registration（initialize 四能力註冊＋缺失誠實回報）✅ Runtime Integration（真實端到端）✅ Learning Context Model（LOCK 五欄位相符）✅ Runtime Regression = PASS ✅ VerifyPaths = PASS ✅ ForbiddenPatterns = PASS ✅ jsdom QA = PASS ✅ HTML5 Validator = PASS ✅ Console Error = 0 ✅ 不影響既有 Runtime
