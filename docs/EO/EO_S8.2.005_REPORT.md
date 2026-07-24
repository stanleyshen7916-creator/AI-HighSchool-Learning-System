# REPORT.md — EO-S8.2.005｜Review Generator Runtime

## 1. Repository Search

依 Execution Rule 1 先搜尋既有 Review Generator 能力：

| 既有資產 | 內容 | 能否 Reuse 以滿足本 EO |
|---|---|---|
| `js/runtime/ReviewModel.js`（5,457 bytes，EO-S7.0-003） | 唯讀複習查詢層：`getTodayReview／getDueReview／getReviewProgress／getMasteryStatistics／setNextReview`。以 `nextReviewAt` 排程為核心 | **否** —— 無 `reviewItems` 陣列、無 `knowledgeType`、無 high／medium／low priority 列舉（其 priority 來自 ReviewQueue 的數值），Model 與本 EO LOCK 六欄不符；且為 LOCK |
| `js/runtime/ReviewQueue.js`（3,866 bytes，EO-S7.0-001） | Queue Foundation，固定四欄 `{questionId, nextReviewAt, priority(數值), masteryLevel}` | **否** —— 欄位與型別皆不符 LOCK Model；且為 LOCK |
| `js/runtime/ReviewRuntime.js`（1,363 bytes，Sprint 5） | 舊複習會話儲存 | **否** —— 非結果衍生，且為 LOCK |
| `js/parser/WrongBookGenerator.js`（9,403 bytes）＋`js/runtime/WrongBookSession.js`（5,288 bytes） | EO-S7.0-001 錯題能力：Interface（add／update／remove／validate）＋儲存（list／getByQuestionId／statistics…）。記錄含 questionId／materialId／difficulty／wrongCount／masteryLevel／traceability | **是（已 Reuse，唯讀）** —— 本 EO 指定之錯題來源 |
| `js/runtime/QuestionGenerationRuntime.js`（11,061 bytes，EO-S8.2.003） | 題目記錄含 `knowledgeNodeId／knowledgeType／difficulty／traceability{materialId, knowledgeNodeId, paragraph, lineStart, lineEnd}` | **是（已 Reuse，唯讀）** —— 本 EO 指定之 Quiz／Exam Result 來源 |

**目標路徑 `js/runtime/ReviewGeneratorRuntime.js` 不存在** —— 無命名衝突，依指定路徑新增。

**Reuse**：`AHS.WrongBookSession`（錯題記錄，唯讀）、`AHS.QuestionGenerationRuntime`（Quiz／Exam Result，唯讀）。
**New**：`js/runtime/ReviewGeneratorRuntime.js`（`AHS.ReviewGeneratorRuntime`）、`tests/regression/ReviewGeneratorV1.js`。

### ⚠ Flag 1：EO 指名的 `WrongBookGeneratorRuntime` 不存在
本 EO 將唯一錯題來源指名為 `WrongBookGeneratorRuntime`，但 Repository 內**無此模組**（EO-S8.2.004 未送達本開發者）。實際錯題能力為 EO-S7.0-001 的配對：`AHS.WrongBookGenerator`（寫入 Interface）＋ `AHS.WrongBookSession`（儲存）。

處置：Review Generator 僅需**讀取**錯題，故本模組讀取 `WrongBookSession` 的公開查詢 API（同一份錯題資料），且**完全不寫入**錯題（測試以原始碼掃描驗證未出現 `AHS.WrongBookGenerator`）。若日後 `WrongBookGeneratorRuntime` 落地並改變資料位置，本模組只需替換一處讀取來源。

### ⚠ Flag 2：`knowledgeType` 僅存在於結果側
WrongBook Schema v1.0 **不含 `knowledgeType`**（其 traceability 僅有 materialId／knowledgeId／summaryId）。本 EO 的 Review Model 要求該欄位且限定四類。

