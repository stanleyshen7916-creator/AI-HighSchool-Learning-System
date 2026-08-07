-- 20260807000001_extensions_and_helpers.sql
-- AI-126A · Supabase Foundation (Migration / Schema / RLS)
--
-- Enables the one extension every table's UUID PK needs, and defines the
-- single shared trigger function every table's own migration attaches to
-- its own `updated_at` column. Nothing here is app-specific — this file
-- exists purely so every later migration in this directory can assume
-- both are already available, without repeating them 15 times.

-- pgcrypto ships with every Supabase project by default and provides
-- gen_random_uuid() — the standard way to default a UUID PK column
-- without requiring the older uuid-ossp extension.
create extension if not exists "pgcrypto";

-- set_updated_at() — generic BEFORE UPDATE trigger function, attached to
-- every table in this schema that has an `updated_at` column (all of
-- them). Keeps "when was this row last changed" honest and automatic —
-- no Repository Layer / Runtime code has to remember to set it manually
-- on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'AI-126A shared trigger: stamps NEW.updated_at = now() on every UPDATE. Attached per-table by each table''s own migration.';
