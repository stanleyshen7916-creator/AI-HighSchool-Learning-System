# supabase/ — AI-126A Supabase Foundation

**Status**: AI-126A (Migration / Schema / RLS) only. No `js/repository/` (AI-126B), no Runtime integration (AI-126C), no real Supabase project connection anywhere in this repo yet — per the PMO's own AI-126 Decision (2026-08-07), no `SUPABASE_URL`/`SUPABASE_ANON_KEY` will be provided until the Integration phase.

## What's here

```
supabase/
  migrations/   real, applicable Postgres migration files (Supabase CLI naming convention)
  schema/       schema documentation + rollback.sql (full teardown, not auto-applied)
  policies/     RLS design documentation
  seed/         lookup/reference data only (never user data)
```

## How this was verified without a real Supabase project

Every migration in `migrations/` was applied against a **real local Postgres 16 instance** (not just syntax-checked) using a minimal local stand-in for the pieces a real Supabase project provides natively (an `auth.users` table, `auth.uid()`/`auth.role()`, and the `anon`/`authenticated` role grants Supabase configures by default). Verified, not merely asserted:

- All 5 migrations apply cleanly, in order, with zero errors.
- `handle_new_user()` correctly mirrors a new `auth.users` row into `public.users`.
- RLS genuinely blocks cross-user access on a private table (`learning_progress`) — tested as two distinct non-superuser sessions, not just "the policy exists".
- The Admin Only split works both ways: a non-admin's `INSERT` into `subjects` is rejected; an admin's succeeds.
- `prevent_self_admin_escalation()` blocks an ordinary user from setting their own `is_admin = true`, and a genuine `service_role`-equivalent (a role with `BYPASSRLS`, matching how Supabase's real service key behaves) can.
- An anonymous session (no `uid` at all) sees 0 rows on every private table.
- `schema/rollback.sql` was run against a fully-populated schema, confirmed to drop every table/function/trigger to zero, then the 5 migrations were re-applied from scratch and reached the exact same 15-table state — the literal "Schema 可完整重建" requirement (Scope §8), demonstrated as a real, repeatable procedure.

None of this required real credentials — a real Supabase Postgres instance is standard Postgres 16 underneath, so this local verification is a faithful proxy for how these same files will behave once pointed at the real project.

## Applying to the real Supabase project (Integration phase — not yet)

Per the PMO's explicit instruction, no table is to be created via the Supabase Dashboard. Once `SUPABASE_URL`/credentials are provided:

```bash
supabase link --project-ref <project-ref>
supabase db push          # applies every file in migrations/, in filename order
```

**Deployment infrastructure (AI-126A Deployment Preparation)**: `.github/workflows/supabase-deploy.yml` runs the same two commands via the official Supabase CLI GitHub Action, reading credentials only from GitHub repository secrets — see `supabase/DEPLOYMENT_SETUP.md` for the exact secret names and Project Owner setup steps. The workflow is `workflow_dispatch`-only (manual trigger required) and has not been run — no migration has been deployed to any real Supabase project via this workflow yet.

To seed the fixed lookup data (`subjects`):

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/0001_subjects.sql
```

To fully tear down and rebuild (verification / disaster-recovery drill only — never run against a database with real user data without an explicit, separate decision to do so):

```bash
psql "$SUPABASE_DB_URL" -f supabase/schema/rollback.sql
supabase db push
```

## Scope boundary (AI-126A)

This directory does **not** contain, and this phase does **not** touch:
- `js/repository/` (Repository Layer — AI-126B)
- Any change to an existing Runtime, page, or UI (Runtime Integration — AI-126C)
- Any real Supabase connection, `fetch(`, or client library usage anywhere in `js/`
- Real cross-device/PAT verification (AI-126D)

See `docs/Architecture/Architecture_AI125_Learning_Persistence_v1.0.md` for the Persistence Level (L0–L3) baseline this schema implements L3 against, and `schema/schema-overview.md` for the table-by-table mapping from each existing Runtime to its new table.
