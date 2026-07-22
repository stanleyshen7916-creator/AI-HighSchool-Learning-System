# QA_EO-S7.0-HOTFIX-001_Runtime_Initialization（Runtime Initialization Report）

- 日期：2026-07-22｜執行：Claude（Frontend）

## Root Cause（已由 GitHub API 證據確認）

白畫面並非 Runtime／初始化程式缺陷，而是**部署層 case-sensitivity 事故**：

1. v2.1 重構含四個「僅大小寫變更」的更名：`ui.js→UI.js`、`quote.js→Quote.js`、`greeting.js→Greeting.js`、`countdown.js→Countdown.js`。
2. Git 於大小寫**不敏感**檔案系統（Windows／預設 macOS）不會偵測 case-only rename → 遠端保留舊小寫檔。
3. GitHub Pages 大小寫**敏感** → index.html 請求 PascalCase 路徑 → 404 ×4。
4. `UI.js` 404 → `AHS.UI` undefined → 40 個元件之 module-scope `var el = AHS.UI.el` 逐一 TypeError → 白畫面。

**遠端證據**（api.github.com tree，2026-07-22）：遠端 210 檔中僅存 `js/core/ui.js`、`js/utils/countdown.js`、`js/utils/greeting.js`、`js/utils/quote.js`（小寫舊檔）；其餘 v2.1 結構（含 kebab-case assets、js/ui/、js/pages/）全數已正確傳播 —— 與 Console 截圖之 404 清單完全吻合。

## Issue 1（404 Resource）逐項確認

| 檔案 | ① Repository 存在 | ② Path 正確 | ③ index.html 引用 | ④ 已刪功能引用 |
|---|---|---|---|---|
| js/core/UI.js | ✅（大小寫正確） | ✅ | ✅ 正確引用 | 無 |
| js/utils/Quote.js | ✅ | ✅ | ✅ | 無 |
| js/utils/Greeting.js | ✅ | ✅ | ✅ | 無 |
| js/utils/Countdown.js | ✅ | ✅ | ✅ | 無 |

Repository 內容與引用**本已正確**（index.html 零變更、VerifyPaths 0 broken）；404 消除依賴部署修正（見 GitHubPages_QA_Report 之四行 git 指令）。`scripts/maintenance/DetectCaseRenames.js` 已建立，可於任何 clone 內偵測並輸出精確修復指令。

## Issue 2–5（Initialization 防護，本次程式變更）

- **40 個元件**之 module-scope `var el = AHS.UI.el;` → `var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined;`：Core 未載入時**零 throw**；正常載入時值逐位相同（71 項 jsdom 全數維持）。
- **9 個頁面 bootstrap**（js/pages/App*.js）加入 `coreReady()` gate：`window.AHS → AHS.UI.el → AHS.AppShell` 全數就緒才執行 init()（固定順序 Browser→AHS→Core Runtime→AppShell→Page Runtime→Component→Render）；未就緒時於 #app 顯示明確診斷文字（非白畫面）並 console.warn，**不提前建立任何 Component**。
- 未新增第二套流程、未改變 Architecture：gate 為既有 init() 之前置檢查，Runtime／Parser／index.html 逐位零變更。

## Validation

InitializationGuard 6/6（含 UI.js 404 模擬：零 TypeError、診斷顯示、零提前 mount；正常載入：渲染逐位正常）；jsdom 71/71；四套 Runtime 迴歸 90/90；html5validator 10 頁 0 errors；VerifyPaths／VerifyForbiddenPatterns PASS；js/runtime、js/parser、index.html byte-identical。
