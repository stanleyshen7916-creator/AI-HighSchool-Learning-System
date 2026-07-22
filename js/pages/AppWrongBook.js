/* js/pages/AppWrongBook.js — bootstraps 錯題本 inside the shared AppShell.

   EO-S7.0-002 · Wrong Book Runtime Integration: the Sprint-4 W004B
   Developer Seed block that used to live here has been REMOVED exactly
   as its own comment mandated ("REMOVE THIS BLOCK once Quiz →
   WrongBookRuntime integration is complete") — that integration is this
   EO. The Wrong Book page's data now comes exclusively from
   AHS.WrongBookSession (the v1.0 wrong-answer store, written only by
   the WrongBookGenerator Interface from real Practice submits), bridged
   into the Sprint-4 UI below. Zero Mock / Stub / Placeholder data. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  /* ---- WrongBookSession -> Sprint-4 UI bridge (read-only) -------------
     The Sprint-4 Wrong Book component renders from AHS.WrongBookRuntime.
     That LOCK Runtime is untouched — this bridge only calls its existing
     public sync() API (the same one AutoGrader.grade() uses) to mirror
     the REAL records held in AHS.WrongBookSession. Reconciliation is a
     deterministic delta: for each session record, sync() is invoked
     exactly (wrongCount − currentErrorCount) times, so repeat page loads
     never duplicate anything (WrongBookRuntime persists via the
     Adapter). Question text/options are resolved read-only from
     LearningQuestionSession — the pipeline's single question source —
     and the display title is parsed from the question's own reference
     string (《…》), never fabricated. */
  function displayTitleFor(question, wb) {
    var m = /《([^》]+)》/.exec(String((question && question.reference) || ""));
    if (m) { return m[1]; }
    return wb.chapter || wb.knowledgePoint || "AI 練習";
  }

  function bridgeSessionIntoSprint4Runtime() {
    var session = AHS.WrongBookSession, rt = AHS.WrongBookRuntime, lqs = AHS.LearningQuestionSession;
    if (!session || !rt || typeof rt.sync !== "function") { return; }

    var existingCounts = {};
    (typeof rt.list === "function" ? rt.list() : []).forEach(function (r) {
      existingCounts[r.questionId] = r.errorCount || 0;
    });

    session.list().forEach(function (wb) {
      var q = (lqs && typeof lqs.getById === "function") ? lqs.getById(wb.questionId) : null;
      var missing = wb.wrongCount - (existingCounts[wb.questionId] || 0);
      for (var i = 0; i < missing; i += 1) {
        rt.sync({
          subject: wb.subject,
          title: displayTitleFor(q, wb),
          chapter: wb.chapter || "",
          wrong: [{
            questionId: wb.questionId,
            knowledgePoint: wb.knowledgePoint,
            text: (q && q.question) || "",
            options: (q && q.options) || [],
            yourAnswer: Array.isArray(wb.userAnswer) ? wb.userAnswer.join("、") : String(wb.userAnswer),
            correctAnswer: Array.isArray(wb.correctAnswer) ? wb.correctAnswer.join("、") : String(wb.correctAnswer),
            explanation: (typeof wb.explanation === "string") ? wb.explanation : ""
          }]
        });
      }
    });
  }

  /* ---- Statistics（EO-S7.0-002：全部即時計算，永不儲存） -------------- */
  var STAT_DEFS = [
    { key: "totalWrongCount", label: "Total Wrong", from: "root" },
    { key: "active", label: "Active", from: "byStatus" },
    { key: "archived", label: "Archived", from: "byStatus" },
    { key: "new", label: "New", from: "byMastery" },
    { key: "learning", label: "Learning", from: "byMastery" },
    { key: "reviewing", label: "Reviewing", from: "byMastery" },
    { key: "mastered", label: "Mastered", from: "byMastery" }
  ];

  function buildSessionStatsCard() {
    var el = AHS.UI.el;
    var session = AHS.WrongBookSession;
    if (!session || typeof session.statistics !== "function") { return null; }
    var s = session.statistics();
    return el("section", { class: "card wb-live-stats", "aria-label": "錯題即時統計" }, [
      el("h3", { class: "wb-live-stats__title", text: "錯題即時統計" }),
      el("div", { class: "wb-live-stats__grid" }, STAT_DEFS.map(function (d) {
        var v = d.from === "root" ? (s[d.key] || 0)
          : ((d.from === "byStatus" ? s.byStatus : s.byMastery)[d.key] || 0);
        return el("div", { class: "wb-live-stats__item" }, [
          el("strong", { class: "wb-live-stats__value", text: String(v) }),
          el("span", { class: "wb-live-stats__label", text: d.label })
        ]);
      }))
    ]);
  }

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    bridgeSessionIntoSprint4Runtime();

    var shell = AHS.AppShell.create(AHS.AppConfig, {
      active: "wrongbook",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });

    AHS.UI.mount(app, shell.root);
    var stats = buildSessionStatsCard();
    if (stats) { shell.main.appendChild(stats); }
    shell.main.appendChild(AHS.WrongBook.create());
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
