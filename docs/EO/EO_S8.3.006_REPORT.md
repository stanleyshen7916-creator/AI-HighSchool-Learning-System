# REPORT.md — EO-S8.3.006｜AI Question UI Integration

## Repository Search（Reuse Before Create）

| 搜尋項 | 結果 | 處置 |
|---|---|---|
| Material 檢視介面 | MaterialPreview overlay（EO-S8.3.004 已於此接入 AI 重點整理） | AI 練習題接於同一 overlay，重點區塊之後（教材→AI 重點→AI 題目） |
| 題目呈現元件 | 無題目卡片元件；有 SummaryCard 的 `.mat-summary__*` 視覺語言 | 建立輕量 `MaterialQuestionCard`，沿用既有卡片／按鈕／loading 樣式，不重新設計 |
| Service 產題協調入口 | 有 `ensureLearningSummary`（S8.3.004/005）但無產題對應 | 依 EO 授權（QuestionRuntime／AITutorService Integration Only）新增 `ensureQuestionSet()` |
| 題目資料來源 | `QuestionGenerationRuntime`（EO-S8.2.003） | 全部題目由此取得，UI 不自建 |

## Modified Files

**新增**
- `js/ui/MaterialQuestionCard.js`（AI 練習題呈現元件，非 Runtime）

**修改**
- `js/runtime/AITutorService.js` —— **Integration Only**：新增 `ensureQuestionSet(materialId, force)`；既有 API 保留
- `js/ui/MaterialPreview.js` —— 於重點區塊後注入 AI 練習題區塊（一處）
- `materials.html` —— 載入 `MaterialQuestionCard.js`
- `css/components/qiaoqiao.css` —— 新增 `.mat-question__*`（沿用既有 tokens 與 `.mat-summary__*` 語言）
- 測試：`tests/jsdom/BehaviorSuite.js` [22]、`tests/regression/AITutorServiceV1.js` 擴充

**未修改（byte-identical）**
- **所有能力／Foundation Runtime**：QuestionGenerationRuntime、KnowledgeSummaryRuntime、AITutorRuntime、KnowledgeGraphRuntime、AnalysisRuntime、MaterialRuntime、KnowledgePipeline 等

## Task 對照

1. **Material Preview 新增「AI 練習題」區塊** ✅ 位於 AI 重點整理之後。
2. **「產生 AI 題目」Button；已有 Summary 直接產生，不重新分析教材** ✅ `ensureQuestionSet` 檢查 KG 是否已建，已建則直接產題；圖譜節點數於產題後不變（測試佐證）。
3. **Question Card 顯示 題號／題目／四個選項，用既有 Card Component** ✅ 沿用 `.mat-summary` 視覺語言；每題題號＋題目＋恰四選項（測試逐題驗證）。
4. **Question Source 全部由 QuestionRuntime，禁止 UI 自建** ✅ 題目經 `AITutorService.ensureQuestionSet → QuestionGenerationRuntime`；測試驗證卡片數等於 Runtime 記錄題數，UI 無任何自建題目/選項/解析。
5. **「查看答案」顯示正確答案＋AI 簡要解析（既有資料，不呼叫新 AI）** ✅ 展開顯示 `question.answer` 與 `question.explanation`（皆為 Runtime 既有欄位）；正確答案在選項之中；可再按隱藏。零新 AI 呼叫（原始碼掃描無 fetch／provider）。
6. **「重新產生題目」重新呼叫 QuestionRuntime，不重新分析教材** ✅ `ensureQuestionSet(id, force=true)` 重新產題；知識圖譜節點數不變（測試佐證）。
7. **Loading「AI 正在產生練習題...」完成後自動 Render** ✅ 點擊後即顯示 loading，產生後自動渲染卡片。

## 資料流（實測通過）
```
點「產生 AI 題目」→「AI 正在產生練習題...」
  → AITutorService.ensureQuestionSet
  → (KG 已建則略過建圖，不重新分析) → QuestionGenerationRuntime.generateQuestions
  → Render 題目卡片（題號＋題目＋四選項）
點「查看答案」→ 顯示正確答案＋既有解析
點「重新產生題目」→ ensureQuestionSet(force) → 重新 Render（KG 不變）
```
實測：文字教材產生 14 題、每題四選項、查看答案顯示答案＋解析且答案在選項內、重新產生後 KG 節點數不變、Console 0。

## Architecture Check
- ✅ 未新增 Runtime（MaterialQuestionCard 為 UI 元件；ensureQuestionSet 為 Service Integration 方法）
- ✅ 未修改 Public API（Service 既有 API 保留）
- ✅ 未修改 Architecture（QuestionRuntime 仍從 KG 產題，UI 僅呈現）
- ✅ 未重新設計 UI（沿用 `.mat-summary__*` 語言與既有 tokens）
- ✅ 不重新分析教材（重新產生題目時 KG 節點數不變）

## Regression
| 項目 | 結果 |
|---|---|
| Runtime Regression | AITutorServiceV1 **68/68** ＋全鏈 PASS（QuestionGenerationRuntimeV1 60、KnowledgeSummaryV1 40、MaterialTextPipelineV1 20…） |
| Question UI Test | BehaviorSuite [22]（20 項：區塊／順序／產生／四選項／來源／查看答案／解析／答案在選項內／重新產生不改 KG／Console 0） |
| jsdom | BehaviorSuite **162/162** |
| VerifyPaths | **PASS** |
| ForbiddenPatterns | **PASS** |
| HTML Validator | 10 頁 **0 errors** |
| Console Error | **0** |

## Acceptance 對照
✅ AI Summary → ✅ AI Question → ✅ 查看答案 → ✅ 重新產生題目 → ✅ Console Error = 0

## 誠實邊界（承 EO-S8.3.005）
題目源自 Knowledge Graph，圖譜內容取決於教材文字。文字教材（.txt/.md/.json）點擊後產生真實題目；無文字教材（PDF/圖片等，尚無 parser）顯示「尚無可出題的內容」誠實提示。UI 串接本身完整可用。
