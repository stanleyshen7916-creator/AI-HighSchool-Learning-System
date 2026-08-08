# AI Platform｜Supabase Persistence 真實驗證任務 Report

**Date**: 2026-08-08
**Status**: 診斷完成，等待 Project Owner 實際測試結果。依明文指示：本任務完成後停止，不開始 P01～P11 修正。

## Task 1｜確認寫入鏈 — PASS（程式碼逐行追蹤，以 WrongBook 為例）

```
Student Login (login.html/AppLogin.js)
  → AHS.AuthRepository.loginForMockStudent(student)   [js/repository/AuthRepository.js:64]
      → 真實 signInWithPassword()/signUp() 對 Supabase Auth
      → ensureOwnProfile(student) 取得/建立真實 student_profiles 列
      → AHS.SyncBridge.cacheIdentity(userId, profileId)  [AuthRepository.js:98/109]
  ↓
Runtime 寫入路徑（使用者作答錯誤時）
  → AHS.WrongBookRuntime.sync(gradedResult)             [js/runtime/WrongBookRuntime.js:188]
      → 同步更新 Memory Cache（store.items），立即 persist()
      → touched.forEach(pushRecord)                      [WrongBookRuntime.js:260]
  ↓
pushRecord(record)                                        [WrongBookRuntime.js:54]
  → AHS.SyncBridge.identity() 取得 { userId, studentProfileId }
  → 組出真實 row：{ user_id, student_profile_id, subject_id, knowledge_point, ... }
  → AHS.SyncBridge.pushFireAndForget(fn)
  ↓
Repository 呼叫位置
  → AHS.RepositoryFactory.create() 回傳 AHS.SupabaseRepository 實例
  → repo.insert("wrong_book", row)                        [js/repository/SupabaseRepository.js:40]
      → 直接委派 AHS.SupabaseClient.insert(table, row)     [SupabaseRepository.js:41]
  ↓
實際 INSERT / UPDATE 方法
  → AHS.SupabaseClient.insert(table, row)                 [js/core/SupabaseClient.js:207]
      → fetch(POST {url}/rest/v1/wrong_book, body=row)
  → 若記錄已有 record.supabaseId，改走
    AHS.SupabaseClient.update(table, query, patch)         [SupabaseClient.js:218]
      → fetch(PATCH {url}/rest/v1/wrong_book?id=eq.{supabaseId})
```

- **對應 Supabase Table**：`public.wrong_book`（`supabase/migrations/20260807000004_learning_tables.sql`）。
- **使用的 user/profile identity**：`user_id`＝真實 Supabase Auth `session.user.id`；`student_profile_id`＝該帳號自己的 `student_profiles.id`（RLS `auth.uid() = user_id` 保證只能讀寫自己的列）。
- **實際寫入結果**：本環境（Claude Code Sandbox）無法對 Production Supabase 發出真實網路請求（見下方 Environment Constraint），因此無法在本輪取得真實 HTTP 200/201 回應——**程式碼鏈路完整、可追蹤，但本輪未取得真實執行結果**，如實回報，不宣稱已驗證。

其餘 4 個領域（Learning Progress／Knowledge Mastery／Statistics／Settings）走完全相同的 `pushX() → SyncBridge.pushFireAndForget → RepositoryFactory.create() → repo.insert/update → SupabaseClient.insert/update` 鏈路，僅 `row` 內容與目標 table 不同（`learning_progress`／`knowledge_mastery`／`statistics`／`user_settings`），皆已於 AI-126B～E 建置並通過結構性測試（`tests/regression/RuntimeSyncRegression.js`，零網路呼叫）。

## Task 2｜確認 Database 真實資料 — ENVIRONMENT BLOCKED（誠實回報，非 FAIL）

**Environment Constraint（已於 AI-126B Final PAT 確認並記錄，本輪不重複診斷，只陳述結論一次）**：Claude Code Sandbox 的出站網路政策封鎖真實 Supabase 專案主機，任何從本環境對 Production Supabase 發出的請求都會在到達 Supabase 之前就被 Proxy 拒絕。本輪未重新嘗試連線（無論是否提供真實憑證，結果不會改變，重試也違反環境自身的診斷規範）。

