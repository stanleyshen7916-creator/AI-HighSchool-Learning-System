# AI Platform｜Supabase Persistence — Phase 3 Fix Report（SupabaseClient.js 載入鏈與載入順序）

**Date**: 2026-08-08
**Status**: 修正完成，Regression 全綠。等待 Project Owner 依下方步驟完成本機 Persistence 實測。

---

## 任務範圍

依 Project Owner 指示：「確認 `index.html` 以及實際使用 Runtime 的所有頁面，補齊既有 `SupabaseClient.js` 的正確載入鏈與載入順序；同時保留既有 `SupabaseConfig.local.js` 機制，不修改 Repository／Runtime Public API、UI、Schema、Migration、RLS。」

未新增任何檔案、未修改任何 `.js` 檔案本身的邏輯——本輪唯一變更是 3 個 HTML 檔案的 `<script>` 標籤**順序**。

---

## 逐頁全面稽核

對 `index.html`／`materials.html`／`quiz.html`／`wrongbook.html`／`summary.html`／`learning.html`／`tutor.html`／`dashboard.html`／`review.html` 共 9 個實際使用 Runtime 的頁面（`login.html` 不載入 `RepositorySync.js`，架構本就如此，不在此範圍內），逐一列出全部 `<script src>` 順序，檢查兩類真正會影響功能的依賴：

1. **`js/core/PersistenceAdapter.js` 必須先於 `js/core/SupabaseClient.js`／`js/repository/SyncBridge.js`／任何 Runtime 檔案載入**（`SupabaseClient.js` 的 `session()`/`setSession()`、`SyncBridge.js` 的 `identity()`/`cacheIdentity()`、以及每個 Runtime 檔案模組載入當下就會執行的 `hydrate()` 呼叫，都直接讀寫 `AHS.PersistenceAdapter`）。
2. **`js/repository/RepositorySync.js` 必須晚於它 `domains()` 清單引用的每一個 Runtime**（`TeachingMaterialLoader`／`MaterialRuntime`／`WrongBookRuntime`／`KnowledgeMasteryRuntime`／`SettingsRuntime`，若該頁面有載入的話）——因為 `RepositorySync.js` 的 IIFE 會在自己的 `<script>` 標籤執行的當下就同步呼叫 `pullAll()`，若某個 Runtime 還沒載入，`domains()` 篩選時會直接把它濾掉，等於**該次頁面載入完全跳過那個領域的自動 Pull**。

### 發現：3 個頁面違反第 2 項依賴，真實、可重現，先前未被發現

| 頁面 | `TeachingMaterialLoader.js` 位置 | `RepositorySync.js` 位置 | 結果 |
|---|---|---|---|
| `materials.html` | 第 54 個 script | 第 45 個 script | **違反**：TeachingMaterialLoader 晚於 RepositorySync |
| `quiz.html` | 第 46 個 script | 第 42 個 script | **違反**：同上 |
| `tutor.html` | 第 38 個 script | 第 33 個 script | **違反**：同上 |
| `index.html` | 第 46 個 script | 第 53 個 script | 正確 |
| `summary.html` | 第 29 個 script | 第 34 個 script | 正確 |
| `learning.html` | 第 29 個 script | 第 33 個 script | 正確 |
| `wrongbook.html`／`dashboard.html`／`review.html` | 未載入 TeachingMaterialLoader.js | — | 不適用（該頁面本來就不需要教材庫；`domains()` 的 defensive check 對此安全） |

**成因**：`js/repository/RepositorySync.js` 的 `domains()` 清單在 Sprint AI-126E 才新增 `TeachingMaterialLoader` 這個領域（該檔案自己的 header 已記錄「genuinely missing from this list until now」），但當時**沒有連帶檢查每個頁面自己的 `<script>` 順序**是否也把 `TeachingMaterialLoader.js` 放在 `RepositorySync.js` 之前——這 3 個頁面原本就把 `TeachingMaterialLoader.js` 放在 `RepositorySync.js` **之後**（緊跟在 `QuestionBankRuntime.js` 後面），從 AI-126E 合併的那一刻起，這 3 個頁面的教材庫（Material Repository）內容就從未被自動 Pull 過——這是一個真實、獨立、先前未被發現的缺口。

### 判定：不會直接造成本次回報的「WrongBook/Settings/Learning Progress 完全沒有紀錄」，但屬於同一類別、必須一併修正

`SyncBridge`／`WrongBookRuntime`／`SettingsRuntime`／`KnowledgeMasteryRuntime` 的載入順序在全部 9 個頁面皆已正確（Repository Layer 一律早於使用它的 Runtime，`PersistenceAdapter.js` 一律最早載入）——這部分本輪逐頁確認**沒有**發現新問題，與 Phase 2 的真實程式執行結論一致。此次發現的 `TeachingMaterialLoader.js`／`RepositorySync.js` 順序問題影響範圍是「教材庫內容能否在頁面載入時自動同步」，不是 Project Owner 目前回報的核心症狀，但既然任務明確要求「補齊正確載入鏈與載入順序」，本輪一併修正。

---

## Fix

`materials.html`／`quiz.html`／`tutor.html`：把 `<script src="js/runtime/TeachingMaterialLoader.js"></script>` 移到 `<script src="js/repository/RepositorySync.js"></script>` **之前**（緊接在 `QuestionBankRuntime.js` 之後，`RepositorySync.js` 之前），並更新旁邊既有的說明註解一併提到 `TeachingMaterialLoader`。純粹的 `<script>` 標籤順序調整，未新增、刪除任何檔案，未修改任何 `.js` 檔案的程式邏輯。

