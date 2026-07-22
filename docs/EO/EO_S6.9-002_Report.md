# EO-S6.9-002_Report — AI Question Generation

## Status
COMPLETE — Summary → Generator → Schema v1.0 → Session → Practice 串接完成，全部 QA 通過，提交 PMO Final QA。未 Git Push、未 GitHub QA、LOCK Baseline 零修改（12 檔逐位比對）。

## New Files
- js/parser/QuestionGenerationFlow.js（`AHS.QuestionGenerationFlow.run(materialId, difficulty)`：KP 抽取、決定性建題、三重驗證、dedupe）
- tests/regression/QuestionGenerationFlow.js（18 項 QA）
- docs/Specifications/Question_Generation_Flow_v1.0.md
- docs/QA/QA_EO-S6.9-002_Question_Generation.md

## Modified Files
- js/components/QuestionGuide.js：難度選擇器（易/中等/難）—— 無預設、未選不得開始（Ruling 2B 之呼叫端明確參數）；onStart(difficulty)
- js/components/QuizCenter.js：guide onStart 觸發 Flow.run；Practice 列表唯讀合併 Session 題目；v1.0 字串 explanation 顯示層相容（雙 Schema 皆未變更）
- quiz.html：有序 script 新增 KnowledgeRuntime / LearningQuestionGenerator / LearningQuestionSession / QuestionGenerationFlow
- css/pages/quiz.css：難度選擇器樣式
- tests/jsdom/BehaviorSuite.js：新增 [8][9] 兩節；2 項既有斷言同步明確選難度互動

## 判斷回報（開工前已預告）
traceability.knowledgeId 唯讀取自 KnowledgeRuntime（管線既有血緣，非讀 Material、非呼叫 Parser、零寫入）；題目**內容** 100% 只來自 Summary。查無 Knowledge 記錄時候選誠實拒收。PMO Final QA 可否決此解釋。

## Acceptance 對照
✅ 真實 Summary 可建立 Question（6 KP → 6 題；UI 路徑 5 KP → 5 題）✅ Session 正常寫入（validate-gated）✅✅✅ 無 Mock / Stub / Placeholder（正反向測試）✅ Console Error = 0 ✅ Regression PASS（71 + 18 + 29 + 6）✅ Runtime Baseline 零修改
