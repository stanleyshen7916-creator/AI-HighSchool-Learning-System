# AI Platform｜Supabase Persistence Failure Root Cause Diagnosis Report

**Date**: 2026-08-08
**Status**: Root Cause Diagnosis 完成。依明文指示：立即停止，不開始修正，等待 Project Owner「開始修正」指示。

---

## 0. 前提

本任務接續 Project Owner 已重複實測確認的事實：使用結果沒有保存、關閉瀏覽器後重新登入仍沒有紀錄、不同裝置登入也沒有紀錄。本輪不得再以「架構完整」「結構測試 PASS」取代真實 Persistence 證據。以下逐層追蹤 Mandatory Diagnostic Chain，找出第一個真正失敗的位置。

---

## Task 1｜Browser Configuration — **FAIL（可重現、非猜測）**

在本 repo 目前的、已 commit 的預設狀態下（未套用任何 Project Owner 本機專屬設定），直接執行以下程式碼（**不需要任何網路連線，純本地邏輯執行，非模擬**）：

```
$ node -e "
global.window = global; global.AHS = {};
require('./js/data/SupabaseConfig.js');
require('./js/core/PersistenceAdapter.js');
require('./js/core/SupabaseClient.js');
console.log('isConfigured():', AHS.SupabaseClient.isConfigured());
"
isConfigured(): false
```

原因（`js/data/SupabaseConfig.js:31-34`）：

```js
AHS.SupabaseConfig = { url: "", anonKey: "" };
```

此檔案依 Public Repo 規範刻意保持空值（合理設計，不是缺陷本身）。問題在於：**真正該提供真實值的機制沒有接上任何真實瀏覽器頁面。**

`js/core/SupabaseClient.js:39-44` 的 `config()` 會優先讀取 `AHS.SupabaseConfigLocal`（由 git-ignored 的 `js/data/SupabaseConfig.local.js` 提供），否則 fallback 回上面的空值。但實際檢查：

```
$ grep -rn "SupabaseConfig.local" *.html
(no output — 0 matches, 所有 10 個頁面皆未載入)

$ ls js/data/SupabaseConfig.local.js
No such file or directory
```

**結論：`js/data/SupabaseConfig.local.js` 從未被任何 HTML 頁面的 `<script>` 標籤引用。這是先前「AI Persistence 真實驗證任務」已回報但依規則未修正的同一個缺口** —— 本輪確認它就是導致目前總體性 Persistence 失敗的**第一個真正失敗的位置**：無論 Project Owner 是否已經取得真實 SUPABASE_URL／anon key，只要沒有其他管道把它寫入瀏覽器實際載入的檔案，`AHS.SupabaseClient.isConfigured()` 在任何真實瀏覽器分頁中永遠回傳 `false`。

不得在 Report 中輸出完整 Publishable Key —— 本節全程未輸出、未使用任何真實金鑰。

---

## Task 2｜Browser 是否真的發出 Request — **FAIL（非 ENVIRONMENT BLOCKED，可直接以程式碼證明）**

延續上面同一個 Node 執行環境（無網路呼叫，純程式邏輯），直接呼叫寫入 API：

```
$ node -e "...
AHS.SupabaseClient.insert('wrong_book', {a:1}).then(r => console.log(JSON.stringify(r)));
"
{"data":null,"error":{"message":"AHS.SupabaseConfig.url/anonKey not set — Project Owner must supply real values before this client can connect."}}
```

`js/core/SupabaseClient.js:86-91` 的 `requireConfigured()` guard 在呼叫 `fetch(` 之前就短路回傳錯誤——`insert()`／`update()`／`read()`／`signInWithPassword()`／`signUp()` 全部共用同一個 guard（`SupabaseClient.js:101-236` 逐一檢查，每個函式開頭都是 `var guard = requireConfigured(); if (guard) { return guard; }`）。