修正後以程式驗證全部 9 個頁面：`RepositorySync.js` 引用的 5 個領域（`TeachingMaterialLoader`／`MaterialRuntime`／`WrongBookRuntime`／`KnowledgeMasteryRuntime`／`SettingsRuntime`），只要該頁面有載入，皆已確認在 `RepositorySync.js` 之前——`ALL PAGES CORRECT`。

`SupabaseConfig.local.js` 機制本身（PR #79 建立、PR #80 確認架構限制）本輪完全未變更——所有 10 個頁面依然是 `SupabaseConfig.js` → `SupabaseConfig.local.js` → `RuntimeModeConfig.js` → `SupabaseClient.js` → `Repository.js` → `SupabaseRepository.js` → `RepositoryFactory.js` → `SyncBridge.js` → `AuthRepository.js` 這個既有順序，未動一行。

**不涉及**：Repository Interface、Runtime Public API、UI、CSS、Schema、Migration、RLS——全部依指示未修改。

---

## Regression

```
npm run verify：PASS（0 broken path，AUTHORIZED-EXCEPTION 範圍未變）
npm test：PASS（14 個結構性測試檔案全綠，0 FAIL，本輪未修改任何 .js 檔案，數字與先前完全一致）
Playwright：PASS（60/60，真實瀏覽器，涵蓋全部 10 個頁面）
```

---

## 本機 Persistence 實測步驟（依您先前的選擇：先本機驗證）

**1. 在專案根目錄建立 `js/data/SupabaseConfig.local.js`**（此檔案已在 `.gitignore`，不會被 commit，不受本輪變更影響）：

```js
window.AHS = window.AHS || {};
AHS.SupabaseConfigLocal = {
  url: "https://teddsuhnmsknkcmxpyla.supabase.co",
  anonKey: "<您的真實 Publishable Key>"
};
```

**2. 用瀏覽器直接開啟本機的 `login.html`**（`file://` 路徑或任何本機靜態伺服器皆可——**不要用 GitHub Pages 公開網址**，PR #79/#80 已確認該網址目前無法取得真實憑證）。

**3. 在 Console 確認**：
```js
AHS.SupabaseClient.isConfigured()
```
應回傳 `true`。若仍是 `false`，請截圖 Console 給我（不需要提供任何金鑰內容）。

**4. 依序執行**：
- ① 登入 Student A
- ② 教材中心 → 任一教材 → 考前練習 → 完成至少 3 題，其中至少答錯 1 題
- ③ 設定頁 → 切換「顯示 AI Tutor 建議」開關一次
- ④ 登出
- ⑤ **完全關閉瀏覽器整個程式**（不是分頁）
- ⑥ 重新開啟瀏覽器
- ⑦ 登入同一個 Student A
- ⑧ 確認：知識弱點頁面顯示剛剛答錯的題目／設定頁面開關維持切換後狀態／首頁 KPI 反映剛剛的練習
- ⑨（可選）用第二裝置或第二個瀏覽器 Profile，登入同一個 Student A，確認五項資料（Learning Progress／WrongBook／Knowledge Mastery／Statistics／Settings）與 Device A 一致

**5. 若 DevTools Network（篩選 `rest/v1`）在步驟②③看到 `POST`/`PATCH` 請求，也請一併記錄 Status Code**（不需要 Token/Key）——這能直接確認寫入鏈是否成功，不必等到步驟⑦才能判斷。

**若步驟 8 全部 PASS**：請回報，我會將此記錄為 AI-126 Baseline 正式 PASS，並依您先前的決定，準備開一個新 Sprint、明確授權設計 GitHub Pages 部署時的憑證注入機制。

**若步驟 3 仍為 `false`，或步驟 8 仍有任何一項沒有恢復**：請提供該項目的實際狀況（Console 訊息／DevTools Network 截圖皆可），我會繼續診斷。

---

# AI Supabase Persistence Phase 3 Fix Report

```text
Task：確認並補齊 index.html + 所有實際使用 Runtime 頁面的 SupabaseClient.js 載入鏈與載入順序

Audit：9 個頁面全數逐一稽核（PersistenceAdapter 順序 + RepositorySync.js 相對其引用的
       5 個 Runtime 領域的順序）

Found：materials.html／quiz.html／tutor.html 三個頁面的 TeachingMaterialLoader.js
       晚於 RepositorySync.js 載入——AI-126E 新增 TeachingMaterialLoader 進
       domains() 清單時，未連帶檢查這 3 個頁面自己的 script 順序，導致這 3 個頁面
       的教材庫內容從未被自動 Pull 過。真實、可程式驗證、先前未發現的缺口。

Fix：3 個頁面各移動 1 個 <script> 標籤到 RepositorySync.js 之前，未新增/刪除檔案，
     未修改任何 .js 邏輯。SupabaseConfig.local.js 機制完全保留不動。

Verification：程式化檢查全部 9 個頁面，RepositorySync.js 引用的全部領域（若該頁面
              有載入）皆確認在其之前 — ALL PAGES CORRECT。

Regression：
npm run verify：PASS
npm test：PASS
Playwright：PASS（60/60）

Repository/Runtime Public API/UI/CSS/Schema/Migration/RLS：未修改

Overall：
FIX APPLIED，等待 Project Owner 本機 Persistence 實測結果
```

依明文指示：本輪完成後提供本機實測步驟（見上），等待 Project Owner 實測結果與 PAT，不開始 P01～P11。
