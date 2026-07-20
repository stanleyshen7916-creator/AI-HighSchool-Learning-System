# EO-S5-002 — Summary Center + Review Center Integration — QA Report

## Flags Raised (and how each was resolved)

**1. PART 3「Review Runtime」重述「所有資料由 ReviewRuntime 提供 / 不得建立
第二份 Runtime」，與 PMO 於 EO-R001A 已裁示的 Option B 相反。**
`AHS.ReviewRuntime` 的真實 API（`build(examId)`）技術上仍無法改變 — 沒有變
成可彙總的形態。本次維持 Option B 架構不變（Statistics／Recent Review 讀
`HistoryRuntime`；`ReviewRuntime` 保留給 Review Session／Review Result）。
本 EO 的「ReviewRuntime 正常載入」「Review Runtime 正常運作」驗收項目，
視為確認該架構持續正常運作，而非要求推翻 Option B。若 PMO 意圖不同，請
再次明確裁示。

**2. PART 2「確認：SummaryRuntime 正常運作」— 全專案搜尋確認不存在
`SummaryRuntime`（或任何 `js/runtime/Summary*.js`）。** `SummaryCenter.js`
本身註解明載「All Mock」，目前完全由 `AHS.Mock.summary` 靜態資料驅動，
從未有 Runtime 層。由於「不得使用新的 Runtime」，本次**未建立** 任何
SummaryRuntime；改為確認現有 Mock 驅動的 Summary Center 運作正常（見下方
Developer QA）。

**3. PART 1 Sidebar 正式 IA 必然觸及共用檔案。** 要新增「複習中心」／改名
「學習總結」／移除「儀表板」，唯一路徑是編輯 `js/data/mock-data.js` 的
`nav.items`（Sidebar 在所有頁面共用同一份資料）與 `js/components/AppShell.js`
的 `ROUTES`（讓「複習中心」成為可點擊連結）。這兩個檔案的異動會反映在
Home／Material Center／Quiz Center／Wrong Book／Dashboard／AI Tutor 的
Sidebar 顯示上 — 但**僅限 Sidebar 清單本身**，未觸及上述任一頁面的自身
內容元件或行為（已用 `diff -rq` 驗證：除 `mock-data.js`／`AppShell.js`／
`REPORT.md` 外，其餘既有檔案逐位元組未變動）。

**4.「左側功能列正式調整為」給出的 8 項清單未列「儀表板」。** 依字面解讀
為正式清單即完整清單，因此 Sidebar 不再連結 Dashboard；`dashboard.html`
與其元件本身完全未被修改，僅無法再由 Sidebar 進入（可直接以網址開啟）。
若非本意，請裁示是否應保留於 Sidebar 中。

**5. 找到並修正一個真實的 Button Event 缺陷。** 「開始今日複習」／「錯題
複習」原本是 `<button>` + `window.location.href` 導頁。這在真實瀏覽器可
正常運作，但專案自己的 jsdom QA 工具鏈（Developer QA 全程使用）在執行
真實導頁時會回報 `"Not implemented: navigation to another Document"` 這
個 Console Error — 這正是本次要修正的 Button Event 問題根源。已改為真正
的 `<a href="wrongbook.html">` 連結（與 `AppShell.js` 既有 Sidebar／Bottom
Nav 連結同一慣例），視覺樣式完全不變，Console Error 歸零。

## Files Changed This EO
- `js/data/mock-data.js` — `nav.items`：學習總結（原重點整理）、新增
  複習中心、移除儀表板（`bottomItems` 未變動）
- `js/components/AppShell.js` — `ROUTES` 新增 `review: "review.html"`
  （一行，既有樣式）
- `js/components/ReviewQuickAction.js` — 開始今日複習／錯題複習 改為
  `<a href>` 真連結（修正 Button Event）；「繼續上次 Session」文字改為
  「繼續上次複習」
