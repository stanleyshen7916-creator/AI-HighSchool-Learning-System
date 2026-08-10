# AI Supabase Persistence｜Phase 4 真實寫入診斷 Report

**Date**: 2026-08-08
**Status**: 純診斷任務，未修改任何 UI/Repository/Runtime/Schema/RLS/GitHub Pages 部署/Secret Injection。依明文指示：找到第一個真正失敗點後立即停止，不自行修正，等待 Project Owner「開始修正」授權。

---

## 前提（已由 Project Owner 確認，本輪不重複驗證）

- 本機 `main` = `c0905fa`
- `SupabaseClient.js` Network Status = `200`
- `typeof AHS.SupabaseClient` = `"object"`
- `AHS.SupabaseClient.isConfigured()` = `true`
- 實際操作後仍無資料保存

**正式排除「設定檔未載入」作為目前 Root Cause。** 本輪不得再以「GitHub Pages 無法取得憑證」作為 Root Cause——該架構限制與本次症狀（本機環境、Configuration 已確認 true）無關，本輪完全不涉及。

---

## Task 2｜Write Function 呼叫鏈 — 逐層程式碼追蹤（現行、已提交程式碼，非模擬）

以 WrongBook 為追蹤對象，逐層列出**現行、已提交到 `main`（`c0905fa`）** 的真實程式碼，每一層都是真實條件分支，不是猜測：

```
① UI Action（quiz.html／materials.html 上答錯一題，AutoGrader 判定 wrong）
    ↓
② AHS.WrongBookRuntime.sync(gradedResult)                     [js/runtime/WrongBookRuntime.js:188]
    → 同步更新 store.items，立即 persist()（sessionStorage，與 Supabase 無關，必定成功）
    → touched.forEach(pushRecord)                              [WrongBookRuntime.js:260]
    ↓
③ pushRecord(record)                                          [WrongBookRuntime.js:54]
    分支點 A：if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return; }   [:55]
             — 已由 Project Owner 確認 isConfigured() === true，此分支不會擋下。
    分支點 B：var identity = AHS.SyncBridge.identity(); if (!identity) { return; } [:56-57]
             — 需要真實 session 且 AHS.PersistenceAdapter 已快取 identity（見 Task 3）。
    ↓
④ AHS.SyncBridge.subjectIdFor(record.subject).then(...)       [WrongBookRuntime.js:58]
    分支點 C：if (!subjectId) { return; }                       [:59]
             — subjectIdFor() 對 "subjects" 表發出真實 GET，查無對應 code 或該次
               read() 本身失敗都會讓 subjectId 為 null，此分支完全靜默（無
               console、無 retry，Phase 2 已記錄為 Category K 真實缺陷）。
    ↓
⑤ 組出真實 row（user_id/student_profile_id/subject_id/...），呼叫：
    AHS.SyncBridge.pushFireAndForget(function () {
      return repo.insert("wrong_book", row);                   [WrongBookRuntime.js:80-88]
    });
    ↓
⑥ AHS.SyncBridge.pushFireAndForget(promiseFactory)             [js/repository/SyncBridge.js:165]
    → try { var p = promiseFactory(); ... p.then(...) }         [:166-188]
    — 這一步本身沒有會靜默吞掉呼叫的分支：promiseFactory() 一定會被呼叫（除非
      它自己拋出同步例外，此時走 catch 區塊 [:189-191] 印出 console.warn，非靜默）。
    ↓
⑦ AHS.RepositoryFactory.create() 回傳 SupabaseRepository 實例
    ↓
⑧ SupabaseRepository.prototype.insert = function (table, row) {
      return AHS.SupabaseClient.insert(table, row);             [js/repository/SupabaseRepository.js:40-41]
    };
    — 純委派，無額外條件分支，不會靜默中斷。
    ↓
⑨ AHS.SupabaseClient.insert(table, row)                        [js/core/SupabaseClient.js:207]
    分支點 D：var guard = requireConfigured(); if (guard) { return guard; }  [:208-209]
             — requireConfigured() 內部呼叫 isConfigured()，已確認 true，此分支不會擋下。
    ↓
⑩ fetch(restUrl(table), { method: "POST", headers: baseHeaders(...), body: JSON.stringify(row) })
   .then(parseResponse).catch(...)                              [SupabaseClient.js:210-215]
    — 真正的網路呼叫本身。
```

