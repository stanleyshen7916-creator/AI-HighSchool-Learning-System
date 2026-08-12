# Sprint AI-126B（Part 2/2）｜Supabase Runtime Integration Report

**Date**: 2026-08-07
**Status**: Runtime Integration 架構完成並通過結構性驗證；真實跨裝置端對端 PASS 待 Project Owner 提供 `SUPABASE_URL`/`SUPABASE_ANON_KEY` 後執行 `npm run test:supabase:cross-device` 取得。

## 兩個先於實作處理的真實發現（誠實揭露）

1. **Login 架構落差**：`login.html`/`js/pages/AppLogin.js` 實際上是「選學生→選學校→選學期」3 步驟選單，完全沒有 Email/密碼欄位。已用 `AskUserQuestion` 呈現證據；使用者隨後以正式「Architecture Decision」訊息確認方向：**Student = User = Profile**，不得建立第二層 Student→Email Mapping。採用的解法（與該決策一致）：每個固定 `mock_student_key`（student_a/student_b/admin）透過**決定性、不可見**的 Email/密碼與真實 Supabase Auth 帳號一一對應（`js/repository/AuthRepository.js`），UI 零變化；Email/密碼純粹是取得真實 `user_id` 所需的技術管線，不是第二個身分概念——`student_profiles.user_id` 才是所有資料表關聯的唯一、永久識別碼。
2. **Learning Progress 資料缺口（BLOCKED）**：`learning_progress.material_id` 是 `NOT NULL` 外鍵，必須指向 `materials` 表一筆真實列——但 AI-126A 只遷移了 Schema 與 9 筆 subjects，從未遷移任何真實教材內容到 Supabase，`materials` 表目前 0 列。任何 Insert 嘗試都會真實觸發外鍵錯誤。已用 `AskUserQuestion` 呈現證據（未獲回覆）。依「不得修改 Migration/Schema」的明文限制，本輪**未實作** Task 3（Learning Progress Repository）——嘗試繞過（捏造假 material_id 或修改 Schema）都不誠實或違反明文限制。**Task 3 狀態：BLOCKED，需另一個明確授權的 Sprint（真實遷移教材內容到 materials 表，或調整 Schema）。**

## Task 1｜SupabaseConfig — 完成（沿用 Part 1 既有檔案）

`js/data/SupabaseConfig.js` 已存在（Part 1 建立），本輪未修改；`url`/`anonKey` 仍誠實留白，等待 Project Owner 提供。所有 Repository 統一由此 Config 讀取，未寫死於任何 Runtime。

## Task 2｜Authentication Runtime — 完成（架構），CONFIGURATION-PENDING（真實 PASS）

新增 `js/repository/AuthRepository.js`（`loginForMockStudent`／`ensureOwnProfile`／`logout`／`getSession`）與 `js/repository/SyncBridge.js`（identity 快取／subject_id 解析／fire-and-forget push 工具）。`js/pages/AppLogin.js` 新增 1 個呼叫點（學生卡片點擊時觸發，UI 零變化）；`login.html` 未改一行；真實 Logout 掛在 `js/runtime/WorkspaceRuntime.js` 既有的 `logout()` 內部（Runtime 內部邏輯，非 UI，呼叫端 `js/ui/AppShell.js` 未改一行）；Session Restore 沿用 Part 1 既有的 `PersistenceAdapter.*Global` 持久化機制。Regression：PASS（`tests/regression/RuntimeSyncRegression.js`）。

## Task 3｜Learning Progress Repository — BLOCKED（見上）

## Task 4｜WrongBook Repository — 完成

`js/runtime/WrongBookRuntime.js`：`sync`/`recordRetry`/`archive`/`unarchive`/`toggleBookmark` 全部既有寫入路徑後方新增 fire-and-forget push（新增 `record.supabaseId` 欄位追蹤遠端列 id，供後續 Update 使用）；新增 `pullFromRepository()`。`wrong_book.question_id`/`material_id` 為 nullable，不受 Task 3 同樣的外鍵缺口影響。Read/Insert/Update/Delete 皆已串接。

## Task 5｜Knowledge Mastery Repository — 完成

`js/runtime/KnowledgeMasteryRuntime.js`：`recordAttempt()` 後新增 `pushMastery()`（讀取真實聚合 correct_count/wrong_count 後 upsert，符合 `knowledge_mastery` 表本身即為聚合表的設計）；新增 `pullFromRepository()`。

## Task 6｜Statistics Repository — 完成

