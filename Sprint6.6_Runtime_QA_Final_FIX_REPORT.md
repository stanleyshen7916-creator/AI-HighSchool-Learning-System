# Sprint 6.6 Runtime QA — Final Bug Fix Report
Learning Center Runtime Integration

## Scope Confirmation
本輪僅修改 Learning Center（`js/components/MyLearning.js`、
`learning.html`、`css/pages/learning.css`）。已用 diff 逐一確認：
Repository Structure、Runtime API、Runtime Schema、Design Token、UI
Library（`css/base/tokens.css`／`css/layout/shell.css`）、Architecture、
以及首頁／教材中心／學習總結／測驗中心／複習中心的全部既有檔案，
逐位元組完全未變動。

---

## Issue #026｜WO-015 我的學習－學習日曆日期錯誤

### 根因
`js/data/mock-data.js` 的 `myLearning.calendar.monthLabel` 寫死為
`"2024 年 5 月"`，且日曆的日期格數（`firstWeekday`／`daysInMonth`／
`today`）皆為對應該固定月份手動填入的數字，與系統實際日期完全無關。

### 修正
`MyLearning.js` 新增 `computeCalendarModel(viewYear, viewMonth)`：
- `monthLabel`／`firstWeekday`／`daysInMonth`／`today` 全部以真實
  `new Date()` 計算，永遠反映系統實際日期
- 日曆改為具狀態元件：內部維護 `viewYear`／`viewMonth`，「上一月」／
  「下一月」／「今日」按鈕觸發真實重新計算與重新渲染（非固定畫面）
- 每個日期格點擊會顯示該日真實學習分鐘數（或誠實顯示「沒有學習
  記錄」），資料來自既有、未修改的 `AHS.MaterialRuntime`
  的 `lastLearningAt`／`learningTime` 欄位（既有 Schema 欄位，非新增）

### 驗證
- 全新載入：月曆正確顯示系統當前年月（已用 `new Date()` 比對確認，
  非寫死 2024 年 5 月），「今日」格正確標示
- 點擊「上一月」→ 正確切換為前一個月；點擊「今日」→ 正確回到系統
  當前月份
- 植入一筆真實學習記錄（`AHS.MaterialRuntime.startLearning()`，既有
  公開方法）後，點擊「今日」格 → 正確顯示「YYYY 年 M 月 D 日：學習
  90 分鐘」（真實數字，非 Mock）
- Console Error = 0

---

## Issue #027｜WO-016 Learning Center Runtime Integration

### 逐項確認（依 WO-016 列出項目）

**學習記錄（本週／本月／今年／全部）**：「本週」改為真實資料 ——
彙總既有 `AHS.MaterialRuntime` 的 `learningTime`／`lastLearningAt`，
依系統當前週（週一為起始）計算每日時數長條圖；無任何教材時顯示
Empty State，而非空白或假資料。「本月／今年／全部」維持 Sprint 6.6
Round 1（WO-005）已裁定的方案 B（Disabled + Coming Soon）——全站
沒有依時間區間的歷史學習 Runtime，建立一個屬於新功能，非本輪 Bug
Fix 範圍。

**週報告（查看全部）**：雷達圖改為真實資料——比較系統當前週與上一週
各科目真實學習時數（同樣彙總自 `AHS.MaterialRuntime`）；完全沒有
教材時顯示 Empty State。「查看全部」原為死連結（`href="#"`），改為
明確標示 Coming Soon（無對應詳細報告頁面，屬新功能範疇）。

**學習日曆（今日／上一月／下一月／日期點擊）**：全部改為真實運作，
見 Issue #026。

**學習統計 Empty State**：「學習記錄」、「週報告」、「科目進度」三個
區塊皆已加入真實的資料充足性判斷——教材數量為 0 時顯示明確 Empty
State 文案，不再是「沒有反應」或看起來故障的畫面。

**圖表（互動／Empty State）**：長條圖與雷達圖皆已改為真實資料驅動，
資料不足時顯示 Empty State（非空白圖表）；長條圖本身無宣稱互動功能，
未過度承諾。

**Button Rule 全面確認**：本輪額外稽核並修正兩個 WO-016 未明確列出、
但同樣違反 Button Rule 的既有死連結／死按鈕：
- 「成就徽章」卡片的「分享成就」按鈕（原本完全沒有事件綁定）→
  改為明確 Disabled + Coming Soon
- 「成就徽章」與「科目進度」卡片的「查看全部」連結（原為 `href="#"`
  死連結）→ 改為明確 Coming Soon

「科目進度」本身的長條圖改為真實資料——彙總既有
`AHS.MaterialRuntime` 每筆教材的 `progress` 欄位（既有 Schema 欄位）
依科目取平均；完全沒有教材時顯示 Empty State。

「學習總覽」（累積學習天數／完成題數／正確率）改為真實資料：
- 累積學習天數：真實統計有 `lastLearningAt` 記錄的**不重複**日曆
  日期數（誠實命名為「累積」而非「連續」，因目前架構不追蹤連續性）
- 完成題數／正確率：真實彙總既有、未修改的 `AHS.HistoryRuntime`
  （測驗歷史記錄）之 `totalCount`／`correctCount`

**成就徽章（Badges）內容本身**：全站沒有任何成就達成判定的 Runtime
或規則，建立一套達成門檻邏輯屬於新增遊戲化功能，非本輪 Bug Fix
範圍。已在程式碼中明確記錄此範圍界定；其展示內容維持既有視覺呈現
不變，但其互動元件（分享／查看全部）已誠實地改為 Disabled／Coming
Soon（見上）。

### 驗證
- 全新 Session（無教材）：學習記錄／週報告／科目進度三區塊皆正確
  顯示 Empty State；本週分頁維持可操作，其餘三個分頁與所有
  Coming Soon 元件皆正確 `disabled`
- 植入真實教材＋學習記錄＋測驗歷史後：學習總覽三項數字皆為真實計算
  （非 Mock）；學習記錄長條圖、週報告雷達圖、科目進度長條圖皆正確
  顯示真實資料
- Console Error = 0，Runtime Error = 0

---

## Regression
- 全站 9 個頁面重新載入：Console Error = 0
- 首頁／教材中心／學習總結／測驗中心／複習中心：重新測試，結果與
  前一輪完全一致，未受影響
- `diff -rq` 比對前一輪交付：確認本輪異動精確為 3 個檔案（Learning
  Center 範圍內），其餘（含全部 Runtime、Persistence Adapter、
  Learning Pipeline、Design Token、UI Library、其餘全部頁面）逐位
  元組未變動

## Acceptance Checklist
- [x] Issue #026 PASS
- [x] Issue #027 PASS
- [x] Learning Center Runtime PASS
- [x] Console Error = 0
- [x] Runtime Error = 0
- [x] Architecture 不變
- [x] Repository 不變
- [x] Runtime API 不變

## PMO Decision Acknowledgement
本輪完成並經 GPT PMO 確認後，Sprint 6.6 Runtime QA 正式結案。下一個
Sprint（6.7 AI Learning Pipeline：Document Parser → Summary →
Question → Quiz → Review）將於 Sprint 6.6 LOCK 後、收到正式 EO 才
開始，本次交付不包含任何 Sprint 6.7 相關程式碼。
