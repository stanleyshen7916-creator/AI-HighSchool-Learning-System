/* js/data/SupabaseConfig.js — Sprint AI-126B Repository Foundation.

   Static config only, per Repository Structure v2.1 §js/data ("未來所有
   Static Data／Metadata／Config 皆置此資料夾"). Holds the two values a
   real Supabase browser client needs — the Project URL and the
   "anon"/publishable key. Both are meant to be public by Supabase's own
   design (Row Level Security, not secrecy of these two values, is what
   protects real data — see supabase/policies/RLS_POLICY.md).

   Sprint AI-142（PO 回報：手機實測發現正式站從未真正連上 Supabase —
   AHS.SyncBridge.identity() 恆為 null，考試結果／帳號設定皆無法真正
   同步）: real project values, supplied directly by Project Owner from
   the Supabase Dashboard (Project Settings → API), committed here so the
   deployed GitHub Pages site (which cannot read the git-ignored
   SupabaseConfig.local.js below) actually has something to connect
   with. Real data protection is RLS (already built, "no Public Full
   Access"), not secrecy of these two values.

   js/data/SupabaseConfig.local.js — a git-ignored file (see .gitignore)
   — still takes priority over this file whenever it exists AND has a
   real (non-empty) url, e.g. for a developer's own separate local/dev
   Supabase project; otherwise js/core/SupabaseClient.js's config() falls
   back to the real values below.

   Never put the Supabase service_role key here, in
   SupabaseConfig.local.js, or anywhere in js/ — that key bypasses RLS
   entirely and must never be shipped to a browser. */
window.AHS = window.AHS || {};
AHS.SupabaseConfig = {
  url: "https://teddsuhnmsknkcmxpyla.supabase.co",
  anonKey: "sb_publishable_KN0_5vEJGldSCz24IL4wcA_fI1zVDuj"
};
