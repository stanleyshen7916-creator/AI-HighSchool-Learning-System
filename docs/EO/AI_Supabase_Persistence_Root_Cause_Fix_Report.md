# AI Platform｜Supabase Persistence Root Cause Fix Report

**Date**: 2026-08-08
**Status**: 三個已確認 Root Cause 皆已修正並通過 Regression。依明文指示：立即停止，不開始 P01～P11，等待 Project Owner 實測 + PAT。

---

## Root Cause A｜Supabase Config 未載入 — **修正**

### Fix
1. `.gitignore` 已有的 `js/data/SupabaseConfig.local.js`（git-ignored、Project Owner 本機填入真實憑證，AI-126B Final PAT 建立的既有機制，本輪未重新設計）現在被**真正接上瀏覽器**：所有 10 個頁面（`login.html` + 9 個 Workspace 頁面）在既有 `<script src="js/data/SupabaseConfig.js">` 標籤之後，新增一行 `<script src="js/data/SupabaseConfig.local.js"></script>`。這是 Root Cause A 修正的唯一必要程式碼變更——不新增 Config 架構，`AHS.SupabaseConfigLocal`／`AHS.SupabaseConfig` 的欄位形狀完全不變，`js/core/SupabaseClient.js`'s `config()` 既有的「優先 Local、否則 fallback」邏輯（AI-126B Final PAT 已建置）原封不動。
2. 未把任何 Service Role Key／Database Password／Access Token 放入前端——`SupabaseConfig.local.js` 這個機制本身從 AI-126B 建立起就只承載 `url`／`anonKey`（Publishable Key），本輪未變更此邊界。
3. `js/data/SupabaseConfig.local.js` 本身依然保持 git-ignored（`.gitignore` 未變更），未被 commit。

### 必要的配套修正（避免破壞 Regression，仍屬「Supabase Browser Configuration 接線」範圍）
一個真實、可選、git-ignored 的 `<script src>` 檔案在**不存在**時（CI／這個 Sandbox／任何全新 clone 皆是如此，設計上就是如此），會讓：
- **jsdom 測試工具**（15 個檔案：`tests/jsdom/BehaviorSuite.js` + 14 個 `tests/regression/*.js`）原本直接 `fs.readFileSync()` 每個 `<script src>` 對應的檔案——缺檔會讓 `fs.readFileSync` 拋出真實例外，導致整個測試檔案崩潰。修正：全部 15 個檔案的 script-loader 迴圈加上 `fs.existsSync()` guard，缺檔時單純跳過（不視為錯誤）——與 AI-126B Final PAT 已建立的「`tests/supabase/RepositorySmoke.js`／`CrossDeviceSmoke.js` 條件式 `require()`」precedent 完全一致的設計精神。
- **真實瀏覽器（Playwright）**：一個 `<script src>` 404 一定會在 Console 記錄一筆「Failed to load resource」（這是瀏覽器網路層行為，無法透過任何 `onerror` handler 抑制）。本專案 9 個 Playwright spec 檔案各自都有「頁面 Console Error 必須為 0」的既有斷言。修正：9 個檔案的 `collectErrors()` 改為依失敗資源的**實際 URL**（`msg.location().url`，而非訊息文字比對，避免掩蓋其他檔案的真實 404 回歸）過濾掉這唯一一筆、預期中的 `SupabaseConfig.local.js` 404。
- **`scripts/verify/VerifyPaths.js`**：新增一個明確、單一、有記錄的 `OPTIONAL_GITIGNORED` 允許清單（僅此一個檔名），比照 `VerifyForbiddenPatterns.js` 既有的 `AUTHORIZED_EXCEPTIONS` 設計慣例。

### Public Repository 注意事項（依明文要求誠實回報，本輪未自行決定架構）
上述修正完整解決了 **Project Owner 本機（file:// 或本機伺服器）真實測試**的 Configuration 缺口——這正是 Fix Spec 第 7 節 Test A-D 描述的操作方式（Project Owner 自己的 Chrome，自己的機器）。

