# REPORT.md — EO-S8.3.005｜Material Text Pipeline Integration

## Repository Search（Reuse Before Create）

| 搜尋項 | 結果 | 處置 |
|---|---|---|
| 上傳流程是否收集教材文字 | **否** —— MaterialCenter 兩條上傳路徑從未寫入 `content`，這正是全 Sprint 8 反覆記錄的瓶頸 | 於上傳流程接入 Text Pipeline，讀取文字型別檔案之真實內容存入 content |
| 統一文字入口 | 既有 `MaterialTextProvider`（單一文字入口）＋`ParserAdapterRegistry`（txt adapter 支援 TXT/MD/MARKDOWN/JSON/TEXT） | **Reuse** —— 取得已存文字經此路徑，不重複造輪 |
| Summary／Question 是否直接讀 Material | **否** —— 兩者早已只從 Knowledge Graph 讀取（EO-S8.2.002／003） | 無需改動，符合「不得直接讀取 Material」 |

### 核心缺口與修補
Text Pipeline 的架構其實在前面 EO 已大致齊備（Provider＋txt adapter），唯一缺的是「**上傳時把文字檔內容真的讀進來**」。本 EO 允許修改 Material Upload Flow，故補上這關鍵一步 —— 完成後 Summary／Question 首次能用**真實教材文字**而非空資料。

## Modified Files

**新增**
- `js/parser/MaterialTextPipeline.js`（統一 Text Pipeline，parser 層 helper，非 Runtime）
- `tests/regression/MaterialTextPipelineV1.js`（20 項）

**修改**
- `js/components/MaterialCenter.js` —— 上傳流程（單檔＋批次）於 `add()` 前呼叫 `MaterialTextPipeline.readFile()` 擷取文字存入 content
- `js/runtime/AITutorService.js` —— `ensureLearningSummary()` 改由 Text Pipeline 取得文字（不讀 upload object），並驅動 KnowledgePipeline 建圖後產生 Summary；無文字回統一 `No readable content`
- `materials.html` —— 載入 `MaterialTextPipeline.js`

**未修改（byte-identical，逐位驗證）**
- 全部 Foundation／能力 Runtime：MaterialRuntime、KnowledgeGraphRuntime、KnowledgeSummaryRuntime、QuestionGenerationRuntime、AnalysisRuntime、KnowledgeExtractionRuntime、KnowledgePipeline、MaterialTextProvider、ParserAdapterRegistry、AITutorRuntime、ReviewGeneratorRuntime 等

## Task 對照

1. **統一文字取得流程，回傳 {text, title, metadata}** ✅ `MaterialTextPipeline.getText()` 回傳此格式；無文字回統一結果。
2. **MaterialRuntime 僅提供資訊、呼叫 Pipeline，不解析內容** ✅ Runtime 未改（byte-identical）；解析（讀檔）由 Pipeline 於上傳流程完成，Runtime 只儲存 content 字串。
3. **AITutorService 改由 Text Pipeline 取得文字，不讀 Upload Object** ✅ `ensureLearningSummary` 透過 `MaterialTextPipeline.getText(materialId)` 取得，無任何 File／upload 物件引用。
4. **Summary Runtime 輸入 Learning Context，不直接讀 Material** ✅ KnowledgeSummaryRuntime 原始碼零 `AHS.MaterialRuntime`（僅讀 Knowledge Graph）。
5. **Question Runtime 不自行解析教材** ✅ QuestionGenerationRuntime 原始碼零 `AHS.MaterialRuntime`（僅讀 Knowledge Graph）。
6. **無可讀文字 → 統一 `No readable content`，不得 Throw** ✅ Pipeline 與 Service 皆回 `{ status: "no_readable_content", message: "No readable content" }`；測試以 try/catch 驗證不 throw。

## 資料流（實測通過）
```
上傳文字檔
  → MaterialTextPipeline.readFile（FileReader 讀真實文字）
  → MaterialRuntime.add(content=真實文字)
  → 點「開始 AI 分析」→ AITutorService.ensureLearningSummary
  → MaterialTextPipeline.getText → KnowledgePipeline.process（Analysis→Extraction→KG）
  → KnowledgeSummaryRuntime.createSummary（讀 KG）→ Summary
  → QuestionGenerationRuntime 亦可用同一 KG 產題
```
實測：62 字文字檔 → KG 建立 5 個內容節點 → Summary 產生、Question 可產題；PDF → 統一 No readable content、不 throw。

## Architecture Check
- ✅ 未新增 Runtime（MaterialTextPipeline 為 parser 層 helper）
- ✅ 未修改 Public API（AITutorService 既有 API 保留；ensureLearningSummary 為既有 Integration 方法之強化）
- ✅ 未修改 Architecture（管線順序不變；Runtime 不自行解析）
- ✅ Runtime 無重複解析（Summary 再產生不改變 KG 節點數，測試佐證）

## Regression
| 項目 | 結果 |
|---|---|
| Runtime Regression | MaterialTextPipelineV1 **20/20** ＋全鏈 **PASS**（AITutorServiceV1 62、KnowledgeSummaryV1 40、QuestionGenerationRuntimeV1 60…） |
| Text Pipeline Test | 專屬 20 項（格式／擷取／No readable content 不 throw／全鏈 KG→Summary→Question／無重複解析） |
| jsdom | BehaviorSuite **142/142**（含 [21] AI Summary UI） |
| VerifyPaths | **PASS** |
| ForbiddenPatterns | **PASS** |
| Console Error | **0** |

## Acceptance 對照
✅ Summary 使用教材文字 ✅ Question 使用教材文字 ✅ Runtime 無重複解析 ✅ Console Error = 0

## 里程碑
本 EO 打通了整個 Sprint 8 反覆記錄的最後瓶頸：**文字終於能進入系統**。自此，上傳 .txt／.md／.json 等文字檔後，AI 重點整理與練習題會基於真實教材內容產生。PDF／DOCX／圖片等二進位格式仍無 parser（誠實回 No readable content）—— 若要支援，需後續 EO 為 ParserAdapterRegistry 實作對應 adapter（架構已預留插槽，屆時 Text Pipeline 零改動即可接入）。
