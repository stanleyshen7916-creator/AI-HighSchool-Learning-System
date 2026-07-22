# EO-S7.0-HOTFIX-002_Report — Git Case Rename Repair

## Status
COMPLETE（Commit 已完成並獨立驗證；Push 需 Stanley 執行 —— 本工作環境無 GitHub 推送憑證，push 嘗試之憑證錯誤已如實記錄於 QA 報告）。

## 執行內容（僅 Repository Rename，零程式碼變更）

於**當前遠端 HEAD（314205f）之全新 clone** 上執行：

```
git config core.ignorecase false
git mv -f js/core/ui.js         js/core/UI.js
git mv -f js/utils/greeting.js  js/utils/Greeting.js
git mv -f js/utils/countdown.js js/utils/Countdown.js
git mv -f js/utils/quote.js     js/utils/Quote.js
git commit -m "Sprint 7.0｜EO-S7.0-HOTFIX-002｜Git Case-only Rename Repair｜2026-07-22"
```

Commit `e54243a`：**四筆 R100 純 rename、0 insertions / 0 deletions**、status clean。事前已驗證遠端四個小寫檔內容與正確 PascalCase 檔 **byte-identical**（Stanley 先前的覆蓋已把最新內容寫入舊檔名）—— 故純 rename 即完整修復，Runtime / Business Logic / UI / HTML 零觸碰。

## 交付方式：git bundle（繞過 Windows 大小寫問題的關鍵）

rename 已寫入 **commit tree 物件本身**，Stanley 的檔案系統不再參與判斷。Stanley 於本地 clone 執行：

```
git pull EO-S7.0-HOTFIX-002_case-rename.bundle main
git push origin main
```

（fallback：若不使用 bundle，直接執行上方五行指令亦可；`git mv -f` 若在 Windows 失敗，改兩段式 `git mv ui.js ui_temp.js && git mv ui_temp.js UI.js`，四檔同理。）

已於**另一個全新 clone** 獨立驗證 bundle：pull 後 `UI.js / Greeting.js / Countdown.js / Quote.js` 存在、小寫檔消失、log 正確。

## Acceptance 對照
✅ Git Rename 真正建立（R100 記錄，非僅改檔名）✅ Git Status Clean ✅ Commit 完成 ⏳ Push（Stanley，bundle 一行指令）⏳ GitHub Repository 顯示 PascalCase／Pages 404=0／首頁 Render（推送 + Pages 重新部署 + Ctrl+F5 後成立；我可於推送後以 GitHub API 立即代為驗證遠端檔名）✅ Runtime 零修改 ✅ Business Logic 零修改（diff：0 行內容變更）

## Flag
遠端 `docs/` 同時存在 `Release/` 與 `release/` 兩個大小寫目錄（同源問題、不影響 Pages 運作）—— 不在本 EO 四檔範圍內，建議下一個 EO 一併以 `git mv` 收斂。
