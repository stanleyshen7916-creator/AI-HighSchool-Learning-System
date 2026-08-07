# Sprint AI-126C｜Repository Runtime Migration Report

**Date**: 2026-08-07
**Status**: 完成，等待 Project Owner PAT。

## Architecture（Project Owner Decision, LOCK）

```
UI → Runtime（同步 Memory Cache）→ Repository（背景 Push/Pull）→ Supabase
```

Runtime 對外的公開讀取方法（`list()`/`get()`/`homeKpis()`/...）**維持 100% 同步**，簽名、回傳型別、呼叫方式完全不變——每一個既有呼叫端（`js/components/`／`js/ui/`／`js/pages/` 至少 21 處直接同步呼叫，例如 `js/pages/AppWrongBook.js:103` 的 `var items = AHS.WrongBookRuntime.list();`）皆未修改一行。Repository 純粹是**背景同步機制**：Push（既有寫入路徑後 fire-and-forget）與 Pull（啟動時自動背景刷新 Memory Cache），從不阻塞 UI、從不要求呼叫端等待網路。

## 真實發現（先於實作處理）

AI-126B 已經建好每個領域自己的 `pushX()`／`pullFromRepository()`，但**「啟動 → Repository → Pull → 更新 Memory Cache」這一半的資料流從未真正被觸發過**：
1. `pullFromRepository()` 在真實瀏覽器中從未被任何頁面呼叫，只有測試工具手動呼叫過。
2. 更根本的是：**沒有任何一個 HTML 頁面 `<script>` 引入過 Repository Layer 的檔案**（`js/data/SupabaseConfig.js`／`js/core/SupabaseClient.js`／`js/repository/*.js`）。這代表 `js/pages/AppLogin.js` 早在 Part 1 就寫好的 `AHS.AuthRepository.loginForMockStudent()` 呼叫，在真實瀏覽器裡從 AI-126B Part 1 至今**一直靜默 no-op**，因為 `login.html` 從未載入過 `AuthRepository.js`。

這代表 AI-126C 真正要補的，不是重新設計任何 Runtime，而是把已經蓋好的 Repository Layer **真正接上真實頁面**。

## Task 1-5｜Learning Progress／WrongBook／Knowledge Mastery／Statistics／Settings

- 全部 5 個領域的 Read（透過啟動時自動 Pull 刷新 Memory Cache）／Create／Update 皆已由 AI-126B 完成 push/pull 機制本身；本輪新增的是**自動觸發**——新增 `js/repository/RepositorySync.js`（`AHS.RepositorySync.pullAll()`），在模組載入當下（即 `<script>` 執行的瞬間，等同「啟動」）自動呼叫 `MaterialRuntime`／`WrongBookRuntime`／`KnowledgeMasteryRuntime`／`SettingsRuntime` 四者各自既有的 `pullFromRepository()`，全部 fire-and-forget，未配置或無真實 session 時安全提前返回，不觸碰 Memory Cache。
- Statistics（Task 4）刻意未給自己的 Pull——`AHS.StatisticsRuntime` 依既有設計「純計算、無自己的 store」不變（其自身檔頭本就如此宣告），一旦上述 4 個領域的 Memory Cache 被背景刷新，Statistics 算出的學習時數／答題數／正確率自然就是「由 Repository 提供」的真實數字，不需要也不應該讓 Statistics 自己額外開一個 store。
- WrongBook（Task 2）的「移除」對應到既有、LOCK 的 `archive()`／`unarchive()`（AI-121-08：「不得真的刪除，History 永久保留」）——WrongBookRuntime 從未有過真正的硬刪除 API，這是既有、未變更的設計，不是本輪迴避；`archive()`/`unarchive()` 在 Part 2 已經 push-wired，本輪未變更。

## Task 6｜Repository Integration

- 逐一確認：沒有任何 Runtime 直接呼叫 `fetch(`／讀取 Local JSON／依賴 Mock Data 作為 Repository 通道——`npm run verify` 的 `VerifyForbiddenPatterns` 持續證明整個 repo 只有 `js/core/SupabaseClient.js` 一處被授權使用 `fetch(`（AUTHORIZED-EXCEPTION，Sprint AI-126B 範圍未擴大）。
- 補上這條鏈路真正被接上真實頁面的最後一哩：把 `js/data/SupabaseConfig.js`／`js/core/SupabaseClient.js`／`js/repository/Repository.js`／`SupabaseRepository.js`／`RepositoryFactory.js`／`SyncBridge.js`／`AuthRepository.js` 這 7 個檔案的 `<script>` 標籤，加入 `login.html` 與全部 9 個 Workspace 頁面（`index.html`／`materials.html`／`quiz.html`／`wrongbook.html`／`summary.html`／`learning.html`／`tutor.html`／`dashboard.html`／`review.html`），並在每個 Workspace 頁面最後一個相關 Runtime 腳本之後加入 `js/repository/RepositorySync.js`。`qiaoqiao-gallery.html` 是純靜態畫廊、本身沒有任何 Runtime 腳本，維持不變。

## Restrictions 遵守情形

- **Runtime Public API**：LOCK，零修改。`js/runtime/*.js` 本輪完全未被 Edit（除了新增測試覆蓋率的 `tests/regression/RuntimeSyncRegression.js`）。
- **UI**：`js/components/`／`js/ui/` 零修改。唯一觸碰的是 10 個 HTML 頁面的 `<script>` 標籤清單（純接線，無任何可視/互動變更）與新增的 1 個 `js/repository/` 檔案——與 AI-126B 全程「新增 `<script>` 標籤不算 UI 變更」的既有判斷一致。
- **Migration／Schema／RLS**：零修改。
- **Repository 不得重新設計**：`Repository.js`／`SupabaseRepository.js`／`RepositoryFactory.js`／`SyncBridge.js` 全部原封不動；`RepositorySync.js` 是全新、額外的編排檔案，不修改既有任何一個 Repository 檔案的介面或行為。

## Task 7｜Regression — PASS

- `npm run verify`：PASS（AUTHORIZED-EXCEPTION 範圍未擴大，0 broken path，因為新增的全部 `<script src=...>` 皆指向真實存在的檔案）。
- `npm test`：全綠 0 FAIL（`RuntimeSyncRegression.js` 新增第 [9] 段，4 項零網路呼叫結構測試證明 `AHS.RepositorySync.pullAll()` 存在、require 時自動執行一次也不拋錯、未配置時完全不觸碰任何 Runtime 的 Memory Cache，總計 33/33 PASS，coverage 未降低，只增不減）。
- Playwright：**60/60 PASS**——這是本輪最關鍵的真實驗證：10 個 HTML 頁面全部改動過 `<script>` 清單、新增了一個會在頁面載入當下自動執行的新檔案，仍然在真實瀏覽器裡零回歸，證明「Repository 不可用時 Runtime 必須維持 Memory Cache 正常運作」這條 Architecture Decision 的核心承諾是真的成立，不是宣稱。

## Acceptance

| 項目 | 結果 |
|---|---|
| Repository Migration Status | **PASS** — Learning Progress／WrongBook／Knowledge Mastery／Settings 皆已接上啟動時自動 Pull；Statistics 透過上述四者的真實 Memory Cache 間接受惠，維持既有「純計算」設計 |
| Runtime Status | **PASS** — Public API／回傳型別／呼叫方式全部 LOCK 不變 |
| Regression Status | **PASS** — verify／test（33/33 新增測試）／Playwright（60/60，真實瀏覽器）全綠 |
| Overall Status | **PASS** |

依 Project Owner 指示，本輪完成後停止，不得開始下一個 Sprint，等待 PAT。