**這證明：在目前的瀏覽器實際載入狀態下，`fetch(` 從未被呼叫過一次** —— 不是「送出後被 Proxy/RLS 拒絕」，是**根本沒有送出**。這是可用程式碼直接、確定性地證明的事實，不屬於「Claude Code Sandbox 無法連線 Production Supabase」的 ENVIRONMENT BLOCKED 範疇（那類限制指的是「程式碼確實會呼叫 fetch(，但這個 Sandbox 自己的出站網路政策擋下它」——這裡是連 fetch( 都沒被呼叫，是更上游的問題）。

若 Project Owner 已經在自己的真實瀏覽器（非本 Sandbox）用某種方式提供了真實憑證（例如手動暫時編輯已提交的 `js/data/SupabaseConfig.js` 或另行注入），則此節結論不適用於該次測試，Task 2 才需要交由 Project Owner 用瀏覽器 DevTools 實際確認（見下方第 16 節操作指引）。但依目前 repo 的已提交狀態、以及先前任務已確認「Project Owner 尚未有其他管道使用 `SupabaseConfig.local.js`」，**最可能的實際情形是：Project Owner 的每一次真實測試，Configuration 從未生效過。**

---

## Task 3｜HTTP Response — **N/A（因 Task 2 未發出任何 Request，此步驟不適用；非 ENVIRONMENT BLOCKED）**

---

## Task 4｜Supabase Database Row — **N/A（同上，因 Task 2 未發出任何 Request）**

既有、非本輪的真實證據（AI-126A-3／AI-126B 透過 GitHub Actions `workflow_dispatch` 執行，非本 Sandbox，不受本 Sandbox 網路限制）已確認 Schema／RLS／15 Tables／34 Policies／種子資料真實存在——這證明 Schema 本身沒有問題，但無法證明「使用者操作資料」曾經寫入，因為那些寫入從未在具真實網路存取的環境執行過。

---

## Task 5｜RLS — **N/A（同上，Request 從未送出，無從觸發 RLS 判斷）；未修改 RLS，本任務僅診斷**

---

## Task 6｜Fire-and-Forget Error Handling — **PASS（程式邏輯正確，但有真實、獨立的「靜默」設計限制）**

檢查 `js/repository/SyncBridge.js:165-192` 的 `pushFireAndForget()`：

- 是否吃掉 Promise error：**是**（never rethrows to caller，這是既有 AI-126B/C/E LOCK 架構的設計本意 ——「不得阻塞 UI」）。
- 是否有 console 訊息：**有**（`console.warn`，非 `console.error` —— 屬 warn 等級，不會被多數瀏覽器預設的 Console 過濾等級隱藏，但確實不是 error 等級）。
- 是否有 retry：**有**（AI-126E 新增：網路層失敗會進 `offlineQueue` 並在 `online` 事件／下次 `pullAll()` 時 `flushQueue()`；401 會嘗試 `refreshSession()` 後重試一次）——這點與 Task 6 原始懷疑「完全沒有 retry」不符，程式碼確實有 retry 機制。
- 是否有使用者可見的失敗狀態：**沒有**——整條鏈路（`pushRecord()` → `pushFireAndForget()`）沒有任何 UI 層級的失敗提示、Toast、或狀態指示。

**判定：Fire-and-Forget 本身依其設計契約正確運作（PASS），但「完全沒有使用者可見的失敗提示」是一個真實、獨立存在的限制**——即使 Task 1 的 Configuration 缺口被修正，一個真實的網路/RLS/服務錯誤仍然只會留下一行 `console.warn`，一般使用者（甚至 Project Owner 手動測試時若沒開 DevTools Console）完全無法察覺寫入失敗。這也解釋了為什麼 Configuration 缺口本身可以「安靜地」導致 100% 資料遺失卻沒有任何錯誤畫面——不是巧合，是這兩個問題疊加的直接後果。

---

## Task 7｜Runtime Cache 與 Persistence 的關係 — **判定：Write Persistence Failure（於目前狀態下確認發生）**

`js/runtime/WrongBookRuntime.js`（其餘 4 個領域同構）的 `sync()`／`recordRetry()`／`archive()` 每次呼叫都會：

1. 同步更新 `store.items`（Memory Cache）並立即 `persist()`（寫入 `sessionStorage`，經 `AHS.PersistenceAdapter`）——**這一步在任何情況下都會成功**，與 Supabase 完全無關。
2. 之後才呼叫 `pushRecord()` → `AHS.SyncBridge.pushFireAndForget(...)`。

因為第 1 步永遠成功，使用者在**同一個瀏覽器分頁、同一個 session 內**會持續看到自己剛剛的操作結果（弱點清單、統計數字都正確更新）——這正是「看起來有效」的來源。但由於 Task 1（Configuration 缺口）導致第 2 步的 Supabase 寫入從未真正發生，一旦 `sessionStorage` 被清除（登出、關閉瀏覽器、換裝置——`sessionStorage` 本質上就是「不跨瀏覽器重啟、不跨裝置」），資料即完全消失，因為它從未離開過這一個分頁的 Memory Cache／sessionStorage。

**正式判定：Write Persistence Failure**（使用者看到的資料 = Memory Cache 有，Supabase 沒有，與第 10 節文件定義完全相符）。

---

## Task 8｜Logout / Login Read Path — **FAIL（找到第二個、獨立的真實缺陷，會在 Task 1 修正後繼續造成「重新登入看不到資料」的假象）**

程式碼鏈路（AI-126C/D/E 已建置，逐步有程式碼證據）：

```
Logout → AHS.WorkspaceRuntime.logout()（同步清除 Workspace，AuthRepository.logout() 背景呼叫 signOut()）
Login  → AHS.AuthRepository.loginForMockStudent() → cacheIdentity()
         [js/pages/AppLogin.js:66-68，未 await]
       → window.location.assign("index.html")
         [AppLogin.js:138，與上面的 Promise 鏈完全無關聯地立即觸發，見下方獨立發現]
新頁面（index.html 等）載入
  → RepositorySync.js 於 script 執行當下（模組載入時）自動呼叫 pullAll()
    [js/repository/RepositorySync.js:86]
  → 對每個 domain 呼叫 Runtime.pullFromRepository()（fire-and-forget，未 await）
    [RepositorySync.js:70-76]
  → 個別 Runtime（如 WrongBookRuntime.pullFromRepository()，WrongBookRuntime.js:99-137）
    非同步 fetch 遠端資料，resolve 後才把資料 merge 進 store 並 persist()
頁面 UI 初始 render
  → js/pages/AppWrongBook.js:129-152 的 init() 在 DOMContentLoaded 當下同步執行一次，
    讀取當下（幾乎必然是 pull 尚未 resolve 前）的 AHS.WrongBookRuntime.list()
    [AppWrongBook.js:141, 151]
```

**找到的真實缺陷**：`init()`／`render()` 只在頁面載入當下執行一次（`AppWrongBook.js:141` 的 `AHS.UI.mount(app, shell.root)` 只被呼叫一次；同頁面搜尋確認**沒有**任何 `pullFromRepository()`／`pullAll()` 完成後的回呼、事件監聽、或重新 render 機制）。由於 `pullAll()` 是完全 fire-and-forget、未 await（架構 LOCK 明文要求「不得要求 UI 等待 Promise」），一個真實的網路 pull 幾乎必然在頁面已經完成第一次（也是唯一一次）render 之後才 resolve。

**結果**：即使 Task 1 的 Configuration 缺口被修正、即使 Supabase 上真的有資料、即使 `pullFromRepository()` 成功把資料 merge 回 `store` 並 `persist()`——**使用者在這次頁面載入中看到的畫面依然是空的**，因為畫面根本沒有第二次 render 的機制。使用者必須做出某個會觸發元件重新建立的動作（例如切換分頁再切回、或整頁重新整理一次，因為下一次 `hydrate()` 才會讀到剛剛已經 `persist()` 進 `sessionStorage` 的資料）才會意外看到資料出現。

**正式判定：Read / Hydration Failure（第二個、與 Task 1 相互獨立的真實缺陷）**——Database 有資料的前提下，Pull 確實有把資料寫回 Runtime Memory Cache，但沒有機制把它呈現到已經 render 完成的 UI，等同「使用者角度看到沒有資料」。

**額外、與此相關的獨立發現（compounding，非本次 ROOT CAUSE 分類本體，但直接影響 Task 8 鏈路的可靠性）**：`js/pages/AppLogin.js:66-68` 呼叫 `AHS.AuthRepository.loginForMockStudent(s)` 完全未 `await`／未串接其 Promise，`state.step = 2; render();` 立即接著同步執行；`stepSemester()` 的「進入平台」按鈕（`AppLogin.js:128-139`）呼叫 `window.location.assign("index.html")` 觸發整頁導航，與前面 `loginForMockStudent()` 這條真實 Supabase Auth 登入鏈（`signInWithPassword`/`signUp` → `ensureOwnProfile()` → `cacheIdentity()`，`js/repository/AuthRepository.js:64-113`）完全沒有任何協調機制。真實使用者點擊「學生→學校→學期→進入平台」的操作速度完全可能快於一次真實 Supabase Auth 網路往返（讀 `student_profiles` 甚至還要多一次 insert），這種情況下 `cacheIdentity()`（把 identity 寫入 `sessionStorage`）會在整頁導航、原分頁 JS 狀態被摧毀之後才執行——但因為 `window.location.assign` 是同分頁導航（非開新分頁），`sessionStorage` 本身不會被清空，只是這一次「還沒來得及寫入」的 identity 就永遠遺失了，直到下次登入才會重新嘗試。這個問題目前因為 Task 1（Configuration 缺口）已經先讓 `loginForMockStudent()` 在第一步就以 `{skipped:true, reason:"not-configured"}` 提前返回而被「掩蓋」——**修正 Task 1 之後，這個 race condition 才會開始實際影響「新登入的 identity 是否成功快取」，屆時需要一併處理**（詳見下方 Recommended Fix）。

---

## Task 9｜Student Identity — **PASS（程式碼可驗證，沿用先前任務已確認之結論，本輪重新引用同一組真實程式碼證據）**

```
Supabase Auth User ID（session.user.id，AuthRepository.js:89-92 ensureOwnProfile() 取得）
  = student_profiles.user_id（RLS auth.uid() = user_id，只能查到/建立自己的列）
  = AHS.SyncBridge.identity().studentProfileId（cacheIdentity() 寫入，AuthRepository.js:98/109）
  = 每個 pushX() 組出的 row.student_profile_id / row.user_id（例如 WrongBookRuntime.js:62-63）
```

`loginForMockStudent()` 使用決定性帳密（依 `student.id` 產生固定 email/password，`AuthRepository.js:49-54`），同一個 Mock Student 永遠對應同一個真實 Supabase Auth 帳號；`SyncBridge.identity()`（`SyncBridge.js:42-53`）額外驗證 `cached.userId === session.user.id` 才回傳快取值，不會誤用舊帳號的 profile id。此節結論不受 Task 1/8 的缺陷影響，是獨立正確的一段邏輯——只是在 Configuration 缺口存在的前提下，`loginForMockStudent()` 從未真正執行到會用上這條邏輯的地步。

---

## Task 10｜Root Cause Classification

### **ROOT CAUSE：A｜Configuration Failure**

**理由**：Mandatory Diagnostic Chain 中最上游、且可用程式碼直接、確定性證明（非猜測、非「架構看起來正確」）的第一個真正失敗位置是 Task 1／2 ——`js/data/SupabaseConfig.local.js`（Project Owner 提供真實憑證的唯一既定機制）沒有被任何 HTML 頁面載入，導致 `AHS.SupabaseClient.isConfigured()` 在真實瀏覽器中恆為 `false`，`fetch(` 從未被呼叫一次。這個單一缺口足以獨立解釋 Project Owner 回報的**全部**症狀：使用結果未保存（Task 7：Write Persistence Failure，因為寫入從未真正發送）、關閉瀏覽器後重新登入沒有紀錄（因為 sessionStorage 本來就會清空，而 Supabase 端本來就沒有真正的資料可以救援）、不同裝置登入也沒有紀錄（同理，且 Repository 端根本沒有資料）。

**兩個獨立、次要（compounding）但同樣真實的缺陷，會在 Root Cause A 修正之後繼續造成類似症狀，必須一併規劃修正**：
- **Task 8 發現的 Read/Hydration 缺口**（更接近分類 I／J 的混合）：pull 完成後沒有 UI 重新 render 機制。
- **Task 8 發現的 AppLogin.js race condition**：`loginForMockStudent()` 未 await 即整頁導航，可能導致新登入的 identity 快取遺失。

---

## 14. Acceptance Evidence 對照

1. Browser Configuration 證據：Task 1（`isConfigured() === false`，可重現指令已列出，未輸出任何金鑰）。
2. Network Request 證據：Task 2（`insert()` 在呼叫 `fetch(` 之前即短路回傳，證明 Request 從未發出——比「送出但被擋」更上游）。
3. HTTP Response 證據：Task 3（N/A，因為 Request 從未發出）。
4. Database Row 證據：Task 4（本輪無新資料寫入證據；既有 Schema/種子資料證據見上，並清楚區分兩者不可混淆）。
5. User Identity 證據：Task 9（PASS，程式碼鏈路完整引用）。
6. Read Path 證據：Task 8（發現獨立的 Read/Hydration 缺口，程式碼逐行列出）。
7. Root Cause 分類：Task 10（A，並列出兩個 compounding 缺陷）。

---

## Impact

- **範圍**：全平台五個領域（Learning Progress／WrongBook／Knowledge Mastery／Statistics／Settings）— 因為全部共用同一個 `AHS.SyncBridge.isConfigured()` 判斷、同一個 `AHS.SupabaseClient.config()` 來源，Task 1 的缺口對每一個領域的影響完全一致，100% 對應 Project Owner 回報的「全部使用結果都沒有保存」。
- **嚴重性**：目前狀態下，Repository Layer／Runtime Public API／RLS／Schema 全部程式碼邏輯正確（已由結構性測試與本輪程式碼追蹤反覆確認），但**在任何真實瀏覽器中實際上等同完全沒有接上 Supabase**——功能上與「Sprint AI-126B 之前、Repository Layer 尚未建置」沒有可觀察的差異。
- **兩個 compounding 缺陷的疊加影響**：即使只修正 Configuration，若不一併處理 Read/Hydration 缺口與 AppLogin.js race condition，Project Owner 下一輪實測仍有相當機率觀察到「部分資料仍然沒有正確恢復」的殘餘症狀，可能被誤判為 Configuration 修正無效。

## Recommended Fix（僅記錄，本輪不得實作，等待 Project Owner「開始修正」指示）

1. **Root Cause A**：讓真實憑證能被瀏覽器實際載入——最小變更是把 `<script src="js/data/SupabaseConfig.local.js"></script>` 加入 `login.html` 與 9 個 Workspace 頁面（置於 `SupabaseConfig.js` 之後、`SupabaseClient.js` 之前），並確保瀏覽器在該檔案不存在時仍正常運作（404 對一個非 module `<script>` 標籤本身不會拋出未捕捉例外，需實測確認）。或者，若 Project Owner 決定改用其他機制（例如伺服器端環境變數 + 建置步驟），屬於架構層級決策，超出本診斷任務範圍，需另外授權。
2. **Compounding 缺陷 1（Read/Hydration）**：`pullFromRepository()` resolve 後，需要某種方式讓已 mount 的頁面重新 render（例如一個輕量的「pull 完成」callback/event，讓各頁面 bootstrap 訂閱後重新呼叫自己的 `init()`／局部更新對應區塊）——需仔細設計以不違反「Runtime 保持同步、UI 不得等待 Promise」的 AI-126C LOCK。
3. **Compounding 缺陷 2（AppLogin.js race condition）**：讓「進入平台」按鈕的導航等待 `loginForMockStudent()` 的 Promise resolve（或至少等待一個很短的 timeout／使用 `Promise.race`），同時不违反「保持目前 Login UI」的限制（例如在等待時維持按鈕原樣但暫時 disable，不新增任何新的視覺元素）。

以上三項修正建議彼此獨立，可分開授權、分開驗收。

---

## Regression

```
npm run verify：PASS（0 broken path，AUTHORIZED-EXCEPTION 範圍未變）
npm test：PASS（14 個結構性測試檔案全綠，0 FAIL，本輪未修改任何程式碼/測試，數字與 AI-126E/前次診斷任務完全一致）
Playwright：PASS（60/60，真實瀏覽器，本輪零程式碼變更）
```

---

## 16. Environment Constraint（Project Owner DevTools 操作指引）

本輪 Task 2/3/4/5 之所以能給出 FAIL（而非 ENVIRONMENT BLOCKED）判定，是因為在**目前的已提交 repo 狀態下**，问题在 fetch( 被呼叫之前就已經確定發生——這件事本身不需要真實網路即可證明。但一旦 Root Cause A 被修正（真實憑證能被瀏覽器載入），後續驗證仍然需要 Project Owner 在具真實網路存取的環境親自操作，因為 Claude Code Sandbox 的出站網路政策封鎖 Production Supabase 主機（已於 AI-126B Final PAT 確認，本輪未重複嘗試）。屆時請依以下步驟操作：

1. 開啟瀏覽器 DevTools → Network 分頁，篩選 `rest/v1` 或 `auth/v1`。
2. 登入任一 Mock Student，完成一次會觸發寫入的操作（例如：教材中心 → 任一教材 → 考前練習 → 答錯至少 1 題）。
3. 觀察 Network 分頁：
   - 若完全沒有出現 `POST/PATCH .../rest/v1/wrong_book` 之類的請求 → 代表 Configuration 修正仍未生效（Console 分頁執行 `AHS.SupabaseClient.isConfigured()` 應回傳 `true`，若仍為 `false`，代表 `SupabaseConfig.local.js` 依然沒被載入或內容有誤）。
   - 若出現請求 → 點開該請求，記錄 Status Code（2xx 正常；401 檢查 Session；403 檢查 RLS/Policy；404 檢查 Table 名稱；409 檢查 Unique constraint）與 Response Body 的錯誤訊息（**請勿把完整 Authorization Token 貼到任何回報文件中**，只需要 Status Code 與 error message 即可判讀）。
4. 若 Status 為 2xx：前往 Supabase Dashboard → Table Editor → 對應資料表（`wrong_book` 等），用 `user_id`／`student_profile_id` 篩選，確認是否真的新增/更新了一筆 row。
5. 登出、關閉瀏覽器、重新開啟、重新登入同一個 Mock Student，觀察知識弱點頁面是否顯示剛剛的紀錄——**若 Database 確認有 row 但 UI 仍空白，這就是本報告 Task 8 指出的 Read/Hydration 缺口的真實案例，請嘗試重新整理該頁面一次，若重新整理後資料出現，即確認該缺陷屬實。**

---

# AI Supabase Persistence Root Cause Report

```
Configuration：FAIL
Authentication：FAIL
Browser Request：FAIL
HTTP Response：FAIL
Database Row：FAIL
RLS：FAIL
Repository Write：PASS
Fire-and-Forget：PASS
Runtime Cache：PASS
Login Read Path：FAIL
Student Identity：PASS
UI Rendering：FAIL

ROOT CAUSE：
A

Evidence：
Task 1（isConfigured() 可重現地回傳 false）／Task 2（insert() 在 fetch( 之前短路回傳，證明 Request 從未發出）／
js/data/SupabaseConfig.local.js 未被任何 HTML 頁面 <script> 引用（grep 0 match，檔案本身亦不存在於工作目錄）／
Task 8（pullFromRepository() 無 UI 重新 render 機制，程式碼逐行列出）／
Task 8（AppLogin.js:66-68/138 未 await 的登入 Promise 與整頁導航之間的 race condition，程式碼逐行列出）。
完整程式碼證據見上方 Task 1-10 各節。

Impact：
全平台五個領域（Learning Progress／WrongBook／Knowledge Mastery／Statistics／Settings）100% 無法真正持久化，
因為所有領域共用同一個 Configuration 判斷點；即使修正後，Read/Hydration 與登入 race condition 兩個獨立缺陷
仍可能造成部分資料看似遺失。

Recommended Fix：
(1) 把 SupabaseConfig.local.js 的 <script> 標籤接上實際頁面（或改用 Project Owner 決定的其他憑證注入機制）；
(2) 為 pullFromRepository() 完成後補上 UI 重新 render 機制；
(3) 讓「進入平台」導航等待 loginForMockStudent() 的登入鏈完成，或改用其他方式避免 race condition。
三項可分開授權、分開驗收；本輪僅記錄，未實作任何修正。

Regression：
npm run verify：PASS
npm test：PASS
Playwright：PASS

Overall：
ROOT CAUSE IDENTIFIED
```

依明文指示：完成 Root Cause Diagnosis 後立即停止，不開始修正，不開始 P01～P11，不新增 AI-126 子 Sprint。等待 Project Owner 確認「開始修正」之後才進入下一階段。