因此本輪**無法**用真實 Supabase 查詢結果證明 `learning_progress`／`wrong_book`／`knowledge_mastery`／`statistics`／`user_settings` 五張表任一張真的寫入了測試資料——不得只用 Memory/Mock 結果判定 PASS，本輪誠實回報 **ENVIRONMENT BLOCKED**。

已有的、真實的（非本輪、非模擬）Database 證據：AI-126A-3／AI-126B 的真實部署（GitHub Actions `workflow_dispatch`，非 Claude Sandbox 執行，不受本環境網路限制）已用 `supabase db query --linked` 確認：15/15 張表存在、15/15 RLS enabled、34 個 Policy、9/9 筆 subjects 種子資料、5 筆 materials／5 筆 question_sets／142 筆 questions 真實存在（見 `docs/EO/SPRINT_AI126A3_Deployment_Report.md`／`SPRINT_AI126B_Part2_v1.1_Material_Repository_Migration_Report.md`）——這證明 Schema／RLS／Migration 本身是真實、正確部署的，但**不能**證明本次任務要求的「使用結果」（learning_progress/wrong_book 等使用者操作資料）已真的寫入，因為那些寫入從未在有真實網路存取的環境（例如 GitHub Actions）執行過，只在本 Sandbox（被封鎖）嘗試過。

## Task 3｜確認重新登入後 READ — ENVIRONMENT BLOCKED（同一原因）

`pullFromRepository()` 鏈路（`AHS.WrongBookRuntime.pullFromRepository()` 等 5 個既有函式 + `AHS.RepositorySync.pullAll()` 自動觸發，AI-126C/D/E 已建置）程式碼完整，`tests/regression/RuntimeSyncRegression.js`／`tests/supabase/CrossDeviceSmoke.js` 皆已涵蓋此流程的結構驗證，但**真實**「登出 → 重新登入 → Supabase 真實讀回 → UI 恢復」需要真實網路，同 Task 2 原因，本輪 ENVIRONMENT BLOCKED。

## Task 4｜Browser Restart — PROJECT OWNER VALIDATION REQUIRED

依明文規定，Claude Code Sandbox 不得以 Playwright 模擬結果代替。見下方 Task 8 手動測試步驟。

## Task 5｜Cross Device — PROJECT OWNER VALIDATION REQUIRED

同上，見 Task 8。

## Task 6｜確認 Student Identity — PASS（程式碼逐行追蹤）

```
Supabase Auth User ID（session.user.id，AuthRepository.js:89 ensureOwnProfile 取得）
  = student_profiles.user_id（RLS: auth.uid() = user_id，只能查到/建立自己的列）
  = AHS.SyncBridge.identity().studentProfileId（cacheIdentity 寫入，AuthRepository.js:98/109）
  = 每個 pushX() 組出的 row.student_profile_id / row.user_id（例如 WrongBookRuntime.js:62-63）
```

`loginForMockStudent(student)` 用**決定性**（deterministic）帳密（依 `student.id` 產生固定 email/password）登入——同一個 Mock Student（如 Student A）永遠對應同一個真實 Supabase Auth 帳號，因此永遠對應同一個真實 `user_id`／`student_profile_id`，不會發生「登入 Student A、資料卻寫到 Student B」的情況。`AHS.SyncBridge.identity()` 額外驗證 `cached.userId === session.user.id` 才回傳快取的 identity，切換真實帳號時絕不會誤用舊帳號的 profile id。Profile 顯示名稱（`display_name`）在 `ensureOwnProfile()` 建立列時直接寫入 `student.name`，與登入時選擇的 Mock Student 一致。

**判定：PASS（架構層級，程式碼可驗證，不需要真實網路即可確認邏輯正確）。**

## 真實發現（先於報告本身回報，依「發現程式問題先回報」）

`js/data/SupabaseConfig.local.js`（Project Owner 本機填入真實憑證的 git-ignored 檔案，AI-126B Final PAT 建立的機制）**目前沒有任何 HTML 頁面的 `<script>` 標籤引用它**——只有 Node 測試工具（`RepositorySmoke.js`／`CrossDeviceSmoke.js`）會條件式 `require()` 它。這代表：即使 Project Owner 在自己的本機建立這個檔案並填入真實憑證，**在真實瀏覽器打開這個 App 時，這個檔案仍然不會被載入**，Task 4／Task 5 要求的「Project Owner 實際瀏覽器操作」會因此讀不到真實憑證。

