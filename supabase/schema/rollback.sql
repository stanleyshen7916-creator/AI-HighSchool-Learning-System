-- rollback.sql — AI-126A full teardown.
--
-- Deliberately NOT placed under supabase/migrations/ and NOT
-- timestamp-prefixed: `supabase db push`/`supabase migration up` only
-- apply files under migrations/, in filename order, forward-only — if
-- this lived there it would be picked up and (mis)applied as just
-- another forward migration. This file is a manually-run, explicit
-- teardown only: `psql "$SUPABASE_DB_URL" -f supabase/schema/rollback.sql`
-- (or `supabase db execute -f ...`), never part of an automatic push.
--
-- Drops in strict reverse dependency order (mirrors the FK dependency
-- order documented in supabase/schema/schema-overview.md exactly
-- backwards), so `cascade` is never required to paper over an
-- ordering mistake — every drop below is already safe as a plain
-- `drop ... if exists` on its own.
--
-- After running this, the entire AI-126A schema can be rebuilt from
-- zero by re-running supabase/migrations/*.sql in filename order —
-- this is the "Schema 可完整重建" requirement (Scope §8) demonstrated
-- as a real, runnable procedure, not just an assertion.

begin;

-- Triggers on auth.users / public.users first — these reference
-- functions we'll drop below, and must go before public.users itself.
-- (RLS policies are NOT dropped explicitly: they live ON each table
-- and are removed automatically the moment that table is dropped —
-- attempting to drop is_admin()/the policies before their owning
-- tables fails with "other objects depend on it", verified by this
-- script's own test run.)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists guard_is_admin on public.users;
drop function if exists public.handle_new_user();
drop function if exists public.prevent_self_admin_escalation();

-- Tables, reverse of the FK-dependency creation order in
-- 20260807000002 → 20260807000004. Dropping each table implicitly
-- drops every RLS policy defined on it — no separate `drop policy`
-- statements needed.
drop table if exists public.activity_logs;
drop table if exists public.user_settings;
drop table if exists public.statistics;
drop table if exists public.knowledge_mastery;
drop table if exists public.wrong_book;
drop table if exists public.exam_answers;
drop table if exists public.exam_sessions;
drop table if exists public.learning_progress;
drop table if exists public.questions;
drop table if exists public.question_sets;
drop table if exists public.materials;
drop table if exists public.folders;
drop table if exists public.student_profiles;
drop table if exists public.subjects;
drop table if exists public.users;

-- Remaining helper functions last, now that every table (and every
-- policy/trigger attached to it) is already gone: is_admin() was used
-- by RLS policies on subjects/folders/materials/question_sets/
-- questions; set_updated_at() was used by every table's own
-- updated_at trigger.
drop function if exists public.is_admin(uuid);
drop function if exists public.set_updated_at();

commit;
