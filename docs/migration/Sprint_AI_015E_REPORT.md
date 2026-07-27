# REPORT.md — Sprint AI-015E｜Quiz Production Cutover (resolved via EO-AI-015E-002, Option A)

Priority：P0 ｜ Type：Production Integration ｜ Baseline：LOCKED｜完成後停止，等待 PMO QA，不得開始 Sprint AI-015F。

## Objective

完成 Learning Runtime → Quiz Production 正式切換：Quiz 成為純 Read 元件，100% 讀取 `LearningQuestionRuntime`，不再自行觸發任何 Question 產生。

## Development Summary (full Sprint arc)

### Part A — Repository Audit（`docs/Architecture/QuizReadFlow.md` §1-3）

發現 Quiz 目前讀取 `LearningQuestionRuntime` + `LearningQuestionSession` 的聯集，而非單一來源；發現規格假設的「Session → Runtime」箭頭並非真實程式路徑；發現 `WrongBookGenerator` 硬編碼僅解析 `LearningQuestionSession`，若直接砍掉 Session 讀取會讓 WrongBook 寫入路徑歸零——依 Stop Condition ① 回報，PMO 否決原始四方案，改要求 Session Identity Audit。

### Part B（第一次嘗試）— 發現第二層真實架構衝突

實作 Identity Mapping Helper 後，發現移除 Quiz 對 `QuestionGenerationFlow.run()` 的呼叫會讓 `summary.html`→Guide→Practice 深連結整條路徑失效（BehaviorSuite 7 個測試區塊崩潰）——命中 Stop Condition ④⑤，停止並回報。

### EO-AI-015E-002 — Architecture Resolution（純分析，見 `docs/Architecture/QuestionPipelineAnalysis.md`）

確認 `QuestionGenerationFlow.run()` 是 Legacy Generator（僅寫 Session，從未寫 Runtime，源自 SummaryRuntime）；確認 `AITutorService.ensureQuestionSet()` + `QuestionProviderBridge.bridge()` 個別完整但**從未被任何生產程式碼串接**——這才是真正的 Architecture Gap，不是 Quiz、WrongBook 或任何 Runtime API 的問題。PMO 核准 Option A：在 `materials.html` 端組合生產管線，Quiz 維持純 Read。

### Part B（重新實作，Option A）

- `js/ui/MaterialQuestionCard.js`：「產生 AI 題目」按鈕成功產生內容後，額外呼叫 `AHS.QuestionProviderBridge.bridge(item.id)`——兩個呼叫皆為既有、未修改的公開 API，零新 Runtime，零第二套管線。
- `js/components/QuizCenter.js`：`buildPracticeListView()` / `showQuestionGuide()` 移除 Session 聯集，改為 100% 讀取 `LearningQuestionRuntime`；`showQuestionGuide().onStart()` 移除對 `QuestionGenerationFlow.run()` 的呼叫（Quiz 不再自行建立 Question）；新增 `wrongBookQuestionId()`——唯讀 Identity Mapping，依 `materialId` + `traceability.knowledgeId` + 逐字相同的 `question` 文字，將顯示中的 Runtime 記錄對應回其 Session 對應題，供 `WrongBookGenerator.add()` 正確解析（`WrongBookGenerator.js` 本身零修改）。

### Part C — Legacy Compatibility

Exam Loop（`QuestionRuntime`/`QuestionBank`/`ExamRuntime`/`AutoGrader`）零觸碰，`git diff` 逐檔確認。

### Part D/E — Runtime + Repository Validation

見 `docs/QA/QuizProductionValidation.md`：3 份真實教材（數學/生物/歷史）經真實「產生 AI 題目」按鈕觸發，全欄位（題目/選項/答案/Explanation/Difficulty/Knowledge Node/Material ID）驗證通過，42/42 PASS；Regression 章節逐檔確認 Forbidden List 零修改。

### Part F — Browser Validation

Chromium 二進位檔存在於本環境但 `playwright` 套件未安裝，Edge/Safari/Firefox 皆不可用——依既有慣例（比照 `html5validator`）標示為 Environment Limitation，未安裝新依賴以維持本 Sprint 授權範圍。

### Part H — QA

`npm test` 175/175、`npm run verify` PASS、`tests/regression/*.js` 19 個檔案全數 PASS。

