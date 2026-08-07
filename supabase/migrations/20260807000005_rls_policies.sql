-- 20260807000005_rls_policies.sql
-- AI-126A · Row Level Security — every table, no Public Full Access.
--
-- Two access shapes cover all 15 tables:
--
--   (a) Shared Repository catalog (subjects/materials/folders/
--       question_sets/questions): any authenticated user may SELECT
--       (教材中心 is a shared read view for every student), but only
--       an is_admin user may INSERT/UPDATE/DELETE — per §7 "學生不得
--       新增教材...改為 Admin Only".
--
--   (b) Private per-student data (learning_progress/exam_sessions/
--       exam_answers/wrong_book/knowledge_mastery/statistics/
--       user_settings/activity_logs): full CRUD restricted to
--       `auth.uid() = user_id` — the exact denormalized column every
--       one of those tables' own migration (20260807000004) added for
--       this. No admin override is added here (not required by any
--       Acceptance item, and adding one would be scope this file was
--       not asked to add).
--
-- users/student_profiles are their own third shape (identity itself),
-- handled individually below with two extra safeguards a bare "owner
-- can do anything" policy would miss: (1) a new auth user must get a
-- public.users row automatically (RLS alone can't create the row that
-- makes every later policy on this account possible), and (2) a
-- student must never be able to grant themselves is_admin through an
-- ordinary UPDATE on their own row.

alter table public.users enable row level security;
alter table public.subjects enable row level security;
alter table public.student_profiles enable row level security;
alter table public.folders enable row level security;
alter table public.materials enable row level security;
alter table public.question_sets enable row level security;
alter table public.questions enable row level security;
alter table public.learning_progress enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.exam_answers enable row level security;
alter table public.wrong_book enable row level security;
alter table public.knowledge_mastery enable row level security;
alter table public.statistics enable row level security;
alter table public.user_settings enable row level security;
alter table public.activity_logs enable row level security;

-- is_admin(uid) — the one check every "Admin Only" write policy below
-- shares, defined once so §7's rule can never drift between tables.
create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select u.is_admin from public.users u where u.id = check_user_id and u.deleted_at is null),
    false
  );
$$;

comment on function public.is_admin(uuid) is
  'AI-126A: single source every "Admin Only" RLS policy in this file calls, per Repository Principle §7.';

-- handle_new_user() — auto-creates the matching public.users row the
-- moment Supabase Auth creates an auth.users row (works identically
-- whichever real Auth method AI-126C ultimately wires up — email/
-- password, magic link, or Anonymous Sign-in — since all three create
-- a real auth.users row). Without this, a freshly authenticated
-- request would have no public.users row yet and every policy below
-- would correctly, but unhelpfully, deny it everything.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is
  'AI-126A: mirrors every new auth.users row into public.users so RLS policies below always have a row to check.';

-- prevent_self_admin_escalation() — is_admin can only ever be changed
-- by a service_role request (i.e. a trusted server-side/Repository
-- action, never an ordinary authenticated student session), even
-- though the UPDATE policy on public.users below otherwise lets a user
-- update their own row. Postgres RLS itself has no native per-column
-- restriction, so this is enforced with a trigger instead.
create or replace function public.prevent_self_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.role() <> 'service_role' then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_is_admin on public.users;
create trigger guard_is_admin
  before update on public.users
  for each row execute function public.prevent_self_admin_escalation();

comment on function public.prevent_self_admin_escalation() is
  'AI-126A: a student updating their own public.users row (e.g. future profile fields) can never flip is_admin themselves — only a service_role (trusted server-side) write can.';

-- ---- users --------------------------------------------------------------
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy: rows are created exclusively by handle_new_user()
-- (security definer, runs as the trigger owner, not subject to RLS).
-- No delete policy: account deletion is a Repository/service_role
-- concern, not an ordinary session action.

-- ---- student_profiles -----------------------------------------------------
create policy "student_profiles_select_own"
  on public.student_profiles for select
  using (auth.uid() = user_id);

create policy "student_profiles_insert_own"
  on public.student_profiles for insert
  with check (auth.uid() = user_id);

create policy "student_profiles_update_own"
  on public.student_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- shared Repository catalog: subjects/materials/folders/question_sets/questions
create policy "subjects_select_authenticated"
  on public.subjects for select
  using (auth.role() = 'authenticated');

create policy "subjects_admin_write_insert"
  on public.subjects for insert
  with check (public.is_admin(auth.uid()));

create policy "subjects_admin_write_update"
  on public.subjects for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "subjects_admin_write_delete"
  on public.subjects for delete
  using (public.is_admin(auth.uid()));

create policy "folders_select_authenticated"
  on public.folders for select
  using (auth.role() = 'authenticated');

create policy "folders_admin_write_insert"
  on public.folders for insert
  with check (public.is_admin(auth.uid()));

create policy "folders_admin_write_update"
  on public.folders for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "folders_admin_write_delete"
  on public.folders for delete
  using (public.is_admin(auth.uid()));

create policy "materials_select_authenticated"
  on public.materials for select
  using (auth.role() = 'authenticated');

create policy "materials_admin_write_insert"
  on public.materials for insert
  with check (public.is_admin(auth.uid()));

create policy "materials_admin_write_update"
  on public.materials for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "materials_admin_write_delete"
  on public.materials for delete
  using (public.is_admin(auth.uid()));

create policy "question_sets_select_authenticated"
  on public.question_sets for select
  using (auth.role() = 'authenticated');

create policy "question_sets_admin_write_insert"
  on public.question_sets for insert
  with check (public.is_admin(auth.uid()));

create policy "question_sets_admin_write_update"
  on public.question_sets for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "question_sets_admin_write_delete"
  on public.question_sets for delete
  using (public.is_admin(auth.uid()));

create policy "questions_select_authenticated"
  on public.questions for select
  using (auth.role() = 'authenticated');

create policy "questions_admin_write_insert"
  on public.questions for insert
  with check (public.is_admin(auth.uid()));

create policy "questions_admin_write_update"
  on public.questions for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "questions_admin_write_delete"
  on public.questions for delete
  using (public.is_admin(auth.uid()));

-- ---- private per-student data: full CRUD, owner only ---------------------
create policy "learning_progress_owner_all"
  on public.learning_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "exam_sessions_owner_all"
  on public.exam_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "exam_answers_owner_all"
  on public.exam_answers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "wrong_book_owner_all"
  on public.wrong_book for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "knowledge_mastery_owner_all"
  on public.knowledge_mastery for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "statistics_owner_all"
  on public.statistics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_settings_owner_all"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- activity_logs: append-only, owner-scoped read/insert -----------------
create policy "activity_logs_select_own"
  on public.activity_logs for select
  using (auth.uid() = actor_user_id or auth.uid() = (
    select sp.user_id from public.student_profiles sp where sp.id = activity_logs.student_profile_id
  ));

create policy "activity_logs_insert_own"
  on public.activity_logs for insert
  with check (auth.uid() = actor_user_id or auth.uid() = (
    select sp.user_id from public.student_profiles sp where sp.id = activity_logs.student_profile_id
  ));

-- No update/delete policy: append-only by design (see 20260807000004's
-- own comment on this table).
