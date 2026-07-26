# REPORT.md — EO-AI-001｜Prompt Manager Foundation

Mode：Delta EO ｜ Priority：P0 ｜ 僅建立 Prompt Manager 架構，完成後停止。

## Objective

建立 `ai-engine/src/prompt/` 作為 AI Engine 唯一 Prompt 管理入口的基礎架構。不串接 OpenAI、不撰寫任何 Prompt 內容、不修改既有 AI Flow。

## Task 對照

| Task | 內容 | 狀態 |
|---|---|---|
| TASK-001 | 建立 `ai-engine/src/prompt/` | ✅ |
| TASK-002 | `PromptManager.js`／`PromptTemplate.js`／`PromptRegistry.js`／`PromptContext.js` — 僅架構，無 Prompt 內容 | ✅ |
| TASK-003 | `PromptManager` 提供 `register()`／`unregister()`／`get()`／`has()`／`list()`，全數委派給 `PromptRegistry`，無商業邏輯 | ✅ |
| TASK-004 | `PromptRegistry` 預留 `summary`／`question`／`review`／`explanation`／`tutor` 五個 Placeholder（`{reserved:true, template:null}`），未加入任何 Prompt | ✅ |
| TASK-005 | `PromptTemplate` 提供 `render()` Interface（未實作，`throw`），未建立任何正式 Prompt | ✅ |
| TASK-006 | `PromptContext` 預留 `material`／`history`／`profile`／`difficulty`／`subject` 五個欄位，純資料容器，未存取任何 Runtime | ✅ |

## Changed Files

**新增（4 檔案）**
```
ai-engine/src/prompt/PromptManager.js
ai-engine/src/prompt/PromptRegistry.js
ai-engine/src/prompt/PromptTemplate.js
ai-engine/src/prompt/PromptContext.js
```

**既有檔案修改：無（零 differ）** — 未修改 Platform／Runtime／既有 JS／HTML／CSS／AI Summary／AI Question／AI Review／GitHub Pages。`ai-engine/src/services/prompt/`（EO-MIG-002 建立的空槽，代表未來「Prompt Service」）與本 EO 的 `ai-engine/src/prompt/`（Prompt Manager，橫向共用元件）為不同路徑、不同用途，未互相觸碰。

## 自我驗證（node vm 沙箱）

驗證 7 條路徑，全數符合預期：
- `PromptRegistry.list()` 回傳五個預留 id；`get(summary)` 回傳 Placeholder；`get(未知 id)` 拋出 `AIEngineError`
- `PromptManager` 的 register/get/has/unregister/list 正確委派給 Registry（含註冊後可查、unregister 後 has() 變 false）
- `PromptTemplate.render()` 未實作，呼叫即拋出 `AIEngineError`
- `PromptContext` 建構時未給值的欄位預設 `null`；`set()` 合法欄位可寫、未知欄位拋出 `AIEngineError`

## QA Report

| 項目 | 結果 |
|---|---|
| Existing Runtime | PASS — regression suite 19 檔全綠，合計 739 PASS / 0 FAIL |
| Existing Platform | PASS — jsdom BehaviorSuite 162 / 162 PASS，9 頁 Console Error = 0 |
| Console Error | 0 |
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| html5validator（vnu） | 10 頁 0 errors，exit 0 |
| Backward Compatibility | PASS — 無既有檔案變更，`ai-engine/src/` 其餘 Foundation（core／providers／services／common，EO-MIG-002）未被觸碰 |
| GitHub Pages | **未驗證** — 見下方已知阻塞（與 EO-MIG-002 相同、尚未解除） |

## 已知阻塞（延續 EO-MIG-002，尚未解除）

本 session 對這個 repo 仍無 GitHub write 權限，Git Push／GitHub Pages 部署／Smoke Test 皆無法執行。程式碼與 QA 已在本地完成並通過驗證，commit 已就緒，等待授權後即補做。

## Commit

```
EO-AI-001
Prompt Manager Foundation
```

## 停止聲明

依 EO 指示，完成後**停止，不自行進入下一個 EO**，等待 GPT QA。
