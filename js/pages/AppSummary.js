/* js/app-summary.js — bootstraps 總結中心 inside the shared AppShell.

   Sprint 6.6 Runtime QA Round 2 (WO-010, Issue #021): reads an optional
   ?materialId=... query param so links into a SPECIFIC material's
   Summary Detail (e.g. from HomeRecentMaterials.js's "已生成學習總結"
   badge) actually land on that material's summary, instead of always
   showing the undifferentiated full list. */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }
    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "summary",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });
    AHS.UI.mount(app, shell.root);

    var params = new URLSearchParams(window.location.search);
    var materialId = params.get("materialId") || null;

    shell.main.appendChild(AHS.SummaryCenter.create(undefined, materialId));
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
})();
