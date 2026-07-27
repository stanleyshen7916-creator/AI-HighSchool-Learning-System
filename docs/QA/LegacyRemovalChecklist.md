# LegacyRemovalChecklist.md — Sprint AI-014 Phase 1 (Audit Only)

Derived directly from `LegacyDependencyMatrix.md`. **No code was deleted to produce this checklist.**

| 元件 | Default | Compare | Rollback | 引用數（production，去除註解） | 建議 |
|---|---|---|---|---|---|
| `js/runtime/KnowledgeSummaryRuntime.js` | ❌ | ✅ | ✅ | 4 檔（+ `materials.html` script tag） | **KEEP** |
| `js/runtime/AITutorRuntime.js` | ✅（Question/WrongBook/Review） | 間接 | 間接 | 1 檔（+ script tag） | **KEEP** |
| `js/parser/MaterialTextPipeline.js` | ✅（MaterialCenter 等） | 間接 | 間接 | 2 檔（+ script tag） | **KEEP** |
| `js/parser/KnowledgePipeline.js` | ✅（多能力共用入口） | 間接 | 間接 | 1 檔（+ script tag） | **KEEP** |
| `js/parser/AnalysisRuntime.js` | ✅（AnswerBuilderRuntime 等） | 間接 | 間接 | 2 檔（+ script tag） | **KEEP** |
| `js/runtime/KnowledgeExtractionRuntime.js` | ✅ | 間接 | 間接 | 1 檔（+ script tag） | **KEEP** |
| `js/runtime/KnowledgeGraphRuntime.js` | ✅（QuestionGenerationRuntime 等直接依賴） | 間接 | 間接 | 6 檔（+ script tag） | **KEEP** |
| `js/runtime/DocumentClassifierRuntime.js` | ✅（ExamBankRuntime 直接依賴） | 間接 | 間接 | 3 檔（+ script tag） | **KEEP** |
| `js/parser/MaterialTextProvider.js` | ✅ | 間接 | 間接 | 3 檔（+ script tag） | **KEEP** |
| `js/parser/ParserAdapterRegistry.js` | ✅（Material 上傳解析共用） | 間接 | 間接 | 2 檔（+ script tag） | **KEEP** |
| `js/runtime/AITutorService.js` 的 `generateLegacySummary()` | ❌ | ✅ | ✅ | 同檔案內部呼叫 | **KEEP**（且無法單獨移除——修改需異動 `AITutorService.js`，該檔案本身受本 Sprint／多個先前 EO 的 Forbidden 清單保護） |

## Category 分類（依 Part C 定義）

- **Category A（仍被 Default 引用，禁止刪除）**：`AITutorRuntime.js`、`MaterialTextPipeline.js`、`KnowledgePipeline.js`、`AnalysisRuntime.js`、`KnowledgeExtractionRuntime.js`、`KnowledgeGraphRuntime.js`、`DocumentClassifierRuntime.js`、`MaterialTextProvider.js`、`ParserAdapterRegistry.js`——全部因服務 Question／WrongBook／Review／Exam Bank／Material Center 等與 AI Summary Migration 無關的現行功能而必須保留。
- **Category B（僅 Compare 使用，保留）**：無獨立成立的項目——`KnowledgeSummaryRuntime.js` 同時被 Compare 與 Rollback 使用（見下）。
- **Category C（僅 Rollback 使用，保留）**：無獨立成立的項目——理由同上。
- **`KnowledgeSummaryRuntime.js` 與 `generateLegacySummary()`**：同時屬於 Compare 與 Rollback 依賴，兩者缺一即無法保留另一項能力，故合併列為「Compare + Rollback」，**KEEP**。
- **Category D（Repository 完全無引用，Candidate）**：**本次盤點下真實結果為 0 筆**。詳見下方「誠實結論」。

## 誠實結論：目前無任何 REMOVE 建議

本次盤點（`docs/QA/LegacyDependencyMatrix.md` 的完整 grep 證據）顯示：**AI Summary 的 Legacy 鏈路目前沒有任何元件可以標記為 REMOVE。**

- `KnowledgeSummaryRuntime.js`（唯一真正「AI Summary 專屬」的 Legacy 元件）仍被 Compare 與 Rollback 兩項現行能力直接依賴。
- 其餘所有「內容分析鏈」元件（`MaterialTextPipeline`／`KnowledgePipeline`／`AnalysisRuntime`／`KnowledgeExtractionRuntime`／`KnowledgeGraphRuntime`／`DocumentClassifierRuntime`／`MaterialTextProvider`／`ParserAdapterRegistry`）根本不是 AI Summary 專屬——它們是 Question Generation／Review／Exam Bank／Material Center 等現行功能的共用基礎設施，與 AI Summary 是否完成 Migration 無關，刪除任何一個都會破壞這些不相關的現行功能。

這不是盤點不完整，而是這個 Repository 目前真實的依賴結構如此。**Candidate 清單為空**，不代表本次審查未完成——完成度已達 100%（每個元件皆有 grep 證據佐證的引用來源，見 Dependency Matrix）。

## 誠實揭露（相關但非本次範圍）

`js/ai/SummaryAdapter.js`——全 Repository 零真實呼叫端，但這是 New（ai-engine）側的未接線 scaffolding，不是 Legacy，因此不出現在上表；僅供 PMO 參考是否要在其他 EO 中處理。

## Completion Criteria

- ☑ 所有 Legacy 元件完成盤點（10 個真實候選 + 1 個私有函式，逐一列出）
- ☑ 每個元件都有引用來源（見 Dependency Matrix 的 grep 證據）
- ☑ 每個元件都有 KEEP／CANDIDATE／REMOVE 建議（本次結果：全數 KEEP，0 個 CANDIDATE，0 個 REMOVE——如上「誠實結論」所述，這是真實資料的結果，非省略）
