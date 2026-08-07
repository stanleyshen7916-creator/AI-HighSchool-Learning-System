-- 20260807000003_content_tables.sql
-- AI-126A · folders / materials / question_sets / questions
--
-- These four are the shared Repository catalog — per the Repository
-- Principle (LOCK) and the original AI-126 scope's own §7 ("教材中心
-- 保留，改為 Admin Only"), students read this content, only an
-- is_admin user (or, later, the AI/API/Import pipelines the Scope
-- explicitly names as future Repository callers) writes it. RLS in
-- 20260807000005 enforces exactly that split.

-- folders — AHS.FolderRuntime's "Study Scope" concept
-- (js/runtime/FolderRuntime.js), not a filesystem folder: 第一次月考／
-- 期末考／學測總複習 groupings that materials attach to via
-- material.folderId. scope_type mirrors that Runtime's own fixed
-- SCOPE_TYPES list verbatim so no meaning is invented here.
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject_id uuid references public.subjects (id) on delete set null,
  scope_type text not null default 'custom' check (scope_type in ('exam', 'review', 'subject', 'custom')),
  description text not null default '',
  parent_folder_id uuid references public.folders (id) on delete set null,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.folders is
  'AI-126A: AHS.FolderRuntime''s Study Scope concept (js/runtime/FolderRuntime.js), shared Repository content — Admin Only writes per §7.';

create trigger set_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();

create index if not exists idx_folders_subject on public.folders (subject_id) where deleted_at is null;
create index if not exists idx_folders_parent on public.folders (parent_folder_id) where deleted_at is null;

-- materials — merges AHS.MaterialRuntime's own record shape
-- (js/runtime/MaterialRuntime.js) with the Package track
-- (js/data/TeachingMaterialData.js) and Repository track
-- (data/materials/MaterialRepositoryIndex.js) TeachingMaterialLoader.js
-- already bridges into it today. `origin_key` is the stable external id
-- (e.g. "tm_1", "civics-g10-ch5-6-exam-20260730") those two tracks
-- already carry — kept unique so a re-import is idempotent, matching
-- TeachingMaterialLoader.js's own existing idMap behavior exactly, not
-- a new convention.
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  origin_key text unique,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  folder_id uuid references public.folders (id) on delete set null,
  title text not null,
  chapter text not null default '',
  grade text,
  category text,
  file_name text,
  file_type text,
  file_size text,
  content text not null default '',
  source_track text not null default 'REPOSITORY' check (source_track in ('PACKAGE', 'REPOSITORY')),
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.materials is
  'AI-126A: shared Repository catalog merging AHS.MaterialRuntime''s Package + Repository tracks (see js/runtime/TeachingMaterialLoader.js). origin_key = the stable external id both tracks already carry, unique for idempotent re-import. Admin Only writes per §7 — 學生不得新增教材.';

create trigger set_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

create index if not exists idx_materials_subject on public.materials (subject_id) where deleted_at is null;
create index if not exists idx_materials_folder on public.materials (folder_id) where deleted_at is null;
create index if not exists idx_materials_origin_key on public.materials (origin_key) where deleted_at is null;

-- question_sets — one per real exam/practice question collection
-- (the "examId" concept AHS.QuestionRuntime/ExamRuntime already key by).
-- source mirrors the existing questionSource convention
-- (ORIGINAL/AI_GENERATED) that Sprint AI-117-08's Assessment Mode
-- already enforces must never mix within one set.
create table if not exists public.question_sets (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  source text not null default 'ORIGINAL' check (source in ('ORIGINAL', 'AI_GENERATED')),
  title text not null default '',
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.question_sets is
  'AI-126A: the "examId" concept AHS.QuestionRuntime/AHS.ExamRuntime already key by. source keeps ORIGINAL vs AI_GENERATED separated per AI-117-08''s existing "不得混用" rule.';

create trigger set_updated_at
  before update on public.question_sets
  for each row execute function public.set_updated_at();

create index if not exists idx_question_sets_material on public.question_sets (material_id) where deleted_at is null;
create index if not exists idx_question_sets_subject on public.question_sets (subject_id) where deleted_at is null;

-- questions — one row per real question, matching the field set
-- js/runtime/LearningQuestionRuntime.js's own validate() already
-- requires (question/questionType/difficulty/answer/explanation/
-- knowledgePoint), so nothing here is invented beyond what that
-- Runtime's own real records already carry today.
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid not null references public.question_sets (id) on delete cascade,
  "index" integer not null default 0,
  text text not null,
  question_type text not null default 'single_choice',
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text not null default '',
  knowledge_point text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.questions is
  'AI-126A: real question records, field set matches js/runtime/LearningQuestionRuntime.js''s own existing validate() requirements verbatim.';

create trigger set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create index if not exists idx_questions_set on public.questions (question_set_id) where deleted_at is null;
create index if not exists idx_questions_knowledge_point on public.questions (knowledge_point) where deleted_at is null;