### 結論：在「Configuration 已確認 true」的前提下，唯一還可能讓真實 `fetch(` 從未被呼叫的分支，只剩下③的分支點 B（`identity()` 回傳 null）與④的分支點 C（`subjectIdFor()` 回傳 null）——⑤～⑩ 皆為無條件執行、不會靜默中斷的直接呼叫鏈。

這兩個分支點都需要 Task 1（真實 Network 記錄）與 Task 3（真實 Session/Identity 狀態）的真實證據才能確認是否真的被觸發——本 Sandbox 無法產生真實瀏覽器對 Production Supabase 的請求（此為已於 AI-126B 確認、與本次「GitHub Pages」無關的、獨立的既有 Sandbox 出站網路限制，本輪僅陳述一次，不重新討論），因此 Task 1/3（真實部分）/4/5/6 需要 Project Owner 提供。

---

## Task 3｜Authentication / Identity — 程式碼邏輯（Phase 2 已用完整模擬後端真實執行驗證過，本輪重新引用同一組已驗證結論，未變更）

```
AHS.RepositoryFactory.create().getSession()                    [SupabaseRepository.js:31]
  → AHS.SupabaseClient.getSession() → session()                [SupabaseClient.js:187-189, 51-54]
  → 讀 AHS.PersistenceAdapter.loadGlobal("supabase.session")

AHS.SyncBridge.identity()                                       [SyncBridge.js:42-53]
  → var session = AHS.SupabaseClient.getSession();
  → var userId = session && session.user && session.user.id;   ← 真實 Supabase Auth User ID，非 student.id
  → 比對 AHS.PersistenceAdapter.loadGlobal("supabase.identity") 快取的 cached.userId === userId
  → 相符才回傳 { userId, studentProfileId }，否則回傳 null
```

Phase 2 已用完整模擬 Supabase 後端（假 `fetch()`，真實 `AHS.AuthRepository.loginForMockStudent()` → `ensureOwnProfile()` → `AHS.SyncBridge.cacheIdentity()` 全鏈路真實執行）證實：`identity().userId` 確實是真實 Auth User ID，不是 Mock Student 自己的 `student.id` — 此結論不受本輪 Configuration 從假變真的影響，邏輯本身沒有變更。

**本輪需要 Project Owner 額外確認的真實部分**：登入 Student A 後，在 Console 執行並回報（**不得輸出完整 access token**）：
```js
JSON.stringify(AHS.SyncBridge.identity())
```
若回傳 `null`，代表 Task 2 的分支點 B 被觸發——這本身就是一個確定性的第一失敗點（往下追：`AHS.SupabaseClient.getSession()` 是否真的有值？是否曾經呼叫過 `AHS.AuthRepository.loginForMockStudent()`？登入時 Console 是否有任何錯誤？）。

---

## Task 1｜真實 REST Write Trace — 需要 Project Owner 提供（本 Sandbox 無法產生）

請依原文件 Task 1 步驟執行（登入 Student A → 教材中心答錯 1 題 → F12 → Network → Filter `rest/v1`），並回報：

1. 是否出現任何 `rest/v1` 或 `auth/v1` 請求（登入當下、答錯當下皆包含在內）
2. 若有：每個請求的 Request URL／Method／Status Code／Response Body／Request Payload／是否有 `Authorization`／`apikey` header（**不需要提供內容本身**）
3. 若完全沒有出現任何請求：這本身就直接確認 Task 2 分支點 B 或 C 被觸發（identity() 或 subjectIdFor() 其中之一為 null）——請同時回報上方 Task 3 要求的 `AHS.SyncBridge.identity()` 結果，可一次判斷是哪一個。

---

## Task 4/5｜HTTP Status 判讀 + Database 確認 — 需要 Project Owner 提供

依 Task 1 取得的真實 Status Code，對照原文件 Task 4 的判讀表（401/403/404/409/2xx）。

