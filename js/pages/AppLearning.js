/* js/app-learning.js — bootstraps 我的學習 inside the shared AppShell. */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    /* HOTFIX-001 Repository Loader Integration: load Repository content
       into MaterialRuntime before My Learning reads it. */
    if (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.load === "function") {
      AHS.TeachingMaterialLoader.load();
    }

    var shell = AHS.AppShell.create(AHS.AppConfig, {
      active: "learning",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });
    if (!shell) { return; } /* Sprint AI-119: not logged in — AppShell already redirected to login.html */
    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.MyLearning.create());
  }
  function coreReady() {
    return !!(window.AHS && AHS.UI && typeof AHS.UI.el === "function" &&
              AHS.AppShell && typeof AHS.AppShell.create === "function");
  }

  /* EO-S7.0-HOTFIX-001 · Initialization Order gate: Browser -> window.AHS
     -> Core Runtime -> AppShell -> Page Runtime -> Component -> Render.
     Components are never created before AppShell's dependencies exist.
     On core-load failure (e.g. a 404'd script), show a diagnostic
     instead of a white page. */
  function guardedInit() {
    if (coreReady()) { init(); return; }
    var app = document.getElementById("app");
    if (app) {
      app.textContent = "系統資源載入失敗（js/core/UI.js 或 AppShell 未載入）。請重新整理；若持續發生，請回報 PMO 檢查部署檔案。";
    }
    if (window.console && console.warn) {
      console.warn("AHS core not ready — component mount aborted (EO-S7.0-HOTFIX-001 gate).");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guardedInit);
  } else {
    guardedInit();
  }

  /* AI Supabase Persistence Root Cause Fix (Root Cause B): re-run the same,
     unmodified guardedInit() whenever a background Repository pull just
     merged fresh rows into a Runtime's Memory Cache (js/repository/
     RepositorySync.js's own header explains why this is necessary — the
     first render almost always happens before a real network pull
     resolves). guardedInit()/init() is idempotent (AHS.UI.mount() clears
     and rebuilds #app every call), so simply calling it again is enough —
     no Runtime Public API change, no UI file needs a Promise. */
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("ahs:repository-pulled", guardedInit);
  }
})();
