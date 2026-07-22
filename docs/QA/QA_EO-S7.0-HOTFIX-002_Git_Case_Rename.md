# Git_Case_Rename_QA_Report — EO-S7.0-HOTFIX-002

## 1. 事前驗證（全新 clone @ 遠端 HEAD 314205f）
- 四個小寫檔確實存在於遠端 ✓（與 PMO 確認一致）
- 內容 byte-identical 於正確 PascalCase 檔 ✓（`diff -q` 四檔全數相同 → 純 rename 即完整修復，無需內容變更）

## 2. Rename 記錄驗證
`git show --name-status e54243a`：
```
R100  js/core/ui.js         → js/core/UI.js
R100  js/utils/countdown.js → js/utils/Countdown.js
R100  js/utils/greeting.js  → js/utils/Greeting.js
R100  js/utils/quote.js     → js/utils/Quote.js
```
`--stat`：4 files changed, **0 insertions, 0 deletions**。`git status --porcelain` = 0 行（Clean）。

## 3. 獨立套用驗證（第二個全新 clone）
`git pull <bundle> main` → PascalCase 四檔存在、`js/core/ui.js` 不存在、HEAD = e54243a ✓。證明 bundle 在任何機器（含 Windows）pull 後推送即修復遠端 —— rename 判定發生於 commit 物件，與本機檔案系統大小寫敏感度無關。

## 4. Push 邊界（誠實記錄）
本環境 `git push` 回應：`fatal: could not read Username for 'https://github.com'`（無憑證，符合三方架構：Stanley 為唯一部署者）。

## 5. 推送後檢核表（Stanley／PMO）
1. `git pull <bundle> main && git push`（或 fallback 指令組）
2. GitHub 網頁確認 `js/core/UI.js`、`js/utils/{Greeting,Countdown,Quote}.js` 為 PascalCase、小寫檔消失
3. 等待 Pages 部署（1–3 分鐘）→ **Ctrl+F5 Hard Refresh**（404 有 HTTP 快取）
4. Console：404 = 0、Error = 0；首頁正常 Render（Hero／今日任務／巧巧圖片）
5. 回報本對話 —— 我可即時以 GitHub API 驗證遠端 tree 四檔名並出具確認記錄
