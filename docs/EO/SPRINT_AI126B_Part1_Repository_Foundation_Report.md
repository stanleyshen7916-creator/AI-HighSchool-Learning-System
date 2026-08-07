# Sprint AI-126B（Part 1/2）｜Repository Layer & Authentication Foundation Report

**Date**: 2026-08-07
**Status**: Repository Layer + Authentication 基礎建設完成，PASS（結構性驗證）／CONFIGURATION-PENDING（真實 CRUD 端對端驗證，需 Project Owner 提供瀏覽器端憑證）。

## 判斷與 PMO 授權（先於實作處理）

本 Sprint Task 2/3/4（真實 supabase-js 連線／真實 Email Login／真實 CRUD Smoke Test）與專案憲法 `CLAUDE.md`「no real backend/database/AI API」以及 `npm run verify` 的 `VerifyForbiddenPatterns.js`（硬性禁止 production JS 出現 `fetch(`/`XMLHttpRequest`）直接衝突。已透過 `AskUserQuestion` 呈現證據並取得 Project Owner 決策：

1. **修改 CLAUDE.md，明確新增例外**（採用）：比照既有 `window.location.href` 例外前例，新增 `AUTHORIZED_EXCEPTIONS`（`scripts/verify/VerifyForbiddenPatterns.js`），僅 `js/core/SupabaseClient.js`／`js/repository/SupabaseRepository.js` 兩檔允許 `fetch(`，其餘所有 Runtime／UI／頁面檔案仍完全禁止。`CLAUDE.md`／`docs/Architecture/Architecture_Repository_Structure_v2.1.md`（LOCK 文件）同步更新為 9 分類（新增 `js/repository/`）。
2. **前端憑證來源**：Project Owner 選擇「直接提供 SUPABASE_URL／SUPABASE_ANON_KEY」——但該輪對話僅記錄選項本身，尚未附上真實數值，故 `js/data/SupabaseConfig.js` 目前仍為空白（誠實留白，非猜測/捏造）。

## Task 1｜Repository Foundation — 完成

新增 `js/repository/`：
- `Repository.js` — 抽象介面（`connect`／`login`／`logout`／`getSession`／`read`／`insert`／`update`／`delete`），未覆寫呼叫皆丟出 `not implemented`。
- `SupabaseRepository.js` — 實作，全部方法委派給 `AHS.SupabaseClient`（唯一另一個 `fetch(` 授權例外）。
- `RepositoryFactory.js` — provider 切換（`create(providerName)`，目前僅 `supabase`，map 結構保留未來 `local` 一行新增即可）。

無任何 Runtime／UI／頁面檔案被修改；新檔案未被任何既有 HTML `<script>` 引用（刻意，避免影響既有功能）。

## Task 2｜Supabase Client — 完成（設計決策見下）

新增 `js/core/SupabaseClient.js`，讀取 `js/data/SupabaseConfig.js` 的 `url`／`anonKey`，未寫死任何真實值。

**與原始需求「初始化 supabase-js」的落差（誠實揭露）**：本專案「no bundler」是 CLAUDE.md 的既有硬性規則，`@supabase/supabase-js` 是需要打包或 CDN 載入的 npm 套件，兩者都與此規則衝突或需要額外的結構性決策。改為手寫最小、零依賴的 Auth／PostgREST fetch 封裝——呼叫與 `supabase-js` 內部完全相同的 HTTP API，維持專案「vanilla JS、零依賴」架構不變。

## Task 3｜Authentication — 完成（Repository 層，UI 未動）

`SupabaseClient.js` 提供 `signInWithPassword`／`signOut`／`getSession`／`signUp`（見下）；Session 透過既有、未修改的 `AHS.PersistenceAdapter.saveGlobal/loadGlobal/removeGlobal` 持久化（與既有 Mock Student Workspace 命名空間完全獨立）。`login.html`／`AppLogin.js` 未改一行。

## Task 4｜Repository Smoke Test

新增 `tests/supabase/RepositorySmoke.js`（`npm run test:supabase`，**不**納入 `npm test` 預設鏈，是唯一對真實外部服務發出真實網路請求的測試）：
- 流程：（自行 signUp 或 login 一個帶時間戳記的拋棄式帳號）→ Insert 自己的 `student_profiles` 列 → Read → Update → Delete，全部經真實 RLS（owner-writable，無需 Admin 權限）。
- **目前結果**：`AHS.SupabaseConfig` 為空，全部 6 項（Connect/Login/Read/Insert/Update/Delete）誠實回報 **SKIP**，未宣稱 PASS。

另新增 `tests/regression/RepositoryLayerRegression.js`（**已**納入 `npm test`，零網路呼叫）：26 項真實結構性測試全數 PASS——證明介面強制、prototype 繼承、Factory 切換、真實委派轉發（非寫死回傳值）、Config 誠實留白。

## Task 5｜Regression — PASS

- `npm run verify`：PASS（0 broken paths，`AUTHORIZED-EXCEPTION` 僅命中 `SupabaseClient.js` 一處，符合預期）
- `npm test`：330+6+29+37+35+45+36+12+11+6+8+28+44+**26**（新增 RepositoryLayerRegression）全綠，0 FAIL
- Playwright：60/60 PASS（與變更前完全相同，證實對既有功能零影響）

## Scope 邊界（本輪未觸碰）

未開始 Learning Progress／WrongBook／Statistics／Knowledge Mastery／Dashboard 整合；未修改任何既有 Runtime；未修改任何既有 UI／頁面；未進行任何跨裝置驗證；未開始 Part 2。

## 待 Project Owner 提供才能完成真實端對端 PASS

`js/data/SupabaseConfig.js` 的 `url`／`anonKey`（Supabase Dashboard → Project Settings → API，公開值，非 Secret）。提供後執行 `npm run test:supabase` 即可取得真實 Connect/Login/Read/Insert/Update/Delete PASS 結果（若專案的 Auth 設定啟用「Confirm email」，`signUp` 後不會立即取得 session，屆時需 Project Owner 決定停用該設定或提供已驗證的測試帳號）。