但**GitHub Pages（公開部署網址）本身依然無法取得真實憑證**：`SupabaseConfig.local.js` 依規定必須維持 git-ignored，GitHub Pages 直接從 git 分支伺服檔案，git-ignored 的檔案永遠不會出現在部署結果中。目前 repo 沒有任何 GitHub Pages 部署用的 Actions Workflow（`.github/workflows/` 只有 `playwright.yml`／`supabase-deploy.yml`，Pages 是直接以分支伺服靜態檔案，沒有建置/部署步驟）——若要讓 GitHub Pages 也能取得真實憑證，唯一路徑是新增一個部署時的 Secret 注入機制，這屬於「自行設計新部署系統」，依 Fix Spec 第 2 節明文指示：

> 若現有架構無法同時滿足「Public Repository」與「GitHub Pages Runtime 取得公開設定」，請停止並回報 Project Owner，不自行設計新部署系統。

**本輪依此指示停止並回報**：GitHub Pages 上的正式網址目前、以及本輪修正後，依然不會有真實 Supabase 連線（`isConfigured()` 仍為 `false`）——這不是本輪修正的缺陷，而是「Public Repository 不得 commit 真實憑證」與「GitHub Pages 無建置步驟」兩個既有限制的直接結果。Section 7 的 Test A-D 建議 Project Owner 於**本機**（非 GitHub Pages 公開網址）執行，本機測試不受此限制。若 Project Owner 需要 GitHub Pages 正式網址本身也能連線 Supabase，需要另一輪明確授權、討論部署機制的 Sprint。

---

## Root Cause B｜Pull 後 UI 沒有 Render — **修正**

### Fix
`js/repository/RepositorySync.js`'s `pullAll()`：原本對每個 domain 的 `pullFromRepository()` 各自 fire-and-forget、互不等待；現在改為蒐集全部 Promise，`Promise.all()` 全數 settle 後，dispatch 一個原生 `window` `CustomEvent`：`"ahs:repository-pulled"`。

9 個 Workspace 頁面 bootstrap（`js/pages/App{Home,Materials,Quiz,WrongBook,Summary,Learning,Tutor,Dashboard,Review}.js`）各自在既有的 `guardedInit()` 掛載邏輯之後，新增一行 `window.addEventListener("ahs:repository-pulled", guardedInit)`——重新執行**同一個、完全未修改**的 `guardedInit()`/`init()`。這是安全、冪等的：`js/core/UI.js`'s `mount()` 每次呼叫都會 `parent.innerHTML = ""` 先清空再重建，因此重新呼叫 `init()` 不會產生重複 DOM。

### 為何符合限制
- **不修改 Runtime Public API**：`list()`/`get()`/`homeKpis()`/... 一律未變；事件由 Repository 層（`RepositorySync.js`，已知會等待 Promise）dispatch，Runtime 完全不需要知道這個事件存在。
- **不要求既有 UI 改成 Promise API**：`guardedInit()` 本身依然是同步函式，呼叫方式與 DOMContentLoaded 時完全一樣，只是多了一個觸發時機。
- **未新增大型 State Management Framework**：使用瀏覽器原生 `CustomEvent`/`addEventListener`，零額外依賴。
- **只在真的有 Pull 執行時才觸發**：`pullAll()` 開頭的既有 guard（`isConfigured()`／`identity()`）不變，未登入/未設定時完全不會 dispatch，不會有多餘的重新 render。

### Acceptance（程式碼層級可驗證的部分）
`Database 有資料 → Pull → Runtime Cache 更新 → CustomEvent → guardedInit() 重跑 → UI 使用最新 Cache render` 這條鏈路本輪透過程式碼追蹤 + Regression（Playwright 60/60，涵蓋每個頁面的正常掛載流程零回歸）確認；真實「Database 端真的有資料」這一段目前仍受 Root Cause A 的 GitHub Pages 限制與本 Sandbox 網路限制影響（見下方 Regression／Project Owner Persistence Test 兩節）。

