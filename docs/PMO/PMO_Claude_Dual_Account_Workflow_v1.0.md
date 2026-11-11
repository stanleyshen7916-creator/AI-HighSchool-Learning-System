# PMO｜Claude 雙帳號分工（桌機 / 雲端）v1.0

- 整理日期：2026-11-11
- 適用專案：AI-HighSchool-Learning-System（AHS）
- Notion 對應頁：`02｜專案治理與協作 → 02.2｜AI 協作與交接 → Claude 雙帳號分工（桌機 / 雲端）`
  <https://app.notion.com/p/4150029b3a9181b096c3c704d88d4a58>

兩個 Claude 帳號彼此看不到對方的 session、記憶和用量，唯一的交會點是 GitHub。
分工原則：以「需不需要用到本機電腦」來區分。

## 1. 桌機帳號（本機）

負責一定要用到本機環境的工作：

- **教材上傳引擎**：`ai-engine/council/` 跑在本機（Node/Docker），`upload.html` 的測試與教材包發布只能在本機做。
- **真實後端操作**：Supabase 連接器、`npm run test:supabase`、`scripts/maintenance/SetAccountPasswords.js` 這類需要金鑰或已登入狀態的工作。
- **瀏覽器實測**：用 Chrome 或內建瀏覽器做 UI、RWD 和登入流程的手動 QA。
- **尚未 push 的東西**：未追蹤或未 commit 的檔案，雲端看不到。
- **最後把關**：審查並合併 PR，確認 GitHub Pages 部署結果。

## 2. 雲端帳號

負責只靠 repo 就能完成的工作。它從 GitHub clone，在沙箱裡做，產出 branch 和 PR：

- **純前端任務**：範圍明確的 HTML/CSS/JS 功能、Hotfix、重構。
- **只需 `npm run verify` 和 `npm test` 的驗證**：這兩個在沙箱裡就能跑。
- **耗時或可並行的工作**：關掉電腦也會繼續跑，適合同時開多個互不相干的任務。
- **文件類**：Release Note、文件整理、code review。

## 3. 協作規則

1. **先 push 再交給雲端**：雲端通常從 `main` 或已 push 的分支起跑，本機未 commit 的修改它拿不到。
2. **不要同時改同一批檔案**：雲端一個任務開一個 branch 和 PR；桌機先 pull 再動工，避免衝突。
3. **共用規則寫進 repo**：`CLAUDE.md` 兩邊都會讀到。本機的記憶（`~/.claude/.../memory/`）雲端沒有，重要的約定要寫進 `CLAUDE.md`。
4. **用量各自計算**：兩個帳號額度獨立。吃 token 的大型任務可以丟雲端，桌機額度留給互動式除錯和 QA。
5. **任務說明要完整**：雲端沒有桌機這邊的對話脈絡，交辦時要寫清楚檔案範圍和完成標準。
6. **金鑰不離開本機**：Supabase service_role 金鑰與 `ai-engine/council/.env` 只存在本機，不交給雲端帳號，也不寫入 repo 或 Notion。

## 4. 一句話總結

雲端帳號負責「寫程式、開 PR」，桌機帳號負責「本機引擎、真實後端、實測、合併」。

## 5. 前提

以上假設雲端帳號是在 claude.ai/code 的雲端環境執行。如果用法不同（例如兩個帳號都在桌機 App 切換），分工方式需要調整。

## 6. 文件同步

本文件與 Notion 對應頁內容相同。修改時兩邊一起更新；若兩邊不一致，以本 repo 版本為準。