**特別提醒（Phase 2 已記錄、本輪需要 Project Owner 實際確認的一個具體、真實的檢查項目）**：若 Status 為 2xx 但 Task 5 發現 Supabase Dashboard Table Editor 裡 `wrong_book` 依然沒有新增列，或若完全沒有 `rest/v1/wrong_book` 請求出現（Task 2 分支點 C），請額外到 Supabase Dashboard → Table Editor → `subjects` 表，確認是否真的有 9 筆種子資料（`chinese/english/math/physics/chemistry/biology/history/geography/civics`）。原因：`supabase/seed/0001_subjects.sql` 的檔頭明確記載「Not applied automatically by `supabase db push`」，必須手動執行 `psql ... -f supabase/seed/0001_subjects.sql`；若這張表目前是空的，`subjectIdFor()`（Task 2 分支點 C）會對每一次 WrongBook 寫入都回傳 `null`，造成完全靜默、無任何 Console/Network 證據的寫入失敗——這既能解釋「毫無資料保存」，也精準對應本任務 Task 2 要求指出的「第一個未執行位置、原因、觸發條件與原始碼位置」。

---

## Task 6｜Readback — 待 Task 1/4/5 確認 Database 端真的有資料後才需要執行

若 Task 5 確認 Database 已有真實資料列，才需要進行登出／關閉瀏覽器／重新開啟／重新登入的 Readback 驗證（PR #79 Root Cause B 已修正 Pull→UI Render 的既有缺口，理論上應該正確顯示；若屆時仍有問題，需要另一輪真實證據）。

---

# AI Supabase Persistence Phase 4 Real Write Diagnostic

```
A. 真實 Write Trace（程式碼層級，現行已提交程式碼，逐行引用）：
UI Action → WrongBookRuntime.sync() [WrongBookRuntime.js:188]
→ pushRecord() [:54] → identity() 檢查 [:56-57] → subjectIdFor() 檢查 [:58-59]
→ SyncBridge.pushFireAndForget() [SyncBridge.js:165] → RepositoryFactory.create()
→ SupabaseRepository.insert() [SupabaseRepository.js:40] → SupabaseClient.insert()
[SupabaseClient.js:207] → fetch()
在 Configuration 已確認 true 的前提下，⑤~⑩ 為無條件直接呼叫鏈，不會靜默中斷；
唯二可能的靜默中斷點收斂為：identity() 回傳 null，或 subjectIdFor() 回傳 null。

B. 第一個失敗點（候選，待真實證據確認其一）：
候選 1 — Layer: WrongBookRuntime.pushRecord() / File: js/runtime/WrongBookRuntime.js:57 /
  Observed: 待確認 / Expected: identity() 回傳真實 {userId, studentProfileId} /
  Root Cause: 若為 null，代表 Session 或 Identity 快取未成功建立
候選 2 — Layer: WrongBookRuntime.pushRecord() / File: js/runtime/WrongBookRuntime.js:59 /
  Observed: 待確認 / Expected: subjectIdFor() 回傳真實 subjects.id /
  Root Cause: 若為 null，最可能原因是 Supabase 的 subjects 表尚未執行種子腳本
  （supabase/seed/0001_subjects.sql 需手動執行，非自動套用）

C. Network Evidence：
待 Project Owner 提供（本 Sandbox 無法產生真實瀏覽器 Network 紀錄）

D. Database Evidence：
待 Project Owner 提供（本 Sandbox 無法查詢 Production Supabase）

E. Final 判定：
ENVIRONMENT BLOCKED（Task 1/4/5/6 的真實網路與資料庫證據部分——與「GitHub Pages
無法取得憑證」無關，是本 Sandbox 自身既有、獨立的出站網路限制，AI-126B 已確認）
程式碼層級（Task 2/3 邏輯）：已逐行追蹤確認，收斂出兩個具體候選失敗點，等待
Project Owner 的一次真實操作即可定案。
```

---

依明文指示：找到候選失敗點後本輪即停止。不自行修正、不開始 P01～P11、不重新設計架構、不新增 GitHub Pages 部署或 Secret Injection。等待 Project Owner 提供 Task 1（Network 記錄）／Task 3（`identity()` 結果）／Task 5（`subjects` 表列數）三項真實證據，據此定案唯一 Root Cause 後，等待「開始修正」授權。
