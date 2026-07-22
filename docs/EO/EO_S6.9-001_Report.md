# EO-S6.9-001_Report — AI Question Generator Foundation

## Status
COMPLETE — 依 PMO 五項裁示（1B・2B・3A・4同意・5納入）實作完成並通過全部 QA，提交 PMO Final QA。未 Git Push、未 GitHub QA、LOCK Baseline 零修改（逐位比對驗證）。

## PMO Rulings Applied
- **1B**：新建 `AHS.LearningQuestionSession`（js/runtime/LearningQuestionSession.js）承載 Question List / Current Index / Metadata / Status；既有 `LearningQuestionRuntime.js`（EO-S6-004 LOCK）零變更。Interface 同理新建 `AHS.LearningQuestionGenerator`（js/parser/LearningQuestionGenerator.js），既有 `QuestionGenerator.js` 零變更。
- **2B**：difficulty 由呼叫端明確傳入並經 enum 驗證 —— 不推論、不預設、不讀 Summary Runtime。
- **3A**：Question Schema v1.0 為超集（EO 13 欄 + grade/section/traceability/source/learningObjective/relatedConcepts/metadata），十項完整性原則保留。
- **4**：questionType 儲存值 snake_case（single_choice / multiple_choice / true_false / fill_blank / short_answer，LOCK）。
- **5**：QuizCenter Practice Empty State 文案改為「AI 正在建立練習題……」（純文字，邏輯與 [Stub] 過濾零變更）。

## New Files
- js/parser/LearningQuestionGenerator.js（Interface v1.0：generate / validate / normalize + 固定 enum）
- js/runtime/LearningQuestionSession.js（Runtime v1.0：四項狀態、validate-gated add()、PersistenceAdapter 持久化、Status 為推導值不可造假；API 層即不存在 Practice / Wrong Book / Score 邏輯）
- tests/regression/QuestionFoundationV1.js（29 項驗證）
- docs/Specifications/：Question_Schema_v1.0.md、LearningQuestionRuntime_v1.0.md、LearningQuestionGenerator_Interface_v1.0.md

## Modified Files
- js/components/QuizCenter.js（僅 Ruling 5 文案）
- tests/jsdom/BehaviorSuite.js（1 個斷言同步新文案）

## Empty State 規則落實
generate() 無真實題目本文即回傳 null；validate() 拒絕空 answer / explanation / knowledgePoint；Session 唯一寫入路徑經 gate —— **Mock / Stub / Placeholder Question 無任何進入途徑**（29 項測試含反向案例驗證）。

## Foundation 接線說明
依 EO-S6-001～004 Foundation 前例，兩個新模組未接線至任何頁面（無 script tag）—— 既有 AI Pipeline 與所有頁面流程零變更；接線屬未來 EO。

## QA 結果
| 項目 | 結果 |
|---|---|
| Schema / Runtime / Interface Validation（QuestionFoundationV1.js） | **29 PASS / 0 FAIL** |
| Pipeline E2E 迴歸 | **6 PASS / 0 FAIL** |
| jsdom 行為測試 | **61 PASS / 0 FAIL** |
| html5validator（10 頁） | **0 errors** |
| VerifyPaths / VerifyForbiddenPatterns | **PASS** |
| Console Error（九個進入頁） | **0** |
| Material / Summary / 既有 LearningQuestion Runtime | 逐位零變更 ✓；Session 使用獨立 storage key，測試證明零交叉寫入 |

## Flag（記錄）
docs/Specifications/ 之三份文件依 EO 指定檔名交付；現行 Markdown 前綴規則（LOCK）未含 `Specifications_` 前綴 —— 建議 PMO 於命名規則補列，或裁示改名。
