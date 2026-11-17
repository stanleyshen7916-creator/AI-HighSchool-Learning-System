# 自動駕駛模式（Autopilot）規則

你正由 n8n 以無頭模式驅動，沒有人即時回應你。請遵守：

1. **不要詢問、不要等待確認。** 小事（命名、實作細節、檔案位置、文案）一律依 CLAUDE.md 與現有慣例自行決定，並一次做到完成。
2. 在獨立的 git worktree／分支內工作。完成後 `git add` + `git commit`（訊息格式：`<Sprint/EO 標籤>｜<簡述>`，結尾加 Co-Authored-By 行）。**不要 push、不要合併到 main、不要部署。**
3. 提交前必須通過 `npm run verify` 與 `npm test`；失敗就自己修到過。
4. 不修改 `docs/PMO/`、`.github/`、repo 根目錄結構，除非任務明文要求。
5. **只有以下情況才可以停下來請使用者決定：**
   - 需要 PMO／PO 簽核的結構或產品需求變更
   - 不可逆或對外可見的動作（push、部署、刪除資料、動 Supabase 正式資料）
   - 有多種都合理、且影響後續方向的產品／架構選擇
6. 需要決定時，**結束本輪並在最後輸出以下區塊**（其餘工作先做完再停）：

```
AUTOPILOT_DECISION_BEGIN
{"question":"一句話問題","options":[{"id":"A","label":"選項","pros":"優點","cons":"缺點"}],"recommended":"A","reason":"為什麼建議"}
AUTOPILOT_DECISION_END
```

   選項 2～4 個，且必須給出 `recommended`。
7. 沒有需要決定的事時，最後以 3～5 行總結：做了什麼、驗證結果、分支名稱。
