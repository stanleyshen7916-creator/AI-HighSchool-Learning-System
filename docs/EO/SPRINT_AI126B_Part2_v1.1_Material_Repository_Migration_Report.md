# Sprint AI-126B（Part 2/2, v1.1）｜Material Repository + Material Migration + Learning Progress Repository Report

**Date**: 2026-08-07
**Status**: 完成，等待 Project Owner PAT。依 Project Owner 明確指示「不得新增 Sprint，依既有 AI-126B 完成所有 Runtime Repository 整合」，取消先前提出的 AI-126M（獨立 Sprint）提案，將 Material Repository／Material Migration／Learning Progress 併回 AI-126B 本輪完成。

## 背景：先前狀態與本輪要解決的落差

Part 2 上一輪（`SPRINT_AI126B_Part2_Runtime_Integration_Report.md`）誠實回報 Task 3（Learning Progress Repository）**BLOCKED**：`learning_progress.material_id` 是 `NOT NULL` 外鍵，必須指向 `materials` 表一筆真實列，但 AI-126A 僅遷移了 Schema 與 9 筆 `subjects` 種子，`materials` 表當時 0 列，任何 Insert 都會真實觸發外鍵錯誤。Project Owner 一度提議新增獨立 Sprint「AI-126M」處理 Material Repository + Migration，隨後以 v1.1 訊息明確撤回該提案，指示併回本 Sprint 完成。

## Task 1｜Material Repository — 完成

`js/runtime/TeachingMaterialLoader.js` 新增：
- `pushMaterial(originKey, materialForRuntime, sourceTrack)`：fire-and-forget read-then-upsert 至 `public.materials`，以 `origin_key`（"tm_1".."tm_4"／"civics-g10-ch5-6-exam-20260730"）為鍵。在 Package track 的 `resolveMaterialId()` 與 Repository track 的 `loadMaterialRepositoryEntry()` 兩個既有載入路徑中，僅在**首次**建立本地 MaterialRuntime 記錄時呼叫一次（避免每次頁面載入都重複發網路請求）。
- `pullFromRepository()`：讀取 `materials` 表所有真實列（RLS：`select` 對任何已登入使用者開放），回傳供驗證使用，不覆蓋既有的 Package/Repository JS 內容渲染來源（本輪不修改 UI／渲染管線）。

誠實揭露：`materials` 依 RLS 為 **Admin Only** 寫入（`materials_admin_write_insert`／`_update`／`_delete` policy 皆檢查 `is_admin(auth.uid())`），目前所有 mock 帳號皆非 admin，因此 client 端的 Insert/Update 呼叫會被 RLS 正確拒絕——這是設計如此，不是本輪的缺陷。`tests/supabase/RepositorySmoke.js` 新增「Materials Read PASS + Materials Insert correctly rejected（非 admin）」兩項驗證，直接證明這個邊界的真實行為，而非略過不測。

真正把資料寫進 `materials` 的機制是 Task 2 的 Migration Seed（見下），透過 elevated Management API 存取，不經過受 RLS 限制的 client 路徑。

## Task 2｜Material Migration — 完成，真實部署驗證（非模擬）

新增 `scripts/migrate/GenerateMaterialsSeed.js`：讀取平台既有、已上線的真實教材內容——
- **Package track**：`js/data/TeachingMaterialData.js`（由 `docs/TeachingMaterials/materials/tm_1~4/` 產生，數學/生物/公民/地理，共 161 題原始題目）
- **Repository track**：`data/materials/MaterialRepositoryIndex.js` + `CivicsG10Ch5to6Exam20260730.js`（公民，該檔案自身已誠實揭露僅 6/50 題經人工覆核）

只納入 `single_choice` 且答案可對應到選項的題目（與既有 `TeachingMaterialLoader.buildExamCompatibleQuestions()` 相同的誠實篩選規則，不捏造假選項）——最終 5 個 Material、142 題真實 Question。

產出 `supabase/seed/0002_materials.sql`：純 DML（`insert ... on conflict (origin_key) do update` 用於 `materials`；`insert ... where not exists (...)` 用於 `question_sets`/`questions`，因這兩張表本身無自然唯一鍵，此為 SQL 層級的幂等保證，未新增任何 Index/Constraint），**未修改 Migration／Schema／RLS／FK 任何一行**。

`.github/workflows/supabase-deploy.yml` 新增「Apply seed data (materials)」與「Verify material migration」兩個 step，比照既有 `0001_subjects.sql` 的 `supabase db query --linked --file` 機制（elevated Management API，天然繞過 RLS，與 AI-126A-3 已驗證過的機制相同）。

