alter table public.wrong_book
  add column if not exists local_question_id text;

comment on column public.wrong_book.local_question_id is
  'AI-152 hotfix: the question''s own local/human-readable id (e.g. "tm_1_q1" — js/data/TeachingMaterialData.js question ids), passed straight through by WrongBookRuntime.pushRecord() at the moment sync() first creates this record. Distinct from wrong_book.question_id (a UUID foreign key that can never hold this string): without this column, a fresh session (new device, incognito, or sessionStorage cleared by closing the browser) pulling this record back from Supabase has no way to look the question back up in TeachingMaterialData.js, so resolveOptions()/resolveFigureSvg() (js/components/WrongBook.js) can never backfill options/figureSvg for it — this column is what makes that backfill actually round-trip.';
