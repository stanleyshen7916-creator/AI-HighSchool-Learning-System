# HOTFIX-007 — Review Center 顯示衝突的「複習進度」

## Summary

PAT report：複習中心（review.html）同時顯示三組「複習進度」相關數字，彼此不一致 —
頁面上方的 ReviewHomeCard（今日待複習/今日已完成/本週完成/已完成複習）、複習完成後的
Session 結果卡、以及頁面下方另一張標題同樣是「複習進度」的卡片（今日待複習/已完成/總錯題，
固定顯示 0 與「目前沒有錯題紀錄」）。

## Root Cause

頁面下方那張卡片是 `js/components/ReviewWidget.js`，資料 100% 來自 `AHS.ReviewModel` —
也就是 Practice Mode 自己的一條獨立管線（`WrongBookSession` → `WrongBookGenerator` →
`ReviewQueue` → `ReviewModel`），與本頁上方真正在用的 Exam Mode 管線
（`AutoGrader` → `WrongBookRuntime` → `StatisticsRuntime` → `ReviewRuntime`）是兩個依本專案
既有 LOCK（「Practice Mode / Exam Mode 不得混用」）刻意分離、互不共用資料的系統。

這不是計算錯誤 — 兩張卡片各自對自己的真實資料來源都是誠實、正確的。真正的問題是：
`ReviewWidget.js` 是在 Sprint AI-018（早於本次 Session AI-109～AI-114 建立的完整、真實
Exam Mode 複習流程）被加到 review.html 上，當時的目的是「讓 review.html 至少有一些真實內容」。
現在 review.html 已經有自己完整、真實的 Exam Mode 複習中心（今日待複習／已完成複習／真實
Review Session），`ReviewWidget.js` 在這裡變成一張多餘、標題重複（同樣叫「複習進度」）但
資料來源完全不同的卡片 — 對使用者而言，兩張標題相同但數字不同的卡片自然顯得「不一致」。

`ReviewWidget.js` 自己的檔頭註解其實已經寫明它是「首頁 Review Widget」（`js/pages/
AppHome.js` 也確實掛載了它），複習中心從來不是它真正的預定位置。

## Fix

`js/pages/AppReview.js` 移除 `AHS.ReviewWidget.create()` 的掛載；`review.html` 移除對應的
`WrongBookSession.js`/`ReviewQueue.js`/`ReviewModel.js`/`ReviewWidget.js` 這 4 個現在已無
任何頁面元件使用的 `<script>` 標籤。`index.html`（`ReviewWidget.js` 真正的既有掛載位置）
完全未變動 — Practice Mode 使用者依然能在首頁看到這張卡片。

## Verify / Test

`npm run verify` PASS。`npm test` — BehaviorSuite **325/325 PASS**（新增群組 [43]，4 項檢查：
複習中心不再出現 `.review-widget`／複習中心自己的真實 Exam Mode 統計仍正常／無 Console
Error／首頁的 ReviewWidget 完全不受影響）、PipelineRegression 6/6、RepositoryFoundation
29/29。

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.

## 修改檔案

- `js/pages/AppReview.js` — 移除 `ReviewWidget` 掛載
- `review.html` — 移除 4 個不再使用的 `<script>` 標籤
- `tests/jsdom/BehaviorSuite.js` — 新增群組 [43]
