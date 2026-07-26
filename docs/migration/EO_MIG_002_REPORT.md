# REPORT.md — EO-MIG-002｜AI Engine Foundation

Mode：Delta EO ｜ Priority：P0 ｜ 僅建立 Foundation，完成後停止。

## Objective

建立 `ai-engine/src/` 基礎架構，作為所有 AI 功能唯一入口的骨架。不實作任何 AI 功能、不連線任何 LLM、不撰寫 Prompt。

## Task 對照

| Task | 內容 | 狀態 |
|---|---|---|
| TASK-001 | 建立 `ai-engine/src/` | ✅ |
| TASK-002 | `ai-engine/src/core/{AIEngine,AIEngineFactory,AIService}.js` — 僅 Registry / Factory / Interface，無 OpenAI | ✅ |
| TASK-003 | `ai-engine/src/providers/BaseProvider.js` — 純 Interface，方法皆 `throw`，未連線任何 LLM | ✅ |
| TASK-004 | `ai-engine/src/services/{summary,question,review,explanation,tutor,knowledge,prompt}/` — 空目錄（`.gitkeep`） | ✅ |
| TASK-005 | `ai-engine/src/common/{Constants,Errors,Version}.js` | ✅ |
| TASK-006 | `ai-engine/README.md`（Purpose / Folder Structure / Public API Reserved / Version，未寫 Prompt） | ✅ |

## Changed Files

**新增（12 檔案 + 7 個 `.gitkeep`）**
```
ai-engine/README.md
ai-engine/src/common/Constants.js
ai-engine/src/common/Errors.js
ai-engine/src/common/Version.js
ai-engine/src/core/AIEngine.js
ai-engine/src/core/AIEngineFactory.js
ai-engine/src/core/AIService.js
ai-engine/src/providers/BaseProvider.js
ai-engine/src/services/summary/.gitkeep
ai-engine/src/services/question/.gitkeep
ai-engine/src/services/review/.gitkeep
ai-engine/src/services/explanation/.gitkeep
ai-engine/src/services/tutor/.gitkeep
ai-engine/src/services/knowledge/.gitkeep
ai-engine/src/services/prompt/.gitkeep
```

**既有檔案修改：無（零 differ）** — 未搬移、未修改任何 Platform／Runtime／HTML／CSS／既有 JS／既有 AI Flow。舊版 `ai-engine/{provider,prompt,parser,knowledge,summary,question,review,explanation,chat,utils}/`（EO-MIG-001 建立的空殼）維持原樣，未被觸碰或搬移。

## 執行中發現並修正的一個問題

自我 QA 時（見下）發現 `Errors.js` 初版的子類別建構子用 `Error.call(this, message)` / `AIEngineError.call(this, message)` 的回傳值取 `.message`，但這兩者以 `.call()` 呼叫時都不會回傳 `this`（只有 `new` 才會），導致回傳值是 `undefined`，實際拋出的變成 `TypeError: Cannot read properties of undefined`，而不是預期的 `ProviderNotRegisteredError` / `ServiceNotImplementedError`。已改為直接在建構子內設定 `this.name` / `this.message` / `this.stack`，不依賴 `.call()` 的回傳值，並重新驗證四種錯誤路徑（`getProvider` 未註冊、`getService` 未註冊、`BaseProvider.complete()`、`AIService.run()`）皆拋出正確的錯誤類別與 `instanceof` 鏈。

## QA Report

| 項目 | 結果 |
|---|---|
| Repository Structure | PASS（新增檔案零命名衝突，`ai-engine/src/` 與既有 `ai-engine/*` 空殼並存不衝突） |
| Existing Runtime | PASS — regression suite 19 檔全綠，合計 739 PASS / 0 FAIL |
| Existing Platform | PASS — jsdom BehaviorSuite 162 / 162 PASS，9 頁 Console Error = 0 |
| Console Error | 0 |
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| html5validator（vnu） | 10 頁 0 errors，exit 0 |
| AI Engine 骨架自測 | 4 個錯誤路徑皆正確拋出對應 Error 子類別（node vm 沙箱驗證，見上「執行中發現並修正的一個問題」） |
| GitHub Pages | **未驗證** — 見下方已知阻塞 |

## 已知阻塞（非本 EO 範圍造成，回報供 PMO 知悉）

本 session（Claude Code Remote）目前對這個 repo **沒有 GitHub write 權限**（`git push`、GitHub API `create_branch`、`push_files` 三種寫入路徑皆回傳 403 / `Resource not accessible by integration`）。本 EO 的程式碼與 QA 已在本地完成並通過驗證，但尚未能：

- Git Push
- Deploy GitHub Pages
- 對外部 GitHub Pages URL 做 Smoke Test

這幾項會在 write 權限開通後立即補做。Commit 已在本地就緒（見下），等待授權後即可推送。

## Commit

```
EO-MIG-002
AI Engine Foundation
```

## 停止聲明

依 EO 指示，完成後**停止，不自行進入下一個 EO**，等待 GPT QA。
