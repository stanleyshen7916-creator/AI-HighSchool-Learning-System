/* js/data/SupabaseConfig.js — Sprint AI-126B Repository Foundation.

   Static config only, per Repository Structure v2.1 §js/data ("未來所有
   Static Data／Metadata／Config 皆置此資料夾"). Holds the two values a
   real Supabase browser client needs — the Project URL and the
   "anon"/publishable key. Both are meant to be public by Supabase's own
   design (Row Level Security, not secrecy of these two values, is what
   protects real data — see supabase/policies/RLS_POLICY.md) — but this
   repository is Public, so real project-specific values are still never
   committed here; this file ships with them intentionally blank rather
   than guessed or fabricated.

   Sprint AI-126B Final PAT (Cross Device Validation) local-override
   mechanism: real values are supplied via js/data/SupabaseConfig.local.js
   — a git-ignored file (see .gitignore), never committed, filled in by
   whoever needs to run real Connect/Login/CRUD (Project Owner locally, or
   this repo's own tests/supabase/*.js when such a file happens to exist
   on disk). That file sets `AHS.SupabaseConfigLocal = { url, anonKey }`
   in the exact same shape as this one; js/core/SupabaseClient.js's
   config() prefers it over AHS.SupabaseConfig below whenever it exists
   AND has a real (non-empty) url — otherwise it silently falls back to
   this blank placeholder, exactly as before. This file itself is not a
   new configuration architecture — AHS.SupabaseConfig's shape and every
   existing reader of it are unchanged; only one extra, higher-priority,
   git-ignored source was added ahead of it.

   Never put the Supabase service_role key here, in
   SupabaseConfig.local.js, or anywhere in js/ — that key bypasses RLS
   entirely and must never be shipped to a browser. */
window.AHS = window.AHS || {};
AHS.SupabaseConfig = {
  url: "",
  anonKey: ""
};
