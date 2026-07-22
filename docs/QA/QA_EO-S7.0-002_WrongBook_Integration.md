# QA_EO-S7.0-002_WrongBook_Integration（WrongBook Runtime QA Report）

- 日期：2026-07-22｜執行：Claude（Frontend）

## WrongBook Integration QA（jsdom [8][10][11][12]，UI 全流程）
- 答錯 Submit → WrongBookSession 自動建立 1 筆，內容（questionId / correctAnswer / userAnswer）解析自真實題目 ✓
- **答對 → 不建立**（正向反證）✓
- **重複答錯不重建**：仍 1 筆、wrongCount=2、firstWrongAt 逐位不變、masteryLevel 降回 new ✓
- Review Queue 同步：priority = wrongCount（真實資料推導）、nextReviewAt = null（不自動排程）、重複 enqueue 取代更新 ✓

## Practice QA
四種作答互動（單選/是非點選、複選提交、填空精確比對、簡答自評）皆決定性批改；批改後顯示結果 + 標準答案 + 詳解；Exam Mode（AnswerRuntime / AutoGrader）byte-identical、行為零變更（Exam 迴歸斷言維持通過）。

## ReviewQueue QA
Foundation 37 項迴歸全數維持；整合層驗證 enqueue 於 Wrong Book 建立成功後觸發、queue entry 固定四欄。

## Statistics QA
「錯題即時統計」卡：Total Wrong / Active / Archived / New / Learning / Reviewing / Mastered 全部由 `WrongBookSession.statistics()` **即時推導、永不儲存**（jsdom 驗證有錯題 1/1/0/1/0/0/0 與空狀態全 0 兩情境）。

## Empty State
無錯題 → 「**目前沒有錯題紀錄。**」；Mock Seed（W004B 16 筆）已依其自身註解要求全數移除，全頁零 Mock / Stub / Placeholder（jsdom 反向掃描）。

## 全鏈 Regression
jsdom **90/90**（首頁/Material/Quiz/Wrong Book 各頁 Console Error = 0）｜InitializationGuard 6/6｜Pipeline 6/6｜QuestionFoundation 29/29｜GenerationFlow 18/18｜WrongBookFoundation 37/37｜html5validator 10 頁 0 errors｜VerifyPaths / VerifyForbiddenPatterns PASS｜八個 LOCK Runtime（含 LearningQuestionRuntime / LearningQuestionSession / WrongBookRuntime / Exam 三件組）**逐位 byte-identical**。
