-- 20260819000001_wrong_book_semester_scope.sql
-- Sprint AI-150 · Root Cause Fix — 知識弱點跨學年混雜（使用者原文：「目前
-- 於高二年級，卻看到高一的知識弱點」）。

-- Real, confirmed root cause (traced directly from this schema, not a
-- guess): public.wrong_book / public.knowledge_mastery are only ever
-- scoped by student_profile_id — and public.student_profiles.mock_student_key
-- is UNIQUE (20260807000002_reference_tables.sql), i.e. one single profile
-- row per real student, shared across EVERY Workspace（School/Semester)
-- they've ever used. AHS.WrongBookRuntime.pullFromRepository() /
-- AHS.KnowledgeMasteryRuntime.pullFromRepository() therefore have no way
-- to ask "only this student's CURRENT semester's records" — the query can
-- only ever be "this student's records, full stop" — so every background
-- sync pulls that student's ENTIRE cross-semester history into whichever
-- local Workspace namespace happens to be active, regardless of the
-- Workspace switch itself working correctly (js/runtime/WorkspaceRuntime.js
-- and js/ui/AppShell.js's Topbar switch were independently verified
-- correct, both by code reading and a real-browser Playwright run — this
-- is a database-schema gap, not a frontend bug).
--
-- Fix: add school_code/semester_code (mirroring js/runtime/WorkspaceRuntime.js's
-- own {schoolId, semesterIds} shape, same convention already used by
-- public.student_profiles.school_code/semester_codes) to both tables.
-- js/runtime/WrongBookRuntime.js and js/runtime/KnowledgeMasteryRuntime.js
-- now write these two columns on every new push (only when the active
-- Workspace has exactly ONE selected semester — a multi-select combined
-- Workspace has no single semester a record can be honestly attributed
-- to, so it is deliberately left unscoped rather than guessed) and filter
-- pulls by them the same way.
--
-- Existing rows keep school_code/semester_code = NULL (no way to honestly
-- backfill which semester an already-pushed record belongs to — most
-- existing wrong_book rows never even carry question_id/material_id, per
-- that Runtime's own AI-127 comment, since a mock student session cannot
-- write to the Admin-only materials/questions tables). A NULL row simply
-- stops being returned by a semester-scoped pull going forward — it does
-- not keep leaking into every semester (today's bug), and it is never
-- deleted or overwritten. This is the deliberately safer outcome: it never
-- fabricates which semester a record belongs to.

alter table public.wrong_book
  add column if not exists school_code text,
  add column if not exists semester_code text;

alter table public.knowledge_mastery
  add column if not exists school_code text,
  add column if not exists semester_code text;

-- knowledge_mastery's existing unique(student_profile_id, knowledge_point)
-- forced every semester's attempts on the same-named knowledge point onto
-- ONE shared row — itself a second instance of the same root cause (a
-- student's 高一 and 高二 attempts on a knowledge point that happens to
-- share a name would already have been merged into one aggregate, even
-- before considering the pull-side leak above). Replace it with a
-- constraint that also includes semester_code, so different semesters get
-- separate rows going forward. Postgres treats multiple NULLs as mutually
-- non-conflicting under a UNIQUE constraint, so existing (NULL, NULL)
-- rows and any future genuinely-unscoped (multi-select Workspace) rows
-- never collide with each other or with a scoped row — no backfill or
-- data loss required for this migration to apply cleanly.
alter table public.knowledge_mastery
  drop constraint if exists knowledge_mastery_student_profile_id_knowledge_point_key;
alter table public.knowledge_mastery
  add constraint knowledge_mastery_semester_scope_key
  unique (student_profile_id, knowledge_point, semester_code);

create index if not exists idx_wrong_book_semester
  on public.wrong_book (student_profile_id, semester_code) where deleted_at is null;
create index if not exists idx_knowledge_mastery_semester
  on public.knowledge_mastery (student_profile_id, semester_code) where deleted_at is null;

comment on column public.wrong_book.semester_code is
  'AI-150: js/runtime/WorkspaceRuntime.js semesterIds[0] at push time (only when exactly one semester was active — never guessed for a multi-select Workspace). NULL for rows written before this migration.';
comment on column public.knowledge_mastery.semester_code is
  'AI-150: same convention as wrong_book.semester_code — see that column''s comment.';
