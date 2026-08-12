/* js/repository/RepositorySync.js — Sprint AI-126C (Repository Runtime
   Migration), Project Owner Architecture Decision (LOCK):

     UI -> Runtime（同步 Memory Cache）-> Repository（背景 Push/Pull）-> Supabase

   Runtime's public read methods (list()/get()/homeKpis()/...) stay 100%
   synchronous, unchanged in name, return type, and call convention — every
   existing caller across js/components/js/ui/js/pages keeps working exactly
   as before ("不得修改任何 Public API" / "不得修改任何既有 UI").

   AI-126C/126E Session Hotfix: the browser can retain a Supabase session
   whose access_token has expired while the refresh_token is still valid.
   RepositorySync previously started every background pull immediately,
   causing all authenticated PostgREST reads to fail together before the
   existing SyncBridge 401 refresh path could help. This file now performs
   one additive session refresh before the initial pull when a real session
   has a refresh_token. No UI waits for it and no Runtime API changes. */
window.AHS = window.AHS || {};
AHS.RepositorySync = (function () {
  "use strict";

  function domains() {
    return [
      { name: "TeachingMaterialLoader", runtime: AHS.TeachingMaterialLoader },
      { name: "MaterialRuntime", runtime: AHS.MaterialRuntime },
      { name: "WrongBookRuntime", runtime: AHS.WrongBookRuntime },
      { name: "KnowledgeMasteryRuntime", runtime: AHS.KnowledgeMasteryRuntime },
      { name: "SettingsRuntime", runtime: AHS.SettingsRuntime }
    ];
  }

  function runPulls() {
    if (!AHS.SyncBridge || !AHS.SyncBridge.isConfigured()) { return; }
    if (typeof AHS.SyncBridge.flushQueue === "function") { AHS.SyncBridge.flushQueue(); }
    if (!AHS.SyncBridge.identity()) { return; }

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

  /* Session refresh is deliberately best-effort. A missing/invalid refresh
     token must not block the existing synchronous Runtime/Memory path. */
  function refreshThenPull() {
    if (!AHS.SupabaseClient || !AHS.SupabaseClient.isConfigured()) {
      runPulls();
      return;
    }

    var session = AHS.SupabaseClient.getSession();
    if (!session || !session.refresh_token || typeof AHS.SupabaseClient.refreshSession !== "function") {
      runPulls();
      return;
    }

    AHS.SupabaseClient.refreshSession().then(function (result) {
      if (result && result.error && window.console && console.warn) {
        console.warn("RepositorySync: session refresh failed; continuing with current session —", result.error.message || result.error);
      }
      runPulls();
    }).catch(function (err) {
      if (window.console && console.warn) { console.warn("RepositorySync: session refresh threw; continuing with current session —", err); }
      runPulls();
    });
  }

  /* Auto-run once per page load. Never awaited and never blocks the first
     synchronous render. The existing `ahs:repository-pulled` event still
     triggers the exact same idempotent page init after the background pull
     merges fresh data into Runtime Memory Cache. */
  refreshThenPull();

  return {
    pullAll: refreshThenPull
  };
})();