## MVP Scope（依 EO-AI-015E-002 明確授權，非本 Sprint 自行決定）

- 難度選擇器 UI 保留（`QuestionGuide.js` 未修改），但其選擇不再驅動任何生成——`onStart()` 不再接收 `difficulty` 參數。難度強化延後至 AI-016。
- 題型維持 `single_choice`（`QuestionGenerationRuntime` 的 LOCK 產出），四種舊題型生成延後至 AI-016，本 Sprint 未擴充 Generator。

## Changed Files

**修改（3 檔案）**
```
js/components/QuizCenter.js     — Identity Mapping + Runtime-only Read + 移除 QuestionGenerationFlow 觸發
js/ui/MaterialQuestionCard.js   — 「產生 AI 題目」按鈕組合 ensureQuestionSet() + bridge()
tests/jsdom/BehaviorSuite.js    — 新增 seedProductionQuestions() 共用 Helper；重寫 4 個依賴已退場路徑的測試區塊（[8][10][11][14]），其餘不變
```

**新增（4 檔案，Deliverables）**
```
docs/Architecture/QuizReadFlow.md              （Part A + §4 Resolution）
docs/Architecture/QuestionPipelineAnalysis.md  （EO-AI-015E-002）
docs/QA/QuizProductionValidation.md
docs/migration/Sprint_AI_015E_ArchitectureResolution.md
```

**新增（2 檔案，本 REPORT 系列）**
```
docs/migration/EO_AI_015E_002_REPORT.md
docs/migration/Sprint_AI_015E_REPORT.md
```

**零修改（Forbidden List，`git diff` 逐檔確認）**
```
QuestionGenerationRuntime.js / QuestionProviderBridge.js /
LearningQuestionSession.js / LearningQuestionRuntime.js /
QuestionRuntime.js / QuestionBank.js / WrongBookGenerator.js /
WrongBookSession.js / Review* / Summary 相關檔案 / KnowledgeGraphRuntime.js
— 全數未觸碰，任何 LOCK Runtime API 未修改。
```

## QA

- ☑ `npm test`：175 PASS / 0 FAIL
- ☑ `npm run verify`：PASS
- ☑ `tests/regression/*.js` 19 檔全數 PASS
- ☑ Part D/E Repository Validation：42/42 PASS（3 份真實教材）
- ☐ Part F Browser Validation：Environment Limitation（已誠實標示，非判定失敗）
- ☑ Forbidden List 零修改（逐檔 `git diff` 確認）

## Root Cause

初次 Part B 失敗的根因並非 Quiz/WrongBook 邏輯錯誤，而是 Production Pipeline（`ensureQuestionSet` + `bridge`）自 Sprint AI-015C 建置以來從未被任何生產程式碼串接觸發——EO-AI-015E-002 的分析找到並修復了這個真正的 Architecture Gap。

## Impact Analysis

Quiz Practice Mode 的內容來源從「聯集讀取 + Quiz 自行觸發生成」變為「單一 Production Pipeline（materials.html 觸發）+ Quiz 純讀取」。使用者體感差異：學生需先在 materials.html 對該教材點擊過「產生 AI 題目」，`summary.html`→Guide→Practice 深連結才會顯示內容；尚未產生過的教材會顯示既有、誠實的 Empty State，而非崩潰或假資料。

## Regression

零回歸——`npm test`/`npm run verify`/19 個 regression 檔案全數 PASS，`git diff` 確認 Forbidden List 檔案零修改，Exam Loop 結構性不受影響。

## QA Summary

Sprint AI-015E 經過一次真實架構衝突發現、一次 PMO 否決重新導向（Session Identity Audit）、一次第二層真實架構衝突發現與回報（EO-AI-015E-002）、PMO Option A 核准後才完成實作——全程未曾在偵測到真實回歸時強行推進，每次都以真實證據（Repository 原始碼、真實 jsdom 測試執行結果）停止並回報，最終方案零新增 Runtime、零 Runtime API 修改、零第二套 Pipeline，完全依現有元件組合達成。

## 完成後

依 Sprint 指示，**完成 Commit、Push 後停止**，等待 PMO QA，**不得開始 Sprint AI-015F**。
