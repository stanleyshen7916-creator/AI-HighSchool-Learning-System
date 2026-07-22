# AnalysisPipeline_Runtime_Report — EO-S8.0-004（Analysis Pipeline Baseline v1.0）

## 固定流程（已啟用，單一 Pipeline）
```
Folder (Study Scope) → Material → Document → DocumentClassifierRuntime
→ AnalysisRuntime → KnowledgeExtractionRuntime → KnowledgeGraphRuntime
```
入口：`AHS.KnowledgePipeline.process(materialId)`（單一教材）／`processFolder(folderId)`（整個 Study Scope）。全程僅透過各 Runtime **公開 API** 串接，未直接操作任何 Runtime 內部資料。

## 五道驗證閘門（任一失敗即停止、零節點寫入）
| 閘門 | 行為 |
|---|---|
| Material 存在 | 否 → `failed` |
| **Folder 存在** | 教材未歸屬有效 Study Scope → `failed`（不得跨 Folder 建立節點） |
| DocumentType 合法 | Classifier validate 失敗 → `failed` |
| AnalysisResult 合法 | 無結果 → `failed`；非 ready → `analysis_insufficient`（success 但零節點） |
| Source Traceability 完整 | 缺任一欄位 → 該節點 rejected，不寫入 |

## 解除項目
- **AnalysisRuntime**：`pending_analysis_pipeline` 鎖解除，回傳真實 `analysisResult`。
- **KnowledgeGraphRuntime**：白名單解除，接受 `knowledge_point`／`definition`／`formula`／`keyword`／`concept`；**永久禁止** summary／question／answer／review／wrongbook／explanation／exam_point／dashboard／progress。
- **KnowledgeExtractionRuntime**：`status = ready` 時正式建立節點。

## 誠實邊界（重要，請 PMO 知悉）
系統**仍無文件內容解析器**（MaterialParser 為永久 stub），AI Provider 依規未綁定（原型禁網路）。因此 AnalysisRuntime 的真實可讀來源只有教材記錄的 `content` 欄位：
- **有文字** → 決定性切段（依空行/換行，長段落再依句號切分），每個 item 逐字保留原文並帶**真實段落序號** `sourceParagraph`；`sourcePage` 因未讀取分頁來源而誠實為 `null`。
- **無文字** → `status: "insufficient_source"`、**零 items**、reason 明示「不得由檔名或二進位內容臆測」。

決定性分段規則（已文件化，非推論）：含 `=`／數學符號 → formulas；含全形/半形冒號 → definitions；長度 ≤12 且無標點 → keywords；其餘 → coreConcepts。

上傳流程目前不收集文字（UI 不得改），故實務上多數教材將回 `insufficient_source`。文字來源就緒後（文字上傳 EO 或 Parser EO），本管線**零改動**即產出真實節點 —— 測試已以真實文字前驗全鏈。

## Source Traceability（六欄位，缺一拒絕）
`knowledgeId`（圖譜指派）／`folderId`／`sourceFileId`／`sourcePage`／`sourceParagraph`／`documentType`。內容節點於 KnowledgeGraphRuntime 層再次強制 folderId + documentType。

## 冪等重跑（本次發現並修正之真實缺陷）
內容節點新增 natural key（type + 原文 + 來源檔 + 段落序號），重跑 Analysis Pipeline **不會重複建立節點**（測試驗證二次寫入後節點數不變）。

## Runtime Rules
KnowledgePipeline／KnowledgeExtractionRuntime／AnalysisRuntime 三檔原始碼**零出現** LearningQuestionGenerator／LearningQuestionSession／AnswerBuilderRuntime／WrongBook／Review／SummaryRuntime 之呼叫；零 fetch/XHR；未建立任何 Summary／Question／Answer／WrongBook／Review。
