# Sprint AI-126A-3｜Supabase 正式部署（Production）Report

**Date**: 2026-08-07
**Status**: DEPLOYED — 真實部署至真實 Supabase Project，透過 GitHub Actions `Supabase Deploy` workflow，`workflow_dispatch` 手動觸發，非本機模擬。

## GitHub Actions

- Workflow: `Supabase Deploy` (`.github/workflows/supabase-deploy.yml`)
- Run: [31150931374](https://github.com/stanleyshen7916-creator/AI-HighSchool-Learning-System/actions/runs/31150931374)（`main`，commit `81388b9`，`run_workflow` 觸發，非 push/PR 自動觸發）
- Job: `Link project and push migrations` — **success**（全部 12 個 step 皆 success）

## Migration Status — PASS

`supabase db push` 依序真實套用全部 5 個 migration，零錯誤：

```
Applying migration 20260807000001_extensions_and_helpers.sql...
Applying migration 20260807000002_reference_tables.sql...
Applying migration 20260807000003_content_tables.sql...
Applying migration 20260807000004_learning_tables.sql...
Applying migration 20260807000005_rls_policies.sql...
Finished supabase db push.
```

`supabase migration list` 確認 Local／Remote 五筆時間戳記完全一致（非僅本機宣稱，是查詢真實遠端 Migration History 表得出）：

| Local | Remote |
|---|---|
| 20260807000001 | 20260807000001 |
| 20260807000002 | 20260807000002 |
| 20260807000003 | 20260807000003 |
| 20260807000004 | 20260807000004 |
| 20260807000005 | 20260807000005 |

## Table Count — PASS：15 / 15

真實查詢 `pg_tables`（透過 `supabase db query --linked`，Management API，非本機模擬）：

```
table_count = 15
```

`activity_logs`／`exam_answers`／`exam_sessions`／`folders`／`knowledge_mastery`／`learning_progress`／`materials`／`question_sets`／`questions`／`statistics`／`student_profiles`／`subjects`／`user_settings`／`users`／`wrong_book` — 與 `schema/schema-overview.md` 設計的 15 張表逐一相符。

## RLS Status — PASS

全部 15 張表 `rowsecurity = true`（無一張表遺漏）；`pg_policies` 真實查詢得 **34 筆 Policy**，與 `supabase/migrations/20260807000005_rls_policies.sql` 內 `create policy` 陳述式數量（`grep -c` 驗證為 34）完全一致——代表遠端資料庫的 Policy 與原始碼定義完全同步，非部分套用。

## Seed Status — PASS：9 / 9

`supabase db query --linked --file supabase/seed/0001_subjects.sql` 真實套用；查詢 `public.subjects` 得完整 9 筆真實資料：

| code | name |
|---|---|
| biology | 生物 |
| chemistry | 化學 |
| chinese | 國文 |
| civics | 公民 |
| english | 英文 |
| geography | 地理 |
| history | 歷史 |
| math | 數學 |
| physics | 物理 |

## Overall — PASS

Migration／Table／RLS／Seed 全部真實驗證通過，皆透過 GitHub Actions 真實執行結果（Job Log）取得，非本機模擬、非宣稱。

## 過程中的判斷（誠實揭露）

- `supabase link` 需要 `supabase/config.toml` 才能執行（缺少會直接報錯 `Missing config`），原本的 Deployment Preparation workflow 未含此檔案——本輪部署前補上，`major_version = 17` 取自當下真實 CLI（2.111.0）`supabase init` 的預設值（Supabase 新專案目前的預設版本），非憑空猜測；本次真實部署 `supabase link` 直接成功，證實此值與真實專案相符。
- Table／RLS／Seed 驗證改用 `supabase db query --linked`（走 Supabase Management API），而非手動拼接 `psql` 連線字串——因為直接連線 `db.<ref>.supabase.co` 需要 IPv6，是 Supabase 官方討論串記載的真實 GitHub Actions 連線失敗成因；`--linked` 模式繞過此風險，本次部署證實可行。
- 為了讓 `workflow_dispatch` 可被觸發，`.github/workflows/supabase-deploy.yml` 必須先存在於預設分支 `main`（GitHub 僅列出 default branch 上已存在的 workflow 為可手動觸發）——因此在觸發部署前，先將原本待命中的 PR #63（AI-126A Migration/Schema/RLS + Deployment Preparation，CI 已綠燈）合併至 `main`，並依既有規範將 `claude/code-usage-explanation-zyx8n3` 分支重啟自最新 `main`。

## Scope 邊界（本輪未觸碰）

- 未建立 `js/repository/`（AI-126B 範圍）
- 未修改任何既有 Runtime／頁面／UI
- 未開始 AI-126B

依 Project Owner 指示，本輪完成後停止，等待 PAT。
