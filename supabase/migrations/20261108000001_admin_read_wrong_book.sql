-- 2026-11-08 知識弱點：Admin 檢視學生錯題（唯讀）。
-- 使用者需求：Admin 不用換帳號，就能在知識弱點頁檢視學生的錯題與重點整理。
-- 只新增 SELECT 權限；學生仍只能讀寫自己的資料，Admin 不能修改學生的錯題。

-- SECURITY DEFINER：在 policy 裡查 student_profiles 時不受 student_profiles 自己的 RLS 影響（避免遞迴）。
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_profiles
    where user_id = auth.uid() and role = 'ADMIN' and deleted_at is null
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists wrong_book_admin_select on public.wrong_book;
create policy wrong_book_admin_select on public.wrong_book
  for select to authenticated
  using (public.is_admin());

drop policy if exists student_profiles_admin_select on public.student_profiles;
create policy student_profiles_admin_select on public.student_profiles
  for select to authenticated
  using (public.is_admin());
