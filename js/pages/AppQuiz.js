/* js/app-quiz.js — bootstraps 測驗中心 inside the shared AppShell.

   Sprint 6.8 EO-S6.8-001 (Task 001/002, AI Learning Flow): reads
   optional ?mode=practice&materialId=... query params so a real link
   from Summary Detail's "開始 AI 練習" lands directly on Practice Mode
   for that material, instead of always defaulting to Exam Mode. With
   no query params (every existing entry point, e.g. Sidebar/Bottom Nav),
   behavior is unchanged — Exam Mode tab active, as before. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    /* Sprint v1.4 Module C: (re-)import any real Teaching Material
       Repository questions into QuestionRuntime before Quiz Center reads
       it — QuestionRuntime is memory-only (Sprint 4 design), so this
       must run on quiz.html itself, not just materials.html. No-ops
       when the Repository is empty. See
       js/runtime/TeachingMaterialLoader.js. */
    if (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.initialize === "function") {
      AHS.TeachingMaterialLoader.initialize();
    }

    var shell = AHS.AppShell.create(AHS.AppConfig, {
      active: "quiz",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });

    AHS.UI.mount(app, shell.root);

    var params = new URLSearchParams(window.location.search);
    var mode = params.get("mode") || undefined;
    var materialId = params.get("materialId") || undefined;

    shell.main.appendChild(AHS.QuizCenter.create(undefined, mode, materialId));
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
