-- 20260819000002_wrong_book_options.sql
-- Sprint AI-152 · Root Cause Fix — 知識弱點「全部重新練習」複習作答卡住
-- （使用者 QA 回報：彈窗題目下面完全沒有選項可以選，無法提交答案）。

-- Real, confirmed root cause: public.wrong_book was never given a column
-- for the question's own answer options — js/runtime/WrongBookRuntime.js's
-- sync() always carried record.options locally (real, passed straight
-- through from AHS.AutoGrader.grade()'s own results), but pushRecord()'s
-- row payload never included it (there was no column to send it to), and
-- pullFromRepository() therefore had nothing real to merge back either.
-- Any local wrong-book record whose CURRENT copy on this device/session
-- only exists because it was pulled from Supabase (a fresh device, or a
-- fresh session after sessionStorage was cleared) has an empty options
-- array — js/components/WrongBook.js's buildReviewInteraction() (全部
-- 重新練習's per-question review flow) and renderDetail() both render
-- zero <li> option rows for such a record, since both already defensively
-- guard on `Array.isArray(item.options) ? item.options : []` (the AI-127
-- hotfix comment on renderDetail() already anticipated exactly this empty
-- case) rather than crashing — but a genuinely empty option list leaves
-- the student with nothing to click and no way to submit an answer.

alter table public.wrong_book
  add column if not exists options jsonb not null default '[]'::jsonb;

comment on column public.wrong_book.options is
  'AI-152: the question''s own real answer options ([{key,text},...], same shape as AHS.QuestionRuntime), passed straight through by AHS.AutoGrader.grade() at the moment sync() first creates this record — never fabricated. Existing rows default to an empty array (no way to honestly reconstruct options for a record already stored without them); js/runtime/WrongBookRuntime.js only fills a local record''s options from this column when the local copy genuinely has none yet, never overwriting a real local value.';
