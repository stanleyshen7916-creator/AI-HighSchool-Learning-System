# REPORT.md — EO-S8.3.004｜AI Summary UI Integration

## Repository Search（Reuse Before Create）

| 搜尋項 | 結果 | 處置 |
|---|---|---|
| `material-detail.html` / `MaterialDetail` 元件 | **不存在**（EO 註明「若存在」） | 教材實際檢視介面為 `js/ui/MaterialPreview.js` 開啟的 overlay（materials.html 使用）。AI 重點整理區塊接於此，**不新建頁面** |
| Summary UI 元件 | 僅 `SummaryCenter.js`（獨立 summary.html 頁，五段風格為舊 SummaryRuntime） | 沿用其視覺語言（重點條列＋關鍵字 chip），另建輕量 `MaterialSummaryCard`（KG 衍生 Summary 的呈現） |
| 產生觸發路徑 | `AITutorService`／`AITutorRuntime` 依前兩 EO LOCK 為**純唯讀**（無 createSummary） | EO Files 明確**允許此二檔僅 Integration 修改**：於 Service 新增 `ensureLearningSummary()` 協調產生 |

### ⚠ 兩項架構判斷（請 PMO 知悉）
1. **「Material Detail」= MaterialPreview overlay**：無 material-detail.html，故 AI 區塊接在既有教材預覽 overlay，符合「優先 Reuse 現有元件、不重新設計 UI」。
2. **產生觸發點在 Service（僅 Integration）**：`Material → AITutorService → SummaryRuntime → Render` 的中段，由新增的 `ensureLearningSummary()` 呼叫既有 `KnowledgeSummaryRuntime.createSummary()` 完成。該方法從**已建立的 Knowledge Graph** 衍生摘要，**不重新解析教材**（測試以「再次分析不改變圖譜節點數」佐證）。Service 其餘七個唯讀 API 一字未改。

## Modified Files

**新增**
- `js/ui/MaterialSummaryCard.js`（AI 重點整理呈現元件）
- （測試）`tests/jsdom/BehaviorSuite.js` [21]、`tests/regression/AITutorServiceV1.js` 擴充

**修改**
- `js/runtime/AITutorService.js` —— **僅 Integration**：新增 `ensureLearningSummary()`；既有七個 API 逐字保留
- `js/ui/MaterialPreview.js` —— 於預覽 body 注入 AI 重點整理區塊（一處）
- `materials.html` —— 載入 Knowledge 管線＋能力 Runtime＋AI Tutor 層＋SummaryCard 之 script
- `css/components/qiaoqiao.css` —— 新增 `.mat-summary__*` 樣式（沿用既有 brand／surface／radius tokens，未改既有規則）

**未修改（byte-identical，逐位驗證）**
- **所有 Foundation／能力 Runtime**：MaterialRuntime、KnowledgeGraphRuntime、KnowledgeExtractionRuntime、AnalysisRuntime、KnowledgePipeline、KnowledgeSummaryRuntime、QuestionGenerationRuntime、ReviewGeneratorRuntime、**AITutorRuntime**、SummaryRuntime、WrongBookSession/Generator、FolderRuntime、DocumentClassifierRuntime、MaterialTextProvider、ParserAdapterRegistry
- 其餘所有頁面／元件／CSS

## Architecture Check
- ✅ 未新增 Runtime（MaterialSummaryCard 為 UI 元件；ensureLearningSummary 為 Service 方法）
- ✅ 未修改 Public API（Service 既有七 API 保留，新增之 ensureLearningSummary 為 Integration 方法；AITutorRuntime 完全未動）
- ✅ 未修改 Foundation Runtime（全數 byte-identical）
- ✅ 不重新解析教材（Summary 由既有 Knowledge Graph 衍生；圖譜節點數於再次分析後不變）
- ✅ 未重新設計 UI（沿用既有 tokens 與重點條列／chip 視覺語言）

## Button Click Flow（實測通過）
```
點擊「開始 AI 分析」
  → 顯示「AI 正在分析教材...」
  → AITutorService.ensureLearningSummary(materialId)
  → KnowledgeSummaryRuntime.createSummary（讀既有 Knowledge Graph）
  → Render Summary Card（標題＋重點條列＋關鍵字）
```

## Summary Card 內容（達成 LOCK 最低要求）
標題（教材名稱）＋ 重點條列（核心概念／重要重點，逐字取自教材）＋ 關鍵字 chips；另於有資料時顯示重要定義／公式。空資料時顯示誠實提示並保留分析按鈕。

## Regression
| 項目 | 結果 |
|---|---|
| Runtime Regression | AITutorServiceV1 **63/63**（新增 ensureLearningSummary 涵蓋）＋全鏈 **714 PASS / 0 FAIL** |
| jsdom | BehaviorSuite **142/142**（新增 [21] AI Summary UI 13 項：點擊→loading→卡片→內容逐字→不重新解析→Console 0） |
| VerifyPaths | **PASS**（0 broken／0 legacy） |
| ForbiddenPatterns | **PASS**（AI 區塊零 fetch／XHR／localStorage／indexedDB） |
| HTML5 Validator | 10 頁 **0 errors** |
| Console Error | **0** |

## Acceptance 對照
✅ 點擊「開始 AI 分析」→ ✅ 自動產生 Summary → ✅ Material Detail（預覽 overlay）顯示 AI 重點整理 → ✅ Console Error = 0

## Final Self Check
☑ 無新增 Runtime ☑ 無修改 Public API（僅 Integration）☑ 無修改 Foundation Runtime ☑ 不重新解析教材 ☑ 未重新設計 UI ☑ Console Error = 0

## 誠實邊界（承前 EO）
Summary 內容源自 Knowledge Graph，而圖譜內容取決於教材是否具可讀文字。目前上傳流程仍不收集文字，故僅**具 content 文字**的教材（或文字檔）點擊分析後會有實質重點；無文字者顯示誠實空提示。此為既有管線邊界，非本 EO 缺陷 —— UI 串接本身已完整可用，文字一旦進入系統即自動產出重點。
