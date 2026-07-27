# LegacyDependencyMatrix.md — Sprint AI-014 Phase 1 (Audit Only)

Every row below is derived from real, comment-stripped `grep`/static analysis of this repository — no entry is a guess. Methodology: for each component, every `.js` file outside `tests/` was scanned with block/line comments stripped first (so header-comment mentions like "derives from KnowledgeSummaryRuntime" don't count as a reference), then checked for real `AHS.<Component>` usage; every `.html` page was checked for a matching `<script src>` tag.

## Scope note (real finding, not assumption)

The obvious candidate set — the pre-ai-engine AI Summary content-analysis chain (`MaterialTextPipeline` → `KnowledgePipeline` → `AnalysisRuntime` → `KnowledgeExtractionRuntime` → `KnowledgeGraphRuntime` → `DocumentClassifierRuntime`/`MaterialTextProvider`/`ParserAdapterRegistry`) — turned out to **not be AI-Summary-specific at all**. Every one of these files is also a real, current production dependency of Question Generation (`QuestionGenerationRuntime.js`), Review (`ReviewGeneratorRuntime.js`, `AnswerBuilderRuntime.js`), Exam Bank (`ExamBankRuntime.js`), Folder (`FolderRuntime.js`), and Material Center (`MaterialCenter.js`, `MaterialFileStore.js`) — none of which have any AI-Summary-Migration relationship or New Pipeline equivalent. Only `KnowledgeSummaryRuntime.js` itself is genuinely Summary-specific.

## Dependency Matrix

| 元件 | 被哪些檔案引用（production，去除註解） | 用途 | Compare 使用 | Rollback 使用 | Default 使用 |
|---|---|---|---|---|---|
| `js/runtime/KnowledgeSummaryRuntime.js` | `ai-engine/src/service/SummaryService.js` (3)／`ai-engine/src/service/SummaryProvider.js` (3)／`js/runtime/AITutorRuntime.js` (2)／`js/runtime/AITutorService.js` (1)／`materials.html`（`<script>`） | AI Summary 的 Legacy 儲存與讀取 | ✅ 是（`SummaryComparator`／`SummaryProvider.runCompare()` 的 Legacy 側） | ✅ 是（`setMode("legacy")` 後 `generateLegacySummary()`／`getLegacySummary()` 皆讀寫此處） | ❌ 否（`new` 模式下 Read／Generate 皆不觸碰） |
| `js/runtime/AITutorRuntime.js` | `js/runtime/AITutorService.js` (3)／`materials.html`（`<script>`） | Summary（Legacy fallback）／Question／WrongBook／Review 的唯讀協調層 | 間接（Legacy 側讀取路徑之一） | 間接（`getLearningSummary()` 在 Provider 不存在時的 fallback 路徑） | ✅ 是（Question／WrongBook／Review 三項能力目前完全無 New Pipeline 對應，永遠透過此檔案） |
| `js/parser/MaterialTextPipeline.js` | `js/components/MaterialCenter.js` (4)／`js/runtime/AITutorService.js` (2)／`materials.html`（`<script>`） | 統一文字管線（PDF/DOCX/… → 純文字） | 間接（Legacy 產生鏈的第一步） | 間接（同上） | ✅ 是（`MaterialCenter.js` 等非 Summary 功能持續使用） |
| `js/parser/KnowledgePipeline.js` | `js/runtime/AITutorService.js` (6)／`materials.html`（`<script>`） | 統整 Analysis→Extraction→Graph | 間接 | 間接 | ✅ 是（本身即為多項能力的共用入口） |
| `js/parser/AnalysisRuntime.js` | `js/parser/KnowledgePipeline.js` (2)／`js/runtime/AnswerBuilderRuntime.js` (3)／`js/runtime/KnowledgeExtractionRuntime.js` (4)／`materials.html`（`<script>`） | 文件分析 | 間接 | 間接 | ✅ 是（`AnswerBuilderRuntime` 等非 Summary 功能持續使用） |
| `js/runtime/KnowledgeExtractionRuntime.js` | `js/parser/KnowledgePipeline.js` (2)／`materials.html`（`<script>`） | 知識點擷取 | 間接 | 間接 | ✅ 是 |
| `js/runtime/KnowledgeGraphRuntime.js` | `js/parser/KnowledgePipeline.js`／`js/parser/AnalysisRuntime.js`／`js/runtime/AnswerBuilderRuntime.js`／`js/runtime/QuestionGenerationRuntime.js` (3)／`js/runtime/KnowledgeExtractionRuntime.js` (3)／`js/runtime/AITutorService.js` (2)／`js/runtime/KnowledgeSummaryRuntime.js` (3)／`materials.html`（`<script>`） | 知識圖譜儲存 | 間接 | 間接 | ✅ 是（`QuestionGenerationRuntime` 等直接依賴） |
| `js/runtime/DocumentClassifierRuntime.js` | `js/parser/KnowledgePipeline.js` (2)／`js/runtime/KnowledgeExtractionRuntime.js` (1)／`js/runtime/ExamBankRuntime.js` (2)／`materials.html`（`<script>`） | 文件分類 | 間接 | 間接 | ✅ 是（`ExamBankRuntime` 直接依賴，與 Summary 無關） |
| `js/parser/MaterialTextProvider.js` | `js/parser/MaterialTextPipeline.js`／`js/parser/ParserAdapterRegistry.js`／`js/parser/AnalysisRuntime.js`／`materials.html`（`<script>`） | 文字來源抽象層 | 間接 | 間接 | ✅ 是 |
| `js/parser/ParserAdapterRegistry.js` | `materials.html`（`<script>`）；`.js` 中僅被 `MaterialTextPipeline.js`／`MaterialTextProvider.js` 內部相互引用 | Parser Adapter 註冊表 | 間接 | 間接 | ✅ 是（Material 上傳解析共用） |
| `js/runtime/AITutorService.js`（`generateLegacySummary()` 私有函式，非獨立檔案） | 僅 `ensureLearningSummary()` 內部呼叫（同檔案） | Legacy 產生鏈的觸發點 | ✅ 是（compare 模式下仍執行此鏈） | ✅ 是（legacy 模式下的唯一產生路徑） | ❌ 否（new 模式下完全不執行） |

## Out of Scope（非 AI Summary Legacy，勿與上表混淆）

| 元件 | 說明 |
|---|---|
| `js/runtime/SummaryRuntime.js` | **與本次 AI Summary Migration 完全無關**——這是 Sprint-5「重點整理」功能（`summary.html`）的頂層 Runtime，被 `SummaryCenter.js`／`SummaryGenerator.js`／`LearningPipeline.js`／`QuestionGenerationFlow.js`／`AppHome.js` 使用，從未被任何 EO-AI-\* 或 Sprint AI-\* 觸碰過。多個 ai-engine 檔案的註解明確區分「這不是那個 LOCKED 的 AHS.SummaryRuntime」。 |

## 相關但非 Legacy 的發現（誠實揭露，不在本次 Checklist 範圍）

| 元件 | 說明 |
|---|---|
| `js/ai/SummaryAdapter.js` | 全 Repository（含所有 `.html` 頁面）零真實呼叫端——但這是 **New（ai-engine 側）** 的未接線 scaffolding，不是 Legacy，因此不列入本次「Legacy Removal Checklist」，僅在此誠實記錄供 PMO 參考。 |