處置：`knowledgeType`／`knowledgeNodeId`／`difficulty`／paragraph 追溯**一律取自 Quiz／Exam Result 的題目記錄**（EO 允許的第二來源），逐字沿用不改標。若某錯題的 questionId 無法於結果側解析，該筆**跳過**而非猜測型別（測試以獨立教材反證）。

### 整合注意事項（供未來接線 EO）
`QuestionGenerationRuntime.generateQuestions()` 每次呼叫會產生新的題目 id。若錯題記錄建立於舊 id，之後重新產題會使該錯題無法於結果側解析 → 依上述規則被跳過（誠實行為，非缺陷）。未來接線時建議錯題與題目共用同一次產題結果。

---

## 2. Modified Files

**新增**
- `js/runtime/ReviewGeneratorRuntime.js`
- `tests/regression/ReviewGeneratorV1.js`

**修改**
- 無

**未修改**（逐位比對確認 byte-identical）
- `js/runtime/ReviewModel.js`、`js/runtime/ReviewQueue.js`、`js/runtime/ReviewRuntime.js`
- `js/parser/WrongBookGenerator.js`、`js/runtime/WrongBookSession.js`、`js/runtime/WrongBookRuntime.js`
- `js/runtime/QuestionGenerationRuntime.js`、`js/runtime/KnowledgeSummaryRuntime.js`、`js/runtime/SummaryRuntime.js`
- `js/runtime/KnowledgeGraphRuntime.js`、`js/runtime/KnowledgeExtractionRuntime.js`、`js/parser/AnalysisRuntime.js`、`js/parser/MaterialTextProvider.js`、`js/parser/ParserAdapterRegistry.js`、`js/parser/KnowledgePipeline.js`、`js/runtime/MaterialRuntime.js`、`js/runtime/FolderRuntime.js`、`js/runtime/DocumentClassifierRuntime.js`
- 全部 UI（`js/components/`、`js/ui/`）、全部 CSS、全部 HTML（**本 Sprint 未接線任何頁面**）

實測：`diff -rq` 對交付前快照比對，**既有檔案差異數 = 0**。

---

## 3. Architecture Check

| 檢查項 | 結果 |
|---|---|
| Foundation Runtime 未修改 | ✅ 既有 js／css／html 全數 byte-identical |
| Public API 未修改 | ✅ 未觸碰任何既有模組之匯出；LOCK ReviewModel 五個 API 完整保留（測試驗證） |
| Runtime 未重複建立 | ✅ 目標路徑原不存在；既有 Review 資產（ReviewModel／ReviewQueue／ReviewRuntime）Model 與職責皆不同（排程查詢 vs 結果衍生每日清單），且本模組**不寫入** ReviewQueue（測試驗證計數不變） |
| **ReviewGeneratorRuntime 未依賴 SummaryRuntime** | ✅ 原始碼掃描：零 `AHS.SummaryRuntime`、零 `AHS.KnowledgeSummaryRuntime`、零 `AHS.SummaryGenerator` |
| Architecture 未變更 | ✅ 本模組為鏈末唯讀 Consumer；上游模組與資料流未動 |
| Review Source LOCK | ✅ 原始碼掃描證實**零依賴** MaterialRuntime／AnalysisRuntime／KnowledgeExtractionRuntime／**KnowledgeGraphRuntime**／MaterialTextProvider／QuestionGenerationFlow —— 不重新解析教材、不重建 Knowledge Graph；唯一來源為 `WrongBookSession.list()` 與 `QuestionGenerationRuntime.getQuestion()` |
| Memory Runtime Only | ✅ 零 localStorage／sessionStorage／IndexedDB／PersistenceAdapter；零 fetch／XHR |

### Review Model（LOCK，實測相符）
頂層恰為 `materialId / generatedAt / reviewItems`；每筆恰為 `questionId / knowledgeNodeId / knowledgeType / priority / difficulty / traceability`（核心欄位未增減）。

### Knowledge Type（LOCK）
僅 `definition / formula / keyword / concept`；每筆 `knowledgeType` **逐字等於題目記錄之值**（測試逐筆比對，未改標）。

