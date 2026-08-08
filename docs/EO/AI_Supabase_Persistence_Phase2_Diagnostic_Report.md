# AI Platform｜Supabase Persistence Failure — Phase 2 Diagnostic Report

**Date**: 2026-08-08
**Status**: 診斷完成。純診斷任務，PR #79 之後未再修改任何 UI/Repository/Runtime/Authentication/Schema/RLS。依明文指示：立即停止，等待 Project Owner 授權「開始修正」。

---

## 前提

PR #79（Root Cause A/B/C）合併後，Project Owner 依 Test A～D 重新實測，**仍然沒有任何使用紀錄**。本輪不得再要求完整 Test A～D，只找「PR #79 修正後，瀏覽器實際資料寫入為何仍未成功」。本 Sandbox 依然無法對 Production Supabase 發出真實網路請求（AI-126B Final PAT 已確認之限制，本輪未重試、未繞過 Proxy）。因此本輪採用「不需要真實網路，但比純程式碼閱讀更嚴謹」的驗證方式：**用一個完整、可重現的 Node 執行環境，載入專案真實原始碼（非改寫、非模擬邏輯），並用一個記錄每一次呼叫的假 `fetch()` 站在「真實 Supabase REST API」的位置**——這不是「程式碼看起來正確」，而是實際執行這些真實檔案的真實函式，得到的是可重現、可檢驗的真實輸出。

---

## Task 1｜Runtime Config — 程式邏輯確認 PASS；瀏覽器實際狀態需 Project Owner 提供

`AHS.SupabaseClient.isConfigured()` 的邏輯（`js/core/SupabaseClient.js:39-49`）本身正確：優先讀 `AHS.SupabaseConfigLocal`（PR #79 已接上 `<script>`），否則 fallback 到已提交的空白 `AHS.SupabaseConfig`。**但這無法回答「Project Owner 這次測試當下，瀏覽器實際載入到了什麼」**——這必須由 Project Owner 提供，Claude 無法在本 Sandbox 中代為確認。

**請 Project Owner 在瀏覽器 Console 執行並回報**（不得輸出完整 key）：
```js
AHS.SupabaseClient.isConfigured()
```
以及目前網址列的完整 URL（是 `file://.../login.html`、`http://localhost:...`，還是 `https://<username>.github.io/...`）。

**已知、必須排除的一種可能**（PR #79 報告已明文記錄，本輪重申一次，非重複診斷）：若 Project Owner 這次測試是在 **GitHub Pages 公開網址**上進行，則依 PR #79 報告已詳述的架構限制——`js/data/SupabaseConfig.local.js` 依規定必須 git-ignored、GitHub Pages 直接從 git 分支伺服檔案——**該網址上 `isConfigured()` 必然為 `false`**，這不是新缺陷，是已知、已回報、尚未取得下一步 Sprint 授權去解決的架構限制。若 Project Owner 這次仍在該公開網址測試，這就是最直接的解釋，不需要進一步調查。

---

## Task 2｜攔截 fetch — ENVIRONMENT BLOCKED（本 Sandbox 無法產生真實瀏覽器 Network 紀錄）

Section 15 提供的 fetch 攔截片段完全正確、可直接使用；但實際攔截結果只能在真實瀏覽器中取得。**依 Section 15 指示，本輪只需要 Project Owner 提供最小 4 項資訊**（見下方「Project Owner 最小協助」），不再要求完整 Test A～D。

---

## Task 3～9｜以真實原始碼 + 完整模擬 Supabase 後端執行驗證（非猜測）

方法：Node 環境載入真實檔案（`SupabaseConfig.js`／`PersistenceAdapter.js`／`SupabaseClient.js`／`RuntimeModeConfig.js`／`Repository.js`／`SupabaseRepository.js`／`RepositoryFactory.js`／`SyncBridge.js`／`AuthRepository.js`／`WrongBookRuntime.js`），提供一個真實運作的記憶體版 `sessionStorage`（因為裸 Node 沒有這個瀏覽器 API，若不提供，`AHS.PersistenceAdapter.isAvailable()` 會誠實回報「不可用」而不是製造假結果——這一步的存在本身也回答了一個重要問題：`PersistenceAdapter` 在偵測不到 `sessionStorage` 時是安全 fail-closed 的，不會拋錯，但也不會假裝成功），並提供一個記錄每次呼叫的假 `fetch()` 模擬真實 Supabase Auth／PostgREST 回應。

