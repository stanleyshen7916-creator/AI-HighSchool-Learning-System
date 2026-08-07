# AI-126A Deployment — GitHub Actions + Secrets Setup

**Status**: `.github/workflows/supabase-deploy.yml` is `workflow_dispatch`-only — it never runs automatically, only when explicitly triggered from the **Actions** tab or via the API.

## Why three secrets, and why these exact names

The Supabase CLI's official non-interactive/CI mode (`supabase link`, `supabase db push`) reads these three environment variables. They are not chosen by this repository — they are the Supabase CLI's own required variable names, confirmed against Supabase's own documentation and the official `supabase/setup-cli` GitHub Action's README:

| GitHub Secret name | What it is | Used by |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Your personal Supabase account access token (not project-specific) | `supabase link` |
| `SUPABASE_DB_PASSWORD` | The target project's Postgres database password | `supabase db push` |
| `SUPABASE_PROJECT_ID` | The target project's reference ID (the slug in the project's dashboard URL) | `supabase link --project-ref` |

The workflow reads them only via `${{ secrets.SUPABASE_ACCESS_TOKEN }}` etc. — no value is ever written into this repository, this file, or any commit. GitHub masks secret values in the Action log automatically once they're used as `env:`.

## Step-by-step (Project Owner)

### 1. `SUPABASE_ACCESS_TOKEN`

1. Go to the Supabase Dashboard → click your avatar (bottom-left) → **Account** → **Access Tokens**.
2. **Generate new token**, give it a name (e.g. `github-actions-ai126`), copy the value immediately (Supabase only shows it once).

### 2. `SUPABASE_DB_PASSWORD`

1. Open your Supabase project → **Project Settings** → **Database**.
2. Under **Database password**, either copy the password you set when the project was created, or click **Reset database password** to generate a new one and copy it immediately.

### 3. `SUPABASE_PROJECT_ID`

1. Open your Supabase project → **Project Settings** → **General**.
2. Copy the **Reference ID** value (also visible as the slug in the project's dashboard URL: `https://app.supabase.com/project/<this-part>`).

### 4. Add each value as a GitHub repository secret

1. In this repository on GitHub: **Settings** → **Secrets and variables** → **Actions** → **Repository secrets** tab.
2. Click **New repository secret** three times, once per name below, pasting the corresponding value from steps 1–3:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_PROJECT_ID`
3. Do not paste any of these values anywhere else (commit messages, issues, PR descriptions, chat) — once saved as a repository secret, GitHub never displays the value again, only its name.

## What the workflow does when run (`Actions → Supabase Deploy → Run workflow`)

1. Install the Supabase CLI (`supabase/setup-cli@v3`).
2. `supabase link --project-ref $SUPABASE_PROJECT_ID` (uses `supabase/config.toml`, the minimal config file the CLI requires to run at all).
3. `supabase db push` — applies every file in `supabase/migrations/`, in filename order, to the real linked project.
4. `supabase migration list` — prints local vs. remote applied migration history (Migration verification).
5. `supabase db query --linked --file supabase/seed/0001_subjects.sql` — applies the 9 fixed subject rows.
6. `supabase db query --linked "..."` (read-only) — prints `public` schema table count/names, `rowsecurity` per table, and `pg_policies` count (Table + RLS verification).
7. `supabase db query --linked "..."` (read-only) — prints the seeded `subjects` rows (Seed verification).

Steps 4–7 all go through the CLI's `--linked` mode, which queries via Supabase's Management API rather than a direct Postgres/pooler connection — this avoids guessing the real project's pooler region or IPv4/IPv6 host, a documented source of CI connection failures for hand-built `psql` connection strings. None of these steps ever print a secret value — only schema names, row counts, and booleans.

`supabase/schema/rollback.sql` is not run by this workflow — full teardown remains an explicit, separate manual step (see `supabase/README.md`), never wired into CI.

## Sources consulted for the secret names and CLI pattern above

- Supabase CLI reference — `supabase db push` (https://supabase.com/docs/reference/cli/supabase-db-push)
- `supabase/setup-cli` official GitHub Action README (https://github.com/supabase/setup-cli) — example workflow:
  ```yaml
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
    SUPABASE_DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
    PROJECT_ID: <project-id>
  steps:
    - uses: supabase/setup-cli@v3
    - run: supabase link --project-ref $PROJECT_ID
    - run: supabase db push
  ```
- Supabase Docs, "Managing Environments" (https://supabase.com/docs/guides/deployment/managing-environments) — corroborated via search; direct fetch of this specific page returned HTTP 403 from this environment, so its exact page text was not quoted verbatim here, but the same three variable names and CLI sequence are independently confirmed by the two sources above.
