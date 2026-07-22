# QA_EO-S6.9-002_Question_Generation（Question Generation QA Report）

- 日期：2026-07-22｜執行：Claude（Frontend）

## Question Generation QA（tests/regression/QuestionGenerationFlow.js）
真實 Summary（2 核心概念 + 2 定義 + 1 易錯 + 1 必背 = 6 KP）→ **6 題全數生成**；型別對應正確（2 single_choice / 1 short_answer / 2 true_false / 1 fill_blank）；difficulty 全為呼叫端傳入值，非法/缺漏 difficulty 一律 abort（Ruling 2B）；Answer / Explanation / KnowledgePoint / Traceability 全數非空且真實對應（materialId + knowledgeId + summaryId）；fill_blank 答案驗證為 Summary 原句片段；全文掃描零 Mock / Stub / Placeholder / Lorem；reviewSuggestions 不產題。

## Session QA
同難度重跑 6 題全數 dedupe skip（零重複）；不同難度為新題；Session status 推導正確；**LearningQuestionRuntime 全程零寫入**。

## Schema QA（tests/regression/QuestionFoundationV1.js 迴歸）
29/29 PASS —— v1.0 三重驗證、enum LOCK、反向案例全數維持。

## Pipeline QA
Summary 五段全空 → `no_content`、零題、零假資料；無 Summary → `no_summary`、零題。jsdom [9]：空內容 Summary 經 UI 完整流程後顯示「**AI 正在建立練習題……**」且 Session 計數 0。

## UI / Regression（tests/jsdom/BehaviorSuite.js）
**71 PASS / 0 FAIL** —— 新增 [8][9] 兩節：難度選擇器無預設、未選不得開始、選後啟用；真實 Summary 經 UI 產 5 題並顯示於 Practice 列表；v1.0 字串 explanation 詳解區塊正常渲染；既有 61 項全數維持（其中 2 項依 Ruling 2B 同步「明確選難度」互動）。Pipeline E2E 6/6。html5validator 10 頁 0 errors。VerifyPaths / VerifyForbiddenPatterns PASS。Console Error = 0。

## Baseline 零修改（逐位比對快照）
Material / Summary / Knowledge / LearningQuestion Runtime、全部 Parser 鏈五檔、LearningQuestionGenerator、LearningQuestionSession、PersistenceAdapter —— **12 檔 byte-identical ✓**。Repository Structure v2.1 零變更（VerifyPaths 0 legacy）。

## 結論
Acceptance 八項全數 ✅。等待 PMO Final QA。