### 執行結果（完整輸出見下方 Evidence）

1. **`loginForMockStudent(student_a)`**：真實觸發 `POST /auth/v1/token?grant_type=password`（真實 signInWithPassword 呼叫），成功後真實觸發 `GET /rest/v1/student_profiles?user_id=eq....`（查詢既有 profile）與 `POST /rest/v1/student_profiles`（找不到則建立）。
2. **`AHS.SyncBridge.identity()`**：正確回傳 `{ userId: <真實 Supabase Auth User ID>, studentProfileId: <真實 profile row id> }`——**確認 `userId` 是真實 Auth User ID，絕不是 Mock Student 自己的 `student.id`**（Task 9 要求的「至少實際追蹤一筆資料」，本輪以真實程式執行、非「架構看起來正確」完成）。
3. **模擬一次答錯 → `AHS.WrongBookRuntime.sync(gradedResult)`**：真實觸發 `GET /rest/v1/subjects?code=eq.math`（`subjectIdFor()`），成功後真實觸發 `POST /rest/v1/wrong_book`，`row.user_id`／`row.student_profile_id` 皆正確對應真實 Auth User ID／Profile ID。
4. **模擬「重新登入、全新頁面、Database 已有一筆先前的真實資料」→ `AHS.WrongBookRuntime.pullFromRepository()`**：真實觸發 `GET /rest/v1/wrong_book?student_profile_id=eq....`，正確把回傳的一筆資料 merge 進 `AHS.WrongBookRuntime.list()`（長度從 1 變 2，包含新 pull 回來的那筆）。

### 判定

在**給定真實 Configuration（真實 URL/anonKey）與正常運作的 Supabase 後端**這個前提下，以下項目由本輪的真實程式執行證實**皆為 PASS，不是猜測**：
- **Write Path 確實會執行**（Case B 排除）
- **Identity Mapping 正確**（Case G 排除，Task 9 PASS）
- **Pull / Read 確實會執行且正確 Hydrate 回 Runtime**（Case H／I 排除）
- **`AHS.PersistenceAdapter` 在 `sessionStorage` 可用時正確運作，不可用時安全 fail-closed**（非本次症狀的成因）

這把本輪的懷疑範圍，從「Write/Read/Identity 程式邏輯本身有 bug」，收斂到**兩個更上游、更可能的方向**：（a）這次 Project Owner 測試當下的瀏覽器 Configuration 依然沒有生效（Task 1 已請 Project Owner 確認）；（b）某個特定情境下的靜默失敗分支（下方 Task 10 有一個真實發現）。

---

## Task 10｜確認 Fire-and-Forget — 找到一個真實、具體的靜默失敗分支

`js/repository/SyncBridge.js` 的 `pushFireAndForget()`（PR #78 Phase 1 診斷已確認）本身**不是**完全靜默：真實的 401／網路層錯誤／其他 4xx-5xx 都會走到 `console.warn` 或 retry queue，不是 Task 10 原本懷疑的「完全吞掉、無 console、無 retry」。

但本輪透過完整程式執行，發現一個**更早、更隱蔽**的真實靜默分支，不在 `pushFireAndForget()` 本身，而在呼叫它「之前」：

```js
// js/runtime/WrongBookRuntime.js:58-59
AHS.SyncBridge.subjectIdFor(record.subject).then(function (subjectId) {
  if (!subjectId) { return; }   // ← 完全靜默：無 console、無 error、無 retry
  ...
```

`subjectIdFor(code)`（`js/repository/SyncBridge.js:71-85`）若對應的 `subjects.code` 在資料庫中查不到（或該次 `read()` 本身失敗），會 resolve 成 `null`，而 `pushRecord()` 收到 `null` 後**直接 `return`，完全沒有任何診斷輸出**——這條路徑連 `pushFireAndForget()` 都還沒被呼叫到，所以連 Phase 1 已確認的 `console.warn` 也不會出現。

**判定為 Category K｜Silent Error（真實、具體，本輪新發現）**——但範圍僅限 **WrongBook** 這一個領域（其他四個領域 Learning Progress／Knowledge Mastery／Statistics／Settings 的 push 路徑皆不依賴 `subjectIdFor()`，例如 `SettingsRuntime.pushSettings()` 只檢查 `isConfigured()`／`identity()`，見 `js/runtime/SettingsRuntime.js:102-104`）。**因此這個發現本身不足以解釋「全部領域皆無使用紀錄」這個回報症狀**（若只有 WrongBook 受影響，Settings／Learning Progress 應該仍會成功）——除非 Project Owner 這次的實測操作恰好只測了 WrongBook 相關動作。仍記錄為真實缺陷，供後續授權修正參考。