---

## Root Cause C｜Login Navigation Race Condition — **修正**

### Fix
`js/pages/AppLogin.js`：
1. `stepStudent()` 的學生選擇按鈕：原本呼叫 `AHS.AuthRepository.loginForMockStudent(s)` 但完全不保留其回傳的 Promise（純 fire-and-forget）。現在改為 `state.loginPromise = AHS.AuthRepository.loginForMockStudent(s).catch(...)`——保留這次登入嘗試的真實 Promise。
2. `stepSemester()` 的「進入平台」按鈕：原本在 `AHS.WorkspaceRuntime.setCurrent(...)` 成功後立即 `window.location.assign("index.html")`，與登入 Promise 完全無關聯。現在改為 `Promise.resolve(state.loginPromise).then(function () { window.location.assign("index.html"); })`——**真正等待**上一步的登入 Promise 完成，才進行整頁導航。

### 為何符合限制
- **不修改 Login UI**：DOM 結構、文案、樣式一律未變；唯一的行為變化是「進入平台」按鈕在等待期間暫時 `disabled`（防止等待期間重複點擊觸發兩次 `setCurrent()`——沿用這顆按鈕原本就有的 `disabled` 屬性切換模式，非新增元素）。
- **保留 Student = User = Profile**：未新增第二套身分模型，`state.loginPromise` 純粹是既有 `loginForMockStudent()` 呼叫的完成信號。
- **不重新設計 Authentication／不新增另一套登入流程**：`AuthRepository.js`／`SupabaseClient.js`／`SyncBridge.js` 全部未修改，呼叫方式完全一樣，只是多了「記住並等待這次呼叫的 Promise」。
- **不以固定 `setTimeout()` 假性解決**：等待的是真實 Promise（`Promise.resolve(state.loginPromise).then(...)`），未設定任何時間），未配置未設定/Supabase 未設定時 `state.loginPromise` 為 `null`，`Promise.resolve(null)` 會在下一個 microtask 立即 resolve，行為與修正前幾乎無差異（不會拖慢既有流程）。
- **必須以 Promise / callback completion 作為真正完成條件**：`loginForMockStudent()`（`js/repository/AuthRepository.js`）本身的 Promise 鏈已包含 `signInWithPassword`/`signUp` → `ensureOwnProfile()` → `cacheIdentity()` 全部步驟才 resolve，等待這個 Promise 即是等待 identity 真正快取完成，不是只等某個中間步驟。

---

## Regression

```
npm run verify：PASS（0 broken path，OPTIONAL_GITIGNORED 允許清單僅一筆、有記錄；AUTHORIZED-EXCEPTION 範圍未變）
npm test：PASS（14 個結構性測試檔案全綠，0 FAIL——330+6+29+37+35+45+36+12+11+6+8+28+44+31+44，與修正前數字完全一致，本輪未新增/刪除任何測試）
Playwright：PASS（60/60，真實瀏覽器 file:// 協定，涵蓋全部 10 個頁面）
```

修正過程中的真實發現（誠實記錄，非本輪造成，已驗證修正前後行為一致，不列入本次 Regression 影響範圍）：`tests/regression/InitializationGuard.js`（[B] 首頁正常 Render 斷言）、`tests/regression/MaterialBatchPersistence.js`、`tests/regression/MaterialDownloadFlow.js` 三個檔案本身早已因 Node 22 的 `Object.defineProperty`/File API 相容性問題而失敗——透過 `git stash` 比對修正前後執行結果完全相同，確認與本輪三個 Root Cause 修正無關，且這三個檔案本來就不在 `npm test` 的預設鏈路中（package.json `"test"` script 未包含它們）。

---

## Project Owner Persistence Test — **PENDING（等待 Project Owner 實測）**

