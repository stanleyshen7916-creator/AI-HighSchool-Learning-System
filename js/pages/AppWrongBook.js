/* js/pages/AppWrongBook.js — bootstraps 知識弱點 inside the shared AppShell.

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

  /* ---- Statistics（EO-S7.0-002：全部即時計算，永不儲存） --------------
     Sprint AI-124 PAT-03 (Project Owner PAT FAIL — "Knowledge Weakness
     Statistics 仍為 0，但今日待複習已為 1，Result 已有資料"): real Root
     Cause, found by tracing which Runtime each number on this page
     actually reads. This card used to read exclusively from
     AHS.WrongBookSession.statistics() — the legacy v1.0 Wrong Book store,
     written only by the old WrongBookGenerator/LearningQuestionSession
     Practice pipeline. But every REAL grading path this app now actually
     uses — Formal Exam (AHS.ExamRuntime -> AHS.AutoGrader ->
     AHS.WrongBookRuntime.sync()) and the AI-122+ "real Practice" flow
     (js/components/QuizCenter.js's wrongBookHook()/syncRealPracticeAnswer(),
     also calling AHS.WrongBookRuntime.sync() directly) — writes to
     AHS.WrongBookRuntime instead, never AHS.WrongBookSession. So this
     card stayed genuinely stuck at 0 for any real completion through
     today's real pipeline, while "今日待複習" (AHS.StatisticsRuntime.
     dueForReview(), reading AHS.WrongBookRuntime — the SAME real Runtime
     the rest of this page's own wb-summary card already reads) correctly
     showed real data — two disconnected stores, not a Runtime bug.

     Fix scope, per this PAT's own LOCK ("不得修改 Runtime，只修正同步
     流程"): this file is a page bootstrap/View file, not a Runtime —
     AHS.WrongBookRuntime.js itself is untouched, only WHICH store this
     card reads from changes, via that Runtime's own existing, unmodified
     list()/weaknessState() public API (same one questionRow()/
     renderDetail() in js/components/WrongBook.js already read).
     AHS.WrongBookRuntime's own real weaknessState() has exactly 4 states
     (NEW/LEARNING/MASTERED/ARCHIVED) — no "Reviewing" tier exists in the
     real data, so that legacy stat is honestly dropped rather than
     mapped to something that doesn't exist ("不得偽造"). */
  var STAT_DEFS = [
    { key: "totalWrongCount", label: "錯題總數" },
    { key: "active", label: "進行中" },
    { key: "archived", label: "已封存" },
    { key: "new", label: "新錯題" },
    { key: "learning", label: "學習中" },
    { key: "mastered", label: "已精熟" }
  ];

  function realWrongBookStats() {
    var items = AHS.WrongBookRuntime.list();
    var counts = { totalWrongCount: items.length, active: 0, archived: 0, new: 0, learning: 0, mastered: 0 };
    items.forEach(function (i) {
      if (i.archived) { counts.archived += 1; } else { counts.active += 1; }
      if (i.weaknessState === "NEW") { counts.new += 1; }
      else if (i.weaknessState === "LEARNING") { counts.learning += 1; }
      else if (i.weaknessState === "MASTERED") { counts.mastered += 1; }
    });
    return counts;
  }

  function buildSessionStatsCard() {
    var el = AHS.UI.el;
    if (!AHS.WrongBookRuntime || typeof AHS.WrongBookRuntime.list !== "function") { return null; }
    var counts = realWrongBookStats();
    return el("section", { class: "card wb-live-stats", "aria-label": "錯題即時統計" }, [
      el("h3", { class: "wb-live-stats__title", text: "錯題即時統計" }),
      el("div", { class: "wb-live-stats__grid" }, STAT_DEFS.map(function (d) {
        return el("div", { class: "wb-live-stats__item" }, [
          el("strong", { class: "wb-live-stats__value", text: String(counts[d.key] || 0) }),
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

    if (!shell) { return; } /* Sprint AI-119: not logged in — AppShell already redirected to login.html */
    AHS.UI.mount(app, shell.root);

    /* Platform Refactor Master (PAT 8/9/10): same real Tutor Context
       首頁/AI Tutor already share (Sprint AI-111), reused verbatim —
       renders nothing when there is no real data yet. */
    var tip = AHS.TutorContextTip && AHS.TutorContextTip.create({ page: "wrongbook" });
    if (tip) { shell.main.appendChild(tip); }

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
