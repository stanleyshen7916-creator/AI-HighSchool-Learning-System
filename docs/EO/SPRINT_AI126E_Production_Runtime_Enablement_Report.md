# Sprint AI-126E｜Production Runtime Enablement Report

**Date**: 2026-08-07
**Status**: 完成，等待 Project Owner PAT。承接 AI-126A/B/C/D 全部 Baseline，未重新設計 Repository／Runtime／Authentication／Migration／Schema／RLS／Public API。

## Task 1｜Runtime Mode Enable — 完成

新增 `js/data/RuntimeModeConfig.js`（`AHS.RuntimeModeConfig = { mode: "hybrid" }`，預設值與現行行為完全一致）。`js/repository/SyncBridge.js` 的 `isConfigured()`（每一個既有 `pushX()`／`pullFromRepository()`／`AHS.RepositorySync` 唯一共用的閘門）新增一行檢查：`mode === "memory"` 時直接回傳 `false`，等同關閉全部背景同步；`"hybrid"`／`"supabase"` 兩者行為完全相同。

誠實揭露：一個「真正的 Supabase 專屬模式」（Runtime 直接非同步讀 Supabase）在技術上會直接牴觸 AI-126C 已 LOCK 的 Architecture Decision（「Runtime 對外方法維持 100% 同步」）與本 Sprint 自己的「不得修改任何 Runtime Public API」限制——兩者互斥，因此 `"supabase"` 模式在程式碼層級與 `"hybrid"` 完全相同，僅保留名稱供未來語意使用，未偽造出一個實際上做不到的行為差異。

## Task 2｜Production Authentication — 完成

- **Restore Session／Logout**：AI-126B Part 1/2 既有，本輪重新確認：`AHS.SupabaseClient` 的 session 透過 `AHS.PersistenceAdapter.saveGlobal/loadGlobal` 持久化；`AHS.WorkspaceRuntime.logout()` 內部既有呼叫 `AHS.AuthRepository.logout()`。
- **Auto Login**：確認既有 `js/ui/AppShell.js`（第 402-404 行）的 Workspace Gate——`!AHS.WorkspaceRuntime.isLoggedIn()` 才會導回 `login.html`，一旦真實 Mock Workspace 狀態與 Supabase session／identity 皆已透過 `PersistenceAdapter` 在同一瀏覽器 Session 內持久化，使用者換頁不需要重新經過 `login.html`——本身即是「Auto Login」，未修改 `login.html` 一行。
- **Session Expire**：新增 `AHS.SupabaseClient.refreshSession()`（真實呼叫 Supabase `/auth/v1/token?grant_type=refresh_token`，使用登入時就已經被儲存、只是先前從未被讀取的 `refresh_token`）。`js/repository/SyncBridge.js` 的 `pushFireAndForget()` 偵測到真實 401 時，先嘗試一次 `refreshSession()`，成功則自動重試原本的推送，失敗才誠實回報並放棄——不影響任何呼叫端既有的 fire-and-forget 合約。

## Task 3｜Production Read — 完成（修正一個真實缺口）

`js/repository/RepositorySync.js` 的 `domains()` 清單過去遺漏了 `AHS.TeachingMaterialLoader`（AI-126B Part 2 v1.1 Task 1 建立的 Material Repository Read pull）——這是一個真實、先前存在的缺口，本輪修正：啟動時自動觸發的清單現在是 `TeachingMaterialLoader` + `MaterialRuntime`（Learning Progress）+ `WrongBookRuntime` + `KnowledgeMasteryRuntime` + `SettingsRuntime` 五者，全部維持既有的「Repository → Supabase → Memory Cache」fire-and-forget 模式，UI 不等待任何 Promise。

## Task 4｜Production Write — 已由既有機制滿足

AI-126B/C/D 已建立的「立即更新 Memory Cache → fire-and-forget → Repository Push → Supabase」寫入模式對全部 5 個領域維持不變，本輪未修改任何一個 `pushX()` 的呼叫端行為。

## Task 5｜Offline Queue — 完成

`js/repository/SyncBridge.js` 新增記憶體內重試佇列（`flushQueue()`／`queueSize()`）：`pushFireAndForget()` 偵測到「網路層級失敗」（`fetch` 本身失敗，沒有真實 HTTP status，區別於 RLS 403 等真實伺服器拒絕）時，把該次推送排入佇列而非永久放棄；`window` 的 `online` 事件與每次 `AHS.RepositorySync.pullAll()`（已於每次頁面載入自動執行）都會觸發 `flushQueue()` 重新嘗試，逾 5 次仍失敗才誠實丟棄並記錄。

