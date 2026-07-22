# Review_Runtime_Report — EO-S7.0-003

## 血緣（單一流程）
WrongBookSession → ReviewQueue → **ReviewModel（唯讀）** → Today Review / Due Review / 首頁 Widget / Review Page

## API
- `getTodayReview()`：nextReviewAt ≤ today；**null 不列入**（等待 Scheduler Sprint）
- `getDueReview()`：nextReviewAt ASC（同時刻以 priority DESC 決定性次序），非 AI
- `getReviewProgress()`：{ todayDue, completed(=mastered 數), totalWrong }
- `getMasteryStatistics()`：{ new, learning, reviewing, mastered } —— 四者全部即時推導、永不儲存
- `setNextReview(questionId, at)`：**Scheduler Foundation 保留介面**，僅經 WrongBookGenerator.update + ReviewQueue.enqueue 寫入；本 Sprint 無任何自動呼叫（測試以手動呼叫驗證 Today/Due 行為）

## Wrong Book 複習串接（單一路徑）
開始複習 → Sprint-4 複習會話 → Submit → `applyReviewResult`（Sprint-4，既有）＋ `syncV1OnReviewResult`（新）：答對 → 固定階梯升一級；答錯 → Generator.add()（Duplicate Rule 全套）→ Queue 同步。全程經 Interface，Session 零直寫；legacy 資料查無對應即安靜略過。

## 首頁 Review Widget
今日待複習／已完成／總錯題 三格 + Mastery Progress 四段條；資料唯一來源 ReviewModel（不直讀 Session，EO 明定）；空系統顯示正式空文案。
