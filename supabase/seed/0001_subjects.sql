-- 0001_subjects.sql — AI-126A fixed 科目 lookup data.
--
-- Reference/lookup data only, never user data (per this directory's
-- own purpose). code/name pairs match js/data/AppConfig.js's own real,
-- already-shipped subjectOptions list verbatim (chinese/english/math/
-- physics/chemistry/biology/history/geography/civics ↔
-- 國文/英文/數學/物理/化學/生物/歷史/地理/公民) — not invented here.
--
-- Not applied automatically by `supabase db push` (that only runs
-- migrations/). Apply explicitly once, after the schema migrations:
--   psql "$SUPABASE_DB_URL" -f supabase/seed/0001_subjects.sql

insert into public.subjects (code, name) values
  ('chinese', '國文'),
  ('english', '英文'),
  ('math', '數學'),
  ('physics', '物理'),
  ('chemistry', '化學'),
  ('biology', '生物'),
  ('history', '歷史'),
  ('geography', '地理'),
  ('civics', '公民')
on conflict (code) do update set name = excluded.name;
