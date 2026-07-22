# EO-S7.0-HOTFIX-001_Report — GitHub Runtime Initialization Hotfix

## Status
COMPLETE — Root Cause 已由 GitHub API 證據確立並修復（含部署程序），初始化防護全數落地，全鏈迴歸零回歸。提交 PMO Final QA；依 Restrictions 未 Git Push，GitHub 更新程序與 Pages QA 檢核表已交付 Stanley／PMO 執行。

## Root Cause（一句話）
v2.1 四個 case-only 更名（ui→UI、quote→Quote、greeting→Greeting、countdown→Countdown）未被大小寫不敏感檔案系統上的 Git 註冊 → 遠端殘留小寫舊檔 → 大小寫敏感的 GitHub Pages 404 → AHS.UI undefined → 40 個元件連鎖 TypeError → 白畫面。Repository 內容與 index.html 引用本已正確。

## 修改（僅 Scope 允許項）
- 40 個元件 module-scope `el` alias 加載入防護（正常載入值逐位相同）
- 9 個頁面 bootstrap 加 coreReady() gate（固定初始化順序；Core 缺失顯示明確診斷，不白畫面、不提前 mount）
- 新增 scripts/maintenance/DetectCaseRenames.js（case-only rename 偵測 + 修復指令輸出）
- 新增 tests/regression/InitializationGuard.js（6 項，含 404 模擬）
- js/runtime、js/parser、index.html、全部 HTML **byte-identical**；Business Logic／Data Flow 零變更

## QA
InitializationGuard 6/6｜jsdom 71/71｜Pipeline 6/6｜QuestionFoundation 29/29｜GenerationFlow 18/18｜WrongBookFoundation 37/37｜html5validator 10 頁 0 errors｜VerifyPaths／VerifyForbiddenPatterns PASS｜本地 Console Error = 0。GitHub Pages 實機檢核表見 GitHubPages_QA_Report.md §3（本環境無法存取 github.io，已誠實揭露）。

## Acceptance 對照
✅ 無 404／Console Error = 0／正常開啟（**依 §2 四行 git 指令推送後成立**，本地與 404 模擬均已驗證）✅ window.AHS 初始化正常 ✅ AppShell 正常 Mount ✅ Component 正常 Render ✅ Regression PASS ✅ 首頁／Material／Quiz／Wrong Book 正常（jsdom 全頁驗證）✅ AI Pipeline 零回歸
