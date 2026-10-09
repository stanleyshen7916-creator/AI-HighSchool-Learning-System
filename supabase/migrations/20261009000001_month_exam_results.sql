-- 2026-10-09（PO 要求：模擬月考的成績紀錄要存到雲端）
-- AHS.MonthExamRuntime 的交卷結果（history）原本只存在瀏覽器 sessionStorage，
-- 關掉分頁或換裝置就看不到。每份考卷存一列：成績摘要＋逐題作答（rows，jsonb）。
-- 錯題本身仍走 wrong_book（與平常練習相同），這張表只存考卷結果。

create table if not exists public.month_exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  school_code text,
  semester_code text,
  local_id text not null,
  subject_code text not null,
  subject_name text not null default '',
  material_ids text[] not null default '{}',
  started_at timestamptz not null,
  submitted_at timestamptz not null,
  timed_out boolean not null default false,
  total integer not null default 0,
  correct_count integer not null default 0,
  unanswered integer not null default 0,
  score numeric(5, 1) not null default 0,
  rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint month_exam_results_local_id_key unique (student_profile_id, local_id)
);

comment on table public.month_exam_results is
  '2026-10-09: AHS.MonthExamRuntime submit() result per paper — local_id is the runtime session id (me_<timestamp>), rows is the per-question review (question, options, answer, given, correct, explanation).';

create trigger set_updated_at
  before update on public.month_exam_results
  for each row execute function public.set_updated_at();

create index if not exists idx_month_exam_results_semester
  on public.month_exam_results (student_profile_id, semester_code, submitted_at desc) where deleted_at is null;

alter table public.month_exam_results enable row level security;

create policy "month_exam_results_owner_all"
  on public.month_exam_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.month_exam_results to authenticated;
