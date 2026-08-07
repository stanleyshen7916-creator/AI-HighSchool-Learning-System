-- 20260807000004_learning_tables.sql
-- AI-126A · learning_progress / exam_sessions / exam_answers /
--           wrong_book / knowledge_mastery / statistics /
--           user_settings / activity_logs
--
-- Every table here is per-student, private data — the exact set §7
-- ("Final Acceptance") requires to survive re-login and stay consistent
-- across devices. Each one carries BOTH student_profile_id (the
-- business identity everything else in this schema joins on) AND a
-- denormalized user_id (the real auth identity) — a deliberate,
-- documented redundancy: RLS policies in 20260807000005 check
-- `auth.uid() = user_id` directly on each row, which Supabase's own RLS
-- guidance recommends over an EXISTS/JOIN subquery through
-- student_profiles on every single row of every single query. The two
-- columns are kept in lockstep by application-level writes (Repository
-- Layer, AI-126B) rather than a second trigger, since student_profiles
-- is never reassigned to a different user_id after creation.

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  last_opened_at timestamptz,
  last_learning_at timestamptz,
  learning_time integer not null default 0,
  learning_count integer not null default 0,
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (student_profile_id, material_id)
);

comment on table public.learning_progress is
  'AI-126A: real per-student per-material signals AHS.MaterialRuntime today keeps on each material record (progress/lastOpenedAt/lastLearningAt/learningTime/learningCount/favorite) — the durable source behind js/runtime/LearningStateRuntime.js''s Reading signal once Repository-backed.';

create trigger set_updated_at
  before update on public.learning_progress
  for each row execute function public.set_updated_at();

create index if not exists idx_learning_progress_user on public.learning_progress (user_id) where deleted_at is null;
create index if not exists idx_learning_progress_material on public.learning_progress (material_id) where deleted_at is null;

-- exam_sessions — AHS.ExamRuntime's draft/ready/running/finished state
-- machine (js/runtime/ExamRuntime.js) plus AHS.HistoryRuntime's
-- finished-summary fields (js/runtime/HistoryRuntime.js), merged: a
-- session row is created in 'draft' and the same row is updated through
-- to 'finished' rather than writing a second summary record, so there
-- is exactly one durable place "did this session happen, and how did it
-- go" lives.
create table if not exists public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  question_set_id uuid not null references public.question_sets (id) on delete cascade,
  mode text not null default 'PRACTICE' check (mode in ('EXAM', 'PRACTICE')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'running', 'finished')),
  score integer,
  accuracy numeric(5, 2),
  correct_count integer,
  total_count integer,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.exam_sessions is
  'AI-126A: AHS.ExamRuntime''s draft/ready/running/finished session state (js/runtime/ExamRuntime.js) merged with AHS.HistoryRuntime''s finished-summary fields (js/runtime/HistoryRuntime.js) — one durable row per real session, not two.';

create trigger set_updated_at
  before update on public.exam_sessions
  for each row execute function public.set_updated_at();

create index if not exists idx_exam_sessions_user on public.exam_sessions (user_id) where deleted_at is null;
create index if not exists idx_exam_sessions_question_set on public.exam_sessions (question_set_id) where deleted_at is null;
create index if not exists idx_exam_sessions_status on public.exam_sessions (status) where deleted_at is null;

-- exam_answers — AHS.AnswerRuntime's per-question answer record
-- (js/runtime/AnswerRuntime.js), now durable instead of that Runtime's
-- own documented in-memory-only design.
create table if not exists public.exam_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  exam_session_id uuid not null references public.exam_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer_key text,
  is_correct boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (exam_session_id, question_id)
);

comment on table public.exam_answers is
  'AI-126A: AHS.AnswerRuntime''s per-question saveAnswer() record (js/runtime/AnswerRuntime.js) — that Runtime is documented "In-memory only, keyed by examId"; this table is the durable Repository-backed replacement once AI-126C wires it in.';

create trigger set_updated_at
  before update on public.exam_answers
  for each row execute function public.set_updated_at();

create index if not exists idx_exam_answers_user on public.exam_answers (user_id) where deleted_at is null;
create index if not exists idx_exam_answers_session on public.exam_answers (exam_session_id) where deleted_at is null;

-- wrong_book — AHS.WrongBookRuntime's real item shape
-- (js/runtime/WrongBookRuntime.js) verbatim: every field this migration
-- defines already exists on that Runtime's own real records today
-- (errorCount/firstError/lastError/masteredAt/bookmarked/archived/
-- correctStreak — correctStreak is what js/runtime/WrongBookRuntime.js's
-- own weaknessState() already derives NEW/LEARNING/MASTERED/ARCHIVED
-- from, so that logic is preserved unchanged in the Repository Layer,
-- not re-invented here).
create table if not exists public.wrong_book (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  question_id uuid references public.questions (id) on delete set null,
  material_id uuid references public.materials (id) on delete set null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  knowledge_point text not null,
  question_text text not null default '',
  your_answer text,
  correct_answer text,
  explanation text not null default '',
  error_count integer not null default 1,
  correct_streak integer not null default 0,
  first_error_at timestamptz not null default now(),
  last_error_at timestamptz not null default now(),
  mastered_at timestamptz,
  bookmarked boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.wrong_book is
  'AI-126A: AHS.WrongBookRuntime''s real item shape verbatim (js/runtime/WrongBookRuntime.js) — correct_streak is what that Runtime''s own weaknessState() (NEW/LEARNING/MASTERED/ARCHIVED) already derives from; that derivation logic itself is untouched, only the storage tier changes.';

create trigger set_updated_at
  before update on public.wrong_book
  for each row execute function public.set_updated_at();

create index if not exists idx_wrong_book_user on public.wrong_book (user_id) where deleted_at is null;
create index if not exists idx_wrong_book_subject on public.wrong_book (subject_id) where deleted_at is null;
create index if not exists idx_wrong_book_knowledge_point on public.wrong_book (knowledge_point) where deleted_at is null;

-- knowledge_mastery — AHS.KnowledgeMasteryRuntime's per-knowledge-point
-- attempt log (js/runtime/KnowledgeMasteryRuntime.js): "the first Runtime
-- ... that tracks BOTH correct and wrong real answers per knowledge
-- point", per that file's own header — correct_count/wrong_count here
-- are exactly that pair.
create table if not exists public.knowledge_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  knowledge_point text not null,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (student_profile_id, knowledge_point)
);