實際查詢 `supabase/seed/0001_subjects.sql` 確認：9 個 subject code（chinese/english/math/physics/chemistry/biology/history/geography/civics）與 `js/data/AppConfig.js` 的 `subjectOptions` 完全一致——這不是「code 對不上」的問題；但此 seed 檔案本身的頭部註解明確寫著「Not applied automatically by `supabase db push`」，必須額外手動執行 `psql ... -f supabase/seed/0001_subjects.sql`。AI-126A-3／AI-126B 的真實部署當時**已確認**這 9 筆種子資料存在（Phase 1 報告已引用），但那是先前某次部署時間點的快照，本輪無法（也不應該）代 Project Owner 確認「現在」是否依然存在——如果資料庫在那之後曾經被重建/重置過，這條路徑就會變成全 WrongBook 領域的真實 Root Cause。

---

## Task 11｜Root Cause Classification

### **ROOT CAUSE：A｜Config / Environment（與 Phase 1 判定一致，本輪以更嚴謹的方式重新確認，非重複診斷同一件事——本輪新增的是「排除 B/C/G/H/I」的真實執行證據，而非只重申 A）**

**理由**：
1. 本輪以真實程式碼 + 完整模擬後端執行證實，Write Path／Identity Mapping／Pull-Hydration 這幾條最容易被懷疑的鏈路，在「給定真實 Configuration」的前提下全部正確——這排除了 Case B／C（部分）／G／H／I 是「全部領域、每一次操作都失敗」的成因。
2. 唯一能同時解釋「Settings、WrongBook、Learning Progress 等全部領域全部沒有紀錄」的位置，只剩最上游的 `isConfigured()` 判斷——這與 Phase 1 判定的位置完全相同，而 PR #79 已經修正了「本機測試」情境下的這個問題，代表**這次 Project Owner 的測試很可能仍不是在「已正確載入 `SupabaseConfig.local.js` 的本機環境」下進行**（最可能：測試網址是 GitHub Pages 公開網址，PR #79 報告已明確告知這個網址依然不會生效；次可能：本機 `SupabaseConfig.local.js` 檔案內容/位置有誤）。
3. 次要、真實、範圍較窄的發現（Category K｜Silent Error，`subjectIdFor()` 靜默分支）已記錄，僅影響 WrongBook 一個領域，不單獨構成本輪「全面失敗」的解釋，但值得在下一輪授權修正時一併處理。

---

## Evidence（本輪真實執行輸出，非模擬敘述）

```
Step 0: isConfigured() = true
Step 1: loginForMockStudent(student_a)
[FETCH] POST https://fake-project.supabase.co/auth/v1/token?grant_type=password
[FETCH] GET  https://fake-project.supabase.co/rest/v1/student_profiles?user_id=eq.<真實-Auth-User-Id>
[FETCH] POST https://fake-project.supabase.co/rest/v1/student_profiles
Step 2: identity() = { userId: <真實-Auth-User-Id>, studentProfileId: "profile-uuid-abc" }
  identity.userId === 真實 Auth User Id？ true
  identity.userId === student.id（會是一個 Bug）？ false
Step 3: WrongBookRuntime.sync() -> [FETCH] GET /rest/v1/subjects?code=eq.math -> [FETCH] POST /rest/v1/wrong_book
  row.user_id / row.student_profile_id 皆正確對應真實 identity
Step 6: 模擬全新頁面重新登入 -> pullFromRepository() -> [FETCH] GET /rest/v1/wrong_book?student_profile_id=eq....
  pullFromRepository() = { pulled: 1 }；list() 正確包含這筆新 pull 回來的資料
```
（完整、逐行原始輸出已在本輪 Sandbox 內執行留存；上方為去除模擬用假 URL/UUID 外觀資訊後的摘要，無真實憑證涉入。）

---

## Impact

- 若 Task 1 確認 Project Owner 這次測試仍在 GitHub Pages 公開網址：Impact = 100% 全平台，且**在目前架構下無法單靠 Runtime/Repository 端修正解決**，需要另一輪明確授權、討論部署機制的 Sprint（PR #79 報告已提出此點，本輪重申但不重複展開討論）。
- 若確認是本機 `SupabaseConfig.local.js` 設定有誤：Impact 同樣是 100% 全平台，但修正方式簡單（Project Owner 修正該檔案內容/位置即可，無需程式碼變更）。
- Category K（`subjectIdFor()` 靜默分支）：Impact 僅限 WrongBook 領域，且僅在 `subjects` 表查無對應 code 時才觸發。

