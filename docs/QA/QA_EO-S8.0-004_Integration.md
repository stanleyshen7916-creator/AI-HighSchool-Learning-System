# Integration_QA_Report — EO-S8.0-004

## 整合專屬：tests/regression/AnalysisPipelineIntegration.js — **57 PASS / 0 FAIL**
- **Knowledge Graph**：五型內容節點解除；summary/question/answer/review/wrongbook 逐型驗證永久拒收；內容節點缺 folderId／documentType 拒絕寫入
- **Analysis Runtime**：status=ready；items 逐字取自真實文字；sourceParagraph 為真實序號、sourcePage 誠實 null；決定性分段規則驗證；無文字 → insufficient_source 零 items
- **Knowledge Extraction**：ready 才建節點；六項追溯欄位齊備；insufficient_source 零節點；**未歸屬 Folder 之教材於 Pipeline 與 Extraction 兩層皆被擋下**
- **Knowledge Graph 寫入**：五節點成功寫入並取得 knowledgeId；queryByFolder 依 Study Scope 取回；內容與原文逐字一致；**重複寫入冪等**
- **Pipeline Integration**：完整流程 done/success；material 不存在 → failed；未歸屬 Folder → failed；無文字 → success 零節點；考卷路由 exam_bank 零知識節點；processFolder 整個 Scope 執行；Folder 不存在 → failed
- **Runtime Rules**：三個管線檔 × 8 個 LOCK Runtime 逐一原始碼掃描零呼叫；全鏈零網路

## 先前 EO 測試斷言更新（依本 EO 授權）
`KnowledgeFoundationV1`（40/40）與 `KnowledgeExtractionV1`（48/48）中，記錄「白名單封鎖」「pending_analysis_pipeline」之斷言已更新為本 EO 解除後的正確行為，並新增 Folder Scope 斷言。此為 EO 明文授權之解除，非規避測試。

## Regression（零回歸）
AnalysisPipelineIntegration 57/57｜KnowledgeFoundation 40/40｜KnowledgeExtraction 48/48｜FolderRuntime 39/39｜jsdom 107/107｜WrongBookFoundation 37/37｜QuestionFoundation 29/29｜GenerationFlow 18/18｜ReviewModel 10/10｜Pipeline 6/6｜InitializationGuard 6/6｜html5validator 10 頁 **0 errors**｜VerifyPaths／VerifyForbiddenPatterns **PASS**｜**Console Error = 0**

## Acceptance
✅ Console Error = 0 ✅ Runtime Regression PASS ✅ **LOCK Runtime byte-identical**（SummaryRuntime／LearningQuestionGenerator／LearningQuestionSession／WrongBook 全數逐位一致；MaterialRuntime／FolderRuntime／DocumentClassifier 亦未變更）✅ Existing Runtime Zero Regression ✅ Integration PASS ✅ **No UI Change**（css 差異 0、10 個 HTML 全數未變更）✅ No Git Push ✅ No GitHub QA