依 Fix Spec 第 10 節 Environment Constraint：本 Sandbox 依然無法直接連線 Production Supabase（AI-126B Final PAT 已確認的既有限制，本輪未重複嘗試、未繞過 Proxy）。三個 Root Cause 的程式碼修正已完成並通過 Regression，但**真實 Persistence PASS 的唯一判準**（Section 8：`User Action → Supabase HTTP Request → HTTP 2xx → Database Row → Logout → Browser Restart → Login → Repository Pull → Runtime Cache → UI Render`，且 `Device A = Device B`）必須由 Project Owner 在具真實網路存取的環境親自驗證，Claude 不得宣稱已 PASS。

**執行前置條件**：Project Owner 需先在本機（非 GitHub Pages 公開網址——原因見上方 Root Cause A 的「Public Repository 注意事項」）建立/確認 `js/data/SupabaseConfig.local.js` 內容為：
```js
window.AHS = window.AHS || {};
AHS.SupabaseConfigLocal = { url: "https://teddsuhnmsknkcmxpyla.supabase.co", anonKey: "<Publishable Key>" };
```
確認此檔案與各 HTML 檔案在同一個 repo checkout 內（`js/data/SupabaseConfig.local.js`），然後直接以瀏覽器開啟 `login.html`（file:// 或本機靜態伺服器皆可）即可——本輪修正後，所有頁面都會自動載入這個檔案，不需要任何額外設定步驟。

請依 Fix Spec 第 7 節 Test A-D 執行（Write → Logout → Browser Restart → Login 確認 → Cross Device），DevTools 操作指引沿用先前 Root Cause Diagnosis Report 第 16 節的說明（Network 分頁篩選 `rest/v1`／`auth/v1`，確認 Status Code 與 Response）。

---

# AI Supabase Persistence Root Cause Fix Report

```
Root Cause A｜Config：
PASS

Root Cause B｜Pull → UI Render：
PASS

Root Cause C｜Login Race：
PASS

Regression：
npm run verify：PASS
npm test：PASS
Playwright：PASS

Project Owner Persistence Test：
PENDING

Overall：
CONDITIONAL PASS
（三個 Root Cause 的程式碼修正與 Regression 全部完成；真實 Persistence PASS 需要 Project Owner 於具真實網路存取的環境依 Section 7 Test A-D 實測後確認。另誠實回報一項架構限制：GitHub Pages 公開網址本身依然無法取得真實憑證，原因與建議見上方 Root Cause A 專節，本輪未自行決定解法。）

Changed Files：
- login.html, index.html, materials.html, quiz.html, wrongbook.html, summary.html, learning.html, tutor.html, dashboard.html, review.html（各新增 1 行 <script> 標籤）
- js/repository/RepositorySync.js（pullAll() 新增 Promise.all + CustomEvent dispatch）
- js/pages/App{Home,Materials,Quiz,WrongBook,Summary,Learning,Tutor,Dashboard,Review}.js（各新增 1 個事件監聽，重跑既有 guardedInit()）
- js/pages/AppLogin.js（state.loginPromise 追蹤 + 「進入平台」等待該 Promise 才導航）
- scripts/verify/VerifyPaths.js（新增 1 筆、有記錄的 OPTIONAL_GITIGNORED 允許清單）
- tests/jsdom/BehaviorSuite.js + 14 個 tests/regression/*.js（script-loader 加 fs.existsSync guard）
- playwright/tests/*.spec.js（9 個檔案，collectErrors() 依失敗資源 URL 過濾唯一一筆預期中的 404）
- docs/EO/AI_Supabase_Persistence_Root_Cause_Fix_Report.md（本檔案）

Root Cause Status：
RESOLVED（三個已確認 Root Cause 的程式修正皆完成，Regression 全綠；「Persistence 正式 PASS」的最終判定依規定保留給 Project Owner 實測後確認，非本輪可自行宣告）
```

依明文指示：本輪完成後立即停止，不開始 P01～P11。等待 Project Owner 完成 Section 7 Test A-D 實測，並給出「開始修正」（若仍有殘留問題）或正式 PAT（若 Persistence 全部 PASS）。
