/* js/app-materials.js — bootstraps 教材中心 inside the shared AppShell.

   Sprint 6.6 Runtime QA Round 3 (WO-011, Issue #022): the shared Header
   search bar (js/components/AppShell.js's topbar) now forwards keystrokes
   into Material Center's existing, already-working search/filter
   pipeline via the setKeyword() hook — real-time, same matching rules
   (title/chapter/fileName/content/folder name) as Material Center's own
   in-page search bar, same Empty State on no matches. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    /* Sprint v1.4 Module C: load any real Teaching Material Repository
       content into MaterialRuntime/SummaryRuntime before Material Center
       reads it — no-ops when the Repository is empty (Empty State
       unchanged). See js/runtime/TeachingMaterialLoader.js. */
    if (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.initialize === "function") {
      AHS.TeachingMaterialLoader.initialize();
    }

    var materialCenterRoot = AHS.MaterialCenter.create();

    var shell = AHS.AppShell.create(AHS.AppConfig, {
      active: "materials",
      onNavigate: function () { /* Mock navigation — prototype. */ },
      onGlobalSearch: function (keyword) {
        if (materialCenterRoot.setKeyword) { materialCenterRoot.setKeyword(keyword); }
      }
    });

    AHS.UI.mount(app, shell.root);

    /* Platform Refactor Master (PAT 8/9/10): same real Tutor Context
       首頁/AI Tutor already share (Sprint AI-111), reused verbatim —
       renders nothing when there is no real data yet. */
    var tip = AHS.TutorContextTip && AHS.TutorContextTip.create({ page: "materials" });
    if (tip) { shell.main.appendChild(tip); }

    shell.main.appendChild(materialCenterRoot);
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
