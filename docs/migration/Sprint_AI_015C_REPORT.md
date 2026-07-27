# REPORT.md — Sprint AI-015C｜Question Provider Bridge

Priority：P0 ｜ Type：Implementation Sprint ｜ Baseline：Sprint AI-015A/B（Architecture Audit / Learning Loop Unification Design, Proposal B）｜ Auto Continue：Part A→F→Commit→Push→停止，不得開始 Sprint AI-015D。

## Objective

完成 `QuestionGenerationRuntime → Question Provider Bridge → LearningQuestionSession / LearningQuestionRuntime` 的 Bridge，僅負責 Data Shape Mapping，不修改任何既有 Runtime。

## Development

### Part A — Repository Audit / Mapping Table

逐一 `Read` 完整原始碼確認五個檔案的真實資料結構：`QuestionGenerationRuntime.js`（來源）、`LearningQuestionGenerator.js`（Schema v1.0 封裝器）、`LearningQuestionSession.js`（Write Target A）、`LearningQuestionRuntime.js`（Write Target B）、`QuestionGenerator.js`（Target B 底層封裝器，Mode A `generateOriginalQuestion`）。完整逐欄位對照表見 `docs/Architecture/QuestionProviderBridgeMapping.md`。

**真實架構衝突（依 Sprint Stop Condition (1) 回報，已由 PMO 於本 Sprint 執行前核准選項 1）**：`materials.html`（`QuestionGenerationRuntime` 唯一所在頁面）原本未載入 `js/parser/LearningQuestionGenerator.js` 與 `js/runtime/LearningQuestionSession.js`，導致 Write Target A（`LearningQuestionSession`）在該頁面完全無法觸及（`add()` 自身的防禦性 guard 會安全回傳 `null`，不會拋錯，但等同於「Bridge 靜默寫入 0 筆 Session 記錄」的真實功能缺口）。Write Target B（`LearningQuestionRuntime`）本身已完整可用（`QuestionGenerator.js` 早已載入於 `materials.html`）。PMO 核准選項 1：於 `materials.html` 補上兩個 `<script>` 標籤（Script Wiring，比照 EO-AI-012A 先例），使兩個 Write Target 皆可從 Bridge 所在頁面觸及。

### Part B — Provider Adapter

`js/runtime/QuestionProviderBridge.js`（新檔案）。Bridge 僅執行：
1. 唯讀查詢：`AHS.QuestionGenerationRuntime.getQuestionsByMaterial(materialId)`（從不呼叫 `generateQuestions()`）、`AHS.MaterialRuntime.getById(materialId)`、`AHS.KnowledgeGraphRuntime.getNode(knowledgeNodeId)`。
2. 依 Mapping Table 建構兩種 Target 各自的 `input` 物件（`buildSessionInput` / `buildRuntimeInput`）。
3. 呼叫既有、未修改的公開 API 完成寫入。

不含任何 Question 產生邏輯、AI 邏輯，或 Session/Runtime 自身的儲存邏輯 — 全部委由既有函式處理。

### Part C — Question Provider Bridge

`AHS.QuestionProviderBridge.bridge(materialId)`：對指定教材的每一題，同時寫入 `LearningQuestionSession`（經 `LearningQuestionGenerator.generate()` → `LearningQuestionSession.add()`，validate-gated）與 `LearningQuestionRuntime`（經 `LearningQuestionRuntime.sync()` → 內部呼叫 `QuestionGenerator.generate({mode:"original",...})`，確保走 Mode A 真實內容路徑而非 Mode B `[Stub]` 路徑）。回傳 `{materialId, total, sessionAdded, runtimeAdded, results}`，任一題只要其目標自身的 validate-gate 拒絕，就誠實反映在計數中，從不假裝寫入成功。從未直接寫入 Quiz（`QuizCenter`/`AppQuiz.js` 完全未觸碰，繼續各自獨立讀取兩個既有 Store）。

### Part D — Runtime Validation

以 `materials.html` 真實 `<script>` 載入順序（jsdom），透過生產路徑 `AHS.AITutorService.ensureQuestionSet(materialId)`（EO-S8.3.006 既有「產生 AI 題目」入口，非本 Sprint 自建）產生真實 `QuestionGenerationRuntime` 記錄，再呼叫 `QuestionProviderBridge.bridge()`，驗證：
- `LearningQuestionRuntime`／`LearningQuestionSession` 收到的內容為真實文字（非 `[Stub]` 前綴）。
- `LearningQuestionRuntime` 記錄 `metadata.mode === "original"`（從未落入 `ai_generated` Stub 路徑）。
- Traceability（`materialId` + `knowledgeId`）皆為真實值。
- 跨兩份不同教材（history 稀疏內容 / biology 豐富內容）驗證：無內容混雜、稀疏內容誠實處理（不足 3 個真實干擾選項時 Form B 誠實略過，Bridge 不因此當掉或捏造）。
- 重跑 `bridge()` 不去重（因兩個 Target Runtime 自身本就不去重，Bridge 不得比目標 Runtime 更聰明或更笨，如實反映既有語意）。
- `bridge()` 對不存在教材／缺少 materialId 皆誠實回傳 `null`。

共 35 項斷言全數 PASS，materials.html 全流程 Console errors = 0。驗證腳本為暫存腳本（`_scratch_ai015c_partd.js`），驗證完成後已刪除，未納入版本控制（比照既有慣例）。

### Part E — Regression

