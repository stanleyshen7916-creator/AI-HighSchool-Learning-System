# AI-126A RLS Policy Design

Every one of the 15 tables has Row Level Security **enabled** (`alter table ... enable row level security`) — none rely on default-deny-by-omission; the policies below are the actual, real access rules, defined in `supabase/migrations/20260807000005_rls_policies.sql`. No table has a "Public Full Access" policy anywhere in this schema.

## The two access shapes

**(a) Shared Repository catalog** — `subjects`, `folders`, `materials`, `question_sets`, `questions`:
- `SELECT`: any authenticated user (`auth.role() = 'authenticated'`) — 教材中心 is a shared read view every student sees.
- `INSERT`/`UPDATE`/`DELETE`: only `public.is_admin(auth.uid())` — per the original AI-126 Scope §7, "學生不得新增教材...改為 Admin Only".

**(b) Private per-student data** — `learning_progress`, `exam_sessions`, `exam_answers`, `wrong_book`, `knowledge_mastery`, `statistics`, `user_settings`:
- Full CRUD (`for all`), restricted to `auth.uid() = user_id` on both `using` and `with check` — a student can only ever read or write their own rows. No admin override policy exists on any of these seven tables (not required by any Acceptance item; adding one would be scope this phase wasn't asked to add).

## `users` / `student_profiles` — identity itself, handled individually

These two don't fit either shape above cleanly, and needed two extra real safeguards a bare "owner can do anything" policy would have missed:

1. **A new `auth.users` row needs a matching `public.users` row to exist before any policy can even evaluate `is_admin` for it.** RLS alone can't create that row — `handle_new_user()` (a `security definer` trigger function, so it runs as its owner and is not itself subject to RLS) fires `after insert on auth.users` and creates it automatically, regardless of which real Auth method AI-126C ultimately wires up (email/password, magic link, or Anonymous Sign-in all create a real `auth.users` row the same way).
2. **A student must never be able to grant themselves `is_admin`.** `users` does have an `UPDATE` policy allowing a user to update their own row (for future profile fields), but Postgres RLS has no native per-column restriction — so `prevent_self_admin_escalation()` (a `before update` trigger) silently resets `is_admin` back to its old value unless the request is running as `service_role`. This was verified against a real Postgres role configured with `BYPASSRLS` (matching how Supabase's actual service-role key behaves) — see `supabase/README.md`'s verification section for the exact test.

`users` itself: `SELECT`/`UPDATE` limited to `auth.uid() = id`. No `INSERT` policy (rows are created exclusively by `handle_new_user()`). No `DELETE` policy (account deletion is a Repository/`service_role` concern, not an ordinary session action).

`student_profiles`: `SELECT`/`INSERT`/`UPDATE` limited to `auth.uid() = user_id`.

## `activity_logs` — append-only

`SELECT`/`INSERT` allowed only where the caller is either the row's `actor_user_id` or the owner (via `student_profiles.user_id`) of the row's `student_profile_id`. No `UPDATE`/`DELETE` policy — the table is append-only by design (see its own migration comment).

## Why `is_admin(uuid)` is a single shared function

Every "Admin Only" write policy across the five shared-catalog tables (15 policies total: 3 each × 5 tables) calls the exact same `public.is_admin(check_user_id)` function rather than repeating the same subquery 15 times. This means the Admin-eligibility rule can never drift between tables — a future change to what "admin" means is a one-function edit, not a 15-policy audit.