- `js/pages/ReviewHome.js` — 更新過時註解（review 現為真實 Sidebar id，
  不再需要 workaround）；新增本次 Flag 1 的說明註解
- `css/pages/review.css` — `.rv-quick__btn` 新增 `text-decoration: none;
  box-sizing: border-box;`（讓 `<a>` 視覺與原 `<button>` 完全一致）

未變動：`js/components/SummaryCenter.js`、`css/pages/summary.css`、
`summary.html`、`js/pages/app-summary.js`（PART 2 僅為確認，未發現需
修正之缺陷）；`js/components/ReviewHomeCard.js`、
`js/components/ReviewRecentSession.js`（PART 3 架構不變）；以及所有
Do NOT Modify 清單內容（Home／Material Center／Quiz Center／Wrong
Book／Dashboard／AI Tutor 之頁面元件與行為）。

## Developer QA
- [x] `node --check` — 全部異動 JS 檔案通過
- [x] 禁用模式 grep — 乾淨
- [x] `html5validator --match "*.html"` — 全站頁面 exit 0
- [x] Sidebar Active／Navigation（jsdom 實測每一頁）：
  - Home／Material／Quiz／Wrong Book／My Learning／AI Tutor／Review／
    Summary：Sidebar 皆顯示 8 項新 IA（首頁／教材中心／測驗中心／
    錯題本／學習總結／複習中心／我的學習／AI Tutor），無「儀表板」、
    無「重點整理」
  - `summary.html` → Active =「學習總結」
  - `review.html` → Active =「複習中心」
  - `dashboard.html` 本身仍正常開啟（`.shell` 存在），僅 Sidebar 不再
    列出「儀表板」
- [x] Summary Runtime／Summary Center：Hero／AI 智能總結／思維導圖／
  知識樹／相關資源 皆確認存在且渲染正常（jsdom `aria-label` 檢查）
- [x] Review Runtime：`AHS.ReviewRuntime.build` 確認為函式並正確載入；
  Statistics／Recent Review 持續由 `HistoryRuntime` 提供（見 Flag 1）
- [x] Button Event：「開始今日複習」點擊後 Console Error = 0（先前為
  1 筆 jsdom 導頁錯誤，已修正），確認為 `<a>` 且 `href="wrongbook.html"`
- [x] Dead Button 檢查 — 三個 Quick Action 按鈕皆有真實行為
- [x] Console Error = 0，Console Warning = 0（全部頁面）
- [x] Responsive — CSS 未變更佈局規則，Desktop／Tablet／Mobile 維持
  先前驗證結果
- [x] 迴歸測試 — Home、Material Center、Quiz Center、Wrong Book、
  My Learning、AI Tutor、Dashboard 全數重新載入測試：0 錯誤
- [x] `diff -rq` 比對 Baseline — 除上列檔案 + `REPORT.md` 外，其餘既有
  檔案逐位元組未變動

## Acceptance Checklist
- [x] 學習總結 Active
- [x] Summary Runtime 正常（實為既有 Mock 驅動，已確認正常運作 — 見 Flag 2）
- [x] Hero 正常
- [x] 思維導圖正常
- [x] 相關資源正常
- [x] 複習中心 Active
- [x] Review Runtime 正常（Option B 架構持續運作 — 見 Flag 1）
- [x] Hero 正常
- [x] Statistics 正常
- [x] Quick Actions 正常
- [x] Button Event 正常（已修正）
- [x] Recent Review 正常
- [x] Responsive 正常
- [x] Console Error = 0

## Known Issues
1. `SummaryRuntime` 目前不存在，Summary Center 仍為純 Mock 資料（見 Flag 2）
2. Review Runtime 命名與實際 Statistics/Recent Review 資料來源
   （HistoryRuntime）之間的落差延續自 EO-R001A（見 Flag 1）
3. `dashboard.html` 不再有 Sidebar 入口（見 Flag 4）