- `quiz.html` 完全未修改（`git diff --name-only` 確認）— Loop A（Exam Mode）與 Loop B（Practice Mode）所在頁面零異動。
- 僅 `materials.html` 一個既有檔案被修改（兩個 `<script>` 標籤 + 一行 Bridge 標籤），無 Forbidden List 中任何檔案（`QuestionGenerationRuntime.js`／`LearningQuestionSession.js`／`LearningQuestionRuntime.js`／`QuestionGenerator.js`）被修改（`git diff` 逐檔確認零異動）。
- `npm test`（BehaviorSuite + PipelineRegression）：174 PASS / 0 FAIL，含既有 [21][22][23] 三項 Material AI 相關測試全數維持 PASS，證明 Material AI（Loop C）未受影響。
- `tests/regression/*.js` 全 19 個檔案逐一執行，全數 PASS（詳見 QA 章節）。

### Part F — QA

見下方 QA 與 QA Summary 章節。

## Changed Files

**新增（2 檔案，程式碼／文件 Deliverables）**
```
js/runtime/QuestionProviderBridge.js
docs/Architecture/QuestionProviderBridgeMapping.md
```

**新增（1 檔案，本 REPORT）**
```
docs/migration/Sprint_AI_015C_REPORT.md
```

**修改（1 檔案，Script Wiring，PMO 已核准）**
```
materials.html   — 新增 3 個 <script> 標籤：
                    js/parser/LearningQuestionGenerator.js
                    js/runtime/LearningQuestionSession.js
                    js/runtime/QuestionProviderBridge.js
```

**零修改（Forbidden List，已逐檔確認）**
```
js/runtime/QuestionGenerationRuntime.js   — 未修改
js/runtime/LearningQuestionSession.js     — 未修改（僅新增 <script> 載入，檔案內容零異動）
js/runtime/LearningQuestionRuntime.js     — 未修改
js/parser/QuestionGenerator.js            — 未修改
quiz.html / wrongbook.html / review.html  — 未修改
js/components/QuizCenter.js               — 未修改
ai-engine/**                              — 未修改
```

## QA

- ☑ `npm test`（BehaviorSuite + PipelineRegression）：174 PASS / 0 FAIL
- ☑ `npm run verify`（VerifyPaths + VerifyForbiddenPatterns）：PASS（0 broken paths / 0 legacy references / 0 forbidden-pattern hits；既有 1 項 KNOWN-ISSUE `window.location.href` in `HomeRecentMaterials.js` 為既有追蹤中例外，非本 Sprint 引入）
- ☑ `tests/regression/*.js` 全 19 個檔案逐一執行：AITutorRuntimeV1 (62) / AITutorServiceV1 (68) / AnalysisPipelineIntegration (65) / FolderRuntimeV1 (39) / InitializationGuard (6) / KnowledgeExtractionV1 (48) / KnowledgeFoundationV1 (40) / KnowledgeSummaryV1 (40) / MaterialBatchPersistence (27) / MaterialDownloadFlow (19) / MaterialTextPipelineV1 (20) / MaterialTextProviderV1 (37) / ParserAdapterV1 (47) / PipelineRegression (6) / QuestionFoundationV1 (29) / QuestionGenerationFlow (18) / QuestionGenerationRuntimeV1 (60) / ReviewGeneratorV1 (61) / ReviewModelV1 (10) / WrongBookFoundationV1 (37) — 全數 0 FAIL
- ☑ Part D Runtime Validation：35 項斷言 PASS（Bridge 雙寫、真實內容非 Stub、跨教材零混雜、稀疏內容誠實處理、null 安全路徑）
- ☐ `npm run validate:html`（html5validator）：本環境未安裝 html5validator/Java，依 CLAUDE.md 已知限制略過（非本 Sprint 引入之缺口）
- ☑ 手動審查：`materials.html` diff 僅 3 行 `<script>` 新增，無其他變更；`QuestionProviderBridge.js` 無 Business Logic／AI Generation／Session Logic，純 Shape Mapping + 既有公開 API 呼叫

## Root Cause

無（Feature Implementation Sprint，非 Bug Fix）。

## Impact Analysis

新增 1 個 Runtime 檔案（`QuestionProviderBridge.js`）與 2 份文件；修改 1 個既有 HTML 檔案僅新增 3 行 `<script>` 標籤。未修改任何 Forbidden List 檔案的內容、未修改任何既有 Public API、未修改 Quiz/WrongBook/Review/Summary/AI Engine/Exam Runtime/QuestionBank。Bridge 目前未被任何 UI 觸發（無按鈕/事件呼叫 `AHS.QuestionProviderBridge.bridge()`）— 與 Sprint AI-015B Roadmap Phase 1 的「Foundation Bridge，尚未接上觸發點」定位一致，UI Wiring 屬於後續 Sprint 範圍。

## Regression

`npm test` 174/174、19 個 `tests/regression/*.js` 全數 PASS、`npm run verify` PASS，`quiz.html` 零異動確認 Loop A/Loop B 結構性不受影響。無回歸。

## QA Summary

Sprint AI-015C 的 Bridge 已完成並以真實 jsdom 執行流程（`materials.html` 真實載入順序、真實 `AITutorService.ensureQuestionSet()` 生產路徑）驗證雙寫至 `LearningQuestionSession` 與 `LearningQuestionRuntime` 皆為真實內容、皆通過各自既有的 validate-gate、且不觸及 Forbidden List 中任何檔案。過程中發現的真實 Script Wiring 缺口已依 Sprint Stop Condition 誠實回報並取得 PMO 核准後實作，未自行決策擴大範圍。

## 完成後

依 Sprint 指示，**完成 Part A→F、Commit、Push 後停止，不得開始 Sprint AI-015D**。
