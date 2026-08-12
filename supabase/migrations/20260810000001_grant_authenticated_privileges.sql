-- 20260810000001_grant_authenticated_privileges.sql
-- AI-127 Follow-up · Root Cause Fix — Missing table-level GRANTs.
--
-- Real, confirmed root cause (Postgres error 42501, captured directly from
-- a live PostgREST response body — not a guess):
--
--   {
--     "code": "42501",
--     "hint": "Grant the required privileges to the current role with:
--              GRANT SELECT ON public.materials TO authenticated;",
--     "message": "permission denied for table materials"
--   }
--
-- Row Level Security (20260807000005_rls_policies.sql — enable row level
-- security + every create policy) and table-level GRANTs are two distinct,
-- independent Postgres privilege layers. RLS policies decide which ROWS a
-- role may see/touch; a GRANT decides whether that role may attempt to
-- touch the TABLE at all in the first place. Without a GRANT, Postgres
-- denies the request before RLS is ever evaluated — this held for every
-- one of the 15 tables, on every operation, for every real user, which is
-- exactly the "0 use results ever persisted" symptom across the whole
-- AI Supabase Persistence investigation. It was never a Runtime/Repository/
-- Configuration/Session/Identity bug (all of those were verified correct,
-- independently, across the earlier Phase 1-4 diagnostics) — the database
-- itself never granted `authenticated` permission to touch any table.
--
-- supabase/README.md's own AI-126A verification note explains why this was
-- never caught earlier: the local Postgres 16 harness those 5 migrations
-- were verified against used "a minimal local stand-in for the pieces a
-- real Supabase project provides natively... the anon/authenticated role
-- grants Supabase configures by default" — i.e. that harness pre-seeded
-- the grants itself as a stand-in assumption. A real Supabase project only
-- auto-grants `anon`/`authenticated` on tables created through the Studio
-- table editor; tables created via `supabase db push`-applied SQL
-- migrations (exactly how 20260807000002-000004 were deployed, per
-- supabase/DEPLOYMENT_SETUP.md) do not receive that automatic grant and
-- need it added explicitly — a genuine, documented Supabase behavior this
-- Sprint's migrations did not yet account for, not a mistake in the RLS
-- policy design itself (which is otherwise correct and unmodified here).
--
-- This file GRANTs only the operation types each table already has a real
-- policy for in 20260807000005_rls_policies.sql — never broader. RLS still
-- does all of the actual row-level filtering after a GRANT lets a request
-- reach that stage; this file changes zero policies, zero table
-- definitions, zero columns, and is purely additive.

grant usage on schema public to authenticated;

-- ---- identity (own row only; no delete policy exists for either) --------
grant select, update on public.users to authenticated;
grant select, insert, update on public.student_profiles to authenticated;

-- ---- shared Repository catalog: SELECT for everyone, writes RLS-gated to
--      admin only (subjects_admin_write_*/folders_admin_write_*/etc. in
--      20260807000005_rls_policies.sql already restrict non-admin writes
--      at the row level — granting insert/update/delete at the table level
--      is required for an admin's own writes to ever reach that RLS check
--      at all; a non-admin's attempt still fails the RLS policy exactly as
--      designed, this GRANT does not change that). -------------------------
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.materials to authenticated;
grant select, insert, update, delete on public.question_sets to authenticated;
grant select, insert, update, delete on public.questions to authenticated;

-- ---- private per-student data: full CRUD, RLS restricts to the owner ----
grant select, insert, update, delete on public.learning_progress to authenticated;
grant select, insert, update, delete on public.exam_sessions to authenticated;
grant select, insert, update, delete on public.exam_answers to authenticated;
grant select, insert, update, delete on public.wrong_book to authenticated;
grant select, insert, update, delete on public.knowledge_mastery to authenticated;
grant select, insert, update, delete on public.statistics to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

-- ---- activity_logs: append-only (no update/delete policy exists) --------
grant select, insert on public.activity_logs to authenticated;
