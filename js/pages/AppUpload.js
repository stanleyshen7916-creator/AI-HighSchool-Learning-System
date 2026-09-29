/* js/pages/AppUpload.js — 2026-09-29 教材上傳 (upload.html) bootstrap.
   Admin-only: the sidebar entry is only shown to ADMIN (AppShell), and
   the page itself renders only a notice for anyone else — the same role
   field AHS.MaterialCenter's review queue already uses
   (AHS.WorkspaceData.students[].role).

   Unlike the other pages this one does not re-render on
   "ahs:repository-pulled": it holds a long-running form (pasted drafts,
   a Council job being polled) that a re-mount would wipe. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function isAdmin() {
    var current = AHS.WorkspaceRuntime && AHS.WorkspaceRuntime.getCurrent();
    if (!current) { return false; }
    var student = AHS.WorkspaceRuntime.findStudent(current.studentId);
    return !!(student && student.role === "ADMIN");
  }

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }
    var shell = AHS.AppShell.create(AHS.AppConfig, { active: "upload" });
    if (!shell) { return; } /* not logged in — AppShell already redirected to login.html */
    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.CouncilUpload.create({ client: AHS.CouncilEngineClient, isAdmin: isAdmin() }));
  }

  function coreReady() {
    return !!(window.AHS && AHS.UI && typeof AHS.UI.el === "function" &&
              AHS.AppShell && typeof AHS.AppShell.create === "function" &&
              AHS.CouncilUpload && AHS.CouncilEngineClient);
  }

  function guardedInit() {
    if (coreReady()) { init(); return; }
    var app = document.getElementById("app");
    if (app) { app.textContent = "系統資源載入失敗，請重新整理。"; }
    if (window.console && console.warn) { console.warn("AHS core not ready — upload page mount aborted."); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guardedInit);
  } else {
    guardedInit();
  }
})();
