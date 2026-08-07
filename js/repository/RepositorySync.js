/* js/repository/RepositorySync.js — Sprint AI-126C (Repository Runtime
   Migration), Project Owner Architecture Decision (LOCK):

     UI -> Runtime（同步 Memory Cache）-> Repository（背景 Push/Pull）-> Supabase

   Runtime's public read methods (list()/get()/homeKpis()/...) stay 100%
   synchronous, unchanged in name, return type, and call convention — every
   existing caller across js/components/js/ui/js/pages keeps working
   exactly as before ("不得修改任何 Public API" / "不得修改任何既有 UI").
   AI-126B Part 2 already built each domain's own pushX()/pullFromRepository()
   (fire-and-forget writes, additive async reads) — what was still missing
   is the "啟動 -> Repository -> Pull -> 更新 Memory Cache" half of the data
   flow: nothing ever actually CALLED pullFromRepository() outside a test
   harness, and no HTML page even <script>-tagged the Repository Layer
   files at all (confirmed by grep — js/pages/AppLogin.js's existing
   AHS.AuthRepository.loginForMockStudent() call has been silently no-op'ing
   in every real browser since Part 1, because login.html never loaded
   AuthRepository.js). This file is the single, additive orchestration
   point that closes that gap — not a new Repository design (Repository.js/
   SupabaseRepository.js/RepositoryFactory.js/SyncBridge.js are all
   untouched), just the "call pullFromRepository() automatically" wiring
   Task 1-5 need.

   pullAll() is deliberately defensive per-Runtime (`typeof ... ===
   "function"`) since not every page loads every Runtime script (see each
   HTML page's own <script> list — e.g. dashboard.html never loads
   MaterialRuntime.js/WrongBookRuntime.js). Every call is routed through
   AHS.SyncBridge.pushFireAndForget-style fire-and-forget semantics (never
   awaited here, never blocks the caller) — matching the Architecture
   Decision's explicit "不得要求 UI 等待網路完成". When Supabase is
   unreachable (this session's own sandboxed environment, or simply a user
   who hasn't logged in with a real account yet), every pullFromRepository()
   already resolves { pulled: 0 } / swallows its own error — Runtime's
   Memory Cache is completely unaffected, never cleared, never blocked;
   "Repository 屬於同步機制，不是 Runtime 唯一資料來源" holds by
   construction. */
window.AHS = window.AHS || {};
AHS.RepositorySync = (function () {
  "use strict";

  /* Domains named by AI-126C Task 1/2/3/5 (Statistics/Task 4 is
     intentionally absent — AHS.StatisticsRuntime remains "purely
     computed, no store of its own", per its own existing header; its
     numbers are already real once the Runtimes below are hydrated). */
  function domains() {
    return [
      { name: "MaterialRuntime", runtime: AHS.MaterialRuntime },
      { name: "WrongBookRuntime", runtime: AHS.WrongBookRuntime },
      { name: "KnowledgeMasteryRuntime", runtime: AHS.KnowledgeMasteryRuntime },
      { name: "SettingsRuntime", runtime: AHS.SettingsRuntime }
    ];
  }

  /* pullAll() — fire-and-forget; returns nothing meaningful to callers by
     design (this is a background refresh, not a value the synchronous UI
     ever waits on). Safe to call more than once per page (each Runtime's
     own pullFromRepository() is itself idempotent — merges by remote id/
     origin_key, never duplicates). */
  function pullAll() {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return; }
    if (!AHS.SyncBridge.identity()) { return; }
    domains().forEach(function (d) {
      if (d.runtime && typeof d.runtime.pullFromRepository === "function") {
        d.runtime.pullFromRepository().catch(function (err) {
          if (window.console && console.warn) { console.warn("RepositorySync: " + d.name + " pull threw —", err); }
        });
      }
    });
  }

  /* Auto-run once per page load (module-execution time — this IIFE runs
     the instant this <script> tag executes, before the page's own
     bootstrap file renders anything). Never awaited, never blocks the
     synchronous first render; a page that loads before login (login.html
     itself does not <script>-tag this file at all) or before any pull
     resolves simply keeps showing its current Memory Cache, exactly as
     it always has. */
  pullAll();

  return {
    pullAll: pullAll
  };
})();