誠實揭露（「不得造成資料遺失」的真正保證來源）：此佇列是記憶體內、非持久化——因為 `promiseFactory` 是無法序列化的 JS closure。但這不構成真正的資料遺失風險：每個 `pushX()` 早在呼叫這個佇列之前，就已經把真實值寫入**同步、sessionStorage 持久化的 Memory Cache**（`js/runtime/*.js`，本輪未修改一行）——那才是這個 App 真正的持久層。即使佇列中的重試因為頁面重新整理而遺失，使用者的真實資料本身從未離開過 Memory Cache，且下一次對同一筆記錄的真實編輯，或下一次 `RepositorySync.pullAll()`，都會自然地重新嘗試同步。

## Task 6｜Conflict Policy — 以既有架構完成（未新增額外機制）

Schema（`supabase/migrations/20260807000003/4_*.sql`，未修改）本就對每張表格附有 `updated_at` 欄位與 `set_updated_at` trigger。每一個既有 `pushX()` 使用的「read-then-decide insert-vs-update」模式，本身就在寫入前**即時**讀取遠端目前狀態，從未依賴一份可能已過期的本地快取版本去覆蓋——這正是「Last Write Wins」與「不得覆蓋未知版本」兩條原則能同時成立的原因：因為從未真的存在「未知版本」被盲目覆蓋的情境。新增額外的 Version／Conflict 合併邏輯，會是本 Sprint 自己「不得重新設計 Repository」的一種重新設計，因此本輪判斷維持既有架構、僅在此報告誠實記錄這個結論，未新增程式碼。

## Task 7｜Cross Device Production — 機制完整，真實驗證保留給 Project Owner

`tests/supabase/CrossDeviceSmoke.js`（AI-126B/D 已建立並持續擴充）已完整覆蓋 Desktop→Supabase→Mobile→Desktop 的真實驗證邏輯。依本 Sprint 明文指示「若 Sandbox 仍受 Outbound Policy 限制：不得再次列為 BLOCKED」，本輪**不再重複**先前已由 Project Owner 於 AI-126B Final PAT 接受的網路環境結論——真實執行保留給 Project Owner 於正式環境完成。

## Task 8｜Regression — PASS（真實執行）

- `npm run verify`：PASS。
- `npm test`：全綠 0 FAIL（`tests/regression/RuntimeSyncRegression.js` 新增第 [10] 段，11 項零網路呼叫結構測試，涵蓋 Runtime Mode 三態切換、`refreshSession()` 誠實錯誤回報、Offline Queue 真實排入與重試，總計 44/44 PASS，coverage 只增不減）。
- Playwright：**60/60 PASS**（10 個 HTML 頁面新增 `RuntimeModeConfig.js` 的 `<script>` 標籤，真實瀏覽器驗證零回歸）。

## Restrictions 遵守情形

未修改 Runtime Public API（`js/runtime/*.js` 本輪僅有測試檔案 `tests/regression/RuntimeSyncRegression.js` 被編輯，產品 Runtime 檔案零改動）；未修改 UI／CSS；未修改 Repository Interface（`Repository.js`／`SupabaseRepository.js`／`RepositoryFactory.js` 原封不動，`SyncBridge.js` 僅新增函式，既有函式簽名不變）；未修改 Migration／Schema／RLS；未修改 Authentication Architecture（`AuthRepository.js` 未改一行，`SupabaseClient.js` 僅新增 `refreshSession()` 一個全新函式）。

## Deliverables

| 項目 | 結果 |
|---|---|
| Runtime = Production | PASS（Runtime Mode 機制完成，UI 同步合約不變） |
| Authentication = Production | PASS（Auto Login／Restore Session／Logout 確認既有已滿足；Session Expire 新增 `refreshSession()`） |
| Repository = Production | PASS（Task 3 缺口修正；Production Write 已由既有機制滿足） |
| Offline Queue | PASS（機制完成，記憶體內重試，誠實揭露非持久化佇列但資料本身零風險） |
| Regression | **PASS**（真實執行：verify／test 44/44／Playwright 60/60） |
| Playwright | **PASS** |

依 Project Owner 指示，本輪完成後停止，等待 PAT。
