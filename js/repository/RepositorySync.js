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
   construction.

   AI Supabase Persistence Root Cause Fix (Root Cause B): the missing half
   was never the pull itself — it was that nothing told an already-mounted
   page a pull had just merged fresh rows into a Runtime's Memory Cache.
   Every page bootstrap (js/pages/App*.js) only ever calls its own render
   once, at DOMContentLoaded, reading whatever the synchronous Runtime
   already has at that instant — almost always before a real network pull
   has resolved. pullAll() now dispatches a plain `window` CustomEvent,
   "ahs:repository-pulled", once every domain's pullFromRepository() this
   round has settled (success or failure, via Promise.all over each
   already-caught promise) — the native, zero-dependency browser mechanism
   this Sprint's own Fix spec asks to prefer over inventing a new state
   framework. Each page's own guardedInit()/init() is idempotent (mount()
   clears and rebuilds #app from scratch every call — js/core/UI.js), so
   listening for this event and simply re-running the exact same,
   unmodified init() is sufficient; no Runtime Public API changes, no UI
   file needs to know about Promises. Only fires when a pull actually ran
   (isConfigured() + identity() both true) — an unconfigured/logged-out
   page never gets a spurious re-render. */
window.AHS = window.AHS || {};
AHS.RepositorySync = (function () {
  "use strict";

  /* Domains named by AI-126C Task 1/2/3/5 + AI-126D/E's own Task 3
     ("TeachingMaterialRuntime" — this is AHS.TeachingMaterialLoader, the
     Material Repository Read pull built in AI-126B Part 2 v1.1 Task 1,
     genuinely missing from this list until now, a real gap fixed here,
     not new work invented for its own sake). Statistics is intentionally
     absent — AHS.StatisticsRuntime remains "purely computed, no store of
     its own", per its own existing header; its numbers are already real
     once the Runtimes below are hydrated. */
  function domains() {
    return [
      { name: "TeachingMaterialLoader", runtime: AHS.TeachingMaterialLoader },
      { name: "MaterialRuntime", runtime: AHS.MaterialRuntime },
      { name: "WrongBookRuntime", runtime: AHS.WrongBookRuntime },
      { name: "KnowledgeMasteryRuntime", runtime: AHS.KnowledgeMasteryRuntime },
      { name: "SettingsRuntime", runtime: AHS.SettingsRuntime }
    ];
  }

  /* runPulls() — the actual per-domain pullFromRepository() fan-out,
     unchanged from before this Sprint. Split out of pullAll() only so
     Sprint AI-127's session-refresh step (below) has something to call
     once it's done, without duplicating this logic. */
  function runPulls() {
    var pulls = domains()
      .filter(function (d) { return d.runtime && typeof d.runtime.pullFromRepository === "function"; })
      .map(function (d) {
        return d.runtime.pullFromRepository().catch(function (err) {
          if (window.console && console.warn) { console.warn("RepositorySync: " + d.name + " pull threw —", err); }
        });
      });
    if (pulls.length && typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
      Promise.all(pulls).then(function () {
        window.dispatchEvent(new window.CustomEvent("ahs:repository-pulled"));
      });
    }
  }

  /* pullAll() — fire-and-forget; returns nothing meaningful to callers by
     design (this is a background refresh, not a value the synchronous UI
     ever waits on). Safe to call more than once per page (each Runtime's
     own pullFromRepository() is itself idempotent — merges by remote id/
     origin_key, never duplicates). Sprint AI-126E Task 5: also flushes
     any still-queued offline pushes from earlier in this same page's
     lifetime before pulling fresh state.

     Sprint AI-127 (Home Runtime Crash + Supabase 403 Hotfix): a real
     browser session can arrive here with an already-expired access_token
     (e.g. the tab was left open past the token's lifetime) — every
     pullFromRepository() call is a plain repo.read(), which has no
     retry-on-401/403 logic of its own (unlike pushFireAndForget(), which
     AI-126E already gave a reactive refresh-and-retry path for writes).
     A stale token here means every GET this round comes back 401/403,
     is swallowed by pullFromRepository()'s own { pulled: 0, error }
     return, and the page silently keeps showing whatever the (possibly
     empty) Memory Cache already had — indistinguishable from "genuinely
     no data" without opening DevTools. Proactively calling the existing
     AHS.SupabaseClient.refreshSession() (built in AI-126E, previously
     only ever invoked reactively from a write's own 401) once up front,
     before this round's pulls, closes that gap — still fire-and-forget,
     still never blocks the synchronous first render (only pullAll()'s
     own internal background chain waits on it, nothing outside this
     function ever does). No refresh_token on the current session, or no
     SupabaseClient.refreshSession() at all (a page not carrying that
     script), or the refresh call itself failing — none of these throw or
     clear the Memory Cache; runPulls() still runs either way, and a
     genuine remaining 401/403 is left for Repository's own existing
     error reporting (console.warn) exactly as before this Sprint. */
  function pullAll() {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return; }
    if (typeof AHS.SyncBridge.flushQueue === "function") { AHS.SyncBridge.flushQueue(); }
    if (!AHS.SyncBridge.identity()) { return; }
    var session = (AHS.SupabaseClient && typeof AHS.SupabaseClient.getSession === "function")
      ? AHS.SupabaseClient.getSession() : null;
    var refreshToken = session && session.refresh_token;
    if (refreshToken && AHS.SupabaseClient && typeof AHS.SupabaseClient.refreshSession === "function") {
      AHS.SupabaseClient.refreshSession().then(runPulls);
      return;
    }
    runPulls();
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