## Recommended Fix（僅記錄，本輪不得實作）

1. 依 Task 1 結果，確認 Configuration 問題的具體性質（部署網址 or 本機檔案），此步驟本身通常不需要程式修正。
2. 若 Category K 確認為真實影響因素，建議修正：`subjectIdFor()` resolve 為 `null` 時，讓 `pushRecord()` 也走一次 `console.warn`（例如「WrongBook push skipped — unknown subject code: <code>」），避免未來再次出現「完全無診斷線索」的靜默失敗。

---

# AI Supabase Persistence Phase 2 Diagnostic

```text
Runtime Config：
FAIL（依真實程式邏輯，isConfigured() 的判斷本身正確；但無法確認 Project Owner 這次測試瀏覽器的實際狀態，已請其提供）

Supabase Write Request：
NOT FOUND（本 Sandbox ENVIRONMENT BLOCKED，無法產生真實瀏覽器 Network 紀錄；已請 Project Owner 提供最小 4 項資訊）

Write Endpoint：
（待 Project Owner 提供）

HTTP Status：
（待 Project Owner 提供）

Database Row：
ENVIRONMENT BLOCKED

RLS：
NOT VERIFIED

Identity：
PASS（真實程式執行證實：identity().userId 為真實 Auth User ID，非 Mock Student 的 student.id）

Pull Request：
NOT FOUND（同 Supabase Write Request，ENVIRONMENT BLOCKED）

Pull HTTP Status：
（待 Project Owner 提供，如需要）

Runtime Hydration：
PASS（真實程式執行證實：給定真實 Configuration 與正常 Supabase 回應，pullFromRepository() 正確 merge 資料回 Runtime）

UI Render：
PASS（PR #79 Root Cause B 已修正並通過 Playwright Regression，本輪未變更）

Fire-and-Forget：
PASS（有 console.warn／有 retry，非完全靜默）——但發現一個更早、範圍較窄的真實靜默分支（見 Category K）

ROOT CAUSE：
A

Evidence：
見上方「Evidence」與「Task 3～9」章節——真實程式碼 + 完整模擬 Supabase 後端執行，證實 Write/Identity/Pull/Hydration 邏輯正確；
唯一能解釋全平台全面失敗的位置收斂回 Configuration/Environment。

Impact：
見上方 Impact 章節，依 Task 1 結果分兩種可能性。

Recommended Fix：
見上方 Recommended Fix 章節，僅記錄，未執行。

Regression：
不執行程式修改，因此維持既有結果（npm run verify / npm test / Playwright 皆與 PR #79 合併後一致，本輪零程式碼變更）

Overall：
ROOT CAUSE IDENTIFIED（primary）／ENVIRONMENT BLOCKED（Task 1 的最終確認與 Task 2 的 Network 證據，仍需 Project Owner 提供）
```

---

## Project Owner 最小協助（依 Section 15，不再要求完整 Test A～D）

只需要以下 4 項，即可讓本輪的 Root Cause 判定從「推論」變成「確認」：

1. **F12 → Network，篩選 `rest/v1`**
2. **登入任一 Mock Student → 答錯一題**（產生一次 WrongBook 寫入嘗試）
3. **把該次操作期間出現（或完全沒有出現）的 Request 資訊提供給 Claude**：Request URL、Request Method、Status Code、Response（**不要提供 Token/Key**）
4. **順便在 Console 執行並回報**：`AHS.SupabaseClient.isConfigured()` 的結果，以及目前網址列的完整網址（file://、localhost，或 GitHub Pages 網址）

若完全沒有出現任何 `rest/v1` 或 `auth/v1` 請求：直接確認 Root Cause A（Configuration 未生效），不需要再往下追。
若有出現請求但 Status 非 2xx：請一併提供 Status Code 與 Response 內容，Claude 可據此判斷是否為 RLS（403）／Identity（401）／Endpoint（404）等問題。

---

依明文指示：完成本輪診斷後立即停止。不修正程式、不開始 P01～P11、不新增 Sprint、不修改 Baseline。等待 Project Owner 提供上述 4 項最小協助，並在確認後給出「開始修正」指示。