這是一個真實的、先前遺漏的接線缺口，本輪僅回報、未修正（依本任務「只做診斷，不修改 UI」的明文限制）——若要讓 Task 4/5 的手動測試真正生效，需要後續一個小範圍、明確授權的修正（把 `<script src="js/data/SupabaseConfig.local.js">` 加入頁面），或者 Project Owner 直接暫時把真實值填入已提交的 `js/data/SupabaseConfig.js`（本機測試用、不要 commit）作為替代方案。

## Task 7｜Regression — PASS（真實執行）

- `npm run verify`：**PASS**（0 broken path，AUTHORIZED-EXCEPTION 範圍未變）。
- `npm test`：**PASS**，全綠 0 FAIL（330+29+37+35+45+36+12+11+6+8+28+44+31+44，共 14 個結構性測試檔案，本輪未修改任何測試/程式碼，數字與 AI-126E 完成時完全一致）。
- Playwright：**PASS**，60/60（真實瀏覽器，本輪零程式碼變更，零回歸）。
- Coverage：未變更（本輪為診斷任務，未新增/刪除任何測試或程式碼）。

## Task 8｜Project Owner 實測指令

```
① 登入 Student A
② 前往「教材中心」開啟任一教材 → 點「考前練習」完成至少 3 題（至少答錯 1 題）
③ 前往「設定」，切換「顯示 AI Tutor 建議」開關一次（單一動作即可觸發 Settings 真實寫入）
④ 登出
⑤ 完全關閉瀏覽器（不是分頁，是整個瀏覽器程式）
⑥ 重新開啟瀏覽器
⑦ 登入同一個 Student A
⑧ 確認：知識弱點頁面顯示剛剛答錯的題目／設定頁面的開關維持剛剛切換後的狀態／首頁 KPI 反映剛剛的練習
⑨ 使用第二個裝置（或另一台電腦／手機）登入同一個 Student A
⑩ 確認：Learning Progress／WrongBook／Knowledge Mastery／Statistics／Settings 五項資料與 Device A 完全一致
```

前提：需先按上方「真實發現」段落解決 `SupabaseConfig.local.js` 未被頁面載入的問題，或改為暫時（不 commit）把真實值填入 `js/data/SupabaseConfig.js`。

---

# AI Persistence Validation Report

```
Task 1 Write Chain：PASS（程式碼鏈路完整追蹤，真實執行結果本輪不可得，見 Environment Constraint）
Task 2 Database Persistence：ENVIRONMENT BLOCKED（非 FAIL——本 Sandbox 無法對 Production Supabase 發出真實請求）
Task 3 Re-login Readback：ENVIRONMENT BLOCKED（同上）
Task 4 Browser Restart：PROJECT OWNER VALIDATION REQUIRED
Task 5 Cross Device：PROJECT OWNER VALIDATION REQUIRED
Task 6 Student Identity：PASS

Regression：
npm run verify：PASS
npm test：PASS（全綠 0 FAIL，coverage 未變更）
Playwright：PASS（60/60）

Overall：
CONDITIONAL PASS
（範圍比原始判定規則更廣：不只 Task 4/5，Task 2/3 在本環境同樣無法真實執行——原因是同一個、已於 AI-126B 確認的 Sandbox 網路限制，不是新缺陷、不是 Repository/Runtime 實作問題）

Database Evidence：
本輪無新增真實查詢結果（環境限制）。既有真實證據：AI-126A-3／AI-126B 部署（GitHub Actions，非本 Sandbox）已確認 Schema/RLS/Migration/種子資料真實存在——不等於本次「使用結果」已寫入，兩者不可混淆。

Project Owner Manual Test：
見上方 Task 8 完整步驟；執行前需先解決 SupabaseConfig.local.js 未被任何頁面載入的真實缺口。
```

依任務明文指示，本輪完成後停止，不開始 P01～P11 修正，等待 Project Owner 實際測試結果。若 Project Owner 回報「儲存功能 PASS」，將原先 Persistence 測試結果更新為 PASS，再進入下一階段問題修正。