comment on table public.knowledge_mastery is
  'AI-126A: AHS.KnowledgeMasteryRuntime''s per-knowledge-point correct/wrong attempt log (js/runtime/KnowledgeMasteryRuntime.js), durable per real student.';

create trigger set_updated_at
  before update on public.knowledge_mastery
  for each row execute function public.set_updated_at();

create index if not exists idx_knowledge_mastery_user on public.knowledge_mastery (user_id) where deleted_at is null;
create index if not exists idx_knowledge_mastery_kp on public.knowledge_mastery (knowledge_point) where deleted_at is null;

-- statistics — AHS.StatisticsRuntime is (and, per §6 "不得影響任何既有
-- 功能", stays) purely computed at read time from the tables above —
-- see that Runtime's own header, "Purely computed... no storage of its
-- own". This table does NOT replace that live computation. It exists
-- only for the one real gap a live-only computation cannot cover: "今日
-- 新增弱點"/"今日解除弱點"-style DAILY counters (js/runtime/
-- StatisticsRuntime.js's newWeaknessesToday()/resolvedWeaknessesToday())
-- are defined relative to "today", so once today becomes yesterday the
-- live source no longer has that day''s point-in-time count unless it
-- was captured when it was still true — durable daily snapshots are
-- what let "✓ Statistics 可永久保存" (§7) hold for trend/history views
-- without changing what any current page computes live right now.
create table if not exists public.statistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  stat_date date not null default current_date,
  metric_key text not null,
  metric_value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (student_profile_id, stat_date, subject_id, metric_key)
);

comment on table public.statistics is
  'AI-126A: durable daily snapshot log, NOT a replacement for AHS.StatisticsRuntime''s existing live computation (js/runtime/StatisticsRuntime.js stays "Purely computed" per §6) — only covers the real gap a live-only read cannot: historical "today"-relative counters after today has passed.';

create trigger set_updated_at
  before update on public.statistics
  for each row execute function public.set_updated_at();

create index if not exists idx_statistics_user on public.statistics (user_id) where deleted_at is null;
create index if not exists idx_statistics_date on public.statistics (stat_date) where deleted_at is null;

-- user_settings — AHS.SettingsRuntime's toggle preferences
-- (js/runtime/SettingsRuntime.js): profile.name/grade already live on
-- student_profiles (display_name/grade, see 20260807000002) since
-- that''s exactly what the PAT-fix commit
-- "登入選擇的學生應與登入後右上角身分一致" made the real Single Source
-- for — this table holds only the remaining two real toggles
-- (showTutorSuggestions/aiGatewayEnabled) so that fix''s own single-
-- source intent isn''t undone by re-splitting the name into a second row.
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  student_profile_id uuid not null unique references public.student_profiles (id) on delete cascade,
  show_tutor_suggestions boolean not null default true,
  ai_gateway_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.user_settings is
  'AI-126A: AHS.SettingsRuntime''s remaining real toggles (js/runtime/SettingsRuntime.js) — profile name/grade stay on student_profiles, not duplicated here, per the existing PAT fix''s Single Source intent.';

create trigger set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

create index if not exists idx_user_settings_user on public.user_settings (user_id) where deleted_at is null;

-- activity_logs — append-only audit trail. Not a 1:1 mapping of any
-- existing Runtime (none of today's Runtimes keep an audit log) — this
-- is new, minimal surface added because the AI-126 Scope's own §2 list
-- names it explicitly. Kept intentionally generic (action/entity_type/
-- entity_id/metadata) rather than one column per possible event, so
-- future Admin/AI/API/Import callers (§5) can log through the same
-- Repository method without a schema change per new event type.
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid references public.student_profiles (id) on delete set null,
  actor_user_id uuid references public.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.activity_logs is
  'AI-126A: append-only audit trail (no existing Runtime precedent — added because Scope §2 names it explicitly). Generic action/entity_type/entity_id/metadata shape so future Admin/AI/API/Import Repository callers (§5) share one write path. updated_at/deleted_at present for schema-wide consistency (§2 requires them on every table) even though this table is intended to be written once per row.';

create trigger set_updated_at
  before update on public.activity_logs
  for each row execute function public.set_updated_at();

create index if not exists idx_activity_logs_student on public.activity_logs (student_profile_id);
create index if not exists idx_activity_logs_actor on public.activity_logs (actor_user_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs (created_at);
