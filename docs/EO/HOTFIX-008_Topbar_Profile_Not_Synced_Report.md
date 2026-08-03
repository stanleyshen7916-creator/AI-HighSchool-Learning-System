# HOTFIX-008 — Topbar 顯示名稱/年級與 Settings 不同步

## Summary

PAT report（使用者截圖）：在 Settings 的 Profile 區塊已將顯示名稱改為「小小兵」（輸入框確實
顯示已儲存的值），但畫面右上角 Topbar 仍顯示預設的「同學／高中生」。

## Root Cause

`js/ui/AppShell.js` 的 `topbar(model, ...)` 一直是直接讀 `model.user.name` /
`model.student.grade` —— 也就是 `AHS.AppConfig`（Mock 的初始預設值，永遠是
「同學」／「高中生」），從未讀過 `AHS.SettingsRuntime`（Sprint AI-113 AI-804 建立、
PersistenceAdapter 持久化的真正 Single Source）。

`js/ui/SettingsPanel.js` 的儲存按鈕點擊時會 `document.querySelector(".topbar__user-meta
strong/small")` 手動 patch 一次當下的 DOM 文字，讓「儲存的當下、同一頁」看起來像是同步的 ——
但這只是一次性的 DOM 補丁，不是真正的資料來源切換。只要 AppShell 重新 build（換頁、重新整理、
甚至只是重新打開 Settings 對話框後回到首頁再看一次 Topbar），`topbar()` 又會重新從
`AHS.AppConfig` 取值，變回「同學／高中生」。這正是使用者截圖中看到的現象：Settings 輸入框裡
是已儲存的「小小兵」（`AHS.SettingsRuntime` 資料是對的），但 Topbar 沒有讀它。

這與 AI-802（Single Source 稽核）的既有原則直接衝突：`AHS.SettingsRuntime` 檔頭本身已明文
「Single, real source ... reflected in the shared topbar」，但 `AppShell.js` 實際上從未真正
接上這條線 —— 是 Sprint AI-113 AI-804 遺留的整合缺口，而非本次新增的邏輯錯誤。

## Fix

`js/ui/AppShell.js` 的 `topbar()`：新增讀取 `AHS.SettingsRuntime.get().profile`，顯示名稱／
年級優先採用其中的 `name`/`grade`；只有在 `AHS.SettingsRuntime` 尚未載入時才退回原本的
`AHS.AppConfig.user`/`model.student.grade`（防禦性備援，維持既有「never throw at load time」
慣例，不影響任何未載入 Settings 的頁面）。`SettingsPanel.js` 儲存時的即時 DOM patch 維持不變
（同頁立即回饋，兩者不衝突）。

## Verify / Test

`npm run verify` PASS（0 broken paths / 0 legacy references / 0 forbidden patterns）。
`npm test`：

- BehaviorSuite **329/329 PASS**（原 325 + 新增群組 [44] 4 項檢查：首頁初次載入即顯示已儲存
  名稱、換到複習中心後名稱仍一致、Console errors = 0、從未存過 Settings 時預設值備援仍正常）
- PipelineRegression 6/6
- RepositoryFoundation 29/29

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.

## 修改檔案

- `js/ui/AppShell.js` — `topbar()` 改為優先讀 `AHS.SettingsRuntime.get().profile`
- `tests/jsdom/BehaviorSuite.js` — 新增群組 [44]
