# EO-S7.0-003_Report — Review Runtime Integration & Production Cleanup

## Status
COMPLETE — Review 整合六項全數完成、Production Cleanup 全庫零殘留，jsdom 107/107 + 六套迴歸 106/106，GitHub Pages Beta 就緒。未 Git Push、未 GitHub QA、LOCK Baseline 零修改。

## 開工前三項判斷（已落實並可否決）
1. **ReviewRuntime 命名**：Sprint-5 同名 Runtime 已存在（LOCK）→ 依 1B 前例新建唯讀查詢層 `AHS.ReviewModel`（js/runtime/ReviewModel.js）；`setNextReview()` Scheduler Foundation Interface 保留於其上，本 Sprint 零自動呼叫。
2. **「已完成」定義** = `masteryLevel === "mastered"` 之錯題數（決定性）。
3. **QuotesData（勵志語錄）與 aiTutorPage.cannedReplies（巧巧台詞）**：屬策劃 UI 文案，保留並明列；PMO 裁定移除為一行變更。

## Review Integration（New Files）
- js/runtime/ReviewModel.js：getTodayReview（nextReviewAt≤today；**null 不列入，等待 Scheduler**）／getDueReview（nextReviewAt ASC，非 AI）／getReviewProgress／getMasteryStatistics（全部即時推導、永不儲存）＋ setNextReview（僅經 WrongBookGenerator.update + ReviewQueue.enqueue，絕不直寫 Session）
- js/components/ReviewWidget.js：首頁 Widget（今日待複習/已完成/總錯題/Mastery Progress），資料 100% 來自 ReviewModel
- js/components/WrongBook.js：複習作答結果同步 v1.0（答對 → 固定階梯升級 new→learning→reviewing→mastered；答錯 → Generator.add() 同 Duplicate Rule）—— 單一路徑、全經 Interface
- tests/regression/ReviewModelV1.js（10 項）

## Production Cleanup（詳見 Production_Cleanup_Report）
MockData.js / ExamData.js / TasksData.js **刪除**；新建 js/data/AppConfig.js（純 UI config/文案，v2.1 §js/data 指定位置）。移除：預設教材與 recentFiles、**預設題庫（Exam Mode 轉正式 Empty State）**、假統計（quiz stats/dashboard/studyPlan/achievements）、假通知、假使用者（陳同學/email）、假對話與假檔案（AI Tutor）、lastReading seed、假科目數量（**改為 MaterialRuntime 即時計算**）、全部「（Mock）」使用者可見前綴。新建共用 `AHS.EmptyState` 元件（Component Rules 合規），Dashboard/StudyPlan/Achievements/Exam 列表各就正式 Empty State。

## First Run / Data Verification
jsdom [13]：六個入口頁首次開啟零模擬內容、Console Error = 0、首頁 Widget 全 0 + 正式空文案；[14]：真實答錯 → 總錯題 1、Mastery New 1 即時反映、今日待複習 0（null 排除）。系統所有資料均源自使用者操作（上傳 → Summary → Question → Practice → Wrong Book → Review 全鏈於 [8]–[12] 驗證）。

## QA
jsdom **107/107**｜ReviewModel 10/10｜WrongBookFoundation 37/37｜GenerationFlow 18/18｜QuestionFoundation 29/29｜Pipeline 6/6｜InitializationGuard 6/6｜html5validator 10 頁 0 errors｜VerifyPaths／VerifyForbiddenPatterns PASS｜既有 runtime／parser **byte-identical**（僅新增 ReviewModel.js）。QA 邊界（誠實揭露）：Sprint-4 複習會話之 UI 全程 jsdom 驅動成本高，本次以其組成原語（update 階梯／add Duplicate Rule／enqueue，共 47 項既有測試）覆蓋，UI 路徑列入 PMO 真機 PAT 檢核項。