`js/runtime/StatisticsRuntime.js` 維持「Purely computed，無自己的 store」不變（既有規則不動）；新增獨立、additive 的 `pushDailySnapshot()`，將 `homeKpis()` 已經真實計算出的數值（outstandingTasks/accuracyToday/accuracyThisWeek/knowledgeMasteryAvg/knowledgeGrowthToday/newWeaknessesToday/resolvedWeaknessesToday）寫入 `statistics` 表的今日快照列——不改變、不取代任何既有讀取路徑，僅補上 AI-126A 已記載的真實歷史缺口。

## Task 7｜Settings Repository — 完成

`js/runtime/SettingsRuntime.js`：`update()` 後新增 `pushSettings()`；新增 `pullFromRepository()`。`profile.name`/`grade` 仍完全來自 `student_profiles`（既有 Single Source 設計不動，未重複儲存）。

## Task 8｜Cross Device Validation — 架構完成，CONFIGURATION-PENDING（真實 PASS）

新增 `tests/supabase/CrossDeviceSmoke.js`（`npm run test:supabase:cross-device`）：以兩個**完全獨立**的記憶體 sessionStorage/AHS module 狀態（模擬兩台真實裝置，彼此不共享任何本機狀態）登入同一個真實帳號，Device A 真實寫入 WrongBook／Knowledge Mastery／Settings，等待背景 push 完成後，Device B 從真實 Supabase `pullFromRepository()`，驗證資料完全一致。這是 Acceptance Standard 所述人工 Desktop→Mobile 驗證流程背後、可自動化的核心機制證明——**不取代**該人工驗證本身（Sprint 原文本就將該驗證描述為 Project Owner 親自在兩台真實裝置上執行的動作）。目前因 Config 空白，誠實回報 SKIP。sessionStorage/localStorage 僅作為 UI Cache（pull 之後才寫回本機），未被當作資料來源使用，符合限制。

## Task 9｜Regression — PASS

- `npm run verify`：PASS（`AUTHORIZED-EXCEPTION` 僅命中 `SupabaseClient.js` 一處，與 Part 1 相同，未新增例外範圍）
- `npm test`：330+29+37+35+45+36+12+11+6+8+28+44+6(PipelineRegression)+26(RepositoryLayerRegression)+**20**(新增 RuntimeSyncRegression) 全綠，0 FAIL，**Coverage 未降低**（僅新增測試，零刪除/弱化既有斷言）
- Playwright：60/60 PASS（與變更前完全相同，含真實登入流程測試，證實 AppLogin.js 的新掛勾點零行為影響）

## Task 10｜Acceptance

| 項目 | 結果 |
|---|---|
| Authentication | PASS（架構）／CONFIGURATION-PENDING（真實登入 PASS 需 Project Owner 提供憑證） |
| Learning Progress | **BLOCKED**（materials 表 0 真實列，FK NOT NULL，需另一 Sprint 授權遷移教材內容或調整 Schema） |
| WrongBook | PASS（架構）／CONFIGURATION-PENDING（真實 CRUD PASS 需憑證） |
| Knowledge Mastery | PASS（架構）／CONFIGURATION-PENDING（真實 CRUD PASS 需憑證） |
| Statistics | PASS（架構）／CONFIGURATION-PENDING（真實快照寫入 PASS 需憑證） |
| Settings | PASS（架構）／CONFIGURATION-PENDING（真實 CRUD PASS 需憑證） |
| Cross Device | 架構完成（`tests/supabase/CrossDeviceSmoke.js`）／CONFIGURATION-PENDING（真實跨裝置 PASS 需憑證 + Project Owner 實機驗收） |
| Regression | **PASS** |
| **Overall** | **架構 PASS**／**真實端對端 PASS 待 Project Owner 提供 `SUPABASE_URL`／`SUPABASE_ANON_KEY`**；Learning Progress 維持 BLOCKED 待另一授權 |

## Constraints 遵守情形

未修改 CSS；未修改任何既有 Runtime Public API（全部變更為既有方法內部新增 fire-and-forget 呼叫，簽名/回傳值不變，或全新 additive 方法）；未新增 Mock Data；未修改 Migration/Schema/RLS；未重新設計 Repository（`Repository.js`/`SupabaseRepository.js`/`RepositoryFactory.js` 原封不動）；未開始 AI-126C。`js/ui/AppShell.js`（唯一含真實 Logout 按鈕的 UI 檔案）未改一行——真實 Logout 改掛在 `WorkspaceRuntime.logout()` 內部。

依 Project Owner 指示，本輪完成後停止，等待 PAT。
