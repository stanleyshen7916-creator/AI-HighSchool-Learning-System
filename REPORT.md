# REPORT — EO-R001A Runtime Integration Fix

## Status
COMPLETE — awaiting GPT 執行 GitHub Runtime QA。

## PMO Decision Applied
Option B（已於對話中確認）：Statistics 與 Recent Review 改用既有
window.AHS.HistoryRuntime 提供資料；ReviewRuntime.build() 保留供 Review
Session／Review Result 詳細資料使用；今日待複習固定 0；花費時間顯示
「尚無資料」；HistoryRuntime 無紀錄時顯示 0／空狀態（預期行為）。

## Modified Files
- review.html（新增 3 個 Runtime script 標籤，順序與 quiz.html 一致）
- js/pages/ReviewHome.js（改為讀取 HistoryRuntime 推算真實數字）
- js/components/ReviewHomeCard.js（移除內部 Mock，改接收真實 statsModel）
- js/components/ReviewRecentSession.js（移除內部 Mock，改接收真實 model /
  null）
- css/pages/review.css（新增 .rv-recent__empty 空狀態樣式，既有規則未動）

未變動：js/components/ReviewQuickAction.js、
js/runtime/ReviewRuntime.js、js/runtime/HistoryRuntime.js（皆逐位元組
確認未被編輯，只被讀取）、以及所有 Do NOT Modify 清單內的頁面／檔案。

## Completed Items
- ReviewRuntime 與 HistoryRuntime 皆正確載入且順序符合現有 Runtime
  載入規則（比對 quiz.html）
- ReviewHome.js 改用既有 Runtime 取得資料，未建立 Mock Data、未建立
  第二份 Runtime、未修改 Runtime API
- Statistics／Recent Session 皆為真實計算（已用 HistoryRuntime.record()
  這個既有公開 API 實測驗證，並驗證空狀態）
- 今日待複習固定 0；花費時間固定顯示「尚無資料」，皆未自行估算
- 未新增功能、未修改 UI 版面（僅資料來源由靜態改為真實 Runtime）

## Developer QA
詳見 docs/qa/EO-R001A_Runtime_Integration_QA.md。摘要：
- node --check：4 個 JS 檔案全通過
- 禁用模式 grep：乾淨
- html5validator：exit 0
- jsdom 行為測試（空狀態 + 真實資料兩種情境皆測試）：
  Console Error = 0，Console Warning = 0
- Script Loading Order：確認正確且未影響其他頁面
- Dead Button 檢查：通過

## Regression QA
index.html、wrongbook.html、dashboard.html 重新測試：Console Error = 0，
皆未受影響。以 diff -rq 比對 Baseline 確認：除本次列出的檔案外，其餘
既有檔案逐位元組未變動。

## Known Issues
1. 今日待複習仍無資料來源，維持固定 0（全系統無此概念）
2. 花費時間全系統無此欄位，非 Review 專屬缺口
3. review.html 目前仍無 Bottom Navigation／Sidebar 入口（延續 EO-R001
   已知項目）

## Next
交由 GPT 執行 GitHub Runtime QA。Repository QA 不需重新進行。
