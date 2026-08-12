/* js/data/RuntimeModeConfig.js — Sprint AI-126E Task 1 (Runtime Mode
   Enable). Static config only, per Repository Structure v2.1 §js/data.

   Three named modes, controlling ONLY whether the already-existing
   background sync machinery (AHS.SyncBridge / each domain's pushX() /
   AHS.RepositorySync.pullAll() / AHS.OfflineQueue) is allowed to run at
   all — never how Runtime's own public methods behave. Per the AI-126C
   Architecture Decision (LOCK: "UI → Runtime（同步 Memory Cache）→
   Repository（背景 Push/Pull）→ Supabase"), Runtime's public read methods
   (list()/get()/homeKpis()/...) are ALWAYS synchronous, in every mode —
   this file cannot and does not change that; a true async-first
   "Supabase" mode would require Runtime to return Promises, which
   directly violates that LOCK and this Sprint's own "不得修改任何 Runtime
   Public API" restriction. Modes:

   - "memory"   — background sync fully disabled. Every domain's push/pull
                  becomes a pure no-op regardless of real credentials
                  being configured (useful for pure offline/demo/testing
                  contexts that must never attempt network I/O).
   - "hybrid"   — DEFAULT. Current, already-built AI-126B/C/D behavior:
                  synchronous Memory Cache reads, fire-and-forget
                  background Repository push/pull whenever real
                  credentials exist.
   - "supabase" — functionally IDENTICAL to "hybrid" from every existing
                  caller's perspective (Runtime's synchronous contract
                  cannot change) — named separately only so a future
                  caller could signal "prefer Repository as source of
                  truth" without altering behavior today; honestly not a
                  distinct code path, since making it one would break the
                  LOCK above.

   AHS.SyncBridge.isConfigured() (js/repository/SyncBridge.js) is the one
   place this gets read — every existing pushX()/pullFromRepository()/
   AHS.RepositorySync already gates on isConfigured(), so this file needs
   no other integration point. */
window.AHS = window.AHS || {};
AHS.RuntimeModeConfig = {
  mode: "hybrid"
};
