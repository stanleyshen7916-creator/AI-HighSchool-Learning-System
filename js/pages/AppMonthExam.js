/* js/pages/AppMonthExam.js — bootstraps 模擬月考專區 inside the shared AppShell
   (2026-10-05). Same initialization gate as the other pages. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }
    var shell = AHS.AppShell.create(AHS.AppConfig, { active: "monthexam", onNavigate: function () {} });
    if (!shell) { return; } /* not logged in — AppShell already redirected to login.html */
    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.MonthExam.create());
  }

  function coreReady() {
    return !!(window.AHS && AHS.UI && typeof AHS.UI.el === "function" &&
              AHS.AppShell && typeof AHS.AppShell.create === "function" && AHS.MonthExamRuntime);
  }

  function guardedInit() {
    if (coreReady()) { init(); return; }
    var app = document.getElementById("app");
    if (app) { app.textContent = "系統資源載入失敗，請重新整理。"; }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guardedInit);
  } else {
    guardedInit();
  }
})();
