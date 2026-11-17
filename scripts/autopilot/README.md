# Autopilot：n8n 自動開發到決策關卡

目的：任務佇列一次做完，只在「需要使用者決定」時停下並給建議選項；唯一例外是 token／額度用盡（不可逆），此時 n8n 自動等待後續跑。

## 執行方式（避免重工，其他 Claude 工作階段請先看這裡）

```
queue.json ─► n8n「Autopilot Runner」(Docker, 127.0.0.1:5678)
                 │ HTTP（host.docker.internal:5679，帶 X-Autopilot-Token）
                 ▼
          AutopilotBridge.js（宿主機 Node，無外部依賴）
                 │ claude -p --permission-mode acceptEdits（獨立 worktree + 分支 autopilot/<taskId>）
                 ▼
          結果 → 回呼 n8n Wait 節點 → 路由：
            done          → 標記完成，取下一個任務
            decision      → Windows 通知 + n8n 表單（選項與建議）→ 使用者回覆後以 --resume 續跑
            quota         → Wait 30 分鐘後以同一 session 續跑
            failed_checks → 最多 3 次自動修正（npm run verify / npm test）
            error         → 通知並停止
```

- Claude 端規則：`AutopilotRules.md`（不詢問、不 push、不合併 main、需決定時輸出 `AUTOPILOT_DECISION_BEGIN … END`）。
- 合併到 `main`（GitHub Pages 部署）永遠由使用者確認。
- 不碰 `docs/PMO/`、`.github/`、repo 根目錄結構。

## 使用

1. 啟動橋接：雙擊 `啟動自動駕駛橋接.bat`（或 `node scripts/autopilot/AutopilotBridge.js`）。
2. 首次或更新工作流：`powershell -File scripts/autopilot/InstallWorkflow.ps1`（會重啟 n8n 容器）。
3. 在 `queue.json` 加任務（`id`、`title`、`prompt`、`status: "pending"`）。
4. 啟動：POST `http://127.0.0.1:5678/webhook/autopilot-start`，或在 n8n 編輯器按 Manual Start。

不要重複建置：橋接、工作流、規則、佇列都已在本目錄；新增任務只需改 `queue.json`。
