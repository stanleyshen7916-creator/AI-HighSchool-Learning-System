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

    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "quiz",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });

    AHS.UI.mount(app, shell.root);

    var params = new URLSearchParams(window.location.search);
    var mode = params.get("mode") || undefined;
    var materialId = params.get("materialId") || undefined;

    shell.main.appendChild(AHS.QuizCenter.create(undefined, mode, materialId));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
