-- 20260807000002_reference_tables.sql
-- AI-126A · users / subjects / student_profiles
--
-- `users` is a thin public extension row 1:1 with Supabase's own
-- built-in `auth.users` (never duplicated auth data — email/password/
-- session handling all stay exactly where Supabase Auth already owns
-- them; this table only adds the one platform-specific flag,
-- `is_admin`, that RLS policies in 20260807000005 need to distinguish
-- "教材中心 Admin Only" writes from ordinary student reads).
--
-- `student_profiles` is the real "User Mapping" layer the PMO Decision
-- requires: login.html's existing, unmodified UI (挑選 Admin／Student A／
-- Student B) maps each fixed picker key to exactly one persistent row
-- here via `mock_student_key` — the same key
-- js/data/WorkspaceData.js already uses (`student_a`/`student_b`/…).
-- Every later table hangs off `student_profiles.id` (business identity)
-- and denormalizes `user_id` (auth identity) directly for cheap RLS
-- checks — see 20260807000005's own header for why.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.users is
  'AI-126A: 1:1 extension of auth.users. Never stores email/password — Supabase Auth already owns those. is_admin gates 教材中心/Repository write access per the Repository Principle (LOCK).';

create trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- subjects — the fixed lookup table behind every 科目 chip/filter in the
-- app today (js/data/WorkspaceData.js / MockData subject lists: math,
-- biology, civics, geography, …). `code` is the same short key the
-- frontend already uses (e.g. "math"), so Repository Layer lookups stay
-- a simple indexed equality match, not a fuzzy name compare.
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.subjects is
  'AI-126A: fixed 科目 lookup (math/biology/civics/geography/…), code = same short key the existing frontend Mock/WorkspaceData already uses.';

create trigger set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

create index if not exists idx_subjects_code on public.subjects (code) where deleted_at is null;

-- student_profiles — the real "User Mapping" layer.
create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  mock_student_key text not null unique,
  display_name text not null default '同學',
  grade text not null default '高中生',
  role text not null default 'STUDENT' check (role in ('STUDENT', 'ADMIN')),
  school_code text,
  semester_codes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.student_profiles is
  'AI-126A: the real "User Mapping" the PMO Decision requires — mock_student_key is login.html''s existing, unmodified picker key (student_a/student_b/admin), mapped 1:1 to a real, persistent auth user_id. school_code/semester_codes mirror AHS.WorkspaceRuntime''s existing {schoolId, semesterIds} shape (js/runtime/WorkspaceRuntime.js) so the Repository Layer (AI-126B) can round-trip it without inventing a second Workspace concept.';

create trigger set_updated_at
  before update on public.student_profiles
  for each row execute function public.set_updated_at();

create index if not exists idx_student_profiles_user_id on public.student_profiles (user_id) where deleted_at is null;
create index if not exists idx_student_profiles_mock_key on public.student_profiles (mock_student_key) where deleted_at is null;
