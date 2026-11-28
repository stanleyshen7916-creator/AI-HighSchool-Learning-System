-- 2026-11-28（PO 回報：iPad 考完國文模擬月考，電腦版查不到）
-- 原因：作答中的考卷只存在瀏覽器 sessionStorage。iPad Safari 考試途中分頁的
-- 暫存被清掉（41 分鐘沒有連線後被要求重新登入），作答與成績一起消失，沒有東西可上傳。
-- 這張表備份「作答中」的考卷：開始作答與每次作答後（約 1.5 秒內）寫入，
-- 交卷且成績寫進 month_exam_results 後刪除。頁面載入時本機沒有進行中的考卷，
-- 就從這裡接回來（同一裝置重新登入或換裝置都能繼續作答／超時自動交卷）。
-- session 為 AHS.MonthExamRuntime 的進行中考卷（題目 id、選項順序、作答），不含題目內容。

create table if not exists public.month_exam_active (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  school_code text,
  semester_code text,
  local_id text not null,
  subject_name text not null default '',
  started_at timestamptz not null,
  session jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint month_exam_active_local_id_key unique (student_profile_id, local_id)
);

comment on table public.month_exam_active is
  '2026-11-28: AHS.MonthExamRuntime in-progress paper backup (session = items/order/answers). Deleted once the paper is in month_exam_results.';

create trigger set_updated_at
  before update on public.month_exam_active
  for each row execute function public.set_updated_at();

create index if not exists idx_month_exam_active_scope
  on public.month_exam_active (student_profile_id, school_code, semester_code, updated_at desc);

alter table public.month_exam_active enable row level security;

create policy "month_exam_active_owner_all"
  on public.month_exam_active for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.month_exam_active to authenticated;
