/* js/app-dashboard.js — bootstraps 學習儀表板 inside the shared AppShell.

   Sprint AI-020 · Dashboard Production Integration: builds a real model
   from AHS.StatisticsRuntime (Exam Mode, LOCK, unmodified) and Sprint
   AI-019's AHS.LearningHistoryModel (Practice Mode Projection, LOCK,
   unmodified) — both consumed via their existing, unmodified Public
   API only ("Dashboard shall consume the existing Projection without
   additional data transformation beyond Blueprint-defined
   integration"). AHS.Dashboard.create(model)'s own rendering decides,
   per section, whether real data exists (Sprint AI-020's other change);
   this file only assembles the model, it invents nothing. When neither
   Runtime has any real record yet, no model is built at all and the
   page falls through to its existing, unchanged full-page Empty State —
   zero behavior change for a first-time session. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function buildStats() {
    var stats = [];
    if (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.refresh === "function") {
      stats = stats.concat(AHS.StatisticsRuntime.refresh().stats);
    }
    if (AHS.LearningHistoryModel && typeof AHS.LearningHistoryModel.refresh === "function") {
      stats = stats.concat(AHS.LearningHistoryModel.refresh().stats);
    }
    return stats;
  }

  function buildSubjectStatus() {
    if (!AHS.LearningHistoryModel || typeof AHS.LearningHistoryModel.masteryRateBySubject !== "function") {
      return [];
    }
    /* Practice Mode mastery rate only (Sprint AI-019's real data) — not
       combined with Exam Mode's own accuracyBySubject() here, since the
       two are different metrics (accuracy vs. mastery rate) and this
       component has one percent slot per subject; conflating them would
       be an invented derivation this Sprint's Reuse Policy does not
       authorize ("without additional data transformation beyond
       Blueprint-defined integration"). */
    return AHS.LearningHistoryModel.masteryRateBySubject();
  }

  function hasAnyRealData() {
    var hasExamHistory = !!(AHS.HistoryRuntime && typeof AHS.HistoryRuntime.count === "function" && AHS.HistoryRuntime.count() > 0);
    var hasPracticeHistory = !!(AHS.WrongBookSession && typeof AHS.WrongBookSession.count === "function" && AHS.WrongBookSession.count() > 0);
    return hasExamHistory || hasPracticeHistory;
  }

  function buildModel() {
    if (!hasAnyRealData()) { return null; }
    var stats = buildStats();
    var subjectStatus = buildSubjectStatus();
    return {
      title: "學習儀表板",
      subtitle: "掌握你的學習全貌，持續進步",
      stats: stats.length ? stats : null,
      subjectStatus: subjectStatus.length ? subjectStatus : null
      /* trend / timeDist / progress / knowledge / todayTasks / aiTips
         intentionally omitted — no Runtime in this repository produces
         that data (Sprint AI-020 Repository evidence); AHS.Dashboard's
         own create(model) renders an honest per-section Empty State for
         each, never a fabricated value. */
    };
  }

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }
    var shell = AHS.AppShell.create(AHS.AppConfig, {
      active: "dashboard",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });
    if (!shell) { return; } /* Sprint AI-119: not logged in — AppShell already redirected to login.html */
    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.Dashboard.create(buildModel()));
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
