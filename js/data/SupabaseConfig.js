/* js/data/SupabaseConfig.js — Sprint AI-126B Repository Foundation.

   Static config only, per Repository Structure v2.1 §js/data ("未來所有
   Static Data／Metadata／Config 皆置此資料夾"). Holds the two values a
   real Supabase browser client needs — the Project URL and the
   "anon"/publishable key. Both are meant to be public by Supabase's own
   design (Row Level Security, not secrecy of these two values, is what
   protects real data — see supabase/policies/RLS_POLICY.md) — but they
   are still real, project-specific values only the Project Owner can
   supply, so this file ships with them intentionally blank rather than
   guessed or fabricated.

   Never put the Supabase service_role key here or anywhere in js/ — that
   key bypasses RLS entirely and must never be shipped to a browser. */
window.AHS = window.AHS || {};
AHS.SupabaseConfig = {
  url: "",
  anonKey: ""
};
