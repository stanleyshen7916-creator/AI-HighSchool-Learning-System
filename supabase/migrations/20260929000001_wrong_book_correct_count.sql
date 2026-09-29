-- 2026-09-29（PO 回報：知識弱點「對 N 次」顯示 0 次有誤）
-- WrongBookRuntime 的 correctCount（累計答對次數）原本只存在瀏覽器 sessionStorage，
-- wrong_book 沒有對應欄位，換裝置／重新登入從雲端撈回時一律變成 0。
alter table public.wrong_book
  add column if not exists correct_count integer not null default 0;

comment on column public.wrong_book.correct_count is
  '2026-09-29: cumulative correct retries (WrongBookRuntime correctCount) — never reset by a later wrong answer, unlike correct_streak (current consecutive run). Invariant: correct_count >= correct_streak.';

-- 只補新欄位：既有紀錄的累計答對次數至少等於目前連續答對次數（真實下限，
-- 不猜測更早、已遺失的答對紀錄）。不修改任何既有欄位的值。
update public.wrong_book
  set correct_count = correct_streak
  where correct_count < correct_streak;
