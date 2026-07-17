# EO-R001A — Runtime Integration Fix — QA Report

## PMO Decision Applied
**Option B**, as ruled:
- Statistics 與 Recent Review 資料來源改為既有 `window.AHS.HistoryRuntime`
  （非新建、非擴充 Runtime API）
- `AHS.ReviewRuntime.build()` 保留供 Review Session／Review Result 詳細
  資料使用，本次 Home 頁面未呼叫它
- 今日待複習固定顯示 `0`（全系統無此概念）
- 花費時間顯示「尚無資料」（全系統無此欄位，非推估）
- `HistoryRuntime` 尚無紀錄時，Statistics 顯示 `0`，Recent Review 顯示
  空狀態 — 皆為預期行為

## Files Changed This EO
- `review.html` — 新增載入 `js/runtime/AutoGrader.js`、
  `js/runtime/ReviewRuntime.js`、`js/runtime/HistoryRuntime.js`（順序與
  `quiz.html` 的既有 Runtime 載入順序一致：AutoGrader → ReviewRuntime →
  HistoryRuntime）
- `js/pages/ReviewHome.js` — 改為讀取 `AHS.HistoryRuntime.list()`
  推算今日/本週完成筆數與最近一筆紀錄，傳入下方兩個元件；不再產生任何
  Mock 資料
- `js/components/ReviewHomeCard.js` — 移除內部 `STAT_MOCK`，改為
  `create(statsModel)` 接收真實數字
- `js/components/ReviewRecentSession.js` — 移除內部 `RECENT_MOCK`，改為
  `create(model, handlers)` 接收真實記錄或 `null`（空狀態）
- `css/pages/review.css` — 新增 `.rv-recent__empty` 空狀態樣式（既有規則
  未變動）

`js/components/ReviewQuickAction.js` 未變動（本次 EO 未要求，UI/行為
維持原樣，符合「不得修改 UI」）。

## No New/Modified Runtime
確認 `js/runtime/HistoryRuntime.js` 與 `js/runtime/ReviewRuntime.js`
本身**逐位元組未變動**（只被讀取，未被編輯）。未建立任何新 Runtime 檔案。

## Developer QA
- [x] `node --check` — 4 個 JS 檔案皆通過
- [x] 禁用模式 grep — 乾淨
- [x] `html5validator` — `review.html` exit 0
- [x] Script Loading Order — 確認 `review.html` 依序載入
      `AutoGrader.js → ReviewRuntime.js → HistoryRuntime.js`，與
      `quiz.html` 既有順序一致，未影響任何其他頁面
- [x] jsdom 行為測試（透過本機 HTTP Server 實際載入頁面）：
  - **空狀態**（`HistoryRuntime` 無紀錄）：Statistics 顯示
    `0 / 0 / 0`，Recent Review 顯示「尚無複習紀錄」空狀態文字，
    Console Error = 0，Console Warning = 0
  - **真實資料**（透過 `HistoryRuntime.record()` 這個既有公開 API
    寫入一筆真實紀錄，模擬完成一次測驗後的狀態）：
    - 今日待複習 = `0`（固定）
    - 今日已完成 = `1`、本週完成 = `1`（皆為真實計算，非寫死）
    - Recent Review 顯示：日期 = 真實 `when` 值、完成率 = `88%`
      （來自紀錄的 `accuracy`）、花費時間 = 「尚無資料」
    - Console Error = 0，Console Warning = 0
  - Quick Actions／Recent Review 的「繼續」按鈕點擊皆正常觸發 Mock
    回饋，不拋錯（Dead Button 檢查通過）
  - `AHS.ReviewRuntime.build` 與 `AHS.HistoryRuntime.list` 皆確認正確
    載入為函式
- [x] 迴歸測試 — `index.html`、`wrongbook.html`、`dashboard.html`
      重新測試：Console Error = 0，皆未受影響
- [x] Responsive — CSS Media Query 未變動，Desktop／Tablet／Mobile
      維持 EO-R001 驗證結果

## Acceptance Checklist（依 EO-R001A）
- [x] ReviewRuntime 正常載入
- [x] ReviewHome 正常初始化
- [x] Statistics 正常顯示（真實資料 + 固定 0 今日待複習）
- [x] Recent Session 正常顯示（真實資料 / 空狀態）
- [x] Console Error = 0
- [x] Responsive 正常

## Known Issues
- 今日待複習仍無資料來源，維持固定 0，待未來 EO 定義「待複習」概念後
  再處理。
- 花費時間全系統無此欄位，非本次可解決範圍。
- `review.html` 目前仍無 Bottom Navigation／Sidebar 入口（沿用 EO-R001
  已知項目，本次未變動）。