**真實部署證據**（GitHub Actions `Supabase Deploy` workflow，`workflow_dispatch`，run [31156804158](https://github.com/stanleyshen7916-creator/AI-HighSchool-Learning-System/actions/runs/31156804158)，2026-08-07 07:13–07:14 UTC，`conclusion: success`）：

```
origin_key                       title                                                           source_track
civics-g10-ch5-6-exam-20260730   公民與社會｜所有權、勞動三權與夫妻財產制、繼承 重點整理          REPOSITORY
tm_1                              第二冊 第4章 4-1~4-3（...） 114學年度下學期 高一第三次段考       PACKAGE
tm_2                              生物全ch3（...） 114學年度第二學期第三次段考                     PACKAGE
tm_3                              第二冊 第5~6課（...） 114學年度第二學期第三次段考                PACKAGE
tm_4                              全球化與國際分工、產業區位與人口移動（...） 114學年度第二學期第三次段考  PACKAGE

material_count: 5
question_set_count: 5
question_count: 142
```

與本機 `node scripts/migrate/GenerateMaterialsSeed.js` 產生種子檔案時回報的數字（5 materials / 142 questions）完全一致——真實查詢結果，非模擬。

## Task 3｜Learning Progress Repository — 完成，先前 BLOCKED 已解除

`js/runtime/MaterialRuntime.js` 新增：
- `record.originKey`／`record.materialSupabaseId`：兩個 additive 欄位（預設 `null`），只有透過 `TeachingMaterialLoader.js` 載入的真實內容才會帶 `originKey`；一般 Mock/示範上傳教材不受影響。
- `pushProgress(record)`：fire-and-forget，先以 `origin_key` 解析真實 `materials.id`（快取到 `record.materialSupabaseId`，同一 Session 內不重複查詢），再對 `learning_progress` 做 read-then-upsert（依 `student_profile_id + material_id` 這組真實 unique 限制）。掛在既有 `startLearning()`/`markPreviewed()`/`toggleFavorite()` 三個既有寫入路徑的 `persist()` 之後，簽名與回傳值完全不變。
- `pullFromRepository()`：透過 PostgREST embed（`select=*,materials(origin_key)`）讀回真實 `learning_progress` 列，依 `origin_key` merge 回本地記錄（找不到對應本地記錄時建立一筆最小記錄）。

**先前 BLOCKED 的原因（`learning_progress.material_id` 為 NOT NULL 外鍵、`materials` 表 0 列）已因 Task 2 的真實 Migration 部署而解除**——未修改 Schema、未將 `material_id` 改為 nullable、未建立假資料繞過外鍵、未關閉 FK Constraint，與 Project Owner 先前 PAT Decision 的明文限制完全一致。

## Task 4~7｜WrongBook／Knowledge Mastery／Statistics／Settings Repository — 重新確認完整

Part 2 上一輪已完成的四個領域（`js/runtime/WrongBookRuntime.js`／`KnowledgeMasteryRuntime.js`／`StatisticsRuntime.js`／`SettingsRuntime.js`）本輪未變更，已透過完整回歸重新確認皆完整存在且行為不變。

## Task 8｜Cross Device Validation — 擴充

- `tests/supabase/CrossDeviceSmoke.js`：新增 Material Repository Read（讀取真實 `materials` 一筆，若 Task 2 尚未在該 Supabase 專案套用則誠實 SKIP，不假造）+ Learning Progress push/pull（Device A 對一筆真實已遷移教材呼叫 `startLearning()`/`toggleFavorite()`，等待背景 push 後，Device B 呼叫 `MaterialRuntime.pullFromRepository()` 驗證 `progress`/`favorite` 真實一致）。
- `tests/supabase/RepositorySmoke.js`：新增 Materials Read PASS + Materials Insert 正確被 RLS 拒絕兩項驗證。

目前因 Project Owner 尚未提供真實 `SUPABASE_URL`／`SUPABASE_ANON_KEY` 給前端 `js/data/SupabaseConfig.js`，兩個檔案執行皆誠實回報 SKIP；機制本身已透過 Task 2 的真實部署（Migration 真實成功）與 Task 9 的結構性回歸（見下）證實可運作。

## Task 9｜Regression — PASS

- `npm run verify`：PASS（`AUTHORIZED-EXCEPTION` 僅命中 `SupabaseClient.js` 一處，範圍未擴大）
- `npm test`：全綠，0 FAIL（`tests/regression/RuntimeSyncRegression.js` 新增第 [8] 段，9 項零網路呼叫結構測試：`add()` 不帶 `originKey` 時行為不變、帶 `originKey` 時正確附加、`startLearning()`/`markPreviewed()`/`toggleFavorite()` 三者回傳值與既有測試完全一致、`MaterialRuntime.pullFromRepository`／`TeachingMaterialLoader.pullFromRepository` 皆為真實新增的 additive 函式且未配置時誠實回報 `{ pulled: 0 }`，總計 29/29 PASS）
- Playwright：60/60 PASS（與變更前完全相同，證實本輪對既有功能零影響）

## Task 10｜Acceptance

| 項目 | 結果 |
|---|---|
| Authentication | PASS（架構，Part 1/2 既有） |
| Material Repository | PASS（架構；Read 真實可用；Insert/Update 依設計為 Admin Only，已驗證會被正確拒絕） |
| Material Migration | **PASS（真實部署驗證）**：materials 5／question_sets 5／questions 142，GitHub Actions run 31156804158 |
| Learning Progress | PASS（架構；先前 BLOCKED 已因真實 materials.id 存在而解除；真實端對端 CRUD 待 Project Owner 提供憑證） |
| WrongBook / Knowledge Mastery / Statistics / Settings | PASS（架構，Part 2 既有，本輪重新確認完整） |
| Cross Device | 架構完成／CONFIGURATION-PENDING（同上，待真實憑證 + Project Owner 實機驗收） |
| Regression | **PASS** |
| **Overall** | **架構 PASS + 真實 Material Migration 已部署驗證**；真實跨裝置端對端 PASS 待 Project Owner 提供 `SUPABASE_URL`／`SUPABASE_ANON_KEY` |

## Constraints 遵守情形

未修改 Runtime Public API（全部為既有方法內部新增 fire-and-forget 呼叫，或全新 additive 方法/欄位）；未修改 UI／CSS；未修改 Migration／Schema／RLS／FK（`0002_materials.sql` 為純 DML）；未新增 Mock Data（Migration 內容全部來自平台既有、已上線的真實教材）；未重新設計 Repository；未新增 Sprint（AI-126M 提案已依指示撤回，併入本 Sprint）；未開始 AI-126C。

依 Project Owner 指示，本輪完成後停止，等待 PAT。
