# EO-S7.0-002_Report — Wrong Book Runtime Integration

## Status
COMPLETE — Runtime Flow（Practice Submit → Answer Check → WrongBookGenerator.add() → WrongBookSession → Review Queue → Wrong Book UI）全線接通並通過全鏈 QA。未 Git Push、未 GitHub QA、LOCK Baseline 零修改（八個 Runtime 逐位比對）。

## 開工前已回報之兩項判斷（已落實）
1. **Practice Submit 補建**：Practice 原為 reveal-only（作答僅存在 Exam Mode）。依 EO Runtime Flow 於 Practice 題目視圖新增最小決定性作答互動：單選/是非點選即交、複選提交、填空精確比對、簡答「顯示解答並自評」（自評即該題型之 Answer Check；未填答案誠實記錄「（未作答）」）。Exam 之 Answer / Score Logic 零觸碰。
2. **決定性補值**：再答錯 masteryLevel 固定降回 `new`；Queue priority = wrongCount、nextReviewAt = null（無排程 EO 前不排程）。皆非 AI 推論，PMO Final QA 可否決調整。

## Modified Files
- js/components/QuizCenter.js：Practice Submit 互動 + `wrongBookHook()`（唯一新增之 Hook；答錯才觸發；經 Interface 寫入）
- js/parser/WrongBookGenerator.js：Duplicate Rule 之 masteryLevel 降回 new（+5 行）
- js/pages/AppWrongBook.js：**移除 W004B Mock Seed（其註解明定本整合完成即移除）**；新增 Session→Sprint-4 UI 唯讀橋接（僅呼叫 WrongBookRuntime 既有公開 sync()，delta 對帳保證重載零重複；題幹/選項唯讀解析自 LearningQuestionSession；顯示標題自 reference《…》決定性解析）；新增即時統計卡
- js/components/WrongBook.js：Empty State 標題改為 mandated「目前沒有錯題紀錄。」（1 行文字）
- quiz.html / wrongbook.html：有序 script 接線（wrongbook.html 並補上**既有缺口** PersistenceAdapter.js —— Sprint-4 純 Seed 時代從未載入，無它則跨頁資料無法 hydrate）
- css/pages/quiz.css / wrongbook.css：作答互動與統計卡樣式
- tests/jsdom/BehaviorSuite.js：[8] 改寫為 Submit 流程 + 新增 [10][11][12]

## Acceptance 對照
✅ Submit 後自動加入 Wrong Book ✅ 重複答錯不重建 ✅ wrongCount 累加（firstWrongAt 不覆蓋）✅ Review Queue 正常建立 ✅ Wrong Book UI 正常顯示（真實資料、跨頁持久化）✅ Statistics 即時計算 ✅ Console Error = 0 ✅ Regression PASS（90+6+6+29+18+37）