### Review Rules（LOCK）
- Priority 僅 `high / medium / low`，由**決定性規則**推導（非模型推論）：
  `masteryLevel === "mastered"` → **low**；`wrongCount >= 3` → **high**；`wrongCount === 2` → **medium**；其餘 → **low**（測試以 3／2／1 次答錯與 mastered 降級四情境逐一驗證）
- **相同 questionId 不重複建立** —— 同題答錯三次僅產生一筆（測試驗證）
- **每筆 Review Item 皆對應真實 WrongBook 記錄**（測試以 `getByQuestionId` 逐筆反查）
- 排序決定性：high → medium → low，同優先度再依 questionId —— 重複產生結果完全一致（測試驗證）

### Traceability（LOCK）
每筆皆帶 `materialId / questionId / knowledgeNodeId / paragraph / lineStart / lineEnd`；`knowledgeNodeId` 全數可解析回真實 Knowledge Graph 節點（達成「可回溯教材來源」）；`paragraph` 為真實段落序號；`lineStart／lineEnd` **誠實沿用上游 null**（尚無文件 Parser，不虛構）。

---

## 4. Regression

| 項目 | 結果 |
|---|---|
| **Runtime Regression** | ReviewGeneratorV1 **61/61**｜QuestionGenerationRuntimeV1 60/60｜KnowledgeSummaryV1 40/40｜ParserAdapterV1 47/47｜MaterialTextProviderV1 37/37｜AnalysisPipelineIntegration 65/65｜KnowledgeFoundationV1 40/40｜KnowledgeExtractionV1 48/48｜FolderRuntimeV1 39/39｜WrongBookFoundationV1 37/37｜QuestionFoundationV1 29/29｜QuestionGenerationFlow 18/18｜ReviewModelV1 10/10｜PipelineRegression 6/6｜InitializationGuard 6/6｜MaterialDownloadFlow 19/19｜MaterialBatchPersistence 27/27 —— **合計 589 PASS / 0 FAIL** |
| **jsdom** | BehaviorSuite **129 PASS / 0 FAIL** |
| **HTML Validator** | html5validator 10 頁 **0 errors** |
| **Console Error** | **0**（本 Sprint 未接線任何 UI，HTML／CSS／既有 JS 逐位未變更；jsdom 各頁 Console Error 斷言全數通過） |
| 其他稽核 | VerifyPaths **PASS**（0 broken／0 legacy）｜VerifyForbiddenPatterns **PASS** |

Runtime Integration 為真實端到端：Folder → Material → Analysis → Extraction → Knowledge Graph → Question（結果側）→ WrongBook（以 WrongBookGenerator 真實答錯 3／2／1 次建立）→ Review，產出三筆 high／medium／low 清單。

GitHub Pages Console Error = 0：新檔未被任何頁面載入、既有資產零變更，頁面行為與推送前完全一致；實機覆核建議推送後 Ctrl+F5 確認（本環境無 github.io 存取權）。

---

## 5. Final Self Check

- ☑ **無重複 Runtime** —— 目標路徑原不存在；既有 Review 資產職責／Model 不同且本模組不寫入之（測試驗證）。
- ☑ **無 Architecture Refactor** —— 上游與資料流未動，本模組為鏈末唯讀 Consumer。
- ☑ **無修改 Baseline** —— 既有檔案 byte-identical（差異數 0）。
- ☑ **無新增非本 EO 範圍功能** —— 未實作 AI Tutor／PDF／DOCX／OCR；未修改任何 UI；公開成員僅六個 API 與兩個唯讀常數。

（另：本 EO 未列於 Self Check 但同屬 LOCK 的「未依賴 SummaryRuntime」亦已於 §3 以原始碼掃描確認。）

---

## Acceptance Criteria 對照
✅ ReviewGeneratorRuntime ✅ Runtime Integration（真實錯題鏈端到端）✅ Review Model（LOCK 欄位相符）✅ Traceability（六欄位齊備、可回溯真實節點）✅ Runtime Regression = 0 ✅ GitHub Pages Console Error = 0 ✅ 不影響既有功能
