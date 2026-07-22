# GitHubPages_QA_Report — EO-S7.0-HOTFIX-001

## 1. 遠端狀態證據（api.github.com，2026-07-22）

遠端 `main` 共 210 檔，v2.1 結構已正確傳播（js/ui/、js/pages/、kebab-case assets 全數存在）；**僅四個 case-only 檔案停留於舊小寫**：

```
js/core/ui.js        （應為 js/core/UI.js）
js/utils/countdown.js（應為 js/utils/Countdown.js）
js/utils/greeting.js （應為 js/utils/Greeting.js）
js/utils/quote.js    （應為 js/utils/Quote.js）
```

與 Console 截圖 404 清單完全一致 —— Root Cause 確立為 Git case-only rename 未註冊。

## 2. GitHub 更新程序（Stanley 執行，修復完成後）

於本地 clone 內（解壓覆蓋本 ZIP 前或後皆可，指令為關鍵）：

```
git config core.ignorecase false
git mv -f "js/core/ui.js"         "js/core/UI.js"
git mv -f "js/utils/countdown.js" "js/utils/Countdown.js"
git mv -f "js/utils/greeting.js"  "js/utils/Greeting.js"
git mv -f "js/utils/quote.js"     "js/utils/Quote.js"
git mv -f "docs/release/Release_Workflow_v1.0.md" "docs/Release/Release_Workflow_v1.0.md"
git add -A
git commit -m "fix: register case-only renames (EO-S7.0-HOTFIX-001)"
git push
```

（若任一 `git mv -f` 失敗，改用兩段式：`git mv 舊名 暫名` → `git mv 暫名 新名`。`docs/release` 一行為非致命之目錄大小寫一致性修正。）
輔助工具：`node scripts/maintenance/DetectCaseRenames.js` 會自動偵測並輸出上述指令；輸出「PASS」即可推送。

## 3. GitHub Pages QA 檢核表（推送後，PMO／Stanley 執行）

等待 Pages 部署完成（約 1–3 分鐘）後：

1. 開啟 `https://stanleyshen7916-creator.github.io/AI-HighSchool-Learning-System/`
2. **Hard Refresh（Ctrl+F5）**——舊 404 有 HTTP 快取，一般 Refresh 不足
3. DevTools Console：**404 = 0、Error = 0**（四個紅色 GET 消失）
4. 首頁正常 Render（Hero／今日任務／最近教材／巧巧老師圖片）
5. Material Center、Quiz Center（含 Question Guide 難度選擇）、Wrong Book 逐頁開啟正常
6. 一般 Refresh 再驗一次（Browser Refresh QA）

## 4. 本環境 QA 邊界（誠實揭露）

本工作環境可存取 github.com API（遠端 tree 證據即由此取得），但**無法存取 github.io**，故 Pages 實機 QA 需依 §3 檢核表於推送後執行。本地已以「UI.js 404 模擬」完整重現並驗證修復行為（InitializationGuard [A]：零 TypeError、明確診斷、非白畫面），及正常載入零回歸（71 項 jsdom + 90 項 Runtime 迴歸）。
