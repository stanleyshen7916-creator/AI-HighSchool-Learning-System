# EO-S5-003 — Runtime QA Hotfix — QA Report

## Flags Raised (and resolution applied)

**1. WB-S5-003 vs WB-S5-004 內部矛盾。** WB-S5-003 說「我的」修正後應開啟
「我的學習」頁面；WB-S5-004 的 Navigation Mapping 表格卻寫「我的 ↓
dashboard.html」。本次採用 WB-S5-004（較詳細、含 fallback 說明、序列在後）
為準，將「我的」導向 `dashboard.html`。若非本意，請裁示。

**2. Dead Button 根因已找到並修正。** `js/data/mock-data.js` 的
`bottomItems` 原本「我的」項目 `id` 為 `"me"`，但 `AppShell.js` 的
`ROUTES` 從未有 `"me"` 這個 key，導致該項目永遠落入「無實際作用的
`<button>`」分支 — 這才是 Dead Button 的真正原因，並非渲染邏輯本身有
問題。改為 `id: "dashboard"`（`ROUTES` 已有 `dashboard: "dashboard.html"`）
後，既有渲染邏輯自動產生正確的 `<a href="dashboard.html">`，
**未修改 `AppShell.js` 的渲染邏輯**。

**3. WB-S5-004 從 Bottom Navigation 移除「錯題」，與
`01_Product_Baseline.md`／`02_UI_Guideline.md` 明訂的固定五項
（首頁/教材/考卷/錯題/我的）不符。** 因這兩份文件僅 GPT 可修改，且本次
EO 由 PMO（GPT）本人發出，視為已授權之正式變更並據此實作，特此記錄。

**4. WB-S5-002「今日待複習 > 0 → 建立 Session → 進入 Review Session」
分支目前無法被觸發。** 今日待複習已由 PMO 裁示（EO-R001A Option B）固定
為 0（全系統無「待複習」概念），且本次「不得新增功能／不得修改
Architecture」，故無法建立真正的 Review Session 頁面。已實作真實的
條件判斷（`model.dueToday > 0` 分支確實存在於程式碼中），但在目前系統
狀態下必然落入 `=0` 分支，顯示您指定的 Empty State 文案。`>0` 分支僅在
未來若定義「待複習」概念後才可能被觸發（那屬於 Architecture 層變更，
非本次範圍）。

## Files Changed This EO
- `js/data/mock-data.js`：
  - `bottomItems`：修正「我的」根因 bug（`id: "me"` → `id: "dashboard"`）
    並套用 WB-S5-004 新 IA（教材/測驗/複習/我的）
- `js/components/ReviewQuickAction.js`：開始今日複習／錯題複習 改為
  各自獨立、各自基於真實資料判斷的流程（不再共用同一流程）
- `js/pages/ReviewHome.js`：新增讀取 `AHS.WrongBookRuntime.list()`
  （既有、未變動的 Runtime，唯讀），提供錢題複習真實的
  `hasWrongItems` 判斷依據；`dueToday` 沿用既有真實計算值
- `review.html`：新增載入 `js/runtime/WrongBookRuntime.js`（`hasWrongItems`
  判斷所需），順序比對 `wrongbook.html`／`quiz.html` 既有慣例

未變動：`js/components/AppShell.js`（本次 Bottom Nav 修正純粹是資料層
問題，渲染邏輯本身正確，未觸碰）、`js/runtime/WrongBookRuntime.js`、
`js/runtime/HistoryRuntime.js`、`js/runtime/ReviewRuntime.js`（皆逐位元組
確認未被編輯，只被讀取）、以及所有 Do NOT Modify 清單內容（Home／
Material Center／Quiz Center／Wrong Book／Summary Center／AI Tutor
之頁面元件與行為）。

## Developer QA
- [x] `node --check` — 全部異動 JS 檔案通過
- [x] 禁用模式 grep（含 `window.location.href`）— 乾淨（唯一命中為
  說明「未使用它」的註解文字，非實際程式碼）
- [x] `html5validator --match "*.html"` — 全站 exit 0
- [x] Bottom Navigation（jsdom 實測全部 9 頁）：
  - 皆顯示新 5 項 IA：首頁／教材／測驗／複習／我的
  - 教材／測驗／複習／我的 皆為真實 `<a href>`（分別指向
    materials.html／quiz.html／review.html／dashboard.html）
  - `dashboard.html` 上「我的」正確顯示 Active State
  - 無 Dead Button、無 `javascript:void(0)`、無 `#`、無
    `window.location.href`
- [x] Review Runtime Flow（jsdom 實測兩種情境）：
  - **無錯題資料**（預設 Session 狀態）：開始今日複習 → 顯示
    「今天沒有待複習內容。可先完成新的測驗或前往錯題本。」；
    錯題複習 → 顯示「目前沒有可複習錯題。」；兩者皆為 `<button>`，
    訊息文字完全不同，證明流程已分離
  - **有真實錯題資料**（透過 `AHS.WrongBookRuntime.sync()` 這個既有
    公開 API 寫入一筆真實紀錄）：錯題複習 → 渲染為真實
    `<a href="wrongbook.html">`，點擊 0 錯誤，不顯示任何 Mock 訊息
- [x] Wrong Book Review 判斷 — 直接讀取 `WrongBookRuntime.list().length`，
  非估算、非寫死
- [x] Dead Button 檢查 — 全部按鈕／連結皆有真實行為
- [x] Console Error = 0（全部 9 頁皆已重新測試）
- [x] Responsive — CSS 版面規則未變更（僅文字/資料變動），
  Desktop／Tablet／Mobile 維持既有驗證結果
- [x] 迴歸測試 — Home、Material Center、Quiz Center、Wrong Book、
  Summary Center、My Learning、AI Tutor、Dashboard 全數重新載入測試：
  0 錯誤，Bottom Nav 顯示一致
- [x] `diff -rq` 比對 Baseline — 除本次列出檔案 + `REPORT.md` +
  新增 QA 文件外，其餘既有檔案逐位元組未變動

## Acceptance Checklist
- [x] 今日複習正常（真實條件判斷 + 正確 Empty State 文案）
- [x] 錯題複習正常（真實條件判斷，含有資料/無資料兩種情境）
- [x] 兩者流程不同（不同檢查依據、不同渲染結果、不同文案）
- [x] 首頁／教材／測驗／複習／我的 全部可點擊
- [x] Active 正確
- [x] 無 Dead Button
- [x] Console Error = 0

## Known Issues
1. WB-S5-003 與 WB-S5-004 對「我的」目標頁面的說明不一致（見 Flag 1），
   已採 WB-S5-004
2. 今日待複習 > 0 的 Session 建立流程目前技術上無法被觸發（見 Flag 4），
   待未來 EO 定義「待複習」概念後方可測試
3. Bottom Navigation 移除「錯題」與 Baseline 文件不符（見 Flag 3），
   已視為 PMO 已授權變更
